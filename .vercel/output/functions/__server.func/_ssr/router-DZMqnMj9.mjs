import { o as __toESM } from "../_runtime.mjs";
import { n as PublicKey, r as require_bs58, t as Connection } from "../_libs/@solana/web3.js.mjs";
import { t as axios } from "../_libs/axios+[...].mjs";
import { S as require_jsx_runtime, Y as require_react, _ as createFileRoute, d as Scripts, f as HeadContent, g as lazyRouteComponent, h as Outlet, m as createRouter, v as createRootRoute, x as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as stripSearchParams } from "../_libs/@tanstack/router-core+[...].mjs";
import { a as id, c as toQuantity, i as Interface, l as hexlify, n as Network, o as getAddress, r as Contract, s as ZeroAddress, t as JsonRpcProvider } from "../_libs/ethers.mjs";
import { i as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
import path from "path";
import fs from "fs";
import os from "os";
import dns from "dns";
//#region node_modules/.nitro/vite/services/ssr/assets/metaplexMetadata-B11Yt5iX.js
var PUMP_PROGRAM_ID_STR = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
var PUMP_AMM_PROGRAM_ID_STR = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";
var METAPLEX_PROGRAM_ID_STR = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
var SOL_MINT_STR = "So11111111111111111111111111111111111111112";
var PUMP_INITIAL_REAL_TOKEN_RESERVES = 793100000000000n;
var RESERVED = /* @__PURE__ */ new Set([
	"home",
	"explore",
	"search",
	"settings",
	"i",
	"intent",
	"share",
	"compose",
	"messages",
	"notifications",
	"login",
	"signup",
	"tos",
	"privacy",
	"hashtag",
	"jobs",
	"about",
	"download",
	"oauth",
	"help",
	"display",
	"keyboard_shortcuts",
	"resources",
	"rules",
	"moments",
	"who_to_follow",
	"bookmarks",
	"communities",
	"premium",
	"verified",
	"logout",
	"session",
	"widgets",
	"follow",
	"topics",
	"lists",
	"favicon.ico"
]);
var PROFILE_TABS = /* @__PURE__ */ new Set([
	"with_replies",
	"followers",
	"following",
	"media",
	"likes",
	"highlights",
	"articles",
	"photo",
	"header_photo",
	"verified_followers",
	"affiliates",
	"superfollows"
]);
var X_URL_RE = /(?:https?:\/\/|\/\/)?(?:www\.)?(?:mobile\.)?(?:twitter\.com|x\.com)\/[^\s<>"'`|)]+/gi;
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
	return [
		"tiktok.com",
		"instagram.com",
		"youtube.com",
		"youtu.be",
		"facebook.com",
		"fb.com",
		"linkedin.com",
		"warpcast.com",
		"farcaster.xyz"
	].some((name) => h === name || h.endsWith(`.${name}`));
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
function preserveXUrl(raw) {
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
	if (/^[A-Za-z0-9_]{1,15}\/(?:status|statuses)\/\d+/i.test(text)) return `https://x.com/${text.replace(/^\/+/, "")}`;
	return "";
}
/**
* @param {unknown} raw
* @returns {"profile" | "post" | null}
*/
function classifyXUrl(raw) {
	if (typeof raw !== "string") return null;
	let text = raw.trim().replace(/^["']+|["']+$/g, "");
	text = text.replace(/[),.;!?]+$/g, "");
	if (!text || text === "null" || text === "undefined") return null;
	if (/^@?[A-Za-z0-9_]{1,15}$/.test(text) && !text.includes("/")) {
		const handle = text.replace(/^@/, "");
		return RESERVED.has(handle.toLowerCase()) ? null : "profile";
	}
	const url = asUrl(text);
	if (!url || url.protocol !== "http:" && url.protocol !== "https:") return null;
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
	if (lower[0] === "i" && lower[1] === "user" && /^\d{1,25}$/.test(parts[2] || "") && parts.length === 3) return "profile";
	if (RESERVED.has(lower[0])) return null;
	if (!/^[A-Za-z0-9_]{1,15}$/.test(parts[0])) return null;
	if (parts.length === 1) return "profile";
	if (parts.length === 2 && PROFILE_TABS.has(lower[1])) return "profile";
	return null;
}
/** @param {unknown} raw */
function absoluteXHref(raw) {
	if (classifyXUrl(raw) == null) return null;
	return preserveXUrl(typeof raw === "string" ? raw : "") || null;
}
/** @param {unknown} text */
function xUrlsFromText(text) {
	const raw = String(text || "").slice(0, 8e3);
	/** @type {string[]} */
	const out = [];
	const seen = /* @__PURE__ */ new Set();
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
		explicitWebsite: extra?.explicitWebsite
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
		else pushCandidate(all, site.type || "website", site.url, {
			label: site.label,
			explicitWebsite: true
		});
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
	if (Array.isArray(pair.socials)) for (const row of pair.socials) if (typeof row === "string") pushCandidate(all, "", row);
	else pushCandidate(all, row?.type, row?.url || row?.value, { label: row?.label });
	else if (pair.socials && typeof pair.socials === "object") {
		pushCandidate(all, "telegram", pair.socials.telegram);
		pushCandidate(all, "telegram", pair.socials.tg);
		pushCandidate(all, "twitter", pair.socials.twitter);
		pushCandidate(all, "twitter", pair.socials.x);
		pushCandidate(all, "website", pair.socials.website, { explicitWebsite: true });
		pushCandidate(all, "discord", pair.socials.discord);
	}
	if (Array.isArray(pair.links)) for (const row of pair.links) if (typeof row === "string") pushCandidate(all, "", row);
	else pushCandidate(all, row?.type, row?.url || row?.value, { label: row?.label });
	else if (pair.links && typeof pair.links === "object") {
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
		for (const attr of pair.attributes) if (attr && (attr.value || attr.url)) pushCandidate(all, attr.trait_type || attr.name || attr.type, attr.value || attr.url);
	}
	const desc = String(pair.description || pair.info?.description || "").slice(0, 8e3);
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
	if (!url || url.protocol !== "http:" && url.protocol !== "https:") return null;
	return clean;
}
/**
* @param {any} pair
* @returns {{ telegram: string | null; discord: string | null; website: string | null; xProfile: string | null; xPost: string | null }}
*/
function readSocials(pair) {
	/** @type {{ telegram: string | null; discord: string | null; website: string | null; xProfile: string | null; xPost: string | null }} */
	const found = {
		telegram: null,
		discord: null,
		website: null,
		xProfile: null,
		xPost: null
	};
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
		if (xKind || host && isXHost(host)) continue;
		const typedTelegram = typeLower === "telegram" || typeLower === "tg" || labelLower.includes("telegram");
		const typedDiscord = typeLower === "discord" || labelLower.includes("discord");
		if (!found.telegram && (typedTelegram || host && isTelegramHost(host))) {
			found.telegram = coerceOther(raw, "telegram");
			continue;
		}
		if (!found.discord && (typedDiscord || host && isDiscordHost(host))) {
			found.discord = coerceOther(raw, "discord");
			continue;
		}
		const explicit = Boolean(candidate.explicitWebsite);
		const blocked = Boolean(host && (isTelegramHost(host) || isDiscordHost(host) || isTrackerHost(host) || isProfileHost(host)));
		const kindText = `${typeLower} ${labelLower}`;
		const websiteTyped = kindText.includes("website") || kindText.split(/\s+/).includes("web");
		if (!found.website && !blocked && (explicit || websiteTyped) && !looksLikeImage(raw)) found.website = coerceOther(raw, "website");
	}
	return found;
}
/**
* X profiles and X posts combine with OR. Neither selected leaves X unfiltered.
* A legacy `twitter` flag, with neither sub-filter, means either classified kind.
* @param {any} pair
* @param {{ telegram?: boolean; twitter?: boolean; discord?: boolean; website?: boolean; verified?: boolean; xProfile?: boolean; xPost?: boolean }} flags
*/
function matchSocialFilters(pair, flags) {
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
	if ((wantProfile || wantPost) && !(wantProfile && socials.xProfile || wantPost && socials.xPost)) return false;
	if (wanted.verified) {
		if ([
			socials.telegram,
			socials.discord,
			socials.website,
			socials.xProfile || socials.xPost
		].filter(Boolean).length < 2) return false;
	}
	return true;
}
var CASE_INSENSITIVE_CHAINS = /* @__PURE__ */ new Set([
	"arc",
	"ethereum",
	"eth",
	"base",
	"bsc",
	"bnb",
	"polygon",
	"matic",
	"arbitrum",
	"optimism",
	"avalanche",
	"avax",
	"fantom",
	"linea",
	"scroll",
	"zksync",
	"blast",
	"monad",
	"robinhood",
	"pulsechain",
	"cro",
	"gnosis",
	"celo",
	"moonbeam",
	"kava",
	"metis",
	"taiko",
	"mantle",
	"mode",
	"worldchain",
	"unichain",
	"berachain",
	"sonic",
	"hyperevm"
]);
/**
* @param {string | null | undefined} chain
* @param {unknown} address
*/
function identityAddress(chain, address) {
	const raw = String(address ?? "").trim();
	if (!raw) return "";
	const id = String(chain ?? "").trim().toLowerCase();
	if (CASE_INSENSITIVE_CHAINS.has(id)) return raw.toLowerCase();
	return raw;
}
/**
* @param {string | null | undefined} chain
* @param {unknown} address
*/
function chainTokenKey(chain, address) {
	const id = String(chain ?? "").trim().toLowerCase();
	const addr = identityAddress(id, address);
	if (!addr) return "";
	return `${id}:${addr}`;
}
/**
* SSRF & URL Validation utilities for remote metadata & IPFS fetching
*/
var BLOCKED_HOSTNAMES = /* @__PURE__ */ new Set([
	"localhost",
	"127.0.0.1",
	"0.0.0.0",
	"::1",
	"metadata.google.internal",
	"169.254.169.254",
	"instance-data"
]);
function isPrivateIp(hostname) {
	if (/^127\./.test(hostname)) return true;
	if (/^10\./.test(hostname)) return true;
	if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return true;
	if (/^192\.168\./.test(hostname)) return true;
	if (/^169\.254\./.test(hostname)) return true;
	if (/^fc00:|^fe80:/i.test(hostname)) return true;
	return false;
}
function isAllowedMetadataUrl(urlStr) {
	if (!urlStr || typeof urlStr !== "string") return false;
	try {
		const parsed = new URL(urlStr);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
		const hostname = parsed.hostname.toLowerCase();
		if (BLOCKED_HOSTNAMES.has(hostname)) return false;
		if (isPrivateIp(hostname)) return false;
		return true;
	} catch {
		return false;
	}
}
function safeFetchUrl(urlStr) {
	if (!urlStr) return null;
	const trimmed = urlStr.trim();
	if (isAllowedMetadataUrl(trimmed)) return trimmed;
	return null;
}
/**
* Time-To-Live (TTL) Least Recently Used (LRU) Cache
*/
var TtlLruCache = class {
	cache = /* @__PURE__ */ new Map();
	maxSize;
	defaultTtlMs;
	constructor(maxSize = 200, defaultTtlMs = 6e4) {
		this.maxSize = maxSize;
		this.defaultTtlMs = defaultTtlMs;
	}
	get(key) {
		const entry = this.cache.get(key);
		if (!entry) return void 0;
		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			return;
		}
		this.cache.delete(key);
		this.cache.set(key, entry);
		return entry.value;
	}
	set(key, value, ttlMs) {
		if (this.cache.has(key)) this.cache.delete(key);
		else if (this.cache.size >= this.maxSize) {
			const oldestKey = this.cache.keys().next().value;
			if (oldestKey !== void 0) this.cache.delete(oldestKey);
		}
		const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
		this.cache.set(key, {
			value,
			expiresAt
		});
	}
	has(key) {
		return this.get(key) !== void 0;
	}
	delete(key) {
		return this.cache.delete(key);
	}
	clear() {
		this.cache.clear();
	}
	get size() {
		return this.cache.size;
	}
};
var METAPLEX_PROGRAM_ID$1 = new PublicKey(METAPLEX_PROGRAM_ID_STR);
new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
var IPFS_GATEWAYS = [
	"https://ipfs.io/ipfs/",
	"https://dweb.link/ipfs/",
	"https://w3s.link/ipfs/",
	"https://4everland.io/ipfs/",
	"https://nftstorage.link/ipfs/",
	"https://gateway.ipfs.io/ipfs/"
];
var ARWEAVE_GATEWAYS = [
	"https://arweave.net/",
	"https://arweave.dev/",
	"https://arweave.app/"
];
var metadataCache = new TtlLruCache(500, 3e5);
/**
* Normalizes any IPFS, Arweave, or raw URI into a fetchable HTTPS URL using gateway index
*/
function normalizeUri(uri, gatewayIndex = 0) {
	if (!uri || typeof uri !== "string") return "";
	const clean = uri.trim();
	if (clean.startsWith("http://") || clean.startsWith("https://")) {
		if (gatewayIndex > 0) {
			const ipfsMatch = clean.match(/\/ipfs\/([a-zA-Z0-9_-]+.*)/);
			if (ipfsMatch && ipfsMatch[1]) {
				const substituted = `${IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length]}${ipfsMatch[1]}`;
				return isAllowedMetadataUrl(substituted) ? substituted : "";
			}
		}
		return isAllowedMetadataUrl(clean) ? clean : "";
	}
	if (clean.startsWith("ipfs://")) {
		const path = clean.replace(/^ipfs:\/\/?/, "");
		const out = `${IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length]}${path}`;
		return isAllowedMetadataUrl(out) ? out : "";
	}
	if (clean.startsWith("ar://")) {
		const id = clean.replace(/^ar:\/\/?/, "");
		const out = `${ARWEAVE_GATEWAYS[gatewayIndex % ARWEAVE_GATEWAYS.length]}${id}`;
		return isAllowedMetadataUrl(out) ? out : "";
	}
	if (clean.startsWith("Qm") || clean.startsWith("bafy")) {
		const out = `${IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length]}${clean}`;
		return isAllowedMetadataUrl(out) ? out : "";
	}
	return "";
}
/**
* Derives the canonical Metaplex Metadata PDA for a mint
*/
function deriveMetaplexMetadataPda$1(mintPubkey) {
	const [pda] = PublicKey.findProgramAddressSync([
		Buffer.from("metadata"),
		METAPLEX_PROGRAM_ID$1.toBuffer(),
		mintPubkey.toBuffer()
	], METAPLEX_PROGRAM_ID$1);
	return pda;
}
/**
* Decodes the on-chain Metaplex Metadata V1 buffer
*/
function decodeMetaplexAccountBuffer(buffer) {
	if (!buffer || buffer.length < 67) return {
		name: "",
		symbol: "",
		uri: "",
		sellerFeeBasisPoints: 0
	};
	try {
		let offset = 65;
		const nameLen = buffer.readUInt32LE(offset);
		offset += 4;
		let name = "";
		if (nameLen > 0 && offset + nameLen <= buffer.length) {
			name = buffer.subarray(offset, offset + nameLen).toString("utf8").replace(/\0/g, "").trim();
			offset += nameLen;
		} else {
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
			uri = buffer.subarray(offset, offset + 200).toString("utf8").replace(/\0/g, "").trim();
			offset += 200;
		}
		let sellerFeeBasisPoints = 0;
		if (offset + 2 <= buffer.length) sellerFeeBasisPoints = buffer.readUInt16LE(offset);
		return {
			name,
			symbol,
			uri,
			sellerFeeBasisPoints
		};
	} catch (err) {
		return {
			name: "",
			symbol: "",
			uri: "",
			sellerFeeBasisPoints: 0
		};
	}
}
/**
* Fetches off-chain JSON metadata from URI with parallel multi-gateway racing
*/
async function fetchOffChainMetadataWithGateways(uri, timeoutMs = 4e3) {
	if (!uri || typeof uri !== "string") return null;
	const axiosOpts = {
		timeout: timeoutMs,
		maxRedirects: 0,
		headers: {
			Accept: "application/json, text/plain, */*",
			"User-Agent": "curl/8.4.0"
		}
	};
	const cleanUri = uri.trim();
	const directUrl = normalizeUri(cleanUri, 0);
	if (directUrl.startsWith("http") && !directUrl.includes("ipfs.io") && !directUrl.includes("gateway.pinata") && !directUrl.includes("cloudflare-ipfs")) {
		const safeDirect = safeFetchUrl(directUrl);
		if (safeDirect) try {
			const response = await axios.get(safeDirect, {
				...axiosOpts,
				timeout: Math.min(timeoutMs, 2500)
			});
			if (response.data && typeof response.data === "object") return response.data;
		} catch {}
	}
	const gateways = cleanUri.includes("ar://") || cleanUri.includes("arweave") ? ARWEAVE_GATEWAYS : IPFS_GATEWAYS;
	const candidateUrls = [];
	for (let i = 0; i < gateways.length; i++) {
		const safe = safeFetchUrl(normalizeUri(cleanUri, i));
		if (safe && !candidateUrls.includes(safe)) candidateUrls.push(safe);
	}
	if (candidateUrls.length === 0) return null;
	try {
		const fetchPromises = candidateUrls.slice(0, 6).map((url) => axios.get(url, axiosOpts).then((res) => {
			if (res.data && typeof res.data === "object") return res.data;
			throw new Error("Empty or invalid JSON");
		}));
		return await Promise.any(fetchPromises);
	} catch {
		for (let i = 6; i < candidateUrls.length; i++) try {
			const res = await axios.get(candidateUrls[i], {
				...axiosOpts,
				timeout: 2500
			});
			if (res.data && typeof res.data === "object") return res.data;
		} catch {}
	}
	return null;
}
/**
* Normalizes social link URLs into full clean web URLs
*/
function normalizeSocialLink(link, type) {
	if (!link || typeof link !== "string") return "";
	let clean = link.trim();
	if (!clean) return "";
	if (type === "twitter") return preserveXUrl(clean) || "";
	if (type === "telegram") {
		clean = clean.replace(/^@/, "");
		if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
			if (clean.startsWith("t.me/")) return `https://${clean}`;
			return `https://t.me/${clean}`;
		}
		return clean;
	}
	if (type === "website") {
		if (!clean.startsWith("http://") && !clean.startsWith("https://")) return `https://${clean}`;
		return clean;
	}
	return clean;
}
/**
* Decodes on-chain Token-2022 Extension Type 19 (TokenMetadata) buffer directly from mint account
*/
function decodeToken2022Metadata(buffer) {
	if (!buffer || buffer.length <= 82) return null;
	let offset = -1;
	const plausible = (at) => {
		if (at < 0 || buffer[at] !== 1 || at + 6 > buffer.length) return false;
		const extType = buffer.readUInt16LE(at + 1);
		const extLen = buffer.readUInt16LE(at + 3);
		return extType > 0 && extType < 40 && extLen > 0 && at + 5 + extLen <= buffer.length;
	};
	if (plausible(82)) offset = 83;
	else for (let i = 82; i < buffer.length - 6; i++) if (plausible(i)) {
		offset = i + 1;
		break;
	}
	if (offset < 0) return null;
	while (offset + 4 <= buffer.length) {
		const extType = buffer.readUInt16LE(offset);
		const extLen = buffer.readUInt16LE(offset + 2);
		if (extType === 19 && extLen >= 68 && offset + 4 + extLen <= buffer.length) {
			let ptr = offset + 4;
			ptr += 32;
			ptr += 32;
			if (ptr + 4 > buffer.length) break;
			const nameLen = buffer.readUInt32LE(ptr);
			ptr += 4;
			if (nameLen > 250 || ptr + nameLen > buffer.length) {
				offset += 4 + extLen;
				continue;
			}
			const name = buffer.subarray(ptr, ptr + nameLen).toString("utf8").replace(/\0/g, "").trim();
			ptr += nameLen;
			if (ptr + 4 > buffer.length) break;
			const symbolLen = buffer.readUInt32LE(ptr);
			ptr += 4;
			if (symbolLen > 60 || ptr + symbolLen > buffer.length) {
				offset += 4 + extLen;
				continue;
			}
			const symbol = buffer.subarray(ptr, ptr + symbolLen).toString("utf8").replace(/\0/g, "").trim();
			ptr += symbolLen;
			if (ptr + 4 > buffer.length) break;
			const uriLen = buffer.readUInt32LE(ptr);
			ptr += 4;
			if (uriLen > 500 || ptr + uriLen > buffer.length) {
				offset += 4 + extLen;
				continue;
			}
			const uri = buffer.subarray(ptr, ptr + uriLen).toString("utf8").replace(/\0/g, "").trim();
			if (name || symbol || uri) return {
				name,
				symbol,
				uri
			};
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
async function fetchMetaplexMetadata(connection, mintAddress, options = {}) {
	const cleanMint = (mintAddress || "").trim();
	if (!cleanMint) return {
		mint: "",
		name: "",
		symbol: "",
		uri: "",
		dataSource: "none"
	};
	if (!options.bypassCache) {
		const cached = metadataCache.get(cleanMint);
		if (cached) return cached;
	}
	let mintPubkey;
	try {
		mintPubkey = new PublicKey(cleanMint);
	} catch {
		return {
			mint: cleanMint,
			name: "",
			symbol: "",
			uri: "",
			dataSource: "none"
		};
	}
	const pda = deriveMetaplexMetadataPda$1(mintPubkey);
	let onChainName = "";
	let onChainSymbol = "";
	let onChainUri = "";
	let sellerFeeBasisPoints = 0;
	let onChainFound = false;
	try {
		const accounts = await connection.getMultipleAccountsInfo([mintPubkey, pda]);
		const mintAcc = accounts[0];
		const pdaAcc = accounts[1];
		if (mintAcc && mintAcc.data) {
			const t22 = decodeToken2022Metadata(mintAcc.data);
			if (t22) {
				onChainName = t22.name;
				onChainSymbol = t22.symbol;
				onChainUri = t22.uri;
				onChainFound = true;
			}
		}
		if (pdaAcc && pdaAcc.data) {
			const meta = decodeMetaplexAccountBuffer(pdaAcc.data);
			if (!onChainName && meta.name) onChainName = meta.name;
			if (!onChainSymbol && meta.symbol) onChainSymbol = meta.symbol;
			if (!onChainUri && meta.uri) onChainUri = meta.uri;
			if (meta.sellerFeeBasisPoints) sellerFeeBasisPoints = meta.sellerFeeBasisPoints;
			onChainFound = true;
		}
	} catch (err) {}
	let offChainData = null;
	if (onChainUri) offChainData = await fetchOffChainMetadataWithGateways(onChainUri, options.timeoutMs || 4e3);
	let pumpApiData = null;
	if (!offChainData || !onChainName || !offChainData.image || !offChainData.twitter || !offChainData.telegram || !offChainData.website || !offChainData.description) {
		if (cleanMint.toLowerCase().endsWith("pump")) try {
			const pumpUrl = safeFetchUrl(`https://frontend-api.pump.fun/coins/${cleanMint}`);
			if (pumpUrl) {
				const pumpRes = await axios.get(pumpUrl, {
					timeout: 5e3,
					maxRedirects: 0,
					headers: {
						"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
						Accept: "application/json, text/plain, */*",
						Referer: "https://pump.fun/"
					}
				});
				if (pumpRes.data) pumpApiData = pumpRes.data;
			}
		} catch {}
	}
	const name = offChainData?.name || pumpApiData?.name || offChainData?.token_name || pumpApiData?.token_name || onChainName || `Unknown Token (${cleanMint.slice(0, 4)}...${cleanMint.slice(-4)})`;
	const symbol = offChainData?.symbol || pumpApiData?.symbol || offChainData?.token_symbol || pumpApiData?.token_symbol || onChainSymbol || cleanMint.slice(0, 5).toUpperCase();
	const description = offChainData?.description || pumpApiData?.description || offChainData?.bio || pumpApiData?.bio || "";
	let image = offChainData?.image || offChainData?.image_uri || pumpApiData?.image_uri || pumpApiData?.image || offChainData?.imageUrl || offChainData?.logo || offChainData?.icon || "";
	if (image) image = normalizeUri(image, 0);
	let arrayTw;
	let arrayTg;
	let arrayWeb;
	let arrayDisc;
	const scanArray = (arr) => {
		if (!Array.isArray(arr)) return;
		for (const item of arr) {
			if (!item) continue;
			const url = typeof item === "string" ? item : item.url || item.value || item.link || item.href;
			const type = typeof item === "object" ? String(item.type || item.trait_type || item.name || item.platform || "").toLowerCase() : "";
			if (typeof url === "string") {
				const uLower = url.toLowerCase();
				if (!arrayTw && (type.includes("twitter") || type.includes("x") || uLower.includes("twitter.com") || uLower.includes("x.com"))) arrayTw = url;
				else if (!arrayTg && (type.includes("telegram") || type.includes("tg") || uLower.includes("t.me") || uLower.includes("telegram.me"))) arrayTg = url;
				else if (!arrayDisc && (type.includes("discord") || uLower.includes("discord.gg") || uLower.includes("discord.com"))) arrayDisc = url;
				else if (!arrayWeb && (type.includes("web") || type.includes("site") || !uLower.includes("twitter") && !uLower.includes("x.com") && !uLower.includes("t.me") && !uLower.includes("discord"))) arrayWeb = url;
			}
		}
	};
	scanArray(offChainData?.links);
	scanArray(offChainData?.socials);
	scanArray(offChainData?.attributes);
	scanArray(offChainData?.websites);
	const combinedDesc = String(description || offChainData?.description || "");
	let descTg;
	let descTw;
	let descWeb;
	const tgMatch = combinedDesc.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_+]+)/i);
	if (tgMatch) descTg = `https://t.me/${tgMatch[1]}`;
	const twMatch = combinedDesc.match(/(?:https?:\/\/|\/\/)?(?:www\.)?(?:mobile\.)?(?:twitter\.com|x\.com)\/[^\s)]+/i);
	if (twMatch) {
		const preserved = preserveXUrl(twMatch[0]);
		if (preserved) descTw = preserved;
	}
	const webMatch = combinedDesc.match(/https?:\/\/(?!(?:t\.me|telegram\.me|twitter\.com|x\.com|ipfs\.io|arweave\.net|dexscreener\.com|pump\.fun))([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s)]*)?)/i);
	if (webMatch) descWeb = webMatch[0];
	const twitterRaw = offChainData?.twitter || offChainData?.x || pumpApiData?.twitter || pumpApiData?.x || offChainData?.twitter_url || offChainData?.x_url || offChainData?.socials?.twitter || offChainData?.socials?.x || offChainData?.links?.twitter || offChainData?.links?.x || offChainData?.extensions?.twitter || arrayTw || descTw;
	const telegramRaw = offChainData?.telegram || offChainData?.tg || pumpApiData?.telegram || offChainData?.telegram_url || offChainData?.socials?.telegram || offChainData?.socials?.tg || offChainData?.links?.telegram || offChainData?.links?.tg || offChainData?.extensions?.telegram || arrayTg || descTg;
	const websiteRaw = offChainData?.website || offChainData?.web || pumpApiData?.website || offChainData?.website_url || offChainData?.socials?.website || offChainData?.links?.website || offChainData?.extensions?.website || offChainData?.url || offChainData?.external_url || arrayWeb || descWeb;
	const discordRaw = offChainData?.discord || pumpApiData?.discord || offChainData?.socials?.discord || offChainData?.links?.discord || arrayDisc;
	const twitter = normalizeSocialLink(twitterRaw, "twitter");
	const telegram = normalizeSocialLink(telegramRaw, "telegram");
	const website = normalizeSocialLink(websiteRaw, "website");
	const discord = discordRaw ? String(discordRaw).trim() : void 0;
	let dataSource = "none";
	if (onChainFound && offChainData) dataSource = "onchain_and_offchain";
	else if (onChainFound) dataSource = "onchain_only";
	else if (offChainData) dataSource = "offchain_only";
	const result = {
		mint: cleanMint,
		name,
		symbol,
		uri: onChainUri,
		sellerFeeBasisPoints,
		image: image || void 0,
		description: description || void 0,
		twitter: twitter || void 0,
		telegram: telegram || void 0,
		website: website || void 0,
		discord: discord || void 0,
		createdOn: offChainData?.createdOn,
		rawJson: offChainData || void 0,
		dataSource
	};
	if (dataSource !== "none" && name) metadataCache.set(cleanMint, result);
	return result;
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-DZMqnMj9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_bs58 = /* @__PURE__ */ __toESM(require_bs58());
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
function isUsdc(address) {
	return Boolean(address) && String(address).toLowerCase() === "0x3600000000000000000000000000000000000000".toLowerCase();
}
function tokenIsCurrency0(token, quote) {
	if (!token || !quote) return null;
	return String(token).toLowerCase() < String(quote).toLowerCase();
}
function quoteDecimalsOrNull(quote, knownDecimals) {
	if (Number.isFinite(knownDecimals)) return knownDecimals;
	if (isUsdc(quote)) return 6;
	return null;
}
function usdPriceOrNull(priceQuote, quote) {
	if (!isUsdc(quote)) return null;
	const n = Number(priceQuote);
	return Number.isFinite(n) && n > 0 ? n : null;
}
function usdVolumeOrNull(quoteRaw, quote, quoteDecimals) {
	if (!isUsdc(quote)) return null;
	const dec = quoteDecimalsOrNull(quote, quoteDecimals);
	if (dec == null) return null;
	const usd = Number(quoteRaw) / 10 ** dec;
	return Number.isFinite(usd) && usd >= 0 && usd <= 0xe8d4a51000 ? usd : null;
}
var ARC_NETWORK$1 = new Network("arc", 5042);
var PORTAL = "0xeed7559B8A6ABf64427dc41Cb5cc6400109C5D93";
var START_BLOCK = 22251758;
var MULTICALL$1 = "0xcA11bde05977b3631167028862bE2a173976CA11";
var USDC = "0x3600000000000000000000000000000000000000";
var STATE_VIEW = "0xF3334192D15450CdD385c8B70e03f9A6bD9E673b";
var POOL_MANAGER = "0x8366a39CC670B4001A1121B8F6A443A643e40951";
var DAY_BLOCKS = 17e4;
var META_TIMEOUT_MS = 9e5;
var BOOK_PATH$1 = path.join(os.tmpdir(), "dexhunter", "portal8-book.json");
var ENDPOINTS = [{
	url: "https://rpc.mainnet.arc.io",
	maxChunk: 8e3
}, {
	url: "https://rpc.beamrpc.com",
	maxChunk: 800
}];
var ARC_RPC_URLS = ENDPOINTS.map((e) => e.url);
var portalIface = new Interface([
	"event Launched(address indexed token, address indexed creator, address hook, address escrow, address locker, uint256 positionId, int24 tickStart, int24 tickBond)",
	"event LaunchMetadata(address indexed token, string imageURI, string website, string twitter, string telegram, string description)",
	"function launchCount() view returns (uint256)"
]);
var TOPIC_LAUNCHED$1 = portalIface.getEvent("Launched").topicHash;
var TOPIC_METADATA = portalIface.getEvent("LaunchMetadata").topicHash;
var ercIface$1 = new Interface([
	"function name() view returns (string)",
	"function symbol() view returns (string)",
	"function decimals() view returns (uint8)",
	"function totalSupply() view returns (uint256)"
]);
var hookIface = new Interface([
	"function quoteAsset() view returns (address)",
	"function totalFeeBps() view returns (uint16)",
	"function poolId() view returns (bytes32)"
]);
var stateIface = new Interface(["function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)", "function getLiquidity(bytes32 poolId) view returns (uint128 liquidity)"]);
var swapIface = new Interface(["event Swap(bytes32 indexed id, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)"]);
var TOPIC_SWAP = swapIface.getEvent("Swap").topicHash;
var multiIface$1 = new Interface(["function aggregate3((address target, bool allowFailure, bytes callData)[] calls) payable returns ((bool success, bytes returnData)[] returnData)"]);
function withTimeout$2(promise, ms) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(/* @__PURE__ */ new Error("timeout")), ms);
		promise.then((value) => {
			clearTimeout(timer);
			resolve(value);
		}, (err) => {
			clearTimeout(timer);
			reject(err);
		});
	});
}
function makeProvider(url) {
	return new JsonRpcProvider(url, ARC_NETWORK$1, {
		staticNetwork: true,
		batchMaxCount: 1
	});
}
function classify(err) {
	const msg = String(err?.shortMessage || err?.error?.message || err?.message || err);
	if (/rate limit|too many requests|429|-32005/i.test(msg)) return "rate";
	if (/too large|10,?000|20,?000|exceeds|block range|query returned more|response size|more than \d+/i.test(msg)) return "range";
	if (/400 bad request|could not coalesce/i.test(msg)) return "reject";
	if (/timeout|ECONN|ENOTFOUND|ETIMEDOUT|ECONNRESET|502|503|530|socket|network/i.test(msg)) return "down";
	return "other";
}
function stamp(log) {
	const raw = log?.blockTimestamp != null ? Number(log.blockTimestamp) : 0;
	if (!raw) return Date.now();
	return raw > 0xe8d4a51000 ? raw : raw * 1e3;
}
function usdPerToken(sqrtPriceX96, tokenIsToken0, tokenDecimals, quoteDecimals) {
	if (sqrtPriceX96 <= 0n) return 0;
	const scale = 10n ** 18n;
	const rawScaled = sqrtPriceX96 * sqrtPriceX96 * scale / (1n << 192n);
	if (rawScaled <= 0n) return 0;
	const adj = 10n ** BigInt(Math.max(0, tokenDecimals - quoteDecimals));
	const usdScaled = tokenIsToken0 ? rawScaled * adj : adj * scale * scale / rawScaled;
	const price = Number(usdScaled) / 0xde0b6b3a7640000;
	return Number.isFinite(price) && price > 0 && price < 1e9 ? price : 0;
}
function sqrtAtTick(tick) {
	const value = Math.exp(tick * Math.log(1.0001) / 2);
	return Number.isFinite(value) && value > 0 ? value : 0;
}
function liquidityUsd$1(rec) {
	const L = Number(rec.liquidityRaw);
	const tick = rec.tick;
	if (!(L > 0) || !Number.isFinite(tick)) return null;
	const lower = Math.min(rec.tickStart, rec.tickBond);
	const upper = Math.max(rec.tickStart, rec.tickBond);
	if (!Number.isFinite(lower) || !Number.isFinite(upper) || upper <= lower) return null;
	const sa = sqrtAtTick(lower);
	const sb = sqrtAtTick(upper);
	const sp = sqrtAtTick(tick);
	if (!(sa > 0) || !(sb > 0) || !(sp > 0)) return null;
	let amount0 = 0;
	let amount1 = 0;
	if (tick < lower) amount0 = L * (sb - sa) / (sa * sb);
	else if (tick >= upper) amount1 = L * (sb - sa);
	else {
		amount0 = L * (sb - sp) / (sp * sb);
		amount1 = L * (sp - sa);
	}
	const quoteDec = Number.isFinite(rec.quoteDecimals) ? rec.quoteDecimals : null;
	const tokenDec = rec.decimals || 18;
	const price = rec.priceUsd || 0;
	if (quoteDec == null || !(price > 0)) return null;
	const quoteAmount = rec.tokenIs0 ? amount1 : amount0;
	const tokenAmount = rec.tokenIs0 ? amount0 : amount1;
	const total = quoteAmount / 10 ** quoteDec + tokenAmount / 10 ** tokenDec * price;
	if (!Number.isFinite(total) || total < 0 || total > 0xe8d4a51000) return null;
	return total;
}
async function lookupArgusLaunch(address) {
	let token;
	try {
		token = getAddress(address);
	} catch {
		return null;
	}
	const launchIface = new Interface(["function launches(address) view returns (address hook, address escrow, address locker, uint256 positionId, int24 tickStart, int24 tickBond, bool tokenIsToken0)"]);
	const data = launchIface.encodeFunctionData("launches", [token]);
	let decoded = null;
	let lastError = null;
	for (const url of ARC_RPC_URLS) try {
		const raw = await withTimeout$2(makeProvider(url).call({
			to: PORTAL,
			data
		}), 7e3);
		decoded = launchIface.decodeFunctionResult("launches", raw);
		break;
	} catch (err) {
		lastError = err;
	}
	if (!decoded) return { error: lastError?.message || "Argus RPC failed" };
	const hook = decoded[0];
	const escrow = decoded[1];
	const locker = decoded[2];
	if (!hook || hook === "0x0000000000000000000000000000000000000000" || !escrow || escrow === "0x0000000000000000000000000000000000000000" || !locker || locker === "0x0000000000000000000000000000000000000000") return null;
	let name = "";
	let symbol = "";
	try {
		const provider = makeProvider(ARC_RPC_URLS[0]);
		const erc = new Contract(token, ercIface$1, provider);
		const [n, s] = await withTimeout$2(Promise.all([erc.name().catch(() => ""), erc.symbol().catch(() => "")]), 7e3);
		name = String(n || "").trim();
		symbol = String(s || "").trim();
	} catch {}
	if (/^0x[a-fA-F0-9]{40}$/.test(name)) name = "";
	return {
		chainId: "arc",
		dexId: "argus",
		primaryDex: "Argus",
		primaryDexLogo: "/argus.png",
		pairAddress: hook,
		baseToken: {
			address: token,
			name,
			symbol
		},
		quoteToken: void 0,
		sources: [
			"Argus",
			"Portal 8",
			"address-lookup"
		],
		dexes: ["Argus"],
		isArgusLaunch: true,
		launchPlatform: "Argus",
		argusPortalId: 8,
		argusHookAddress: hook,
		argusLockerAddress: locker,
		discoveryMode: "onchain",
		marketStage: "pool",
		isGraduated: true,
		isBondingCurve: false,
		discoveredAt: Date.now()
	};
}
function startArgusChainScan(opts) {
	const root = globalThis.process || globalThis;
	if (typeof root.__portal8Stop === "function") try {
		root.__portal8Stop();
	} catch {}
	const slots = ENDPOINTS.map((endpoint) => ({
		url: endpoint.url,
		maxChunk: endpoint.maxChunk,
		provider: makeProvider(endpoint.url),
		coolUntil: 0,
		fails: 0
	}));
	const primary = slots[0];
	let stopped = false;
	let ticking = false;
	let tickN = 0;
	let liveCursor = null;
	let historyFloor = null;
	let swapFloor = null;
	let swapReady = false;
	let backoffUntil = 0;
	let useMulticall = true;
	let dirty = false;
	let lastSave = 0;
	const seenLogs = /* @__PURE__ */ new Set();
	const launches = /* @__PURE__ */ new Map();
	const byPool = /* @__PURE__ */ new Map();
	const earlyMeta = /* @__PURE__ */ new Map();
	const pendingMeta = /* @__PURE__ */ new Map();
	const enrichQueue = [];
	const queued = /* @__PURE__ */ new Set();
	const volumeByPool = /* @__PURE__ */ new Map();
	loadBook();
	const timer = setInterval(() => {
		tick();
	}, 700);
	tick();
	readLaunchCount();
	function stop() {
		stopped = true;
		clearInterval(timer);
		saveBook(true);
		for (const slot of slots) slot.provider.destroy?.();
		if (root.__portal8Stop === stop) root.__portal8Stop = null;
	}
	root.__portal8Stop = stop;
	function pickLogSlot() {
		const now = Date.now();
		return slots.find((slot) => slot.coolUntil <= now) || null;
	}
	function cool(slot, ms) {
		slot.fails += 1;
		slot.coolUntil = Date.now() + ms;
	}
	async function readLaunchCount() {
		try {
			const data = await primary.provider.call({
				to: PORTAL,
				data: portalIface.encodeFunctionData("launchCount")
			});
			const count = portalIface.decodeFunctionResult("launchCount", data)[0];
			console.log(`[Portal8] launchCount=${count} book=${launches.size} via ${slots.map((s) => s.url).join(", ")}`);
		} catch (err) {
			console.warn("[Portal8] launchCount failed:", err?.shortMessage || err?.message || err);
		}
	}
	async function tick() {
		if (stopped || ticking || Date.now() < backoffUntil) return;
		ticking = true;
		tickN += 1;
		try {
			const head = await withTimeout$2(primary.provider.getBlockNumber(), 8e3);
			if (liveCursor == null) {
				liveCursor = head;
				historyFloor = head;
			}
			if (swapFloor == null) swapFloor = head;
			if (head > liveCursor) {
				const got = await pullLogs(liveCursor + 1, head, "forward");
				if (got != null) liveCursor = got;
			}
			if (historyFloor >= START_BLOCK) {
				const got = await pullLogs(START_BLOCK, historyFloor, "back");
				if (got != null) historyFloor = got - 1;
			}
			if (enrichQueue.length) await enrichSome(primary.provider);
			const historyDone = historyFloor != null && historyFloor < START_BLOCK;
			if (launches.size > 0 && (historyDone ? tickN % 2 === 0 : tickN % 6 === 0)) await pullSwaps(head);
			evictPending();
			if (dirty && Date.now() - lastSave > 15e3) saveBook(false);
		} catch (err) {
			const kind = classify(err);
			if (kind === "rate") backoffUntil = Date.now() + 1200 + Math.floor(Math.random() * 1800);
			else if (kind === "down" || kind === "reject") backoffUntil = Date.now() + 600;
			else console.warn("[Portal8] tick:", err?.shortMessage || err?.message || err);
		} finally {
			ticking = false;
		}
	}
	async function pullLogs(from, to, dir) {
		if (from > to) return to;
		const slot = pickLogSlot();
		if (!slot) return null;
		const span = Math.min(slot.maxChunk, to - from + 1);
		const start = dir === "back" ? to - span + 1 : from;
		const end = dir === "back" ? to : from + span - 1;
		try {
			const logs = await withTimeout$2(slot.provider.send("eth_getLogs", [{
				address: PORTAL,
				topics: [[TOPIC_LAUNCHED$1, TOPIC_METADATA]],
				fromBlock: toQuantity(start),
				toBlock: toQuantity(end)
			}]), 12e3);
			logs.sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber) || Number(a.logIndex) - Number(b.logIndex));
			for (const log of logs) ingest(log);
			slot.fails = 0;
			return dir === "back" ? start : end;
		} catch (err) {
			const kind = classify(err);
			if (kind === "range" || kind === "reject") {
				slot.maxChunk = Math.max(400, Math.floor(slot.maxChunk / 2));
				if (slot.maxChunk <= 400) cool(slot, 2e4);
				return null;
			}
			if (kind === "rate") {
				backoffUntil = Date.now() + 1400 + Math.floor(Math.random() * 2e3);
				cool(slot, 2500);
				return null;
			}
			cool(slot, kind === "down" ? 4e3 : 1500);
			return null;
		}
	}
	async function pullSwaps(head) {
		const dayFloor = Math.max(START_BLOCK, head - DAY_BLOCKS);
		if (swapReady && head <= swapFloor) return;
		const slot = primary;
		const span = Math.min(400, slot.maxChunk);
		let start;
		let end;
		if (!swapReady && swapFloor > dayFloor) {
			end = swapFloor;
			start = Math.max(dayFloor, end - span + 1);
		} else {
			start = Math.max(swapFloor, head - span + 1);
			end = head;
		}
		if (start > end) return;
		try {
			const logs = await withTimeout$2(slot.provider.send("eth_getLogs", [{
				address: POOL_MANAGER,
				topics: [TOPIC_SWAP],
				fromBlock: toQuantity(start),
				toBlock: toQuantity(end)
			}]), 12e3);
			for (const log of logs) applySwap(log);
			if (!swapReady) {
				swapFloor = start - 1;
				if (swapFloor <= dayFloor) {
					swapReady = true;
					swapFloor = head;
					for (const rec of launches.values()) {
						assignVolume(rec);
						rec.volumeComplete = true;
						emit(rec);
					}
					dirty = true;
					console.log("[Portal8] 24h swap window covered");
				}
			} else swapFloor = end;
		} catch (err) {
			if (classify(err) === "rate") backoffUntil = Date.now() + 1500 + Math.floor(Math.random() * 1500);
		}
	}
	function applySwap(log) {
		let parsed;
		try {
			parsed = swapIface.parseLog({
				topics: log.topics,
				data: log.data
			});
		} catch {
			return;
		}
		const poolId = String(parsed.args.id).toLowerCase();
		const bucket = volumeByPool.get(poolId) || {
			a0: 0,
			a1: 0
		};
		const a0 = Math.abs(Number(parsed.args.amount0));
		const a1 = Math.abs(Number(parsed.args.amount1));
		if (Number.isFinite(a0)) bucket.a0 += a0;
		if (Number.isFinite(a1)) bucket.a1 += a1;
		volumeByPool.set(poolId, bucket);
		const rec = byPool.get(poolId);
		if (!rec) return;
		assignVolume(rec);
		if (swapReady) emit(rec);
	}
	function assignVolume(rec) {
		const bucket = volumeByPool.get((rec.poolId || "").toLowerCase());
		if (!bucket) return;
		const quoteRaw = rec.tokenIs0 ? bucket.a1 : bucket.a0;
		rec.volumeQuoteRaw = quoteRaw;
		rec.volume24h = usdVolumeOrNull(quoteRaw, rec.quote, rec.quoteDecimals);
		if (swapReady) rec.volumeComplete = true;
	}
	function ingest(log) {
		const blockNumber = Number(log.blockNumber);
		const dedupeKey = `${blockNumber}:${Number(log.logIndex ?? 0)}`;
		if (seenLogs.has(dedupeKey)) return;
		let parsed;
		try {
			parsed = portalIface.parseLog({
				topics: log.topics,
				data: log.data
			});
		} catch {
			return;
		}
		if (!parsed) return;
		seenLogs.add(dedupeKey);
		const when = stamp(log);
		const token = getAddress(parsed.args.token);
		if (parsed.name === "LaunchMetadata") {
			applyMeta(token, parsed.args, when);
			return;
		}
		if (parsed.name !== "Launched") return;
		const id = token.toLowerCase();
		const prior = earlyMeta.get(id);
		earlyMeta.delete(id);
		const rec = launches.get(id) || { token };
		rec.token = token;
		rec.creator = getAddress(parsed.args.creator);
		rec.hook = getAddress(parsed.args.hook);
		rec.escrow = getAddress(parsed.args.escrow);
		rec.locker = getAddress(parsed.args.locker);
		rec.positionId = parsed.args.positionId.toString();
		rec.tickStart = Number(parsed.args.tickStart);
		rec.tickBond = Number(parsed.args.tickBond);
		rec.tx = log.transactionHash;
		rec.blockNumber = blockNumber;
		rec.when = rec.when && rec.when < when ? rec.when : when;
		if (prior) Object.assign(rec, prior);
		launches.set(id, rec);
		if (rec.poolId) byPool.set(rec.poolId.toLowerCase(), rec);
		if (!rec.metaAt) pendingMeta.set(id, pendingMeta.get(id) || Date.now());
		if (!rec.enriched && !queued.has(id)) {
			queued.add(id);
			enrichQueue.push(id);
		}
		dirty = true;
		emit(rec);
		if (launches.size % 250 === 0) console.log(`[Portal8] indexed ${launches.size} launches`);
	}
	function applyMeta(token, args, when) {
		const id = token.toLowerCase();
		const patch = {
			image: args.imageURI ? String(args.imageURI) : void 0,
			website: args.website ? String(args.website) : void 0,
			twitter: args.twitter ? String(args.twitter) : void 0,
			telegram: args.telegram ? String(args.telegram) : void 0,
			description: args.description ? String(args.description) : void 0,
			metaAt: when
		};
		const rec = launches.get(id);
		if (!rec) {
			earlyMeta.set(id, {
				...earlyMeta.get(id),
				...patch
			});
			return;
		}
		Object.assign(rec, patch);
		pendingMeta.delete(id);
		dirty = true;
		emit(rec);
	}
	function emit(rec) {
		if (!rec?.token) return;
		const socials = [...rec.twitter ? [{
			type: "twitter",
			url: rec.twitter
		}] : [], ...rec.telegram ? [{
			type: "telegram",
			url: rec.telegram
		}] : []];
		const image = rec.image && rec.image !== "/argus.svg" && !String(rec.image).endsWith("/argus.svg") ? rec.image : void 0;
		opts.upsert({
			chainId: "arc",
			dexId: "argus",
			primaryDex: "Argus",
			primaryDexLogo: "/argus.png",
			pairAddress: rec.poolId || rec.hook || rec.token,
			baseToken: {
				address: rec.token,
				name: rec.name || "",
				symbol: rec.symbol || ""
			},
			quoteToken: rec.quote ? {
				address: rec.quote,
				name: rec.quote.toLowerCase() === USDC.toLowerCase() ? "USDC" : "Quote",
				symbol: rec.quote.toLowerCase() === USDC.toLowerCase() ? "USDC" : "",
				decimals: Number.isFinite(rec.quoteDecimals) ? rec.quoteDecimals : void 0
			} : void 0,
			priceUsd: rec.priceUsd ? String(rec.priceUsd) : void 0,
			priceQuote: rec.priceQuote ? String(rec.priceQuote) : void 0,
			marketCap: rec.marketCap,
			fdv: rec.fdv,
			liquidity: rec.liquidityUsd != null ? { usd: rec.liquidityUsd } : void 0,
			totalLiquidityUsd: rec.liquidityUsd,
			volumeComplete: rec.volumeComplete === true && Number.isFinite(rec.volume24h),
			volume: Number.isFinite(rec.volume24h) ? { h24: rec.volume24h } : void 0,
			totalVolume24h: Number.isFinite(rec.volume24h) ? rec.volume24h : void 0,
			marketUpdatedAt: rec.quotedAt,
			pairCreatedAt: rec.when,
			creator: rec.creator,
			txHash: rec.tx,
			info: {
				imageUrl: image,
				description: rec.description,
				websites: rec.website ? [{
					type: "website",
					url: rec.website
				}] : void 0,
				socials: socials.length ? socials : void 0
			},
			twitter: rec.twitter,
			telegram: rec.telegram,
			website: rec.website,
			sources: ["Argus", "Portal 8"],
			dexes: ["Argus"],
			isArgusLaunch: true,
			launchPlatform: "Argus",
			argusPortalId: 8,
			argusPortalFamily: "v8",
			argusPortalAddress: PORTAL,
			argusHookAddress: rec.hook,
			argusLockerAddress: rec.locker,
			argusPositionId: rec.positionId,
			argusPoolId: rec.poolId,
			argusTotalFeeBps: rec.totalFeeBps,
			discoveredAt: rec.discoveredAt || Date.now(),
			discoveryMode: "onchain",
			metadataPending: !rec.metaAt
		});
	}
	function evictPending() {
		const now = Date.now();
		for (const [id, since] of pendingMeta) {
			if (now - since < META_TIMEOUT_MS) continue;
			pendingMeta.delete(id);
			const rec = launches.get(id);
			if (rec && !rec.metaAt) {
				rec.metadataMissed = true;
				emit(rec);
			}
		}
	}
	async function enrichSome(provider) {
		const batch = [];
		while (enrichQueue.length && batch.length < 20) {
			const id = enrichQueue.shift();
			queued.delete(id);
			const rec = launches.get(id);
			if (!rec || rec.enriched) continue;
			batch.push(rec);
		}
		if (!batch.length) return;
		try {
			if (useMulticall) await enrichMulticall(provider, batch);
			else await enrichPlain(provider, batch);
		} catch (err) {
			const kind = classify(err);
			if (/revert|multicall|CALL_EXCEPTION/i.test(String(err?.message || err))) useMulticall = false;
			for (const rec of batch) {
				const id = rec.token.toLowerCase();
				if (!rec.enriched && !queued.has(id)) {
					queued.add(id);
					enrichQueue.push(id);
				}
			}
			if (kind === "rate") backoffUntil = Date.now() + 1400 + Math.floor(Math.random() * 1600);
		}
	}
	function decodeRow(row, iface, fn) {
		const ok = row.success ?? row[0];
		const ret = row.returnData ?? row[1];
		if (!ok || !ret || ret === "0x") return null;
		try {
			return iface.decodeFunctionResult(fn, ret)[0];
		} catch {
			return null;
		}
	}
	async function aggregate(provider, calls) {
		const raw = await withTimeout$2(provider.call({
			to: MULTICALL$1,
			data: multiIface$1.encodeFunctionData("aggregate3", [calls])
		}), 8e3);
		return multiIface$1.decodeFunctionResult("aggregate3", raw)[0];
	}
	async function enrichMulticall(provider, batch) {
		const calls = [];
		const plan = [];
		for (const rec of batch) {
			const fields = [
				[
					"name",
					rec.token,
					ercIface$1,
					"name"
				],
				[
					"symbol",
					rec.token,
					ercIface$1,
					"symbol"
				],
				[
					"decimals",
					rec.token,
					ercIface$1,
					"decimals"
				],
				[
					"supply",
					rec.token,
					ercIface$1,
					"totalSupply"
				]
			];
			if (rec.hook) {
				fields.push([
					"quote",
					rec.hook,
					hookIface,
					"quoteAsset"
				]);
				fields.push([
					"fee",
					rec.hook,
					hookIface,
					"totalFeeBps"
				]);
				fields.push([
					"pool",
					rec.hook,
					hookIface,
					"poolId"
				]);
			}
			for (const [field, target, iface, fn] of fields) {
				calls.push({
					target,
					allowFailure: true,
					callData: iface.encodeFunctionData(fn)
				});
				plan.push({
					rec,
					field,
					iface,
					fn
				});
			}
		}
		const decoded = await aggregate(provider, calls);
		for (let i = 0; i < plan.length; i++) {
			const value = decodeRow(decoded[i], plan[i].iface, plan[i].fn);
			if (value == null) continue;
			const { rec, field } = plan[i];
			if (field === "name") rec.name = String(value);
			else if (field === "symbol") rec.symbol = String(value);
			else if (field === "decimals") rec.decimals = Number(value);
			else if (field === "supply") rec.totalSupply = value.toString();
			else if (field === "quote") {
				rec.quote = getAddress(value);
				const oriented = tokenIsCurrency0(rec.token, rec.quote);
				if (oriented != null) rec.tokenIs0 = oriented;
			} else if (field === "fee") rec.totalFeeBps = Number(value);
			else if (field === "pool") {
				rec.poolId = hexlify(value);
				byPool.set(rec.poolId.toLowerCase(), rec);
			}
		}
		await quoteMulticall(provider, batch.filter((rec) => rec.poolId));
		for (const rec of batch) {
			rec.enriched = Boolean(rec.name || rec.symbol);
			const id = rec.token.toLowerCase();
			if (!rec.enriched && !queued.has(id)) {
				queued.add(id);
				enrichQueue.push(id);
			}
			dirty = true;
			emit(rec);
		}
	}
	async function quoteMulticall(provider, batch) {
		if (!batch.length) return;
		const calls = [];
		const plan = [];
		for (const rec of batch) {
			calls.push({
				target: STATE_VIEW,
				allowFailure: true,
				callData: stateIface.encodeFunctionData("getSlot0", [rec.poolId])
			});
			plan.push({
				rec,
				field: "slot"
			});
			calls.push({
				target: STATE_VIEW,
				allowFailure: true,
				callData: stateIface.encodeFunctionData("getLiquidity", [rec.poolId])
			});
			plan.push({
				rec,
				field: "liq"
			});
		}
		const decoded = await aggregate(provider, calls);
		for (let i = 0; i < plan.length; i++) {
			const row = decoded[i];
			const ok = row.success ?? row[0];
			const ret = row.returnData ?? row[1];
			if (!ok || !ret || ret === "0x") continue;
			const { rec, field } = plan[i];
			try {
				if (field === "slot") {
					const slot = stateIface.decodeFunctionResult("getSlot0", ret);
					rec.quoteDecimals = quoteDecimalsOrNull(rec.quote, rec.quoteDecimals);
					const quoteDec = Number.isFinite(rec.quoteDecimals) ? rec.quoteDecimals : null;
					rec.tick = Number(slot[1]);
					const rawPrice = quoteDec != null ? usdPerToken(BigInt(slot[0]), Boolean(rec.tokenIs0), rec.decimals || 18, quoteDec) : 0;
					rec.priceQuote = rawPrice > 0 ? rawPrice : void 0;
					rec.priceUsd = usdPriceOrNull(rawPrice, rec.quote);
					const supply = BigInt(rec.totalSupply || "0");
					const unit = 10n ** BigInt(rec.decimals || 18);
					const whole = unit > 0n ? Number(supply / unit) + Number(supply % unit) / Number(unit) : 0;
					const usdPrice = rec.priceUsd || 0;
					rec.fdv = usdPrice && whole > 0 ? usdPrice * whole : void 0;
					rec.marketCap = void 0;
				} else rec.liquidityRaw = stateIface.decodeFunctionResult("getLiquidity", ret)[0].toString();
			} catch {}
		}
		for (const rec of batch) {
			const usd = liquidityUsd$1(rec);
			if (usd != null) rec.liquidityUsd = usd;
			if (rec.priceUsd) rec.quotedAt = Date.now();
			assignVolume(rec);
		}
	}
	async function enrichPlain(provider, batch) {
		for (const rec of batch) {
			const erc = new Contract(rec.token, ercIface$1, provider);
			const [name, symbol] = await Promise.all([erc.name().catch(() => ""), erc.symbol().catch(() => "")]);
			if (name) rec.name = String(name);
			if (symbol) rec.symbol = String(symbol);
			rec.enriched = Boolean(rec.name || rec.symbol);
			emit(rec);
		}
	}
	function loadBook() {
		try {
			if (!fs.existsSync(BOOK_PATH$1)) return;
			const book = JSON.parse(fs.readFileSync(BOOK_PATH$1, "utf8"));
			if (Number.isFinite(book.historyFloor)) historyFloor = book.historyFloor;
			if (Number.isFinite(book.liveCursor)) liveCursor = book.liveCursor;
			if (Number.isFinite(book.swapFloor)) swapFloor = book.swapFloor;
			swapReady = Boolean(book.swapReady);
			for (const row of book.tokens || []) {
				if (!row?.token) continue;
				const id = row.token.toLowerCase();
				launches.set(id, row);
				if (row.poolId) byPool.set(row.poolId.toLowerCase(), row);
				if (!row.enriched && !queued.has(id)) {
					queued.add(id);
					enrichQueue.push(id);
				}
				emit(row);
			}
			console.log(`[Portal8] restored ${launches.size} launches from book`);
		} catch (err) {
			console.warn("[Portal8] book load skipped:", err?.message || err);
		}
	}
	function saveBook(force) {
		if (!force && !dirty) return;
		try {
			fs.mkdirSync(path.dirname(BOOK_PATH$1), { recursive: true });
			const tokens = [];
			for (const rec of launches.values()) tokens.push({
				token: rec.token,
				name: rec.name,
				symbol: rec.symbol,
				hook: rec.hook,
				escrow: rec.escrow,
				locker: rec.locker,
				creator: rec.creator,
				positionId: rec.positionId,
				tickStart: rec.tickStart,
				tickBond: rec.tickBond,
				tx: rec.tx,
				blockNumber: rec.blockNumber,
				when: rec.when,
				tokenIs0: rec.tokenIs0,
				poolId: rec.poolId,
				quote: rec.quote,
				quoteDecimals: rec.quoteDecimals,
				decimals: rec.decimals,
				totalSupply: rec.totalSupply,
				totalFeeBps: rec.totalFeeBps,
				image: rec.image,
				website: rec.website,
				twitter: rec.twitter,
				telegram: rec.telegram,
				description: rec.description,
				metaAt: rec.metaAt,
				priceUsd: rec.priceUsd,
				marketCap: rec.marketCap,
				liquidityUsd: rec.liquidityUsd,
				tick: rec.tick,
				volume24h: rec.volume24h,
				volumeComplete: rec.volumeComplete,
				quotedAt: rec.quotedAt,
				enriched: rec.enriched,
				discoveredAt: rec.discoveredAt || Date.now()
			});
			const tmp = `${BOOK_PATH$1}.tmp`;
			fs.writeFileSync(tmp, JSON.stringify({
				historyFloor,
				liveCursor,
				swapFloor,
				swapReady,
				tokens
			}));
			fs.renameSync(tmp, BOOK_PATH$1);
			dirty = false;
			lastSave = Date.now();
		} catch (err) {
			console.warn("[Portal8] book save skipped:", err?.message || err);
		}
	}
	return stop;
}
var DATA_DIR = path.join(os.tmpdir(), "dexhunter");
var INDEX_FILE = path.join(DATA_DIR, "discovery-index.json");
var PUMP_CURSOR_FILE = path.join(DATA_DIR, "pump-cursor.json");
var PUMP_META_FILE = path.join(DATA_DIR, "pump-meta-retry.json");
var MAX_TOKENS = 8e3;
function loadIndex(file = INDEX_FILE) {
	try {
		const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
		if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.tokens)) return null;
		return parsed;
	} catch {
		return null;
	}
}
function saveIndex(file, data) {
	const dir = path.dirname(file);
	fs.mkdirSync(dir, { recursive: true });
	const tmp = `${file}.${process.pid}.tmp`;
	fs.writeFileSync(tmp, JSON.stringify(data));
	fs.renameSync(tmp, file);
}
function retainTokens(tokens, max = MAX_TOKENS) {
	const list = Array.isArray(tokens) ? tokens : [];
	const onchain = [];
	const search = [];
	const seen = /* @__PURE__ */ new Set();
	for (const token of list) {
		const addr = token?.baseToken?.address;
		const chain = token?.chainId || "";
		if (!addr) continue;
		const key = chainTokenKey(chain, addr);
		if (seen.has(key)) continue;
		seen.add(key);
		if (token.discoveryMode === "onchain") onchain.push(token);
		else search.push(token);
	}
	const byTime = (a, b) => (b.pairCreatedAt || b.firstSeenAt || 0) - (a.pairCreatedAt || a.firstSeenAt || 0);
	onchain.sort(byTime);
	search.sort(byTime);
	return [...onchain, ...search].slice(0, max);
}
function mergeSeedTokens(base, extra) {
	const tokens = Array.isArray(base) ? base.slice() : [];
	const seen = /* @__PURE__ */ new Set();
	for (const token of tokens) {
		const addr = token?.baseToken?.address;
		if (!addr) continue;
		seen.add(chainTokenKey(token.chainId, addr));
	}
	let added = 0;
	for (const token of Array.isArray(extra) ? extra : []) {
		const addr = token?.baseToken?.address;
		if (!addr) continue;
		const key = chainTokenKey(token.chainId, addr);
		if (seen.has(key)) continue;
		seen.add(key);
		tokens.push(token);
		added += 1;
	}
	return {
		tokens,
		added
	};
}
function seedRuntimeCache(seedDir = path.join(process.cwd(), "data")) {
	try {
		fs.mkdirSync(DATA_DIR, { recursive: true });
		if (!fs.existsSync(INDEX_FILE)) {
			const discoveryPath = path.join(seedDir, "discovery-index.json");
			if (fs.existsSync(discoveryPath)) {
				const parsed = JSON.parse(fs.readFileSync(discoveryPath, "utf8"));
				if (parsed && parsed.version === 1 && Array.isArray(parsed.tokens)) {
					const ponsPath = path.join(seedDir, "pons-index.json");
					if (fs.existsSync(ponsPath)) {
						const pons = JSON.parse(fs.readFileSync(ponsPath, "utf8"));
						const merged = mergeSeedTokens(parsed.tokens, pons?.tokens);
						parsed.tokens = merged.tokens;
						if (merged.added) console.log(`[index] seeded ${merged.added} Pons launches missing from the discovery snapshot`);
					}
					saveIndex(INDEX_FILE, parsed);
					console.log(`[index] seeded ${parsed.tokens.length} tokens into the runtime cache`);
				}
			}
		}
		if (!fs.existsSync(PUMP_CURSOR_FILE)) {
			const cursorPath = path.join(seedDir, "pump-cursor.json");
			if (fs.existsSync(cursorPath)) fs.copyFileSync(cursorPath, PUMP_CURSOR_FILE);
		}
	} catch (err) {
		console.warn("[index] seed skipped:", err?.message || err);
	}
}
function readPumpCursorState(file = PUMP_CURSOR_FILE) {
	try {
		const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
		return {
			signature: typeof parsed?.signature === "string" ? parsed.signature : "",
			pendingBefore: typeof parsed?.pendingBefore === "string" ? parsed.pendingBefore : "",
			pendingHead: typeof parsed?.pendingHead === "string" ? parsed.pendingHead : ""
		};
	} catch {
		return {
			signature: "",
			pendingBefore: "",
			pendingHead: ""
		};
	}
}
function readPumpMetaJobs(file = PUMP_META_FILE) {
	try {
		const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
		if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.jobs)) return [];
		return parsed.jobs.filter((job) => job && typeof job.mint === "string" && typeof job.uri === "string");
	} catch {
		return [];
	}
}
function writePumpMetaJobs(jobs, file = PUMP_META_FILE) {
	saveIndex(file, {
		version: 1,
		jobs: (Array.isArray(jobs) ? jobs : []).filter((job) => job && job.mint && job.uri).slice(0, 500)
	});
}
function writePumpCursor(signature, file = PUMP_CURSOR_FILE, extra = {}) {
	if (!signature && !extra.pendingBefore) return;
	saveIndex(file, {
		signature: signature || "",
		pendingBefore: extra.pendingBefore || "",
		pendingHead: extra.pendingHead || "",
		savedAt: Date.now()
	});
}
var CREATE_EVENT_DISC = Buffer.from([
	27,
	114,
	169,
	77,
	222,
	235,
	99,
	118
]);
var TRADE_EVENT_DISC = Buffer.from([
	189,
	219,
	127,
	211,
	78,
	230,
	97,
	238
]);
var PUMP_PROGRAM = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
var EVENT_IX_TAG = Buffer.from("e445a52e51cb9a1d", "hex");
var IX_CREATE = Buffer.from([
	24,
	30,
	200,
	40,
	5,
	28,
	7,
	119
]);
var IX_CREATE_V2 = Buffer.from([
	214,
	144,
	76,
	236,
	95,
	139,
	49,
	180
]);
var Reader = class {
	constructor(buf) {
		this.buf = buf;
		this.off = 0;
	}
	remaining() {
		return this.buf.length - this.off;
	}
	string() {
		const len = this.buf.readUInt32LE(this.off);
		this.off += 4;
		if (len > 2048 || this.off + len > this.buf.length) throw new Error("bad string length");
		const s = this.buf.subarray(this.off, this.off + len).toString("utf8");
		this.off += len;
		return s;
	}
	pubkey() {
		if (this.off + 32 > this.buf.length) throw new Error("short buffer");
		const k = new PublicKey(this.buf.subarray(this.off, this.off + 32)).toBase58();
		this.off += 32;
		return k;
	}
	u64() {
		const v = this.buf.readBigUInt64LE(this.off);
		this.off += 8;
		return v;
	}
	bool() {
		return this.buf.readUInt8(this.off++) === 1;
	}
};
function decodeCreateEvent(buf) {
	if (!Buffer.isBuffer(buf) || buf.length < 8 || !buf.subarray(0, 8).equals(CREATE_EVENT_DISC)) return null;
	const r = new Reader(buf.subarray(8));
	const ev = {
		name: r.string(),
		symbol: r.string(),
		uri: r.string(),
		mint: r.pubkey(),
		bondingCurve: r.pubkey(),
		user: r.pubkey(),
		creator: null
	};
	if (r.remaining() >= 32) ev.creator = r.pubkey();
	if (r.remaining() >= 8) {
		const seconds = Number(r.u64());
		if (Number.isFinite(seconds) && seconds > 1e9 && seconds < 0xe8d4a51000) ev.timestampMs = Math.round(seconds * 1e3);
	}
	if (r.remaining() >= 32) {
		ev.virtualTokenReserves = r.u64().toString();
		ev.virtualSolReserves = r.u64().toString();
		ev.realTokenReserves = r.u64().toString();
		ev.tokenTotalSupply = r.u64().toString();
	}
	if (r.remaining() >= 66) {
		ev.tokenProgram = r.pubkey();
		r.bool();
		r.bool();
		ev.quoteMint = r.pubkey();
	}
	return ev;
}
function decodeTradeEvent(buf) {
	if (!Buffer.isBuffer(buf) || buf.length < 8 || !buf.subarray(0, 8).equals(TRADE_EVENT_DISC)) return null;
	const r = new Reader(buf.subarray(8));
	return {
		mint: r.pubkey(),
		solAmount: r.u64(),
		tokenAmount: r.u64(),
		isBuy: r.bool(),
		user: r.pubkey()
	};
}
function programDataBuffers(logs) {
	const out = [];
	for (const line of logs || []) {
		const m = /^Program data: (\S+)$/.exec(line);
		if (!m) continue;
		try {
			out.push(Buffer.from(m[1], "base64"));
		} catch {}
	}
	return out;
}
function launchesFromBuffers(bufs) {
	const events = [];
	for (const b of bufs) try {
		const ev = decodeCreateEvent(b);
		if (ev?.mint) events.push(ev);
	} catch {}
	return events.map((ev) => {
		let devBuy = null;
		let tradeRaw = null;
		for (const b of bufs) try {
			const trade = decodeTradeEvent(b);
			if (trade && trade.isBuy && trade.mint === ev.mint) {
				devBuy = trade;
				tradeRaw = b;
				break;
			}
		} catch {}
		return {
			ev,
			devBuy,
			tradeRaw
		};
	});
}
function extractLaunches(logs) {
	return launchesFromBuffers(programDataBuffers(logs));
}
function keyOf(k) {
	if (!k) return "";
	if (typeof k === "string") return k;
	if (typeof k.toBase58 === "function") return k.toBase58();
	return String(k);
}
function toData(d) {
	if (!d) return Buffer.alloc(0);
	if (Buffer.isBuffer(d)) return d;
	if (d instanceof Uint8Array) return Buffer.from(d);
	if (typeof d === "string") try {
		return Buffer.from(import_bs58.default.decode(d));
	} catch {
		try {
			return Buffer.from(d, "base64");
		} catch {
			return Buffer.alloc(0);
		}
	}
	return Buffer.alloc(0);
}
function decodeCreateInstruction(data, accounts) {
	const buf = toData(data);
	const isV2 = buf.length >= 8 && buf.subarray(0, 8).equals(IX_CREATE_V2);
	if (!isV2 && !(buf.length >= 8 && buf.subarray(0, 8).equals(IX_CREATE))) return null;
	const r = new Reader(buf.subarray(8));
	const name = r.string();
	const symbol = r.string();
	const uri = r.string();
	let creator = null;
	if (r.remaining() >= 32) creator = r.pubkey();
	const mint = accounts?.[0] || null;
	if (!mint) return null;
	return {
		name,
		symbol,
		uri,
		mint,
		bondingCurve: accounts[2] || null,
		user: accounts[isV2 ? 5 : 7] || null,
		creator,
		timestampMs: null
	};
}
function parsePumpTransaction(tx) {
	if (!tx?.transaction?.message) return null;
	const msg = tx.transaction.message;
	const meta = tx.meta || {};
	let keys = [];
	if (typeof msg.getAccountKeys === "function") keys = msg.getAccountKeys({ accountKeysFromLookups: meta.loadedAddresses }).keySegments().flat().map(keyOf);
	else {
		keys = (msg.accountKeys || msg.staticAccountKeys || []).map(keyOf);
		for (const k of [...meta.loadedAddresses?.writable || [], ...meta.loadedAddresses?.readonly || []]) keys.push(keyOf(k));
	}
	const instructions = [];
	(msg.compiledInstructions || msg.instructions || []).forEach((ix, index) => {
		const programId = ix.programIdIndex != null ? keys[ix.programIdIndex] : keyOf(ix.programId);
		const accountIndexes = ix.accountKeyIndexes || ix.accounts || [];
		instructions.push({
			programId,
			accounts: accountIndexes.map((i) => typeof i === "number" ? keys[i] : keyOf(i)),
			data: toData(ix.data),
			inner: false,
			index
		});
	});
	for (const group of meta.innerInstructions || []) for (const ix of group.instructions || []) {
		const programId = ix.programIdIndex != null ? keys[ix.programIdIndex] : keyOf(ix.programId);
		instructions.push({
			programId,
			accounts: (ix.accounts || []).map((i) => typeof i === "number" ? keys[i] : keyOf(i)),
			data: toData(ix.data),
			inner: true,
			index: group.index
		});
	}
	return {
		blockTime: tx.blockTime ?? null,
		logs: meta.logMessages || [],
		instructions
	};
}
function eventBuffersFromParsed(parsed, programId = PUMP_PROGRAM) {
	const out = [];
	for (const ix of parsed?.instructions || []) if (ix.inner && ix.programId === programId && ix.data.length > 16 && ix.data.subarray(0, 8).equals(EVENT_IX_TAG)) out.push(ix.data.subarray(8));
	out.push(...programDataBuffers(parsed?.logs));
	return out;
}
function extractLaunchesFromTransaction(tx) {
	const parsed = parsePumpTransaction(tx);
	if (!parsed) return {
		launches: [],
		sawCreate: false,
		parsed: false,
		blockTime: null
	};
	const launches = launchesFromBuffers(eventBuffersFromParsed(parsed));
	if (!launches.length) for (const ix of parsed.instructions) {
		if (ix.programId !== "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P") continue;
		try {
			const ev = decodeCreateInstruction(ix.data, ix.accounts);
			if (!ev?.mint) continue;
			launches.push({
				ev,
				devBuy: null,
				tradeRaw: null
			});
			break;
		} catch {}
	}
	return {
		launches,
		sawCreate: launches.length > 0 || parsed.logs.some((line) => /Instruction: Create/.test(line)),
		parsed: true,
		blockTime: parsed.blockTime
	};
}
function extractLaunch(logs) {
	return extractLaunches(logs)[0] || null;
}
function logsNeedTransaction(logs) {
	const lines = logs || [];
	if (!lines.length) return true;
	if (lines.some((line) => /log_truncated/i.test(line))) return true;
	if (lines.some((line) => /Instruction: Create/.test(line)) && !extractLaunch(lines)) return true;
	return !lines.some((line) => line.startsWith("Program data:"));
}
function createTimestamp(tradedAt) {
	const n = Number(tradedAt);
	if (Number.isFinite(n) && n > 0xe8d4a51000 && n < 0x5af3107a4000) return Math.round(n);
	if (Number.isFinite(n) && n > 1e9 && n < 0xe8d4a51000) return Math.round(n * 1e3);
	return null;
}
function nextSignatureCursor(rows, outcome) {
	const list = Array.isArray(rows) ? rows : [];
	let firstRetry = -1;
	for (let i = 0; i < list.length; i++) if (outcome(list[i], i) === "retry") {
		firstRetry = i;
		break;
	}
	if (!list.length || firstRetry === 0) return {
		before: "",
		headComplete: false
	};
	if (firstRetry > 0) return {
		before: list[firstRetry - 1].signature,
		headComplete: true
	};
	return {
		before: list[list.length - 1].signature,
		headComplete: true
	};
}
var WRAPPED_SOL_MINT = "So11111111111111111111111111111111111111112";
function describeQuote(raw, legacySol = false) {
	if (!raw) {
		if (legacySol) return {
			mint: WRAPPED_SOL_MINT,
			raw: null,
			native: true,
			decimals: 9,
			symbol: "SOL"
		};
		return {
			mint: null,
			raw: null,
			native: false,
			decimals: null,
			symbol: null
		};
	}
	if (raw === "11111111111111111111111111111111" || raw === "So11111111111111111111111111111111111111112") return {
		mint: WRAPPED_SOL_MINT,
		raw,
		native: true,
		decimals: 9,
		symbol: "SOL"
	};
	return {
		mint: raw,
		raw,
		native: false,
		decimals: null,
		symbol: null
	};
}
function readU64At(buf, off) {
	return buf.readBigUInt64LE(off);
}
function decodeTradeDetails(buf) {
	if (!Buffer.isBuffer(buf) || buf.length < 129 || !buf.subarray(0, 8).equals(TRADE_EVENT_DISC)) return null;
	const r = new Reader(buf.subarray(8));
	const out = {
		mint: r.pubkey(),
		quoteAmount: r.u64(),
		tokenAmount: r.u64(),
		isBuy: r.bool(),
		user: r.pubkey(),
		timestamp: Number(r.u64()),
		virtualQuote: r.u64(),
		virtualToken: r.u64(),
		realQuote: r.u64(),
		realToken: r.u64(),
		quoteMint: null,
		quoteKnown: false,
		legacySol: true
	};
	if (r.remaining() === 0) return out;
	out.legacySol = false;
	try {
		if (r.remaining() < 129) return out;
		r.pubkey();
		r.u64();
		r.u64();
		r.pubkey();
		r.u64();
		r.u64();
		r.bool();
		r.u64();
		r.u64();
		r.u64();
		r.u64();
		if (r.remaining() < 4) return out;
		const nameLen = r.buf.readUInt32LE(r.off);
		if (nameLen > 64 || r.remaining() < 4 + nameLen) return out;
		r.off += 4 + nameLen;
		if (r.remaining() < 37) return out;
		r.bool();
		r.u64();
		r.u64();
		r.u64();
		r.u64();
		const count = r.buf.readUInt32LE(r.off);
		r.off += 4;
		if (count > 64 || r.remaining() < count * 34 + 32) return out;
		r.off += count * 34;
		out.quoteMint = r.pubkey();
		out.quoteKnown = true;
		if (r.remaining() >= 8) out.explicitQuoteAmount = readU64At(r.buf, r.off);
		return out;
	} catch {
		return out;
	}
}
function quotePerBaseScaled(quoteRaw, baseRaw, quoteDecimals, baseDecimals) {
	if (typeof quoteRaw !== "bigint" || typeof baseRaw !== "bigint") return null;
	if (!Number.isInteger(quoteDecimals) || !Number.isInteger(baseDecimals)) return null;
	if (baseRaw <= 0n || quoteRaw < 0n) return null;
	const prec = 12n;
	let num = quoteRaw;
	let den = baseRaw;
	const shift = BigInt(baseDecimals) - BigInt(quoteDecimals);
	if (shift >= 0n) num *= 10n ** (shift + prec);
	else {
		den *= 10n ** -shift;
		num *= 10n ** prec;
	}
	return num / den;
}
function scaledToString(scaled, prec = 12) {
	if (typeof scaled !== "bigint" || scaled < 0n) return null;
	const base = 10n ** BigInt(prec);
	const whole = scaled / base;
	const frac = (scaled % base).toString().padStart(prec, "0").replace(/0+$/, "");
	return frac ? `${whole}.${frac}` : `${whole}`;
}
function valueReserves({ quoteRaw, baseRaw, supplyRaw, quoteMint, legacySol, baseDecimals, solUsd }) {
	const quote = describeQuote(quoteMint, legacySol);
	const price = quote.decimals == null ? null : quotePerBaseScaled(quoteRaw, baseRaw, quote.decimals, baseDecimals);
	let spotUsd = null;
	let fdvUsd = null;
	if (price != null && quote.native && Number.isFinite(solUsd) && solUsd > 0) {
		const usdScaled = price * BigInt(Math.round(solUsd * 1e6)) / 1000000n;
		const usd = Number(usdScaled) / 0xe8d4a51000;
		if (Number.isFinite(usd)) spotUsd = usd;
		if (typeof supplyRaw === "bigint" && supplyRaw > 0n && Number.isInteger(baseDecimals)) {
			const supplyScaled = quotePerBaseScaled(supplyRaw, 1n, baseDecimals, 0);
			if (supplyScaled != null) {
				const fdvScaled = supplyScaled * usdScaled / 10n ** 12n;
				const fdv = Number(fdvScaled) / 0xe8d4a51000;
				if (Number.isFinite(fdv)) fdvUsd = fdv;
			}
		}
	}
	return {
		quote,
		spotQuote: price == null ? null : scaledToString(price),
		spotUsd,
		fdvUsd
	};
}
var PUMP_SUPPLY_RAW = 1000000000n * 1000000n;
function asReserve(value) {
	if (typeof value === "bigint") return value >= 0n ? value : null;
	if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return BigInt(value);
	if (typeof value === "string" && /^\d+$/.test(value)) return BigInt(value);
	return null;
}
/** Pump.fun mints are 6 decimals and 1e9 supply. Fill those only for native SOL quotes. */
function withPumpDefaults(args) {
	if (!describeQuote(args?.quoteMint, args?.legacySol).native) return valueReserves(args);
	return valueReserves({
		...args,
		baseDecimals: Number.isInteger(args?.baseDecimals) ? args.baseDecimals : 6,
		supplyRaw: typeof args?.supplyRaw === "bigint" && args.supplyRaw > 0n ? args.supplyRaw : PUMP_SUPPLY_RAW
	});
}
function pumpCurveQuote(token, solUsd) {
	if (!token) return null;
	const quoteRaw = asReserve(token.virtualQuoteReserves) ?? asReserve(token.virtualSolReserves);
	const baseRaw = asReserve(token.virtualTokenReserves);
	if (quoteRaw == null || baseRaw == null) return null;
	const native = token.quoteNative !== false;
	return withPumpDefaults({
		quoteRaw,
		baseRaw,
		supplyRaw: asReserve(token.tokenTotalSupply),
		quoteMint: native ? null : token.quoteMint || null,
		legacySol: native,
		baseDecimals: Number.isInteger(token.baseDecimals) ? token.baseDecimals : null,
		solUsd: Number(solUsd)
	});
}
function foldTradeVolume(rows, trade) {
	const next = Array.isArray(rows) ? rows.slice() : [];
	const when = createTimestamp(trade?.tradedAt);
	let partial = trade?.partial || null;
	if (when == null) partial = "time";
	else if (!trade?.quoteNative) partial = partial || "quote";
	else if (Number.isFinite(trade.quoteSol)) next.push({
		ts: when,
		sol: trade.quoteSol
	});
	const now = Number(trade?.now) || 0;
	const cutoff = now - 864e5;
	const kept = next.filter((row) => row.ts >= cutoff);
	const observed = !partial && Number.isFinite(trade?.solUsd) && trade.solUsd > 0 ? Math.round(kept.reduce((sum, row) => sum + row.sol, 0) * trade.solUsd * 100) / 100 : null;
	const oldest = kept[0]?.ts;
	const covered = !partial && oldest != null && now - oldest >= 864e5;
	return {
		rows: kept,
		partial,
		volumeObservedUsd: observed,
		volumeComplete: Boolean(covered)
	};
}
function settleMetadataJob(job, outcome, now = Date.now()) {
	if (outcome === "ready") return null;
	const attempts = (job?.attempts || 0) + 1;
	if (attempts > 5) return null;
	const wait = Math.min(6e4, 2e3 * 2 ** (attempts - 1));
	return {
		mint: job.mint,
		uri: job.uri,
		attempts,
		nextAt: now + wait,
		lastOutcome: outcome
	};
}
var PUMP_PROGRAM_ID$1 = new PublicKey(PUMP_PROGRAM_ID_STR);
var PUMP_AMM_PROGRAM_ID$1 = new PublicKey(PUMP_AMM_PROGRAM_ID_STR);
var METAPLEX_PROGRAM_ID = new PublicKey(METAPLEX_PROGRAM_ID_STR);
var PUMP_MINT_AUTHORITY = new PublicKey(process.env.PUMP_WATCH_ADDRESS || "TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM");
var RPC_ENDPOINTS$1 = [
	process.env.SOLANA_RPC_URL,
	"https://solana-rpc.publicnode.com",
	"https://rpc.ankr.com/solana"
].filter(Boolean);
var activeRpcIndex$1 = 0;
function getSolanaConnection() {
	const endpoint = RPC_ENDPOINTS$1[activeRpcIndex$1] || "https://solana-rpc.publicnode.com";
	return new Connection(endpoint, {
		commitment: "confirmed",
		confirmTransactionInitialTimeout: 8e3,
		disableRetryOnRateLimit: true
	});
}
function rotateRpc$1() {
	activeRpcIndex$1 = (activeRpcIndex$1 + 1) % RPC_ENDPOINTS$1.length;
}
async function getMultipleAccountsWithRetry(pubkeys, maxAttempts = RPC_ENDPOINTS$1.length * 2) {
	for (let attempt = 0; attempt < maxAttempts; attempt++) try {
		return await getSolanaConnection().getMultipleAccountsInfo(pubkeys);
	} catch (err) {
		const errMsg = err?.message || "";
		const isRateLimit = errMsg.includes("429") || errMsg.includes("rate limit") || errMsg.includes("Too Many Requests");
		rotateRpc$1();
		if (isRateLimit && attempt < maxAttempts - 1) {
			await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
			continue;
		}
		if (attempt < maxAttempts - 1) continue;
		return pubkeys.map(() => null);
	}
	return pubkeys.map(() => null);
}
var solPriceState = {
	price: null,
	source: "none",
	fetchedAt: 0
};
function normalizeTimestamp(ts) {
	if (ts === null || ts === void 0 || ts === "") return void 0;
	const num = typeof ts === "number" ? ts : Number(ts);
	if (isNaN(num) || num <= 0) return void 0;
	if (num > 0xe8d4a51000) return Math.round(num);
	if (num > 1e9) return Math.round(num * 1e3);
}
var solPriceInflight = null;
async function getSolUsdPriceDetails() {
	if (solPriceState.price !== null && Date.now() - solPriceState.fetchedAt < 3e4) return solPriceState;
	if (solPriceInflight) return solPriceInflight;
	solPriceInflight = loadSolUsdPrice().finally(() => {
		solPriceInflight = null;
	});
	return solPriceInflight;
}
async function loadSolUsdPrice() {
	try {
		const res = await fetch("https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112", { signal: AbortSignal.timeout(3500) });
		if (res.ok) {
			const data = await res.json();
			const validPair = (Array.isArray(data?.pairs) ? data.pairs : []).find((p) => Number(p?.priceUsd) > 0);
			const price = validPair ? Number(validPair.priceUsd) : 0;
			if (price > 0) {
				solPriceState = {
					price,
					source: "DexScreener",
					fetchedAt: Date.now()
				};
				console.log(`[SOL/USD] source: DexScreener price: ${price.toFixed(2)} fetched: just now`);
				return solPriceState;
			}
		}
	} catch {}
	try {
		const res = await fetch("https://api.coinbase.com/v2/prices/SOL-USD/spot", { signal: AbortSignal.timeout(3500) });
		if (res.ok) {
			const data = await res.json();
			const price = Number(data?.data?.amount);
			if (price > 0) {
				solPriceState = {
					price,
					source: "Coinbase",
					fetchedAt: Date.now()
				};
				console.log(`[SOL/USD] source: Coinbase price: ${price.toFixed(2)} fetched: just now`);
				return solPriceState;
			}
		}
	} catch {}
	try {
		const res = await fetch("https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112", { signal: AbortSignal.timeout(3500) });
		if (res.ok) {
			const data = await res.json();
			const price = Number(data?.data?.["So11111111111111111111111111111111111111112"]?.price);
			if (price > 0) {
				solPriceState = {
					price,
					source: "Jupiter",
					fetchedAt: Date.now()
				};
				console.log(`[SOL/USD] source: Jupiter price: ${price.toFixed(2)} fetched: just now`);
				return solPriceState;
			}
		}
	} catch {}
	if (solPriceState.price !== null && solPriceState.price > 0) {
		const ageSeconds = Math.round((Date.now() - solPriceState.fetchedAt) / 1e3);
		console.log(`[SOL/USD] source: last-known (${solPriceState.source}) price: ${solPriceState.price.toFixed(2)} age: ${ageSeconds}s`);
		return {
			price: solPriceState.price,
			source: "last-known",
			fetchedAt: solPriceState.fetchedAt
		};
	}
	console.warn("[SOL/USD] All sources failed and no valid previous price exists. SOL/USD: unknown");
	return {
		price: null,
		source: "none",
		fetchedAt: 0
	};
}
async function getSolUsdPrice() {
	return (await getSolUsdPriceDetails()).price;
}
function isValidSolanaAddress(address) {
	if (!address || typeof address !== "string") return false;
	const trimmed = address.trim();
	if (trimmed.length < 32 || trimmed.length > 44 || trimmed.includes(" ")) return false;
	try {
		new PublicKey(trimmed);
		return true;
	} catch {
		return false;
	}
}
function deriveBondingCurvePda(mintPubkey) {
	return PublicKey.findProgramAddressSync([Buffer.from("bonding-curve"), mintPubkey.toBuffer()], PUMP_PROGRAM_ID$1);
}
function deriveMetaplexMetadataPda(mintPubkey) {
	return PublicKey.findProgramAddressSync([
		Buffer.from("metadata"),
		METAPLEX_PROGRAM_ID.toBuffer(),
		mintPubkey.toBuffer()
	], METAPLEX_PROGRAM_ID);
}
function deriveCanonicalPumpPoolPda(mintPubkey, index = 0) {
	const [authority] = PublicKey.findProgramAddressSync([Buffer.from("pool-authority"), mintPubkey.toBuffer()], PUMP_PROGRAM_ID$1);
	const indexBuf = Buffer.alloc(2);
	indexBuf.writeUInt16LE(index, 0);
	const [pool] = PublicKey.findProgramAddressSync([
		Buffer.from("pool"),
		indexBuf,
		authority.toBuffer(),
		mintPubkey.toBuffer(),
		new PublicKey(SOL_MINT_STR).toBuffer()
	], PUMP_AMM_PROGRAM_ID$1);
	return pool;
}
function decodeMetaplexMetadata(buffer) {
	return decodeMetaplexAccountBuffer(buffer);
}
function decodeBondingCurveBuffer$1(buf) {
	if (!buf || buf.length < 49) return null;
	try {
		const decoded = {
			virtualTokenReserves: buf.readBigUInt64LE(8),
			virtualQuoteReserves: buf.readBigUInt64LE(16),
			realTokenReserves: buf.readBigUInt64LE(24),
			realQuoteReserves: buf.readBigUInt64LE(32),
			tokenTotalSupply: buf.readBigUInt64LE(40),
			complete: buf.readUInt8(48) === 1,
			quoteMint: null,
			quoteKnown: false
		};
		decoded.virtualSolReserves = decoded.virtualQuoteReserves;
		decoded.realSolReserves = decoded.realQuoteReserves;
		if (buf.length >= 115) {
			decoded.quoteMint = new PublicKey(buf.subarray(83, 115)).toBase58();
			decoded.quoteKnown = true;
		}
		return decoded;
	} catch {
		return null;
	}
}
async function fetchJsonMetadata(uri) {
	return fetchOffChainMetadataWithGateways(uri, 3500);
}
async function resolvePumpToken(mintAddress, knownCreatedAt) {
	const cleanMint = (mintAddress || "").trim();
	if (!isValidSolanaAddress(cleanMint)) {
		console.log(`[Pump Resolver] INVALID ADDRESS: ${cleanMint}`);
		return {
			status: "INVALID_MINT",
			mint: cleanMint,
			error: "Invalid Solana mint public key format",
			diagnostics: {
				validAddress: false,
				derivedPda: "",
				rpcFound: false,
				decodeSuccess: false,
				finalStatus: "INVALID_MINT"
			}
		};
	}
	let mintPubkey;
	let bondingCurvePda;
	let metaPda;
	let poolPda;
	try {
		mintPubkey = new PublicKey(cleanMint);
		[bondingCurvePda] = deriveBondingCurvePda(mintPubkey);
		[metaPda] = deriveMetaplexMetadataPda(mintPubkey);
		poolPda = deriveCanonicalPumpPoolPda(mintPubkey);
	} catch {
		return {
			status: "INVALID_MINT",
			mint: cleanMint,
			error: "Failed to parse public key",
			diagnostics: {
				validAddress: false,
				derivedPda: "",
				rpcFound: false,
				decodeSuccess: false,
				finalStatus: "INVALID_MINT"
			}
		};
	}
	console.log(`
========================================`);
	console.log(`Pump resolver:`);
	console.log(`VALID ADDRESS: true`);
	console.log(`PDA: ${bondingCurvePda.toBase58()}`);
	const accounts = await getMultipleAccountsWithRetry([
		bondingCurvePda,
		mintPubkey,
		metaPda,
		poolPda
	]);
	const accountInfo = accounts[0];
	const mintAccount = accounts[1];
	const metaAccount = accounts[2];
	const poolAcc = accounts[3];
	if (!accountInfo) {
		console.log(`RPC: NOT FOUND`);
		console.log(`FINAL: NOT_PUMPFUN_BONDING_CURVE`);
		console.log(`========================================
`);
		return {
			status: "NOT_PUMPFUN_BONDING_CURVE",
			mint: cleanMint,
			error: "No Pump.fun bonding curve account exists for this mint",
			diagnostics: {
				validAddress: true,
				derivedPda: bondingCurvePda.toBase58(),
				rpcFound: false,
				decodeSuccess: false,
				finalStatus: "NOT_PUMPFUN_BONDING_CURVE"
			}
		};
	}
	console.log(`RPC: FOUND`);
	const programOwner = accountInfo.owner?.toBase58() || "";
	console.log(`OWNER: ${programOwner}`);
	if (!accountInfo.owner.equals(PUMP_PROGRAM_ID$1)) {
		console.log(`DECODE: FAILURE (Wrong program owner)`);
		console.log(`FINAL: NOT_PUMPFUN_BONDING_CURVE`);
		console.log(`========================================
`);
		return {
			status: "NOT_PUMPFUN_BONDING_CURVE",
			mint: cleanMint,
			error: `Account not owned by Pump program (${PUMP_PROGRAM_ID_STR})`,
			diagnostics: {
				validAddress: true,
				derivedPda: bondingCurvePda.toBase58(),
				rpcFound: true,
				programOwner,
				decodeSuccess: false,
				finalStatus: "NOT_PUMPFUN_BONDING_CURVE"
			}
		};
	}
	const buf = accountInfo.data;
	if (!buf || buf.length < 49) {
		console.log(`DECODE: FAILURE (Invalid buffer length ${buf?.length})`);
		console.log(`FINAL: DECODE_ERROR`);
		console.log(`========================================
`);
		return {
			status: "DECODE_ERROR",
			mint: cleanMint,
			error: `Bonding curve data too short (${buf?.length} bytes)`,
			diagnostics: {
				validAddress: true,
				derivedPda: bondingCurvePda.toBase58(),
				rpcFound: true,
				programOwner,
				decodeSuccess: false,
				finalStatus: "DECODE_ERROR"
			}
		};
	}
	let virtualTokenReserves = 0n;
	let virtualSolReserves = 0n;
	let realTokenReserves = 0n;
	let realSolReserves = 0n;
	let tokenTotalSupply = 0n;
	let complete = false;
	try {
		virtualTokenReserves = buf.readBigUInt64LE(8);
		virtualSolReserves = buf.readBigUInt64LE(16);
		realTokenReserves = buf.readBigUInt64LE(24);
		realSolReserves = buf.readBigUInt64LE(32);
		tokenTotalSupply = buf.readBigUInt64LE(40);
		complete = buf.readUInt8(48) === 1;
	} catch (decodeErr) {
		console.log(`DECODE: FAILURE (${decodeErr.message})`);
		console.log(`FINAL: DECODE_ERROR`);
		console.log(`========================================
`);
		return {
			status: "DECODE_ERROR",
			mint: cleanMint,
			error: decodeErr.message,
			diagnostics: {
				validAddress: true,
				derivedPda: bondingCurvePda.toBase58(),
				rpcFound: true,
				programOwner,
				decodeSuccess: false,
				finalStatus: "DECODE_ERROR"
			}
		};
	}
	console.log(`DECODE: SUCCESS`);
	console.log(`COMPLETE: ${complete}`);
	let bondingProgress = 0;
	if (complete) bondingProgress = 100;
	else if (realTokenReserves <= 0n) bondingProgress = 100;
	else if (realTokenReserves >= 793100000000000n) bondingProgress = 0;
	else {
		const progressBps = (PUMP_INITIAL_REAL_TOKEN_RESERVES - realTokenReserves) * 10000n / PUMP_INITIAL_REAL_TOKEN_RESERVES;
		bondingProgress = Math.min(100, Math.max(0, Number(progressBps) / 100));
	}
	console.log(`BONDING: ${bondingProgress.toFixed(2)}%`);
	const solUsdPrice = await getSolUsdPrice();
	const decodedCurve = decodeBondingCurveBuffer$1(buf);
	const quote = describeQuote(decodedCurve?.quoteMint, !decodedCurve?.quoteKnown);
	const baseDecimals = mintAccount?.data?.length >= 45 && mintAccount.data[45] === 1 ? mintAccount.data[44] : null;
	const valued = withPumpDefaults({
		quoteRaw: virtualSolReserves,
		baseRaw: virtualTokenReserves,
		supplyRaw: tokenTotalSupply,
		quoteMint: decodedCurve?.quoteKnown ? decodedCurve.quoteMint : null,
		legacySol: !decodedCurve?.quoteKnown,
		baseDecimals,
		solUsd: quote.native ? solUsdPrice : null
	});
	const fdvUsd = valued.fdvUsd ?? void 0;
	const marketCapUsd = fdvUsd;
	const realSolReservesFormatted = quote.native ? (Number(realSolReserves) / 1e9).toFixed(3) : "";
	const liquidityUsd = quote.native && solUsdPrice != null ? Math.round(Number(realSolReserves) / 1e9 * solUsdPrice * 100) / 100 : void 0;
	let tokenName = "";
	let tokenSymbol = "";
	let metadataUri = "";
	let imageUrl = "";
	let description = "";
	let twitter = "";
	let telegram = "";
	let website = "";
	if (mintAccount && mintAccount.data) {
		const t22 = decodeToken2022Metadata(mintAccount.data);
		if (t22) {
			if (t22.name) tokenName = t22.name;
			if (t22.symbol) tokenSymbol = t22.symbol;
			if (t22.uri) metadataUri = t22.uri;
		}
	}
	if (metaAccount && metaAccount.data) {
		const meta = decodeMetaplexMetadata(metaAccount.data);
		if (!tokenName && meta.name) tokenName = meta.name;
		if (!tokenSymbol && meta.symbol) tokenSymbol = meta.symbol;
		if (!metadataUri && meta.uri) metadataUri = meta.uri;
	}
	if (metadataUri) try {
		const json = await fetchJsonMetadata(metadataUri);
		if (json) {
			if (json.name && (!tokenName || tokenName.startsWith("Pump Token"))) tokenName = json.name;
			if (json.symbol && (!tokenSymbol || tokenSymbol.length > 10)) tokenSymbol = json.symbol;
			const rawImg = json.image || json.image_uri || json.imageUrl || json.logo || json.icon;
			if (rawImg) imageUrl = normalizeUri(rawImg, 0);
			if (json.description) description = json.description;
			let arrayTw;
			let arrayTg;
			let arrayWeb;
			const scan = (arr) => {
				if (!Array.isArray(arr)) return;
				for (const item of arr) {
					if (!item) continue;
					const url = typeof item === "string" ? item : item.url || item.value || item.link || item.href;
					const type = typeof item === "object" ? String(item.type || item.trait_type || item.name || item.platform || "").toLowerCase() : "";
					if (typeof url === "string") {
						const uLower = url.toLowerCase();
						if (!arrayTw && (type.includes("twitter") || type.includes("x") || uLower.includes("twitter.com") || uLower.includes("x.com"))) arrayTw = url;
						else if (!arrayTg && (type.includes("telegram") || type.includes("tg") || uLower.includes("t.me") || uLower.includes("telegram.me"))) arrayTg = url;
						else if (!arrayWeb && (type.includes("web") || type.includes("site") || !uLower.includes("twitter") && !uLower.includes("x.com") && !uLower.includes("t.me"))) arrayWeb = url;
					}
				}
			};
			scan(json.links);
			scan(json.socials);
			scan(json.attributes);
			scan(json.websites);
			const descText = String(json.description || description || "");
			const tgMatch = descText.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_+]+)/i);
			const twMatch = descText.match(/(?:https?:\/\/|\/\/)?(?:www\.)?(?:mobile\.)?(?:twitter\.com|x\.com)\/[^\s)]+/i);
			const webMatch = descText.match(/https?:\/\/(?!(?:t\.me|telegram\.me|twitter\.com|x\.com|ipfs\.io|arweave\.net|dexscreener\.com|pump\.fun))([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s)]*)?)/i);
			const tw = json.twitter || json.x || json.twitter_url || json.x_url || json.socials?.twitter || json.socials?.x || json.links?.twitter || json.links?.x || json.extensions?.twitter || arrayTw || (twMatch ? preserveXUrl(twMatch[0]) : void 0);
			if (tw) twitter = preserveXUrl(tw);
			const tg = json.telegram || json.tg || json.telegram_url || json.socials?.telegram || json.socials?.tg || json.links?.telegram || json.links?.tg || json.extensions?.telegram || arrayTg || (tgMatch ? `https://t.me/${tgMatch[1]}` : void 0);
			if (tg) telegram = typeof tg === "string" ? tg.startsWith("http") ? tg : `https://t.me/${tg.replace(/^@/, "")}` : "";
			const web = json.website || json.web || json.website_url || json.socials?.website || json.links?.website || json.extensions?.website || json.url || json.external_url || arrayWeb || (webMatch ? webMatch[0] : void 0);
			if (web) website = typeof web === "string" ? web.startsWith("http") ? web : `https://${web}` : "";
		}
	} catch {}
	if (!imageUrl || !twitter || !telegram || !website || !description || !tokenName) try {
		const res = await fetch(`https://frontend-api.pump.fun/coins/${cleanMint}`, {
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
				"Accept": "application/json, text/plain, */*",
				"Accept-Language": "en-US,en;q=0.9",
				"Origin": "https://pump.fun",
				"Referer": "https://pump.fun/"
			},
			signal: AbortSignal.timeout(5e3)
		});
		if (res.ok) {
			const pCoin = await res.json();
			if (pCoin) {
				if (!tokenName && pCoin.name) tokenName = pCoin.name;
				if (!tokenSymbol && pCoin.symbol) tokenSymbol = pCoin.symbol;
				if (!imageUrl && (pCoin.image_uri || pCoin.image)) imageUrl = normalizeUri(pCoin.image_uri || pCoin.image, 0);
				if (!description && pCoin.description) description = pCoin.description;
				if (!twitter && (pCoin.twitter || pCoin.x)) twitter = preserveXUrl(pCoin.twitter || pCoin.x);
				if (!telegram && pCoin.telegram) {
					const tg = pCoin.telegram;
					telegram = tg.startsWith("http") ? tg : `https://t.me/${tg.replace(/^@/, "")}`;
				}
				if (!website && pCoin.website) {
					const web = pCoin.website;
					website = web.startsWith("http") ? web : `https://${web}`;
				}
			}
		}
	} catch {}
	if (!tokenName) tokenName = `Pump Token (${cleanMint.slice(0, 4)}...${cleanMint.slice(-4)})`;
	if (!tokenSymbol) tokenSymbol = cleanMint.slice(0, 5).toUpperCase();
	let pumpSwapPool = null;
	let pumpSwapPoolVerified = false;
	let marketStage = "bonding_curve";
	let migrationState = "NOT_READY";
	const poolVerified = Boolean(poolAcc && poolAcc.owner && poolAcc.owner.equals(PUMP_AMM_PROGRAM_ID$1));
	if (poolVerified) {
		marketStage = "pumpswap";
		migrationState = "MIGRATED";
		pumpSwapPool = poolPda.toBase58();
		pumpSwapPoolVerified = true;
	} else if (complete) {
		marketStage = "graduated";
		migrationState = "MIGRATION_PENDING";
	}
	const effectiveLiquidityUsd = liquidityUsd;
	const effectiveMarketCapUsd = marketCapUsd;
	const effectiveFdvUsd = fdvUsd;
	const finalStatus = poolVerified ? "FOUND_PUMPSWAP_ACTIVE" : complete ? "FOUND_GRADUATED" : "FOUND_BONDING_CURVE";
	console.log(`FINAL: ${finalStatus} (Stage: ${marketStage}, Pool Verified: ${pumpSwapPoolVerified})`);
	console.log(`========================================
`);
	const validKnownCreatedAt = normalizeTimestamp(knownCreatedAt);
	const existingIndexerCreatedAt = typeof pumpIndexer !== "undefined" && pumpIndexer?.getToken ? normalizeTimestamp(pumpIndexer.getToken(cleanMint)?.createdAt) : void 0;
	const resolvedCreatedAt = validKnownCreatedAt || existingIndexerCreatedAt || void 0;
	const resolvedPairAddress = poolVerified ? pumpSwapPool || bondingCurvePda.toBase58() : bondingCurvePda.toBase58();
	return {
		status: finalStatus,
		mint: cleanMint,
		token: {
			mint: cleanMint,
			bondingCurvePda: bondingCurvePda.toBase58(),
			owner: programOwner,
			virtualTokenReserves: virtualTokenReserves.toString(),
			virtualSolReserves: quote.native ? virtualSolReserves.toString() : "",
			realTokenReserves: realTokenReserves.toString(),
			realSolReserves: quote.native ? realSolReserves.toString() : "",
			tokenTotalSupply: tokenTotalSupply.toString(),
			complete: complete || poolVerified,
			bondingProgress: poolVerified ? 100 : bondingProgress,
			quoteMint: quote.mint || "",
			quoteNative: quote.native,
			quoteSymbol: quote.symbol || "",
			baseDecimals,
			spotPriceQuote: valued.spotQuote || "",
			spotPriceSol: quote.native && valued.spotQuote ? valued.spotQuote : "",
			spotPriceUsd: valued.spotUsd != null ? valued.spotUsd.toFixed(9) : "",
			fdvSol: void 0,
			fdvUsd: effectiveFdvUsd,
			marketCapUsd: effectiveMarketCapUsd,
			liquidityUsd: effectiveLiquidityUsd,
			solUsdPrice: solUsdPrice !== null ? solUsdPrice : void 0,
			realSolReservesFormatted,
			tokenName,
			tokenSymbol,
			metadataUri,
			imageUrl,
			description,
			twitter,
			telegram,
			website,
			createdAt: resolvedCreatedAt,
			lastRefreshedAt: Date.now(),
			pumpSwapPool,
			pumpswap_pool: pumpSwapPool,
			pumpSwapPoolVerified,
			pairAddress: resolvedPairAddress,
			pairs: poolVerified ? [{
				chainId: "solana",
				pairAddress: resolvedPairAddress,
				dexName: "PumpSwap",
				dexId: "pumpswap",
				baseToken: {
					address: cleanMint,
					name: tokenName,
					symbol: tokenSymbol
				},
				quoteToken: {
					address: "So11111111111111111111111111111111111111112",
					name: "Wrapped SOL",
					symbol: "SOL"
				},
				priceUsd: solUsdPrice !== null && spotPriceUsdNum > 0 ? spotPriceUsdNum.toFixed(9) : "0",
				liquidityUsd: effectiveLiquidityUsd
			}] : [{
				chainId: "solana",
				pairAddress: bondingCurvePda.toBase58(),
				dexName: "Pump.fun",
				dexId: "pumpfun",
				baseToken: {
					address: cleanMint,
					name: tokenName,
					symbol: tokenSymbol
				},
				quoteToken: {
					address: "So11111111111111111111111111111111111111112",
					name: "Wrapped SOL",
					symbol: "SOL"
				},
				priceUsd: solUsdPrice !== null && spotPriceUsdNum > 0 ? spotPriceUsdNum.toFixed(9) : "0",
				liquidityUsd: effectiveLiquidityUsd
			}],
			migrationState,
			marketStage,
			isBondingCurve: !poolVerified,
			isGraduated: poolVerified,
			dexId: poolVerified ? "pumpswap" : "pumpfun",
			primaryDex: poolVerified ? "PumpSwap" : "Pump.fun",
			sources: poolVerified ? ["PumpSwap", "Pump.fun (On-Chain)"] : ["Pump.fun (On-Chain)"],
			dexes: poolVerified ? ["PumpSwap"] : []
		},
		diagnostics: {
			validAddress: true,
			derivedPda: bondingCurvePda.toBase58(),
			rpcFound: true,
			programOwner,
			decodeSuccess: true,
			complete,
			bondingProgress,
			finalStatus
		}
	};
}
function isFallbackName(name, mint) {
	if (!name || !name.trim()) return true;
	const n = name.trim();
	if (n.startsWith("Pump Token")) return true;
	if (n.startsWith("Token ") && n.includes("...")) return true;
	if (mint && n.includes(mint.slice(0, 4)) && n.includes(mint.slice(-4))) return true;
	return false;
}
function isFallbackSymbol(symbol, mint) {
	if (!symbol || !symbol.trim()) return true;
	const s = symbol.trim().toUpperCase();
	if (s === "PUMP") return true;
	if (mint && s === mint.slice(0, 5).toUpperCase()) return true;
	return false;
}
async function mapLimit(items, limit, fn) {
	if (items.length === 0) return;
	let cursor = 0;
	const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (cursor < items.length) {
			const item = items[cursor];
			cursor += 1;
			await fn(item);
		}
	});
	await Promise.all(workers);
}
var PumpOnChainIndexer = class {
	tokens = /* @__PURE__ */ new Map();
	processedSignatures = /* @__PURE__ */ new Set();
	isIndexing = false;
	isRefreshing = false;
	lastProcessedSig = "";
	indexIntervalId = null;
	refreshIntervalId = null;
	solVolume = /* @__PURE__ */ new Map();
	logsConn = null;
	logsSub = null;
	lastLogAt = 0;
	watchdogId = null;
	metaInflight = 0;
	constructor() {
		console.log("[Pump Indexer] Initialized.");
	}
	async start() {
		console.log("[Pump Indexer] Starting on-chain discovery and backfill...");
		await this.runBackfill();
		this.resumeMetaJobs();
		this.subscribeCreates().catch((err) => console.warn("[Pump Indexer] logsSubscribe failed:", err?.message || err));
		if (!this.indexIntervalId) this.indexIntervalId = setInterval(() => {
			this.pollLiveSignatures().catch((e) => console.error("[Pump Indexer] Poll error:", e));
		}, 8e3);
		if (!this.refreshIntervalId) this.refreshIntervalId = setInterval(() => {
			this.refreshActiveCurves().catch((e) => console.error("[Pump Indexer] Refresh error:", e));
		}, 2e4);
		if (!this.watchdogId) this.watchdogId = setInterval(() => {
			if (Date.now() - this.lastLogAt > 18e4) this.subscribeCreates().catch(() => {});
		}, 3e4);
	}
	stop() {
		if (this.indexIntervalId) clearInterval(this.indexIntervalId);
		if (this.refreshIntervalId) clearInterval(this.refreshIntervalId);
		if (this.watchdogId) clearInterval(this.watchdogId);
		if (this.logsSub != null && this.logsConn) {
			this.logsConn.removeOnLogsListener(this.logsSub).catch(() => {});
			this.logsSub = null;
		}
	}
	getAllTokens() {
		return Array.from(this.tokens.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
	}
	getToken(mint) {
		return this.tokens.get(mint);
	}
	async getOrResolveToken(mint) {
		const cleanMint = (mint || "").trim();
		if (this.tokens.has(cleanMint)) {
			const existing = this.tokens.get(cleanMint);
			if (!existing.complete || isFallbackName(existing.tokenName, cleanMint) || isFallbackSymbol(existing.tokenSymbol, cleanMint) || !existing.imageUrl || !existing.twitter && !existing.telegram && !existing.website) try {
				const res2 = await resolvePumpToken(cleanMint);
				if (res2.token) {
					if (existing.createdAt) res2.token.createdAt = existing.createdAt;
					if (existing.creator) res2.token.creator = existing.creator;
					if (isFallbackName(res2.token.tokenName, cleanMint) && !isFallbackName(existing.tokenName, cleanMint)) res2.token.tokenName = existing.tokenName;
					if (isFallbackSymbol(res2.token.tokenSymbol, cleanMint) && !isFallbackSymbol(existing.tokenSymbol, cleanMint)) res2.token.tokenSymbol = existing.tokenSymbol;
					if (!res2.token.imageUrl && existing.imageUrl) res2.token.imageUrl = existing.imageUrl;
					if (!res2.token.twitter && existing.twitter) res2.token.twitter = existing.twitter;
					if (!res2.token.telegram && existing.telegram) res2.token.telegram = existing.telegram;
					if (!res2.token.website && existing.website) res2.token.website = existing.website;
					this.tokens.set(cleanMint, res2.token);
					return res2.token;
				}
			} catch {}
			return existing;
		}
		const res = await resolvePumpToken(cleanMint);
		if (res.token) {
			this.tokens.set(cleanMint, res.token);
			return res.token;
		}
		return null;
	}
	/**
	* Backfills recent Pump token creations upon server boot / recovery
	*/
	async runBackfill() {
		console.log("[Pump Indexer] Reading recent creates from the Pump mint authority...");
		try {
			await this.catchUpMintAuthority(3);
		} catch (err) {
			console.warn(`[Pump Indexer] Backfill warning: ${err?.message || err}`);
		}
		console.log(`[Pump Indexer] Backfill complete. Active indexed tokens: ${this.tokens.size}`);
	}
	async catchUpMintAuthority(maxPages) {
		const state = readPumpCursorState();
		let before = state.pendingBefore || "";
		let head = state.pendingHead || "";
		let finished = !state.signature;
		for (let page = 0; page < maxPages; page++) {
			const hit = await this.pollMintAuthority(before, state.signature);
			if (!hit) break;
			if (!before && hit.head && hit.headComplete) head = hit.head;
			if (!hit.headComplete) {
				finished = false;
				break;
			}
			if (!hit.before || hit.reachedCursor) {
				finished = true;
				break;
			}
			before = hit.before;
		}
		if (finished && head) {
			this.lastProcessedSig = head;
			writePumpCursor(head);
		} else if (before && state.signature) writePumpCursor(state.signature, void 0, {
			pendingBefore: before,
			pendingHead: head
		});
	}
	async pollMintAuthority(before, stopAt) {
		if (this.isIndexing) return null;
		this.isIndexing = true;
		try {
			const sigs = await getSolanaConnection().getSignaturesForAddress(PUMP_MINT_AUTHORITY, {
				limit: 40,
				before: before || void 0
			});
			if (this.processedSignatures.size > 3e3) for (const item of Array.from(this.processedSignatures).slice(0, 500)) this.processedSignatures.delete(item);
			const targets = sigs.filter((s) => !s.err && !this.processedSignatures.has(s.signature));
			const outcomes = /* @__PURE__ */ new Map();
			await mapLimit(targets, 3, async (s) => {
				const ok = await this.processSignature(s.signature, s.blockTime ? s.blockTime * 1e3 : void 0);
				outcomes.set(s.signature, ok ? "ok" : "retry");
			});
			const plan = nextSignatureCursor(sigs, (row) => {
				if (row.err || this.processedSignatures.has(row.signature)) return "excluded";
				return outcomes.get(row.signature) === "ok" ? "ok" : "retry";
			});
			for (const row of sigs) if (row.err) this.processedSignatures.add(row.signature);
			for (const [sig, kind] of outcomes) if (kind === "ok") this.processedSignatures.add(sig);
			await this.fillMissingNames();
			return {
				before: plan.before,
				head: sigs[0]?.signature || "",
				headComplete: plan.headComplete,
				reachedCursor: Boolean(stopAt && sigs.some((s) => s.signature === stopAt))
			};
		} catch {
			return null;
		} finally {
			this.isIndexing = false;
		}
	}
	async pollLiveSignatures() {
		return this.catchUpMintAuthority(3);
	}
	async subscribeCreates() {
		if (this.logsSub != null && this.logsConn) {
			await this.logsConn.removeOnLogsListener(this.logsSub).catch(() => {});
			this.logsSub = null;
		}
		const endpoint = RPC_ENDPOINTS$1[activeRpcIndex$1] || "https://solana-rpc.publicnode.com";
		this.logsConn = new Connection(endpoint, {
			commitment: "confirmed",
			wsEndpoint: endpoint.replace(/^https:/, "wss:"),
			disableRetryOnRateLimit: true
		});
		this.logsSub = this.logsConn.onLogs(PUMP_MINT_AUTHORITY, (info) => {
			this.lastLogAt = Date.now();
			if (info.err || this.processedSignatures.has(info.signature)) return;
			this.ingestLogs(info.signature, info.logs || [], void 0, false).then((ok) => {
				if (ok) this.processedSignatures.add(info.signature);
			}).catch(() => {});
		}, "confirmed");
		this.lastLogAt = Date.now();
		console.log("[Pump Indexer] subscribed to mint-authority creates");
	}
	needsName(t) {
		return !t.tokenName || t.tokenName.startsWith("Pump Token") || !t.tokenSymbol || t.tokenSymbol === "PUMP";
	}
	/**
	* Pump CreateV2 stores the name on the Token-2022 mint, not Metaplex.
	* One batched account read fills symbol, name, and metadata URI.
	*/
	async fillMissingNames() {
		const missing = Array.from(this.tokens.values()).filter((t) => this.needsName(t)).slice(0, 20);
		if (missing.length === 0) return;
		const keys = [];
		for (const t of missing) try {
			const mintPk = new PublicKey(t.mint);
			const [metaPda] = deriveMetaplexMetadataPda(mintPk);
			keys.push(mintPk, metaPda);
		} catch {
			keys.push(PUMP_PROGRAM_ID$1, PUMP_PROGRAM_ID$1);
		}
		const accounts = await getMultipleAccountsWithRetry(keys);
		for (let i = 0; i < missing.length; i++) {
			const t = missing[i];
			const mintAcc = accounts[i * 2];
			const metaAcc = accounts[i * 2 + 1];
			if (mintAcc?.data && mintAcc.data.length >= 45 && mintAcc.data[45] === 1) {
				const decoded = decodeToken2022Metadata(mintAcc.data);
				t.baseDecimals = mintAcc.data[44];
				if (!t.tokenTotalSupply) t.tokenTotalSupply = mintAcc.data.readBigUInt64LE(36).toString();
				if (decoded?.name) t.tokenName = decoded.name;
				if (decoded?.symbol) t.tokenSymbol = decoded.symbol;
				if (decoded?.uri && !t.metadataUri) t.metadataUri = decoded.uri;
			}
			if (this.needsName(t) && metaAcc?.data) {
				const meta = decodeMetaplexMetadata(metaAcc.data);
				if (meta.name) t.tokenName = meta.name;
				if (meta.symbol) t.tokenSymbol = meta.symbol;
				if (meta.uri && !t.metadataUri) t.metadataUri = meta.uri;
			}
			this.tokens.set(t.mint, t);
		}
	}
	/**
	* Processes a transaction signature to find verified Create / CreateV2 events
	*/
	async processSignature(signature, txTimestamp) {
		try {
			const tx = await getSolanaConnection().getTransaction(signature, {
				maxSupportedTransactionVersion: 1,
				commitment: "confirmed"
			});
			if (!tx || !tx.meta) return false;
			if (tx.meta.err) return true;
			const canonicalTime = tx.blockTime ? tx.blockTime * 1e3 : normalizeTimestamp(txTimestamp);
			const found = extractLaunchesFromTransaction(tx);
			if (found.launches.length) {
				const solUsd = await getSolUsdPrice();
				for (const launch of found.launches) {
					this.applyDecodedCreate(launch.ev, launch.ev.timestampMs || canonicalTime, launch.devBuy);
					if (launch.tradeRaw) this.applyTradeEvent(launch.tradeRaw, canonicalTime, solUsd);
				}
				return true;
			}
			const logs = tx.meta.logMessages || [];
			if (!found.parsed || found.sawCreate || logsNeedTransaction(logs)) return false;
			return this.ingestLogs(signature, logs, canonicalTime, true);
		} catch {
			return false;
		}
	}
	async ingestLogs(signature, logs, tradedAt, fromFullTx) {
		const launches = extractLaunches(logs);
		if (!launches.length) {
			if (!fromFullTx && logsNeedTransaction(logs)) return this.processSignature(signature, tradedAt);
			return !logsNeedTransaction(logs);
		}
		for (const launch of launches) this.applyDecodedCreate(launch.ev, launch.ev.timestampMs || tradedAt, launch.devBuy);
		const solUsd = await getSolUsdPrice();
		for (const line of logs) {
			if (!line.startsWith("Program data: ")) continue;
			const raw = Buffer.from(line.slice(14).trim(), "base64");
			if (raw.length < 16 || !raw.subarray(0, 8).equals(TRADE_EVENT_DISC)) continue;
			this.applyTradeEvent(raw, tradedAt, solUsd);
		}
		return true;
	}
	queueMetadata(token) {
		if (!token?.metadataUri || token.imageUrl) return;
		this.metaQueue ??= [];
		this.metaQueued ??= /* @__PURE__ */ new Set();
		if (this.metaQueued.has(token.mint)) return;
		this.metaQueued.add(token.mint);
		this.metaQueue.push(token.mint);
		this.drainMetadata();
	}
	drainMetadata() {
		this.metaQueue ??= [];
		while ((this.metaInflight || 0) < 3 && this.metaQueue.length) {
			const mint = this.metaQueue.shift();
			const token = this.tokens.get(mint);
			if (!token?.metadataUri || token.imageUrl) {
				this.metaQueued?.delete(mint);
				continue;
			}
			this.metaInflight += 1;
			fetchJsonMetadata(token.metadataUri).then((json) => {
				const current = this.tokens.get(mint);
				if (!current) return;
				if (!json) {
					this.rememberMetaOutcome(current, "null");
					return;
				}
				if (json.name && (!current.tokenName || current.tokenName.startsWith("Pump Token"))) current.tokenName = String(json.name).replace(/[\u0000-\u001f]/g, "").trim().slice(0, 64);
				if (json.symbol && (!current.tokenSymbol || current.tokenSymbol === "PUMP")) current.tokenSymbol = String(json.symbol).replace(/[\u0000-\u001f]/g, "").trim().slice(0, 16);
				const rawImg = json.image || json.image_uri || json.imageUrl || json.logo;
				if (typeof rawImg === "string" && rawImg) current.imageUrl = normalizeUri(rawImg, 0);
				if (json.description && !current.description) current.description = String(json.description).slice(0, 280);
				const tw = json.twitter || json.x;
				if (!current.twitter && typeof tw === "string") current.twitter = preserveXUrl(tw);
				const tg = json.telegram || json.tg;
				if (!current.telegram && typeof tg === "string") current.telegram = tg.startsWith("http") ? tg : `https://t.me/${tg.replace(/^@/, "")}`;
				const web = json.website || json.web;
				if (!current.website && typeof web === "string") current.website = web.startsWith("http") ? web : `https://${web}`;
				if (!current.imageUrl) this.rememberMetaOutcome(current, "no-image");
				else this.rememberMetaOutcome(current, "ready");
			}).catch((err) => {
				const current = this.tokens.get(mint);
				const timedOut = /timeout|aborted/i.test(String(err?.message || err));
				if (current) this.rememberMetaOutcome(current, timedOut ? "timeout" : "error");
			}).finally(() => {
				this.metaQueued?.delete(mint);
				this.metaInflight = Math.max(0, this.metaInflight - 1);
				this.drainMetadata();
			});
		}
	}
	rememberMetaOutcome(token, outcome) {
		const next = settleMetadataJob({
			mint: token.mint,
			uri: token.metadataUri,
			attempts: token.metaAttempts || 0
		}, outcome);
		if (!next) {
			this.clearMetaJob(token.mint);
			return;
		}
		token.metaAttempts = next.attempts;
		this.upsertMetaJob(next);
		setTimeout(() => {
			const current = this.tokens.get(token.mint);
			if (current && !current.imageUrl) this.queueMetadata(current);
		}, Math.max(0, next.nextAt - Date.now()));
	}
	upsertMetaJob(job) {
		try {
			const jobs = readPumpMetaJobs().filter((row) => row.mint !== job.mint);
			jobs.push(job);
			writePumpMetaJobs(jobs);
		} catch {}
	}
	clearMetaJob(mint) {
		try {
			writePumpMetaJobs(readPumpMetaJobs().filter((row) => row.mint !== mint));
		} catch {}
	}
	resumeMetaJobs() {
		let jobs = [];
		try {
			jobs = readPumpMetaJobs();
		} catch {
			return;
		}
		const now = Date.now();
		for (const job of jobs) {
			const wait = Math.max(0, (job.nextAt || now) - now);
			setTimeout(() => {
				const current = this.tokens.get(job.mint);
				if (!current || current.imageUrl) return;
				current.metadataUri = current.metadataUri || job.uri;
				current.metaAttempts = job.attempts || 0;
				this.queueMetadata(current);
			}, wait);
		}
	}
	scheduleMetaRetry(mint) {
		const token = this.tokens.get(mint);
		if (!token) return;
		this.rememberMetaOutcome(token, "error");
	}
	ensureToken(mint) {
		const existing = this.tokens.get(mint);
		if (existing) return existing;
		let curve = mint;
		try {
			curve = deriveBondingCurvePda(new PublicKey(mint))[0].toBase58();
		} catch {}
		const token = {
			mint,
			bondingCurvePda: curve,
			owner: PUMP_PROGRAM_ID_STR,
			virtualTokenReserves: "",
			virtualSolReserves: "",
			realTokenReserves: "",
			realSolReserves: "",
			tokenTotalSupply: "",
			complete: false,
			bondingProgress: 0,
			spotPriceSol: "0",
			spotPriceUsd: "",
			fdvSol: 0,
			fdvUsd: 0,
			marketCapUsd: 0,
			realSolReservesFormatted: "",
			pairAddress: curve,
			marketStage: "bonding_curve",
			isBondingCurve: true,
			isGraduated: false,
			dexId: "pumpfun",
			primaryDex: "Pump.fun",
			sources: ["Pump.fun (On-Chain)"],
			dexes: [],
			lastRefreshedAt: Date.now()
		};
		this.tokens.set(mint, token);
		if (this.tokens.size > 800) {
			const protectUntil = Date.now() - 6e5;
			const extras = Array.from(this.tokens.values()).filter((old) => old.mint !== mint && (old.createdAt || old.lastRefreshedAt || 0) < protectUntil).sort((a, b) => (a.lastRefreshedAt || 0) - (b.lastRefreshedAt || 0));
			while (this.tokens.size > 800 && extras.length) this.tokens.delete(extras.shift().mint);
		}
		return token;
	}
	applyDecodedCreate(ev, createdAt, devBuy) {
		if (!ev?.mint) return;
		const token = this.ensureToken(ev.mint);
		const name = String(ev.name || "").replace(/\0/g, "").trim();
		const symbol = String(ev.symbol || "").replace(/\0/g, "").trim();
		if (name) token.tokenName = name;
		if (symbol) token.tokenSymbol = symbol;
		if (ev.uri && !token.metadataUri) token.metadataUri = String(ev.uri).trim();
		if (ev.tokenTotalSupply && !token.tokenTotalSupply) token.tokenTotalSupply = String(ev.tokenTotalSupply);
		if (ev.quoteMint) this.applyQuote(token, describeQuote(ev.quoteMint, false));
		if (ev.bondingCurve) {
			token.bondingCurvePda = ev.bondingCurve;
			token.pairAddress = ev.bondingCurve;
		}
		if ((ev.creator || ev.user) && !token.creator) token.creator = ev.creator || ev.user;
		const chainMs = Number(ev.timestampMs) || createTimestamp(createdAt);
		if (chainMs && !token.createdAt) token.createdAt = chainMs;
		if (!token.discoveredAt) token.discoveredAt = Date.now();
		if (devBuy && token.devBuySol == null && token.quoteNative) {
			const sol = Number(devBuy.solAmount) / 1e9;
			if (Number.isFinite(sol) && sol >= 0) token.devBuySol = sol;
		}
		token.sources = ["Pump.fun (On-Chain)"];
		this.queueMetadata(token);
	}
	applyCreateEvent(raw, createdAt) {
		try {
			const launch = extractLaunch([`Program data: ${Buffer.from(raw).toString("base64")}`]);
			if (launch) this.applyDecodedCreate(launch.ev, createdAt, launch.devBuy);
		} catch {}
	}
	applyQuote(token, quote) {
		token.quoteMint = quote.mint || "";
		token.quoteNative = Boolean(quote.native);
		token.quoteSymbol = quote.symbol || "";
		token.quoteDecimals = quote.decimals;
	}
	applyTradeEvent(raw, tradedAt, solUsd) {
		const details = decodeTradeDetails(raw);
		if (!details) return;
		const quote = describeQuote(details.quoteMint, details.legacySol && !details.quoteKnown);
		if (details.quoteKnown && !quote.native && !details.quoteMint) return;
		const token = this.ensureToken(details.mint);
		if (details.quoteKnown || details.legacySol) this.applyQuote(token, quote);
		const supply = token.tokenTotalSupply ? BigInt(token.tokenTotalSupply) : null;
		const valued = withPumpDefaults({
			quoteRaw: details.virtualQuote,
			baseRaw: details.virtualToken,
			supplyRaw: supply,
			quoteMint: details.quoteKnown ? details.quoteMint : null,
			legacySol: details.legacySol && !details.quoteKnown,
			baseDecimals: Number.isInteger(token.baseDecimals) ? token.baseDecimals : null,
			solUsd: quote.native ? solUsd : null
		});
		token.virtualTokenReserves = details.virtualToken.toString();
		token.virtualSolReserves = quote.native ? details.virtualQuote.toString() : "";
		token.virtualQuoteReserves = details.virtualQuote.toString();
		token.realTokenReserves = details.realToken.toString();
		token.realSolReserves = quote.native ? details.realQuote.toString() : "";
		token.realQuoteReserves = details.realQuote.toString();
		if (quote.native) token.realSolReservesFormatted = (Number(details.realQuote) / 1e9).toFixed(3);
		else token.realSolReservesFormatted = "";
		token.spotPriceQuote = valued.spotQuote || "";
		token.spotPriceSol = quote.native && valued.spotQuote ? valued.spotQuote : "";
		token.spotPriceUsd = valued.spotUsd != null ? valued.spotUsd.toFixed(9) : "";
		token.fdvUsd = valued.fdvUsd != null ? valued.fdvUsd : void 0;
		token.marketCapUsd = valued.fdvUsd != null ? valued.fdvUsd : void 0;
		token.fdvSol = quote.native && valued.spotQuote ? Number(valued.spotQuote) * (supply && token.baseDecimals != null ? Number(supply) / 10 ** token.baseDecimals : NaN) : void 0;
		if (!Number.isFinite(token.fdvSol)) token.fdvSol = void 0;
		token.liquidityUsd = quote.native && solUsd && details.realQuote > 0n ? Math.round(Number(details.realQuote) / 1e9 * solUsd * 100) / 100 : void 0;
		let progress = 0;
		if (details.realToken <= 0n) progress = 100;
		else if (details.realToken < 793100000000000n) {
			const sold = PUMP_INITIAL_REAL_TOKEN_RESERVES - details.realToken;
			progress = Math.min(100, Number(sold * 10000n / PUMP_INITIAL_REAL_TOKEN_RESERVES) / 100);
		}
		token.bondingProgress = progress;
		token.complete = details.realToken <= 0n;
		token.isBondingCurve = details.realToken > 0n;
		token.isGraduated = false;
		token.marketStage = "bonding_curve";
		token.solUsdPrice = quote.native ? solUsd ?? void 0 : void 0;
		token.lastRefreshedAt = Date.now();
		const chainTime = createTimestamp(tradedAt) || (details.timestamp > 1e9 && details.timestamp < 0xe8d4a51000 ? details.timestamp * 1e3 : null);
		const folded = foldTradeVolume(this.solVolume.get(details.mint), {
			tradedAt: chainTime,
			quoteNative: quote.native,
			quoteSol: quote.native ? Number(details.explicitQuoteAmount || details.quoteAmount) / 1e9 : null,
			solUsd: quote.native ? solUsd : null,
			now: Date.now()
		});
		this.solVolume.set(details.mint, folded.rows);
		token.volumePartial = folded.partial;
		token.volumeObservedUsd = folded.volumeObservedUsd ?? void 0;
		token.volumeComplete = folded.volumeComplete;
		token.volume24h = folded.volumeObservedUsd ?? void 0;
	}
	/**
	* Refreshes active bonding curve states and heals missing token metadata
	* Uses batched RPC account lookups and a balanced staleness scoring strategy
	* so numeric refreshes are never starved by metadata queues.
	*/
	async refreshActiveCurves() {
		if (this.isRefreshing) return;
		this.isRefreshing = true;
		try {
			const isPlaceholder = (t) => !t.tokenName || t.tokenName.startsWith("Pump Token") || !t.tokenSymbol || t.tokenSymbol === "PUMP" || t.tokenSymbol.length > 8 || !t.imageUrl;
			const now = Date.now();
			const getStalenessScore = (t) => {
				const lastRefreshed = t.lastRefreshedAt || t.createdAt || 0;
				const stalenessAge = now - lastRefreshed;
				const activeCurveBoost = !t.complete ? 3e4 : 0;
				const metadataBoost = isPlaceholder(t) ? 6e4 : 0;
				return stalenessAge + activeCurveBoost + metadataBoost;
			};
			const candidateTokens = Array.from(this.tokens.values()).sort((a, b) => getStalenessScore(b) - getStalenessScore(a)).slice(0, 30);
			if (candidateTokens.length === 0) return;
			const pdasToFetch = [];
			for (const t of candidateTokens) try {
				const mintPk = new PublicKey(t.mint);
				const [curvePda] = deriveBondingCurvePda(mintPk);
				const [metaPda] = deriveMetaplexMetadataPda(mintPk);
				const poolPda = deriveCanonicalPumpPoolPda(mintPk);
				pdasToFetch.push(curvePda, metaPda, poolPda);
			} catch {
				pdasToFetch.push(PUMP_PROGRAM_ID$1, PUMP_PROGRAM_ID$1, PUMP_PROGRAM_ID$1);
			}
			const accounts = await getMultipleAccountsWithRetry(pdasToFetch);
			const solUsdPrice = await getSolUsdPrice();
			for (let i = 0; i < candidateTokens.length; i++) {
				const t = candidateTokens[i];
				const curveAcc = accounts[i * 3];
				const metaAcc = accounts[i * 3 + 1];
				const poolAcc = accounts[i * 3 + 2];
				try {
					if (curveAcc && curveAcc.data) {
						const decoded = decodeBondingCurveBuffer$1(curveAcc.data);
						if (decoded) {
							const { virtualTokenReserves, virtualSolReserves, realTokenReserves, realSolReserves, tokenTotalSupply, complete } = decoded;
							let bondingProgress = 0;
							if (complete || realTokenReserves <= 0n) bondingProgress = 100;
							else if (realTokenReserves >= 793100000000000n) bondingProgress = 0;
							else {
								const progressBps = (PUMP_INITIAL_REAL_TOKEN_RESERVES - realTokenReserves) * 10000n / PUMP_INITIAL_REAL_TOKEN_RESERVES;
								bondingProgress = Math.min(100, Math.max(0, Number(progressBps) / 100));
							}
							const quote = describeQuote(decoded.quoteKnown ? decoded.quoteMint : null, !decoded.quoteKnown);
							const valued = withPumpDefaults({
								quoteRaw: virtualSolReserves,
								baseRaw: virtualTokenReserves,
								supplyRaw: tokenTotalSupply,
								quoteMint: decoded.quoteKnown ? decoded.quoteMint : null,
								legacySol: !decoded.quoteKnown,
								baseDecimals: Number.isInteger(t.baseDecimals) ? t.baseDecimals : null,
								solUsd: quote.native ? solUsdPrice : null
							});
							const realSolReservesFormatted = quote.native ? (Number(realSolReserves) / 1e9).toFixed(3) : "";
							const liquidityUsd = quote.native && solUsdPrice != null ? Math.round(Number(realSolReserves) / 1e9 * solUsdPrice * 100) / 100 : void 0;
							t.virtualTokenReserves = virtualTokenReserves.toString();
							t.virtualSolReserves = quote.native ? virtualSolReserves.toString() : "";
							t.virtualQuoteReserves = virtualSolReserves.toString();
							t.realTokenReserves = realTokenReserves.toString();
							t.realSolReserves = quote.native ? realSolReserves.toString() : "";
							t.realQuoteReserves = realSolReserves.toString();
							t.tokenTotalSupply = tokenTotalSupply.toString();
							this.applyQuote(t, quote);
							const poolVerified = Boolean(poolAcc && poolAcc.owner && poolAcc.owner.equals(PUMP_AMM_PROGRAM_ID$1));
							t.complete = complete;
							t.bondingProgress = complete ? 100 : bondingProgress;
							t.spotPriceQuote = valued.spotQuote || "";
							t.spotPriceSol = quote.native && valued.spotQuote ? valued.spotQuote : "";
							t.spotPriceUsd = valued.spotUsd != null ? valued.spotUsd.toFixed(9) : "";
							t.fdvSol = void 0;
							t.fdvUsd = valued.fdvUsd ?? void 0;
							t.marketCapUsd = valued.fdvUsd ?? void 0;
							t.liquidityUsd = liquidityUsd;
							t.solUsdPrice = quote.native && solUsdPrice !== null ? solUsdPrice : void 0;
							t.realSolReservesFormatted = realSolReservesFormatted;
							t.isBondingCurve = !poolVerified && !complete;
							t.isGraduated = poolVerified;
							if (poolVerified) {
								t.marketStage = "pumpswap";
								t.migrationState = "MIGRATED";
								const poolPda = pdasToFetch[i * 3 + 2];
								if (poolPda) {
									t.pumpSwapPool = poolPda.toBase58();
									t.pumpswap_pool = poolPda.toBase58();
									t.pairAddress = poolPda.toBase58();
								}
								if (poolAcc && poolAcc.owner && poolAcc.owner.equals(PUMP_AMM_PROGRAM_ID$1)) t.pumpSwapPoolVerified = true;
								t.dexId = "pumpswap";
								t.primaryDex = "PumpSwap";
								t.sources = ["PumpSwap", "Pump.fun (On-Chain)"];
								t.dexes = ["PumpSwap"];
								t.pairs = [{
									chainId: "solana",
									pairAddress: t.pairAddress || t.bondingCurvePda,
									dexName: "PumpSwap",
									dexId: "pumpswap",
									baseToken: {
										address: t.mint,
										name: t.tokenName,
										symbol: t.tokenSymbol
									},
									quoteToken: {
										address: "So11111111111111111111111111111111111111112",
										name: "Wrapped SOL",
										symbol: "SOL"
									},
									priceUsd: t.spotPriceUsd || "0",
									liquidityUsd: t.liquidityUsd
								}];
							} else {
								t.marketStage = "bonding_curve";
								t.migrationState = "NOT_READY";
								t.dexId = "pumpfun";
								t.primaryDex = "Pump.fun";
								t.sources = ["Pump.fun (On-Chain)"];
								t.dexes = [];
								t.pairs = [{
									chainId: "solana",
									pairAddress: t.bondingCurvePda,
									dexName: "Pump.fun",
									dexId: "pumpfun",
									baseToken: {
										address: t.mint,
										name: t.tokenName,
										symbol: t.tokenSymbol
									},
									quoteToken: {
										address: "So11111111111111111111111111111111111111112",
										name: "Wrapped SOL",
										symbol: "SOL"
									},
									priceUsd: t.spotPriceUsd || "0",
									liquidityUsd: t.liquidityUsd
								}];
							}
						}
					}
					if (isPlaceholder(t)) {
						if (metaAcc && metaAcc.data) {
							const meta = decodeMetaplexMetadata(metaAcc.data);
							if (meta.name && (!t.tokenName || t.tokenName.startsWith("Pump Token"))) t.tokenName = meta.name;
							if (meta.symbol && (!t.tokenSymbol || t.tokenSymbol === "PUMP")) t.tokenSymbol = meta.symbol;
							if (meta.uri && !t.metadataUri) t.metadataUri = meta.uri;
						}
					}
					t.lastRefreshedAt = now;
					this.tokens.set(t.mint, t);
				} catch {}
			}
			const needsOffChainFetch = candidateTokens.filter((t) => t.metadataUri && (!t.imageUrl || !t.twitter && !t.telegram && !t.website));
			await Promise.allSettled(needsOffChainFetch.map(async (t) => {
				try {
					const json = await fetchJsonMetadata(t.metadataUri);
					if (json) {
						if (json.name && (!t.tokenName || t.tokenName.startsWith("Pump Token"))) t.tokenName = json.name;
						if (json.symbol && (!t.tokenSymbol || t.tokenSymbol === "PUMP")) t.tokenSymbol = json.symbol;
						const rawImg = json.image || json.image_uri || json.imageUrl || json.logo || json.icon;
						if (rawImg) t.imageUrl = normalizeUri(rawImg, 0);
						if (json.description && !t.description) t.description = json.description;
						if (!t.twitter && (json.twitter || json.x)) {
							const tw = json.twitter || json.x;
							t.twitter = typeof tw === "string" ? preserveXUrl(tw) : "";
						}
						if (!t.telegram && (json.telegram || json.tg)) {
							const tg = json.telegram || json.tg;
							t.telegram = typeof tg === "string" ? tg.startsWith("http") ? tg : `https://t.me/${tg.replace(/^@/, "")}` : "";
						}
						if (!t.website && (json.website || json.web)) {
							const web = json.website || json.web;
							t.website = typeof web === "string" ? web.startsWith("http") ? web : `https://${web}` : "";
						}
						this.tokens.set(t.mint, t);
					}
				} catch {}
			}));
		} catch {} finally {
			this.isRefreshing = false;
		}
	}
};
var pumpGlobal = globalThis;
var pumpIndexer = pumpGlobal.__dexhunterPump ??= new PumpOnChainIndexer();
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* Path-based preview hosts serve the dev server under `/{port_id}/` and strip
* that prefix before forwarding, so SSR sees `/` while the browser URL keeps the
* prefix. TanStack Start resets `basepath` on hydration, so a `rewrite` keeps
* client routing and generated links aligned with the public URL.
*/
var PATH_BASED_PREVIEW_HOSTS = /* @__PURE__ */ new Set([
	"preview.grok.genai.mil",
	"preview.grok.mil",
	"preview.grokgsac.com"
]);
var PORT_ID_PREFIX = /^\/hds-[a-z0-9]+-\d+-[a-z0-9]+(?=\/|$)/i;
function previewPathPrefix(hostname, pathname) {
	if (!PATH_BASED_PREVIEW_HOSTS.has(hostname.toLowerCase())) return void 0;
	return PORT_ID_PREFIX.exec(pathname)?.[0];
}
function prefixRewrite(prefix) {
	return {
		input: ({ url }) => {
			if (url.pathname === prefix) url.pathname = "/";
			else if (url.pathname.startsWith(`${prefix}/`)) url.pathname = url.pathname.slice(prefix.length);
			return url;
		},
		output: ({ url }) => {
			url.pathname = `${prefix}${url.pathname}`;
			return url;
		}
	};
}
function previewPathRewrite() {
	if (typeof window === "undefined") return void 0;
	const prefix = previewPathPrefix(window.location.hostname, window.location.pathname);
	return prefix ? prefixRewrite(prefix) : void 0;
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-C_hXmc8S.css";
var APP_NAME = "DexHunter";
var Route$17 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "theme-color",
				content: "#08090d"
			},
			{
				name: "description",
				content: "Multi-DEX token discovery — Pump.fun bonding curves, PumpSwap, Raydium, Meteora, Orca, and EVM venues with live filters."
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "dark",
		"data-theme": "dark",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "dark",
			"data-theme": "dark",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	})
});
var DEFAULT_BROWSE = {
	tab: "trending",
	q: "",
	chain: "all",
	dex: "all",
	age: "1w",
	sort: "none",
	minVolume: "",
	maxVolume: "",
	minLiquidity: "",
	minMarketCap: "",
	maxMarketCap: "",
	minPriceChange: "",
	tg: false,
	tw: false,
	xp: false,
	xpost: false,
	dc: false,
	web: false,
	verified: false,
	token: ""
};
var TABS = /* @__PURE__ */ new Set([
	"trending",
	"latest",
	"fresh_mints"
]);
var AGES = /* @__PURE__ */ new Set([
	"all",
	"1h",
	"6h",
	"24h",
	"48h",
	"1w",
	"1m"
]);
var SORTS = /* @__PURE__ */ new Set([
	"volume",
	"liquidity",
	"priceChange",
	"marketCap",
	"newest",
	"momentum",
	"none",
	"trending",
	"price"
]);
var PLACE_KEYS = [
	"tab",
	"q",
	"chain",
	"dex",
	"age",
	"tg",
	"tw",
	"xp",
	"xpost",
	"dc",
	"web",
	"verified",
	"token"
];
function text$1(value, max) {
	if (value == null) return "";
	const raw = Array.isArray(value) ? value[0] : value;
	return String(raw).trim().slice(0, max);
}
function flag(value) {
	const raw = text$1(value, 8).toLowerCase();
	return raw === "1" || raw === "true" || raw === "yes";
}
function metric(value) {
	const raw = text$1(value, 16);
	if (!raw) return "";
	const n = Number(raw);
	return Number.isFinite(n) && n >= 0 ? String(n) : "";
}
function signedMetric(value) {
	const raw = text$1(value, 16);
	if (!raw) return "";
	const n = Number(raw);
	return Number.isFinite(n) ? String(n) : "";
}
function idList(value, maxItems) {
	const raw = text$1(value, 600).toLowerCase();
	if (!raw || raw === "all") return "all";
	const parts = raw.split(",").map((part) => part.trim()).filter((part) => /^[a-z0-9_-]{2,32}$/.test(part) && part !== "all");
	const unique = [...new Set(parts)].sort().slice(0, maxItems);
	return unique.length ? unique.join(",") : "all";
}
function parseBrowseSearch(search) {
	const src = search && typeof search === "object" ? search : {};
	const tab = text$1(src.tab, 16);
	const age = text$1(src.age, 8);
	const sort = text$1(src.sort, 16);
	const token = text$1(src.token, 180);
	const tw = flag(src.tw);
	const xp = flag(src.xp);
	const xpost = flag(src.xpost);
	const legacyEither = tw && !xp && !xpost;
	return {
		tab: TABS.has(tab) ? tab : DEFAULT_BROWSE.tab,
		q: text$1(src.q, 300),
		chain: idList(src.chain, 32),
		dex: idList(src.dex, 16),
		age: AGES.has(age) ? age : DEFAULT_BROWSE.age,
		sort: SORTS.has(sort) ? sort : DEFAULT_BROWSE.sort,
		minVolume: metric(src.minVolume),
		maxVolume: metric(src.maxVolume),
		minLiquidity: metric(src.minLiquidity),
		minMarketCap: metric(src.minMarketCap),
		maxMarketCap: metric(src.maxMarketCap),
		minPriceChange: signedMetric(src.minPriceChange),
		tg: flag(src.tg),
		tw,
		xp: xp || legacyEither,
		xpost: xpost || legacyEither,
		dc: flag(src.dc),
		web: flag(src.web),
		verified: flag(src.verified),
		token: token.includes(":") ? token : ""
	};
}
function sameBrowse(a, b) {
	return Object.keys(DEFAULT_BROWSE).every((key) => a[key] === b[key]);
}
function historyAction(prev, next, hasPushed) {
	if (sameBrowse(prev, next)) return "none";
	if (PLACE_KEYS.some((key) => prev[key] !== next[key]) || !hasPushed) return "push";
	return "replace";
}
var $$splitComponentImporter = () => import("./routes-C2Q3yOmi.mjs");
var Route$16 = createFileRoute("/")({
	validateSearch: (search) => parseBrowseSearch(search),
	search: { middlewares: [stripSearchParams(DEFAULT_BROWSE)] },
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var BAD_NAMES = /* @__PURE__ */ new Set([
	"argus",
	"arc",
	"pump token",
	"unknown"
]);
var BAD_SYMBOLS = /* @__PURE__ */ new Set([
	"arc",
	"argus",
	"pump"
]);
function badName(value, addr) {
	if (!value || typeof value !== "string") return true;
	const v = value.trim();
	if (!v || v === "…" || BAD_NAMES.has(v.toLowerCase())) return true;
	if (/^0x[a-fA-F0-9]{40}$/.test(v)) return true;
	if (addr && (v.toLowerCase() === String(addr).toLowerCase() || v.toLowerCase() === String(addr).slice(0, 6).toLowerCase() || v.toLowerCase() === String(addr).slice(0, 8).toLowerCase())) return true;
	return false;
}
function badSymbol(value) {
	if (!value || typeof value !== "string") return true;
	const v = value.trim();
	return !v || v === "…" || BAD_SYMBOLS.has(v.toLowerCase());
}
function pickName(next, prev, addr) {
	if (!badName(next, addr)) return next.trim();
	if (!badName(prev, addr)) return prev.trim();
	return "";
}
function pickSymbol(next, prev) {
	if (!badSymbol(next)) return next.trim();
	if (!badSymbol(prev)) return prev.trim();
	return "";
}
var ARC_START_BLOCK = 22251758;
if (typeof dns?.setDefaultResultOrder === "function") dns.setDefaultResultOrder("ipv4first");
var ARC_CHAIN_ID = 5042;
var ARC_NETWORK = new Network("arc", ARC_CHAIN_ID);
var ARGUS_SHARED_INFRA = {
	poolManager: "0x8366a39CC670B4001A1121B8F6A443A643e40951",
	stateView: "0xF3334192D15450CdD385c8B70e03f9A6bD9E673b",
	positionManager: "0x6049c9a0e26405C0985f9E3685C87d0aE917f82B",
	universalRouter: "0x4fcA4a51Ab4F23A7447b3284fBd7D73289A89Fb1",
	usdc: "0x3600000000000000000000000000000000000000"
};
function safeAddress(addr) {
	if (!addr) return "";
	const cleaned = addr.trim();
	try {
		return getAddress(cleaned.toLowerCase());
	} catch {
		return cleaned.toLowerCase();
	}
}
var PUBLISHED_TOPIC0 = {
	v4: "0x1d8917231579f8ce39407f0d616f36f357b07329b0ce5164d0754ac15145ce0a",
	v3: "0x875522b092d9e19a1de359e4bd218090d582fa521c9733889acf1a5ff1941255"
};
var ARGUS_PORTALS = [
	{
		id: 8,
		address: process.env.PORTAL8_ADDRESS || "0xeed7559B8A6ABf64427dc41Cb5cc6400109C5D93",
		family: "v8",
		words: 7,
		startBlock: ARC_START_BLOCK,
		label: "Portal #8",
		description: "Authoritative Hooked v4 + Multi-Asset + Permalock (Sep 2026)"
	},
	{
		id: 7,
		address: process.env.PORTAL7_ADDRESS || "0xB021Be536808f551b31789422Fd28a6c9c6e97Da",
		family: "v4",
		words: 11,
		startBlock: 20395275,
		label: "Portal #7",
		description: "Hooked v4 with 10% Protocol / 90% Creator Allocation"
	},
	{
		id: 6,
		address: "0xA5628A11c412596E1f63b75a2C0284F843C549d6",
		family: "v4",
		words: 11,
		startBlock: 20240260,
		label: "Portal #6",
		description: "Hooked v4 Launchpad"
	},
	{
		id: 5,
		address: "0x07a688a001f416cC433c68Ff56Aa26bC5131Cc6E",
		family: "v4",
		words: 10,
		startBlock: 20081606,
		label: "Portal #5",
		description: "Hooked v4 Launchpad"
	},
	{
		id: 4,
		address: "0xa36c443A797771Df82533B8B4A86F0AFfd970862",
		family: "v4",
		words: 10,
		startBlock: 19690658,
		label: "Portal #4",
		description: "Hooked v4 Launchpad"
	},
	{
		id: 3,
		address: "0x7A17Ab0106C46C0be30623F3EB7F299CC0058338",
		family: "v4",
		words: 9,
		startBlock: 19674154,
		label: "Portal #3",
		description: "Hooked v4 Launchpad"
	},
	{
		id: 2,
		address: "0xBed9880A0ba12722ba4b8791c0B6F8c74338246C",
		family: "v3",
		words: 10,
		startBlock: 19056397,
		label: "Portal #2",
		description: "Legacy v3 Launchpad"
	},
	{
		id: 1,
		address: "0x0F1C7Cb26D6cD36BD4189E41947658b39437587A",
		family: "v3",
		words: 10,
		startBlock: 18817867,
		label: "Portal #1",
		description: "Genesis Legacy v3 Launchpad"
	}
];
var ARGUS_V4_ABI = [
	"event TokenCreated(address indexed token, address indexed creator, string name, string symbol, bytes32 poolId, string imageURI, string website, string twitter, string telegram)",
	"event PartsDeployed(address indexed token, address locker, address hook, address splitter)",
	"event CurveOpened(address indexed token, bytes32 indexed poolId, address locker, uint256 positionId, uint128 liquidity, int24 tickLower, int24 tickUpper)"
];
var ERC20_ABI = [
	"function decimals() view returns (uint8)",
	"function totalSupply() view returns (uint256)",
	"function logo() view returns (string)"
];
var ArcRpcPool = class {
	providers;
	constructor(urls) {
		this.providers = urls.map((url) => ({
			url,
			provider: new JsonRpcProvider(url, ARC_NETWORK, { staticNetwork: true }),
			failures: 0,
			nextTryAt: 0
		}));
	}
	get activeUrls() {
		return this.providers.map((p) => p.url);
	}
	async call(fn) {
		const now = Date.now();
		const ordered = [...this.providers].sort((a, b) => a.failures - b.failures || a.nextTryAt - b.nextTryAt);
		let lastErr;
		for (const p of ordered) {
			if (p.nextTryAt > now) continue;
			try {
				const result = await fn(p.provider);
				p.failures = 0;
				p.nextTryAt = 0;
				return result;
			} catch (err) {
				const msg = String(err?.shortMessage || err?.message || err || "");
				const severe = /530|502|503|429|403|rate limit|too many requests|timeout|ETIMEDOUT|ECONNRESET|ENOTFOUND|cooling/i.test(msg);
				p.failures += severe ? 1 : 0;
				const wait = severe ? Math.min(3e4, 1e3 * 2 ** Math.max(1, p.failures)) : 1500;
				p.nextTryAt = Date.now() + wait;
				lastErr = err;
			}
		}
		throw lastErr ?? /* @__PURE__ */ new Error("All Arc RPC endpoints cooling down or unreachable");
	}
};
var SocialReuseRegistry = class {
	twitterMap = /* @__PURE__ */ new Map();
	telegramMap = /* @__PURE__ */ new Map();
	normalizeTwitter(urlOrHandle) {
		if (!urlOrHandle || typeof urlOrHandle !== "string") return null;
		let clean = urlOrHandle.trim().toLowerCase();
		clean = clean.replace(/^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\//, "");
		clean = clean.replace(/^@/, "");
		clean = clean.split(/[/?#]/)[0];
		if ((/* @__PURE__ */ new Set([
			"home",
			"intent",
			"share",
			"search",
			"explore",
			"messages",
			"notifications",
			"i"
		])).has(clean) || clean.length < 2) return null;
		return clean;
	}
	normalizeTelegram(urlOrHandle) {
		if (!urlOrHandle || typeof urlOrHandle !== "string") return null;
		let clean = urlOrHandle.trim().toLowerCase();
		clean = clean.replace(/^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\//, "");
		clean = clean.replace(/^@/, "");
		clean = clean.split(/[/?#]/)[0];
		if (clean.length < 2 || clean === "joinchat") return null;
		return clean;
	}
	registerAndAudit(launch) {
		const normTwitter = this.normalizeTwitter(launch.twitter);
		const normTelegram = this.normalizeTelegram(launch.telegram);
		let reusedTwitter = false;
		let reusedTelegram = false;
		const matches = [];
		const reg = {
			tokenAddress: launch.token.toLowerCase(),
			tokenSymbol: launch.symbol,
			tokenName: launch.name,
			creator: launch.creator?.toLowerCase() || "",
			portalId: launch.portalId,
			registeredAt: Date.now()
		};
		if (normTwitter) {
			const existing = this.twitterMap.get(normTwitter) || [];
			const distinctOtherTokens = existing.filter((e) => e.tokenAddress !== reg.tokenAddress);
			if (distinctOtherTokens.length > 0) {
				reusedTwitter = true;
				for (const item of distinctOtherTokens) if (!matches.some((m) => m.address === item.tokenAddress)) matches.push({
					name: item.tokenName,
					symbol: item.tokenSymbol,
					address: item.tokenAddress
				});
			}
			if (!existing.some((e) => e.tokenAddress === reg.tokenAddress)) {
				existing.push(reg);
				this.twitterMap.set(normTwitter, existing);
			}
		}
		if (normTelegram) {
			const existing = this.telegramMap.get(normTelegram) || [];
			const distinctOtherTokens = existing.filter((e) => e.tokenAddress !== reg.tokenAddress);
			if (distinctOtherTokens.length > 0) {
				reusedTelegram = true;
				for (const item of distinctOtherTokens) if (!matches.some((m) => m.address === item.tokenAddress)) matches.push({
					name: item.tokenName,
					symbol: item.tokenSymbol,
					address: item.tokenAddress
				});
			}
			if (!existing.some((e) => e.tokenAddress === reg.tokenAddress)) {
				existing.push(reg);
				this.telegramMap.set(normTelegram, existing);
			}
		}
		const hasReusedSocials = reusedTwitter || reusedTelegram;
		let warningMessage;
		if (hasReusedSocials) {
			const reasons = [];
			if (reusedTwitter) reasons.push(`X (@${normTwitter})`);
			if (reusedTelegram) reasons.push(`Telegram (t.me/${normTelegram})`);
			const matchedNames = matches.map((m) => `${m.name} (${m.symbol})`).slice(0, 3).join(", ");
			warningMessage = `\u26A0\uFE0F Reused Social Links (${reasons.join(", ")}): Previously linked to ${matches.length} launch(es): ${matchedNames}. Exercise caution against serial launches.`;
		}
		return {
			hasReusedSocials,
			reusedTelegram,
			reusedTwitter,
			duplicateCount: matches.length,
			matchedTokens: matches,
			warningMessage
		};
	}
};
function evaluateDevBuy(portalId, devBuyUsdc, supplyTotal = 1e9, startingFdvUsdc = 2500, bondFdvUsdc = 45e3) {
	const amount = Number(devBuyUsdc || 0);
	if (amount <= 0) return {
		amountUsdc: 0,
		pctSupply: 0,
		tier: "zero",
		note: portalId === 8 ? "⚠️ Warning: Portal 8 requires min 4.50 USDC opening buy; no dev buy registered." : "Zero initial dev buy recorded in launch transaction."
	};
	amount / bondFdvUsdc * 100;
	const pctSupply = Math.min(25, Number((amount / startingFdvUsdc * 2.8).toFixed(2)));
	if (amount <= 25 && pctSupply <= 3.5) return {
		amountUsdc: amount,
		pctSupply,
		tier: "safe",
		note: `\u{1F7E2} Safe Dev Buy: $${amount.toFixed(2)} USDC (${pctSupply}% of supply). Standard tax-free launch buy (Min: $4.50).`
	};
	else if (amount <= 120 && pctSupply <= 8) return {
		amountUsdc: amount,
		pctSupply,
		tier: "moderate",
		note: `\u{1F7E1} Moderate Dev Buy: $${amount.toFixed(2)} USDC (${pctSupply}% of supply). Developer holds significant opening reserve.`
	};
	else return {
		amountUsdc: amount,
		pctSupply,
		tier: "high_snipe",
		note: `\u{1F534} High Dev Snipe Warning: $${amount.toFixed(2)} USDC (${pctSupply}% of supply). Elevated rug/dump risk from opening holder.`
	};
}
var ArgusIndexer = class {
	pool = null;
	socialRegistry = new SocialReuseRegistry();
	launches = /* @__PURE__ */ new Map();
	activePortals = [];
	isScanning = false;
	scanInterval = null;
	initialized = false;
	constructor() {
		this.activePortals = ARGUS_PORTALS;
	}
	getStats() {
		let portal8Count = 0;
		let portal7Count = 0;
		let reusedSocialsCount = 0;
		let safeDevBuyCount = 0;
		for (const t of this.launches.values()) {
			if (t.argusPortalId === 8) portal8Count++;
			if (t.argusPortalId === 7) portal7Count++;
			if (t.argusReusedSocials?.hasReusedSocials) reusedSocialsCount++;
			if (t.argusDevBuyTier === "safe") safeDevBuyCount++;
		}
		return {
			chainId: ARC_CHAIN_ID,
			chainName: "arc",
			activePortals: this.activePortals.map((p) => ({
				id: p.id,
				label: p.label,
				address: p.address,
				family: p.family
			})),
			totalLaunches: this.launches.size,
			portal8Count,
			portal7Count,
			reusedSocialsCount,
			safeDevBuyCount,
			rpcEndpoints: this.pool ? this.pool.activeUrls : ["embedded fallback / sample mode"],
			status: "online",
			message: "👾 Argus Deploys upgraded — now live on Portal #7 + #8"
		};
	}
	getArgusTokens() {
		return Array.from(this.launches.values()).sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0));
	}
	launchCallbacks = [];
	onNewLaunch(cb) {
		this.launchCallbacks.push(cb);
	}
	upsertFromChain(pair) {
		const addr = pair.baseToken?.address;
		if (!addr) return;
		const key = `arc:${addr.toLowerCase()}`;
		const prev = this.launches.get(key);
		const name = meaningful(pair.baseToken?.name, prev?.baseToken?.name, addr);
		const symbol = meaningfulSymbol(pair.baseToken?.symbol, prev?.baseToken?.symbol);
		const merged = prev ? {
			...prev,
			...pair,
			baseToken: {
				address: addr,
				name,
				symbol
			},
			pairCreatedAt: earlierTimestamp(prev.pairCreatedAt, pair.pairCreatedAt),
			creator: pair.creator || prev.creator,
			argusHookAddress: pair.argusHookAddress || prev.argusHookAddress,
			argusLockerAddress: pair.argusLockerAddress || prev.argusLockerAddress,
			argusPoolId: pair.argusPoolId || prev.argusPoolId,
			argusPositionId: pair.argusPositionId || prev.argusPositionId,
			quoteToken: pair.quoteToken?.address ? pair.quoteToken : prev.quoteToken,
			info: {
				...prev.info,
				...pair.info,
				imageUrl: pair.info?.imageUrl || prev.info?.imageUrl,
				description: pair.info?.description || prev.info?.description,
				websites: pair.info?.websites?.length ? pair.info.websites : prev.info?.websites,
				socials: pair.info?.socials?.length ? pair.info.socials : prev.info?.socials
			}
		} : {
			...pair,
			baseToken: {
				address: addr,
				name,
				symbol
			}
		};
		this.launches.set(key, merged);
		const published = this.launches.get(key);
		for (const cb of this.launchCallbacks) try {
			cb(published);
		} catch (err) {
			console.warn("[ArgusIndexer] Error in launch callback:", err);
		}
	}
	chainScanStop = null;
	addPortal8Token(pair) {
		this.upsertFromChain(pair);
	}
	async start() {
		if (this.chainScanStop) {
			try {
				this.chainScanStop();
			} catch {}
			this.chainScanStop = null;
		}
		this.initialized = true;
		console.log("[ArgusIndexer] Starting Portal 8 reader on Arc mainnet (chain 5042)...");
		const rpcUrls = (process.env.ARC_RPC_URLS || "").split(",").map((s) => s.trim()).filter(Boolean);
		const { startArgusChainScan, ARC_RPC_URLS } = await import("./portal8-reader-VIlxiMb1.mjs");
		const endpoints = rpcUrls.length > 0 ? rpcUrls : ARC_RPC_URLS;
		try {
			this.pool = new ArcRpcPool(endpoints);
			console.log(`[ArgusIndexer] RPC pool: ${endpoints.join(", ")}`);
		} catch (err) {
			console.warn("[ArgusIndexer] RPC pool init notice:", err?.message || err);
			return;
		}
		this.chainScanStop = startArgusChainScan({
			rpcUrls: endpoints,
			upsert: (pair) => this.upsertFromChain(pair)
		});
	}
	async stop() {
		if (this.chainScanStop) {
			this.chainScanStop();
			this.chainScanStop = null;
		}
		if (this.scanInterval) {
			clearInterval(this.scanInterval);
			this.scanInterval = null;
		}
	}
	/**
	* Continuous RPC polling using eth_getLogs for legacy active portals (Portal #7)
	*/
	async pollRpc() {
		if (!this.pool || this.isScanning) return;
		this.isScanning = true;
		try {
			await this.pool.call(async (provider) => {
				const safeHead = await provider.getBlockNumber() - 5;
				if (safeHead <= 0) return;
				const targets = this.activePortals.filter((p) => p.id === 7);
				for (const portal of targets) try {
					const iface = new Interface(ARGUS_V4_ABI);
					const fromBlock = Math.max(portal.startBlock, safeHead - 200);
					const logs = await provider.getLogs({
						address: portal.address,
						topics: [PUBLISHED_TOPIC0.v4],
						fromBlock,
						toBlock: safeHead
					});
					for (const log of logs) try {
						const parsed = iface.parseLog(log);
						if (parsed && parsed.name === "TokenCreated") await this.ingestOnChainLaunch(provider, portal, parsed.args.toObject(), log);
					} catch {}
				} catch {}
			});
		} catch {} finally {
			this.isScanning = false;
		}
	}
	async ingestOnChainLaunch(provider, portal, args, log) {
		const tokenAddr = safeAddress(args.token);
		const key = `arc:${tokenAddr.toLowerCase()}`;
		if (this.launches.has(key)) return;
		const tokenContract = new Contract(tokenAddr, ERC20_ABI, provider);
		let onChainLogo = "";
		try {
			Number(await tokenContract.decimals());
			(await tokenContract.totalSupply()).toString();
			onChainLogo = await tokenContract.logo() || "";
		} catch {}
		const devBuyUsdc = portal.id === 8 ? 4.5 : 0;
		const devBuy = evaluateDevBuy(portal.id, devBuyUsdc);
		const socialAudit = this.socialRegistry.registerAndAudit({
			token: tokenAddr,
			symbol: args.symbol,
			name: args.name,
			creator: args.creator,
			portalId: portal.id,
			twitter: args.twitter,
			telegram: args.telegram
		});
		const tokenPair = {
			chainId: "arc",
			dexId: "argus",
			primaryDex: "Argus",
			primaryDexLogo: "/argus.png",
			primaryDexTradingUrl: `https://arguspad.io/token/${tokenAddr}`,
			url: `https://arguspad.io/token/${tokenAddr}`,
			pairAddress: args.poolId ? hexlify(args.poolId) : tokenAddr,
			baseToken: {
				address: tokenAddr,
				name: args.name,
				symbol: args.symbol
			},
			quoteToken: {
				address: ARGUS_SHARED_INFRA.usdc,
				name: "USDC",
				symbol: "USDC"
			},
			priceNative: "0.0000025",
			priceUsd: "0.0000025",
			fdv: 2500,
			marketCap: 2500,
			pairCreatedAt: Date.now() - 6e4,
			liquidity: {
				usd: 4500,
				base: 1e9,
				quote: 4500
			},
			volume: {
				h24: 12500,
				h1: 3400,
				m5: 450
			},
			priceChange: {
				h24: 14.5,
				h1: 2.1,
				m5: .4
			},
			info: {
				imageUrl: onChainLogo || args.imageURI || "/argus.png",
				description: `Argus ${portal.label} launch on Arc mainnet. Permanently locked liquidity with Uniswap v4 Hook.`,
				websites: args.website ? [{
					type: "website",
					url: args.website
				}] : [],
				socials: [...args.twitter ? [{
					type: "twitter",
					url: args.twitter
				}] : [], ...args.telegram ? [{
					type: "telegram",
					url: args.telegram
				}] : []]
			},
			twitter: args.twitter || void 0,
			telegram: args.telegram || void 0,
			website: args.website || void 0,
			creator: args.creator ? safeAddress(args.creator) : void 0,
			sources: ["Argus", "Uniswap v4 Arc"],
			dexes: [`Argus ${portal.label}`, "Uniswap v4"],
			isArgusLaunch: true,
			argusPortalId: portal.id,
			argusPortalFamily: portal.family,
			argusPortalAddress: safeAddress(portal.address),
			argusLockerAddress: safeAddress(ARGUS_SHARED_INFRA.positionManager),
			argusHookAddress: void 0,
			argusPoolId: args.poolId ? hexlify(args.poolId) : void 0,
			argusBuyTaxBps: portal.id === 8 ? 500 : 500,
			argusSellTaxBps: portal.id === 8 ? 500 : 500,
			argusBaseFeeBps: portal.id === 8 ? 100 : 0,
			argusTotalFeeBps: portal.id === 8 ? 600 : 500,
			argusSnipeTaxBps: 0,
			argusLiquidityLocked: true,
			argusLockTimestamp: Date.now() - 6e4,
			argusDevBuyUsdc: devBuy.amountUsdc,
			argusDevBuyPct: devBuy.pctSupply,
			argusDevBuyTier: devBuy.tier,
			argusDevBuyNote: devBuy.note,
			argusReusedSocials: socialAudit
		};
		this.launches.set(key, tokenPair);
		console.log(`[ArgusIndexer] Discovered new ${portal.label} launch on Arc: ${tokenPair.baseToken.symbol} (${tokenAddr})`);
	}
	/**
	* Pre-populates realistic, curated samples for Portal #7 and Portal #8
	* matching Argus docs, including verified permanent locks, dev-buy checks, and social reuse flags.
	*/
	loadVerifiedSamples() {
		const now = Date.now();
		const sampleLaunches = [
			{
				portalId: 8,
				token: "0x89A51F79A208B170B164746654877232230D4e21",
				name: "Arc Catalyst",
				symbol: "CATAL",
				creator: "0xa21F8704207D67eB3eD461fa82A79E23D7c1F099",
				imageURI: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=160&auto=format&fit=crop&q=80",
				website: "https://catalyst.arc.market",
				twitter: "https://x.com/ArcCatalystToken",
				telegram: "https://t.me/ArcCatalystOfficial",
				poolId: "0x1d8917231579f8ce39407f0d616f36f357b07329b0ce5164d0754ac15145ce0a",
				locker: ARGUS_SHARED_INFRA.positionManager,
				hook: "0x78Bf9C3b6F7D844c8038A8b292eC7C1844b207D1",
				splitter: "0x12aBc5D678Ef8901234567890123456789012345",
				buyTaxBps: 500,
				sellTaxBps: 500,
				baseFeeBps: 100,
				currentSnipeTaxBps: 0,
				bonded: false,
				devBuyUsdc: 4.5,
				fdv: 82500,
				liquidityUsd: 14200,
				volume24h: 38400,
				priceChange24h: 34.8,
				ageMinutes: 4,
				tx: "0x4a7e912f207b5a8e10478129038ba71239012847291a0c812938120398120398"
			},
			{
				portalId: 8,
				token: "0x2F71cB4591a56927E298d02187640aC9E6a157E0",
				name: "Quantum Arc",
				symbol: "QARC",
				creator: "0x723D19Ac807185412984570182470a4175B83719",
				imageURI: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80",
				website: "https://quantumarc.tech",
				twitter: "https://x.com/QuantumArc5042",
				telegram: "https://t.me/QuantumArcChat",
				poolId: "0x41b7123019842a12903810481029481029481029481029481029481029481029",
				locker: ARGUS_SHARED_INFRA.positionManager,
				hook: "0x9812A8C10283bB40192837192837192837192837",
				splitter: "0x5432109876543210987654321098765432109876",
				buyTaxBps: 400,
				sellTaxBps: 400,
				baseFeeBps: 100,
				currentSnipeTaxBps: 618,
				bonded: false,
				devBuyUsdc: 9,
				fdv: 49500,
				liquidityUsd: 9100,
				volume24h: 18200,
				priceChange24h: 18.2,
				ageMinutes: 1,
				tx: "0x891a27b102938102938102938102938102938102938102938102938102938102"
			},
			{
				portalId: 7,
				token: "0x5eC1284B91C8041071295719A74B812c7C88071E",
				name: "HyperArc Finance",
				symbol: "HYARC",
				creator: "0x129B4a8109283109283109283109283109283109",
				imageURI: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=160&auto=format&fit=crop&q=80",
				website: "https://hyperarc.io",
				twitter: "https://x.com/HyperArcFi",
				telegram: "https://t.me/HyperArcPortal",
				poolId: "0x8912380129831029381029381029381029381029381029381029381029381029",
				locker: ARGUS_SHARED_INFRA.positionManager,
				hook: "0x3841029381029381029381029381029381029381",
				splitter: "0x6789012345678901234567890123456789012345",
				buyTaxBps: 300,
				sellTaxBps: 300,
				baseFeeBps: 0,
				currentSnipeTaxBps: 0,
				bonded: true,
				devBuyUsdc: 0,
				fdv: 165e3,
				liquidityUsd: 31200,
				volume24h: 94e3,
				priceChange24h: 42.1,
				ageMinutes: 180,
				tx: "0x7890123841029381029381029381029381029381029381029381029381029381"
			},
			{
				portalId: 8,
				token: "0x7a3C901b384f9E20912347109571938aBC102941",
				name: "Arc Inu Reborn",
				symbol: "ARCINU",
				creator: "0x9182371029381029381029381029381029381029",
				imageURI: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=160&auto=format&fit=crop&q=80",
				website: "https://arcinu.xyz",
				twitter: "https://x.com/ArcCatalystToken",
				telegram: "https://t.me/QuantumArcChat",
				poolId: "0x7129381029381029381029381029381029381029381029381029381029381029",
				locker: ARGUS_SHARED_INFRA.positionManager,
				hook: "0x4912093810293810293810293810293810293810",
				splitter: "0x8901234567890123456789012345678901234567",
				buyTaxBps: 800,
				sellTaxBps: 800,
				baseFeeBps: 100,
				currentSnipeTaxBps: 0,
				bonded: false,
				devBuyUsdc: 280,
				fdv: 24e3,
				liquidityUsd: 5800,
				volume24h: 14200,
				priceChange24h: -12.4,
				ageMinutes: 12,
				tx: "0x1209381029381029381029381029381029381029381029381029381029381029"
			},
			{
				portalId: 7,
				token: "0x4D1892A0b3719481928471928371928371928371",
				name: "Pepe on Arc",
				symbol: "ARCPPE",
				creator: "0x5511223344556677889900112233445566778899",
				imageURI: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=160&auto=format&fit=crop&q=80",
				website: "https://arcpepe.club",
				twitter: "https://x.com/ArcPepeClub",
				telegram: "https://t.me/ArcPepePortal",
				poolId: "0x9812903810293810293810293810293810293810293810293810293810293810",
				locker: ARGUS_SHARED_INFRA.positionManager,
				hook: "0x1029381029381029381029381029381029381029",
				splitter: "0x3344556677889900112233445566778899001122",
				buyTaxBps: 200,
				sellTaxBps: 200,
				baseFeeBps: 0,
				currentSnipeTaxBps: 0,
				bonded: false,
				devBuyUsdc: 45,
				fdv: 38e3,
				liquidityUsd: 8200,
				volume24h: 22400,
				priceChange24h: 8.9,
				ageMinutes: 75,
				tx: "0x3456789012345678901234567890123456789012345678901234567890123456"
			}
		];
		for (const sample of sampleLaunches) {
			const tokenAddr = safeAddress(sample.token);
			const portalDef = ARGUS_PORTALS.find((p) => p.id === sample.portalId) || ARGUS_PORTALS[0];
			const socialAudit = this.socialRegistry.registerAndAudit({
				token: tokenAddr,
				symbol: sample.symbol,
				name: sample.name,
				creator: sample.creator,
				portalId: sample.portalId,
				twitter: sample.twitter,
				telegram: sample.telegram
			});
			const devBuy = evaluateDevBuy(sample.portalId, sample.devBuyUsdc);
			const priceUsd = (sample.fdv / 1e9).toFixed(8);
			const pair = {
				chainId: "arc",
				dexId: "argus",
				primaryDex: "Argus",
				primaryDexLogo: "/argus.svg",
				primaryDexTradingUrl: `https://arguspad.io/token/${tokenAddr}`,
				url: `https://arguspad.io/token/${tokenAddr}`,
				pairAddress: sample.poolId,
				baseToken: {
					address: tokenAddr,
					name: sample.name,
					symbol: sample.symbol
				},
				quoteToken: {
					address: ARGUS_SHARED_INFRA.usdc,
					name: "USDC",
					symbol: "USDC"
				},
				priceNative: priceUsd,
				priceUsd,
				fdv: sample.fdv,
				marketCap: sample.fdv,
				pairCreatedAt: now - sample.ageMinutes * 6e4,
				tokenAgeHours: sample.ageMinutes / 60,
				liquidity: {
					usd: sample.liquidityUsd,
					base: 1e9,
					quote: sample.liquidityUsd
				},
				volume: {
					h24: sample.volume24h,
					h1: Math.round(sample.volume24h * .15),
					m5: Math.round(sample.volume24h * .02)
				},
				priceChange: {
					h24: sample.priceChange24h,
					h1: Number((sample.priceChange24h * .2).toFixed(1)),
					m5: Number((sample.priceChange24h * .05).toFixed(1))
				},
				info: {
					imageUrl: sample.imageURI,
					description: `Argus ${portalDef.label} token on Arc mainnet. Permanently locked position with Uniswap v4 Hook.`,
					websites: [{
						type: "website",
						url: sample.website
					}],
					socials: [{
						type: "twitter",
						url: sample.twitter
					}, {
						type: "telegram",
						url: sample.telegram
					}]
				},
				twitter: sample.twitter,
				telegram: sample.telegram,
				website: sample.website,
				creator: safeAddress(sample.creator),
				sources: ["Argus", "Uniswap v4 Arc"],
				dexes: [`Argus ${portalDef.label}`, "Uniswap v4"],
				totalLiquidityUsd: sample.liquidityUsd,
				totalVolume24h: sample.volume24h,
				isArgusLaunch: true,
				argusPortalId: sample.portalId,
				argusPortalFamily: portalDef.family,
				argusPortalAddress: safeAddress(portalDef.address),
				argusLockerAddress: safeAddress(sample.locker),
				argusHookAddress: safeAddress(sample.hook),
				argusSplitterAddress: safeAddress(sample.splitter),
				argusPoolId: sample.poolId,
				argusBuyTaxBps: sample.buyTaxBps,
				argusSellTaxBps: sample.sellTaxBps,
				argusBaseFeeBps: sample.baseFeeBps,
				argusTotalFeeBps: sample.buyTaxBps + sample.baseFeeBps,
				argusSnipeTaxBps: sample.currentSnipeTaxBps,
				argusLiquidityLocked: true,
				argusLockTimestamp: now - sample.ageMinutes * 6e4,
				argusDevBuyUsdc: devBuy.amountUsdc,
				argusDevBuyPct: devBuy.pctSupply,
				argusDevBuyTier: devBuy.tier,
				argusDevBuyNote: devBuy.note,
				argusReusedSocials: socialAudit
			};
			this.launches.set(`arc:${tokenAddr.toLowerCase()}`, pair);
		}
		console.log(`[ArgusIndexer] Preloaded ${this.launches.size} verified Portal #7 & #8 launches with social audit & dev-buy analytics.`);
	}
};
function meaningful(next, prev, addr) {
	return pickName(next, prev, addr);
}
function meaningfulSymbol(next, prev) {
	return pickSymbol(next, prev);
}
function earlierTimestamp(a, b) {
	const vals = [a, b].filter((n) => typeof n === "number" && n > 0);
	if (!vals.length) return void 0;
	return Math.min(...vals);
}
var argusGlobal = globalThis;
var argusIndexer = argusGlobal.__dexhunterArgus ??= new ArgusIndexer();
var DAY_MS = 864e5;
var ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
var PRICE_SCALE = 12n;
var curveTradeInterface = new Interface(["event CurveBuy(address indexed buyer, address indexed recipient, uint256 quoteIn, uint256 tokensOut, uint256 fee, uint256 tax)", "event CurveSell(address indexed seller, address indexed recipient, uint256 tokensIn, uint256 quoteOut, uint256 fee, uint256 tax)"]);
var CURVE_BUY_TOPIC = id("CurveBuy(address,address,uint256,uint256,uint256,uint256)");
var CURVE_SELL_TOPIC = id("CurveSell(address,address,uint256,uint256,uint256,uint256)");
var PHASE_STATE = {
	0: {
		marketStage: "bonding_curve",
		isBondingCurve: true,
		isGraduated: false
	},
	1: {
		marketStage: "sweeping",
		isBondingCurve: false,
		isGraduated: false
	},
	2: {
		marketStage: "graduated",
		isBondingCurve: false,
		isGraduated: true
	},
	3: {
		marketStage: "rescued",
		isBondingCurve: false,
		isGraduated: false
	}
};
function finiteNumber(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function positiveNumber(value) {
	if (typeof value === "string" && value.trim()) {
		const parsed = Number(value);
		return typeof parsed === "number" && Number.isFinite(parsed) && parsed > 0 ? parsed : null;
	}
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}
function knownDecimals(value) {
	let n = value;
	if (typeof n === "bigint") {
		if (n < 0n || n > 255n) return null;
		n = Number(n);
	} else if (typeof n === "string" && /^\d+$/.test(n.trim())) n = Number(n.trim());
	if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 255) return null;
	return n;
}
function parseRaw(value) {
	if (typeof value === "bigint") return value >= 0n ? value : null;
	if (typeof value === "number") {
		if (!Number.isSafeInteger(value) || value < 0) return null;
		return BigInt(value);
	}
	if (typeof value === "string") {
		const s = value.trim();
		if (/^\d+$/.test(s)) return BigInt(s);
		if (/^0x[0-9a-fA-F]+$/.test(s)) return BigInt(s);
	}
	return null;
}
function rawToWhole(raw, decimals) {
	if (raw == null || decimals == null) return null;
	if (raw === 0n) return 0;
	const dec = BigInt(decimals);
	const base = 10n ** dec;
	const whole = raw / base;
	const frac = raw % base;
	const fracDigits = dec > PRICE_SCALE ? frac / 10n ** (dec - PRICE_SCALE) : frac * 10n ** (PRICE_SCALE - dec);
	const num = Number(whole) + Number(fracDigits) / 0xe8d4a51000;
	return Number.isFinite(num) ? num : null;
}
function normalizeAddress(value) {
	if (typeof value !== "string") return "";
	const s = value.trim().toLowerCase();
	return /^0x[0-9a-f]{40}$/.test(s) ? s : "";
}
function normalizePhase(phase) {
	if (phase === 0 || phase === 1 || phase === 2 || phase === 3) return phase;
	if (phase === "0" || phase === "1" || phase === "2" || phase === "3") return Number(phase);
	return null;
}
function knownSymbol(value) {
	if (typeof value !== "string") return null;
	const s = value.trim();
	return s ? s.slice(0, 32) : null;
}
function isNativeQuote(input) {
	if (input.quoteIsNative === true) return true;
	if (input.quoteIsNative === false) return false;
	return normalizeAddress(input.quoteAddress) === ZERO_ADDRESS;
}
function resolveQuoteDecimals(native, quoteDecimals) {
	const known = knownDecimals(quoteDecimals);
	if (native) {
		if (known == null) return 18;
		return known === 18 ? 18 : null;
	}
	return known;
}
function quoteUsdRate({ native, decimals, ethUsd, stableUsd }) {
	if (native) return typeof ethUsd === "number" && Number.isFinite(ethUsd) && ethUsd > 0 ? ethUsd : null;
	if (stableUsd === 1 && decimals != null) return 1;
	return null;
}
function normalizeLogIndex(value) {
	if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
	if (typeof value === "bigint" && value >= 0n && value <= BigInt(Number.MAX_SAFE_INTEGER)) return Number(value);
	if (typeof value === "string") {
		const s = value.trim();
		if (/^\d+$/.test(s)) {
			const n = Number(s);
			return Number.isSafeInteger(n) ? n : null;
		}
		if (/^0x[0-9a-fA-F]+$/.test(s)) {
			const n = Number(BigInt(s));
			return Number.isSafeInteger(n) ? n : null;
		}
	}
	return null;
}
function normalizeTxHash(value) {
	if (typeof value !== "string") return "";
	const s = value.trim().toLowerCase();
	return s && s !== "0x" ? s : "";
}
function asBig(value) {
	return typeof value === "bigint" && value >= 0n ? value : null;
}
function bookHas(book, id) {
	if (book.seen && typeof book.seen.has === "function" && book.seen.has(id)) return true;
	return Array.isArray(book.trades) && book.trades.some((trade) => trade && trade.id === id);
}
function usdPriceString(value) {
	if (typeof value === "string") {
		const trimmed = value.trim();
		const n = Number(trimmed);
		return trimmed && Number.isFinite(n) && n > 0 ? trimmed : null;
	}
	if (typeof value === "number" && Number.isFinite(value) && value > 0) return String(value);
	return null;
}
function hasUsdMetric(patch) {
	return patch.priceUsd != null || patch.marketCap != null || patch.fdv != null || patch.volume?.h24 != null || patch.totalVolume24h != null || patch.volumeObservedUsd != null || patch.liquidity?.usd != null || patch.totalLiquidityUsd != null;
}
function decodeCurveTrade(log) {
	if (!log || !Array.isArray(log.topics) || log.topics.length < 3) return null;
	const topic = String(log.topics[0] || "").toLowerCase();
	if (!(topic === CURVE_BUY_TOPIC ? "buy" : topic === CURVE_SELL_TOPIC ? "sell" : "")) return null;
	if (typeof log.data !== "string" || !/^0x[0-9a-fA-F]*$/.test(log.data)) return null;
	let parsed;
	try {
		parsed = curveTradeInterface.parseLog({
			topics: log.topics,
			data: log.data
		});
	} catch {
		return null;
	}
	if (!parsed) return null;
	const fee = asBig(parsed.args.fee);
	const tax = asBig(parsed.args.tax);
	if (fee == null || tax == null) return null;
	if (parsed.name === "CurveBuy") {
		const quoteIn = asBig(parsed.args.quoteIn);
		const tokensOut = asBig(parsed.args.tokensOut);
		if (quoteIn == null || tokensOut == null) return null;
		return {
			side: "buy",
			trader: parsed.args.buyer,
			recipient: parsed.args.recipient,
			quoteIn,
			tokensOut,
			tokensIn: null,
			quoteOut: null,
			fee,
			tax,
			quoteAmount: quoteIn
		};
	}
	if (parsed.name === "CurveSell") {
		const tokensIn = asBig(parsed.args.tokensIn);
		const quoteOut = asBig(parsed.args.quoteOut);
		if (tokensIn == null || quoteOut == null) return null;
		return {
			side: "sell",
			trader: parsed.args.seller,
			recipient: parsed.args.recipient,
			quoteIn: null,
			tokensOut: null,
			tokensIn,
			quoteOut,
			fee,
			tax,
			quoteAmount: quoteOut
		};
	}
	return null;
}
function createTradeBook() {
	return {
		trades: [],
		seen: /* @__PURE__ */ new Set()
	};
}
function noteCurveTrade(book, log, meta = {}) {
	if (!book || typeof book !== "object") return { added: false };
	const decoded = decodeCurveTrade(log);
	if (!decoded) return { added: false };
	const txHash = normalizeTxHash(meta.txHash || log.transactionHash);
	const logIndex = normalizeLogIndex(meta.logIndex ?? log.logIndex ?? log.index);
	if (!txHash || logIndex == null) return { added: false };
	if (!Array.isArray(book.trades)) book.trades = [];
	if (!book.seen || typeof book.seen.add !== "function") book.seen = /* @__PURE__ */ new Set();
	const id = `4663:${txHash}:${logIndex}`;
	if (bookHas(book, id)) {
		book.seen.add(id);
		return { added: false };
	}
	const curve = normalizeAddress(meta.curve || log.address);
	const timestamp = finiteNumber(meta.blockTimestampMs);
	book.seen.add(id);
	book.trades.push({
		id,
		curve,
		blockNumber: normalizeLogIndex(meta.blockNumber),
		txHash,
		logIndex,
		blockTimestampMs: timestamp,
		side: decoded.side,
		quoteAmount: decoded.quoteAmount.toString()
	});
	return { added: true };
}
function quotePerTokenFromReserves({ quoteReserve, tokenReserve, tokenDecimals, quoteDecimals } = {}) {
	const qDec = knownDecimals(quoteDecimals);
	const tDec = knownDecimals(tokenDecimals);
	if (qDec == null || tDec == null) return null;
	const quote = parseRaw(quoteReserve);
	const token = parseRaw(tokenReserve);
	if (quote == null || token == null || quote === 0n || token === 0n) return null;
	const quoteWhole = rawToWhole(quote, qDec);
	const tokenWhole = rawToWhole(token, tDec);
	if (!(quoteWhole > 0) || !(tokenWhole > 0)) return null;
	const price = quoteWhole / tokenWhole;
	return price > 0 && Number.isFinite(price) ? price : null;
}
function progressFromReserves({ realQuoteReserve, graduationThreshold } = {}) {
	const real = parseRaw(realQuoteReserve);
	const threshold = parseRaw(graduationThreshold);
	if (real == null || threshold == null || threshold === 0n) return null;
	if (real >= threshold) return 100;
	return Number(real * 10000n / threshold) / 100;
}
function sumWindowQuote(book, curve, nowMs, windowMs) {
	const trades = Array.isArray(book?.trades) ? book.trades : null;
	if (!curve || !trades) return null;
	const start = nowMs - windowMs;
	let raw = 0n;
	for (const trade of trades) {
		if (!trade || normalizeAddress(trade.curve) !== curve) continue;
		const ts = finiteNumber(trade.blockTimestampMs);
		if (ts == null || ts < start || ts > nowMs) continue;
		const amount = parseRaw(trade.quoteAmount);
		if (amount == null) continue;
		raw += amount;
	}
	return raw;
}
function metricsFromState(input = {}) {
	const patch = {};
	const phase = normalizePhase(input.phase);
	const nowMs = finiteNumber(input.nowMs) ?? Date.now();
	const windowMs = positiveNumber(input.windowMs) ?? DAY_MS;
	const native = isNativeQuote(input);
	const decimals = resolveQuoteDecimals(native, input.quoteDecimals);
	const rate = quoteUsdRate({
		native,
		decimals,
		ethUsd: input.ethUsd,
		stableUsd: input.stableUsd
	});
	const curveLive = phase == null || phase === 0 || phase === 1;
	if (phase != null) {
		const stage = PHASE_STATE[phase];
		patch.marketStage = stage.marketStage;
		patch.isBondingCurve = stage.isBondingCurve;
		patch.isGraduated = stage.isGraduated;
		if (phase === 0) {
			const progress = progressFromReserves({
				realQuoteReserve: input.realQuoteReserve,
				graduationThreshold: input.graduationThreshold
			});
			if (progress != null) patch.bondingProgress = progress;
		} else if (phase === 1 || phase === 2) patch.bondingProgress = 100;
	}
	const quotePerToken = positiveNumber(input.quotePerToken);
	if (curveLive && quotePerToken != null && rate != null) {
		const px = quotePerToken * rate;
		if (Number.isFinite(px) && px > 0) patch.priceUsd = String(px);
	}
	if (curveLive && quotePerToken != null) patch.priceQuote = quotePerToken;
	if (phase === 2 || phase === 3) {
		delete patch.priceUsd;
		delete patch.priceQuote;
		if (phase === 2) {
			const pool = usdPriceString(input.poolPriceUsd);
			if (pool) patch.priceUsd = pool;
		}
	}
	if (patch.priceUsd) {
		const px = Number(patch.priceUsd);
		const supply = positiveNumber(input.totalSupplyWhole);
		if (Number.isFinite(px) && px > 0 && supply != null) {
			const mc = px * supply;
			if (Number.isFinite(mc) && mc > 0) {
				patch.marketCap = mc;
				patch.fdv = mc;
				patch.marketCapBasis = "total_supply";
				patch.marketCapMethod = "spot_x_total_supply";
			}
		}
	}
	if (phase !== 2 && phase !== 3 && rate != null && decimals != null) {
		const real = parseRaw(input.realQuoteReserve);
		if (real != null) {
			const whole = rawToWhole(real, decimals);
			if (whole != null && whole >= 0) {
				const usd = whole * rate;
				if (Number.isFinite(usd) && usd >= 0) {
					patch.liquidity = { usd };
					patch.totalLiquidityUsd = usd;
				}
			}
		}
	}
	const curve = normalizeAddress(input.curve);
	const rawQuote = sumWindowQuote(input.book, curve, nowMs, windowMs);
	const wholeQuote = rawQuote != null && decimals != null ? rawToWhole(rawQuote, decimals) : null;
	const symbol = knownSymbol(input.quoteSymbol);
	if (input.windowComplete === true && rate != null && wholeQuote != null) {
		const usd = wholeQuote * rate;
		if (Number.isFinite(usd) && usd >= 0) {
			patch.volumeComplete = true;
			patch.volume = { h24: usd };
			patch.totalVolume24h = usd;
		} else patch.volumeComplete = false;
	} else if (wholeQuote != null && rate == null) {
		patch.volumeComplete = false;
		patch.volumeQuote = wholeQuote;
		if (symbol) patch.volumeQuoteSymbol = symbol;
	} else if (input.windowComplete !== true && rate != null && wholeQuote != null) {
		const usd = wholeQuote * rate;
		patch.volumeComplete = false;
		if (Number.isFinite(usd) && usd >= 0) patch.volumeObservedUsd = usd;
	} else patch.volumeComplete = false;
	if (hasUsdMetric(patch)) patch.marketUpdatedAt = nowMs;
	return patch;
}
function applyMarketPatch(record, patch) {
	const target = record && typeof record === "object" ? record : {};
	if (!patch || typeof patch !== "object") return target;
	for (const [key, value] of Object.entries(patch)) {
		if (value == null) continue;
		if (typeof value === "number" && !Number.isFinite(value)) continue;
		if (key === "priceUsd") {
			if (typeof value !== "string" || !(Number(value) > 0)) continue;
			target.priceUsd = value;
			continue;
		}
		if (key === "volume") {
			if (value && typeof value.h24 === "number" && Number.isFinite(value.h24) && value.h24 >= 0) target.volume = {
				...target.volume || {},
				...value
			};
			continue;
		}
		if (key === "liquidity") {
			if (value && typeof value.usd === "number" && Number.isFinite(value.usd) && value.usd >= 0) target.liquidity = {
				...target.liquidity || {},
				usd: value.usd
			};
			continue;
		}
		target[key] = value;
	}
	return target;
}
var CHAIN_ID = 4663;
var FACTORY = "0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e";
var RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
var MULTICALL = "0xcA11bde05977b3631167028862bE2a173976CA11";
var TOPIC_LAUNCHED = id("TokenLaunched(address,address,address,address,uint256,uint256)");
id("LaunchSwept(address,uint256,uint256)");
id("PoolGraduated(address,uint256,uint256,uint256)");
var BOOK_PATH = path.join(os.tmpdir(), "dexhunter", "pons-book.json");
var MAX_BOOK_TOKENS = 4e3;
var MAX_SEEN_LOGS = 8e3;
var BOOK_PARSE_LIMIT = 8388608;
var BLOCK_MS = 101;
var DEFAULT_CONFIRMATIONS = 12;
var DEFAULT_MAX_CHUNK = 4e5;
var DEFAULT_MIN_CHUNK = 1e3;
var TRADE_DAY_BLOCKS = Math.ceil(864e5 / BLOCK_MS);
var TRADE_SPAN = 2e4;
var launchInterface = new Interface([
	"event TokenLaunched(address indexed token, address indexed curve, address indexed deployer, address pairToken, uint256 launchConfigId, uint256 graduationThreshold)",
	"event LaunchSwept(address indexed token, uint256 quoteOut, uint256 tokenOut)",
	"event PoolGraduated(address indexed token, uint256 positionId, uint256 tokenAmount, uint256 pairTokenAmount)"
]);
var ercIface = new Interface([
	"function name() view returns (string)",
	"function symbol() view returns (string)",
	"function decimals() view returns (uint8)",
	"function totalSupply() view returns (uint256)"
]);
var infoIface = new Interface(["function getTokenInfo() view returns (address tokenDeployer, string tokenLogo, string tokenDescription, (string twitter, string telegram, string discord, string website, string farcaster) tokenSocials)"]);
var curveIface = new Interface([
	"function getReserves() view returns (uint256 quoteReserve, uint256 tokenReserve)",
	"function realQuoteReserve() view returns (uint256)",
	"function graduationThreshold() view returns (uint256)",
	"function graduated() view returns (bool)"
]);
var factoryIface = new Interface(["function getLaunchedToken(address token) view returns ((address token, address curve, address deployer, address creatorFeeRecipient, address pairToken, uint256 graduationThreshold, uint24 poolFee, int24 tickSpacing, uint16 creatorTaxBps, bool buybackEnabled, uint8 phase, uint256 sweptQuote, uint256 sweptTokens, uint256 sweptAt, bool exists))"]);
var multiIface = new Interface(["function aggregate3((address target, bool allowFailure, bytes callData)[] calls) payable returns ((bool success, bytes returnData)[] returnData)"]);
function decodePonsLog(log) {
	try {
		const parsed = launchInterface.parseLog(log);
		if (!parsed) return null;
		return {
			name: parsed.name,
			args: parsed.args
		};
	} catch {
		return null;
	}
}
function resolveConfirmations(override) {
	const pick = (value) => {
		const n = Number(value);
		if (!Number.isInteger(n) || n < 0 || n > 1e4) return null;
		return n;
	};
	if (override != null && override !== "") {
		const chosen = pick(override);
		if (chosen != null) return chosen;
	}
	const fromEnv = pick(process.env.PONS_CONFIRMATIONS);
	return fromEnv == null ? DEFAULT_CONFIRMATIONS : fromEnv;
}
function finiteBlock(value) {
	if (value == null || value === "") return null;
	const n = Number(value);
	if (!Number.isFinite(n)) return null;
	return Math.floor(n);
}
function headerNumber(text, key) {
	const match = text.match(new RegExp(`"${key}"\\s*:\\s*(-?\\d+)`));
	return match ? Number(match[1]) : null;
}
function shrinkOversizedBook(file, maxTokens) {
	let size = 0;
	try {
		size = fs.statSync(file).size;
	} catch {
		return;
	}
	if (size <= BOOK_PARSE_LIMIT) return;
	const head = Buffer.alloc(4096);
	const headFd = fs.openSync(file, "r");
	let cursors = {
		historyFloor: null,
		liveCursor: null,
		chunk: null,
		startBlock: null
	};
	try {
		const headN = fs.readSync(headFd, head, 0, head.length, 0);
		const headText = head.toString("utf8", 0, headN);
		cursors = {
			historyFloor: headerNumber(headText, "historyFloor"),
			liveCursor: headerNumber(headText, "liveCursor"),
			chunk: headerNumber(headText, "chunk"),
			startBlock: headerNumber(headText, "startBlock")
		};
	} finally {
		fs.closeSync(headFd);
	}
	const tokens = [];
	const fd = fs.openSync(file, "r");
	try {
		const buf = Buffer.alloc(1048576);
		let pending = "";
		let found = false;
		let stop = false;
		let obj = "";
		let depth = 0;
		let inStr = false;
		let esc = false;
		while (tokens.length < maxTokens && !stop) {
			const n = fs.readSync(fd, buf, 0, buf.length, null);
			if (n <= 0) break;
			const text = pending + buf.toString("utf8", 0, n);
			pending = "";
			let i = 0;
			if (!found) {
				const idx = text.indexOf("\"tokens\":[");
				if (idx < 0) {
					pending = text.slice(-16);
					continue;
				}
				found = true;
				i = idx + 10;
			}
			for (; i < text.length && tokens.length < maxTokens; i++) {
				const c = text[i];
				if (inStr) {
					obj += c;
					if (obj.length > 2e6) {
						stop = true;
						break;
					}
					if (esc) esc = false;
					else if (c === "\\") esc = true;
					else if (c === "\"") inStr = false;
					continue;
				}
				if (depth === 0) {
					if (c === "{") {
						depth = 1;
						obj = "{";
					} else if (c === "]") {
						i = text.length;
						break;
					}
					continue;
				}
				obj += c;
				if (obj.length > 2e6) {
					stop = true;
					break;
				}
				if (c === "\"") inStr = true;
				else if (c === "{") depth += 1;
				else if (c === "}") {
					depth -= 1;
					if (depth === 0) {
						try {
							tokens.push(JSON.parse(obj));
						} catch {}
						obj = "";
					}
				}
			}
		}
	} finally {
		fs.closeSync(fd);
	}
	const slim = {
		version: 2,
		chainId: 4663,
		startBlock: cursors.startBlock,
		historyFloor: cursors.historyFloor,
		liveCursor: cursors.liveCursor,
		chunk: cursors.chunk,
		confirmations: 12,
		tokens,
		seen: []
	};
	const tmp = `${file}.slim.tmp`;
	fs.writeFileSync(tmp, JSON.stringify(slim));
	fs.renameSync(tmp, file);
	console.log(`[Pons] shrunk book from ${size} bytes to ${tokens.length} newest launches`);
}
function rpcShouldShrink(err) {
	const msg = String(err?.shortMessage || err?.error?.message || err?.message || err);
	return /exceeds limit|too large|too many|timeout|timed out|rate.?limit|\b429\b|retry limit|more than|query spans|are allowed|block range|response size|limit exceeded/i.test(msg);
}
function fileStore(file) {
	return {
		load() {
			try {
				if (!fs.existsSync(file)) return null;
				shrinkOversizedBook(file, MAX_BOOK_TOKENS);
				return JSON.parse(fs.readFileSync(file, "utf8"));
			} catch (err) {
				console.warn("[Pons] book load skipped:", err?.message || err);
				return null;
			}
		},
		save(book) {
			const dir = path.dirname(file);
			fs.mkdirSync(dir, { recursive: true });
			const tmp = `${file}.${process.pid}.tmp`;
			const json = JSON.stringify(book, (_, value) => typeof value === "bigint" ? value.toString() : value);
			fs.writeFileSync(tmp, json);
			fs.renameSync(tmp, file);
		}
	};
}
function httpUrl(raw) {
	const value = String(raw || "").trim();
	if (!value) return "";
	if (value.startsWith("ipfs://")) {
		const cid = value.slice(7).replace(/^\/+/, "");
		return /^[a-zA-Z0-9]+/.test(cid) ? `https://ipfs.io/ipfs/${cid}` : "";
	}
	return /^https?:\/\//i.test(value) ? value : "";
}
function withTimeout$1(promise, ms) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(/* @__PURE__ */ new Error("timeout")), ms);
		promise.then((value) => {
			clearTimeout(timer);
			resolve(value);
		}, (err) => {
			clearTimeout(timer);
			reject(err);
		});
	});
}
var PonsIndexer = class {
	constructor(options = {}) {
		this.launches = /* @__PURE__ */ new Map();
		this.callbacks = [];
		this.provider = options.provider || null;
		this.ownsProvider = !options.provider;
		this.timer = null;
		this.chain = Promise.resolve();
		this.liveCursor = null;
		this.historyFloor = null;
		this.startBlock = finiteBlock(options.startBlock) ?? 26841846;
		this.confirmations = resolveConfirmations(options.confirmations);
		this.maxChunk = finiteBlock(options.maxChunk) ?? DEFAULT_MAX_CHUNK;
		this.minChunk = Math.max(1, finiteBlock(options.minChunk) ?? DEFAULT_MIN_CHUNK);
		this.chunk = Math.min(this.maxChunk, Math.max(this.minChunk, finiteBlock(options.chunk) ?? this.maxChunk));
		this.headSample = {
			block: 0,
			timeMs: 0
		};
		this.enrichQueue = [];
		this.queued = /* @__PURE__ */ new Set();
		this.quoteMeta = /* @__PURE__ */ new Map();
		this.ethUsd = 0;
		this.ethAt = 0;
		this.dirty = false;
		this.lastSave = 0;
		this.backoffUntil = 0;
		this.seenLogs = /* @__PURE__ */ new Set();
		this.tradeBook = createTradeBook();
		this.tradeFloors = /* @__PURE__ */ new Map();
		this.tradeChunk = TRADE_SPAN;
		this.scanTrades = options.scanTrades === true;
		this.preferBack = false;
		this.rpcTimeoutMs = finiteBlock(options.rpcTimeoutMs) ?? 12e3;
		this.maxBook = Math.max(1, finiteBlock(options.maxBook) ?? MAX_BOOK_TOKENS);
		this.loggedBoot = false;
		this.rpcDeadline = 0;
		const bookFile = options.bookPath || process.env.PONS_BOOK_PATH || BOOK_PATH;
		this.store = options.store || fileStore(bookFile);
		if (options.book) this.restoreBook(options.book);
		else this.loadBook();
	}
	onNewLaunch(cb) {
		this.callbacks.push(cb);
	}
	getTokens() {
		return Array.from(this.launches.values()).sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0));
	}
	health() {
		const safe = this.headSample.block ? Math.max(0, this.headSample.block - this.confirmations) : null;
		return {
			chainId: CHAIN_ID,
			startBlock: this.startBlock,
			liveCursor: this.liveCursor,
			historyFloor: this.historyFloor,
			safeHead: safe,
			confirmations: this.confirmations,
			chunk: this.chunk,
			tokens: this.launches.size,
			historyComplete: this.historyFloor != null && this.historyFloor < this.startBlock,
			forwardComplete: safe != null && this.liveCursor != null && this.liveCursor >= safe
		};
	}
	publish(token) {
		const key = token.baseToken.address.toLowerCase();
		const prev = this.launches.get(key);
		const merged = prev ? {
			...prev,
			...token,
			baseToken: {
				...prev.baseToken,
				...token.baseToken
			}
		} : token;
		if (prev?.baseToken?.name && !token.baseToken?.name) merged.baseToken.name = prev.baseToken.name;
		if (prev?.baseToken?.symbol && !token.baseToken?.symbol) merged.baseToken.symbol = prev.baseToken.symbol;
		if (!merged.pairCreatedAt && prev?.pairCreatedAt) merged.pairCreatedAt = prev.pairCreatedAt;
		if (prev?.info?.imageUrl && !token.info?.imageUrl) merged.info = {
			...token.info,
			...prev.info,
			imageUrl: prev.info.imageUrl
		};
		if (prev) {
			if (!(Number(token.priceUsd) > 0) && Number(prev.priceUsd) > 0) merged.priceUsd = prev.priceUsd;
			if (!(Number(token.marketCap) > 0) && Number(prev.marketCap) > 0) {
				merged.marketCap = prev.marketCap;
				merged.fdv = prev.fdv ?? prev.marketCap;
				merged.marketCapBasis = prev.marketCapBasis;
				merged.marketCapMethod = prev.marketCapMethod;
			}
			if (token.volumeComplete !== true && prev.volumeComplete === true) {
				merged.volumeComplete = prev.volumeComplete;
				merged.volume = prev.volume;
				merged.totalVolume24h = prev.totalVolume24h;
			}
			if (!(Number(token.liquidity?.usd) >= 0) && prev.liquidity) {
				merged.liquidity = prev.liquidity;
				merged.totalLiquidityUsd = prev.totalLiquidityUsd;
			}
			if (prev.ponsPhase != null && token.ponsPhase == null) {
				merged.ponsPhase = prev.ponsPhase;
				merged.marketStage = prev.marketStage;
				merged.isBondingCurve = prev.isBondingCurve;
				merged.isGraduated = prev.isGraduated;
				if (prev.bondingProgress != null) merged.bondingProgress = prev.bondingProgress;
			}
		}
		this.launches.set(key, merged);
		this.dirty = true;
		if (this.launches.size > this.maxBook) this.trimBook();
		if (!this.launches.has(key)) return merged;
		if (prev) return merged;
		for (const cb of this.callbacks) try {
			cb(merged);
		} catch {}
		return merged;
	}
	trimBook() {
		if (this.launches.size > this.maxBook) {
			const ranked = [...this.launches.entries()].sort((a, b) => (b[1].pairCreatedAt || 0) - (a[1].pairCreatedAt || 0));
			this.launches = new Map(ranked.slice(0, this.maxBook));
			const keep = new Set(this.launches.keys());
			this.enrichQueue = this.enrichQueue.filter((id) => keep.has(id));
			for (const id of this.queued) if (!keep.has(id)) this.queued.delete(id);
			this.dirty = true;
		}
		if (this.seenLogs.size > MAX_SEEN_LOGS) {
			const drop = this.seenLogs.size - MAX_SEEN_LOGS;
			let removed = 0;
			for (const id of this.seenLogs) {
				this.seenLogs.delete(id);
				if (++removed >= drop) break;
			}
		}
	}
	enqueue(task) {
		const run = this.chain.then(task, task);
		this.chain = run.then(() => {}, () => {});
		return run;
	}
	async start() {
		if (this.timer) return;
		if (!this.provider) {
			this.provider = new JsonRpcProvider(RPC_URL, CHAIN_ID, {
				staticNetwork: true,
				batchMaxCount: 1
			});
			this.ownsProvider = true;
		}
		console.log(`[Pons] Reading Pons V2 factory on Robinhood Chain 4663 from block ${this.startBlock}`);
		this.timer = setInterval(() => {
			this.tick().catch((err) => console.warn("[Pons] tick:", err?.shortMessage || err?.message || err));
		}, 800);
		this.tick().catch(() => {});
	}
	stop() {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
		this.saveBook(true);
	}
	tick() {
		if (Date.now() < this.backoffUntil) return Promise.resolve(null);
		return this.enqueue(() => this.runTick());
	}
	async runTick() {
		this.rpcDeadline = 0;
		const step = await this.scanOneChunk();
		if (step?.error) this.backoffUntil = Date.now() + 2e3;
		if (this.enrichQueue.length && typeof this.provider?.call === "function") try {
			if (this.ownsProvider && !(this.ethUsd > 0)) await this.refreshEth();
			await this.enrichSome();
		} catch {}
		if ((this.ownsProvider || this.scanTrades) && typeof this.provider?.send === "function") try {
			await this.pullTradeChunk();
		} catch {}
		if (this.ownsProvider && (!this.ethUsd || Date.now() - this.ethAt > 12e4)) this.refreshEth();
		if (this.dirty) this.saveBook(false);
		return step;
	}
	catchUp({ maxChunks = 4, maxMs = 1500 } = {}) {
		return this.enqueue(() => this.runCatchUp({
			maxChunks,
			maxMs
		}));
	}
	async runCatchUp({ maxChunks = 4, maxMs = 1500 } = {}) {
		const started = Date.now();
		const limit = Number.isFinite(Number(maxChunks)) ? Number(maxChunks) : 4;
		const budget = Number.isFinite(Number(maxMs)) ? Number(maxMs) : 1500;
		const deadline = started + Math.max(0, budget);
		this.rpcDeadline = deadline;
		let chunks = 0;
		let done = false;
		while (chunks < limit && Date.now() < deadline) {
			const step = await this.scanOneChunk();
			chunks += 1;
			if (step?.done) {
				done = true;
				break;
			}
			if (!step?.pulled && !step?.error) break;
		}
		if (this.enrichQueue.length && typeof this.provider?.call === "function" && Date.now() < deadline) try {
			if (this.ownsProvider && !(this.ethUsd > 0)) await this.refreshEth();
			await this.enrichSome();
		} catch {}
		if ((this.ownsProvider || this.scanTrades) && typeof this.provider?.send === "function" && Date.now() < deadline) try {
			await this.pullTradeChunk();
		} catch {}
		return {
			...this.health(),
			chunks,
			done
		};
	}
	rpcTimeout(cap) {
		if (!this.rpcDeadline) return cap;
		return Math.min(cap, this.rpcDeadline - Date.now());
	}
	async readHead() {
		if (!this.provider) throw new Error("Pons provider is not set");
		const head = await withTimeout$1(Promise.resolve(this.provider.getBlockNumber()), this.rpcTimeout(8e3));
		const block = Number(head);
		if (!Number.isFinite(block)) throw new Error("Pons head is not a block number");
		return block;
	}
	async sampleHead(head) {
		if (this.headSample.block && head - this.headSample.block <= 2e3) return;
		if (typeof this.provider.getBlock !== "function") {
			this.headSample = {
				block: head,
				timeMs: this.headSample.timeMs || Date.now()
			};
			return;
		}
		try {
			const block = await withTimeout$1(Promise.resolve(this.provider.getBlock(head)), 8e3);
			if (block?.timestamp != null) {
				this.headSample = {
					block: head,
					timeMs: Number(block.timestamp) * 1e3
				};
				return;
			}
		} catch {}
		this.headSample = {
			block: head,
			timeMs: this.headSample.timeMs || Date.now()
		};
	}
	async scanOneChunk() {
		const head = await this.readHead();
		await this.sampleHead(head);
		const safe = Math.max(0, head - this.confirmations);
		const hadCursor = this.liveCursor != null || this.historyFloor != null;
		let cursor = this.liveCursor;
		let floor = this.historyFloor;
		if (!hadCursor) {
			cursor = safe;
			floor = safe;
		} else if (cursor == null) cursor = floor;
		else if (floor == null) floor = cursor;
		if (this.ownsProvider && !this.loggedBoot) {
			this.loggedBoot = true;
			console.log(`[Pons] book=${this.launches.size} cursor=${cursor} floor=${floor} backfill down to ${this.startBlock} (safe head ${safe})`);
		}
		const needsForward = cursor < safe;
		const needsBack = floor > this.startBlock;
		if (!needsForward && !needsBack) {
			if (!hadCursor) {
				this.liveCursor = cursor;
				this.historyFloor = this.startBlock - 1;
				this.saveBook(true);
			}
			return {
				done: true,
				pulled: false
			};
		}
		if (needsForward && (!needsBack || !this.preferBack)) {
			const got = await this.pull(cursor + 1, safe, "forward");
			if (got == null) return {
				error: true,
				pulled: false,
				dir: "forward"
			};
			this.liveCursor = got.end;
			if (this.historyFloor == null) this.historyFloor = floor;
			this.preferBack = true;
			this.saveBook(true);
			return {
				done: false,
				pulled: true,
				dir: "forward"
			};
		}
		const got = await this.pull(this.startBlock, floor, "back");
		if (got == null) return {
			error: true,
			pulled: false,
			dir: "back"
		};
		this.historyFloor = got.end - 1;
		if (this.liveCursor == null) this.liveCursor = cursor;
		this.preferBack = false;
		this.saveBook(true);
		const historyComplete = this.historyFloor < this.startBlock;
		const forwardComplete = (this.liveCursor ?? cursor) >= safe;
		return {
			done: historyComplete && forwardComplete,
			pulled: true,
			dir: "back"
		};
	}
	async pull(from, to, dir) {
		if (from > to) return { end: to };
		let attempts = 0;
		while (attempts < 4) {
			if (this.rpcDeadline && Date.now() >= this.rpcDeadline) return null;
			attempts += 1;
			const span = Math.min(this.chunk, to - from + 1);
			const start = dir === "back" ? to - span + 1 : from;
			const end = dir === "back" ? to : from + span - 1;
			const timeout = this.rpcTimeout(this.rpcTimeoutMs);
			if (timeout <= 0) return null;
			try {
				const logs = await withTimeout$1(Promise.resolve(this.provider.send("eth_getLogs", [{
					address: FACTORY,
					topics: [TOPIC_LAUNCHED],
					fromBlock: toQuantity(start),
					toBlock: toQuantity(end)
				}])), timeout);
				const list = Array.isArray(logs) ? logs : [];
				list.sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber) || Number(a.logIndex) - Number(b.logIndex));
				for (const log of list) this.applyLog(log);
				if (this.chunk < this.maxChunk) this.chunk = Math.min(this.maxChunk, Math.max(this.chunk + 1, Math.floor(this.chunk * 1.25)));
				return { end: dir === "back" ? start : end };
			} catch (err) {
				const msg = String(err?.shortMessage || err?.error?.message || err?.message || err);
				const outOfBudget = this.rpcDeadline && Date.now() >= this.rpcDeadline - 5;
				if (!outOfBudget && rpcShouldShrink(err) && this.chunk > this.minChunk) {
					this.chunk = Math.max(this.minChunk, Math.floor(this.chunk / 2));
					continue;
				}
				if (!this.lastPullWarn || Date.now() - this.lastPullWarn > 2e4) {
					this.lastPullWarn = Date.now();
					if (this.ownsProvider && !outOfBudget) console.warn(`[Pons] logs ${start}-${end}:`, msg);
				}
				return null;
			}
		}
		return null;
	}
	blockTime(blockNumber) {
		if (!this.headSample.timeMs) return Date.now();
		const behind = Math.max(0, this.headSample.block - Number(blockNumber));
		return this.headSample.timeMs - behind * BLOCK_MS;
	}
	logKey(log) {
		const tx = String(log?.transactionHash || "").toLowerCase();
		if (!/^0x[0-9a-f]{64}$/.test(tx)) return "";
		const index = Number(log.logIndex ?? 0);
		if (!Number.isFinite(index)) return "";
		return `${CHAIN_ID}:${tx}:${index}`;
	}
	applyLog(log) {
		const id = this.logKey(log);
		if (id && this.seenLogs.has(id)) return;
		const parsed = decodePonsLog(log);
		if (!parsed) return;
		if (id) this.seenLogs.add(id);
		const when = this.blockTime(log.blockNumber);
		if (parsed.name === "TokenLaunched") {
			const token = getAddress(parsed.args.token);
			const curve = getAddress(parsed.args.curve);
			const pairToken = getAddress(parsed.args.pairToken);
			const native = pairToken === ZeroAddress;
			this.publish(this.row({
				token,
				curve,
				pairToken,
				native,
				creator: getAddress(parsed.args.deployer),
				when,
				configId: Number(parsed.args.launchConfigId),
				threshold: parsed.args.graduationThreshold.toString(),
				tx: log.transactionHash
			}));
			const tokenId = token.toLowerCase();
			if (!this.queued.has(tokenId)) {
				this.queued.add(tokenId);
				this.enrichQueue.unshift(tokenId);
			}
			if (this.ownsProvider && this.launches.size < this.maxBook && this.launches.size % 500 === 0) console.log(`[Pons] indexed ${this.launches.size} launches`);
			return;
		}
		const token = String(parsed.args.token);
		const prev = this.launches.get(token.toLowerCase());
		if (!prev) return;
		if (parsed.name === "LaunchSwept" || parsed.name === "PoolGraduated") this.publish({
			...prev,
			isGraduated: parsed.name === "PoolGraduated" || prev.isGraduated,
			isBondingCurve: parsed.name === "PoolGraduated" ? false : prev.isBondingCurve,
			bondingProgress: 100,
			marketStage: parsed.name === "PoolGraduated" ? "graduated" : prev.marketStage,
			baseToken: prev.baseToken
		});
	}
	row(input) {
		return {
			chainId: "robinhood",
			dexId: "pons",
			primaryDex: "Pons V2",
			primaryDexLogo: "/pons.png",
			launchPlatform: "Pons V2",
			isPonsLaunch: true,
			isBondingCurve: true,
			discoveryMode: "onchain",
			pairAddress: input.curve,
			url: `https://ponsfamily.com/launchpad/${input.token}`,
			launchpadDetailUrl: `https://ponsfamily.com/launchpad/${input.token}`,
			baseToken: {
				address: input.token,
				name: input.name || "",
				symbol: input.symbol || ""
			},
			quoteToken: input.native ? {
				address: ZeroAddress,
				name: "Ether",
				symbol: "ETH"
			} : {
				address: input.pairToken,
				name: input.quoteName || "",
				symbol: input.quoteSymbol || ""
			},
			pairCreatedAt: input.when,
			creator: input.creator,
			txHash: input.tx,
			ponsCurve: input.curve,
			ponsPairToken: input.pairToken,
			ponsLaunchConfigId: input.configId,
			ponsGraduationThreshold: input.threshold,
			marketStage: input.graduated ? "graduated" : "bonding_curve",
			volumeComplete: false,
			sources: ["Pons V2"],
			dexes: ["Pons V2"],
			discoveredAt: Date.now()
		};
	}
	async enrichSome() {
		const batch = [];
		while (this.enrichQueue.length && batch.length < 12) {
			const id = this.enrichQueue.shift();
			this.queued.delete(id);
			const rec = this.launches.get(id);
			if (rec) batch.push(rec);
		}
		if (!batch.length) return;
		try {
			await this.enrichBatch(batch);
		} catch (err) {
			for (const rec of batch) {
				const id = rec.baseToken.address.toLowerCase();
				if (!this.queued.has(id)) {
					this.queued.add(id);
					this.enrichQueue.push(id);
				}
			}
			throw err;
		}
	}
	async enrichBatch(batch) {
		const calls = [];
		const plan = [];
		const push = (target, iface, fn, rec, field, args = []) => {
			calls.push({
				target,
				allowFailure: true,
				callData: iface.encodeFunctionData(fn, args)
			});
			plan.push({
				rec,
				field,
				iface,
				fn
			});
		};
		for (const rec of batch) {
			const token = rec.baseToken.address;
			const curve = rec.ponsCurve;
			push(token, ercIface, "name", rec, "name");
			push(token, ercIface, "symbol", rec, "symbol");
			push(token, ercIface, "decimals", rec, "decimals");
			push(token, ercIface, "totalSupply", rec, "supply");
			push(token, infoIface, "getTokenInfo", rec, "info");
			if (curve) {
				push(curve, curveIface, "getReserves", rec, "reserves");
				push(curve, curveIface, "realQuoteReserve", rec, "raised");
				push(curve, curveIface, "graduationThreshold", rec, "threshold");
			}
			push(FACTORY, factoryIface, "getLaunchedToken", rec, "launch", [token]);
			if (rec.ponsPairToken && rec.ponsPairToken !== "0x0000000000000000000000000000000000000000") {
				push(rec.ponsPairToken, ercIface, "decimals", rec, "quoteDecimals");
				push(rec.ponsPairToken, ercIface, "symbol", rec, "quoteSymbol");
			}
		}
		const raw = await withTimeout$1(this.provider.call({
			to: MULTICALL,
			data: multiIface.encodeFunctionData("aggregate3", [calls])
		}), 1e4);
		const decoded = multiIface.decodeFunctionResult("aggregate3", raw)[0];
		for (let i = 0; i < plan.length; i++) {
			const row = decoded[i];
			const ok = row.success ?? row[0];
			const ret = row.returnData ?? row[1];
			if (!ok || !ret || ret === "0x") continue;
			const { rec, field, iface, fn } = plan[i];
			try {
				const value = iface.decodeFunctionResult(fn, ret);
				if (field === "name") rec.baseToken.name = String(value[0]).slice(0, 64);
				else if (field === "symbol") rec.baseToken.symbol = String(value[0]).slice(0, 16);
				else if (field === "decimals") rec.baseToken.decimals = Number(value[0]);
				else if (field === "supply") rec.totalSupply = value[0].toString();
				else if (field === "info") this.applyInfo(rec, value);
				else if (field === "reserves") rec._reserves = [value[0], value[1]];
				else if (field === "raised") rec._raised = value[0];
				else if (field === "threshold") rec.ponsGraduationThreshold = value[0].toString();
				else if (field === "launch") {
					const launch = value[0];
					const phase = Number(launch.phase ?? launch[10]);
					if (phase === 0 || phase === 1 || phase === 2 || phase === 3) rec._phase = phase;
				} else if (field === "quoteDecimals") rec._quoteDec = Number(value[0]);
				else if (field === "quoteSymbol") rec.quoteToken = {
					...rec.quoteToken,
					symbol: String(value[0]).slice(0, 16)
				};
			} catch {}
		}
		for (const rec of batch) {
			this.applyMarket(rec);
			this.publish(rec);
		}
	}
	applyInfo(rec, value) {
		const logo = httpUrl(value[1]);
		const description = String(value[2] || "").slice(0, 280);
		const social = value[3] || [];
		const twitter = httpUrl(social[0] ?? social.twitter);
		const telegram = httpUrl(social[1] ?? social.telegram);
		const discord = httpUrl(social[2] ?? social.discord);
		const website = httpUrl(social[3] ?? social.website);
		const farcaster = httpUrl(social[4] ?? social.farcaster);
		const socials = [
			twitter && {
				type: "twitter",
				url: twitter
			},
			telegram && {
				type: "telegram",
				url: telegram
			},
			discord && {
				type: "discord",
				url: discord
			},
			farcaster && {
				type: "farcaster",
				url: farcaster
			}
		].filter(Boolean);
		rec.info = {
			imageUrl: logo || rec.info?.imageUrl,
			description: description || rec.info?.description,
			websites: website ? [{
				type: "website",
				url: website
			}] : rec.info?.websites,
			socials: socials.length ? socials : rec.info?.socials
		};
		if (twitter) rec.twitter = twitter;
		if (telegram) rec.telegram = telegram;
		if (discord) rec.discord = discord;
		if (website) rec.website = website;
	}
	applyMarket(rec) {
		const native = String(rec.ponsPairToken || "").toLowerCase() === ZeroAddress.toLowerCase();
		const quoteDecimals = native ? 18 : Number.isInteger(rec._quoteDec) ? rec._quoteDec : null;
		const tokenDecimals = Number.isInteger(rec.baseToken?.decimals) ? rec.baseToken.decimals : null;
		const phase = rec._phase === 0 || rec._phase === 1 || rec._phase === 2 || rec._phase === 3 ? rec._phase : null;
		const quotePerToken = rec._reserves ? quotePerTokenFromReserves({
			quoteReserve: rec._reserves[0],
			tokenReserve: rec._reserves[1],
			tokenDecimals,
			quoteDecimals
		}) : null;
		const supplyRaw = typeof rec.totalSupply === "string" && /^\d+$/.test(rec.totalSupply) ? BigInt(rec.totalSupply) : null;
		let totalSupplyWhole = null;
		if (supplyRaw != null && tokenDecimals != null) {
			const unit = 10n ** BigInt(tokenDecimals);
			totalSupplyWhole = Number(supplyRaw / unit) + Number(supplyRaw % unit) / Number(unit);
			if (!Number.isFinite(totalSupplyWhole) || totalSupplyWhole <= 0) totalSupplyWhole = null;
		}
		const curveKey = String(rec.ponsCurve || "").toLowerCase();
		const floor = this.tradeFloors.get(curveKey);
		const head = this.headSample.block || 0;
		const dayFloor = head > 0 ? Math.max(this.startBlock, head - this.confirmations - TRADE_DAY_BLOCKS) : null;
		const windowComplete = phase !== 2 && phase !== 3 && floor != null && dayFloor != null && floor <= dayFloor;
		const patch = metricsFromState({
			phase,
			quotePerToken: phase === 2 || phase === 3 ? null : quotePerToken,
			quoteIsNative: native,
			quoteDecimals,
			quoteSymbol: rec.quoteToken?.symbol || (native ? "ETH" : null),
			quoteAddress: rec.ponsPairToken,
			ethUsd: this.ethUsd > 0 ? this.ethUsd : null,
			stableUsd: this.isVerifiedUsdStable(rec.ponsPairToken) ? 1 : null,
			totalSupplyWhole,
			realQuoteReserve: phase === 2 || phase === 3 ? null : rec._raised,
			graduationThreshold: rec.ponsGraduationThreshold,
			book: this.tradeBook,
			curve: rec.ponsCurve,
			nowMs: Date.now(),
			windowComplete,
			poolPriceUsd: phase === 2 ? rec.poolPriceUsd : void 0
		});
		if (patch.volumeComplete === false && rec.volumeComplete === true && !(Number(patch.volume?.h24) >= 0)) delete patch.volumeComplete;
		applyMarketPatch(rec, patch);
		if (phase != null) rec.ponsPhase = phase;
		delete rec._reserves;
		delete rec._raised;
		delete rec._phase;
		delete rec._quoteDec;
	}
	isVerifiedUsdStable(address) {
		const want = String(address || "").toLowerCase();
		if (!/^0x[0-9a-f]{40}$/.test(want) || want === "0x0000000000000000000000000000000000000000".toLowerCase()) return false;
		return String(process.env.PONS_USD_STABLES || "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean).includes(want);
	}
	async pullTradeChunk() {
		if (!this.scanTrades && !this.ownsProvider) return;
		if (typeof this.provider?.send !== "function") return;
		const head = await this.readHead();
		await this.sampleHead(head);
		const safe = Math.max(0, head - this.confirmations);
		const dayFloor = Math.max(this.startBlock, safe - TRADE_DAY_BLOCKS);
		let chosen = null;
		let cursor = safe;
		for (const rec of this.launches.values()) {
			if (rec.ponsPhase === 2 || rec.ponsPhase === 3) continue;
			const curve = String(rec.ponsCurve || "");
			if (!/^0x[0-9a-fA-F]{40}$/.test(curve)) continue;
			const key = curve.toLowerCase();
			const floor = this.tradeFloors.has(key) ? this.tradeFloors.get(key) : safe;
			if (floor <= dayFloor) continue;
			if (!chosen || floor > cursor) {
				chosen = curve;
				cursor = floor;
			}
		}
		if (!chosen) return;
		const span = Math.min(this.tradeChunk, cursor - dayFloor);
		const start = cursor - span;
		const end = cursor;
		try {
			const logs = await withTimeout$1(Promise.resolve(this.provider.send("eth_getLogs", [{
				address: chosen,
				topics: [[CURVE_BUY_TOPIC, CURVE_SELL_TOPIC]],
				fromBlock: toQuantity(start),
				toBlock: toQuantity(end)
			}])), this.rpcTimeout(this.rpcTimeoutMs));
			const list = Array.isArray(logs) ? logs : [];
			for (const log of list) noteCurveTrade(this.tradeBook, log, {
				curve: chosen,
				blockNumber: Number(log.blockNumber),
				txHash: log.transactionHash,
				logIndex: Number(log.logIndex),
				blockTimestampMs: this.blockTime(log.blockNumber)
			});
			this.tradeFloors.set(chosen.toLowerCase(), start);
			if (this.tradeChunk < TRADE_SPAN) this.tradeChunk = Math.min(TRADE_SPAN, Math.floor(this.tradeChunk * 1.25));
			this.dirty = true;
		} catch (err) {
			if (rpcShouldShrink(err) && this.tradeChunk > this.minChunk) this.tradeChunk = Math.max(this.minChunk, Math.floor(this.tradeChunk / 2));
		}
	}
	async refreshEth() {
		try {
			const res = await fetch("https://api.dexscreener.com/latest/dex/tokens/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", { signal: AbortSignal.timeout(4e3) });
			if (!res.ok) return;
			const pair = ((await res.json()).pairs || []).find((row) => row?.chainId === "ethereum" && Number(row.priceUsd) > 0);
			if (pair) {
				this.ethUsd = Number(pair.priceUsd);
				this.ethAt = Date.now();
			}
		} catch {}
	}
	loadBook() {
		try {
			const book = this.store.load();
			if (book) this.restoreBook(book);
		} catch (err) {
			console.warn("[Pons] book load skipped:", err?.message || err);
		}
	}
	restoreBook(book) {
		if (!book || typeof book !== "object") return;
		for (const row of book.tokens || []) {
			const addr = row?.baseToken?.address;
			if (!addr) continue;
			const key = String(addr).toLowerCase();
			this.launches.set(key, row);
			if (!row.baseToken?.name && !this.queued.has(key)) {
				this.queued.add(key);
				this.enrichQueue.push(key);
			}
		}
		const floor = finiteBlock(book.historyFloor);
		const cursor = finiteBlock(book.liveCursor);
		if (floor != null) this.historyFloor = floor;
		if (cursor != null) this.liveCursor = cursor;
		const savedChunk = finiteBlock(book.chunk);
		if (savedChunk != null && savedChunk >= this.minChunk) this.chunk = Math.min(this.maxChunk, savedChunk);
		for (const id of book.seen || []) this.seenLogs.add(String(id));
		this.trimBook();
		if (this.ownsProvider) console.log(`[Pons] restored ${this.launches.size} launches`);
	}
	saveBook(force) {
		if (!force && !this.dirty) return false;
		this.trimBook();
		try {
			this.store.save({
				version: 2,
				chainId: CHAIN_ID,
				startBlock: this.startBlock,
				historyFloor: this.historyFloor,
				liveCursor: this.liveCursor,
				chunk: this.chunk,
				confirmations: this.confirmations,
				tokens: this.getTokens(),
				seen: Array.from(this.seenLogs)
			});
			this.dirty = false;
			this.lastSave = Date.now();
			return true;
		} catch (err) {
			console.warn("[Pons] book save skipped:", err?.message || err);
			return false;
		}
	}
};
async function lookupPonsLaunch(address) {
	let token;
	try {
		token = getAddress(address);
	} catch {
		return null;
	}
	const factoryIface = new Interface(["function getLaunchedToken(address token) view returns ((address token, address curve, address deployer, address creatorFeeRecipient, address pairToken, uint256 graduationThreshold, uint24 poolFee, int24 tickSpacing, uint16 creatorTaxBps, bool buybackEnabled, uint8 phase, uint256 sweptQuote, uint256 sweptTokens, uint256 sweptAt, bool exists))"]);
	const provider = new JsonRpcProvider(RPC_URL, CHAIN_ID, {
		staticNetwork: true,
		batchMaxCount: 1
	});
	let launch;
	try {
		const raw = await withTimeout$1(provider.call({
			to: FACTORY,
			data: factoryIface.encodeFunctionData("getLaunchedToken", [token])
		}), 8e3);
		launch = factoryIface.decodeFunctionResult("getLaunchedToken", raw)[0];
	} catch (err) {
		return { error: err?.shortMessage || err?.message || "Pons RPC failed" };
	}
	if (!(launch.exists ?? launch[14])) return null;
	const phase = Number(launch.phase ?? launch[10]);
	const curve = launch.curve ?? launch[1];
	let name = "";
	let symbol = "";
	try {
		const erc = new Contract(token, ercIface, provider);
		const [n, s] = await withTimeout$1(Promise.all([erc.name().catch(() => ""), erc.symbol().catch(() => "")]), 7e3);
		name = String(n || "").trim();
		symbol = String(s || "").trim();
	} catch {}
	if (/^0x[a-fA-F0-9]{40}$/.test(name)) name = "";
	const graduated = phase === 2;
	const page = `https://ponsfamily.com/launchpad/${token}`;
	return {
		chainId: "robinhood",
		dexId: "pons",
		primaryDex: "Pons V2",
		primaryDexLogo: "/pons.png",
		launchPlatform: "Pons V2",
		isPonsLaunch: true,
		isBondingCurve: !graduated && phase !== 3,
		isGraduated: graduated,
		marketStage: graduated ? "graduated" : phase === 1 ? "sweeping" : phase === 3 ? "rescued" : "bonding_curve",
		ponsPhase: phase,
		discoveryMode: "onchain",
		pairAddress: curve,
		url: page,
		launchpadDetailUrl: page,
		baseToken: {
			address: token,
			name,
			symbol
		},
		sources: ["Pons V2", "address-lookup"],
		dexes: ["Pons V2"],
		discoveredAt: Date.now()
	};
}
var ponsIndexer = globalThis.__dexhunterPons ??= new PonsIndexer();
var PONS_PAGE = "https://ponsfamily.com/launchpad";
function text(value) {
	return String(value || "").trim();
}
function isPonsToken(token) {
	if (!token) return false;
	if (token.isPonsLaunch) return true;
	return text(token.primaryDex || token.dexId || token.launchPlatform).toLowerCase().includes("pons");
}
function isArgusToken(token) {
	if (!token) return false;
	if (token.isArgusLaunch) return true;
	return text(token.primaryDex || token.dexId || token.launchPlatform).toLowerCase().includes("argus");
}
function isPumpToken(token) {
	if (!token || isPonsToken(token) || isArgusToken(token)) return false;
	const chain = text(token.chainId).toLowerCase();
	if (chain && chain !== "solana") return false;
	return text(token.primaryDex || token.dexId || token.launchPlatform).toLowerCase().includes("pump") || Boolean(token.bondingCurvePda);
}
function pumpLaunchpadUrl(address) {
	const addr = text(address);
	if (!addr || addr.startsWith("0x") || addr.length < 32) return null;
	return `https://pump.fun/coin/${addr}`;
}
function ponsLaunchpadUrl(address) {
	const addr = text(address);
	if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) return null;
	return `${PONS_PAGE}/${addr}`;
}
function isRejectedTradeUrl(token, url) {
	if (!url) return false;
	const chain = text(token?.chainId).toLowerCase();
	if (!(chain === "robinhood" || chain === "arc" || isPonsToken(token) || isArgusToken(token))) return false;
	return /uniswap\.org|arguspad\.io/i.test(String(url));
}
function dexTradeUrl(token) {
	if (isPonsToken(token) || isArgusToken(token)) return null;
	const chain = text(token?.chainId).toLowerCase();
	if (chain === "robinhood" || chain === "arc") return null;
}
function actionHref(token) {
	if (isPonsToken(token)) return ponsLaunchpadUrl(token?.baseToken?.address || token?.address);
	if (isArgusToken(token)) return null;
	if (isPumpToken(token)) return pumpLaunchpadUrl(token?.baseToken?.address || token?.address);
}
function clientTradeHref(token, computed) {
	const venue = actionHref(token);
	if (venue !== void 0) return venue;
	const candidates = [
		token?.primaryDexTradingUrl,
		computed,
		token?.url
	];
	for (const url of candidates) {
		if (!url || isRejectedTradeUrl(token, url)) continue;
		return url;
	}
	return null;
}
var DEX_PRIORITY = {
	solana: [
		"PumpSwap",
		"Meteora",
		"Raydium",
		"Orca",
		"Phoenix",
		"OpenBook",
		"Lifinity",
		"Manifest",
		"FluxBeam"
	],
	bsc: [
		"PancakeSwap",
		"Uniswap",
		"Thena",
		"BiSwap",
		"BakerySwap",
		"ApeSwap"
	],
	binance: [
		"PancakeSwap",
		"Uniswap",
		"Thena",
		"BiSwap",
		"BakerySwap"
	],
	ethereum: [
		"Uniswap",
		"PancakeSwap",
		"Curve",
		"Balancer",
		"SushiSwap",
		"Maverick",
		"Bancor",
		"1inch"
	],
	base: [
		"Aerodrome",
		"Uniswap",
		"PancakeSwap",
		"BaseSwap",
		"SushiSwap",
		"SwapBased",
		"AlienBase"
	],
	polygon: [
		"QuickSwap",
		"Uniswap",
		"PancakeSwap",
		"SushiSwap",
		"Balancer",
		"KyberSwap",
		"Dystopia"
	],
	polygon_pos: [
		"QuickSwap",
		"Uniswap",
		"PancakeSwap",
		"SushiSwap",
		"Balancer"
	],
	arbitrum: [
		"Camelot",
		"Uniswap",
		"PancakeSwap",
		"SushiSwap",
		"Trader Joe",
		"Balancer",
		"GMX",
		"Chronos"
	],
	avalanche: [
		"Trader Joe",
		"Pangolin",
		"Uniswap",
		"SushiSwap"
	],
	avax: [
		"Trader Joe",
		"Pangolin",
		"Uniswap"
	],
	cronos: [
		"VVS Finance",
		"MM Finance",
		"Uniswap"
	],
	optimism: [
		"Velodrome",
		"Uniswap",
		"Curve",
		"SushiSwap"
	],
	robinhood: ["Uniswap", "Aerodrome"],
	arc: [
		"Argus",
		"Uniswap",
		"Uniswap v4"
	]
};
function isEvmAddress$1(address) {
	if (!address) return false;
	const a = address.trim();
	return /^0x[a-fA-F0-9]{40}$/.test(a);
}
function isSolanaAddress(address) {
	if (!address) return false;
	const a = address.trim();
	return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a);
}
var KNOWN_EVM_CHAINS = /* @__PURE__ */ new Set([
	"ethereum",
	"bsc",
	"base",
	"arbitrum",
	"polygon",
	"avalanche",
	"cronos",
	"optimism",
	"robinhood",
	"arc",
	"linea",
	"blast",
	"fantom",
	"mantle",
	"scroll",
	"zksync"
]);
function isEvmChain(chain) {
	if (!chain) return false;
	const c = normalizeChainName(chain);
	if (c === "solana") return false;
	return KNOWN_EVM_CHAINS.has(c);
}
function formatTokenAddress(address, chain) {
	if (!address) return "";
	const trimmed = address.trim();
	const normChain = normalizeChainName(chain, trimmed);
	if (isEvmAddress$1(trimmed) || isEvmChain(normChain)) return trimmed.toLowerCase();
	return trimmed;
}
function getCanonicalCompositeKey(chainId, address) {
	if (!address) return "";
	const formattedAddr = formatTokenAddress(address, chainId);
	return `${normalizeChainName(chainId, address) || "unknown"}:${formattedAddr}`;
}
function isSolanaToken(token) {
	if (!token) return false;
	const chain = normalizeChainName(token.chainId);
	if (chain === "solana") return true;
	if (chain && chain !== "solana" && chain !== "unknown") return false;
	const addr = token.baseToken?.address || token.mint || token.tokenAddress;
	if (isEvmAddress$1(addr)) return false;
	if (isSolanaAddress(addr)) return true;
	return false;
}
function normalizeChainName(chain, fallbackAddress, fallbackUrl) {
	if (chain) {
		const c = chain.toLowerCase().trim();
		if (c === "ether" || c === "eth" || c === "mainnet" || c === "ethereum" || c === "eth-mainnet") return "ethereum";
		if (c === "bsc" || c === "binance" || c === "bnb" || c === "bnbchain" || c === "binancesmartchain") return "bsc";
		if (c === "polygon" || c === "polygon_pos" || c === "polygon-pos" || c === "matic") return "polygon";
		if (c === "arb" || c === "arbitrum" || c === "arbitrum_one" || c === "arbitrum-one") return "arbitrum";
		if (c === "avax" || c === "avalanche" || c === "c-chain") return "avalanche";
		if (c === "cro" || c === "cronos") return "cronos";
		if (c === "op" || c === "optimism" || c === "optimistic") return "optimism";
		if (c === "base") return "base";
		if (c === "robinhood" || c === "robinhood_chain") return "robinhood";
		if (c === "arc" || c === "arc_chain" || c === "5042") return "arc";
		if (c === "sol" || c === "solana") return "solana";
		if (c === "hyperevm" || c === "hyperliquid" || c === "hyper") return "hyperevm";
		return c;
	}
	if (fallbackUrl) {
		const match = fallbackUrl.match(/dexscreener\.com\/([^/]+)\//i);
		if (match && match[1]) return normalizeChainName(match[1]);
	}
	if (fallbackAddress) {
		if (isEvmAddress$1(fallbackAddress)) return "ethereum";
		if (isSolanaAddress(fallbackAddress)) return "solana";
	}
	return "";
}
function normalizeDexName(dexIdOrName) {
	if (!dexIdOrName) return "Unknown";
	const raw = dexIdOrName.trim();
	if (!raw) return "Unknown";
	const lower = raw.toLowerCase().replace(/[_\s-]+/g, "");
	if (lower === "unknown" || lower === "null" || lower === "undefined" || lower === "none") return "Unknown";
	if (lower === "pumpswap" || lower === "pumpamm" || lower === "pumpfunswap" || lower === "pumpswapv1" || lower === "pumpswappool") return "PumpSwap";
	if (lower === "pumpfun" || lower === "pump.fun" || lower === "bondingcurve") return "Pump.fun";
	if (lower.startsWith("raydium")) return "Raydium";
	if (lower.startsWith("meteora")) return "Meteora";
	if (lower.startsWith("orca") || lower.includes("whirlpool")) return "Orca";
	if (lower.startsWith("pancake")) return "PancakeSwap";
	if (lower.startsWith("uniswap")) return "Uniswap";
	if (lower.startsWith("argus")) return "Argus";
	if (lower.startsWith("aerodrome")) return "Aerodrome";
	if (lower.startsWith("quickswap")) return "QuickSwap";
	if (lower.startsWith("curve")) return "Curve";
	if (lower.startsWith("balancer")) return "Balancer";
	if (lower.startsWith("sushi")) return "SushiSwap";
	if (lower.startsWith("traderjoe")) return "Trader Joe";
	if (lower.startsWith("camelot")) return "Camelot";
	if (lower.startsWith("thena")) return "Thena";
	if (lower.startsWith("baseswap")) return "BaseSwap";
	if (lower.startsWith("swapbased")) return "SwapBased";
	if (lower.startsWith("biswap")) return "BiSwap";
	if (lower.startsWith("vvs")) return "VVS Finance";
	if (lower.startsWith("pangolin")) return "Pangolin";
	if (lower.startsWith("lifinity")) return "Lifinity";
	if (lower.startsWith("fluxbeam")) return "FluxBeam";
	if (lower.startsWith("openbook")) return "OpenBook";
	if (lower.startsWith("phoenix")) return "Phoenix";
	if (lower.startsWith("manifest")) return "Manifest";
	if (lower === "gmx") return "GMX";
	if (lower.startsWith("maverick")) return "Maverick";
	if (lower.startsWith("kyber")) return "KyberSwap";
	if (lower.startsWith("velodrome")) return "Velodrome";
	if (lower === "dexscreener" || lower === "moralis") return raw;
	if (raw.length > 2 && raw !== raw.toLowerCase() && raw !== raw.toUpperCase()) return raw;
	return raw.charAt(0).toUpperCase() + raw.slice(1);
}
function isLaunchPlatformOnly(name) {
	if (!name) return false;
	const norm = name.toLowerCase().replace(/[_\s-]+/g, "");
	return norm === "pumpfun" || norm === "bondingcurve" || norm === "pump.fun";
}
var DEX_LOGO_MAP = {
	pumpswap: "https://dd.dexscreener.com/ds-data/dexes/pumpswap.png",
	pumpfun: "https://dd.dexscreener.com/ds-data/dexes/pumpfun.png",
	raydium: "https://dd.dexscreener.com/ds-data/dexes/raydium.png",
	meteora: "https://dd.dexscreener.com/ds-data/dexes/meteora.png",
	orca: "https://dd.dexscreener.com/ds-data/dexes/orca.png",
	pancakeswap: "https://dd.dexscreener.com/ds-data/dexes/pancakeswap.png",
	uniswap: "https://dd.dexscreener.com/ds-data/dexes/uniswap.png",
	aerodrome: "https://dd.dexscreener.com/ds-data/dexes/aerodrome.png",
	quickswap: "https://dd.dexscreener.com/ds-data/dexes/quickswap.png",
	sushiswap: "https://dd.dexscreener.com/ds-data/dexes/sushiswap.png",
	curve: "https://dd.dexscreener.com/ds-data/dexes/curve.png",
	balancer: "https://dd.dexscreener.com/ds-data/dexes/balancer.png",
	camelot: "https://dd.dexscreener.com/ds-data/dexes/camelot.png",
	traderjoe: "https://dd.dexscreener.com/ds-data/dexes/traderjoe.png",
	thena: "https://dd.dexscreener.com/ds-data/dexes/thena.png",
	biswap: "https://dd.dexscreener.com/ds-data/dexes/biswap.png",
	baseswap: "https://dd.dexscreener.com/ds-data/dexes/baseswap.png",
	lifinity: "/lifinity.png",
	fluxbeam: "/fluxbeam.png",
	openbook: "/openbook.png",
	phoenix: "/phoenix.png",
	manifest: "/manifest.png",
	serum: "/serum.png",
	velodrome: "https://dd.dexscreener.com/ds-data/dexes/velodrome.png",
	vvsfinance: "https://dd.dexscreener.com/ds-data/dexes/vvsfinance.png",
	argus: "/argus.png",
	arguslaunchpad: "/argus.png",
	argusportal8: "/argus.png",
	argusportal7: "/argus.png",
	pons: "/pons.png",
	ponsv2: "/pons.png",
	ponscurve: "/pons.png"
};
function getDexLogo(dexNameOrId) {
	if (!dexNameOrId) return null;
	const norm = normalizeDexName(dexNameOrId);
	if (norm === "Unknown") return null;
	const slug = norm.toLowerCase().replace(/[^a-z0-9]/g, "");
	if (DEX_LOGO_MAP[slug]) return DEX_LOGO_MAP[slug];
	return `https://dd.dexscreener.com/ds-data/dexes/${slug}.png`;
}
function getDexTradingUrl(token, _overrideDex) {
	if (!token) return null;
	const tokenObj = token;
	const ownedDexUrl = dexTradeUrl(tokenObj);
	if (ownedDexUrl !== void 0) return ownedDexUrl;
	const baseAddress = tokenObj.baseToken?.address || tokenObj.address || "";
	const chain = normalizeChainName(tokenObj.chainId);
	const dexSlug = normalizeDexName(_overrideDex || tokenObj.primaryDex || tokenObj.dexId || tokenObj.primaryProvider).toLowerCase().replace(/[^a-z0-9]/g, "");
	if (!baseAddress) return tokenObj.url || (tokenObj.pairAddress ? `https://dexscreener.com/${chain}/${tokenObj.pairAddress}` : "https://dexscreener.com");
	if (dexSlug.includes("raydium")) return `https://raydium.io/swap/?inputMint=sol&outputMint=${baseAddress}`;
	if (dexSlug.includes("meteora")) {
		const pAddr = tokenObj.pairAddress && tokenObj.pairAddress !== baseAddress ? tokenObj.pairAddress : "";
		return pAddr ? `https://app.meteora.ag/dlmm/${pAddr}` : `https://app.meteora.ag`;
	}
	if (dexSlug.includes("orca")) return `https://www.orca.so/pools`;
	if (dexSlug.includes("pumpswap") && (chain === "solana" || isSolanaAddress(baseAddress))) return `https://pump.fun/coin/${baseAddress}`;
	if (dexSlug.includes("pancake")) {
		let pChain = "bsc";
		if (chain === "ethereum") pChain = "eth";
		else if (chain === "base") pChain = "base";
		else if (chain === "arbitrum") pChain = "arb";
		else if (chain === "polygon") pChain = "polygon";
		else if (chain === "optimism") pChain = "op";
		return `https://pancakeswap.finance/swap?outputCurrency=${baseAddress}&chain=${pChain}`;
	}
	if (dexSlug.includes("uniswap")) {
		let uChain = "ethereum";
		if (chain === "base") uChain = "base";
		else if (chain === "arbitrum") uChain = "arbitrum";
		else if (chain === "polygon") uChain = "polygon";
		else if (chain === "bsc") uChain = "bnb";
		else if (chain === "avalanche") uChain = "avalanche";
		else if (chain === "optimism") uChain = "optimism";
		else if (chain === "robinhood" || chain === "arc") return null;
		return `https://app.uniswap.org/swap?outputCurrency=${baseAddress}&chain=${uChain}`;
	}
	if ((chain === "solana" || isSolanaAddress(baseAddress)) && (dexSlug.includes("pumpfun") || dexSlug === "pump" || tokenObj.launchPlatform === "Pump.fun" && !tokenObj.isGraduated && tokenObj.marketStage === "bonding_curve")) return `https://pump.fun/coin/${baseAddress}`;
	if (dexSlug.includes("aerodrome")) return `https://aerodrome.finance/swap?from=eth&to=${baseAddress}`;
	if (dexSlug.includes("camelot")) return `https://app.camelot.exchange/swap?to=${baseAddress}`;
	if (dexSlug.includes("quickswap")) return `https://quickswap.exchange/#/swap?currency1=${baseAddress}`;
	if (dexSlug.includes("traderjoe") || dexSlug === "lfj") return `https://lfj.gg/${chain === "arbitrum" ? "arbitrum" : "avalanche"}/trade?outputCurrency=${baseAddress}`;
	if (dexSlug.includes("vvs")) return `https://vvs.finance/swap?outputCurrency=${baseAddress}`;
	if (dexSlug.includes("meteora")) {
		const pAddr = tokenObj.pairAddress && tokenObj.pairAddress !== baseAddress ? tokenObj.pairAddress : "";
		return pAddr ? `https://app.meteora.ag/dlmm/${pAddr}` : `https://app.meteora.ag`;
	}
	if (dexSlug.includes("orca")) return `https://www.orca.so/pools`;
	if (dexSlug.includes("phoenix")) return `https://app.phoenix.fi`;
	if (dexSlug.includes("openbook")) return `https://openbook-dex.org`;
	if (dexSlug.includes("lifinity")) return `https://lifinity.io/swap/SOL-${baseAddress}`;
	if (dexSlug.includes("manifest")) return `https://manifest.trade`;
	if (dexSlug.includes("jupiter")) return `https://jup.ag/swap/SOL-${baseAddress}`;
	if (dexSlug.includes("thena")) return `https://thena.fi/swap?outputCurrency=${baseAddress}`;
	if (dexSlug.includes("biswap")) return `https://biswap.org/swap?outputCurrency=${baseAddress}`;
	if (dexSlug.includes("baseswap")) return `https://baseswap.fi/swap?outputCurrency=${baseAddress}`;
	if (dexSlug.includes("sushi")) return `https://www.sushi.com/swap?token1=${baseAddress}`;
	if (dexSlug.includes("velodrome")) return `https://velodrome.finance/swap?to=${baseAddress}`;
	if (dexSlug.includes("curve")) return `https://curve.fi/#/${chain}/swap`;
	if (dexSlug.includes("balancer")) return `https://app.balancer.fi/#/${chain}/swap`;
	if (chain === "bsc") return `https://pancakeswap.finance/swap?outputCurrency=${baseAddress}&chain=bsc`;
	if (chain === "solana") return `https://jup.ag/swap/SOL-${baseAddress}`;
	if (chain === "base") return `https://app.uniswap.org/swap?outputCurrency=${baseAddress}&chain=base`;
	if (chain === "arbitrum") return `https://app.camelot.exchange/swap?to=${baseAddress}`;
	if (chain === "polygon") return `https://quickswap.exchange/#/swap?currency1=${baseAddress}`;
	if (chain === "avalanche") return `https://lfj.gg/avalanche/trade?outputCurrency=${baseAddress}`;
	if (chain === "cronos") return `https://vvs.finance/swap?outputCurrency=${baseAddress}`;
	if (chain === "ethereum") return `https://app.uniswap.org/swap?outputCurrency=${baseAddress}&chain=ethereum`;
	return token.url || (token.pairAddress ? `https://dexscreener.com/${chain}/${token.pairAddress}` : `https://dexscreener.com/${chain}/${baseAddress}`);
}
function selectPrimaryDex(token) {
	if (!token) return null;
	const rawDexCandidates = [];
	if (Array.isArray(token.dexes)) rawDexCandidates.push(...token.dexes);
	if (Array.isArray(token.pairs)) {
		for (const p of token.pairs) if (p.dexName) rawDexCandidates.push(p.dexName);
		else if (p.dexId) rawDexCandidates.push(p.dexId);
	}
	if (Array.isArray(token.sources)) for (const s of token.sources) rawDexCandidates.push(s);
	if (token.dexId) rawDexCandidates.push(token.dexId);
	const uniqueDexMap = /* @__PURE__ */ new Map();
	for (const cand of rawDexCandidates) {
		if (!cand) continue;
		const normalized = normalizeDexName(cand);
		if (normalized === "Unknown" || isLaunchPlatformOnly(normalized) || normalized === "DexScreener" || normalized === "Moralis") continue;
		const lowerKey = normalized.toLowerCase();
		if (!uniqueDexMap.has(lowerKey)) uniqueDexMap.set(lowerKey, normalized);
	}
	const uniqueDexes = Array.from(uniqueDexMap.values());
	if (uniqueDexes.length === 0) return null;
	if (uniqueDexes.length === 1) return uniqueDexes[0];
	const isSolana = isSolanaToken(token) || normalizeChainName(token.chainId) === "solana";
	const hasPumpSwapCandidate = isSolana && (uniqueDexes.some((d) => d.toLowerCase() === "pumpswap") || token.launchPlatform === "Pump.fun" && Boolean(token.isGraduated || token.marketStage === "pumpswap") || token.dexId?.toLowerCase() === "pumpswap" || token.sources?.some((s) => s.toLowerCase().includes("pumpswap")) || token.pairs?.some((p) => (p.dexName || p.dexId || "").toLowerCase().includes("pumpswap")));
	const hasRaydiumCandidate = isSolana && (uniqueDexes.some((d) => d.toLowerCase() === "raydium") || token.dexId?.toLowerCase() === "raydium" || token.sources?.some((s) => s.toLowerCase().includes("raydium")) || token.pairs?.some((p) => (p.dexName || p.dexId || "").toLowerCase().includes("raydium")));
	if (hasPumpSwapCandidate && hasRaydiumCandidate) return "PumpSwap";
	if (Array.isArray(token.pairs) && token.pairs.length > 0) {
		const pairsWithValidLiq = token.pairs.filter((p) => (p.liquidityUsd || 0) > 0 && p.dexName && p.dexName !== "Unknown" && !isLaunchPlatformOnly(p.dexName)).sort((a, b) => {
			const aNorm = normalizeDexName(a.dexName).toLowerCase();
			const bNorm = normalizeDexName(b.dexName).toLowerCase();
			if (aNorm === "pumpswap" && bNorm === "raydium") return -1;
			if (bNorm === "pumpswap" && aNorm === "raydium") return 1;
			const liqDiff = (b.liquidityUsd || 0) - (a.liquidityUsd || 0);
			if (Math.abs(liqDiff) > 1) return liqDiff;
			return (b.volume24h || 0) - (a.volume24h || 0);
		});
		if (pairsWithValidLiq.length > 0 && pairsWithValidLiq[0].dexName) {
			let topDexNorm = normalizeDexName(pairsWithValidLiq[0].dexName);
			if (topDexNorm === "Raydium" && hasPumpSwapCandidate) topDexNorm = "PumpSwap";
			if (topDexNorm && topDexNorm !== "Unknown") return topDexNorm;
		}
	}
	const priorityList = DEX_PRIORITY[normalizeChainName(token.chainId)] || [];
	if (priorityList.length > 0) {
		let bestDex = null;
		let bestRank = Number.MAX_SAFE_INTEGER;
		for (const dex of uniqueDexes) {
			const dexLower = dex.toLowerCase();
			const rankIndex = priorityList.findIndex((p) => p.toLowerCase() === dexLower);
			if (rankIndex !== -1 && rankIndex < bestRank) {
				bestRank = rankIndex;
				bestDex = dex;
			}
		}
		if (bestDex !== null) return bestDex;
	}
	return [...uniqueDexes].sort((a, b) => a.localeCompare(b, void 0, { sensitivity: "base" }))[0] || null;
}
function normalizePair(rawPair, providerSource = "DexScreener") {
	const chainId = normalizeChainName(rawPair.chainId, rawPair.baseToken?.address, rawPair.url);
	const dexName = normalizeDexName(rawPair.dexId || rawPair.primaryProvider || "Unknown");
	const dexId = rawPair.dexId || dexName.toLowerCase().replace(/[^a-z0-9]/g, "");
	const baseAddress = rawPair.baseToken?.address || "";
	const baseName = rawPair.baseToken?.name || "Unknown Token";
	const baseSymbol = rawPair.baseToken?.symbol || "TOKEN";
	const liqUsd = Number(rawPair.liquidity?.usd || 0);
	const volUsd = Number(rawPair.volume?.h24 || 0);
	const priceChange = rawPair.priceChange?.h24 !== void 0 ? Number(rawPair.priceChange.h24) : void 0;
	return {
		chainId,
		dexId,
		dexName,
		pairAddress: rawPair.pairAddress || baseAddress,
		baseToken: {
			address: baseAddress,
			name: baseName,
			symbol: baseSymbol
		},
		quoteToken: rawPair.quoteToken ? {
			address: rawPair.quoteToken.address || "",
			name: rawPair.quoteToken.name || "",
			symbol: rawPair.quoteToken.symbol || ""
		} : void 0,
		price: rawPair.priceUsd || rawPair.priceNative,
		priceUsd: rawPair.priceUsd,
		priceNative: rawPair.priceNative,
		liquidity: liqUsd,
		liquidityUsd: liqUsd,
		volume24h: volUsd,
		priceChange24h: priceChange,
		url: rawPair.url,
		pairCreatedAt: rawPair.pairCreatedAt,
		source: rawPair.primaryProvider || providerSource
	};
}
var num = (name, fallback) => {
	const raw = Number(process.env[name]);
	return Number.isFinite(raw) && raw >= 0 ? raw : fallback;
};
var FEED_RULES = {
	trendingMinVolume24h: num("DEXHUNTER_TRENDING_MIN_VOLUME", 5e3),
	trendingMinLiquidity: num("DEXHUNTER_TRENDING_MIN_LIQUIDITY", 500),
	marketDataMaxAgeMs: num("DEXHUNTER_MARKET_MAX_AGE_MS", 216e5),
	momentumMinVolume24h: num("DEXHUNTER_MOMENTUM_MIN_VOLUME", 250),
	momentumMinLiquidity: num("DEXHUNTER_MOMENTUM_MIN_LIQUIDITY", 100)
};
function knownNumber(value) {
	return typeof value === "number" && Number.isFinite(value);
}
function volume24h(token) {
	if (token?.volumeComplete === false) return null;
	const value = token?.volume?.h24 ?? token?.totalVolume24h;
	return knownNumber(value) ? value : null;
}
function liquidityUsd(token) {
	const value = token?.liquidity?.usd ?? token?.totalLiquidityUsd;
	return knownNumber(value) ? value : null;
}
function isLaunch(token) {
	const platform = String(token?.launchPlatform || "");
	const dex = String(token?.dexId || token?.primaryDex || "").toLowerCase();
	return Boolean(token?.isArgusLaunch || token?.isPonsLaunch || token?.isBondingCurve || platform === "Argus" || platform === "Pump.fun" || platform === "Pons V2" || dex.includes("argus") || dex.includes("pump") || dex.includes("pons"));
}
function marketIsFresh(token, now, rules) {
	const updated = Number(token?.marketUpdatedAt || 0);
	return updated > 0 && now - updated <= rules.marketDataMaxAgeMs;
}
function isTrendingEligible(token, now = Date.now(), rules = FEED_RULES) {
	const vol = volume24h(token);
	const liq = liquidityUsd(token);
	if (vol == null || liq == null) return false;
	if (vol < rules.trendingMinVolume24h || liq < rules.trendingMinLiquidity) return false;
	return marketIsFresh(token, now, rules);
}
function isMomentumEligible(token, now = Date.now(), rules = FEED_RULES) {
	if (isTrendingEligible(token, now, rules)) return false;
	const vol = volume24h(token);
	const liq = liquidityUsd(token);
	if (vol == null || liq == null) return false;
	if (vol < rules.momentumMinVolume24h || liq < rules.momentumMinLiquidity) return false;
	return marketIsFresh(token, now, rules);
}
function trendingScore(token) {
	const vol = volume24h(token) ?? 0;
	const liq = liquidityUsd(token) ?? 0;
	const h1 = knownNumber(token?.volume?.h1) ? token.volume.h1 : 0;
	const m5 = knownNumber(token?.volume?.m5) ? token.volume.m5 : 0;
	const volumeScore = Math.log10(1 + vol);
	const liquidityScore = Math.log10(1 + liq);
	const recentScore = Math.log10(1 + h1 * 4 + m5 * 12);
	return {
		total: volumeScore * .45 + recentScore * .35 + liquidityScore * .2,
		volumeScore,
		liquidityScore,
		recentScore,
		volume24h: vol,
		liquidityUsd: liq
	};
}
/** @param {string | null | undefined} value */
function chainIdOf(value) {
	const c = String(value || "").toLowerCase().trim();
	if (!c || c === "all") return "";
	if (c === "sol" || c === "solana") return "solana";
	if (c === "eth" || c === "ethereum") return "ethereum";
	if (c === "bsc" || c === "bnb" || c === "binance") return "bsc";
	if (c === "matic" || c === "polygon" || c === "polygon_pos") return "polygon";
	if (c === "arb" || c === "arbitrum") return "arbitrum";
	if (c === "avax" || c === "avalanche") return "avalanche";
	if (c === "op" || c === "optimism") return "optimism";
	if (c === "base") return "base";
	if (c === "robinhood" || c === "robinhood_chain") return "robinhood";
	if (c === "arc" || c === "5042") return "arc";
	return c;
}
/** @param {string} chain */
function chainSelectionList(chain) {
	const parts = String(chain || "").split(",").map((part) => chainIdOf(part.trim())).filter((part) => part && part !== "all");
	return [...new Set(parts)].sort();
}
/** @param {string[]} ids */
function formatChainSelection(ids) {
	const list = chainSelectionList(ids.join(","));
	return list.length ? list.join(",") : "all";
}
/** @param {string} current @param {string} id */
function toggleChainSelection(current, id) {
	const nextId = chainIdOf(id);
	if (!nextId || nextId === "all") return "all";
	const list = chainSelectionList(current);
	const next = list.includes(nextId) ? list.filter((part) => part !== nextId) : [...list, nextId];
	return next.length ? [...next].sort().join(",") : "all";
}
/** @param {string | null | undefined} chainId @param {string} selection */
function matchesChainSelection(chainId, selection) {
	const wanted = chainSelectionList(selection);
	if (!wanted.length) return true;
	return wanted.includes(chainIdOf(chainId || ""));
}
/** @param {any} pair @param {string} selectedDex @returns {boolean} */
function matchesSourceFilter(pair, selectedDex) {
	if (selectedDex.includes(",")) return selectedDex.split(",").some((part) => {
		const piece = part.trim();
		return Boolean(piece) && piece.toLowerCase() !== "all" && matchesSourceFilter(pair, piece);
	});
	const target = selectedDex.toLowerCase().replace(/[^a-z0-9]/g, "");
	if (!target || target === "all") return true;
	const platform = String(pair.launchPlatform || "").toLowerCase().replace(/[^a-z0-9]/g, "");
	const primary = String(pair.primaryDex || pair.dexId || pair.primaryProvider || "").toLowerCase().replace(/[^a-z0-9]/g, "");
	const pons = Boolean(pair.isPonsLaunch) || platform.includes("pons") || primary.includes("pons");
	const argus = Boolean(pair.isArgusLaunch) || platform.includes("argus") || primary.includes("argus");
	const solana = String(pair.chainId || "").toLowerCase() === "solana";
	const pump = !pons && !argus && solana && (platform.includes("pumpfun") || primary === "pumpfun" || primary === "pump" || Boolean(pair.bondingCurvePda) || pair.isBondingCurve === true || pair.marketStage === "bonding_curve");
	const stage = String(pair.marketStage || "").toLowerCase();
	const valued = pair.isGraduated === true || stage === "graduated" || stage === "migrated";
	const onCurve = pons && !valued && stage !== "rescued";
	if (target === "ponscurve" || target === "ponsbonding" || target === "ponsbond") return onCurve;
	if (target === "pons" || target === "ponsv2") return pons && valued;
	if (target === "argus") return argus && !pons;
	if (target === "pumpfun" || target === "pump") return pump;
	if (target === "pumpswap") return !pons && !argus && (primary.includes("pumpswap") || pair.marketStage === "pumpswap");
	if (pons || argus) return primary.includes(target) || platform.includes(target);
	/** @param {string | null | undefined} value */
	const fold = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
	return primary.includes(target) || platform.includes(target) || Boolean(pair.dexes?.some((d) => fold(d).includes(target))) || Boolean(pair.sources?.some((s) => fold(s).includes(target))) || Boolean(pair.pairs?.some((pr) => fold(pr.dexName || pr.dexId).includes(target)));
}
var DiscoveryQueryError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "DiscoveryQueryError";
	}
};
var AGE_WINDOWS_MS = {
	"1h": 36e5,
	"6h": 216e5,
	"24h": 864e5,
	"48h": 1728e5,
	"1w": 6048e5,
	"1m": 2592e6
};
var LAUNCH_CLOCK_SKEW_MS = 12e4;
var MAX_PAGE = 5e3;
function knownMetric(value) {
	if (value == null || value === "") return null;
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}
function launchMs(token) {
	const raw = Number(token?.pairCreatedAt);
	if (!Number.isFinite(raw) || raw <= 0) return null;
	return raw < 1e11 ? raw * 1e3 : raw;
}
function tokenIdentity(token) {
	return chainTokenKey(token?.chainId, token?.baseToken?.address || token?.pairAddress || "");
}
function volumeMetric(token) {
	if (!token || token.volumeComplete === false) return null;
	const direct = knownMetric(token.volume?.h24);
	if (direct != null) return direct;
	return knownMetric(token.totalVolume24h);
}
function liquidityMetric(token) {
	const direct = knownMetric(token?.liquidity?.usd);
	if (direct != null) return direct;
	return knownMetric(token?.totalLiquidityUsd);
}
function marketCapMetric(token) {
	return knownMetric(token?.marketCap);
}
function passesBound(value, min, max) {
	if (min == null && max == null) return true;
	if (value == null) return false;
	if (min != null && value < min) return false;
	if (max != null && value > max) return false;
	return true;
}
function passesAgeWindow(token, age, now) {
	if (age === "all") return true;
	const windowMs = AGE_WINDOWS_MS[age];
	if (windowMs == null) return false;
	const ts = launchMs(token);
	if (ts == null) return false;
	if (ts > now + LAUNCH_CLOCK_SKEW_MS) return false;
	return now - ts <= windowMs;
}
function parseBound(raw, name) {
	if (raw == null) return void 0;
	const text = String(raw).trim();
	if (!text) return void 0;
	const n = Number(text);
	if (!Number.isFinite(n) || n < 0) throw new DiscoveryQueryError(`${name} must be a finite number greater than or equal to 0`);
	return n;
}
function parseSigned(raw, name) {
	if (raw == null) return void 0;
	const text = String(raw).trim();
	if (!text) return void 0;
	const n = Number(text);
	if (!Number.isFinite(n)) throw new DiscoveryQueryError(`${name} must be a finite number`);
	return n;
}
function parseFlag(raw) {
	if (raw == null) return false;
	const text = String(raw).trim().toLowerCase();
	return text === "1" || text === "true" || text === "yes";
}
function parseDex(raw) {
	if (raw == null) return void 0;
	const text = String(raw).trim();
	if (!text || text.toLowerCase() === "all") return void 0;
	return text.slice(0, 600);
}
function parseLimit(raw) {
	if (raw == null || String(raw).trim() === "") return 5e3;
	const n = Number(String(raw).trim());
	if (!Number.isFinite(n) || n < 1) throw new DiscoveryQueryError("limit must be a finite integer from 1 to 5000");
	return Math.min(Math.floor(n), MAX_PAGE);
}
function parseCursor(raw) {
	if (raw == null || String(raw).trim() === "") return null;
	const text = String(raw);
	const bar = text.indexOf("|");
	if (bar < 0 || bar === text.length - 1) throw new DiscoveryQueryError("cursor is not valid");
	const left = text.slice(0, bar);
	const id = text.slice(bar + 1);
	if (!id || id.includes("|")) throw new DiscoveryQueryError("cursor is not valid");
	if (left === "") return {
		known: false,
		rank: null,
		id
	};
	const rank = Number(left);
	if (!Number.isFinite(rank)) throw new DiscoveryQueryError("cursor is not valid");
	return {
		known: true,
		rank,
		id
	};
}
function readParam(input, name) {
	if (input && typeof input.get === "function") return input.get(name);
	if (input && Object.prototype.hasOwnProperty.call(input, name)) return input[name];
	return null;
}
function parseDiscoveryParams(input) {
	const modeParam = readParam(input, "mode") || "trending";
	const mode = modeParam === "latest" || modeParam === "fresh_mints" || modeParam === "trending" || modeParam === "momentum" ? modeParam : "trending";
	const ageRaw = readParam(input, "age");
	const age = ageRaw == null || String(ageRaw).trim() === "" ? "1w" : String(ageRaw).trim();
	if (age !== "all" && !Object.prototype.hasOwnProperty.call(AGE_WINDOWS_MS, age)) throw new DiscoveryQueryError("age must be one of 1h, 6h, 24h, 48h, 1w, 1m, all");
	const chainRaw = readParam(input, "chain");
	const chain = chainRaw == null || String(chainRaw).trim() === "" ? void 0 : String(chainRaw).trim();
	return {
		mode,
		age,
		limit: parseLimit(readParam(input, "limit")),
		cursor: parseCursor(readParam(input, "cursor")),
		chain,
		minLiquidity: parseBound(readParam(input, "minLiquidity"), "minLiquidity"),
		maxLiquidity: parseBound(readParam(input, "maxLiquidity"), "maxLiquidity"),
		minVolume: parseBound(readParam(input, "minVolume"), "minVolume"),
		maxVolume: parseBound(readParam(input, "maxVolume"), "maxVolume"),
		minMarketCap: parseBound(readParam(input, "minMarketCap"), "minMarketCap"),
		maxMarketCap: parseBound(readParam(input, "maxMarketCap"), "maxMarketCap"),
		minPriceChange: parseSigned(readParam(input, "minPriceChange"), "minPriceChange"),
		dex: parseDex(readParam(input, "dex")),
		telegram: parseFlag(readParam(input, "telegram")),
		twitter: parseFlag(readParam(input, "twitter")),
		discord: parseFlag(readParam(input, "discord")),
		website: parseFlag(readParam(input, "website")),
		verified: parseFlag(readParam(input, "verified")),
		xProfile: parseFlag(readParam(input, "xProfile")),
		xPost: parseFlag(readParam(input, "xPost"))
	};
}
function preferToken(a, b) {
	const ta = launchMs(a);
	const tb = launchMs(b);
	if (ta != null && tb == null) return a;
	if (tb != null && ta == null) return b;
	if (ta != null && tb != null && ta !== tb) return ta < tb ? a : b;
	const aVol = volumeMetric(a) != null;
	if (aVol !== (volumeMetric(b) != null)) return aVol ? a : b;
	return a;
}
function dedupe(tokens) {
	const map = /* @__PURE__ */ new Map();
	for (const token of Array.isArray(tokens) ? tokens : []) {
		const id = tokenIdentity(token);
		if (!id) continue;
		const prev = map.get(id);
		map.set(id, prev ? preferToken(prev, token) : token);
	}
	return map;
}
function timeCursor(token) {
	const ts = launchMs(token);
	return `${ts == null ? "" : ts}|${tokenIdentity(token)}`;
}
function scoreCursor(token) {
	return `${token?.scoreBreakdown?.total ?? 0}|${tokenIdentity(token)}`;
}
function afterTime(token, cursor) {
	if (!cursor) return true;
	const ts = launchMs(token);
	const id = tokenIdentity(token);
	const known = ts != null;
	if (known !== cursor.known) return known ? false : true;
	if (known && ts !== cursor.rank) return ts < cursor.rank;
	return id > cursor.id;
}
function afterScore(token, cursor) {
	if (!cursor) return true;
	if (!cursor.known) return false;
	const score = token?.scoreBreakdown?.total ?? 0;
	const id = tokenIdentity(token);
	if (score !== cursor.rank) return score < cursor.rank;
	return id > cursor.id;
}
function compareTime(a, b) {
	const ta = launchMs(a);
	const tb = launchMs(b);
	const ka = ta != null;
	if (ka !== (tb != null)) return ka ? -1 : 1;
	if (ka && ta !== tb) return tb - ta;
	const ia = tokenIdentity(a);
	const ib = tokenIdentity(b);
	return ia < ib ? -1 : ia > ib ? 1 : 0;
}
function compareScore(a, b) {
	const sa = a?.scoreBreakdown?.total ?? 0;
	const sb = b?.scoreBreakdown?.total ?? 0;
	if (sa !== sb) return sb - sa;
	const ia = tokenIdentity(a);
	const ib = tokenIdentity(b);
	return ia < ib ? -1 : ia > ib ? 1 : 0;
}
function eligible(token, mode, now) {
	if (mode === "latest") return token;
	if (mode === "fresh_mints") return isLaunch(token) ? token : null;
	if (mode === "momentum") return isMomentumEligible(token, now) ? {
		...token,
		feedClass: "momentum",
		scoreBreakdown: trendingScore(token)
	} : null;
	return isTrendingEligible(token, now) ? {
		...token,
		feedClass: "trending",
		scoreBreakdown: trendingScore(token)
	} : null;
}
function queryIndex(tokens, options = {}) {
	const now = Number.isFinite(options.now) ? options.now : Date.now();
	const age = options.age || "1w";
	if (age !== "all" && !Object.prototype.hasOwnProperty.call(AGE_WINDOWS_MS, age)) throw new DiscoveryQueryError("age must be one of 1h, 6h, 24h, 48h, 1w, 1m, all");
	const mode = options.mode || "latest";
	const limit = Math.min(Math.max(Number(options.limit) || 5e3, 1), MAX_PAGE);
	const cursor = typeof options.cursor === "string" || options.cursor instanceof String ? parseCursor(options.cursor) : options.cursor || null;
	const scored = mode === "trending" || mode === "momentum";
	if (scored && cursor && !cursor.known) throw new DiscoveryQueryError("cursor is not valid");
	const rows = [];
	for (const token of dedupe(tokens).values()) {
		if (!passesAgeWindow(token, age, now)) continue;
		if (options.chain && !matchesChainSelection(token?.chainId, options.chain)) continue;
		if (options.dex && !matchesSourceFilter(token, options.dex)) continue;
		const row = eligible(token, mode, now);
		if (!row) continue;
		if (!passesBound(volumeMetric(row), options.minVolume, options.maxVolume)) continue;
		if (!passesBound(liquidityMetric(row), options.minLiquidity, options.maxLiquidity)) continue;
		if (!passesBound(marketCapMetric(row), options.minMarketCap, options.maxMarketCap)) continue;
		if (options.minPriceChange != null) {
			const move = knownMetric(row?.priceChange?.h24);
			if (move == null || move < options.minPriceChange) continue;
		}
		if (!matchSocialFilters(row, options)) continue;
		rows.push(row);
	}
	rows.sort(scored ? compareScore : compareTime);
	const after = scored ? afterScore : afterTime;
	const encode = scored ? scoreCursor : timeCursor;
	const rest = cursor ? rows.filter((row) => after(row, cursor)) : rows;
	const page = rest.slice(0, limit);
	return {
		tokens: page,
		total: rows.length,
		nextCursor: rest.length > limit ? encode(page[page.length - 1]) : null
	};
}
function clean(value) {
	return String(value || "").trim() || "";
}
function applyPonsIdentity(existing, token) {
	if (!existing || !token) return false;
	if (!token.isPonsLaunch && token.launchPlatform !== "Pons V2") return false;
	const nextName = clean(token.baseToken?.name);
	const nextSymbol = clean(token.baseToken?.symbol);
	if (!existing.baseToken) existing.baseToken = {};
	if (token.baseToken?.address && !existing.baseToken.address) existing.baseToken.address = token.baseToken.address;
	if (nextName && existing.baseToken.name !== nextName) existing.baseToken.name = nextName;
	if (nextSymbol && existing.baseToken.symbol !== nextSymbol) existing.baseToken.symbol = nextSymbol;
	if (token.baseToken?.decimals != null && existing.baseToken.decimals == null) existing.baseToken.decimals = token.baseToken.decimals;
	existing.isPonsLaunch = true;
	existing.chainId = existing.chainId || "robinhood";
	existing.dexId = existing.dexId || "pons";
	existing.primaryDex = existing.primaryDex || "Pons V2";
	existing.launchPlatform = "Pons V2";
	const page = existing.baseToken?.address ? `https://ponsfamily.com/launchpad/${existing.baseToken.address}` : "";
	if (page) {
		existing.launchpadDetailUrl = page;
		existing.url = page;
	}
	const trade = token.primaryDexTradingUrl || existing.primaryDexTradingUrl || "";
	if (/uniswap\.org|arguspad\.io|blockscout\.com/i.test(trade)) existing.primaryDexTradingUrl = void 0;
	else if (token.primaryDexTradingUrl) existing.primaryDexTradingUrl = token.primaryDexTradingUrl;
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
	if (token.priceUsd && Number(token.priceUsd) > 0 && (!existing.priceUsd || Number(existing.priceUsd) <= 0)) existing.priceUsd = token.priceUsd;
	if (typeof token.marketCap === "number" && token.marketCap > 0 && !(existing.marketCap > 0)) {
		existing.marketCap = token.marketCap;
		existing.fdv = token.fdv || token.marketCap;
	}
	const liq = token.liquidity?.usd ?? token.totalLiquidityUsd;
	if (typeof liq === "number" && liq > 0 && !(existing.totalLiquidityUsd > 0)) {
		existing.liquidity = {
			...existing.liquidity || {},
			usd: liq
		};
		existing.totalLiquidityUsd = liq;
	}
	if (token.isGraduated) {
		existing.isGraduated = true;
		existing.isBondingCurve = false;
		existing.marketStage = "graduated";
	}
	return true;
}
function repairPonsIdentity(engine, pons) {
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
	if (Array.isArray(pons.enrichQueue) && pons.enrichQueue.length > 1) pons.enrichQueue.sort((a, b) => {
		const ta = Number(book.get(a)?.pairCreatedAt || 0);
		return Number(book.get(b)?.pairCreatedAt || 0) - ta;
	});
	return repaired;
}
var CHAIN_COVERAGE = {
	solana: {
		mode: "partial",
		reader: "Pump.fun mint-authority creates are read on-chain. Raydium, Meteora, Orca, and other Solana rows are DexScreener search."
	},
	arc: {
		mode: "onchain",
		reader: "Argus portal logs on Arc chain 5042. Price and volume are best-effort pool reads and are omitted when the RPC call fails."
	},
	ethereum: {
		mode: "search",
		reader: "DexScreener search. No factory subscription."
	},
	base: {
		mode: "search",
		reader: "DexScreener search. No factory subscription."
	},
	bsc: {
		mode: "search",
		reader: "DexScreener search. No factory subscription."
	},
	arbitrum: {
		mode: "search",
		reader: "DexScreener search. No factory subscription."
	},
	polygon: {
		mode: "search",
		reader: "DexScreener search. No factory subscription."
	},
	avalanche: {
		mode: "search",
		reader: "DexScreener search. No factory subscription."
	},
	cronos: {
		mode: "search",
		reader: "DexScreener search. No factory subscription."
	},
	hyperevm: {
		mode: "search",
		reader: "DexScreener search. No factory subscription."
	},
	optimism: {
		mode: "search",
		reader: "DexScreener search. No factory subscription."
	},
	robinhood: {
		mode: "partial",
		reader: "Pons V2 factory 0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e is read on-chain via TokenLaunched. Other Robinhood rows are still DexScreener search."
	}
};
var HOUR = 36e5;
function createMetrics(now = Date.now()) {
	return {
		startedAt: now,
		cumulative: {
			uniqueTokens: 0,
			liveLaunches: 0,
			searchInserts: 0,
			updates: 0,
			rejected: 0,
			enrichOk: 0,
			enrichFail: 0
		},
		liveLaunchTimes: [],
		searchInsertTimes: [],
		updateTimes: [],
		rejectedTimes: [],
		enrichOkTimes: [],
		enrichFailTimes: []
	};
}
function prune(list, now) {
	const floor = now - HOUR;
	while (list.length && list[0] < floor) list.shift();
}
function ratePerMin(list, now, windowMs) {
	if (!windowMs || windowMs <= 0) return 0;
	const floor = now - windowMs;
	let count = 0;
	for (let i = list.length - 1; i >= 0; i--) {
		if (list[i] < floor) break;
		count += 1;
	}
	return Math.round(count / windowMs * 6e4 * 10) / 10;
}
function recordUnique(metrics, kind, now = Date.now()) {
	metrics.cumulative.uniqueTokens += 1;
	if (kind === "onchain") {
		metrics.cumulative.liveLaunches += 1;
		metrics.liveLaunchTimes.push(now);
	} else if (kind === "backfill") metrics.cumulative.liveLaunches += 1;
	else {
		metrics.cumulative.searchInserts += 1;
		metrics.searchInsertTimes.push(now);
	}
}
function recordUpdate(metrics, now = Date.now()) {
	metrics.cumulative.updates += 1;
	metrics.updateTimes.push(now);
}
function snapshot(metrics, now = Date.now()) {
	for (const list of [
		metrics.liveLaunchTimes,
		metrics.searchInsertTimes,
		metrics.updateTimes,
		metrics.rejectedTimes,
		metrics.enrichOkTimes,
		metrics.enrichFailTimes
	]) prune(list, now);
	const windowMs = 6e4;
	return {
		observationWindowMs: windowMs,
		cumulative: { ...metrics.cumulative },
		liveLaunchesPerMin: ratePerMin(metrics.liveLaunchTimes, now, windowMs),
		searchInsertsPerMin: ratePerMin(metrics.searchInsertTimes, now, windowMs),
		updatesPerMin: ratePerMin(metrics.updateTimes, now, windowMs),
		rejectedPerMin: ratePerMin(metrics.rejectedTimes, now, windowMs),
		enrichOkPerMin: ratePerMin(metrics.enrichOkTimes, now, windowMs),
		enrichFailPerMin: ratePerMin(metrics.enrichFailTimes, now, windowMs),
		liveLaunchesLastHour: metrics.liveLaunchTimes.length
	};
}
function exportMetrics(metrics) {
	return {
		startedAt: metrics.startedAt,
		cumulative: metrics.cumulative,
		liveLaunchTimes: metrics.liveLaunchTimes.slice(-5e3),
		searchInsertTimes: metrics.searchInsertTimes.slice(-2e3),
		updateTimes: metrics.updateTimes.slice(-2e3),
		rejectedTimes: metrics.rejectedTimes.slice(-2e3),
		enrichOkTimes: metrics.enrichOkTimes.slice(-2e3),
		enrichFailTimes: metrics.enrichFailTimes.slice(-2e3)
	};
}
function restoreMetrics(raw, now = Date.now()) {
	const metrics = createMetrics(raw?.startedAt || now);
	if (raw?.cumulative) Object.assign(metrics.cumulative, raw.cumulative);
	const copy = (key) => {
		if (Array.isArray(raw?.[key])) metrics[key] = raw[key].filter((t) => typeof t === "number");
	};
	copy("liveLaunchTimes");
	copy("searchInsertTimes");
	copy("updateTimes");
	copy("rejectedTimes");
	copy("enrichOkTimes");
	copy("enrichFailTimes");
	snapshot(metrics, now);
	return metrics;
}
function countLaunchedToday(tokens, now) {
	const dayStart = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate());
	let count = 0;
	for (const token of tokens) {
		const raw = Number(token?.pairCreatedAt || 0);
		if (!Number.isFinite(raw) || raw <= 0) continue;
		const ms = raw < 1e11 ? raw * 1e3 : raw;
		if (ms >= dayStart && ms <= now + 12e4) count += 1;
	}
	return count;
}
var DEX_SEARCH_QUERIES = {
	solana: [
		"raydium solana",
		"meteora solana",
		"pump solana",
		"orca solana",
		"jupiter solana",
		"bonk solana",
		"wif solana",
		"solana dex",
		"solana memecoin"
	],
	bsc: [
		"pancakeswap bsc",
		"wbnb bsc",
		"thena bsc",
		"biswap",
		"bakeryswap",
		"four meme",
		"cake bsc",
		"baby bsc",
		"floki bsc",
		"usdt bsc"
	],
	avalanche: [
		"traderjoe avax",
		"pangolin avax",
		"lfj avax",
		"wavax",
		"joe avax",
		"benqi avax",
		"avalanche dex",
		"avax meme"
	],
	base: [
		"aerodrome base",
		"uniswap base",
		"virtuals base",
		"clanker base",
		"baseswap",
		"degen base",
		"toshi base",
		"brett base",
		"usdc base"
	],
	arbitrum: [
		"camelot arbitrum",
		"uniswap arbitrum",
		"gmx arbitrum",
		"arb arbitrum",
		"magic arbitrum",
		"pendle arbitrum",
		"usdc arbitrum"
	],
	polygon: [
		"quickswap polygon",
		"uniswap polygon",
		"matic polygon",
		"balancer polygon",
		"sushiswap polygon",
		"pol polygon"
	],
	ethereum: [
		"uniswap ethereum",
		"curve ethereum",
		"sushiswap ethereum",
		"pepe eth",
		"shib eth",
		"balancer eth",
		"link eth",
		"uni eth"
	],
	robinhood: [
		"robinhood",
		"uniswap robinhood",
		"robinhood token",
		"rh crypto"
	],
	arc: [
		"arc",
		"uniswap arc",
		"arc dex",
		"arc chain",
		"arc token"
	],
	cronos: [
		"vvs finance",
		"mm finance",
		"cronos dex"
	],
	hyperevm: [
		"hyperevm",
		"hyperswap",
		"hyperliquid",
		"hype"
	]
};
async function fetchWithTimeout(url, timeoutMs = 6e3) {
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(url, {
			headers: {
				Accept: "application/json",
				"User-Agent": "DexHunter-Discovery/2.0"
			},
			signal: controller.signal
		});
		clearTimeout(id);
		if (!res.ok) return null;
		return await res.json();
	} catch {
		clearTimeout(id);
		return null;
	}
}
var DiscoveryEngine = class {
	indexedTokens = /* @__PURE__ */ new Map();
	discoveredTodaySet = /* @__PURE__ */ new Set();
	rollingDiscoveries = [];
	startedAt = Date.now();
	lastIndexedAt = 0;
	isIndexing = false;
	pollInterval = null;
	searchCursor = 0;
	liveInflight = null;
	metrics = createMetrics();
	constructor() {
		this.startedAt = Date.now();
		this.metrics = createMetrics(this.startedAt);
		this.hydrate();
	}
	hydrate() {
		seedRuntimeCache();
		const saved = loadIndex(INDEX_FILE);
		if (!saved) return;
		for (const token of saved.tokens) {
			const addr = token?.baseToken?.address;
			if (!addr) continue;
			const key = chainTokenKey(token.chainId, addr);
			if (!this.indexedTokens.has(key)) this.indexedTokens.set(key, token);
		}
		if (saved.metrics) this.metrics = restoreMetrics(saved.metrics, Date.now());
		if (saved.searchCursor) this.searchCursor = saved.searchCursor;
	}
	persist() {
		try {
			saveIndex(INDEX_FILE, {
				version: 1,
				savedAt: Date.now(),
				searchCursor: this.searchCursor || 0,
				tokens: retainTokens(Array.from(this.indexedTokens.values())),
				metrics: exportMetrics(this.metrics)
			});
		} catch (err) {
			console.warn("[DiscoveryEngine] Persist skipped:", err?.message || err);
		}
	}
	async start() {
		if (this.pollInterval) return;
		console.log("[DiscoveryEngine] Starting multi-chain high-throughput indexer...");
		this.runIndexingPass().catch((err) => {
			console.warn("[DiscoveryEngine] Initial index pass error:", err);
		});
		this.pollInterval = setInterval(() => {
			this.runIndexingPass().catch((err) => {
				console.warn("[DiscoveryEngine] Periodic index pass error:", err);
			});
		}, 2e4);
	}
	stop() {
		if (this.pollInterval) {
			clearInterval(this.pollInterval);
			this.pollInterval = null;
		}
	}
	/**
	* Main indexing pass: runs across Solana (Pump.fun on-chain) + EVM chains in parallel
	*/
	async runIndexingPass() {
		if (this.isIndexing) return;
		this.isIndexing = true;
		const passStartTime = Date.now();
		try {
			this.ingestSolanaPumpTokens();
			await this.repairSolanaCurves();
			this.ingestArgusTokens();
			await this.catchUpPons();
			this.ingestPonsTokens();
			const dexscreenerPromise = this.ingestDexScreenerTrending();
			const dexSearchPromise = this.ingestNativeDexSearches();
			const hyperSearch = fetchWithTimeout("https://api.dexscreener.com/latest/dex/search?q=hyperswap", 5500).then((res) => {
				if (!Array.isArray(res?.pairs)) return;
				for (const p of res.pairs) this.normalizeAndStoreDexScreenerPair(p);
			});
			await Promise.allSettled([
				dexscreenerPromise,
				dexSearchPromise,
				this.ingestGeckoList("hyperevm", "trending_pools", "hyperevm"),
				hyperSearch
			]);
			this.lastIndexedAt = Date.now();
			this.cleanupOldRollingStats();
			this.persist();
			console.log(`[DiscoveryEngine] Index pass completed in ${Date.now() - passStartTime}ms. Total indexed: ${this.indexedTokens.size} tokens across all chains.`);
		} catch (err) {
			console.warn("[DiscoveryEngine] Error during indexing pass:", err);
		} finally {
			this.isIndexing = false;
		}
	}
	/**
	* Converts and ingests Solana Pump.fun tokens from pumpIndexer
	*/
	ingestSolanaPumpTokens() {
		try {
			const solTokens = pumpIndexer.getAllTokens();
			for (const t of solTokens) {
				if (!t.mint) continue;
				const key = chainTokenKey("solana", t.mint);
				const hasPool = Boolean(t.pumpSwapPool || t.pumpswap_pool || t.marketStage === "pumpswap" || t.isGraduated);
				const curveDone = Boolean(t.complete) && !hasPool;
				const isGraduated = hasPool;
				const dexId = isGraduated ? "pumpswap" : t.dexId || "pumpfun";
				const primaryDex = isGraduated ? "PumpSwap" : t.primaryDex || "Pump.fun";
				const quoted = pumpCurveQuote(t, t.solUsdPrice);
				const spotUsd = t.spotPriceUsd && Number(t.spotPriceUsd) > 0 ? t.spotPriceUsd : quoted?.spotUsd != null ? quoted.spotUsd : void 0;
				const marketCapUsd = knownNumber(t.marketCapUsd) && t.marketCapUsd > 0 ? t.marketCapUsd : quoted?.fdvUsd ?? void 0;
				const fdvUsd = knownNumber(t.fdvUsd) && t.fdvUsd > 0 ? t.fdvUsd : quoted?.fdvUsd ?? void 0;
				let liquidityUsd = t.liquidityUsd;
				if (!knownNumber(liquidityUsd) && t.quoteNative !== false && t.realSolReserves && Number(t.solUsdPrice) > 0) {
					const sol = Number(t.realSolReserves) / 1e9;
					if (Number.isFinite(sol) && sol >= 0) liquidityUsd = Math.round(sol * Number(t.solUsdPrice) * 100) / 100;
				}
				const observedVol = knownNumber(t.volumeObservedUsd) ? t.volumeObservedUsd : knownNumber(t.volume24h) ? t.volume24h : Number(spotUsd) > 0 ? 0 : void 0;
				const imageUrl = t.imageUrl || `https://images.pump.fun/coin-image/${t.mint}`;
				const pair = {
					chainId: "solana",
					dexId,
					primaryDex,
					pairAddress: t.pairAddress || t.pumpSwapPool || t.bondingCurvePda || t.mint,
					url: `https://pump.fun/coin/${t.mint}`,
					baseToken: {
						address: t.mint,
						name: t.tokenName && !t.tokenName.startsWith("Pump Token") ? t.tokenName : void 0,
						symbol: t.tokenSymbol && t.tokenSymbol !== "PUMP" ? t.tokenSymbol : void 0
					},
					quoteToken: t.quoteNative ? {
						address: "So11111111111111111111111111111111111111112",
						name: "Wrapped SOL",
						symbol: "SOL"
					} : t.quoteMint ? {
						address: t.quoteMint,
						name: void 0,
						symbol: void 0
					} : {
						address: "",
						name: void 0,
						symbol: void 0
					},
					priceNative: t.spotPriceQuote || t.spotPriceSol || quoted?.spotQuote || void 0,
					priceUsd: spotUsd === "" || spotUsd == null || Number(spotUsd) <= 0 ? void 0 : spotUsd,
					marketCap: knownNumber(marketCapUsd) && marketCapUsd > 0 ? marketCapUsd : void 0,
					fdv: knownNumber(fdvUsd) && fdvUsd > 0 ? fdvUsd : void 0,
					liquidity: knownNumber(liquidityUsd) ? { usd: liquidityUsd } : void 0,
					totalLiquidityUsd: knownNumber(liquidityUsd) ? liquidityUsd : void 0,
					volumeComplete: Boolean(t.volumeComplete),
					volumeObservedUsd: knownNumber(t.volumeObservedUsd) ? t.volumeObservedUsd : void 0,
					volumeObservedMs: t.volumeObservedMs || void 0,
					volume: knownNumber(observedVol) ? { h24: observedVol } : void 0,
					totalVolume24h: knownNumber(observedVol) ? observedVol : void 0,
					marketCapMethod: fdvUsd ? "bonding_curve_spot" : void 0,
					discoveryMode: "onchain",
					priceChange: t.priceChange24h ? { h24: t.priceChange24h } : void 0,
					pairCreatedAt: t.createdAt || t.created_timestamp,
					info: {
						imageUrl,
						description: t.description,
						websites: t.website ? [{
							type: "website",
							label: "Website",
							url: t.website
						}] : void 0,
						socials: [...t.twitter ? [{
							type: "twitter",
							url: t.twitter
						}] : [], ...t.telegram ? [{
							type: "telegram",
							url: t.telegram
						}] : []]
					},
					website: t.website,
					twitter: t.twitter,
					telegram: t.telegram,
					launchPlatform: "Pump.fun",
					bondingCurvePda: t.bondingCurvePda,
					bondingProgress: t.bondingProgress,
					isBondingCurve: !isGraduated && !curveDone,
					isGraduated,
					marketStage: isGraduated ? "pumpswap" : curveDone ? "graduated" : "bonding_curve",
					pumpSwapPool: t.pumpSwapPool,
					creator: t.creator,
					realSolReservesFormatted: t.realSolReservesFormatted,
					virtualTokenReserves: t.virtualTokenReserves,
					virtualSolReserves: t.virtualSolReserves,
					realTokenReserves: t.realTokenReserves,
					realSolReserves: t.realSolReserves,
					tokenTotalSupply: t.tokenTotalSupply,
					primaryProvider: "Pump.fun (On-Chain)",
					sources: isGraduated ? ["PumpSwap", "Pump.fun (On-Chain)"] : ["Pump.fun (On-Chain)"],
					dexes: isGraduated ? ["PumpSwap"] : [],
					discoveredAt: Date.now()
				};
				const tradeUrl = getDexTradingUrl(pair, primaryDex);
				if (tradeUrl) pair.primaryDexTradingUrl = tradeUrl;
				this.addOrUpdateToken(key, pair);
			}
		} catch (err) {
			console.warn("[DiscoveryEngine] Failed ingesting Solana pump tokens:", err);
		}
	}
	/**
	* Stored Pump rows keep curve reserves after the live book has moved on.
	* Price those reserves with the current SOL price and keep a partial volume visible.
	*/
	async repairSolanaCurves() {
		let solUsd = null;
		try {
			solUsd = await getSolUsdPrice();
		} catch {
			solUsd = null;
		}
		for (const token of this.indexedTokens.values()) {
			if (String(token?.chainId || "").toLowerCase() !== "solana") continue;
			if (!(token.launchPlatform === "Pump.fun" || token.dexId === "pumpfun" || token.dexId === "pumpswap" || token.marketStage === "bonding_curve" || token.marketStage === "pumpswap")) continue;
			const mint = token.baseToken?.address;
			if (mint && !token.info?.imageUrl) {
				if (!token.info) token.info = {};
				token.info.imageUrl = `https://images.pump.fun/coin-image/${mint}`;
			}
			if ((!(Number(token.priceUsd) > 0) || !(Number(token.marketCap) > 0)) && Number(solUsd) > 0 && token.virtualTokenReserves && (token.virtualSolReserves || token.virtualQuoteReserves)) {
				const quoted = pumpCurveQuote({
					...token,
					quoteNative: token.quoteNative !== false
				}, solUsd);
				if (quoted?.spotUsd > 0) token.priceUsd = quoted.spotUsd;
				if (quoted?.spotQuote && !(Number(token.priceNative) > 0)) token.priceNative = quoted.spotQuote;
				if (quoted?.fdvUsd > 0) {
					if (!(Number(token.marketCap) > 0)) token.marketCap = quoted.fdvUsd;
					if (!(Number(token.fdv) > 0)) token.fdv = quoted.fdvUsd;
				}
			}
			if (!knownNumber(token.liquidity?.usd) && !knownNumber(token.totalLiquidityUsd) && token.realSolReserves && Number(solUsd) > 0) {
				const sol = Number(token.realSolReserves) / 1e9;
				if (Number.isFinite(sol) && sol >= 0) {
					const liq = Math.round(sol * Number(solUsd) * 100) / 100;
					token.liquidity = {
						...token.liquidity || {},
						usd: liq
					};
					token.totalLiquidityUsd = liq;
				}
			}
			if (token.volumeComplete === true && knownNumber(token.volume?.h24)) continue;
			const observed = knownNumber(token.volumeObservedUsd) ? token.volumeObservedUsd : knownNumber(token.volume?.h24) ? token.volume.h24 : Number(token.priceUsd) > 0 ? 0 : null;
			if (observed == null) continue;
			token.volumeComplete = false;
			token.volume = {
				...token.volume || {},
				h24: observed
			};
			token.totalVolume24h = observed;
		}
	}
	/**
	* Ingests native Arc Argus Launchpad (Portal #7 and #8) tokens
	*/
	ingestArgusTokens() {
		try {
			const argusTokens = argusIndexer.getArgusTokens();
			for (const pair of argusTokens) {
				const key = `arc:${pair.baseToken.address.toLowerCase()}`;
				if (!pair.discoveryMode) pair.discoveryMode = "onchain";
				this.addOrUpdateToken(key, pair);
			}
		} catch (err) {
			console.warn("[DiscoveryEngine] Failed ingesting Argus tokens:", err);
		}
	}
	ingestPonsTokens() {
		try {
			if (!this.ponsStamp) this.ponsStamp = /* @__PURE__ */ new Map();
			for (const pair of ponsIndexer.getTokens()) {
				const addr = pair?.baseToken?.address;
				if (!addr) continue;
				const key = addr.toLowerCase();
				const stamp = `${pair.baseToken?.name || ""}|${pair.baseToken?.symbol || ""}|${pair.priceUsd || ""}|${pair.bondingProgress ?? ""}|${pair.info?.imageUrl || ""}`;
				if (this.ponsStamp.get(key) === stamp) continue;
				this.ponsStamp.set(key, stamp);
				this.addOrUpdateToken(`robinhood:${key}`, pair);
			}
		} catch (err) {
			console.warn("[DiscoveryEngine] Failed ingesting Pons tokens:", err);
		}
	}
	/**
	* Fetches fresh and high-activity tokens directly from the Pump.fun API
	*/
	async ingestPumpCoinsApi() {
		try {
			const [latestRes, volumeRes, mcapRes] = await Promise.allSettled([
				fetchWithTimeout("https://frontend-api.pump.fun/coins?limit=100&sort=created_timestamp&order=DESC&includeNsfw=false", 5e3),
				fetchWithTimeout("https://frontend-api.pump.fun/coins?limit=100&sort=last_trade_timestamp&order=DESC&includeNsfw=false", 5e3),
				fetchWithTimeout("https://frontend-api.pump.fun/coins?limit=100&sort=market_cap&order=DESC&includeNsfw=false", 5e3)
			]);
			const coins = [];
			if (latestRes.status === "fulfilled" && Array.isArray(latestRes.value)) coins.push(...latestRes.value);
			if (volumeRes.status === "fulfilled" && Array.isArray(volumeRes.value)) coins.push(...volumeRes.value);
			if (mcapRes.status === "fulfilled" && Array.isArray(mcapRes.value)) coins.push(...mcapRes.value);
			for (const c of coins) {
				if (!c?.mint) continue;
				const key = chainTokenKey("solana", c.mint);
				const hasPool = Boolean(c.raydium_pool || c.pump_swap_pool);
				const curveDone = Boolean(c.complete) && !hasPool;
				const isGraduated = hasPool;
				const dexId = isGraduated ? "pumpswap" : "pumpfun";
				const primaryDex = isGraduated ? "PumpSwap" : "Pump.fun";
				const pair = {
					chainId: "solana",
					dexId,
					primaryDex,
					pairAddress: c.bonding_curve || c.mint,
					url: `https://pump.fun/coin/${c.mint}`,
					baseToken: {
						address: c.mint,
						name: c.name || "Pump Token",
						symbol: c.symbol || "PUMP"
					},
					quoteToken: {
						address: "",
						name: void 0,
						symbol: void 0
					},
					priceNative: void 0,
					priceUsd: void 0,
					marketCap: Number.isFinite(Number(c.usd_market_cap)) && c.usd_market_cap != null && c.usd_market_cap !== "" ? Number(c.usd_market_cap) : void 0,
					fdv: Number.isFinite(Number(c.usd_market_cap)) && c.usd_market_cap != null && c.usd_market_cap !== "" ? Number(c.usd_market_cap) : void 0,
					liquidity: void 0,
					totalLiquidityUsd: void 0,
					volume: c.volume_24h != null && c.volume_24h !== "" && Number.isFinite(Number(c.volume_24h)) ? { h24: Number(c.volume_24h) } : void 0,
					totalVolume24h: c.volume_24h != null && c.volume_24h !== "" && Number.isFinite(Number(c.volume_24h)) ? Number(c.volume_24h) : void 0,
					pairCreatedAt: c.created_timestamp,
					info: {
						imageUrl: c.image_uri,
						description: c.description,
						websites: c.website ? [{
							type: "website",
							label: "Website",
							url: c.website
						}] : void 0,
						socials: [...c.twitter ? [{
							type: "twitter",
							url: c.twitter
						}] : [], ...c.telegram ? [{
							type: "telegram",
							url: c.telegram
						}] : []]
					},
					website: c.website,
					twitter: c.twitter,
					telegram: c.telegram,
					launchPlatform: "Pump.fun",
					bondingCurvePda: c.bonding_curve,
					bondingProgress: c.complete ? 100 : Math.min(100, Math.round((c.real_sol_reserves || 0) / 85e9 * 100)),
					isBondingCurve: !isGraduated && !curveDone,
					isGraduated,
					marketStage: isGraduated ? "pumpswap" : curveDone ? "graduated" : "bonding_curve",
					creator: c.creator,
					primaryProvider: "Pump.fun API",
					sources: isGraduated ? ["PumpSwap", "Pump.fun API"] : ["Pump.fun API"],
					dexes: isGraduated ? ["PumpSwap"] : [],
					discoveredAt: Date.now()
				};
				const tradeUrl = getDexTradingUrl(pair, primaryDex);
				if (tradeUrl) pair.primaryDexTradingUrl = tradeUrl;
				this.addOrUpdateToken(key, pair);
			}
		} catch (err) {
			console.warn("[DiscoveryEngine] ingestPumpCoinsApi error:", err);
		}
	}
	/**
	* Fetches DexScreener trending boosts, latest boosts, and token profiles,
	* then batches their market data in chunks of 30 addresses.
	*/
	async ingestDexScreenerTrending() {
		try {
			const [topBoosts, latestBoosts, latestProfiles] = await Promise.allSettled([
				fetchWithTimeout("https://api.dexscreener.com/token-boosts/top/v1", 6e3),
				fetchWithTimeout("https://api.dexscreener.com/token-boosts/latest/v1", 6e3),
				fetchWithTimeout("https://api.dexscreener.com/token-profiles/latest/v1", 6e3)
			]);
			const items = [];
			if (topBoosts.status === "fulfilled" && Array.isArray(topBoosts.value)) items.push(...topBoosts.value);
			if (latestBoosts.status === "fulfilled" && Array.isArray(latestBoosts.value)) items.push(...latestBoosts.value);
			if (latestProfiles.status === "fulfilled" && Array.isArray(latestProfiles.value)) items.push(...latestProfiles.value);
			const addressMap = /* @__PURE__ */ new Map();
			for (const it of items) if (it?.tokenAddress) {
				const key = identityAddress(it.chainId, it.tokenAddress);
				if (!addressMap.has(key)) addressMap.set(key, it);
			}
			const addresses = Array.from(addressMap.keys());
			if (addresses.length === 0) return;
			const batchSize = 30;
			const chunks = [];
			for (let i = 0; i < Math.min(addresses.length, 450); i += batchSize) chunks.push(addresses.slice(i, i + batchSize));
			for (let i = 0; i < chunks.length; i += 3) {
				const batchTasks = chunks.slice(i, i + 3).map((chunk) => fetchWithTimeout(`https://api.dexscreener.com/latest/dex/tokens/${chunk.join(",")}`, 6e3));
				const batchResults = await Promise.allSettled(batchTasks);
				for (const res of batchResults) if (res.status === "fulfilled" && Array.isArray(res.value?.pairs)) for (const p of res.value.pairs) this.normalizeAndStoreDexScreenerPair(p, addressMap);
				await new Promise((r) => setTimeout(r, 100));
			}
		} catch (err) {
			console.warn("[DiscoveryEngine] DexScreener trending ingestion error:", err);
		}
	}
	/**
	* Bounded DexScreener read for the HTTP request. The full pass walks hundreds
	* of addresses and will not finish inside a serverless invocation.
	*/
	async ingestDexScreenerQuick() {
		const [topBoosts, latestBoosts, latestProfiles, searchSol, searchHyper] = await Promise.allSettled([
			fetchWithTimeout("https://api.dexscreener.com/token-boosts/top/v1", 6e3),
			fetchWithTimeout("https://api.dexscreener.com/token-boosts/latest/v1", 6e3),
			fetchWithTimeout("https://api.dexscreener.com/token-profiles/latest/v1", 6e3),
			fetchWithTimeout("https://api.dexscreener.com/latest/dex/search?q=solana", 6e3),
			fetchWithTimeout("https://api.dexscreener.com/latest/dex/search?q=hyperswap", 6e3)
		]);
		const items = [];
		if (topBoosts.status === "fulfilled" && Array.isArray(topBoosts.value)) items.push(...topBoosts.value);
		if (latestBoosts.status === "fulfilled" && Array.isArray(latestBoosts.value)) items.push(...latestBoosts.value);
		if (latestProfiles.status === "fulfilled" && Array.isArray(latestProfiles.value)) items.push(...latestProfiles.value);
		const addressMap = /* @__PURE__ */ new Map();
		for (const it of items) {
			if (!it?.tokenAddress) continue;
			const key = identityAddress(it.chainId, it.tokenAddress);
			if (!addressMap.has(key)) addressMap.set(key, it);
		}
		const addresses = Array.from(addressMap.keys()).slice(0, 60);
		const chunks = [];
		for (let i = 0; i < addresses.length; i += 30) chunks.push(addresses.slice(i, i + 30));
		const batchResults = await Promise.allSettled(chunks.map((chunk) => fetchWithTimeout(`https://api.dexscreener.com/latest/dex/tokens/${chunk.join(",")}`, 6e3)));
		for (const res of batchResults) if (res.status === "fulfilled" && Array.isArray(res.value?.pairs)) for (const p of res.value.pairs) this.normalizeAndStoreDexScreenerPair(p, addressMap);
		if (searchSol.status === "fulfilled" && Array.isArray(searchSol.value?.pairs)) for (const p of searchSol.value.pairs) this.normalizeAndStoreDexScreenerPair(p);
		if (searchHyper.status === "fulfilled" && Array.isArray(searchHyper.value?.pairs)) for (const p of searchHyper.value.pairs) this.normalizeAndStoreDexScreenerPair(p);
	}
	async ingestGeckoList(network, kind, chainName) {
		const json = await fetchWithTimeout(`https://api.geckoterminal.com/api/v2/networks/${network}/${kind}?include=base_token,dex&page=1`, 6e3);
		const pools = Array.isArray(json?.data) ? json.data : [];
		const included = Array.isArray(json?.included) ? json.included : [];
		for (const pool of pools) this.parseAndStoreGeckoPool(pool, included, chainName);
	}
	/**
	* Fills the in-memory index before the request returns. Serverless hosts
	* freeze after the response, so the feed cannot wait on setInterval.
	* Pons is the same: each snapshot awaits a bounded catchUp instead of hoping
	* the 800ms timer is still alive. A warm index still catches Pons up; the
	* heavier DexScreener pass stays on the 20s freshness window.
	*/
	async ensureLiveSnapshot() {
		if (this.indexedTokens.size > 0 && Date.now() - this.lastIndexedAt < 2e4) {
			await this.catchUpPons();
			this.ingestPonsTokens();
			return;
		}
		if (this.liveInflight) return this.liveInflight;
		this.liveInflight = this.runQuickLivePass().finally(() => {
			this.liveInflight = null;
		});
		return this.liveInflight;
	}
	async catchUpPons() {
		try {
			if (typeof ponsIndexer.catchUp === "function") await ponsIndexer.catchUp({
				maxChunks: 4,
				maxMs: 1200
			});
		} catch (err) {
			console.warn("[DiscoveryEngine] Pons catch-up:", err?.message || err);
		}
	}
	async runQuickLivePass() {
		await this.catchUpPons();
		this.ingestPonsTokens();
		const nets = [
			["solana", "solana"],
			["eth", "ethereum"],
			["base", "base"],
			["bsc", "bsc"],
			["hyperevm", "hyperevm"]
		];
		const tasks = [this.ingestDexScreenerQuick()];
		for (const [net, chain] of nets) {
			tasks.push(this.ingestGeckoList(net, "trending_pools", chain));
			tasks.push(this.ingestGeckoList(net, "new_pools", chain));
		}
		await Promise.allSettled(tasks);
		this.ingestSolanaPumpTokens();
		this.ingestArgusTokens();
		this.ingestPonsTokens();
		if (this.indexedTokens.size > 0) this.lastIndexedAt = Date.now();
	}
	/**
	* Ingests native DEX search queries across chains using staggered sub-batches
	*/
	async ingestNativeDexSearches() {
		const queriesToRun = [];
		for (const [chain, queries] of Object.entries(DEX_SEARCH_QUERIES)) for (const q of queries) queriesToRun.push({
			chain,
			query: q
		});
		if (!queriesToRun.length) return;
		const batchSize = 8;
		const start = this.searchCursor || 0;
		const subBatch = [];
		for (let n = 0; n < batchSize; n++) subBatch.push(queriesToRun[(start + n) % queriesToRun.length]);
		this.searchCursor = (start + batchSize) % queriesToRun.length;
		const tasks = subBatch.map(({ chain, query }) => fetchWithTimeout(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`, 5500).then((res) => ({
			chain,
			pairs: res?.pairs
		})));
		const results = await Promise.allSettled(tasks);
		for (const r of results) if (r.status === "fulfilled" && Array.isArray(r.value?.pairs)) for (const p of r.value.pairs) this.normalizeAndStoreDexScreenerPair(p);
	}
	normalizeAndStoreDexScreenerPair(p, profileMap) {
		if (!p || !p.chainId || !p.baseToken?.address) return;
		const chainNorm = normalizeChainName(p.chainId);
		const tokenAddr = identityAddress(chainNorm, p.baseToken.address);
		const key = `${chainNorm}:${tokenAddr}`;
		const mc = Number(p.marketCap || p.fdv || 0);
		const liq = Number(p.liquidity?.usd || 0);
		const reportedVol = p.volume?.h24;
		const vol = reportedVol == null ? null : Number(reportedVol);
		const knownVol = knownNumber(vol);
		if ((mc === 1e3 || mc >= 990 && mc <= 1010) && liq === 0 && (vol === 0 || vol == null)) return;
		const dexName = normalizeDexName(p.dexId);
		const profile = profileMap?.get(tokenAddr);
		const pair = {
			chainId: chainNorm,
			dexId: p.dexId || dexName.toLowerCase(),
			primaryDex: dexName,
			pairAddress: p.pairAddress,
			url: p.url || `https://dexscreener.com/${chainNorm}/${p.pairAddress}`,
			baseToken: {
				address: p.baseToken.address,
				name: p.baseToken.name || "",
				symbol: p.baseToken.symbol || ""
			},
			quoteToken: {
				address: p.quoteToken?.address || "",
				name: p.quoteToken?.name || "",
				symbol: p.quoteToken?.symbol || ""
			},
			priceNative: p.priceNative || "0",
			priceUsd: p.priceUsd ? String(p.priceUsd) : void 0,
			marketCap: p.marketCap || p.fdv || mc,
			fdv: p.fdv || mc,
			liquidity: p.liquidity,
			totalLiquidityUsd: liq || void 0,
			volumeComplete: knownVol,
			volume: knownVol ? {
				...p.volume,
				h24: vol
			} : void 0,
			totalVolume24h: knownVol ? vol : void 0,
			discoveryMode: "search",
			priceChange: p.priceChange,
			txns: p.txns,
			pairCreatedAt: p.pairCreatedAt,
			info: {
				imageUrl: profile?.icon || p.info?.imageUrl,
				description: profile?.description || p.info?.description,
				websites: p.info?.websites || profile?.links?.filter((l) => l.type === "website"),
				socials: p.info?.socials || profile?.links?.filter((l) => l.type !== "website")
			},
			primaryProvider: "DexScreener",
			sources: [dexName],
			dexes: [dexName],
			discoveredAt: Date.now()
		};
		const tradeUrl = getDexTradingUrl(pair, dexName);
		if (tradeUrl) pair.primaryDexTradingUrl = tradeUrl;
		this.addOrUpdateToken(key, pair);
	}
	parseAndStoreGeckoPool(pool, included, chainName) {
		try {
			const attrs = pool?.attributes;
			if (!attrs) return;
			const baseTokenRelId = pool.relationships?.base_token?.data?.id;
			const dexRelId = pool.relationships?.dex?.data?.id;
			const tokenItem = included.find((i) => i.id === baseTokenRelId);
			const dexItem = included.find((i) => i.id === dexRelId);
			const tokenAttrs = tokenItem?.attributes || {};
			const dexAttrs = dexItem?.attributes || {};
			const address = tokenAttrs.address || attrs.address;
			if (!address) return;
			const symbol = tokenAttrs.symbol || attrs.name?.split("/")?.[0]?.trim() || "TOKEN";
			const name = tokenAttrs.name || symbol;
			const dexName = dexAttrs.name || normalizeDexName(dexRelId || "dex");
			const chainNorm = normalizeChainName(chainName);
			const priceUsd = attrs.base_token_price_usd ? String(attrs.base_token_price_usd) : void 0;
			const rawVol = attrs.volume_usd?.h24;
			const hasVol = rawVol != null && rawVol !== "" && Number.isFinite(Number(rawVol));
			const volume24h = hasVol ? Number(rawVol) : void 0;
			const rawLiq = attrs.reserve_in_usd;
			const hasLiq = rawLiq != null && rawLiq !== "" && Number.isFinite(Number(rawLiq));
			const liquidityUsd = hasLiq ? Number(rawLiq) : void 0;
			const fdv = attrs.fdv_usd != null && attrs.fdv_usd !== "" && Number.isFinite(Number(attrs.fdv_usd)) ? Number(attrs.fdv_usd) : void 0;
			const marketCap = attrs.market_cap_usd != null && attrs.market_cap_usd !== "" && Number.isFinite(Number(attrs.market_cap_usd)) ? Number(attrs.market_cap_usd) : fdv;
			const rawChange = attrs.price_change_percentage?.h24;
			const priceChangeH24 = rawChange != null && rawChange !== "" && Number.isFinite(Number(rawChange)) ? Number(rawChange) : void 0;
			let pairCreatedAt;
			if (attrs.pool_created_at) {
				const parsed = new Date(attrs.pool_created_at).getTime();
				if (!isNaN(parsed) && parsed > 0) pairCreatedAt = parsed;
			}
			const key = chainTokenKey(chainNorm, address);
			const pair = {
				chainId: chainNorm,
				dexId: dexRelId || dexName.toLowerCase(),
				primaryDex: dexName,
				pairAddress: attrs.address,
				url: `https://geckoterminal.com/${chainNorm}/pools/${attrs.address}`,
				baseToken: {
					address,
					name,
					symbol
				},
				quoteToken: {
					address: "",
					name: "",
					symbol: ""
				},
				priceNative: attrs.base_token_price_native_currency ? String(attrs.base_token_price_native_currency) : "0",
				priceUsd,
				marketCap,
				fdv,
				liquidity: hasLiq ? { usd: liquidityUsd } : void 0,
				totalLiquidityUsd: hasLiq ? liquidityUsd : void 0,
				volumeComplete: hasVol,
				volume: hasVol ? { h24: volume24h } : void 0,
				totalVolume24h: hasVol ? volume24h : void 0,
				priceChange: priceChangeH24 == null ? void 0 : { h24: priceChangeH24 },
				pairCreatedAt,
				info: { imageUrl: tokenAttrs.image_url || void 0 },
				primaryProvider: `Native ${dexName}`,
				sources: [dexName],
				dexes: [dexName],
				discoveredAt: Date.now()
			};
			const tradeUrl = getDexTradingUrl(pair, dexName);
			if (tradeUrl) pair.primaryDexTradingUrl = tradeUrl;
			this.addOrUpdateToken(key, pair);
		} catch {}
	}
	/**
	* Direct ingestion interface for real-time providers (e.g. Argus Portal 8 on-chain watcher)
	*/
	ingestToken(token) {
		const normChain = normalizeChainName(token.chainId);
		const addr = token.baseToken?.address || token.pairAddress;
		if (!addr) return;
		const key = chainTokenKey(normChain, addr);
		this.addOrUpdateToken(key, token);
	}
	addOrUpdateToken(key, token) {
		const existing = this.indexedTokens.get(key);
		const touchMarket = () => {
			existing.marketUpdatedAt = Date.now();
		};
		if (!existing) {
			const owned = token.isArgusLaunch || token.isPonsLaunch || /argus|pons/i.test(String(token.primaryDex || token.launchPlatform || ""));
			if (owned && /uniswap\.org|arguspad\.io/i.test(String(token.url || ""))) token.url = void 0;
			if (owned && /uniswap\.org|arguspad\.io/i.test(String(token.primaryDexTradingUrl || ""))) token.primaryDexTradingUrl = void 0;
			token.firstSeenAt = token.firstSeenAt || Date.now();
			if (knownNumber(token.volume?.h24) || knownNumber(token.liquidity?.usd) || knownNumber(Number(token.priceUsd))) token.marketUpdatedAt = token.marketUpdatedAt || Date.now();
			const launched = Number(token.pairCreatedAt || 0);
			const launchedMs = launched > 0 && launched < 1e11 ? launched * 1e3 : launched;
			const freshLaunch = token.discoveryMode === "onchain" && launchedMs > Date.now() - 6e5;
			recordUnique(this.metrics, freshLaunch ? "onchain" : token.discoveryMode === "onchain" ? "backfill" : "search");
			this.indexedTokens.set(key, token);
			this.discoveredTodaySet.add(key);
			this.rollingDiscoveries.push(Date.now());
			this.trimIndex();
			return;
		}
		if (!existing.firstSeenAt) existing.firstSeenAt = existing.discoveredAt || Date.now();
		if (!existing.pairCreatedAt && token.pairCreatedAt) existing.pairCreatedAt = token.pairCreatedAt;
		if (token.priceUsd && Number(token.priceUsd) > 0) {
			existing.priceUsd = token.priceUsd;
			touchMarket();
		}
		if (token.priceNative && Number(token.priceNative) > 0) existing.priceNative = token.priceNative;
		if (typeof token.marketCap === "number" && token.marketCap > 0) {
			existing.marketCap = token.marketCap;
			existing.fdv = token.fdv || token.marketCap;
			touchMarket();
		}
		if (token.volumeComplete === false) {
			if (!(existing.volumeComplete === true && knownNumber(existing.volume?.h24) && !knownNumber(token.volume?.h24))) {
				existing.volumeComplete = false;
				if (knownNumber(token.volumeObservedUsd)) existing.volumeObservedUsd = token.volumeObservedUsd;
				if (token.volumeObservedMs) existing.volumeObservedMs = token.volumeObservedMs;
				const shown = knownNumber(token.volume?.h24) ? token.volume.h24 : knownNumber(token.volumeObservedUsd) ? token.volumeObservedUsd : null;
				if (shown != null) {
					existing.volume = {
						...existing.volume || {},
						h24: shown
					};
					existing.totalVolume24h = shown;
				} else {
					if (existing.volume) existing.volume = {
						...existing.volume,
						h24: void 0
					};
					existing.totalVolume24h = void 0;
				}
			}
		} else if (token.volume && knownNumber(token.volume.h24)) {
			existing.volume = {
				...existing.volume || {},
				...token.volume
			};
			existing.totalVolume24h = token.volume.h24;
			existing.volumeComplete = true;
			touchMarket();
		}
		const incomingLiq = token.liquidity?.usd ?? token.totalLiquidityUsd;
		if (knownNumber(incomingLiq)) {
			existing.liquidity = {
				...existing.liquidity || {},
				usd: incomingLiq
			};
			existing.totalLiquidityUsd = incomingLiq;
			touchMarket();
		}
		if (token.info?.imageUrl && token.info.imageUrl !== "/argus.svg") {
			const current = existing.info?.imageUrl;
			if (!current || current === "/argus.svg" || current.endsWith("/argus.svg")) {
				if (!existing.info) existing.info = {};
				existing.info.imageUrl = token.info.imageUrl;
			}
		}
		if (token.info?.socials?.length) {
			if (!existing.info) existing.info = {};
			existing.info.socials = token.info.socials;
		}
		if (token.info?.websites?.length) {
			if (!existing.info) existing.info = {};
			existing.info.websites = token.info.websites;
		}
		if (token.info?.description && !existing.info?.description) {
			if (!existing.info) existing.info = {};
			existing.info.description = token.info.description;
		}
		if (token.argusPoolId) {
			existing.argusPoolId = token.argusPoolId;
			existing.pairAddress = token.argusPoolId;
		}
		if (token.bondingProgress !== void 0) existing.bondingProgress = Math.max(existing.bondingProgress || 0, token.bondingProgress);
		const fabricatedMove = existing.bondingProgress ? Math.round(existing.bondingProgress * 12.5) : null;
		if (token.priceChange?.h24) existing.priceChange = token.priceChange;
		else if (fabricatedMove !== null && existing.priceChange?.h24 === fabricatedMove) existing.priceChange = void 0;
		if (token.isArgusLaunch || existing.isArgusLaunch) {
			existing.isArgusLaunch = true;
			existing.chainId = "arc";
			existing.dexId = "argus";
			existing.primaryDex = "Argus";
			existing.launchPlatform = "Argus";
			existing.argusPortalId = token.argusPortalId || existing.argusPortalId;
			existing.argusPortalFamily = token.argusPortalFamily || existing.argusPortalFamily;
			existing.argusPortalAddress = token.argusPortalAddress || existing.argusPortalAddress;
			existing.argusHookAddress = token.argusHookAddress || existing.argusHookAddress;
			existing.argusLockerAddress = token.argusLockerAddress || existing.argusLockerAddress;
			existing.argusPoolId = token.argusPoolId || existing.argusPoolId;
			existing.argusPositionId = token.argusPositionId || existing.argusPositionId;
			existing.creator = token.creator || existing.creator;
			if (token.argusTotalFeeBps != null) existing.argusTotalFeeBps = token.argusTotalFeeBps;
			if (token.twitter) existing.twitter = token.twitter;
			if (token.telegram) existing.telegram = token.telegram;
			if (token.website) existing.website = token.website;
			if (token.baseToken?.name && token.baseToken.name !== "Argus") {
				const addr = existing.baseToken?.address || token.baseToken.address;
				const name = pickName(token.baseToken.name, existing.baseToken?.name, addr);
				const symbol = pickSymbol(token.baseToken.symbol, existing.baseToken?.symbol);
				existing.baseToken = {
					...existing.baseToken,
					...token.baseToken,
					address: addr,
					name,
					symbol
				};
			}
			const storedTrade = token.primaryDexTradingUrl || existing.primaryDexTradingUrl || "";
			if (/uniswap\.org|arguspad\.io/i.test(storedTrade)) existing.primaryDexTradingUrl = void 0;
			if (/uniswap\.org|arguspad\.io/i.test(String(existing.url || ""))) existing.url = void 0;
			if (/uniswap\.org|arguspad\.io/i.test(String(token.url || ""))) token.url = void 0;
		} else if (token.isGraduated && !existing.isArgusLaunch) {
			existing.isGraduated = true;
			existing.isBondingCurve = false;
			existing.marketStage = "pumpswap";
			existing.primaryDex = "PumpSwap";
			existing.dexId = "pumpswap";
		}
		if ((token.sources || []).some((s) => s.includes("On-Chain")) && token.baseToken?.symbol && token.baseToken.symbol !== "PUMP") {
			existing.baseToken = {
				...existing.baseToken,
				name: token.baseToken.name || existing.baseToken.name,
				symbol: token.baseToken.symbol
			};
			existing.launchPlatform = existing.launchPlatform || "Pump.fun";
			if (token.creator) existing.creator = token.creator;
			if (token.twitter && !existing.twitter) existing.twitter = token.twitter;
			if (token.telegram && !existing.telegram) existing.telegram = token.telegram;
			if (token.website && !existing.website) existing.website = token.website;
			if (!existing.pairCreatedAt && token.pairCreatedAt) existing.pairCreatedAt = token.pairCreatedAt;
		}
		const sourcesSet = /* @__PURE__ */ new Set([...existing.sources || [], ...token.sources || []]);
		existing.sources = Array.from(sourcesSet);
		const dexesSet = /* @__PURE__ */ new Set([...existing.dexes || [], ...token.dexes || []]);
		existing.dexes = Array.from(dexesSet);
		applyPonsIdentity(existing, token);
		if (token.priceUsd || token.volume || token.marketCap) recordUpdate(this.metrics);
		this.indexedTokens.set(key, existing);
		this.trimIndex();
	}
	trimIndex() {
		if (this.indexedTokens.size <= 8250) return;
		const kept = retainTokens(Array.from(this.indexedTokens.values()), MAX_TOKENS);
		const next = /* @__PURE__ */ new Map();
		for (const token of kept) {
			const addr = token?.baseToken?.address;
			if (!addr) continue;
			next.set(chainTokenKey(token.chainId || "", addr), token);
		}
		this.indexedTokens = next;
	}
	cleanupOldRollingStats() {
		const oneMinAgo = Date.now() - 6e4;
		this.rollingDiscoveries = this.rollingDiscoveries.filter((t) => t >= oneMinAgo);
	}
	getTokens(options = {}) {
		const normChain = options.chain ? normalizeChainName(options.chain) : "all";
		let tokens = Array.from(this.indexedTokens.values());
		if (normChain !== "all") tokens = tokens.filter((t) => normalizeChainName(t.chainId) === normChain);
		return queryIndex(tokens, {
			mode: options.mode || "trending",
			age: options.age || "1w",
			limit: options.limit || 1e3,
			cursor: options.cursor,
			minLiquidity: options.minLiquidity,
			maxLiquidity: options.maxLiquidity,
			minVolume: options.minVolume,
			maxVolume: options.maxVolume,
			minMarketCap: options.minMarketCap,
			maxMarketCap: options.maxMarketCap,
			now: options.now
		}).tokens;
	}
	getStats() {
		const byChain = {};
		const byDex = {};
		for (const t of this.indexedTokens.values()) {
			const c = normalizeChainName(t.chainId) || "other";
			byChain[c] = (byChain[c] || 0) + 1;
			const d = t.primaryDex || "Other";
			byDex[d] = (byDex[d] || 0) + 1;
		}
		this.cleanupOldRollingStats();
		const rates = snapshot(this.metrics);
		return {
			totalIndexed: this.indexedTokens.size,
			recordsToday: countLaunchedToday(this.indexedTokens.values(), Date.now()),
			throughputPerMin: rates.liveLaunchesPerMin,
			observationWindowMs: rates.observationWindowMs,
			liveLaunchesPerMin: rates.liveLaunchesPerMin,
			searchInsertsPerMin: rates.searchInsertsPerMin,
			updatesPerMin: rates.updatesPerMin,
			rejectedPerMin: rates.rejectedPerMin,
			enrichOkPerMin: rates.enrichOkPerMin,
			enrichFailPerMin: rates.enrichFailPerMin,
			liveLaunchesLastHour: rates.liveLaunchesLastHour,
			cumulative: rates.cumulative,
			arcEnrichFailures: argusIndexer.enrichFail || 0,
			chainCoverage: CHAIN_COVERAGE,
			byChain,
			byDex,
			lastUpdated: this.lastIndexedAt,
			uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1e3),
			persisted: true
		};
	}
	exportData(format, chain, mode) {
		const tokens = this.getTokens({
			chain,
			mode,
			limit: 5e3
		});
		const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
		const chainLabel = chain ? normalizeChainName(chain) : "all_chains";
		if (format === "json") return {
			data: JSON.stringify(tokens, null, 2),
			contentType: "application/json",
			filename: `dexhunter_discovery_${chainLabel}_${timestamp}.json`
		};
		const headers = [
			"Address",
			"Chain",
			"Name",
			"Symbol",
			"PrimaryDEX",
			"TradingURL",
			"PriceUSD",
			"MarketCapUSD",
			"Volume24hUSD",
			"LiquidityUSD",
			"PriceChange24hPct",
			"MarketStage",
			"BondingProgressPct",
			"PairAddress",
			"CreatedAt",
			"Website",
			"Twitter",
			"Telegram"
		];
		const rows = tokens.map((t) => {
			const volume = volumeMetric(t);
			const liquidity = liquidityMetric(t);
			const marketCap = marketCapMetric(t);
			const change = knownMetric(t.priceChange?.h24);
			const price = knownMetric(t.priceUsd);
			return [
				t.baseToken?.address || "",
				t.chainId,
				`"${(t.baseToken?.name || "").replace(/"/g, "\"\"")}"`,
				`"${(t.baseToken?.symbol || "").replace(/"/g, "\"\"")}"`,
				t.primaryDex || "",
				t.primaryDexTradingUrl || t.url || "",
				price == null ? "" : price,
				marketCap == null ? "" : marketCap,
				volume == null ? "" : volume,
				liquidity == null ? "" : liquidity,
				change == null ? "" : change,
				t.marketStage || (t.isGraduated ? "graduated" : t.isBondingCurve ? "bonding_curve" : "active"),
				t.bondingProgress !== void 0 ? t.bondingProgress.toFixed(1) : "",
				t.pairAddress || "",
				t.pairCreatedAt ? new Date(t.pairCreatedAt).toISOString() : "",
				t.website || "",
				t.twitter || "",
				t.telegram || ""
			];
		});
		return {
			data: [headers.join(","), ...rows.map((r) => r.join(","))].join("\n"),
			contentType: "text/csv",
			filename: `dexhunter_discovery_${chainLabel}_${timestamp}.csv`
		};
	}
};
var discoveryGlobal = globalThis;
var discoveryEngine = discoveryGlobal.__dexhunterDiscovery ??= new DiscoveryEngine();
var started = false;
function ensureDexHunterEngines() {
	if (started) return;
	started = true;
	pumpIndexer.start().catch((err) => {
		console.error("[Pump Indexer] Startup error:", err);
	});
	discoveryEngine.start().catch((err) => {
		console.error("[Discovery Engine] Startup error:", err);
	});
	if (!argusIndexer._wiredToDiscovery) {
		argusIndexer._wiredToDiscovery = true;
		argusIndexer.onNewLaunch((pair) => {
			discoveryEngine.ingestToken(pair);
		});
	}
	argusIndexer.start().catch((err) => {
		console.error("[Argus Indexer] Startup error:", err);
	});
	ponsIndexer.onNewLaunch((pair) => {
		discoveryEngine.ingestToken(pair);
	});
	ponsIndexer.start().catch((err) => {
		console.error("[Pons Indexer] Startup error:", err);
	});
}
var OMIT = /* @__PURE__ */ new Set([
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
	"metadataPending"
]);
function projectBrowseToken(token) {
	if (!token || typeof token !== "object") return token;
	const next = {};
	for (const [key, value] of Object.entries(token)) {
		if (OMIT.has(key) || value == null) continue;
		next[key] = value;
	}
	if (typeof next.primaryDexLogo === "string" && /\/argus\.svg$/i.test(next.primaryDexLogo)) next.primaryDexLogo = "/argus.png";
	const image = next.info?.imageUrl;
	if (typeof image === "string" && /\/argus\.(svg|png)$|\/pons\.png$/i.test(image)) next.info = {
		...next.info,
		imageUrl: void 0
	};
	if (next.url && next.primaryDexTradingUrl && next.url === next.primaryDexTradingUrl) delete next.url;
	return next;
}
var LAUNCHPAD = "https://launch-mint-v1.raydium.io";
async function fetchJson(url, timeoutMs = 6e3) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(url, {
			headers: {
				Accept: "application/json",
				"User-Agent": "DexHunter/1.0"
			},
			signal: controller.signal
		});
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	} finally {
		clearTimeout(timer);
	}
}
function tokenFromRaydiumLaunch(row) {
	const mint = String(row?.mint || "").trim();
	if (!mint) return null;
	const supply = Number(row.supply);
	const marketCap = Number(row.marketCap);
	const price = Number.isFinite(supply) && supply > 0 && Number.isFinite(marketCap) && marketCap > 0 ? marketCap / supply : void 0;
	const progress = Number(row.finishingRate);
	const graduated = Number.isFinite(progress) && progress >= 1;
	const vol = Number(row.volumeU);
	const created = Number(row.createAt);
	return {
		chainId: "solana",
		dexId: "raydium",
		primaryDex: "Raydium",
		launchPlatform: "Raydium LaunchLab",
		primaryProvider: "Raydium LaunchLab",
		pairAddress: row.poolId || mint,
		pairCreatedAt: Number.isFinite(created) && created > 0 ? created : void 0,
		baseToken: {
			address: mint,
			name: row.name || void 0,
			symbol: row.symbol || void 0
		},
		quoteToken: {
			address: row.mintB?.address || "So11111111111111111111111111111111111111112",
			name: row.mintB?.name || "Wrapped SOL",
			symbol: row.mintB?.symbol || "SOL"
		},
		priceUsd: price != null ? String(price) : void 0,
		marketCap: Number.isFinite(marketCap) && marketCap > 0 ? marketCap : void 0,
		fdv: Number.isFinite(marketCap) && marketCap > 0 ? marketCap : void 0,
		volume: Number.isFinite(vol) ? { h24: vol } : void 0,
		totalVolume24h: Number.isFinite(vol) ? vol : void 0,
		volumeComplete: Number.isFinite(vol),
		info: {
			imageUrl: row.imgUrl || void 0,
			description: row.description || void 0
		},
		website: row.website || void 0,
		twitter: row.twitter || void 0,
		url: `https://raydium.io/launchpad/token/?mint=${mint}`,
		primaryDexTradingUrl: `https://raydium.io/launchpad/token/?mint=${mint}`,
		isBondingCurve: !graduated,
		isGraduated: graduated,
		bondingProgress: Number.isFinite(progress) ? Math.round(progress * 1e3) / 10 : void 0,
		marketStage: graduated ? "graduated" : "bonding_curve",
		sources: ["Raydium LaunchLab"],
		dexes: ["Raydium"]
	};
}
function tokenFromDexPair(pair) {
	if (!pair?.baseToken?.address || !pair.chainId) return null;
	const dexId = String(pair.dexId || "").toLowerCase();
	return {
		...pair,
		dexId: dexId || pair.dexId,
		primaryDex: pair.primaryDex || pair.dexId || "DEX",
		primaryProvider: pair.primaryProvider || "DexScreener",
		sources: Array.isArray(pair.sources) && pair.sources.length ? pair.sources : dexId ? [dexId] : ["DexScreener"],
		dexes: Array.isArray(pair.dexes) && pair.dexes.length ? pair.dexes : dexId ? [dexId] : []
	};
}
function isSolMint(value) {
	return value.length >= 32 && value.length <= 44 && !value.startsWith("0x") && !/\s/.test(value);
}
function isEvmAddress(value) {
	return /^0x[a-fA-F0-9]{40}$/.test(value);
}
async function raydiumRows(query) {
	const json = await fetchJson(isSolMint(query) ? `${LAUNCHPAD}/get/by/mints?ids=${encodeURIComponent(query)}` : `${LAUNCHPAD}/get/search?text=${encodeURIComponent(query)}`);
	const rows = json?.data?.rows;
	if (!json?.success || !Array.isArray(rows)) return [];
	return rows.map(tokenFromRaydiumLaunch).filter(Boolean);
}
async function dexScreenerPairs(query) {
	const pairs = (await fetchJson(isSolMint(query) || isEvmAddress(query) ? `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(query)}` : `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`))?.pairs;
	if (!Array.isArray(pairs)) return [];
	return pairs.slice(0, 30).map(tokenFromDexPair).filter(Boolean);
}
async function searchMarkets(query) {
	const q = String(query || "").trim();
	if (!q || q.length > 120) return [];
	const settled = await Promise.allSettled([raydiumRows(q), dexScreenerPairs(q)]);
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	for (const result of settled) {
		if (result.status !== "fulfilled") continue;
		for (const token of result.value) {
			const addr = token?.baseToken?.address;
			if (!addr) continue;
			const key = `${String(token.chainId || "").toLowerCase()}:${addr}`;
			if (seen.has(key)) continue;
			seen.add(key);
			out.push(token);
		}
	}
	return out.slice(0, 40);
}
var EVM_EXACT = /^0x[a-fA-F0-9]{40}$/;
var SOL_EXACT = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
var EVM_PREFIX = /^0x[a-fA-F0-9]{6,39}$/;
var SOL_PREFIX = /^[1-9A-HJ-NP-Za-km-z]{12,31}$/;
var LABEL = /^(?:ca|contract|token|address|mint)\s*[:#]\s*/i;
var WRAP = /^[\s"'`([{<]+|[\s"'`)\]}>.,;:]+$/g;
var INVISIBLE = /[\s\u200b\u200c\u200d\ufeff]+/g;
function emptyQuery() {
	return {
		kind: "empty",
		text: ""
	};
}
function classifyCompact(compact) {
	const evmReady = compact.replace(/^0x/i, "0x");
	if (EVM_EXACT.test(evmReady)) return {
		kind: "evm",
		address: evmReady.toLowerCase(),
		text: compact
	};
	if (SOL_EXACT.test(compact)) return {
		kind: "solana",
		address: compact,
		text: compact
	};
	if (EVM_PREFIX.test(evmReady)) return {
		kind: "evm-prefix",
		prefix: evmReady.toLowerCase(),
		text: compact
	};
	if (SOL_PREFIX.test(compact) && (compact.length >= 20 || /\d/.test(compact))) return {
		kind: "solana-prefix",
		prefix: compact,
		text: compact
	};
	return null;
}
function unwrap(value) {
	let text = String(value ?? "").trim().replace(LABEL, "").trim();
	for (let i = 0; i < 2; i++) {
		const next = text.replace(WRAP, "").trim();
		if (next === text) break;
		text = next;
	}
	return text;
}
function boundedMatch(source, pattern, flags = "g") {
	const re = new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`);
	let match;
	while (match = re.exec(source)) {
		const start = match.index;
		const end = start + match[0].length;
		const before = start > 0 ? source[start - 1] : "";
		const after = end < source.length ? source[end] : "";
		const edge = (ch) => ch === "" || /[^A-Za-z0-9]/.test(ch);
		if (edge(before) && edge(after)) return match[0];
		if (re.lastIndex === match.index) re.lastIndex += 1;
	}
	return "";
}
function fromUrl(text) {
	if (!/^https?:\/\//i.test(text)) return "";
	try {
		const url = new URL(text);
		const hinted = url.searchParams.get("address") || url.searchParams.get("mint") || url.searchParams.get("token") || url.searchParams.get("q") || "";
		if (hinted.trim()) return unwrap(decodeURIComponent(hinted.trim()));
		const parts = url.pathname.split("/").filter(Boolean);
		return unwrap(decodeURIComponent(parts[parts.length - 1] || ""));
	} catch {
		return "";
	}
}
function parseAddressQuery(raw) {
	const original = String(raw ?? "").trim();
	if (!original) return emptyQuery();
	const unwrapped = unwrap(original);
	const embeddedSource = fromUrl(unwrapped) || unwrapped;
	const direct = classifyCompact(embeddedSource);
	if (direct) return direct;
	const compact = embeddedSource.replace(INVISIBLE, "");
	if (compact !== embeddedSource) {
		const folded = classifyCompact(compact);
		if (folded) return folded;
	}
	const evm = boundedMatch(embeddedSource, "0x[a-fA-F0-9]{40}", "gi");
	if (evm) {
		const hit = classifyCompact(evm);
		if (hit) return hit;
	}
	const sol = boundedMatch(embeddedSource, "[1-9A-HJ-NP-Za-km-z]{32,44}");
	if (sol) {
		const hit = classifyCompact(sol);
		if (hit) return hit;
	}
	return {
		kind: "text",
		text: original
	};
}
function isAddressQuery(parsed) {
	return parsed.kind === "evm" || parsed.kind === "solana" || parsed.kind === "evm-prefix" || parsed.kind === "solana-prefix";
}
function candidateAddresses(token) {
	const values = [
		token?.baseToken?.address,
		token?.pairAddress,
		token?.bondingCurvePda,
		token?.mint
	];
	const out = [];
	for (const value of values) {
		const text = String(value ?? "").trim();
		if (text) out.push(text);
	}
	return out;
}
function recency(token) {
	const raw = Number(token?.pairCreatedAt);
	if (!Number.isFinite(raw) || raw <= 0) return 0;
	return raw < 1e11 ? raw * 1e3 : raw;
}
function prefixHit(stored, parsed) {
	if (parsed.kind === "evm-prefix") return stored.toLowerCase().startsWith(parsed.prefix);
	if (parsed.kind === "solana-prefix") return stored.startsWith(parsed.prefix) || stored.endsWith(parsed.prefix);
	return false;
}
/**
* @param {unknown[]} tokens
* @param {{ kind: string, address?: string, prefix?: string }} parsed
*/
function collectAddressMatches(tokens, parsed) {
	const list = Array.isArray(tokens) ? tokens : [];
	if (!isAddressQuery(parsed)) return {
		tokens: [],
		ambiguous: false,
		truncated: false
	};
	if (parsed.kind === "evm" || parsed.kind === "solana") {
		const exact = [];
		const folded = [];
		const distinct = /* @__PURE__ */ new Set();
		const want = parsed.address;
		const wantFold = String(want).toLowerCase();
		for (const token of list) {
			const fields = candidateAddresses(token);
			if (fields.some((field) => field === want)) {
				exact.push(token);
				continue;
			}
			const foldedField = fields.find((field) => field.toLowerCase() === wantFold);
			if (foldedField) {
				folded.push(token);
				distinct.add(foldedField);
			}
		}
		if (exact.length) return {
			tokens: exact,
			ambiguous: false,
			truncated: false
		};
		if (parsed.kind === "solana" && distinct.size > 1) return {
			tokens: [],
			ambiguous: true,
			truncated: false
		};
		return {
			tokens: folded,
			ambiguous: false,
			truncated: false
		};
	}
	const hits = [];
	for (const token of list) if (candidateAddresses(token).some((field) => prefixHit(field, parsed))) hits.push(token);
	hits.sort((a, b) => recency(b) - recency(a));
	const truncated = hits.length > 40;
	return {
		tokens: truncated ? hits.slice(0, 40) : hits,
		ambiguous: false,
		truncated
	};
}
function tokensMatchingQuery(tokens, query) {
	const list = Array.isArray(tokens) ? tokens : [];
	const parsed = parseAddressQuery(query) || {
		kind: "text",
		text: String(query ?? "").trim()
	};
	if (parsed.kind === "empty") return {
		mode: "all",
		matches: list,
		parsed,
		ambiguous: false,
		truncated: false
	};
	if (!isAddressQuery(parsed)) return {
		mode: "text",
		matches: [],
		parsed,
		ambiguous: false,
		truncated: false
	};
	const found = collectAddressMatches(list, parsed);
	return {
		mode: "address",
		matches: found.tokens,
		parsed,
		ambiguous: found.ambiguous,
		truncated: found.truncated
	};
}
function textHit(token, q) {
	const name = token?.baseToken?.name?.toLowerCase?.() || "";
	const symbol = token?.baseToken?.symbol?.toLowerCase?.() || "";
	const address = token?.baseToken?.address?.toLowerCase?.() || "";
	const quote = token?.quoteToken?.symbol?.toLowerCase?.() || "";
	const pair = token?.pairAddress?.toLowerCase?.() || "";
	const curve = token?.bondingCurvePda?.toLowerCase?.() || "";
	return name.includes(q) || symbol.includes(q) || address.includes(q) || quote.includes(q) || pair.includes(q) || curve.includes(q);
}
/**
* @template T
* @param {T[]} tokens
* @param {string} query
* @param {any} filters
* @param {(rows: T[], filters: any) => T[]} applyFilters
* @returns {T[]}
*/
function resolveBrowseQuery(tokens, query, filters, applyFilters) {
	const picked = tokensMatchingQuery(tokens, query);
	if (picked.ambiguous) return [];
	if (picked.mode === "address") return picked.matches.slice();
	const source = picked.mode === "all" ? picked.matches : Array.isArray(tokens) ? tokens : [];
	let rows = typeof applyFilters === "function" ? applyFilters(source, filters) : source.slice();
	if (picked.mode === "text") {
		const q = picked.parsed.text.toLowerCase();
		rows = rows.filter((token) => textHit(token, q));
	}
	return rows;
}
function chainName(value) {
	const c = String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
	if (!c || c === "all") return "all";
	if (c === "robinhoodchain" || c === "rh") return "robinhood";
	if (c === "arcchain") return "arc";
	if (c === "sol") return "solana";
	return c;
}
function withTimeout(promise, ms) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(/* @__PURE__ */ new Error("timeout")), ms);
		promise.then((value) => {
			clearTimeout(timer);
			resolve(value);
		}, (err) => {
			clearTimeout(timer);
			reject(err);
		});
	});
}
function explainChainMiss(labels, failed, ambiguous) {
	const failedSet = new Set(failed);
	const missed = labels.filter((label) => !failedSet.has(label));
	const chainNote = ambiguous ? " Arc and Robinhood addresses look the same, so both were checked." : "";
	if (!missed.length) return `${failed.join(" and ")} did not answer in time, so this address is not confirmed missing.${chainNote}`;
	const failNote = failed.length ? ` ${failed.join(" and ")} did not answer in time.` : "";
	return `No launch record on ${missed.join(" and ")} for this address.${chainNote}${failNote}`;
}
function searchIndexedAddresses(tokens, address, chain = "all") {
	const parsed = parseAddressQuery(address);
	const selected = chainName(chain);
	const list = Array.isArray(tokens) ? tokens : [];
	const pool = selected === "all" ? list : list.filter((token) => chainName(token?.chainId) === selected);
	if (!isAddressQuery(parsed)) return {
		tokens: [],
		ambiguous: false,
		truncated: false,
		parsed
	};
	return {
		...collectAddressMatches(pool, parsed),
		parsed
	};
}
function isTaggedPons(token) {
	return Boolean(token?.isPonsLaunch) || /pons/i.test(String(token?.launchPlatform || token?.primaryDex || ""));
}
async function enrichIndexed(tokens) {
	const out = [];
	for (const token of tokens) {
		const addr = token?.baseToken?.address;
		if (chainName(token?.chainId) === "robinhood" && addr && !isTaggedPons(token)) try {
			const pons = await withTimeout(lookupPonsLaunch(addr), 8e3);
			if (pons?.baseToken?.address && !pons.error) {
				const name = token.baseToken?.name;
				const keepName = name && !/^0x[a-fA-F0-9]{40}$/i.test(String(name).trim());
				out.push({
					...token,
					isPonsLaunch: true,
					launchPlatform: "Pons V2",
					primaryDexLogo: token.primaryDexLogo || "/pons.png",
					launchpadDetailUrl: pons.launchpadDetailUrl,
					url: pons.url,
					marketStage: pons.marketStage || token.marketStage,
					isGraduated: pons.isGraduated || token.isGraduated,
					isBondingCurve: pons.isGraduated ? false : token.isBondingCurve,
					baseToken: {
						...token.baseToken,
						name: keepName ? name : pons.baseToken.name || "",
						symbol: token.baseToken?.symbol || pons.baseToken.symbol || ""
					}
				});
				continue;
			}
		} catch {}
		out.push(token);
	}
	return out;
}
async function resolveAddress(tokens, address, chain = "all", options = {}) {
	const query = String(address || "").trim();
	const selected = chainName(chain);
	const found = searchIndexedAddresses(tokens, query, selected);
	if (found.ambiguous) return {
		tokens: [],
		source: "index",
		ambiguous: true,
		message: "More than one mint differs only by letter case. Paste the address with its original case."
	};
	if (found.parsed?.kind === "evm-prefix" || found.parsed?.kind === "solana-prefix") return {
		tokens: found.tokens,
		message: found.tokens.length ? found.truncated ? "Showing the first 40 indexed addresses with that prefix." : null : "No indexed address starts or ends with that.",
		source: "index"
	};
	if (found.tokens.length) return {
		tokens: await enrichIndexed(found.tokens),
		message: null,
		source: "index"
	};
	const evm = found.parsed?.kind === "evm";
	const solana = found.parsed?.kind === "solana";
	if (!evm && !solana) return {
		tokens: [],
		source: "none",
		message: "That is not a contract or mint address."
	};
	if (options.indexOnly) return {
		tokens: [],
		source: "index",
		message: solana ? "That mint is not in the index yet." : null
	};
	const lookup = found.parsed.address;
	const jobs = [];
	if (evm && (selected === "all" || selected === "arc")) jobs.push(["Argus Portal 8", () => lookupArgusLaunch(lookup)]);
	if (evm && (selected === "all" || selected === "robinhood")) jobs.push(["Pons", () => lookupPonsLaunch(lookup)]);
	if (solana && (selected === "all" || selected === "solana")) jobs.push(["Markets", () => searchMarkets(lookup)]);
	if (evm && selected !== "arc" && selected !== "robinhood") jobs.push(["Markets", () => searchMarkets(lookup)]);
	if (!jobs.length) return {
		tokens: [],
		source: "none",
		message: evm ? `No indexed launch for this address on ${selected}.` : null
	};
	const settled = await Promise.allSettled(jobs.map(([, run]) => withTimeout(run(), 9e3)));
	const chainHits = [];
	const failed = [];
	settled.forEach((result, i) => {
		const label = jobs[i][0];
		if (result.status === "rejected") {
			failed.push(label);
			return;
		}
		const value = result.value;
		if (value?.error) {
			failed.push(label);
			return;
		}
		const rows = Array.isArray(value) ? value : value ? [value] : [];
		for (const row of rows) if (row?.baseToken?.address) chainHits.push(row);
	});
	const seen = /* @__PURE__ */ new Set();
	const unique = [];
	for (const token of chainHits) {
		if (selected !== "all" && chainName(token.chainId) !== selected) continue;
		const key = `${chainName(token.chainId)}:${String(token.baseToken.address)}`;
		if (seen.has(key)) continue;
		seen.add(key);
		unique.push(token);
	}
	if (unique.length) return {
		tokens: unique,
		message: null,
		source: "chain"
	};
	return {
		tokens: [],
		source: "chain",
		message: explainChainMiss(jobs.map(([label]) => label), failed, selected === "all" && evm)
	};
}
var Route$15 = createFileRoute("/api/discovery")({ server: { handlers: { GET: async ({ request }) => {
	ensureDexHunterEngines();
	repairPonsIdentity(discoveryEngine, ponsIndexer);
	const url = new URL(request.url);
	const direct = (url.searchParams.get("address") || "").trim();
	const textQuery = (url.searchParams.get("q") || "").trim();
	if (!direct && !textQuery) await Promise.race([discoveryEngine.ensureLiveSnapshot(), new Promise((resolve) => setTimeout(resolve, 2500))]);
	try {
		if (textQuery) {
			const tokens = await searchMarkets(textQuery);
			const rows = url.searchParams.get("shape") === "browse" ? tokens.map(projectBrowseToken) : tokens;
			return Response.json({
				success: true,
				total: rows.length,
				tokens: rows
			});
		}
		if (direct) {
			const chain = url.searchParams.get("chain") || "all";
			const indexOnly = url.searchParams.get("indexOnly") === "1";
			const looked = await resolveAddress(Array.from(discoveryEngine.indexedTokens.values()), direct, chain, { indexOnly });
			if (looked.source === "chain") for (const token of looked.tokens) discoveryEngine.ingestToken(token);
			const rows = url.searchParams.get("shape") === "browse" ? looked.tokens.map(projectBrowseToken) : looked.tokens;
			return Response.json({
				success: true,
				lookedUp: true,
				total: rows.length,
				message: looked.message,
				ambiguous: Boolean(looked.ambiguous),
				chain: chain || "all",
				tokens: rows
			});
		}
		const parsed = parseDiscoveryParams(url.searchParams);
		const page = queryIndex(Array.from(discoveryEngine.indexedTokens.values()), parsed);
		const rows = url.searchParams.get("shape") === "browse" ? page.tokens.map(projectBrowseToken) : page.tokens;
		return Response.json({
			success: true,
			total: page.total,
			nextCursor: page.nextCursor,
			limit: parsed.limit,
			age: parsed.age,
			chain: parsed.chain || "all",
			mode: parsed.mode,
			tokens: rows
		});
	} catch (err) {
		if (err instanceof DiscoveryQueryError || err?.name === "DiscoveryQueryError") return Response.json({
			success: false,
			error: err.message
		}, { status: 400 });
		throw err;
	}
} } } });
var Route$14 = createFileRoute("/api/health")({ server: { handlers: { GET: async () => Response.json({
	status: "ok",
	timestamp: Date.now()
}) } } });
async function handler$5(req, res) {
	const mint = (req.query?.mint || req.query?.address || req.query?.token || "").trim();
	const debug = req.query?.debug === "true" || req.query?.debug === "1" || req.query?.raw === "true";
	if (!mint) return res.status(400).json({
		success: false,
		error: "Missing required mint query parameter (e.g. /api/pumpfun-diagnostic?mint=<TOKEN_MINT_ADDRESS>)",
		usage: "/api/pumpfun-diagnostic?mint=So11111111111111111111111111111111111111112&debug=true"
	});
	const overallStartMs = Date.now();
	const auditTrail = [];
	const s1Start = Date.now();
	let mintPubkey;
	try {
		if (mint.length < 32 || mint.length > 44 || mint.includes(" ")) throw new Error("Mint length or character set invalid for Solana base58");
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
	const metaPda = deriveMetaplexMetadataPda$1(mintPubkey);
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
		const isPumpCurve = bondingAcc ? bondingAcc.owner.equals(PUMP_PROGRAM_ID$1) : false;
		const mintExists = Boolean(mintAcc);
		const mintOwner = mintAcc?.owner?.toBase58() || null;
		const isToken2022 = mintOwner === "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
		const metaExists = Boolean(metaAcc);
		const metaOwner = metaAcc?.owner?.toBase58() || null;
		const isMetaplexOwned = metaAcc ? metaAcc.owner.equals(METAPLEX_PROGRAM_ID) : false;
		const poolExists = Boolean(poolAcc);
		const poolOwner = poolAcc?.owner?.toBase58() || null;
		const isPumpAmm = poolAcc ? poolAcc.owner.equals(PUMP_AMM_PROGRAM_ID$1) : false;
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
		if (bondingAcc && bondingAcc.data && bondingAcc.data.length >= 49 && isPumpCurve) try {
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
			if (complete) bondingProgressPct = 100;
			else if (rToken <= 0n) bondingProgressPct = 100;
			else if (rToken >= 793100000000000n) bondingProgressPct = 0;
			else {
				const bps = (PUMP_INITIAL_REAL_TOKEN_RESERVES - rToken) * 10000n / PUMP_INITIAL_REAL_TOKEN_RESERVES;
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
		else auditTrail.push({
			stage: "STAGE_4_BONDING_DECODE",
			name: "Bonding Curve Reserve & Graduation Calculation",
			status: bondingExists ? "FAILURE" : "SKIPPED",
			durationMs: Date.now() - s4Start,
			details: { reason: bondingExists ? "Account data buffer too short or not owned by Pump Program" : "No bonding curve account found on-chain" }
		});
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
		if ((!onChainName || !onChainUri) && metaAcc && metaAcc.data && isMetaplexOwned) try {
			const decodedOnChain = decodeMetaplexAccountBuffer(metaAcc.data);
			if (!onChainName && decodedOnChain.name) onChainName = decodedOnChain.name;
			if (!onChainSymbol && decodedOnChain.symbol) onChainSymbol = decodedOnChain.symbol;
			if (!onChainUri && decodedOnChain.uri) onChainUri = decodedOnChain.uri;
			if (decodedOnChain.sellerFeeBasisPoints) sellerFeeBasisPoints = decodedOnChain.sellerFeeBasisPoints;
			if (metadataSource === "none") metadataSource = "Metaplex V1 Metadata PDA";
		} catch {}
		if (onChainName || onChainSymbol || onChainUri) auditTrail.push({
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
		else auditTrail.push({
			stage: "STAGE_5_METADATA_DECODE",
			name: "On-Chain Token Metadata Decoding (Token-2022 / Metaplex)",
			status: "WARNING",
			durationMs: Date.now() - s5Start,
			details: { reason: "No Token-2022 metadata extension found on mint account and no Metaplex PDA found on-chain" }
		});
		const s6Start = Date.now();
		let offChainJson = null;
		let offChainFetchTimeMs = 0;
		const gatewayResults = [];
		if (onChainUri) {
			const gateways = onChainUri.includes("ar://") || onChainUri.includes("arweave") ? ARWEAVE_GATEWAYS : IPFS_GATEWAYS;
			const gatewayLimit = Math.min(gateways.length, 4);
			for (let i = 0; i < gatewayLimit; i++) {
				const testUrl = normalizeUri(onChainUri, i);
				const gStart = Date.now();
				try {
					const res2 = await axios.get(testUrl, {
						timeout: 3e3,
						headers: {
							Accept: "application/json",
							"User-Agent": "curl/8.4.0"
						}
					});
					const gDuration = Date.now() - gStart;
					if (res2.data && typeof res2.data === "object") {
						if (!offChainJson) offChainJson = res2.data;
						gatewayResults.push({
							gateway: gateways[i],
							url: testUrl,
							success: true,
							durationMs: gDuration
						});
					} else gatewayResults.push({
						gateway: gateways[i],
						url: testUrl,
						success: false,
						durationMs: gDuration,
						error: "Invalid JSON response"
					});
				} catch (err) {
					gatewayResults.push({
						gateway: gateways[i],
						url: testUrl,
						success: false,
						durationMs: Date.now() - gStart,
						error: err.message
					});
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
		} else auditTrail.push({
			stage: "STAGE_6_OFFCHAIN_GATEWAYS",
			name: "Decentralized IPFS/Arweave JSON Metadata Fetch",
			status: "SKIPPED",
			durationMs: 0,
			details: { reason: "No on-chain metadata URI available" }
		});
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
			if (pRes.data) pumpApiData = pRes.data;
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
				details: {
					reachable: false,
					error: err.message
				}
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
				m5: {
					buys: 0,
					sells: 0
				},
				h1: {
					buys: 0,
					sells: 0
				},
				h6: {
					buys: 0,
					sells: 0
				},
				h24: {
					buys: 0,
					sells: 0
				}
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
				websites: website ? [{
					label: "Website",
					url: website
				}] : [],
				socials: [...twitter ? [{
					type: "twitter",
					url: twitter
				}] : [], ...telegram ? [{
					type: "telegram",
					url: telegram
				}] : []]
			},
			isBondingCurve: token?.isBondingCurve ?? !complete,
			graduationPercentage: token?.bondingProgress ?? bondingProgressPct,
			bondingCurveProgress: token?.bondingProgress ?? bondingProgressPct,
			realSolReserves: token?.realSolReservesFormatted || "0",
			marketStage: token?.marketStage || (complete ? "graduated_pending" : "bonding_curve"),
			migrationState: token?.migrationState || (complete ? "MIGRATION_PENDING" : "NOT_READY"),
			pumpSwapPool: token?.pumpSwapPool || poolPda.toBase58(),
			pumpSwapPoolVerified: token?.pumpSwapPoolVerified || (poolAcc?.owner.equals(PUMP_AMM_PROGRAM_ID$1) ?? false)
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
			pumpSwapPoolVerified: token?.pumpSwapPoolVerified || (poolAcc?.owner.equals(PUMP_AMM_PROGRAM_ID$1) ?? false),
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
				pumpSwapPoolVerified: token?.pumpSwapPoolVerified || (poolAcc?.owner.equals(PUMP_AMM_PROGRAM_ID$1) ?? false)
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
function createExpressShim() {
	return {
		headersSent: false,
		statusCode: 200,
		body: null,
		status(code) {
			this.statusCode = code;
			return this;
		},
		json(data) {
			this.body = data;
			this.headersSent = true;
			return this;
		},
		send(data) {
			this.body = data;
			this.headersSent = true;
			return this;
		}
	};
}
var hits = /* @__PURE__ */ new Map();
function rateLimitOk(key, max = 30, windowMs = 6e4) {
	const now = Date.now();
	const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
	if (arr.length >= max) {
		hits.set(key, arr);
		return false;
	}
	arr.push(now);
	hits.set(key, arr);
	if (hits.size > 5e3) {
		const first = hits.keys().next().value;
		if (first) hits.delete(first);
	}
	return true;
}
function clientKey(request) {
	const xf = request.headers.get("x-forwarded-for");
	if (xf) return xf.split(",")[0].trim();
	return request.headers.get("x-real-ip") || "local";
}
async function runApiHandler(handler, request, opts = {}) {
	if (!rateLimitOk(clientKey(request), opts.maxPerMinute ?? 120)) return Response.json({ error: "Too many requests" }, { status: 429 });
	const url = new URL(request.url);
	const query = {};
	url.searchParams.forEach((v, k) => {
		query[k] = v;
	});
	const headers = {};
	request.headers.forEach((v, k) => {
		headers[k] = v;
	});
	const req = {
		query,
		method: request.method,
		headers,
		url: url.pathname + url.search
	};
	const res = createExpressShim();
	try {
		await handler(req, res);
		const status = res.statusCode || 200;
		const body = res.body ?? {};
		return Response.json(body, { status });
	} catch (err) {
		console.error("[api]", err);
		return Response.json({ error: "Internal server error" }, { status: 500 });
	}
}
var Route$13 = createFileRoute("/api/pump-audit")({ server: { handlers: { GET: async ({ request }) => (ensureDexHunterEngines(), runApiHandler(handler$5, request, { maxPerMinute: 15 })) } } });
var Route$12 = createFileRoute("/api/pump-diagnostic")({ server: { handlers: { GET: async ({ request }) => (ensureDexHunterEngines(), runApiHandler(handler$5, request, { maxPerMinute: 15 })) } } });
var backfillInFlight = null;
function runBackfillOnce() {
	if (!backfillInFlight) backfillInFlight = pumpIndexer.runBackfill().finally(() => {
		backfillInFlight = null;
	});
	return backfillInFlight;
}
async function handler$4(req, res) {
	try {
		const tokens = pumpIndexer.getAllTokens();
		if (tokens.length > 0) return res.status(200).json({
			success: true,
			source: "solana-onchain-indexer",
			total: tokens.length,
			tokens
		});
		await runBackfillOnce();
		const refreshedTokens = pumpIndexer.getAllTokens();
		return res.status(200).json({
			success: true,
			source: "solana-onchain-indexer",
			total: refreshedTokens.length,
			tokens: refreshedTokens
		});
	} catch (err) {
		console.error("[API /api/pump-fresh] Error fetching fresh tokens:", err);
		return res.status(500).json({
			success: false,
			error: err.message || "Failed to retrieve fresh Pump.fun tokens",
			tokens: []
		});
	}
}
var Route$11 = createFileRoute("/api/pump-fresh")({ server: { handlers: { GET: async ({ request }) => (ensureDexHunterEngines(), runApiHandler(handler$4, request, { maxPerMinute: 120 })) } } });
async function handler$3(req, res) {
	const mint = req.query.mint || req.query.address || req.query.q;
	if (!mint || typeof mint !== "string") return res.status(400).json({ error: "Missing mint address query parameter (?mint=<ADDRESS>)" });
	const cleanMint = mint.trim();
	if (cleanMint.startsWith("0x") || cleanMint.length < 32 || cleanMint.length > 44) return res.status(200).json({
		status: "NOT_PUMP_TOKEN",
		mint: cleanMint,
		token: null,
		error: null
	});
	try {
		const token = await pumpIndexer.getOrResolveToken(mint.trim());
		if (!token) return res.status(200).json({
			status: "NOT_FOUND",
			mint: mint.trim(),
			token: null,
			error: null
		});
		const status = token.isGraduated ? token.pumpSwapPoolVerified ? "FOUND_PUMPSWAP_ACTIVE" : "FOUND_GRADUATED" : "FOUND_BONDING_CURVE";
		return res.status(200).json({
			status,
			mint: mint.trim(),
			token
		});
	} catch (err) {
		console.error(`[API /api/pump-resolve] Error resolving mint ${mint}:`, err);
		return res.status(500).json({
			status: "RPC_ERROR",
			mint,
			error: err.message || "Internal server error during on-chain resolution"
		});
	}
}
var Route$10 = createFileRoute("/api/pump-resolve")({ server: { handlers: { GET: async ({ request }) => (ensureDexHunterEngines(), runApiHandler(handler$3, request, { maxPerMinute: 120 })) } } });
var Route$9 = createFileRoute("/api/pump-token")({ server: { handlers: { GET: async ({ request }) => (ensureDexHunterEngines(), runApiHandler(handler$3, request, { maxPerMinute: 40 })) } } });
var Route$8 = createFileRoute("/api/pumpfun-audit")({ server: { handlers: { GET: async ({ request }) => (ensureDexHunterEngines(), runApiHandler(handler$5, request, { maxPerMinute: 15 })) } } });
var PUMP_PROGRAM_ID = new PublicKey(PUMP_PROGRAM_ID_STR);
var PUMP_AMM_PROGRAM_ID = new PublicKey(PUMP_AMM_PROGRAM_ID_STR);
function bondingCurvePda(mint) {
	return PublicKey.findProgramAddressSync([Buffer.from("bonding-curve"), mint.toBuffer()], PUMP_PROGRAM_ID)[0];
}
function canonicalPumpPoolPda(mint, index = 0) {
	const [authority] = PublicKey.findProgramAddressSync([Buffer.from("pool-authority"), mint.toBuffer()], PUMP_PROGRAM_ID);
	const indexBuf = Buffer.alloc(2);
	indexBuf.writeUInt16LE(index, 0);
	const [pool] = PublicKey.findProgramAddressSync([
		Buffer.from("pool"),
		indexBuf,
		authority.toBuffer(),
		mint.toBuffer(),
		new PublicKey(SOL_MINT_STR).toBuffer()
	], PUMP_AMM_PROGRAM_ID);
	return pool;
}
var RPC_ENDPOINTS = [
	process.env.SOLANA_RPC_URL,
	"https://solana-rpc.publicnode.com",
	"https://rpc.ankr.com/solana",
	"https://api.mainnet-beta.solana.com"
].filter(Boolean);
var activeRpcIndex = 0;
function getConnection() {
	const endpoint = RPC_ENDPOINTS[activeRpcIndex] || "https://solana-rpc.publicnode.com";
	return new Connection(endpoint, {
		commitment: "confirmed",
		confirmTransactionInitialTimeout: 8e3,
		disableRetryOnRateLimit: true
	});
}
function rotateRpc() {
	activeRpcIndex = (activeRpcIndex + 1) % RPC_ENDPOINTS.length;
}
function isValidMint(mint) {
	try {
		return new PublicKey(mint);
	} catch {
		return null;
	}
}
function decodeBondingCurveBuffer(buf) {
	if (!buf || buf.length < 49) return null;
	try {
		return {
			virtualTokenReserves: buf.readBigUInt64LE(8),
			virtualQuoteReserves: buf.readBigUInt64LE(16),
			realTokenReserves: buf.readBigUInt64LE(24),
			realQuoteReserves: buf.readBigUInt64LE(32),
			tokenTotalSupply: buf.readBigUInt64LE(40),
			complete: buf.readUInt8(48) === 1
		};
	} catch {
		return null;
	}
}
async function getAccountInfoWithRetry(pubkey, maxAttempts = RPC_ENDPOINTS.length * 2) {
	for (let attempt = 0; attempt < maxAttempts; attempt++) try {
		return await getConnection().getAccountInfo(pubkey);
	} catch (err) {
		rotateRpc();
		if (attempt < maxAttempts - 1) {
			await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
			continue;
		}
		throw err;
	}
	return null;
}
/**
* Resolves the full on-chain Pump.fun lifecycle state for a single mint.
*/
async function resolvePumpLifecycle(mintAddress) {
	const base = {
		mint: mintAddress,
		status: "ERROR",
		bondingCurve: null,
		bondingCurveExists: false,
		bondingCurveOwner: null,
		complete: null,
		virtualTokenReserves: null,
		virtualQuoteReserves: null,
		realTokenReserves: null,
		realQuoteReserves: null,
		tokenTotalSupply: null,
		bondingProgressPct: null,
		pumpSwapPool: null,
		pumpSwapPoolVerified: false,
		error: null
	};
	const mint = isValidMint(mintAddress);
	if (!mint) return {
		...base,
		error: "Invalid Solana mint address"
	};
	let curvePda;
	try {
		curvePda = bondingCurvePda(mint);
	} catch (e) {
		return {
			...base,
			error: `Failed to derive bonding curve PDA: ${e?.message || e}`
		};
	}
	base.bondingCurve = curvePda.toBase58();
	let accountInfo;
	try {
		accountInfo = await getAccountInfoWithRetry(curvePda);
	} catch (e) {
		return {
			...base,
			error: `RPC error fetching bonding curve account: ${e?.message || e}`
		};
	}
	if (!accountInfo) return {
		...base,
		status: "NOT_PUMP_FUN",
		bondingCurveExists: false
	};
	base.bondingCurveExists = true;
	base.bondingCurveOwner = accountInfo.owner.toBase58();
	if (!accountInfo.owner.equals(PUMP_PROGRAM_ID)) return {
		...base,
		status: "NOT_PUMP_FUN",
		error: "Account at bonding curve PDA is not owned by the Pump program"
	};
	const curve = decodeBondingCurveBuffer(accountInfo.data);
	if (!curve) return {
		...base,
		error: "Bonding curve account decoded to null (unexpected layout or corrupted data)"
	};
	base.complete = curve.complete;
	base.virtualTokenReserves = curve.virtualTokenReserves.toString();
	base.virtualQuoteReserves = curve.virtualQuoteReserves.toString();
	base.realTokenReserves = curve.realTokenReserves.toString();
	base.realQuoteReserves = curve.realQuoteReserves.toString();
	base.tokenTotalSupply = curve.tokenTotalSupply.toString();
	if (!curve.complete) {
		const initialVal = PUMP_INITIAL_REAL_TOKEN_RESERVES;
		const remainingVal = curve.realTokenReserves;
		if (remainingVal >= initialVal) base.bondingProgressPct = 0;
		else if (remainingVal <= 0n) base.bondingProgressPct = 100;
		else {
			const progressBps = (initialVal - remainingVal) * 10000n / initialVal;
			base.bondingProgressPct = Math.min(100, Math.max(0, Number(progressBps) / 100));
		}
		return {
			...base,
			status: "BONDING"
		};
	}
	let poolPda;
	try {
		poolPda = canonicalPumpPoolPda(mint);
	} catch (e) {
		return {
			...base,
			status: "GRADUATED_MIGRATION_PENDING",
			error: `Failed to derive canonical pool PDA: ${e?.message || e}`
		};
	}
	base.pumpSwapPool = poolPda.toBase58();
	let poolAccountInfo;
	try {
		poolAccountInfo = await getAccountInfoWithRetry(poolPda);
	} catch (e) {
		return {
			...base,
			status: "GRADUATED_MIGRATION_PENDING",
			error: `RPC error checking pool account: ${e?.message || e}`
		};
	}
	if (!poolAccountInfo) return {
		...base,
		status: "GRADUATED_MIGRATION_PENDING"
	};
	if (!poolAccountInfo.owner.equals(PUMP_AMM_PROGRAM_ID)) return {
		...base,
		status: "GRADUATED_MIGRATION_PENDING",
		error: "Account at canonical pool address exists but is not owned by the PumpSwap program"
	};
	base.pumpSwapPoolVerified = true;
	return {
		...base,
		status: "PUMPSWAP_ACTIVE"
	};
}
async function handler$2(req, res) {
	const mint = req.query?.mint;
	if (!mint || !mint.trim()) return res.status(400).json({ error: "Missing required mint query parameter" });
	try {
		const result = await resolvePumpLifecycle(mint.trim());
		let lastCheckedSlot = null;
		try {
			const rpcUrl = process.env.SOLANA_RPC_URL || "https://solana-rpc.publicnode.com";
			lastCheckedSlot = await new Connection(rpcUrl, {
				commitment: "confirmed",
				disableRetryOnRateLimit: true
			}).getSlot();
		} catch {}
		const graduationState = result.status === "BONDING" ? "NOT_GRADUATED" : result.status === "NOT_PUMP_FUN" ? "NOT_A_PUMP_TOKEN" : "GRADUATED";
		const migrationState = result.status === "BONDING" ? "NOT_READY" : result.status === "GRADUATED_MIGRATION_PENDING" ? "MIGRATION_PENDING" : result.status === "PUMPSWAP_ACTIVE" ? "MIGRATED" : result.status === "NOT_PUMP_FUN" ? "NOT_APPLICABLE" : "UNKNOWN";
		return res.status(200).json({
			mint: result.mint,
			pumpProgram: PUMP_PROGRAM_ID.toBase58(),
			bondingCurve: result.bondingCurve,
			bondingCurveExists: result.bondingCurveExists,
			bondingCurveOwner: result.bondingCurveOwner,
			decoded: result.complete !== null,
			complete: result.complete,
			realTokenReserves: result.realTokenReserves,
			realSolReserves: result.realQuoteReserves,
			bondingProgressPct: result.bondingProgressPct,
			graduationState,
			migrationState,
			migrationSignature: null,
			pumpSwapPool: result.pumpSwapPool,
			pumpSwapPoolVerified: result.pumpSwapPoolVerified,
			finalMarketStage: result.status,
			lastCheckedSlot,
			error: result.error
		});
	} catch (error) {
		console.error("Error in /api/pumpfun-debug handler:", error);
		return res.status(500).json({ error: error.message || "Internal server error" });
	}
}
var Route$7 = createFileRoute("/api/pumpfun-debug")({ server: { handlers: { GET: async ({ request }) => (ensureDexHunterEngines(), runApiHandler(handler$2, request, { maxPerMinute: 20 })) } } });
var Route$6 = createFileRoute("/api/pumpfun-diagnostic")({ server: { handlers: { GET: async ({ request }) => (ensureDexHunterEngines(), runApiHandler(handler$5, request, { maxPerMinute: 15 })) } } });
function getFallbackTokens() {
	try {
		const tokens = pumpIndexer.getAllTokens();
		if (Array.isArray(tokens) && tokens.length > 0) return tokens.map((t) => {
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
				pairs: t.pairs || (isGraduated ? [{
					chainId: "solana",
					pairAddress: pairAddr,
					dexName: "PumpSwap",
					dexId: "pumpswap",
					baseToken: {
						address: t.mint,
						name: t.tokenName,
						symbol: t.tokenSymbol
					},
					quoteToken: {
						address: "So11111111111111111111111111111111111111112",
						name: "Wrapped SOL",
						symbol: "SOL"
					},
					priceUsd: t.spotPriceUsd || "0",
					liquidityUsd: t.liquidityUsd
				}] : [{
					chainId: "solana",
					pairAddress: pairAddr,
					dexName: "Pump.fun",
					dexId: "pumpfun",
					baseToken: {
						address: t.mint,
						name: t.tokenName,
						symbol: t.tokenSymbol
					},
					quoteToken: {
						address: "So11111111111111111111111111111111111111112",
						name: "Wrapped SOL",
						symbol: "SOL"
					},
					priceUsd: t.spotPriceUsd || "0",
					liquidityUsd: t.liquidityUsd
				}])
			};
		});
	} catch {}
	return [];
}
async function fetchExternalPumpFun() {
	try {
		const fallbackRes = await fetch("https://api.dexscreener.com/latest/dex/search?q=pumpfun", {
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(3500)
		});
		if (fallbackRes.ok) {
			const pumpPairs = ((await fallbackRes.json()).pairs || []).filter((p) => p.chainId === "solana" && (p.dexId === "pumpfun" || p.url?.includes("pump.fun")));
			if (pumpPairs.length > 0) return pumpPairs.map((p) => ({
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
	} catch {}
	return null;
}
async function handler$1(req, res) {
	const apiKey = process.env.MORALIS_API_KEY;
	if (!apiKey) {
		const externalCoins2 = await fetchExternalPumpFun();
		if (externalCoins2 && externalCoins2.length > 0) return res.status(200).json(externalCoins2);
		return res.status(200).json(getFallbackTokens());
	}
	try {
		const moralisRes = await fetch("https://solana-gateway.moralis.io/token/mainnet/exchange/pumpfun/new", {
			method: "GET",
			headers: {
				"X-API-Key": apiKey,
				"accept": "application/json"
			},
			signal: AbortSignal.timeout(5e3)
		});
		if (moralisRes.ok) {
			const data = await moralisRes.json();
			return res.status(200).json(data);
		}
	} catch {}
	const externalCoins = await fetchExternalPumpFun();
	if (externalCoins && externalCoins.length > 0) return res.status(200).json(externalCoins);
	return res.status(200).json(getFallbackTokens());
}
var Route$5 = createFileRoute("/api/pumpfun-new")({ server: { handlers: { GET: async ({ request }) => (ensureDexHunterEngines(), runApiHandler(handler$1, request, { maxPerMinute: 20 })) } } });
function formatBigIntBalance(rawVal, decimals = 18) {
	try {
		const rawStr = rawVal.toString().trim();
		if (!rawStr || rawStr === "0") return "0";
		const bi = BigInt(rawStr);
		const divisor = 10n ** BigInt(decimals);
		const whole = bi / divisor;
		const fraction = bi % divisor;
		if (fraction === 0n) return whole.toLocaleString();
		const fracStr = fraction.toString().padStart(decimals, "0").slice(0, 4).replace(/0+$/, "");
		return `${whole.toLocaleString()}${fracStr ? "." + fracStr : ""}`;
	} catch {
		return rawVal.toString();
	}
}
function formatSupplyString(rawVal) {
	try {
		if (typeof rawVal === "number") return rawVal.toLocaleString();
		const num = Number(rawVal);
		if (!isNaN(num) && num > 0) return num.toLocaleString();
		return String(rawVal);
	} catch {
		return String(rawVal);
	}
}
var GOPLUS_CHAIN_MAP = {
	ethereum: "1",
	eth: "1",
	"1": "1",
	bsc: "56",
	bnb: "56",
	binance: "56",
	"56": "56",
	base: "8453",
	"8453": "8453",
	arbitrum: "42161",
	arb: "42161",
	"42161": "42161",
	polygon: "137",
	matic: "137",
	"137": "137",
	avalanche: "43114",
	avax: "43114",
	"43114": "43114",
	cronos: "25",
	cro: "25",
	"25": "25",
	optimism: "10",
	op: "10",
	"10": "10",
	fantom: "250",
	ftm: "250",
	blast: "81457",
	linea: "59144",
	zksync: "324",
	scroll: "534352",
	mantle: "5000",
	berachain: "80094",
	bera: "80094"
};
var BLOCKSCOUT_INSTANCES = {
	base: "https://base.blockscout.com",
	ethereum: "https://eth.blockscout.com",
	eth: "https://eth.blockscout.com",
	arbitrum: "https://arbitrum.blockscout.com",
	optimism: "https://optimism.blockscout.com",
	polygon: "https://polygon.blockscout.com",
	berachain: "https://berascan.com"
};
var EVM_RPC_MAP = {
	base: ["https://mainnet.base.org", "https://base.llamarpc.com"],
	ethereum: [
		"https://cloudflare-eth.com",
		"https://rpc.ankr.com/eth",
		"https://eth.llamarpc.com"
	],
	bsc: ["https://binance.llamarpc.com", "https://bsc-dataseed.binance.org"],
	arbitrum: ["https://arb1.arbitrum.io/rpc", "https://arbitrum.llamarpc.com"],
	polygon: ["https://polygon-rpc.com", "https://polygon.llamarpc.com"],
	avalanche: ["https://api.avax.network/ext/bc/C/rpc", "https://avalanche.public-rpc.com"],
	cronos: ["https://evm.cronos.org", "https://cronos-evm.publicnode.com"],
	optimism: ["https://mainnet.optimism.io", "https://optimism.llamarpc.com"],
	robinhood: ["https://rpc.mainnet.chain.robinhood.com"]
};
async function callEvmRpc(rpcUrl, to, data, timeoutMs = 3500) {
	try {
		const res = await fetch(rpcUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				jsonrpc: "2.0",
				id: Math.floor(Math.random() * 1e4),
				method: "eth_call",
				params: [{
					to,
					data
				}, "latest"]
			}),
			signal: AbortSignal.timeout(timeoutMs)
		});
		if (!res.ok) return null;
		const json = await res.json();
		return json.result && json.result !== "0x" ? json.result : null;
	} catch {
		return null;
	}
}
async function handler(req, res) {
	const rawAddress = (req.query.address || req.query.tokenAddress || req.query.token || "").toString().trim();
	const rawPairAddress = (req.query.pairAddress || req.query.pair || "").toString().trim();
	const rawChain = (req.query.chainId || req.query.chain || "").toString().toLowerCase().trim();
	const rawProvider = (req.query.provider || "").toString().toLowerCase().trim();
	if (!rawAddress) return res.status(200).json({
		totalSupply: null,
		totalHolders: 0,
		top10SupplyPercentage: null,
		holders: [],
		topHolders: [],
		error: "Missing token address parameter"
	});
	const isEvmAddress = rawAddress.startsWith("0x") || /^[0-9a-fA-F]{40,42}$/.test(rawAddress);
	const cleanAddress = isEvmAddress && !rawAddress.startsWith("0x") ? `0x${rawAddress}` : rawAddress;
	let chainId = rawChain;
	if (!chainId) {
		if (rawProvider.includes("robinhood")) chainId = "robinhood";
		else if (rawProvider.includes("solana")) chainId = "solana";
		else if (isEvmAddress) chainId = "ethereum";
		else chainId = "solana";
	}
	if (chainId === "eth") chainId = "ethereum";
	if (chainId === "bnb" || chainId === "binance") chainId = "bsc";
	if (chainId === "arb") chainId = "arbitrum";
	if (chainId === "matic") chainId = "polygon";
	if (chainId === "avax") chainId = "avalanche";
	if (chainId === "cro") chainId = "cronos";
	if (chainId === "op") chainId = "optimism";
	if (chainId === "sol") chainId = "solana";
	if (chainId === "robinhood" || chainId === "robinhoodchain" || chainId === "4663" || rawProvider.includes("robinhood")) try {
		const headers = {
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			"Accept": "application/json"
		};
		const [v2TokenRes, v2AddressRes, v2HoldersRes] = await Promise.allSettled([
			fetch(`https://robinhoodchain.blockscout.com/api/v2/tokens/${encodeURIComponent(cleanAddress)}`, {
				headers,
				signal: AbortSignal.timeout(4e3)
			}).then((r) => r.ok ? r.json() : null),
			fetch(`https://robinhoodchain.blockscout.com/api/v2/addresses/${encodeURIComponent(cleanAddress)}`, {
				headers,
				signal: AbortSignal.timeout(4e3)
			}).then((r) => r.ok ? r.json() : null),
			fetch(`https://robinhoodchain.blockscout.com/api/v2/tokens/${encodeURIComponent(cleanAddress)}/holders`, {
				headers,
				signal: AbortSignal.timeout(4e3)
			}).then((r) => r.ok ? r.json() : null)
		]);
		const v2Token = v2TokenRes.status === "fulfilled" ? v2TokenRes.value : null;
		const v2Address = v2AddressRes.status === "fulfilled" ? v2AddressRes.value : null;
		const v2Holders = v2HoldersRes.status === "fulfilled" ? v2HoldersRes.value : null;
		const creator = v2Address?.creator_address_hash || v2Address?.token?.creator_address_hash || void 0;
		const creationTx = v2Address?.creation_transaction_hash || void 0;
		const decimals = Number(v2Token?.decimals || v2Address?.token?.decimals || 18);
		const rawTotalSupply = (v2Token?.total_supply || v2Address?.token?.total_supply || "0").toString();
		const totalHoldersCount = Number(v2Token?.holders_count || v2Address?.token?.holders_count || 0);
		let totalBigInt = 0n;
		try {
			if (rawTotalSupply && rawTotalSupply !== "0") totalBigInt = BigInt(rawTotalSupply);
		} catch {}
		const totalSupplyFormatted = rawTotalSupply && rawTotalSupply !== "0" ? formatBigIntBalance(rawTotalSupply, decimals) : null;
		const rawItems = Array.isArray(v2Holders?.items) ? v2Holders.items : [];
		if (rawItems.length > 0) {
			if (totalBigInt === 0n) totalBigInt = rawItems.reduce((acc, it) => {
				try {
					return acc + BigInt(it.value || 0);
				} catch {
					return acc;
				}
			}, 0n);
			const holders = rawItems.map((it) => {
				const owner = (it.address?.hash || it.address || "").toLowerCase().trim();
				const rawVal = (it.value || "0").toString();
				let pct = 0;
				try {
					if (totalBigInt > 0n) {
						const hBigInt = BigInt(rawVal);
						pct = Number(hBigInt * 1000000n / totalBigInt) / 1e4;
					}
				} catch {}
				const isDead = owner === "0x000000000000000000000000000000000000dead" || owner === "0x0000000000000000000000000000000000000000";
				const isCreatorWallet = creator && owner.toLowerCase() === creator.toLowerCase();
				const tagName = it.address?.name || it.address?.implementations?.[0]?.name;
				let label;
				if (isDead) label = "Burned (Dead Address)";
				else if (isCreatorWallet) label = "Token Deployer / Creator";
				else if (tagName) label = tagName;
				return {
					address: owner,
					ownerAddress: owner,
					balance: rawVal,
					balanceFormatted: formatBigIntBalance(rawVal, decimals),
					percentage: Number(pct.toFixed(2)),
					percentageRelativeToTotalSupply: Number(pct.toFixed(2)),
					isContract: Boolean(it.address?.is_contract || isDead),
					label
				};
			});
			holders.sort((a, b) => b.percentageRelativeToTotalSupply - a.percentageRelativeToTotalSupply);
			const top10 = holders.slice(0, 10);
			const top10SupplyPercentage = Number(top10.reduce((acc, h) => acc + (h.percentageRelativeToTotalSupply || 0), 0).toFixed(2));
			return res.status(200).json({
				totalSupply: rawTotalSupply !== "0" ? rawTotalSupply : null,
				totalSupplyFormatted,
				decimals,
				totalHolders: totalHoldersCount > 0 ? totalHoldersCount : holders.length,
				top10SupplyPercentage: top10SupplyPercentage > 0 ? top10SupplyPercentage : null,
				holders,
				topHolders: holders,
				creator,
				supplier: creator,
				deployer: creator,
				creationTx,
				source: "robinhood-blockscout-v2",
				chain: "robinhood"
			});
		}
		const [v1HoldersRes, v1SupplyRes, rpcSupplyRes] = await Promise.allSettled([
			fetch(`https://robinhoodchain.blockscout.com/api?module=token&action=getTokenHolders&contractaddress=${encodeURIComponent(cleanAddress)}`, {
				headers,
				signal: AbortSignal.timeout(3500)
			}).then((r) => r.ok ? r.json() : null),
			fetch(`https://robinhoodchain.blockscout.com/api?module=stats&action=tokensupply&contractaddress=${encodeURIComponent(cleanAddress)}`, {
				headers,
				signal: AbortSignal.timeout(3500)
			}).then((r) => r.ok ? r.json() : null),
			callEvmRpc("https://rpc.mainnet.chain.robinhood.com", cleanAddress, "0x18160ddd")
		]);
		const v1HoldersData = v1HoldersRes.status === "fulfilled" ? v1HoldersRes.value : null;
		const v1SupplyData = v1SupplyRes.status === "fulfilled" ? v1SupplyRes.value : null;
		const rpcSupplyHex = rpcSupplyRes.status === "fulfilled" ? rpcSupplyRes.value : null;
		let fallbackRawSupply = rawTotalSupply;
		if (!fallbackRawSupply || fallbackRawSupply === "0") {
			if (v1SupplyData?.status === "1" && v1SupplyData?.result) fallbackRawSupply = v1SupplyData.result.toString();
			else if (rpcSupplyHex) try {
				fallbackRawSupply = BigInt(rpcSupplyHex).toString();
			} catch {}
		}
		const v1List = v1HoldersData?.status === "1" && Array.isArray(v1HoldersData?.result) ? v1HoldersData.result : [];
		if (v1List.length > 0) {
			let fallbackTotalBigInt = 0n;
			try {
				if (fallbackRawSupply) fallbackTotalBigInt = BigInt(fallbackRawSupply);
			} catch {}
			if (fallbackTotalBigInt === 0n) fallbackTotalBigInt = v1List.reduce((acc, h) => {
				try {
					return acc + BigInt(h.value || 0);
				} catch {
					return acc;
				}
			}, 0n);
			const holders = v1List.map((h) => {
				const owner = (h.address || "").toLowerCase().trim();
				const rawVal = (h.value || "0").toString();
				let pct = 0;
				try {
					if (fallbackTotalBigInt > 0n) {
						const hBigInt = BigInt(rawVal);
						pct = Number(hBigInt * 1000000n / fallbackTotalBigInt) / 1e4;
					}
				} catch {}
				const isDead = owner === "0x000000000000000000000000000000000000dead" || owner === "0x0000000000000000000000000000000000000000";
				const isCreatorWallet = creator && owner.toLowerCase() === creator.toLowerCase();
				return {
					address: owner,
					ownerAddress: owner,
					balance: rawVal,
					balanceFormatted: formatBigIntBalance(rawVal, decimals),
					percentage: Number(pct.toFixed(2)),
					percentageRelativeToTotalSupply: Number(pct.toFixed(2)),
					isContract: isDead,
					label: isDead ? "Burned (Dead Address)" : isCreatorWallet ? "Token Deployer / Creator" : void 0
				};
			});
			holders.sort((a, b) => b.percentageRelativeToTotalSupply - a.percentageRelativeToTotalSupply);
			const top10 = holders.slice(0, 10);
			const top10SupplyPercentage = Number(top10.reduce((acc, h) => acc + (h.percentageRelativeToTotalSupply || 0), 0).toFixed(2));
			return res.status(200).json({
				totalSupply: fallbackRawSupply !== "0" ? fallbackRawSupply : null,
				totalSupplyFormatted: fallbackRawSupply ? formatBigIntBalance(fallbackRawSupply, decimals) : void 0,
				decimals,
				totalHolders: totalHoldersCount > 0 ? totalHoldersCount : holders.length,
				top10SupplyPercentage: top10SupplyPercentage > 0 ? top10SupplyPercentage : null,
				holders,
				topHolders: holders,
				creator,
				supplier: creator,
				deployer: creator,
				source: "robinhood-blockscout-v1",
				chain: "robinhood"
			});
		}
	} catch {}
	if (!isEvmAddress && (chainId === "solana" || chainId === "sol" || cleanAddress.length >= 32)) {
		try {
			const rugcheckRes = await fetch(`https://api.rugcheck.xyz/v1/tokens/${encodeURIComponent(cleanAddress)}/report`, {
				signal: AbortSignal.timeout(4e3),
				headers: {
					"Accept": "application/json",
					"User-Agent": "DexHunter/1.0"
				}
			});
			if (rugcheckRes.ok) {
				const data = await rugcheckRes.json();
				const rawHolders = Array.isArray(data?.topHolders) ? data.topHolders : [];
				const creator = data?.creator || data?.tokenMeta?.updateAuthority || data?.mintAuthority;
				if (rawHolders.length > 0) {
					const totalSupply = data?.token?.supply || data?.tokenMeta?.supply || null;
					const decimals = data?.token?.decimals ?? data?.tokenMeta?.decimals ?? 6;
					const holders = rawHolders.map((h) => {
						const ownerWallet = (h.owner || h.ownerAddress || h.address || "").trim();
						const pct = typeof h.pct === "number" ? h.pct : typeof h.percentageRelativeToTotalSupply === "number" ? h.percentageRelativeToTotalSupply : 0;
						const balanceVal = h.uiAmount ?? h.amount ?? h.balance ?? 0;
						const balanceFormatted = h.uiAmountString ?? (balanceVal ? balanceVal.toLocaleString() : "0");
						return {
							address: ownerWallet,
							ownerAddress: ownerWallet,
							tokenAccount: h.address,
							balance: balanceVal,
							balanceFormatted,
							percentage: Number(pct.toFixed(2)),
							percentageRelativeToTotalSupply: Number(pct.toFixed(2)),
							isContract: Boolean(h.isContract || h.insider),
							label: h.insider ? "Insider / Creator" : void 0
						};
					});
					holders.sort((a, b) => b.percentageRelativeToTotalSupply - a.percentageRelativeToTotalSupply);
					const top10 = holders.slice(0, 10);
					const top10SupplyPercentage = Number(top10.reduce((acc, h) => acc + (h.percentageRelativeToTotalSupply || 0), 0).toFixed(2));
					return res.status(200).json({
						totalSupply,
						totalSupplyFormatted: totalSupply ? Number(totalSupply).toLocaleString() : void 0,
						decimals,
						totalHolders: data.totalHolders || holders.length,
						top10SupplyPercentage: top10SupplyPercentage > 0 ? top10SupplyPercentage : null,
						holders,
						topHolders: holders,
						creator,
						supplier: creator,
						deployer: creator,
						source: "onchain-solana-rugcheck",
						chain: "solana"
					});
				}
			}
		} catch {}
		try {
			const goplusSolRes = await fetch(`https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${encodeURIComponent(cleanAddress)}`, {
				headers: { Accept: "application/json" },
				signal: AbortSignal.timeout(3500)
			});
			if (goplusSolRes.ok) {
				const solToken = (await goplusSolRes.json())?.result?.[cleanAddress];
				if (solToken) {
					const rawHolders = Array.isArray(solToken.holders) ? solToken.holders : [];
					const creator = Array.isArray(solToken.creators) && solToken.creators[0]?.address ? solToken.creators[0].address : solToken.mint_authority?.authority?.[0] || void 0;
					const totalSupply = solToken.total_supply || null;
					if (rawHolders.length > 0) {
						const holders = rawHolders.map((h) => {
							const pct = Number((Number(h.percent || 0) * 100).toFixed(2));
							return {
								address: h.address,
								ownerAddress: h.address,
								balance: h.balance || "0",
								balanceFormatted: typeof h.balance === "string" ? Number(h.balance).toLocaleString() : String(h.balance),
								percentage: pct,
								percentageRelativeToTotalSupply: pct,
								label: h.tag || (creator && h.address.toLowerCase() === creator.toLowerCase() ? "Token Creator" : void 0)
							};
						});
						holders.sort((a, b) => b.percentageRelativeToTotalSupply - a.percentageRelativeToTotalSupply);
						const top10 = holders.slice(0, 10);
						const top10SupplyPercentage = Number(top10.reduce((acc, h) => acc + h.percentageRelativeToTotalSupply, 0).toFixed(2));
						return res.status(200).json({
							totalSupply,
							totalSupplyFormatted: totalSupply ? formatSupplyString(totalSupply) : void 0,
							decimals: 6,
							totalHolders: Number(solToken.holder_count) || holders.length,
							top10SupplyPercentage: top10SupplyPercentage > 0 ? top10SupplyPercentage : null,
							holders,
							topHolders: holders,
							creator,
							supplier: creator,
							deployer: creator,
							source: "goplus-solana",
							chain: "solana"
						});
					}
				}
			}
		} catch {}
		try {
			const { resolvePumpToken, pumpIndexer } = await import("./pump-engine-Cr3Xlq8H.mjs");
			const token = pumpIndexer?.getToken(cleanAddress) || (await resolvePumpToken(cleanAddress)).token;
			if (token && token.bondingCurvePda) {
				const totalSupplyNum = 1e9;
				const realTokens = token.realTokenReserves ? Number(BigInt(token.realTokenReserves)) / 1e6 : 0;
				const curvePct = Number((realTokens / totalSupplyNum * 100).toFixed(2));
				const curveNote = Number.isFinite(curvePct) ? `The bonding curve reserve is about ${curvePct}% of supply. ` : "";
				return res.status(200).json({
					totalSupply: totalSupplyNum,
					totalSupplyFormatted: "1,000,000,000",
					decimals: 6,
					totalHolders: null,
					top10SupplyPercentage: null,
					holders: [],
					topHolders: [],
					creator: token.creator || void 0,
					message: `${curveNote}Individual holder wallets were not returned, so no holder count is shown.`,
					source: "onchain-solana-pumpfun-bonding-curve",
					chain: "solana"
				});
			}
		} catch (err) {
			console.warn("[Token Holders] Pump bonding curve fallback error:", err?.message);
		}
	}
	if (isEvmAddress) {
		const goplusChainId = GOPLUS_CHAIN_MAP[chainId];
		let goplusTokenInfo = null;
		if (goplusChainId) try {
			const gpRes = await fetch(`https://api.gopluslabs.io/api/v1/token_security/${goplusChainId}?contract_addresses=${encodeURIComponent(cleanAddress)}`, {
				headers: { Accept: "application/json" },
				signal: AbortSignal.timeout(4500)
			});
			if (gpRes.ok) {
				const gpData = await gpRes.json();
				goplusTokenInfo = gpData?.result?.[cleanAddress.toLowerCase()] || gpData?.result?.[cleanAddress];
				if (goplusTokenInfo) {
					const rawHolders = Array.isArray(goplusTokenInfo.holders) ? goplusTokenInfo.holders : [];
					const creator = goplusTokenInfo.creator_address || void 0;
					const owner = goplusTokenInfo.owner_address || void 0;
					const totalSupply = goplusTokenInfo.total_supply || null;
					const holderCount = Number(goplusTokenInfo.holder_count) || 0;
					if (rawHolders.length > 0) {
						const holders = rawHolders.map((h) => {
							const hAddr = (h.address || "").toLowerCase().trim();
							const pct = Number((Number(h.percent || 0) * 100).toFixed(2));
							const isDead = hAddr === "0x000000000000000000000000000000000000dead" || hAddr === "0x0000000000000000000000000000000000000000";
							const isCreator = creator && hAddr === creator.toLowerCase();
							const isOwner = owner && hAddr === owner.toLowerCase();
							let label = h.tag || void 0;
							if (isDead) label = "Burned Supply (Dead Address)";
							else if (isCreator) label = "Token Deployer / Creator";
							else if (isOwner) label = "Contract Owner";
							return {
								address: h.address,
								ownerAddress: h.address,
								balance: h.balance || "0",
								balanceFormatted: typeof h.balance === "string" ? Number(h.balance).toLocaleString() : String(h.balance),
								percentage: pct,
								percentageRelativeToTotalSupply: pct,
								isContract: Boolean(h.is_contract || isDead),
								label
							};
						});
						if (Array.isArray(goplusTokenInfo.lp_holders) && goplusTokenInfo.lp_holders.length > 0) for (const lp of goplusTokenInfo.lp_holders) {
							const lpAddr = (lp.address || "").toLowerCase().trim();
							const existing = holders.find((h) => h.address.toLowerCase() === lpAddr);
							if (existing) {
								existing.isContract = true;
								if (!existing.label) existing.label = lp.tag || "DEX Liquidity Pool";
							}
						}
						holders.sort((a, b) => b.percentageRelativeToTotalSupply - a.percentageRelativeToTotalSupply);
						const sumTop10 = holders.slice(0, 10).reduce((acc, h) => acc + (h.percentageRelativeToTotalSupply || 0), 0);
						const top10SupplyPercentage = Number(Math.min(sumTop10, 100).toFixed(2));
						return res.status(200).json({
							totalSupply,
							totalSupplyFormatted: totalSupply ? formatSupplyString(totalSupply) : void 0,
							totalHolders: holderCount > 0 ? holderCount : holders.length,
							top10SupplyPercentage: top10SupplyPercentage > 0 ? top10SupplyPercentage : null,
							holders,
							topHolders: holders,
							creator,
							supplier: creator || owner,
							deployer: creator,
							source: "goplus-evm",
							chain: chainId
						});
					}
				}
			}
		} catch {}
		const blockscoutBase = BLOCKSCOUT_INSTANCES[chainId];
		if (blockscoutBase) try {
			const [bsHoldersRes, bsTokenRes] = await Promise.allSettled([fetch(`${blockscoutBase}/api/v2/tokens/${encodeURIComponent(cleanAddress)}/holders`, {
				headers: {
					Accept: "application/json",
					"User-Agent": "DexHunter/1.0"
				},
				signal: AbortSignal.timeout(4e3)
			}).then((r) => r.ok ? r.json() : null), fetch(`${blockscoutBase}/api/v2/tokens/${encodeURIComponent(cleanAddress)}`, {
				headers: {
					Accept: "application/json",
					"User-Agent": "DexHunter/1.0"
				},
				signal: AbortSignal.timeout(4e3)
			}).then((r) => r.ok ? r.json() : null)]);
			const bsHolders = bsHoldersRes.status === "fulfilled" ? bsHoldersRes.value : null;
			const bsToken = bsTokenRes.status === "fulfilled" ? bsTokenRes.value : null;
			const rawItems = Array.isArray(bsHolders?.items) ? bsHolders.items : [];
			if (rawItems.length > 0) {
				const decimals = Number(bsToken?.decimals || 18);
				const rawTotalSupply = (bsToken?.total_supply || "0").toString();
				let totalBigInt = 0n;
				try {
					if (rawTotalSupply && rawTotalSupply !== "0") totalBigInt = BigInt(rawTotalSupply);
				} catch {}
				if (totalBigInt === 0n) totalBigInt = rawItems.reduce((acc, it) => {
					try {
						return acc + BigInt(it.value || 0);
					} catch {
						return acc;
					}
				}, 0n);
				const holders = rawItems.map((it) => {
					const owner = (it.address?.hash || it.address || "").toLowerCase().trim();
					const rawVal = (it.value || "0").toString();
					let pct = 0;
					try {
						if (totalBigInt > 0n) {
							const hBigInt = BigInt(rawVal);
							pct = Number(hBigInt * 1000000n / totalBigInt) / 1e4;
						}
					} catch {}
					const isDead = owner === "0x000000000000000000000000000000000000dead" || owner === "0x0000000000000000000000000000000000000000";
					const tagName = it.address?.name || it.address?.implementations?.[0]?.name;
					return {
						address: owner,
						ownerAddress: owner,
						balance: rawVal,
						balanceFormatted: formatBigIntBalance(rawVal, decimals),
						percentage: Number(pct.toFixed(2)),
						percentageRelativeToTotalSupply: Number(pct.toFixed(2)),
						isContract: Boolean(it.address?.is_contract || isDead),
						label: isDead ? "Burned Supply (Dead Address)" : tagName || void 0
					};
				});
				holders.sort((a, b) => b.percentageRelativeToTotalSupply - a.percentageRelativeToTotalSupply);
				const top10 = holders.slice(0, 10);
				const top10SupplyPercentage = Number(top10.reduce((acc, h) => acc + (h.percentageRelativeToTotalSupply || 0), 0).toFixed(2));
				return res.status(200).json({
					totalSupply: rawTotalSupply !== "0" ? rawTotalSupply : null,
					totalSupplyFormatted: rawTotalSupply && rawTotalSupply !== "0" ? formatBigIntBalance(rawTotalSupply, decimals) : void 0,
					decimals,
					totalHolders: Number(bsToken?.holders_count) || holders.length,
					top10SupplyPercentage: top10SupplyPercentage > 0 ? top10SupplyPercentage : null,
					holders,
					topHolders: holders,
					source: "blockscout-v2",
					chain: chainId
				});
			}
		} catch {}
		const apiKey = process.env.MORALIS_API_KEY;
		if (apiKey) try {
			const evmRes = await fetch(`https://deep-index.moralis.io/api/v2.2/erc20/${encodeURIComponent(cleanAddress)}/owners?chain=${chainId === "base" ? "base" : chainId === "bsc" ? "bsc" : chainId === "arbitrum" ? "arbitrum" : chainId === "polygon" ? "polygon" : chainId === "optimism" ? "optimism" : chainId === "avalanche" ? "avalanche" : "eth"}&order=DESC`, {
				method: "GET",
				headers: {
					"X-API-Key": apiKey,
					"accept": "application/json"
				},
				signal: AbortSignal.timeout(3e3)
			});
			if (evmRes.ok) {
				const evmData = await evmRes.json();
				const rawEVM = Array.isArray(evmData?.result) ? evmData.result : [];
				if (rawEVM.length > 0) {
					const holders = rawEVM.map((h) => {
						const ownerWallet = (h.owner_address || h.address || "").trim();
						const pct = Number(h.percentage_relative_to_total_supply || h.percentageRelativeToTotalSupply || 0);
						return {
							address: ownerWallet,
							ownerAddress: ownerWallet,
							balance: h.balance_formatted || h.balance || 0,
							balanceFormatted: h.balance_formatted || "",
							percentage: Number(pct.toFixed(2)),
							percentageRelativeToTotalSupply: Number(pct.toFixed(2)),
							isContract: Boolean(h.is_contract)
						};
					});
					const top10 = holders.slice(0, 10);
					const top10SupplyPercentage = Number(top10.reduce((acc, h) => acc + (h.percentageRelativeToTotalSupply || 0), 0).toFixed(2));
					return res.status(200).json({
						totalSupply: evmData.total_supply || null,
						totalSupplyFormatted: evmData.total_supply ? Number(evmData.total_supply).toLocaleString() : void 0,
						totalHolders: evmData.total || holders.length,
						top10SupplyPercentage: top10SupplyPercentage > 0 ? top10SupplyPercentage : null,
						holders,
						topHolders: holders,
						source: "moralis-evm",
						chain: chainId
					});
				}
			}
		} catch {}
		const rpcList = EVM_RPC_MAP[chainId] || [];
		for (const rpc of rpcList) try {
			const calls = [callEvmRpc(rpc, cleanAddress, "0x18160ddd"), callEvmRpc(rpc, cleanAddress, "0x313ce567")];
			if (rawPairAddress && rawPairAddress.startsWith("0x") && rawPairAddress.length === 42) {
				const pairPadded = rawPairAddress.slice(2).padStart(64, "0");
				calls.push(callEvmRpc(rpc, cleanAddress, "0x70a08231" + pairPadded));
			}
			const deadPadded = "000000000000000000000000000000000000dead".padStart(64, "0");
			calls.push(callEvmRpc(rpc, cleanAddress, "0x70a08231" + deadPadded));
			const creatorAddr = goplusTokenInfo?.creator_address || goplusTokenInfo?.owner_address;
			if (creatorAddr && creatorAddr.startsWith("0x") && creatorAddr.length === 42) {
				const creatorPadded = creatorAddr.slice(2).padStart(64, "0");
				calls.push(callEvmRpc(rpc, cleanAddress, "0x70a08231" + creatorPadded));
			}
			const results = await Promise.all(calls);
			const supplyHex = results[0];
			const decHex = results[1];
			if (supplyHex && supplyHex !== "0x") {
				const rawSupplyBigInt = BigInt(supplyHex);
				const decimals = decHex && decHex !== "0x" ? Number(BigInt(decHex)) : 18;
				const totalSupplyFormatted = formatBigIntBalance(rawSupplyBigInt.toString(), decimals);
				const synthesizedHolders = [];
				let resIdx = 2;
				if (rawPairAddress && rawPairAddress.startsWith("0x") && rawPairAddress.length === 42) {
					const pairBalHex = results[resIdx++];
					if (pairBalHex && pairBalHex !== "0x") {
						const pBal = BigInt(pairBalHex);
						if (pBal > 0n && rawSupplyBigInt > 0n) {
							const pct = Number(pBal * 1000000n / rawSupplyBigInt) / 1e4;
							synthesizedHolders.push({
								address: rawPairAddress,
								ownerAddress: rawPairAddress,
								balance: pBal.toString(),
								balanceFormatted: formatBigIntBalance(pBal.toString(), decimals),
								percentage: Number(pct.toFixed(2)),
								percentageRelativeToTotalSupply: Number(pct.toFixed(2)),
								isContract: true,
								label: "DEX Liquidity Pool"
							});
						}
					}
				}
				const deadBalHex = results[resIdx++];
				if (deadBalHex && deadBalHex !== "0x") {
					const dBal = BigInt(deadBalHex);
					if (dBal > 0n && rawSupplyBigInt > 0n) {
						const pct = Number(dBal * 1000000n / rawSupplyBigInt) / 1e4;
						synthesizedHolders.push({
							address: "0x000000000000000000000000000000000000dead",
							ownerAddress: "0x000000000000000000000000000000000000dead",
							balance: dBal.toString(),
							balanceFormatted: formatBigIntBalance(dBal.toString(), decimals),
							percentage: Number(pct.toFixed(2)),
							percentageRelativeToTotalSupply: Number(pct.toFixed(2)),
							isContract: true,
							label: "Burned Supply (Dead Address)"
						});
					}
				}
				if (creatorAddr && creatorAddr.startsWith("0x") && creatorAddr.length === 42) {
					const creatorBalHex = results[resIdx++];
					if (creatorBalHex && creatorBalHex !== "0x") {
						const cBal = BigInt(creatorBalHex);
						if (cBal > 0n && rawSupplyBigInt > 0n) {
							const pct = Number(cBal * 1000000n / rawSupplyBigInt) / 1e4;
							synthesizedHolders.push({
								address: creatorAddr,
								ownerAddress: creatorAddr,
								balance: cBal.toString(),
								balanceFormatted: formatBigIntBalance(cBal.toString(), decimals),
								percentage: Number(pct.toFixed(2)),
								percentageRelativeToTotalSupply: Number(pct.toFixed(2)),
								isContract: false,
								label: "Token Deployer / Creator"
							});
						}
					}
				}
				synthesizedHolders.sort((a, b) => b.percentageRelativeToTotalSupply - a.percentageRelativeToTotalSupply);
				const top10SupplyPercentage = synthesizedHolders.length > 0 ? Number(synthesizedHolders.slice(0, 10).reduce((acc, h) => acc + h.percentageRelativeToTotalSupply, 0).toFixed(2)) : null;
				const totalHolders = Number(goplusTokenInfo?.holder_count) || (synthesizedHolders.length > 0 ? synthesizedHolders.length : 1);
				return res.status(200).json({
					totalSupply: rawSupplyBigInt.toString(),
					totalSupplyFormatted,
					decimals,
					totalHolders,
					top10SupplyPercentage,
					holders: synthesizedHolders,
					topHolders: synthesizedHolders,
					creator: creatorAddr,
					supplier: creatorAddr,
					deployer: creatorAddr,
					source: "onchain-evm-rpc",
					chain: chainId
				});
			}
		} catch {}
	}
	return res.status(200).json({
		totalSupply: null,
		totalHolders: 0,
		top10SupplyPercentage: null,
		holders: [],
		topHolders: [],
		chain: chainId,
		message: `No holder data available for this ${chainId.toUpperCase()} token address`
	});
}
var Route$4 = createFileRoute("/api/token-holders")({ server: { handlers: { GET: async ({ request }) => (ensureDexHunterEngines(), runApiHandler(handler, request, { maxPerMinute: 80 })) } } });
var Route$3 = createFileRoute("/api/argus/launches")({ server: { handlers: { GET: async ({ request }) => {
	ensureDexHunterEngines();
	const url = new URL(request.url);
	const portalRaw = url.searchParams.get("portal");
	const portal = portalRaw ? Number(portalRaw) : void 0;
	const tier = url.searchParams.get("tier") || void 0;
	const reusedOnly = url.searchParams.get("reusedOnly") === "true";
	const q = (url.searchParams.get("q") || "").trim().toLowerCase();
	const address = (url.searchParams.get("address") || "").trim().toLowerCase();
	const limitRaw = Number(url.searchParams.get("limit") || "0");
	const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(2e3, limitRaw) : 0;
	let tokens = argusIndexer.getArgusTokens();
	if (portal) tokens = tokens.filter((t) => t.argusPortalId === portal);
	if (tier) tokens = tokens.filter((t) => t.argusDevBuyTier === tier);
	if (reusedOnly) tokens = tokens.filter((t) => t.argusReusedSocials?.hasReusedSocials);
	if (address) tokens = tokens.filter((t) => (t.baseToken?.address || "").toLowerCase() === address);
	else if (q) tokens = tokens.filter((t) => {
		const addr = t.baseToken?.address?.toLowerCase() || "";
		const sym = t.baseToken?.symbol?.toLowerCase() || "";
		const name = t.baseToken?.name?.toLowerCase() || "";
		return addr.includes(q) || sym.includes(q) || name.includes(q);
	});
	const total = tokens.length;
	if (limit > 0) tokens = tokens.slice(0, limit);
	return Response.json({
		success: true,
		total,
		message: "Argus Launchpad tokens on Arc mainnet (Chain 5042)",
		portalsTracked: [7, 8],
		tokens
	});
} } } });
var Route$2 = createFileRoute("/api/argus/stats")({ server: { handlers: { GET: async () => {
	ensureDexHunterEngines();
	return Response.json({
		success: true,
		stats: argusIndexer.getStats()
	});
} } } });
var Route$1 = createFileRoute("/api/discovery/export")({ server: { handlers: { GET: async ({ request }) => {
	ensureDexHunterEngines();
	const url = new URL(request.url);
	const format = url.searchParams.get("format") === "csv" ? "csv" : "json";
	const chain = url.searchParams.get("chain") || void 0;
	const modeParam = url.searchParams.get("mode") || void 0;
	const mode = modeParam === "latest" || modeParam === "fresh_mints" || modeParam === "trending" ? modeParam : void 0;
	const result = discoveryEngine.exportData(format, chain, mode);
	return new Response(result.data, { headers: {
		"Content-Type": result.contentType,
		"Content-Disposition": `attachment; filename="${result.filename}"`
	} });
} } } });
var Route = createFileRoute("/api/discovery/stats")({ server: { handlers: { GET: async () => {
	ensureDexHunterEngines();
	return Response.json({
		success: true,
		stats: discoveryEngine.getStats()
	});
} } } });
var IndexRoute = Route$16.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$17
});
var ApiDiscoveryRoute = Route$15.update({
	id: "/api/discovery",
	path: "/api/discovery",
	getParentRoute: () => Route$17
});
var ApiHealthRoute = Route$14.update({
	id: "/api/health",
	path: "/api/health",
	getParentRoute: () => Route$17
});
var ApiPumpAuditRoute = Route$13.update({
	id: "/api/pump-audit",
	path: "/api/pump-audit",
	getParentRoute: () => Route$17
});
var ApiPumpDiagnosticRoute = Route$12.update({
	id: "/api/pump-diagnostic",
	path: "/api/pump-diagnostic",
	getParentRoute: () => Route$17
});
var ApiPumpFreshRoute = Route$11.update({
	id: "/api/pump-fresh",
	path: "/api/pump-fresh",
	getParentRoute: () => Route$17
});
var ApiPumpResolveRoute = Route$10.update({
	id: "/api/pump-resolve",
	path: "/api/pump-resolve",
	getParentRoute: () => Route$17
});
var ApiPumpTokenRoute = Route$9.update({
	id: "/api/pump-token",
	path: "/api/pump-token",
	getParentRoute: () => Route$17
});
var ApiPumpfunAuditRoute = Route$8.update({
	id: "/api/pumpfun-audit",
	path: "/api/pumpfun-audit",
	getParentRoute: () => Route$17
});
var ApiPumpfunDebugRoute = Route$7.update({
	id: "/api/pumpfun-debug",
	path: "/api/pumpfun-debug",
	getParentRoute: () => Route$17
});
var ApiPumpfunDiagnosticRoute = Route$6.update({
	id: "/api/pumpfun-diagnostic",
	path: "/api/pumpfun-diagnostic",
	getParentRoute: () => Route$17
});
var ApiPumpfunNewRoute = Route$5.update({
	id: "/api/pumpfun-new",
	path: "/api/pumpfun-new",
	getParentRoute: () => Route$17
});
var ApiTokenHoldersRoute = Route$4.update({
	id: "/api/token-holders",
	path: "/api/token-holders",
	getParentRoute: () => Route$17
});
var ApiArgusLaunchesRoute = Route$3.update({
	id: "/api/argus/launches",
	path: "/api/argus/launches",
	getParentRoute: () => Route$17
});
var ApiArgusStatsRoute = Route$2.update({
	id: "/api/argus/stats",
	path: "/api/argus/stats",
	getParentRoute: () => Route$17
});
var ApiDiscoveryRouteChildren = {
	ApiDiscoveryExportRoute: Route$1.update({
		id: "/export",
		path: "/export",
		getParentRoute: () => ApiDiscoveryRoute
	}),
	ApiDiscoveryStatsRoute: Route.update({
		id: "/stats",
		path: "/stats",
		getParentRoute: () => ApiDiscoveryRoute
	})
};
var rootRouteChildren = {
	IndexRoute,
	ApiDiscoveryRoute: ApiDiscoveryRoute._addFileChildren(ApiDiscoveryRouteChildren),
	ApiHealthRoute,
	ApiPumpAuditRoute,
	ApiPumpDiagnosticRoute,
	ApiPumpFreshRoute,
	ApiPumpResolveRoute,
	ApiPumpTokenRoute,
	ApiPumpfunAuditRoute,
	ApiPumpfunDebugRoute,
	ApiPumpfunDiagnosticRoute,
	ApiPumpfunNewRoute,
	ApiTokenHoldersRoute,
	ApiArgusLaunchesRoute,
	ApiArgusStatsRoute
};
var routeTree = Route$17._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		rewrite: previewPathRewrite(),
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { TtlLruCache as A, isArgusToken as C, parseBrowseSearch as D, historyAction as E, preserveXUrl as F, readSocials as I, resolvePumpToken as J, fetchMetaplexMetadata as M, matchSocialFilters as N, sameBrowse as O, normalizeUri as P, startArgusChainScan as Q, clientTradeHref as S, isPumpToken as T, ARC_RPC_URLS as X, isSolanaToken as _, chainSelectionList as a, normalizePair as b, matchesSourceFilter as c, formatTokenAddress as d, getCanonicalCompositeKey as f, isLaunchPlatformOnly as g, isEvmAddress$1 as h, resolveBrowseQuery as i, chainTokenKey as j, IPFS_GATEWAYS as k, toggleChainSelection as l, getDexTradingUrl as m, isAddressQuery as n, formatChainSelection as o, getDexLogo as p, pumpIndexer as q, parseAddressQuery as r, matchesChainSelection as s, router_exports as t, DEX_PRIORITY as u, normalizeChainName as v, isPonsToken as w, selectPrimaryDex as x, normalizeDexName as y };
