// Chain and venue matching shared by the browse UI and the discovery query.
// Keep this file free of TypeScript so the indexer can import it directly.

/** @param {string | null | undefined} value */
export function chainIdOf(value) {
  const c = String(value || "").toLowerCase().trim();
  if (!c || c === "all") return "";
  if (c === "sol" || c === "solana") return "solana";
  if (c === "eth" || c === "ethereum") return "ethereum";
  if (c === "bsc" || c === "bnb" || c === "binance") return "bsc";
  if (c === "matic" || c === "polygon" || c === "polygon_pos") return "polygon";
  if (c === "arb" || c === "arbitrum") return "arbitrum";
  if (c === "avax" || c === "avalanche") return "avalanche";
  if (c === "op" || c === "optimism") return "optimism";
  if (c === "base") return "base";
  if (c === "robinhood" || c === "robinhood_chain") return "robinhood";
  if (c === "arc" || c === "5042") return "arc";
  return c;
}

/** @param {string} chain */
export function chainSelectionList(chain) {
  const parts = String(chain || "")
    .split(",")
    .map((part) => chainIdOf(part.trim()))
    .filter((part) => part && part !== "all");
  return [...new Set(parts)].sort();
}

/** @param {string[]} ids */
export function formatChainSelection(ids) {
  const list = chainSelectionList(ids.join(","));
  return list.length ? list.join(",") : "all";
}

/** @param {string} current @param {string} id */
export function toggleChainSelection(current, id) {
  const nextId = chainIdOf(id);
  if (!nextId || nextId === "all") return "all";
  const list = chainSelectionList(current);
  const next = list.includes(nextId) ? list.filter((part) => part !== nextId) : [...list, nextId];
  return next.length ? [...next].sort().join(",") : "all";
}

/** @param {string | null | undefined} chainId @param {string} selection */
export function matchesChainSelection(chainId, selection) {
  const wanted = chainSelectionList(selection);
  if (!wanted.length) return true;
  return wanted.includes(chainIdOf(chainId || ""));
}

/** @param {any} pair @param {string} selectedDex @returns {boolean} */
export function matchesSourceFilter(pair, selectedDex) {
  if (selectedDex.includes(",")) {
    return selectedDex.split(",").some((part) => {
      const piece = part.trim();
      return Boolean(piece) && piece.toLowerCase() !== "all" && matchesSourceFilter(pair, piece);
    });
  }
  const target = selectedDex.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!target || target === "all") return true;
  const platform = String(pair.launchPlatform || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const primary = String(pair.primaryDex || pair.dexId || pair.primaryProvider || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const pons = Boolean(pair.isPonsLaunch) || platform.includes("pons") || primary.includes("pons");
  const argus = Boolean(pair.isArgusLaunch) || platform.includes("argus") || primary.includes("argus");
  const solana = String(pair.chainId || "").toLowerCase() === "solana";
  const pump = !pons && !argus && solana && (
    platform.includes("pumpfun") ||
    primary === "pumpfun" ||
    primary === "pump" ||
    Boolean(pair.bondingCurvePda) ||
    pair.isBondingCurve === true ||
    pair.marketStage === "bonding_curve"
  );
  const stage = String(pair.marketStage || "").toLowerCase();
  const valued = pair.isGraduated === true || stage === "graduated" || stage === "migrated";
  const onCurve = pons && !valued && stage !== "rescued";
  if (target === "ponscurve" || target === "ponsbonding" || target === "ponsbond") return onCurve;
  if (target === "pons" || target === "ponsv2") return pons && valued;
  if (target === "argus") return argus && !pons;
  if (target === "pumpfun" || target === "pump") return pump;
  if (target === "pumpswap") {
    return !pons && !argus && (primary.includes("pumpswap") || pair.marketStage === "pumpswap");
  }
  if (pons || argus) return primary.includes(target) || platform.includes(target);
  /** @param {string | null | undefined} value */
  const fold = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return (
    primary.includes(target) ||
    platform.includes(target) ||
    Boolean(pair.dexes?.some((/** @type {string} */ d) => fold(d).includes(target))) ||
    Boolean(pair.sources?.some((/** @type {string} */ s) => fold(s).includes(target))) ||
    Boolean(pair.pairs?.some((/** @type {{ dexName?: string | null; dexId?: string | null }} */ pr) => fold(pr.dexName || pr.dexId).includes(target)))
  );
}
