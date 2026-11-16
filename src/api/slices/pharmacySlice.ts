import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type PersonRef = string | { _id: string; firstName?: string; lastName?: string; email?: string };
type PatientRef =
  | string
  | {
    _id: string;
    mrn?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    allergies?: Array<{ _id?: string; substance: string; reaction?: string; severity?: string }>;
  };

export type DrugForm =
  | "tablet" | "capsule" | "syrup" | "suspension" | "injection" | "infusion" | "cream"
  | "ointment" | "drops" | "inhaler" | "suppository" | "sachet" | "patch" | "powder" | "other";
export type DrugRoute =
  | "oral" | "iv" | "im" | "sc" | "topical" | "inhalation" | "rectal" | "ophthalmic" | "otic" | "sublingual" | "other";
export type ControlledSchedule = "none" | "II" | "III" | "IV" | "V";
export type RxStatus = "pending" | "verified" | "partially_dispensed" | "dispensed" | "cancelled";
export type PoStatus = "draft" | "ordered" | "partially_received" | "received" | "cancelled";
export type AdjustmentType =
  | "damaged" | "expired" | "theft_loss" | "return_to_supplier" | "patient_return" | "correction_in" | "correction_out" | "other";

export interface PharmacySetup {
  _id: string;
  company: string;
  name: string;
  licenseNumber?: string;
  pharmacistInCharge?: string | null;
  phone?: string;
  email?: string;
  address?: string;
  settings: {
    expiryAlertDays: number;
    defaultReorderLevel: number;
    allowExpiredDispensing: boolean;
    requireCounselling: boolean;
    /** ISO-4217 selling currency (NGN, USD, EUR, GHS …) */
    currency?: string;
  };
  isActive: boolean;
}
export type DrugSchedule = "otc" | "pom" | "controlled";
export type DrugCatalogItem = PharmacyDrug;

export interface PharmacyDrug {
  _id: string;
  company?: string;
  code: string;
  genericName: string;
  brandName?: string;
  strength?: string;
  form: string;
  route?: string;
  category: string;
  packSize?: string;
  unit?: string;
  reorderLevel?: number;
  reorderQty?: number;
  costPrice?: number;
  sellingPrice?: number;
  price?: number;                    // Added
  schedule: string;
  isControlled: boolean;
  requiresPrescription?: boolean;    // Added
  requiresCounsel?: boolean;
  controlledSchedule?: string;       // Added
  barcode?: string;                  // Added
  storage?: string;                  // Added
  notes?: string;                    // Added
  nafdacNo?: string;
  manufacturer?: string;
  expiryDate?: string;
  isActive: boolean;
  batches?: any[];
}

export interface PharmacyInventoryRow extends PharmacyDrug {
  totalOnHand: number;
  sellable: number;
  expiredQty: number;
  batchCount: number;
  nearestExpiry: string | null;
  stockValue: number;
  stockStatus: "ok" | "low" | "out_of_stock";
  suggestedOrder?: number;
}

export interface PharmacyBatch {
  _id: string;
  company: string;
  drug: string | Pick<PharmacyDrug, "_id" | "code" | "genericName" | "brandName" | "strength" | "form" | "unit" | "isControlled">;
  batchNumber: string;
  expiryDate: string;
  quantityReceived: number;
  quantityOnHand: number;
  costPrice: number;
  supplier?: string | { _id: string; name: string };
  receivedAt: string;
  status: "active" | "quarantined" | "depleted";
}

export interface PharmacySupplier {
  _id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
}

export interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplier: string | PharmacySupplier;
  items: Array<{ _id?: string; drug: string; drugName: string; quantityOrdered: number; quantityReceived: number; unitCost: number }>;
  status: PoStatus;
  expectedDate?: string;
  totalCost: number;
  notes?: string;
  orderedBy?: PersonRef;
  orderedAt?: string;
  createdAt: string;
}

