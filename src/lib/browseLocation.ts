// Browse location is the index route's search params, not a second history stack.
// TanStack Router already owns Back and Forward. Pushing a new entry is reserved
// for a place the user would expect Back to undo: tab, search, chain, DEX, age,
// social requirements, or the open token detail. Sort and numeric boxes update
// the current entry until the first change away from the page they landed on,
// so typing "1000" does not create four history entries and does not overwrite
// the landing entry either.

export type BrowseTab = "trending" | "latest" | "fresh_mints";

export type BrowseLocation = {
  tab: BrowseTab;
  q: string;
  chain: string;
  dex: string;
  age: string;
  sort: string;
  minVolume: string;
  maxVolume: string;
  minLiquidity: string;
  minMarketCap: string;
  maxMarketCap: string;
  minPriceChange: string;
  tg: boolean;
  tw: boolean;
  xp: boolean;
  xpost: boolean;
  dc: boolean;
  web: boolean;
  verified: boolean;
  token: string;
};

export const DEFAULT_BROWSE: BrowseLocation = {
  tab: "trending",
  q: "",
  chain: "all",
  dex: "all",
  age: "1w",
  sort: "none",
  minVolume: "",
  maxVolume: "",
  minLiquidity: "",
  minMarketCap: "",
  maxMarketCap: "",
  minPriceChange: "",
  tg: false,
  tw: false,
  xp: false,
  xpost: false,
  dc: false,
  web: false,
  verified: false,
  token: "",
};

const TABS = new Set<BrowseTab>(["trending", "latest", "fresh_mints"]);
const AGES = new Set(["all", "1h", "6h", "24h", "48h", "1w", "1m"]);
const SORTS = new Set([
  "volume",
  "liquidity",
  "priceChange",
  "marketCap",
  "newest",
  "momentum",
  "none",
  "trending",
  "price",
]);

const PLACE_KEYS = ["tab", "q", "chain", "dex", "age", "tg", "tw", "xp", "xpost", "dc", "web", "verified", "token"] as const;

function text(value: unknown, max: number): string {
  if (value == null) return "";
  const raw = Array.isArray(value) ? value[0] : value;
  return String(raw).trim().slice(0, max);
}

function flag(value: unknown): boolean {
  const raw = text(value, 8).toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

function metric(value: unknown): string {
  const raw = text(value, 16);
  if (!raw) return "";
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? String(n) : "";
}

function signedMetric(value: unknown): string {
  const raw = text(value, 16);
  if (!raw) return "";
  const n = Number(raw);
  return Number.isFinite(n) ? String(n) : "";
}

function idList(value: unknown, maxItems: number): string {
  const raw = text(value, 600).toLowerCase();
  if (!raw || raw === "all") return "all";
  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => /^[a-z0-9_-]{2,32}$/.test(part) && part !== "all");
  const unique = [...new Set(parts)].sort().slice(0, maxItems);
  return unique.length ? unique.join(",") : "all";
}

export function parseBrowseSearch(search: Record<string, unknown> | null | undefined): BrowseLocation {
  const src = search && typeof search === "object" ? search : {};
  const tab = text(src.tab, 16) as BrowseTab;
  const age = text(src.age, 8);
  const sort = text(src.sort, 16);
  const token = text(src.token, 180);
  const tw = flag(src.tw);
  const xp = flag(src.xp);
  const xpost = flag(src.xpost);
  // Older links used tw=1 for any X URL. That now means either a profile or a post.
  const legacyEither = tw && !xp && !xpost;
  return {
    tab: TABS.has(tab) ? tab : DEFAULT_BROWSE.tab,
    q: text(src.q, 300),
    chain: idList(src.chain, 32),
    dex: idList(src.dex, 16),
    age: AGES.has(age) ? age : DEFAULT_BROWSE.age,
    sort: SORTS.has(sort) ? sort : DEFAULT_BROWSE.sort,
    minVolume: metric(src.minVolume),
    maxVolume: metric(src.maxVolume),
    minLiquidity: metric(src.minLiquidity),
    minMarketCap: metric(src.minMarketCap),
    maxMarketCap: metric(src.maxMarketCap),
    minPriceChange: signedMetric(src.minPriceChange),
    tg: flag(src.tg),
    tw,
    xp: xp || legacyEither,
    xpost: xpost || legacyEither,
    dc: flag(src.dc),
    web: flag(src.web),
    verified: flag(src.verified),
    token: token.includes(":") ? token : "",
  };
}

export function sameBrowse(a: BrowseLocation, b: BrowseLocation): boolean {
  const keys = Object.keys(DEFAULT_BROWSE) as Array<keyof BrowseLocation>;
  return keys.every((key) => a[key] === b[key]);
}

export function historyAction(
  prev: BrowseLocation,
  next: BrowseLocation,
  hasPushed: boolean
): "push" | "replace" | "none" {
  if (sameBrowse(prev, next)) return "none";
  const placeChanged = PLACE_KEYS.some((key) => prev[key] !== next[key]);
  if (placeChanged || !hasPushed) return "push";
  return "replace";
}
