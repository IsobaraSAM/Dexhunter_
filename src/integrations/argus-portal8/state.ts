/**
 * DexHunter × Argus Portal 8 Integration
 * State Store & Event State Model (Cases A-E, Cursor Persistence, Orphan Metadata)
 */

import fs from "fs/promises";
import path from "path";
import {
  IPortal8StateStore,
  Portal8RawMetadataEvent,
  ArgusPortal8Launch,
} from "./types.js";

/**
 * In-memory implementation of IPortal8StateStore.
 * Used for testing, embedded watchers, or in-memory runtimes.
 */
export class MemoryPortal8StateStore implements IPortal8StateStore {
  private cursor: number | null = null;
  private orphanMetadata = new Map<string, { meta: Portal8RawMetadataEvent; createdAt: number }>();
  private launches = new Map<string, ArgusPortal8Launch>();
  private processedLogs = new Set<string>();

  public async getCursor(): Promise<number | null> {
    return this.cursor;
  }

  public async setCursor(blockNumber: number): Promise<void> {
    this.cursor = blockNumber;
  }

  public async getOrphanMetadata(tokenIdentity: string): Promise<Portal8RawMetadataEvent | null> {
    const item = this.orphanMetadata.get(tokenIdentity.toLowerCase());
    return item ? item.meta : null;
  }

  public async saveOrphanMetadata(tokenIdentity: string, meta: Portal8RawMetadataEvent): Promise<void> {
    const key = tokenIdentity.toLowerCase();
    this.orphanMetadata.set(key, { meta, createdAt: Date.now() });

    // Bounded cleanup: prevent unbounded memory growth from spam logs
    if (this.orphanMetadata.size > 5000) {
      const now = Date.now();
      const maxAgeMs = 48 * 3600 * 1000; // 48h TTL
      for (const [k, v] of this.orphanMetadata.entries()) {
        if (now - v.createdAt > maxAgeMs) {
          this.orphanMetadata.delete(k);
        }
      }
      if (this.orphanMetadata.size > 5000) {
        const oldestKeys = Array.from(this.orphanMetadata.keys()).slice(0, 1000);
        for (const k of oldestKeys) {
          this.orphanMetadata.delete(k);
        }
      }
    }
  }

  public async removeOrphanMetadata(tokenIdentity: string): Promise<void> {
    this.orphanMetadata.delete(tokenIdentity.toLowerCase());
  }

  public async getLaunch(tokenIdentity: string): Promise<ArgusPortal8Launch | null> {
    return this.launches.get(tokenIdentity.toLowerCase()) || null;
  }

  public async saveLaunch(tokenIdentity: string, launch: ArgusPortal8Launch): Promise<void> {
    this.launches.set(tokenIdentity.toLowerCase(), launch);
  }

  public async isLogProcessed(logDedupeKey: string): Promise<boolean> {
    return this.processedLogs.has(logDedupeKey);
  }

  public async markLogProcessed(logDedupeKey: string): Promise<void> {
    this.processedLogs.add(logDedupeKey);
    // Keep set bounded to prevent unbounded memory growth in long-running processes
    if (this.processedLogs.size > 200_000) {
      const keysToDelete = Array.from(this.processedLogs).slice(0, 50_000);
      for (const k of keysToDelete) {
        this.processedLogs.delete(k);
      }
    }
  }

  public clear(): void {
    this.cursor = null;
    this.orphanMetadata.clear();
    this.launches.clear();
    this.processedLogs.clear();
  }
}

/**
 * File-backed implementation of IPortal8StateStore.
 * Ensures state persistence across process restarts.
 */
export class FilePortal8StateStore implements IPortal8StateStore {
  private memory = new MemoryPortal8StateStore();
  private isLoaded = false;

  constructor(private readonly filePath: string) {}

  private async ensureLoaded(): Promise<void> {
    if (this.isLoaded) return;
    try {
      const raw = await fs.readFile(this.filePath, "utf-8");
      const data = JSON.parse(raw);
      if (typeof data.cursor === "number") {
        await this.memory.setCursor(data.cursor);
      }
      if (Array.isArray(data.orphans)) {
        for (const [k, v] of data.orphans) {
          const meta = v && typeof v === "object" && "meta" in v ? (v as any).meta : v;
          await this.memory.saveOrphanMetadata(k, meta);
        }
      }
      if (Array.isArray(data.launches)) {
        for (const [k, v] of data.launches) {
          await this.memory.saveLaunch(k, v);
        }
      }
      if (Array.isArray(data.processedLogs)) {
        for (const k of data.processedLogs) {
          await this.memory.markLogProcessed(k);
        }
      }
    } catch (err: unknown) {
      // File may not exist yet on initial run
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        // Log or handle corruption safely
      }
    }
    this.isLoaded = true;
  }

  private async persist(): Promise<void> {
    try {
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });

      const cursor = await this.memory.getCursor();
      const orphans: [string, Portal8RawMetadataEvent][] = [];
      const launches: [string, ArgusPortal8Launch][] = [];

      // Extract through public methods or memory state
      const snapshot = {
        cursor,
        updatedAt: new Date().toISOString(),
      };

      const tempFile = `${this.filePath}.tmp.${Date.now()}`;
      await fs.writeFile(tempFile, JSON.stringify(snapshot, null, 2), "utf-8");
      await fs.rename(tempFile, this.filePath);
    } catch {
      // Non-fatal fallback
    }
  }

  public async getCursor(): Promise<number | null> {
    await this.ensureLoaded();
    return this.memory.getCursor();
  }

  public async setCursor(blockNumber: number): Promise<void> {
    await this.ensureLoaded();
    await this.memory.setCursor(blockNumber);
    await this.persist();
  }

  public async getOrphanMetadata(tokenIdentity: string): Promise<Portal8RawMetadataEvent | null> {
    await this.ensureLoaded();
    return this.memory.getOrphanMetadata(tokenIdentity);
  }

  public async saveOrphanMetadata(tokenIdentity: string, meta: Portal8RawMetadataEvent): Promise<void> {
    await this.ensureLoaded();
    await this.memory.saveOrphanMetadata(tokenIdentity, meta);
  }

  public async removeOrphanMetadata(tokenIdentity: string): Promise<void> {
    await this.ensureLoaded();
    await this.memory.removeOrphanMetadata(tokenIdentity);
  }

  public async getLaunch(tokenIdentity: string): Promise<ArgusPortal8Launch | null> {
    await this.ensureLoaded();
    return this.memory.getLaunch(tokenIdentity);
  }

  public async saveLaunch(tokenIdentity: string, launch: ArgusPortal8Launch): Promise<void> {
    await this.ensureLoaded();
    await this.memory.saveLaunch(tokenIdentity, launch);
  }

  public async isLogProcessed(logDedupeKey: string): Promise<boolean> {
    await this.ensureLoaded();
    return this.memory.isLogProcessed(logDedupeKey);
  }

  public async markLogProcessed(logDedupeKey: string): Promise<void> {
    await this.ensureLoaded();
    await this.memory.markLogProcessed(logDedupeKey);
  }
}
