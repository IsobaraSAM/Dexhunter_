export const PUMP_PROGRAM_ID_STR = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
export const PUMP_AMM_PROGRAM_ID_STR = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";
export const METAPLEX_PROGRAM_ID_STR = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
export const SOL_MINT_STR = "So11111111111111111111111111111111111111112";

// Bonding curve initial mathematical parameters according to official Pump protocol
export const PUMP_INITIAL_REAL_TOKEN_RESERVES = 793_100_000_000_000n; // 793.1M tokens (6 decimals)
export const PUMP_TOTAL_SUPPLY = 1_000_000_000_000_000n; // 1B tokens (6 decimals)
export const PUMP_INITIAL_VIRTUAL_TOKEN_RESERVES = 1_073_000_000_000_000n;
export const PUMP_INITIAL_VIRTUAL_SOL_RESERVES = 30_000_000_000n; // 30 SOL (9 decimals)

export type PumpResolutionStatus =
  | "FOUND_BONDING_CURVE"
  | "FOUND_GRADUATED"
  | "FOUND_PUMPSWAP_ACTIVE"
  | "NOT_PUMPFUN_BONDING_CURVE"
  | "INVALID_MINT"
  | "RPC_ERROR"
  | "DECODE_ERROR"
  | "STREAM_ERROR";

export interface PumpOnChainState {
  mint: string;
  bondingCurvePda: string;
  owner: string;
  virtualTokenReserves: string;
  virtualSolReserves: string;
  realTokenReserves: string;
  realSolReserves: string;
  tokenTotalSupply: string;
  complete: boolean;
  bondingProgress: number; // 0 - 100%
  spotPriceSol: string;
  spotPriceUsd: string;
  fdvSol: number;
  fdvUsd: number;
  marketCapUsd: number;
  liquidityUsd?: number;
  solUsdPrice?: number;
  realSolReservesFormatted: string;
  creator?: string;
  tokenName?: string;
  tokenSymbol?: string;
  metadataUri?: string;
  imageUrl?: string;
  description?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  volume24h?: number;
  priceChange24h?: number;
  createdAt?: number;
  created_timestamp?: number;
  lastRefreshedAt?: number;
  pumpSwapPool?: string | null;
  pumpswap_pool?: string | null;
  pumpSwapPoolVerified?: boolean;
  pairAddress?: string;
  pairs?: any[];
  migrationState?: "NOT_READY" | "MIGRATION_PENDING" | "MIGRATED" | "NOT_APPLICABLE";
  marketStage: "bonding_curve" | "graduated" | "graduated_pending" | "pumpswap" | "raydium";
  isBondingCurve: boolean;
  isGraduated: boolean;
  dexId?: string;
  primaryDex?: string;
  sources?: string[];
  dexes?: string[];
}

export interface PumpResolveResult {
  status: PumpResolutionStatus;
  mint: string;
  token?: PumpOnChainState;
  error?: string;
  diagnostics?: {
    validAddress: boolean;
    derivedPda: string;
    rpcFound: boolean;
    programOwner?: string;
    decodeSuccess: boolean;
    complete?: boolean;
    bondingProgress?: number;
    finalStatus: string;
  };
}
