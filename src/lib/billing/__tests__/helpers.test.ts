import test from "node:test";
import assert from "node:assert/strict";
import { formatMoney } from "@/constants/currencies";
import {
  addToCart, cartSignature, describeConditions, describeDiscountValue, describeScope, draftToPayload, emptyDiscountDraft,
  familyBundlePreset, humanizeAction, parseMoney, ruleToDraft, validateDiscountDraft, validatePaystackKey, webhookUrl,
} from "../helpers";

const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

test("parseMoney accepts normal input and normalises it", () => {
  assert.deepEqual(parseMoney("1,250.50"), { ok: true, value: 1250.5 });
  assert.deepEqual(parseMoney(" 99.9 "), { ok: true, value: 99.9 });
  assert.deepEqual(parseMoney("5000"), { ok: true, value: 5000 });
  assert.deepEqual(parseMoney("0.07"), { ok: true, value: 0.07 });
});
test("parseMoney rejects what the server would reject", () => {
  for (const bad of ["", "  ", "abc", "-5", "1.234", "1e3", "5,00.0.0", "₦500"]) {
    assert.equal(parseMoney(bad).ok, false, `"${bad}" should be rejected`);
  }
  assert.equal(parseMoney("0").ok, false);
  assert.equal(parseMoney("0", { allowZero: true }).ok, true);
});

test("Paystack key validation: format, wrong mode, secret/public mix-ups", () => {
  assert.equal(validatePaystackKey("secret", "test", "sk_test_abcdefgh1234"), null);
  assert.equal(validatePaystackKey("public", "live", "pk_live_abcdefgh1234"), null);
  assert.match(validatePaystackKey("secret", "test", "sk_live_abcdefgh1234")!, /live key/);
  assert.match(validatePaystackKey("secret", "live", "sk_test_abcdefgh1234")!, /test key/);
  assert.match(validatePaystackKey("secret", "test", "pk_test_abcdefgh1234")!, /public key/);
  assert.match(validatePaystackKey("public", "test", "sk_test_abcdefgh1234")!, /SECRET/);
  assert.match(validatePaystackKey("secret", "test", "")!, /Enter/);
  assert.match(validatePaystackKey("secret", "test", "sk_test_short")!, /looks like/);
  assert.match(validatePaystackKey("secret", "test", "hello")!, /looks like/);
});

test("webhook URL carries the tenant id and tolerates a trailing slash", () => {
  assert.equal(webhookUrl("https://api.x.com/", "abc123"), "https://api.x.com/billing/webhooks/paystack/abc123");
  assert.equal(webhookUrl("https://api.x.com", "abc123"), "https://api.x.com/billing/webhooks/paystack/abc123");
});

test("discount draft validation mirrors the server rules", () => {
  const ok = { ...emptyDiscountDraft(), name: "Staff 10%", value: "10" };
  assert.equal(validateDiscountDraft(ok), null);
  assert.match(validateDiscountDraft({ ...ok, name: " " })!, /name/);
  assert.match(validateDiscountDraft({ ...ok, value: "" })!, /value/);
  assert.match(validateDiscountDraft({ ...ok, value: "0" })!, /percentage/);
  assert.match(validateDiscountDraft({ ...ok, value: "101" })!, /percentage/);
  assert.match(validateDiscountDraft({ ...ok, type: "fixed", value: "0" })!, /greater than 0/);
  assert.match(validateDiscountDraft({ ...ok, type: "fixed", value: "10.123" })!, /2 decimal/);
  assert.match(validateDiscountDraft({ ...ok, type: "bundle_price", value: "15000", bundleSize: "1" })!, /size/);
  assert.match(validateDiscountDraft({ ...ok, scope: "department" })!, /department/);
  assert.match(validateDiscountDraft({ ...ok, scope: "item", itemIds: " , " })!, /item ID/);
  assert.match(validateDiscountDraft({ ...ok, autoApply: false })!, /coupon/);
  assert.match(validateDiscountDraft({ ...ok, autoApply: false, code: "a b" })!, /Coupon code/);
  assert.equal(validateDiscountDraft({ ...ok, autoApply: false, code: "WELCOME10" }), null);
  assert.match(validateDiscountDraft({ ...ok, minQuantity: "5", maxQuantity: "2" })!, /Maximum/);
  assert.match(validateDiscountDraft({ ...ok, minQuantity: "0" })!, /whole number/);
  assert.match(validateDiscountDraft({ ...ok, minQuantity: "2.5" })!, /whole number/);
  assert.match(validateDiscountDraft({ ...ok, minSubtotal: "-1" })!, /negative/);
  assert.match(validateDiscountDraft({ ...ok, priority: "abc" })!, /Priority/);
  assert.match(validateDiscountDraft({ ...ok, validFrom: "2026-05-02", validTo: "2026-05-01" })!, /on or after/);
});

test("the family-bundle preset is valid and produces exactly what the server expects", () => {
  const p = familyBundlePreset();
  assert.equal(validateDiscountDraft(p), null);
  const payload = draftToPayload(p);
  assert.equal(payload.type, "bundle_price");
  assert.equal(payload.bundleSize, 5);
  assert.equal(payload.value, 15000);
  assert.equal(payload.scope, "department");
  assert.deepEqual(payload.departments, ["consultation"]);
  assert.deepEqual(payload.conditions, { minQuantity: 5 });
  assert.equal(payload.autoApply, true);
});

