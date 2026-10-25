// @ts-nocheck
import fs from "fs";
import os from "os";
import path from "path";
import { chainTokenKey } from "../src/lib/addressCase.js";

// Keep the cache out of the project tree. Writes under the repo make Vite
// reload the page, which cancels the feed request before it can paint.
const DATA_DIR = path.join(os.tmpdir(), "dexhunter");
export const INDEX_FILE = path.join(DATA_DIR, "discovery-index.json");
export const PUMP_CURSOR_FILE = path.join(DATA_DIR, "pump-cursor.json");
export const PUMP_META_FILE = path.join(DATA_DIR, "pump-meta-retry.json");
export const MAX_TOKENS = 8000;

export function loadIndex(file = INDEX_FILE) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.tokens)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveIndex(file, data) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, file);
}

const ONCHAIN_CHAINS = ["solana", "robinhood", "arc", "bsc"];

export function retainTokens(tokens, max = MAX_TOKENS) {
  const list = Array.isArray(tokens) ? tokens : [];
  const onchain = [];
  const search = [];
  const seen = new Set();
  for (const token of list) {
    const addr = token?.baseToken?.address;
    const chain = token?.chainId || "";
    if (!addr) continue;
    const key = chainTokenKey(chain, addr);
    if (seen.has(key)) continue;
    seen.add(key);
    if (token.discoveryMode === "onchain") onchain.push(token);
    else search.push(token);
  }
  const byTime = (a, b) => (b.pairCreatedAt || b.firstSeenAt || 0) - (a.pairCreatedAt || a.firstSeenAt || 0);
  onchain.sort(byTime);
  search.sort(byTime);
  const buckets = new Map();
  for (const token of onchain) {
    const chain = String(token.chainId || "other").toLowerCase();
    if (!buckets.has(chain)) buckets.set(chain, []);
    buckets.get(chain).push(token);
  }
  // Each live launch chain keeps a share, so a burst of new Pump or Pons
  // rows cannot delete the Arc book. The leftover slots stay newest-first.
  let floor = Math.max(1, Math.floor(max / (ONCHAIN_CHAINS.length + 1)));
  while (ONCHAIN_CHAINS.length * floor > max && floor > 0) floor -= 1;
  const kept = [];
  const used = new Set();
  for (const chain of ONCHAIN_CHAINS) {
    const rows = buckets.get(chain) || [];
    for (const row of rows.slice(0, floor)) {
      kept.push(row);
      used.add(row);
    }
  }
  for (const row of onchain) {
    if (kept.length >= max) break;
    if (used.has(row)) continue;
    kept.push(row);
    used.add(row);
  }
  for (const row of search) {
    if (kept.length >= max) break;
    kept.push(row);
  }
  return kept.slice(0, max);
}

export function mergeSeedTokens(base, extra) {
  const tokens = Array.isArray(base) ? base.slice() : [];
  const seen = new Set();
  for (const token of tokens) {
    const addr = token?.baseToken?.address;
    if (!addr) continue;
    seen.add(chainTokenKey(token.chainId, addr));
  }
  let added = 0;
  for (const token of Array.isArray(extra) ? extra : []) {
    const addr = token?.baseToken?.address;
    if (!addr) continue;
    const key = chainTokenKey(token.chainId, addr);
    if (seen.has(key)) continue;
    seen.add(key);
    tokens.push(token);
    added += 1;
  }
  return { tokens, added };
}

// The live cache lives in tmp so writes do not reload Vite. A fresh process
// would otherwise start empty and hide the launches already discovered.
export function seedRuntimeCache(seedDir = path.join(process.cwd(), "data")) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(INDEX_FILE)) {
      const discoveryPath = path.join(seedDir, "discovery-index.json");
      if (fs.existsSync(discoveryPath)) {
        const parsed = JSON.parse(fs.readFileSync(discoveryPath, "utf8"));
        if (parsed && parsed.version === 1 && Array.isArray(parsed.tokens)) {
          const ponsPath = path.join(seedDir, "pons-index.json");
          if (fs.existsSync(ponsPath)) {
            const pons = JSON.parse(fs.readFileSync(ponsPath, "utf8"));
            const merged = mergeSeedTokens(parsed.tokens, pons?.tokens);
            parsed.tokens = merged.tokens;
            if (merged.added) {
              console.log(`[index] seeded ${merged.added} Pons launches missing from the discovery snapshot`);
            }
          }
          saveIndex(INDEX_FILE, parsed);
          console.log(`[index] seeded ${parsed.tokens.length} tokens into the runtime cache`);
        }
      }
    }
    if (!fs.existsSync(PUMP_CURSOR_FILE)) {
      const cursorPath = path.join(seedDir, "pump-cursor.json");
      if (fs.existsSync(cursorPath)) fs.copyFileSync(cursorPath, PUMP_CURSOR_FILE);
    }
  } catch (err) {
    console.warn("[index] seed skipped:", err?.message || err);
  }
}

export function readPumpCursorState(file = PUMP_CURSOR_FILE) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return {
      signature: typeof parsed?.signature === "string" ? parsed.signature : "",
      pendingBefore: typeof parsed?.pendingBefore === "string" ? parsed.pendingBefore : "",
      pendingHead: typeof parsed?.pendingHead === "string" ? parsed.pendingHead : "",
    };
  } catch {
    return { signature: "", pendingBefore: "", pendingHead: "" };
  }
}

export function readPumpCursor(file = PUMP_CURSOR_FILE) {
  return readPumpCursorState(file).signature;
}

export function readPumpMetaJobs(file = PUMP_META_FILE) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.jobs)) return [];
    return parsed.jobs.filter((job) => job && typeof job.mint === "string" && typeof job.uri === "string");
  } catch {
    return [];
  }
}

export function writePumpMetaJobs(jobs, file = PUMP_META_FILE) {
  const list = (Array.isArray(jobs) ? jobs : []).filter((job) => job && job.mint && job.uri).slice(0, 500);
  saveIndex(file, { version: 1, jobs: list });
}

export function writePumpCursor(signature, file = PUMP_CURSOR_FILE, extra = {}) {
  if (!signature && !extra.pendingBefore) return;
  saveIndex(file, {
    signature: signature || "",
    pendingBefore: extra.pendingBefore || "",
    pendingHead: extra.pendingHead || "",
    savedAt: Date.now(),
  });
}
