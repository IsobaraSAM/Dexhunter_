/**
 * DexHunter × Argus Portal 8 Integration
 * Authoritative Protocol Addresses, ABI Fragments, and Topics
 */

export const ARC_CHAIN_ID = 5042;
export const ARC_START_BLOCK = 22_251_758;

/**
 * Authoritative Protocol Addresses on Arc (Chain ID 5042)
 */
export const PORTAL8_ADDRESS = "0xeed7559B8A6ABf64427dc41Cb5cc6400109C5D93";
export const CREATOR_REGISTRY_ADDRESS = "0x986B478bE2F05b44b47c61E26a0BbcBcC07610eD";
export const QUOTE_REGISTRY_ADDRESS = "0x58398C03C7a6240D8aa1cED42592933ad857843A";
export const IDENTITY_BOOK_ADDRESS = "0x10634798c7f5C37009026BAb3f81773389F4e97d";
export const CONVERTER_ADDRESS = "0x90FEd5C170f43b299C3F70bEfC9bd3b2305d9f07";
export const BURN_EXECUTOR_ADDRESS = "0x917E6E0deC873b8Ee8A8F183a43c397ee3fe527d";
export const LIQUIDITY_EXECUTOR_ADDRESS = "0xDeBebDed037435ae0BfcB010840558a410c4AD0D";
export const LOCK_EXECUTOR_ADDRESS = "0x52Bf02Bd941D246356bfa9Ec9DC7afa7d42f5088";
export const LOCK_VAULT_ADDRESS = "0xf61641B4AA3C7ace1084B8D4380920ECCBFd7Af2";
export const TIME_LOCK_ADDRESS = "0xFEe1d11d4501D66D8eA1024dc198ee5663c2bf6B";
export const TIME_LOCK_FIRST_ADDRESS = "0x25Cdf2c6190A47139DCd6f0C01e1479b06C1FDc7";
export const PARTS_FACTORY_ADDRESS = "0xD969062076F75fbC4fd0195561501dC13eF87C72";
export const HOOK_FACTORY_ADDRESS = "0xA7a0F2D2DaE22851d77946A42d4010c5ba5aaD97";

/**
 * Event Topic0 Hashes
 */
export const TOPIC_LAUNCHED = "0xc32e25061af0b7f7d77b7fb015333ecb0004127b71abbda4d7ba4c18bcd497f3";
export const TOPIC_LAUNCH_METADATA = "0x81757bd4a3f7375c9021d3bd561d1a8075d765544734931f26896acacda7ccdc";

/**
 * Portal 8 ABI Fragments
 *
 * event Launched(
 *     address indexed token,
 *     address indexed creator,
 *     address hook,
 *     address escrow,
 *     address locker,
 *     uint256 positionId,
 *     int24 tickStart,
 *     int24 tickBond
 * );
 *
 * event LaunchMetadata(
 *     address indexed token,
 *     string imageURI,
 *     string website,
 *     string twitter,
 *     string telegram,
 *     string description
 * );
 *
 * launches(address token) returns:
 * hook, escrow, locker, positionId, tickStart, tickBond, tokenIsToken0
 * (Does NOT return creator or quote asset)
 */
export const PORTAL8_ABI = [
  "event Launched(address indexed token, address indexed creator, address hook, address escrow, address locker, uint256 positionId, int24 tickStart, int24 tickBond)",
  "event LaunchMetadata(address indexed token, string imageURI, string website, string twitter, string telegram, string description)",
  "function launches(address token) external view returns (address hook, address escrow, address locker, uint256 positionId, int24 tickStart, int24 tickBond, bool tokenIsToken0)",
] as const;

/**
 * Hook ABI Fragments
 *
 * quoteAsset()
 * totalFeeBps()
 * launchedAt()
 * launchBlock()
 * snipeExempt(address)
 *
 * Note: Do NOT use Portal 7 assumptions such as buyTaxBps/sellTaxBps.
 */
export const HOOK_ABI = [
  "function quoteAsset() external view returns (address)",
  "function totalFeeBps() external view returns (uint16)",
  "function launchedAt() external view returns (uint256)",
  "function launchBlock() external view returns (uint256)",
  "function snipeExempt(address account) external view returns (bool)",
] as const;

/**
 * Token reads:
 * name()
 * symbol()
 * decimals()
 * totalSupply()
 * logo() - Portal 8 stores token image on-chain
 */
export const ERC20_PORTAL8_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function logo() external view returns (string)",
] as const;

/**
 * Creator Registry ABI Fragments
 */
export const CREATOR_REGISTRY_ABI = [
  "function payoutOf(address token) external view returns (address)",
  "function payoutSplit(address token) external view returns (bytes)",
] as const;
