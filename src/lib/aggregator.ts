import { TokenPair, FilterOptions, TokenBoost, TokenProfile, NormalizedPair } from "../types";
import { preserveXUrl } from "./xLinkKind.js";
import { DexScreenerProvider } from "./providers/dexscreener";
import { PumpFunProvider } from "./providers/pumpfun";
import { OnChainProvider } from "./providers/onchain";
import { SolanaRPCProvider } from "./providers/solana";
import { SolanaDexProvider } from "./providers/solanaDex";
import { NativeEvmDexProvider } from "./providers/nativeEvmDex";
import { serverDiscoveryProvider, fetchPreparedPool, clearPreparedPoolCache } from "./providers/serverDiscovery";
import { argusProvider, ArgusProvider } from "./providers/argus";
import { IDexHunterProvider } from "./providers/types";
import {
  normalizeDexName,
  normalizeChainName,
  selectPrimaryDex,
  normalizePair,
  isLaunchPlatformOnly,
  getDexLogo,
  getDexTradingUrl,
  getDexBuyUrl,
  getProviderDetails,
  getProviderPriorityRank,
  type ProviderDetails,
  DEX_LOGO_MAP,
  DEX_PRIORITY,
  isSolanaToken,
  isEvmToken,
  isSolanaAddress,
  isEvmAddress,
  formatTokenAddress,
  getCanonicalCompositeKey,
} from "./dexPriority";
import {
  isExcludedTrendingAsset,
  qualifyTrendingToken,
  calculateDiscoveryScore,
  calculateTokenQualityScore,
  calculateFinalDexHunterScore,
  classifyToken,
  enrichTokenMetadata,
  qualifyAndEnrichTrendingTokens,
  getCanonicalTokenLogo,
  calculateSocialScore,
  calculateSpamRisk,
  EXCLUDED_TRENDING_ASSETS,
  CANONICAL_TOKEN_LOGOS,
  CANONICAL_SYMBOL_LOGOS,
  runTokenQualificationTests,
  hasSocialLinks,
} from "./tokenQualification";

// Re-export DEX Priority and normalizers for direct use across the app
export {
  normalizeDexName,
  normalizeChainName,
  selectPrimaryDex,
  normalizePair,
  isLaunchPlatformOnly,
  getDexLogo,
  getDexTradingUrl,
  getDexBuyUrl,
  getProviderDetails,
  getProviderPriorityRank,
  type ProviderDetails,
  DEX_LOGO_MAP,
  DEX_PRIORITY,
  isExcludedTrendingAsset,
  qualifyTrendingToken,
  calculateDiscoveryScore,
  calculateTokenQualityScore,
  calculateFinalDexHunterScore,
  classifyToken,
  enrichTokenMetadata,
  qualifyAndEnrichTrendingTokens,
  getCanonicalTokenLogo,
  calculateSocialScore,
  calculateSpamRisk,
  EXCLUDED_TRENDING_ASSETS,
  CANONICAL_TOKEN_LOGOS,
  CANONICAL_SYMBOL_LOGOS,
  runTokenQualificationTests,
  hasSocialLinks,
};

// ==========================================
// PROVIDER INSTANCES & IN-MEMORY CACHE
// ==========================================

const providers: IDexHunterProvider[] = [
  serverDiscoveryProvider,
  argusProvider,
  new DexScreenerProvider(),
  new NativeEvmDexProvider(),
  new PumpFunProvider(),
  new OnChainProvider(),
  new SolanaRPCProvider(),
  new SolanaDexProvider(),
];

// Simple in-memory cache with TTL (15s) to avoid unnecessary API hammering
interface CacheEntry {
  data: TokenPair[];
  timestamp: number;
  ttl: number;
}
const cacheMap = new Map<string, CacheEntry>();
const DEFAULT_CACHE_TTL_MS = 15000;

function getCached(key: string): TokenPair[] | null {
  const entry = cacheMap.get(key);
  if (!entry) return null;
  const ttl = entry.ttl || DEFAULT_CACHE_TTL_MS;
  if (Date.now() - entry.timestamp > ttl) {
    cacheMap.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: TokenPair[], ttl = DEFAULT_CACHE_TTL_MS) {
  cacheMap.set(key, { data, timestamp: Date.now(), ttl });
}

// ==========================================
// LEGACY BACKWARD-COMPATIBLE HELPERS
// ==========================================

export async function fetchDexScreenerBoosts(signal?: AbortSignal): Promise<TokenBoost[]> {
  const ds = new DexScreenerProvider();
  return (await ds.discoverTokens("trending", signal)) as any;
}

export async function fetchDexScreenerProfiles(signal?: AbortSignal): Promise<TokenProfile[]> {
  const ds = new DexScreenerProvider();
  return (await ds.discoverTokens("latest", signal)) as any;
}

export async function fetchPumpFunTokens(signal?: AbortSignal): Promise<TokenPair[]> {
  const pf = new PumpFunProvider();
  const raw = await pf.discoverTokens("latest", signal);
  const merged = deduplicateAndMergeTokens(raw);
  return merged.sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0));
}

export async function fetchTokenDetailsByAddresses(addresses: string[], signal?: AbortSignal): Promise<TokenPair[]> {
  if (!addresses || addresses.length === 0) return [];
  const ds = new DexScreenerProvider();
  const pf = new PumpFunProvider();
  const onchain = new OnChainProvider();
  const solDex = new SolanaDexProvider();
  const solRpc = new SolanaRPCProvider();

  const queries: Promise<Partial<TokenPair>[]>[] = [
    ds.getTokenByAddress(addresses.join(","), undefined, signal),
  ];

  // If any address looks like a Solana base58 mint (length 32-44, not 0x), concurrently query all Solana providers
  const solanaMints = addresses.filter(a => !a.startsWith("0x") && a.length >= 32 && a.length <= 44);
  for (const mint of solanaMints.slice(0, 10)) {
    queries.push(pf.getTokenByAddress(mint, "solana", signal));
    queries.push(onchain.getTokenByAddress(mint, "solana", signal));
    queries.push(solDex.getTokenByAddress(mint, "solana", signal));
    queries.push(solRpc.getTokenByAddress(mint, "solana", signal));
  }

  const settled = await Promise.allSettled(queries);
  const rawPairs: Partial<TokenPair>[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled" && Array.isArray(r.value)) {
      rawPairs.push(...r.value);
    }
  }

  return deduplicateAndMergeTokens(rawPairs);
}

// ==========================================
// DEX & SOURCE DISPLAY RESOLVER
// ==========================================

export function getDEXDisplayName(dexId?: string): string {
  if (!dexId) return "DEX";
  const normalized = normalizeDexName(dexId);
  return normalized === "Unknown" ? "DEX" : normalized;
}

export function getSingleSourceDisplayName(pair: Partial<TokenPair> | string[]): string {
  if (!pair) return "DEX";
  
  if (Array.isArray(pair)) {
    const selected = selectPrimaryDex({ dexes: pair, sources: pair });
    if (selected) return selected;
    const sorted = [...pair].sort((a, b) => a.localeCompare(b));
    return sorted[0] || "DEX";
  }

  const selected = selectPrimaryDex(pair);
  if (selected) return selected;

  if (pair.launchPlatform && isLaunchPlatformOnly(pair.launchPlatform)) {
    return "Bonding Curve";
  }

  return getDEXDisplayName(pair.dexId || pair.primaryProvider);
}

// ==========================================
// CANONICAL SCORE & 1K MCAP FILTERING
// ==========================================

export function is1kMarketCap(pair: Partial<TokenPair>): boolean {
  if (!pair) return false;
  // Never filter out active bonding curve tokens, Pump.fun tokens, migrated tokens, or tokens on recognized DEXes
  if (
    pair.isBondingCurve ||
    pair.isGraduated ||
    Boolean((pair as any).complete) ||
    pair.bondingCurvePda ||
    pair.launchPlatform === "Pump.fun" ||
    pair.dexId === "pumpswap" ||
    pair.primaryDex === "PumpSwap" ||
    pair.marketStage === "pumpswap" ||
    pair.marketStage === "graduated" ||
    pair.dexId === "orca" ||
    pair.primaryDex === "Orca" ||
    pair.dexId === "meteora" ||
    pair.primaryDex === "Meteora" ||
    pair.dexId === "raydium" ||
    pair.primaryDex === "Raydium" ||
    pair.sources?.some((s) => ["pumpswap", "orca", "meteora", "raydium"].includes(s.toLowerCase())) ||
    pair.dexes?.some((d) => ["pumpswap", "orca", "meteora", "raydium"].includes(d.toLowerCase())) ||
    isPumpSwapCandidate(pair)
  ) {
    return false;
  }
  const mc = Number(pair.marketCap || pair.fdv || 0);
  const liq = Number(pair.liquidity?.usd || (pair as any).totalLiquidityUsd || 0);
  const vol = Number(pair.volume?.h24 || (pair as any).totalVolume24h || 0);
  // Only filter if it's a dead artifact with exact $1000 placeholder and no volume/liquidity
  if ((mc === 1000 || (mc >= 990 && mc <= 1010)) && liq === 0 && vol === 0) {
    return true;
  }
  return false;
}

