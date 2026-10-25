/**
 * SSRF & URL Validation utilities for remote metadata & IPFS fetching
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
  "169.254.169.254",
  "instance-data",
]);

function isPrivateIp(hostname: string): boolean {
  // Check loopback / standard private ranges
  if (/^127\./.test(hostname)) return true;
  if (/^10\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^169\.254\./.test(hostname)) return true; // Link-local
  if (/^fc00:|^fe80:/i.test(hostname)) return true; // IPv6 private/link-local
  return false;
}

export function isAllowedMetadataUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== "string") return false;
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.has(hostname)) {
      return false;
    }
    if (isPrivateIp(hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function safeFetchUrl(urlStr: string): string | null {
  if (!urlStr) return null;
  const trimmed = urlStr.trim();
  if (isAllowedMetadataUrl(trimmed)) {
    return trimmed;
  }
  return null;
}
