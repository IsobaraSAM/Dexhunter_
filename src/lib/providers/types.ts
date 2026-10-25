import { TokenPair } from "../../types";

export interface IDexHunterProvider {
  name: string;
  searchTokens(query: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]>;
  getTokenByAddress(address: string, chainId?: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]>;
  discoverTokens(mode: "trending" | "latest", signal?: AbortSignal, chainId?: string, forceRefresh?: boolean): Promise<Partial<TokenPair>[]>;
}

export interface FetchOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}
