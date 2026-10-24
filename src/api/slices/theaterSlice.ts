import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

export interface SurgeryBooking {
  _id: string;
  patientId: string | { _id: string; firstName?: string; lastName?: string; mrn?: string };
  procedureName: string;
  procedureCode?: string;
  primarySurgeon?: string | { _id: string; firstName?: string; lastName?: string };
  assistants?: string[];
  anesthetist?: string | { _id: string; firstName?: string; lastName?: string };
  theaterRoom: string;
  scheduledStart: string;
  scheduledEnd: string;
  priority?: "elective" | "urgent" | "emergency";
  anesthesiaType?: string;
  estimatedDurationMinutes?: number;
  preOpDiagnosis?: string;
  status?: "scheduled" | "in_progress" | "completed" | "cancelled" | "delayed";
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SurgicalChecklist {
  _id: string;
  surgeryId?: string;
  signIn?: Record<string, boolean | string>;
  timeOut?: Record<string, boolean | string>;
  signOut?: Record<string, boolean | string>;
  completed?: boolean;
  updatedAt?: string;
}

export interface RecoveryEntry {
  _id: string;
  surgeryId?: string;
  patientId: string | { _id: string; firstName?: string; lastName?: string; mrn?: string };
  status?: "in_recovery" | "stable" | "discharged_to_ward" | "icu" | "complication";
  bed?: string;
  latestVitals?: Record<string, number | string>;
  painScore?: number;
  notes?: string;
  admittedAt?: string;
  dischargedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TheaterState {
  schedule: SurgeryBooking[];
  checklist: SurgicalChecklist | null;
  recovery: RecoveryEntry[];
  listLoading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: TheaterState = {
  schedule: [],
  checklist: null,
  recovery: [],
  listLoading: false,
  detailLoading: false,
  saving: false,
  error: null,
  message: null,
};

export const fetchTheaterSchedule = createAsyncThunk(
  "theater/fetchSchedule",
  async (
    {
      facilityId,
      from,
      to,
      theaterRoom,
      status,
      patientId,
    }: {
      facilityId: string;
      from?: string;
      to?: string;
      theaterRoom?: string;
      status?: string;
      patientId?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<SurgeryBooking[]>>(
        `/companies/${facilityId}/theater/schedule`,
        { params: { from, to, theaterRoom, status, patientId } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load OR schedule"));
    }
  },
);

export const bookSurgery = createAsyncThunk(
  "theater/bookSurgery",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        patientId: string;
        procedureName: string;
        procedureCode?: string;
        primarySurgeon: string;
        assistants?: string[];
        anesthetist?: string;
        theaterRoom: string;
        scheduledStart: string;
        scheduledEnd: string;
        priority?: string;
        anesthesiaType?: string;
        estimatedDurationMinutes?: number;
        preOpDiagnosis?: string;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<SurgeryBooking>>(
        `/companies/${facilityId}/theater/schedule`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not book surgery"));
    }
  },
);

export const updateSurgeryStatus = createAsyncThunk(
  "theater/updateStatus",
  async (
    {
      facilityId,
      id,
      payload,
    }: {
      facilityId: string;
      id: string;
      payload: { status: string; notes?: string };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<SurgeryBooking>>(
        `/companies/${facilityId}/theater/schedule/${id}/status`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update surgery status"));
    }
  },
);

export const fetchChecklist = createAsyncThunk(
  "theater/fetchChecklist",
  async (
    { facilityId, id }: { facilityId: string; id: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<SurgicalChecklist>>(
        `/companies/${facilityId}/theater/checklists/${id}`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load checklist"));
    }
  },
);

export const updateChecklistSection = createAsyncThunk(
  "theater/updateChecklist",
  async (
    {
      facilityId,
      id,
      section,
      payload,
    }: {
      facilityId: string;
      id: string;
      section: "signIn" | "timeOut" | "signOut";
      payload: Record<string, boolean | string>;
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<SurgicalChecklist>>(
        `/companies/${facilityId}/theater/checklists/${id}/${section}`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update checklist"));
    }
  },
);

export const fetchRecovery = createAsyncThunk(
  "theater/fetchRecovery",
  async (
    { facilityId, status }: { facilityId: string; status?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<RecoveryEntry[]>>(
        `/companies/${facilityId}/theater/recovery`,
        { params: { status } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load recovery board"));
    }
  },
);

export const updateRecovery = createAsyncThunk(
  "theater/updateRecovery",
  async (
    {
      facilityId,
      id,
      payload,
    }: {
      facilityId: string;
      id: string;
      payload: { status?: string; bed?: string; painScore?: number; notes?: string };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<RecoveryEntry>>(
        `/companies/${facilityId}/theater/recovery/${id}`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update recovery entry"));
    }
  },
);

export const recordRecoveryVitals = createAsyncThunk(
  "theater/recordRecoveryVitals",
  async (
    {
      facilityId,
      id,
      payload,
    }: { facilityId: string; id: string; payload: Record<string, number | string> },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<RecoveryEntry>>(
        `/companies/${facilityId}/theater/recovery/${id}/vitals`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not record recovery vitals"));
    }
  },
);

const theaterSlice = createSlice({
  name: "theater",
  initialState,
  reducers: {
    clearTheaterError(s) {
      s.error = null;
      s.message = null;
    },
  },
  extraReducers: (b) => {
    const fail = (s: TheaterState, a: { payload?: unknown }) => {
      s.listLoading = false;
      s.detailLoading = false;
      s.saving = false;
      s.error = (a.payload as string) || "Request failed";
    };

    b.addCase(fetchTheaterSchedule.pending, (s) => {
      s.listLoading = true;
      s.error = null;
    })
      .addCase(fetchTheaterSchedule.fulfilled, (s, a) => {
        s.listLoading = false;
        s.schedule = a.payload.data || [];
      })
      .addCase(fetchTheaterSchedule.rejected, fail);

    b.addCase(bookSurgery.pending, (s) => {
      s.saving = true;
    })
      .addCase(bookSurgery.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Surgery booked";
        if (a.payload.data) s.schedule = [a.payload.data, ...s.schedule];
      })
      .addCase(bookSurgery.rejected, fail);

    b.addCase(updateSurgeryStatus.fulfilled, (s, a) => {
      s.saving = false;
      s.message = "Status updated";
      if (a.payload.data) {
        const idx = s.schedule.findIndex((x) => x._id === a.payload.data!._id);
        if (idx >= 0) s.schedule[idx] = a.payload.data;
      }
    });

    b.addCase(fetchChecklist.pending, (s) => {
      s.detailLoading = true;
    })
      .addCase(fetchChecklist.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.checklist = a.payload.data || null;
      })
      .addCase(fetchChecklist.rejected, fail);

    b.addCase(updateChecklistSection.fulfilled, (s, a) => {
      s.saving = false;
      s.message = "Checklist updated";
      s.checklist = a.payload.data || null;
    });

    b.addCase(fetchRecovery.pending, (s) => {
      s.listLoading = true;
    })
      .addCase(fetchRecovery.fulfilled, (s, a) => {
        s.listLoading = false;
        s.recovery = a.payload.data || [];
      })
      .addCase(fetchRecovery.rejected, fail);

    b.addCase(updateRecovery.fulfilled, (s, a) => {
      s.saving = false;
      if (a.payload.data) {
        const idx = s.recovery.findIndex((r) => r._id === a.payload.data!._id);
        if (idx >= 0) s.recovery[idx] = a.payload.data;
      }
    });

    b.addCase(recordRecoveryVitals.fulfilled, (s, a) => {
      s.saving = false;
      s.message = "Vitals recorded";
      if (a.payload.data) {
        const idx = s.recovery.findIndex((r) => r._id === a.payload.data!._id);
        if (idx >= 0) s.recovery[idx] = a.payload.data;
      }
    });
  },
});

export const { clearTheaterError } = theaterSlice.actions;
export default theaterSlice.reducer;
