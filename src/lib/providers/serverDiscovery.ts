import { TokenPair, DiscoveryStats } from "../../types";
import { IDexHunterProvider } from "./types";
import { normalizeChainName } from "../dexPriority";
import { matchesUserQuery } from "../addressQuery.js";

const preparedCache = new Map<string, { at: number; data: TokenPair[] }>();
const preparedInflight = new Map<string, Promise<TokenPair[]>>();
const PREPARED_TTL_MS = 8_000;

export function clearPreparedPoolCache(): void {
  preparedCache.clear();
  preparedInflight.clear();
}

/** One in-flight read of the already-built server pool. Browse views share this. */
export async function fetchPreparedPool(
  mode: "trending" | "latest" | "fresh_mints",
  chainId?: string,
  limit = 2000,
  _signal?: AbortSignal,
  fresh = false
): Promise<TokenPair[]> {
  const chain = !chainId || chainId === "all" ? "all" : normalizeChainName(chainId);
  const key = `${mode}|${chain}|${limit}`;
  if (!fresh) {
    const hit = preparedCache.get(key);
    if (hit && Date.now() - hit.at < PREPARED_TTL_MS) return hit.data;
    const pending = preparedInflight.get(key);
    if (pending) return pending;
  }

  const run = (async () => {
    // Do not bind this shared request to one caller's AbortSignal.
    // A background poll aborting would cancel the foreground paint too.
    const chainParam = chain !== "all" ? `&chain=${encodeURIComponent(chain)}` : "";
    const res = await fetch(`/api/discovery?mode=${mode}&limit=${limit}${chainParam}&shape=browse`, {
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) {
      throw new Error(`Discovery feed failed (${res.status})`);
    }
    const data = await res.json();
    const tokens = Array.isArray(data.tokens) ? (data.tokens as TokenPair[]) : [];
    if (tokens.length > 0) preparedCache.set(key, { at: Date.now(), data: tokens });
    return tokens;
  })().finally(() => {
    preparedInflight.delete(key);
  });
  preparedInflight.set(key, run);
  return run;
}

export type DiscoveryPage = {
  tokens: TokenPair[];
  total: number;
  nextCursor: string | null;
};

function boundParam(name: string, value: number | "" | undefined): string {
  if (value === "" || value == null || !Number.isFinite(value)) return "";
  return `&${name}=${encodeURIComponent(String(value))}`;
}

function flagParam(name: string, value: boolean | undefined): string {
  return value ? `&${name}=1` : "";
}

/** One page of the index. Not cached: age and cursor must not reuse the week pool. */
export async function fetchDiscoveryPage(opts: {
  mode: "trending" | "latest" | "fresh_mints";
  chainId?: string;
  dex?: string;
  age?: string;
  cursor?: string | null;
  limit?: number;
  minLiquidity?: number | "";
  maxLiquidity?: number | "";
  minVolume?: number | "";
  maxVolume?: number | "";
  minMarketCap?: number | "";
  maxMarketCap?: number | "";
  minPriceChange?: number | "";
  telegram?: boolean;
  twitter?: boolean;
  discord?: boolean;
  website?: boolean;
  verified?: boolean;
  xProfile?: boolean;
  xPost?: boolean;
}): Promise<DiscoveryPage> {
  const chain = !opts.chainId || opts.chainId === "all" ? "" : String(opts.chainId);
  const chainParam = chain ? `&chain=${encodeURIComponent(chain)}` : "";
  const dex = !opts.dex || opts.dex === "all" ? "" : String(opts.dex);
  const dexParam = dex ? `&dex=${encodeURIComponent(dex)}` : "";
  const cursorParam = opts.cursor ? `&cursor=${encodeURIComponent(opts.cursor)}` : "";
  const age = opts.age || "1w";
  const limit = opts.limit ?? 500;
  const res = await fetch(
    `/api/discovery?mode=${opts.mode}&limit=${limit}&age=${encodeURIComponent(age)}${chainParam}${dexParam}${cursorParam}` +
      `${boundParam("minLiquidity", opts.minLiquidity)}${boundParam("maxLiquidity", opts.maxLiquidity)}` +
      `${boundParam("minVolume", opts.minVolume)}${boundParam("maxVolume", opts.maxVolume)}` +
      `${boundParam("minMarketCap", opts.minMarketCap)}${boundParam("maxMarketCap", opts.maxMarketCap)}` +
      `${boundParam("minPriceChange", opts.minPriceChange)}` +
      `${flagParam("telegram", opts.telegram)}${flagParam("twitter", opts.twitter)}` +
      `${flagParam("discord", opts.discord)}${flagParam("website", opts.website)}${flagParam("verified", opts.verified)}` +
      `${flagParam("xProfile", opts.xProfile)}${flagParam("xPost", opts.xPost)}&shape=browse`,
    { signal: AbortSignal.timeout(20000) }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.error === "string" ? data.error : `Discovery feed failed (${res.status})`);
  }
  return {
    tokens: Array.isArray(data.tokens) ? (data.tokens as TokenPair[]) : [],
    total: typeof data.total === "number" ? data.total : 0,
    nextCursor: typeof data.nextCursor === "string" && data.nextCursor ? data.nextCursor : null,
  };
}

