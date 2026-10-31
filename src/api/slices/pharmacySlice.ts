import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

export interface Drug {
  _id: string;
  name: string;
  genericName?: string;
  code?: string;
  form?: string;
  strength?: string;
  controlled?: boolean;
  schedule?: string;
  active?: boolean;
  createdAt?: string;
}

export interface InventoryItem {
  _id: string;
  drugId?: string | Drug;
  batchNumber?: string;
  quantity: number;
  unit?: string;
  expiryDate?: string;
  location?: string;
  costPerUnit?: number;
  reorderLevel?: number;
  createdAt?: string;
}

export interface Prescription {
  _id: string;
  patientId: string | { _id: string; firstName?: string; lastName?: string; mrn?: string };
  prescribedBy?: string | { _id: string; firstName?: string; lastName?: string };
  items?: Array<{
    drugId?: string;
    drugName: string;
    dose?: string;
    frequency?: string;
    duration?: string;
    quantity?: number;
    instructions?: string;
  }>;
  status?: "pending" | "dispensed" | "partial" | "cancelled" | "expired";
  priority?: string;
  notes?: string;
  dispensedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
}

export interface PurchaseOrder {
  _id: string;
  orderNumber: string;
  supplier?: string | Supplier;
  status: string;
  items: any[];
  orderedAt?: string;
  notes?: string;
}

export interface GoodsReceived {
  _id: string;
  receivedAt: string;
  supplier?: string | Supplier;
  items: any[];
  notes?: string;
}

export interface CounsellingNote {
  _id: string;
  patient: any;
  notes: string;
  counselledAt: string;
  pharmacist?: any;
  topics?: string[];
}

export interface StockAdjustment {
  _id: string;
  type: string;
  quantity: number;
  reason: string;
  at: string;
  drug?: any;
  performedBy?: any;
}

export interface PharmacyState {
  drugs: Drug[];
  inventory: InventoryItem[];
  prescriptions: Prescription[];
  controlled: any[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  goodsReceived: GoodsReceived[];
  counselling: CounsellingNote[];
  adjustments: StockAdjustment[];
  dashboard: any | null;
  listLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: PharmacyState = {
  drugs: [],
  inventory: [],
  prescriptions: [],
  controlled: [],
  suppliers: [],
  purchaseOrders: [],
  goodsReceived: [],
  counselling: [],
  adjustments: [],
  dashboard: null,
  listLoading: false,
  saving: false,
  error: null,
  message: null,
};

export const fetchDrugs = createAsyncThunk(
  "pharmacy/fetchDrugs",
  async (
    { facilityId, search }: { facilityId: string; search?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<Drug[]>>(
        `/companies/${facilityId}/pharmacy/drugs`,
        { params: { search } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load drugs"));
    }
  },
);

export const addDrug = createAsyncThunk(
  "pharmacy/addDrug",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        name: string;
        genericName?: string;
        code?: string;
        form?: string;
        strength?: string;
        controlled?: boolean;
        schedule?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<Drug>>(
        `/companies/${facilityId}/pharmacy/drugs`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not add drug"));
    }
  },
);

export const fetchPharmacyInventory = createAsyncThunk(
  "pharmacy/fetchInventory",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<InventoryItem[]>>(
        `/companies/${facilityId}/pharmacy/inventory`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load inventory"));
    }
  },
);

export const addInventoryStock = createAsyncThunk(
  "pharmacy/addInventory",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        drugId: string;
        batchNumber?: string;
        quantity: number;
        unit?: string;
        expiryDate?: string;
        location?: string;
        costPerUnit?: number;
        reorderLevel?: number;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<InventoryItem>>(
        `/companies/${facilityId}/pharmacy/inventory`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not add stock"));
    }
  },
);

export const fetchPrescriptions = createAsyncThunk(
  "pharmacy/fetchPrescriptions",
  async (
    {
      facilityId,
      patientId,
      status,
    }: { facilityId: string; patientId?: string; status?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<Prescription[]>>(
        `/companies/${facilityId}/pharmacy/prescriptions`,
        { params: { patientId, status } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load prescriptions"));
    }
  },
);

export const createPrescription = createAsyncThunk(
  "pharmacy/createPrescription",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        patientId: string;
        items: Array<{
          drugId?: string;
          drugName: string;
          dose?: string;
          frequency?: string;
          duration?: string;
          quantity?: number;
          instructions?: string;
        }>;
        notes?: string;
        priority?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<Prescription>>(
        `/companies/${facilityId}/pharmacy/prescriptions`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not create prescription"));
    }
  },
);

export const dispensePrescription = createAsyncThunk(
  "pharmacy/dispense",
  async (
    {
      facilityId,
      id,
      payload,
    }: {
      facilityId: string;
      id: string;
      payload?: { notes?: string; partial?: boolean };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<Prescription>>(
        `/companies/${facilityId}/pharmacy/prescriptions/${id}/dispense`,
        payload || {},
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not dispense prescription"));
    }
  },
);

export const fetchControlled = createAsyncThunk(
  "pharmacy/fetchControlled",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<Prescription[]>>(
        `/companies/${facilityId}/pharmacy/controlled`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load controlled substances log"));
    }
  },
);


export const fetchSuppliers = createAsyncThunk(
  "pharmacy/fetchSuppliers",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<Supplier[]>>(`/companies/${facilityId}/pharmacy/suppliers`);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load suppliers"));
    }
  },
);

