#!/usr/bin/env node
import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { chromium } from "playwright";

const ART = "/workspace/artifacts/device-qa";
const BAK = "/tmp/device-qa-shots";
mkdirSync(ART, { recursive: true });
mkdirSync(BAK, { recursive: true });

async function shot(page, name) {
  const a = `${ART}/${name}.png`;
  const b = `${BAK}/${name}.png`;
  await page.screenshot({ path: b, fullPage: false });
  await page.screenshot({ path: a, fullPage: false });
  return a;
}

function isImgNoise(text, url) {
  const blob = `${text}\n${url}`.toLowerCase();
  const failed = /failed to load resource|net::err_|status of 4\d\d/.test(blob);
  const imageish = /\.(png|jpe?g|gif|webp|svg|ico)|ipfs|imgur|arweave|dexscreener|twimg|favicon|cdn\./.test(blob);
  return failed && imageish;
}

async function waitList(page, ms = 20000) {
  const start = Date.now();
  let last = null;
  while (Date.now() - start < ms) {
    last = await page.evaluate(() => {
      const copies = document.querySelectorAll("button[id^='btn_copy_'], button[title^='Copy CA:'], [aria-label='Copy Contract Address']").length;
      const holders = [...document.querySelectorAll("button")].filter((b) => (b.textContent || "").includes("Holders & Supply")).length;
      const rows = document.querySelectorAll("tbody tr, span.font-bold.font-mono").length;
      const wc = (document.getElementById("index_window_count")?.textContent || "").replace(/\s+/g, " ").trim();
      return { copies, holders, rows, wc, has: copies > 0 || holders > 0 };
    });
    if (last.has) return { ...last, waitedMs: Date.now() - start };
    await page.waitForTimeout(400);
  }
  return { ...(last || {}), waitedMs: Date.now() - start, timedOut: true };
}

