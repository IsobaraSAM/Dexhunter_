// Live contract-search stress. Uses indexOnly so a miss does not fan out to chain RPCs.
import { parseAddressQuery } from "../src/lib/addressQuery.js";

const base = process.env.DEX_BASE || "http://127.0.0.1:8080";

async function getJson(path) {
  const res = await fetch(`${base}${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${data.error || ""}`);
  return data;
}

function isEvm(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function shapes(address) {
  const out = [
    address,
    `ca: ${address}`,
    `"${address}"`,
    `https://dexscreener.com/solana/${address}`,
  ];
  if (address.length > 20) out.push(`${address.slice(0, 12)} ${address.slice(12)}`);
  if (isEvm(address)) out.push(address.toLowerCase(), `0X${address.slice(2).toUpperCase()}`);
  else {
    const lower = address.toLowerCase();
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(lower)) out.push(lower);
    const flipped = address.replace(/[A-HJ-NP-Z]/, (ch) => ch.toLowerCase());
    if (flipped !== address && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(flipped)) out.push(flipped);
  }
  return out;
}

async function lookup(query, chain = "all") {
  const chainParam = chain && chain !== "all" ? `&chain=${encodeURIComponent(chain)}` : "";
  return getJson(`/api/discovery?address=${encodeURIComponent(query)}${chainParam}&indexOnly=1&shape=browse`);
}

function hasAddress(data, address) {
  const want = address.toLowerCase();
  return (data.tokens || []).some((token) => {
    const fields = [token?.baseToken?.address, token?.pairAddress, token?.bondingCurvePda];
    return fields.some((field) => String(field || "").toLowerCase() === want || String(field || "") === address);
  });
}

async function mapPool(items, limit, worker) {
  const queue = items.slice();
  const errors = [];
  async function run() {
    while (queue.length) {
      const item = queue.shift();
      try {
        await worker(item);
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }
  }
  await Promise.all(Array.from({ length: limit }, run));
  return errors;
}

const pages = await Promise.all([
  getJson("/api/discovery?mode=latest&age=all&limit=60&shape=browse"),
  getJson("/api/discovery?mode=trending&age=1w&limit=40&shape=browse"),
  getJson("/api/discovery?mode=fresh_mints&age=all&limit=30&shape=browse"),
]);

const seen = new Set();
const tokens = [];
for (const page of pages) {
  for (const token of page.tokens || []) {
    const address = String(token?.baseToken?.address || "").trim();
    const chain = String(token?.chainId || "").toLowerCase();
    if (!address || seen.has(`${chain}:${address}`)) continue;
    seen.add(`${chain}:${address}`);
    tokens.push({ address, chain, symbol: token?.baseToken?.symbol || "" });
  }
}

if (tokens.length < 8) {
  console.error(`only ${tokens.length} tokens in the live index`);
  process.exit(1);
}

const picked = [];
const perChain = {};
for (const token of tokens) {
  const used = perChain[token.chain] || 0;
  if (used >= 3) continue;
  perChain[token.chain] = used + 1;
  picked.push(token);
  if (picked.length >= 24) break;
}

console.log(`sampled ${picked.length} of ${tokens.length}`, perChain);

const failures = [];
const started = Date.now();
let checks = 0;

const errors = await mapPool(picked, 3, async (token) => {
  const exact = await lookup(token.address, "all");
  checks += 1;
  if (!hasAddress(exact, token.address)) {
    failures.push(`skip-churn ${token.chain} ${token.symbol} ${token.address}`);
    return;
  }
  for (const query of shapes(token.address).slice(1)) {
    checks += 1;
    const data = await lookup(query, "all");
    if (!hasAddress(data, token.address)) {
      failures.push(`miss ${token.chain} ${token.symbol} query=${query.slice(0, 96)}`);
    }
  }
  checks += 1;
  const sameChain = await lookup(token.address, token.chain || "all");
  if (!hasAddress(sameChain, token.address)) {
    failures.push(`chain filter dropped ${token.chain} ${token.address}`);
  }
  const other = token.chain === "solana" ? "ethereum" : "solana";
  checks += 1;
  const wrongChain = await lookup(token.address, other);
  if ((wrongChain.tokens || []).length > 0 && hasAddress(wrongChain, token.address)) {
    failures.push(`wrong chain ${other} still returned ${token.chain} ${token.address}`);
  }
  if (token.address.length >= 20) {
    const prefix = token.address.slice(0, 16);
    if (parseAddressQuery(prefix).kind.endsWith("prefix")) {
      checks += 1;
      const prefixed = await lookup(prefix, "all");
      if (!hasAddress(prefixed, token.address) && (prefixed.tokens || []).length < 40) {
        failures.push(`prefix ${prefix} missed ${token.chain} ${token.symbol} (${(prefixed.tokens || []).length} hits)`);
      }
    }
  }
  const mutated = `${token.address.slice(0, -1)}${token.address.endsWith("1") ? "2" : "1"}`;
  if (mutated !== token.address) {
    checks += 1;
    const near = await lookup(mutated, "all");
    if (hasAddress(near, token.address)) {
      failures.push(`near-miss ${mutated} returned ${token.address}`);
    }
  }
});

failures.push(...errors);
const elapsed = Date.now() - started;
console.log(`checks=${checks} failures=${failures.length} ms=${elapsed}`);
const real = failures.filter((item) => !item.startsWith("skip-churn"));
const churn = failures.length - real.length;
console.log(`churn-skips=${churn} real-failures=${real.length}`);
for (const failure of real.slice(0, 30)) console.log("FAIL", failure);
if (real.length) process.exit(1);
console.log("live address stress passed");
