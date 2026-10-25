/**
 * DexHunter × Argus Portal 8 Integration
 * Pure Log Event Decoder
 */

import { ethers } from "ethers";
import {
  PORTAL8_ABI,
  TOPIC_LAUNCHED,
  TOPIC_LAUNCH_METADATA,
} from "./contracts.js";
import {
  DecodedPortal8Event,
  Portal8RawLaunchedEvent,
  Portal8RawMetadataEvent,
  DecodeError,
} from "./types.js";

const portal8Interface = new ethers.Interface(PORTAL8_ABI);

export interface RawLogInput {
  topics: readonly string[];
  data: string;
  transactionHash?: string;
  blockNumber?: number | string | bigint;
  index?: number | string;
  logIndex?: number | string;
  transactionIndex?: number | string;
}

/**
 * Safely normalizes an EVM address to canonical EIP-55 checksum format.
 */
export function safeChecksumAddress(address: string): string {
  try {
    return ethers.getAddress(address.toLowerCase());
  } catch {
    return address.toLowerCase();
  }
}

/**
 * Decodes a raw EVM log into a strongly typed Portal 8 event.
 * Returns null if the log topic0 is not a recognized Portal 8 event.
 * Throws DecodeError if the log matches a Portal 8 topic but payload is corrupt.
 */
export function decodePortal8Log(log: RawLogInput): DecodedPortal8Event | null {
  if (!log.topics || log.topics.length === 0) {
    return null;
  }

  const topic0 = log.topics[0].toLowerCase();
  const txHash = log.transactionHash || "0x";
  const blockNumber = Number(log.blockNumber ?? 0);
  const logIndex = Number(log.logIndex ?? log.index ?? 0);
  const transactionIndex = Number(log.transactionIndex ?? 0);

  if (topic0 === TOPIC_LAUNCHED.toLowerCase()) {
    try {
      const parsed = portal8Interface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });

      if (!parsed) {
        throw new Error("Interface returned null parse result");
      }

      // event Launched(
      //     address indexed token,
      //     address indexed creator,
      //     address hook,
      //     address escrow,
      //     address locker,
      //     uint256 positionId,
      //     int24 tickStart,
      //     int24 tickBond
      // );
      const event: Portal8RawLaunchedEvent = {
        kind: "Launched",
        token: safeChecksumAddress(parsed.args.token ?? parsed.args[0]),
        creator: safeChecksumAddress(parsed.args.creator ?? parsed.args[1]),
        hook: safeChecksumAddress(parsed.args.hook ?? parsed.args[2]),
        escrow: safeChecksumAddress(parsed.args.escrow ?? parsed.args[3]),
        locker: safeChecksumAddress(parsed.args.locker ?? parsed.args[4]),
        positionId: BigInt(parsed.args.positionId ?? parsed.args[5]),
        tickStart: Number(parsed.args.tickStart ?? parsed.args[6]),
        tickBond: Number(parsed.args.tickBond ?? parsed.args[7]),
        txHash,
        blockNumber,
        logIndex,
        transactionIndex,
      };

      return event;
    } catch (err) {
      throw new DecodeError(
        `Failed to decode Launched event: ${(err as Error).message}`,
        log
      );
    }
  }

  if (topic0 === TOPIC_LAUNCH_METADATA.toLowerCase()) {
    try {
      const parsed = portal8Interface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });

      if (!parsed) {
        throw new Error("Interface returned null parse result");
      }

      // event LaunchMetadata(
      //     address indexed token,
      //     string imageURI,
      //     string website,
      //     string twitter,
      //     string telegram,
      //     string description
      // );
      const event: Portal8RawMetadataEvent = {
        kind: "LaunchMetadata",
        token: safeChecksumAddress(parsed.args.token ?? parsed.args[0]),
        imageURI: String(parsed.args.imageURI ?? parsed.args[1] ?? ""),
        website: String(parsed.args.website ?? parsed.args[2] ?? ""),
        twitter: String(parsed.args.twitter ?? parsed.args[3] ?? ""),
        telegram: String(parsed.args.telegram ?? parsed.args[4] ?? ""),
        description: String(parsed.args.description ?? parsed.args[5] ?? ""),
        txHash,
        blockNumber,
        logIndex,
        transactionIndex,
      };

      return event;
    } catch (err) {
      throw new DecodeError(
        `Failed to decode LaunchMetadata event: ${(err as Error).message}`,
        log
      );
    }
  }

  return null;
}
