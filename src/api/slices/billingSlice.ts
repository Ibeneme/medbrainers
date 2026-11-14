import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import api, { getErrorMessage, type ApiSuccess } from "../services";

/* -------------------------------------------------------------------------- */
/*  Billing, Cart, Discounts & Paystack — client for  /companies/:id/billing  */
/*  Server contract: medbrainers-api  src/modules/billing  (README-BILLING.md) */
/*                                                                            */
/*  • Every call is tenant-scoped by `facilityId` (= the server's companyId).   */
/*  • Money is in MAJOR units (₦1,250.50 = 1250.5) with at most 2 decimals.    */
/*  • The client never sends prices: it sends item ids + quantities and the    */
/*    server prices them from the catalog and applies discount rules.          */
/* -------------------------------------------------------------------------- */

/* ───────────────────────────── Types ───────────────────────────── */

export const BILLING_DEPARTMENTS = [
  "consultation", "pharmacy", "laboratory", "radiology", "inpatient", "emergency", "maternity",
  "theater", "blood_bank", "dental", "telemedicine", "procedure", "other",
] as const;
export type BillingDepartment = (typeof BILLING_DEPARTMENTS)[number];

export const DEPARTMENT_LABELS: Record<BillingDepartment, string> = {
  consultation: "Consultation", pharmacy: "Pharmacy", laboratory: "Laboratory", radiology: "Radiology",
  inpatient: "Inpatient", emergency: "Emergency", maternity: "Maternity", theater: "Theatre",
  blood_bank: "Blood bank", dental: "Dental", telemedicine: "Telemedicine", procedure: "Procedures", other: "Other",
};

export type BillingInvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "void";
export type BillingPaymentMethod = "cash" | "online";
export type BillingPaymentStatus = "pending" | "success" | "failed";
export type GatewayMode = "test" | "live";
export type DiscountType = "percentage" | "fixed" | "unit_price_override" | "bundle_price";
export type DiscountScope = "global" | "department" | "item";
export type ClinicalSourceModel = "Drug" | "LabTestCatalog" | "ImagingCatalog";

export const CURRENCIES_SUPPORTED_BY_PAYSTACK = ["NGN", "GHS", "ZAR", "KES", "USD"] as const;

export interface BillingSettings {
  /** Cash-point payments allowed for this facility (online-only when false) */
  acceptCashPayments: boolean;
  currency: string;
  allowManualDiscount: boolean;
  /** Highest manual discount, as % of the cart after rule discounts */
  maxManualDiscountPercent: number;
  invoicePrefix: string;
}

export interface GatewayKeyView {
  configured: boolean;
  publicKey: string | null;
  /** e.g. "sk_live_••••a1b2" — the real secret is never sent to the browser */
  secretKeyHint: string | null;
  updatedAt: string | null;
}
export interface GatewayConfig {
  provider: "paystack";
  activeMode: GatewayMode;
  test: GatewayKeyView;
  live: GatewayKeyView;
}

export interface BillingItem {
  _id: string;
  /** Human code, unique inside the facility (e.g. CONS-00001) */
  itemId: string;
  name: string;
  department: BillingDepartment;
  unitPrice: number;
  unit?: string;
  description?: string;
  isActive: boolean;
  source?: { model: ClinicalSourceModel; refId: string };
  createdAt?: string;
  updatedAt?: string;
}
export type BillingItemPayload = {
  itemId?: string;
  name: string;
  department: BillingDepartment;
  unitPrice: number;
  unit?: string;
  description?: string;
  isActive?: boolean;
};

export interface DiscountConditions {
  minQuantity?: number;
  maxQuantity?: number;
  minSubtotal?: number;
  minFamilySize?: number;
}
export interface BillingDiscountRule {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  type: DiscountType;
  value: number;
  perUnit?: boolean;
  bundleSize?: number;
  scope: DiscountScope;
  departments: BillingDepartment[];
  itemIds: string[];
  conditions: DiscountConditions;
  autoApply: boolean;
  stackable: boolean;
  priority: number;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
}
export type DiscountPayload = Partial<Omit<BillingDiscountRule, "_id">> & {
  name: string;
  type: DiscountType;
  value: number;
  scope: DiscountScope;
};

