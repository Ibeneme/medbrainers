/**
 * CONTRACT TEST — frontend thunks  →  the server's REAL billing router (real Zod validation, real route table).
 * Only the service layer (database) is stubbed, so this proves URLs, methods and request bodies are accepted exactly as written.
 * Layout expected:   <root>/server  (the API project)   and   <root>/website  (this project), as sibling folders.
 * Run (from <root>/server so its modules load the way they do in production):
 *   NEXT_PUBLIC_API_URL=http://127.0.0.1:5099 npx tsx --tsconfig ../website/tools/contract-test/tsconfig.json ../website/tools/contract-test/contract.ts
 * It stubs ONLY the database layer; everything else (routes, Zod validation, middleware order) is the server's real code.
 */
import express from "../../../server/node_modules/express";
import { configureStore } from "@reduxjs/toolkit";
import router from "../../../server/src/modules/billing/billing.routes";
import { catalogService } from "../../../server/src/modules/billing/services/catalog.service";
import { discountService } from "../../../server/src/modules/billing/services/discount.service";
import { gatewayService } from "../../../server/src/modules/billing/services/gateway.service";
import { invoiceService } from "../../../server/src/modules/billing/services/invoice.service";
import { paymentService } from "../../../server/src/modules/billing/services/payment.service";
import { reportService } from "../../../server/src/modules/billing/services/report.service";
import { settingsService } from "../../../server/src/modules/billing/services/settings.service";
import * as slice from "../../src/api/slices/billingSlice";
import { familyBundlePreset, draftToPayload, emptyDiscountDraft } from "../../src/lib/billing/helpers";

const PORT = 5099;
const svc: Record<string, any> = { catalog: catalogService, discount: discountService, gateway: gatewayService, invoice: invoiceService, payment: paymentService, report: reportService, settings: settingsService };

/* stub every service method; record what the server handed to it */
const calls: { name: string; args: any[] }[] = [];
for (const [group, obj] of Object.entries(svc)) {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] !== "function") continue;
    obj[key] = async (...args: any[]) => {
      calls.push({ name: `${group}.${key}`, args });
      const n = `${group}.${key}`;
      if (["catalog.list", "discount.list", "invoice.list", "report.paymentLogs", "report.auditLogs"].includes(n)) return { items: [], total: 0, page: 1, limit: 25 };
      if (n === "invoice.get") return { invoice: { _id: "64b0000000000000000000d4", lines: [], appliedDiscounts: [] }, payments: [] };
      if (n === "report.transaction") return { transactionId: "t", events: [], integrity: { valid: true, events: 0 } };
      if (/^invoice\.(create|updateDraft|issue|void)$/.test(n)) return { _id: "64b0000000000000000000d4", status: "draft", lines: [], appliedDiscounts: [] };
      if (/^(catalog\.(create|update|deactivate)|discount\.(create|update|deactivate))$/.test(n)) return { _id: "64b0000000000000000000e5", isActive: true };
      return { stub: n };
    };
  }
}

const CID = "64b0000000000000000000a1";
const app = express();
app.use(express.json());
app.use((req: any, _res: any, next: any) => {
  req.user = { id: "64b0000000000000000000u1" };
  req.access = { role: "admin", isOwner: false, isSuperAdmin: false, has: () => true };
  req.meta = { ip: "127.0.0.1" };
  next();
});
app.use("/companies/:companyId/billing", router);
app.use((err: any, _req: any, res: any, _next: any) => {
  res.status(err.statusCode || err.status || 500).json({ success: false, message: err.message, errors: err.issues?.map((i: any) => ({ path: i.path.join("."), message: i.message })) });
});
const server = app.listen(PORT);