test("draftToPayload only sends fields relevant to the chosen type/scope", () => {
  const d = { ...emptyDiscountDraft(), name: "X", value: "10", scope: "item" as const, itemIds: "lab-fbc, LAB-FBC  lab-mp", departments: ["pharmacy" as const], perUnit: true, bundleSize: "9" };
  const p = draftToPayload(d);
  assert.deepEqual(p.itemIds, ["LAB-FBC", "LAB-MP"], "ids upper-cased and de-duplicated");
  assert.deepEqual(p.departments, [], "departments dropped for item scope");
  assert.equal("perUnit" in p, false, "perUnit only for fixed");
  assert.equal("bundleSize" in p, false, "bundleSize only for bundle_price");
  const fixed = draftToPayload({ ...d, type: "fixed", scope: "global" });
  assert.equal(fixed.perUnit, true);
  assert.deepEqual(fixed.itemIds, []);
});

test("a rule survives the edit round-trip (rule → draft → payload)", () => {
  const rule: any = {
    _id: "r1", name: "Pharma 15%", type: "percentage", value: 15, scope: "department", departments: ["pharmacy"], itemIds: [],
    conditions: { minSubtotal: 2000 }, autoApply: false, code: "RX15", stackable: false, priority: 5,
    validFrom: "2026-01-01T00:00:00.000Z", validTo: "2026-12-31T23:59:59.999Z", isActive: true,
  };
  const back = draftToPayload(ruleToDraft(rule));
  assert.equal(back.name, "Pharma 15%");
  assert.equal(back.value, 15);
  assert.deepEqual(back.departments, ["pharmacy"]);
  assert.deepEqual(back.conditions, { minSubtotal: 2000 });
  assert.equal(back.code, "RX15");
  assert.equal(back.autoApply, false);
  assert.equal(back.stackable, false);
  assert.equal(back.priority, 5);
});

test("plain-English descriptions", () => {
  assert.equal(describeDiscountValue({ type: "percentage", value: 10 }, fmt), "10% off");
  assert.equal(describeDiscountValue({ type: "fixed", value: 500 }, fmt), "₦500 off");
  assert.equal(describeDiscountValue({ type: "fixed", value: 100, perUnit: true }, fmt), "₦100 off per unit");
  assert.equal(describeDiscountValue({ type: "unit_price_override", value: 3000 }, fmt), "₦3,000 each");
  assert.equal(describeDiscountValue({ type: "bundle_price", value: 15000, bundleSize: 5 }, fmt), "5 for ₦15,000");
  assert.equal(describeScope({ scope: "global", departments: [], itemIds: [] }), "All services");
  assert.equal(describeScope({ scope: "department", departments: ["consultation", "blood_bank"], itemIds: [] }), "Consultation, Blood bank");
  assert.equal(describeScope({ scope: "item", departments: [], itemIds: ["A", "B", "C", "D", "E"] }), "A, B, C +2");
  assert.equal(describeConditions({ minQuantity: 5, minFamilySize: 5, minSubtotal: 1000 }, fmt), "at least 5 units · spend ≥ ₦1,000 · family of 5+");
  assert.equal(describeConditions({}, fmt), "");
});

test("audit actions get readable labels, unknown ones are humanised", () => {
  assert.equal(humanizeAction("catalog.price_changed"), "Price changed");
  assert.equal(humanizeAction("gateway.keys_updated"), "Paystack keys updated");
  assert.equal(humanizeAction("some.new_thing"), "Some new thing");
});

test("cart: adding the same item merges quantities and caps at 1000", () => {
  const item = { itemId: "CONS-1", name: "Consult", department: "consultation" as const, unitPrice: 5000 };
  let lines = addToCart([], item);
  lines = addToCart(lines, item, 2);
  assert.equal(lines.length, 1);
  assert.equal(lines[0]!.quantity, 3);
  assert.equal(addToCart(lines, item, 5000)[0]!.quantity, 1000);
  assert.equal(addToCart(lines, { ...item, itemId: "CONS-2" }).length, 2);
});

test("cart signature ignores order/case but notices every price-relevant change", () => {
  const base = { lines: [{ itemId: "A", quantity: 1 }, { itemId: "B", quantity: 2 }], couponCodes: ["x1", "Y2"], familySize: 5, manual: null };
  const same = { ...base, lines: [...base.lines].reverse(), couponCodes: ["y2", "X1"] };
  assert.equal(cartSignature(base), cartSignature(same));
  assert.notEqual(cartSignature(base), cartSignature({ ...base, lines: [{ itemId: "A", quantity: 2 }, base.lines[1]!] }));
  assert.notEqual(cartSignature(base), cartSignature({ ...base, familySize: 4 }));
  assert.notEqual(cartSignature(base), cartSignature({ ...base, couponCodes: [] }));
  assert.notEqual(cartSignature(base), cartSignature({ ...base, manual: { type: "fixed", value: 5, reason: "x" } }));
});

test("formatMoney: whole amounts are clean, fractional amounts always show 2 decimals (never ₦1,250.5)", () => {
  assert.equal(formatMoney(5000, "NGN"), "₦5,000");
  assert.equal(formatMoney(1250.5, "NGN"), "₦1,250.50");
  assert.equal(formatMoney(0.07, "NGN"), "₦0.07");
  assert.equal(formatMoney(1234567.89, "NGN"), "₦1,234,567.89");
  assert.equal(formatMoney(0, "NGN"), "₦0");
  assert.equal(formatMoney(undefined, "NGN"), "₦0");
  assert.equal(formatMoney(100.5, "JPY").includes("."), false, "zero-decimal currencies never show decimals");
});