export interface CartLineInput {
  itemId: string;
  quantity: number;
  /** Link back to the clinical record this charge came from */
  source?: { module: string; refId: string };
}
export interface ManualDiscountInput {
  type: "percentage" | "fixed";
  value: number;
  reason: string;
}
export interface CartInput {
  lines: CartLineInput[];
  couponCodes?: string[];
  familySize?: number;
  manualDiscount?: ManualDiscountInput;
  patientId?: string;
  notes?: string;
}

export interface BillingLine {
  itemId: string;
  itemRef: string;
  name: string;
  department: BillingDepartment;
  unitPrice: number;
  quantity: number;
  gross: number;
  discount: number;
  net: number;
  appliedRuleIds: string[];
  source?: { module: string; refId: string };
}
export interface BillingAppliedDiscount {
  kind: "rule" | "manual";
  ruleId?: string;
  name: string;
  code?: string;
  type: string;
  amount: number;
  reason?: string;
}
export interface BillingQuote {
  currency: string;
  lines: BillingLine[];
  appliedDiscounts: BillingAppliedDiscount[];
  subtotal: number;
  discountTotal: number;
  total: number;
  /** coupon codes the cashier typed that matched no usable rule */
  unusedCodes: string[];
}

export interface BillingInvoice {
  _id: string;
  invoiceNumber?: string;
  status: BillingInvoiceStatus;
  patientId?: string;
  patientSnapshot?: { name: string; mrn?: string; phone?: string; email?: string };
  lines: BillingLine[];
  appliedDiscounts: BillingAppliedDiscount[];
  couponCodes: string[];
  /** the manual discount as requested (kept so a draft can be re-priced faithfully) */
  manualDiscount?: ManualDiscountInput;
  familySize?: number;
  currency: string;
  subtotal: number;
  discountTotal: number;
  total: number;
  amountPaid: number;
  balance: number;
  /** more money was collected than the total (needs a manual refund) */
  overpaid: boolean;
  notes?: string;
  createdBy?: string;
  issuedAt?: string;
  paidAt?: string;
  voidedAt?: string;
  voidReason?: string;
  createdAt: string;
  updatedAt: string;
}

/** One row of the append-only payment ledger. A transaction = several rows (pending → success|failed). */
export interface BillingPaymentEvent {
  _id: string;
  transactionId: string;
  sequence: number;
  invoiceId: string;
  invoiceNumber?: string;
  amount: number;
  amountMinor: number;
  currency: string;
  paymentMethod: BillingPaymentMethod;
  status: BillingPaymentStatus;
  reference: string;
  gatewayMode?: GatewayMode;
  cashierId?: string;
  actorId?: string;
  source: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
  hash: string;
  prevHash?: string;
  createdAt: string;
}

