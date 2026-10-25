// @ts-nocheck
// Pure helpers for Portal 8 pool orientation and unit honesty.
// USD fields are only produced when the quote is a verified USD stable
// and decimals are known. Otherwise the raw quote-denominated value is kept
// and the USD field stays null.

export const USDC_ARC = "0x3600000000000000000000000000000000000000";

export function isUsdc(address) {
  return Boolean(address) && String(address).toLowerCase() === USDC_ARC.toLowerCase();
}

// Uniswap v4 sorts currency0 < currency1 by address.
export function tokenIsCurrency0(token, quote) {
  if (!token || !quote) return null;
  return String(token).toLowerCase() < String(quote).toLowerCase();
}

export function quoteDecimalsOrNull(quote, knownDecimals) {
  if (Number.isFinite(knownDecimals)) return knownDecimals;
  if (isUsdc(quote)) return 6;
  return null;
}

export function usdPriceOrNull(priceQuote, quote) {
  if (!isUsdc(quote)) return null;
  const n = Number(priceQuote);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function usdVolumeOrNull(quoteRaw, quote, quoteDecimals) {
  if (!isUsdc(quote)) return null;
  const dec = quoteDecimalsOrNull(quote, quoteDecimals);
  if (dec == null) return null;
  const usd = Number(quoteRaw) / 10 ** dec;
  return Number.isFinite(usd) && usd >= 0 && usd <= 1e12 ? usd : null;
}

export function fdvOrNull(priceUsd, totalSupply, tokenDecimals = 18) {
  if (!(priceUsd > 0) || totalSupply == null || totalSupply === "") return null;
  let whole;
  try {
    const supply = BigInt(totalSupply);
    const unit = 10n ** BigInt(tokenDecimals);
    if (unit <= 0n || supply <= 0n) return null;
    whole = Number(supply / unit) + Number(supply % unit) / Number(unit);
  } catch {
    const unit = 10 ** tokenDecimals;
    whole = Number(totalSupply) / unit;
  }
  if (!(whole > 0) || !Number.isFinite(whole)) return null;
  const cap = priceUsd * whole;
  if (!Number.isFinite(cap) || cap <= 0 || cap > 1e15) return null;
  return cap;
}
