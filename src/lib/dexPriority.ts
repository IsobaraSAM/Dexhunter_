import { NormalizedPair, TokenPair } from "../types";
import { dexTradeUrl } from "../../indexer/venue-links.js";

// ==========================================
// CENTRALIZED CHAIN-AWARE DEX PRIORITY CONFIG
// Expandable for any current or future networks
// ==========================================

export const DEX_PRIORITY: Record<string, string[]> = {
  solana: [
    "PumpSwap",
    "Meteora",
    "Raydium",
    "Orca",
    "Phoenix",
    "OpenBook",
    "Lifinity",
    "Manifest",
    "FluxBeam",
  ],
  bsc: [
    "PancakeSwap",
    "Uniswap",
    "Thena",
    "BiSwap",
    "BakerySwap",
    "ApeSwap",
  ],
  binance: [
    "PancakeSwap",
    "Uniswap",
    "Thena",
    "BiSwap",
    "BakerySwap",
  ],
  ethereum: [
    "Uniswap",
    "PancakeSwap",
    "Curve",
    "Balancer",
    "SushiSwap",
    "Maverick",
    "Bancor",
    "1inch",
  ],
  base: [
    "Aerodrome",
    "Uniswap",
    "PancakeSwap",
    "BaseSwap",
    "SushiSwap",
    "SwapBased",
    "AlienBase",
  ],
  polygon: [
    "QuickSwap",
    "Uniswap",
    "PancakeSwap",
    "SushiSwap",
    "Balancer",
    "KyberSwap",
    "Dystopia",
  ],
  polygon_pos: [
    "QuickSwap",
    "Uniswap",
    "PancakeSwap",
    "SushiSwap",
    "Balancer",
  ],
  arbitrum: [
    "Camelot",
    "Uniswap",
    "PancakeSwap",
    "SushiSwap",
    "Trader Joe",
    "Balancer",
    "GMX",
    "Chronos",
  ],
  avalanche: [
    "Trader Joe",
    "Pangolin",
    "Uniswap",
    "SushiSwap",
  ],
  avax: [
    "Trader Joe",
    "Pangolin",
    "Uniswap",
  ],
  cronos: [
    "VVS Finance",
    "MM Finance",
    "Uniswap",
  ],
  optimism: [
    "Velodrome",
    "Uniswap",
    "Curve",
    "SushiSwap",
  ],
  robinhood: [
    "Uniswap",
    "Aerodrome",
  ],
  arc: [
    "Argus",
    "Uniswap",
    "Uniswap v4",
  ],
};

// ==========================================
// CRYPTOGRAPHIC ADDRESS & CHAIN UTILITIES
// ==========================================

export function isEvmAddress(address?: string | null): boolean {
  if (!address) return false;
  const a = address.trim();
  return /^0x[a-fA-F0-9]{40}$/.test(a);
}

export function isSolanaAddress(address?: string | null): boolean {
  if (!address) return false;
  const a = address.trim();
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a);
}

export function isSolanaChain(chain?: string | null): boolean {
  if (!chain) return false;
  const c = chain.toLowerCase().trim();
  return c === "solana" || c === "sol";
}

export const KNOWN_EVM_CHAINS = new Set([
  "ethereum",
  "bsc",
  "base",
  "arbitrum",
  "polygon",
  "avalanche",
  "cronos",
  "optimism",
  "robinhood",
  "arc",
  "linea",
  "blast",
  "fantom",
  "mantle",
  "scroll",
  "zksync",
]);

export function isEvmChain(chain?: string | null): boolean {
  if (!chain) return false;
  const c = normalizeChainName(chain);
  if (c === "solana") return false;
  return KNOWN_EVM_CHAINS.has(c);
}

export function formatTokenAddress(address: string, chain?: string): string {
  if (!address) return "";
  const trimmed = address.trim();
  const normChain = normalizeChainName(chain, trimmed);
  if (isEvmAddress(trimmed) || isEvmChain(normChain)) {
    return trimmed.toLowerCase();
  }
  // Solana addresses are Base58: strictly preserve case
  return trimmed;
}

export function getCanonicalCompositeKey(chainId?: string, address?: string): string {
  if (!address) return "";
  const formattedAddr = formatTokenAddress(address, chainId);
  const normChain = normalizeChainName(chainId, address);
  return `${normChain || "unknown"}:${formattedAddr}`;
}

export function isSolanaToken(token: Partial<TokenPair> | null | undefined): boolean {
  if (!token) return false;
  const chain = normalizeChainName(token.chainId);
  if (chain === "solana") return true;
  if (chain && chain !== "solana" && chain !== "unknown") return false;

  const addr = token.baseToken?.address || (token as any).mint || (token as any).tokenAddress;
  if (isEvmAddress(addr)) return false;
  if (isSolanaAddress(addr)) return true;
  return false;
}

export function isEvmToken(token: Partial<TokenPair> | null | undefined): boolean {
  if (!token) return false;
  const chain = normalizeChainName(token.chainId);
  if (chain === "solana") return false;
  if (isEvmChain(chain)) return true;

  const addr = token.baseToken?.address || (token as any).mint || (token as any).tokenAddress || (token as any).contractAddress;
  if (isEvmAddress(addr)) return true;
  return false;
}

