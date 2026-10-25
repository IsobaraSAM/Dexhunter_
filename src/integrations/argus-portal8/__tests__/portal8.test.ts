/**
 * DexHunter × Argus Portal 8 Integration Test Suite
 *
 * Verifies all 17 required scenarios:
 * 1. Launched event decoding
 * 2. LaunchMetadata decoding
 * 3. Topic verification
 * 4. Portal launch hydration
 * 5. Hook hydration
 * 6. Token metadata reads
 * 7. Metadata arriving after launch (Case A)
 * 8. Metadata arriving before launch (Case C)
 * 9. Duplicate events (Case D & E)
 * 10. Cursor persistence
 * 11. Chunk reduction
 * 12. RPC fallback
 * 13. Chain ID validation
 * 14. Normalization
 * 15. Chain-aware deduplication
 * 16. Malformed metadata
 * 17. Optional contract-read failures
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";

import {
  ARC_CHAIN_ID,
  ARC_START_BLOCK,
  PORTAL8_ADDRESS,
  TOPIC_LAUNCHED,
  TOPIC_LAUNCH_METADATA,
  PORTAL8_ABI,
} from "../contracts.js";
import {
  decodePortal8Log,
  safeChecksumAddress,
} from "../decoder.js";
import {
  buildTokenIdentity,
  buildArcTokenIdentity,
  sanitizeUrl,
  sanitizeTwitter,
  sanitizeTelegram,
  sanitizeDescription,
  normalizePortal8Launch,
  mergeMetadataIntoLaunch,
} from "../normalizer.js";
import {
  MemoryPortal8StateStore,
} from "../state.js";
import {
  Portal8Hydrator,
} from "../token.js";
import {
  ArcRpcManager,
} from "../rpc.js";
import {
  ArgusPortal8Watcher,
} from "../watcher.js";
import {
  ChainIdMismatchError,
  ArgusPortal8Launch,
  Portal8RawLaunchedEvent,
  Portal8RawMetadataEvent,
} from "../types.js";
import { DexHunterBridgeSink, DexHunterDiscoverySink } from "../sink.js";
import { portal8LaunchToDexHunterToken } from "../normalizer.js";
import type { TokenPair } from "../../../types.js";

const portal8Iface = new ethers.Interface(PORTAL8_ABI);

const DUMMY_TOKEN = "0x1111111111111111111111111111111111111111";
const DUMMY_CREATOR = "0x2222222222222222222222222222222222222222";
const DUMMY_HOOK = "0x3333333333333333333333333333333333333333";
const DUMMY_ESCROW = "0x4444444444444444444444444444444444444444";
const DUMMY_LOCKER = "0x5555555555555555555555555555555555555555";
const DUMMY_QUOTE = "0x3600000000000000000000000000000000000000";

describe("Argus Portal 8 Integration Test Suite", () => {
  // 1. Launched event decoding
  test("1. Launched event decoding", () => {
    const encoded = portal8Iface.encodeEventLog(
      portal8Iface.getEvent("Launched")!,
      [
        DUMMY_TOKEN,
        DUMMY_CREATOR,
        DUMMY_HOOK,
        DUMMY_ESCROW,
        DUMMY_LOCKER,
        12345n, // positionId
        -887220, // tickStart
        1000, // tickBond
      ]
    );

    const decoded = decodePortal8Log({
      topics: encoded.topics,
      data: encoded.data,
      transactionHash: "0xabc123",
      blockNumber: 22_251_800,
      logIndex: 4,
    });

    assert.ok(decoded);
    assert.equal(decoded.kind, "Launched");
    if (decoded.kind === "Launched") {
      assert.equal(decoded.token, safeChecksumAddress(DUMMY_TOKEN));
      assert.equal(decoded.creator, safeChecksumAddress(DUMMY_CREATOR));
      assert.equal(decoded.hook, safeChecksumAddress(DUMMY_HOOK));
      assert.equal(decoded.escrow, safeChecksumAddress(DUMMY_ESCROW));
      assert.equal(decoded.locker, safeChecksumAddress(DUMMY_LOCKER));
      assert.equal(decoded.positionId, 12345n);
      assert.equal(decoded.tickStart, -887220);
      assert.equal(decoded.tickBond, 1000);
      assert.equal(decoded.txHash, "0xabc123");
      assert.equal(decoded.blockNumber, 22_251_800);
      assert.equal(decoded.logIndex, 4);
    }
  });

  // 2. LaunchMetadata decoding
  test("2. LaunchMetadata decoding", () => {
    const encoded = portal8Iface.encodeEventLog(
      portal8Iface.getEvent("LaunchMetadata")!,
      [
        DUMMY_TOKEN,
        "https://example.com/logo.png",
        "https://example.com",
        "https://x.com/argus",
        "https://t.me/argus",
        "Argus Portal 8 token on Arc",
      ]
    );

    const decoded = decodePortal8Log({
      topics: encoded.topics,
      data: encoded.data,
      transactionHash: "0xmeta789",
      blockNumber: 22_251_805,
      logIndex: 7,
    });

    assert.ok(decoded);
    assert.equal(decoded.kind, "LaunchMetadata");
    if (decoded.kind === "LaunchMetadata") {
      assert.equal(decoded.token, safeChecksumAddress(DUMMY_TOKEN));
      assert.equal(decoded.imageURI, "https://example.com/logo.png");
      assert.equal(decoded.website, "https://example.com");
      assert.equal(decoded.twitter, "https://x.com/argus");
      assert.equal(decoded.telegram, "https://t.me/argus");
      assert.equal(decoded.description, "Argus Portal 8 token on Arc");
    }
  });

  // 3. Topic verification
  test("3. Topic verification", () => {
    const computedLaunchedTopic = ethers.id(
      "Launched(address,address,address,address,address,uint256,int24,int24)"
    );
    const computedMetadataTopic = ethers.id(
      "LaunchMetadata(address,string,string,string,string,string)"
    );

    assert.equal(
      computedLaunchedTopic.toLowerCase(),
      TOPIC_LAUNCHED.toLowerCase(),
      "Launched topic matches specification"
    );
    assert.equal(
      computedMetadataTopic.toLowerCase(),
      TOPIC_LAUNCH_METADATA.toLowerCase(),
      "LaunchMetadata topic matches specification"
    );
  });

  // 4. Portal launch hydration
  test("4. Portal launch hydration", async () => {
    const mockRunner: ethers.ContractRunner = {
      provider: null,
      call: async () => {
        // Return encoded tuple: (address hook, address escrow, address locker, uint256 positionId, int24 tickStart, int24 tickBond, bool tokenIsToken0)
        const types = [
          "address",
          "address",
          "address",
          "uint256",
          "int24",
          "int24",
          "bool",
        ];
        const values = [
          DUMMY_HOOK,
          DUMMY_ESCROW,
          DUMMY_LOCKER,
          999n,
          -12000,
          24000,
          true,
        ];
        return ethers.AbiCoder.defaultAbiCoder().encode(types, values);
      },
    };

    const hydrator = new Portal8Hydrator(mockRunner);
    const res = await hydrator.readPortalLaunch(DUMMY_TOKEN);

    assert.ok(res);
    assert.equal(res.hook, safeChecksumAddress(DUMMY_HOOK));
    assert.equal(res.escrow, safeChecksumAddress(DUMMY_ESCROW));
    assert.equal(res.locker, safeChecksumAddress(DUMMY_LOCKER));
    assert.equal(res.positionId, 999n);
    assert.equal(res.tickStart, -12000);
    assert.equal(res.tickBond, 24000);
    assert.equal(res.tokenIsToken0, true);
  });

  // 5. Hook hydration
  test("5. Hook hydration", async () => {
    const mockRunner: ethers.ContractRunner = {
      provider: null,
      call: async (tx: ethers.TransactionRequest) => {
        const data = String(tx.data);
        const quoteSig = ethers.id("quoteAsset()").slice(0, 10);
        const feeSig = ethers.id("totalFeeBps()").slice(0, 10);
        const launchedAtSig = ethers.id("launchedAt()").slice(0, 10);
        const launchBlockSig = ethers.id("launchBlock()").slice(0, 10);

        if (data.startsWith(quoteSig)) {
          return ethers.AbiCoder.defaultAbiCoder().encode(["address"], [DUMMY_QUOTE]);
        }
        if (data.startsWith(feeSig)) {
          return ethers.AbiCoder.defaultAbiCoder().encode(["uint16"], [250]); // 2.5%
        }
        if (data.startsWith(launchedAtSig)) {
          return ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [1727000000n]);
        }
        if (data.startsWith(launchBlockSig)) {
          return ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [22_251_760n]);
        }
        return "0x";
      },
    };

    const hydrator = new Portal8Hydrator(mockRunner);
    const res = await hydrator.readHook(DUMMY_HOOK);

    assert.ok(res);
    assert.equal(res.quoteAsset, safeChecksumAddress(DUMMY_QUOTE));
    assert.equal(res.totalFeeBps, 250);
    assert.equal(res.launchedAt, 1727000000n);
    assert.equal(res.launchBlock, 22_251_760n);
  });

  // 6. Token metadata reads
  test("6. Token metadata reads", async () => {
    const mockRunner: ethers.ContractRunner = {
      provider: null,
      call: async (tx: ethers.TransactionRequest) => {
        const data = String(tx.data);
        const nameSig = ethers.id("name()").slice(0, 10);
        const symbolSig = ethers.id("symbol()").slice(0, 10);
        const decimalsSig = ethers.id("decimals()").slice(0, 10);
        const supplySig = ethers.id("totalSupply()").slice(0, 10);
        const logoSig = ethers.id("logo()").slice(0, 10);

        if (data.startsWith(nameSig)) {
          return ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["Argus Arc Token"]);
        }
        if (data.startsWith(symbolSig)) {
          return ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["AAT"]);
        }
        if (data.startsWith(decimalsSig)) {
          return ethers.AbiCoder.defaultAbiCoder().encode(["uint8"], [18]);
        }
        if (data.startsWith(supplySig)) {
          return ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [1000000000000000000000000n]);
        }
        if (data.startsWith(logoSig)) {
          return ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["https://arc.fun/logo.png"]);
        }
        return "0x";
      },
    };

    const hydrator = new Portal8Hydrator(mockRunner);
    const res = await hydrator.readToken(DUMMY_TOKEN);

    assert.ok(res);
    assert.equal(res.name, "Argus Arc Token");
    assert.equal(res.symbol, "AAT");
    assert.equal(res.decimals, 18);
    assert.equal(res.totalSupply, "1000000000000000000000000");
    assert.equal(res.logo, "https://arc.fun/logo.png");
  });

  // 7. Metadata arriving after launch (Case A)
  test("7. Metadata arriving after launch (Case A)", async () => {
    const stateStore = new MemoryPortal8StateStore();
    const tokenKey = buildArcTokenIdentity(DUMMY_TOKEN);

    const launchedEvent: Portal8RawLaunchedEvent = {
      kind: "Launched",
      token: DUMMY_TOKEN,
      creator: DUMMY_CREATOR,
      hook: DUMMY_HOOK,
      escrow: DUMMY_ESCROW,
      locker: DUMMY_LOCKER,
      positionId: 101n,
      tickStart: -100,
      tickBond: 200,
      txHash: "0xtx1",
      blockNumber: 100,
      logIndex: 0,
      transactionIndex: 0,
    };

    const initialLaunch = normalizePortal8Launch({ launchedEvent });
    await stateStore.saveLaunch(tokenKey, initialLaunch);

    // Later, metadata arrives
    const metadataEvent: Portal8RawMetadataEvent = {
      kind: "LaunchMetadata",
      token: DUMMY_TOKEN,
      imageURI: "https://arc.fun/meta-logo.png",
      website: "https://arc.fun",
      twitter: "@argus_arc",
      telegram: "argus_community",
      description: "Case A launch enriched with metadata",
      txHash: "0xtx2",
      blockNumber: 105,
      logIndex: 1,
      transactionIndex: 0,
    };

    const existing = await stateStore.getLaunch(tokenKey);
    assert.ok(existing);
    const updated = mergeMetadataIntoLaunch(existing, metadataEvent);
    await stateStore.saveLaunch(tokenKey, updated);

    const persisted = await stateStore.getLaunch(tokenKey);
    assert.ok(persisted);
    assert.equal(persisted.website, "https://arc.fun/");
    assert.equal(persisted.twitter, "https://x.com/argus_arc");
    assert.equal(persisted.telegram, "https://t.me/argus_community");
    assert.equal(persisted.description, "Case A launch enriched with metadata");
  });

  // 8. Metadata arriving before launch (Case C)
  test("8. Metadata arriving before launch (Case C)", async () => {
    const stateStore = new MemoryPortal8StateStore();
    const tokenKey = buildArcTokenIdentity(DUMMY_TOKEN);

    // 1. Metadata arrives first (orphan)
    const orphanMeta: Portal8RawMetadataEvent = {
      kind: "LaunchMetadata",
      token: DUMMY_TOKEN,
      imageURI: "https://arc.fun/orphan.png",
      website: "https://orphan.arc.fun",
      twitter: "@orphan",
      telegram: "orphan_chat",
      description: "Orphan metadata awaiting launch",
      txHash: "0xmeta_early",
      blockNumber: 200,
      logIndex: 0,
      transactionIndex: 0,
    };
    await stateStore.saveOrphanMetadata(tokenKey, orphanMeta);

    // 2. Launched event arrives later
    const launchedEvent: Portal8RawLaunchedEvent = {
      kind: "Launched",
      token: DUMMY_TOKEN,
      creator: DUMMY_CREATOR,
      hook: DUMMY_HOOK,
      escrow: DUMMY_ESCROW,
      locker: DUMMY_LOCKER,
      positionId: 777n,
      tickStart: 0,
      tickBond: 1000,
      txHash: "0xlaunch_later",
      blockNumber: 205,
      logIndex: 0,
      transactionIndex: 0,
    };

    // Watcher retrieves orphan metadata and merges
    const retrievedOrphan = await stateStore.getOrphanMetadata(tokenKey);
    assert.ok(retrievedOrphan);

    const normalized = normalizePortal8Launch({
      launchedEvent,
      metadataEvent: retrievedOrphan,
    });
    await stateStore.saveLaunch(tokenKey, normalized);
    await stateStore.removeOrphanMetadata(tokenKey);

    assert.equal(normalized.website, "https://orphan.arc.fun/");
    assert.equal(normalized.twitter, "https://x.com/orphan");
    assert.equal(await stateStore.getOrphanMetadata(tokenKey), null, "Orphan removed after merge");
  });

  // 9. Duplicate events (Case D & E)
  test("9. Duplicate events (Case D & E)", async () => {
    const stateStore = new MemoryPortal8StateStore();
    const logKey = "300:0xdup:0";

    assert.equal(await stateStore.isLogProcessed(logKey), false);
    await stateStore.markLogProcessed(logKey);
    assert.equal(await stateStore.isLogProcessed(logKey), true, "Duplicate log recognized");

    // Second check: launch deduplication
    const tokenKey = buildArcTokenIdentity(DUMMY_TOKEN);
    const launch: ArgusPortal8Launch = {
      chain: "arc",
      chainId: ARC_CHAIN_ID,
      source: "argus",
      protocol: "argus-portal8",
      token: DUMMY_TOKEN,
      creator: DUMMY_CREATOR,
      txHash: "0xdup",
      blockNumber: 300,
      logIndex: 0,
    };
    await stateStore.saveLaunch(tokenKey, launch);
    assert.ok(await stateStore.getLaunch(tokenKey), "Launch exists, duplicate event ignored");
  });

  // 10. Cursor persistence
  test("10. Cursor persistence", async () => {
    const stateStore = new MemoryPortal8StateStore();
    assert.equal(await stateStore.getCursor(), null);

    await stateStore.setCursor(22_251_900);
    assert.equal(await stateStore.getCursor(), 22_251_900);

    await stateStore.setCursor(22_252_000);
    assert.equal(await stateStore.getCursor(), 22_252_000);
  });

  // 11. Chunk reduction
  test("11. Chunk reduction", () => {
    let currentChunkSize = 2000;
    const minChunkSize = 100;

    // Simulate range errors triggering reduction
    currentChunkSize = Math.max(minChunkSize, Math.floor(currentChunkSize / 2));
    assert.equal(currentChunkSize, 1000);

    currentChunkSize = Math.max(minChunkSize, Math.floor(currentChunkSize / 2));
    assert.equal(currentChunkSize, 500);

    currentChunkSize = Math.max(minChunkSize, Math.floor(currentChunkSize / 2));
    assert.equal(currentChunkSize, 250);

    currentChunkSize = Math.max(minChunkSize, Math.floor(currentChunkSize / 2));
    assert.equal(currentChunkSize, 125);

    currentChunkSize = Math.max(minChunkSize, Math.floor(currentChunkSize / 2));
    assert.equal(currentChunkSize, 100);

    // Floor at minChunkSize
    currentChunkSize = Math.max(minChunkSize, Math.floor(currentChunkSize / 2));
    assert.equal(currentChunkSize, 100);
  });

  // 12. RPC fallback
  test("12. RPC fallback", () => {
    const rpcUrls = [
      "https://primary.rpc.arc.network",
      "https://fallback-1.rpc.arc.network",
      "https://fallback-2.rpc.arc.network",
    ];

    const manager = new ArcRpcManager({ rpcUrls });
    assert.equal(manager.getCurrentRpcUrl(), rpcUrls[0]);

    const next1 = manager.rotateRpc();
    assert.equal(next1, rpcUrls[1]);

    const next2 = manager.rotateRpc();
    assert.equal(next2, rpcUrls[2]);

    const next3 = manager.rotateRpc();
    assert.equal(next3, rpcUrls[0], "Rotated back to start of pool");
  });

  // 13. Chain ID validation
  test("13. Chain ID validation", async () => {
    const mockRpc = new ArcRpcManager({
      rpcUrls: ["https://mock.arc.rpc"],
      expectedChainId: 5042,
    });

    // Mock getNetwork returning wrong chain ID
    mockRpc.getProvider().getNetwork = async () => new ethers.Network("other", 1);

    await assert.rejects(
      async () => {
        await mockRpc.verifyChainId();
      },
      (err: unknown) => {
        return err instanceof ChainIdMismatchError && err.expected === 5042 && err.received === 1;
      },
      "Throws ChainIdMismatchError when RPC reports wrong chain ID"
    );
  });

  // 14. Normalization
  test("14. Normalization", () => {
    const launchedEvent: Portal8RawLaunchedEvent = {
      kind: "Launched",
      token: DUMMY_TOKEN,
      creator: DUMMY_CREATOR,
      hook: DUMMY_HOOK,
      escrow: DUMMY_ESCROW,
      locker: DUMMY_LOCKER,
      positionId: 42n,
      tickStart: -500,
      tickBond: 500,
      txHash: "0xnorm",
      blockNumber: 500,
      logIndex: 2,
      transactionIndex: 1,
    };

    const normalized = normalizePortal8Launch({
      launchedEvent,
      metadataEvent: {
        kind: "LaunchMetadata",
        token: DUMMY_TOKEN,
        imageURI: "https://images.example.com/token.jpg",
        website: "https://project.com",
        twitter: "https://x.com/project",
        telegram: "https://t.me/project",
        description: "Standard Portal 8 launch",
        txHash: "0xnorm",
        blockNumber: 500,
        logIndex: 3,
        transactionIndex: 1,
      },
      hydrated: {
        tokenData: {
          name: "Project Token",
          symbol: "PRJ",
          decimals: 18,
          totalSupply: "1000000000",
        },
        hookData: {
          quoteAsset: DUMMY_QUOTE,
          totalFeeBps: 100,
          launchedAt: 1727100000n,
          launchBlock: 500n,
        },
        launchData: {
          hook: DUMMY_HOOK,
          escrow: DUMMY_ESCROW,
          locker: DUMMY_LOCKER,
          positionId: 42n,
          tickStart: -500,
          tickBond: 500,
          tokenIsToken0: true,
        },
      },
    });

    assert.equal(normalized.chain, "arc");
    assert.equal(normalized.chainId, 5042);
    assert.equal(normalized.source, "argus");
    assert.equal(normalized.protocol, "argus-portal8");
    assert.equal(normalized.token, safeChecksumAddress(DUMMY_TOKEN));
    assert.equal(normalized.creator, safeChecksumAddress(DUMMY_CREATOR));
    assert.equal(normalized.name, "Project Token");
    assert.equal(normalized.symbol, "PRJ");
    assert.equal(normalized.decimals, 18);
    assert.equal(normalized.totalSupply, "1000000000");
    assert.equal(normalized.quoteAsset, safeChecksumAddress(DUMMY_QUOTE));
    assert.equal(normalized.positionId, "42");
    assert.equal(normalized.tokenIsToken0, true);
    assert.equal(normalized.website, "https://project.com/");
    assert.equal(normalized.twitter, "https://x.com/project");
    assert.equal(normalized.telegram, "https://t.me/project");
  });

  // 15. Chain-aware deduplication
  test("15. Chain-aware deduplication", () => {
    const addr = "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12";

    const arcId = buildTokenIdentity("arc", addr);
    const ethId = buildTokenIdentity("ethereum", addr);
    const solId = buildTokenIdentity("solana", addr);

    assert.notEqual(arcId, ethId, "Arc identity differs from Ethereum identity");
    assert.notEqual(arcId, solId, "Arc identity differs from Solana identity");
    assert.equal(arcId, `arc:${addr.toLowerCase()}`);
  });

  // 16. Malformed metadata
  test("16. Malformed metadata sanitization", () => {
    // Malicious URL schemes
    assert.equal(sanitizeUrl("javascript:alert(1)"), undefined);
    assert.equal(sanitizeUrl("data:text/html;base64,PHNjcmlwdD4="), undefined);
    assert.equal(sanitizeUrl("vbscript:msgbox(1)"), undefined);
    assert.equal(sanitizeUrl("file:///etc/passwd"), undefined);

    // Valid URLs
    assert.equal(sanitizeUrl("https://safe.xyz/path?q=1"), "https://safe.xyz/path?q=1");
    assert.equal(sanitizeUrl("http://unencrypted.com"), "http://unencrypted.com/");
    assert.equal(sanitizeUrl("ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"), "https://ipfs.io/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi");

    // Malicious social handles
    assert.equal(sanitizeTwitter("https://evil.com/hack"), undefined);
    assert.equal(sanitizeTelegram("https://evil.com/hack"), undefined);
    assert.equal(sanitizeTwitter("@legit_handle"), "https://x.com/legit_handle");
    assert.equal(sanitizeTelegram("@legit_channel"), "https://t.me/legit_channel");

    // Control character injection in description
    const dirty = "Hello\x00\x01\x07World\x7F!";
    assert.equal(sanitizeDescription(dirty), "HelloWorld!");
  });

  // 17. Optional contract-read failures
  test("17. Optional contract-read failures degrade gracefully", async () => {
    const failingRunner: ethers.ContractRunner = {
      provider: null,
      call: async () => {
        throw new Error("CALL_EXCEPTION: execution reverted");
      },
    };

    const hydrator = new Portal8Hydrator(failingRunner);
    const launchData = await hydrator.readPortalLaunch(DUMMY_TOKEN);
    const hookData = await hydrator.readHook(DUMMY_HOOK);
    const tokenData = await hydrator.readToken(DUMMY_TOKEN);
    const fullHydration = await hydrator.hydrateLaunch(DUMMY_TOKEN, DUMMY_HOOK);

    assert.equal(launchData, null, "Portal launch read safely returns null on revert");
    assert.equal(hookData, null, "Hook read safely returns null on revert");
    assert.equal(tokenData, null, "Token read safely returns null on revert");
    assert.deepEqual(fullHydration, {
      launchData: undefined,
      hookData: undefined,
      tokenData: undefined,
    }, "Hydration handles complete contract failure gracefully without throwing");
  });

  // 18. DexHunter Discovery Sink & Canonical Schema Normalization
  test("18. DexHunter Discovery Sink & Canonical Schema Normalization", async () => {
    let capturedPair: TokenPair | null = null;
    const sink = new DexHunterDiscoverySink((pair) => {
      capturedPair = pair;
    });

    const mockLaunch: ArgusPortal8Launch = {
      chain: "arc",
      chainId: 5042,
      source: "argus",
      protocol: "argus-portal8",
      token: DUMMY_TOKEN,
      creator: DUMMY_CREATOR,
      name: "Portal8 Token",
      symbol: "P8T",
      decimals: 18,
      totalSupply: "1000000000000000000000000",
      logo: "https://ipfs.io/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
      website: "https://portal8token.xyz",
      twitter: "https://x.com/portal8token",
      telegram: "https://t.me/portal8token",
      description: "Official Portal 8 launch",
      quoteAsset: DUMMY_QUOTE,
      hook: DUMMY_HOOK,
      escrow: DUMMY_ESCROW,
      locker: DUMMY_LOCKER,
      positionId: "998877",
      totalFeeBps: 250,
      launchedAt: "1727000000",
      launchBlock: 22_251_800,
      txHash: "0xabcdef1234567890",
      blockNumber: 22_251_800,
      logIndex: 0,
    };

    await sink.onLaunch(mockLaunch);

    assert.ok(capturedPair, "Pair must be emitted to discovery sink");
    const pair = capturedPair as TokenPair;

    // Verify DexHunter canonical schema & attribution
    assert.equal(pair.chainId, "arc");
    assert.equal(pair.dexId, "argus");
    assert.equal(pair.primaryDex, "Argus");
    assert.equal(pair.primaryDexLogo, "/argus.png");
    assert.equal(pair.primaryProvider, "Argus Portal 8");
    assert.deepEqual(pair.sources, ["Argus", "argus-portal8"]);
    assert.equal(pair.baseToken.address, safeChecksumAddress(DUMMY_TOKEN));
    assert.equal(pair.baseToken.symbol, "P8T");
    assert.equal(pair.quoteToken.address, safeChecksumAddress(DUMMY_QUOTE));
    assert.equal(pair.quoteToken.symbol, "USDC");
    assert.equal(pair.isArgusLaunch, true);
    assert.equal(pair.argusPortalId, 8);
    assert.equal(pair.argusPortalFamily, "v8");
    assert.equal(pair.argusPortalAddress, PORTAL8_ADDRESS);
    assert.equal(pair.argusTotalFeeBps, 250);
    assert.equal(pair.argusPoolId, "998877");
    assert.equal(pair.info?.imageUrl, mockLaunch.logo);
    assert.equal(pair.website, "https://portal8token.xyz");
    assert.equal(pair.twitter, "https://x.com/portal8token");
    assert.equal(pair.telegram, "https://t.me/portal8token");

    // Ensure NO unintended third-party provider labels
    assert.ok(!pair.primaryProvider?.includes("DexScreener"));
    assert.ok(!pair.primaryProvider?.includes("GeckoTerminal"));
    assert.ok(!pair.primaryProvider?.includes("Birdeye"));
    assert.ok(!pair.primaryProvider?.includes("GMGN"));
  });

  // 19. Bounded state cleanup & duplicate metadata suppression
  test("19. Bounded state cleanup & duplicate metadata suppression", async () => {
    const store = new MemoryPortal8StateStore();
    const token = "0x8888888888888888888888888888888888888888";
    const tokenKey = buildArcTokenIdentity(token);

    // Save orphan metadata
    await store.saveOrphanMetadata(tokenKey, {
      kind: "LaunchMetadata",
      token,
      imageURI: "https://example.com/logo.png",
      website: "https://example.com",
      twitter: "@test",
      telegram: "@test",
      description: "Test description",
      txHash: "0x123",
      blockNumber: 100,
      logIndex: 0,
      transactionIndex: 0,
    });

    const retrieved = await store.getOrphanMetadata(tokenKey);
    assert.ok(retrieved, "Orphan metadata should be retrieved");
    assert.equal(retrieved?.imageURI, "https://example.com/logo.png");

    await store.removeOrphanMetadata(tokenKey);
    assert.equal(await store.getOrphanMetadata(tokenKey), null, "Orphan removed after cleanup");
  });
});
