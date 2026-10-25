// @ts-nocheck
// Fields the browse UI never reads. Kept off the list response so a 5,000-row
// feed does not ship launch internals, raw reserves, or a second copy of the
// trade URL. The stored index and the export route stay complete.

const OMIT = new Set([
  "txHash",
  "virtualTokenReserves",
  "virtualSolReserves",
  "realTokenReserves",
  "realSolReserves",
  "tokenTotalSupply",
  "totalSupply",
  "discoveredAt",
  "marketUpdatedAt",
  "firstSeenAt",
  "ponsCurve",
  "ponsPairToken",
  "ponsLaunchConfigId",
  "ponsGraduationThreshold",
  "argusPortalAddress",
  "argusLockerAddress",
  "argusHookAddress",
  "argusPoolId",
  "argusPositionId",
  "argusPortalFamily",
  "argusPortalId",
  "argusTotalFeeBps",
  "marketCapMethod",
  "discoveryMode",
  "liquidityMethod",
  "volumeObservedUsd",
  "volumeObservedMs",
  "_quoteDec",
  "metadataPending",
]);

export function projectBrowseToken(token) {
  if (!token || typeof token !== "object") return token;
  const next = {};
  for (const [key, value] of Object.entries(token)) {
    if (OMIT.has(key) || value == null) continue;
    next[key] = value;
  }
  if (typeof next.primaryDexLogo === "string" && /\/argus\.svg$/i.test(next.primaryDexLogo)) {
    next.primaryDexLogo = "/argus.png";
  }
  const image = next.info?.imageUrl;
  if (typeof image === "string" && /\/argus\.(svg|png)$|\/pons\.png$/i.test(image)) {
    next.info = { ...next.info, imageUrl: undefined };
  }
  if (next.url && next.primaryDexTradingUrl && next.url === next.primaryDexTradingUrl) {
    delete next.url;
  }
  return next;
}
