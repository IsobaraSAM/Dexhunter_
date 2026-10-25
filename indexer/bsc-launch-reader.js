// @ts-nocheck
// Read-only BNB Smart Chain launchpad reader. HTTP JSON-RPC only.
// Same cursor rules as the Robinhood Pons reader: a saved cursor is walked
// in chunks, committed only after the chunk is stored, and never replaced
// with head or head-N. The timer is only a long-lived accelerator.
//
// Verified 2026-10-25 against https://bsc.publicnode.com (eth_chainId 0x38,
// head 129676416, block time 450ms). Failover https://bsc-rpc.publicnode.com
// also returned chain 56 and TokenCreate logs. Official
// https://bsc-dataseed.bnbchain.org answered eth_chainId but eth_getLogs
// returned "limit exceeded", matching the BNB Chain docs.
//
// Classic Four.meme (official integration guide, retrieved 2026-10-25):
//   Helper3 0xF251F83e40a78868FcfA3FA4599Dad6494E46034
//   TOKEN_MANAGER()   = 0xEC4549caDcE5DA21Df6E6422d448034B5233bFbC (V1 proxy)
//   TOKEN_MANAGER_2() = 0x5c952063c7fc8610FFDB798152D69F0B9550762b (V2 proxy)
// Both proxies are 170 bytes. EIP-1967 implementation of V2 was
// 0xF32eE25A7A94F5858692B90815493bDA9f992eee. V1 and V2 are separate adapters.
// TokenCreate(address,address,uint256,string,string,uint256,uint256,uint256)
// topic0 0x396d5e902b675b032348d3d2e9517ee8f0c4a926603fbc075d3d282ff00cad20
// decoded tx 0xbcdff06a07c7205ef8caf1ce5a996f30d2b46d08790ac86214ef964131682ae6.
// Helper3 getTokenInfo on that token returned version 2. V1 price fields from
// the helper are documented as constants, so V1 does not get a price from them.
//
// OpenFour (official integration guide, retrieved 2026-10-25):
//   Registry 0x912CEf0C3aE9Ab6eB3Ec87cab69371cFb317Ab94
//   openFourCore() resolved at runtime to 0xebe7b6C1089D9F72aD07f34E36d898e44E5e27f3
//   (itself a proxy; impl slot 0x02D714cB43d1544AbE1Ffc2405ec00b7235b7f26).
//   The core address is not hardcoded as permanent.
// TokenCreated topic 0x7dae4dcd1b20eb0445e7cc1d02b3e2e7f32fa63081a0e764732c269f2b8f228f
// decoded tx 0xab034fa839764ffa58787233ae548a3e4673dd4d84904c9797d59802244c88f5.
// TradeExecuted and PhaseTransition topics matched live logs in the same window.
// MigrateExecuted and TokenPaused were derived from the published ABI and were
// not observed in that window. Helper3 does not know OpenFour tokens (version 0).
//
// Archive eth_getCode is rejected by the public HTTP RPCs, so the factory
// deployment block is unverified. On first boot each adapter's backfill floor
// is the confirmed head minus BACKFILL_BLOCKS (~37h at 450ms), then the cursor
// only moves by fully read chunks. That horizon is not a deployment block.
import fs from "fs";
import os from "os";
import path from "path";
import { ethers } from "ethers";

const CHAIN_ID = 56;
const BLOCK_MS = 450;
const BACKFILL_BLOCKS = 300_000;
const DEFAULT_CONFIRMATIONS = 15;
const DEFAULT_MAX_CHUNK = 2000;
const DEFAULT_MIN_CHUNK = 200;
const TRADE_SPAN = 250;
const MAX_BOOK = 2000;
const MAX_SEEN = 6000;
const BOOK_PATH = path.join(os.tmpdir(), "dexhunter", "bsc-launch-book.json");

const HELPER = "0xF251F83e40a78868FcfA3FA4599Dad6494E46034";
const REGISTRY = "0x912CEf0C3aE9Ab6eB3Ec87cab69371cFb317Ab94";
const TM1 = "0xEC4549caDcE5DA21Df6E6422d448034B5233bFbC";
const TM2 = "0x5c952063c7fc8610FFDB798152D69F0B9550762b";
const MULTICALL = "0xcA11bde05977b3631167028862bE2a173976CA11";
const CHAINLINK_BNB_USD = "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE";
export const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
export const BSC_USDT = "0x55d398326f99059fF775485246999027B3197955";
export const BSC_USDC = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";

const RPC_URLS = [
  "https://bsc.publicnode.com",
  "https://bsc-rpc.publicnode.com",
];

const TOPIC_CREATE = ethers.id("TokenCreate(address,address,uint256,string,string,uint256,uint256,uint256)");
const TOPIC_STOP = ethers.id("TradeStop(address)");
const TOPIC_LIQ = ethers.id("LiquidityAdded(address,uint256,address,uint256)");
const TOPIC_BUY = ethers.id("TokenPurchase(address,address,uint256,uint256,uint256,uint256,uint256,uint256)");
const TOPIC_SELL = ethers.id("TokenSale(address,address,uint256,uint256,uint256,uint256,uint256,uint256)");
const TOPIC_OPEN_CREATE = ethers.id("TokenCreated(uint256,uint256,address,address,string,string,uint256,uint256,uint256,uint256,address,address,address,address,address,address,address,string,uint256,bytes)");
const TOPIC_OPEN_TRADE = ethers.id("TradeExecuted(address,address,uint256,bool,address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256)");
const TOPIC_OPEN_PHASE = ethers.id("PhaseTransition(address,uint8,uint8,address)");
const TOPIC_OPEN_MIGRATE = ethers.id("MigrateExecuted(uint256,address,address,address,address,bytes8,uint256,uint256,bytes32,uint8,bytes)");
const TOPIC_OPEN_PAUSE = ethers.id("TokenPaused(address,bool)");

