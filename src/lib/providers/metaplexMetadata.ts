import { Connection, PublicKey } from "@solana/web3.js";
import axios from "axios";
import { METAPLEX_PROGRAM_ID_STR } from "../pumpConstants";
import { isAllowedMetadataUrl, safeFetchUrl } from "../ssrf";
import { TtlLruCache } from "../lruCache";
import { preserveXUrl } from "../xLinkKind.js";

export const METAPLEX_PROGRAM_ID = new PublicKey(METAPLEX_PROGRAM_ID_STR);
export const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

export interface MetaplexTokenMetadata {
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints?: number;
  creators?: Array<{ address: string; verified: boolean; share: number }>;
  isMutable?: boolean;
  // Off-chain enriched data
  image?: string;
  description?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  discord?: string;
  createdOn?: string;
  rawJson?: any;
  dataSource: "onchain_and_offchain" | "onchain_only" | "offchain_only" | "none";
}

// Trusted IPFS & Arweave gateways for high reliability and fallback
export const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
  "https://w3s.link/ipfs/",
  "https://4everland.io/ipfs/",
  "https://nftstorage.link/ipfs/",
  "https://gateway.ipfs.io/ipfs/",
];

export const ARWEAVE_GATEWAYS = [
  "https://arweave.net/",
  "https://arweave.dev/",
  "https://arweave.app/",
];

// In-memory cache for resolved metadata (5 min TTL, max 500)
const CACHE_TTL_MS = 5 * 60 * 1000;
const metadataCache = new TtlLruCache<MetaplexTokenMetadata>(500, CACHE_TTL_MS);

/**
 * Normalizes any IPFS, Arweave, or raw URI into a fetchable HTTPS URL using gateway index
 */
export function normalizeUri(uri: string, gatewayIndex = 0): string {
  if (!uri || typeof uri !== "string") return "";
  const clean = uri.trim();

  // If already full http(s)
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    // If it is an ipfs.io URL, we can substitute alternative gateways if needed
    if (gatewayIndex > 0) {
      const ipfsMatch = clean.match(/\/ipfs\/([a-zA-Z0-9_-]+.*)/);
      if (ipfsMatch && ipfsMatch[1]) {
        const gw = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length];
        const substituted = `${gw}${ipfsMatch[1]}`;
        return isAllowedMetadataUrl(substituted) ? substituted : "";
      }
    }
    return isAllowedMetadataUrl(clean) ? clean : "";
  }

  // ipfs:// URI
  if (clean.startsWith("ipfs://")) {
    const path = clean.replace(/^ipfs:\/\/?/, "");
    const gw = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length];
    const out = `${gw}${path}`;
    return isAllowedMetadataUrl(out) ? out : "";
  }

  // ar:// URI
  if (clean.startsWith("ar://")) {
    const id = clean.replace(/^ar:\/\/?/, "");
    const gw = ARWEAVE_GATEWAYS[gatewayIndex % ARWEAVE_GATEWAYS.length];
    const out = `${gw}${id}`;
    return isAllowedMetadataUrl(out) ? out : "";
  }

  // Raw IPFS CID (Qm... or bafy...)
  if (clean.startsWith("Qm") || clean.startsWith("bafy")) {
    const gw = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length];
    const out = `${gw}${clean}`;
    return isAllowedMetadataUrl(out) ? out : "";
  }

  return "";
}

/**
 * Derives the canonical Metaplex Metadata PDA for a mint
 */
export function deriveMetaplexMetadataPda(mintPubkey: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METAPLEX_PROGRAM_ID.toBuffer(),
      mintPubkey.toBuffer(),
    ],
    METAPLEX_PROGRAM_ID
  );
  return pda;
}

/**
 * Decodes the on-chain Metaplex Metadata V1 buffer
 */
