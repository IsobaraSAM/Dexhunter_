// X profile vs X post classification, shared by icons, browse filters, and the
// discovery index. A link is one or the other, never both. Ambiguous X URLs
// (search, intent, communities, a status without an id) match neither.

const RESERVED = new Set([
  "home", "explore", "search", "settings", "i", "intent", "share", "compose",
  "messages", "notifications", "login", "signup", "tos", "privacy", "hashtag",
  "jobs", "about", "download", "oauth", "help", "display",
  "keyboard_shortcuts", "resources", "rules", "moments", "who_to_follow",
  "bookmarks", "communities", "premium", "verified", "logout", "session",
  "widgets", "follow", "topics", "lists", "favicon.ico",
]);

const PROFILE_TABS = new Set([
  "with_replies", "followers", "following", "media", "likes", "highlights",
  "articles", "photo", "header_photo", "verified_followers", "affiliates",
  "superfollows",
]);

const X_URL_RE = /(?:https?:\/\/|\/\/)?(?:www\.)?(?:mobile\.)?(?:twitter\.com|x\.com)\/[^\s<>"'`|)]+/gi;

/** @param {string} host */
function isXHost(host) {
  const h = String(host || "").toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
  return h === "x.com" || h === "mobile.x.com" || h === "twitter.com" || h === "mobile.twitter.com";
}

/** @param {string} host */
function isTelegramHost(host) {
  const h = String(host || "").toLowerCase();
  return h === "t.me" || h.endsWith(".t.me") || h === "telegram.me" || h.endsWith(".telegram.me") || h === "telegram.org" || h.endsWith(".telegram.org");
}

/** @param {string} host */
function isDiscordHost(host) {
  const h = String(host || "").toLowerCase();
  return h === "discord.gg" || h.endsWith(".discord.gg") || h === "discord.com" || h.endsWith(".discord.com");
}

/** @param {string} host */
function isTrackerHost(host) {
  const h = String(host || "").toLowerCase();
  return h.includes("dexscreener.com") || h.includes("dextools.io") || h.includes("birdeye.so") || h.includes("geckoterminal.com") || h.includes("coingecko.com") || h.includes("coinmarketcap.com");
}

/** @param {string} host */
function isProfileHost(host) {
  const h = String(host || "").toLowerCase().replace(/^www\./, "");
  const profiles = ["tiktok.com", "instagram.com", "youtube.com", "youtu.be", "facebook.com", "fb.com", "linkedin.com", "warpcast.com", "farcaster.xyz"];
  return profiles.some((name) => h === name || h.endsWith(`.${name}`));
}

/** @param {string} raw */
function looksLikeImage(raw) {
  return /\.(png|jpe?g|gif|webp|svg|ico|bmp|avif)(\?.*)?$/i.test(raw);
}

/** @param {string} text */
function asUrl(text) {
  try {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) return new URL(text);
    return new URL(`https://${text.replace(/^\/\//, "")}`);
  } catch {
    return null;
  }
}

/** @param {string} raw */
function hostnameOf(raw) {
  const direct = asUrl(raw);
  return direct ? direct.hostname.toLowerCase() : null;
}

/**
 * Keep the path and query. Do not collapse a status URL to the account.
 * @param {unknown} raw
 * @returns {string}
 */