export interface BillingInvoiceDetail {
  invoice: BillingInvoice;
  /** current state of each payment attempt */
  payments: BillingPaymentEvent[];
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface BillingAuditEntry {
  _id: string;
  action: string;
  entityType: string;
  entityId?: string;
  actorId?: string;
  actorRole?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  createdAt: string;
}

export interface BillingSummary {
  range: { from: string; to: string };
  billed: {
    invoices: number;
    subtotal: number;
    discount: number;
    total: number;
    byDepartment: Array<{ department: BillingDepartment; units: number; gross: number; discount: number; net: number }>;
  };
  collected: {
    total: number;
    byMethod: Array<{ method: BillingPaymentMethod; count: number; amount: number }>;
    byDay: Array<{ date: string; count: number; amount: number }>;
    cashByCashier: Array<{ cashierId: string | null; count: number; amount: number }>;
  };
  outstanding: { invoices: number; balance: number };
  transactionEvents: Array<{ status: BillingPaymentStatus; method: BillingPaymentMethod; count: number }>;
}

export interface CatalogCoverage {
  [department: string]: {
    total: number;
    priced: number;
    unpriced: Array<{ id: string; code?: string; name: string; existingPrice: number | null }>;
  };
}
export interface CatalogSyncReport {
  created: number;
  alreadyLinked: number;
  skippedNoPrice: Array<{ model: string; id: string; name: string }>;
}

export interface TransactionDetail {
  transactionId: string;
  events: BillingPaymentEvent[];
  /** the hash chain re-verified server-side */
  integrity: { valid: boolean; events: number; brokenAtSequence?: number };
}

export interface OnlinePaymentStart {
  transactionId: string;
  reference: string;
  mode: GatewayMode;
  amount: number;
  currency: string;
  /** redirect the payer here (Paystack checkout) */
  authorizationUrl: string;
  accessCode: string;
}
export interface CashPaymentStart {
  transactionId: string;
  reference: string;
  amount: number;
  currency: string;
  status: BillingPaymentStatus;
}
export interface InvoiceSummaryLite {
  id: string;
  invoiceNumber?: string;
  status: BillingInvoiceStatus;
  total: number;
  amountPaid: number;
  balance: number;
  overpaid: boolean;
}
export interface VerifyResult {
  reference: string;
  transactionId: string;
  status: BillingPaymentStatus;
  invoice: InvoiceSummaryLite | null;
}

/* ───────────────────────────── State ───────────────────────────── */

interface BillingState {
  settings: BillingSettings | null;
  gateway: GatewayConfig | null;
  catalog: Paged<BillingItem>;
  /** active items for the POS picker (kept separate so catalog admin filters don't disturb it) */
  pickerItems: BillingItem[];
  coverage: CatalogCoverage | null;
  discounts: Paged<BillingDiscountRule>;
  quote: BillingQuote | null;
  /** requestId of the newest quote request — older responses that arrive late are ignored */
  quoteRequestId: string | null;
  invoices: Paged<BillingInvoice>;
  activeInvoice: BillingInvoiceDetail | null;
  payments: Paged<BillingPaymentEvent>;
  transaction: TransactionDetail | null;
  summary: BillingSummary | null;
  auditLogs: Paged<BillingAuditEntry>;
  listLoading: boolean;
  detailLoading: boolean;
  quoting: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const emptyPage = <T,>(): Paged<T> => ({ items: [], total: 0, page: 1, limit: 25 });

/** Never trust a response shape blindly: a malformed list must degrade to "empty", not crash the page. */
const asPage = <T,>(p: unknown): Paged<T> => {
  const x = (p ?? {}) as Partial<Paged<T>>;
  return { items: Array.isArray(x.items) ? x.items : [], total: Number(x.total) || 0, page: Number(x.page) || 1, limit: Number(x.limit) || 25 };
};

const initialState: BillingState = {
  settings: null,
  gateway: null,
  catalog: emptyPage(),
  pickerItems: [],
  coverage: null,
  discounts: emptyPage(),
  quote: null,
  quoteRequestId: null,
  invoices: emptyPage(),
  activeInvoice: null,
  payments: emptyPage(),
  transaction: null,
  summary: null,
  auditLogs: emptyPage(),
  listLoading: false,
  detailLoading: false,
  quoting: false,
  saving: false,
  error: null,
  message: null,
};

/* ───────────────────────── Thunk factory ───────────────────────── */

const base = (facilityId: string) => `/companies/${facilityId}/billing`;

/**
 * Like getErrorMessage, but a 400 "Validation failed" is expanded into the field messages
 * ("lines.0.quantity: Number must be greater than or equal to 1") so the cashier can see what to fix.
 */
export function billingError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as { message?: string; errors?: Array<{ path: string; message: string }> } | undefined;
    if (body?.errors?.length) return body.errors.map((e) => (e.path ? `${e.path}: ${e.message}` : e.message)).join("; ");
  }
  return getErrorMessage(err, fallback);
}

function mk<A, T>(type: string, fallback: string, fn: (arg: A) => Promise<ApiSuccess<T>>) {
  return createAsyncThunk<ApiSuccess<T>, A, { rejectValue: string }>(`billing/${type}`, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg);
    } catch (err) {
      return rejectWithValue(billingError(err, fallback));
    }
  });
}

type F = { facilityId: string };
type Page = { page?: number; limit?: number };
type Range = { from?: string; to?: string };

/** Drops undefined/empty values so they are not sent as `?x=undefined` / `?x=` */
const clean = <T extends Record<string, unknown>>(p: T) =>
  Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== null && v !== "")) as Partial<T>;

/* ─────────────── settings & gateway ─────────────── */

