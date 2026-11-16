import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";
import type {
  Admission,
  AdmissionPriority,
  AdmissionRequest,
  AdmissionRequestStatus,
  BedStatus,
  DischargeSummary,
  NursingCarePlan,
  Ward,
} from "../types";

export interface WardsState {
  wards: Ward[];
  admissions: Admission[];
  requests: AdmissionRequest[];
  /** Number of pending admission requests (for sidebar / header badges). */
  pendingRequests: number;
  carePlans: NursingCarePlan[];
  discharges: DischargeSummary[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: WardsState = {
  wards: [],
  admissions: [],
  requests: [],
  pendingRequests: 0,
  carePlans: [],
  discharges: [],
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
        floor?: string;
        department?: string;
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

export const addBedsToWard = createAsyncThunk(
  "wards/addBeds",
  async (
    {
      facilityId,
      wardId,
      beds,
    }: { facilityId: string; wardId: string; beds: Array<{ code: string; label?: string }> },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<Ward>>(
        `/companies/${facilityId}/wards/${wardId}/beds`,
        { beds },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not add beds"));
    }
  },
);

export const removeBedsFromWard = createAsyncThunk(
  "wards/removeBeds",
  async (
    {
      facilityId,
      wardId,
      bedCodes,
    }: { facilityId: string; wardId: string; bedCodes: string[] },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.delete<ApiSuccess<Ward>>(
        `/companies/${facilityId}/wards/${wardId}/beds`,
        { data: { bedCodes } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not remove beds"));
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

export const fetchDischarges = createAsyncThunk(
  "wards/fetchDischarges",
  async (
    { facilityId, patientId }: { facilityId: string; patientId?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<DischargeSummary[]>>(
        `/companies/${facilityId}/wards/discharges`,
        { params: { patientId } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load discharge summaries"));
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
        startDate?: string; // Add this
        endDate?: string;   // Add this
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

export const updateCarePlan = createAsyncThunk(
  "wards/updateCarePlan",
  async (
    {
      facilityId,
      planId,
      payload,
    }: {
      facilityId: string;
      planId: string;
      payload: Partial<{
        status: "active" | "completed" | "discontinued";
        goals: string[];
        interventions: Array<{ description: string; frequency?: string; completed?: boolean }>;
        notes: string;
      }>;
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<NursingCarePlan>>(
        `/companies/${facilityId}/wards/care-plans/${planId}`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update care plan"));
    }
  },
);

/* ----------------------- admission requests (doctor → wards) ----------------------- */

export const fetchAdmissionRequests = createAsyncThunk(
  "wards/fetchAdmissionRequests",
  async (
    { facilityId, status }: { facilityId: string; status?: AdmissionRequestStatus },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<
        ApiSuccess<AdmissionRequest[]> & { meta?: { pending: number } }
      >(`/companies/${facilityId}/wards/admission-requests`, { params: { status } });
      return { ...data, status: status || "pending" };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load admission requests"));
    }
  },
);

export const createAdmissionRequest = createAsyncThunk(
  "wards/createAdmissionRequest",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        patientId: string;
        consultationId?: string;
        priority?: AdmissionPriority;
        reason: string;
        admittingDiagnosis?: string;
        preferredWardType?: string;
        isolationRequired?: boolean;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<AdmissionRequest>>(
        `/companies/${facilityId}/wards/admission-requests`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not send admission request"));
    }
  },
);

export const acceptAdmissionRequest = createAsyncThunk(
  "wards/acceptAdmissionRequest",
  async (
    {
      facilityId,
      requestId,
      payload,
    }: {
      facilityId: string;
      requestId: string;
      payload: { wardId: string; bedCode: string; attendingPhysician?: string; notes?: string };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess>(
        `/companies/${facilityId}/wards/admission-requests/${requestId}/accept`,
        payload,
      );
      return { ...data, requestId };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not accept request"));
    }
  },
);

export const rejectAdmissionRequest = createAsyncThunk(
  "wards/rejectAdmissionRequest",
  async (
    { facilityId, requestId, reason }: { facilityId: string; requestId: string; reason: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess>(
        `/companies/${facilityId}/wards/admission-requests/${requestId}/reject`,
        { reason },
      );
      return { ...data, requestId };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not decline request"));
    }
  },
);

export const cancelAdmissionRequest = createAsyncThunk(
  "wards/cancelAdmissionRequest",
  async (
    { facilityId, requestId }: { facilityId: string; requestId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess>(
        `/companies/${facilityId}/wards/admission-requests/${requestId}/cancel`,
      );
      return { ...data, requestId };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not cancel request"));
    }
  },
);

export const updateBedStatus = createAsyncThunk(
  "wards/updateBedStatus",
  async (
    {
      facilityId,
      wardId,
      bedCode,
      status,
    }: { facilityId: string; wardId: string; bedCode: string; status: BedStatus },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess>(
        `/companies/${facilityId}/wards/${wardId}/beds/${encodeURIComponent(bedCode)}`,
        { status },
      );
      return { ...data, wardId, bedCode, status };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update bed"));
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

    b.addCase(createWard.pending, (s) => {
      s.saving = true;
      s.error = null;
    }).addCase(createWard.rejected, fail);

    b.addCase(createWard.fulfilled, (s, a) => {
      s.saving = false;
      s.message = a.payload.message || "Ward created";
      if (a.payload.data) s.wards = [...s.wards, a.payload.data];
    });

    b.addCase(addBedsToWard.fulfilled, (s, a) => {
      s.message = a.payload.message || "Beds added";
    }).addCase(addBedsToWard.rejected, fail);

    b.addCase(removeBedsFromWard.pending, (s) => {
      s.saving = true;
      s.error = null;
    })
      .addCase(removeBedsFromWard.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Beds removed";
        if (a.payload.data) {
          const idx = s.wards.findIndex((w) => w._id === a.payload.data!._id);
          if (idx !== -1) s.wards[idx] = a.payload.data;
        }
      })
      .addCase(removeBedsFromWard.rejected, fail);

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

    b.addCase(fetchAdmissionRequests.fulfilled, (s, a) => {
      s.requests = a.payload.data || [];
      if (a.payload.status === "pending") {
        s.pendingRequests = a.payload.meta?.pending ?? s.requests.length;
      } else if (a.payload.meta) {
        s.pendingRequests = a.payload.meta.pending;
      }
    });

    b.addCase(createAdmissionRequest.fulfilled, (s, a) => {
      s.saving = false;
      s.message = a.payload.message || "Admission request sent";
      s.pendingRequests += 1;
    });

    b.addCase(acceptAdmissionRequest.pending, (s) => {
      s.saving = true;
      s.error = null;
    })
      .addCase(acceptAdmissionRequest.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Request accepted";
        s.requests = s.requests.filter((r) => r._id !== a.payload.requestId);
        s.pendingRequests = Math.max(0, s.pendingRequests - 1);
      })
      .addCase(acceptAdmissionRequest.rejected, fail);

    b.addCase(rejectAdmissionRequest.pending, (s) => {
      s.saving = true;
      s.error = null;
    })
      .addCase(rejectAdmissionRequest.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Request declined";
        s.requests = s.requests.filter((r) => r._id !== a.payload.requestId);
        s.pendingRequests = Math.max(0, s.pendingRequests - 1);
      })
      .addCase(rejectAdmissionRequest.rejected, fail);

    b.addCase(cancelAdmissionRequest.fulfilled, (s, a) => {
      s.message = a.payload.message || "Request cancelled";
      s.requests = s.requests.filter((r) => r._id !== a.payload.requestId);
      s.pendingRequests = Math.max(0, s.pendingRequests - 1);
    });

    b.addCase(updateBedStatus.fulfilled, (s, a) => {
      s.message = a.payload.message || "Bed updated";
      const ward = s.wards.find((w) => w._id === a.payload.wardId);
      const bed = ward?.beds?.find(
        (x) =>
          x.code === a.payload.bedCode ||
          x.code.toLowerCase() === a.payload.bedCode.toLowerCase()
      );
      if (bed) bed.status = a.payload.status;
    })
    b.addCase(updateBedStatus.rejected, fail);

    b.addCase(fetchCarePlans.fulfilled, (s, a) => {
      s.loading = false;
      s.carePlans = a.payload.data || [];
    });

    b.addCase(fetchDischarges.pending, (s) => {
      s.loading = true;
    })
      .addCase(fetchDischarges.fulfilled, (s, a) => {
        s.loading = false;
        s.discharges = a.payload.data || [];
      })
      .addCase(fetchDischarges.rejected, fail);

    b.addCase(fetchCarePlans.pending, (s) => {
      s.loading = true;
    }).addCase(fetchCarePlans.rejected, fail);

    b.addCase(updateCarePlan.fulfilled, (s, a) => {
      s.message = a.payload.message || "Care plan updated";
      if (a.payload.data) {
        const u = a.payload.data;
        s.carePlans = s.carePlans.map((c) =>
          c._id === u._id ? { ...c, ...u, patient: c.patient, assignedNurse: c.assignedNurse } : c,
        );
      }
    });

    b.addCase(createCarePlan.fulfilled, (s, a) => {
      s.message = a.payload.message || "Care plan created";
      if (a.payload.data) s.carePlans = [a.payload.data, ...s.carePlans];
    });
  },
});

export const { clearWardsError } = wardsSlice.actions;
export default wardsSlice.reducer;