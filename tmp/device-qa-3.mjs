#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";

const ART = "/workspace/artifacts/device-qa";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });

async function shot(page, name) {
  const p = `${ART}/${name}.png`;
  await page.screenshot({ path: p, fullPage: false });
  return p;
}

async function openAndFill(page, width, value) {
  const id = width >= 1280 ? "#btn_toggle_search" : "#btn_toggle_search_mobile";
  if (!(await page.locator("#input_search_query").isVisible().catch(() => false))) {
    await page.locator(id).click();
  }
  const input = page.locator("#input_search_query");
  await input.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(600);
  await input.fill(value);
  await page.waitForTimeout(200);
  const got = await input.inputValue();
  await page.locator("#btn_execute_search").click();
  return got;
}

async function waitQuery(page, query, timeout = 15000) {
  const start = Date.now();
  let last = null;
  while (Date.now() - start < timeout) {
    last = await page.evaluate((q) => {
      const collapsed = (document.getElementById("search_panel_collapsed")?.innerText || "").replace(/\s+/g, " ").trim();
      const input = document.getElementById("input_search_query");
      const inputVisible = Boolean(input && input.getBoundingClientRect().width > 0);
      const symbols = [];
      document.querySelectorAll("h3, span.font-bold").forEach((el) => {
        const t = (el.textContent || "").trim();
        if (t && t.length < 20 && !t.startsWith("$")) symbols.push(t);
      });
      const uniq = [...new Set(symbols)].filter((s) => !["NEW", "REUSED", "≤7d", "DexHunter"].includes(s)).slice(0, 15);
      const copies = document.querySelectorAll("button[id^='btn_copy_'], [aria-label='Copy Contract Address'], button[title^='Copy CA:']").length;
      return { collapsed: collapsed.slice(0, 180), inputVisible, inputValue: input?.value || "", uniq, copies, hasQuery: collapsed.includes(q) || collapsed.toLowerCase().includes(q.toLowerCase()) };
    }, query);
    if (last.hasQuery || (last.inputVisible && last.inputValue === query && Date.now() - start > 2500)) {
      // if still expanded after 2.5s, keep waiting a bit more unless collapsed
      if (last.hasQuery) break;
    }
    if (last.hasQuery) break;
    await page.waitForTimeout(300);
  }
  return { ...last, waitedMs: Date.now() - start };
}

