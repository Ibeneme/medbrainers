import test from "node:test";
import assert from "node:assert/strict";
import reducer, * as b from "../billingSlice";

type S = ReturnType<typeof reducer>;
const init = (): S => reducer(undefined, { type: "@@init" });
const run = (s: S, ...actions: any[]) => actions.reduce((acc, a) => reducer(acc, a), s);

const quote = (total: number): b.BillingQuote => ({ currency: "NGN", lines: [], appliedDiscounts: [], subtotal: total, discountTotal: 0, total, unusedCodes: [] });
const F = { facilityId: "f1" };
const item = (id: string, price = 100): b.BillingItem => ({ _id: id, itemId: id.toUpperCase(), name: id, department: "pharmacy", unitPrice: price, isActive: true });
const inv = (id: string, total = 100): b.BillingInvoice => ({
  _id: id, status: "draft", lines: [], appliedDiscounts: [], couponCodes: [], currency: "NGN", subtotal: total, discountTotal: 0, total,
  amountPaid: 0, balance: total, overpaid: false, createdAt: "", updatedAt: "",
});

test("REGRESSION: the reducer builds (RTK throws if one action type gets two reducers — this once crashed the whole app at startup)", () => {
  assert.doesNotThrow(() => init());
  const s = init();
  assert.equal(s.settings, null);
  assert.deepEqual(s.catalog.items, []);
});

test("quote: a slow OLD response arriving after a newer one must not overwrite it", () => {
  const cart = { lines: [{ itemId: "A", quantity: 1 }] };
  const p1 = b.quoteCart.pending("r1", { ...F, cart });
  const p2 = b.quoteCart.pending("r2", { ...F, cart });
  const s = run(init(), p1, p2,
    b.quoteCart.fulfilled({ success: true, data: quote(200) } as any, "r2", { ...F, cart }), // newest answers first
    b.quoteCart.fulfilled({ success: true, data: quote(100) } as any, "r1", { ...F, cart }), // stale one arrives late
  );
  assert.equal(s.quote?.total, 200);
  assert.equal(s.quoting, false);
});

test("quote: a stale FAILURE does not wipe a good newer quote", () => {
  const cart = { lines: [{ itemId: "A", quantity: 1 }] };
  const s = run(init(),
    b.quoteCart.pending("r1", { ...F, cart }), b.quoteCart.pending("r2", { ...F, cart }),
    b.quoteCart.fulfilled({ success: true, data: quote(200) } as any, "r2", { ...F, cart }),
    b.quoteCart.rejected(null, "r1", { ...F, cart }, "boom"),
  );
  assert.equal(s.quote?.total, 200);
  assert.equal(s.error, null);
});

test("quote: when the newest request fails, the old price is cleared (never leave a stale total on screen)", () => {
  const cart = { lines: [{ itemId: "A", quantity: 1 }] };
  const s = run(init(),
    b.quoteCart.pending("r1", { ...F, cart }), b.quoteCart.fulfilled({ success: true, data: quote(100) } as any, "r1", { ...F, cart }),
    b.quoteCart.pending("r2", { ...F, cart }), b.quoteCart.rejected(null, "r2", { ...F, cart }, "Some items cannot be billed"),
  );
  assert.equal(s.quote, null);
  assert.equal(s.error, "Some items cannot be billed");
});

test("switching facility wipes billing data (one hospital's money must never show for another)", () => {
  let s = run(init(),
    b.fetchBillingItems.fulfilled({ success: true, data: { items: [item("a")], total: 1, page: 1, limit: 25 } } as any, "x", { ...F }),
    b.fetchBillingSettings.fulfilled({ success: true, data: { acceptCashPayments: false, currency: "GHS" } } as any, "x", F),
  );
  assert.equal(s.catalog.items.length, 1);
  s = run(s, b.resetBilling());
  assert.deepEqual(s.catalog.items, []);
  assert.equal(s.settings, null);
});

test("malformed list responses degrade to empty instead of crashing the page", () => {
  for (const bad of [undefined, null, {}, { items: "nope" }, { stub: true }]) {
    const s = run(init(),
      b.fetchBillingItems.fulfilled({ success: true, data: bad } as any, "x", F),
      b.fetchInvoices.fulfilled({ success: true, data: bad } as any, "x", F),
      b.fetchDiscountRules.fulfilled({ success: true, data: bad } as any, "x", F),
      b.fetchPaymentLogs.fulfilled({ success: true, data: bad } as any, "x", F),
      b.fetchBillingAuditLogs.fulfilled({ success: true, data: bad } as any, "x", F),
    );
    for (const page of [s.catalog, s.invoices, s.discounts, s.payments, s.auditLogs]) {
      assert.ok(Array.isArray(page.items));
      assert.equal(page.total, 0);
    }
  }
});

