import { getDictionary } from "./dictionaries";
import type { Locale } from "./config";
import { translate } from "./translate";

/** Translator for server code (metadata, server components). */
export function getT(locale: Locale) {
  const dict = getDictionary(locale);
  return (text: string) => translate(dict, text);
}
