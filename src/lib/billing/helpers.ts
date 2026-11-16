/**
 * Pure billing helpers (no React, no Redux) — unit-tested in lib/billing/__tests__.
 * Validation here MIRRORS the server (modules/billing: Zod schemas + Mongoose validators) so people get
 * instant feedback; the server remains the authority and re-validates everything.
 */
import type {
  BillingDepartment,
  BillingDiscountRule,
  DiscountPayload,
  DiscountScope,
  DiscountType,
  GatewayMode,
} from "@/api/slices/billingSlice";
import { DEPARTMENT_LABELS } from "@/api/slices/billingSlice";

/* ───────────────────────────── money ───────────────────────────── */

export type Parsed = { ok: true; value: number } | { ok: false; error: string };

/**
 * Parse what a person typed into a price/amount. Accepts "1,250.50", "1250", " 99.9 ".
 * Rejects empty, negative, non-numeric and more than 2 decimals (the server would too).
 */
export function parseMoney(input: string, opts: { allowZero?: boolean } = {}): Parsed {
  const raw = String(input ?? "").trim().replace(/,/g, "");
  if (raw === "") return { ok: false, error: "Enter an amount" };
  if (!/^\d+(\.\d+)?$/.test(raw)) return { ok: false, error: "Use numbers only, e.g. 1500 or 1500.50" };
  if (/\.\d{3,}$/.test(raw)) return { ok: false, error: "At most 2 decimal places" };
  const value = Math.round(Number(raw) * 100) / 100;
  if (!Number.isFinite(value)) return { ok: false, error: "Not a valid amount" };
  if (value === 0 && !opts.allowZero) return { ok: false, error: "Must be greater than 0" };
  return { ok: true, value };
}

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/* ───────────────────────── Paystack keys ───────────────────────── */

const KEY_RE = {
  secret: { test: /^sk_test_[A-Za-z0-9]{8,}$/, live: /^sk_live_[A-Za-z0-9]{8,}$/ },
  public: { test: /^pk_test_[A-Za-z0-9]{8,}$/, live: /^pk_live_[A-Za-z0-9]{8,}$/ },
};

/** null = fine, otherwise a message. Catches the classic mistake of pasting a live key into the test box. */
export function validatePaystackKey(kind: "secret" | "public", mode: GatewayMode, value: string): string | null {
  const v = value.trim();
  if (!v) return kind === "secret" ? "Enter the secret key" : "Enter the public key";
  const prefix = kind === "secret" ? "sk" : "pk";
  const other: GatewayMode = mode === "test" ? "live" : "test";
  if (KEY_RE[kind][other].test(v)) return `This is a ${other} key — put it in the ${other} section`;
  if (kind === "secret" && v.startsWith("pk_")) return "That is a public key (pk_…). The secret key starts with sk_";
  if (kind === "public" && v.startsWith("sk_")) return "That is a SECRET key (sk_…). Never paste it in the public key box";
  if (!KEY_RE[kind][mode].test(v)) return `A ${mode} ${kind} key looks like ${prefix}_${mode}_…`;
  return null;
}

/** Where this tenant must point its Paystack dashboard webhook. */
export const webhookUrl = (apiBase: string, facilityId: string) =>
  `${apiBase.replace(/\/$/, "")}/billing/webhooks/paystack/${facilityId}`;

/* ───────────────────────── discount rules ───────────────────────── */

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: "Percentage off",
  fixed: "Fixed amount off",
  unit_price_override: "Special unit price",
  bundle_price: "Bundle price",
};
export const DISCOUNT_SCOPE_LABELS: Record<DiscountScope, string> = {
  global: "Everything on the bill",
  department: "Specific departments",
  item: "Specific items (a drug / test / service)",
};

type Fmt = (n: number) => string;

export function describeDiscountValue(r: Pick<BillingDiscountRule, "type" | "value" | "perUnit" | "bundleSize">, fmt: Fmt): string {
  switch (r.type) {
    case "percentage":
      return `${r.value}% off`;
    case "fixed":
      return `${fmt(r.value)} off${r.perUnit ? " per unit" : ""}`;
    case "unit_price_override":
      return `${fmt(r.value)} each`;
    case "bundle_price":
      return `${r.bundleSize ?? "?"} for ${fmt(r.value)}`;
  }
}

export function describeScope(r: Pick<BillingDiscountRule, "scope" | "departments" | "itemIds">): string {
  if (r.scope === "global") return "All services";
  if (r.scope === "department") return (r.departments || []).map((d) => DEPARTMENT_LABELS[d] ?? d).join(", ") || "—";
  const ids = r.itemIds || [];
  return ids.length > 3 ? `${ids.slice(0, 3).join(", ")} +${ids.length - 3}` : ids.join(", ") || "—";
}