export function decodeMetaplexAccountBuffer(buffer: Buffer): {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
} {
  if (!buffer || buffer.length < 67) {
    return { name: "", symbol: "", uri: "", sellerFeeBasisPoints: 0 };
  }

  try {
    let offset = 1 + 32 + 32; // Key (1) + update_authority (32) + mint (32) = 65

    // Borsh string: 4-byte LE length + string bytes
    const nameLen = buffer.readUInt32LE(offset);
    offset += 4;
    let name = "";
    if (nameLen > 0 && offset + nameLen <= buffer.length) {
      name = buffer.subarray(offset, offset + nameLen).toString("utf8").replace(/\0/g, "").trim();
      offset += nameLen;
    } else {
      // Fallback: standard 32 bytes
      name = buffer.subarray(offset, offset + 32).toString("utf8").replace(/\0/g, "").trim();
      offset += 32;
    }

    const symbolLen = buffer.readUInt32LE(offset);
    offset += 4;
    let symbol = "";
    if (symbolLen > 0 && offset + symbolLen <= buffer.length) {
      symbol = buffer.subarray(offset, offset + symbolLen).toString("utf8").replace(/\0/g, "").trim();
      offset += symbolLen;
    } else {
      // Fallback: standard 10 bytes
      symbol = buffer.subarray(offset, offset + 10).toString("utf8").replace(/\0/g, "").trim();
      offset += 10;
    }

    const uriLen = buffer.readUInt32LE(offset);
    offset += 4;
    let uri = "";
    if (uriLen > 0 && offset + uriLen <= buffer.length) {
      uri = buffer.subarray(offset, offset + uriLen).toString("utf8").replace(/\0/g, "").trim();
      offset += uriLen;
    } else {
      // Fallback: standard 200 bytes
      uri = buffer.subarray(offset, offset + 200).toString("utf8").replace(/\0/g, "").trim();
      offset += 200;
    }

    let sellerFeeBasisPoints = 0;
    if (offset + 2 <= buffer.length) {
      sellerFeeBasisPoints = buffer.readUInt16LE(offset);
    }

    return { name, symbol, uri, sellerFeeBasisPoints };
  } catch (err) {
    return { name: "", symbol: "", uri: "", sellerFeeBasisPoints: 0 };
  }
}

/**
 * Fetches off-chain JSON metadata from URI with parallel multi-gateway racing
 */
export async function fetchOffChainMetadataWithGateways(
  uri: string,
  timeoutMs = 4000
): Promise<any> {
  if (!uri || typeof uri !== "string") return null;

  const axiosOpts = {
    timeout: timeoutMs,
    maxRedirects: 0,
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "curl/8.4.0",
    },
  };

  // 1. If it is already a direct dedicated CDN URL (e.g. j7tracker, uxento, fast-ipfs, etc.), try direct first
  const cleanUri = uri.trim();
  const directUrl = normalizeUri(cleanUri, 0);
  const isDirectCdn =
    directUrl.startsWith("http") &&
    !directUrl.includes("ipfs.io") &&
    !directUrl.includes("gateway.pinata") &&
    !directUrl.includes("cloudflare-ipfs");

  if (isDirectCdn) {
    const safeDirect = safeFetchUrl(directUrl);
    if (safeDirect) {
      try {
        const response = await axios.get(safeDirect, {
          ...axiosOpts,
          timeout: Math.min(timeoutMs, 2500),
        });
        if (response.data && typeof response.data === "object") {
          return response.data;
        }
      } catch {}
    }
  }

  // 2. Build candidate URLs across gateways
  const isArweave = cleanUri.includes("ar://") || cleanUri.includes("arweave");
  const gateways = isArweave ? ARWEAVE_GATEWAYS : IPFS_GATEWAYS;
  const candidateUrls: string[] = [];

  for (let i = 0; i < gateways.length; i++) {
    const candidate = normalizeUri(cleanUri, i);
    const safe = safeFetchUrl(candidate);
    if (safe && !candidateUrls.includes(safe)) {
      candidateUrls.push(safe);
    }
  }

  if (candidateUrls.length === 0) return null;

  // 3. Race candidate gateways in parallel using Promise.any for sub-second resolution
  try {
    const fetchPromises = candidateUrls.slice(0, 6).map((url) =>
      axios.get(url, axiosOpts).then((res) => {
        if (res.data && typeof res.data === "object") {
          return res.data;
        }
        throw new Error("Empty or invalid JSON");
      })
    );

    return await Promise.any(fetchPromises);
  } catch {
    for (let i = 6; i < candidateUrls.length; i++) {
      try {
        const res = await axios.get(candidateUrls[i], {
          ...axiosOpts,
          timeout: 2500,
        });
        if (res.data && typeof res.data === "object") {
          return res.data;
        }
      } catch {}
    }
  }

  return null;
}

/**
 * Normalizes social link URLs into full clean web URLs
 */