const classicIface = new ethers.Interface([
  "event TokenCreate(address creator, address token, uint256 requestId, string name, string symbol, uint256 totalSupply, uint256 launchTime, uint256 launchFee)",
  "event TradeStop(address token)",
  "event LiquidityAdded(address base, uint256 offers, address quote, uint256 funds)",
  "event TokenPurchase(address token, address account, uint256 price, uint256 amount, uint256 cost, uint256 fee, uint256 offers, uint256 funds)",
  "event TokenSale(address token, address account, uint256 price, uint256 amount, uint256 cost, uint256 fee, uint256 offers, uint256 funds)",
]);
const openIface = new ethers.Interface([
  "event TokenCreated(uint256 requestId, uint256 indexed presetId, address indexed creator, address indexed token, string name, string symbol, uint256 maxSupply, uint256 saleAmount, uint256 raiseAmount, uint256 initialPrice, address quoteAsset, address vault, address curveModule, address tradeModule, address migrateModule, address customData, address tokenModule, string tokenMetaUri, uint256 flags, bytes encodedTags)",
  "event TradeExecuted(address indexed token, address indexed trader, uint256 indexed presetId, bool isBuy, address quoteAsset, address vault, uint256 requestedTokenAmount, uint256 tokenAmount, uint256 curveQuoteAmount, uint256 traderQuoteAmount, uint256 lastPrice, uint256 slippageLimit, uint256 protocolFee, uint256 taxFee, uint256 devFee, uint256 antiSniperFee, uint256 totalRaised, uint256 remainingForSale)",
  "event PhaseTransition(address indexed token, uint8 from, uint8 to, address operator)",
  "event MigrateExecuted(uint256 indexed presetId, address indexed caller, address indexed token, address vault, address migrateModule, bytes8 migrateTagId, uint256 totalRaised, uint256 remainingForSale, bytes32 hookDataHash, uint8 migratedDataVersion, bytes encodedMigratedData)",
  "event TokenPaused(address indexed token, bool paused)",
]);
const helperIface = new ethers.Interface([
  "function TOKEN_MANAGER() view returns (address)",
  "function TOKEN_MANAGER_2() view returns (address)",
  "function getTokenInfo(address token) view returns (uint256 version, address tokenManager, address quote, uint256 lastPrice, uint256 tradingFeeRate, uint256 minTradingFee, uint256 launchTime, uint256 offers, uint256 maxOffers, uint256 funds, uint256 maxFunds, bool liquidityAdded)",
]);
const registryIface = new ethers.Interface([
  "function openFourCore() view returns (address)",
]);
const ercIface = new ethers.Interface([
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);
const linkIface = new ethers.Interface([
  "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
  "function decimals() view returns (uint8)",
]);
const multiIface = new ethers.Interface([
  "function aggregate3((address target, bool allowFailure, bytes callData)[] calls) payable returns ((bool success, bytes returnData)[] returnData)",
]);

const ZERO = ethers.ZeroAddress.toLowerCase();

export function decodeClassicLog(log) {
  try {
    const parsed = classicIface.parseLog(log);
    return parsed ? { name: parsed.name, args: parsed.args } : null;
  } catch {
    return null;
  }
}

export function decodeOpenLog(log) {
  try {
    const parsed = openIface.parseLog(log);
    return parsed ? { name: parsed.name, args: parsed.args } : null;
  } catch {
    return null;
  }
}

function finiteBlock(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.floor(n);
}

function rpcShouldShrink(err) {
  const msg = String(err?.shortMessage || err?.message || err);
  return /exceeds limit|too large|too many|timeout|timed out|rate.?limit|\b429\b|retry|more than|query spans|are allowed|block range|response size|limit exceeded/i.test(msg);
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

function bigToNumber(value, denom) {
  const v = BigInt(value);
  const d = BigInt(denom);
  if (d <= 0n) return null;
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const n = Number(abs / d) + Number(abs % d) / Number(d);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

// lastPrice on both live adapters is quote raw * 1e18 / token raw.
// Confirmed against a V2 TokenPurchase and an OpenFour TradeExecuted on 2026-10-25:
// the event price matched curveQuote * 1e18 / tokenAmount.
export function quotePerHumanToken(lastPrice, tokenDecimals = 18, quoteDecimals = 18) {
  const td = Number(tokenDecimals);
  const qd = Number(quoteDecimals);
  if (!Number.isInteger(td) || !Number.isInteger(qd) || td < 0 || td > 36 || qd < 0 || qd > 36) return null;
  let per = bigToNumber(lastPrice, 10n ** 18n);
  if (per == null || per <= 0) return null;
  const scale = td - qd;
  if (scale > 0) per *= 10 ** scale;
  else if (scale < 0) per /= 10 ** (-scale);
  return Number.isFinite(per) && per > 0 ? per : null;
}

export function usdPerHumanToken({ lastPrice, tokenDecimals, quoteDecimals, quote, bnbUsd }) {
  const perQuote = quotePerHumanToken(lastPrice, tokenDecimals, quoteDecimals);
  if (perQuote == null) return null;
  const q = String(quote || "").toLowerCase();
  if (!q) return null;
  if (q === ZERO || q === WBNB.toLowerCase()) {
    if (!(Number(bnbUsd) > 0)) return null;
    return perQuote * Number(bnbUsd);
  }
  // Both pegs were read as 18 decimals on 2026-10-25. Other quotes stay unpriced.
  if ((q === BSC_USDT.toLowerCase() || q === BSC_USDC.toLowerCase()) && Number(quoteDecimals) === 18) {
    return perQuote;
  }
  return null;
}

export function capFromSupply(priceUsd, totalSupply, tokenDecimals) {
  if (!(Number(priceUsd) > 0) || totalSupply == null) return null;
  const human = bigToNumber(totalSupply, 10n ** BigInt(Number(tokenDecimals) || 0));
  if (human == null || human <= 0) return null;
  const cap = Number(priceUsd) * human;
  if (!Number.isFinite(cap) || cap <= 0 || cap > 1e15) return null;
  return cap;
}

export function curveProgress(remaining, maximum) {
  try {
    const max = BigInt(maximum);
    const left = BigInt(remaining);
    if (max <= 0n || left < 0n || left > max) return null;
    return Number(((max - left) * 10000n) / max) / 100;
  } catch {
    return null;
  }
}

function pageFor(address) {
  return `https://four.meme/token/${address}`;
}

function fileStore(file) {
  return {
    load() {
      try {
        if (!fs.existsSync(file)) return null;
        return JSON.parse(fs.readFileSync(file, "utf8"));
      } catch (err) {
        console.warn("[BSC] book load skipped:", err?.message || err);
        return null;
      }
    },
    save(book) {
      const dir = path.dirname(file);
      fs.mkdirSync(dir, { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(book));
      fs.renameSync(tmp, file);
    },
  };
}

async function httpRpc(urls, method, params, ms) {
  let last;
  for (const url of urls) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: ctrl.signal,
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message || "rpc error");
      return json.result;
    } catch (err) {
      last = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw last || new Error("rpc failed");
}

function blankAdapter(id, address, topics, family) {
  return {
    id,
    family,
    address,
    topics,
    startBlock: null,
    liveCursor: null,
    historyFloor: null,
    chunk: DEFAULT_MAX_CHUNK,
    preferBack: false,
  };
}

class BscLaunchIndexer {
  constructor(options = {}) {
    this.launches = new Map();
    this.callbacks = [];
    this.timer = null;
    this.chain = Promise.resolve();
    this.urls = options.urls || RPC_URLS;
    this.rpcImpl = options.rpc || null;
    this.confirmations = finiteBlock(options.confirmations) ?? DEFAULT_CONFIRMATIONS;
    this.maxChunk = finiteBlock(options.maxChunk) ?? DEFAULT_MAX_CHUNK;
    this.minChunk = Math.max(1, finiteBlock(options.minChunk) ?? DEFAULT_MIN_CHUNK);
    this.backfillBlocks = finiteBlock(options.backfillBlocks) ?? BACKFILL_BLOCKS;
    this.adapters = [
      blankAdapter("four-v2", TM2, [TOPIC_CREATE, TOPIC_STOP, TOPIC_LIQ], "four-v2"),
      blankAdapter("four-v1", TM1, [TOPIC_CREATE, TOPIC_STOP], "four-v1"),
      blankAdapter("openfour", null, [TOPIC_OPEN_CREATE, TOPIC_OPEN_PHASE, TOPIC_OPEN_MIGRATE, TOPIC_OPEN_PAUSE], "openfour"),
    ];
    this.turn = 0;
    this.headSample = { block: 0, timeMs: 0 };
    this.seenLogs = new Set();
    this.enrichQueue = [];
    this.queued = new Set();
    this.quoteMeta = new Map();
    this.bnbUsd = 0;
    this.bnbAt = 0;
    this.bnbUpdatedAt = 0;
    this.tradeCursor = null;
    this.dirty = false;
    this.backoffUntil = 0;
    this.rpcDeadline = 0;
    this.checked = false;
    this.lastError = "";
    this.lastPullWarn = 0;
    this.loggedBoot = false;
    const bookFile = options.bookPath || process.env.BSC_BOOK_PATH || BOOK_PATH;
    this.store = options.store || fileStore(bookFile);
    if (options.book) this.restoreBook(options.book);
    else if (options.book !== null) this.loadBook();
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
      safeHead: safe,
      confirmations: this.confirmations,
      bnbUsd: this.bnbUsd || null,
      bnbUpdatedAt: this.bnbUpdatedAt || null,
      lastError: this.lastError || null,
      deploymentBlock: "unverified",
      backfillBlocks: this.backfillBlocks,
      tokens: this.launches.size,
      adapters: this.adapters.map((adapter) => ({
        id: adapter.id,
        address: adapter.address,
        startBlock: adapter.startBlock,
        liveCursor: adapter.liveCursor,
        historyFloor: adapter.historyFloor,
        chunk: adapter.chunk,
        historyComplete: adapter.startBlock != null && adapter.historyFloor != null && adapter.historyFloor < adapter.startBlock,
        forwardComplete: safe != null && adapter.liveCursor != null && adapter.liveCursor >= safe,
      })),
    };
  }

  async rpc(method, params) {
    const ms = this.rpcTimeout(12000);
    if (ms <= 0) throw new Error("timeout");
    if (this.rpcImpl) return this.rpcImpl(method, params);
    return httpRpc(this.urls, method, params, ms);
  }

  rpcTimeout(cap) {
    if (!this.rpcDeadline) return cap;
    return Math.min(cap, this.rpcDeadline - Date.now());
  }

  enqueue(task) {
    const run = this.chain.then(task, task);
    this.chain = run.then(() => {}, () => {});
    return run;
  }

  async start() {
    if (this.timer) return;
    console.log("[BSC] Reading Four.meme V1, Four.meme V2, and OpenFour on BNB Smart Chain 56");
    this.timer = setInterval(() => {
      this.tick().catch((err) => console.warn("[BSC] tick:", err?.message || err));
    }, 1000);
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

  catchUp({ maxChunks = 3, maxMs = 1200 } = {}) {
    return this.enqueue(() => this.runCatchUp({ maxChunks, maxMs }));
  }

  async runTick() {
    this.rpcDeadline = 0;
    const step = await this.scanOneChunk();
    if (step?.error) this.backoffUntil = Date.now() + 2000;
    if (Date.now() - this.bnbAt > 120000) {
      try { await this.refreshBnb(); } catch { /* price stays blank until the feed is fresh */ }
    }
    if (this.enrichQueue.length) {
      try { await this.enrichSome(); } catch { /* queued again */ }
    }
    try { await this.pullRecentTrades(); } catch { /* last trade can arrive on the next tick */ }
    if (this.dirty) this.saveBook(false);
    return step;
  }

  async runCatchUp({ maxChunks = 3, maxMs = 1200 } = {}) {
    const budget = Number.isFinite(Number(maxMs)) ? Number(maxMs) : 1200;
    const limit = Number.isFinite(Number(maxChunks)) ? Number(maxChunks) : 3;
    const deadline = Date.now() + Math.max(0, budget);
    this.rpcDeadline = deadline;
    let chunks = 0;
    let done = false;
    while (chunks < limit && Date.now() < deadline) {
      const step = await this.scanOneChunk();
      chunks += 1;
      if (step?.done) { done = true; break; }
      if (!step?.pulled && !step?.error) break;
    }
    if (Date.now() < deadline && Date.now() - this.bnbAt > 120000) {
      try { await this.refreshBnb(); } catch { /* unchanged */ }
    }
    if (Date.now() < deadline && this.enrichQueue.length) {
      try { await this.enrichSome(); } catch { /* unchanged */ }
    }
    return { ...this.health(), chunks, done };
  }

  async ensureReady() {
    if (this.checked) return;
    const chain = await this.rpc("eth_chainId", []);
    if (Number(chain) !== CHAIN_ID) throw new Error(`BSC chain id ${chain} is not 56`);
    const helperCode = await this.rpc("eth_getCode", [HELPER, "latest"]);
    if (!helperCode || helperCode === "0x") throw new Error("Four.meme helper has no code");
    try {
      const tm1 = await this.call(HELPER, helperIface, "TOKEN_MANAGER");
      const tm2 = await this.call(HELPER, helperIface, "TOKEN_MANAGER_2");
      if (String(tm1).toLowerCase() === TM1.toLowerCase()) this.adapter("four-v1").address = ethers.getAddress(tm1);
      if (String(tm2).toLowerCase() === TM2.toLowerCase()) this.adapter("four-v2").address = ethers.getAddress(tm2);
    } catch (err) {
      this.lastError = `helper read failed: ${err?.message || err}`;
    }
    try {
      const core = await this.call(REGISTRY, registryIface, "openFourCore");
      const addr = ethers.getAddress(core);
      const prev = this.adapter("openfour");
      if (prev.address && prev.address.toLowerCase() !== addr.toLowerCase()) {
        prev.liveCursor = null;
        prev.historyFloor = null;
        prev.startBlock = null;
      }
      prev.address = addr;
    } catch (err) {
      this.lastError = `OpenFour registry read failed: ${err?.message || err}`;
    }
    this.checked = true;
  }

  adapter(id) {
    return this.adapters.find((row) => row.id === id);
  }

  async call(to, iface, fn, args = []) {
    const data = iface.encodeFunctionData(fn, args);
    const raw = await this.rpc("eth_call", [{ to, data }, "latest"]);
    return iface.decodeFunctionResult(fn, raw)[0];
  }

  async readHead() {
    const head = Number(await this.rpc("eth_blockNumber", []));
    if (!Number.isFinite(head)) throw new Error("BSC head is not a block number");
    return head;
  }

  async sampleHead(head) {
    if (this.headSample.block && head - this.headSample.block <= 2000) return;
    try {
      const block = await this.rpc("eth_getBlockByNumber", ["0x" + head.toString(16), false]);
      if (block?.timestamp != null) {
        this.headSample = { block: head, timeMs: Number(block.timestamp) * 1000 };
        return;
      }
    } catch { /* display time only */ }
    this.headSample = { block: head, timeMs: this.headSample.timeMs || Date.now() };
  }

  blockTime(blockNumber) {
    if (!this.headSample.timeMs) return Date.now();
    const behind = Math.max(0, this.headSample.block - Number(blockNumber));
    return this.headSample.timeMs - behind * BLOCK_MS;
  }

  async scanOneChunk() {
    await this.ensureReady();
    const head = await this.readHead();
    await this.sampleHead(head);
    const safe = Math.max(0, head - this.confirmations);
    const ready = this.adapters.filter((adapter) => adapter.address);
    if (!ready.length) return { error: true, pulled: false };
    if (!this.loggedBoot && !this.rpcImpl) {
      this.loggedBoot = true;
      console.log(`[BSC] book=${this.launches.size} safe=${safe} backfill ${this.backfillBlocks} blocks (deployment block unverified)`);
    }
    let picked = null;
    for (let i = 0; i < ready.length; i++) {
      const adapter = ready[(this.turn + i) % ready.length];
      if (adapter.liveCursor == null || adapter.historyFloor == null || adapter.liveCursor < safe || adapter.historyFloor > (adapter.startBlock ?? 0)) {
        picked = adapter;
        this.turn = (this.turn + i + 1) % ready.length;
        break;
      }
    }
    if (!picked) return { done: true, pulled: false };
    if (picked.liveCursor == null || picked.historyFloor == null || picked.startBlock == null) {
      picked.startBlock = Math.max(1, safe - this.backfillBlocks);
      picked.liveCursor = safe;
      picked.historyFloor = safe;
      this.dirty = true;
      this.saveBook(true);
      return { done: false, pulled: true, dir: "anchor", adapter: picked.id };
    }
    const needsForward = picked.liveCursor < safe;
    const needsBack = picked.historyFloor > picked.startBlock;
    if (!needsForward && !needsBack) return { done: false, pulled: false };
    const goForward = needsForward && (!needsBack || !picked.preferBack);
    if (goForward) {
      const got = await this.pull(picked, picked.liveCursor + 1, safe, "forward");
      if (got == null) return { error: true, pulled: false, dir: "forward", adapter: picked.id };
      picked.liveCursor = got.end;
      picked.preferBack = true;
      this.saveBook(true);
      return { done: false, pulled: true, dir: "forward", adapter: picked.id };
    }
    const got = await this.pull(picked, picked.startBlock, picked.historyFloor, "back");
    if (got == null) return { error: true, pulled: false, dir: "back", adapter: picked.id };
    picked.historyFloor = got.end - 1;
    picked.preferBack = false;
    this.saveBook(true);
    return { done: false, pulled: true, dir: "back", adapter: picked.id };
  }

  async pull(adapter, from, to, dir) {
    if (from > to) return { end: to };
    let attempts = 0;
    while (attempts < 4) {
      if (this.rpcDeadline && Date.now() >= this.rpcDeadline) return null;
      attempts += 1;
      const span = Math.min(adapter.chunk, to - from + 1);
      const start = dir === "back" ? to - span + 1 : from;
      const end = dir === "back" ? to : from + span - 1;
      try {
        const logs = await this.rpc("eth_getLogs", [{
          address: adapter.address,
          topics: [adapter.topics],
          fromBlock: ethers.toQuantity(start),
          toBlock: ethers.toQuantity(end),
        }]);
        const list = Array.isArray(logs) ? logs : [];
        list.sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber) || Number(a.logIndex) - Number(b.logIndex));
        for (const log of list) this.applyLog(adapter, log);
        if (adapter.chunk < this.maxChunk) adapter.chunk = Math.min(this.maxChunk, Math.max(adapter.chunk + 1, Math.floor(adapter.chunk * 1.25)));
        return { end: dir === "back" ? start : end };
      } catch (err) {
        const msg = String(err?.message || err);
        if (!(this.rpcDeadline && Date.now() >= this.rpcDeadline - 5) && rpcShouldShrink(err) && adapter.chunk > this.minChunk) {
          adapter.chunk = Math.max(this.minChunk, Math.floor(adapter.chunk / 2));
          continue;
        }
        if (!this.lastPullWarn || Date.now() - this.lastPullWarn > 20000) {
          this.lastPullWarn = Date.now();
          if (!this.rpcImpl) console.warn(`[BSC] ${adapter.id} logs ${start}-${end}:`, msg);
        }
        this.lastError = msg;
        return null;
      }
    }
    return null;
  }

  logKey(log) {
    const tx = String(log?.transactionHash || "").toLowerCase();
    if (!/^0x[0-9a-f]{64}$/.test(tx)) return "";
    const index = Number(log.logIndex ?? 0);
    if (!Number.isFinite(index)) return "";
    return `${CHAIN_ID}:${tx}:${index}`;
  }

  applyLog(adapter, log) {
    const id = this.logKey(log);
    if (id && this.seenLogs.has(id)) return;
    const parsed = adapter.family === "openfour" ? decodeOpenLog(log) : decodeClassicLog(log);
    if (!parsed) return;
    if (id) this.seenLogs.add(id);
    const when = this.blockTime(log.blockNumber);
    if (parsed.name === "TokenCreate") this.onClassicCreate(adapter, parsed.args, log, when);
    else if (parsed.name === "TradeStop") this.onTradeStop(parsed.args.token);
    else if (parsed.name === "LiquidityAdded") this.onLiquidity(parsed.args);
    else if (parsed.name === "TokenCreated") this.onOpenCreate(parsed.args, log, when);
    else if (parsed.name === "PhaseTransition") this.onPhase(parsed.args);
    else if (parsed.name === "MigrateExecuted") this.onMigrate(parsed.args);
    else if (parsed.name === "TokenPaused") this.onPause(parsed.args);
    else if (parsed.name === "TokenPurchase" || parsed.name === "TokenSale") this.onClassicTrade(parsed.args);
    else if (parsed.name === "TradeExecuted") this.onOpenTrade(parsed.args);
  }

  onClassicCreate(adapter, args, log, when) {
    const token = ethers.getAddress(args.token);
    const supply = args.totalSupply.toString();
    this.publish({
      chainId: "bsc",
      dexId: "fourmeme",
      primaryDex: "Four.meme",
      launchPlatform: adapter.family === "four-v1" ? "Four.meme V1" : "Four.meme",
      isFourMemeLaunch: true,
      bscProtocol: adapter.family,
      bscManager: adapter.address,
      isBondingCurve: true,
      isGraduated: false,
      discoveryMode: "onchain",
      pairAddress: token,
      url: pageFor(token),
      launchpadDetailUrl: pageFor(token),
      primaryDexTradingUrl: pageFor(token),
      baseToken: {
        address: token,
        name: String(args.name || "").slice(0, 80),
        symbol: String(args.symbol || "").slice(0, 24),
        decimals: null,
      },
      totalSupply: supply,
      pairCreatedAt: when,
      creator: ethers.getAddress(args.creator),
      txHash: log.transactionHash,
      fourRequestId: args.requestId.toString(),
      marketStage: "bonding_curve",
      volumeComplete: false,
      sources: [adapter.family === "four-v1" ? "Four.meme V1" : "Four.meme V2"],
      dexes: ["Four.meme"],
      discoveredAt: Date.now(),
    });
  }

  onOpenCreate(args, log, when) {
    const token = ethers.getAddress(args.token);
    const quote = ethers.getAddress(args.quoteAsset);
    this.publish({
      chainId: "bsc",
      dexId: "openfour",
      primaryDex: "OpenFour",
      launchPlatform: "OpenFour",
      isOpenFourLaunch: true,
      isFourMemeLaunch: true,
      bscProtocol: "openfour",
      isBondingCurve: true,
      isGraduated: false,
      discoveryMode: "onchain",
      pairAddress: ethers.getAddress(args.vault),
      url: pageFor(token),
      launchpadDetailUrl: pageFor(token),
      primaryDexTradingUrl: pageFor(token),
      baseToken: {
        address: token,
        name: String(args.name || "").slice(0, 80),
        symbol: String(args.symbol || "").slice(0, 24),
        decimals: null,
      },
      quoteToken: { address: quote },
      totalSupply: args.maxSupply.toString(),
      fourSaleAmount: args.saleAmount.toString(),
      fourRaiseAmount: args.raiseAmount.toString(),
      fourLastPrice: args.initialPrice.toString(),
      openPresetId: args.presetId.toString(),
      openVault: ethers.getAddress(args.vault),
      openMetaUri: String(args.tokenMetaUri || "").slice(0, 180),
      pairCreatedAt: when,
      creator: ethers.getAddress(args.creator),
      txHash: log.transactionHash,
      fourRequestId: args.requestId.toString(),
      marketStage: "bonding_curve",
      bondingProgress: 0,
      volumeComplete: false,
      sources: ["OpenFour"],
      dexes: ["OpenFour"],
      discoveredAt: Date.now(),
    });
  }

  onTradeStop(token) {
    const prev = this.launches.get(String(token).toLowerCase());
    if (!prev || prev.isGraduated) return;
    this.publish({
      ...prev,
      isBondingCurve: false,
      marketStage: prev.marketStage === "graduated" ? prev.marketStage : "trade_stop",
      baseToken: prev.baseToken,
    });
  }

  onLiquidity(args) {
    const prev = this.launches.get(String(args.base).toLowerCase());
    if (!prev) return;
    this.publish({
      ...prev,
      isGraduated: true,
      isBondingCurve: false,
      bondingProgress: 100,
      marketStage: "graduated",
      quoteToken: { ...prev.quoteToken, address: ethers.getAddress(args.quote) },
      fourLpQuote: args.funds.toString(),
      fourLpToken: args.offers.toString(),
      baseToken: prev.baseToken,
    });
  }

  onPhase(args) {
    const prev = this.launches.get(String(args.token).toLowerCase());
    if (!prev) return;
    const to = Number(args.to);
    // Created 0, Trading 1, MigratePending 2, Migrated 3, Terminal 4, SoldOut 5.
    // SoldOut is not a migration. Terminal is not a migration either.
    const migrated = to === 3;
    this.publish({
      ...prev,
      openPhase: to,
      isGraduated: migrated || prev.isGraduated,
      isBondingCurve: to === 0 || to === 1,
      bondingProgress: migrated || to === 5 ? 100 : prev.bondingProgress,
      marketStage: migrated ? "migrated" : to === 2 ? "migrate_pending" : to === 5 ? "sold_out" : to === 4 ? "terminal" : "bonding_curve",
      baseToken: prev.baseToken,
    });
  }

  onMigrate(args) {
    const prev = this.launches.get(String(args.token).toLowerCase());
    if (!prev) return;
    this.publish({
      ...prev,
      isGraduated: true,
      isBondingCurve: false,
      bondingProgress: 100,
      marketStage: "migrated",
      openPhase: 3,
      openMigrateTag: ethers.hexlify(args.migrateTagId),
      openMigrateVersion: Number(args.migratedDataVersion),
      baseToken: prev.baseToken,
    });
  }

  onPause(args) {
    const prev = this.launches.get(String(args.token).toLowerCase());
    if (!prev) return;
    this.publish({ ...prev, openPaused: Boolean(args.paused), baseToken: prev.baseToken });
  }

  onClassicTrade(args) {
    const prev = this.launches.get(String(args.token).toLowerCase());
    if (!prev || prev.bscProtocol === "four-v1") return;
    const progress = curveProgress(args.offers, prev.fourMaxOffers);
    this.publish({
      ...prev,
      fourLastPrice: args.price.toString(),
      fourOffers: args.offers.toString(),
      fourFunds: args.funds.toString(),
      bondingProgress: prev.isGraduated ? 100 : progress ?? prev.bondingProgress,
      baseToken: prev.baseToken,
    });
  }

  onOpenTrade(args) {
    const prev = this.launches.get(String(args.token).toLowerCase());
    if (!prev) return;
    const progress = curveProgress(args.remainingForSale, prev.fourSaleAmount);
    this.publish({
      ...prev,
      fourLastPrice: args.lastPrice.toString(),
      fourOffers: args.remainingForSale.toString(),
      fourFunds: args.totalRaised.toString(),
      quoteToken: { ...prev.quoteToken, address: ethers.getAddress(args.quoteAsset) },
      bondingProgress: prev.isGraduated ? 100 : progress ?? prev.bondingProgress,
      baseToken: prev.baseToken,
    });
  }

  async pullRecentTrades() {
    const head = this.headSample.block;
    if (!head) return;
    const safe = Math.max(0, head - this.confirmations);
    if (this.tradeCursor == null) this.tradeCursor = Math.max(1, safe - TRADE_SPAN);
    if (this.tradeCursor >= safe) return;
    const start = this.tradeCursor + 1;
    const end = Math.min(safe, start + TRADE_SPAN - 1);
    const jobs = [
      { address: TM2, topics: [[TOPIC_BUY, TOPIC_SELL]], family: "four-v2" },
      { address: this.adapter("openfour").address, topics: [[TOPIC_OPEN_TRADE]], family: "openfour" },
    ];
    for (const job of jobs) {
      if (!job.address) continue;
      const logs = await this.rpc("eth_getLogs", [{
        address: job.address,
        topics: job.topics,
        fromBlock: ethers.toQuantity(start),
        toBlock: ethers.toQuantity(end),
      }]);
      const list = Array.isArray(logs) ? logs : [];
      list.sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber) || Number(a.logIndex) - Number(b.logIndex));
      for (const log of list) this.applyLog({ family: job.family, address: job.address }, log);
    }
    this.tradeCursor = end;
    this.dirty = true;
  }

  async refreshBnb() {
    const round = await this.rpc("eth_call", [{ to: CHAINLINK_BNB_USD, data: linkIface.encodeFunctionData("latestRoundData") }, "latest"]);
    const decRaw = await this.rpc("eth_call", [{ to: CHAINLINK_BNB_USD, data: linkIface.encodeFunctionData("decimals") }, "latest"]);
    const decoded = linkIface.decodeFunctionResult("latestRoundData", round);
    const answer = decoded.answer ?? decoded[1];
    const updatedAt = Number(decoded.updatedAt ?? decoded[3]);
    const decimals = Number(linkIface.decodeFunctionResult("decimals", decRaw)[0]);
    this.bnbAt = Date.now();
    if (!(answer > 0n) || !Number.isInteger(decimals) || updatedAt <= 0) return;
    if (Date.now() / 1000 - updatedAt > 3 * 60 * 60) return;
    const px = bigToNumber(answer, 10n ** BigInt(decimals));
    if (px > 0) {
      this.bnbUsd = px;
      this.bnbUpdatedAt = updatedAt * 1000;
    }
  }

  async enrichSome() {
    const batch = [];
    while (this.enrichQueue.length && batch.length < 8) {
      const id = this.enrichQueue.shift();
      this.queued.delete(id);
      const rec = this.launches.get(id);
      if (rec) batch.push(rec);
    }
    if (!batch.length) return;
    const calls = [];
    const plan = [];
    const push = (target, data, rec, field, iface, fn) => {
      calls.push({ target, allowFailure: true, callData: data });
      plan.push({ rec, field, iface, fn });
    };
    for (const rec of batch) {
      const token = rec.baseToken.address;
      if (rec.baseToken.decimals == null) {
        push(token, ercIface.encodeFunctionData("decimals"), rec, "decimals", ercIface, "decimals");
      }
      if (rec.bscProtocol === "four-v2") {
        push(HELPER, helperIface.encodeFunctionData("getTokenInfo", [token]), rec, "info", helperIface, "getTokenInfo");
      }
      const quote = rec.quoteToken?.address;
      if (quote && quote.toLowerCase() !== ZERO && !this.quoteMeta.has(quote.toLowerCase())) {
        push(quote, ercIface.encodeFunctionData("decimals"), rec, "quoteDecimals", ercIface, "decimals");
        push(quote, ercIface.encodeFunctionData("symbol"), rec, "quoteSymbol", ercIface, "symbol");
      }
    }
    if (!calls.length) {
      for (const rec of batch) this.applyUsd(rec);
      return;
    }
    try {
      const raw = await this.rpc("eth_call", [{
        to: MULTICALL,
        data: multiIface.encodeFunctionData("aggregate3", [calls]),
      }, "latest"]);
      const decoded = multiIface.decodeFunctionResult("aggregate3", raw)[0];
      for (let i = 0; i < plan.length; i++) {
        const row = decoded[i];
        const ok = row.success ?? row[0];
        const ret = row.returnData ?? row[1];
        if (!ok || !ret || ret === "0x") continue;
        const { rec, field, iface, fn } = plan[i];
        try {
          const value = iface.decodeFunctionResult(fn, ret);
          if (field === "decimals") rec.baseToken.decimals = Number(value[0]);
          else if (field === "info") this.applyHelperInfo(rec, value);
          else if (field === "quoteDecimals") {
            const addr = rec.quoteToken.address.toLowerCase();
            const meta = this.quoteMeta.get(addr) || {};
            meta.decimals = Number(value[0]);
            this.quoteMeta.set(addr, meta);
          } else if (field === "quoteSymbol") {
            const addr = rec.quoteToken.address.toLowerCase();
            const meta = this.quoteMeta.get(addr) || {};
            meta.symbol = String(value[0]).slice(0, 16);
            this.quoteMeta.set(addr, meta);
          }
        } catch { /* one field */ }
      }
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
    for (const rec of batch) {
      this.applyUsd(rec);
      this.publish(rec, true);
    }
  }

  applyHelperInfo(rec, value) {
    const version = Number(value.version ?? value[0]);
    // V1 helper numbers are documented constants, not that token's curve.
    if (version !== 2) return;
    const quote = value.quote ?? value[2];
    rec.quoteToken = { ...rec.quoteToken, address: ethers.getAddress(quote) };
    rec.fourLastPrice = (value.lastPrice ?? value[3]).toString();
    rec.fourOffers = (value.offers ?? value[7]).toString();
    rec.fourMaxOffers = (value.maxOffers ?? value[8]).toString();
    rec.fourFunds = (value.funds ?? value[9]).toString();
    rec.fourMaxFunds = (value.maxFunds ?? value[10]).toString();
    const added = Boolean(value.liquidityAdded ?? value[11]);
    if (added) {
      rec.isGraduated = true;
      rec.isBondingCurve = false;
      rec.bondingProgress = 100;
      rec.marketStage = "graduated";
    } else {
      const progress = curveProgress(rec.fourOffers, rec.fourMaxOffers);
      if (progress != null) rec.bondingProgress = progress;
    }
  }

  applyUsd(rec) {
    const quote = rec.quoteToken?.address;
    const meta = quote ? this.quoteMeta.get(quote.toLowerCase()) : null;
    const native = quote && quote.toLowerCase() === ZERO;
    const quoteDecimals = native ? 18 : meta?.decimals;
    if (native) rec.quoteToken = { ...rec.quoteToken, address: ethers.ZeroAddress, symbol: "BNB", decimals: 18 };
    else if (quote && quote.toLowerCase() === WBNB.toLowerCase()) {
      rec.quoteToken = { ...rec.quoteToken, symbol: meta?.symbol || "WBNB", decimals: quoteDecimals };
    } else if (meta?.symbol) rec.quoteToken = { ...rec.quoteToken, symbol: meta.symbol, decimals: quoteDecimals };
    if (rec.baseToken.decimals == null || quoteDecimals == null || rec.fourLastPrice == null) return;
    const px = usdPerHumanToken({
      lastPrice: rec.fourLastPrice,
      tokenDecimals: rec.baseToken.decimals,
      quoteDecimals,
      quote,
      bnbUsd: this.bnbUsd,
    });
    if (!(px > 0)) return;
    rec.priceUsd = px;
    rec.priceNative = quotePerHumanToken(rec.fourLastPrice, rec.baseToken.decimals, quoteDecimals);
    const cap = capFromSupply(px, rec.totalSupply, rec.baseToken.decimals);
    if (cap != null) {
      rec.marketCap = cap;
      rec.fdv = cap;
      rec.marketCapMethod = "price_x_total_supply";
    }
  }

  publish(token, quiet) {
    const key = token.baseToken.address.toLowerCase();
    const prev = this.launches.get(key);
    const merged = prev ? { ...prev, ...token, baseToken: { ...prev.baseToken, ...token.baseToken } } : token;
    if (prev?.baseToken?.name && !token.baseToken?.name) merged.baseToken.name = prev.baseToken.name;
    if (prev?.baseToken?.symbol && !token.baseToken?.symbol) merged.baseToken.symbol = prev.baseToken.symbol;
    if (prev?.baseToken?.decimals != null && token.baseToken?.decimals == null) merged.baseToken.decimals = prev.baseToken.decimals;
    if (!(Number(token.priceUsd) > 0) && Number(prev?.priceUsd) > 0) merged.priceUsd = prev.priceUsd;
    if (!(Number(token.marketCap) > 0) && Number(prev?.marketCap) > 0) {
      merged.marketCap = prev.marketCap;
      merged.fdv = prev.fdv;
      merged.marketCapMethod = prev.marketCapMethod;
    }
    this.launches.set(key, merged);
    this.dirty = true;
    this.trimBook();
    const needsRead = merged.baseToken.decimals == null || (merged.bscProtocol === "four-v2" && merged.fourMaxOffers == null);
    if (needsRead && !this.queued.has(key)) {
      this.queued.add(key);
      this.enrichQueue.unshift(key);
    }
    if (!prev && !quiet) {
      for (const cb of this.callbacks) {
        try { cb(merged); } catch { /* keep scanning */ }
      }
    }
    return merged;
  }

  trimBook() {
    if (this.launches.size > MAX_BOOK) {
      const ranked = [...this.launches.entries()].sort((a, b) => (b[1].pairCreatedAt || 0) - (a[1].pairCreatedAt || 0));
      this.launches = new Map(ranked.slice(0, MAX_BOOK));
    }
    if (this.seenLogs.size > MAX_SEEN) {
      let removed = 0;
      for (const id of this.seenLogs) {
        this.seenLogs.delete(id);
        if (++removed >= this.seenLogs.size - MAX_SEEN) break;
      }
    }
  }

  loadBook() {
    const book = this.store.load();
    if (book) this.restoreBook(book);
  }

  restoreBook(book) {
    if (!book || Number(book.chainId) !== CHAIN_ID) return;
    const saved = new Map((book.adapters || []).map((row) => [row.id, row]));
    for (const adapter of this.adapters) {
      const prev = saved.get(adapter.id);
      if (!prev) continue;
      if (prev.address) adapter.address = prev.address;
      adapter.startBlock = finiteBlock(prev.startBlock);
      adapter.liveCursor = finiteBlock(prev.liveCursor);
      adapter.historyFloor = finiteBlock(prev.historyFloor);
      const chunk = finiteBlock(prev.chunk);
      if (chunk != null && chunk >= this.minChunk) adapter.chunk = Math.min(this.maxChunk, chunk);
    }
    this.tradeCursor = finiteBlock(book.tradeCursor);
    for (const id of book.seen || []) this.seenLogs.add(String(id));
    for (const token of book.tokens || []) {
      const addr = token?.baseToken?.address;
      if (!addr) continue;
      this.launches.set(String(addr).toLowerCase(), token);
    }
    this.trimBook();
  }

  saveBook(force) {
    if (!force && !this.dirty) return false;
    this.trimBook();
    try {
      this.store.save({
        version: 1,
        chainId: CHAIN_ID,
        deploymentBlock: "unverified",
        adapters: this.adapters.map((adapter) => ({
          id: adapter.id,
          address: adapter.address,
          startBlock: adapter.startBlock,
          liveCursor: adapter.liveCursor,
          historyFloor: adapter.historyFloor,
          chunk: adapter.chunk,
        })),
        tradeCursor: this.tradeCursor,
        tokens: this.getTokens(),
        seen: Array.from(this.seenLogs),
      });
      this.dirty = false;
      return true;
    } catch (err) {
      console.warn("[BSC] book save skipped:", err?.message || err);
      return false;
    }
  }
}

