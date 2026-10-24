import type { Locale } from "@/i18n/config";
import type { LegalDoc } from "./types";
import { cookies } from "./cookies";
import { privacy } from "./privacy";
import { terms } from "./terms";

const all = { privacy, terms, cookies };
export type LegalSlug = keyof typeof all;

/** The document in the visitor's language, falling back to English. */
export function legalDocs(slug: LegalSlug, locale: Locale): LegalDoc {
  return all[slug][locale] ?? all[slug].en;
}
