import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { 
  Search, 
  Flame, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  Globe, 
  SlidersHorizontal, 
  RefreshCw, 
  AlertTriangle, 
  Zap, 
  Info,
  Sun,
  Moon,
  Clock,
  Download,
  Filter,
  Pause,
  Play,
  X,
  BarChart3,
  Droplets,
  TrendingUp,
  Coins,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Shield,
  ShieldCheck,
  Users,
  Settings,
  Monitor,
  RotateCcw,
  HelpCircle,
  Layers,
  Radio,
  Compass,
  Edit3,
  MessageCircle,
  LayoutGrid,
  List,
  DollarSign
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { TokenPair } from "./types";
import { CompactTableView } from "./components/CompactTableView";
import { SocialLinksRow, extractTokenSocials } from "./components/TokenShared";
import { 
  aggregateMultiSourceTokens, 
  deduplicateAndMergeTokens, 
  enrichTokensWithMetadataConcurrently,
  exportTokensToCSV,
  getSingleSourceDisplayName,
  getDEXDisplayName,
  getDexLogo,
  getDexTradingUrl,
  getProviderDetails,
  getProviderPriorityRank,
  getCanonicalTokenLogo,
  calculateFinalDexHunterScore,
  calculateDiscoveryScore,
  calculateTokenQualityScore,
  classifyToken,
  type ProviderDetails,
  normalizeDexName,
  normalizeChainName,
  is1kMarketCap,
  hasSocialLinks,
  clearAllProviderCaches,
} from "./lib/aggregator";
import { holderCacheKey } from "./lib/tokenIdentity";
import { applyLoadedFilters, chainSelectionList, compareCreatedDesc, discoveryWindowStatus, displayName, displaySymbol, formatChainSelection, liveRowChanged, marketCapOf, fdvOf, ponsStageLabel, toggleChainSelection, volumeForDisplay } from "./lib/browseFilters";
import { isAddressQuery, matchesUserQuery, parseAddressQuery, resolveBrowseQuery, searchRank } from "./lib/addressQuery.js";
import { historyAction, parseBrowseSearch, sameBrowse, type BrowseLocation } from "./lib/browseLocation";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { FormattedPrice, formatPriceString } from "./lib/priceFormatter";
import { normalizeUri, IPFS_GATEWAYS } from "./lib/providers/metaplexMetadata";
import { HoldersPieChart } from "./components/HoldersPieChart";
import FilterPanel, { type FilterState } from "./components/FilterPanel";
import { acceptDiscoveryPoll, openDiscoveryPoll } from "./lib/discoveryPoll.js";
import { fetchDiscoveryPage, appendUniqueTokens, lookupIndexedAddress, searchLiveMarkets } from "./lib/providers/serverDiscovery";
import { clientTradeHref } from "./lib/launchLinks";
import { safeHref } from "./lib/safeUrl";
import { 
  getRpcHolderProvider, 
  executeTokenHoldersScan, 
  type TokenHoldersScanResult, 
  type IRpcHolderProvider 
} from "./lib/providers/holderScanner";

const holderListVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.06,
    },
  },
};

const holderItemVariants: Variants = {
  hidden: { opacity: 0, y: 7, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.24,
      ease: "easeOut",
    },
  },
};

export interface SortOptionItem {
  id: "volume" | "liquidity" | "priceChange" | "marketCap" | "newest" | "none" | "trending" | "price";
  label: string;
  shortLabel: string;
  description: string;
  explanation: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SORT_OPTIONS: SortOptionItem[] = [
  {
    id: "trending",
    label: "Trending",
    shortLabel: "Trending",
    description: "DexScreener & Axiom real-world momentum ranking",
    explanation: "Real-world trending ranking combining live boosts, multi-interval buy pressure (5m/1h/24h), verified socials, and pool freshness.",
    icon: Flame,
  },
  {
    id: "volume",
    label: "Volume (24h)",
    shortLabel: "Volume",
    description: "Highest recent trading activity",
    explanation: "Positions tokens with the greatest 24-hour USD trading volume at the top, surfacing pairs with the most active market turnover.",
    icon: BarChart3,
  },
  {
    id: "liquidity",
    label: "Liquidity",
    shortLabel: "Liquidity",
    description: "Deepest available pool liquidity",
    explanation: "Sorts tokens by total pooled liquidity in descending order, showing pairs with the deepest reserve depth and lowest trade slippage first.",
    icon: Droplets,
  },
  {
    id: "priceChange",
    label: "Price Change (24h)",
    shortLabel: "24h Gain",
    description: "Biggest recent price momentum",
    explanation: "Orders tokens by greatest 24-hour percentage price gain descending, highlighting top trending gainers and active breakout runners.",
    icon: TrendingUp,
  },
  {
    id: "marketCap",
    label: "Market Cap",
    shortLabel: "Market Cap",
    description: "Largest overall token valuations",
    explanation: "Arranges tokens by circulating market capitalization from highest to lowest, prioritizing large-cap and established valuations.",
    icon: Coins,
  },
  {
    id: "newest",
    label: "Newest First",
    shortLabel: "Newest",
    description: "Most recently discovered token pairs",
    explanation: "Orders tokens by initial pool creation timestamp, bringing the freshest mints, new bonding curves, and newly deployed pairs to the top.",
    icon: Sparkles,
  },
  {
    id: "price",
    label: "Price (USD)",
    shortLabel: "Price",
    description: "Highest unit token price",
    explanation: "Arranges tokens in descending order by individual token unit price in USD.",
    icon: DollarSign,
  },
];

const CornerBrackets = () => null;

const TelegramIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.543 6.498l-3.323 15.666c-.25 1.107-.906 1.38-1.834.861l-5.064-3.733-2.443 2.352c-.27.27-.498.498-1.02.498l.363-5.158 9.387-8.48c.408-.363-.089-.566-.633-.203l-11.603 7.306-5.002-1.564c-1.087-.34-1.109-1.087.227-1.608l19.554-7.535c.905-.34 1.696.204 1.388 1.596z"/>
  </svg>
);

const XIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const DiscordIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const TokenImage = ({ 
  imageUrl, 
  symbol, 
  address, 
  chainId 
}: { 
  imageUrl?: string; 
  symbol?: string; 
  address?: string; 
  chainId?: string; 
}) => {
  const [gatewayIdx, setGatewayIdx] = useState(0);
  const [useFallbackCdn, setUseFallbackCdn] = useState(false);
  const [imgError, setImgError] = useState(false);
  const firstLetter = symbol ? symbol.charAt(0).toUpperCase() : "?";

  const canonicalUrl = getCanonicalTokenLogo(chainId, address, symbol);

  useEffect(() => {
    setImgError(false);
    setGatewayIdx(0);
    setUseFallbackCdn(false);
  }, [imageUrl, address, canonicalUrl]);

  const normChain = chainId?.toLowerCase() === "polygon_pos" ? "polygon" : (chainId?.toLowerCase() || "solana");
  const cdnUrl = address ? `https://dd.dexscreener.com/ds-data/tokens/${normChain}/${address}.png` : undefined;

  const normalizedProvidedImage = imageUrl ? normalizeUri(imageUrl, gatewayIdx) : undefined;
  const rawSrc = canonicalUrl || (!useFallbackCdn && normalizedProvidedImage ? normalizedProvidedImage : cdnUrl);
  const currentSrc = rawSrc
    ? rawSrc.replace(/([?&])width=\d+/g, "$1width=64").replace(/([?&])height=\d+/g, "$1height=64")
    : undefined;

  if (!currentSrc || imgError) {
    return (
      <div 
        className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#1c1d2c] border border-slate-200 dark:border-zinc-700/50 flex items-center justify-center font-mono text-xs font-bold text-[#ff6b35] flex-shrink-0" 
        title={symbol}
      >
        {firstLetter}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={symbol || "Token Logo"}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        // Try fallback gateways if image is from IPFS
        if (imageUrl && (imageUrl.includes("ipfs") || imageUrl.startsWith("Qm") || imageUrl.startsWith("bafy")) && gatewayIdx < IPFS_GATEWAYS.length - 1) {
          setGatewayIdx((prev) => prev + 1);
        } else if (!canonicalUrl && !useFallbackCdn && cdnUrl && currentSrc !== cdnUrl) {
          setUseFallbackCdn(true);
        } else {
          setImgError(true);
        }
      }}
      className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-zinc-700/50 flex-shrink-0"
    />
  );
};

