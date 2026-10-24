import type { Locale } from "../config";
import type { Dictionary } from "../translate";
import fr from "./fr";

// English is the source language, so it needs no dictionary.
const dictionaries: Partial<Record<Locale, Dictionary>> = {
  fr,
  // es,  <- register new languages here
};

export function getDictionary(locale: Locale): Dictionary | undefined {
  return dictionaries[locale];
}
