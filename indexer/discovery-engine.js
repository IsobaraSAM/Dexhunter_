// @ts-nocheck
import { pumpIndexer, getSolUsdPrice } from "./pump-engine.js";
import { pumpCurveQuote } from "./pump-create.js";
import { argusIndexer } from "./argus-engine.js";
import { ponsIndexer } from "./pons-engine.js";
import { bscLaunchIndexer } from "./bsc-launch-reader.js";
import { normalizeChainName, normalizeDexName, getDexTradingUrl } from "../src/lib/dexPriority.js";
import { chainTokenKey, identityAddress } from "../src/lib/addressCase.js";
import { knownNumber } from "./feed-rules.js";
import { queryIndex, volumeMetric, liquidityMetric, marketCapMetric, knownMetric } from "./index-query.js";
import { applyPonsIdentity } from "./pons-identity.js";
import { pickName, pickSymbol } from "./token-fields.js";
import { CHAIN_COVERAGE } from "./chain-coverage.js";
import { INDEX_FILE, MAX_TOKENS, loadIndex, retainTokens, saveIndex, seedRuntimeCache } from "./index-store.js";
import { createMetrics, exportMetrics, recordUnique, recordUpdate, restoreMetrics, snapshot } from "./metrics.js";
import { argusLaunchpadUrl } from "./venue-links.js";

