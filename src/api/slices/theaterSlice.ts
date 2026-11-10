import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

/* -------------------------------------------------------------------------- */
/*  Types – mirror modules/theater/schemas/theater.schema.ts                  */
/* -------------------------------------------------------------------------- */

type PersonRef = string | { _id: string; firstName?: string; lastName?: string };
type PatientRef =
  | string
  | { _id: string; mrn?: string; firstName?: string; lastName?: string; dateOfBirth?: string; gender?: string };
type RoomRef = string | { _id: string; name?: string; code?: string };

export type SurgeryPriority = "elective" | "urgent" | "emergency";
export type SurgeryRequestStatus = "requested" | "scheduled" | "in-progress" | "completed" | "cancelled";
export type TheatreCaseStatus = "scheduled" | "pre-op" | "in-theatre" | "recovery" | "completed" | "cancelled";

export interface TheatreRoom {
  _id: string;
  name: string;
  code: string;
  type?: string;
  isActive?: boolean;
  notes?: string;
}

export interface SurgeryRequest {
  _id: string;
  patient: PatientRef;
  procedureName: string;
  icdCode?: string;
  diagnosis?: string;
  priority: SurgeryPriority;
  requestedBy?: PersonRef;
  requestedAt?: string;
  preferredDate?: string;
  status: SurgeryRequestStatus;
  notes?: string;
}

export interface TheatreCase {
  _id: string;
  request?: string;
  patient: PatientRef;
  room: RoomRef;
  procedureName: string;
  scheduledStart: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  surgeon?: PersonRef;
  anaesthetist?: PersonRef;
  scrubNurse?: PersonRef;
  status: TheatreCaseStatus;
  notes?: string;
  /** Present only when the optional read-endpoints server patch is applied */
  records?: TheatreCaseRecords;
}

export interface TheatreCaseRecords {
  preOp?: any[];
  consent?: any[];
  checklist?: any | null;
  operationNotes?: any[];
  anaesthesia?: any[];
  counts?: any[];
  implants?: any[];
  recovery?: any[];
  complications?: any[];
}

export interface TheatreRecovery {
  _id: string;
  theatreCase: string | { _id: string; procedureName?: string };
  patient: PatientRef;
  arrivedAt: string;
  dischargedAt?: string;
  aldreteScore?: number;
  painScore?: number;
  complications?: string;
  notes?: string;
}

export interface TheatreComplication {
  _id: string;
  theatreCase: string;
  patient: PatientRef;
  description: string;
  severity?: "minor" | "moderate" | "major" | "death";
  occurredAt: string;
  actionTaken?: string;
  notes?: string;
}

export interface SterilizationCycle {
  _id: string;
  cycleNo: string;
  method: string;
  loadDescription?: string;
  startedAt: string;
  completedAt?: string;
  result?: "pass" | "fail";
  notes?: string;
}

export interface TheatreDashboard {
  todayCases: number;
  inTheatre: number;
  pendingRequests: number;
}

export type TheatreRecordKind =
  | "pre-op"
  | "consent"
  | "checklists"
  | "operation-notes"
  | "anaesthesia"
  | "counts"
  | "implants"
  | "recovery";

export interface TheaterState {
  dashboard: TheatreDashboard | null;
  rooms: TheatreRoom[];
  requests: SurgeryRequest[];
  schedule: TheatreCase[];
  activeCase: TheatreCase | null;
  complications: TheatreComplication[];
  cssd: SterilizationCycle[];
  /** Case-level records, filled by fetchTheaterRecords (needs the read-endpoints patch) */
  records: Partial<Record<TheatreRecordKind, any[]>>;
  listLoading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: TheaterState = {
  dashboard: null,
  rooms: [],
  requests: [],
  schedule: [],
  activeCase: null,
  complications: [],
  cssd: [],
  records: {},
  listLoading: false,
  detailLoading: false,
  saving: false,
  error: null,
  message: null,
};

/* -------------------------------------------------------------------------- */
/*  Thunk factory                                                             */
/* -------------------------------------------------------------------------- */

const base = (facilityId: string) => `/companies/${facilityId}/theater`;
type F = { facilityId: string };

function mk<A, T>(type: string, fallback: string, fn: (arg: A) => Promise<ApiSuccess<T>>) {
  return createAsyncThunk<ApiSuccess<T>, A, { rejectValue: string }>(`theater/${type}`, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, fallback));
    }
  });
}

