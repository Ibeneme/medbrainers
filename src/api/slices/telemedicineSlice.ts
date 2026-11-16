// File: src/store/slices/telemedicine.slice.ts
// (Copy-paste this entire file — fixes ListMeta duplicate export and Redux Toolkit type errors)

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

/* -------------------------------------------------------------------------- */
/*  Types – mirror modules/telemedicine (sessions, notes, settings, chat)    */
/* -------------------------------------------------------------------------- */

export type TeleRole = "host" | "cohost" | "clinician" | "patient" | "interpreter" | "guest";
export type TeleStatus = "scheduled" | "live" | "completed" | "cancelled" | "missed";
export type TeleType = "consultation" | "follow_up" | "review" | "second_opinion" | "group";
export type TeleNoteType = "soap" | "general" | "private";
export type TeleScope = "upcoming" | "current" | "past" | "all";

export interface TelePerson {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mrn?: string;
  phone?: string;
}

export interface TeleInvitee {
  user: string | TelePerson;
  role: TeleRole;
  invitedAt?: string;
}

export interface TeleGuestInvite {
  key: string;
  name: string;
  role: TeleRole;
  email?: string;
  phone?: string;
  isPatient?: boolean;
  expiresAt?: string;
  revokedAt?: string;
  firstJoinedAt?: string;
  emailedAt?: string;
}

export interface TeleInviteLink {
  key: string;
  name: string;
  role: TeleRole;
  joinUrl: string;
  expiresAt?: string;
}

export interface TeleAttendance {
  identityKey: string;
  kind: "user" | "guest";
  user?: string;
  name: string;
  role: TeleRole;
  joinedAt: string;
  leftAt?: string;
}

export interface TeleSession {
  _id: string;
  patient?: string | TelePerson;
  appointment?: string;
  consultation?: string;
  host: string | TelePerson;
  title: string;
  reason?: string;
  type: TeleType;
  roomCode: string;
  status: TeleStatus;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  durationMinutes?: number;
  waitingRoom: boolean;
  chatEnabled: boolean;
  screenShareEnabled: boolean;
  locked?: boolean;
  maxParticipants?: number;
  recordingAllowed?: boolean;
  recording?: { active: boolean; startedAt?: string; startedBy?: string; segments: number };
  invitees: TeleInvitee[];
  invites: TeleGuestInvite[];
  attendance: TeleAttendance[];
  consent?: { givenAt?: string; by?: string; text?: string };
  quality?: { worstRttMs?: number; maxPacketLossPct?: number; reports: number };
  endReason?: string;
  cancelReason?: string;
  cancelledAt?: string;
  live?: { participants: number; waiting: number; liveSince?: number | null } | null;
  joinUrl?: string;
  /** Present only on the schedule response — copy these, they are not stored again. */
  inviteLinks?: TeleInviteLink[];
  createdAt?: string;
  updatedAt?: any
}

export interface TeleDashboard {
  scheduledToday: number;
  upcomingToday: number;
  liveNow: number;
  waitingNow: number;
  completedToday: number;
  missedWeek: number;
  avgDurationMinutes: number;
  consultations30d: number;
  myDraftNotes: number;
  nextSession: TeleSession | null;
}

export interface TeleSettings {
  _id?: string;
  enabled: boolean;
  defaultDurationMinutes: number;
  joinWindowMinutes: number;
  noShowAfterMinutes: number;
  maxDurationMinutes: number;
  maxParticipants: number;
  waitingRoom: boolean;
  chatEnabled: boolean;
  screenShareEnabled: boolean;
  recordingAllowed: boolean;
  recordingRequiresConsent: boolean;
  requirePatientConsent: boolean;
  consentText: string;
  lobbyMessage?: string;
  allowedHostRoles: string[];
  sendInviteEmails: boolean;
  stunUrls: string[];
}

export interface TeleNote {
  _id: string;
  session: string | { _id: string; title?: string; roomCode?: string; scheduledStart?: string; status?: TeleStatus };
  patient?: string | TelePerson;
  author: string | TelePerson;
  type: TeleNoteType;
  title?: string;
  content?: string;
  soap?: { subjective?: string; objective?: string; assessment?: string; plan?: string };
  visibility: "private" | "care_team";
  status: "draft" | "signed";
  signedAt?: string;
  addenda: { text: string; by: string | TelePerson; at: string }[];
  createdAt: string;
  updatedAt?: string;
}

