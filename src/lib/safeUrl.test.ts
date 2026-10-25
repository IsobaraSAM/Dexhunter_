import test from "node:test";
import assert from "node:assert/strict";
import { isOfficialWebsiteCandidate, isProfileHost } from "./safeUrl.ts";

test("tiktok is not an official website and an explicit site is", () => {
  assert.equal(isProfileHost("www.tiktok.com"), true);
  assert.equal(isOfficialWebsiteCandidate("tiktok", "", "www.tiktok.com", false), false);
  assert.equal(isOfficialWebsiteCandidate("", "Website", "glitchonsol.com", true), true);
  assert.equal(isOfficialWebsiteCandidate("", "", "instagram.com", true), false);
});
