// @ts-nocheck
// Placeholders that must not be shown as a real token name or symbol.
const BAD_NAMES = new Set(["argus", "arc", "pump token", "unknown"]);
const BAD_SYMBOLS = new Set(["arc", "argus", "pump"]);

function badName(value, addr) {
  if (!value || typeof value !== "string") return true;
  const v = value.trim();
  if (!v || v === "…" || BAD_NAMES.has(v.toLowerCase())) return true;
  if (/^0x[a-fA-F0-9]{40}$/.test(v)) return true;
  if (addr && (v.toLowerCase() === String(addr).toLowerCase() || v.toLowerCase() === String(addr).slice(0, 6).toLowerCase() || v.toLowerCase() === String(addr).slice(0, 8).toLowerCase())) return true;
  return false;
}

function badSymbol(value) {
  if (!value || typeof value !== "string") return true;
  const v = value.trim();
  return !v || v === "…" || BAD_SYMBOLS.has(v.toLowerCase());
}

export function pickName(next, prev, addr) {
  if (!badName(next, addr)) return next.trim();
  if (!badName(prev, addr)) return prev.trim();
  return "";
}

export function pickSymbol(next, prev) {
  if (!badSymbol(next)) return next.trim();
  if (!badSymbol(prev)) return prev.trim();
  return "";
}
