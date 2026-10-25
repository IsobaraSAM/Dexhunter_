#!/usr/bin/env node
/**
 * Device-limit QA for DexHunter. Read-only against the app.
 * Writes JSON to /tmp/device-qa-results.json and screenshots under
 * /workspace/artifacts/device-qa/.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const OUT = "/workspace/artifacts/device-qa";
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "320x568", width: 320, height: 568 },
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1440x900", width: 1440, height: 900 },
];

const INTERACT = new Set(["390x844", "768x1024", "1280x800"]);

const HEADER_IDS = [
  "btn_pause_feed",
  "btn_export_csv_top_left",
  "btn_brand_home_refresh",
  "btn_toggle_search_mobile",
  "btn_export_csv_mobile",
  "btn_toggle_theme_mobile",
  "btn_open_settings_mobile",
  "tab_trending",
  "tab_latest",
  "tab_fresh_mints",
  "btn_toggle_search",
  "btn_export_data_desktop",
  "btn_toggle_theme_desktop",
  "btn_open_settings_desktop",
];

function isThirdPartyImageNoise(text, url) {
  const blob = `${text || ""}\n${url || ""}`.toLowerCase();
  const failed =
    /failed to load resource|net::err_|status of 4\d\d|status of 5\d\d|err_blocked|err_name_not_resolved|cors/.test(
      blob,
    );
  const imageish =
    /\.(png|jpe?g|gif|webp|svg|ico|avif)(\?|$|\s|")/.test(blob) ||
    /imgur|ipfs|arweave|cloudflare|cf-ipfs|dexscreener|twimg|googleusercontent|nftstorage|digitaloceanspaces|pump\.fun|cdn\.|favicon|images\.|img\.|metadata|logo/.test(
      blob,
    );
  if (failed && imageish) return true;
  // Chromium often logs "Failed to load resource: the server responded with a status of 404 ()"
  // with the URL only in the location. If we have no URL and no script/css/api hint, treat
  // bare 404 resource failures as image noise only when the text does not mention a script.
  if (
    /failed to load resource/.test(blob) &&
    !/\/api\/|\.js|\.css|\.mjs|syntaxerror|typeerror|referenceerror/.test(blob) &&
    imageish
  ) {
    return true;
  }
  return false;
}

async function shot(page, name) {
  const path = `${OUT}/${name}.png`;
  await page.screenshot({ path, fullPage: false }).catch(() => {});
  return path;
}

async function shotBox(page, name, box) {
  const path = `${OUT}/${name}.png`;
  if (!box || box.width < 2 || box.height < 2) return shot(page, name);
  await page
    .screenshot({
      path,
      fullPage: false,
      clip: {
        x: Math.max(0, box.x),
        y: Math.max(0, box.y),
        width: Math.max(1, Math.min(box.width, page.viewportSize().width - Math.max(0, box.x))),
        height: Math.max(1, Math.min(box.height, page.viewportSize().height - Math.max(0, box.y))),
      },
    })
    .catch(async () => {
      await page.screenshot({ path, fullPage: false });
    });
  return path;
}

function auditEval() {
  const HEADER_IDS = [
    "btn_pause_feed",
    "btn_export_csv_top_left",
    "btn_brand_home_refresh",
    "btn_toggle_search_mobile",
    "btn_export_csv_mobile",
    "btn_toggle_theme_mobile",
    "btn_open_settings_mobile",
    "tab_trending",
    "tab_latest",
    "tab_fresh_mints",
    "btn_toggle_search",
    "btn_export_data_desktop",
    "btn_toggle_theme_desktop",
    "btn_open_settings_desktop",
  ];

  function vis(el) {
    if (!el) return false;
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  }

  function rectOf(el) {
    const r = el.getBoundingClientRect();
    return {
      left: Math.round(r.left * 10) / 10,
      top: Math.round(r.top * 10) / 10,
      right: Math.round(r.right * 10) / 10,
      bottom: Math.round(r.bottom * 10) / 10,
      width: Math.round(r.width * 10) / 10,
      height: Math.round(r.height * 10) / 10,
    };
  }

  function labelOf(el) {
    const id = el.id || "";
    const aria = el.getAttribute("aria-label") || "";
    const text = (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 40);
    return id || aria || text || el.tagName;
  }

  const doc = document.documentElement;
  const overflow = {
    scrollWidth: doc.scrollWidth,
    clientWidth: doc.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    bodyClientWidth: document.body.clientWidth,
    innerWidth: window.innerWidth,
    horizontalOverflow: doc.scrollWidth > doc.clientWidth + 1 || document.body.scrollWidth > window.innerWidth + 1,
  };

  const controls = [];
  for (const id of HEADER_IDS) {
    const el = document.getElementById(id);
    if (!el || !vis(el)) {
      controls.push({ id, visible: false });
      continue;
    }
    const r = rectOf(el);
    const outside =
      r.left < -1 || r.right > window.innerWidth + 1 || r.top < -1 || r.bottom > window.innerHeight + 1;
    let clippedBy = null;
    let p = el.parentElement;
    while (p && p !== document.body) {
      const s = getComputedStyle(p);
      const ox = `${s.overflowX} ${s.overflow}`;
      if (/hidden|clip|auto|scroll/.test(ox)) {
        const pr = p.getBoundingClientRect();
        const cut =
          r.left < pr.left - 1 ||
          r.right > pr.right + 1 ||
          r.top < pr.top - 1 ||
          r.bottom > pr.bottom + 1;
        if (cut) {
          clippedBy = {
            id: p.id || "",
            className: String(p.className).slice(0, 80),
            overflow: ox.trim().slice(0, 40),
          };
          break;
        }
      }
      p = p.parentElement;
    }
    const textCut = [];
    el.querySelectorAll("span, h1, kbd").forEach((child) => {
      if (child.scrollWidth > child.clientWidth + 2 && child.clientWidth > 0) {
        textCut.push({
          text: (child.textContent || "").trim().slice(0, 30),
          scrollWidth: child.scrollWidth,
          clientWidth: child.clientWidth,
        });
      }
    });
    if (el.scrollWidth > el.clientWidth + 2) {
      textCut.push({
        text: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 30),
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        self: true,
      });
    }
    controls.push({
      id,
      visible: true,
      text: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 50),
      rect: r,
      outsideViewport: outside,
      clippedBy,
      textCut,
    });
  }

  const visibleControls = controls.filter((c) => c.visible);
  const collisions = [];
  for (let i = 0; i < visibleControls.length; i++) {
    for (let j = i + 1; j < visibleControls.length; j++) {
      const a = visibleControls[i];
      const b = visibleControls[j];
      const ox = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
      const oy = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
      if (ox > 3 && oy > 3) {
        collisions.push({ a: a.id, b: b.id, overlapX: Math.round(ox), overlapY: Math.round(oy) });
      }
    }
  }

  const offenders = [];
  const nodes = document.querySelectorAll("body *");
  for (const el of nodes) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    if (r.right > window.innerWidth + 2 || r.left < -2) {
      offenders.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || "",
        className: String(el.className).slice(0, 90),
        text: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 40),
        left: Math.round(r.left),
        right: Math.round(r.right),
        top: Math.round(r.top),
        width: Math.round(r.width),
      });
    }
    if (offenders.length > 40) break;
  }
  // keep the outermost / widest only, drop descendants of already recorded overflow
  const overflowEls = [];
  for (const o of offenders) {
    const dominated = overflowEls.some(
      (k) => o.left >= k.left - 2 && o.right <= k.right + 2 && o.top >= k.top - 2 && Math.abs(o.width - k.width) < 8,
    );
    if (!dominated) overflowEls.push(o);
    if (overflowEls.length >= 8) break;
  }

  const copyButtons = [...document.querySelectorAll('[aria-label="Copy Contract Address"]')];
  const holderButtons = [...document.querySelectorAll("button")].filter((b) =>
    (b.textContent || "").includes("Holders & Supply Analysis"),
  );
  const skeletons = document.querySelectorAll(".animate-pulse").length;
  const windowCount = (document.getElementById("index_window_count")?.textContent || "").replace(/\s+/g, " ").trim();
  const bodyText = document.body.innerText || "";
  const emptyHint = /No tokens|No match|Couldn't load|No coins match/.test(bodyText.slice(0, 4000));
  const viewPressed = {
    cards: document.getElementById("btn_view_cards")?.getAttribute("aria-pressed") || null,
    compact: document.getElementById("btn_view_compact")?.getAttribute("aria-pressed") || null,
  };

  const coins = [];
  const roots = new Set();
  for (const btn of copyButtons) {
    let row = btn.parentElement;
    for (let i = 0; i < 10 && row; i++) {
      if (row.querySelector("h3") || row.querySelector("span.font-bold")) break;
      row = row.parentElement;
    }
    if (!row || roots.has(row)) continue;
    roots.add(row);
    const title = btn.getAttribute("title") || "";
    const address = title.startsWith("Copy CA:")
      ? title.replace(/^Copy CA:\s*/, "").trim()
      : btn.id.startsWith("btn_copy_")
        ? btn.id.slice("btn_copy_".length)
        : "";
    const symbolEl =
      row.querySelector("h3") ||
      row.querySelector("span.font-bold.font-mono") ||
      row.querySelector("span.font-bold");
    const symbol = (symbolEl?.textContent || "").trim();
    const percents = [];
    row.querySelectorAll("span, div").forEach((n) => {
      if (n.children.length > 0) return;
      const t = (n.textContent || "").trim();
      if (
        t === "—" ||
        t === "–" ||
        t === "-" ||
        /^history unavailable$/i.test(t) ||
        /^(?:[▲▼]\s*)?[+\-]?\d+(?:\.\d+)?%$/.test(t) ||
        t === "0%"
      ) {
        percents.push(t);
      }
    });
    coins.push({ symbol, address, percents: percents.slice(0, 6) });
    if (coins.length >= 15) break;
  }

  const prices = [];
  const priceSeen = new Set();
  document.querySelectorAll("span").forEach((el) => {
    const title = el.getAttribute("title") || "";
    const text = (el.innerText || "").replace(/\s+/g, "");
    if (!text.includes("$") || text.length > 28 || text.length < 2) return;
    if (el.querySelector("span") && !title) return;
    const key = text + "|" + title;
    if (priceSeen.has(key)) return;
    priceSeen.add(key);
    const subs = [];
    for (const ch of text) {
      const c = ch.codePointAt(0);
      if (c >= 0x2080 && c <= 0x2089) subs.push(ch);
    }
    prices.push({ text, title: title.slice(0, 140), subscriptChars: subs });
  });

  const historyUnavailable = /history unavailable/i.test(bodyText);
  const emDashPercent = coins.some((c) => c.percents.some((p) => p === "—" || p === "–"));

  // contrast samples
  function parseRgb(c) {
    const m = String(c).match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3] };
  }
  function rel(c) {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  function contrast(a, b) {
    if (!a || !b) return null;
    const L1 = rel(a);
    const L2 = rel(b);
    const hi = Math.max(L1, L2);
    const lo = Math.min(L1, L2);
    return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
  }
  function bgOf(el) {
    let n = el;
    while (n) {
      const bg = getComputedStyle(n).backgroundColor;
      const m = String(bg).match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?/);
      if (m && (m[4] == null || Number(m[4]) > 0.5)) return parseRgb(bg);
      n = n.parentElement;
    }
    return parseRgb(getComputedStyle(document.body).backgroundColor);
  }
  function sampleContrast(el) {
    if (!el || !vis(el)) return null;
    const fg = parseRgb(getComputedStyle(el).color);
    const bg = bgOf(el);
    return {
      text: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 30),
      color: getComputedStyle(el).color,
      background: bg,
      ratio: contrast(fg, bg),
    };
  }
  const h1 = document.querySelector("#btn_brand_home_refresh h1");
  const symbolEl = document.querySelector("h3, span.font-bold.font-mono");
  const contrastSamples = {
    wordmark: sampleContrast(h1),
    symbol: sampleContrast(symbolEl),
    body: sampleContrast(document.body),
    darkClass: document.documentElement.classList.contains("dark"),
  };

  return {
    overflow,
    controls,
    collisions,
    overflowEls,
    list: {
      copyButtons: copyButtons.length,
      holderButtons: holderButtons.length,
      skeletons,
      windowCount,
      emptyHint,
      viewPressed,
      hasList: copyButtons.length > 0 || holderButtons.length > 0,
    },
    coins,
    prices: prices.slice(0, 20),
    historyUnavailable,
    emDashPercent,
    contrastSamples,
  };
}

