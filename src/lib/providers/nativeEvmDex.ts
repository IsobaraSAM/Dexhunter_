import { IDexHunterProvider } from "./types";
import { TokenPair } from "../../types";
import { normalizeChainName, getDexTradingUrl, normalizeDexName } from "../dexPriority";

// Network mapping from generic chain names to GeckoTerminal network identifiers
const GECKOTERMINAL_NETWORK_MAP: Record<string, string> = {
  ethereum: "eth",
  eth: "eth",
  base: "base",
  bsc: "bsc",
  arbitrum: "arbitrum",
  polygon: "polygon_pos",
  avalanche: "avax",
  cronos: "cronos",
};

// DEX query targets per chain for native DEX pool discovery
const NATIVE_DEX_SEARCH_TARGETS: Record<string, string[]> = {
  bsc: ["pancakeswap bsc", "pancakeswap wbnb", "thena bsc", "biswap"],
  base: ["aerodrome base", "uniswap base", "baseswap", "aerodrome weth"],
  ethereum: ["uniswap ethereum", "uniswap weth", "curve ethereum", "sushiswap"],
  arbitrum: ["camelot arbitrum", "uniswap arbitrum", "gmx arbitrum"],
  polygon: ["quickswap polygon", "uniswap polygon"],
  avalanche: ["traderjoe avalanche", "pangolin avalanche"],
  cronos: ["vvs finance cronos", "mm finance cronos"],
  robinhood: ["robinhood", "uniswap robinhood"],
};

