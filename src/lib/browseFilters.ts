import { hasSocial, matchSocialFilters } from "./xLinkKind.js";
import {
  chainSelectionList,
  formatChainSelection,
  matchesChainSelection,
  matchesSourceFilter as sourceMatches,
  toggleChainSelection,
} from "./sourceMatch.js";

export { hasSocial };
export {
  chainSelectionList,
  formatChainSelection,
  matchesChainSelection,
  toggleChainSelection,
};

type SourcePair = {
  chainId?: string | null;
  isPonsLaunch?: boolean;
  isArgusLaunch?: boolean;
  isBondingCurve?: boolean;
  isGraduated?: boolean | null;
  bondingCurvePda?: string | null;
  marketStage?: string | null;
  launchPlatform?: string | null;
  primaryDex?: string | null;
  dexId?: string | null;
  primaryProvider?: string | null;
  dexes?: string[] | null;
  sources?: string[] | null;
  pairs?: Array<{ dexName?: string | null; dexId?: string | null }> | null;
};

export function matchesSourceFilter(pair: SourcePair, selectedDex: string): boolean {
  return sourceMatches(pair, selectedDex);
}

export function knownMetric(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function createdMs(value?: number | null): number {
  const raw = Number(value || 0);
  if (!raw) return 0;
  return raw < 1e11 ? raw * 1000 : raw;
}

// Launch time is pairCreatedAt only. firstSeenAt is when the indexer noticed
// the row, and using it as an age would invent a launch.
export function launchMs(token?: { pairCreatedAt?: number | null; firstSeenAt?: number | null } | null): number | null {
  const raw = Number(token?.pairCreatedAt);
  if (!Number.isFinite(raw) || raw <= 0) return null;
  return raw < 1e11 ? raw * 1000 : raw;
}

export const AGE_WINDOWS_MS: Record<string, number> = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "48h": 48 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
  "1m": 30 * 24 * 60 * 60 * 1000,
};

const LAUNCH_CLOCK_SKEW_MS = 120_000;

// Unknown age fails every bounded window, including the default 7 days.
// "all" is the only view that includes a token with no launch time.
// A launch a couple of minutes ahead of this clock is allowed. Further ahead is not.
export function passesAge(
  token: { pairCreatedAt?: number | null; firstSeenAt?: number | null } | null | undefined,
  age: string,
  now = Date.now()
): boolean {
  if (age === "all") return true;
  const windowMs = AGE_WINDOWS_MS[age] ?? AGE_WINDOWS_MS["1w"];
  const ts = launchMs(token);
  if (ts == null) return false;
  if (ts > now + LAUNCH_CLOCK_SKEW_MS) return false;
  return now - ts <= windowMs;
}

export function passesMin(value: unknown, min: number | ""): boolean {
  if (min === "") return true;
  const n = knownMetric(value);
  return n != null && n >= min;
}

export function passesMax(value: unknown, max: number | ""): boolean {
  if (max === "") return true;
  const n = knownMetric(value);
  return n != null && n <= max;
}

export function volumeForFilter(token?: {
  volumeComplete?: boolean;
  volume?: { h24?: unknown } | null;
  totalVolume24h?: unknown;
} | null): number | null {
  if (!token || token.volumeComplete === false) return null;
  const direct = knownMetric(token.volume?.h24);
  if (direct != null) return direct;
  return knownMetric(token.totalVolume24h);
}

/** Card/table figure. Includes a partial window. Filters still use volumeForFilter. */
export function volumeForDisplay(token?: {
  volumeComplete?: boolean;
  volumeObservedUsd?: unknown;
  volume?: { h24?: unknown } | null;
  totalVolume24h?: unknown;
} | null): number | null {
  if (!token) return null;
  const observed = knownMetric(token.volumeObservedUsd);
  if (observed != null) return observed;
  const direct = knownMetric(token.volume?.h24);
  if (direct != null) return direct;
  return knownMetric(token.totalVolume24h);
}

export function liquidityForFilter(token?: {
  liquidity?: { usd?: unknown } | null;
  totalLiquidityUsd?: unknown;
} | null): number | null {
  if (!token) return null;
  const direct = knownMetric(token.liquidity?.usd);
  if (direct != null) return direct;
  return knownMetric(token.totalLiquidityUsd);
}

export function ponsValued(pair?: { isGraduated?: boolean | null; marketStage?: string | null } | null): boolean {
  if (!pair) return false;
  const stage = String(pair.marketStage || "").toLowerCase();
  return pair.isGraduated === true || stage === "graduated" || stage === "migrated";
}

