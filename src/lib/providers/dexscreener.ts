import { IDexHunterProvider } from "./types";
import { TokenPair, TokenBoost, TokenProfile } from "../../types";
import { normalizeChainName } from "../dexPriority";
import { TtlLruCache } from "../lruCache";

export const CHAIN_DISCOVERY_QUERIES: Record<string, string[]> = {
  base: ["aerodrome", "base", "uniswap base"],
  bsc: ["pancakeswap", "bsc", "thena"],
  ethereum: ["curve", "uniswap weth", "balancer"],
  arbitrum: ["camelot", "arbitrum", "gmx"],
  polygon: ["quickswap", "polygon"],
  avalanche: ["traderjoe", "avalanche"],
  cronos: ["vvs", "cronos"],
  solana: [
    "pumpswap",
    "meteora",
    "orca",
    "raydium",
    "phoenix",
    "openbook",
    "lifinity",
    "manifest",
    "pump",
  ],
  robinhood: ["uniswap robinhood", "robinhood"],
};

async function fetchJsonWithTimeout(url: string, timeoutMs = 6000, externalSignal?: AbortSignal): Promise<any> {
  // The public API does not allow browser CORS. Calling it from the page only
  // spams the console. Server routes still fetch it; the window check is false there.
  if (typeof window !== "undefined" && url.includes("api.dexscreener.com")) return null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeoutId);
      return null;
    }
    externalSignal.addEventListener("abort", onAbort, { once: true });
  }

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DEXHunter/2.0",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (externalSignal) externalSignal.removeEventListener("abort", onAbort);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    clearTimeout(timeoutId);
    if (externalSignal) externalSignal.removeEventListener("abort", onAbort);
    return null;
  }
}

export class DexScreenerProvider implements IDexHunterProvider {
  name = "DexScreener";
  private discoveryCache = new TtlLruCache<Partial<TokenPair>[]>(50, 12000);

  clearCache(): void {
    this.discoveryCache.clear();
  }

  /**
   * Helper to enrich market pairs with rich profile metadata (links, socials, icons, descriptions)
   * returned by DexScreener token-profiles and token-boosts endpoints
   */
  private enrichPairsWithProfileData(pairs: Partial<TokenPair>[], profiles: any[]): Partial<TokenPair>[] {
    if (!Array.isArray(profiles) || profiles.length === 0 || !Array.isArray(pairs)) return pairs;
    const profileMap = new Map<string, any>();
    for (const item of profiles) {
      const addr = (item.tokenAddress || "").toLowerCase();
      if (addr) profileMap.set(addr, item);
    }

    for (const p of pairs) {
      const baseAddr = (p.baseToken?.address || "").toLowerCase();
      const prof = profileMap.get(baseAddr);
      if (prof) {
        p.info = p.info || {};
        if (prof.icon && !p.info.imageUrl) {
          p.info.imageUrl = prof.icon;
        }
        if (prof.description && !p.info.description) {
          (p.info as any).description = prof.description;
        }
        if (prof.totalAmount || prof.amount) {
          (p as any).boostAmount = Number(prof.totalAmount || prof.amount);
          (p as any).isBoosted = true;
        }
        if (Array.isArray(prof.links)) {
          const socials = Array.isArray(p.info.socials) ? [...p.info.socials] : [];
          const websites = Array.isArray(p.info.websites) ? [...p.info.websites] : [];
          for (const link of prof.links) {
            if (!link?.url) continue;
            const u = String(link.url).trim();
            if (!u) continue;
            const lower = u.toLowerCase();
            const type = String(link.type || "").toLowerCase();
            if (type === "twitter" || type === "x" || lower.includes("twitter.com") || lower.includes("x.com")) {
              if (!socials.some(s => s.url.toLowerCase() === lower)) {
                socials.push({ type: "twitter", url: u });
              }
            } else if (type === "telegram" || type === "tg" || lower.includes("t.me") || lower.includes("telegram")) {
              if (!socials.some(s => s.url.toLowerCase() === lower)) {
                socials.push({ type: "telegram", url: u });
              }
            } else if (type === "discord" || lower.includes("discord")) {
              if (!socials.some(s => s.url.toLowerCase() === lower)) {
                socials.push({ type: "discord", url: u });
              }
            } else {
              if (!websites.some(w => w.url.toLowerCase() === lower)) {
                websites.push({ type: "website", label: link.label || "Website", url: u });
              }
            }
          }
          p.info.socials = socials;
          p.info.websites = websites;
        }
      }
    }
    return pairs;
  }