export function isGenericName(name?: string): boolean {
  if (!name) return true;
  const n = name.trim();
  if (n === "" || n === "N/A" || n === "Unknown" || n === "undefined" || n === "null") return true;
  if (/^Pump Token\b/i.test(n)) return true;
  if (/^Solana Token\b/i.test(n)) return true;
  if (/^Token\s+[0-9a-zA-Z]{4,}/i.test(n)) return true;
  return false;
}

export function isGenericSymbol(symbol?: string): boolean {
  if (!symbol) return true;
  const s = symbol.trim().toUpperCase();
  if (s === "" || s === "N/A" || s === "UNKNOWN" || s === "TOKEN" || s === "NULL" || s === "UNDEFINED") return true;
  if (s === "PUMP" || s === "SOL") return true;
  return false;
}

export function isRealImageUrl(url?: string): boolean {
  if (!url || typeof url !== "string") return false;
  const clean = url.trim();
  if (clean === "" || clean === "null" || clean === "undefined") return false;
  if (clean.includes("dd.dexscreener.com/ds-data/tokens/")) return false; // speculative CDN fallback
  return true;
}

export function isValidHttpUrl(url?: string): boolean {
  if (!url || typeof url !== "string") return false;
  const clean = url.trim();
  if (clean === "" || clean === "null" || clean === "undefined") return false;
  return clean.startsWith("http://") || clean.startsWith("https://");
}

function calculateCanonicalScore(pair: Partial<TokenPair>): number {
  let score = 0;

  // Identity & Metadata Completeness (Highest Priority)
  if (!isGenericName(pair.baseToken?.name)) score += 150;
  if (!isGenericSymbol(pair.baseToken?.symbol)) score += 150;
  if (isRealImageUrl(pair.info?.imageUrl)) score += 200;
  else if (pair.info?.imageUrl) score += 50;

  if (pair.info?.websites && pair.info.websites.length > 0) score += 100;
  if (pair.info?.socials && pair.info.socials.length > 0) score += 100;

  // Active market venues (PumpSwap, Orca, Meteora, Raydium) with real volume or liquidity
  const normDex = normalizeDexName(pair.dexId || pair.primaryDex);
  const isMarketPool = normDex === "PumpSwap" || normDex === "Orca" || normDex === "Meteora" || normDex === "Raydium";
  if (isMarketPool) {
    score += 150;
    if (normDex === "PumpSwap") score += 100;
  }
  if (pair.isGraduated || pair.marketStage === "pumpswap" || pair.marketStage === "graduated" || Boolean((pair as any).complete)) {
    score += 150;
  }

  // On-chain verified protocol signals
  if (pair.bondingCurvePda) score += 60;
  if (pair.primaryProvider === "Pump.fun" || pair.launchPlatform === "Pump.fun") score += 60;

  // Real observed liquidity & volume (bounded so it never overrides metadata completeness)
  const liq = Number(pair.liquidity?.usd || (pair as any).totalLiquidityUsd || 0);
  const vol = Number(pair.volume?.h24 || (pair as any).totalVolume24h || 0);
  score += Math.min(liq / 500, 150);
  score += Math.min(vol / 1000, 150);

  return score;
}

// Known Solana Quote Mints for Base/Quote separation
const SOLANA_QUOTE_MINTS = new Set([
  "so11111111111111111111111111111111111111112", // WSOL
  "epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v", // USDC
  "es9vmfrzacerrmjfrf4h2fyd4kconky11mcce8benwny",  // USDT
  "es9vmfrzacerrmjfrf4h2fyd4kconky11mcce8benwnyb", // USDT
  "usdh1sm1ojcxkgzsq8mdtxgiqxdcntnhntfhnmmtz2w",  // USDH
  "usdswr9apdhk5bvjkmjzff41tptr8auuhqgydqiskpt",  // USDS
  "7kbnvu9pljmxkdpbv9pquzvdgcvpkvky7vcvqev8pump", // JUP
]);

// ==========================================
// DEDUPLICATION & MULTI-SOURCE MERGING ENGINE
// Primary Matching Key: chainId + tokenAddress
// Preserves ALL underlying pairs and unique DEX venues
// ==========================================

