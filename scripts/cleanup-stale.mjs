// Runs automatically before `npm run dev` and `npm run build` (see package.json).
// Removes leftover pre-i18n files that cause duplicate navbars/footers and the
// "blocking-prerender-metadata-runtime" error. Only runs when src/app/[lang] exists.
import { existsSync, rmSync } from "node:fs";

if (!existsSync("src/app/[lang]/layout.tsx")) process.exit(0);

const stale = [
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/app/pricing",
  "src/app/solutions",
  "src/app/(auth)",
];

let removed = false;
for (const p of stale) {
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true });
    console.log(`[cleanup] removed old file: ${p}`);
    removed = true;
  }
}
if (removed) rmSync(".next", { recursive: true, force: true });
