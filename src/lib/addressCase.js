// EVM-style addresses are case-insensitive. Solana base58 is not.
const CASE_INSENSITIVE_CHAINS = new Set([
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
  "hyperevm",
]);

/**
 * @param {string | null | undefined} chain
 * @param {unknown} address
 */
export function identityAddress(chain, address) {
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
export function chainTokenKey(chain, address) {
  const id = String(chain ?? "").trim().toLowerCase();
  const addr = identityAddress(id, address);
  if (!addr) return "";
  return `${id}:${addr}`;
}
