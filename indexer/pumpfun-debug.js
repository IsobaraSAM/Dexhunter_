// @ts-nocheck
import { Connection } from "@solana/web3.js";
import { resolvePumpLifecycle, PUMP_PROGRAM_ID } from "../src/lib/providers/pumpLifecycle.js";
async function handler(req, res) {
  const mint = req.query?.mint;
  if (!mint || !mint.trim()) {
    return res.status(400).json({ error: "Missing required mint query parameter" });
  }
  try {
    const result = await resolvePumpLifecycle(mint.trim());
    let lastCheckedSlot = null;
    try {
      const rpcUrl = process.env.SOLANA_RPC_URL || "https://solana-rpc.publicnode.com";
      const connection = new Connection(rpcUrl, {
        commitment: "confirmed",
        disableRetryOnRateLimit: true
      });
      lastCheckedSlot = await connection.getSlot();
    } catch {
    }
    const graduationState = result.status === "BONDING" ? "NOT_GRADUATED" : result.status === "NOT_PUMP_FUN" ? "NOT_A_PUMP_TOKEN" : "GRADUATED";
    const migrationState = result.status === "BONDING" ? "NOT_READY" : result.status === "GRADUATED_MIGRATION_PENDING" ? "MIGRATION_PENDING" : result.status === "PUMPSWAP_ACTIVE" ? "MIGRATED" : result.status === "NOT_PUMP_FUN" ? "NOT_APPLICABLE" : "UNKNOWN";
    return res.status(200).json({
      mint: result.mint,
      pumpProgram: PUMP_PROGRAM_ID.toBase58(),
      bondingCurve: result.bondingCurve,
      bondingCurveExists: result.bondingCurveExists,
      bondingCurveOwner: result.bondingCurveOwner,
      decoded: result.complete !== null,
      complete: result.complete,
      realTokenReserves: result.realTokenReserves,
      realSolReserves: result.realQuoteReserves,
      bondingProgressPct: result.bondingProgressPct,
      graduationState,
      migrationState,
      // Not populated in this pass: this resolver derives the pool address
      // directly rather than parsing a migrate transaction, so there is no
      // transaction signature to report yet. Left explicit rather than
      // invented, per the handoff's own instruction not to guess this.
      migrationSignature: null,
      pumpSwapPool: result.pumpSwapPool,
      pumpSwapPoolVerified: result.pumpSwapPoolVerified,
      finalMarketStage: result.status,
      lastCheckedSlot,
      error: result.error
    });
  } catch (error) {
    console.error("Error in /api/pumpfun-debug handler:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
export {
  handler as default
};
