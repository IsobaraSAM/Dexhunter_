/**
 * Generic RPC Provider Pattern for Token Holder & Supply Analysis
 * Supports Solana/Pump.fun, Robinhood Chain Blockscout, and EVM/Moralis/Generic RPC providers.
 */

export type HolderRpcType = "solana-pump" | "blockscout-evm" | "moralis-evm" | "generic-rpc";

export interface IRpcHolderProvider {
  /** Unique key identifying the provider (e.g., 'robinhood-blockscout', 'solana-pump', 'base-evm') */
  providerKey: string;
  /** Human-readable chain display name (e.g. 'Robinhood Chain', 'Solana', 'Base') */
  chainDisplayName: string;
  /** Standard chain id (e.g., 'robinhood', 'solana', 'base', 'ethereum', 'bsc') */
  chainId: string;
  /** Primary RPC endpoint */
  rpcUrl?: string;
  /** Provider architecture type */
  rpcType: HolderRpcType;
  /** Explorer branding name */
  explorerName: string;
  /** Explorer base URL */
  explorerBaseUrl: string;
  /** Generate URL for address, token, or tx on block explorer */
  getExplorerUrl(identifier: string, type?: "token" | "address" | "tx"): string;
  /** Parameters to pass to the /api/token-holders scanner backend */
  getScannerParams(tokenAddress: string, pairAddress?: string): {
    address: string;
    chainId: string;
    provider: string;
    rpcUrl?: string;
    pairAddress?: string;
  };
}

export interface ScannedTokenHolder {
  address: string;
  ownerAddress: string;
  tokenAccount?: string;
  balance: string | number;
  balanceFormatted?: string;
  percentage: number;
  percentageRelativeToTotalSupply: number;
  isContract?: boolean;
  label?: string;
}

export interface TokenHoldersScanResult {
  loading: boolean;
  totalHolders: number;
  totalSupply?: string | number | null;
  totalSupplyFormatted?: string;
  decimals?: number;
  supplier?: string;
  creator?: string;
  deployer?: string;
  creationTx?: string;
  creationTimestamp?: number;
  source?: string;
  chain?: string;
  providerKey?: string;
  providerName?: string;
  topHolders: ScannedTokenHolder[];
  /** Missing when the scanner did not report a top-10 share — never coerced to 0 */
  top10SupplyPercentage?: number;
  error?: string;
}

// 1. Robinhood Chain Blockscout & RPC Provider
export class RobinhoodHolderRpcProvider implements IRpcHolderProvider {
  providerKey = "robinhood-blockscout";
  chainDisplayName = "Robinhood Chain";
  chainId = "robinhood";
  rpcUrl = "https://rpc.mainnet.chain.robinhood.com";
  rpcType: HolderRpcType = "blockscout-evm";
  explorerName = "Robinhood Blockscout";
  explorerBaseUrl = "https://robinhoodchain.blockscout.com";

  getExplorerUrl(identifier: string, type: "token" | "address" | "tx" = "address"): string {
    const clean = identifier.trim();
    if (!clean) return this.explorerBaseUrl;
    if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
    if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
    return `${this.explorerBaseUrl}/address/${clean}`;
  }

  getScannerParams(tokenAddress: string, pairAddress?: string) {
    return {
      address: tokenAddress.trim(),
      chainId: this.chainId,
      provider: this.providerKey,
      rpcUrl: this.rpcUrl,
      pairAddress: pairAddress?.trim(),
    };
  }
}

// 2. Solana / Pump.fun On-Chain Provider
export class SolanaPumpHolderRpcProvider implements IRpcHolderProvider {
  providerKey = "solana-pump";
  chainDisplayName = "Solana";
  chainId = "solana";
  rpcUrl = "https://api.mainnet-beta.solana.com";
  rpcType: HolderRpcType = "solana-pump";
  explorerName = "Solscan";
  explorerBaseUrl = "https://solscan.io";

  getExplorerUrl(identifier: string, type: "token" | "address" | "tx" = "address"): string {
    const clean = identifier.trim();
    if (!clean) return this.explorerBaseUrl;
    if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
    if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
    return `${this.explorerBaseUrl}/account/${clean}`;
  }

