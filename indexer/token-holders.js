// @ts-nocheck
function formatBigIntBalance(rawVal, decimals = 18) {
  try {
    const rawStr = rawVal.toString().trim();
    if (!rawStr || rawStr === "0") return "0";
    const bi = BigInt(rawStr);
    const divisor = 10n ** BigInt(decimals);
    const whole = bi / divisor;
    const fraction = bi % divisor;
    if (fraction === 0n) {
      return whole.toLocaleString();
    }
    const fracStr = fraction.toString().padStart(decimals, "0").slice(0, 4).replace(/0+$/, "");
    return `${whole.toLocaleString()}${fracStr ? "." + fracStr : ""}`;
  } catch {
    return rawVal.toString();
  }
}
function formatSupplyString(rawVal) {
  try {
    if (typeof rawVal === "number") {
      return rawVal.toLocaleString();
    }
    const num = Number(rawVal);
    if (!isNaN(num) && num > 0) {
      return num.toLocaleString();
    }
    return String(rawVal);
  } catch {
    return String(rawVal);
  }
}
const GOPLUS_CHAIN_MAP = {
  ethereum: "1",
  eth: "1",
  "1": "1",
  bsc: "56",
  bnb: "56",
  binance: "56",
  "56": "56",
  base: "8453",
  "8453": "8453",
  arbitrum: "42161",
  arb: "42161",
  "42161": "42161",
  polygon: "137",
  matic: "137",
  "137": "137",
  avalanche: "43114",
  avax: "43114",
  "43114": "43114",
  cronos: "25",
  cro: "25",
  "25": "25",
  optimism: "10",
  op: "10",
  "10": "10",
  fantom: "250",
  ftm: "250",
  blast: "81457",
  linea: "59144",
  zksync: "324",
  scroll: "534352",
  mantle: "5000",
  berachain: "80094",
  bera: "80094"
};
const BLOCKSCOUT_INSTANCES = {
  base: "https://base.blockscout.com",
  ethereum: "https://eth.blockscout.com",
  eth: "https://eth.blockscout.com",
  arbitrum: "https://arbitrum.blockscout.com",
  optimism: "https://optimism.blockscout.com",
  polygon: "https://polygon.blockscout.com",
  berachain: "https://berascan.com"
};
const EVM_RPC_MAP = {
  base: ["https://mainnet.base.org", "https://base.llamarpc.com"],
  ethereum: ["https://cloudflare-eth.com", "https://rpc.ankr.com/eth", "https://eth.llamarpc.com"],
  bsc: ["https://binance.llamarpc.com", "https://bsc-dataseed.binance.org"],
  arbitrum: ["https://arb1.arbitrum.io/rpc", "https://arbitrum.llamarpc.com"],
  polygon: ["https://polygon-rpc.com", "https://polygon.llamarpc.com"],
  avalanche: ["https://api.avax.network/ext/bc/C/rpc", "https://avalanche.public-rpc.com"],
  cronos: ["https://evm.cronos.org", "https://cronos-evm.publicnode.com"],
  optimism: ["https://mainnet.optimism.io", "https://optimism.llamarpc.com"],
  robinhood: ["https://rpc.mainnet.chain.robinhood.com"]
};
async function callEvmRpc(rpcUrl, to, data, timeoutMs = 3500) {
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Math.floor(Math.random() * 1e4),
        method: "eth_call",
        params: [{ to, data }, "latest"]
      }),
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.result && json.result !== "0x" ? json.result : null;
  } catch {
    return null;
  }
}
async function handler(req, res) {
  const rawAddress = (req.query.address || req.query.tokenAddress || req.query.token || "").toString().trim();
  const rawPairAddress = (req.query.pairAddress || req.query.pair || "").toString().trim();
  const rawChain = (req.query.chainId || req.query.chain || "").toString().toLowerCase().trim();
  const rawProvider = (req.query.provider || "").toString().toLowerCase().trim();
  if (!rawAddress) {
    return res.status(200).json({
      totalSupply: null,
      totalHolders: 0,
      top10SupplyPercentage: null,
      holders: [],
      topHolders: [],
      error: "Missing token address parameter"
    });
  }
  const isEvmAddress = rawAddress.startsWith("0x") || /^[0-9a-fA-F]{40,42}$/.test(rawAddress);
  const solMint = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(rawAddress);
  if (!rawChain && !rawProvider && !isEvmAddress && !solMint) {
    return res.status(400).json({
      totalSupply: null,
      totalHolders: 0,
      top10SupplyPercentage: null,
      holders: [],
      topHolders: [],
      error: "That is not a contract or mint address."
    });
  }
  const cleanAddress = isEvmAddress && !rawAddress.startsWith("0x") ? `0x${rawAddress}` : rawAddress;
  let chainId = rawChain;
  if (!chainId) {
    if (rawProvider.includes("robinhood")) chainId = "robinhood";
    else if (rawProvider.includes("solana")) chainId = "solana";
    else if (isEvmAddress) chainId = "ethereum";
    else chainId = "solana";
  }
  if (chainId === "eth") chainId = "ethereum";
  if (chainId === "bnb" || chainId === "binance") chainId = "bsc";
  if (chainId === "arb") chainId = "arbitrum";
  if (chainId === "matic") chainId = "polygon";
  if (chainId === "avax") chainId = "avalanche";
  if (chainId === "cro") chainId = "cronos";
  if (chainId === "op") chainId = "optimism";
  if (chainId === "sol") chainId = "solana";
  if (chainId === "robinhood" || chainId === "robinhoodchain" || chainId === "4663" || rawProvider.includes("robinhood")) {
    try {
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
      };
      const [v2TokenRes, v2AddressRes, v2HoldersRes] = await Promise.allSettled([
        fetch(`https://robinhoodchain.blockscout.com/api/v2/tokens/${encodeURIComponent(cleanAddress)}`, {
          headers,
          signal: AbortSignal.timeout(4e3)
        }).then((r) => r.ok ? r.json() : null),
        fetch(`https://robinhoodchain.blockscout.com/api/v2/addresses/${encodeURIComponent(cleanAddress)}`, {
          headers,
          signal: AbortSignal.timeout(4e3)
        }).then((r) => r.ok ? r.json() : null),
        fetch(`https://robinhoodchain.blockscout.com/api/v2/tokens/${encodeURIComponent(cleanAddress)}/holders`, {
          headers,
          signal: AbortSignal.timeout(4e3)
        }).then((r) => r.ok ? r.json() : null)
      ]);
      const v2Token = v2TokenRes.status === "fulfilled" ? v2TokenRes.value : null;
      const v2Address = v2AddressRes.status === "fulfilled" ? v2AddressRes.value : null;
      const v2Holders = v2HoldersRes.status === "fulfilled" ? v2HoldersRes.value : null;
      const creator = v2Address?.creator_address_hash || v2Address?.token?.creator_address_hash || void 0;
      const creationTx = v2Address?.creation_transaction_hash || void 0;
      const decimals = Number(v2Token?.decimals || v2Address?.token?.decimals || 18);
      const rawTotalSupply = (v2Token?.total_supply || v2Address?.token?.total_supply || "0").toString();
      const totalHoldersCount = Number(v2Token?.holders_count || v2Address?.token?.holders_count || 0);
      let totalBigInt = 0n;
      try {
        if (rawTotalSupply && rawTotalSupply !== "0") totalBigInt = BigInt(rawTotalSupply);
      } catch {
      }
      const totalSupplyFormatted = rawTotalSupply && rawTotalSupply !== "0" ? formatBigIntBalance(rawTotalSupply, decimals) : null;
      const rawItems = Array.isArray(v2Holders?.items) ? v2Holders.items : [];
      if (rawItems.length > 0) {
        if (totalBigInt === 0n) {
          totalBigInt = rawItems.reduce((acc, it) => {
            try {
              return acc + BigInt(it.value || 0);
            } catch {
              return acc;
            }
          }, 0n);
        }
        const holders = rawItems.map((it) => {
          const owner = (it.address?.hash || it.address || "").toLowerCase().trim();
          const rawVal = (it.value || "0").toString();
          let pct = 0;
          try {
            if (totalBigInt > 0n) {
              const hBigInt = BigInt(rawVal);
              pct = Number(hBigInt * 1000000n / totalBigInt) / 1e4;
            }
          } catch {
          }
          const isDead = owner === "0x000000000000000000000000000000000000dead" || owner === "0x0000000000000000000000000000000000000000";
          const isCreatorWallet = creator && owner.toLowerCase() === creator.toLowerCase();
          const tagName = it.address?.name || it.address?.implementations?.[0]?.name;
          let label;
          if (isDead) label = "Burned (Dead Address)";
          else if (isCreatorWallet) label = "Token Deployer / Creator";
          else if (tagName) label = tagName;
          return {
            address: owner,
            ownerAddress: owner,
            balance: rawVal,
            balanceFormatted: formatBigIntBalance(rawVal, decimals),
            percentage: Number(pct.toFixed(2)),
            percentageRelativeToTotalSupply: Number(pct.toFixed(2)),
            isContract: Boolean(it.address?.is_contract || isDead),
            label
          };
        });
        holders.sort((a, b) => b.percentageRelativeToTotalSupply - a.percentageRelativeToTotalSupply);
        const top10 = holders.slice(0, 10);
        const top10SupplyPercentage = Number(
          top10.reduce((acc, h) => acc + (h.percentageRelativeToTotalSupply || 0), 0).toFixed(2)
        );
        return res.status(200).json({
          totalSupply: rawTotalSupply !== "0" ? rawTotalSupply : null,
          totalSupplyFormatted,
          decimals,
          totalHolders: totalHoldersCount > 0 ? totalHoldersCount : holders.length,
          top10SupplyPercentage: top10SupplyPercentage > 0 ? top10SupplyPercentage : null,
          holders,
          topHolders: holders,
          creator,
          supplier: creator,
          deployer: creator,
          creationTx,
          source: "robinhood-blockscout-v2",
          chain: "robinhood"
        });
      }
      const [v1HoldersRes, v1SupplyRes, rpcSupplyRes] = await Promise.allSettled([
        fetch(`https://robinhoodchain.blockscout.com/api?module=token&action=getTokenHolders&contractaddress=${encodeURIComponent(cleanAddress)}`, {
          headers,
          signal: AbortSignal.timeout(3500)
        }).then((r) => r.ok ? r.json() : null),
        fetch(`https://robinhoodchain.blockscout.com/api?module=stats&action=tokensupply&contractaddress=${encodeURIComponent(cleanAddress)}`, {
          headers,
          signal: AbortSignal.timeout(3500)
        }).then((r) => r.ok ? r.json() : null),
        callEvmRpc("https://rpc.mainnet.chain.robinhood.com", cleanAddress, "0x18160ddd")
      ]);
      const v1HoldersData = v1HoldersRes.status === "fulfilled" ? v1HoldersRes.value : null;
      const v1SupplyData = v1SupplyRes.status === "fulfilled" ? v1SupplyRes.value : null;
      const rpcSupplyHex = rpcSupplyRes.status === "fulfilled" ? rpcSupplyRes.value : null;
      let fallbackRawSupply = rawTotalSupply;
      if (!fallbackRawSupply || fallbackRawSupply === "0") {
        if (v1SupplyData?.status === "1" && v1SupplyData?.result) {
          fallbackRawSupply = v1SupplyData.result.toString();
        } else if (rpcSupplyHex) {
          try {
            fallbackRawSupply = BigInt(rpcSupplyHex).toString();
          } catch {
          }
        }
      }
      const v1List = v1HoldersData?.status === "1" && Array.isArray(v1HoldersData?.result) ? v1HoldersData.result : [];
      if (v1List.length > 0) {
        let fallbackTotalBigInt = 0n;
        try {
          if (fallbackRawSupply) fallbackTotalBigInt = BigInt(fallbackRawSupply);
        } catch {
        }
        if (fallbackTotalBigInt === 0n) {
          fallbackTotalBigInt = v1List.reduce((acc, h) => {
            try {
              return acc + BigInt(h.value || 0);
            } catch {
              return acc;
            }
          }, 0n);
        }
        const holders = v1List.map((h) => {
          const owner = (h.address || "").toLowerCase().trim();
          const rawVal = (h.value || "0").toString();
          let pct = 0;
          try {
            if (fallbackTotalBigInt > 0n) {
              const hBigInt = BigInt(rawVal);
              pct = Number(hBigInt * 1000000n / fallbackTotalBigInt) / 1e4;
            }
          } catch {
          }
          const isDead = owner === "0x000000000000000000000000000000000000dead" || owner === "0x0000000000000000000000000000000000000000";
          const isCreatorWallet = creator && owner.toLowerCase() === creator.toLowerCase();
          return {
            address: owner,
            ownerAddress: owner,
            balance: rawVal,
            balanceFormatted: formatBigIntBalance(rawVal, decimals),
            percentage: Number(pct.toFixed(2)),
            percentageRelativeToTotalSupply: Number(pct.toFixed(2)),
            isContract: isDead,
            label: isDead ? "Burned (Dead Address)" : isCreatorWallet ? "Token Deployer / Creator" : void 0
          };
        });
        holders.sort((a, b) => b.percentageRelativeToTotalSupply - a.percentageRelativeToTotalSupply);
        const top10 = holders.slice(0, 10);
        const top10SupplyPercentage = Number(top10.reduce((acc, h) => acc + (h.percentageRelativeToTotalSupply || 0), 0).toFixed(2));
        return res.status(200).json({
          totalSupply: fallbackRawSupply !== "0" ? fallbackRawSupply : null,
          totalSupplyFormatted: fallbackRawSupply ? formatBigIntBalance(fallbackRawSupply, decimals) : void 0,
          decimals,
          totalHolders: totalHoldersCount > 0 ? totalHoldersCount : holders.length,
          top10SupplyPercentage: top10SupplyPercentage > 0 ? top10SupplyPercentage : null,
          holders,
          topHolders: holders,
          creator,
          supplier: creator,
          deployer: creator,
          source: "robinhood-blockscout-v1",
          chain: "robinhood"
        });
      }
    } catch {
    }
  }
  if (!isEvmAddress && (chainId === "solana" || chainId === "sol" || cleanAddress.length >= 32)) {
    try {
      const rugcheckRes = await fetch(`https://api.rugcheck.xyz/v1/tokens/${encodeURIComponent(cleanAddress)}/report`, {
        signal: AbortSignal.timeout(4e3),
        headers: { "Accept": "application/json", "User-Agent": "DexHunter/1.0" }
      });
      if (rugcheckRes.ok) {
        const data = await rugcheckRes.json();
        const rawHolders = Array.isArray(data?.topHolders) ? data.topHolders : [];
        const creator = data?.creator || data?.tokenMeta?.updateAuthority || data?.mintAuthority;
        if (rawHolders.length > 0) {
          const totalSupply = data?.token?.supply || data?.tokenMeta?.supply || null;
          const decimals = data?.token?.decimals ?? data?.tokenMeta?.decimals ?? 6;
          const holders = rawHolders.map((h) => {
            const ownerWallet = (h.owner || h.ownerAddress || h.address || "").trim();
            const pct = typeof h.pct === "number" ? h.pct : typeof h.percentageRelativeToTotalSupply === "number" ? h.percentageRelativeToTotalSupply : 0;
            const balanceVal = h.uiAmount ?? h.amount ?? h.balance ?? 0;
            const balanceFormatted = h.uiAmountString ?? (balanceVal ? balanceVal.toLocaleString() : "0");
            return {
              address: ownerWallet,
              ownerAddress: ownerWallet,
              tokenAccount: h.address,
              balance: balanceVal,
              balanceFormatted,
              percentage: Number(pct.toFixed(2)),
              percentageRelativeToTotalSupply: Number(pct.toFixed(2)),
              isContract: Boolean(h.isContract || h.insider),
              label: h.insider ? "Insider / Creator" : void 0
            };
          });
          holders.sort((a, b) => b.percentageRelativeToTotalSupply - a.percentageRelativeToTotalSupply);
          const top10 = holders.slice(0, 10);
          const top10SupplyPercentage = Number(
            top10.reduce((acc, h) => acc + (h.percentageRelativeToTotalSupply || 0), 0).toFixed(2)
          );
          return res.status(200).json({
            totalSupply,
            totalSupplyFormatted: totalSupply ? Number(totalSupply).toLocaleString() : void 0,
            decimals,
            totalHolders: data.totalHolders || holders.length,
            top10SupplyPercentage: top10SupplyPercentage > 0 ? top10SupplyPercentage : null,
            holders,
            topHolders: holders,
            creator,
            supplier: creator,
            deployer: creator,
            source: "onchain-solana-rugcheck",
            chain: "solana"
          });
        }
      }
    } catch {
    }
    try {
      const goplusSolRes = await fetch(
        `https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${encodeURIComponent(cleanAddress)}`,
        { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(3500) }
      );
      if (goplusSolRes.ok) {
        const goplusData = await goplusSolRes.json();
        const solToken = goplusData?.result?.[cleanAddress];
        if (solToken) {
          const rawHolders = Array.isArray(solToken.holders) ? solToken.holders : [];
          const creator = Array.isArray(solToken.creators) && solToken.creators[0]?.address ? solToken.creators[0].address : solToken.mint_authority?.authority?.[0] || void 0;
          const totalSupply = solToken.total_supply || null;
          if (rawHolders.length > 0) {
            const holders = rawHolders.map((h) => {
              const pct = Number((Number(h.percent || 0) * 100).toFixed(2));
              return {
                address: h.address,
                ownerAddress: h.address,
                balance: h.balance || "0",
                balanceFormatted: typeof h.balance === "string" ? Number(h.balance).toLocaleString() : String(h.balance),
                percentage: pct,
                percentageRelativeToTotalSupply: pct,
                label: h.tag || (creator && h.address.toLowerCase() === creator.toLowerCase() ? "Token Creator" : void 0)
              };
            });
            holders.sort((a, b) => b.percentageRelativeToTotalSupply - a.percentageRelativeToTotalSupply);
            const top10 = holders.slice(0, 10);
            const top10SupplyPercentage = Number(top10.reduce((acc, h) => acc + h.percentageRelativeToTotalSupply, 0).toFixed(2));
            return res.status(200).json({
              totalSupply,
              totalSupplyFormatted: totalSupply ? formatSupplyString(totalSupply) : void 0,
              decimals: 6,
              totalHolders: Number(solToken.holder_count) || holders.length,
              top10SupplyPercentage: top10SupplyPercentage > 0 ? top10SupplyPercentage : null,
              holders,
              topHolders: holders,
              creator,
              supplier: creator,
              deployer: creator,
              source: "goplus-solana",
              chain: "solana"
            });
          }
        }
      }
    } catch {
    }
    try {
      const { resolvePumpToken, pumpIndexer } = await import("./pump-engine.js");
      const token = pumpIndexer?.getToken(cleanAddress) || (await resolvePumpToken(cleanAddress)).token;
      if (token && token.bondingCurvePda) {
        const totalSupplyNum = 1e9;
        const realTokens = token.realTokenReserves ? Number(BigInt(token.realTokenReserves)) / 1e6 : 0;
        const curvePct = Number((realTokens / totalSupplyNum * 100).toFixed(2));
        // Curve reserves are not a holder list. Never invent a wallet or a count.
        const curveNote = Number.isFinite(curvePct)
          ? `The bonding curve reserve is about ${curvePct}% of supply. `
          : "";
        return res.status(200).json({
          totalSupply: totalSupplyNum,
          totalSupplyFormatted: "1,000,000,000",
          decimals: 6,
          totalHolders: null,
          top10SupplyPercentage: null,
          holders: [],
          topHolders: [],
          creator: token.creator || void 0,
          message: `${curveNote}Individual holder wallets were not returned, so no holder count is shown.`,
          source: "onchain-solana-pumpfun-bonding-curve",
          chain: "solana"
        });
      }
    } catch (err) {
      console.warn("[Token Holders] Pump bonding curve fallback error:", err?.message);
    }
  }
  if (isEvmAddress) {
    const goplusChainId = GOPLUS_CHAIN_MAP[chainId];
    let goplusTokenInfo = null;
    if (goplusChainId) {
      try {
        const gpRes = await fetch(
          `https://api.gopluslabs.io/api/v1/token_security/${goplusChainId}?contract_addresses=${encodeURIComponent(cleanAddress)}`,
          {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(4500)
          }
        );
        if (gpRes.ok) {
          const gpData = await gpRes.json();
          goplusTokenInfo = gpData?.result?.[cleanAddress.toLowerCase()] || gpData?.result?.[cleanAddress];
          if (goplusTokenInfo) {
            const rawHolders = Array.isArray(goplusTokenInfo.holders) ? goplusTokenInfo.holders : [];
            const creator = goplusTokenInfo.creator_address || void 0;
            const owner = goplusTokenInfo.owner_address || void 0;
            const totalSupply = goplusTokenInfo.total_supply || null;
            const holderCount = Number(goplusTokenInfo.holder_count) || 0;
            if (rawHolders.length > 0) {
              const holders = rawHolders.map((h) => {
                const hAddr = (h.address || "").toLowerCase().trim();
                const pct = Number((Number(h.percent || 0) * 100).toFixed(2));
                const isDead = hAddr === "0x000000000000000000000000000000000000dead" || hAddr === "0x0000000000000000000000000000000000000000";
                const isCreator = creator && hAddr === creator.toLowerCase();
                const isOwner = owner && hAddr === owner.toLowerCase();
                let label = h.tag || void 0;
                if (isDead) label = "Burned Supply (Dead Address)";
                else if (isCreator) label = "Token Deployer / Creator";
                else if (isOwner) label = "Contract Owner";
                return {
                  address: h.address,
                  ownerAddress: h.address,
                  balance: h.balance || "0",
                  balanceFormatted: typeof h.balance === "string" ? Number(h.balance).toLocaleString() : String(h.balance),
                  percentage: pct,
                  percentageRelativeToTotalSupply: pct,
                  isContract: Boolean(h.is_contract || isDead),
                  label
                };
              });
              if (Array.isArray(goplusTokenInfo.lp_holders) && goplusTokenInfo.lp_holders.length > 0) {
                for (const lp of goplusTokenInfo.lp_holders) {
                  const lpAddr = (lp.address || "").toLowerCase().trim();
                  const existing = holders.find((h) => h.address.toLowerCase() === lpAddr);
                  if (existing) {
                    existing.isContract = true;
                    if (!existing.label) existing.label = lp.tag || "DEX Liquidity Pool";
                  }
                }
              }
              holders.sort((a, b) => b.percentageRelativeToTotalSupply - a.percentageRelativeToTotalSupply);
              const top10 = holders.slice(0, 10);
              const sumTop10 = top10.reduce((acc, h) => acc + (h.percentageRelativeToTotalSupply || 0), 0);
              const top10SupplyPercentage = Number(Math.min(sumTop10, 100).toFixed(2));
              return res.status(200).json({
                totalSupply,
                totalSupplyFormatted: totalSupply ? formatSupplyString(totalSupply) : void 0,
                totalHolders: holderCount > 0 ? holderCount : holders.length,
                top10SupplyPercentage: top10SupplyPercentage > 0 ? top10SupplyPercentage : null,
                holders,
                topHolders: holders,
                creator,
                supplier: creator || owner,
                deployer: creator,
                source: "goplus-evm",
                chain: chainId
              });
            }
          }
        }
      } catch {
      }
    }
    const blockscoutBase = BLOCKSCOUT_INSTANCES[chainId];
    if (blockscoutBase) {
      try {
        const [bsHoldersRes, bsTokenRes] = await Promise.allSettled([
          fetch(`${blockscoutBase}/api/v2/tokens/${encodeURIComponent(cleanAddress)}/holders`, {
            headers: { Accept: "application/json", "User-Agent": "DexHunter/1.0" },
            signal: AbortSignal.timeout(4e3)
          }).then((r) => r.ok ? r.json() : null),
          fetch(`${blockscoutBase}/api/v2/tokens/${encodeURIComponent(cleanAddress)}`, {
            headers: { Accept: "application/json", "User-Agent": "DexHunter/1.0" },
            signal: AbortSignal.timeout(4e3)
          }).then((r) => r.ok ? r.json() : null)
        ]);
        const bsHolders = bsHoldersRes.status === "fulfilled" ? bsHoldersRes.value : null;
        const bsToken = bsTokenRes.status === "fulfilled" ? bsTokenRes.value : null;
        const rawItems = Array.isArray(bsHolders?.items) ? bsHolders.items : [];
        if (rawItems.length > 0) {
          const decimals = Number(bsToken?.decimals || 18);
          const rawTotalSupply = (bsToken?.total_supply || "0").toString();
          let totalBigInt = 0n;
          try {
            if (rawTotalSupply && rawTotalSupply !== "0") totalBigInt = BigInt(rawTotalSupply);
          } catch {
          }
          if (totalBigInt === 0n) {
            totalBigInt = rawItems.reduce((acc, it) => {
              try {
                return acc + BigInt(it.value || 0);
              } catch {
                return acc;
              }
            }, 0n);
          }
          const holders = rawItems.map((it) => {
            const owner = (it.address?.hash || it.address || "").toLowerCase().trim();
            const rawVal = (it.value || "0").toString();
            let pct = 0;
            try {
              if (totalBigInt > 0n) {
                const hBigInt = BigInt(rawVal);
                pct = Number(hBigInt * 1000000n / totalBigInt) / 1e4;
              }
            } catch {
            }
            const isDead = owner === "0x000000000000000000000000000000000000dead" || owner === "0x0000000000000000000000000000000000000000";
            const tagName = it.address?.name || it.address?.implementations?.[0]?.name;
            return {
              address: owner,
              ownerAddress: owner,
              balance: rawVal,
              balanceFormatted: formatBigIntBalance(rawVal, decimals),
              percentage: Number(pct.toFixed(2)),
              percentageRelativeToTotalSupply: Number(pct.toFixed(2)),
              isContract: Boolean(it.address?.is_contract || isDead),
              label: isDead ? "Burned Supply (Dead Address)" : tagName || void 0
            };
          });
          holders.sort((a, b) => b.percentageRelativeToTotalSupply - a.percentageRelativeToTotalSupply);
          const top10 = holders.slice(0, 10);
          const top10SupplyPercentage = Number(
            top10.reduce((acc, h) => acc + (h.percentageRelativeToTotalSupply || 0), 0).toFixed(2)
          );
          return res.status(200).json({
            totalSupply: rawTotalSupply !== "0" ? rawTotalSupply : null,
            totalSupplyFormatted: rawTotalSupply && rawTotalSupply !== "0" ? formatBigIntBalance(rawTotalSupply, decimals) : void 0,
            decimals,
            totalHolders: Number(bsToken?.holders_count) || holders.length,
            top10SupplyPercentage: top10SupplyPercentage > 0 ? top10SupplyPercentage : null,
            holders,
            topHolders: holders,
            source: "blockscout-v2",
            chain: chainId
          });
        }
      } catch {
      }
    }
    const apiKey = process.env.MORALIS_API_KEY;
    if (apiKey) {
      try {
        const moralisChain = chainId === "base" ? "base" : chainId === "bsc" ? "bsc" : chainId === "arbitrum" ? "arbitrum" : chainId === "polygon" ? "polygon" : chainId === "optimism" ? "optimism" : chainId === "avalanche" ? "avalanche" : "eth";
        const evmRes = await fetch(
          `https://deep-index.moralis.io/api/v2.2/erc20/${encodeURIComponent(cleanAddress)}/owners?chain=${moralisChain}&order=DESC`,
          {
            method: "GET",
            headers: { "X-API-Key": apiKey, "accept": "application/json" },
            signal: AbortSignal.timeout(3e3)
          }
        );
        if (evmRes.ok) {
          const evmData = await evmRes.json();
          const rawEVM = Array.isArray(evmData?.result) ? evmData.result : [];
          if (rawEVM.length > 0) {
            const holders = rawEVM.map((h) => {
              const ownerWallet = (h.owner_address || h.address || "").trim();
              const pct = Number(h.percentage_relative_to_total_supply || h.percentageRelativeToTotalSupply || 0);
              return {
                address: ownerWallet,
                ownerAddress: ownerWallet,
                balance: h.balance_formatted || h.balance || 0,
                balanceFormatted: h.balance_formatted || "",
                percentage: Number(pct.toFixed(2)),
                percentageRelativeToTotalSupply: Number(pct.toFixed(2)),
                isContract: Boolean(h.is_contract)
              };
            });
            const top10 = holders.slice(0, 10);
            const top10SupplyPercentage = Number(
              top10.reduce((acc, h) => acc + (h.percentageRelativeToTotalSupply || 0), 0).toFixed(2)
            );
            return res.status(200).json({
              totalSupply: evmData.total_supply || null,
              totalSupplyFormatted: evmData.total_supply ? Number(evmData.total_supply).toLocaleString() : void 0,
              totalHolders: evmData.total || holders.length,
              top10SupplyPercentage: top10SupplyPercentage > 0 ? top10SupplyPercentage : null,
              holders,
              topHolders: holders,
              source: "moralis-evm",
              chain: chainId
            });
          }
        }
      } catch {
      }
    }
    const rpcList = EVM_RPC_MAP[chainId] || [];
    for (const rpc of rpcList) {
      try {
        const calls = [
          callEvmRpc(rpc, cleanAddress, "0x18160ddd"),
          // totalSupply()
          callEvmRpc(rpc, cleanAddress, "0x313ce567")
          // decimals()
        ];
        if (rawPairAddress && rawPairAddress.startsWith("0x") && rawPairAddress.length === 42) {
          const pairPadded = rawPairAddress.slice(2).padStart(64, "0");
          calls.push(callEvmRpc(rpc, cleanAddress, "0x70a08231" + pairPadded));
        }
        const deadPadded = "000000000000000000000000000000000000dead".padStart(64, "0");
        calls.push(callEvmRpc(rpc, cleanAddress, "0x70a08231" + deadPadded));
        const creatorAddr = goplusTokenInfo?.creator_address || goplusTokenInfo?.owner_address;
        if (creatorAddr && creatorAddr.startsWith("0x") && creatorAddr.length === 42) {
          const creatorPadded = creatorAddr.slice(2).padStart(64, "0");
          calls.push(callEvmRpc(rpc, cleanAddress, "0x70a08231" + creatorPadded));
        }
        const results = await Promise.all(calls);
        const supplyHex = results[0];
        const decHex = results[1];
        if (supplyHex && supplyHex !== "0x") {
          const rawSupplyBigInt = BigInt(supplyHex);
          const decimals = decHex && decHex !== "0x" ? Number(BigInt(decHex)) : 18;
          const totalSupplyFormatted = formatBigIntBalance(rawSupplyBigInt.toString(), decimals);
          const synthesizedHolders = [];
          let resIdx = 2;
          if (rawPairAddress && rawPairAddress.startsWith("0x") && rawPairAddress.length === 42) {
            const pairBalHex = results[resIdx++];
            if (pairBalHex && pairBalHex !== "0x") {
              const pBal = BigInt(pairBalHex);
              if (pBal > 0n && rawSupplyBigInt > 0n) {
                const pct = Number(pBal * 1000000n / rawSupplyBigInt) / 1e4;
                synthesizedHolders.push({
                  address: rawPairAddress,
                  ownerAddress: rawPairAddress,
                  balance: pBal.toString(),
                  balanceFormatted: formatBigIntBalance(pBal.toString(), decimals),
                  percentage: Number(pct.toFixed(2)),
                  percentageRelativeToTotalSupply: Number(pct.toFixed(2)),
                  isContract: true,
                  label: "DEX Liquidity Pool"
                });
              }
            }
          }
          const deadBalHex = results[resIdx++];
          if (deadBalHex && deadBalHex !== "0x") {
            const dBal = BigInt(deadBalHex);
            if (dBal > 0n && rawSupplyBigInt > 0n) {
              const pct = Number(dBal * 1000000n / rawSupplyBigInt) / 1e4;
              synthesizedHolders.push({
                address: "0x000000000000000000000000000000000000dead",
                ownerAddress: "0x000000000000000000000000000000000000dead",
                balance: dBal.toString(),
                balanceFormatted: formatBigIntBalance(dBal.toString(), decimals),
                percentage: Number(pct.toFixed(2)),
                percentageRelativeToTotalSupply: Number(pct.toFixed(2)),
                isContract: true,
                label: "Burned Supply (Dead Address)"
              });
            }
          }
          if (creatorAddr && creatorAddr.startsWith("0x") && creatorAddr.length === 42) {
            const creatorBalHex = results[resIdx++];
            if (creatorBalHex && creatorBalHex !== "0x") {
              const cBal = BigInt(creatorBalHex);
              if (cBal > 0n && rawSupplyBigInt > 0n) {
                const pct = Number(cBal * 1000000n / rawSupplyBigInt) / 1e4;
                synthesizedHolders.push({
                  address: creatorAddr,
                  ownerAddress: creatorAddr,
                  balance: cBal.toString(),
                  balanceFormatted: formatBigIntBalance(cBal.toString(), decimals),
                  percentage: Number(pct.toFixed(2)),
                  percentageRelativeToTotalSupply: Number(pct.toFixed(2)),
                  isContract: false,
                  label: "Token Deployer / Creator"
                });
              }
            }
          }
          synthesizedHolders.sort((a, b) => b.percentageRelativeToTotalSupply - a.percentageRelativeToTotalSupply);
          const knownCount = Number(goplusTokenInfo?.holder_count);
          const listed = Number.isFinite(knownCount) && knownCount > 0
            ? synthesizedHolders
            : synthesizedHolders.filter((holder) => holder.label !== "Burned Supply (Dead Address)");
          const totalHolders = Number.isFinite(knownCount) && knownCount > 0 ? knownCount : 0;
          const top10SupplyPercentage = totalHolders > 0 && listed.length > 0
            ? Number(listed.slice(0, 10).reduce((acc, holder) => acc + holder.percentageRelativeToTotalSupply, 0).toFixed(2))
            : null;
          return res.status(200).json({
            totalSupply: rawSupplyBigInt.toString(),
            totalSupplyFormatted,
            decimals,
            totalHolders,
            top10SupplyPercentage,
            holders: listed,
            topHolders: listed,
            creator: creatorAddr,
            supplier: creatorAddr,
            deployer: creatorAddr,
            source: "onchain-evm-rpc",
            chain: chainId,
            message: totalHolders > 0 ? void 0 : "Holder list isn't available for this chain. Supply was read from the contract."
          });
        }
      } catch {
      }
    }
  }
  return res.status(200).json({
    totalSupply: null,
    totalHolders: 0,
    top10SupplyPercentage: null,
    holders: [],
    topHolders: [],
    chain: chainId,
    message: `No holder data available for this ${chainId.toUpperCase()} token address`
  });
}
export {
  handler as default
};
