import { Connection } from "@solana/web3.js";
import { IDexHunterProvider } from "./types";
import { TokenPair } from "../../types";
import { fetchMetaplexMetadata, normalizeUri } from "./metaplexMetadata";

const RPC_ENDPOINTS = [
  "https://solana-rpc.publicnode.com",
  "https://rpc.ankr.com/solana",
  "https://api.mainnet-beta.solana.com",
];

let currentRpcIdx = 0;

function getActiveSolanaConnection(): Connection {
  const endpoint = RPC_ENDPOINTS[currentRpcIdx] || "https://solana-rpc.publicnode.com";
  return new Connection(endpoint, { commitment: "confirmed", disableRetryOnRateLimit: true });
}

function rotateSolanaRpc() {
  currentRpcIdx = (currentRpcIdx + 1) % RPC_ENDPOINTS.length;
}

async function solanaRpcCall(method: string, params: any[], timeoutMs = 5000, signal?: AbortSignal): Promise<any> {
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
          params,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener("abort", onAbort);

      if (!res.ok) {
        rotateSolanaRpc();
        if (res.status === 429 && attempt < maxTries - 1) {
          await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
        }
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
      if (attempt < maxTries - 1) {
        continue;
      }
      return null;
    }
  }

  return null;
}

export class SolanaRPCProvider implements IDexHunterProvider {
  name = "SolanaRPC";

  /**
   * Primary method to fetch on-chain token metadata and supply via Solana JSON-RPC
   */
  async fetchTokens(mintAddress: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    if (!mintAddress || mintAddress.trim().length < 32 || mintAddress.includes(" ")) {
      return [];
    }

    const cleanMint = mintAddress.trim();

    try {
      // 1 & 2. Concurrently fetch parsed account info and Metaplex metadata via Promise.allSettled
      const [accountSettled, metaSettled] = await Promise.allSettled([
        solanaRpcCall(
          "getAccountInfo",
          [cleanMint, { encoding: "jsonParsed" }],
          5000,
          signal
        ),
        (async () => {
          const conn = getActiveSolanaConnection();
          return await fetchMetaplexMetadata(conn, cleanMint, { timeoutMs: 3500 });
        })(),
      ]);

      const accountInfo = accountSettled.status === "fulfilled" ? accountSettled.value : null;
      if (!accountInfo || !accountInfo.value) {
        return [];
      }

      const parsed = accountInfo.value?.data?.parsed;
      const owner = typeof accountInfo.value?.owner === "string"
        ? accountInfo.value.owner
        : accountInfo.value?.owner?.toString?.();
      const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
      const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
      const isParsedMint = parsed?.type === "mint";
      const isTokenProgramOwner = owner === TOKEN_PROGRAM_ID || owner === TOKEN_2022_PROGRAM_ID;
      if (!isParsedMint && !isTokenProgramOwner) return [];
      if (parsed && parsed.type !== "mint") return [];

      const parsedData = parsed?.info;
      const decimals = parsedData?.decimals ?? 9;
      const supplyRaw = parsedData?.supply ?? "0";
      const supply = Number(supplyRaw) / Math.pow(10, decimals);

      let tokenName = `Unknown Token (${cleanMint.slice(0, 4)}...${cleanMint.slice(-4)})`;
      let tokenSymbol = cleanMint.slice(0, 5).toUpperCase();
      let imageUrl: string | undefined = undefined;
      const websites: Array<{ type: string; label?: string; url: string }> = [];
      const socials: Array<{ type: string; url: string }> = [];

      if (metaSettled.status === "fulfilled" && metaSettled.value) {
        const meta = metaSettled.value;
        if (meta && (meta.name || meta.symbol || meta.image)) {
          if (meta.name && !meta.name.startsWith("Token ")) tokenName = meta.name;
          if (meta.symbol && meta.symbol !== "TOKEN") tokenSymbol = meta.symbol;
          if (meta.image) imageUrl = normalizeUri(meta.image, 0);
          if (meta.website) websites.push({ type: "website", label: "Website", url: meta.website });
          if (meta.twitter) socials.push({ type: "twitter", url: meta.twitter });
          if (meta.telegram) socials.push({ type: "telegram", url: meta.telegram });
        }
      }

      // 3. Build on-chain normalized token representation
      const token: Partial<TokenPair> = {
        chainId: "solana",
        dexId: "solana-rpc",
        url: `https://solscan.io/token/${cleanMint}`,
        pairAddress: cleanMint,
        baseToken: {
          address: cleanMint,
          name: tokenName,
          symbol: tokenSymbol,
        },
        quoteToken: {
          address: "So11111111111111111111111111111111111111112",
          name: "Wrapped SOL",
          symbol: "SOL",
        },
        priceNative: undefined,
        priceUsd: undefined,
        marketCap: undefined,
        fdv: undefined,
        liquidity: undefined,
        totalLiquidityUsd: undefined,
        volume: undefined,
        totalVolume24h: undefined,
        pairCreatedAt: undefined,
        primaryProvider: this.name,
        sources: ["Solana RPC"],
        info: {
          imageUrl,
          websites: websites.length > 0 ? websites : undefined,
          socials: socials.length > 0 ? socials : undefined,
        },
      };

      return [token];
    } catch {
      return [];
    }
  }

  async searchTokens(query: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    if (query && query.trim().length >= 32 && !query.includes(" ")) {
      return this.fetchTokens(query.trim(), signal);
    }
    return [];
  }

  async getTokenByAddress(address: string, _chainId?: string, signal?: AbortSignal): Promise<Partial<TokenPair>[]> {
    return this.fetchTokens(address, signal);
  }

  async discoverTokens(_mode: "trending" | "latest", _signal?: AbortSignal, _chainId?: string): Promise<Partial<TokenPair>[]> {
    return [];
  }
}

export const solanaProvider = new SolanaRPCProvider();
