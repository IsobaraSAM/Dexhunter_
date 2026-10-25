// @ts-nocheck
// What each chain's rows actually are. Search is not a launchpad subscription.
export const CHAIN_COVERAGE = {
  solana: {
    mode: "partial",
    reader: "Pump.fun mint-authority creates are read on-chain. Raydium, Meteora, Orca, and other Solana rows are DexScreener search.",
  },
  arc: {
    mode: "onchain",
    reader: "Argus portal logs on Arc chain 5042. Price and volume are best-effort pool reads and are omitted when the RPC call fails.",
  },
  ethereum: { mode: "search", reader: "DexScreener search. No factory subscription." },
  base: { mode: "search", reader: "DexScreener search. No factory subscription." },
  bsc: {
    mode: "partial",
    reader: "Four.meme V1, Four.meme V2, and OpenFour are read from BNB Chain logs. The factory deployment block is unverified because public RPCs reject archive state, so the first scan backfills a recent window and then follows the cursor. Other BSC rows are still DexScreener search. Price is quote × supply only for BNB, WBNB, USDT, and USDC.",
  },
  arbitrum: { mode: "search", reader: "DexScreener search. No factory subscription." },
  polygon: { mode: "search", reader: "DexScreener search. No factory subscription." },
  avalanche: { mode: "search", reader: "DexScreener search. No factory subscription." },
  cronos: { mode: "search", reader: "DexScreener search. No factory subscription." },
  hyperevm: { mode: "search", reader: "DexScreener search. No factory subscription." },
  optimism: { mode: "search", reader: "DexScreener search. No factory subscription." },
  robinhood: {
    mode: "partial",
    reader: "Pons V2 factory 0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e is read on-chain via TokenLaunched. Other Robinhood rows are still DexScreener search.",
  },
};
