#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";
const ART = "/workspace/artifacts/device-qa";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });

async function grabCoin(page) {
  for (let i = 0; i < 40; i++) {
    const coin = await page.evaluate(() => {
      const btn = document.querySelector("button[id^='btn_copy_']");
      if (btn) {
        const root = btn.closest("div");
        let n = btn;
        let symbol = "";
        for (let k = 0; k < 8 && n; k++) {
          const h = n.querySelector?.("h3");
          if (h && h.textContent.trim()) { symbol = h.textContent.trim(); break; }
          n = n.parentElement;
        }
        return { symbol, address: btn.id.replace(/^btn_copy_/, ""), via: "card" };
      }
      const b2 = [...document.querySelectorAll("button")].find((b) => (b.getAttribute("title") || "").startsWith("Copy CA:") && b.getBoundingClientRect().width > 0);
      if (b2) {
        const row = b2.closest("tr") || b2.closest(".cursor-pointer");
        const symbol = (row?.querySelector("span.font-bold, h3")?.textContent || "").trim();
        return { symbol, address: b2.getAttribute("title").replace(/^Copy CA:\s*/, ""), via: "row-title" };
      }
      return null;
    });
    if (coin?.address && coin.symbol && coin.symbol !== "—") return coin;
    await page.waitForTimeout(500);
  }
  return null;
}

async function run(width, height, name) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.locator("#tab_latest").click();
  // if cards are slow, compact rows still expose Copy CA titles
  await page.waitForTimeout(500);
  let coin = await grabCoin(page);
  if (!coin) {
    await page.locator("#btn_view_compact").click();
    coin = await grabCoin(page);
  }
  const result = { coin };
  if (!coin) {
    result.shot = `${ART}/${name}-search-missing.png`;
    await page.screenshot({ path: result.shot, fullPage: false });
    await ctx.close();
    return result;
  }
  const trigger = width >= 1280 ? "#btn_toggle_search" : "#btn_toggle_search_mobile";
  async function search(q) {
    if (!(await page.locator("#input_search_query").isVisible().catch(() => false))) await page.locator(trigger).click();
    const input = page.locator("#input_search_query");
    await input.waitFor({ state: "visible", timeout: 5000 });
    await page.waitForTimeout(400);
    await input.fill(q);
    const value = await input.inputValue();
    await page.locator("#btn_execute_search").click();
    let last = null;
    for (let i = 0; i < 30; i++) {
      last = await page.evaluate((query) => {
        const collapsed = (document.getElementById("search_panel_collapsed")?.innerText || "").replace(/\s+/g, " ").trim();
        const symbols = [...new Set([...document.querySelectorAll("h3, tbody span.font-bold, span.font-bold.font-mono")].map((el) => (el.textContent || "").trim()).filter((t) => t && t.length < 18 && !t.startsWith("$")))];
        const copies = document.querySelectorAll("button[id^='btn_copy_'], button[title^='Copy CA:']").length;
        return { collapsed: collapsed.slice(0, 160), symbols: symbols.slice(0, 10), copies, matched: collapsed.toLowerCase().includes(query.toLowerCase()) || collapsed.includes(query.slice(0, 6)) };
      }, q);
      if (last.matched) break;
      await page.waitForTimeout(400);
    }
    return { value, last };
  }
  result.ticker = await search(coin.symbol);
  await page.screenshot({ path: `${ART}/${name}-search-ticker.png`, fullPage: false });
  if (await page.locator("#btn_clear_search_collapsed").isVisible().catch(() => false)) await page.locator("#btn_clear_search_collapsed").click();
  await page.waitForTimeout(600);
  result.ca = await search(coin.address);
  await page.screenshot({ path: `${ART}/${name}-search-ca.png`, fullPage: false });
  const found = await page.evaluate((c) => {
    const id = document.getElementById("btn_copy_" + c.address);
    const title = document.querySelector(`button[title="Copy CA: ${c.address}"]`);
    const syms = [...document.querySelectorAll("h3, span.font-bold")].map((el) => (el.textContent || "").trim());
    return { id: Boolean(id), title: Boolean(title), sym: syms.some((s) => s.toLowerCase() === c.symbol.toLowerCase()) };
  }, coin);
  result.found = found;
  await ctx.close();
  return result;
}

const out = {};
try {
  out["768"] = await run(768, 1024, "768x1024");
  console.log("768", JSON.stringify(out["768"], null, 2).slice(0, 2500));
  out["1280"] = await run(1280, 800, "1280x800");
  console.log("1280", JSON.stringify(out["1280"], null, 2).slice(0, 2500));
} finally {
  await browser.close();
  writeFileSync("/tmp/device-qa-4.json", JSON.stringify(out, null, 2));
}
