export interface NormalizedPair {
  chainId: string;
  dexId: string;
  dexName: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken?: {
    address: string;
    name: string;
    symbol: string;
  };
  price?: string | number;
  priceUsd?: string;
  priceNative?: string;
  liquidity?: number;
  liquidityUsd?: number;
  volume24h?: number;
  priceChange24h?: number;
  url?: string;
  pairCreatedAt?: number;
  source?: string;
}

export interface TokenPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd?: string;
  txns?: {
    m5?: { buys: number; sells: number };
    h1?: { buys: number; sells: number };
    h6?: { buys: number; sells: number };
    h24?: { buys: number; sells: number };
  };
  volume?: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
  };
  volumeComplete?: boolean;
  priceChange?: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
  };
  liquidity?: {
    usd?: number;
    base?: number;
    quote?: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    description?: string;
    websites?: Array<{ type: string; label?: string; url: string }>;
    socials?: Array<{ type: string; url: string }>;
  };
  // Direct social links & metadata
  description?: string;
  telegram?: string;
  twitter?: string;
  website?: string;
  discord?: string;
  links?: any;
  socials?: any;
  extensions?: any;
  attributes?: any;
  // Aggregation & DEX Selection fields
  primaryDex?: string | null;       // Representative primary DEX chosen by chain priority & alphabetical fallback
  primaryDexLogo?: string | null;   // Direct high-res logo URL for primary DEX
  primaryDexTradingUrl?: string | null; // Direct trading page URL for token on primary DEX
  launchPlatform?: string | null;   // Launch platform (e.g. "Pump.fun") distinct from primary DEX
  dexes?: string[];                 // List of all unique normalized DEX names (e.g., ["PumpSwap", "Raydium", "Meteora"])
  pairs?: NormalizedPair[];         // Underlying distinct trading pairs discovered across all sources
  highestLiquidityPair?: NormalizedPair; // Signal: pair with largest liquidity
  highestVolumePair?: NormalizedPair;    // Signal: pair with largest 24h volume
  sources?: string[];               // List of DEXes/Launchpads where token was detected
  allPairs?: TokenPair[];           // Underlying duplicate listings merged into this canonical entry
  totalLiquidityUsd?: number;       // Combined aggregated liquidity across sources
  totalVolume24h?: number;          // Combined 24h volume across sources
  tokenAgeHours?: number;           // Calculated token age in hours
  // Freshness & Provenance Timestamps
  sourceTimestamp?: number;         // Original timestamp from source DEX/feed
  lastActivityTimestamp?: number;   // Timestamp of latest known trade or activity
  providerFetchTimestamp?: number;  // Timestamp when the upstream provider responded
  refreshTimestamp?: number;        // Timestamp when DEXHUNTER aggregated/refreshed this record
  discoveredAt?: number;            // Timestamp when first observed in this session
  firstSeenAt?: number;             // First time this token entered the index
  scoreBreakdown?: {
    total: number;
    volumeScore?: number;
    liquidityScore?: number;
    recentScore?: number;
    volume24h?: number;
    liquidityUsd?: number;
  };
  liquidityScore?: number;          // 0-100 calculated score
  momentumScore?: number;           // 0-100 calculated momentum score
  isContractVerified?: boolean;     // Contract verification flag
  isWebsiteVerified?: boolean;      // Verified website status
  buySellRatio24h?: number;         // 24h buy/sell ratio
  primaryProvider?: string;         // First or primary provider that reported the token
  // Direct On-Chain Pump.fun Bonding Curve state
  bondingCurvePda?: string;         // Derived on-chain bonding curve PDA
  bondingProgress?: number;         // 0-100% bonding curve graduation progress
  isBondingCurve?: boolean;         // True if token is pre-migration on bonding curve
  isGraduated?: boolean;            // True if bonding curve completed / graduated
  complete?: boolean;               // On-chain bonding curve completion flag
  pumpSwapPool?: string | null;     // PumpSwap AMM pool address
  pumpswap_pool?: string | null;    // PumpSwap AMM pool address alias
  marketStage?: "bonding_curve" | "graduated" | "pumpswap" | "raydium";
  creator?: string;                 // Token creator address
  realSolReservesFormatted?: string;// Real SOL reserves on-chain
  virtualTokenReserves?: string;
  virtualSolReserves?: string;
  realTokenReserves?: string;
  realSolReserves?: string;
  tokenTotalSupply?: string;
  // Direct On-Chain Argus Launchpad (Arc Mainnet 5042)
  isArgusLaunch?: boolean;
  isPonsLaunch?: boolean;
  argusPortalId?: number;           // 7, 8, etc.
  argusPortalFamily?: "v4" | "v8" | "v3";
  argusPortalAddress?: string;
  argusLockerAddress?: string;
  argusHookAddress?: string;
  argusSplitterAddress?: string;
  argusPoolId?: string;
  argusPositionId?: string;
  argusBuyTaxBps?: number;
  argusSellTaxBps?: number;
  argusBaseFeeBps?: number;
  argusTotalFeeBps?: number;
  argusSnipeTaxBps?: number;
  argusLiquidityLocked?: boolean;
  argusLockTimestamp?: number;
  argusDevBuyUsdc?: number;
  argusDevBuyPct?: number;
  argusDevBuyTier?: "safe" | "moderate" | "high_snipe" | "zero";
  argusDevBuyNote?: string;
  argusReusedSocials?: {
    hasReusedSocials: boolean;
    reusedTelegram?: boolean;
    reusedTwitter?: boolean;
    duplicateCount?: number;
    matchedTokens?: Array<{ name: string; symbol: string; address: string; date?: string }>;
    warningMessage?: string;
  };
}

