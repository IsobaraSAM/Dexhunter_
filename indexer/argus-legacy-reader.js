// @ts-nocheck
// Portals 1–7 still trade. They are not Portal 8: TokenCreated, not Launched,
// and each keeps its own cursor in this book. Nothing here invents a price.
import fs from "fs";
import os from "os";
import path from "path";
import { ethers } from "ethers";
import { ARC_RPC_URLS } from "./portal8-reader.js";
import { argusLaunchpadUrl } from "./venue-links.js";

const ARC_CHAIN_ID = 5042;
const ARC_NETWORK = new ethers.Network("arc", ARC_CHAIN_ID);
const BOOK_PATH = path.join(os.tmpdir(), "dexhunter", "argus-legacy-book.json");
const V4_TOPIC = "0x1d8917231579f8ce39407f0d616f36f357b07329b0ce5164d0754ac15145ce0a";
const V3_TOPIC = "0x875522b092d9e19a1de359e4bd218090d582fa521c9733889acf1a5ff1941255";

export const LEGACY_PORTALS = [
  { id: 7, address: "0xB021Be536808f551b31789422Fd28a6c9c6e97Da", family: "v4", startBlock: 20395275, topic: V4_TOPIC },
  { id: 6, address: "0xA5628A11c412596E1f63b75a2C0284F843C549d6", family: "v4", startBlock: 20240260, topic: V4_TOPIC },
  { id: 5, address: "0x07a688a001f416cC433c68Ff56Aa26bC5131Cc6E", family: "v4", startBlock: 20081606, topic: V4_TOPIC },
  { id: 4, address: "0xa36c443A797771Df82533B8B4A86F0AFfd970862", family: "v4", startBlock: 19690658, topic: V4_TOPIC },
  { id: 3, address: "0x7A17Ab0106C46C0be30623F3EB7F299CC0058338", family: "v4", startBlock: 19674154, topic: V4_TOPIC },
  { id: 2, address: "0xBed9880A0ba12722ba4b8791c0B6F8c74338246C", family: "v3", startBlock: 19056397, topic: V3_TOPIC },
  { id: 1, address: "0x0F1C7Cb26D6cD36BD4189E41947658b39437587A", family: "v3", startBlock: 18817867, topic: V3_TOPIC },
];

const v4Iface = new ethers.Interface([
  "event TokenCreated(address indexed token, address indexed creator, string name, string symbol, bytes32 poolId, string imageURI, string website, string twitter, string telegram)",
]);
const v3Iface = new ethers.Interface([
  "event TokenCreated(address indexed token, address indexed creator, string name, string symbol, address pool, string imageURI, string website, string twitter, string telegram)",
]);

function ifaceFor(portal) {
  return portal.family === "v3" ? v3Iface : v4Iface;
}

export function legacyLaunchPair(portal, args, when) {
  let token = "";
  try { token = ethers.getAddress(args.token); } catch { return null; }
  const page = argusLaunchpadUrl(token);
  const poolRaw = portal.family === "v3" ? args.pool : args.poolId;
  let poolId = "";
  try { poolId = poolRaw ? ethers.hexlify(poolRaw) : ""; } catch { poolId = ""; }
  const image = args.imageURI ? String(args.imageURI) : "";
  return {
    chainId: "arc",
    dexId: "argus",
    primaryDex: "Argus",
    primaryDexLogo: "/argus.png",
    url: page || void 0,
    primaryDexTradingUrl: page || void 0,
    pairAddress: poolId || token,
    baseToken: {
      address: token,
      name: args.name ? String(args.name) : "",
      symbol: args.symbol ? String(args.symbol) : "",
    },
    pairCreatedAt: when,
    info: {
      imageUrl: image && !image.endsWith("/argus.svg") ? image : void 0,
      websites: args.website ? [{ type: "website", url: String(args.website) }] : void 0,
      socials: [
        ...args.twitter ? [{ type: "twitter", url: String(args.twitter) }] : [],
        ...args.telegram ? [{ type: "telegram", url: String(args.telegram) }] : [],
      ],
    },
    twitter: args.twitter ? String(args.twitter) : void 0,
    telegram: args.telegram ? String(args.telegram) : void 0,
    website: args.website ? String(args.website) : void 0,
    creator: args.creator ? String(args.creator) : void 0,
    sources: ["Argus", `Portal ${portal.id}`],
    dexes: ["Argus"],
    isArgusLaunch: true,
    launchPlatform: "Argus",
    argusPortalId: portal.id,
    argusPortalFamily: portal.family,
    argusPortalAddress: portal.address,
    argusPoolId: portal.family === "v4" ? poolId || void 0 : void 0,
    discoveryMode: "onchain",
    discoveredAt: Date.now(),
  };
}