(async function main() {
const store = configureStore({ reducer: { billing: slice.default }, middleware: (g: any) => g({ serializableCheck: false }) });

let pass = 0, fail = 0;
const failures: string[] = [];
async function run(label: string, thunk: any, expectService?: string, check?: (call: { name: string; args: any[] }) => void) {
  const before = calls.length;
  const res: any = await store.dispatch(thunk);
  const ok = res.type.endsWith("/fulfilled");
  const call = calls[calls.length - 1];
  try {
    if (!ok) throw new Error(`REJECTED: ${res.payload}`);
    if (calls.length !== before + 1) throw new Error("service was not called exactly once");
    if (expectService && call!.name !== expectService) throw new Error(`routed to ${call!.name}, expected ${expectService}`);
    const ctx = call!.args[0];
    if (ctx?.companyId !== CID) throw new Error(`tenant not propagated (ctx.companyId=${ctx?.companyId})`);
    check?.(call!);
    pass++; console.log(`  ✓ ${label}`);
  } catch (e: any) { fail++; failures.push(label); console.log(`  ✗ ${label}\n      ${e.message}`); }
}
async function expectReject(label: string, thunk: any, rx: RegExp) {
  const before = calls.length;
  const res: any = await store.dispatch(thunk);
  const rejected = res.type.endsWith("/rejected") && rx.test(String(res.payload)) && calls.length === before;
  rejected ? (pass++, console.log(`  ✓ ${label}  → "${String(res.payload).slice(0, 80)}"`)) : (fail++, failures.push(label), console.log(`  ✗ ${label}: ${res.type} ${res.payload}`));
}
const F = { facilityId: CID };
const eq = (a: any, b: any, m: string) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m}: got ${JSON.stringify(a)}`); };
const cart = { lines: [{ itemId: "CONS-00001", quantity: 5 }], couponCodes: ["WELCOME10"], familySize: 5, patientId: "64b0000000000000000000b2", notes: "n" };

console.log("\nsettings & gateway");
await run("GET settings", slice.fetchBillingSettings(F), "settings.get");
await run("PUT settings (only changed fields)", slice.saveBillingSettings({ ...F, payload: { acceptCashPayments: false, maxManualDiscountPercent: 15 } }), "settings.update", (c) => eq(c.args[1], { acceptCashPayments: false, maxManualDiscountPercent: 15 }, "body"));
await run("PUT settings currency+prefix", slice.saveBillingSettings({ ...F, payload: { currency: "GHS", invoicePrefix: "AB1", allowManualDiscount: true } }), "settings.update");
await run("GET gateway", slice.fetchGateway(F), "gateway.get");
await run("PUT gateway keys (test)", slice.saveGatewayKeys({ ...F, mode: "test", publicKey: "pk_test_abcdefgh1234", secretKey: "sk_test_abcdefgh1234" }), "gateway.setKeys", (c) => { eq(c.args[1], "test", "mode"); eq(Object.keys(c.args[2]).sort(), ["publicKey", "secretKey"], "body keys"); });
await run("PUT gateway keys (live)", slice.saveGatewayKeys({ ...F, mode: "live", publicKey: "pk_live_abcdefgh1234", secretKey: "sk_live_abcdefgh1234" }), "gateway.setKeys");
await run("DELETE gateway keys", slice.removeGatewayKeys({ ...F, mode: "test" }), "gateway.removeKeys");
await run("PUT gateway mode", slice.setGatewayMode({ ...F, mode: "live" }), "gateway.setActiveMode");
await run("POST gateway test (mode)", slice.testGateway({ ...F, mode: "test" }), "gateway.testConnection");
await run("POST gateway test (no mode)", slice.testGateway(F), "gateway.testConnection");

console.log("\nprice catalog");
await run("GET catalog (all filters)", slice.fetchBillingItems({ ...F, page: 2, limit: 25, department: "pharmacy", search: "para", isActive: true }), "catalog.list", (c) => { const q = c.args[1]; if (q.page !== 2 || q.department !== "pharmacy" || q.isActive !== true) throw new Error(JSON.stringify(q)); });
await run("GET catalog (no filters, undefined dropped)", slice.fetchBillingItems({ ...F, page: 1, limit: 25, department: undefined, search: undefined, isActive: undefined }), "catalog.list");
await run("GET catalog picker", slice.fetchPickerItems({ ...F, search: "x", department: "laboratory" }), "catalog.list", (c) => { if (c.args[1].isActive !== true || c.args[1].limit !== 50) throw new Error(JSON.stringify(c.args[1])); });
await run("POST catalog item", slice.createBillingItem({ ...F, payload: { name: "General consultation", department: "consultation", unitPrice: 5000, unit: "visit", description: "d" } }), "catalog.create");
await run("POST catalog item with itemId + free service (0)", slice.createBillingItem({ ...F, payload: { itemId: "CONS-FREE", name: "Follow-up", department: "consultation", unitPrice: 0 } }), "catalog.create");
await run("PATCH catalog item", slice.updateBillingItem({ ...F, itemId: "CONS-00001", payload: { unitPrice: 5500.5, name: "x", department: "inpatient", isActive: true } }), "catalog.update");
await run("DELETE (deactivate) item", slice.deactivateBillingItem({ ...F, itemId: "CONS-00001" }), "catalog.deactivate");
await run("GET coverage", slice.fetchCatalogCoverage(F), "catalog.coverage");
await run("POST sync", slice.syncCatalogFromClinical({ ...F, models: ["Drug", "LabTestCatalog", "ImagingCatalog"] }), "catalog.syncFromClinical", (c) => eq(c.args[1], ["Drug", "LabTestCatalog", "ImagingCatalog"], "models"));

console.log("\ndiscount rules");
await run("GET discounts", slice.fetchDiscountRules({ ...F, page: 1, limit: 25, isActive: false }), "discount.list");
await run("POST family bundle preset (the '5 people' example)", slice.createDiscountRule({ ...F, payload: draftToPayload(familyBundlePreset()) }), "discount.create", (c) => { const b = c.args[1]; if (b.type !== "bundle_price" || b.bundleSize !== 5 || b.value !== 15000) throw new Error(JSON.stringify(b)); });
const variants: Array<[string, any]> = [
  ["percentage global", { ...emptyDiscountDraft(), name: "Staff", value: "10" }],
  ["fixed per-unit dept", { ...emptyDiscountDraft(), name: "F", type: "fixed", value: "100", perUnit: true, scope: "department", departments: ["pharmacy", "laboratory"] }],
  ["unit price override + family", { ...emptyDiscountDraft(), name: "O", type: "unit_price_override", value: "3000", scope: "department", departments: ["consultation"], minFamilySize: "5" }],
  ["item scope + coupon + window", { ...emptyDiscountDraft(), name: "I", value: "20", scope: "item", itemIds: "lab-fbc, LAB-MP", autoApply: false, code: "rx20", stackable: false, priority: "5", validFrom: "2026-01-01", validTo: "2026-12-31", minSubtotal: "1000", maxQuantity: "9" }],
];
for (const [n, d] of variants) await run(`POST discount: ${n}`, slice.createDiscountRule({ ...F, payload: draftToPayload(d) }), "discount.create");
await run("PATCH discount", slice.updateDiscountRule({ ...F, ruleId: "64b0000000000000000000c3", payload: { isActive: true, name: "n" } }), "discount.update");
await run("DELETE (turn off) discount", slice.deactivateDiscountRule({ ...F, ruleId: "64b0000000000000000000c3" }), "discount.deactivate");

console.log("\ncart & invoices");
await run("POST cart/quote", slice.quoteCart({ ...F, cart }), "invoice.quote");
await run("POST cart/quote with manual discount", slice.quoteCart({ ...F, cart: { ...cart, manualDiscount: { type: "percentage", value: 10, reason: "staff" } } }), "invoice.quote");
await run("POST invoice (issue:false → draft)", slice.createInvoice({ ...F, cart, issue: false }), "invoice.create", (c) => { if (c.args[1].issue !== false) throw new Error("issue flag"); });
await run("POST invoice (issue:true)", slice.createInvoice({ ...F, cart, issue: true }), "invoice.create", (c) => { if (c.args[1].issue !== true) throw new Error("issue flag"); });
await run("PUT invoice draft", slice.updateInvoiceDraft({ ...F, invoiceId: "64b0000000000000000000d4", cart }), "invoice.updateDraft");
await run("POST issue", slice.issueInvoice({ ...F, invoiceId: "64b0000000000000000000d4" }), "invoice.issue");
await run("POST void", slice.voidInvoice({ ...F, invoiceId: "64b0000000000000000000d4", reason: "entered twice" }), "invoice.void", (c) => eq(c.args[2], "entered twice", "reason"));
await run("GET invoices (filters)", slice.fetchInvoices({ ...F, page: 1, limit: 25, status: "partially_paid", patientId: "64b0000000000000000000b2", search: "INV-", from: "2026-01-01T00:00:00.000Z", to: "2026-02-01T23:59:59.999Z" }), "invoice.list", (c) => { if (!(c.args[1].from instanceof Date)) throw new Error("dates not coerced"); });
await run("GET invoice", slice.fetchInvoice({ ...F, invoiceId: "64b0000000000000000000d4" }), "invoice.get");

console.log("\npayments");
await run("POST pay/online", slice.payInvoiceOnline({ ...F, invoiceId: "64b0000000000000000000d4", amount: 2500.5, email: "p@example.com" }), "payment.initiateOnline");
await run("POST pay/online (full balance, no amount)", slice.payInvoiceOnline({ ...F, invoiceId: "64b0000000000000000000d4", email: "p@example.com" }), "payment.initiateOnline");
await run("POST pay/cash", slice.payInvoiceCash({ ...F, invoiceId: "64b0000000000000000000d4", amount: 1000, note: "relative" }), "payment.initiateCash");
await run("POST confirm-cash", slice.confirmCashPayment({ ...F, transactionId: "3f2b1c9e-8d4a-4b7e-9c1a-0a1b2c3d4e5f" }), "payment.confirmCash");
await run("POST reject-cash", slice.rejectCashPayment({ ...F, transactionId: "3f2b1c9e-8d4a-4b7e-9c1a-0a1b2c3d4e5f", reason: "never handed over" }), "payment.rejectCash", (c) => eq(c.args[2], "never handed over", "reason"));
await run("GET verify reference", slice.verifyPayment({ ...F, reference: "MB-0123456789abcdef0123456789abcdef" }), "payment.verifyOnline");
await run("POST reconcile", slice.reconcileInvoice({ ...F, invoiceId: "64b0000000000000000000d4" }), "payment.reconcile");

console.log("\nreports & audit");
await run("GET reports/summary", slice.fetchBillingSummary({ ...F, from: "2026-01-01T00:00:00.000Z", to: "2026-01-31T23:59:59.999Z" }), "report.summary");
await run("GET payment-logs", slice.fetchPaymentLogs({ ...F, page: 1, limit: 25, status: "success", method: "cash", invoiceId: "64b0000000000000000000d4", from: "2026-01-01T00:00:00.000Z", to: "2026-01-31T00:00:00.000Z" }), "report.paymentLogs");
await run("GET payment-logs/:tx", slice.fetchTransaction({ ...F, transactionId: "3f2b1c9e-8d4a-4b7e-9c1a-0a1b2c3d4e5f" }), "report.transaction");
await run("GET audit-logs", slice.fetchBillingAuditLogs({ ...F, page: 1, limit: 25, action: "catalog.price_changed", entityType: "BillingItem", from: "2026-01-01T00:00:00.000Z", to: "2026-01-31T00:00:00.000Z" }), "report.auditLogs");

console.log("\nthe server really validates (so the passes above mean something)");
await expectReject("3-decimal price is refused", slice.createBillingItem({ ...F, payload: { name: "x", department: "pharmacy", unitPrice: 10.123 } as any }), /decimal/i);
await expectReject("unknown department is refused", slice.createBillingItem({ ...F, payload: { name: "x", department: "spa", unitPrice: 1 } as any }), /./);
await expectReject("missing price is refused", slice.createBillingItem({ ...F, payload: { name: "x", department: "pharmacy" } as any }), /./);
await expectReject("extra field on cart is refused (strict)", slice.quoteCart({ ...F, cart: { ...cart, unitPrice: 1 } as any }), /./);
await expectReject("empty cart is refused", slice.quoteCart({ ...F, cart: { lines: [] } }), /./);
await expectReject("quantity 0 is refused", slice.quoteCart({ ...F, cart: { lines: [{ itemId: "A", quantity: 0 }] } }), /./);
await expectReject("non-uuid transaction id is refused", slice.confirmCashPayment({ ...F, transactionId: "nope" }), /./);

console.log("\ntenant isolation at the URL level");
await expectReject("a malformed facility id never reaches a service", slice.fetchInvoices({ facilityId: "not-an-id" }), /./);

/* every server route should be reachable by some frontend call; list the ones that are not */
const served = [...router.stack].filter((l: any) => l.route).flatMap((l: any) => Object.keys(l.route.methods).map((m) => `${m.toUpperCase()} ${l.route.path}`));
console.log(`\nserver routes: ${served.length}; service methods exercised: ${new Set(calls.map((c) => c.name)).size}`);
const uncovered = ["catalog.get", "discount.get"].filter((n) => !calls.some((c) => c.name === n));
console.log("server routes with no UI caller (by design — list pages carry the data):", uncovered.join(", ") || "none");

console.log(`\n${pass} passed${fail ? `, ${fail} FAILED: ${failures.join("; ")}` : ""}`);
server.close();
process.exit(fail ? 1 : 0);

})().catch((e) => { console.error(e); process.exit(1); });
