/**
 * DexHunter × Argus Portal 8 Integration
 * Core Types & Interfaces
 */

/**
 * Protocol-neutral normalized launch object for DexHunter integration boundary.
 */
export interface ArgusPortal8Launch {
  chain: "arc";
  chainId: 5042;

  source: "argus";
  protocol: "argus-portal8";

  token: string;
  creator: string;

  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: string;

  logo?: string;

  website?: string;
  twitter?: string;
  telegram?: string;
  description?: string;

  quoteAsset?: string;
  hook?: string;
  escrow?: string;
  locker?: string;

  positionId?: string;
  tickStart?: number;
  tickBond?: number;
  tokenIsToken0?: boolean;

  launchedAt?: string;
  launchBlock?: number;
  totalFeeBps?: number;

  txHash: string;
  blockNumber: number;
  logIndex: number;
}

/**
 * Strongly typed raw Launched event from Portal 8 contract
 */
export interface Portal8RawLaunchedEvent {
  kind: "Launched";
  token: string;
  creator: string;
  hook: string;
  escrow: string;
  locker: string;
  positionId: bigint;
  tickStart: number;
  tickBond: number;
  txHash: string;
  blockNumber: number;
  logIndex: number;
  transactionIndex: number;
}

/**
 * Strongly typed raw LaunchMetadata event from Portal 8 contract
 */
export interface Portal8RawMetadataEvent {
  kind: "LaunchMetadata";
  token: string;
  imageURI: string;
  website: string;
  twitter: string;
  telegram: string;
  description: string;
  txHash: string;
  blockNumber: number;
  logIndex: number;
  transactionIndex: number;
}

export type DecodedPortal8Event = Portal8RawLaunchedEvent | Portal8RawMetadataEvent;

/**
 * On-chain return structure from Portal8.launches(address token)
 * Note: Does NOT return creator or quote asset.
 */
export interface Portal8LaunchOnChainData {
  hook: string;
  escrow: string;
  locker: string;
  positionId: bigint;
  tickStart: number;
  tickBond: number;
  tokenIsToken0: boolean;
}

/**
 * On-chain return structure from Hook reads
 */
export interface Portal8HookOnChainData {
  quoteAsset?: string;
  totalFeeBps?: number;
  launchedAt?: bigint;
  launchBlock?: bigint;
}

/**
 * Safe optional ERC20 / custom token reads
 */
export interface Portal8TokenOnChainData {
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: string;
  logo?: string;
}

/**
 * Aggregated hydration result combining on-chain data
 */
export interface Portal8HydratedData {
  launchData?: Portal8LaunchOnChainData;
  hookData?: Portal8HookOnChainData;
  tokenData?: Portal8TokenOnChainData;
}

/**
 * Cursor and State persistence interface
 */
export interface IPortal8StateStore {
  getCursor(): Promise<number | null>;
  setCursor(blockNumber: number): Promise<void>;

  getOrphanMetadata(tokenIdentity: string): Promise<Portal8RawMetadataEvent | null>;
  saveOrphanMetadata(tokenIdentity: string, meta: Portal8RawMetadataEvent): Promise<void>;
  removeOrphanMetadata(tokenIdentity: string): Promise<void>;

  getLaunch(tokenIdentity: string): Promise<ArgusPortal8Launch | null>;
  saveLaunch(tokenIdentity: string, launch: ArgusPortal8Launch): Promise<void>;

  isLogProcessed(logDedupeKey: string): Promise<boolean>;
  markLogProcessed(logDedupeKey: string): Promise<void>;
}

/**
 * Structured logger
 */
export interface Portal8Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: unknown, context?: Record<string, unknown>): void;
}

/**
 * Watcher Configuration
 */
export interface Portal8WatcherConfig {
  /** RPC URLs with automatic rotation and fallback */
  rpcUrls: string[];
  /** Expected chain ID (5042 for Arc) */
  chainId?: number;
  /** Genesis / start block for Portal 8 (defaults to 22_251_758) */
  startBlock?: number;
  /** Number of block confirmations to wait before processing (defaults to 1) */
  confirmations?: number;
  /** Polling interval in milliseconds (defaults to 2000) */
  pollIntervalMs?: number;
  /** Initial and maximum log chunk size (defaults to 2000) */
  maxChunkSize?: number;
  /** Minimum chunk size during adaptive reduction (defaults to 100) */
  minChunkSize?: number;
  /** Maximum retry attempts per RPC call (defaults to 3) */
  maxRetries?: number;
  /** Base retry delay in milliseconds (defaults to 500) */
  retryDelayMs?: number;
  /** Custom logger */
  logger?: Portal8Logger;
}

/**
 * Integration sink interface for DexHunter consumers
 */
export interface IPortal8LaunchSink {
  /** Called when a new token launch is discovered and normalized */
  onLaunch(launch: ArgusPortal8Launch): Promise<void>;
  /** Called when metadata arrives for an already-discovered launch */
  onMetadataUpdate?(launch: ArgusPortal8Launch): Promise<void>;
  /** Called when a non-fatal error occurs during processing */
  onError?(error: Error, context?: Record<string, unknown>): Promise<void>;
}

/**
 * Custom Error Classes
 */
export class ChainIdMismatchError extends Error {
  constructor(public readonly expected: number, public readonly received: number) {
    super(`Arc RPC chainId mismatch: expected ${expected}, got ${received}`);
    this.name = "ChainIdMismatchError";
  }
}

export class RpcExhaustionError extends Error {
  constructor(message: string, public readonly lastError?: unknown) {
    super(`All configured Arc RPC endpoints failed: ${message}`);
    this.name = "RpcExhaustionError";
  }
}

export class DecodeError extends Error {
  constructor(message: string, public readonly rawLog?: unknown) {
    super(`Portal 8 event decode error: ${message}`);
    this.name = "DecodeError";
  }
}

export class HydrationError extends Error {
  constructor(message: string, public readonly tokenAddress: string) {
    super(`Portal 8 on-chain hydration error for ${tokenAddress}: ${message}`);
    this.name = "HydrationError";
  }
}