  getScannerParams(tokenAddress: string, pairAddress?: string) {
    return {
      address: tokenAddress.trim(),
      chainId: this.chainId,
      provider: this.providerKey,
      rpcUrl: this.rpcUrl,
      pairAddress: pairAddress?.trim(),
    };
  }
}

// 3. Base EVM Provider
export class BaseHolderRpcProvider implements IRpcHolderProvider {
  providerKey = "base-evm";
  chainDisplayName = "Base";
  chainId = "base";
  rpcUrl = "https://mainnet.base.org";
  rpcType: HolderRpcType = "moralis-evm";
  explorerName = "BaseScan";
  explorerBaseUrl = "https://basescan.org";

  getExplorerUrl(identifier: string, type: "token" | "address" | "tx" = "address"): string {
    const clean = identifier.trim();
    if (!clean) return this.explorerBaseUrl;
    if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
    if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
    return `${this.explorerBaseUrl}/address/${clean}`;
  }

  getScannerParams(tokenAddress: string, pairAddress?: string) {
    return {
      address: tokenAddress.trim(),
      chainId: this.chainId,
      provider: this.providerKey,
      rpcUrl: this.rpcUrl,
      pairAddress: pairAddress?.trim(),
    };
  }
}

// 4. Ethereum Mainnet Provider
export class EthereumHolderRpcProvider implements IRpcHolderProvider {
  providerKey = "ethereum-evm";
  chainDisplayName = "Ethereum";
  chainId = "ethereum";
  rpcUrl = "https://cloudflare-eth.com";
  rpcType: HolderRpcType = "moralis-evm";
  explorerName = "Etherscan";
  explorerBaseUrl = "https://etherscan.io";

  getExplorerUrl(identifier: string, type: "token" | "address" | "tx" = "address"): string {
    const clean = identifier.trim();
    if (!clean) return this.explorerBaseUrl;
    if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
    if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
    return `${this.explorerBaseUrl}/address/${clean}`;
  }

  getScannerParams(tokenAddress: string, pairAddress?: string) {
    return {
      address: tokenAddress.trim(),
      chainId: this.chainId,
      provider: this.providerKey,
      rpcUrl: this.rpcUrl,
      pairAddress: pairAddress?.trim(),
    };
  }
}

// 5. BSC (BNB Chain) Provider
export class BscHolderRpcProvider implements IRpcHolderProvider {
  providerKey = "bsc-evm";
  chainDisplayName = "BNB Chain";
  chainId = "bsc";
  rpcUrl = "https://binance.llamarpc.com";
  rpcType: HolderRpcType = "moralis-evm";
  explorerName = "BscScan";
  explorerBaseUrl = "https://bscscan.com";

  getExplorerUrl(identifier: string, type: "token" | "address" | "tx" = "address"): string {
    const clean = identifier.trim();
    if (!clean) return this.explorerBaseUrl;
    if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
    if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
    return `${this.explorerBaseUrl}/address/${clean}`;
  }

  getScannerParams(tokenAddress: string, pairAddress?: string) {
    return {
      address: tokenAddress.trim(),
      chainId: this.chainId,
      provider: this.providerKey,
      rpcUrl: this.rpcUrl,
      pairAddress: pairAddress?.trim(),
    };
  }
}

// 6. Arbitrum Provider
export class ArbitrumHolderRpcProvider implements IRpcHolderProvider {
  providerKey = "arbitrum-evm";
  chainDisplayName = "Arbitrum";
  chainId = "arbitrum";
  rpcUrl = "https://arb1.arbitrum.io/rpc";
  rpcType: HolderRpcType = "moralis-evm";
  explorerName = "Arbiscan";
  explorerBaseUrl = "https://arbiscan.io";

  getExplorerUrl(identifier: string, type: "token" | "address" | "tx" = "address"): string {
    const clean = identifier.trim();
    if (!clean) return this.explorerBaseUrl;
    if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
    if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
    return `${this.explorerBaseUrl}/address/${clean}`;
  }

