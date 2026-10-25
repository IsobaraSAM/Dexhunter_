// @ts-nocheck
import test from "node:test";
import assert from "node:assert/strict";
import {
  ADDRESS_PREFIX_CAP,
  collectAddressMatches,
  parseAddressQuery,
  resolveBrowseQuery,
  tokensMatchingQuery,
  matchesUserQuery,
  searchRank,
} from "./addressQuery.js";

const EVM = "0x39dBED3a2bd333467115dE45665cC57F813C4571";
const SOL = "87cN8VpBH2foRuXgquz87Refw7Dfx1T8PfJ8qYxepump";
const SOL_B = "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R";

function row(address, extra = {}) {
  return {
    chainId: extra.chainId || "solana",
    pairCreatedAt: extra.pairCreatedAt || 1_700_000_000_000,
    baseToken: { address, name: extra.name || "Coin", symbol: extra.symbol || "C" },
    pairAddress: extra.pairAddress,
    bondingCurvePda: extra.bondingCurvePda,
    quoteToken: extra.quoteToken,
    marketCap: extra.marketCap,
    volume: extra.volume,
    liquidity: extra.liquidity,
  };
}

test("contract pastes classify across case, wrappers, labels, and urls", () => {
  assert.equal(parseAddressQuery(`  ca: ${EVM}  `).kind, "evm");
  assert.equal(parseAddressQuery(`CA:${EVM.toLowerCase()}`).address, EVM.toLowerCase());
  assert.equal(parseAddressQuery(`contract: ${SOL}`).address, SOL);
  assert.equal(parseAddressQuery(`"mint: ${SOL}"`).address, SOL);
  assert.equal(parseAddressQuery(`${EVM.slice(0, 10)}\n${EVM.slice(10)}`).address, EVM.toLowerCase());
  assert.equal(parseAddressQuery(`0X${EVM.slice(2)}`).address, EVM.toLowerCase());
  assert.equal(parseAddressQuery(`https://dexscreener.com/solana/${SOL}?maker=abc`).address, SOL);
  assert.equal(parseAddressQuery(`https://pump.fun/coin/${SOL}`).address, SOL);
  assert.equal(parseAddressQuery(`https://etherscan.io/token/${EVM}`).kind, "evm");
  assert.equal(parseAddressQuery(`https://example.com/token?address=${encodeURIComponent(SOL)}`).address, SOL);
  assert.equal(parseAddressQuery(`check ${SOL} please`).address, SOL);
  assert.equal(parseAddressQuery("PEPE2024").kind, "text");
  assert.equal(parseAddressQuery("BonkCoin").kind, "text");
  assert.equal(parseAddressQuery("exit liquidity").kind, "text");
  assert.equal(parseAddressQuery("").kind, "empty");
});

test("an exact contract does not match a longer address that merely contains it", () => {
  const prefix = SOL.slice(0, 32);
  assert.equal(prefix.length, 32);
  assert.equal(parseAddressQuery(prefix).kind, "solana");
  const found = tokensMatchingQuery([row(SOL, { name: "Long" })], prefix);
  assert.equal(found.mode, "address");
  assert.equal(found.matches.length, 0);
});

test("evm search is case-insensitive and solana case is exact unless unique", () => {
  const evm = row(EVM, { chainId: "robinhood", name: "Pons" });
  const sol = row(SOL, { name: "Exit" });
  const other = row(SOL_B, { name: "Other" });
  assert.equal(tokensMatchingQuery([evm, sol], EVM.toLowerCase()).matches[0], evm);
  assert.equal(tokensMatchingQuery([evm, sol], EVM.toUpperCase()).matches[0], evm);
  assert.equal(tokensMatchingQuery([sol, other], SOL).matches.length, 1);
  assert.equal(tokensMatchingQuery([sol, other], SOL.toLowerCase()).matches[0], sol);
  const flipped = SOL.replace("R", "r");
  assert.notEqual(flipped, SOL);
  assert.equal(tokensMatchingQuery([sol, other], flipped).matches[0], sol);
  assert.equal(tokensMatchingQuery([sol, other], SOL.toUpperCase()).matches.length, 0);
});

test("two solana mints that differ only by case are not collapsed", () => {
  const mixed = SOL.slice(0, 12).toLowerCase() + SOL.slice(12);
  assert.notEqual(mixed, SOL);
  assert.notEqual(mixed, SOL.toLowerCase());
  const a = row(SOL, { name: "Upper" });
  const b = row(mixed, { name: "Mixed" });
  const found = collectAddressMatches([a, b], parseAddressQuery(SOL.toLowerCase()));
  assert.equal(found.ambiguous, true);
  assert.equal(found.tokens.length, 0);
  assert.equal(resolveBrowseQuery([a, b], SOL.toLowerCase(), {}, () => []).length, 0);
  assert.equal(tokensMatchingQuery([a, b], SOL).matches[0], a);
});