export function deduplicateAndMergeTokens(rawPairs: Partial<TokenPair>[]): TokenPair[] {
  const groupsMap = new Map<string, Partial<TokenPair>[]>();

  for (const pair of rawPairs) {
    if (!pair) continue;
    if (is1kMarketCap(pair)) continue;

    // Resolve contract address (mint for Solana, contract for EVM)
    const rawMint = (pair as any).mint || (pair as any).tokenAddress || (pair as any).contractAddress;
    let baseAddr = pair.baseToken?.address;
    const quoteAddr = pair.quoteToken?.address;

    // If baseToken is a known quote token (e.g., WSOL, USDC), swap base and quote so the target token is baseToken
    if (baseAddr && SOLANA_QUOTE_MINTS.has(baseAddr.toLowerCase().trim()) && quoteAddr && !SOLANA_QUOTE_MINTS.has(quoteAddr.toLowerCase().trim())) {
      const tempToken = pair.baseToken;
      pair.baseToken = pair.quoteToken;
      pair.quoteToken = tempToken;
      baseAddr = quoteAddr;
    }

    const rawAddr = rawMint || baseAddr || (pair as any).address || (
      pair.pairAddress && !SOLANA_QUOTE_MINTS.has(pair.pairAddress.toLowerCase().trim())
        ? pair.pairAddress
        : ""
    );
    if (!rawAddr) continue;

    const chain = normalizeChainName(pair.chainId, typeof rawAddr === "string" ? rawAddr : undefined, pair.url);
    const addr = formatTokenAddress(rawAddr, chain);
    if (!addr) continue;

    if (!pair.baseToken) {
      pair.baseToken = {
        address: addr,
        name: (pair as any).name || (pair as any).tokenName || "Token",
        symbol: (pair as any).symbol || (pair as any).tokenSymbol || "TOKEN",
      };
    } else {
      pair.baseToken.address = addr;
    }

    pair.chainId = chain;

    // Canonical Composite Key: chain:canonical_address
    const key = getCanonicalCompositeKey(chain, addr);

    if (!groupsMap.has(key)) {
      groupsMap.set(key, []);
    }
    groupsMap.get(key)!.push(pair);
  }

  const canonicalResults: TokenPair[] = [];

  groupsMap.forEach((pairsGroup) => {
    if (pairsGroup.length === 0) return;
    if (pairsGroup.every((p) => is1kMarketCap(p))) return;

    // Rank candidates to find canonical base entry:
    // Prioritize active DEX market pools (PumpSwap, Orca, Meteora, Raydium) with real volume/liquidity
    // and favor the most active/freshest pool record (PumpSwap) over older bonding curve records
    pairsGroup.sort((a, b) => {
      const aIsPS = isPumpSwapCandidate(a) || normalizeDexName(a.dexId || a.primaryDex) === "PumpSwap" || a.marketStage === "pumpswap";
      const bIsPS = isPumpSwapCandidate(b) || normalizeDexName(b.dexId || b.primaryDex) === "PumpSwap" || b.marketStage === "pumpswap";

      const aVol = Number(a.volume?.h24 || (a as any).totalVolume24h || 0);
      const bVol = Number(b.volume?.h24 || (b as any).totalVolume24h || 0);
      const aLiq = Number(a.liquidity?.usd || (a as any).totalLiquidityUsd || 0);
      const bLiq = Number(b.liquidity?.usd || (b as any).totalLiquidityUsd || 0);

      const aNormDex = normalizeDexName(a.dexId || a.primaryDex);
      const bNormDex = normalizeDexName(b.dexId || b.primaryDex);
      const aIsMarket = (aNormDex === "PumpSwap" || aNormDex === "Orca" || aNormDex === "Meteora" || aNormDex === "Raydium");
      const bIsMarket = (bNormDex === "PumpSwap" || bNormDex === "Orca" || bNormDex === "Meteora" || bNormDex === "Raydium");

      const aHasMarket = (aVol > 0 || aLiq > 0) && aIsMarket;
      const bHasMarket = (bVol > 0 || bLiq > 0) && bIsMarket;

      // 1. PumpSwap records strictly prioritized over other venues for Pump.fun tokens
      if (aIsPS !== bIsPS) return aIsPS ? -1 : 1;

      // 2. Active market pool with trades strictly beats inactive/pre-migration records
      if (aHasMarket !== bHasMarket) return aHasMarket ? -1 : 1;

      // 3. Graduated status beats pre-migration bonding curve
      const aGrad = Boolean(a.isGraduated || a.marketStage === "graduated" || a.marketStage === "pumpswap" || (a as any).complete);
      const bGrad = Boolean(b.isGraduated || b.marketStage === "graduated" || b.marketStage === "pumpswap" || (b as any).complete);
      if (aGrad !== bGrad) return aGrad ? -1 : 1;

      // 4. Higher volume then higher liquidity (prioritize most active pool)
      if (bVol !== aVol) return bVol - aVol;
      if (bLiq !== aLiq) return bLiq - aLiq;

      // 5. Recency: Favor the freshest/most recent update over older records
      const timeA = Number(a.providerFetchTimestamp || (a as any).lastRefreshedAt || a.pairCreatedAt || 0);
      const timeB = Number(b.providerFetchTimestamp || (b as any).lastRefreshedAt || b.pairCreatedAt || 0);
      if (timeB !== timeA) return timeB - timeA;

      // 6. Canonical metadata quality score
      const scoreB = calculateCanonicalScore(b);
      const scoreA = calculateCanonicalScore(a);
      return scoreB - scoreA;
    });
    const primary = { ...pairsGroup[0] } as TokenPair;

    if (is1kMarketCap(primary)) return;

    // Merge DEX sources and liquidity/volume across all records
    const isSolana = isSolanaToken(primary) || normalizeChainName(primary.chainId) === "solana";
    const sourcesSet = new Set<string>();
    const dexesSet = new Set<string>();
    const normalizedPairsMap = new Map<string, NormalizedPair>();
    let aggregatedLiquidity = 0;
    let aggregatedVolume = 0;
    let isPumpFunToken = isSolana && Boolean(
      primary.launchPlatform === "Pump.fun" ||
      primary.url?.includes("pump.fun") ||
      primary.primaryProvider === "Pump.fun" ||
      primary.bondingCurvePda
    );

    const websitesMap = new Map<string, { type: string; label?: string; url: string }>();
    const socialsMap = new Map<string, { type: string; url: string }>();

    // Pre-populate with existing valid primary socials / websites if present
    if (primary.info?.websites) {
      for (const w of primary.info.websites) {
        if (w?.url && isValidHttpUrl(w.url)) websitesMap.set(w.url.toLowerCase(), w);
      }
    }
    if (primary.info?.socials) {
      for (const s of primary.info.socials) {
        if (s?.url && isValidHttpUrl(s.url)) socialsMap.set(s.url.toLowerCase(), s);
      }
    }

    // Retain initial high-quality image if primary already has one
    let bestImageUrl = isRealImageUrl(primary.info?.imageUrl) ? primary.info!.imageUrl : undefined;
    let bestDescription = (primary.info as any)?.description || "";

    for (const p of pairsGroup) {
      // Normalize pair info
      const normP = normalizePair(p, p.primaryProvider || "Aggregator");
      const pairKey = `${normP.dexName}:${normP.pairAddress || normP.baseToken.address}`;
      if (!normalizedPairsMap.has(pairKey)) {
        normalizedPairsMap.set(pairKey, normP);
      }

      // Check for launch platform (strictly Solana)
      if (
        isSolana &&
        (p.launchPlatform === "Pump.fun" ||
          p.url?.includes("pump.fun") ||
          p.primaryProvider === "Pump.fun" ||
          p.bondingCurvePda ||
          (p.dexId && p.dexId.toLowerCase() === "pumpfun"))
      ) {
        isPumpFunToken = true;
      }

      // Record DEX and Source names
      const dName = normalizeDexName(p.dexId || normP.dexName);
      if (dName && dName !== "Unknown") {
        if (!isLaunchPlatformOnly(dName)) {
          if (dName !== "PumpSwap" || isSolana) {
            dexesSet.add(dName);
          }
        }
        if (dName !== "PumpSwap" || isSolana) {
          sourcesSet.add(dName);
        }
      }

      if (p.primaryProvider) {
        sourcesSet.add(p.primaryProvider);
      }

      if (p.sources) {
        for (const s of p.sources) {
          const sNorm = normalizeDexName(s);
          if (sNorm && sNorm !== "Unknown") {
            if (!isLaunchPlatformOnly(sNorm)) {
              if (sNorm !== "PumpSwap" || isSolana) {
                dexesSet.add(sNorm);
              }
            }
            if (sNorm !== "PumpSwap" || isSolana) {
              sourcesSet.add(sNorm);
            }
          } else {
            sourcesSet.add(s);
          }
        }
      }

      // Only merge USD metrics that are unit-compatible. Skip records that
      // lack a verified USD price or have incomplete volume, so raw quote
      // units from one provider cannot outrank a verified USD figure.
      const pHasUsd = Number(p.priceUsd) > 0 || p.volumeComplete === true;
      const pLiq = pHasUsd ? Number(p.liquidity?.usd || 0) : 0;
      const pVol = pHasUsd ? Number(p.volume?.h24 || 0) : 0;
      if (pLiq > aggregatedLiquidity) aggregatedLiquidity = pLiq;
      if (pVol > aggregatedVolume) aggregatedVolume = pVol;

      // Merge priceUsd if primary is 0 or missing
      const primaryPriceNum = Number(primary.priceUsd) || 0;
      const pPriceNum = Number(p.priceUsd) || 0;
      if (primaryPriceNum === 0 && pPriceNum > 0) {
        primary.priceUsd = String(p.priceUsd);
        if (p.priceNative) primary.priceNative = p.priceNative;
      }

      // Merge priceChange if primary is missing/zero
      if ((!primary.priceChange?.h24 || primary.priceChange.h24 === 0) && p.priceChange?.h24) {
        primary.priceChange = p.priceChange;
      }

      // Comprehensive launch timeline resolution: select earliest valid creation timestamp across all pools/sources
      const candidateTimes: number[] = [];
      const addCandidateTs = (val: any) => {
        if (!val) return;
        const n = typeof val === "string" ? (Number(val) || new Date(val).getTime()) : Number(val);
        if (!isNaN(n) && n > 0) {
          candidateTimes.push(n < 10000000000 ? n * 1000 : n);
        }
      };

      addCandidateTs(primary.pairCreatedAt);
      addCandidateTs(p.pairCreatedAt);
      if (Array.isArray(primary.pairs)) {
        for (const pr of primary.pairs) addCandidateTs(pr.pairCreatedAt);
      }
      if (Array.isArray(p.pairs)) {
        for (const pr of p.pairs) addCandidateTs(pr.pairCreatedAt);
      }

      if (candidateTimes.length > 0) {
        primary.pairCreatedAt = Math.min(...candidateTimes);
      }

      // Merge baseToken name & symbol if primary has generic placeholders
      if (isGenericName(primary.baseToken?.name) && !isGenericName(p.baseToken?.name)) {
        if (!primary.baseToken) {
          primary.baseToken = {
            address: p.baseToken?.address || primary.pairAddress || "",
            name: p.baseToken!.name,
            symbol: p.baseToken?.symbol || "TOKEN",
          };
        } else {
          primary.baseToken.name = p.baseToken!.name;
        }
      }

      if (isGenericSymbol(primary.baseToken?.symbol) && !isGenericSymbol(p.baseToken?.symbol)) {
        if (!primary.baseToken) {
          primary.baseToken = {
            address: p.baseToken?.address || primary.pairAddress || "",
            name: p.baseToken?.name || "Token",
            symbol: p.baseToken!.symbol,
          };
        } else {
          primary.baseToken.symbol = p.baseToken!.symbol;
        }
      }

      // Field-level image merging with Provider Precedence:
      // Priority 1: Verified Pump.fun on-chain / Metaplex / native IPFS logo
      // Priority 2: Verified DEX / high-res CDN logo
      // Rule: Valid image from Pump.fun or on-chain sources must NEVER be overwritten by null, empty, or generic placeholders
      if (p.info?.imageUrl) {
        const candidateIsReal = isRealImageUrl(p.info.imageUrl);
        if (candidateIsReal) {
          const isPumpFunCandidate = p.primaryProvider === "Pump.fun" || p.launchPlatform === "Pump.fun" || Boolean(p.bondingCurvePda);
          if (!bestImageUrl || !isRealImageUrl(bestImageUrl)) {
            bestImageUrl = p.info.imageUrl;
          } else if (isPumpFunCandidate) {
            // Keep or upgrade to high-fidelity native Pump.fun/Metaplex image
            bestImageUrl = p.info.imageUrl;
          }
        } else if (!bestImageUrl) {
          bestImageUrl = p.info.imageUrl;
        }
      }

      // Field-level website and social links merging from structured info and direct root-level fields
      const candidateWebsites = [...(p.info?.websites || [])];
      const directWeb = (p as any).website || (p as any).web || (p as any).website_url;
      if (directWeb && typeof directWeb === "string" && !candidateWebsites.some(w => w.url === directWeb)) {
        candidateWebsites.push({ type: "website", label: "Website", url: directWeb });
      }
      if (Array.isArray((p as any).websites)) {
        for (const w of (p as any).websites) {
          if (w?.url) candidateWebsites.push(w);
          else if (typeof w === "string") candidateWebsites.push({ type: "website", label: "Website", url: w });
        }
      }
      if ((p as any).links?.website) {
        candidateWebsites.push({ type: "website", label: "Website", url: (p as any).links.website });
      }
      if ((p as any).socials?.website) {
        candidateWebsites.push({ type: "website", label: "Website", url: (p as any).socials.website });
      }

      // Field-level social links merging from structured info and direct root-level fields
      const candidateSocials = [...(p.info?.socials || [])];
      const directTg = (p as any).telegram || (p as any).tg || (p as any).telegram_url;
      if (directTg && typeof directTg === "string") {
        const clean = directTg.trim().replace(/^@/, "");
        const url = clean.startsWith("http") ? clean : `https://t.me/${clean}`;
        candidateSocials.push({ type: "telegram", url });
      }

      const directTw = (p as any).twitter || (p as any).x || (p as any).twitter_url || (p as any).x_url;
      if (directTw && typeof directTw === "string") {
        const url = preserveXUrl(directTw);
        if (url) candidateSocials.push({ type: "twitter", url });
      }

      const directDisc = (p as any).discord || (p as any).discord_url;
      if (directDisc && typeof directDisc === "string") {
        const clean = directDisc.trim();
        const url = clean.startsWith("http") ? clean : `https://${clean}`;
        candidateSocials.push({ type: "discord", url });
      }

      if (Array.isArray((p as any).socials)) {
        for (const s of (p as any).socials) {
          if (s?.url) candidateSocials.push(s);
        }
      } else if ((p as any).socials && typeof (p as any).socials === "object") {
        const obj = (p as any).socials;
        if (obj.twitter || obj.x) candidateSocials.push({ type: "twitter", url: obj.twitter || obj.x });
        if (obj.telegram || obj.tg) candidateSocials.push({ type: "telegram", url: obj.telegram || obj.tg });
        if (obj.discord) candidateSocials.push({ type: "discord", url: obj.discord });
      }

      if (Array.isArray((p as any).links)) {
        for (const l of (p as any).links) {
          if (l?.url) candidateSocials.push(l);
        }
      } else if ((p as any).links && typeof (p as any).links === "object") {
        const obj = (p as any).links;
        if (obj.twitter || obj.x) candidateSocials.push({ type: "twitter", url: obj.twitter || obj.x });
        if (obj.telegram || obj.tg) candidateSocials.push({ type: "telegram", url: obj.telegram || obj.tg });
        if (obj.discord) candidateSocials.push({ type: "discord", url: obj.discord });
      }

      // Process websites
      for (const w of candidateWebsites) {
        if (w?.url && typeof w.url === "string") {
          const raw = w.url.trim();
          if (!raw || raw === "null" || raw === "undefined") continue;
          const cleanUrl = raw.startsWith("http") ? raw : `https://${raw}`;
          const lower = cleanUrl.toLowerCase();
          // If website entry is actually a social link, redirect to candidateSocials
          if (lower.includes("twitter.com") || lower.includes("x.com") || lower.includes("t.me") || lower.includes("telegram") || lower.includes("discord")) {
            candidateSocials.push({ type: "link", url: cleanUrl });
          } else if (isValidHttpUrl(cleanUrl)) {
            websitesMap.set(cleanUrl.toLowerCase(), {
              type: w.type || "website",
              label: w.label || "Website",
              url: cleanUrl,
            });
          }
        }
      }

      // Process socials
      for (const s of candidateSocials) {
        if (s?.url && typeof s.url === "string") {
          const raw = s.url.trim();
          if (!raw || raw === "null" || raw === "undefined") continue;
          const cleanUrl = raw.startsWith("http") ? raw : `https://${raw}`;
          if (isValidHttpUrl(cleanUrl)) {
            const lower = cleanUrl.toLowerCase();
            let sType = s.type || "link";
            if (!s.type || s.type === "link") {
              if (lower.includes("twitter.com") || lower.includes("x.com")) sType = "twitter";
              else if (lower.includes("t.me") || lower.includes("telegram")) sType = "telegram";
              else if (lower.includes("discord")) sType = "discord";
            }
            if (sType === "link" && !lower.includes("twitter.com") && !lower.includes("x.com") && !lower.includes("t.me") && !lower.includes("telegram") && !lower.includes("discord")) {
              // It's a general website link
              websitesMap.set(cleanUrl.toLowerCase(), {
                type: "website",
                label: "Website",
                url: cleanUrl,
              });
            } else {
              socialsMap.set(cleanUrl.toLowerCase(), {
                type: sType,
                url: cleanUrl,
              });
            }
          }
        }
      }

      // Merge description if missing or empty, giving precedence to rich descriptions
      const candidateDesc = (p.info as any)?.description || (p as any).description;
      if (candidateDesc && typeof candidateDesc === "string" && candidateDesc.trim()) {
        if (!bestDescription || (candidateDesc.length > bestDescription.length && (p.primaryProvider === "Pump.fun" || p.launchPlatform === "Pump.fun"))) {
          bestDescription = candidateDesc.trim();
        }
      }

      // Preserve marketCap and fdv from richest source
      const pMcap = Number(p.marketCap || p.fdv || 0);
      const primaryMcap = Number(primary.marketCap || primary.fdv || 0);
      if (pMcap > primaryMcap) {
        primary.marketCap = pMcap;
        primary.fdv = pMcap;
      }

      // Preserve on-chain Pump.fun bonding curve properties without regressing graduation
      if (p.bondingCurvePda) primary.bondingCurvePda = p.bondingCurvePda;
      if (typeof p.bondingProgress === "number") {
        primary.bondingProgress = Math.max(primary.bondingProgress || 0, p.bondingProgress);
      }
      if (p.creator) primary.creator = p.creator;
      if (p.realSolReservesFormatted) primary.realSolReservesFormatted = p.realSolReservesFormatted;
      if (p.virtualTokenReserves) primary.virtualTokenReserves = p.virtualTokenReserves;
      if (p.virtualSolReserves) primary.virtualSolReserves = p.virtualSolReserves;
      if (p.realTokenReserves) primary.realTokenReserves = p.realTokenReserves;
      if (p.realSolReserves) primary.realSolReserves = p.realSolReserves;
      if (p.tokenTotalSupply) primary.tokenTotalSupply = p.tokenTotalSupply;
    }

    // Preserve all underlying trading pairs & unique DEXes
    const allDiscoveredPairs = Array.from(normalizedPairsMap.values());
    primary.pairs = allDiscoveredPairs;

    // Ensure PumpSwap is strictly placed ahead of Raydium in all multi-DEX listings
    const normChain = normalizeChainName(primary.chainId);
    const chainPriority = DEX_PRIORITY[normChain] || [];
    const sortDexVenues = (list: string[]) => {
      return [...list].sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        // PumpSwap strictly ahead of Raydium
        if (aLower.includes("pumpswap") && bLower.includes("raydium")) return -1;
        if (bLower.includes("pumpswap") && aLower.includes("raydium")) return 1;
        const rankA = chainPriority.findIndex((d) => d.toLowerCase() === aLower);
        const rankB = chainPriority.findIndex((d) => d.toLowerCase() === bLower);
        if (rankA !== -1 && rankB !== -1) return rankA - rankB;
        if (rankA !== -1) return -1;
        if (rankB !== -1) return 1;
        return a.localeCompare(b);
      });
    };

    primary.dexes = sortDexVenues(Array.from(dexesSet));
    primary.sources = sortDexVenues(Array.from(sourcesSet));

    if (isPumpFunToken) {
      primary.launchPlatform = "Pump.fun";
    }

    // Identify highest liquidity & highest volume signals internally
    if (allDiscoveredPairs.length > 0) {
      primary.highestLiquidityPair = [...allDiscoveredPairs].sort((a, b) => (b.liquidityUsd || 0) - (a.liquidityUsd || 0))[0];
      primary.highestVolumePair = [...allDiscoveredPairs].sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))[0];
    }

    // Check if ANY pair record has PumpSwap or graduated state
    const hasPumpSwapAvailability =
      (primary.launchPlatform === "Pump.fun" && (primary.isGraduated || primary.marketStage === "pumpswap" || primary.marketStage === "graduated")) ||
      primary.dexes.some((d) => d.toLowerCase().includes("pumpswap")) ||
      primary.sources.some((s) => s.toLowerCase().includes("pumpswap")) ||
      allDiscoveredPairs.some((pr) => (pr.dexName || pr.dexId || "").toLowerCase().includes("pumpswap")) ||
      pairsGroup.some((p) => p.dexId === "pumpswap" || p.primaryDex === "PumpSwap" || p.marketStage === "pumpswap" || (p.sources && p.sources.some(s => s.toLowerCase().includes("pumpswap"))));

    const isGraduatedToken = pairsGroup.some((p) =>
      Boolean(
        p.isGraduated ||
        p.marketStage === "graduated" ||
        p.marketStage === "pumpswap" ||
        (typeof p.bondingProgress === "number" && p.bondingProgress >= 100) ||
        hasPumpSwapAvailability
      )
    );

    if (isGraduatedToken) {
      primary.isGraduated = true;
      primary.isBondingCurve = false;
      primary.bondingProgress = 100;
      primary.marketStage = hasPumpSwapAvailability ? "pumpswap" : (primary.marketStage && primary.marketStage !== "bonding_curve" ? primary.marketStage : "graduated");
    } else {
      primary.isBondingCurve = Boolean(primary.bondingCurvePda || primary.launchPlatform === "Pump.fun");
      primary.isGraduated = false;
      if (!primary.marketStage) primary.marketStage = "bonding_curve";
    }

    // Prioritize active DEX pool metrics (PumpSwap, Orca, Meteora, Raydium) over stale bonding curves
    const activeMarketPool = [...pairsGroup]
      .filter((p) => {
        const d = normalizeDexName(p.dexId || p.primaryDex);
        return d === "PumpSwap" || d === "Orca" || d === "Meteora" || d === "Raydium";
      })
      .sort((a, b) => {
        const aIsPS = normalizeDexName(a.dexId || a.primaryDex) === "PumpSwap";
        const bIsPS = normalizeDexName(b.dexId || b.primaryDex) === "PumpSwap";
        if (aIsPS !== bIsPS) return aIsPS ? -1 : 1;
        const aVol = Number(a.volume?.h24 || (a as any).totalVolume24h || 0);
        const bVol = Number(b.volume?.h24 || (b as any).totalVolume24h || 0);
        if (bVol !== aVol) return bVol - aVol;
        const aLiq = Number(a.liquidity?.usd || (a as any).totalLiquidityUsd || 0);
        const bLiq = Number(b.liquidity?.usd || (b as any).totalLiquidityUsd || 0);
        return bLiq - aLiq;
      })[0];

    if (activeMarketPool) {
      if (activeMarketPool.pairAddress) primary.pairAddress = activeMarketPool.pairAddress;
      if (activeMarketPool.priceUsd && Number(activeMarketPool.priceUsd) > 0) {
        primary.priceUsd = String(activeMarketPool.priceUsd);
      }
      if (activeMarketPool.priceNative) primary.priceNative = activeMarketPool.priceNative;
      if (activeMarketPool.priceChange) primary.priceChange = activeMarketPool.priceChange;
      if (activeMarketPool.volume) primary.volume = activeMarketPool.volume;
      if ((activeMarketPool as any).totalVolume24h !== undefined) primary.totalVolume24h = (activeMarketPool as any).totalVolume24h;
      if (activeMarketPool.liquidity) primary.liquidity = activeMarketPool.liquidity;
      if ((activeMarketPool as any).totalLiquidityUsd !== undefined) primary.totalLiquidityUsd = (activeMarketPool as any).totalLiquidityUsd;
      if (activeMarketPool.url && (!primary.url || primary.url.includes("pump.fun"))) primary.url = activeMarketPool.url;
      if (activeMarketPool.primaryDexTradingUrl) primary.primaryDexTradingUrl = activeMarketPool.primaryDexTradingUrl;
    }

    // Primary DEX selection
    if (hasPumpSwapAvailability) {
      primary.primaryDex = "PumpSwap";
      primary.dexId = "pumpswap";
      if (!dexesSet.has("PumpSwap")) dexesSet.add("PumpSwap");
      if (!sourcesSet.has("PumpSwap")) sourcesSet.add("PumpSwap");
    } else {
      primary.primaryDex = selectPrimaryDex(primary);
      if (primary.primaryDex === "Raydium" && isPumpFunToken && isGraduatedToken) {
        primary.primaryDex = "PumpSwap";
      }
    }

    // CRITICAL ENFORCEMENT: Never allow Raydium ahead of PumpSwap
    if (primary.primaryDex === "Raydium" && hasPumpSwapAvailability) {
      primary.primaryDex = "PumpSwap";
    }

    // If a primaryDex was determined, update dexId to its clean identifier
    if (primary.primaryDex) {
      primary.dexId = primary.primaryDex.toLowerCase().replace(/[^a-z0-9]/g, "");
    } else if (primary.launchPlatform === "Pump.fun") {
      primary.dexId = "pumpfun";
    }

    // Resolve direct high-res logo and trading destination URL
    const representativeDexOrPlatform = primary.primaryDex || (primary.launchPlatform === "Pump.fun" ? "Pump.fun" : primary.dexId);
    primary.primaryDexLogo = getDexLogo(representativeDexOrPlatform);
    primary.primaryDexTradingUrl = getDexTradingUrl(primary, primary.primaryDex);

    const hasAggLiq = aggregatedLiquidity > 0;
    const hasPrimaryLiq = primary.liquidity?.usd !== undefined && primary.liquidity.usd > 0;
    const finalLiq = hasAggLiq
      ? aggregatedLiquidity
      : hasPrimaryLiq
      ? primary.liquidity!.usd
      : primary.totalLiquidityUsd !== undefined
      ? primary.totalLiquidityUsd
      : undefined;

    primary.totalLiquidityUsd = finalLiq;
    if (finalLiq !== undefined) {
      primary.liquidity = { ...(primary.liquidity || {}), usd: finalLiq };
    }

    const hasAggVol = aggregatedVolume > 0;
    const hasPrimaryVol = primary.volume?.h24 !== undefined;
    const finalVol = hasAggVol
      ? aggregatedVolume
      : hasPrimaryVol
      ? primary.volume!.h24
      : primary.totalVolume24h !== undefined
      ? primary.totalVolume24h
      : undefined;

    primary.totalVolume24h = finalVol;
    if (finalVol !== undefined) {
      primary.volume = { ...(primary.volume || {}), h24: finalVol };
    }

    // Set merged websites and socials
    primary.info = primary.info || {};
    primary.info.websites = Array.from(websitesMap.values());
    primary.info.socials = Array.from(socialsMap.values());
    if (bestDescription) {
      (primary.info as any).description = bestDescription;
    }

    // Expose root-level convenience fields for Telegram, Twitter, Website, and Discord so all UI components access valid values
    const tgEntry = primary.info.socials.find(s => s.type === "telegram" || s.type === "tg");
    const twEntry = primary.info.socials.find(s => s.type === "twitter" || s.type === "x");
    const discordEntry = primary.info.socials.find(s => s.type === "discord");
    const webEntry = primary.info.websites[0];

    if (tgEntry?.url) (primary as any).telegram = tgEntry.url;
    if (twEntry?.url) (primary as any).twitter = twEntry.url;
    if (discordEntry?.url) (primary as any).discord = discordEntry.url;
    if (webEntry?.url) (primary as any).website = webEntry.url;

    // Canonical Logo Resolution
    const canonicalLogo = getCanonicalTokenLogo(primary.chainId, primary.baseToken?.address, primary.baseToken?.symbol);
    if (canonicalLogo) {
      primary.info.imageUrl = canonicalLogo;
    } else if (bestImageUrl) {
      primary.info.imageUrl = bestImageUrl;
    } else if (!primary.info?.imageUrl && primary.baseToken?.address) {
      const normChain = (primary.chainId || "solana").toLowerCase() === "polygon_pos" ? "polygon" : (primary.chainId || "solana").toLowerCase();
      primary.info.imageUrl = `https://dd.dexscreener.com/ds-data/tokens/${normChain}/${primary.baseToken.address}.png`;
    }

    // Normalize pairCreatedAt to milliseconds and compute token age in hours
    if (primary.pairCreatedAt) {
      let n = typeof primary.pairCreatedAt === "string" ? (Number(primary.pairCreatedAt) || new Date(primary.pairCreatedAt).getTime()) : Number(primary.pairCreatedAt);
      if (!isNaN(n) && n > 0) {
        if (n < 10000000000) n = n * 1000;
        primary.pairCreatedAt = n;
        const ageMs = Date.now() - n;
        primary.tokenAgeHours = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60)));
      } else {
        primary.pairCreatedAt = undefined;
        primary.tokenAgeHours = undefined;
      }
    } else {
      primary.tokenAgeHours = undefined;
    }

    // Compute liquidity and momentum scores (0-100)
    const liqVal = primary.totalLiquidityUsd || 0;
    const volVal = primary.totalVolume24h || 0;
    primary.liquidityScore = liqVal > 0 ? Math.min(100, Math.round(Math.log10(liqVal + 1) * 18)) : 0;
    primary.momentumScore = volVal > 0 ? Math.min(100, Math.round(Math.log10(volVal + 1) * 20)) : 0;

    // Calculate 24h buy/sell ratio
    const buys = primary.txns?.h24?.buys || 0;
    const sells = primary.txns?.h24?.sells || 0;
    primary.buySellRatio24h = sells > 0 ? Number((buys / sells).toFixed(2)) : buys > 0 ? 2.0 : 1.0;

    // Fallback / Normalize Market Cap & FDV (NO fabricated liquidity * 4 calculations)
    const existingMcap = primary.marketCap || primary.fdv;
    const existingFdv = primary.fdv || primary.marketCap;

    if (existingMcap && existingMcap > 0) {
      primary.marketCap = existingMcap;
      primary.fdv = existingFdv || existingMcap;
    } else {
      // The one billion supply assumption below is specific to Pump.fun's
      // bonding curve convention, confirmed as accurate for that case only.
      // Applying it regardless of chain meant a brand new EVM token, whose
      // real provider simply hasn't reported a market cap yet (exactly what
      // happens for a chain launched hours ago), got a fabricated figure
      // based on a supply number that has nothing to do with its actual
      // tokenomics. Leaving market cap unset here is honest. A wrong number
      // is worse than a missing one.
      const isPumpBondingCurveToken =
        primary.chainId === "solana" &&
        (primary.isBondingCurve ||
        primary.dexId === "pumpfun" ||
        primary.launchPlatform === "Pump.fun");

      const pUsd = Number(primary.priceUsd || 0);
      if (pUsd > 0 && isPumpBondingCurveToken) {
        primary.marketCap = Math.round(pUsd * 1_000_000_000);
        primary.fdv = primary.marketCap;
      } else {
        primary.marketCap = undefined;
        primary.fdv = undefined;
      }
    }

    // If priceUsd is still 0, derive from marketCap / FDV if available, never from liquidity * 4
    const finalPriceNum = Number(primary.priceUsd) || 0;
    if (finalPriceNum === 0) {
      const isPumpBondingCurveToken =
        primary.chainId === "solana" &&
        (primary.isBondingCurve || primary.dexId === "pumpfun" || primary.launchPlatform === "Pump.fun");
      const mcap = primary.marketCap || primary.fdv;
      if (isPumpBondingCurveToken && mcap && mcap > 0) {
        primary.priceUsd = String(mcap / 1_000_000_000);
      }
    }

    canonicalResults.push(primary);
  });

  return canonicalResults;
}

