import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_BROWSE, historyAction, parseBrowseSearch, sameBrowse } from "./browseLocation.ts";

test("an empty search is the trending landing page", () => {
  assert.deepEqual(parseBrowseSearch({}), DEFAULT_BROWSE);
});

test("tab, search, and filters round-trip and junk is ignored", () => {
  const parsed = parseBrowseSearch({
    tab: "latest",
    q: "  primer ",
    chain: "Robinhood",
    dex: "pons",
    age: "1h",
    sort: "volume",
    maxVolume: "1000",
    tw: "true",
    token: "robinhood:0xabc",
    nope: "drop me",
  });
  assert.equal(parsed.tab, "latest");
  assert.equal(parsed.q, "primer");
  assert.equal(parsed.chain, "robinhood");
  assert.equal(parseBrowseSearch({ chain: "SOLANA,Arc" }).chain, "arc,solana");
  assert.equal(parseBrowseSearch({ chain: "all" }).chain, "all");
  assert.equal(parsed.dex, "pons");
  assert.equal(parsed.age, "1h");
  assert.equal(parsed.sort, "volume");
  assert.equal(parsed.maxVolume, "1000");
  assert.equal(parsed.tw, true);
  assert.equal(parsed.xp, true);
  assert.equal(parsed.xpost, true);
  assert.equal(parseBrowseSearch({ xp: "1" }).xpost, false);
  assert.equal(parseBrowseSearch({ xpost: "true", xp: "1" }).tw, false);
  assert.equal(parsed.token, "robinhood:0xabc");
  assert.equal(parseBrowseSearch({ tab: "nope", age: "2y", token: "not-a-key" }).tab, "trending");
});

test("source lists, long chain lists, and signed price changes survive the url", () => {
  const chains = "base,ethereum,bsc,abstract,avalanche,hyperevm,arbitrum,ink,story,xlayer,plasma,unichain,solana";
  const parsedChains = parseBrowseSearch({ chain: chains }).chain.split(",");
  assert.equal(parsedChains.length, 13);
  assert.ok(parsedChains.includes("xlayer"));
  assert.ok(parsedChains.includes("unichain"));
  assert.equal(parseBrowseSearch({ dex: "raydium,uniswap" }).dex, "raydium,uniswap");
  assert.equal(parseBrowseSearch({ minPriceChange: "-20" }).minPriceChange, "-20");
  assert.equal(parseBrowseSearch({ minVolume: "-5" }).minVolume, "");
});

test("the first move pushes, typing a number replaces, and a new place pushes again", () => {
  const landed = DEFAULT_BROWSE;
  const latest = { ...landed, tab: "latest" as const };
  const typed = { ...latest, maxVolume: "1" };
  const typedMore = { ...latest, maxVolume: "1000" };
  const chain = { ...typedMore, chain: "solana" };
  assert.equal(historyAction(landed, latest, false), "push");
  assert.equal(historyAction(latest, typed, true), "replace");
  assert.equal(historyAction(typed, typedMore, true), "replace");
  assert.equal(historyAction(typedMore, chain, true), "push");
  assert.equal(historyAction(landed, { ...landed, minVolume: "5" }, false), "push");
  assert.equal(historyAction(latest, latest, true), "none");
  assert.equal(sameBrowse(latest, { ...latest }), true);
});