export interface GoodsReceipt {
  _id: string;
  grnNumber: string;
  purchaseOrder?: string | { _id: string; poNumber: string };
  supplier: string | { _id: string; name: string };
  invoiceNumber?: string;
  items: Array<{ drug: string; drugName: string; batchNumber: string; expiryDate: string; quantity: number; unitCost: number }>;
  totalCost: number;
  notes?: string;
  receivedBy?: PersonRef;
  receivedAt: string;
}

export interface PrescriptionItem {
  _id: string;
  drug?: string | Pick<PharmacyDrug, "_id" | "code" | "genericName" | "brandName" | "strength" | "form" | "unit" | "sellingPrice" | "isControlled">;
  name: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  instructions?: string;
  quantityPrescribed: number;
  quantityDispensed: number;
  refillsAllowed: number;
  status: "pending" | "partial" | "dispensed" | "out_of_stock" | "cancelled";
}

export interface Prescription {
  _id: string;
  rxNumber: string;
  patient: PatientRef;
  consultation?: string;
  prescriber: PersonRef;
  source: "consultation" | "manual";
  items: PrescriptionItem[];
  priority: "routine" | "urgent" | "stat";
  status: RxStatus;
  diagnosis?: string;
  notes?: string;
  notesList?: Array<{ _id?: string; author: PersonRef; text: string; isSystemAudit: boolean; createdAt: string }>;
  verifiedBy?: PersonRef;
  verifiedAt?: string;
  prescribedAt: string;
  dispenses?: PharmacyDispense[];
}

export interface PharmacyDispense {
  _id: string;
  dispenseNumber: string;
  type: "dispense" | "refill";
  patient: PatientRef;
  prescription?: string | { _id: string; rxNumber: string };
  items: Array<{
    drug: string;
    drugName: string;
    prescriptionItem?: string;
    allocations: Array<{ batch: string; batchNumber: string; expiryDate: string; quantity: number }>;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    isControlled: boolean;
  }>;
  totalAmount: number;
  allergyWarnings: string[];
  allergyOverrideReason?: string;
  counselling: { required: boolean; done: boolean; topics: string[]; notes?: string; counselledBy?: PersonRef; counselledAt?: string };
  dispensedBy: PersonRef;
  dispensedAt: string;
}

export interface DispensePreviewLine {
  itemId: string;
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  status: string;
  drug: {
    _id: string;
    genericName: string;
    brandName?: string;
    strength?: string;
    unit?: string;
    sellingPrice: number;
    isControlled: boolean;
    sellable: number;
    nearestExpiry: string | null;
  } | null;
  quantityPrescribed: number;
  quantityDispensed: number;
  remaining: number;
  refillsAllowed: number;
  allergyWarnings: string[];
}

export interface DispensePreview {
  prescription: Prescription;
  lines: DispensePreviewLine[];
  settings: PharmacySetup["settings"];
}

export interface StockAdjustmentRecord {
  _id: string;
  drug: string;
  drugName: string;
  batch: string;
  batchNumber: string;
  type: AdjustmentType;
  quantityChange: number;
  reason: string;
  supplier?: string | { _id: string; name: string };
  patient?: string | { _id: string; mrn?: string; firstName?: string; lastName?: string };
  by: PersonRef;
  at: string;
}

export interface ControlledLogEntry {
  _id: string;
  drug: string;
  drugName: string;
  schedule: string;
  action: "received" | "dispensed" | "adjusted";
  quantity: number;
  balanceAfter: number;
  batchNumber?: string;
  patient?: string | { _id: string; mrn?: string; firstName?: string; lastName?: string };
  reference?: string;
  by: PersonRef;
  witness?: string;
  at: string;
}

export interface ControlledBalance {
  _id: string;
  genericName: string;
  strength?: string;
  schedule: string;
  totalOnHand: number;
}

export interface PharmacyDashboardData {
  pendingRx: number;
  verifiedRx: number;
  partialRx: number;
  dispensedToday: number;
  revenueToday: number;
  totalDrugs: number;
  lowStock: number;
  outOfStock: number;
  expiringSoon: number;
  expired: number;
  inventoryValue: number;
  expiryAlertDays: number;
  recentDispenses: PharmacyDispense[];
}

