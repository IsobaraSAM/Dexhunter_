import { chromium } from "playwright";

const base = "http://127.0.0.1:8080";
const pageData = await (await fetch(`${base}/api/discovery?mode=latest&age=all&limit=15&chain=solana&shape=browse`)).json();
const token = (pageData.tokens || []).find((row) => row?.baseToken?.address && row?.baseToken?.symbol);
if (!token) {
  console.error("no token");
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(20000);
const failures = [];
try {
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => /ago|Nothing qualifies|No token/.test(document.body.innerText));
  await page.click("#btn_open_filters_modal");
  await page.waitForFunction(() => document.querySelector("#btn_open_filters_modal")?.getAttribute("aria-expanded") === "true");
  await page.waitForSelector("#filter_drawer_modal");
  await page.locator("#filter_drawer_modal button", { hasText: "Ethereum" }).first().evaluate((el) => el.click());
  await page.click("#btn_apply_filters_modal");
  await page.waitForTimeout(400);
  const searchBtn = page.locator("#btn_toggle_search");
  if (await searchBtn.count()) await searchBtn.click();
  else await page.click("#btn_toggle_search_mobile");
  await page.waitForSelector("#input_search_query");
  await page.fill("#input_search_query", token.baseToken.address);
  await page.click("#btn_execute_search");
  await page.waitForFunction((symbol) => document.body.innerText.includes(symbol), token.baseToken.symbol, { timeout: 20000 });
  console.log("PASS typed", token.baseToken.symbol, "through the filter drawer");

  const searchAgain = page.locator("#btn_toggle_search");
  if (await searchAgain.count()) await searchAgain.click();
  else await page.click("#btn_toggle_search_mobile");
  await page.waitForSelector("#input_search_query");
  await page.fill("#input_search_query", "zzzz-not-a-coin-zzzz");
  await page.click("#btn_execute_search");
  await page.waitForFunction(() => {
    const note = document.querySelector("#search_empty_note")?.textContent || "";
    return /Nothing matched|No match/.test(note);
  }, null, { timeout: 30000 });
  console.log("PASS unknown text search stays empty");
  const stale = await page.locator("body").innerText();
  if (stale.includes(token.baseToken.address.slice(0, 8))) failures.push("previous CA stayed on screen after a different search");
  else console.log("PASS previous CA did not stick");
  await page.screenshot({ path: "/workspace/screenshots/ca-ui-search.png" });
} catch (err) {
  failures.push(err instanceof Error ? err.message : String(err));
  await page.screenshot({ path: "/workspace/screenshots/ca-ui-search.png" }).catch(() => {});
} finally {
  await browser.close();
}
if (failures.length) {
  console.log(failures.join("\n"));
  process.exit(1);
}
console.log("ui address stress passed");
