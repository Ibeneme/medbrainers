import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";
import type { Admission, NursingCarePlan, Ward } from "../types";

export interface WardsState {
  wards: Ward[];
  admissions: Admission[];
  carePlans: NursingCarePlan[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: WardsState = {
  wards: [],
  admissions: [],
  carePlans: [],
  loading: false,
  saving: false,
  error: null,
  message: null,
};

export const fetchWards = createAsyncThunk(
  "wards/fetch",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<Ward[]>>(`/companies/${facilityId}/wards`);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load wards"));
    }
  },
);

export const createWard = createAsyncThunk(
  "wards/create",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        name: string;
        code: string;
        type?: string;
        beds?: Array<{ code: string; label?: string }>;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<Ward>>(
        `/companies/${facilityId}/wards`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not create ward"));
    }
  },
);

export const fetchAdmissions = createAsyncThunk(
  "wards/fetchAdmissions",
  async (
    { facilityId, status }: { facilityId: string; status?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<Admission[]>>(
        `/companies/${facilityId}/wards/admissions`,
        { params: { status } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load admissions"));
    }
  },
);

export const admitPatient = createAsyncThunk(
  "wards/admit",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        patientId: string;
        wardId: string;
        bedCode: string;
        admittingDiagnosis?: string;
        reason?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<Admission>>(
        `/companies/${facilityId}/wards/admissions`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Admission failed"));
    }
  },
);

export const transferPatient = createAsyncThunk(
  "wards/transfer",
  async (
    {
      facilityId,
      admissionId,
      payload,
    }: {
      facilityId: string;
      admissionId: string;
      payload: { toWardId: string; toBedCode: string; reason?: string };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess>(
        `/companies/${facilityId}/wards/admissions/${admissionId}/transfer`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Transfer failed"));
    }
  },
);

export type DischargeMedicationInput = {
  drugName: string;
  dose?: string;
  route?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  quantity?: number;
};

export type DischargeReferralInput = {
  type: "lab" | "imaging" | "specialist" | "physiotherapy" | "other";
  department?: string;
  reason: string;
  priority?: "routine" | "urgent" | "stat";
  referredTo?: string;
  notes?: string;
};

export type DischargeSurgeryInput = {
  procedure: string;
  plannedDate?: string;
  surgeonId?: string;
  theater?: string;
  notes?: string;
};

export type DischargePayload = {
  diagnosis?: string;
  secondaryDiagnoses?: string[];
  procedures?: string;
  hospitalCourse?: string;
  conditionOnDischarge?: string;
  medicationsOnDischarge?: string;
  dischargeMedications?: DischargeMedicationInput[];
  followUpInstructions?: string;
  diet?: string;
  activity?: string;
  warnings?: string;
  referrals?: DischargeReferralInput[];
  surgeryBookings?: DischargeSurgeryInput[];
  disposition?: "home" | "transfer" | "against_medical_advice" | "deceased" | "other";
  transferToFacility?: string;
  followUpDate?: string;
  followUpProvider?: string;
  notes?: string;
};

export const dischargePatient = createAsyncThunk(
  "wards/discharge",
  async (
    {
      facilityId,
      admissionId,
      payload,
    }: { facilityId: string; admissionId: string; payload: DischargePayload },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess>(
        `/companies/${facilityId}/wards/admissions/${admissionId}/discharge`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Discharge failed"));
    }
  },
);

export const fetchPatientDischarges = createAsyncThunk(
  "wards/fetchPatientDischarges",
  async (
    { facilityId, patientId }: { facilityId: string; patientId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess>(
        `/companies/${facilityId}/wards/patients/${patientId}/discharges`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load discharges"));
    }
  },
);

export const fetchDischargeSummary = createAsyncThunk(
  "wards/fetchDischargeSummary",
  async (
    { facilityId, summaryId }: { facilityId: string; summaryId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess>(
        `/companies/${facilityId}/wards/discharges/${summaryId}`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load discharge summary"));
    }
  },
);

export const fetchCarePlans = createAsyncThunk(
  "wards/fetchCarePlans",
  async (
    { facilityId, patientId }: { facilityId: string; patientId?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<NursingCarePlan[]>>(
        `/companies/${facilityId}/wards/care-plans`,
        { params: { patientId } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load care plans"));
    }
  },
);

export const createCarePlan = createAsyncThunk(
  "wards/createCarePlan",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        patientId: string;
        diagnosis?: string;
        goals?: string[];
        interventions?: Array<{ description: string; frequency?: string }>;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<NursingCarePlan>>(
        `/companies/${facilityId}/wards/care-plans`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not create care plan"));
    }
  },
);

const wardsSlice = createSlice({
  name: "wards",
  initialState,
  reducers: {
    clearWardsError(s) {
      s.error = null;
      s.message = null;
    },
  },
  extraReducers: (b) => {
    const fail = (s: WardsState, a: { payload?: unknown }) => {
      s.loading = false;
      s.saving = false;
      s.error = (a.payload as string) || "Request failed";
    };

    b.addCase(fetchWards.pending, (s) => {
      s.loading = true;
    })
      .addCase(fetchWards.fulfilled, (s, a) => {
        s.loading = false;
        s.wards = a.payload.data || [];
      })
      .addCase(fetchWards.rejected, fail);

    b.addCase(createWard.fulfilled, (s, a) => {
      s.saving = false;
      s.message = a.payload.message || "Ward created";
      if (a.payload.data) s.wards = [...s.wards, a.payload.data];
    });

    b.addCase(fetchAdmissions.fulfilled, (s, a) => {
      s.loading = false;
      s.admissions = a.payload.data || [];
    });

    b.addCase(admitPatient.fulfilled, (s, a) => {
      s.saving = false;
      s.message = a.payload.message || "Admitted";
      if (a.payload.data) s.admissions = [a.payload.data, ...s.admissions];
    })
      .addCase(admitPatient.rejected, fail);

    b.addCase(transferPatient.fulfilled, (s, a) => {
      s.message = a.payload.message || "Transferred";
    });

    b.addCase(dischargePatient.fulfilled, (s, a) => {
      s.message = a.payload.message || "Discharged";
    });

    b.addCase(fetchCarePlans.fulfilled, (s, a) => {
      s.carePlans = a.payload.data || [];
    });

    b.addCase(createCarePlan.fulfilled, (s, a) => {
      s.message = a.payload.message || "Care plan created";
      if (a.payload.data) s.carePlans = [a.payload.data, ...s.carePlans];
    });
  },
});

export const { clearWardsError } = wardsSlice.actions;
export default wardsSlice.reducer;