const out = {};
try {
  // 768 layout + search
  {
    const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => { if (m.type()==="error") errors.push(m.text().slice(0, 220)); });
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 220)));
    await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector("#index_window_count", { timeout: 20000 });
    await page.waitForTimeout(1500);
    await page.locator("#tab_latest").click();
    await page.waitForTimeout(2000);
    const probe = await page.evaluate(() => {
      const h3 = [...document.querySelectorAll("h3")].map((h) => h.textContent.trim()).slice(0, 8);
      const copies = [...document.querySelectorAll("button[id^='btn_copy_']")].slice(0, 3).map((b) => b.id);
      const titles = [...document.querySelectorAll("button[title^='Copy CA:']")].slice(0, 3).map((b) => b.getAttribute("title"));
      const table = document.querySelector("table");
      const tableWrap = table?.parentElement;
      const mobile = document.querySelector(".divide-y");
      const vis = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return { display: s.display, w: Math.round(r.width), h: Math.round(r.height), sw: el.scrollWidth, cw: el.clientWidth };
      };
      return { h3, copies, titles, wc: document.getElementById("index_window_count")?.textContent?.trim(), table: vis(table), wrap: vis(tableWrap), mobile: vis(mobile) };
    });
    const coin = await page.evaluate(() => {
      const btn = document.querySelector("button[id^='btn_copy_']");
      const h3 = document.querySelector("h3");
      if (btn && h3) return { symbol: h3.textContent.trim(), address: btn.id.slice(9), via: "card" };
      const b2 = document.querySelector("button[title^='Copy CA:']");
      const sym = document.querySelector("span.font-bold");
      if (b2) return { symbol: (sym?.textContent || "").trim(), address: b2.getAttribute("title").replace(/^Copy CA:\s*/, ""), via: "compact" };
      return null;
    });
    let search = { coin, probe };
    if (coin) {
      const typed = await openAndFill(page, 768, coin.symbol);
      const ticker = await waitQuery(page, coin.symbol);
      const tickerShot = await shot(page, "768x1024-search-ticker");
      const clear = page.locator("#btn_clear_search_collapsed");
      if (await clear.isVisible().catch(() => false)) await clear.click();
      else if (await page.locator("#btn_close_search_panel").isVisible().catch(() => false)) await page.locator("#btn_close_search_panel").click();
      await page.waitForTimeout(800);
      const typedCa = await openAndFill(page, 768, coin.address);
      const ca = await waitQuery(page, coin.address.slice(0, 8));
      const caShot = await shot(page, "768x1024-search-ca");
      search = { coin, typed, ticker, tickerShot, typedCa, ca, caShot, probe };
    }
    // compact measure
    if (await page.locator("#btn_clear_search_collapsed").isVisible().catch(() => false)) await page.locator("#btn_clear_search_collapsed").click();
    await page.locator("#btn_view_compact").click();
    await page.waitForTimeout(600);
    const compact = await page.evaluate(() => {
      const table = document.querySelector("table");
      const wrap = table?.closest(".overflow-x-auto") || table?.parentElement;
      const mobileRows = document.querySelectorAll(".md\\:hidden .cursor-pointer, .divide-y > div");
      let mobileVisible = 0;
      mobileRows.forEach((el) => { if (el.getBoundingClientRect().height > 20 && getComputedStyle(el).display !== "none") mobileVisible++; });
      const trs = [...document.querySelectorAll("tbody tr")].filter((tr) => tr.getBoundingClientRect().height > 10);
      const r = (el) => el ? { display: getComputedStyle(el).display, sw: el.scrollWidth, cw: el.clientWidth, right: Math.round(el.getBoundingClientRect().right), w: Math.round(el.getBoundingClientRect().width) } : null;
      return {
        doc: { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, iw: innerWidth },
        wrap: r(wrap),
        table: r(table),
        visibleRows: trs.length,
        mobileVisible,
        wrapClass: wrap ? String(wrap.className).slice(0, 100) : null,
      };
    });
    const compactShot = await shot(page, "768x1024-view-compact");
    out["768"] = { search, compact, compactShot, errors: errors.filter((e) => !/dexscreener|ipfs|png|jpg|webp|favicon/i.test(e)).slice(0, 8), errorCount: errors.length };
    writeFileSync("/tmp/device-qa-3.json", JSON.stringify(out, null, 2));
    console.log("768 compact", JSON.stringify(compact));
    console.log("768 coin", JSON.stringify(coin));
    console.log("768 ticker", JSON.stringify(search.ticker));
    console.log("768 ca", JSON.stringify(search.ca));
    await ctx.close();
  }

  // 1280 CA recheck only
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector("h3", { timeout: 20000 });
    await page.locator("#tab_latest").click();
    await page.waitForSelector("button[id^='btn_copy_']", { timeout: 20000 });
    await page.waitForTimeout(500);
    const coin = await page.evaluate(() => {
      const btn = document.querySelector("button[id^='btn_copy_']");
      const h3 = btn?.closest("div")?.parentElement?.querySelector("h3") || document.querySelector("h3");
      return btn ? { symbol: (h3?.textContent || "").trim(), address: btn.id.slice(9) } : null;
    });
    if (!coin?.address) throw new Error("no coin on 1280");
    const typed = await openAndFill(page, 1280, coin.address);
    const ca = await waitQuery(page, coin.address.slice(0, 10));
    const found = await page.evaluate((addr) => ({
      byId: Boolean(document.getElementById("btn_copy_" + addr)),
      symbols: [...new Set([...document.querySelectorAll("h3")].map((h) => h.textContent.trim()))].slice(0, 12),
    }), coin.address);
    const shotPath = await shot(page, "1280x800-search-ca");
    out["1280"] = { coin, typed, ca, found, shotPath };
    await ctx.close();
  }
} finally {
  await browser.close();
}
writeFileSync("/tmp/device-qa-3.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2).slice(0, 6000));
