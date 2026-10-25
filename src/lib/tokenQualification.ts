import { TokenPair } from "../types";
import { isEvmAddress, normalizeChainName } from "./dexPriority";
import { isBondingCurveToken } from "./tokenIdentity";

// ============================================================================
// DEXHUNTER CANONICAL KNOWN-ASSET & LOGO REGISTRY
// High-resolution verified logos for base assets, blue chips, and wrapped tokens
// Priority: Canonical Logo -> Provider Logo -> Metadata URI -> Fallback
// ============================================================================

export interface CanonicalAssetInfo {
  name: string;
  symbol: string;
  logoUrl: string;
  isEstablishedBaseAsset?: boolean;
}

export const CANONICAL_TOKEN_LOGOS: Record<string, string> = {
  // Ethereum
  "ethereum:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png", // WETH
  "ethereum:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png", // WBTC
  "ethereum:0xdac17f958d2ee523a2206206994597c13d831ec7": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png", // USDT
  "ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png", // USDC
  "ethereum:0x6b175474e89094c44da98b954eedeac495271d0f": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png", // DAI
  "ethereum:0xae7ab96520de3a18e5e111b5eaab095312d7fe84": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo.png", // stETH

  // Solana
  "solana:so11111111111111111111111111111111111111112": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png", // WSOL / SOL
  "solana:es9vmfrzacerrmjfrf4h2fyd4kconky11mcce8benwnyb": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png", // USDT
  "solana:es9vmfrzacerrmjfrf4h2fyd4kconky11mcce8benwny": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png", // USDT
  "solana:epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png", // USDC

  // BSC
  "bsc:0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png", // WBNB
  "bsc:0x55d398326f99059ff775485246999027b3197955": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png", // BSC USDT
  "bsc:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png", // BSC USDC
  "bsc:0x2170ed0880ac9a755fd29b2688956bd959f933f8": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png", // BSC ETH

  // Base
  "base:0x4200000000000000000000000000000000000006": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png", // Base WETH
  "base:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png", // Base USDC

  // Polygon
  "polygon:0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png", // WMATIC / POL
  "polygon:0x7ceb23fd6bc0add59e62ac25578270cff1b9f619": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png", // Poly WETH
  "polygon:0xc2132d05d31c914a87c6611c10748aeb04b58e8f": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png", // Poly USDT
  "polygon:0x3c499c542cef5e3811e1192ce70d8cc03d5c3359": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png", // Poly USDC

  // Arbitrum
  "arbitrum:0x82af49447d8a07e3bd95bd0d56f35241523fbab1": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png", // Arb WETH
  "arbitrum:0xaf88d065e77c8cc2239327c5edb3a432268e5831": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png", // Arb USDC
  "arbitrum:0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png", // Arb USDT

  // Avalanche
  "avalanche:0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png", // WAVAX
  "avalanche:0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png", // Avax USDT
  "avalanche:0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png", // Avax USDC
};

// Fallback symbol-level canonical logos for search & display
export const CANONICAL_SYMBOL_LOGOS: Record<string, string> = {
  WETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
  ETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
  WBTC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png",
  BTC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png",
  USDT: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
  USDC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
  DAI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png",
  SOL: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
  WSOL: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
  BNB: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
  WBNB: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
  MATIC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
  WMATIC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
  POL: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
  AVAX: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png",
  WAVAX: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png",
};

/**
 * Returns canonical logo for known assets, or undefined
 */
export function getCanonicalTokenLogo(chainId?: string, address?: string, symbol?: string): string | undefined {
  const normChain = normalizeChainName(chainId);
  const rawAddr = (address || "").trim();
  // Registry keys are stored lowercased. Lowercase EVM addresses for lookup.
  // Solana keys in this registry are also stored lowercased, so both sides of
  // the lookup are lowercased for matching only (the caller's address is not mutated).
  const normAddr = isEvmAddress(rawAddr) ? rawAddr.toLowerCase() : rawAddr.toLowerCase();
  const normSymbol = (symbol || "").toUpperCase().trim();

  // 1. Exact chain + contract address match
  if (normAddr && CANONICAL_TOKEN_LOGOS[`${normChain}:${normAddr}`]) {
    return CANONICAL_TOKEN_LOGOS[`${normChain}:${normAddr}`];
  }

  // 2. Exact address across all chains
  for (const key in CANONICAL_TOKEN_LOGOS) {
    if (key.endsWith(`:${normAddr}`)) {
      return CANONICAL_TOKEN_LOGOS[key];
    }
  }

  // 3. Symbol-only fallback is limited to SOL/ETH/BTC. Ultra-generic symbols
  // (USDT, WETH, etc.) must not steal a canonical logo via ticker match.
  if (normSymbol === "SOL" || normSymbol === "ETH" || normSymbol === "BTC") {
    if (CANONICAL_SYMBOL_LOGOS[normSymbol]) {
      return CANONICAL_SYMBOL_LOGOS[normSymbol];
    }
  }

  return undefined;
}