export function preserveXUrl(raw) {
  if (typeof raw !== "string") return "";
  let text = raw.trim().replace(/^["']+|["']+$/g, "");
  text = text.replace(/[),.;!?]+$/g, "");
  if (!text || text === "null" || text === "undefined") return "";
  if (/^https?:\/\//i.test(text)) return text;
  if (text.startsWith("//")) return `https:${text}`;
  if (/^(?:www\.)?(?:mobile\.)?(?:twitter\.com|x\.com)(?:\/|$)/i.test(text)) return `https://${text}`;
  if (/^@?[A-Za-z0-9_]{1,15}$/.test(text)) {
    const handle = text.replace(/^@/, "");
    if (RESERVED.has(handle.toLowerCase())) return "";
    return `https://x.com/${handle}`;
  }
  if (/^[A-Za-z0-9_]{1,15}\/(?:status|statuses)\/\d+/i.test(text)) {
    return `https://x.com/${text.replace(/^\/+/, "")}`;
  }
  return "";
}

/**
 * @param {unknown} raw
 * @returns {"profile" | "post" | null}
 */
export function classifyXUrl(raw) {
  if (typeof raw !== "string") return null;
  let text = raw.trim().replace(/^["']+|["']+$/g, "");
  text = text.replace(/[),.;!?]+$/g, "");
  if (!text || text === "null" || text === "undefined") return null;
  if (/^@?[A-Za-z0-9_]{1,15}$/.test(text) && !text.includes("/")) {
    const handle = text.replace(/^@/, "");
    return RESERVED.has(handle.toLowerCase()) ? null : "profile";
  }
  const url = asUrl(text);
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) return null;
  if (!isXHost(url.hostname)) return null;
  /** @type {string[]} */
  let parts;
  try {
    parts = url.pathname.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
  } catch {
    return null;
  }
  if (!parts.length) return null;
  const lower = parts.map((part) => part.toLowerCase());
  const statusAt = lower.findIndex((part) => part === "status" || part === "statuses");
  if (statusAt >= 0) {
    const id = parts[statusAt + 1] || "";
    return /^\d{1,25}$/.test(id) ? "post" : null;
  }
  if (lower[0] === "i" && lower[1] === "user" && /^\d{1,25}$/.test(parts[2] || "") && parts.length === 3) {
    return "profile";
  }
  if (RESERVED.has(lower[0])) return null;
  if (!/^[A-Za-z0-9_]{1,15}$/.test(parts[0])) return null;
  if (parts.length === 1) return "profile";
  if (parts.length === 2 && PROFILE_TABS.has(lower[1])) return "profile";
  return null;
}

/** @param {unknown} raw */
export function absoluteXHref(raw) {
  if (classifyXUrl(raw) == null) return null;
  const href = preserveXUrl(typeof raw === "string" ? raw : "");
  return href || null;
}

/** @param {unknown} text */
export function xUrlsFromText(text) {
  const raw = String(text || "").slice(0, 8000);
  /** @type {string[]} */
  const out = [];
  const seen = new Set();
  for (const match of raw.matchAll(X_URL_RE)) {
    const href = absoluteXHref(match[0]);
    if (!href || seen.has(href.toLowerCase())) continue;
    seen.add(href.toLowerCase());
    out.push(href);
  }
  return out;
}

/**
 * @param {Array<{ type?: string; url?: string; label?: string; explicitWebsite?: boolean }>} bucket
 * @param {unknown} type
 * @param {unknown} url
 * @param {{ label?: string; explicitWebsite?: boolean }} [extra]
 */
function pushCandidate(bucket, type, url, extra) {
  const link = typeof url === "string" ? url.trim() : "";
  if (!link || link === "null" || link === "undefined") return;
  bucket.push({
    type: String(type || ""),
    url: link,
    label: extra?.label,
    explicitWebsite: extra?.explicitWebsite,
  });
}

/** @param {any} pair */
function candidatesOf(pair) {
  /** @type {Array<{ type?: string; url?: string; label?: string; explicitWebsite?: boolean }>} */
  const all = [];
  if (!pair || typeof pair !== "object") return all;
  for (const row of pair.info?.socials || []) pushCandidate(all, row?.type, row?.url, { label: row?.label });
  for (const site of pair.info?.websites || []) {
    if (!site) continue;
    if (typeof site === "string") pushCandidate(all, "website", site, { explicitWebsite: true });
    else pushCandidate(all, site.type || "website", site.url, { label: site.label, explicitWebsite: true });
  }
  pushCandidate(all, "telegram", pair.telegram);
  pushCandidate(all, "telegram", pair.tg);
  pushCandidate(all, "telegram", pair.telegram_url);
  pushCandidate(all, "twitter", pair.twitter);
  pushCandidate(all, "twitter", pair.x);
  pushCandidate(all, "twitter", pair.twitter_url);
  pushCandidate(all, "twitter", pair.x_url);
  pushCandidate(all, "website", pair.website, { explicitWebsite: true });
  pushCandidate(all, "website", pair.web, { explicitWebsite: true });
  pushCandidate(all, "website", pair.website_url, { explicitWebsite: true });
  pushCandidate(all, "discord", pair.discord);
  pushCandidate(all, "discord", pair.discord_url);
  if (Array.isArray(pair.socials)) {
    for (const row of pair.socials) {
      if (typeof row === "string") pushCandidate(all, "", row);
      else pushCandidate(all, row?.type, row?.url || row?.value, { label: row?.label });
    }
  } else if (pair.socials && typeof pair.socials === "object") {
    pushCandidate(all, "telegram", pair.socials.telegram);
    pushCandidate(all, "telegram", pair.socials.tg);
    pushCandidate(all, "twitter", pair.socials.twitter);
    pushCandidate(all, "twitter", pair.socials.x);
    pushCandidate(all, "website", pair.socials.website, { explicitWebsite: true });
    pushCandidate(all, "discord", pair.socials.discord);
  }
  if (Array.isArray(pair.links)) {
    for (const row of pair.links) {
      if (typeof row === "string") pushCandidate(all, "", row);
      else pushCandidate(all, row?.type, row?.url || row?.value, { label: row?.label });
    }
  } else if (pair.links && typeof pair.links === "object") {
    pushCandidate(all, "telegram", pair.links.telegram);
    pushCandidate(all, "telegram", pair.links.tg);
    pushCandidate(all, "twitter", pair.links.twitter);
    pushCandidate(all, "twitter", pair.links.x);
    pushCandidate(all, "website", pair.links.website, { explicitWebsite: true });
    pushCandidate(all, "discord", pair.links.discord);
  }
  if (pair.extensions && typeof pair.extensions === "object") {
    pushCandidate(all, "twitter", pair.extensions.twitter);
    pushCandidate(all, "twitter", pair.extensions.x);
    pushCandidate(all, "telegram", pair.extensions.telegram);
    pushCandidate(all, "website", pair.extensions.website, { explicitWebsite: true });
    pushCandidate(all, "discord", pair.extensions.discord);
  }
  if (Array.isArray(pair.attributes)) {
    for (const attr of pair.attributes) {
      if (attr && (attr.value || attr.url)) pushCandidate(all, attr.trait_type || attr.name || attr.type, attr.value || attr.url);
    }
  }
  const desc = String(pair.description || pair.info?.description || "").slice(0, 8000);
  if (desc) {
    const tgMatch = desc.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_+]+)/i);
    if (tgMatch) pushCandidate(all, "telegram", `https://t.me/${tgMatch[1]}`);
    for (const href of xUrlsFromText(desc)) pushCandidate(all, "twitter", href);
    const discordMatch = desc.match(/(?:https?:\/\/)?(?:discord\.gg|discord\.com\/invite)\/([a-zA-Z0-9-_]+)/i);
    if (discordMatch) pushCandidate(all, "discord", `https://discord.gg/${discordMatch[1]}`);
    const urlMatches = desc.match(/https?:\/\/[^\s)]+/gi) || [];
    for (const rawUrl of urlMatches) {
      const host = hostnameOf(rawUrl);
      if (!host) continue;
      if (isTelegramHost(host) || isXHost(host) || isDiscordHost(host) || isTrackerHost(host)) continue;
      if (looksLikeImage(rawUrl)) continue;
      pushCandidate(all, "website", rawUrl);
    }
  }
  return all;
}

