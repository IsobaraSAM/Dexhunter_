/**
 * DexHunter × Argus Portal 8 Integration
 * Production Polling Watcher with Restart Recovery, State Model Cases A-E,
 * Adaptive Chunk Reduction, and Guaranteed In-Order Processing
 */

import { ethers } from "ethers";
import {
  ARC_CHAIN_ID,
  ARC_START_BLOCK,
  PORTAL8_ADDRESS,
  TOPIC_LAUNCHED,
  TOPIC_LAUNCH_METADATA,
} from "./contracts.js";
import {
  ArgusPortal8Launch,
  IPortal8LaunchSink,
  IPortal8StateStore,
  Portal8WatcherConfig,
  Portal8Logger,
  DecodedPortal8Event,
} from "./types.js";
import { decodePortal8Log } from "./decoder.js";
import { Portal8Hydrator } from "./token.js";
import {
  buildArcTokenIdentity,
  normalizePortal8Launch,
  mergeMetadataIntoLaunch,
} from "./normalizer.js";
import { MemoryPortal8StateStore } from "./state.js";
import { ArcRpcManager } from "./rpc.js";

const DEFAULT_LOGGER: Portal8Logger = {
  debug: () => {},
  info: (msg, ctx) => console.log(`[Portal8Watcher:INFO] ${msg}`, ctx || ""),
  warn: (msg, ctx) => console.warn(`[Portal8Watcher:WARN] ${msg}`, ctx || ""),
  error: (msg, err, ctx) => console.error(`[Portal8Watcher:ERROR] ${msg}`, err || "", ctx || ""),
};

export class ArgusPortal8Watcher {
  private readonly rpcManager: ArcRpcManager;
  private readonly stateStore: IPortal8StateStore;
  private readonly hydrator: Portal8Hydrator;
  private readonly sink: IPortal8LaunchSink;
  private readonly logger: Portal8Logger;

  private readonly expectedChainId: number;
  private readonly startBlock: number;
  private readonly confirmations: number;
  private readonly pollIntervalMs: number;
  private readonly maxChunkSize: number;
  private readonly minChunkSize: number;

  private currentChunkSize: number;
  private isRunning = false;
  private isPolling = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private pollPromise: Promise<void> | null = null;
  private lastLiveTipBlock: number | null = null;
  private initialLiveTipBlock: number | null = null;

  constructor(params: {
    config: Portal8WatcherConfig;
    sink: IPortal8LaunchSink;
    stateStore?: IPortal8StateStore;
    rpcManager?: ArcRpcManager;
    hydrator?: Portal8Hydrator;
  }) {
    const { config, sink } = params;
    this.sink = sink;
    this.logger = config.logger || DEFAULT_LOGGER;

    this.expectedChainId = config.chainId ?? ARC_CHAIN_ID;
    this.startBlock = config.startBlock ?? ARC_START_BLOCK;
    this.confirmations = Math.max(0, config.confirmations ?? 1);
    this.pollIntervalMs = Math.max(200, config.pollIntervalMs ?? 2000);
    this.maxChunkSize = Math.max(10, config.maxChunkSize ?? 2000);
    this.minChunkSize = Math.max(1, config.minChunkSize ?? 100);
    this.currentChunkSize = this.maxChunkSize;

    this.rpcManager =
      params.rpcManager ||
      new ArcRpcManager({
        rpcUrls: config.rpcUrls,
        expectedChainId: this.expectedChainId,
        maxRetries: config.maxRetries ?? 3,
        retryDelayMs: config.retryDelayMs ?? 500,
        logger: this.logger,
      });

    this.hydrator = params.hydrator || new Portal8Hydrator(this.rpcManager.getProvider());
    this.stateStore = params.stateStore || new MemoryPortal8StateStore();
  }

  /**
   * Initializes and starts the watcher loop.
   */
  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    this.logger.info("Starting Argus Portal 8 Watcher on Arc", {
      chainId: this.expectedChainId,
      startBlock: this.startBlock,
      maxChunkSize: this.maxChunkSize,
    });

    // 1. Verify chain ID
    await this.rpcManager.verifyChainId();

    // 2. Initialize or recover cursor
    let cursor = await this.stateStore.getCursor();
    if (cursor === null || cursor < this.startBlock) {
      cursor = this.startBlock - 1;
      await this.stateStore.setCursor(cursor);
      this.logger.info("Initialized cursor to start block", { cursor });
    } else {
      this.logger.info("Recovered persistent cursor from state store", { cursor });
    }

    try {
      const head = await this.rpcManager.getBlockNumber();
      const confirmedHead = Math.max(0, head - this.confirmations);
      this.lastLiveTipBlock = Math.max(cursor, confirmedHead - 200);
      this.initialLiveTipBlock = this.lastLiveTipBlock;
      this.logger.info("Tip watcher initialized", {
        liveTipStart: this.lastLiveTipBlock,
        confirmedHead,
      });
    } catch {
      // Non-fatal if offline/mock in test
    }

