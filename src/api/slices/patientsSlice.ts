import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";
import type {
  FamilyGroup,
  Patient,
  PatientFamilyResponse,
  RegisterPatientPayload,
} from "../types";

export interface IRecommendedTest {
  _id?: string;
  catalogId?: string;
  code: string;
  name: string;
  price?: number;
  reason?: string;
  urgency?: 'routine' | 'urgent' | 'stat';
  status?: 'recommended' | 'ordered' | 'completed' | 'cancelled';
}

export interface IRecommendedDrug {
  _id?: string;
  name: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  instructions?: string;
}

export interface IConsultation {
  _id?: string;
  consultedAt: string | Date;
  doctor: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | string;
  title: string;
  complaint: string;
  diagnosis?: string;
  icdCode?: string;
  vitals?: Record<string, any>;
  allergies?: Array<{
    _id?: string;
    substance: string;
    reaction?: string;
    severity?: 'mild' | 'moderate' | 'severe' | 'life_threatening';
    notes?: string;
    notedAt?: string | Date;
  }>;
  recommendedTests: IRecommendedTest[];
  recommendedDrugs: IRecommendedDrug[];
  totalPrice?: number;
  notes?: string;
  summary?: string;
  status: 'open' | 'completed';
  createdAt?: string | Date;
  updatedAt?: Date;
}

export interface ActivityLog {
  _id: string;
  at: string;
  by: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | string;
  action: string;
  details?: string;
}

export interface ConsultationDetailResponse {
  patient: {
    _id: string;
    mrn: string;
    firstName: string;
    lastName: string;
  };
  consultation: IConsultation;
  activityLogs: ActivityLog[];
}

export interface PatientsState {
  list: Patient[];
  current: (Patient & { activityLogs?: ActivityLog[]; consultations?: IConsultation[] }) | null;
  familyView: PatientFamilyResponse | null;
  families: FamilyGroup[];
  alerts: unknown[];
  listLoading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
  meta: { page: number; limit: number; total: number } | null;
  consultationsMeta: { page: number; limit: number; total: number } | null;
}

const initialState: PatientsState = {
  list: [],
  current: null,
  familyView: null,
  families: [],
  alerts: [],
  listLoading: false,
  detailLoading: false,
  saving: false,
  error: null,
  message: null,
  meta: null,
  consultationsMeta: null,
};