/**
 * @param {string} raw
 * @param {"telegram" | "discord" | "website"} kind
 */
function coerceOther(raw, kind) {
  let clean = raw.trim().replace(/^["']+|["']+$/g, "");
  if (!clean) return null;
  if (kind === "telegram") {
    if (clean.startsWith("@")) clean = `https://t.me/${clean.slice(1)}`;
    else if (!clean.includes("/") && !clean.includes(".")) clean = `https://t.me/${clean}`;
  }
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(clean)) clean = `https://${clean.replace(/^\/\//, "")}`;
  const url = asUrl(clean);
  if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) return null;
  return clean;
}

/**
 * @param {any} pair
 * @returns {{ telegram: string | null; discord: string | null; website: string | null; xProfile: string | null; xPost: string | null }}
 */
export function readSocials(pair) {
  /** @type {{ telegram: string | null; discord: string | null; website: string | null; xProfile: string | null; xPost: string | null }} */
  const found = { telegram: null, discord: null, website: null, xProfile: null, xPost: null };
  for (const candidate of candidatesOf(pair)) {
    if (!candidate?.url) continue;
    const raw = candidate.url.trim();
    if (!raw || raw === "null" || raw === "undefined") continue;
    const typeLower = String(candidate.type || "").toLowerCase();
    const labelLower = String(candidate.label || "").toLowerCase();
    const host = hostnameOf(raw);
    const xKind = classifyXUrl(raw);
    if (xKind === "profile" && !found.xProfile) {
      found.xProfile = absoluteXHref(raw);
      continue;
    }
    if (xKind === "post" && !found.xPost) {
      found.xPost = absoluteXHref(raw);
      continue;
    }
    if (xKind || (host && isXHost(host))) continue;

    const typedTelegram = typeLower === "telegram" || typeLower === "tg" || labelLower.includes("telegram");
    const typedDiscord = typeLower === "discord" || labelLower.includes("discord");
    if (!found.telegram && (typedTelegram || (host && isTelegramHost(host)))) {
      found.telegram = coerceOther(raw, "telegram");
      continue;
    }
    if (!found.discord && (typedDiscord || (host && isDiscordHost(host)))) {
      found.discord = coerceOther(raw, "discord");
      continue;
    }
    const explicit = Boolean(candidate.explicitWebsite);
    const blocked = Boolean(host && (isTelegramHost(host) || isDiscordHost(host) || isTrackerHost(host) || isProfileHost(host)));
    const kindText = `${typeLower} ${labelLower}`;
    const websiteTyped = kindText.includes("website") || kindText.split(/\s+/).includes("web");
    if (!found.website && !blocked && (explicit || websiteTyped) && !looksLikeImage(raw)) {
      found.website = coerceOther(raw, "website");
    }
  }
  return found;
}

