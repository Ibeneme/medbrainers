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

export interface IConsultationAttachment {
  _id?: string;
  url: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string | Date;
  uploadedBy?: {
    _id: string;
    firstName?: string;
    lastName?: string;
  } | string;
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
  department?: {
    _id: string;
    name?: string;
    code?: string;
    description?: string;
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
  attachments?: IConsultationAttachment[];
  createdAt?: string | Date;
  updatedAt?: Date;
}

export interface CompanyConsultationItem {
  patientId: string;
  patientMrn: string;
  patientName: string;
  patientPhone?: string;
  consultation: IConsultation;
}

export interface VitalRecordItem {
  _id?: string;
  temperatureC?: number;
  spo2?: number;
  pulse?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  respiratoryRate?: number;
  bloodGlucose?: number;
  painScore?: number;
  notes?: string;
  alert?: boolean;
  alertReason?: string;
  alertReasons?: string[];
  recordedAt?: string | Date;
}

export interface CompanyVitalItem {
  patientId: string;
  patientName: string;
  patientMrn: string;
  patientPhone?: string;
  patientGender?: string;
  patientBloodGroup?: string;
  vital: VitalRecordItem;
}

export interface PatientVitalsResponse {
  patientId: string;
  patientMrn: string;
  patientName: string;
  patientPhone?: string;
  patientGender?: string;
  patientBloodGroup?: string;
  vitals: VitalRecordItem[];
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
  companyConsultations: CompanyConsultationItem[];
  companyVitals: CompanyVitalItem[];
  patientVitals: PatientVitalsResponse | null;
  familyView: PatientFamilyResponse | null;
  families: FamilyGroup[];
  alerts: unknown[];
  listLoading: boolean;
  companyConsultationsLoading: boolean;
  companyVitalsLoading: boolean;
  patientVitalsLoading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
  meta: { page: number; limit: number; total: number } | null;
  consultationsMeta: { page: number; limit: number; total: number } | null;
  companyConsultationsMeta: { page: number; limit: number; total: number } | null;
  vitalsMeta: { page: number; limit: number; total: number } | null;
  patientVitalsMeta: { page: number; limit: number; total: number } | null;
}

const initialState: PatientsState = {
  list: [],
  current: null,
  companyConsultations: [],
  companyVitals: [],
  patientVitals: null,
  familyView: null,
  families: [],
  alerts: [],
  listLoading: false,
  companyConsultationsLoading: false,
  companyVitalsLoading: false,
  patientVitalsLoading: false,
  detailLoading: false,
  saving: false,
  error: null,
  message: null,
  meta: null,
  consultationsMeta: null,
  companyConsultationsMeta: null,
  vitalsMeta: null,
  patientVitalsMeta: null,
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

export const fetchCompanyVitals = createAsyncThunk(
  "patients/fetchCompanyVitals",
  async (
    {
      facilityId,
      alertOnly,
      page,
      limit,
    }: {
      facilityId: string;
      alertOnly?: boolean;
      page?: number;
      limit?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.get<
        ApiSuccess<CompanyVitalItem[]> & { role?: string; meta?: PatientsState["vitalsMeta"] }
      >(`/companies/${facilityId}/patients/vitals`, {
        params: {
          alertOnly,
          page,
          limit: limit || 20,
        },
      });
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load company vitals"));
    }
  }
);

export const fetchPatientVitals = createAsyncThunk(
  "patients/fetchPatientVitals",
  async (
    {
      facilityId,
      patientId,
      page,
      limit,
    }: {
      facilityId: string;
      patientId: string;
      page?: number;
      limit?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.get<
        ApiSuccess<PatientVitalsResponse> & { role?: string; meta?: PatientsState["patientVitalsMeta"] }
      >(`/companies/${facilityId}/patients/${patientId}/vitals`, {
        params: { page, limit: limit || 20 },
      });
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load patient vitals"));
    }
  }
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

export const fetchCompanyConsultations = createAsyncThunk(
  "patients/fetchCompanyConsultations",
  async (
    {
      facilityId,
      active,
      status,
      hasTests,
      hasXray,
      hasSurgeries,
      hasDrugs,
      hasAnteNatal,
      page,
      limit,
    }: {
      facilityId: string;
      active?: boolean;
      status?: string;
      hasTests?: boolean;
      hasXray?: boolean;
      hasSurgeries?: boolean;
      hasDrugs?: boolean;
      hasAnteNatal?: boolean;
      page?: number;
      limit?: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<
        ApiSuccess<CompanyConsultationItem[]> & {
          role?: string;
          meta?: PatientsState["companyConsultationsMeta"];
        }
      >(`/companies/${facilityId}/patients/company-consultations`, {
        params: {
          active,
          status,
          hasTests,
          hasXray,
          hasSurgeries,
          hasDrugs,
          hasAnteNatal,
          page,
          limit: limit || 20,
        },
      });
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load company consultations"));
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
      files,
    }: {
      facilityId: string;
      patientId: string;
      payload: {
        consultedAt?: string | Date;
        title: string;
        complaint: string;
        diagnosis?: string;
        icdCode?: string;
        department?: string;
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
      files?: File[] | FileList;
    },
    { rejectWithValue },
  ) => {
    try {
      const formData = new FormData();

      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(
            key,
            typeof value === "object" ? JSON.stringify(value) : (value as string)
          );
        }
      });

      if (files) {
        const fileArray = Array.from(files);
        fileArray.forEach((file) => {
          formData.append("files", file);
        });
      }

      const { data } = await api.post<ApiSuccess<IConsultation> & { role?: string }>(
        `/companies/${facilityId}/patients/${patientId}/consultations`,
        files && files.length > 0 ? formData : payload,
        files && files.length > 0
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : undefined,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not record consultation"));
    }
  },
);

export const addBatchConsultations = createAsyncThunk(
  "patients/addBatchConsultations",
  async (
    {
      facilityId,
      consultations,
    }: {
      facilityId: string;
      consultations: Array<{
        patientId: string;
        payload: {
          consultedAt?: string | Date;
          title: string;
          complaint: string;
          diagnosis?: string;
          icdCode?: string;
          department?: string;
          vitals?: Record<string, any>;
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
          notes?: string;
          summary?: string;
          status?: 'open' | 'completed';
        };
        files?: File[] | FileList;
      }>;
    },
    { rejectWithValue },
  ) => {
    try {
      const results = await Promise.all(
        consultations.map(async ({ patientId, payload, files }) => {
          const formData = new FormData();

          Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              formData.append(
                key,
                typeof value === "object" ? JSON.stringify(value) : (value as string)
              );
            }
          });

          if (files) {
            const fileArray = Array.from(files);
            fileArray.forEach((file) => {
              formData.append("files", file);
            });
          }

          const { data } = await api.post<ApiSuccess<IConsultation>>(
            `/companies/${facilityId}/patients/${patientId}/consultations`,
            files && files.length > 0 ? formData : payload,
            files && files.length > 0
              ? { headers: { "Content-Type": "multipart/form-data" } }
              : undefined,
          );
          return { patientId, response: data };
        }),
      );
      return { success: true, results, message: "Batch consultations recorded successfully" };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not record batch consultations"));
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
        payload, // <-- This sends 'payload' directly as the request body!
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

export const uploadConsultationAttachments = createAsyncThunk(
  "patients/uploadConsultationAttachments",
  async (
    {
      facilityId,
      patientId,
      consultationId,
      files,
    }: {
      facilityId: string;
      patientId: string;
      consultationId: string;
      files: File[] | FileList;
    },
    { rejectWithValue },
  ) => {
    try {
      const formData = new FormData();
      const fileArray = Array.from(files);

      fileArray.forEach((file) => {
        formData.append("files", file);
      });

      const { data } = await api.post<ApiSuccess<IConsultation> & { role?: string }>(
        `/companies/${facilityId}/patients/${patientId}/consultations/${consultationId}/attachments`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not upload consultation attachments"));
    }
  },
);

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
      s.companyConsultationsLoading = false;
      s.companyVitalsLoading = false;
      s.patientVitalsLoading = false;
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

    // --- COMPANY & PATIENT VITALS EXTRA REDUCERS ---
    b.addCase(fetchCompanyVitals.pending, (s) => {
      s.companyVitalsLoading = true;
      s.error = null;
    })
      .addCase(fetchCompanyVitals.fulfilled, (s, a) => {
        s.companyVitalsLoading = false;
        s.companyVitals = a.payload.data || [];
        s.vitalsMeta = (a.payload as any).meta || null;
        updateAuthRole(s, a);
      })
      .addCase(fetchCompanyVitals.rejected, fail);

    b.addCase(fetchPatientVitals.pending, (s) => {
      s.patientVitalsLoading = true;
      s.error = null;
    })
      .addCase(fetchPatientVitals.fulfilled, (s, a) => {
        s.patientVitalsLoading = false;
        s.patientVitals = a.payload.data || null;
        s.patientVitalsMeta = (a.payload as any).meta || null;
        updateAuthRole(s, a);
      })
      .addCase(fetchPatientVitals.rejected, fail);

    // --- CONSULTATION EXTRA REDUCERS ---
    b.addCase(fetchConsultations.fulfilled, (s, a) => {
      if (s.current) {
        s.current.consultations = a.payload.data || [];
      }
      s.consultationsMeta = (a.payload as any).meta || null;
      updateAuthRole(s, a);
    })
      .addCase(fetchCompanyConsultations.pending, (s) => {
        s.companyConsultationsLoading = true;
        s.error = null;
      })
      .addCase(fetchCompanyConsultations.fulfilled, (s, a) => {
        s.companyConsultationsLoading = false;
        s.companyConsultations = a.payload.data || [];
        s.companyConsultationsMeta = (a.payload as any).meta || null;
        updateAuthRole(s, a);
      })
      .addCase(fetchCompanyConsultations.rejected, fail)
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
      .addCase(addBatchConsultations.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(addBatchConsultations.fulfilled, (s, a) => {
        s.saving = false;
        s.message = (a.payload as any).message || "Batch consultations recorded";
        updateAuthRole(s, a);
      })
      .addCase(addBatchConsultations.rejected, fail)
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
      })
      .addCase(uploadConsultationAttachments.pending, (s) => {
        s.saving = true;
        s.error = null;
      })
      .addCase(uploadConsultationAttachments.fulfilled, (s, a) => {
        s.saving = false;
        s.message = (a.payload as any).message || "Attachments uploaded";
        if (s.current && s.current.consultations && a.payload.data) {
          const updated = a.payload.data;
          s.current.consultations = s.current.consultations.map((c) =>
            c._id === updated._id ? updated : c
          );
        }
        updateAuthRole(s, a);
      })
      .addCase(uploadConsultationAttachments.rejected, fail);

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