function normalizeSocialLink(link: any, type: "twitter" | "telegram" | "website"): string {
  if (!link || typeof link !== "string") return "";
  let clean = link.trim();
  if (!clean) return "";

  if (type === "twitter") {
    const preserved = preserveXUrl(clean);
    return preserved || "";
  }

  if (type === "telegram") {
    clean = clean.replace(/^@/, "");
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      if (clean.startsWith("t.me/")) {
        return `https://${clean}`;
      }
      return `https://t.me/${clean}`;
    }
    return clean;
  }

  if (type === "website") {
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      return `https://${clean}`;
    }
    return clean;
  }

  return clean;
}

/**
 * Decodes on-chain Token-2022 Extension Type 19 (TokenMetadata) buffer directly from mint account
 */
export function decodeToken2022Metadata(buffer: Buffer): {
  name: string;
  symbol: string;
  uri: string;
} | null {
  if (!buffer || buffer.length <= 82) return null;

  // Token-2022 writes an account-type byte, then TLV extensions.
  // On current Pump mints that byte is not always at offset 82 — the
  // account is padded, and the marker sits later (commonly 165).
  let offset = -1;
  const plausible = (at: number) => {
    if (at < 0 || buffer[at] !== 1 || at + 6 > buffer.length) return false;
    const extType = buffer.readUInt16LE(at + 1);
    const extLen = buffer.readUInt16LE(at + 3);
    return extType > 0 && extType < 40 && extLen > 0 && at + 5 + extLen <= buffer.length;
  };
  if (plausible(82)) offset = 83;
  else {
    for (let i = 82; i < buffer.length - 6; i++) {
      if (plausible(i)) {
        offset = i + 1;
        break;
      }
    }
  }
  if (offset < 0) return null;
  while (offset + 4 <= buffer.length) {
    const extType = buffer.readUInt16LE(offset);
    const extLen = buffer.readUInt16LE(offset + 2);

    if (extType === 19 && extLen >= 68 && offset + 4 + extLen <= buffer.length) {
      let ptr = offset + 4;
      ptr += 32; // update_authority (32 bytes)
      ptr += 32; // mint (32 bytes)

      // Name length and string
      if (ptr + 4 > buffer.length) break;
      const nameLen = buffer.readUInt32LE(ptr);
      ptr += 4;
      if (nameLen > 250 || ptr + nameLen > buffer.length) {
        offset += 4 + extLen;
        continue;
      }
      const name = buffer.subarray(ptr, ptr + nameLen).toString("utf8").replace(/\0/g, "").trim();
      ptr += nameLen;

      // Symbol length and string
      if (ptr + 4 > buffer.length) break;
      const symbolLen = buffer.readUInt32LE(ptr);
      ptr += 4;
      if (symbolLen > 60 || ptr + symbolLen > buffer.length) {
        offset += 4 + extLen;
        continue;
      }
      const symbol = buffer.subarray(ptr, ptr + symbolLen).toString("utf8").replace(/\0/g, "").trim();
      ptr += symbolLen;

      // URI length and string
      if (ptr + 4 > buffer.length) break;
      const uriLen = buffer.readUInt32LE(ptr);
      ptr += 4;
      if (uriLen > 500 || ptr + uriLen > buffer.length) {
        offset += 4 + extLen;
        continue;
      }
      const uri = buffer.subarray(ptr, ptr + uriLen).toString("utf8").replace(/\0/g, "").trim();

      if (name || symbol || uri) {
        return { name, symbol, uri };
      }
    }

    const step = 4 + extLen;
    if (step <= 0) break;
    offset += step;
  }

  return null;
}

/**
 * Comprehensive Token Metadata Fetcher
 * Resolves on-chain Token-2022 Extension 19, Metaplex PDA, and multi-gateway off-chain JSON
 */