async function inspect(page) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await page.evaluate(() => {
    const doc = document.documentElement;
    function textNodes(el) {
      const out = [];
      if (!el) return out;
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) {
        const raw = n.nodeValue || "";
        if (!raw.trim() && !raw.includes("$")) continue;
        const chars = [...raw].map((ch) => ({ ch, cp: ch.codePointAt(0) }));
        out.push({ raw, chars });
      }
      return out;
    }
    function priceOf(root) {
      const spans = [...root.querySelectorAll("span")].filter((s) => {
        const t = s.getAttribute("title") || "";
        return t.startsWith("$") || t.includes("decimal") || t.startsWith("Tap");
      });
      return spans.slice(0, 2).map((s) => ({
        title: (s.getAttribute("title") || "").slice(0, 160),
        text: (s.textContent || "").replace(/\s+/g, ""),
        nodes: textNodes(s),
        hasUnicodeSub: [...(s.textContent || "")].some((ch) => {
          const c = ch.codePointAt(0);
          return c >= 0x2080 && c <= 0x2089;
        }),
      }));
    }
    function percentsOf(root) {
      const found = [];
      root.querySelectorAll("span, div").forEach((el) => {
        if (el.childElementCount > 0) return;
        const t = (el.textContent || "").trim();
        if (!t || t.length > 24) return;
        if (t === "—" || t === "–" || t === "-" || /history unavailable/i.test(t) || /%$/.test(t)) found.push(t);
      });
      return [...new Set(found)].slice(0, 8);
    }
    const items = [];
    const holderBtns = [...document.querySelectorAll("button")].filter((b) => (b.textContent || "").includes("Holders & Supply"));
    for (const b of holderBtns.slice(0, 12)) {
      let card = b.parentElement;
      for (let i = 0; i < 6 && card && !card.querySelector("h3"); i++) card = card.parentElement;
      if (!card) continue;
      const symbol = (card.querySelector("h3")?.textContent || "").trim();
      const copy = card.querySelector("button[id^='btn_copy_']");
      items.push({
        kind: "card",
        symbol,
        address: copy ? copy.id.slice("btn_copy_".length) : "",
        prices: priceOf(card),
        percents: percentsOf(card),
      });
    }
    document.querySelectorAll("tbody tr").forEach((tr, i) => {
      if (i > 8) return;
      if (getComputedStyle(tr).display === "none") return;
      const symbol = (tr.querySelector("span.font-bold")?.textContent || "").trim();
      const copy = [...tr.querySelectorAll("button")].find((b) => (b.getAttribute("title") || "").startsWith("Copy CA:"));
      items.push({
        kind: "table-row",
        symbol,
        address: copy ? copy.getAttribute("title").replace(/^Copy CA:\s*/, "") : "",
        prices: priceOf(tr),
        percents: percentsOf(tr),
        visible: tr.getBoundingClientRect().width > 0,
      });
    });
    // mobile compact rows
    document.querySelectorAll('[aria-label="Copy Contract Address"]').forEach((btn, i) => {
      if (i > 8) return;
      const row = btn.closest(".cursor-pointer") || btn.parentElement?.parentElement?.parentElement;
      if (!row) return;
      if (getComputedStyle(row).display === "none") return;
      const symbol = (row.querySelector("span.font-bold")?.textContent || "").trim();
      items.push({
        kind: "mobile-row",
        symbol,
        address: (btn.getAttribute("title") || "").replace(/^Copy CA:\s*/, ""),
        prices: priceOf(row),
        percents: percentsOf(row),
      });
    });
    const table = document.querySelector("table");
    const scroller = table?.parentElement;
    let tableOverflow = null;
    if (table && scroller) {
      const r = table.getBoundingClientRect();
      tableOverflow = {
        tableWidth: Math.round(table.scrollWidth),
        scrollerClient: scroller.clientWidth,
        scrollerScroll: scroller.scrollWidth,
        overflows: scroller.scrollWidth > scroller.clientWidth + 2,
        tableRight: Math.round(r.right),
        viewport: window.innerWidth,
        display: getComputedStyle(table).display,
      };
    }
    const headerIds = ["btn_pause_feed","btn_brand_home_refresh","btn_toggle_search_mobile","btn_export_csv_mobile","btn_toggle_theme_mobile","btn_open_settings_mobile","tab_trending","tab_latest","tab_fresh_mints","btn_toggle_search","btn_export_data_desktop","btn_toggle_theme_desktop","btn_open_settings_desktop"];
    const controls = [];
    for (const id of headerIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      const s = getComputedStyle(el);
      if (s.display === "none") continue;
      const r = el.getBoundingClientRect();
      controls.push({ id, left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), text: (el.innerText||"").replace(/\s+/g," ").trim().slice(0,30) });
    }
    const collisions = [];
    for (let i=0;i<controls.length;i++) for (let j=i+1;j<controls.length;j++) {
      const a=controls[i], b=controls[j];
      const ox = Math.min(a.right,b.right)-Math.max(a.left,b.left);
      const oy = Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
      if (ox>3 && oy>3) collisions.push([a.id,b.id,ox,oy]);
    }
    return {
      overflow: { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, innerWidth: window.innerWidth, horizontal: doc.scrollWidth > doc.clientWidth + 1 },
      windowCount: (document.getElementById("index_window_count")?.textContent || "").replace(/\s+/g," ").trim(),
      historyUnavailable: /history unavailable/i.test(document.body.innerText || ""),
      items,
      tableOverflow,
      controls,
      collisions,
      view: {
        cards: document.getElementById("btn_view_cards")?.getAttribute("aria-pressed"),
        compact: document.getElementById("btn_view_compact")?.getAttribute("aria-pressed"),
      },
    };
  });
    } catch (err) {
      if (attempt === 2 || !/destroyed|navigation|closed/i.test(String(err?.message || err))) throw err;
      await page.waitForTimeout(800);
    }
  }
  throw new Error("inspect failed");
}