/* ---- dashboard ---- */
export const fetchTheaterDashboard = mk<F, TheatreDashboard>("fetchDashboard", "Failed to load theatre dashboard", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/dashboard`)).data);

/* ---- rooms ---- */
export const fetchTheatreRooms = mk<F & { includeInactive?: boolean }, TheatreRoom[]>("fetchRooms", "Failed to load theatre rooms", async ({ facilityId, includeInactive }) =>
  (await api.get(`${base(facilityId)}/rooms`, { params: { includeInactive: includeInactive ? 1 : undefined } })).data);
/** Needs PATCH /rooms/:id (server/theater-read-endpoints.patch.md, section 3) */
export const updateTheatreRoom = mk<F & { roomId: string; payload: { name?: string; code?: string; type?: string; notes?: string; isActive?: boolean } }, TheatreRoom>(
  "updateRoom", "Could not update theatre room", async ({ facilityId, roomId, payload }) => (await api.patch(`${base(facilityId)}/rooms/${roomId}`, payload)).data);
export const createTheatreRoom = mk<F & { payload: { name: string; code: string; type?: string; notes?: string } }, TheatreRoom>(
  "createRoom", "Could not create theatre room", async ({ facilityId, payload }) => (await api.post(`${base(facilityId)}/rooms`, payload)).data);

/* ---- surgery requests ---- */
export const fetchSurgeryRequests = mk<F & { status?: string }, SurgeryRequest[]>("fetchRequests", "Failed to load surgery requests", async ({ facilityId, status }) =>
  (await api.get(`${base(facilityId)}/requests`, { params: { status } })).data);
export const createSurgeryRequest = mk<
  F & { payload: { patientId: string; procedureName: string; icdCode?: string; diagnosis?: string; priority?: SurgeryPriority; preferredDate?: string; notes?: string } },
  SurgeryRequest
>("createRequest", "Could not create surgery request", async ({ facilityId, payload }) => (await api.post(`${base(facilityId)}/requests`, payload)).data);

/* ---- schedule / cases ---- */
export const fetchTheaterSchedule = mk<F & { date?: string }, TheatreCase[]>("fetchSchedule", "Failed to load theatre schedule", async ({ facilityId, date }) =>
  (await api.get(`${base(facilityId)}/schedule`, { params: { date } })).data);
export const scheduleCase = mk<
  F & {
    payload: {
      requestId?: string; patientId: string; roomId: string; procedureName: string; scheduledStart: string; scheduledEnd?: string;
      surgeonId?: string; anaesthetistId?: string; scrubNurseId?: string; notes?: string;
    };
  },
  TheatreCase
>("scheduleCase", "Could not schedule case", async ({ facilityId, payload }) => (await api.post(`${base(facilityId)}/schedule`, payload)).data);
export const fetchTheatreCase = mk<F & { caseId: string }, TheatreCase>("fetchCase", "Failed to load theatre case", async ({ facilityId, caseId }) =>
  (await api.get(`${base(facilityId)}/cases/${caseId}`)).data);
export const updateCaseStatus = mk<F & { caseId: string; status: TheatreCaseStatus }, TheatreCase>("updateCaseStatus", "Could not update case status", async ({ facilityId, caseId, status }) =>
  (await api.patch(`${base(facilityId)}/cases/${caseId}/status`, { status })).data);

/* ---- pre-operative ---- */
export const addPreOp = mk<
  F & {
    caseId: string;
    payload: {
      asaGrade?: string; airway?: string; comorbidities?: string; medications?: string; allergies?: string; investigations?: string;
      fitnessForSurgery: "fit" | "fit-with-optimisation" | "unfit"; notes?: string;
    };
  },
  any
>("addPreOp", "Could not save pre-op assessment", async ({ facilityId, caseId, payload }) => (await api.post(`${base(facilityId)}/cases/${caseId}/pre-op`, payload)).data);
export const addConsent = mk<
  F & {
    caseId: string;
    payload: { procedureDescription: string; risksExplained?: boolean; alternativesDiscussed?: boolean; consentGiven: boolean; witness?: string; notes?: string };
  },
  any
>("addConsent", "Could not save consent form", async ({ facilityId, caseId, payload }) => (await api.post(`${base(facilityId)}/cases/${caseId}/consent`, payload)).data);
export const updateChecklist = mk<
  F & { caseId: string; payload: { signInCompleted?: boolean; timeOutCompleted?: boolean; signOutCompleted?: boolean; notes?: string } },
  any
>("updateChecklist", "Could not update checklist", async ({ facilityId, caseId, payload }) => (await api.patch(`${base(facilityId)}/cases/${caseId}/checklist`, payload)).data);

/* ---- intra-operative ---- */
export const addOperationNote = mk<
  F & {
    caseId: string;
    payload: {
      procedurePerformed: string; findings?: string; technique?: string; specimens?: string;
      estimatedBloodLoss?: number; complications?: string; postoperativeOrders?: string;
    };
  },
  any
>("addOperationNote", "Could not save operation note", async ({ facilityId, caseId, payload }) => (await api.post(`${base(facilityId)}/cases/${caseId}/operation-notes`, payload)).data);
export const addAnaesthesiaRecord = mk<
  F & {
    caseId: string;
    payload: {
      anaesthesiaType: string; agents?: string; airwayManagement?: string; monitoring?: string; fluids?: string;
      events?: string; startTime?: string; endTime?: string; notes?: string;
    };
  },
  any
>("addAnaesthesia", "Could not save anaesthesia record", async ({ facilityId, caseId, payload }) => (await api.post(`${base(facilityId)}/cases/${caseId}/anaesthesia`, payload)).data);
export const addCount = mk<
  F & {
    caseId: string;
    payload: { itemType: "swab" | "instrument" | "needle" | "other"; itemName: string; countInitial?: number; countFinal?: number; correct?: boolean; notes?: string };
  },
  any
>("addCount", "Could not save count", async ({ facilityId, caseId, payload }) => (await api.post(`${base(facilityId)}/cases/${caseId}/counts`, payload)).data);
export const addImplant = mk<
  F & { caseId: string; payload: { implantName: string; manufacturer?: string; lotNumber?: string; serialNumber?: string; quantity?: number; notes?: string } },
  any
>("addImplant", "Could not save implant", async ({ facilityId, caseId, payload }) => (await api.post(`${base(facilityId)}/cases/${caseId}/implants`, payload)).data);

/* ---- post-operative ---- */
export const startRecovery = mk<F & { caseId: string; payload?: { notes?: string } }, TheatreRecovery>("startRecovery", "Could not start recovery", async ({ facilityId, caseId, payload }) =>
  (await api.post(`${base(facilityId)}/cases/${caseId}/recovery`, payload || {})).data);
export const dischargeRecovery = mk<F & { recoveryId: string; payload: { aldreteScore?: number; painScore?: number; notes?: string } }, TheatreRecovery>(
  "dischargeRecovery", "Could not discharge from recovery", async ({ facilityId, recoveryId, payload }) =>
    (await api.patch(`${base(facilityId)}/recovery/${recoveryId}/discharge`, payload)).data);
export const addComplication = mk<
  F & { caseId: string; payload: { description: string; severity?: "minor" | "moderate" | "major" | "death"; actionTaken?: string; notes?: string } },
  TheatreComplication
>("addComplication", "Could not record complication", async ({ facilityId, caseId, payload }) => (await api.post(`${base(facilityId)}/cases/${caseId}/complications`, payload)).data);
export const fetchComplications = mk<F, TheatreComplication[]>("fetchComplications", "Failed to load complications", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/complications`)).data);