async function waitForList(page, timeoutMs) {
  const start = Date.now();
  let last = null;
  while (Date.now() - start < timeoutMs) {
    last = await page.evaluate(() => {
      const copyButtons = document.querySelectorAll('[aria-label="Copy Contract Address"]').length;
      const holderButtons = [...document.querySelectorAll("button")].filter((b) =>
        (b.textContent || "").includes("Holders & Supply Analysis"),
      ).length;
      const skeletons = document.querySelectorAll(".animate-pulse").length;
      const windowCount = (document.getElementById("index_window_count")?.textContent || "").replace(/\s+/g, " ").trim();
      const body = document.body.innerText || "";
      const empty = /No tokens|No match|Couldn't load tokens|No coins match/.test(body);
      return { copyButtons, holderButtons, skeletons, windowCount, empty, hasList: copyButtons > 0 || holderButtons > 0 };
    });
    if (last.hasList) return { ...last, waitedMs: Date.now() - start, appeared: true };
    if (last.empty && last.skeletons === 0 && Date.now() - start > 2500) {
      return { ...last, waitedMs: Date.now() - start, appeared: false };
    }
    await page.waitForTimeout(400);
  }
  return { ...(last || {}), waitedMs: Date.now() - start, appeared: false, timedOut: true };
}

async function openSearch(page, width) {
  const desktop = page.locator("#btn_toggle_search");
  const mobile = page.locator("#btn_toggle_search_mobile");
  const desktopVis = await desktop.isVisible().catch(() => false);
  const mobileVis = await mobile.isVisible().catch(() => false);
  const which = width >= 1280 ? (desktopVis ? "btn_toggle_search" : mobileVis ? "btn_toggle_search_mobile" : null) : mobileVis ? "btn_toggle_search_mobile" : desktopVis ? "btn_toggle_search" : null;
  if (!which) return { ok: false, error: "no visible search trigger", desktopVis, mobileVis };
  await page.locator(`#${which}`).click();
  try {
    await page.locator("#input_search_query").waitFor({ state: "visible", timeout: 4000 });
  } catch {
    return { ok: false, error: `clicked #${which} but #input_search_query did not become visible`, which, desktopVis, mobileVis };
  }
  return { ok: true, which, desktopVis, mobileVis };
}

