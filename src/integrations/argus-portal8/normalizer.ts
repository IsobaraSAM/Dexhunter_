/**
 * DexHunter × Argus Portal 8 Integration
 * Normalizer, URL Sanitizer, and Deterministic Identity
 */

import { chainTokenKey } from "../../lib/addressCase.js";
import { ARC_CHAIN_ID, PORTAL8_ADDRESS } from "./contracts.js";
import {
  ArgusPortal8Launch,
  Portal8RawLaunchedEvent,
  Portal8RawMetadataEvent,
  Portal8HydratedData,
} from "./types.js";
import { safeChecksumAddress } from "./decoder.js";
import type { TokenPair } from "../../types.js";

/**
 * Deterministic Token Identity Rule:
 * Solana keeps the exact base58 address. EVM addresses are lowercase.
 * Never deduplicate by symbol, name, creator, or socials.
 */
export function buildTokenIdentity(chain: string, tokenAddress: string): string {
  return chainTokenKey(chain, tokenAddress);
}

export function buildArcTokenIdentity(tokenAddress: string): string {
  return buildTokenIdentity("arc", tokenAddress);
}

/**
 * Allowed URL protocols
 */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "ipfs:"]);

/**
 * Sanitizes untrusted user URLs (website, twitter, telegram, imageURI).
 * Prevents javascript:, data:, vbscript: injection.
 */
export function sanitizeUrl(rawUrl: string | null | undefined): string | undefined {
  if (!rawUrl) return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;

  // Handle ipfs:// prefix
  if (trimmed.startsWith("ipfs://")) {
    const cid = trimmed.slice(7).replace(/^\/+/, "");
    if (/^[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_.-]*)*$/.test(cid)) {
      return `https://ipfs.io/ipfs/${cid}`;
    }
    return undefined;
  }

  // Prepend https:// if protocol is omitted but looks like a domain
  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(candidate)) {
    // If it looks like a domain (e.g. dex.arc.fun or twitter.com/foo)
    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(candidate)) {
      candidate = `https://${candidate}`;
    } else {
      return undefined;
    }
  }

  try {
    const parsed = new URL(candidate);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol.toLowerCase())) {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

/**
 * Sanitizes social URLs or handles
 */
export function sanitizeTwitter(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  // If it's a full URL, sanitize it
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const sanitized = sanitizeUrl(trimmed);
    if (sanitized && (sanitized.includes("twitter.com") || sanitized.includes("x.com"))) {
      return sanitized;
    }
    return undefined;
  }

  // If it's a handle (@handle or handle)
  const handle = trimmed.replace(/^@/, "").trim();
  if (/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
    return `https://x.com/${handle}`;
  }

  return undefined;
}

export function sanitizeTelegram(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  // If it's a full URL, sanitize it
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const sanitized = sanitizeUrl(trimmed);
    if (sanitized && (sanitized.includes("t.me/") || sanitized.includes("telegram.me/"))) {
      return sanitized;
    }
    return undefined;
  }

  // If it's a username or channel (@username or username)
  const username = trimmed.replace(/^@/, "").replace(/^t\.me\//, "").trim();
  if (/^[A-Za-z0-9_]{3,32}$/.test(username)) {
    return `https://t.me/${username}`;
  }

  return undefined;
}

/**
 * Sanitizes plain text descriptions: strips non-printable control characters, limits length.
 */