export interface FilterOptions {
  selectedChain: string;
  selectedDex: string;
  minLiquidity: string;
  maxLiquidity: string;
  minMarketCap: string;
  maxMarketCap: string;
  minVolume: string;
  maxVolume: string;
  maxAgeHours: string;
  hasWebsite: boolean;
  hasX: boolean;
  hasTelegram: boolean;
  sortBy: "liquidity" | "volume" | "marketCap" | "age" | "gainers" | "momentum";
}

export interface SearchResponse {
  schemaVersion: string;
  pairs: TokenPair[] | null;
}

export interface TokenBoost {
  url: string;
  chainId: string;
  tokenAddress: string;
  amount: number;
  totalAmount: number;
  icon?: string;
  header?: string;
  description?: string;
  links?: Array<{ type: string; label?: string; url: string }>;
}

export interface TokenProfile {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon?: string;
  header?: string;
  description?: string;
  links?: Array<{ type: string; label?: string; url: string }>;
}

// Canonical separated sub-interfaces for data model modularity
export interface TokenIdentity {
  address: string;
  chainId: string;
  name: string;
  symbol: string;
  decimals?: number;
  creator?: string;
  imageUrl?: string;
  description?: string;
  websites?: Array<{ type: string; label?: string; url: string }>;
  socials?: Array<{ type: string; url: string }>;
}

export interface MarketState {
  priceUsd: number;
  priceNative?: string;
  marketCap: number;
  fdv: number;
  volume24h: number;
  liquidityUsd: number;
  priceChange24h?: number;
  priceChange1h?: number;
  priceChange5m?: number;
  txns24h?: { buys: number; sells: number };
}

export interface PoolVenue {
  poolAddress: string;
  dexId: string;
  dexName: string;
  chainId: string;
  tradingUrl?: string;
  liquidityUsd?: number;
  volume24h?: number;
  createdAt?: number;
}

export interface DiscoveryStats {
  totalIndexed: number;
  recordsToday: number;
  throughputPerMin: number;
  byChain: Record<string, number>;
  byDex: Record<string, number>;
  lastUpdated: number;
  uptimeSeconds: number;
}

