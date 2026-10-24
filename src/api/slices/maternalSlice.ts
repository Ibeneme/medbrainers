import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

export interface AntenatalRecord {
  _id: string;
  patientId: string | { _id: string; firstName?: string; lastName?: string; mrn?: string };
  lmp?: string;
  edd?: string;
  gravida?: number;
  para?: number;
  riskLevel?: "low" | "medium" | "high";
  status?: "active" | "delivered" | "transferred" | "lost_to_followup";
  visits?: Array<{
    date: string;
    gestationWeeks?: number;
    weight?: number;
    bp?: string;
    fundalHeight?: number;
    fetalHeartRate?: number;
    notes?: string;
    nextVisit?: string;
  }>;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliveryRecord {
  _id: string;
  patientId: string | { _id: string; firstName?: string; lastName?: string; mrn?: string };
  deliveryDate?: string;
  mode?: "svd" | "assisted" | "cs_emergency" | "cs_elective";
  outcome?: "live_birth" | "stillbirth" | "neonatal_death";
  babyGender?: string;
  birthWeight?: number;
  apgar1?: number;
  apgar5?: number;
  complications?: string;
  attendant?: string | { _id: string; firstName?: string; lastName?: string };
  notes?: string;
  createdAt?: string;
}

export interface ImmunizationRecord {
  _id: string;
  patientId: string;
  vaccine: string;
  dose?: string;
  dateGiven?: string;
  nextDue?: string;
  batchNumber?: string;
  givenBy?: string;
  notes?: string;
  createdAt?: string;
}

export interface PediatricMeasurement {
  _id?: string;
  date: string;
  ageMonths?: number;
  weight?: number;
  height?: number;
  headCircumference?: number;
  notes?: string;
}

export interface PediatricChart {
  patientId: string;
  measurements: PediatricMeasurement[];
  immunizationStatus?: string;
}

export interface MaternalState {
  antenatal: AntenatalRecord[];
  deliveries: DeliveryRecord[];
  immunizations: ImmunizationRecord[];
  pediatric: PediatricChart | null;
  listLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: MaternalState = {
  antenatal: [],
  deliveries: [],
  immunizations: [],
  pediatric: null,
  listLoading: false,
  saving: false,
  error: null,
  message: null,
};

export const fetchAntenatal = createAsyncThunk(
  "maternal/fetchAntenatal",
  async (
    { facilityId, status, patientId }: { facilityId: string; status?: string; patientId?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<AntenatalRecord[]>>(
        `/companies/${facilityId}/maternal/antenatal`,
        { params: { status, patientId } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load antenatal records"));
    }
  },
);

export const createAntenatal = createAsyncThunk(
  "maternal/createAntenatal",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        patientId: string;
        lmp?: string;
        edd?: string;
        gravida?: number;
        para?: number;
        riskLevel?: string;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<AntenatalRecord>>(
        `/companies/${facilityId}/maternal/antenatal`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not create antenatal record"));
    }
  },
);

export const addAntenatalVisit = createAsyncThunk(
  "maternal/addVisit",
  async (
    {
      facilityId,
      id,
      payload,
    }: {
      facilityId: string;
      id: string;
      payload: {
        date: string;
        gestationWeeks?: number;
        weight?: number;
        bp?: string;
        fundalHeight?: number;
        fetalHeartRate?: number;
        notes?: string;
        nextVisit?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<AntenatalRecord>>(
        `/companies/${facilityId}/maternal/antenatal/${id}/visits`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not add ANC visit"));
    }
  },
);

export const fetchDeliveries = createAsyncThunk(
  "maternal/fetchDeliveries",
  async (
    { facilityId, patientId }: { facilityId: string; patientId?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<DeliveryRecord[]>>(
        `/companies/${facilityId}/maternal/deliveries`,
        { params: { patientId } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load deliveries"));
    }
  },
);

export const recordDelivery = createAsyncThunk(
  "maternal/recordDelivery",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        patientId: string;
        deliveryDate?: string;
        mode?: string;
        outcome?: string;
        babyGender?: string;
        birthWeight?: number;
        apgar1?: number;
        apgar5?: number;
        complications?: string;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<DeliveryRecord>>(
        `/companies/${facilityId}/maternal/deliveries`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not record delivery"));
    }
  },
);

export const fetchImmunizations = createAsyncThunk(
  "maternal/fetchImmunizations",
  async (
    { facilityId, patientId }: { facilityId: string; patientId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<ImmunizationRecord[]>>(
        `/companies/${facilityId}/maternal/immunizations/${patientId}`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load immunizations"));
    }
  },
);

export const addImmunization = createAsyncThunk(
  "maternal/addImmunization",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        patientId: string;
        vaccine: string;
        dose?: string;
        dateGiven?: string;
        nextDue?: string;
        batchNumber?: string;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<ImmunizationRecord>>(
        `/companies/${facilityId}/maternal/immunizations`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not record immunization"));
    }
  },
);

export const fetchPediatrics = createAsyncThunk(
  "maternal/fetchPediatrics",
  async (
    { facilityId, patientId }: { facilityId: string; patientId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<PediatricChart>>(
        `/companies/${facilityId}/maternal/pediatrics/${patientId}`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load pediatric chart"));
    }
  },
);

export const addPediatricMeasurement = createAsyncThunk(
  "maternal/addMeasurement",
  async (
    {
      facilityId,
      patientId,
      payload,
    }: {
      facilityId: string;
      patientId: string;
      payload: {
        date: string;
        ageMonths?: number;
        weight?: number;
        height?: number;
        headCircumference?: number;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<PediatricChart>>(
        `/companies/${facilityId}/maternal/pediatrics/${patientId}/measurements`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not add measurement"));
    }
  },
);

const maternalSlice = createSlice({
  name: "maternal",
  initialState,
  reducers: {
    clearMaternalError(s) {
      s.error = null;
      s.message = null;
    },
  },
  extraReducers: (b) => {
    const fail = (s: MaternalState, a: { payload?: unknown }) => {
      s.listLoading = false;
      s.saving = false;
      s.error = (a.payload as string) || "Request failed";
    };

    b.addCase(fetchAntenatal.pending, (s) => {
      s.listLoading = true;
      s.error = null;
    })
      .addCase(fetchAntenatal.fulfilled, (s, a) => {
        s.listLoading = false;
        s.antenatal = a.payload.data || [];
      })
      .addCase(fetchAntenatal.rejected, fail);

    b.addCase(createAntenatal.pending, (s) => {
      s.saving = true;
    })
      .addCase(createAntenatal.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Antenatal record created";
        if (a.payload.data) s.antenatal = [a.payload.data, ...s.antenatal];
      })
      .addCase(createAntenatal.rejected, fail);

    b.addCase(addAntenatalVisit.fulfilled, (s, a) => {
      s.saving = false;
      s.message = "Visit recorded";
      if (a.payload.data) {
        const idx = s.antenatal.findIndex((r) => r._id === a.payload.data!._id);
        if (idx >= 0) s.antenatal[idx] = a.payload.data;
      }
    });

    b.addCase(fetchDeliveries.pending, (s) => {
      s.listLoading = true;
    })
      .addCase(fetchDeliveries.fulfilled, (s, a) => {
        s.listLoading = false;
        s.deliveries = a.payload.data || [];
      })
      .addCase(fetchDeliveries.rejected, fail);

    b.addCase(recordDelivery.pending, (s) => {
      s.saving = true;
    })
      .addCase(recordDelivery.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Delivery recorded";
        if (a.payload.data) s.deliveries = [a.payload.data, ...s.deliveries];
      })
      .addCase(recordDelivery.rejected, fail);

    b.addCase(fetchImmunizations.fulfilled, (s, a) => {
      s.immunizations = a.payload.data || [];
    });

    b.addCase(addImmunization.pending, (s) => {
      s.saving = true;
    })
      .addCase(addImmunization.fulfilled, (s, a) => {
        s.saving = false;
        s.message = a.payload.message || "Immunization recorded";
        if (a.payload.data) s.immunizations = [a.payload.data, ...s.immunizations];
      })
      .addCase(addImmunization.rejected, fail);

    b.addCase(fetchPediatrics.fulfilled, (s, a) => {
      s.pediatric = a.payload.data || null;
    });

    b.addCase(addPediatricMeasurement.fulfilled, (s, a) => {
      s.saving = false;
      s.message = "Measurement added";
      s.pediatric = a.payload.data || null;
    });
  },
});

export const { clearMaternalError } = maternalSlice.actions;
export default maternalSlice.reducer;
