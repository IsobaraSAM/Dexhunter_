import { Connection, PublicKey } from "@solana/web3.js";
import {
  PUMP_PROGRAM_ID_STR,
  PUMP_AMM_PROGRAM_ID_STR,
  SOL_MINT_STR,
  PUMP_INITIAL_REAL_TOKEN_RESERVES,
} from "../pumpConstants";

export const PUMP_PROGRAM_ID = new PublicKey(PUMP_PROGRAM_ID_STR);
export const PUMP_AMM_PROGRAM_ID = new PublicKey(PUMP_AMM_PROGRAM_ID_STR);

export function bondingCurvePda(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("bonding-curve"), mint.toBuffer()],
    PUMP_PROGRAM_ID
  )[0];
}

export function canonicalPumpPoolPda(mint: PublicKey, index = 0): PublicKey {
  const [authority] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool-authority"), mint.toBuffer()],
    PUMP_PROGRAM_ID
  );
  const indexBuf = Buffer.alloc(2);
  indexBuf.writeUInt16LE(index, 0);
  const [pool] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("pool"),
      indexBuf,
      authority.toBuffer(),
      mint.toBuffer(),
      new PublicKey(SOL_MINT_STR).toBuffer(),
    ],
    PUMP_AMM_PROGRAM_ID
  );
  return pool;
}

export type PumpLifecycleStatus =
  | "BONDING"
  | "GRADUATED_MIGRATION_PENDING"
  | "PUMPSWAP_ACTIVE"
  | "NOT_PUMP_FUN"
  | "ERROR";

export interface PumpLifecycleResult {
  mint: string;
  status: PumpLifecycleStatus;
  bondingCurve: string | null;
  bondingCurveExists: boolean;
  bondingCurveOwner: string | null;
  complete: boolean | null;
  virtualTokenReserves: string | null;
  virtualQuoteReserves: string | null;
  realTokenReserves: string | null;
  realQuoteReserves: string | null;
  tokenTotalSupply: string | null;
  bondingProgressPct: number | null;
  pumpSwapPool: string | null;
  pumpSwapPoolVerified: boolean;
  error: string | null;
}

const RPC_ENDPOINTS = [
  process.env.SOLANA_RPC_URL,
  "https://solana-rpc.publicnode.com",
  "https://rpc.ankr.com/solana",
  "https://api.mainnet-beta.solana.com",
].filter(Boolean) as string[];

let activeRpcIndex = 0;

function getConnection(): Connection {
  const endpoint = RPC_ENDPOINTS[activeRpcIndex] || "https://solana-rpc.publicnode.com";
  return new Connection(endpoint, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 8000,
    disableRetryOnRateLimit: true,
  });
}

function rotateRpc() {
  activeRpcIndex = (activeRpcIndex + 1) % RPC_ENDPOINTS.length;
}

function isValidMint(mint: string): PublicKey | null {
  try {
    return new PublicKey(mint);
  } catch {
    return null;
  }
}

function decodeBondingCurveBuffer(buf: Buffer) {
  if (!buf || buf.length < 49) return null;
  try {
    const virtualTokenReserves = buf.readBigUInt64LE(8);
    const virtualQuoteReserves = buf.readBigUInt64LE(16);
    const realTokenReserves = buf.readBigUInt64LE(24);
    const realQuoteReserves = buf.readBigUInt64LE(32);
    const tokenTotalSupply = buf.readBigUInt64LE(40);
    const complete = buf.readUInt8(48) === 1;
    return {
      virtualTokenReserves,
      virtualQuoteReserves,
      realTokenReserves,
      realQuoteReserves,
      tokenTotalSupply,
      complete,
    };
  } catch {
    return null;
  }
}

async function getAccountInfoWithRetry(pubkey: PublicKey, maxAttempts = RPC_ENDPOINTS.length * 2) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const conn = getConnection();
      const info = await conn.getAccountInfo(pubkey);
      return info;
    } catch (err: any) {
      rotateRpc();
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 100 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  return null;
}

/**
 * Resolves the full on-chain Pump.fun lifecycle state for a single mint.
 */
