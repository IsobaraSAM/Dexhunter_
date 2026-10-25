import test from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import {
  BSC_USDT,
  WBNB,
  capFromSupply,
  createBscLaunchIndexer,
  curveProgress,
  decodeClassicLog,
  decodeOpenLog,
  quotePerHumanToken,
  usdPerHumanToken,
} from "./bsc-launch-reader.js";
import { actionHref, dexTradeUrl } from "./venue-links.js";

const classicIface = new ethers.Interface([
  "event TokenCreate(address creator, address token, uint256 requestId, string name, string symbol, uint256 totalSupply, uint256 launchTime, uint256 launchFee)",
  "event LiquidityAdded(address base, uint256 offers, address quote, uint256 funds)",
]);
const openIface = new ethers.Interface([
  "event TokenCreated(uint256 requestId, uint256 indexed presetId, address indexed creator, address indexed token, string name, string symbol, uint256 maxSupply, uint256 saleAmount, uint256 raiseAmount, uint256 initialPrice, address quoteAsset, address vault, address curveModule, address tradeModule, address migrateModule, address customData, address tokenModule, string tokenMetaUri, uint256 flags, bytes encodedTags)",
]);

function encodedLog(iface, name, args) {
  const encoded = iface.encodeEventLog(name, args);
  return {
    address: "0x5c952063c7fc8610FFDB798152D69F0B9550762b",
    topics: encoded.topics,
    data: encoded.data,
    blockNumber: 129674959,
    transactionHash: "0xbcdff06a07c7205ef8caf1ce5a996f30d2b46d08790ac86214ef964131682ae6",
    logIndex: 2,
  };
}

test("classic TokenCreate matches the live V2 shape", () => {
  const parsed = decodeClassicLog(encodedLog(classicIface, "TokenCreate", [
    "0x09B16594C52ECe919A7F79E4cb8aFb53FF2727c4",
    "0x5A9940832a1E79c765c5D81671Ed04446E73FfFF",
    1n,
    "POFD人生",
    "POFD人生",
    1000000000000000000000000000n,
    0n,
    0n,
  ]));
  assert.equal(parsed.name, "TokenCreate");
  assert.equal(parsed.args.symbol, "POFD人生");
  assert.equal(parsed.args.totalSupply, 1000000000000000000000000000n);
});

test("OpenFour TokenCreated keeps quote, vault, and raise separate from a price", () => {
  const parsed = decodeOpenLog(encodedLog(openIface, "TokenCreated", [
    103295947n,
    1778027615735n,
    "0x0E44db0A499fAF09832F52f7052E25B883EED4C1",
    "0xa96CD0FEe2F4CeDdfdF90460901257D99f05FFFf",
    "赛博土地公",
    "TUDI",
    1000000000000000000000000000n,
    800000000000000000000000000n,
    13400000000000000000n,
    4272959187n,
    WBNB,
    "0x09Cac368fde76F54E99Aff89e58e841BfC3e2319",
    ethers.ZeroAddress,
    ethers.ZeroAddress,
    ethers.ZeroAddress,
    ethers.ZeroAddress,
    ethers.ZeroAddress,
    "https://static.four.meme/token-info/bsc/103295947.json",
    0n,
    "0x",
  ]));
  assert.equal(parsed.name, "TokenCreated");
  assert.equal(parsed.args.symbol, "TUDI");
  assert.equal(parsed.args.raiseAmount, 13400000000000000000n);
  assert.equal(parsed.args.quoteAsset, WBNB);
});

test("a live V2 purchase price is quote wei per token, and an unknown quote stays unpriced", () => {
  const lastPrice = "20541583478495";
  const per = quotePerHumanToken(lastPrice, 18, 18);
  assert.ok(Math.abs(per - 20541583478495 / 1e18) < 1e-18);
  const px = usdPerHumanToken({ lastPrice, tokenDecimals: 18, quoteDecimals: 18, quote: WBNB, bnbUsd: 740.44986 });
  assert.ok(Math.abs(px - per * 740.44986) < 1e-9);
  const cap = capFromSupply(px, "1000000000000000000000000000", 18);
  assert.ok(cap > 0 && cap < 1e15);
  assert.equal(usdPerHumanToken({
    lastPrice,
    tokenDecimals: 18,
    quoteDecimals: 18,
    quote: "0x4af1D41cd9dD950dcA43984b43aaA2A8702714Ac",
    bnbUsd: 740,
  }), null);
  assert.equal(usdPerHumanToken({
    lastPrice: "1000000000000000000",
    tokenDecimals: 18,
    quoteDecimals: 18,
    quote: BSC_USDT,
    bnbUsd: 0,
  }), 1);
});

