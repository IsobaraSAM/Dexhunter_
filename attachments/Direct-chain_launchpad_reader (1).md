---
name: chain-launchpad-reader
description: Build and maintain read-only EVM launchpad readers from direct HTTP JSON-RPC logs and contract state. Use for researching token-launch contracts on BNB Smart Chain or Base, decoding launch lifecycle events, or implementing resilient polling without third-party listing/indexer APIs or WebSockets.
---

# Direct-chain launchpad reader

## Mission and constraints

Research launchpads from official documentation, source repositories, and live chain evidence, then implement a read-only token-launch reader. Query the chain with HTTP JSON-RPC (`eth_chainId`, `eth_blockNumber`, `eth_getLogs`, `eth_getCode`, `eth_call`, and block reads as needed). Do not use token-listing APIs, analytics/indexer APIs, or WebSockets as the reader's source of truth. Do not sign, submit, or simulate transactions unless separately requested.

Treat each launchpad generation as a separate adapter. A launchpad name, website, or old address list is not enough to identify the live contract or ABI. Distinguish documented claims, repository code, verified deployed code, and behavior directly observed in logs.

## Research and deployment verification

1. Start from the launchpad's official docs and repositories. Record the exact page, repo, commit/tag, and retrieval date.
2. Verify the target chain (`56` for BNB Smart Chain; `8453` for Base) with `eth_chainId`.
3. Resolve each factory/manager/core address from official deployment docs, then check `eth_getCode`. If a proxy is involved, resolve its implementation and use the ABI for the live implementation.
4. Derive event topics from the ABI; never guess a topic from an event name. Compare decoded fields against at least one real transaction and receipt/log set on the target chain.
5. Re-check deployment addresses and ABIs before release. Documentation and example files can lag live contracts; label unresolved facts as unverified rather than silently relying on them.

## Protocol coverage

### BNB Smart Chain: Four.meme

Treat Four.meme as two distinct adapters: classic TokenManager V1/V2 and modular OpenFour. They coexist and must not share an assumed ABI or launch lifecycle. Chain ID is `56` (`0x38`).

Classic contracts listed in the official integration guide:
- TokenManager V1 (historical launches): `0xEC4549caDcE5DA21Df6E6422d448034B5233bFbC`.
- TokenManager2 V2 (newer classic launches): `0x5c952063c7fc8610FFDB798152D69F0B9550762b`.
- TokenManagerHelper3 (on-chain reads/enrichment): `0xF251F83e40a78868FcfA3FA4599Dad6494E46034`.

For classic V2, use the official ABI to derive topics and decode `TokenCreate`, `TokenPurchase`, `TokenSale`, `TradeStop`, and `LiquidityAdded`. `TokenCreate` identifies the token and request ID; buy/sell logs provide curve activity; `TradeStop` and `LiquidityAdded` indicate lifecycle transition. The docs' user guide and example disagree on the classic BNB graduation amount (about 18 BNB versus `totalBAmount: 24` in a sample preset). Do not hardcode a universal threshold; inspect the token's configured/on-chain values and use actual transition events. Use V1 ABI separately for historical coverage. Helper3 `getTokenInfo(token)` is an `eth_call`, not a third-party API.

OpenFour is a modular launch engine. Its BSC Registry is `0x912CEf0C3aE9Ab6eB3Ec87cab69371cFb317Ab94`; resolve `openFourCore()` from the Registry at runtime rather than assuming the Core is permanent. Resolve other relevant modules on-chain. Parse official Core events `TokenCreated`, `TradeExecuted`, `PhaseTransition`, `MigrateExecuted`, and `TokenPaused` using the exact ABI. Store preset, vault/module addresses, migration tag and version because lifecycle and migration destinations are preset-specific. The documented phase values are Created (0), Trading (1), MigratePending (2), Migrated (3), Terminal (4), SoldOut (5). Do not assume every launch must pass through SoldOut or migrates to PancakeSwap; interpret `MigrateExecuted` with its tag/version and confirm state on-chain.

Official references:
- Classic integration guide: https://raw.githubusercontent.com/four-meme-community/fourmeme-docs/main/docs/integration-guide.md
- Classic trade events: https://raw.githubusercontent.com/four-meme-community/fourmeme-docs/main/docs/trade-guide.md
- Classic create guide: https://raw.githubusercontent.com/four-meme-community/fourmeme-docs/main/docs/create-guide.md
- OpenFour integration guide: https://raw.githubusercontent.com/four-meme-community/openfour-docs/main/docs/integration-guide.md
- OpenFour developer guide: https://github.com/four-meme-community/openfour-docs/blob/main/docs/developer-guide.md
- BNB Chain RPC endpoint guidance: https://docs.bnbchain.org/bnb-smart-chain/developers/json_rpc/json-rpc-endpoint/

### Base: separate adapters, not one Base-wide launchpad