export function sanitizeDescription(raw: string | null | undefined, maxLength = 2000): string | undefined {
  if (!raw) return undefined;
  // Remove control characters (except newline and tab)
  // eslint-disable-next-line no-control-regex
  const cleaned = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  if (!cleaned) return undefined;
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

/**
 * Normalizes Portal 8 event and on-chain hydration data into a canonical ArgusPortal8Launch.
 * Follows strict metadata precedence:
 * authoritative on-chain token data -> Portal launch event -> LaunchMetadata -> optional enrichment
 */
export function normalizePortal8Launch(params: {
  launchedEvent: Portal8RawLaunchedEvent;
  metadataEvent?: Portal8RawMetadataEvent | null;
  hydrated?: Portal8HydratedData | null;
}): ArgusPortal8Launch {
  const { launchedEvent, metadataEvent, hydrated } = params;

  const token = safeChecksumAddress(launchedEvent.token);
  const creator = safeChecksumAddress(launchedEvent.creator);

  // Portal launch state (event takes immediate presence, hydrated launchData confirms tokenIsToken0)
  const hook = hydrated?.launchData?.hook || safeChecksumAddress(launchedEvent.hook);
  const escrow = hydrated?.launchData?.escrow || safeChecksumAddress(launchedEvent.escrow);
  const locker = hydrated?.launchData?.locker || safeChecksumAddress(launchedEvent.locker);
  const positionId = (hydrated?.launchData?.positionId ?? launchedEvent.positionId).toString();
  const tickStart = hydrated?.launchData?.tickStart ?? launchedEvent.tickStart;
  const tickBond = hydrated?.launchData?.tickBond ?? launchedEvent.tickBond;
  const tokenIsToken0 = hydrated?.launchData?.tokenIsToken0;

  // Authoritative token reads from on-chain contract
  const tokenData = hydrated?.tokenData;
  const name = tokenData?.name;
  const symbol = tokenData?.symbol;
  const decimals = tokenData?.decimals;
  const totalSupply = tokenData?.totalSupply;

  // On-chain logo has highest precedence, fallback to sanitized imageURI from LaunchMetadata
  const onChainLogo = sanitizeUrl(tokenData?.logo);
  const eventLogo = sanitizeUrl(metadataEvent?.imageURI);
  const logo = onChainLogo || eventLogo;

  // Hook reads
  const hookData = hydrated?.hookData;
  const quoteAsset = hookData?.quoteAsset;
  const launchBlock = hookData?.launchBlock !== undefined ? Number(hookData.launchBlock) : launchedEvent.blockNumber;
  const launchedAt = hookData?.launchedAt !== undefined ? hookData.launchedAt.toString() : undefined;

  // Launch metadata (untrusted, strictly sanitized)
  const website = sanitizeUrl(metadataEvent?.website);
  const twitter = sanitizeTwitter(metadataEvent?.twitter);
  const telegram = sanitizeTelegram(metadataEvent?.telegram);
  const description = sanitizeDescription(metadataEvent?.description);

  return {
    chain: "arc",
    chainId: ARC_CHAIN_ID,
    source: "argus",
    protocol: "argus-portal8",

    token,
    creator,

    name,
    symbol,
    decimals,
    totalSupply,

    logo,
    website,
    twitter,
    telegram,
    description,

    quoteAsset,
    hook,
    escrow,
    locker,

    positionId,
    tickStart,
    tickBond,
    tokenIsToken0,

    launchedAt,
    launchBlock,
    totalFeeBps: hookData?.totalFeeBps,

    txHash: launchedEvent.txHash,
    blockNumber: launchedEvent.blockNumber,
    logIndex: launchedEvent.logIndex,
  };
}

/**
 * Merges newly arrived LaunchMetadata into an existing ArgusPortal8Launch.
 * Preserves high-confidence on-chain token data and only updates unpopulated or secondary metadata.
 */
export function mergeMetadataIntoLaunch(
  existing: ArgusPortal8Launch,
  metadataEvent: Portal8RawMetadataEvent
): ArgusPortal8Launch {
  const sanitizedLogo = sanitizeUrl(metadataEvent.imageURI);
  const sanitizedWebsite = sanitizeUrl(metadataEvent.website);
  const sanitizedTwitter = sanitizeTwitter(metadataEvent.twitter);
  const sanitizedTelegram = sanitizeTelegram(metadataEvent.telegram);
  const sanitizedDescription = sanitizeDescription(metadataEvent.description);

  return {
    ...existing,
    // Logo: retain existing if already present (especially if from on-chain logo()), else use new sanitized
    logo: existing.logo || sanitizedLogo,
    website: sanitizedWebsite || existing.website,
    twitter: sanitizedTwitter || existing.twitter,
    telegram: sanitizedTelegram || existing.telegram,
    description: sanitizedDescription || existing.description,
  };
}

/**
 * Maps an authoritative ArgusPortal8Launch into DexHunter's canonical TokenPair discovery schema.
 * Preserves source attribution:
 * chain: "arc", chainId: "arc", primaryProvider: "Argus Portal 8", sources: ["Argus", "argus-portal8"]
 * and applies proper DexHunter field definitions without inventing non-standard fields.
 */
export function portal8LaunchToDexHunterToken(launch: ArgusPortal8Launch): TokenPair {
  const tokenAddress = safeChecksumAddress(launch.token);
  const quoteAddress = launch.quoteAsset
    ? safeChecksumAddress(launch.quoteAsset)
    : "0x3600000000000000000000000000000000000000";
  const name = launch.name || "Argus Token";
  const symbol = launch.symbol || "ARGUS";
  const logo = launch.logo || "/argus.png";
  const pairAddress = launch.hook ? safeChecksumAddress(launch.hook) : tokenAddress;

  const createdAt = launch.launchedAt
    ? Number(launch.launchedAt) * 1000
    : Date.now();

  const pair: TokenPair = {
    chainId: "arc",
    dexId: "argus",
    primaryDex: "Argus",
    primaryDexLogo: "/argus.png",
    primaryDexTradingUrl: `https://argus.world/token/${tokenAddress}`,
    url: `https://argus.world/token/${tokenAddress}`,
    pairAddress,
    baseToken: {
      address: tokenAddress,
      name,
      symbol,
    },
    quoteToken: {
      address: quoteAddress,
      name: "USDC",
      symbol: "USDC",
    },
    priceNative: "0",
    pairCreatedAt: createdAt,
    tokenAgeHours: Math.max(0, (Date.now() - createdAt) / 3600000),
    info: {
      imageUrl: logo,
      description:
        launch.description ||
        `Argus Portal #8 token on Arc mainnet. Permanently locked position with Uniswap v4 Hook.`,
      websites: launch.website ? [{ type: "website", label: "Website", url: launch.website }] : undefined,
      socials: [
        ...(launch.twitter ? [{ type: "twitter", url: launch.twitter }] : []),
        ...(launch.telegram ? [{ type: "telegram", url: launch.telegram }] : []),
      ],
    },
    website: launch.website,
    twitter: launch.twitter,
    telegram: launch.telegram,
    description: launch.description,
    creator: safeChecksumAddress(launch.creator),
    tokenTotalSupply: launch.totalSupply,
    launchPlatform: "Argus",
    primaryProvider: "Argus Portal 8",
    sources: ["Argus", "argus-portal8"],
    discoveredAt: Date.now(),
    // On-Chain Argus specifics
    isArgusLaunch: true,
    argusPortalId: 8,
    argusPortalFamily: "v8",
    argusPortalAddress: PORTAL8_ADDRESS,
    argusLockerAddress: launch.locker ? safeChecksumAddress(launch.locker) : undefined,
    argusHookAddress: launch.hook ? safeChecksumAddress(launch.hook) : undefined,
    argusPoolId: launch.positionId,
    argusTotalFeeBps: launch.totalFeeBps,
    argusLiquidityLocked: true,
    argusLockTimestamp: createdAt,
  };

  return pair;
}
