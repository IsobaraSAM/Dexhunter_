// @ts-nocheck
import { tokenIsCurrency0, isUsdc, quoteDecimalsOrNull, usdPriceOrNull, usdVolumeOrNull, fdvOrNull } from "./portal8-metrics.js";
import { argusLaunchpadUrl } from "./venue-links.js";
// Portal 8 is the only Argus contract that still launches tokens.
// Portals 1–7 are legacy. This reader follows Launched + LaunchMetadata
// from block 22,251,758 and prices them from the hook's v4 pool.
import fs from "fs";
import os from "os";
import path from "path";
import { ethers } from "ethers";

const ARC_CHAIN_ID = 5042;
const ARC_NETWORK = new ethers.Network("arc", ARC_CHAIN_ID);
const PORTAL = "0xeed7559B8A6ABf64427dc41Cb5cc6400109C5D93";
const START_BLOCK = 22251758;
const MULTICALL = "0xcA11bde05977b3631167028862bE2a173976CA11";
const USDC = "0x3600000000000000000000000000000000000000";
const STATE_VIEW = "0xF3334192D15450CdD385c8B70e03f9A6bD9E673b";
const POOL_MANAGER = "0x8366a39CC670B4001A1121B8F6A443A643e40951";
const DAY_BLOCKS = 170000;
const META_TIMEOUT_MS = 15 * 60 * 1000;
const BOOK_PATH = path.join(os.tmpdir(), "dexhunter", "portal8-book.json");

// drpc rejects every eth_getLogs. beamrpc rejects spans over ~1000 blocks.
// Only endpoints that answered a live probe are listed, with their own cap.
const ENDPOINTS = [
  { url: "https://rpc.mainnet.arc.io", maxChunk: 8000 },
  { url: "https://rpc.beamrpc.com", maxChunk: 800 },
];

export const ARC_RPC_URLS = ENDPOINTS.map((e) => e.url);

const portalIface = new ethers.Interface([
  "event Launched(address indexed token, address indexed creator, address hook, address escrow, address locker, uint256 positionId, int24 tickStart, int24 tickBond)",
  "event LaunchMetadata(address indexed token, string imageURI, string website, string twitter, string telegram, string description)",
  "function launchCount() view returns (uint256)",
]);
const TOPIC_LAUNCHED = portalIface.getEvent("Launched").topicHash;
const TOPIC_METADATA = portalIface.getEvent("LaunchMetadata").topicHash;
const ercIface = new ethers.Interface([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
]);
const hookIface = new ethers.Interface([
  "function quoteAsset() view returns (address)",
  "function totalFeeBps() view returns (uint16)",
  "function poolId() view returns (bytes32)",
]);
const stateIface = new ethers.Interface([
  "function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)",
  "function getLiquidity(bytes32 poolId) view returns (uint128 liquidity)",
]);
const swapIface = new ethers.Interface([
  "event Swap(bytes32 indexed id, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)",
]);
const TOPIC_SWAP = swapIface.getEvent("Swap").topicHash;
const multiIface = new ethers.Interface([
  "function aggregate3((address target, bool allowFailure, bytes callData)[] calls) payable returns ((bool success, bytes returnData)[] returnData)",
]);

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

function makeProvider(url) {
  return new ethers.JsonRpcProvider(url, ARC_NETWORK, {
    staticNetwork: true,
    batchMaxCount: 1,
  });
}

function classify(err) {
  const msg = String(err?.shortMessage || err?.error?.message || err?.message || err);
  if (/rate limit|too many requests|429|-32005/i.test(msg)) return "rate";
  if (/too large|10,?000|20,?000|exceeds|block range|query returned more|response size|more than \d+/i.test(msg)) return "range";
  if (/400 bad request|could not coalesce/i.test(msg)) return "reject";
  if (/timeout|ECONN|ENOTFOUND|ETIMEDOUT|ECONNRESET|502|503|530|socket|network/i.test(msg)) return "down";
  return "other";
}

function stamp(log) {
  const raw = log?.blockTimestamp != null ? Number(log.blockTimestamp) : 0;
  if (!raw) return Date.now();
  return raw > 1e12 ? raw : raw * 1000;
}

