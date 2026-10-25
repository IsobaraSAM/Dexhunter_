// @ts-nocheck
import { PublicKey } from "@solana/web3.js";
import axios from "axios";
import {
  deriveMetaplexMetadataPda,
  decodeMetaplexAccountBuffer,
  decodeToken2022Metadata,
  normalizeUri,
  IPFS_GATEWAYS,
  ARWEAVE_GATEWAYS
} from "../src/lib/providers/metaplexMetadata.js";
import {
  deriveBondingCurvePda,
  deriveCanonicalPumpPoolPda,
  getMultipleAccountsWithRetry,
  getSolUsdPrice,
  resolvePumpToken,
  PUMP_PROGRAM_ID,
  METAPLEX_PROGRAM_ID,
  PUMP_AMM_PROGRAM_ID
} from "./pump-engine.js";
import { PUMP_INITIAL_REAL_TOKEN_RESERVES } from "../src/lib/pumpConstants.js";
async function handler(req, res) {
  const mint = (req.query?.mint || req.query?.address || req.query?.token || "").trim();
  const debug = req.query?.debug === "true" || req.query?.debug === "1" || req.query?.raw === "true";
  if (!mint) {
    return res.status(400).json({
      success: false,
      error: "Missing required mint query parameter (e.g. /api/pumpfun-diagnostic?mint=<TOKEN_MINT_ADDRESS>)",
      usage: "/api/pumpfun-diagnostic?mint=So11111111111111111111111111111111111111112&debug=true"
    });
  }
  const overallStartMs = Date.now();
  const auditTrail = [];
  const s1Start = Date.now();
  let mintPubkey;
  try {
    if (mint.length < 32 || mint.length > 44 || mint.includes(" ")) {
      throw new Error("Mint length or character set invalid for Solana base58");
    }
    mintPubkey = new PublicKey(mint);
    auditTrail.push({
      stage: "STAGE_1_VALIDATION",
      name: "Solana Mint PublicKey Validation",
      status: "SUCCESS",
      durationMs: Date.now() - s1Start,
      details: {
        mint,
        isValidBase58: true
      }
    });
  } catch (err) {
    auditTrail.push({
      stage: "STAGE_1_VALIDATION",
      name: "Solana Mint PublicKey Validation",
      status: "FAILURE",
      durationMs: Date.now() - s1Start,
      details: {
        mint,
        error: err.message || "Invalid base58 format"
      }
    });
    return res.status(400).json({
      success: false,
      mint,
      error: "Invalid Solana mint address format",
      auditTrail
    });
  }
  const s2Start = Date.now();
  const [bondingCurvePda, bondingCurveBump] = deriveBondingCurvePda(mintPubkey);
  const metaPda = deriveMetaplexMetadataPda(mintPubkey);
  const poolPda = deriveCanonicalPumpPoolPda(mintPubkey);
  auditTrail.push({
    stage: "STAGE_2_DERIVATION",
    name: "On-Chain Program Address (PDA) Derivations",
    status: "SUCCESS",
    durationMs: Date.now() - s2Start,
    details: {
      bondingCurvePda: bondingCurvePda.toBase58(),
      bondingCurveBump,
      metaplexMetadataPda: metaPda.toBase58(),
      pumpSwapAmmPoolPda: poolPda.toBase58()
    }
  });
  try {
    const s3Start = Date.now();
    const accounts = await getMultipleAccountsWithRetry([
      bondingCurvePda,
      mintPubkey,
      metaPda,
      poolPda
    ]);
    const bondingAcc = accounts[0];
    const mintAcc = accounts[1];
    const metaAcc = accounts[2];
    const poolAcc = accounts[3];
    const bondingExists = Boolean(bondingAcc);
    const bondingOwner = bondingAcc?.owner?.toBase58() || null;
    const isPumpCurve = bondingAcc ? bondingAcc.owner.equals(PUMP_PROGRAM_ID) : false;
    const mintExists = Boolean(mintAcc);
    const mintOwner = mintAcc?.owner?.toBase58() || null;
    const isToken2022 = mintOwner === "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
    const metaExists = Boolean(metaAcc);
    const metaOwner = metaAcc?.owner?.toBase58() || null;
    const isMetaplexOwned = metaAcc ? metaAcc.owner.equals(METAPLEX_PROGRAM_ID) : false;
    const poolExists = Boolean(poolAcc);
    const poolOwner = poolAcc?.owner?.toBase58() || null;
    const isPumpAmm = poolAcc ? poolAcc.owner.equals(PUMP_AMM_PROGRAM_ID) : false;
    auditTrail.push({
      stage: "STAGE_3_RPC_ACCOUNTS",
      name: "Batch RPC On-Chain Account Retrieval",
      status: bondingExists && isPumpCurve ? "SUCCESS" : bondingExists ? "WARNING" : "FAILURE",
      durationMs: Date.now() - s3Start,
      details: {
        bondingCurveAccount: {
          exists: bondingExists,
          owner: bondingOwner,
          isPumpProgram: isPumpCurve,
          dataLength: bondingAcc?.data?.length || 0
        },
        mintAccount: {
          exists: mintExists,
          owner: mintOwner,
          isToken2022,
          dataLength: mintAcc?.data?.length || 0
        },
        metaplexMetadataAccount: {
          exists: metaExists,
          owner: metaOwner,
          isMetaplexProgram: isMetaplexOwned,
          dataLength: metaAcc?.data?.length || 0
        },
        pumpSwapPoolAccount: {
          exists: poolExists,
          owner: poolOwner,
          isPumpAmmProgram: isPumpAmm,
          dataLength: poolAcc?.data?.length || 0
        }
      }
    });
    const s4Start = Date.now();
    let complete = null;
    let virtualTokenReserves = "0";
    let virtualSolReserves = "0";
    let realTokenReserves = "0";
    let realSolReserves = "0";
    let tokenTotalSupply = "0";
    let bondingProgressPct = 0;
    if (bondingAcc && bondingAcc.data && bondingAcc.data.length >= 49 && isPumpCurve) {
      try {
        const buf = bondingAcc.data;
        const vToken = buf.readBigUInt64LE(8);
        const vSol = buf.readBigUInt64LE(16);
        const rToken = buf.readBigUInt64LE(24);
        const rSol = buf.readBigUInt64LE(32);
        const supply = buf.readBigUInt64LE(40);
        complete = buf.readUInt8(48) === 1;
        virtualTokenReserves = vToken.toString();
        virtualSolReserves = vSol.toString();
        realTokenReserves = rToken.toString();
        realSolReserves = rSol.toString();
        tokenTotalSupply = supply.toString();
        if (complete) {
          bondingProgressPct = 100;
        } else if (rToken <= 0n) {
          bondingProgressPct = 100;
        } else if (rToken >= PUMP_INITIAL_REAL_TOKEN_RESERVES) {
          bondingProgressPct = 0;
        } else {
          const sold = PUMP_INITIAL_REAL_TOKEN_RESERVES - rToken;
          const bps = sold * 10000n / PUMP_INITIAL_REAL_TOKEN_RESERVES;
          bondingProgressPct = Math.min(100, Math.max(0, Number(bps) / 100));
        }
        auditTrail.push({
          stage: "STAGE_4_BONDING_DECODE",
          name: "Bonding Curve Reserve & Graduation Calculation",
          status: "SUCCESS",
          durationMs: Date.now() - s4Start,
          details: {
            complete,
            bondingProgressPct,
            virtualTokenReserves,
            virtualSolReserves,
            realTokenReserves,
            realSolReserves,
            tokenTotalSupply
          }
        });
      } catch (decErr) {
        auditTrail.push({
          stage: "STAGE_4_BONDING_DECODE",
          name: "Bonding Curve Reserve & Graduation Calculation",
          status: "FAILURE",
          durationMs: Date.now() - s4Start,
          details: { error: decErr.message }
        });
      }
    } else {
      auditTrail.push({
        stage: "STAGE_4_BONDING_DECODE",
        name: "Bonding Curve Reserve & Graduation Calculation",
        status: bondingExists ? "FAILURE" : "SKIPPED",
        durationMs: Date.now() - s4Start,
        details: {
          reason: bondingExists ? "Account data buffer too short or not owned by Pump Program" : "No bonding curve account found on-chain"
        }
      });
    }
    const s5Start = Date.now();
    let onChainName = "";
    let onChainSymbol = "";
    let onChainUri = "";
    let sellerFeeBasisPoints = 0;
    let metadataSource = "none";
    if (mintAcc && mintAcc.data) {
      const t22 = decodeToken2022Metadata(mintAcc.data);
      if (t22) {
        onChainName = t22.name;
        onChainSymbol = t22.symbol;
        onChainUri = t22.uri;
        metadataSource = "Token-2022 (Extension Type 19 in Mint Account)";
      }
    }
    if ((!onChainName || !onChainUri) && metaAcc && metaAcc.data && isMetaplexOwned) {
      try {
        const decodedOnChain = decodeMetaplexAccountBuffer(metaAcc.data);
        if (!onChainName && decodedOnChain.name) onChainName = decodedOnChain.name;
        if (!onChainSymbol && decodedOnChain.symbol) onChainSymbol = decodedOnChain.symbol;
        if (!onChainUri && decodedOnChain.uri) onChainUri = decodedOnChain.uri;
        if (decodedOnChain.sellerFeeBasisPoints) sellerFeeBasisPoints = decodedOnChain.sellerFeeBasisPoints;
        if (metadataSource === "none") metadataSource = "Metaplex V1 Metadata PDA";
      } catch {
      }
    }
    if (onChainName || onChainSymbol || onChainUri) {
      auditTrail.push({
        stage: "STAGE_5_METADATA_DECODE",
        name: "On-Chain Token Metadata Decoding (Token-2022 / Metaplex)",
        status: "SUCCESS",
        durationMs: Date.now() - s5Start,
        details: {
          source: metadataSource,
          name: onChainName,
          symbol: onChainSymbol,
          uri: onChainUri,
          sellerFeeBasisPoints
        }
      });
    } else {
      auditTrail.push({
        stage: "STAGE_5_METADATA_DECODE",
        name: "On-Chain Token Metadata Decoding (Token-2022 / Metaplex)",
        status: "WARNING",
        durationMs: Date.now() - s5Start,
        details: {
          reason: "No Token-2022 metadata extension found on mint account and no Metaplex PDA found on-chain"
        }
      });
    }
    const s6Start = Date.now();
    let offChainJson = null;
    let offChainFetchTimeMs = 0;
    const gatewayResults = [];
    if (onChainUri) {
      const isArweave = onChainUri.includes("ar://") || onChainUri.includes("arweave");
      const gateways = isArweave ? ARWEAVE_GATEWAYS : IPFS_GATEWAYS;
      const gatewayLimit = Math.min(gateways.length, 4);
      for (let i = 0; i < gatewayLimit; i++) {
        const testUrl = normalizeUri(onChainUri, i);
        const gStart = Date.now();
        try {
          const res2 = await axios.get(testUrl, {
            timeout: 3e3,
            headers: { Accept: "application/json", "User-Agent": "curl/8.4.0" }
          });
          const gDuration = Date.now() - gStart;
          if (res2.data && typeof res2.data === "object") {
            if (!offChainJson) offChainJson = res2.data;
            gatewayResults.push({ gateway: gateways[i], url: testUrl, success: true, durationMs: gDuration });
          } else {
            gatewayResults.push({ gateway: gateways[i], url: testUrl, success: false, durationMs: gDuration, error: "Invalid JSON response" });
          }
        } catch (err) {
          gatewayResults.push({ gateway: gateways[i], url: testUrl, success: false, durationMs: Date.now() - gStart, error: err.message });
        }
      }
      offChainFetchTimeMs = Date.now() - s6Start;
      auditTrail.push({
        stage: "STAGE_6_OFFCHAIN_GATEWAYS",
        name: "Decentralized IPFS/Arweave JSON Metadata Fetch",
        status: offChainJson ? "SUCCESS" : "WARNING",
        durationMs: offChainFetchTimeMs,
        details: {
          rawUri: onChainUri,
          resolvedJson: Boolean(offChainJson),
          gatewayAttempts: gatewayResults
        }
      });
    } else {
      auditTrail.push({
        stage: "STAGE_6_OFFCHAIN_GATEWAYS",
        name: "Decentralized IPFS/Arweave JSON Metadata Fetch",
        status: "SKIPPED",
        durationMs: 0,
        details: { reason: "No on-chain metadata URI available" }
      });
    }
    const s7Start = Date.now();
    let pumpApiData = null;
    try {
      const pRes = await axios.get(`https://frontend-api.pump.fun/coins/${mint}`, {
        timeout: 5e3,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          Accept: "application/json, text/plain, */*",
          Referer: "https://pump.fun/"
        }
      });
      if (pRes.data) {
        pumpApiData = pRes.data;
      }
      auditTrail.push({
        stage: "STAGE_7_PUMP_API_ENRICHMENT",
        name: "Pump.fun API Secondary Verification",
        status: "SUCCESS",
        durationMs: Date.now() - s7Start,
        details: {
          reachable: true,
          hasName: Boolean(pumpApiData?.name),
          hasImage: Boolean(pumpApiData?.image_uri || pumpApiData?.image),
          hasSocials: Boolean(pumpApiData?.twitter || pumpApiData?.telegram || pumpApiData?.website)
        }
      });
    } catch (err) {
      auditTrail.push({
        stage: "STAGE_7_PUMP_API_ENRICHMENT",
        name: "Pump.fun API Secondary Verification",
        status: "WARNING",
        durationMs: Date.now() - s7Start,
        details: { reachable: false, error: err.message }
      });
    }
    const s8Start = Date.now();
    const resolvedResult = await resolvePumpToken(mint);
    const solPrice = await getSolUsdPrice();
    const token = resolvedResult.token;
    auditTrail.push({
      stage: "STAGE_8_AGGREGATOR_NORMALIZATION",
      name: "Aggregator Field-Level Merging & Normalization",
      status: resolvedResult.status.startsWith("FOUND") ? "SUCCESS" : "WARNING",
      durationMs: Date.now() - s8Start,
      details: {
        resolutionStatus: resolvedResult.status,
        marketStage: token?.marketStage || "unknown",
        migrationState: token?.migrationState || "unknown",
        spotPriceUsd: token?.spotPriceUsd || null,
        marketCapUsd: token?.marketCapUsd || null
      }
    });
    const finalName = token?.tokenName || offChainJson?.name || pumpApiData?.name || onChainName || `Pump Token (${mint.slice(0, 4)}...${mint.slice(-4)})`;
    const finalSymbol = token?.tokenSymbol || offChainJson?.symbol || pumpApiData?.symbol || onChainSymbol || "PUMP";
    const finalDescription = token?.description || offChainJson?.description || pumpApiData?.description || "";
    const rawImg = token?.imageUrl || offChainJson?.image || offChainJson?.image_uri || pumpApiData?.image_uri || pumpApiData?.image || "";
    const finalImageUrl = rawImg ? normalizeUri(rawImg, 0) : "";
    const twitter = token?.twitter || offChainJson?.twitter || offChainJson?.x || pumpApiData?.twitter || pumpApiData?.x || null;
    const telegram = token?.telegram || offChainJson?.telegram || offChainJson?.tg || pumpApiData?.telegram || null;
    const website = token?.website || offChainJson?.website || offChainJson?.web || pumpApiData?.website || null;
    const totalElapsedMs = Date.now() - overallStartMs;
    const normalizedAggregatorToken = {
      chainId: "solana",
      dexId: token?.marketStage === "pumpswap" ? "pumpswap" : "pumpfun",
      url: `https://pump.fun/coin/${mint}`,
      pairAddress: token?.bondingCurvePda || bondingCurvePda.toBase58(),
      baseToken: {
        address: mint,
        name: finalName,
        symbol: finalSymbol
      },
      quoteToken: {
        address: "So11111111111111111111111111111111111111112",
        name: "Wrapped SOL",
        symbol: "SOL"
      },
      priceNative: token?.spotPriceSol || "0",
      priceUsd: token?.spotPriceUsd || "0",
      txns: {
        m5: { buys: 0, sells: 0 },
        h1: { buys: 0, sells: 0 },
        h6: { buys: 0, sells: 0 },
        h24: { buys: 0, sells: 0 }
      },
      volume: {
        h24: 0,
        h6: 0,
        h1: 0,
        m5: 0
      },
      priceChange: {
        m5: 0,
        h1: 0,
        h6: 0,
        h24: 0
      },
      liquidity: {
        usd: token?.liquidityUsd !== void 0 ? Number(token.liquidityUsd) : token?.realSolReservesFormatted && solPrice ? Number(token.realSolReservesFormatted) * solPrice : 0,
        base: Number(realTokenReserves) / 1e6,
        quote: Number(token?.realSolReservesFormatted) || 0
      },
      fdv: token?.fdvUsd || 0,
      marketCap: token?.marketCapUsd || 0,
      info: {
        imageUrl: finalImageUrl,
        websites: website ? [{ label: "Website", url: website }] : [],
        socials: [
          ...twitter ? [{ type: "twitter", url: twitter }] : [],
          ...telegram ? [{ type: "telegram", url: telegram }] : []
        ]
      },
      isBondingCurve: token?.isBondingCurve ?? !complete,
      graduationPercentage: token?.bondingProgress ?? bondingProgressPct,
      bondingCurveProgress: token?.bondingProgress ?? bondingProgressPct,
      realSolReserves: token?.realSolReservesFormatted || "0",
      marketStage: token?.marketStage || (complete ? "graduated_pending" : "bonding_curve"),
      migrationState: token?.migrationState || (complete ? "MIGRATION_PENDING" : "NOT_READY"),
      pumpSwapPool: token?.pumpSwapPool || poolPda.toBase58(),
      pumpSwapPoolVerified: token?.pumpSwapPoolVerified || (poolAcc?.owner.equals(PUMP_AMM_PROGRAM_ID) ?? false)
    };
    const migrationStatus = {
      isBondingCurve: !complete,
      complete: Boolean(complete),
      bondingProgressPct: token?.bondingProgress ?? bondingProgressPct,
      marketStage: token?.marketStage || (complete ? "graduated_pending" : "bonding_curve"),
      migrationState: token?.migrationState || (complete ? "MIGRATION_PENDING" : "NOT_READY"),
      isGraduated: Boolean(complete),
      bondingCurvePda: bondingCurvePda.toBase58(),
      pumpSwapPoolPda: poolPda.toBase58(),
      pumpSwapPoolVerified: token?.pumpSwapPoolVerified || (poolAcc?.owner.equals(PUMP_AMM_PROGRAM_ID) ?? false),
      realSolReservesSol: token?.realSolReservesFormatted || (Number(realSolReserves) / 1e9).toFixed(3),
      realTokenReservesFormatted: (Number(realTokenReserves) / 1e6).toFixed(0),
      virtualTokenReserves: String(virtualTokenReserves),
      virtualSolReserves: String(virtualSolReserves)
    };
    const onChainMetadataInfo = onChainName || onChainSymbol || onChainUri ? {
      source: metadataSource,
      name: onChainName,
      symbol: onChainSymbol,
      uri: onChainUri,
      sellerFeeBasisPoints
    } : null;
    const rawMetadata = {
      onChainMetadata: onChainMetadataInfo,
      onChainBondingCurve: bondingAcc ? {
        exists: true,
        owner: bondingOwner,
        isPumpProgram: isPumpCurve,
        dataLength: bondingAcc.data?.length || 0
      } : null,
      onChainPoolAccount: poolAcc ? {
        exists: true,
        owner: poolOwner,
        isPumpAmmProgram: isPumpAmm,
        dataLength: poolAcc.data?.length || 0
      } : null,
      offChainJson: offChainJson || null,
      pumpApiData: pumpApiData || null,
      engineTokenState: token || null
    };
    const normalizedFields = {
      mint,
      name: finalName,
      symbol: finalSymbol,
      description: finalDescription,
      imageUrl: finalImageUrl,
      socials: {
        twitter,
        telegram,
        website
      },
      hasLogo: Boolean(finalImageUrl),
      hasSocials: Boolean(twitter || telegram || website),
      priceSol: token?.spotPriceSol || "0",
      priceUsd: token?.spotPriceUsd || "0",
      marketCapUsd: token?.marketCapUsd || 0,
      fdvUsd: token?.fdvUsd || 0,
      liquidityUsd: token?.liquidityUsd !== void 0 ? Number(token.liquidityUsd) : token?.realSolReservesFormatted && solPrice ? Number(token.realSolReservesFormatted) * solPrice : 0,
      realSolReserves: token?.realSolReservesFormatted || "0",
      virtualTokenReserves: String(virtualTokenReserves),
      virtualSolReserves: String(virtualSolReserves),
      realTokenReserves: String(realTokenReserves),
      bondingProgressPct: token?.bondingProgress ?? bondingProgressPct,
      marketStage: token?.marketStage || (complete ? "graduated_pending" : "bonding_curve"),
      migrationState: token?.migrationState || (complete ? "MIGRATION_PENDING" : "NOT_READY"),
      pairAddress: token?.bondingCurvePda || bondingCurvePda.toBase58(),
      dexId: token?.marketStage === "pumpswap" ? "pumpswap" : "pumpfun",
      url: `https://pump.fun/coin/${mint}`
    };
    return res.status(200).json({
      success: true,
      mint,
      elapsedMs: totalElapsedMs,
      solPriceUsd: solPrice,
      auditTrail,
      normalizedFields,
      rawMetadata,
      migrationStatus,
      bondingStatus: {
        isBondingCurve: !complete,
        complete: Boolean(complete),
        bondingProgressPct: token?.bondingProgress ?? bondingProgressPct,
        virtualTokenReserves,
        virtualSolReserves,
        realTokenReserves,
        realSolReserves,
        realSolReservesSol: token?.realSolReservesFormatted || (Number(realSolReserves) / 1e9).toFixed(3),
        marketStage: token?.marketStage || (complete ? "graduated_pending" : "bonding_curve"),
        migrationState: token?.migrationState || (complete ? "MIGRATION_PENDING" : "NOT_READY"),
        pumpSwapPoolPda: poolPda.toBase58(),
        pumpSwapPoolVerified: token?.pumpSwapPoolVerified || (poolAcc?.owner.equals(PUMP_AMM_PROGRAM_ID) ?? false)
      },
      metadataAudit: {
        name: finalName,
        symbol: finalSymbol,
        description: finalDescription,
        imageUrl: finalImageUrl,
        socials: {
          twitter,
          telegram,
          website
        },
        hasLogo: Boolean(finalImageUrl),
        hasSocials: Boolean(twitter || telegram || website),
        dataSource: offChainJson && onChainName ? "onchain_metaplex_plus_ipfs" : onChainName ? "onchain_metaplex_only" : pumpApiData ? "pump_api_fallback" : "default_inferred"
      },
      normalizedAggregatorToken,
      ...debug ? {
        rawOnChainMetadata: onChainMetadataInfo,
        rawOffChainJson: offChainJson,
        rawPumpApiData: pumpApiData,
        engineTokenState: token
      } : {}
    });
  } catch (err) {
    console.error(`[Diagnostic Handler] Error auditing mint ${mint}:`, err);
    return res.status(500).json({
      success: false,
      mint,
      error: err.message || "Failed to execute complete audit trail",
      auditTrail
    });
  }
}
export {
  handler as default
};