export async function fetchMetaplexMetadata(
  connection: Connection,
  mintAddress: string,
  options: { bypassCache?: boolean; timeoutMs?: number } = {}
): Promise<MetaplexTokenMetadata> {
  const cleanMint = (mintAddress || "").trim();
  if (!cleanMint) {
    return {
      mint: "",
      name: "",
      symbol: "",
      uri: "",
      dataSource: "none",
    };
  }

  // Check memory cache
  if (!options.bypassCache) {
    const cached = metadataCache.get(cleanMint);
    if (cached) {
      return cached;
    }
  }

  let mintPubkey: PublicKey;
  try {
    mintPubkey = new PublicKey(cleanMint);
  } catch {
    return {
      mint: cleanMint,
      name: "",
      symbol: "",
      uri: "",
      dataSource: "none",
    };
  }

  const pda = deriveMetaplexMetadataPda(mintPubkey);

  let onChainName = "";
  let onChainSymbol = "";
  let onChainUri = "";
  let sellerFeeBasisPoints = 0;
  let onChainFound = false;

  try {
    // Concurrently fetch Mint account (Token-2022 metadata) and Metaplex PDA
    const accounts = await connection.getMultipleAccountsInfo([mintPubkey, pda]);
    const mintAcc = accounts[0];
    const pdaAcc = accounts[1];

    // 1. Check Token-2022 Extension Type 19 in Mint Account
    if (mintAcc && mintAcc.data) {
      const t22 = decodeToken2022Metadata(mintAcc.data as Buffer);
      if (t22) {
        onChainName = t22.name;
        onChainSymbol = t22.symbol;
        onChainUri = t22.uri;
        onChainFound = true;
      }
    }

    // 2. If not found or incomplete, check legacy Metaplex PDA
    if (pdaAcc && pdaAcc.data) {
      const meta = decodeMetaplexAccountBuffer(pdaAcc.data as Buffer);
      if (!onChainName && meta.name) onChainName = meta.name;
      if (!onChainSymbol && meta.symbol) onChainSymbol = meta.symbol;
      if (!onChainUri && meta.uri) onChainUri = meta.uri;
      if (meta.sellerFeeBasisPoints) sellerFeeBasisPoints = meta.sellerFeeBasisPoints;
      onChainFound = true;
    }
  } catch (err) {
    // RPC error or accounts not found
  }

  // If on-chain URI exists, fetch off-chain JSON
  let offChainData: any = null;
  if (onChainUri) {
    offChainData = await fetchOffChainMetadataWithGateways(
      onChainUri,
      options.timeoutMs || 4000
    );
  }

  // Fallback check pump.fun frontend API if still missing name or images
  let pumpApiData: any = null;
  const needsEnrichment =
    !offChainData ||
    !onChainName ||
    !offChainData.image ||
    !offChainData.twitter ||
    !offChainData.telegram ||
    !offChainData.website ||
    !offChainData.description;

  if (needsEnrichment) {
    const isPumpMint = cleanMint.toLowerCase().endsWith("pump");
    if (isPumpMint) {
      try {
        const pumpUrl = safeFetchUrl(`https://frontend-api.pump.fun/coins/${cleanMint}`);
        if (pumpUrl) {
          const pumpRes = await axios.get(pumpUrl, {
            timeout: 5000,
            maxRedirects: 0,
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
              Accept: "application/json, text/plain, */*",
              Referer: "https://pump.fun/",
            },
          });
          if (pumpRes.data) {
            pumpApiData = pumpRes.data;
          }
        }
      } catch {}
    }
  }

  // Extract merged fields non-destructively
  const name =
    offChainData?.name ||
    pumpApiData?.name ||
    offChainData?.token_name ||
    pumpApiData?.token_name ||
    onChainName ||
    `Unknown Token (${cleanMint.slice(0, 4)}...${cleanMint.slice(-4)})`;

  const symbol =
    offChainData?.symbol ||
    pumpApiData?.symbol ||
    offChainData?.token_symbol ||
    pumpApiData?.token_symbol ||
    onChainSymbol ||
    cleanMint.slice(0, 5).toUpperCase();

  const description =
    offChainData?.description ||
    pumpApiData?.description ||
    offChainData?.bio ||
    pumpApiData?.bio ||
    "";

  // Image normalization
  let image =
    offChainData?.image ||
    offChainData?.image_uri ||
    pumpApiData?.image_uri ||
    pumpApiData?.image ||
    offChainData?.imageUrl ||
    offChainData?.logo ||
    offChainData?.icon ||
    "";
  if (image) {
    image = normalizeUri(image, 0);
  }

  // Check array links, socials, or attributes from various NFT/token formats
  let arrayTw: string | undefined;
  let arrayTg: string | undefined;
  let arrayWeb: string | undefined;
  let arrayDisc: string | undefined;

  const scanArray = (arr: any[]) => {
    if (!Array.isArray(arr)) return;
    for (const item of arr) {
      if (!item) continue;
      const url = typeof item === "string" ? item : (item.url || item.value || item.link || item.href);
      const type = typeof item === "object" ? String(item.type || item.trait_type || item.name || item.platform || "").toLowerCase() : "";
      if (typeof url === "string") {
        const uLower = url.toLowerCase();
        if (!arrayTw && (type.includes("twitter") || type.includes("x") || uLower.includes("twitter.com") || uLower.includes("x.com"))) {
          arrayTw = url;
        } else if (!arrayTg && (type.includes("telegram") || type.includes("tg") || uLower.includes("t.me") || uLower.includes("telegram.me"))) {
          arrayTg = url;
        } else if (!arrayDisc && (type.includes("discord") || uLower.includes("discord.gg") || uLower.includes("discord.com"))) {
          arrayDisc = url;
        } else if (!arrayWeb && (type.includes("web") || type.includes("site") || (!uLower.includes("twitter") && !uLower.includes("x.com") && !uLower.includes("t.me") && !uLower.includes("discord")))) {
          arrayWeb = url;
        }
      }
    }
  };

  scanArray(offChainData?.links);
  scanArray(offChainData?.socials);
  scanArray(offChainData?.attributes);
  scanArray(offChainData?.websites);

  // Extract from description if token creators included links directly in description
  const combinedDesc = String(description || offChainData?.description || "");
  let descTg: string | undefined;
  let descTw: string | undefined;
  let descWeb: string | undefined;

  const tgMatch = combinedDesc.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_+]+)/i);
  if (tgMatch) descTg = `https://t.me/${tgMatch[1]}`;

  const twMatch = combinedDesc.match(/(?:https?:\/\/|\/\/)?(?:www\.)?(?:mobile\.)?(?:twitter\.com|x\.com)\/[^\s)]+/i);
  if (twMatch) {
    const preserved = preserveXUrl(twMatch[0]);
    if (preserved) descTw = preserved;
  }

  const webMatch = combinedDesc.match(/https?:\/\/(?!(?:t\.me|telegram\.me|twitter\.com|x\.com|ipfs\.io|arweave\.net|dexscreener\.com|pump\.fun))([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s)]*)?)/i);
  if (webMatch) descWeb = webMatch[0];

  // Socials normalization
  const twitterRaw =
    offChainData?.twitter ||
    offChainData?.x ||
    pumpApiData?.twitter ||
    pumpApiData?.x ||
    offChainData?.twitter_url ||
    offChainData?.x_url ||
    offChainData?.socials?.twitter ||
    offChainData?.socials?.x ||
    offChainData?.links?.twitter ||
    offChainData?.links?.x ||
    offChainData?.extensions?.twitter ||
    arrayTw ||
    descTw;

  const telegramRaw =
    offChainData?.telegram ||
    offChainData?.tg ||
    pumpApiData?.telegram ||
    offChainData?.telegram_url ||
    offChainData?.socials?.telegram ||
    offChainData?.socials?.tg ||
    offChainData?.links?.telegram ||
    offChainData?.links?.tg ||
    offChainData?.extensions?.telegram ||
    arrayTg ||
    descTg;

  const websiteRaw =
    offChainData?.website ||
    offChainData?.web ||
    pumpApiData?.website ||
    offChainData?.website_url ||
    offChainData?.socials?.website ||
    offChainData?.links?.website ||
    offChainData?.extensions?.website ||
    offChainData?.url ||
    offChainData?.external_url ||
    arrayWeb ||
    descWeb;

  const discordRaw =
    offChainData?.discord ||
    pumpApiData?.discord ||
    offChainData?.socials?.discord ||
    offChainData?.links?.discord ||
    arrayDisc;

  const twitter = normalizeSocialLink(twitterRaw, "twitter");
  const telegram = normalizeSocialLink(telegramRaw, "telegram");
  const website = normalizeSocialLink(websiteRaw, "website");
  const discord = discordRaw ? String(discordRaw).trim() : undefined;

  let dataSource: MetaplexTokenMetadata["dataSource"] = "none";
  if (onChainFound && offChainData) {
    dataSource = "onchain_and_offchain";
  } else if (onChainFound) {
    dataSource = "onchain_only";
  } else if (offChainData) {
    dataSource = "offchain_only";
  }

  const result: MetaplexTokenMetadata = {
    mint: cleanMint,
    name,
    symbol,
    uri: onChainUri,
    sellerFeeBasisPoints,
    image: image || undefined,
    description: description || undefined,
    twitter: twitter || undefined,
    telegram: telegram || undefined,
    website: website || undefined,
    discord: discord || undefined,
    createdOn: offChainData?.createdOn,
    rawJson: offChainData || undefined,
    dataSource,
  };

  // Cache result — never cache empty / dataSource:"none"
  if (dataSource !== "none" && name) {
    metadataCache.set(cleanMint, result);
  }

  return result;
}