test("pair address and bonding curve match, quote mint does not", () => {
  const pair = "So11111111111111111111111111111111111111112";
  const curve = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
  const token = row(SOL, {
    pairAddress: pair,
    bondingCurvePda: curve,
    quoteToken: { symbol: "USDC", address: EVM },
  });
  assert.equal(tokensMatchingQuery([token], pair).matches[0], token);
  assert.equal(tokensMatchingQuery([token], curve).matches[0], token);
  assert.equal(tokensMatchingQuery([token], EVM).matches.length, 0);
});

test("prefix and suffix searches stay capped and do not steal ordinary words", () => {
  const tokens = [];
  for (let i = 0; i < ADDRESS_PREFIX_CAP + 5; i++) {
    const tail = `${i}`.padStart(4, "a");
    tokens.push(row(`${SOL.slice(0, 40)}${tail}`, { pairCreatedAt: 1_000 + i, name: `N${i}` }));
  }
  const prefix = SOL.slice(0, 16);
  assert.equal(parseAddressQuery(prefix).kind, "solana-prefix");
  const found = tokensMatchingQuery(tokens, prefix);
  assert.equal(found.matches.length, ADDRESS_PREFIX_CAP);
  assert.equal(found.truncated, true);
  assert.equal(found.matches[0].baseToken.name, `N${ADDRESS_PREFIX_CAP + 4}`);
  const suffix = SOL.slice(-14);
  assert.equal(parseAddressQuery(suffix).kind, "solana-prefix");
  assert.equal(tokensMatchingQuery([row(SOL)], suffix).matches.length, 1);
  assert.equal(parseAddressQuery(EVM.slice(0, 10)).kind, "evm-prefix");
  assert.equal(tokensMatchingQuery([row(EVM, { chainId: "base" })], EVM.slice(0, 10).toUpperCase()).matches.length, 1);
});

test("exact address search ignores filters and text search does not", () => {
  const sol = row(SOL, { name: "Exit Liquidity", symbol: "EXIT", marketCap: 10, volume: { h24: 1 }, liquidity: { usd: 1 } });
  const eth = row(EVM, {
    chainId: "ethereum",
    name: "Exit Door",
    symbol: "DOOR",
    marketCap: 5_000_000,
    volume: { h24: 900_000 },
    liquidity: { usd: 400_000 },
  });
  const filters = {
    chain: "ethereum",
    dex: "uniswap",
    age: "1h",
    minVolume: 100_000,
    maxVolume: "",
    minLiquidity: 50_000,
    minMarketCap: 1_000_000,
    maxMarketCap: "",
    minPriceChange: 10,
    telegram: true,
    twitter: false,
    discord: false,
    website: false,
    verified: false,
  };
  const apply = (tokens, f) => tokens.filter((token) => token.chainId === f.chain && token.marketCap >= f.minMarketCap);
  const exact = resolveBrowseQuery([sol, eth], `ca: ${SOL}`, filters, apply);
  assert.deepEqual(exact.map((token) => token.baseToken.symbol), ["EXIT"]);
  const named = resolveBrowseQuery([sol, eth], "exit", filters, apply);
  assert.deepEqual(named.map((token) => token.baseToken.symbol), ["DOOR"]);
  const missed = resolveBrowseQuery([sol, eth], "no-such-name", filters, apply);
  assert.equal(missed.length, 0);
});

