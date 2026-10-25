import { IDexHunterProvider } from "./types";
import { TokenPair, NormalizedPair } from "../../types";
import {
  normalizeChainName,
  getDexTradingUrl,
  normalizeDexName,
  getDexLogo,
} from "../dexPriority";

// Known Solana Quote Mints for Base/Quote separation
const SOLANA_QUOTE_MINTS = new Set([
  "so11111111111111111111111111111111111111112", // WSOL
  "epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v", // USDC
  "es9vmfrzacerrmjfrf4h2fyd4kconky11mcce8benwny", // USDT
  "es9vmfrzacerrmjfrf4h2fyd4kconky11mcce8benwnyb", // USDT
  "usdh1sm1ojcxkgzsq8mdtxgiqxdcntnhntfhnmmtz2w", // USDH
  "usdswr9apdhk5bvjkmjzff41tptr8auuhqgydqiskpt", // USDS
  "jupyiwryjfskupiha7hker8vutaefosybkedznsdvcn", // JUP
]);

async function fetchWithTimeout(
  url: string,
  timeoutMs = 6000,
  signal?: AbortSignal,
  headers?: Record<string, string>
): Promise<any> {
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
      headers: {
        Accept: "application/json",
        ...(headers || {}),
      },
      signal: controller.signal,
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

/**
 * Dedicated Solana Multi-DEX Discovery & Token Provider
 * Covers: Meteora DLMM, Orca Whirlpools, Raydium, PumpSwap, Lifinity, Phoenix, OpenBook, Manifest
 */
export class SolanaDexProvider implements IDexHunterProvider {
  name = "SolanaDEX";
  private cache = new Map<string, { data: Partial<TokenPair>[]; timestamp: number }>();
  private CACHE_TTL_MS = 12000;
  private orcaPoolsCache: { pools: any[]; timestamp: number } | null = null;

  clearCache(): void {
    this.cache.clear();
  }

  // =========================================================================
  // 1. METEORA DLMM DIRECT DISCOVERY & LOOKUP
  // =========================================================================
  private parseMeteoraPool(pool: any): Partial<TokenPair> | null {
    try {
      if (!pool || !pool.address || !pool.token_x || !pool.token_y) return null;
      const addrX = (pool.token_x.address || "").toLowerCase();
      const addrY = (pool.token_y.address || "").toLowerCase();

      // Determine base vs quote
      const xIsQuote = SOLANA_QUOTE_MINTS.has(addrX);
      const yIsQuote = SOLANA_QUOTE_MINTS.has(addrY);

      let baseObj = pool.token_x;
      let quoteObj = pool.token_y;

      if (xIsQuote && !yIsQuote) {
        baseObj = pool.token_y;
        quoteObj = pool.token_x;
      } else if (!xIsQuote && yIsQuote) {
        baseObj = pool.token_x;
        quoteObj = pool.token_y;
      }

      const baseAddress = baseObj.address;
      if (!baseAddress) return null;

      const tvl = Number(pool.tvl || 0);
      const vol24h = Number(pool.volume?.["24h"] || pool.volume?.h24 || 0);
      const priceNative = pool.current_price ? String(pool.current_price) : undefined;
      const createdAtRaw = pool.created_at ? Number(pool.created_at) : undefined;
      const createdAt = createdAtRaw ? (createdAtRaw < 10000000000 ? createdAtRaw * 1000 : createdAtRaw) : undefined;

      const pair: Partial<TokenPair> = {
        chainId: "solana",
        dexId: "meteora",
        primaryDex: "Meteora",
        primaryProvider: "Meteora DLMM",
        pairAddress: pool.address,
        baseToken: {
          address: baseAddress,
          name: baseObj.name || baseObj.symbol || "Token",
          symbol: baseObj.symbol || "TOKEN",
        },
        quoteToken: {
          address: quoteObj.address || "So11111111111111111111111111111111111111112",
          name: quoteObj.name || "Wrapped SOL",
          symbol: quoteObj.symbol || "SOL",
        },
        priceNative,
        liquidity: {
          usd: tvl,
          base: 0,
          quote: 0,
        },
        totalLiquidityUsd: tvl,
        volume: {
          h24: vol24h,
        },
        totalVolume24h: vol24h,
        pairCreatedAt: createdAt,
        url: `https://app.meteora.ag/dlmm/${pool.address}`,
        primaryDexTradingUrl: `https://app.meteora.ag/dlmm/${pool.address}`,
        sources: ["Meteora"],
      };

      return pair;
    } catch {
      return null;
    }
  }

  async fetchMeteoraPools(mode: "trending" | "latest", signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    try {
      const sortKey = mode === "latest" ? "created_at" : "volume";
      const url = `https://dlmm.datapi.meteora.ag/pools?limit=25&sort_key=${sortKey}&order_by=desc`;
      const json = await fetchWithTimeout(url, 5000, signal);
      if (!json || !Array.isArray(json.data)) return [];

      const results: Partial<TokenPair>[] = [];
      for (const p of json.data) {
        const parsed = this.parseMeteoraPool(p);
        if (parsed) results.push(parsed);
      }
      if (mode === "latest") {
        results.sort((a, b) => (Number(b.pairCreatedAt) || 0) - (Number(a.pairCreatedAt) || 0));
      }
      return results;
    } catch {
      return [];
    }
  }

  async searchMeteoraPools(query: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    try {
      const url = `https://dlmm.datapi.meteora.ag/pools?search=${encodeURIComponent(query)}`;
      const json = await fetchWithTimeout(url, 5000, signal);
      if (!json || !Array.isArray(json.data)) return [];

      const results: Partial<TokenPair>[] = [];
      for (const p of json.data) {
        const parsed = this.parseMeteoraPool(p);
        if (parsed) results.push(parsed);
      }
      return results;
    } catch {
      return [];
    }
  }

  // =========================================================================
  // 2. ORCA WHIRLPOOLS DIRECT DISCOVERY & LOOKUP
  // =========================================================================
  private async getOrcaWhirlpoolList(signal?: AbortSignal): Promise<any[]> {
    if (this.orcaPoolsCache && Date.now() - this.orcaPoolsCache.timestamp < 60000) {
      return this.orcaPoolsCache.pools;
    }
    try {
      const url = "https://api.mainnet.orca.so/v1/whirlpool/list";
      const json = await fetchWithTimeout(url, 5000, signal);
      if (json && Array.isArray(json.whirlpools)) {
        this.orcaPoolsCache = { pools: json.whirlpools, timestamp: Date.now() };
        return json.whirlpools;
      }
    } catch {
      // Fall through to empty
    }
    return [];
  }

  private parseOrcaPool(pool: any): Partial<TokenPair> | null {
    try {
      if (!pool || !pool.address || !pool.tokenA || !pool.tokenB) return null;
      const mintA = (pool.tokenA.mint || "").toLowerCase();
      const mintB = (pool.tokenB.mint || "").toLowerCase();

      const aIsQuote = SOLANA_QUOTE_MINTS.has(mintA);
      const bIsQuote = SOLANA_QUOTE_MINTS.has(mintB);

      let baseObj = pool.tokenA;
      let quoteObj = pool.tokenB;

      if (aIsQuote && !bIsQuote) {
        baseObj = pool.tokenB;
        quoteObj = pool.tokenA;
      } else if (!aIsQuote && bIsQuote) {
        baseObj = pool.tokenA;
        quoteObj = pool.tokenB;
      }

      const baseAddress = baseObj.mint;
      if (!baseAddress) return null;

      const tvl = Number(pool.tvl || 0);
      const vol24h = Number(pool.volume?.day || 0);
      const priceNative = pool.price ? String(pool.price) : undefined;

      const pair: Partial<TokenPair> = {
        chainId: "solana",
        dexId: "orca",
        primaryDex: "Orca",
        primaryProvider: "Orca Whirlpools",
        pairAddress: pool.address,
        baseToken: {
          address: baseAddress,
          name: baseObj.name || baseObj.symbol || "Token",
          symbol: baseObj.symbol || "TOKEN",
        },
        quoteToken: {
          address: quoteObj.mint || "So11111111111111111111111111111111111111112",
          name: quoteObj.name || "Wrapped SOL",
          symbol: quoteObj.symbol || "SOL",
        },
        priceNative,
        liquidity: {
          usd: tvl,
          base: 0,
          quote: 0,
        },
        totalLiquidityUsd: tvl,
        volume: {
          h24: vol24h,
        },
        totalVolume24h: vol24h,
        info: {
          imageUrl: baseObj.logoURI || undefined,
        },
        url: "https://www.orca.so/pools",
        primaryDexTradingUrl: "https://www.orca.so/pools",
        sources: ["Orca"],
      };

      return pair;
    } catch {
      return null;
    }
  }

  async fetchOrcaPools(mode: "trending" | "latest", signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    try {
      const whirlpools = await this.getOrcaWhirlpoolList(signal);
      if (whirlpools.length === 0) return [];

      const sorted = [...whirlpools].sort((a, b) => {
        if (mode === "latest") {
          const aT = Number(a.createdAt || a.created_at || a.openTime || 0);
          const bT = Number(b.createdAt || b.created_at || b.openTime || 0);
          return bT - aT;
        }
        return (Number(b.volume?.day) || 0) - (Number(a.volume?.day) || 0);
      });

      const results: Partial<TokenPair>[] = [];
      for (const p of sorted.slice(0, 25)) {
        const parsed = this.parseOrcaPool(p);
        if (parsed) results.push(parsed);
      }
      return results;
    } catch {
      return [];
    }
  }

  async searchOrcaPools(query: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    try {
      const whirlpools = await this.getOrcaWhirlpoolList(signal);
      if (whirlpools.length === 0) return [];

      const qLower = query.toLowerCase().trim();
      const matched = whirlpools.filter((p) => {
        const tA = p.tokenA;
        const tB = p.tokenB;
        return (
          tA?.mint?.toLowerCase() === qLower ||
          tB?.mint?.toLowerCase() === qLower ||
          tA?.symbol?.toLowerCase().includes(qLower) ||
          tB?.symbol?.toLowerCase().includes(qLower) ||
          tA?.name?.toLowerCase().includes(qLower) ||
          tB?.name?.toLowerCase().includes(qLower) ||
          p.address?.toLowerCase() === qLower
        );
      });

      const results: Partial<TokenPair>[] = [];
      for (const p of matched.slice(0, 10)) {
        const parsed = this.parseOrcaPool(p);
        if (parsed) results.push(parsed);
      }
      return results;
    } catch {
      return [];
    }
  }

  // =========================================================================
  // 3. RAYDIUM DIRECT DISCOVERY & MINT LOOKUP
  // =========================================================================
  private parseRaydiumPool(pool: any): Partial<TokenPair> | null {
    try {
      if (!pool || !pool.id || !pool.mintA || !pool.mintB) return null;
      const addrA = (pool.mintA.address || "").toLowerCase();
      const addrB = (pool.mintB.address || "").toLowerCase();

      const aIsQuote = SOLANA_QUOTE_MINTS.has(addrA);
      const bIsQuote = SOLANA_QUOTE_MINTS.has(addrB);

      let baseObj = pool.mintA;
      let quoteObj = pool.mintB;

      if (aIsQuote && !bIsQuote) {
        baseObj = pool.mintB;
        quoteObj = pool.mintA;
      } else if (!aIsQuote && bIsQuote) {
        baseObj = pool.mintA;
        quoteObj = pool.mintB;
      }

      const baseAddress = baseObj.address;
      if (!baseAddress) return null;

      const tvl = Number(pool.tvl || 0);
      const vol24h = Number(pool.day?.volume || 0);
      const priceNative = pool.price ? String(pool.price) : undefined;
      const openTimeNum = Number(pool.openTime || 0);
      let pairCreatedAt: number | undefined;
      if (openTimeNum > 0) {
        pairCreatedAt = openTimeNum < 10000000000 ? openTimeNum * 1000 : openTimeNum;
      }

      const pair: Partial<TokenPair> = {
        chainId: "solana",
        dexId: "raydium",
        primaryDex: "Raydium",
        primaryProvider: "Raydium API",
        pairAddress: pool.id,
        pairCreatedAt,
        baseToken: {
          address: baseAddress,
          name: baseObj.name || baseObj.symbol || "Token",
          symbol: baseObj.symbol || "TOKEN",
        },
        quoteToken: {
          address: quoteObj.address || "So11111111111111111111111111111111111111112",
          name: quoteObj.name || "Wrapped SOL",
          symbol: quoteObj.symbol || "SOL",
        },
        priceNative,
        liquidity: {
          usd: tvl,
          base: 0,
          quote: 0,
        },
        totalLiquidityUsd: tvl,
        volume: {
          h24: vol24h,
        },
        totalVolume24h: vol24h,
        info: {
          imageUrl: baseObj.logoURI || undefined,
        },
        url: `https://raydium.io/swap/?inputMint=sol&outputMint=${baseAddress}`,
        primaryDexTradingUrl: `https://raydium.io/swap/?inputMint=sol&outputMint=${baseAddress}`,
        sources: ["Raydium"],
      };

      return pair;
    } catch {
      return null;
    }
  }

  async fetchRaydiumPools(_mode: "trending" | "latest", signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    try {
      const sortField = _mode === "latest" ? "openTime" : "volume24h";
      const url = `https://api-v3.raydium.io/pools/info/list?poolType=all&poolSortField=${sortField}&sortType=desc&pageSize=25&page=1`;
      const json = await fetchWithTimeout(url, 5000, signal);
      if (!json || !json.success || !Array.isArray(json.data?.data)) return [];

      const results: Partial<TokenPair>[] = [];
      for (const p of json.data.data) {
        const parsed = this.parseRaydiumPool(p);
        if (parsed) results.push(parsed);
      }
      return results;
    } catch {
      return [];
    }
  }

  parseRaydiumLaunchRow(row: any): Partial<TokenPair> | null {
    try {
      const mint = String(row?.mint || "").trim();
      if (!mint) return null;
      const supply = Number(row.supply);
      const marketCap = Number(row.marketCap);
      const price = Number.isFinite(supply) && supply > 0 && Number.isFinite(marketCap) && marketCap > 0
        ? marketCap / supply
        : undefined;
      const progress = Number(row.finishingRate);
      const graduated = Number.isFinite(progress) && progress >= 1;
      const vol = Number(row.volumeU);
      const created = Number(row.createAt);
      const pair: Partial<TokenPair> = {
        chainId: "solana",
        dexId: "raydium",
        primaryDex: "Raydium",
        launchPlatform: "Raydium LaunchLab",
        primaryProvider: "Raydium LaunchLab",
        pairAddress: row.poolId || mint,
        pairCreatedAt: Number.isFinite(created) && created > 0 ? created : undefined,
        baseToken: {
          address: mint,
          name: row.name || undefined,
          symbol: row.symbol || undefined,
        },
        quoteToken: {
          address: row.mintB?.address || "So11111111111111111111111111111111111111112",
          name: row.mintB?.name || "Wrapped SOL",
          symbol: row.mintB?.symbol || "SOL",
        },
        priceUsd: price != null ? String(price) : undefined,
        marketCap: Number.isFinite(marketCap) && marketCap > 0 ? marketCap : undefined,
        fdv: Number.isFinite(marketCap) && marketCap > 0 ? marketCap : undefined,
        volume: Number.isFinite(vol) ? { h24: vol } : undefined,
        totalVolume24h: Number.isFinite(vol) ? vol : undefined,
        volumeComplete: Number.isFinite(vol),
        info: {
          imageUrl: row.imgUrl || undefined,
          description: row.description || undefined,
        },
        website: row.website || undefined,
        twitter: row.twitter || undefined,
        url: `https://raydium.io/launchpad/token/?mint=${mint}`,
        primaryDexTradingUrl: `https://raydium.io/launchpad/token/?mint=${mint}`,
        isBondingCurve: !graduated,
        isGraduated: graduated,
        bondingProgress: Number.isFinite(progress) ? Math.round(progress * 1000) / 10 : undefined,
        marketStage: graduated ? "graduated" : "bonding_curve",
        sources: ["Raydium LaunchLab"],
        dexes: ["Raydium"],
      };
      return pair;
    } catch {
      return null;
    }
  }

  async lookupRaydiumLaunchpad(query: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    const q = query.trim();
    if (!q) return [];
    const isMint = q.length >= 32 && q.length <= 44 && !q.startsWith("0x") && !/\s/.test(q);
    const url = isMint
      ? `https://launch-mint-v1.raydium.io/get/by/mints?ids=${encodeURIComponent(q)}`
      : `https://launch-mint-v1.raydium.io/get/search?text=${encodeURIComponent(q)}`;
    try {
      const json = await fetchWithTimeout(url, 6000, signal);
      const rows = json?.data?.rows;
      if (!json?.success || !Array.isArray(rows)) return [];
      const results: Partial<TokenPair>[] = [];
      for (const row of rows) {
        const parsed = this.parseRaydiumLaunchRow(row);
        if (parsed) results.push(parsed);
      }
      return results;
    } catch {
      return [];
    }
  }

  async lookupRaydiumMint(mint: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    try {
      const url = `https://api-v3.raydium.io/pools/info/mint?mint1=${encodeURIComponent(mint)}&poolType=all&poolSortField=default&sortType=desc&pageSize=10&page=1`;
      const json = await fetchWithTimeout(url, 5000, signal);
      if (!json || !json.success || !Array.isArray(json.data?.data)) return [];

      const results: Partial<TokenPair>[] = [];
      for (const p of json.data.data) {
        const parsed = this.parseRaydiumPool(p);
        if (parsed) results.push(parsed);
      }
      return results;
    } catch {
      return [];
    }
  }

  // =========================================================================
  // 4. GECKOTERMINAL SOLANA MULTI-DEX (PumpSwap, Orca, Meteora, Raydium, Lifinity, etc.)
  // =========================================================================
  private parseGeckoTerminalSolanaPool(pool: any, included: any[]): Partial<TokenPair> | null {
    try {
      const attrs = pool?.attributes;
      if (!attrs) return null;

      const baseTokenRelId = pool.relationships?.base_token?.data?.id;
      const dexRelId = pool.relationships?.dex?.data?.id;

      const tokenItem = included.find((i: any) => i.id === baseTokenRelId);
      const dexItem = included.find((i: any) => i.id === dexRelId);

      const tokenAttrs = tokenItem?.attributes || {};
      const dexAttrs = dexItem?.attributes || {};

      const rawDexName = dexAttrs.name || dexRelId || "Solana DEX";
      const dexName = normalizeDexName(rawDexName);
      const dexId = dexName.toLowerCase().replace(/[^a-z0-9]/g, "");

      const address = tokenAttrs.address;
      if (!address) return null;

      const symbol = tokenAttrs.symbol || attrs.name?.split("/")?.[0]?.trim() || "TOKEN";
      const name = tokenAttrs.name || symbol;

      const priceUsd = attrs.base_token_price_usd ? String(attrs.base_token_price_usd) : undefined;
      const volume24h = attrs.volume_usd?.h24 ? Number(attrs.volume_usd.h24) : 0;
      const liquidityUsd = attrs.reserve_in_usd ? Number(attrs.reserve_in_usd) : 0;
      const marketCap = attrs.market_cap_usd ? Number(attrs.market_cap_usd) : (attrs.fdv_usd ? Number(attrs.fdv_usd) : undefined);
      const priceChange24h = attrs.price_change_percentage?.h24 ? Number(attrs.price_change_percentage.h24) : undefined;

      const pairAddress = attrs.address;
      let pairCreatedAt: number | undefined;
      if (attrs.pool_created_at) {
        const parsed = new Date(attrs.pool_created_at).getTime();
        if (!isNaN(parsed) && parsed > 0) {
          pairCreatedAt = parsed;
        }
      }

      const partial: Partial<TokenPair> = {
        chainId: "solana",
        dexId,
        primaryDex: dexName,
        primaryProvider: `GeckoTerminal (${dexName})`,
        pairAddress,
        pairCreatedAt,
        baseToken: {
          address,
          name,
          symbol,
        },
        priceUsd,
        marketCap,
        fdv: marketCap,
        liquidity: {
          usd: liquidityUsd,
          base: 0,
          quote: 0,
        },
        totalLiquidityUsd: liquidityUsd,
        volume: {
          h24: volume24h,
        },
        totalVolume24h: volume24h,
        priceChange: priceChange24h !== undefined ? { h24: priceChange24h } : undefined,
        info: {
          imageUrl: tokenAttrs.image_url || undefined,
        },
        url: `https://geckoterminal.com/solana/pools/${pairAddress}`,
        sources: [dexName],
      };

      const tradeUrl = getDexTradingUrl(partial, dexName);
      if (tradeUrl) {
        partial.primaryDexTradingUrl = tradeUrl;
      }

      return partial;
    } catch {
      return null;
    }
  }

  async fetchGeckoTerminalSolanaTrending(signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    try {
      const url = "https://api.geckoterminal.com/api/v2/networks/solana/trending_pools?include=base_token,dex";
      const data = await fetchWithTimeout(url, 5000, signal);
      if (!data || !Array.isArray(data.data)) return [];

      const included = Array.isArray(data.included) ? data.included : [];
      const results: Partial<TokenPair>[] = [];

      for (const pool of data.data) {
        const parsed = this.parseGeckoTerminalSolanaPool(pool, included);
        if (parsed) results.push(parsed);
      }
      return results;
    } catch {
      return [];
    }
  }

  // PumpSwap is one of the largest Solana DEXs by volume, but unlike Raydium,
  // Orca, and Meteora it has no standalone public pools API, so this queries
  // GeckoTerminal's dex-specific endpoint directly rather than relying only on
  // whatever surfaces in the general network-wide trending mix, which could
  // dilute it among every other Solana DEX GeckoTerminal tracks.
  async fetchPumpSwapPools(mode: "trending" | "latest", signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    try {
      const sortSuffix = mode === "latest" ? "&sort=h24_tx_count_desc" : "";
      const url = `https://api.geckoterminal.com/api/v2/networks/solana/dexes/pumpswap/pools?include=base_token,dex&page=1${sortSuffix}`;
      const data = await fetchWithTimeout(url, 5000, signal);
      if (!data || !Array.isArray(data.data)) return [];

      const included = Array.isArray(data.included) ? data.included : [];
      const results: Partial<TokenPair>[] = [];

      for (const pool of data.data) {
        const parsed = this.parseGeckoTerminalSolanaPool(pool, included);
        if (parsed) results.push(parsed);
      }
      return results;
    } catch {
      return [];
    }
  }

  async lookupGeckoTerminalSolanaToken(address: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    try {
      const url = `https://api.geckoterminal.com/api/v2/networks/solana/tokens/${encodeURIComponent(address)}/pools?include=base_token,dex`;
      const data = await fetchWithTimeout(url, 5000, signal);
      if (!data || !Array.isArray(data.data)) return [];

      const included = Array.isArray(data.included) ? data.included : [];
      const results: Partial<TokenPair>[] = [];

      for (const pool of data.data) {
        const parsed = this.parseGeckoTerminalSolanaPool(pool, included);
        if (parsed) results.push(parsed);
      }
      return results;
    } catch {
      return [];
    }
  }

  // =========================================================================
  // 5. VENUE-SPECIFIC DEXSCREENER MULTI-DEX DISCOVERY (Phoenix, OpenBook, Lifinity, Manifest, PumpSwap)
  // =========================================================================
  async fetchDexScreenerVenues(signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    const venues = ["pumpswap", "meteora", "orca", "lifinity", "phoenix", "openbook", "manifest"];
    const queries = venues.map((v) =>
      fetchWithTimeout(`https://api.dexscreener.com/latest/dex/search?q=${v}`, 4500, signal)
    );
    const settled = await Promise.allSettled(queries);
    const results: Partial<TokenPair>[] = [];
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value && Array.isArray(r.value.pairs)) {
        for (const p of r.value.pairs) {
          if (p.chainId === "solana" && p.baseToken?.address) {
            const h24Vol = Number(p.volume?.h24 || 0);
            const h1Vol = Number(p.volume?.h1 || 0);
            // Ignore dead abandoned listings
            if (h24Vol < 300 && h1Vol === 0) continue;
            const dexName = normalizeDexName(p.dexId);
            results.push({
              ...p,
              primaryDex: dexName,
              primaryProvider: `DexScreener (${dexName})`,
              sources: [dexName],
            });
          }
        }
      }
    }
    return results;
  }

  // =========================================================================
  // IDexHunterProvider INTERFACE IMPLEMENTATION
  // =========================================================================
  /**
   * Discovers Solana tokens across all major venues (Meteora, Orca, Raydium, PumpSwap, Lifinity, etc.)
   */
  async discoverTokens(
    mode: "trending" | "latest",
    signal?: AbortSignal,
    chainId?: string,
    forceRefresh?: boolean
  ): Promise<Partial<TokenPair>[]> {
    // Only handle solana or global 'all'
    if (chainId && normalizeChainName(chainId) !== "solana" && chainId !== "all") {
      return [];
    }
    const cacheKey = `solana_dex_${mode}`;
    if (forceRefresh) {
      this.cache.delete(cacheKey);
    } else {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
        return cached.data;
      }
    }

    // Concurrently discover from independent native Solana DEX sources with fault isolation
    // Direct RPC & official DEX APIs (Meteora, Orca, Raydium, DexScreener venues)
    const settled = await Promise.allSettled([
      this.fetchDexScreenerVenues(signal),
      this.fetchMeteoraPools(mode, signal),
      this.fetchOrcaPools(mode, signal),
      this.fetchRaydiumPools(mode, signal),
      this.fetchPumpSwapPools(mode, signal),
      this.fetchGeckoTerminalSolanaTrending(signal),
    ]);
    const discovered: Partial<TokenPair>[] = [];
    for (const res of settled) {
      if (res.status === "fulfilled" && Array.isArray(res.value)) {
        discovered.push(...res.value);
      }
    }

    // Deduplicate by pairAddress or baseToken
    const seen = new Set<string>();
    const unique: Partial<TokenPair>[] = [];
    const fetchTime = Date.now();

    for (const p of discovered) {
      const id = `${p.dexId || "dex"}:${(p.pairAddress || p.baseToken?.address || "").toLowerCase()}`;
      if (!seen.has(id)) {
        seen.add(id);
        p.providerFetchTimestamp = fetchTime;

        // Filter out zero-activity pairs in trending mode
        if (mode === "trending") {
          const vol = Number(p.volume?.h24 || 0);
          const liq = Number(p.liquidity?.usd || 0);
          if (vol < 200 && liq < 300) continue;
        }
        unique.push(p);
      }
    }
    if (mode === "latest") {
      unique.sort((a, b) => (Number(b.pairCreatedAt) || 0) - (Number(a.pairCreatedAt) || 0));
    }
    if (unique.length > 0) {
      this.cache.set(cacheKey, { data: unique, timestamp: Date.now() });
    }
    return unique;
  }

  /**
   * Looks up a Solana token by exact contract address (mint) across all DEX venues
   */
  async getTokenByAddress(address: string, chainId?: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    if (!address || !address.trim()) return [];
    const clean = address.trim();
    if (clean.startsWith("0x")) return [];
    if (chainId && normalizeChainName(chainId) !== "solana" && chainId !== "all") {
      return [];
    }

    // Concurrently query native Meteora, Raydium, and Orca APIs
    const settled = await Promise.allSettled([
      this.lookupRaydiumLaunchpad(clean, signal),
      this.searchMeteoraPools(clean, signal),
      this.lookupRaydiumMint(clean, signal),
      this.searchOrcaPools(clean, signal),
      this.lookupGeckoTerminalSolanaToken(clean, signal),
    ]);
    const results: Partial<TokenPair>[] = [];
    for (const res of settled) {
      if (res.status === "fulfilled" && Array.isArray(res.value)) {
        results.push(...res.value);
      }
    }
    return results;
  }

  /**
   * Text search across Solana DEX venues
   */
  async searchTokens(query: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    if (!query || !query.trim()) return [];
    const clean = query.trim();
    if (clean.startsWith("0x")) return [];

    // If query is an address candidate, route to getTokenByAddress
    if (clean.length >= 32 && clean.length <= 44 && !clean.includes(" ")) {
      return this.getTokenByAddress(clean, "solana", signal);
    }
    const settled = await Promise.allSettled([
      this.lookupRaydiumLaunchpad(clean, signal),
      this.searchMeteoraPools(clean, signal),
      this.searchOrcaPools(clean, signal),
    ]);
    const results: Partial<TokenPair>[] = [];
    for (const res of settled) {
      if (res.status === "fulfilled" && Array.isArray(res.value)) {
        results.push(...res.value);
      }
    }
    return results;
  }
}