// ==========================================
// CHAIN NORMALIZATION
// ==========================================

export function normalizeChainName(chain?: string, fallbackAddress?: string | null, fallbackUrl?: string | null): string {
  if (chain) {
    const c = chain.toLowerCase().trim();
    if (c === "ether" || c === "eth" || c === "mainnet" || c === "ethereum" || c === "eth-mainnet") return "ethereum";
    if (c === "bsc" || c === "binance" || c === "bnb" || c === "bnbchain" || c === "binancesmartchain") return "bsc";
    if (c === "polygon" || c === "polygon_pos" || c === "polygon-pos" || c === "matic") return "polygon";
    if (c === "arb" || c === "arbitrum" || c === "arbitrum_one" || c === "arbitrum-one") return "arbitrum";
    if (c === "avax" || c === "avalanche" || c === "c-chain") return "avalanche";
    if (c === "cro" || c === "cronos") return "cronos";
    if (c === "op" || c === "optimism" || c === "optimistic") return "optimism";
    if (c === "base") return "base";
    if (c === "robinhood" || c === "robinhood_chain") return "robinhood";
    if (c === "arc" || c === "arc_chain" || c === "5042") return "arc";
    if (c === "sol" || c === "solana") return "solana";
    if (c === "hyperevm" || c === "hyperliquid" || c === "hyper") return "hyperevm";
    return c;
  }

  // If chain is undefined, inspect fallbackUrl if available (e.g. dexscreener.com/bsc/...)
  if (fallbackUrl) {
    const match = fallbackUrl.match(/dexscreener\.com\/([^/]+)\//i);
    if (match && match[1]) {
      return normalizeChainName(match[1]);
    }
  }

  // Inspect fallbackAddress if provided
  if (fallbackAddress) {
    if (isEvmAddress(fallbackAddress)) return "ethereum";
    if (isSolanaAddress(fallbackAddress)) return "solana";
  }

  // Authoritative boundary: DO NOT blindly default to "solana"
  return "";
}

// ==========================================
// DEX NAME NORMALIZATION LAYER
// Maps varying provider identifiers to canonical display names
// ==========================================

export function normalizeDexName(dexIdOrName?: string | null): string {
  if (!dexIdOrName) return "Unknown";
  const raw = dexIdOrName.trim();
  if (!raw) return "Unknown";

  const lower = raw.toLowerCase().replace(/[_\s-]+/g, "");

  // Special/Unknown filters
  if (lower === "unknown" || lower === "null" || lower === "undefined" || lower === "none") {
    return "Unknown";
  }

  // 1. PumpSwap (MUST be recognized across all variations)
  if (
    lower === "pumpswap" ||
    lower === "pumpamm" ||
    lower === "pumpfunswap" ||
    lower === "pumpswapv1" ||
    lower === "pumpswappool"
  ) {
    return "PumpSwap";
  }

  // 2. Pump.fun (Launch platform / bonding curve)
  if (lower === "pumpfun" || lower === "pump.fun" || lower === "bondingcurve") {
    return "Pump.fun";
  }

  // 3. Raydium
  if (lower.startsWith("raydium")) {
    return "Raydium";
  }

  // 4. Meteora
  if (lower.startsWith("meteora")) {
    return "Meteora";
  }

  // 5. Orca
  if (lower.startsWith("orca") || lower.includes("whirlpool")) {
    return "Orca";
  }

  // 6. PancakeSwap
  if (lower.startsWith("pancake")) {
    return "PancakeSwap";
  }

  // 7. Uniswap
  if (lower.startsWith("uniswap")) {
    return "Uniswap";
  }

  // 7b. Argus Launchpad (Arc Mainnet 5042)
  if (lower.startsWith("argus")) {
    return "Argus";
  }

  // 8. Aerodrome
  if (lower.startsWith("aerodrome")) {
    return "Aerodrome";
  }

  // 9. QuickSwap
  if (lower.startsWith("quickswap")) {
    return "QuickSwap";
  }

  // 10. Curve
  if (lower.startsWith("curve")) {
    return "Curve";
  }

  // 11. Balancer
  if (lower.startsWith("balancer")) {
    return "Balancer";
  }

  // 12. SushiSwap
  if (lower.startsWith("sushi")) {
    return "SushiSwap";
  }

  // 13. Trader Joe
  if (lower.startsWith("traderjoe")) {
    return "Trader Joe";
  }

  // 14. Camelot
  if (lower.startsWith("camelot")) {
    return "Camelot";
  }

  // 15. Thena
  if (lower.startsWith("thena")) {
    return "Thena";
  }

  // 16. BaseSwap & SwapBased
  if (lower.startsWith("baseswap")) {
    return "BaseSwap";
  }
  if (lower.startsWith("swapbased")) {
    return "SwapBased";
  }

  // 17. BiSwap
  if (lower.startsWith("biswap")) {
    return "BiSwap";
  }

  // 18. VVS Finance
  if (lower.startsWith("vvs")) {
    return "VVS Finance";
  }

  // 19. Pangolin
  if (lower.startsWith("pangolin")) {
    return "Pangolin";
  }

  // 20. Lifinity
  if (lower.startsWith("lifinity")) {
    return "Lifinity";
  }

  // 21. FluxBeam
  if (lower.startsWith("fluxbeam")) {
    return "FluxBeam";
  }

  // 22. OpenBook
  if (lower.startsWith("openbook")) {
    return "OpenBook";
  }

  // 23. Phoenix
  if (lower.startsWith("phoenix")) {
    return "Phoenix";
  }

  // 24. Manifest
  if (lower.startsWith("manifest")) {
    return "Manifest";
  }

  // 25. GMX
  if (lower === "gmx") {
    return "GMX";
  }

  // 24. Maverick
  if (lower.startsWith("maverick")) {
    return "Maverick";
  }

  // 25. KyberSwap
  if (lower.startsWith("kyber")) {
    return "KyberSwap";
  }

  // 26. Velodrome
  if (lower.startsWith("velodrome")) {
    return "Velodrome";
  }

  // Provider names that are not DEXs
  if (lower === "dexscreener" || lower === "moralis") {
    return raw;
  }

  // Preserve proper casing for already formatted names, or capitalize nicely
  if (raw.length > 2 && raw !== raw.toLowerCase() && raw !== raw.toUpperCase()) {
    return raw;
  }

  // Capitalize first letter of each word/token
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// Helper to test if an identifier is only a launchpad/bonding curve
export function isLaunchPlatformOnly(name?: string | null): boolean {
  if (!name) return false;
  const norm = name.toLowerCase().replace(/[_\s-]+/g, "");
  return norm === "pumpfun" || norm === "bondingcurve" || norm === "pump.fun";
}

// ==========================================
// DEX LOGOS REGISTRY
// ==========================================

export const DEX_LOGO_MAP: Record<string, string> = {
  pumpswap: "https://dd.dexscreener.com/ds-data/dexes/pumpswap.png",
  pumpfun: "https://dd.dexscreener.com/ds-data/dexes/pumpfun.png",
  raydium: "https://dd.dexscreener.com/ds-data/dexes/raydium.png",
  meteora: "https://dd.dexscreener.com/ds-data/dexes/meteora.png",
  orca: "https://dd.dexscreener.com/ds-data/dexes/orca.png",
  pancakeswap: "https://dd.dexscreener.com/ds-data/dexes/pancakeswap.png",
  uniswap: "https://dd.dexscreener.com/ds-data/dexes/uniswap.png",
  aerodrome: "https://dd.dexscreener.com/ds-data/dexes/aerodrome.png",
  quickswap: "https://dd.dexscreener.com/ds-data/dexes/quickswap.png",
  sushiswap: "https://dd.dexscreener.com/ds-data/dexes/sushiswap.png",
  curve: "https://dd.dexscreener.com/ds-data/dexes/curve.png",
  balancer: "https://dd.dexscreener.com/ds-data/dexes/balancer.png",
  camelot: "https://dd.dexscreener.com/ds-data/dexes/camelot.png",
  traderjoe: "https://dd.dexscreener.com/ds-data/dexes/traderjoe.png",
  thena: "https://dd.dexscreener.com/ds-data/dexes/thena.png",
  biswap: "https://dd.dexscreener.com/ds-data/dexes/biswap.png",
  baseswap: "https://dd.dexscreener.com/ds-data/dexes/baseswap.png",
  lifinity: "/lifinity.png",
  fluxbeam: "/fluxbeam.png",
  openbook: "/openbook.png",
  phoenix: "/phoenix.png",
  manifest: "/manifest.png",
  serum: "/serum.png",
  velodrome: "https://dd.dexscreener.com/ds-data/dexes/velodrome.png",
  vvsfinance: "https://dd.dexscreener.com/ds-data/dexes/vvsfinance.png",
  argus: "/argus.png",
  arguslaunchpad: "/argus.png",
  argusportal8: "/argus.png",
  argusportal7: "/argus.png",
  pons: "/pons.png",
  ponsv2: "/pons.png",
  ponscurve: "/pons.png",
};

export function getDexLogo(dexNameOrId?: string | null): string | null {
  if (!dexNameOrId) return null;
  const norm = normalizeDexName(dexNameOrId);
  if (norm === "Unknown") return null;

  const slug = norm.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (DEX_LOGO_MAP[slug]) {
    return DEX_LOGO_MAP[slug];
  }

  return `https://dd.dexscreener.com/ds-data/dexes/${slug}.png`;
}

// ==========================================
// CENTRALIZED PROVIDER & DEX ROUTING CONFIGURATION
// Routes directly to DexScreener, Pump.fun based on API source
// ==========================================

export interface ProviderDetails {
  providerName: string;
  url: string;
  logoUrl: string;
  shortName: string;
  brandColor: string;
  badgeText: string;
}

export function getProviderDetails(
  token: Partial<TokenPair> | NormalizedPair | { baseToken?: { address?: string }; pairAddress?: string; chainId?: string; url?: string; primaryProvider?: string; sources?: string[]; launchPlatform?: string; primaryDex?: string; dexId?: string }
): ProviderDetails {
  if (!token) {
    return {
      providerName: "DexScreener",
      url: "https://dexscreener.com",
      logoUrl: "https://dexscreener.com/favicon.ico",
      shortName: "DexScreener",
      brandColor: "#38bdf8",
      badgeText: "DexScreener",
    };
  }

  const rawUrl = token.url || "";
  const provider = ((token as any).primaryProvider || "").toLowerCase();
  const sources = Array.isArray((token as any).sources) ? (token as any).sources.map((s: string) => String(s).toLowerCase()) : [];
  const chain = normalizeChainName(token.chainId);
  const pairAddress = (token as any).pairAddress || "";
  const baseAddress = token.baseToken?.address || ("address" in token ? (token as any).address : "");

  // 1b. Argus Launchpad Provider (Arc Mainnet - Chain 5042)
  if (
    (token as any).isArgusLaunch ||
    rawUrl.includes("argus.world") ||
    rawUrl.includes("arguspad.io") ||
    provider.includes("argus") ||
    sources.some((s: string) => s.includes("argus")) ||
    ((token as any).primaryDex && (token as any).primaryDex.toLowerCase().includes("argus"))
  ) {
    return {
      providerName: "Argus",
      url: baseAddress && /^0x[a-fA-F0-9]{40}$/.test(baseAddress)
        ? `https://argus.world/token/${baseAddress}`
        : "https://argus.world",
      logoUrl: "/argus.png",
      shortName: "Argus",
      brandColor: "#10b981",
      badgeText: "Argus",
    };
  }

  // 1. DexScreener Provider (Highest priority DEX aggregator)
  if (
    rawUrl.includes("dexscreener.com") ||
    provider.includes("dexscreener") ||
    sources.some((s: string) => s.includes("dexscreener"))
  ) {
    let dsUrl = rawUrl;
    if (!dsUrl || !dsUrl.includes("dexscreener.com")) {
      dsUrl = `https://dexscreener.com/${chain}/${pairAddress || baseAddress}`;
    }
    return {
      providerName: "DexScreener",
      url: dsUrl,
      logoUrl: "https://dexscreener.com/favicon.ico",
      shortName: "DexScreener",
      brandColor: "#38bdf8",
      badgeText: "DexScreener",
    };
  }

  // 2. Pump.fun Provider (if URL has pump.fun or launch platform is Pump.fun)
  // Explicitly excludes PumpSwap: "pumpswap" contains the substring "pump" too,
  // so without this exclusion a graduated token would incorrectly route back to
  // its old bonding-curve Pump.fun page instead of its real DexScreener pair.
  const isPumpSwap =
    provider.includes("pumpswap") ||
    sources.some((s: string) => s.includes("pumpswap")) ||
    (token as any).dexId === "pumpswap";
  if (
    !isPumpSwap && (
      rawUrl.includes("pump.fun") || 
      provider.includes("pump") || 
      (token as any).launchPlatform === "Pump.fun" || 
      (token as any).dexId === "pumpfun" || 
      ((token as any).primaryDex && (token as any).primaryDex.toLowerCase() === "pump.fun") ||
      sources.some((s: string) => s.includes("pump") && !s.includes("pumpswap"))
    )
  ) {
    const finalUrl = baseAddress ? `https://pump.fun/coin/${baseAddress}` : (rawUrl || "https://pump.fun");
    return {
      providerName: "Pump.fun",
      url: finalUrl,
      logoUrl: "https://dd.dexscreener.com/ds-data/dexes/pumpfun.png",
      shortName: "Pump.fun",
      brandColor: "#10b981",
      badgeText: "Pump.fun",
    };
  }

  // Default to DexScreener
  let dsUrl = rawUrl;
  if (!dsUrl || !dsUrl.includes("dexscreener.com")) {
    dsUrl = `https://dexscreener.com/${chain}/${pairAddress || baseAddress}`;
  }
  return {
    providerName: "DexScreener",
    url: dsUrl,
    logoUrl: "https://dexscreener.com/favicon.ico",
    shortName: "DexScreener",
    brandColor: "#38bdf8",
    badgeText: "DexScreener",
  };
}

/**
 * Returns a priority rank for ordering tokens in discovery and trending feeds.
 * Rank 0: DexScreener entries (come on top / top priority)
 * Rank 1: Pump.fun entries
 */
export function getProviderPriorityRank(
  token: Partial<TokenPair> | NormalizedPair | { baseToken?: { address?: string }; pairAddress?: string; chainId?: string; url?: string; primaryProvider?: string; sources?: string[]; launchPlatform?: string; primaryDex?: string; dexId?: string }
): number {
  if (!token) return 2;
  const details = getProviderDetails(token as any);
  if (details.providerName === "DexScreener") return 0;
  if (details.providerName === "Pump.fun") return 1;
  return 2;
}

export function getDexTradingUrl(
  token: Partial<TokenPair> | NormalizedPair | { baseToken?: { address?: string }; pairAddress?: string; chainId?: string; url?: string; primaryDex?: string; dexId?: string; launchPlatform?: string; isGraduated?: boolean; marketStage?: string },
  _overrideDex?: string | null
): string | null {
  if (!token) return null;
  const tokenObj = token as any;
  const ownedDexUrl = dexTradeUrl(tokenObj);
  if (ownedDexUrl !== undefined) return ownedDexUrl;
  const baseAddress = tokenObj.baseToken?.address || tokenObj.address || "";
  const chain = normalizeChainName(tokenObj.chainId);
  const dex = normalizeDexName(_overrideDex || tokenObj.primaryDex || tokenObj.dexId || tokenObj.primaryProvider);
  const dexSlug = dex.toLowerCase().replace(/[^a-z0-9]/g, "");

  // If no base address is present, fallback to provided url or DexScreener
  if (!baseAddress) {
    return tokenObj.url || (tokenObj.pairAddress ? `https://dexscreener.com/${chain}/${tokenObj.pairAddress}` : "https://dexscreener.com");
  }

  // Specific DEX checks take precedence based on the requested/active dex
  // 1. Raydium (Solana)
  if (dexSlug.includes("raydium")) {
    return `https://raydium.io/swap/?inputMint=sol&outputMint=${baseAddress}`;
  }

  // 2. Meteora (Solana)
  if (dexSlug.includes("meteora")) {
    const pAddr = tokenObj.pairAddress && tokenObj.pairAddress !== baseAddress ? tokenObj.pairAddress : "";
    return pAddr ? `https://app.meteora.ag/dlmm/${pAddr}` : `https://app.meteora.ag`;
  }

  // 3. Orca (Solana)
  if (dexSlug.includes("orca")) {
    return `https://www.orca.so/pools`;
  }

  // 4. PumpSwap (Solana - Pump.fun AMM)
  if (dexSlug.includes("pumpswap") && (chain === "solana" || isSolanaAddress(baseAddress))) {
    return `https://pump.fun/coin/${baseAddress}`;
  }

  // 5. PancakeSwap (Multi-Chain EVM: BSC, Ethereum, Base, Arbitrum, Polygon, Optimism)
  if (dexSlug.includes("pancake")) {
    let pChain = "bsc";
    if (chain === "ethereum") pChain = "eth";
    else if (chain === "base") pChain = "base";
    else if (chain === "arbitrum") pChain = "arb";
    else if (chain === "polygon") pChain = "polygon";
    else if (chain === "optimism") pChain = "op";
    return `https://pancakeswap.finance/swap?outputCurrency=${baseAddress}&chain=${pChain}`;
  }

  // 6. Uniswap (Ethereum, Base, Arbitrum, Polygon, BSC, Avalanche, Optimism, Robinhood)
  if (dexSlug.includes("uniswap")) {
    let uChain = "ethereum";
    if (chain === "base") uChain = "base";
    else if (chain === "arbitrum") uChain = "arbitrum";
    else if (chain === "polygon") uChain = "polygon";
    else if (chain === "bsc") uChain = "bnb";
    else if (chain === "avalanche") uChain = "avalanche";
    else if (chain === "optimism") uChain = "optimism";
    else if (chain === "robinhood" || chain === "arc") {
      return null;
    }
    return `https://app.uniswap.org/swap?outputCurrency=${baseAddress}&chain=${uChain}`;
  }

  // 7. Pump.fun (Solana Bonding Curve ONLY - strictly guarded against EVM)
  if (
    (chain === "solana" || isSolanaAddress(baseAddress)) &&
    (dexSlug.includes("pumpfun") || dexSlug === "pump" || (tokenObj.launchPlatform === "Pump.fun" && !tokenObj.isGraduated && tokenObj.marketStage === "bonding_curve"))
  ) {
    return `https://pump.fun/coin/${baseAddress}`;
  }

  // 6. Aerodrome (Base)
  if (dexSlug.includes("aerodrome")) {
    return `https://aerodrome.finance/swap?from=eth&to=${baseAddress}`;
  }

  // 7. Camelot (Arbitrum)
  if (dexSlug.includes("camelot")) {
    return `https://app.camelot.exchange/swap?to=${baseAddress}`;
  }

  // 8. QuickSwap (Polygon)
  if (dexSlug.includes("quickswap")) {
    return `https://quickswap.exchange/#/swap?currency1=${baseAddress}`;
  }

  // 9. Trader Joe / LFJ (Avalanche / Arbitrum)
  if (dexSlug.includes("traderjoe") || dexSlug === "lfj") {
    const tjChain = chain === "arbitrum" ? "arbitrum" : "avalanche";
    return `https://lfj.gg/${tjChain}/trade?outputCurrency=${baseAddress}`;
  }

  // 10. VVS Finance (Cronos)
  if (dexSlug.includes("vvs")) {
    return `https://vvs.finance/swap?outputCurrency=${baseAddress}`;
  }

  // 11. Meteora (Solana)
  if (dexSlug.includes("meteora")) {
    const pAddr = tokenObj.pairAddress && tokenObj.pairAddress !== baseAddress ? tokenObj.pairAddress : "";
    return pAddr ? `https://app.meteora.ag/dlmm/${pAddr}` : `https://app.meteora.ag`;
  }

  // 12. Orca (Solana)
  if (dexSlug.includes("orca")) {
    return `https://www.orca.so/pools`;
  }

  // 13. Phoenix (Solana)
  if (dexSlug.includes("phoenix")) {
    return `https://app.phoenix.fi`;
  }

  // 14. OpenBook (Solana)
  if (dexSlug.includes("openbook")) {
    return `https://openbook-dex.org`;
  }

  // 15. Lifinity (Solana)
  if (dexSlug.includes("lifinity")) {
    return `https://lifinity.io/swap/SOL-${baseAddress}`;
  }

  // 16. Manifest (Solana)
  if (dexSlug.includes("manifest")) {
    return `https://manifest.trade`;
  }

  // 17. Jupiter (Solana)
  if (dexSlug.includes("jupiter")) {
    return `https://jup.ag/swap/SOL-${baseAddress}`;
  }

  // 18. Thena (BSC)
  if (dexSlug.includes("thena")) {
    return `https://thena.fi/swap?outputCurrency=${baseAddress}`;
  }

  // 15. BiSwap (BSC)
  if (dexSlug.includes("biswap")) {
    return `https://biswap.org/swap?outputCurrency=${baseAddress}`;
  }

  // 16. BaseSwap (Base)
  if (dexSlug.includes("baseswap")) {
    return `https://baseswap.fi/swap?outputCurrency=${baseAddress}`;
  }

  // 17. SushiSwap (Multichain)
  if (dexSlug.includes("sushi")) {
    return `https://www.sushi.com/swap?token1=${baseAddress}`;
  }

  // 18. Velodrome (Optimism)
  if (dexSlug.includes("velodrome")) {
    return `https://velodrome.finance/swap?to=${baseAddress}`;
  }

  // 19. Curve
  if (dexSlug.includes("curve")) {
    return `https://curve.fi/#/${chain}/swap`;
  }

  // 20. Balancer
  if (dexSlug.includes("balancer")) {
    return `https://app.balancer.fi/#/${chain}/swap`;
  }

  // Intelligent ecosystem defaults if specific DEX lacks custom URL pattern:
  if (chain === "bsc") {
    return `https://pancakeswap.finance/swap?outputCurrency=${baseAddress}&chain=bsc`;
  }
  if (chain === "solana") {
    return `https://jup.ag/swap/SOL-${baseAddress}`;
  }
  if (chain === "base") {
    return `https://app.uniswap.org/swap?outputCurrency=${baseAddress}&chain=base`;
  }
  if (chain === "arbitrum") {
    return `https://app.camelot.exchange/swap?to=${baseAddress}`;
  }
  if (chain === "polygon") {
    return `https://quickswap.exchange/#/swap?currency1=${baseAddress}`;
  }
  if (chain === "avalanche") {
    return `https://lfj.gg/avalanche/trade?outputCurrency=${baseAddress}`;
  }
  if (chain === "cronos") {
    return `https://vvs.finance/swap?outputCurrency=${baseAddress}`;
  }
  if (chain === "ethereum") {
    return `https://app.uniswap.org/swap?outputCurrency=${baseAddress}&chain=ethereum`;
  }

  return token.url || (token.pairAddress ? `https://dexscreener.com/${chain}/${token.pairAddress}` : `https://dexscreener.com/${chain}/${baseAddress}`);
}

export const getDexBuyUrl = getDexTradingUrl;

// ==========================================
// PRIMARY DEX SELECTION ENGINE
// ==========================================

export interface DexSelectionCandidate {
  chainId?: string;
  dexes?: string[];
  pairs?: NormalizedPair[];
  sources?: string[];
  dexId?: string;
  primaryProvider?: string;
  launchPlatform?: string | null;
  isGraduated?: boolean;
  marketStage?: string;
}

export function selectPrimaryDex(token: DexSelectionCandidate): string | null {
  if (!token) return null;

  // Step 1: Collect all candidate DEX identifiers across pairs, dexes, sources, and dexId
  const rawDexCandidates: string[] = [];

  if (Array.isArray(token.dexes)) {
    rawDexCandidates.push(...token.dexes);
  }

  if (Array.isArray(token.pairs)) {
    for (const p of token.pairs) {
      if (p.dexName) rawDexCandidates.push(p.dexName);
      else if (p.dexId) rawDexCandidates.push(p.dexId);
    }
  }

  if (Array.isArray(token.sources)) {
    for (const s of token.sources) {
      rawDexCandidates.push(s);
    }
  }

  if (token.dexId) {
    rawDexCandidates.push(token.dexId);
  }

  // Deduplicate and normalize DEX names
  const uniqueDexMap = new Map<string, string>(); // lowercase -> NormalizedName

  for (const cand of rawDexCandidates) {
    if (!cand) continue;
    const normalized = normalizeDexName(cand);
    
    // Discard Unknown, empty, or pure launchpads when determining actual trading DEX
    if (
      normalized === "Unknown" ||
      isLaunchPlatformOnly(normalized) ||
      normalized === "DexScreener" ||
      normalized === "Moralis"
    ) {
      continue;
    }

    const lowerKey = normalized.toLowerCase();
    if (!uniqueDexMap.has(lowerKey)) {
      uniqueDexMap.set(lowerKey, normalized);
    }
  }

  const uniqueDexes = Array.from(uniqueDexMap.values());

  // If no actual DEX venue found
  if (uniqueDexes.length === 0) {
    return null;
  }

  // If only 1 DEX exists, return it
  if (uniqueDexes.length === 1) {
    return uniqueDexes[0];
  }

  // CRITICAL RULE: NEVER put Raydium ahead of PumpSwap on Solana!
  // If PumpSwap is present or available on the token (or launched on Pump.fun),
  // PumpSwap strictly takes precedence over Raydium in all comparisons.
  const isSolana = isSolanaToken(token as any) || normalizeChainName(token.chainId) === "solana";
  const hasPumpSwapCandidate =
    isSolana &&
    (uniqueDexes.some((d) => d.toLowerCase() === "pumpswap") ||
      (token.launchPlatform === "Pump.fun" && Boolean(token.isGraduated || token.marketStage === "pumpswap")) ||
      token.dexId?.toLowerCase() === "pumpswap" ||
      token.sources?.some((s) => s.toLowerCase().includes("pumpswap")) ||
      token.pairs?.some((p) => (p.dexName || p.dexId || "").toLowerCase().includes("pumpswap")));

  const hasRaydiumCandidate =
    isSolana &&
    (uniqueDexes.some((d) => d.toLowerCase() === "raydium") ||
      token.dexId?.toLowerCase() === "raydium" ||
      token.sources?.some((s) => s.toLowerCase().includes("raydium")) ||
      token.pairs?.some((p) => (p.dexName || p.dexId || "").toLowerCase().includes("raydium")));

  // If both are present, PumpSwap immediately wins on Solana
  if (hasPumpSwapCandidate && hasRaydiumCandidate) {
    return "PumpSwap";
  }

  // Step 2: If there are discovered pairs with valid positive liquidity, prefer the pool with the strongest valid liquidity/activity
  if (Array.isArray(token.pairs) && token.pairs.length > 0) {
    const pairsWithValidLiq = token.pairs
      .filter((p) => (p.liquidityUsd || 0) > 0 && p.dexName && p.dexName !== "Unknown" && !isLaunchPlatformOnly(p.dexName))
      .sort((a, b) => {
        const aNorm = normalizeDexName(a.dexName).toLowerCase();
        const bNorm = normalizeDexName(b.dexName).toLowerCase();

        // STRICT ENFORCEMENT: PumpSwap strictly ahead of Raydium
        if (aNorm === "pumpswap" && bNorm === "raydium") return -1;
        if (bNorm === "pumpswap" && aNorm === "raydium") return 1;

        const liqDiff = (b.liquidityUsd || 0) - (a.liquidityUsd || 0);
        if (Math.abs(liqDiff) > 1) return liqDiff;
        return (b.volume24h || 0) - (a.volume24h || 0);
      });

    if (pairsWithValidLiq.length > 0 && pairsWithValidLiq[0].dexName) {
      let topDexNorm = normalizeDexName(pairsWithValidLiq[0].dexName);
      // Guarantee: Never output Raydium if token has PumpSwap
      if (topDexNorm === "Raydium" && hasPumpSwapCandidate) {
        topDexNorm = "PumpSwap";
      }
      if (topDexNorm && topDexNorm !== "Unknown") {
        return topDexNorm;
      }
    }
  }

  // Step 3: Check chain-specific priority list
  const normChain = normalizeChainName(token.chainId);
  const priorityList = DEX_PRIORITY[normChain] || [];

  if (priorityList.length > 0) {
    let bestDex: string | null = null;
    let bestRank = Number.MAX_SAFE_INTEGER;

    for (const dex of uniqueDexes) {
      const dexLower = dex.toLowerCase();
      const rankIndex = priorityList.findIndex((p) => p.toLowerCase() === dexLower);
      if (rankIndex !== -1 && rankIndex < bestRank) {
        bestRank = rankIndex;
        bestDex = dex;
      }
    }

    if (bestDex !== null) {
      return bestDex;
    }
  }

  // Step 4: Deterministic fallback - sort alphabetically (case-insensitive)
  const sortedDexes = [...uniqueDexes].sort((a, b) => 
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  return sortedDexes[0] || null;
}

// ==========================================
// PAIR NORMALIZER UTILITY
// ==========================================

export function normalizePair(rawPair: Partial<TokenPair>, providerSource = "DexScreener"): NormalizedPair {
  const chainId = normalizeChainName(rawPair.chainId, rawPair.baseToken?.address, rawPair.url);
  const rawDex = rawPair.dexId || rawPair.primaryProvider || "Unknown";
  const dexName = normalizeDexName(rawDex);
  const dexId = rawPair.dexId || dexName.toLowerCase().replace(/[^a-z0-9]/g, "");

  const baseAddress = rawPair.baseToken?.address || "";
  const baseName = rawPair.baseToken?.name || "Unknown Token";
  const baseSymbol = rawPair.baseToken?.symbol || "TOKEN";

  const liqUsd = Number(rawPair.liquidity?.usd || 0);
  const volUsd = Number(rawPair.volume?.h24 || 0);
  const priceChange = rawPair.priceChange?.h24 !== undefined ? Number(rawPair.priceChange.h24) : undefined;

  return {
    chainId,
    dexId,
    dexName,
    pairAddress: rawPair.pairAddress || baseAddress,
    baseToken: {
      address: baseAddress,
      name: baseName,
      symbol: baseSymbol,
    },
    quoteToken: rawPair.quoteToken ? {
      address: rawPair.quoteToken.address || "",
      name: rawPair.quoteToken.name || "",
      symbol: rawPair.quoteToken.symbol || "",
    } : undefined,
    price: rawPair.priceUsd || rawPair.priceNative,
    priceUsd: rawPair.priceUsd,
    priceNative: rawPair.priceNative,
    liquidity: liqUsd,
    liquidityUsd: liqUsd,
    volume24h: volUsd,
    priceChange24h: priceChange,
    url: rawPair.url,
    pairCreatedAt: rawPair.pairCreatedAt,
    source: rawPair.primaryProvider || providerSource,
  };
}

// ==========================================
// VERIFICATION TEST CASES (Self-Test Suite)
// ==========================================

export function runDexPriorityTests(): { allPassed: boolean; results: Array<{ test: string; passed: boolean; expected: any; actual: any }> } {
  const results = [];

  // Case 1: Solana token with PumpSwap, Raydium, Meteora -> PumpSwap + direct URL
  // Case 1: DexScreener provider token -> DexScreener URL & details
  const p1 = getProviderDetails({
    chainId: "solana",
    pairAddress: "ABC123PairAddress",
    baseToken: { address: "ABC123MintAddress", name: "ABC", symbol: "ABC" },
    url: "https://dexscreener.com/solana/ABC123PairAddress",
  });
  results.push({
    test: "Case 1: DexScreener provider token -> Provider name & exact DexScreener URL",
    passed: p1.providerName === "DexScreener" && p1.url === "https://dexscreener.com/solana/ABC123PairAddress",
    expected: { name: "DexScreener", url: "https://dexscreener.com/solana/ABC123PairAddress" },
    actual: { name: p1.providerName, url: p1.url },
  });

  // Case 2: Solana Raydium pair -> DexScreener URL & details
  const p2 = getProviderDetails({
    chainId: "solana",
    primaryDex: "Raydium",
    pairAddress: "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2",
    baseToken: { address: "So11111111111111111111111111111111111111112", name: "Wrapped SOL", symbol: "SOL" },
  });
  results.push({
    test: "Case 2: Solana Raydium pair -> Provider name & DexScreener URL",
    passed: p2.providerName === "DexScreener" && p2.url.includes("dexscreener.com/solana"),
    expected: { name: "DexScreener" },
    actual: { name: p2.providerName },
  });

  // Case 3: Pump.fun token -> Pump.fun URL & details
  const p3 = getProviderDetails({
    chainId: "solana",
    launchPlatform: "Pump.fun",
    baseToken: { address: "PumpCoinMint123", name: "PUMP", symbol: "PUMP" },
    url: "https://pump.fun/coin/PumpCoinMint123",
  });
  results.push({
    test: "Case 3: Pump.fun token -> Provider name & exact Pump.fun URL",
    passed: p3.providerName === "Pump.fun" && p3.url === "https://pump.fun/coin/PumpCoinMint123",
    expected: { name: "Pump.fun", url: "https://pump.fun/coin/PumpCoinMint123" },
    actual: { name: p3.providerName, url: p3.url },
  });

  // Case 4: Base token Primary DEX Selection
  const c4 = selectPrimaryDex({
    chainId: "base",
    dexes: ["Aerodrome", "Uniswap"],
  });
  results.push({
    test: "Case 4: Base [Aerodrome, Uniswap] -> Aerodrome as primary DEX",
    passed: c4 === "Aerodrome",
    expected: "Aerodrome",
    actual: c4,
  });

  // Case 5: Pump.fun bonding curve token with NO DEX pair -> launchPlatform = Pump.fun, primaryDex = null
  const c5 = selectPrimaryDex({
    chainId: "solana",
    dexes: [],
    sources: ["Pump.fun"],
  });
  results.push({
    test: "Case 5: Pump.fun bonding curve (no AMM pair) -> primaryDex = null",
    passed: c5 === null,
    expected: null,
    actual: c5,
  });

  // Case 6: Solana token with both PumpSwap and Raydium -> PumpSwap MUST beat Raydium
  const c6 = selectPrimaryDex({
    chainId: "solana",
    dexes: ["Raydium", "PumpSwap"],
  });
  results.push({
    test: "Case 6: Solana [Raydium, PumpSwap] -> PumpSwap beats Raydium",
    passed: c6 === "PumpSwap",
    expected: "PumpSwap",
    actual: c6,
  });

  // Case 7: Solana token with Raydium having higher liquidity than PumpSwap -> PumpSwap STILL strictly beats Raydium
  const c7 = selectPrimaryDex({
    chainId: "solana",
    pairs: [
      { dexName: "Raydium", liquidityUsd: 500000, volume24h: 100000 },
      { dexName: "PumpSwap", liquidityUsd: 50000, volume24h: 20000 },
    ] as any,
  });
  results.push({
    test: "Case 7: PumpSwap preferred over Raydium even when Raydium has higher liquidity",
    passed: c7 === "PumpSwap",
    expected: "PumpSwap",
    actual: c7,
  });

  const allPassed = results.every((r) => r.passed);
  return { allPassed, results };
}