// ============================================================================
// CENTRALIZED EXCLUSION / ESTABLISHED ASSETS REGISTRY
// Identifies wrapped/base tokens, major stablecoins, and mega-cap assets
// ============================================================================

export interface ExcludedAssetConfig {
  stablecoins: string[];
  wrappedAssets: string[];
  majorAssets: string[];
  knownAddresses: Record<string, string[]>; // chainId -> lowercase contract addresses
}

export const EXCLUDED_TRENDING_ASSETS: ExcludedAssetConfig = {
  stablecoins: [
    "USDT",
    "USDC",
    "DAI",
    "USDE",
    "FDUSD",
    "TUSD",
    "USDS",
    "PYUSD",
    "BUSD",
    "USDD",
    "FRAX",
    "LUSD",
    "CRVUSD",
    "GUSD",
    "EUSD",
    "USDJ",
    "CUSD",
    "USDY",
    "USDC.E",
    "USDT.E",
  ],
  wrappedAssets: [
    "WETH",
    "WBTC",
    "WBNB",
    "WMATIC",
    "WAVAX",
    "WSOL",
    "WFTM",
    "WCRO",
    "WONE",
    "WGLMR",
    "WROSE",
    "STETH",
    "WSTETH",
    "RETH",
    "CBETH",
    "WEETH",
    "EZETH",
    "TBTC",
    "SOLVBTC",
    "FBTC",
  ],
  majorAssets: [
    "BTC",
    "ETH",
    "SOL",
    "BNB",
    "XRP",
    "ADA",
    "DOGE",
    "TRX",
    "AVAX",
    "LINK",
    "DOT",
    "MATIC",
    "POL",
    "TON",
    "NEAR",
    "SUI",
    "APT",
    "FTM",
    "ATOM",
    "LTC",
    "BCH",
    "SHIB",
  ],
  knownAddresses: {
    ethereum: [
      "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
      "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", // WBTC
      "0xae7ab96520de3a18e5e111b5eaab095312d7fe84", // stETH
      "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0", // wstETH
      "0x4c9edd5852cd905f086c759e8383e09bff1e68b3", // USDe
      "0x853d955acef822db058eb8505911ed77f175b99e", // FRAX
      "0x0000000000085d4780b73119b644ae5ecd22b376", // TUSD
      "0x6c3ea9036406852006290770bedfcaba0e23a0e8", // PYUSD
    ],
    solana: [
      "so11111111111111111111111111111111111111112", // WSOL
      "es9vmfrzacerrmjfrf4h2fyd4kconky11mcce8benwny", // USDT
      "es9vmfrzacerrmjfrf4h2fyd4kconky11mcce8benwnyb", // USDT
      "epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v", // USDC
      "3nzkpvrwovbkhqbfskv1l9e2a7wff1t3lq8yvvvhcsqq", // WBTC
    ],
    bsc: [
      "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", // WBNB
      "0x55d398326f99059ff775485246999027b3197955", // BSC-USD (USDT)
      "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // USDC
      "0xe9e7cea3dedca5984780bafc599bd69add087d56", // BUSD
      "0x2170ed0880ac9a755fd29b2688956bd959f933f8", // ETH
      "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c", // BTCB
      "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3", // DAI
    ],
    base: [
      "0x4200000000000000000000000000000000000006", // WETH
      "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", // USDC
      "0x50c5725949a6f0c72e6c4a641f24049a917db0cb", // DAI
      "0x0555e30da8f98308edb960aa94c0db47230d2b9c", // WBTC
      "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca", // USDbC
      "0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22", // cbETH
    ],
    polygon: [
      "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270", // WMATIC
      "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619", // WETH
      "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", // USDT
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC (bridged)
      "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", // USDC (native)
      "0x1bfd67037b424364057243a194f85de646add3cb", // WBTC
      "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // DAI
    ],
    arbitrum: [
      "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // WETH
      "0xaf88d065e77c8cc2239327c5edb3a432268e5831", // USDC (native)
      "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", // USDC.e
      "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", // USDT
      "0x2f2a2543b76a4166549f7aab2e75261276405b9b", // WBTC
      "0xda10009c23e0b731c0ab5b5ca4948a4729f27d39", // DAI
    ],
    avalanche: [
      "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7", // WAVAX
      "0x49d5c2bd9e8473971fc2ee92554fce074ac02728", // WETH.e
      "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7", // USDT
      "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e", // USDC
      "0x50b7545627a5162f82a992c33b87adc75187b218", // WBTC.e
    ],
  },
};