  getScannerParams(tokenAddress: string, pairAddress?: string) {
    return {
      address: tokenAddress.trim(),
      chainId: this.chainId,
      provider: this.providerKey,
      rpcUrl: this.rpcUrl,
      pairAddress: pairAddress?.trim(),
    };
  }
}

// 7. Polygon Provider
export class PolygonHolderRpcProvider implements IRpcHolderProvider {
  providerKey = "polygon-evm";
  chainDisplayName = "Polygon";
  chainId = "polygon";
  rpcUrl = "https://polygon-rpc.com";
  rpcType: HolderRpcType = "moralis-evm";
  explorerName = "Polygonscan";
  explorerBaseUrl = "https://polygonscan.com";

  getExplorerUrl(identifier: string, type: "token" | "address" | "tx" = "address"): string {
    const clean = identifier.trim();
    if (!clean) return this.explorerBaseUrl;
    if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
    if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
    return `${this.explorerBaseUrl}/address/${clean}`;
  }

  getScannerParams(tokenAddress: string, pairAddress?: string) {
    return {
      address: tokenAddress.trim(),
      chainId: this.chainId,
      provider: this.providerKey,
      rpcUrl: this.rpcUrl,
      pairAddress: pairAddress?.trim(),
    };
  }
}

// 8. Avalanche C-Chain Provider
export class AvalancheHolderRpcProvider implements IRpcHolderProvider {
  providerKey = "avalanche-evm";
  chainDisplayName = "Avalanche";
  chainId = "avalanche";
  rpcUrl = "https://api.avax.network/ext/bc/C/rpc";
  rpcType: HolderRpcType = "generic-rpc";
  explorerName = "Snowtrace";
  explorerBaseUrl = "https://snowtrace.io";

  getExplorerUrl(identifier: string, type: "token" | "address" | "tx" = "address"): string {
    const clean = identifier.trim();
    if (!clean) return this.explorerBaseUrl;
    if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
    if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
    return `${this.explorerBaseUrl}/address/${clean}`;
  }

  getScannerParams(tokenAddress: string, pairAddress?: string) {
    return {
      address: tokenAddress.trim(),
      chainId: this.chainId,
      provider: this.providerKey,
      rpcUrl: this.rpcUrl,
      pairAddress: pairAddress?.trim(),
    };
  }
}

// 9. Cronos EVM Provider
export class CronosHolderRpcProvider implements IRpcHolderProvider {
  providerKey = "cronos-evm";
  chainDisplayName = "Cronos";
  chainId = "cronos";
  rpcUrl = "https://evm.cronos.org";
  rpcType: HolderRpcType = "generic-rpc";
  explorerName = "Cronoscan";
  explorerBaseUrl = "https://cronoscan.com";

  getExplorerUrl(identifier: string, type: "token" | "address" | "tx" = "address"): string {
    const clean = identifier.trim();
    if (!clean) return this.explorerBaseUrl;
    if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
    if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
    return `${this.explorerBaseUrl}/address/${clean}`;
  }

  getScannerParams(tokenAddress: string, pairAddress?: string) {
    return {
      address: tokenAddress.trim(),
      chainId: this.chainId,
      provider: this.providerKey,
      rpcUrl: this.rpcUrl,
      pairAddress: pairAddress?.trim(),
    };
  }
}

// 10. Optimism OP Mainnet Provider
export class OptimismHolderRpcProvider implements IRpcHolderProvider {
  providerKey = "optimism-evm";
  chainDisplayName = "Optimism";
  chainId = "optimism";
  rpcUrl = "https://mainnet.optimism.io";
  rpcType: HolderRpcType = "generic-rpc";
  explorerName = "Optimistic Etherscan";
  explorerBaseUrl = "https://optimistic.etherscan.io";

  getExplorerUrl(identifier: string, type: "token" | "address" | "tx" = "address"): string {
    const clean = identifier.trim();
    if (!clean) return this.explorerBaseUrl;
    if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
    if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
    return `${this.explorerBaseUrl}/address/${clean}`;
  }

  getScannerParams(tokenAddress: string, pairAddress?: string) {
    return {
      address: tokenAddress.trim(),
      chainId: this.chainId,
      provider: this.providerKey,
      rpcUrl: this.rpcUrl,
      pairAddress: pairAddress?.trim(),
    };
  }
}

