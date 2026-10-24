import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

export interface BloodUnit {
  _id: string;
  bloodType: string;
  component: string;
  unitNumber?: string;
  quantity?: number;
  status?: "available" | "reserved" | "issued" | "expired" | "discarded";
  expiryDate?: string;
  donorId?: string;
  location?: string;
  createdAt?: string;
}

export interface Crossmatch {
  _id: string;
  patientId: string | { _id: string; firstName?: string; lastName?: string; mrn?: string };
  admissionId?: string;
  bloodType: string;
  component: string;
  unitsRequested: number;
  priority?: "routine" | "urgent" | "stat";
  status?: "pending" | "compatible" | "incompatible" | "issued" | "cancelled";
  units?: string[];
  notes?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transfusion {
  _id: string;
  patientId: string | { _id: string; firstName?: string; lastName?: string; mrn?: string };
  crossmatchId?: string;
  unitId?: string;
  bloodType?: string;
  component?: string;
  startedAt?: string;
  completedAt?: string;
  status?: "in_progress" | "completed" | "stopped" | "reaction";
  reactionNotes?: string;
  administeredBy?: string | { _id: string; firstName?: string; lastName?: string };
  notes?: string;
  createdAt?: string;
}

export interface BloodBankState {
  inventory: BloodUnit[];
  crossmatches: Crossmatch[];
  transfusions: Transfusion[];
  listLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: BloodBankState = {
  inventory: [],
  crossmatches: [],
  transfusions: [],
  listLoading: false,
  saving: false,
  error: null,
  message: null,
};

export const fetchBloodInventory = createAsyncThunk(
  "bloodBank/fetchInventory",
  async (
    { facilityId, bloodType, status }: { facilityId: string; bloodType?: string; status?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<BloodUnit[]>>(
        `/companies/${facilityId}/blood-bank/inventory`,
        { params: { bloodType, status } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load blood inventory"));
    }
  },
);

export const addBloodUnit = createAsyncThunk(
  "bloodBank/addUnit",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        bloodType: string;
        component: string;
        unitNumber?: string;
        quantity?: number;
        expiryDate?: string;
        location?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<BloodUnit>>(
        `/companies/${facilityId}/blood-bank/inventory`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not add blood unit"));
    }
  },
);

export const requestCrossmatch = createAsyncThunk(
  "bloodBank/requestCrossmatch",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        patientId: string;
        admissionId?: string;
        bloodType: string;
        component: string;
        unitsRequested: number;
        priority?: string;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<Crossmatch>>(
        `/companies/${facilityId}/blood-bank/crossmatch`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not request crossmatch"));
    }
  },
);

export const completeCrossmatch = createAsyncThunk(
  "bloodBank/completeCrossmatch",
  async (
    {
      facilityId,
      id,
      payload,
    }: {
      facilityId: string;
      id: string;
      payload?: { status?: string; units?: string[]; notes?: string };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<Crossmatch>>(
        `/companies/${facilityId}/blood-bank/crossmatch/${id}/complete`,
        payload || {},
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not complete crossmatch"));
    }
  },
);

export const fetchTransfusions = createAsyncThunk(
  "bloodBank/fetchTransfusions",
  async (
    { facilityId, patientId }: { facilityId: string; patientId?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<Transfusion[]>>(
        `/companies/${facilityId}/blood-bank/transfusions`,
        { params: { patientId } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load transfusions"));
    }
  },
);

export const startTransfusion = createAsyncThunk(
  "bloodBank/startTransfusion",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        patientId: string;
        crossmatchId?: string;
        unitId?: string;
        bloodType?: string;
        component?: string;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<Transfusion>>(
        `/companies/${facilityId}/blood-bank/transfusions`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not start transfusion"));
    }
  },
);

const bloodBankSlice = createSlice({
  name: "bloodBank",
  initialState,
  reducers: {
    clearBloodBankError(s) {
      s.error = null;
      s.message = null;
    },
  },
  extraReducers: (b) => {
    const fail = (s: BloodBankState, a: { payload?: unknown }) => {
      s.listLoading = false;
      s.saving = false;
      s.error = (a.payload as string) || "Request failed";
    };

    b.addCase(fetchBloodInventory.pending, (s) => {
      s.listLoading = true;
      s.error = null;
    })
      .addCase(fetchBloodInventory.fulfilled, (s, a) => {
        s.listLoading = false;
        s.inventory = a.payload.data || [];
      })
      .addCase(fetchBloodInventory.rejected, fail);

    b.addCase(addBloodUnit.pending, (s) => {
      s.saving = true;
    })
      .addCase(addBloodUnit.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Blood unit added";
        if (a.payload.data) s.inventory = [a.payload.data, ...s.inventory];
      })
      .addCase(addBloodUnit.rejected, fail);

    b.addCase(requestCrossmatch.pending, (s) => {
      s.saving = true;
    })
      .addCase(requestCrossmatch.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Crossmatch requested";
        if (a.payload.data) s.crossmatches = [a.payload.data, ...s.crossmatches];
      })
      .addCase(requestCrossmatch.rejected, fail);

    b.addCase(completeCrossmatch.fulfilled, (s, a) => {
      s.saving = false;
      s.message = "Crossmatch completed";
      if (a.payload.data) {
        const idx = s.crossmatches.findIndex((c) => c._id === a.payload.data!._id);
        if (idx >= 0) s.crossmatches[idx] = a.payload.data;
        else s.crossmatches = [a.payload.data, ...s.crossmatches];
      }
    });

    b.addCase(fetchTransfusions.pending, (s) => {
      s.listLoading = true;
    })
      .addCase(fetchTransfusions.fulfilled, (s, a) => {
        s.listLoading = false;
        s.transfusions = a.payload.data || [];
      })
      .addCase(fetchTransfusions.rejected, fail);

    b.addCase(startTransfusion.pending, (s) => {
      s.saving = true;
    })
      .addCase(startTransfusion.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Transfusion started";
        if (a.payload.data) s.transfusions = [a.payload.data, ...s.transfusions];
      })
      .addCase(startTransfusion.rejected, fail);
  },
});

export const { clearBloodBankError } = bloodBankSlice.actions;
export default bloodBankSlice.reducer;
