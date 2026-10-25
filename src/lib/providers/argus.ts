import { TokenPair } from "../../types";
import { IDexHunterProvider } from "./types";

export interface ArgusTelemetryStats {
  chainId: number;
  chainName: string;
  totalLaunches: number;
  portal8Count: number;
  portal7Count: number;
  reusedSocialsCount: number;
  safeDevBuyCount: number;
  status: string;
  message: string;
}

export class ArgusProvider implements IDexHunterProvider {
  public readonly name = "Argus Launchpad";
  public readonly isEnabled = true;

  private cachedTokens: TokenPair[] = [];
  private lastFetchTime = 0;
  private readonly CACHE_TTL_MS = 10_000;

  public async getLaunches(options?: {
    portal?: number;
    tier?: string;
    reusedOnly?: boolean;
    signal?: AbortSignal;
  }): Promise<TokenPair[]> {
    const now = Date.now();
    if (this.cachedTokens.length > 0 && now - this.lastFetchTime < this.CACHE_TTL_MS && !options?.portal && !options?.tier && !options?.reusedOnly) {
      return this.cachedTokens;
    }

    try {
      const queryParams = new URLSearchParams();
      if (options?.portal) queryParams.set("portal", options.portal.toString());
      if (options?.tier) queryParams.set("tier", options.tier);
      if (options?.reusedOnly) queryParams.set("reusedOnly", "true");

      const qs = queryParams.toString();
      const url = `/api/argus/launches${qs ? `?${qs}` : ""}`;

      const res = await fetch(url, { signal: options?.signal });
      if (!res.ok) return this.cachedTokens;

      const data = await res.json();
      if (Array.isArray(data.tokens)) {
        if (!options?.portal && !options?.tier && !options?.reusedOnly) {
          this.cachedTokens = data.tokens;
          this.lastFetchTime = now;
        }
        return data.tokens;
      }
      return this.cachedTokens;
    } catch {
      return this.cachedTokens;
    }
  }

  public async discoverTokens(
    _mode: "trending" | "latest",
    _signal?: AbortSignal,
    _chainId?: string,
    _forceRefresh?: boolean
  ): Promise<Partial<TokenPair>[]> {
    // Browse reads the prepared discovery pool, which already contains Arc launches.
    // Pulling every launch here serialized thousands of tokens on each refresh.
    return [];
  }

  public async searchTokens(query: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    if (!query) return [];
    try {
      const res = await fetch(`/api/argus/launches?q=${encodeURIComponent(query.trim())}&limit=40`, { signal });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data.tokens) ? data.tokens : [];
    } catch {
      return [];
    }
  }

  public async getTokenByAddress(address: string, _chainId?: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    if (!address) return [];
    try {
      const res = await fetch(`/api/argus/launches?address=${encodeURIComponent(address.trim())}&limit=5`, { signal });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data.tokens) ? data.tokens : [];
    } catch {
      return [];
    }
  }

  public async fetchStats(): Promise<ArgusTelemetryStats | null> {
    try {
      const res = await fetch("/api/argus/stats");
      if (!res.ok) return null;
      const data = await res.json();
      return data.stats || null;
    } catch {
      return null;
    }
  }
}

export const argusProvider = new ArgusProvider();