function usdPerToken(sqrtPriceX96, tokenIsToken0, tokenDecimals, quoteDecimals) {
  if (sqrtPriceX96 <= 0n) return 0;
  const scale = 10n ** 18n;
  const rawScaled = sqrtPriceX96 * sqrtPriceX96 * scale / (1n << 192n);
  if (rawScaled <= 0n) return 0;
  const adj = 10n ** BigInt(Math.max(0, tokenDecimals - quoteDecimals));
  const usdScaled = tokenIsToken0 ? rawScaled * adj : adj * scale * scale / rawScaled;
  const price = Number(usdScaled) / 1e18;
  return Number.isFinite(price) && price > 0 && price < 1e9 ? price : 0;
}

function sqrtAtTick(tick) {
  const value = Math.exp(tick * Math.log(1.0001) / 2);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function applyMarketCap(rec) {
  // Argus defines market cap as price × totalSupply. The whole supply is
  // deposited in the pool, so there is no separate circulating figure.
  // fdvOrNull stays null unless the price is already in USD.
  const cap = fdvOrNull(Number(rec.priceUsd), rec.totalSupply, rec.decimals || 18);
  rec.fdv = cap || void 0;
  rec.marketCap = cap || void 0;
  rec.marketCapMethod = cap ? "price_x_total_supply" : void 0;
}

function liquidityUsd(rec) {
  const L = Number(rec.liquidityRaw);
  const tick = rec.tick;
  if (!(L > 0) || !Number.isFinite(tick)) return null;
  const lower = Math.min(rec.tickStart, rec.tickBond);
  const upper = Math.max(rec.tickStart, rec.tickBond);
  if (!Number.isFinite(lower) || !Number.isFinite(upper) || upper <= lower) return null;
  const sa = sqrtAtTick(lower);
  const sb = sqrtAtTick(upper);
  const sp = sqrtAtTick(tick);
  if (!(sa > 0) || !(sb > 0) || !(sp > 0)) return null;
  let amount0 = 0;
  let amount1 = 0;
  if (tick < lower) amount0 = L * (sb - sa) / (sa * sb);
  else if (tick >= upper) amount1 = L * (sb - sa);
  else {
    amount0 = L * (sb - sp) / (sp * sb);
    amount1 = L * (sp - sa);
  }
  const quoteDec = Number.isFinite(rec.quoteDecimals) ? rec.quoteDecimals : null;
  const tokenDec = rec.decimals || 18;
  const price = rec.priceUsd || 0;
  // Refuse to invent a USD liquidity figure when quote decimals or USD price are unknown.
  if (quoteDec == null || !(price > 0)) return null;
  const quoteAmount = rec.tokenIs0 ? amount1 : amount0;
  const tokenAmount = rec.tokenIs0 ? amount0 : amount1;
  const quoteUsd = quoteAmount / 10 ** quoteDec;
  const tokenSide = tokenAmount / 10 ** tokenDec * price;
  const total = quoteUsd + tokenSide;
  if (!Number.isFinite(total) || total < 0 || total > 1e12) return null;
  return total;
}

export async function lookupArgusLaunch(address) {
  let token;
  try {
    token = ethers.getAddress(address);
  } catch {
    return null;
  }
  const launchIface = new ethers.Interface([
    "function launches(address) view returns (address hook, address escrow, address locker, uint256 positionId, int24 tickStart, int24 tickBond, bool tokenIsToken0)",
  ]);
  const data = launchIface.encodeFunctionData("launches", [token]);
  let decoded = null;
  let lastError = null;
  for (const url of ARC_RPC_URLS) {
    try {
      const raw = await withTimeout(makeProvider(url).call({ to: PORTAL, data }), 7000);
      decoded = launchIface.decodeFunctionResult("launches", raw);
      break;
    } catch (err) {
      lastError = err;
    }
  }
  if (!decoded) return { error: lastError?.message || "Argus RPC failed" };
  const hook = decoded[0];
  const escrow = decoded[1];
  const locker = decoded[2];
  if (!hook || hook === ethers.ZeroAddress || !escrow || escrow === ethers.ZeroAddress || !locker || locker === ethers.ZeroAddress) {
    return null;
  }
  let name = "";
  let symbol = "";
  try {
    const provider = makeProvider(ARC_RPC_URLS[0]);
    const erc = new ethers.Contract(token, ercIface, provider);
    const [n, s] = await withTimeout(Promise.all([
      erc.name().catch(() => ""),
      erc.symbol().catch(() => ""),
    ]), 7000);
    name = String(n || "").trim();
    symbol = String(s || "").trim();
  } catch {
    // The launch is real even when the name read fails.
  }
  if (/^0x[a-fA-F0-9]{40}$/.test(name)) name = "";
  return {
    chainId: "arc",
    dexId: "argus",
    primaryDex: "Argus",
    primaryDexLogo: "/argus.png",
    url: argusLaunchpadUrl(token),
    primaryDexTradingUrl: argusLaunchpadUrl(token),
    pairAddress: hook,
    baseToken: { address: token, name, symbol },
    quoteToken: undefined, // quote is resolved by the full reader; do not assume USDC
    sources: ["Argus", "Portal 8", "address-lookup"],
    dexes: ["Argus"],
    isArgusLaunch: true,
    launchPlatform: "Argus",
    argusPortalId: 8,
    argusHookAddress: hook,
    argusLockerAddress: locker,
    discoveryMode: "onchain",
    marketStage: "pool",
    isGraduated: true,
    isBondingCurve: false,
    discoveredAt: Date.now(),
  };
}

export function startArgusChainScan(opts) {
  const root = globalThis.process || globalThis;
  if (typeof root.__portal8Stop === "function") {
    try { root.__portal8Stop(); } catch { /* previous scan already gone */ }
  }

  const slots = ENDPOINTS.map((endpoint) => ({
    url: endpoint.url,
    maxChunk: endpoint.maxChunk,
    provider: makeProvider(endpoint.url),
    coolUntil: 0,
    fails: 0,
  }));
  const primary = slots[0];
  let stopped = false;
  let ticking = false;
  let tickN = 0;
  let liveCursor = null;
  let historyFloor = null;
  let swapFloor = null;
  let swapReady = false;
  let backoffUntil = 0;
  let useMulticall = true;
  let dirty = false;
  let lastSave = 0;
  const seenLogs = new Set();
  const launches = new Map();
  const byPool = new Map();
  const earlyMeta = new Map();
  const pendingMeta = new Map();
  const enrichQueue = [];
  const queued = new Set();
  const volumeByPool = new Map();

  loadBook();

  const timer = setInterval(() => {
    void tick();
  }, 700);
  void tick();
  void readLaunchCount();

  function stop() {
    stopped = true;
    clearInterval(timer);
    saveBook(true);
    for (const slot of slots) slot.provider.destroy?.();
    if (root.__portal8Stop === stop) root.__portal8Stop = null;
  }
  root.__portal8Stop = stop;

  function pickLogSlot() {
    const now = Date.now();
    return slots.find((slot) => slot.coolUntil <= now) || null;
  }

  function cool(slot, ms) {
    slot.fails += 1;
    slot.coolUntil = Date.now() + ms;
  }

  async function readLaunchCount() {
    try {
      const data = await primary.provider.call({
        to: PORTAL,
        data: portalIface.encodeFunctionData("launchCount"),
      });
      const count = portalIface.decodeFunctionResult("launchCount", data)[0];
      console.log(`[Portal8] launchCount=${count} book=${launches.size} via ${slots.map((s) => s.url).join(", ")}`);
    } catch (err) {
      console.warn("[Portal8] launchCount failed:", err?.shortMessage || err?.message || err);
    }
  }

  async function tick() {
    if (stopped || ticking || Date.now() < backoffUntil) return;
    ticking = true;
    tickN += 1;
    try {
      const head = await withTimeout(primary.provider.getBlockNumber(), 8000);
      if (liveCursor == null) {
        liveCursor = head;
        historyFloor = head;
      }
      if (swapFloor == null) swapFloor = head;
      if (head > liveCursor) {
        const got = await pullLogs(liveCursor + 1, head, "forward");
        if (got != null) liveCursor = got;
      }
      if (historyFloor >= START_BLOCK) {
        const got = await pullLogs(START_BLOCK, historyFloor, "back");
        if (got != null) historyFloor = got - 1;
      }
      if (enrichQueue.length) await enrichSome(primary.provider);
      // Volume used to wait until 3,000 launches were stored. Portal 8 has
      // not reached that count, so 24h swaps never started. Interleave a
      // small swap window immediately, and scan it more often once history
      // has walked back to the Portal 8 deploy block.
      const historyDone = historyFloor != null && historyFloor < START_BLOCK;
      if (launches.size > 0 && (historyDone ? tickN % 2 === 0 : tickN % 6 === 0)) {
        await pullSwaps(head);
      }
      evictPending();
      if (dirty && Date.now() - lastSave > 15000) saveBook(false);
    } catch (err) {
      const kind = classify(err);
      if (kind === "rate") backoffUntil = Date.now() + 1200 + Math.floor(Math.random() * 1800);
      else if (kind === "down" || kind === "reject") backoffUntil = Date.now() + 600;
      else console.warn("[Portal8] tick:", err?.shortMessage || err?.message || err);
    } finally {
      ticking = false;
    }
  }

  async function pullLogs(from, to, dir) {
    if (from > to) return to;
    const slot = pickLogSlot();
    if (!slot) return null;
    const span = Math.min(slot.maxChunk, to - from + 1);
    const start = dir === "back" ? to - span + 1 : from;
    const end = dir === "back" ? to : from + span - 1;
    try {
      const logs = await withTimeout(slot.provider.send("eth_getLogs", [{
        address: PORTAL,
        topics: [[TOPIC_LAUNCHED, TOPIC_METADATA]],
        fromBlock: ethers.toQuantity(start),
        toBlock: ethers.toQuantity(end),
      }]), 12000);
      logs.sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber) || Number(a.logIndex) - Number(b.logIndex));
      for (const log of logs) ingest(log);
      slot.fails = 0;
      return dir === "back" ? start : end;
    } catch (err) {
      const kind = classify(err);
      if (kind === "range" || kind === "reject") {
        slot.maxChunk = Math.max(400, Math.floor(slot.maxChunk / 2));
        if (slot.maxChunk <= 400) cool(slot, 20000);
        return null;
      }
      if (kind === "rate") {
        backoffUntil = Date.now() + 1400 + Math.floor(Math.random() * 2000);
        cool(slot, 2500);
        return null;
      }
      cool(slot, kind === "down" ? 4000 : 1500);
      return null;
    }
  }

  async function pullSwaps(head) {
    const dayFloor = Math.max(START_BLOCK, head - DAY_BLOCKS);
    if (swapReady && head <= swapFloor) return;
    const slot = primary;
    const span = Math.min(400, slot.maxChunk);
    let start;
    let end;
    if (!swapReady && swapFloor > dayFloor) {
      end = swapFloor;
      start = Math.max(dayFloor, end - span + 1);
    } else {
      start = Math.max(swapFloor, head - span + 1);
      end = head;
    }
    if (start > end) return;
    try {
      const logs = await withTimeout(slot.provider.send("eth_getLogs", [{
        address: POOL_MANAGER,
        topics: [TOPIC_SWAP],
        fromBlock: ethers.toQuantity(start),
        toBlock: ethers.toQuantity(end),
      }]), 12000);
      for (const log of logs) applySwap(log);
      if (!swapReady) {
        swapFloor = start - 1;
        if (swapFloor <= dayFloor) {
          swapReady = true;
          swapFloor = head;
          for (const rec of launches.values()) {
            assignVolume(rec);
            rec.volumeComplete = true;
            emit(rec);
          }
          dirty = true;
          console.log("[Portal8] 24h swap window covered");
        }
      } else {
        swapFloor = end;
      }
    } catch (err) {
      const kind = classify(err);
      if (kind === "rate") backoffUntil = Date.now() + 1500 + Math.floor(Math.random() * 1500);
    }
  }

  function applySwap(log) {
    let parsed;
    try {
      parsed = swapIface.parseLog({ topics: log.topics, data: log.data });
    } catch {
      return;
    }
    const poolId = String(parsed.args.id).toLowerCase();
    const bucket = volumeByPool.get(poolId) || { a0: 0, a1: 0 };
    const a0 = Math.abs(Number(parsed.args.amount0));
    const a1 = Math.abs(Number(parsed.args.amount1));
    if (Number.isFinite(a0)) bucket.a0 += a0;
    if (Number.isFinite(a1)) bucket.a1 += a1;
    volumeByPool.set(poolId, bucket);
    const rec = byPool.get(poolId);
    if (!rec) return;
    assignVolume(rec);
    if (swapReady) emit(rec);
  }

  function assignVolume(rec) {
    const bucket = volumeByPool.get((rec.poolId || "").toLowerCase());
    if (!bucket) return;
    const quoteRaw = rec.tokenIs0 ? bucket.a1 : bucket.a0;
    rec.volumeQuoteRaw = quoteRaw;
    rec.volume24h = usdVolumeOrNull(quoteRaw, rec.quote, rec.quoteDecimals);
    if (swapReady) rec.volumeComplete = true;
  }

  function ingest(log) {
    const blockNumber = Number(log.blockNumber);
    const logIndex = Number(log.logIndex ?? 0);
    const dedupeKey = `${blockNumber}:${logIndex}`;
    if (seenLogs.has(dedupeKey)) return;
    let parsed;
    try {
      parsed = portalIface.parseLog({ topics: log.topics, data: log.data });
    } catch {
      return;
    }
    if (!parsed) return;
    seenLogs.add(dedupeKey);
    const when = stamp(log);
    const token = ethers.getAddress(parsed.args.token);
    if (parsed.name === "LaunchMetadata") {
      applyMeta(token, parsed.args, when);
      return;
    }
    if (parsed.name !== "Launched") return;
    const id = token.toLowerCase();
    const prior = earlyMeta.get(id);
    earlyMeta.delete(id);
    const rec = launches.get(id) || { token };
    rec.token = token;
    rec.creator = ethers.getAddress(parsed.args.creator);
    rec.hook = ethers.getAddress(parsed.args.hook);
    rec.escrow = ethers.getAddress(parsed.args.escrow);
    rec.locker = ethers.getAddress(parsed.args.locker);
    rec.positionId = parsed.args.positionId.toString();
    rec.tickStart = Number(parsed.args.tickStart);
    rec.tickBond = Number(parsed.args.tickBond);
    rec.tx = log.transactionHash;
    rec.blockNumber = blockNumber;
    rec.when = rec.when && rec.when < when ? rec.when : when;
    // Orientation is unknown until the real quote asset is resolved. Do not assume USDC.
    if (prior) Object.assign(rec, prior);
    launches.set(id, rec);
    if (rec.poolId) byPool.set(rec.poolId.toLowerCase(), rec);
    if (!rec.metaAt) pendingMeta.set(id, pendingMeta.get(id) || Date.now());
    if (!rec.enriched && !queued.has(id)) {
      queued.add(id);
      enrichQueue.push(id);
    }
    dirty = true;
    emit(rec);
    if (launches.size % 250 === 0) console.log(`[Portal8] indexed ${launches.size} launches`);
  }

  function applyMeta(token, args, when) {
    const id = token.toLowerCase();
    const patch = {
      image: args.imageURI ? String(args.imageURI) : void 0,
      website: args.website ? String(args.website) : void 0,
      twitter: args.twitter ? String(args.twitter) : void 0,
      telegram: args.telegram ? String(args.telegram) : void 0,
      description: args.description ? String(args.description) : void 0,
      metaAt: when,
    };
    const rec = launches.get(id);
    if (!rec) {
      earlyMeta.set(id, { ...earlyMeta.get(id), ...patch });
      return;
    }
    Object.assign(rec, patch);
    pendingMeta.delete(id);
    dirty = true;
    emit(rec);
  }

  function emit(rec) {
    if (!rec?.token) return;
    const socials = [
      ...rec.twitter ? [{ type: "twitter", url: rec.twitter }] : [],
      ...rec.telegram ? [{ type: "telegram", url: rec.telegram }] : [],
    ];
    const image = rec.image && rec.image !== "/argus.svg" && !String(rec.image).endsWith("/argus.svg") ? rec.image : undefined;
    const trade = argusLaunchpadUrl(rec.token);
    opts.upsert({
      chainId: "arc",
      dexId: "argus",
      primaryDex: "Argus",
      primaryDexLogo: "/argus.png",
      url: trade || void 0,
      primaryDexTradingUrl: trade || void 0,
      pairAddress: rec.poolId || rec.hook || rec.token,
      baseToken: {
        address: rec.token,
        name: rec.name || "",
        symbol: rec.symbol || "",
      },
      quoteToken: rec.quote ? {
        address: rec.quote,
        name: rec.quote.toLowerCase() === USDC.toLowerCase() ? "USDC" : "Quote",
        symbol: rec.quote.toLowerCase() === USDC.toLowerCase() ? "USDC" : "",
        decimals: Number.isFinite(rec.quoteDecimals) ? rec.quoteDecimals : void 0,
      } : void 0,
      priceUsd: rec.priceUsd ? String(rec.priceUsd) : void 0,
      priceQuote: rec.priceQuote ? String(rec.priceQuote) : void 0,
      marketCap: rec.marketCap,
      fdv: rec.fdv,
      marketCapMethod: rec.marketCapMethod,
      liquidity: rec.liquidityUsd != null ? { usd: rec.liquidityUsd } : void 0,
      totalLiquidityUsd: rec.liquidityUsd,
      volumeComplete: rec.volumeComplete === true && Number.isFinite(rec.volume24h),
      volume: Number.isFinite(rec.volume24h) ? { h24: rec.volume24h } : void 0,
      totalVolume24h: Number.isFinite(rec.volume24h) ? rec.volume24h : void 0,
      marketUpdatedAt: rec.quotedAt,
      pairCreatedAt: rec.when,
      creator: rec.creator,
      txHash: rec.tx,
      info: {
        imageUrl: image,
        description: rec.description,
        websites: rec.website ? [{ type: "website", url: rec.website }] : void 0,
        socials: socials.length ? socials : void 0,
      },
      twitter: rec.twitter,
      telegram: rec.telegram,
      website: rec.website,
      sources: ["Argus", "Portal 8"],
      dexes: ["Argus"],
      isArgusLaunch: true,
      launchPlatform: "Argus",
      argusPortalId: 8,
      argusPortalFamily: "v8",
      argusPortalAddress: PORTAL,
      argusHookAddress: rec.hook,
      argusLockerAddress: rec.locker,
      argusPositionId: rec.positionId,
      argusPoolId: rec.poolId,
      argusTotalFeeBps: rec.totalFeeBps,
      discoveredAt: rec.discoveredAt || Date.now(),
      discoveryMode: "onchain",
      metadataPending: !rec.metaAt,
    });
  }

  function evictPending() {
    const now = Date.now();
    for (const [id, since] of pendingMeta) {
      if (now - since < META_TIMEOUT_MS) continue;
      pendingMeta.delete(id);
      const rec = launches.get(id);
      if (rec && !rec.metaAt) {
        rec.metadataMissed = true;
        emit(rec);
      }
    }
  }

  async function enrichSome(provider) {
    const batch = [];
    while (enrichQueue.length && batch.length < 20) {
      const id = enrichQueue.shift();
      queued.delete(id);
      const rec = launches.get(id);
      if (!rec || rec.enriched) continue;
      batch.push(rec);
    }
    if (!batch.length) return;
    try {
      if (useMulticall) await enrichMulticall(provider, batch);
      else await enrichPlain(provider, batch);
    } catch (err) {
      const kind = classify(err);
      if (/revert|multicall|CALL_EXCEPTION/i.test(String(err?.message || err))) useMulticall = false;
      for (const rec of batch) {
        const id = rec.token.toLowerCase();
        if (!rec.enriched && !queued.has(id)) {
          queued.add(id);
          enrichQueue.push(id);
        }
      }
      if (kind === "rate") backoffUntil = Date.now() + 1400 + Math.floor(Math.random() * 1600);
    }
  }

  function decodeRow(row, iface, fn) {
    const ok = row.success ?? row[0];
    const ret = row.returnData ?? row[1];
    if (!ok || !ret || ret === "0x") return null;
    try {
      return iface.decodeFunctionResult(fn, ret)[0];
    } catch {
      return null;
    }
  }

  async function aggregate(provider, calls) {
    const raw = await withTimeout(provider.call({ to: MULTICALL, data: multiIface.encodeFunctionData("aggregate3", [calls]) }), 8000);
    return multiIface.decodeFunctionResult("aggregate3", raw)[0];
  }

  async function enrichMulticall(provider, batch) {
    const calls = [];
    const plan = [];
    for (const rec of batch) {
      const fields = [
        ["name", rec.token, ercIface, "name"],
        ["symbol", rec.token, ercIface, "symbol"],
        ["decimals", rec.token, ercIface, "decimals"],
        ["supply", rec.token, ercIface, "totalSupply"],
      ];
      if (rec.hook) {
        fields.push(["quote", rec.hook, hookIface, "quoteAsset"]);
        fields.push(["fee", rec.hook, hookIface, "totalFeeBps"]);
        fields.push(["pool", rec.hook, hookIface, "poolId"]);
      }
      for (const [field, target, iface, fn] of fields) {
        calls.push({ target, allowFailure: true, callData: iface.encodeFunctionData(fn) });
        plan.push({ rec, field, iface, fn });
      }
    }
    const decoded = await aggregate(provider, calls);
    for (let i = 0; i < plan.length; i++) {
      const value = decodeRow(decoded[i], plan[i].iface, plan[i].fn);
      if (value == null) continue;
      const { rec, field } = plan[i];
      if (field === "name") rec.name = String(value);
      else if (field === "symbol") rec.symbol = String(value);
      else if (field === "decimals") rec.decimals = Number(value);
      else if (field === "supply") rec.totalSupply = value.toString();
      else if (field === "quote") {
        rec.quote = ethers.getAddress(value);
        const oriented = tokenIsCurrency0(rec.token, rec.quote);
        if (oriented != null) rec.tokenIs0 = oriented;
      }
      else if (field === "fee") rec.totalFeeBps = Number(value);
      else if (field === "pool") {
        rec.poolId = ethers.hexlify(value);
        byPool.set(rec.poolId.toLowerCase(), rec);
      }
    }
    await quoteMulticall(provider, batch.filter((rec) => rec.poolId));
    for (const rec of batch) {
      rec.enriched = Boolean(rec.name || rec.symbol);
      const id = rec.token.toLowerCase();
      if (!rec.enriched && !queued.has(id)) {
        queued.add(id);
        enrichQueue.push(id);
      }
      dirty = true;
      emit(rec);
    }
  }

  async function quoteMulticall(provider, batch) {
    if (!batch.length) return;
    const calls = [];
    const plan = [];
    for (const rec of batch) {
      calls.push({ target: STATE_VIEW, allowFailure: true, callData: stateIface.encodeFunctionData("getSlot0", [rec.poolId]) });
      plan.push({ rec, field: "slot" });
      calls.push({ target: STATE_VIEW, allowFailure: true, callData: stateIface.encodeFunctionData("getLiquidity", [rec.poolId]) });
      plan.push({ rec, field: "liq" });
    }
    const decoded = await aggregate(provider, calls);
    for (let i = 0; i < plan.length; i++) {
      const row = decoded[i];
      const ok = row.success ?? row[0];
      const ret = row.returnData ?? row[1];
      if (!ok || !ret || ret === "0x") continue;
      const { rec, field } = plan[i];
      try {
        if (field === "slot") {
          const slot = stateIface.decodeFunctionResult("getSlot0", ret);
          rec.quoteDecimals = quoteDecimalsOrNull(rec.quote, rec.quoteDecimals);
          const quoteDec = Number.isFinite(rec.quoteDecimals) ? rec.quoteDecimals : null;
          rec.tick = Number(slot[1]);
          const rawPrice = quoteDec != null
            ? usdPerToken(BigInt(slot[0]), Boolean(rec.tokenIs0), rec.decimals || 18, quoteDec)
            : 0;
          rec.priceQuote = rawPrice > 0 ? rawPrice : void 0;
          rec.priceUsd = usdPriceOrNull(rawPrice, rec.quote);
          applyMarketCap(rec);
        } else {
          rec.liquidityRaw = stateIface.decodeFunctionResult("getLiquidity", ret)[0].toString();
        }
      } catch {
        // One pool read must not drop the token.
      }
    }
    for (const rec of batch) {
      const usd = liquidityUsd(rec);
      if (usd != null) rec.liquidityUsd = usd;
      if (rec.priceUsd) rec.quotedAt = Date.now();
      assignVolume(rec);
    }
  }

  async function enrichPlain(provider, batch) {
    for (const rec of batch) {
      const erc = new ethers.Contract(rec.token, ercIface, provider);
      const [name, symbol] = await Promise.all([
        erc.name().catch(() => ""),
        erc.symbol().catch(() => ""),
      ]);
      if (name) rec.name = String(name);
      if (symbol) rec.symbol = String(symbol);
      rec.enriched = Boolean(rec.name || rec.symbol);
      emit(rec);
    }
  }

  function loadBook() {
    try {
      if (!fs.existsSync(BOOK_PATH)) return;
      const book = JSON.parse(fs.readFileSync(BOOK_PATH, "utf8"));
      if (Number.isFinite(book.historyFloor)) historyFloor = book.historyFloor;
      if (Number.isFinite(book.liveCursor)) liveCursor = book.liveCursor;
      if (Number.isFinite(book.swapFloor)) swapFloor = book.swapFloor;
      swapReady = Boolean(book.swapReady);
      for (const row of book.tokens || []) {
        if (!row?.token) continue;
        const id = row.token.toLowerCase();
        launches.set(id, row);
        applyMarketCap(row);
        if (row.poolId) byPool.set(row.poolId.toLowerCase(), row);
        if (!row.enriched && !queued.has(id)) {
          queued.add(id);
          enrichQueue.push(id);
        }
        emit(row);
      }
      console.log(`[Portal8] restored ${launches.size} launches from book`);
    } catch (err) {
      console.warn("[Portal8] book load skipped:", err?.message || err);
    }
  }

  function saveBook(force) {
    if (!force && !dirty) return;
    try {
      fs.mkdirSync(path.dirname(BOOK_PATH), { recursive: true });
      const tokens = [];
      for (const rec of launches.values()) {
        tokens.push({
          token: rec.token,
          name: rec.name,
          symbol: rec.symbol,
          hook: rec.hook,
          escrow: rec.escrow,
          locker: rec.locker,
          creator: rec.creator,
          positionId: rec.positionId,
          tickStart: rec.tickStart,
          tickBond: rec.tickBond,
          tx: rec.tx,
          blockNumber: rec.blockNumber,
          when: rec.when,
          tokenIs0: rec.tokenIs0,
          poolId: rec.poolId,
          quote: rec.quote,
          quoteDecimals: rec.quoteDecimals,
          decimals: rec.decimals,
          totalSupply: rec.totalSupply,
          totalFeeBps: rec.totalFeeBps,
          image: rec.image,
          website: rec.website,
          twitter: rec.twitter,
          telegram: rec.telegram,
          description: rec.description,
          metaAt: rec.metaAt,
          priceUsd: rec.priceUsd,
          priceQuote: rec.priceQuote,
          marketCap: rec.marketCap,
          fdv: rec.fdv,
          liquidityUsd: rec.liquidityUsd,
          tick: rec.tick,
          volume24h: rec.volume24h,
          volumeComplete: rec.volumeComplete,
          quotedAt: rec.quotedAt,
          enriched: rec.enriched,
          discoveredAt: rec.discoveredAt || Date.now(),
        });
      }
      const tmp = `${BOOK_PATH}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify({
        historyFloor,
        liveCursor,
        swapFloor,
        swapReady,
        tokens,
      }));
      fs.renameSync(tmp, BOOK_PATH);
      dirty = false;
      lastSave = Date.now();
    } catch (err) {
      console.warn("[Portal8] book save skipped:", err?.message || err);
    }
  }

  return stop;
}
