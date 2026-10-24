import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

export interface Department {
  _id?: string;
  name: string;
  code: string;
  description?: string;
}

export interface Laboratory {
  _id: string;
  company: string;
  name: string;
  departments: Department[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LabCatalogItem {
  _id: string;
  company: string;
  laboratory?: string;
  departmentCode?: string;
  code: string;
  name: string;
  category: string;
  specimenType?: string;
  turnaroundHours?: number;
  price: number;
  units?: string;
  referenceRange?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LabTestResultItem {
  _id?: string;
  catalogId?: string;
  code: string;
  name: string;
  price?: number;
  status: 'ordered' | 'collected' | 'processing' | 'resulted' | 'verified' | 'cancelled';
  resultValue?: string;
  resultUnit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  resultImages?: string[];
  resultedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string | { _id: string; firstName?: string; lastName?: string };
}

export interface LabRequest {
  _id: string;
  company: string;
  patient: string | { _id: string; mrn?: string; firstName?: string; lastName?: string; phone?: string };
  consultation?: string;
  admission?: string;
  tests: LabTestResultItem[];
  priority: 'routine' | 'urgent' | 'stat';
  clinicalNotes?: string;
  status: 'ordered' | 'partial' | 'completed' | 'cancelled';
  orderedBy: string | { _id: string; firstName?: string; lastName?: string; email?: string };
  orderedAt: string;
  collectedAt?: string;
  collectedBy?: string;
  specimenIds: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Specimen {
  _id: string;
  company: string;
  patient: string | { _id: string; mrn?: string; firstName?: string; lastName?: string };
  labRequest: string;
  barcode: string;
  specimenType: string;
  collectedAt: string;
  collectedBy?: string | { _id: string; firstName?: string; lastName?: string };
  receivedAt?: string;
  receivedBy?: string | { _id: string; firstName?: string; lastName?: string };
  status: 'collected' | 'in_transit' | 'received' | 'processing' | 'discarded' | 'rejected';
  rejectionReason?: string;
  storageLocation?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LabsState {
  laboratory: Laboratory | null;
  catalog: LabCatalogItem[];
  requests: LabRequest[];
  specimens: Specimen[];
  listLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: LabsState = {
  laboratory: null,
  catalog: [],
  requests: [],
  specimens: [],
  listLoading: false,
  saving: false,
  error: null,
  message: null,
};

// --- Laboratory Setup Thunks ---
export const fetchLaboratory = createAsyncThunk(
  "labs/fetchLaboratory",
  async ({ facilityId }: { facilityId: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<Laboratory>>(
        `/companies/${facilityId}/labs/laboratory`
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load laboratory setup"));
    }
  }
);

export const upsertLaboratory = createAsyncThunk(
  "labs/upsertLaboratory",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: { name: string; departments: Array<{ name: string; code: string; description?: string }> };
    },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.put<ApiSuccess<Laboratory>>(
        `/companies/${facilityId}/labs/laboratory`,
        payload
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not save laboratory setup"));
    }
  }
);

// --- Test Catalog Thunks ---
export const fetchLabCatalog = createAsyncThunk(
  "labs/fetchCatalog",
  async (
    { facilityId, includeInactive, search }: { facilityId: string; includeInactive?: boolean; search?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<LabCatalogItem[]>>(
        `/companies/${facilityId}/labs/catalog`,
        { params: { includeInactive, search } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load lab catalog"));
    }
  },
);

export const addLabCatalogItem = createAsyncThunk(
  "labs/addCatalogItem",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        code: string;
        name: string;
        category: string;
        departmentCode?: string;
        specimenType?: string;
        turnaroundHours?: number;
        price: number;
        units?: string;
        referenceRange?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<LabCatalogItem>>(
        `/companies/${facilityId}/labs/catalog`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not add catalog item"));
    }
  },
);

export const updateLabCatalogItem = createAsyncThunk(
  "labs/updateCatalogItem",
  async (
    {
      facilityId,
      catalogId,
      payload,
    }: {
      facilityId: string;
      catalogId: string;
      payload: Partial<LabCatalogItem>;
    },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<LabCatalogItem>>(
        `/companies/${facilityId}/labs/catalog/${catalogId}`,
        payload
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update catalog item"));
    }
  }
);

// --- Lab Requests Thunks ---
export const fetchLabRequests = createAsyncThunk(
  "labs/fetchRequests",
  async (
    {
      facilityId,
      patientId,
      status,
    }: { facilityId: string; patientId?: string; status?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<LabRequest[]>>(
        `/companies/${facilityId}/labs/requests`,
        { params: { patientId, status } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load lab requests"));
    }
  },
);

export const createLabRequest = createAsyncThunk(
  "labs/createRequest",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        patientId: string;
        consultationId?: string;
        admissionId?: string;
        testCatalogIds: string[];
        priority?: 'routine' | 'urgent' | 'stat';
        clinicalNotes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<LabRequest>>(
        `/companies/${facilityId}/labs/requests`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not create lab request"));
    }
  },
);

export const updateTestResult = createAsyncThunk(
  "labs/updateTestResult",
  async (
    {
      facilityId,
      requestId,
      testId,
      payload,
    }: {
      facilityId: string;
      requestId: string;
      testId: string;
      payload: {
        resultValue?: string;
        resultUnit?: string;
        referenceRange?: string;
        isAbnormal?: boolean;
        resultImages?: string[];
        status?: 'processing' | 'resulted' | 'verified' | 'cancelled';
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<LabRequest>>(
        `/companies/${facilityId}/labs/requests/${requestId}/tests/${testId}`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update test result"));
    }
  },
);

// --- Specimen Thunks ---
export const fetchSpecimens = createAsyncThunk(
  "labs/fetchSpecimens",
  async (
    { facilityId, patientId, status }: { facilityId: string; patientId?: string; status?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<Specimen[]>>(
        `/companies/${facilityId}/labs/specimens`,
        { params: { patientId, status } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load specimens"));
    }
  },
);

export const getSpecimenByBarcode = createAsyncThunk(
  "labs/getSpecimenByBarcode",
  async (
    { facilityId, barcode }: { facilityId: string; barcode: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<Specimen>>(
        `/companies/${facilityId}/labs/specimens/barcode/${barcode}`
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Specimen barcode not found"));
    }
  }
);

export const collectSpecimen = createAsyncThunk(
  "labs/collectSpecimen",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        labRequestId: string;
        specimenType: string;
        barcode?: string;
        storageLocation?: string;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<Specimen>>(
        `/companies/${facilityId}/labs/specimens`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not collect specimen"));
    }
  },
);

export const updateSpecimenStatus = createAsyncThunk(
  "labs/updateSpecimenStatus",
  async (
    {
      facilityId,
      specimenId,
      payload,
    }: {
      facilityId: string;
      specimenId: string;
      payload: {
        status: 'collected' | 'in_transit' | 'received' | 'processing' | 'discarded' | 'rejected';
        rejectionReason?: string;
        storageLocation?: string;
        notes?: string;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<Specimen>>(
        `/companies/${facilityId}/labs/specimens/${specimenId}`,
        payload
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update specimen status"));
    }
  }
);

const labsSlice = createSlice({
  name: "labs",
  initialState,
  reducers: {
    clearLabsError(s) {
      s.error = null;
      s.message = null;
    },
  },
  extraReducers: (b) => {
    const fail = (s: LabsState, a: { payload?: unknown }) => {
      s.listLoading = false;
      s.saving = false;
      s.error = (a.payload as string) || "Request failed";
    };

    // Laboratory Setup
    b.addCase(fetchLaboratory.fulfilled, (s, a) => {
      s.laboratory = a.payload.data || null;
    })
      .addCase(upsertLaboratory.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Laboratory setup saved";
        s.laboratory = a.payload.data || null;
      })
      .addCase(upsertLaboratory.rejected, fail);

    // Catalog
    b.addCase(fetchLabCatalog.pending, (s) => {
      s.listLoading = true;
      s.error = null;
    })
      .addCase(fetchLabCatalog.fulfilled, (s, a) => {
        s.listLoading = false;
        s.catalog = a.payload.data || [];
      })
      .addCase(fetchLabCatalog.rejected, fail);

    b.addCase(addLabCatalogItem.pending, (s) => {
      s.saving = true;
    })
      .addCase(addLabCatalogItem.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Catalog item added";
        if (a.payload.data) s.catalog = [a.payload.data, ...s.catalog];
      })
      .addCase(addLabCatalogItem.rejected, fail)

      .addCase(updateLabCatalogItem.fulfilled, (s, a) => {
        s.saving = false;
        s.message = "Catalog item updated";
        if (a.payload.data) {
          const idx = s.catalog.findIndex((c) => c._id === a.payload.data!._id);
          if (idx >= 0) s.catalog[idx] = a.payload.data;
        }
      });

    // Requests
    b.addCase(fetchLabRequests.pending, (s) => {
      s.listLoading = true;
      s.error = null;
    })
      .addCase(fetchLabRequests.fulfilled, (s, a) => {
        s.listLoading = false;
        s.requests = a.payload.data || [];
      })
      .addCase(fetchLabRequests.rejected, fail);

    b.addCase(createLabRequest.pending, (s) => {
      s.saving = true;
    })
      .addCase(createLabRequest.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Lab request created";
        if (a.payload.data) s.requests = [a.payload.data, ...s.requests];
      })
      .addCase(createLabRequest.rejected, fail);

    b.addCase(updateTestResult.fulfilled, (s, a) => {
      s.saving = false;
      s.message = "Test result updated";
      if (a.payload.data) {
        const idx = s.requests.findIndex((r) => r._id === a.payload.data!._id);
        if (idx >= 0) s.requests[idx] = a.payload.data;
      }
    });

    // Specimens
    b.addCase(fetchSpecimens.pending, (s) => {
      s.listLoading = true;
    })
      .addCase(fetchSpecimens.fulfilled, (s, a) => {
        s.listLoading = false;
        s.specimens = a.payload.data || [];
      })
      .addCase(fetchSpecimens.rejected, fail);

    b.addCase(collectSpecimen.fulfilled, (s, a) => {
      s.saving = false;
      s.message = "Specimen collected and labeled";
      if (a.payload.data) {
        s.specimens = [a.payload.data, ...s.specimens];
      }
    });

    b.addCase(updateSpecimenStatus.fulfilled, (s, a) => {
      s.saving = false;
      s.message = "Specimen status updated";
      if (a.payload.data) {
        const idx = s.specimens.findIndex((sp) => sp._id === a.payload.data!._id);
        if (idx >= 0) s.specimens[idx] = a.payload.data;
      }
    });
  },
});

export const { clearLabsError } = labsSlice.actions;
export default labsSlice.reducer;