Base is chain ID `8453`. The coverage set below represents distinct launch architectures, not a ranking by current launch volume.

**Clanker: direct pool creation.** Factory `0xE85A59c628F7d27878ACeB4bf3b35733630083a9`. Launching calls `deployToken(DeploymentConfig)`; creation initializes a Uniswap v4 pool and liquidity rather than starting a bonding-curve graduation path. The factory event is `TokenCreated(address,address,address,string,string,string,string,string,int24,address,bytes32,address,address,address,uint256,address[])`, topic0 `0x9299d1d1a88d8e1abdc591ae7a167a6bc63a8f17d695804e9091ee33aa89fb67`; `tokenAddress` and `tokenAdmin` are indexed. Treat the factory as the core deployment; hooks/modules are extensions and can vary by version.

**Flaunch: fixed-price fair launch, then v4 price discovery.** The current Base deployment map lists PositionManager `0x588C683EcC450F8b2aAdb13D7f63792b840425DC`, AnyPositionManager `0x6eA0eDeE449A287504990Df8D87951B9436825Dc`, Flaunch ERC-721 `0x475a09618BfD00FA4CB03B8504e95b62075E6F7D`, and FlaunchZap `0xf787d757674b21efD713fB636B16ed994bfa82A8`. Prefer PositionManager for launch logs, not the ERC-721. Useful events include `PoolCreated(bytes32,address,address,uint256,bool,uint256,(string,string,string,uint256,address,uint24,uint256,bytes,bytes))`, topic0 `0x88f75d7341103964abd68b657439ace486e110bfda589da9374fe9d69213c7c8`; `PoolScheduled(bytes32,uint256)`, topic0 `0x0a5b59cacc8ab09e32bf89cb0477200adacf9c0237786bf21d17f44cec998107`; and `PoolSwap(bytes32,int256,int256,int256,int256,int256,int256,int256,int256,int256,int256,int256,int256)`, topic0 `0x35001030bac7516ed5b1daf42bbfd3eaf587acc70c90f7f00ee42d5a34d75233`. Verify all against the pinned deployed ABI. No distinct fair-launch completion event was confirmed; inspect deployed hook/pool state instead of assuming a timer means completion.

**Virtuals: bonding curve and graduation.** Official docs list Base bonding-curve proxy `0x1A540088125d00dD3990f9dA45CA0859af4d3B01` and `$VIRTUAL` `0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b`. Docs describe curve trading followed by automatic graduation to Uniswap v2 at `42,000 $VIRTUAL`, with graduation LP locked/staked for ten years. The documented proxy points to implementation `0x20C124e13069889633FC4212e0797c95cb30Db40`, while repository examples include older settings and unimplemented paths. Treat event topics from repository `BondingV2.sol` as candidates only: `PreLaunched(address,address,uint256,uint256)` `0xac073481b1bc4233bf4afdfbb03f87ea97b0bb2c0305808d5614c824afb4e8b0`; `Launched(address,address,uint256,uint256,uint256)` `0xd113672859919fb75607f9e7df716114585bc03e2c4cb89ca2b2a7e8220c90bc`; `CancelledLaunch(address,address,uint256,uint256)` `0x7f9759070d2e707c297824b408d7d1739aa72e3329ae1bf3f77fb321d6856f93`; `Deployed(address,uint256,uint256)` `0x540bcec33387745b2ced30977dcfe4a623a245511eb0a133989c27c8bb95b4a9`; `Graduated(address,address)` `0x381d54fa425631e6266af114239150fae1d5db67bb65b4fa9ecc65013107e07e`. Verify implementation and live logs before using these filters in production.

**Zora: direct coin-and-pool creation.** Base factory `0x777777751622c0d3258f214F9DF38E35BF45baF3`; coin and Uniswap v4 pool are created together with Doppler-configured initial liquidity, not a bonding-curve graduation. Current creation events to consider:
- `CoinCreatedV4(address,address,address,address,string,string,string,address,(address,address,uint24,int24,address),bytes32,string)`, topic0 `0x2de436107c2096e039c98bbcc3c5a2560583738ce15c234557eecb4d3221aa81`.
- `CreatorCoinCreated` with the same parameter types, topic0 `0x74b670d628e152daa36ca95dda7cb0002d6ea7a37b55afe4593db7abd1515781`.
- `TrendCoinCreated(address,string,address,(address,address,uint24,int24,address),bytes32,bytes,string)`, topic0 `0xfb9e81c36dd4134d4eb5055e20d3238cb29a63daef0dd0f8b0f131da85891959`.
For historical coverage, also consider legacy `CoinCreated(address,address,address,address,string,string,string,address,address,string)`, topic0 `0x3d1462491f7fa8396808c230d95c3fa60fd09ef59506d0b9bd1cf072d2a03f56`. Confirm against the current official factory interface and deployment before filtering.

