import React, { useMemo, useState, useRef } from "react";
import * as d3 from "d3";
import { motion } from "motion/react";
import { PieChart as PieIcon } from "lucide-react";

export interface HolderItem {
  ownerAddress: string;
  balance: string | number;
  balanceFormatted?: string;
  percentageRelativeToTotalSupply: number;
  isContract?: boolean;
}

interface HoldersPieChartProps {
  topHolders: HolderItem[];
  top10SupplyPercentage?: number;
  isDarkMode: boolean;
}

interface ChartSliceData {
  id: string;
  label: string;
  shortAddress: string;
  fullAddress: string;
  percentage: number;
  balanceFormatted?: string;
  isRemaining: boolean;
  color: string;
  rank?: number;
}

const HOLDER_COLORS = [
  "#ff6b35", // #1 Primary brand orange
  "#f59e0b", // #2 Amber
  "#10b981", // #3 Emerald
  "#06b6d4", // #4 Cyan
  "#3b82f6", // #5 Blue
  "#6366f1", // #6 Indigo
  "#8b5cf6", // #7 Violet
  "#ec4899", // #8 Pink
  "#14b8a6", // #9 Teal
  "#f43f5e", // #10 Rose
];

export const HoldersPieChart: React.FC<HoldersPieChartProps> = ({
  topHolders,
  top10SupplyPercentage,
  isDarkMode,
}) => {
  const [hoveredSlice, setHoveredSlice] = useState<ChartSliceData | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const { slices, totalTopPercentage, remainingPercentage } = useMemo(() => {
    if (!topHolders || topHolders.length === 0) {
      return { slices: [], totalTopPercentage: 0, remainingPercentage: 100 };
    }

    const validHolders = topHolders.slice(0, 10);
    let sumTopPct = 0;

    const holderSlices: ChartSliceData[] = validHolders.map((h, i) => {
      const pct = Math.max(0, Number(h.percentageRelativeToTotalSupply) || 0);
      sumTopPct += pct;
      const addr = h.ownerAddress || `Holder-${i + 1}`;
      const shortAddr = addr.length > 8 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;

      return {
        id: `holder-${i}`,
        label: `Holder #${i + 1}`,
        shortAddress: shortAddr,
        fullAddress: addr,
        percentage: pct,
        balanceFormatted: h.balanceFormatted,
        isRemaining: false,
        color: HOLDER_COLORS[i % HOLDER_COLORS.length],
        rank: i + 1,
      };
    });

    const providedTop10 =
      typeof top10SupplyPercentage === "number" && Number.isFinite(top10SupplyPercentage)
        ? Math.max(0, top10SupplyPercentage)
        : null;
    const totalTopPercentage = providedTop10 ?? Math.max(0, sumTopPct);
    const remPct = Math.max(0, 100 - totalTopPercentage);
    const resultSlices: ChartSliceData[] = [...holderSlices];

    if (remPct > 0.05) {
      resultSlices.push({
        id: "remaining-supply",
        label: "Remaining Supply",
        shortAddress: "Public / Other",
        fullAddress: "All other non-top-10 holders & pool liquidity",
        percentage: remPct,
        isRemaining: true,
        color: isDarkMode ? "#334155" : "#cbd5e1",
      });
    }

    return {
      slices: resultSlices,
      totalTopPercentage,
      remainingPercentage: remPct,
    };
  }, [topHolders, isDarkMode, top10SupplyPercentage]);

  // Generate D3 pie arcs
  const arcs = useMemo(() => {
    if (slices.length === 0) return [];

    const pieGenerator = d3
      .pie<ChartSliceData>()
      .value((d) => d.percentage)
      .sort(null)
      .padAngle(0.025);

    const arcGenerator = d3
      .arc<d3.PieArcDatum<ChartSliceData>>()
      .innerRadius(30)
      .outerRadius(52)
      .cornerRadius(3);

    const hoverArcGenerator = d3
      .arc<d3.PieArcDatum<ChartSliceData>>()
      .innerRadius(28)
      .outerRadius(56)
      .cornerRadius(4);

    const pieData = pieGenerator(slices);

    return pieData.map((d) => ({
      data: d.data,
      path: arcGenerator(d) || "",
      hoverPath: hoverArcGenerator(d) || "",
      centroid: arcGenerator.centroid(d),
    }));
  }, [slices]);

  if (slices.length === 0) {
    return null;
  }

  const activeDisplay = hoveredSlice || {
    id: "summary",
    label: `Top ${Math.min(10, topHolders.length)} Concentration`,
    shortAddress: `${totalTopPercentage.toFixed(1)}% of Supply`,
    fullAddress: "",
    percentage: totalTopPercentage,
    isRemaining: false,
    color: "#ff6b35",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.06 }}
      className={`p-2.5 rounded-xl border space-y-2 text-xs select-none ${
        isDarkMode ? "bg-zinc-900/70 border-zinc-800/80" : "bg-white border-slate-200/90 shadow-2xs"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-[11px]">
          <PieIcon className="w-3.5 h-3.5 text-[#ff6b35]" />
          <span>Supply Distribution</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono">
          <span className="opacity-60">Top 10:</span>
          <span
            className={`font-bold ${
              totalTopPercentage > 50
                ? "text-rose-500"
                : totalTopPercentage > 30
                ? "text-amber-500"
                : "text-emerald-500"
            }`}
          >
            {totalTopPercentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Main Visualizer: Interactive D3 Donut & Detail Card */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
        {/* Left: D3 Donut SVG */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center relative py-1">
          <svg
            ref={svgRef}
            viewBox="-60 -60 120 120"
            className="w-28 h-28 overflow-visible cursor-pointer drop-shadow-xs"
          >
            {/* Background ring glow */}
            <circle
              cx="0"
              cy="0"
              r="29"
              fill="transparent"
              stroke={isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}
              strokeWidth="2"
            />

            {/* D3 Slices */}
            {arcs.map((arc) => {
              const isHovered = hoveredSlice?.id === arc.data.id;
              return (
                <path
                  key={arc.data.id}
                  d={isHovered ? arc.hoverPath : arc.path}
                  fill={arc.data.color}
                  opacity={hoveredSlice ? (isHovered ? 1 : 0.45) : 0.92}
                  stroke={isDarkMode ? "#12131a" : "#ffffff"}
                  strokeWidth="1.5"
                  className="transition-all duration-150 ease-out"
                  onMouseEnter={() => setHoveredSlice(arc.data)}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
              );
            })}

            {/* Center Label inside Donut */}
            <text
              textAnchor="middle"
              dy="-0.2em"
              className={`font-mono text-[10px] font-bold ${
                isDarkMode ? "fill-white" : "fill-slate-900"
              }`}
            >
              {hoveredSlice ? `${hoveredSlice.percentage.toFixed(1)}%` : `${totalTopPercentage.toFixed(0)}%`}
            </text>
            <text
              textAnchor="middle"
              dy="1.1em"
              className={`font-sans text-[7.5px] uppercase font-semibold ${
                isDarkMode ? "fill-zinc-400" : "fill-slate-500"
              }`}
            >
              {hoveredSlice
                ? hoveredSlice.isRemaining
                  ? "Other"
                  : `Rank #${hoveredSlice.rank}`
                : "Top 10"}
            </text>
          </svg>
        </div>

        {/* Right: Dynamic Legend & Focused Slice Inspector */}
        <div className="sm:col-span-7 space-y-1.5">
          {/* Active Highlight Pill */}
          <div
            className={`p-1.5 rounded-lg border text-[10.5px] transition-all ${
              hoveredSlice
                ? isDarkMode
                  ? "bg-zinc-800/80 border-zinc-700/80"
                  : "bg-slate-100 border-slate-300"
                : isDarkMode
                ? "bg-zinc-950/40 border-zinc-800/40"
                : "bg-slate-50/80 border-slate-200/60"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: activeDisplay.color }}
                />
                <span className="font-semibold truncate">{activeDisplay.label}</span>
              </div>
              <span className="font-mono font-bold text-xs flex-shrink-0">
                {activeDisplay.percentage.toFixed(2)}%
              </span>
            </div>
            {hoveredSlice ? (
              <div className="mt-0.5 text-[9.5px] font-mono opacity-70 truncate">
                {hoveredSlice.fullAddress}
              </div>
            ) : (
              <div className="mt-0.5 text-[9.5px] opacity-60 flex items-center justify-between">
                <span>Remaining non-top wallets:</span>
                <span className="font-mono font-semibold">{remainingPercentage.toFixed(1)}%</span>
              </div>
            )}
          </div>

          {/* Mini Swatches Legend */}
          <div className="grid grid-cols-2 gap-1 pt-0.5">
            {slices.slice(0, 6).map((s) => (
              <div
                key={s.id}
                onMouseEnter={() => setHoveredSlice(s)}
                onMouseLeave={() => setHoveredSlice(null)}
                className={`flex items-center justify-between px-1.5 py-0.5 rounded cursor-pointer transition-colors text-[9.5px] font-mono ${
                  hoveredSlice?.id === s.id
                    ? isDarkMode
                      ? "bg-zinc-800 text-white font-bold"
                      : "bg-slate-200 text-slate-900 font-bold"
                    : "hover:bg-slate-100 dark:hover:bg-zinc-800/50 opacity-80"
                }`}
              >
                <div className="flex items-center gap-1 truncate mr-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="truncate">{s.isRemaining ? "Rest" : `#${s.rank}`}</span>
                </div>
                <span className="flex-shrink-0">{s.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