async function setInput(page, value) {
  const input = page.locator("#input_search_query");
  await input.waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(500);
  await input.evaluate((el, v) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await page.waitForTimeout(150);
  return input.inputValue();
}

async function openSearch(page, width) {
  const id = width >= 1280 ? "#btn_toggle_search" : "#btn_toggle_search_mobile";
  const alt = width >= 1280 ? "#btn_toggle_search_mobile" : "#btn_toggle_search";
  const which = (await page.locator(id).isVisible().catch(() => false)) ? id : alt;
  if (!(await page.locator("#input_search_query").isVisible().catch(() => false))) {
    await page.locator(which).click();
  }
  await page.locator("#input_search_query").waitFor({ state: "visible", timeout: 5000 });
  await page.waitForTimeout(400);
  return which;
}

async function clearSearch(page) {
  for (const id of ["#btn_clear_search_collapsed", "#btn_clear_search_input", "#btn_close_search_panel"]) {
    if (await page.locator(id).isVisible().catch(() => false)) {
      await page.locator(id).click();
      await page.waitForTimeout(700);
      return id;
    }
  }
  return null;
}

async function searchAndCheck(page, query, expect) {
  const value = await setInput(page, query);
  await page.locator("#btn_execute_search").click();
  const start = Date.now();
  let last = null;
  while (Date.now() - start < 18000) {
    last = await page.evaluate((exp) => {
      const body = document.body.innerText || "";
      const noMatch = /\bNo match\b/.test(body);
      const searching = /\bSearching\b/.test(body);
      const symbols = [];
      document.querySelectorAll("h3, span.font-bold").forEach((el) => {
        const t = (el.textContent || "").trim();
        if (t && t.length < 24) symbols.push(t);
      });
      const idHit = Boolean(document.getElementById("btn_copy_" + exp.address));
      const titleHit = Boolean(document.querySelector(`[title="Copy CA: ${exp.address}"]`));
      const symHit = symbols.some((s) => s.toLowerCase() === String(exp.symbol || "").toLowerCase());
      const holders = [...document.querySelectorAll("button")].some((b) => (b.textContent || "").includes("Holders & Supply"));
      const copies = document.querySelectorAll("button[id^='btn_copy_'], [aria-label='Copy Contract Address']").length;
      return { noMatch, searching, symbols: [...new Set(symbols)].slice(0, 12), idHit, titleHit, symHit, holders, copies, queryShown: (document.querySelector("#search_panel_collapsed")?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 160) };
    }, expect);
    if (!last.searching && (last.noMatch || last.copies > 0 || last.holders || last.symHit)) break;
    await page.waitForTimeout(400);
  }
  return { value, last, waitedMs: Date.now() - start };
}

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const report = {};

async function newPage(width, height) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    const url = msg.location()?.url || "";
    if (!isImgNoise(text, url)) errors.push({ text: text.slice(0, 400), url: url.slice(0, 160) });
  });
  page.on("pageerror", (err) => errors.push({ pageerror: String(err?.message || err).slice(0, 400) }));
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 }).catch(async () => {
    await page.waitForTimeout(1000);
    await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
  });
  const list = await waitList(page, 20000);
  return { context, page, errors, list };
}

