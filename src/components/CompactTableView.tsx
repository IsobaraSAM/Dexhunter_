import React, { useState } from "react";
import { 
  ArrowUpDown, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  ExternalLink, 
  Globe, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  Zap, 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShieldCheck,
  Clock,
  Layers,
  Feather
} from "lucide-react";
import { TokenPair } from "../types";
import { 
  calculateFinalDexHunterScore, 
  normalizeChainName, 
  getDexTradingUrl 
} from "../lib/aggregator";
import { clientTradeHref, isArgusToken, isPonsToken, isPumpToken } from "../lib/launchLinks";
import { FormattedPrice } from "../lib/priceFormatter";
import { HoldersPieChart } from "./HoldersPieChart";
import { TokenHoldersScanResult } from "../lib/providers/holderScanner";
import { safeHref } from "../lib/safeUrl";
import { isNewerThan } from "../lib/time";
import { displayName, displaySymbol, fdvOf, marketCapOf, ponsStageLabel, volumeForDisplay } from "../lib/browseFilters";
import { tokenIdentityKey, holderCacheKey } from "../lib/tokenIdentity";
import { 
  TokenImage, 
  ChainIcon, 
  DexProtocolBadge, 
  DexIconContainer,
  TelegramIcon, 
  XIcon, 
  DiscordIcon, 
  SocialLinksRow,
  extractTokenSocials, 
  formatTimeAgo, 
  formatExactDate 
} from "./TokenShared";

interface CompactTableViewProps {
  pairs: TokenPair[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  sortBy: string;
  onSortChange: (sortId: "volume" | "liquidity" | "priceChange" | "marketCap" | "newest" | "price" | "none") => void;
  isDarkMode: boolean;
  theme: any;
  copiedAddress: string | null;
  onCopyAddress: (text: string) => void;
  expandedRowKeys: Record<string, boolean>;
  onToggleExpandRow: (pairKey: string, tokenAddress: string, chainId?: string, pairAddress?: string) => void;
  tokenHoldersData: Record<string, TokenHoldersScanResult>;
  onFetchHolders: (tokenAddress: string, chainId?: string, force?: boolean, pairAddress?: string) => void;
}

// Helpers for formatted currency and metrics
function formatCurrency(val?: number | string | null): string {
  if (val === undefined || val === null || val === "") return "—";
  const num = Number(val);
  if (isNaN(num)) return "—";
  if (num === 0) return "$0";

  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(1)}K`;
  }
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(val?: number | string | null): { text: string; isPositive: boolean; isNeutral: boolean } {
  if (val === undefined || val === null || val === "") return { text: "0%", isPositive: true, isNeutral: true };
  const num = Number(val);
  if (isNaN(num)) return { text: "0%", isPositive: true, isNeutral: true };
  if (num === 0) return { text: "0%", isPositive: true, isNeutral: true };
  
  const isPositive = num > 0;
  const absVal = Math.abs(num);
  const formatted = absVal >= 1000 ? `${absVal.toFixed(0)}%` : `${absVal.toFixed(1)}%`;
  return {
    text: `${isPositive ? "+" : "-"}${formatted}`,
    isPositive,
    isNeutral: false,
  };
}

function getExplorerUrl(chainId?: string, address?: string): string {
  if (!address) return "#";
  const norm = normalizeChainName(chainId);
  if (norm === "solana") return `https://solscan.io/token/${address}`;
  if (norm === "base") return `https://basescan.org/token/${address}`;
  if (norm === "ethereum") return `https://etherscan.io/token/${address}`;
  if (norm === "bsc") return `https://bscscan.com/token/${address}`;
  if (norm === "arbitrum") return `https://arbiscan.io/token/${address}`;
  if (norm === "polygon") return `https://polygonscan.com/token/${address}`;
  if (norm === "avalanche") return `https://snowtrace.io/token/${address}`;
  if (norm === "cronos") return `https://cronoscan.com/token/${address}`;
  return `https://dexscreener.com/${norm}/${address}`;
}