export function clearAllProviderCaches(): void {
  cacheMap.clear();
  clearPreparedPoolCache();
  for (const p of providers) {
    if (typeof (p as any).clearCache === "function") {
      (p as any).clearCache();
    }
  }
}

// ==========================================
// PUMPSWAP DISCOVERY AUDIT & DEBUGGING SUITE
// ==========================================

export interface PumpSwapDebugReport {
  mode: string;
  timestamp: string;
  providerRawCounts: Record<string, { total: number; pumpSwapCount: number; sampleMints: string[] }>;
  normalizedPumpSwapTokens: Array<{
    mint: string;
    symbol: string;
    primaryDex: string;
    dexId: string;
    sources: string[];
    liquidityUsd?: number;
    volume24h?: number;
  }>;
  filteredOutTokens: Array<{
    mint: string;
    symbol: string;
    primaryDex?: string;
    stage: "deduplication" | "qualification";
    reason: string;
  }>;
}

export function isPumpSwapCandidate(p: Partial<TokenPair>): boolean {
  if (!p) return false;
  const dName = normalizeDexName(p.dexId || p.primaryDex);
  if (dName === "PumpSwap") return true;
  if (p.dexId?.toLowerCase().includes("pumpswap")) return true;
  if (p.marketStage === "pumpswap") return true;
  if (p.url?.toLowerCase().includes("pumpswap")) return true;
  if (p.sources?.some((s) => s.toLowerCase().includes("pumpswap"))) return true;
  if (p.dexes?.some((d) => d.toLowerCase().includes("pumpswap"))) return true;
  if (p.pairs?.some((pr) => (pr.dexName || pr.dexId || "").toLowerCase().includes("pumpswap"))) return true;
  if ((p as any).pumpswap || (p as any).pumpswap_pool || (p as any).pump_swap_pool) return true;
  if ((p as any).complete || p.isGraduated || p.marketStage === "graduated") return true;
  return false;
}