test("curve progress comes from remaining sale tokens, not a hardcoded BNB raise", () => {
  assert.equal(curveProgress(800n, 1000n), 20);
  assert.equal(curveProgress(0n, 1000n), 100);
  assert.equal(curveProgress(1000n, 0n), null);
});

test("SoldOut is not graduation, Migrated is, and V1 helper numbers are ignored", () => {
  const token = "0x5A9940832a1E79c765c5D81671Ed04446E73FfFF";
  const indexer = createBscLaunchIndexer({
    book: null,
    store: { load() { return null; }, save() {} },
  });
  indexer.launches.set(token.toLowerCase(), {
    baseToken: { address: token, name: "POFD", symbol: "POFD" },
    isBondingCurve: true,
    isGraduated: false,
    bondingProgress: 12,
    marketStage: "bonding_curve",
  });
  indexer.onPhase({ token, from: 1, to: 5, operator: ethers.ZeroAddress });
  const sold = indexer.launches.get(token.toLowerCase());
  assert.equal(sold.isGraduated, false);
  assert.equal(sold.marketStage, "sold_out");
  assert.equal(sold.bondingProgress, 100);
  indexer.onPhase({ token, from: 5, to: 3, operator: ethers.ZeroAddress });
  const migrated = indexer.launches.get(token.toLowerCase());
  assert.equal(migrated.isGraduated, true);
  assert.equal(migrated.marketStage, "migrated");
  indexer.onLiquidity({
    base: token,
    offers: 1n,
    quote: WBNB,
    funds: 18n * 10n ** 18n,
  });
  assert.equal(indexer.launches.get(token.toLowerCase()).marketStage, "graduated");
  const v1 = { bscProtocol: "four-v1" };
  indexer.applyHelperInfo(v1, {
    version: 1n,
    quote: WBNB,
    lastPrice: 99n,
    offers: 1n,
    maxOffers: 2n,
    funds: 24n,
    maxFunds: 24n,
    liquidityAdded: true,
  });
  assert.equal(v1.fourLastPrice, undefined);
  assert.equal(v1.isGraduated, undefined);
});

test("a saved cursor is not snapped to head", async () => {
  const calls = [];
  const indexer = createBscLaunchIndexer({
    book: null,
    store: { load() { return null; }, save() {} },
    confirmations: 15,
    backfillBlocks: 1000,
    maxChunk: 100,
    rpc: async (method, params) => {
      calls.push([method, params]);
      if (method === "eth_chainId") return "0x38";
      if (method === "eth_getCode") return "0x6001";
      if (method === "eth_call") {
        const data = params[0].data;
        if (data.startsWith("0x1e4e4b6c")) return ethers.AbiCoder.defaultAbiCoder().encode(["address"], ["0xEC4549caDcE5DA21Df6E6422d448034B5233bFbC"]);
        if (data.startsWith("0x6f1b3a2a")) return ethers.AbiCoder.defaultAbiCoder().encode(["address"], ["0x5c952063c7fc8610FFDB798152D69F0B9550762b"]);
        if (data.startsWith("0x8d3f6e3b")) return ethers.AbiCoder.defaultAbiCoder().encode(["address"], ["0xebe7b6C1089D9F72aD07f34E36d898e44E5e27f3"]);
        return ethers.AbiCoder.defaultAbiCoder().encode(["address"], [ethers.ZeroAddress]);
      }
      if (method === "eth_blockNumber") return "0x" + (1_000_000).toString(16);
      if (method === "eth_getBlockByNumber") return { timestamp: "0x65000000" };
      if (method === "eth_getLogs") return [];
      throw new Error(method);
    },
  });
  indexer.checked = true;
  const v2 = indexer.adapter("four-v2");
  v2.startBlock = 100;
  v2.liveCursor = 5000;
  v2.historyFloor = 5000;
  v2.chunk = 100;
  await indexer.scanOneChunk();
  assert.equal(v2.startBlock, 100);
  const logs = calls.filter((call) => call[0] === "eth_getLogs");
  assert.equal(logs.length, 1);
  const query = logs[0][1][0];
  assert.equal(Number(query.fromBlock), 5001);
  assert.equal(Number(query.toBlock), 5100);
});

test("a Four.meme coin opens its own token page", () => {
  const token = {
    chainId: "bsc",
    isFourMemeLaunch: true,
    launchPlatform: "Four.meme",
    baseToken: { address: "0x5A9940832a1E79c765c5D81671Ed04446E73FfFF" },
    primaryDexTradingUrl: "https://app.uniswap.org/swap",
  };
  assert.equal(actionHref(token), "https://four.meme/token/0x5A9940832a1E79c765c5D81671Ed04446E73FfFF");
  assert.equal(dexTradeUrl(token), actionHref(token));
});
