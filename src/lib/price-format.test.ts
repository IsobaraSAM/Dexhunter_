import test from "node:test";
import assert from "node:assert/strict";
import { formatPriceParts } from "./price-format.ts";

test("0.000005 renders as 0.0 with a subscript 4 and the digit 5", () => {
  const parts = formatPriceParts("0.000005");
  assert.equal(parts.isSubscript, true);
  assert.equal(parts.prefix, "$0.0");
  assert.equal(parts.subscript, 4);
  assert.equal(parts.suffix, "5");
  assert.equal(formatPriceParts(0.000005).subscript, 4);
});

test("four leading zeros also collapse, larger prices stay plain", () => {
  const tiny = formatPriceParts("0.00005");
  assert.equal(tiny.subscript, 3);
  assert.equal(tiny.suffix, "5");
  const plain = formatPriceParts("0.025");
  assert.equal(plain.isSubscript, false);
  assert.match(plain.formatted || "", /^\$0\.025/);
});
