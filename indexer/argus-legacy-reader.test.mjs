import test from "node:test";
import assert from "node:assert/strict";
import { legacyLaunchPair, LEGACY_PORTALS } from "./argus-legacy-reader.js";

test("a legacy TokenCreated becomes an Argus page with no invented market", () => {
  const portal = LEGACY_PORTALS.find((p) => p.id === 7);
  const pair = legacyLaunchPair(portal, {
    token: "0xb021be536808f551b31789422fd28a6c9c6e97da",
    creator: "0x1111111111111111111111111111111111111111",
    name: "Portal Seven",
    symbol: "P7",
    poolId: "0x" + "ab".repeat(32),
    imageURI: "https://example.com/p7.png",
    website: "https://example.com",
    twitter: "https://x.com/p7",
    telegram: "",
  }, 1_700_000_000_000);
  assert.equal(pair.argusPortalId, 7);
  assert.equal(pair.primaryDexTradingUrl, `https://argus.world/token/${pair.baseToken.address}`);
  assert.equal(pair.url, pair.primaryDexTradingUrl);
  assert.equal(pair.marketCap, undefined);
  assert.equal(pair.priceUsd, undefined);
  assert.equal(pair.volume, undefined);
  assert.equal(pair.baseToken.name, "Portal Seven");
  assert.equal(LEGACY_PORTALS.map((p) => p.id).join(","), "7,6,5,4,3,2,1");
});
