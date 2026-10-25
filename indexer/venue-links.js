// @ts-nocheck
// Launchpad page and DEX trade URL are different fields.
// Pons token pages were confirmed live at ponsfamily.com/launchpad/<address>.
// Argus consumer pages are https://argus.world/token/<address>.
// Uniswap and the retired arguspad.io host are not trade links.

const ARGUS_PAGE = "https://argus.world/token";
const PONS_PAGE = "https://ponsfamily.com/launchpad";
const FOUR_PAGE = "https://four.meme/token";

export function argusLaunchpadUrl(address) {
  const addr = text(address);
  if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) return null;
  return `${ARGUS_PAGE}/${addr}`;
}

function text(value) {
  return String(value || "").trim();
}

export function isPonsToken(token) {
  if (!token) return false;
  if (token.isPonsLaunch) return true;
  const dex = text(token.primaryDex || token.dexId || token.launchPlatform).toLowerCase();
  return dex.includes("pons");
}

export function isArgusToken(token) {
  if (!token) return false;
  if (token.isArgusLaunch) return true;
  const dex = text(token.primaryDex || token.dexId || token.launchPlatform).toLowerCase();
  return dex.includes("argus");
}

export function fourMemeLaunchpadUrl(address) {
  const addr = text(address);
  if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) return null;
  return `${FOUR_PAGE}/${addr}`;
}

export function isFourMemeToken(token) {
  if (!token) return false;
  if (token.isFourMemeLaunch || token.isOpenFourLaunch) return true;
  const platform = text(token.launchPlatform).toLowerCase();
  return platform === "four.meme" || platform === "four.meme v1" || platform === "openfour";
}

export function isPumpToken(token) {
  if (!token || isPonsToken(token) || isArgusToken(token) || isFourMemeToken(token)) return false;
  const chain = text(token.chainId).toLowerCase();
  if (chain && chain !== "solana") return false;
  const dex = text(token.primaryDex || token.dexId || token.launchPlatform).toLowerCase();
  return dex.includes("pump") || Boolean(token.bondingCurvePda);
}

export function pumpLaunchpadUrl(address) {
  const addr = text(address);
  if (!addr || addr.startsWith("0x") || addr.length < 32) return null;
  return `https://pump.fun/coin/${addr}`;
}

export function ponsLaunchpadUrl(address) {
  const addr = text(address);
  if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) return null;
  return `${PONS_PAGE}/${addr}`;
}

export function isRejectedTradeUrl(token, url) {
  if (!url) return false;
  const chain = text(token?.chainId).toLowerCase();
  const owned = chain === "robinhood" || chain === "arc" || isPonsToken(token) || isArgusToken(token) || isFourMemeToken(token);
  if (!owned) return false;
  return /uniswap\.org|arguspad\.io/i.test(String(url));
}

// null: this venue must not get a DEX link. undefined: caller keeps its own rules.
export function dexTradeUrl(token) {
  if (isPonsToken(token)) return null;
  if (isArgusToken(token)) return argusLaunchpadUrl(token?.baseToken?.address || token?.address);
  if (isFourMemeToken(token)) return fourMemeLaunchpadUrl(token?.baseToken?.address || token?.address);
  const chain = text(token?.chainId).toLowerCase();
  if (chain === "robinhood" || chain === "arc") return null;
  return undefined;
}

// null: render no outbound trade link. undefined: caller uses the normal DEX url.
export function actionHref(token) {
  if (isPonsToken(token)) return ponsLaunchpadUrl(token?.baseToken?.address || token?.address);
  if (isArgusToken(token)) return argusLaunchpadUrl(token?.baseToken?.address || token?.address);
  if (isPumpToken(token)) return pumpLaunchpadUrl(token?.baseToken?.address || token?.address);
  if (isFourMemeToken(token)) return fourMemeLaunchpadUrl(token?.baseToken?.address || token?.address);
  return undefined;
}

export function clientTradeHref(token, computed) {
  const venue = actionHref(token);
  if (venue !== undefined) return venue;
  const candidates = [token?.primaryDexTradingUrl, computed, token?.url];
  for (const url of candidates) {
    if (!url || isRejectedTradeUrl(token, url)) continue;
    return url;
  }
  return null;
}