export const fetchPatients = createAsyncThunk(
  "patients/fetchList",
  async (
    {
      facilityId,
      search,
      status,
      page,
      limit,
    }: { facilityId: string; search?: string; status?: string; page?: number; limit?: number },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<Patient[]> & { role?: string; meta?: PatientsState["meta"] }>(
        `/companies/${facilityId}/patients`,
        { params: { search, status, page, limit: limit || 100 } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load patients"));
    }
  },
);

export const fetchPatient = createAsyncThunk(
  "patients/fetchOne",
  async (
    { facilityId, patientId }: { facilityId: string; patientId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<Patient> & { role?: string }>(
        `/companies/${facilityId}/patients/${patientId}`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load patient"));
    }
  },
);

export const registerPatient = createAsyncThunk(
  "patients/register",
  async (
    { facilityId, payload }: { facilityId: string; payload: RegisterPatientPayload },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<Patient> & { role?: string }>(
        `/companies/${facilityId}/patients`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Registration failed"));
    }
  },
);

export const updatePatient = createAsyncThunk(
  "patients/update",
  async (
    {
      facilityId,
      patientId,
      payload,
    }: {
      facilityId: string;
      patientId: string;
      payload: Partial<RegisterPatientPayload & { status?: string; primaryPhysician?: string }>;
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<Patient> & { role?: string }>(
        `/companies/${facilityId}/patients/${patientId}`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update patient details"));
    }
  },
);

export const addPatientHistory = createAsyncThunk(
  "patients/addHistory",
  async (
    {
      facilityId,
      patientId,
      payload,
    }: {
      facilityId: string;
      patientId: string;
      payload: { type?: string; title: string; detail?: string; icdCode?: string };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess & { role?: string }>(
        `/companies/${facilityId}/patients/${patientId}/history`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not add chart entry"));
    }
  },
);

export const addPatientAllergy = createAsyncThunk(
  "patients/addAllergy",
  async (
    {
      facilityId,
      patientId,
      payload,
    }: {
      facilityId: string;
      patientId: string;
      payload: { substance: string; reaction?: string; severity?: string; notes?: string };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess & { role?: string }>(
        `/companies/${facilityId}/patients/${patientId}/allergies`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not add allergy"));
    }
  },
);

export const updatePatientAllergy = createAsyncThunk(
  "patients/updateAllergy",
  async (
    {
      facilityId,
      patientId,
      allergyId,
      payload,
    }: {
      facilityId: string;
      patientId: string;
      allergyId: string;
      payload: { substance?: string; reaction?: string; severity?: string; notes?: string };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess & { role?: string }>(
        `/companies/${facilityId}/patients/${patientId}/allergies/${allergyId}`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update allergy"));
    }
  },
);

export const removePatientAllergy = createAsyncThunk(
  "patients/removeAllergy",
  async (
    {
      facilityId,
      patientId,
      allergyId,
    }: { facilityId: string; patientId: string; allergyId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.delete<ApiSuccess & { role?: string }>(
        `/companies/${facilityId}/patients/${patientId}/allergies/${allergyId}`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not remove allergy"));
    }
  },
);

export const addPatientVital = createAsyncThunk(
  "patients/addVital",
  async (
    {
      facilityId,
      patientId,
      payload,
    }: { facilityId: string; patientId: string; payload: Record<string, number | string> },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess & { role?: string }>(
        `/companies/${facilityId}/patients/${patientId}/vitals`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not record vitals"));
    }
  },
);

export const updatePatientVital = createAsyncThunk(
  "patients/updateVital",
  async (
    {
      facilityId,
      patientId,
      vitalId,
      payload,
    }: {
      facilityId: string;
      patientId: string;
      vitalId: string;
      payload: Record<string, number | string>;
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess & { role?: string }>(
        `/companies/${facilityId}/patients/${patientId}/vitals/${vitalId}`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update vital"));
    }
  },
);

export const removePatientVital = createAsyncThunk(
  "patients/removeVital",
  async (
    {
      facilityId,
      patientId,
      vitalId,
    }: { facilityId: string; patientId: string; vitalId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.delete<ApiSuccess & { role?: string }>(
        `/companies/${facilityId}/patients/${patientId}/vitals/${vitalId}`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not remove vital"));
    }
  },
);

// --- CONSULTATION THUNKS ---

export const fetchConsultations = createAsyncThunk(
  "patients/fetchConsultations",
  async (
    {
      facilityId,
      patientId,
      page,
      limit,
    }: { facilityId: string; patientId: string; page?: number; limit?: number },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<IConsultation[]> & { role?: string; meta?: PatientsState["consultationsMeta"] }>(
        `/companies/${facilityId}/patients/${patientId}/consultations`,
        { params: { page, limit: limit || 10 } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load consultations"));
    }
  },
);

export const fetchConsultationbyId = createAsyncThunk(
  "clinical/fetchConsultationbyId",
  async (
    {
      facilityId,
      patientId,
      consultationId,
    }: { facilityId: string; patientId: string; consultationId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<ConsultationDetailResponse>>(
        `/companies/${facilityId}/patients/${patientId}/consultations/${consultationId}`
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load consultation"));
    }
  },
);

export const addConsultation = createAsyncThunk(
  "patients/addConsultation",
  async (
    {
      facilityId,
      patientId,
      payload,
    }: {
      facilityId: string;
      patientId: string;
      payload: {
        consultedAt?: string | Date;
        title: string;
        complaint: string;
        diagnosis?: string;
        icdCode?: string;
        vitals?: Record<string, any>;
        allergies?: Array<{ substance: string; reaction?: string; severity?: string; notes?: string }>;
        recommendedTests?: Array<{
          catalogId?: string;
          code: string;
          name: string;
          price?: number;
          reason?: string;
          urgency?: string;
        }>;
        recommendedDrugs?: Array<{
          name: string;
          dosage?: string;
          frequency?: string;
          route?: string;
          duration?: string;
          instructions?: string;
        }>;
        totalPrice?: number;
        notes?: string;
        summary?: string;
        status?: 'open' | 'completed';
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<IConsultation> & { role?: string }>(
        `/companies/${facilityId}/patients/${patientId}/consultations`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not record consultation"));
    }
  },
);

export const updateConsultation = createAsyncThunk(
  "patients/updateConsultation",
  async (
    {
      facilityId,
      patientId,
      consultationId,
      payload,
    }: {
      facilityId: string;
      patientId: string;
      consultationId: string;
      payload: Partial<IConsultation>;
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<IConsultation> & { role?: string }>(
        `/companies/${facilityId}/patients/${patientId}/consultations/${consultationId}`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update consultation"));
    }
  },
);

export const removeConsultation = createAsyncThunk(
  "patients/removeConsultation",
  async (
    {
      facilityId,
      patientId,
      consultationId,
    }: { facilityId: string; patientId: string; consultationId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.delete<ApiSuccess & { role?: string }>(
        `/companies/${facilityId}/patients/${patientId}/consultations/${consultationId}`,
      );
      return { ...data, consultationId };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not remove consultation"));
    }
  },
);

// --- END CONSULTATION THUNKS ---

export const addPatientFamily = createAsyncThunk(
  "patients/addFamily",
  async (
    {
      facilityId,
      patientId,
      payload,
    }: {
      facilityId: string;
      patientId: string;
      payload: {
        name: string;
        relationship: string;
        phone?: string;
        countryCode?: string;
        isEmergencyContact?: boolean;
        patientRef?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess & { role?: string }>(
        `/companies/${facilityId}/patients/${patientId}/family`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not add family member"));
    }
  },
);

export const fetchVitalAlerts = createAsyncThunk(
  "patients/fetchAlerts",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess & { role?: string }>(
        `/companies/${facilityId}/patients/alerts/vitals`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load alerts"));
    }
  },
);

export const fetchPatientFamily = createAsyncThunk(
  "patients/fetchFamily",
  async (
    { facilityId, patientId }: { facilityId: string; patientId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<PatientFamilyResponse> & { role?: string }>(
        `/companies/${facilityId}/patients/${patientId}/family`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load family"));
    }
  },
);

export const linkPatientsAsFamily = createAsyncThunk(
  "patients/linkFamily",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        patientIds: string[];
        name?: string;
        headPatientId?: string;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<FamilyGroup> & { role?: string }>(
        `/companies/${facilityId}/patients/families/link`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not link family"));
    }
  },
);

/** Alias used by patient detail page */
export const linkFamily = linkPatientsAsFamily;

export const fetchFamilies = createAsyncThunk(
  "patients/fetchFamilies",
  async (
    { facilityId, search }: { facilityId: string; search?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<FamilyGroup[]> & { role?: string }>(
        `/companies/${facilityId}/patients/families`,
        { params: { search } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load families"));
    }
  },
);

export const removeFromFamilyGroup = createAsyncThunk(
  "patients/removeFromFamily",
  async (
    { facilityId, patientId }: { facilityId: string; patientId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.delete<ApiSuccess & { role?: string }>(
        `/companies/${facilityId}/patients/${patientId}/family-group`,
      );
      return { ...data, patientId };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not remove from family"));
    }
  },
);

const patientsSlice = createSlice({
  name: "patients",
  initialState,
  reducers: {
    clearPatientsError(s) {
      s.error = null;
      s.message = null;
    },
    clearCurrentPatient(s) {
      s.current = null;
    },
  },
  extraReducers: (b) => {
    const fail = (s: PatientsState, a: { payload?: unknown }) => {
      s.listLoading = false;
      s.detailLoading = false;
      s.saving = false;
      s.error = (a.payload as string) || "Request failed";
    };

    const updateAuthRole = (state: any, action: any) => {
      const newRole = action.payload?.role;
      if (newRole && state?.auth?.user) {
        state.auth.user.role = newRole;
      }
    };

    b.addCase(fetchPatients.pending, (s) => {
      s.listLoading = true;
      s.error = null;
    })
      .addCase(fetchPatients.fulfilled, (s, a) => {
        s.listLoading = false;
        s.list = a.payload.data || [];
        s.meta = (a.payload as any).meta || null;
        updateAuthRole(s, a);
      })
      .addCase(fetchPatients.rejected, fail);

    b.addCase(fetchPatient.pending, (s) => {
      s.detailLoading = true;
    })
      .addCase(fetchPatient.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.current = a.payload.data || null;
        updateAuthRole(s, a);
      })
      .addCase(fetchPatient.rejected, fail);

    b.addCase(registerPatient.pending, (s) => {
      s.saving = true;
    })
      .addCase(registerPatient.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Patient registered";
        if (a.payload.data) s.list = [a.payload.data, ...s.list];
        updateAuthRole(s, a);
      })
      .addCase(registerPatient.rejected, fail);

    b.addCase(updatePatient.pending, (s) => {
      s.saving = true;
    })
      .addCase(updatePatient.fulfilled, (s, a) => {
        s.saving = false;
        s.message = (a.payload as any).message || "Patient updated";
        if (a.payload.data) {
          const updatedPatient = a.payload.data;
          if (s.current && s.current._id === updatedPatient._id) {
            s.current = { ...s.current, ...updatedPatient };
          }
          s.list = s.list.map((p) => (p._id === updatedPatient._id ? updatedPatient : p));
        }
        updateAuthRole(s, a);
      })
      .addCase(updatePatient.rejected, fail);

    b.addCase(addPatientHistory.fulfilled, (s, a) => {
      s.saving = false;
      s.message = "Chart entry added";
      updateAuthRole(s, a);
    })
      .addCase(addPatientAllergy.fulfilled, (s, a) => {
        s.saving = false;
        s.message = "Allergy recorded";
        updateAuthRole(s, a);
      })
      .addCase(updatePatientAllergy.fulfilled, (s, a) => {
        s.saving = false;
        s.message = "Allergy updated";
        updateAuthRole(s, a);
      })
      .addCase(removePatientAllergy.fulfilled, (s, a) => {
        s.saving = false;
        s.message = "Allergy removed";
        updateAuthRole(s, a);
      })
      .addCase(addPatientVital.fulfilled, (s, a) => {
        s.saving = false;
        s.message = (a.payload as any).message || "Vital recorded";
        updateAuthRole(s, a);
      })
      .addCase(updatePatientVital.fulfilled, (s, a) => {
        s.saving = false;
        s.message = (a.payload as any).message || "Vital updated";
        updateAuthRole(s, a);
      })
      .addCase(removePatientVital.fulfilled, (s, a) => {
        s.saving = false;
        s.message = (a.payload as any).message || "Vital removed";
        updateAuthRole(s, a);
      })
      .addCase(addPatientFamily.fulfilled, (s, a) => {
        s.saving = false;
        s.message = "Family member added";
        updateAuthRole(s, a);
      });

    // --- CONSULTATION EXTRA REDUCERS ---
    b.addCase(fetchConsultations.fulfilled, (s, a) => {
      if (s.current) {
        s.current.consultations = a.payload.data || [];
      }
      s.consultationsMeta = (a.payload as any).meta || null;
      updateAuthRole(s, a);
    })
      .addCase(fetchConsultationbyId.pending, (s) => {
        s.detailLoading = true;
      })
      .addCase(fetchConsultationbyId.fulfilled, (s, a) => {
        s.detailLoading = false;
        if (a.payload.data) {
          const { patient, consultation, activityLogs } = a.payload.data;
          if (!s.current || s.current._id !== patient._id) {
            s.current = { ...patient, consultations: [consultation], activityLogs } as any;
          } else {
            s.current.activityLogs = activityLogs;
            const exists = s.current.consultations?.some((c) => c._id === consultation._id);
            if (exists) {
              s.current.consultations = s.current.consultations?.map((c) =>
                c._id === consultation._id ? consultation : c
              );
            } else {
              s.current.consultations = [consultation, ...(s.current.consultations || [])];
            }
          }
        }
        updateAuthRole(s, a);
      })
      .addCase(fetchConsultationbyId.rejected, fail)
      .addCase(addConsultation.pending, (s) => {
        s.saving = true;
      })
      .addCase(addConsultation.fulfilled, (s, a) => {
        s.saving = false;
        s.message = (a.payload as any).message || "Consultation recorded";
        if (s.current && a.payload.data) {
          if (!s.current.consultations) s.current.consultations = [];
          s.current.consultations = [a.payload.data, ...s.current.consultations];
        }
        updateAuthRole(s, a);
      })
      .addCase(addConsultation.rejected, fail)
      .addCase(updateConsultation.pending, (s) => {
        s.saving = true;
      })
      .addCase(updateConsultation.fulfilled, (s, a) => {
        s.saving = false;
        s.message = (a.payload as any).message || "Consultation updated";
        if (s.current && s.current.consultations && a.payload.data) {
          const updated = a.payload.data;
          s.current.consultations = s.current.consultations.map((c) =>
            c._id === updated._id ? updated : c
          );
        }
        updateAuthRole(s, a);
      })
      .addCase(updateConsultation.rejected, fail)
      .addCase(removeConsultation.fulfilled, (s, a) => {
        s.saving = false;
        s.message = "Consultation removed";
        if (s.current && s.current.consultations) {
          const { consultationId } = a.payload as { consultationId: string };
          s.current.consultations = s.current.consultations.filter(
            (c) => c._id !== consultationId
          );
        }
        updateAuthRole(s, a);
      });
    // --- END CONSULTATION EXTRA REDUCERS ---

    b.addCase(fetchVitalAlerts.fulfilled, (s, a) => {
      s.alerts = (a.payload as any).data || [];
      updateAuthRole(s, a);
    });

    b.addCase(fetchPatientFamily.fulfilled, (s, a) => {
      s.familyView = a.payload.data || null;
      updateAuthRole(s, a);
    });

    b.addCase(linkPatientsAsFamily.fulfilled, (s, a) => {
      s.saving = false;
      s.message = a.payload.message || "Family linked";
      if (a.payload.data) {
        const g = a.payload.data;
        const idx = s.families.findIndex((f) => f._id === g._id);
        if (idx >= 0) s.families[idx] = g;
        else s.families = [g, ...s.families];
      }
      updateAuthRole(s, a);
    });

    b.addCase(fetchFamilies.fulfilled, (s, a) => {
      s.families = a.payload.data || [];
      updateAuthRole(s, a);
    });
  },
});

export const { clearPatientsError, clearCurrentPatient } = patientsSlice.actions;
export default patientsSlice.reducer;