async function fetchWithTimeout(url: string, timeoutMs = 6000, signal?: AbortSignal): Promise<any> {
  // GeckoTerminal does not send CORS headers. The browser call always fails
  // and only fills the console. The discovery index already covers those pools.
  if (typeof window !== "undefined" && (url.includes("geckoterminal.com") || url.includes("api.dexscreener.com"))) return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      return null;
    }
    signal.addEventListener("abort", onAbort, { once: true });
  }

  try {
    const res = await fetch(url, { 
      headers: { Accept: "application/json" },
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener("abort", onAbort);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener("abort", onAbort);
    return null;
  }
}

export class NativeEvmDexProvider implements IDexHunterProvider {
  name = "NativeEVM";
  private cache = new Map<string, { data: Partial<TokenPair>[]; timestamp: number }>();
  private CACHE_TTL_MS = 12000;
  private pancakeListCache: { tokens: any[]; timestamp: number } | null = null;

  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Fetch verified tokens from PancakeSwap's official extended token registry (BSC / Ethereum / Base)
   */
  async fetchPancakeSwapTokenList(signal?: AbortSignal): Promise<any[]> {
    if (this.pancakeListCache && Date.now() - this.pancakeListCache.timestamp < 120000) {
      return this.pancakeListCache.tokens;
    }
    try {
      const data = await fetchWithTimeout(
        "https://tokens.pancakeswap.finance/pancakeswap-extended.json",
        5000,
        signal
      );
      if (Array.isArray(data?.tokens)) {
        this.pancakeListCache = { tokens: data.tokens, timestamp: Date.now() };
        return data.tokens;
      }
    } catch {
      // Ignore fallback
    }
    return [];
  }

  /**
   * Convert a GeckoTerminal pool and its included entities into a normalized TokenPair
   */
  private parseGeckoTerminalPool(pool: any, included: any[], chainName: string): Partial<TokenPair> | null {
    try {
      const attrs = pool?.attributes;
      if (!attrs) return null;

      const baseTokenRelId = pool.relationships?.base_token?.data?.id;
      const dexRelId = pool.relationships?.dex?.data?.id;

      const tokenItem = included.find((i: any) => i.id === baseTokenRelId);
      const dexItem = included.find((i: any) => i.id === dexRelId);

      const tokenAttrs = tokenItem?.attributes || {};
      const dexAttrs = dexItem?.attributes || {};

      const address = tokenAttrs.address;
      if (!address) return null;
      const symbol = tokenAttrs.symbol || attrs.name?.split("/")?.[0]?.trim() || "TOKEN";
      const name = tokenAttrs.name || symbol;
      const dexName = dexAttrs.name || normalizeDexName(dexRelId || "dex");

      const priceUsd = attrs.base_token_price_usd ? String(attrs.base_token_price_usd) : undefined;
      const volume24h = attrs.volume_usd?.h24 ? Number(attrs.volume_usd.h24) : 0;
      const liquidityUsd = attrs.reserve_in_usd ? Number(attrs.reserve_in_usd) : 0;
      const fdv = attrs.fdv_usd ? Number(attrs.fdv_usd) : undefined;
      const marketCap = attrs.market_cap_usd ? Number(attrs.market_cap_usd) : fdv;

      const priceChange24h = attrs.price_change_percentage?.h24
        ? Number(attrs.price_change_percentage.h24)
        : 0;

      const pairAddress = attrs.address;
      const chainNorm = normalizeChainName(chainName);

      // Parse creation timestamp from GeckoTerminal attributes
      let pairCreatedAt: number | undefined;
      if (attrs.pool_created_at) {
        const parsed = new Date(attrs.pool_created_at).getTime();
        if (!isNaN(parsed) && parsed > 0) {
          pairCreatedAt = parsed;
        }
      }

      const partial: Partial<TokenPair> = {
        chainId: chainNorm,
        dexId: dexRelId || dexName.toLowerCase().replace(/[^a-z0-9]/g, ""),
        primaryDex: dexName,
        primaryProvider: `Native ${dexName}`,
        pairAddress,
        pairCreatedAt,
        baseToken: {
          address,
          name,
          symbol,
        },
        priceUsd,
        priceNative: attrs.base_token_price_native_currency ? String(attrs.base_token_price_native_currency) : undefined,
        marketCap,
        fdv,
        liquidity: {
          usd: liquidityUsd,
          base: 0,
          quote: 0,
        },
        volume: {
          h24: volume24h,
          h6: attrs.volume_usd?.h6 ? Number(attrs.volume_usd.h6) : 0,
          h1: attrs.volume_usd?.h1 ? Number(attrs.volume_usd.h1) : 0,
          m5: attrs.volume_usd?.m5 ? Number(attrs.volume_usd.m5) : 0,
        },
        priceChange: {
          h24: priceChange24h,
          h6: attrs.price_change_percentage?.h6 ? Number(attrs.price_change_percentage.h6) : 0,
          h1: attrs.price_change_percentage?.h1 ? Number(attrs.price_change_percentage.h1) : 0,
          m5: attrs.price_change_percentage?.m5 ? Number(attrs.price_change_percentage.m5) : 0,
        },
        txns: {
          h24: {
            buys: attrs.transactions?.h24?.buys || 0,
            sells: attrs.transactions?.h24?.sells || 0,
          },
          h1: {
            buys: attrs.transactions?.h1?.buys || 0,
            sells: attrs.transactions?.h1?.sells || 0,
          },
        },
        info: {
          imageUrl: tokenAttrs.image_url || undefined,
        },
        url: `https://geckoterminal.com/${chainNorm}/pools/${pairAddress}`,
      };

      // Add direct DEX trading link
      const directTradeUrl = getDexTradingUrl(partial, dexName);
      if (directTradeUrl) {
        partial.primaryDexTradingUrl = directTradeUrl;
      }

      return partial;
    } catch {
      return null;
    }
  }

  /**
   * Fetch native trending pools from GeckoTerminal for non-Solana EVM networks
   */
  async fetchGeckoTerminalTrending(chainName: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    const gtNet = GECKOTERMINAL_NETWORK_MAP[chainName.toLowerCase()];
    if (!gtNet) return [];

    try {
      const url = `https://api.geckoterminal.com/api/v2/networks/${gtNet}/trending_pools?include=base_token,dex`;
      const data = await fetchWithTimeout(url, 6000, signal);
      if (!data || !Array.isArray(data.data)) return [];

      const included = Array.isArray(data.included) ? data.included : [];
      const results: Partial<TokenPair>[] = [];

      for (const pool of data.data) {
        const parsed = this.parseGeckoTerminalPool(pool, included, chainName);
        if (parsed) results.push(parsed);
      }

      return results;
    } catch {
      return [];
    }
  }

  /**
   * Fetch newly created native pools from GeckoTerminal for non-Solana EVM networks
   */
  async fetchGeckoTerminalNewPools(chainName: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    const gtNet = GECKOTERMINAL_NETWORK_MAP[chainName.toLowerCase()];
    if (!gtNet) return [];

    try {
      const url = `https://api.geckoterminal.com/api/v2/networks/${gtNet}/new_pools?include=base_token,dex`;
      const data = await fetchWithTimeout(url, 6000, signal);
      if (!data || !Array.isArray(data.data)) return [];

      const included = Array.isArray(data.included) ? data.included : [];
      const results: Partial<TokenPair>[] = [];

      for (const pool of data.data) {
        const parsed = this.parseGeckoTerminalPool(pool, included, chainName);
        if (parsed) results.push(parsed);
      }

      return results;
    } catch {
      return [];
    }
  }

  /**
   * Fetch native DEX pairs directly through targeted DEX protocol queries
   * (e.g. PancakeSwap on BSC, Aerodrome on Base, Uniswap on Ethereum)
   */
  async fetchNativeDexPairs(chainName: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    const normChain = normalizeChainName(chainName);
    const queries = NATIVE_DEX_SEARCH_TARGETS[normChain] || [];
    if (queries.length === 0) return [];

    const tasks = queries.map((q) =>
      fetchWithTimeout(
        `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`,
        5500,
        signal
      )
    );

    const settled = await Promise.allSettled(tasks);
    const pairs: Partial<TokenPair>[] = [];

    for (const r of settled) {
      if (r.status === "fulfilled" && Array.isArray(r.value?.pairs)) {
        for (const p of r.value.pairs) {
          if (normalizeChainName(p.chainId) === normChain) {
            const h24Vol = Number(p.volume?.h24 || 0);
            const h1Vol = Number(p.volume?.h1 || 0);
            if (h24Vol < 300 && h1Vol === 0) continue;

            const dexName = normalizeDexName(p.dexId);
            const tradeUrl = getDexTradingUrl(p, dexName);
            pairs.push({
              ...p,
              primaryDex: dexName,
              primaryDexTradingUrl: tradeUrl || p.primaryDexTradingUrl || p.url,
              primaryProvider: `Native ${dexName}`,
            });
          }
        }
      }
    }

    return pairs;
  }

  async searchTokens(query: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    if (!query || !query.trim()) return [];
    const q = query.trim().toLowerCase();

    // Check PancakeSwap extended token list for BSC token symbols/names
    const pancakeTokens = await this.fetchPancakeSwapTokenList(signal);
    const matchedPancake = pancakeTokens.filter(
      (t: any) =>
        t.symbol?.toLowerCase().includes(q) ||
        t.name?.toLowerCase().includes(q) ||
        t.address?.toLowerCase() === q
    );

    if (matchedPancake.length > 0) {
      const topMatches = matchedPancake.slice(0, 5);
      const addresses = topMatches.map((t: any) => t.address).join(",");
      const res = await fetchWithTimeout(
        `https://api.dexscreener.com/latest/dex/tokens/${addresses}`,
        6000,
        signal
      );
      if (Array.isArray(res?.pairs)) {
        return res.pairs.map((p: any) => ({
          ...p,
          primaryProvider: this.name,
        }));
      }
    }

    return [];
  }

  async getTokenByAddress(address: string, chainId?: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    if (!address || !address.trim()) return [];
    const clean = address.trim();

    try {
      const res = await fetchWithTimeout(
        `https://api.dexscreener.com/latest/dex/tokens/${clean}`,
        6000,
        signal
      );
      if (Array.isArray(res?.pairs)) {
        const normChain = chainId ? normalizeChainName(chainId) : undefined;
        return res.pairs
          .filter((p: any) => !normChain || normChain === "all" || normalizeChainName(p.chainId) === normChain)
          .map((p: any) => ({
            ...p,
            primaryProvider: this.name,
          }));
      }
    } catch {
      // Fallback
    }

    return [];
  }

  async discoverTokens(
    _mode: "trending" | "latest",
    signal?: AbortSignal,
    chainId?: string,
    forceRefresh?: boolean
  ): Promise<Partial<TokenPair>[]> {
    const normChain = chainId ? normalizeChainName(chainId) : "all";
    const cacheKey = `native_evm:${_mode}:${normChain}`;

    if (forceRefresh) {
      this.cache.delete(cacheKey);
    } else {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
        return cached.data;
      }
    }

    const chainsToFetch = normChain === "all" 
      ? ["base", "bsc", "ethereum", "arbitrum", "polygon", "avalanche", "cronos"] 
      : [normChain];

    // Filter to supported EVM chains
    const validChains = chainsToFetch.filter(
      (c) => ["base", "bsc", "ethereum", "arbitrum", "polygon", "avalanche", "cronos"].includes(c)
    );

    if (validChains.length === 0) return [];

    const geckoFetcher = _mode === "latest"
      ? (c: string) => this.fetchGeckoTerminalNewPools(c, signal)
      : (c: string) => this.fetchGeckoTerminalTrending(c, signal);

    const tasks = validChains.flatMap((chain) => [
      this.fetchNativeDexPairs(chain, signal),
      geckoFetcher(chain),
    ]);

    const settled = await Promise.allSettled(tasks);
    let combined: Partial<TokenPair>[] = [];
    const fetchTime = Date.now();

    for (const r of settled) {
      if (r.status === "fulfilled" && Array.isArray(r.value)) {
        for (const p of r.value) {
          p.providerFetchTimestamp = fetchTime;
          combined.push(p);
        }
      }
    }

    // Running all four query terms per chain concurrently means genuine
    // overlap between them is possible, the same token surfacing under more
    // than one search term. Deduped here by chain and address so duplicate
    // work doesn't propagate downstream, even though the central aggregator
    // would eventually catch it too.
    const seen = new Set<string>();
    combined = combined.filter((p) => {
      const addr = (p.baseToken?.address || (p as any).address || "").toLowerCase();
      if (!addr) return true;
      const key = `${p.chainId || ""}:${addr}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Age filtering for latest mode is handled upstream by the user's own
    // filter selection now, not a hardcoded 48 hour cap baked into this
    // provider specifically. This was the third occurrence of the same
    // restriction already removed elsewhere.
    if (combined.length > 0) {
      this.cache.set(cacheKey, { data: combined, timestamp: Date.now() });
    }
    return combined;
  }
}