export function debugPumpSwapDiscovery(report: PumpSwapDebugReport): void {
  console.group("%c[DEXHUNTER DEBUG] PumpSwap Discovery Audit", "background: #ff6b35; color: white; font-weight: bold; padding: 2px 6px; border-radius: 4px;");
  console.log(`Discovery Mode: ${report.mode} | Timestamp: ${report.timestamp}`);

  // (1) Total raw token count from every discovery provider & (2) PumpSwap count in each
  console.group("1 & 2. Discovery Providers Breakdown (Total Raw vs. PumpSwap):");
  for (const [providerName, stats] of Object.entries(report.providerRawCounts)) {
    console.log(
      `• ${providerName}: ${stats.total} total tokens | ${stats.pumpSwapCount} PumpSwap tokens`,
      stats.sampleMints.length > 0 ? `(Samples: ${stats.sampleMints.slice(0, 3).join(", ")})` : ""
    );
  }
  console.groupEnd();

  // (3) List of PumpSwap tokens that pass through normalizeDexName
  console.group(`3. PumpSwap Tokens Passing normalizeDexName (${report.normalizedPumpSwapTokens.length} tokens):`);
  if (report.normalizedPumpSwapTokens.length === 0) {
    console.warn("⚠️ No PumpSwap tokens passed through normalizeDexName into canonical results!");
  } else {
    console.table(
      report.normalizedPumpSwapTokens.map((t) => ({
        Mint: t.mint,
        Symbol: t.symbol,
        PrimaryDEX: t.primaryDex,
        DEX_ID: t.dexId,
        Sources: t.sources.join(", "),
        Liquidity: t.liquidityUsd ? `$${Math.round(t.liquidityUsd).toLocaleString()}` : "N/A",
        Vol24h: t.volume24h ? `$${Math.round(t.volume24h).toLocaleString()}` : "N/A",
      }))
    );
  }
  console.groupEnd();

  // (4) Tokens filtered out by deduplication or qualification layers
  console.group(`4. Filtered Out PumpSwap Tokens (${report.filteredOutTokens.length} tokens):`);
  if (report.filteredOutTokens.length === 0) {
    console.log("✅ No PumpSwap tokens were filtered out.");
  } else {
    console.table(report.filteredOutTokens);
  }
  console.groupEnd();

  console.groupEnd();
}