try {
  // 320 audit recapture
  {
    const { context, page, errors, list } = await newPage(320, 568);
    const data = await inspect(page);
    const feed = await shot(page, "320x568-feed");
    const headerBox = await page.locator("header").boundingBox();
    await page.screenshot({ path: `${BAK}/320x568-header.png`, clip: { x: 0, y: 0, width: 320, height: Math.min(140, Math.ceil(headerBox?.height || 120)) } });
    await page.screenshot({ path: `${ART}/320x568-header.png`, clip: { x: 0, y: 0, width: 320, height: Math.min(140, Math.ceil(headerBox?.height || 120)) } });
    report["320"] = { list, errors, data, feed };
    await context.close();
    console.log("320 done", data.overflow, "items", data.items.length, "collisions", data.collisions);
  }

  // 390: latest, ticker, ca, percent, price
  {
    const { context, page, errors, list } = await newPage(390, 844);
    const initial = await inspect(page);
    await shot(page, "390x844-feed");
    const headerBox = await page.locator("header").boundingBox();
    await page.screenshot({ path: `${BAK}/390x844-header.png`, clip: { x: 0, y: 0, width: 390, height: Math.min(160, Math.ceil((headerBox?.height || 120) + 4)) } });
    await page.screenshot({ path: `${ART}/390x844-header.png`, clip: { x: 0, y: 0, width: 390, height: Math.min(160, Math.ceil((headerBox?.height || 120) + 4)) } });
    await page.locator("#tab_latest").click();
    const start = Date.now();
    let wc = "";
    while (Date.now() - start < 15000) {
      wc = ((await page.locator("#index_window_count").textContent().catch(() => "")) || "").replace(/\s+/g, " ").trim();
      if (wc && !/^0(\s|in)/.test(wc) && wc !== "Loading this window") break;
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(800);
    const latest = await inspect(page);
    await shot(page, "390x844-latest");
    const coin = latest.items.find((it) => it.symbol && it.symbol !== "—" && it.symbol.length >= 3 && it.address) || latest.items.find((it) => it.symbol && it.address);
    let ticker = null;
    let ca = null;
    if (coin) {
      const which = await openSearch(page, 390);
      ticker = await searchAndCheck(page, coin.symbol, coin);
      ticker.which = which;
      ticker.coin = { symbol: coin.symbol, address: coin.address };
      await shot(page, "390x844-search-ticker");
      ticker.cleared = await clearSearch(page);
      await waitList(page, 10000);
      const which2 = await openSearch(page, 390);
      ca = await searchAndCheck(page, coin.address, coin);
      ca.which = which2;
      await shot(page, "390x844-search-ca");
      await clearSearch(page);
    }
    // cards + compact overflow
    await page.locator("#btn_view_cards").click();
    await page.waitForTimeout(400);
    const cards = await inspect(page);
    await shot(page, "390x844-view-cards");
    await page.locator("#btn_view_compact").click();
    await page.waitForTimeout(400);
    const compact = await inspect(page);
    await shot(page, "390x844-view-compact");
    report["390"] = { list, errors, initialOverflow: initial.overflow, latestWindow: wc, latestSample: latest.items.slice(0, 6), history: latest.historyUnavailable, ticker, ca, cardsOverflow: cards.overflow, cardsTable: cards.tableOverflow, compactTable: compact.tableOverflow, compactSample: compact.items.slice(0, 4) };
    await context.close();
    console.log("390 ticker", ticker && ticker.last && { symHit: ticker.last.symHit, noMatch: ticker.last.noMatch, symbols: ticker.last.symbols });
    console.log("390 ca", ca && ca.last && { idHit: ca.last.idHit, titleHit: ca.last.titleHit, symHit: ca.last.symHit, noMatch: ca.last.noMatch, value: ca.value });
  }

  for (const vp of [{ name: "768", w: 768, h: 1024 }, { name: "1280", w: 1280, h: 800 }]) {
    const { context, page, errors, list } = await newPage(vp.w, vp.h);
    await page.locator("#tab_latest").click();
    const start = Date.now();
    let wc = "";
    while (Date.now() - start < 15000) {
      wc = ((await page.locator("#index_window_count").textContent().catch(() => "")) || "").replace(/\s+/g, " ").trim();
      if (wc && !/^0(\s|in)/.test(wc) && wc !== "Loading this window") break;
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(600);
    const latest = await inspect(page);
    const coin = latest.items.find((it) => it.symbol && it.symbol !== "—" && it.address && it.symbol.length >= 3) || latest.items.find((it) => it.address);
    let ticker = null, ca = null;
    if (!coin) {
      ticker = { error: "no coin with symbol+address", items: latest.items.slice(0, 4) };
    } else {
      const which = await openSearch(page, vp.w);
      ticker = await searchAndCheck(page, coin.symbol, coin);
      ticker.which = which;
      ticker.coin = { symbol: coin.symbol, address: coin.address };
      await shot(page, `${vp.w}x${vp.h}-search-ticker`);
      ticker.cleared = await clearSearch(page);
      await waitList(page, 8000);
      const which2 = await openSearch(page, vp.w);
      ca = await searchAndCheck(page, coin.address, coin);
      ca.which = which2;
      await shot(page, `${vp.w}x${vp.h}-search-ca`);
      await clearSearch(page);
    }
    // holders on cards (default after clear? view mode persists in this page — latest started as cards)
    await page.locator("#btn_view_cards").click().catch(() => {});
    await page.waitForTimeout(400);
    let holders = {};
    try {
      const btn = page.getByRole("button", { name: "Holders & Supply Analysis" }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        holders.clicked = "Holders & Supply Analysis";
      } else {
        await page.locator("table tbody tr").first().click({ timeout: 5000 });
        holders.clicked = "table-row";
      }
      await page.waitForTimeout(1000);
      holders.bodyHas = await page.evaluate(() => {
        const t = document.body.innerText || "";
        return {
          onChain: /On-Chain|Holder distribution|Top 10|Rescan|Scanning|Could not|error/i.test(t),
          snippet: t.slice(0, 400),
        };
      });
      holders.screenshot = await shot(page, `${vp.w}x${vp.h}-holders`);
    } catch (err) {
      holders.error = String(err?.message || err).slice(0, 300);
      holders.screenshot = await shot(page, `${vp.w}x${vp.h}-holders-error`);
    }
    // compact overflow
    await page.locator("#btn_view_compact").click();
    await page.waitForTimeout(500);
    const compact = await inspect(page);
    await shot(page, `${vp.w}x${vp.h}-view-compact`);
    report[vp.name] = {
      list, errors, latestWindow: wc,
      history: latest.historyUnavailable,
      sample: latest.items.slice(0, 5),
      ticker, ca, holders,
      compactTable: compact.tableOverflow,
      compactOverflowDoc: compact.overflow,
      collisions: latest.collisions,
    };
    await context.close();
    console.log(vp.name, "ticker", ticker && ticker.last && { sym: ticker.coin?.symbol, symHit: ticker.last.symHit, noMatch: ticker.last.noMatch, symbols: ticker.last.symbols, value: ticker.value });
    console.log(vp.name, "ca", ca && ca.last && { idHit: ca.last.idHit, titleHit: ca.last.titleHit, symHit: ca.last.symHit, noMatch: ca.last.noMatch, accepted: ca.value === ticker?.coin?.address });
    console.log(vp.name, "table", compact.tableOverflow, "holders", holders.clicked, holders.bodyHas?.onChain, holders.error);
  }
} finally {
  await browser.close();
}

writeFileSync("/tmp/device-qa-2.json", JSON.stringify(report, null, 2));
console.log("WROTE /tmp/device-qa-2.json");
