// @ts-nocheck
// Pons V2 on Robinhood Chain (chain id 4663).
// TokenLaunched is the factory event from the Pons V2 docs. There is no Pons API.
// The official Robinhood RPC accepts eth_getLogs ranges up to 10,000,000 blocks;
// a smaller chunk is used and shrunk again on range/timeout/rate errors.
//
// Factory deployment block: 26841846.
// Verified read-only against https://rpc.mainnet.chain.robinhood.com on 2026-10-15:
//   - eth_chainId = 0x1237 (4663), head was 89134050
//   - eth_getTransactionReceipt(0x3817f297aa7c2ef78789bffac57491ceedc218fef962d47ed36c272699deddeb)
//     status 0x1, to=null, contractAddress=0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e, block 26841846
//   - eth_getLogs TokenLaunched over [1, 10_000_000], [10_000_001, 20_000_000],
//     [20_000_001, 26_841_845], and [26_841_846, 27_027_320] returned 0 logs
//   - binary search of TokenLaunched in [26_841_846, 26_841_846+200_000] lands on
//     the first launch at block 27_027_321
// Historical eth_getCode is NOT available on this RPC ("historical state ... is not available"),
// so the deployment block is the creation receipt, corroborated by eth_getLogs
// (no TokenLaunched before 27,027,321). Indexing starts at deployment, not at head-90d.
//
// Cursor semantics:
//   liveCursor   = highest block fully decoded and stored. Never the absolute head.
//   historyFloor = exclusive lower bound of the scanned range (next back-chunk ends here).
//   Scanned range is (historyFloor, liveCursor]. A persisted cursor is walked in `chunk`
//   steps. It is never replaced with head, head-N, or head-90d.
//   PONS_CONFIRMATIONS (default 12, ~1.2s at BLOCK_MS=101) keeps the durable forward
//   cursor at least this many blocks behind head so a short reorg cannot skip a launch.
// The cursor is written atomically only after the chunk is decoded into the book.
// The setInterval timer is only a long-lived accelerator. Discovery awaits catchUp().
import fs from "fs";
import os from "os";
import path from "path";
import { ethers } from "ethers";
import {
  CURVE_BUY_TOPIC,
  CURVE_SELL_TOPIC,
  applyMarketPatch,
  createTradeBook,
  metricsFromState,
  noteCurveTrade,
  quotePerTokenFromReserves,
} from "./pons-market.js";

const CHAIN_ID = 4663;
const FACTORY = "0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e";
// See the header. Do not "correct" this to head - 90 days or head - 1200.
const FACTORY_DEPLOY_BLOCK = 26841846;
const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const MULTICALL = "0xcA11bde05977b3631167028862bE2a173976CA11";
const TOPIC_LAUNCHED = ethers.id("TokenLaunched(address,address,address,address,uint256,uint256)");
const TOPIC_SWEPT = ethers.id("LaunchSwept(address,uint256,uint256)");
const TOPIC_GRADUATED = ethers.id("PoolGraduated(address,uint256,uint256,uint256)");
const BOOK_PATH = path.join(os.tmpdir(), "dexhunter", "pons-book.json");
const MAX_BOOK_TOKENS = 4000;
const MAX_SEEN_LOGS = 8000;
const BOOK_PARSE_LIMIT = 8 * 1024 * 1024;
const BLOCK_MS = 101;
const DEFAULT_CONFIRMATIONS = 12;
const DEFAULT_MAX_CHUNK = 400000;
const DEFAULT_MIN_CHUNK = 1000;
const TRADE_DAY_BLOCKS = Math.ceil((24 * 60 * 60 * 1000) / BLOCK_MS);
const TRADE_SPAN = 20000;

const launchInterface = new ethers.Interface([
  "event TokenLaunched(address indexed token, address indexed curve, address indexed deployer, address pairToken, uint256 launchConfigId, uint256 graduationThreshold)",
  "event LaunchSwept(address indexed token, uint256 quoteOut, uint256 tokenOut)",
  "event PoolGraduated(address indexed token, uint256 positionId, uint256 tokenAmount, uint256 pairTokenAmount)",
]);
const ercIface = new ethers.Interface([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
]);
const infoIface = new ethers.Interface([
  "function getTokenInfo() view returns (address tokenDeployer, string tokenLogo, string tokenDescription, (string twitter, string telegram, string discord, string website, string farcaster) tokenSocials)",
]);
const curveIface = new ethers.Interface([
  "function getReserves() view returns (uint256 quoteReserve, uint256 tokenReserve)",
  "function realQuoteReserve() view returns (uint256)",
  "function graduationThreshold() view returns (uint256)",
  "function graduated() view returns (bool)",
]);
const factoryIface = new ethers.Interface([
  "function getLaunchedToken(address token) view returns ((address token, address curve, address deployer, address creatorFeeRecipient, address pairToken, uint256 graduationThreshold, uint24 poolFee, int24 tickSpacing, uint16 creatorTaxBps, bool buybackEnabled, uint8 phase, uint256 sweptQuote, uint256 sweptTokens, uint256 sweptAt, bool exists))",
]);
const multiIface = new ethers.Interface([
  "function aggregate3((address target, bool allowFailure, bytes callData)[] calls) payable returns ((bool success, bytes returnData)[] returnData)",
]);

export function decodePonsLog(log) {
  try {
    const parsed = launchInterface.parseLog(log);
    if (!parsed) return null;
    return { name: parsed.name, args: parsed.args };
  } catch {
    return null;
  }
}