test("stress: thousands of mints, every paste shape, no false contract hits", () => {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let seed = 0xdec0de;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const mint = () => {
    let out = "";
    for (let i = 0; i < 44; i++) out += alphabet[Math.floor(rand() * alphabet.length)];
    return out;
  };
  const hex = () => {
    let out = "0x";
    for (let i = 0; i < 40; i++) out += "0123456789abcdef"[Math.floor(rand() * 16)];
    return out;
  };
  const tokens = [];
  for (let i = 0; i < 2500; i++) tokens.push(row(mint(), { name: `S${i}`, pairCreatedAt: i + 1 }));
  for (let i = 0; i < 800; i++) tokens.push(row(hex(), { chainId: "base", name: `E${i}`, symbol: `E${i}` }));
  tokens.push(row(SOL, { name: "TargetSol" }));
  tokens.push(row(EVM, { chainId: "arbitrum", name: "TargetEvm" }));
  const plantedTwin = SOL.slice(0, 43) + (SOL.endsWith("A") ? "B" : "A");
  tokens.push(row(plantedTwin, { name: "NearMiss" }));

  const shapes = [
    SOL,
    ` ${SOL} `,
    `ca:${SOL}`,
    `contract: ${SOL}`,
    `"${SOL}"`,
    `https://solscan.io/token/${SOL}`,
    `${SOL.slice(0, 20)} ${SOL.slice(20)}`,
    EVM,
    EVM.toLowerCase(),
    `0X${EVM.slice(2).toUpperCase()}`,
    `token: ${EVM}`,
    `https://dexscreener.com/arbitrum/${EVM.toLowerCase()}`,
  ];
  for (const shape of shapes) {
    const hits = tokensMatchingQuery(tokens, shape);
    assert.equal(hits.mode, "address", shape);
    assert.equal(hits.matches.length, 1, shape);
    assert.equal(hits.ambiguous, false, shape);
  }
  assert.equal(tokensMatchingQuery(tokens, SOL).matches[0].baseToken.name, "TargetSol");
  assert.equal(tokensMatchingQuery(tokens, EVM).matches[0].baseToken.name, "TargetEvm");
  assert.equal(tokensMatchingQuery(tokens, plantedTwin).matches[0].baseToken.name, "NearMiss");
  assert.notEqual(tokensMatchingQuery(tokens, plantedTwin).matches[0].baseToken.address, SOL);

  for (let i = 0; i < 200; i++) {
    const fake = mint();
    const hits = tokensMatchingQuery(tokens, fake);
    assert.equal(hits.matches.length, 0, fake);
  }
  const partial = SOL.slice(0, 18);
  const prefixed = tokensMatchingQuery(tokens, partial);
  assert.ok(prefixed.matches.some((token) => token.baseToken.address === SOL));
  assert.ok(prefixed.matches.every((token) => token.baseToken.address.startsWith(partial) || token.baseToken.address.endsWith(partial)));
  assert.ok(prefixed.matches.length <= ADDRESS_PREFIX_CAP);
});

test("search matches a name, a ticker, and an address, not a mint that only contains the letters", () => {
  const gram = row("MintGramLetters111", { name: "Gram (prev. Toncoin)", symbol: "GRAM" });
  const hood = row("0x1111111111111111111111111111111111111111", { chainId: "robinhood", name: "Hood", symbol: "HOODGRAM" });
  const insta = row("AbCgramDeF1111111111111111111111", { name: "Instagram", symbol: "INSTA" });
  const telegram = row("MintTelegram", { name: "THE FOMOAPP TELEGRAM BOT", symbol: "FOMO" });
  const target = row(SOL, { name: "Other", symbol: "ZZZ" });
  assert.equal(matchesUserQuery(gram, "gram"), true);
  assert.equal(matchesUserQuery(hood, "GRAM"), true);
  assert.equal(matchesUserQuery(insta, "GRAM"), false);
  assert.equal(matchesUserQuery(telegram, "gram"), false);
  const instagram = row("MintInsta", { name: "Instagram", symbol: "INSTAGRAM" });
  assert.equal(matchesUserQuery(instagram, "GRAM"), false);
  assert.equal(matchesUserQuery(target, SOL), true);
  assert.equal(matchesUserQuery(target, SOL.slice(0, 20)), true);
  assert.equal(matchesUserQuery(gram, SOL), false);
  assert.equal(matchesUserQuery(target, "ca: " + SOL), true);
  const dump = row("0xAE2Df3c1749daEE7210000000000000000000001", {
    chainId: "robinhood",
    symbol: "BTCETHUSDTGRAM".repeat(80),
    name: "Bitcoin Ethereum Gram " + "Token ".repeat(40),
  });
  assert.equal(matchesUserQuery(dump, "GRAM"), false);
  const priced = row("So11111111111111111111111111111111111111112", { name: "Wrapped", symbol: "$GRAM" });
  assert.equal(matchesUserQuery(priced, "gram"), true);
  const camel = row("MintCamel111111111111111111111111", { name: "HermesWorld", symbol: "HW" });
  assert.equal(matchesUserQuery(camel, "world"), true);
  assert.equal(matchesUserQuery(camel, "telegram"), false);
  const evm = row("0xabcde1234567890abcde1234567890abcde12345", { chainId: "base", name: "Nope", symbol: "NOPE" });
  assert.equal(matchesUserQuery(evm, "0xabcd"), true);
  assert.equal(matchesUserQuery(gram, "0xabcd"), false);
  const mint = row("AbC12345zzzzzzzzzzzzzzzzzzzzzzzzzz", { name: "Nope", symbol: "NOPE" });
  assert.equal(matchesUserQuery(mint, "AbC12345"), true);
  assert.equal(searchRank(gram, "GRAM"), 0);
  assert.ok(searchRank(gram, "GRAM") < searchRank(hood, "GRAM"));
  assert.equal(searchRank(evm, "0xabcd"), 3);
});
