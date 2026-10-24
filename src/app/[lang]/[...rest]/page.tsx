import { notFound } from "next/navigation";

/**
 * Catch-all: any URL that matches no page ends up here and renders
 * app/[lang]/not-found.tsx (inside the normal navbar/footer layout),
 * in the visitor's language.
 */
export default function CatchAll() {
  notFound();
}