/** @param {any} pair @param {"telegram" | "twitter" | "discord" | "website"} kind */
export function hasSocial(pair, kind) {
  const socials = readSocials(pair);
  if (kind === "telegram") return Boolean(socials.telegram);
  if (kind === "discord") return Boolean(socials.discord);
  if (kind === "website") return Boolean(socials.website);
  if (kind === "twitter") return Boolean(socials.xProfile || socials.xPost);
  return false;
}

/** @param {any} pair */
export function hasXProfile(pair) {
  return Boolean(readSocials(pair).xProfile);
}

/** @param {any} pair */
export function hasXPost(pair) {
  return Boolean(readSocials(pair).xPost);
}

/**
 * X profiles and X posts combine with OR. Neither selected leaves X unfiltered.
 * A legacy `twitter` flag, with neither sub-filter, means either classified kind.
 * @param {any} pair
 * @param {{ telegram?: boolean; twitter?: boolean; discord?: boolean; website?: boolean; verified?: boolean; xProfile?: boolean; xPost?: boolean }} flags
 */
export function matchSocialFilters(pair, flags) {
  const wanted = flags || {};
  const socials = readSocials(pair);
  if (wanted.telegram && !socials.telegram) return false;
  if (wanted.discord && !socials.discord) return false;
  if (wanted.website && !socials.website) return false;
  const profileOn = Boolean(wanted.xProfile);
  const postOn = Boolean(wanted.xPost);
  const legacyEither = Boolean(wanted.twitter) && !profileOn && !postOn;
  const wantProfile = profileOn || legacyEither;
  const wantPost = postOn || legacyEither;
  if ((wantProfile || wantPost) && !((wantProfile && socials.xProfile) || (wantPost && socials.xPost))) return false;
  if (wanted.verified) {
    const count = [socials.telegram, socials.discord, socials.website, socials.xProfile || socials.xPost].filter(Boolean).length;
    if (count < 2) return false;
  }
  return true;
}
