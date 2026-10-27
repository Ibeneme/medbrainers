import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

export interface CompanyVitalItem {
    patientId: string;
    patientName: string;
    patientMrn: string;
    patientPhone?: string;
    vital: {
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
        recordedAt?: string | Date;
    };
}

export interface VitalsState {
    companyVitals: CompanyVitalItem[];
    companyVitalsLoading: boolean;
    error: string | null;
    message: string | null;
    meta: { page: number; limit: number; total: number } | null;
}

const initialState: VitalsState = {
    companyVitals: [],
    companyVitalsLoading: false,
    error: null,
    message: null,
    meta: null,
};

export const fetchCompanyVitals = createAsyncThunk(
    "vitals/fetchCompanyVitals",
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
                ApiSuccess<CompanyVitalItem[]> & { role?: string; meta?: VitalsState["meta"] }
            >(`/companies/${facilityId}/vitals`, {
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

const vitalsSlice = createSlice({
    name: "vitals",
    initialState,
    reducers: {
        clearVitalsError(s) {
            s.error = null;
            s.message = null;
        },
    },
    extraReducers: (b) => {
        const fail = (s: VitalsState, a: { payload?: unknown }) => {
            s.companyVitalsLoading = false;
            s.error = (a.payload as string) || "Request failed";
        };

        b.addCase(fetchCompanyVitals.pending, (s) => {
            s.companyVitalsLoading = true;
            s.error = null;
        })
            .addCase(fetchCompanyVitals.fulfilled, (s, a) => {
                s.companyVitalsLoading = false;
                s.companyVitals = a.payload.data || [];
                s.meta = (a.payload as any).meta || null;
            })
            .addCase(fetchCompanyVitals.rejected, fail);
    },
});

export const { clearVitalsError } = vitalsSlice.actions;
export default vitalsSlice.reducer;