if (typeof window !== "undefined") {
  (window as any).debugPumpSwapDiscovery = debugPumpSwapDiscovery;
}

// ==========================================
// CENTRAL MULTI-SOURCE AGGREGATION ENGINE
// ==========================================

export async function aggregateMultiSourceTokens(
  mode: "trending" | "latest" | "fresh_mints" | "search",
  query?: string,
  signal?: AbortSignal,
  selectedChain?: string,
  forceRefresh?: boolean
): Promise<TokenPair[]> {
  const normChain = selectedChain ? normalizeChainName(selectedChain) : "all";
  const cacheKey = `${mode}:${query || ""}:${normChain}`;

  if (forceRefresh) {
    cacheMap.delete(cacheKey);
    clearAllProviderCaches();
  } else {
    const cached = getCached(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const rawResults: Partial<TokenPair>[] = [];
  const rawByProvider: Record<string, Partial<TokenPair>[]> = {};

  if (mode === "fresh_mints" || mode === "trending" || mode === "latest") {
    // Prefer the server index when it actually has rows. A 404, a cold
    // serverless isolate, or an empty snapshot must not end the request —
    // the browser providers below are the same sources the index reads.
    let serverFailed = false;
    try {
      const preparedMode = mode === "fresh_mints" ? "fresh_mints" : mode === "trending" ? "trending" : "latest";
      const prepared = await fetchPreparedPool(preparedMode, normChain, 5000, signal);
      if (signal?.aborted) return [];
      // A thin trending page is not a full feed. Latest and mints already
      // fill the page; trending stays on the strict index rule and is filled
      // out from the venues below when fewer than 25 coins qualify.
      const trendingNeedsVenues = mode === "trending" && prepared.length < 25;
      if (prepared.length > 0 && !trendingNeedsVenues) {
        setCache(cacheKey, prepared);
        return prepared;
      }
      if (prepared.length > 0) {
        rawByProvider["DexHunter Index"] = prepared;
        rawResults.push(...prepared);
      }
    } catch {
      serverFailed = true;
      if (signal?.aborted) return [];
    }

    const discoverMode = mode === "trending" ? "trending" : "latest";
    const browserProviders = providers.filter((p) => p !== serverDiscoveryProvider);
    const settled = await Promise.allSettled(
      browserProviders.map((p) =>
        Promise.race([
          p.discoverTokens(discoverMode, signal, normChain !== "all" ? normChain : undefined, forceRefresh),
          new Promise<Partial<TokenPair>[]>((_, reject) => {
            setTimeout(() => reject(new Error("provider timeout")), 8000);
          }),
        ])
      )
    );
    for (let i = 0; i < browserProviders.length; i++) {
      const pName = browserProviders[i].name;
      const res = settled[i];
      if (res.status === "fulfilled" && Array.isArray(res.value)) {
        rawByProvider[pName] = res.value;
        rawResults.push(...res.value);
      } else {
        rawByProvider[pName] = [];
      }
    }
    if (signal?.aborted) return [];
    if (rawResults.length === 0 && serverFailed) {
      throw new Error("Couldn't reach token feeds.");
    }
  } else if (mode === "search" && query && query.trim()) {
    const qTrim = query.trim();
    const isAddressCandidate = qTrim.length >= 28 && !qTrim.includes(" ");

    if (isAddressCandidate) {
      // Query all providers in parallel for address lookups with Promise.allSettled
      const settled = await Promise.allSettled(
        providers.map((p) => p.getTokenByAddress(qTrim, normChain !== "all" ? normChain : undefined, signal))
      );

      for (let i = 0; i < providers.length; i++) {
        const pName = providers[i].name;
        const res = settled[i];
        if (res.status === "fulfilled" && Array.isArray(res.value)) {
          rawByProvider[pName] = res.value;
          rawResults.push(...res.value);
        } else {
          rawByProvider[pName] = [];
        }
      }
    } else {
      // Search keywords across all providers with Promise.allSettled
      const settled = await Promise.allSettled(
        providers.map((p) => p.searchTokens(qTrim, signal))
      );

      for (let i = 0; i < providers.length; i++) {
        const pName = providers[i].name;
        const res = settled[i];
        if (res.status === "fulfilled" && Array.isArray(res.value)) {
          rawByProvider[pName] = res.value;
          rawResults.push(...res.value);
        } else {
          rawByProvider[pName] = [];
        }
      }
    }
  } else {
    return [];
  }

  // Track raw PumpSwap candidates for debugging
  const rawPumpSwapMap = new Map<string, Partial<TokenPair>>();
  for (const r of rawResults) {
    if (isPumpSwapCandidate(r) && r.baseToken?.address) {
      rawPumpSwapMap.set(r.baseToken.address.toLowerCase(), r);
    }
  }

  // Deduplicate, merge canonical records, and calculate base scores
  let canonicalTokens = deduplicateAndMergeTokens(rawResults);

  // If a specific chain is requested, filter tokens to that chain
  if (normChain !== "all") {
    canonicalTokens = canonicalTokens.filter(
      (token) => normalizeChainName(token.chainId) === normChain
    );
  }

  const filteredOutPumpSwapTokens: PumpSwapDebugReport["filteredOutTokens"] = [];
  const canonicalMints = new Set(canonicalTokens.map((t) => t.baseToken?.address?.toLowerCase()));

  for (const [addr, rawP] of rawPumpSwapMap.entries()) {
    if (!canonicalMints.has(addr)) {
      filteredOutPumpSwapTokens.push({
        mint: rawP.baseToken?.address || addr,
        symbol: rawP.baseToken?.symbol || "UNKNOWN",
        primaryDex: rawP.primaryDex || rawP.dexId,
        stage: "deduplication",
        reason: "Filtered during deduplication (1k marketcap artifact, missing address, or chain mismatch)",
      });
    }
  }

  // ==========================================================================
  // DEXHUNTER QUALIFICATION & DISCOVERY LAYER
  // ==========================================================================
  const now = Date.now();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const MAX_LATEST_AGE_MS = ONE_WEEK_MS;

  if (mode === "trending") {
    // 1. Filter out known base assets, stablecoins, tokens older than 1 week (7 days), plus zero-activity zombie tokens
    let qualifiedTokens = canonicalTokens.filter((token) => {
      const isPumpSwap = isPumpSwapCandidate(token);
      if (isExcludedTrendingAsset(token)) {
        if (isPumpSwap) {
          filteredOutPumpSwapTokens.push({
            mint: token.baseToken?.address || "",
            symbol: token.baseToken?.symbol || "",
            primaryDex: token.primaryDex || undefined,
            stage: "qualification",
            reason: "isExcludedTrendingAsset check returned true (base currency or blacklisted)",
          });
        }
        return false;
      }
      
      const vol24 = Number(token.volume?.h24 || token.totalVolume24h || 0);
      const vol1 = Number(token.volume?.h1 || 0);
      const vol5m = Number(token.volume?.m5 || 0);
      const liq = Number(token.liquidity?.usd || token.totalLiquidityUsd || 0);

      // Strict 1-week age constraint: tokens older than 1 week should not appear on trending discovery unless actively trading
      if (token.pairCreatedAt && token.pairCreatedAt > 0) {
        const created = Number(token.pairCreatedAt);
        const validTs = created < 10000000000 ? created * 1000 : created;
        const ageMs = now - validTs;
        if (ageMs > ONE_WEEK_MS) {
          if (isPumpSwap) {
            filteredOutPumpSwapTokens.push({
              mint: token.baseToken?.address || "",
              symbol: token.baseToken?.symbol || "",
              primaryDex: token.primaryDex || undefined,
              stage: "qualification",
              reason: `Age exceeded 1 week (${Math.round(ageMs / (24 * 3600 * 1000))}d) with low volume`,
            });
          }
          return false;
        }
      }
      
      // Filter out tokens with no market activity (exempt active PumpSwap pools)
      if (!isPumpSwap) {
        if (vol24 < 300 && vol1 === 0 && vol5m === 0) return false;
        if (liq < 300 && vol24 < 500) return false;
      }
      return true;
    });

    // 2. Supplement Fallback: If filtering leaves fewer than 25 tokens, fetch additional discovery sources
    if (qualifiedTokens.length < 25) {
      const fallbackSettled = await Promise.allSettled([
        new DexScreenerProvider().discoverTokens("latest", signal, normChain, forceRefresh),
        normChain === "all" || normChain === "solana"
          ? new PumpFunProvider().discoverTokens("latest", signal, normChain)
          : Promise.resolve([]),
      ]);

      const supplementRaw: Partial<TokenPair>[] = [];
      for (const res of fallbackSettled) {
        if (res.status === "fulfilled" && Array.isArray(res.value)) {
          supplementRaw.push(...res.value);
        }
      }

      if (supplementRaw.length > 0) {
        const mergedSupplement = deduplicateAndMergeTokens([...rawResults, ...supplementRaw]);
        qualifiedTokens = mergedSupplement
          .filter((token) => normChain === "all" || normalizeChainName(token.chainId) === normChain)
          .filter((token) => !isExcludedTrendingAsset(token))
          .filter((token) => {
            if (!token.pairCreatedAt || token.pairCreatedAt <= 0) return true;
            const created = Number(token.pairCreatedAt);
            const validTs = created < 10000000000 ? created * 1000 : created;
            return now - validTs <= ONE_WEEK_MS;
          });
      }
    }

    // 3. Rank tokens by DexHunter Discovery & Quality Unified Score
    qualifiedTokens.sort((a, b) => {
      const scoreB = calculateFinalDexHunterScore(b, "trending");
      const scoreA = calculateFinalDexHunterScore(a, "trending");
      return scoreB - scoreA;
    });

    canonicalTokens = qualifiedTokens;
  } else if (mode === "latest") {
    // Exclude established base assets and enforce strict 48h limit from latest listings
    canonicalTokens = canonicalTokens
      .filter((token) => !isExcludedTrendingAsset(token))
      .filter((token) => {
        if (!token.pairCreatedAt || token.pairCreatedAt <= 0) return false;
        const created = Number(token.pairCreatedAt);
        const validTs = created < 10000000000 ? created * 1000 : created;
        const ageMs = now - validTs;
        return ageMs >= -60000 && ageMs <= MAX_LATEST_AGE_MS;
      });
  } else if (mode === "fresh_mints") {
    // Exclude base assets, enforce freshness (max 48 hours), and sort by specialized Fresh Mints discovery score and recency
    canonicalTokens = canonicalTokens
      .filter((token) => !isExcludedTrendingAsset(token))
      .filter((token) => {
        if (!token.pairCreatedAt || token.pairCreatedAt <= 0) return true;
        const created = Number(token.pairCreatedAt);
        const validTs = created < 10000000000 ? created * 1000 : created;
        const ageMs = now - validTs;
        return ageMs <= MAX_LATEST_AGE_MS;
      })
      .sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0));
  }
  // If mode === "search", no exclusion filter is applied so users can search for any token

  // Run debugPumpSwapDiscovery audit report
  try {
    const providerStats: PumpSwapDebugReport["providerRawCounts"] = {};
    for (const [pName, tokens] of Object.entries(rawByProvider)) {
      const psTokens = tokens.filter(isPumpSwapCandidate);
      providerStats[pName] = {
        total: tokens.length,
        pumpSwapCount: psTokens.length,
        sampleMints: psTokens.slice(0, 5).map((t) => t.baseToken?.address || "").filter(Boolean),
      };
    }

    const normalizedPumpSwapTokens = canonicalTokens
      .filter(isPumpSwapCandidate)
      .map((t) => ({
        mint: t.baseToken?.address || "",
        symbol: t.baseToken?.symbol || "",
        primaryDex: t.primaryDex || "",
        dexId: t.dexId || "",
        sources: t.sources || [],
        liquidityUsd: t.totalLiquidityUsd || t.liquidity?.usd,
        volume24h: t.totalVolume24h || t.volume?.h24,
      }));

    debugPumpSwapDiscovery({
      mode,
      timestamp: new Date().toLocaleTimeString(),
      providerRawCounts: providerStats,
      normalizedPumpSwapTokens,
      filteredOutTokens: filteredOutPumpSwapTokens,
    });
  } catch (err) {
    console.error("Error generating debugPumpSwapDiscovery report:", err);
  }
  // If mode === "search", no exclusion filter is applied so users can search for any token

  // 4. Batch resolve missing creation timelines across all chains (DexScreener multi-token lookup)
  const missingAgeTokens = canonicalTokens.filter(
    (t) => (!t.pairCreatedAt || t.pairCreatedAt <= 0) && t.baseToken?.address
  );
  if (missingAgeTokens.length > 0 && !signal?.aborted) {
    try {
      const ds = new DexScreenerProvider();
      const addressesToResolve = missingAgeTokens.slice(0, 30).map((t) => t.baseToken!.address);
      const resolvedPairs = await ds.getTokenByAddress(addressesToResolve.join(","), undefined, signal);
      
      if (Array.isArray(resolvedPairs) && resolvedPairs.length > 0) {
        const timestampsByAddress = new Map<string, number>();
        for (const pr of resolvedPairs) {
          const addr = (pr.baseToken?.address || "").toLowerCase();
          const prCreated = Number(pr.pairCreatedAt || 0);
          if (addr && prCreated > 0) {
            const validTs = prCreated < 10000000000 ? prCreated * 1000 : prCreated;
            const currentMin = timestampsByAddress.get(addr);
            if (!currentMin || validTs < currentMin) {
              timestampsByAddress.set(addr, validTs);
            }
          }
        }

        for (const token of missingAgeTokens) {
          const addr = (token.baseToken?.address || "").toLowerCase();
          const resolvedTimestamp = timestampsByAddress.get(addr);
          if (resolvedTimestamp && resolvedTimestamp > 0) {
            token.pairCreatedAt = resolvedTimestamp;
            const ageMs = Date.now() - resolvedTimestamp;
            token.tokenAgeHours = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60)));
          }
        }
      }
    } catch {
      // Non-blocking fallback
    }
  }

  for (const t of canonicalTokens) {
    t.refreshTimestamp = now;
    if (!t.providerFetchTimestamp) t.providerFetchTimestamp = now;
    if (!t.sourceTimestamp) t.sourceTimestamp = now;
    if (!t.lastActivityTimestamp) {
      const hasRecentVol = Number(t.volume?.m5 || 0) > 0 || Number(t.volume?.h1 || 0) > 0;
      t.lastActivityTimestamp = hasRecentVol ? now : (t.pairCreatedAt || now);
    }
  }

  if (canonicalTokens.length > 0) {
    const ttl = mode === "fresh_mints" ? 5000 : DEFAULT_CACHE_TTL_MS;
    setCache(cacheKey, canonicalTokens, ttl);
  }

  return canonicalTokens;
}