  async searchTokens(query: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    if (!query || !query.trim()) return [];
    try {
      const res = await fetchJsonWithTimeout(
        `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query.trim())}`,
        7000,
        signal
      );
      if (Array.isArray(res?.pairs)) {
        return res.pairs.map((p: any) => ({
          ...p,
          primaryProvider: this.name,
        }));
      }
      return [];
    } catch {
      return [];
    }
  }

  async getTokenByAddress(address: string, _chainId?: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    if (!address || !address.trim()) return [];
    try {
      const cleanAddr = address.trim();
      const res = await fetchJsonWithTimeout(
        `https://api.dexscreener.com/latest/dex/tokens/${cleanAddr}`,
        6000,
        signal
      );
      if (Array.isArray(res?.pairs)) {
        return res.pairs.map((p: any) => ({
          ...p,
          primaryProvider: this.name,
        }));
      }
      return [];
    } catch {
      return [];
    }
  }

  async discoverTokens(
    mode: "trending" | "latest",
    signal?: AbortSignal,
    chainId?: string,
    forceRefresh?: boolean
  ): Promise<Partial<TokenPair>[]> {
    const normChain = chainId ? normalizeChainName(chainId) : "all";
    const cacheKey = `${mode}:${normChain}`;

    if (forceRefresh) {
      this.discoveryCache.delete(cacheKey);
    } else {
      const cached = this.discoveryCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // 1. Concurrently fetch verified real-time active sources (top boosts, latest boosts, and latest profiles)
      const [topBoostsRes, latestBoostsRes, latestProfilesRes] = await Promise.allSettled([
        fetchJsonWithTimeout("https://api.dexscreener.com/token-boosts/top/v1", 6000, signal),
        fetchJsonWithTimeout("https://api.dexscreener.com/token-boosts/latest/v1", 6000, signal),
        fetchJsonWithTimeout("https://api.dexscreener.com/token-profiles/latest/v1", 6000, signal),
      ]);

      const allActiveItems: any[] = [];
      if (topBoostsRes.status === "fulfilled" && Array.isArray(topBoostsRes.value)) {
        allActiveItems.push(...topBoostsRes.value);
      }
      if (latestBoostsRes.status === "fulfilled" && Array.isArray(latestBoostsRes.value)) {
        allActiveItems.push(...latestBoostsRes.value);
      }
      if (latestProfilesRes.status === "fulfilled" && Array.isArray(latestProfilesRes.value)) {
        allActiveItems.push(...latestProfilesRes.value);
      }

      // Filter by chain if not "all"
      const filteredItems = normChain === "all"
        ? allActiveItems
        : allActiveItems.filter((item) => normalizeChainName(item.chainId) === normChain);

      // Extract unique token addresses
      const addressSet = new Set<string>();
      const candidateAddresses: string[] = [];
      for (const item of filteredItems) {
        const addr = (item.tokenAddress || "").trim();
        if (addr && !addressSet.has(addr.toLowerCase())) {
          addressSet.add(addr.toLowerCase());
          candidateAddresses.push(addr);
        }
      }

      const pairsList: Partial<TokenPair>[] = [];

      // 2. Batch fetch live market data for discovered active tokens (up to 60 addresses)
      if (candidateAddresses.length > 0) {
        const batchPairs = await this.getBatchAddresses(candidateAddresses.slice(0, 60), signal);
        const enriched = this.enrichPairsWithProfileData(batchPairs, filteredItems);
        pairsList.push(...enriched);
      }

      // 2b. Always ensure active Robinhood chain discovery when chain is "all" or "robinhood"
      if (normChain === "all" || normChain === "robinhood") {
        try {
          const rhRes = await fetchJsonWithTimeout("https://api.dexscreener.com/latest/dex/search?q=robinhood", 5000, signal);
          if (Array.isArray(rhRes?.pairs)) {
            for (const p of rhRes.pairs) {
              if (normalizeChainName(p.chainId) === "robinhood") {
                pairsList.push({
                  ...p,
                  primaryProvider: this.name,
                });
              }
            }
          }
        } catch {
          // non-blocking
        }
      }

      // Deduplicate by chain + pair address or baseToken address
      const seen = new Set<string>();
      let uniquePairs: Partial<TokenPair>[] = [];
      const fetchTime = Date.now();

      for (const p of pairsList) {
        const id = `${normalizeChainName(p.chainId)}:${(p.pairAddress || p.baseToken?.address || "").toLowerCase()}`;
        if (!seen.has(id)) {
          seen.add(id);
          p.providerFetchTimestamp = fetchTime;
          uniquePairs.push(p);
        }
      }

      // Filter based on mode
      const now = Date.now();
      if (mode === "latest") {
        // Strict max 48 hours enforcement for latest listings
        const MAX_LATEST_AGE_MS = 48 * 60 * 60 * 1000;
        uniquePairs = uniquePairs.filter((p) => {
          if (!p.pairCreatedAt || p.pairCreatedAt <= 0) return false;
          const created = Number(p.pairCreatedAt);
          const ageMs = now - (created < 10000000000 ? created * 1000 : created);
          return ageMs >= -60000 && ageMs <= MAX_LATEST_AGE_MS;
        });
        uniquePairs.sort((a, b) => (Number(b.pairCreatedAt) || 0) - (Number(a.pairCreatedAt) || 0));
      } else {
        // Trending mode: strictly enforce max 1 week (7 days) age and exclude dead/abandoned pairs
        const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
        uniquePairs = uniquePairs.filter((p) => {
          if (p.pairCreatedAt && p.pairCreatedAt > 0) {
            const created = Number(p.pairCreatedAt);
            const validTs = created < 10000000000 ? created * 1000 : created;
            const ageMs = now - validTs;
            if (ageMs > ONE_WEEK_MS) return false;
          }
          const vol24 = Number(p.volume?.h24 || 0);
          const vol1 = Number(p.volume?.h1 || 0);
          const vol5m = Number(p.volume?.m5 || 0);
          const liq = Number(p.liquidity?.usd || 0);
          // Disqualify zombie pairs with no activity and sub-dust liquidity
          if (vol24 < 300 && vol1 === 0 && vol5m === 0 && liq < 500) {
            return false;
          }
          return true;
        });
      }

      if (uniquePairs.length > 0) {
        this.discoveryCache.set(cacheKey, uniquePairs);
      }
      return uniquePairs;
    } catch {
      return [];
    }
  }

  private async getBatchAddresses(addresses: string[], signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    if (!addresses || addresses.length === 0) return [];
    const chunks: string[][] = [];
    for (let i = 0; i < Math.min(addresses.length, 60); i += 30) {
      chunks.push(addresses.slice(i, i + 30));
    }
    const settled = await Promise.allSettled(
      chunks.map((chunk) =>
        fetchJsonWithTimeout(
          `https://api.dexscreener.com/latest/dex/tokens/${chunk.join(",")}`,
          7000,
          signal
        )
      )
    );
    const allPairs: Partial<TokenPair>[] = [];
    for (const r of settled) {
      if (r.status === "fulfilled" && Array.isArray(r.value?.pairs)) {
        for (const p of r.value.pairs) {
          allPairs.push({
            ...p,
            primaryProvider: this.name,
          });
        }
      }
    }
    return allPairs;
  }
}