async function waitSearchSettled(page, timeoutMs = 15000) {
  const start = Date.now();
  let last = null;
  while (Date.now() - start < timeoutMs) {
    last = await page.evaluate(() => {
      const body = document.body.innerText || "";
      const copyButtons = document.querySelectorAll('[aria-label="Copy Contract Address"]').length;
      const holderButtons = [...document.querySelectorAll("button")].filter((b) =>
        (b.textContent || "").includes("Holders & Supply Analysis"),
      ).length;
      const searching = /\bSearching\b/.test(body) && copyButtons === 0 && holderButtons === 0;
      const noMatch = /\bNo match\b/.test(body);
      const symbols = [];
      document.querySelectorAll("h3, span.font-bold.font-mono").forEach((el) => {
        const t = (el.textContent || "").trim();
        if (t && t.length < 24) symbols.push(t);
      });
      const queryShown = (document.querySelector("#search_panel_collapsed")?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 180);
      return {
        copyButtons,
        holderButtons,
        searching,
        noMatch,
        symbols: symbols.slice(0, 25),
        queryShown,
        emptyNote: (document.getElementById("search_empty_note")?.textContent || "").trim(),
      };
    });
    if (!last.searching && (last.copyButtons > 0 || last.holderButtons > 0 || last.noMatch)) {
      return { ...last, waitedMs: Date.now() - start };
    }
    await page.waitForTimeout(400);
  }
  return { ...(last || {}), waitedMs: Date.now() - start, timedOut: true };
}