// ==========================================
// FILTERING ENGINE
// ==========================================

export function filterAndSortTokens(tokens: TokenPair[], filters: FilterOptions): TokenPair[] {
  return tokens.filter((pair) => {
    // Chain filter
    if (filters.selectedChain !== "all") {
      const chainNorm = normalizeChainName(pair.chainId);
      const targetChain = normalizeChainName(filters.selectedChain);
      if (targetChain !== chainNorm) return false;
    }

    // DEX / Exchange filter (matches normalized primaryDex, dexes list, sources, or launch platform)
    if (filters.selectedDex !== "all") {
      const targetDex = filters.selectedDex.toLowerCase();
      const targetDexNorm = normalizeDexName(targetDex).toLowerCase();

      const matchesPrimary = pair.primaryDex && normalizeDexName(pair.primaryDex).toLowerCase().includes(targetDexNorm);
      const matchesDexes = pair.dexes?.some((d) => normalizeDexName(d).toLowerCase().includes(targetDexNorm));
      const matchesSources = pair.sources?.some((s) => normalizeDexName(s).toLowerCase().includes(targetDexNorm));
      const matchesDexId = pair.dexId?.toLowerCase().includes(targetDex);
      const matchesLaunch = pair.launchPlatform && normalizeDexName(pair.launchPlatform).toLowerCase().includes(targetDexNorm);
      const matchesPairs = pair.pairs?.some((pr) => {
        const pDex = normalizeDexName(pr.dexName || pr.dexId).toLowerCase();
        return pDex.includes(targetDexNorm);
      });

      if (!matchesPrimary && !matchesDexes && !matchesSources && !matchesDexId && !matchesLaunch && !matchesPairs) {
        return false;
      }
    }

    // Liquidity filter
    const liq = pair.totalLiquidityUsd || pair.liquidity?.usd || 0;
    if (filters.minLiquidity && liq < Number(filters.minLiquidity)) return false;
    if (filters.maxLiquidity && liq > Number(filters.maxLiquidity)) return false;

    // Market Cap filter
    const mcap = pair.marketCap || pair.fdv || 0;
    if (filters.minMarketCap && mcap < Number(filters.minMarketCap)) return false;
    if (filters.maxMarketCap && mcap > Number(filters.maxMarketCap)) return false;

    // Volume filter
    const vol = pair.totalVolume24h || pair.volume?.h24 || 0;
    if (filters.minVolume && vol < Number(filters.minVolume)) return false;
    if (filters.maxVolume && vol > Number(filters.maxVolume)) return false;

    // Token Age filter (max hours)
    if (filters.maxAgeHours && (pair.tokenAgeHours || 0) > Number(filters.maxAgeHours)) return false;

    // Social Links & Verification filters
    const websites = pair.info?.websites || [];
    const socials = pair.info?.socials || [];

    if (filters.hasWebsite && websites.length === 0) return false;
    if (filters.hasX && !socials.some((s) => s.type === "twitter" || s.type === "x" || s.url.includes("x.com") || s.url.includes("twitter.com"))) return false;
    if (filters.hasTelegram && !socials.some((s) => s.type === "telegram" || s.url.includes("t.me") || s.url.includes("telegram"))) return false;

    return true;
  }).sort((a, b) => {
    if (filters.sortBy === "liquidity") {
      return (b.totalLiquidityUsd || b.liquidity?.usd || 0) - (a.totalLiquidityUsd || a.liquidity?.usd || 0);
    }
    if (filters.sortBy === "volume") {
      return (b.totalVolume24h || b.volume?.h24 || 0) - (a.totalVolume24h || a.volume?.h24 || 0);
    }
    if (filters.sortBy === "marketCap") {
      return (b.marketCap || b.fdv || 0) - (a.marketCap || a.fdv || 0);
    }
    if (filters.sortBy === "gainers") {
      return (b.priceChange?.h24 || 0) - (a.priceChange?.h24 || 0);
    }
    if (filters.sortBy === "momentum") {
      return (b.momentumScore || 0) - (a.momentumScore || 0);
    }
    if (filters.sortBy === "age") {
      return (a.tokenAgeHours || 0) - (b.tokenAgeHours || 0);
    }
    return 0;
  });
}