export interface TeleMessage {
  id: string;
  peerId: string;
  name: string;
  role: string;
  kind: "text" | "system";
  text: string;
  at: number;
}

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface TeleJoinInfo {
  sessionId: string;
  roomCode: string;
  title: string;
  status: TeleStatus;
  role: TeleRole | null;
  canJoin: boolean;
  opensAt: string;
  iceServers: IceServer[];
  socket: { namespace: string };
}

/** Renamed from ListMeta to TeleListMeta to prevent collision with radiologySlice */
export interface TeleListMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ScheduleTelePayload {
  patientId?: string;
  appointmentId?: string;
  hostId?: string;
  title?: string;
  reason?: string;
  type?: TeleType;
  scheduledStart: string;
  scheduledEnd?: string;
  durationMinutes?: number;
  waitingRoom?: boolean;
  chatEnabled?: boolean;
  screenShareEnabled?: boolean;
  invitees?: { userId: string; role?: TeleRole }[];
  guests?: { name: string; role?: TeleRole; email?: string; phone?: string; sendEmail?: boolean }[];
  invitePatient?: boolean;
}

export interface TeleNotePayload {
  type?: TeleNoteType;
  title?: string;
  content?: string;
  soap?: { subjective?: string; objective?: string; assessment?: string; plan?: string };
  visibility?: "private" | "care_team";
}

export interface TelemedicineState {
  dashboard: TeleDashboard | null;
  settings: TeleSettings | null;
  iceServers: IceServer[];
  sessions: TeleSession[];
  sessionsMeta: TeleListMeta | null;
  sessionsScope: TeleScope | null;
  activeSession: TeleSession | null;
  joinInfo: TeleJoinInfo | null;
  /** Join URLs returned once when a session is scheduled. */
  freshLinks: TeleInviteLink[];
  freshLinksSessionId: string | null;
  messages: TeleMessage[];
  notes: TeleNote[];
  notesMeta: TeleListMeta | null;
  activeNote: TeleNote | null;
  listLoading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: TelemedicineState = {
  dashboard: null,
  settings: null,
  iceServers: [],
  sessions: [],
  sessionsMeta: null,
  sessionsScope: null,
  activeSession: null,
  joinInfo: null,
  freshLinks: [],
  freshLinksSessionId: null,
  messages: [],
  notes: [],
  notesMeta: null,
  activeNote: null,
  listLoading: false,
  detailLoading: false,
  saving: false,
  error: null,
  message: null,
};

/* -------------------------------------------------------------------------- */
/*  Thunks                                                                    */
/* -------------------------------------------------------------------------- */

const base = (facilityId: string) => `/companies/${facilityId}/telemedicine`;

/** GUEST PUBLIC THUNK — used by the guest landing page */
export const fetchTeleGuestLobby = createAsyncThunk<ApiSuccess<TeleSession>, { facilityId: string; token: string }, { rejectValue: string }>(
  "telemedicine/fetchGuestLobby",
  async ({ facilityId, token }, { rejectWithValue }) => {
    try {
      const response = await api.get(`${base(facilityId)}/guest/session`, { params: { token } });
      return response.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to load guest lobby"));
    }
  }
);

type F = { facilityId: string };

function mk<A, T>(type: string, fallback: string, fn: (arg: A) => Promise<ApiSuccess<T>>) {
  return createAsyncThunk<ApiSuccess<T>, A, { rejectValue: string }>(`telemedicine/${type}`, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, fallback));
    }
  });
}

function params(q: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}

export const fetchTeleDashboard = mk<F, TeleDashboard>("fetchDashboard", "Failed to load telehealth dashboard", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/dashboard`)).data);

export const fetchTeleSettings = mk<F, TeleSettings>("fetchSettings", "Failed to load telehealth settings", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/settings`)).data);

export const saveTeleSettings = mk<F & { payload: Partial<TeleSettings> }, TeleSettings>(
  "saveSettings",
  "Could not save telehealth settings",
  async ({ facilityId, payload }) => (await api.put(`${base(facilityId)}/settings`, payload)).data,
);