export const CompactTableView: React.FC<CompactTableViewProps> = ({
  pairs,
  totalCount,
  currentPage,
  pageSize,
  loading,
  sortBy,
  onSortChange,
  isDarkMode,
  theme,
  copiedAddress,
  onCopyAddress,
  expandedRowKeys,
  onToggleExpandRow,
  tokenHoldersData,
  onFetchHolders,
}) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [expandedHolderSections, setExpandedHolderSections] = useState<Record<string, boolean>>({});

  // Column sort direction indicator helper
  const renderSortIndicator = (columnSortId: string) => {
    const isActive = sortBy === columnSortId;
    return (
      <span className={`inline-flex items-center ml-1 transition-colors ${isActive ? "text-[#ff6b35]" : "opacity-30 group-hover:opacity-70"}`}>
        <ArrowUpDown className="w-3 h-3" />
      </span>
    );
  };

  // Streamlined Diagnostics Panel — Starts immediately with On-Chain Token Intelligence (no redundant actions)
  const renderExpandedDiagnostics = (pair: TokenPair, tokenAddress: string) => {
    const symbol = displaySymbol(pair);
    const fullName = displayName(pair, symbol);
    const holdersScan = tokenAddress ? tokenHoldersData[holderCacheKey(pair.chainId, tokenAddress)] : undefined;

    const normalizedHolders = (holdersScan?.topHolders || []).map((h, i) => ({
      ownerAddress: h.ownerAddress || h.address || `Holder-${i + 1}`,
      balance: h.balance,
      balanceFormatted: h.balanceFormatted,
      percentageRelativeToTotalSupply: Number(h.percentageRelativeToTotalSupply ?? h.percentage ?? 0),
      isContract: h.isContract,
      label: h.label,
    }));

    const buys24h = pair.txns?.h24?.buys;
    const sells24h = pair.txns?.h24?.sells;
    const totalTxns = (buys24h !== undefined && sells24h !== undefined) ? buys24h + sells24h : null;

    return (
      <div className="p-2 sm:p-2.5 space-y-2">
        {/* Token Full Name & Network Identification Header */}
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-black/10 dark:bg-black/25 border border-slate-200/60 dark:border-zinc-800/80">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] text-zinc-400 font-sans uppercase font-medium tracking-wide flex-shrink-0">Coin:</span>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-zinc-100 tracking-tight truncate" title={fullName}>
              {fullName}
            </span>
            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 font-semibold flex-shrink-0">
              (${symbol})
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="uppercase text-[9.5px] px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-zinc-800/80 font-mono font-bold text-slate-700 dark:text-zinc-300 border border-slate-300/40 dark:border-zinc-700/40">
              {pair.chainId}
            </span>
          </div>
        </div>

        {/* On-Chain Quick Overview Strip — Compact Token Properties */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2 rounded-xl bg-black/10 dark:bg-black/25 border border-inherit text-xs font-mono">
          {/* Liquidity Pool Reserves */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-400 font-sans">Pool Liquidity</span>
            <span className="font-bold text-slate-800 dark:text-zinc-100">
              {formatCurrency(pair.liquidity?.usd ?? pair.totalLiquidityUsd)}
            </span>
            {pair.quoteToken?.symbol && (
              <span className="text-[9.5px] text-zinc-400">
                Paired with {pair.quoteToken.symbol}
              </span>
            )}
          </div>

          {/* 24h Transactions / Buy-Sell ratio */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-400 font-sans">24h Transactions</span>
            <span className="font-bold text-slate-800 dark:text-zinc-100">
              {totalTxns !== null ? totalTxns.toLocaleString() : "Active Pool"}
            </span>
            {totalTxns !== null && totalTxns > 0 ? (
              <span className="text-[9.5px] text-zinc-400">
                <span className="text-emerald-500 font-bold">{buys24h}B</span> / <span className="text-rose-500 font-bold">{sells24h}S</span>
              </span>
            ) : (
              <span className="text-[9.5px] text-zinc-400">
                FDV: {fdvOf(pair) == null ? "—" : formatCurrency(fdvOf(pair))}
              </span>
            )}
          </div>

          {/* Bonding Curve or Stage */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-400 font-sans">Migration & Stage</span>
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-800 dark:text-zinc-100">
                {pair.isBondingCurve ? "Bonding Curve" : pair.isGraduated ? "Graduated Pool" : "Standard Pool"}
              </span>
            </div>
            {typeof pair.bondingProgress === "number" && pair.bondingProgress > 0 ? (
              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-[9.5px]">
                  <span className="text-emerald-500 font-medium">Bonding:</span>
                  <span className="text-emerald-500 font-bold font-mono">{pair.bondingProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.max(0, pair.bondingProgress))}%` }} 
                  />
                </div>
              </div>
            ) : (
              <span className="text-[9.5px] text-zinc-400">
                {pair.isGraduated ? "Migrated to AMM" : "Live Liquidity"}
              </span>
            )}
          </div>

          {/* Pool Created Age */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-400 font-sans">Pool Age</span>
            <span className="font-bold text-slate-800 dark:text-zinc-100">
              {formatTimeAgo(pair.pairCreatedAt) ?? "Unknown"}
            </span>
            <span className="text-[9.5px] text-zinc-400 truncate" title={pair.pairAddress}>
              Pair: {pair.pairAddress ? `${pair.pairAddress.slice(0, 4)}...${pair.pairAddress.slice(-4)}` : "Verified"}
            </span>
          </div>

          {pair.isPonsLaunch && (
            <div className="col-span-full px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-300">
              {ponsStageLabel(pair) || "Pons"}
              {pair.bondingProgress != null ? ` · curve ${Number(pair.bondingProgress).toFixed(1)}%` : ""}
            </div>
          )}
          {pair.isArgusLaunch && (
            <div className="col-span-full p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex flex-col gap-1.5 text-[11px]">
              <div className="flex items-center justify-between font-bold text-emerald-400">
                <span>Argus Protocol</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  {pair.argusLiquidityLocked ? "Locked (Uniswap v4)" : "Active Launch"}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10.5px]">
                <div>
                  <span className="text-zinc-400 block text-[9.5px]">Dev Buy Tier:</span>
                  <span className={`font-semibold ${
                    pair.argusDevBuyTier === "safe" ? "text-emerald-400" :
                    pair.argusDevBuyTier === "moderate" ? "text-amber-400" :
                    pair.argusDevBuyTier === "high_snipe" ? "text-rose-400" : "text-zinc-300"
                  }`}>
                    {pair.argusDevBuyTier?.toUpperCase() || "SAFE"} (${(pair.argusDevBuyUsdc ?? 0).toFixed(1)})
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[9.5px]">Social Audit:</span>
                  <span className={`font-semibold ${pair.argusReusedSocials?.hasReusedSocials ? "text-amber-400" : "text-emerald-400"}`}>
                    {pair.argusReusedSocials?.hasReusedSocials ? "Reused Socials Flagged" : "Clean / Unique"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[9.5px]">Taxes / Base Fee:</span>
                  <span className="text-slate-800 dark:text-zinc-200">
                    {((pair.argusBuyTaxBps || 0) / 100).toFixed(1)}% / {((pair.argusSellTaxBps || 0) / 100).toFixed(1)}% + {((pair.argusBaseFeeBps || 100) / 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[9.5px]">Portal Family:</span>
                  <span className="text-slate-700 dark:text-zinc-300">
                    {pair.argusPortalFamily || "hooked v4"}
                  </span>
                </div>
              </div>
              {pair.argusReusedSocials?.hasReusedSocials && (
                <div className="text-[10px] text-amber-300/90 bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                  Warning: {pair.argusReusedSocials.warningMessage || "Reused social links detected across prior token launches."} (Seen in {pair.argusReusedSocials.matchedTokens?.length || pair.argusReusedSocials.duplicateCount || 1} prior launch)
                </div>
              )}
            </div>
          )}
        </div>

        {/* Full-Space On-Chain Holders & Token Supply Breakdown — Takes Entire Card Space */}
        <div className={`rounded-xl border overflow-hidden transition-all duration-200 ${isDarkMode ? "bg-[#181926] border-zinc-800/80" : "bg-white border-slate-200"}`}>
          {/* Header Bar */}
          <div className="p-2 sm:p-2.5 flex items-center justify-between border-b border-inherit bg-black/10 dark:bg-black/20">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Users className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-emerald-400">
                On-Chain Holders & Token Supply Breakdown
              </span>
              {typeof holdersScan?.top10SupplyPercentage === "number" && (
                <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${
                  holdersScan.top10SupplyPercentage > 50
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}>
                  Top 10: {holdersScan.top10SupplyPercentage.toFixed(1)}%
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {holdersScan?.totalHolders ? (
                <span className="font-mono text-[11px] text-zinc-400">
                  Total: <span className="font-bold text-slate-800 dark:text-zinc-200">{holdersScan.totalHolders.toLocaleString()}</span>
                </span>
              ) : null}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFetchHolders(tokenAddress, pair.chainId, true, pair.pairAddress);
                }}
                disabled={holdersScan?.loading}
                className="px-2 py-1 rounded-lg border border-inherit text-[10.5px] font-medium text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:border-[#ff6b35] transition-all flex items-center gap-1 cursor-pointer"
                title="Scan Live On-Chain Holders"
              >
                <RefreshCw className={`w-3 h-3 ${holdersScan?.loading ? "animate-spin text-[#ff6b35]" : ""}`} />
                <span className="hidden sm:inline">{holdersScan?.loading ? "Scanning..." : "Rescan"}</span>
              </button>
            </div>
          </div>

          {/* Full Space Content */}
          <div className="p-2.5 sm:p-3.5 space-y-2.5">
            {holdersScan?.loading ? (
              <div className="py-6 text-center flex flex-col items-center justify-center space-y-2">
                <RefreshCw className="w-6 h-6 text-[#ff6b35] animate-spin" />
                <span className="text-xs text-zinc-400 font-mono">Scanning on-chain accounts & token distribution...</span>
              </div>
            ) : normalizedHolders.length > 0 ? (
              <div className="space-y-2.5">
                {/* Concentration Progress Meter */}
                {typeof holdersScan?.top10SupplyPercentage === "number" && (
                  <div className="space-y-1.5 p-2 rounded-xl bg-black/20 dark:bg-black/30 border border-inherit text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={theme.textMuted}>Top 10 Supply Concentration:</span>
                      <span className={`font-mono font-bold ${
                        holdersScan.top10SupplyPercentage > 50 ? "text-rose-500" : "text-emerald-500"
                      }`}>
                        {holdersScan.top10SupplyPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          holdersScan.top10SupplyPercentage > 50 ? "bg-rose-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(holdersScan.top10SupplyPercentage, 100)}%` }}
                      />
                    </div>
                    {holdersScan.top10SupplyPercentage > 50 && (
                      <p className="text-[10px] text-rose-500 font-medium">
                        ⚠️ Top 10 wallets control over 50% of supply. High dumping risk.
                      </p>
                    )}
                  </div>
                )}

                {/* D3 Donut Visualizer & Top Holders Grid — Takes Full Width */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                  {/* D3 Donut Chart with full animations */}
                  <div className="w-full">
                    <HoldersPieChart
                      topHolders={normalizedHolders}
                      top10SupplyPercentage={holdersScan?.top10SupplyPercentage}
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  {/* Ranked Top Holders List */}
                  <div className="space-y-1.5 p-2.5 rounded-xl bg-black/20 dark:bg-black/30 border border-inherit text-xs">
                    <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider font-semibold opacity-70 pb-1 border-b border-inherit">
                      <span>Holder Address</span>
                      <span>% Supply</span>
                    </div>
                    <div className="space-y-1 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                      {normalizedHolders.slice(0, 8).map((holder, hIdx) => (
                        <div
                          key={`${holder.ownerAddress}-${hIdx}`}
                          className={`flex items-center justify-between gap-2 p-1.5 rounded-lg font-mono text-[10.5px] border ${
                            isDarkMode ? "bg-zinc-900/60 border-zinc-800/60" : "bg-white border-slate-200/80"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="opacity-40 text-[9px]">#{hIdx + 1}</span>
                            <span className="truncate" title={holder.ownerAddress}>
                              {holder.ownerAddress.length > 10 ? `${holder.ownerAddress.slice(0, 4)}...${holder.ownerAddress.slice(-4)}` : holder.ownerAddress}
                            </span>
                            {holder.label && (
                              <span className="px-1 py-0.2 rounded text-[9px] font-sans bg-emerald-500/15 text-emerald-500 font-medium truncate max-w-[80px]">
                                {holder.label === "Simple7702Account" ? "7702" : holder.label}
                              </span>
                            )}
                            {!holder.label && holder.isContract && (
                              <span className="px-1 py-0.2 rounded text-[9px] font-sans bg-purple-500/15 text-purple-400 font-medium">
                                Contract
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="font-semibold text-slate-800 dark:text-zinc-300">
                              {holder.percentageRelativeToTotalSupply > 0
                                ? `${holder.percentageRelativeToTotalSupply.toFixed(2)}%`
                                : "<0.01%"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center flex flex-col items-center justify-center space-y-2">
                <p className="text-xs text-zinc-400">
                  {holdersScan?.error || "Holder distribution data ready to scan on-chain."}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFetchHolders(tokenAddress, pair.chainId, true, pair.pairAddress);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#ff6b35] text-white text-xs font-bold hover:bg-[#ff5722] transition-colors cursor-pointer"
                >
                  Scan On-Chain Holders
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Table Skeleton when Loading
  if (loading && pairs.length === 0) {
    return (
      <div className={`w-full overflow-hidden border rounded-2xl ${theme.bgCard} shadow-xs`}>
        {/* Mobile Skeleton: high density rows */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-zinc-800/40">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="p-3 flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-4 h-3 bg-slate-200 dark:bg-zinc-800 rounded" />
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-zinc-800" />
                <div className="space-y-1">
                  <div className="w-16 h-3 bg-slate-200 dark:bg-zinc-800 rounded" />
                  <div className="w-24 h-2 bg-slate-200 dark:bg-zinc-800/60 rounded" />
                </div>
              </div>
              <div className="space-y-1 text-right">
                <div className="w-14 h-3 bg-slate-200 dark:bg-zinc-800 rounded ml-auto" />
                <div className="w-10 h-2 bg-slate-200 dark:bg-zinc-800/60 rounded ml-auto" />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table Skeleton */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className={`border-b ${isDarkMode ? "bg-[#111218] border-zinc-800/80" : "bg-slate-50 border-slate-200"} text-[11px] font-semibold uppercase text-zinc-400`}>
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3 min-w-[200px]">Token</th>
                <th className="py-2.5 px-3 text-right">Price</th>
                <th className="py-2.5 px-3 text-right">24h Change</th>
                <th className="py-2.5 px-3 text-right">24h Vol</th>
                <th className="py-2.5 px-3 text-right">Liquidity</th>
                <th className="py-2.5 px-3 text-right">Market Cap</th>
                <th className="py-2.5 px-3">DEX</th>
                <th className="py-2.5 px-3 text-center">Score</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
              {Array.from({ length: 10 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-2.5 px-3 text-center">
                    <div className="h-3 w-4 bg-slate-200 dark:bg-zinc-800 rounded mx-auto" />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
                      <div className="space-y-1">
                        <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded" />
                        <div className="h-2.5 w-24 bg-slate-200 dark:bg-zinc-800/60 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded ml-auto" />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="h-3 w-12 bg-slate-200 dark:bg-zinc-800 rounded ml-auto" />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded ml-auto" />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="h-3 w-14 bg-slate-200 dark:bg-zinc-800 rounded ml-auto" />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded ml-auto" />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="h-4 w-18 bg-slate-200 dark:bg-zinc-800 rounded-full" />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="h-4 w-10 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto" />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="h-6 w-14 bg-slate-200 dark:bg-zinc-800 rounded mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Render Empty State if no pairs match
  if (pairs.length === 0) {
    return (
      <div className={`w-full py-12 border rounded-2xl ${theme.bgCard} text-center flex flex-col items-center justify-center p-6 shadow-xs`}>
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-2.5">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className={`text-sm font-bold ${theme.textTitle} mb-1`}>No tokens found</h3>
        <p className={`text-xs ${theme.textSub} max-w-sm`}>
          No tokens match your current filter and sort criteria in compact view.
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden border rounded-2xl ${theme.bgCard} shadow-xs transition-colors duration-200`}>
      {/* Super-Slim Status Sub-bar: Minimal vertical space */}
      <div className={`px-3 py-1.5 border-b ${isDarkMode ? "bg-[#111218]/80 border-zinc-800/80" : "bg-slate-50 border-slate-200"} flex items-center justify-between text-[11px]`}>
        <div className="flex items-center gap-1.5 font-mono text-zinc-400">
          <Layers className="w-3 h-3 text-[#ff6b35]" />
          <span>Showing <strong className={`font-semibold ${theme.textTitle}`}>{pairs.length}</strong> of {totalCount} tokens</span>
          {loading && (
            <span className="inline-flex items-center gap-1 text-[10px] text-[#ff6b35] font-medium animate-pulse ml-1">
              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
              Syncing
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
          <span className="hidden sm:inline opacity-70">Tap row for holders & trade details</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800/50 dark:bg-zinc-800/80 border border-zinc-700/50">
            Page {currentPage}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE COMPACT TOKEN LIST (md:hidden) — ZERO HORIZONTAL SCROLLING NEEDED */}
      {/* ========================================================================= */}
      {/* Mobile Sort Controls (md:hidden) */}
      <div className="xl:hidden px-2 py-1.5 border-b border-slate-100 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-[#13141f]/70 flex items-center gap-1 overflow-x-auto no-scrollbar text-[11px]">
        {([
          ["volume", "Vol"],
          ["liquidity", "Liq"],
          ["price", "Price"],
          ["priceChange", "24h"],
          ["marketCap", "MCap"],
          ["newest", "Age"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onSortChange(id)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium font-mono whitespace-nowrap transition cursor-pointer min-h-[30px] touch-manipulation ${
              sortBy === id
                ? "bg-[#ff6b35] text-white"
                : "bg-slate-200/70 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="xl:hidden divide-y divide-slate-100 dark:divide-zinc-800/60">
        {pairs.map((pair, idx) => {
          const rankIndex = (currentPage - 1) * pageSize + idx + 1;
          const cardKey = tokenIdentityKey(pair);
          const tokenAddress = pair.baseToken?.address || "";
          const isExpanded = Boolean(expandedRowKeys[cardKey]);
          const symbol = displaySymbol(pair);
          const name = displayName(pair, symbol);
          const priceChange = formatPercent(pair.priceChange?.h24);
          const socials = extractTokenSocials(pair);
          const hasSocials = Boolean(socials.tgUrl || socials.twProfileUrl || socials.twPostUrl || socials.webUrl || socials.discordUrl);

          const isNewToken = isNewerThan(pair.pairCreatedAt, 3600000);

          return (
            <div 
              key={cardKey} 
              className={`transition-colors duration-150 ${
                isExpanded 
                  ? (isDarkMode ? "bg-[#181926]/90" : "bg-slate-100/90") 
                  : (idx % 2 === 1 ? (isDarkMode ? "bg-[#12131d]/40" : "bg-slate-50/40") : "")
              }`}
            >
              {/* Main Compact Market-Discovery Row: Tap anywhere outside controls to expand */}
              <div
                onClick={() => onToggleExpandRow(cardKey, tokenAddress, pair.chainId, pair.pairAddress)}
                className="px-2.5 py-2.5 sm:px-3 sm:py-3 min-h-[72px] sm:min-h-[76px] flex items-center justify-between gap-1.5 sm:gap-2 cursor-pointer select-none active:bg-black/5 dark:active:bg-white/5 transition-colors"
              >
                {/* 1. LEFT: Rank + Token Identity (Flexible width to accommodate full symbol & name without clipping) */}
                <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-2.5 pr-1">
                  {/* Rank */}
                  <span className="font-mono text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 w-4 text-center flex-shrink-0 font-semibold">
                    {rankIndex}
                  </span>

                  {/* Shared parent container: Token Logo + anchored Chain indicator */}
                  <div className="relative flex-shrink-0 w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] aspect-square">
                    <TokenImage
                      imageUrl={pair.info?.imageUrl}
                      symbol={symbol}
                      address={tokenAddress}
                      chainId={pair.chainId}
                      className="w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] aspect-square"
                    />
                    <div 
                      className="absolute -bottom-1 -right-1 w-3.5 h-3.5 min-w-[14px] min-h-[14px] rounded-full bg-slate-950 p-px border border-zinc-700 shadow-2xs flex items-center justify-center overflow-hidden flex-shrink-0 z-10"
                      title={`Chain: ${pair.chainId?.toUpperCase()}`}
                      aria-label={`Chain: ${pair.chainId?.toUpperCase()}`}
                    >
                      <ChainIcon chainId={pair.chainId} />
                    </div>
                  </div>

                  {/* Token Identity: Symbol + CA on top line, Name + Badges on bottom line */}
                  <div className="min-w-0 flex-1 overflow-hidden flex flex-col justify-center">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className={`font-bold font-mono text-[12.5px] sm:text-[13.5px] tracking-tight ${theme.textTitle} truncate`}>
                        {symbol}
                      </span>

                      {/* 1-tap Copy CA sitting tightly beside token symbol */}
                      {tokenAddress && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopyAddress(tokenAddress);
                          }}
                          className={`p-1 rounded transition-colors relative before:absolute before:-inset-2 sm:before:hidden touch-manipulation cursor-pointer flex-shrink-0 ${
                            copiedAddress === tokenAddress ? "text-emerald-400" : "text-zinc-400 hover:text-[#ff6b35] opacity-60 hover:opacity-100"
                          }`}
                          title={`Copy CA: ${tokenAddress}`}
                          aria-label="Copy Contract Address"
                        >
                          {copiedAddress === tokenAddress ? (
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Subtitle: Full coin name (truncates with tooltip) + protocol badges */}
                    <div className="flex items-center gap-1 text-[9.5px] sm:text-[10px] text-zinc-500 dark:text-zinc-400 truncate leading-tight mt-0.5">
                      <span className="truncate opacity-85 font-medium" title={name}>
                        {name}
                      </span>
                      {isNewToken && (
                        <span className="px-1 py-0.2 rounded text-[7px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 uppercase flex-shrink-0">
                          NEW
                        </span>
                      )}
                      {pair.argusReusedSocials?.hasReusedSocials && (
                        <span className="px-1 py-0.2 rounded text-[7px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0" title="Reused Socials detected">
                          REUSED
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. CENTER: Fixed-width Grid Container for Market Information (Price, 24h Change, Volume, MC) */}
                <div className="w-[118px] max-w-[46%] shrink-0 min-w-0 grid grid-rows-2 gap-0.5 items-end justify-end text-right">
                  <div className="flex flex-col items-end gap-0.5 leading-none">
                    <FormattedPrice 
                      value={pair.priceUsd} 
                      className={`text-[12px] font-mono font-bold ${theme.textTitle} whitespace-nowrap`} 
                    />
                    <span 
                      className={`inline-flex items-center font-mono font-semibold text-[9px] px-1 py-0.5 rounded whitespace-nowrap ${
                        priceChange.isNeutral
                          ? "text-slate-600 dark:text-zinc-400"
                          : priceChange.isPositive
                            ? "text-emerald-500 bg-emerald-500/10"
                            : "text-rose-500 bg-rose-500/10"
                      }`}
                    >
                      {priceChange.text}
                    </span>
                  </div>

                  <div className="flex flex-col items-end text-[9px] font-mono text-zinc-500 dark:text-zinc-400 leading-tight">
                    <span className="whitespace-nowrap">
                      <span className="text-zinc-400 dark:text-zinc-500 font-sans font-normal">V:</span>{" "}
                      <span className="font-semibold text-slate-700 dark:text-zinc-200">{formatCurrency(volumeForDisplay(pair))}</span>
                    </span>
                    <span className="whitespace-nowrap">
                      <span className="text-zinc-400 dark:text-zinc-500 font-sans font-normal">MC:</span>{" "}
                      <span className="font-semibold text-slate-700 dark:text-zinc-200">{formatCurrency(marketCapOf(pair) ?? fdvOf(pair))}</span>
                    </span>
                  </div>
                </div>

                {/* 3. RIGHT: DEX Trading Action & High-Fidelity Socials Deck */}
                <div 
                  className="flex w-8 shrink-0 flex-col items-center justify-center gap-1 [&_[role=group]]:flex-col [&_[role=group]]:items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-center">
                    <DexIconContainer pair={pair} size="sm" />
                  </div>
                  {hasSocials && (
                    <SocialLinksRow pair={pair} size="compact" className="flex-col gap-1" />
                  )}
                </div>
              </div>

              {/* Mobile Expanded Drawer */}
              {isExpanded && (
                <div className={`border-t ${isDarkMode ? "border-zinc-800 bg-[#141522]" : "border-slate-200 bg-slate-100"}`}>
                  {renderExpandedDiagnostics(pair, tokenAddress)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP TABLE VIEW (hidden md:block) — WITH STICKY TOKEN COLUMNS          */}
      {/* ========================================================================= */}
      <div className="hidden xl:block overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[980px]">
          <thead>
            <tr className={`border-b ${isDarkMode ? "bg-[#111218]/90 border-zinc-800/90 text-zinc-400" : "bg-slate-100/90 border-slate-200 text-slate-600"} text-[11px] font-semibold uppercase tracking-wider select-none sticky top-0 z-20 backdrop-blur-md`}>
              {/* # Rank - Sticky on left */}
              <th 
                className={`py-2.5 px-3 w-12 text-center cursor-pointer group hover:text-[#ff6b35] transition-colors sticky left-0 z-20 ${
                  isDarkMode ? "bg-[#111218]" : "bg-slate-100"
                }`}
                onClick={() => onSortChange("none")}
                title="Sort by Trending"
              >
                <div className="flex items-center justify-center">
                  <span>#</span>
                  {renderSortIndicator("none")}
                </div>
              </th>

              {/* Token - Sticky on left next to rank */}
              <th 
                className={`py-2.5 px-3 min-w-[200px] cursor-pointer group hover:text-[#ff6b35] transition-colors sticky left-12 z-20 border-r ${
                  isDarkMode ? "bg-[#111218] border-zinc-800/80" : "bg-slate-100 border-slate-200"
                }`}
                onClick={() => onSortChange("newest")}
                title="Sort by Newest Token"
              >
                <div className="flex items-center">
                  <span>Token</span>
                  {renderSortIndicator("newest")}
                </div>
              </th>

              {/* Price */}
              <th 
                className="py-2.5 px-3 text-right cursor-pointer group hover:text-[#ff6b35] transition-colors"
                onClick={() => onSortChange("price")}
                title="Sort by Token Price (USD)"
              >
                <div className="flex items-center justify-end">
                  <span>Price (USD)</span>
                  {renderSortIndicator("price")}
                </div>
              </th>

              {/* 24h Change */}
              <th 
                className="py-2.5 px-3 text-right cursor-pointer group hover:text-[#ff6b35] transition-colors"
                onClick={() => onSortChange("priceChange")}
                title="Sort by 24h Price Change"
              >
                <div className="flex items-center justify-end">
                  <span>24h %</span>
                  {renderSortIndicator("priceChange")}
                </div>
              </th>

              {/* 24h Volume */}
              <th 
                className="py-2.5 px-3 text-right cursor-pointer group hover:text-[#ff6b35] transition-colors"
                onClick={() => onSortChange("volume")}
                title="Sort by 24h Volume"
              >
                <div className="flex items-center justify-end">
                  <span>24h Vol</span>
                  {renderSortIndicator("volume")}
                </div>
              </th>

              {/* Liquidity */}
              <th 
                className="py-2.5 px-3 text-right cursor-pointer group hover:text-[#ff6b35] transition-colors"
                onClick={() => onSortChange("liquidity")}
                title="Sort by Liquidity"
              >
                <div className="flex items-center justify-end">
                  <span>Liquidity</span>
                  {renderSortIndicator("liquidity")}
                </div>
              </th>

              {/* Market Cap */}
              <th 
                className="py-2.5 px-3 text-right cursor-pointer group hover:text-[#ff6b35] transition-colors"
                onClick={() => onSortChange("marketCap")}
                title="Sort by Market Cap"
              >
                <div className="flex items-center justify-end">
                  <span>MCap / FDV</span>
                  {renderSortIndicator("marketCap")}
                </div>
              </th>

              {/* DEX / Protocol */}
              <th className="py-2.5 px-3">
                <span>DEX & Pool</span>
              </th>

              {/* Safety Score */}
              <th className="py-2.5 px-3 text-center">
                <span>Score</span>
              </th>

              {/* Socials */}
              <th className="py-2.5 px-3 text-center">
                <span>Socials</span>
              </th>

              {/* Action */}
              <th className="py-2.5 px-3 text-center w-28">
                <span>Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/40 text-xs">
            {pairs.map((pair, idx) => {
              const rankIndex = (currentPage - 1) * pageSize + idx + 1;
              const cardKey = tokenIdentityKey(pair);
              const tokenAddress = pair.baseToken?.address || "";
              const isExpanded = Boolean(expandedRowKeys[cardKey]);
              const isHovered = hoveredRow === cardKey;

              const symbol = displaySymbol(pair);
              const name = displayName(pair, symbol);
              const priceChange = formatPercent(pair.priceChange?.h24);
              const score = calculateFinalDexHunterScore(pair);
              const socials = extractTokenSocials(pair);

              const isNewToken = isNewerThan(pair.pairCreatedAt, 3600000);

              const direct = clientTradeHref(pair, pair.primaryDexTradingUrl || getDexTradingUrl(pair, pair.primaryDex) || pair.url);
              const ownedLaunchpad = isPonsToken(pair) || isArgusToken(pair) || isPumpToken(pair);
              const dexTradeUrl = direct || (ownedLaunchpad ? null : `https://dexscreener.com/${normalizeChainName(pair.chainId)}/${pair.pairAddress || tokenAddress}`);

              return (
                <React.Fragment key={cardKey}>
                  <tr
                    onMouseEnter={() => setHoveredRow(cardKey)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => onToggleExpandRow(cardKey, tokenAddress, pair.chainId, pair.pairAddress)}
                    className={`transition-colors duration-150 cursor-pointer ${
                      isExpanded 
                        ? (isDarkMode ? "bg-[#1a1b28] border-b-0" : "bg-slate-100/90 border-b-0") 
                        : isHovered
                          ? (isDarkMode ? "bg-[#181926]/80" : "bg-slate-50")
                          : (idx % 2 === 1 ? (isDarkMode ? "bg-[#13141e]/50" : "bg-slate-50/40") : "")
                    }`}
                  >
                    {/* 1. Rank Index - Sticky on left */}
                    <td className={`py-2 px-3 text-center font-mono text-[11px] text-zinc-400 sticky left-0 z-10 ${
                      isExpanded
                        ? (isDarkMode ? "bg-[#1a1b28]" : "bg-slate-100/90")
                        : isHovered
                          ? (isDarkMode ? "bg-[#181926]" : "bg-slate-50")
                          : (idx % 2 === 1 ? (isDarkMode ? "bg-[#13141e]" : "bg-slate-50") : (isDarkMode ? "bg-[#151622]" : "bg-white"))
                    }`}>
                      <span className="inline-block w-6 text-center font-medium">
                        {rankIndex}
                      </span>
                    </td>

                    {/* 2. Token Identity - Sticky on left */}
                    <td className={`py-2 px-3 sticky left-12 z-10 border-r ${
                      isDarkMode ? "border-zinc-800/80" : "border-slate-200"
                    } ${
                      isExpanded
                        ? (isDarkMode ? "bg-[#1a1b28]" : "bg-slate-100/90")
                        : isHovered
                          ? (isDarkMode ? "bg-[#181926]" : "bg-slate-50")
                          : (idx % 2 === 1 ? (isDarkMode ? "bg-[#13141e]" : "bg-slate-50") : (isDarkMode ? "bg-[#151622]" : "bg-white"))
                    }`}>
                      <div className="flex items-center gap-2.5">
                        {/* Token Logo with Chain Overlay */}
                        <div className="relative flex-shrink-0">
                          <TokenImage
                            imageUrl={pair.info?.imageUrl}
                            symbol={symbol}
                            address={tokenAddress}
                            chainId={pair.chainId}
                          />
                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-black/90 p-px flex items-center justify-center overflow-hidden shadow-xs">
                            <ChainIcon chainId={pair.chainId} />
                          </div>
                        </div>

                        {/* Symbol & Name */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-bold font-mono tracking-tight text-[13px] ${theme.textTitle} hover:text-[#ff6b35] transition-colors truncate max-w-[110px]`}>
                              {symbol}
                            </span>

                            {isNewToken && (
                              <span className="px-1 py-0.2 rounded text-[8.5px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 uppercase">
                                NEW
                              </span>
                            )}

                            {pair.argusReusedSocials?.hasReusedSocials && (
                              <span className="px-1 py-0.2 rounded text-[8.5px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30" title="Serial launcher alert: Reused socials">
                                ⚠️ Reused
                              </span>
                            )}

                            {tokenAddress && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCopyAddress(tokenAddress);
                                }}
                                title={`Copy CA: ${tokenAddress}`}
                                className={`p-0.5 rounded transition-colors ${
                                  copiedAddress === tokenAddress
                                    ? "text-emerald-400 bg-emerald-500/10"
                                    : "text-zinc-400 hover:text-[#ff6b35] hover:bg-slate-200/80 dark:hover:text-white dark:hover:bg-zinc-800"
                                }`}
                              >
                                {copiedAddress === tokenAddress ? (
                                  <Check className="w-2.5 h-2.5" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>
                            )}
                          </div>

                          <div className={`text-[11px] ${theme.textMuted} truncate max-w-[140px]`}>
                            {name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 3. Price */}
                    <td className="py-2 px-3 text-right font-mono font-medium whitespace-nowrap">
                      <FormattedPrice 
                        value={pair.priceUsd} 
                        className={`text-xs ${theme.textTitle}`} 
                      />
                    </td>

                    {/* 4. 24h Change */}
                    <td className="py-2 px-3 text-right font-mono font-bold whitespace-nowrap">
                      <span 
                        className={`inline-flex items-center justify-end gap-0.5 px-1.5 py-0.5 rounded text-[11px] ${
                          priceChange.isNeutral
                            ? "text-slate-700 dark:text-zinc-300"
                            : priceChange.isPositive
                              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                              : "text-rose-600 dark:text-rose-400 bg-rose-500/10"
                        }`}
                      >
                        {!priceChange.isNeutral && (
                          priceChange.isPositive ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingUp className="w-3 h-3 rotate-180" />
                          )
                        )}
                        {priceChange.text}
                      </span>
                    </td>

                    {/* 5. 24h Volume */}
                    <td className="py-2 px-3 text-right font-mono font-medium text-slate-800 dark:text-zinc-200 whitespace-nowrap">
                      {formatCurrency(volumeForDisplay(pair))}
                    </td>

                    {/* 6. Liquidity */}
                    <td className="py-2 px-3 text-right font-mono font-medium text-slate-800 dark:text-zinc-200 whitespace-nowrap">
                      {formatCurrency(pair.liquidity?.usd ?? pair.totalLiquidityUsd)}
                    </td>

                    {/* 7. Market Cap */}
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 dark:text-zinc-100 whitespace-nowrap">
                      <div className="flex flex-col items-end leading-tight">
                        <span>{formatCurrency(marketCapOf(pair) ?? fdvOf(pair))}</span>
                        {fdvOf(pair) != null ? (
                          <span className="text-[10px] font-normal text-zinc-500">FDV {formatCurrency(fdvOf(pair))}</span>
                        ) : null}
                      </div>
                    </td>

                    {/* 8. DEX & Pool Badge */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <DexProtocolBadge pair={pair} />
                    </td>

                    {/* 9. Safety Score */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span 
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10.5px] font-bold border ${
                          score >= 80 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                            : score >= 50 
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                              : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}
                        title={`DexHunter Quality Score: ${score}/100`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>{score}</span>
                      </span>
                    </td>

                    {/* 10. Socials */}
                    <td className="py-2 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        {socials.tgUrl && (safeHref(socials.tgUrl) ? (
                          <a
                            href={safeHref(socials.tgUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Telegram Group"
                            className="p-1 rounded hover:text-sky-400 text-zinc-400 transition"
                          >
                            <TelegramIcon className="w-3.5 h-3.5 text-sky-400" />
                          </a>
                        ) : (
                          <span title="Telegram Group" className="p-1 rounded text-zinc-400">
                            <TelegramIcon className="w-3.5 h-3.5 text-sky-400" />
                          </span>
                        ))}
                        {socials.twProfileUrl && (safeHref(socials.twProfileUrl) ? (
                          <a
                            href={safeHref(socials.twProfileUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="X profile"
                            className="p-1 rounded hover:text-slate-900 dark:hover:text-white text-zinc-400 transition"
                          >
                            <XIcon className="w-3.5 h-3.5 text-zinc-300" />
                          </a>
                        ) : (
                          <span title="X profile" className="p-1 rounded text-zinc-400">
                            <XIcon className="w-3.5 h-3.5 text-zinc-300" />
                          </span>
                        ))}
                        {socials.twPostUrl && (safeHref(socials.twPostUrl) ? (
                          <a
                            href={safeHref(socials.twPostUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="X post"
                            className="p-1 rounded hover:text-slate-900 dark:hover:text-white text-zinc-400 transition"
                          >
                            <Feather className="w-3.5 h-3.5 text-zinc-300" />
                          </a>
                        ) : (
                          <span title="X post" className="p-1 rounded text-zinc-400">
                            <Feather className="w-3.5 h-3.5 text-zinc-300" />
                          </span>
                        ))}
                        {socials.webUrl && (safeHref(socials.webUrl) ? (
                          <a
                            href={safeHref(socials.webUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Website"
                            className="p-1 rounded hover:text-emerald-400 text-zinc-400 transition"
                          >
                            <Globe className="w-3.5 h-3.5 text-emerald-400" />
                          </a>
                        ) : (
                          <span title="Website" className="p-1 rounded text-zinc-400">
                            <Globe className="w-3.5 h-3.5 text-emerald-400" />
                          </span>
                        ))}
                        {socials.discordUrl && (safeHref(socials.discordUrl) ? (
                          <a
                            href={safeHref(socials.discordUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Discord Server"
                            className="p-1 rounded hover:text-[#5865F2] text-zinc-400 transition"
                          >
                            <DiscordIcon className="w-3.5 h-3.5 text-[#5865F2]" />
                          </a>
                        ) : (
                          <span title="Discord Server" className="p-1 rounded text-zinc-400">
                            <DiscordIcon className="w-3.5 h-3.5 text-[#5865F2]" />
                          </span>
                        ))}
                        {!socials.tgUrl && !socials.twProfileUrl && !socials.twPostUrl && !socials.webUrl && !socials.discordUrl && (
                          <span className="text-[11px] text-zinc-500">—</span>
                        )}
                      </div>
                    </td>

                    {/* 11. Actions */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* DEX Direct Trade Control */}
                        <DexIconContainer pair={pair} size="sm" />

                        {/* DexScreener Live Chart */}
                        {safeHref(`https://dexscreener.com/${normalizeChainName(pair.chainId)}/${pair.pairAddress || tokenAddress}`) ? (
                          <a
                            href={safeHref(`https://dexscreener.com/${normalizeChainName(pair.chainId)}/${pair.pairAddress || tokenAddress}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="DexScreener Live Chart"
                            className="w-6.5 h-6.5 min-w-[26px] min-h-[26px] rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-[#1c1d2c] hover:border-sky-500 hover:text-sky-400 text-zinc-400 transition-all flex items-center justify-center cursor-pointer"
                          >
                            <BarChart3 className="w-3 h-3" />
                          </a>
                        ) : (
                          <span
                            title="DexScreener Live Chart"
                            className="w-6.5 h-6.5 min-w-[26px] min-h-[26px] rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-[#1c1d2c] text-zinc-400 flex items-center justify-center"
                          >
                            <BarChart3 className="w-3 h-3" />
                          </span>
                        )}

                        {/* Expand Details Arrow */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpandRow(cardKey, tokenAddress, pair.chainId, pair.pairAddress);
                          }}
                          title={isExpanded ? "Collapse Token Details" : "Expand Token Details & Holders"}
                          className={`w-6.5 h-6.5 min-w-[26px] min-h-[26px] rounded-md border transition-all flex items-center justify-center cursor-pointer ${
                            isExpanded
                              ? "bg-[#ff6b35]/20 border-[#ff6b35] text-[#ff6b35]"
                              : "border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-[#1c1d2c] text-zinc-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${
                            isExpanded ? "rotate-180 text-[#ff6b35]" : ""
                          }`} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Desktop Expanded Inspector Sub-Row */}
                  {isExpanded && (
                    <tr className={`border-b ${isDarkMode ? "bg-[#141522] border-zinc-800" : "bg-slate-100 border-slate-300"}`}>
                      <td colSpan={11}>
                        {renderExpandedDiagnostics(pair, tokenAddress)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