const ChainIcon = ({ chainId, fallbackClass }: { chainId: string; fallbackClass: string }) => {
  const [imgError, setImgError] = useState(false);
  const norm = normalizeChainName(chainId);
  
  const cdnUrls: Record<string, string> = {
    solana: "/chains/solana.png",
    bsc: "/chains/bsc.png",
    ethereum: "/chains/ethereum.png",
    base: "/chains/base.png",
    arbitrum: "/chains/arbitrum.png",
    polygon: "/chains/polygon.png",
    avalanche: "/chains/avalanche.png",
    cronos: "/chains/cronos.png",
    optimism: "/chains/optimism.png",
    robinhood: "/chains/robinhood.png",
    hyperevm: "/chains/hyperevm.png",
    arc: "/arc.png",
  };

  const logoUrl = cdnUrls[norm];
  const title = norm === "robinhood" ? "Robinhood" : norm === "arc" ? "Arc" : norm === "bsc" ? "BNB Chain" : norm === "hyperevm" ? "HyperEVM" : (norm || chainId);

  if (!logoUrl || imgError) {
    return (
      <span title={title} className={`inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-[9px] font-bold leading-none ${fallbackClass}`}>
        {(title || "?").slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={title}
      title={title}
      onError={() => setImgError(true)}
      referrerPolicy="no-referrer"
      className="w-[18px] h-[18px] object-contain flex-shrink-0 rounded-full"
    />
  );
};

const DexProtocolBadge = ({ pair }: { pair: TokenPair }) => {
  const [imgError, setImgError] = useState(false);
  const hasActiveMarketPool = Boolean(
    pair.isGraduated || 
    pair.marketStage === "graduated" || 
    pair.marketStage === "pumpswap" || 
    pair.marketStage === "raydium" ||
    (pair.primaryDex && ["pumpswap", "orca", "meteora", "raydium", "phoenix", "openbook", "lifinity"].includes(pair.primaryDex.toLowerCase())) ||
    pair.pairs?.some((pr) => ["pumpswap", "orca", "meteora", "raydium"].some((d) => (pr.dexName || pr.dexId || "").toLowerCase().includes(d)))
  );

  const isPumpBonding = Boolean(
    pair.chainId === "solana" &&
    (pair.isBondingCurve || 
    pair.marketStage === "bonding_curve" || 
    (pair.launchPlatform === "Pump.fun" && !pair.isGraduated && pair.dexId === "pumpfun")) &&
    !hasActiveMarketPool
  );
  const isGraduated = Boolean(hasActiveMarketPool || pair.isGraduated || pair.marketStage === "graduated" || pair.marketStage === "pumpswap" || pair.marketStage === "raydium");
  const progress = typeof pair.bondingProgress === "number" ? Math.min(100, Math.max(0, pair.bondingProgress)) : null;

  if (isPumpBonding) {
    const tradeUrl = safeHref(clientTradeHref(pair, getDexTradingUrl(pair, "Pump.fun")));
    const title = `Pump.fun Bonding Curve (${progress !== null ? `${progress}% complete` : "Active"})`;
    const inner = (
      <>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
        <span className="truncate">Bonding Curve</span>
        {progress !== null && (
          <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-[10px] font-mono">
            {progress.toFixed(0)}%
          </span>
        )}
        {tradeUrl ? <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" /> : null}
      </>
    );
    const className = "inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-2xs";
    if (!tradeUrl) return <span title={title} className={className}>{inner}</span>;
    return (
      <a
        href={tradeUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        title={title}
        className={`${className} hover:border-emerald-500/60 hover:bg-emerald-500/20 transition cursor-pointer group`}
      >
        {inner}
      </a>
    );
  }

  const stageLabel = ponsStageLabel(pair);
  let dexName = stageLabel || pair.primaryDex;
  if (
    dexName === "Raydium" &&
    (pair.launchPlatform === "Pump.fun" ||
      pair.dexes?.some((d) => d.toLowerCase().includes("pumpswap")) ||
      pair.sources?.some((s) => s.toLowerCase().includes("pumpswap")) ||
      pair.pairs?.some((pr) => (pr.dexName || pr.dexId || "").toLowerCase().includes("pumpswap")))
  ) {
    dexName = "PumpSwap";
  }
  if (!dexName) {
    dexName = pair.launchPlatform === "Pump.fun" ? (isGraduated ? "PumpSwap" : "Pump.fun") : normalizeDexName(pair.dexId || pair.primaryProvider);
  }
  const storedLogo = pair.primaryDexLogo?.endsWith("/argus.svg") ? "/argus.png" : pair.primaryDexLogo;
  const logoUrl = stageLabel
    ? getDexLogo("pons")
    : (dexName === "PumpSwap" ? getDexLogo("pumpswap") : storedLogo) || getDexLogo(dexName || (pair.launchPlatform === "Pump.fun" ? "pumpfun" : "dex"));
  const tradeUrl = safeHref(clientTradeHref(pair, (dexName === "PumpSwap" ? getDexTradingUrl(pair, "PumpSwap") : pair.primaryDexTradingUrl) || getDexTradingUrl(pair, dexName) || pair.url));
  const className = "inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-lg border border-slate-200/80 dark:border-zinc-800/80 bg-slate-100/80 dark:bg-zinc-800/50 text-slate-700 dark:text-zinc-300";
  const inner = (
    <>
      {logoUrl && !imgError ? (
        <img
          src={logoUrl}
          alt={dexName || "DEX"}
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
          className="w-3.5 h-3.5 object-contain flex-shrink-0"
        />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b35] flex-shrink-0" />
      )}
      <span className={`truncate ${stageLabel ? "max-w-[150px]" : "max-w-[85px]"}`}>{dexName || "DEX"}</span>
      {tradeUrl ? <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" /> : null}
    </>
  );
  if (!tradeUrl) {
    return <span title={dexName || "DEX"} className={className}>{inner}</span>;
  }

  return (
    <a
      href={tradeUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={`Trade on ${dexName || "DEX"}`}
      className={`${className} hover:text-[#ff6b35] hover:border-[#ff6b35]/40 hover:bg-[#ff6b35]/5 transition cursor-pointer group`}
    >
      {inner}
    </a>
  );
};

const DexProviderButton = ({ pair }: { pair: TokenPair }) => {
  // Never trust pair.url here, see the identical fix and reasoning in
  // src/components/TokenShared.tsx's copy of this same component.
  const pairOrAddress = pair.pairAddress || pair.baseToken?.address;
  const chartUrl = pairOrAddress
    ? `https://dexscreener.com/${normalizeChainName(pair.chainId)}/${pairOrAddress}`
    : null;

  if (!chartUrl) return null;

  return (
    <a
      href={chartUrl}
      target="_blank"
      rel="noreferrer noopener"
      onClick={(e) => e.stopPropagation()}
      title="Open DexScreener Chart & Pair Analytics"
      aria-label="DexScreener Chart"
      className="w-8 h-8 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-[#F8F9FC] dark:bg-[#1C1C24] shadow-2xs hover:-translate-y-0.5 hover:scale-105 hover:border-sky-500/50 hover:bg-sky-500/10 hover:shadow-xs active:scale-95 transition-all duration-200 ease-out cursor-pointer flex items-center justify-center group flex-shrink-0 ml-auto"
    >
      <img 
        src="https://dexscreener.com/favicon.ico" 
        alt="DexScreener Chart" 
        className="w-3.5 h-3.5 object-contain opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-200"
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    </a>
  );
};

const DexIcon = ({ dexId, pair }: { dexId?: string; pair?: TokenPair }) => {
  const [imgError, setImgError] = useState(false);
  if (!dexId) return null;
  const logoUrl = getDexLogo(dexId);
  const dexName = normalizeDexName(dexId);
  const tradeUrl = pair ? safeHref(clientTradeHref(pair, pair.primaryDexTradingUrl || getDexTradingUrl(pair, dexName) || pair.url)) : undefined;

  const content = (!logoUrl || imgError) ? (
    <span 
      className="text-[9.5px] uppercase font-mono font-bold tracking-wider text-gray-400 select-none" 
      title={`DEX: ${dexName.toUpperCase()}`}
    >
      {dexId}
    </span>
  ) : (
    <img
      src={logoUrl}
      alt={dexId}
      title={`Trade on ${dexName}`}
      onError={() => setImgError(true)}
      referrerPolicy="no-referrer"
      className="w-4 h-4 sm:w-4.5 sm:h-4.5 object-contain flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
    />
  );

  if (tradeUrl) {
    return (
      <a 
        href={tradeUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        onClick={(e) => e.stopPropagation()}
        title={`Trade on ${dexName}`}
        className="cursor-pointer group inline-flex items-center"
      >
        {content}
      </a>
    );
  }

  return content;
};

export interface NetworkDefinition {
  id: string;
  label: string;
  sublabel: string;
  category: "layer1" | "layer2" | "specialized";
  badge: string;
  accentColor: string;
  borderAccent: string;
  bgAccent: string;
  ringAccent: string;
  iconUrl: string;
  description: string;
}

export const NETWORK_DEFINITIONS: NetworkDefinition[] = [
  // Layer 1 Blockchains
  {
    id: "solana",
    label: "Solana",
    sublabel: "SVM High-Speed L1",
    category: "layer1",
    badge: "SVM L1",
    accentColor: "text-purple-400",
    borderAccent: "border-purple-500/50 hover:border-purple-400",
    bgAccent: "bg-purple-500/10",
    ringAccent: "ring-purple-500/30",
    iconUrl: "https://dd.dexscreener.com/ds-data/chains/solana.png",
    description: "PumpSwap, Meteora, Raydium, Orca, Phoenix, OpenBook, Lifinity & Pump.fun pools"
  },
  {
    id: "ethereum",
    label: "Ethereum",
    sublabel: "Mainnet EVM L1",
    category: "layer1",
    badge: "EVM L1",
    accentColor: "text-emerald-400",
    borderAccent: "border-emerald-500/50 hover:border-emerald-400",
    bgAccent: "bg-emerald-500/10",
    ringAccent: "ring-emerald-500/30",
    iconUrl: "https://dd.dexscreener.com/ds-data/chains/ethereum.png",
    description: "Uniswap v2/v3, Curve & SushiSwap pools"
  },
  {
    id: "bsc",
    label: "BNB Chain",
    sublabel: "BSC / Binance EVM",
    category: "layer1",
    badge: "BNB L1",
    accentColor: "text-amber-400",
    borderAccent: "border-amber-500/50 hover:border-amber-400",
    bgAccent: "bg-amber-500/10",
    ringAccent: "ring-amber-500/30",
    iconUrl: "https://dd.dexscreener.com/ds-data/chains/bsc.png",
    description: "PancakeSwap v2/v3 & Thena native pools"
  },
  {
    id: "avalanche",
    label: "Avalanche",
    sublabel: "C-Chain EVM L1",
    category: "layer1",
    badge: "AVAX L1",
    accentColor: "text-red-400",
    borderAccent: "border-red-500/50 hover:border-red-400",
    bgAccent: "bg-red-500/10",
    ringAccent: "ring-red-500/30",
    iconUrl: "https://dd.dexscreener.com/ds-data/chains/avalanche.png",
    description: "LFJ (Trader Joe) & Pangolin pools"
  },
  {
    id: "cronos",
    label: "Cronos",
    sublabel: "Crypto.com EVM L1",
    category: "layer1",
    badge: "CRO L1",
    accentColor: "text-blue-400",
    borderAccent: "border-blue-500/50 hover:border-blue-400",
    bgAccent: "bg-blue-500/10",
    ringAccent: "ring-blue-500/30",
    iconUrl: "https://dd.dexscreener.com/ds-data/chains/cronos.png",
    description: "VVS Finance & MM Finance pools"
  },
  // Layer 2 & Rollups
  {
    id: "base",
    label: "Base",
    sublabel: "Coinbase OP Stack",
    category: "layer2",
    badge: "EVM L2",
    accentColor: "text-sky-400",
    borderAccent: "border-sky-500/50 hover:border-sky-400",
    bgAccent: "bg-sky-500/10",
    ringAccent: "ring-sky-500/30",
    iconUrl: "https://dd.dexscreener.com/ds-data/chains/base.png",
    description: "Aerodrome & Uniswap Base native pools"
  },
  {
    id: "arbitrum",
    label: "Arbitrum One",
    sublabel: "Nitro Optimistic Rollup",
    category: "layer2",
    badge: "Rollup L2",
    accentColor: "text-cyan-400",
    borderAccent: "border-cyan-500/50 hover:border-cyan-400",
    bgAccent: "bg-cyan-500/10",
    ringAccent: "ring-cyan-500/30",
    iconUrl: "https://dd.dexscreener.com/ds-data/chains/arbitrum.png",
    description: "Camelot & Uniswap Arbitrum pools"
  },
  {
    id: "polygon",
    label: "Polygon PoS",
    sublabel: "Polygon EVM",
    category: "layer2",
    badge: "PoS L2",
    accentColor: "text-purple-400",
    borderAccent: "border-purple-500/50 hover:border-purple-400",
    bgAccent: "bg-purple-500/10",
    ringAccent: "ring-purple-500/30",
    iconUrl: "https://dd.dexscreener.com/ds-data/chains/polygon.png",
    description: "QuickSwap & Uniswap Polygon pools"
  },
  {
    id: "robinhood",
    label: "Robinhood",
    sublabel: "Robinhood Chain",
    category: "specialized",
    badge: "EVM Appchain",
    accentColor: "text-emerald-400",
    borderAccent: "border-emerald-500/50 hover:border-emerald-400",
    bgAccent: "bg-emerald-500/10",
    ringAccent: "ring-emerald-500/30",
    iconUrl: "https://dd.dexscreener.com/ds-data/chains/robinhood.png",
    description: "Uniswap Robinhood pairs"
  },
  {
    id: "arc",
    label: "Arc",
    sublabel: "Arc Blockchain",
    category: "specialized",
    badge: "EVM L1",
    accentColor: "text-amber-400",
    borderAccent: "border-amber-500/50 hover:border-amber-400",
    bgAccent: "bg-amber-500/10",
    ringAccent: "ring-amber-500/30",
    iconUrl: "/arc.png",
    description: "Uniswap Arc & Arc DEX native pairs"
  },
];

const formatSparklineVol = (val?: number | null): string => {
  if (val === undefined || val === null || isNaN(val) || val <= 0) return "";
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
  return `$${val.toFixed(0)}`;
};

interface PriceHistoryPoint {
  time: string;
  price: number;
  volume?: number;
  changePct?: number;
}

// Construct historical price points based on current price, percentage changes, or bonding curve progression
const getPriceHistoryPoints = (pair: TokenPair): PriceHistoryPoint[] | null => {
  const currentPrice = Number(pair.priceUsd) || 0;
  if (currentPrice <= 0) return null;

  const hasM5 = pair.priceChange?.m5 !== undefined && pair.priceChange?.m5 !== null;
  const hasH1 = pair.priceChange?.h1 !== undefined && pair.priceChange?.h1 !== null;
  const hasH6 = pair.priceChange?.h6 !== undefined && pair.priceChange?.h6 !== null;
  const hasH24 = pair.priceChange?.h24 !== undefined && pair.priceChange?.h24 !== null;

  const m5 = Number(pair.priceChange?.m5);
  const h1 = Number(pair.priceChange?.h1);
  const h6 = Number(pair.priceChange?.h6);
  const h24 = Number(pair.priceChange?.h24);

  const vol24h = Number(pair.volume?.h24 || 0);
  const vol6h = Number(pair.volume?.h6 || 0);
  const vol1h = Number(pair.volume?.h1 || 0);
  const vol5m = Number(pair.volume?.m5 || 0);

  const priceAt = (changePct: number) => {
    if (!Number.isFinite(changePct)) return currentPrice;
    const denom = 1 + changePct / 100;
    if (!Number.isFinite(denom) || denom <= 0) return currentPrice;
    return Math.max(0, currentPrice / denom);
  };

  const points: PriceHistoryPoint[] = [];
  if (hasH24 && Number.isFinite(h24)) {
    points.push({ time: "24h ago", price: priceAt(h24), volume: vol24h || undefined, changePct: h24 });
  }
  if (hasH6 && Number.isFinite(h6)) {
    points.push({ time: "6h ago", price: priceAt(h6), volume: vol6h || undefined, changePct: h6 });
  }
  if (hasH1 && Number.isFinite(h1)) {
    points.push({ time: "1h ago", price: priceAt(h1), volume: vol1h || undefined, changePct: h1 });
  }
  if (hasM5 && Number.isFinite(m5)) {
    points.push({ time: "5m ago", price: priceAt(m5), volume: vol5m || undefined, changePct: m5 });
  }
  if (points.length === 0) {
    if (!(currentPrice > 0)) return null;
    return [
      { time: "Launch", price: currentPrice, changePct: 0 },
      { time: "Now", price: currentPrice, changePct: 0 },
    ];
  }
  points.push({ time: "Now", price: currentPrice, volume: vol24h || undefined, changePct: hasH24 && Number.isFinite(h24) ? h24 : 0 });
  return points;
};

interface TokenSparklineProps {
  pair: TokenPair;
  priceChange24h?: number;
  isDarkMode: boolean;
}

const TokenSparkline = React.memo(({ pair, priceChange24h, isDarkMode }: TokenSparklineProps) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const points = useMemo(() => {
    return getPriceHistoryPoints(pair);
  }, [pair.priceUsd, pair.priceChange?.h24, pair.priceChange?.h6, pair.priceChange?.h1, pair.priceChange?.m5, pair.volume?.h24, pair.volume?.h6, pair.volume?.h1, pair.volume?.m5, pair.bondingProgress]);

  const chartData = useMemo(() => {
    if (!points || points.length === 0) return null;
    const prices = points.map(p => p.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = (maxP - minP) || (minP === 0 ? 1 : minP * 0.01);

    const w = 300;
    const h = 60;
    const padTop = 10;
    const padBottom = 8;
    const effH = h - padTop - padBottom;

    const coords = points.map((pt, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = maxP === minP ? h / 2 : h - padBottom - ((pt.price - minP) / range) * effH;
      return { x, y, pt };
    });

    let pathD = `M ${coords[0].x.toFixed(1)},${coords[0].y.toFixed(1)}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? i : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2 < coords.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      pathD += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }

    const areaD = `${pathD} L ${w},${h} L 0,${h} Z`;

    return { coords, pathD, areaD, w, h };
  }, [points]);

  if (!chartData) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center relative select-none">
        <div className={`w-full border-t border-dashed ${isDarkMode ? "border-zinc-800" : "border-slate-300"} absolute top-1/2 -translate-y-1/2`} />
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-xs relative z-10 ${
          isDarkMode ? "text-zinc-500 bg-zinc-950/80" : "text-slate-500 bg-white/80"
        }`}>
          0%
        </span>
      </div>
    );
  }

  const isPositive = priceChange24h !== undefined ? priceChange24h >= 0 : true;
  const strokeColor = priceChange24h !== undefined
    ? (isPositive 
        ? (isDarkMode ? "#6ebd80" : "#16a34a") 
        : (isDarkMode ? "#cc5a5a" : "#dc2626"))
    : (isDarkMode ? "#ff6b35" : "#ea580c");

  const cleanChain = (pair.chainId || "chain").replace(/[^a-zA-Z0-9]/g, "");
  const cleanAddr = (pair.pairAddress || "addr").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  const gradientId = `spark-grad-${cleanChain}-${cleanAddr}`;

  const handleTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || !chartData || !e.touches[0]) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, touchX / rect.width));
    const idx = Math.round(ratio * (chartData.coords.length - 1));
    setHoverIndex(idx);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !chartData) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
    const idx = Math.round(ratio * (chartData.coords.length - 1));
    setHoverIndex(idx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const hoverItem = hoverIndex !== null ? chartData.coords[hoverIndex] : null;

  // Calculate safe X percentage for tooltip positioning (clamped between 22% and 78%)
  const rawPct = hoverItem ? (hoverItem.x / chartData.w) * 100 : 50;
  const clampedPct = Math.min(76, Math.max(24, rawPct));

  // Anti-overlap positioning: When the price curve is in the upper half of the sparkline (y < 30),
  // position the tooltip at the bottom so it never covers the critical path or the active cursor!
  // When the curve is in the lower half (y >= 30), position the tooltip at the top.
  const isUpperHalf = hoverItem ? hoverItem.y < 30 : false;

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
      onTouchEnd={handleMouseLeave}
      className="w-full h-full relative cursor-crosshair select-none touch-none"
    >
      <svg 
        viewBox={`0 0 ${chartData.w} ${chartData.h}`} 
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        <path d={chartData.areaD} fill={`url(#${gradientId})`} />
        <path d={chartData.pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {hoverItem && (
          <>
            <line 
              x1={hoverItem.x} 
              y1={0} 
              x2={hoverItem.x} 
              y2={chartData.h} 
              stroke={isDarkMode ? "#ff6b35" : "#64748b"} 
              strokeWidth="1.5" 
              strokeDasharray="3 3" 
            />
            <circle 
              cx={hoverItem.x} 
              cy={hoverItem.y} 
              r="4.5" 
              fill={strokeColor} 
              stroke={isDarkMode ? "#0b0c10" : "#ffffff"} 
              strokeWidth="2" 
            />
          </>
        )}
      </svg>

      {/* Floating Tooltip — responsive, anti-overlap positioning that stays off the chart's critical path */}
      {hoverItem && (
        <div 
          className={`absolute pointer-events-none z-30 px-2 py-1 text-[10px] font-mono shadow-xl rounded-lg border transform -translate-x-1/2 whitespace-nowrap transition-all duration-75 backdrop-blur-md ${
            isUpperHalf ? "bottom-1.5" : "top-1.5"
          } ${
            isDarkMode 
              ? "bg-zinc-950/95 border-zinc-700 text-white shadow-black/80" 
              : "bg-white/95 border-slate-300 text-slate-900 shadow-slate-400/50"
          }`}
          style={{ 
            left: `${clampedPct}%`,
          }}
        >
          {/* Header row: Time label + Interval % change */}
          <div className="flex items-center gap-2 justify-between">
            <span className="text-[9.5px] text-zinc-400 font-medium">{hoverItem.pt.time}</span>
            {hoverItem.pt.changePct !== undefined && (
              <span className={`text-[9.5px] font-bold ${
                hoverItem.pt.changePct >= 0 
                  ? (isDarkMode ? "text-emerald-400" : "text-emerald-600") 
                  : (isDarkMode ? "text-rose-400" : "text-rose-600")
              }`}>
                {hoverItem.pt.changePct >= 0 ? "+" : ""}{hoverItem.pt.changePct.toFixed(1)}%
              </span>
            )}
          </div>

          {/* Metric row: Price + Volume */}
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`font-bold ${isPositive ? (isDarkMode ? "text-emerald-400" : "text-emerald-600") : (isDarkMode ? "text-rose-400" : "text-rose-600")}`}>
              {formatPriceString(hoverItem.pt.price)}
            </span>
            {hoverItem.pt.volume ? (
              <span className="text-[9px] text-zinc-400 font-mono">
                Vol: {formatSparklineVol(hoverItem.pt.volume)}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
});

export type ThemeMode = "system" | "dark" | "light";

/**
 * Abbreviate crypto contract addresses (CA) or address hashes for clean UI display.
 * Formats EVM addresses as: 0x1234...5678, and Solana/Base58 CAs as: 4k3Dy...8x9Z.
 */
export const abbreviateSearchQuery = (query: string): string => {
  const trimmed = query.trim();
  if (!trimmed) return "";

  // If contains spaces, treat as search terms unless it has a prefix like "ca: <address>"
  const hasSpaces = /\s/.test(trimmed);

  if (!hasSpaces) {
    // EVM Address check (starts with 0x or 0X, length >= 12)
    if (/^0x[a-fA-F0-9]{10,}$/i.test(trimmed)) {
      return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
    }
    // Solana / Base58 / Crypto CA (alphanumeric, length >= 16)
    if (/^[a-zA-Z0-9]{16,}$/.test(trimmed)) {
      return `${trimmed.slice(0, 5)}...${trimmed.slice(-4)}`;
    }
  } else {
    // Handle prefixed CA searches like "ca: 0x..." or "contract: 4k3D..."
    const prefixMatch = trimmed.match(/^(ca|contract|token|address):\s*(0x[a-fA-F0-9]{10,}|[a-zA-Z0-9]{16,})$/i);
    if (prefixMatch) {
      const label = prefixMatch[1];
      const addr = prefixMatch[2];
      const abbr = addr.toLowerCase().startsWith("0x")
        ? `${addr.slice(0, 6)}...${addr.slice(-4)}`
        : `${addr.slice(0, 5)}...${addr.slice(-4)}`;
      return `${label}: ${abbr}`;
    }
  }

  return trimmed;
};

export default function App() {
  const routeSearch = useSearch({ strict: false });
  const [browseSeed] = useState(() => parseBrowseSearch(routeSearch as Record<string, unknown>));
  const navigate = useNavigate();
  // Theme mode configuration: "system" | "dark" | "light"
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme_mode") || localStorage.getItem("theme");
      if (saved === "system" || saved === "dark" || saved === "light") {
        setThemeMode(saved as ThemeMode);
      }
    } catch {
      // ignore storage access errors
    }
  }, []);

  // Real-time listener for OS color scheme adjustments (e.g. system sunrise/sunset)
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Ensure immediate sync
    setSystemPrefersDark(mediaQuery.matches);

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemThemeChange);
      return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleSystemThemeChange);
      return () => (mediaQuery as any).removeListener(handleSystemThemeChange);
    }
  }, []);

  // Compute effective dark mode flag based on themeMode & system preference
  const isDarkMode = themeMode === "system" ? systemPrefersDark : themeMode === "dark";

  // Dedicated updater to sync theme mode and persist to localStorage
  const updateThemeMode = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      localStorage.setItem("theme_mode", mode);
      localStorage.setItem("theme", mode);
    } catch {
      // ignore
    }
  }, []);

  // Quick toggle helper for header quick-switch button
  const toggleTheme = useCallback(() => {
    const nextMode: ThemeMode = isDarkMode ? "light" : "dark";
    updateThemeMode(nextMode);
  }, [isDarkMode, updateThemeMode]);

  // Sync theme with document root, html, body, and CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (isDarkMode) {
      root.classList.add("dark");
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
      root.style.colorScheme = "dark";
      root.style.backgroundColor = "#08090d";
      body.classList.add("dark");
      body.classList.remove("light");
      body.setAttribute("data-theme", "dark");
      body.style.colorScheme = "dark";
      body.style.backgroundColor = "#08090d";
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.setAttribute("data-theme", "light");
      root.style.colorScheme = "light";
      root.style.backgroundColor = "#f8f9fa";
      body.classList.remove("dark");
      body.classList.add("light");
      body.setAttribute("data-theme", "light");
      body.style.colorScheme = "light";
      body.style.backgroundColor = "#f8f9fa";
    }
  }, [isDarkMode]);

  // Modern design style pairs for dark/light theme configurations
  const theme = useMemo(() => {
    return {
      bgMain: isDarkMode ? "bg-[#0b0c10] text-zinc-100 instrument-grid" : "bg-[#f8f9fa] text-slate-900 instrument-grid-light",
      bgHeader: isDarkMode ? "bg-[#111218]/90 border-zinc-800/80 text-white backdrop-blur-md" : "bg-white/90 border-slate-200/80 text-slate-900 shadow-2xs backdrop-blur-md",
      bgCard: isDarkMode ? "bg-[#151620]/90 border-zinc-800/80" : "bg-white border-slate-200/80 shadow-2xs",
      bgInner: isDarkMode ? "bg-[#181926] border-zinc-800/60" : "bg-slate-50/80 border-slate-200/60",
      bgTabs: isDarkMode ? "bg-[#14151f] border-zinc-800/80" : "bg-slate-100/80 border-slate-200/80",
      textTitle: isDarkMode ? "text-zinc-100" : "text-slate-900 font-bold",
      textSub: isDarkMode ? "text-zinc-400" : "text-slate-600",
      textMuted: isDarkMode ? "text-zinc-500" : "text-slate-400",
      borderMain: isDarkMode ? "border-zinc-800/80" : "border-slate-200/80",
      btnSecondary: isDarkMode ? "bg-zinc-800/60 hover:bg-zinc-700/80 border-zinc-700/60 text-zinc-300 hover:text-white" : "bg-slate-100/90 hover:bg-slate-200/80 border-slate-200 text-slate-700 hover:text-slate-900 shadow-none",
      inputStyle: isDarkMode 
        ? "bg-[#12131c] border-zinc-800 text-white placeholder-zinc-500 focus:border-[#ff6b35] transition-all" 
        : "bg-slate-50 border-slate-200/90 text-slate-900 placeholder-slate-400 focus:border-[#ff6b35] transition-all"
    };
  }, [isDarkMode]);

  // Navigation & Search States
  const [activeTab, setActiveTab] = useState<"trending" | "latest" | "fresh_mints">(browseSeed.tab);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isSearchPanelCollapsed, setIsSearchPanelCollapsed] = useState<boolean>(false);
  
  // Pagination, Modals & Layout Responsiveness States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showFiltersMobile, setShowFiltersMobile] = useState<boolean>(false);
  const [showSortModal, setShowSortModal] = useState<boolean>(false);
  const [hoveredSortTooltip, setHoveredSortTooltip] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showExportConfirm, setShowExportConfirm] = useState<boolean>(false);
  const PAGE_SIZE = 100;

  // Dashboard View Mode: "cards" (grid) or "compact" (data-dense table view)
  const [feedPaused, setFeedPaused] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "compact">("cards");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("dexhunter_view_mode");
      if (saved === "cards" || saved === "compact") {
        setViewMode(saved);
        return;
      }
    } catch {
      // ignore
    }
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setViewMode("compact");
    }
  }, []);

  const updateViewMode = useCallback((mode: "cards" | "compact") => {
    setViewMode(mode);
    try {
      localStorage.setItem("dexhunter_view_mode", mode);
    } catch {
      // ignore
    }
  }, []);

  // Search Focus Management Refs & Handlers
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchTriggerBtnRef = useRef<HTMLButtonElement | null>(null);

  const handleOpenSearch = useCallback(() => {
    setShowSortModal(false);
    setShowSettingsModal(false);
    setShowFiltersMobile(false);
    setIsSearchOpen(true);
    setIsSearchPanelCollapsed(false);
    requestAnimationFrame(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
    });
  }, []);

  const handleCloseSearch = useCallback(() => {
    setIsSearchOpen(false);
    if (searchInputRef.current && document.activeElement === searchInputRef.current) {
      searchInputRef.current.blur();
    }
    requestAnimationFrame(() => {
      searchTriggerBtnRef.current?.focus();
    });
  }, []);

  // Filter Drawer Focus Management Refs & Handlers
  const filterDrawerRef = useRef<HTMLDivElement | null>(null);
  const filterTriggerBtnRef = useRef<HTMLButtonElement | null>(null);
  const filterCloseBtnRef = useRef<HTMLButtonElement | null>(null);

  const handleOpenFilterDrawer = useCallback(() => {
    setShowSortModal(false);
    setShowSettingsModal(false);
    setShowFiltersMobile(true);
  }, []);

  const handleCloseFilterDrawer = useCallback(() => {
    setShowFiltersMobile(false);
    requestAnimationFrame(() => {
      filterTriggerBtnRef.current?.focus();
    });
  }, []);

  // Settings Modal Focus Management Refs & Handlers
  const settingsModalRef = useRef<HTMLDivElement | null>(null);
  const settingsTriggerDesktopRef = useRef<HTMLButtonElement | null>(null);
  const settingsTriggerMobileRef = useRef<HTMLButtonElement | null>(null);
  const settingsCloseBtnRef = useRef<HTMLButtonElement | null>(null);

  const handleCloseSettingsModal = useCallback(() => {
    setShowSettingsModal(false);
    requestAnimationFrame(() => {
      if (settingsTriggerDesktopRef.current && settingsTriggerDesktopRef.current.offsetParent !== null) {
        settingsTriggerDesktopRef.current.focus();
      } else {
        settingsTriggerMobileRef.current?.focus();
      }
    });
  }, []);

  // Focus trap, initial focus, and Escape key navigation for Settings Modal
  useEffect(() => {
    if (!showSettingsModal) return;

    const timer = setTimeout(() => {
      if (settingsCloseBtnRef.current) {
        settingsCloseBtnRef.current.focus();
      } else if (settingsModalRef.current) {
        const firstFocusable = settingsModalRef.current.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCloseSettingsModal();
      } else if (e.key === "Tab" && settingsModalRef.current) {
        const focusableEls: HTMLElement[] = Array.from(
          settingsModalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el): el is HTMLElement => el !== null && (el as HTMLElement).offsetParent !== null);

        if (focusableEls.length === 0) return;

        const firstEl = focusableEls[0];
        const lastEl = focusableEls[focusableEls.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSettingsModal, handleCloseSettingsModal]);

  // Focus trap, initial focus, and Escape key navigation for Filter Drawer
  useEffect(() => {
    if (!showFiltersMobile) return;

    // Focus close button or first interactive element inside drawer on open
    const timer = setTimeout(() => {
      if (filterCloseBtnRef.current) {
        filterCloseBtnRef.current.focus();
      } else if (filterDrawerRef.current) {
        const firstFocusable = filterDrawerRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCloseFilterDrawer();
      } else if (e.key === "Tab" && filterDrawerRef.current) {
        const focusableEls: HTMLElement[] = Array.from(
          filterDrawerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el): el is HTMLElement => el !== null && (el as HTMLElement).offsetParent !== null);

        if (focusableEls.length === 0) return;

        const firstEl = focusableEls[0];
        const lastEl = focusableEls[focusableEls.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showFiltersMobile, handleCloseFilterDrawer]);

  // Expanded Token Cards & Token Holders Cache via unified RPC provider pattern
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(() =>
    browseSeed.token ? { [browseSeed.token]: true } : {}
  );
  const [detailKey, setDetailKey] = useState(browseSeed.token);
  const [tokenHoldersData, setTokenHoldersData] = useState<Record<string, TokenHoldersScanResult>>({});

  const fetchTokenHolders = useCallback(async (tokenAddress: string, chainId?: string, force: boolean = false, pairAddress?: string) => {
    if (!tokenAddress) return;
    const key = holderCacheKey(chainId, tokenAddress);
    if (!force && (tokenHoldersData[key]?.topHolders?.length || tokenHoldersData[key]?.loading)) {
      return;
    }

    const provider = getRpcHolderProvider(chainId, tokenAddress);

    setTokenHoldersData(prev => ({
      ...prev,
      [key]: {
        loading: true,
        totalHolders: prev[key]?.totalHolders || 0,
        totalSupplyFormatted: prev[key]?.totalSupplyFormatted,
        decimals: prev[key]?.decimals,
        supplier: prev[key]?.supplier,
        creator: prev[key]?.creator,
        deployer: prev[key]?.deployer,
        creationTx: prev[key]?.creationTx,
        creationTimestamp: prev[key]?.creationTimestamp,
        source: prev[key]?.source,
        chain: provider.chainId,
        providerKey: provider.providerKey,
        providerName: provider.chainDisplayName,
        topHolders: prev[key]?.topHolders || [],
        top10SupplyPercentage: prev[key]?.top10SupplyPercentage || 0,
      }
    }));

    try {
      const data = await executeTokenHoldersScan(tokenAddress, provider, undefined, pairAddress);
      setTokenHoldersData(prev => ({
        ...prev,
        [key]: {
          ...data,
          chain: data.chain || provider.chainId,
          providerKey: provider.providerKey,
          providerName: provider.chainDisplayName,
        }
      }));
    } catch (err: any) {
      setTokenHoldersData(prev => ({
        ...prev,
        [key]: {
          loading: false,
          totalHolders: 0,
          topHolders: [],
          top10SupplyPercentage: 0,
          chain: provider.chainId,
          providerKey: provider.providerKey,
          providerName: provider.chainDisplayName,
          error: err.message || "Failed to scan on-chain holders",
        }
      }));
    }
  }, [tokenHoldersData]);

  const toggleCardExpanded = (pairKey: string, tokenAddress: string, chainId?: string, pairAddress?: string) => {
    const nextState = !expandedCards[pairKey];
    setExpandedCards(prev => ({ ...prev, [pairKey]: nextState }));
    setDetailKey(nextState ? pairKey : "");
    if (nextState && tokenAddress) {
      fetchTokenHolders(tokenAddress, chainId, false, pairAddress);
    }
  };

  // Keyboard shortcuts:
  // 's' to open the search bar
  // 'f' to open the filter drawer
  // 'Esc' to close any active modal or menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. 'Esc' to close any active modal or menu
      if (e.key === "Escape") {
        let closedSomething = false;

        if (showSettingsModal) {
          handleCloseSettingsModal();
          closedSomething = true;
        }
        if (showExportConfirm) {
          setShowExportConfirm(false);
          closedSomething = true;
        }
        if (showFiltersMobile) {
          handleCloseFilterDrawer();
          closedSomething = true;
        }
        if (showSortModal) {
          setShowSortModal(false);
          setHoveredSortTooltip(null);
          closedSomething = true;
        }
        if (isSearchOpen) {
          handleCloseSearch();
          closedSomething = true;
        }
        if (hoveredSortTooltip) {
          setHoveredSortTooltip(null);
          closedSomething = true;
        }

        if (closedSomething) {
          e.preventDefault();
        }
        return;
      }

      // Do not intercept if user is pressing browser/system modifier combinations (e.g., Ctrl+S, Cmd+F, Alt+F4)
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      // Do not trigger shortcuts when typing inside form fields, textareas, content-editable, etc.
      const target = e.target as HTMLElement | null;
      const isInput = target && (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable ||
        target.getAttribute("contenteditable") === "true" ||
        target.getAttribute("contenteditable") === "" ||
        target.getAttribute("role") === "textbox"
      );
      if (isInput) {
        return;
      }

      const keyLower = e.key.toLowerCase();

      // 2. 's' to open the search bar
      if (keyLower === "s") {
        e.preventDefault();
        handleOpenSearch();
        return;
      }

      // 3. 'f' to open the filter drawer
      if (keyLower === "f") {
        e.preventDefault();
        handleOpenFilterDrawer();
        return;
      }

      // 4. 'v' to toggle view mode (Cards vs Compact Table)
      if (keyLower === "v") {
        e.preventDefault();
        setViewMode(prev => {
          const next = prev === "cards" ? "compact" : "cards";
          try {
            localStorage.setItem("dexhunter_view_mode", next);
          } catch {}
          return next;
        });
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showSettingsModal,
    showFiltersMobile,
    showSortModal,
    isSearchOpen,
    hoveredSortTooltip,
    handleCloseSettingsModal,
    handleCloseFilterDrawer,
    handleCloseSearch,
    handleOpenSearch,
    handleOpenFilterDrawer,
  ]);
  
  // API Data
  const [searchQuery, setSearchQuery] = useState(browseSeed.q);
  const [searchNote, setSearchNote] = useState<string | null>(null);
  const [pairs, setPairs] = useState<TokenPair[]>([]);
  const [rawResults, setRawResults] = useState<TokenPair[]>([]);
  const [ageFilter, setAgeFilter] = useState<string>(browseSeed.age);
  const [trending, setTrending] = useState<any[]>([]);
  const [latestListings, setLatestListings] = useState<any[]>([]);
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Advanced Filters
  const [chain, setChain] = useState<string>(browseSeed.chain);
  const [selectedDex, setSelectedDex] = useState<string>(browseSeed.dex);
  const metricSeed = (value: string): number | "" => (value === "" ? "" : Number(value));
  const [minVolume, setMinVolume] = useState<number | "">(metricSeed(browseSeed.minVolume));
  const [maxVolume, setMaxVolume] = useState<number | "">(metricSeed(browseSeed.maxVolume));
  const [minLiquidity, setMinLiquidity] = useState<number | "">(metricSeed(browseSeed.minLiquidity));
  const [minMarketCap, setMinMarketCap] = useState<number | "">(metricSeed(browseSeed.minMarketCap));
  const [maxMarketCap, setMaxMarketCap] = useState<number | "">(metricSeed(browseSeed.maxMarketCap));
  const [minPriceChange, setMinPriceChange] = useState<number | "">(metricSeed(browseSeed.minPriceChange));
  const [pagedResults, setPagedResults] = useState<TokenPair[] | null>(null);
  const [indexTotal, setIndexTotal] = useState<number | null>(null);
  const [indexCursor, setIndexCursor] = useState<string | null>(null);
  const [indexPaging, setIndexPaging] = useState(false);
  const [indexPageError, setIndexPageError] = useState<string | null>(null);
  const [indexRetry, setIndexRetry] = useState(0);
  const pageReqRef = useRef(0);
  const windowReqRef = useRef(0);
  const loadedCountRef = useRef(0);
  loadedCountRef.current = rawResults.length;
  const serverPagedRef = useRef(false);
  const wasServerPagedRef = useRef(false);
  const chainBeforeLaunchpadRef = useRef<string | null>(null);
  const paintFlightRef = useRef(0);
  const listedModeRef = useRef("");
  const serverPaged = !searchQuery.trim() && (ageFilter === "all" || ageFilter === "1m");
  serverPagedRef.current = serverPaged;
  
  const handleSelectChain = useCallback((newChain: string) => {
    chainBeforeLaunchpadRef.current = null;
    setChain(newChain === "all" ? "all" : formatChainSelection([newChain]));
  }, []);
  const toggleChain = useCallback((id: string) => {
    chainBeforeLaunchpadRef.current = null;
    setChain((prev) => toggleChainSelection(prev, id));
  }, []);

  // Social Filters
  const [reqTelegram, setReqTelegram] = useState(browseSeed.tg);
  const [reqXProfile, setReqXProfile] = useState(browseSeed.xp);
  const [reqXPost, setReqXPost] = useState(browseSeed.xpost);
  const [reqDiscord, setReqDiscord] = useState(browseSeed.dc);
  const [reqWebsite, setReqWebsite] = useState(browseSeed.web);
  const [verifiedOnly, setVerifiedOnly] = useState(browseSeed.verified);

  // Toast state for newly added tokens during auto-polling
  const [freshMintsToast, setFreshMintsToast] = useState<{ id: number; count: number } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerFreshMintsToast = useCallback((count: number) => {
    if (count <= 0) return;
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setFreshMintsToast({ id: Date.now(), count });
    toastTimeoutRef.current = setTimeout(() => {
      setFreshMintsToast(null);
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);
  
  // Sorting Mode
  const [sortBy, setSortBy] = useState<"volume" | "liquidity" | "priceChange" | "marketCap" | "newest" | "momentum" | "none" | "trending" | "price">(
    browseSeed.sort as "volume" | "liquidity" | "priceChange" | "marketCap" | "newest" | "momentum" | "none" | "trending" | "price"
  );

  const browseNow = useMemo<BrowseLocation>(() => ({
    tab: activeTab,
    q: searchQuery.trim(),
    chain,
    dex: selectedDex,
    age: ageFilter,
    sort: sortBy,
    minVolume: minVolume === "" ? "" : String(minVolume),
    maxVolume: maxVolume === "" ? "" : String(maxVolume),
    minLiquidity: minLiquidity === "" ? "" : String(minLiquidity),
    minMarketCap: minMarketCap === "" ? "" : String(minMarketCap),
    maxMarketCap: maxMarketCap === "" ? "" : String(maxMarketCap),
    minPriceChange: minPriceChange === "" ? "" : String(minPriceChange),
    tg: reqTelegram,
    tw: false,
    xp: reqXProfile,
    xpost: reqXPost,
    dc: reqDiscord,
    web: reqWebsite,
    verified: verifiedOnly,
    token: detailKey,
  }), [
    activeTab, searchQuery, chain, selectedDex, ageFilter, sortBy,
    minVolume, maxVolume, minLiquidity, minMarketCap, maxMarketCap, minPriceChange,
    reqTelegram, reqXProfile, reqXPost, reqDiscord, reqWebsite, verifiedOnly, detailKey,
  ]);

  const urlBrowseRef = useRef(browseSeed);
  const startBrowseRef = useRef(browseSeed);
  const hasPushedRef = useRef(false);

  const applyBrowse = useCallback((loc: BrowseLocation) => {
    setActiveTab(loc.tab);
    setSearchQuery(loc.q);
    setChain(loc.chain);
    setSelectedDex(loc.dex);
    setAgeFilter(loc.age);
    setSortBy(loc.sort as typeof sortBy);
    setMinVolume(loc.minVolume === "" ? "" : Number(loc.minVolume));
    setMaxVolume(loc.maxVolume === "" ? "" : Number(loc.maxVolume));
    setMinLiquidity(loc.minLiquidity === "" ? "" : Number(loc.minLiquidity));
    setMinMarketCap(loc.minMarketCap === "" ? "" : Number(loc.minMarketCap));
    setMaxMarketCap(loc.maxMarketCap === "" ? "" : Number(loc.maxMarketCap));
    setMinPriceChange(loc.minPriceChange === "" ? "" : Number(loc.minPriceChange));
    setReqTelegram(loc.tg);
    setReqXProfile(loc.xp);
    setReqXPost(loc.xpost);
    setReqDiscord(loc.dc);
    setReqWebsite(loc.web);
    setVerifiedOnly(loc.verified);
    setDetailKey(loc.token);
    setExpandedCards(loc.token ? { [loc.token]: true } : {});
  }, []);

  // State changed because the user clicked something. Write it into router history.
  useEffect(() => {
    if (sameBrowse(browseNow, urlBrowseRef.current)) return;
    const action = historyAction(urlBrowseRef.current, browseNow, hasPushedRef.current);
    urlBrowseRef.current = browseNow;
    if (action === "none") return;
    if (action === "push") hasPushedRef.current = true;
    void navigate({
      to: "/",
      search: browseNow as never,
      replace: action === "replace",
    });
  }, [browseNow, navigate]);

  // Back or Forward changed the URL. Apply it without writing history again.
  const parsedRoute = useMemo(
    () => parseBrowseSearch(routeSearch as Record<string, unknown>),
    [routeSearch]
  );
  useEffect(() => {
    if (sameBrowse(parsedRoute, urlBrowseRef.current)) return;
    urlBrowseRef.current = parsedRoute;
    hasPushedRef.current = !sameBrowse(parsedRoute, startBrowseRef.current);
    applyBrowse(parsedRoute);
  }, [parsedRoute, applyBrowse]);
  
  // Feedback state for clipboard copying
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Quick Preset tags
  const quickSearchTags = ["sol", "base", "meme", "pepe", "ai", "dog", "elon", "pump"];

  const copiedAddressRef = useRef<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clipboard Copier
  const copyToClipboard = (text: string) => {
    if (!text) return;
    copiedAddressRef.current = text;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedAddress(text);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => {
      if (copiedAddressRef.current === text) {
        copiedAddressRef.current = null;
        setCopiedAddress(null);
      }
    }, 2000);
  };

  // AbortControllers for request cancellation across re-runs
  const searchAbortRef = React.useRef<AbortController | null>(null);
  const trendingAbortRef = React.useRef<AbortController | null>(null);
  const latestAbortRef = React.useRef<AbortController | null>(null);
  const freshMintsAbortRef = React.useRef<AbortController | null>(null);
  const freshMintsBgAbortRef = React.useRef<AbortController | null>(null);

  // Market Data Freshness Timestamp Tracker

  /**
   * Diffing and identity-preserving merge strategy for background token updates.
   * Preserves unchanged object references so React does not trigger unnecessary
   * re-renders, preventing UI flickering, search input interruptions, and pagination jumps.
   * If sortByAge is true, preserves/enforces newest-first creation ordering. Otherwise, preserves exact incoming list ordering.
   */
  const diffAndMergeTokenList = useCallback((
    prevList: TokenPair[], 
    nextList: TokenPair[], 
    sortByAge: boolean = false
  ): { merged: TokenPair[]; hasChanged: boolean } => {
    if (!prevList || prevList.length === 0) {
      return { merged: nextList, hasChanged: true };
    }
    if (!nextList || nextList.length === 0) {
      return { merged: prevList, hasChanged: false };
    }

    const nextMap = new Map<string, TokenPair>();
    for (const item of nextList) {
      const key = `${item.chainId || "solana"}:${item.baseToken?.address || item.pairAddress}`.toLowerCase();
      nextMap.set(key, item);
    }

    let hasChanged = false;
    const mergedList: TokenPair[] = [];
    const seenKeys = new Set<string>();

    for (const prevItem of prevList) {
      const key = `${prevItem.chainId || "solana"}:${prevItem.baseToken?.address || prevItem.pairAddress}`.toLowerCase();
      seenKeys.add(key);
      const nextItem = nextMap.get(key);

      if (!nextItem) {
        mergedList.push(prevItem);
      } else {
        // Check for changes in volatile financial, progress, or metadata fields
        if (liveRowChanged(prevItem, nextItem)) {
          // Field-level shallow update, preserving non-mutated sub-objects and primary branding
          const updatedItem: TokenPair = {
            ...prevItem,
            ...nextItem,
            info: {
              ...prevItem.info,
              ...nextItem.info,
              imageUrl: nextItem.info?.imageUrl || prevItem.info?.imageUrl,
              websites: (nextItem.info?.websites && nextItem.info.websites.length > 0) ? nextItem.info.websites : prevItem.info?.websites,
              socials: (nextItem.info?.socials && nextItem.info.socials.length > 0) ? nextItem.info.socials : prevItem.info?.socials,
            },
            baseToken: { ...prevItem.baseToken, ...nextItem.baseToken },
            primaryDex: nextItem.primaryDex || prevItem.primaryDex,
            primaryDexLogo: nextItem.primaryDexLogo || prevItem.primaryDexLogo,
            primaryDexTradingUrl: nextItem.primaryDexTradingUrl || prevItem.primaryDexTradingUrl,
          };
          mergedList.push(updatedItem);
          hasChanged = true;
        } else {
          // Strict object identity preservation: keep previous reference unchanged
          mergedList.push(prevItem);
        }
      }
    }

    // Append any newly discovered tokens from nextList
    for (const nextItem of nextList) {
      const key = `${nextItem.chainId || "solana"}:${nextItem.baseToken?.address || nextItem.pairAddress}`.toLowerCase();
      if (!seenKeys.has(key)) {
        mergedList.push(nextItem);
        hasChanged = true;
      }
    }

    if (sortByAge) {
      mergedList.sort(compareCreatedDesc);
    }

    return { merged: mergedList, hasChanged };
  }, []);

  const paintDiscoveryPool = useCallback(async (
    mode: "trending" | "latest" | "fresh_mints",
    signal: AbortSignal,
    targetChain?: string
  ) => {
    paintFlightRef.current += 1;
    const switching = listedModeRef.current !== mode;
    if (switching) {
      listedModeRef.current = mode;
      setPairs([]);
      setRawResults([]);
      setIndexTotal(null);
    }
    try {
      const activeChain = "all";
      const paint = (page: Awaited<ReturnType<typeof fetchDiscoveryPage>>) => {
        if (signal.aborted || !page.tokens.length) return;
        // Merge into whatever the venues already added. Replacing here wiped
        // the deeper feed back down to the thin index page.
        const incoming = mode === "fresh_mints" || mode === "latest"
          ? [...page.tokens].sort(compareCreatedDesc)
          : page.tokens;
        const byAge = mode !== "trending";
        const merge = (prev: TokenPair[]) =>
          prev.length ? diffAndMergeTokenList(prev, incoming, byAge).merged : incoming;
        setPairs(merge);
        setRawResults(merge);
        if (!serverPagedRef.current) {
          setIndexTotal((total) => Math.max(total ?? 0, incoming.length, page.total || 0));
          setIndexCursor(page.nextCursor);
          setIndexPageError(null);
        }
        setLoading(false);
      };
      paint(await fetchDiscoveryPage({ mode, chainId: activeChain, age: "1w", limit: 600 }));
      if (signal.aborted) return;
      paint(await fetchDiscoveryPage({ mode, chainId: activeChain, age: "1w", limit: 5000 }));
    } catch {
      // The indexed pool is a fast first paint. The full aggregate still runs.
    } finally {
      paintFlightRef.current = Math.max(0, paintFlightRef.current - 1);
      // Empty copy waits until this page actually finishes. Clearing earlier
      // flashed "nothing qualifies" while the index was still answering.
      if (!signal.aborted && paintFlightRef.current === 0) setLoading(false);
    }
  }, [diffAndMergeTokenList]);

  // 1. Fetch Search pairs with multi-source aggregation & AbortController
  const fetchSearchPairs = useCallback(async (queryStr: string, targetChain?: string, forceRefresh?: boolean) => {
    if (!queryStr.trim()) return;

    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortRef.current = controller;
    const signal = controller.signal;

    setLoading(true);
    setError(null);
    try {
      const qTrim = queryStr.trim();
      const parsed = parseAddressQuery(qTrim);
      const providerQuery = isAddressQuery(parsed) && "address" in parsed ? parsed.address : qTrim;
      if (isAddressQuery(parsed)) {
        const looked = await lookupIndexedAddress(qTrim, "all", signal);
        if (signal.aborted) return;
        if (looked.ambiguous || parsed.kind === "evm-prefix" || parsed.kind === "solana-prefix" || looked.tokens.length) {
          setPairs(looked.ambiguous ? [] : looked.tokens);
          setRawResults(looked.ambiguous ? [] : looked.tokens);
          setCurrentPage(1);
          setSearchNote(null);
          setError(null);
          return;
        }
      }
      const [live, canonicalTokens] = await Promise.all([
        isAddressQuery(parsed) ? Promise.resolve([] as TokenPair[]) : searchLiveMarkets(providerQuery, signal),
        aggregateMultiSourceTokens("search", providerQuery, signal, "all", forceRefresh).catch((err: any) => {
          if (err?.name === "AbortError" || signal.aborted) throw err;
          return [] as TokenPair[];
        }),
      ]);
      if (signal.aborted) return;
      const merged = appendUniqueTokens(live, canonicalTokens).filter((token) => matchesUserQuery(token, qTrim));
      setPairs(merged);
      setRawResults(merged);
      setCurrentPage(1);
      setSearchNote(null);

      // Progressive background enrichment for missing logos/socials
      enrichTokensWithMetadataConcurrently(merged, signal)
        .then((enriched) => {
          if (signal.aborted) return;
          setPairs((prev) => {
            const { merged, hasChanged } = diffAndMergeTokenList(prev, enriched, false);
            return hasChanged ? merged : prev;
          });
          setRawResults((prev) => {
            const { merged, hasChanged } = diffAndMergeTokenList(prev, enriched, false);
            return hasChanged ? merged : prev;
          });
        })
        .catch(() => {});
    } catch (err: any) {
      if (err?.name === "AbortError" || signal.aborted) return;
      setError(err?.message || "Something went wrong while searching.");
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [diffAndMergeTokenList]);

  // 2. Fetch Multi-Source Trending Boosts & Pools with AbortController
  const fetchTrendingBoosts = useCallback(async (targetChain?: string, forceRefresh?: boolean) => {
    if (trendingAbortRef.current) {
      trendingAbortRef.current.abort();
    }
    latestAbortRef.current?.abort();
    freshMintsAbortRef.current?.abort();
    const controller = new AbortController();
    trendingAbortRef.current = controller;
    const signal = controller.signal;

    setLoading(true);
    setError(null);
    void paintDiscoveryPool("trending", signal, targetChain);
    try {
      const activeChain = "all";
      const canonicalTokens = await aggregateMultiSourceTokens("trending", undefined, signal, activeChain, forceRefresh);
      if (signal.aborted) return;
      if (canonicalTokens.length > 0) {
        setPairs((prev) => diffAndMergeTokenList(prev, canonicalTokens, false).merged);
        setRawResults((prev) => diffAndMergeTokenList(prev, canonicalTokens, false).merged);
      }

      // Progressive background enrichment for missing logos/socials
      enrichTokensWithMetadataConcurrently(canonicalTokens, signal)
        .then((enriched) => {
          if (signal.aborted) return;
          setPairs((prev) => {
            const { merged, hasChanged } = diffAndMergeTokenList(prev, enriched, false);
            return hasChanged ? merged : prev;
          });
          setRawResults((prev) => {
            const { merged, hasChanged } = diffAndMergeTokenList(prev, enriched, false);
            return hasChanged ? merged : prev;
          });
        })
        .catch(() => {});
    } catch (err: any) {
      if (err?.name === "AbortError" || signal.aborted) return;
      setError(err?.message || "Could not retrieve multi-source trending tokens.");
    } finally {
      if (!signal.aborted && paintFlightRef.current === 0) {
        setLoading(false);
      }
    }
  }, [diffAndMergeTokenList, paintDiscoveryPool]);

  // 3. Fetch Multi-Source Latest Listings with AbortController
  const fetchLatestListings = useCallback(async (targetChain?: string, forceRefresh?: boolean) => {
    if (latestAbortRef.current) {
      latestAbortRef.current.abort();
    }
    trendingAbortRef.current?.abort();
    freshMintsAbortRef.current?.abort();
    const controller = new AbortController();
    latestAbortRef.current = controller;
    const signal = controller.signal;

    setLoading(true);
    setError(null);
    void paintDiscoveryPool("latest", signal, targetChain);
    try {
      const activeChain = "all";
      const canonicalTokens = await aggregateMultiSourceTokens("latest", undefined, signal, activeChain, forceRefresh);
      if (signal.aborted) return;
      if (canonicalTokens.length > 0) {
        setPairs((prev) => diffAndMergeTokenList(prev, canonicalTokens, true).merged);
        setRawResults((prev) => diffAndMergeTokenList(prev, canonicalTokens, true).merged);
      }

      // Progressive background enrichment for missing logos/socials
      enrichTokensWithMetadataConcurrently(canonicalTokens, signal)
        .then((enriched) => {
          if (signal.aborted) return;
          setPairs((prev) => {
            const { merged, hasChanged } = diffAndMergeTokenList(prev, enriched, false);
            return hasChanged ? merged : prev;
          });
          setRawResults((prev) => {
            const { merged, hasChanged } = diffAndMergeTokenList(prev, enriched, false);
            return hasChanged ? merged : prev;
          });
        })
        .catch(() => {});
    } catch (err: any) {
      if (err?.name === "AbortError" || signal.aborted) return;
      setError(err?.message || "Could not retrieve multi-source latest listings.");
    } finally {
      if (!signal.aborted && paintFlightRef.current === 0) {
        setLoading(false);
      }
    }
  }, [diffAndMergeTokenList, paintDiscoveryPool]);

  // 4. Fetch Fresh Mints (Moralis-backed Pump.fun proxy + on-chain discovery) sorted by creation time
  const fetchFreshMints = useCallback(async (isBackground = false, targetChain?: string, forceRefresh?: boolean) => {
    const abortRef = isBackground ? freshMintsBgAbortRef : freshMintsAbortRef;
    if (abortRef.current) {
      abortRef.current.abort();
    }
    if (!isBackground) {
      trendingAbortRef.current?.abort();
      latestAbortRef.current?.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    if (!isBackground) {
      setLoading(true);
      setError(null);
      void paintDiscoveryPool("fresh_mints", signal, targetChain);
    }
    try {
      const activeChain = "all";
      const canonicalTokens = await aggregateMultiSourceTokens("fresh_mints", undefined, signal, activeChain, forceRefresh);
      if (signal.aborted) return;
      // Ensure sorted strictly by creation time descending
      const sortedByAge = [...canonicalTokens].sort((a, b) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0));

      if (isBackground) {
        // Detect newly added tokens during auto-polling and trigger subtle toast
        setRawResults((prev) => {
          const prevKeys = new Set(
            prev.map(p => `${p.chainId}:${(p.pairAddress || p.baseToken?.address || "").toLowerCase()}`)
          );
          let newTokensCount = 0;
          for (const item of sortedByAge) {
            const key = `${item.chainId}:${(item.pairAddress || item.baseToken?.address || "").toLowerCase()}`;
            if (!prevKeys.has(key)) {
              newTokensCount++;
            }
          }
          if (newTokensCount > 0) {
            triggerFreshMintsToast(newTokensCount);
          }
          const { merged, hasChanged } = diffAndMergeTokenList(prev, sortedByAge, true);
          return hasChanged ? merged : prev;
        });
        // Apply diffing strategy: merge updates and preserve object identity
        setPairs((prev) => {
          const { merged, hasChanged } = diffAndMergeTokenList(prev, sortedByAge, true);
          return hasChanged ? merged : prev;
        });
        // Background polling never resets currentPage, preserving user pagination position
      } else if (sortedByAge.length > 0) {
        setPairs((prev) => diffAndMergeTokenList(prev, sortedByAge, true).merged);
        setRawResults((prev) => diffAndMergeTokenList(prev, sortedByAge, true).merged);
      }

      // Progressive enrichment: tokens still missing a logo or socials, mainly the
      // newest bonding-curve mints, get a second, targeted re-fetch in the background.
      enrichTokensWithMetadataConcurrently(sortedByAge, signal)
        .then((enriched) => {
          if (signal.aborted) return;
          setPairs((prev) => {
            const { merged, hasChanged } = diffAndMergeTokenList(prev, enriched, true);
            return hasChanged ? merged : prev;
          });
          setRawResults((prev) => {
            const { merged, hasChanged } = diffAndMergeTokenList(prev, enriched, true);
            return hasChanged ? merged : prev;
          });
        })
        .catch(() => {});
    } catch (err: any) {
      if (err?.name === "AbortError" || signal.aborted) return;
      if (!isBackground) {
        setError(err?.message || "Could not retrieve fresh mints.");
      }
    } finally {
      if (!signal.aborted && !isBackground && paintFlightRef.current === 0) {
        setLoading(false);
      }
    }
  }, [diffAndMergeTokenList, triggerFreshMintsToast, paintDiscoveryPool]);

  // Centralized Force-Refresh handler to bypass all local & provider caches and fetch live market data
  const handleManualRefresh = useCallback(() => {
    clearAllProviderCaches();
    if (searchQuery.trim()) {
      fetchSearchPairs(searchQuery, undefined, true);
    } else if (activeTab === "trending") {
      fetchTrendingBoosts(undefined, true);
    } else if (activeTab === "latest") {
      fetchLatestListings(undefined, true);
    } else if (activeTab === "fresh_mints") {
      fetchFreshMints(false, undefined, true);
    }
  }, [searchQuery, activeTab, fetchSearchPairs, fetchTrendingBoosts, fetchLatestListings, fetchFreshMints]);

  // Set action on Tab Click & Reset Page with 300ms Debounce on Search Query or Chain Change
  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchSearchPairs(searchQuery);
      } else if (activeTab === "trending") {
        fetchTrendingBoosts();
      } else if (activeTab === "latest") {
        fetchLatestListings();
      } else if (activeTab === "fresh_mints") {
        fetchFreshMints(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [activeTab, searchQuery, fetchSearchPairs, fetchTrendingBoosts, fetchLatestListings, fetchFreshMints]);

  // New coins drop in every 3 seconds. Pause freezes the list in place.
  const indexListQuery = {
    chainId: chain,
    dex: selectedDex,
    minVolume,
    maxVolume,
    minLiquidity,
    minMarketCap,
    maxMarketCap,
    minPriceChange,
    telegram: reqTelegram,
    xProfile: reqXProfile,
    xPost: reqXPost,
    discord: reqDiscord,
    website: reqWebsite,
    verified: verifiedOnly,
  };
  useEffect(() => {
    const generation = openDiscoveryPoll(windowReqRef.current);
    windowReqRef.current = generation;
    if (feedPaused || searchQuery.trim()) return;
    const tick = () => {
      const mode = activeTab === "trending" ? "trending" : activeTab === "latest" ? "latest" : "fresh_mints";
      if (serverPagedRef.current) {
        fetchDiscoveryPage({
          mode,
          age: ageFilter,
          limit: 200,
          ...indexListQuery,
        })
          .then((page) => {
            if (!acceptDiscoveryPoll(generation, windowReqRef.current, serverPagedRef.current, true, page.tokens.length)) return;
            const byAge = mode !== "trending";
            setPagedResults((prev) => {
              const { merged, hasChanged } = diffAndMergeTokenList(prev ?? [], page.tokens, byAge);
              return hasChanged ? merged : prev;
            });
            setIndexTotal(page.total);
          })
          .catch(() => {
            // Background poll failures must not clobber the page-request error state.
          });
        return;
      }
      fetchDiscoveryPage({
        mode,
        age: ageFilter,
        limit: 200,
        ...indexListQuery,
      })
        .then((page) => {
          if (!acceptDiscoveryPoll(generation, windowReqRef.current, serverPagedRef.current, false, page.tokens.length)) return;
          const byAge = mode !== "trending";
          setRawResults((prev) => {
            const { merged, hasChanged } = diffAndMergeTokenList(prev, page.tokens, byAge);
            return hasChanged ? merged : prev;
          });
          setPairs((prev) => {
            const { merged, hasChanged } = diffAndMergeTokenList(prev, page.tokens, byAge);
            return hasChanged ? merged : prev;
          });
        })
        .catch(() => {});
    };
    const intervalId = setInterval(tick, 3000);
    return () => clearInterval(intervalId);
  }, [activeTab, searchQuery, feedPaused, diffAndMergeTokenList, ageFilter, chain, selectedDex, minVolume, maxVolume, minLiquidity, minMarketCap, maxMarketCap, minPriceChange, reqTelegram, reqXProfile, reqXPost, reqDiscord, reqWebsite, verifiedOnly]);

  // Windows that do not fit in the first week-page, and any numeric server
  // filter, read the whole index one cursor at a time. 1h and 6h are small
  // enough to follow until the displayed set matches the index count.
  useEffect(() => {
    if (!serverPaged) {
      pageReqRef.current += 1;
      setIndexPaging(false);
      if (wasServerPagedRef.current) {
        wasServerPagedRef.current = false;
        setPagedResults(null);
        setIndexTotal(null);
        setIndexCursor(null);
        setIndexPageError(null);
      }
      return;
    }
    wasServerPagedRef.current = true;
    setPagedResults(null);
    setIndexCursor(null);
    setIndexTotal(null);
    const req = ++pageReqRef.current;
    const mode = activeTab;
    const limit = 400;
    setIndexPaging(true);
    setIndexPageError(null);
    const timer = setTimeout(() => {
      void (async () => {
        try {
          let page = await fetchDiscoveryPage({ mode, age: ageFilter, limit, ...indexListQuery });
          if (pageReqRef.current !== req) return;
          let tokens = page.tokens;
          let cursor = page.nextCursor;
          if (pageReqRef.current !== req) return;
          setPagedResults(tokens);
          setIndexTotal(page.total);
          setIndexCursor(cursor);
          setLoading(false);
        } catch (err: any) {
          if (pageReqRef.current !== req) return;
          setIndexPageError(loadedCountRef.current ? null : (err?.message || "Could not load this window"));
        } finally {
          if (pageReqRef.current === req) setIndexPaging(false);
        }
      })();
    }, 200);
    return () => clearTimeout(timer);
  }, [serverPaged, ageFilter, activeTab, indexRetry, chain, selectedDex, minVolume, maxVolume, minLiquidity, minMarketCap, maxMarketCap, minPriceChange, reqTelegram, reqXProfile, reqXPost, reqDiscord, reqWebsite, verifiedOnly]);

  // The week feed is the index merged with the venue list. The counter has to
  // follow that list, not the smaller discovery total.
  useEffect(() => {
    if (serverPaged || rawResults.length === 0) return;
    setIndexTotal((total) => Math.max(total ?? 0, rawResults.length));
  }, [rawResults, serverPaged]);

  const loadMoreIndex = useCallback(() => {
    if (!indexCursor || indexPaging) return;
    const req = pageReqRef.current;
    const mode = activeTab === "trending" ? "trending" : activeTab === "latest" ? "latest" : "fresh_mints";
    const bounds = { minVolume, maxVolume, minLiquidity, minMarketCap, maxMarketCap, minPriceChange };
    setIndexPaging(true);
    setIndexPageError(null);
    void fetchDiscoveryPage({
      mode,
      age: ageFilter,
      cursor: indexCursor,
      limit: 400,
      ...indexListQuery,
      ...bounds,
    })
      .then((page) => {
        if (pageReqRef.current !== req) return;
        if (serverPagedRef.current) {
          setPagedResults((prev) => appendUniqueTokens(prev ?? [], page.tokens));
        } else {
          setRawResults((prev) => appendUniqueTokens(prev, page.tokens));
          setPairs((prev) => appendUniqueTokens(prev, page.tokens));
        }
        setIndexTotal(page.total);
        setIndexCursor(page.nextCursor);
      })
      .catch((err: any) => {
        if (pageReqRef.current !== req) return;
        setIndexPageError(loadedCountRef.current ? null : (err?.message || "Could not load the next page"));
      })
      .finally(() => {
        if (pageReqRef.current === req) setIndexPaging(false);
      });
  }, [indexCursor, indexPaging, activeTab, ageFilter, chain, selectedDex, minVolume, maxVolume, minLiquidity, minMarketCap, maxMarketCap, minPriceChange, reqTelegram, reqXProfile, reqXPost, reqDiscord, reqWebsite, verifiedOnly]);

  // Reset currentPage when filters or query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [chain, selectedDex, minVolume, maxVolume, minLiquidity, minMarketCap, maxMarketCap, reqTelegram, reqXProfile, reqXPost, reqDiscord, reqWebsite, verifiedOnly, sortBy, searchQuery, ageFilter]);

  // An open coin must not stay pinned in the address after a new search or a home reset.
  const closeOpenToken = () => {
    setDetailKey((prev) => (prev ? "" : prev));
    setExpandedCards((prev) => (Object.keys(prev).length ? {} : prev));
  };

  // Handle Search Input Submission (submits search, collapses panel, hides preset tags)
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      closeOpenToken();
      setHasSearched(true);
      setIsSearchPanelCollapsed(true);
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
      fetchSearchPairs(searchQuery);
    }
  };

  // Helper for quick tag selection (sets query, submits search, collapses panel, hides preset tags)
  const handleQuickTagClick = (tag: string) => {
    closeOpenToken();
    setSearchQuery(tag);
    setHasSearched(true);
    setIsSearchPanelCollapsed(true);
    fetchSearchPairs(tag, chain);
  };

  // Helper to clear search completely and restore default feed in both expanded & collapsed states
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setHasSearched(false);
    setIsSearchPanelCollapsed(false);
    if (activeTab === "trending") {
      fetchTrendingBoosts();
    } else if (activeTab === "latest") {
      fetchLatestListings();
    } else if (activeTab === "fresh_mints") {
      fetchFreshMints(false);
    }
  }, [activeTab, fetchTrendingBoosts, fetchLatestListings, fetchFreshMints]);

  // Active Preset state tracker mapped dynamically based on selected filters
  const activePreset = useMemo<"bluechip" | "solgems" | "microcaps" | "base-moonshots" | "high-volume" | "custom">(() => {
    if (
      chain === "all" &&
      selectedDex === "all" &&
      minVolume === 500000 &&
      minLiquidity === 100000 &&
      minMarketCap === 5000000 &&
      maxMarketCap === "" &&
      !reqTelegram &&
      !reqXProfile &&
      !reqXPost &&
      !reqWebsite &&
      ageFilter === "all" &&
      sortBy === "liquidity"
    ) {
      return "bluechip";
    }
    if (
      chain === "solana" &&
      selectedDex === "all" &&
      minVolume === 100000 &&
      minLiquidity === 20000 &&
      minMarketCap === "" &&
      maxMarketCap === "" &&
      reqTelegram &&
      reqXProfile &&
      reqXPost &&
      reqWebsite &&
      ageFilter === "all" &&
      sortBy === "volume"
    ) {
      return "solgems";
    }
    if (
      chain === "all" &&
      selectedDex === "all" &&
      minVolume === "" &&
      minLiquidity === 5000 &&
      minMarketCap === 10000 &&
      maxMarketCap === 500000 &&
      reqTelegram &&
      reqXProfile &&
      reqXPost &&
      !reqWebsite &&
      ageFilter === "all" &&
      sortBy === "priceChange"
    ) {
      return "microcaps";
    }
    if (
      chain === "base" &&
      selectedDex === "all" &&
      minVolume === 50000 &&
      minLiquidity === 10000 &&
      minMarketCap === 10000 &&
      maxMarketCap === 1000000 &&
      reqTelegram &&
      reqXProfile &&
      reqXPost &&
      !reqWebsite &&
      ageFilter === "all" &&
      sortBy === "priceChange"
    ) {
      return "base-moonshots";
    }
    if (
      chain === "all" &&
      selectedDex === "all" &&
      minVolume === 1000000 &&
      maxVolume === "" &&
      minLiquidity === 50000 &&
      minMarketCap === 1000000 &&
      maxMarketCap === "" &&
      !reqTelegram &&
      !reqXProfile &&
      !reqXPost &&
      !reqWebsite &&
      ageFilter === "all" &&
      sortBy === "volume"
    ) {
      return "high-volume";
    }
    return "custom";
  }, [chain, selectedDex, minVolume, maxVolume, minLiquidity, minMarketCap, maxMarketCap, reqTelegram, reqXProfile, reqXPost, reqWebsite, sortBy, ageFilter]);

  // Helper to detect if custom filter parameters are applied
  const hasActiveFilters = useMemo(() => {
    return (
      chain !== "all" ||
      selectedDex !== "all" ||
      minVolume !== "" ||
      maxVolume !== "" ||
      minLiquidity !== "" ||
      minMarketCap !== "" ||
      maxMarketCap !== "" ||
      minPriceChange !== "" ||
      ageFilter !== "1w" ||
      reqTelegram ||
      reqXProfile || reqXPost ||
      reqDiscord ||
      reqWebsite ||
      verifiedOnly ||
      activePreset !== "custom"
    );
  }, [chain, selectedDex, minVolume, maxVolume, minLiquidity, minMarketCap, maxMarketCap, minPriceChange, ageFilter, reqTelegram, reqXProfile, reqXPost, reqDiscord, reqWebsite, verifiedOnly, activePreset]);

  // Reset Filters to default
  const resetFilters = () => {
    chainBeforeLaunchpadRef.current = null;
    setChain("all");
    setSelectedDex("all");
    setSearchQuery("");
    setMinVolume("");
    setMaxVolume("");
    setMinLiquidity("");
    setMinMarketCap("");
    setMaxMarketCap("");
    setMinPriceChange("");
    setReqTelegram(false);
    setReqXProfile(false);
    setReqXPost(false);
    setReqDiscord(false);
    setReqWebsite(false);
    setVerifiedOnly(false);
    setAgeFilter("1w");
    setSortBy("none");
    setCurrentPage(1);
    setError(null);
    setIndexPageError(null);
    setShowFiltersMobile(false);
    closeOpenToken();
  };

  const applyPanelFilters = (next: FilterState) => {
    chainBeforeLaunchpadRef.current = null;
    setChain(next.chains.length ? formatChainSelection(next.chains) : "all");
    setSelectedDex(next.sources.length ? next.sources.join(",") : "all");
    setAgeFilter(next.pairAge || "all");
    setMinVolume(next.volumeMin ?? "");
    setMaxVolume(next.volumeMax ?? "");
    setMinLiquidity(next.liquidityMin ?? "");
    setMinMarketCap(next.marketCapMin ?? "");
    setMaxMarketCap(next.marketCapMax ?? "");
    setMinPriceChange(next.change24hMin ?? "");
    setReqTelegram(next.social.telegram === "required");
    setReqXProfile(next.social.xProfile);
    setReqXPost(next.social.xPost);
    setReqDiscord(next.social.discord === "required");
    setReqWebsite(next.social.website === "required");
    setVerifiedOnly(next.verifiedOnly);
    const presetSort: Record<string, "liquidity" | "none" | "priceChange" | "volume"> = {
      "defi-bluechips": "liquidity",
      "solana-gems": "none",
      "microcap-degens": "priceChange",
      "base-breakouts": "priceChange",
      "high-vol-trenders": "volume",
    };
    if (next.preset && presetSort[next.preset]) setSortBy(presetSort[next.preset]);
    setCurrentPage(1);
    setError(null);
    setIndexPageError(null);
    setShowFiltersMobile(false);
  };

  const panelInitialFilters = (): FilterState => {
    const presetIds: Record<string, string> = {
      bluechip: "defi-bluechips",
      solgems: "solana-gems",
      microcaps: "microcap-degens",
      "base-moonshots": "base-breakouts",
      "high-volume": "high-vol-trenders",
    };
    return {
      preset: presetIds[activePreset] || null,
      chains: chain === "all" ? [] : chainSelectionList(chain),
      sources: selectedDex === "all" ? [] : selectedDex.split(",").filter(Boolean),
      pairAge: ageFilter || "all",
      volumeMin: minVolume === "" ? null : minVolume,
      volumeMax: maxVolume === "" ? null : maxVolume,
      marketCapMin: minMarketCap === "" ? null : minMarketCap,
      marketCapMax: maxMarketCap === "" ? null : maxMarketCap,
      liquidityMin: minLiquidity === "" ? null : minLiquidity,
      change24hMin: minPriceChange === "" ? null : minPriceChange,
      social: {
        telegram: reqTelegram ? "required" : "any",
        discord: reqDiscord ? "required" : "any",
        website: reqWebsite ? "required" : "any",
        xProfile: reqXProfile,
        xPost: reqXPost,
      },
      verifiedOnly,
    };
  };

  const countPanelMatches = (draft: FilterState) => {
    const list = browseSource || [];
    return resolveBrowseQuery(list, searchQuery, {
      chain: draft.chains.length ? formatChainSelection(draft.chains) : "all",
      dex: draft.sources.length ? draft.sources.join(",") : "all",
      age: searchQuery.trim() ? "all" : (draft.pairAge || "all"),
      minVolume: draft.volumeMin ?? "",
      maxVolume: draft.volumeMax ?? "",
      minLiquidity: draft.liquidityMin ?? "",
      minMarketCap: draft.marketCapMin ?? "",
      maxMarketCap: draft.marketCapMax ?? "",
      minPriceChange: draft.change24hMin ?? "",
      telegram: draft.social.telegram === "required",
      twitter: false,
      xProfile: draft.social.xProfile,
      xPost: draft.social.xPost,
      discord: draft.social.discord === "required",
      website: draft.social.website === "required",
      verified: draft.verifiedOnly,
    }, (tokens, filters) => applyLoadedFilters(tokens.filter((pair) => !is1kMarketCap(pair)), filters)).length;
  };

  // Tracks which search query has already had an automatic filter-clear attempt,
  // so a coin that genuinely doesn't exist only gets this treatment once instead
  // of retrying forever every time the empty-results check re-runs.
  const autoFilterResetAttemptedRef = useRef<string | null>(null);
  const browseSource = serverPaged && pagedResults ? pagedResults : rawResults;

  // Network token count aggregation across the current dataset for discoverability pills
  const networkTokenCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    const list = browseSource && browseSource.length > 0 ? browseSource : pairs;
    if (Array.isArray(list)) {
      counts.all = list.length;
      for (const p of list) {
        if (!p?.chainId) continue;
        const c = normalizeChainName(p.chainId);
        counts[c] = (counts[c] || 0) + 1;
      }
    }
    return counts;
  }, [browseSource, pairs]);

  // Return to Home & Refresh Feed
  const handleHomeClick = () => {
    resetFilters();
    setSearchQuery("");
    if (activeTab === "trending") {
      fetchTrendingBoosts(undefined, true);
    } else {
      setActiveTab("trending");
    }
  };

  // Export to CSV helper using dedicated aggregator exporter with large dataset confirmation
  const LARGE_DATASET_CSV_THRESHOLD = 50;

  const triggerExportCSV = () => {
    if (filteredAndSortedPairs.length === 0) return;
    exportTokensToCSV(filteredAndSortedPairs, `dexhunter_${activeTab}_aggregated_export.csv`);
    setShowExportConfirm(false);
  };

  const triggerExportJSON = () => {
    if (filteredAndSortedPairs.length === 0) return;
    const jsonStr = JSON.stringify(filteredAndSortedPairs, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dexhunter_${activeTab}_export_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportConfirm(false);
  };

  const handleExportToCSV = () => {
    if (filteredAndSortedPairs.length === 0) return;
    if (filteredAndSortedPairs.length >= LARGE_DATASET_CSV_THRESHOLD) {
      setShowExportConfirm(true);
    } else {
      triggerExportCSV();
    }
  };

  // Process and Filter Pair Data loaded from API
  const filteredAndSortedPairs = useMemo(() => {
    if (!browseSource || browseSource.length === 0) return [];

    const qTrim = searchQuery.trim();
    const searching = qTrim.length > 0;
    const browseFilters = {
      chain: searching ? "all" : chain,
      dex: searching ? "all" : selectedDex,
      age: searching ? "all" : ageFilter,
      minVolume: searching ? "" : minVolume,
      maxVolume: searching ? "" : maxVolume,
      minLiquidity: searching ? "" : minLiquidity,
      minMarketCap: searching ? "" : minMarketCap,
      maxMarketCap: searching ? "" : maxMarketCap,
      minPriceChange: searching ? "" : minPriceChange,
      telegram: searching ? false : reqTelegram,
      twitter: false,
      xProfile: searching ? false : reqXProfile,
      xPost: searching ? false : reqXPost,
      discord: searching ? false : reqDiscord,
      website: searching ? false : reqWebsite,
      verified: searching ? false : verifiedOnly,
    };
    let result = resolveBrowseQuery(
      browseSource,
      qTrim,
      browseFilters,
      (tokens, filters) => applyLoadedFilters(tokens.filter((pair) => !is1kMarketCap(pair)), filters)
    );

    // 7. Sorting Logic
    if (activeTab === "trending") {
      result.sort((a, b) => {
        if (sortBy === "volume") {
          return Number(b.volume?.h24 || 0) - Number(a.volume?.h24 || 0);
        } else if (sortBy === "liquidity") {
          return Number(b.liquidity?.usd || 0) - Number(a.liquidity?.usd || 0);
        } else if (sortBy === "priceChange") {
          return Number(b.priceChange?.h24 || 0) - Number(a.priceChange?.h24 || 0);
        } else if (sortBy === "marketCap") {
          const capA = marketCapOf(a);
          const capB = marketCapOf(b);
          return (capB ?? -Infinity) - (capA ?? -Infinity);
        } else if (sortBy === "newest") {
          return compareCreatedDesc(a, b);
        } else if (sortBy === "price") {
          return Number(b.priceUsd || 0) - Number(a.priceUsd || 0);
        } else {
          // Default Trending Sort: DexHunter Unified Quality & Momentum Score
          const scoreA = Number(a.scoreBreakdown?.total ?? calculateFinalDexHunterScore(a, "trending"));
          const scoreB = Number(b.scoreBreakdown?.total ?? calculateFinalDexHunterScore(b, "trending"));
          return scoreB - scoreA;
        }
      });
    } else {
      if (sortBy === "volume") {
        result.sort((a, b) => Number(b.volume?.h24 || 0) - Number(a.volume?.h24 || 0));
      } else if (sortBy === "liquidity") {
        result.sort((a, b) => Number(b.liquidity?.usd || 0) - Number(a.liquidity?.usd || 0));
      } else if (sortBy === "priceChange") {
        result.sort((a, b) => Number(b.priceChange?.h24 || 0) - Number(a.priceChange?.h24 || 0));
      } else if (sortBy === "marketCap") {
        result.sort((a, b) => (marketCapOf(b) ?? -Infinity) - (marketCapOf(a) ?? -Infinity));
      } else if (sortBy === "newest") {
        result.sort(compareCreatedDesc);
      } else if (sortBy === "price") {
        result.sort((a, b) => Number(b.priceUsd || 0) - Number(a.priceUsd || 0));
      } else if (sortBy === "trending") {
        result.sort((a, b) => {
          const scoreA = Number(a.scoreBreakdown?.total ?? calculateFinalDexHunterScore(a, "trending"));
          const scoreB = Number(b.scoreBreakdown?.total ?? calculateFinalDexHunterScore(b, "trending"));
          return scoreB - scoreA;
        });
      } else if (sortBy === "momentum") {
        result.sort((a, b) => {
          const momA = Number(a.momentumScore || 0) + (hasSocialLinks(a) ? 8 : -8);
          const momB = Number(b.momentumScore || 0) + (hasSocialLinks(b) ? 8 : -8);
          return momB - momA;
        });
      }
    }

    if ((activeTab === "latest" || activeTab === "fresh_mints") && sortBy === "none") {
      result.sort(compareCreatedDesc);
    }

    if (searching) {
      result.sort((a, b) => searchRank(a, qTrim) - searchRank(b, qTrim));
    }

    return result;
  }, [browseSource, chain, selectedDex, searchQuery, minVolume, maxVolume, minLiquidity, minMarketCap, maxMarketCap, minPriceChange, reqTelegram, reqXProfile, reqXPost, reqDiscord, reqWebsite, verifiedOnly, sortBy, ageFilter, activeTab]);

  const loadedInWindow = serverPaged && pagedResults ? pagedResults.length : rawResults.length;

  useEffect(() => {
    if (!searchQuery.trim()) setSearchNote(null);
  }, [searchQuery]);

  // If an active search comes back empty specifically because filters (chain,
  // volume, liquidity, age, etc) are excluding the match, clear those filters
  // and re-run the same search automatically in the background, rather than
  // making the person open the filter menu and clear it themselves.
  useEffect(() => {
    if (loading || !searchQuery.trim() || filteredAndSortedPairs.length > 0) return;

    const filtersActive =
      chain !== "all" || selectedDex !== "all" || minVolume !== "" || maxVolume !== "" || minLiquidity !== "" ||
      minMarketCap !== "" || maxMarketCap !== "" || minPriceChange !== "" ||
      reqTelegram || reqXProfile || reqXPost || reqDiscord || reqWebsite || verifiedOnly || ageFilter !== "1w";

    if (!filtersActive) return;
    // Do not silently widen filters. The empty state already communicates no match.
    // An explicit "search without filters" control can be added later if product wants it.
  }, [
    loading, searchQuery, filteredAndSortedPairs.length, chain, selectedDex,
    minVolume, maxVolume, minLiquidity, minMarketCap, maxMarketCap, minPriceChange,
    reqTelegram, reqXProfile, reqXPost, reqDiscord, reqWebsite, verifiedOnly, ageFilter, fetchSearchPairs,
  ]);

  // Pagination Calculations
  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedPairs.length / PAGE_SIZE);
  }, [filteredAndSortedPairs.length]);

  const paginatedPairs = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    // Cap or slice safely
    return filteredAndSortedPairs.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredAndSortedPairs, currentPage]);

  // Background gradient and accent badges mapping based on chain
  const getChainBadgeStyle = (chainId: string) => {
    const norm = normalizeChainName(chainId);
    if (norm === "solana") return { bg: "bg-[#1c122c] text-[#a180e6] border-[#3e2c5d]", text: "SOLANA" };
    if (norm === "base") return { bg: "bg-[#101c30] text-[#5586f2] border-[#223963]", text: "BASE" };
    if (norm === "bsc") return { bg: "bg-[#201c10] text-[#f0b90b] border-[#443818]", text: "BSC" };
    if (norm === "ethereum") return { bg: "bg-[#102420] text-[#6ebd80] border-[#1f423b]", text: "ETHEREUM" };
    if (norm === "robinhood") return { bg: "bg-[#102418] text-[#00c805] border-[#1b4322]", text: "ROBINHOOD" };
    if (norm === "arbitrum") return { bg: "bg-[#111e2e] text-[#28a0f0] border-[#1e344e]", text: "ARBITRUM" };
    if (norm === "polygon") return { bg: "bg-[#1a102b] text-[#9d5bf0] border-[#331c59]", text: "POLYGON" };
    if (norm === "avalanche") return { bg: "bg-[#241215] text-[#e84142] border-[#4d1f23]", text: "AVALANCHE" };
    if (norm === "cronos") return { bg: "bg-[#0b1626] text-[#1199fa] border-[#162c4c]", text: "CRONOS" };
    if (norm === "arc") return { bg: "bg-[#261f0d] text-[#e6b800] border-[#59440e]", text: "ARC" };
    return { bg: "bg-[#181818] text-gray-400 border-[#2a2a2a]", text: chainId?.toUpperCase() || "UNKNOWN" };
  };

  // Helper to format creation elapsed times beautifully and defensively across all chains
  const formatTimeAgo = (timestampMs?: number | string) => {
    if (!timestampMs) return null;
    let ts = typeof timestampMs === "string" ? Number(timestampMs) : timestampMs;
    if (isNaN(ts) && typeof timestampMs === "string") {
      ts = new Date(timestampMs).getTime();
    }
    if (!ts || isNaN(ts) || ts <= 0) return null;
    if (ts < 10000000000) ts = ts * 1000;
    
    const diffMs = Date.now() - ts;
    // Handle future times due to local clock syncs
    if (diffMs <= 0) return "Just now";
    
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) {
      const remainingMin = diffMin % 60;
      return `${diffHr}h ${remainingMin}m ago`;
    }
    
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) {
      const remainingHr = diffHr % 24;
      return remainingHr > 0 ? `${diffDay}d ${remainingHr}h ago` : `${diffDay}d ago`;
    }
    
    const diffMonth = Math.floor(diffDay / 30);
    if (diffMonth < 12) {
      const remDays = diffDay % 30;
      return remDays > 0 ? `${diffMonth}mo ${remDays}d ago` : `${diffMonth}mo ago`;
    }
    
    const diffYear = Math.floor(diffDay / 365);
    const remMonths = Math.floor((diffDay % 365) / 30);
    return remMonths > 0 ? `${diffYear}y ${remMonths}mo ago` : `${diffYear}y ago`;
  };

  // Helper to format exact UTC/Local launch timestamp for tooltip and timeline diagnostics
  const formatExactDate = (timestampMs?: number | string) => {
    if (!timestampMs) return undefined;
    let ts = typeof timestampMs === "string" ? Number(timestampMs) : timestampMs;
    if (isNaN(ts) && typeof timestampMs === "string") {
      ts = new Date(timestampMs).getTime();
    }
    if (!ts || isNaN(ts) || ts <= 0) return undefined;
    if (ts < 10000000000) ts = ts * 1000;
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <div className={`min-h-screen ${theme.bgMain} flex flex-col font-sans transition-colors duration-300`}>
      {/* Upper branding and controller */}
      <header className={`border-b ${theme.bgHeader} py-1.5 sm:py-2.5 px-3 sm:px-6 flex flex-col xl:flex-row xl:items-center justify-between gap-1.5 sm:gap-3 xl:sticky xl:top-0 z-50 transition-all duration-300`}>
        {/* Row 1: Brand Header on left, and on mobile all quick action icons on right */}
        <div className="flex items-center justify-between w-full xl:w-auto min-w-0 gap-1.5">
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <button
              id="btn_pause_feed"
              type="button"
              onClick={() => setFeedPaused((paused) => !paused)}
              className={`flex p-1.5 sm:px-2.5 sm:py-1 rounded-xl border transition-all items-center gap-1.5 text-xs font-medium cursor-pointer active:scale-95 ${
                feedPaused
                  ? "bg-[#ff6b35] border-[#ff6b35] text-white"
                  : isDarkMode
                    ? "bg-[#181824] border-zinc-800 text-zinc-200 hover:border-[#ff6b35]/60"
                    : "bg-white border-slate-200 text-slate-700 hover:border-[#ff6b35]/60"
              }`}
              title={feedPaused ? "Resume. New coins will drop in again." : "Pause. The list stays still."}
              aria-pressed={feedPaused}
              aria-label={feedPaused ? "Resume live feed" : "Pause live feed"}
            >
              {feedPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{feedPaused ? "Resume" : "Pause"}</span>
            </button>

            {/* Desktop-only CSV export */}
            <button 
              id="btn_export_csv_top_left"
              onClick={handleExportToCSV}
              disabled={filteredAndSortedPairs.length === 0}
              className={`hidden p-1.5 sm:px-2.5 sm:py-1 rounded-xl border transition-all items-center gap-1.5 text-xs font-medium cursor-pointer disabled:opacity-30 active:scale-95 ${
                isDarkMode 
                  ? "bg-[#181824] border-zinc-800 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-950/20" 
                  : "bg-white border-slate-200 text-emerald-700 hover:bg-emerald-50"
              }`}
              title="Export filtered pairs to CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>CSV</span>
            </button>

            {/* Clickable DEXHUNTER Brand Header -> Resets filters and refreshes homepage */}
            <button
              id="btn_brand_home_refresh"
              onClick={handleHomeClick}
              className="flex items-center gap-2 group cursor-pointer text-left border-none bg-transparent p-0 outline-none select-none"
              title="Return to DexHunter Homepage & Refresh Feed"
            >
              <div className="p-1 sm:p-1.5 flex items-center justify-center rounded-xl border border-[#ff6b35]/30 bg-[#ff6b35]/15 group-hover:bg-[#ff6b35]/25 group-hover:border-[#ff6b35] transition-all">
                <Flame className="w-4 h-4 text-[#ff6b35] group-hover:scale-110 transition-transform duration-200" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <h1 className={`font-display text-base sm:text-lg font-bold tracking-tight truncate ${theme.textTitle} m-0 transition-colors duration-300 group-hover:text-[#ff6b35]`}>
                  DexHunter
                </h1>
                <span className={`text-[10px] ${theme.textMuted} font-medium tracking-tight hidden sm:inline`}>
                  Discovery
                </span>
              </div>
            </button>
          </div>

          {/* Mobile Right Controls: Compact Action Buttons (Search, CSV, Theme, Settings) */}
          <div className="xl:hidden flex items-center gap-1 shrink-0">
            {/* Mobile Search Trigger */}
            <button
              id="btn_toggle_search_mobile"
              type="button"
              onClick={() => {
                if (isSearchPanelCollapsed) {
                  setIsSearchOpen(true);
                  setIsSearchPanelCollapsed(false);
                  requestAnimationFrame(() => {
                    searchInputRef.current?.focus();
                  });
                } else if (isSearchOpen) {
                  handleCloseSearch();
                } else {
                  handleOpenSearch();
                }
              }}
              className={`flex items-center justify-center transition-all border outline-none cursor-pointer rounded-lg w-8 h-8 relative before:absolute before:-inset-2 sm:before:hidden touch-manipulation ${
                isSearchOpen || searchQuery.trim()
                  ? "bg-[#ff6b35]/15 border-[#ff6b35] text-[#ff6b35]"
                  : `${theme.btnSecondary} hover:text-[#ff6b35]`
              }`}
              title="Search tokens"
              aria-label="Search tokens"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Mobile CSV Download */}
            <button
              id="btn_export_csv_mobile"
              type="button"
              onClick={handleExportToCSV}
              disabled={filteredAndSortedPairs.length === 0}
              className={`flex items-center justify-center transition-all border outline-none cursor-pointer rounded-lg w-8 h-8 disabled:opacity-30 relative before:absolute before:-inset-2 sm:before:hidden touch-manipulation ${
                isDarkMode ? "bg-[#181824] border-zinc-800 text-emerald-400" : "bg-white border-slate-200 text-emerald-700"
              }`}
              title="Export CSV"
              aria-label="Export CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
            </button>

            {/* Mobile Theme Toggle */}
            <button
              id="btn_toggle_theme_mobile"
              type="button"
              onClick={toggleTheme}
              className={`flex items-center justify-center transition-all border outline-none cursor-pointer rounded-lg w-8 h-8 relative before:absolute before:-inset-2 sm:before:hidden touch-manipulation ${
                isDarkMode 
                  ? "bg-[#1f202e] border-zinc-800 text-yellow-400" 
                  : "bg-slate-100 border-slate-200 text-indigo-600"
              }`}
              title={`Toggle Theme Mode (Current: ${isDarkMode ? "Dark" : "Light"})`}
              aria-label="Toggle Theme Mode"
            >
              {isDarkMode ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Mobile Settings Trigger */}
            <button
              ref={settingsTriggerMobileRef}
              id="btn_open_settings_mobile"
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className={`flex items-center justify-center transition-all border outline-none cursor-pointer rounded-lg w-8 h-8 relative before:absolute before:-inset-2 sm:before:hidden touch-manipulation ${
                isDarkMode 
                  ? "bg-[#1f202e] border-zinc-800 text-zinc-300" 
                  : "bg-slate-100 border-slate-200 text-slate-700"
              }`}
              title="Settings"
              aria-label="Open Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: Segmented tab control + Desktop search trigger + Desktop theme & settings buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full xl:w-auto mt-0.5 xl:mt-0 justify-between xl:justify-end min-w-0">
          
          {/* Segmented Control for Trending / Latest / Mints */}
          <div className={`p-0.5 sm:p-1 border text-xs sm:text-sm flex-1 xl:flex-none flex items-center gap-1 rounded-xl transition-colors duration-300 ${theme.bgTabs}`}>
            <button 
              id="tab_trending"
              onClick={() => {
                setActiveTab("trending");
                if (sortBy === "newest") {
                  setSortBy("trending");
                }
                if (searchQuery) {
                  closeOpenToken();
                  setSearchQuery("");
                  fetchTrendingBoosts();
                }
              }} 
              className={`flex-1 xl:flex-none px-3 sm:px-4 py-2 sm:py-2 font-medium transition-all rounded-lg flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] sm:min-h-0 touch-manipulation ${
                activeTab === "trending" && !searchQuery 
                  ? "bg-[#ff6b35] text-white shadow-xs" 
                  : `${theme.textSub} hover:text-[#ff6b35]`
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse flex-shrink-0" />
              <span>Trending</span>
            </button>
            
            <button 
              id="tab_latest"
              onClick={() => {
                setActiveTab("latest");
                setSortBy("newest");
                if (searchQuery) {
                  closeOpenToken();
                  setSearchQuery("");
                  fetchLatestListings();
                }
              }} 
              className={`flex-1 xl:flex-none px-3 sm:px-4 py-2 sm:py-2 font-medium transition-all rounded-lg flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] sm:min-h-0 touch-manipulation ${
                activeTab === "latest" && !searchQuery 
                  ? "bg-[#ff6b35] text-white shadow-xs" 
                  : `${theme.textSub} hover:text-[#ff6b35]`
              }`}
              title="Latest listings from the last 7 days"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
              <span>Latest</span>
              <span className="hidden sm:inline text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/15 dark:bg-white/15 tracking-tight">≤7d</span>
            </button>

            <button 
              id="tab_fresh_mints"
              onClick={() => {
                setActiveTab("fresh_mints");
                setSortBy("newest");
                if (searchQuery) {
                  closeOpenToken();
                  setSearchQuery("");
                  fetchFreshMints();
                }
              }} 
              className={`flex-1 xl:flex-none px-3 sm:px-4 py-2 sm:py-2 font-medium transition-all rounded-lg flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] sm:min-h-0 touch-manipulation ${
                activeTab === "fresh_mints" && !searchQuery 
                  ? "bg-[#ff6b35] text-white shadow-xs" 
                  : `${theme.textSub} hover:text-[#ff6b35]`
              }`}
              title="Fresh token mints sorted by real creation time"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse flex-shrink-0" />
              <span>Mints</span>
            </button>
          </div>

          {/* Integrated Header Search Trigger Button (Desktop) */}
          <button
            ref={searchTriggerBtnRef}
            id="btn_toggle_search"
            onClick={() => {
              if (isSearchPanelCollapsed) {
                setIsSearchOpen(true);
                setIsSearchPanelCollapsed(false);
                requestAnimationFrame(() => {
                  searchInputRef.current?.focus();
                });
              } else if (isSearchOpen) {
                handleCloseSearch();
              } else {
                handleOpenSearch();
              }
            }}
            className={`hidden xl:flex p-2 sm:px-3 sm:py-2 border transition-all cursor-pointer text-xs font-medium rounded-xl items-center justify-center gap-1.5 ${
              isSearchOpen || searchQuery.trim()
                ? "bg-[#ff6b35]/15 border-[#ff6b35] text-[#ff6b35]"
                : `${theme.btnSecondary} hover:border-[#ff6b35]/50 hover:text-[#ff6b35]`
            }`}
            title="Search tokens (Press 'S')"
            aria-label="Search tokens (Press 'S')"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
            <kbd className={`hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono rounded border uppercase ${
              isDarkMode 
                ? "bg-zinc-800/90 border-zinc-700 text-zinc-300" 
                : "bg-slate-200/80 border-slate-300 text-slate-600"
            }`}>S</kbd>
            {searchQuery.trim() && (
              <span className="w-2 h-2 rounded-full bg-[#ff6b35] animate-pulse" />
            )}
          </button>

          {/* Desktop CSV / Data Export Button */}
          <button
            id="btn_export_data_desktop"
            type="button"
            onClick={handleExportToCSV}
            disabled={filteredAndSortedPairs.length === 0}
            className={`hidden xl:flex items-center gap-1.5 px-3 h-10 rounded-xl border text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDarkMode
                ? "bg-[#181824] border-zinc-800 text-emerald-400 hover:bg-[#202030] hover:border-emerald-500/40"
                : "bg-white border-slate-200 text-emerald-700 hover:bg-slate-50 hover:border-emerald-300 shadow-2xs"
            }`}
            title={`Export ${filteredAndSortedPairs.length} discovered tokens to CSV`}
            aria-label="Export token data"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden lg:inline">Export</span>
            <span className="text-[11px] opacity-75 font-mono">({filteredAndSortedPairs.length})</span>
          </button>

          {/* Desktop Theme Switcher */}
          <button
            id="btn_toggle_theme_desktop"
            type="button"
            onClick={toggleTheme}
            className={`hidden xl:flex items-center justify-center transition-all border outline-none cursor-pointer rounded-xl relative ${
              isDarkMode 
                ? "bg-[#1f202e] border-zinc-800 text-yellow-400 hover:text-yellow-300" 
                : "bg-white border-slate-200 text-indigo-600 hover:text-indigo-700 hover:border-slate-300"
            } w-10 h-10 flex-shrink-0`}
            title={`Toggle Theme Mode (Current: ${themeMode === "system" ? `System ${isDarkMode ? "Dark" : "Light"}` : isDarkMode ? "Dark" : "Light"})`}
            aria-label={`Toggle Theme Mode (Current: ${themeMode === "system" ? `System ${isDarkMode ? "Dark" : "Light"}` : isDarkMode ? "Dark" : "Light"})`}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 transition-transform hover:rotate-12 duration-300" />
            ) : (
              <Moon className="w-4 h-4 transition-transform hover:-rotate-12 duration-300" />
            )}
            {themeMode === "system" && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#111218] dark:ring-[#111218]" title="Synced with system OS" />
            )}
          </button>

          {/* Desktop Settings Menu Trigger */}
          <button
            ref={settingsTriggerDesktopRef}
            id="btn_open_settings_desktop"
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className={`hidden xl:flex items-center justify-center transition-all border outline-none cursor-pointer rounded-xl ${
              isDarkMode 
                ? "bg-[#1f202e] border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700" 
                : "bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300"
            } w-10 h-10 flex-shrink-0`}
            title="Open Settings & Theme Preferences"
            aria-label="Open Settings and Preferences"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
        
        {/* Expandable Built-in Search Interface Panel */}
        <AnimatePresence mode="wait">
          {(isSearchOpen || searchQuery.trim()) && (
            isSearchPanelCollapsed && hasSearched && searchQuery.trim() ? (
              /* Single Slim Row when search is active and collapsed */
              <motion.div
                key="search-panel-collapsed"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                id="search_panel_collapsed"
                onClick={() => {
                  setIsSearchPanelCollapsed(false);
                  requestAnimationFrame(() => {
                    searchInputRef.current?.focus();
                  });
                }}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border flex items-center justify-between gap-2.5 shadow-xs transition-all duration-200 cursor-pointer group hover:border-[#ff6b35]/60 ${
                  isDarkMode 
                    ? "bg-[#151622] border-zinc-800 hover:bg-[#181926]" 
                    : "bg-white border-slate-200/90 hover:bg-slate-50"
                }`}
                title="Click to expand search or modify query"
                role="region"
                aria-label="Active search query panel"
              >
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                  <div className="p-1 rounded-md bg-[#ff6b35]/15 text-[#ff6b35] flex-shrink-0">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`text-[11px] font-medium flex-shrink-0 ${theme.textMuted}`}>
                      Query:
                    </span>
                    <span 
                      title={searchQuery}
                      className={`text-xs sm:text-sm font-semibold font-mono truncate px-2 py-0.5 rounded-md border ${
                      isDarkMode 
                        ? "bg-zinc-900 border-zinc-700 text-zinc-100" 
                        : "bg-slate-100 border-slate-300 text-slate-900"
                    }`}>
                      {abbreviateSearchQuery(searchQuery)}
                    </span>
                  </div>
                  <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500 group-hover:text-[#ff6b35] transition-colors">
                    <Edit3 className="w-3 h-3" />
                    <span>Click to edit</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Small Edit Affordance Button */}
                  <button
                    id="btn_edit_search_query"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSearchPanelCollapsed(false);
                      requestAnimationFrame(() => {
                        searchInputRef.current?.focus();
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 transition cursor-pointer ${theme.btnSecondary} hover:text-[#ff6b35] hover:border-[#ff6b35]/50`}
                    title="Edit search query"
                    aria-label="Edit search query"
                  >
                    <Edit3 className="w-3 h-3 text-[#ff6b35]" />
                    <span className="text-[11px] font-medium">Edit</span>
                  </button>

                  {/* Clear Affordance (X) Button */}
                  <button
                    id="btn_clear_search_collapsed"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSearch();
                    }}
                    className={`p-1 sm:px-2 sm:py-1 rounded-lg border text-xs font-medium flex items-center gap-1 transition cursor-pointer ${theme.btnSecondary} hover:text-red-400 hover:border-red-500/40`}
                    title="Clear search and restore feed"
                    aria-label="Clear search and restore feed"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Clear</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Full Expanded Search Panel */
              <motion.div
                key="search-panel-expanded"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className={`p-4 sm:p-5 rounded-2xl border relative shadow-md ${
                  isDarkMode ? "bg-[#151622] border-zinc-800" : "bg-white border-slate-200/90"
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#ff6b35] tracking-wide">
                      <Search className="w-4 h-4" /> Token & Contract Address Search
                    </div>
                    <button
                      id="btn_close_search_panel"
                      type="button"
                      onClick={() => {
                        handleClearSearch();
                        handleCloseSearch();
                      }}
                      className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${theme.btnSecondary} hover:text-[#ff6b35]`}
                      title="Close Search (Esc)"
                      aria-label="Close Search (Esc)"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Close</span>
                      <kbd className={`hidden sm:inline-flex items-center px-1 text-[9px] font-mono rounded border uppercase ${
                        isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-slate-200 border-slate-300 text-slate-600"
                      }`}>Esc</kbd>
                    </button>
                  </div>

                  <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input 
                        ref={searchInputRef}
                        id="input_search_query"
                        type="text" 
                        value={searchQuery} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setSearchQuery(val);
                          if (val.trim()) closeOpenToken();
                          else setHasSearched(false);
                        }} 
                        placeholder="Search by token name, symbol, or contract address..." 
                        className={`w-full text-xs sm:text-sm rounded-xl pl-3.5 pr-10 py-2.5 outline-none transition border focus:border-[#ff6b35] ${theme.inputStyle}`} 
                        autoFocus
                      />
                      {searchQuery ? (
                        <button 
                          id="btn_clear_search_input"
                          type="button" 
                          onClick={handleClearSearch}
                          className="absolute right-3 top-3 text-gray-400 hover:text-[#ff6b35] transition cursor-pointer"
                          title="Clear search input"
                          aria-label="Clear search input"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          id="btn_search_submit"
                          type="submit" 
                          className="absolute right-3 top-3 transition text-gray-400 hover:text-[#ff6b35]"
                          title="Submit search"
                          aria-label="Submit search"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <button
                      id="btn_execute_search"
                      type="submit"
                      className="px-4 py-2.5 bg-[#ff6b35] text-white font-medium text-xs rounded-xl hover:bg-[#ff6b35]/90 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Search className="w-3.5 h-3.5" /> Search
                    </button>
                  </form>

                  {/* Quick Sector Tags: ONLY visible before any search has been run (empty state) */}
                  {!searchQuery.trim() && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs pt-0.5">
                      <span className={`${theme.textMuted} text-[11px] font-medium`}>Quick Tags:</span>
                      {quickSearchTags.map(tag => (
                        <button 
                          id={`quick_tag_${tag}`}
                          key={tag} 
                          type="button"
                          onClick={() => handleQuickTagClick(tag)} 
                          className={`px-2.5 py-1 rounded-lg font-mono text-[11px] border transition-all duration-200 cursor-pointer ${
                            searchQuery.toLowerCase() === tag 
                              ? "bg-[#ff6b35] border-[#ff6b35] text-white font-semibold" 
                              : theme.btnSecondary
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>

        {/* Top interactive controller bar */}
        <div className={`p-2 sm:p-2.5 rounded-2xl relative overflow-visible flex items-center justify-between gap-1.5 sm:gap-2 transition-all duration-200 ${theme.bgCard} shadow-2xs`}>
          
          {/* Left Controls: Filter & Sort */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
            {/* Filter Trigger Button */}
            <button 
              ref={filterTriggerBtnRef}
              id="btn_open_filters_modal"
              type="button"
              aria-haspopup="dialog"
              aria-expanded={showFiltersMobile}
              aria-controls="filter_drawer_modal"
              aria-label={`Open filter parameters and presets drawer (Press 'F')${hasActiveFilters ? ', active filters applied' : ''}`}
              onClick={handleOpenFilterDrawer} 
              className={`px-2.5 sm:px-3 py-2 sm:py-2 min-h-[38px] sm:min-h-0 rounded-xl border transition cursor-pointer relative flex items-center justify-center text-xs font-medium focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0b0c10] focus-visible:outline-none flex-shrink-0 relative before:absolute before:-inset-1.5 sm:before:hidden touch-manipulation ${
                hasActiveFilters 
                  ? "bg-[#ff6b35]/15 border-[#ff6b35] text-[#ff6b35]" 
                  : theme.btnSecondary
              }`}
              title="Filter Parameters & Presets (Press 'F')"
            >
              <Filter className="w-3.5 h-3.5 text-[#ff6b35] flex-shrink-0" />
              <span className="ml-1 sm:ml-1.5">Filters</span>
              <kbd className={`hidden sm:inline-flex items-center justify-center ml-1.5 px-1.5 py-0.5 text-[10px] font-mono rounded border uppercase ${
                isDarkMode 
                  ? "bg-zinc-800/90 border-zinc-700 text-zinc-300" 
                  : "bg-slate-200/80 border-slate-300 text-slate-600"
              }`}>F</kbd>
              {hasActiveFilters && (
                <span className="w-2 h-2 ml-1 sm:ml-1.5 rounded-full bg-[#ff6b35] animate-pulse" aria-hidden="true" />
              )}
            </button>

            {/* Custom Sort Trigger Button */}
            <button 
              id="btn_open_sort_modal"
              type="button"
              onClick={() => setShowSortModal(true)} 
              className={`px-2 sm:px-2.5 py-2 sm:py-2 min-h-[38px] sm:min-h-0 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-1 sm:gap-1.5 text-xs font-medium min-w-0 flex-shrink truncate relative before:absolute before:-inset-1.5 sm:before:hidden touch-manipulation ${
                sortBy !== "none" 
                  ? isDarkMode
                    ? "bg-zinc-800/80 hover:bg-zinc-700/90 border-zinc-700/80 text-zinc-200"
                    : "bg-slate-100/90 hover:bg-slate-200/90 border-slate-200 text-slate-800"
                  : theme.btnSecondary
              }`}
              title="Sort & Rank Options"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#ff6b35] flex-shrink-0" />
              <span className="font-semibold whitespace-nowrap">
                {sortBy === "none" ? (
                  <>
                    <span className="min-[400px]:hidden">{activeTab === "trending" ? "Trend" : "New"}</span>
                    <span className="hidden min-[400px]:inline">{activeTab === "trending" ? "Trending" : "Newest"}</span>
                  </>
                ) : (SORT_OPTIONS.find(o => o.id === sortBy)?.shortLabel || "Sort")}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60 flex-shrink-0" />
            </button>

            {/* If search query is active, show tiny query pill */}
            {searchQuery.trim() && (
              <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#ff6b35]/15 border border-[#ff6b35]/30 text-[#ff6b35] text-[11px] font-mono truncate max-w-[150px] flex-shrink">
                "{abbreviateSearchQuery(searchQuery)}"
              </span>
            )}
          </div>

          {/* Right Controls: Unified View Mode Switcher + Refresh Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 z-10">
            {/* View Mode Toggle: Card Grid vs Compact Table */}
            <div 
              className={`p-0.5 sm:p-1 border text-xs flex items-center gap-0.5 rounded-xl transition-colors duration-200 ${theme.bgTabs}`}
              role="group"
              aria-label="Dashboard layout view mode"
            >
              <button
                id="btn_view_cards"
                type="button"
                onClick={() => updateViewMode("cards")}
                className={`px-2 sm:px-2.5 py-1.5 min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 font-medium transition-all rounded-lg flex items-center justify-center gap-1 cursor-pointer text-xs relative before:absolute before:-inset-1.5 sm:before:hidden touch-manipulation ${
                  viewMode === "cards"
                    ? "bg-[#ff6b35] text-white shadow-xs font-semibold"
                    : `${theme.textSub} hover:text-[#ff6b35]`
                }`}
                title="Card Grid View (Press 'V')"
                aria-label="Card Grid View (Press 'V')"
                aria-pressed={viewMode === "cards"}
              >
                <LayoutGrid className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline text-xs">Cards</span>
              </button>

              <button
                id="btn_view_compact"
                type="button"
                onClick={() => updateViewMode("compact")}
                className={`px-2 sm:px-2.5 py-1.5 min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 font-medium transition-all rounded-lg flex items-center justify-center gap-1 cursor-pointer text-xs relative before:absolute before:-inset-1.5 sm:before:hidden touch-manipulation ${
                  viewMode === "compact"
                    ? "bg-[#ff6b35] text-white shadow-xs font-semibold"
                    : `${theme.textSub} hover:text-[#ff6b35]`
                }`}
                title="Compact View (Press 'V')"
                aria-label="Compact View (Press 'V')"
                aria-pressed={viewMode === "compact"}
              >
                <List className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline text-xs">Compact</span>
              </button>
            </div>

            {/* Seamless Refresh Button */}
            <button 
              id="btn_refresh_raw"
              onClick={handleManualRefresh} 
              className={`h-9 min-w-[38px] px-2.5 sm:px-2.5 rounded-xl transition border cursor-pointer flex items-center justify-center gap-1.5 relative before:absolute before:-inset-1.5 sm:before:hidden touch-manipulation ${theme.btnSecondary}`} 
              title="Force refresh live market data"
              aria-label="Force refresh live market data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#ff6b35]' : ''}`} />
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-500 font-semibold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </button>
          </div>

        </div>

        {showFiltersMobile && (
          <div className="fixed inset-0 z-50 flex justify-end" onMouseDown={handleCloseFilterDrawer}>
            <div
              className="h-full w-[min(28rem,calc(100%-2.75rem))] border-l border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-zinc-800 dark:bg-[#151620] dark:text-zinc-100"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <FilterPanel
                initialFilters={panelInitialFilters()}
                matchCount={countPanelMatches}
                onApply={applyPanelFilters}
                onReset={resetFilters}
                onClose={handleCloseFilterDrawer}
              />
            </div>
          </div>
        )}

        {/* Premium Sort & Rank Modal (Theme-isolated bottom sheet / modal) */}
        <AnimatePresence>
          {showSortModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={() => {
                setShowSortModal(false);
                setHoveredSortTooltip(null);
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="sort_modal_title"
            >
              <motion.div
                initial={{ opacity: 0, y: 32, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 32, scale: 0.98 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className={`w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] transition-colors duration-200 ${
                  isDarkMode 
                    ? "bg-[#12131b] border-zinc-800 text-zinc-100" 
                    : "bg-white border-slate-200 text-slate-900"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mobile Drag Handle */}
                <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
                  <div className="w-10 h-1 rounded-full bg-zinc-400/40 dark:bg-zinc-700/60" />
                </div>

                {/* Modal Header */}
                <div className={`px-5 py-4 flex items-center justify-between border-b ${
                  isDarkMode ? "border-zinc-800/80" : "border-slate-100"
                }`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4 text-[#ff6b35]" />
                      <h2 id="sort_modal_title" className="font-display font-bold text-sm tracking-tight">
                        Sort & Rank
                      </h2>
                    </div>
                    <p className={`text-xs ${theme.textMuted}`}>
                      Choose how tokens are ordered
                    </p>
                  </div>
                  <button
                    id="btn_close_sort_modal"
                    type="button"
                    onClick={() => {
                      setShowSortModal(false);
                      setHoveredSortTooltip(null);
                    }}
                    className={`p-1.5 rounded-xl border transition cursor-pointer hover:text-[#ff6b35] flex items-center gap-1.5 ${theme.btnSecondary}`}
                    title="Close sort options (Esc)"
                    aria-label="Close sort options (Esc)"
                  >
                    <kbd className={`hidden sm:inline-flex items-center px-1 text-[9px] font-mono rounded border uppercase ${
                      isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-slate-200 border-slate-300 text-slate-600"
                    }`}>Esc</kbd>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Section Header & Options Cards */}
                <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest font-semibold text-zinc-400 dark:text-zinc-500">
                      SORT BY
                    </span>
                  </div>

                  <div className="space-y-2">
                    {SORT_OPTIONS.map((opt, index) => {
                      const isSelected = opt.id === "trending"
                        ? sortBy === "trending" || (sortBy === "none" && activeTab === "trending")
                        : sortBy === opt.id;
                      const isTooltipActive = hoveredSortTooltip === opt.id;
                      const IconComp = opt.icon;
                      return (
                        <div key={opt.id} className="relative">
                          <button
                            id={`btn_sort_opt_${opt.id}`}
                            type="button"
                            onClick={() => {
                              setSortBy(opt.id);
                            }}
                            className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all duration-150 cursor-pointer group active:scale-[0.985] ${
                              isSelected
                                ? isDarkMode
                                  ? "bg-[#ff6b35]/12 border-[#ff6b35]/80 text-zinc-100 ring-1 ring-[#ff6b35]/30 shadow-xs"
                                  : "bg-[#ff6b35]/10 border-[#ff6b35]/80 text-slate-900 ring-1 ring-[#ff6b35]/25 shadow-xs"
                                : isDarkMode
                                  ? "bg-[#181926]/70 hover:bg-[#1f2030] border-zinc-800/80 text-zinc-300 hover:text-zinc-100"
                                  : "bg-slate-50/90 hover:bg-slate-100 border-slate-200/90 text-slate-700 hover:text-slate-900"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                                  isSelected
                                    ? "bg-[#ff6b35] text-white shadow-xs"
                                    : isDarkMode
                                      ? "bg-zinc-800/80 text-zinc-400 group-hover:text-zinc-200"
                                      : "bg-slate-200/80 text-slate-500 group-hover:text-slate-800"
                                }`}
                              >
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold font-display tracking-tight truncate block">
                                    {opt.label}
                                  </span>
                                  <span
                                    id={`btn_sort_help_${opt.id}`}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`How ${opt.label} sorting impacts list order`}
                                    onMouseEnter={() => setHoveredSortTooltip(opt.id)}
                                    onMouseLeave={() => setHoveredSortTooltip(null)}
                                    onFocus={() => setHoveredSortTooltip(opt.id)}
                                    onBlur={() => setHoveredSortTooltip(null)}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setHoveredSortTooltip((prev) => (prev === opt.id ? null : opt.id));
                                    }}
                                    className={`inline-flex items-center justify-center p-0.5 rounded-full transition-colors cursor-help ${
                                      isTooltipActive
                                        ? "text-[#ff6b35] bg-[#ff6b35]/15"
                                        : isDarkMode
                                          ? "text-zinc-400 hover:text-[#ff6b35] hover:bg-zinc-800"
                                          : "text-slate-400 hover:text-[#ff6b35] hover:bg-slate-200/70"
                                    }`}
                                    title={`How ${opt.label} sorting impacts list order`}
                                  >
                                    <HelpCircle className="w-3.5 h-3.5" />
                                  </span>
                                </div>
                                <p
                                  className={`text-[11px] truncate mt-0.5 ${
                                    isSelected
                                      ? isDarkMode ? "text-zinc-300" : "text-slate-600"
                                      : isDarkMode ? "text-zinc-500" : "text-slate-400"
                                  }`}
                                >
                                  {opt.description}
                                </p>
                              </div>
                            </div>

                            {/* Custom selection indicator */}
                            <div className="flex-shrink-0 ml-2">
                              {isSelected ? (
                                <div className="w-5 h-5 rounded-full bg-[#ff6b35] text-white flex items-center justify-center shadow-xs">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-700/80 group-hover:border-zinc-400 dark:group-hover:border-zinc-600 transition-colors" />
                              )}
                            </div>
                          </button>

                          {/* Hover Tooltip explaining sorting metric impact */}
                          <AnimatePresence>
                            {isTooltipActive && (
                              <motion.div
                                initial={{ opacity: 0, y: index < 3 ? -4 : 4, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: index < 3 ? -4 : 4, scale: 0.96 }}
                                transition={{ duration: 0.15 }}
                                className={`absolute z-30 pointer-events-none p-3 rounded-xl shadow-xl text-left border text-[11px] leading-relaxed ${
                                  index < 3 ? "top-full mt-1.5" : "bottom-full mb-1.5"
                                } left-2 right-2 sm:left-12 sm:right-4 ${
                                  isDarkMode 
                                    ? "bg-[#181926] border-zinc-700/90 text-zinc-200 shadow-black/80" 
                                    : "bg-white border-slate-300 text-slate-800 shadow-slate-300/80"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold uppercase font-mono text-[#ff6b35]">
                                  <HelpCircle className="w-3 h-3" />
                                  <span>Metric Impact • {opt.label}</span>
                                </div>
                                <p className={isDarkMode ? "text-zinc-300" : "text-slate-600"}>
                                  {opt.explanation}
                                </p>
                                <div 
                                  className={`absolute w-2 h-2 rotate-45 border ${
                                    index < 3 
                                      ? "-top-1 border-t border-l border-b-0 border-r-0" 
                                      : "-bottom-1 border-b border-r border-t-0 border-l-0"
                                  } left-8 ${
                                    isDarkMode 
                                      ? "bg-[#181926] border-zinc-700/90" 
                                      : "bg-white border-slate-300"
                                  }`} 
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className={`p-4 border-t flex items-center gap-2.5 ${
                  isDarkMode 
                    ? "border-zinc-800/80 bg-[#151622]/50" 
                    : "border-slate-100 bg-zinc-50/50"
                }`}>
                  <button
                    id="btn_reset_sort"
                    type="button"
                    onClick={() => {
                      setSortBy(activeTab === "trending" ? "trending" : "newest");
                      setHoveredSortTooltip(null);
                    }}
                    className={`flex-1 text-center text-xs font-medium py-2.5 border transition rounded-xl cursor-pointer ${theme.btnSecondary}`}
                  >
                    Reset
                  </button>
                  <button
                    id="btn_apply_sort"
                    type="button"
                    onClick={() => {
                      setShowSortModal(false);
                      setHoveredSortTooltip(null);
                    }}
                    className="flex-1 text-center text-xs font-semibold py-2.5 bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white transition rounded-xl cursor-pointer shadow-xs active:scale-95"
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings & Theme Modal */}
        <AnimatePresence>
          {showSettingsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
              onClick={handleCloseSettingsModal}
            >
              <motion.div
                ref={settingsModalRef}
                id="settings_modal_dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings_modal_title"
                aria-describedby="settings_modal_desc"
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
                  isDarkMode 
                    ? "bg-[#11121a] border-zinc-800 text-zinc-100" 
                    : "bg-white border-slate-200 text-slate-900"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
                  isDarkMode ? "border-zinc-800/80 bg-[#151622]/60" : "border-slate-100 bg-zinc-50/60"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#ff6b35]/15 text-[#ff6b35] flex items-center justify-center">
                      <Settings className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 id="settings_modal_title" className="font-display font-bold text-sm sm:text-base tracking-tight">
                        Settings & Preferences
                      </h2>
                      <p id="settings_modal_desc" className={`text-xs ${theme.textMuted}`}>
                        Theme appearance & system synchronization
                      </p>
                    </div>
                  </div>
                  <button
                    ref={settingsCloseBtnRef}
                    id="btn_close_settings_modal"
                    type="button"
                    aria-label="Close settings modal (Esc)"
                    onClick={handleCloseSettingsModal}
                    className={`p-1.5 rounded-xl border transition cursor-pointer hover:text-[#ff6b35] flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#11121a] focus-visible:outline-none ${theme.btnSecondary}`}
                    title="Close settings (Esc)"
                  >
                    <kbd className={`hidden sm:inline-flex items-center px-1 text-[9px] font-mono rounded border uppercase ${
                      isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-slate-200 border-slate-300 text-slate-600"
                    }`}>Esc</kbd>
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
                  {/* Theme Section */}
                  <div role="radiogroup" aria-labelledby="label_theme_heading" className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span id="label_theme_heading" className="text-[11px] uppercase font-mono tracking-wider font-semibold text-zinc-400 dark:text-zinc-500">
                        Color Theme
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400">
                        {themeMode === "system" ? "Auto Sync" : "Manual"}
                      </span>
                    </div>

                    {/* Sync with System Option */}
                    <button
                      id="btn_theme_sync_system"
                      type="button"
                      role="radio"
                      aria-checked={themeMode === "system"}
                      aria-label={`Sync with System theme mode. Currently active, matching OS ${systemPrefersDark ? 'Dark' : 'Light'} mode.`}
                      onClick={() => updateThemeMode("system")}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all duration-150 cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#11121a] focus-visible:outline-none ${
                        themeMode === "system"
                          ? isDarkMode
                            ? "bg-[#ff6b35]/12 border-[#ff6b35]/80 text-zinc-100 ring-1 ring-[#ff6b35]/30 shadow-xs"
                            : "bg-[#ff6b35]/10 border-[#ff6b35]/80 text-slate-900 ring-1 ring-[#ff6b35]/25 shadow-xs"
                          : isDarkMode
                            ? "bg-[#181926]/70 hover:bg-[#1f2030] border-zinc-800/80 text-zinc-300 hover:text-zinc-100"
                            : "bg-slate-50/90 hover:bg-slate-100 border-slate-200/90 text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                            themeMode === "system"
                              ? "bg-[#ff6b35] text-white shadow-xs"
                              : isDarkMode
                                ? "bg-zinc-800/80 text-zinc-400 group-hover:text-zinc-200"
                                : "bg-slate-200/80 text-slate-500 group-hover:text-slate-800"
                          }`}
                        >
                          <Monitor className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-display tracking-tight">
                              Sync with System
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                              OS Auto
                            </span>
                          </div>
                          <p className={`text-[11px] truncate mt-0.5 ${
                            themeMode === "system"
                              ? isDarkMode ? "text-zinc-300" : "text-slate-600"
                              : isDarkMode ? "text-zinc-500" : "text-slate-400"
                          }`}>
                            Matches your operating system (Detected: {systemPrefersDark ? "Dark" : "Light"})
                          </p>
                        </div>
                      </div>

                      <div className="flex-shrink-0 ml-2">
                        {themeMode === "system" ? (
                          <div className="w-5 h-5 rounded-full bg-[#ff6b35] text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-700/80 group-hover:border-zinc-400 dark:group-hover:border-zinc-600 transition-colors" />
                        )}
                      </div>
                    </button>

                    {/* Dark Mode Option */}
                    <button
                      id="btn_theme_dark"
                      type="button"
                      role="radio"
                      aria-checked={themeMode === "dark"}
                      aria-label="Dark Mode theme"
                      onClick={() => updateThemeMode("dark")}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all duration-150 cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#11121a] focus-visible:outline-none ${
                        themeMode === "dark"
                          ? isDarkMode
                            ? "bg-[#ff6b35]/12 border-[#ff6b35]/80 text-zinc-100 ring-1 ring-[#ff6b35]/30 shadow-xs"
                            : "bg-[#ff6b35]/10 border-[#ff6b35]/80 text-slate-900 ring-1 ring-[#ff6b35]/25 shadow-xs"
                          : isDarkMode
                            ? "bg-[#181926]/70 hover:bg-[#1f2030] border-zinc-800/80 text-zinc-300 hover:text-zinc-100"
                            : "bg-slate-50/90 hover:bg-slate-100 border-slate-200/90 text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                            themeMode === "dark"
                              ? "bg-[#ff6b35] text-white shadow-xs"
                              : isDarkMode
                                ? "bg-zinc-800/80 text-zinc-400 group-hover:text-zinc-200"
                                : "bg-slate-200/80 text-slate-500 group-hover:text-slate-800"
                          }`}
                        >
                          <Moon className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold font-display tracking-tight">
                            Dark Mode
                          </span>
                          <p className={`text-[11px] truncate mt-0.5 ${
                            themeMode === "dark"
                              ? isDarkMode ? "text-zinc-300" : "text-slate-600"
                              : isDarkMode ? "text-zinc-500" : "text-slate-400"
                          }`}>
                            Deep contrast dark theme optimized for low-light environments
                          </p>
                        </div>
                      </div>

                      <div className="flex-shrink-0 ml-2">
                        {themeMode === "dark" ? (
                          <div className="w-5 h-5 rounded-full bg-[#ff6b35] text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-700/80 group-hover:border-zinc-400 dark:group-hover:border-zinc-600 transition-colors" />
                        )}
                      </div>
                    </button>

                    {/* Light Mode Option */}
                    <button
                      id="btn_theme_light"
                      type="button"
                      role="radio"
                      aria-checked={themeMode === "light"}
                      aria-label="Light Mode theme"
                      onClick={() => updateThemeMode("light")}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all duration-150 cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#11121a] focus-visible:outline-none ${
                        themeMode === "light"
                          ? isDarkMode
                            ? "bg-[#ff6b35]/12 border-[#ff6b35]/80 text-zinc-100 ring-1 ring-[#ff6b35]/30 shadow-xs"
                            : "bg-[#ff6b35]/10 border-[#ff6b35]/80 text-slate-900 ring-1 ring-[#ff6b35]/25 shadow-xs"
                          : isDarkMode
                            ? "bg-[#181926]/70 hover:bg-[#1f2030] border-zinc-800/80 text-zinc-300 hover:text-zinc-100"
                            : "bg-slate-50/90 hover:bg-slate-100 border-slate-200/90 text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                            themeMode === "light"
                              ? "bg-[#ff6b35] text-white shadow-xs"
                              : isDarkMode
                                ? "bg-zinc-800/80 text-zinc-400 group-hover:text-zinc-200"
                                : "bg-slate-200/80 text-slate-500 group-hover:text-slate-800"
                          }`}
                        >
                          <Sun className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold font-display tracking-tight">
                            Light Mode
                          </span>
                          <p className={`text-[11px] truncate mt-0.5 ${
                            themeMode === "light"
                              ? isDarkMode ? "text-zinc-300" : "text-slate-600"
                              : isDarkMode ? "text-zinc-500" : "text-slate-400"
                          }`}>
                            Clean, high-visibility bright theme with sharp typography
                          </p>
                        </div>
                      </div>

                      <div className="flex-shrink-0 ml-2">
                        {themeMode === "light" ? (
                          <div className="w-5 h-5 rounded-full bg-[#ff6b35] text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-700/80 group-hover:border-zinc-400 dark:group-hover:border-zinc-600 transition-colors" />
                        )}
                      </div>
                    </button>
                  </div>

                  {/* System Scheme Detection Info Banner */}
                  <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    isDarkMode ? "bg-zinc-900/60 border-zinc-800 text-zinc-400" : "bg-slate-100/70 border-slate-200 text-slate-600"
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${systemPrefersDark ? "bg-indigo-400" : "bg-amber-400"}`} />
                      <span>System OS reports: <strong className="font-semibold text-zinc-200 dark:text-zinc-200">{systemPrefersDark ? "Dark Theme" : "Light Theme"}</strong></span>
                    </div>
                    {themeMode !== "system" && (
                      <button
                        type="button"
                        onClick={() => updateThemeMode("system")}
                        className="text-[11px] text-[#ff6b35] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Sync
                      </button>
                    )}
                  </div>

                  {/* Dashboard Layout View Mode Section */}
                  <div role="radiogroup" aria-labelledby="label_layout_heading" className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span id="label_layout_heading" className="text-[11px] uppercase font-mono tracking-wider font-semibold text-zinc-400 dark:text-zinc-500">
                        Dashboard Layout
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 capitalize">
                        {viewMode} Mode
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Card Grid Option */}
                      <button
                        id="btn_settings_view_cards"
                        type="button"
                        role="radio"
                        aria-checked={viewMode === "cards"}
                        onClick={() => updateViewMode("cards")}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all duration-150 cursor-pointer ${
                          viewMode === "cards"
                            ? isDarkMode
                              ? "bg-[#ff6b35]/12 border-[#ff6b35]/80 text-zinc-100 ring-1 ring-[#ff6b35]/30 shadow-xs"
                              : "bg-[#ff6b35]/10 border-[#ff6b35]/80 text-slate-900 ring-1 ring-[#ff6b35]/25 shadow-xs"
                            : isDarkMode
                              ? "bg-[#181926]/70 hover:bg-[#1f2030] border-zinc-800/80 text-zinc-300 hover:text-zinc-100"
                              : "bg-slate-50/90 hover:bg-slate-100 border-slate-200/90 text-slate-700 hover:text-slate-900"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <LayoutGrid className="w-4 h-4 text-[#ff6b35]" />
                          {viewMode === "cards" ? (
                            <div className="w-4 h-4 rounded-full bg-[#ff6b35] text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-zinc-500/40" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold block">Card Grid</span>
                          <span className={`text-[10px] ${theme.textMuted}`}>Visual cards with sparklines</span>
                        </div>
                      </button>

                      {/* Compact Table Option */}
                      <button
                        id="btn_settings_view_compact"
                        type="button"
                        role="radio"
                        aria-checked={viewMode === "compact"}
                        onClick={() => updateViewMode("compact")}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all duration-150 cursor-pointer ${
                          viewMode === "compact"
                            ? isDarkMode
                              ? "bg-[#ff6b35]/12 border-[#ff6b35]/80 text-zinc-100 ring-1 ring-[#ff6b35]/30 shadow-xs"
                              : "bg-[#ff6b35]/10 border-[#ff6b35]/80 text-slate-900 ring-1 ring-[#ff6b35]/25 shadow-xs"
                            : isDarkMode
                              ? "bg-[#181926]/70 hover:bg-[#1f2030] border-zinc-800/80 text-zinc-300 hover:text-zinc-100"
                              : "bg-slate-50/90 hover:bg-slate-100 border-slate-200/90 text-slate-700 hover:text-slate-900"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <List className="w-4 h-4 text-[#ff6b35]" />
                          {viewMode === "compact" ? (
                            <div className="w-4 h-4 rounded-full bg-[#ff6b35] text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-zinc-500/40" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold block">Compact Table</span>
                          <span className={`text-[10px] ${theme.textMuted}`}>Data-dense crypto terminal</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Keyboard Shortcuts Reference */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase font-mono tracking-wider font-semibold text-zinc-400 dark:text-zinc-500">
                        Keyboard Shortcuts
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">Quick Navigation</span>
                    </div>

                    <div className={`p-3 rounded-xl border divide-y ${
                      isDarkMode ? "bg-[#181926]/70 border-zinc-800/80 divide-zinc-800/60" : "bg-slate-50/90 border-slate-200/90 divide-slate-200/60"
                    }`}>
                      <div className="flex items-center justify-between py-1.5 first:pt-0">
                        <span className="text-xs">Open Search Bar</span>
                        <kbd className={`px-2 py-0.5 text-[11px] font-mono rounded border font-semibold ${
                          isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-200" : "bg-white border-slate-300 text-slate-700 shadow-2xs"
                        }`}>S</kbd>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-xs">Open Filter Drawer</span>
                        <kbd className={`px-2 py-0.5 text-[11px] font-mono rounded border font-semibold ${
                          isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-200" : "bg-white border-slate-300 text-slate-700 shadow-2xs"
                        }`}>F</kbd>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-xs">Toggle View (Cards / Compact)</span>
                        <kbd className={`px-2 py-0.5 text-[11px] font-mono rounded border font-semibold ${
                          isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-200" : "bg-white border-slate-300 text-slate-700 shadow-2xs"
                        }`}>V</kbd>
                      </div>
                      <div className="flex items-center justify-between py-1.5 last:pb-0">
                        <span className="text-xs">Close Active Modal or Menu</span>
                        <kbd className={`px-2 py-0.5 text-[11px] font-mono rounded border font-semibold ${
                          isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-200" : "bg-white border-slate-300 text-slate-700 shadow-2xs"
                        }`}>Esc</kbd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className={`p-4 border-t flex items-center justify-end gap-2.5 ${
                  isDarkMode ? "border-zinc-800/80 bg-[#151622]/50" : "border-slate-100 bg-zinc-50/50"
                }`}>
                  <button
                    id="btn_done_settings_modal"
                    type="button"
                    onClick={handleCloseSettingsModal}
                    className="w-full sm:w-auto px-6 text-center text-xs font-semibold py-2.5 bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white transition rounded-xl cursor-pointer shadow-xs active:scale-95 focus-visible:ring-2 focus-visible:ring-[#ff6b35] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#11121a] focus-visible:outline-none"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CSV Export Confirmation Dialog for Large Datasets */}
        <AnimatePresence>
          {showExportConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
              onClick={() => setShowExportConfirm(false)}
            >
              <motion.div
                id="csv_export_confirm_dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="csv_export_confirm_title"
                aria-describedby="csv_export_confirm_desc"
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
                  isDarkMode
                    ? "bg-[#11121a] border-zinc-800 text-zinc-100"
                    : "bg-white border-slate-200 text-slate-900"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
                  isDarkMode ? "border-zinc-800/80 bg-[#151622]/60" : "border-slate-100 bg-zinc-50/60"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                      <Download className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 id="csv_export_confirm_title" className="font-display font-bold text-sm sm:text-base tracking-tight">
                        Confirm CSV Export
                      </h2>
                      <p id="csv_export_confirm_desc" className={`text-xs ${theme.textMuted}`}>
                        Large dataset export verification
                      </p>
                    </div>
                  </div>
                  <button
                    id="btn_close_csv_export_modal"
                    type="button"
                    aria-label="Close export confirmation (Esc)"
                    onClick={() => setShowExportConfirm(false)}
                    className={`p-1.5 rounded-xl border transition cursor-pointer hover:text-[#ff6b35] flex items-center gap-1.5 ${theme.btnSecondary}`}
                  >
                    <kbd className={`hidden sm:inline-flex items-center px-1 text-[9px] font-mono rounded border uppercase ${
                      isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-slate-200 border-slate-300 text-slate-600"
                    }`}>Esc</kbd>
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  <div className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-2 ${
                    isDarkMode ? "bg-zinc-900/60 border-zinc-800/80 text-zinc-300" : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}>
                    <p>
                      You are about to export a dataset of{" "}
                      <strong className="font-semibold text-emerald-500 dark:text-emerald-400">
                        {filteredAndSortedPairs.length} tokens
                      </strong>{" "}
                      from the <span className="font-mono font-medium text-[#ff6b35]">{activeTab.toUpperCase()}</span> view.
                    </p>
                    <p className="text-[11px] opacity-80">
                      Generating full CSV records including on-chain addresses, liquidity depths, volume, and multi-source DEX mappings may cause a brief browser performance pause.
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs px-1">
                    <span className={theme.textMuted}>Dataset size:</span>
                    <span className="font-mono font-semibold">{filteredAndSortedPairs.length} rows (approx. {Math.max(1, Math.round(filteredAndSortedPairs.length * 0.35))} KB)</span>
                  </div>
                </div>

                {/* Footer */}
                <div className={`p-4 border-t flex flex-wrap items-center justify-end gap-2.5 ${
                  isDarkMode ? "border-zinc-800/80 bg-[#151622]/50" : "border-slate-100 bg-zinc-50/50"
                }`}>
                  <button
                    id="btn_cancel_csv_export"
                    type="button"
                    onClick={() => setShowExportConfirm(false)}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${theme.btnSecondary}`}
                  >
                    Cancel
                  </button>
                  <button
                    id="btn_confirm_json_export"
                    type="button"
                    onClick={triggerExportJSON}
                    className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition rounded-xl cursor-pointer shadow-xs inline-flex items-center gap-1.5 active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JSON ({filteredAndSortedPairs.length})</span>
                  </button>
                  <button
                    id="btn_confirm_csv_export"
                    type="button"
                    onClick={triggerExportCSV}
                    className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition rounded-xl cursor-pointer shadow-xs inline-flex items-center gap-1.5 active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV ({filteredAndSortedPairs.length})</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error indicator */}
        {/* Token List / Table Layout */}
        {!searchQuery.trim() && (indexTotal != null || indexPaging || indexPageError) && (
          <div
            id="index_page_status"
            data-total={indexTotal ?? ""}
            data-loaded={filteredAndSortedPairs.length}
            data-more={indexCursor ? "1" : "0"}
            className={`mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs ${theme.textSub}`}
          >
            <span id="index_window_count">
              {discoveryWindowStatus(loadedInWindow, indexTotal)}
            </span>
            {indexPaging && (
              <span className="inline-flex items-center gap-1 text-[#ff6b35]">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Loading
              </span>
            )}
            {indexPageError && (
              <span id="index_page_error" className="text-red-400">{indexPageError}</span>
            )}
            {indexCursor && (
              <button
                id="btn_load_more_index"
                type="button"
                onClick={loadMoreIndex}
                disabled={indexPaging}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${theme.btnSecondary}`}
              >
                {indexPaging ? "Loading…" : "Load more"}
              </button>
            )}
            {indexPageError && !indexCursor && (
              <button
                id="btn_retry_index"
                type="button"
                onClick={() => setIndexRetry((n) => n + 1)}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${theme.btnSecondary}`}
              >
                Retry
              </button>
            )}
          </div>
        )}

        {loading && filteredAndSortedPairs.length === 0 && !searchQuery.trim() ? (
          viewMode === "compact" ? (
            <CompactTableView
              pairs={[]}
              totalCount={0}
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              loading={true}
              sortBy={sortBy}
              onSortChange={(id) => {
                setSortBy(id);
                setCurrentPage(1);
              }}
              isDarkMode={isDarkMode}
              theme={theme}
              copiedAddress={copiedAddress}
              onCopyAddress={copyToClipboard}
              expandedRowKeys={expandedCards}
              onToggleExpandRow={toggleCardExpanded}
              tokenHoldersData={tokenHoldersData}
              onFetchHolders={fetchTokenHolders}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {[1, 2, 3, 4, 5, 6].map(idx => (
                <div key={idx} className={`p-4 rounded-none space-y-4 animate-pulse border ${theme.bgCard}`}>
                  <div className="flex justify-between items-center">
                    <div className={`h-5 rounded w-1/3 ${isDarkMode ? "bg-gray-800" : "bg-slate-200"}`} />
                    <div className={`h-5 rounded w-12 ${isDarkMode ? "bg-gray-800" : "bg-slate-200"}`} />
                  </div>
                  <div className={`h-7 rounded w-full ${isDarkMode ? "bg-gray-800" : "bg-slate-200"}`} />
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className={`h-8 rounded ${isDarkMode ? "bg-gray-800" : "bg-slate-200"}`} />
                    <div className={`h-8 rounded ${isDarkMode ? "bg-gray-800" : "bg-slate-200"}`} />
                    <div className={`h-8 rounded ${isDarkMode ? "bg-gray-800" : "bg-slate-200"}`} />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredAndSortedPairs.length === 0 ? (
          <div className={`border border-dashed py-16 px-6 rounded-none text-center space-y-4 ${
            isDarkMode ? "border-gray-800 bg-[#0f111a]/20" : "border-slate-300 bg-slate-50/50"
          }`}>
            {(() => {
              const searching = searchQuery.trim().length > 0;
              const title = searching
                ? (loading ? "Searching" : "No match")
                : hasActiveFilters
                  ? "No coins match these filters"
                  : error
                    ? "Couldn't load tokens"
                    : "No tokens";
              const subtitle = searching
                ? (loading ? "" : "Nothing matched that search.")
                : hasActiveFilters
                  ? "Reset filters to see the list."
                  : error
                    ? error
                    : "";
              return (
                <>
                  <p className={`text-sm font-semibold ${theme.textTitle}`}>{title}</p>
                  <p id="search_empty_note" className={`text-xs max-w-md mx-auto ${theme.textSub}`}>{subtitle}</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {!searching && !hasActiveFilters && !error && activeTab === "trending" && (
                      <>
                        <button id="btn_empty_mints" type="button" onClick={() => { setActiveTab("fresh_mints"); setSortBy("newest"); }} className="px-4 py-2 border rounded-none text-xs font-mono font-semibold transition cursor-pointer bg-[#ff6b35] text-white border-[#ff6b35]">Show mints</button>
                        <button id="btn_empty_latest" type="button" onClick={() => { setActiveTab("latest"); setSortBy("newest"); }} className={`px-4 py-2 border rounded-none text-xs font-mono font-semibold transition cursor-pointer ${theme.btnSecondary}`}>Show latest</button>
                      </>
                    )}
                    <button
                      id="btn_fallback_clear"
                      onClick={searching ? handleClearSearch : (hasActiveFilters || !error ? resetFilters : handleManualRefresh)}
                      className={`px-4 py-2 border rounded-none text-xs font-mono font-semibold transition cursor-pointer ${theme.btnSecondary}`}
                    >
                      {searching ? "Clear search" : (hasActiveFilters || !error ? "Reset filters" : "Retry")}
                    </button>
                    {searching && hasActiveFilters && (
                      <button
                        id="btn_empty_reset_filters"
                        type="button"
                        onClick={resetFilters}
                        className={`px-4 py-2 border rounded-none text-xs font-mono font-semibold transition cursor-pointer ${theme.btnSecondary}`}
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        ) : viewMode === "compact" ? (
          <CompactTableView
            pairs={paginatedPairs}
            totalCount={filteredAndSortedPairs.length}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            loading={loading}
            sortBy={sortBy}
            onSortChange={(id) => {
              setSortBy(id);
              setCurrentPage(1);
            }}
            isDarkMode={isDarkMode}
            theme={theme}
            copiedAddress={copiedAddress}
            onCopyAddress={copyToClipboard}
            expandedRowKeys={expandedCards}
            onToggleExpandRow={toggleCardExpanded}
            tokenHoldersData={tokenHoldersData}
            onFetchHolders={fetchTokenHolders}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
            <AnimatePresence mode="popLayout">
              {paginatedPairs.map((pair, index) => {
                const chainBadge = getChainBadgeStyle(pair.chainId);
                const volume24h = volumeForDisplay(pair);
                const hasPriceChange = pair.priceChange?.h24 !== undefined && pair.priceChange?.h24 !== null;
                const priceChange24h = hasPriceChange ? Number(pair.priceChange!.h24) : 0;
                const changeKnown = hasPriceChange && Number.isFinite(priceChange24h);
                const marketCapValue = marketCapOf(pair);
                const liquidityValue = pair.liquidity?.usd ?? pair.totalLiquidityUsd;
                
                // Collect socials using comprehensive extractor
                const { tgUrl, twUrl, webUrl, discordUrl } = extractTokenSocials(pair);

                // Active bonding curve check to remove sparkline graph for bonding curve coins
                const hasActiveMarketPool = Boolean(
                  pair.isGraduated ||
                  pair.marketStage === "graduated" ||
                  pair.marketStage === "pumpswap" ||
                  pair.marketStage === "raydium" ||
                  (pair.primaryDex && ["pumpswap", "orca", "meteora", "raydium", "phoenix", "openbook", "lifinity"].includes(pair.primaryDex.toLowerCase())) ||
                  pair.pairs?.some((pr) => ["pumpswap", "orca", "meteora", "raydium"].some((d) => (pr.dexName || pr.dexId || "").toLowerCase().includes(d)))
                );
                const isBondingCurveCoin = Boolean(
                  (pair.isBondingCurve ||
                  pair.marketStage === "bonding_curve" ||
                  pair.launchPlatform === "Pump.fun" ||
                  pair.dexId === "pumpfun" ||
                  pair.dexId === "pump" ||
                  Boolean(pair.bondingCurvePda) ||
                  Boolean((pair as any).realSolReservesFormatted) ||
                  (typeof pair.bondingProgress === "number" && pair.bondingProgress < 100) ||
                  ((pair.chainId || "").toLowerCase() === "solana" && (pair.baseToken?.address || "").toLowerCase().endsWith("pump") && !pair.isGraduated)) &&
                  !hasActiveMarketPool
                );

                // Token Holders & Supply check
                const tokenAddress = pair.baseToken?.address || "";
                const cardKey = `${pair.chainId || "chain"}:${tokenAddress || pair.pairAddress || index}`;
                const isExpanded = Boolean(expandedCards[cardKey]);
                const holderInfo = tokenHoldersData[holderCacheKey(pair.chainId, tokenAddress)];
                const rpcProvider = getRpcHolderProvider(pair.chainId, tokenAddress);
                const topHolders = holderInfo?.topHolders || [];
                const top10SupplyPercentage = holderInfo?.top10SupplyPercentage ?? null;
                const hasHighConcentration = typeof top10SupplyPercentage === "number" && top10SupplyPercentage > 50;
                
                return (
                  <motion.div 
                    key={cardKey}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ 
                      opacity: 1, 
                      y: isExpanded ? -4 : 0,
                      rotateX: isExpanded ? [0, -6, 0] : 0,
                      rotateY: isExpanded ? [0, 4, 0] : 0,
                      scale: isExpanded ? 1.015 : 1,
                    }}
                    whileHover={{
                      y: isExpanded ? -5 : -3,
                      rotateX: 2.5,
                      rotateY: -1.5,
                      transition: { duration: 0.22, ease: "easeOut" }
                    }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ 
                      duration: 0.38, 
                      ease: [0.16, 1, 0.3, 1],
                      delay: isExpanded ? 0 : Math.min(index * 0.03, 0.3) 
                    }}
                    style={{
                      transformStyle: "preserve-3d",
                      transformPerspective: 1000,
                    }}
                    className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col justify-between transition-all duration-300 relative overflow-hidden group border shadow-2xs hover:shadow-md ${theme.bgCard} ${
                      isExpanded 
                        ? (isDarkMode ? "border-[#ff6b35]/60 shadow-lg shadow-[#ff6b35]/5 ring-1 ring-[#ff6b35]/25" : "border-[#ff6b35]/70 shadow-lg shadow-orange-500/10 ring-1 ring-[#ff6b35]/20")
                        : (isDarkMode ? "hover:border-[#ff6b35]/50" : "hover:border-[#ff6b35]/60 hover:shadow-slate-200/60")
                    }`}
                  >
                    <div>
                      {/* Header Row: Chain icon + Token Logo + Symbol/Name + CA button + Price */}
                      <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2.5 relative z-10">
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectChain(normalizeChainName(pair.chainId));
                            }}
                            className="cursor-pointer hover:scale-110 active:scale-95 transition-transform relative before:absolute before:-inset-2 sm:before:hidden touch-manipulation"
                            title={`Filter exclusively by ${pair.chainId?.toUpperCase()} network`}
                          >
                            <ChainIcon chainId={pair.chainId} fallbackClass={chainBadge.bg} />
                          </button>
                          <TokenImage imageUrl={pair.info?.imageUrl} symbol={displaySymbol(pair)} address={pair.baseToken?.address} chainId={pair.chainId} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                              <h3 className={`text-base font-bold ${theme.textTitle} tracking-tight truncate min-w-0`}>
                                {displaySymbol(pair)}
                              </h3>
                              {displayName(pair) !== displaySymbol(pair) && (
                                <span className={`text-xs truncate ${theme.textMuted} hidden sm:inline font-normal`}>
                                  {displayName(pair)}
                                </span>
                              )}
                              {pair.baseToken?.address && (
                                <button 
                                  id={`btn_copy_${pair.baseToken.address}`}
                                  onClick={(e) => { e.stopPropagation(); copyToClipboard(pair.baseToken.address); }} 
                                  className="inline-flex flex-shrink-0 items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-md border border-slate-200/80 dark:border-zinc-800/80 bg-slate-100/80 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-300 hover:text-[#ff6b35] hover:border-[#ff6b35]/40 transition cursor-pointer select-none active:scale-95 relative before:absolute before:-inset-2 sm:before:hidden touch-manipulation"
                                  title="Copy Contract Address"
                                >
                                  <span>CA</span>
                                  {copiedAddress === pair.baseToken.address ? (
                                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-2.5 h-2.5 opacity-60" />
                                  )}
                                </button>
                              )}
                              {pair.pairCreatedAt && (Date.now() - pair.pairCreatedAt <= 3600000) && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#ff6b35]/15 text-[#ff6b35] border border-[#ff6b35]/30">
                                  NEW
                                </span>
                              )}
                              {pair.argusReusedSocials?.hasReusedSocials && (
                                <span 
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1 cursor-help"
                                  title={pair.argusReusedSocials.warningMessage || "Reused socials detected"}
                                >
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  <span>REUSED</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Price right-aligned - Hero element */}
                        <div className="text-right min-w-0 max-w-[48%] shrink flex flex-col items-end">
                          <FormattedPrice
                            value={pair.priceUsd}
                            className="text-sm sm:text-base lg:text-lg font-bold font-mono text-[#ff6b35] tracking-tight"
                          />
                        </div>
                      </div>

                      {/* Sub-bar: Pair age on left + DEX Protocol Badge on right */}
                      <div className={`flex items-center justify-between text-xs mb-1.5 sm:mb-2.5 pb-1.5 sm:pb-2 border-b ${
                        isDarkMode ? "border-zinc-800/60" : "border-slate-100"
                      }`}>
                        <div 
                          className={`text-[11px] ${theme.textMuted} flex items-center gap-1.5`}
                          title={formatExactDate(pair.pairCreatedAt) ? `Created: ${formatExactDate(pair.pairCreatedAt)}` : "Launch time unknown"}
                        >
                          <Clock className="w-3 h-3 flex-shrink-0 opacity-70" /> 
                          <span>
                            {formatTimeAgo(pair.pairCreatedAt) ?? "Unknown"}
                          </span>
                        </div>
                        
                        <DexProtocolBadge pair={pair} />
                      </div>

                      {/* Concentration Alert Badge */}
                      {hasHighConcentration && (
                        <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                          <span
                            className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/35 text-rose-600 dark:text-rose-400"
                            title={`Top 10 holders control ${top10SupplyPercentage}% of total supply`}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            <span>High Concentration ({top10SupplyPercentage}%)</span>
                          </span>
                        </div>
                      )}

                      {/* Metrics Pills: 3-column grid for Liquidity, 24h Vol, Market Cap */}
                      <div className={`grid grid-cols-3 gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-lg sm:rounded-xl mb-2 sm:mb-3 border ${
                        isDarkMode ? "bg-[#181926]/70 border-zinc-800/60" : "bg-slate-50/70 border-slate-200/60"
                      }`}>
                        <div className="text-center overflow-hidden flex flex-col justify-center">
                          <div className={`text-[10px] font-medium truncate uppercase tracking-wider ${theme.textMuted}`}>Liquidity</div>
                          <div className={`text-xs font-bold font-mono mt-0.5 truncate ${theme.textTitle}`}>
                            {liquidityValue !== undefined && liquidityValue !== null
                              ? (liquidityValue > 0
                                  ? `$${Number(liquidityValue) >= 1000000 ? (Number(liquidityValue)/1000000).toFixed(1) + 'M' : Number(liquidityValue) >= 1000 ? (Number(liquidityValue)/1000).toFixed(0) + 'K' : Number(liquidityValue).toFixed(0)}`
                                  : "$0")
                              : "—"}
                          </div>
                        </div>
                        <div className="text-center overflow-hidden flex flex-col justify-center">
                          <div className={`text-[10px] font-medium truncate uppercase tracking-wider ${theme.textMuted}`}>24h Vol</div>
                          <div className={`text-xs font-bold font-mono mt-0.5 truncate ${theme.textTitle}`}>
                            {volume24h !== undefined && volume24h !== null
                              ? (volume24h > 0
                                  ? `$${Number(volume24h) >= 1000000 ? (Number(volume24h)/1000000).toFixed(1) + 'M' : Number(volume24h) >= 1000 ? (Number(volume24h)/1000).toFixed(0) + 'K' : Number(volume24h).toFixed(0)}`
                                  : "$0")
                              : "—"}
                          </div>
                        </div>
                        <div className="text-center overflow-hidden flex flex-col justify-center">
                          <div className={`text-[10px] font-medium truncate uppercase tracking-wider ${theme.textMuted}`}>{marketCapValue != null ? "Market Cap" : "FDV"}</div>
                          <div className={`text-xs font-bold font-mono mt-0.5 truncate ${theme.textTitle}`}>
                            {(() => {
                              const v = marketCapValue != null ? marketCapValue : fdvOf(pair);
                              return v != null && v > 0
                                ? `$${Number(v) >= 1000000 ? (Number(v)/1000000).toFixed(1) + 'M' : Number(v) >= 1000 ? (Number(v)/1000).toFixed(0) + 'K' : Number(v).toFixed(0)}`
                                : "—";
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Sparkline Price Chart with percentage change overlaid */}
                      <div className="mb-3 relative z-10">
                        <div className={`h-14 sm:h-16 w-full p-1 rounded-xl border relative overflow-hidden transition-all ${
                          isDarkMode ? "bg-black/40 border-zinc-800/80 group-hover:border-zinc-700/80" : "bg-slate-50/80 border-slate-200/80 group-hover:border-slate-300"
                        }`}>
                          {/* 24h Percentage Change Badge overlaid directly in the price graph */}
                          {(() => {
                            const shown = changeKnown ? priceChange24h : 0;
                            const up = shown >= 0;
                            return (
                            <div className={`absolute top-1.5 right-1.5 z-20 px-2 py-0.5 text-[10.5px] font-bold font-mono rounded-md border backdrop-blur-md pointer-events-none shadow-2xs ${
                              !changeKnown
                                ? (isDarkMode ? "bg-zinc-900/80 border-zinc-700/60 text-zinc-300" : "bg-slate-100/95 border-slate-300 text-slate-600")
                                : up
                                ? (isDarkMode ? "bg-emerald-950/80 border-emerald-800/60 text-emerald-400" : "bg-emerald-100/95 border-emerald-300 text-emerald-700")
                                : (isDarkMode ? "bg-rose-950/80 border-rose-800/60 text-rose-400" : "bg-rose-100/95 border-rose-300 text-rose-700")
                            }`}>
                              {shown === 0 ? "0%" : `${up ? "▲ +" : "▼ "}${Math.abs(shown) >= 1000 ? Math.abs(shown).toFixed(0) : Math.abs(shown).toFixed(1)}%`}
                            </div>
                            );
                          })()}

                          <TokenSparkline pair={pair} priceChange24h={priceChange24h} isDarkMode={isDarkMode} />
                        </div>
                      </div>
                    </div>

                    {/* Holder & Supply Analytics Expandable Section */}
                    <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/40">
                      <button
                        type="button"
                        onClick={() => toggleCardExpanded(cardKey, tokenAddress, pair.chainId, pair.pairAddress)}
                        className={`w-full py-1.5 px-2.5 rounded-xl border text-[11px] font-medium flex items-center justify-between transition-all cursor-pointer ${
                          isExpanded 
                            ? "bg-[#ff6b35]/10 border-[#ff6b35]/40 text-[#ff6b35]" 
                            : `${theme.btnSecondary} hover:text-[#ff6b35]`
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 opacity-70" />
                          <span>Holders & Supply Analysis</span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                      </button>

                      {/* Expanded Analytics Drawer */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, rotateX: -10, transformPerspective: 800, transformOrigin: "top center" }}
                            animate={{ opacity: 1, height: "auto", rotateX: 0 }}
                            exit={{ opacity: 0, height: 0, rotateX: -6 }}
                            transition={{ 
                              height: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
                              opacity: { duration: 0.22 },
                              rotateX: { duration: 0.32, ease: [0.16, 1, 0.3, 1] }
                            }}
                            style={{ transformStyle: "preserve-3d" }}
                            className="overflow-hidden"
                          >
                            <div className={`mt-2 p-3 rounded-xl border space-y-2.5 text-xs ${
                              isDarkMode ? "bg-[#0e0f18] border-zinc-800/90" : "bg-slate-50 border-slate-200"
                            }`}>
                              {/* On-Chain Protocol Diagnostics (Pump.fun or Robinhood/EVM/Solana Token & Supplier) */}
                              {(pair.bondingCurvePda || pair.isBondingCurve || pair.realSolReservesFormatted) ? (
                                <motion.div 
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.28, delay: 0.04 }}
                                  className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 space-y-1.5 text-[11px]"
                                >
                                  <div className="flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400">
                                    <span className="flex items-center gap-1">
                                      <Zap className="w-3.5 h-3.5" />
                                      <span>On-Chain Bonding Protocol</span>
                                    </span>
                                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20">
                                      {pair.marketStage === "graduated" ? "Graduated" : "Bonding Curve"}
                                    </span>
                                  </div>

                                  {typeof pair.bondingProgress === "number" && (
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[10.5px]">
                                        <span className="opacity-80">Graduation Progress</span>
                                        <span className="font-mono font-bold">{pair.bondingProgress.toFixed(1)}%</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-emerald-950/40 rounded-full overflow-hidden">
                                        <motion.div 
                                          className="h-full bg-emerald-500 rounded-full"
                                          initial={{ width: "0%" }}
                                          animate={{ width: `${Math.min(100, Math.max(0, pair.bondingProgress))}%` }}
                                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                                    {pair.realSolReservesFormatted && (
                                      <div>
                                        <span className="opacity-60 block">Real SOL Reserves:</span>
                                        <span className="font-semibold text-slate-800 dark:text-zinc-200">{pair.realSolReservesFormatted} SOL</span>
                                      </div>
                                    )}
                                    {(pair.creator || holderInfo?.supplier) && (
                                      <div>
                                        <span className="opacity-60 block">Creator / Supplier:</span>
                                        <span className="truncate block font-semibold text-slate-800 dark:text-zinc-200">
                                          {(pair.creator || holderInfo?.supplier || "").slice(0, 4)}...{(pair.creator || holderInfo?.supplier || "").slice(-4)}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {pair.bondingCurvePda && (
                                    <div className="flex items-center justify-between text-[10px] font-mono pt-0.5 border-t border-emerald-500/20">
                                      <span className="opacity-60">Bonding Curve PDA:</span>
                                      <span className="truncate max-w-[140px] text-slate-700 dark:text-zinc-300">
                                        {pair.bondingCurvePda.slice(0, 5)}...{pair.bondingCurvePda.slice(-5)}
                                      </span>
                                    </div>
                                  )}
                                </motion.div>
                              ) : (holderInfo?.supplier || holderInfo?.creator || holderInfo?.totalSupplyFormatted || pair.creator) ? (
                                <motion.div 
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.28, delay: 0.04 }}
                                  className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 space-y-1.5 text-[11px]"
                                >
                                  <div className="flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400">
                                    <span className="flex items-center gap-1">
                                      <Shield className="w-3.5 h-3.5" />
                                      <span>On-Chain Supply & Contract Diagnostics</span>
                                    </span>
                                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20">
                                      {rpcProvider.chainDisplayName.toUpperCase()}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                                    {holderInfo?.totalSupplyFormatted && (
                                      <div>
                                        <span className="opacity-60 block">Total Supply:</span>
                                        <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                          {holderInfo.totalSupplyFormatted} {pair.baseToken?.symbol || ""}
                                        </span>
                                      </div>
                                    )}
                                    {holderInfo?.totalHolders ? (
                                      <div>
                                        <span className="opacity-60 block">Total Holders:</span>
                                        <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                          {holderInfo.totalHolders.toLocaleString()}
                                        </span>
                                      </div>
                                    ) : null}
                                    {(holderInfo?.supplier || holderInfo?.creator || pair.creator) && (
                                      <div className="col-span-2 flex items-center justify-between pt-1 border-t border-emerald-500/20">
                                        <span className="opacity-60">Supplier / Creator:</span>
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                            {(holderInfo?.supplier || holderInfo?.creator || pair.creator || "").slice(0, 6)}...{(holderInfo?.supplier || holderInfo?.creator || pair.creator || "").slice(-4)}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              copyToClipboard(holderInfo?.supplier || holderInfo?.creator || pair.creator || "");
                                            }}
                                            className="opacity-60 hover:opacity-100 transition p-0.5 cursor-pointer"
                                            title="Copy Creator Address"
                                          >
                                            {copiedAddress === (holderInfo?.supplier || holderInfo?.creator || pair.creator) ? (
                                              <Check className="w-3 h-3 text-emerald-500" />
                                            ) : (
                                              <Copy className="w-3 h-3" />
                                            )}
                                          </button>
                                          <a
                                            href={rpcProvider.getExplorerUrl(holderInfo?.supplier || holderInfo?.creator || pair.creator || "", "address")}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="opacity-60 hover:opacity-100 text-emerald-500 hover:text-emerald-400 transition"
                                            title={`View on ${rpcProvider.explorerName}`}
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                          </a>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              ) : null}

                              {/* Argus Portal Analytics & Diagnostics (Arc Mainnet 5042) */}
                              {pair.isArgusLaunch && (
                                <motion.div
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.28, delay: 0.06 }}
                                  className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 space-y-2 text-[11px]"
                                >
                                  <div className="flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400">
                                    <span className="flex items-center gap-1.5">
                                      <Shield className="w-3.5 h-3.5" />
                                      <span>Argus Protocol</span>
                                    </span>
                                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                                      {pair.argusLiquidityLocked ? "Locked in v4" : "Live"}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                                    <div>
                                      <span className="opacity-60 block">Dev Buy:</span>
                                      <span className={`font-semibold ${
                                        pair.argusDevBuyTier === "safe" ? "text-emerald-400" :
                                        pair.argusDevBuyTier === "moderate" ? "text-amber-400" :
                                        pair.argusDevBuyTier === "high_snipe" ? "text-rose-400" : "text-zinc-200"
                                      }`}>
                                        ${(pair.argusDevBuyUsdc ?? 0).toFixed(2)} ({pair.argusDevBuyTier?.toUpperCase() || "SAFE"})
                                      </span>
                                    </div>
                                    <div>
                                      <span className="opacity-60 block">Architecture:</span>
                                      <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                        {pair.argusPortalFamily || "hooked v4"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="opacity-60 block">Buy / Sell Tax:</span>
                                      <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                        {((pair.argusBuyTaxBps || 0) / 100).toFixed(1)}% / {((pair.argusSellTaxBps || 0) / 100).toFixed(1)}%
                                      </span>
                                    </div>
                                    <div>
                                      <span className="opacity-60 block">Base Fee:</span>
                                      <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                        {((pair.argusBaseFeeBps || 100) / 100).toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>

                                  {pair.argusDevBuyNote && (
                                    <div className="text-[10px] text-zinc-400 italic">
                                      {pair.argusDevBuyNote}
                                    </div>
                                  )}

                                  {pair.argusReusedSocials?.hasReusedSocials ? (
                                    <div className="p-2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] space-y-1">
                                      <div className="font-bold flex items-center gap-1 text-amber-400">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>Serial Launcher Warning: Reused Social Handles</span>
                                      </div>
                                      <div>{pair.argusReusedSocials.warningMessage || "Reused social handles detected across prior tokens"}</div>
                                      <div className="opacity-80">
                                        Previously seen in {(pair.argusReusedSocials.matchedTokens?.length || pair.argusReusedSocials.duplicateCount || 1)} prior token launch(es).
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                                      <Check className="w-3 h-3" />
                                      <span>Social Audit: Clean unique handles (No prior recycling detected)</span>
                                    </div>
                                  )}
                                </motion.div>
                              )}

                              {/* Token Launch Timeline & Pool History */}
                              <motion.div 
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.28, delay: 0.06 }}
                                className={`p-2.5 rounded-lg border text-[11px] space-y-1.5 ${
                                  isDarkMode ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-slate-200"
                                }`}
                              >
                                <div className="flex items-center justify-between font-bold">
                                  <span className="flex items-center gap-1 text-[#ff6b35]">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Launch Timeline & Age</span>
                                  </span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#ff6b35]/15 text-[#ff6b35] border border-[#ff6b35]/25">
                                    {formatTimeAgo(pair.pairCreatedAt) ?? "Unknown"}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10.5px]">
                                  <div>
                                    <span className={`${theme.textMuted} block text-[10px]`}>Created / Launched:</span>
                                    <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate block">
                                      {formatExactDate(pair.pairCreatedAt) ?? "Unknown"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className={`${theme.textMuted} block text-[10px]`}>Primary Launch DEX:</span>
                                    <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate block">
                                      {ponsStageLabel(pair) || ((pair.primaryDex === "Raydium" && (pair.launchPlatform === "Pump.fun" || pair.dexes?.some(d => d.toLowerCase().includes("pumpswap")) || pair.sources?.some(s => s.toLowerCase().includes("pumpswap"))))
                                        ? "PumpSwap"
                                        : (pair.primaryDex || "Pool"))}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>

                              {holderInfo?.loading ? (
                                <div className="py-4 text-center space-y-2">
                                  <RefreshCw className="w-4 h-4 animate-spin mx-auto text-[#ff6b35]" />
                                  <p className="text-[11px] opacity-70 font-mono">Querying on-chain top holders ({rpcProvider.chainDisplayName})...</p>
                                </div>
                              ) : topHolders.length > 0 ? (
                                <>
                                  {/* Supply concentration meter */}
                                  <motion.div 
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.28, delay: 0.08 }}
                                    className="space-y-1"
                                  >
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className={theme.textMuted}>Top 10 Supply Concentration:</span>
                                      <span className={`font-mono font-bold ${
                                        typeof top10SupplyPercentage === "number" 
                                          ? (top10SupplyPercentage > 50 ? "text-rose-500" : "text-emerald-500")
                                          : theme.textMuted
                                      }`}>
                                        {typeof top10SupplyPercentage === "number" ? `${top10SupplyPercentage}%` : "Unavailable"}
                                      </span>
                                    </div>
                                    {typeof top10SupplyPercentage === "number" && (
                                      <>
                                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                                          <motion.div
                                            key={`progress-${top10SupplyPercentage}`}
                                            className={`h-full rounded-full ${
                                              top10SupplyPercentage > 50 ? "bg-rose-500" : "bg-emerald-500"
                                            }`}
                                            initial={{ width: "0%" }}
                                            animate={{ width: `${Math.min(top10SupplyPercentage, 100)}%` }}
                                            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                                          />
                                        </div>
                                        {top10SupplyPercentage > 50 && (
                                          <motion.p 
                                            initial={{ opacity: 0, y: 3 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.28, delay: 0.35 }}
                                            className="text-[10px] text-rose-500 dark:text-rose-400 font-medium"
                                          >
                                            ⚠️ Top 10 wallets control over 50% of supply. High dumping risk.
                                          </motion.p>
                                        )}
                                      </>
                                    )}
                                  </motion.div>

                                  {/* Top Holders D3 Pie Distribution Chart */}
                                  <HoldersPieChart
                                    topHolders={topHolders}
                                    top10SupplyPercentage={typeof top10SupplyPercentage === "number" ? top10SupplyPercentage : undefined}
                                    isDarkMode={isDarkMode}
                                  />

                                  {/* Top Holders List */}
                                  <div className="space-y-1.5 pt-1">
                                    <motion.div 
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 0.6 }}
                                      transition={{ duration: 0.25, delay: 0.1 }}
                                      className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider font-semibold"
                                    >
                                      <span>Holder Address</span>
                                      <span>% Supply</span>
                                    </motion.div>
                                    <motion.div 
                                      variants={holderListVariants}
                                      initial="hidden"
                                      animate="visible"
                                      className="space-y-1 max-h-36 overflow-y-auto pr-1"
                                    >
                                      {topHolders.slice(0, 7).map((holder, hIdx) => {
                                        return (
                                          <motion.div
                                            key={`${holder.ownerAddress}-${hIdx}`}
                                            variants={holderItemVariants}
                                            className={`flex items-center justify-between gap-2 p-1.5 rounded-lg font-mono text-[10.5px] border ${
                                              isDarkMode ? "bg-zinc-900/60 border-zinc-800/60" : "bg-white border-slate-200/80"
                                            }`}
                                          >
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <span className="opacity-40 text-[9px]">#{hIdx + 1}</span>
                                              <span className="truncate">
                                                {holder.ownerAddress.slice(0, 4)}...{holder.ownerAddress.slice(-4)}
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
                                              <span className="font-semibold">
                                                {holder.percentageRelativeToTotalSupply > 0
                                                  ? `${holder.percentageRelativeToTotalSupply.toFixed(2)}%`
                                                  : "<0.01%"}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  copyToClipboard(holder.ownerAddress);
                                                }}
                                                className="opacity-50 hover:opacity-100 transition p-0.5 cursor-pointer"
                                                title="Copy Holder Address"
                                              >
                                                {copiedAddress === holder.ownerAddress ? (
                                                  <Check className="w-2.5 h-2.5 text-emerald-500" />
                                                ) : (
                                                  <Copy className="w-2.5 h-2.5" />
                                                )}
                                              </button>
                                              <a
                                                href={rpcProvider.getExplorerUrl(holder.ownerAddress, "address")}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="opacity-50 hover:opacity-100 text-emerald-500 hover:text-emerald-400 transition p-0.5"
                                                title={`View on ${rpcProvider.explorerName}`}
                                              >
                                                <ExternalLink className="w-2.5 h-2.5" />
                                              </a>
                                            </div>
                                          </motion.div>
                                        );
                                      })}
                                    </motion.div>
                                  </div>
                                </>
                              ) : (
                                <div className="py-3 px-2 text-center space-y-2">
                                  <p className="text-[11px] opacity-70">
                                    {holderInfo?.error || "No holder data available for this token."}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => fetchTokenHolders(tokenAddress, pair.chainId, true, pair.pairAddress)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 hover:border-[#ff6b35] hover:text-[#ff6b35] text-[11px] font-medium transition cursor-pointer active:scale-95"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>Scan On-Chain Holders ({rpcProvider.chainDisplayName})</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Footer socials and direct DEX link button */}
                    <div className="flex items-center justify-between gap-2 pt-1.5 relative z-10 border-t border-slate-100 dark:border-zinc-800/40 mt-1.5">
                      <div className="min-w-0 flex-1">
                        <SocialLinksRow pair={pair} size="sm" />
                      </div>
                      <DexProviderButton pair={pair} />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

          {/* Pagination Controls */}
          {filteredAndSortedPairs.length > PAGE_SIZE && (
            <div className={`mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border relative overflow-visible transition-all duration-300 ${theme.bgCard}`}>
              <div className={`text-xs ${theme.textSub}`}>
                Showing <span className={`font-semibold ${theme.textTitle}`}>{Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredAndSortedPairs.length)}</span> to <span className={`font-semibold ${theme.textTitle}`}>{Math.min(currentPage * PAGE_SIZE, filteredAndSortedPairs.length)}</span> of <span className="font-semibold text-[#ff6b35]">{filteredAndSortedPairs.length}</span> tokens
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  id="btn_prev_page"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`min-h-[44px] min-w-[44px] flex items-center justify-center px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation ${theme.btnSecondary}`}
                >
                  Previous
                </button>

                <span className={`text-xs font-medium ${theme.textSub}`}>
                  Page <span className="font-bold text-[#ff6b35]">{currentPage}</span> of <span className={theme.textTitle}>{totalPages}</span>
                </span>

                <button
                  id="btn_next_page"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`min-h-[44px] min-w-[44px] flex items-center justify-center px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation ${theme.btnSecondary}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}

      </main>

      {/* Clean, Minimalist Footer */}
      <footer className={`border-t py-6 px-4 sm:px-6 transition-colors duration-200 mt-12 ${
        isDarkMode 
          ? "bg-[#0d0e15] border-zinc-800/80 text-zinc-400" 
          : "bg-slate-50 border-slate-200 text-slate-500"
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#ff6b35] flex items-center justify-center text-white">
              <Flame className="w-3.5 h-3.5 fill-white" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`font-bold tracking-tight ${isDarkMode ? "text-zinc-200" : "text-slate-800"}`}>
                DexHunter
              </span>
              <span className="opacity-30">·</span>
              <span className="text-xs opacity-75">
                Multi-chain real-time DEX discovery
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              id="btn_footer_export_csv"
              type="button"
              onClick={handleExportToCSV}
              className="hover:text-[#ff6b35] transition-colors cursor-pointer inline-flex items-center gap-1.5 font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <span className="opacity-30">·</span>
            <button
              id="btn_footer_back_to_top"
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-[#ff6b35] transition-colors cursor-pointer inline-flex items-center gap-1.5 font-medium"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Back to Top</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Subtle Toast Notification for Fresh Mints Auto-Polling */}
      <AnimatePresence>
        {freshMintsToast && (
          <motion.div
            id="toast_fresh_mints_update"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.94 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`fixed bottom-6 right-4 sm:right-8 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md ${
              isDarkMode
                ? "bg-[#181926]/95 border-emerald-500/40 text-white shadow-black/60"
                : "bg-white/95 border-emerald-500/40 text-slate-900 shadow-slate-300/60"
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 flex-shrink-0">
              <Zap className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex flex-col pr-1">
              <div className="text-xs font-semibold flex items-center gap-1.5">
                <span>{freshMintsToast.count} new token{freshMintsToast.count > 1 ? "s" : ""} added</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <span className={`text-[10px] ${theme.textSub}`}>Live auto-polling feed updated</span>
            </div>
            <button
              id="btn_dismiss_fresh_mints_toast"
              onClick={() => setFreshMintsToast(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
