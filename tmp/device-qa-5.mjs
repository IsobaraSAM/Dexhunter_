#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";
const ART = "/workspace/artifacts/device-qa";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const out = {};

async function shot(page, name) {
  await page.screenshot({ path: `${ART}/${name}.png`, fullPage: false });
}

async function ensureSearch(page, width) {
  const id = width >= 1280 ? "#btn_toggle_search" : "#btn_toggle_search_mobile";
  const vis = await page.locator(id).isVisible();
  const box = await page.locator(id).boundingBox();
  if (await page.locator("#input_search_query").isVisible().catch(() => false)) return { id, vis, box, how: "already" };
  await page.locator(id).click({ timeout: 5000 });
  await page.waitForTimeout(400);
  if (await page.locator("#input_search_query").isVisible().catch(() => false)) return { id, vis, box, how: "click" };
  await page.keyboard.press("s");
  await page.waitForTimeout(400);
  return { id, vis, box, how: (await page.locator("#input_search_query").isVisible().catch(() => false)) ? "key-s" : "failed" };
}

async function run(width, height, name) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.locator("#tab_latest").click();
  await page.waitForFunction(() => document.querySelectorAll("h3, span.font-bold").length > 2, { timeout: 20000 });
  const coin = await page.evaluate(() => {
    const h3 = [...document.querySelectorAll("h3")].map((h) => h.textContent.trim()).find((t) => t && t !== "—" && t.length > 1);
    const btn = document.querySelector("button[id^='btn_copy_']");
    const titleBtn = [...document.querySelectorAll("button")].find((b) => (b.getAttribute("title") || "").startsWith("Copy CA:"));
    return {
      symbol: h3 || "",
      address: btn ? btn.id.replace(/^btn_copy_/, "") : (titleBtn?.getAttribute("title") || "").replace(/^Copy CA:\s*/, ""),
      h3count: document.querySelectorAll("h3").length,
      copyCount: document.querySelectorAll("button[id^='btn_copy_']").length,
    };
  });
  const opened = await ensureSearch(page, width);
  const rec = { coin, opened };
  if (opened.how === "failed" || !coin.address || !coin.symbol) {
    await shot(page, `${name}-search-open-fail`);
    rec.shot = `${name}-search-open-fail`;
    await ctx.close();
    return rec;
  }
  async function go(q) {
    const input = page.locator("#input_search_query");
    await input.fill("");
    await input.fill(q);
    const value = await input.inputValue();
    await page.locator("#btn_execute_search").click();
    await page.waitForTimeout(1200);
    const state = await page.evaluate((query) => {
      const collapsed = (document.getElementById("search_panel_collapsed")?.innerText || "").replace(/\s+/g, " ").trim();
      const syms = [...new Set([...document.querySelectorAll("h3")].map((h) => h.textContent.trim()).filter(Boolean))];
      return {
        collapsed: collapsed.slice(0, 180),
        inputVisible: Boolean(document.getElementById("input_search_query")?.getBoundingClientRect().width),
        syms: syms.slice(0, 8),
        copies: document.querySelectorAll("button[id^='btn_copy_']").length,
        has: collapsed.toLowerCase().includes(String(query).toLowerCase().slice(0, 8)),
      };
    }, q);
    return { value, state };
  }
  rec.ticker = await go(coin.symbol);
  await shot(page, `${name}-search-ticker`);
  if (await page.locator("#btn_clear_search_collapsed").isVisible().catch(() => false)) await page.locator("#btn_clear_search_collapsed").click();
  else await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  const reopened = await ensureSearch(page, width);
  rec.reopened = reopened;
  if (reopened.how !== "failed") {
    rec.ca = await go(coin.address);
    await shot(page, `${name}-search-ca`);
  }
  await ctx.close();
  return rec;
}

try {
  out.w768 = await run(768, 1024, "768x1024");
  console.log("768", JSON.stringify(out.w768, null, 2).slice(0, 2200));
  out.w1280 = await run(1280, 800, "1280x800");
  console.log("1280", JSON.stringify(out.w1280, null, 2).slice(0, 2200));
} finally {
  await browser.close();
  writeFileSync("/tmp/device-qa-5.json", JSON.stringify(out, null, 2));
}
