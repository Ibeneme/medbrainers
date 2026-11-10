import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

export interface LabDepartment {
  _id?: string;
  name: string;
  code: string;
  description?: string;
}

export interface Laboratory {
  _id: string;
  company: string;
  name: string;
  departments: LabDepartment[];
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
  requiresSampleCollection: boolean;
  turnaroundHours?: number;
  price: number;
  units?: string;
  referenceRange?: string;
  defaultKeys: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LabResultFile {
  _id?: string;
  url: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  uploadedBy?: string | { _id: string; firstName?: string; lastName?: string };
}

export interface LabTestResultItem {
  _id?: string;
  catalogId?: string;
  code: string;
  name: string;
  price?: number;
  status: 'ordered' | 'collecting_sample' | 'collected' | 'processing' | 'resulted' | 'verified' | 'cancelled';
  requiresSample?: boolean;
  sampleCollected?: boolean;
  specimenType?: string;
  assignedTo?: string | { _id: string; firstName?: string; lastName?: string };
  resultValue?: string;
  resultUnit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  resultImages?: string[];
  metadata?: Array<{ key: string; value: string }>;
  specialNotes?: string;
  resultFiles?: LabResultFile[];
  resultedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string | { _id: string; firstName?: string; lastName?: string };
}

export interface LabRequest {
  _id: string;
  company: string;
  patient: string | { _id: string; mrn?: string; firstName?: string; lastName?: string; phone?: string; dateOfBirth?: string; gender?: string };
  consultation?: string;
  admission?: string;
  assignedTo?: string | { _id: string; firstName?: string; lastName?: string };
  tests: LabTestResultItem[];
  priority: 'routine' | 'urgent' | 'stat';
  clinicalNotes?: string;
  notesList?: Array<{ _id?: string; author: string | { _id: string; firstName?: string; lastName?: string }; text: string; createdAt: string }>;
  status: 'ordered' | 'collecting_sample' | 'collected' | 'processing' | 'resulted' | 'verified' | 'cancelled';
  orderedBy: string | { _id: string; firstName?: string; lastName?: string; email?: string };
  orderedAt: string;
  collectedAt?: string;
  collectedBy?: string;
  specimenIds: string[];
  requiresSampleCollection: boolean;
  sampleCollected: boolean;
  sampleCollectedAt?: string;
  sampleCollectedBy?: string | { _id: string; firstName?: string; lastName?: string };
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
  activeRequest: LabRequest | null;
  specimens: Specimen[];
  listLoading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: LabsState = {
  laboratory: null,
  catalog: [],
  requests: [],
  activeRequest: null,
  specimens: [],
  listLoading: false,
  detailLoading: false,
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
        requiresSampleCollection?: boolean;
        turnaroundHours?: number;
        price: number;
        units?: string;
        referenceRange?: string;
        defaultKeys?: string[];
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
      consultationId,
    }: { facilityId: string; patientId?: string; status?: string; consultationId?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<LabRequest[]>>(
        `/companies/${facilityId}/labs/requests`,
        { params: { patientId, status, consultationId } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load lab requests"));
    }
  },
);

export const fetchLabRequestDetail = createAsyncThunk(
  "labs/fetchRequestDetail",
  async ({ facilityId, requestId }: { facilityId: string; requestId: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<LabRequest>>(`/companies/${facilityId}/labs/requests/${requestId}`);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load request details"));
    }
  }
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

export const updateRequestAssignment = createAsyncThunk(
  "labs/updateRequestAssignment",
  async ({ facilityId, requestId, assignedTo }: { facilityId: string; requestId: string; assignedTo?: string | null }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch<ApiSuccess<LabRequest>>(`/companies/${facilityId}/labs/requests/${requestId}/assignment`, { assignedTo });
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update assignment"));
    }
  }
);

export const updateRequestKanbanStatus = createAsyncThunk(
  "labs/updateRequestKanbanStatus",
  async (
    {
      facilityId,
      requestId,
      status,
    }: {
      facilityId: string;
      requestId: string;
      status: 'ordered' | 'collecting_sample' | 'collected' | 'processing' | 'resulted' | 'verified' | 'cancelled';
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<LabRequest>>(
        `/companies/${facilityId}/labs/requests/${requestId}/kanban-status`,
        { status },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update request status"));
    }
  },
);

export const addLabRequestNote = createAsyncThunk(
  "labs/addRequestNote",
  async ({ facilityId, requestId, text }: { facilityId: string; requestId: string; text: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post<ApiSuccess<LabRequest>>(`/companies/${facilityId}/labs/requests/${requestId}/notes`, { text });
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not add note"));
    }
  }
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
        assignedTo?: string | null;
        sampleCollected?: boolean;
        resultValue?: string;
        resultUnit?: string;
        referenceRange?: string;
        isAbnormal?: boolean;
        resultImages?: string[];
        metadata?: Array<{ key: string; value: string }>;
        specialNotes?: string;
        status?: 'ordered' | 'collecting_sample' | 'collected' | 'processing' | 'resulted' | 'verified' | 'cancelled';
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

export const uploadTestResultFiles = createAsyncThunk(
  "labs/uploadTestResultFiles",
  async (
    {
      facilityId,
      requestId,
      testId,
      files,
    }: {
      facilityId: string;
      requestId: string;
      testId: string;
      files: File[];
    },
    { rejectWithValue },
  ) => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const { data } = await api.post<ApiSuccess<LabRequest>>(
        `/companies/${facilityId}/labs/requests/${requestId}/tests/${testId}/files`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not upload result files"));
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

export const trackRequestBySpecimenCode = createAsyncThunk(
  "labs/trackRequestBySpecimenCode",
  async ({ facilityId, specimenCode }: { facilityId: string; specimenCode: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<LabRequest>>(
        `/companies/${facilityId}/labs/specimens/track/${encodeURIComponent(specimenCode)}`
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to find lab request for specimen code"));
    }
  }
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
        `/companies/${facilityId}/labs/specimens/${specimenId}/status`,
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
    clearActiveLabRequest(s) {
      s.activeRequest = null;
    },
  },
  extraReducers: (b) => {
    const fail = (s: LabsState, a: any) => {
      s.listLoading = false;
      s.detailLoading = false;
      s.saving = false;
      s.error = a.payload || "Request failed";
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

    b.addCase(fetchLabRequestDetail.pending, (s) => {
      s.detailLoading = true;
      s.error = null;
    })
      .addCase(fetchLabRequestDetail.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.activeRequest = a.payload.data || null;
      })
      .addCase(fetchLabRequestDetail.rejected, fail);

    b.addCase(createLabRequest.pending, (s) => {
      s.saving = true;
    })
      .addCase(createLabRequest.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Lab request created";
        if (a.payload.data) s.requests = [a.payload.data, ...s.requests];
      })
      .addCase(createLabRequest.rejected, fail);

    b.addCase(updateRequestAssignment.fulfilled, (s, a) => {
      s.saving = false;
      s.message = "Assignment updated";
      if (a.payload.data) s.activeRequest = a.payload.data;
    })

    b.addCase(updateRequestKanbanStatus.fulfilled, (s, a) => {
      s.saving = false;
      s.message = "Request status updated";
      if (a.payload.data) {
        const updated = a.payload.data;
        if (s.activeRequest && s.activeRequest._id === updated._id) {
          s.activeRequest = {
            ...s.activeRequest,
            ...updated,
            patient:
              typeof updated.patient === "object" && updated.patient !== null
                ? updated.patient
                : s.activeRequest.patient,
            tests:
              updated.tests && updated.tests.length > 0
                ? updated.tests
                : s.activeRequest.tests,
            notesList: updated.notesList || s.activeRequest.notesList,
          };
        }
        const idx = s.requests.findIndex((r) => r._id === updated._id);
        if (idx >= 0) {
          s.requests[idx] = updated;
        }
      }
    });

    b.addCase(addLabRequestNote.fulfilled, (s, a) => {
      s.saving = false;
      s.message = "Note added";
      if (a.payload.data) s.activeRequest = a.payload.data;
    })

    b.addCase(updateTestResult.fulfilled, (s, a) => {
      s.saving = false;
      s.message = "Test result updated";
      if (a.payload.data) s.activeRequest = a.payload.data;
    })

    b.addCase(uploadTestResultFiles.pending, (s) => {
      s.saving = true;
    })
      .addCase(uploadTestResultFiles.fulfilled, (s, a) => {
        s.saving = false;
        s.message = "Result files uploaded successfully";
        if (a.payload.data) s.activeRequest = a.payload.data;
      })
      .addCase(uploadTestResultFiles.rejected, fail);

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

    b.addCase(trackRequestBySpecimenCode.pending, (s) => {
      s.detailLoading = true;
      s.error = null;
    })
      .addCase(trackRequestBySpecimenCode.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.activeRequest = a.payload.data || null;
      })
      .addCase(trackRequestBySpecimenCode.rejected, (s, a) => {
        fail(s, a);
        s.activeRequest = null;
      });

    b.addCase(updateSpecimenStatus.pending, (s) => {
      s.saving = true;
    })
      .addCase(updateSpecimenStatus.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Specimen status updated";
        if (a.payload.data) {
          const updated = a.payload.data;
          const idx = s.specimens.findIndex((sp) => sp._id === updated._id);
          if (idx >= 0) {
            s.specimens[idx] = updated;
          }
        }
      })
      .addCase(updateSpecimenStatus.rejected, fail);
  },
});

export const { clearLabsError, clearActiveLabRequest } = labsSlice.actions;
export default labsSlice.reducer;