const STABLECOINS_SET = new Set(EXCLUDED_TRENDING_ASSETS.stablecoins.map((s) => s.toUpperCase()));
const WRAPPED_SET = new Set(EXCLUDED_TRENDING_ASSETS.wrappedAssets.map((s) => s.toUpperCase()));
const MAJOR_SET = new Set(EXCLUDED_TRENDING_ASSETS.majorAssets.map((s) => s.toUpperCase()));

const CANONICAL_BASE_NAME_PATTERNS = [
  /^tether\s+usd/i,
  /^usd\s+coin/i,
  /^wrapped\s+(ether|ethereum|bitcoin|btc|bnb|sol|solana|matic|avax|ftm|cro)/i,
  /^dai\s+stablecoin/i,
  /^ethena\s+usde/i,
  /^binance-peg\s+(ethereum|bitcoin|usdt|busd|usdc)/i,
  /^lido\s+staked\s+eth/i,
  /^rocket\s+pool\s+eth/i,
  /^binance\s+bridged/i,
];

/**
 * Checks if a token is a known established base asset (WETH, USDT, SOL, WBTC, etc.)
 * NEVER exclude from search, but deprioritize/exclude from discovery/trending.
 */
export function isExcludedTrendingAsset(token: Partial<TokenPair>): boolean {
  if (!token) return true;

  const chain = normalizeChainName(token.chainId);
  const rawAddress = (token.baseToken?.address || "").toLowerCase().trim();
  const rawSymbol = (token.baseToken?.symbol || "").trim().toUpperCase();
  const rawName = (token.baseToken?.name || "").trim();

  // 1. Exact Chain + Known Contract Address match (exact address only — never startsWith, never pairAddress)
  if (rawAddress && EXCLUDED_TRENDING_ASSETS.knownAddresses[chain]) {
    const knownList = EXCLUDED_TRENDING_ASSETS.knownAddresses[chain];
    if (knownList.includes(rawAddress)) {
      return true;
    }
  }

  // Also check across all known addresses if address matches exactly
  for (const c in EXCLUDED_TRENDING_ASSETS.knownAddresses) {
    if (EXCLUDED_TRENDING_ASSETS.knownAddresses[c].includes(rawAddress)) {
      return true;
    }
  }

  // 2. Exact Canonical Name check (e.g. "Tether USD", "Wrapped Ether", "USD Coin")
  const isCanonicalName = CANONICAL_BASE_NAME_PATTERNS.some((pattern) => pattern.test(rawName));
  if (isCanonicalName) {
    return true;
  }

  // 3. Exact Symbol Match + Asset Category Validation
  const isExactStableSymbol = STABLECOINS_SET.has(rawSymbol);
  const isExactWrappedSymbol = WRAPPED_SET.has(rawSymbol);
  const isExactMajorSymbol = MAJOR_SET.has(rawSymbol);

  if (isExactStableSymbol || isExactWrappedSymbol || isExactMajorSymbol) {
    const mcap = Number(token.marketCap || token.fdv || 0);
    const liq = Number(token.liquidity?.usd || (token as any).totalLiquidityUsd || 0);

    // If market cap > $50M or liquidity > $2M and symbol is USDT/WETH/USDC/BTC/ETH -> Definite exclusion
    if (mcap > 50_000_000 || liq > 2_000_000) {
      return true;
    }

    const lowerName = rawName.toLowerCase();
    if (
      lowerName === "tether" ||
      lowerName === "tether usd" ||
      lowerName === "usd coin" ||
      lowerName === "wrapped ether" ||
      lowerName === "wrapped bitcoin" ||
      lowerName === "wrapped bnb" ||
      lowerName === "wrapped sol" ||
      lowerName === "wrapped solana" ||
      lowerName === "wrapped matic" ||
      lowerName === "dai stablecoin" ||
      lowerName === "dai" ||
      lowerName === "ethereum" ||
      lowerName === "bitcoin" ||
      lowerName === "solana" ||
      lowerName === "binance coin"
    ) {
      return true;
    }

    if (liq > 500_000 && (rawName.toUpperCase() === rawSymbol || rawName.length <= 4)) {
      return true;
    }
  }

  // 4. Mega-Cap Filter for Trending Feed ($500M+ Market Cap)
  const mcap = Number(token.marketCap || token.fdv || 0);
  if (mcap > 500_000_000) {
    return true;
  }

  return false;
}

// ============================================================================
// SOCIAL COMPLETENESS & METADATA QUALITY
// ============================================================================

export interface SocialScoreBreakdown {
  score: number;
  hasWebsite: boolean;
  hasTwitter: boolean;
  hasTelegram: boolean;
  hasDiscord: boolean;
  totalSocials: number;
}

/**
 * Calculates a nuanced social completeness score (0 - 150)
 * Evaluates website, Twitter/X, Telegram, Discord, and narrative bio.
 * Does NOT hard-delete tokens without socials, but provides a fair quality gradient.
 */
