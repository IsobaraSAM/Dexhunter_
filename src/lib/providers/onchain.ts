import { IDexHunterProvider } from "./types";
import { TokenPair } from "../../types";
import { normalizeChainName } from "../dexPriority";
import { coerceSocialUrl } from "../safeUrl";
import { hasVerifiedPumpSwapPool } from "../tokenIdentity";

async function fetchJsonWithTimeout(url: string, timeoutMs = 4000, externalSignal?: AbortSignal): Promise<any> {
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

export class OnChainProvider implements IDexHunterProvider {
  name = "OnChain";

  async searchTokens(query: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    const clean = query.trim();
    if (clean.length >= 28 && !clean.includes(" ")) {
      return this.getTokenByAddress(clean, undefined, signal);
    }
    return [];
  }

  async getTokenByAddress(address: string, chainId?: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    const cleanAddr = address.trim();
    if (!cleanAddr) return [];

    const isEvm = cleanAddr.startsWith("0x") && cleanAddr.length === 42;
    const isSolana = !cleanAddr.startsWith("0x") && cleanAddr.length >= 32 && cleanAddr.length <= 44;

    if (!isEvm && !isSolana) return [];

    const detectedChain = chainId || (isSolana ? "solana" : "ethereum");

    try {
      // Execute on-chain resolver and secondary DexScreener indexer concurrently with Promise.allSettled
      const queries: Promise<any>[] = [
        fetchJsonWithTimeout(
          `https://api.dexscreener.com/latest/dex/tokens/${cleanAddr}`,
          5000,
          signal
        ),
      ];

      if (isSolana) {
        queries.unshift(
          fetchJsonWithTimeout(
            `/api/pump-resolve?mint=${encodeURIComponent(cleanAddr)}`,
            5000,
            signal
          )
        );
      }

      const settled = await Promise.allSettled(queries);

      // 1. Check Solana direct resolver result first if queried
      if (isSolana && settled[0].status === "fulfilled" && settled[0].value) {
        const resolveRes = settled[0].value;
        if (resolveRes.status === "RPC_ERROR") {
          // RPC_ERROR is not NOT_PUMP — skip pump mapping and fall through to DexScreener
        } else if (
          resolveRes.token &&
          (resolveRes.status === "FOUND_BONDING_CURVE" ||
            resolveRes.status === "FOUND_GRADUATED" ||
            resolveRes.status === "FOUND_PUMPSWAP_ACTIVE")
        ) {
          const t = resolveRes.token;
          const pumpPool =
            typeof t.pumpSwapPool === "string" && t.pumpSwapPool.length >= 32 && t.pumpSwapPool !== "true"
              ? t.pumpSwapPool
              : typeof t.pumpswap_pool === "string" && t.pumpswap_pool.length >= 32
              ? t.pumpswap_pool
              : undefined;
          const rayPool =
            typeof t.raydiumPool === "string" && t.raydiumPool.length >= 32
              ? t.raydiumPool
              : typeof t.raydium_pool === "string" && t.raydium_pool.length >= 32
              ? t.raydium_pool
              : undefined;
          const verifiedPump = hasVerifiedPumpSwapPool({
            pumpSwapPool: pumpPool,
            pumpswap_pool: pumpPool,
            marketStage: t.marketStage,
            dexId: t.dexId,
            primaryDex: t.primaryDex,
          } as Partial<TokenPair>);
          const hasPumpSwap = Boolean(pumpPool) || verifiedPump;
          const hasRaydium = Boolean(rayPool);
          const isComplete = Boolean(
            t.complete || t.isGraduated || t.marketStage === "pumpswap" || t.marketStage === "graduated" || t.marketStage === "raydium"
          );
          const hasPool = hasPumpSwap || hasRaydium;
          const isGraduated = hasPool || isComplete;
          let marketStage: string = "bonding_curve";
          let dexId = "pumpfun";
          let primaryDex: string | undefined;
          let dexes: string[] = [];
          let sources = ["OnChain (Solana RPC)"];
          if (hasPumpSwap) {
            marketStage = "pumpswap";
            dexId = "pumpswap";
            primaryDex = "PumpSwap";
            dexes = ["PumpSwap"];
            sources = ["PumpSwap", "OnChain (Solana RPC)"];
          } else if (hasRaydium) {
            marketStage = "raydium";
            dexId = "raydium";
            primaryDex = "Raydium";
            dexes = ["Raydium"];
            sources = ["Raydium", "OnChain (Solana RPC)"];
          } else if (isComplete) {
            marketStage = "graduated_pending";
            dexId = "pumpfun";
            primaryDex = undefined;
          }
          const pairAddress = pumpPool || rayPool || t.bondingCurvePda || cleanAddr;
          const priceUsd = t.spotPriceUsd && Number(t.spotPriceUsd) !== 0 ? String(t.spotPriceUsd) : undefined;
          const tokenName = t.tokenName || "Unknown Token";
          const tokenSymbol = t.tokenSymbol || "TOKEN";
          const webUrl = coerceSocialUrl(t.website, "website");
          const twUrl = coerceSocialUrl(t.twitter, "twitter");
          const tgUrl = coerceSocialUrl(t.telegram, "telegram");
          return [
            {
              chainId: "solana",
              dexId,
              primaryDex,
              launchPlatform: "Pump.fun",
              url: `https://pump.fun/coin/${cleanAddr}`,
              pairAddress,
              baseToken: {
                address: cleanAddr,
                name: tokenName,
                symbol: tokenSymbol,
              },
              quoteToken: {
                address: "So11111111111111111111111111111111111111112",
                name: "Wrapped SOL",
                symbol: "SOL",
              },
              priceNative: t.spotPriceSol || undefined,
              priceUsd,
              marketCap: t.marketCapUsd || undefined,
              fdv: t.fdvUsd || t.marketCapUsd || undefined,
              liquidity: {
                usd: t.liquidityUsd !== undefined ? t.liquidityUsd : undefined,
              },
              totalLiquidityUsd: t.liquidityUsd !== undefined ? t.liquidityUsd : undefined,
              volume: undefined,
              totalVolume24h: undefined,
              pairCreatedAt: t.createdAt || undefined,
              info: {
                imageUrl: t.imageUrl || undefined,
                websites: webUrl ? [{ type: "website", label: "Website", url: webUrl }] : [],
                socials: [
                  ...(twUrl ? [{ type: "twitter", url: twUrl }] : []),
                  ...(tgUrl ? [{ type: "telegram", url: tgUrl }] : []),
                ],
              },
              primaryProvider: this.name,
              sources,
              dexes,
              bondingCurvePda: t.bondingCurvePda,
              bondingProgress: isGraduated ? 100 : (t.bondingProgress || 0),
              isBondingCurve: !isGraduated,
              isGraduated,
              complete: isComplete || Boolean(t.complete),
              marketStage: marketStage as TokenPair["marketStage"],
              pumpSwapPool: pumpPool,
              pumpswap_pool: pumpPool,
              pairs: hasPumpSwap ? [
                {
                  chainId: "solana",
                  pairAddress,
                  dexName: "PumpSwap",
                  dexId: "pumpswap",
                  baseToken: {
                    address: cleanAddr,
                    name: tokenName,
                    symbol: tokenSymbol,
                  },
                  quoteToken: {
                    address: "So11111111111111111111111111111111111111112",
                    name: "Wrapped SOL",
                    symbol: "SOL",
                  },
                  priceUsd,
                  liquidityUsd: t.liquidityUsd,
                },
              ] : hasRaydium ? [
                {
                  chainId: "solana",
                  pairAddress,
                  dexName: "Raydium",
                  dexId: "raydium",
                  baseToken: {
                    address: cleanAddr,
                    name: tokenName,
                    symbol: tokenSymbol,
                  },
                  quoteToken: {
                    address: "So11111111111111111111111111111111111111112",
                    name: "Wrapped SOL",
                    symbol: "SOL",
                  },
                  priceUsd,
                  liquidityUsd: t.liquidityUsd,
                },
              ] : undefined,
              realSolReservesFormatted: t.realSolReservesFormatted,
              virtualTokenReserves: t.virtualTokenReserves,
              virtualSolReserves: t.virtualSolReserves,
              realTokenReserves: t.realTokenReserves,
              realSolReserves: t.realSolReserves,
              tokenTotalSupply: t.tokenTotalSupply,
            },
          ];
        }
      }

      // 2. Check DexScreener token endpoint result
      const dexSettledIndex = isSolana ? 1 : 0;
      if (settled[dexSettledIndex] && settled[dexSettledIndex].status === "fulfilled" && settled[dexSettledIndex].value) {
        const dexRes = settled[dexSettledIndex].value;
        if (Array.isArray(dexRes?.pairs) && dexRes.pairs.length > 0) {
          const normChain = chainId ? normalizeChainName(chainId) : undefined;
          return dexRes.pairs
            .filter((p: any) => !normChain || normChain === "all" || normalizeChainName(p.chainId) === normChain)
            .map((p: any) => ({
              ...p,
              primaryProvider: this.name,
            }));
        }
      }

      return [];
    } catch {
      return [];
    }
  }

  async discoverTokens(_mode: "trending" | "latest", _signal?: AbortSignal, _chainId?: string): Promise<Partial<TokenPair>[]> {
    return [];
  }
}
