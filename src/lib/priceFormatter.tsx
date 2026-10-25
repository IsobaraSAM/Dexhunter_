import React from "react";
import { formatPriceParts, toSubscriptString } from "./price-format";

export { formatPriceParts, formatPriceString, toSubscriptString } from "./price-format";
export type { FormattedPriceParts } from "./price-format";

interface FormattedPriceProps {
  value: number | string | undefined | null;
  className?: string;
  prefixDollar?: boolean;
}

/**
 * React Component that renders coin prices with unambiguous decimal representation,
 * or compact subscript notation with tap/click toggle for extreme micro-prices.
 */
export const FormattedPrice: React.FC<FormattedPriceProps> = ({
  value,
  className = "",
  prefixDollar = true,
}) => {
  const [showFull, setShowFull] = React.useState(false);
  const parts = formatPriceParts(value);

  if (parts.isSubscript && parts.prefix && parts.subscript && parts.suffix) {
    if (showFull && parts.fullDecimal) {
      const fullDisplay = prefixDollar ? parts.fullDecimal : parts.fullDecimal.replace(/^\$/, "");
      return (
        <span
          className={`inline-flex items-baseline font-mono tracking-tight cursor-pointer select-all underline decoration-dotted decoration-emerald-500/50 hover:opacity-85 transition-opacity ${className}`}
          title={`Click to view compact notation (${parts.rawStr})`}
          onClick={(e) => {
            e.stopPropagation();
            setShowFull(false);
          }}
        >
          {fullDisplay}
        </span>
      );
    }

    const prefix = prefixDollar ? parts.prefix : parts.prefix.replace(/^\$/, "");
    return (
      <span
        className={`inline-flex items-end whitespace-nowrap font-mono tracking-tight cursor-pointer hover:opacity-85 transition-opacity ${className}`}
        title={parts.fullDecimal ? `Tap or click to view full decimal (${parts.fullDecimal})` : `$${value}`}
        onClick={(e) => {
          e.stopPropagation();
          setShowFull(true);
        }}
      >
        <span className="leading-none">{prefix}</span>
        <span
          className="leading-none text-[0.72em]"
          style={{ fontFamily: "Nunito, ui-sans-serif, system-ui, sans-serif" }}
        >
          {toSubscriptString(parts.subscript)}
        </span>
        <span className="leading-none">{parts.suffix}</span>
      </span>
    );
  }

  const formatted = parts.formatted || "N/A";
  const display = prefixDollar ? formatted : formatted.replace(/^\$/, "");

  return (
    <span className={`font-mono tracking-tight ${className}`} title={value ? `$${value}` : undefined}>
      {display}
    </span>
  );
};
