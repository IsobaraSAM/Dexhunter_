import { chromium } from "playwright";

const base = process.env.DEX_BASE || "http://127.0.0.1:8080";
const failures = [];

function fail(message) {
  failures.push(message);
  console.log("FAIL", message);
}

async function tokenFrom(path) {
  const res = await fetch(`${base}${path}`);
  const data = await res.json();
  return (data.tokens || []).find((token) => token?.baseToken?.address && token?.baseToken?.symbol);
}

const sol = await tokenFrom("/api/discovery?mode=latest&age=all&limit=30&chain=solana&shape=browse");
const evm = await tokenFrom("/api/discovery?mode=latest&age=all&limit=20&chain=robinhood&shape=browse")
  || await tokenFrom("/api/discovery?mode=trending&age=1w&limit=40&shape=browse");
if (!sol?.baseToken?.address) {
  console.error("no solana token to search");
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(20000);

async function openSearch(query) {
  const params = new URLSearchParams({
    q: query,
    chain: "ethereum",
    minMarketCap: "900000000",
    age: "1h",
    tg: "1",
    dex: "uniswap",
  });
  await page.goto(`${base}/?${params}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
}

try {
  await openSearch(sol.baseToken.address);
  await page.waitForFunction((symbol) => document.body.innerText.includes(symbol), sol.baseToken.symbol, { timeout: 20000 });
  console.log("PASS hostile filters still show", sol.baseToken.symbol);

  if (evm?.baseToken?.address && evm.chainId !== "ethereum") {
    await openSearch(`ca: ${evm.baseToken.address}`);
    await page.waitForFunction((symbol) => document.body.innerText.includes(symbol), evm.baseToken.symbol, { timeout: 20000 }).catch(() => null);
    const text = await page.locator("body").innerText();
    if (!text.includes(evm.baseToken.symbol)) fail(`labeled ${evm.chainId} CA ${evm.baseToken.symbol} did not show`);
    else console.log("PASS ca: label", evm.chainId, evm.baseToken.symbol);
  }

  const spaced = `${sol.baseToken.address.slice(0, 12)} ${sol.baseToken.address.slice(12)}`;
  await openSearch(spaced);
  await page.waitForFunction((symbol) => document.body.innerText.includes(symbol), sol.baseToken.symbol, { timeout: 20000 }).catch(() => null);
  const spacedText = await page.locator("body").innerText();
  if (!spacedText.includes(sol.baseToken.symbol)) fail(`spaced mint did not find ${sol.baseToken.symbol}`);
  else console.log("PASS spaced mint");

  await page.goto(`${base}/?q=${encodeURIComponent(sol.baseToken.symbol)}&chain=ethereum`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const nameText = await page.locator("body").innerText();
  if (nameText.includes(sol.baseToken.address.slice(0, 6)) && sol.chainId === "solana") {
    fail(`symbol search ${sol.baseToken.symbol} ignored the ethereum chain filter`);
  } else console.log("PASS symbol search respects a different chain filter");

  const prefix = sol.baseToken.address.slice(0, 16);
  await page.goto(`${base}/?q=${encodeURIComponent(prefix)}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction((symbol) => document.body.innerText.includes(symbol), sol.baseToken.symbol, { timeout: 20000 }).catch(() => null);
  const prefixText = await page.locator("body").innerText();
  if (!prefixText.includes(sol.baseToken.symbol)) fail(`prefix ${prefix} missed ${sol.baseToken.symbol}`);
  else console.log("PASS prefix", prefix);

  await page.screenshot({ path: "/workspace/screenshots/ca-filter-bypass.png", fullPage: false });
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
  await page.screenshot({ path: "/workspace/screenshots/ca-filter-bypass.png", fullPage: false }).catch(() => {});
} finally {
  await browser.close();
}

console.log(failures.length ? `browser failures ${failures.length}` : "browser address stress passed");
if (failures.length) process.exit(1);