export async function resolvePumpLifecycle(mintAddress: string): Promise<PumpLifecycleResult> {
  const base: PumpLifecycleResult = {
    mint: mintAddress,
    status: "ERROR",
    bondingCurve: null,
    bondingCurveExists: false,
    bondingCurveOwner: null,
    complete: null,
    virtualTokenReserves: null,
    virtualQuoteReserves: null,
    realTokenReserves: null,
    realQuoteReserves: null,
    tokenTotalSupply: null,
    bondingProgressPct: null,
    pumpSwapPool: null,
    pumpSwapPoolVerified: false,
    error: null,
  };

  const mint = isValidMint(mintAddress);
  if (!mint) {
    return { ...base, error: "Invalid Solana mint address" };
  }

  let curvePda: PublicKey;
  try {
    curvePda = bondingCurvePda(mint);
  } catch (e: any) {
    return { ...base, error: `Failed to derive bonding curve PDA: ${e?.message || e}` };
  }
  base.bondingCurve = curvePda.toBase58();

  let accountInfo;
  try {
    accountInfo = await getAccountInfoWithRetry(curvePda);
  } catch (e: any) {
    return { ...base, error: `RPC error fetching bonding curve account: ${e?.message || e}` };
  }

  if (!accountInfo) {
    return { ...base, status: "NOT_PUMP_FUN", bondingCurveExists: false };
  }

  base.bondingCurveExists = true;
  base.bondingCurveOwner = accountInfo.owner.toBase58();

  if (!accountInfo.owner.equals(PUMP_PROGRAM_ID)) {
    return {
      ...base,
      status: "NOT_PUMP_FUN",
      error: "Account at bonding curve PDA is not owned by the Pump program",
    };
  }

  const curve = decodeBondingCurveBuffer(accountInfo.data as Buffer);
  if (!curve) {
    return { ...base, error: "Bonding curve account decoded to null (unexpected layout or corrupted data)" };
  }

  base.complete = curve.complete;
  base.virtualTokenReserves = curve.virtualTokenReserves.toString();
  base.virtualQuoteReserves = curve.virtualQuoteReserves.toString();
  base.realTokenReserves = curve.realTokenReserves.toString();
  base.realQuoteReserves = curve.realQuoteReserves.toString();
  base.tokenTotalSupply = curve.tokenTotalSupply.toString();

  if (!curve.complete) {
    const initialVal = PUMP_INITIAL_REAL_TOKEN_RESERVES;
    const remainingVal = curve.realTokenReserves;
    if (remainingVal >= initialVal) {
      base.bondingProgressPct = 0;
    } else if (remainingVal <= 0n) {
      base.bondingProgressPct = 100;
    } else {
      const sold = initialVal - remainingVal;
      const progressBps = (sold * 10000n) / initialVal;
      base.bondingProgressPct = Math.min(100, Math.max(0, Number(progressBps) / 100));
    }
    return { ...base, status: "BONDING" };
  }

  let poolPda: PublicKey;
  try {
    poolPda = canonicalPumpPoolPda(mint);
  } catch (e: any) {
    return {
      ...base,
      status: "GRADUATED_MIGRATION_PENDING",
      error: `Failed to derive canonical pool PDA: ${e?.message || e}`,
    };
  }
  base.pumpSwapPool = poolPda.toBase58();

  let poolAccountInfo;
  try {
    poolAccountInfo = await getAccountInfoWithRetry(poolPda);
  } catch (e: any) {
    return {
      ...base,
      status: "GRADUATED_MIGRATION_PENDING",
      error: `RPC error checking pool account: ${e?.message || e}`,
    };
  }

  if (!poolAccountInfo) {
    return { ...base, status: "GRADUATED_MIGRATION_PENDING" };
  }

  if (!poolAccountInfo.owner.equals(PUMP_AMM_PROGRAM_ID)) {
    return {
      ...base,
      status: "GRADUATED_MIGRATION_PENDING",
      error: "Account at canonical pool address exists but is not owned by the PumpSwap program",
    };
  }

  base.pumpSwapPoolVerified = true;
  return { ...base, status: "PUMPSWAP_ACTIVE" };
}

export async function reconcilePumpLifecycles(
  mints: string[],
  concurrency = 5
): Promise<Record<string, PumpLifecycleResult>> {
  const results: Record<string, PumpLifecycleResult> = {};
  const queue = [...mints];

  async function worker() {
    while (queue.length > 0) {
      const mint = queue.shift();
      if (!mint) continue;
      results[mint] = await resolvePumpLifecycle(mint);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, mints.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}
