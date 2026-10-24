import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";
import type { Appointment, QueueTicket, TriageRecord } from "../types";

export interface AppointmentsState {
  calendar: Appointment[];
  queue: QueueTicket[];
  triage: TriageRecord[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: AppointmentsState = {
  calendar: [],
  queue: [],
  triage: [],
  loading: false,
  saving: false,
  error: null,
  message: null,
};

export const fetchCalendar = createAsyncThunk(
  "appointments/calendar",
  async (
    {
      facilityId,
      from,
      to,
      providerId,
    }: { facilityId: string; from?: string; to?: string; providerId?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<Appointment[]>>(
        `/companies/${facilityId}/appointments/calendar`,
        { params: { from, to, providerId } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load calendar"));
    }
  },
);

export const bookAppointment = createAsyncThunk(
  "appointments/book",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        patientId: string;
        providerId?: string;
        department?: string;
        type?: string;
        startAt: string;
        endAt: string;
        reason?: string;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<Appointment>>(
        `/companies/${facilityId}/appointments`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Booking failed"));
    }
  },
);

export const checkInPatient = createAsyncThunk(
  "appointments/checkIn",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        patientId: string;
        appointmentId?: string;
        department?: string;
        priority?: number;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<QueueTicket>>(
        `/companies/${facilityId}/appointments/check-in`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Check-in failed"));
    }
  },
);

export const fetchQueue = createAsyncThunk(
  "appointments/queue",
  async (
    { facilityId, department }: { facilityId: string; department?: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.get<ApiSuccess<QueueTicket[]>>(
        `/companies/${facilityId}/appointments/queue`,
        { params: { department } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load queue"));
    }
  },
);

export const updateQueueStatus = createAsyncThunk(
  "appointments/queueStatus",
  async (
    {
      facilityId,
      ticketId,
      status,
    }: { facilityId: string; ticketId: string; status: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.patch<ApiSuccess<QueueTicket>>(
        `/companies/${facilityId}/appointments/queue/${ticketId}`,
        { status },
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Queue update failed"));
    }
  },
);

export const createTriage = createAsyncThunk(
  "appointments/triage",
  async (
    {
      facilityId,
      payload,
    }: {
      facilityId: string;
      payload: {
        patientId: string;
        appointmentId?: string;
        queueTicketId?: string;
        level: number;
        chiefComplaint?: string;
        notes?: string;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await api.post<ApiSuccess<TriageRecord>>(
        `/companies/${facilityId}/appointments/triage`,
        payload,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Triage failed"));
    }
  },
);

export const fetchTriage = createAsyncThunk(
  "appointments/fetchTriage",
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ApiSuccess<TriageRecord[]>>(
        `/companies/${facilityId}/appointments/triage`,
      );
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load triage"));
    }
  },
);

const appointmentsSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    clearAppointmentsError(s) {
      s.error = null;
      s.message = null;
    },
  },
  extraReducers: (b) => {
    const fail = (s: AppointmentsState, a: { payload?: unknown }) => {
      s.loading = false;
      s.saving = false;
      s.error = (a.payload as string) || "Request failed";
    };

    b.addCase(fetchCalendar.pending, (s) => {
      s.loading = true;
    })
      .addCase(fetchCalendar.fulfilled, (s, a) => {
        s.loading = false;
        s.calendar = a.payload.data || [];
      })
      .addCase(fetchCalendar.rejected, fail);

    b.addCase(bookAppointment.fulfilled, (s, a) => {
      s.saving = false;
      s.message = a.payload.message || "Booked";
      if (a.payload.data) s.calendar = [...s.calendar, a.payload.data];
    })
      .addCase(bookAppointment.rejected, fail);

    b.addCase(checkInPatient.fulfilled, (s, a) => {
      s.message = a.payload.message || "Checked in";
      if (a.payload.data) s.queue = [a.payload.data, ...s.queue];
    });

    b.addCase(fetchQueue.fulfilled, (s, a) => {
      s.queue = a.payload.data || [];
    });

    b.addCase(updateQueueStatus.fulfilled, (s, a) => {
      const t = a.payload.data;
      if (t) {
        s.queue = s.queue.map((x) => (x._id === t._id ? t : x));
      }
    });

    b.addCase(createTriage.fulfilled, (s, a) => {
      s.message = a.payload.message || "Triage recorded";
      if (a.payload.data) s.triage = [a.payload.data, ...s.triage];
    });

    b.addCase(fetchTriage.fulfilled, (s, a) => {
      s.triage = a.payload.data || [];
    });
  },
});

export const { clearAppointmentsError } = appointmentsSlice.actions;
export default appointmentsSlice.reducer;
