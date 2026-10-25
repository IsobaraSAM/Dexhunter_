import test from "node:test";
import assert from "node:assert/strict";
import { mergeSeedTokens, retainTokens } from "./index-store.js";

test("seed merge keeps discovery rows and adds Pons launches that were missing", () => {
  const discovery = [
    { chainId: "solana", baseToken: { address: "Mint111" } },
    { chainId: "robinhood", baseToken: { address: "0xaaa" }, launchPlatform: "Pons V2" },
  ];
  const pons = [
    { chainId: "robinhood", baseToken: { address: "0xAAA" }, launchPlatform: "Pons V2" },
    { chainId: "robinhood", baseToken: { address: "0xbbb" }, launchPlatform: "Pons V2" },
    { chainId: "robinhood", baseToken: {} },
  ];
  const merged = mergeSeedTokens(discovery, pons);
  assert.equal(merged.added, 1);
  assert.equal(merged.tokens.length, 3);
  assert.equal(merged.tokens[1].baseToken.address, "0xaaa");
  assert.equal(merged.tokens[2].baseToken.address, "0xbbb");
});

test("an older Arc launch keeps a reserved share when newer Solana rows would fill the cap", () => {
  const tokens = [];
  for (let i = 0; i < 10; i++) {
    tokens.push({
      chainId: "solana",
      discoveryMode: "onchain",
      baseToken: { address: `Mint${i}` },
      pairCreatedAt: 1000 + i,
    });
  }
  for (let i = 0; i < 3; i++) {
    tokens.push({
      chainId: "arc",
      discoveryMode: "onchain",
      baseToken: { address: `0xabc${i}` },
      pairCreatedAt: i,
    });
  }
  const kept = retainTokens(tokens, 10);
  assert.equal(kept.length, 10);
  assert.ok(kept.filter((t) => t.chainId === "arc").length >= 2);
});