export const fetchBillingSettings = mk<F, BillingSettings>("fetchSettings", "Failed to load billing settings", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/settings`)).data);
export const saveBillingSettings = mk<F & { payload: Partial<BillingSettings> }, BillingSettings>(
  "saveSettings", "Could not save billing settings",
  async ({ facilityId, payload }) => (await api.put(`${base(facilityId)}/settings`, payload)).data);

export const fetchGateway = mk<F, GatewayConfig>("fetchGateway", "Failed to load payment gateway", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/gateway`)).data);
export const saveGatewayKeys = mk<F & { mode: GatewayMode; publicKey: string; secretKey: string }, GatewayConfig>(
  "saveGatewayKeys", "Could not save Paystack keys",
  async ({ facilityId, mode, publicKey, secretKey }) => (await api.put(`${base(facilityId)}/gateway/keys/${mode}`, { publicKey, secretKey })).data);
export const removeGatewayKeys = mk<F & { mode: GatewayMode }, GatewayConfig>("removeGatewayKeys", "Could not remove Paystack keys",
  async ({ facilityId, mode }) => (await api.delete(`${base(facilityId)}/gateway/keys/${mode}`)).data);
export const setGatewayMode = mk<F & { mode: GatewayMode }, GatewayConfig>("setGatewayMode", "Could not switch payment mode",
  async ({ facilityId, mode }) => (await api.put(`${base(facilityId)}/gateway/mode`, { mode })).data);
export const testGateway = mk<F & { mode?: GatewayMode }, { mode: GatewayMode; ok: boolean }>("testGateway", "Paystack connection failed",
  async ({ facilityId, mode }) => (await api.post(`${base(facilityId)}/gateway/test`, mode ? { mode } : {})).data);

/* ─────────────── price catalog ─────────────── */

export const fetchBillingItems = mk<F & Page & { department?: BillingDepartment; search?: string; isActive?: boolean }, Paged<BillingItem>>(
  "fetchItems", "Failed to load the price catalog",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/catalog`, { params: clean(params) })).data);
/** Active items only — feeds the POS item picker. */
export const fetchPickerItems = mk<F & { search?: string; department?: BillingDepartment }, Paged<BillingItem>>(
  "fetchPickerItems", "Failed to search the catalog",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/catalog`, { params: { ...clean(params), isActive: true, limit: 50 } })).data);
export const createBillingItem = mk<F & { payload: BillingItemPayload }, BillingItem>("createItem", "Could not add the item",
  async ({ facilityId, payload }) => (await api.post(`${base(facilityId)}/catalog`, payload)).data);
export const updateBillingItem = mk<F & { itemId: string; payload: Partial<Omit<BillingItemPayload, "itemId">> }, BillingItem>(
  "updateItem", "Could not update the item",
  async ({ facilityId, itemId, payload }) => (await api.patch(`${base(facilityId)}/catalog/${encodeURIComponent(itemId)}`, payload)).data);
/** Items are never deleted (invoices reference them) — this deactivates. */
export const deactivateBillingItem = mk<F & { itemId: string }, BillingItem>("deactivateItem", "Could not deactivate the item",
  async ({ facilityId, itemId }) => (await api.delete(`${base(facilityId)}/catalog/${encodeURIComponent(itemId)}`)).data);
export const fetchCatalogCoverage = mk<F, CatalogCoverage>("fetchCoverage", "Failed to check price coverage",
  async ({ facilityId }) => (await api.get(`${base(facilityId)}/catalog/coverage`)).data);
export const syncCatalogFromClinical = mk<F & { models: ClinicalSourceModel[] }, CatalogSyncReport>("syncCatalog", "Sync failed",
  async ({ facilityId, models }) => (await api.post(`${base(facilityId)}/catalog/sync`, { models })).data);

/* ─────────────── discount rules ─────────────── */