async function clearSearch(page) {
  const collapsed = page.locator("#btn_clear_search_collapsed");
  const inputClear = page.locator("#btn_clear_search_input");
  const close = page.locator("#btn_close_search_panel");
  if (await collapsed.isVisible().catch(() => false)) {
    await collapsed.click();
    return "btn_clear_search_collapsed";
  }
  if (await inputClear.isVisible().catch(() => false)) {
    await inputClear.click();
    return "btn_clear_search_input";
  }
  if (await close.isVisible().catch(() => false)) {
    await close.click();
    return "btn_close_search_panel";
  }
  return null;
}

function pickTicker(coins) {
  const bad = new Set(["", "—", "–", "-", "SOL", "ETH", "USD", "USDC", "USDT", "AI", "THE", "A"]);
  const usable = (coins || []).filter((c) => c.symbol && !bad.has(c.symbol) && !/^0x/i.test(c.symbol) && c.symbol.length >= 2 && c.symbol.length <= 16);
  usable.sort((a, b) => b.symbol.length - a.symbol.length);
  return usable[0] || null;
}

function pickAddress(coins) {
  return (coins || []).find((c) => c.address && c.address.length >= 20 && c.symbol && c.symbol !== "—") || null;
}

async function contrastNow(page) {
  return page.evaluate(() => {
    function parseRgb(c) {
      const m = String(c).match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (!m) return null;
      return { r: +m[1], g: +m[2], b: +m[3] };
    }
    function rel(c) {
      const f = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    }
    function contrast(a, b) {
      if (!a || !b) return null;
      const L1 = rel(a);
      const L2 = rel(b);
      return Math.round(((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)) * 100) / 100;
    }
    function bgOf(el) {
      let n = el;
      while (n) {
        const bg = getComputedStyle(n).backgroundColor;
        const m = String(bg).match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?/);
        if (m && (m[4] == null || Number(m[4]) > 0.55)) return { css: bg, rgb: parseRgb(bg) };
        n = n.parentElement;
      }
      const bg = getComputedStyle(document.body).backgroundColor;
      return { css: bg, rgb: parseRgb(bg) };
    }
    function sample(el) {
      if (!el) return null;
      const fg = parseRgb(getComputedStyle(el).color);
      const bg = bgOf(el);
      return {
        text: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 40),
        color: getComputedStyle(el).color,
        background: bg.css,
        ratio: contrast(fg, bg.rgb),
      };
    }
    return {
      darkClass: document.documentElement.classList.contains("dark"),
      wordmark: sample(document.querySelector("#btn_brand_home_refresh h1")),
      symbol: sample(document.querySelector("h3, span.font-bold.font-mono")),
      bodyBg: getComputedStyle(document.body).backgroundColor,
      bodyColor: getComputedStyle(document.body).color,
    };
  });
}

