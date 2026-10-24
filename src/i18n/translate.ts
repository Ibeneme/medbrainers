export type Dictionary = Record<string, string>;

/**
 * Looks the English text up in the dictionary. If there is no translation
 * the English text is returned, so a missing key never breaks a page.
 */
export function translate(dict: Dictionary | undefined, text: string): string {
  if (!dict || !text) return text;
  const m = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!m) return text;
  const core = m[2].replace(/\s+/g, " ");
  const hit = dict[core];
  return hit ? m[1] + hit + m[3] : text;
}
