/**
 * DexHunter × Argus Portal 8 Integration
 * Integration Boundary & Sink Handlers
 */

import { EventEmitter } from "events";
import { ArgusPortal8Launch, IPortal8LaunchSink } from "./types.js";

/**
 * Event-driven sink allowing DexHunter modules to subscribe via standard EventEmitter events:
 * - 'launch' (ArgusPortal8Launch)
 * - 'metadataUpdate' (ArgusPortal8Launch)
 * - 'error' (Error, context)
 */
export class Portal8EventSink extends EventEmitter implements IPortal8LaunchSink {
  public async onLaunch(launch: ArgusPortal8Launch): Promise<void> {
    this.emit("launch", launch);
  }

  public async onMetadataUpdate(launch: ArgusPortal8Launch): Promise<void> {
    this.emit("metadataUpdate", launch);
  }

  public async onError(error: Error, context?: Record<string, unknown>): Promise<void> {
    this.emit("error", error, context);
  }
}

/**
 * Callback-based bridge sink for direct programmatic integration with DexHunter ingestion queues.
 */
export class DexHunterBridgeSink implements IPortal8LaunchSink {
  constructor(
    private readonly onLaunchCallback: (launch: ArgusPortal8Launch) => Promise<void> | void,
    private readonly onMetadataUpdateCallback?: (launch: ArgusPortal8Launch) => Promise<void> | void,
    private readonly onErrorCallback?: (error: Error, context?: Record<string, unknown>) => Promise<void> | void
  ) {}

  public async onLaunch(launch: ArgusPortal8Launch): Promise<void> {
    await this.onLaunchCallback(launch);
  }

  public async onMetadataUpdate(launch: ArgusPortal8Launch): Promise<void> {
    if (this.onMetadataUpdateCallback) {
      await this.onMetadataUpdateCallback(launch);
    }
  }

  public async onError(error: Error, context?: Record<string, unknown>): Promise<void> {
    if (this.onErrorCallback) {
      await this.onErrorCallback(error, context);
    }
  }
}

import { portal8LaunchToDexHunterToken } from "./normalizer.js";
import type { TokenPair } from "../../types.js";

/**
 * Repository-specific pipeline adapter that bridges normalized Portal 8 launches
 * directly into DexHunter's canonical TokenPair discovery schema and ingestion pipeline.
 */
export class DexHunterDiscoverySink implements IPortal8LaunchSink {
  constructor(
    private readonly onTokenPair: (pair: TokenPair) => Promise<void> | void,
    private readonly onErrorCallback?: (error: Error, context?: Record<string, unknown>) => Promise<void> | void
  ) {}

  public async onLaunch(launch: ArgusPortal8Launch): Promise<void> {
    const pair = portal8LaunchToDexHunterToken(launch);
    await this.onTokenPair(pair);
  }

  public async onMetadataUpdate(launch: ArgusPortal8Launch): Promise<void> {
    const pair = portal8LaunchToDexHunterToken(launch);
    await this.onTokenPair(pair);
  }

  public async onError(error: Error, context?: Record<string, unknown>): Promise<void> {
    if (this.onErrorCallback) {
      await this.onErrorCallback(error, context);
    }
  }
}