// recordsToday is the UTC calendar day of pairCreatedAt, not the size of the index.
function countLaunchedToday(tokens, now) {
  const dayStart = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate());
  let count = 0;
  for (const token of tokens) {
    const raw = Number(token?.pairCreatedAt || 0);
    if (!Number.isFinite(raw) || raw <= 0) continue;
    const ms = raw < 1e11 ? raw * 1000 : raw;
    if (ms >= dayStart && ms <= now + 120000) count += 1;
  }
  return count;
}
const EVM_CHAINS = [
  "bsc",
  "avalanche",
  "base",
  "arbitrum",
  "polygon",
  "ethereum",
  "robinhood",
  "arc",
  "cronos"
];
const GECKOTERMINAL_MAP = {
  bsc: "bsc",
  avalanche: "avax",
  base: "base",
  arbitrum: "arbitrum",
  polygon: "polygon_pos",
  ethereum: "eth",
  solana: "solana",
  cronos: "cronos",
  hyperevm: "hyperevm",
};
const DEX_SEARCH_QUERIES = {
  solana: ["raydium solana", "meteora solana", "pump solana", "orca solana", "jupiter solana", "bonk solana", "wif solana", "solana dex", "solana memecoin"],
  bsc: ["pancakeswap bsc", "wbnb bsc", "thena bsc", "biswap", "bakeryswap", "four meme", "cake bsc", "baby bsc", "floki bsc", "usdt bsc"],
  avalanche: ["traderjoe avax", "pangolin avax", "lfj avax", "wavax", "joe avax", "benqi avax", "avalanche dex", "avax meme"],
  base: ["aerodrome base", "uniswap base", "virtuals base", "clanker base", "baseswap", "degen base", "toshi base", "brett base", "usdc base"],
  arbitrum: ["camelot arbitrum", "uniswap arbitrum", "gmx arbitrum", "arb arbitrum", "magic arbitrum", "pendle arbitrum", "usdc arbitrum"],
  polygon: ["quickswap polygon", "uniswap polygon", "matic polygon", "balancer polygon", "sushiswap polygon", "pol polygon"],
  ethereum: ["uniswap ethereum", "curve ethereum", "sushiswap ethereum", "pepe eth", "shib eth", "balancer eth", "link eth", "uni eth"],
  robinhood: ["robinhood", "uniswap robinhood", "robinhood token", "rh crypto"],
  arc: ["arc", "uniswap arc", "arc dex", "arc chain", "arc token"],
  cronos: ["vvs finance", "mm finance", "cronos dex"],
  hyperevm: ["hyperevm", "hyperswap", "hyperliquid", "hype"],
};
async function fetchWithTimeout(url, timeoutMs = 6e3) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "DexHunter-Discovery/2.0" },
      signal: controller.signal
    });
    clearTimeout(id);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(id);
    return null;
  }
}
class DiscoveryEngine {
  indexedTokens = /* @__PURE__ */ new Map();
  discoveredTodaySet = /* @__PURE__ */ new Set();
  rollingDiscoveries = [];
  startedAt = Date.now();
  lastIndexedAt = 0;
  isIndexing = false;
  pollInterval = null;
  searchCursor = 0;
  liveInflight = null;
  metrics = createMetrics();
  seenKeys = /* @__PURE__ */ new Set();
  lastPersistOk = false;
  lastPersistAt = 0;
  constructor() {
    this.startedAt = Date.now();
    this.metrics = createMetrics(this.startedAt);
    this.hydrate();
  }
  hydrate() {
    seedRuntimeCache();
    const saved = loadIndex(INDEX_FILE);
    if (!saved) return;
    for (const token of saved.tokens) {
      const addr = token?.baseToken?.address;
      if (!addr) continue;
      const key = chainTokenKey(token.chainId, addr);
      if (!this.indexedTokens.has(key)) this.indexedTokens.set(key, token);
      this.seenKeys.add(key);
    }
    if (saved.metrics) this.metrics = restoreMetrics(saved.metrics, Date.now());
    if (saved.searchCursor) this.searchCursor = saved.searchCursor;
  }
  persist() {
    try {
      saveIndex(INDEX_FILE, {
        version: 1,
        savedAt: Date.now(),
        searchCursor: this.searchCursor || 0,
        tokens: retainTokens(Array.from(this.indexedTokens.values())),
        metrics: exportMetrics(this.metrics),
      });
      this.lastPersistOk = true;
      this.lastPersistAt = Date.now();
    } catch (err) {
      this.lastPersistOk = false;
      console.warn("[DiscoveryEngine] Persist skipped:", err?.message || err);
    }
  }
  async start() {
    if (this.pollInterval) return;
    console.log("[DiscoveryEngine] Starting multi-chain high-throughput indexer...");
    this.runIndexingPass().catch((err) => {
      console.warn("[DiscoveryEngine] Initial index pass error:", err);
    });
    this.pollInterval = setInterval(() => {
      this.runIndexingPass().catch((err) => {
        console.warn("[DiscoveryEngine] Periodic index pass error:", err);
      });
    }, 2e4);
  }
  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
  /**
   * Main indexing pass: runs across Solana (Pump.fun on-chain) + EVM chains in parallel
   */
  async runIndexingPass() {
    if (this.isIndexing) return;
    this.isIndexing = true;
    const passStartTime = Date.now();
    try {
      this.ingestSolanaPumpTokens();
      await this.repairSolanaCurves();
      this.ingestArgusTokens();
      await this.catchUpPons();
      this.ingestPonsTokens();
      await this.catchUpBsc();
      this.ingestBscTokens();
      const dexscreenerPromise = this.ingestDexScreenerTrending();
      const dexSearchPromise = this.ingestNativeDexSearches();
      const hyperSearch = fetchWithTimeout(
        "https://api.dexscreener.com/latest/dex/search?q=hyperswap",
        5500
      ).then((res) => {
        if (!Array.isArray(res?.pairs)) return;
        for (const p of res.pairs) this.normalizeAndStoreDexScreenerPair(p);
      });
      await Promise.allSettled([
        dexscreenerPromise,
        dexSearchPromise,
        this.ingestGeckoList("hyperevm", "trending_pools", "hyperevm"),
        hyperSearch,
      ]);
      this.lastIndexedAt = Date.now();
      this.cleanupOldRollingStats();
      this.persist();
      console.log(
        `[DiscoveryEngine] Index pass completed in ${Date.now() - passStartTime}ms. Total indexed: ${this.indexedTokens.size} tokens across all chains.`
      );
    } catch (err) {
      console.warn("[DiscoveryEngine] Error during indexing pass:", err);
    } finally {
      this.isIndexing = false;
    }
  }
  /**
   * Converts and ingests Solana Pump.fun tokens from pumpIndexer
   */
  ingestSolanaPumpTokens() {
    try {
      const solTokens = pumpIndexer.getAllTokens();
      for (const t of solTokens) {
        if (!t.mint) continue;
        const key = chainTokenKey("solana", t.mint);
        const hasPool = Boolean(t.pumpSwapPool || t.pumpswap_pool || t.marketStage === "pumpswap" || t.isGraduated);
        const curveDone = Boolean(t.complete) && !hasPool;
        const isGraduated = hasPool;
        const dexId = isGraduated ? "pumpswap" : t.dexId || "pumpfun";
        const primaryDex = isGraduated ? "PumpSwap" : t.primaryDex || "Pump.fun";
        const quoted = pumpCurveQuote(t, t.solUsdPrice);
        const spotUsd = t.spotPriceUsd && Number(t.spotPriceUsd) > 0 ? t.spotPriceUsd : (quoted?.spotUsd != null ? quoted.spotUsd : void 0);
        const marketCapUsd = knownNumber(t.marketCapUsd) && t.marketCapUsd > 0 ? t.marketCapUsd : (quoted?.fdvUsd ?? void 0);
        const fdvUsd = knownNumber(t.fdvUsd) && t.fdvUsd > 0 ? t.fdvUsd : (quoted?.fdvUsd ?? void 0);
        let liquidityUsd = t.liquidityUsd;
        if (!knownNumber(liquidityUsd) && t.quoteNative !== false && t.realSolReserves && Number(t.solUsdPrice) > 0) {
          const sol = Number(t.realSolReserves) / 1e9;
          if (Number.isFinite(sol) && sol >= 0) liquidityUsd = Math.round(sol * Number(t.solUsdPrice) * 100) / 100;
        }
        const observedVol = knownNumber(t.volumeObservedUsd)
          ? t.volumeObservedUsd
          : knownNumber(t.volume24h)
            ? t.volume24h
            : (Number(spotUsd) > 0 ? 0 : void 0);
        const imageUrl = t.imageUrl || `https://images.pump.fun/coin-image/${t.mint}`;
        const pair = {
          chainId: "solana",
          dexId,
          primaryDex,
          pairAddress: t.pairAddress || t.pumpSwapPool || t.bondingCurvePda || t.mint,
          url: `https://pump.fun/coin/${t.mint}`,
          baseToken: {
            address: t.mint,
            name: t.tokenName && !t.tokenName.startsWith("Pump Token") ? t.tokenName : void 0,
            symbol: t.tokenSymbol && t.tokenSymbol !== "PUMP" ? t.tokenSymbol : void 0
          },
          quoteToken: t.quoteNative
            ? {
                address: "So11111111111111111111111111111111111111112",
                name: "Wrapped SOL",
                symbol: "SOL"
              }
            : t.quoteMint
              ? { address: t.quoteMint, name: void 0, symbol: void 0 }
              : { address: "", name: void 0, symbol: void 0 },
          priceNative: t.spotPriceQuote || t.spotPriceSol || quoted?.spotQuote || void 0,
          priceUsd: spotUsd === "" || spotUsd == null || Number(spotUsd) <= 0 ? void 0 : spotUsd,
          marketCap: knownNumber(marketCapUsd) && marketCapUsd > 0 ? marketCapUsd : void 0,
          fdv: knownNumber(fdvUsd) && fdvUsd > 0 ? fdvUsd : void 0,
          liquidity: knownNumber(liquidityUsd) ? { usd: liquidityUsd } : void 0,
          totalLiquidityUsd: knownNumber(liquidityUsd) ? liquidityUsd : void 0,
          volumeComplete: Boolean(t.volumeComplete),
          volumeObservedUsd: knownNumber(t.volumeObservedUsd) ? t.volumeObservedUsd : void 0,
          volumeObservedMs: t.volumeObservedMs || void 0,
          volume: knownNumber(observedVol) ? { h24: observedVol } : void 0,
          totalVolume24h: knownNumber(observedVol) ? observedVol : void 0,
          marketCapMethod: fdvUsd ? "bonding_curve_spot" : void 0,
          discoveryMode: "onchain",
          priceChange: t.priceChange24h ? { h24: t.priceChange24h } : void 0,
          pairCreatedAt: t.createdAt || t.created_timestamp,
          info: {
            imageUrl,
            description: t.description,
            websites: t.website ? [{ type: "website", label: "Website", url: t.website }] : void 0,
            socials: [
              ...t.twitter ? [{ type: "twitter", url: t.twitter }] : [],
              ...t.telegram ? [{ type: "telegram", url: t.telegram }] : []
            ]
          },
          website: t.website,
          twitter: t.twitter,
          telegram: t.telegram,
          launchPlatform: "Pump.fun",
          bondingCurvePda: t.bondingCurvePda,
          bondingProgress: t.bondingProgress,
          isBondingCurve: !isGraduated && !curveDone,
          isGraduated,
          marketStage: isGraduated ? "pumpswap" : curveDone ? "graduated" : "bonding_curve",
          pumpSwapPool: t.pumpSwapPool,
          creator: t.creator,
          realSolReservesFormatted: t.realSolReservesFormatted,
          virtualTokenReserves: t.virtualTokenReserves,
          virtualSolReserves: t.virtualSolReserves,
          realTokenReserves: t.realTokenReserves,
          realSolReserves: t.realSolReserves,
          tokenTotalSupply: t.tokenTotalSupply,
          primaryProvider: "Pump.fun (On-Chain)",
          sources: isGraduated ? ["PumpSwap", "Pump.fun (On-Chain)"] : ["Pump.fun (On-Chain)"],
          dexes: isGraduated ? ["PumpSwap"] : [],
          discoveredAt: Date.now()
        };
        const tradeUrl = getDexTradingUrl(pair, primaryDex);
        if (tradeUrl) pair.primaryDexTradingUrl = tradeUrl;
        this.addOrUpdateToken(key, pair);
      }
    } catch (err) {
      console.warn("[DiscoveryEngine] Failed ingesting Solana pump tokens:", err);
    }
  }
  /**
   * Stored Pump rows keep curve reserves after the live book has moved on.
   * Price those reserves with the current SOL price and keep a partial volume visible.
   */
  async repairSolanaCurves() {
    let solUsd = null;
    try {
      solUsd = await getSolUsdPrice();
    } catch {
      solUsd = null;
    }
    for (const token of this.indexedTokens.values()) {
      if (String(token?.chainId || "").toLowerCase() !== "solana") continue;
      const pump = token.launchPlatform === "Pump.fun" || token.dexId === "pumpfun" || token.dexId === "pumpswap" || token.marketStage === "bonding_curve" || token.marketStage === "pumpswap";
      if (!pump) continue;
      const mint = token.baseToken?.address;
      if (mint && !token.info?.imageUrl) {
        if (!token.info) token.info = {};
        token.info.imageUrl = `https://images.pump.fun/coin-image/${mint}`;
      }
      const needsPrice = !(Number(token.priceUsd) > 0) || !(Number(token.marketCap) > 0);
      if (needsPrice && Number(solUsd) > 0 && token.virtualTokenReserves && (token.virtualSolReserves || token.virtualQuoteReserves)) {
        const quoted = pumpCurveQuote({ ...token, quoteNative: token.quoteNative !== false }, solUsd);
        if (quoted?.spotUsd > 0) token.priceUsd = quoted.spotUsd;
        if (quoted?.spotQuote && !(Number(token.priceNative) > 0)) token.priceNative = quoted.spotQuote;
        if (quoted?.fdvUsd > 0) {
          if (!(Number(token.marketCap) > 0)) token.marketCap = quoted.fdvUsd;
          if (!(Number(token.fdv) > 0)) token.fdv = quoted.fdvUsd;
        }
      }
      if (!knownNumber(token.liquidity?.usd) && !knownNumber(token.totalLiquidityUsd) && token.realSolReserves && Number(solUsd) > 0) {
        const sol = Number(token.realSolReserves) / 1e9;
        if (Number.isFinite(sol) && sol >= 0) {
          const liq = Math.round(sol * Number(solUsd) * 100) / 100;
          token.liquidity = { ...(token.liquidity || {}), usd: liq };
          token.totalLiquidityUsd = liq;
        }
      }
      if (token.volumeComplete === true && knownNumber(token.volume?.h24)) continue;
      const observed = knownNumber(token.volumeObservedUsd)
        ? token.volumeObservedUsd
        : knownNumber(token.volume?.h24)
          ? token.volume.h24
          : (Number(token.priceUsd) > 0 ? 0 : null);
      if (observed == null) continue;
      token.volumeComplete = false;
      token.volume = { ...(token.volume || {}), h24: observed };
      token.totalVolume24h = observed;
    }
  }
  /**
   * Ingests native Arc Argus Launchpad (Portal #7 and #8) tokens
   */
  ingestArgusTokens() {
    try {
      const argusTokens = argusIndexer.getArgusTokens();
      const perPortal = new Map();
      let taken = 0;
      for (const pair of argusTokens) {
        const portalId = pair.argusPortalId || 0;
        const seenOnPortal = perPortal.get(portalId) || 0;
        // The Argus book keeps every portal. The shared discovery window
        // only needs the newest slice of each, or trim deletes them again.
        if (seenOnPortal >= 800) continue;
        if (taken >= 3200) break;
        perPortal.set(portalId, seenOnPortal + 1);
        taken += 1;
        const key = `arc:${pair.baseToken.address.toLowerCase()}`;
        if (!pair.discoveryMode) pair.discoveryMode = "onchain";
        this.addOrUpdateToken(key, pair);
      }
    } catch (err) {
      console.warn("[DiscoveryEngine] Failed ingesting Argus tokens:", err);
    }
  }
  ingestPonsTokens() {
    try {
      if (!this.ponsStamp) this.ponsStamp = new Map();
      for (const pair of ponsIndexer.getTokens()) {
        const addr = pair?.baseToken?.address;
        if (!addr) continue;
        const key = addr.toLowerCase();
        const stamp = `${pair.baseToken?.name || ""}|${pair.baseToken?.symbol || ""}|${pair.priceUsd || ""}|${pair.bondingProgress ?? ""}|${pair.info?.imageUrl || ""}`;
        if (this.ponsStamp.get(key) === stamp) continue;
        this.ponsStamp.set(key, stamp);
        this.addOrUpdateToken(`robinhood:${key}`, pair);
      }
    } catch (err) {
      console.warn("[DiscoveryEngine] Failed ingesting Pons tokens:", err);
    }
  }
  ingestBscTokens() {
    try {
      if (!this.bscStamp) this.bscStamp = new Map();
      let taken = 0;
      for (const pair of bscLaunchIndexer.getTokens()) {
        if (taken >= 1500) break;
        const addr = pair?.baseToken?.address;
        if (!addr) continue;
        const key = addr.toLowerCase();
        const stamp = `${pair.baseToken?.name || ""}|${pair.baseToken?.symbol || ""}|${pair.priceUsd || ""}|${pair.bondingProgress ?? ""}|${pair.marketStage || ""}`;
        if (this.bscStamp.get(key) === stamp) continue;
        this.bscStamp.set(key, stamp);
        taken += 1;
        this.addOrUpdateToken(`bsc:${key}`, pair);
      }
    } catch (err) {
      console.warn("[DiscoveryEngine] Failed ingesting BSC launches:", err);
    }
  }
  /**
   * Fetches fresh and high-activity tokens directly from the Pump.fun API
   */
  async ingestPumpCoinsApi() {
    try {
      const [latestRes, volumeRes, mcapRes] = await Promise.allSettled([
        fetchWithTimeout("https://frontend-api.pump.fun/coins?limit=100&sort=created_timestamp&order=DESC&includeNsfw=false", 5e3),
        fetchWithTimeout("https://frontend-api.pump.fun/coins?limit=100&sort=last_trade_timestamp&order=DESC&includeNsfw=false", 5e3),
        fetchWithTimeout("https://frontend-api.pump.fun/coins?limit=100&sort=market_cap&order=DESC&includeNsfw=false", 5e3)
      ]);
      const coins = [];
      if (latestRes.status === "fulfilled" && Array.isArray(latestRes.value)) {
        coins.push(...latestRes.value);
      }
      if (volumeRes.status === "fulfilled" && Array.isArray(volumeRes.value)) {
        coins.push(...volumeRes.value);
      }
      if (mcapRes.status === "fulfilled" && Array.isArray(mcapRes.value)) {
        coins.push(...mcapRes.value);
      }
      for (const c of coins) {
        if (!c?.mint) continue;
        const key = chainTokenKey("solana", c.mint);
        const hasPool = Boolean(c.raydium_pool || c.pump_swap_pool);
        const curveDone = Boolean(c.complete) && !hasPool;
        const isGraduated = hasPool;
        const dexId = isGraduated ? "pumpswap" : "pumpfun";
        const primaryDex = isGraduated ? "PumpSwap" : "Pump.fun";
        const pair = {
          chainId: "solana",
          dexId,
          primaryDex,
          pairAddress: c.bonding_curve || c.mint,
          url: `https://pump.fun/coin/${c.mint}`,
          baseToken: {
            address: c.mint,
            name: c.name || "Pump Token",
            symbol: c.symbol || "PUMP"
          },
          quoteToken: { address: "", name: void 0, symbol: void 0 },
          priceNative: void 0,
          priceUsd: void 0,
          marketCap: Number.isFinite(Number(c.usd_market_cap)) && c.usd_market_cap != null && c.usd_market_cap !== "" ? Number(c.usd_market_cap) : void 0,
          fdv: Number.isFinite(Number(c.usd_market_cap)) && c.usd_market_cap != null && c.usd_market_cap !== "" ? Number(c.usd_market_cap) : void 0,
          liquidity: void 0,
          totalLiquidityUsd: void 0,
          volume: c.volume_24h != null && c.volume_24h !== "" && Number.isFinite(Number(c.volume_24h)) ? { h24: Number(c.volume_24h) } : void 0,
          totalVolume24h: c.volume_24h != null && c.volume_24h !== "" && Number.isFinite(Number(c.volume_24h)) ? Number(c.volume_24h) : void 0,
          pairCreatedAt: c.created_timestamp,
          info: {
            imageUrl: c.image_uri,
            description: c.description,
            websites: c.website ? [{ type: "website", label: "Website", url: c.website }] : void 0,
            socials: [
              ...c.twitter ? [{ type: "twitter", url: c.twitter }] : [],
              ...c.telegram ? [{ type: "telegram", url: c.telegram }] : []
            ]
          },
          website: c.website,
          twitter: c.twitter,
          telegram: c.telegram,
          launchPlatform: "Pump.fun",
          bondingCurvePda: c.bonding_curve,
          bondingProgress: c.complete ? 100 : Math.min(100, Math.round((c.real_sol_reserves || 0) / (85 * 1e9) * 100)),
          isBondingCurve: !isGraduated && !curveDone,
          isGraduated,
          marketStage: isGraduated ? "pumpswap" : curveDone ? "graduated" : "bonding_curve",
          creator: c.creator,
          primaryProvider: "Pump.fun API",
          sources: isGraduated ? ["PumpSwap", "Pump.fun API"] : ["Pump.fun API"],
          dexes: isGraduated ? ["PumpSwap"] : [],
          discoveredAt: Date.now()
        };
        const tradeUrl = getDexTradingUrl(pair, primaryDex);
        if (tradeUrl) pair.primaryDexTradingUrl = tradeUrl;
        this.addOrUpdateToken(key, pair);
      }
    } catch (err) {
      console.warn("[DiscoveryEngine] ingestPumpCoinsApi error:", err);
    }
  }
  /**
   * Fetches DexScreener trending boosts, latest boosts, and token profiles,
   * then batches their market data in chunks of 30 addresses.
   */
  async ingestDexScreenerTrending() {
    try {
      const [topBoosts, latestBoosts, latestProfiles] = await Promise.allSettled([
        fetchWithTimeout("https://api.dexscreener.com/token-boosts/top/v1", 6e3),
        fetchWithTimeout("https://api.dexscreener.com/token-boosts/latest/v1", 6e3),
        fetchWithTimeout("https://api.dexscreener.com/token-profiles/latest/v1", 6e3)
      ]);
      const items = [];
      if (topBoosts.status === "fulfilled" && Array.isArray(topBoosts.value)) {
        items.push(...topBoosts.value);
      }
      if (latestBoosts.status === "fulfilled" && Array.isArray(latestBoosts.value)) {
        items.push(...latestBoosts.value);
      }
      if (latestProfiles.status === "fulfilled" && Array.isArray(latestProfiles.value)) {
        items.push(...latestProfiles.value);
      }
      const addressMap = /* @__PURE__ */ new Map();
      for (const it of items) {
        if (it?.tokenAddress) {
          const key = identityAddress(it.chainId, it.tokenAddress);
          if (!addressMap.has(key)) {
            addressMap.set(key, it);
          }
        }
      }
      const addresses = Array.from(addressMap.keys());
      if (addresses.length === 0) return;
      const batchSize = 30;
      const chunks = [];
      for (let i = 0; i < Math.min(addresses.length, 450); i += batchSize) {
        chunks.push(addresses.slice(i, i + batchSize));
      }
      for (let i = 0; i < chunks.length; i += 3) {
        const subBatch = chunks.slice(i, i + 3);
        const batchTasks = subBatch.map(
          (chunk) => fetchWithTimeout(`https://api.dexscreener.com/latest/dex/tokens/${chunk.join(",")}`, 6e3)
        );
        const batchResults = await Promise.allSettled(batchTasks);
        for (const res of batchResults) {
          if (res.status === "fulfilled" && Array.isArray(res.value?.pairs)) {
            for (const p of res.value.pairs) {
              this.normalizeAndStoreDexScreenerPair(p, addressMap);
            }
          }
        }
        await new Promise((r) => setTimeout(r, 100));
      }
    } catch (err) {
      console.warn("[DiscoveryEngine] DexScreener trending ingestion error:", err);
    }
  }
  /**
   * Bounded DexScreener read for the HTTP request. The full pass walks hundreds
   * of addresses and will not finish inside a serverless invocation.
   */
  async ingestDexScreenerQuick() {
    const [topBoosts, latestBoosts, latestProfiles, searchSol, searchHyper] = await Promise.allSettled([
      fetchWithTimeout("https://api.dexscreener.com/token-boosts/top/v1", 6e3),
      fetchWithTimeout("https://api.dexscreener.com/token-boosts/latest/v1", 6e3),
      fetchWithTimeout("https://api.dexscreener.com/token-profiles/latest/v1", 6e3),
      fetchWithTimeout("https://api.dexscreener.com/latest/dex/search?q=solana", 6e3),
      fetchWithTimeout("https://api.dexscreener.com/latest/dex/search?q=hyperswap", 6e3)
    ]);
    const items = [];
    if (topBoosts.status === "fulfilled" && Array.isArray(topBoosts.value)) items.push(...topBoosts.value);
    if (latestBoosts.status === "fulfilled" && Array.isArray(latestBoosts.value)) items.push(...latestBoosts.value);
    if (latestProfiles.status === "fulfilled" && Array.isArray(latestProfiles.value)) items.push(...latestProfiles.value);
    const addressMap = /* @__PURE__ */ new Map();
    for (const it of items) {
      if (!it?.tokenAddress) continue;
      const key = identityAddress(it.chainId, it.tokenAddress);
      if (!addressMap.has(key)) addressMap.set(key, it);
    }
    const addresses = Array.from(addressMap.keys()).slice(0, 60);
    const chunks = [];
    for (let i = 0; i < addresses.length; i += 30) chunks.push(addresses.slice(i, i + 30));
    const batchResults = await Promise.allSettled(
      chunks.map((chunk) => fetchWithTimeout(`https://api.dexscreener.com/latest/dex/tokens/${chunk.join(",")}`, 6e3))
    );
    for (const res of batchResults) {
      if (res.status === "fulfilled" && Array.isArray(res.value?.pairs)) {
        for (const p of res.value.pairs) this.normalizeAndStoreDexScreenerPair(p, addressMap);
      }
    }
    if (searchSol.status === "fulfilled" && Array.isArray(searchSol.value?.pairs)) {
      for (const p of searchSol.value.pairs) this.normalizeAndStoreDexScreenerPair(p);
    }
    if (searchHyper.status === "fulfilled" && Array.isArray(searchHyper.value?.pairs)) {
      for (const p of searchHyper.value.pairs) this.normalizeAndStoreDexScreenerPair(p);
    }
  }
  async ingestGeckoList(network, kind, chainName) {
    const json = await fetchWithTimeout(
      `https://api.geckoterminal.com/api/v2/networks/${network}/${kind}?include=base_token,dex&page=1`,
      6e3
    );
    const pools = Array.isArray(json?.data) ? json.data : [];
    const included = Array.isArray(json?.included) ? json.included : [];
    for (const pool of pools) this.parseAndStoreGeckoPool(pool, included, chainName);
  }
  /**
   * Fills the in-memory index before the request returns. Serverless hosts
   * freeze after the response, so the feed cannot wait on setInterval.
   * Pons is the same: each snapshot awaits a bounded catchUp instead of hoping
   * the 800ms timer is still alive. A warm index still catches Pons up; the
   * heavier DexScreener pass stays on the 20s freshness window.
   */
  async ensureLiveSnapshot() {
    const fresh = this.indexedTokens.size > 0 && Date.now() - this.lastIndexedAt < 2e4;
    if (fresh) {
      await this.catchUpPons();
      this.ingestPonsTokens();
      await this.catchUpBsc();
      this.ingestBscTokens();
      return;
    }
    if (this.liveInflight) return this.liveInflight;
    this.liveInflight = this.runQuickLivePass().finally(() => {
      this.liveInflight = null;
    });
    return this.liveInflight;
  }
  async catchUpPons() {
    try {
      if (typeof ponsIndexer.catchUp === "function") {
        await ponsIndexer.catchUp({ maxChunks: 4, maxMs: 1200 });
      }
    } catch (err) {
      console.warn("[DiscoveryEngine] Pons catch-up:", err?.message || err);
    }
  }
  async catchUpBsc() {
    try {
      if (!bscLaunchIndexer.timer) bscLaunchIndexer.start().catch(() => {});
      await bscLaunchIndexer.catchUp({ maxChunks: 2, maxMs: 800 });
    } catch (err) {
      console.warn("[DiscoveryEngine] BSC catch-up:", err?.message || err);
    }
  }
  async runQuickLivePass() {
    await this.catchUpPons();
    this.ingestPonsTokens();
    await this.catchUpBsc();
    this.ingestBscTokens();
    const nets = [
      ["solana", "solana"],
      ["eth", "ethereum"],
      ["base", "base"],
      ["bsc", "bsc"],
      ["hyperevm", "hyperevm"],
    ];
    const tasks = [this.ingestDexScreenerQuick()];
    for (const [net, chain] of nets) {
      tasks.push(this.ingestGeckoList(net, "trending_pools", chain));
      tasks.push(this.ingestGeckoList(net, "new_pools", chain));
    }
    await Promise.allSettled(tasks);
    this.ingestSolanaPumpTokens();
    this.ingestArgusTokens();
    this.ingestPonsTokens();
    this.ingestBscTokens();
    if (this.indexedTokens.size > 0) this.lastIndexedAt = Date.now();
  }
  /**
   * Ingests native DEX search queries across chains using staggered sub-batches
   */
  async ingestNativeDexSearches() {
    const queriesToRun = [];
    for (const [chain, queries] of Object.entries(DEX_SEARCH_QUERIES)) {
      for (const q of queries) {
        queriesToRun.push({ chain, query: q });
      }
    }
    if (!queriesToRun.length) return;
    const batchSize = 8;
    const start = this.searchCursor || 0;
    const subBatch = [];
    for (let n = 0; n < batchSize; n++) subBatch.push(queriesToRun[(start + n) % queriesToRun.length]);
    this.searchCursor = (start + batchSize) % queriesToRun.length;
    const tasks = subBatch.map(
      ({ chain, query }) => fetchWithTimeout(
        `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`,
        5500
      ).then((res) => ({ chain, pairs: res?.pairs }))
    );
    const results = await Promise.allSettled(tasks);
    for (const r of results) {
      if (r.status === "fulfilled" && Array.isArray(r.value?.pairs)) {
        for (const p of r.value.pairs) this.normalizeAndStoreDexScreenerPair(p);
      }
    }
  }
  normalizeAndStoreDexScreenerPair(p, profileMap) {
    if (!p || !p.chainId || !p.baseToken?.address) return;
    const chainNorm = normalizeChainName(p.chainId);
    const tokenAddr = identityAddress(chainNorm, p.baseToken.address);
    const key = `${chainNorm}:${tokenAddr}`;
    const mc = Number(p.marketCap || p.fdv || 0);
    const liq = Number(p.liquidity?.usd || 0);
    const reportedVol = p.volume?.h24;
    const vol = reportedVol == null ? null : Number(reportedVol);
    const knownVol = knownNumber(vol);
    if ((mc === 1e3 || mc >= 990 && mc <= 1010) && liq === 0 && (vol === 0 || vol == null)) {
      return;
    }
    const dexName = normalizeDexName(p.dexId);
    const profile = profileMap?.get(tokenAddr);
    const pair = {
      chainId: chainNorm,
      dexId: p.dexId || dexName.toLowerCase(),
      primaryDex: dexName,
      pairAddress: p.pairAddress,
      url: p.url || `https://dexscreener.com/${chainNorm}/${p.pairAddress}`,
      baseToken: {
        address: p.baseToken.address,
        name: p.baseToken.name || "",
        symbol: p.baseToken.symbol || ""
      },
      quoteToken: {
        address: p.quoteToken?.address || "",
        name: p.quoteToken?.name || "",
        symbol: p.quoteToken?.symbol || ""
      },
      priceNative: p.priceNative || "0",
      priceUsd: p.priceUsd ? String(p.priceUsd) : void 0,
      marketCap: p.marketCap || p.fdv || mc,
      fdv: p.fdv || mc,
      liquidity: p.liquidity,
      totalLiquidityUsd: liq || void 0,
      volumeComplete: knownVol,
      volume: knownVol ? { ...p.volume, h24: vol } : void 0,
      totalVolume24h: knownVol ? vol : void 0,
      discoveryMode: "search",
      priceChange: p.priceChange,
      txns: p.txns,
      pairCreatedAt: p.pairCreatedAt,
      info: {
        imageUrl: profile?.icon || p.info?.imageUrl,
        description: profile?.description || p.info?.description,
        websites: p.info?.websites || profile?.links?.filter((l) => l.type === "website"),
        socials: p.info?.socials || profile?.links?.filter((l) => l.type !== "website")
      },
      primaryProvider: "DexScreener",
      sources: [dexName],
      dexes: [dexName],
      discoveredAt: Date.now()
    };
    const tradeUrl = getDexTradingUrl(pair, dexName);
    if (tradeUrl) pair.primaryDexTradingUrl = tradeUrl;
    this.addOrUpdateToken(key, pair);
  }
  parseAndStoreGeckoPool(pool, included, chainName) {
    try {
      const attrs = pool?.attributes;
      if (!attrs) return;
      const baseTokenRelId = pool.relationships?.base_token?.data?.id;
      const dexRelId = pool.relationships?.dex?.data?.id;
      const tokenItem = included.find((i) => i.id === baseTokenRelId);
      const dexItem = included.find((i) => i.id === dexRelId);
      const tokenAttrs = tokenItem?.attributes || {};
      const dexAttrs = dexItem?.attributes || {};
      const address = tokenAttrs.address || attrs.address;
      if (!address) return;
      const symbol = tokenAttrs.symbol || attrs.name?.split("/")?.[0]?.trim() || "TOKEN";
      const name = tokenAttrs.name || symbol;
      const dexName = dexAttrs.name || normalizeDexName(dexRelId || "dex");
      const chainNorm = normalizeChainName(chainName);
      const priceUsd = attrs.base_token_price_usd ? String(attrs.base_token_price_usd) : void 0;
      const rawVol = attrs.volume_usd?.h24;
      const hasVol = rawVol != null && rawVol !== "" && Number.isFinite(Number(rawVol));
      const volume24h = hasVol ? Number(rawVol) : void 0;
      const rawLiq = attrs.reserve_in_usd;
      const hasLiq = rawLiq != null && rawLiq !== "" && Number.isFinite(Number(rawLiq));
      const liquidityUsd = hasLiq ? Number(rawLiq) : void 0;
      const fdv = attrs.fdv_usd != null && attrs.fdv_usd !== "" && Number.isFinite(Number(attrs.fdv_usd)) ? Number(attrs.fdv_usd) : void 0;
      const marketCap = attrs.market_cap_usd != null && attrs.market_cap_usd !== "" && Number.isFinite(Number(attrs.market_cap_usd)) ? Number(attrs.market_cap_usd) : fdv;
      const rawChange = attrs.price_change_percentage?.h24;
      const priceChangeH24 = rawChange != null && rawChange !== "" && Number.isFinite(Number(rawChange)) ? Number(rawChange) : void 0;
      let pairCreatedAt;
      if (attrs.pool_created_at) {
        const parsed = new Date(attrs.pool_created_at).getTime();
        if (!isNaN(parsed) && parsed > 0) pairCreatedAt = parsed;
      }
      const key = chainTokenKey(chainNorm, address);
      const pair = {
        chainId: chainNorm,
        dexId: dexRelId || dexName.toLowerCase(),
        primaryDex: dexName,
        pairAddress: attrs.address,
        url: `https://geckoterminal.com/${chainNorm}/pools/${attrs.address}`,
        baseToken: { address, name, symbol },
        quoteToken: { address: "", name: "", symbol: "" },
        priceNative: attrs.base_token_price_native_currency ? String(attrs.base_token_price_native_currency) : "0",
        priceUsd,
        marketCap,
        fdv,
        liquidity: hasLiq ? { usd: liquidityUsd } : void 0,
        totalLiquidityUsd: hasLiq ? liquidityUsd : void 0,
        volumeComplete: hasVol,
        volume: hasVol ? { h24: volume24h } : void 0,
        totalVolume24h: hasVol ? volume24h : void 0,
        priceChange: priceChangeH24 == null ? void 0 : { h24: priceChangeH24 },
        pairCreatedAt,
        info: {
          imageUrl: tokenAttrs.image_url || void 0
        },
        primaryProvider: `Native ${dexName}`,
        sources: [dexName],
        dexes: [dexName],
        discoveredAt: Date.now()
      };
      const tradeUrl = getDexTradingUrl(pair, dexName);
      if (tradeUrl) pair.primaryDexTradingUrl = tradeUrl;
      this.addOrUpdateToken(key, pair);
    } catch {
    }
  }
  /**
   * Direct ingestion interface for real-time providers (e.g. Argus Portal 8 on-chain watcher)
   */
  ingestToken(token) {
    const normChain = normalizeChainName(token.chainId);
    const addr = token.baseToken?.address || token.pairAddress;
    if (!addr) return;
    const key = chainTokenKey(normChain, addr);
    this.addOrUpdateToken(key, token);
  }
  addOrUpdateToken(key, token) {
    const existing = this.indexedTokens.get(key);
    const touchMarket = () => {
      existing.marketUpdatedAt = Date.now();
    };
    if (!existing) {
      const page = argusLaunchpadUrl(token.baseToken?.address);
      const owned = token.isArgusLaunch || token.isPonsLaunch || /argus|pons/i.test(String(token.primaryDex || token.launchPlatform || ""));
      if (token.isArgusLaunch && page) {
        token.url = page;
        token.primaryDexTradingUrl = page;
      } else if (owned && /uniswap\.org|arguspad\.io/i.test(String(token.url || ""))) token.url = undefined;
      if (!token.isArgusLaunch && owned && /uniswap\.org|arguspad\.io/i.test(String(token.primaryDexTradingUrl || ""))) token.primaryDexTradingUrl = undefined;
      token.firstSeenAt = token.firstSeenAt || Date.now();
      if (knownNumber(token.volume?.h24) || knownNumber(token.liquidity?.usd) || knownNumber(Number(token.priceUsd))) {
        token.marketUpdatedAt = token.marketUpdatedAt || Date.now();
      }
      const launched = Number(token.pairCreatedAt || 0);
      const launchedMs = launched > 0 && launched < 1e11 ? launched * 1000 : launched;
      const freshLaunch = token.discoveryMode === "onchain" && launchedMs > Date.now() - 10 * 60 * 1000;
      if (!this.seenKeys.has(key)) {
        recordUnique(this.metrics, freshLaunch ? "onchain" : token.discoveryMode === "onchain" ? "backfill" : "search");
      }
      this.seenKeys.add(key);
      this.indexedTokens.set(key, token);
      this.discoveredTodaySet.add(key);
      this.rollingDiscoveries.push(Date.now());
      this.trimIndex();
      return;
    }
    if (!existing.firstSeenAt) existing.firstSeenAt = existing.discoveredAt || Date.now();
    if (!existing.pairCreatedAt && token.pairCreatedAt) existing.pairCreatedAt = token.pairCreatedAt;
    let changed = false;
    if (token.priceUsd && Number(token.priceUsd) > 0) {
      existing.priceUsd = token.priceUsd;
      touchMarket();
    }
    if (token.priceNative && Number(token.priceNative) > 0) existing.priceNative = token.priceNative;
    if (typeof token.marketCap === "number" && token.marketCap > 0) {
      existing.marketCap = token.marketCap;
      existing.fdv = token.fdv || token.marketCap;
      touchMarket();
    }
    if (token.volumeComplete === false) {
      const keepVerified = existing.volumeComplete === true && knownNumber(existing.volume?.h24) && !knownNumber(token.volume?.h24);
      if (!keepVerified) {
        existing.volumeComplete = false;
        if (knownNumber(token.volumeObservedUsd)) existing.volumeObservedUsd = token.volumeObservedUsd;
        if (token.volumeObservedMs) existing.volumeObservedMs = token.volumeObservedMs;
        const shown = knownNumber(token.volume?.h24)
          ? token.volume.h24
          : knownNumber(token.volumeObservedUsd)
            ? token.volumeObservedUsd
            : null;
        if (shown != null) {
          existing.volume = { ...existing.volume || {}, h24: shown };
          existing.totalVolume24h = shown;
        } else {
          if (existing.volume) existing.volume = { ...existing.volume, h24: void 0 };
          existing.totalVolume24h = void 0;
        }
      }
    } else if (token.volume && knownNumber(token.volume.h24)) {
      existing.volume = { ...existing.volume || {}, ...token.volume };
      existing.totalVolume24h = token.volume.h24;
      existing.volumeComplete = true;
      touchMarket();
    }
    const incomingLiq = token.liquidity?.usd ?? token.totalLiquidityUsd;
    if (knownNumber(incomingLiq)) {
      existing.liquidity = { ...existing.liquidity || {}, usd: incomingLiq };
      existing.totalLiquidityUsd = incomingLiq;
      touchMarket();
    }
      if (token.info?.imageUrl && token.info.imageUrl !== "/argus.svg") {
        const current = existing.info?.imageUrl;
        if (!current || current === "/argus.svg" || current.endsWith("/argus.svg")) {
          if (!existing.info) existing.info = {};
          existing.info.imageUrl = token.info.imageUrl;
        }
      }
      if (token.info?.socials?.length) {
        if (!existing.info) existing.info = {};
        existing.info.socials = token.info.socials;
      }
      if (token.info?.websites?.length) {
        if (!existing.info) existing.info = {};
        existing.info.websites = token.info.websites;
      }
      if (token.info?.description && !existing.info?.description) {
        if (!existing.info) existing.info = {};
        existing.info.description = token.info.description;
      }
      if (token.argusPoolId) {
        existing.argusPoolId = token.argusPoolId;
        existing.pairAddress = token.argusPoolId;
      }
      if (token.bondingProgress !== void 0) {
        existing.bondingProgress = Math.max(existing.bondingProgress || 0, token.bondingProgress);
      }
      const fabricatedMove = existing.bondingProgress ? Math.round(existing.bondingProgress * 12.5) : null;
      if (token.priceChange?.h24) {
        existing.priceChange = token.priceChange;
      } else if (fabricatedMove !== null && existing.priceChange?.h24 === fabricatedMove) {
        existing.priceChange = void 0;
      }
      if (token.isArgusLaunch || existing.isArgusLaunch) {
        existing.isArgusLaunch = true;
        existing.chainId = "arc";
        existing.dexId = "argus";
        existing.primaryDex = "Argus";
        existing.launchPlatform = "Argus";
        existing.argusPortalId = token.argusPortalId || existing.argusPortalId;
        existing.argusPortalFamily = token.argusPortalFamily || existing.argusPortalFamily;
        existing.argusPortalAddress = token.argusPortalAddress || existing.argusPortalAddress;
        existing.argusHookAddress = token.argusHookAddress || existing.argusHookAddress;
        existing.argusLockerAddress = token.argusLockerAddress || existing.argusLockerAddress;
        existing.argusPoolId = token.argusPoolId || existing.argusPoolId;
        existing.argusPositionId = token.argusPositionId || existing.argusPositionId;
        existing.creator = token.creator || existing.creator;
        if (token.argusTotalFeeBps != null) existing.argusTotalFeeBps = token.argusTotalFeeBps;
        if (token.twitter) existing.twitter = token.twitter;
        if (token.telegram) existing.telegram = token.telegram;
        if (token.website) existing.website = token.website;
        if (token.baseToken?.name && token.baseToken.name !== "Argus") {
          const addr = existing.baseToken?.address || token.baseToken.address;
          const name = pickName(token.baseToken.name, existing.baseToken?.name, addr);
          const symbol = pickSymbol(token.baseToken.symbol, existing.baseToken?.symbol);
          existing.baseToken = {
            ...existing.baseToken,
            ...token.baseToken,
            address: addr,
            name,
            symbol,
          };
        }
        const page = argusLaunchpadUrl(existing.baseToken?.address || token.baseToken?.address);
        if (page) {
          existing.primaryDexTradingUrl = page;
          existing.url = page;
        }
      } else if (token.isGraduated && !existing.isArgusLaunch) {
        const pons = existing.isPonsLaunch || token.isPonsLaunch || existing.launchPlatform === "Pons V2" || token.launchPlatform === "Pons V2";
        existing.isGraduated = true;
        existing.isBondingCurve = false;
        if (pons) {
          existing.marketStage = "graduated";
          existing.dexId = "pons";
          existing.primaryDex = "Pons V2";
          existing.launchPlatform = "Pons V2";
        } else if ((existing.chainId || token.chainId) === "solana" || existing.launchPlatform === "Pump.fun" || token.launchPlatform === "Pump.fun") {
          existing.marketStage = "pumpswap";
          existing.primaryDex = "PumpSwap";
          existing.dexId = "pumpswap";
          existing.bondingProgress = 100;
        } else if (existing.marketStage === "bonding_curve") {
          existing.marketStage = "graduated";
        }
      }
      if ((token.sources || []).some((s) => s.includes("On-Chain")) && token.baseToken?.symbol && token.baseToken.symbol !== "PUMP") {
        existing.baseToken = {
          ...existing.baseToken,
          name: token.baseToken.name || existing.baseToken.name,
          symbol: token.baseToken.symbol
        };
        existing.launchPlatform = existing.launchPlatform || "Pump.fun";
        if (token.creator) existing.creator = token.creator;
        if (token.twitter && !existing.twitter) existing.twitter = token.twitter;
        if (token.telegram && !existing.telegram) existing.telegram = token.telegram;
        if (token.website && !existing.website) existing.website = token.website;
        if (!existing.pairCreatedAt && token.pairCreatedAt) existing.pairCreatedAt = token.pairCreatedAt;
      }
      const sourcesSet = /* @__PURE__ */ new Set([...existing.sources || [], ...token.sources || []]);
      existing.sources = Array.from(sourcesSet);
      const dexesSet = /* @__PURE__ */ new Set([...existing.dexes || [], ...token.dexes || []]);
      existing.dexes = Array.from(dexesSet);
      const venueNames = [...existing.dexes, token.primaryDex, token.dexId].map((value) => String(value || "").toLowerCase());
      const ponsFamily = existing.isPonsLaunch || token.isPonsLaunch || existing.launchPlatform === "Pons V2" || token.launchPlatform === "Pons V2";
      const pumpFamily = !ponsFamily && !existing.isArgusLaunch && (
        existing.launchPlatform === "Pump.fun" ||
        token.launchPlatform === "Pump.fun" ||
        ((existing.chainId || token.chainId) === "solana" && (existing.dexId === "pumpfun" || existing.dexId === "pumpswap"))
      );
      if (pumpFamily && venueNames.some((name) => name.includes("pumpswap"))) {
        existing.isGraduated = true;
        existing.isBondingCurve = false;
        existing.marketStage = "pumpswap";
        existing.primaryDex = "PumpSwap";
        existing.dexId = "pumpswap";
        existing.bondingProgress = 100;
      }
      applyPonsIdentity(existing, token);
      if (changed || token.priceUsd || token.volume || token.marketCap) recordUpdate(this.metrics);
      this.indexedTokens.set(key, existing);
      this.trimIndex();
  }
  repairVenueLabels() {
    if (this.venueLabelsRepaired) return;
    this.venueLabelsRepaired = true;
    for (const token of this.indexedTokens.values()) {
      if ((token.isPonsLaunch || token.launchPlatform === "Pons V2") && (token.dexId === "pumpswap" || token.primaryDex === "PumpSwap")) {
        token.dexId = "pons";
        token.primaryDex = "Pons V2";
        token.launchPlatform = "Pons V2";
        if (token.isGraduated) {
          token.isBondingCurve = false;
          token.marketStage = "graduated";
        }
      }
      const names = [...token.dexes || [], token.primaryDex, token.dexId].map((value) => String(value || "").toLowerCase());
      const pump = token.chainId === "solana" && (token.launchPlatform === "Pump.fun" || token.dexId === "pumpfun" || token.dexId === "pumpswap" || names.some((name) => name.includes("pump")));
      if (pump && token.isBondingCurve && names.some((name) => name.includes("pumpswap"))) {
        token.isGraduated = true;
        token.isBondingCurve = false;
        token.marketStage = "pumpswap";
        token.dexId = "pumpswap";
        token.primaryDex = "PumpSwap";
        token.launchPlatform = token.launchPlatform || "Pump.fun";
        token.bondingProgress = 100;
      }
    }
  }
  trimIndex() {
    if (this.indexedTokens.size <= MAX_TOKENS + 250) return;
    const kept = retainTokens(Array.from(this.indexedTokens.values()), MAX_TOKENS);
    const next = new Map();
    for (const token of kept) {
      const addr = token?.baseToken?.address;
      if (!addr) continue;
      next.set(chainTokenKey(token.chainId || "", addr), token);
    }
    this.indexedTokens = next;
  }
  cleanupOldRollingStats() {
    const oneMinAgo = Date.now() - 6e4;
    this.rollingDiscoveries = this.rollingDiscoveries.filter((t) => t >= oneMinAgo);
  }
  getTokens(options = {}) {
    const normChain = options.chain ? normalizeChainName(options.chain) : "all";
    let tokens = Array.from(this.indexedTokens.values());
    if (normChain !== "all") {
      tokens = tokens.filter((t) => normalizeChainName(t.chainId) === normChain);
    }
    return queryIndex(tokens, {
      mode: options.mode || "trending",
      age: options.age || "1w",
      limit: options.limit || 1000,
      cursor: options.cursor,
      minLiquidity: options.minLiquidity,
      maxLiquidity: options.maxLiquidity,
      minVolume: options.minVolume,
      maxVolume: options.maxVolume,
      minMarketCap: options.minMarketCap,
      maxMarketCap: options.maxMarketCap,
      now: options.now,
    }).tokens;
  }
  getStats() {
    const byChain = {};
    const byDex = {};
    for (const t of this.indexedTokens.values()) {
      const c = normalizeChainName(t.chainId) || "other";
      byChain[c] = (byChain[c] || 0) + 1;
      const d = t.primaryDex || "Other";
      byDex[d] = (byDex[d] || 0) + 1;
    }
    this.cleanupOldRollingStats();
    const rates = snapshot(this.metrics);
    return {
      totalIndexed: this.indexedTokens.size,
      recordsToday: countLaunchedToday(this.indexedTokens.values(), Date.now()),
      throughputPerMin: rates.liveLaunchesPerMin,
      observationWindowMs: rates.observationWindowMs,
      liveLaunchesPerMin: rates.liveLaunchesPerMin,
      searchInsertsPerMin: rates.searchInsertsPerMin,
      updatesPerMin: rates.updatesPerMin,
      rejectedPerMin: rates.rejectedPerMin,
      enrichOkPerMin: rates.enrichOkPerMin,
      enrichFailPerMin: rates.enrichFailPerMin,
      liveLaunchesLastHour: rates.liveLaunchesLastHour,
      cumulative: rates.cumulative,
      arcEnrichFailures: argusIndexer.enrichFail || 0,
      chainCoverage: CHAIN_COVERAGE,
      byChain,
      byDex,
      lastUpdated: this.lastIndexedAt,
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1e3),
      persisted: this.lastPersistOk === true,
      persistedAt: this.lastPersistAt || null
    };
  }
  exportData(format, chain, mode) {
    const tokens = this.getTokens({ chain, mode, limit: 5e3 });
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const chainLabel = chain ? normalizeChainName(chain) : "all_chains";
    if (format === "json") {
      return {
        data: JSON.stringify(tokens, null, 2),
        contentType: "application/json",
        filename: `dexhunter_discovery_${chainLabel}_${timestamp}.json`
      };
    }
    const headers = [
      "Address",
      "Chain",
      "Name",
      "Symbol",
      "PrimaryDEX",
      "TradingURL",
      "PriceUSD",
      "MarketCapUSD",
      "Volume24hUSD",
      "LiquidityUSD",
      "PriceChange24hPct",
      "MarketStage",
      "BondingProgressPct",
      "PairAddress",
      "CreatedAt",
      "Website",
      "Twitter",
      "Telegram"
    ];
    const rows = tokens.map((t) => {
      const volume = volumeMetric(t);
      const liquidity = liquidityMetric(t);
      const marketCap = marketCapMetric(t);
      const change = knownMetric(t.priceChange?.h24);
      const price = knownMetric(t.priceUsd);
      return [
      t.baseToken?.address || "",
      t.chainId,
      `"${(t.baseToken?.name || "").replace(/"/g, '""')}"`,
      `"${(t.baseToken?.symbol || "").replace(/"/g, '""')}"`,
      t.primaryDex || "",
      t.primaryDexTradingUrl || t.url || "",
      price == null ? "" : price,
      marketCap == null ? "" : marketCap,
      volume == null ? "" : volume,
      liquidity == null ? "" : liquidity,
      change == null ? "" : change,
      t.marketStage || (t.isGraduated ? "graduated" : t.isBondingCurve ? "bonding_curve" : "active"),
      t.bondingProgress !== void 0 ? t.bondingProgress.toFixed(1) : "",
      t.pairAddress || "",
      t.pairCreatedAt ? new Date(t.pairCreatedAt).toISOString() : "",
      t.website || "",
      t.twitter || "",
      t.telegram || ""
    ];
    });
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    return {
      data: csvContent,
      contentType: "text/csv",
      filename: `dexhunter_discovery_${chainLabel}_${timestamp}.csv`
    };
  }
}
const discoveryGlobal = globalThis;
const discoveryEngine = discoveryGlobal.__dexhunterDiscovery ??= new DiscoveryEngine();
// The process keeps this object across module reloads. Point it at the
// current class so methods added after startup are actually callable.
Object.setPrototypeOf(discoveryEngine, DiscoveryEngine.prototype);
export {
  DiscoveryEngine,
  discoveryEngine
};