    // 3. Begin polling loop
    this.scheduleNextPoll(0);
  }

  /**
   * Stops the watcher gracefully, awaiting current in-flight polling pass.
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.pollPromise) {
      await this.pollPromise;
    }

    this.logger.info("Argus Portal 8 Watcher stopped successfully");
  }

  private scheduleNextPoll(delayMs: number): void {
    if (!this.isRunning) return;
    this.pollTimer = setTimeout(() => {
      this.pollPromise = this.pollPass()
        .catch((err) => {
          this.logger.error("Unhandled error in watcher poll pass", err);
          this.sink.onError?.(err instanceof Error ? err : new Error(String(err)));
        })
        .finally(() => {
          this.pollPromise = null;
          if (this.isRunning) {
            this.scheduleNextPoll(this.pollIntervalMs);
          }
        });
    }, delayMs);
  }

  /**
   * Performs a single synchronization cycle.
   */
  public async pollPass(): Promise<void> {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      const head = await this.rpcManager.getBlockNumber();
      const confirmedHead = Math.max(0, head - this.confirmations);

      // Initialize live tip window if not set
      if (this.lastLiveTipBlock === null) {
        const cursor = await this.stateStore.getCursor();
        this.lastLiveTipBlock = Math.max(cursor ?? (this.startBlock - 1), confirmedHead - 200);
        this.initialLiveTipBlock = this.lastLiveTipBlock;
      }

      // STEP 1: REAL-TIME TIP STREAM (Zero-delay for newly launched tokens)
      if (confirmedHead > this.lastLiveTipBlock) {
        const liveFrom = this.lastLiveTipBlock + 1;
        const liveTo = confirmedHead;
        try {
          const liveLogs = await this.rpcManager.getLogs({
            address: PORTAL8_ADDRESS,
            topics: [[TOPIC_LAUNCHED, TOPIC_LAUNCH_METADATA]],
            fromBlock: liveFrom,
            toBlock: liveTo,
          });

          const sortedLive = [...liveLogs].sort((a, b) => {
            if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
            if (a.transactionIndex !== b.transactionIndex) return a.transactionIndex - b.transactionIndex;
            return (a.index ?? 0) - (b.index ?? 0);
          });

          for (const log of sortedLive) {
            await this.processLog(log);
          }
          this.lastLiveTipBlock = liveTo;
          this.logger.debug("Live tip stream synced", { from: liveFrom, to: liveTo, count: sortedLive.length });
        } catch (err: unknown) {
          this.logger.warn("Live tip query encountered transient error", {
            error: (err as Error)?.message || err,
            liveFrom,
            liveTo,
          });
        }
      }

      // STEP 2: HISTORICAL BACKFILL & STATE RECOVERY
      let cursor = await this.stateStore.getCursor();
      if (cursor === null) {
        cursor = this.startBlock - 1;
      }

      const backfillTarget = this.initialLiveTipBlock ?? confirmedHead;
      if (cursor >= backfillTarget) {
        if (this.lastLiveTipBlock !== null && this.lastLiveTipBlock > cursor) {
          await this.stateStore.setCursor(this.lastLiveTipBlock);
        }
        this.logger.debug("Cursor caught up to head", { cursor, confirmedHead });
        return;
      }

      const fromBlock = cursor + 1;
      const toBlock = Math.min(fromBlock + this.currentChunkSize - 1, backfillTarget);

      this.logger.debug("Processing chunk", { fromBlock, toBlock, currentChunkSize: this.currentChunkSize });

      let logs: ethers.Log[];
      try {
        logs = await this.rpcManager.getLogs({
          address: PORTAL8_ADDRESS,
          topics: [[TOPIC_LAUNCHED, TOPIC_LAUNCH_METADATA]],
          fromBlock,
          toBlock,
        });

        // Gradually restore chunk size if previously reduced
        if (this.currentChunkSize < this.maxChunkSize) {
          this.currentChunkSize = Math.min(this.maxChunkSize, Math.floor(this.currentChunkSize * 1.5));
        }
      } catch (err: unknown) {
        const errMsg = (err as Error)?.message || String(err);
        if (this.rpcManager.isLogRangeError(errMsg)) {
          // Adaptive chunk reduction
          const nextSize = Math.max(this.minChunkSize, Math.floor(this.currentChunkSize / 2));
          this.logger.warn(`Log query exceeded RPC limit. Reducing chunk from ${this.currentChunkSize} to ${nextSize}`);
          this.currentChunkSize = nextSize;
          // Do NOT advance cursor; retry next tick with smaller chunk
          return;
        }
        throw err;
      }

      // Sort logs deterministically: blockNumber asc, transactionIndex asc, logIndex asc
      const sortedLogs = [...logs].sort((a, b) => {
        if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
        if (a.transactionIndex !== b.transactionIndex) return a.transactionIndex - b.transactionIndex;
        return (a.index ?? 0) - (b.index ?? 0);
      });

      // Process each log in deterministic order
      for (const log of sortedLogs) {
        await this.processLog(log);
      }

      // CRITICAL: Never advance cursor until the complete chunk has successfully processed!
      await this.stateStore.setCursor(toBlock);
      this.logger.debug("Advanced persistent cursor", { toBlock });
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Processes a single log event with deduplication and state machine handling.
   */
  public async processLog(log: ethers.Log): Promise<void> {
    const logIndex = log.index ?? 0;
    const dedupeKey = `${log.blockNumber}:${log.transactionHash}:${logIndex}`;

    // Deduplication check
    if (await this.stateStore.isLogProcessed(dedupeKey)) {
      this.logger.debug("Skipping already processed log", { dedupeKey });
      return;
    }

    let decoded: DecodedPortal8Event | null;
    try {
      decoded = decodePortal8Log({
        topics: log.topics,
        data: log.data,
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        index: log.index,
        logIndex: log.index,
        transactionIndex: log.transactionIndex,
      });
    } catch (decodeErr) {
      this.logger.warn("Malformed log encountered; skipping", { error: decodeErr, dedupeKey });
      await this.stateStore.markLogProcessed(dedupeKey);
      return;
    }

    if (!decoded) {
      await this.stateStore.markLogProcessed(dedupeKey);
      return;
    }

    const tokenKey = buildArcTokenIdentity(decoded.token);

    if (decoded.kind === "Launched") {
      // Case D check: check if already known launch
      const existingLaunch = await this.stateStore.getLaunch(tokenKey);
      if (existingLaunch) {
        this.logger.debug("Duplicate Launched event encountered for known launch", { tokenKey });
        await this.stateStore.markLogProcessed(dedupeKey);
        return;
      }

      // Hydrate on-chain state
      let hydrated = null;
      try {
        hydrated = await this.hydrator.hydrateLaunch(decoded.token, decoded.hook);
      } catch (hydrationErr) {
        this.logger.warn("Hydration failed; falling back to event payload", { tokenKey, err: hydrationErr });
      }

      // Case C check: check if orphan metadata arrived prior to Launched
      const orphanMeta = await this.stateStore.getOrphanMetadata(tokenKey);

      // Normalize launch
      const normalized = normalizePortal8Launch({
        launchedEvent: decoded,
        metadataEvent: orphanMeta,
        hydrated,
      });

      // Persist launch
      await this.stateStore.saveLaunch(tokenKey, normalized);

      // Clean up orphan if merged
      if (orphanMeta) {
        await this.stateStore.removeOrphanMetadata(tokenKey);
        this.logger.info("Resolved orphan metadata with new Launched event", { tokenKey });
      }

      // Emit to sink
      try {
        await this.sink.onLaunch(normalized);
      } catch (sinkErr) {
        this.logger.error("Sink onLaunch handler threw error", sinkErr, { tokenKey });
        this.sink.onError?.(sinkErr instanceof Error ? sinkErr : new Error(String(sinkErr)), { tokenKey });
      }
    } else if (decoded.kind === "LaunchMetadata") {
      // Check if launch already exists (Case A or Case B)
      const existingLaunch = await this.stateStore.getLaunch(tokenKey);

      if (existingLaunch) {
        // Merge metadata into existing launch
        const updated = mergeMetadataIntoLaunch(existingLaunch, decoded);
        const hasChanged =
          updated.logo !== existingLaunch.logo ||
          updated.website !== existingLaunch.website ||
          updated.twitter !== existingLaunch.twitter ||
          updated.telegram !== existingLaunch.telegram ||
          updated.description !== existingLaunch.description;

        if (!hasChanged) {
          this.logger.debug("Duplicate or identical metadata event encountered", { tokenKey });
          await this.stateStore.markLogProcessed(dedupeKey);
          return;
        }

        await this.stateStore.saveLaunch(tokenKey, updated);

        this.logger.info("Updated launch with newly arrived metadata", { tokenKey });

        try {
          if (this.sink.onMetadataUpdate) {
            await this.sink.onMetadataUpdate(updated);
          } else {
            await this.sink.onLaunch(updated);
          }
        } catch (sinkErr) {
          this.logger.error("Sink metadata handler threw error", sinkErr, { tokenKey });
          this.sink.onError?.(sinkErr instanceof Error ? sinkErr : new Error(String(sinkErr)), { tokenKey });
        }
      } else {
        // Case C: Metadata encountered before Launched -> save as orphan metadata
        await this.stateStore.saveOrphanMetadata(tokenKey, decoded);
        this.logger.info("Stored orphan LaunchMetadata pending Launched event", { tokenKey });
      }
    }

    // Mark log processed
    await this.stateStore.markLogProcessed(dedupeKey);
  }

  /**
   * Helper getters for testing and diagnostic inspection
   */
  public getCurrentChunkSize(): number {
    return this.currentChunkSize;
  }

  public setChunkSize(size: number): void {
    this.currentChunkSize = size;
  }
}