export const fetchDiscountRules = mk<F & Page & { isActive?: boolean }, Paged<BillingDiscountRule>>("fetchDiscounts", "Failed to load discount rules",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/discounts`, { params: clean(params) })).data);
export const createDiscountRule = mk<F & { payload: DiscountPayload }, BillingDiscountRule>("createDiscount", "Could not create the discount",
  async ({ facilityId, payload }) => (await api.post(`${base(facilityId)}/discounts`, payload)).data);
export const updateDiscountRule = mk<F & { ruleId: string; payload: Partial<DiscountPayload> }, BillingDiscountRule>("updateDiscount", "Could not update the discount",
  async ({ facilityId, ruleId, payload }) => (await api.patch(`${base(facilityId)}/discounts/${ruleId}`, payload)).data);
export const deactivateDiscountRule = mk<F & { ruleId: string }, BillingDiscountRule>("deactivateDiscount", "Could not turn the discount off",
  async ({ facilityId, ruleId }) => (await api.delete(`${base(facilityId)}/discounts/${ruleId}`)).data);

/* ─────────────── cart & invoices ─────────────── */

/** Stateless price preview — nothing is saved. */
export const quoteCart = mk<F & { cart: CartInput }, BillingQuote>("quote", "Could not price the cart",
  async ({ facilityId, cart }) => (await api.post(`${base(facilityId)}/cart/quote`, cart)).data);
/** `issue:true` locks the lines and allocates an invoice number; otherwise it is saved as a draft cart. */
export const createInvoice = mk<F & { cart: CartInput; issue?: boolean }, BillingInvoice>("createInvoice", "Could not create the invoice",
  async ({ facilityId, cart, issue }) => (await api.post(`${base(facilityId)}/invoices`, { ...cart, issue: !!issue })).data);
export const updateInvoiceDraft = mk<F & { invoiceId: string; cart: CartInput }, BillingInvoice>("updateDraft", "Could not update the cart",
  async ({ facilityId, invoiceId, cart }) => (await api.put(`${base(facilityId)}/invoices/${invoiceId}`, cart)).data);
export const issueInvoice = mk<F & { invoiceId: string }, BillingInvoice>("issueInvoice", "Could not issue the invoice",
  async ({ facilityId, invoiceId }) => (await api.post(`${base(facilityId)}/invoices/${invoiceId}/issue`)).data);
export const voidInvoice = mk<F & { invoiceId: string; reason: string }, BillingInvoice>("voidInvoice", "Could not void the invoice",
  async ({ facilityId, invoiceId, reason }) => (await api.post(`${base(facilityId)}/invoices/${invoiceId}/void`, { reason })).data);
export const fetchInvoices = mk<
  F & Page & Range & { status?: BillingInvoiceStatus; patientId?: string; search?: string },
  Paged<BillingInvoice>
>("fetchInvoices", "Failed to load invoices",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/invoices`, { params: clean(params) })).data);
export const fetchInvoice = mk<F & { invoiceId: string }, BillingInvoiceDetail>("fetchInvoice", "Failed to load the invoice",
  async ({ facilityId, invoiceId }) => (await api.get(`${base(facilityId)}/invoices/${invoiceId}`)).data);

/* ─────────────── payments ─────────────── */

export const payInvoiceOnline = mk<F & { invoiceId: string; amount?: number; email?: string }, OnlinePaymentStart>(
  "payOnline", "Could not start the online payment",
  async ({ facilityId, invoiceId, ...body }) => (await api.post(`${base(facilityId)}/invoices/${invoiceId}/pay/online`, clean(body))).data);
export const payInvoiceCash = mk<F & { invoiceId: string; amount?: number; note?: string }, CashPaymentStart>(
  "payCash", "Could not record the cash payment",
  async ({ facilityId, invoiceId, ...body }) => (await api.post(`${base(facilityId)}/invoices/${invoiceId}/pay/cash`, clean(body))).data);
export const confirmCashPayment = mk<F & { transactionId: string; note?: string }, { transactionId: string; status: BillingPaymentStatus; invoice: InvoiceSummaryLite | null }>(
  "confirmCash", "Could not confirm the cash payment",
  async ({ facilityId, transactionId, note }) => (await api.post(`${base(facilityId)}/payments/${transactionId}/confirm-cash`, clean({ note }))).data);
export const rejectCashPayment = mk<F & { transactionId: string; reason: string }, { transactionId: string; status: BillingPaymentStatus }>(
  "rejectCash", "Could not reject the cash payment",
  async ({ facilityId, transactionId, reason }) => (await api.post(`${base(facilityId)}/payments/${transactionId}/reject-cash`, { reason })).data);
/** Asks Paystack (via our server) what happened — never trust the redirect alone. */
export const verifyPayment = mk<F & { reference: string }, VerifyResult>("verifyPayment", "Could not verify the payment",
  async ({ facilityId, reference }) => (await api.get(`${base(facilityId)}/payments/verify/${encodeURIComponent(reference)}`)).data);
/** Re-checks in-flight online payments (use if a webhook was missed). */
export const reconcileInvoice = mk<F & { invoiceId: string }, { invoice: InvoiceSummaryLite | null; payments: BillingPaymentEvent[] }>(
  "reconcile", "Could not re-check the payments",
  async ({ facilityId, invoiceId }) => (await api.post(`${base(facilityId)}/invoices/${invoiceId}/reconcile`)).data);