export interface PharmacyReport {
  range: { from: string; to: string };
  dispenses: number;
  refills: number;
  revenue: number;
  topDrugs: Array<{ _id: string; name: string; quantity: number; revenue: number }>;
  daily: Array<{ date: string; count: number; revenue: number }>;
  prescriptionsByStatus: Array<{ status: string; count: number }>;
  adjustmentsByType: Array<{ type: string; units: number; count: number }>;
  inventory: { drugs: number; low: number; out: number; value: number };
}

export interface PharmacyState {
  setup: PharmacySetup | null;
  dashboard: PharmacyDashboardData | null;
  drugs: PharmacyDrug[];
  activeDrug: PharmacyDrug | null;
  inventory: PharmacyInventoryRow[];
  lowStock: PharmacyInventoryRow[];
  batches: PharmacyBatch[];
  suppliers: PharmacySupplier[];
  purchaseOrders: PurchaseOrder[];
  activePurchaseOrder: PurchaseOrder | null;
  receipts: GoodsReceipt[];
  prescriptions: Prescription[];
  activePrescription: Prescription | null;
  dispensePreview: DispensePreview | null;
  dispenses: PharmacyDispense[];
  adjustments: StockAdjustmentRecord[];
  controlledLog: ControlledLogEntry[];
  controlledBalances: ControlledBalance[];
  report: PharmacyReport | null;
  listLoading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: PharmacyState = {
  setup: null,
  dashboard: null,
  drugs: [],
  activeDrug: null,
  inventory: [],
  lowStock: [],
  batches: [],
  suppliers: [],
  purchaseOrders: [],
  activePurchaseOrder: null,
  receipts: [],
  prescriptions: [],
  activePrescription: null,
  dispensePreview: null,
  dispenses: [],
  adjustments: [],
  controlledLog: [],
  controlledBalances: [],
  report: null,
  listLoading: false,
  detailLoading: false,
  saving: false,
  error: null,
  message: null,
};

/* -------------------------------------------------------------------------- */
/*  Thunk factory – same ApiSuccess / rejectWithValue contract as other slices */
/* -------------------------------------------------------------------------- */

const base = (facilityId: string) => `/companies/${facilityId}/pharmacy`;

function mk<A, T>(type: string, fallback: string, fn: (arg: A) => Promise<ApiSuccess<T>>) {
  return createAsyncThunk<ApiSuccess<T>, A, { rejectValue: string }>(`pharmacy/${type}`, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, fallback));
    }
  });
}

type F = { facilityId: string };

/* ---- setup & dashboard ---- */
export const fetchPharmacySetup = mk<F, PharmacySetup>("fetchSetup", "Failed to load pharmacy setup", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/setup`)).data);
export const savePharmacySetup = mk<F & { payload: Partial<PharmacySetup> }, PharmacySetup>("saveSetup", "Could not save pharmacy setup", async ({ facilityId, payload }) =>
  (await api.put(`${base(facilityId)}/setup`, payload)).data);
export const fetchPharmacyDashboard = mk<F, PharmacyDashboardData>("fetchDashboard", "Failed to load pharmacy dashboard", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/dashboard`)).data);

/* ---- catalog ---- */
export const fetchDrugs = mk<F & { search?: string; category?: string; includeInactive?: boolean; controlled?: boolean }, PharmacyDrug[]>(
  "fetchDrugs", "Failed to load drug catalog",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/drugs`, { params })).data);
export const fetchDrugById = mk<F & { drugId: string }, PharmacyDrug>("fetchDrug", "Failed to load drug", async ({ facilityId, drugId }) =>
  (await api.get(`${base(facilityId)}/drugs/${drugId}`)).data);
export type DrugPayload = Partial<Omit<PharmacyDrug, "_id" | "company" | "batches">>;
export const createDrug = mk<F & { payload: DrugPayload }, PharmacyDrug>("createDrug", "Could not add drug", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/drugs`, payload)).data);
export const updateDrug = mk<F & { drugId: string; payload: DrugPayload }, PharmacyDrug>("updateDrug", "Could not update drug", async ({ facilityId, drugId, payload }) =>
  (await api.patch(`${base(facilityId)}/drugs/${drugId}`, payload)).data);