export function calculateSocialScore(token: Partial<TokenPair>): SocialScoreBreakdown {
  let score = 0;
  const websites = token.info?.websites || [];
  const socials = token.info?.socials || [];

  const hasWebsite = websites.some((w) => w && typeof w.url === "string" && w.url.trim().startsWith("http"));
  const hasTwitter = socials.some(
    (s) => s && typeof s.url === "string" && (s.type === "twitter" || s.type === "x" || s.url.includes("x.com") || s.url.includes("twitter.com"))
  );
  const hasTelegram = socials.some(
    (s) => s && typeof s.url === "string" && (s.type === "telegram" || s.url.includes("t.me") || s.url.includes("telegram"))
  );
  const hasDiscord = socials.some(
    (s) => s && typeof s.url === "string" && (s.type === "discord" || s.url.includes("discord.gg") || s.url.includes("discord.com"))
  );

  if (hasWebsite) score += 35;
  if (hasTwitter) score += 45;
  if (hasTelegram) score += 40;
  if (hasDiscord) score += 20;

  return {
    score,
    hasWebsite,
    hasTwitter,
    hasTelegram,
    hasDiscord,
    totalSocials: socials.length + (hasWebsite ? 1 : 0),
  };
}

export function hasSocialLinks(token: Partial<TokenPair>): boolean {
  if (!token?.info) return false;
  const socials = token.info.socials || [];
  const websites = token.info.websites || [];
  return socials.some((s) => s?.url && s.url.trim() !== "") || websites.some((w) => w?.url && w.url.trim() !== "");
}

// ============================================================================
// SPAM / LOW-QUALITY RISK DETECTOR
// Flags abandoned, dead, low-metadata, or duplicate tokens conservatively
// ============================================================================

export interface QualityClassification {
  tier: "TIER_A" | "TIER_B" | "TIER_C" | "TIER_D" | "TIER_E";
  tierLabel: string;
  category: "HIGH_QUALITY" | "EMERGING" | "AVERAGE" | "LOW_METADATA" | "ESTABLISHED_ASSET" | "LOW_ACTIVITY";
  tokenQualityScore: number;
  discoveryScore: number;
  finalScore: number;
  spamRisk: number;
}

export function calculateSpamRisk(token: Partial<TokenPair>): number {
  if (!token) return 500;

  let risk = 0;
  const vol = Number(token.volume?.h24 || (token as any).totalVolume24h || 0);
  const liq = Number(token.liquidity?.usd || (token as any).totalLiquidityUsd || 0);
  const mcap = Number(token.marketCap || token.fdv || 0);
  const ageHours = Number((token as any).tokenAgeHours ?? 24);
  const socialBreakdown = calculateSocialScore(token);

  // Negative signal 1: Zero logo + zero socials + low liquidity
  const hasLogo = Boolean(token.info?.imageUrl && !token.info.imageUrl.includes("placeholder"));
  if (!hasLogo && socialBreakdown.totalSocials === 0 && liq < 2000) {
    risk += 120;
  }

  // Negative signal 2: Old token (>60 days / 1440 hours) with near-zero 24h volume
  if (ageHours > 1440 && vol < 500) {
    risk += 150;
  }

  // Negative signal 3: Extremely low liquidity with zero volume
  if (liq < 300 && vol < 100) {
    risk += 120;
  }

  // Negative signal 4: $1000 exact placeholder market cap with no activity
  if ((mcap === 1000 || (mcap >= 990 && mcap <= 1010)) && liq === 0 && vol === 0) {
    risk += 300;
  }

  return Math.min(500, risk);
}

// ============================================================================
// DEXHUNTER TOKEN QUALITY SCORE (0 - 1000)
// Represents genuine project completeness, liquidity health, and credibility
// ============================================================================

function getExactAgeHours(token: Partial<TokenPair>): number | undefined {
  if (typeof (token as any).tokenAgeHours === "number") {
    return (token as any).tokenAgeHours;
  }
  if (token.pairCreatedAt && token.pairCreatedAt > 0) {
    const createdMs = token.pairCreatedAt < 10000000000 ? token.pairCreatedAt * 1000 : token.pairCreatedAt;
    return Math.max(0, (Date.now() - createdMs) / 3600000);
  }
  return undefined;
}