export const fetchTeleIceServers = mk<F, IceServer[]>("fetchIce", "Failed to load call servers", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/ice-servers`)).data);

export const fetchTeleSessions = mk<
  F & {
    scope?: TeleScope;
    status?: TeleStatus;
    patientId?: string;
    hostId?: string;
    mine?: boolean;
    from?: string;
    to?: string;
    q?: string;
    page?: number;
    limit?: number;
  },
  TeleSession[]
>("fetchSessions", "Failed to load telehealth sessions", async ({ facilityId, mine, ...q }) =>
  (await api.get(`${base(facilityId)}/sessions`, { params: params({ ...q, mine: mine ? "true" : undefined }) })).data);

export const fetchTeleSession = mk<F & { sessionId: string }, TeleSession>("fetchSession", "Failed to load session", async ({ facilityId, sessionId }) =>
  (await api.get(`${base(facilityId)}/sessions/${sessionId}`)).data);

export const fetchTeleJoinInfo = mk<F & { sessionId: string }, TeleJoinInfo>("fetchJoinInfo", "Failed to load join details", async ({ facilityId, sessionId }) =>
  (await api.get(`${base(facilityId)}/sessions/${sessionId}/join-info`)).data);

export const scheduleTeleSession = mk<F & { payload: ScheduleTelePayload }, TeleSession>(
  "scheduleSession",
  "Could not schedule the session",
  async ({ facilityId, payload }) => (await api.post(`${base(facilityId)}/sessions`, payload)).data,
);

export const updateTeleSession = mk<F & { sessionId: string; payload: Partial<ScheduleTelePayload> }, TeleSession>(
  "updateSession",
  "Could not update the session",
  async ({ facilityId, sessionId, payload }) => (await api.patch(`${base(facilityId)}/sessions/${sessionId}`, payload)).data,
);

export const cancelTeleSession = mk<F & { sessionId: string; reason?: string }, TeleSession>(
  "cancelSession",
  "Could not cancel the session",
  async ({ facilityId, sessionId, reason }) => (await api.post(`${base(facilityId)}/sessions/${sessionId}/cancel`, { reason })).data,
);

export const endTeleSession = mk<F & { sessionId: string }, TeleSession>("endSession", "Could not end the session", async ({ facilityId, sessionId }) =>
  (await api.post(`${base(facilityId)}/sessions/${sessionId}/end`)).data);

export const rescheduleTeleSession = mk<
  F & { sessionId: string; payload: { scheduledStart: string; scheduledEnd?: string; reason?: string } },
  TeleSession
>(
  "rescheduleSession",
  "Could not reschedule the session",
  async ({ facilityId, sessionId, payload }) => (await api.post(`${base(facilityId)}/sessions/${sessionId}/reschedule`, payload)).data,
);

export const createTeleInvite = mk<
  F & { sessionId: string; payload: { name: string; role?: TeleRole; email?: string; phone?: string; isPatient?: boolean; sendEmail?: boolean } },
  TeleInviteLink
>("createInvite", "Could not create the invite", async ({ facilityId, sessionId, payload }) =>
  (await api.post(`${base(facilityId)}/sessions/${sessionId}/invites`, payload)).data);

export const resendTeleInvite = mk<F & { sessionId: string; key: string; sendEmail?: boolean }, TeleInviteLink>(
  "resendInvite",
  "Could not refresh the invite",
  async ({ facilityId, sessionId, key, sendEmail }) => (await api.post(`${base(facilityId)}/sessions/${sessionId}/invites/${key}/resend`, { sendEmail })).data,
);

export const revokeTeleInvite = mk<F & { sessionId: string; key: string }, { success?: boolean }>(
  "revokeInvite",
  "Could not revoke the invite",
  async ({ facilityId, sessionId, key }) => (await api.delete(`${base(facilityId)}/sessions/${sessionId}/invites/${key}`)).data,
);

export const fetchTeleMessages = mk<F & { sessionId: string; limit?: number }, TeleMessage[]>(
  "fetchMessages",
  "Failed to load the chat transcript",
  async ({ facilityId, sessionId, limit }) => (await api.get(`${base(facilityId)}/sessions/${sessionId}/messages`, { params: params({ limit }) })).data,
);

export const fetchTeleNotes = mk<
  F & { patientId?: string; sessionId?: string; mine?: boolean; status?: "draft" | "signed"; page?: number; limit?: number },
  TeleNote[]
>("fetchNotes", "Failed to load session notes", async ({ facilityId, mine, ...q }) =>
  (await api.get(`${base(facilityId)}/notes`, { params: params({ ...q, mine: mine ? "true" : undefined }) })).data);

export const fetchTeleNote = mk<F & { noteId: string }, TeleNote>("fetchNote", "Failed to load the note", async ({ facilityId, noteId }) =>
  (await api.get(`${base(facilityId)}/notes/${noteId}`)).data);

export const createTeleNote = mk<F & { sessionId: string; payload: TeleNotePayload }, TeleNote>(
  "createNote",
  "Could not save the note",
  async ({ facilityId, sessionId, payload }) => (await api.post(`${base(facilityId)}/sessions/${sessionId}/notes`, payload)).data,
);

export const updateTeleNote = mk<F & { noteId: string; payload: TeleNotePayload }, TeleNote>(
  "updateNote",
  "Could not update the note",
  async ({ facilityId, noteId, payload }) => (await api.patch(`${base(facilityId)}/notes/${noteId}`, payload)).data,
);

export const signTeleNote = mk<F & { noteId: string }, TeleNote>("signNote", "Could not sign the note", async ({ facilityId, noteId }) =>
  (await api.post(`${base(facilityId)}/notes/${noteId}/sign`)).data);

export const addTeleAddendum = mk<F & { noteId: string; text: string }, TeleNote>(
  "addAddendum",
  "Could not add the addendum",
  async ({ facilityId, noteId, text }) => (await api.post(`${base(facilityId)}/notes/${noteId}/addenda`, { text })).data,
);

export const deleteTeleNote = mk<F & { noteId: string }, unknown>("deleteNote", "Could not delete the note", async ({ facilityId, noteId }) =>
  (await api.delete(`${base(facilityId)}/notes/${noteId}`)).data);

/* -------------------------------------------------------------------------- */
/*  Slice                                                                     */
/* -------------------------------------------------------------------------- */

function upsert<T extends { _id: string }>(list: T[], item?: T | null) {
  if (!item?._id) return list;
  const i = list.findIndex((x) => x._id === item._id);
  return i >= 0 ? list.map((x, idx) => (idx === i ? item : x)) : [item, ...list];
}

const telemedicineSlice = createSlice({
  name: "telemedicine",
  initialState,
  reducers: {
    clearTeleFeedback(s) {
      s.error = null;
      s.message = null;
    },
    clearTeleSession(s) {
      s.activeSession = null;
      s.joinInfo = null;
      s.messages = [];
      s.freshLinks = [];
      s.freshLinksSessionId = null;
    },
    clearTeleNote(s) {
      s.activeNote = null;
    },
  },
  extraReducers: (b) => {
    const fail = (s: TelemedicineState, a: { payload?: string }) => {
      s.listLoading = false;
      s.detailLoading = false;
      s.saving = false;
      s.error = a.payload || "Request failed";
    };

    const lists: Array<[any, (s: TelemedicineState, a: any) => void]> = [
      [fetchTeleDashboard, (s, a) => void (s.dashboard = a.payload.data || null)],
      [fetchTeleSettings, (s, a) => void (s.settings = a.payload.data || null)],
      [fetchTeleIceServers, (s, a) => void (s.iceServers = a.payload.data || [])],
      [
        fetchTeleSessions,
        (s, a) => {
          s.sessions = a.payload.data || [];
          s.sessionsMeta = a.payload.meta || null;
          s.sessionsScope = a.meta.arg.scope || "all";
        },
      ],
      [
        fetchTeleNotes,
        (s, a) => {
          s.notes = a.payload.data || [];
          s.notesMeta = a.payload.meta || null;
        },
      ],
      [fetchTeleMessages, (s, a) => void (s.messages = a.payload.data || [])],
    ];
    lists.forEach(([thunk, assign]) => {
      b.addCase(thunk.pending, (s: TelemedicineState) => {
        s.listLoading = true;
        s.error = null;
      })
        .addCase(thunk.fulfilled, (s: TelemedicineState, a: any) => {
          s.listLoading = false;
          assign(s, a);
        })
        .addCase(thunk.rejected, fail);
    });

    const details: Array<[any, (s: TelemedicineState, data: any) => void]> = [
      [fetchTeleSession, (s, data) => void (s.activeSession = data || null)],
      [fetchTeleJoinInfo, (s, data) => void (s.joinInfo = data || null)],
      [fetchTeleNote, (s, data) => void (s.activeNote = data || null)],
    ];
    details.forEach(([thunk, assign]) => {
      b.addCase(thunk.pending, (s: TelemedicineState) => {
        s.detailLoading = true;
        s.error = null;
      })
        .addCase(thunk.fulfilled, (s: TelemedicineState, a: any) => {
          s.detailLoading = false;
          assign(s, a.payload.data);
        })
        .addCase(thunk.rejected, fail);
    });

    const touchSession = (s: TelemedicineState, data?: TeleSession) => {
      if (!data?._id) return;
      s.activeSession = data;
      s.sessions = upsert(s.sessions, data);
    };

    const writes: Array<[any, string, ((s: TelemedicineState, data: any) => void)?]> = [
      [saveTeleSettings, "Telehealth settings saved", (s, data) => void (s.settings = data || s.settings)],
      [
        scheduleTeleSession,
        "Session scheduled",
        (s, data) => {
          touchSession(s, data);
          s.freshLinks = data?.inviteLinks || [];
          s.freshLinksSessionId = data?._id || null;
        },
      ],
      [updateTeleSession, "Session updated", (s, data) => touchSession(s, data)],
      [cancelTeleSession, "Session cancelled", (s, data) => touchSession(s, data)],
      [endTeleSession, "Session ended", (s, data) => touchSession(s, data)],
      [rescheduleTeleSession, "Session rescheduled", (s, data) => touchSession(s, data)],
      [createTeleNote, "Note saved", (s, data) => void (s.activeNote = data || s.activeNote)],
      [updateTeleNote, "Note updated", (s, data) => void (s.activeNote = data || s.activeNote)],
      [signTeleNote, "Note signed", (s, data) => void (s.activeNote = data || s.activeNote)],
      [addTeleAddendum, "Addendum added", (s, data) => void (s.activeNote = data || s.activeNote)],
      [
        deleteTeleNote,
        "Note deleted",
        (s, _data) => {
          s.activeNote = null;
        },
      ],
      [revokeTeleInvite, "Invite revoked"],
    ];
    writes.forEach(([thunk, msg, apply]) => {
      b.addCase(thunk.pending, (s: TelemedicineState) => {
        s.saving = true;
        s.error = null;
      })
        .addCase(thunk.fulfilled, (s: TelemedicineState, a: any) => {
          s.saving = false;
          s.message = a.payload?.message || msg;
          apply?.(s, a.payload?.data);
        })
        .addCase(thunk.rejected, fail);
    });

    /* invites return a link, not the session */
    b.addCase(createTeleInvite.pending, (s) => {
      s.saving = true;
      s.error = null;
    })
      .addCase(createTeleInvite.fulfilled, (s, a) => {
        s.saving = false;
        s.message = "Invite created — copy the join link";
        if (a.payload.data) {
          s.freshLinks = [a.payload.data, ...s.freshLinks.filter((l) => l.key !== a.payload.data.key)];
          s.freshLinksSessionId = a.meta.arg.sessionId;
        }
      })
      .addCase(createTeleInvite.rejected, fail);

    b.addCase(resendTeleInvite.pending, (s) => {
      s.saving = true;
      s.error = null;
    })
      .addCase(resendTeleInvite.fulfilled, (s, a) => {
        s.saving = false;
        s.message = "Invite refreshed";
        if (a.payload.data?.joinUrl) {
          const link = a.payload.data;
          s.freshLinks = [link, ...s.freshLinks.filter((l) => l.key !== link.key)];
          s.freshLinksSessionId = a.meta.arg.sessionId;
        }
      })
      .addCase(resendTeleInvite.rejected, fail);

    /* ── GUEST PUBLIC HANDLER ───────────────────────────────────────────── */
    b.addCase(fetchTeleGuestLobby.pending, (s) => {
      s.listLoading = true;
      s.error = null;
    })
      .addCase(fetchTeleGuestLobby.fulfilled, (s, a) => {
        s.listLoading = false;
        s.activeSession = a.payload.data || null;
      })
      .addCase(fetchTeleGuestLobby.rejected, (s, a) => {
        s.listLoading = false;
        s.error = a.payload || "Failed to load guest lobby";
      });
  },
});

export const { clearTeleFeedback, clearTeleSession, clearTeleNote } = telemedicineSlice.actions;
export default telemedicineSlice.reducer;