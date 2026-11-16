import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type PersonRef =
  | string
  | {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };

type PatientRef =
  | string
  | {
    _id: string;
    mrn?: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    dateOfBirth?: string;
    status?: string;
    phone?: string;
  };

export type AppointmentKind =
  | "consultation"
  | "follow_up"
  | "procedure"
  | "review"
  | "other"
  //| "task";

export type AppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"
  | "rescheduled";

export type AppointmentPriority = "routine" | "urgent" | "emergency";

export type QueueTicketStatus =
  | "waiting"
  | "called"
  | "serving"
  | "completed"
  | "skipped"
  | "cancelled";

export interface ActivityLogEntry {
  at: string;
  by?: PersonRef;
  action: string;
  message: string;
}

export interface Appointment {
  _id: string;
  company: string;
  kind: AppointmentKind;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  department: string;
  departmentName?: string;
  departmentCode?: string;
  patient?: PatientRef | null;
  title: string;
  reason?: string;
  notes?: string;
  startAt: string;
  endAt?: string;
  assignedTo?: PersonRef[];
  clinician?: PersonRef | null;
  createdBy?: PersonRef | null;
  queueTicket?: string | null;
  checkedInAt?: string;
  startedAt?: string;
  startedBy?: PersonRef | null;
  completedAt?: string;
  completedBy?: PersonRef | null;
  cancelledAt?: string;
  cancelledBy?: PersonRef | null;
  cancelReason?: string;
  rescheduledFrom?: string;
  rescheduledTo?: string;
  sourceTask?: string;
  consultationId?: string;
  activityLog?: ActivityLogEntry[];
  /** Present on task entries returned by myDay */
  overdue?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface QueueTicket {
  _id: string;
  company: string;
  department: string;
  departmentName?: string;
  departmentCode?: string;
  appointment?: string | { _id: string; title?: string; reason?: string; priority?: AppointmentPriority; kind?: AppointmentKind; startAt?: string; status?: AppointmentStatus };
  patient?: PatientRef | null;
  ticketNumber: string;
  sequence: number;
  queueDate: string;
  priority: AppointmentPriority;
  priorityRank: number;
  status: QueueTicketStatus;
  active: boolean;
  checkedInAt: string;
  calledAt?: string;
  calledBy?: PersonRef | null;
  servedAt?: string;
  servingBy?: PersonRef | null;
  completedAt?: string;
  skippedAt?: string;
  skipReason?: string;
  skipCount?: number;
  cancelledAt?: string;
  cancelReason?: string;
  notes?: string;
  /** Computed for waiting tickets */
  position?: number;
  createdBy?: PersonRef | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface QueueDepartmentSummary {
  department: { _id: string; name: string; code: string };
  waiting: number;
  called: number;
  serving: number;
  oldestWaitingAt?: string | null;
  mine: QueueTicket[];
}

export interface QueueListData {
  department: { _id: string; name: string; code: string };
  counts: { waiting: number; called: number; serving: number };
  serving: QueueTicket[];
  called: QueueTicket[];
  waiting: QueueTicket[];
  closedToday: QueueTicket[];
  onDuty: {
    mode: "roster" | "any_member";
    users: PersonRef[];
  };
  canServe: boolean;
}

export interface MyDayData {
  date: string;
  tz: string;
  departments: Array<{ _id: string; name: string; code: string }>;
  tasks: Appointment[];
  appointments: Appointment[];
  queue: QueueDepartmentSummary[];
}

export interface AppointmentListMeta {
  total: number;
  page: number;
  limit: number;
}

/* -------------------------------------------------------------------------- */
/*  State                                                                     */
/* -------------------------------------------------------------------------- */

export interface AppointmentsState {
  list: Appointment[];
  listMeta: AppointmentListMeta | null;
  active: Appointment | null;
  activeTicket: QueueTicket | null;

  myDay: MyDayData | null;
  myQueues: QueueDepartmentSummary[];
  queue: QueueListData | null;

  listLoading: boolean;
  detailLoading: boolean;
  queueLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: AppointmentsState = {
  list: [],
  listMeta: null,
  active: null,
  activeTicket: null,
  myDay: null,
  myQueues: [],
  queue: null,
  listLoading: false,
  detailLoading: false,
  queueLoading: false,
  saving: false,
  error: null,
  message: null,
};

/* -------------------------------------------------------------------------- */
/*  Thunk factory                                                             */
/* -------------------------------------------------------------------------- */

const base = (facilityId: string) => `/companies/${facilityId}/appointments`;

function mk<A, T>(
  type: string,
  fallback: string,
  fn: (arg: A) => Promise<ApiSuccess<T>>,
) {
  return createAsyncThunk<ApiSuccess<T>, A, { rejectValue: string }>(
    `appointments/${type}`,
    async (arg, { rejectWithValue }) => {
      try {
        return await fn(arg);
      } catch (err) {
        return rejectWithValue(getErrorMessage(err, fallback));
      }
    },
  );
}

type F = { facilityId: string };

/* -------------------------------------------------------------------------- */
/*  Thunks – reading                                                          */
/* -------------------------------------------------------------------------- */

export const fetchAppointments = mk<
  F & {
    departmentId?: string;
    status?: string[];
    kind?: string[];
    patientId?: string;
    scope?: "all" | "mine";
    date?: string;
    from?: string;
    to?: string;
    tz?: string;
    page?: number;
    limit?: number;
  },
  { data: Appointment[]; meta: AppointmentListMeta }
>("fetchList", "Failed to load appointments", async ({ facilityId, ...params }) => {
  const res = await api.get(`${base(facilityId)}`, { params });
  // Backend returns { success, data, meta } — normalise so payload is always { data, meta }
  return {
    success: true as const,
    data: {
      data: res.data.data ?? [],
      meta: res.data.meta ?? { total: 0, page: 1, limit: 100 },
    },
  };
});

export const fetchMyDay = mk<
  F & { date?: string; tz?: string },
  MyDayData
>("fetchMyDay", "Failed to load my day", async ({ facilityId, ...params }) =>
  (await api.get(`${base(facilityId)}/my-day`, { params })).data,
);

export const fetchAppointmentById = mk<
  F & { appointmentId: string },
  { appointment: Appointment; ticket: QueueTicket | null }
>("fetchById", "Failed to load appointment", async ({ facilityId, appointmentId }) =>
  (await api.get(`${base(facilityId)}/${appointmentId}`)).data,
);

/* -------------------------------------------------------------------------- */
/*  Thunks – patient visits (writing)                                         */
/* -------------------------------------------------------------------------- */

export type CreateAppointmentPayload = {
  kind?: Exclude<AppointmentKind, "task">;
  patientId: string;
  departmentId: string;
  title?: string;
  reason?: string;
  notes?: string;
  priority?: AppointmentPriority;
  startAt?: string | Date;
  endAt?: string | Date;
  /** Patient is here now — skip schedule and join the queue immediately */
  walkIn?: boolean;
  tz?: string;
};

export const createAppointment = mk<
  F & { payload: CreateAppointmentPayload },
  { appointment: Appointment; ticket: QueueTicket | null }
>("create", "Could not book appointment", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}`, payload)).data,
);

export const updateAppointment = mk<
  F & {
    appointmentId: string;
    payload: Partial<{
      title: string;
      reason: string;
      notes: string;
      priority: AppointmentPriority;
      startAt: string | Date;
      endAt: string | Date | null;
      departmentId: string;
    }>;
  },
  Appointment
>("update", "Could not update appointment", async ({ facilityId, appointmentId, payload }) =>
  (await api.patch(`${base(facilityId)}/${appointmentId}`, payload)).data,
);

export const checkInAppointment = mk<
  F & { appointmentId: string; tz?: string },
  { appointment: Appointment; ticket: QueueTicket }
>("checkIn", "Could not check in", async ({ facilityId, appointmentId, tz }) =>
  (await api.post(`${base(facilityId)}/${appointmentId}/check-in`, null, { params: { tz } })).data,
);

export const cancelAppointment = mk<
  F & { appointmentId: string; reason?: string },
  Appointment
>("cancel", "Could not cancel appointment", async ({ facilityId, appointmentId, reason }) =>
  (await api.post(`${base(facilityId)}/${appointmentId}/cancel`, { reason })).data,
);

export const markNoShow = mk<
  F & { appointmentId: string },
  Appointment
>("noShow", "Could not mark no-show", async ({ facilityId, appointmentId }) =>
  (await api.post(`${base(facilityId)}/${appointmentId}/no-show`)).data,
);

export const rescheduleAppointment = mk<
  F & {
    appointmentId: string;
    payload: { startAt: string | Date; endAt?: string | Date; reason?: string };
  },
  { previous: Appointment; appointment: Appointment }
>("reschedule", "Could not reschedule appointment", async ({ facilityId, appointmentId, payload }) =>
  (await api.post(`${base(facilityId)}/${appointmentId}/reschedule`, payload)).data,
);

/* -------------------------------------------------------------------------- */
/*  Thunks – department tasks on the schedule                                 */
/* -------------------------------------------------------------------------- */

export const setTaskStatus = mk<
  F & { appointmentId: string; status: "in_progress" | "completed" },
  Appointment
>("setTaskStatus", "Could not update task status", async ({ facilityId, appointmentId, status }) =>
  (await api.post(`${base(facilityId)}/${appointmentId}/task-status`, { status })).data,
);

/* -------------------------------------------------------------------------- */
/*  Thunks – department queue                                                 */
/* -------------------------------------------------------------------------- */

export const fetchMyQueues = mk<F, QueueDepartmentSummary[]>(
  "fetchMyQueues",
  "Failed to load queues",
  async ({ facilityId }) => (await api.get(`${base(facilityId)}/queue`)).data,
);

export const fetchQueue = mk<
  F & { departmentId: string; includeClosed?: boolean; tz?: string },
  QueueListData
>("fetchQueue", "Failed to load department queue", async ({ facilityId, departmentId, ...params }) =>
  (await api.get(`${base(facilityId)}/queue/${departmentId}`, { params })).data,
);

export const callNext = mk<
  F & { departmentId: string; tz?: string },
  QueueTicket | null
>("callNext", "Could not call next patient", async ({ facilityId, departmentId, tz }) =>
  (await api.post(`${base(facilityId)}/queue/${departmentId}/call-next`, null, { params: { tz } })).data,
);

export const startTicket = mk<
  F & { ticketId: string; tz?: string },
  { ticket: QueueTicket; appointmentId: string; patient: PatientRef | null }
>("startTicket", "Could not start visit", async ({ facilityId, ticketId, tz }) =>
  (await api.post(`${base(facilityId)}/queue/tickets/${ticketId}/start`, null, { params: { tz } })).data,
);

export const completeTicket = mk<
  F & { ticketId: string; payload?: { consultationId?: string; notes?: string } },
  QueueTicket
>("completeTicket", "Could not complete visit", async ({ facilityId, ticketId, payload }) =>
  (await api.post(`${base(facilityId)}/queue/tickets/${ticketId}/complete`, payload || {})).data,
);

export const skipTicket = mk<
  F & { ticketId: string; reason?: string; tz?: string },
  QueueTicket
>("skipTicket", "Could not skip ticket", async ({ facilityId, ticketId, reason, tz }) =>
  (await api.post(`${base(facilityId)}/queue/tickets/${ticketId}/skip`, { reason }, { params: { tz } })).data,
);

export const requeueTicket = mk<
  F & { ticketId: string },
  QueueTicket
>("requeueTicket", "Could not re-queue ticket", async ({ facilityId, ticketId }) =>
  (await api.post(`${base(facilityId)}/queue/tickets/${ticketId}/requeue`)).data,
);

export const cancelTicket = mk<
  F & { ticketId: string; reason?: string },
  QueueTicket
>("cancelTicket", "Could not cancel ticket", async ({ facilityId, ticketId, reason }) =>
  (await api.post(`${base(facilityId)}/queue/tickets/${ticketId}/cancel`, { reason })).data,
);

/* -------------------------------------------------------------------------- */
/*  Slice                                                                     */
/* -------------------------------------------------------------------------- */

const appointmentsSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    clearAppointmentsError(s) {
      s.error = null;
      s.message = null;
    },
    clearActiveAppointment(s) {
      s.active = null;
      s.activeTicket = null;
    },
    clearQueue(s) {
      s.queue = null;
    },
    clearMyDay(s) {
      s.myDay = null;
    },
  },
  extraReducers: (b) => {
    const fail = (s: AppointmentsState, a: any) => {
      s.listLoading = false;
      s.detailLoading = false;
      s.queueLoading = false;
      s.saving = false;
      s.error = a.payload || "Request failed";
    };

    const saving = (s: AppointmentsState) => {
      s.saving = true;
      s.error = null;
    };

    const saved = (s: AppointmentsState, a: any, fallback: string) => {
      s.saving = false;
      s.message = a.payload?.message || fallback;
    };

    const upsert = <T extends { _id: string }>(list: T[], item?: T | null): T[] => {
      if (!item) return list;
      const i = list.findIndex((x) => x._id === item._id);
      return i >= 0 ? list.map((x, idx) => (idx === i ? item : x)) : [item, ...list];
    };

    /* ---------- lists ---------- */
    b.addCase(fetchAppointments.pending, (s) => {
      s.listLoading = true;
      s.error = null;
    })
      .addCase(fetchAppointments.fulfilled, (s, a) => {
        s.listLoading = false;
        s.list = a.payload.data?.data ?? [];
        s.listMeta = a.payload.data?.meta ?? null;
      })
      .addCase(fetchAppointments.rejected, fail);

    b.addCase(fetchMyDay.pending, (s) => {
      s.listLoading = true;
      s.error = null;
    })
      .addCase(fetchMyDay.fulfilled, (s, a) => {
        s.listLoading = false;
        s.myDay = a.payload.data ?? null;
      })
      .addCase(fetchMyDay.rejected, fail);

    /* ---------- detail ---------- */
    b.addCase(fetchAppointmentById.pending, (s) => {
      s.detailLoading = true;
      s.error = null;
    })
      .addCase(fetchAppointmentById.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.active = a.payload.data?.appointment ?? null;
        s.activeTicket = a.payload.data?.ticket ?? null;
      })
      .addCase(fetchAppointmentById.rejected, fail);

    /* ---------- create / update / check-in / cancel / no-show / reschedule ---------- */
    b.addCase(createAppointment.pending, saving)
      .addCase(createAppointment.fulfilled, (s, a) => {
        saved(s, a, "Appointment booked");
        const appt = a.payload.data?.appointment;
        if (appt) {
          s.list = upsert(s.list, appt);
          s.active = appt;
        }
        if (a.payload.data?.ticket) s.activeTicket = a.payload.data.ticket;
      })
      .addCase(createAppointment.rejected, fail);

    b.addCase(updateAppointment.pending, saving)
      .addCase(updateAppointment.fulfilled, (s, a) => {
        saved(s, a, "Appointment updated");
        const appt = a.payload.data;
        if (appt) {
          s.list = upsert(s.list, appt);
          if (s.active?._id === appt._id) s.active = appt;
        }
      })
      .addCase(updateAppointment.rejected, fail);

    b.addCase(checkInAppointment.pending, saving)
      .addCase(checkInAppointment.fulfilled, (s, a) => {
        saved(s, a, "Checked in");
        const appt = a.payload.data?.appointment;
        const ticket = a.payload.data?.ticket;
        if (appt) {
          s.list = upsert(s.list, appt);
          if (s.active?._id === appt._id) s.active = appt;
        }
        if (ticket) s.activeTicket = ticket;
      })
      .addCase(checkInAppointment.rejected, fail);

    b.addCase(cancelAppointment.pending, saving)
      .addCase(cancelAppointment.fulfilled, (s, a) => {
        saved(s, a, "Appointment cancelled");
        const appt = a.payload.data;
        if (appt) {
          s.list = upsert(s.list, appt);
          if (s.active?._id === appt._id) s.active = appt;
        }
      })
      .addCase(cancelAppointment.rejected, fail);

    b.addCase(markNoShow.pending, saving)
      .addCase(markNoShow.fulfilled, (s, a) => {
        saved(s, a, "Marked as no-show");
        const appt = a.payload.data;
        if (appt) {
          s.list = upsert(s.list, appt);
          if (s.active?._id === appt._id) s.active = appt;
        }
      })
      .addCase(markNoShow.rejected, fail);

    b.addCase(rescheduleAppointment.pending, saving)
      .addCase(rescheduleAppointment.fulfilled, (s, a) => {
        saved(s, a, "Appointment rescheduled");
        const prev = a.payload.data?.previous;
        const fresh = a.payload.data?.appointment;
        if (prev) s.list = upsert(s.list, prev);
        if (fresh) {
          s.list = upsert(s.list, fresh);
          s.active = fresh;
        }
      })
      .addCase(rescheduleAppointment.rejected, fail);

    /* ---------- task status ---------- */
    b.addCase(setTaskStatus.pending, saving)
      .addCase(setTaskStatus.fulfilled, (s, a) => {
        saved(s, a, a.payload.message || "Task updated");
        const appt = a.payload.data;
        if (appt) {
          s.list = upsert(s.list, appt);
          if (s.active?._id === appt._id) s.active = appt;
          // keep myDay tasks in sync when present
          if (s.myDay) {
            s.myDay.tasks = upsert(s.myDay.tasks, appt);
          }
        }
      })
      .addCase(setTaskStatus.rejected, fail);

    /* ---------- queue ---------- */
    b.addCase(fetchMyQueues.pending, (s) => {
      s.queueLoading = true;
      s.error = null;
    })
      .addCase(fetchMyQueues.fulfilled, (s, a) => {
        s.queueLoading = false;
        s.myQueues = a.payload.data ?? [];
      })
      .addCase(fetchMyQueues.rejected, fail);

    b.addCase(fetchQueue.pending, (s) => {
      s.queueLoading = true;
      s.error = null;
    })
      .addCase(fetchQueue.fulfilled, (s, a) => {
        s.queueLoading = false;
        s.queue = a.payload.data ?? null;
      })
      .addCase(fetchQueue.rejected, fail);

    const ticketUpdated = (label: string) => (s: AppointmentsState, a: any) => {
      saved(s, a, label);
      const ticket: QueueTicket | null | undefined = a.payload.data;
      if (!ticket) return;
      s.activeTicket = ticket;

      // Refresh the open queue view if it matches this department
      if (s.queue && String(s.queue.department._id) === String(ticket.department)) {
        // cheapest correct approach: leave the list as-is; UI should re-fetch or we can
        // do a light local patch. Full re-fetch is safer after mutations.
      }
    };

    b.addCase(callNext.pending, saving)
      .addCase(callNext.fulfilled, (s, a) => {
        saved(s, a, a.payload.message || "Called next patient");
        s.activeTicket = a.payload.data ?? null;
      })
      .addCase(callNext.rejected, fail);

    b.addCase(startTicket.pending, saving)
      .addCase(startTicket.fulfilled, (s, a) => {
        saved(s, a, a.payload.message || "Visit started");
        const data = a.payload.data;
        if (data?.ticket) s.activeTicket = data.ticket;
      })
      .addCase(startTicket.rejected, fail);

    b.addCase(completeTicket.pending, saving)
      .addCase(completeTicket.fulfilled, ticketUpdated("Visit completed"))
      .addCase(completeTicket.rejected, fail);

    b.addCase(skipTicket.pending, saving)
      .addCase(skipTicket.fulfilled, ticketUpdated("Ticket skipped"))
      .addCase(skipTicket.rejected, fail);

    b.addCase(requeueTicket.pending, saving)
      .addCase(requeueTicket.fulfilled, ticketUpdated("Back in queue"))
      .addCase(requeueTicket.rejected, fail);

    b.addCase(cancelTicket.pending, saving)
      .addCase(cancelTicket.fulfilled, ticketUpdated("Left the queue"))
      .addCase(cancelTicket.rejected, fail);
  },
});

export const {
  clearAppointmentsError,
  clearActiveAppointment,
  clearQueue,
  clearMyDay,
} = appointmentsSlice.actions;

export default appointmentsSlice.reducer;