async function runInteractions(page, vp, audit) {
  const steps = {};
  const width = vp.width;

  // Latest
  try {
    await page.locator("#tab_latest").click();
    const start = Date.now();
    let windowCount = "";
    let list = null;
    while (Date.now() - start < 15000) {
      windowCount = ((await page.locator("#index_window_count").textContent().catch(() => "")) || "").replace(/\s+/g, " ").trim();
      const notZero = windowCount && !/^0(\s|$)/.test(windowCount) && windowCount !== "0" && !/^0 in this window/.test(windowCount) && windowCount !== "Loading this window";
      if (notZero) break;
      await page.waitForTimeout(400);
    }
    list = await waitForList(page, 2000);
    steps.latest = {
      windowCount,
      waitedMs: Date.now() - start,
      list,
      screenshot: await shot(page, `${vp.name}-latest`),
    };
  } catch (err) {
    steps.latest = { error: String(err?.message || err), screenshot: await shot(page, `${vp.name}-latest-error`) };
  }

  // back to a populated feed if latest is empty — still search from whatever is on screen
  let coins = [];
  try {
    coins = (await page.evaluate(auditEval)).coins;
  } catch {
    coins = audit.coins || [];
  }
  if (!pickTicker(coins)) {
    await page.locator("#tab_trending").click().catch(() => {});
    await waitForList(page, 12000);
    coins = (await page.evaluate(auditEval)).coins;
  }

  const tickerCoin = pickTicker(coins);
  const addressCoin = pickAddress(coins);

  // ticker search
  try {
    const opened = await openSearch(page, width);
    if (!opened.ok) {
      steps.tickerSearch = { ok: false, opened, screenshot: await shot(page, `${vp.name}-search-open-fail`) };
    } else if (!tickerCoin) {
      steps.tickerSearch = { ok: false, error: "no ticker on page", opened, screenshot: await shot(page, `${vp.name}-search-no-ticker`) };
    } else {
      await page.locator("#input_search_query").fill("");
      await page.locator("#input_search_query").fill(tickerCoin.symbol);
      const inputValue = await page.locator("#input_search_query").inputValue();
      await page.locator("#btn_execute_search").click();
      const settled = await waitSearchSettled(page, 15000);
      const includes = (settled.symbols || []).some((s) => s.toLowerCase() === tickerCoin.symbol.toLowerCase());
      steps.tickerSearch = {
        ok: includes && !settled.noMatch,
        ticker: tickerCoin.symbol,
        inputValue,
        opened,
        settled,
        screenshot: await shot(page, `${vp.name}-search-ticker`),
      };
      const clearedWith = await clearSearch(page);
      await page.waitForTimeout(600);
      steps.tickerSearch.clearedWith = clearedWith;
    }
  } catch (err) {
    steps.tickerSearch = { ok: false, error: String(err?.message || err), screenshot: await shot(page, `${vp.name}-search-ticker-error`) };
  }

  // contract search
  try {
    // refresh coin list after clear
    await waitForList(page, 8000);
    const fresh = (await page.evaluate(auditEval)).coins;
    const coin = pickAddress(fresh) || addressCoin;
    const opened = await openSearch(page, width);
    if (!opened.ok) {
      steps.caSearch = { ok: false, opened, screenshot: await shot(page, `${vp.name}-search-ca-open-fail`) };
    } else if (!coin) {
      steps.caSearch = { ok: false, error: "no contract address on a copy button or row title", screenshot: await shot(page, `${vp.name}-search-ca-missing`) };
    } else {
      const input = page.locator("#input_search_query");
      await input.click();
      await input.fill("");
      // paste-equivalent: fill sets the value and fires input events
      await input.fill(coin.address);
      const inputValue = await input.inputValue();
      const accepted = inputValue === coin.address;
      if (!accepted) {
        steps.caSearch = {
          ok: false,
          control: "#input_search_query",
          error: "search input did not accept the pasted contract",
          expected: coin.address,
          inputValue,
          symbol: coin.symbol,
          screenshot: await shot(page, `${vp.name}-search-ca-rejected`),
        };
      } else {
        await page.locator("#btn_execute_search").click();
        const settled = await waitSearchSettled(page, 18000);
        const found = await page.evaluate((addr) => {
          const id = "btn_copy_" + addr;
          const byId = document.getElementById(id);
          const byTitle = document.querySelector(`[title="Copy CA: ${CSS.escape(addr)}"]`);
          const bodyHas = (document.body.innerText || "").includes(addr);
          const symbols = [];
          document.querySelectorAll("h3, span.font-bold.font-mono").forEach((el) => {
            const t = (el.textContent || "").trim();
            if (t) symbols.push(t);
          });
          return {
            byId: Boolean(byId),
            byTitle: Boolean(byTitle),
            bodyHas,
            symbols: symbols.slice(0, 12),
            noMatch: /\bNo match\b/.test(document.body.innerText || ""),
          };
        }, coin.address);
        const symbolHit = found.symbols.some((s) => s.toLowerCase() === String(coin.symbol).toLowerCase());
        steps.caSearch = {
          ok: (found.byId || found.byTitle || symbolHit) && !found.noMatch,
          symbol: coin.symbol,
          address: coin.address,
          inputValue,
          settled,
          found,
          screenshot: await shot(page, `${vp.name}-search-ca`),
        };
      }
      await clearSearch(page);
      await page.waitForTimeout(400);
    }
  } catch (err) {
    steps.caSearch = { ok: false, error: String(err?.message || err), screenshot: await shot(page, `${vp.name}-search-ca-error`) };
  }

  // filters
  try {
    await page.locator("#btn_open_filters_modal").click();
    await page.locator("#filter_drawer_modal").waitFor({ state: "visible", timeout: 4000 });
    await page.waitForTimeout(250);
    const geom = await page.evaluate(() => {
      const modal = document.getElementById("filter_drawer_modal");
      const panel = modal?.parentElement;
      const closeBtn = document.getElementById("btn_close_filters_modal");
      const apply = document.getElementById("btn_apply_filters_modal");
      const r = (el) => {
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return {
          left: Math.round(b.left),
          top: Math.round(b.top),
          right: Math.round(b.right),
          bottom: Math.round(b.bottom),
          width: Math.round(b.width),
          height: Math.round(b.height),
        };
      };
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      function off(box) {
        if (!box) return true;
        return box.left < -1 || box.top < -1 || box.right > vw + 1 || box.bottom > vh + 1;
      }
      return {
        vw,
        vh,
        panel: r(panel),
        modal: r(modal),
        closeBtn: r(closeBtn),
        apply: r(apply),
        panelOff: off(r(panel)),
        closeOff: off(r(closeBtn)),
        applyOff: off(r(apply)),
        docOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });
    const shotPath = await shot(page, `${vp.name}-filters`);
    const closeVisible = await page.locator("#btn_close_filters_modal").isVisible().catch(() => false);
    if (closeVisible) await page.locator("#btn_close_filters_modal").click();
    await page.waitForTimeout(200);
    const stillOpen = await page.locator("#filter_drawer_modal").isVisible().catch(() => false);
    steps.filters = { geom, closeVisible, closed: !stillOpen, screenshot: shotPath };
  } catch (err) {
    steps.filters = { error: String(err?.message || err), screenshot: await shot(page, `${vp.name}-filters-error`) };
  }

  // theme
  try {
    const before = await contrastNow(page);
    const themeBtn = width >= 1280 ? "#btn_toggle_theme_desktop" : "#btn_toggle_theme_mobile";
    const visBtn = (await page.locator(themeBtn).isVisible().catch(() => false))
      ? themeBtn
      : (await page.locator("#btn_toggle_theme_mobile").isVisible().catch(() => false))
        ? "#btn_toggle_theme_mobile"
        : "#btn_toggle_theme_desktop";
    await page.locator(visBtn).click();
    await page.waitForTimeout(350);
    const after = await contrastNow(page);
    const shotPath = await shot(page, `${vp.name}-theme`);
    // toggle back so later checks stay on the original theme
    await page.locator(visBtn).click();
    await page.waitForTimeout(200);
    steps.theme = { button: visBtn, before, after, screenshot: shotPath };
  } catch (err) {
    steps.theme = { error: String(err?.message || err), screenshot: await shot(page, `${vp.name}-theme-error`) };
  }

  // view modes
  try {
    const modes = {};
    async function measure(mode) {
      const btn = mode === "cards" ? "#btn_view_cards" : "#btn_view_compact";
      const exists = await page.locator(btn).count();
      if (!exists) return { exists: false };
      await page.locator(btn).click();
      await page.waitForTimeout(500);
      const list = await waitForList(page, 8000);
      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const scroller = document.querySelector(".overflow-x-auto, .custom-scrollbar");
        let scrollerOverflow = null;
        if (scroller) {
          scrollerOverflow = {
            className: String(scroller.className).slice(0, 80),
            scrollWidth: scroller.scrollWidth,
            clientWidth: scroller.clientWidth,
            overflows: scroller.scrollWidth > scroller.clientWidth + 2,
          };
        }
        const prices = [];
        document.querySelectorAll("span").forEach((el) => {
          const t = (el.innerText || "").replace(/\s+/g, "");
          if (t.startsWith("$") && t.length < 24 && !el.querySelector("span")) prices.push(t);
        });
        return {
          docScrollWidth: doc.scrollWidth,
          docClientWidth: doc.clientWidth,
          docOverflow: doc.scrollWidth > doc.clientWidth + 1,
          scrollerOverflow,
          pressed: {
            cards: document.getElementById("btn_view_cards")?.getAttribute("aria-pressed"),
            compact: document.getElementById("btn_view_compact")?.getAttribute("aria-pressed"),
          },
          priceSamples: prices.slice(0, 6),
          copyButtons: document.querySelectorAll('[aria-label="Copy Contract Address"]').length,
          holderButtons: [...document.querySelectorAll("button")].filter((b) =>
            (b.textContent || "").includes("Holders & Supply Analysis"),
          ).length,
        };
      });
      return {
        exists: true,
        list,
        metrics,
        screenshot: await shot(page, `${vp.name}-view-${mode}`),
      };
    }
    modes.cards = await measure("cards");
    modes.compact = await measure("compact");
    steps.views = modes;
  } catch (err) {
    steps.views = { error: String(err?.message || err), screenshot: await shot(page, `${vp.name}-view-error`) };
  }

  // holders — use whichever mode currently has rows; prefer clicking the first row or holders button
  try {
    // ensure a list
    const has = await waitForList(page, 8000);
    const target = await page.evaluate(() => {
      const holder = [...document.querySelectorAll("button")].find((b) =>
        (b.textContent || "").includes("Holders & Supply Analysis"),
      );
      if (holder) return { kind: "holders-button" };
      const row = document.querySelector('[aria-label="Copy Contract Address"]')?.closest("div");
      if (row) return { kind: "row" };
      return { kind: "none" };
    });
    let clicked = target.kind;
    if (target.kind === "holders-button") {
      await page.getByRole("button", { name: "Holders & Supply Analysis" }).first().click();
    } else if (target.kind === "row") {
      // click the symbol, not the copy button
      const symbol = page.locator("span.font-bold.font-mono").first();
      if (await symbol.isVisible().catch(() => false)) await symbol.click();
      else await page.locator('[aria-label="Copy Contract Address"]').first().locator("xpath=ancestor::div[contains(@class,'cursor-pointer')]").first().click();
    } else {
      clicked = "nothing-to-click";
    }
    await page.waitForTimeout(1200);
    const expanded = await page.evaluate(() => {
      const body = document.body.innerText || "";
      const markers = [
        "On-Chain",
        "Top 10",
        "Holder distribution",
        "Rescan",
        "Scanning",
        "Total:",
        "Supply",
        "Creator",
        "couldn't",
        "Could not",
        "error",
        "unavailable",
      ];
      const hit = markers.filter((m) => body.toLowerCase().includes(m.toLowerCase()));
      const expandedNode =
        Boolean(document.querySelector("[class*='border-t']")) &&
        /holder|supply|on-chain|rescan|scanning/i.test(body);
      return {
        hit,
        textSnippet: body.slice(0, 500),
        hasExpandedHint: hit.length > 0,
        pageTextLen: body.length,
      };
    });
    const errorsDuring = [];
    steps.holders = {
      clicked,
      hadList: has,
      expanded,
      screenshot: await shot(page, `${vp.name}-holders`),
      errorsDuring,
    };
  } catch (err) {
    steps.holders = { error: String(err?.message || err), screenshot: await shot(page, `${vp.name}-holders-error`) };
  }

  return steps;
}

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const results = [];
try {
  for (const vp of VIEWPORTS) {
    const consoleErrors = [];
    const pageErrors = [];
    const ignoredImageErrors = [];
    const apiSamples = [];
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      const url = msg.location()?.url || "";
      if (isThirdPartyImageNoise(text, url)) ignoredImageErrors.push({ text: text.slice(0, 240), url: url.slice(0, 180) });
      else consoleErrors.push({ text: text.slice(0, 500), url: url.slice(0, 200) });
    });
    page.on("pageerror", (err) => pageErrors.push(String(err?.message || err).slice(0, 500)));
    page.on("response", async (res) => {
      const url = res.url();
      if (!url.includes("/api/discovery")) return;
      if (url.includes("/stats") || url.includes("/export")) return;
      try {
        const json = await res.json();
        const tokens = json.tokens || [];
        for (const t of tokens.slice(0, 40)) {
          apiSamples.push({
            symbol: t?.baseToken?.symbol || "",
            address: t?.baseToken?.address || "",
            price: t?.priceUsd ?? null,
            h24: t?.priceChange?.h24 ?? null,
            h24Present: t?.priceChange != null && Object.prototype.hasOwnProperty.call(t.priceChange, "h24") && t.priceChange.h24 != null,
          });
        }
      } catch {
        // ignore non-json
      }
    });

    const record = { viewport: vp.name, width: vp.width, height: vp.height };
    try {
      const resp = await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
      record.status = resp?.status() ?? 0;
      const list = await waitForList(page, 20000);
      record.listWait = list;
      const audit = await page.evaluate(auditEval);
      record.audit = audit;
      record.headerShot = await shotBox(page, `${vp.name}-header`, await page.locator("header").boundingBox());
      record.feedShot = await shot(page, `${vp.name}-feed`);
      if (INTERACT.has(vp.name)) {
        record.interactions = await runInteractions(page, vp, audit);
      }
    } catch (err) {
      record.fatal = String(err?.message || err);
      record.feedShot = await shot(page, `${vp.name}-fatal`);
    }
    record.consoleErrors = consoleErrors;
    record.pageErrors = pageErrors;
    record.ignoredImageErrorCount = ignoredImageErrors.length;
    record.ignoredImageErrorSamples = ignoredImageErrors.slice(0, 5);
    // de-dupe api samples
    const seen = new Set();
    record.apiSamples = [];
    for (const s of apiSamples) {
      const k = `${s.symbol}|${s.address}|${s.h24}`;
      if (seen.has(k)) continue;
      seen.add(k);
      record.apiSamples.push(s);
      if (record.apiSamples.length >= 30) break;
    }
    results.push(record);
    await context.close();
    writeFileSync("/tmp/device-qa-results.json", JSON.stringify(results, null, 2));
    console.log(`done ${vp.name} list=${record.listWait?.appeared} overflow=${record.audit?.overflow?.horizontalOverflow} errors=${consoleErrors.length}`);
  }
} finally {
  await browser.close();
}

writeFileSync("/tmp/device-qa-results.json", JSON.stringify(results, null, 2));
console.log("WROTE /tmp/device-qa-results.json");
