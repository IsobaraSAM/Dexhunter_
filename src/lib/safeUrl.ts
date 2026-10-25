import { preserveXUrl } from "./xLinkKind.js";

/**
 * Safe URL validation, sanitization, and social link coercion
 */

const DANGEROUS_PROTOCOLS = ["javascript:", "data:", "vbscript:", "file:"];

export function parseHttpUrl(raw?: string | null): URL | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function safeHref(url?: string | null): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  const lower = trimmed.toLowerCase();
  for (const proto of DANGEROUS_PROTOCOLS) {
    if (lower.startsWith(proto)) return undefined;
  }

  // Allow safe relative paths
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) {
    return trimmed;
  }

  // Allow valid http / https
  const parsed = parseHttpUrl(trimmed);
  if (parsed) {
    return parsed.toString();
  }

  return undefined;
}

export function isTwitterHost(host: string): boolean {
  if (!host) return false;
  const h = host.toLowerCase();
  return (
    h === "twitter.com" ||
    h.endsWith(".twitter.com") ||
    h === "x.com" ||
    h.endsWith(".x.com")
  );
}

export function isTelegramHost(host: string): boolean {
  if (!host) return false;
  const h = host.toLowerCase();
  return (
    h === "t.me" ||
    h.endsWith(".t.me") ||
    h === "telegram.me" ||
    h.endsWith(".telegram.me") ||
    h === "telegram.org" ||
    h.endsWith(".telegram.org")
  );
}

export function isDiscordHost(host: string): boolean {
  if (!host) return false;
  const h = host.toLowerCase();
  return (
    h === "discord.gg" ||
    h.endsWith(".discord.gg") ||
    h === "discord.com" ||
    h.endsWith(".discord.com")
  );
}

export function isProfileHost(host: string): boolean {
  if (!host) return false;
  const h = host.toLowerCase().replace(/^www\./, "");
  const profiles = ["tiktok.com", "instagram.com", "youtube.com", "youtu.be", "facebook.com", "fb.com", "linkedin.com", "warpcast.com", "farcaster.xyz"];
  return profiles.some((name) => h === name || h.endsWith(`.${name}`));
}

export function isOfficialWebsiteCandidate(
  type: string | undefined,
  label: string | undefined,
  host: string | null,
  explicit: boolean
): boolean {
  if (host && (isTwitterHost(host) || isTelegramHost(host) || isDiscordHost(host) || isTrackerHost(host) || isProfileHost(host))) {
    return false;
  }
  if (explicit) return true;
  const kind = `${type || ""} ${label || ""}`.toLowerCase();
  return kind.includes("website") || kind.split(/\s+/).includes("web");
}

export function isTrackerHost(host: string): boolean {
  if (!host) return false;
  const h = host.toLowerCase();
  return (
    h.includes("dexscreener.com") ||
    h.includes("dextools.io") ||
    h.includes("birdeye.so") ||
    h.includes("geckoterminal.com") ||
    h.includes("coingecko.com") ||
    h.includes("coinmarketcap.com")
  );
}

export function looksLikeImageUri(raw: string): boolean {
  if (!raw || typeof raw !== "string") return false;
  return /\.(png|jpe?g|gif|webp|svg|ico|bmp|avif)(\?.*)?$/i.test(raw);
}

export function coerceSocialUrl(
  raw?: string | null,
  type?: "twitter" | "telegram" | "discord" | "website"
): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  let clean = raw.trim();
  if (!clean) return undefined;

  // Remove trailing slashes or quotes if present
  clean = clean.replace(/^["]+|["]+$/g, "");

  if (type === "twitter") {
    const preserved = preserveXUrl(clean);
    if (preserved) return safeHref(preserved);
  } else if (type === "telegram") {
    if (clean.startsWith("@")) {
      return `https://t.me/${clean.slice(1)}`;
    }
    if (!clean.includes("/") && !clean.includes(".")) {
      return `https://t.me/${clean}`;
    }
  }

  // Prepend https:// if protocol is missing
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(clean)) {
    clean = `https://${clean.replace(/^\/\//, "")}`;
  }

  return safeHref(clean);
}
