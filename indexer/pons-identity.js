// @ts-nocheck
// Pons publishes a Robinhood launch before name() / symbol() return.
// A later enrich must fill the discovery row. An empty read must not wipe a name.

function clean(value) {
  const text = String(value || "").trim();
  return text || "";
}

export function applyPonsIdentity(existing, token) {
  if (!existing || !token) return false;
  if (!token.isPonsLaunch && token.launchPlatform !== "Pons V2") return false;
  const nextName = clean(token.baseToken?.name);
  const nextSymbol = clean(token.baseToken?.symbol);
  if (!existing.baseToken) existing.baseToken = {};
  if (token.baseToken?.address && !existing.baseToken.address) existing.baseToken.address = token.baseToken.address;
  if (nextName && existing.baseToken.name !== nextName) existing.baseToken.name = nextName;
  if (nextSymbol && existing.baseToken.symbol !== nextSymbol) existing.baseToken.symbol = nextSymbol;
  if (token.baseToken?.decimals != null && existing.baseToken.decimals == null) {
    existing.baseToken.decimals = token.baseToken.decimals;
  }
  existing.isPonsLaunch = true;
  existing.chainId = existing.chainId || "robinhood";
  if (!existing.dexId || existing.dexId === "pumpswap") existing.dexId = "pons";
  if (!existing.primaryDex || existing.primaryDex === "PumpSwap") existing.primaryDex = "Pons V2";
  if (existing.marketStage === "pumpswap") existing.marketStage = existing.isGraduated ? "graduated" : "active";
  existing.launchPlatform = "Pons V2";
  const page = existing.baseToken?.address ? `https://ponsfamily.com/launchpad/${existing.baseToken.address}` : "";
  if (page) {
    existing.launchpadDetailUrl = page;
    existing.url = page;
  }
  const trade = token.primaryDexTradingUrl || existing.primaryDexTradingUrl || "";
  if (/uniswap\.org|arguspad\.io|blockscout\.com/i.test(trade)) {
    existing.primaryDexTradingUrl = undefined;
  } else if (token.primaryDexTradingUrl) {
    existing.primaryDexTradingUrl = token.primaryDexTradingUrl;
  }
  if (token.primaryDexLogo) existing.primaryDexLogo = token.primaryDexLogo;
  if (token.creator && !existing.creator) existing.creator = token.creator;
  if (token.twitter) existing.twitter = token.twitter;
  if (token.telegram) existing.telegram = token.telegram;
  if (token.website) existing.website = token.website;
  if (token.discord) existing.discord = token.discord;
  const image = token.info?.imageUrl;
  if (image) {
    if (!existing.info) existing.info = {};
    if (!existing.info.imageUrl) existing.info.imageUrl = image;
  }
  if (token.info?.description && !existing.info?.description) {
    if (!existing.info) existing.info = {};
    existing.info.description = token.info.description;
  }
  if (token.info?.socials?.length) {
    if (!existing.info) existing.info = {};
    existing.info.socials = token.info.socials;
  }
  if (token.priceUsd && Number(token.priceUsd) > 0 && (!existing.priceUsd || Number(existing.priceUsd) <= 0)) {
    existing.priceUsd = token.priceUsd;
  }
  if (typeof token.marketCap === "number" && token.marketCap > 0 && !(existing.marketCap > 0)) {
    existing.marketCap = token.marketCap;
    existing.fdv = token.fdv || token.marketCap;
  }
  const liq = token.liquidity?.usd ?? token.totalLiquidityUsd;
  if (typeof liq === "number" && liq > 0 && !(existing.totalLiquidityUsd > 0)) {
    existing.liquidity = { ...(existing.liquidity || {}), usd: liq };
    existing.totalLiquidityUsd = liq;
  }
  if (token.isGraduated) {
    existing.isGraduated = true;
    existing.isBondingCurve = false;
    existing.marketStage = "graduated";
  }
  return true;
}

export function repairPonsIdentity(engine, pons) {
  const index = engine?.indexedTokens;
  const book = pons?.launches;
  if (!index || !book) return 0;
  let repaired = 0;
  for (const token of book.values()) {
    const addr = token?.baseToken?.address;
    if (!addr) continue;
    const existing = index.get(`robinhood:${String(addr).toLowerCase()}`);
    if (!existing) continue;
    const beforeName = existing.baseToken?.name || "";
    const beforeSymbol = existing.baseToken?.symbol || "";
    applyPonsIdentity(existing, token);
    if ((existing.baseToken?.name || "") !== beforeName || (existing.baseToken?.symbol || "") !== beforeSymbol) repaired += 1;
  }
  if (Array.isArray(pons.enrichQueue) && pons.enrichQueue.length > 1) {
    pons.enrichQueue.sort((a, b) => {
      const ta = Number(book.get(a)?.pairCreatedAt || 0);
      const tb = Number(book.get(b)?.pairCreatedAt || 0);
      return tb - ta;
    });
  }
  return repaired;
}
