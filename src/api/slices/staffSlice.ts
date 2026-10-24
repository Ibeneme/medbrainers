import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";
import type {
  CreateOnCallPayload,
  CreateShiftPayload,
  OnCallEntry,
  ShiftRosterEntry,
  StaffDirectoryMember,
  UpdateStaffCredentialsPayload,
} from "../types";

export interface StaffState {
  directory: StaffDirectoryMember[];
  directoryLoading: boolean;
  shifts: ShiftRosterEntry[];
  shiftsLoading: boolean;
  onCall: OnCallEntry[];
  onCallLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: StaffState = {
  directory: [],
  directoryLoading: false,
  shifts: [],
  shiftsLoading: false,
  onCall: [],
  onCallLoading: false,
  saving: false,
  error: null,
  message: null,
};

export const fetchStaffDirectory = createAsyncThunk(
  "staff/fetchDirectory",
  async (
    {
      facilityId,
      role,
      department,
      search,
    }: { facilityId: string; role?: string; department?: string; search?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<StaffDirectoryMember[]>>(
        `/companies/${facilityId}/staff/directory`,
        { params: { role, department, search } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load staff directory"));
    }
  },
);

export const updateStaffCredentials = createAsyncThunk(
  "staff/updateCredentials",
  async (
    {
      facilityId,
      memberId,
      payload,
    }: { facilityId: string; memberId: string; payload: UpdateStaffCredentialsPayload },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess>(
        `/companies/${facilityId}/staff/members/${memberId}/credentials`,
        payload,
      );
      return { ...data, memberId };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update credentials"));
    }
  },
);

export const fetchShifts = createAsyncThunk(
  "staff/fetchShifts",
  async (
    {
      facilityId,
      from,
      to,
      userId,
    }: { facilityId: string; from?: string; to?: string; userId?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<ShiftRosterEntry[]>>(
        `/companies/${facilityId}/staff/roster`,
        { params: { from, to, userId } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load roster"));
    }
  },
);

export const createShift = createAsyncThunk(
  "staff/createShift",
  async (
    { facilityId, payload }: { facilityId: string; payload: CreateShiftPayload },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<ShiftRosterEntry>>(
        `/companies/${facilityId}/staff/roster`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not create shift"));
    }
  },
);

export const updateShift = createAsyncThunk(
  "staff/updateShift",
  async (
    {
      facilityId,
      shiftId,
      payload,
    }: { facilityId: string; shiftId: string; payload: Partial<CreateShiftPayload> & { status?: string } },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<ShiftRosterEntry>>(
        `/companies/${facilityId}/staff/roster/${shiftId}`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update shift"));
    }
  },
);

export const deleteShift = createAsyncThunk(
  "staff/deleteShift",
  async (
    { facilityId, shiftId }: { facilityId: string; shiftId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.delete<ApiSuccess>(
        `/companies/${facilityId}/staff/roster/${shiftId}`,
      );
      return { ...data, shiftId };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not delete shift"));
    }
  },
);

export const fetchOnCall = createAsyncThunk(
  "staff/fetchOnCall",
  async (
    {
      facilityId,
      from,
      to,
      userId,
    }: { facilityId: string; from?: string; to?: string; userId?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<OnCallEntry[]>>(
        `/companies/${facilityId}/staff/on-call`,
        { params: { from, to, userId } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load on-call"));
    }
  },
);

export const createOnCall = createAsyncThunk(
  "staff/createOnCall",
  async (
    { facilityId, payload }: { facilityId: string; payload: CreateOnCallPayload },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<OnCallEntry>>(
        `/companies/${facilityId}/staff/on-call`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not create on-call"));
    }
  },
);

export const updateOnCall = createAsyncThunk(
  "staff/updateOnCall",
  async (
    {
      facilityId,
      onCallId,
      payload,
    }: {
      facilityId: string;
      onCallId: string;
      payload: Partial<CreateOnCallPayload> & { status?: string };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<OnCallEntry>>(
        `/companies/${facilityId}/staff/on-call/${onCallId}`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not update on-call"));
    }
  },
);

export const deleteOnCall = createAsyncThunk(
  "staff/deleteOnCall",
  async (
    { facilityId, onCallId }: { facilityId: string; onCallId: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.delete<ApiSuccess>(
        `/companies/${facilityId}/staff/on-call/${onCallId}`,
      );
      return { ...data, onCallId };
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Could not delete on-call"));
    }
  },
);

const staffSlice = createSlice({
  name: "staff",
  initialState,
  reducers: {
    clearStaffError(state) {
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    const pending = (state: StaffState) => {
      state.saving = true;
      state.error = null;
    };
    const rejected = (state: StaffState, action: { payload?: unknown }) => {
      state.saving = false;
      state.directoryLoading = false;
      state.shiftsLoading = false;
      state.onCallLoading = false;
      state.error = (action.payload as string) || "Request failed";
    };

    builder
      .addCase(fetchStaffDirectory.pending, (state) => {
        state.directoryLoading = true;
        state.error = null;
      })
      .addCase(fetchStaffDirectory.fulfilled, (state, action) => {
        state.directoryLoading = false;
        state.directory = action.payload.data || [];
      })
      .addCase(fetchStaffDirectory.rejected, rejected);

    builder
      .addCase(updateStaffCredentials.pending, pending)
      .addCase(updateStaffCredentials.fulfilled, (state, action) => {
        state.saving = false;
        state.message = action.payload.message || "Credentials updated";
        const mid = action.payload.memberId;
        const d = action.payload.data as UpdateStaffCredentialsPayload | undefined;
        if (mid && d) {
          state.directory = state.directory.map((m) =>
            m.id === mid
              ? {
                  ...m,
                  privileges: d.privileges ?? m.privileges,
                  credentials: d.credentials ?? m.credentials,
                  staffCode: d.staffCode ?? m.staffCode,
                  jobTitle: d.jobTitle ?? m.jobTitle,
                }
              : m,
          );
        }
      })
      .addCase(updateStaffCredentials.rejected, rejected);

    builder
      .addCase(fetchShifts.pending, (state) => {
        state.shiftsLoading = true;
      })
      .addCase(fetchShifts.fulfilled, (state, action) => {
        state.shiftsLoading = false;
        state.shifts = action.payload.data || [];
      })
      .addCase(fetchShifts.rejected, rejected);

    builder
      .addCase(createShift.pending, pending)
      .addCase(createShift.fulfilled, (state, action) => {
        state.saving = false;
        state.message = action.payload.message || "Shift created";
        if (action.payload.data) state.shifts = [...state.shifts, action.payload.data];
      })
      .addCase(createShift.rejected, rejected);

    builder
      .addCase(updateShift.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload.data;
        if (updated) {
          const id = updated._id || updated.id;
          state.shifts = state.shifts.map((s) =>
            (s._id || s.id) === id ? updated : s,
          );
        }
      })
      .addCase(deleteShift.fulfilled, (state, action) => {
        state.shifts = state.shifts.filter(
          (s) => (s._id || s.id) !== action.payload.shiftId,
        );
      });

    builder
      .addCase(fetchOnCall.pending, (state) => {
        state.onCallLoading = true;
      })
      .addCase(fetchOnCall.fulfilled, (state, action) => {
        state.onCallLoading = false;
        state.onCall = action.payload.data || [];
      })
      .addCase(fetchOnCall.rejected, rejected);

    builder
      .addCase(createOnCall.pending, pending)
      .addCase(createOnCall.fulfilled, (state, action) => {
        state.saving = false;
        state.message = action.payload.message || "On-call assigned";
        if (action.payload.data) state.onCall = [...state.onCall, action.payload.data];
      })
      .addCase(createOnCall.rejected, rejected);

    builder
      .addCase(updateOnCall.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload.data;
        if (updated) {
          const id = updated._id || updated.id;
          state.onCall = state.onCall.map((r) =>
            (r._id || r.id) === id ? updated : r,
          );
        }
      })
      .addCase(deleteOnCall.fulfilled, (state, action) => {
        state.onCall = state.onCall.filter(
          (r) => (r._id || r.id) !== action.payload.onCallId,
        );
      });
  },
});

export const { clearStaffError } = staffSlice.actions;
export default staffSlice.reducer;