export function calculateTokenQualityScore(token: Partial<TokenPair>): number {
  if (!token) return 0;

  let score = 100; // Base score

  const vol = Number(token.volume?.h24 || (token as any).totalVolume24h || 0);
  const liq = Number(token.liquidity?.usd || (token as any).totalLiquidityUsd || 0);
  const ageHours = getExactAgeHours(token);
  const buys = token.txns?.h24?.buys || 0;
  const sells = token.txns?.h24?.sells || 0;
  const totalTxns = buys + sells;

  // 1. Logo Quality & Verified Identity
  const logo = token.info?.imageUrl;
  if (logo && !logo.includes("placeholder") && !logo.includes("missing")) {
    score += 80;
  } else {
    score -= 40; // Penalty for having no image
  }

  // 2. Social & Community Completeness Score
  const socialBreakdown = calculateSocialScore(token);
  score += socialBreakdown.score; // Up to +140
  if (socialBreakdown.totalSocials === 0) {
    score -= 60; // Moderate push downwards for tokens with zero community links
  }

  const isBondingCurve = Boolean((token as any).isBondingCurve);
  const isExemptFromLowMetricPenalty = isBondingCurve || Boolean(
    (token as any).complete ||
    (token as any).isGraduated ||
    (token as any).marketStage === "pumpswap" ||
    (token as any).primaryDex === "PumpSwap" ||
    (token as any).dexId === "pumpswap"
  );

  // 3. Liquidity Health & Backing
  if (liq >= 100_000) {
    score += 150;
  } else if (liq >= 25_000) {
    score += 120;
  } else if (liq >= 5_000) {
    score += 80;
  } else if (liq >= 1_000) {
    score += 40;
  } else if (liq < 500 && !isExemptFromLowMetricPenalty) {
    // A token still on the bonding curve does not have a conventional liquidity
    // pool yet, so near-zero liquidity here is expected, not a quality problem.
    score -= 30;
  }

  // 4. 24h Volume Activity (Logarithmic scaling)
  if (vol > 1_000_000) {
    score += 180;
  } else if (vol > 100_000) {
    score += 140;
  } else if (vol > 10_000) {
    score += 100;
  } else if (vol > 1_000) {
    score += 60;
  } else if (vol < 300 && !isExemptFromLowMetricPenalty) {
    // Same reasoning: bonding curve tokens do not yet have tracked 24h volume,
    // so this should not read as a spam or low-quality signal for this stage.
    score -= 40;
  }

  // 5. Volume-to-Liquidity Velocity
  if (liq > 0 && vol > 0) {
    const v2l = vol / liq;
    if (v2l >= 1.0 && v2l <= 15.0) {
      score += 60; // Active, healthy trading velocity
    } else if (v2l > 15.0) {
      score += 40; // High viral velocity
    }
  }

  // 6. Transaction Activity & Buy/Sell Health
  if (totalTxns > 500) {
    score += 60;
  } else if (totalTxns > 50) {
    score += 30;
  }

  // 7. Multi-Source Confirmation Bonus (Cross-verified across DexScreener, Pump.fun, On-Chain RPCs)
  if (token.sources && token.sources.length > 1) {
    score += Math.min(60, token.sources.length * 20);
  }

  // 8. Age vs. Activity Relationship (Intelligent age handling)
  if (ageHours !== undefined && ageHours > 720) { // >30 days
    if (vol < 1_000) {
      score -= 100; // Old & stagnant
    } else if (vol > 50_000) {
      score += 50;  // Old token with sudden resurging volume
    }
  }

  // Deduct spam risk
  const spamRisk = calculateSpamRisk(token);
  score -= Math.round(spamRisk * 0.5);

  return Math.max(0, Math.min(1000, score));
}

// ============================================================================
// DEXHUNTER DISCOVERY RELEVANCE SCORE (0 - 1000)
// Evaluates emerging token momentum, fresh discovery signals, and price action
// ============================================================================

