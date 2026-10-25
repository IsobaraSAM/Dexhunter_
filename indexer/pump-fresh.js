// @ts-nocheck
import { pumpIndexer } from "./pump-engine.js";
let backfillInFlight = null;
function runBackfillOnce() {
  if (!backfillInFlight) {
    backfillInFlight = pumpIndexer.runBackfill().finally(() => {
      backfillInFlight = null;
    });
  }
  return backfillInFlight;
}
async function handler(req, res) {
  try {
    const tokens = pumpIndexer.getAllTokens();
    if (tokens.length > 0) {
      return res.status(200).json({
        success: true,
        source: "solana-onchain-indexer",
        total: tokens.length,
        tokens
      });
    }
    await runBackfillOnce();
    const refreshedTokens = pumpIndexer.getAllTokens();
    return res.status(200).json({
      success: true,
      source: "solana-onchain-indexer",
      total: refreshedTokens.length,
      tokens: refreshedTokens
    });
  } catch (err) {
    console.error("[API /api/pump-fresh] Error fetching fresh tokens:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to retrieve fresh Pump.fun tokens",
      tokens: []
    });
  }
}
export {
  handler as default
};
