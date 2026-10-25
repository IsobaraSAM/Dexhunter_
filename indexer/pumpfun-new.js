// @ts-nocheck
import { pumpIndexer } from "./pump-engine.js";
function getFallbackTokens() {
  try {
    const tokens = pumpIndexer.getAllTokens();
    if (Array.isArray(tokens) && tokens.length > 0) {
      return tokens.map((t) => {
        const isGraduated = Boolean(t.complete || t.isGraduated || t.marketStage === "pumpswap");
        const pairAddr = isGraduated ? t.pumpSwapPool || t.bondingCurvePda || t.mint : t.bondingCurvePda || t.mint;
        return {
          ...t,
          mint: t.mint,
          name: t.tokenName,
          symbol: t.tokenSymbol,
          description: t.description,
          image_uri: t.imageUrl,
          metadata_uri: t.metadataUri,
          twitter: t.twitter,
          telegram: t.telegram,
          website: t.website,
          created_timestamp: t.createdAt,
          complete: Boolean(t.complete),
          bonding_curve: t.bondingCurvePda,
          bondingCurvePda: t.bondingCurvePda,
          pair_address: pairAddr,
          pairAddress: pairAddr,
          is_graduated: isGraduated,
          isGraduated,
          market_stage: isGraduated ? "pumpswap" : "bonding_curve",
          marketStage: isGraduated ? "pumpswap" : "bonding_curve",
          pumpswap_pool: t.pumpSwapPool,
          pumpSwapPool: t.pumpSwapPool,
          pumpswap: isGraduated,
          dex_id: isGraduated ? "pumpswap" : "pumpfun",
          dexId: isGraduated ? "pumpswap" : "pumpfun",
          primary_dex: isGraduated ? "PumpSwap" : void 0,
          primaryDex: isGraduated ? "PumpSwap" : void 0,
          sources: isGraduated ? ["PumpSwap", "Pump.fun (On-Chain)"] : t.sources || ["Pump.fun (On-Chain)"],
          dexes: isGraduated ? ["PumpSwap"] : t.dexes || [],
          usd_market_cap: t.marketCapUsd,
          marketCapUsd: t.marketCapUsd,
          liquidity_usd: t.liquidityUsd,
          liquidityUsd: t.liquidityUsd,
          price_usd: t.spotPriceUsd,
          priceUsd: t.spotPriceUsd,
          price_native: t.spotPriceSol,
          priceNative: t.spotPriceSol,
          pairs: t.pairs || (isGraduated ? [
            {
              chainId: "solana",
              pairAddress: pairAddr,
              dexName: "PumpSwap",
              dexId: "pumpswap",
              baseToken: { address: t.mint, name: t.tokenName, symbol: t.tokenSymbol },
              quoteToken: { address: "So11111111111111111111111111111111111111112", name: "Wrapped SOL", symbol: "SOL" },
              priceUsd: t.spotPriceUsd || "0",
              liquidityUsd: t.liquidityUsd
            }
          ] : [
            {
              chainId: "solana",
              pairAddress: pairAddr,
              dexName: "Pump.fun",
              dexId: "pumpfun",
              baseToken: { address: t.mint, name: t.tokenName, symbol: t.tokenSymbol },
              quoteToken: { address: "So11111111111111111111111111111111111111112", name: "Wrapped SOL", symbol: "SOL" },
              priceUsd: t.spotPriceUsd || "0",
              liquidityUsd: t.liquidityUsd
            }
          ])
        };
      });
    }
  } catch {
  }
  return [];
}
async function fetchExternalPumpFun() {
  try {
    const fallbackRes = await fetch(
      "https://api.dexscreener.com/latest/dex/search?q=pumpfun",
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(3500)
      }
    );
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      const pumpPairs = (data.pairs || []).filter(
        (p) => p.chainId === "solana" && (p.dexId === "pumpfun" || p.url?.includes("pump.fun"))
      );
      if (pumpPairs.length > 0) {
        return pumpPairs.map((p) => ({
          mint: p.baseToken?.address,
          name: p.baseToken?.name,
          symbol: p.baseToken?.symbol,
          description: p.info?.description || "",
          image_uri: p.info?.imageUrl || "",
          twitter: p.info?.socials?.find((s) => s.type === "twitter")?.url || "",
          telegram: p.info?.socials?.find((s) => s.type === "telegram")?.url || "",
          website: p.info?.websites?.[0]?.url || "",
          created_timestamp: p.pairCreatedAt,
          complete: false,
          bonding_curve: p.pairAddress,
          bondingCurvePda: p.pairAddress,
          pair_address: p.pairAddress,
          pairAddress: p.pairAddress,
          is_graduated: false,
          isGraduated: false,
          market_stage: "bonding_curve",
          marketStage: "bonding_curve",
          dex_id: "pumpfun",
          dexId: "pumpfun",
          primary_dex: "Pump.fun",
          primaryDex: "Pump.fun",
          sources: ["Pump.fun (On-Chain)"],
          dexes: [],
          usd_market_cap: p.marketCap || p.fdv,
          marketCapUsd: p.marketCap || p.fdv,
          liquidity_usd: Number(p.liquidity?.usd) > 0 ? Number(p.liquidity.usd) : void 0,
          liquidityUsd: Number(p.liquidity?.usd) > 0 ? Number(p.liquidity.usd) : void 0,
          price_usd: p.priceUsd,
          priceUsd: p.priceUsd,
          price_native: p.priceNative,
          priceNative: p.priceNative
        }));
      }
    }
  } catch {
  }
  return null;
}
async function handler(req, res) {
  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey) {
    const externalCoins2 = await fetchExternalPumpFun();
    if (externalCoins2 && externalCoins2.length > 0) {
      return res.status(200).json(externalCoins2);
    }
    return res.status(200).json(getFallbackTokens());
  }
  try {
    const moralisRes = await fetch(
      "https://solana-gateway.moralis.io/token/mainnet/exchange/pumpfun/new",
      {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          "accept": "application/json"
        },
        signal: AbortSignal.timeout(5e3)
      }
    );
    if (moralisRes.ok) {
      const data = await moralisRes.json();
      return res.status(200).json(data);
    }
  } catch {
  }
  const externalCoins = await fetchExternalPumpFun();
  if (externalCoins && externalCoins.length > 0) {
    return res.status(200).json(externalCoins);
  }
  return res.status(200).json(getFallbackTokens());
}
export {
  handler as default
};
