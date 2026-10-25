import test from "node:test";
import assert from "node:assert/strict";
import { findIndexedAddress, explainChainMiss, searchIndexedAddresses } from "./address-lookup.js";

const pons = "0x39dBED3a2bd333467115dE45665cC57F813C4571";

test("address search hits the full index, not a display page", () => {
  const older = { chainId: "robinhood", baseToken: { address: pons, name: "Pons" }, pairCreatedAt: 1 };
  const other = { chainId: "arc", baseToken: { address: "0x2222222222222222222222222222222222222222", name: "Arc" } };
  const hits = findIndexedAddress([other, older], pons, "all");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].baseToken.name, "Pons");
  assert.equal(findIndexedAddress([older], pons, "arc").length, 0);
  assert.equal(findIndexedAddress([older], pons, "robinhood").length, 1);
});

test("a timed-out chain reader is not reported as a confirmed miss", () => {
  const bothDown = explainChainMiss(["Argus Portal 8", "Pons"], ["Argus Portal 8", "Pons"], true);
  assert.match(bothDown, /not confirmed missing/);
  assert.doesNotMatch(bothDown, /No launch record/);
  const ponsDown = explainChainMiss(["Argus Portal 8", "Pons"], ["Pons"], true);
  assert.match(ponsDown, /No launch record on Argus Portal 8/);
  assert.match(ponsDown, /Pons did not answer in time/);
  assert.doesNotMatch(ponsDown, /No launch record on Argus Portal 8 and Pons/);
  const neither = explainChainMiss(["Argus Portal 8", "Pons"], [], true);
  assert.match(neither, /No launch record on Argus Portal 8 and Pons/);
  assert.doesNotMatch(neither, /did not answer/);
});

test("prefix, pair address, and ambiguous solana case stay inside the index", () => {
  const mint = "87cN8VpBH2foRuXgquz87Refw7Dfx1T8PfJ8qYxepump";
  const sol = {
    chainId: "solana",
    baseToken: { address: mint, name: "Exit" },
    pairAddress: "So11111111111111111111111111111111111111112",
    pairCreatedAt: 5,
  };
  const arc = { chainId: "arc", baseToken: { address: pons, name: "Arc" }, pairCreatedAt: 4 };
  const prefixed = searchIndexedAddresses([sol, arc], "ca: 87cN8VpBH2fo", "all");
  assert.equal(prefixed.tokens.length, 1);
  assert.equal(prefixed.tokens[0].baseToken.name, "Exit");
  assert.equal(searchIndexedAddresses([sol, arc], "87cN8VpBH2fo", "arc").tokens.length, 0);
  assert.equal(searchIndexedAddresses([sol], sol.pairAddress, "solana").tokens[0], sol);
  assert.equal(findIndexedAddress([sol], mint.toLowerCase(), "all")[0], sol);
  const mixed = mint.slice(0, 12).toLowerCase() + mint.slice(12);
  const twin = { chainId: "solana", baseToken: { address: mixed, name: "Twin" }, pairCreatedAt: 6 };
  const amb = searchIndexedAddresses([sol, twin], mint.toLowerCase(), "all");
  assert.equal(amb.ambiguous, true);
  assert.equal(findIndexedAddress([sol, twin], mint.toLowerCase(), "all").length, 0);
  assert.equal(findIndexedAddress([sol, twin], mint, "all")[0], sol);
});
