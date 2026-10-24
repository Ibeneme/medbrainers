import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

export interface ErEncounter {
  _id: string;
  patientId: string | { _id: string; firstName?: string; lastName?: string; mrn?: string };
  triageLevel?: "1" | "2" | "3" | "4" | "5" | "red" | "orange" | "yellow" | "green" | "blue";
  chiefComplaint?: string;
  status?: "waiting" | "in_treatment" | "observation" | "admitted" | "discharged" | "left" | "deceased";
  location?: string;
  assignedTo?: string | { _id: string; firstName?: string; lastName?: string };
  arrivalMode?: string;
  arrivalTime?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Ambulance {
  _id: string;
  callSign?: string;
  status?: "available" | "dispatched" | "on_scene" | "transporting" | "offline";
  patientId?: string | { _id: string; firstName?: string; lastName?: string };
  destination?: string;
  crew?: string[];
  dispatchedAt?: string;
  eta?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CriticalPatient {
  _id: string;
  patientId: string | { _id: string; firstName?: string; lastName?: string; mrn?: string };
  unit?: string;
  bed?: string;
  status?: "stable" | "unstable" | "critical" | "improving";
  diagnosis?: string;
  alerts?: Array<{ message: string; severity?: string; acknowledged?: boolean; at?: string }>;
  latestVitals?: Record<string, number | string>;
  assignedNurse?: string | { _id: string; firstName?: string; lastName?: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface EmergencyState {
  board: ErEncounter[];
  ambulances: Ambulance[];
  critical: CriticalPatient[];
  listLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: EmergencyState = {
  board: [],
  ambulances: [],
  critical: [],
  listLoading: false,
  saving: false,
  error: null,
  message: null,
};

export const fetchErBoard = createAsyncThunk(
  "emergency/fetchBoard",
  async (
    { facilityId, status }: { facilityId: string; status?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<ErEncounter[]>>(
        `/companies/${facilityId}/emergency/board`,
        { params: { status } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load ER board"));
    }
  },
);

export const createErEncounter = createAsyncThunk(
  "emergency/createEncounter",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        patientId: string;
        triageLevel?: string;
        chiefComplaint?: string;
        arrivalMode?: string;
        location?: string;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<ErEncounter>>(
        `/companies/${facilityId}/emergency/encounters`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not create ER encounter"));
    }
  },
);

export const updateErEncounter = createAsyncThunk(
  "emergency/updateEncounter",
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
        triageLevel?: string;
        location?: string;
        assignedTo?: string;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<ErEncounter>>(
        `/companies/${facilityId}/emergency/encounters/${id}`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update encounter"));
    }
  },
);

export const fetchAmbulances = createAsyncThunk(
  "emergency/fetchAmbulances",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<Ambulance[]>>(
        `/companies/${facilityId}/emergency/ambulances`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load ambulances"));
    }
  },
);

export const dispatchAmbulance = createAsyncThunk(
  "emergency/dispatchAmbulance",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        callSign?: string;
        patientId?: string;
        destination?: string;
        crew?: string[];
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<Ambulance>>(
        `/companies/${facilityId}/emergency/ambulances/dispatch`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not dispatch ambulance"));
    }
  },
);

export const updateAmbulance = createAsyncThunk(
  "emergency/updateAmbulance",
  async (
    {
      facilityId,
      id,
      payload,
    }: {
      facilityId: string;
      id: string;
      payload: { status?: string; eta?: string; notes?: string; destination?: string };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<Ambulance>>(
        `/companies/${facilityId}/emergency/ambulances/${id}`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update ambulance"));
    }
  },
);

export const fetchCritical = createAsyncThunk(
  "emergency/fetchCritical",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<CriticalPatient[]>>(
        `/companies/${facilityId}/emergency/critical`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load critical care"));
    }
  },
);

export const addCriticalPatient = createAsyncThunk(
  "emergency/addCritical",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        patientId: string;
        unit?: string;
        bed?: string;
        diagnosis?: string;
        assignedNurse?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<CriticalPatient>>(
        `/companies/${facilityId}/emergency/critical`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not add critical patient"));
    }
  },
);

export const recordCriticalVitals = createAsyncThunk(
  "emergency/recordCriticalVitals",
  async (
    {
      facilityId,
      id,
      payload,
    }: { facilityId: string; id: string; payload: Record<string, number | string> },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<CriticalPatient>>(
        `/companies/${facilityId}/emergency/critical/${id}/vitals`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not record vitals"));
    }
  },
);

export const ackCriticalAlert = createAsyncThunk(
  "emergency/ackAlert",
  async (
    {
      facilityId,
      id,
      alertIndex,
    }: { facilityId: string; id: string; alertIndex: number },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<CriticalPatient>>(
        `/companies/${facilityId}/emergency/critical/${id}/alerts/${alertIndex}/ack`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not acknowledge alert"));
    }
  },
);

const emergencySlice = createSlice({
  name: "emergency",
  initialState,
  reducers: {
    clearEmergencyError(s) {
      s.error = null;
      s.message = null;
    },
  },
  extraReducers: (b) => {
    const fail = (s: EmergencyState, a: { payload?: unknown }) => {
      s.listLoading = false;
      s.saving = false;
      s.error = (a.payload as string) || "Request failed";
    };

    b.addCase(fetchErBoard.pending, (s) => {
      s.listLoading = true;
      s.error = null;
    })
      .addCase(fetchErBoard.fulfilled, (s, a) => {
        s.listLoading = false;
        s.board = a.payload.data || [];
      })
      .addCase(fetchErBoard.rejected, fail);

    b.addCase(createErEncounter.pending, (s) => {
      s.saving = true;
    })
      .addCase(createErEncounter.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Encounter created";
        if (a.payload.data) s.board = [a.payload.data, ...s.board];
      })
      .addCase(createErEncounter.rejected, fail);

    b.addCase(updateErEncounter.fulfilled, (s, a) => {
      s.saving = false;
      s.message = "Encounter updated";
      if (a.payload.data) {
        const idx = s.board.findIndex((e) => e._id === a.payload.data!._id);
        if (idx >= 0) s.board[idx] = a.payload.data;
      }
    });

    b.addCase(fetchAmbulances.pending, (s) => {
      s.listLoading = true;
    })
      .addCase(fetchAmbulances.fulfilled, (s, a) => {
        s.listLoading = false;
        s.ambulances = a.payload.data || [];
      })
      .addCase(fetchAmbulances.rejected, fail);

    b.addCase(dispatchAmbulance.pending, (s) => {
      s.saving = true;
    })
      .addCase(dispatchAmbulance.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Ambulance dispatched";
        if (a.payload.data) s.ambulances = [a.payload.data, ...s.ambulances];
      })
      .addCase(dispatchAmbulance.rejected, fail);

    b.addCase(updateAmbulance.fulfilled, (s, a) => {
      s.saving = false;
      if (a.payload.data) {
        const idx = s.ambulances.findIndex((x) => x._id === a.payload.data!._id);
        if (idx >= 0) s.ambulances[idx] = a.payload.data;
      }
    });

    b.addCase(fetchCritical.pending, (s) => {
      s.listLoading = true;
    })
      .addCase(fetchCritical.fulfilled, (s, a) => {
        s.listLoading = false;
        s.critical = a.payload.data || [];
      })
      .addCase(fetchCritical.rejected, fail);

    b.addCase(addCriticalPatient.pending, (s) => {
      s.saving = true;
    })
      .addCase(addCriticalPatient.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Patient added to critical care";
        if (a.payload.data) s.critical = [a.payload.data, ...s.critical];
      })
      .addCase(addCriticalPatient.rejected, fail);

    b.addCase(recordCriticalVitals.fulfilled, (s, a) => {
      s.saving = false;
      s.message = "Vitals recorded";
      if (a.payload.data) {
        const idx = s.critical.findIndex((c) => c._id === a.payload.data!._id);
        if (idx >= 0) s.critical[idx] = a.payload.data;
      }
    });

    b.addCase(ackCriticalAlert.fulfilled, (s, a) => {
      if (a.payload.data) {
        const idx = s.critical.findIndex((c) => c._id === a.payload.data!._id);
        if (idx >= 0) s.critical[idx] = a.payload.data;
      }
    });
  },
});

export const { clearEmergencyError } = emergencySlice.actions;
export default emergencySlice.reducer;