export function describeConditions(c: BillingDiscountRule["conditions"] | undefined, fmt: Fmt): string {
  if (!c) return "";
  const out: string[] = [];
  if (c.minQuantity) out.push(`at least ${c.minQuantity} units`);
  if (c.maxQuantity) out.push(`at most ${c.maxQuantity} units`);
  if (c.minSubtotal) out.push(`spend ≥ ${fmt(c.minSubtotal)}`);
  if (c.minFamilySize) out.push(`family of ${c.minFamilySize}+`);
  return out.join(" · ");
}

/** The form works in strings; this is its shape. */
export interface DiscountDraft {
  name: string;
  description: string;
  type: DiscountType;
  value: string;
  perUnit: boolean;
  bundleSize: string;
  scope: DiscountScope;
  departments: BillingDepartment[];
  itemIds: string; // comma / space separated
  minQuantity: string;
  maxQuantity: string;
  minSubtotal: string;
  minFamilySize: string;
  autoApply: boolean;
  code: string;
  stackable: boolean;
  priority: string;
  validFrom: string; // yyyy-mm-dd
  validTo: string;
  isActive: boolean;
}

export const emptyDiscountDraft = (): DiscountDraft => ({
  name: "", description: "", type: "percentage", value: "", perUnit: false, bundleSize: "", scope: "global",
  departments: [], itemIds: "", minQuantity: "", maxQuantity: "", minSubtotal: "", minFamilySize: "",
  autoApply: true, code: "", stackable: true, priority: "100", validFrom: "", validTo: "", isActive: true,
});

/** "5 people pay 3k instead of 5k" — a one-click starting point. */
export const familyBundlePreset = (): DiscountDraft => ({
  ...emptyDiscountDraft(),
  name: "Family bundle (5 people)",
  description: "Five family members consulting together pay a reduced bundle price.",
  type: "bundle_price", value: "15000", bundleSize: "5", scope: "department", departments: ["consultation"], minQuantity: "5",
});

const dateInput = (iso?: string) => (iso ? iso.slice(0, 10) : "");

export function ruleToDraft(r: BillingDiscountRule): DiscountDraft {
  const n = (v?: number) => (v === undefined || v === null ? "" : String(v));
  return {
    name: r.name, description: r.description ?? "", type: r.type, value: String(r.value), perUnit: !!r.perUnit, bundleSize: n(r.bundleSize),
    scope: r.scope, departments: r.departments ?? [], itemIds: (r.itemIds ?? []).join(", "),
    minQuantity: n(r.conditions?.minQuantity), maxQuantity: n(r.conditions?.maxQuantity), minSubtotal: n(r.conditions?.minSubtotal), minFamilySize: n(r.conditions?.minFamilySize),
    autoApply: r.autoApply, code: r.code ?? "", stackable: r.stackable, priority: String(r.priority ?? 100),
    validFrom: dateInput(r.validFrom), validTo: dateInput(r.validTo), isActive: r.isActive,
  };
}

const num = (s: string) => (s.trim() === "" ? undefined : Number(s.replace(/,/g, "")));
const splitIds = (s: string) => Array.from(new Set(s.split(/[\s,]+/).map((x) => x.trim().toUpperCase()).filter(Boolean)));

/** null = valid, else the first problem found. Same rules as the server's DiscountRule schema. */
export function validateDiscountDraft(d: DiscountDraft): string | null {
  if (!d.name.trim()) return "Give the discount a name";
  const value = num(d.value);
  if (value === undefined || !Number.isFinite(value)) return "Enter the discount value";
  if (d.type === "percentage" && !(value > 0 && value <= 100)) return "A percentage must be above 0 and at most 100";
  if (d.type !== "percentage" && !(value > 0)) return "The value must be greater than 0";
  if (d.type !== "percentage" && Math.abs(value * 100 - Math.round(value * 100)) > 1e-6) return "At most 2 decimal places";
  if (d.type === "bundle_price") {
    const size = num(d.bundleSize);
    if (!size || !Number.isInteger(size) || size < 2) return "A bundle needs a size of 2 or more";
  }
  if (d.scope === "department" && d.departments.length === 0) return "Pick at least one department";
  if (d.scope === "item" && splitIds(d.itemIds).length === 0) return "Enter at least one item ID";
  if (!d.autoApply && !d.code.trim()) return "A discount that isn't automatic needs a coupon code";
  if (d.code.trim() && !/^[A-Za-z0-9_-]{3,40}$/.test(d.code.trim())) return "Coupon code: 3–40 letters, numbers, - or _";
  for (const [label, v] of [["Minimum quantity", d.minQuantity], ["Maximum quantity", d.maxQuantity], ["Minimum family size", d.minFamilySize]] as const) {
    const n = num(v);
    if (n !== undefined && (!Number.isInteger(n) || n < 1)) return `${label} must be a whole number of at least 1`;
  }
  const minQ = num(d.minQuantity), maxQ = num(d.maxQuantity);
  if (minQ !== undefined && maxQ !== undefined && maxQ < minQ) return "Maximum quantity can't be less than the minimum";
  const sub = num(d.minSubtotal);
  if (sub !== undefined && (!Number.isFinite(sub) || sub < 0)) return "Minimum spend can't be negative";
  const pr = num(d.priority);
  if (pr === undefined || !Number.isInteger(pr) || pr < 0 || pr > 10000) return "Priority is a whole number from 0 to 10000";
  if (d.validFrom && d.validTo && d.validTo < d.validFrom) return "'Valid to' must be on or after 'valid from'";
  return null;
}

