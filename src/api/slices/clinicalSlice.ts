import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

export interface Consultation {
  _id: string;
  patientId: string | { _id: string; firstName?: string; lastName?: string; mrn?: string };
  admissionId?: string;
  clinicianId?: string | { _id: string; firstName?: string; lastName?: string };
  encounterType?: "outpatient" | "inpatient" | "emergency" | "telemedicine" | "follow_up";
  chiefComplaint?: string;
  department?: string;
  location?: string;
  status?: "in_progress" | "completed" | "cancelled";
  soap?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
  followUpRequired?: boolean;
  followUpDate?: string;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Diagnosis {
  _id: string;
  patientId: string | { _id: string; firstName?: string; lastName?: string; mrn?: string };
  consultationId?: string;
  admissionId?: string;
  icd11Code?: string;
  icd11Title?: string;
  icd10Code?: string;
  clinicalDescription: string;
  type?: "primary" | "secondary" | "differential" | "rule_out" | "comorbidity";
  certainty?: "confirmed" | "provisional" | "suspected";
  status?: "active" | "resolved" | "chronic" | "recurrent";
  onsetDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Procedure {
  _id: string;
  patientId: string | { _id: string; firstName?: string; lastName?: string; mrn?: string };
  consultationId?: string;
  admissionId?: string;
  name: string;
  code?: string;
  category?: string;
  status?: "planned" | "in_progress" | "completed" | "cancelled";
  performedBy?: string | { _id: string; firstName?: string; lastName?: string };
  performedAt?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClinicalState {
  consultations: Consultation[];
  currentConsultation: Consultation | null;
  diagnoses: Diagnosis[];
  procedures: Procedure[];
  timeline: unknown[];
  listLoading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
  meta: { page: number; limit: number; total: number } | null;
}

const initialState: ClinicalState = {
  consultations: [],
  currentConsultation: null,
  diagnoses: [],
  procedures: [],
  timeline: [],
  listLoading: false,
  detailLoading: false,
  saving: false,
  error: null,
  message: null,
  meta: null,
};

export const fetchConsultations = createAsyncThunk(
  "clinical/fetchConsultations",
  async (
    {
      facilityId,
      patientId,
      status,
      clinicianId,
      page,
      limit,
    }: {
      facilityId: string;
      patientId?: string;
      status?: string;
      clinicianId?: string;
      page?: number;
      limit?: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<Consultation[]> & { meta?: ClinicalState["meta"] }>(
        `/companies/${facilityId}/clinical/consultations`,
        { params: { patientId, status, clinicianId, page, limit } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load consultations"));
    }
  },
);

export const fetchConsultation = createAsyncThunk(
  "clinical/fetchConsultation",
  async (
    { facilityId, id }: { facilityId: string; id: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<Consultation>>(
        `/companies/${facilityId}/clinical/consultations/${id}`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load consultation"));
    }
  },
);

export const startConsultation = createAsyncThunk(
  "clinical/startConsultation",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        patientId: string;
        admissionId?: string;
        encounterType?: string;
        chiefComplaint?: string;
        department?: string;
        location?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<Consultation>>(
        `/companies/${facilityId}/clinical/consultations`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not start consultation"));
    }
  },
);

export const updateSoap = createAsyncThunk(
  "clinical/updateSoap",
  async (
    {
      facilityId,
      id,
      payload,
    }: {
      facilityId: string;
      id: string;
      payload: {
        subjective?: string;
        objective?: string;
        assessment?: string;
        plan?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<Consultation>>(
        `/companies/${facilityId}/clinical/consultations/${id}/soap`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update SOAP note"));
    }
  },
);

export const completeConsultation = createAsyncThunk(
  "clinical/completeConsultation",
  async (
    {
      facilityId,
      id,
      payload,
    }: {
      facilityId: string;
      id: string;
      payload?: { followUpRequired?: boolean; followUpDate?: string; notes?: string };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<Consultation>>(
        `/companies/${facilityId}/clinical/consultations/${id}/complete`,
        payload || {},
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not complete consultation"));
    }
  },
);

export const fetchDiagnoses = createAsyncThunk(
  "clinical/fetchDiagnoses",
  async (
    {
      facilityId,
      patientId,
      status,
    }: { facilityId: string; patientId?: string; status?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<Diagnosis[]>>(
        `/companies/${facilityId}/clinical/diagnoses`,
        { params: { patientId, status } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load diagnoses"));
    }
  },
);

export const addDiagnosis = createAsyncThunk(
  "clinical/addDiagnosis",
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
        icd11Code?: string;
        icd11Title?: string;
        icd10Code?: string;
        clinicalDescription: string;
        type?: string;
        certainty?: string;
        onsetDate?: string;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<Diagnosis>>(
        `/companies/${facilityId}/clinical/diagnoses`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not add diagnosis"));
    }
  },
);

export const updateDiagnosis = createAsyncThunk(
  "clinical/updateDiagnosis",
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
        certainty?: string;
        clinicalDescription?: string;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<Diagnosis>>(
        `/companies/${facilityId}/clinical/diagnoses/${id}`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update diagnosis"));
    }
  },
);

export const fetchProcedures = createAsyncThunk(
  "clinical/fetchProcedures",
  async (
    {
      facilityId,
      patientId,
      status,
    }: { facilityId: string; patientId?: string; status?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<Procedure[]>>(
        `/companies/${facilityId}/clinical/procedures`,
        { params: { patientId, status } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load procedures"));
    }
  },
);

export const addProcedure = createAsyncThunk(
  "clinical/addProcedure",
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
        name: string;
        code?: string;
        category?: string;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<Procedure>>(
        `/companies/${facilityId}/clinical/procedures`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not add procedure"));
    }
  },
);

export const updateProcedure = createAsyncThunk(
  "clinical/updateProcedure",
  async (
    {
      facilityId,
      id,
      payload,
    }: {
      facilityId: string;
      id: string;
      payload: { status?: string; notes?: string; performedAt?: string };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<Procedure>>(
        `/companies/${facilityId}/clinical/procedures/${id}`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update procedure"));
    }
  },
);

export const fetchPatientTimeline = createAsyncThunk(
  "clinical/fetchTimeline",
  async (
    { facilityId, patientId }: { facilityId: string; patientId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess>(
        `/companies/${facilityId}/clinical/patients/${patientId}/timeline`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load timeline"));
    }
  },
);

const clinicalSlice = createSlice({
  name: "clinical",
  initialState,
  reducers: {
    clearClinicalError(s) {
      s.error = null;
      s.message = null;
    },
    clearCurrentConsultation(s) {
      s.currentConsultation = null;
    },
  },
  extraReducers: (b) => {
    const fail = (s: ClinicalState, a: { payload?: unknown }) => {
      s.listLoading = false;
      s.detailLoading = false;
      s.saving = false;
      s.error = (a.payload as string) || "Request failed";
    };

    b.addCase(fetchConsultations.pending, (s) => {
      s.listLoading = true;
      s.error = null;
    })
      .addCase(fetchConsultations.fulfilled, (s, a) => {
        s.listLoading = false;
        s.consultations = a.payload.data || [];
        s.meta = (a.payload as any).meta || null;
      })
      .addCase(fetchConsultations.rejected, fail);

    b.addCase(fetchConsultation.pending, (s) => {
      s.detailLoading = true;
    })
      .addCase(fetchConsultation.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.currentConsultation = a.payload.data || null;
      })
      .addCase(fetchConsultation.rejected, fail);

    b.addCase(startConsultation.pending, (s) => {
      s.saving = true;
    })
      .addCase(startConsultation.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Consultation started";
        if (a.payload.data) s.consultations = [a.payload.data, ...s.consultations];
      })
      .addCase(startConsultation.rejected, fail);

    b.addCase(updateSoap.pending, (s) => {
      s.saving = true;
    })
      .addCase(updateSoap.fulfilled, (s, a) => {
        s.saving = false;
        s.message = "SOAP note updated";
        if (a.payload.data) {
          s.currentConsultation = a.payload.data;
          const idx = s.consultations.findIndex((c) => c._id === a.payload.data!._id);
          if (idx >= 0) s.consultations[idx] = a.payload.data;
        }
      })
      .addCase(updateSoap.rejected, fail);

    b.addCase(completeConsultation.pending, (s) => {
      s.saving = true;
    })
      .addCase(completeConsultation.fulfilled, (s, a) => {
        s.saving = false;
        s.message = "Consultation completed";
        if (a.payload.data) {
          s.currentConsultation = a.payload.data;
          const idx = s.consultations.findIndex((c) => c._id === a.payload.data!._id);
          if (idx >= 0) s.consultations[idx] = a.payload.data;
        }
      })
      .addCase(completeConsultation.rejected, fail);

    b.addCase(fetchDiagnoses.pending, (s) => {
      s.listLoading = true;
      s.error = null;
    })
      .addCase(fetchDiagnoses.fulfilled, (s, a) => {
        s.listLoading = false;
        s.diagnoses = a.payload.data || [];
      })
      .addCase(fetchDiagnoses.rejected, fail);

    b.addCase(addDiagnosis.pending, (s) => {
      s.saving = true;
    })
      .addCase(addDiagnosis.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Diagnosis added";
        if (a.payload.data) s.diagnoses = [a.payload.data, ...s.diagnoses];
      })
      .addCase(addDiagnosis.rejected, fail);

    b.addCase(updateDiagnosis.fulfilled, (s, a) => {
      s.saving = false;
      s.message = "Diagnosis updated";
      if (a.payload.data) {
        const idx = s.diagnoses.findIndex((d) => d._id === a.payload.data!._id);
        if (idx >= 0) s.diagnoses[idx] = a.payload.data;
      }
    });

    b.addCase(fetchProcedures.pending, (s) => {
      s.listLoading = true;
      s.error = null;
    })
      .addCase(fetchProcedures.fulfilled, (s, a) => {
        s.listLoading = false;
        s.procedures = a.payload.data || [];
      })
      .addCase(fetchProcedures.rejected, fail);

    b.addCase(addProcedure.pending, (s) => {
      s.saving = true;
    })
      .addCase(addProcedure.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Procedure added";
        if (a.payload.data) s.procedures = [a.payload.data, ...s.procedures];
      })
      .addCase(addProcedure.rejected, fail);

    b.addCase(updateProcedure.fulfilled, (s, a) => {
      s.saving = false;
      s.message = "Procedure updated";
      if (a.payload.data) {
        const idx = s.procedures.findIndex((p) => p._id === a.payload.data!._id);
        if (idx >= 0) s.procedures[idx] = a.payload.data;
      }
    });

    b.addCase(fetchPatientTimeline.fulfilled, (s, a) => {
      s.timeline = (a.payload as any).data || [];
    });
  },
});

export const { clearClinicalError, clearCurrentConsultation } = clinicalSlice.actions;
export default clinicalSlice.reducer;
