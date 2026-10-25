import { chainTokenKey } from "./addressCase.js";
import { TokenPair } from "../types";

/**
 * Check if the token has a verified graduated PumpSwap pool
 */
export function hasVerifiedPumpSwapPool(pair: any): boolean {
  if (!pair) return false;
  if (pair.hasPumpSwapPool) return true;
  if (pair.pumpSwapPool && typeof pair.pumpSwapPool === "string" && pair.pumpSwapPool.length > 0) return true;
  if (pair.marketStage === "pumpswap") return true;

  const dexId = String(pair.dexId || "").toLowerCase();
  const primaryDex = String(pair.primaryDex || "").toLowerCase();
  if (dexId === "pumpswap" || primaryDex === "pumpswap") return true;

  return false;
}

/**
 * Check if the token originated or operates on a bonding curve (e.g. Pump.fun)
 */
export function isBondingCurveToken(pair: any): boolean {
  if (!pair) return false;
  // If the coin has already graduated or migrated to an AMM pool (PumpSwap, Raydium, etc.), it is no longer on the bonding curve
  if (
    pair.isGraduated === true ||
    pair.marketStage === "graduated" ||
    pair.marketStage === "pumpswap" ||
    pair.marketStage === "raydium" ||
    (typeof pair.bondingProgress === "number" && pair.bondingProgress >= 100) ||
    hasVerifiedPumpSwapPool(pair)
  ) {
    return false;
  }

  if (pair.isBondingCurve === true) return true;
  if (pair.marketStage === "bonding_curve") return true;
  if (pair.bondingCurvePda || pair.bondingCurve) return true;

  const dexId = String(pair.dexId || "").toLowerCase();
  const primaryDex = String(pair.primaryDex || "").toLowerCase();
  if (dexId === "pumpfun" || primaryDex === "pumpfun" || dexId === "pump") return true;

  if (pair.launchPlatform === "Pump.fun") {
    // On Pump.fun, unless explicitly graduated or complete, it is on the bonding curve
    return !pair.complete && !pair.isGraduated;
  }

  const mint = pair.baseToken?.address || pair.mint || "";
  if (typeof mint === "string" && mint.toLowerCase().endsWith("pump") && !pair.isGraduated && !pair.complete) {
    return true;
  }

  return false;
}

/**
 * Generate a deterministic identity key for deduplicating, caching, or rendering table rows
 */
export function tokenIdentityKey(pair: Partial<TokenPair> | any): string {
  if (!pair) return "";
  const chain = pair.chainId || "unknown";
  const address =
    pair.baseToken?.address ||
    pair.mint ||
    pair.tokenAddress ||
    pair.address ||
    pair.pairAddress ||
    pair.url ||
    "";
  return chainTokenKey(chain, address);
}

/**
 * Generate a deterministic holder cache key for a token
 */
export function holderCacheKey(chainId: string | undefined, tokenAddress: string): string {
  return chainTokenKey(chainId || "solana", tokenAddress);
}