export function resolveConfirmations(override) {
  const pick = (value) => {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n > 10000) return null;
    return n;
  };
  if (override != null && override !== "") {
    const chosen = pick(override);
    if (chosen != null) return chosen;
  }
  const fromEnv = pick(process.env.PONS_CONFIRMATIONS);
  // Default 12 trails head by ~1.2s so the saved cursor is not the reorg tip.
  return fromEnv == null ? DEFAULT_CONFIRMATIONS : fromEnv;
}

function finiteBlock(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.floor(n);
}

function headerNumber(text, key) {
  const match = text.match(new RegExp(`"${key}"\\s*:\\s*(-?\\d+)`));
  return match ? Number(match[1]) : null;
}

// Stream the newest token objects out of a book that was saved newest-first.
// Never JSON.parse the whole file: that is what exhausted memory.
function shrinkOversizedBook(file, maxTokens) {
  let size = 0;
  try {
    size = fs.statSync(file).size;
  } catch {
    return;
  }
  if (size <= BOOK_PARSE_LIMIT) return;

  const head = Buffer.alloc(4096);
  const headFd = fs.openSync(file, "r");
  let cursors = { historyFloor: null, liveCursor: null, chunk: null, startBlock: null };
  try {
    const headN = fs.readSync(headFd, head, 0, head.length, 0);
    const headText = head.toString("utf8", 0, headN);
    cursors = {
      historyFloor: headerNumber(headText, "historyFloor"),
      liveCursor: headerNumber(headText, "liveCursor"),
      chunk: headerNumber(headText, "chunk"),
      startBlock: headerNumber(headText, "startBlock"),
    };
  } finally {
    fs.closeSync(headFd);
  }

  const tokens = [];
  const fd = fs.openSync(file, "r");
  try {
    const buf = Buffer.alloc(1024 * 1024);
    let pending = "";
    let found = false;
    let stop = false;
    let obj = "";
    let depth = 0;
    let inStr = false;
    let esc = false;
    while (tokens.length < maxTokens && !stop) {
      const n = fs.readSync(fd, buf, 0, buf.length, null);
      if (n <= 0) break;
      const text = pending + buf.toString("utf8", 0, n);
      pending = "";
      let i = 0;
      if (!found) {
        const idx = text.indexOf('"tokens":[');
        if (idx < 0) {
          pending = text.slice(-16);
          continue;
        }
        found = true;
        i = idx + '"tokens":['.length;
      }
      for (; i < text.length && tokens.length < maxTokens; i++) {
        const c = text[i];
        if (inStr) {
          obj += c;
          if (obj.length > 2_000_000) {
            stop = true;
            break;
          }
          if (esc) esc = false;
          else if (c === "\\") esc = true;
          else if (c === '"') inStr = false;
          continue;
        }
        if (depth === 0) {
          if (c === "{") {
            depth = 1;
            obj = "{";
          } else if (c === "]") {
            i = text.length;
            break;
          }
          continue;
        }
        obj += c;
        if (obj.length > 2_000_000) {
          // A single launch row is a few kilobytes. A longer run means the
          // scan lost a boundary; keep the rows already parsed.
          stop = true;
          break;
        }
        if (c === '"') inStr = true;
        else if (c === "{") depth += 1;
        else if (c === "}") {
          depth -= 1;
          if (depth === 0) {
            try {
              tokens.push(JSON.parse(obj));
            } catch {
              // Ignore one bad object and keep the cursors.
            }
            obj = "";
          }
        }
      }
    }
  } finally {
    fs.closeSync(fd);
  }

  const slim = {
    version: 2,
    chainId: 4663,
    startBlock: cursors.startBlock,
    historyFloor: cursors.historyFloor,
    liveCursor: cursors.liveCursor,
    chunk: cursors.chunk,
    confirmations: 12,
    tokens,
    seen: [],
  };
  const tmp = `${file}.slim.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(slim));
  fs.renameSync(tmp, file);
  console.log(`[Pons] shrunk book from ${size} bytes to ${tokens.length} newest launches`);
}

function rpcShouldShrink(err) {
  const msg = String(err?.shortMessage || err?.error?.message || err?.message || err);
  return /exceeds limit|too large|too many|timeout|timed out|rate.?limit|\b429\b|retry limit|more than|query spans|are allowed|block range|response size|limit exceeded/i.test(msg);
}

function fileStore(file) {
  return {
    load() {
      try {
        if (!fs.existsSync(file)) return null;
        // A full-history book is hundreds of megabytes and will OOM the process
        // on JSON.parse. Keep the cursors and the newest launches only.
        shrinkOversizedBook(file, MAX_BOOK_TOKENS);
        return JSON.parse(fs.readFileSync(file, "utf8"));
      } catch (err) {
        console.warn("[Pons] book load skipped:", err?.message || err);
        return null;
      }
    },
    save(book) {
      const dir = path.dirname(file);
      fs.mkdirSync(dir, { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      const json = JSON.stringify(book, (_, value) => typeof value === "bigint" ? value.toString() : value);
      fs.writeFileSync(tmp, json);
      fs.renameSync(tmp, file);
    },
  };
}

function httpUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (value.startsWith("ipfs://")) {
    const cid = value.slice(7).replace(/^\/+/, "");
    return /^[a-zA-Z0-9]+/.test(cid) ? `https://ipfs.io/ipfs/${cid}` : "";
  }
  return /^https?:\/\//i.test(value) ? value : "";
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then((value) => {
      clearTimeout(timer);
      resolve(value);
    }, (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

class PonsIndexer {
  constructor(options = {}) {
    this.launches = new Map();
    this.callbacks = [];
    this.provider = options.provider || null;
    this.ownsProvider = !options.provider;
    this.timer = null;
    this.chain = Promise.resolve();
    this.liveCursor = null;
    this.historyFloor = null;
    this.startBlock = finiteBlock(options.startBlock) ?? FACTORY_DEPLOY_BLOCK;
    this.confirmations = resolveConfirmations(options.confirmations);
    this.maxChunk = finiteBlock(options.maxChunk) ?? DEFAULT_MAX_CHUNK;
    this.minChunk = Math.max(1, finiteBlock(options.minChunk) ?? DEFAULT_MIN_CHUNK);
    this.chunk = Math.min(this.maxChunk, Math.max(this.minChunk, finiteBlock(options.chunk) ?? this.maxChunk));
    this.headSample = { block: 0, timeMs: 0 };
    this.enrichQueue = [];
    this.queued = new Set();
    this.quoteMeta = new Map();
    this.ethUsd = 0;
    this.ethAt = 0;
    this.dirty = false;
    this.lastSave = 0;
    this.backoffUntil = 0;
    this.seenLogs = new Set();
    this.tradeBook = createTradeBook();
    this.tradeFloors = new Map();
    this.tradeChunk = TRADE_SPAN;
    this.scanTrades = options.scanTrades === true;
    this.preferBack = false;
    this.rpcTimeoutMs = finiteBlock(options.rpcTimeoutMs) ?? 12000;
    this.maxBook = Math.max(1, finiteBlock(options.maxBook) ?? MAX_BOOK_TOKENS);
    this.loggedBoot = false;
    this.rpcDeadline = 0;
    const bookFile = options.bookPath || process.env.PONS_BOOK_PATH || BOOK_PATH;
    this.store = options.store || fileStore(bookFile);
    if (options.book) this.restoreBook(options.book);
    else this.loadBook();
  }

  onNewLaunch(cb) {
    this.callbacks.push(cb);
  }

  getTokens() {
    return Array.from(this.launches.values()).sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0));
  }

  health() {
    const safe = this.headSample.block ? Math.max(0, this.headSample.block - this.confirmations) : null;
    return {
      chainId: CHAIN_ID,
      startBlock: this.startBlock,
      liveCursor: this.liveCursor,
      historyFloor: this.historyFloor,
      safeHead: safe,
      confirmations: this.confirmations,
      chunk: this.chunk,
      tokens: this.launches.size,
      historyComplete: this.historyFloor != null && this.historyFloor < this.startBlock,
      forwardComplete: safe != null && this.liveCursor != null && this.liveCursor >= safe,
    };
  }

  // New tokens only. Enrichment and replayed logs must not notify again.
  publish(token) {
    const key = token.baseToken.address.toLowerCase();
    const prev = this.launches.get(key);
    const merged = prev ? { ...prev, ...token, baseToken: { ...prev.baseToken, ...token.baseToken } } : token;
    if (prev?.baseToken?.name && !token.baseToken?.name) merged.baseToken.name = prev.baseToken.name;
    if (prev?.baseToken?.symbol && !token.baseToken?.symbol) merged.baseToken.symbol = prev.baseToken.symbol;
    if (!merged.pairCreatedAt && prev?.pairCreatedAt) merged.pairCreatedAt = prev.pairCreatedAt;
    if (prev?.info?.imageUrl && !token.info?.imageUrl) merged.info = { ...token.info, ...prev.info, imageUrl: prev.info.imageUrl };
    if (prev) {
      // A replayed TokenLaunched row always carries volumeComplete:false and no price.
      // That must not erase a metric a later curve read already verified.
      if (!(Number(token.priceUsd) > 0) && Number(prev.priceUsd) > 0) merged.priceUsd = prev.priceUsd;
      if (!(Number(token.marketCap) > 0) && Number(prev.marketCap) > 0) {
        merged.marketCap = prev.marketCap;
        merged.fdv = prev.fdv ?? prev.marketCap;
        merged.marketCapBasis = prev.marketCapBasis;
        merged.marketCapMethod = prev.marketCapMethod;
      }
      if (token.volumeComplete !== true && prev.volumeComplete === true) {
        merged.volumeComplete = prev.volumeComplete;
        merged.volume = prev.volume;
        merged.totalVolume24h = prev.totalVolume24h;
      }
      if (!(Number(token.liquidity?.usd) >= 0) && prev.liquidity) {
        merged.liquidity = prev.liquidity;
        merged.totalLiquidityUsd = prev.totalLiquidityUsd;
      }
      if (prev.ponsPhase != null && token.ponsPhase == null) {
        merged.ponsPhase = prev.ponsPhase;
        merged.marketStage = prev.marketStage;
        merged.isBondingCurve = prev.isBondingCurve;
        merged.isGraduated = prev.isGraduated;
        if (prev.bondingProgress != null) merged.bondingProgress = prev.bondingProgress;
      }
    }
    this.launches.set(key, merged);
    this.dirty = true;
    if (this.launches.size > this.maxBook) this.trimBook();
    if (!this.launches.has(key)) return merged;
    if (prev) return merged;
    for (const cb of this.callbacks) {
      try { cb(merged); } catch { /* one listener must not stop the scan */ }
    }
    return merged;
  }

  trimBook() {
    if (this.launches.size > this.maxBook) {
      const ranked = [...this.launches.entries()].sort(
        (a, b) => (b[1].pairCreatedAt || 0) - (a[1].pairCreatedAt || 0)
      );
      this.launches = new Map(ranked.slice(0, this.maxBook));
      const keep = new Set(this.launches.keys());
      this.enrichQueue = this.enrichQueue.filter((id) => keep.has(id));
      for (const id of this.queued) {
        if (!keep.has(id)) this.queued.delete(id);
      }
      this.dirty = true;
    }
    if (this.seenLogs.size > MAX_SEEN_LOGS) {
      const drop = this.seenLogs.size - MAX_SEEN_LOGS;
      let removed = 0;
      for (const id of this.seenLogs) {
        this.seenLogs.delete(id);
        if (++removed >= drop) break;
      }
    }
  }

  enqueue(task) {
    const run = this.chain.then(task, task);
    this.chain = run.then(() => {}, () => {});
    return run;
  }

  async start() {
    if (this.timer) return;
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID, { staticNetwork: true, batchMaxCount: 1 });
      this.ownsProvider = true;
    }
    console.log(`[Pons] Reading Pons V2 factory on Robinhood Chain 4663 from block ${this.startBlock}`);
    // Long-lived accelerator only. Serverless requests must await catchUp().
    this.timer = setInterval(() => {
      this.tick().catch((err) => console.warn("[Pons] tick:", err?.shortMessage || err?.message || err));
    }, 800);
    this.tick().catch(() => {});
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.saveBook(true);
  }

  tick() {
    if (Date.now() < this.backoffUntil) return Promise.resolve(null);
    return this.enqueue(() => this.runTick());
  }

  async runTick() {
    this.rpcDeadline = 0;
    const step = await this.scanOneChunk();
    if (step?.error) this.backoffUntil = Date.now() + 2000;
    if (this.enrichQueue.length && typeof this.provider?.call === "function") {
      try {
        if (this.ownsProvider && !(this.ethUsd > 0)) await this.refreshEth();
        await this.enrichSome();
      } catch { /* enrichSome requeues the batch */ }
    }
    if ((this.ownsProvider || this.scanTrades) && typeof this.provider?.send === "function") {
      try { await this.pullTradeChunk(); } catch { /* volume stays unknown until a later tick */ }
    }
    if (this.ownsProvider && (!this.ethUsd || Date.now() - this.ethAt > 120000)) void this.refreshEth();
    if (this.dirty) this.saveBook(false);
    return step;
  }

  // Bounded progress for one discovery request. Does not reset a stale cursor.
  catchUp({ maxChunks = 4, maxMs = 1500 } = {}) {
    return this.enqueue(() => this.runCatchUp({ maxChunks, maxMs }));
  }

  async runCatchUp({ maxChunks = 4, maxMs = 1500 } = {}) {
    const started = Date.now();
    const limit = Number.isFinite(Number(maxChunks)) ? Number(maxChunks) : 4;
    const budget = Number.isFinite(Number(maxMs)) ? Number(maxMs) : 1500;
    const deadline = started + Math.max(0, budget);
    this.rpcDeadline = deadline;
    let chunks = 0;
    let done = false;
    while (chunks < limit && Date.now() < deadline) {
      const step = await this.scanOneChunk();
      chunks += 1;
      if (step?.done) {
        done = true;
        break;
      }
      if (!step?.pulled && !step?.error) break;
    }
    if (this.enrichQueue.length && typeof this.provider?.call === "function" && Date.now() < deadline) {
      try {
        if (this.ownsProvider && !(this.ethUsd > 0)) await this.refreshEth();
        await this.enrichSome();
      } catch { /* indexed launches still stand */ }
    }
    if ((this.ownsProvider || this.scanTrades) && typeof this.provider?.send === "function" && Date.now() < deadline) {
      try { await this.pullTradeChunk(); } catch { /* price can publish before volume is covered */ }
    }
    return { ...this.health(), chunks, done };
  }

  rpcTimeout(cap) {
    if (!this.rpcDeadline) return cap;
    return Math.min(cap, this.rpcDeadline - Date.now());
  }

  async readHead() {
    if (!this.provider) throw new Error("Pons provider is not set");
    const head = await withTimeout(Promise.resolve(this.provider.getBlockNumber()), this.rpcTimeout(8000));
    const block = Number(head);
    if (!Number.isFinite(block)) throw new Error("Pons head is not a block number");
    return block;
  }

  async sampleHead(head) {
    if (this.headSample.block && head - this.headSample.block <= 2000) return;
    if (typeof this.provider.getBlock !== "function") {
      this.headSample = { block: head, timeMs: this.headSample.timeMs || Date.now() };
      return;
    }
    try {
      const block = await withTimeout(Promise.resolve(this.provider.getBlock(head)), 8000);
      if (block?.timestamp != null) {
        this.headSample = { block: head, timeMs: Number(block.timestamp) * 1000 };
        return;
      }
    } catch {
      // Block time is only a display estimate.
    }
    this.headSample = { block: head, timeMs: this.headSample.timeMs || Date.now() };
  }

  async scanOneChunk() {
    const head = await this.readHead();
    await this.sampleHead(head);
    const safe = Math.max(0, head - this.confirmations);
    const hadCursor = this.liveCursor != null || this.historyFloor != null;
    let cursor = this.liveCursor;
    let floor = this.historyFloor;
    if (!hadCursor) {
      // Anchor at the confirmed tip. Do not commit until a chunk is stored,
      // and do not snap a later loaded cursor up to this value.
      cursor = safe;
      floor = safe;
    } else if (cursor == null) {
      cursor = floor;
    } else if (floor == null) {
      floor = cursor;
    }
    if (this.ownsProvider && !this.loggedBoot) {
      this.loggedBoot = true;
      console.log(`[Pons] book=${this.launches.size} cursor=${cursor} floor=${floor} backfill down to ${this.startBlock} (safe head ${safe})`);
    }
    const needsForward = cursor < safe;
    const needsBack = floor > this.startBlock;
    if (!needsForward && !needsBack) {
      if (!hadCursor) {
        this.liveCursor = cursor;
        this.historyFloor = this.startBlock - 1;
        this.saveBook(true);
      }
      return { done: true, pulled: false };
    }
    // One chunk per call. When both directions are open, alternate so a stale
    // cursor walks forward and history walks back. Never jump either one to head-N.
    const goForward = needsForward && (!needsBack || !this.preferBack);
    if (goForward) {
      const got = await this.pull(cursor + 1, safe, "forward");
      if (got == null) return { error: true, pulled: false, dir: "forward" };
      this.liveCursor = got.end;
      if (this.historyFloor == null) this.historyFloor = floor;
      this.preferBack = true;
      this.saveBook(true);
      return { done: false, pulled: true, dir: "forward" };
    }
    const got = await this.pull(this.startBlock, floor, "back");
    if (got == null) return { error: true, pulled: false, dir: "back" };
    this.historyFloor = got.end - 1;
    if (this.liveCursor == null) this.liveCursor = cursor;
    this.preferBack = false;
    this.saveBook(true);
    const historyComplete = this.historyFloor < this.startBlock;
    const forwardComplete = (this.liveCursor ?? cursor) >= safe;
    return { done: historyComplete && forwardComplete, pulled: true, dir: "back" };
  }

  async pull(from, to, dir) {
    if (from > to) return { end: to };
    let attempts = 0;
    while (attempts < 4) {
      if (this.rpcDeadline && Date.now() >= this.rpcDeadline) return null;
      attempts += 1;
      const span = Math.min(this.chunk, to - from + 1);
      const start = dir === "back" ? to - span + 1 : from;
      const end = dir === "back" ? to : from + span - 1;
      const timeout = this.rpcTimeout(this.rpcTimeoutMs);
      if (timeout <= 0) return null;
      try {
        const logs = await withTimeout(Promise.resolve(this.provider.send("eth_getLogs", [{
          address: FACTORY,
          topics: [TOPIC_LAUNCHED],
          fromBlock: ethers.toQuantity(start),
          toBlock: ethers.toQuantity(end),
        }])), timeout);
        const list = Array.isArray(logs) ? logs : [];
        list.sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber) || Number(a.logIndex) - Number(b.logIndex));
        for (const log of list) this.applyLog(log);
        if (this.chunk < this.maxChunk) this.chunk = Math.min(this.maxChunk, Math.max(this.chunk + 1, Math.floor(this.chunk * 1.25)));
        return { end: dir === "back" ? start : end };
      } catch (err) {
        const msg = String(err?.shortMessage || err?.error?.message || err?.message || err);
        const outOfBudget = this.rpcDeadline && Date.now() >= this.rpcDeadline - 5;
        if (!outOfBudget && rpcShouldShrink(err) && this.chunk > this.minChunk) {
          this.chunk = Math.max(this.minChunk, Math.floor(this.chunk / 2));
          continue;
        }
        if (!this.lastPullWarn || Date.now() - this.lastPullWarn > 20000) {
          this.lastPullWarn = Date.now();
          if (this.ownsProvider && !outOfBudget) console.warn(`[Pons] logs ${start}-${end}:`, msg);
        }
        return null;
      }
    }
    return null;
  }

  blockTime(blockNumber) {
    if (!this.headSample.timeMs) return Date.now();
    const behind = Math.max(0, this.headSample.block - Number(blockNumber));
    return this.headSample.timeMs - behind * BLOCK_MS;
  }

  logKey(log) {
    const tx = String(log?.transactionHash || "").toLowerCase();
    if (!/^0x[0-9a-f]{64}$/.test(tx)) return "";
    const index = Number(log.logIndex ?? 0);
    if (!Number.isFinite(index)) return "";
    return `${CHAIN_ID}:${tx}:${index}`;
  }

  applyLog(log) {
    const id = this.logKey(log);
    if (id && this.seenLogs.has(id)) return;
    const parsed = decodePonsLog(log);
    if (!parsed) return;
    if (id) this.seenLogs.add(id);
    const when = this.blockTime(log.blockNumber);
    if (parsed.name === "TokenLaunched") {
      const token = ethers.getAddress(parsed.args.token);
      const curve = ethers.getAddress(parsed.args.curve);
      const pairToken = ethers.getAddress(parsed.args.pairToken);
      const native = pairToken === ethers.ZeroAddress;
      this.publish(this.row({
        token,
        curve,
        pairToken,
        native,
        creator: ethers.getAddress(parsed.args.deployer),
        when,
        configId: Number(parsed.args.launchConfigId),
        threshold: parsed.args.graduationThreshold.toString(),
        tx: log.transactionHash,
      }));
      const tokenId = token.toLowerCase();
      if (!this.queued.has(tokenId)) {
        this.queued.add(tokenId);
        this.enrichQueue.unshift(tokenId);
      }
      if (this.ownsProvider && this.launches.size < this.maxBook && this.launches.size % 500 === 0) {
        console.log(`[Pons] indexed ${this.launches.size} launches`);
      }
      return;
    }
    const token = String(parsed.args.token);
    const prev = this.launches.get(token.toLowerCase());
    if (!prev) return;
    if (parsed.name === "LaunchSwept" || parsed.name === "PoolGraduated") {
      this.publish({
        ...prev,
        isGraduated: parsed.name === "PoolGraduated" || prev.isGraduated,
        isBondingCurve: parsed.name === "PoolGraduated" ? false : prev.isBondingCurve,
        bondingProgress: 100,
        marketStage: parsed.name === "PoolGraduated" ? "graduated" : prev.marketStage,
        baseToken: prev.baseToken,
      });
    }
  }

  row(input) {
    return {
      chainId: "robinhood",
      dexId: "pons",
      primaryDex: "Pons V2",
      primaryDexLogo: "/pons.png",
      launchPlatform: "Pons V2",
      isPonsLaunch: true,
      isBondingCurve: true,
      discoveryMode: "onchain",
      pairAddress: input.curve,
      url: `https://ponsfamily.com/launchpad/${input.token}`,
      launchpadDetailUrl: `https://ponsfamily.com/launchpad/${input.token}`,
      baseToken: { address: input.token, name: input.name || "", symbol: input.symbol || "" },
      quoteToken: input.native
        ? { address: ethers.ZeroAddress, name: "Ether", symbol: "ETH" }
        : { address: input.pairToken, name: input.quoteName || "", symbol: input.quoteSymbol || "" },
      pairCreatedAt: input.when,
      creator: input.creator,
      txHash: input.tx,
      ponsCurve: input.curve,
      ponsPairToken: input.pairToken,
      ponsLaunchConfigId: input.configId,
      ponsGraduationThreshold: input.threshold,
      marketStage: input.graduated ? "graduated" : "bonding_curve",
      volumeComplete: false,
      sources: ["Pons V2"],
      dexes: ["Pons V2"],
      discoveredAt: Date.now(),
    };
  }

  async enrichSome() {
    const batch = [];
    while (this.enrichQueue.length && batch.length < 12) {
      const id = this.enrichQueue.shift();
      this.queued.delete(id);
      const rec = this.launches.get(id);
      if (rec) batch.push(rec);
    }
    if (!batch.length) return;
    try {
      await this.enrichBatch(batch);
    } catch (err) {
      for (const rec of batch) {
        const id = rec.baseToken.address.toLowerCase();
        if (!this.queued.has(id)) {
          this.queued.add(id);
          this.enrichQueue.push(id);
        }
      }
      throw err;
    }
  }

  async enrichBatch(batch) {
    const calls = [];
    const plan = [];
    const push = (target, iface, fn, rec, field, args = []) => {
      calls.push({ target, allowFailure: true, callData: iface.encodeFunctionData(fn, args) });
      plan.push({ rec, field, iface, fn });
    };
    for (const rec of batch) {
      const token = rec.baseToken.address;
      const curve = rec.ponsCurve;
      push(token, ercIface, "name", rec, "name");
      push(token, ercIface, "symbol", rec, "symbol");
      push(token, ercIface, "decimals", rec, "decimals");
      push(token, ercIface, "totalSupply", rec, "supply");
      push(token, infoIface, "getTokenInfo", rec, "info");
      if (curve) {
        push(curve, curveIface, "getReserves", rec, "reserves");
        push(curve, curveIface, "realQuoteReserve", rec, "raised");
        push(curve, curveIface, "graduationThreshold", rec, "threshold");
      }
      push(FACTORY, factoryIface, "getLaunchedToken", rec, "launch", [token]);
      if (rec.ponsPairToken && rec.ponsPairToken !== ethers.ZeroAddress) {
        push(rec.ponsPairToken, ercIface, "decimals", rec, "quoteDecimals");
        push(rec.ponsPairToken, ercIface, "symbol", rec, "quoteSymbol");
      }
    }
    const raw = await withTimeout(this.provider.call({
      to: MULTICALL,
      data: multiIface.encodeFunctionData("aggregate3", [calls]),
    }), 10000);
    const decoded = multiIface.decodeFunctionResult("aggregate3", raw)[0];
    for (let i = 0; i < plan.length; i++) {
      const row = decoded[i];
      const ok = row.success ?? row[0];
      const ret = row.returnData ?? row[1];
      if (!ok || !ret || ret === "0x") continue;
      const { rec, field, iface, fn } = plan[i];
      try {
        const value = iface.decodeFunctionResult(fn, ret);
        if (field === "name") rec.baseToken.name = String(value[0]).slice(0, 64);
        else if (field === "symbol") rec.baseToken.symbol = String(value[0]).slice(0, 16);
        else if (field === "decimals") rec.baseToken.decimals = Number(value[0]);
        else if (field === "supply") rec.totalSupply = value[0].toString();
        else if (field === "info") this.applyInfo(rec, value);
        else if (field === "reserves") rec._reserves = [value[0], value[1]];
        else if (field === "raised") rec._raised = value[0];
        else if (field === "threshold") rec.ponsGraduationThreshold = value[0].toString();
        else if (field === "launch") {
          const launch = value[0];
          const phase = Number(launch.phase ?? launch[10]);
          if (phase === 0 || phase === 1 || phase === 2 || phase === 3) rec._phase = phase;
        }
        else if (field === "quoteDecimals") rec._quoteDec = Number(value[0]);
        else if (field === "quoteSymbol") rec.quoteToken = { ...rec.quoteToken, symbol: String(value[0]).slice(0, 16) };
      } catch {
        // One bad field does not drop the token.
      }
    }
    for (const rec of batch) {
      this.applyMarket(rec);
      this.publish(rec);
    }
  }

  applyInfo(rec, value) {
    const logo = httpUrl(value[1]);
    const description = String(value[2] || "").slice(0, 280);
    const social = value[3] || [];
    const twitter = httpUrl(social[0] ?? social.twitter);
    const telegram = httpUrl(social[1] ?? social.telegram);
    const discord = httpUrl(social[2] ?? social.discord);
    const website = httpUrl(social[3] ?? social.website);
    const farcaster = httpUrl(social[4] ?? social.farcaster);
    const socials = [
      twitter && { type: "twitter", url: twitter },
      telegram && { type: "telegram", url: telegram },
      discord && { type: "discord", url: discord },
      farcaster && { type: "farcaster", url: farcaster },
    ].filter(Boolean);
    rec.info = {
      imageUrl: logo || rec.info?.imageUrl,
      description: description || rec.info?.description,
      websites: website ? [{ type: "website", url: website }] : rec.info?.websites,
      socials: socials.length ? socials : rec.info?.socials,
    };
    if (twitter) rec.twitter = twitter;
    if (telegram) rec.telegram = telegram;
    if (discord) rec.discord = discord;
    if (website) rec.website = website;
  }

  applyMarket(rec) {
    const native = String(rec.ponsPairToken || "").toLowerCase() === ethers.ZeroAddress.toLowerCase();
    const quoteDecimals = native ? 18 : (Number.isInteger(rec._quoteDec) ? rec._quoteDec : null);
    const tokenDecimals = Number.isInteger(rec.baseToken?.decimals) ? rec.baseToken.decimals : null;
    const phase = rec._phase === 0 || rec._phase === 1 || rec._phase === 2 || rec._phase === 3 ? rec._phase : null;
    const quotePerToken = rec._reserves
      ? quotePerTokenFromReserves({
        quoteReserve: rec._reserves[0],
        tokenReserve: rec._reserves[1],
        tokenDecimals,
        quoteDecimals,
      })
      : null;
    const supplyRaw = typeof rec.totalSupply === "string" && /^\d+$/.test(rec.totalSupply) ? BigInt(rec.totalSupply) : null;
    let totalSupplyWhole = null;
    if (supplyRaw != null && tokenDecimals != null) {
      const unit = 10n ** BigInt(tokenDecimals);
      totalSupplyWhole = Number(supplyRaw / unit) + Number(supplyRaw % unit) / Number(unit);
      if (!Number.isFinite(totalSupplyWhole) || totalSupplyWhole <= 0) totalSupplyWhole = null;
    }
    const curveKey = String(rec.ponsCurve || "").toLowerCase();
    const floor = this.tradeFloors.get(curveKey);
    const head = this.headSample.block || 0;
    const dayFloor = head > 0 ? Math.max(this.startBlock, head - this.confirmations - TRADE_DAY_BLOCKS) : null;
    const windowComplete = phase !== 2 && phase !== 3 && floor != null && dayFloor != null && floor <= dayFloor;
    const patch = metricsFromState({
      phase,
      quotePerToken: phase === 2 || phase === 3 ? null : quotePerToken,
      quoteIsNative: native,
      quoteDecimals,
      quoteSymbol: rec.quoteToken?.symbol || (native ? "ETH" : null),
      quoteAddress: rec.ponsPairToken,
      ethUsd: this.ethUsd > 0 ? this.ethUsd : null,
      stableUsd: this.isVerifiedUsdStable(rec.ponsPairToken) ? 1 : null,
      totalSupplyWhole,
      realQuoteReserve: phase === 2 || phase === 3 ? null : rec._raised,
      graduationThreshold: rec.ponsGraduationThreshold,
      book: this.tradeBook,
      curve: rec.ponsCurve,
      nowMs: Date.now(),
      windowComplete,
      poolPriceUsd: phase === 2 ? rec.poolPriceUsd : undefined,
    });
    // An incomplete trade window must not hide a 24h volume we already finished.
    if (patch.volumeComplete === false && rec.volumeComplete === true && !(Number(patch.volume?.h24) >= 0)) {
      delete patch.volumeComplete;
    }
    applyMarketPatch(rec, patch);
    if (phase != null) rec.ponsPhase = phase;
    delete rec._reserves;
    delete rec._raised;
    delete rec._phase;
    delete rec._quoteDec;
  }

  // USD stables are an explicit address list (PONS_USD_STABLES). A ticker is not proof.
  isVerifiedUsdStable(address) {
    const want = String(address || "").toLowerCase();
    if (!/^0x[0-9a-f]{40}$/.test(want) || want === ethers.ZeroAddress.toLowerCase()) return false;
    const list = String(process.env.PONS_USD_STABLES || "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
    return list.includes(want);
  }

  async pullTradeChunk() {
    if (!this.scanTrades && !this.ownsProvider) return;
    if (typeof this.provider?.send !== "function") return;
    const head = await this.readHead();
    await this.sampleHead(head);
    const safe = Math.max(0, head - this.confirmations);
    const dayFloor = Math.max(this.startBlock, safe - TRADE_DAY_BLOCKS);
    let chosen = null;
    let cursor = safe;
    for (const rec of this.launches.values()) {
      if (rec.ponsPhase === 2 || rec.ponsPhase === 3) continue;
      const curve = String(rec.ponsCurve || "");
      if (!/^0x[0-9a-fA-F]{40}$/.test(curve)) continue;
      const key = curve.toLowerCase();
      const floor = this.tradeFloors.has(key) ? this.tradeFloors.get(key) : safe;
      if (floor <= dayFloor) continue;
      if (!chosen || floor > cursor) {
        chosen = curve;
        cursor = floor;
      }
    }
    if (!chosen) return;
    const span = Math.min(this.tradeChunk, cursor - dayFloor);
    const start = cursor - span;
    const end = cursor;
    try {
      const logs = await withTimeout(Promise.resolve(this.provider.send("eth_getLogs", [{
        address: chosen,
        topics: [[CURVE_BUY_TOPIC, CURVE_SELL_TOPIC]],
        fromBlock: ethers.toQuantity(start),
        toBlock: ethers.toQuantity(end),
      }])), this.rpcTimeout(this.rpcTimeoutMs));
      const list = Array.isArray(logs) ? logs : [];
      for (const log of list) {
        noteCurveTrade(this.tradeBook, log, {
          curve: chosen,
          blockNumber: Number(log.blockNumber),
          txHash: log.transactionHash,
          logIndex: Number(log.logIndex),
          blockTimestampMs: this.blockTime(log.blockNumber),
        });
      }
      this.tradeFloors.set(chosen.toLowerCase(), start);
      if (this.tradeChunk < TRADE_SPAN) this.tradeChunk = Math.min(TRADE_SPAN, Math.floor(this.tradeChunk * 1.25));
      this.dirty = true;
    } catch (err) {
      if (rpcShouldShrink(err) && this.tradeChunk > this.minChunk) {
        this.tradeChunk = Math.max(this.minChunk, Math.floor(this.tradeChunk / 2));
      }
    }
  }

  async refreshEth() {
    try {
      const res = await fetch("https://api.dexscreener.com/latest/dex/tokens/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return;
      const data = await res.json();
      const pair = (data.pairs || []).find((row) => row?.chainId === "ethereum" && Number(row.priceUsd) > 0);
      if (pair) {
        this.ethUsd = Number(pair.priceUsd);
        this.ethAt = Date.now();
      }
    } catch {
      // Names still publish. Price waits for the next read.
    }
  }

  loadBook() {
    try {
      const book = this.store.load();
      if (book) this.restoreBook(book);
    } catch (err) {
      console.warn("[Pons] book load skipped:", err?.message || err);
    }
  }

  restoreBook(book) {
    if (!book || typeof book !== "object") return;
    for (const row of book.tokens || []) {
      const addr = row?.baseToken?.address;
      if (!addr) continue;
      const key = String(addr).toLowerCase();
      this.launches.set(key, row);
      if (!row.baseToken?.name && !this.queued.has(key)) {
        this.queued.add(key);
        this.enrichQueue.push(key);
      }
    }
    const floor = finiteBlock(book.historyFloor);
    const cursor = finiteBlock(book.liveCursor);
    // A stale cursor is restored as-is. Never rewritten to head - N here.
    if (floor != null) this.historyFloor = floor;
    if (cursor != null) this.liveCursor = cursor;
    const savedChunk = finiteBlock(book.chunk);
    if (savedChunk != null && savedChunk >= this.minChunk) this.chunk = Math.min(this.maxChunk, savedChunk);
    for (const id of book.seen || []) this.seenLogs.add(String(id));
    this.trimBook();
    if (this.ownsProvider) console.log(`[Pons] restored ${this.launches.size} launches`);
  }

  saveBook(force) {
    if (!force && !this.dirty) return false;
    this.trimBook();
    try {
      this.store.save({
        version: 2,
        chainId: CHAIN_ID,
        startBlock: this.startBlock,
        historyFloor: this.historyFloor,
        liveCursor: this.liveCursor,
        chunk: this.chunk,
        confirmations: this.confirmations,
        tokens: this.getTokens(),
        seen: Array.from(this.seenLogs),
      });
      this.dirty = false;
      this.lastSave = Date.now();
      return true;
    } catch (err) {
      console.warn("[Pons] book save skipped:", err?.message || err);
      return false;
    }
  }
}

export async function lookupPonsLaunch(address) {
  let token;
  try {
    token = ethers.getAddress(address);
  } catch {
    return null;
  }
  const factoryIface = new ethers.Interface([
    "function getLaunchedToken(address token) view returns ((address token, address curve, address deployer, address creatorFeeRecipient, address pairToken, uint256 graduationThreshold, uint24 poolFee, int24 tickSpacing, uint16 creatorTaxBps, bool buybackEnabled, uint8 phase, uint256 sweptQuote, uint256 sweptTokens, uint256 sweptAt, bool exists))",
  ]);
  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID, { staticNetwork: true, batchMaxCount: 1 });
  let launch;
  try {
    const raw = await withTimeout(provider.call({
      to: FACTORY,
      data: factoryIface.encodeFunctionData("getLaunchedToken", [token]),
    }), 8000);
    launch = factoryIface.decodeFunctionResult("getLaunchedToken", raw)[0];
  } catch (err) {
    return { error: err?.shortMessage || err?.message || "Pons RPC failed" };
  }
  const exists = launch.exists ?? launch[14];
  if (!exists) return null;
  const phase = Number(launch.phase ?? launch[10]);
  const curve = launch.curve ?? launch[1];
  let name = "";
  let symbol = "";
  try {
    const erc = new ethers.Contract(token, ercIface, provider);
    const [n, s] = await withTimeout(Promise.all([
      erc.name().catch(() => ""),
      erc.symbol().catch(() => ""),
    ]), 7000);
    name = String(n || "").trim();
    symbol = String(s || "").trim();
  } catch {
    // Launch record is enough. The name can arrive later.
  }
  if (/^0x[a-fA-F0-9]{40}$/.test(name)) name = "";
  // getLaunchedToken.phase: 0 not graduated, 1 swept, 2 pool created, 3 rescued.
  const graduated = phase === 2;
  const page = `https://ponsfamily.com/launchpad/${token}`;
  return {
    chainId: "robinhood",
    dexId: "pons",
    primaryDex: "Pons V2",
    primaryDexLogo: "/pons.png",
    launchPlatform: "Pons V2",
    isPonsLaunch: true,
    isBondingCurve: !graduated && phase !== 3,
    isGraduated: graduated,
    marketStage: graduated ? "graduated" : phase === 1 ? "sweeping" : phase === 3 ? "rescued" : "bonding_curve",
    ponsPhase: phase,
    discoveryMode: "onchain",
    pairAddress: curve,
    url: page,
    launchpadDetailUrl: page,
    baseToken: { address: token, name, symbol },
    sources: ["Pons V2", "address-lookup"],
    dexes: ["Pons V2"],
    discoveredAt: Date.now(),
  };
}

export function createPonsIndexer(options) {
  return new PonsIndexer(options);
}

const ponsIndexer = globalThis.__dexhunterPons ??= new PonsIndexer();
export { CHAIN_ID, FACTORY, FACTORY_DEPLOY_BLOCK, TOPIC_LAUNCHED, TOPIC_SWEPT, TOPIC_GRADUATED, PonsIndexer, ponsIndexer };
