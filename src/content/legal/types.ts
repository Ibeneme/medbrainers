import type { Locale } from "@/i18n/config";

/**
 * Inline markup supported inside any string:
 *   **bold**   *italic*   {email}  (replaced with the support email, as a mailto link)
 */
export type LegalBlock =
  | { p: string }
  | { caps: string } // upper-case "legal" paragraph (disclaimers)
  | { ul: string[] }
  | { email: true }
  | { note: string };

export type LegalSection = { h: string; blocks: LegalBlock[] };

export type LegalDoc = {
  /** Browser tab / SEO title */
  metaTitle: string;
  metaDescription: string;
  /** Visible page heading */
  title: string;
  /** e.g. "Effective Date: October 20, 2026" */
  updated: string;
  sections: LegalSection[];
};

/** English is required (it is the fallback); other languages are optional. */
export type LegalTranslations = { en: LegalDoc } & Partial<Record<Locale, LegalDoc>>;