export function draftToPayload(d: DiscountDraft): DiscountPayload {
  const conditions: Record<string, number> = {};
  const set = (k: string, v: number | undefined) => v !== undefined && (conditions[k] = v);
  set("minQuantity", num(d.minQuantity));
  set("maxQuantity", num(d.maxQuantity));
  set("minSubtotal", num(d.minSubtotal));
  set("minFamilySize", num(d.minFamilySize));
  return {
    name: d.name.trim(),
    ...(d.description.trim() ? { description: d.description.trim() } : {}),
    type: d.type,
    value: num(d.value) as number,
    ...(d.type === "fixed" ? { perUnit: d.perUnit } : {}),
    ...(d.type === "bundle_price" ? { bundleSize: num(d.bundleSize) } : {}),
    scope: d.scope,
    departments: d.scope === "department" ? d.departments : [],
    itemIds: d.scope === "item" ? splitIds(d.itemIds) : [],
    conditions,
    autoApply: d.autoApply,
    ...(d.code.trim() ? { code: d.code.trim().toUpperCase() } : {}),
    stackable: d.stackable,
    priority: num(d.priority),
    ...(d.validFrom ? { validFrom: new Date(`${d.validFrom}T00:00:00`).toISOString() } : {}),
    ...(d.validTo ? { validTo: new Date(`${d.validTo}T23:59:59.999`).toISOString() } : {}),
    isActive: d.isActive,
  };
}

/* ───────────────────────── audit log labels ───────────────────────── */

const ACTION_LABELS: Record<string, string> = {
  "catalog.item_created": "Price item added",
  "catalog.item_updated": "Price item edited",
  "catalog.price_changed": "Price changed",
  "catalog.synced_from_clinical": "Catalog synced from pharmacy / lab / radiology",
  "discount.created": "Discount rule created",
  "discount.updated": "Discount rule changed",
  "invoice.issued": "Invoice issued",
  "invoice.voided": "Invoice voided",
  "settings.updated": "Billing settings changed",
  "gateway.keys_updated": "Paystack keys updated",
  "gateway.keys_removed": "Paystack keys removed",
  "gateway.mode_changed": "Paystack mode switched",
};
export const ACTION_FILTERS = Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }));

export function humanizeAction(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  const s = action.replace(/[._]/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ───────────────────────── cart ───────────────────────── */

export interface CartLineState {
  itemId: string;
  name: string;
  department: BillingDepartment;
  unitPrice: number;
  quantity: number;
  unit?: string;
}

/** A stable fingerprint of everything that affects the price — used to tell if a quote is stale. */
export function cartSignature(c: {
  lines: Array<{ itemId: string; quantity: number }>;
  couponCodes: string[];
  familySize?: number;
  manual?: { type: string; value: number; reason: string } | null;
}): string {
  return JSON.stringify([
    [...c.lines].sort((a, b) => a.itemId.localeCompare(b.itemId)).map((l) => [l.itemId, l.quantity]),
    [...c.couponCodes].map((x) => x.toUpperCase()).sort(),
    c.familySize ?? null,
    c.manual ? [c.manual.type, c.manual.value, c.manual.reason] : null,
  ]);
}

/** Merge a new item into the cart (same item → quantity increases). */
export function addToCart(lines: CartLineState[], item: Omit<CartLineState, "quantity">, qty = 1): CartLineState[] {
  const i = lines.findIndex((l) => l.itemId === item.itemId);
  if (i >= 0) return lines.map((l, idx) => (idx === i ? { ...l, quantity: Math.min(1000, l.quantity + qty) } : l));
  return [...lines, { ...item, quantity: Math.min(1000, qty) }];
}
