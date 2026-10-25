// @ts-nocheck
import { PublicKey, Connection } from "@solana/web3.js";
import {
  PUMP_PROGRAM_ID_STR,
  PUMP_AMM_PROGRAM_ID_STR,
  METAPLEX_PROGRAM_ID_STR,
  SOL_MINT_STR,
  PUMP_INITIAL_REAL_TOKEN_RESERVES
} from "../src/lib/pumpConstants.js";
import { preserveXUrl } from "../src/lib/xLinkKind.js";
import { readPumpCursorState, readPumpMetaJobs, writePumpCursor, writePumpMetaJobs } from "./index-store.js";
import { TRADE_EVENT_DISC, createTimestamp, decodeTradeDetails, describeQuote, extractLaunch, extractLaunches, extractLaunchesFromTransaction, foldTradeVolume, logsNeedTransaction, nextSignatureCursor, settleMetadataJob, withPumpDefaults } from "./pump-create.js";
const PUMP_PROGRAM_ID = new PublicKey(PUMP_PROGRAM_ID_STR);
const PUMP_AMM_PROGRAM_ID = new PublicKey(PUMP_AMM_PROGRAM_ID_STR);
const METAPLEX_PROGRAM_ID = new PublicKey(METAPLEX_PROGRAM_ID_STR);
const PUMP_MINT_AUTHORITY = new PublicKey(
  process.env.PUMP_WATCH_ADDRESS || "TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM"
);
const RPC_ENDPOINTS = [
  process.env.SOLANA_RPC_URL,
  "https://solana-rpc.publicnode.com",
  "https://rpc.ankr.com/solana"
].filter(Boolean);
let activeRpcIndex = 0;
function getSolanaConnection() {
  const endpoint = RPC_ENDPOINTS[activeRpcIndex] || "https://solana-rpc.publicnode.com";
  return new Connection(endpoint, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 8e3,
    disableRetryOnRateLimit: true
  });
}
function rotateRpc() {
  activeRpcIndex = (activeRpcIndex + 1) % RPC_ENDPOINTS.length;
}
async function getMultipleAccountsWithRetry(pubkeys, maxAttempts = RPC_ENDPOINTS.length * 2) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const conn = getSolanaConnection();
      const infos = await conn.getMultipleAccountsInfo(pubkeys);
      return infos;
    } catch (err) {
      const errMsg = err?.message || "";
      const isRateLimit = errMsg.includes("429") || errMsg.includes("rate limit") || errMsg.includes("Too Many Requests");
      rotateRpc();
      if (isRateLimit && attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
      if (attempt < maxAttempts - 1) {
        continue;
      }
      return pubkeys.map(() => null);
    }
  }
  return pubkeys.map(() => null);
}
async function getAccountInfoWithRetry(pubkey, maxAttempts = RPC_ENDPOINTS.length * 2) {
  const results = await getMultipleAccountsWithRetry([pubkey], maxAttempts);
  return results[0] || null;
}
let solPriceState = {
  price: null,
  source: "none",
  fetchedAt: 0
};
function normalizeTimestamp(ts) {
  if (ts === null || ts === void 0 || ts === "") return void 0;
  const num = typeof ts === "number" ? ts : Number(ts);
  if (isNaN(num) || num <= 0) return void 0;
  if (num > 1e12) return Math.round(num);
  if (num > 1e9) return Math.round(num * 1e3);
  return void 0;
}
let solPriceInflight = null;
async function getSolUsdPriceDetails() {
  if (solPriceState.price !== null && Date.now() - solPriceState.fetchedAt < 3e4) {
    return solPriceState;
  }
  if (solPriceInflight) return solPriceInflight;
  solPriceInflight = loadSolUsdPrice().finally(() => {
    solPriceInflight = null;
  });
  return solPriceInflight;
}
async function loadSolUsdPrice() {
  try {
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112",
      { signal: AbortSignal.timeout(3500) }
    );
    if (res.ok) {
      const data = await res.json();
      const pairs = Array.isArray(data?.pairs) ? data.pairs : [];
      const validPair = pairs.find((p) => Number(p?.priceUsd) > 0);
      const price = validPair ? Number(validPair.priceUsd) : 0;
      if (price > 0) {
        solPriceState = {
          price,
          source: "DexScreener",
          fetchedAt: Date.now()
        };
        console.log(`[SOL/USD] source: DexScreener price: ${price.toFixed(2)} fetched: just now`);
        return solPriceState;
      }
    }
  } catch {
  }
  try {
    const res = await fetch("https://api.coinbase.com/v2/prices/SOL-USD/spot", {
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const data = await res.json();
      const price = Number(data?.data?.amount);
      if (price > 0) {
        solPriceState = {
          price,
          source: "Coinbase",
          fetchedAt: Date.now()
        };
        console.log(`[SOL/USD] source: Coinbase price: ${price.toFixed(2)} fetched: just now`);
        return solPriceState;
      }
    }
  } catch {
  }
  try {
    const res = await fetch(
      "https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112",
      { signal: AbortSignal.timeout(3500) }
    );
    if (res.ok) {
      const data = await res.json();
      const price = Number(data?.data?.["So11111111111111111111111111111111111111112"]?.price);
      if (price > 0) {
        solPriceState = {
          price,
          source: "Jupiter",
          fetchedAt: Date.now()
        };
        console.log(`[SOL/USD] source: Jupiter price: ${price.toFixed(2)} fetched: just now`);
        return solPriceState;
      }
    }
  } catch {
  }
  if (solPriceState.price !== null && solPriceState.price > 0) {
    const ageSeconds = Math.round((Date.now() - solPriceState.fetchedAt) / 1e3);
    console.log(
      `[SOL/USD] source: last-known (${solPriceState.source}) price: ${solPriceState.price.toFixed(2)} age: ${ageSeconds}s`
    );
    return {
      price: solPriceState.price,
      source: "last-known",
      fetchedAt: solPriceState.fetchedAt
    };
  }
  console.warn("[SOL/USD] All sources failed and no valid previous price exists. SOL/USD: unknown");
  return {
    price: null,
    source: "none",
    fetchedAt: 0
  };
}
async function getSolUsdPrice() {
  const details = await getSolUsdPriceDetails();
  return details.price;
}
function isValidSolanaAddress(address) {
  if (!address || typeof address !== "string") return false;
  const trimmed = address.trim();
  if (trimmed.length < 32 || trimmed.length > 44 || trimmed.includes(" ")) return false;
  try {
    new PublicKey(trimmed);
    return true;
  } catch {
    return false;
  }
}
function deriveBondingCurvePda(mintPubkey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("bonding-curve"), mintPubkey.toBuffer()],
    PUMP_PROGRAM_ID
  );
}
function deriveMetaplexMetadataPda(mintPubkey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), METAPLEX_PROGRAM_ID.toBuffer(), mintPubkey.toBuffer()],
    METAPLEX_PROGRAM_ID
  );
}
function deriveCanonicalPumpPoolPda(mintPubkey, index = 0) {
  const [authority] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool-authority"), mintPubkey.toBuffer()],
    PUMP_PROGRAM_ID
  );
  const indexBuf = Buffer.alloc(2);
  indexBuf.writeUInt16LE(index, 0);
  const [pool] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("pool"),
      indexBuf,
      authority.toBuffer(),
      mintPubkey.toBuffer(),
      new PublicKey(SOL_MINT_STR).toBuffer()
    ],
    PUMP_AMM_PROGRAM_ID
  );
  return pool;
}
import {
  decodeMetaplexAccountBuffer,
  decodeToken2022Metadata,
  fetchOffChainMetadataWithGateways,
  normalizeUri
} from "../src/lib/providers/metaplexMetadata.js";
function decodeMetaplexMetadata(buffer) {
  return decodeMetaplexAccountBuffer(buffer);
}
function decodeBondingCurveBuffer(buf) {
  if (!buf || buf.length < 49) return null;
  try {
    const decoded = {
      virtualTokenReserves: buf.readBigUInt64LE(8),
      virtualQuoteReserves: buf.readBigUInt64LE(16),
      realTokenReserves: buf.readBigUInt64LE(24),
      realQuoteReserves: buf.readBigUInt64LE(32),
      tokenTotalSupply: buf.readBigUInt64LE(40),
      complete: buf.readUInt8(48) === 1,
      quoteMint: null,
      quoteKnown: false
    };
    decoded.virtualSolReserves = decoded.virtualQuoteReserves;
    decoded.realSolReserves = decoded.realQuoteReserves;
    if (buf.length >= 115) {
      decoded.quoteMint = new PublicKey(buf.subarray(83, 115)).toBase58();
      decoded.quoteKnown = true;
    }
    return decoded;
  } catch {
    return null;
  }
}
async function fetchJsonMetadata(uri) {
  return fetchOffChainMetadataWithGateways(uri, 3500);
}
async function resolvePumpToken(mintAddress, knownCreatedAt) {
  const cleanMint = (mintAddress || "").trim();
  if (!isValidSolanaAddress(cleanMint)) {
    console.log(`[Pump Resolver] INVALID ADDRESS: ${cleanMint}`);
    return {
      status: "INVALID_MINT",
      mint: cleanMint,
      error: "Invalid Solana mint public key format",
      diagnostics: {
        validAddress: false,
        derivedPda: "",
        rpcFound: false,
        decodeSuccess: false,
        finalStatus: "INVALID_MINT"
      }
    };
  }
  let mintPubkey;
  let bondingCurvePda;
  let metaPda;
  let poolPda;
  try {
    mintPubkey = new PublicKey(cleanMint);
    [bondingCurvePda] = deriveBondingCurvePda(mintPubkey);
    [metaPda] = deriveMetaplexMetadataPda(mintPubkey);
    poolPda = deriveCanonicalPumpPoolPda(mintPubkey);
  } catch {
    return {
      status: "INVALID_MINT",
      mint: cleanMint,
      error: "Failed to parse public key",
      diagnostics: {
        validAddress: false,
        derivedPda: "",
        rpcFound: false,
        decodeSuccess: false,
        finalStatus: "INVALID_MINT"
      }
    };
  }
  console.log(`
========================================`);
  console.log(`Pump resolver:`);
  console.log(`VALID ADDRESS: true`);
  console.log(`PDA: ${bondingCurvePda.toBase58()}`);
  const accounts = await getMultipleAccountsWithRetry([bondingCurvePda, mintPubkey, metaPda, poolPda]);
  const accountInfo = accounts[0];
  const mintAccount = accounts[1];
  const metaAccount = accounts[2];
  const poolAcc = accounts[3];
  if (!accountInfo) {
    console.log(`RPC: NOT FOUND`);
    console.log(`FINAL: NOT_PUMPFUN_BONDING_CURVE`);
    console.log(`========================================
`);
    return {
      status: "NOT_PUMPFUN_BONDING_CURVE",
      mint: cleanMint,
      error: "No Pump.fun bonding curve account exists for this mint",
      diagnostics: {
        validAddress: true,
        derivedPda: bondingCurvePda.toBase58(),
        rpcFound: false,
        decodeSuccess: false,
        finalStatus: "NOT_PUMPFUN_BONDING_CURVE"
      }
    };
  }
  console.log(`RPC: FOUND`);
  const programOwner = accountInfo.owner?.toBase58() || "";
  console.log(`OWNER: ${programOwner}`);
  if (!accountInfo.owner.equals(PUMP_PROGRAM_ID)) {
    console.log(`DECODE: FAILURE (Wrong program owner)`);
    console.log(`FINAL: NOT_PUMPFUN_BONDING_CURVE`);
    console.log(`========================================
`);
    return {
      status: "NOT_PUMPFUN_BONDING_CURVE",
      mint: cleanMint,
      error: `Account not owned by Pump program (${PUMP_PROGRAM_ID_STR})`,
      diagnostics: {
        validAddress: true,
        derivedPda: bondingCurvePda.toBase58(),
        rpcFound: true,
        programOwner,
        decodeSuccess: false,
        finalStatus: "NOT_PUMPFUN_BONDING_CURVE"
      }
    };
  }
  const buf = accountInfo.data;
  if (!buf || buf.length < 49) {
    console.log(`DECODE: FAILURE (Invalid buffer length ${buf?.length})`);
    console.log(`FINAL: DECODE_ERROR`);
    console.log(`========================================
`);
    return {
      status: "DECODE_ERROR",
      mint: cleanMint,
      error: `Bonding curve data too short (${buf?.length} bytes)`,
      diagnostics: {
        validAddress: true,
        derivedPda: bondingCurvePda.toBase58(),
        rpcFound: true,
        programOwner,
        decodeSuccess: false,
        finalStatus: "DECODE_ERROR"
      }
    };
  }
  let virtualTokenReserves = 0n;
  let virtualSolReserves = 0n;
  let realTokenReserves = 0n;
  let realSolReserves = 0n;
  let tokenTotalSupply = 0n;
  let complete = false;
  try {
    virtualTokenReserves = buf.readBigUInt64LE(8);
    virtualSolReserves = buf.readBigUInt64LE(16);
    realTokenReserves = buf.readBigUInt64LE(24);
    realSolReserves = buf.readBigUInt64LE(32);
    tokenTotalSupply = buf.readBigUInt64LE(40);
    complete = buf.readUInt8(48) === 1;
  } catch (decodeErr) {
    console.log(`DECODE: FAILURE (${decodeErr.message})`);
    console.log(`FINAL: DECODE_ERROR`);
    console.log(`========================================
`);
    return {
      status: "DECODE_ERROR",
      mint: cleanMint,
      error: decodeErr.message,
      diagnostics: {
        validAddress: true,
        derivedPda: bondingCurvePda.toBase58(),
        rpcFound: true,
        programOwner,
        decodeSuccess: false,
        finalStatus: "DECODE_ERROR"
      }
    };
  }
  console.log(`DECODE: SUCCESS`);
  console.log(`COMPLETE: ${complete}`);
  let bondingProgress = 0;
  if (complete) {
    bondingProgress = 100;
  } else if (realTokenReserves <= 0n) {
    bondingProgress = 100;
  } else if (realTokenReserves >= PUMP_INITIAL_REAL_TOKEN_RESERVES) {
    bondingProgress = 0;
  } else {
    const tokensSold = PUMP_INITIAL_REAL_TOKEN_RESERVES - realTokenReserves;
    const progressBps = tokensSold * 10000n / PUMP_INITIAL_REAL_TOKEN_RESERVES;
    bondingProgress = Math.min(100, Math.max(0, Number(progressBps) / 100));
  }
  console.log(`BONDING: ${bondingProgress.toFixed(2)}%`);
  const solUsdPrice = await getSolUsdPrice();
  const decodedCurve = decodeBondingCurveBuffer(buf);
  const quote = describeQuote(decodedCurve?.quoteMint, !decodedCurve?.quoteKnown);
  const baseDecimals = mintAccount?.data?.length >= 45 && mintAccount.data[45] === 1 ? mintAccount.data[44] : null;
  const valued = withPumpDefaults({
    quoteRaw: virtualSolReserves,
    baseRaw: virtualTokenReserves,
    supplyRaw: tokenTotalSupply,
    quoteMint: decodedCurve?.quoteKnown ? decodedCurve.quoteMint : null,
    legacySol: !decodedCurve?.quoteKnown,
    baseDecimals,
    solUsd: quote.native ? solUsdPrice : null
  });
  const fdvUsd = valued.fdvUsd ?? void 0;
  const marketCapUsd = fdvUsd;
  const realSolReservesFormatted = quote.native ? (Number(realSolReserves) / 1e9).toFixed(3) : "";
  const liquidityUsd = quote.native && solUsdPrice != null ? Math.round(Number(realSolReserves) / 1e9 * solUsdPrice * 100) / 100 : void 0;
  let tokenName = "";
  let tokenSymbol = "";
  let metadataUri = "";
  let imageUrl = "";
  let description = "";
  let twitter = "";
  let telegram = "";
  let website = "";
  if (mintAccount && mintAccount.data) {
    const t22 = decodeToken2022Metadata(mintAccount.data);
    if (t22) {
      if (t22.name) tokenName = t22.name;
      if (t22.symbol) tokenSymbol = t22.symbol;
      if (t22.uri) metadataUri = t22.uri;
    }
  }
  if (metaAccount && metaAccount.data) {
    const meta = decodeMetaplexMetadata(metaAccount.data);
    if (!tokenName && meta.name) tokenName = meta.name;
    if (!tokenSymbol && meta.symbol) tokenSymbol = meta.symbol;
    if (!metadataUri && meta.uri) metadataUri = meta.uri;
  }
  if (metadataUri) {
    try {
      const json = await fetchJsonMetadata(metadataUri);
      if (json) {
        if (json.name && (!tokenName || tokenName.startsWith("Pump Token"))) tokenName = json.name;
        if (json.symbol && (!tokenSymbol || tokenSymbol.length > 10)) tokenSymbol = json.symbol;
        const rawImg = json.image || json.image_uri || json.imageUrl || json.logo || json.icon;
        if (rawImg) {
          imageUrl = normalizeUri(rawImg, 0);
        }
        if (json.description) description = json.description;
        let arrayTw;
        let arrayTg;
        let arrayWeb;
        const scan = (arr) => {
          if (!Array.isArray(arr)) return;
          for (const item of arr) {
            if (!item) continue;
            const url = typeof item === "string" ? item : item.url || item.value || item.link || item.href;
            const type = typeof item === "object" ? String(item.type || item.trait_type || item.name || item.platform || "").toLowerCase() : "";
            if (typeof url === "string") {
              const uLower = url.toLowerCase();
              if (!arrayTw && (type.includes("twitter") || type.includes("x") || uLower.includes("twitter.com") || uLower.includes("x.com"))) arrayTw = url;
              else if (!arrayTg && (type.includes("telegram") || type.includes("tg") || uLower.includes("t.me") || uLower.includes("telegram.me"))) arrayTg = url;
              else if (!arrayWeb && (type.includes("web") || type.includes("site") || !uLower.includes("twitter") && !uLower.includes("x.com") && !uLower.includes("t.me"))) arrayWeb = url;
            }
          }
        };
        scan(json.links);
        scan(json.socials);
        scan(json.attributes);
        scan(json.websites);
        const descText = String(json.description || description || "");
        const tgMatch = descText.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_+]+)/i);
        const twMatch = descText.match(/(?:https?:\/\/|\/\/)?(?:www\.)?(?:mobile\.)?(?:twitter\.com|x\.com)\/[^\s)]+/i);
        const webMatch = descText.match(/https?:\/\/(?!(?:t\.me|telegram\.me|twitter\.com|x\.com|ipfs\.io|arweave\.net|dexscreener\.com|pump\.fun))([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s)]*)?)/i);
        const tw = json.twitter || json.x || json.twitter_url || json.x_url || json.socials?.twitter || json.socials?.x || json.links?.twitter || json.links?.x || json.extensions?.twitter || arrayTw || (twMatch ? preserveXUrl(twMatch[0]) : void 0);
        if (tw) twitter = preserveXUrl(tw);
        const tg = json.telegram || json.tg || json.telegram_url || json.socials?.telegram || json.socials?.tg || json.links?.telegram || json.links?.tg || json.extensions?.telegram || arrayTg || (tgMatch ? `https://t.me/${tgMatch[1]}` : void 0);
        if (tg) telegram = typeof tg === "string" ? tg.startsWith("http") ? tg : `https://t.me/${tg.replace(/^@/, "")}` : "";
        const web = json.website || json.web || json.website_url || json.socials?.website || json.links?.website || json.extensions?.website || json.url || json.external_url || arrayWeb || (webMatch ? webMatch[0] : void 0);
        if (web) website = typeof web === "string" ? web.startsWith("http") ? web : `https://${web}` : "";
      }
    } catch {
    }
  }
  if (!imageUrl || !twitter || !telegram || !website || !description || !tokenName) {
    try {
      const res = await fetch(`https://frontend-api.pump.fun/coins/${cleanMint}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          "Origin": "https://pump.fun",
          "Referer": "https://pump.fun/"
        },
        signal: AbortSignal.timeout(5e3)
      });
      if (res.ok) {
        const pCoin = await res.json();
        if (pCoin) {
          if (!tokenName && pCoin.name) tokenName = pCoin.name;
          if (!tokenSymbol && pCoin.symbol) tokenSymbol = pCoin.symbol;
          if (!imageUrl && (pCoin.image_uri || pCoin.image)) {
            imageUrl = normalizeUri(pCoin.image_uri || pCoin.image, 0);
          }
          if (!description && pCoin.description) description = pCoin.description;
          if (!twitter && (pCoin.twitter || pCoin.x)) {
            const tw = pCoin.twitter || pCoin.x;
            twitter = preserveXUrl(tw);
          }
          if (!telegram && pCoin.telegram) {
            const tg = pCoin.telegram;
            telegram = tg.startsWith("http") ? tg : `https://t.me/${tg.replace(/^@/, "")}`;
          }
          if (!website && pCoin.website) {
            const web = pCoin.website;
            website = web.startsWith("http") ? web : `https://${web}`;
          }
        }
      }
    } catch {
    }
  }
  if (!tokenName) {
    tokenName = `Pump Token (${cleanMint.slice(0, 4)}...${cleanMint.slice(-4)})`;
  }
  if (!tokenSymbol) {
    tokenSymbol = cleanMint.slice(0, 5).toUpperCase();
  }
  let pumpSwapPool = null;
  let pumpSwapPoolVerified = false;
  let marketStage = "bonding_curve";
  let migrationState = "NOT_READY";
  const poolVerified = Boolean(poolAcc && poolAcc.owner && poolAcc.owner.equals(PUMP_AMM_PROGRAM_ID));
  if (poolVerified) {
    marketStage = "pumpswap";
    migrationState = "MIGRATED";
    pumpSwapPool = poolPda.toBase58();
    pumpSwapPoolVerified = true;
  } else if (complete) {
    marketStage = "graduated";
    migrationState = "MIGRATION_PENDING";
  }
  const effectiveLiquidityUsd = liquidityUsd;
  const effectiveMarketCapUsd = marketCapUsd;
  const effectiveFdvUsd = fdvUsd;
  const finalStatus = poolVerified ? "FOUND_PUMPSWAP_ACTIVE" : complete ? "FOUND_GRADUATED" : "FOUND_BONDING_CURVE";
  console.log(`FINAL: ${finalStatus} (Stage: ${marketStage}, Pool Verified: ${pumpSwapPoolVerified})`);
  console.log(`========================================
`);
  const validKnownCreatedAt = normalizeTimestamp(knownCreatedAt);
  const existingIndexerCreatedAt = typeof pumpIndexer !== "undefined" && pumpIndexer?.getToken ? normalizeTimestamp(pumpIndexer.getToken(cleanMint)?.createdAt) : void 0;
  const resolvedCreatedAt = validKnownCreatedAt || existingIndexerCreatedAt || void 0;
  const resolvedPairAddress = poolVerified ? pumpSwapPool || bondingCurvePda.toBase58() : bondingCurvePda.toBase58();
  const tokenState = {
    mint: cleanMint,
    bondingCurvePda: bondingCurvePda.toBase58(),
    owner: programOwner,
    virtualTokenReserves: virtualTokenReserves.toString(),
    virtualSolReserves: quote.native ? virtualSolReserves.toString() : "",
    realTokenReserves: realTokenReserves.toString(),
    realSolReserves: quote.native ? realSolReserves.toString() : "",
    tokenTotalSupply: tokenTotalSupply.toString(),
    complete: complete || poolVerified,
    bondingProgress: poolVerified ? 100 : bondingProgress,
    quoteMint: quote.mint || "",
    quoteNative: quote.native,
    quoteSymbol: quote.symbol || "",
    baseDecimals,
    spotPriceQuote: valued.spotQuote || "",
    spotPriceSol: quote.native && valued.spotQuote ? valued.spotQuote : "",
    spotPriceUsd: valued.spotUsd != null ? valued.spotUsd.toFixed(9) : "",
    fdvSol: void 0,
    fdvUsd: effectiveFdvUsd,
    marketCapUsd: effectiveMarketCapUsd,
    liquidityUsd: effectiveLiquidityUsd,
    solUsdPrice: solUsdPrice !== null ? solUsdPrice : void 0,
    realSolReservesFormatted,
    tokenName,
    tokenSymbol,
    metadataUri,
    imageUrl,
    description,
    twitter,
    telegram,
    website,
    createdAt: resolvedCreatedAt,
    lastRefreshedAt: Date.now(),
    pumpSwapPool,
    pumpswap_pool: pumpSwapPool,
    pumpSwapPoolVerified,
    pairAddress: resolvedPairAddress,
    pairs: poolVerified ? [
      {
        chainId: "solana",
        pairAddress: resolvedPairAddress,
        dexName: "PumpSwap",
        dexId: "pumpswap",
        baseToken: {
          address: cleanMint,
          name: tokenName,
          symbol: tokenSymbol
        },
        quoteToken: {
          address: "So11111111111111111111111111111111111111112",
          name: "Wrapped SOL",
          symbol: "SOL"
        },
        priceUsd: solUsdPrice !== null && spotPriceUsdNum > 0 ? spotPriceUsdNum.toFixed(9) : "0",
        liquidityUsd: effectiveLiquidityUsd
      }
    ] : [
      {
        chainId: "solana",
        pairAddress: bondingCurvePda.toBase58(),
        dexName: "Pump.fun",
        dexId: "pumpfun",
        baseToken: {
          address: cleanMint,
          name: tokenName,
          symbol: tokenSymbol
        },
        quoteToken: {
          address: "So11111111111111111111111111111111111111112",
          name: "Wrapped SOL",
          symbol: "SOL"
        },
        priceUsd: solUsdPrice !== null && spotPriceUsdNum > 0 ? spotPriceUsdNum.toFixed(9) : "0",
        liquidityUsd: effectiveLiquidityUsd
      }
    ],
    migrationState,
    marketStage,
    isBondingCurve: !poolVerified,
    isGraduated: poolVerified,
    dexId: poolVerified ? "pumpswap" : "pumpfun",
    primaryDex: poolVerified ? "PumpSwap" : "Pump.fun",
    sources: poolVerified ? ["PumpSwap", "Pump.fun (On-Chain)"] : ["Pump.fun (On-Chain)"],
    dexes: poolVerified ? ["PumpSwap"] : []
  };
  return {
    status: finalStatus,
    mint: cleanMint,
    token: tokenState,
    diagnostics: {
      validAddress: true,
      derivedPda: bondingCurvePda.toBase58(),
      rpcFound: true,
      programOwner,
      decodeSuccess: true,
      complete,
      bondingProgress,
      finalStatus
    }
  };
}
function isFallbackName(name, mint) {
  if (!name || !name.trim()) return true;
  const n = name.trim();
  if (n.startsWith("Pump Token")) return true;
  if (n.startsWith("Token ") && n.includes("...")) return true;
  if (mint && n.includes(mint.slice(0, 4)) && n.includes(mint.slice(-4))) return true;
  return false;
}
function isFallbackSymbol(symbol, mint) {
  if (!symbol || !symbol.trim()) return true;
  const s = symbol.trim().toUpperCase();
  if (s === "PUMP") return true;
  if (mint && s === mint.slice(0, 5).toUpperCase()) return true;
  return false;
}
async function mapLimit(items, limit, fn) {
  if (items.length === 0) return;
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      await fn(item);
    }
  });
  await Promise.all(workers);
}
class PumpOnChainIndexer {
  tokens = /* @__PURE__ */ new Map();
  processedSignatures = /* @__PURE__ */ new Set();
  isIndexing = false;
  isRefreshing = false;
  lastProcessedSig = "";
  indexIntervalId = null;
  refreshIntervalId = null;
  solVolume = /* @__PURE__ */ new Map();
  logsConn = null;
  logsSub = null;
  lastLogAt = 0;
  watchdogId = null;
  metaInflight = 0;
  constructor() {
    console.log("[Pump Indexer] Initialized.");
  }
  async start() {
    console.log("[Pump Indexer] Starting on-chain discovery and backfill...");
    await this.runBackfill();
    this.resumeMetaJobs();
    this.subscribeCreates().catch((err) => console.warn("[Pump Indexer] logsSubscribe failed:", err?.message || err));
    if (!this.indexIntervalId) {
      this.indexIntervalId = setInterval(() => {
        this.pollLiveSignatures().catch((e) => console.error("[Pump Indexer] Poll error:", e));
      }, 8e3);
    }
    if (!this.refreshIntervalId) {
      this.refreshIntervalId = setInterval(() => {
        this.refreshActiveCurves().catch((e) => console.error("[Pump Indexer] Refresh error:", e));
      }, 2e4);
    }
    if (!this.watchdogId) {
      this.watchdogId = setInterval(() => {
        if (Date.now() - this.lastLogAt > 18e4) {
          this.subscribeCreates().catch(() => {
          });
        }
      }, 3e4);
    }
  }
  stop() {
    if (this.indexIntervalId) clearInterval(this.indexIntervalId);
    if (this.refreshIntervalId) clearInterval(this.refreshIntervalId);
    if (this.watchdogId) clearInterval(this.watchdogId);
    if (this.logsSub != null && this.logsConn) {
      this.logsConn.removeOnLogsListener(this.logsSub).catch(() => {
      });
      this.logsSub = null;
    }
  }
  getAllTokens() {
    return Array.from(this.tokens.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
  getToken(mint) {
    return this.tokens.get(mint);
  }
  async getOrResolveToken(mint) {
    const cleanMint = (mint || "").trim();
    if (this.tokens.has(cleanMint)) {
      const existing = this.tokens.get(cleanMint);
      const needsEnrichment = !existing.complete || isFallbackName(existing.tokenName, cleanMint) || isFallbackSymbol(existing.tokenSymbol, cleanMint) || !existing.imageUrl || !existing.twitter && !existing.telegram && !existing.website;
      if (needsEnrichment) {
        try {
          const res2 = await resolvePumpToken(cleanMint);
          if (res2.token) {
            if (existing.createdAt) res2.token.createdAt = existing.createdAt;
            if (existing.creator) res2.token.creator = existing.creator;
            if (isFallbackName(res2.token.tokenName, cleanMint) && !isFallbackName(existing.tokenName, cleanMint)) {
              res2.token.tokenName = existing.tokenName;
            }
            if (isFallbackSymbol(res2.token.tokenSymbol, cleanMint) && !isFallbackSymbol(existing.tokenSymbol, cleanMint)) {
              res2.token.tokenSymbol = existing.tokenSymbol;
            }
            if (!res2.token.imageUrl && existing.imageUrl) res2.token.imageUrl = existing.imageUrl;
            if (!res2.token.twitter && existing.twitter) res2.token.twitter = existing.twitter;
            if (!res2.token.telegram && existing.telegram) res2.token.telegram = existing.telegram;
            if (!res2.token.website && existing.website) res2.token.website = existing.website;
            this.tokens.set(cleanMint, res2.token);
            return res2.token;
          }
        } catch {
        }
      }
      return existing;
    }
    const res = await resolvePumpToken(cleanMint);
    if (res.token) {
      this.tokens.set(cleanMint, res.token);
      return res.token;
    }
    return null;
  }
  /**
   * Backfills recent Pump token creations upon server boot / recovery
   */
  async runBackfill() {
    console.log("[Pump Indexer] Reading recent creates from the Pump mint authority...");
    try {
      await this.catchUpMintAuthority(3);
    } catch (err) {
      console.warn(`[Pump Indexer] Backfill warning: ${err?.message || err}`);
    }
    console.log(`[Pump Indexer] Backfill complete. Active indexed tokens: ${this.tokens.size}`);
  }
  async catchUpMintAuthority(maxPages) {
    const state = readPumpCursorState();
    let before = state.pendingBefore || "";
    let head = state.pendingHead || "";
    let finished = !state.signature;
    for (let page = 0; page < maxPages; page++) {
      const hit = await this.pollMintAuthority(before, state.signature);
      if (!hit) break;
      if (!before && hit.head && hit.headComplete) head = hit.head;
      if (!hit.headComplete) {
        finished = false;
        break;
      }
      if (!hit.before || hit.reachedCursor) {
        finished = true;
        break;
      }
      before = hit.before;
    }
    if (finished && head) {
      this.lastProcessedSig = head;
      writePumpCursor(head);
    } else if (before && state.signature) {
      writePumpCursor(state.signature, undefined, { pendingBefore: before, pendingHead: head });
    }
  }
  async pollMintAuthority(before, stopAt) {
    if (this.isIndexing) return null;
    this.isIndexing = true;
    try {
      const conn = getSolanaConnection();
      const sigs = await conn.getSignaturesForAddress(PUMP_MINT_AUTHORITY, { limit: 40, before: before || void 0 });
      if (this.processedSignatures.size > 3e3) {
        for (const item of Array.from(this.processedSignatures).slice(0, 500)) {
          this.processedSignatures.delete(item);
        }
      }
      const targets = sigs.filter((s) => !s.err && !this.processedSignatures.has(s.signature));
      const outcomes = new Map();
      await mapLimit(targets, 3, async (s) => {
        const ok = await this.processSignature(s.signature, s.blockTime ? s.blockTime * 1e3 : void 0);
        outcomes.set(s.signature, ok ? "ok" : "retry");
      });
      const plan = nextSignatureCursor(sigs, (row) => {
        if (row.err || this.processedSignatures.has(row.signature)) return "excluded";
        return outcomes.get(row.signature) === "ok" ? "ok" : "retry";
      });
      for (const row of sigs) {
        if (row.err) this.processedSignatures.add(row.signature);
      }
      for (const [sig, kind] of outcomes) {
        if (kind === "ok") this.processedSignatures.add(sig);
      }
      await this.fillMissingNames();
      return {
        before: plan.before,
        head: sigs[0]?.signature || "",
        headComplete: plan.headComplete,
        reachedCursor: Boolean(stopAt && sigs.some((s) => s.signature === stopAt))
      };
    } catch {
      return null;
    } finally {
      this.isIndexing = false;
    }
  }
  async pollLiveSignatures() {
    return this.catchUpMintAuthority(3);
  }
  async subscribeCreates() {
    if (this.logsSub != null && this.logsConn) {
      await this.logsConn.removeOnLogsListener(this.logsSub).catch(() => {
      });
      this.logsSub = null;
    }
    const endpoint = RPC_ENDPOINTS[activeRpcIndex] || "https://solana-rpc.publicnode.com";
    this.logsConn = new Connection(endpoint, {
      commitment: "confirmed",
      wsEndpoint: endpoint.replace(/^https:/, "wss:"),
      disableRetryOnRateLimit: true
    });
    this.logsSub = this.logsConn.onLogs(
      PUMP_MINT_AUTHORITY,
      (info) => {
        this.lastLogAt = Date.now();
        if (info.err || this.processedSignatures.has(info.signature)) return;
        this.ingestLogs(info.signature, info.logs || [], void 0, false).then((ok) => {
          if (ok) this.processedSignatures.add(info.signature);
        }).catch(() => {
        });
      },
      "confirmed"
    );
    this.lastLogAt = Date.now();
    console.log("[Pump Indexer] subscribed to mint-authority creates");
  }
  needsName(t) {
    return !t.tokenName || t.tokenName.startsWith("Pump Token") || !t.tokenSymbol || t.tokenSymbol === "PUMP";
  }
  /**
   * Pump CreateV2 stores the name on the Token-2022 mint, not Metaplex.
   * One batched account read fills symbol, name, and metadata URI.
   */
  async fillMissingNames() {
    const missing = Array.from(this.tokens.values()).filter((t) => this.needsName(t)).slice(0, 20);
    if (missing.length === 0) return;
    const keys = [];
    for (const t of missing) {
      try {
        const mintPk = new PublicKey(t.mint);
        const [metaPda] = deriveMetaplexMetadataPda(mintPk);
        keys.push(mintPk, metaPda);
      } catch {
        keys.push(PUMP_PROGRAM_ID, PUMP_PROGRAM_ID);
      }
    }
    const accounts = await getMultipleAccountsWithRetry(keys);
    for (let i = 0; i < missing.length; i++) {
      const t = missing[i];
      const mintAcc = accounts[i * 2];
      const metaAcc = accounts[i * 2 + 1];
      if (mintAcc?.data && mintAcc.data.length >= 45 && mintAcc.data[45] === 1) {
        const decoded = decodeToken2022Metadata(mintAcc.data);
        t.baseDecimals = mintAcc.data[44];
        if (!t.tokenTotalSupply) t.tokenTotalSupply = mintAcc.data.readBigUInt64LE(36).toString();
        if (decoded?.name) t.tokenName = decoded.name;
        if (decoded?.symbol) t.tokenSymbol = decoded.symbol;
        if (decoded?.uri && !t.metadataUri) t.metadataUri = decoded.uri;
      }
      if (this.needsName(t) && metaAcc?.data) {
        const meta = decodeMetaplexMetadata(metaAcc.data);
        if (meta.name) t.tokenName = meta.name;
        if (meta.symbol) t.tokenSymbol = meta.symbol;
        if (meta.uri && !t.metadataUri) t.metadataUri = meta.uri;
      }
      this.tokens.set(t.mint, t);
    }
  }
  /**
   * Processes a transaction signature to find verified Create / CreateV2 events
   */
  async processSignature(signature, txTimestamp) {
    try {
      const conn = getSolanaConnection();
      const tx = await conn.getTransaction(signature, {
        maxSupportedTransactionVersion: 1,
        commitment: "confirmed"
      });
      if (!tx || !tx.meta) return false;
      if (tx.meta.err) return true;
      const canonicalTime = tx.blockTime ? tx.blockTime * 1e3 : normalizeTimestamp(txTimestamp);
      const found = extractLaunchesFromTransaction(tx);
      if (found.launches.length) {
        const solUsd = await getSolUsdPrice();
        for (const launch of found.launches) {
          this.applyDecodedCreate(launch.ev, launch.ev.timestampMs || canonicalTime, launch.devBuy);
          if (launch.tradeRaw) this.applyTradeEvent(launch.tradeRaw, canonicalTime, solUsd);
        }
        return true;
      }
      const logs = tx.meta.logMessages || [];
      if (!found.parsed || found.sawCreate || logsNeedTransaction(logs)) return false;
      return this.ingestLogs(signature, logs, canonicalTime, true);
    } catch {
      return false;
    }
  }
  async ingestLogs(signature, logs, tradedAt, fromFullTx) {
    const launches = extractLaunches(logs);
    if (!launches.length) {
      // The mint authority only signs creates. Empty or truncated logs still
      // belong to a launch, so fetch the transaction once instead of dropping it.
      if (!fromFullTx && logsNeedTransaction(logs)) {
        return this.processSignature(signature, tradedAt);
      }
      return !logsNeedTransaction(logs);
    }
    for (const launch of launches) {
      this.applyDecodedCreate(launch.ev, launch.ev.timestampMs || tradedAt, launch.devBuy);
    }
    const solUsd = await getSolUsdPrice();
    for (const line of logs) {
      if (!line.startsWith("Program data: ")) continue;
      const raw = Buffer.from(line.slice("Program data: ".length).trim(), "base64");
      if (raw.length < 16 || !raw.subarray(0, 8).equals(TRADE_EVENT_DISC)) continue;
      this.applyTradeEvent(raw, tradedAt, solUsd);
    }
    return true;
  }
  queueMetadata(token) {
    if (!token?.metadataUri || token.imageUrl) return;
    this.metaQueue ??= [];
    this.metaQueued ??= /* @__PURE__ */ new Set();
    if (this.metaQueued.has(token.mint)) return;
    this.metaQueued.add(token.mint);
    this.metaQueue.push(token.mint);
    this.drainMetadata();
  }
  drainMetadata() {
    this.metaQueue ??= [];
    while ((this.metaInflight || 0) < 3 && this.metaQueue.length) {
      const mint = this.metaQueue.shift();
      const token = this.tokens.get(mint);
      if (!token?.metadataUri || token.imageUrl) {
        this.metaQueued?.delete(mint);
        continue;
      }
      this.metaInflight += 1;
      fetchJsonMetadata(token.metadataUri).then((json) => {
        const current = this.tokens.get(mint);
        if (!current) return;
        if (!json) {
          this.rememberMetaOutcome(current, "null");
          return;
        }
        if (json.name && (!current.tokenName || current.tokenName.startsWith("Pump Token"))) {
          current.tokenName = String(json.name).replace(/[\u0000-\u001f]/g, "").trim().slice(0, 64);
        }
        if (json.symbol && (!current.tokenSymbol || current.tokenSymbol === "PUMP")) {
          current.tokenSymbol = String(json.symbol).replace(/[\u0000-\u001f]/g, "").trim().slice(0, 16);
        }
        const rawImg = json.image || json.image_uri || json.imageUrl || json.logo;
        if (typeof rawImg === "string" && rawImg) current.imageUrl = normalizeUri(rawImg, 0);
        if (json.description && !current.description) current.description = String(json.description).slice(0, 280);
        const tw = json.twitter || json.x;
        if (!current.twitter && typeof tw === "string") {
          current.twitter = preserveXUrl(tw);
        }
        const tg = json.telegram || json.tg;
        if (!current.telegram && typeof tg === "string") {
          current.telegram = tg.startsWith("http") ? tg : `https://t.me/${tg.replace(/^@/, "")}`;
        }
        const web = json.website || json.web;
        if (!current.website && typeof web === "string") {
          current.website = web.startsWith("http") ? web : `https://${web}`;
        }
        if (!current.imageUrl) this.rememberMetaOutcome(current, "no-image");
        else this.rememberMetaOutcome(current, "ready");
      }).catch((err) => {
        const current = this.tokens.get(mint);
        const timedOut = /timeout|aborted/i.test(String(err?.message || err));
        if (current) this.rememberMetaOutcome(current, timedOut ? "timeout" : "error");
      }).finally(() => {
        this.metaQueued?.delete(mint);
        this.metaInflight = Math.max(0, this.metaInflight - 1);
        this.drainMetadata();
      });
    }
  }
  rememberMetaOutcome(token, outcome) {
    const next = settleMetadataJob(
      { mint: token.mint, uri: token.metadataUri, attempts: token.metaAttempts || 0 },
      outcome
    );
    if (!next) {
      this.clearMetaJob(token.mint);
      return;
    }
    token.metaAttempts = next.attempts;
    this.upsertMetaJob(next);
    setTimeout(() => {
      const current = this.tokens.get(token.mint);
      if (current && !current.imageUrl) this.queueMetadata(current);
    }, Math.max(0, next.nextAt - Date.now()));
  }
  upsertMetaJob(job) {
    try {
      const jobs = readPumpMetaJobs().filter((row) => row.mint !== job.mint);
      jobs.push(job);
      writePumpMetaJobs(jobs);
    } catch {
    }
  }
  clearMetaJob(mint) {
    try {
      writePumpMetaJobs(readPumpMetaJobs().filter((row) => row.mint !== mint));
    } catch {
    }
  }
  resumeMetaJobs() {
    let jobs = [];
    try {
      jobs = readPumpMetaJobs();
    } catch {
      return;
    }
    const now = Date.now();
    for (const job of jobs) {
      const wait = Math.max(0, (job.nextAt || now) - now);
      setTimeout(() => {
        const current = this.tokens.get(job.mint);
        if (!current || current.imageUrl) return;
        current.metadataUri = current.metadataUri || job.uri;
        current.metaAttempts = job.attempts || 0;
        this.queueMetadata(current);
      }, wait);
    }
  }
  scheduleMetaRetry(mint) {
    const token = this.tokens.get(mint);
    if (!token) return;
    this.rememberMetaOutcome(token, "error");
  }
  ensureToken(mint) {
    const existing = this.tokens.get(mint);
    if (existing) return existing;
    let curve = mint;
    try {
      curve = deriveBondingCurvePda(new PublicKey(mint))[0].toBase58();
    } catch {
    }
    const token = {
      mint,
      bondingCurvePda: curve,
      owner: PUMP_PROGRAM_ID_STR,
      virtualTokenReserves: "",
      virtualSolReserves: "",
      realTokenReserves: "",
      realSolReserves: "",
      tokenTotalSupply: "",
      complete: false,
      bondingProgress: 0,
      spotPriceSol: "0",
      spotPriceUsd: "",
      fdvSol: 0,
      fdvUsd: 0,
      marketCapUsd: 0,
      realSolReservesFormatted: "",
      pairAddress: curve,
      marketStage: "bonding_curve",
      isBondingCurve: true,
      isGraduated: false,
      dexId: "pumpfun",
      primaryDex: "Pump.fun",
      sources: ["Pump.fun (On-Chain)"],
      dexes: [],
      lastRefreshedAt: Date.now()
    };
    this.tokens.set(mint, token);
    if (this.tokens.size > 800) {
      const protectUntil = Date.now() - 10 * 60 * 1000;
      const extras = Array.from(this.tokens.values()).filter((old) => old.mint !== mint && (old.createdAt || old.lastRefreshedAt || 0) < protectUntil).sort((a, b) => (a.lastRefreshedAt || 0) - (b.lastRefreshedAt || 0));
      while (this.tokens.size > 800 && extras.length) {
        this.tokens.delete(extras.shift().mint);
      }
    }
    return token;
  }
  applyDecodedCreate(ev, createdAt, devBuy) {
    if (!ev?.mint) return;
    const token = this.ensureToken(ev.mint);
    const name = String(ev.name || "").replace(/\0/g, "").trim();
    const symbol = String(ev.symbol || "").replace(/\0/g, "").trim();
    if (name) token.tokenName = name;
    if (symbol) token.tokenSymbol = symbol;
    if (ev.uri && !token.metadataUri) token.metadataUri = String(ev.uri).trim();
    if (ev.tokenTotalSupply && !token.tokenTotalSupply) token.tokenTotalSupply = String(ev.tokenTotalSupply);
    if (ev.quoteMint) this.applyQuote(token, describeQuote(ev.quoteMint, false));
    if (ev.bondingCurve) {
      token.bondingCurvePda = ev.bondingCurve;
      token.pairAddress = ev.bondingCurve;
    }
    if ((ev.creator || ev.user) && !token.creator) token.creator = ev.creator || ev.user;
    const chainMs = Number(ev.timestampMs) || createTimestamp(createdAt);
    if (chainMs && !token.createdAt) token.createdAt = chainMs;
    if (!token.discoveredAt) token.discoveredAt = Date.now();
    if (devBuy && token.devBuySol == null && token.quoteNative) {
      const sol = Number(devBuy.solAmount) / 1e9;
      if (Number.isFinite(sol) && sol >= 0) token.devBuySol = sol;
    }
    token.sources = ["Pump.fun (On-Chain)"];
    this.queueMetadata(token);
  }
  applyCreateEvent(raw, createdAt) {
    try {
      const launch = extractLaunch([`Program data: ${Buffer.from(raw).toString("base64")}`]);
      if (launch) this.applyDecodedCreate(launch.ev, createdAt, launch.devBuy);
    } catch {
    }
  }
  applyQuote(token, quote) {
    token.quoteMint = quote.mint || "";
    token.quoteNative = Boolean(quote.native);
    token.quoteSymbol = quote.symbol || "";
    token.quoteDecimals = quote.decimals;
  }
  applyTradeEvent(raw, tradedAt, solUsd) {
    const details = decodeTradeDetails(raw);
    if (!details) return;
    const quote = describeQuote(details.quoteMint, details.legacySol && !details.quoteKnown);
    if (details.quoteKnown && !quote.native && !details.quoteMint) return;
    const token = this.ensureToken(details.mint);
    if (details.quoteKnown || details.legacySol) this.applyQuote(token, quote);
    const supply = token.tokenTotalSupply ? BigInt(token.tokenTotalSupply) : null;
    const valued = withPumpDefaults({
      quoteRaw: details.virtualQuote,
      baseRaw: details.virtualToken,
      supplyRaw: supply,
      quoteMint: details.quoteKnown ? details.quoteMint : null,
      legacySol: details.legacySol && !details.quoteKnown,
      baseDecimals: Number.isInteger(token.baseDecimals) ? token.baseDecimals : null,
      solUsd: quote.native ? solUsd : null
    });
    token.virtualTokenReserves = details.virtualToken.toString();
    token.virtualSolReserves = quote.native ? details.virtualQuote.toString() : "";
    token.virtualQuoteReserves = details.virtualQuote.toString();
    token.realTokenReserves = details.realToken.toString();
    token.realSolReserves = quote.native ? details.realQuote.toString() : "";
    token.realQuoteReserves = details.realQuote.toString();
    if (quote.native) token.realSolReservesFormatted = (Number(details.realQuote) / 1e9).toFixed(3);
    else token.realSolReservesFormatted = "";
    token.spotPriceQuote = valued.spotQuote || "";
    token.spotPriceSol = quote.native && valued.spotQuote ? valued.spotQuote : "";
    token.spotPriceUsd = valued.spotUsd != null ? valued.spotUsd.toFixed(9) : "";
    token.fdvUsd = valued.fdvUsd != null ? valued.fdvUsd : void 0;
    token.marketCapUsd = valued.fdvUsd != null ? valued.fdvUsd : void 0;
    token.fdvSol = quote.native && valued.spotQuote ? Number(valued.spotQuote) * (supply && token.baseDecimals != null ? Number(supply) / 10 ** token.baseDecimals : NaN) : void 0;
    if (!Number.isFinite(token.fdvSol)) token.fdvSol = void 0;
    token.liquidityUsd = quote.native && solUsd && details.realQuote > 0n ? Math.round(Number(details.realQuote) / 1e9 * solUsd * 100) / 100 : void 0;
    let progress = 0;
    if (details.realToken <= 0n) progress = 100;
    else if (details.realToken < PUMP_INITIAL_REAL_TOKEN_RESERVES) {
      const sold = PUMP_INITIAL_REAL_TOKEN_RESERVES - details.realToken;
      progress = Math.min(100, Number(sold * 10000n / PUMP_INITIAL_REAL_TOKEN_RESERVES) / 100);
    }
    token.bondingProgress = progress;
    token.complete = details.realToken <= 0n;
    token.isBondingCurve = details.realToken > 0n;
    token.isGraduated = false;
    token.marketStage = "bonding_curve";
    token.solUsdPrice = quote.native ? solUsd ?? void 0 : void 0;
    token.lastRefreshedAt = Date.now();
    const chainTime = createTimestamp(tradedAt) || (details.timestamp > 1e9 && details.timestamp < 1e12 ? details.timestamp * 1000 : null);
    const folded = foldTradeVolume(this.solVolume.get(details.mint), {
      tradedAt: chainTime,
      quoteNative: quote.native,
      quoteSol: quote.native ? Number(details.explicitQuoteAmount || details.quoteAmount) / 1e9 : null,
      solUsd: quote.native ? solUsd : null,
      now: Date.now()
    });
    this.solVolume.set(details.mint, folded.rows);
    token.volumePartial = folded.partial;
    token.volumeObservedUsd = folded.volumeObservedUsd ?? void 0;
    token.volumeComplete = folded.volumeComplete;
    token.volume24h = folded.volumeObservedUsd ?? void 0;
  }
  /**
   * Refreshes active bonding curve states and heals missing token metadata
   * Uses batched RPC account lookups and a balanced staleness scoring strategy
   * so numeric refreshes are never starved by metadata queues.
   */
  async refreshActiveCurves() {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    try {
      const isPlaceholder = (t) => !t.tokenName || t.tokenName.startsWith("Pump Token") || !t.tokenSymbol || t.tokenSymbol === "PUMP" || t.tokenSymbol.length > 8 || !t.imageUrl;
      const now = Date.now();
      const getStalenessScore = (t) => {
        const lastRefreshed = t.lastRefreshedAt || t.createdAt || 0;
        const stalenessAge = now - lastRefreshed;
        const activeCurveBoost = !t.complete ? 3e4 : 0;
        const metadataBoost = isPlaceholder(t) ? 6e4 : 0;
        return stalenessAge + activeCurveBoost + metadataBoost;
      };
      const candidateTokens = Array.from(this.tokens.values()).sort((a, b) => getStalenessScore(b) - getStalenessScore(a)).slice(0, 30);
      if (candidateTokens.length === 0) return;
      const pdasToFetch = [];
      for (const t of candidateTokens) {
        try {
          const mintPk = new PublicKey(t.mint);
          const [curvePda] = deriveBondingCurvePda(mintPk);
          const [metaPda] = deriveMetaplexMetadataPda(mintPk);
          const poolPda = deriveCanonicalPumpPoolPda(mintPk);
          pdasToFetch.push(curvePda, metaPda, poolPda);
        } catch {
          pdasToFetch.push(PUMP_PROGRAM_ID, PUMP_PROGRAM_ID, PUMP_PROGRAM_ID);
        }
      }
      const accounts = await getMultipleAccountsWithRetry(pdasToFetch);
      const solUsdPrice = await getSolUsdPrice();
      for (let i = 0; i < candidateTokens.length; i++) {
        const t = candidateTokens[i];
        const curveAcc = accounts[i * 3];
        const metaAcc = accounts[i * 3 + 1];
        const poolAcc = accounts[i * 3 + 2];
        try {
          if (curveAcc && curveAcc.data) {
            const decoded = decodeBondingCurveBuffer(curveAcc.data);
            if (decoded) {
              const {
                virtualTokenReserves,
                virtualSolReserves,
                realTokenReserves,
                realSolReserves,
                tokenTotalSupply,
                complete
              } = decoded;
              let bondingProgress = 0;
              if (complete || realTokenReserves <= 0n) {
                bondingProgress = 100;
              } else if (realTokenReserves >= PUMP_INITIAL_REAL_TOKEN_RESERVES) {
                bondingProgress = 0;
              } else {
                const tokensSold = PUMP_INITIAL_REAL_TOKEN_RESERVES - realTokenReserves;
                const progressBps = tokensSold * 10000n / PUMP_INITIAL_REAL_TOKEN_RESERVES;
                bondingProgress = Math.min(100, Math.max(0, Number(progressBps) / 100));
              }
              const quote = describeQuote(decoded.quoteKnown ? decoded.quoteMint : null, !decoded.quoteKnown);
              const valued = withPumpDefaults({
                quoteRaw: virtualSolReserves,
                baseRaw: virtualTokenReserves,
                supplyRaw: tokenTotalSupply,
                quoteMint: decoded.quoteKnown ? decoded.quoteMint : null,
                legacySol: !decoded.quoteKnown,
                baseDecimals: Number.isInteger(t.baseDecimals) ? t.baseDecimals : null,
                solUsd: quote.native ? solUsdPrice : null
              });
              const realSolReservesFormatted = quote.native ? (Number(realSolReserves) / 1e9).toFixed(3) : "";
              const liquidityUsd = quote.native && solUsdPrice != null ? Math.round(Number(realSolReserves) / 1e9 * solUsdPrice * 100) / 100 : void 0;
              t.virtualTokenReserves = virtualTokenReserves.toString();
              t.virtualSolReserves = quote.native ? virtualSolReserves.toString() : "";
              t.virtualQuoteReserves = virtualSolReserves.toString();
              t.realTokenReserves = realTokenReserves.toString();
              t.realSolReserves = quote.native ? realSolReserves.toString() : "";
              t.realQuoteReserves = realSolReserves.toString();
              t.tokenTotalSupply = tokenTotalSupply.toString();
              this.applyQuote(t, quote);
              const poolVerified = Boolean(poolAcc && poolAcc.owner && poolAcc.owner.equals(PUMP_AMM_PROGRAM_ID));
              t.complete = complete;
              t.bondingProgress = complete ? 100 : bondingProgress;
              t.spotPriceQuote = valued.spotQuote || "";
              t.spotPriceSol = quote.native && valued.spotQuote ? valued.spotQuote : "";
              t.spotPriceUsd = valued.spotUsd != null ? valued.spotUsd.toFixed(9) : "";
              t.fdvSol = void 0;
              t.fdvUsd = valued.fdvUsd ?? void 0;
              t.marketCapUsd = valued.fdvUsd ?? void 0;
              t.liquidityUsd = liquidityUsd;
              t.solUsdPrice = quote.native && solUsdPrice !== null ? solUsdPrice : void 0;
              t.realSolReservesFormatted = realSolReservesFormatted;
              t.isBondingCurve = !poolVerified && !complete;
              t.isGraduated = poolVerified;
              if (poolVerified) {
                t.marketStage = "pumpswap";
                t.migrationState = "MIGRATED";
                const poolPda = pdasToFetch[i * 3 + 2];
                if (poolPda) {
                  t.pumpSwapPool = poolPda.toBase58();
                  t.pumpswap_pool = poolPda.toBase58();
                  t.pairAddress = poolPda.toBase58();
                }
                if (poolAcc && poolAcc.owner && poolAcc.owner.equals(PUMP_AMM_PROGRAM_ID)) {
                  t.pumpSwapPoolVerified = true;
                }
                t.dexId = "pumpswap";
                t.primaryDex = "PumpSwap";
                t.sources = ["PumpSwap", "Pump.fun (On-Chain)"];
                t.dexes = ["PumpSwap"];
                t.pairs = [
                  {
                    chainId: "solana",
                    pairAddress: t.pairAddress || t.bondingCurvePda,
                    dexName: "PumpSwap",
                    dexId: "pumpswap",
                    baseToken: {
                      address: t.mint,
                      name: t.tokenName,
                      symbol: t.tokenSymbol
                    },
                    quoteToken: {
                      address: "So11111111111111111111111111111111111111112",
                      name: "Wrapped SOL",
                      symbol: "SOL"
                    },
                    priceUsd: t.spotPriceUsd || "0",
                    liquidityUsd: t.liquidityUsd
                  }
                ];
              } else {
                t.marketStage = "bonding_curve";
                t.migrationState = "NOT_READY";
                t.dexId = "pumpfun";
                t.primaryDex = "Pump.fun";
                t.sources = ["Pump.fun (On-Chain)"];
                t.dexes = [];
                t.pairs = [
                  {
                    chainId: "solana",
                    pairAddress: t.bondingCurvePda,
                    dexName: "Pump.fun",
                    dexId: "pumpfun",
                    baseToken: {
                      address: t.mint,
                      name: t.tokenName,
                      symbol: t.tokenSymbol
                    },
                    quoteToken: {
                      address: "So11111111111111111111111111111111111111112",
                      name: "Wrapped SOL",
                      symbol: "SOL"
                    },
                    priceUsd: t.spotPriceUsd || "0",
                    liquidityUsd: t.liquidityUsd
                  }
                ];
              }
            }
          }
          if (isPlaceholder(t)) {
            if (metaAcc && metaAcc.data) {
              const meta = decodeMetaplexMetadata(metaAcc.data);
              if (meta.name && (!t.tokenName || t.tokenName.startsWith("Pump Token"))) t.tokenName = meta.name;
              if (meta.symbol && (!t.tokenSymbol || t.tokenSymbol === "PUMP")) t.tokenSymbol = meta.symbol;
              if (meta.uri && !t.metadataUri) t.metadataUri = meta.uri;
            }
          }
          t.lastRefreshedAt = now;
          this.tokens.set(t.mint, t);
        } catch {
        }
      }
      const needsOffChainFetch = candidateTokens.filter(
        (t) => t.metadataUri && (!t.imageUrl || !t.twitter && !t.telegram && !t.website)
      );
      await Promise.allSettled(
        needsOffChainFetch.map(async (t) => {
          try {
            const json = await fetchJsonMetadata(t.metadataUri);
            if (json) {
              if (json.name && (!t.tokenName || t.tokenName.startsWith("Pump Token"))) t.tokenName = json.name;
              if (json.symbol && (!t.tokenSymbol || t.tokenSymbol === "PUMP")) t.tokenSymbol = json.symbol;
              const rawImg = json.image || json.image_uri || json.imageUrl || json.logo || json.icon;
              if (rawImg) t.imageUrl = normalizeUri(rawImg, 0);
              if (json.description && !t.description) t.description = json.description;
              if (!t.twitter && (json.twitter || json.x)) {
                const tw = json.twitter || json.x;
                t.twitter = typeof tw === "string" ? preserveXUrl(tw) : "";
              }
              if (!t.telegram && (json.telegram || json.tg)) {
                const tg = json.telegram || json.tg;
                t.telegram = typeof tg === "string" ? tg.startsWith("http") ? tg : `https://t.me/${tg.replace(/^@/, "")}` : "";
              }
              if (!t.website && (json.website || json.web)) {
                const web = json.website || json.web;
                t.website = typeof web === "string" ? web.startsWith("http") ? web : `https://${web}` : "";
              }
              this.tokens.set(t.mint, t);
            }
          } catch {
          }
        })
      );
    } catch {
    } finally {
      this.isRefreshing = false;
    }
  }
}
const pumpGlobal = globalThis;
const pumpIndexer = pumpGlobal.__dexhunterPump ??= new PumpOnChainIndexer();
export {
  METAPLEX_PROGRAM_ID,
  PUMP_AMM_PROGRAM_ID,
  PUMP_MINT_AUTHORITY,
  PUMP_PROGRAM_ID,
  decodeBondingCurveBuffer,
  decodeMetaplexMetadata,
  deriveBondingCurvePda,
  deriveCanonicalPumpPoolPda,
  deriveMetaplexMetadataPda,
  fetchJsonMetadata,
  getAccountInfoWithRetry,
  getMultipleAccountsWithRetry,
  getSolUsdPrice,
  getSolUsdPriceDetails,
  getSolanaConnection,
  isFallbackName,
  isFallbackSymbol,
  isValidSolanaAddress,
  normalizeTimestamp,
  pumpIndexer,
  resolvePumpToken,
  rotateRpc
};