/* ---- inventory ---- */
export const fetchInventory = mk<F & { search?: string; status?: string }, PharmacyInventoryRow[]>("fetchInventory", "Failed to load inventory",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/inventory`, { params })).data);
export const fetchLowStock = mk<F, PharmacyInventoryRow[]>("fetchLowStock", "Failed to load low-stock list", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/low-stock`)).data);
export const fetchBatches = mk<F & { filter?: "expired" | "expiring" | "in_stock" | "all"; days?: number; drugId?: string }, PharmacyBatch[]>(
  "fetchBatches", "Failed to load batches",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/batches`, { params })).data);
export const setBatchStatus = mk<F & { batchId: string; status: "active" | "quarantined" }, PharmacyBatch>("setBatchStatus", "Could not update batch",
  async ({ facilityId, batchId, status }) => (await api.patch(`${base(facilityId)}/batches/${batchId}/status`, { status })).data);

/* ---- suppliers ---- */
export type SupplierPayload = Partial<Omit<PharmacySupplier, "_id">>;
export const fetchSuppliers = mk<F & { includeInactive?: boolean }, PharmacySupplier[]>("fetchSuppliers", "Failed to load suppliers",
  async ({ facilityId, includeInactive }) => (await api.get(`${base(facilityId)}/suppliers`, { params: { includeInactive } })).data);
export const createSupplier = mk<F & { payload: SupplierPayload }, PharmacySupplier>("createSupplier", "Could not add supplier",
  async ({ facilityId, payload }) => (await api.post(`${base(facilityId)}/suppliers`, payload)).data);
export const updateSupplier = mk<F & { supplierId: string; payload: SupplierPayload }, PharmacySupplier>("updateSupplier", "Could not update supplier",
  async ({ facilityId, supplierId, payload }) => (await api.patch(`${base(facilityId)}/suppliers/${supplierId}`, payload)).data);

/* ---- purchase orders ---- */
export const fetchPurchaseOrders = mk<F & { status?: string }, PurchaseOrder[]>("fetchPOs", "Failed to load purchase orders",
  async ({ facilityId, status }) => (await api.get(`${base(facilityId)}/purchase-orders`, { params: { status } })).data);
export const fetchPurchaseOrderById = mk<F & { id: string }, PurchaseOrder>("fetchPO", "Failed to load purchase order",
  async ({ facilityId, id }) => (await api.get(`${base(facilityId)}/purchase-orders/${id}`)).data);
export const createPurchaseOrder = mk<
  F & { payload: { supplierId: string; items: Array<{ drugId: string; quantity: number; unitCost?: number }>; expectedDate?: string; notes?: string; placeOrder?: boolean } },
  PurchaseOrder
>("createPO", "Could not create purchase order", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/purchase-orders`, payload)).data);
export const setPurchaseOrderStatus = mk<F & { id: string; status: "ordered" | "cancelled" }, PurchaseOrder>("setPOStatus", "Could not update purchase order",
  async ({ facilityId, id, status }) => (await api.patch(`${base(facilityId)}/purchase-orders/${id}/status`, { status })).data);

/* ---- goods received ---- */
export const fetchReceipts = mk<F, GoodsReceipt[]>("fetchReceipts", "Failed to load goods received", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/receipts`)).data);
export const createReceipt = mk<
  F & {
    payload: {
      supplierId: string;
      purchaseOrderId?: string;
      invoiceNumber?: string;
      notes?: string;
      items: Array<{ drugId: string; batchNumber: string; expiryDate: string; quantity: number; unitCost?: number }>;
    };
  },
  GoodsReceipt
>("createReceipt", "Could not record goods received", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/receipts`, payload)).data);