export async function lookupBscLaunch(address) {
  let token;
  try { token = ethers.getAddress(address); } catch { return null; }
  const data = helperIface.encodeFunctionData("getTokenInfo", [token]);
  let raw;
  try {
    raw = await withTimeout(httpRpc(RPC_URLS, "eth_call", [{ to: HELPER, data }, "latest"], 8000), 9000);
  } catch (err) {
    return { error: err?.message || "BSC RPC failed" };
  }
  let info;
  try { info = helperIface.decodeFunctionResult("getTokenInfo", raw); } catch { return null; }
  const version = Number(info.version ?? info[0]);
  const manager = String(info.tokenManager ?? info[1] ?? "");
  if (version !== 1 && version !== 2) return null;
  if (manager.toLowerCase() === ZERO) return null;
  const quote = ethers.getAddress(info.quote ?? info[2]);
  const added = Boolean(info.liquidityAdded ?? info[11]);
  const page = pageFor(token);
  const row = {
    chainId: "bsc",
    dexId: "fourmeme",
    primaryDex: "Four.meme",
    launchPlatform: version === 1 ? "Four.meme V1" : "Four.meme",
    isFourMemeLaunch: true,
    bscProtocol: version === 1 ? "four-v1" : "four-v2",
    isBondingCurve: version === 2 ? !added : true,
    isGraduated: version === 2 ? added : false,
    marketStage: version === 2 && added ? "graduated" : "bonding_curve",
    discoveryMode: "onchain",
    pairAddress: token,
    url: page,
    launchpadDetailUrl: page,
    primaryDexTradingUrl: page,
    baseToken: { address: token, name: "", symbol: "" },
    quoteToken: { address: quote },
    sources: ["Four.meme", "address-lookup"],
    dexes: ["Four.meme"],
    discoveredAt: Date.now(),
  };
  if (version === 2) {
    row.fourLastPrice = (info.lastPrice ?? info[3]).toString();
    row.fourOffers = (info.offers ?? info[7]).toString();
    row.fourMaxOffers = (info.maxOffers ?? info[8]).toString();
    row.bondingProgress = added ? 100 : curveProgress(row.fourOffers, row.fourMaxOffers);
  }
  return row;
}

export function createBscLaunchIndexer(options) {
  return new BscLaunchIndexer(options);
}

const bscGlobal = globalThis;
const bscLaunchIndexer = bscGlobal.__dexhunterBsc ??= new BscLaunchIndexer();
Object.setPrototypeOf(bscLaunchIndexer, BscLaunchIndexer.prototype);

export {
  CHAIN_ID,
  HELPER,
  REGISTRY,
  TM1,
  TM2,
  TOPIC_CREATE,
  TOPIC_OPEN_CREATE,
  TOPIC_OPEN_TRADE,
  TOPIC_OPEN_PHASE,
  BACKFILL_BLOCKS,
  BscLaunchIndexer,
  bscLaunchIndexer,
};