// 11. Generic EVM / Multi-chain Fallback Provider
export class GenericEvmHolderRpcProvider implements IRpcHolderProvider {
  providerKey: string;
  chainDisplayName: string;
  chainId: string;
  rpcUrl?: string;
  rpcType: HolderRpcType = "generic-rpc";
  explorerName: string;
  explorerBaseUrl: string;

  constructor(chainId: string) {
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

  getExplorerUrl(identifier: string, type: "token" | "address" | "tx" = "address"): string {
    const clean = identifier.trim();
    if (!clean) return this.explorerBaseUrl;
    if (this.explorerBaseUrl.includes("dexscreener.com")) {
      return `${this.explorerBaseUrl}/${clean}`;
    }
    if (type === "tx") return `${this.explorerBaseUrl}/tx/${clean}`;
    if (type === "token") return `${this.explorerBaseUrl}/token/${clean}`;
    return `${this.explorerBaseUrl}/address/${clean}`;
  }

  getScannerParams(tokenAddress: string, pairAddress?: string) {
    return {
      address: tokenAddress.trim(),
      chainId: this.chainId,
      provider: this.providerKey,
      rpcUrl: this.rpcUrl,
      pairAddress: pairAddress?.trim(),
    };
  }
}

// Global Singletons for standard providers
const robinhoodProvider = new RobinhoodHolderRpcProvider();
const solanaProvider = new SolanaPumpHolderRpcProvider();
const baseProvider = new BaseHolderRpcProvider();
const ethereumProvider = new EthereumHolderRpcProvider();
const bscProvider = new BscHolderRpcProvider();
const arbitrumProvider = new ArbitrumHolderRpcProvider();
const polygonProvider = new PolygonHolderRpcProvider();
const avalancheProvider = new AvalancheHolderRpcProvider();
const cronosProvider = new CronosHolderRpcProvider();
const optimismProvider = new OptimismHolderRpcProvider();

/**
 * Generic RPC Provider Resolver
 * Dynamically resolves the best chain-specific holder scanner provider.
 */
const UNSUPPORTED_HOLDER_CHAINS = new Set([
  "aptos",
  "sui",
  "ton",
  "sui-mainnet",
  "aptos-mainnet",
  "arc",
]);

function isBase58MintLength(address: string): boolean {
  return !address.startsWith("0x") && address.length >= 32 && address.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(address);
}

export class UnsupportedHolderRpcProvider implements IRpcHolderProvider {
  providerKey = "unsupported";
  chainDisplayName: string;
  chainId: string;
  rpcType: HolderRpcType = "generic-rpc";
  explorerName = "Unsupported";
  explorerBaseUrl = "";

  constructor(chainId: string) {
    this.chainId = (chainId || "unknown").toLowerCase();
    this.chainDisplayName = this.chainId;
  }

  getExplorerUrl(): string {
    return "";
  }