Official Base references:
- Clanker contracts/deployments: https://github.com/clanker-devco/v4-contracts
- Clanker event interface: https://raw.githubusercontent.com/clanker-devco/v4-contracts/main/src/interfaces/IClanker.sol
- Clanker deployment config: https://clanker.world/docs/references/core-contracts/v4/deployment-config
- Flaunch contracts/deployments: https://github.com/flayerlabs/flaunchgg-contracts
- Flaunch PositionManager interface: https://raw.githubusercontent.com/flayerlabs/flaunchgg-contracts/main/src/interfaces/IPositionManager.sol
- Flaunch fair-launch design: https://docs.flaunch.gg/features/fixed-price-fair-launch
- Virtuals contract registry: https://whitepaper.virtuals.io/info-hub/important-links-and-resources/virtuals-protocol-contract-addresses
- Virtuals launch mechanics: https://whitepaper.virtuals.io/about-virtuals/capital-formation-layer/virtuals-launch-mechanics
- Virtuals BaseScan proxy: https://basescan.org/address/0x1A540088125d00dD3990f9dA45CA0859af4d3B01#code
- Zora creation docs: https://docs.zora.co/coins/contracts/creating-a-coin
- Zora factory interface: https://raw.githubusercontent.com/ourzora/zora-protocol/main/packages/coins/src/interfaces/IZoraFactory.sol
- Zora architecture: https://docs.zora.co/coins/contracts/architecture
- Base RPC / `eth_getLogs`: https://docs.base.org/base-chain/api-reference/rpc-overview and https://docs.base.org/base-chain/api-reference/ethereum-json-rpc-api/eth_getLogs
- Base finality: https://docs.base.org/specifications/transactions/transaction-finality

## Shared reader architecture

Use a protocol adapter per contract generation. Normalize records only after decoding and keep each adapter's original fields and lifecycle semantics.

Store a raw event envelope before higher-level processing:
- chain ID, protocol/version, emitting contract, event signature/topic0;
- block number, block hash, transaction hash, transaction index, log index;
- decoded arguments and original topics/data.

A normalized launch record should retain token address, creator when available, launch timestamp provenance, quote asset, pool/hook/vault/module addresses, metadata exactly as emitted, current lifecycle state, and links back to source events. Distinguish unknown, absent, pending, and confirmed values. Do not treat a create-time URI or social handle as safe or currently reachable without separate checks.

### Polling loop

1. Verify `eth_chainId`, and confirm deployed bytecode at every configured address. Resolve registries/proxies on-chain.
2. Keep a per-adapter cursor and explicit deployment/start block. Backfill first, then poll `eth_blockNumber` and request only address-scoped `eth_getLogs` ranges with the adapter's ABI-derived topic filters.
3. Use bounded ranges. Base's docs recommend `eth_getLogs` spans under 2,000 blocks for reliability and warn public RPCs are rate-limited. BNB Chain docs say `eth_getLogs` is disabled on some listed public HTTP endpoints; test log support on the chosen HTTP RPC. Multiple direct RPC endpoints are reasonable for failover.
4. Persist all logs idempotently, ordered by `(blockNumber, transactionIndex, logIndex)`. Commit the cursor only after the entire range and its decoded effects are durable. Deduplicate by `(chainId, contract, transactionHash, logIndex)`.
5. On timeout, range-limit, rate-limit, or server errors, retry or shrink the chunk and retain the failed range. Never advance past an unread range. Use exponential backoff and endpoint failover; surface stale cursor, last successful poll, last error, and RPC health in status output.
6. Replay a small overlap window. Store block hashes and reconcile changed/removed logs after reorgs. Use an optimistic head for quick detection; label confirmation/finality separately and use `safe`/`finalized` where supported.
7. Enrich with `eth_call` only when useful, such as reading token decimals/supply, curve progress, hook state, or a registry-resolved module. Keep event-derived facts distinct from later state reads.

### Lifecycle interpretation

Do not impose one generic “bonding curve → graduation” model across chains. Four.meme classic and OpenFour have different lifecycles; Clanker/Zora create pool liquidity directly; Flaunch has a fixed-price window before v4 price discovery; Virtuals uses a curve and graduation threshold. Treat the protocol's own events plus state as authoritative. Do not infer graduation solely from elapsed time, token price, a liquidity amount, or the presence of a pool unless the protocol defines that as its transition.

## Verification checklist

- Confirm chain ID, address bytecode, proxy implementation, ABI version, and live event topic for every adapter.
- Replay a known launch transaction and verify decoded token/creator/quote/pool fields against its receipt and on-chain reads.
- Test historical backfill, a range-limit error, an RPC outage/failover, duplicate replay, and a simulated reorg before calling the reader reliable.
- Verify that a new launch appears once, a metadata update enriches the same record, and protocol-specific migration/curve states remain correctly distinct.
- Report what is proven by official docs, what is in repository source, and what is verified on-chain. Never call a feed empty or complete based only on an HTTP 200; show the last scanned block and last successful log query.
