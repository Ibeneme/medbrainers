import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { AccessInfo } from "@/api/types";
import { ALL_PERMISSIONS, isPermission } from "../permissions";
import { needForPath } from "../route-access";
import { satisfiesRoute } from "../evaluate";

/** Same permission sets the server seeds (verified there by its own role-matrix test). */
const BILLING = ["view", "write", "collect", "discount", "void", "manage", "gateway", "reports"].map((a) => `billing.${a}`);
const ROLE_PERMS: Record<string, string[]> = {
  financial_manager: ["billing.view", "billing.reports", "dashboard.view"],
  audit: ["billing.view", "billing.reports"],
  cashier: ["billing.view", "billing.write", "billing.collect", "dashboard.view"],
  manager: BILLING.filter((p) => !["billing.gateway", "billing.reports"].includes(p)),
  admin: BILLING,
  ceo: BILLING,
  doctor: ["dashboard.view"],
};
const access = (role: string, over: Partial<AccessInfo> = {}): AccessInfo => ({
  role, roles: [], roleKeys: [role], isOwner: false, isSuperAdmin: false, permissions: ROLE_PERMS[role] ?? [],
  directPermissions: [], deniedPermissions: [], modules: {}, ...over,
});
const canOpen = (a: AccessInfo, path: string) => {
  const n = needForPath(path);
  return n.mapped ? satisfiesRoute(a, n) : false;
};

const PAGES = {
  overview: "/dashboard/billing",
  pos: "/dashboard/billing/pos",
  invoices: "/dashboard/billing/invoices",
  invoice: "/dashboard/billing/invoices/64b000000000000000000001",
  catalog: "/dashboard/billing/catalog",
  discounts: "/dashboard/billing/discounts",
  settings: "/dashboard/billing/settings",
  gateway: "/dashboard/billing/gateway",
  verify: "/dashboard/billing/payments/verify",
  payments: "/dashboard/billing/payments",
  reports: "/dashboard/billing/reports",
  audit: "/dashboard/billing/audit",
};
const open = (a: AccessInfo) => Object.entries(PAGES).filter(([, p]) => canOpen(a, p)).map(([k]) => k).sort();

test("all 8 billing permissions exist in the frontend catalog (mirror of the server)", () => {
  for (const p of BILLING) assert.ok(isPermission(p), p);
  assert.equal(ALL_PERMISSIONS.filter((p) => p.startsWith("billing.")).length, 8);
});

test("every billing page file has an explicit rule (secure-by-default would otherwise deny it)", () => {
  const root = join(process.cwd(), "src/app/dashboard/billing");
  const urls: string[] = [];
  (function walk(dir: string, url: string) {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p, `${url}/${f.replace(/^\[.*\]$/, "x")}`);
      else if (f === "page.tsx") urls.push(url);
    }
  })(root, "/dashboard/billing");
  assert.ok(urls.length >= 12, `expected 12+ billing pages, found ${urls.length}`);
  for (const u of urls) {
    const n = needForPath(u);
    assert.ok(n.mapped, `${u} is unmapped`);
    const need = n.mapped ? n.need : null;
    assert.ok(need && String(need).startsWith("billing."), `${u} should need a billing.* permission, got ${String(need)}`);
  }
});

test("every billing link in the sidebar resolves to a rule", () => {
  const src = readFileSync(join(process.cwd(), "src/components/layouts/dashboard_layout.tsx"), "utf8");
  const hrefs = [...src.matchAll(/href: "(\/dashboard\/billing[^"]*)"/g)].map((m) => m[1]!);
  assert.ok(hrefs.length >= 10, `expected 10+ billing nav links, found ${hrefs.length}`);
  for (const h of hrefs) assert.ok(needForPath(h).mapped, `${h} has no rule`);
});

test("Financial Manager: sees everything financial, cannot sell, collect, or touch Paystack", () => {
  assert.deepEqual(open(access("financial_manager")), ["audit", "catalog", "discounts", "invoice", "invoices", "overview", "payments", "reports", "settings"]);
  assert.ok(!canOpen(access("financial_manager"), PAGES.pos));
  assert.ok(!canOpen(access("financial_manager"), PAGES.gateway));
  assert.ok(!canOpen(access("financial_manager"), PAGES.verify));
});

test("Cashier: sells and collects; no finance reports, payment log, audit or Paystack", () => {
  assert.deepEqual(open(access("cashier")), ["catalog", "discounts", "invoice", "invoices", "overview", "pos", "settings", "verify"]);
});

test("Manager: runs billing day to day but not Paystack keys or finance reports", () => {
  assert.deepEqual(open(access("manager")), ["catalog", "discounts", "invoice", "invoices", "overview", "pos", "settings", "verify"]);
});

test("Admin and CEO open every billing page", () => {
  for (const r of ["admin", "ceo"]) assert.equal(open(access(r)).length, Object.keys(PAGES).length, r);
});

test("Auditor: read-only plus reports/audit", () => {
  assert.deepEqual(open(access("audit")), ["audit", "catalog", "discounts", "invoice", "invoices", "overview", "payments", "reports", "settings"]);
});

test("a role without any billing permission opens nothing in billing", () => {
  assert.deepEqual(open(access("doctor")), []);
});

test("finance pages ALSO need a finance role: a custom role granted billing.reports is not enough (matches the server)", () => {
  const sneaky = access("doctor", { permissions: ["billing.view", "billing.reports"] });
  for (const p of [PAGES.reports, PAGES.payments, PAGES.audit]) assert.ok(!canOpen(sneaky, p), p);
  assert.ok(canOpen(sneaky, PAGES.invoices), "non-finance pages only need the permission");
});

test("owner and super_admin pass the role gate; a denial still wins for the owner", () => {
  const owner = access("doctor", { isOwner: true });
  for (const p of Object.values(PAGES)) assert.ok(canOpen(owner, p), p);
  const superA = access("doctor", { isSuperAdmin: true });
  for (const p of Object.values(PAGES)) assert.ok(canOpen(superA, p), p);
  const deniedOwner = access("doctor", { isOwner: true, deniedPermissions: ["billing.gateway"] });
  assert.ok(!canOpen(deniedOwner, PAGES.gateway));
});

test("the verify page is checked before the generic payments rule", () => {
  // /payments/verify needs billing.collect (cashier OK); /payments (the log) needs billing.reports
  assert.ok(canOpen(access("cashier"), PAGES.verify));
  assert.ok(!canOpen(access("cashier"), PAGES.payments));
});
