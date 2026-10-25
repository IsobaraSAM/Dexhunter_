import { IDexHunterProvider } from "./types";
import { TokenPair } from "../../types";
import { PUMP_PROGRAM_ID_STR } from "../pumpConstants";
import { normalizeUri } from "./metaplexMetadata";
import { normalizeChainName } from "../dexPriority";
import { coerceSocialUrl } from "../safeUrl";
import { preserveXUrl } from "../xLinkKind.js";
import { hasVerifiedPumpSwapPool } from "../tokenIdentity";

async function fetchJsonWithTimeout(url: string, timeoutMs = 6000, externalSignal?: AbortSignal): Promise<any> {
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
    const res = await fetch(url, { signal: controller.signal });
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

const ACCEPTED_RESOLVE_STATUSES = new Set([
  "FOUND_BONDING_CURVE",
  "FOUND_GRADUATED",
  "FOUND_PUMPSWAP_ACTIVE",
]);

function poolAddressFrom(state: any): string | undefined {
  const pool = state?.pumpSwapPool || state?.pumpswap_pool || state?.pump_swap_pool || state?.pump_swap;
  if (typeof pool === "string" && pool.length >= 32 && pool !== "true") return pool;
  return undefined;
}

function raydiumPoolFrom(state: any): string | undefined {
  const pool = state?.raydiumPool || state?.raydium_pool;
  if (typeof pool === "string" && pool.length >= 32 && pool !== "true") return pool;
  return undefined;
}

function resolvePumpGraduation(state: any): {
  hasPumpSwap: boolean;
  hasRaydium: boolean;
  isComplete: boolean;
  isGraduated: boolean;
  isBondingCurve: boolean;
  marketStage: string;
  primaryDex: string | undefined;
  dexId: string;
  pairAddress: string;
} {
  const pumpPool = poolAddressFrom(state);
  const rayPool = raydiumPoolFrom(state);
  const verified = hasVerifiedPumpSwapPool({
    pumpSwapPool: pumpPool,
    pumpswap_pool: pumpPool,
    marketStage: state?.marketStage,
    dexId: state?.dexId || state?.dex_id,
    primaryDex: state?.primaryDex || state?.primary_dex,
  } as Partial<TokenPair>);
  const hasPumpSwap = Boolean(pumpPool) || verified;
  const hasRaydium = Boolean(rayPool);
  const isComplete = Boolean(
    state?.complete ||
    state?.isGraduated ||
    state?.is_graduated ||
    state?.graduated ||
    (typeof state?.bondingProgress === "number" && state.bondingProgress >= 100) ||
    state?.marketStage === "graduated" ||
    state?.marketStage === "pumpswap" ||
    state?.marketStage === "raydium" ||
    state?.market_stage === "pumpswap" ||
    state?.market_stage === "graduated"
  );

  const mint = state?.mint || state?.address || "";
  const bondingPda = state?.bondingCurvePda || state?.bonding_curve || mint;

  if (hasPumpSwap) {
    return {
      hasPumpSwap: true,
      hasRaydium,
      isComplete: true,
      isGraduated: true,
      isBondingCurve: false,
      marketStage: "pumpswap",
      primaryDex: "PumpSwap",
      dexId: "pumpswap",
      pairAddress: pumpPool || bondingPda,
    };
  }
  if (hasRaydium) {
    return {
      hasPumpSwap: false,
      hasRaydium: true,
      isComplete: true,
      isGraduated: true,
      isBondingCurve: false,
      marketStage: "raydium",
      primaryDex: "Raydium",
      dexId: "raydium",
      pairAddress: rayPool || bondingPda,
    };
  }
  if (isComplete) {
    return {
      hasPumpSwap: false,
      hasRaydium: false,
      isComplete: true,
      isGraduated: true,
      isBondingCurve: false,
      marketStage: "graduated_pending",
      primaryDex: undefined,
      dexId: state?.dexId || state?.dex_id || "pumpfun",
      pairAddress: bondingPda,
    };
  }
  return {
    hasPumpSwap: false,
    hasRaydium: false,
    isComplete: false,
    isGraduated: false,
    isBondingCurve: true,
    marketStage: "bonding_curve",
    primaryDex: state?.primaryDex || state?.primary_dex || undefined,
    dexId: state?.dexId || state?.dex_id || "pumpfun",
    pairAddress: bondingPda,
  };
}

function actualPriceChange(source: any): { h24: number } | undefined {
  const raw = source?.priceChange24h ?? source?.price_change_24h ?? source?.priceChange?.h24;
  if (raw === undefined || raw === null || raw === "") return undefined;
  const h24 = Number(raw);
  if (!Number.isFinite(h24)) return undefined;
  return { h24 };
}

function actualPriceUsd(source: any): string | undefined {
  const raw = source?.spotPriceUsd ?? source?.usd_price ?? source?.priceUsd;
  if (raw === undefined || raw === null || raw === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  if (n === 0) return undefined;
  return String(raw);
}

export class PumpFunProvider implements IDexHunterProvider {
  name = "Pump.fun";

  private normalizeOnChainState(state: any): Partial<TokenPair> {
    const address = state.mint || state.address || "";
    const name = state.tokenName || state.name || "Unknown Token";
    const symbol = state.tokenSymbol || state.symbol || "TOKEN";
    const marketCap = Number(state.marketCapUsd || state.usd_market_cap || state.fdvUsd || state.market_cap) || 0;
    const grad = resolvePumpGraduation(state);
    const isGraduated = grad.isGraduated;
    const isBondingCurve = grad.isBondingCurve;
    const bondingProgress = typeof state.bondingProgress === "number" ? state.bondingProgress : (isGraduated ? 100 : 0);

    const websites: Array<{ type: string; label?: string; url: string }> = [];
    const socials: Array<{ type: string; url: string }> = [];

    let arrayTw: string | undefined;
    let arrayTg: string | undefined;
    let arrayWeb: string | undefined;
    let arrayDisc: string | undefined;
    const scanArr = (arr: any[]) => {
      if (!Array.isArray(arr)) return;
      for (const item of arr) {
        if (!item) continue;
        const url = typeof item === "string" ? item : (item.url || item.value || item.link || item.href);
        const type = typeof item === "object" ? String(item.type || item.trait_type || item.name || item.platform || "").toLowerCase() : "";
        if (typeof url === "string") {
          const uLower = url.toLowerCase();
          if (!arrayTw && (type.includes("twitter") || type.includes("x") || uLower.includes("twitter.com") || uLower.includes("x.com"))) arrayTw = url;
          else if (!arrayTg && (type.includes("telegram") || type.includes("tg") || uLower.includes("t.me") || uLower.includes("telegram.me"))) arrayTg = url;
          else if (!arrayDisc && (type.includes("discord") || uLower.includes("discord.gg") || uLower.includes("discord.com"))) arrayDisc = url;
          else if (!arrayWeb && (type.includes("web") || type.includes("site") || (!uLower.includes("twitter") && !uLower.includes("x.com") && !uLower.includes("t.me")))) arrayWeb = url;
        }
      }
    };
    scanArr(state.links);
    scanArr(state.socials);
    scanArr(state.websites);
    if (state.info && typeof state.info === "object") {
      scanArr(state.info.socials);
      scanArr(state.info.websites);
    }

    // state.url is pump.fun/coin/<mint> — not a project website
    const rawWebsite = state.website || state.web || state.website_url || arrayWeb;
    const rawTwitter = state.twitter || state.x || state.twitter_url || state.x_url || arrayTw;
    const rawTelegram = state.telegram || state.tg || state.telegram_url || arrayTg;
    const rawDiscord = state.discord || state.discord_url || arrayDisc;

    const webUrl = coerceSocialUrl(rawWebsite, "website");
    const twUrl = coerceSocialUrl(rawTwitter, "twitter");
    const tgUrl = coerceSocialUrl(rawTelegram, "telegram");
    const discordUrl = coerceSocialUrl(rawDiscord, "discord");

    if (webUrl) websites.push({ type: "website", label: "Website", url: webUrl });
    if (twUrl) socials.push({ type: "twitter", url: twUrl });
    if (tgUrl) socials.push({ type: "telegram", url: tgUrl });
    if (discordUrl) socials.push({ type: "discord", url: discordUrl });

    const rawImg = state.imageUrl || state.image || state.logo || state.icon;
    const imageUrl = rawImg ? normalizeUri(rawImg, 0) : undefined;

    const sources = state.sources && Array.isArray(state.sources) && state.sources.length > 0 ? [...state.sources] : ["Pump.fun (On-Chain)"];
    if (grad.hasPumpSwap && !sources.includes("PumpSwap")) sources.unshift("PumpSwap");
    if (grad.hasRaydium && !sources.includes("Raydium")) sources.unshift("Raydium");
    const dexes = grad.hasPumpSwap ? ["PumpSwap"] : grad.hasRaydium ? ["Raydium"] : [];
    const priceUsd = actualPriceUsd(state);

    return {
      chainId: "solana",
      dexId: grad.dexId,
      primaryDex: grad.primaryDex,
      dexes,
      launchPlatform: "Pump.fun",
      url: `https://pump.fun/coin/${address}`,
      pairAddress: grad.pairAddress,
      baseToken: {
        address,
        name,
        symbol,
      },
      quoteToken: {
        address: "So11111111111111111111111111111111111111112",
        name: "Wrapped SOL",
        symbol: "SOL",
      },
      priceNative: state.spotPriceSol || undefined,
      priceUsd,
      marketCap,
      fdv: Number(state.fdvUsd) || marketCap,
      liquidity: {
        usd: state.liquidityUsd !== undefined ? state.liquidityUsd : undefined,
      },
      totalLiquidityUsd: state.liquidityUsd !== undefined ? state.liquidityUsd : undefined,
      volume: state.volume24h !== undefined ? { h24: Number(state.volume24h) } : undefined,
      totalVolume24h: state.volume24h !== undefined ? Number(state.volume24h) : undefined,
      priceChange: actualPriceChange(state),
      pairCreatedAt: state.createdAt || undefined,
      info: {
        imageUrl,
        websites,
        socials,
      },
      primaryProvider: this.name,
      sources,
      telegram: tgUrl,
      twitter: twUrl,
      website: webUrl,
      discord: discordUrl,
      bondingCurvePda: state.bondingCurvePda,
      bondingProgress,
      isBondingCurve,
      isGraduated,
      complete: grad.isComplete,
      pumpSwapPool: poolAddressFrom(state),
      pumpswap_pool: poolAddressFrom(state),
      marketStage: grad.marketStage as TokenPair["marketStage"],
      pairs: grad.hasPumpSwap ? [
        {
          chainId: "solana",
          pairAddress: poolAddressFrom(state) || address,
          dexName: "PumpSwap",
          dexId: "pumpswap",
          baseToken: { address, name, symbol },
          quoteToken: { address: "So11111111111111111111111111111111111111112", name: "Wrapped SOL", symbol: "SOL" },
          priceUsd,
          liquidityUsd: state.liquidityUsd,
          volume24h: state.volume24h !== undefined ? Number(state.volume24h) : undefined,
        }
      ] : grad.hasRaydium ? [
        {
          chainId: "solana",
          pairAddress: raydiumPoolFrom(state) || address,
          dexName: "Raydium",
          dexId: "raydium",
          baseToken: { address, name, symbol },
          quoteToken: { address: "So11111111111111111111111111111111111111112", name: "Wrapped SOL", symbol: "SOL" },
          priceUsd,
          liquidityUsd: state.liquidityUsd,
          volume24h: state.volume24h !== undefined ? Number(state.volume24h) : undefined,
        }
      ] : [
        {
          chainId: "solana",
          pairAddress: grad.pairAddress || address,
          dexName: "Pump.fun",
          dexId: "pumpfun",
          baseToken: { address, name, symbol },
          quoteToken: { address: "So11111111111111111111111111111111111111112", name: "Wrapped SOL", symbol: "SOL" },
          priceUsd,
          liquidityUsd: state.liquidityUsd,
          volume24h: state.volume24h !== undefined ? Number(state.volume24h) : undefined,
        }
      ],
      creator: state.creator,
      realSolReservesFormatted: state.realSolReservesFormatted,
      virtualTokenReserves: state.virtualTokenReserves,
      virtualSolReserves: state.virtualSolReserves,
      realTokenReserves: state.realTokenReserves,
      realSolReserves: state.realSolReserves,
      tokenTotalSupply: state.tokenTotalSupply,
    };
  }

  private normalizeCoin(coin: any): Partial<TokenPair> {
    if (coin.virtualTokenReserves || coin.bondingCurvePda) {
      return this.normalizeOnChainState(coin);
    }

    const address = coin.mint || coin.address || coin.token_address || coin.tokenAddress || coin.contractAddress || "";
    const name = coin.name || coin.token_name || "Unknown Token";
    const symbol = coin.symbol || coin.token_symbol || "TOKEN";
    const usdMarketCap = Number(coin.usd_market_cap || coin.market_cap || coin.marketCap || coin.fdv) || 0;
    
    let createdTime: number | undefined = undefined;
    if (coin.created_timestamp) {
      const ts = Number(coin.created_timestamp);
      createdTime = ts > 1e12 ? ts : (ts > 1e9 ? ts * 1000 : undefined);
    } else if (coin.created_at) {
      const parsed = new Date(coin.created_at).getTime();
      createdTime = !isNaN(parsed) && parsed > 0 ? (parsed > 1e12 ? parsed : (parsed > 1e9 ? parsed * 1000 : undefined)) : undefined;
    } else if (coin.createdAt) {
      const num = typeof coin.createdAt === "number" ? coin.createdAt : new Date(coin.createdAt).getTime();
      createdTime = !isNaN(num) && num > 0 ? (num > 1e12 ? num : (num > 1e9 ? num * 1000 : undefined)) : undefined;
    } else if (coin.timestamp) {
      const parsed = new Date(coin.timestamp).getTime();
      createdTime = !isNaN(parsed) && parsed > 0 ? (parsed > 1e12 ? parsed : (parsed > 1e9 ? parsed * 1000 : undefined)) : undefined;
    }

    const websites: Array<{ type: string; label?: string; url: string }> = [];
    const socials: Array<{ type: string; url: string }> = [];

    // Scan array links if present
    let arrayTw: string | undefined;
    let arrayTg: string | undefined;
    let arrayWeb: string | undefined;
    let arrayDisc: string | undefined;
    const scanArr = (arr: any[]) => {
      if (!Array.isArray(arr)) return;
      for (const item of arr) {
        if (!item) continue;
        const url = typeof item === "string" ? item : (item.url || item.value || item.link || item.href);
        const type = typeof item === "object" ? String(item.type || item.trait_type || item.name || item.platform || "").toLowerCase() : "";
        if (typeof url === "string") {
          const uLower = url.toLowerCase();
          if (!arrayTw && (type.includes("twitter") || type.includes("x") || uLower.includes("twitter.com") || uLower.includes("x.com"))) arrayTw = url;
          else if (!arrayTg && (type.includes("telegram") || type.includes("tg") || uLower.includes("t.me") || uLower.includes("telegram.me"))) arrayTg = url;
          else if (!arrayDisc && (type.includes("discord") || uLower.includes("discord.gg") || uLower.includes("discord.com"))) arrayDisc = url;
          else if (!arrayWeb && (type.includes("web") || type.includes("site") || (!uLower.includes("twitter") && !uLower.includes("x.com") && !uLower.includes("t.me")))) arrayWeb = url;
        }
      }
    };
    scanArr(coin.links);
    scanArr(coin.socials);
    scanArr(coin.websites);
    if (coin.info && typeof coin.info === "object") {
      scanArr(coin.info.socials);
      scanArr(coin.info.websites);
    }

    const descText = String(coin.description || coin.desc || "");
    const tgMatch = descText.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_+]+)/i);
    const twMatch = descText.match(/(?:https?:\/\/|\/\/)?(?:www\.)?(?:mobile\.)?(?:twitter\.com|x\.com)\/[^\s)]+/i);
    const webMatch = descText.match(/https?:\/\/(?!(?:t\.me|telegram\.me|twitter\.com|x\.com|ipfs\.io|arweave\.net|dexscreener\.com|pump\.fun))([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s)]*)?)/i);

    const rawWebsite = coin.website || coin.web || coin.website_url || coin.links?.website || (Array.isArray(coin.websites) ? coin.websites[0]?.url || coin.websites[0] : "") || arrayWeb || (webMatch ? webMatch[0] : undefined);
    const rawTwitter = coin.twitter || coin.x || coin.twitter_url || coin.x_url || coin.links?.twitter || coin.links?.x || arrayTw || (twMatch ? preserveXUrl(twMatch[0]) : undefined);
    const rawTelegram = coin.telegram || coin.tg || coin.telegram_url || coin.links?.telegram || arrayTg || (tgMatch ? `https://t.me/${tgMatch[1]}` : undefined);
    const rawDiscord = coin.discord || coin.discord_url || coin.links?.discord || arrayDisc;

    const webUrl = coerceSocialUrl(typeof rawWebsite === "string" ? rawWebsite : undefined, "website");
    const twUrl = coerceSocialUrl(rawTwitter, "twitter");
    const tgUrl = coerceSocialUrl(rawTelegram, "telegram");
    const discordUrl = coerceSocialUrl(rawDiscord, "discord");

    if (webUrl) websites.push({ type: "website", label: "Website", url: webUrl });
    if (twUrl) socials.push({ type: "twitter", url: twUrl });
    if (tgUrl) socials.push({ type: "telegram", url: tgUrl });
    if (discordUrl) socials.push({ type: "discord", url: discordUrl });

    const rawImg = coin.image_uri || coin.image || coin.logo || coin.icon;
    const imageUrl = rawImg ? normalizeUri(rawImg, 0) : undefined;

    const grad = resolvePumpGraduation(coin);
    const sources = coin.sources && Array.isArray(coin.sources) ? [...coin.sources] : ["Pump.fun"];
    if (grad.hasPumpSwap && !sources.includes("PumpSwap")) sources.unshift("PumpSwap");
    if (grad.hasRaydium && !sources.includes("Raydium")) sources.unshift("Raydium");
    const dexes = grad.hasPumpSwap ? ["PumpSwap"] : grad.hasRaydium ? ["Raydium"] : [];

    const derivedLiqUsd = coin.liquidityUsd !== undefined
      ? Number(coin.liquidityUsd)
      : (coin.liquidity?.usd !== undefined ? Number(coin.liquidity.usd) : undefined);
    const hasVolume = coin.volume_24h !== undefined || coin.volume24h !== undefined || coin.volume !== undefined;
    const observedVolume = hasVolume ? Number(coin.volume_24h || coin.volume24h || coin.volume || 0) : undefined;
    const priceUsd = actualPriceUsd(coin) || (usdMarketCap > 0 ? (usdMarketCap / 1_000_000_000).toFixed(8) : undefined);

    return {
      chainId: "solana",
      dexId: grad.dexId,
      primaryDex: grad.primaryDex,
      dexes,
      launchPlatform: "Pump.fun",
      url: `https://pump.fun/coin/${address}`,
      pairAddress: grad.pairAddress,
      baseToken: {
        address,
        name,
        symbol,
      },
      quoteToken: {
        address: "So11111111111111111111111111111111111111112",
        name: "Wrapped SOL",
        symbol: "SOL",
      },
      priceNative: coin.price ? String(coin.price) : undefined,
      priceUsd,
      marketCap: usdMarketCap > 0 ? usdMarketCap : undefined,
      fdv: usdMarketCap > 0 ? usdMarketCap : undefined,
      liquidity: derivedLiqUsd !== undefined ? { usd: derivedLiqUsd } : undefined,
      totalLiquidityUsd: derivedLiqUsd,
      volume: observedVolume !== undefined ? { h24: observedVolume } : undefined,
      totalVolume24h: observedVolume,
      priceChange: actualPriceChange(coin),
      pairCreatedAt: createdTime,
      info: {
        imageUrl,
        websites,
        socials,
      },
      primaryProvider: this.name,
      sources,
      telegram: tgUrl,
      twitter: twUrl,
      website: webUrl,
      discord: discordUrl,
      isBondingCurve: grad.isBondingCurve,
      isGraduated: grad.isGraduated,
      complete: grad.isComplete || Boolean(coin.complete),
      pumpswap_pool: poolAddressFrom(coin),
      marketStage: grad.marketStage as TokenPair["marketStage"],
      pairs: grad.hasPumpSwap ? [
        {
          chainId: "solana",
          pairAddress: poolAddressFrom(coin) || address,
          dexName: "PumpSwap",
          dexId: "pumpswap",
          baseToken: { address, name, symbol },
          quoteToken: { address: "So11111111111111111111111111111111111111112", name: "Wrapped SOL", symbol: "SOL" },
          priceUsd,
          liquidityUsd: derivedLiqUsd,
          volume24h: observedVolume,
        }
      ] : grad.hasRaydium ? [
        {
          chainId: "solana",
          pairAddress: raydiumPoolFrom(coin) || address,
          dexName: "Raydium",
          dexId: "raydium",
          baseToken: { address, name, symbol },
          quoteToken: { address: "So11111111111111111111111111111111111111112", name: "Wrapped SOL", symbol: "SOL" },
          priceUsd,
          liquidityUsd: derivedLiqUsd,
          volume24h: observedVolume,
        }
      ] : [
        {
          chainId: "solana",
          pairAddress: grad.pairAddress || address,
          dexName: "Pump.fun",
          dexId: "pumpfun",
          baseToken: { address, name, symbol },
          quoteToken: { address: "So11111111111111111111111111111111111111112", name: "Wrapped SOL", symbol: "SOL" },
          priceUsd,
          liquidityUsd: derivedLiqUsd,
          volume24h: observedVolume,
        }
      ],
    };
  }

  async searchTokens(query: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    if (!query || !query.trim()) return [];
    const cleanQuery = query.trim();
    // Guard: EVM addresses are never Pump.fun tokens
    if (cleanQuery.startsWith("0x")) return [];

    // 1. Direct on-chain resolution if candidate is a Solana mint address
    if (cleanQuery.length >= 32 && cleanQuery.length <= 44 && !cleanQuery.includes(" ")) {
      const onChain = await this.getTokenByAddress(cleanQuery, "solana", signal);
      if (onChain.length > 0) {
        return onChain;
      }
    }

    const qLower = cleanQuery.toLowerCase();

    // Pump.fun's frontend search rejects browser calls (no CORS header).
    // DexScreener search plus the tokens already in the latest feed cover this.
    const [dsSettled, freshSettled] = await Promise.allSettled([
      fetchJsonWithTimeout(
        `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(cleanQuery)}`,
        5000,
        signal
      ),
      this.discoverTokens("latest", signal),
    ]);

    if (dsSettled.status === "fulfilled" && Array.isArray(dsSettled.value?.pairs)) {
      const dsMatches = dsSettled.value.pairs
        .filter((p: any) => p.chainId === "solana" && (p.dexId === "pumpfun" || p.url?.includes("pump.fun")))
        .map((p: any) => this.normalizeCoin(p));
      if (dsMatches.length > 0) return dsMatches;
    }

    if (freshSettled.status === "fulfilled") {
      const matched = freshSettled.value.filter((t) => {
        const name = t.baseToken?.name?.toLowerCase() || "";
        const symbol = t.baseToken?.symbol?.toLowerCase() || "";
        const addr = t.baseToken?.address?.toLowerCase() || "";
        return name.includes(qLower) || symbol.includes(qLower) || addr.includes(qLower);
      });
      if (matched.length > 0) return matched;
    }

    return [];
  }

  /**
   * Direct On-Chain Token Resolution using concurrent multi-endpoint lookup
   */
  async getTokenByAddress(address: string, _chainId?: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    if (!address || !address.trim()) return [];
    const cleanAddr = address.trim();
    if (cleanAddr.startsWith("0x")) return [];
    if (_chainId) {
      const normChain = normalizeChainName(_chainId);
      if (normChain !== "all" && normChain !== "solana") return [];
    }

    // Query on-chain resolver, Pump.fun coin API, and diagnostic audit concurrently via Promise.allSettled
    const [resolveSettled, coinSettled, diagSettled] = await Promise.allSettled([
      fetchJsonWithTimeout(`/api/pump-resolve?mint=${encodeURIComponent(cleanAddr)}`, 5000, signal),
      fetchJsonWithTimeout(`https://frontend-api.pump.fun/coins/${encodeURIComponent(cleanAddr)}`, 4000, signal),
      fetchJsonWithTimeout(`/api/pumpfun-diagnostic?mint=${encodeURIComponent(cleanAddr)}`, 5000, signal),
    ]);

    // 1. Primary Priority: Verified On-Chain Resolver with merged social/off-chain metadata
    if (resolveSettled.status === "fulfilled" && resolveSettled.value) {
      const resolveRes = resolveSettled.value;
      if (resolveRes.status === "RPC_ERROR") {
        // RPC_ERROR is not a token — do not fabricate from incomplete resolver data
      } else if (resolveRes.token && ACCEPTED_RESOLVE_STATUSES.has(resolveRes.status)) {
        const tokenData = { ...resolveRes.token };
        const coin = coinSettled.status === "fulfilled" ? coinSettled.value : null;
        if (coin) {
          tokenData.twitter = tokenData.twitter || coin.twitter || coin.links?.twitter || coin.links?.x || coin.x;
          tokenData.telegram = tokenData.telegram || coin.telegram || coin.links?.telegram || coin.tg;
          tokenData.website = tokenData.website || coin.website || coin.links?.website || coin.web;
          tokenData.discord = tokenData.discord || coin.discord || coin.links?.discord;
          tokenData.imageUrl = tokenData.imageUrl || coin.image_uri || coin.image || coin.logo;
          tokenData.description = tokenData.description || coin.description;
        }
        const diag = diagSettled.status === "fulfilled" ? diagSettled.value : null;
        if (diag?.normalizedMetadata) {
          const nm = diag.normalizedMetadata;
          tokenData.twitter = tokenData.twitter || nm.socials?.twitter || nm.twitter;
          tokenData.telegram = tokenData.telegram || nm.socials?.telegram || nm.telegram;
          tokenData.website = tokenData.website || nm.socials?.website || nm.website;
          tokenData.discord = tokenData.discord || nm.socials?.discord || nm.discord;
          tokenData.imageUrl = tokenData.imageUrl || nm.imageUrl;
          tokenData.description = tokenData.description || nm.description;
        }
        return [this.normalizeOnChainState(tokenData)];
      }
    }

    // 2. Secondary Priority: Pump.fun Native Coin API
    if (coinSettled.status === "fulfilled" && coinSettled.value) {
      const coin = coinSettled.value;
      if (coin && (coin.mint || coin.address)) {
        return [this.normalizeCoin(coin)];
      }
    }

    // 3. Fallback: Pump.fun Diagnostic Audit
    if (diagSettled.status === "fulfilled" && diagSettled.value) {
      const diagRes = diagSettled.value;
      const d = diagRes.diagnostics?.bondingCurve || diagRes.bondingStatus;
      const m = diagRes.normalizedMetadata || diagRes.normalizedFields;
      if (d && m) {
        return [
          this.normalizeOnChainState({
            mint: cleanAddr,
            tokenName: m.name,
            tokenSymbol: m.symbol,
            imageUrl: m.imageUrl,
            description: m.description,
            twitter: m.socials?.twitter,
            telegram: m.socials?.telegram,
            website: m.socials?.website,
            bondingCurvePda: d.pda || d.bondingCurvePda,
            complete: d.complete,
            bondingProgress: d.bondingProgressPct,
            virtualTokenReserves: d.virtualTokenReserves,
            virtualSolReserves: d.virtualSolReserves,
            realTokenReserves: d.realTokenReserves,
            realSolReserves: d.realSolReserves,
          }),
        ];
      }
    }

    return [];
  }

  /**
   * Discovers Fresh Mints directly from on-chain indexer
   */
  async discoverTokens(_mode: "trending" | "latest", signal?: AbortSignal, chainId?: string): Promise<Partial<TokenPair>[]> {
    if (chainId && normalizeChainName(chainId) !== "solana" && normalizeChainName(chainId) !== "all") {
      return [];
    }
    // Run all three candidate sources in parallel instead of one after another.
    // This used to be three sequential awaits, each with its own multi-second
    // timeout, so a slow or empty first attempt blocked every later attempt
    // from even starting. That stacking was the main cause of multi-second
    // browse delays. Priority order for which result wins is unchanged.
    const [freshSettled, proxySettled, fallbackSettled] = await Promise.allSettled([
      fetchJsonWithTimeout("/api/pump-fresh", 6000, signal),
      fetchJsonWithTimeout("/api/pumpfun-new", 6000, signal),
      fetchJsonWithTimeout("https://api.dexscreener.com/latest/dex/search?q=pumpfun", 5000, signal),
    ]);

    if (freshSettled.status === "fulfilled") {
      const freshRes = freshSettled.value;
      if (freshRes?.tokens && Array.isArray(freshRes.tokens) && freshRes.tokens.length > 0) {
        return freshRes.tokens.map((t: any) => this.normalizeOnChainState(t));
      }
    }

    if (proxySettled.status === "fulfilled") {
      const proxyRes = proxySettled.value;
      const coins = Array.isArray(proxyRes)
        ? proxyRes
        : Array.isArray(proxyRes?.result)
        ? proxyRes.result
        : Array.isArray(proxyRes?.tokens)
        ? proxyRes.tokens
        : null;
      if (coins && coins.length > 0) {
        return coins.map((c: any) => this.normalizeCoin(c));
      }
    }

    if (fallbackSettled.status === "fulfilled") {
      const fallbackData = fallbackSettled.value;
      const fallbackCoins = Array.isArray(fallbackData)
        ? fallbackData
        : Array.isArray(fallbackData?.pairs)
        ? fallbackData.pairs.filter((p: any) => p.chainId === "solana" && (p.dexId === "pumpfun" || p.url?.includes("pump.fun")))
        : [];
      if (fallbackCoins.length > 0) {
        return fallbackCoins.map((c: any) => this.normalizeCoin(c));
      }
    }

    return [];
  }
}

export const pumpFunProvider = new PumpFunProvider();