/* ─────────────── reports & audit (finance roles) ─────────────── */

export const fetchBillingSummary = mk<F & Range, BillingSummary>("fetchSummary", "Failed to load the financial summary",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/reports/summary`, { params: clean(params) })).data);
export const fetchPaymentLogs = mk<
  F & Page & Range & { status?: BillingPaymentStatus; method?: BillingPaymentMethod; invoiceId?: string },
  Paged<BillingPaymentEvent>
>("fetchPaymentLogs", "Failed to load payment logs",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/payment-logs`, { params: clean(params) })).data);
export const fetchTransaction = mk<F & { transactionId: string }, TransactionDetail>("fetchTransaction", "Failed to load the transaction",
  async ({ facilityId, transactionId }) => (await api.get(`${base(facilityId)}/payment-logs/${transactionId}`)).data);
export const fetchBillingAuditLogs = mk<F & Page & Range & { action?: string; entityType?: string }, Paged<BillingAuditEntry>>(
  "fetchAudit", "Failed to load the audit log",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/audit-logs`, { params: clean(params) })).data);

/* ───────────────────────────── Slice ───────────────────────────── */

const upsert = <T extends { _id: string }>(listIn: T[] | undefined, item?: T): T[] => {
  const list = listIn ?? [];
  if (!item?._id) return list;
  const i = list.findIndex((x) => x._id === item._id);
  return i >= 0 ? list.map((x, idx) => (idx === i ? item : x)) : [item, ...list];
};

const billingSlice = createSlice({
  name: "billing",
  initialState,
  reducers: {
    clearBillingError(s) {
      s.error = null;
      s.message = null;
    },
    clearQuote(s) {
      s.quote = null;
    },
    clearActiveInvoice(s) {
      s.activeInvoice = null;
    },
    clearTransaction(s) {
      s.transaction = null;
    },
    /** Switching facility must never show another tenant's money. */
    resetBilling() {
      return initialState;
    },
  },
  extraReducers: (b) => {
    const fail = (s: BillingState, a: { payload?: unknown }) => {
      s.listLoading = false;
      s.detailLoading = false;
      s.quoting = false;
      s.saving = false;
      s.error = (a.payload as string) || "Request failed";
    };

    /* simple loads: set data, toggle listLoading */
    const loads: Array<[{ pending: any; fulfilled: any; rejected: any }, (s: BillingState, p: any) => void]> = [
      [fetchBillingSettings, (s, p) => void (s.settings = p)],
      [fetchGateway, (s, p) => void (s.gateway = p)],
      [fetchBillingItems, (s, p) => void (s.catalog = asPage(p))],
      [fetchCatalogCoverage, (s, p) => void (s.coverage = p)],
      [fetchDiscountRules, (s, p) => void (s.discounts = asPage(p))],
      [fetchInvoices, (s, p) => void (s.invoices = asPage(p))],
      [fetchPaymentLogs, (s, p) => void (s.payments = asPage(p))],
      [fetchBillingSummary, (s, p) => void (s.summary = p)],
      [fetchBillingAuditLogs, (s, p) => void (s.auditLogs = asPage(p))],
    ];
    loads.forEach(([thunk, assign]) => {
      b.addCase(thunk.pending, (s: BillingState) => {
        s.listLoading = true;
        s.error = null;
      })
        .addCase(thunk.fulfilled, (s: BillingState, a: any) => {
          s.listLoading = false;
          assign(s, a.payload.data);
        })
        .addCase(thunk.rejected, fail);
    });

    /* details */
    for (const [thunk, assign] of [
      [fetchInvoice, (s: BillingState, p: BillingInvoiceDetail) => void (s.activeInvoice = p)],
      [fetchTransaction, (s: BillingState, p: TransactionDetail) => void (s.transaction = p)],
    ] as Array<[any, (s: BillingState, p: any) => void]>) {
      b.addCase(thunk.pending, (s: BillingState) => {
        s.detailLoading = true;
        s.error = null;
      })
        .addCase(thunk.fulfilled, (s: BillingState, a: any) => {
          s.detailLoading = false;
          assign(s, a.payload.data);
        })
        .addCase(thunk.rejected, fail);
    }

    /* picker (does not touch listLoading so the POS doesn't flash a full-page loader on every keystroke) */
    b.addCase(fetchPickerItems.fulfilled, (s, a) => void (s.pickerItems = a.payload.data?.items ?? []))
      .addCase(fetchPickerItems.rejected, fail);

    /* quote — the cart re-prices as the cashier types, so responses can arrive out of order:
       only the NEWEST request may write, otherwise a slow old response would show a stale total. */
    b.addCase(quoteCart.pending, (s, a) => {
      s.quoting = true;
      s.quoteRequestId = a.meta.requestId;
      s.error = null;
    })
      .addCase(quoteCart.fulfilled, (s, a) => {
        if (a.meta.requestId !== s.quoteRequestId) return;
        s.quoting = false;
        s.quote = a.payload.data;
      })
      .addCase(quoteCart.rejected, (s, a) => {
        if (a.meta.requestId !== s.quoteRequestId) return;
        s.quoting = false;
        s.quote = null; // a stale price must never stay on screen after a failed re-quote
        s.error = (a.payload as string) || "Could not price the cart";
      });

    /* writes: toggle `saving` on pending/rejected for every mutating thunk.
       NOTE: RTK allows exactly ONE addCase per action type, so each thunk's `fulfilled` is registered once below
       (the shared bookkeeping lives in `done`, and thunks that also update a local list call it first). */
    const writes: any[] = [
      saveBillingSettings, saveGatewayKeys, removeGatewayKeys, setGatewayMode, testGateway,
      createBillingItem, updateBillingItem, deactivateBillingItem, syncCatalogFromClinical,
      createDiscountRule, updateDiscountRule, deactivateDiscountRule,
      createInvoice, updateInvoiceDraft, issueInvoice, voidInvoice,
      payInvoiceOnline, payInvoiceCash, confirmCashPayment, rejectCashPayment, verifyPayment, reconcileInvoice,
    ];
    const done = (s: BillingState, a: any) => {
      s.saving = false;
      if (a.payload?.message) s.message = a.payload.message;
    };
    writes.forEach((thunk) => {
      b.addCase(thunk.pending, (s: BillingState) => {
        s.saving = true;
        s.error = null;
      }).addCase(thunk.rejected, fail);
    });

    /* fulfilled — keep local lists in step with successful writes (no full reload needed) */
    const withLocalUpdate = new Map<any, (s: BillingState, data: any) => void>([
      [saveBillingSettings, (s, d) => void (s.settings = d)],
      [saveGatewayKeys, (s, d) => void (s.gateway = d)],
      [removeGatewayKeys, (s, d) => void (s.gateway = d)],
      [setGatewayMode, (s, d) => void (s.gateway = d)],
      [createBillingItem, (s, d) => {
        s.catalog.items = upsert(s.catalog.items, d);
        s.catalog.total += 1;
      }],
      [updateBillingItem, (s, d) => void (s.catalog.items = upsert(s.catalog.items, d))],
      [deactivateBillingItem, (s, d) => void (s.catalog.items = upsert(s.catalog.items, d))],
      [createDiscountRule, (s, d) => {
        s.discounts.items = upsert(s.discounts.items, d);
        s.discounts.total += 1;
      }],
      [updateDiscountRule, (s, d) => void (s.discounts.items = upsert(s.discounts.items, d))],
      [deactivateDiscountRule, (s, d) => void (s.discounts.items = upsert(s.discounts.items, d))],
      ...([createInvoice, updateInvoiceDraft, issueInvoice, voidInvoice] as any[]).map(
        (t) => [t, (s: BillingState, inv: BillingInvoice) => {
          s.invoices.items = upsert(s.invoices.items, inv);
          if (s.activeInvoice?.invoice._id === inv._id) s.activeInvoice = { ...s.activeInvoice, invoice: inv };
        }] as [any, (s: BillingState, d: any) => void],
      ),
    ]);
    writes.forEach((thunk) => {
      const local = withLocalUpdate.get(thunk);
      b.addCase(thunk.fulfilled, (s: BillingState, a: any) => {
        done(s, a);
        local?.(s, a.payload.data);
      });
    });
  },
});

export const { clearBillingError, clearQuote, clearActiveInvoice, clearTransaction, resetBilling } = billingSlice.actions;
export default billingSlice.reducer;
