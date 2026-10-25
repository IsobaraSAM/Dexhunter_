/**
 * DexHunter × Argus Portal 8 Integration
 * Arc RPC Manager with Failover, Chain ID Verification, Retries, and Adaptive Chunking
 */

import dns from "dns";
if (typeof dns?.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}
import { ethers } from "ethers";
import { ARC_CHAIN_ID } from "./contracts.js";
import {
  Portal8Logger,
  ChainIdMismatchError,
  RpcExhaustionError,
} from "./types.js";

export interface RpcManagerConfig {
  rpcUrls: string[];
  expectedChainId?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  logger?: Portal8Logger;
}

export class ArcRpcManager {
  private rpcUrls: string[];
  private currentIndex = 0;
  private readonly expectedChainId: number;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly logger?: Portal8Logger;
  private verifiedProviders = new Map<string, ethers.JsonRpcProvider>();

  constructor(config: RpcManagerConfig) {
    if (!config.rpcUrls || config.rpcUrls.length === 0) {
      throw new Error("ArcRpcManager requires at least one RPC URL");
    }
    this.rpcUrls = [...config.rpcUrls];
    this.expectedChainId = config.expectedChainId ?? ARC_CHAIN_ID;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelayMs = config.retryDelayMs ?? 500;
    this.logger = config.logger;
  }

  public getCurrentRpcUrl(): string {
    return this.rpcUrls[this.currentIndex];
  }

  /**
   * Rotates to next configured RPC in the pool.
   */
  public rotateRpc(): string {
    const prev = this.rpcUrls[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.rpcUrls.length;
    const next = this.rpcUrls[this.currentIndex];
    this.logger?.warn("Rotating Arc RPC endpoint", { previous: prev, next });
    return next;
  }

  /**
   * Obtains a JsonRpcProvider for the current endpoint, caching verified instances.
   */
  public getProvider(): ethers.JsonRpcProvider {
    const url = this.getCurrentRpcUrl();
    let provider = this.verifiedProviders.get(url);
    if (!provider) {
      provider = new ethers.JsonRpcProvider(
        url,
        {
          name: "arc",
          chainId: this.expectedChainId,
        },
        { staticNetwork: true }
      );
      this.verifiedProviders.set(url, provider);
    }
    return provider;
  }

  /**
   * Verifies that the connected RPC matches expected chainId (5042).
   */
  public async verifyChainId(): Promise<void> {
    const provider = this.getProvider();
    try {
      const network = await provider.getNetwork();
      const actualChainId = Number(network.chainId);
      if (actualChainId !== this.expectedChainId) {
        throw new ChainIdMismatchError(this.expectedChainId, actualChainId);
      }
      this.logger?.info("Arc RPC Chain ID verified", {
        chainId: actualChainId,
        rpc: this.getCurrentRpcUrl(),
      });
    } catch (err) {
      if (err instanceof ChainIdMismatchError) {
        throw err;
      }
      throw new Error(
        `Failed to verify Arc chainId on ${this.getCurrentRpcUrl()}: ${(err as Error).message}`
      );
    }
  }

  /**
   * Executes an asynchronous RPC operation with automatic retry and endpoint rotation.
   */
  public async executeWithRetry<T>(
    operationName: string,
    action: (provider: ethers.JsonRpcProvider) => Promise<T>
  ): Promise<T> {
    let lastError: unknown;
    const totalAttempts = this.rpcUrls.length * this.maxRetries;

    for (let attempt = 1; attempt <= totalAttempts; attempt++) {
      const provider = this.getProvider();
      try {
        return await action(provider);
      } catch (err: unknown) {
        lastError = err;
        const errMsg = (err as Error)?.message || String(err);

        // Check if error is range/size limit error (handled higher up by adaptive chunking)
        if (this.isLogRangeError(errMsg)) {
          throw err;
        }

        this.logger?.warn(`RPC error during ${operationName} (attempt ${attempt}/${totalAttempts})`, {
          endpoint: this.getCurrentRpcUrl(),
          error: errMsg,
        });

        // Rotate RPC if multiple failures on this endpoint
        if (attempt % this.maxRetries === 0) {
          this.rotateRpc();
        }

        // Exponential backoff with jitter
        const delay = this.retryDelayMs * Math.pow(1.5, (attempt % this.maxRetries)) + Math.random() * 200;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new RpcExhaustionError(`Failed executing ${operationName}`, lastError);
  }

  /**
   * Gets latest block number from Arc.
   */
  public async getBlockNumber(): Promise<number> {
    return this.executeWithRetry("getBlockNumber", async (provider) => {
      return provider.getBlockNumber();
    });
  }

  /**
   * Fetches logs for a given block range and filter.
   */
  public async getLogs(filter: {
    address?: string | string[];
    topics?: (string | string[] | null)[];
    fromBlock: number;
    toBlock: number;
  }): Promise<ethers.Log[]> {
    return this.executeWithRetry("getLogs", async (provider) => {
      return provider.getLogs({
        address: filter.address,
        topics: filter.topics,
        fromBlock: filter.fromBlock,
        toBlock: filter.toBlock,
      });
    });
  }

  /**
   * Checks if an error message represents a block range query limit from the RPC node.
   */
  public isLogRangeError(message: string): boolean {
    const lower = message.toLowerCase();
    return (
      lower.includes("query returned more than") ||
      lower.includes("block range is too wide") ||
      lower.includes("log response size exceeded") ||
      lower.includes("exceed maximum block range") ||
      lower.includes("range too large") ||
      lower.includes("too many results") ||
      lower.includes("limit exceeded") ||
      lower.includes("eth_getlogs") && lower.includes("limit")
    );
  }
}