test("catalog: create prepends, update replaces in place, deactivate replaces in place", () => {
  let s = run(init(), b.fetchBillingItems.fulfilled({ success: true, data: { items: [item("a", 1), item("b", 2)], total: 2, page: 1, limit: 25 } } as any, "x", F));
  s = run(s, b.createBillingItem.fulfilled({ success: true, data: item("c", 3) } as any, "x", { ...F, payload: {} as any }));
  assert.deepEqual(s.catalog.items.map((i: b.BillingItem) => i._id), ["c", "a", "b"]);
  assert.equal(s.catalog.total, 3);
  s = run(s, b.updateBillingItem.fulfilled({ success: true, data: { ...item("a", 999) } } as any, "x", { ...F, itemId: "A", payload: {} }));
  assert.deepEqual(s.catalog.items.map((i: b.BillingItem) => [i._id, i.unitPrice]), [["c", 3], ["a", 999], ["b", 2]]);
  s = run(s, b.deactivateBillingItem.fulfilled({ success: true, data: { ...item("b"), isActive: false } } as any, "x", { ...F, itemId: "B" }));
  assert.equal(s.catalog.items.find((i: b.BillingItem) => i._id === "b")?.isActive, false);
  assert.equal(s.catalog.items.length, 3);
});

test("invoices: a write refreshes the open invoice only when it is the same invoice", () => {
  let s = run(init(), b.fetchInvoice.fulfilled({ success: true, data: { invoice: inv("i1", 100), payments: [] } } as any, "x", { ...F, invoiceId: "i1" }));
  s = run(s, b.issueInvoice.fulfilled({ success: true, data: { ...inv("i2", 5), status: "issued" } } as any, "x", { ...F, invoiceId: "i2" }));
  assert.equal(s.activeInvoice?.invoice._id, "i1", "a different invoice must not replace the open one");
  s = run(s, b.issueInvoice.fulfilled({ success: true, data: { ...inv("i1", 100), status: "issued" } } as any, "x", { ...F, invoiceId: "i1" }));
  assert.equal(s.activeInvoice?.invoice.status, "issued");
  assert.ok(s.invoices.items.some((i: b.BillingInvoice) => i._id === "i1"));
});

test("saving flag and errors follow every write", () => {
  let s = run(init(), b.saveBillingSettings.pending("r", { ...F, payload: {} }));
  assert.equal(s.saving, true);
  s = run(s, b.saveBillingSettings.rejected(null, "r", { ...F, payload: {} }, "Cash is locked"));
  assert.equal(s.saving, false);
  assert.equal(s.error, "Cash is locked");
  s = run(s, b.saveBillingSettings.pending("r2", { ...F, payload: {} }));
  assert.equal(s.error, null, "a new attempt clears the old error");
  s = run(s, b.saveBillingSettings.fulfilled({ success: true, data: { acceptCashPayments: false } } as any, "r2", { ...F, payload: {} }));
  assert.equal(s.saving, false);
  assert.equal(s.settings?.acceptCashPayments, false);
});

test("gateway: state only ever holds the masked view the server sends", () => {
  const masked = { provider: "paystack", activeMode: "test", test: { configured: true, publicKey: "pk_test_x", secretKeyHint: "sk_test_••••a1b2", updatedAt: null }, live: { configured: false, publicKey: null, secretKeyHint: null, updatedAt: null } };
  const s = run(init(), b.saveGatewayKeys.fulfilled({ success: true, data: masked } as any, "x", { ...F, mode: "test", publicKey: "pk_test_x", secretKey: "sk_test_SECRET1234" }));
  assert.equal(s.gateway?.test.secretKeyHint, "sk_test_••••a1b2");
  assert.ok(!JSON.stringify(s).includes("SECRET1234"), "the submitted secret must never be stored in Redux");
});

test("billingError expands server validation errors into readable text", () => {
  const e: any = { isAxiosError: true, response: { data: { message: "Validation failed", errors: [{ path: "lines.0.quantity", message: "Number must be >= 1" }, { path: "", message: "Bad" }] } } };
  assert.equal(b.billingError(e, "fallback"), "lines.0.quantity: Number must be >= 1; Bad");
  assert.equal(b.billingError(new Error("plain"), "fallback").length > 0, true);
});