export const fetchPurchaseOrders = createAsyncThunk(
  "pharmacy/fetchPurchaseOrders",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<PurchaseOrder[]>>(`/companies/${facilityId}/pharmacy/purchase-orders`);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load purchase orders"));
    }
  },
);

export const fetchGoodsReceived = createAsyncThunk(
  "pharmacy/fetchGoodsReceived",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<GoodsReceived[]>>(`/companies/${facilityId}/pharmacy/receiving`);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load goods received"));
    }
  },
);

export const fetchCounselling = createAsyncThunk(
  "pharmacy/fetchCounselling",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<CounsellingNote[]>>(`/companies/${facilityId}/pharmacy/counselling`);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load counselling notes"));
    }
  },
);

export const fetchAdjustments = createAsyncThunk(
  "pharmacy/fetchAdjustments",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<StockAdjustment[]>>(`/companies/${facilityId}/pharmacy/adjustments`);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load adjustments"));
    }
  },
);

export const fetchPharmacyDashboard = createAsyncThunk(
  "pharmacy/fetchDashboard",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<any>>(`/companies/${facilityId}/pharmacy/dashboard`);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load dashboard"));
    }
  },
);

const pharmacySlice = createSlice({
  name: "pharmacy",
  initialState,
  reducers: {
    clearPharmacyError(s) {
      s.error = null;
      s.message = null;
    },
  },
  extraReducers: (b) => {
    const fail = (s: PharmacyState, a: { payload?: unknown }) => {
      s.listLoading = false;
      s.saving = false;
      s.error = (a.payload as string) || "Request failed";
    };

    b.addCase(fetchDrugs.pending, (s) => {
      s.listLoading = true;
      s.error = null;
    })
      .addCase(fetchDrugs.fulfilled, (s, a) => {
        s.listLoading = false;
        s.drugs = a.payload.data || [];
      })
      .addCase(fetchDrugs.rejected, fail);

    b.addCase(addDrug.pending, (s) => {
      s.saving = true;
    })
      .addCase(addDrug.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Drug added";
        if (a.payload.data) s.drugs = [a.payload.data, ...s.drugs];
      })
      .addCase(addDrug.rejected, fail);

    b.addCase(fetchPharmacyInventory.pending, (s) => {
      s.listLoading = true;
    })
      .addCase(fetchPharmacyInventory.fulfilled, (s, a) => {
        s.listLoading = false;
        s.inventory = a.payload.data || [];
      })
      .addCase(fetchPharmacyInventory.rejected, fail);

    b.addCase(addInventoryStock.pending, (s) => {
      s.saving = true;
    })
      .addCase(addInventoryStock.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Stock added";
        if (a.payload.data) s.inventory = [a.payload.data, ...s.inventory];
      })
      .addCase(addInventoryStock.rejected, fail);

    b.addCase(fetchPrescriptions.pending, (s) => {
      s.listLoading = true;
      s.error = null;
    })
      .addCase(fetchPrescriptions.fulfilled, (s, a) => {
        s.listLoading = false;
        s.prescriptions = a.payload.data || [];
      })
      .addCase(fetchPrescriptions.rejected, fail);

    b.addCase(createPrescription.pending, (s) => {
      s.saving = true;
    })
      .addCase(createPrescription.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Prescription created";
        if (a.payload.data) s.prescriptions = [a.payload.data, ...s.prescriptions];
      })
      .addCase(createPrescription.rejected, fail);

    b.addCase(dispensePrescription.pending, (s) => {
      s.saving = true;
    })
      .addCase(dispensePrescription.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Prescription dispensed";
        if (a.payload.data) {
          const idx = s.prescriptions.findIndex((p) => p._id === a.payload.data!._id);
          if (idx >= 0) s.prescriptions[idx] = a.payload.data;
        }
      })
      .addCase(dispensePrescription.rejected, fail);

    b.addCase(fetchControlled.fulfilled, (s, a) => {
      s.controlled = a.payload.data || [];
    });

    b.addCase(fetchSuppliers.fulfilled, (s, a) => { s.suppliers = a.payload.data || []; });
    b.addCase(fetchPurchaseOrders.fulfilled, (s, a) => { s.purchaseOrders = a.payload.data || []; });
    b.addCase(fetchGoodsReceived.fulfilled, (s, a) => { s.goodsReceived = a.payload.data || []; });
    b.addCase(fetchCounselling.fulfilled, (s, a) => { s.counselling = a.payload.data || []; });
    b.addCase(fetchAdjustments.fulfilled, (s, a) => { s.adjustments = a.payload.data || []; });
    b.addCase(fetchPharmacyDashboard.fulfilled, (s, a) => { s.dashboard = a.payload.data || null; });
  },
});

export const { clearPharmacyError } = pharmacySlice.actions;
export default pharmacySlice.reducer;