export function ponsStageLabel(pair?: {
  isPonsLaunch?: boolean;
  isGraduated?: boolean | null;
  marketStage?: string | null;
  launchPlatform?: string | null;
  primaryDex?: string | null;
  dexId?: string | null;
  primaryProvider?: string | null;
} | null): string | null {
  if (!pair) return null;
  const platform = String(pair.launchPlatform || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const primary = String(pair.primaryDex || pair.dexId || pair.primaryProvider || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const pons = Boolean(pair.isPonsLaunch) || platform.includes("pons") || primary.includes("pons");
  if (!pons) return null;
  if (ponsValued(pair)) return "Pons · valued";
  if (String(pair.marketStage || "").toLowerCase() === "sweeping") return "Pons · migrating";
  return "Pons · bonding curve";
}

export function marketCapOf(token: { marketCap?: unknown; fdv?: unknown }): number | null {
  // Circulating market cap only. FDV is a different field and must not be substituted.
  return knownMetric(token?.marketCap);
}
export function fdvOf(token: { fdv?: unknown }): number | null {
  return knownMetric(token?.fdv);
}

function isAddressLabel(value: string, address?: string | null): boolean {
  const v = value.trim();
  if (!v) return true;
  if (/^0x[a-fA-F0-9]{40}$/.test(v)) return true;
  if (/^0x[a-fA-F0-9]{3,10}(?:…|\.{3})[a-fA-F0-9]{2,8}$/.test(v)) return true;
  const addr = String(address || "").trim();
  if (!addr) return false;
  const lower = v.toLowerCase();
  return lower === addr.toLowerCase() || lower === addr.slice(0, 6).toLowerCase() || lower === addr.slice(0, 8).toLowerCase();
}

export function displaySymbol(token?: { baseToken?: { symbol?: string | null; address?: string | null } | null } | null): string {
  const symbol = String(token?.baseToken?.symbol || "").trim();
  const addr = token?.baseToken?.address;
  if (symbol && !/^unknown$/i.test(symbol) && !isAddressLabel(symbol, addr)) {
    return symbol.length > 18 ? `${symbol.slice(0, 16)}…` : symbol;
  }
  return "—";
}

export function displayName(
  token?: { baseToken?: { name?: string | null; symbol?: string | null; address?: string | null } | null } | null,
  fallback = displaySymbol(token)
): string {
  const name = String(token?.baseToken?.name || "").trim();
  const addr = token?.baseToken?.address;
  if (name && !/^unknown$/i.test(name) && !isAddressLabel(name, addr)) {
    return name.length > 64 ? `${name.slice(0, 62)}…` : name;
  }
  const next = String(fallback || "").trim();
  if (next && next !== "—" && !/^unknown$/i.test(next) && !isAddressLabel(next, addr)) return next;
  return "Name unverified";
}

export function compareCreatedDesc(
  a: { pairCreatedAt?: number | null; firstSeenAt?: number | null },
  b: { pairCreatedAt?: number | null; firstSeenAt?: number | null }
): number {
  return (launchMs(b) ?? 0) - (launchMs(a) ?? 0);
}

// The counter is how many rows are loaded, not how many the current filter shows.
export function discoveryWindowStatus(loaded: number, total: number | null): string {
  if (total == null) return "Loading this window";
  if (total > loaded) {
    return `${loaded.toLocaleString()} loaded of ${total.toLocaleString()} in this window`;
  }
  return `${total.toLocaleString()} in this window`;
}

type Row = {
  priceUsd?: string | number | null;
  priceNative?: string | number | null;
  marketCap?: number | null;
  totalLiquidityUsd?: number | null;
  liquidity?: { usd?: number | null };
  totalVolume24h?: number | null;
  volume?: { h24?: number | null };
  priceChange?: { h24?: number | null };
  bondingProgress?: number | null;
  marketStage?: string | null;
  isGraduated?: boolean;
  baseToken?: { name?: string; symbol?: string };
  info?: { imageUrl?: string; socials?: unknown[]; websites?: unknown[] };
};

export function liveRowChanged(prev: Row, next: Row): boolean {
  if (prev.priceUsd !== next.priceUsd || prev.priceNative !== next.priceNative) return true;
  if ((prev.marketCap || 0) !== (next.marketCap || 0)) return true;
  if ((prev.totalLiquidityUsd || prev.liquidity?.usd || 0) !== (next.totalLiquidityUsd || next.liquidity?.usd || 0)) return true;
  if ((prev.totalVolume24h || prev.volume?.h24 || 0) !== (next.totalVolume24h || next.volume?.h24 || 0)) return true;
  if ((prev.priceChange?.h24 || 0) !== (next.priceChange?.h24 || 0)) return true;
  if (prev.bondingProgress !== next.bondingProgress) return true;
  if (prev.marketStage !== next.marketStage || prev.isGraduated !== next.isGraduated) return true;
  if ((prev.baseToken?.name || "") !== (next.baseToken?.name || "")) return true;
  if ((prev.baseToken?.symbol || "") !== (next.baseToken?.symbol || "")) return true;
  if (!prev.info?.imageUrl && next.info?.imageUrl) return true;
  if ((prev.info?.socials?.length || 0) < (next.info?.socials?.length || 0)) return true;
  if ((prev.info?.websites?.length || 0) < (next.info?.websites?.length || 0)) return true;
  return false;
}

export type LoadedFilter = {
  chain: string;
  dex: string;
  age: string;
  minVolume: number | "";
  maxVolume: number | "";
  minLiquidity: number | "";
  minMarketCap: number | "";
  maxMarketCap: number | "";
  minPriceChange: number | "";
  telegram: boolean;
  twitter: boolean;
  discord: boolean;
  website: boolean;
  verified: boolean;
  xProfile?: boolean;
  xPost?: boolean;
  now?: number;
};

export function applyLoadedFilters<T extends Parameters<typeof matchesSourceFilter>[0] & Parameters<typeof passesAge>[0]>(
  tokens: T[],
  filters: LoadedFilter
): T[] {
  return tokens.filter((pair) => {
    if (!matchesChainSelection(pair.chainId, filters.chain)) return false;
    if (!matchesSourceFilter(pair, filters.dex)) return false;
    const row = pair as any;
    if (!passesMin(volumeForFilter(row), filters.minVolume)) return false;
    if (!passesMax(volumeForFilter(row), filters.maxVolume)) return false;
    if (!passesMin(liquidityForFilter(row), filters.minLiquidity)) return false;
    if (!passesMin(marketCapOf(row), filters.minMarketCap)) return false;
    if (!passesMax(marketCapOf(row), filters.maxMarketCap)) return false;
    if (!passesMin(row.priceChange?.h24, filters.minPriceChange)) return false;
    if (!matchSocialFilters(pair, filters)) return false;
    if (!passesAge(pair, filters.age, filters.now)) return false;
    return true;
  });
}