/* ---- prescriptions ---- */
export type PrescriptionItemInput = {
  drugId?: string;
  name: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  instructions?: string;
  quantityPrescribed?: number;
  refillsAllowed?: number;
};
export const fetchPrescriptions = mk<F & { status?: string; patientId?: string; search?: string }, Prescription[]>("fetchRx", "Failed to load prescriptions",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/prescriptions`, { params })).data);
export const fetchPrescriptionById = mk<F & { id: string }, Prescription>("fetchRxById", "Failed to load prescription",
  async ({ facilityId, id }) => (await api.get(`${base(facilityId)}/prescriptions/${id}`)).data);
export const createPrescription = mk<
  F & { payload: { patientId: string; consultationId?: string; items: PrescriptionItemInput[]; priority?: "routine" | "urgent" | "stat"; diagnosis?: string; notes?: string } },
  Prescription
>("createRx", "Could not create prescription", async ({ facilityId, payload }) => (await api.post(`${base(facilityId)}/prescriptions`, payload)).data);
export const createPrescriptionFromConsultation = mk<F & { patientId: string; consultationId: string }, Prescription>("createRxFromConsult",
  "Could not import consultation drugs", async ({ facilityId, ...payload }) => (await api.post(`${base(facilityId)}/prescriptions/from-consultation`, payload)).data);
export const updatePrescriptionItem = mk<
  F & { id: string; itemId: string; payload: { drugId?: string; quantityPrescribed?: number; refillsAllowed?: number } },
  Prescription
>("updateRxItem", "Could not update item", async ({ facilityId, id, itemId, payload }) =>
  (await api.patch(`${base(facilityId)}/prescriptions/${id}/items/${itemId}`, payload)).data);
export const verifyPrescription = mk<F & { id: string }, Prescription>("verifyRx", "Could not verify prescription", async ({ facilityId, id }) =>
  (await api.post(`${base(facilityId)}/prescriptions/${id}/verify`)).data);
export const cancelPrescription = mk<F & { id: string; reason: string }, Prescription>("cancelRx", "Could not cancel prescription",
  async ({ facilityId, id, reason }) => (await api.post(`${base(facilityId)}/prescriptions/${id}/cancel`, { reason })).data);
export const addPrescriptionNote = mk<F & { id: string; text: string }, Prescription>("noteRx", "Could not add note",
  async ({ facilityId, id, text }) => (await api.post(`${base(facilityId)}/prescriptions/${id}/notes`, { text })).data);

// Export addRequestNote as an alias/wrapper to resolve import mismatches across other modules
export const addRequestNote = addPrescriptionNote;

/* ---- dispensing ---- */
export const fetchDispensePreview = mk<F & { id: string }, DispensePreview>("fetchPreview", "Failed to load dispensing details",
  async ({ facilityId, id }) => (await api.get(`${base(facilityId)}/prescriptions/${id}/dispense-preview`)).data);
export const dispensePrescription = mk<
  F & {
    id: string;
    payload: {
      items: Array<{ itemId: string; quantity: number }>;
      allergyOverrideReason?: string;
      witness?: string;
      counselling?: { topics?: string[]; notes?: string };
    };
  },
  PharmacyDispense
>("dispense", "Could not dispense", async ({ facilityId, id, payload }) =>
  (await api.post(`${base(facilityId)}/prescriptions/${id}/dispense`, payload)).data);
export const fetchDispenses = mk<F & { patientId?: string; counselling?: "pending" | "done"; type?: string; limit?: number }, PharmacyDispense[]>(
  "fetchDispenses", "Failed to load dispensing history",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/dispenses`, { params })).data);
export const refillDispense = mk<F & { id: string; allergyOverrideReason?: string }, PharmacyDispense>("refill", "Could not process refill",
  async ({ facilityId, id, allergyOverrideReason }) => (await api.post(`${base(facilityId)}/dispenses/${id}/refill`, { allergyOverrideReason })).data);