/* ---- CSSD ---- */
export const fetchSterilization = mk<F, SterilizationCycle[]>("fetchCssd", "Failed to load sterilization cycles", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/cssd`)).data);
export const startSterilization = mk<F & { payload: { cycleNo: string; method: string; loadDescription?: string; notes?: string } }, SterilizationCycle>(
  "startCssd", "Could not start sterilization cycle", async ({ facilityId, payload }) => (await api.post(`${base(facilityId)}/cssd`, payload)).data);
export const completeSterilization = mk<F & { cycleId: string; payload: { result: "pass" | "fail"; notes?: string } }, SterilizationCycle>(
  "completeCssd", "Could not complete sterilization cycle", async ({ facilityId, cycleId, payload }) => (await api.patch(`${base(facilityId)}/cssd/${cycleId}`, payload)).data);

/* ---- optional read endpoints (server/theater-read-endpoints.patch.md) ---- */
export const fetchTheaterRecords = mk<F & { kind: TheatreRecordKind }, any[]>("fetchRecords", "Failed to load records", async ({ facilityId, kind }) =>
  (await api.get(`${base(facilityId)}/records/${kind}`)).data);

/* -------------------------------------------------------------------------- */
/*  Slice                                                                     */
/* -------------------------------------------------------------------------- */

const theaterSlice = createSlice({
  name: "theater",
  initialState,
  reducers: {
    clearTheaterError(s) {
      s.error = null;
      s.message = null;
    },
    clearActiveCase(s) {
      s.activeCase = null;
    },
  },
  extraReducers: (b) => {
    const fail = (s: TheaterState, a: any) => {
      s.listLoading = false;
      s.detailLoading = false;
      s.saving = false;
      s.error = a.payload || "Request failed";
    };
    const upsert = <T extends { _id: string }>(list: T[], item?: T) => {
      if (!item) return list;
      const i = list.findIndex((x) => x._id === item._id);
      return i >= 0 ? list.map((x, idx) => (idx === i ? item : x)) : [item, ...list];
    };

    /* lists */
    const lists: Array<[any, (s: TheaterState, p: any) => void]> = [
      [fetchTheaterDashboard, (s, p) => void (s.dashboard = p || null)],
      [fetchTheatreRooms, (s, p) => void (s.rooms = p || [])],
      [fetchSurgeryRequests, (s, p) => void (s.requests = p || [])],
      [fetchTheaterSchedule, (s, p) => void (s.schedule = p || [])],
      [fetchComplications, (s, p) => void (s.complications = p || [])],
      [fetchSterilization, (s, p) => void (s.cssd = p || [])],
    ];
    lists.forEach(([thunk, assign]) => {
      b.addCase(thunk.pending, (s: TheaterState) => {
        s.listLoading = true;
        s.error = null;
      })
        .addCase(thunk.fulfilled, (s: TheaterState, a: any) => {
          s.listLoading = false;
          assign(s, a.payload.data);
        })
        .addCase(thunk.rejected, fail);
    });

    b.addCase(fetchTheaterRecords.pending, (s) => void (s.listLoading = true))
      .addCase(fetchTheaterRecords.fulfilled, (s, a) => {
        s.listLoading = false;
        s.records[a.meta.arg.kind] = a.payload.data || [];
      })
      .addCase(fetchTheaterRecords.rejected, fail);

    /* single case */
    b.addCase(fetchTheatreCase.pending, (s) => void (s.detailLoading = true))
      .addCase(fetchTheatreCase.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.activeCase = a.payload.data || null;
      })
      .addCase(fetchTheatreCase.rejected, fail);

    /* writes */
    const writes: Array<[any, string, ((s: TheaterState, p: any) => void)?]> = [
      [createTheatreRoom, "Theatre room created", (s, p) => void (s.rooms = upsert(s.rooms, p))],
      [updateTheatreRoom, "Theatre room updated", (s, p) => void (s.rooms = s.rooms.map((r) => (r._id === p?._id ? { ...r, ...p } : r)))],
      [createSurgeryRequest, "Surgery request submitted", (s, p) => void (s.requests = upsert(s.requests, p))],
      [scheduleCase, "Case scheduled", (s, p) => void (s.schedule = upsert(s.schedule, p))],
      [
        updateCaseStatus,
        "Case status updated",
        (s, p) => {
          s.schedule = s.schedule.map((c) => (c._id === p?._id ? { ...c, ...p } : c));
          if (s.activeCase?._id === p?._id) s.activeCase = { ...s.activeCase, ...p };
        },
      ],
      [addPreOp, "Pre-op assessment saved"],
      [addConsent, "Consent recorded"],
      [updateChecklist, "Checklist updated"],
      [addOperationNote, "Operation note saved"],
      [addAnaesthesiaRecord, "Anaesthesia record saved"],
      [addCount, "Count recorded"],
      [addImplant, "Implant recorded"],
      [startRecovery, "Patient moved to recovery"],
      [dischargeRecovery, "Patient discharged from recovery"],
      [addComplication, "Complication recorded", (s, p) => void (s.complications = upsert(s.complications, p))],
      [startSterilization, "Sterilization cycle started", (s, p) => void (s.cssd = upsert(s.cssd, p))],
      [completeSterilization, "Sterilization cycle completed", (s, p) => void (s.cssd = upsert(s.cssd, p))],
    ];
    writes.forEach(([thunk, msg, apply]) => {
      b.addCase(thunk.pending, (s: TheaterState) => {
        s.saving = true;
        s.error = null;
      })
        .addCase(thunk.fulfilled, (s: TheaterState, a: any) => {
          s.saving = false;
          s.message = a.payload.message || msg;
          apply?.(s, a.payload.data);
        })
        .addCase(thunk.rejected, fail);
    });
  },
});

export const { clearTheaterError, clearActiveCase } = theaterSlice.actions;
export default theaterSlice.reducer;
