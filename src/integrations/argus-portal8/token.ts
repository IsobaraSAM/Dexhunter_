/**
 * DexHunter × Argus Portal 8 Integration
 * On-Chain Hydration (Portal8, Hook, Token, and Creator Registry)
 */

import { ethers } from "ethers";
import {
  PORTAL8_ADDRESS,
  PORTAL8_ABI,
  HOOK_ABI,
  ERC20_PORTAL8_ABI,
  CREATOR_REGISTRY_ADDRESS,
  CREATOR_REGISTRY_ABI,
} from "./contracts.js";
import {
  Portal8LaunchOnChainData,
  Portal8HookOnChainData,
  Portal8TokenOnChainData,
  Portal8HydratedData,
} from "./types.js";
import { safeChecksumAddress } from "./decoder.js";

export class Portal8Hydrator {
  constructor(private readonly provider: ethers.ContractRunner) {}

  /**
   * Reads portal8.launches(token)
   * Returns:
   * hook, escrow, locker, positionId, tickStart, tickBond, tokenIsToken0
   */
  public async readPortalLaunch(
    tokenAddress: string,
    portalAddress = PORTAL8_ADDRESS
  ): Promise<Portal8LaunchOnChainData | null> {
    try {
      const portal = new ethers.Contract(portalAddress, PORTAL8_ABI, this.provider);
      const res = await portal.launches(tokenAddress);

      if (!res || !res.hook || res.hook === ethers.ZeroAddress) {
        return null;
      }

      return {
        hook: safeChecksumAddress(res.hook ?? res[0]),
        escrow: safeChecksumAddress(res.escrow ?? res[1]),
        locker: safeChecksumAddress(res.locker ?? res[2]),
        positionId: BigInt(res.positionId ?? res[3]),
        tickStart: Number(res.tickStart ?? res[4]),
        tickBond: Number(res.tickBond ?? res[5]),
        tokenIsToken0: Boolean(res.tokenIsToken0 ?? res[6]),
      };
    } catch {
      return null;
    }
  }

  /**
   * Reads Hook state for quoteAsset, totalFeeBps, launchedAt, launchBlock.
   * Portal 8 hook: Does NOT contain buyTaxBps/sellTaxBps.
   */
  public async readHook(hookAddress: string): Promise<Portal8HookOnChainData | null> {
    if (!hookAddress || hookAddress === ethers.ZeroAddress) {
      return null;
    }

    try {
      const hook = new ethers.Contract(hookAddress, HOOK_ABI, this.provider);

      const [quoteRes, feeRes, launchedAtRes, launchBlockRes] = await Promise.allSettled([
        hook.quoteAsset(),
        hook.totalFeeBps(),
        hook.launchedAt(),
        hook.launchBlock(),
      ]);

      const data: Portal8HookOnChainData = {};

      if (quoteRes.status === "fulfilled" && quoteRes.value) {
        data.quoteAsset = safeChecksumAddress(quoteRes.value);
      }
      if (feeRes.status === "fulfilled" && feeRes.value !== undefined) {
        data.totalFeeBps = Number(feeRes.value);
      }
      if (launchedAtRes.status === "fulfilled" && launchedAtRes.value !== undefined) {
        data.launchedAt = BigInt(launchedAtRes.value);
      }
      if (launchBlockRes.status === "fulfilled" && launchBlockRes.value !== undefined) {
        data.launchBlock = BigInt(launchBlockRes.value);
      }

      if (Object.keys(data).length === 0) {
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Reads ERC20 standard & custom Portal 8 metadata:
   * name(), symbol(), decimals(), totalSupply(), logo()
   */
  public async readToken(tokenAddress: string): Promise<Portal8TokenOnChainData | null> {
    if (!tokenAddress || tokenAddress === ethers.ZeroAddress) {
      return null;
    }

    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_PORTAL8_ABI, this.provider);

      const [nameRes, symbolRes, decimalsRes, supplyRes, logoRes] = await Promise.allSettled([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.totalSupply(),
        tokenContract.logo(),
      ]);

      const data: Portal8TokenOnChainData = {};

      if (nameRes.status === "fulfilled" && typeof nameRes.value === "string") {
        data.name = nameRes.value;
      }
      if (symbolRes.status === "fulfilled" && typeof symbolRes.value === "string") {
        data.symbol = symbolRes.value;
      }
      if (decimalsRes.status === "fulfilled" && decimalsRes.value !== undefined) {
        data.decimals = Number(decimalsRes.value);
      }
      if (supplyRes.status === "fulfilled" && supplyRes.value !== undefined) {
        data.totalSupply = supplyRes.value.toString();
      }
      if (logoRes.status === "fulfilled" && typeof logoRes.value === "string" && logoRes.value.trim().length > 0) {
        data.logo = logoRes.value.trim();
      }

      if (Object.keys(data).length === 0) {
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Complete on-chain hydration for a token launch.
   */
  public async hydrateLaunch(
    tokenAddress: string,
    hookAddressHint?: string
  ): Promise<Portal8HydratedData> {
    const launchDataPromise = this.readPortalLaunch(tokenAddress);
    const tokenDataPromise = this.readToken(tokenAddress);

    const [launchRes, tokenRes] = await Promise.allSettled([
      launchDataPromise,
      tokenDataPromise,
    ]);

    const launchData = launchRes.status === "fulfilled" ? launchRes.value ?? undefined : undefined;
    const tokenData = tokenRes.status === "fulfilled" ? tokenRes.value ?? undefined : undefined;

    const hookAddress = launchData?.hook || hookAddressHint;
    let hookData: Portal8HookOnChainData | undefined;

    if (hookAddress && hookAddress !== ethers.ZeroAddress) {
      const hookRes = await this.readHook(hookAddress);
      if (hookRes) {
        hookData = hookRes;
      }
    }

    return {
      launchData,
      hookData,
      tokenData,
    };
  }
}

/**
 * Isolated Creator Registry Adapter
 * Avoids guessing complex return structures while allowing clean extension.
 */
export class CreatorRegistryAdapter {
  constructor(
    private readonly provider: ethers.ContractRunner,
    private readonly registryAddress = CREATOR_REGISTRY_ADDRESS
  ) {}

  public async getPayoutOf(tokenAddress: string): Promise<string | null> {
    try {
      const registry = new ethers.Contract(this.registryAddress, CREATOR_REGISTRY_ABI, this.provider);
      const payout = await registry.payoutOf(tokenAddress);
      if (payout && payout !== ethers.ZeroAddress) {
        return safeChecksumAddress(payout);
      }
      return null;
    } catch {
      return null;
    }
  }
}
