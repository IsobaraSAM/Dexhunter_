// @ts-nocheck
import { lookupArgusLaunch } from "./portal8-reader.js";
import { lookupPonsLaunch } from "./pons-engine.js";
import { lookupBscLaunch } from "./bsc-launch-reader.js";
import { searchMarkets } from "./direct-search.js";
import { collectAddressMatches, isAddressQuery, parseAddressQuery } from "../src/lib/addressQuery.js";

function chainName(value) {
  const c = String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (!c || c === "all") return "all";
  if (c === "robinhoodchain" || c === "rh") return "robinhood";
  if (c === "arcchain") return "arc";
  if (c === "sol") return "solana";
  if (c === "bnb" || c === "binance" || c === "bnbsmartchain") return "bsc";
  return c;
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then((value) => {
      clearTimeout(timer);
      resolve(value);
    }, (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export function explainChainMiss(labels, failed, ambiguous) {
  const failedSet = new Set(failed);
  const missed = labels.filter((label) => !failedSet.has(label));
  const chainNote = ambiguous
    ? " Arc and Robinhood addresses look the same, so both were checked."
    : "";
  if (!missed.length) {
    return `${failed.join(" and ")} did not answer in time, so this address is not confirmed missing.${chainNote}`;
  }
  const failNote = failed.length ? ` ${failed.join(" and ")} did not answer in time.` : "";
  return `No launch record on ${missed.join(" and ")} for this address.${chainNote}${failNote}`;
}

export function searchIndexedAddresses(tokens, address, chain = "all") {
  const parsed = parseAddressQuery(address);
  const selected = chainName(chain);
  const list = Array.isArray(tokens) ? tokens : [];
  const pool = selected === "all" ? list : list.filter((token) => chainName(token?.chainId) === selected);
  if (!isAddressQuery(parsed)) return { tokens: [], ambiguous: false, truncated: false, parsed };
  return { ...collectAddressMatches(pool, parsed), parsed };
}

export function findIndexedAddress(tokens, address, chain) {
  const found = searchIndexedAddresses(tokens, address, chain);
  if (found.ambiguous) return [];
  if (found.parsed?.kind !== "evm" && found.parsed?.kind !== "solana") return [];
  return found.tokens;
}

function isTaggedPons(token) {
  return Boolean(token?.isPonsLaunch) || /pons/i.test(String(token?.launchPlatform || token?.primaryDex || ""));
}

async function enrichIndexed(tokens) {
  const out = [];
  for (const token of tokens) {
    const addr = token?.baseToken?.address;
    const chain = chainName(token?.chainId);
    if (chain === "robinhood" && addr && !isTaggedPons(token)) {
      try {
        const pons = await withTimeout(lookupPonsLaunch(addr), 8000);
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
              name: keepName ? name : (pons.baseToken.name || ""),
              symbol: token.baseToken?.symbol || pons.baseToken.symbol || "",
            },
          });
          continue;
        }
      } catch {
        // Keep the indexed row if the factory read does not answer.
      }
    }
    out.push(token);
  }
  return out;
}

export async function resolveAddress(tokens, address, chain = "all", options = {}) {
  const query = String(address || "").trim();
  const selected = chainName(chain);
  const found = searchIndexedAddresses(tokens, query, selected);
  if (found.ambiguous) {
    return {
      tokens: [],
      source: "index",
      ambiguous: true,
      message: "More than one mint differs only by letter case. Paste the address with its original case.",
    };
  }
  if (found.parsed?.kind === "evm-prefix" || found.parsed?.kind === "solana-prefix") {
    return {
      tokens: found.tokens,
      message: found.tokens.length
        ? (found.truncated ? "Showing the first 40 indexed addresses with that prefix." : null)
        : "No indexed address starts or ends with that.",
      source: "index",
    };
  }
  if (found.tokens.length) {
    return { tokens: await enrichIndexed(found.tokens), message: null, source: "index" };
  }

  const evm = found.parsed?.kind === "evm";
  const solana = found.parsed?.kind === "solana";
  if (!evm && !solana) {
    return { tokens: [], source: "none", message: "That is not a contract or mint address." };
  }
  if (options.indexOnly) {
    return {
      tokens: [],
      source: "index",
      message: solana
        ? "That mint is not in the index yet."
        : null,
    };
  }
  const lookup = found.parsed.address;
  const jobs = [];
  if (evm && (selected === "all" || selected === "arc")) {
    jobs.push(["Argus Portal 8", () => lookupArgusLaunch(lookup)]);
  }
  if (evm && (selected === "all" || selected === "robinhood")) {
    jobs.push(["Pons", () => lookupPonsLaunch(lookup)]);
  }
  if (evm && (selected === "all" || selected === "bsc")) {
    jobs.push(["Four.meme", () => lookupBscLaunch(lookup)]);
  }
  if (solana && (selected === "all" || selected === "solana")) {
    jobs.push(["Markets", () => searchMarkets(lookup)]);
  }
  if (evm && selected !== "arc" && selected !== "robinhood") {
    jobs.push(["Markets", () => searchMarkets(lookup)]);
  }
  if (!jobs.length) {
    return {
      tokens: [],
      source: "none",
      message: evm ? `No indexed launch for this address on ${selected}.` : null,
    };
  }

  const settled = await Promise.allSettled(jobs.map(([, run]) => withTimeout(run(), 9000)));
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
    for (const row of rows) {
      if (row?.baseToken?.address) chainHits.push(row);
    }
  });
  const seen = new Set();
  const unique = [];
  for (const token of chainHits) {
    if (selected !== "all" && chainName(token.chainId) !== selected) continue;
    const key = `${chainName(token.chainId)}:${String(token.baseToken.address)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(token);
  }
  if (unique.length) return { tokens: unique, message: null, source: "chain" };
  return {
    tokens: [],
    source: "chain",
    message: explainChainMiss(
      jobs.map(([label]) => label),
      failed,
      selected === "all" && evm,
    ),
  };
}
