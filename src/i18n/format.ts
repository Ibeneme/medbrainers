/** Locale-aware number for the animated stats: 99.9% (en) -> 99,9 % (fr). */
export function formatStat(
  n: number,
  s: { prefix?: string; suffix?: string; decimals?: number },
  locale: string
): string {
  const fr = locale === "fr";
  const num = n.toLocaleString(fr ? "fr-FR" : "en-US", {
    minimumFractionDigits: s.decimals ?? 0,
    maximumFractionDigits: s.decimals ?? 0,
  });
  const suffix = fr && s.suffix === "%" ? " %" : s.suffix ?? "";
  return `${s.prefix ?? ""}${num}${suffix}`;
}