export function calculateDiscoveryScore(
  token: Partial<TokenPair>,
  mode: "trending" | "fresh_mints" | "latest" = "trending"
): number {
  if (!token) return 0;

  let score = 100;

  const mcap = Number(token.marketCap || token.fdv || 0);
  const vol24 = Number(token.volume?.h24 || (token as any).totalVolume24h || 0);
  const vol6h = Number(token.volume?.h6 || 0);
  const vol1h = Number(token.volume?.h1 || 0);
  const vol5m = Number(token.volume?.m5 || 0);
  const liq = Number(token.liquidity?.usd || (token as any).totalLiquidityUsd || 0);
  const priceChange24h = Number(token.priceChange?.h24 || 0);
  const ageHours = getExactAgeHours(token);

  if (mode === "fresh_mints") {
    // Specialized Fresh Mints Scoring:
    // Focuses on recency, bonding curve progress, early buy velocity, and creator metadata
    if (ageHours !== undefined) {
      if (ageHours < 2) {
        score += 250;
      } else if (ageHours < 6) {
        score += 200;
      } else if (ageHours < 24) {
        score += 120;
      }
    } else {
      score += 100;
    }

    if (vol24 > 10_000) score += 150;
    else if (vol24 > 1_000) score += 100;
    else if (vol24 > 200) score += 50;
    else if ((token as any).isBondingCurve || (token as any).complete || (token as any).isGraduated || (token as any).marketStage === "pumpswap") {
      // vol24 is not tracked for tokens still on the bonding curve or newly migrated, so this would
      // otherwise score zero here regardless of real activity. Bonding progress or completion
      // is a genuine momentum signal for this stage.
      const isCompleteOrGraduated = Boolean((token as any).complete || (token as any).isGraduated || (token as any).marketStage === "pumpswap");
      const progress = Number((token as any).bondingProgress || 0);
      if (isCompleteOrGraduated || progress >= 100) score += 120;
      else if (progress > 40) score += 100;
      else if (progress > 15) score += 60;
      else if (progress > 5) score += 30;
    }

    if (token.launchPlatform === "Pump.fun") {
      score += 100;
    }

    if (hasSocialLinks(token)) {
      score += 60;
    }

    return Math.max(0, Math.min(1000, score));
  }

  // Standard Trending / Discovery Mode:
  // 1. Sweet Spot Market Cap Scoring (only awarded if active volume exists)
  if (vol24 >= 500) {
    if (mcap >= 5_000 && mcap <= 500_000) {
      score += 180; // Early micro-cap breakout
    } else if (mcap > 500_000 && mcap <= 5_000_000) {
      score += 150; // Strong emerging momentum
    } else if (mcap > 5_000_000 && mcap <= 30_000_000) {
      score += 90; // Established mid-cap
    } else if (mcap < 5_000 && mcap > 500) {
      score += 90; // Fresh nano cap
    }
  }

  // 2. Price Momentum & Growth
  if (priceChange24h > 100) {
    score += 120;
  } else if (priceChange24h > 20) {
    score += 80;
  } else if (priceChange24h > 0) {
    score += 40;
  }

  // 3. Multi-Interval Volume Velocity (5m / 1h / 6h / 24h)
  if (vol5m > 5_000) score += 120;
  else if (vol5m > 1_000) score += 70;
  else if (vol5m > 100) score += 30;

  if (vol1h > 25_000) score += 140;
  else if (vol1h > 5_000) score += 90;
  else if (vol1h > 500) score += 40;

  if (vol6h > 50_000) score += 80;
  else if (vol6h > 10_000) score += 50;

  if (vol24 > 100_000) score += 120;
  else if (vol24 > 20_000) score += 80;
  else if (vol24 > 2_000) score += 40;

  // 4. Transaction Momentum (Buy vs Sell pressure)
  const buysH1 = Number(token.txns?.h1?.buys || 0);
  const sellsH1 = Number(token.txns?.h1?.sells || 0);
  if (buysH1 + sellsH1 > 50) score += 80;
  else if (buysH1 + sellsH1 > 10) score += 40;
  if (buysH1 > sellsH1 && buysH1 >= 5) score += 40;

  // 5. Real-World DexScreener/FOMO/Axiom Boosts & Multi-Source Signals
  if ((token as any).isBoosted || (token as any).boostAmount) {
    const boostCount = Number((token as any).boostAmount || 1);
    score += Math.min(220, 90 + boostCount * 5); // Real-world boost runner priority
  }

  // 5b. Emerging Ecosystem / Appchain Momentum (e.g. Robinhood chain, Base, Solana breakouts)
  const normChain = normalizeChainName(token.chainId);
  if (normChain === "robinhood") {
    score += 85; // Active emerging EVM appchain momentum
  }

  // 5c. Graduated Age Penalty & Freshness Boost
  if (ageHours !== undefined) {
    if (ageHours < 6 && vol24 > 500) {
      score += 150; // Fresh viral breakout
    } else if (ageHours < 24 && vol24 > 500) {
      score += 100;
    } else if (ageHours < 168 && vol24 > 500) {
      score += 40;
    } else if (ageHours > 720) {
      score -= 500; // Ancient stagnant token
    } else if (ageHours > 168) {
      // Tokens older than 1 week (7 days) receive a heavy discovery deduction
      score -= 350;
    }
  }

  // 6. Zero Activity Heavy Deduction
  if (vol24 === 0 && vol1h === 0) {
    score -= 400;
  }

  return Math.max(0, Math.min(1000, score));
}

// ============================================================================
// FINAL DEXHUNTER UNIFIED SCORING & TIER CLASSIFICATION
// ============================================================================

