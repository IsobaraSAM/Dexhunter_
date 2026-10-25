// @ts-nocheck
// Contract / mint queries are not ordinary text.
// EVM hex is case-insensitive. Solana base58 is not: a case change is a
// different mint, so a folded match is used only when it is unique.
// Pair addresses and bonding-curve PDAs count. Quote mints do not, or every
// USDC pair would answer a USDC search.

const EVM_EXACT = /^0x[a-fA-F0-9]{40}$/;
const SOL_EXACT = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const EVM_PREFIX = /^0x[a-fA-F0-9]{6,39}$/;
const SOL_PREFIX = /^[1-9A-HJ-NP-Za-km-z]{12,31}$/;
const LABEL = /^(?:ca|contract|token|address|mint)\s*[:#]\s*/i;
const WRAP = /^[\s"'`([{<]+|[\s"'`)\]}>.,;:]+$/g;
const INVISIBLE = /[\s\u200b\u200c\u200d\ufeff]+/g;

export const ADDRESS_PREFIX_CAP = 40;

function emptyQuery() {
  return { kind: "empty", text: "" };
}

function classifyCompact(compact) {
  const evmReady = compact.replace(/^0x/i, "0x");
  if (EVM_EXACT.test(evmReady)) return { kind: "evm", address: evmReady.toLowerCase(), text: compact };
  if (SOL_EXACT.test(compact)) return { kind: "solana", address: compact, text: compact };
  if (EVM_PREFIX.test(evmReady)) return { kind: "evm-prefix", prefix: evmReady.toLowerCase(), text: compact };
  if (SOL_PREFIX.test(compact) && (compact.length >= 20 || /\d/.test(compact))) {
    return { kind: "solana-prefix", prefix: compact, text: compact };
  }
  return null;
}

function unwrap(value) {
  let text = String(value ?? "").trim().replace(LABEL, "").trim();
  for (let i = 0; i < 2; i++) {
    const next = text.replace(WRAP, "").trim();
    if (next === text) break;
    text = next;
  }
  return text;
}

function boundedMatch(source, pattern, flags = "g") {
  const re = new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`);
  let match;
  while ((match = re.exec(source))) {
    const start = match.index;
    const end = start + match[0].length;
    const before = start > 0 ? source[start - 1] : "";
    const after = end < source.length ? source[end] : "";
    const edge = (ch) => ch === "" || /[^A-Za-z0-9]/.test(ch);
    if (edge(before) && edge(after)) return match[0];
    if (re.lastIndex === match.index) re.lastIndex += 1;
  }
  return "";
}

function fromUrl(text) {
  if (!/^https?:\/\//i.test(text)) return "";
  try {
    const url = new URL(text);
    const hinted = url.searchParams.get("address")
      || url.searchParams.get("mint")
      || url.searchParams.get("token")
      || url.searchParams.get("q")
      || "";
    if (hinted.trim()) return unwrap(decodeURIComponent(hinted.trim()));
    const parts = url.pathname.split("/").filter(Boolean);
    return unwrap(decodeURIComponent(parts[parts.length - 1] || ""));
  } catch {
    return "";
  }
}

export function parseAddressQuery(raw) {
  const original = String(raw ?? "").trim();
  if (!original) return emptyQuery();
  const unwrapped = unwrap(original);
  const embeddedSource = fromUrl(unwrapped) || unwrapped;
  const direct = classifyCompact(embeddedSource);
  if (direct) return direct;
  const compact = embeddedSource.replace(INVISIBLE, "");
  if (compact !== embeddedSource) {
    const folded = classifyCompact(compact);
    if (folded) return folded;
  }
  const evm = boundedMatch(embeddedSource, "0x[a-fA-F0-9]{40}", "gi");
  if (evm) {
    const hit = classifyCompact(evm);
    if (hit) return hit;
  }
  const sol = boundedMatch(embeddedSource, "[1-9A-HJ-NP-Za-km-z]{32,44}");
  if (sol) {
    const hit = classifyCompact(sol);
    if (hit) return hit;
  }
  return { kind: "text", text: original };
}

export function isAddressQuery(parsed) {
  return parsed.kind === "evm"
    || parsed.kind === "solana"
    || parsed.kind === "evm-prefix"
    || parsed.kind === "solana-prefix";
}

function candidateAddresses(token) {
  const values = [
    token?.baseToken?.address,
    token?.pairAddress,
    token?.bondingCurvePda,
    token?.mint,
  ];
  const out = [];
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) out.push(text);
  }
  return out;
}

function recency(token) {
  const raw = Number(token?.pairCreatedAt);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return raw < 1e11 ? raw * 1000 : raw;
}

function prefixHit(stored, parsed) {
  if (parsed.kind === "evm-prefix") return stored.toLowerCase().startsWith(parsed.prefix);
  if (parsed.kind === "solana-prefix") return stored.startsWith(parsed.prefix) || stored.endsWith(parsed.prefix);
  return false;
}

/**
 * @param {unknown[]} tokens
 * @param {{ kind: string, address?: string, prefix?: string }} parsed
 */
export function collectAddressMatches(tokens, parsed) {
  const list = Array.isArray(tokens) ? tokens : [];
  if (!isAddressQuery(parsed)) return { tokens: [], ambiguous: false, truncated: false };

  if (parsed.kind === "evm" || parsed.kind === "solana") {
    const exact = [];
    const folded = [];
    const distinct = new Set();
    const want = parsed.address;
    const wantFold = String(want).toLowerCase();
    for (const token of list) {
      const fields = candidateAddresses(token);
      if (fields.some((field) => field === want)) {
        exact.push(token);
        continue;
      }
      const foldedField = fields.find((field) => field.toLowerCase() === wantFold);
      if (foldedField) {
        folded.push(token);
        distinct.add(foldedField);
      }
    }
    if (exact.length) return { tokens: exact, ambiguous: false, truncated: false };
    if (parsed.kind === "solana" && distinct.size > 1) {
      return { tokens: [], ambiguous: true, truncated: false };
    }
    return { tokens: folded, ambiguous: false, truncated: false };
  }

  const hits = [];
  for (const token of list) {
    if (candidateAddresses(token).some((field) => prefixHit(field, parsed))) hits.push(token);
  }
  hits.sort((a, b) => recency(b) - recency(a));
  const truncated = hits.length > ADDRESS_PREFIX_CAP;
  return { tokens: truncated ? hits.slice(0, ADDRESS_PREFIX_CAP) : hits, ambiguous: false, truncated };
}

export function tokensMatchingQuery(tokens, query) {
  const list = Array.isArray(tokens) ? tokens : [];
  const parsed = parseAddressQuery(query) || { kind: "text", text: String(query ?? "").trim() };
  if (parsed.kind === "empty") return { mode: "all", matches: list, parsed, ambiguous: false, truncated: false };
  if (!isAddressQuery(parsed)) return { mode: "text", matches: [], parsed, ambiguous: false, truncated: false };
  const found = collectAddressMatches(list, parsed);
  return { mode: "address", matches: found.tokens, parsed, ambiguous: found.ambiguous, truncated: found.truncated };
}

function looksLikeAddressFragment(raw) {
  const q = String(raw || "").trim();
  if (/^0x[a-fA-F0-9]{4,64}$/i.test(q)) return { kind: "evm", value: q.toLowerCase() };
  // A ticker is letters. A mint fragment is long, or it contains a digit.
  if (/^[1-9A-HJ-NP-Za-km-z]{8,44}$/.test(q) && (q.length >= 20 || /\d/.test(q))) {
    return { kind: "sol", value: q };
  }
  return null;
}

function fragmentHit(token, frag) {
  if (!frag) return false;
  const fields = candidateAddresses(token);
  if (frag.kind === "evm") {
    const bare = frag.value.slice(2);
    return fields.some((field) => {
      const f = field.toLowerCase();
      if (!f.startsWith("0x")) return false;
      return f.startsWith(frag.value) || (bare.length >= 6 && f.slice(2).endsWith(bare));
    });
  }
  return fields.some((field) => field.startsWith(frag.value) || field.endsWith(frag.value));
}

function textHit(token, q) {
  const symbol = String(token?.baseToken?.symbol || "").trim();
  const name = String(token?.baseToken?.name || "").trim();
  // A dumped catalog (thousands of tickers in one field) is not a match for a word inside it.
  if (symbol && symbol.length <= 24) {
    const sl = symbol.replace(/^\$+/, "").toLowerCase();
    const extra = sl.length - q.length;
    if (sl === q || sl.startsWith(q) || (extra > 0 && extra <= 4 && sl.endsWith(q))) return true;
  }
  if (!name || name.length > 80) return false;
  // Word start, so "gram" matches "Gram Token" and "HermesWorld", not "telegram" or a mint.
  const needle = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const spaced = name.replace(/([a-z\d])([A-Z])/g, "$1 $2");
  return new RegExp(`(?:^|[^a-z0-9])${needle}`, "i").test(spaced);
}

/**
 * One search box: name, ticker, or a real contract / mint / pair.
 * A short word is never treated as an address fragment, so "GRAM" does not
 * hit every mint that happens to contain those letters.
 */
export function matchesUserQuery(token, query) {
  const parsed = parseAddressQuery(query);
  if (!parsed || parsed.kind === "empty") return false;
  if (isAddressQuery(parsed)) {
    const found = collectAddressMatches([token], parsed);
    return !found.ambiguous && found.tokens.length > 0;
  }
  const text = String(parsed.text || "").trim();
  if (textHit(token, text.toLowerCase())) return true;
  return fragmentHit(token, looksLikeAddressFragment(text));
}

/** Lower numbers are better. Exact ticker, then exact name, then a mint fragment, then a loose name. */
export function searchRank(token, query) {
  const parsed = parseAddressQuery(query);
  if (!parsed || parsed.kind === "empty") return 9;
  if (isAddressQuery(parsed)) return matchesUserQuery(token, query) ? 0 : 9;
  const q = String(parsed.text || "").trim().toLowerCase();
  const symbol = String(token?.baseToken?.symbol || "").replace(/^\$+/, "").trim().toLowerCase();
  const name = String(token?.baseToken?.name || "").trim().toLowerCase();
  if (symbol && symbol.length <= 24 && symbol === q) return 0;
  if (name && name.length <= 80 && name === q) return 1;
  if (symbol && symbol.length <= 24 && (symbol.startsWith(q) || (symbol.endsWith(q) && symbol.length - q.length > 0 && symbol.length - q.length <= 4))) return 2;
  if (fragmentHit(token, looksLikeAddressFragment(parsed.text))) return 3;
  if (textHit(token, q)) return 4;
  return 9;
}

// Address lookups return the coin even when browse filters would hide it.
// Name and symbol search still goes through the filter function.
/**
 * @template T
 * @param {T[]} tokens
 * @param {string} query
 * @param {any} filters
 * @param {(rows: T[], filters: any) => T[]} applyFilters
 * @returns {T[]}
 */
export function resolveBrowseQuery(tokens, query, filters, applyFilters) {
  const picked = tokensMatchingQuery(tokens, query);
  if (picked.ambiguous) return [];
  if (picked.mode === "address") return picked.matches.slice();
  const source = picked.mode === "all" ? picked.matches : (Array.isArray(tokens) ? tokens : []);
  let rows = typeof applyFilters === "function" ? applyFilters(source, filters) : source.slice();
  if (picked.mode === "text") {
    rows = rows.filter((token) => matchesUserQuery(token, picked.parsed.text));
  }
  return rows;
}
