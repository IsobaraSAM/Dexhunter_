import test from "node:test";
import assert from "node:assert/strict";
import { pickName, pickSymbol } from "./token-fields.js";

const addr = "0xA18e30c0b15A3d1ef23062F754fD521624eD4e0D";

test("an address never replaces a resolved name", () => {
  assert.equal(pickName(addr, "PearlNews", addr), "PearlNews");
  assert.equal(pickName("", "PearlNews", addr), "PearlNews");
  assert.equal(pickName("   ", "PearlNews", addr), "PearlNews");
  assert.equal(pickName(addr, addr, addr), "");
});

test("a later real name repairs an empty record", () => {
  assert.equal(pickName("PearlNews", "", addr), "PearlNews");
  assert.equal(pickName("PearlNews", addr, addr), "PearlNews");
  assert.equal(pickSymbol("PN", ""), "PN");
  assert.equal(pickSymbol("", "PN"), "PN");
});