export function appendUniqueTokens<T extends { chainId?: string; baseToken?: { address?: string }; pairAddress?: string }>(
  prev: T[],
  incoming: T[]
): T[] {
  if (!incoming.length) return prev;
  const seen = new Set(
    prev.map((item) => `${item.chainId || ""}:${item.baseToken?.address || item.pairAddress || ""}`.toLowerCase())
  );
  const extra: T[] = [];
  for (const item of incoming) {
    const key = `${item.chainId || ""}:${item.baseToken?.address || item.pairAddress || ""}`.toLowerCase();
    if (!key.endsWith(":") && seen.has(key)) continue;
    seen.add(key);
    extra.push(item);
  }
  return extra.length ? [...prev, ...extra] : prev;
}

export async function lookupIndexedAddress(
  address: string,
  chainId?: string,
  signal?: AbortSignal
): Promise<{ tokens: TokenPair[]; message: string | null; ambiguous: boolean }> {
  const query = address.trim();
  if (!query) return { tokens: [], message: "Enter a contract or mint address.", ambiguous: false };
  const chain = !chainId || chainId === "all" ? "all" : normalizeChainName(chainId);
  const chainParam = chain !== "all" ? `&chain=${encodeURIComponent(chain)}` : "";
  try {
    const res = await fetch(`/api/discovery?address=${encodeURIComponent(query)}${chainParam}&shape=browse`, {
      signal: signal ?? AbortSignal.timeout(12000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { tokens: [], message: typeof data?.error === "string" ? data.error : "Address lookup failed.", ambiguous: false };
    }
    return {
      tokens: Array.isArray(data.tokens) ? (data.tokens as TokenPair[]) : [],
      message: typeof data.message === "string" ? data.message : null,
      ambiguous: data.ambiguous === true,
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw err;
    return { tokens: [], message: "Address lookup did not finish. Try again.", ambiguous: false };
  }
}

export async function searchLiveMarkets(query: string, signal?: AbortSignal): Promise<TokenPair[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const res = await fetch(`/api/discovery?q=${encodeURIComponent(q)}&shape=browse`, {
      signal: signal ?? AbortSignal.timeout(12000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return [];
    return Array.isArray(data.tokens) ? (data.tokens as TokenPair[]) : [];
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw err;
    return [];
  }
}

export class ServerDiscoveryProvider implements IDexHunterProvider {
  public readonly name = "DexHunter Server Indexer";
  public readonly isEnabled = true;

  public async getTrending(chainId?: string, limit: number = 2000): Promise<TokenPair[]> {
    try {
      return await fetchPreparedPool("trending", chainId, limit);
    } catch (err) {
      console.warn("[ServerDiscoveryProvider] getTrending error:", err);
      return [];
    }
  }

  public async getLatest(chainId?: string, limit: number = 2000): Promise<TokenPair[]> {
    try {
      return await fetchPreparedPool("latest", chainId, limit);
    } catch (err) {
      console.warn("[ServerDiscoveryProvider] getLatest error:", err);
      return [];
    }
  }

  public async getFreshMints(limit: number = 2000): Promise<TokenPair[]> {
    try {
      return await fetchPreparedPool("fresh_mints", undefined, limit);
    } catch (err) {
      console.warn("[ServerDiscoveryProvider] getFreshMints error:", err);
      return [];
    }
  }

  public async search(query: string, chainId?: string): Promise<TokenPair[]> {
    if (!query) return [];
    try {
      const allTokens = await this.getLatest(chainId, 5000);
      return allTokens.filter((t) => matchesUserQuery(t, query));
    } catch (err) {
      console.warn("[ServerDiscoveryProvider] search error:", err);
      return [];
    }
  }

  public async discoverTokens(
    mode: "trending" | "latest",
    _signal?: AbortSignal,
    chainId?: string,
    _forceRefresh?: boolean
  ): Promise<Partial<TokenPair>[]> {
    if (mode === "latest") {
      return this.getLatest(chainId);
    }
    return this.getTrending(chainId);
  }

  public async searchTokens(query: string, _signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    return this.search(query);
  }

  public async getTokenByAddress(address: string, chainId?: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    const looked = await lookupIndexedAddress(address, chainId, signal);
    return looked.tokens;
  }

  public async fetchTelemetry(): Promise<DiscoveryStats | null> {
    try {
      const res = await fetch("/api/discovery/stats");
      if (!res.ok) return null;
      const data = await res.json();
      return data.stats || null;
    } catch {
      return null;
    }
  }
}

export const serverDiscoveryProvider = new ServerDiscoveryProvider();