// ==========================================
// CSV EXPORT ENGINE
// ==========================================

function exportAgeHours(token: TokenPair, now: number): number | "" {
  if (typeof token.tokenAgeHours === "number" && Number.isFinite(token.tokenAgeHours)) return token.tokenAgeHours;
  const raw = Number(token.pairCreatedAt);
  if (!Number.isFinite(raw) || raw <= 0) return "";
  const ms = raw < 1e11 ? raw * 1000 : raw;
  if (ms > now + 120_000) return "";
  return Math.max(0, Math.floor((now - ms) / 3_600_000));
}

export function exportTokensToCSV(tokens: TokenPair[], filename?: string) {
  if (!tokens || tokens.length === 0) return;

  const headers = [
    "Token Name",
    "Symbol",
    "Contract Address",
    "Chain",
    "Primary DEX",
    "Launch Platform",
    "All Discovered DEXes",
    "All Sources",
    "Price USD",
    "Market Cap USD",
    "Liquidity USD",
    "24h Volume USD",
    "24h Price Change %",
    "Token Age (Hours)",
    "Website",
    "X / Twitter",
    "Telegram",
    "Launch Date"
  ];

  const escapeCsv = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const exportedAt = Date.now();
  const rows = tokens.map((t) => {
    const website = t.info?.websites?.find((w) => w.type === "website" || w.url.startsWith("http"))?.url || "";
    const twitter = t.info?.socials?.find((s) => s.type === "twitter" || s.type === "x" || s.url.includes("x.com") || s.url.includes("twitter"))?.url || "";
    const telegram = t.info?.socials?.find((s) => s.type === "telegram" || s.url.includes("t.me"))?.url || "";
    const primaryDexDisplay = t.primaryDex || (t.launchPlatform ? "Bonding Curve" : getDEXDisplayName(t.dexId || t.primaryProvider));
    const dexesStr = t.dexes && t.dexes.length > 0 ? t.dexes.join(" | ") : primaryDexDisplay;
    const sourcesStr = t.sources && t.sources.length > 0 ? t.sources.join(" | ") : primaryDexDisplay;
    const launchTime = t.pairCreatedAt ? new Date(t.pairCreatedAt).toISOString() : "";

    return [
      escapeCsv(t.baseToken?.name),
      escapeCsv(t.baseToken?.symbol),
      escapeCsv(t.baseToken?.address),
      escapeCsv(t.chainId),
      escapeCsv(primaryDexDisplay),
      escapeCsv(t.launchPlatform || "N/A"),
      escapeCsv(dexesStr),
      escapeCsv(sourcesStr),
      escapeCsv(t.priceUsd ? `$${t.priceUsd}` : "N/A"),
      escapeCsv(t.marketCap ?? t.fdv ?? ""),
      escapeCsv(t.totalLiquidityUsd ?? t.liquidity?.usd ?? ""),
      escapeCsv(t.volumeComplete === false ? "" : (t.volume?.h24 ?? t.totalVolume24h ?? "")),
      escapeCsv(t.priceChange?.h24 ?? ""),
      escapeCsv(exportAgeHours(t, exportedAt)),
      escapeCsv(website),
      escapeCsv(twitter),
      escapeCsv(telegram),
      escapeCsv(launchTime)
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename || `dexhunter_tokens_export_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ==========================================
// CONCURRENT METADATA ENRICHMENT PIPELINE
// ==========================================

/**
 * Concurrently enrich tokens with secondary metadata (logos, socials, bonding curve state)
 * using Promise.allSettled with proper AbortSignal handling.
 */
export async function enrichTokensWithMetadataConcurrently(
  tokens: TokenPair[],
  _signal?: AbortSignal
): Promise<TokenPair[]> {
  // List views already have indexed names and logos. Per-row on-chain audits
  // (resolve + diagnostic) were firing for the first 10 incomplete cards and
  // stalling the page. Single-token lookup still uses those endpoints.
  return tokens || [];
}