export function classifyToken(
  token: Partial<TokenPair>,
  mode: "trending" | "fresh_mints" | "latest" = "trending"
): QualityClassification {
  if (!token) {
    return {
      tier: "TIER_D",
      tierLabel: "Low Data",
      category: "LOW_METADATA",
      tokenQualityScore: 0,
      discoveryScore: 0,
      finalScore: 0,
      spamRisk: 500,
    };
  }

  const isEstablished = isExcludedTrendingAsset(token);
  const qualityScore = calculateTokenQualityScore(token);
  const discoveryScore = calculateDiscoveryScore(token, mode);
  const momentumScore = Number(token.momentumScore || 0);
  const spamRisk = calculateSpamRisk(token);

  // momentumScore is 0–100; quality/discovery are 0–1000. Scale ×10 so weights are comparable.
  let finalScore = Math.round(
    qualityScore * 0.45 + discoveryScore * 0.40 + momentumScore * 10 * 0.15 - spamRisk * 0.20
  );

  if (isEstablished) {
    finalScore = Math.max(0, finalScore - 500); // Deprioritize established assets in discovery
    return {
      tier: "TIER_E",
      tierLabel: "Base Asset",
      category: "ESTABLISHED_ASSET",
      tokenQualityScore: qualityScore,
      discoveryScore,
      finalScore,
      spamRisk,
    };
  }

  let tier: "TIER_A" | "TIER_B" | "TIER_C" | "TIER_D" = "TIER_C";
  let tierLabel = "Average";
  let category: "HIGH_QUALITY" | "EMERGING" | "AVERAGE" | "LOW_METADATA" | "LOW_ACTIVITY" = "AVERAGE";

  if (finalScore >= 650 && hasSocialLinks(token)) {
    tier = "TIER_A";
    tierLabel = "Top Discovery";
    category = "HIGH_QUALITY";
  } else if (finalScore >= 450) {
    tier = "TIER_B";
    tierLabel = "Emerging";
    category = "EMERGING";
  } else if (finalScore >= 250) {
    tier = "TIER_C";
    tierLabel = "Average";
    category = "AVERAGE";
  } else {
    tier = "TIER_D";
    tierLabel = "Low Activity";
    category = "LOW_ACTIVITY";
  }

  return {
    tier,
    tierLabel,
    category,
    tokenQualityScore: qualityScore,
    discoveryScore,
    finalScore,
    spamRisk,
  };
}

export function calculateFinalDexHunterScore(
  token: Partial<TokenPair>,
  mode: "trending" | "fresh_mints" | "latest" = "trending"
): number {
  return classifyToken(token, mode).finalScore;
}

// ============================================================================
// TOKEN METADATA & CANONICAL LOGO ENRICHMENT PIPELINE
// 1. Canonical Registry -> 2. Provider Valid Logo -> 3. Fallback CDN
// ============================================================================

export function enrichTokenMetadata(token: Partial<TokenPair>): Partial<TokenPair> {
  if (!token) return token;

  const chain = normalizeChainName(token.chainId);
  const address = token.baseToken?.address || token.pairAddress || "";
  const symbol = token.baseToken?.symbol || "";

  // 1. Canonical Registry Check
  const canonicalLogo = getCanonicalTokenLogo(chain, address, symbol);

  let existingImage = canonicalLogo || token.info?.imageUrl;
  if (!existingImage || existingImage.trim() === "" || existingImage === "null" || existingImage === "undefined") {
    if (address && chain) {
      existingImage = `https://dd.dexscreener.com/ds-data/tokens/${chain}/${address}.png`;
    }
  }

  const updatedInfo = {
    ...(token.info || {}),
    imageUrl: existingImage,
  };

  const classification = classifyToken(token);

  return {
    ...token,
    chainId: chain,
    info: updatedInfo,
    qualityClassification: classification.tier,
    dexHunterScore: classification.finalScore,
    qualityScore: classification.tokenQualityScore,
  } as any;
}

/**
 * Takes raw tokens from any provider, qualifies them through DexHunter scoring,
 * enriches logos and metadata, and sorts by final DexHunter discovery score.
 */
export function qualifyAndEnrichTrendingTokens(
  rawTokens: Partial<TokenPair>[],
  options: { allowSearchBypass?: boolean } = {}
): Partial<TokenPair>[] {
  if (!rawTokens || rawTokens.length === 0) return [];

  const qualified: Array<{ token: Partial<TokenPair>; score: number }> = [];

  for (const raw of rawTokens) {
    if (!raw) continue;

    if (options.allowSearchBypass) {
      const enriched = enrichTokenMetadata(raw);
      qualified.push({
        token: enriched,
        score: calculateFinalDexHunterScore(enriched, "trending"),
      });
      continue;
    }

    if (!isExcludedTrendingAsset(raw)) {
      const vol24 = Number(raw.volume?.h24 || (raw as any).totalVolume24h || 0);
      const vol1 = Number(raw.volume?.h1 || 0);
      const liq = Number(raw.liquidity?.usd || (raw as any).totalLiquidityUsd || 0);

      // Bonding-curve / Pump.fun tokens are exempt from vol/liq floors (no AMM pool yet)
      if (!isBondingCurveToken(raw)) {
        if (vol24 < 300 && vol1 === 0) continue;
        if (liq < 300 && vol24 < 500) continue;
      }

      const enriched = enrichTokenMetadata(raw);
      const score = calculateFinalDexHunterScore(enriched, "trending");
      qualified.push({
        token: enriched,
        score,
      });
    }
  }

  // Sort descending by DexHunter Final Score
  qualified.sort((a, b) => b.score - a.score);

  return qualified.map((q) => q.token);
}

