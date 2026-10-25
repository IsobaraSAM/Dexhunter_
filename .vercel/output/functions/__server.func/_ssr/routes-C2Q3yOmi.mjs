import { o as __toESM } from "../_runtime.mjs";
import { t as Connection } from "../_libs/@solana/web3.js.mjs";
import { S as require_jsx_runtime, Y as require_react, b as useSearch, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as DollarSign, B as ArrowUpDown, C as Globe, D as ExternalLink, E as Feather, F as ChevronUp, I as ChevronDown, L as Check, M as Coins, N as Clock, O as Droplets, P as CircleHelp, R as ChartPie, S as Layers, T as Flame, _ as Pause, a as TrendingUp, b as List, c as Shield, d as Send, f as Search, g as PenLine, h as Play, i as TriangleAlert, j as Copy, k as Download, l as ShieldCheck, m as RefreshCw, n as X, o as Sun, p as RotateCcw, r as Users, s as Sparkles, t as Zap, u as Settings, v as Moon, w as Funnel, x as LayoutGrid, y as Monitor, z as ChartColumn } from "../_libs/lucide-react.mjs";
import { A as TtlLruCache, C as isArgusToken, D as parseBrowseSearch, E as historyAction, F as preserveXUrl, I as readSocials, M as fetchMetaplexMetadata, N as matchSocialFilters, O as sameBrowse, P as normalizeUri, S as clientTradeHref, T as isPumpToken, _ as isSolanaToken, a as chainSelectionList, b as normalizePair, c as matchesSourceFilter$1, d as formatTokenAddress, f as getCanonicalCompositeKey, g as isLaunchPlatformOnly, h as isEvmAddress$1, i as resolveBrowseQuery, j as chainTokenKey, k as IPFS_GATEWAYS, l as toggleChainSelection, m as getDexTradingUrl, n as isAddressQuery, o as formatChainSelection, p as getDexLogo, r as parseAddressQuery, s as matchesChainSelection, u as DEX_PRIORITY, v as normalizeChainName, w as isPonsToken, x as selectPrimaryDex, y as normalizeDexName } from "./router-DZMqnMj9.mjs";
import { n as AnimatePresence } from "../_libs/framer-motion+[...].mjs";
import { t as motion } from "../_libs/motion.mjs";
import "../_libs/d3+[...].mjs";
import { n as arc_default, t as pie_default } from "../_libs/d3-shape.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-C2Q3yOmi.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
async function fetchJsonWithTimeout$2(url, timeoutMs = 6e3, externalSignal) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
	const onAbort = () => controller.abort();
	if (externalSignal) {
		if (externalSignal.aborted) {
			clearTimeout(timeoutId);
			return null;
		}
		externalSignal.addEventListener("abort", onAbort, { once: true });
	}
	try {
		const res = await fetch(url, {
			headers: {
				Accept: "application/json",
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DEXHunter/2.0"
			},
			signal: controller.signal
		});
		clearTimeout(timeoutId);
		if (externalSignal) externalSignal.removeEventListener("abort", onAbort);
		if (!res.ok) return null;
		return await res.json();
	} catch {
		clearTimeout(timeoutId);
		if (externalSignal) externalSignal.removeEventListener("abort", onAbort);
		return null;
	}
}
var DexScreenerProvider = class {
	name = "DexScreener";
	discoveryCache = new TtlLruCache(50, 12e3);
	clearCache() {
		this.discoveryCache.clear();
	}
	/**
	* Helper to enrich market pairs with rich profile metadata (links, socials, icons, descriptions)
	* returned by DexScreener token-profiles and token-boosts endpoints
	*/
	enrichPairsWithProfileData(pairs, profiles) {
		if (!Array.isArray(profiles) || profiles.length === 0 || !Array.isArray(pairs)) return pairs;
		const profileMap = /* @__PURE__ */ new Map();
		for (const item of profiles) {
			const addr = (item.tokenAddress || "").toLowerCase();
			if (addr) profileMap.set(addr, item);
		}
		for (const p of pairs) {
			const baseAddr = (p.baseToken?.address || "").toLowerCase();
			const prof = profileMap.get(baseAddr);
			if (prof) {
				p.info = p.info || {};
				if (prof.icon && !p.info.imageUrl) p.info.imageUrl = prof.icon;
				if (prof.description && !p.info.description) p.info.description = prof.description;
				if (prof.totalAmount || prof.amount) {
					p.boostAmount = Number(prof.totalAmount || prof.amount);
					p.isBoosted = true;
				}
				if (Array.isArray(prof.links)) {
					const socials = Array.isArray(p.info.socials) ? [...p.info.socials] : [];
					const websites = Array.isArray(p.info.websites) ? [...p.info.websites] : [];
					for (const link of prof.links) {
						if (!link?.url) continue;
						const u = String(link.url).trim();
						if (!u) continue;
						const lower = u.toLowerCase();
						const type = String(link.type || "").toLowerCase();
						if (type === "twitter" || type === "x" || lower.includes("twitter.com") || lower.includes("x.com")) {
							if (!socials.some((s) => s.url.toLowerCase() === lower)) socials.push({
								type: "twitter",
								url: u
							});
						} else if (type === "telegram" || type === "tg" || lower.includes("t.me") || lower.includes("telegram")) {
							if (!socials.some((s) => s.url.toLowerCase() === lower)) socials.push({
								type: "telegram",
								url: u
							});
						} else if (type === "discord" || lower.includes("discord")) {
							if (!socials.some((s) => s.url.toLowerCase() === lower)) socials.push({
								type: "discord",
								url: u
							});
						} else if (!websites.some((w) => w.url.toLowerCase() === lower)) websites.push({
							type: "website",
							label: link.label || "Website",
							url: u
						});
					}
					p.info.socials = socials;
					p.info.websites = websites;
				}
			}
		}
		return pairs;
	}
	async searchTokens(query, signal) {
		if (!query || !query.trim()) return [];
		try {
			const res = await fetchJsonWithTimeout$2(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query.trim())}`, 7e3, signal);
			if (Array.isArray(res?.pairs)) return res.pairs.map((p) => ({
				...p,
				primaryProvider: this.name
			}));
			return [];
		} catch {
			return [];
		}
	}
	async getTokenByAddress(address, _chainId, signal) {
		if (!address || !address.trim()) return [];
		try {
			const res = await fetchJsonWithTimeout$2(`https://api.dexscreener.com/latest/dex/tokens/${address.trim()}`, 6e3, signal);
			if (Array.isArray(res?.pairs)) return res.pairs.map((p) => ({
				...p,
				primaryProvider: this.name
			}));
			return [];
		} catch {
			return [];
		}
	}
	async discoverTokens(mode, signal, chainId, forceRefresh) {
		const normChain = chainId ? normalizeChainName(chainId) : "all";
		const cacheKey = `${mode}:${normChain}`;
		if (forceRefresh) this.discoveryCache.delete(cacheKey);
		else {
			const cached = this.discoveryCache.get(cacheKey);
			if (cached) return cached;
		}
		try {
			const [topBoostsRes, latestBoostsRes, latestProfilesRes] = await Promise.allSettled([
				fetchJsonWithTimeout$2("https://api.dexscreener.com/token-boosts/top/v1", 6e3, signal),
				fetchJsonWithTimeout$2("https://api.dexscreener.com/token-boosts/latest/v1", 6e3, signal),
				fetchJsonWithTimeout$2("https://api.dexscreener.com/token-profiles/latest/v1", 6e3, signal)
			]);
			const allActiveItems = [];
			if (topBoostsRes.status === "fulfilled" && Array.isArray(topBoostsRes.value)) allActiveItems.push(...topBoostsRes.value);
			if (latestBoostsRes.status === "fulfilled" && Array.isArray(latestBoostsRes.value)) allActiveItems.push(...latestBoostsRes.value);
			if (latestProfilesRes.status === "fulfilled" && Array.isArray(latestProfilesRes.value)) allActiveItems.push(...latestProfilesRes.value);
			const filteredItems = normChain === "all" ? allActiveItems : allActiveItems.filter((item) => normalizeChainName(item.chainId) === normChain);
			const addressSet = /* @__PURE__ */ new Set();
			const candidateAddresses = [];
			for (const item of filteredItems) {
				const addr = (item.tokenAddress || "").trim();
				if (addr && !addressSet.has(addr.toLowerCase())) {
					addressSet.add(addr.toLowerCase());
					candidateAddresses.push(addr);
				}
			}
			const pairsList = [];
			if (candidateAddresses.length > 0) {
				const batchPairs = await this.getBatchAddresses(candidateAddresses.slice(0, 60), signal);
				const enriched = this.enrichPairsWithProfileData(batchPairs, filteredItems);
				pairsList.push(...enriched);
			}
			if (normChain === "all" || normChain === "robinhood") try {
				const rhRes = await fetchJsonWithTimeout$2("https://api.dexscreener.com/latest/dex/search?q=robinhood", 5e3, signal);
				if (Array.isArray(rhRes?.pairs)) {
					for (const p of rhRes.pairs) if (normalizeChainName(p.chainId) === "robinhood") pairsList.push({
						...p,
						primaryProvider: this.name
					});
				}
			} catch {}
			const seen = /* @__PURE__ */ new Set();
			let uniquePairs = [];
			const fetchTime = Date.now();
			for (const p of pairsList) {
				const id = `${normalizeChainName(p.chainId)}:${(p.pairAddress || p.baseToken?.address || "").toLowerCase()}`;
				if (!seen.has(id)) {
					seen.add(id);
					p.providerFetchTimestamp = fetchTime;
					uniquePairs.push(p);
				}
			}
			const now = Date.now();
			if (mode === "latest") {
				const MAX_LATEST_AGE_MS = 1728e5;
				uniquePairs = uniquePairs.filter((p) => {
					if (!p.pairCreatedAt || p.pairCreatedAt <= 0) return false;
					const created = Number(p.pairCreatedAt);
					const ageMs = now - (created < 1e10 ? created * 1e3 : created);
					return ageMs >= -6e4 && ageMs <= MAX_LATEST_AGE_MS;
				});
				uniquePairs.sort((a, b) => (Number(b.pairCreatedAt) || 0) - (Number(a.pairCreatedAt) || 0));
			} else {
				const ONE_WEEK_MS = 6048e5;
				uniquePairs = uniquePairs.filter((p) => {
					if (p.pairCreatedAt && p.pairCreatedAt > 0) {
						const created = Number(p.pairCreatedAt);
						const validTs = created < 1e10 ? created * 1e3 : created;
						if (now - validTs > ONE_WEEK_MS) return false;
					}
					const vol24 = Number(p.volume?.h24 || 0);
					const vol1 = Number(p.volume?.h1 || 0);
					const vol5m = Number(p.volume?.m5 || 0);
					const liq = Number(p.liquidity?.usd || 0);
					if (vol24 < 300 && vol1 === 0 && vol5m === 0 && liq < 500) return false;
					return true;
				});
			}
			if (uniquePairs.length > 0) this.discoveryCache.set(cacheKey, uniquePairs);
			return uniquePairs;
		} catch {
			return [];
		}
	}
	async getBatchAddresses(addresses, signal) {
		if (!addresses || addresses.length === 0) return [];
		const chunks = [];
		for (let i = 0; i < Math.min(addresses.length, 60); i += 30) chunks.push(addresses.slice(i, i + 30));
		const settled = await Promise.allSettled(chunks.map((chunk) => fetchJsonWithTimeout$2(`https://api.dexscreener.com/latest/dex/tokens/${chunk.join(",")}`, 7e3, signal)));
		const allPairs = [];
		for (const r of settled) if (r.status === "fulfilled" && Array.isArray(r.value?.pairs)) for (const p of r.value.pairs) allPairs.push({
			...p,
			primaryProvider: this.name
		});
		return allPairs;
	}
};
/**
* Safe URL validation, sanitization, and social link coercion
*/
var DANGEROUS_PROTOCOLS = [
	"javascript:",
	"data:",
	"vbscript:",
	"file:"
];
function parseHttpUrl(raw) {
	if (!raw || typeof raw !== "string") return null;
	const trimmed = raw.trim();
	if (!trimmed) return null;
	try {
		const parsed = new URL(trimmed);
		if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed;
		return null;
	} catch {
		return null;
	}
}
function safeHref(url) {
	if (!url || typeof url !== "string") return void 0;
	const trimmed = url.trim();
	if (!trimmed) return void 0;
	const lower = trimmed.toLowerCase();
	for (const proto of DANGEROUS_PROTOCOLS) if (lower.startsWith(proto)) return void 0;
	if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
	const parsed = parseHttpUrl(trimmed);
	if (parsed) return parsed.toString();
}
function coerceSocialUrl(raw, type) {
	if (!raw || typeof raw !== "string") return void 0;
	let clean = raw.trim();
	if (!clean) return void 0;
	clean = clean.replace(/^["]+|["]+$/g, "");
	if (type === "twitter") {
		const preserved = preserveXUrl(clean);
		if (preserved) return safeHref(preserved);
	} else if (type === "telegram") {
		if (clean.startsWith("@")) return `https://t.me/${clean.slice(1)}`;
		if (!clean.includes("/") && !clean.includes(".")) return `https://t.me/${clean}`;
	}
	if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(clean)) clean = `https://${clean.replace(/^\/\//, "")}`;
	return safeHref(clean);
}
/**
* Check if the token has a verified graduated PumpSwap pool
*/
function hasVerifiedPumpSwapPool(pair) {
	if (!pair) return false;
	if (pair.hasPumpSwapPool) return true;
	if (pair.pumpSwapPool && typeof pair.pumpSwapPool === "string" && pair.pumpSwapPool.length > 0) return true;
	if (pair.marketStage === "pumpswap") return true;
	const dexId = String(pair.dexId || "").toLowerCase();
	const primaryDex = String(pair.primaryDex || "").toLowerCase();
	if (dexId === "pumpswap" || primaryDex === "pumpswap") return true;
	return false;
}
/**
* Check if the token originated or operates on a bonding curve (e.g. Pump.fun)
*/
function isBondingCurveToken(pair) {
	if (!pair) return false;
	if (pair.isGraduated === true || pair.marketStage === "graduated" || pair.marketStage === "pumpswap" || pair.marketStage === "raydium" || typeof pair.bondingProgress === "number" && pair.bondingProgress >= 100 || hasVerifiedPumpSwapPool(pair)) return false;
	if (pair.isBondingCurve === true) return true;
	if (pair.marketStage === "bonding_curve") return true;
	if (pair.bondingCurvePda || pair.bondingCurve) return true;
	const dexId = String(pair.dexId || "").toLowerCase();
	const primaryDex = String(pair.primaryDex || "").toLowerCase();
	if (dexId === "pumpfun" || primaryDex === "pumpfun" || dexId === "pump") return true;
	if (pair.launchPlatform === "Pump.fun") return !pair.complete && !pair.isGraduated;
	const mint = pair.baseToken?.address || pair.mint || "";
	if (typeof mint === "string" && mint.toLowerCase().endsWith("pump") && !pair.isGraduated && !pair.complete) return true;
	return false;
}
/**
* Generate a deterministic identity key for deduplicating, caching, or rendering table rows
*/
function tokenIdentityKey(pair) {
	if (!pair) return "";
	const chain = pair.chainId || "unknown";
	const address = pair.baseToken?.address || pair.mint || pair.tokenAddress || pair.address || pair.pairAddress || pair.url || "";
	return chainTokenKey(chain, address);
}
/**
* Generate a deterministic holder cache key for a token
*/
function holderCacheKey(chainId, tokenAddress) {
	return chainTokenKey(chainId || "solana", tokenAddress);
}
async function fetchJsonWithTimeout$1(url, timeoutMs = 6e3, externalSignal) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
	const onAbort = () => controller.abort();
	if (externalSignal) {
		if (externalSignal.aborted) {
			clearTimeout(timeoutId);
			return null;
		}
		externalSignal.addEventListener("abort", onAbort, { once: true });
	}
	try {
		const res = await fetch(url, { signal: controller.signal });
		clearTimeout(timeoutId);
		if (externalSignal) externalSignal.removeEventListener("abort", onAbort);
		if (!res.ok) return null;
		return await res.json();
	} catch {
		clearTimeout(timeoutId);
		if (externalSignal) externalSignal.removeEventListener("abort", onAbort);
		return null;
	}
}
var ACCEPTED_RESOLVE_STATUSES = /* @__PURE__ */ new Set([
	"FOUND_BONDING_CURVE",
	"FOUND_GRADUATED",
	"FOUND_PUMPSWAP_ACTIVE"
]);
function poolAddressFrom(state) {
	const pool = state?.pumpSwapPool || state?.pumpswap_pool || state?.pump_swap_pool || state?.pump_swap;
	if (typeof pool === "string" && pool.length >= 32 && pool !== "true") return pool;
}
function raydiumPoolFrom(state) {
	const pool = state?.raydiumPool || state?.raydium_pool;
	if (typeof pool === "string" && pool.length >= 32 && pool !== "true") return pool;
}
function resolvePumpGraduation(state) {
	const pumpPool = poolAddressFrom(state);
	const rayPool = raydiumPoolFrom(state);
	const verified = hasVerifiedPumpSwapPool({
		pumpSwapPool: pumpPool,
		pumpswap_pool: pumpPool,
		marketStage: state?.marketStage,
		dexId: state?.dexId || state?.dex_id,
		primaryDex: state?.primaryDex || state?.primary_dex
	});
	const hasPumpSwap = Boolean(pumpPool) || verified;
	const hasRaydium = Boolean(rayPool);
	const isComplete = Boolean(state?.complete || state?.isGraduated || state?.is_graduated || state?.graduated || typeof state?.bondingProgress === "number" && state.bondingProgress >= 100 || state?.marketStage === "graduated" || state?.marketStage === "pumpswap" || state?.marketStage === "raydium" || state?.market_stage === "pumpswap" || state?.market_stage === "graduated");
	const mint = state?.mint || state?.address || "";
	const bondingPda = state?.bondingCurvePda || state?.bonding_curve || mint;
	if (hasPumpSwap) return {
		hasPumpSwap: true,
		hasRaydium,
		isComplete: true,
		isGraduated: true,
		isBondingCurve: false,
		marketStage: "pumpswap",
		primaryDex: "PumpSwap",
		dexId: "pumpswap",
		pairAddress: pumpPool || bondingPda
	};
	if (hasRaydium) return {
		hasPumpSwap: false,
		hasRaydium: true,
		isComplete: true,
		isGraduated: true,
		isBondingCurve: false,
		marketStage: "raydium",
		primaryDex: "Raydium",
		dexId: "raydium",
		pairAddress: rayPool || bondingPda
	};
	if (isComplete) return {
		hasPumpSwap: false,
		hasRaydium: false,
		isComplete: true,
		isGraduated: true,
		isBondingCurve: false,
		marketStage: "graduated_pending",
		primaryDex: void 0,
		dexId: state?.dexId || state?.dex_id || "pumpfun",
		pairAddress: bondingPda
	};
	return {
		hasPumpSwap: false,
		hasRaydium: false,
		isComplete: false,
		isGraduated: false,
		isBondingCurve: true,
		marketStage: "bonding_curve",
		primaryDex: state?.primaryDex || state?.primary_dex || void 0,
		dexId: state?.dexId || state?.dex_id || "pumpfun",
		pairAddress: bondingPda
	};
}
function actualPriceChange(source) {
	const raw = source?.priceChange24h ?? source?.price_change_24h ?? source?.priceChange?.h24;
	if (raw === void 0 || raw === null || raw === "") return void 0;
	const h24 = Number(raw);
	if (!Number.isFinite(h24)) return void 0;
	return { h24 };
}
function actualPriceUsd(source) {
	const raw = source?.spotPriceUsd ?? source?.usd_price ?? source?.priceUsd;
	if (raw === void 0 || raw === null || raw === "") return void 0;
	const n = Number(raw);
	if (!Number.isFinite(n)) return void 0;
	if (n === 0) return void 0;
	return String(raw);
}
var PumpFunProvider = class {
	name = "Pump.fun";
	normalizeOnChainState(state) {
		const address = state.mint || state.address || "";
		const name = state.tokenName || state.name || "Unknown Token";
		const symbol = state.tokenSymbol || state.symbol || "TOKEN";
		const marketCap = Number(state.marketCapUsd || state.usd_market_cap || state.fdvUsd || state.market_cap) || 0;
		const grad = resolvePumpGraduation(state);
		const isGraduated = grad.isGraduated;
		const isBondingCurve = grad.isBondingCurve;
		const bondingProgress = typeof state.bondingProgress === "number" ? state.bondingProgress : isGraduated ? 100 : 0;
		const websites = [];
		const socials = [];
		let arrayTw;
		let arrayTg;
		let arrayWeb;
		let arrayDisc;
		const scanArr = (arr) => {
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
					else if (!arrayWeb && (type.includes("web") || type.includes("site") || !uLower.includes("twitter") && !uLower.includes("x.com") && !uLower.includes("t.me"))) arrayWeb = url;
				}
			}
		};
		scanArr(state.links);
		scanArr(state.socials);
		scanArr(state.websites);
		if (state.info && typeof state.info === "object") {
			scanArr(state.info.socials);
			scanArr(state.info.websites);
		}
		const rawWebsite = state.website || state.web || state.website_url || arrayWeb;
		const rawTwitter = state.twitter || state.x || state.twitter_url || state.x_url || arrayTw;
		const rawTelegram = state.telegram || state.tg || state.telegram_url || arrayTg;
		const rawDiscord = state.discord || state.discord_url || arrayDisc;
		const webUrl = coerceSocialUrl(rawWebsite, "website");
		const twUrl = coerceSocialUrl(rawTwitter, "twitter");
		const tgUrl = coerceSocialUrl(rawTelegram, "telegram");
		const discordUrl = coerceSocialUrl(rawDiscord, "discord");
		if (webUrl) websites.push({
			type: "website",
			label: "Website",
			url: webUrl
		});
		if (twUrl) socials.push({
			type: "twitter",
			url: twUrl
		});
		if (tgUrl) socials.push({
			type: "telegram",
			url: tgUrl
		});
		if (discordUrl) socials.push({
			type: "discord",
			url: discordUrl
		});
		const rawImg = state.imageUrl || state.image || state.logo || state.icon;
		const imageUrl = rawImg ? normalizeUri(rawImg, 0) : void 0;
		const sources = state.sources && Array.isArray(state.sources) && state.sources.length > 0 ? [...state.sources] : ["Pump.fun (On-Chain)"];
		if (grad.hasPumpSwap && !sources.includes("PumpSwap")) sources.unshift("PumpSwap");
		if (grad.hasRaydium && !sources.includes("Raydium")) sources.unshift("Raydium");
		const dexes = grad.hasPumpSwap ? ["PumpSwap"] : grad.hasRaydium ? ["Raydium"] : [];
		const priceUsd = actualPriceUsd(state);
		return {
			chainId: "solana",
			dexId: grad.dexId,
			primaryDex: grad.primaryDex,
			dexes,
			launchPlatform: "Pump.fun",
			url: `https://pump.fun/coin/${address}`,
			pairAddress: grad.pairAddress,
			baseToken: {
				address,
				name,
				symbol
			},
			quoteToken: {
				address: "So11111111111111111111111111111111111111112",
				name: "Wrapped SOL",
				symbol: "SOL"
			},
			priceNative: state.spotPriceSol || void 0,
			priceUsd,
			marketCap,
			fdv: Number(state.fdvUsd) || marketCap,
			liquidity: { usd: state.liquidityUsd !== void 0 ? state.liquidityUsd : void 0 },
			totalLiquidityUsd: state.liquidityUsd !== void 0 ? state.liquidityUsd : void 0,
			volume: state.volume24h !== void 0 ? { h24: Number(state.volume24h) } : void 0,
			totalVolume24h: state.volume24h !== void 0 ? Number(state.volume24h) : void 0,
			priceChange: actualPriceChange(state),
			pairCreatedAt: state.createdAt || void 0,
			info: {
				imageUrl,
				websites,
				socials
			},
			primaryProvider: this.name,
			sources,
			telegram: tgUrl,
			twitter: twUrl,
			website: webUrl,
			discord: discordUrl,
			bondingCurvePda: state.bondingCurvePda,
			bondingProgress,
			isBondingCurve,
			isGraduated,
			complete: grad.isComplete,
			pumpSwapPool: poolAddressFrom(state),
			pumpswap_pool: poolAddressFrom(state),
			marketStage: grad.marketStage,
			pairs: grad.hasPumpSwap ? [{
				chainId: "solana",
				pairAddress: poolAddressFrom(state) || address,
				dexName: "PumpSwap",
				dexId: "pumpswap",
				baseToken: {
					address,
					name,
					symbol
				},
				quoteToken: {
					address: "So11111111111111111111111111111111111111112",
					name: "Wrapped SOL",
					symbol: "SOL"
				},
				priceUsd,
				liquidityUsd: state.liquidityUsd,
				volume24h: state.volume24h !== void 0 ? Number(state.volume24h) : void 0
			}] : grad.hasRaydium ? [{
				chainId: "solana",
				pairAddress: raydiumPoolFrom(state) || address,
				dexName: "Raydium",
				dexId: "raydium",
				baseToken: {
					address,
					name,
					symbol
				},
				quoteToken: {
					address: "So11111111111111111111111111111111111111112",
					name: "Wrapped SOL",
					symbol: "SOL"
				},
				priceUsd,
				liquidityUsd: state.liquidityUsd,
				volume24h: state.volume24h !== void 0 ? Number(state.volume24h) : void 0
			}] : [{
				chainId: "solana",
				pairAddress: grad.pairAddress || address,
				dexName: "Pump.fun",
				dexId: "pumpfun",
				baseToken: {
					address,
					name,
					symbol
				},
				quoteToken: {
					address: "So11111111111111111111111111111111111111112",
					name: "Wrapped SOL",
					symbol: "SOL"
				},
				priceUsd,
				liquidityUsd: state.liquidityUsd,
				volume24h: state.volume24h !== void 0 ? Number(state.volume24h) : void 0
			}],
			creator: state.creator,
			realSolReservesFormatted: state.realSolReservesFormatted,
			virtualTokenReserves: state.virtualTokenReserves,
			virtualSolReserves: state.virtualSolReserves,
			realTokenReserves: state.realTokenReserves,
			realSolReserves: state.realSolReserves,
			tokenTotalSupply: state.tokenTotalSupply
		};
	}
	normalizeCoin(coin) {
		if (coin.virtualTokenReserves || coin.bondingCurvePda) return this.normalizeOnChainState(coin);
		const address = coin.mint || coin.address || coin.token_address || coin.tokenAddress || coin.contractAddress || "";
		const name = coin.name || coin.token_name || "Unknown Token";
		const symbol = coin.symbol || coin.token_symbol || "TOKEN";
		const usdMarketCap = Number(coin.usd_market_cap || coin.market_cap || coin.marketCap || coin.fdv) || 0;
		let createdTime = void 0;
		if (coin.created_timestamp) {
			const ts = Number(coin.created_timestamp);
			createdTime = ts > 0xe8d4a51000 ? ts : ts > 1e9 ? ts * 1e3 : void 0;
		} else if (coin.created_at) {
			const parsed = new Date(coin.created_at).getTime();
			createdTime = !isNaN(parsed) && parsed > 0 ? parsed > 0xe8d4a51000 ? parsed : parsed > 1e9 ? parsed * 1e3 : void 0 : void 0;
		} else if (coin.createdAt) {
			const num = typeof coin.createdAt === "number" ? coin.createdAt : new Date(coin.createdAt).getTime();
			createdTime = !isNaN(num) && num > 0 ? num > 0xe8d4a51000 ? num : num > 1e9 ? num * 1e3 : void 0 : void 0;
		} else if (coin.timestamp) {
			const parsed = new Date(coin.timestamp).getTime();
			createdTime = !isNaN(parsed) && parsed > 0 ? parsed > 0xe8d4a51000 ? parsed : parsed > 1e9 ? parsed * 1e3 : void 0 : void 0;
		}
		const websites = [];
		const socials = [];
		let arrayTw;
		let arrayTg;
		let arrayWeb;
		let arrayDisc;
		const scanArr = (arr) => {
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
					else if (!arrayWeb && (type.includes("web") || type.includes("site") || !uLower.includes("twitter") && !uLower.includes("x.com") && !uLower.includes("t.me"))) arrayWeb = url;
				}
			}
		};
		scanArr(coin.links);
		scanArr(coin.socials);
		scanArr(coin.websites);
		if (coin.info && typeof coin.info === "object") {
			scanArr(coin.info.socials);
			scanArr(coin.info.websites);
		}
		const descText = String(coin.description || coin.desc || "");
		const tgMatch = descText.match(/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_+]+)/i);
		const twMatch = descText.match(/(?:https?:\/\/|\/\/)?(?:www\.)?(?:mobile\.)?(?:twitter\.com|x\.com)\/[^\s)]+/i);
		const webMatch = descText.match(/https?:\/\/(?!(?:t\.me|telegram\.me|twitter\.com|x\.com|ipfs\.io|arweave\.net|dexscreener\.com|pump\.fun))([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s)]*)?)/i);
		const rawWebsite = coin.website || coin.web || coin.website_url || coin.links?.website || (Array.isArray(coin.websites) ? coin.websites[0]?.url || coin.websites[0] : "") || arrayWeb || (webMatch ? webMatch[0] : void 0);
		const rawTwitter = coin.twitter || coin.x || coin.twitter_url || coin.x_url || coin.links?.twitter || coin.links?.x || arrayTw || (twMatch ? preserveXUrl(twMatch[0]) : void 0);
		const rawTelegram = coin.telegram || coin.tg || coin.telegram_url || coin.links?.telegram || arrayTg || (tgMatch ? `https://t.me/${tgMatch[1]}` : void 0);
		const rawDiscord = coin.discord || coin.discord_url || coin.links?.discord || arrayDisc;
		const webUrl = coerceSocialUrl(typeof rawWebsite === "string" ? rawWebsite : void 0, "website");
		const twUrl = coerceSocialUrl(rawTwitter, "twitter");
		const tgUrl = coerceSocialUrl(rawTelegram, "telegram");
		const discordUrl = coerceSocialUrl(rawDiscord, "discord");
		if (webUrl) websites.push({
			type: "website",
			label: "Website",
			url: webUrl
		});
		if (twUrl) socials.push({
			type: "twitter",
			url: twUrl
		});
		if (tgUrl) socials.push({
			type: "telegram",
			url: tgUrl
		});
		if (discordUrl) socials.push({
			type: "discord",
			url: discordUrl
		});
		const rawImg = coin.image_uri || coin.image || coin.logo || coin.icon;
		const imageUrl = rawImg ? normalizeUri(rawImg, 0) : void 0;
		const grad = resolvePumpGraduation(coin);
		const sources = coin.sources && Array.isArray(coin.sources) ? [...coin.sources] : ["Pump.fun"];
		if (grad.hasPumpSwap && !sources.includes("PumpSwap")) sources.unshift("PumpSwap");
		if (grad.hasRaydium && !sources.includes("Raydium")) sources.unshift("Raydium");
		const dexes = grad.hasPumpSwap ? ["PumpSwap"] : grad.hasRaydium ? ["Raydium"] : [];
		const derivedLiqUsd = coin.liquidityUsd !== void 0 ? Number(coin.liquidityUsd) : coin.liquidity?.usd !== void 0 ? Number(coin.liquidity.usd) : void 0;
		const observedVolume = coin.volume_24h !== void 0 || coin.volume24h !== void 0 || coin.volume !== void 0 ? Number(coin.volume_24h || coin.volume24h || coin.volume || 0) : void 0;
		const priceUsd = actualPriceUsd(coin) || (usdMarketCap > 0 ? (usdMarketCap / 1e9).toFixed(8) : void 0);
		return {
			chainId: "solana",
			dexId: grad.dexId,
			primaryDex: grad.primaryDex,
			dexes,
			launchPlatform: "Pump.fun",
			url: `https://pump.fun/coin/${address}`,
			pairAddress: grad.pairAddress,
			baseToken: {
				address,
				name,
				symbol
			},
			quoteToken: {
				address: "So11111111111111111111111111111111111111112",
				name: "Wrapped SOL",
				symbol: "SOL"
			},
			priceNative: coin.price ? String(coin.price) : void 0,
			priceUsd,
			marketCap: usdMarketCap > 0 ? usdMarketCap : void 0,
			fdv: usdMarketCap > 0 ? usdMarketCap : void 0,
			liquidity: derivedLiqUsd !== void 0 ? { usd: derivedLiqUsd } : void 0,
			totalLiquidityUsd: derivedLiqUsd,
			volume: observedVolume !== void 0 ? { h24: observedVolume } : void 0,
			totalVolume24h: observedVolume,
			priceChange: actualPriceChange(coin),
			pairCreatedAt: createdTime,
			info: {
				imageUrl,
				websites,
				socials
			},
			primaryProvider: this.name,
			sources,
			telegram: tgUrl,
			twitter: twUrl,
			website: webUrl,
			discord: discordUrl,
			isBondingCurve: grad.isBondingCurve,
			isGraduated: grad.isGraduated,
			complete: grad.isComplete || Boolean(coin.complete),
			pumpswap_pool: poolAddressFrom(coin),
			marketStage: grad.marketStage,
			pairs: grad.hasPumpSwap ? [{
				chainId: "solana",
				pairAddress: poolAddressFrom(coin) || address,
				dexName: "PumpSwap",
				dexId: "pumpswap",
				baseToken: {
					address,
					name,
					symbol
				},
				quoteToken: {
					address: "So11111111111111111111111111111111111111112",
					name: "Wrapped SOL",
					symbol: "SOL"
				},
				priceUsd,
				liquidityUsd: derivedLiqUsd,
				volume24h: observedVolume
			}] : grad.hasRaydium ? [{
				chainId: "solana",
				pairAddress: raydiumPoolFrom(coin) || address,
				dexName: "Raydium",
				dexId: "raydium",
				baseToken: {
					address,
					name,
					symbol
				},
				quoteToken: {
					address: "So11111111111111111111111111111111111111112",
					name: "Wrapped SOL",
					symbol: "SOL"
				},
				priceUsd,
				liquidityUsd: derivedLiqUsd,
				volume24h: observedVolume
			}] : [{
				chainId: "solana",
				pairAddress: grad.pairAddress || address,
				dexName: "Pump.fun",
				dexId: "pumpfun",
				baseToken: {
					address,
					name,
					symbol
				},
				quoteToken: {
					address: "So11111111111111111111111111111111111111112",
					name: "Wrapped SOL",
					symbol: "SOL"
				},
				priceUsd,
				liquidityUsd: derivedLiqUsd,
				volume24h: observedVolume
			}]
		};
	}
	async searchTokens(query, signal) {
		if (!query || !query.trim()) return [];
		const cleanQuery = query.trim();
		if (cleanQuery.startsWith("0x")) return [];
		if (cleanQuery.length >= 32 && cleanQuery.length <= 44 && !cleanQuery.includes(" ")) {
			const onChain = await this.getTokenByAddress(cleanQuery, "solana", signal);
			if (onChain.length > 0) return onChain;
		}
		const qLower = cleanQuery.toLowerCase();
		const [dsSettled, freshSettled] = await Promise.allSettled([fetchJsonWithTimeout$1(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(cleanQuery)}`, 5e3, signal), this.discoverTokens("latest", signal)]);
		if (dsSettled.status === "fulfilled" && Array.isArray(dsSettled.value?.pairs)) {
			const dsMatches = dsSettled.value.pairs.filter((p) => p.chainId === "solana" && (p.dexId === "pumpfun" || p.url?.includes("pump.fun"))).map((p) => this.normalizeCoin(p));
			if (dsMatches.length > 0) return dsMatches;
		}
		if (freshSettled.status === "fulfilled") {
			const matched = freshSettled.value.filter((t) => {
				const name = t.baseToken?.name?.toLowerCase() || "";
				const symbol = t.baseToken?.symbol?.toLowerCase() || "";
				const addr = t.baseToken?.address?.toLowerCase() || "";
				return name.includes(qLower) || symbol.includes(qLower) || addr.includes(qLower);
			});
			if (matched.length > 0) return matched;
		}
		return [];
	}
	/**
	* Direct On-Chain Token Resolution using concurrent multi-endpoint lookup
	*/
	async getTokenByAddress(address, _chainId, signal) {
		if (!address || !address.trim()) return [];
		const cleanAddr = address.trim();
		if (cleanAddr.startsWith("0x")) return [];
		if (_chainId) {
			const normChain = normalizeChainName(_chainId);
			if (normChain !== "all" && normChain !== "solana") return [];
		}
		const [resolveSettled, coinSettled, diagSettled] = await Promise.allSettled([
			fetchJsonWithTimeout$1(`/api/pump-resolve?mint=${encodeURIComponent(cleanAddr)}`, 5e3, signal),
			fetchJsonWithTimeout$1(`https://frontend-api.pump.fun/coins/${encodeURIComponent(cleanAddr)}`, 4e3, signal),
			fetchJsonWithTimeout$1(`/api/pumpfun-diagnostic?mint=${encodeURIComponent(cleanAddr)}`, 5e3, signal)
		]);
		if (resolveSettled.status === "fulfilled" && resolveSettled.value) {
			const resolveRes = resolveSettled.value;
			if (resolveRes.status === "RPC_ERROR") {} else if (resolveRes.token && ACCEPTED_RESOLVE_STATUSES.has(resolveRes.status)) {
				const tokenData = { ...resolveRes.token };
				const coin = coinSettled.status === "fulfilled" ? coinSettled.value : null;
				if (coin) {
					tokenData.twitter = tokenData.twitter || coin.twitter || coin.links?.twitter || coin.links?.x || coin.x;
					tokenData.telegram = tokenData.telegram || coin.telegram || coin.links?.telegram || coin.tg;
					tokenData.website = tokenData.website || coin.website || coin.links?.website || coin.web;
					tokenData.discord = tokenData.discord || coin.discord || coin.links?.discord;
					tokenData.imageUrl = tokenData.imageUrl || coin.image_uri || coin.image || coin.logo;
					tokenData.description = tokenData.description || coin.description;
				}
				const diag = diagSettled.status === "fulfilled" ? diagSettled.value : null;
				if (diag?.normalizedMetadata) {
					const nm = diag.normalizedMetadata;
					tokenData.twitter = tokenData.twitter || nm.socials?.twitter || nm.twitter;
					tokenData.telegram = tokenData.telegram || nm.socials?.telegram || nm.telegram;
					tokenData.website = tokenData.website || nm.socials?.website || nm.website;
					tokenData.discord = tokenData.discord || nm.socials?.discord || nm.discord;
					tokenData.imageUrl = tokenData.imageUrl || nm.imageUrl;
					tokenData.description = tokenData.description || nm.description;
				}
				return [this.normalizeOnChainState(tokenData)];
			}
		}
		if (coinSettled.status === "fulfilled" && coinSettled.value) {
			const coin = coinSettled.value;
			if (coin && (coin.mint || coin.address)) return [this.normalizeCoin(coin)];
		}
		if (diagSettled.status === "fulfilled" && diagSettled.value) {
			const diagRes = diagSettled.value;
			const d = diagRes.diagnostics?.bondingCurve || diagRes.bondingStatus;
			const m = diagRes.normalizedMetadata || diagRes.normalizedFields;
			if (d && m) return [this.normalizeOnChainState({
				mint: cleanAddr,
				tokenName: m.name,
				tokenSymbol: m.symbol,
				imageUrl: m.imageUrl,
				description: m.description,
				twitter: m.socials?.twitter,
				telegram: m.socials?.telegram,
				website: m.socials?.website,
				bondingCurvePda: d.pda || d.bondingCurvePda,
				complete: d.complete,
				bondingProgress: d.bondingProgressPct,
				virtualTokenReserves: d.virtualTokenReserves,
				virtualSolReserves: d.virtualSolReserves,
				realTokenReserves: d.realTokenReserves,
				realSolReserves: d.realSolReserves
			})];
		}
		return [];
	}
	/**
	* Discovers Fresh Mints directly from on-chain indexer
	*/
	async discoverTokens(_mode, signal, chainId) {
		if (chainId && normalizeChainName(chainId) !== "solana" && normalizeChainName(chainId) !== "all") return [];
		const [freshSettled, proxySettled, fallbackSettled] = await Promise.allSettled([
			fetchJsonWithTimeout$1("/api/pump-fresh", 6e3, signal),
			fetchJsonWithTimeout$1("/api/pumpfun-new", 6e3, signal),
			fetchJsonWithTimeout$1("https://api.dexscreener.com/latest/dex/search?q=pumpfun", 5e3, signal)
		]);
		if (freshSettled.status === "fulfilled") {
			const freshRes = freshSettled.value;
			if (freshRes?.tokens && Array.isArray(freshRes.tokens) && freshRes.tokens.length > 0) return freshRes.tokens.map((t) => this.normalizeOnChainState(t));
		}
		if (proxySettled.status === "fulfilled") {
			const proxyRes = proxySettled.value;
			const coins = Array.isArray(proxyRes) ? proxyRes : Array.isArray(proxyRes?.result) ? proxyRes.result : Array.isArray(proxyRes?.tokens) ? proxyRes.tokens : null;
			if (coins && coins.length > 0) return coins.map((c) => this.normalizeCoin(c));
		}
		if (fallbackSettled.status === "fulfilled") {
			const fallbackData = fallbackSettled.value;
			const fallbackCoins = Array.isArray(fallbackData) ? fallbackData : Array.isArray(fallbackData?.pairs) ? fallbackData.pairs.filter((p) => p.chainId === "solana" && (p.dexId === "pumpfun" || p.url?.includes("pump.fun"))) : [];
			if (fallbackCoins.length > 0) return fallbackCoins.map((c) => this.normalizeCoin(c));
		}
		return [];
	}
};
new PumpFunProvider();
async function fetchJsonWithTimeout(url, timeoutMs = 4e3, externalSignal) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
	const onAbort = () => controller.abort();
	if (externalSignal) {
		if (externalSignal.aborted) {
			clearTimeout(timeoutId);
			return null;
		}
		externalSignal.addEventListener("abort", onAbort, { once: true });
	}
	try {
		const res = await fetch(url, { signal: controller.signal });
		clearTimeout(timeoutId);
		if (externalSignal) externalSignal.removeEventListener("abort", onAbort);
		if (!res.ok) return null;
		return await res.json();
	} catch {
		clearTimeout(timeoutId);
		if (externalSignal) externalSignal.removeEventListener("abort", onAbort);
		return null;
	}
}
var OnChainProvider = class {
	name = "OnChain";
	async searchTokens(query, signal) {
		const clean = query.trim();
		if (clean.length >= 28 && !clean.includes(" ")) return this.getTokenByAddress(clean, void 0, signal);
		return [];
	}
	async getTokenByAddress(address, chainId, signal) {
		const cleanAddr = address.trim();
		if (!cleanAddr) return [];
		const isEvm = cleanAddr.startsWith("0x") && cleanAddr.length === 42;
		const isSolana = !cleanAddr.startsWith("0x") && cleanAddr.length >= 32 && cleanAddr.length <= 44;
		if (!isEvm && !isSolana) return [];
		try {
			const queries = [fetchJsonWithTimeout(`https://api.dexscreener.com/latest/dex/tokens/${cleanAddr}`, 5e3, signal)];
			if (isSolana) queries.unshift(fetchJsonWithTimeout(`/api/pump-resolve?mint=${encodeURIComponent(cleanAddr)}`, 5e3, signal));
			const settled = await Promise.allSettled(queries);
			if (isSolana && settled[0].status === "fulfilled" && settled[0].value) {
				const resolveRes = settled[0].value;
				if (resolveRes.status === "RPC_ERROR") {} else if (resolveRes.token && (resolveRes.status === "FOUND_BONDING_CURVE" || resolveRes.status === "FOUND_GRADUATED" || resolveRes.status === "FOUND_PUMPSWAP_ACTIVE")) {
					const t = resolveRes.token;
					const pumpPool = typeof t.pumpSwapPool === "string" && t.pumpSwapPool.length >= 32 && t.pumpSwapPool !== "true" ? t.pumpSwapPool : typeof t.pumpswap_pool === "string" && t.pumpswap_pool.length >= 32 ? t.pumpswap_pool : void 0;
					const rayPool = typeof t.raydiumPool === "string" && t.raydiumPool.length >= 32 ? t.raydiumPool : typeof t.raydium_pool === "string" && t.raydium_pool.length >= 32 ? t.raydium_pool : void 0;
					const verifiedPump = hasVerifiedPumpSwapPool({
						pumpSwapPool: pumpPool,
						pumpswap_pool: pumpPool,
						marketStage: t.marketStage,
						dexId: t.dexId,
						primaryDex: t.primaryDex
					});
					const hasPumpSwap = Boolean(pumpPool) || verifiedPump;
					const hasRaydium = Boolean(rayPool);
					const isComplete = Boolean(t.complete || t.isGraduated || t.marketStage === "pumpswap" || t.marketStage === "graduated" || t.marketStage === "raydium");
					const isGraduated = hasPumpSwap || hasRaydium || isComplete;
					let marketStage = "bonding_curve";
					let dexId = "pumpfun";
					let primaryDex;
					let dexes = [];
					let sources = ["OnChain (Solana RPC)"];
					if (hasPumpSwap) {
						marketStage = "pumpswap";
						dexId = "pumpswap";
						primaryDex = "PumpSwap";
						dexes = ["PumpSwap"];
						sources = ["PumpSwap", "OnChain (Solana RPC)"];
					} else if (hasRaydium) {
						marketStage = "raydium";
						dexId = "raydium";
						primaryDex = "Raydium";
						dexes = ["Raydium"];
						sources = ["Raydium", "OnChain (Solana RPC)"];
					} else if (isComplete) {
						marketStage = "graduated_pending";
						dexId = "pumpfun";
						primaryDex = void 0;
					}
					const pairAddress = pumpPool || rayPool || t.bondingCurvePda || cleanAddr;
					const priceUsd = t.spotPriceUsd && Number(t.spotPriceUsd) !== 0 ? String(t.spotPriceUsd) : void 0;
					const tokenName = t.tokenName || "Unknown Token";
					const tokenSymbol = t.tokenSymbol || "TOKEN";
					const webUrl = coerceSocialUrl(t.website, "website");
					const twUrl = coerceSocialUrl(t.twitter, "twitter");
					const tgUrl = coerceSocialUrl(t.telegram, "telegram");
					return [{
						chainId: "solana",
						dexId,
						primaryDex,
						launchPlatform: "Pump.fun",
						url: `https://pump.fun/coin/${cleanAddr}`,
						pairAddress,
						baseToken: {
							address: cleanAddr,
							name: tokenName,
							symbol: tokenSymbol
						},
						quoteToken: {
							address: "So11111111111111111111111111111111111111112",
							name: "Wrapped SOL",
							symbol: "SOL"
						},
						priceNative: t.spotPriceSol || void 0,
						priceUsd,
						marketCap: t.marketCapUsd || void 0,
						fdv: t.fdvUsd || t.marketCapUsd || void 0,
						liquidity: { usd: t.liquidityUsd !== void 0 ? t.liquidityUsd : void 0 },
						totalLiquidityUsd: t.liquidityUsd !== void 0 ? t.liquidityUsd : void 0,
						volume: void 0,
						totalVolume24h: void 0,
						pairCreatedAt: t.createdAt || void 0,
						info: {
							imageUrl: t.imageUrl || void 0,
							websites: webUrl ? [{
								type: "website",
								label: "Website",
								url: webUrl
							}] : [],
							socials: [...twUrl ? [{
								type: "twitter",
								url: twUrl
							}] : [], ...tgUrl ? [{
								type: "telegram",
								url: tgUrl
							}] : []]
						},
						primaryProvider: this.name,
						sources,
						dexes,
						bondingCurvePda: t.bondingCurvePda,
						bondingProgress: isGraduated ? 100 : t.bondingProgress || 0,
						isBondingCurve: !isGraduated,
						isGraduated,
						complete: isComplete || Boolean(t.complete),
						marketStage,
						pumpSwapPool: pumpPool,
						pumpswap_pool: pumpPool,
						pairs: hasPumpSwap ? [{
							chainId: "solana",
							pairAddress,
							dexName: "PumpSwap",
							dexId: "pumpswap",
							baseToken: {
								address: cleanAddr,
								name: tokenName,
								symbol: tokenSymbol
							},
							quoteToken: {
								address: "So11111111111111111111111111111111111111112",
								name: "Wrapped SOL",
								symbol: "SOL"
							},
							priceUsd,
							liquidityUsd: t.liquidityUsd
						}] : hasRaydium ? [{
							chainId: "solana",
							pairAddress,
							dexName: "Raydium",
							dexId: "raydium",
							baseToken: {
								address: cleanAddr,
								name: tokenName,
								symbol: tokenSymbol
							},
							quoteToken: {
								address: "So11111111111111111111111111111111111111112",
								name: "Wrapped SOL",
								symbol: "SOL"
							},
							priceUsd,
							liquidityUsd: t.liquidityUsd
						}] : void 0,
						realSolReservesFormatted: t.realSolReservesFormatted,
						virtualTokenReserves: t.virtualTokenReserves,
						virtualSolReserves: t.virtualSolReserves,
						realTokenReserves: t.realTokenReserves,
						realSolReserves: t.realSolReserves,
						tokenTotalSupply: t.tokenTotalSupply
					}];
				}
			}
			const dexSettledIndex = isSolana ? 1 : 0;
			if (settled[dexSettledIndex] && settled[dexSettledIndex].status === "fulfilled" && settled[dexSettledIndex].value) {
				const dexRes = settled[dexSettledIndex].value;
				if (Array.isArray(dexRes?.pairs) && dexRes.pairs.length > 0) {
					const normChain = chainId ? normalizeChainName(chainId) : void 0;
					return dexRes.pairs.filter((p) => !normChain || normChain === "all" || normalizeChainName(p.chainId) === normChain).map((p) => ({
						...p,
						primaryProvider: this.name
					}));
				}
			}
			return [];
		} catch {
			return [];
		}
	}
	async discoverTokens(_mode, _signal, _chainId) {
		return [];
	}
};
var RPC_ENDPOINTS = [
	"https://solana-rpc.publicnode.com",
	"https://rpc.ankr.com/solana",
	"https://api.mainnet-beta.solana.com"
];
var currentRpcIdx = 0;
function getActiveSolanaConnection() {
	const endpoint = RPC_ENDPOINTS[currentRpcIdx] || "https://solana-rpc.publicnode.com";
	return new Connection(endpoint, {
		commitment: "confirmed",
		disableRetryOnRateLimit: true
	});
}
function rotateSolanaRpc() {
	currentRpcIdx = (currentRpcIdx + 1) % RPC_ENDPOINTS.length;
}
async function solanaRpcCall(method, params, timeoutMs = 5e3, signal) {
	const maxTries = RPC_ENDPOINTS.length * 2;
	for (let attempt = 0; attempt < maxTries; attempt++) {
		const endpoint = RPC_ENDPOINTS[currentRpcIdx] || "https://solana-rpc.publicnode.com";
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
		const onAbort = () => controller.abort();
		if (signal) {
			if (signal.aborted) {
				clearTimeout(timeoutId);
				return null;
			}
			signal.addEventListener("abort", onAbort, { once: true });
		}
		try {
			const res = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					jsonrpc: "2.0",
					id: `dexhunter-solana-rpc-${Date.now()}`,
					method,
					params
				}),
				signal: controller.signal
			});
			clearTimeout(timeoutId);
			if (signal) signal.removeEventListener("abort", onAbort);
			if (!res.ok) {
				rotateSolanaRpc();
				if (res.status === 429 && attempt < maxTries - 1) await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
				continue;
			}
			const json = await res.json();
			if (json.error) {
				rotateSolanaRpc();
				continue;
			}
			return json.result;
		} catch {
			clearTimeout(timeoutId);
			if (signal) signal.removeEventListener("abort", onAbort);
			rotateSolanaRpc();
			if (attempt < maxTries - 1) continue;
			return null;
		}
	}
	return null;
}
var SolanaRPCProvider = class {
	name = "SolanaRPC";
	/**
	* Primary method to fetch on-chain token metadata and supply via Solana JSON-RPC
	*/
	async fetchTokens(mintAddress, signal) {
		if (!mintAddress || mintAddress.trim().length < 32 || mintAddress.includes(" ")) return [];
		const cleanMint = mintAddress.trim();
		try {
			const [accountSettled, metaSettled] = await Promise.allSettled([solanaRpcCall("getAccountInfo", [cleanMint, { encoding: "jsonParsed" }], 5e3, signal), (async () => {
				const conn = getActiveSolanaConnection();
				return await fetchMetaplexMetadata(conn, cleanMint, { timeoutMs: 3500 });
			})()]);
			const accountInfo = accountSettled.status === "fulfilled" ? accountSettled.value : null;
			if (!accountInfo || !accountInfo.value) return [];
			const parsed = accountInfo.value?.data?.parsed;
			const owner = typeof accountInfo.value?.owner === "string" ? accountInfo.value.owner : accountInfo.value?.owner?.toString?.();
			if (!(parsed?.type === "mint") && !(owner === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" || owner === "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb")) return [];
			if (parsed && parsed.type !== "mint") return [];
			const parsedData = parsed?.info;
			const decimals = parsedData?.decimals ?? 9;
			const supplyRaw = parsedData?.supply ?? "0";
			Number(supplyRaw) / Math.pow(10, decimals);
			let tokenName = `Unknown Token (${cleanMint.slice(0, 4)}...${cleanMint.slice(-4)})`;
			let tokenSymbol = cleanMint.slice(0, 5).toUpperCase();
			let imageUrl = void 0;
			const websites = [];
			const socials = [];
			if (metaSettled.status === "fulfilled" && metaSettled.value) {
				const meta = metaSettled.value;
				if (meta && (meta.name || meta.symbol || meta.image)) {
					if (meta.name && !meta.name.startsWith("Token ")) tokenName = meta.name;
					if (meta.symbol && meta.symbol !== "TOKEN") tokenSymbol = meta.symbol;
					if (meta.image) imageUrl = normalizeUri(meta.image, 0);
					if (meta.website) websites.push({
						type: "website",
						label: "Website",
						url: meta.website
					});
					if (meta.twitter) socials.push({
						type: "twitter",
						url: meta.twitter
					});
					if (meta.telegram) socials.push({
						type: "telegram",
						url: meta.telegram
					});
				}
			}
			return [{
				chainId: "solana",
				dexId: "solana-rpc",
				url: `https://solscan.io/token/${cleanMint}`,
				pairAddress: cleanMint,
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
				priceNative: void 0,
				priceUsd: void 0,
				marketCap: void 0,
				fdv: void 0,
				liquidity: void 0,
				totalLiquidityUsd: void 0,
				volume: void 0,
				totalVolume24h: void 0,
				pairCreatedAt: void 0,
				primaryProvider: this.name,
				sources: ["Solana RPC"],
				info: {
					imageUrl,
					websites: websites.length > 0 ? websites : void 0,
					socials: socials.length > 0 ? socials : void 0
				}
			}];
		} catch {
			return [];
		}
	}
	async searchTokens(query, signal) {
		if (query && query.trim().length >= 32 && !query.includes(" ")) return this.fetchTokens(query.trim(), signal);
		return [];
	}
	async getTokenByAddress(address, _chainId, signal) {
		return this.fetchTokens(address, signal);
	}
	async discoverTokens(_mode, _signal, _chainId) {
		return [];
	}
};
new SolanaRPCProvider();
var SOLANA_QUOTE_MINTS$1 = /* @__PURE__ */ new Set([
	"so11111111111111111111111111111111111111112",
	"epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v",
	"es9vmfrzacerrmjfrf4h2fyd4kconky11mcce8benwny",
	"es9vmfrzacerrmjfrf4h2fyd4kconky11mcce8benwnyb",
	"usdh1sm1ojcxkgzsq8mdtxgiqxdcntnhntfhnmmtz2w",
	"usdswr9apdhk5bvjkmjzff41tptr8auuhqgydqiskpt",
	"jupyiwryjfskupiha7hker8vutaefosybkedznsdvcn"
]);
async function fetchWithTimeout$1(url, timeoutMs = 6e3, signal, headers) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
	const onAbort = () => controller.abort();
	if (signal) {
		if (signal.aborted) {
			clearTimeout(timeoutId);
			return null;
		}
		signal.addEventListener("abort", onAbort, { once: true });
	}
	try {
		const res = await fetch(url, {
			headers: {
				Accept: "application/json",
				...headers || {}
			},
			signal: controller.signal
		});
		clearTimeout(timeoutId);
		if (signal) signal.removeEventListener("abort", onAbort);
		if (!res.ok) return null;
		return await res.json();
	} catch {
		clearTimeout(timeoutId);
		if (signal) signal.removeEventListener("abort", onAbort);
		return null;
	}
}
/**
* Dedicated Solana Multi-DEX Discovery & Token Provider
* Covers: Meteora DLMM, Orca Whirlpools, Raydium, PumpSwap, Lifinity, Phoenix, OpenBook, Manifest
*/
var SolanaDexProvider = class {
	name = "SolanaDEX";
	cache = /* @__PURE__ */ new Map();
	CACHE_TTL_MS = 12e3;
	orcaPoolsCache = null;
	clearCache() {
		this.cache.clear();
	}
	parseMeteoraPool(pool) {
		try {
			if (!pool || !pool.address || !pool.token_x || !pool.token_y) return null;
			const addrX = (pool.token_x.address || "").toLowerCase();
			const addrY = (pool.token_y.address || "").toLowerCase();
			const xIsQuote = SOLANA_QUOTE_MINTS$1.has(addrX);
			const yIsQuote = SOLANA_QUOTE_MINTS$1.has(addrY);
			let baseObj = pool.token_x;
			let quoteObj = pool.token_y;
			if (xIsQuote && !yIsQuote) {
				baseObj = pool.token_y;
				quoteObj = pool.token_x;
			} else if (!xIsQuote && yIsQuote) {
				baseObj = pool.token_x;
				quoteObj = pool.token_y;
			}
			const baseAddress = baseObj.address;
			if (!baseAddress) return null;
			const tvl = Number(pool.tvl || 0);
			const vol24h = Number(pool.volume?.["24h"] || pool.volume?.h24 || 0);
			const priceNative = pool.current_price ? String(pool.current_price) : void 0;
			const createdAtRaw = pool.created_at ? Number(pool.created_at) : void 0;
			const createdAt = createdAtRaw ? createdAtRaw < 1e10 ? createdAtRaw * 1e3 : createdAtRaw : void 0;
			return {
				chainId: "solana",
				dexId: "meteora",
				primaryDex: "Meteora",
				primaryProvider: "Meteora DLMM",
				pairAddress: pool.address,
				baseToken: {
					address: baseAddress,
					name: baseObj.name || baseObj.symbol || "Token",
					symbol: baseObj.symbol || "TOKEN"
				},
				quoteToken: {
					address: quoteObj.address || "So11111111111111111111111111111111111111112",
					name: quoteObj.name || "Wrapped SOL",
					symbol: quoteObj.symbol || "SOL"
				},
				priceNative,
				liquidity: {
					usd: tvl,
					base: 0,
					quote: 0
				},
				totalLiquidityUsd: tvl,
				volume: { h24: vol24h },
				totalVolume24h: vol24h,
				pairCreatedAt: createdAt,
				url: `https://app.meteora.ag/dlmm/${pool.address}`,
				primaryDexTradingUrl: `https://app.meteora.ag/dlmm/${pool.address}`,
				sources: ["Meteora"]
			};
		} catch {
			return null;
		}
	}
	async fetchMeteoraPools(mode, signal) {
		try {
			const json = await fetchWithTimeout$1(`https://dlmm.datapi.meteora.ag/pools?limit=25&sort_key=${mode === "latest" ? "created_at" : "volume"}&order_by=desc`, 5e3, signal);
			if (!json || !Array.isArray(json.data)) return [];
			const results = [];
			for (const p of json.data) {
				const parsed = this.parseMeteoraPool(p);
				if (parsed) results.push(parsed);
			}
			if (mode === "latest") results.sort((a, b) => (Number(b.pairCreatedAt) || 0) - (Number(a.pairCreatedAt) || 0));
			return results;
		} catch {
			return [];
		}
	}
	async searchMeteoraPools(query, signal) {
		try {
			const json = await fetchWithTimeout$1(`https://dlmm.datapi.meteora.ag/pools?search=${encodeURIComponent(query)}`, 5e3, signal);
			if (!json || !Array.isArray(json.data)) return [];
			const results = [];
			for (const p of json.data) {
				const parsed = this.parseMeteoraPool(p);
				if (parsed) results.push(parsed);
			}
			return results;
		} catch {
			return [];
		}
	}
	async getOrcaWhirlpoolList(signal) {
		if (this.orcaPoolsCache && Date.now() - this.orcaPoolsCache.timestamp < 6e4) return this.orcaPoolsCache.pools;
		try {
			const json = await fetchWithTimeout$1("https://api.mainnet.orca.so/v1/whirlpool/list", 5e3, signal);
			if (json && Array.isArray(json.whirlpools)) {
				this.orcaPoolsCache = {
					pools: json.whirlpools,
					timestamp: Date.now()
				};
				return json.whirlpools;
			}
		} catch {}
		return [];
	}
	parseOrcaPool(pool) {
		try {
			if (!pool || !pool.address || !pool.tokenA || !pool.tokenB) return null;
			const mintA = (pool.tokenA.mint || "").toLowerCase();
			const mintB = (pool.tokenB.mint || "").toLowerCase();
			const aIsQuote = SOLANA_QUOTE_MINTS$1.has(mintA);
			const bIsQuote = SOLANA_QUOTE_MINTS$1.has(mintB);
			let baseObj = pool.tokenA;
			let quoteObj = pool.tokenB;
			if (aIsQuote && !bIsQuote) {
				baseObj = pool.tokenB;
				quoteObj = pool.tokenA;
			} else if (!aIsQuote && bIsQuote) {
				baseObj = pool.tokenA;
				quoteObj = pool.tokenB;
			}
			const baseAddress = baseObj.mint;
			if (!baseAddress) return null;
			const tvl = Number(pool.tvl || 0);
			const vol24h = Number(pool.volume?.day || 0);
			const priceNative = pool.price ? String(pool.price) : void 0;
			return {
				chainId: "solana",
				dexId: "orca",
				primaryDex: "Orca",
				primaryProvider: "Orca Whirlpools",
				pairAddress: pool.address,
				baseToken: {
					address: baseAddress,
					name: baseObj.name || baseObj.symbol || "Token",
					symbol: baseObj.symbol || "TOKEN"
				},
				quoteToken: {
					address: quoteObj.mint || "So11111111111111111111111111111111111111112",
					name: quoteObj.name || "Wrapped SOL",
					symbol: quoteObj.symbol || "SOL"
				},
				priceNative,
				liquidity: {
					usd: tvl,
					base: 0,
					quote: 0
				},
				totalLiquidityUsd: tvl,
				volume: { h24: vol24h },
				totalVolume24h: vol24h,
				info: { imageUrl: baseObj.logoURI || void 0 },
				url: "https://www.orca.so/pools",
				primaryDexTradingUrl: "https://www.orca.so/pools",
				sources: ["Orca"]
			};
		} catch {
			return null;
		}
	}
	async fetchOrcaPools(mode, signal) {
		try {
			const whirlpools = await this.getOrcaWhirlpoolList(signal);
			if (whirlpools.length === 0) return [];
			const sorted = [...whirlpools].sort((a, b) => {
				if (mode === "latest") {
					const aT = Number(a.createdAt || a.created_at || a.openTime || 0);
					return Number(b.createdAt || b.created_at || b.openTime || 0) - aT;
				}
				return (Number(b.volume?.day) || 0) - (Number(a.volume?.day) || 0);
			});
			const results = [];
			for (const p of sorted.slice(0, 25)) {
				const parsed = this.parseOrcaPool(p);
				if (parsed) results.push(parsed);
			}
			return results;
		} catch {
			return [];
		}
	}
	async searchOrcaPools(query, signal) {
		try {
			const whirlpools = await this.getOrcaWhirlpoolList(signal);
			if (whirlpools.length === 0) return [];
			const qLower = query.toLowerCase().trim();
			const matched = whirlpools.filter((p) => {
				const tA = p.tokenA;
				const tB = p.tokenB;
				return tA?.mint?.toLowerCase() === qLower || tB?.mint?.toLowerCase() === qLower || tA?.symbol?.toLowerCase().includes(qLower) || tB?.symbol?.toLowerCase().includes(qLower) || tA?.name?.toLowerCase().includes(qLower) || tB?.name?.toLowerCase().includes(qLower) || p.address?.toLowerCase() === qLower;
			});
			const results = [];
			for (const p of matched.slice(0, 10)) {
				const parsed = this.parseOrcaPool(p);
				if (parsed) results.push(parsed);
			}
			return results;
		} catch {
			return [];
		}
	}
	parseRaydiumPool(pool) {
		try {
			if (!pool || !pool.id || !pool.mintA || !pool.mintB) return null;
			const addrA = (pool.mintA.address || "").toLowerCase();
			const addrB = (pool.mintB.address || "").toLowerCase();
			const aIsQuote = SOLANA_QUOTE_MINTS$1.has(addrA);
			const bIsQuote = SOLANA_QUOTE_MINTS$1.has(addrB);
			let baseObj = pool.mintA;
			let quoteObj = pool.mintB;
			if (aIsQuote && !bIsQuote) {
				baseObj = pool.mintB;
				quoteObj = pool.mintA;
			} else if (!aIsQuote && bIsQuote) {
				baseObj = pool.mintA;
				quoteObj = pool.mintB;
			}
			const baseAddress = baseObj.address;
			if (!baseAddress) return null;
			const tvl = Number(pool.tvl || 0);
			const vol24h = Number(pool.day?.volume || 0);
			const priceNative = pool.price ? String(pool.price) : void 0;
			const openTimeNum = Number(pool.openTime || 0);
			let pairCreatedAt;
			if (openTimeNum > 0) pairCreatedAt = openTimeNum < 1e10 ? openTimeNum * 1e3 : openTimeNum;
			return {
				chainId: "solana",
				dexId: "raydium",
				primaryDex: "Raydium",
				primaryProvider: "Raydium API",
				pairAddress: pool.id,
				pairCreatedAt,
				baseToken: {
					address: baseAddress,
					name: baseObj.name || baseObj.symbol || "Token",
					symbol: baseObj.symbol || "TOKEN"
				},
				quoteToken: {
					address: quoteObj.address || "So11111111111111111111111111111111111111112",
					name: quoteObj.name || "Wrapped SOL",
					symbol: quoteObj.symbol || "SOL"
				},
				priceNative,
				liquidity: {
					usd: tvl,
					base: 0,
					quote: 0
				},
				totalLiquidityUsd: tvl,
				volume: { h24: vol24h },
				totalVolume24h: vol24h,
				info: { imageUrl: baseObj.logoURI || void 0 },
				url: `https://raydium.io/swap/?inputMint=sol&outputMint=${baseAddress}`,
				primaryDexTradingUrl: `https://raydium.io/swap/?inputMint=sol&outputMint=${baseAddress}`,
				sources: ["Raydium"]
			};
		} catch {
			return null;
		}
	}
	async fetchRaydiumPools(_mode, signal) {
		try {
			const json = await fetchWithTimeout$1(`https://api-v3.raydium.io/pools/info/list?poolType=all&poolSortField=${_mode === "latest" ? "openTime" : "volume24h"}&sortType=desc&pageSize=25&page=1`, 5e3, signal);
			if (!json || !json.success || !Array.isArray(json.data?.data)) return [];
			const results = [];
			for (const p of json.data.data) {
				const parsed = this.parseRaydiumPool(p);
				if (parsed) results.push(parsed);
			}
			return results;
		} catch {
			return [];
		}
	}
	parseRaydiumLaunchRow(row) {
		try {
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
		} catch {
			return null;
		}
	}
	async lookupRaydiumLaunchpad(query, signal) {
		const q = query.trim();
		if (!q) return [];
		const url = q.length >= 32 && q.length <= 44 && !q.startsWith("0x") && !/\s/.test(q) ? `https://launch-mint-v1.raydium.io/get/by/mints?ids=${encodeURIComponent(q)}` : `https://launch-mint-v1.raydium.io/get/search?text=${encodeURIComponent(q)}`;
		try {
			const json = await fetchWithTimeout$1(url, 6e3, signal);
			const rows = json?.data?.rows;
			if (!json?.success || !Array.isArray(rows)) return [];
			const results = [];
			for (const row of rows) {
				const parsed = this.parseRaydiumLaunchRow(row);
				if (parsed) results.push(parsed);
			}
			return results;
		} catch {
			return [];
		}
	}
	async lookupRaydiumMint(mint, signal) {
		try {
			const json = await fetchWithTimeout$1(`https://api-v3.raydium.io/pools/info/mint?mint1=${encodeURIComponent(mint)}&poolType=all&poolSortField=default&sortType=desc&pageSize=10&page=1`, 5e3, signal);
			if (!json || !json.success || !Array.isArray(json.data?.data)) return [];
			const results = [];
			for (const p of json.data.data) {
				const parsed = this.parseRaydiumPool(p);
				if (parsed) results.push(parsed);
			}
			return results;
		} catch {
			return [];
		}
	}
	parseGeckoTerminalSolanaPool(pool, included) {
		try {
			const attrs = pool?.attributes;
			if (!attrs) return null;
			const baseTokenRelId = pool.relationships?.base_token?.data?.id;
			const dexRelId = pool.relationships?.dex?.data?.id;
			const tokenItem = included.find((i) => i.id === baseTokenRelId);
			const dexItem = included.find((i) => i.id === dexRelId);
			const tokenAttrs = tokenItem?.attributes || {};
			const rawDexName = (dexItem?.attributes || {}).name || dexRelId || "Solana DEX";
			const dexName = normalizeDexName(rawDexName);
			const dexId = dexName.toLowerCase().replace(/[^a-z0-9]/g, "");
			const address = tokenAttrs.address;
			if (!address) return null;
			const symbol = tokenAttrs.symbol || attrs.name?.split("/")?.[0]?.trim() || "TOKEN";
			const name = tokenAttrs.name || symbol;
			const priceUsd = attrs.base_token_price_usd ? String(attrs.base_token_price_usd) : void 0;
			const volume24h = attrs.volume_usd?.h24 ? Number(attrs.volume_usd.h24) : 0;
			const liquidityUsd = attrs.reserve_in_usd ? Number(attrs.reserve_in_usd) : 0;
			const marketCap = attrs.market_cap_usd ? Number(attrs.market_cap_usd) : attrs.fdv_usd ? Number(attrs.fdv_usd) : void 0;
			const priceChange24h = attrs.price_change_percentage?.h24 ? Number(attrs.price_change_percentage.h24) : void 0;
			const pairAddress = attrs.address;
			let pairCreatedAt;
			if (attrs.pool_created_at) {
				const parsed = new Date(attrs.pool_created_at).getTime();
				if (!isNaN(parsed) && parsed > 0) pairCreatedAt = parsed;
			}
			const partial = {
				chainId: "solana",
				dexId,
				primaryDex: dexName,
				primaryProvider: `GeckoTerminal (${dexName})`,
				pairAddress,
				pairCreatedAt,
				baseToken: {
					address,
					name,
					symbol
				},
				priceUsd,
				marketCap,
				fdv: marketCap,
				liquidity: {
					usd: liquidityUsd,
					base: 0,
					quote: 0
				},
				totalLiquidityUsd: liquidityUsd,
				volume: { h24: volume24h },
				totalVolume24h: volume24h,
				priceChange: priceChange24h !== void 0 ? { h24: priceChange24h } : void 0,
				info: { imageUrl: tokenAttrs.image_url || void 0 },
				url: `https://geckoterminal.com/solana/pools/${pairAddress}`,
				sources: [dexName]
			};
			const tradeUrl = getDexTradingUrl(partial, dexName);
			if (tradeUrl) partial.primaryDexTradingUrl = tradeUrl;
			return partial;
		} catch {
			return null;
		}
	}
	async fetchGeckoTerminalSolanaTrending(signal) {
		try {
			const data = await fetchWithTimeout$1("https://api.geckoterminal.com/api/v2/networks/solana/trending_pools?include=base_token,dex", 5e3, signal);
			if (!data || !Array.isArray(data.data)) return [];
			const included = Array.isArray(data.included) ? data.included : [];
			const results = [];
			for (const pool of data.data) {
				const parsed = this.parseGeckoTerminalSolanaPool(pool, included);
				if (parsed) results.push(parsed);
			}
			return results;
		} catch {
			return [];
		}
	}
	async fetchPumpSwapPools(mode, signal) {
		try {
			const data = await fetchWithTimeout$1(`https://api.geckoterminal.com/api/v2/networks/solana/dexes/pumpswap/pools?include=base_token,dex&page=1${mode === "latest" ? "&sort=h24_tx_count_desc" : ""}`, 5e3, signal);
			if (!data || !Array.isArray(data.data)) return [];
			const included = Array.isArray(data.included) ? data.included : [];
			const results = [];
			for (const pool of data.data) {
				const parsed = this.parseGeckoTerminalSolanaPool(pool, included);
				if (parsed) results.push(parsed);
			}
			return results;
		} catch {
			return [];
		}
	}
	async lookupGeckoTerminalSolanaToken(address, signal) {
		try {
			const data = await fetchWithTimeout$1(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/${encodeURIComponent(address)}/pools?include=base_token,dex`, 5e3, signal);
			if (!data || !Array.isArray(data.data)) return [];
			const included = Array.isArray(data.included) ? data.included : [];
			const results = [];
			for (const pool of data.data) {
				const parsed = this.parseGeckoTerminalSolanaPool(pool, included);
				if (parsed) results.push(parsed);
			}
			return results;
		} catch {
			return [];
		}
	}
	async fetchDexScreenerVenues(signal) {
		const queries = [
			"pumpswap",
			"meteora",
			"orca",
			"lifinity",
			"phoenix",
			"openbook",
			"manifest"
		].map((v) => fetchWithTimeout$1(`https://api.dexscreener.com/latest/dex/search?q=${v}`, 4500, signal));
		const settled = await Promise.allSettled(queries);
		const results = [];
		for (const r of settled) if (r.status === "fulfilled" && r.value && Array.isArray(r.value.pairs)) {
			for (const p of r.value.pairs) if (p.chainId === "solana" && p.baseToken?.address) {
				const h24Vol = Number(p.volume?.h24 || 0);
				const h1Vol = Number(p.volume?.h1 || 0);
				if (h24Vol < 300 && h1Vol === 0) continue;
				const dexName = normalizeDexName(p.dexId);
				results.push({
					...p,
					primaryDex: dexName,
					primaryProvider: `DexScreener (${dexName})`,
					sources: [dexName]
				});
			}
		}
		return results;
	}
	/**
	* Discovers Solana tokens across all major venues (Meteora, Orca, Raydium, PumpSwap, Lifinity, etc.)
	*/
	async discoverTokens(mode, signal, chainId, forceRefresh) {
		if (chainId && normalizeChainName(chainId) !== "solana" && chainId !== "all") return [];
		const cacheKey = `solana_dex_${mode}`;
		if (forceRefresh) this.cache.delete(cacheKey);
		else {
			const cached = this.cache.get(cacheKey);
			if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) return cached.data;
		}
		const settled = await Promise.allSettled([
			this.fetchDexScreenerVenues(signal),
			this.fetchMeteoraPools(mode, signal),
			this.fetchOrcaPools(mode, signal),
			this.fetchRaydiumPools(mode, signal),
			this.fetchPumpSwapPools(mode, signal),
			this.fetchGeckoTerminalSolanaTrending(signal)
		]);
		const discovered = [];
		for (const res of settled) if (res.status === "fulfilled" && Array.isArray(res.value)) discovered.push(...res.value);
		const seen = /* @__PURE__ */ new Set();
		const unique = [];
		const fetchTime = Date.now();
		for (const p of discovered) {
			const id = `${p.dexId || "dex"}:${(p.pairAddress || p.baseToken?.address || "").toLowerCase()}`;
			if (!seen.has(id)) {
				seen.add(id);
				p.providerFetchTimestamp = fetchTime;
				if (mode === "trending") {
					const vol = Number(p.volume?.h24 || 0);
					const liq = Number(p.liquidity?.usd || 0);
					if (vol < 200 && liq < 300) continue;
				}
				unique.push(p);
			}
		}
		if (mode === "latest") unique.sort((a, b) => (Number(b.pairCreatedAt) || 0) - (Number(a.pairCreatedAt) || 0));
		if (unique.length > 0) this.cache.set(cacheKey, {
			data: unique,
			timestamp: Date.now()
		});
		return unique;
	}
	/**
	* Looks up a Solana token by exact contract address (mint) across all DEX venues
	*/
	async getTokenByAddress(address, chainId, signal) {
		if (!address || !address.trim()) return [];
		const clean = address.trim();
		if (clean.startsWith("0x")) return [];
		if (chainId && normalizeChainName(chainId) !== "solana" && chainId !== "all") return [];
		const settled = await Promise.allSettled([
			this.lookupRaydiumLaunchpad(clean, signal),
			this.searchMeteoraPools(clean, signal),
			this.lookupRaydiumMint(clean, signal),
			this.searchOrcaPools(clean, signal),
			this.lookupGeckoTerminalSolanaToken(clean, signal)
		]);
		const results = [];
		for (const res of settled) if (res.status === "fulfilled" && Array.isArray(res.value)) results.push(...res.value);
		return results;
	}
	/**
	* Text search across Solana DEX venues
	*/
	async searchTokens(query, signal) {
		if (!query || !query.trim()) return [];
		const clean = query.trim();
		if (clean.startsWith("0x")) return [];
		if (clean.length >= 32 && clean.length <= 44 && !clean.includes(" ")) return this.getTokenByAddress(clean, "solana", signal);
		const settled = await Promise.allSettled([
			this.lookupRaydiumLaunchpad(clean, signal),
			this.searchMeteoraPools(clean, signal),
			this.searchOrcaPools(clean, signal)
		]);
		const results = [];
		for (const res of settled) if (res.status === "fulfilled" && Array.isArray(res.value)) results.push(...res.value);
		return results;
	}
};
var GECKOTERMINAL_NETWORK_MAP = {
	ethereum: "eth",
	eth: "eth",
	base: "base",
	bsc: "bsc",
	arbitrum: "arbitrum",
	polygon: "polygon_pos",
	avalanche: "avax",
	cronos: "cronos"
};
var NATIVE_DEX_SEARCH_TARGETS = {
	bsc: [
		"pancakeswap bsc",
		"pancakeswap wbnb",
		"thena bsc",
		"biswap"
	],
	base: [
		"aerodrome base",
		"uniswap base",
		"baseswap",
		"aerodrome weth"
	],
	ethereum: [
		"uniswap ethereum",
		"uniswap weth",
		"curve ethereum",
		"sushiswap"
	],
	arbitrum: [
		"camelot arbitrum",
		"uniswap arbitrum",
		"gmx arbitrum"
	],
	polygon: ["quickswap polygon", "uniswap polygon"],
	avalanche: ["traderjoe avalanche", "pangolin avalanche"],
	cronos: ["vvs finance cronos", "mm finance cronos"],
	robinhood: ["robinhood", "uniswap robinhood"]
};
async function fetchWithTimeout(url, timeoutMs = 6e3, signal) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
	const onAbort = () => controller.abort();
	if (signal) {
		if (signal.aborted) {
			clearTimeout(timeoutId);
			return null;
		}
		signal.addEventListener("abort", onAbort, { once: true });
	}
	try {
		const res = await fetch(url, {
			headers: { Accept: "application/json" },
			signal: controller.signal
		});
		clearTimeout(timeoutId);
		if (signal) signal.removeEventListener("abort", onAbort);
		if (!res.ok) return null;
		return await res.json();
	} catch {
		clearTimeout(timeoutId);
		if (signal) signal.removeEventListener("abort", onAbort);
		return null;
	}
}
var NativeEvmDexProvider = class {
	name = "NativeEVM";
	cache = /* @__PURE__ */ new Map();
	CACHE_TTL_MS = 12e3;
	pancakeListCache = null;
	clearCache() {
		this.cache.clear();
	}
	/**
	* Fetch verified tokens from PancakeSwap's official extended token registry (BSC / Ethereum / Base)
	*/
	async fetchPancakeSwapTokenList(signal) {
		if (this.pancakeListCache && Date.now() - this.pancakeListCache.timestamp < 12e4) return this.pancakeListCache.tokens;
		try {
			const data = await fetchWithTimeout("https://tokens.pancakeswap.finance/pancakeswap-extended.json", 5e3, signal);
			if (Array.isArray(data?.tokens)) {
				this.pancakeListCache = {
					tokens: data.tokens,
					timestamp: Date.now()
				};
				return data.tokens;
			}
		} catch {}
		return [];
	}
	/**
	* Convert a GeckoTerminal pool and its included entities into a normalized TokenPair
	*/
	parseGeckoTerminalPool(pool, included, chainName) {
		try {
			const attrs = pool?.attributes;
			if (!attrs) return null;
			const baseTokenRelId = pool.relationships?.base_token?.data?.id;
			const dexRelId = pool.relationships?.dex?.data?.id;
			const tokenItem = included.find((i) => i.id === baseTokenRelId);
			const dexItem = included.find((i) => i.id === dexRelId);
			const tokenAttrs = tokenItem?.attributes || {};
			const dexAttrs = dexItem?.attributes || {};
			const address = tokenAttrs.address;
			if (!address) return null;
			const symbol = tokenAttrs.symbol || attrs.name?.split("/")?.[0]?.trim() || "TOKEN";
			const name = tokenAttrs.name || symbol;
			const dexName = dexAttrs.name || normalizeDexName(dexRelId || "dex");
			const priceUsd = attrs.base_token_price_usd ? String(attrs.base_token_price_usd) : void 0;
			const volume24h = attrs.volume_usd?.h24 ? Number(attrs.volume_usd.h24) : 0;
			const liquidityUsd = attrs.reserve_in_usd ? Number(attrs.reserve_in_usd) : 0;
			const fdv = attrs.fdv_usd ? Number(attrs.fdv_usd) : void 0;
			const marketCap = attrs.market_cap_usd ? Number(attrs.market_cap_usd) : fdv;
			const priceChange24h = attrs.price_change_percentage?.h24 ? Number(attrs.price_change_percentage.h24) : 0;
			const pairAddress = attrs.address;
			const chainNorm = normalizeChainName(chainName);
			let pairCreatedAt;
			if (attrs.pool_created_at) {
				const parsed = new Date(attrs.pool_created_at).getTime();
				if (!isNaN(parsed) && parsed > 0) pairCreatedAt = parsed;
			}
			const partial = {
				chainId: chainNorm,
				dexId: dexRelId || dexName.toLowerCase().replace(/[^a-z0-9]/g, ""),
				primaryDex: dexName,
				primaryProvider: `Native ${dexName}`,
				pairAddress,
				pairCreatedAt,
				baseToken: {
					address,
					name,
					symbol
				},
				priceUsd,
				priceNative: attrs.base_token_price_native_currency ? String(attrs.base_token_price_native_currency) : void 0,
				marketCap,
				fdv,
				liquidity: {
					usd: liquidityUsd,
					base: 0,
					quote: 0
				},
				volume: {
					h24: volume24h,
					h6: attrs.volume_usd?.h6 ? Number(attrs.volume_usd.h6) : 0,
					h1: attrs.volume_usd?.h1 ? Number(attrs.volume_usd.h1) : 0,
					m5: attrs.volume_usd?.m5 ? Number(attrs.volume_usd.m5) : 0
				},
				priceChange: {
					h24: priceChange24h,
					h6: attrs.price_change_percentage?.h6 ? Number(attrs.price_change_percentage.h6) : 0,
					h1: attrs.price_change_percentage?.h1 ? Number(attrs.price_change_percentage.h1) : 0,
					m5: attrs.price_change_percentage?.m5 ? Number(attrs.price_change_percentage.m5) : 0
				},
				txns: {
					h24: {
						buys: attrs.transactions?.h24?.buys || 0,
						sells: attrs.transactions?.h24?.sells || 0
					},
					h1: {
						buys: attrs.transactions?.h1?.buys || 0,
						sells: attrs.transactions?.h1?.sells || 0
					}
				},
				info: { imageUrl: tokenAttrs.image_url || void 0 },
				url: `https://geckoterminal.com/${chainNorm}/pools/${pairAddress}`
			};
			const directTradeUrl = getDexTradingUrl(partial, dexName);
			if (directTradeUrl) partial.primaryDexTradingUrl = directTradeUrl;
			return partial;
		} catch {
			return null;
		}
	}
	/**
	* Fetch native trending pools from GeckoTerminal for non-Solana EVM networks
	*/
	async fetchGeckoTerminalTrending(chainName, signal) {
		const gtNet = GECKOTERMINAL_NETWORK_MAP[chainName.toLowerCase()];
		if (!gtNet) return [];
		try {
			const data = await fetchWithTimeout(`https://api.geckoterminal.com/api/v2/networks/${gtNet}/trending_pools?include=base_token,dex`, 6e3, signal);
			if (!data || !Array.isArray(data.data)) return [];
			const included = Array.isArray(data.included) ? data.included : [];
			const results = [];
			for (const pool of data.data) {
				const parsed = this.parseGeckoTerminalPool(pool, included, chainName);
				if (parsed) results.push(parsed);
			}
			return results;
		} catch {
			return [];
		}
	}
	/**
	* Fetch newly created native pools from GeckoTerminal for non-Solana EVM networks
	*/
	async fetchGeckoTerminalNewPools(chainName, signal) {
		const gtNet = GECKOTERMINAL_NETWORK_MAP[chainName.toLowerCase()];
		if (!gtNet) return [];
		try {
			const data = await fetchWithTimeout(`https://api.geckoterminal.com/api/v2/networks/${gtNet}/new_pools?include=base_token,dex`, 6e3, signal);
			if (!data || !Array.isArray(data.data)) return [];
			const included = Array.isArray(data.included) ? data.included : [];
			const results = [];
			for (const pool of data.data) {
				const parsed = this.parseGeckoTerminalPool(pool, included, chainName);
				if (parsed) results.push(parsed);
			}
			return results;
		} catch {
			return [];
		}
	}
	/**
	* Fetch native DEX pairs directly through targeted DEX protocol queries
	* (e.g. PancakeSwap on BSC, Aerodrome on Base, Uniswap on Ethereum)
	*/
	async fetchNativeDexPairs(chainName, signal) {
		const normChain = normalizeChainName(chainName);
		const queries = NATIVE_DEX_SEARCH_TARGETS[normChain] || [];
		if (queries.length === 0) return [];
		const tasks = queries.map((q) => fetchWithTimeout(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`, 5500, signal));
		const settled = await Promise.allSettled(tasks);
		const pairs = [];
		for (const r of settled) if (r.status === "fulfilled" && Array.isArray(r.value?.pairs)) {
			for (const p of r.value.pairs) if (normalizeChainName(p.chainId) === normChain) {
				const h24Vol = Number(p.volume?.h24 || 0);
				const h1Vol = Number(p.volume?.h1 || 0);
				if (h24Vol < 300 && h1Vol === 0) continue;
				const dexName = normalizeDexName(p.dexId);
				const tradeUrl = getDexTradingUrl(p, dexName);
				pairs.push({
					...p,
					primaryDex: dexName,
					primaryDexTradingUrl: tradeUrl || p.primaryDexTradingUrl || p.url,
					primaryProvider: `Native ${dexName}`
				});
			}
		}
		return pairs;
	}
	async searchTokens(query, signal) {
		if (!query || !query.trim()) return [];
		const q = query.trim().toLowerCase();
		const matchedPancake = (await this.fetchPancakeSwapTokenList(signal)).filter((t) => t.symbol?.toLowerCase().includes(q) || t.name?.toLowerCase().includes(q) || t.address?.toLowerCase() === q);
		if (matchedPancake.length > 0) {
			const res = await fetchWithTimeout(`https://api.dexscreener.com/latest/dex/tokens/${matchedPancake.slice(0, 5).map((t) => t.address).join(",")}`, 6e3, signal);
			if (Array.isArray(res?.pairs)) return res.pairs.map((p) => ({
				...p,
				primaryProvider: this.name
			}));
		}
		return [];
	}
	async getTokenByAddress(address, chainId, signal) {
		if (!address || !address.trim()) return [];
		const clean = address.trim();
		try {
			const res = await fetchWithTimeout(`https://api.dexscreener.com/latest/dex/tokens/${clean}`, 6e3, signal);
			if (Array.isArray(res?.pairs)) {
				const normChain = chainId ? normalizeChainName(chainId) : void 0;
				return res.pairs.filter((p) => !normChain || normChain === "all" || normalizeChainName(p.chainId) === normChain).map((p) => ({
					...p,
					primaryProvider: this.name
				}));
			}
		} catch {}
		return [];
	}
	async discoverTokens(_mode, signal, chainId, forceRefresh) {
		const normChain = chainId ? normalizeChainName(chainId) : "all";
		const cacheKey = `native_evm:${_mode}:${normChain}`;
		if (forceRefresh) this.cache.delete(cacheKey);
		else {
			const cached = this.cache.get(cacheKey);
			if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) return cached.data;
		}
		const validChains = (normChain === "all" ? [
			"base",
			"bsc",
			"ethereum",
			"arbitrum",
			"polygon",
			"avalanche",
			"cronos"
		] : [normChain]).filter((c) => [
			"base",
			"bsc",
			"ethereum",
			"arbitrum",
			"polygon",
			"avalanche",
			"cronos"
		].includes(c));
		if (validChains.length === 0) return [];
		const geckoFetcher = _mode === "latest" ? (c) => this.fetchGeckoTerminalNewPools(c, signal) : (c) => this.fetchGeckoTerminalTrending(c, signal);
		const tasks = validChains.flatMap((chain) => [this.fetchNativeDexPairs(chain, signal), geckoFetcher(chain)]);
		const settled = await Promise.allSettled(tasks);
		let combined = [];
		const fetchTime = Date.now();
		for (const r of settled) if (r.status === "fulfilled" && Array.isArray(r.value)) for (const p of r.value) {
			p.providerFetchTimestamp = fetchTime;
			combined.push(p);
		}
		const seen = /* @__PURE__ */ new Set();
		combined = combined.filter((p) => {
			const addr = (p.baseToken?.address || p.address || "").toLowerCase();
			if (!addr) return true;
			const key = `${p.chainId || ""}:${addr}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
		if (combined.length > 0) this.cache.set(cacheKey, {
			data: combined,
			timestamp: Date.now()
		});
		return combined;
	}
};
var preparedCache = /* @__PURE__ */ new Map();
var preparedInflight = /* @__PURE__ */ new Map();
var PREPARED_TTL_MS = 8e3;
function clearPreparedPoolCache() {
	preparedCache.clear();
	preparedInflight.clear();
}
/** One in-flight read of the already-built server pool. Browse views share this. */
async function fetchPreparedPool(mode, chainId, limit = 2e3, _signal, fresh = false) {
	const chain = !chainId || chainId === "all" ? "all" : normalizeChainName(chainId);
	const key = `${mode}|${chain}|${limit}`;
	if (!fresh) {
		const hit = preparedCache.get(key);
		if (hit && Date.now() - hit.at < PREPARED_TTL_MS) return hit.data;
		const pending = preparedInflight.get(key);
		if (pending) return pending;
	}
	const run = (async () => {
		const chainParam = chain !== "all" ? `&chain=${encodeURIComponent(chain)}` : "";
		const res = await fetch(`/api/discovery?mode=${mode}&limit=${limit}${chainParam}&shape=browse`, { signal: AbortSignal.timeout(12e3) });
		if (!res.ok) throw new Error(`Discovery feed failed (${res.status})`);
		const data = await res.json();
		const tokens = Array.isArray(data.tokens) ? data.tokens : [];
		if (tokens.length > 0) preparedCache.set(key, {
			at: Date.now(),
			data: tokens
		});
		return tokens;
	})().finally(() => {
		preparedInflight.delete(key);
	});
	preparedInflight.set(key, run);
	return run;
}
function boundParam(name, value) {
	if (value === "" || value == null || !Number.isFinite(value)) return "";
	return `&${name}=${encodeURIComponent(String(value))}`;
}
function flagParam(name, value) {
	return value ? `&${name}=1` : "";
}
/** One page of the index. Not cached: age and cursor must not reuse the week pool. */
async function fetchDiscoveryPage(opts) {
	const chain = !opts.chainId || opts.chainId === "all" ? "" : String(opts.chainId);
	const chainParam = chain ? `&chain=${encodeURIComponent(chain)}` : "";
	const dex = !opts.dex || opts.dex === "all" ? "" : String(opts.dex);
	const dexParam = dex ? `&dex=${encodeURIComponent(dex)}` : "";
	const cursorParam = opts.cursor ? `&cursor=${encodeURIComponent(opts.cursor)}` : "";
	const age = opts.age || "1w";
	const limit = opts.limit ?? 500;
	const res = await fetch(`/api/discovery?mode=${opts.mode}&limit=${limit}&age=${encodeURIComponent(age)}${chainParam}${dexParam}${cursorParam}${boundParam("minLiquidity", opts.minLiquidity)}${boundParam("maxLiquidity", opts.maxLiquidity)}${boundParam("minVolume", opts.minVolume)}${boundParam("maxVolume", opts.maxVolume)}${boundParam("minMarketCap", opts.minMarketCap)}${boundParam("maxMarketCap", opts.maxMarketCap)}${boundParam("minPriceChange", opts.minPriceChange)}${flagParam("telegram", opts.telegram)}${flagParam("twitter", opts.twitter)}${flagParam("discord", opts.discord)}${flagParam("website", opts.website)}${flagParam("verified", opts.verified)}${flagParam("xProfile", opts.xProfile)}${flagParam("xPost", opts.xPost)}&shape=browse`, { signal: AbortSignal.timeout(2e4) });
	const data = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : `Discovery feed failed (${res.status})`);
	return {
		tokens: Array.isArray(data.tokens) ? data.tokens : [],
		total: typeof data.total === "number" ? data.total : 0,
		nextCursor: typeof data.nextCursor === "string" && data.nextCursor ? data.nextCursor : null
	};
}
function appendUniqueTokens(prev, incoming) {
	if (!incoming.length) return prev;
	const seen = new Set(prev.map((item) => `${item.chainId || ""}:${item.baseToken?.address || item.pairAddress || ""}`.toLowerCase()));
	const extra = [];
	for (const item of incoming) {
		const key = `${item.chainId || ""}:${item.baseToken?.address || item.pairAddress || ""}`.toLowerCase();
		if (!key.endsWith(":") && seen.has(key)) continue;
		seen.add(key);
		extra.push(item);
	}
	return extra.length ? [...prev, ...extra] : prev;
}
async function lookupIndexedAddress(address, chainId, signal) {
	const query = address.trim();
	if (!query) return {
		tokens: [],
		message: "Enter a contract or mint address.",
		ambiguous: false
	};
	const chain = !chainId || chainId === "all" ? "all" : normalizeChainName(chainId);
	const chainParam = chain !== "all" ? `&chain=${encodeURIComponent(chain)}` : "";
	try {
		const res = await fetch(`/api/discovery?address=${encodeURIComponent(query)}${chainParam}&shape=browse`, { signal: signal ?? AbortSignal.timeout(12e3) });
		const data = await res.json().catch(() => ({}));
		if (!res.ok) return {
			tokens: [],
			message: typeof data?.error === "string" ? data.error : "Address lookup failed.",
			ambiguous: false
		};
		return {
			tokens: Array.isArray(data.tokens) ? data.tokens : [],
			message: typeof data.message === "string" ? data.message : null,
			ambiguous: data.ambiguous === true
		};
	} catch (err) {
		if (err instanceof Error && err.name === "AbortError") throw err;
		return {
			tokens: [],
			message: "Address lookup did not finish. Try again.",
			ambiguous: false
		};
	}
}
async function searchLiveMarkets(query, signal) {
	const q = query.trim();
	if (!q) return [];
	try {
		const res = await fetch(`/api/discovery?q=${encodeURIComponent(q)}&shape=browse`, { signal: signal ?? AbortSignal.timeout(12e3) });
		const data = await res.json().catch(() => ({}));
		if (!res.ok) return [];
		return Array.isArray(data.tokens) ? data.tokens : [];
	} catch (err) {
		if (err instanceof Error && err.name === "AbortError") throw err;
		return [];
	}
}
var ServerDiscoveryProvider = class {
	name = "DexHunter Server Indexer";
	isEnabled = true;
	async getTrending(chainId, limit = 2e3) {
		try {
			return await fetchPreparedPool("trending", chainId, limit);
		} catch (err) {
			console.warn("[ServerDiscoveryProvider] getTrending error:", err);
			return [];
		}
	}
	async getLatest(chainId, limit = 2e3) {
		try {
			return await fetchPreparedPool("latest", chainId, limit);
		} catch (err) {
			console.warn("[ServerDiscoveryProvider] getLatest error:", err);
			return [];
		}
	}
	async getFreshMints(limit = 2e3) {
		try {
			return await fetchPreparedPool("fresh_mints", void 0, limit);
		} catch (err) {
			console.warn("[ServerDiscoveryProvider] getFreshMints error:", err);
			return [];
		}
	}
	async search(query, chainId) {
		if (!query) return [];
		try {
			const q = query.toLowerCase().trim();
			return (await this.getLatest(chainId, 5e3)).filter((t) => {
				const addr = t.baseToken?.address?.toLowerCase() || "";
				const sym = t.baseToken?.symbol?.toLowerCase() || "";
				const name = t.baseToken?.name?.toLowerCase() || "";
				return addr.includes(q) || sym.includes(q) || name.includes(q);
			});
		} catch (err) {
			console.warn("[ServerDiscoveryProvider] search error:", err);
			return [];
		}
	}
	async discoverTokens(mode, _signal, chainId, _forceRefresh) {
		if (mode === "latest") return this.getLatest(chainId);
		return this.getTrending(chainId);
	}
	async searchTokens(query, _signal) {
		return this.search(query);
	}
	async getTokenByAddress(address, chainId, signal) {
		return (await lookupIndexedAddress(address, chainId, signal)).tokens;
	}
	async fetchTelemetry() {
		try {
			const res = await fetch("/api/discovery/stats");
			if (!res.ok) return null;
			return (await res.json()).stats || null;
		} catch {
			return null;
		}
	}
};
var serverDiscoveryProvider = new ServerDiscoveryProvider();
var ArgusProvider = class {
	name = "Argus Launchpad";
	isEnabled = true;
	cachedTokens = [];
	lastFetchTime = 0;
	CACHE_TTL_MS = 1e4;
	async getLaunches(options) {
		const now = Date.now();
		if (this.cachedTokens.length > 0 && now - this.lastFetchTime < this.CACHE_TTL_MS && !options?.portal && !options?.tier && !options?.reusedOnly) return this.cachedTokens;
		try {
			const queryParams = new URLSearchParams();
			if (options?.portal) queryParams.set("portal", options.portal.toString());
			if (options?.tier) queryParams.set("tier", options.tier);
			if (options?.reusedOnly) queryParams.set("reusedOnly", "true");
			const qs = queryParams.toString();
			const url = `/api/argus/launches${qs ? `?${qs}` : ""}`;
			const res = await fetch(url, { signal: options?.signal });
			if (!res.ok) return this.cachedTokens;
			const data = await res.json();
			if (Array.isArray(data.tokens)) {
				if (!options?.portal && !options?.tier && !options?.reusedOnly) {
					this.cachedTokens = data.tokens;
					this.lastFetchTime = now;
				}
				return data.tokens;
			}
			return this.cachedTokens;
		} catch {
			return this.cachedTokens;
		}
	}
	async discoverTokens(_mode, _signal, _chainId, _forceRefresh) {
		return [];
	}
	async searchTokens(query, signal) {
		if (!query) return [];
		try {
			const res = await fetch(`/api/argus/launches?q=${encodeURIComponent(query.trim())}&limit=40`, { signal });
			if (!res.ok) return [];
			const data = await res.json();
			return Array.isArray(data.tokens) ? data.tokens : [];
		} catch {
			return [];
		}
	}
	async getTokenByAddress(address, _chainId, signal) {
		if (!address) return [];
		try {
			const res = await fetch(`/api/argus/launches?address=${encodeURIComponent(address.trim())}&limit=5`, { signal });
			if (!res.ok) return [];
			const data = await res.json();
			return Array.isArray(data.tokens) ? data.tokens : [];
		} catch {
			return [];
		}
	}
	async fetchStats() {
		try {
			const res = await fetch("/api/argus/stats");
			if (!res.ok) return null;
			return (await res.json()).stats || null;
		} catch {
			return null;
		}
	}
};
var argusProvider = new ArgusProvider();
var CANONICAL_TOKEN_LOGOS = {
	"ethereum:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
	"ethereum:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png",
	"ethereum:0xdac17f958d2ee523a2206206994597c13d831ec7": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
	"ethereum:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
	"ethereum:0x6b175474e89094c44da98b954eedeac495271d0f": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png",
	"ethereum:0xae7ab96520de3a18e5e111b5eaab095312d7fe84": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo.png",
	"solana:so11111111111111111111111111111111111111112": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
	"solana:es9vmfrzacerrmjfrf4h2fyd4kconky11mcce8benwnyb": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
	"solana:es9vmfrzacerrmjfrf4h2fyd4kconky11mcce8benwny": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
	"solana:epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
	"bsc:0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
	"bsc:0x55d398326f99059ff775485246999027b3197955": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
	"bsc:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
	"bsc:0x2170ed0880ac9a755fd29b2688956bd959f933f8": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
	"base:0x4200000000000000000000000000000000000006": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
	"base:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
	"polygon:0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
	"polygon:0x7ceb23fd6bc0add59e62ac25578270cff1b9f619": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
	"polygon:0xc2132d05d31c914a87c6611c10748aeb04b58e8f": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
	"polygon:0x3c499c542cef5e3811e1192ce70d8cc03d5c3359": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
	"arbitrum:0x82af49447d8a07e3bd95bd0d56f35241523fbab1": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
	"arbitrum:0xaf88d065e77c8cc2239327c5edb3a432268e5831": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
	"arbitrum:0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
	"avalanche:0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png",
	"avalanche:0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
	"avalanche:0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e": "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png"
};
var CANONICAL_SYMBOL_LOGOS = {
	WETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
	ETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png",
	WBTC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png",
	BTC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png",
	USDT: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
	USDC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
	DAI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png",
	SOL: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
	WSOL: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png",
	BNB: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
	WBNB: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png",
	MATIC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
	WMATIC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
	POL: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png",
	AVAX: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png",
	WAVAX: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchec/info/logo.png"
};
/**
* Returns canonical logo for known assets, or undefined
*/
function getCanonicalTokenLogo(chainId, address, symbol) {
	const normChain = normalizeChainName(chainId);
	const rawAddr = (address || "").trim();
	const normAddr = isEvmAddress$1(rawAddr) ? rawAddr.toLowerCase() : rawAddr.toLowerCase();
	const normSymbol = (symbol || "").toUpperCase().trim();
	if (normAddr && CANONICAL_TOKEN_LOGOS[`${normChain}:${normAddr}`]) return CANONICAL_TOKEN_LOGOS[`${normChain}:${normAddr}`];
	for (const key in CANONICAL_TOKEN_LOGOS) if (key.endsWith(`:${normAddr}`)) return CANONICAL_TOKEN_LOGOS[key];
	if (normSymbol === "SOL" || normSymbol === "ETH" || normSymbol === "BTC") {
		if (CANONICAL_SYMBOL_LOGOS[normSymbol]) return CANONICAL_SYMBOL_LOGOS[normSymbol];
	}
}
var EXCLUDED_TRENDING_ASSETS = {
	stablecoins: [
		"USDT",
		"USDC",
		"DAI",
		"USDE",
		"FDUSD",
		"TUSD",
		"USDS",
		"PYUSD",
		"BUSD",
		"USDD",
		"FRAX",
		"LUSD",
		"CRVUSD",
		"GUSD",
		"EUSD",
		"USDJ",
		"CUSD",
		"USDY",
		"USDC.E",
		"USDT.E"
	],
	wrappedAssets: [
		"WETH",
		"WBTC",
		"WBNB",
		"WMATIC",
		"WAVAX",
		"WSOL",
		"WFTM",
		"WCRO",
		"WONE",
		"WGLMR",
		"WROSE",
		"STETH",
		"WSTETH",
		"RETH",
		"CBETH",
		"WEETH",
		"EZETH",
		"TBTC",
		"SOLVBTC",
		"FBTC"
	],
	majorAssets: [
		"BTC",
		"ETH",
		"SOL",
		"BNB",
		"XRP",
		"ADA",
		"DOGE",
		"TRX",
		"AVAX",
		"LINK",
		"DOT",
		"MATIC",
		"POL",
		"TON",
		"NEAR",
		"SUI",
		"APT",
		"FTM",
		"ATOM",
		"LTC",
		"BCH",
		"SHIB"
	],
	knownAddresses: {
		ethereum: [
			"0xdac17f958d2ee523a2206206994597c13d831ec7",
			"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
			"0x6b175474e89094c44da98b954eedeac495271d0f",
			"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
			"0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
			"0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
			"0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
			"0x4c9edd5852cd905f086c759e8383e09bff1e68b3",
			"0x853d955acef822db058eb8505911ed77f175b99e",
			"0x0000000000085d4780b73119b644ae5ecd22b376",
			"0x6c3ea9036406852006290770bedfcaba0e23a0e8"
		],
		solana: [
			"so11111111111111111111111111111111111111112",
			"es9vmfrzacerrmjfrf4h2fyd4kconky11mcce8benwny",
			"es9vmfrzacerrmjfrf4h2fyd4kconky11mcce8benwnyb",
			"epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v",
			"3nzkpvrwovbkhqbfskv1l9e2a7wff1t3lq8yvvvhcsqq"
		],
		bsc: [
			"0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
			"0x55d398326f99059ff775485246999027b3197955",
			"0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
			"0xe9e7cea3dedca5984780bafc599bd69add087d56",
			"0x2170ed0880ac9a755fd29b2688956bd959f933f8",
			"0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c",
			"0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3"
		],
		base: [
			"0x4200000000000000000000000000000000000006",
			"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
			"0x50c5725949a6f0c72e6c4a641f24049a917db0cb",
			"0x0555e30da8f98308edb960aa94c0db47230d2b9c",
			"0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca",
			"0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22"
		],
		polygon: [
			"0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
			"0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
			"0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
			"0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
			"0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
			"0x1bfd67037b424364057243a194f85de646add3cb",
			"0x8f3cf7ad23cd3cadbd9735aff958023239c6a063"
		],
		arbitrum: [
			"0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
			"0xaf88d065e77c8cc2239327c5edb3a432268e5831",
			"0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
			"0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
			"0x2f2a2543b76a4166549f7aab2e75261276405b9b",
			"0xda10009c23e0b731c0ab5b5ca4948a4729f27d39"
		],
		avalanche: [
			"0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
			"0x49d5c2bd9e8473971fc2ee92554fce074ac02728",
			"0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7",
			"0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
			"0x50b7545627a5162f82a992c33b87adc75187b218"
		]
	}
};
var STABLECOINS_SET = new Set(EXCLUDED_TRENDING_ASSETS.stablecoins.map((s) => s.toUpperCase()));
var WRAPPED_SET = new Set(EXCLUDED_TRENDING_ASSETS.wrappedAssets.map((s) => s.toUpperCase()));
var MAJOR_SET = new Set(EXCLUDED_TRENDING_ASSETS.majorAssets.map((s) => s.toUpperCase()));
var CANONICAL_BASE_NAME_PATTERNS = [
	/^tether\s+usd/i,
	/^usd\s+coin/i,
	/^wrapped\s+(ether|ethereum|bitcoin|btc|bnb|sol|solana|matic|avax|ftm|cro)/i,
	/^dai\s+stablecoin/i,
	/^ethena\s+usde/i,
	/^binance-peg\s+(ethereum|bitcoin|usdt|busd|usdc)/i,
	/^lido\s+staked\s+eth/i,
	/^rocket\s+pool\s+eth/i,
	/^binance\s+bridged/i
];
/**
* Checks if a token is a known established base asset (WETH, USDT, SOL, WBTC, etc.)
* NEVER exclude from search, but deprioritize/exclude from discovery/trending.
*/
function isExcludedTrendingAsset(token) {
	if (!token) return true;
	const chain = normalizeChainName(token.chainId);
	const rawAddress = (token.baseToken?.address || "").toLowerCase().trim();
	const rawSymbol = (token.baseToken?.symbol || "").trim().toUpperCase();
	const rawName = (token.baseToken?.name || "").trim();
	if (rawAddress && EXCLUDED_TRENDING_ASSETS.knownAddresses[chain]) {
		if (EXCLUDED_TRENDING_ASSETS.knownAddresses[chain].includes(rawAddress)) return true;
	}
	for (const c in EXCLUDED_TRENDING_ASSETS.knownAddresses) if (EXCLUDED_TRENDING_ASSETS.knownAddresses[c].includes(rawAddress)) return true;
	if (CANONICAL_BASE_NAME_PATTERNS.some((pattern) => pattern.test(rawName))) return true;
	const isExactStableSymbol = STABLECOINS_SET.has(rawSymbol);
	const isExactWrappedSymbol = WRAPPED_SET.has(rawSymbol);
	const isExactMajorSymbol = MAJOR_SET.has(rawSymbol);
	if (isExactStableSymbol || isExactWrappedSymbol || isExactMajorSymbol) {
		const mcap = Number(token.marketCap || token.fdv || 0);
		const liq = Number(token.liquidity?.usd || token.totalLiquidityUsd || 0);
		if (mcap > 5e7 || liq > 2e6) return true;
		const lowerName = rawName.toLowerCase();
		if (lowerName === "tether" || lowerName === "tether usd" || lowerName === "usd coin" || lowerName === "wrapped ether" || lowerName === "wrapped bitcoin" || lowerName === "wrapped bnb" || lowerName === "wrapped sol" || lowerName === "wrapped solana" || lowerName === "wrapped matic" || lowerName === "dai stablecoin" || lowerName === "dai" || lowerName === "ethereum" || lowerName === "bitcoin" || lowerName === "solana" || lowerName === "binance coin") return true;
		if (liq > 5e5 && (rawName.toUpperCase() === rawSymbol || rawName.length <= 4)) return true;
	}
	if (Number(token.marketCap || token.fdv || 0) > 5e8) return true;
	return false;
}
/**
* Calculates a nuanced social completeness score (0 - 150)
* Evaluates website, Twitter/X, Telegram, Discord, and narrative bio.
* Does NOT hard-delete tokens without socials, but provides a fair quality gradient.
*/
function calculateSocialScore(token) {
	let score = 0;
	const websites = token.info?.websites || [];
	const socials = token.info?.socials || [];
	const hasWebsite = websites.some((w) => w && typeof w.url === "string" && w.url.trim().startsWith("http"));
	const hasTwitter = socials.some((s) => s && typeof s.url === "string" && (s.type === "twitter" || s.type === "x" || s.url.includes("x.com") || s.url.includes("twitter.com")));
	const hasTelegram = socials.some((s) => s && typeof s.url === "string" && (s.type === "telegram" || s.url.includes("t.me") || s.url.includes("telegram")));
	const hasDiscord = socials.some((s) => s && typeof s.url === "string" && (s.type === "discord" || s.url.includes("discord.gg") || s.url.includes("discord.com")));
	if (hasWebsite) score += 35;
	if (hasTwitter) score += 45;
	if (hasTelegram) score += 40;
	if (hasDiscord) score += 20;
	return {
		score,
		hasWebsite,
		hasTwitter,
		hasTelegram,
		hasDiscord,
		totalSocials: socials.length + (hasWebsite ? 1 : 0)
	};
}
function hasSocialLinks(token) {
	if (!token?.info) return false;
	const socials = token.info.socials || [];
	const websites = token.info.websites || [];
	return socials.some((s) => s?.url && s.url.trim() !== "") || websites.some((w) => w?.url && w.url.trim() !== "");
}
function calculateSpamRisk(token) {
	if (!token) return 500;
	let risk = 0;
	const vol = Number(token.volume?.h24 || token.totalVolume24h || 0);
	const liq = Number(token.liquidity?.usd || token.totalLiquidityUsd || 0);
	const mcap = Number(token.marketCap || token.fdv || 0);
	const ageHours = Number(token.tokenAgeHours ?? 24);
	const socialBreakdown = calculateSocialScore(token);
	if (!Boolean(token.info?.imageUrl && !token.info.imageUrl.includes("placeholder")) && socialBreakdown.totalSocials === 0 && liq < 2e3) risk += 120;
	if (ageHours > 1440 && vol < 500) risk += 150;
	if (liq < 300 && vol < 100) risk += 120;
	if ((mcap === 1e3 || mcap >= 990 && mcap <= 1010) && liq === 0 && vol === 0) risk += 300;
	return Math.min(500, risk);
}
function getExactAgeHours(token) {
	if (typeof token.tokenAgeHours === "number") return token.tokenAgeHours;
	if (token.pairCreatedAt && token.pairCreatedAt > 0) {
		const createdMs = token.pairCreatedAt < 1e10 ? token.pairCreatedAt * 1e3 : token.pairCreatedAt;
		return Math.max(0, (Date.now() - createdMs) / 36e5);
	}
}
function calculateTokenQualityScore(token) {
	if (!token) return 0;
	let score = 100;
	const vol = Number(token.volume?.h24 || token.totalVolume24h || 0);
	const liq = Number(token.liquidity?.usd || token.totalLiquidityUsd || 0);
	const ageHours = getExactAgeHours(token);
	const totalTxns = (token.txns?.h24?.buys || 0) + (token.txns?.h24?.sells || 0);
	const logo = token.info?.imageUrl;
	if (logo && !logo.includes("placeholder") && !logo.includes("missing")) score += 80;
	else score -= 40;
	const socialBreakdown = calculateSocialScore(token);
	score += socialBreakdown.score;
	if (socialBreakdown.totalSocials === 0) score -= 60;
	const isExemptFromLowMetricPenalty = Boolean(token.isBondingCurve) || Boolean(token.complete || token.isGraduated || token.marketStage === "pumpswap" || token.primaryDex === "PumpSwap" || token.dexId === "pumpswap");
	if (liq >= 1e5) score += 150;
	else if (liq >= 25e3) score += 120;
	else if (liq >= 5e3) score += 80;
	else if (liq >= 1e3) score += 40;
	else if (liq < 500 && !isExemptFromLowMetricPenalty) score -= 30;
	if (vol > 1e6) score += 180;
	else if (vol > 1e5) score += 140;
	else if (vol > 1e4) score += 100;
	else if (vol > 1e3) score += 60;
	else if (vol < 300 && !isExemptFromLowMetricPenalty) score -= 40;
	if (liq > 0 && vol > 0) {
		const v2l = vol / liq;
		if (v2l >= 1 && v2l <= 15) score += 60;
		else if (v2l > 15) score += 40;
	}
	if (totalTxns > 500) score += 60;
	else if (totalTxns > 50) score += 30;
	if (token.sources && token.sources.length > 1) score += Math.min(60, token.sources.length * 20);
	if (ageHours !== void 0 && ageHours > 720) {
		if (vol < 1e3) score -= 100;
		else if (vol > 5e4) score += 50;
	}
	const spamRisk = calculateSpamRisk(token);
	score -= Math.round(spamRisk * .5);
	return Math.max(0, Math.min(1e3, score));
}
function calculateDiscoveryScore(token, mode = "trending") {
	if (!token) return 0;
	let score = 100;
	const mcap = Number(token.marketCap || token.fdv || 0);
	const vol24 = Number(token.volume?.h24 || token.totalVolume24h || 0);
	const vol6h = Number(token.volume?.h6 || 0);
	const vol1h = Number(token.volume?.h1 || 0);
	const vol5m = Number(token.volume?.m5 || 0);
	Number(token.liquidity?.usd || token.totalLiquidityUsd || 0);
	const priceChange24h = Number(token.priceChange?.h24 || 0);
	const ageHours = getExactAgeHours(token);
	if (mode === "fresh_mints") {
		if (ageHours !== void 0) {
			if (ageHours < 2) score += 250;
			else if (ageHours < 6) score += 200;
			else if (ageHours < 24) score += 120;
		} else score += 100;
		if (vol24 > 1e4) score += 150;
		else if (vol24 > 1e3) score += 100;
		else if (vol24 > 200) score += 50;
		else if (token.isBondingCurve || token.complete || token.isGraduated || token.marketStage === "pumpswap") {
			const isCompleteOrGraduated = Boolean(token.complete || token.isGraduated || token.marketStage === "pumpswap");
			const progress = Number(token.bondingProgress || 0);
			if (isCompleteOrGraduated || progress >= 100) score += 120;
			else if (progress > 40) score += 100;
			else if (progress > 15) score += 60;
			else if (progress > 5) score += 30;
		}
		if (token.launchPlatform === "Pump.fun") score += 100;
		if (hasSocialLinks(token)) score += 60;
		return Math.max(0, Math.min(1e3, score));
	}
	if (vol24 >= 500) {
		if (mcap >= 5e3 && mcap <= 5e5) score += 180;
		else if (mcap > 5e5 && mcap <= 5e6) score += 150;
		else if (mcap > 5e6 && mcap <= 3e7) score += 90;
		else if (mcap < 5e3 && mcap > 500) score += 90;
	}
	if (priceChange24h > 100) score += 120;
	else if (priceChange24h > 20) score += 80;
	else if (priceChange24h > 0) score += 40;
	if (vol5m > 5e3) score += 120;
	else if (vol5m > 1e3) score += 70;
	else if (vol5m > 100) score += 30;
	if (vol1h > 25e3) score += 140;
	else if (vol1h > 5e3) score += 90;
	else if (vol1h > 500) score += 40;
	if (vol6h > 5e4) score += 80;
	else if (vol6h > 1e4) score += 50;
	if (vol24 > 1e5) score += 120;
	else if (vol24 > 2e4) score += 80;
	else if (vol24 > 2e3) score += 40;
	const buysH1 = Number(token.txns?.h1?.buys || 0);
	const sellsH1 = Number(token.txns?.h1?.sells || 0);
	if (buysH1 + sellsH1 > 50) score += 80;
	else if (buysH1 + sellsH1 > 10) score += 40;
	if (buysH1 > sellsH1 && buysH1 >= 5) score += 40;
	if (token.isBoosted || token.boostAmount) {
		const boostCount = Number(token.boostAmount || 1);
		score += Math.min(220, 90 + boostCount * 5);
	}
	if (normalizeChainName(token.chainId) === "robinhood") score += 85;
	if (ageHours !== void 0) {
		if (ageHours < 6 && vol24 > 500) score += 150;
		else if (ageHours < 24 && vol24 > 500) score += 100;
		else if (ageHours < 168 && vol24 > 500) score += 40;
		else if (ageHours > 720) score -= 500;
		else if (ageHours > 168) score -= 350;
	}
	if (vol24 === 0 && vol1h === 0) score -= 400;
	return Math.max(0, Math.min(1e3, score));
}
function classifyToken(token, mode = "trending") {
	if (!token) return {
		tier: "TIER_D",
		tierLabel: "Low Data",
		category: "LOW_METADATA",
		tokenQualityScore: 0,
		discoveryScore: 0,
		finalScore: 0,
		spamRisk: 500
	};
	const isEstablished = isExcludedTrendingAsset(token);
	const qualityScore = calculateTokenQualityScore(token);
	const discoveryScore = calculateDiscoveryScore(token, mode);
	const momentumScore = Number(token.momentumScore || 0);
	const spamRisk = calculateSpamRisk(token);
	let finalScore = Math.round(qualityScore * .45 + discoveryScore * .4 + momentumScore * 10 * .15 - spamRisk * .2);
	if (isEstablished) {
		finalScore = Math.max(0, finalScore - 500);
		return {
			tier: "TIER_E",
			tierLabel: "Base Asset",
			category: "ESTABLISHED_ASSET",
			tokenQualityScore: qualityScore,
			discoveryScore,
			finalScore,
			spamRisk
		};
	}
	let tier = "TIER_C";
	let tierLabel = "Average";
	let category = "AVERAGE";
	if (finalScore >= 650 && hasSocialLinks(token)) {
		tier = "TIER_A";
		tierLabel = "Top Discovery";
		category = "HIGH_QUALITY";
	} else if (finalScore >= 450) {
		tier = "TIER_B";
		tierLabel = "Emerging";
		category = "EMERGING";
	} else if (finalScore >= 250) {
		tier = "TIER_C";
		tierLabel = "Average";
		category = "AVERAGE";
	} else {
		tier = "TIER_D";
		tierLabel = "Low Activity";
		category = "LOW_ACTIVITY";
	}
	return {
		tier,
		tierLabel,
		category,
		tokenQualityScore: qualityScore,
		discoveryScore,
		finalScore,
		spamRisk
	};
}
function calculateFinalDexHunterScore(token, mode = "trending") {
	return classifyToken(token, mode).finalScore;
}
var providers = [
	serverDiscoveryProvider,
	argusProvider,
	new DexScreenerProvider(),
	new NativeEvmDexProvider(),
	new PumpFunProvider(),
	new OnChainProvider(),
	new SolanaRPCProvider(),
	new SolanaDexProvider()
];
var cacheMap = /* @__PURE__ */ new Map();
var DEFAULT_CACHE_TTL_MS = 15e3;
function getCached(key) {
	const entry = cacheMap.get(key);
	if (!entry) return null;
	const ttl = entry.ttl || DEFAULT_CACHE_TTL_MS;
	if (Date.now() - entry.timestamp > ttl) {
		cacheMap.delete(key);
		return null;
	}
	return entry.data;
}
function setCache(key, data, ttl = DEFAULT_CACHE_TTL_MS) {
	cacheMap.set(key, {
		data,
		timestamp: Date.now(),
		ttl
	});
}
function getDEXDisplayName(dexId) {
	if (!dexId) return "DEX";
	const normalized = normalizeDexName(dexId);
	return normalized === "Unknown" ? "DEX" : normalized;
}
function is1kMarketCap(pair) {
	if (!pair) return false;
	if (pair.isBondingCurve || pair.isGraduated || Boolean(pair.complete) || pair.bondingCurvePda || pair.launchPlatform === "Pump.fun" || pair.dexId === "pumpswap" || pair.primaryDex === "PumpSwap" || pair.marketStage === "pumpswap" || pair.marketStage === "graduated" || pair.dexId === "orca" || pair.primaryDex === "Orca" || pair.dexId === "meteora" || pair.primaryDex === "Meteora" || pair.dexId === "raydium" || pair.primaryDex === "Raydium" || pair.sources?.some((s) => [
		"pumpswap",
		"orca",
		"meteora",
		"raydium"
	].includes(s.toLowerCase())) || pair.dexes?.some((d) => [
		"pumpswap",
		"orca",
		"meteora",
		"raydium"
	].includes(d.toLowerCase())) || isPumpSwapCandidate(pair)) return false;
	const mc = Number(pair.marketCap || pair.fdv || 0);
	const liq = Number(pair.liquidity?.usd || pair.totalLiquidityUsd || 0);
	const vol = Number(pair.volume?.h24 || pair.totalVolume24h || 0);
	if ((mc === 1e3 || mc >= 990 && mc <= 1010) && liq === 0 && vol === 0) return true;
	return false;
}
function isGenericName(name) {
	if (!name) return true;
	const n = name.trim();
	if (n === "" || n === "N/A" || n === "Unknown" || n === "undefined" || n === "null") return true;
	if (/^Pump Token\b/i.test(n)) return true;
	if (/^Solana Token\b/i.test(n)) return true;
	if (/^Token\s+[0-9a-zA-Z]{4,}/i.test(n)) return true;
	return false;
}
function isGenericSymbol(symbol) {
	if (!symbol) return true;
	const s = symbol.trim().toUpperCase();
	if (s === "" || s === "N/A" || s === "UNKNOWN" || s === "TOKEN" || s === "NULL" || s === "UNDEFINED") return true;
	if (s === "PUMP" || s === "SOL") return true;
	return false;
}
function isRealImageUrl(url) {
	if (!url || typeof url !== "string") return false;
	const clean = url.trim();
	if (clean === "" || clean === "null" || clean === "undefined") return false;
	if (clean.includes("dd.dexscreener.com/ds-data/tokens/")) return false;
	return true;
}
function isValidHttpUrl(url) {
	if (!url || typeof url !== "string") return false;
	const clean = url.trim();
	if (clean === "" || clean === "null" || clean === "undefined") return false;
	return clean.startsWith("http://") || clean.startsWith("https://");
}
function calculateCanonicalScore(pair) {
	let score = 0;
	if (!isGenericName(pair.baseToken?.name)) score += 150;
	if (!isGenericSymbol(pair.baseToken?.symbol)) score += 150;
	if (isRealImageUrl(pair.info?.imageUrl)) score += 200;
	else if (pair.info?.imageUrl) score += 50;
	if (pair.info?.websites && pair.info.websites.length > 0) score += 100;
	if (pair.info?.socials && pair.info.socials.length > 0) score += 100;
	const normDex = normalizeDexName(pair.dexId || pair.primaryDex);
	if (normDex === "PumpSwap" || normDex === "Orca" || normDex === "Meteora" || normDex === "Raydium") {
		score += 150;
		if (normDex === "PumpSwap") score += 100;
	}
	if (pair.isGraduated || pair.marketStage === "pumpswap" || pair.marketStage === "graduated" || Boolean(pair.complete)) score += 150;
	if (pair.bondingCurvePda) score += 60;
	if (pair.primaryProvider === "Pump.fun" || pair.launchPlatform === "Pump.fun") score += 60;
	const liq = Number(pair.liquidity?.usd || pair.totalLiquidityUsd || 0);
	const vol = Number(pair.volume?.h24 || pair.totalVolume24h || 0);
	score += Math.min(liq / 500, 150);
	score += Math.min(vol / 1e3, 150);
	return score;
}
var SOLANA_QUOTE_MINTS = /* @__PURE__ */ new Set([
	"so11111111111111111111111111111111111111112",
	"epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v",
	"es9vmfrzacerrmjfrf4h2fyd4kconky11mcce8benwny",
	"es9vmfrzacerrmjfrf4h2fyd4kconky11mcce8benwnyb",
	"usdh1sm1ojcxkgzsq8mdtxgiqxdcntnhntfhnmmtz2w",
	"usdswr9apdhk5bvjkmjzff41tptr8auuhqgydqiskpt",
	"7kbnvu9pljmxkdpbv9pquzvdgcvpkvky7vcvqev8pump"
]);
function deduplicateAndMergeTokens(rawPairs) {
	const groupsMap = /* @__PURE__ */ new Map();
	for (const pair of rawPairs) {
		if (!pair) continue;
		if (is1kMarketCap(pair)) continue;
		const rawMint = pair.mint || pair.tokenAddress || pair.contractAddress;
		let baseAddr = pair.baseToken?.address;
		const quoteAddr = pair.quoteToken?.address;
		if (baseAddr && SOLANA_QUOTE_MINTS.has(baseAddr.toLowerCase().trim()) && quoteAddr && !SOLANA_QUOTE_MINTS.has(quoteAddr.toLowerCase().trim())) {
			const tempToken = pair.baseToken;
			pair.baseToken = pair.quoteToken;
			pair.quoteToken = tempToken;
			baseAddr = quoteAddr;
		}
		const rawAddr = rawMint || baseAddr || pair.address || (pair.pairAddress && !SOLANA_QUOTE_MINTS.has(pair.pairAddress.toLowerCase().trim()) ? pair.pairAddress : "");
		if (!rawAddr) continue;
		const chain = normalizeChainName(pair.chainId, typeof rawAddr === "string" ? rawAddr : void 0, pair.url);
		const addr = formatTokenAddress(rawAddr, chain);
		if (!addr) continue;
		if (!pair.baseToken) pair.baseToken = {
			address: addr,
			name: pair.name || pair.tokenName || "Token",
			symbol: pair.symbol || pair.tokenSymbol || "TOKEN"
		};
		else pair.baseToken.address = addr;
		pair.chainId = chain;
		const key = getCanonicalCompositeKey(chain, addr);
		if (!groupsMap.has(key)) groupsMap.set(key, []);
		groupsMap.get(key).push(pair);
	}
	const canonicalResults = [];
	groupsMap.forEach((pairsGroup) => {
		if (pairsGroup.length === 0) return;
		if (pairsGroup.every((p) => is1kMarketCap(p))) return;
		pairsGroup.sort((a, b) => {
			const aIsPS = isPumpSwapCandidate(a) || normalizeDexName(a.dexId || a.primaryDex) === "PumpSwap" || a.marketStage === "pumpswap";
			const bIsPS = isPumpSwapCandidate(b) || normalizeDexName(b.dexId || b.primaryDex) === "PumpSwap" || b.marketStage === "pumpswap";
			const aVol = Number(a.volume?.h24 || a.totalVolume24h || 0);
			const bVol = Number(b.volume?.h24 || b.totalVolume24h || 0);
			const aLiq = Number(a.liquidity?.usd || a.totalLiquidityUsd || 0);
			const bLiq = Number(b.liquidity?.usd || b.totalLiquidityUsd || 0);
			const aNormDex = normalizeDexName(a.dexId || a.primaryDex);
			const bNormDex = normalizeDexName(b.dexId || b.primaryDex);
			const aIsMarket = aNormDex === "PumpSwap" || aNormDex === "Orca" || aNormDex === "Meteora" || aNormDex === "Raydium";
			const bIsMarket = bNormDex === "PumpSwap" || bNormDex === "Orca" || bNormDex === "Meteora" || bNormDex === "Raydium";
			const aHasMarket = (aVol > 0 || aLiq > 0) && aIsMarket;
			const bHasMarket = (bVol > 0 || bLiq > 0) && bIsMarket;
			if (aIsPS !== bIsPS) return aIsPS ? -1 : 1;
			if (aHasMarket !== bHasMarket) return aHasMarket ? -1 : 1;
			const aGrad = Boolean(a.isGraduated || a.marketStage === "graduated" || a.marketStage === "pumpswap" || a.complete);
			if (aGrad !== Boolean(b.isGraduated || b.marketStage === "graduated" || b.marketStage === "pumpswap" || b.complete)) return aGrad ? -1 : 1;
			if (bVol !== aVol) return bVol - aVol;
			if (bLiq !== aLiq) return bLiq - aLiq;
			const timeA = Number(a.providerFetchTimestamp || a.lastRefreshedAt || a.pairCreatedAt || 0);
			const timeB = Number(b.providerFetchTimestamp || b.lastRefreshedAt || b.pairCreatedAt || 0);
			if (timeB !== timeA) return timeB - timeA;
			return calculateCanonicalScore(b) - calculateCanonicalScore(a);
		});
		const primary = { ...pairsGroup[0] };
		if (is1kMarketCap(primary)) return;
		const isSolana = isSolanaToken(primary) || normalizeChainName(primary.chainId) === "solana";
		const sourcesSet = /* @__PURE__ */ new Set();
		const dexesSet = /* @__PURE__ */ new Set();
		const normalizedPairsMap = /* @__PURE__ */ new Map();
		let aggregatedLiquidity = 0;
		let aggregatedVolume = 0;
		let isPumpFunToken = isSolana && Boolean(primary.launchPlatform === "Pump.fun" || primary.url?.includes("pump.fun") || primary.primaryProvider === "Pump.fun" || primary.bondingCurvePda);
		const websitesMap = /* @__PURE__ */ new Map();
		const socialsMap = /* @__PURE__ */ new Map();
		if (primary.info?.websites) {
			for (const w of primary.info.websites) if (w?.url && isValidHttpUrl(w.url)) websitesMap.set(w.url.toLowerCase(), w);
		}
		if (primary.info?.socials) {
			for (const s of primary.info.socials) if (s?.url && isValidHttpUrl(s.url)) socialsMap.set(s.url.toLowerCase(), s);
		}
		let bestImageUrl = isRealImageUrl(primary.info?.imageUrl) ? primary.info.imageUrl : void 0;
		let bestDescription = primary.info?.description || "";
		for (const p of pairsGroup) {
			const normP = normalizePair(p, p.primaryProvider || "Aggregator");
			const pairKey = `${normP.dexName}:${normP.pairAddress || normP.baseToken.address}`;
			if (!normalizedPairsMap.has(pairKey)) normalizedPairsMap.set(pairKey, normP);
			if (isSolana && (p.launchPlatform === "Pump.fun" || p.url?.includes("pump.fun") || p.primaryProvider === "Pump.fun" || p.bondingCurvePda || p.dexId && p.dexId.toLowerCase() === "pumpfun")) isPumpFunToken = true;
			const dName = normalizeDexName(p.dexId || normP.dexName);
			if (dName && dName !== "Unknown") {
				if (!isLaunchPlatformOnly(dName)) {
					if (dName !== "PumpSwap" || isSolana) dexesSet.add(dName);
				}
				if (dName !== "PumpSwap" || isSolana) sourcesSet.add(dName);
			}
			if (p.primaryProvider) sourcesSet.add(p.primaryProvider);
			if (p.sources) for (const s of p.sources) {
				const sNorm = normalizeDexName(s);
				if (sNorm && sNorm !== "Unknown") {
					if (!isLaunchPlatformOnly(sNorm)) {
						if (sNorm !== "PumpSwap" || isSolana) dexesSet.add(sNorm);
					}
					if (sNorm !== "PumpSwap" || isSolana) sourcesSet.add(sNorm);
				} else sourcesSet.add(s);
			}
			const pHasUsd = Number(p.priceUsd) > 0 || p.volumeComplete === true;
			const pLiq = pHasUsd ? Number(p.liquidity?.usd || 0) : 0;
			const pVol = pHasUsd ? Number(p.volume?.h24 || 0) : 0;
			if (pLiq > aggregatedLiquidity) aggregatedLiquidity = pLiq;
			if (pVol > aggregatedVolume) aggregatedVolume = pVol;
			const primaryPriceNum = Number(primary.priceUsd) || 0;
			const pPriceNum = Number(p.priceUsd) || 0;
			if (primaryPriceNum === 0 && pPriceNum > 0) {
				primary.priceUsd = String(p.priceUsd);
				if (p.priceNative) primary.priceNative = p.priceNative;
			}
			if ((!primary.priceChange?.h24 || primary.priceChange.h24 === 0) && p.priceChange?.h24) primary.priceChange = p.priceChange;
			const candidateTimes = [];
			const addCandidateTs = (val) => {
				if (!val) return;
				const n = typeof val === "string" ? Number(val) || new Date(val).getTime() : Number(val);
				if (!isNaN(n) && n > 0) candidateTimes.push(n < 1e10 ? n * 1e3 : n);
			};
			addCandidateTs(primary.pairCreatedAt);
			addCandidateTs(p.pairCreatedAt);
			if (Array.isArray(primary.pairs)) for (const pr of primary.pairs) addCandidateTs(pr.pairCreatedAt);
			if (Array.isArray(p.pairs)) for (const pr of p.pairs) addCandidateTs(pr.pairCreatedAt);
			if (candidateTimes.length > 0) primary.pairCreatedAt = Math.min(...candidateTimes);
			if (isGenericName(primary.baseToken?.name) && !isGenericName(p.baseToken?.name)) {
				if (!primary.baseToken) primary.baseToken = {
					address: p.baseToken?.address || primary.pairAddress || "",
					name: p.baseToken.name,
					symbol: p.baseToken?.symbol || "TOKEN"
				};
				else primary.baseToken.name = p.baseToken.name;
			}
			if (isGenericSymbol(primary.baseToken?.symbol) && !isGenericSymbol(p.baseToken?.symbol)) {
				if (!primary.baseToken) primary.baseToken = {
					address: p.baseToken?.address || primary.pairAddress || "",
					name: p.baseToken?.name || "Token",
					symbol: p.baseToken.symbol
				};
				else primary.baseToken.symbol = p.baseToken.symbol;
			}
			if (p.info?.imageUrl) {
				if (isRealImageUrl(p.info.imageUrl)) {
					const isPumpFunCandidate = p.primaryProvider === "Pump.fun" || p.launchPlatform === "Pump.fun" || Boolean(p.bondingCurvePda);
					if (!bestImageUrl || !isRealImageUrl(bestImageUrl)) bestImageUrl = p.info.imageUrl;
					else if (isPumpFunCandidate) bestImageUrl = p.info.imageUrl;
				} else if (!bestImageUrl) bestImageUrl = p.info.imageUrl;
			}
			const candidateWebsites = [...p.info?.websites || []];
			const directWeb = p.website || p.web || p.website_url;
			if (directWeb && typeof directWeb === "string" && !candidateWebsites.some((w) => w.url === directWeb)) candidateWebsites.push({
				type: "website",
				label: "Website",
				url: directWeb
			});
			if (Array.isArray(p.websites)) {
				for (const w of p.websites) if (w?.url) candidateWebsites.push(w);
				else if (typeof w === "string") candidateWebsites.push({
					type: "website",
					label: "Website",
					url: w
				});
			}
			if (p.links?.website) candidateWebsites.push({
				type: "website",
				label: "Website",
				url: p.links.website
			});
			if (p.socials?.website) candidateWebsites.push({
				type: "website",
				label: "Website",
				url: p.socials.website
			});
			const candidateSocials = [...p.info?.socials || []];
			const directTg = p.telegram || p.tg || p.telegram_url;
			if (directTg && typeof directTg === "string") {
				const clean = directTg.trim().replace(/^@/, "");
				const url = clean.startsWith("http") ? clean : `https://t.me/${clean}`;
				candidateSocials.push({
					type: "telegram",
					url
				});
			}
			const directTw = p.twitter || p.x || p.twitter_url || p.x_url;
			if (directTw && typeof directTw === "string") {
				const url = preserveXUrl(directTw);
				if (url) candidateSocials.push({
					type: "twitter",
					url
				});
			}
			const directDisc = p.discord || p.discord_url;
			if (directDisc && typeof directDisc === "string") {
				const clean = directDisc.trim();
				const url = clean.startsWith("http") ? clean : `https://${clean}`;
				candidateSocials.push({
					type: "discord",
					url
				});
			}
			if (Array.isArray(p.socials)) {
				for (const s of p.socials) if (s?.url) candidateSocials.push(s);
			} else if (p.socials && typeof p.socials === "object") {
				const obj = p.socials;
				if (obj.twitter || obj.x) candidateSocials.push({
					type: "twitter",
					url: obj.twitter || obj.x
				});
				if (obj.telegram || obj.tg) candidateSocials.push({
					type: "telegram",
					url: obj.telegram || obj.tg
				});
				if (obj.discord) candidateSocials.push({
					type: "discord",
					url: obj.discord
				});
			}
			if (Array.isArray(p.links)) {
				for (const l of p.links) if (l?.url) candidateSocials.push(l);
			} else if (p.links && typeof p.links === "object") {
				const obj = p.links;
				if (obj.twitter || obj.x) candidateSocials.push({
					type: "twitter",
					url: obj.twitter || obj.x
				});
				if (obj.telegram || obj.tg) candidateSocials.push({
					type: "telegram",
					url: obj.telegram || obj.tg
				});
				if (obj.discord) candidateSocials.push({
					type: "discord",
					url: obj.discord
				});
			}
			for (const w of candidateWebsites) if (w?.url && typeof w.url === "string") {
				const raw = w.url.trim();
				if (!raw || raw === "null" || raw === "undefined") continue;
				const cleanUrl = raw.startsWith("http") ? raw : `https://${raw}`;
				const lower = cleanUrl.toLowerCase();
				if (lower.includes("twitter.com") || lower.includes("x.com") || lower.includes("t.me") || lower.includes("telegram") || lower.includes("discord")) candidateSocials.push({
					type: "link",
					url: cleanUrl
				});
				else if (isValidHttpUrl(cleanUrl)) websitesMap.set(cleanUrl.toLowerCase(), {
					type: w.type || "website",
					label: w.label || "Website",
					url: cleanUrl
				});
			}
			for (const s of candidateSocials) if (s?.url && typeof s.url === "string") {
				const raw = s.url.trim();
				if (!raw || raw === "null" || raw === "undefined") continue;
				const cleanUrl = raw.startsWith("http") ? raw : `https://${raw}`;
				if (isValidHttpUrl(cleanUrl)) {
					const lower = cleanUrl.toLowerCase();
					let sType = s.type || "link";
					if (!s.type || s.type === "link") {
						if (lower.includes("twitter.com") || lower.includes("x.com")) sType = "twitter";
						else if (lower.includes("t.me") || lower.includes("telegram")) sType = "telegram";
						else if (lower.includes("discord")) sType = "discord";
					}
					if (sType === "link" && !lower.includes("twitter.com") && !lower.includes("x.com") && !lower.includes("t.me") && !lower.includes("telegram") && !lower.includes("discord")) websitesMap.set(cleanUrl.toLowerCase(), {
						type: "website",
						label: "Website",
						url: cleanUrl
					});
					else socialsMap.set(cleanUrl.toLowerCase(), {
						type: sType,
						url: cleanUrl
					});
				}
			}
			const candidateDesc = p.info?.description || p.description;
			if (candidateDesc && typeof candidateDesc === "string" && candidateDesc.trim()) {
				if (!bestDescription || candidateDesc.length > bestDescription.length && (p.primaryProvider === "Pump.fun" || p.launchPlatform === "Pump.fun")) bestDescription = candidateDesc.trim();
			}
			const pMcap = Number(p.marketCap || p.fdv || 0);
			if (pMcap > Number(primary.marketCap || primary.fdv || 0)) {
				primary.marketCap = pMcap;
				primary.fdv = pMcap;
			}
			if (p.bondingCurvePda) primary.bondingCurvePda = p.bondingCurvePda;
			if (typeof p.bondingProgress === "number") primary.bondingProgress = Math.max(primary.bondingProgress || 0, p.bondingProgress);
			if (p.creator) primary.creator = p.creator;
			if (p.realSolReservesFormatted) primary.realSolReservesFormatted = p.realSolReservesFormatted;
			if (p.virtualTokenReserves) primary.virtualTokenReserves = p.virtualTokenReserves;
			if (p.virtualSolReserves) primary.virtualSolReserves = p.virtualSolReserves;
			if (p.realTokenReserves) primary.realTokenReserves = p.realTokenReserves;
			if (p.realSolReserves) primary.realSolReserves = p.realSolReserves;
			if (p.tokenTotalSupply) primary.tokenTotalSupply = p.tokenTotalSupply;
		}
		const allDiscoveredPairs = Array.from(normalizedPairsMap.values());
		primary.pairs = allDiscoveredPairs;
		const normChain = normalizeChainName(primary.chainId);
		const chainPriority = DEX_PRIORITY[normChain] || [];
		const sortDexVenues = (list) => {
			return [...list].sort((a, b) => {
				const aLower = a.toLowerCase();
				const bLower = b.toLowerCase();
				if (aLower.includes("pumpswap") && bLower.includes("raydium")) return -1;
				if (bLower.includes("pumpswap") && aLower.includes("raydium")) return 1;
				const rankA = chainPriority.findIndex((d) => d.toLowerCase() === aLower);
				const rankB = chainPriority.findIndex((d) => d.toLowerCase() === bLower);
				if (rankA !== -1 && rankB !== -1) return rankA - rankB;
				if (rankA !== -1) return -1;
				if (rankB !== -1) return 1;
				return a.localeCompare(b);
			});
		};
		primary.dexes = sortDexVenues(Array.from(dexesSet));
		primary.sources = sortDexVenues(Array.from(sourcesSet));
		if (isPumpFunToken) primary.launchPlatform = "Pump.fun";
		if (allDiscoveredPairs.length > 0) {
			primary.highestLiquidityPair = [...allDiscoveredPairs].sort((a, b) => (b.liquidityUsd || 0) - (a.liquidityUsd || 0))[0];
			primary.highestVolumePair = [...allDiscoveredPairs].sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))[0];
		}
		const hasPumpSwapAvailability = primary.launchPlatform === "Pump.fun" && (primary.isGraduated || primary.marketStage === "pumpswap" || primary.marketStage === "graduated") || primary.dexes.some((d) => d.toLowerCase().includes("pumpswap")) || primary.sources.some((s) => s.toLowerCase().includes("pumpswap")) || allDiscoveredPairs.some((pr) => (pr.dexName || pr.dexId || "").toLowerCase().includes("pumpswap")) || pairsGroup.some((p) => p.dexId === "pumpswap" || p.primaryDex === "PumpSwap" || p.marketStage === "pumpswap" || p.sources && p.sources.some((s) => s.toLowerCase().includes("pumpswap")));
		const isGraduatedToken = pairsGroup.some((p) => Boolean(p.isGraduated || p.marketStage === "graduated" || p.marketStage === "pumpswap" || typeof p.bondingProgress === "number" && p.bondingProgress >= 100 || hasPumpSwapAvailability));
		if (isGraduatedToken) {
			primary.isGraduated = true;
			primary.isBondingCurve = false;
			primary.bondingProgress = 100;
			primary.marketStage = hasPumpSwapAvailability ? "pumpswap" : primary.marketStage && primary.marketStage !== "bonding_curve" ? primary.marketStage : "graduated";
		} else {
			primary.isBondingCurve = Boolean(primary.bondingCurvePda || primary.launchPlatform === "Pump.fun");
			primary.isGraduated = false;
			if (!primary.marketStage) primary.marketStage = "bonding_curve";
		}
		const activeMarketPool = [...pairsGroup].filter((p) => {
			const d = normalizeDexName(p.dexId || p.primaryDex);
			return d === "PumpSwap" || d === "Orca" || d === "Meteora" || d === "Raydium";
		}).sort((a, b) => {
			const aIsPS = normalizeDexName(a.dexId || a.primaryDex) === "PumpSwap";
			if (aIsPS !== (normalizeDexName(b.dexId || b.primaryDex) === "PumpSwap")) return aIsPS ? -1 : 1;
			const aVol = Number(a.volume?.h24 || a.totalVolume24h || 0);
			const bVol = Number(b.volume?.h24 || b.totalVolume24h || 0);
			if (bVol !== aVol) return bVol - aVol;
			const aLiq = Number(a.liquidity?.usd || a.totalLiquidityUsd || 0);
			return Number(b.liquidity?.usd || b.totalLiquidityUsd || 0) - aLiq;
		})[0];
		if (activeMarketPool) {
			if (activeMarketPool.pairAddress) primary.pairAddress = activeMarketPool.pairAddress;
			if (activeMarketPool.priceUsd && Number(activeMarketPool.priceUsd) > 0) primary.priceUsd = String(activeMarketPool.priceUsd);
			if (activeMarketPool.priceNative) primary.priceNative = activeMarketPool.priceNative;
			if (activeMarketPool.priceChange) primary.priceChange = activeMarketPool.priceChange;
			if (activeMarketPool.volume) primary.volume = activeMarketPool.volume;
			if (activeMarketPool.totalVolume24h !== void 0) primary.totalVolume24h = activeMarketPool.totalVolume24h;
			if (activeMarketPool.liquidity) primary.liquidity = activeMarketPool.liquidity;
			if (activeMarketPool.totalLiquidityUsd !== void 0) primary.totalLiquidityUsd = activeMarketPool.totalLiquidityUsd;
			if (activeMarketPool.url && (!primary.url || primary.url.includes("pump.fun"))) primary.url = activeMarketPool.url;
			if (activeMarketPool.primaryDexTradingUrl) primary.primaryDexTradingUrl = activeMarketPool.primaryDexTradingUrl;
		}
		if (hasPumpSwapAvailability) {
			primary.primaryDex = "PumpSwap";
			primary.dexId = "pumpswap";
			if (!dexesSet.has("PumpSwap")) dexesSet.add("PumpSwap");
			if (!sourcesSet.has("PumpSwap")) sourcesSet.add("PumpSwap");
		} else {
			primary.primaryDex = selectPrimaryDex(primary);
			if (primary.primaryDex === "Raydium" && isPumpFunToken && isGraduatedToken) primary.primaryDex = "PumpSwap";
		}
		if (primary.primaryDex === "Raydium" && hasPumpSwapAvailability) primary.primaryDex = "PumpSwap";
		if (primary.primaryDex) primary.dexId = primary.primaryDex.toLowerCase().replace(/[^a-z0-9]/g, "");
		else if (primary.launchPlatform === "Pump.fun") primary.dexId = "pumpfun";
		const representativeDexOrPlatform = primary.primaryDex || (primary.launchPlatform === "Pump.fun" ? "Pump.fun" : primary.dexId);
		primary.primaryDexLogo = getDexLogo(representativeDexOrPlatform);
		primary.primaryDexTradingUrl = getDexTradingUrl(primary, primary.primaryDex);
		const hasAggLiq = aggregatedLiquidity > 0;
		const hasPrimaryLiq = primary.liquidity?.usd !== void 0 && primary.liquidity.usd > 0;
		const finalLiq = hasAggLiq ? aggregatedLiquidity : hasPrimaryLiq ? primary.liquidity.usd : primary.totalLiquidityUsd !== void 0 ? primary.totalLiquidityUsd : void 0;
		primary.totalLiquidityUsd = finalLiq;
		if (finalLiq !== void 0) primary.liquidity = {
			...primary.liquidity || {},
			usd: finalLiq
		};
		const hasAggVol = aggregatedVolume > 0;
		const hasPrimaryVol = primary.volume?.h24 !== void 0;
		const finalVol = hasAggVol ? aggregatedVolume : hasPrimaryVol ? primary.volume.h24 : primary.totalVolume24h !== void 0 ? primary.totalVolume24h : void 0;
		primary.totalVolume24h = finalVol;
		if (finalVol !== void 0) primary.volume = {
			...primary.volume || {},
			h24: finalVol
		};
		primary.info = primary.info || {};
		primary.info.websites = Array.from(websitesMap.values());
		primary.info.socials = Array.from(socialsMap.values());
		if (bestDescription) primary.info.description = bestDescription;
		const tgEntry = primary.info.socials.find((s) => s.type === "telegram" || s.type === "tg");
		const twEntry = primary.info.socials.find((s) => s.type === "twitter" || s.type === "x");
		const discordEntry = primary.info.socials.find((s) => s.type === "discord");
		const webEntry = primary.info.websites[0];
		if (tgEntry?.url) primary.telegram = tgEntry.url;
		if (twEntry?.url) primary.twitter = twEntry.url;
		if (discordEntry?.url) primary.discord = discordEntry.url;
		if (webEntry?.url) primary.website = webEntry.url;
		const canonicalLogo = getCanonicalTokenLogo(primary.chainId, primary.baseToken?.address, primary.baseToken?.symbol);
		if (canonicalLogo) primary.info.imageUrl = canonicalLogo;
		else if (bestImageUrl) primary.info.imageUrl = bestImageUrl;
		else if (!primary.info?.imageUrl && primary.baseToken?.address) {
			const normChain = (primary.chainId || "solana").toLowerCase() === "polygon_pos" ? "polygon" : (primary.chainId || "solana").toLowerCase();
			primary.info.imageUrl = `https://dd.dexscreener.com/ds-data/tokens/${normChain}/${primary.baseToken.address}.png`;
		}
		if (primary.pairCreatedAt) {
			let n = typeof primary.pairCreatedAt === "string" ? Number(primary.pairCreatedAt) || new Date(primary.pairCreatedAt).getTime() : Number(primary.pairCreatedAt);
			if (!isNaN(n) && n > 0) {
				if (n < 1e10) n = n * 1e3;
				primary.pairCreatedAt = n;
				const ageMs = Date.now() - n;
				primary.tokenAgeHours = Math.max(0, Math.floor(ageMs / 36e5));
			} else {
				primary.pairCreatedAt = void 0;
				primary.tokenAgeHours = void 0;
			}
		} else primary.tokenAgeHours = void 0;
		const liqVal = primary.totalLiquidityUsd || 0;
		const volVal = primary.totalVolume24h || 0;
		primary.liquidityScore = liqVal > 0 ? Math.min(100, Math.round(Math.log10(liqVal + 1) * 18)) : 0;
		primary.momentumScore = volVal > 0 ? Math.min(100, Math.round(Math.log10(volVal + 1) * 20)) : 0;
		const buys = primary.txns?.h24?.buys || 0;
		const sells = primary.txns?.h24?.sells || 0;
		primary.buySellRatio24h = sells > 0 ? Number((buys / sells).toFixed(2)) : buys > 0 ? 2 : 1;
		const existingMcap = primary.marketCap || primary.fdv;
		const existingFdv = primary.fdv || primary.marketCap;
		if (existingMcap && existingMcap > 0) {
			primary.marketCap = existingMcap;
			primary.fdv = existingFdv || existingMcap;
		} else {
			const isPumpBondingCurveToken = primary.chainId === "solana" && (primary.isBondingCurve || primary.dexId === "pumpfun" || primary.launchPlatform === "Pump.fun");
			const pUsd = Number(primary.priceUsd || 0);
			if (pUsd > 0 && isPumpBondingCurveToken) {
				primary.marketCap = Math.round(pUsd * 1e9);
				primary.fdv = primary.marketCap;
			} else {
				primary.marketCap = void 0;
				primary.fdv = void 0;
			}
		}
		if ((Number(primary.priceUsd) || 0) === 0) {
			const isPumpBondingCurveToken = primary.chainId === "solana" && (primary.isBondingCurve || primary.dexId === "pumpfun" || primary.launchPlatform === "Pump.fun");
			const mcap = primary.marketCap || primary.fdv;
			if (isPumpBondingCurveToken && mcap && mcap > 0) primary.priceUsd = String(mcap / 1e9);
		}
		canonicalResults.push(primary);
	});
	return canonicalResults;
}
function clearAllProviderCaches() {
	cacheMap.clear();
	clearPreparedPoolCache();
	for (const p of providers) if (typeof p.clearCache === "function") p.clearCache();
}
function isPumpSwapCandidate(p) {
	if (!p) return false;
	if (normalizeDexName(p.dexId || p.primaryDex) === "PumpSwap") return true;
	if (p.dexId?.toLowerCase().includes("pumpswap")) return true;
	if (p.marketStage === "pumpswap") return true;
	if (p.url?.toLowerCase().includes("pumpswap")) return true;
	if (p.sources?.some((s) => s.toLowerCase().includes("pumpswap"))) return true;
	if (p.dexes?.some((d) => d.toLowerCase().includes("pumpswap"))) return true;
	if (p.pairs?.some((pr) => (pr.dexName || pr.dexId || "").toLowerCase().includes("pumpswap"))) return true;
	if (p.pumpswap || p.pumpswap_pool || p.pump_swap_pool) return true;
	if (p.complete || p.isGraduated || p.marketStage === "graduated") return true;
	return false;
}
function debugPumpSwapDiscovery(report) {
	console.group("%c[DEXHUNTER DEBUG] PumpSwap Discovery Audit", "background: #ff6b35; color: white; font-weight: bold; padding: 2px 6px; border-radius: 4px;");
	console.log(`Discovery Mode: ${report.mode} | Timestamp: ${report.timestamp}`);
	console.group("1 & 2. Discovery Providers Breakdown (Total Raw vs. PumpSwap):");
	for (const [providerName, stats] of Object.entries(report.providerRawCounts)) console.log(`• ${providerName}: ${stats.total} total tokens | ${stats.pumpSwapCount} PumpSwap tokens`, stats.sampleMints.length > 0 ? `(Samples: ${stats.sampleMints.slice(0, 3).join(", ")})` : "");
	console.groupEnd();
	console.group(`3. PumpSwap Tokens Passing normalizeDexName (${report.normalizedPumpSwapTokens.length} tokens):`);
	if (report.normalizedPumpSwapTokens.length === 0) console.warn("⚠️ No PumpSwap tokens passed through normalizeDexName into canonical results!");
	else console.table(report.normalizedPumpSwapTokens.map((t) => ({
		Mint: t.mint,
		Symbol: t.symbol,
		PrimaryDEX: t.primaryDex,
		DEX_ID: t.dexId,
		Sources: t.sources.join(", "),
		Liquidity: t.liquidityUsd ? `$${Math.round(t.liquidityUsd).toLocaleString()}` : "N/A",
		Vol24h: t.volume24h ? `$${Math.round(t.volume24h).toLocaleString()}` : "N/A"
	})));
	console.groupEnd();
	console.group(`4. Filtered Out PumpSwap Tokens (${report.filteredOutTokens.length} tokens):`);
	if (report.filteredOutTokens.length === 0) console.log("✅ No PumpSwap tokens were filtered out.");
	else console.table(report.filteredOutTokens);
	console.groupEnd();
	console.groupEnd();
}
if (typeof window !== "undefined") window.debugPumpSwapDiscovery = debugPumpSwapDiscovery;
async function aggregateMultiSourceTokens(mode, query, signal, selectedChain, forceRefresh) {
	const normChain = selectedChain ? normalizeChainName(selectedChain) : "all";
	const cacheKey = `${mode}:${query || ""}:${normChain}`;
	if (forceRefresh) {
		cacheMap.delete(cacheKey);
		clearAllProviderCaches();
	} else {
		const cached = getCached(cacheKey);
		if (cached) return cached;
	}
	const rawResults = [];
	const rawByProvider = {};
	if (mode === "fresh_mints" || mode === "trending" || mode === "latest") {
		let serverFailed = false;
		try {
			const prepared = await fetchPreparedPool(mode === "fresh_mints" ? "fresh_mints" : mode === "trending" ? "trending" : "latest", normChain, 5e3, signal);
			if (signal?.aborted) return [];
			if (prepared.length > 0) {
				setCache(cacheKey, prepared);
				return prepared;
			}
		} catch {
			serverFailed = true;
			if (signal?.aborted) return [];
		}
		const discoverMode = mode === "trending" ? "trending" : "latest";
		const browserProviders = providers.filter((p) => p !== serverDiscoveryProvider);
		const settled = await Promise.allSettled(browserProviders.map((p) => Promise.race([p.discoverTokens(discoverMode, signal, normChain !== "all" ? normChain : void 0, forceRefresh), new Promise((_, reject) => {
			setTimeout(() => reject(/* @__PURE__ */ new Error("provider timeout")), 8e3);
		})])));
		for (let i = 0; i < browserProviders.length; i++) {
			const pName = browserProviders[i].name;
			const res = settled[i];
			if (res.status === "fulfilled" && Array.isArray(res.value)) {
				rawByProvider[pName] = res.value;
				rawResults.push(...res.value);
			} else rawByProvider[pName] = [];
		}
		if (signal?.aborted) return [];
		if (rawResults.length === 0 && serverFailed) throw new Error("Couldn't reach token feeds.");
	} else if (mode === "search" && query && query.trim()) {
		const qTrim = query.trim();
		if (qTrim.length >= 28 && !qTrim.includes(" ")) {
			const settled = await Promise.allSettled(providers.map((p) => p.getTokenByAddress(qTrim, normChain !== "all" ? normChain : void 0, signal)));
			for (let i = 0; i < providers.length; i++) {
				const pName = providers[i].name;
				const res = settled[i];
				if (res.status === "fulfilled" && Array.isArray(res.value)) {
					rawByProvider[pName] = res.value;
					rawResults.push(...res.value);
				} else rawByProvider[pName] = [];
			}
		} else {
			const settled = await Promise.allSettled(providers.map((p) => p.searchTokens(qTrim, signal)));
			for (let i = 0; i < providers.length; i++) {
				const pName = providers[i].name;
				const res = settled[i];
				if (res.status === "fulfilled" && Array.isArray(res.value)) {
					rawByProvider[pName] = res.value;
					rawResults.push(...res.value);
				} else rawByProvider[pName] = [];
			}
		}
	} else return [];
	const rawPumpSwapMap = /* @__PURE__ */ new Map();
	for (const r of rawResults) if (isPumpSwapCandidate(r) && r.baseToken?.address) rawPumpSwapMap.set(r.baseToken.address.toLowerCase(), r);
	let canonicalTokens = deduplicateAndMergeTokens(rawResults);
	if (normChain !== "all") canonicalTokens = canonicalTokens.filter((token) => normalizeChainName(token.chainId) === normChain);
	const filteredOutPumpSwapTokens = [];
	const canonicalMints = new Set(canonicalTokens.map((t) => t.baseToken?.address?.toLowerCase()));
	for (const [addr, rawP] of rawPumpSwapMap.entries()) if (!canonicalMints.has(addr)) filteredOutPumpSwapTokens.push({
		mint: rawP.baseToken?.address || addr,
		symbol: rawP.baseToken?.symbol || "UNKNOWN",
		primaryDex: rawP.primaryDex || rawP.dexId,
		stage: "deduplication",
		reason: "Filtered during deduplication (1k marketcap artifact, missing address, or chain mismatch)"
	});
	const now = Date.now();
	const ONE_WEEK_MS = 6048e5;
	const MAX_LATEST_AGE_MS = ONE_WEEK_MS;
	if (mode === "trending") {
		let qualifiedTokens = canonicalTokens.filter((token) => {
			const isPumpSwap = isPumpSwapCandidate(token);
			if (isExcludedTrendingAsset(token)) {
				if (isPumpSwap) filteredOutPumpSwapTokens.push({
					mint: token.baseToken?.address || "",
					symbol: token.baseToken?.symbol || "",
					primaryDex: token.primaryDex || void 0,
					stage: "qualification",
					reason: "isExcludedTrendingAsset check returned true (base currency or blacklisted)"
				});
				return false;
			}
			const vol24 = Number(token.volume?.h24 || token.totalVolume24h || 0);
			const vol1 = Number(token.volume?.h1 || 0);
			const vol5m = Number(token.volume?.m5 || 0);
			const liq = Number(token.liquidity?.usd || token.totalLiquidityUsd || 0);
			if (token.pairCreatedAt && token.pairCreatedAt > 0) {
				const created = Number(token.pairCreatedAt);
				const validTs = created < 1e10 ? created * 1e3 : created;
				const ageMs = now - validTs;
				if (ageMs > ONE_WEEK_MS) {
					if (isPumpSwap) filteredOutPumpSwapTokens.push({
						mint: token.baseToken?.address || "",
						symbol: token.baseToken?.symbol || "",
						primaryDex: token.primaryDex || void 0,
						stage: "qualification",
						reason: `Age exceeded 1 week (${Math.round(ageMs / 864e5)}d) with low volume`
					});
					return false;
				}
			}
			if (!isPumpSwap) {
				if (vol24 < 300 && vol1 === 0 && vol5m === 0) return false;
				if (liq < 300 && vol24 < 500) return false;
			}
			return true;
		});
		if (qualifiedTokens.length < 25) {
			const fallbackSettled = await Promise.allSettled([new DexScreenerProvider().discoverTokens("latest", signal, normChain, forceRefresh), normChain === "all" || normChain === "solana" ? new PumpFunProvider().discoverTokens("latest", signal, normChain) : Promise.resolve([])]);
			const supplementRaw = [];
			for (const res of fallbackSettled) if (res.status === "fulfilled" && Array.isArray(res.value)) supplementRaw.push(...res.value);
			if (supplementRaw.length > 0) qualifiedTokens = deduplicateAndMergeTokens([...rawResults, ...supplementRaw]).filter((token) => normChain === "all" || normalizeChainName(token.chainId) === normChain).filter((token) => !isExcludedTrendingAsset(token)).filter((token) => {
				if (!token.pairCreatedAt || token.pairCreatedAt <= 0) return true;
				const created = Number(token.pairCreatedAt);
				const validTs = created < 1e10 ? created * 1e3 : created;
				return now - validTs <= ONE_WEEK_MS;
			});
		}
		qualifiedTokens.sort((a, b) => {
			return calculateFinalDexHunterScore(b, "trending") - calculateFinalDexHunterScore(a, "trending");
		});
		canonicalTokens = qualifiedTokens;
	} else if (mode === "latest") canonicalTokens = canonicalTokens.filter((token) => !isExcludedTrendingAsset(token)).filter((token) => {
		if (!token.pairCreatedAt || token.pairCreatedAt <= 0) return false;
		const created = Number(token.pairCreatedAt);
		const validTs = created < 1e10 ? created * 1e3 : created;
		const ageMs = now - validTs;
		return ageMs >= -6e4 && ageMs <= MAX_LATEST_AGE_MS;
	});
	else if (mode === "fresh_mints") canonicalTokens = canonicalTokens.filter((token) => !isExcludedTrendingAsset(token)).filter((token) => {
		if (!token.pairCreatedAt || token.pairCreatedAt <= 0) return true;
		const created = Number(token.pairCreatedAt);
		const validTs = created < 1e10 ? created * 1e3 : created;
		return now - validTs <= MAX_LATEST_AGE_MS;
	}).sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0));
	try {
		const providerStats = {};
		for (const [pName, tokens] of Object.entries(rawByProvider)) {
			const psTokens = tokens.filter(isPumpSwapCandidate);
			providerStats[pName] = {
				total: tokens.length,
				pumpSwapCount: psTokens.length,
				sampleMints: psTokens.slice(0, 5).map((t) => t.baseToken?.address || "").filter(Boolean)
			};
		}
		const normalizedPumpSwapTokens = canonicalTokens.filter(isPumpSwapCandidate).map((t) => ({
			mint: t.baseToken?.address || "",
			symbol: t.baseToken?.symbol || "",
			primaryDex: t.primaryDex || "",
			dexId: t.dexId || "",
			sources: t.sources || [],
			liquidityUsd: t.totalLiquidityUsd || t.liquidity?.usd,
			volume24h: t.totalVolume24h || t.volume?.h24
		}));
		debugPumpSwapDiscovery({
			mode,
			timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
			providerRawCounts: providerStats,
			normalizedPumpSwapTokens,
			filteredOutTokens: filteredOutPumpSwapTokens
		});
	} catch (err) {
		console.error("Error generating debugPumpSwapDiscovery report:", err);
	}
	const missingAgeTokens = canonicalTokens.filter((t) => (!t.pairCreatedAt || t.pairCreatedAt <= 0) && t.baseToken?.address);
	if (missingAgeTokens.length > 0 && !signal?.aborted) try {
		const ds = new DexScreenerProvider();
		const addressesToResolve = missingAgeTokens.slice(0, 30).map((t) => t.baseToken.address);
		const resolvedPairs = await ds.getTokenByAddress(addressesToResolve.join(","), void 0, signal);
		if (Array.isArray(resolvedPairs) && resolvedPairs.length > 0) {
			const timestampsByAddress = /* @__PURE__ */ new Map();
			for (const pr of resolvedPairs) {
				const addr = (pr.baseToken?.address || "").toLowerCase();
				const prCreated = Number(pr.pairCreatedAt || 0);
				if (addr && prCreated > 0) {
					const validTs = prCreated < 1e10 ? prCreated * 1e3 : prCreated;
					const currentMin = timestampsByAddress.get(addr);
					if (!currentMin || validTs < currentMin) timestampsByAddress.set(addr, validTs);
				}
			}
			for (const token of missingAgeTokens) {
				const addr = (token.baseToken?.address || "").toLowerCase();
				const resolvedTimestamp = timestampsByAddress.get(addr);
				if (resolvedTimestamp && resolvedTimestamp > 0) {
					token.pairCreatedAt = resolvedTimestamp;
					const ageMs = Date.now() - resolvedTimestamp;
					token.tokenAgeHours = Math.max(0, Math.floor(ageMs / 36e5));
				}
			}
		}
	} catch {}
	for (const t of canonicalTokens) {
		t.refreshTimestamp = now;
		if (!t.providerFetchTimestamp) t.providerFetchTimestamp = now;
		if (!t.sourceTimestamp) t.sourceTimestamp = now;
		if (!t.lastActivityTimestamp) t.lastActivityTimestamp = Number(t.volume?.m5 || 0) > 0 || Number(t.volume?.h1 || 0) > 0 ? now : t.pairCreatedAt || now;
	}
	if (canonicalTokens.length > 0) setCache(cacheKey, canonicalTokens, mode === "fresh_mints" ? 5e3 : DEFAULT_CACHE_TTL_MS);
	return canonicalTokens;
}
function exportAgeHours(token, now) {
	if (typeof token.tokenAgeHours === "number" && Number.isFinite(token.tokenAgeHours)) return token.tokenAgeHours;
	const raw = Number(token.pairCreatedAt);
	if (!Number.isFinite(raw) || raw <= 0) return "";
	const ms = raw < 1e11 ? raw * 1e3 : raw;
	if (ms > now + 12e4) return "";
	return Math.max(0, Math.floor((now - ms) / 36e5));
}
function exportTokensToCSV(tokens, filename) {
	if (!tokens || tokens.length === 0) return;
	const headers = [
		"Token Name",
		"Symbol",
		"Contract Address",
		"Chain",
		"Primary DEX",
		"Launch Platform",
		"All Discovered DEXes",
		"All Sources",
		"Price USD",
		"Market Cap USD",
		"Liquidity USD",
		"24h Volume USD",
		"24h Price Change %",
		"Token Age (Hours)",
		"Website",
		"X / Twitter",
		"Telegram",
		"Launch Date"
	];
	const escapeCsv = (val) => {
		if (val === void 0 || val === null) return "\"\"";
		return `"${String(val).replace(/"/g, "\"\"")}"`;
	};
	const exportedAt = Date.now();
	const rows = tokens.map((t) => {
		const website = t.info?.websites?.find((w) => w.type === "website" || w.url.startsWith("http"))?.url || "";
		const twitter = t.info?.socials?.find((s) => s.type === "twitter" || s.type === "x" || s.url.includes("x.com") || s.url.includes("twitter"))?.url || "";
		const telegram = t.info?.socials?.find((s) => s.type === "telegram" || s.url.includes("t.me"))?.url || "";
		const primaryDexDisplay = t.primaryDex || (t.launchPlatform ? "Bonding Curve" : getDEXDisplayName(t.dexId || t.primaryProvider));
		const dexesStr = t.dexes && t.dexes.length > 0 ? t.dexes.join(" | ") : primaryDexDisplay;
		const sourcesStr = t.sources && t.sources.length > 0 ? t.sources.join(" | ") : primaryDexDisplay;
		const launchTime = t.pairCreatedAt ? new Date(t.pairCreatedAt).toISOString() : "";
		return [
			escapeCsv(t.baseToken?.name),
			escapeCsv(t.baseToken?.symbol),
			escapeCsv(t.baseToken?.address),
			escapeCsv(t.chainId),
			escapeCsv(primaryDexDisplay),
			escapeCsv(t.launchPlatform || "N/A"),
			escapeCsv(dexesStr),
			escapeCsv(sourcesStr),
			escapeCsv(t.priceUsd ? `$${t.priceUsd}` : "N/A"),
			escapeCsv(t.marketCap ?? t.fdv ?? ""),
			escapeCsv(t.totalLiquidityUsd ?? t.liquidity?.usd ?? ""),
			escapeCsv(t.volumeComplete === false ? "" : t.volume?.h24 ?? t.totalVolume24h ?? ""),
			escapeCsv(t.priceChange?.h24 ?? ""),
			escapeCsv(exportAgeHours(t, exportedAt)),
			escapeCsv(website),
			escapeCsv(twitter),
			escapeCsv(telegram),
			escapeCsv(launchTime)
		].join(",");
	});
	const csvContent = [headers.join(","), ...rows].join("\n");
	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.setAttribute("href", url);
	link.setAttribute("download", filename || `dexhunter_tokens_export_${Date.now()}.csv`);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
/**
* Concurrently enrich tokens with secondary metadata (logos, socials, bonding curve state)
* using Promise.allSettled with proper AbortSignal handling.
*/
async function enrichTokensWithMetadataConcurrently(tokens, _signal) {
	return tokens || [];
}
var SUB_DIGITS = {
	"0": "₀",
	"1": "₁",
	"2": "₂",
	"3": "₃",
	"4": "₄",
	"5": "₅",
	"6": "₆",
	"7": "₇",
	"8": "₈",
	"9": "₉"
};
function toSubscriptString(num) {
	return String(num).split("").map((ch) => SUB_DIGITS[ch] || ch).join("");
}
/**
* Parses a price value and computes subscript notation for small coin prices (e.g. $0.0⁵43 for 0.00000043)
*/
function formatPriceParts(val) {
	if (val === null || val === void 0 || val === "" || val === "N/A") return {
		formatted: "N/A",
		isSubscript: false,
		rawStr: "N/A"
	};
	const num = typeof val === "number" ? val : Number(val);
	if (isNaN(num) || num <= 0) return {
		formatted: "N/A",
		isSubscript: false,
		rawStr: "N/A"
	};
	if (num >= 1e3) {
		const formatted = "$" + num.toLocaleString(void 0, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
		return {
			formatted,
			isSubscript: false,
			rawStr: formatted,
			fullDecimal: formatted
		};
	}
	if (num >= 1) {
		const formatted = "$" + num.toLocaleString(void 0, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 4
		});
		return {
			formatted,
			isSubscript: false,
			rawStr: formatted,
			fullDecimal: formatted
		};
	}
	let str;
	if (typeof val === "string" && !val.includes("e") && !val.includes("E") && val.startsWith("0.")) str = val;
	else str = num.toFixed(20);
	const match = str.match(/^0\.(0+)([1-9][0-9]*)/);
	if (match) {
		const totalZeros = match[1].length;
		const fourSig = match[2].slice(0, 4);
		const fullDecimalStr = "$" + str.slice(0, totalZeros + 6).replace(/0+$/, "");
		if (totalZeros <= 4) {
			const decimals = totalZeros + 4;
			const formatted = "$" + num.toFixed(decimals).replace(/0+$/, "");
			return {
				formatted,
				isSubscript: false,
				rawStr: formatted,
				fullDecimal: formatted
			};
		} else {
			const subCount = totalZeros - 1;
			return {
				prefix: "$0.0",
				subscript: subCount,
				suffix: fourSig,
				isSubscript: true,
				rawStr: `$0.0${toSubscriptString(subCount)}${fourSig}`,
				fullDecimal: fullDecimalStr
			};
		}
	}
	const formatted = "$" + num.toFixed(4);
	return {
		formatted,
		isSubscript: false,
		rawStr: formatted,
		fullDecimal: formatted
	};
}
/**
* Returns plain string formatted price with unicode subscript for text-only contexts
*/
function formatPriceString(val) {
	const parts = formatPriceParts(val);
	if (parts.isSubscript) return parts.rawStr;
	return parts.formatted || "N/A";
}
/**
* React Component that renders coin prices with unambiguous decimal representation,
* or compact subscript notation with tap/click toggle for extreme micro-prices.
*/
var FormattedPrice = ({ value, className = "", prefixDollar = true }) => {
	const [showFull, setShowFull] = import_react.useState(false);
	const parts = formatPriceParts(value);
	if (parts.isSubscript && parts.prefix && parts.subscript && parts.suffix) {
		if (showFull && parts.fullDecimal) {
			const fullDisplay = prefixDollar ? parts.fullDecimal : parts.fullDecimal.replace(/^\$/, "");
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: `inline-flex items-baseline font-mono tracking-tight cursor-pointer select-all underline decoration-dotted decoration-emerald-500/50 hover:opacity-85 transition-opacity ${className}`,
				title: `Click to view compact notation (${parts.rawStr})`,
				onClick: (e) => {
					e.stopPropagation();
					setShowFull(false);
				},
				children: fullDisplay
			});
		}
		const prefix = prefixDollar ? parts.prefix : parts.prefix.replace(/^\$/, "");
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: `inline-flex items-baseline font-mono tracking-tight cursor-pointer hover:opacity-85 transition-opacity ${className}`,
			title: parts.fullDecimal ? `Tap or click to view full decimal (${parts.fullDecimal})` : `$${value}`,
			onClick: (e) => {
				e.stopPropagation();
				setShowFull(true);
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: prefix }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sub", {
					className: "text-[0.68em] leading-none font-bold align-sub opacity-85 px-[0.5px] select-all -translate-y-[-0.08em]",
					children: parts.subscript
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: parts.suffix })
			]
		});
	}
	const formatted = parts.formatted || "N/A";
	const display = prefixDollar ? formatted : formatted.replace(/^\$/, "");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `font-mono tracking-tight ${className}`,
		title: value ? `$${value}` : void 0,
		children: display
	});
};
var HOLDER_COLORS = [
	"#ff6b35",
	"#f59e0b",
	"#10b981",
	"#06b6d4",
	"#3b82f6",
	"#6366f1",
	"#8b5cf6",
	"#ec4899",
	"#14b8a6",
	"#f43f5e"
];
var HoldersPieChart = ({ topHolders, top10SupplyPercentage, isDarkMode }) => {
	const [hoveredSlice, setHoveredSlice] = (0, import_react.useState)(null);
	const svgRef = (0, import_react.useRef)(null);
	const { slices, totalTopPercentage, remainingPercentage } = (0, import_react.useMemo)(() => {
		if (!topHolders || topHolders.length === 0) return {
			slices: [],
			totalTopPercentage: 0,
			remainingPercentage: 100
		};
		const validHolders = topHolders.slice(0, 10);
		let sumTopPct = 0;
		const holderSlices = validHolders.map((h, i) => {
			const pct = Math.max(0, Number(h.percentageRelativeToTotalSupply) || 0);
			sumTopPct += pct;
			const addr = h.ownerAddress || `Holder-${i + 1}`;
			const shortAddr = addr.length > 8 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;
			return {
				id: `holder-${i}`,
				label: `Holder #${i + 1}`,
				shortAddress: shortAddr,
				fullAddress: addr,
				percentage: pct,
				balanceFormatted: h.balanceFormatted,
				isRemaining: false,
				color: HOLDER_COLORS[i % HOLDER_COLORS.length],
				rank: i + 1
			};
		});
		const totalTopPercentage = (typeof top10SupplyPercentage === "number" && Number.isFinite(top10SupplyPercentage) ? Math.max(0, top10SupplyPercentage) : null) ?? Math.max(0, sumTopPct);
		const remPct = Math.max(0, 100 - totalTopPercentage);
		const resultSlices = [...holderSlices];
		if (remPct > .05) resultSlices.push({
			id: "remaining-supply",
			label: "Remaining Supply",
			shortAddress: "Public / Other",
			fullAddress: "All other non-top-10 holders & pool liquidity",
			percentage: remPct,
			isRemaining: true,
			color: isDarkMode ? "#334155" : "#cbd5e1"
		});
		return {
			slices: resultSlices,
			totalTopPercentage,
			remainingPercentage: remPct
		};
	}, [
		topHolders,
		isDarkMode,
		top10SupplyPercentage
	]);
	const arcs = (0, import_react.useMemo)(() => {
		if (slices.length === 0) return [];
		const pieGenerator = pie_default().value((d) => d.percentage).sort(null).padAngle(.025);
		const arcGenerator = arc_default().innerRadius(30).outerRadius(52).cornerRadius(3);
		const hoverArcGenerator = arc_default().innerRadius(28).outerRadius(56).cornerRadius(4);
		return pieGenerator(slices).map((d) => ({
			data: d.data,
			path: arcGenerator(d) || "",
			hoverPath: hoverArcGenerator(d) || "",
			centroid: arcGenerator.centroid(d)
		}));
	}, [slices]);
	if (slices.length === 0) return null;
	const activeDisplay = hoveredSlice || {
		id: "summary",
		label: `Top ${Math.min(10, topHolders.length)} Concentration`,
		shortAddress: `${totalTopPercentage.toFixed(1)}% of Supply`,
		fullAddress: "",
		percentage: totalTopPercentage,
		isRemaining: false,
		color: "#ff6b35"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		initial: {
			opacity: 0,
			y: 6
		},
		animate: {
			opacity: 1,
			y: 0
		},
		transition: {
			duration: .3,
			delay: .06
		},
		className: `p-2.5 rounded-xl border space-y-2 text-xs select-none ${isDarkMode ? "bg-zinc-900/70 border-zinc-800/80" : "bg-white border-slate-200/90 shadow-2xs"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1.5 font-semibold text-[11px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartPie, { className: "w-3.5 h-3.5 text-[#ff6b35]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Supply Distribution" })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1 text-[10px] font-mono",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "opacity-60",
					children: "Top 10:"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: `font-bold ${totalTopPercentage > 50 ? "text-rose-500" : totalTopPercentage > 30 ? "text-amber-500" : "text-emerald-500"}`,
					children: [totalTopPercentage.toFixed(1), "%"]
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-1 sm:grid-cols-12 gap-2 items-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sm:col-span-5 flex flex-col items-center justify-center relative py-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
					ref: svgRef,
					viewBox: "-60 -60 120 120",
					className: "w-28 h-28 overflow-visible cursor-pointer drop-shadow-xs",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: "0",
							cy: "0",
							r: "29",
							fill: "transparent",
							stroke: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
							strokeWidth: "2"
						}),
						arcs.map((arc) => {
							const isHovered = hoveredSlice?.id === arc.data.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: isHovered ? arc.hoverPath : arc.path,
								fill: arc.data.color,
								opacity: hoveredSlice ? isHovered ? 1 : .45 : .92,
								stroke: isDarkMode ? "#12131a" : "#ffffff",
								strokeWidth: "1.5",
								className: "transition-all duration-150 ease-out",
								onMouseEnter: () => setHoveredSlice(arc.data),
								onMouseLeave: () => setHoveredSlice(null)
							}, arc.data.id);
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
							textAnchor: "middle",
							dy: "-0.2em",
							className: `font-mono text-[10px] font-bold ${isDarkMode ? "fill-white" : "fill-slate-900"}`,
							children: hoveredSlice ? `${hoveredSlice.percentage.toFixed(1)}%` : `${totalTopPercentage.toFixed(0)}%`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
							textAnchor: "middle",
							dy: "1.1em",
							className: `font-sans text-[7.5px] uppercase font-semibold ${isDarkMode ? "fill-zinc-400" : "fill-slate-500"}`,
							children: hoveredSlice ? hoveredSlice.isRemaining ? "Other" : `Rank #${hoveredSlice.rank}` : "Top 10"
						})
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sm:col-span-7 space-y-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `p-1.5 rounded-lg border text-[10.5px] transition-all ${hoveredSlice ? isDarkMode ? "bg-zinc-800/80 border-zinc-700/80" : "bg-slate-100 border-slate-300" : isDarkMode ? "bg-zinc-950/40 border-zinc-800/40" : "bg-slate-50/80 border-slate-200/60"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5 truncate",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-2.5 h-2.5 rounded-full flex-shrink-0",
								style: { backgroundColor: activeDisplay.color }
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold truncate",
								children: activeDisplay.label
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono font-bold text-xs flex-shrink-0",
							children: [activeDisplay.percentage.toFixed(2), "%"]
						})]
					}), hoveredSlice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-0.5 text-[9.5px] font-mono opacity-70 truncate",
						children: hoveredSlice.fullAddress
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-0.5 text-[9.5px] opacity-60 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Remaining non-top wallets:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-mono font-semibold",
							children: [remainingPercentage.toFixed(1), "%"]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-1 pt-0.5",
					children: slices.slice(0, 6).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						onMouseEnter: () => setHoveredSlice(s),
						onMouseLeave: () => setHoveredSlice(null),
						className: `flex items-center justify-between px-1.5 py-0.5 rounded cursor-pointer transition-colors text-[9.5px] font-mono ${hoveredSlice?.id === s.id ? isDarkMode ? "bg-zinc-800 text-white font-bold" : "bg-slate-200 text-slate-900 font-bold" : "hover:bg-slate-100 dark:hover:bg-zinc-800/50 opacity-80"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1 truncate mr-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-1.5 h-1.5 rounded-full flex-shrink-0",
								style: { backgroundColor: s.color }
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate",
								children: s.isRemaining ? "Rest" : `#${s.rank}`
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex-shrink-0",
							children: [s.percentage.toFixed(1), "%"]
						})]
					}, s.id))
				})]
			})]
		})]
	});
};
/**
* Timestamp and time comparison helpers
*/
function toMillis(timestamp) {
	if (timestamp === void 0 || timestamp === null || timestamp === "") return null;
	if (typeof timestamp === "number") {
		if (isNaN(timestamp) || timestamp <= 0) return null;
		if (timestamp < 1e11) return timestamp * 1e3;
		return timestamp;
	}
	const num = Number(timestamp);
	if (!isNaN(num) && num > 0) {
		if (num < 1e11) return num * 1e3;
		return num;
	}
	const parsed = Date.parse(timestamp);
	if (!isNaN(parsed) && parsed > 0) return parsed;
	return null;
}
function isNewerThan(timestamp, maxAgeMs) {
	const ms = toMillis(timestamp);
	if (!ms) return false;
	return Date.now() - ms < maxAgeMs;
}
function matchesSourceFilter(pair, selectedDex) {
	return matchesSourceFilter$1(pair, selectedDex);
}
function knownMetric(value) {
	if (value === null || value === void 0 || value === "") return null;
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}
function launchMs(token) {
	const raw = Number(token?.pairCreatedAt);
	if (!Number.isFinite(raw) || raw <= 0) return null;
	return raw < 1e11 ? raw * 1e3 : raw;
}
var AGE_WINDOWS_MS = {
	"1h": 36e5,
	"6h": 216e5,
	"24h": 864e5,
	"48h": 1728e5,
	"1w": 6048e5,
	"1m": 2592e6
};
var LAUNCH_CLOCK_SKEW_MS = 12e4;
function passesAge(token, age, now = Date.now()) {
	if (age === "all") return true;
	const windowMs = AGE_WINDOWS_MS[age] ?? AGE_WINDOWS_MS["1w"];
	const ts = launchMs(token);
	if (ts == null) return false;
	if (ts > now + LAUNCH_CLOCK_SKEW_MS) return false;
	return now - ts <= windowMs;
}
function passesMin(value, min) {
	if (min === "") return true;
	const n = knownMetric(value);
	return n != null && n >= min;
}
function passesMax(value, max) {
	if (max === "") return true;
	const n = knownMetric(value);
	return n != null && n <= max;
}
function volumeForFilter(token) {
	if (!token || token.volumeComplete === false) return null;
	const direct = knownMetric(token.volume?.h24);
	if (direct != null) return direct;
	return knownMetric(token.totalVolume24h);
}
/** Card/table figure. Includes a partial window. Filters still use volumeForFilter. */
function volumeForDisplay(token) {
	if (!token) return null;
	const observed = knownMetric(token.volumeObservedUsd);
	if (observed != null) return observed;
	const direct = knownMetric(token.volume?.h24);
	if (direct != null) return direct;
	return knownMetric(token.totalVolume24h);
}
function liquidityForFilter(token) {
	if (!token) return null;
	const direct = knownMetric(token.liquidity?.usd);
	if (direct != null) return direct;
	return knownMetric(token.totalLiquidityUsd);
}
function ponsValued(pair) {
	if (!pair) return false;
	const stage = String(pair.marketStage || "").toLowerCase();
	return pair.isGraduated === true || stage === "graduated" || stage === "migrated";
}
function ponsStageLabel(pair) {
	if (!pair) return null;
	const platform = String(pair.launchPlatform || "").toLowerCase().replace(/[^a-z0-9]/g, "");
	const primary = String(pair.primaryDex || pair.dexId || pair.primaryProvider || "").toLowerCase().replace(/[^a-z0-9]/g, "");
	if (!(Boolean(pair.isPonsLaunch) || platform.includes("pons") || primary.includes("pons"))) return null;
	if (ponsValued(pair)) return "Pons · valued";
	if (String(pair.marketStage || "").toLowerCase() === "sweeping") return "Pons · migrating";
	return "Pons · bonding curve";
}
function marketCapOf(token) {
	return knownMetric(token?.marketCap);
}
function fdvOf(token) {
	return knownMetric(token?.fdv);
}
function isAddressLabel(value, address) {
	const v = value.trim();
	if (!v) return true;
	if (/^0x[a-fA-F0-9]{40}$/.test(v)) return true;
	if (/^0x[a-fA-F0-9]{3,10}(?:…|\.{3})[a-fA-F0-9]{2,8}$/.test(v)) return true;
	const addr = String(address || "").trim();
	if (!addr) return false;
	const lower = v.toLowerCase();
	return lower === addr.toLowerCase() || lower === addr.slice(0, 6).toLowerCase() || lower === addr.slice(0, 8).toLowerCase();
}
function displaySymbol(token) {
	const symbol = String(token?.baseToken?.symbol || "").trim();
	const addr = token?.baseToken?.address;
	if (symbol && !/^unknown$/i.test(symbol) && !isAddressLabel(symbol, addr)) return symbol;
	return "—";
}
function displayName(token, fallback = displaySymbol(token)) {
	const name = String(token?.baseToken?.name || "").trim();
	const addr = token?.baseToken?.address;
	if (name && !/^unknown$/i.test(name) && !isAddressLabel(name, addr)) return name;
	const next = String(fallback || "").trim();
	if (next && next !== "—" && !/^unknown$/i.test(next) && !isAddressLabel(next, addr)) return next;
	return "Name unverified";
}
function compareCreatedDesc(a, b) {
	return (launchMs(b) ?? 0) - (launchMs(a) ?? 0);
}
function liveRowChanged(prev, next) {
	if (prev.priceUsd !== next.priceUsd || prev.priceNative !== next.priceNative) return true;
	if ((prev.marketCap || 0) !== (next.marketCap || 0)) return true;
	if ((prev.totalLiquidityUsd || prev.liquidity?.usd || 0) !== (next.totalLiquidityUsd || next.liquidity?.usd || 0)) return true;
	if ((prev.totalVolume24h || prev.volume?.h24 || 0) !== (next.totalVolume24h || next.volume?.h24 || 0)) return true;
	if ((prev.priceChange?.h24 || 0) !== (next.priceChange?.h24 || 0)) return true;
	if (prev.bondingProgress !== next.bondingProgress) return true;
	if (prev.marketStage !== next.marketStage || prev.isGraduated !== next.isGraduated) return true;
	if ((prev.baseToken?.name || "") !== (next.baseToken?.name || "")) return true;
	if ((prev.baseToken?.symbol || "") !== (next.baseToken?.symbol || "")) return true;
	if (!prev.info?.imageUrl && next.info?.imageUrl) return true;
	if ((prev.info?.socials?.length || 0) < (next.info?.socials?.length || 0)) return true;
	if ((prev.info?.websites?.length || 0) < (next.info?.websites?.length || 0)) return true;
	return false;
}
function applyLoadedFilters(tokens, filters) {
	return tokens.filter((pair) => {
		if (!matchesChainSelection(pair.chainId, filters.chain)) return false;
		if (!matchesSourceFilter(pair, filters.dex)) return false;
		const row = pair;
		if (!passesMin(volumeForFilter(row), filters.minVolume)) return false;
		if (!passesMax(volumeForFilter(row), filters.maxVolume)) return false;
		if (!passesMin(liquidityForFilter(row), filters.minLiquidity)) return false;
		if (!passesMin(marketCapOf(row), filters.minMarketCap)) return false;
		if (!passesMax(marketCapOf(row), filters.maxMarketCap)) return false;
		if (!passesMin(row.priceChange?.h24, filters.minPriceChange)) return false;
		if (!matchSocialFilters(pair, filters)) return false;
		if (!passesAge(pair, filters.age, filters.now)) return false;
		return true;
	});
}
var TelegramIcon = ({ className = "w-3.5 h-3.5" }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
	className,
	viewBox: "0 0 24 24",
	fill: "currentColor",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M21.543 6.498l-3.323 15.666c-.25 1.107-.906 1.38-1.834.861l-5.064-3.733-2.443 2.352c-.27.27-.498.498-1.02.498l.363-5.158 9.387-8.48c.408-.363-.089-.566-.633-.203l-11.603 7.306-5.002-1.564c-1.087-.34-1.109-1.087.227-1.608l19.554-7.535c.905-.34 1.696.204 1.388 1.596z" })
});
var XIcon = ({ className = "w-3.5 h-3.5" }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
	className,
	viewBox: "0 0 24 24",
	fill: "currentColor",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" })
});
var DiscordIcon = ({ className = "w-3.5 h-3.5" }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
	className,
	viewBox: "0 0 24 24",
	fill: "currentColor",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" })
});
function extractTokenSocials(pair) {
	const socials = readSocials(pair);
	return {
		tgUrl: socials.telegram || void 0,
		twProfileUrl: socials.xProfile || void 0,
		twPostUrl: socials.xPost || void 0,
		twUrl: socials.xProfile || socials.xPost || void 0,
		webUrl: socials.website || void 0,
		discordUrl: socials.discord || void 0
	};
}
function SocialAnchor({ url, className, title, ariaLabel, children }) {
	if (!url) return null;
	const href = safeHref(url);
	if (!href) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className,
		title,
		"aria-label": ariaLabel,
		children
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
		href,
		target: "_blank",
		rel: "noopener noreferrer",
		onClick: (e) => e.stopPropagation(),
		className,
		title,
		"aria-label": ariaLabel,
		children
	});
}
var SocialLinksRow = ({ pair, className = "", size = "md" }) => {
	const socials = extractTokenSocials(pair);
	if (!Boolean(socials.tgUrl || socials.twProfileUrl || socials.twPostUrl || socials.webUrl || socials.discordUrl)) {
		if (size === "micro" || size === "compact") return null;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `text-[10px] text-zinc-500/70 font-mono italic ${className}`,
			children: "No socials listed"
		});
	}
	const btnClass = size === "micro" ? "w-5.5 h-5.5 min-w-[22px] min-h-[22px] max-w-[22px] max-h-[22px] rounded-md border border-slate-200/80 dark:border-zinc-800 bg-slate-100/90 dark:bg-[#181926] hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer flex items-center justify-center flex-shrink-0 aspect-square shadow-2xs relative before:absolute before:-inset-1.5 sm:before:hidden touch-manipulation" : size === "compact" ? "w-6.5 h-6.5 min-w-[26px] min-h-[26px] max-w-[26px] max-h-[26px] rounded-lg border border-slate-200/90 dark:border-zinc-800 bg-slate-100/90 dark:bg-[#181926] hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer flex items-center justify-center flex-shrink-0 aspect-square shadow-2xs relative before:absolute before:-inset-1.5 sm:before:hidden touch-manipulation" : size === "sm" ? "w-7 h-7 min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px] rounded-lg border border-slate-200/90 dark:border-zinc-800 bg-slate-100/90 dark:bg-[#181926] hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer flex items-center justify-center flex-shrink-0 aspect-square shadow-2xs relative before:absolute before:-inset-2 sm:before:hidden touch-manipulation" : "w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-slate-100/90 dark:bg-[#181926] hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer flex items-center justify-center flex-shrink-0 aspect-square shadow-2xs relative before:absolute before:-inset-2 sm:before:hidden touch-manipulation";
	const iconClass = size === "micro" ? "w-3 h-3 min-w-[12px] min-h-[12px] flex-shrink-0" : size === "compact" ? "w-3.5 h-3.5 min-w-[14px] min-h-[14px] flex-shrink-0" : size === "sm" ? "w-4 h-4 min-w-[16px] min-h-[16px] flex-shrink-0" : "w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex-shrink-0";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `flex items-center ${size === "micro" ? "gap-1" : size === "compact" ? "gap-1" : "gap-1.5"} ${className}`,
		role: "group",
		"aria-label": "Social Links",
		onClick: (e) => e.stopPropagation(),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SocialAnchor, {
				url: socials.tgUrl,
				className: `${btnClass} text-[#229ED9] hover:bg-[#229ED9]/15 hover:border-[#229ED9]/60 hover:text-[#38b7f3] hover:shadow-xs hover:shadow-[#229ED9]/20`,
				title: "Telegram Community",
				ariaLabel: "Telegram",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TelegramIcon, { className: iconClass })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SocialAnchor, {
				url: socials.twProfileUrl,
				className: `${btnClass} text-slate-800 dark:text-zinc-100 hover:bg-slate-200/70 dark:hover:bg-zinc-800/90 hover:border-slate-400 dark:hover:border-zinc-500 hover:text-black dark:hover:text-white hover:shadow-xs`,
				title: "X profile",
				ariaLabel: "X profile",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(XIcon, { className: iconClass })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SocialAnchor, {
				url: socials.twPostUrl,
				className: `${btnClass} text-slate-800 dark:text-zinc-100 hover:bg-slate-200/70 dark:hover:bg-zinc-800/90 hover:border-slate-400 dark:hover:border-zinc-500 hover:text-black dark:hover:text-white hover:shadow-xs`,
				title: "X post",
				ariaLabel: "X post",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feather, { className: iconClass })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SocialAnchor, {
				url: socials.webUrl,
				className: `${btnClass} text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/60 hover:text-emerald-400 dark:hover:text-emerald-300 hover:shadow-xs hover:shadow-emerald-500/20`,
				title: "Official Website",
				ariaLabel: "Website",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: iconClass })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SocialAnchor, {
				url: socials.discordUrl,
				className: `${btnClass} text-[#5865F2] hover:bg-[#5865F2]/15 hover:border-[#5865F2]/60 hover:text-[#7289da] hover:shadow-xs hover:shadow-[#5865F2]/20`,
				title: "Discord Server",
				ariaLabel: "Discord",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiscordIcon, { className: iconClass })
			})
		]
	});
};
var TokenImage$1 = ({ imageUrl, symbol, address, chainId, className = "w-7 h-7 sm:w-8 sm:h-8" }) => {
	const [step, setStep] = (0, import_react.useState)(0);
	const [gatewayIdx, setGatewayIdx] = (0, import_react.useState)(0);
	const firstLetter = symbol ? symbol.charAt(0).toUpperCase() : "?";
	const canonicalUrl = getCanonicalTokenLogo(chainId, address, symbol);
	const normChain = chainId?.toLowerCase() === "polygon_pos" ? "polygon" : chainId?.toLowerCase() || "solana";
	(0, import_react.useEffect)(() => {
		setStep(0);
		setGatewayIdx(0);
	}, [
		imageUrl,
		address,
		canonicalUrl,
		chainId
	]);
	const provided = imageUrl ? normalizeUri(imageUrl, gatewayIdx) : void 0;
	const pumpLogo = normChain === "solana" && address ? `https://images.pump.fun/coin-image/${address}` : void 0;
	const cdnUrl = address ? `https://dd.dexscreener.com/ds-data/tokens/${normChain}/${address}.png` : void 0;
	const sources = [];
	for (const url of [
		provided,
		pumpLogo,
		canonicalUrl,
		cdnUrl
	]) if (url && !sources.includes(url)) sources.push(url);
	const currentRaw = sources[step];
	const currentSrc = currentRaw ? currentRaw.replace(/([?&])width=\d+/g, "$1width=64").replace(/([?&])height=\d+/g, "$1height=64") : void 0;
	if (!currentSrc) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `${className} rounded-xl bg-slate-100 dark:bg-[#1c1d2c] border border-slate-200 dark:border-zinc-700/50 flex items-center justify-center font-mono text-xs font-bold text-[#ff6b35] flex-shrink-0 select-none aspect-square`,
		title: symbol,
		children: firstLetter
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `${className} rounded-xl bg-slate-100 dark:bg-[#181926] border border-slate-200/80 dark:border-zinc-700/60 p-0.5 flex items-center justify-center flex-shrink-0 overflow-hidden aspect-square`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: currentSrc,
			alt: symbol || "Token Logo",
			loading: "lazy",
			decoding: "async",
			referrerPolicy: "no-referrer",
			onError: () => {
				if (Boolean(provided) && sources[step] === provided && imageUrl && (imageUrl.includes("ipfs") || imageUrl.startsWith("Qm") || imageUrl.startsWith("bafy")) && gatewayIdx < IPFS_GATEWAYS.length - 1) {
					setGatewayIdx((prev) => prev + 1);
					return;
				}
				setStep((prev) => prev + 1);
			},
			className: "w-full h-full object-contain rounded-lg flex-shrink-0"
		})
	});
};
var ChainIcon$1 = ({ chainId, fallbackClass, iconOnly = false }) => {
	const [imgError, setImgError] = (0, import_react.useState)(false);
	const norm = normalizeChainName(chainId);
	const logoUrl = {
		solana: "/chains/solana.png",
		bsc: "/chains/bsc.png",
		ethereum: "/chains/ethereum.png",
		base: "/chains/base.png",
		arbitrum: "/chains/arbitrum.png",
		polygon: "/chains/polygon.png",
		avalanche: "/chains/avalanche.png",
		cronos: "/chains/cronos.png",
		optimism: "/chains/optimism.png",
		robinhood: "/chains/robinhood.png",
		hyperevm: "/chains/hyperevm.png",
		arc: "/arc.png"
	}[norm];
	const title = norm === "robinhood" ? "Robinhood" : norm === "arc" ? "Arc" : norm === "bsc" ? "BNB Chain" : norm === "hyperevm" ? "HyperEVM" : norm || chainId;
	if (!logoUrl || imgError) {
		if (iconOnly) return null;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			title,
			className: `inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold leading-none ${fallbackClass || "bg-zinc-800 text-zinc-300"}`,
			children: (title || "?").slice(0, 1).toUpperCase()
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: logoUrl,
		alt: title,
		title,
		onError: () => setImgError(true),
		referrerPolicy: "no-referrer",
		className: "w-full h-full max-w-4 max-h-4 object-contain flex-shrink-0 rounded-full"
	});
};
var DexProtocolBadge$1 = ({ pair }) => {
	const isPumpSwap = hasVerifiedPumpSwapPool(pair);
	const isPumpBonding = isPumpToken(pair) && isBondingCurveToken(pair) && !isPumpSwap;
	const progress = typeof pair.bondingProgress === "number" ? Math.min(100, Math.max(0, pair.bondingProgress)) : null;
	if (isPumpBonding) {
		const tradeUrl = safeHref(clientTradeHref(pair, getDexTradingUrl(pair, "Pump.fun")));
		const className = "inline-flex items-center gap-1 text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:border-emerald-500/60 hover:bg-emerald-500/20 transition cursor-pointer group shadow-2xs whitespace-nowrap";
		const title = `Pump.fun Bonding Curve (${progress !== null ? `${progress}% complete` : "Active"})`;
		const inner = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "truncate",
				children: "Bonding Curve"
			}),
			progress !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "px-1 py-0.2 rounded bg-emerald-500/20 text-[10px] font-mono",
				children: [progress.toFixed(0), "%"]
			}),
			tradeUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "w-2.5 h-2.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" }) : null
		] });
		if (!tradeUrl) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			title,
			className,
			children: inner
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
			href: tradeUrl,
			target: "_blank",
			rel: "noopener noreferrer",
			onClick: (e) => e.stopPropagation(),
			title,
			className,
			children: inner
		});
	}
	const stageLabel = ponsStageLabel(pair);
	let dexName = stageLabel || (isPumpSwap ? "PumpSwap" : pair.primaryDex);
	if (!dexName) dexName = normalizeDexName(pair.dexId || pair.primaryProvider);
	const storedLogo = pair.primaryDexLogo?.endsWith("/argus.svg") ? "/argus.png" : pair.primaryDexLogo;
	const logoUrl = stageLabel ? getDexLogo("pons") : (dexName === "PumpSwap" ? getDexLogo("pumpswap") : storedLogo) || getDexLogo(dexName || (pair.launchPlatform === "Pump.fun" ? "pumpfun" : "dex"));
	const tradeUrl = safeHref(clientTradeHref(pair, pair.primaryDexTradingUrl || getDexTradingUrl(pair, dexName) || pair.url));
	const className = "inline-flex items-center gap-1.5 text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-[#181926] text-slate-700 dark:text-zinc-200 hover:border-[#ff6b35]/60 hover:text-[#ff6b35] transition cursor-pointer group shadow-2xs whitespace-nowrap";
	const title = `Trade on ${dexName || "DEX"}`;
	const inner = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		logoUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: logoUrl,
			alt: dexName || "DEX",
			referrerPolicy: "no-referrer",
			className: "w-3.5 h-3.5 object-contain rounded-full flex-shrink-0",
			onError: (e) => {
				e.target.style.display = "none";
			}
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-[#ff6b35] flex-shrink-0" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `truncate ${stageLabel ? "max-w-[150px]" : "max-w-[85px]"}`,
			children: dexName || "DEX"
		}),
		tradeUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "w-2.5 h-2.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" }) : null
	] });
	if (!tradeUrl) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		title,
		className,
		children: inner
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
		href: tradeUrl,
		target: "_blank",
		rel: "noopener noreferrer",
		onClick: (e) => e.stopPropagation(),
		title,
		className,
		children: inner
	});
};
var DexIconContainer = ({ pair, size = "md" }) => {
	const [imgError, setImgError] = (0, import_react.useState)(false);
	const isPumpSwap = hasVerifiedPumpSwapPool(pair);
	const isPumpBonding = isPumpToken(pair) && isBondingCurveToken(pair) && !isPumpSwap;
	let dexName = isPumpSwap ? "PumpSwap" : pair.primaryDex;
	if (!dexName) dexName = isPumpBonding ? "Pump.fun" : normalizeDexName(pair.dexId || pair.primaryProvider);
	const storedLogo = pair.primaryDexLogo?.endsWith("/argus.svg") ? "/argus.png" : pair.primaryDexLogo;
	const logoUrl = (dexName === "PumpSwap" ? getDexLogo("pumpswap") : storedLogo) || getDexLogo(dexName || (isPumpBonding ? "pumpfun" : "dex"));
	const tradeUrl = safeHref(clientTradeHref(pair, (dexName === "PumpSwap" ? getDexTradingUrl(pair, "PumpSwap") : pair.primaryDexTradingUrl) || getDexTradingUrl(pair, dexName) || pair.url));
	const containerClass = size === "sm" ? "w-7 h-7 min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px] rounded-lg overflow-hidden aspect-square" : "w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] rounded-xl overflow-hidden aspect-square";
	const imgClass = size === "sm" ? "w-4 h-4 min-w-[16px] min-h-[16px] max-w-[16px] max-h-[16px]" : "w-5 h-5 min-w-[20px] min-h-[20px] max-w-[20px] max-h-[20px]";
	const className = `${containerClass} p-1 border border-slate-200/90 dark:border-zinc-800 bg-slate-100/90 dark:bg-[#181926] shadow-2xs hover:border-[#ff6b35]/60 hover:bg-[#ff6b35]/10 hover:scale-105 active:scale-95 transition-all duration-150 flex items-center justify-center flex-shrink-0 aspect-square cursor-pointer group relative before:absolute before:-inset-2 sm:before:hidden touch-manipulation`;
	const inner = logoUrl && !imgError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: logoUrl,
		alt: dexName || "DEX",
		referrerPolicy: "no-referrer",
		onError: () => setImgError(true),
		className: `${imgClass} object-contain flex-shrink-0 group-hover:scale-110 transition-transform duration-150`
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "font-mono text-[9px] font-bold text-zinc-400 group-hover:text-[#ff6b35] uppercase truncate",
		children: (dexName || "DEX").slice(0, 3)
	});
	if (!tradeUrl) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		title: `Trade on ${dexName || "DEX"}`,
		"aria-label": `Trade on ${dexName || "DEX"}`,
		className,
		children: inner
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
		href: tradeUrl,
		target: "_blank",
		rel: "noopener noreferrer",
		onClick: (e) => e.stopPropagation(),
		title: `Trade on ${dexName || "DEX"}`,
		"aria-label": `Trade on ${dexName || "DEX"}`,
		className,
		children: inner
	});
};
var formatTimeAgo = (timestampMs) => {
	const ts = toMillis(timestampMs);
	if (!ts) return null;
	const diffMs = Date.now() - ts;
	if (diffMs <= 0) return "Just now";
	const diffSec = Math.floor(diffMs / 1e3);
	if (diffSec < 60) return `${diffSec}s ago`;
	const diffMin = Math.floor(diffSec / 60);
	if (diffMin < 60) return `${diffMin}m ago`;
	const diffHr = Math.floor(diffMin / 60);
	if (diffHr < 24) return `${diffHr}h ${diffMin % 60}m ago`;
	const diffDay = Math.floor(diffHr / 24);
	if (diffDay < 30) {
		const remainingHr = diffHr % 24;
		return remainingHr > 0 ? `${diffDay}d ${remainingHr}h ago` : `${diffDay}d ago`;
	}
	const diffMonth = Math.floor(diffDay / 30);
	if (diffMonth < 12) {
		const remDays = diffDay % 30;
		return remDays > 0 ? `${diffMonth}mo ${remDays}d ago` : `${diffMonth}mo ago`;
	}
	const diffYear = Math.floor(diffDay / 365);
	const remMonths = Math.floor(diffDay % 365 / 30);
	return remMonths > 0 ? `${diffYear}y ${remMonths}mo ago` : `${diffYear}y ago`;
};
function formatCurrency(val) {
	if (val === void 0 || val === null || val === "") return "—";
	const num = Number(val);
	if (isNaN(num)) return "—";
	if (num === 0) return "$0";
	if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
	if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
	if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
	return `$${num.toLocaleString(void 0, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})}`;
}
function formatPercent(val) {
	if (val === void 0 || val === null || val === "") return {
		text: "—",
		isPositive: false,
		isNeutral: true
	};
	const num = Number(val);
	if (isNaN(num)) return {
		text: "—",
		isPositive: false,
		isNeutral: true
	};
	if (num === 0) return {
		text: "0.0%",
		isPositive: true,
		isNeutral: true
	};
	const isPositive = num > 0;
	const absVal = Math.abs(num);
	const formatted = absVal >= 1e3 ? `${absVal.toFixed(0)}%` : `${absVal.toFixed(1)}%`;
	return {
		text: `${isPositive ? "+" : "-"}${formatted}`,
		isPositive,
		isNeutral: false
	};
}
var CompactTableView = ({ pairs, totalCount, currentPage, pageSize, loading, sortBy, onSortChange, isDarkMode, theme, copiedAddress, onCopyAddress, expandedRowKeys, onToggleExpandRow, tokenHoldersData, onFetchHolders }) => {
	const [hoveredRow, setHoveredRow] = (0, import_react.useState)(null);
	const [expandedHolderSections, setExpandedHolderSections] = (0, import_react.useState)({});
	const renderSortIndicator = (columnSortId) => {
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `inline-flex items-center ml-1 transition-colors ${sortBy === columnSortId ? "text-[#ff6b35]" : "opacity-30 group-hover:opacity-70"}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpDown, { className: "w-3 h-3" })
		});
	};
	const renderExpandedDiagnostics = (pair, tokenAddress) => {
		const symbol = displaySymbol(pair);
		const fullName = displayName(pair, symbol);
		const holdersScan = tokenAddress ? tokenHoldersData[holderCacheKey(pair.chainId, tokenAddress)] : void 0;
		const normalizedHolders = (holdersScan?.topHolders || []).map((h, i) => ({
			ownerAddress: h.ownerAddress || h.address || `Holder-${i + 1}`,
			balance: h.balance,
			balanceFormatted: h.balanceFormatted,
			percentageRelativeToTotalSupply: Number(h.percentageRelativeToTotalSupply ?? h.percentage ?? 0),
			isContract: h.isContract,
			label: h.label
		}));
		const buys24h = pair.txns?.h24?.buys;
		const sells24h = pair.txns?.h24?.sells;
		const totalTxns = buys24h !== void 0 && sells24h !== void 0 ? buys24h + sells24h : null;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "p-2 sm:p-2.5 space-y-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-black/10 dark:bg-black/25 border border-slate-200/60 dark:border-zinc-800/80",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1.5 min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-zinc-400 font-sans uppercase font-medium tracking-wide flex-shrink-0",
								children: "Coin:"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold text-xs sm:text-sm text-slate-900 dark:text-zinc-100 tracking-tight truncate",
								title: fullName,
								children: fullName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-xs text-zinc-500 dark:text-zinc-400 font-semibold flex-shrink-0",
								children: [
									"($",
									symbol,
									")"
								]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center gap-1.5 flex-shrink-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "uppercase text-[9.5px] px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-zinc-800/80 font-mono font-bold text-slate-700 dark:text-zinc-300 border border-slate-300/40 dark:border-zinc-700/40",
							children: pair.chainId
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2 rounded-xl bg-black/10 dark:bg-black/25 border border-inherit text-xs font-mono",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-0.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-zinc-400 font-sans",
									children: "Pool Liquidity"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-slate-800 dark:text-zinc-100",
									children: formatCurrency(pair.liquidity?.usd ?? pair.totalLiquidityUsd)
								}),
								pair.quoteToken?.symbol && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-[9.5px] text-zinc-400",
									children: ["Paired with ", pair.quoteToken.symbol]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-0.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-zinc-400 font-sans",
									children: "24h Transactions"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-slate-800 dark:text-zinc-100",
									children: totalTxns !== null ? totalTxns.toLocaleString() : "Active Pool"
								}),
								totalTxns !== null && totalTxns > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-[9.5px] text-zinc-400",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-emerald-500 font-bold",
											children: [buys24h, "B"]
										}),
										" / ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-rose-500 font-bold",
											children: [sells24h, "S"]
										})
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-[9.5px] text-zinc-400",
									children: ["FDV: ", fdvOf(pair) == null ? "—" : formatCurrency(fdvOf(pair))]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-0.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-zinc-400 font-sans",
									children: "Migration & Stage"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center gap-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-bold text-slate-800 dark:text-zinc-100",
										children: pair.isBondingCurve ? "Bonding Curve" : pair.isGraduated ? "Graduated Pool" : "Standard Pool"
									})
								}),
								typeof pair.bondingProgress === "number" && pair.bondingProgress > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-0.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between text-[9.5px]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-emerald-500 font-medium",
											children: "Bonding:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-emerald-500 font-bold font-mono",
											children: [pair.bondingProgress.toFixed(1), "%"]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-full bg-slate-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "bg-emerald-500 h-full rounded-full transition-all duration-500",
											style: { width: `${Math.min(100, Math.max(0, pair.bondingProgress))}%` }
										})
									})]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[9.5px] text-zinc-400",
									children: pair.isGraduated ? "Migrated to AMM" : "Live Liquidity"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-0.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-zinc-400 font-sans",
									children: "Pool Age"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-slate-800 dark:text-zinc-100",
									children: formatTimeAgo(pair.pairCreatedAt) ?? "Unknown"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-[9.5px] text-zinc-400 truncate",
									title: pair.pairAddress,
									children: ["Pair: ", pair.pairAddress ? `${pair.pairAddress.slice(0, 4)}...${pair.pairAddress.slice(-4)}` : "Verified"]
								})
							]
						}),
						pair.isPonsLaunch && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "col-span-full px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-300",
							children: [ponsStageLabel(pair) || "Pons", pair.bondingProgress != null ? ` · curve ${Number(pair.bondingProgress).toFixed(1)}%` : ""]
						}),
						pair.isArgusLaunch && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "col-span-full p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex flex-col gap-1.5 text-[11px]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between font-bold text-emerald-400",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Argus Protocol" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono",
										children: pair.argusLiquidityLocked ? "Locked (Uniswap v4)" : "Active Launch"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10.5px]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-zinc-400 block text-[9.5px]",
											children: "Dev Buy Tier:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: `font-semibold ${pair.argusDevBuyTier === "safe" ? "text-emerald-400" : pair.argusDevBuyTier === "moderate" ? "text-amber-400" : pair.argusDevBuyTier === "high_snipe" ? "text-rose-400" : "text-zinc-300"}`,
											children: [
												pair.argusDevBuyTier?.toUpperCase() || "SAFE",
												" ($",
												(pair.argusDevBuyUsdc ?? 0).toFixed(1),
												")"
											]
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-zinc-400 block text-[9.5px]",
											children: "Social Audit:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `font-semibold ${pair.argusReusedSocials?.hasReusedSocials ? "text-amber-400" : "text-emerald-400"}`,
											children: pair.argusReusedSocials?.hasReusedSocials ? "Reused Socials Flagged" : "Clean / Unique"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-zinc-400 block text-[9.5px]",
											children: "Taxes / Base Fee:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-zinc-200",
											children: [
												((pair.argusBuyTaxBps || 0) / 100).toFixed(1),
												"% / ",
												((pair.argusSellTaxBps || 0) / 100).toFixed(1),
												"% + ",
												((pair.argusBaseFeeBps || 100) / 100).toFixed(1),
												"%"
											]
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-zinc-400 block text-[9.5px]",
											children: "Portal Family:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-zinc-300",
											children: pair.argusPortalFamily || "hooked v4"
										})] })
									]
								}),
								pair.argusReusedSocials?.hasReusedSocials && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-[10px] text-amber-300/90 bg-amber-500/10 p-1.5 rounded border border-amber-500/20",
									children: [
										"Warning: ",
										pair.argusReusedSocials.warningMessage || "Reused social links detected across prior token launches.",
										" (Seen in ",
										pair.argusReusedSocials.matchedTokens?.length || pair.argusReusedSocials.duplicateCount || 1,
										" prior launch)"
									]
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `rounded-xl border overflow-hidden transition-all duration-200 ${isDarkMode ? "bg-[#181926] border-zinc-800/80" : "bg-white border-slate-200"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-2 sm:p-2.5 flex items-center justify-between border-b border-inherit bg-black/10 dark:bg-black/20",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 flex-wrap",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "w-3.5 h-3.5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-bold text-emerald-400",
									children: "On-Chain Holders & Token Supply Breakdown"
								}),
								typeof holdersScan?.top10SupplyPercentage === "number" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: `px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${holdersScan.top10SupplyPercentage > 50 ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`,
									children: [
										"Top 10: ",
										holdersScan.top10SupplyPercentage.toFixed(1),
										"%"
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [holdersScan?.totalHolders ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-[11px] text-zinc-400",
								children: ["Total: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-zinc-200",
									children: holdersScan.totalHolders.toLocaleString()
								})]
							}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: (e) => {
									e.stopPropagation();
									onFetchHolders(tokenAddress, pair.chainId, true, pair.pairAddress);
								},
								disabled: holdersScan?.loading,
								className: "px-2 py-1 rounded-lg border border-inherit text-[10.5px] font-medium text-zinc-300 hover:text-white hover:border-[#ff6b35] transition-all flex items-center gap-1 cursor-pointer",
								title: "Scan Live On-Chain Holders",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: `w-3 h-3 ${holdersScan?.loading ? "animate-spin text-[#ff6b35]" : ""}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden sm:inline",
									children: holdersScan?.loading ? "Scanning..." : "Rescan"
								})]
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "p-2.5 sm:p-3.5 space-y-2.5",
						children: holdersScan?.loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "py-6 text-center flex flex-col items-center justify-center space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "w-6 h-6 text-[#ff6b35] animate-spin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-zinc-400 font-mono",
								children: "Scanning on-chain accounts & token distribution..."
							})]
						}) : normalizedHolders.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2.5",
							children: [typeof holdersScan?.top10SupplyPercentage === "number" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5 p-2 rounded-xl bg-black/20 dark:bg-black/30 border border-inherit text-xs",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between text-[11px]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: theme.textMuted,
											children: "Top 10 Supply Concentration:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: `font-mono font-bold ${holdersScan.top10SupplyPercentage > 50 ? "text-rose-500" : "text-emerald-500"}`,
											children: [holdersScan.top10SupplyPercentage.toFixed(1), "%"]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: `h-full rounded-full transition-all duration-700 ${holdersScan.top10SupplyPercentage > 50 ? "bg-rose-500" : "bg-emerald-500"}`,
											style: { width: `${Math.min(holdersScan.top10SupplyPercentage, 100)}%` }
										})
									}),
									holdersScan.top10SupplyPercentage > 50 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] text-rose-500 font-medium",
										children: "⚠️ Top 10 wallets control over 50% of supply. High dumping risk."
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 md:grid-cols-2 gap-3 items-start",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-full",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HoldersPieChart, {
										topHolders: normalizedHolders,
										top10SupplyPercentage: holdersScan?.top10SupplyPercentage,
										isDarkMode
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5 p-2.5 rounded-xl bg-black/20 dark:bg-black/30 border border-inherit text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between text-[10px] uppercase font-mono tracking-wider font-semibold opacity-70 pb-1 border-b border-inherit",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Holder Address" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "% Supply" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "space-y-1 max-h-52 overflow-y-auto pr-1 custom-scrollbar",
										children: normalizedHolders.slice(0, 8).map((holder, hIdx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: `flex items-center justify-between gap-2 p-1.5 rounded-lg font-mono text-[10.5px] border ${isDarkMode ? "bg-zinc-900/60 border-zinc-800/60" : "bg-white border-slate-200/80"}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-1.5 min-w-0",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "opacity-40 text-[9px]",
														children: ["#", hIdx + 1]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "truncate",
														title: holder.ownerAddress,
														children: holder.ownerAddress.length > 10 ? `${holder.ownerAddress.slice(0, 4)}...${holder.ownerAddress.slice(-4)}` : holder.ownerAddress
													}),
													holder.label && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "px-1 py-0.2 rounded text-[9px] font-sans bg-emerald-500/15 text-emerald-500 font-medium truncate max-w-[80px]",
														children: holder.label === "Simple7702Account" ? "7702" : holder.label
													}),
													!holder.label && holder.isContract && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "px-1 py-0.2 rounded text-[9px] font-sans bg-purple-500/15 text-purple-400 font-medium",
														children: "Contract"
													})
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex items-center gap-1.5 flex-shrink-0",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-semibold text-zinc-300",
													children: holder.percentageRelativeToTotalSupply > 0 ? `${holder.percentageRelativeToTotalSupply.toFixed(2)}%` : "<0.01%"
												})
											})]
										}, `${holder.ownerAddress}-${hIdx}`))
									})]
								})]
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "py-6 text-center flex flex-col items-center justify-center space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-zinc-400",
								children: holdersScan?.error || "Holder distribution data ready to scan on-chain."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: (e) => {
									e.stopPropagation();
									onFetchHolders(tokenAddress, pair.chainId, true, pair.pairAddress);
								},
								className: "px-3 py-1.5 rounded-lg bg-[#ff6b35] text-white text-xs font-bold hover:bg-[#ff5722] transition-colors cursor-pointer",
								children: "Scan On-Chain Holders"
							})]
						})
					})]
				})
			]
		});
	};
	if (loading && pairs.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `w-full overflow-hidden border rounded-2xl ${theme.bgCard} shadow-xs`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "md:hidden divide-y divide-slate-100 dark:divide-zinc-800/40",
			children: Array.from({ length: 8 }).map((_, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-3 flex items-center justify-between gap-3 animate-pulse",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2.5 min-w-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-4 h-3 bg-slate-200 dark:bg-zinc-800 rounded" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-8 h-8 rounded-lg bg-slate-200 dark:bg-zinc-800" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-16 h-3 bg-slate-200 dark:bg-zinc-800 rounded" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-24 h-2 bg-slate-200 dark:bg-zinc-800/60 rounded" })]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1 text-right",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-14 h-3 bg-slate-200 dark:bg-zinc-800 rounded ml-auto" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-10 h-2 bg-slate-200 dark:bg-zinc-800/60 rounded ml-auto" })]
				})]
			}, idx))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "hidden md:block overflow-x-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full text-left border-collapse min-w-[900px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: `border-b ${isDarkMode ? "bg-[#111218] border-zinc-800/80" : "bg-slate-50 border-slate-200"} text-[11px] font-semibold uppercase text-zinc-400`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-2.5 px-3 w-12 text-center",
							children: "#"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-2.5 px-3 min-w-[200px]",
							children: "Token"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-2.5 px-3 text-right",
							children: "Price"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-2.5 px-3 text-right",
							children: "24h Change"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-2.5 px-3 text-right",
							children: "24h Vol"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-2.5 px-3 text-right",
							children: "Liquidity"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-2.5 px-3 text-right",
							children: "Market Cap"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-2.5 px-3",
							children: "DEX"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-2.5 px-3 text-center",
							children: "Score"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-2.5 px-3 text-center",
							children: "Actions"
						})
					]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
					className: "divide-y divide-slate-100 dark:divide-zinc-800/50",
					children: Array.from({ length: 10 }).map((_, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "animate-pulse",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 px-3 text-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-4 bg-slate-200 dark:bg-zinc-800 rounded mx-auto" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 px-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-7 h-7 bg-slate-200 dark:bg-zinc-800 rounded-lg" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2.5 w-24 bg-slate-200 dark:bg-zinc-800/60 rounded" })]
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 px-3 text-right",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded ml-auto" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 px-3 text-right",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-12 bg-slate-200 dark:bg-zinc-800 rounded ml-auto" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 px-3 text-right",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded ml-auto" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 px-3 text-right",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-14 bg-slate-200 dark:bg-zinc-800 rounded ml-auto" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 px-3 text-right",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded ml-auto" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 px-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-4 w-18 bg-slate-200 dark:bg-zinc-800 rounded-full" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 px-3 text-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-4 w-10 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 px-3 text-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-6 w-14 bg-slate-200 dark:bg-zinc-800 rounded mx-auto" })
							})
						]
					}, idx))
				})]
			})
		})]
	});
	if (pairs.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `w-full py-12 border rounded-2xl ${theme.bgCard} text-center flex flex-col items-center justify-center p-6 shadow-xs`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-2.5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "w-6 h-6" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: `text-sm font-bold ${theme.textTitle} mb-1`,
				children: "No tokens found"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: `text-xs ${theme.textSub} max-w-sm`,
				children: "No tokens match your current filter and sort criteria in compact view."
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `w-full overflow-hidden border rounded-2xl ${theme.bgCard} shadow-xs transition-colors duration-200`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `px-3 py-1.5 border-b ${isDarkMode ? "bg-[#111218]/80 border-zinc-800/80" : "bg-slate-50 border-slate-200"} flex items-center justify-between text-[11px]`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1.5 font-mono text-zinc-400",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "w-3 h-3 text-[#ff6b35]" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"Showing ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: `font-semibold ${theme.textTitle}`,
								children: pairs.length
							}),
							" of ",
							totalCount,
							" tokens"
						] }),
						loading && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1 text-[10px] text-[#ff6b35] font-medium animate-pulse ml-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "w-2.5 h-2.5 animate-spin" }), "Syncing"]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-[10px] font-mono text-zinc-400",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hidden sm:inline opacity-70",
						children: "Tap row for holders & trade details"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "px-1.5 py-0.5 rounded bg-zinc-800/50 dark:bg-zinc-800/80 border border-zinc-700/50",
						children: ["Page ", currentPage]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "md:hidden px-2 py-1.5 border-b border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-[#13141f]/70 flex items-center gap-1 overflow-x-auto no-scrollbar text-[11px]",
				children: [
					["volume", "Vol"],
					["liquidity", "Liq"],
					["price", "Price"],
					["priceChange", "24h"],
					["marketCap", "MCap"],
					["newest", "Age"]
				].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onSortChange(id),
					className: `px-2.5 py-1 rounded-full text-[11px] font-medium font-mono whitespace-nowrap transition cursor-pointer min-h-[30px] touch-manipulation ${sortBy === id ? "bg-[#ff6b35] text-white" : "bg-slate-200/70 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300"}`,
					children: label
				}, id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "md:hidden divide-y divide-slate-100 dark:divide-zinc-800/60",
				children: pairs.map((pair, idx) => {
					const rankIndex = (currentPage - 1) * pageSize + idx + 1;
					const cardKey = tokenIdentityKey(pair);
					const tokenAddress = pair.baseToken?.address || "";
					const isExpanded = Boolean(expandedRowKeys[cardKey]);
					const symbol = displaySymbol(pair);
					const name = displayName(pair, symbol);
					const priceChange = formatPercent(pair.priceChange?.h24);
					const socials = extractTokenSocials(pair);
					const hasSocials = Boolean(socials.tgUrl || socials.twProfileUrl || socials.twPostUrl || socials.webUrl || socials.discordUrl);
					const isNewToken = isNewerThan(pair.pairCreatedAt, 36e5);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `transition-colors duration-150 ${isExpanded ? isDarkMode ? "bg-[#181926]/90" : "bg-slate-100/90" : idx % 2 === 1 ? isDarkMode ? "bg-[#12131d]/40" : "bg-slate-50/40" : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							onClick: () => onToggleExpandRow(cardKey, tokenAddress, pair.chainId, pair.pairAddress),
							className: "px-2.5 py-2.5 sm:px-3 sm:py-3 min-h-[72px] sm:min-h-[76px] flex items-center justify-between gap-1.5 sm:gap-2 cursor-pointer select-none active:bg-black/5 dark:active:bg-white/5 transition-colors",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 min-w-0 flex items-center gap-2 sm:gap-2.5 pr-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 w-4 text-center flex-shrink-0 font-semibold",
											children: rankIndex
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative flex-shrink-0 w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] aspect-square",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TokenImage$1, {
												imageUrl: pair.info?.imageUrl,
												symbol,
												address: tokenAddress,
												chainId: pair.chainId,
												className: "w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] aspect-square"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "absolute -bottom-1 -right-1 w-3.5 h-3.5 min-w-[14px] min-h-[14px] rounded-full bg-slate-950 p-px border border-zinc-700 shadow-2xs flex items-center justify-center overflow-hidden flex-shrink-0 z-10",
												title: `Chain: ${pair.chainId?.toUpperCase()}`,
												"aria-label": `Chain: ${pair.chainId?.toUpperCase()}`,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChainIcon$1, { chainId: pair.chainId })
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0 flex-1 overflow-hidden flex flex-col justify-center",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-1 min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: `font-bold font-mono text-[12.5px] sm:text-[13.5px] tracking-tight ${theme.textTitle} truncate`,
													children: symbol
												}), tokenAddress && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: (e) => {
														e.stopPropagation();
														onCopyAddress(tokenAddress);
													},
													className: `p-1 rounded transition-colors relative before:absolute before:-inset-2 sm:before:hidden touch-manipulation cursor-pointer flex-shrink-0 ${copiedAddress === tokenAddress ? "text-emerald-400" : "text-zinc-400 hover:text-[#ff6b35] opacity-60 hover:opacity-100"}`,
													title: `Copy CA: ${tokenAddress}`,
													"aria-label": "Copy Contract Address",
													children: copiedAddress === tokenAddress ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-2.5 h-2.5 text-emerald-400" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "w-2.5 h-2.5" })
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-1 text-[9.5px] sm:text-[10px] text-zinc-500 dark:text-zinc-400 truncate leading-tight mt-0.5",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "truncate opacity-85 font-medium",
														title: name,
														children: name
													}),
													isNewToken && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "px-1 py-0.2 rounded text-[7px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 uppercase flex-shrink-0",
														children: "NEW"
													}),
													pair.argusReusedSocials?.hasReusedSocials && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "px-1 py-0.2 rounded text-[7px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0",
														title: "Reused Socials detected",
														children: "REUSED"
													})
												]
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "w-[125px] xs:w-[136px] sm:w-[155px] flex-shrink-0 grid grid-rows-2 gap-0.5 items-center justify-center text-center px-0.5 sm:px-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap leading-tight",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormattedPrice, {
											value: pair.priceUsd,
											className: `text-xs sm:text-[13px] font-mono font-bold ${theme.textTitle} whitespace-nowrap`
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `inline-flex items-center font-mono font-semibold text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${priceChange.isNeutral ? "text-zinc-400" : priceChange.isPositive ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"}`,
											children: priceChange.text
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-center gap-1 sm:gap-1.5 text-[9.5px] sm:text-[10px] font-mono text-zinc-500 dark:text-zinc-400 whitespace-nowrap leading-tight",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "whitespace-nowrap flex items-center gap-0.5",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-zinc-400 dark:text-zinc-500 font-sans font-normal text-[8.5px] sm:text-[9px]",
														children: "V:"
													}),
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-semibold text-slate-700 dark:text-zinc-200",
														children: formatCurrency(volumeForDisplay(pair))
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-zinc-400 dark:text-zinc-600 font-bold select-none",
												children: "·"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "whitespace-nowrap flex items-center gap-0.5",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-zinc-400 dark:text-zinc-500 font-sans font-normal text-[8.5px] sm:text-[9px]",
														children: "MC:"
													}),
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-semibold text-slate-700 dark:text-zinc-200",
														children: formatCurrency(marketCapOf(pair) ?? fdvOf(pair))
													})
												]
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `flex flex-col items-end ${hasSocials ? "justify-center gap-1.5" : "justify-center"} flex-shrink-0 pl-1 min-w-[48px]`,
									onClick: (e) => e.stopPropagation(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex items-center justify-end w-full",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DexIconContainer, {
											pair,
											size: "sm"
										})
									}), hasSocials && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex items-center justify-end w-full",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SocialLinksRow, {
											pair,
											size: "compact"
										})
									})]
								})
							]
						}), isExpanded && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `border-t ${isDarkMode ? "border-zinc-800 bg-[#141522]" : "border-slate-200 bg-slate-100"}`,
							children: renderExpandedDiagnostics(pair, tokenAddress)
						})]
					}, cardKey);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hidden md:block overflow-x-auto custom-scrollbar",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-left border-collapse min-w-[980px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: `border-b ${isDarkMode ? "bg-[#111218]/90 border-zinc-800/90 text-zinc-400" : "bg-slate-100/90 border-slate-200 text-slate-600"} text-[11px] font-semibold uppercase tracking-wider select-none sticky top-0 z-20 backdrop-blur-md`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: `py-2.5 px-3 w-12 text-center cursor-pointer group hover:text-[#ff6b35] transition-colors sticky left-0 z-20 ${isDarkMode ? "bg-[#111218]" : "bg-slate-100"}`,
								onClick: () => onSortChange("none"),
								title: "Sort by Trending",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "#" }), renderSortIndicator("none")]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: `py-2.5 px-3 min-w-[200px] cursor-pointer group hover:text-[#ff6b35] transition-colors sticky left-12 z-20 border-r ${isDarkMode ? "bg-[#111218] border-zinc-800/80" : "bg-slate-100 border-slate-200"}`,
								onClick: () => onSortChange("newest"),
								title: "Sort by Newest Token",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Token" }), renderSortIndicator("newest")]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2.5 px-3 text-right cursor-pointer group hover:text-[#ff6b35] transition-colors",
								onClick: () => onSortChange("price"),
								title: "Sort by Token Price (USD)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-end",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Price (USD)" }), renderSortIndicator("price")]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2.5 px-3 text-right cursor-pointer group hover:text-[#ff6b35] transition-colors",
								onClick: () => onSortChange("priceChange"),
								title: "Sort by 24h Price Change",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-end",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "24h %" }), renderSortIndicator("priceChange")]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2.5 px-3 text-right cursor-pointer group hover:text-[#ff6b35] transition-colors",
								onClick: () => onSortChange("volume"),
								title: "Sort by 24h Volume",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-end",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "24h Vol" }), renderSortIndicator("volume")]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2.5 px-3 text-right cursor-pointer group hover:text-[#ff6b35] transition-colors",
								onClick: () => onSortChange("liquidity"),
								title: "Sort by Liquidity",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-end",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Liquidity" }), renderSortIndicator("liquidity")]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2.5 px-3 text-right cursor-pointer group hover:text-[#ff6b35] transition-colors",
								onClick: () => onSortChange("marketCap"),
								title: "Sort by Market Cap",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-end",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "MCap / FDV" }), renderSortIndicator("marketCap")]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2.5 px-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "DEX & Pool" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2.5 px-3 text-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Score" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2.5 px-3 text-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Socials" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "py-2.5 px-3 text-center w-28",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Actions" })
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
						className: "divide-y divide-slate-100 dark:divide-zinc-800/40 text-xs",
						children: pairs.map((pair, idx) => {
							const rankIndex = (currentPage - 1) * pageSize + idx + 1;
							const cardKey = tokenIdentityKey(pair);
							const tokenAddress = pair.baseToken?.address || "";
							const isExpanded = Boolean(expandedRowKeys[cardKey]);
							const isHovered = hoveredRow === cardKey;
							const symbol = displaySymbol(pair);
							const name = displayName(pair, symbol);
							const priceChange = formatPercent(pair.priceChange?.h24);
							const score = calculateFinalDexHunterScore(pair);
							const socials = extractTokenSocials(pair);
							const isNewToken = isNewerThan(pair.pairCreatedAt, 36e5);
							const direct = clientTradeHref(pair, pair.primaryDexTradingUrl || getDexTradingUrl(pair, pair.primaryDex) || pair.url);
							const ownedLaunchpad = isPonsToken(pair) || isArgusToken(pair) || isPumpToken(pair);
							direct || ownedLaunchpad || `${normalizeChainName(pair.chainId)}${pair.pairAddress || tokenAddress}`;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								onMouseEnter: () => setHoveredRow(cardKey),
								onMouseLeave: () => setHoveredRow(null),
								onClick: () => onToggleExpandRow(cardKey, tokenAddress, pair.chainId, pair.pairAddress),
								className: `transition-colors duration-150 cursor-pointer ${isExpanded ? isDarkMode ? "bg-[#1a1b28] border-b-0" : "bg-slate-100/90 border-b-0" : isHovered ? isDarkMode ? "bg-[#181926]/80" : "bg-slate-50" : idx % 2 === 1 ? isDarkMode ? "bg-[#13141e]/50" : "bg-slate-50/40" : ""}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: `py-2 px-3 text-center font-mono text-[11px] text-zinc-400 sticky left-0 z-10 ${isExpanded ? isDarkMode ? "bg-[#1a1b28]" : "bg-slate-100/90" : isHovered ? isDarkMode ? "bg-[#181926]" : "bg-slate-50" : idx % 2 === 1 ? isDarkMode ? "bg-[#13141e]" : "bg-slate-50" : isDarkMode ? "bg-[#151622]" : "bg-white"}`,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "inline-block w-6 text-center font-medium",
											children: rankIndex
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: `py-2 px-3 sticky left-12 z-10 border-r ${isDarkMode ? "border-zinc-800/80" : "border-slate-200"} ${isExpanded ? isDarkMode ? "bg-[#1a1b28]" : "bg-slate-100/90" : isHovered ? isDarkMode ? "bg-[#181926]" : "bg-slate-50" : idx % 2 === 1 ? isDarkMode ? "bg-[#13141e]" : "bg-slate-50" : isDarkMode ? "bg-[#151622]" : "bg-white"}`,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative flex-shrink-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TokenImage$1, {
													imageUrl: pair.info?.imageUrl,
													symbol,
													address: tokenAddress,
													chainId: pair.chainId
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-black/90 p-px flex items-center justify-center overflow-hidden shadow-xs",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChainIcon$1, { chainId: pair.chainId })
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0 flex-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-1.5 flex-wrap",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: `font-bold font-mono tracking-tight text-[13px] ${theme.textTitle} hover:text-[#ff6b35] transition-colors truncate max-w-[110px]`,
															children: symbol
														}),
														isNewToken && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "px-1 py-0.2 rounded text-[8.5px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 uppercase",
															children: "NEW"
														}),
														pair.argusReusedSocials?.hasReusedSocials && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "px-1 py-0.2 rounded text-[8.5px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30",
															title: "Serial launcher alert: Reused socials",
															children: "⚠️ Reused"
														}),
														tokenAddress && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															onClick: (e) => {
																e.stopPropagation();
																onCopyAddress(tokenAddress);
															},
															title: `Copy CA: ${tokenAddress}`,
															className: `p-0.5 rounded transition-colors ${copiedAddress === tokenAddress ? "text-emerald-400 bg-emerald-500/10" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`,
															children: copiedAddress === tokenAddress ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-2.5 h-2.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "w-2.5 h-2.5" })
														})
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: `text-[11px] ${theme.textMuted} truncate max-w-[140px]`,
													children: name
												})]
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 px-3 text-right font-mono font-medium whitespace-nowrap",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormattedPrice, {
											value: pair.priceUsd,
											className: `text-xs ${theme.textTitle}`
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 px-3 text-right font-mono font-bold whitespace-nowrap",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: `inline-flex items-center justify-end gap-0.5 px-1.5 py-0.5 rounded text-[11px] ${priceChange.isNeutral ? "text-zinc-400" : priceChange.isPositive ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" : "text-rose-600 dark:text-rose-400 bg-rose-500/10"}`,
											children: [!priceChange.isNeutral && (priceChange.isPositive ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "w-3 h-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "w-3 h-3 rotate-180" })), priceChange.text]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 px-3 text-right font-mono font-medium text-slate-800 dark:text-zinc-200 whitespace-nowrap",
										children: formatCurrency(volumeForDisplay(pair))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 px-3 text-right font-mono font-medium text-slate-800 dark:text-zinc-200 whitespace-nowrap",
										children: formatCurrency(pair.liquidity?.usd ?? pair.totalLiquidityUsd)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 px-3 text-right font-mono font-semibold text-slate-900 dark:text-zinc-100 whitespace-nowrap",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-col items-end leading-tight",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatCurrency(marketCapOf(pair) ?? fdvOf(pair)) }), fdvOf(pair) != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-[10px] font-normal text-zinc-500",
												children: ["FDV ", formatCurrency(fdvOf(pair))]
											}) : null]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 px-3 whitespace-nowrap",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DexProtocolBadge$1, { pair })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 px-3 text-center whitespace-nowrap",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10.5px] font-bold border ${score >= 80 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : score >= 50 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`,
											title: `DexHunter Quality Score: ${score}/100`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "w-3 h-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: score })]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 px-3 text-center whitespace-nowrap",
										onClick: (e) => e.stopPropagation(),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-center gap-1",
											children: [
												socials.tgUrl && (safeHref(socials.tgUrl) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
													href: safeHref(socials.tgUrl),
													target: "_blank",
													rel: "noopener noreferrer",
													title: "Telegram Group",
													className: "p-1 rounded hover:text-sky-400 text-zinc-400 transition",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TelegramIcon, { className: "w-3.5 h-3.5 text-sky-400" })
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													title: "Telegram Group",
													className: "p-1 rounded text-zinc-400",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TelegramIcon, { className: "w-3.5 h-3.5 text-sky-400" })
												})),
												socials.twProfileUrl && (safeHref(socials.twProfileUrl) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
													href: safeHref(socials.twProfileUrl),
													target: "_blank",
													rel: "noopener noreferrer",
													title: "X profile",
													className: "p-1 rounded hover:text-white text-zinc-400 transition",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(XIcon, { className: "w-3.5 h-3.5 text-zinc-300" })
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													title: "X profile",
													className: "p-1 rounded text-zinc-400",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(XIcon, { className: "w-3.5 h-3.5 text-zinc-300" })
												})),
												socials.twPostUrl && (safeHref(socials.twPostUrl) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
													href: safeHref(socials.twPostUrl),
													target: "_blank",
													rel: "noopener noreferrer",
													title: "X post",
													className: "p-1 rounded hover:text-white text-zinc-400 transition",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feather, { className: "w-3.5 h-3.5 text-zinc-300" })
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													title: "X post",
													className: "p-1 rounded text-zinc-400",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feather, { className: "w-3.5 h-3.5 text-zinc-300" })
												})),
												socials.webUrl && (safeHref(socials.webUrl) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
													href: safeHref(socials.webUrl),
													target: "_blank",
													rel: "noopener noreferrer",
													title: "Website",
													className: "p-1 rounded hover:text-emerald-400 text-zinc-400 transition",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "w-3.5 h-3.5 text-emerald-400" })
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													title: "Website",
													className: "p-1 rounded text-zinc-400",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "w-3.5 h-3.5 text-emerald-400" })
												})),
												socials.discordUrl && (safeHref(socials.discordUrl) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
													href: safeHref(socials.discordUrl),
													target: "_blank",
													rel: "noopener noreferrer",
													title: "Discord Server",
													className: "p-1 rounded hover:text-[#5865F2] text-zinc-400 transition",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiscordIcon, { className: "w-3.5 h-3.5 text-[#5865F2]" })
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													title: "Discord Server",
													className: "p-1 rounded text-zinc-400",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiscordIcon, { className: "w-3.5 h-3.5 text-[#5865F2]" })
												})),
												!socials.tgUrl && !socials.twProfileUrl && !socials.twPostUrl && !socials.webUrl && !socials.discordUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[11px] text-zinc-500",
													children: "—"
												})
											]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-2 px-3 text-center whitespace-nowrap",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-center gap-1.5",
											onClick: (e) => e.stopPropagation(),
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DexIconContainer, {
													pair,
													size: "sm"
												}),
												safeHref(`https://dexscreener.com/${normalizeChainName(pair.chainId)}/${pair.pairAddress || tokenAddress}`) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
													href: safeHref(`https://dexscreener.com/${normalizeChainName(pair.chainId)}/${pair.pairAddress || tokenAddress}`),
													target: "_blank",
													rel: "noopener noreferrer",
													title: "DexScreener Live Chart",
													className: "w-6.5 h-6.5 min-w-[26px] min-h-[26px] rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-[#1c1d2c] hover:border-sky-500 hover:text-sky-400 text-zinc-400 transition-all flex items-center justify-center cursor-pointer",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartColumn, { className: "w-3 h-3" })
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													title: "DexScreener Live Chart",
													className: "w-6.5 h-6.5 min-w-[26px] min-h-[26px] rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-[#1c1d2c] text-zinc-400 flex items-center justify-center",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartColumn, { className: "w-3 h-3" })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: (e) => {
														e.stopPropagation();
														onToggleExpandRow(cardKey, tokenAddress, pair.chainId, pair.pairAddress);
													},
													title: isExpanded ? "Collapse Token Details" : "Expand Token Details & Holders",
													className: `w-6.5 h-6.5 min-w-[26px] min-h-[26px] rounded-md border transition-all flex items-center justify-center cursor-pointer ${isExpanded ? "bg-[#ff6b35]/20 border-[#ff6b35] text-[#ff6b35]" : "border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-[#1c1d2c] text-zinc-400 hover:text-white"}`,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: `w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-180 text-[#ff6b35]" : ""}` })
												})
											]
										})
									})
								]
							}), isExpanded && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
								className: `border-b ${isDarkMode ? "bg-[#141522] border-zinc-800" : "bg-slate-100 border-slate-300"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									colSpan: 11,
									children: renderExpandedDiagnostics(pair, tokenAddress)
								})
							})] }, cardKey);
						})
					})]
				})
			})
		]
	});
};
var CHAINS = [
	{
		id: "solana",
		label: "Solana"
	},
	{
		id: "ethereum",
		label: "Ethereum"
	},
	{
		id: "base",
		label: "Base"
	},
	{
		id: "bsc",
		label: "BNB Chain"
	},
	{
		id: "arbitrum",
		label: "Arbitrum"
	},
	{
		id: "hyperevm",
		label: "HyperEVM"
	},
	{
		id: "avalanche",
		label: "Avalanche"
	},
	{
		id: "robinhood",
		label: "Robinhood"
	},
	{
		id: "arc",
		label: "Arc"
	}
];
var SOURCES = [
	{
		id: "pumpfun",
		label: "Pump.fun"
	},
	{
		id: "raydium",
		label: "Raydium"
	},
	{
		id: "orca",
		label: "Orca"
	},
	{
		id: "meteora",
		label: "Meteora"
	},
	{
		id: "uniswap",
		label: "Uniswap"
	},
	{
		id: "pancakeswap",
		label: "PancakeSwap"
	},
	{
		id: "aerodrome",
		label: "Aerodrome"
	},
	{
		id: "argus",
		label: "Argus"
	},
	{
		id: "ponscurve",
		label: "Pons bonding curve"
	},
	{
		id: "pons",
		label: "Pons valued"
	}
];
var PAIR_AGE_OPTIONS = [
	{
		id: "all",
		label: "All time"
	},
	{
		id: "1h",
		label: "< 1 hour"
	},
	{
		id: "6h",
		label: "< 6 hours"
	},
	{
		id: "24h",
		label: "< 24 hours"
	},
	{
		id: "48h",
		label: "< 48 hours"
	},
	{
		id: "1w",
		label: "< 1 week"
	},
	{
		id: "1m",
		label: "< 1 month"
	}
];
var VOLUME_PRESETS = [
	1e4,
	5e4,
	1e5,
	5e5
];
var MARKET_CAP_PRESETS = [
	1e5,
	1e6,
	1e7
];
var LIQUIDITY_PRESETS = [
	5e3,
	2e4,
	5e4
];
var CHANGE_PRESETS = [
	0,
	10,
	25,
	100
];
var SOCIAL_LABELS = {
	telegram: "Telegram",
	discord: "Discord",
	website: "Website"
};
var DEFAULT_FILTERS = {
	preset: null,
	chains: [],
	sources: [],
	pairAge: "all",
	volumeMin: null,
	volumeMax: null,
	marketCapMin: null,
	marketCapMax: null,
	liquidityMin: null,
	change24hMin: null,
	social: {
		telegram: "any",
		discord: "any",
		website: "any",
		xProfile: false,
		xPost: false
	},
	verifiedOnly: false
};
function formatCompact(value) {
	if (value >= 1e6) {
		const millions = value / 1e6;
		return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
	}
	if (value >= 1e3) {
		const thousands = value / 1e3;
		return `$${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`;
	}
	return `$${value}`;
}
var FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#151620]";
function XMark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		fill: "currentColor",
		className,
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M18.3 2H21l-7.3 8.3L22 22h-6.6l-5.2-6.6L4.2 22H1.5l7.8-8.9L2 2h6.8l4.7 6.1L18.3 2Zm-1.2 18h1.8L7 4h-1.9l12 16Z" })
	});
}
function DiscordMark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		fill: "currentColor",
		className,
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M20.3 5.4A17.6 17.6 0 0 0 15.9 4l-.3.6c1.6.4 2.9 1 4.2 1.8a14.7 14.7 0 0 0-12.6 0c1.3-.8 2.6-1.4 4.2-1.8L11.1 4a17.5 17.5 0 0 0-4.4 1.4C4 9 3.1 12.5 3.4 16a17.8 17.8 0 0 0 5.2 2.6l.8-1.3c-.8-.3-1.6-.7-2.3-1.2l.5-.4a12.7 12.7 0 0 0 10.8 0l.5.4c-.7.5-1.5.9-2.3 1.2l.8 1.3a17.6 17.6 0 0 0 5.2-2.6c.4-4-.6-7.5-2.3-10.6ZM9.7 13.8c-.8 0-1.5-.8-1.5-1.7 0-1 .6-1.7 1.5-1.7.8 0 1.5.8 1.5 1.7 0 1-.7 1.7-1.5 1.7Zm5.6 0c-.8 0-1.5-.8-1.5-1.7 0-1 .7-1.7 1.5-1.7.9 0 1.5.8 1.5 1.7 0 1-.6 1.7-1.5 1.7Z" })
	});
}
function SourceMark({ id }) {
	const [failed, setFailed] = (0, import_react.useState)(false);
	const src = getDexLogo(id);
	if (!src || failed) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src,
		alt: "",
		onError: () => setFailed(true),
		referrerPolicy: "no-referrer",
		className: "h-4 w-4 shrink-0 rounded-full object-contain"
	});
}
function Section({ title, badge, isOpen, onToggle, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border-b border-slate-200 dark:border-zinc-800",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: onToggle,
			"aria-expanded": isOpen,
			className: `flex w-full items-center justify-between py-3.5 text-left ${FOCUS_RING}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "flex items-center gap-2 text-[14px] font-medium text-slate-900 dark:text-zinc-100",
				children: [title, badge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-full bg-[#ff6b35] px-1.5 py-0.5 text-[11px] font-semibold text-white",
					children: badge
				}) : null]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: `h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 dark:text-zinc-500 ${isOpen ? "rotate-180" : ""}` })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid transition-[grid-template-rows] duration-200 ease-out",
			style: { gridTemplateRows: isOpen ? "1fr" : "0fr" },
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pb-4",
					children
				})
			})
		})]
	});
}
function Chip({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		"aria-pressed": active,
		className: `flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${FOCUS_RING} ${active ? "border-transparent bg-[#ff6b35] text-white" : "border-slate-200 bg-slate-100 text-slate-700 hover:border-[#ff6b35]/40 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300"}`,
		children
	});
}
function LogoChip({ active, label, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		"aria-pressed": active,
		"aria-label": label,
		title: label,
		className: `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${FOCUS_RING} ${active ? "border-[#ff6b35] bg-[#ff6b35]/15 ring-2 ring-[#ff6b35]" : "border-slate-200 bg-white hover:border-[#ff6b35]/40 dark:border-zinc-700 dark:bg-zinc-900"}`,
		children
	});
}
function NumberInput({ value, onChange, placeholder, prefix, suffix }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-1 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-[#ff6b35] dark:border-zinc-800 dark:bg-[#12131c]",
		children: [
			prefix ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[13px] text-slate-400 dark:text-zinc-500",
				children: prefix
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "number",
				inputMode: "decimal",
				value: value ?? "",
				onChange: (e) => onChange(e.target.value === "" ? null : Number(e.target.value)),
				placeholder,
				className: "w-full bg-transparent font-mono text-[13px] text-slate-900 outline-none placeholder:font-sans placeholder:text-slate-400 dark:text-white dark:placeholder:text-zinc-500"
			}),
			suffix ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[13px] text-slate-400 dark:text-zinc-500",
				children: suffix
			}) : null
		]
	});
}
function RangeField({ label, unit, min, max, onMinChange, onMaxChange, presets, presetSide = "min", formatPreset }) {
	const selected = presetSide === "max" ? max : min;
	const setSelected = presetSide === "max" ? onMaxChange : onMinChange;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-2 block text-[13px] font-medium text-slate-600 dark:text-zinc-300",
			children: label
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberInput, {
					value: min,
					onChange: onMinChange,
					placeholder: "Min",
					prefix: unit
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[13px] text-slate-400 dark:text-zinc-500",
					children: "to"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberInput, {
					value: max,
					onChange: onMaxChange,
					placeholder: "Max",
					prefix: unit
				})
			]
		}),
		presets.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 flex gap-1.5 overflow-x-auto pb-0.5",
			children: presets.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
				active: selected === p,
				onClick: () => setSelected(selected === p ? null : p),
				children: formatPreset(p)
			}, p))
		}) : null
	] });
}
function SocialToggle({ icon, label, value, onToggle }) {
	const required = value === "required";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		role: "switch",
		"aria-checked": required,
		onClick: onToggle,
		className: `flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors ${FOCUS_RING} ${required ? "border-[#ff6b35]/50 bg-[#ff6b35]/10" : "border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-800/40"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-center gap-2 text-[13px] text-slate-900 dark:text-zinc-100",
			children: [icon, label]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `text-[11px] font-semibold ${required ? "text-[#ff6b35]" : "text-slate-400 dark:text-zinc-500"}`,
			children: required ? "Required" : "Any"
		})]
	});
}
function FilterPanel({ initialFilters, resultCount, matchCount, onApply, onReset, onClose }) {
	const [filters, setFilters] = (0, import_react.useState)({
		...DEFAULT_FILTERS,
		...initialFilters,
		preset: null,
		social: {
			...DEFAULT_FILTERS.social,
			...initialFilters?.social
		}
	});
	const [chainQuery, setChainQuery] = (0, import_react.useState)("");
	const [openSections, setOpenSections] = (0, import_react.useState)(/* @__PURE__ */ new Set(["networks", "sources"]));
	const [xMenuOpen, setXMenuOpen] = (0, import_react.useState)(() => Boolean(initialFilters?.social?.xProfile || initialFilters?.social?.xPost));
	(0, import_react.useEffect)(() => {
		const root = document.getElementById("filter_drawer_modal");
		const previously = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const focusable = () => Array.from(root?.querySelectorAll("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])") || []);
		focusable()[0]?.focus();
		const onKey = (event) => {
			if (!root) return;
			if (event.key === "Escape") {
				event.preventDefault();
				event.stopPropagation();
				onClose();
				return;
			}
			if (event.key !== "Tab") return;
			const current = focusable();
			if (!current.length) return;
			const first = current[0];
			const last = current[current.length - 1];
			const active = document.activeElement;
			if (event.shiftKey && (active === first || !root.contains(active))) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && (active === last || !root.contains(active))) {
				event.preventDefault();
				first.focus();
			}
		};
		window.addEventListener("keydown", onKey, true);
		return () => {
			window.removeEventListener("keydown", onKey, true);
			previously?.focus();
		};
	}, [onClose]);
	const toggleSection = (id) => {
		setOpenSections((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};
	const toggleChain = (id) => {
		setFilters((prev) => ({
			...prev,
			chains: prev.chains.includes(id) ? prev.chains.filter((x) => x !== id) : [...prev.chains, id]
		}));
	};
	const toggleSource = (id) => {
		setFilters((prev) => ({
			...prev,
			sources: prev.sources.includes(id) ? prev.sources.filter((x) => x !== id) : [...prev.sources, id]
		}));
	};
	const toggleSocial = (platform) => {
		setFilters((prev) => ({
			...prev,
			social: {
				...prev.social,
				[platform]: prev.social[platform] === "any" ? "required" : "any"
			}
		}));
	};
	const resetAll = () => {
		setFilters(DEFAULT_FILTERS);
		setXMenuOpen(false);
		onReset?.();
	};
	const visibleChains = (0, import_react.useMemo)(() => CHAINS.filter((c) => c.label.toLowerCase().includes(chainQuery.toLowerCase())), [chainQuery]);
	const activeChips = (0, import_react.useMemo)(() => {
		const chips = [];
		filters.chains.forEach((id) => {
			const chain = CHAINS.find((c) => c.id === id);
			if (chain) chips.push({
				key: `chain-${id}`,
				label: chain.label,
				onRemove: () => toggleChain(id)
			});
		});
		filters.sources.forEach((id) => {
			const source = SOURCES.find((s) => s.id === id);
			if (source) chips.push({
				key: `source-${id}`,
				label: source.label,
				onRemove: () => toggleSource(id)
			});
		});
		if (filters.pairAge !== "all") {
			const age = PAIR_AGE_OPTIONS.find((a) => a.id === filters.pairAge);
			if (age) chips.push({
				key: "age",
				label: age.label,
				onRemove: () => setFilters((f) => ({
					...f,
					pairAge: "all"
				}))
			});
		}
		if (filters.volumeMin != null) chips.push({
			key: "volmin",
			label: `Vol over ${formatCompact(filters.volumeMin)}`,
			onRemove: () => setFilters((f) => ({
				...f,
				volumeMin: null
			}))
		});
		if (filters.volumeMax != null) chips.push({
			key: "volmax",
			label: `Vol under ${formatCompact(filters.volumeMax)}`,
			onRemove: () => setFilters((f) => ({
				...f,
				volumeMax: null
			}))
		});
		if (filters.marketCapMin != null) chips.push({
			key: "mcmin",
			label: `MCap over ${formatCompact(filters.marketCapMin)}`,
			onRemove: () => setFilters((f) => ({
				...f,
				marketCapMin: null
			}))
		});
		if (filters.marketCapMax != null) chips.push({
			key: "mcmax",
			label: `MCap under ${formatCompact(filters.marketCapMax)}`,
			onRemove: () => setFilters((f) => ({
				...f,
				marketCapMax: null
			}))
		});
		if (filters.liquidityMin != null) chips.push({
			key: "liq",
			label: `Liquidity over ${formatCompact(filters.liquidityMin)}`,
			onRemove: () => setFilters((f) => ({
				...f,
				liquidityMin: null
			}))
		});
		if (filters.change24hMin != null) chips.push({
			key: "chg",
			label: `24h change over ${filters.change24hMin}%`,
			onRemove: () => setFilters((f) => ({
				...f,
				change24hMin: null
			}))
		});
		Object.keys(SOCIAL_LABELS).forEach((platform) => {
			if (filters.social[platform] === "required") chips.push({
				key: `social-${platform}`,
				label: `${SOCIAL_LABELS[platform]} required`,
				onRemove: () => toggleSocial(platform)
			});
		});
		if (filters.social.xProfile) chips.push({
			key: "x-profile",
			label: "X profiles",
			onRemove: () => setFilters((f) => ({
				...f,
				social: {
					...f.social,
					xProfile: false
				}
			}))
		});
		if (filters.social.xPost) chips.push({
			key: "x-post",
			label: "X posts",
			onRemove: () => setFilters((f) => ({
				...f,
				social: {
					...f.social,
					xPost: false
				}
			}))
		});
		if (filters.verifiedOnly) chips.push({
			key: "verified",
			label: "2+ socials",
			onRemove: () => setFilters((f) => ({
				...f,
				verifiedOnly: false
			}))
		});
		return chips;
	}, [filters]);
	const shownCount = matchCount ? matchCount(filters) : resultCount;
	const metricsBadge = [
		filters.volumeMin,
		filters.volumeMax,
		filters.marketCapMin,
		filters.marketCapMax
	].filter((v) => v != null).length || void 0;
	const liquidityBadge = [filters.liquidityMin, filters.change24hMin].filter((v) => v != null).length || void 0;
	const socialBadge = [
		"telegram",
		"discord",
		"website"
	].filter((platform) => filters.social[platform] === "required").length + (filters.social.xProfile ? 1 : 0) + (filters.social.xPost ? 1 : 0) + (filters.verifiedOnly ? 1 : 0) || void 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		id: "filter_drawer_modal",
		role: "dialog",
		"aria-modal": "true",
		"aria-labelledby": "filter_drawer_title",
		className: "flex h-full w-full flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3.5 dark:border-zinc-800",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					id: "filter_drawer_title",
					className: "text-[15px] font-semibold text-slate-900 dark:text-zinc-100",
					children: "Filters"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						id: "btn_reset_filters_header",
						"aria-label": "Reset filters and close",
						onClick: resetAll,
						className: `flex items-center gap-1 rounded px-1 text-[13px] font-medium text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white ${FOCUS_RING}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "h-3.5 w-3.5" }), "Reset"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onClose,
						id: "btn_close_filters_modal",
						"aria-label": "Close filters",
						className: `rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white ${FOCUS_RING}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
					})]
				})]
			}),
			activeChips.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-slate-200 px-4 py-2.5 dark:border-zinc-800",
				children: activeChips.map((chip) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex shrink-0 items-center gap-1 rounded-full bg-[#ff6b35]/10 px-2.5 py-1 text-[12px] font-medium text-[#ff6b35]",
					children: [chip.label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: chip.onRemove,
						"aria-label": `Remove ${chip.label}`,
						className: "rounded-full hover:text-slate-900 dark:hover:text-white",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3 w-3" })
					})]
				}, chip.key))
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 overflow-y-auto px-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
						title: "Networks",
						badge: filters.chains.length || void 0,
						isOpen: openSections.has("networks"),
						onToggle: () => toggleSection("networks"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative mb-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-zinc-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: chainQuery,
								onChange: (e) => setChainQuery(e.target.value),
								placeholder: "Search chains",
								"aria-label": "Search chains",
								className: `w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-[13px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#ff6b35] dark:border-zinc-800 dark:bg-[#12131c] dark:text-white dark:placeholder:text-zinc-500 ${FOCUS_RING}`
							})]
						}), visibleChains.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-1.5",
							children: visibleChains.map((chain) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogoChip, {
								active: filters.chains.includes(chain.id),
								label: chain.label,
								onClick: () => toggleChain(chain.id),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChainIcon$1, {
									chainId: chain.id,
									iconOnly: true
								})
							}, chain.id))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "py-1 text-[12px] text-slate-400 dark:text-zinc-500",
							children: [
								"No chains match \"",
								chainQuery,
								"\""
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						title: "Sources",
						badge: filters.sources.length || void 0,
						isOpen: openSections.has("sources"),
						onToggle: () => toggleSection("sources"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-1.5",
							children: SOURCES.map((source) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogoChip, {
								active: filters.sources.includes(source.id),
								label: source.label,
								onClick: () => toggleSource(source.id),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "relative",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SourceMark, { id: source.id }),
										source.id === "ponscurve" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" }) : null,
										source.id === "pons" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" }) : null
									]
								})
							}, source.id))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						title: "Pair age",
						badge: filters.pairAge !== "all" ? PAIR_AGE_OPTIONS.find((a) => a.id === filters.pairAge)?.label : void 0,
						isOpen: openSections.has("age"),
						onToggle: () => toggleSection("age"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-1.5 overflow-x-auto pb-0.5",
							children: PAIR_AGE_OPTIONS.map((age) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
								active: filters.pairAge === age.id,
								onClick: () => setFilters((f) => ({
									...f,
									pairAge: age.id
								})),
								children: age.label
							}, age.id))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						title: "Volume and market cap",
						badge: metricsBadge,
						isOpen: openSections.has("metrics"),
						onToggle: () => toggleSection("metrics"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RangeField, {
								label: "24h volume",
								unit: "$",
								min: filters.volumeMin,
								max: filters.volumeMax,
								onMinChange: (v) => setFilters((f) => ({
									...f,
									volumeMin: v
								})),
								onMaxChange: (v) => setFilters((f) => ({
									...f,
									volumeMax: v
								})),
								presets: VOLUME_PRESETS,
								formatPreset: (v) => `Over ${formatCompact(v)}`
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RangeField, {
								label: "Market cap",
								unit: "$",
								min: filters.marketCapMin,
								max: filters.marketCapMax,
								onMinChange: (v) => setFilters((f) => ({
									...f,
									marketCapMin: v
								})),
								onMaxChange: (v) => setFilters((f) => ({
									...f,
									marketCapMax: v
								})),
								presets: MARKET_CAP_PRESETS,
								presetSide: "max",
								formatPreset: (v) => `Under ${formatCompact(v)}`
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						title: "Liquidity and momentum",
						badge: liquidityBadge,
						isOpen: openSections.has("liquidity"),
						onToggle: () => toggleSection("liquidity"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-2 block text-[13px] font-medium text-slate-600 dark:text-zinc-300",
									children: "Min liquidity"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberInput, {
									value: filters.liquidityMin,
									onChange: (v) => setFilters((f) => ({
										...f,
										liquidityMin: v
									})),
									placeholder: "Any",
									prefix: "$"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 flex gap-1.5 overflow-x-auto pb-0.5",
									children: LIQUIDITY_PRESETS.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, {
										active: filters.liquidityMin === v,
										onClick: () => setFilters((f) => ({
											...f,
											liquidityMin: f.liquidityMin === v ? null : v
										})),
										children: [formatCompact(v), "+"]
									}, v))
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-2 block text-[13px] font-medium text-slate-600 dark:text-zinc-300",
									children: "Min 24h change"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberInput, {
									value: filters.change24hMin,
									onChange: (v) => setFilters((f) => ({
										...f,
										change24hMin: v
									})),
									placeholder: "Any",
									suffix: "%"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 flex gap-1.5 overflow-x-auto pb-0.5",
									children: CHANGE_PRESETS.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Chip, {
										active: filters.change24hMin === v,
										onClick: () => setFilters((f) => ({
											...f,
											change24hMin: f.change24hMin === v ? null : v
										})),
										children: [
											"+",
											v,
											"%"
										]
									}, v))
								})
							] })]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
						title: "Social and trust",
						badge: socialBadge,
						isOpen: openSections.has("social"),
						onToggle: () => toggleSection("social"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SocialToggle, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-4 w-4" }),
									label: SOCIAL_LABELS.telegram,
									value: filters.social.telegram,
									onToggle: () => toggleSocial("telegram")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex flex-col gap-1.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										"aria-expanded": xMenuOpen,
										"aria-controls": "x-link-filters",
										onClick: () => setXMenuOpen((open) => !open),
										className: `flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors ${FOCUS_RING} ${filters.social.xProfile || filters.social.xPost ? "border-[#ff6b35]/50 bg-[#ff6b35]/10" : "border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-800/40"}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-2 text-[13px] text-slate-900 dark:text-zinc-100",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XMark, { className: "h-4 w-4" }), "X"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `text-[11px] font-semibold ${filters.social.xProfile || filters.social.xPost ? "text-[#ff6b35]" : "text-slate-400 dark:text-zinc-500"}`,
												children: filters.social.xProfile && filters.social.xPost ? "Both" : filters.social.xProfile ? "Profiles" : filters.social.xPost ? "Posts" : "Any"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: `h-3.5 w-3.5 text-slate-400 transition-transform duration-200 dark:text-zinc-500 ${xMenuOpen ? "rotate-180" : ""}` })]
										})]
									})
								}),
								xMenuOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									id: "x-link-filters",
									className: "col-span-2 grid grid-cols-2 gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1.5 dark:border-zinc-800 dark:bg-zinc-900/50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										role: "checkbox",
										"aria-checked": filters.social.xProfile,
										onClick: () => setFilters((f) => ({
											...f,
											social: {
												...f.social,
												xProfile: !f.social.xProfile
											}
										})),
										className: `flex items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-colors ${FOCUS_RING} ${filters.social.xProfile ? "border-[#ff6b35]/50 bg-[#ff6b35]/10" : "border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-800/40"}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-2 text-[12px] text-slate-900 dark:text-zinc-100",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XMark, { className: "h-3.5 w-3.5" }), "X Profiles"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `text-[11px] font-semibold ${filters.social.xProfile ? "text-[#ff6b35]" : "text-slate-400 dark:text-zinc-500"}`,
											children: filters.social.xProfile ? "Required" : "Any"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										role: "checkbox",
										"aria-checked": filters.social.xPost,
										onClick: () => setFilters((f) => ({
											...f,
											social: {
												...f.social,
												xPost: !f.social.xPost
											}
										})),
										className: `flex items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-colors ${FOCUS_RING} ${filters.social.xPost ? "border-[#ff6b35]/50 bg-[#ff6b35]/10" : "border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-800/40"}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-2 text-[12px] text-slate-900 dark:text-zinc-100",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feather, { className: "h-3.5 w-3.5" }), "X Posts"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `text-[11px] font-semibold ${filters.social.xPost ? "text-[#ff6b35]" : "text-slate-400 dark:text-zinc-500"}`,
											children: filters.social.xPost ? "Required" : "Any"
										})]
									})]
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SocialToggle, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiscordMark, { className: "h-4 w-4" }),
									label: SOCIAL_LABELS.discord,
									value: filters.social.discord,
									onToggle: () => toggleSocial("discord")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SocialToggle, {
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "h-4 w-4" }),
									label: SOCIAL_LABELS.website,
									value: filters.social.website,
									onToggle: () => toggleSocial("website")
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/40",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex flex-col text-left",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-2 text-[13px] text-slate-900 dark:text-zinc-100",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-4 w-4 text-[#ff6b35]" }), "At least two social links"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "pl-6 text-[11px] text-slate-500 dark:text-zinc-500",
									children: "Not a verification or safety check"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								role: "switch",
								"aria-checked": filters.verifiedOnly,
								onClick: () => setFilters((f) => ({
									...f,
									verifiedOnly: !f.verifiedOnly
								})),
								className: `relative h-5 w-9 shrink-0 rounded-full transition-colors ${FOCUS_RING} ${filters.verifiedOnly ? "bg-[#ff6b35]" : "bg-slate-200 dark:bg-zinc-700"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform dark:bg-zinc-950 ${filters.verifiedOnly ? "translate-x-4" : "translate-x-0"}` })
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "shrink-0 border-t border-slate-200 px-4 py-3 dark:border-zinc-800",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					id: "btn_apply_filters_modal",
					onClick: () => onApply(filters),
					className: `w-full rounded-xl bg-[#ff6b35] py-3 text-center text-[14px] font-semibold text-white hover:bg-[#ff6b35]/90 ${FOCUS_RING}`,
					children: [shownCount != null ? `Show ${shownCount} results` : "Apply filters", activeChips.length > 0 ? ` (${activeChips.length} active)` : ""]
				})
			})
		]
	});
}
var RobinhoodHolderRpcProvider = class {
	providerKey = "robinhood-blockscout";
	chainDisplayName = "Robinhood Chain";
	chainId = "robinhood";
	rpcUrl = "https://rpc.mainnet.chain.robinhood.com";
	rpcType = "blockscout-evm";
	explorerName = "Robinhood Blockscout";
	explorerBaseUrl = "https://robinhoodchain.blockscout.com";
	getExplorerUrl(identifier, type = "address") {
		const clean = identifier.trim();
		if (!clean) return this.explorerBaseUrl;
		if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
		if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
		return `${this.explorerBaseUrl}/address/${clean}`;
	}
	getScannerParams(tokenAddress, pairAddress) {
		return {
			address: tokenAddress.trim(),
			chainId: this.chainId,
			provider: this.providerKey,
			rpcUrl: this.rpcUrl,
			pairAddress: pairAddress?.trim()
		};
	}
};
var SolanaPumpHolderRpcProvider = class {
	providerKey = "solana-pump";
	chainDisplayName = "Solana";
	chainId = "solana";
	rpcUrl = "https://api.mainnet-beta.solana.com";
	rpcType = "solana-pump";
	explorerName = "Solscan";
	explorerBaseUrl = "https://solscan.io";
	getExplorerUrl(identifier, type = "address") {
		const clean = identifier.trim();
		if (!clean) return this.explorerBaseUrl;
		if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
		if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
		return `${this.explorerBaseUrl}/account/${clean}`;
	}
	getScannerParams(tokenAddress, pairAddress) {
		return {
			address: tokenAddress.trim(),
			chainId: this.chainId,
			provider: this.providerKey,
			rpcUrl: this.rpcUrl,
			pairAddress: pairAddress?.trim()
		};
	}
};
var BaseHolderRpcProvider = class {
	providerKey = "base-evm";
	chainDisplayName = "Base";
	chainId = "base";
	rpcUrl = "https://mainnet.base.org";
	rpcType = "moralis-evm";
	explorerName = "BaseScan";
	explorerBaseUrl = "https://basescan.org";
	getExplorerUrl(identifier, type = "address") {
		const clean = identifier.trim();
		if (!clean) return this.explorerBaseUrl;
		if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
		if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
		return `${this.explorerBaseUrl}/address/${clean}`;
	}
	getScannerParams(tokenAddress, pairAddress) {
		return {
			address: tokenAddress.trim(),
			chainId: this.chainId,
			provider: this.providerKey,
			rpcUrl: this.rpcUrl,
			pairAddress: pairAddress?.trim()
		};
	}
};
var EthereumHolderRpcProvider = class {
	providerKey = "ethereum-evm";
	chainDisplayName = "Ethereum";
	chainId = "ethereum";
	rpcUrl = "https://cloudflare-eth.com";
	rpcType = "moralis-evm";
	explorerName = "Etherscan";
	explorerBaseUrl = "https://etherscan.io";
	getExplorerUrl(identifier, type = "address") {
		const clean = identifier.trim();
		if (!clean) return this.explorerBaseUrl;
		if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
		if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
		return `${this.explorerBaseUrl}/address/${clean}`;
	}
	getScannerParams(tokenAddress, pairAddress) {
		return {
			address: tokenAddress.trim(),
			chainId: this.chainId,
			provider: this.providerKey,
			rpcUrl: this.rpcUrl,
			pairAddress: pairAddress?.trim()
		};
	}
};
var BscHolderRpcProvider = class {
	providerKey = "bsc-evm";
	chainDisplayName = "BNB Chain";
	chainId = "bsc";
	rpcUrl = "https://binance.llamarpc.com";
	rpcType = "moralis-evm";
	explorerName = "BscScan";
	explorerBaseUrl = "https://bscscan.com";
	getExplorerUrl(identifier, type = "address") {
		const clean = identifier.trim();
		if (!clean) return this.explorerBaseUrl;
		if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
		if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
		return `${this.explorerBaseUrl}/address/${clean}`;
	}
	getScannerParams(tokenAddress, pairAddress) {
		return {
			address: tokenAddress.trim(),
			chainId: this.chainId,
			provider: this.providerKey,
			rpcUrl: this.rpcUrl,
			pairAddress: pairAddress?.trim()
		};
	}
};
var ArbitrumHolderRpcProvider = class {
	providerKey = "arbitrum-evm";
	chainDisplayName = "Arbitrum";
	chainId = "arbitrum";
	rpcUrl = "https://arb1.arbitrum.io/rpc";
	rpcType = "moralis-evm";
	explorerName = "Arbiscan";
	explorerBaseUrl = "https://arbiscan.io";
	getExplorerUrl(identifier, type = "address") {
		const clean = identifier.trim();
		if (!clean) return this.explorerBaseUrl;
		if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
		if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
		return `${this.explorerBaseUrl}/address/${clean}`;
	}
	getScannerParams(tokenAddress, pairAddress) {
		return {
			address: tokenAddress.trim(),
			chainId: this.chainId,
			provider: this.providerKey,
			rpcUrl: this.rpcUrl,
			pairAddress: pairAddress?.trim()
		};
	}
};
var PolygonHolderRpcProvider = class {
	providerKey = "polygon-evm";
	chainDisplayName = "Polygon";
	chainId = "polygon";
	rpcUrl = "https://polygon-rpc.com";
	rpcType = "moralis-evm";
	explorerName = "Polygonscan";
	explorerBaseUrl = "https://polygonscan.com";
	getExplorerUrl(identifier, type = "address") {
		const clean = identifier.trim();
		if (!clean) return this.explorerBaseUrl;
		if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
		if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
		return `${this.explorerBaseUrl}/address/${clean}`;
	}
	getScannerParams(tokenAddress, pairAddress) {
		return {
			address: tokenAddress.trim(),
			chainId: this.chainId,
			provider: this.providerKey,
			rpcUrl: this.rpcUrl,
			pairAddress: pairAddress?.trim()
		};
	}
};
var AvalancheHolderRpcProvider = class {
	providerKey = "avalanche-evm";
	chainDisplayName = "Avalanche";
	chainId = "avalanche";
	rpcUrl = "https://api.avax.network/ext/bc/C/rpc";
	rpcType = "generic-rpc";
	explorerName = "Snowtrace";
	explorerBaseUrl = "https://snowtrace.io";
	getExplorerUrl(identifier, type = "address") {
		const clean = identifier.trim();
		if (!clean) return this.explorerBaseUrl;
		if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
		if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
		return `${this.explorerBaseUrl}/address/${clean}`;
	}
	getScannerParams(tokenAddress, pairAddress) {
		return {
			address: tokenAddress.trim(),
			chainId: this.chainId,
			provider: this.providerKey,
			rpcUrl: this.rpcUrl,
			pairAddress: pairAddress?.trim()
		};
	}
};
var CronosHolderRpcProvider = class {
	providerKey = "cronos-evm";
	chainDisplayName = "Cronos";
	chainId = "cronos";
	rpcUrl = "https://evm.cronos.org";
	rpcType = "generic-rpc";
	explorerName = "Cronoscan";
	explorerBaseUrl = "https://cronoscan.com";
	getExplorerUrl(identifier, type = "address") {
		const clean = identifier.trim();
		if (!clean) return this.explorerBaseUrl;
		if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
		if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
		return `${this.explorerBaseUrl}/address/${clean}`;
	}
	getScannerParams(tokenAddress, pairAddress) {
		return {
			address: tokenAddress.trim(),
			chainId: this.chainId,
			provider: this.providerKey,
			rpcUrl: this.rpcUrl,
			pairAddress: pairAddress?.trim()
		};
	}
};
var OptimismHolderRpcProvider = class {
	providerKey = "optimism-evm";
	chainDisplayName = "Optimism";
	chainId = "optimism";
	rpcUrl = "https://mainnet.optimism.io";
	rpcType = "generic-rpc";
	explorerName = "Optimistic Etherscan";
	explorerBaseUrl = "https://optimistic.etherscan.io";
	getExplorerUrl(identifier, type = "address") {
		const clean = identifier.trim();
		if (!clean) return this.explorerBaseUrl;
		if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
		if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
		return `${this.explorerBaseUrl}/address/${clean}`;
	}
	getScannerParams(tokenAddress, pairAddress) {
		return {
			address: tokenAddress.trim(),
			chainId: this.chainId,
			provider: this.providerKey,
			rpcUrl: this.rpcUrl,
			pairAddress: pairAddress?.trim()
		};
	}
};
var GenericEvmHolderRpcProvider = class {
	providerKey;
	chainDisplayName;
	chainId;
	rpcUrl;
	rpcType = "generic-rpc";
	explorerName;
	explorerBaseUrl;
	constructor(chainId) {
		const norm = (chainId || "evm").toLowerCase();
		this.chainId = norm;
		this.providerKey = `${norm}-generic-rpc`;
		if (norm === "optimism" || norm === "op") {
			this.chainDisplayName = "Optimism";
			this.explorerName = "Optimistic Etherscan";
			this.explorerBaseUrl = "https://optimistic.etherscan.io";
		} else if (norm === "avalanche" || norm === "avax" || norm === "43114") {
			this.chainDisplayName = "Avalanche";
			this.explorerName = "Snowtrace";
			this.explorerBaseUrl = "https://snowtrace.io";
		} else if (norm === "cronos" || norm === "cro" || norm === "25") {
			this.chainDisplayName = "Cronos";
			this.explorerName = "Cronoscan";
			this.explorerBaseUrl = "https://cronoscan.com";
		} else if (norm === "sui") {
			this.chainDisplayName = "Sui";
			this.explorerName = "SuiScan";
			this.explorerBaseUrl = "https://suiscan.xyz/mainnet";
		} else if (norm === "aptos") {
			this.chainDisplayName = "Aptos";
			this.explorerName = "Aptos Explorer";
			this.explorerBaseUrl = "https://explorer.aptoslabs.com";
		} else if (norm === "ton") {
			this.chainDisplayName = "TON";
			this.explorerName = "TonScan";
			this.explorerBaseUrl = "https://tonscan.org";
		} else if (norm === "monad") {
			this.chainDisplayName = "Monad";
			this.explorerName = "Monad Explorer";
			this.explorerBaseUrl = "https://monadexplorer.com";
		} else if (norm === "berachain" || norm === "bera") {
			this.chainDisplayName = "Berachain";
			this.explorerName = "BeraScan";
			this.explorerBaseUrl = "https://berascan.com";
		} else {
			this.chainDisplayName = norm.toUpperCase();
			this.explorerName = `${norm.toUpperCase()} Explorer`;
			this.explorerBaseUrl = `https://dexscreener.com/${norm}`;
		}
	}
	getExplorerUrl(identifier, type = "address") {
		const clean = identifier.trim();
		if (!clean) return this.explorerBaseUrl;
		if (this.explorerBaseUrl.includes("dexscreener.com")) return `${this.explorerBaseUrl}/${clean}`;
		if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
		if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
		return `${this.explorerBaseUrl}/address/${clean}`;
	}
	getScannerParams(tokenAddress, pairAddress) {
		return {
			address: tokenAddress.trim(),
			chainId: this.chainId,
			provider: this.providerKey,
			rpcUrl: this.rpcUrl,
			pairAddress: pairAddress?.trim()
		};
	}
};
var robinhoodProvider = new RobinhoodHolderRpcProvider();
var solanaProvider = new SolanaPumpHolderRpcProvider();
var baseProvider = new BaseHolderRpcProvider();
var ethereumProvider = new EthereumHolderRpcProvider();
var bscProvider = new BscHolderRpcProvider();
var arbitrumProvider = new ArbitrumHolderRpcProvider();
var polygonProvider = new PolygonHolderRpcProvider();
var avalancheProvider = new AvalancheHolderRpcProvider();
var cronosProvider = new CronosHolderRpcProvider();
var optimismProvider = new OptimismHolderRpcProvider();
/**
* Generic RPC Provider Resolver
* Dynamically resolves the best chain-specific holder scanner provider.
*/
var UNSUPPORTED_HOLDER_CHAINS = /* @__PURE__ */ new Set([
	"aptos",
	"sui",
	"ton",
	"sui-mainnet",
	"aptos-mainnet",
	"arc"
]);
function isBase58MintLength(address) {
	return !address.startsWith("0x") && address.length >= 32 && address.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(address);
}
var UnsupportedHolderRpcProvider = class {
	providerKey = "unsupported";
	chainDisplayName;
	chainId;
	rpcType = "generic-rpc";
	explorerName = "Unsupported";
	explorerBaseUrl = "";
	constructor(chainId) {
		this.chainId = (chainId || "unknown").toLowerCase();
		this.chainDisplayName = this.chainId;
	}
	getExplorerUrl() {
		return "";
	}
	getScannerParams(tokenAddress, pairAddress) {
		return {
			address: tokenAddress.trim(),
			chainId: this.chainId,
			provider: this.providerKey,
			pairAddress: pairAddress?.trim()
		};
	}
};
function getRpcHolderProvider(chainId, tokenAddress) {
	const normChain = (chainId || "").toLowerCase().trim();
	const address = (tokenAddress || "").trim();
	if (UNSUPPORTED_HOLDER_CHAINS.has(normChain)) return new UnsupportedHolderRpcProvider(normChain);
	if (normChain === "robinhood" || normChain === "robinhoodchain" || normChain === "4663") return robinhoodProvider;
	if (normChain === "solana" || normChain === "sol") return solanaProvider;
	if (!normChain && isBase58MintLength(address)) return solanaProvider;
	if (normChain === "base" || normChain === "8453") return baseProvider;
	if (normChain === "ethereum" || normChain === "eth" || normChain === "1") return ethereumProvider;
	if (normChain === "bsc" || normChain === "bnb" || normChain === "56") return bscProvider;
	if (normChain === "arbitrum" || normChain === "arb" || normChain === "42161") return arbitrumProvider;
	if (normChain === "polygon" || normChain === "matic" || normChain === "137") return polygonProvider;
	if (normChain === "avalanche" || normChain === "avax" || normChain === "43114") return avalancheProvider;
	if (normChain === "cronos" || normChain === "cro" || normChain === "25") return cronosProvider;
	if (normChain === "optimism" || normChain === "op" || normChain === "10") return optimismProvider;
	if (address.startsWith("0x") && /^0x[a-fA-F0-9]{40}$/.test(address)) {
		if (normChain) return new GenericEvmHolderRpcProvider(normChain);
		return ethereumProvider;
	}
	return new UnsupportedHolderRpcProvider(normChain || "unknown");
}
/**
* Unified Token Holder Scanner Function
* Executes the request using the resolved chain RPC provider.
*/
async function executeTokenHoldersScan(tokenAddress, provider, signal, pairAddress) {
	const unsupportedResult = () => ({
		loading: false,
		totalHolders: 0,
		totalSupply: void 0,
		topHolders: [],
		top10SupplyPercentage: void 0,
		chain: provider.chainId,
		providerKey: provider.providerKey,
		providerName: provider.chainDisplayName,
		error: `Holder scanning is not supported for chain: ${provider.chainId || "unknown"}`
	});
	if (provider instanceof UnsupportedHolderRpcProvider || UNSUPPORTED_HOLDER_CHAINS.has((provider.chainId || "").toLowerCase())) return unsupportedResult();
	const params = provider.getScannerParams(tokenAddress, pairAddress);
	const searchParams = new URLSearchParams();
	searchParams.set("address", params.address);
	searchParams.set("chainId", params.chainId);
	searchParams.set("provider", params.provider);
	if (params.pairAddress) searchParams.set("pairAddress", params.pairAddress);
	const res = await fetch(`/api/token-holders?${searchParams.toString()}`, { signal });
	const contentType = res.headers.get("content-type") || "";
	if (!res.ok || !contentType.includes("application/json")) throw new Error(!contentType.includes("application/json") ? "Holder scanner returned a non-JSON response" : `Holder scanner HTTP error ${res.status}`);
	const data = await res.json();
	const top10Raw = data.top10SupplyPercentage;
	const top10Num = top10Raw == null || top10Raw === "" ? NaN : Number(top10Raw);
	return {
		loading: false,
		totalHolders: data.totalHolders || (data.topHolders ? data.topHolders.length : 0),
		totalSupply: data.totalSupply ?? void 0,
		totalSupplyFormatted: data.totalSupplyFormatted ?? void 0,
		decimals: typeof data.decimals === "number" ? data.decimals : void 0,
		supplier: data.supplier || data.creator || data.deployer || void 0,
		creator: data.creator || data.supplier || data.deployer || void 0,
		deployer: data.deployer || data.creator || data.supplier || void 0,
		creationTx: data.creationTx || void 0,
		creationTimestamp: typeof data.creationTimestamp === "number" ? data.creationTimestamp : void 0,
		source: data.source || void 0,
		chain: data.chain || provider.chainId,
		providerKey: provider.providerKey,
		providerName: provider.chainDisplayName,
		topHolders: Array.isArray(data.topHolders) ? data.topHolders : [],
		top10SupplyPercentage: Number.isFinite(top10Num) ? top10Num : void 0,
		error: data.error || (data.topHolders?.length === 0 ? data.message : void 0)
	};
}
var holderListVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: .05,
			delayChildren: .06
		}
	}
};
var holderItemVariants = {
	hidden: {
		opacity: 0,
		y: 7,
		scale: .98
	},
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: {
			duration: .24,
			ease: "easeOut"
		}
	}
};
var SORT_OPTIONS = [
	{
		id: "trending",
		label: "Trending",
		shortLabel: "Trending",
		description: "DexScreener & Axiom real-world momentum ranking",
		explanation: "Real-world trending ranking combining live boosts, multi-interval buy pressure (5m/1h/24h), verified socials, and pool freshness.",
		icon: Flame
	},
	{
		id: "volume",
		label: "Volume (24h)",
		shortLabel: "Volume",
		description: "Highest recent trading activity",
		explanation: "Positions tokens with the greatest 24-hour USD trading volume at the top, surfacing pairs with the most active market turnover.",
		icon: ChartColumn
	},
	{
		id: "liquidity",
		label: "Liquidity",
		shortLabel: "Liquidity",
		description: "Deepest available pool liquidity",
		explanation: "Sorts tokens by total pooled liquidity in descending order, showing pairs with the deepest reserve depth and lowest trade slippage first.",
		icon: Droplets
	},
	{
		id: "priceChange",
		label: "Price Change (24h)",
		shortLabel: "24h Gain",
		description: "Biggest recent price momentum",
		explanation: "Orders tokens by greatest 24-hour percentage price gain descending, highlighting top trending gainers and active breakout runners.",
		icon: TrendingUp
	},
	{
		id: "marketCap",
		label: "Market Cap",
		shortLabel: "Market Cap",
		description: "Largest overall token valuations",
		explanation: "Arranges tokens by circulating market capitalization from highest to lowest, prioritizing large-cap and established valuations.",
		icon: Coins
	},
	{
		id: "newest",
		label: "Newest First",
		shortLabel: "Newest",
		description: "Most recently discovered token pairs",
		explanation: "Orders tokens by initial pool creation timestamp, bringing the freshest mints, new bonding curves, and newly deployed pairs to the top.",
		icon: Sparkles
	},
	{
		id: "price",
		label: "Price (USD)",
		shortLabel: "Price",
		description: "Highest unit token price",
		explanation: "Arranges tokens in descending order by individual token unit price in USD.",
		icon: DollarSign
	}
];
var TokenImage = ({ imageUrl, symbol, address, chainId }) => {
	const [gatewayIdx, setGatewayIdx] = (0, import_react.useState)(0);
	const [useFallbackCdn, setUseFallbackCdn] = (0, import_react.useState)(false);
	const [imgError, setImgError] = (0, import_react.useState)(false);
	const firstLetter = symbol ? symbol.charAt(0).toUpperCase() : "?";
	const canonicalUrl = getCanonicalTokenLogo(chainId, address, symbol);
	(0, import_react.useEffect)(() => {
		setImgError(false);
		setGatewayIdx(0);
		setUseFallbackCdn(false);
	}, [
		imageUrl,
		address,
		canonicalUrl
	]);
	const normChain = chainId?.toLowerCase() === "polygon_pos" ? "polygon" : chainId?.toLowerCase() || "solana";
	const cdnUrl = address ? `https://dd.dexscreener.com/ds-data/tokens/${normChain}/${address}.png` : void 0;
	const normalizedProvidedImage = imageUrl ? normalizeUri(imageUrl, gatewayIdx) : void 0;
	const rawSrc = canonicalUrl || (!useFallbackCdn && normalizedProvidedImage ? normalizedProvidedImage : cdnUrl);
	const currentSrc = rawSrc ? rawSrc.replace(/([?&])width=\d+/g, "$1width=64").replace(/([?&])height=\d+/g, "$1height=64") : void 0;
	if (!currentSrc || imgError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#1c1d2c] border border-slate-200 dark:border-zinc-700/50 flex items-center justify-center font-mono text-xs font-bold text-[#ff6b35] flex-shrink-0",
		title: symbol,
		children: firstLetter
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: currentSrc,
		alt: symbol || "Token Logo",
		loading: "lazy",
		decoding: "async",
		referrerPolicy: "no-referrer",
		onError: () => {
			if (imageUrl && (imageUrl.includes("ipfs") || imageUrl.startsWith("Qm") || imageUrl.startsWith("bafy")) && gatewayIdx < IPFS_GATEWAYS.length - 1) setGatewayIdx((prev) => prev + 1);
			else if (!canonicalUrl && !useFallbackCdn && cdnUrl && currentSrc !== cdnUrl) setUseFallbackCdn(true);
			else setImgError(true);
		},
		className: "w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-zinc-700/50 flex-shrink-0"
	});
};
var ChainIcon = ({ chainId, fallbackClass }) => {
	const [imgError, setImgError] = (0, import_react.useState)(false);
	const norm = normalizeChainName(chainId);
	const logoUrl = {
		solana: "/chains/solana.png",
		bsc: "/chains/bsc.png",
		ethereum: "/chains/ethereum.png",
		base: "/chains/base.png",
		arbitrum: "/chains/arbitrum.png",
		polygon: "/chains/polygon.png",
		avalanche: "/chains/avalanche.png",
		cronos: "/chains/cronos.png",
		optimism: "/chains/optimism.png",
		robinhood: "/chains/robinhood.png",
		hyperevm: "/chains/hyperevm.png",
		arc: "/arc.png"
	}[norm];
	const title = norm === "robinhood" ? "Robinhood" : norm === "arc" ? "Arc" : norm === "bsc" ? "BNB Chain" : norm === "hyperevm" ? "HyperEVM" : norm || chainId;
	if (!logoUrl || imgError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		title,
		className: `inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-[9px] font-bold leading-none ${fallbackClass}`,
		children: (title || "?").slice(0, 1).toUpperCase()
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: logoUrl,
		alt: title,
		title,
		onError: () => setImgError(true),
		referrerPolicy: "no-referrer",
		className: "w-[18px] h-[18px] object-contain flex-shrink-0 rounded-full"
	});
};
var DexProtocolBadge = ({ pair }) => {
	const [imgError, setImgError] = (0, import_react.useState)(false);
	const hasActiveMarketPool = Boolean(pair.isGraduated || pair.marketStage === "graduated" || pair.marketStage === "pumpswap" || pair.marketStage === "raydium" || pair.primaryDex && [
		"pumpswap",
		"orca",
		"meteora",
		"raydium",
		"phoenix",
		"openbook",
		"lifinity"
	].includes(pair.primaryDex.toLowerCase()) || pair.pairs?.some((pr) => [
		"pumpswap",
		"orca",
		"meteora",
		"raydium"
	].some((d) => (pr.dexName || pr.dexId || "").toLowerCase().includes(d))));
	const isPumpBonding = Boolean(pair.chainId === "solana" && (pair.isBondingCurve || pair.marketStage === "bonding_curve" || pair.launchPlatform === "Pump.fun" && !pair.isGraduated && pair.dexId === "pumpfun") && !hasActiveMarketPool);
	const isGraduated = Boolean(hasActiveMarketPool || pair.isGraduated || pair.marketStage === "graduated" || pair.marketStage === "pumpswap" || pair.marketStage === "raydium");
	const progress = typeof pair.bondingProgress === "number" ? Math.min(100, Math.max(0, pair.bondingProgress)) : null;
	if (isPumpBonding) {
		const tradeUrl = safeHref(clientTradeHref(pair, getDexTradingUrl(pair, "Pump.fun")));
		const title = `Pump.fun Bonding Curve (${progress !== null ? `${progress}% complete` : "Active"})`;
		const inner = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "truncate",
				children: "Bonding Curve"
			}),
			progress !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "px-1 py-0.2 rounded bg-emerald-500/20 text-[10px] font-mono",
				children: [progress.toFixed(0), "%"]
			}),
			tradeUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "w-2.5 h-2.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" }) : null
		] });
		const className = "inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-2xs";
		if (!tradeUrl) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			title,
			className,
			children: inner
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
			href: tradeUrl,
			target: "_blank",
			rel: "noopener noreferrer",
			onClick: (e) => e.stopPropagation(),
			title,
			className: `${className} hover:border-emerald-500/60 hover:bg-emerald-500/20 transition cursor-pointer group`,
			children: inner
		});
	}
	const stageLabel = ponsStageLabel(pair);
	let dexName = stageLabel || pair.primaryDex;
	if (dexName === "Raydium" && (pair.launchPlatform === "Pump.fun" || pair.dexes?.some((d) => d.toLowerCase().includes("pumpswap")) || pair.sources?.some((s) => s.toLowerCase().includes("pumpswap")) || pair.pairs?.some((pr) => (pr.dexName || pr.dexId || "").toLowerCase().includes("pumpswap")))) dexName = "PumpSwap";
	if (!dexName) dexName = pair.launchPlatform === "Pump.fun" ? isGraduated ? "PumpSwap" : "Pump.fun" : normalizeDexName(pair.dexId || pair.primaryProvider);
	const storedLogo = pair.primaryDexLogo?.endsWith("/argus.svg") ? "/argus.png" : pair.primaryDexLogo;
	const logoUrl = stageLabel ? getDexLogo("pons") : (dexName === "PumpSwap" ? getDexLogo("pumpswap") : storedLogo) || getDexLogo(dexName || (pair.launchPlatform === "Pump.fun" ? "pumpfun" : "dex"));
	const tradeUrl = safeHref(clientTradeHref(pair, (dexName === "PumpSwap" ? getDexTradingUrl(pair, "PumpSwap") : pair.primaryDexTradingUrl) || getDexTradingUrl(pair, dexName) || pair.url));
	const className = "inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-lg border border-slate-200/80 dark:border-zinc-800/80 bg-slate-100/80 dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-300";
	const inner = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		logoUrl && !imgError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: logoUrl,
			alt: dexName || "DEX",
			onError: () => setImgError(true),
			referrerPolicy: "no-referrer",
			className: "w-3.5 h-3.5 object-contain flex-shrink-0"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-[#ff6b35] flex-shrink-0" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `truncate ${stageLabel ? "max-w-[150px]" : "max-w-[85px]"}`,
			children: dexName || "DEX"
		}),
		tradeUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "w-2.5 h-2.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" }) : null
	] });
	if (!tradeUrl) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		title: dexName || "DEX",
		className,
		children: inner
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
		href: tradeUrl,
		target: "_blank",
		rel: "noopener noreferrer",
		onClick: (e) => e.stopPropagation(),
		title: `Trade on ${dexName || "DEX"}`,
		className: `${className} hover:text-[#ff6b35] hover:border-[#ff6b35]/40 hover:bg-[#ff6b35]/5 transition cursor-pointer group`,
		children: inner
	});
};
var DexProviderButton = ({ pair }) => {
	const pairOrAddress = pair.pairAddress || pair.baseToken?.address;
	const chartUrl = pairOrAddress ? `https://dexscreener.com/${normalizeChainName(pair.chainId)}/${pairOrAddress}` : null;
	if (!chartUrl) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
		href: chartUrl,
		target: "_blank",
		rel: "noreferrer noopener",
		onClick: (e) => e.stopPropagation(),
		title: "Open DexScreener Chart & Pair Analytics",
		"aria-label": "DexScreener Chart",
		className: "w-8 h-8 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-[#F8F9FC] dark:bg-[#1C1C24] shadow-2xs hover:-translate-y-0.5 hover:scale-105 hover:border-sky-500/50 hover:bg-sky-500/10 hover:shadow-xs active:scale-95 transition-all duration-200 ease-out cursor-pointer flex items-center justify-center group flex-shrink-0 ml-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: "https://dexscreener.com/favicon.ico",
			alt: "DexScreener Chart",
			className: "w-3.5 h-3.5 object-contain opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-200",
			onError: (e) => {
				e.target.style.display = "none";
			}
		})
	});
};
var formatSparklineVol = (val) => {
	if (val === void 0 || val === null || isNaN(val) || val <= 0) return "";
	if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
	if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
	if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
	return `$${val.toFixed(0)}`;
};
var getPriceHistoryPoints = (pair) => {
	const currentPrice = Number(pair.priceUsd) || 0;
	if (currentPrice <= 0) return null;
	const hasM5 = pair.priceChange?.m5 !== void 0 && pair.priceChange?.m5 !== null;
	const hasH1 = pair.priceChange?.h1 !== void 0 && pair.priceChange?.h1 !== null;
	const hasH6 = pair.priceChange?.h6 !== void 0 && pair.priceChange?.h6 !== null;
	const hasH24 = pair.priceChange?.h24 !== void 0 && pair.priceChange?.h24 !== null;
	const m5 = Number(pair.priceChange?.m5);
	const h1 = Number(pair.priceChange?.h1);
	const h6 = Number(pair.priceChange?.h6);
	const h24 = Number(pair.priceChange?.h24);
	const vol24h = Number(pair.volume?.h24 || 0);
	const vol6h = Number(pair.volume?.h6 || 0);
	const vol1h = Number(pair.volume?.h1 || 0);
	const vol5m = Number(pair.volume?.m5 || 0);
	const priceAt = (changePct) => {
		if (!Number.isFinite(changePct)) return currentPrice;
		const denom = 1 + changePct / 100;
		if (!Number.isFinite(denom) || denom <= 0) return currentPrice;
		return Math.max(0, currentPrice / denom);
	};
	const points = [];
	if (hasH24 && Number.isFinite(h24)) points.push({
		time: "24h ago",
		price: priceAt(h24),
		volume: vol24h || void 0,
		changePct: h24
	});
	if (hasH6 && Number.isFinite(h6)) points.push({
		time: "6h ago",
		price: priceAt(h6),
		volume: vol6h || void 0,
		changePct: h6
	});
	if (hasH1 && Number.isFinite(h1)) points.push({
		time: "1h ago",
		price: priceAt(h1),
		volume: vol1h || void 0,
		changePct: h1
	});
	if (hasM5 && Number.isFinite(m5)) points.push({
		time: "5m ago",
		price: priceAt(m5),
		volume: vol5m || void 0,
		changePct: m5
	});
	if (points.length === 0) return null;
	points.push({
		time: "Now",
		price: currentPrice,
		volume: vol24h || void 0,
		changePct: hasH24 && Number.isFinite(h24) ? h24 : 0
	});
	return points;
};
var TokenSparkline = import_react.memo(({ pair, priceChange24h, isDarkMode }) => {
	const [hoverIndex, setHoverIndex] = (0, import_react.useState)(null);
	const containerRef = import_react.useRef(null);
	const points = (0, import_react.useMemo)(() => {
		return getPriceHistoryPoints(pair);
	}, [
		pair.priceUsd,
		pair.priceChange?.h24,
		pair.priceChange?.h6,
		pair.priceChange?.h1,
		pair.priceChange?.m5,
		pair.volume?.h24,
		pair.volume?.h6,
		pair.volume?.h1,
		pair.volume?.m5,
		pair.bondingProgress
	]);
	const chartData = (0, import_react.useMemo)(() => {
		if (!points || points.length === 0) return null;
		const prices = points.map((p) => p.price);
		const minP = Math.min(...prices);
		const maxP = Math.max(...prices);
		const range = maxP - minP || (minP === 0 ? 1 : minP * .01);
		const w = 300;
		const h = 60;
		const effH = 42;
		const coords = points.map((pt, i) => {
			return {
				x: i / (points.length - 1) * w,
				y: maxP === minP ? h / 2 : 52 - (pt.price - minP) / range * effH,
				pt
			};
		});
		let pathD = `M ${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`;
		for (let i = 0; i < coords.length - 1; i++) {
			const p0 = coords[i === 0 ? i : i - 1];
			const p1 = coords[i];
			const p2 = coords[i + 1];
			const p3 = coords[i + 2 < coords.length ? i + 2 : i + 1];
			const cp1x = p1.x + (p2.x - p0.x) / 6;
			const cp1y = p1.y + (p2.y - p0.y) / 6;
			const cp2x = p2.x - (p3.x - p1.x) / 6;
			const cp2y = p2.y - (p3.y - p1.y) / 6;
			pathD += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
		}
		const areaD = `${pathD} L ${w},${h} L 0,${h} Z`;
		return {
			coords,
			pathD,
			areaD,
			w,
			h
		};
	}, [points]);
	if (!chartData) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full h-full flex flex-col items-center justify-center relative select-none",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `w-full border-t border-dashed ${isDarkMode ? "border-zinc-800" : "border-slate-300"} absolute top-1/2 -translate-y-1/2` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-xs relative z-10 ${isDarkMode ? "text-zinc-500 bg-zinc-950/80" : "text-slate-500 bg-white/80"}`,
			children: "History unavailable"
		})]
	});
	const isPositive = priceChange24h !== void 0 ? priceChange24h >= 0 : true;
	const strokeColor = priceChange24h !== void 0 ? isPositive ? isDarkMode ? "#6ebd80" : "#16a34a" : isDarkMode ? "#cc5a5a" : "#dc2626" : isDarkMode ? "#ff6b35" : "#ea580c";
	const gradientId = `spark-grad-${(pair.chainId || "chain").replace(/[^a-zA-Z0-9]/g, "")}-${(pair.pairAddress || "addr").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8)}`;
	const handleTouch = (e) => {
		if (!containerRef.current || !chartData || !e.touches[0]) return;
		const rect = containerRef.current.getBoundingClientRect();
		const touchX = e.touches[0].clientX - rect.left;
		const ratio = Math.max(0, Math.min(1, touchX / rect.width));
		const idx = Math.round(ratio * (chartData.coords.length - 1));
		setHoverIndex(idx);
	};
	const handleMouseMove = (e) => {
		if (!containerRef.current || !chartData) return;
		const rect = containerRef.current.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
		const idx = Math.round(ratio * (chartData.coords.length - 1));
		setHoverIndex(idx);
	};
	const handleMouseLeave = () => {
		setHoverIndex(null);
	};
	const hoverItem = hoverIndex !== null ? chartData.coords[hoverIndex] : null;
	const rawPct = hoverItem ? hoverItem.x / chartData.w * 100 : 50;
	const clampedPct = Math.min(76, Math.max(24, rawPct));
	const isUpperHalf = hoverItem ? hoverItem.y < 30 : false;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: containerRef,
		onMouseMove: handleMouseMove,
		onMouseLeave: handleMouseLeave,
		onTouchStart: handleTouch,
		onTouchMove: handleTouch,
		onTouchEnd: handleMouseLeave,
		className: "w-full h-full relative cursor-crosshair select-none touch-none",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: `0 0 ${chartData.w} ${chartData.h}`,
			className: "w-full h-full overflow-visible",
			preserveAspectRatio: "none",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: gradientId,
					x1: "0",
					y1: "0",
					x2: "0",
					y2: "1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "0%",
						stopColor: strokeColor,
						stopOpacity: .35
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "100%",
						stopColor: strokeColor,
						stopOpacity: 0
					})]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: chartData.areaD,
					fill: `url(#${gradientId})`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: chartData.pathD,
					fill: "none",
					stroke: strokeColor,
					strokeWidth: "2.5",
					strokeLinecap: "round",
					strokeLinejoin: "round"
				}),
				hoverItem && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: hoverItem.x,
					y1: 0,
					x2: hoverItem.x,
					y2: chartData.h,
					stroke: isDarkMode ? "#ff6b35" : "#64748b",
					strokeWidth: "1.5",
					strokeDasharray: "3 3"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: hoverItem.x,
					cy: hoverItem.y,
					r: "4.5",
					fill: strokeColor,
					stroke: isDarkMode ? "#0b0c10" : "#ffffff",
					strokeWidth: "2"
				})] })
			]
		}), hoverItem && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `absolute pointer-events-none z-30 px-2 py-1 text-[10px] font-mono shadow-xl rounded-lg border transform -translate-x-1/2 whitespace-nowrap transition-all duration-75 backdrop-blur-md ${isUpperHalf ? "bottom-1.5" : "top-1.5"} ${isDarkMode ? "bg-zinc-950/95 border-zinc-700 text-white shadow-black/80" : "bg-white/95 border-slate-300 text-slate-900 shadow-slate-400/50"}`,
			style: { left: `${clampedPct}%` },
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[9.5px] text-zinc-400 font-medium",
					children: hoverItem.pt.time
				}), hoverItem.pt.changePct !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: `text-[9.5px] font-bold ${hoverItem.pt.changePct >= 0 ? isDarkMode ? "text-emerald-400" : "text-emerald-600" : isDarkMode ? "text-rose-400" : "text-rose-600"}`,
					children: [
						hoverItem.pt.changePct >= 0 ? "+" : "",
						hoverItem.pt.changePct.toFixed(1),
						"%"
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 mt-0.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `font-bold ${isPositive ? isDarkMode ? "text-emerald-400" : "text-emerald-600" : isDarkMode ? "text-rose-400" : "text-rose-600"}`,
					children: formatPriceString(hoverItem.pt.price)
				}), hoverItem.pt.volume ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-[9px] text-zinc-400 font-mono",
					children: ["Vol: ", formatSparklineVol(hoverItem.pt.volume)]
				}) : null]
			})]
		})]
	});
});
/**
* Abbreviate crypto contract addresses (CA) or address hashes for clean UI display.
* Formats EVM addresses as: 0x1234...5678, and Solana/Base58 CAs as: 4k3Dy...8x9Z.
*/
var abbreviateSearchQuery = (query) => {
	const trimmed = query.trim();
	if (!trimmed) return "";
	if (!/\s/.test(trimmed)) {
		if (/^0x[a-fA-F0-9]{10,}$/i.test(trimmed)) return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
		if (/^[a-zA-Z0-9]{16,}$/.test(trimmed)) return `${trimmed.slice(0, 5)}...${trimmed.slice(-4)}`;
	} else {
		const prefixMatch = trimmed.match(/^(ca|contract|token|address):\s*(0x[a-fA-F0-9]{10,}|[a-zA-Z0-9]{16,})$/i);
		if (prefixMatch) {
			const label = prefixMatch[1];
			const addr = prefixMatch[2];
			return `${label}: ${addr.toLowerCase().startsWith("0x") ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : `${addr.slice(0, 5)}...${addr.slice(-4)}`}`;
		}
	}
	return trimmed;
};
function App() {
	const routeSearch = useSearch({ strict: false });
	const [browseSeed] = (0, import_react.useState)(() => parseBrowseSearch(routeSearch));
	const navigate = useNavigate();
	const [themeMode, setThemeMode] = (0, import_react.useState)("dark");
	const [systemPrefersDark, setSystemPrefersDark] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		try {
			const saved = localStorage.getItem("theme_mode") || localStorage.getItem("theme");
			if (saved === "system" || saved === "dark" || saved === "light") setThemeMode(saved);
		} catch {}
	}, []);
	(0, import_react.useEffect)(() => {
		if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		setSystemPrefersDark(mediaQuery.matches);
		const handleSystemThemeChange = (e) => {
			setSystemPrefersDark(e.matches);
		};
		if (mediaQuery.addEventListener) {
			mediaQuery.addEventListener("change", handleSystemThemeChange);
			return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
		} else if (mediaQuery.addListener) {
			mediaQuery.addListener(handleSystemThemeChange);
			return () => mediaQuery.removeListener(handleSystemThemeChange);
		}
	}, []);
	const isDarkMode = themeMode === "system" ? systemPrefersDark : themeMode === "dark";
	const updateThemeMode = (0, import_react.useCallback)((mode) => {
		setThemeMode(mode);
		try {
			localStorage.setItem("theme_mode", mode);
			localStorage.setItem("theme", mode);
		} catch {}
	}, []);
	const toggleTheme = (0, import_react.useCallback)(() => {
		updateThemeMode(isDarkMode ? "light" : "dark");
	}, [isDarkMode, updateThemeMode]);
	(0, import_react.useEffect)(() => {
		const root = document.documentElement;
		const body = document.body;
		if (isDarkMode) {
			root.classList.add("dark");
			root.classList.remove("light");
			root.setAttribute("data-theme", "dark");
			root.style.colorScheme = "dark";
			root.style.backgroundColor = "#08090d";
			body.classList.add("dark");
			body.classList.remove("light");
			body.setAttribute("data-theme", "dark");
			body.style.colorScheme = "dark";
			body.style.backgroundColor = "#08090d";
		} else {
			root.classList.remove("dark");
			root.classList.add("light");
			root.setAttribute("data-theme", "light");
			root.style.colorScheme = "light";
			root.style.backgroundColor = "#f8f9fa";
			body.classList.remove("dark");
			body.classList.add("light");
			body.setAttribute("data-theme", "light");
			body.style.colorScheme = "light";
			body.style.backgroundColor = "#f8f9fa";
		}
	}, [isDarkMode]);
	const theme = (0, import_react.useMemo)(() => {
		return {
			bgMain: isDarkMode ? "bg-[#0b0c10] text-zinc-100 instrument-grid" : "bg-[#f8f9fa] text-slate-900 instrument-grid-light",
			bgHeader: isDarkMode ? "bg-[#111218]/90 border-zinc-800/80 text-white backdrop-blur-md" : "bg-white/90 border-slate-200/80 text-slate-900 shadow-2xs backdrop-blur-md",
			bgCard: isDarkMode ? "bg-[#151620]/90 border-zinc-800/80" : "bg-white border-slate-200/80 shadow-2xs",
			bgInner: isDarkMode ? "bg-[#181926] border-zinc-800/60" : "bg-slate-50/80 border-slate-200/60",
			bgTabs: isDarkMode ? "bg-[#14151f] border-zinc-800/80" : "bg-slate-100/80 border-slate-200/80",
			textTitle: isDarkMode ? "text-zinc-100" : "text-slate-900 font-bold",
			textSub: isDarkMode ? "text-zinc-400" : "text-slate-600",
			textMuted: isDarkMode ? "text-zinc-500" : "text-slate-400",
			borderMain: isDarkMode ? "border-zinc-800/80" : "border-slate-200/80",
			btnSecondary: isDarkMode ? "bg-zinc-800/60 hover:bg-zinc-700/80 border-zinc-700/60 text-zinc-300 hover:text-white" : "bg-slate-100/90 hover:bg-slate-200/80 border-slate-200 text-slate-700 hover:text-slate-900 shadow-none",
			inputStyle: isDarkMode ? "bg-[#12131c] border-zinc-800 text-white placeholder-zinc-500 focus:border-[#ff6b35] transition-all" : "bg-slate-50 border-slate-200/90 text-slate-900 placeholder-slate-400 focus:border-[#ff6b35] transition-all"
		};
	}, [isDarkMode]);
	const [activeTab, setActiveTab] = (0, import_react.useState)(browseSeed.tab);
	const [isSearchOpen, setIsSearchOpen] = (0, import_react.useState)(false);
	const [hasSearched, setHasSearched] = (0, import_react.useState)(false);
	const [isSearchPanelCollapsed, setIsSearchPanelCollapsed] = (0, import_react.useState)(false);
	const [currentPage, setCurrentPage] = (0, import_react.useState)(1);
	const [showFiltersMobile, setShowFiltersMobile] = (0, import_react.useState)(false);
	const [showSortModal, setShowSortModal] = (0, import_react.useState)(false);
	const [hoveredSortTooltip, setHoveredSortTooltip] = (0, import_react.useState)(null);
	const [showSettingsModal, setShowSettingsModal] = (0, import_react.useState)(false);
	const [showExportConfirm, setShowExportConfirm] = (0, import_react.useState)(false);
	const PAGE_SIZE = 100;
	const [feedPaused, setFeedPaused] = (0, import_react.useState)(false);
	const [viewMode, setViewMode] = (0, import_react.useState)("cards");
	(0, import_react.useEffect)(() => {
		try {
			const saved = localStorage.getItem("dexhunter_view_mode");
			if (saved === "cards" || saved === "compact") {
				setViewMode(saved);
				return;
			}
		} catch {}
		if (typeof window !== "undefined" && window.innerWidth < 768) setViewMode("compact");
	}, []);
	const updateViewMode = (0, import_react.useCallback)((mode) => {
		setViewMode(mode);
		try {
			localStorage.setItem("dexhunter_view_mode", mode);
		} catch {}
	}, []);
	const searchInputRef = (0, import_react.useRef)(null);
	const searchTriggerBtnRef = (0, import_react.useRef)(null);
	const handleOpenSearch = (0, import_react.useCallback)(() => {
		setShowSortModal(false);
		setShowSettingsModal(false);
		setShowFiltersMobile(false);
		setIsSearchOpen(true);
		setIsSearchPanelCollapsed(false);
		requestAnimationFrame(() => {
			if (searchInputRef.current) {
				searchInputRef.current.focus();
				searchInputRef.current.select();
			}
		});
	}, []);
	const handleCloseSearch = (0, import_react.useCallback)(() => {
		setIsSearchOpen(false);
		if (searchInputRef.current && document.activeElement === searchInputRef.current) searchInputRef.current.blur();
		requestAnimationFrame(() => {
			searchTriggerBtnRef.current?.focus();
		});
	}, []);
	const filterDrawerRef = (0, import_react.useRef)(null);
	const filterTriggerBtnRef = (0, import_react.useRef)(null);
	const filterCloseBtnRef = (0, import_react.useRef)(null);
	const handleOpenFilterDrawer = (0, import_react.useCallback)(() => {
		setShowSortModal(false);
		setShowSettingsModal(false);
		setShowFiltersMobile(true);
	}, []);
	const handleCloseFilterDrawer = (0, import_react.useCallback)(() => {
		setShowFiltersMobile(false);
		requestAnimationFrame(() => {
			filterTriggerBtnRef.current?.focus();
		});
	}, []);
	const settingsModalRef = (0, import_react.useRef)(null);
	const settingsTriggerDesktopRef = (0, import_react.useRef)(null);
	const settingsTriggerMobileRef = (0, import_react.useRef)(null);
	const settingsCloseBtnRef = (0, import_react.useRef)(null);
	const handleCloseSettingsModal = (0, import_react.useCallback)(() => {
		setShowSettingsModal(false);
		requestAnimationFrame(() => {
			if (settingsTriggerDesktopRef.current && settingsTriggerDesktopRef.current.offsetParent !== null) settingsTriggerDesktopRef.current.focus();
			else settingsTriggerMobileRef.current?.focus();
		});
	}, []);
	(0, import_react.useEffect)(() => {
		if (!showSettingsModal) return;
		const timer = setTimeout(() => {
			if (settingsCloseBtnRef.current) settingsCloseBtnRef.current.focus();
			else if (settingsModalRef.current) settingsModalRef.current.querySelector("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])")?.focus();
		}, 50);
		const handleKeyDown = (e) => {
			if (e.key === "Escape") {
				e.preventDefault();
				handleCloseSettingsModal();
			} else if (e.key === "Tab" && settingsModalRef.current) {
				const focusableEls = Array.from(settingsModalRef.current.querySelectorAll("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])")).filter((el) => el !== null && el.offsetParent !== null);
				if (focusableEls.length === 0) return;
				const firstEl = focusableEls[0];
				const lastEl = focusableEls[focusableEls.length - 1];
				if (e.shiftKey) {
					if (document.activeElement === firstEl) {
						e.preventDefault();
						lastEl.focus();
					}
				} else if (document.activeElement === lastEl) {
					e.preventDefault();
					firstEl.focus();
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			clearTimeout(timer);
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [showSettingsModal, handleCloseSettingsModal]);
	(0, import_react.useEffect)(() => {
		if (!showFiltersMobile) return;
		const timer = setTimeout(() => {
			if (filterCloseBtnRef.current) filterCloseBtnRef.current.focus();
			else if (filterDrawerRef.current) filterDrawerRef.current.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])")?.focus();
		}, 50);
		const handleKeyDown = (e) => {
			if (e.key === "Escape") {
				e.preventDefault();
				handleCloseFilterDrawer();
			} else if (e.key === "Tab" && filterDrawerRef.current) {
				const focusableEls = Array.from(filterDrawerRef.current.querySelectorAll("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])")).filter((el) => el !== null && el.offsetParent !== null);
				if (focusableEls.length === 0) return;
				const firstEl = focusableEls[0];
				const lastEl = focusableEls[focusableEls.length - 1];
				if (e.shiftKey) {
					if (document.activeElement === firstEl) {
						e.preventDefault();
						lastEl.focus();
					}
				} else if (document.activeElement === lastEl) {
					e.preventDefault();
					firstEl.focus();
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			clearTimeout(timer);
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [showFiltersMobile, handleCloseFilterDrawer]);
	const [expandedCards, setExpandedCards] = (0, import_react.useState)(() => browseSeed.token ? { [browseSeed.token]: true } : {});
	const [detailKey, setDetailKey] = (0, import_react.useState)(browseSeed.token);
	const [tokenHoldersData, setTokenHoldersData] = (0, import_react.useState)({});
	const fetchTokenHolders = (0, import_react.useCallback)(async (tokenAddress, chainId, force = false, pairAddress) => {
		if (!tokenAddress) return;
		const key = holderCacheKey(chainId, tokenAddress);
		if (!force && (tokenHoldersData[key]?.topHolders?.length || tokenHoldersData[key]?.loading)) return;
		const provider = getRpcHolderProvider(chainId, tokenAddress);
		setTokenHoldersData((prev) => ({
			...prev,
			[key]: {
				loading: true,
				totalHolders: prev[key]?.totalHolders || 0,
				totalSupplyFormatted: prev[key]?.totalSupplyFormatted,
				decimals: prev[key]?.decimals,
				supplier: prev[key]?.supplier,
				creator: prev[key]?.creator,
				deployer: prev[key]?.deployer,
				creationTx: prev[key]?.creationTx,
				creationTimestamp: prev[key]?.creationTimestamp,
				source: prev[key]?.source,
				chain: provider.chainId,
				providerKey: provider.providerKey,
				providerName: provider.chainDisplayName,
				topHolders: prev[key]?.topHolders || [],
				top10SupplyPercentage: prev[key]?.top10SupplyPercentage || 0
			}
		}));
		try {
			const data = await executeTokenHoldersScan(tokenAddress, provider, void 0, pairAddress);
			setTokenHoldersData((prev) => ({
				...prev,
				[key]: {
					...data,
					chain: data.chain || provider.chainId,
					providerKey: provider.providerKey,
					providerName: provider.chainDisplayName
				}
			}));
		} catch (err) {
			setTokenHoldersData((prev) => ({
				...prev,
				[key]: {
					loading: false,
					totalHolders: 0,
					topHolders: [],
					top10SupplyPercentage: 0,
					chain: provider.chainId,
					providerKey: provider.providerKey,
					providerName: provider.chainDisplayName,
					error: err.message || "Failed to scan on-chain holders"
				}
			}));
		}
	}, [tokenHoldersData]);
	const toggleCardExpanded = (pairKey, tokenAddress, chainId, pairAddress) => {
		const nextState = !expandedCards[pairKey];
		setExpandedCards((prev) => ({
			...prev,
			[pairKey]: nextState
		}));
		setDetailKey(nextState ? pairKey : "");
		if (nextState && tokenAddress) fetchTokenHolders(tokenAddress, chainId, false, pairAddress);
	};
	(0, import_react.useEffect)(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape") {
				let closedSomething = false;
				if (showSettingsModal) {
					handleCloseSettingsModal();
					closedSomething = true;
				}
				if (showExportConfirm) {
					setShowExportConfirm(false);
					closedSomething = true;
				}
				if (showFiltersMobile) {
					handleCloseFilterDrawer();
					closedSomething = true;
				}
				if (showSortModal) {
					setShowSortModal(false);
					setHoveredSortTooltip(null);
					closedSomething = true;
				}
				if (isSearchOpen) {
					handleCloseSearch();
					closedSomething = true;
				}
				if (hoveredSortTooltip) {
					setHoveredSortTooltip(null);
					closedSomething = true;
				}
				if (closedSomething) e.preventDefault();
				return;
			}
			if (e.metaKey || e.ctrlKey || e.altKey) return;
			const target = e.target;
			if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable || target.getAttribute("contenteditable") === "true" || target.getAttribute("contenteditable") === "" || target.getAttribute("role") === "textbox")) return;
			const keyLower = e.key.toLowerCase();
			if (keyLower === "s") {
				e.preventDefault();
				handleOpenSearch();
				return;
			}
			if (keyLower === "f") {
				e.preventDefault();
				handleOpenFilterDrawer();
				return;
			}
			if (keyLower === "v") {
				e.preventDefault();
				setViewMode((prev) => {
					const next = prev === "cards" ? "compact" : "cards";
					try {
						localStorage.setItem("dexhunter_view_mode", next);
					} catch {}
					return next;
				});
				return;
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		showSettingsModal,
		showFiltersMobile,
		showSortModal,
		isSearchOpen,
		hoveredSortTooltip,
		handleCloseSettingsModal,
		handleCloseFilterDrawer,
		handleCloseSearch,
		handleOpenSearch,
		handleOpenFilterDrawer
	]);
	const [searchQuery, setSearchQuery] = (0, import_react.useState)(browseSeed.q);
	const [searchNote, setSearchNote] = (0, import_react.useState)(null);
	const [pairs, setPairs] = (0, import_react.useState)([]);
	const [rawResults, setRawResults] = (0, import_react.useState)([]);
	const [ageFilter, setAgeFilter] = (0, import_react.useState)(browseSeed.age);
	const [trending, setTrending] = (0, import_react.useState)([]);
	const [latestListings, setLatestListings] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(null);
	const [chain, setChain] = (0, import_react.useState)(browseSeed.chain);
	const [selectedDex, setSelectedDex] = (0, import_react.useState)(browseSeed.dex);
	const metricSeed = (value) => value === "" ? "" : Number(value);
	const [minVolume, setMinVolume] = (0, import_react.useState)(metricSeed(browseSeed.minVolume));
	const [maxVolume, setMaxVolume] = (0, import_react.useState)(metricSeed(browseSeed.maxVolume));
	const [minLiquidity, setMinLiquidity] = (0, import_react.useState)(metricSeed(browseSeed.minLiquidity));
	const [minMarketCap, setMinMarketCap] = (0, import_react.useState)(metricSeed(browseSeed.minMarketCap));
	const [maxMarketCap, setMaxMarketCap] = (0, import_react.useState)(metricSeed(browseSeed.maxMarketCap));
	const [minPriceChange, setMinPriceChange] = (0, import_react.useState)(metricSeed(browseSeed.minPriceChange));
	const [pagedResults, setPagedResults] = (0, import_react.useState)(null);
	const [indexTotal, setIndexTotal] = (0, import_react.useState)(null);
	const [indexCursor, setIndexCursor] = (0, import_react.useState)(null);
	const [indexPaging, setIndexPaging] = (0, import_react.useState)(false);
	const [indexPageError, setIndexPageError] = (0, import_react.useState)(null);
	const [indexRetry, setIndexRetry] = (0, import_react.useState)(0);
	const pageReqRef = (0, import_react.useRef)(0);
	const windowReqRef = (0, import_react.useRef)(0);
	const narrowedPoolRef = (0, import_react.useRef)(false);
	const loadedCountRef = (0, import_react.useRef)(0);
	loadedCountRef.current = rawResults.length;
	const serverPagedRef = (0, import_react.useRef)(false);
	const wasServerPagedRef = (0, import_react.useRef)(false);
	const chainBeforeLaunchpadRef = (0, import_react.useRef)(null);
	const paintFlightRef = (0, import_react.useRef)(0);
	const serverPaged = !searchQuery.trim() && (ageFilter === "all" || ageFilter === "1m");
	serverPagedRef.current = serverPaged;
	const handleSelectChain = (0, import_react.useCallback)((newChain) => {
		chainBeforeLaunchpadRef.current = null;
		setChain(newChain === "all" ? "all" : formatChainSelection([newChain]));
	}, []);
	(0, import_react.useCallback)((id) => {
		chainBeforeLaunchpadRef.current = null;
		setChain((prev) => toggleChainSelection(prev, id));
	}, []);
	const [reqTelegram, setReqTelegram] = (0, import_react.useState)(browseSeed.tg);
	const [reqXProfile, setReqXProfile] = (0, import_react.useState)(browseSeed.xp);
	const [reqXPost, setReqXPost] = (0, import_react.useState)(browseSeed.xpost);
	const [reqDiscord, setReqDiscord] = (0, import_react.useState)(browseSeed.dc);
	const [reqWebsite, setReqWebsite] = (0, import_react.useState)(browseSeed.web);
	const [verifiedOnly, setVerifiedOnly] = (0, import_react.useState)(browseSeed.verified);
	const [freshMintsToast, setFreshMintsToast] = (0, import_react.useState)(null);
	const toastTimeoutRef = (0, import_react.useRef)(null);
	const triggerFreshMintsToast = (0, import_react.useCallback)((count) => {
		if (count <= 0) return;
		if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
		setFreshMintsToast({
			id: Date.now(),
			count
		});
		toastTimeoutRef.current = setTimeout(() => {
			setFreshMintsToast(null);
		}, 4e3);
	}, []);
	(0, import_react.useEffect)(() => {
		return () => {
			if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
		};
	}, []);
	const [sortBy, setSortBy] = (0, import_react.useState)(browseSeed.sort);
	const browseNow = (0, import_react.useMemo)(() => ({
		tab: activeTab,
		q: searchQuery.trim(),
		chain,
		dex: selectedDex,
		age: ageFilter,
		sort: sortBy,
		minVolume: minVolume === "" ? "" : String(minVolume),
		maxVolume: maxVolume === "" ? "" : String(maxVolume),
		minLiquidity: minLiquidity === "" ? "" : String(minLiquidity),
		minMarketCap: minMarketCap === "" ? "" : String(minMarketCap),
		maxMarketCap: maxMarketCap === "" ? "" : String(maxMarketCap),
		minPriceChange: minPriceChange === "" ? "" : String(minPriceChange),
		tg: reqTelegram,
		tw: false,
		xp: reqXProfile,
		xpost: reqXPost,
		dc: reqDiscord,
		web: reqWebsite,
		verified: verifiedOnly,
		token: detailKey
	}), [
		activeTab,
		searchQuery,
		chain,
		selectedDex,
		ageFilter,
		sortBy,
		minVolume,
		maxVolume,
		minLiquidity,
		minMarketCap,
		maxMarketCap,
		minPriceChange,
		reqTelegram,
		reqXProfile,
		reqXPost,
		reqDiscord,
		reqWebsite,
		verifiedOnly,
		detailKey
	]);
	const urlBrowseRef = (0, import_react.useRef)(browseSeed);
	const startBrowseRef = (0, import_react.useRef)(browseSeed);
	const hasPushedRef = (0, import_react.useRef)(false);
	const applyBrowse = (0, import_react.useCallback)((loc) => {
		setActiveTab(loc.tab);
		setSearchQuery(loc.q);
		setChain(loc.chain);
		setSelectedDex(loc.dex);
		setAgeFilter(loc.age);
		setSortBy(loc.sort);
		setMinVolume(loc.minVolume === "" ? "" : Number(loc.minVolume));
		setMaxVolume(loc.maxVolume === "" ? "" : Number(loc.maxVolume));
		setMinLiquidity(loc.minLiquidity === "" ? "" : Number(loc.minLiquidity));
		setMinMarketCap(loc.minMarketCap === "" ? "" : Number(loc.minMarketCap));
		setMaxMarketCap(loc.maxMarketCap === "" ? "" : Number(loc.maxMarketCap));
		setMinPriceChange(loc.minPriceChange === "" ? "" : Number(loc.minPriceChange));
		setReqTelegram(loc.tg);
		setReqXProfile(loc.xp);
		setReqXPost(loc.xpost);
		setReqDiscord(loc.dc);
		setReqWebsite(loc.web);
		setVerifiedOnly(loc.verified);
		setDetailKey(loc.token);
		setExpandedCards(loc.token ? { [loc.token]: true } : {});
	}, []);
	(0, import_react.useEffect)(() => {
		if (sameBrowse(browseNow, urlBrowseRef.current)) return;
		const action = historyAction(urlBrowseRef.current, browseNow, hasPushedRef.current);
		urlBrowseRef.current = browseNow;
		if (action === "none") return;
		if (action === "push") hasPushedRef.current = true;
		navigate({
			to: "/",
			search: browseNow,
			replace: action === "replace"
		});
	}, [browseNow, navigate]);
	const parsedRoute = (0, import_react.useMemo)(() => parseBrowseSearch(routeSearch), [routeSearch]);
	(0, import_react.useEffect)(() => {
		if (sameBrowse(parsedRoute, urlBrowseRef.current)) return;
		urlBrowseRef.current = parsedRoute;
		hasPushedRef.current = !sameBrowse(parsedRoute, startBrowseRef.current);
		applyBrowse(parsedRoute);
	}, [parsedRoute, applyBrowse]);
	const [copiedAddress, setCopiedAddress] = (0, import_react.useState)(null);
	const quickSearchTags = [
		"sol",
		"base",
		"meme",
		"pepe",
		"ai",
		"dog",
		"elon",
		"pump"
	];
	const copiedAddressRef = (0, import_react.useRef)(null);
	const copyTimerRef = (0, import_react.useRef)(null);
	const copyToClipboard = (text) => {
		if (!text) return;
		copiedAddressRef.current = text;
		navigator.clipboard.writeText(text).catch(() => {});
		setCopiedAddress(text);
		if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
		copyTimerRef.current = setTimeout(() => {
			if (copiedAddressRef.current === text) {
				copiedAddressRef.current = null;
				setCopiedAddress(null);
			}
		}, 2e3);
	};
	const searchAbortRef = import_react.useRef(null);
	const trendingAbortRef = import_react.useRef(null);
	const latestAbortRef = import_react.useRef(null);
	const freshMintsAbortRef = import_react.useRef(null);
	const freshMintsBgAbortRef = import_react.useRef(null);
	/**
	* Diffing and identity-preserving merge strategy for background token updates.
	* Preserves unchanged object references so React does not trigger unnecessary
	* re-renders, preventing UI flickering, search input interruptions, and pagination jumps.
	* If sortByAge is true, preserves/enforces newest-first creation ordering. Otherwise, preserves exact incoming list ordering.
	*/
	const diffAndMergeTokenList = (0, import_react.useCallback)((prevList, nextList, sortByAge = false) => {
		if (!prevList || prevList.length === 0) return {
			merged: nextList,
			hasChanged: true
		};
		if (!nextList || nextList.length === 0) return {
			merged: prevList,
			hasChanged: false
		};
		const nextMap = /* @__PURE__ */ new Map();
		for (const item of nextList) {
			const key = `${item.chainId || "solana"}:${item.baseToken?.address || item.pairAddress}`.toLowerCase();
			nextMap.set(key, item);
		}
		let hasChanged = false;
		const mergedList = [];
		const seenKeys = /* @__PURE__ */ new Set();
		for (const prevItem of prevList) {
			const key = `${prevItem.chainId || "solana"}:${prevItem.baseToken?.address || prevItem.pairAddress}`.toLowerCase();
			seenKeys.add(key);
			const nextItem = nextMap.get(key);
			if (!nextItem) mergedList.push(prevItem);
			else if (liveRowChanged(prevItem, nextItem)) {
				const updatedItem = {
					...prevItem,
					...nextItem,
					info: {
						...prevItem.info,
						...nextItem.info,
						imageUrl: nextItem.info?.imageUrl || prevItem.info?.imageUrl,
						websites: nextItem.info?.websites && nextItem.info.websites.length > 0 ? nextItem.info.websites : prevItem.info?.websites,
						socials: nextItem.info?.socials && nextItem.info.socials.length > 0 ? nextItem.info.socials : prevItem.info?.socials
					},
					baseToken: {
						...prevItem.baseToken,
						...nextItem.baseToken
					},
					primaryDex: nextItem.primaryDex || prevItem.primaryDex,
					primaryDexLogo: nextItem.primaryDexLogo || prevItem.primaryDexLogo,
					primaryDexTradingUrl: nextItem.primaryDexTradingUrl || prevItem.primaryDexTradingUrl
				};
				mergedList.push(updatedItem);
				hasChanged = true;
			} else mergedList.push(prevItem);
		}
		for (const nextItem of nextList) {
			const key = `${nextItem.chainId || "solana"}:${nextItem.baseToken?.address || nextItem.pairAddress}`.toLowerCase();
			if (!seenKeys.has(key)) {
				mergedList.push(nextItem);
				hasChanged = true;
			}
		}
		if (sortByAge) mergedList.sort(compareCreatedDesc);
		return {
			merged: mergedList,
			hasChanged
		};
	}, []);
	const paintDiscoveryPool = (0, import_react.useCallback)(async (mode, signal, targetChain) => {
		paintFlightRef.current += 1;
		try {
			const activeChain = "all";
			const paint = (page) => {
				if (signal.aborted || !page.tokens.length) return;
				if (narrowedPoolRef.current) return;
				const painted = mode === "fresh_mints" || mode === "latest" ? [...page.tokens].sort(compareCreatedDesc) : page.tokens;
				setPairs(painted);
				setRawResults(painted);
				if (!serverPagedRef.current) {
					setIndexTotal(page.total);
					setIndexCursor(page.nextCursor);
					setIndexPageError(null);
				}
				setLoading(false);
			};
			paint(await fetchDiscoveryPage({
				mode,
				chainId: activeChain,
				age: "1w",
				limit: 600
			}));
			if (signal.aborted) return;
			paint(await fetchDiscoveryPage({
				mode,
				chainId: activeChain,
				age: "1w",
				limit: 5e3
			}));
		} catch {} finally {
			paintFlightRef.current = Math.max(0, paintFlightRef.current - 1);
			if (!signal.aborted && paintFlightRef.current === 0) setLoading(false);
		}
	}, [diffAndMergeTokenList]);
	const fetchSearchPairs = (0, import_react.useCallback)(async (queryStr, targetChain, forceRefresh) => {
		if (!queryStr.trim()) return;
		if (searchAbortRef.current) searchAbortRef.current.abort();
		const controller = new AbortController();
		searchAbortRef.current = controller;
		const signal = controller.signal;
		setLoading(true);
		setError(null);
		try {
			const qTrim = queryStr.trim();
			const parsed = parseAddressQuery(qTrim);
			const providerQuery = isAddressQuery(parsed) && "address" in parsed ? parsed.address : qTrim;
			if (isAddressQuery(parsed)) {
				const looked = await lookupIndexedAddress(qTrim, "all", signal);
				if (signal.aborted) return;
				if (looked.ambiguous || parsed.kind === "evm-prefix" || parsed.kind === "solana-prefix" || looked.tokens.length) {
					setPairs(looked.ambiguous ? [] : looked.tokens);
					setRawResults(looked.ambiguous ? [] : looked.tokens);
					setCurrentPage(1);
					setSearchNote(null);
					setError(null);
					return;
				}
			}
			const [live, canonicalTokens] = await Promise.all([isAddressQuery(parsed) ? Promise.resolve([]) : searchLiveMarkets(providerQuery, signal), aggregateMultiSourceTokens("search", providerQuery, signal, "all", forceRefresh).catch((err) => {
				if (err?.name === "AbortError" || signal.aborted) throw err;
				return [];
			})]);
			if (signal.aborted) return;
			const merged = appendUniqueTokens(live, canonicalTokens);
			setPairs(merged);
			setRawResults(merged);
			setCurrentPage(1);
			setSearchNote(null);
			enrichTokensWithMetadataConcurrently(merged, signal).then((enriched) => {
				if (signal.aborted) return;
				setPairs((prev) => {
					const { merged, hasChanged } = diffAndMergeTokenList(prev, enriched, false);
					return hasChanged ? merged : prev;
				});
				setRawResults((prev) => {
					const { merged, hasChanged } = diffAndMergeTokenList(prev, enriched, false);
					return hasChanged ? merged : prev;
				});
			}).catch(() => {});
		} catch (err) {
			if (err?.name === "AbortError" || signal.aborted) return;
			setError(err?.message || "Something went wrong while searching.");
		} finally {
			if (!signal.aborted) setLoading(false);
		}
	}, [diffAndMergeTokenList]);
	const fetchTrendingBoosts = (0, import_react.useCallback)(async (targetChain, forceRefresh) => {
		if (trendingAbortRef.current) trendingAbortRef.current.abort();
		const controller = new AbortController();
		trendingAbortRef.current = controller;
		const signal = controller.signal;
		setLoading(true);
		setError(null);
		paintDiscoveryPool("trending", signal, targetChain);
		try {
			const canonicalTokens = await aggregateMultiSourceTokens("trending", void 0, signal, "all", forceRefresh);
			if (signal.aborted) return;
			if (canonicalTokens.length > 0) {
				setPairs((prev) => diffAndMergeTokenList(prev, canonicalTokens, false).merged);
				setRawResults((prev) => diffAndMergeTokenList(prev, canonicalTokens, false).merged);
			}
			enrichTokensWithMetadataConcurrently(canonicalTokens, signal).then((enriched) => {
				if (signal.aborted) return;
				setPairs((prev) => {
					const { merged, hasChanged } = diffAndMergeTokenList(prev, enriched, false);
					return hasChanged ? merged : prev;
				});
				setRawResults((prev) => {
					const { merged, hasChanged } = diffAndMergeTokenList(prev, enriched, false);
					return hasChanged ? merged : prev;
				});
			}).catch(() => {});
		} catch (err) {
			if (err?.name === "AbortError" || signal.aborted) return;
			setError(err?.message || "Could not retrieve multi-source trending tokens.");
		} finally {
			if (!signal.aborted && paintFlightRef.current === 0) setLoading(false);
		}
	}, [diffAndMergeTokenList, paintDiscoveryPool]);
	const fetchLatestListings = (0, import_react.useCallback)(async (targetChain, forceRefresh) => {
		if (latestAbortRef.current) latestAbortRef.current.abort();
		const controller = new AbortController();
		latestAbortRef.current = controller;
		const signal = controller.signal;
		setLoading(true);
		setError(null);
		paintDiscoveryPool("latest", signal, targetChain);
		try {
			const canonicalTokens = await aggregateMultiSourceTokens("latest", void 0, signal, "all", forceRefresh);
			if (signal.aborted) return;
			if (canonicalTokens.length > 0) {
				setPairs((prev) => diffAndMergeTokenList(prev, canonicalTokens, true).merged);
				setRawResults((prev) => diffAndMergeTokenList(prev, canonicalTokens, true).merged);
			}
			enrichTokensWithMetadataConcurrently(canonicalTokens, signal).then((enriched) => {
				if (signal.aborted) return;
				setPairs((prev) => {
					const { merged, hasChanged } = diffAndMergeTokenList(prev, enriched, false);
					return hasChanged ? merged : prev;
				});
				setRawResults((prev) => {
					const { merged, hasChanged } = diffAndMergeTokenList(prev, enriched, false);
					return hasChanged ? merged : prev;
				});
			}).catch(() => {});
		} catch (err) {
			if (err?.name === "AbortError" || signal.aborted) return;
			setError(err?.message || "Could not retrieve multi-source latest listings.");
		} finally {
			if (!signal.aborted && paintFlightRef.current === 0) setLoading(false);
		}
	}, [diffAndMergeTokenList, paintDiscoveryPool]);
	const fetchFreshMints = (0, import_react.useCallback)(async (isBackground = false, targetChain, forceRefresh) => {
		const abortRef = isBackground ? freshMintsBgAbortRef : freshMintsAbortRef;
		if (abortRef.current) abortRef.current.abort();
		const controller = new AbortController();
		abortRef.current = controller;
		const signal = controller.signal;
		if (!isBackground) {
			setLoading(true);
			setError(null);
			paintDiscoveryPool("fresh_mints", signal, targetChain);
		}
		try {
			const canonicalTokens = await aggregateMultiSourceTokens("fresh_mints", void 0, signal, "all", forceRefresh);
			if (signal.aborted) return;
			const sortedByAge = [...canonicalTokens].sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0));
			if (isBackground) {
				setRawResults((prev) => {
					const prevKeys = new Set(prev.map((p) => `${p.chainId}:${(p.pairAddress || p.baseToken?.address || "").toLowerCase()}`));
					let newTokensCount = 0;
					for (const item of sortedByAge) {
						const key = `${item.chainId}:${(item.pairAddress || item.baseToken?.address || "").toLowerCase()}`;
						if (!prevKeys.has(key)) newTokensCount++;
					}
					if (newTokensCount > 0) triggerFreshMintsToast(newTokensCount);
					const { merged, hasChanged } = diffAndMergeTokenList(prev, sortedByAge, true);
					return hasChanged ? merged : prev;
				});
				setPairs((prev) => {
					const { merged, hasChanged } = diffAndMergeTokenList(prev, sortedByAge, true);
					return hasChanged ? merged : prev;
				});
			} else if (sortedByAge.length > 0) {
				setPairs((prev) => diffAndMergeTokenList(prev, sortedByAge, true).merged);
				setRawResults((prev) => diffAndMergeTokenList(prev, sortedByAge, true).merged);
			}
			enrichTokensWithMetadataConcurrently(sortedByAge, signal).then((enriched) => {
				if (signal.aborted) return;
				setPairs((prev) => {
					const { merged, hasChanged } = diffAndMergeTokenList(prev, enriched, true);
					return hasChanged ? merged : prev;
				});
				setRawResults((prev) => {
					const { merged, hasChanged } = diffAndMergeTokenList(prev, enriched, true);
					return hasChanged ? merged : prev;
				});
			}).catch(() => {});
		} catch (err) {
			if (err?.name === "AbortError" || signal.aborted) return;
			if (!isBackground) setError(err?.message || "Could not retrieve fresh mints.");
		} finally {
			if (!signal.aborted && !isBackground && paintFlightRef.current === 0) setLoading(false);
		}
	}, [
		diffAndMergeTokenList,
		triggerFreshMintsToast,
		paintDiscoveryPool
	]);
	const handleManualRefresh = (0, import_react.useCallback)(() => {
		clearAllProviderCaches();
		if (searchQuery.trim()) fetchSearchPairs(searchQuery, void 0, true);
		else if (activeTab === "trending") fetchTrendingBoosts(void 0, true);
		else if (activeTab === "latest") fetchLatestListings(void 0, true);
		else if (activeTab === "fresh_mints") fetchFreshMints(false, void 0, true);
	}, [
		searchQuery,
		activeTab,
		fetchSearchPairs,
		fetchTrendingBoosts,
		fetchLatestListings,
		fetchFreshMints
	]);
	(0, import_react.useEffect)(() => {
		setCurrentPage(1);
		const timer = setTimeout(() => {
			if (searchQuery.trim()) fetchSearchPairs(searchQuery);
			else if (activeTab === "trending") fetchTrendingBoosts();
			else if (activeTab === "latest") fetchLatestListings();
			else if (activeTab === "fresh_mints") fetchFreshMints(false);
		}, 300);
		return () => clearTimeout(timer);
	}, [
		activeTab,
		searchQuery,
		fetchSearchPairs,
		fetchTrendingBoosts,
		fetchLatestListings,
		fetchFreshMints
	]);
	const indexListQuery = {
		chainId: chain,
		dex: selectedDex,
		minVolume,
		maxVolume,
		minLiquidity,
		minMarketCap,
		maxMarketCap,
		minPriceChange,
		telegram: reqTelegram,
		xProfile: reqXProfile,
		xPost: reqXPost,
		discord: reqDiscord,
		website: reqWebsite,
		verified: verifiedOnly
	};
	const indexFiltersActive = chain !== "all" || selectedDex !== "all" || minVolume !== "" || maxVolume !== "" || minLiquidity !== "" || minMarketCap !== "" || maxMarketCap !== "" || minPriceChange !== "" || reqTelegram || reqXProfile || reqXPost || reqDiscord || reqWebsite || verifiedOnly;
	(0, import_react.useEffect)(() => {
		if (feedPaused || searchQuery.trim()) return;
		const tick = () => {
			const req = windowReqRef.current;
			const mode = activeTab === "trending" ? "trending" : activeTab === "latest" ? "latest" : "fresh_mints";
			if (serverPagedRef.current) {
				fetchDiscoveryPage({
					mode,
					age: ageFilter,
					limit: 200,
					...indexListQuery
				}).then((page) => {
					if (windowReqRef.current !== req || !serverPagedRef.current || !page.tokens.length) return;
					const byAge = mode !== "trending";
					setPagedResults((prev) => {
						const { merged, hasChanged } = diffAndMergeTokenList(prev ?? [], page.tokens, byAge);
						return hasChanged ? merged : prev;
					});
					setIndexTotal(page.total);
				}).catch(() => {});
				return;
			}
			fetchDiscoveryPage({
				mode,
				age: ageFilter,
				limit: 200,
				...indexListQuery
			}).then((page) => {
				if (windowReqRef.current !== req || serverPagedRef.current || !page.tokens.length) return;
				const byAge = mode !== "trending";
				setRawResults((prev) => {
					const { merged, hasChanged } = diffAndMergeTokenList(prev, page.tokens, byAge);
					return hasChanged ? merged : prev;
				});
				setPairs((prev) => {
					const { merged, hasChanged } = diffAndMergeTokenList(prev, page.tokens, byAge);
					return hasChanged ? merged : prev;
				});
			}).catch(() => {});
		};
		const intervalId = setInterval(tick, 3e3);
		return () => clearInterval(intervalId);
	}, [
		activeTab,
		searchQuery,
		feedPaused,
		diffAndMergeTokenList,
		ageFilter,
		chain,
		selectedDex,
		minVolume,
		maxVolume,
		minLiquidity,
		minMarketCap,
		maxMarketCap,
		minPriceChange,
		reqTelegram,
		reqXProfile,
		reqXPost,
		reqDiscord,
		reqWebsite,
		verifiedOnly
	]);
	(0, import_react.useEffect)(() => {
		if (!serverPaged) {
			pageReqRef.current += 1;
			setIndexPaging(false);
			if (wasServerPagedRef.current) {
				wasServerPagedRef.current = false;
				setPagedResults(null);
				setIndexTotal(null);
				setIndexCursor(null);
				setIndexPageError(null);
			}
			return;
		}
		wasServerPagedRef.current = true;
		setPagedResults(null);
		setIndexCursor(null);
		setIndexTotal(null);
		const req = ++pageReqRef.current;
		const mode = activeTab;
		const limit = 400;
		setIndexPaging(true);
		setIndexPageError(null);
		const timer = setTimeout(() => {
			(async () => {
				try {
					let page = await fetchDiscoveryPage({
						mode,
						age: ageFilter,
						limit,
						...indexListQuery
					});
					if (pageReqRef.current !== req) return;
					let tokens = page.tokens;
					let cursor = page.nextCursor;
					if (pageReqRef.current !== req) return;
					setPagedResults(tokens);
					setIndexTotal(page.total);
					setIndexCursor(cursor);
					setLoading(false);
				} catch (err) {
					if (pageReqRef.current !== req) return;
					setIndexPageError(loadedCountRef.current ? null : err?.message || "Could not load this window");
				} finally {
					if (pageReqRef.current === req) setIndexPaging(false);
				}
			})();
		}, 200);
		return () => clearTimeout(timer);
	}, [
		serverPaged,
		ageFilter,
		activeTab,
		indexRetry,
		chain,
		selectedDex,
		minVolume,
		maxVolume,
		minLiquidity,
		minMarketCap,
		maxMarketCap,
		minPriceChange,
		reqTelegram,
		reqXProfile,
		reqXPost,
		reqDiscord,
		reqWebsite,
		verifiedOnly
	]);
	(0, import_react.useEffect)(() => {
		if (searchQuery.trim() || serverPaged) return;
		const mode = activeTab === "trending" ? "trending" : activeTab === "latest" ? "latest" : "fresh_mints";
		if (!(indexFiltersActive || ageFilter !== "1w")) {
			if (!narrowedPoolRef.current) return;
			narrowedPoolRef.current = false;
			const req = ++windowReqRef.current;
			const timer = setTimeout(() => {
				fetchDiscoveryPage({
					mode,
					chainId: "all",
					age: "1w",
					limit: 5e3
				}).then((page) => {
					if (windowReqRef.current !== req) return;
					setRawResults(page.tokens);
					setPairs(page.tokens);
					setIndexTotal(page.total);
					setIndexCursor(page.nextCursor);
					setIndexPageError(null);
				}).catch(() => {});
			}, 200);
			return () => clearTimeout(timer);
		}
		narrowedPoolRef.current = true;
		const req = ++windowReqRef.current;
		const timer = setTimeout(() => {
			fetchDiscoveryPage({
				mode,
				age: ageFilter,
				limit: 5e3,
				...indexListQuery
			}).then((page) => {
				if (windowReqRef.current !== req) return;
				setRawResults(page.tokens);
				setPairs(page.tokens);
				setIndexTotal(page.total);
				setIndexCursor(page.nextCursor);
				setIndexPageError(null);
				setLoading(false);
			}).catch((err) => {
				if (windowReqRef.current !== req) return;
				setIndexPageError(err?.message || "Could not load this window");
			});
		}, 200);
		return () => clearTimeout(timer);
	}, [
		serverPaged,
		searchQuery,
		activeTab,
		ageFilter,
		indexFiltersActive,
		chain,
		selectedDex,
		minVolume,
		maxVolume,
		minLiquidity,
		minMarketCap,
		maxMarketCap,
		minPriceChange,
		reqTelegram,
		reqXProfile,
		reqXPost,
		reqDiscord,
		reqWebsite,
		verifiedOnly
	]);
	const loadMoreIndex = (0, import_react.useCallback)(() => {
		if (!indexCursor || indexPaging) return;
		const req = pageReqRef.current;
		const mode = activeTab === "trending" ? "trending" : activeTab === "latest" ? "latest" : "fresh_mints";
		const bounds = {
			minVolume,
			maxVolume,
			minLiquidity,
			minMarketCap,
			maxMarketCap,
			minPriceChange
		};
		setIndexPaging(true);
		setIndexPageError(null);
		fetchDiscoveryPage({
			mode,
			age: ageFilter,
			cursor: indexCursor,
			limit: 400,
			...indexListQuery,
			...bounds
		}).then((page) => {
			if (pageReqRef.current !== req) return;
			if (serverPagedRef.current) setPagedResults((prev) => appendUniqueTokens(prev ?? [], page.tokens));
			else {
				setRawResults((prev) => appendUniqueTokens(prev, page.tokens));
				setPairs((prev) => appendUniqueTokens(prev, page.tokens));
			}
			setIndexTotal(page.total);
			setIndexCursor(page.nextCursor);
		}).catch((err) => {
			if (pageReqRef.current !== req) return;
			setIndexPageError(loadedCountRef.current ? null : err?.message || "Could not load the next page");
		}).finally(() => {
			if (pageReqRef.current === req) setIndexPaging(false);
		});
	}, [
		indexCursor,
		indexPaging,
		activeTab,
		ageFilter,
		chain,
		selectedDex,
		minVolume,
		maxVolume,
		minLiquidity,
		minMarketCap,
		maxMarketCap,
		minPriceChange,
		reqTelegram,
		reqXProfile,
		reqXPost,
		reqDiscord,
		reqWebsite,
		verifiedOnly
	]);
	(0, import_react.useEffect)(() => {
		setCurrentPage(1);
	}, [
		chain,
		selectedDex,
		minVolume,
		maxVolume,
		minLiquidity,
		minMarketCap,
		maxMarketCap,
		reqTelegram,
		reqXProfile,
		reqXPost,
		reqDiscord,
		reqWebsite,
		verifiedOnly,
		sortBy,
		searchQuery,
		ageFilter
	]);
	const closeOpenToken = () => {
		setDetailKey((prev) => prev ? "" : prev);
		setExpandedCards((prev) => Object.keys(prev).length ? {} : prev);
	};
	const handleSearchSubmit = (e) => {
		if (e) e.preventDefault();
		if (searchQuery.trim()) {
			closeOpenToken();
			setHasSearched(true);
			setIsSearchPanelCollapsed(true);
			if (searchInputRef.current) searchInputRef.current.blur();
			fetchSearchPairs(searchQuery);
		}
	};
	const handleQuickTagClick = (tag) => {
		closeOpenToken();
		setSearchQuery(tag);
		setHasSearched(true);
		setIsSearchPanelCollapsed(true);
		fetchSearchPairs(tag, chain);
	};
	const handleClearSearch = (0, import_react.useCallback)(() => {
		setSearchQuery("");
		setHasSearched(false);
		setIsSearchPanelCollapsed(false);
		if (activeTab === "trending") fetchTrendingBoosts();
		else if (activeTab === "latest") fetchLatestListings();
		else if (activeTab === "fresh_mints") fetchFreshMints(false);
	}, [
		activeTab,
		fetchTrendingBoosts,
		fetchLatestListings,
		fetchFreshMints
	]);
	const activePreset = (0, import_react.useMemo)(() => {
		if (chain === "all" && selectedDex === "all" && minVolume === 5e5 && minLiquidity === 1e5 && minMarketCap === 5e6 && maxMarketCap === "" && !reqTelegram && !reqXProfile && !reqXPost && !reqWebsite && ageFilter === "all" && sortBy === "liquidity") return "bluechip";
		if (chain === "solana" && selectedDex === "all" && minVolume === 1e5 && minLiquidity === 2e4 && minMarketCap === "" && maxMarketCap === "" && reqTelegram && reqXProfile && reqXPost && reqWebsite && ageFilter === "all" && sortBy === "volume") return "solgems";
		if (chain === "all" && selectedDex === "all" && minVolume === "" && minLiquidity === 5e3 && minMarketCap === 1e4 && maxMarketCap === 5e5 && reqTelegram && reqXProfile && reqXPost && !reqWebsite && ageFilter === "all" && sortBy === "priceChange") return "microcaps";
		if (chain === "base" && selectedDex === "all" && minVolume === 5e4 && minLiquidity === 1e4 && minMarketCap === 1e4 && maxMarketCap === 1e6 && reqTelegram && reqXProfile && reqXPost && !reqWebsite && ageFilter === "all" && sortBy === "priceChange") return "base-moonshots";
		if (chain === "all" && selectedDex === "all" && minVolume === 1e6 && maxVolume === "" && minLiquidity === 5e4 && minMarketCap === 1e6 && maxMarketCap === "" && !reqTelegram && !reqXProfile && !reqXPost && !reqWebsite && ageFilter === "all" && sortBy === "volume") return "high-volume";
		return "custom";
	}, [
		chain,
		selectedDex,
		minVolume,
		maxVolume,
		minLiquidity,
		minMarketCap,
		maxMarketCap,
		reqTelegram,
		reqXProfile,
		reqXPost,
		reqWebsite,
		sortBy,
		ageFilter
	]);
	const hasActiveFilters = (0, import_react.useMemo)(() => {
		return chain !== "all" || selectedDex !== "all" || minVolume !== "" || maxVolume !== "" || minLiquidity !== "" || minMarketCap !== "" || maxMarketCap !== "" || minPriceChange !== "" || ageFilter !== "1w" || reqTelegram || reqXProfile || reqXPost || reqDiscord || reqWebsite || verifiedOnly || activePreset !== "custom";
	}, [
		chain,
		selectedDex,
		minVolume,
		maxVolume,
		minLiquidity,
		minMarketCap,
		maxMarketCap,
		minPriceChange,
		ageFilter,
		reqTelegram,
		reqXProfile,
		reqXPost,
		reqDiscord,
		reqWebsite,
		verifiedOnly,
		activePreset
	]);
	const resetFilters = () => {
		chainBeforeLaunchpadRef.current = null;
		setChain("all");
		setSelectedDex("all");
		setSearchQuery("");
		setMinVolume("");
		setMaxVolume("");
		setMinLiquidity("");
		setMinMarketCap("");
		setMaxMarketCap("");
		setMinPriceChange("");
		setReqTelegram(false);
		setReqXProfile(false);
		setReqXPost(false);
		setReqDiscord(false);
		setReqWebsite(false);
		setVerifiedOnly(false);
		setAgeFilter("1w");
		setSortBy("none");
		setCurrentPage(1);
		setError(null);
		setIndexPageError(null);
		setShowFiltersMobile(false);
		closeOpenToken();
	};
	const applyPanelFilters = (next) => {
		chainBeforeLaunchpadRef.current = null;
		setChain(next.chains.length ? formatChainSelection(next.chains) : "all");
		setSelectedDex(next.sources.length ? next.sources.join(",") : "all");
		setAgeFilter(next.pairAge || "all");
		setMinVolume(next.volumeMin ?? "");
		setMaxVolume(next.volumeMax ?? "");
		setMinLiquidity(next.liquidityMin ?? "");
		setMinMarketCap(next.marketCapMin ?? "");
		setMaxMarketCap(next.marketCapMax ?? "");
		setMinPriceChange(next.change24hMin ?? "");
		setReqTelegram(next.social.telegram === "required");
		setReqXProfile(next.social.xProfile);
		setReqXPost(next.social.xPost);
		setReqDiscord(next.social.discord === "required");
		setReqWebsite(next.social.website === "required");
		setVerifiedOnly(next.verifiedOnly);
		const presetSort = {
			"defi-bluechips": "liquidity",
			"solana-gems": "none",
			"microcap-degens": "priceChange",
			"base-breakouts": "priceChange",
			"high-vol-trenders": "volume"
		};
		if (next.preset && presetSort[next.preset]) setSortBy(presetSort[next.preset]);
		setCurrentPage(1);
		setError(null);
		setIndexPageError(null);
		setShowFiltersMobile(false);
	};
	const panelInitialFilters = () => {
		return {
			preset: {
				bluechip: "defi-bluechips",
				solgems: "solana-gems",
				microcaps: "microcap-degens",
				"base-moonshots": "base-breakouts",
				"high-volume": "high-vol-trenders"
			}[activePreset] || null,
			chains: chain === "all" ? [] : chainSelectionList(chain),
			sources: selectedDex === "all" ? [] : selectedDex.split(",").filter(Boolean),
			pairAge: ageFilter || "all",
			volumeMin: minVolume === "" ? null : minVolume,
			volumeMax: maxVolume === "" ? null : maxVolume,
			marketCapMin: minMarketCap === "" ? null : minMarketCap,
			marketCapMax: maxMarketCap === "" ? null : maxMarketCap,
			liquidityMin: minLiquidity === "" ? null : minLiquidity,
			change24hMin: minPriceChange === "" ? null : minPriceChange,
			social: {
				telegram: reqTelegram ? "required" : "any",
				discord: reqDiscord ? "required" : "any",
				website: reqWebsite ? "required" : "any",
				xProfile: reqXProfile,
				xPost: reqXPost
			},
			verifiedOnly
		};
	};
	const countPanelMatches = (draft) => {
		return resolveBrowseQuery(browseSource || [], searchQuery, {
			chain: draft.chains.length ? formatChainSelection(draft.chains) : "all",
			dex: draft.sources.length ? draft.sources.join(",") : "all",
			age: searchQuery.trim() ? "all" : draft.pairAge || "all",
			minVolume: draft.volumeMin ?? "",
			maxVolume: draft.volumeMax ?? "",
			minLiquidity: draft.liquidityMin ?? "",
			minMarketCap: draft.marketCapMin ?? "",
			maxMarketCap: draft.marketCapMax ?? "",
			minPriceChange: draft.change24hMin ?? "",
			telegram: draft.social.telegram === "required",
			twitter: false,
			xProfile: draft.social.xProfile,
			xPost: draft.social.xPost,
			discord: draft.social.discord === "required",
			website: draft.social.website === "required",
			verified: draft.verifiedOnly
		}, (tokens, filters) => applyLoadedFilters(tokens.filter((pair) => !is1kMarketCap(pair)), filters)).length;
	};
	(0, import_react.useRef)(null);
	const browseSource = serverPaged && pagedResults ? pagedResults : rawResults;
	(0, import_react.useMemo)(() => {
		const counts = { all: 0 };
		const list = browseSource && browseSource.length > 0 ? browseSource : pairs;
		if (Array.isArray(list)) {
			counts.all = list.length;
			for (const p of list) {
				if (!p?.chainId) continue;
				const c = normalizeChainName(p.chainId);
				counts[c] = (counts[c] || 0) + 1;
			}
		}
		return counts;
	}, [browseSource, pairs]);
	const handleHomeClick = () => {
		resetFilters();
		setSearchQuery("");
		if (activeTab === "trending") fetchTrendingBoosts(void 0, true);
		else setActiveTab("trending");
	};
	const LARGE_DATASET_CSV_THRESHOLD = 50;
	const triggerExportCSV = () => {
		if (filteredAndSortedPairs.length === 0) return;
		exportTokensToCSV(filteredAndSortedPairs, `dexhunter_${activeTab}_aggregated_export.csv`);
		setShowExportConfirm(false);
	};
	const triggerExportJSON = () => {
		if (filteredAndSortedPairs.length === 0) return;
		const jsonStr = JSON.stringify(filteredAndSortedPairs, null, 2);
		const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", `dexhunter_${activeTab}_export_${Date.now()}.json`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
		setShowExportConfirm(false);
	};
	const handleExportToCSV = () => {
		if (filteredAndSortedPairs.length === 0) return;
		if (filteredAndSortedPairs.length >= LARGE_DATASET_CSV_THRESHOLD) setShowExportConfirm(true);
		else triggerExportCSV();
	};
	const filteredAndSortedPairs = (0, import_react.useMemo)(() => {
		if (!browseSource || browseSource.length === 0) return [];
		const qTrim = searchQuery.trim();
		const searching = qTrim.length > 0;
		let result = resolveBrowseQuery(browseSource, qTrim, {
			chain: searching ? "all" : chain,
			dex: searching ? "all" : selectedDex,
			age: searching ? "all" : ageFilter,
			minVolume: searching ? "" : minVolume,
			maxVolume: searching ? "" : maxVolume,
			minLiquidity: searching ? "" : minLiquidity,
			minMarketCap: searching ? "" : minMarketCap,
			maxMarketCap: searching ? "" : maxMarketCap,
			minPriceChange: searching ? "" : minPriceChange,
			telegram: searching ? false : reqTelegram,
			twitter: false,
			xProfile: searching ? false : reqXProfile,
			xPost: searching ? false : reqXPost,
			discord: searching ? false : reqDiscord,
			website: searching ? false : reqWebsite,
			verified: searching ? false : verifiedOnly
		}, (tokens, filters) => applyLoadedFilters(tokens.filter((pair) => !is1kMarketCap(pair)), filters));
		if (activeTab === "trending") result.sort((a, b) => {
			if (sortBy === "volume") return Number(b.volume?.h24 || 0) - Number(a.volume?.h24 || 0);
			else if (sortBy === "liquidity") return Number(b.liquidity?.usd || 0) - Number(a.liquidity?.usd || 0);
			else if (sortBy === "priceChange") return Number(b.priceChange?.h24 || 0) - Number(a.priceChange?.h24 || 0);
			else if (sortBy === "marketCap") {
				const capA = marketCapOf(a);
				return (marketCapOf(b) ?? -Infinity) - (capA ?? -Infinity);
			} else if (sortBy === "newest") return compareCreatedDesc(a, b);
			else if (sortBy === "price") return Number(b.priceUsd || 0) - Number(a.priceUsd || 0);
			else {
				const scoreA = Number(a.scoreBreakdown?.total ?? calculateFinalDexHunterScore(a, "trending"));
				return Number(b.scoreBreakdown?.total ?? calculateFinalDexHunterScore(b, "trending")) - scoreA;
			}
		});
		else if (sortBy === "volume") result.sort((a, b) => Number(b.volume?.h24 || 0) - Number(a.volume?.h24 || 0));
		else if (sortBy === "liquidity") result.sort((a, b) => Number(b.liquidity?.usd || 0) - Number(a.liquidity?.usd || 0));
		else if (sortBy === "priceChange") result.sort((a, b) => Number(b.priceChange?.h24 || 0) - Number(a.priceChange?.h24 || 0));
		else if (sortBy === "marketCap") result.sort((a, b) => (marketCapOf(b) ?? -Infinity) - (marketCapOf(a) ?? -Infinity));
		else if (sortBy === "newest") result.sort(compareCreatedDesc);
		else if (sortBy === "price") result.sort((a, b) => Number(b.priceUsd || 0) - Number(a.priceUsd || 0));
		else if (sortBy === "trending") result.sort((a, b) => {
			const scoreA = Number(a.scoreBreakdown?.total ?? calculateFinalDexHunterScore(a, "trending"));
			return Number(b.scoreBreakdown?.total ?? calculateFinalDexHunterScore(b, "trending")) - scoreA;
		});
		else if (sortBy === "momentum") result.sort((a, b) => {
			const momA = Number(a.momentumScore || 0) + (hasSocialLinks(a) ? 8 : -8);
			return Number(b.momentumScore || 0) + (hasSocialLinks(b) ? 8 : -8) - momA;
		});
		if ((activeTab === "latest" || activeTab === "fresh_mints") && sortBy === "none") result.sort(compareCreatedDesc);
		return result;
	}, [
		browseSource,
		chain,
		selectedDex,
		searchQuery,
		minVolume,
		maxVolume,
		minLiquidity,
		minMarketCap,
		maxMarketCap,
		minPriceChange,
		reqTelegram,
		reqXProfile,
		reqXPost,
		reqDiscord,
		reqWebsite,
		verifiedOnly,
		sortBy,
		ageFilter,
		activeTab
	]);
	(0, import_react.useEffect)(() => {
		if (!searchQuery.trim()) setSearchNote(null);
	}, [searchQuery]);
	(0, import_react.useEffect)(() => {
		if (loading || !searchQuery.trim() || filteredAndSortedPairs.length > 0) return;
		if (!(chain !== "all" || selectedDex !== "all" || minVolume !== "" || maxVolume !== "" || minLiquidity !== "" || minMarketCap !== "" || maxMarketCap !== "" || minPriceChange !== "" || reqTelegram || reqXProfile || reqXPost || reqDiscord || reqWebsite || verifiedOnly || ageFilter !== "1w")) return;
	}, [
		loading,
		searchQuery,
		filteredAndSortedPairs.length,
		chain,
		selectedDex,
		minVolume,
		maxVolume,
		minLiquidity,
		minMarketCap,
		maxMarketCap,
		minPriceChange,
		reqTelegram,
		reqXProfile,
		reqXPost,
		reqDiscord,
		reqWebsite,
		verifiedOnly,
		ageFilter,
		fetchSearchPairs
	]);
	const totalPages = (0, import_react.useMemo)(() => {
		return Math.ceil(filteredAndSortedPairs.length / PAGE_SIZE);
	}, [filteredAndSortedPairs.length]);
	const paginatedPairs = (0, import_react.useMemo)(() => {
		const startIndex = (currentPage - 1) * PAGE_SIZE;
		return filteredAndSortedPairs.slice(startIndex, startIndex + PAGE_SIZE);
	}, [filteredAndSortedPairs, currentPage]);
	const getChainBadgeStyle = (chainId) => {
		const norm = normalizeChainName(chainId);
		if (norm === "solana") return {
			bg: "bg-[#1c122c] text-[#a180e6] border-[#3e2c5d]",
			text: "SOLANA"
		};
		if (norm === "base") return {
			bg: "bg-[#101c30] text-[#5586f2] border-[#223963]",
			text: "BASE"
		};
		if (norm === "bsc") return {
			bg: "bg-[#201c10] text-[#f0b90b] border-[#443818]",
			text: "BSC"
		};
		if (norm === "ethereum") return {
			bg: "bg-[#102420] text-[#6ebd80] border-[#1f423b]",
			text: "ETHEREUM"
		};
		if (norm === "robinhood") return {
			bg: "bg-[#102418] text-[#00c805] border-[#1b4322]",
			text: "ROBINHOOD"
		};
		if (norm === "arbitrum") return {
			bg: "bg-[#111e2e] text-[#28a0f0] border-[#1e344e]",
			text: "ARBITRUM"
		};
		if (norm === "polygon") return {
			bg: "bg-[#1a102b] text-[#9d5bf0] border-[#331c59]",
			text: "POLYGON"
		};
		if (norm === "avalanche") return {
			bg: "bg-[#241215] text-[#e84142] border-[#4d1f23]",
			text: "AVALANCHE"
		};
		if (norm === "cronos") return {
			bg: "bg-[#0b1626] text-[#1199fa] border-[#162c4c]",
			text: "CRONOS"
		};
		if (norm === "arc") return {
			bg: "bg-[#261f0d] text-[#e6b800] border-[#59440e]",
			text: "ARC"
		};
		return {
			bg: "bg-[#181818] text-gray-400 border-[#2a2a2a]",
			text: chainId?.toUpperCase() || "UNKNOWN"
		};
	};
	const formatTimeAgo = (timestampMs) => {
		if (!timestampMs) return null;
		let ts = typeof timestampMs === "string" ? Number(timestampMs) : timestampMs;
		if (isNaN(ts) && typeof timestampMs === "string") ts = new Date(timestampMs).getTime();
		if (!ts || isNaN(ts) || ts <= 0) return null;
		if (ts < 1e10) ts = ts * 1e3;
		const diffMs = Date.now() - ts;
		if (diffMs <= 0) return "Just now";
		const diffSec = Math.floor(diffMs / 1e3);
		if (diffSec < 60) return `${diffSec}s ago`;
		const diffMin = Math.floor(diffSec / 60);
		if (diffMin < 60) return `${diffMin}m ago`;
		const diffHr = Math.floor(diffMin / 60);
		if (diffHr < 24) return `${diffHr}h ${diffMin % 60}m ago`;
		const diffDay = Math.floor(diffHr / 24);
		if (diffDay < 30) {
			const remainingHr = diffHr % 24;
			return remainingHr > 0 ? `${diffDay}d ${remainingHr}h ago` : `${diffDay}d ago`;
		}
		const diffMonth = Math.floor(diffDay / 30);
		if (diffMonth < 12) {
			const remDays = diffDay % 30;
			return remDays > 0 ? `${diffMonth}mo ${remDays}d ago` : `${diffMonth}mo ago`;
		}
		const diffYear = Math.floor(diffDay / 365);
		const remMonths = Math.floor(diffDay % 365 / 30);
		return remMonths > 0 ? `${diffYear}y ${remMonths}mo ago` : `${diffYear}y ago`;
	};
	const formatExactDate = (timestampMs) => {
		if (!timestampMs) return void 0;
		let ts = typeof timestampMs === "string" ? Number(timestampMs) : timestampMs;
		if (isNaN(ts) && typeof timestampMs === "string") ts = new Date(timestampMs).getTime();
		if (!ts || isNaN(ts) || ts <= 0) return void 0;
		if (ts < 1e10) ts = ts * 1e3;
		return new Date(ts).toLocaleString(void 0, {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			timeZoneName: "short"
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `min-h-screen ${theme.bgMain} flex flex-col font-sans transition-colors duration-300`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: `border-b ${theme.bgHeader} py-1.5 sm:py-2.5 px-3 sm:px-6 flex flex-col xl:flex-row xl:items-center justify-between gap-1.5 sm:gap-3 xl:sticky xl:top-0 z-50 transition-all duration-300`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between w-full xl:w-auto min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 sm:gap-2.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								id: "btn_pause_feed",
								type: "button",
								onClick: () => setFeedPaused((paused) => !paused),
								className: `flex p-1.5 sm:px-2.5 sm:py-1 rounded-xl border transition-all items-center gap-1.5 text-xs font-medium cursor-pointer active:scale-95 ${feedPaused ? "bg-[#ff6b35] border-[#ff6b35] text-white" : isDarkMode ? "bg-[#181824] border-zinc-800 text-zinc-200 hover:border-[#ff6b35]/60" : "bg-white border-slate-200 text-slate-700 hover:border-[#ff6b35]/60"}`,
								title: feedPaused ? "Resume. New coins will drop in again." : "Pause. The list stays still.",
								"aria-pressed": feedPaused,
								"aria-label": feedPaused ? "Resume live feed" : "Pause live feed",
								children: [feedPaused ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden sm:inline",
									children: feedPaused ? "Resume" : "Pause"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								id: "btn_export_csv_top_left",
								onClick: handleExportToCSV,
								disabled: filteredAndSortedPairs.length === 0,
								className: `hidden p-1.5 sm:px-2.5 sm:py-1 rounded-xl border transition-all items-center gap-1.5 text-xs font-medium cursor-pointer disabled:opacity-30 active:scale-95 ${isDarkMode ? "bg-[#181824] border-zinc-800 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-950/20" : "bg-white border-slate-200 text-emerald-700 hover:bg-emerald-50"}`,
								title: "Export filtered pairs to CSV",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "w-3.5 h-3.5 text-emerald-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "CSV" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								id: "btn_brand_home_refresh",
								onClick: handleHomeClick,
								className: "flex items-center gap-2 group cursor-pointer text-left border-none bg-transparent p-0 outline-none select-none",
								title: "Return to DexHunter Homepage & Refresh Feed",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "p-1 sm:p-1.5 flex items-center justify-center rounded-xl border border-[#ff6b35]/30 bg-[#ff6b35]/15 group-hover:bg-[#ff6b35]/25 group-hover:border-[#ff6b35] transition-all",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "w-4 h-4 text-[#ff6b35] group-hover:scale-110 transition-transform duration-200" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-baseline gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
										className: `font-display text-base sm:text-lg font-bold tracking-tight ${theme.textTitle} m-0 transition-colors duration-300 group-hover:text-[#ff6b35]`,
										children: "DexHunter"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `text-[10px] ${theme.textMuted} font-medium tracking-tight hidden sm:inline`,
										children: "Discovery"
									})]
								})]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "xl:hidden flex items-center gap-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								id: "btn_toggle_search_mobile",
								type: "button",
								onClick: () => {
									if (isSearchPanelCollapsed) {
										setIsSearchOpen(true);
										setIsSearchPanelCollapsed(false);
										requestAnimationFrame(() => {
											searchInputRef.current?.focus();
										});
									} else if (isSearchOpen) handleCloseSearch();
									else handleOpenSearch();
								},
								className: `flex items-center justify-center transition-all border outline-none cursor-pointer rounded-lg w-8 h-8 relative before:absolute before:-inset-2 sm:before:hidden touch-manipulation ${isSearchOpen || searchQuery.trim() ? "bg-[#ff6b35]/15 border-[#ff6b35] text-[#ff6b35]" : `${theme.btnSecondary} hover:text-[#ff6b35]`}`,
								title: "Search tokens",
								"aria-label": "Search tokens",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "w-3.5 h-3.5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								id: "btn_export_csv_mobile",
								type: "button",
								onClick: handleExportToCSV,
								disabled: filteredAndSortedPairs.length === 0,
								className: `flex items-center justify-center transition-all border outline-none cursor-pointer rounded-lg w-8 h-8 disabled:opacity-30 relative before:absolute before:-inset-2 sm:before:hidden touch-manipulation ${isDarkMode ? "bg-[#181824] border-zinc-800 text-emerald-400" : "bg-white border-slate-200 text-emerald-700"}`,
								title: "Export CSV",
								"aria-label": "Export CSV",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "w-3.5 h-3.5 text-emerald-500" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								id: "btn_toggle_theme_mobile",
								type: "button",
								onClick: toggleTheme,
								className: `flex items-center justify-center transition-all border outline-none cursor-pointer rounded-lg w-8 h-8 relative before:absolute before:-inset-2 sm:before:hidden touch-manipulation ${isDarkMode ? "bg-[#1f202e] border-zinc-800 text-yellow-400" : "bg-slate-100 border-slate-200 text-indigo-600"}`,
								title: `Toggle Theme Mode (Current: ${isDarkMode ? "Dark" : "Light"})`,
								"aria-label": "Toggle Theme Mode",
								children: isDarkMode ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "w-3.5 h-3.5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								ref: settingsTriggerMobileRef,
								id: "btn_open_settings_mobile",
								type: "button",
								onClick: () => setShowSettingsModal(true),
								className: `flex items-center justify-center transition-all border outline-none cursor-pointer rounded-lg w-8 h-8 relative before:absolute before:-inset-2 sm:before:hidden touch-manipulation ${isDarkMode ? "bg-[#1f202e] border-zinc-800 text-zinc-300" : "bg-slate-100 border-slate-200 text-slate-700"}`,
								title: "Settings",
								"aria-label": "Open Settings",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "w-3.5 h-3.5" })
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2 sm:gap-3 w-full xl:w-auto mt-0.5 xl:mt-0 justify-between xl:justify-end min-w-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `p-0.5 sm:p-1 border text-xs sm:text-sm flex-1 xl:flex-none flex items-center gap-1 rounded-xl transition-colors duration-300 ${theme.bgTabs}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									id: "tab_trending",
									onClick: () => {
										setActiveTab("trending");
										if (sortBy === "newest") setSortBy("trending");
										if (searchQuery) {
											closeOpenToken();
											setSearchQuery("");
											fetchTrendingBoosts();
										}
									},
									className: `flex-1 xl:flex-none px-3 sm:px-4 py-2 sm:py-2 font-medium transition-all rounded-lg flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] sm:min-h-0 touch-manipulation ${activeTab === "trending" && !searchQuery ? "bg-[#ff6b35] text-white shadow-xs" : `${theme.textSub} hover:text-[#ff6b35]`}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "w-3.5 h-3.5 text-amber-400 animate-pulse flex-shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Trending" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									id: "tab_latest",
									onClick: () => {
										setActiveTab("latest");
										setSortBy("newest");
										if (searchQuery) {
											closeOpenToken();
											setSearchQuery("");
											fetchLatestListings();
										}
									},
									className: `flex-1 xl:flex-none px-3 sm:px-4 py-2 sm:py-2 font-medium transition-all rounded-lg flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] sm:min-h-0 touch-manipulation ${activeTab === "latest" && !searchQuery ? "bg-[#ff6b35] text-white shadow-xs" : `${theme.textSub} hover:text-[#ff6b35]`}`,
									title: "Latest listings from the last 7 days",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "w-3.5 h-3.5 text-yellow-400 flex-shrink-0" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Latest" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "hidden sm:inline text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/15 dark:bg-white/15 tracking-tight",
											children: "≤7d"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									id: "tab_fresh_mints",
									onClick: () => {
										setActiveTab("fresh_mints");
										setSortBy("newest");
										if (searchQuery) {
											closeOpenToken();
											setSearchQuery("");
											fetchFreshMints();
										}
									},
									className: `flex-1 xl:flex-none px-3 sm:px-4 py-2 sm:py-2 font-medium transition-all rounded-lg flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] sm:min-h-0 touch-manipulation ${activeTab === "fresh_mints" && !searchQuery ? "bg-[#ff6b35] text-white shadow-xs" : `${theme.textSub} hover:text-[#ff6b35]`}`,
									title: "Fresh token mints sorted by real creation time",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "w-3.5 h-3.5 text-emerald-400 animate-pulse flex-shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Mints" })]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							ref: searchTriggerBtnRef,
							id: "btn_toggle_search",
							onClick: () => {
								if (isSearchPanelCollapsed) {
									setIsSearchOpen(true);
									setIsSearchPanelCollapsed(false);
									requestAnimationFrame(() => {
										searchInputRef.current?.focus();
									});
								} else if (isSearchOpen) handleCloseSearch();
								else handleOpenSearch();
							},
							className: `hidden xl:flex p-2 sm:px-3 sm:py-2 border transition-all cursor-pointer text-xs font-medium rounded-xl items-center justify-center gap-1.5 ${isSearchOpen || searchQuery.trim() ? "bg-[#ff6b35]/15 border-[#ff6b35] text-[#ff6b35]" : `${theme.btnSecondary} hover:border-[#ff6b35]/50 hover:text-[#ff6b35]`}`,
							title: "Search tokens (Press 'S')",
							"aria-label": "Search tokens (Press 'S')",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "w-4 h-4" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden sm:inline",
									children: "Search"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
									className: `hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono rounded border uppercase ${isDarkMode ? "bg-zinc-800/90 border-zinc-700 text-zinc-300" : "bg-slate-200/80 border-slate-300 text-slate-600"}`,
									children: "S"
								}),
								searchQuery.trim() && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2 h-2 rounded-full bg-[#ff6b35] animate-pulse" })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							id: "btn_export_data_desktop",
							type: "button",
							onClick: handleExportToCSV,
							disabled: filteredAndSortedPairs.length === 0,
							className: `hidden xl:flex items-center gap-1.5 px-3 h-10 rounded-xl border text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode ? "bg-[#181824] border-zinc-800 text-emerald-400 hover:bg-[#202030] hover:border-emerald-500/40" : "bg-white border-slate-200 text-emerald-700 hover:bg-slate-50 hover:border-emerald-300 shadow-2xs"}`,
							title: `Export ${filteredAndSortedPairs.length} discovered tokens to CSV`,
							"aria-label": "Export token data",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "w-3.5 h-3.5 text-emerald-500" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden lg:inline",
									children: "Export"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-[11px] opacity-75 font-mono",
									children: [
										"(",
										filteredAndSortedPairs.length,
										")"
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							id: "btn_toggle_theme_desktop",
							type: "button",
							onClick: toggleTheme,
							className: `hidden xl:flex items-center justify-center transition-all border outline-none cursor-pointer rounded-xl relative ${isDarkMode ? "bg-[#1f202e] border-zinc-800 text-yellow-400 hover:text-yellow-300" : "bg-white border-slate-200 text-indigo-600 hover:text-indigo-700 hover:border-slate-300"} w-10 h-10 flex-shrink-0`,
							title: `Toggle Theme Mode (Current: ${themeMode === "system" ? `System ${isDarkMode ? "Dark" : "Light"}` : isDarkMode ? "Dark" : "Light"})`,
							"aria-label": `Toggle Theme Mode (Current: ${themeMode === "system" ? `System ${isDarkMode ? "Dark" : "Light"}` : isDarkMode ? "Dark" : "Light"})`,
							children: [isDarkMode ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "w-4 h-4 transition-transform hover:rotate-12 duration-300" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "w-4 h-4 transition-transform hover:-rotate-12 duration-300" }), themeMode === "system" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#111218] dark:ring-[#111218]",
								title: "Synced with system OS"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							ref: settingsTriggerDesktopRef,
							id: "btn_open_settings_desktop",
							type: "button",
							onClick: () => setShowSettingsModal(true),
							className: `hidden xl:flex items-center justify-center transition-all border outline-none cursor-pointer rounded-xl ${isDarkMode ? "bg-[#1f202e] border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700" : "bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300"} w-10 h-10 flex-shrink-0`,
							title: "Open Settings & Theme Preferences",
							"aria-label": "Open Settings and Preferences",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "w-4 h-4" })
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 md:p-6 space-y-3 sm:space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
						mode: "wait",
						children: (isSearchOpen || searchQuery.trim()) && (isSearchPanelCollapsed && hasSearched && searchQuery.trim() ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
							initial: {
								opacity: 0,
								y: -4
							},
							animate: {
								opacity: 1,
								y: 0
							},
							exit: {
								opacity: 0,
								y: -4
							},
							transition: { duration: .15 },
							id: "search_panel_collapsed",
							onClick: () => {
								setIsSearchPanelCollapsed(false);
								requestAnimationFrame(() => {
									searchInputRef.current?.focus();
								});
							},
							className: `px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border flex items-center justify-between gap-2.5 shadow-xs transition-all duration-200 cursor-pointer group hover:border-[#ff6b35]/60 ${isDarkMode ? "bg-[#151622] border-zinc-800 hover:bg-[#181926]" : "bg-white border-slate-200/90 hover:bg-slate-50"}`,
							title: "Click to expand search or modify query",
							role: "region",
							"aria-label": "Active search query panel",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "p-1 rounded-md bg-[#ff6b35]/15 text-[#ff6b35] flex-shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "w-3.5 h-3.5" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5 min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `text-[11px] font-medium flex-shrink-0 ${theme.textMuted}`,
											children: "Query:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											title: searchQuery,
											className: `text-xs sm:text-sm font-semibold font-mono truncate px-2 py-0.5 rounded-md border ${isDarkMode ? "bg-zinc-900 border-zinc-700 text-zinc-100" : "bg-slate-100 border-slate-300 text-slate-900"}`,
											children: abbreviateSearchQuery(searchQuery)
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "hidden md:inline-flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500 group-hover:text-[#ff6b35] transition-colors",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { className: "w-3 h-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Click to edit" })]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1.5 flex-shrink-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									id: "btn_edit_search_query",
									type: "button",
									onClick: (e) => {
										e.stopPropagation();
										setIsSearchPanelCollapsed(false);
										requestAnimationFrame(() => {
											searchInputRef.current?.focus();
										});
									},
									className: `px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 transition cursor-pointer ${theme.btnSecondary} hover:text-[#ff6b35] hover:border-[#ff6b35]/50`,
									title: "Edit search query",
									"aria-label": "Edit search query",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { className: "w-3 h-3 text-[#ff6b35]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] font-medium",
										children: "Edit"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									id: "btn_clear_search_collapsed",
									type: "button",
									onClick: (e) => {
										e.stopPropagation();
										handleClearSearch();
									},
									className: `p-1 sm:px-2 sm:py-1 rounded-lg border text-xs font-medium flex items-center gap-1 transition cursor-pointer ${theme.btnSecondary} hover:text-red-400 hover:border-red-500/40`,
									title: "Clear search and restore feed",
									"aria-label": "Clear search and restore feed",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hidden sm:inline text-[11px]",
										children: "Clear"
									})]
								})]
							})]
						}, "search-panel-collapsed") : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
							initial: {
								opacity: 0,
								y: -6
							},
							animate: {
								opacity: 1,
								y: 0
							},
							exit: {
								opacity: 0,
								y: -6
							},
							transition: { duration: .18 },
							className: `p-4 sm:p-5 rounded-2xl border relative shadow-md ${isDarkMode ? "bg-[#151622] border-zinc-800" : "bg-white border-slate-200/90"}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-xs font-semibold text-[#ff6b35] tracking-wide",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "w-4 h-4" }), " Token & Contract Address Search"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											id: "btn_close_search_panel",
											type: "button",
											onClick: () => {
												handleClearSearch();
												handleCloseSearch();
											},
											className: `p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${theme.btnSecondary} hover:text-[#ff6b35]`,
											title: "Close Search (Esc)",
											"aria-label": "Close Search (Esc)",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-3.5 h-3.5" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "hidden sm:inline",
													children: "Close"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
													className: `hidden sm:inline-flex items-center px-1 text-[9px] font-mono rounded border uppercase ${isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-slate-200 border-slate-300 text-slate-600"}`,
													children: "Esc"
												})
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
										onSubmit: handleSearchSubmit,
										className: "flex flex-col sm:flex-row gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												ref: searchInputRef,
												id: "input_search_query",
												type: "text",
												value: searchQuery,
												onChange: (e) => {
													const val = e.target.value;
													setSearchQuery(val);
													if (val.trim()) closeOpenToken();
													else setHasSearched(false);
												},
												placeholder: "Search by token name, symbol, or contract address...",
												className: `w-full text-xs sm:text-sm rounded-xl pl-3.5 pr-10 py-2.5 outline-none transition border focus:border-[#ff6b35] ${theme.inputStyle}`,
												autoFocus: true
											}), searchQuery ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												id: "btn_clear_search_input",
												type: "button",
												onClick: handleClearSearch,
												className: "absolute right-3 top-3 text-gray-400 hover:text-[#ff6b35] transition cursor-pointer",
												title: "Clear search input",
												"aria-label": "Clear search input",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-4 h-4" })
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												id: "btn_search_submit",
												type: "submit",
												className: "absolute right-3 top-3 transition text-gray-400 hover:text-[#ff6b35]",
												title: "Submit search",
												"aria-label": "Submit search",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "w-4 h-4" })
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											id: "btn_execute_search",
											type: "submit",
											className: "px-4 py-2.5 bg-[#ff6b35] text-white font-medium text-xs rounded-xl hover:bg-[#ff6b35]/90 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "w-3.5 h-3.5" }), " Search"]
										})]
									}),
									!searchQuery.trim() && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center gap-1.5 text-xs pt-0.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `${theme.textMuted} text-[11px] font-medium`,
											children: "Quick Tags:"
										}), quickSearchTags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											id: `quick_tag_${tag}`,
											type: "button",
											onClick: () => handleQuickTagClick(tag),
											className: `px-2.5 py-1 rounded-lg font-mono text-[11px] border transition-all duration-200 cursor-pointer ${searchQuery.toLowerCase() === tag ? "bg-[#ff6b35] border-[#ff6b35] text-white font-semibold" : theme.btnSecondary}`,
											children: ["#", tag]
										}, tag))]
									})
								]
							})
						}, "search-panel-expanded"))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `p-2 sm:p-2.5 rounded-2xl relative overflow-visible flex items-center justify-between gap-1.5 sm:gap-2 transition-all duration-200 ${theme.bgCard} shadow-2xs`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									ref: filterTriggerBtnRef,
									id: "btn_open_filters_modal",
									type: "button",
									"aria-haspopup": "dialog",
									"aria-expanded": showFiltersMobile,
									"aria-controls": "filter_drawer_modal",
									"aria-label": `Open filter parameters and presets drawer (Press 'F')${hasActiveFilters ? ", active filters applied" : ""}`,
									onClick: handleOpenFilterDrawer,
									className: `px-2.5 sm:px-3 py-2 sm:py-2 min-h-[38px] sm:min-h-0 rounded-xl border transition cursor-pointer relative flex items-center justify-center text-xs font-medium focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b0c10] focus-visible:outline-none flex-shrink-0 relative before:absolute before:-inset-1.5 sm:before:hidden touch-manipulation ${hasActiveFilters ? "bg-[#ff6b35]/15 border-[#ff6b35] text-[#ff6b35]" : theme.btnSecondary}`,
									title: "Filter Parameters & Presets (Press 'F')",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Funnel, { className: "w-3.5 h-3.5 text-[#ff6b35] flex-shrink-0" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "ml-1 sm:ml-1.5",
											children: "Filters"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
											className: `hidden sm:inline-flex items-center justify-center ml-1.5 px-1.5 py-0.5 text-[10px] font-mono rounded border uppercase ${isDarkMode ? "bg-zinc-800/90 border-zinc-700 text-zinc-300" : "bg-slate-200/80 border-slate-300 text-slate-600"}`,
											children: "F"
										}),
										hasActiveFilters && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "w-2 h-2 ml-1 sm:ml-1.5 rounded-full bg-[#ff6b35] animate-pulse",
											"aria-hidden": "true"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									id: "btn_open_sort_modal",
									type: "button",
									onClick: () => setShowSortModal(true),
									className: `px-2 sm:px-2.5 py-2 sm:py-2 min-h-[38px] sm:min-h-0 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-1 sm:gap-1.5 text-xs font-medium min-w-0 flex-shrink truncate relative before:absolute before:-inset-1.5 sm:before:hidden touch-manipulation ${sortBy !== "none" ? isDarkMode ? "bg-zinc-800/80 hover:bg-zinc-700/90 border-zinc-700/80 text-zinc-200" : "bg-slate-100/90 hover:bg-slate-200/90 border-slate-200 text-slate-800" : theme.btnSecondary}`,
									title: "Sort & Rank Options",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpDown, { className: "w-3.5 h-3.5 text-[#ff6b35] flex-shrink-0" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold truncate max-w-[72px] xs:max-w-[96px] sm:max-w-[130px]",
											children: sortBy === "none" ? activeTab === "trending" ? "Trending" : "Newest" : SORT_OPTIONS.find((o) => o.id === sortBy)?.shortLabel || "Sort"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "w-3 h-3 opacity-60 flex-shrink-0" })
									]
								}),
								searchQuery.trim() && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#ff6b35]/15 border border-[#ff6b35]/30 text-[#ff6b35] text-[11px] font-mono truncate max-w-[150px] flex-shrink",
									children: [
										"\"",
										abbreviateSearchQuery(searchQuery),
										"\""
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5 sm:gap-2 flex-shrink-0 z-10",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `p-0.5 sm:p-1 border text-xs flex items-center gap-0.5 rounded-xl transition-colors duration-200 ${theme.bgTabs}`,
								role: "group",
								"aria-label": "Dashboard layout view mode",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									id: "btn_view_cards",
									type: "button",
									onClick: () => updateViewMode("cards"),
									className: `px-2 sm:px-2.5 py-1.5 min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 font-medium transition-all rounded-lg flex items-center justify-center gap-1 cursor-pointer text-xs relative before:absolute before:-inset-1.5 sm:before:hidden touch-manipulation ${viewMode === "cards" ? "bg-[#ff6b35] text-white shadow-xs font-semibold" : `${theme.textSub} hover:text-[#ff6b35]`}`,
									title: "Card Grid View (Press 'V')",
									"aria-label": "Card Grid View (Press 'V')",
									"aria-pressed": viewMode === "cards",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayoutGrid, { className: "w-3.5 h-3.5 flex-shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hidden sm:inline text-xs",
										children: "Cards"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									id: "btn_view_compact",
									type: "button",
									onClick: () => updateViewMode("compact"),
									className: `px-2 sm:px-2.5 py-1.5 min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 font-medium transition-all rounded-lg flex items-center justify-center gap-1 cursor-pointer text-xs relative before:absolute before:-inset-1.5 sm:before:hidden touch-manipulation ${viewMode === "compact" ? "bg-[#ff6b35] text-white shadow-xs font-semibold" : `${theme.textSub} hover:text-[#ff6b35]`}`,
									title: "Compact View (Press 'V')",
									"aria-label": "Compact View (Press 'V')",
									"aria-pressed": viewMode === "compact",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, { className: "w-3.5 h-3.5 flex-shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hidden sm:inline text-xs",
										children: "Compact"
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								id: "btn_refresh_raw",
								onClick: handleManualRefresh,
								className: `h-9 min-w-[38px] px-2.5 sm:px-2.5 rounded-xl transition border cursor-pointer flex items-center justify-center gap-1.5 relative before:absolute before:-inset-1.5 sm:before:hidden touch-manipulation ${theme.btnSecondary}`,
								title: "Force refresh live market data",
								"aria-label": "Force refresh live market data",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: `w-3.5 h-3.5 ${loading ? "animate-spin text-[#ff6b35]" : ""}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "hidden md:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-500 font-semibold uppercase tracking-wider",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" }), "Live"]
								})]
							})]
						})]
					}),
					showFiltersMobile && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "fixed inset-0 z-50 flex justify-end",
						onMouseDown: handleCloseFilterDrawer,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full w-full max-w-md border-l border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-zinc-800 dark:bg-[#151620] dark:text-zinc-100",
							onMouseDown: (e) => e.stopPropagation(),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterPanel, {
								initialFilters: panelInitialFilters(),
								matchCount: countPanelMatches,
								onApply: applyPanelFilters,
								onReset: resetFilters,
								onClose: handleCloseFilterDrawer
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: showSortModal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						initial: { opacity: 0 },
						animate: { opacity: 1 },
						exit: { opacity: 0 },
						transition: { duration: .18 },
						className: "fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4",
						onClick: () => {
							setShowSortModal(false);
							setHoveredSortTooltip(null);
						},
						role: "dialog",
						"aria-modal": "true",
						"aria-labelledby": "sort_modal_title",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
							initial: {
								opacity: 0,
								y: 32,
								scale: .98
							},
							animate: {
								opacity: 1,
								y: 0,
								scale: 1
							},
							exit: {
								opacity: 0,
								y: 32,
								scale: .98
							},
							transition: {
								type: "spring",
								damping: 28,
								stiffness: 320
							},
							className: `w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] transition-colors duration-200 ${isDarkMode ? "bg-[#12131b] border-zinc-800 text-zinc-100" : "bg-white border-slate-200 text-slate-900"}`,
							onClick: (e) => e.stopPropagation(),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "pt-2.5 pb-1 flex justify-center sm:hidden",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-10 h-1 rounded-full bg-zinc-400/40 dark:bg-zinc-700/60" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `px-5 py-4 flex items-center justify-between border-b ${isDarkMode ? "border-zinc-800/80" : "border-slate-100"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-0.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpDown, { className: "w-4 h-4 text-[#ff6b35]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												id: "sort_modal_title",
												className: "font-display font-bold text-sm tracking-tight",
												children: "Sort & Rank"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: `text-xs ${theme.textMuted}`,
											children: "Choose how tokens are ordered"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										id: "btn_close_sort_modal",
										type: "button",
										onClick: () => {
											setShowSortModal(false);
											setHoveredSortTooltip(null);
										},
										className: `p-1.5 rounded-xl border transition cursor-pointer hover:text-[#ff6b35] flex items-center gap-1.5 ${theme.btnSecondary}`,
										title: "Close sort options (Esc)",
										"aria-label": "Close sort options (Esc)",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
											className: `hidden sm:inline-flex items-center px-1 text-[9px] font-mono rounded border uppercase ${isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-slate-200 border-slate-300 text-slate-600"}`,
											children: "Esc"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-4 h-4" })]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-4 sm:p-5 overflow-y-auto space-y-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] uppercase font-mono tracking-widest font-semibold text-zinc-400 dark:text-zinc-500",
										children: "SORT BY"
									}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "space-y-2",
										children: SORT_OPTIONS.map((opt, index) => {
											const isSelected = opt.id === "trending" ? sortBy === "trending" || sortBy === "none" && activeTab === "trending" : sortBy === opt.id;
											const isTooltipActive = hoveredSortTooltip === opt.id;
											const IconComp = opt.icon;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													id: `btn_sort_opt_${opt.id}`,
													type: "button",
													onClick: () => {
														setSortBy(opt.id);
													},
													className: `w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all duration-150 cursor-pointer group active:scale-[0.985] ${isSelected ? isDarkMode ? "bg-[#ff6b35]/12 border-[#ff6b35]/80 text-zinc-100 ring-1 ring-[#ff6b35]/30 shadow-xs" : "bg-[#ff6b35]/10 border-[#ff6b35]/80 text-slate-900 ring-1 ring-[#ff6b35]/25 shadow-xs" : isDarkMode ? "bg-[#181926]/70 hover:bg-[#1f2030] border-zinc-800/80 text-zinc-300 hover:text-zinc-100" : "bg-slate-50/90 hover:bg-slate-100 border-slate-200/90 text-slate-700 hover:text-slate-900"}`,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-3 min-w-0",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: `w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-[#ff6b35] text-white shadow-xs" : isDarkMode ? "bg-zinc-800/80 text-zinc-400 group-hover:text-zinc-200" : "bg-slate-200/80 text-slate-500 group-hover:text-slate-800"}`,
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconComp, { className: "w-4 h-4" })
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "min-w-0",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center gap-1.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "text-xs font-bold font-display tracking-tight truncate block",
																	children: opt.label
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	id: `btn_sort_help_${opt.id}`,
																	role: "button",
																	tabIndex: 0,
																	"aria-label": `How ${opt.label} sorting impacts list order`,
																	onMouseEnter: () => setHoveredSortTooltip(opt.id),
																	onMouseLeave: () => setHoveredSortTooltip(null),
																	onFocus: () => setHoveredSortTooltip(opt.id),
																	onBlur: () => setHoveredSortTooltip(null),
																	onClick: (e) => {
																		e.stopPropagation();
																		setHoveredSortTooltip((prev) => prev === opt.id ? null : opt.id);
																	},
																	className: `inline-flex items-center justify-center p-0.5 rounded-full transition-colors cursor-help ${isTooltipActive ? "text-[#ff6b35] bg-[#ff6b35]/15" : isDarkMode ? "text-zinc-400 hover:text-[#ff6b35] hover:bg-zinc-800" : "text-slate-400 hover:text-[#ff6b35] hover:bg-slate-200/70"}`,
																	title: `How ${opt.label} sorting impacts list order`,
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleHelp, { className: "w-3.5 h-3.5" })
																})]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: `text-[11px] truncate mt-0.5 ${isSelected ? isDarkMode ? "text-zinc-300" : "text-slate-600" : isDarkMode ? "text-zinc-500" : "text-slate-400"}`,
																children: opt.description
															})]
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "flex-shrink-0 ml-2",
														children: isSelected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "w-5 h-5 rounded-full bg-[#ff6b35] text-white flex items-center justify-center shadow-xs",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-3 h-3 stroke-[3]" })
														}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-700/80 group-hover:border-zinc-400 dark:group-hover:border-zinc-600 transition-colors" })
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: isTooltipActive && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
													initial: {
														opacity: 0,
														y: index < 3 ? -4 : 4,
														scale: .96
													},
													animate: {
														opacity: 1,
														y: 0,
														scale: 1
													},
													exit: {
														opacity: 0,
														y: index < 3 ? -4 : 4,
														scale: .96
													},
													transition: { duration: .15 },
													className: `absolute z-30 pointer-events-none p-3 rounded-xl shadow-xl text-left border text-[11px] leading-relaxed ${index < 3 ? "top-full mt-1.5" : "bottom-full mb-1.5"} left-2 right-2 sm:left-12 sm:right-4 ${isDarkMode ? "bg-[#181926] border-zinc-700/90 text-zinc-200 shadow-black/80" : "bg-white border-slate-300 text-slate-800 shadow-slate-300/80"}`,
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-1.5 mb-1 text-[10px] font-semibold uppercase font-mono text-[#ff6b35]",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleHelp, { className: "w-3 h-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Metric Impact • ", opt.label] })]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: isDarkMode ? "text-zinc-300" : "text-slate-600",
															children: opt.explanation
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `absolute w-2 h-2 rotate-45 border ${index < 3 ? "-top-1 border-t border-l border-b-0 border-r-0" : "-bottom-1 border-b border-r border-t-0 border-l-0"} left-8 ${isDarkMode ? "bg-[#181926] border-zinc-700/90" : "bg-white border-slate-300"}` })
													]
												}) })]
											}, opt.id);
										})
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `p-4 border-t flex items-center gap-2.5 ${isDarkMode ? "border-zinc-800/80 bg-[#151622]/50" : "border-slate-100 bg-zinc-50/50"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										id: "btn_reset_sort",
										type: "button",
										onClick: () => {
											setSortBy(activeTab === "trending" ? "trending" : "newest");
											setHoveredSortTooltip(null);
										},
										className: `flex-1 text-center text-xs font-medium py-2.5 border transition rounded-xl cursor-pointer ${theme.btnSecondary}`,
										children: "Reset"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										id: "btn_apply_sort",
										type: "button",
										onClick: () => {
											setShowSortModal(false);
											setHoveredSortTooltip(null);
										},
										className: "flex-1 text-center text-xs font-semibold py-2.5 bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white transition rounded-xl cursor-pointer shadow-xs active:scale-95",
										children: "Apply"
									})]
								})
							]
						})
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: showSettingsModal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						initial: { opacity: 0 },
						animate: { opacity: 1 },
						exit: { opacity: 0 },
						className: "fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4",
						onClick: handleCloseSettingsModal,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
							ref: settingsModalRef,
							id: "settings_modal_dialog",
							role: "dialog",
							"aria-modal": "true",
							"aria-labelledby": "settings_modal_title",
							"aria-describedby": "settings_modal_desc",
							initial: {
								opacity: 0,
								scale: .96,
								y: 8
							},
							animate: {
								opacity: 1,
								scale: 1,
								y: 0
							},
							exit: {
								opacity: 0,
								scale: .96,
								y: 8
							},
							transition: {
								duration: .16,
								ease: "easeOut"
							},
							className: `w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isDarkMode ? "bg-[#11121a] border-zinc-800 text-zinc-100" : "bg-white border-slate-200 text-slate-900"}`,
							onClick: (e) => e.stopPropagation(),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `p-4 sm:p-5 border-b flex items-center justify-between ${isDarkMode ? "border-zinc-800/80 bg-[#151622]/60" : "border-slate-100 bg-zinc-50/60"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-9 h-9 rounded-xl bg-[#ff6b35]/15 text-[#ff6b35] flex items-center justify-center",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, {
												className: "w-5 h-5",
												"aria-hidden": "true"
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											id: "settings_modal_title",
											className: "font-display font-bold text-sm sm:text-base tracking-tight",
											children: "Settings & Preferences"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											id: "settings_modal_desc",
											className: `text-xs ${theme.textMuted}`,
											children: "Theme appearance & system synchronization"
										})] })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										ref: settingsCloseBtnRef,
										id: "btn_close_settings_modal",
										type: "button",
										"aria-label": "Close settings modal (Esc)",
										onClick: handleCloseSettingsModal,
										className: `p-1.5 rounded-xl border transition cursor-pointer hover:text-[#ff6b35] flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#11121a] focus-visible:outline-none ${theme.btnSecondary}`,
										title: "Close settings (Esc)",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
											className: `hidden sm:inline-flex items-center px-1 text-[9px] font-mono rounded border uppercase ${isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-slate-200 border-slate-300 text-slate-600"}`,
											children: "Esc"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
											className: "w-4 h-4",
											"aria-hidden": "true"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-4 sm:p-5 overflow-y-auto space-y-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											role: "radiogroup",
											"aria-labelledby": "label_theme_heading",
											className: "space-y-2.5",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														id: "label_theme_heading",
														className: "text-[11px] uppercase font-mono tracking-wider font-semibold text-zinc-400 dark:text-zinc-500",
														children: "Color Theme"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400",
														children: themeMode === "system" ? "Auto Sync" : "Manual"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													id: "btn_theme_sync_system",
													type: "button",
													role: "radio",
													"aria-checked": themeMode === "system",
													"aria-label": `Sync with System theme mode. Currently active, matching OS ${systemPrefersDark ? "Dark" : "Light"} mode.`,
													onClick: () => updateThemeMode("system"),
													className: `w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all duration-150 cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#11121a] focus-visible:outline-none ${themeMode === "system" ? isDarkMode ? "bg-[#ff6b35]/12 border-[#ff6b35]/80 text-zinc-100 ring-1 ring-[#ff6b35]/30 shadow-xs" : "bg-[#ff6b35]/10 border-[#ff6b35]/80 text-slate-900 ring-1 ring-[#ff6b35]/25 shadow-xs" : isDarkMode ? "bg-[#181926]/70 hover:bg-[#1f2030] border-zinc-800/80 text-zinc-300 hover:text-zinc-100" : "bg-slate-50/90 hover:bg-slate-100 border-slate-200/90 text-slate-700 hover:text-slate-900"}`,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-3 min-w-0",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: `w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${themeMode === "system" ? "bg-[#ff6b35] text-white shadow-xs" : isDarkMode ? "bg-zinc-800/80 text-zinc-400 group-hover:text-zinc-200" : "bg-slate-200/80 text-slate-500 group-hover:text-slate-800"}`,
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, {
																className: "w-4 h-4",
																"aria-hidden": "true"
															})
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "min-w-0",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center gap-2",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "text-xs font-bold font-display tracking-tight",
																	children: "Sync with System"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold",
																	children: "OS Auto"
																})]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: `text-[11px] truncate mt-0.5 ${themeMode === "system" ? isDarkMode ? "text-zinc-300" : "text-slate-600" : isDarkMode ? "text-zinc-500" : "text-slate-400"}`,
																children: [
																	"Matches your operating system (Detected: ",
																	systemPrefersDark ? "Dark" : "Light",
																	")"
																]
															})]
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "flex-shrink-0 ml-2",
														children: themeMode === "system" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "w-5 h-5 rounded-full bg-[#ff6b35] text-white flex items-center justify-center shadow-xs",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-3 h-3 stroke-[3]" })
														}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-700/80 group-hover:border-zinc-400 dark:group-hover:border-zinc-600 transition-colors" })
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													id: "btn_theme_dark",
													type: "button",
													role: "radio",
													"aria-checked": themeMode === "dark",
													"aria-label": "Dark Mode theme",
													onClick: () => updateThemeMode("dark"),
													className: `w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all duration-150 cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#11121a] focus-visible:outline-none ${themeMode === "dark" ? isDarkMode ? "bg-[#ff6b35]/12 border-[#ff6b35]/80 text-zinc-100 ring-1 ring-[#ff6b35]/30 shadow-xs" : "bg-[#ff6b35]/10 border-[#ff6b35]/80 text-slate-900 ring-1 ring-[#ff6b35]/25 shadow-xs" : isDarkMode ? "bg-[#181926]/70 hover:bg-[#1f2030] border-zinc-800/80 text-zinc-300 hover:text-zinc-100" : "bg-slate-50/90 hover:bg-slate-100 border-slate-200/90 text-slate-700 hover:text-slate-900"}`,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-3 min-w-0",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: `w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${themeMode === "dark" ? "bg-[#ff6b35] text-white shadow-xs" : isDarkMode ? "bg-zinc-800/80 text-zinc-400 group-hover:text-zinc-200" : "bg-slate-200/80 text-slate-500 group-hover:text-slate-800"}`,
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, {
																className: "w-4 h-4",
																"aria-hidden": "true"
															})
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "min-w-0",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-xs font-bold font-display tracking-tight",
																children: "Dark Mode"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: `text-[11px] truncate mt-0.5 ${themeMode === "dark" ? isDarkMode ? "text-zinc-300" : "text-slate-600" : isDarkMode ? "text-zinc-500" : "text-slate-400"}`,
																children: "Deep contrast dark theme optimized for low-light environments"
															})]
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "flex-shrink-0 ml-2",
														children: themeMode === "dark" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "w-5 h-5 rounded-full bg-[#ff6b35] text-white flex items-center justify-center shadow-xs",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-3 h-3 stroke-[3]" })
														}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-700/80 group-hover:border-zinc-400 dark:group-hover:border-zinc-600 transition-colors" })
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													id: "btn_theme_light",
													type: "button",
													role: "radio",
													"aria-checked": themeMode === "light",
													"aria-label": "Light Mode theme",
													onClick: () => updateThemeMode("light"),
													className: `w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all duration-150 cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#11121a] focus-visible:outline-none ${themeMode === "light" ? isDarkMode ? "bg-[#ff6b35]/12 border-[#ff6b35]/80 text-zinc-100 ring-1 ring-[#ff6b35]/30 shadow-xs" : "bg-[#ff6b35]/10 border-[#ff6b35]/80 text-slate-900 ring-1 ring-[#ff6b35]/25 shadow-xs" : isDarkMode ? "bg-[#181926]/70 hover:bg-[#1f2030] border-zinc-800/80 text-zinc-300 hover:text-zinc-100" : "bg-slate-50/90 hover:bg-slate-100 border-slate-200/90 text-slate-700 hover:text-slate-900"}`,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-3 min-w-0",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: `w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${themeMode === "light" ? "bg-[#ff6b35] text-white shadow-xs" : isDarkMode ? "bg-zinc-800/80 text-zinc-400 group-hover:text-zinc-200" : "bg-slate-200/80 text-slate-500 group-hover:text-slate-800"}`,
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, {
																className: "w-4 h-4",
																"aria-hidden": "true"
															})
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "min-w-0",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-xs font-bold font-display tracking-tight",
																children: "Light Mode"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: `text-[11px] truncate mt-0.5 ${themeMode === "light" ? isDarkMode ? "text-zinc-300" : "text-slate-600" : isDarkMode ? "text-zinc-500" : "text-slate-400"}`,
																children: "Clean, high-visibility bright theme with sharp typography"
															})]
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "flex-shrink-0 ml-2",
														children: themeMode === "light" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "w-5 h-5 rounded-full bg-[#ff6b35] text-white flex items-center justify-center shadow-xs",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-3 h-3 stroke-[3]" })
														}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-700/80 group-hover:border-zinc-400 dark:group-hover:border-zinc-600 transition-colors" })
													})]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: `p-3 rounded-xl border text-xs flex items-center justify-between ${isDarkMode ? "bg-zinc-900/60 border-zinc-800 text-zinc-400" : "bg-slate-100/70 border-slate-200 text-slate-600"}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `w-2 h-2 rounded-full ${systemPrefersDark ? "bg-indigo-400" : "bg-amber-400"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["System OS reports: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
													className: "font-semibold text-zinc-200 dark:text-zinc-200",
													children: systemPrefersDark ? "Dark Theme" : "Light Theme"
												})] })]
											}), themeMode !== "system" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => updateThemeMode("system"),
												className: "text-[11px] text-[#ff6b35] hover:underline font-semibold flex items-center gap-1 cursor-pointer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "w-3 h-3" }), "Sync"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											role: "radiogroup",
											"aria-labelledby": "label_layout_heading",
											className: "space-y-2.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													id: "label_layout_heading",
													className: "text-[11px] uppercase font-mono tracking-wider font-semibold text-zinc-400 dark:text-zinc-500",
													children: "Dashboard Layout"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 capitalize",
													children: [viewMode, " Mode"]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-2 gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													id: "btn_settings_view_cards",
													type: "button",
													role: "radio",
													"aria-checked": viewMode === "cards",
													onClick: () => updateViewMode("cards"),
													className: `p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all duration-150 cursor-pointer ${viewMode === "cards" ? isDarkMode ? "bg-[#ff6b35]/12 border-[#ff6b35]/80 text-zinc-100 ring-1 ring-[#ff6b35]/30 shadow-xs" : "bg-[#ff6b35]/10 border-[#ff6b35]/80 text-slate-900 ring-1 ring-[#ff6b35]/25 shadow-xs" : isDarkMode ? "bg-[#181926]/70 hover:bg-[#1f2030] border-zinc-800/80 text-zinc-300 hover:text-zinc-100" : "bg-slate-50/90 hover:bg-slate-100 border-slate-200/90 text-slate-700 hover:text-slate-900"}`,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayoutGrid, { className: "w-4 h-4 text-[#ff6b35]" }), viewMode === "cards" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "w-4 h-4 rounded-full bg-[#ff6b35] text-white flex items-center justify-center",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-2.5 h-2.5 stroke-[3]" })
														}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-4 h-4 rounded-full border border-zinc-500/40" })]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-xs font-bold block",
														children: "Card Grid"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: `text-[10px] ${theme.textMuted}`,
														children: "Visual cards with sparklines"
													})] })]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													id: "btn_settings_view_compact",
													type: "button",
													role: "radio",
													"aria-checked": viewMode === "compact",
													onClick: () => updateViewMode("compact"),
													className: `p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all duration-150 cursor-pointer ${viewMode === "compact" ? isDarkMode ? "bg-[#ff6b35]/12 border-[#ff6b35]/80 text-zinc-100 ring-1 ring-[#ff6b35]/30 shadow-xs" : "bg-[#ff6b35]/10 border-[#ff6b35]/80 text-slate-900 ring-1 ring-[#ff6b35]/25 shadow-xs" : isDarkMode ? "bg-[#181926]/70 hover:bg-[#1f2030] border-zinc-800/80 text-zinc-300 hover:text-zinc-100" : "bg-slate-50/90 hover:bg-slate-100 border-slate-200/90 text-slate-700 hover:text-slate-900"}`,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, { className: "w-4 h-4 text-[#ff6b35]" }), viewMode === "compact" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "w-4 h-4 rounded-full bg-[#ff6b35] text-white flex items-center justify-center",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-2.5 h-2.5 stroke-[3]" })
														}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-4 h-4 rounded-full border border-zinc-500/40" })]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-xs font-bold block",
														children: "Compact Table"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: `text-[10px] ${theme.textMuted}`,
														children: "Data-dense crypto terminal"
													})] })]
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2 pt-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[11px] uppercase font-mono tracking-wider font-semibold text-zinc-400 dark:text-zinc-500",
													children: "Keyboard Shortcuts"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] font-mono text-zinc-400 dark:text-zinc-500",
													children: "Quick Navigation"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: `p-3 rounded-xl border divide-y ${isDarkMode ? "bg-[#181926]/70 border-zinc-800/80 divide-zinc-800/60" : "bg-slate-50/90 border-slate-200/90 divide-slate-200/60"}`,
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between py-1.5 first:pt-0",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-xs",
															children: "Open Search Bar"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
															className: `px-2 py-0.5 text-[11px] font-mono rounded border font-semibold ${isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-200" : "bg-white border-slate-300 text-slate-700 shadow-2xs"}`,
															children: "S"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between py-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-xs",
															children: "Open Filter Drawer"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
															className: `px-2 py-0.5 text-[11px] font-mono rounded border font-semibold ${isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-200" : "bg-white border-slate-300 text-slate-700 shadow-2xs"}`,
															children: "F"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between py-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-xs",
															children: "Toggle View (Cards / Compact)"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
															className: `px-2 py-0.5 text-[11px] font-mono rounded border font-semibold ${isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-200" : "bg-white border-slate-300 text-slate-700 shadow-2xs"}`,
															children: "V"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between py-1.5 last:pb-0",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-xs",
															children: "Close Active Modal or Menu"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
															className: `px-2 py-0.5 text-[11px] font-mono rounded border font-semibold ${isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-200" : "bg-white border-slate-300 text-slate-700 shadow-2xs"}`,
															children: "Esc"
														})]
													})
												]
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `p-4 border-t flex items-center justify-end gap-2.5 ${isDarkMode ? "border-zinc-800/80 bg-[#151622]/50" : "border-slate-100 bg-zinc-50/50"}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										id: "btn_done_settings_modal",
										type: "button",
										onClick: handleCloseSettingsModal,
										className: "w-full sm:w-auto px-6 text-center text-xs font-semibold py-2.5 bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white transition rounded-xl cursor-pointer shadow-xs active:scale-95 focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#11121a] focus-visible:outline-none",
										children: "Done"
									})
								})
							]
						})
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: showExportConfirm && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						initial: { opacity: 0 },
						animate: { opacity: 1 },
						exit: { opacity: 0 },
						className: "fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4",
						onClick: () => setShowExportConfirm(false),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
							id: "csv_export_confirm_dialog",
							role: "dialog",
							"aria-modal": "true",
							"aria-labelledby": "csv_export_confirm_title",
							"aria-describedby": "csv_export_confirm_desc",
							initial: {
								opacity: 0,
								scale: .96,
								y: 8
							},
							animate: {
								opacity: 1,
								scale: 1,
								y: 0
							},
							exit: {
								opacity: 0,
								scale: .96,
								y: 8
							},
							transition: {
								duration: .16,
								ease: "easeOut"
							},
							className: `w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${isDarkMode ? "bg-[#11121a] border-zinc-800 text-zinc-100" : "bg-white border-slate-200 text-slate-900"}`,
							onClick: (e) => e.stopPropagation(),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `p-4 sm:p-5 border-b flex items-center justify-between ${isDarkMode ? "border-zinc-800/80 bg-[#151622]/60" : "border-slate-100 bg-zinc-50/60"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
												className: "w-5 h-5",
												"aria-hidden": "true"
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											id: "csv_export_confirm_title",
											className: "font-display font-bold text-sm sm:text-base tracking-tight",
											children: "Confirm CSV Export"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											id: "csv_export_confirm_desc",
											className: `text-xs ${theme.textMuted}`,
											children: "Large dataset export verification"
										})] })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										id: "btn_close_csv_export_modal",
										type: "button",
										"aria-label": "Close export confirmation (Esc)",
										onClick: () => setShowExportConfirm(false),
										className: `p-1.5 rounded-xl border transition cursor-pointer hover:text-[#ff6b35] flex items-center gap-1.5 ${theme.btnSecondary}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
											className: `hidden sm:inline-flex items-center px-1 text-[9px] font-mono rounded border uppercase ${isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-slate-200 border-slate-300 text-slate-600"}`,
											children: "Esc"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
											className: "w-4 h-4",
											"aria-hidden": "true"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-4 sm:p-5 space-y-3.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `p-3.5 rounded-xl border text-xs leading-relaxed space-y-2 ${isDarkMode ? "bg-zinc-900/60 border-zinc-800/80 text-zinc-300" : "bg-slate-50 border-slate-200 text-slate-700"}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
											"You are about to export a dataset of",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
												className: "font-semibold text-emerald-500 dark:text-emerald-400",
												children: [filteredAndSortedPairs.length, " tokens"]
											}),
											" ",
											"from the ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-mono font-medium text-[#ff6b35]",
												children: activeTab.toUpperCase()
											}),
											" view."
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] opacity-80",
											children: "Generating full CSV records including on-chain addresses, liquidity depths, volume, and multi-source DEX mappings may cause a brief browser performance pause."
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between text-xs px-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: theme.textMuted,
											children: "Dataset size:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-mono font-semibold",
											children: [
												filteredAndSortedPairs.length,
												" rows (approx. ",
												Math.max(1, Math.round(filteredAndSortedPairs.length * .35)),
												" KB)"
											]
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `p-4 border-t flex flex-wrap items-center justify-end gap-2.5 ${isDarkMode ? "border-zinc-800/80 bg-[#151622]/50" : "border-slate-100 bg-zinc-50/50"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											id: "btn_cancel_csv_export",
											type: "button",
											onClick: () => setShowExportConfirm(false),
											className: `px-3 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${theme.btnSecondary}`,
											children: "Cancel"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											id: "btn_confirm_json_export",
											type: "button",
											onClick: triggerExportJSON,
											className: "px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition rounded-xl cursor-pointer shadow-xs inline-flex items-center gap-1.5 active:scale-95",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
												"JSON (",
												filteredAndSortedPairs.length,
												")"
											] })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											id: "btn_confirm_csv_export",
											type: "button",
											onClick: triggerExportCSV,
											className: "px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition rounded-xl cursor-pointer shadow-xs inline-flex items-center gap-1.5 active:scale-95",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
												"CSV (",
												filteredAndSortedPairs.length,
												")"
											] })]
										})
									]
								})
							]
						})
					}) }),
					!searchQuery.trim() && (indexTotal != null || indexPaging || indexPageError) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						id: "index_page_status",
						"data-total": indexTotal ?? "",
						"data-loaded": filteredAndSortedPairs.length,
						"data-more": indexCursor ? "1" : "0",
						className: `mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs ${theme.textSub}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								id: "index_window_count",
								children: indexTotal != null && indexTotal > filteredAndSortedPairs.length ? `${filteredAndSortedPairs.length.toLocaleString()} loaded of ${indexTotal.toLocaleString()} in this window` : indexTotal != null ? `${indexTotal.toLocaleString()} in this window` : "Loading this window"
							}),
							indexPaging && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1 text-[#ff6b35]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "w-3 h-3 animate-spin" }), "Loading"]
							}),
							indexPageError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								id: "index_page_error",
								className: "text-red-400",
								children: indexPageError
							}),
							indexCursor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								id: "btn_load_more_index",
								type: "button",
								onClick: loadMoreIndex,
								disabled: indexPaging,
								className: `min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${theme.btnSecondary}`,
								children: indexPaging ? "Loading…" : "Load more"
							}),
							indexPageError && !indexCursor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								id: "btn_retry_index",
								type: "button",
								onClick: () => setIndexRetry((n) => n + 1),
								className: `min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${theme.btnSecondary}`,
								children: "Retry"
							})
						]
					}),
					loading && filteredAndSortedPairs.length === 0 && !searchQuery.trim() ? viewMode === "compact" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompactTableView, {
						pairs: [],
						totalCount: 0,
						currentPage,
						pageSize: PAGE_SIZE,
						loading: true,
						sortBy,
						onSortChange: (id) => {
							setSortBy(id);
							setCurrentPage(1);
						},
						isDarkMode,
						theme,
						copiedAddress,
						onCopyAddress: copyToClipboard,
						expandedRowKeys: expandedCards,
						onToggleExpandRow: toggleCardExpanded,
						tokenHoldersData,
						onFetchHolders: fetchTokenHolders
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4",
						children: [
							1,
							2,
							3,
							4,
							5,
							6
						].map((idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `p-4 rounded-none space-y-4 animate-pulse border ${theme.bgCard}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between items-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `h-5 rounded w-1/3 ${isDarkMode ? "bg-gray-800" : "bg-slate-200"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `h-5 rounded w-12 ${isDarkMode ? "bg-gray-800" : "bg-slate-200"}` })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `h-7 rounded w-full ${isDarkMode ? "bg-gray-800" : "bg-slate-200"}` }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-3 gap-2 pt-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `h-8 rounded ${isDarkMode ? "bg-gray-800" : "bg-slate-200"}` }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `h-8 rounded ${isDarkMode ? "bg-gray-800" : "bg-slate-200"}` }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `h-8 rounded ${isDarkMode ? "bg-gray-800" : "bg-slate-200"}` })
									]
								})
							]
						}, idx))
					}) : filteredAndSortedPairs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `border border-dashed py-16 px-6 rounded-none text-center space-y-4 ${isDarkMode ? "border-gray-800 bg-[#0f111a]/20" : "border-slate-300 bg-slate-50/50"}`,
						children: (() => {
							const searching = searchQuery.trim().length > 0;
							const title = searching ? loading ? "Searching" : "No match" : hasActiveFilters ? "No coins match these filters" : error ? "Couldn't load tokens" : "No tokens";
							const subtitle = searching ? loading ? "" : "Nothing matched that search." : hasActiveFilters ? "Reset filters to see the list." : error ? error : "";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: `text-sm font-semibold ${theme.textTitle}`,
									children: title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									id: "search_empty_note",
									className: `text-xs max-w-md mx-auto ${theme.textSub}`,
									children: subtitle
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center justify-center gap-2",
									children: [
										!searching && !hasActiveFilters && !error && activeTab === "trending" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											id: "btn_empty_mints",
											type: "button",
											onClick: () => {
												setActiveTab("fresh_mints");
												setSortBy("newest");
											},
											className: "px-4 py-2 border rounded-none text-xs font-mono font-semibold transition cursor-pointer bg-[#ff6b35] text-white border-[#ff6b35]",
											children: "Show mints"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											id: "btn_empty_latest",
											type: "button",
											onClick: () => {
												setActiveTab("latest");
												setSortBy("newest");
											},
											className: `px-4 py-2 border rounded-none text-xs font-mono font-semibold transition cursor-pointer ${theme.btnSecondary}`,
											children: "Show latest"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											id: "btn_fallback_clear",
											onClick: searching ? handleClearSearch : hasActiveFilters || !error ? resetFilters : handleManualRefresh,
											className: `px-4 py-2 border rounded-none text-xs font-mono font-semibold transition cursor-pointer ${theme.btnSecondary}`,
											children: searching ? "Clear search" : hasActiveFilters || !error ? "Reset filters" : "Retry"
										}),
										searching && hasActiveFilters && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											id: "btn_empty_reset_filters",
											type: "button",
											onClick: resetFilters,
											className: `px-4 py-2 border rounded-none text-xs font-mono font-semibold transition cursor-pointer ${theme.btnSecondary}`,
											children: "Reset filters"
										})
									]
								})
							] });
						})()
					}) : viewMode === "compact" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompactTableView, {
						pairs: paginatedPairs,
						totalCount: filteredAndSortedPairs.length,
						currentPage,
						pageSize: PAGE_SIZE,
						loading,
						sortBy,
						onSortChange: (id) => {
							setSortBy(id);
							setCurrentPage(1);
						},
						isDarkMode,
						theme,
						copiedAddress,
						onCopyAddress: copyToClipboard,
						expandedRowKeys: expandedCards,
						onToggleExpandRow: toggleCardExpanded,
						tokenHoldersData,
						onFetchHolders: fetchTokenHolders
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
							mode: "popLayout",
							children: paginatedPairs.map((pair, index) => {
								const chainBadge = getChainBadgeStyle(pair.chainId);
								const volume24h = volumeForDisplay(pair);
								const priceChange24h = pair.priceChange?.h24 !== void 0 && pair.priceChange?.h24 !== null ? Number(pair.priceChange.h24) : void 0;
								const marketCapValue = marketCapOf(pair);
								const liquidityValue = pair.liquidity?.usd ?? pair.totalLiquidityUsd;
								const { tgUrl, twUrl, webUrl, discordUrl } = extractTokenSocials(pair);
								const hasActiveMarketPool = Boolean(pair.isGraduated || pair.marketStage === "graduated" || pair.marketStage === "pumpswap" || pair.marketStage === "raydium" || pair.primaryDex && [
									"pumpswap",
									"orca",
									"meteora",
									"raydium",
									"phoenix",
									"openbook",
									"lifinity"
								].includes(pair.primaryDex.toLowerCase()) || pair.pairs?.some((pr) => [
									"pumpswap",
									"orca",
									"meteora",
									"raydium"
								].some((d) => (pr.dexName || pr.dexId || "").toLowerCase().includes(d))));
								Boolean((pair.isBondingCurve || pair.marketStage === "bonding_curve" || pair.launchPlatform === "Pump.fun" || pair.dexId === "pumpfun" || pair.dexId === "pump" || Boolean(pair.bondingCurvePda) || Boolean(pair.realSolReservesFormatted) || typeof pair.bondingProgress === "number" && pair.bondingProgress < 100 || (pair.chainId || "").toLowerCase() === "solana" && (pair.baseToken?.address || "").toLowerCase().endsWith("pump") && !pair.isGraduated) && !hasActiveMarketPool);
								const tokenAddress = pair.baseToken?.address || "";
								const cardKey = `${pair.chainId || "chain"}:${tokenAddress || pair.pairAddress || index}`;
								const isExpanded = Boolean(expandedCards[cardKey]);
								const holderInfo = tokenHoldersData[holderCacheKey(pair.chainId, tokenAddress)];
								const rpcProvider = getRpcHolderProvider(pair.chainId, tokenAddress);
								const topHolders = holderInfo?.topHolders || [];
								const top10SupplyPercentage = holderInfo?.top10SupplyPercentage ?? null;
								const hasHighConcentration = typeof top10SupplyPercentage === "number" && top10SupplyPercentage > 50;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
									initial: {
										opacity: 0,
										y: 8
									},
									animate: {
										opacity: 1,
										y: isExpanded ? -4 : 0,
										rotateX: isExpanded ? [
											0,
											-6,
											0
										] : 0,
										rotateY: isExpanded ? [
											0,
											4,
											0
										] : 0,
										scale: isExpanded ? 1.015 : 1
									},
									whileHover: {
										y: isExpanded ? -5 : -3,
										rotateX: 2.5,
										rotateY: -1.5,
										transition: {
											duration: .22,
											ease: "easeOut"
										}
									},
									exit: {
										opacity: 0,
										scale: .95
									},
									transition: {
										duration: .38,
										ease: [
											.16,
											1,
											.3,
											1
										],
										delay: isExpanded ? 0 : Math.min(index * .03, .3)
									},
									style: {
										transformStyle: "preserve-3d",
										transformPerspective: 1e3
									},
									className: `p-2.5 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col justify-between transition-all duration-300 relative overflow-hidden group border shadow-2xs hover:shadow-md ${theme.bgCard} ${isExpanded ? isDarkMode ? "border-[#ff6b35]/60 shadow-lg shadow-[#ff6b35]/5 ring-1 ring-[#ff6b35]/25" : "border-[#ff6b35]/70 shadow-lg shadow-orange-500/10 ring-1 ring-[#ff6b35]/20" : isDarkMode ? "hover:border-[#ff6b35]/50" : "hover:border-[#ff6b35]/60 hover:shadow-slate-200/60"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-start justify-between gap-2 mb-1.5 sm:mb-2.5 relative z-10",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															onClick: (e) => {
																e.stopPropagation();
																handleSelectChain(normalizeChainName(pair.chainId));
															},
															className: "cursor-pointer hover:scale-110 active:scale-95 transition-transform relative before:absolute before:-inset-2 sm:before:hidden touch-manipulation",
															title: `Filter exclusively by ${pair.chainId?.toUpperCase()} network`,
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChainIcon, {
																chainId: pair.chainId,
																fallbackClass: chainBadge.bg
															})
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TokenImage, {
															imageUrl: pair.info?.imageUrl,
															symbol: displaySymbol(pair),
															address: pair.baseToken?.address,
															chainId: pair.chainId
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "min-w-0 flex-1",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center gap-1.5 flex-wrap",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
																		className: `text-base font-bold ${theme.textTitle} tracking-tight truncate`,
																		children: displaySymbol(pair)
																	}),
																	displayName(pair) !== displaySymbol(pair) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: `text-xs truncate ${theme.textMuted} hidden sm:inline font-normal`,
																		children: displayName(pair)
																	}),
																	pair.baseToken?.address && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
																		id: `btn_copy_${pair.baseToken.address}`,
																		onClick: (e) => {
																			e.stopPropagation();
																			copyToClipboard(pair.baseToken.address);
																		},
																		className: "inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-md border border-slate-200/80 dark:border-zinc-800/80 bg-slate-100/80 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-300 hover:text-[#ff6b35] hover:border-[#ff6b35]/40 transition cursor-pointer select-none active:scale-95 relative before:absolute before:-inset-2 sm:before:hidden touch-manipulation",
																		title: "Copy Contract Address",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "CA" }), copiedAddress === pair.baseToken.address ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-2.5 h-2.5 text-emerald-500" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "w-2.5 h-2.5 opacity-60" })]
																	}),
																	pair.pairCreatedAt && Date.now() - pair.pairCreatedAt <= 36e5 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#ff6b35]/15 text-[#ff6b35] border border-[#ff6b35]/30",
																		children: "NEW"
																	}),
																	pair.argusReusedSocials?.hasReusedSocials && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																		className: "text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1 cursor-help",
																		title: pair.argusReusedSocials.warningMessage || "Reused socials detected",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "w-2.5 h-2.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "REUSED" })]
																	})
																]
															})
														})
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-right flex-shrink-0 flex flex-col items-end",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormattedPrice, {
														value: pair.priceUsd,
														className: "text-base sm:text-lg font-bold font-mono text-[#ff6b35] tracking-tight"
													})
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: `flex items-center justify-between text-xs mb-1.5 sm:mb-2.5 pb-1.5 sm:pb-2 border-b ${isDarkMode ? "border-zinc-800/60" : "border-slate-100"}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: `text-[11px] ${theme.textMuted} flex items-center gap-1.5`,
													title: formatExactDate(pair.pairCreatedAt) ? `Created: ${formatExactDate(pair.pairCreatedAt)}` : "Launch time unknown",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "w-3 h-3 flex-shrink-0 opacity-70" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatTimeAgo(pair.pairCreatedAt) ?? "Unknown" })]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DexProtocolBadge, { pair })]
											}),
											hasHighConcentration && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex items-center gap-1.5 flex-wrap mb-2.5",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/35 text-rose-600 dark:text-rose-400",
													title: `Top 10 holders control ${top10SupplyPercentage}% of total supply`,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "w-3 h-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
														"High Concentration (",
														top10SupplyPercentage,
														"%)"
													] })]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: `grid grid-cols-3 gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-lg sm:rounded-xl mb-2 sm:mb-3 border ${isDarkMode ? "bg-[#181926]/70 border-zinc-800/60" : "bg-slate-50/70 border-slate-200/60"}`,
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "text-center overflow-hidden flex flex-col justify-center",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: `text-[10px] font-medium truncate uppercase tracking-wider ${theme.textMuted}`,
															children: "Liquidity"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: `text-xs font-bold font-mono mt-0.5 truncate ${theme.textTitle}`,
															children: liquidityValue !== void 0 && liquidityValue !== null ? liquidityValue > 0 ? `$${Number(liquidityValue) >= 1e6 ? (Number(liquidityValue) / 1e6).toFixed(1) + "M" : Number(liquidityValue) >= 1e3 ? (Number(liquidityValue) / 1e3).toFixed(0) + "K" : Number(liquidityValue).toFixed(0)}` : "$0" : "—"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "text-center overflow-hidden flex flex-col justify-center",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: `text-[10px] font-medium truncate uppercase tracking-wider ${theme.textMuted}`,
															children: "24h Vol"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: `text-xs font-bold font-mono mt-0.5 truncate ${theme.textTitle}`,
															children: volume24h !== void 0 && volume24h !== null ? volume24h > 0 ? `$${Number(volume24h) >= 1e6 ? (Number(volume24h) / 1e6).toFixed(1) + "M" : Number(volume24h) >= 1e3 ? (Number(volume24h) / 1e3).toFixed(0) + "K" : Number(volume24h).toFixed(0)}` : "$0" : "—"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "text-center overflow-hidden flex flex-col justify-center",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: `text-[10px] font-medium truncate uppercase tracking-wider ${theme.textMuted}`,
															children: marketCapValue != null ? "Market Cap" : "FDV"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: `text-xs font-bold font-mono mt-0.5 truncate ${theme.textTitle}`,
															children: (() => {
																const v = marketCapValue != null ? marketCapValue : fdvOf(pair);
																return v != null && v > 0 ? `$${Number(v) >= 1e6 ? (Number(v) / 1e6).toFixed(1) + "M" : Number(v) >= 1e3 ? (Number(v) / 1e3).toFixed(0) + "K" : Number(v).toFixed(0)}` : "—";
															})()
														})]
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mb-3 relative z-10",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: `h-14 sm:h-16 w-full p-1 rounded-xl border relative overflow-hidden transition-all ${isDarkMode ? "bg-black/40 border-zinc-800/80 group-hover:border-zinc-700/80" : "bg-slate-50/80 border-slate-200/80 group-hover:border-slate-300"}`,
													children: [priceChange24h !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: `absolute top-1.5 right-1.5 z-20 px-2 py-0.5 text-[10.5px] font-bold font-mono rounded-md border backdrop-blur-md pointer-events-none shadow-2xs ${priceChange24h >= 0 ? isDarkMode ? "bg-emerald-950/80 border-emerald-800/60 text-emerald-400" : "bg-emerald-100/95 border-emerald-300 text-emerald-700" : isDarkMode ? "bg-rose-950/80 border-rose-800/60 text-rose-400" : "bg-rose-100/95 border-rose-300 text-rose-700"}`,
														children: [
															priceChange24h >= 0 ? "▲ +" : "▼ ",
															priceChange24h,
															"%"
														]
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: `absolute top-1.5 right-1.5 z-20 px-2 py-0.5 text-[10.5px] font-medium font-mono rounded-md border backdrop-blur-md pointer-events-none shadow-2xs ${isDarkMode ? "bg-zinc-900/80 border-zinc-700/60 text-zinc-400" : "bg-slate-100/95 border-slate-300 text-slate-600"}`,
														children: "—"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TokenSparkline, {
														pair,
														priceChange24h,
														isDarkMode
													})]
												})
											})
										] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "pt-2 border-t border-slate-100 dark:border-zinc-800/40",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => toggleCardExpanded(cardKey, tokenAddress, pair.chainId, pair.pairAddress),
												className: `w-full py-1.5 px-2.5 rounded-xl border text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer ${isExpanded ? "bg-[#ff6b35]/10 border-[#ff6b35]/40 text-[#ff6b35]" : `${theme.btnSecondary} hover:text-[#ff6b35]`}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "w-3.5 h-3.5 opacity-70" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Holders & Supply Analysis" })]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: `w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}` })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: isExpanded && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
												initial: {
													opacity: 0,
													height: 0,
													rotateX: -10,
													transformPerspective: 800,
													transformOrigin: "top center"
												},
												animate: {
													opacity: 1,
													height: "auto",
													rotateX: 0
												},
												exit: {
													opacity: 0,
													height: 0,
													rotateX: -6
												},
												transition: {
													height: {
														duration: .32,
														ease: [
															.16,
															1,
															.3,
															1
														]
													},
													opacity: { duration: .22 },
													rotateX: {
														duration: .32,
														ease: [
															.16,
															1,
															.3,
															1
														]
													}
												},
												style: { transformStyle: "preserve-3d" },
												className: "overflow-hidden",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: `mt-2 p-3 rounded-xl border space-y-2.5 text-xs ${isDarkMode ? "bg-[#0e0f18] border-zinc-800/90" : "bg-slate-50 border-slate-200"}`,
													children: [
														pair.bondingCurvePda || pair.isBondingCurve || pair.realSolReservesFormatted ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
															initial: {
																opacity: 0,
																y: 6
															},
															animate: {
																opacity: 1,
																y: 0
															},
															transition: {
																duration: .28,
																delay: .04
															},
															className: "p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 space-y-1.5 text-[11px]",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																		className: "flex items-center gap-1",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "On-Chain Bonding Protocol" })]
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20",
																		children: pair.marketStage === "graduated" ? "Graduated" : "Bonding Curve"
																	})]
																}),
																typeof pair.bondingProgress === "number" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "space-y-1",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "flex justify-between text-[10.5px]",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "opacity-80",
																			children: "Graduation Progress"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																			className: "font-mono font-bold",
																			children: [pair.bondingProgress.toFixed(1), "%"]
																		})]
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																		className: "w-full h-1.5 bg-emerald-950/40 rounded-full overflow-hidden",
																		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
																			className: "h-full bg-emerald-500 rounded-full",
																			initial: { width: "0%" },
																			animate: { width: `${Math.min(100, Math.max(0, pair.bondingProgress))}%` },
																			transition: {
																				duration: .6,
																				ease: [
																					.16,
																					1,
																					.3,
																					1
																				],
																				delay: .1
																			}
																		})
																	})]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]",
																	children: [pair.realSolReservesFormatted && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "opacity-60 block",
																		children: "Real SOL Reserves:"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																		className: "font-semibold text-slate-800 dark:text-zinc-200",
																		children: [pair.realSolReservesFormatted, " SOL"]
																	})] }), (pair.creator || holderInfo?.supplier) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "opacity-60 block",
																		children: "Creator / Supplier:"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																		className: "truncate block font-semibold text-slate-800 dark:text-zinc-200",
																		children: [
																			(pair.creator || holderInfo?.supplier || "").slice(0, 4),
																			"...",
																			(pair.creator || holderInfo?.supplier || "").slice(-4)
																		]
																	})] })]
																}),
																pair.bondingCurvePda && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex items-center justify-between text-[10px] font-mono pt-0.5 border-t border-emerald-500/20",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "opacity-60",
																		children: "Bonding Curve PDA:"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																		className: "truncate max-w-[140px] text-slate-700 dark:text-zinc-300",
																		children: [
																			pair.bondingCurvePda.slice(0, 5),
																			"...",
																			pair.bondingCurvePda.slice(-5)
																		]
																	})]
																})
															]
														}) : holderInfo?.supplier || holderInfo?.creator || holderInfo?.totalSupplyFormatted || pair.creator ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
															initial: {
																opacity: 0,
																y: 6
															},
															animate: {
																opacity: 1,
																y: 0
															},
															transition: {
																duration: .28,
																delay: .04
															},
															className: "p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 space-y-1.5 text-[11px]",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "flex items-center gap-1",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "On-Chain Supply & Contract Diagnostics" })]
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20",
																	children: rpcProvider.chainDisplayName.toUpperCase()
																})]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]",
																children: [
																	holderInfo?.totalSupplyFormatted && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "opacity-60 block",
																		children: "Total Supply:"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																		className: "font-semibold text-slate-800 dark:text-zinc-200",
																		children: [
																			holderInfo.totalSupplyFormatted,
																			" ",
																			pair.baseToken?.symbol || ""
																		]
																	})] }),
																	holderInfo?.totalHolders ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "opacity-60 block",
																		children: "Total Holders:"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "font-semibold text-slate-800 dark:text-zinc-200",
																		children: holderInfo.totalHolders.toLocaleString()
																	})] }) : null,
																	(holderInfo?.supplier || holderInfo?.creator || pair.creator) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "col-span-2 flex items-center justify-between pt-1 border-t border-emerald-500/20",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "opacity-60",
																			children: "Supplier / Creator:"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																			className: "flex items-center gap-1.5",
																			children: [
																				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																					className: "font-semibold text-slate-800 dark:text-zinc-200",
																					children: [
																						(holderInfo?.supplier || holderInfo?.creator || pair.creator || "").slice(0, 6),
																						"...",
																						(holderInfo?.supplier || holderInfo?.creator || pair.creator || "").slice(-4)
																					]
																				}),
																				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																					type: "button",
																					onClick: (e) => {
																						e.stopPropagation();
																						copyToClipboard(holderInfo?.supplier || holderInfo?.creator || pair.creator || "");
																					},
																					className: "opacity-60 hover:opacity-100 transition p-0.5 cursor-pointer",
																					title: "Copy Creator Address",
																					children: copiedAddress === (holderInfo?.supplier || holderInfo?.creator || pair.creator) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-3 h-3 text-emerald-500" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "w-3 h-3" })
																				}),
																				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
																					href: rpcProvider.getExplorerUrl(holderInfo?.supplier || holderInfo?.creator || pair.creator || "", "address"),
																					target: "_blank",
																					rel: "noreferrer",
																					onClick: (e) => e.stopPropagation(),
																					className: "opacity-60 hover:opacity-100 text-emerald-500 hover:text-emerald-400 transition",
																					title: `View on ${rpcProvider.explorerName}`,
																					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "w-3 h-3" })
																				})
																			]
																		})]
																	})
																]
															})]
														}) : null,
														pair.isArgusLaunch && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
															initial: {
																opacity: 0,
																y: 6
															},
															animate: {
																opacity: 1,
																y: 0
															},
															transition: {
																duration: .28,
																delay: .06
															},
															className: "p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 space-y-2 text-[11px]",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																		className: "flex items-center gap-1.5",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Argus Protocol" })]
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400",
																		children: pair.argusLiquidityLocked ? "Locked in v4" : "Live"
																	})]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]",
																	children: [
																		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "opacity-60 block",
																			children: "Dev Buy:"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																			className: `font-semibold ${pair.argusDevBuyTier === "safe" ? "text-emerald-400" : pair.argusDevBuyTier === "moderate" ? "text-amber-400" : pair.argusDevBuyTier === "high_snipe" ? "text-rose-400" : "text-zinc-200"}`,
																			children: [
																				"$",
																				(pair.argusDevBuyUsdc ?? 0).toFixed(2),
																				" (",
																				pair.argusDevBuyTier?.toUpperCase() || "SAFE",
																				")"
																			]
																		})] }),
																		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "opacity-60 block",
																			children: "Architecture:"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "font-semibold text-slate-800 dark:text-zinc-200",
																			children: pair.argusPortalFamily || "hooked v4"
																		})] }),
																		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "opacity-60 block",
																			children: "Buy / Sell Tax:"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																			className: "font-semibold text-slate-800 dark:text-zinc-200",
																			children: [
																				((pair.argusBuyTaxBps || 0) / 100).toFixed(1),
																				"% / ",
																				((pair.argusSellTaxBps || 0) / 100).toFixed(1),
																				"%"
																			]
																		})] }),
																		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "opacity-60 block",
																			children: "Base Fee:"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																			className: "font-semibold text-slate-800 dark:text-zinc-200",
																			children: [((pair.argusBaseFeeBps || 100) / 100).toFixed(1), "%"]
																		})] })
																	]
																}),
																pair.argusDevBuyNote && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																	className: "text-[10px] text-zinc-400 italic",
																	children: pair.argusDevBuyNote
																}),
																pair.argusReusedSocials?.hasReusedSocials ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "p-2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] space-y-1",
																	children: [
																		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																			className: "font-bold flex items-center gap-1 text-amber-400",
																			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "w-3 h-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Serial Launcher Warning: Reused Social Handles" })]
																		}),
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: pair.argusReusedSocials.warningMessage || "Reused social handles detected across prior tokens" }),
																		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																			className: "opacity-80",
																			children: [
																				"Previously seen in ",
																				pair.argusReusedSocials.matchedTokens?.length || pair.argusReusedSocials.duplicateCount || 1,
																				" prior token launch(es)."
																			]
																		})
																	]
																}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex items-center gap-1 text-[10px] text-emerald-400",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-3 h-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Social Audit: Clean unique handles (No prior recycling detected)" })]
																})
															]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
															initial: {
																opacity: 0,
																y: 6
															},
															animate: {
																opacity: 1,
																y: 0
															},
															transition: {
																duration: .28,
																delay: .06
															},
															className: `p-2.5 rounded-lg border text-[11px] space-y-1.5 ${isDarkMode ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-slate-200"}`,
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center justify-between font-bold",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "flex items-center gap-1 text-[#ff6b35]",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Launch Timeline & Age" })]
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#ff6b35]/15 text-[#ff6b35] border border-[#ff6b35]/25",
																	children: formatTimeAgo(pair.pairCreatedAt) ?? "Unknown"
																})]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "grid grid-cols-2 gap-2 pt-1 font-mono text-[10.5px]",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: `${theme.textMuted} block text-[10px]`,
																	children: "Created / Launched:"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "font-semibold text-slate-800 dark:text-zinc-200 truncate block",
																	children: formatExactDate(pair.pairCreatedAt) ?? "Unknown"
																})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: `${theme.textMuted} block text-[10px]`,
																	children: "Primary Launch DEX:"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "font-semibold text-slate-800 dark:text-zinc-200 truncate block",
																	children: ponsStageLabel(pair) || (pair.primaryDex === "Raydium" && (pair.launchPlatform === "Pump.fun" || pair.dexes?.some((d) => d.toLowerCase().includes("pumpswap")) || pair.sources?.some((s) => s.toLowerCase().includes("pumpswap"))) ? "PumpSwap" : pair.primaryDex || "Pool")
																})] })]
															})]
														}),
														holderInfo?.loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "py-4 text-center space-y-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "w-4 h-4 animate-spin mx-auto text-[#ff6b35]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-[11px] opacity-70 font-mono",
																children: [
																	"Querying on-chain top holders (",
																	rpcProvider.chainDisplayName,
																	")..."
																]
															})]
														}) : topHolders.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
																initial: {
																	opacity: 0,
																	y: 6
																},
																animate: {
																	opacity: 1,
																	y: 0
																},
																transition: {
																	duration: .28,
																	delay: .08
																},
																className: "space-y-1",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex items-center justify-between text-[11px]",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: theme.textMuted,
																		children: "Top 10 Supply Concentration:"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: `font-mono font-bold ${typeof top10SupplyPercentage === "number" ? top10SupplyPercentage > 50 ? "text-rose-500" : "text-emerald-500" : theme.textMuted}`,
																		children: typeof top10SupplyPercentage === "number" ? `${top10SupplyPercentage}%` : "Unavailable"
																	})]
																}), typeof top10SupplyPercentage === "number" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																	className: "w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden",
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
																		className: `h-full rounded-full ${top10SupplyPercentage > 50 ? "bg-rose-500" : "bg-emerald-500"}`,
																		initial: { width: "0%" },
																		animate: { width: `${Math.min(top10SupplyPercentage, 100)}%` },
																		transition: {
																			duration: .75,
																			ease: [
																				.16,
																				1,
																				.3,
																				1
																			],
																			delay: .1
																		}
																	}, `progress-${top10SupplyPercentage}`)
																}), top10SupplyPercentage > 50 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.p, {
																	initial: {
																		opacity: 0,
																		y: 3
																	},
																	animate: {
																		opacity: 1,
																		y: 0
																	},
																	transition: {
																		duration: .28,
																		delay: .35
																	},
																	className: "text-[10px] text-rose-500 dark:text-rose-400 font-medium",
																	children: "⚠️ Top 10 wallets control over 50% of supply. High dumping risk."
																})] })]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HoldersPieChart, {
																topHolders,
																top10SupplyPercentage: typeof top10SupplyPercentage === "number" ? top10SupplyPercentage : void 0,
																isDarkMode
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-1.5 pt-1",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
																	initial: { opacity: 0 },
																	animate: { opacity: .6 },
																	transition: {
																		duration: .25,
																		delay: .1
																	},
																	className: "flex items-center justify-between text-[10px] uppercase font-mono tracking-wider font-semibold",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Holder Address" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "% Supply" })]
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
																	variants: holderListVariants,
																	initial: "hidden",
																	animate: "visible",
																	className: "space-y-1 max-h-36 overflow-y-auto pr-1",
																	children: topHolders.slice(0, 7).map((holder, hIdx) => {
																		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
																			variants: holderItemVariants,
																			className: `flex items-center justify-between gap-2 p-1.5 rounded-lg font-mono text-[10.5px] border ${isDarkMode ? "bg-zinc-900/60 border-zinc-800/60" : "bg-white border-slate-200/80"}`,
																			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																				className: "flex items-center gap-1.5 min-w-0",
																				children: [
																					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																						className: "opacity-40 text-[9px]",
																						children: ["#", hIdx + 1]
																					}),
																					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																						className: "truncate",
																						children: [
																							holder.ownerAddress.slice(0, 4),
																							"...",
																							holder.ownerAddress.slice(-4)
																						]
																					}),
																					holder.label && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																						className: "px-1 py-0.2 rounded text-[9px] font-sans bg-emerald-500/15 text-emerald-500 font-medium truncate max-w-[80px]",
																						children: holder.label === "Simple7702Account" ? "7702" : holder.label
																					}),
																					!holder.label && holder.isContract && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																						className: "px-1 py-0.2 rounded text-[9px] font-sans bg-purple-500/15 text-purple-400 font-medium",
																						children: "Contract"
																					})
																				]
																			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																				className: "flex items-center gap-1.5 flex-shrink-0",
																				children: [
																					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																						className: "font-semibold",
																						children: holder.percentageRelativeToTotalSupply > 0 ? `${holder.percentageRelativeToTotalSupply.toFixed(2)}%` : "<0.01%"
																					}),
																					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																						type: "button",
																						onClick: (e) => {
																							e.stopPropagation();
																							copyToClipboard(holder.ownerAddress);
																						},
																						className: "opacity-50 hover:opacity-100 transition p-0.5 cursor-pointer",
																						title: "Copy Holder Address",
																						children: copiedAddress === holder.ownerAddress ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-2.5 h-2.5 text-emerald-500" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "w-2.5 h-2.5" })
																					}),
																					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
																						href: rpcProvider.getExplorerUrl(holder.ownerAddress, "address"),
																						target: "_blank",
																						rel: "noreferrer",
																						onClick: (e) => e.stopPropagation(),
																						className: "opacity-50 hover:opacity-100 text-emerald-500 hover:text-emerald-400 transition p-0.5",
																						title: `View on ${rpcProvider.explorerName}`,
																						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "w-2.5 h-2.5" })
																					})
																				]
																			})]
																		}, `${holder.ownerAddress}-${hIdx}`);
																	})
																})]
															})
														] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "py-3 px-2 text-center space-y-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-[11px] opacity-70",
																children: holderInfo?.error || "No holder data available for this token."
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
																type: "button",
																onClick: () => fetchTokenHolders(tokenAddress, pair.chainId, true, pair.pairAddress),
																className: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 hover:border-[#ff6b35] hover:text-[#ff6b35] text-[11px] font-medium transition cursor-pointer active:scale-95",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "w-3 h-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
																	"Scan On-Chain Holders (",
																	rpcProvider.chainDisplayName,
																	")"
																] })]
															})]
														})
													]
												})
											}) })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between gap-2 pt-1.5 relative z-10 border-t border-slate-100 dark:border-zinc-800/40 mt-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "min-w-0 flex-1",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SocialLinksRow, {
													pair,
													size: "sm"
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DexProviderButton, { pair })]
										})
									]
								}, cardKey);
							})
						})
					}),
					filteredAndSortedPairs.length > PAGE_SIZE && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border relative overflow-visible transition-all duration-300 ${theme.bgCard}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `text-xs ${theme.textSub}`,
							children: [
								"Showing ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `font-semibold ${theme.textTitle}`,
									children: Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredAndSortedPairs.length)
								}),
								" to ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `font-semibold ${theme.textTitle}`,
									children: Math.min(currentPage * PAGE_SIZE, filteredAndSortedPairs.length)
								}),
								" of ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-[#ff6b35]",
									children: filteredAndSortedPairs.length
								}),
								" tokens"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									id: "btn_prev_page",
									onClick: () => setCurrentPage((prev) => Math.max(prev - 1, 1)),
									disabled: currentPage === 1,
									className: `min-h-[44px] min-w-[44px] flex items-center justify-center px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation ${theme.btnSecondary}`,
									children: "Previous"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: `text-xs font-medium ${theme.textSub}`,
									children: [
										"Page ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold text-[#ff6b35]",
											children: currentPage
										}),
										" of ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: theme.textTitle,
											children: totalPages
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									id: "btn_next_page",
									onClick: () => setCurrentPage((prev) => Math.min(prev + 1, totalPages)),
									disabled: currentPage === totalPages,
									className: `min-h-[44px] min-w-[44px] flex items-center justify-center px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation ${theme.btnSecondary}`,
									children: "Next"
								})
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: `border-t py-6 px-4 sm:px-6 transition-colors duration-200 mt-12 ${isDarkMode ? "bg-[#0d0e15] border-zinc-800/80 text-zinc-400" : "bg-slate-50 border-slate-200 text-slate-500"}`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-6 h-6 rounded-lg bg-[#ff6b35] flex items-center justify-center text-white",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "w-3.5 h-3.5 fill-white" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `font-bold tracking-tight ${isDarkMode ? "text-zinc-200" : "text-slate-800"}`,
									children: "DexHunter"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "opacity-30",
									children: "·"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs opacity-75",
									children: "Multi-chain real-time DEX discovery"
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								id: "btn_footer_export_csv",
								type: "button",
								onClick: handleExportToCSV,
								className: "hover:text-[#ff6b35] transition-colors cursor-pointer inline-flex items-center gap-1.5 font-medium",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Export CSV" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "opacity-30",
								children: "·"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								id: "btn_footer_back_to_top",
								type: "button",
								onClick: () => window.scrollTo({
									top: 0,
									behavior: "smooth"
								}),
								className: "hover:text-[#ff6b35] transition-colors cursor-pointer inline-flex items-center gap-1.5 font-medium",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Back to Top" })]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: freshMintsToast && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
				id: "toast_fresh_mints_update",
				initial: {
					opacity: 0,
					y: 24,
					scale: .94
				},
				animate: {
					opacity: 1,
					y: 0,
					scale: 1
				},
				exit: {
					opacity: 0,
					y: 16,
					scale: .94
				},
				transition: {
					duration: .22,
					ease: "easeOut"
				},
				className: `fixed bottom-6 right-4 sm:right-8 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md ${isDarkMode ? "bg-[#181926]/95 border-emerald-500/40 text-white shadow-black/60" : "bg-white/95 border-emerald-500/40 text-slate-900 shadow-slate-300/60"}`,
				role: "status",
				"aria-live": "polite",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 flex-shrink-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "w-4 h-4 animate-pulse" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col pr-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-xs font-semibold flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								freshMintsToast.count,
								" new token",
								freshMintsToast.count > 1 ? "s" : "",
								" added"
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `text-[10px] ${theme.textSub}`,
							children: "Live auto-polling feed updated"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						id: "btn_dismiss_fresh_mints_toast",
						onClick: () => setFreshMintsToast(null),
						className: "p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer",
						"aria-label": "Dismiss toast",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-3.5 h-3.5" })
					})
				]
			}) })
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(App, {});
}
//#endregion
export { Home as component };