export const recordCounselling = mk<F & { id: string; topics: string[]; notes?: string }, PharmacyDispense>("counselling", "Could not record counselling",
  async ({ facilityId, id, ...payload }) => (await api.patch(`${base(facilityId)}/dispenses/${id}/counselling`, payload)).data);

/* ---- adjustments & controlled ---- */
export const fetchAdjustments = mk<F, StockAdjustmentRecord[]>("fetchAdjustments", "Failed to load adjustments", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/adjustments`)).data);
export const createStockAdjustment = mk<
  F & { payload: { batchId: string; type: AdjustmentType; quantity: number; reason: string; supplierId?: string; patientId?: string; witness?: string } },
  StockAdjustmentRecord
>("createAdjustment", "Could not record adjustment", async ({ facilityId, payload }) => (await api.post(`${base(facilityId)}/adjustments`, payload)).data);
export const fetchControlledLog = mk<F & { drugId?: string; from?: string; to?: string }, ControlledLogEntry[]>("fetchControlled", "Failed to load controlled log",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/controlled`, { params })).data);

/* ---- reports ---- */
export const fetchPharmacyReport = mk<F & { from?: string; to?: string }, PharmacyReport>("fetchReport", "Failed to load reports",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/reports`, { params })).data);

/* -------------------------------------------------------------------------- */
/*  Slice                                                                     */
/* -------------------------------------------------------------------------- */

const pharmacySlice = createSlice({
  name: "pharmacy",
  initialState,
  reducers: {
    clearPharmacyError(s) {
      s.error = null;
      s.message = null;
    },
    clearActivePrescription(s) {
      s.activePrescription = null;
      s.dispensePreview = null;
    },
    clearActiveDrug(s) {
      s.activeDrug = null;
    },
  },
  extraReducers: (b) => {
    const fail = (s: PharmacyState, a: any) => {
      s.listLoading = false;
      s.detailLoading = false;
      s.saving = false;
      s.error = a.payload || "Request failed";
    };
    const saving = (s: PharmacyState) => {
      s.saving = true;
      s.error = null;
    };
    const saved = (s: PharmacyState, a: any, fallback: string) => {
      s.saving = false;
      s.message = a.payload.message || fallback;
    };
    const upsert = <T extends { _id: string }>(list: T[], item?: T) => {
      if (!item) return list;
      const i = list.findIndex((x) => x._id === item._id);
      return i >= 0 ? list.map((x, idx) => (idx === i ? item : x)) : [item, ...list];
    };

    /* lists – each sets listLoading */
    const lists: Array<[any, (s: PharmacyState, p: any) => void]> = [
      [fetchDrugs, (s, p) => void (s.drugs = p || [])],
      [fetchInventory, (s, p) => void (s.inventory = p || [])],
      [fetchLowStock, (s, p) => void (s.lowStock = p || [])],
      [fetchBatches, (s, p) => void (s.batches = p || [])],
      [fetchSuppliers, (s, p) => void (s.suppliers = p || [])],
      [fetchPurchaseOrders, (s, p) => void (s.purchaseOrders = p || [])],
      [fetchReceipts, (s, p) => void (s.receipts = p || [])],
      [fetchPrescriptions, (s, p) => void (s.prescriptions = p || [])],
      [fetchDispenses, (s, p) => void (s.dispenses = p || [])],
      [fetchAdjustments, (s, p) => void (s.adjustments = p || [])],
      [fetchPharmacyDashboard, (s, p) => void (s.dashboard = p || null)],
      [fetchPharmacyReport, (s, p) => void (s.report = p || null)],
    ];
    lists.forEach(([thunk, assign]) => {
      b.addCase(thunk.pending, (s: PharmacyState) => {
        s.listLoading = true;
        s.error = null;
      })
        .addCase(thunk.fulfilled, (s: PharmacyState, a: any) => {
          s.listLoading = false;
          assign(s, a.payload.data);
        })
        .addCase(thunk.rejected, fail);
    });

    b.addCase(fetchControlledLog.pending, (s) => {
      s.listLoading = true;
      s.error = null;
    })
      .addCase(fetchControlledLog.fulfilled, (s, a) => {
        s.listLoading = false;
        s.controlledLog = a.payload.data || [];
        s.controlledBalances = ((a.payload as any).balances as ControlledBalance[]) || [];
      })
      .addCase(fetchControlledLog.rejected, fail);

    /* setup */
    b.addCase(fetchPharmacySetup.fulfilled, (s, a) => void (s.setup = a.payload.data || null))
      .addCase(fetchPharmacySetup.rejected, fail)
      .addCase(savePharmacySetup.pending, saving)
      .addCase(savePharmacySetup.fulfilled, (s, a) => {
        saved(s, a, "Pharmacy setup saved");
        s.setup = a.payload.data || s.setup;
      })
      .addCase(savePharmacySetup.rejected, fail);

    /* details */
    b.addCase(fetchDrugById.pending, (s) => void ((s.detailLoading = true), (s.error = null)))
      .addCase(fetchDrugById.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.activeDrug = a.payload.data || null;
      })
      .addCase(fetchDrugById.rejected, fail)
      .addCase(fetchPurchaseOrderById.pending, (s) => void ((s.detailLoading = true), (s.error = null)))
      .addCase(fetchPurchaseOrderById.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.activePurchaseOrder = a.payload.data || null;
      })
      .addCase(fetchPurchaseOrderById.rejected, fail)
      .addCase(fetchPrescriptionById.pending, (s) => void ((s.detailLoading = true), (s.error = null)))
      .addCase(fetchPrescriptionById.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.activePrescription = a.payload.data || null;
      })
      .addCase(fetchPrescriptionById.rejected, fail)
      .addCase(fetchDispensePreview.pending, (s) => void ((s.detailLoading = true), (s.error = null)))
      .addCase(fetchDispensePreview.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.dispensePreview = a.payload.data || null;
      })
      .addCase(fetchDispensePreview.rejected, fail);

    /* mutations */
    b.addCase(createDrug.pending, saving)
      .addCase(createDrug.fulfilled, (s, a) => {
        saved(s, a, "Drug added");
        if (a.payload.data) s.drugs = upsert(s.drugs, a.payload.data);
      })
      .addCase(createDrug.rejected, fail)
      .addCase(updateDrug.pending, saving)
      .addCase(updateDrug.fulfilled, (s, a) => {
        saved(s, a, "Drug updated");
        if (a.payload.data) s.drugs = upsert(s.drugs, a.payload.data);
      })
      .addCase(updateDrug.rejected, fail)

      .addCase(setBatchStatus.pending, saving)
      .addCase(setBatchStatus.fulfilled, (s, a) => {
        saved(s, a, "Batch updated");
        const u = a.payload.data;
        if (u) s.batches = s.batches.map((x) => (x._id === u._id ? { ...x, status: u.status } : x));
      })
      .addCase(setBatchStatus.rejected, fail)

      .addCase(createSupplier.pending, saving)
      .addCase(createSupplier.fulfilled, (s, a) => {
        saved(s, a, "Supplier added");
        if (a.payload.data) s.suppliers = upsert(s.suppliers, a.payload.data);
      })
      .addCase(createSupplier.rejected, fail)
      .addCase(updateSupplier.pending, saving)
      .addCase(updateSupplier.fulfilled, (s, a) => {
        saved(s, a, "Supplier updated");
        if (a.payload.data) s.suppliers = upsert(s.suppliers, a.payload.data);
      })
      .addCase(updateSupplier.rejected, fail)

      .addCase(createPurchaseOrder.pending, saving)
      .addCase(createPurchaseOrder.fulfilled, (s, a) => saved(s, a, "Purchase order created"))
      .addCase(createPurchaseOrder.rejected, fail)
      .addCase(setPurchaseOrderStatus.pending, saving)
      .addCase(setPurchaseOrderStatus.fulfilled, (s, a) => {
        saved(s, a, "Purchase order updated");
        const u = a.payload.data;
        if (u) {
          s.purchaseOrders = s.purchaseOrders.map((x) => (x._id === u._id ? { ...x, status: u.status } : x));
          if (s.activePurchaseOrder?._id === u._id) s.activePurchaseOrder = { ...s.activePurchaseOrder, status: u.status };
        }
      })
      .addCase(setPurchaseOrderStatus.rejected, fail)

      .addCase(createReceipt.pending, saving)
      .addCase(createReceipt.fulfilled, (s, a) => {
        saved(s, a, "Goods received");
        if (a.payload.data) s.receipts = upsert(s.receipts, a.payload.data);
      })
      .addCase(createReceipt.rejected, fail);

    const rxUpdated = (label: string) => (s: PharmacyState, a: any) => {
      saved(s, a, label);
      const u: Prescription | undefined = a.payload.data;
      if (!u) return;
      s.activePrescription = s.activePrescription && s.activePrescription._id === u._id ? { ...s.activePrescription, ...u } : s.activePrescription;
      s.prescriptions = s.prescriptions.map((x) => (x._id === u._id ? { ...x, ...u } : x));
    };
    b.addCase(createPrescription.pending, saving)
      .addCase(createPrescription.fulfilled, (s, a) => {
        saved(s, a, "Prescription created");
        if (a.payload.data) s.prescriptions = upsert(s.prescriptions, a.payload.data);
      })
      .addCase(createPrescription.rejected, fail)
      .addCase(createPrescriptionFromConsultation.pending, saving)
      .addCase(createPrescriptionFromConsultation.fulfilled, (s, a) => {
        saved(s, a, "Prescription created");
        if (a.payload.data) s.prescriptions = upsert(s.prescriptions, a.payload.data);
      })
      .addCase(createPrescriptionFromConsultation.rejected, fail)
      .addCase(updatePrescriptionItem.pending, saving)
      .addCase(updatePrescriptionItem.fulfilled, rxUpdated("Item updated"))
      .addCase(updatePrescriptionItem.rejected, fail)
      .addCase(verifyPrescription.pending, saving)
      .addCase(verifyPrescription.fulfilled, rxUpdated("Prescription verified"))
      .addCase(verifyPrescription.rejected, fail)
      .addCase(cancelPrescription.pending, saving)
      .addCase(cancelPrescription.fulfilled, rxUpdated("Prescription cancelled"))
      .addCase(cancelPrescription.rejected, fail)
      .addCase(addPrescriptionNote.pending, saving)
      .addCase(addPrescriptionNote.fulfilled, rxUpdated("Note added"))
      .addCase(addPrescriptionNote.rejected, fail)

      .addCase(dispensePrescription.pending, saving)
      .addCase(dispensePrescription.fulfilled, (s, a) => {
        saved(s, a, "Dispensed");
        if (a.payload.data) s.dispenses = upsert(s.dispenses, a.payload.data);
      })
      .addCase(dispensePrescription.rejected, fail)
      .addCase(refillDispense.pending, saving)
      .addCase(refillDispense.fulfilled, (s, a) => {
        saved(s, a, "Refill dispensed");
        if (a.payload.data) s.dispenses = upsert(s.dispenses, a.payload.data);
      })
      .addCase(refillDispense.rejected, fail)
      .addCase(recordCounselling.pending, saving)
      .addCase(recordCounselling.fulfilled, (s, a) => {
        saved(s, a, "Counselling recorded");
        if (a.payload.data) s.dispenses = upsert(s.dispenses, a.payload.data);
      })
      .addCase(recordCounselling.rejected, fail)

      .addCase(createStockAdjustment.pending, saving)
      .addCase(createStockAdjustment.fulfilled, (s, a) => {
        saved(s, a, "Adjustment recorded");
        if (a.payload.data) s.adjustments = upsert(s.adjustments, a.payload.data);
      })
      .addCase(createStockAdjustment.rejected, fail);
  },
});

export const { clearPharmacyError, clearActivePrescription, clearActiveDrug } = pharmacySlice.actions;
export default pharmacySlice.reducer;