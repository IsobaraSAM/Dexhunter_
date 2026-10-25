// @ts-nocheck
import { ethers } from "ethers";
import {
  TOPIC_LAUNCHED,
  TOPIC_LAUNCH_METADATA
} from "../src/integrations/argus-portal8/contracts.js";
import {
  ARGUS_PORTALS,
  ARGUS_SHARED_INFRA,
  ARGUS_V3_ABI,
  ARGUS_V4_ABI,
  ARC_CHAIN_ID,
  safeAddress
} from "./argus-engine.js";
const ARC_RPC_URLS = [
  "https://rpc.mainnet.arc.io",
  "https://arc.drpc.org",
  "https://rpc.beamrpc.com"
];
const V4_TOPIC = "0x1d8917231579f8ce39407f0d616f36f357b07329b0ce5164d0754ac15145ce0a";
const V3_TOPIC = "0x875522b092d9e19a1de359e4bd218090d582fa521c9733889acf1a5ff1941255";
const CHUNK = 4e3;
const RECENT_WINDOW = 16e4;
const BLOCK_MS = 500;
const v4 = new ethers.Interface(ARGUS_V4_ABI);
const v3 = new ethers.Interface(ARGUS_V3_ABI);
const v8 = new ethers.Interface([
  "event Launched(address indexed token, address indexed creator, address hook, address escrow, address locker, uint256 positionId, int24 tickStart, int24 tickBond)",
  "event LaunchMetadata(address indexed token, string imageURI, string website, string twitter, string telegram, string description)"
]);
const erc20 = new ethers.Interface([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)"
]);
const stateViewAbi = [
  "function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)"
];
const swapIface = new ethers.Interface([
  "event Swap(bytes32 indexed id, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)"
]);
const SWAP_TOPIC = "0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f";
const USDC = ARGUS_SHARED_INFRA.usdc.toLowerCase();
const DAY_BLOCKS = 172800;
const VOL_BUCKET = 2e3;
function startArgusChainScan(opts) {
  const portals = ARGUS_PORTALS.map((def) => ({
    def,
    family: def.family,
    topic: def.family === "v8" ? TOPIC_LAUNCHED : def.family === "v3" ? V3_TOPIC : V4_TOPIC,
    backCursor: null,
    liveCursor: null,
    historyBlocked: false,
    verified: false
  }));
  const enrich = [];
  let stopped = false;
  let ticking = false;
  let backoffUntil = 0;
  let marketTick = 0;
  let headSample = { block: 0, timeMs: 0 };
  let rr = 0;
  const jobByToken = /* @__PURE__ */ new Map();
  const byPool = /* @__PURE__ */ new Map();
  const pending = [];
  const refresh = [];
  const volBuckets = /* @__PURE__ */ new Map();
  let swapCursor = null;
  let swapLive = null;
  let volumeReady = false;
  let storedTokens = 0;
  function withTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
      const timerId = setTimeout(() => reject(new Error("timeout")), ms);
      Promise.resolve(promise).then(
        (value) => {
          clearTimeout(timerId);
          resolve(value);
        },
        (err) => {
          clearTimeout(timerId);
          reject(err);
        }
      );
    });
  }
  function remember(job) {
    const key = job.token.toLowerCase();
    const prev = jobByToken.get(key);
    if (prev) {
      prev.poolId = job.poolId || prev.poolId;
      prev.poolAddr = job.poolAddr || prev.poolAddr;
      prev.quote = job.quote || prev.quote;
      prev.hook = job.hook || prev.hook;
      if (prev.poolId) byPool.set(prev.poolId.toLowerCase(), prev);
      if ((prev.poolId || prev.poolAddr) && !prev.quotedAt && !prev.queued) {
        prev.queued = true;
        pending.push(prev);
      }
      return;
    }
    jobByToken.set(key, job);
    if (job.poolId) byPool.set(job.poolId.toLowerCase(), job);
    if (job.poolId || job.poolAddr) {
      job.queued = true;
      pending.push(job);
    }
  }
  function publishMarket(job, price, marketCap, head) {
    const vol = job.poolId ? volumeOf(job.poolId, head) : void 0;
    opts.upsert({
      chainId: "arc",
      dexId: "argus",
      primaryDex: "Argus",
      launchPlatform: "Argus",
      isArgusLaunch: true,
      pairAddress: job.poolId || job.poolAddr || job.token,
      baseToken: { address: job.token, name: "Argus", symbol: "ARC" },
      quoteToken: {
        address: ARGUS_SHARED_INFRA.usdc,
        name: "USDC",
        symbol: "USDC"
      },
      priceNative: String(price),
      priceUsd: String(price),
      marketCap,
      fdv: marketCap,
      marketCapMethod: marketCap ? "spot_x_total_supply" : void 0,
      ...vol !== void 0 && (volumeReady || vol > 0) ? { volume: { h24: vol }, totalVolume24h: vol } : {}
    });
  }
  const timer = setInterval(() => {
    void tick();
  }, 450);
  void tick();
  function stop() {
    stopped = true;
    clearInterval(timer);
  }
  async function tick() {
    if (stopped || ticking) return;
    if (Date.now() < backoffUntil) return;
    ticking = true;
    try {
      await withTimeout(opts.pool.call(async (provider) => {
        const head = await withTimeout(provider.getBlockNumber(), 8000);
        if (!headSample.block || head - headSample.block > 40) {
          try {
            const block = await provider.getBlock(head);
            if (block) headSample = { block: head, timeMs: Number(block.timestamp) * 1e3 };
          } catch {
            headSample = { block: head, timeMs: Date.now() };
          }
        }
        await verifyPortals(provider, storedTokens < 2500 ? portals.filter((p) => p.def.id === 8) : portals);
        const jobs = nextRanges(head).slice(0, 1);
        if (jobs.length === 0) return;
        await Promise.all(
          jobs.map(async (job) => {
            try {
              const logs = await withTimeout(provider.getLogs({
                address: job.portal.def.address,
                topics: job.portal.family === "v8" ? [[TOPIC_LAUNCHED, TOPIC_LAUNCH_METADATA]] : [job.portal.topic],
                fromBlock: job.from,
                toBlock: job.to
              }), 8000);
              let stored = 0;
              for (const log of logs) {
                if (storeLog(job.portal, log, head)) stored += 1;
              }
              if (job.kind === "back") {
                job.portal.backCursor = job.from - 1;
                if (job.portal.liveCursor == null || job.to > job.portal.liveCursor) {
                  job.portal.liveCursor = job.to;
                }
              } else {
                job.portal.liveCursor = job.to;
              }
              if (stored > 0) {
                storedTokens += stored;
                if (storedTokens % 50 < stored) {
                  console.log(`[ArgusChain] indexed ${storedTokens} launch logs`);
                }
              }
            } catch (err) {
              const msg = String(err?.shortMessage || err?.message || err);
              if (/pruned|history unavailable/i.test(msg)) {
                job.portal.historyBlocked = true;
                console.warn(`[ArgusChain] ${job.portal.def.label} history pruned at ${job.from}. Live scan continues.`);
                return;
              }
              // "rate limit exceeded" used to match /limit/ and freeze the cursor.
              if (/rate limit|too many requests|429|403 forbidden|timeout|ETIMEDOUT/i.test(msg)) {
                backoffUntil = Date.now() + 2500;
                return;
              }
              if (/too large|exceeds max|block range|query returned more|response size|more than \d+ blocks|400 bad request/i.test(msg)) {
                const span = job.portal.span || CHUNK;
                if (span <= 500) {
                  backoffUntil = Date.now() + 2000;
                  return;
                }
                job.portal.span = Math.max(500, Math.floor(span / 2));
                console.warn(`[ArgusChain] ${job.portal.def.label} range rejected ${job.from}-${job.to}; next span ${job.portal.span}`);
                return;
              }
              throw err;
            }
          })
        );
      }), 12000);
    } catch (err) {
      const msg = String(err?.shortMessage || err?.message || err || "");
      if (/rate limit|too many requests|429|cooling|unreachable/i.test(msg)) {
        backoffUntil = Date.now() + 2500;
      }
      opts.onEnrichFail?.();
      const now = Date.now();
      if (now - (headSample.warnAt || 0) > 3e4) {
        headSample.warnAt = now;
        console.warn("[ArgusChain] tick unresolved:", err?.shortMessage || err?.message || err);
      }
    } finally {
      ticking = false;
    }
  }
  async function readMarkets(provider, head) {
    try {
      await quoteSome(provider, head);
      await scanSwaps(provider, head);
    } catch (err) {
      console.warn("[ArgusChain] market read skipped:", err?.shortMessage || err?.message || err);
    }
  }
  async function verifyPortals(provider, list) {
    for (const portal of list) {
      if (portal.verified) continue;
      try {
        const code = await withTimeout(provider.getCode(portal.def.address), 8000);
        portal.verified = true;
        if (!code || code === "0x") {
          portal.historyBlocked = true;
          portal.liveCursor = Number.MAX_SAFE_INTEGER;
          console.warn(`[ArgusChain] ${portal.def.label} has no bytecode on chain ${ARC_CHAIN_ID}. Not scanning.`);
        }
      } catch {
        continue;
      }
    }
  }
  function nextRanges(head) {
    const out = [];
    const recentFloor = Math.max(0, head - RECENT_WINDOW);
    const catchingUp = storedTokens < 2500;
    const active = catchingUp ? portals.filter((p) => p.def.id === 8) : portals;
    const spanCount = active.length || 1;
    for (let n = 0; n < spanCount && out.length < 1; n++) {
      const portal = active[(rr + n) % spanCount];
      if (portal.historyBlocked && portal.liveCursor != null && portal.liveCursor >= head - 2) continue;
      if (!portal.verified) continue;
      if (portal.backCursor == null) {
        const to = head;
        const from = Math.max(portal.def.startBlock, head - (portal.span || CHUNK) + 1);
        out.push({ portal, from, to, kind: "back" });
        continue;
      }
      if (!catchingUp && portal.liveCursor != null && portal.liveCursor < head - 2) {
        const from = portal.liveCursor + 1;
        const to = Math.min(head, from + (portal.span || CHUNK) - 1);
        out.push({ portal, from, to, kind: "live" });
        continue;
      }
      if (!portal.historyBlocked && portal.backCursor > portal.def.startBlock) {
        const to = portal.backCursor;
        const from = Math.max(portal.def.startBlock, to - (portal.span || CHUNK) + 1);
        if (from <= to) out.push({ portal, from, to, kind: "back" });
      }
    }
    out.sort((a, b) => {
      const aRecent = a.to >= recentFloor ? 0 : 1;
      const bRecent = b.to >= recentFloor ? 0 : 1;
      return aRecent - bRecent;
    });
    rr = (rr + 1) % portals.length;
    return out;
  }
  function createdAt(blockNumber, head) {
    if (!headSample.timeMs) return Date.now();
    const blocksAgo = Math.max(0, headSample.block - blockNumber);
    return headSample.timeMs - blocksAgo * BLOCK_MS;
  }
  function storeLog(portal, log, head) {
    try {
      if (portal.family === "v8") return storeV8(portal, log, head);
      const iface = portal.family === "v3" ? v3 : v4;
      const parsed = iface.parseLog(log);
      if (!parsed || parsed.name !== "TokenCreated" && parsed.name !== "PartsDeployed") return false;
      const args = parsed.args;
      const token = safeAddress(args.token);
      if (parsed.name === "PartsDeployed") {
        const hook = args.hook ? safeAddress(args.hook) : void 0;
        if (hook) remember({ token, hook });
        return Boolean(hook);
      }
      const creator = args.creator ? safeAddress(args.creator) : void 0;
      const poolId = portal.family === "v3" ? void 0 : args.poolId ? ethers.hexlify(args.poolId) : void 0;
      const poolAddr = portal.family === "v3" && args.pool ? safeAddress(args.pool) : void 0;
      const when = createdAt(log.blockNumber, head);
      const quoteIsUsdc = portal.def.id <= 5;
      const pair = basePair({
        token,
        name: String(args.name || "Argus"),
        symbol: String(args.symbol || "ARGUS"),
        creator,
        when,
        portal,
        image: args.imageURI ? String(args.imageURI) : void 0,
        website: args.website ? String(args.website) : void 0,
        twitter: args.twitter ? String(args.twitter) : void 0,
        telegram: args.telegram ? String(args.telegram) : void 0,
        poolId,
        pairAddress: poolId || poolAddr || token,
        quote: quoteIsUsdc ? "USDC" : void 0
      });
      opts.upsert(pair);
      remember({
        token,
        poolId,
        poolAddr,
        quote: quoteIsUsdc ? ARGUS_SHARED_INFRA.usdc : void 0
      });
      return true;
    } catch {
      return false;
    }
  }
  function storeV8(portal, log, head) {
    const parsed = v8.parseLog(log);
    if (!parsed) return false;
    const token = safeAddress(parsed.args.token);
    if (parsed.name === "LaunchMetadata") {
      opts.upsert(
        basePair({
          token,
          name: "",
          symbol: "",
          when: createdAt(log.blockNumber, head),
          portal,
          image: parsed.args.imageURI ? String(parsed.args.imageURI) : void 0,
          website: parsed.args.website ? String(parsed.args.website) : void 0,
          twitter: parsed.args.twitter ? String(parsed.args.twitter) : void 0,
          telegram: parsed.args.telegram ? String(parsed.args.telegram) : void 0,
          description: parsed.args.description ? String(parsed.args.description) : void 0,
          pairAddress: token
        })
      );
      return true;
    }
    if (parsed.name !== "Launched") return false;
    const hook = parsed.args.hook ? safeAddress(parsed.args.hook) : void 0;
    const when = createdAt(log.blockNumber, head);
    opts.upsert(
      basePair({
        token,
        name: token.slice(0, 8),
        symbol: token.slice(2, 6).toUpperCase(),
        creator: parsed.args.creator ? safeAddress(parsed.args.creator) : void 0,
        when,
        portal,
        pairAddress: token,
        hook,
        locker: parsed.args.locker ? safeAddress(parsed.args.locker) : void 0,
        positionId: parsed.args.positionId?.toString(),
        tickStart: Number(parsed.args.tickStart),
        tickBond: Number(parsed.args.tickBond)
      })
    );
    remember({ token, hook });
    enrich.push({ token, hook, portalId: portal.def.id });
    return true;
  }
  async function enrichSome(provider) {
    const batch = enrich.splice(0, 5);
    for (const item of batch) {
      try {
        const token = new ethers.Contract(item.token, erc20, provider);
        const [name, symbol] = await Promise.all([
          token.name().catch(() => ""),
          token.symbol().catch(() => "")
        ]);
        let quote;
        let poolId;
        if (item.hook) {
          try {
            const hook = new ethers.Contract(
              item.hook,
              [
                "function quoteAsset() view returns (address)",
                "function poolId() view returns (bytes32)"
              ],
              provider
            );
            const [addr, id] = await Promise.all([
              hook.quoteAsset().catch(() => ethers.ZeroAddress),
              hook.poolId().catch(() => null)
            ]);
            if (addr && addr !== ethers.ZeroAddress) quote = safeAddress(addr);
            if (id) poolId = ethers.hexlify(id);
          } catch {
          }
        }
        const portal = portals.find((p) => p.def.id === item.portalId);
        if (!portal) continue;
        opts.upsert(
          basePair({
            token: item.token,
            name: name || item.token.slice(0, 8),
            symbol: symbol || "ARC",
            when: Date.now(),
            portal,
            pairAddress: poolId || item.token,
            hook: item.hook,
            poolId,
            quoteAddress: quote,
            quote: quote && quote.toLowerCase() === USDC ? "USDC" : void 0
          })
        );
        remember({ token: item.token, hook: item.hook, poolId, quote });
      } catch {
        enrich.push(item);
        break;
      }
    }
  }
  async function quoteSome(provider, head) {
    const batch = [];
    while (pending.length > 0 && batch.length < 4) {
      const job = pending.shift();
      job.queued = false;
      if (!job.poolId && !job.poolAddr && !job.hook) continue;
      batch.push(job);
    }
    let taken = 0;
    for (let i = 0; i < refresh.length && taken < 2; ) {
      const job = refresh[i];
      if (!job.quotedAt || Date.now() - job.quotedAt > 2e4) {
        refresh.splice(i, 1);
        batch.push(job);
        taken += 1;
      } else {
        i += 1;
      }
    }
    await Promise.all(batch.map((job) => quoteOne(provider, job, head).catch(() => {
      job.quotedAt = Date.now() - 3e4;
      refresh.push(job);
    })));
  }
  async function quoteOne(provider, job, head) {
    if (job.hook && (!job.quote || !job.poolId)) {
      const hook = new ethers.Contract(
        job.hook,
        ["function quoteAsset() view returns (address)", "function poolId() view returns (bytes32)"],
        provider
      );
      if (!job.poolId) {
        const id = await hook.poolId().catch(() => null);
        if (id) {
          job.poolId = ethers.hexlify(id);
          byPool.set(job.poolId.toLowerCase(), job);
        }
      }
      const addr = await hook.quoteAsset().catch(() => null);
      if (addr && addr !== ethers.ZeroAddress) job.quote = safeAddress(addr);
    }
    if (job.quote && job.quote.toLowerCase() !== USDC) {
      job.quotedAt = Date.now();
      return;
    }
    const read = await readSqrt(provider, job);
    if (!read || read.sqrt <= 0n) {
      job.quotedAt = Date.now() - 2e4;
      refresh.push(job);
      return;
    }
    const erc = new ethers.Contract(job.token, erc20, provider);
    const [supply, dec] = await Promise.all([
      erc.totalSupply().catch(() => 1000000000n * 10n ** 18n),
      erc.decimals().catch(() => 18)
    ]);
    const tokenDec = Number(dec) || 18;
    const price = usdPerToken(read.sqrt, read.tokenIs0, tokenDec, 6);
    if (!(price > 0)) {
      job.quotedAt = Date.now();
      return;
    }
    const unit = 10n ** BigInt(tokenDec);
    const supplyBn = BigInt(supply);
    const whole = Number(supplyBn / unit) + Number(supplyBn % unit) / 10 ** tokenDec;
    job.quotedAt = Date.now();
    refresh.push(job);
    publishMarket(job, price, price * whole, head);
  }
  async function readSqrt(provider, job) {
    if (job.poolId) {
      const view = new ethers.Contract(ARGUS_SHARED_INFRA.stateView, stateViewAbi, provider);
      const slot2 = await view.getSlot0(job.poolId);
      return { sqrt: BigInt(slot2[0]), tokenIs0: job.token.toLowerCase() < USDC };
    }
    if (!job.poolAddr) return null;
    const pool = new ethers.Contract(
      job.poolAddr,
      [
        "function slot0() view returns (uint160,int24,uint16,uint16,uint16,uint8,bool)",
        "function token0() view returns (address)",
        "function token1() view returns (address)"
      ],
      provider
    );
    const [slot, token0, token1] = await Promise.all([pool.slot0(), pool.token0(), pool.token1()]);
    const usdcIs0 = String(token0).toLowerCase() === USDC;
    const usdcIs1 = String(token1).toLowerCase() === USDC;
    if (!usdcIs0 && !usdcIs1) return null;
    return { sqrt: BigInt(slot[0]), tokenIs0: String(token0).toLowerCase() === job.token.toLowerCase() };
  }
  function volumeOf(poolId, head) {
    const rows = volBuckets.get(poolId.toLowerCase());
    if (!rows) return 0;
    const floor = head - DAY_BLOCKS;
    let sum = 0;
    for (const [bucket, usd] of rows) {
      if (bucket + VOL_BUCKET < floor) {
        rows.delete(bucket);
        continue;
      }
      sum += usd;
    }
    return sum;
  }
  async function scanSwaps(provider, head) {
    if (byPool.size === 0) return;
    const dayFloor = Math.max(0, head - DAY_BLOCKS);
    if (swapLive == null || swapCursor == null) {
      swapLive = head;
      swapCursor = head;
    }
    let from;
    let to;
    if (swapCursor > dayFloor) {
      to = swapCursor;
      from = Math.max(dayFloor, to - 799);
      swapCursor = from - 1;
      if (swapCursor <= dayFloor) volumeReady = true;
    } else if (swapLive < head) {
      from = swapLive + 1;
      to = Math.min(head, from + 799);
      swapLive = to;
    } else {
      return;
    }
    const logs = await provider.getLogs({
      address: ARGUS_SHARED_INFRA.poolManager,
      topics: [SWAP_TOPIC],
      fromBlock: from,
      toBlock: to
    });
    for (const log of logs) {
      const parsed = swapIface.parseLog(log);
      if (!parsed) continue;
      const poolId = String(parsed.args.id).toLowerCase();
      const job = byPool.get(poolId);
      if (!job || job.quote && job.quote.toLowerCase() !== USDC) continue;
      const tokenIs0 = job.token.toLowerCase() < USDC;
      const raw = tokenIs0 ? BigInt(parsed.args.amount1) : BigInt(parsed.args.amount0);
      const usd = Math.abs(Number(raw)) / 1e6;
      if (!(usd > 0)) continue;
      const bucket = Math.floor(log.blockNumber / VOL_BUCKET) * VOL_BUCKET;
      let rows = volBuckets.get(poolId);
      if (!rows) {
        rows = /* @__PURE__ */ new Map();
        volBuckets.set(poolId, rows);
      }
      rows.set(bucket, (rows.get(bucket) || 0) + usd);
      if (job.quotedAt) job.quotedAt = Math.min(job.quotedAt, Date.now() - 2e4);
    }
  }
  return stop;
}
function usdPerToken(sqrtPriceX96, tokenIsToken0, tokenDecimals, quoteDecimals = 6) {
  if (sqrtPriceX96 <= 0n) return 0;
  const scale = 10n ** 18n;
  const rawScaled = sqrtPriceX96 * sqrtPriceX96 * scale / (1n << 192n);
  if (rawScaled <= 0n) return 0;
  const adj = 10n ** BigInt(tokenDecimals - quoteDecimals);
  const usdScaled = tokenIsToken0 ? rawScaled * adj : adj * scale * scale / rawScaled;
  const price = Number(usdScaled) / 1e18;
  return Number.isFinite(price) && price > 0 ? price : 0;
}
function basePair(input) {
  const socials = [
    ...input.twitter ? [{ type: "twitter", url: input.twitter }] : [],
    ...input.telegram ? [{ type: "telegram", url: input.telegram }] : []
  ];
  return {
    chainId: "arc",
    dexId: "argus",
    primaryDex: "Argus",
    primaryDexLogo: "/argus.svg",
    primaryDexTradingUrl: `https://argus.world/token/${input.token}`,
    url: `https://argus.world/token/${input.token}`,
    pairAddress: input.pairAddress,
    baseToken: {
      address: input.token,
      name: input.name,
      symbol: input.symbol
    },
    quoteToken: {
      address: input.quoteAddress || (input.quote === "USDC" ? "0x3600000000000000000000000000000000000000" : ""),
      name: input.quote || "",
      symbol: input.quote || ""
    },
    pairCreatedAt: input.when,
    info: {
      imageUrl: input.image,
      description: input.description,
      websites: input.website ? [{ type: "website", url: input.website }] : void 0,
      socials: socials.length ? socials : void 0
    },
    twitter: input.twitter,
    telegram: input.telegram,
    website: input.website,
    creator: input.creator,
    sources: ["Argus", `Portal ${input.portal.def.id}`],
    dexes: ["Argus"],
    isArgusLaunch: true,
    launchPlatform: "Argus",
    argusPortalId: input.portal.def.id,
    argusPortalFamily: input.portal.family,
    argusPortalAddress: safeAddress(input.portal.def.address),
    argusHookAddress: input.hook,
    argusLockerAddress: input.locker,
    argusPoolId: input.poolId,
    argusPositionId: input.positionId,
    discoveredAt: Date.now(),
    discoveryMode: "onchain"
  };
}
export {
  ARC_RPC_URLS,
  startArgusChainScan
};