  getScannerParams(tokenAddress: string, pairAddress?: string) {
    return {
      address: tokenAddress.trim(),
      chainId: this.chainId,
      provider: this.providerKey,
      pairAddress: pairAddress?.trim(),
    };
  }
}

export function getRpcHolderProvider(chainId?: string, tokenAddress?: string): IRpcHolderProvider {
  const normChain = (chainId || "").toLowerCase().trim();
  const address = (tokenAddress || "").trim();

  if (UNSUPPORTED_HOLDER_CHAINS.has(normChain)) {
    return new UnsupportedHolderRpcProvider(normChain);
  }

  // 1. Explicit Robinhood Chain check
  if (normChain === "robinhood" || normChain === "robinhoodchain" || normChain === "4663") {
    return robinhoodProvider;
  }

  // 2. Solana check — empty chain + non-0x must not assume Solana unless it looks like a base58 mint
  if (normChain === "solana" || normChain === "sol") {
    return solanaProvider;
  }
  if (!normChain && isBase58MintLength(address)) {
    return solanaProvider;
  }

  // 3. Known EVM Chains
  if (normChain === "base" || normChain === "8453") {
    return baseProvider;
  }
  if (normChain === "ethereum" || normChain === "eth" || normChain === "1") {
    return ethereumProvider;
  }
  if (normChain === "bsc" || normChain === "bnb" || normChain === "56") {
    return bscProvider;
  }
  if (normChain === "arbitrum" || normChain === "arb" || normChain === "42161") {
    return arbitrumProvider;
  }
  if (normChain === "polygon" || normChain === "matic" || normChain === "137") {
    return polygonProvider;
  }
  if (normChain === "avalanche" || normChain === "avax" || normChain === "43114") {
    return avalancheProvider;
  }
  if (normChain === "cronos" || normChain === "cro" || normChain === "25") {
    return cronosProvider;
  }
  if (normChain === "optimism" || normChain === "op" || normChain === "10") {
    return optimismProvider;
  }

  if (address.startsWith("0x") && /^0x[a-fA-F0-9]{40}$/.test(address)) {
    if (normChain) {
      return new GenericEvmHolderRpcProvider(normChain);
    }
    return ethereumProvider;
  }

  return new UnsupportedHolderRpcProvider(normChain || "unknown");
}

/**
 * Unified Token Holder Scanner Function
 * Executes the request using the resolved chain RPC provider.
 */
export async function executeTokenHoldersScan(
  tokenAddress: string,
  provider: IRpcHolderProvider,
  signal?: AbortSignal,
  pairAddress?: string
): Promise<TokenHoldersScanResult> {
  const unsupportedResult = (): TokenHoldersScanResult => ({
    loading: false,
    totalHolders: 0,
    totalSupply: undefined,
    topHolders: [],
    top10SupplyPercentage: undefined,
    chain: provider.chainId,
    providerKey: provider.providerKey,
    providerName: provider.chainDisplayName,
    error: `Holder scanning is not supported for chain: ${provider.chainId || "unknown"}`,
  });

  if (
    provider instanceof UnsupportedHolderRpcProvider ||
    UNSUPPORTED_HOLDER_CHAINS.has((provider.chainId || "").toLowerCase())
  ) {
    return unsupportedResult();
  }

  const params = provider.getScannerParams(tokenAddress, pairAddress);
  const searchParams = new URLSearchParams();
  searchParams.set("address", params.address);
  searchParams.set("chainId", params.chainId);
  searchParams.set("provider", params.provider);
  // Do not forward rpcUrl — caller-controlled RPC URLs are an SSRF vector
  if (params.pairAddress) {
    searchParams.set("pairAddress", params.pairAddress);
  }

  const res = await fetch(`/api/token-holders?${searchParams.toString()}`, { signal });
  const contentType = res.headers.get("content-type") || "";
  if (!res.ok || !contentType.includes("application/json")) {
    throw new Error(
      !contentType.includes("application/json")
        ? "Holder scanner returned a non-JSON response"
        : `Holder scanner HTTP error ${res.status}`
    );
  }

  const data = await res.json();
  const top10Raw = data.top10SupplyPercentage;
  const top10Num = top10Raw == null || top10Raw === "" ? NaN : Number(top10Raw);

  return {
    loading: false,
    totalHolders: typeof data.totalHolders === "number" ? data.totalHolders : (Array.isArray(data.topHolders) ? data.topHolders.length : 0),
    totalSupply: data.totalSupply ?? undefined,
    totalSupplyFormatted: data.totalSupplyFormatted ?? undefined,
    decimals: typeof data.decimals === "number" ? data.decimals : undefined,
    supplier: data.supplier || data.creator || data.deployer || undefined,
    creator: data.creator || data.supplier || data.deployer || undefined,
    deployer: data.deployer || data.creator || data.supplier || undefined,
    creationTx: data.creationTx || undefined,
    creationTimestamp: typeof data.creationTimestamp === "number" ? data.creationTimestamp : undefined,
    source: data.source || undefined,
    chain: data.chain || provider.chainId,
    providerKey: provider.providerKey,
    providerName: provider.chainDisplayName,
    topHolders: Array.isArray(data.topHolders) ? data.topHolders : [],
    top10SupplyPercentage: Number.isFinite(top10Num) ? top10Num : undefined,
    error: data.error || (data.topHolders?.length === 0 ? data.message : undefined),
  };
}
