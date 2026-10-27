"use client";

import React, { useMemo } from "react";
import { useTheme } from "@/contexts/theme-context";

/* -------------------------------------------------------------------------- */
/*  <SpecimenBarcode />  real, scannable Code 128 barcode (no libraries)      */
/*  Black bars on white with the code printed underneath, like a retail label. */
/*  - all-digit codes with an even length use the compact Code 128-C           */
/*  - everything else (e.g. SPEC-1730000000000-4821) uses Code 128-B           */
/*  Usage: <SpecimenBarcode value={specimenCode} />                            */
/* -------------------------------------------------------------------------- */

// bar/space widths for symbols 0..102, Start A/B/C (103..105) and Stop (106)
const PATTERNS = [
  "212222",
  "222122",
  "222221",
  "121223",
  "121322",
  "131222",
  "122213",
  "122312",
  "132212",
  "221213",
  "221312",
  "231212",
  "112232",
  "122132",
  "122231",
  "113222",
  "123122",
  "123221",
  "223211",
  "221132",
  "221231",
  "213212",
  "223112",
  "312131",
  "311222",
  "321122",
  "321221",
  "312212",
  "322112",
  "322211",
  "212123",
  "212321",
  "232121",
  "111323",
  "131123",
  "131321",
  "112313",
  "132113",
  "132311",
  "211313",
  "231113",
  "231311",
  "112133",
  "112331",
  "132131",
  "113123",
  "113321",
  "133121",
  "313121",
  "211331",
  "231131",
  "213113",
  "213311",
  "213131",
  "311123",
  "311321",
  "331121",
  "312113",
  "312311",
  "332111",
  "314111",
  "221411",
  "431111",
  "111224",
  "111422",
  "121124",
  "121421",
  "141122",
  "141221",
  "112214",
  "112412",
  "122114",
  "122411",
  "142112",
  "142211",
  "241211",
  "221114",
  "413111",
  "241112",
  "134111",
  "111242",
  "121142",
  "121241",
  "114212",
  "124112",
  "124211",
  "411212",
  "421112",
  "421211",
  "212141",
  "214121",
  "412121",
  "111143",
  "111341",
  "131141",
  "114113",
  "114311",
  "411113",
  "411311",
  "113141",
  "114131",
  "311141",
  "411131",
  "211412",
  "211214",
  "211232",
  "2331112",
];

const START_B = 104;
const START_C = 105;
const STOP = 106;

/** "212222" -> "11" + "0" + "11" + ... (1 = bar module, 0 = space module) */
function toModules(pattern: string) {
  let bar = true;
  let out = "";
  for (const ch of pattern) {
    out += (bar ? "1" : "0").repeat(Number(ch));
    bar = !bar;
  }
  return out;
}

/** Code 128 as a string of 1/0 modules (exported in case you want to reuse it). */
export function code128Modules(raw: string): string {
  // Code 128-B covers printable ASCII (32..126); anything else becomes "-"
  const text = Array.from(raw)
    .map((ch) => {
      const c = ch.charCodeAt(0);
      return c >= 32 && c <= 126 ? ch : "-";
    })
    .join("");

  const values: number[] = [];
  if (/^\d{4,}$/.test(text) && text.length % 2 === 0) {
    values.push(START_C);
    for (let i = 0; i < text.length; i += 2)
      values.push(Number(text.slice(i, i + 2)));
  } else {
    values.push(START_B);
    for (const ch of text) values.push(ch.charCodeAt(0) - 32);
  }

  // checksum: start value + each symbol value x its position, modulo 103
  const checksum =
    values.reduce((sum, v, i) => sum + v * (i === 0 ? 1 : i), 0) % 103;
  values.push(checksum, STOP);

  return values.map((v) => toModules(PATTERNS[v])).join("");
}

export default function SpecimenBarcode({
  value,
  height = 56,
  moduleWidth = 1.6,
  showText = true,
  className = "",
}: {
  value: string;
  /** bar height in px */
  height?: number;
  /** width of the thinnest bar in px (the barcode shrinks to fit narrow screens) */
  moduleWidth?: number;
  showText?: boolean;
  className?: string;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const QUIET = 10; // empty modules each side, required by scanners

  const { path, total } = useMemo(() => {
    if (!value) return { path: "", total: 0 };
    const modules = code128Modules(value);
    let d = "";
    let i = 0;
    while (i < modules.length) {
      if (modules[i] === "1") {
        let j = i;
        while (j < modules.length && modules[j] === "1") j++;
        d += `M${QUIET + i} 0h${j - i}v${height}h-${j - i}z`;
        i = j;
      } else {
        i++;
      }
    }
    return { path: d, total: modules.length + QUIET * 2 };
  }, [value, height]);

  if (!value) return null;

  return (
    <div
      className={`inline-flex max-w-full flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 transition-colors ${className}`}
      style={{
        backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
        borderColor: isDark ? "rgba(255,255,255,0.12)" : "#e5e7eb",
      }}
    >
      <svg
        role="img"
        aria-label={`Barcode ${value}`}
        viewBox={`0 0 ${total} ${height}`}
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        style={{
          width: total * moduleWidth,
          maxWidth: "100%",
          height,
          display: "block",
        }}
      >
        {/* Scanners require a high-contrast background (white works universally) */}
        <rect width={total} height={height} fill="#ffffff" />
        <path d={path} fill="#000000" />
      </svg>
      {showText && (
        <span
          className="max-w-full break-all text-center font-mono text-[13px] font-semibold leading-none tracking-[0.16em]"
          style={{ color: isDark ? "#f3f4f6" : "#000000" }}
        >
          {value}
        </span>
      )}
    </div>
  );
}
