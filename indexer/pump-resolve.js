// @ts-nocheck
import { pumpIndexer } from "./pump-engine.js";
async function handler(req, res) {
  const mint = req.query.mint || req.query.address || req.query.q;
  if (!mint || typeof mint !== "string") {
    return res.status(400).json({ error: "Missing mint address query parameter (?mint=<ADDRESS>)" });
  }
  const cleanMint = mint.trim();
  if (cleanMint.startsWith("0x") || cleanMint.length < 32 || cleanMint.length > 44) {
    return res.status(200).json({
      status: "NOT_PUMP_TOKEN",
      mint: cleanMint,
      token: null,
      error: null
    });
  }
  try {
    const token = await pumpIndexer.getOrResolveToken(mint.trim());
    if (!token) {
      return res.status(200).json({
        status: "NOT_FOUND",
        mint: mint.trim(),
        token: null,
        error: null
      });
    }
    const status = token.isGraduated ? token.pumpSwapPoolVerified ? "FOUND_PUMPSWAP_ACTIVE" : "FOUND_GRADUATED" : "FOUND_BONDING_CURVE";
    return res.status(200).json({
      status,
      mint: mint.trim(),
      token
    });
  } catch (err) {
    console.error(`[API /api/pump-resolve] Error resolving mint ${mint}:`, err);
    return res.status(500).json({
      status: "RPC_ERROR",
      mint,
      error: err.message || "Internal server error during on-chain resolution"
    });
  }
}
export {
  handler as default
};
