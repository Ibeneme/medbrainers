#!/usr/bin/env node
/**
 * Fails (exit 1) if any /dashboard page has no permission rule in src/lib/access/route-access.ts.
 *   node scripts/check-route-access.mjs            → report
 *   node scripts/check-route-access.mjs --list     → also print every route with its requirement
 * Add to package.json:  "check:access": "node scripts/check-route-access.mjs"
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("typescript");

const root = path.resolve(process.cwd(), "src");
const src = fs.readFileSync(path.join(root, "lib/access/route-access.ts"), "utf8");
const js = ts.transpileModule(src, { compilerOptions: { module: "CommonJS", target: "ES2020" } }).outputText;
const mod = { exports: {} };
new Function("exports", "require", "module", js)(mod.exports, require, mod);
const { needForPath } = mod.exports;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name === "page.tsx") out.push(p);
  }
  return out;
}

const appDir = path.join(root, "app");
const pages = walk(path.join(appDir, "dashboard"));
const unmapped = [];
const rows = [];
for (const f of pages) {
  const url =
    "/" +
    path
      .relative(appDir, path.dirname(f))
      .split(path.sep)
      .map((s) => (/^\[.*\]$/.test(s) ? "x" : s))
      .join("/");
  const n = needForPath(url);
  if (!n.mapped) unmapped.push(url);
  rows.push([url, n.mapped ? JSON.stringify(n.need) : "UNMAPPED"]);
}
if (process.argv.includes("--list")) rows.sort().forEach(([u, n]) => console.log(n.padEnd(34), u));
if (unmapped.length) {
  console.error(`\n✗ ${unmapped.length} dashboard page(s) have no access rule:\n  ` + unmapped.join("\n  "));
  process.exit(1);
}
console.log(`✓ all ${pages.length} dashboard pages are covered by an access rule`);
