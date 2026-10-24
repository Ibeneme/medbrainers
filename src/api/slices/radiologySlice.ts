import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

export interface ImagingRequest {
  _id: string;
  patientId: string | { _id: string; firstName?: string; lastName?: string; mrn?: string };
  requestedBy?: string | { _id: string; firstName?: string; lastName?: string };
  modality?: "xray" | "ct" | "mri" | "ultrasound" | "fluoroscopy" | "nuclear" | "other";
  bodyPart?: string;
  clinicalIndication?: string;
  priority?: "routine" | "urgent" | "stat";
  status?: "pending" | "scheduled" | "in_progress" | "completed" | "reported" | "cancelled";
  scheduledAt?: string;
  performedAt?: string;
  report?: {
    findings?: string;
    impression?: string;
    reportedBy?: string;
    reportedAt?: string;
  };
  images?: Array<{ url?: string; description?: string }>;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RadiologyState {
  worklist: ImagingRequest[];
  current: ImagingRequest | null;
  listLoading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: RadiologyState = {
  worklist: [],
  current: null,
  listLoading: false,
  detailLoading: false,
  saving: false,
  error: null,
  message: null,
};

export const fetchRadiologyWorklist = createAsyncThunk(
  "radiology/fetchWorklist",
  async (
    {
      facilityId,
      status,
      modality,
      patientId,
    }: { facilityId: string; status?: string; modality?: string; patientId?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<ImagingRequest[]>>(
        `/companies/${facilityId}/radiology/worklist`,
        { params: { status, modality, patientId } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load radiology worklist"));
    }
  },
);

export const createImagingRequest = createAsyncThunk(
  "radiology/createRequest",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        patientId: string;
        modality: string;
        bodyPart?: string;
        clinicalIndication?: string;
        priority?: string;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<ImagingRequest>>(
        `/companies/${facilityId}/radiology/requests`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not create imaging request"));
    }
  },
);

export const updateImagingRequest = createAsyncThunk(
  "radiology/updateRequest",
  async (
    {
      facilityId,
      id,
      payload,
    }: {
      facilityId: string;
      id: string;
      payload: {
        status?: string;
        scheduledAt?: string;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<ImagingRequest>>(
        `/companies/${facilityId}/radiology/requests/${id}`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update request"));
    }
  },
);

export const submitRadiologyReport = createAsyncThunk(
  "radiology/submitReport",
  async (
    {
      facilityId,
      id,
      payload,
    }: {
      facilityId: string;
      id: string;
      payload: { findings?: string; impression?: string };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<ImagingRequest>>(
        `/companies/${facilityId}/radiology/requests/${id}/report`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not submit report"));
    }
  },
);

export const fetchRadiologyViewer = createAsyncThunk(
  "radiology/fetchViewer",
  async (
    { facilityId, id }: { facilityId: string; id: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<ImagingRequest>>(
        `/companies/${facilityId}/radiology/viewer/${id}`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load study"));
    }
  },
);

const radiologySlice = createSlice({
  name: "radiology",
  initialState,
  reducers: {
    clearRadiologyError(s) {
      s.error = null;
      s.message = null;
    },
    clearCurrentStudy(s) {
      s.current = null;
    },
  },
  extraReducers: (b) => {
    const fail = (s: RadiologyState, a: { payload?: unknown }) => {
      s.listLoading = false;
      s.detailLoading = false;
      s.saving = false;
      s.error = (a.payload as string) || "Request failed";
    };

    b.addCase(fetchRadiologyWorklist.pending, (s) => {
      s.listLoading = true;
      s.error = null;
    })
      .addCase(fetchRadiologyWorklist.fulfilled, (s, a) => {
        s.listLoading = false;
        s.worklist = a.payload.data || [];
      })
      .addCase(fetchRadiologyWorklist.rejected, fail);

    b.addCase(createImagingRequest.pending, (s) => {
      s.saving = true;
    })
      .addCase(createImagingRequest.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Imaging request created";
        if (a.payload.data) s.worklist = [a.payload.data, ...s.worklist];
      })
      .addCase(createImagingRequest.rejected, fail);

    b.addCase(updateImagingRequest.fulfilled, (s, a) => {
      s.saving = false;
      s.message = "Request updated";
      if (a.payload.data) {
        const idx = s.worklist.findIndex((w) => w._id === a.payload.data!._id);
        if (idx >= 0) s.worklist[idx] = a.payload.data;
        if (s.current?._id === a.payload.data._id) s.current = a.payload.data;
      }
    });

    b.addCase(submitRadiologyReport.pending, (s) => {
      s.saving = true;
    })
      .addCase(submitRadiologyReport.fulfilled, (s, a) => {
        s.saving = false;
        s.message = "Report submitted";
        if (a.payload.data) {
          const idx = s.worklist.findIndex((w) => w._id === a.payload.data!._id);
          if (idx >= 0) s.worklist[idx] = a.payload.data;
          s.current = a.payload.data;
        }
      })
      .addCase(submitRadiologyReport.rejected, fail);

    b.addCase(fetchRadiologyViewer.pending, (s) => {
      s.detailLoading = true;
    })
      .addCase(fetchRadiologyViewer.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.current = a.payload.data || null;
      })
      .addCase(fetchRadiologyViewer.rejected, fail);
  },
});

export const { clearRadiologyError, clearCurrentStudy } = radiologySlice.actions;
export default radiologySlice.reducer;