// Backward-compatibility wrapper for qualifyTrendingToken
export function qualifyTrendingToken(token: Partial<TokenPair>) {
  if (!token) {
    return {
      isEligible: false,
      isExcluded: true,
      category: "unverified",
      reason: "Missing token data",
      discoveryScore: 0,
    };
  }

  const isExcluded = isExcludedTrendingAsset(token);
  if (isExcluded) {
    return {
      isEligible: false,
      isExcluded: true,
      category: "stablecoin",
      reason: "Excluded base asset, stablecoin, or mega-cap blue chip",
      discoveryScore: 0,
    };
  }

  const discoveryScore = calculateFinalDexHunterScore(token, "trending");

  return {
    isEligible: true,
    isExcluded: false,
    category: "discovery",
    discoveryScore,
  };
}

// ============================================================================
// SELF-TEST SUITE FOR TOKEN QUALIFICATION & ENRICHMENT
// ============================================================================

export function runTokenQualificationTests(): {
  allPassed: boolean;
  results: Array<{ test: string; passed: boolean; expected: any; actual: any }>;
} {
  const results: Array<{ test: string; passed: boolean; expected: any; actual: any }> = [];

  // Test 1: Ethereum WETH has Canonical Logo
  const ethWeth: Partial<TokenPair> = {
    chainId: "ethereum",
    baseToken: { address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", symbol: "WETH", name: "Wrapped Ether" },
  };
  const enrichedWeth = enrichTokenMetadata(ethWeth);
  const hasWethLogo = Boolean(enrichedWeth.info?.imageUrl && enrichedWeth.info.imageUrl.includes("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"));
  results.push({
    test: "Ethereum WETH -> Resolves canonical verified WETH logo",
    passed: hasWethLogo,
    expected: true,
    actual: hasWethLogo,
  });

  // Test 2: Ethereum USDT excluded from Trending
  const ethUsdt: Partial<TokenPair> = {
    chainId: "ethereum",
    baseToken: { address: "0xdac17f958d2ee523a2206206994597c13d831ec7", symbol: "USDT", name: "Tether USD" },
    marketCap: 112000000000,
    liquidity: { usd: 45000000 },
  };
  const q2 = isExcludedTrendingAsset(ethUsdt);
  results.push({
    test: "Ethereum USDT -> Excluded from Trending discovery feed",
    passed: q2 === true,
    expected: true,
    actual: q2,
  });

  // Test 3: Old Inactive token is penalized in quality & discovery
  const oldInactiveToken: Partial<TokenPair> = {
    chainId: "solana",
    baseToken: { address: "OldInactive1111111111111111111111111111111", symbol: "OLDDEAD", name: "Old Dead Token" },
    tokenAgeHours: 3000,
    volume: { h24: 50 },
    liquidity: { usd: 400 },
    info: { socials: [] },
  };
  const oldScore = calculateFinalDexHunterScore(oldInactiveToken);
  results.push({
    test: "Old inactive token with no socials -> Receives low score (pushed to bottom)",
    passed: oldScore < 200,
    expected: true,
    actual: oldScore < 200,
  });

  // Test 4: Fresh Active Emerging Token receives high score
  const freshActiveToken: Partial<TokenPair> = {
    chainId: "solana",
    baseToken: { address: "FreshActive1111111111111111111111111111111", symbol: "VIRAL", name: "Viral Token" },
    tokenAgeHours: 4,
    marketCap: 250000,
    volume: { h24: 180000 },
    liquidity: { usd: 45000 },
    info: {
      imageUrl: "https://dd.dexscreener.com/ds-data/tokens/solana/test.png",
      socials: [{ type: "twitter", url: "https://x.com/viral" }, { type: "telegram", url: "https://t.me/viral" }],
      websites: [{ type: "website", url: "https://viral.xyz" }],
    },
  };
  const freshScore = calculateFinalDexHunterScore(freshActiveToken);
  results.push({
    test: "Fresh active emerging token -> Receives High Tier A/B score",
    passed: freshScore >= 600,
    expected: true,
    actual: freshScore >= 600,
  });

  // Test 5: Fresh Mint on Pump.fun without socials remains discoverable
  const freshPumpMint: Partial<TokenPair> = {
    chainId: "solana",
    baseToken: { address: "PumpMint1111111111111111111111111111111111", symbol: "FRESH", name: "Fresh Pump Mint" },
    launchPlatform: "Pump.fun",
    tokenAgeHours: 1,
    volume: { h24: 5000 },
    liquidity: { usd: 2000 },
  };
  const mintScore = calculateDiscoveryScore(freshPumpMint, "fresh_mints");
  results.push({
    test: "Fresh Pump.fun mint -> Remains eligible and discoverable in Fresh Mints",
    passed: mintScore > 300,
    expected: true,
    actual: mintScore > 300,
  });

  const allPassed = results.every((r) => r.passed);
  return { allPassed, results };
}
