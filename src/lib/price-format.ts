function trimTrailingZeros(value: string): string {
  return value.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

function expandExponential(exp: string): string | null {
  const match = exp.toLowerCase().match(/^(\d)(?:\.(\d+))?e([+-]?\d+)$/);
  if (!match) return null;
  const digits = (match[1] + (match[2] || "")).replace(/0+$/, "") || "0";
  const e = Number(match[3]);
  const point = e + 1;
  if (point <= 0) return "0." + "0".repeat(-point) + digits;
  if (point >= digits.length) return digits + "0".repeat(point - digits.length);
  return digits.slice(0, point) + "." + digits.slice(point);
}

function plainDecimal(val: number | string, num: number): string {
  if (typeof val === "string") {
    const raw = val.trim();
    if (/^0\.\d+$/.test(raw)) return raw.replace(/0+$/, "") || "0";
    if (/^\d+(\.\d+)?e[+-]\d+$/i.test(raw)) {
      const expanded = expandExponential(raw);
      if (expanded) return expanded;
    }
  }
  return expandExponential(num.toExponential(16)) || num.toFixed(18);
}

const SUB_DIGITS: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
};

export function toSubscriptString(num: number | string): string {
  return String(num)
    .split("")
    .map((ch) => SUB_DIGITS[ch] || ch)
    .join("");
}

export interface FormattedPriceParts {
  prefix?: string;
  subscript?: number;
  suffix?: string;
  formatted?: string;
  isSubscript: boolean;
  rawStr: string;
  fullDecimal?: string;
}

export function formatPriceParts(val: number | string | undefined | null): FormattedPriceParts {
  if (val === null || val === undefined || val === "" || val === "N/A") {
    return { formatted: "N/A", isSubscript: false, rawStr: "N/A" };
  }

  const num = typeof val === "number" ? val : Number(val);
  if (isNaN(num) || num <= 0) {
    return { formatted: "N/A", isSubscript: false, rawStr: "N/A" };
  }

  if (num >= 1000) {
    const formatted = "$" + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return { formatted, isSubscript: false, rawStr: formatted, fullDecimal: formatted };
  }

  if (num >= 1) {
    const formatted = "$" + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return { formatted, isSubscript: false, rawStr: formatted, fullDecimal: formatted };
  }

  const str = plainDecimal(val, num);
  const match = str.match(/^0\.(0+)([1-9]\d*)/);
  if (match) {
    const totalZeros = match[1].length;
    const sigDigits = match[2].replace(/0+$/, "") || match[2];
    const shown = sigDigits.slice(0, 4);
    // 0.000005 → $0.0₄5. Subscript counts the zeros after the first one.
    if (totalZeros >= 4) {
      const subCount = totalZeros - 1;
      const rawStr = `$0.0${toSubscriptString(subCount)}${shown}`;
      const fullDecimalStr = "$" + str.replace(/0+$/, "").replace(/\.$/, "");
      return {
        prefix: "$0.0",
        subscript: subCount,
        suffix: shown,
        isSubscript: true,
        rawStr,
        fullDecimal: fullDecimalStr,
      };
    }
    const decimals = Math.min(totalZeros + Math.min(shown.length, 4), 8);
    const formatted = "$" + trimTrailingZeros(num.toFixed(decimals));
    return { formatted, isSubscript: false, rawStr: formatted, fullDecimal: formatted };
  }

  const formatted = "$" + num.toFixed(4);
  return { formatted, isSubscript: false, rawStr: formatted, fullDecimal: formatted };
}

export function formatPriceString(val: number | string | undefined | null): string {
  const parts = formatPriceParts(val);
  return parts.isSubscript ? parts.rawStr : parts.formatted || "N/A";
}