function makeProvider(url) {
  return new ethers.JsonRpcProvider(url, ARC_NETWORK, { staticNetwork: true, batchMaxCount: 1 });
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then((value) => {
      clearTimeout(timer);
      resolve(value);
    }, (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export function startLegacyArgusScan(opts) {
  const root = globalThis.process || globalThis;
  if (typeof root.__argusLegacyStop === "function") {
    try { root.__argusLegacyStop(); } catch { /* previous scan already gone */ }
  }
  const provider = makeProvider(ARC_RPC_URLS[0]);
  const launches = new Map();
  const cursors = new Map();
  for (const portal of LEGACY_PORTALS) {
    cursors.set(portal.id, { historyFloor: null, liveCursor: null });
  }
  let stopped = false;
  let ticking = false;
  let dirty = false;
  let lastSave = 0;
  let turn = 0;
  loadBook();

  const timer = setInterval(() => { void tick(); }, 1600);
  void tick();

  function stop() {
    stopped = true;
    clearInterval(timer);
    saveBook(true);
    provider.destroy?.();
    if (root.__argusLegacyStop === stop) root.__argusLegacyStop = null;
  }
  root.__argusLegacyStop = stop;

  async function tick() {
    if (stopped || ticking) return;
    ticking = true;
    try {
      const head = await withTimeout(provider.getBlockNumber(), 8000);
      const portal = LEGACY_PORTALS[turn % LEGACY_PORTALS.length];
      turn += 1;
      const cursor = cursors.get(portal.id);
      if (cursor.liveCursor == null) {
        cursor.liveCursor = head;
        cursor.historyFloor = head;
        dirty = true;
      }
      if (head > cursor.liveCursor) {
        const got = await pull(portal, cursor.liveCursor + 1, head, "forward");
        if (got != null) cursor.liveCursor = got;
      } else if (cursor.historyFloor > portal.startBlock) {
        const got = await pull(portal, portal.startBlock, cursor.historyFloor, "back");
        if (got != null) cursor.historyFloor = got - 1;
      }
      if (dirty && Date.now() - lastSave > 20000) saveBook(false);
    } catch (err) {
      console.warn("[Argus legacy] tick:", err?.shortMessage || err?.message || err);
    } finally {
      ticking = false;
    }
  }

  async function pull(portal, from, to, dir) {
    if (from > to) return to;
    const cap = portal.maxChunk || 2000;
    const span = Math.min(cap, to - from + 1);
    const start = dir === "back" ? Math.max(from, to - span + 1) : from;
    const end = dir === "back" ? to : Math.min(to, from + span - 1);
    let logs;
    try {
      logs = await withTimeout(provider.send("eth_getLogs", [{
        address: portal.address,
        topics: [portal.topic],
        fromBlock: ethers.toQuantity(start),
        toBlock: ethers.toQuantity(end),
      }]), 12000);
    } catch (err) {
      portal.maxChunk = Math.max(200, Math.floor(cap / 2));
      console.warn(`[Argus legacy] portal ${portal.id} ${start}-${end}:`, err?.shortMessage || err?.message || err);
      return null;
    }
    logs.sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber) || Number(a.logIndex) - Number(b.logIndex));
    const iface = ifaceFor(portal);
    for (const log of logs) {
      let parsed;
      try { parsed = iface.parseLog({ topics: log.topics, data: log.data }); } catch { continue; }
      if (!parsed || parsed.name !== "TokenCreated") continue;
      const raw = log.blockTimestamp != null ? Number(log.blockTimestamp) : 0;
      const when = raw ? (raw > 1e12 ? raw : raw * 1000) : Date.now();
      const pair = legacyLaunchPair(portal, parsed.args, when);
      if (!pair) continue;
      const id = `${portal.id}:${pair.baseToken.address.toLowerCase()}`;
      if (launches.has(id)) continue;
      launches.set(id, pair);
      dirty = true;
      try { opts.upsert(pair); } catch { /* consumer errors must not stop the book */ }
    }
    if (logs.length) dirty = true;
    return dir === "back" ? start : end;
  }

  function loadBook() {
    try {
      if (!fs.existsSync(BOOK_PATH)) return;
      const book = JSON.parse(fs.readFileSync(BOOK_PATH, "utf8"));
      for (const portal of LEGACY_PORTALS) {
        const saved = book.portals?.[portal.id] || book.portals?.[String(portal.id)];
        if (!saved) continue;
        cursors.set(portal.id, {
          historyFloor: Number.isFinite(saved.historyFloor) ? saved.historyFloor : null,
          liveCursor: Number.isFinite(saved.liveCursor) ? saved.liveCursor : null,
        });
      }
      for (const row of book.tokens || []) {
        if (!row?.baseToken?.address || !row.argusPortalId) continue;
        const id = `${row.argusPortalId}:${row.baseToken.address.toLowerCase()}`;
        launches.set(id, row);
        try { opts.upsert(row); } catch { /* ignore */ }
      }
      console.log(`[Argus legacy] restored ${launches.size} launches`);
    } catch (err) {
      console.warn("[Argus legacy] book load skipped:", err?.message || err);
    }
  }

  function saveBook(force) {
    if (!force && !dirty) return;
    try {
      fs.mkdirSync(path.dirname(BOOK_PATH), { recursive: true });
      const portals = {};
      for (const [id, cursor] of cursors) portals[id] = cursor;
      const tmp = `${BOOK_PATH}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify({ portals, tokens: Array.from(launches.values()) }));
      fs.renameSync(tmp, BOOK_PATH);
      dirty = false;
      lastSave = Date.now();
    } catch (err) {
      console.warn("[Argus legacy] book save skipped:", err?.message || err);
    }
  }

  return stop;
}
