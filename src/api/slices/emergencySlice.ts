import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

/* -------------------------------------------------------------------------- */
/*  Types — mirror api/src/modules/emergency/schemas/emergency.schema.ts      */
/* -------------------------------------------------------------------------- */

type PersonRef = string | { _id: string; firstName?: string; lastName?: string; email?: string };
type PatientRef =
  | string
  | {
      _id: string;
      mrn?: string;
      firstName?: string;
      lastName?: string;
      gender?: string;
      dateOfBirth?: string;
      phone?: string;
      bloodGroup?: string;
      allergies?: Array<{ _id?: string; substance: string; reaction?: string; severity?: string }>;
    };

export type ErTriage = "red" | "orange" | "yellow" | "green" | "blue";
export type ErArrivalMode = "walk-in" | "ambulance" | "referral" | "police" | "other";
export type ErStatus =
  | "waiting"
  | "triaged"
  | "in-resus"
  | "in-treatment"
  | "observation"
  | "admitted"
  | "referred"
  | "discharged"
  | "deceased"
  | "left-against-advice";
export type ErDispatchStatus =
  | "requested"
  | "dispatched"
  | "en-route"
  | "on-scene"
  | "returning"
  | "completed"
  | "cancelled";
export type ErDispatchPriority = "emergency" | "urgent" | "routine";
export type ErDispositionType = "admit" | "refer" | "discharge" | "deceased" | "left-against-advice";
export type ErMassCasualtyStatus = "active" | "stand-down" | "closed";

export interface ErRegistration {
  _id: string;
  patient?: PatientRef | null;
  isUnknown: boolean;
  temporaryName?: string;
  arrivalTime: string;
  arrivalMode: ErArrivalMode;
  chiefComplaint: string;
  triageCategory?: ErTriage;
  triageNotes?: string;
  triageTime?: string;
  firstTriageTime?: string;
  triagedBy?: PersonRef;
  status: ErStatus;
  location?: string;
  attendingClinician?: PersonRef;
  registeredBy?: PersonRef;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

type RegistrationLite = Pick<
  ErRegistration,
  "_id" | "arrivalTime" | "chiefComplaint" | "triageCategory" | "status" | "temporaryName" | "location"
>;

export interface ErDispatch {
  _id: string;
  callReceivedAt: string;
  callerName?: string;
  callerPhone?: string;
  pickupAddress: string;
  destination?: string;
  chiefComplaint?: string;
  priority: ErDispatchPriority;
  vehicle?: string;
  crew?: string[];
  status: ErDispatchStatus;
  dispatchedAt?: string;
  arrivedAtScene?: string;
  arrivedAtHospital?: string;
  /** populated on GET /ambulance/:id, a plain id otherwise */
  linkedRegistration?: string | (RegistrationLite & { patient?: PatientRef | null });
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ErTrauma {
  _id: string;
  registration: string | RegistrationLite;
  patient?: PatientRef | null;
  mechanism?: string;
  injuries: string[];
  gcs?: number;
  primarySurvey?: string;
  secondarySurvey?: string;
  interventions?: string;
  disposition?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ErMedicoLegal {
  _id: string;
  registration: string | RegistrationLite;
  patient?: PatientRef | null;
  caseType: string;
  policeNotified: boolean;
  policeStation?: string;
  crimeNumber?: string;
  findings?: string;
  evidenceCollected?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ErMassCasualty {
  _id: string;
  name: string;
  startedAt: string;
  endedAt?: string;
  description?: string;
  expectedCasualties?: number;
  status: ErMassCasualtyStatus;
  notes?: string;
  /** only on GET /mass-casualty/:id */
  summary?: {
    arrivals: number;
    stillInDepartment: number;
    byTriage: Record<string, number>;
    byStatus: Record<string, number>;
  };
}

export interface ErDisposition {
  _id: string;
  registration: string | RegistrationLite;
  patient?: PatientRef | null;
  type: ErDispositionType;
  dispositionTime: string;
  destinationWard?: string | { _id: string; name: string; code?: string; type?: string };
  destinationFacility?: string;
  /** the ward-side request created for an admit; its status tells you if a bed was assigned */
  admissionRequest?: string | { _id: string; status: "pending" | "accepted" | "rejected" | "cancelled"; bedCode?: string };
  reason?: string;
  summary?: string;
  by?: PersonRef;
}

/** GET /:id = the registration plus everything linked to it. */
export interface ErRegistrationDetail extends ErRegistration {
  trauma?: ErTrauma | null;
  medicoLegal?: ErMedicoLegal[];
  disposition?: ErDisposition | null;
  dispatch?: ErDispatch | null;
}

export interface ErDashboard {
  waiting: number;
  inResus: number;
  totalActive: number;
  redTriage: number;
  awaitingTriage: number;
  inObservation: number;
  inTreatment: number;
  byTriage: Record<ErTriage, number>;
  breaches: number;
  triageDelays: number;
  longestWaitMinutes: number;
  arrivalsToday: number;
  dispositionsToday: number;
  activeDispatches: number;
  massCasualty: { _id: string; name: string; startedAt: string; expectedCasualties?: number } | null;
  targets: { triageDelayMinutes: number; triageTargetMinutes: Record<ErTriage, number> };
}

export interface ErReport {
  period: { from: string; to: string };
  totals: { arrivals: number; dispositions: number; stillInDepartment: number; deaths: number };
  byTriage: Record<string, number>;
  byArrivalMode: Record<string, number>;
  byDisposition: Record<string, number>;
  byDay: Record<string, number>;
  timing: {
    avgMinutesToTriage: number | null;
    avgLengthOfStayMinutes: number | null;
    avgLengthOfStayByDisposition: Record<string, number | null>;
    leftAgainstAdviceRatePct: number;
  };
  ambulance: {
    calls: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    avgMinutesToDispatch: number | null;
    avgMinutesToScene: number | null;
  };
}

export interface EmergencyState {
  dashboard: ErDashboard | null;
  active: ErRegistration[];
  activeRecord: ErRegistrationDetail | null;
  dispatches: ErDispatch[];
  activeDispatch: ErDispatch | null;
  trauma: ErTrauma[];
  activeTrauma: ErTrauma | null;
  medicoLegal: ErMedicoLegal[];
  activeMedicoLegal: ErMedicoLegal | null;
  massCasualty: ErMassCasualty[];
  activeMassCasualty: ErMassCasualty | null;
  dispositions: ErDisposition[];
  report: ErReport | null;
  listLoading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: EmergencyState = {
  dashboard: null,
  active: [],
  activeRecord: null,
  dispatches: [],
  activeDispatch: null,
  trauma: [],
  activeTrauma: null,
  medicoLegal: [],
  activeMedicoLegal: null,
  massCasualty: [],
  activeMassCasualty: null,
  dispositions: [],
  report: null,
  listLoading: false,
  detailLoading: false,
  saving: false,
  error: null,
  message: null,
};

/* -------------------------------------------------------------------------- */
/*  Thunk factory (same shape as the blood-bank slice)                        */
/* -------------------------------------------------------------------------- */

const base = (facilityId: string) => `/companies/${facilityId}/emergency`;

function mk<A, T>(type: string, fallback: string, fn: (arg: A) => Promise<ApiSuccess<T>>) {
  return createAsyncThunk<ApiSuccess<T>, A, { rejectValue: string }>(`emergency/${type}`, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, fallback));
    }
  });
}

type F = { facilityId: string };

/* ---- dashboard & reports ---- */
export const fetchErDashboard = mk<F, ErDashboard>("fetchDashboard", "Failed to load the ER dashboard", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/dashboard`)).data);
export const fetchErReport = mk<F & { from?: string; to?: string }, ErReport>("fetchReport", "Failed to load ER reports", async ({ facilityId, ...params }) =>
  (await api.get(`${base(facilityId)}/reports`, { params })).data);

/* ---- registration, triage, tracker ---- */
export type ErRegisterPayload = {
  patientId?: string;
  isUnknown?: boolean;
  temporaryName?: string;
  arrivalMode: ErArrivalMode;
  chiefComplaint: string;
  notes?: string;
};
export type ErTriagePayload = { triageCategory: ErTriage; triageNotes?: string; location?: string };
export type ErStatusPayload = { status: Exclude<ErStatus, "admitted" | "referred" | "discharged" | "deceased" | "left-against-advice">; location?: string; attendingClinician?: string; notes?: string };

export const fetchErActive = mk<F & { status?: string; triage?: string }, ErRegistration[]>("fetchActive", "Failed to load ER patients", async ({ facilityId, ...params }) =>
  (await api.get(`${base(facilityId)}/active`, { params })).data);
export const fetchErRegistration = mk<F & { registrationId: string }, ErRegistrationDetail>("fetchRegistration", "Failed to load the ER visit", async ({ facilityId, registrationId }) =>
  (await api.get(`${base(facilityId)}/${registrationId}`)).data);
export const registerErPatient = mk<F & { payload: ErRegisterPayload }, ErRegistration>("register", "Could not register the patient", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/register`, payload)).data);
export const triageErPatient = mk<F & { registrationId: string; payload: ErTriagePayload }, ErRegistration>("triage", "Could not save triage", async ({ facilityId, registrationId, payload }) =>
  (await api.post(`${base(facilityId)}/${registrationId}/triage`, payload)).data);
export const updateErStatus = mk<F & { registrationId: string; payload: ErStatusPayload }, ErRegistration>("updateStatus", "Could not update the status", async ({ facilityId, registrationId, payload }) =>
  (await api.patch(`${base(facilityId)}/${registrationId}/status`, payload)).data);

/* ---- ambulance ---- */
export type ErDispatchPayload = {
  callerName?: string;
  callerPhone?: string;
  pickupAddress: string;
  destination?: string;
  chiefComplaint?: string;
  priority?: ErDispatchPriority;
  vehicle?: string;
  crew?: string[];
  notes?: string;
};
export const fetchErDispatches = mk<F, ErDispatch[]>("fetchDispatches", "Failed to load ambulance calls", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/ambulance`)).data);
export const fetchErDispatch = mk<F & { dispatchId: string }, ErDispatch>("fetchDispatch", "Failed to load the call", async ({ facilityId, dispatchId }) =>
  (await api.get(`${base(facilityId)}/ambulance/${dispatchId}`)).data);
export const createErDispatch = mk<F & { payload: ErDispatchPayload }, ErDispatch>("createDispatch", "Could not log the call", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/ambulance`, payload)).data);
export const updateErDispatch = mk<F & { dispatchId: string; payload: Partial<ErDispatchPayload> & { linkedRegistrationId?: string } }, ErDispatch>("updateDispatch", "Could not update the call", async ({ facilityId, dispatchId, payload }) =>
  (await api.patch(`${base(facilityId)}/ambulance/${dispatchId}`, payload)).data);
export const updateErDispatchStatus = mk<F & { dispatchId: string; status: ErDispatchStatus }, ErDispatch>("updateDispatchStatus", "Could not update the call", async ({ facilityId, dispatchId, status }) =>
  (await api.patch(`${base(facilityId)}/ambulance/${dispatchId}/status`, { status })).data);

/* ---- trauma ---- */
export type ErTraumaPayload = { mechanism?: string; injuries?: string[]; gcs?: number; primarySurvey?: string; notes?: string };
export type ErTraumaPatch = ErTraumaPayload & { secondarySurvey?: string; interventions?: string; disposition?: string };
export const fetchErTrauma = mk<F, ErTrauma[]>("fetchTrauma", "Failed to load trauma cases", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/trauma`)).data);
export const fetchErTraumaById = mk<F & { traumaId: string }, ErTrauma>("fetchTraumaById", "Failed to load the trauma case", async ({ facilityId, traumaId }) =>
  (await api.get(`${base(facilityId)}/trauma/${traumaId}`)).data);
export const openErTrauma = mk<F & { payload: ErTraumaPayload & { registrationId: string } }, ErTrauma>("openTrauma", "Could not open the trauma case", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/trauma`, payload)).data);
export const updateErTrauma = mk<F & { traumaId: string; payload: ErTraumaPatch }, ErTrauma>("updateTrauma", "Could not update the trauma case", async ({ facilityId, traumaId, payload }) =>
  (await api.patch(`${base(facilityId)}/trauma/${traumaId}`, payload)).data);

/* ---- medico-legal ---- */
export type ErMedicoLegalPayload = {
  caseType: string;
  policeNotified?: boolean;
  policeStation?: string;
  crimeNumber?: string;
  findings?: string;
  evidenceCollected?: string;
  notes?: string;
};
export const fetchErMedicoLegal = mk<F, ErMedicoLegal[]>("fetchMedicoLegal", "Failed to load medico-legal cases", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/medico-legal`)).data);
export const fetchErMedicoLegalById = mk<F & { caseId: string }, ErMedicoLegal>("fetchMedicoLegalById", "Failed to load the case", async ({ facilityId, caseId }) =>
  (await api.get(`${base(facilityId)}/medico-legal/${caseId}`)).data);
export const openErMedicoLegal = mk<F & { payload: ErMedicoLegalPayload & { registrationId: string } }, ErMedicoLegal>("openMedicoLegal", "Could not open the case", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/medico-legal`, payload)).data);
export const updateErMedicoLegal = mk<F & { caseId: string; payload: Partial<ErMedicoLegalPayload> }, ErMedicoLegal>("updateMedicoLegal", "Could not update the case", async ({ facilityId, caseId, payload }) =>
  (await api.patch(`${base(facilityId)}/medico-legal/${caseId}`, payload)).data);

/* ---- mass casualty ---- */
export type ErMassCasualtyPayload = { name: string; description?: string; expectedCasualties?: number; notes?: string };
export const fetchErMassCasualty = mk<F, ErMassCasualty[]>("fetchMassCasualty", "Failed to load mass-casualty events", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/mass-casualty`)).data);
export const fetchErMassCasualtyById = mk<F & { eventId: string }, ErMassCasualty>("fetchMassCasualtyById", "Failed to load the event", async ({ facilityId, eventId }) =>
  (await api.get(`${base(facilityId)}/mass-casualty/${eventId}`)).data);
export const startErMassCasualty = mk<F & { payload: ErMassCasualtyPayload }, ErMassCasualty>("startMassCasualty", "Could not activate mass-casualty mode", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/mass-casualty`, payload)).data);
export const updateErMassCasualty = mk<F & { eventId: string; status: ErMassCasualtyStatus }, ErMassCasualty>("updateMassCasualty", "Could not update the event", async ({ facilityId, eventId, status }) =>
  (await api.patch(`${base(facilityId)}/mass-casualty/${eventId}`, { status })).data);

/* ---- disposition ---- */
export type ErDispositionPayload = {
  registrationId: string;
  type: ErDispositionType;
  destinationWardId?: string;
  destinationFacility?: string;
  admittingDiagnosis?: string;
  reason?: string;
  summary?: string;
};
export const fetchErDispositions = mk<F & { type?: string; from?: string; to?: string }, ErDisposition[]>("fetchDispositions", "Failed to load dispositions", async ({ facilityId, ...params }) =>
  (await api.get(`${base(facilityId)}/disposition`, { params })).data);
export const disposeErPatient = mk<F & { payload: ErDispositionPayload }, ErDisposition>("dispose", "Could not record the disposition", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/disposition`, payload)).data);

/* -------------------------------------------------------------------------- */
/*  Slice                                                                     */
/* -------------------------------------------------------------------------- */

const TERMINAL: ErStatus[] = ["admitted", "referred", "discharged", "deceased", "left-against-advice"];

/** Mutation responses are NOT populated (patient comes back as an id) — never let that clobber a populated copy. */
const mergeReg = <T extends ErRegistration>(old: T | null | undefined, u: ErRegistration): T => {
  const keep = <K extends "patient" | "attendingClinician" | "triagedBy" | "registeredBy">(k: K) =>
    typeof u[k] === "string" && old && old[k] && typeof old[k] !== "string" ? old[k] : u[k];
  return {
    ...(old || {}),
    ...u,
    patient: keep("patient"),
    attendingClinician: keep("attendingClinician"),
    triagedBy: keep("triagedBy"),
    registeredBy: keep("registeredBy"),
  } as T;
};

const emergencySlice = createSlice({
  name: "emergency",
  initialState,
  reducers: {
    clearEmergencyError(s) {
      s.error = null;
      s.message = null;
    },
    clearErActiveRecord(s) { s.activeRecord = null; },
    clearErActiveDispatch(s) { s.activeDispatch = null; },
    clearErActiveTrauma(s) { s.activeTrauma = null; },
    clearErActiveMedicoLegal(s) { s.activeMedicoLegal = null; },
    clearErActiveMassCasualty(s) { s.activeMassCasualty = null; },
  },
  extraReducers: (b) => {
    const fail = (s: EmergencyState, a: any) => {
      s.listLoading = false;
      s.detailLoading = false;
      s.saving = false;
      s.error = a.payload || "Request failed";
    };
    const saving = (s: EmergencyState) => {
      s.saving = true;
      s.error = null;
    };
    const saved = (s: EmergencyState, a: any, fallback: string) => {
      s.saving = false;
      s.message = a.payload.message || fallback;
    };
    const upsert = <T extends { _id: string }>(list: T[], item?: T) => {
      if (!item) return list;
      const i = list.findIndex((x) => x._id === item._id);
      return i >= 0 ? list.map((x, idx) => (idx === i ? item : x)) : [item, ...list];
    };

    /* lists */
    const lists: Array<[any, (s: EmergencyState, p: any) => void]> = [
      [fetchErDashboard, (s, p) => void (s.dashboard = p || null)],
      [fetchErReport, (s, p) => void (s.report = p || null)],
      [fetchErActive, (s, p) => void (s.active = p || [])],
      [fetchErDispatches, (s, p) => void (s.dispatches = p || [])],
      [fetchErTrauma, (s, p) => void (s.trauma = p || [])],
      [fetchErMedicoLegal, (s, p) => void (s.medicoLegal = p || [])],
      [fetchErMassCasualty, (s, p) => void (s.massCasualty = p || [])],
      [fetchErDispositions, (s, p) => void (s.dispositions = p || [])],
    ];
    lists.forEach(([thunk, assign]) => {
      b.addCase(thunk.pending, (s: EmergencyState) => {
        s.listLoading = true;
        s.error = null;
      })
        .addCase(thunk.fulfilled, (s: EmergencyState, a: any) => {
          s.listLoading = false;
          assign(s, a.payload.data);
        })
        .addCase(thunk.rejected, fail);
    });

    /* details */
    const details: Array<[any, (s: EmergencyState, p: any) => void]> = [
      [fetchErRegistration, (s, p) => void (s.activeRecord = p || null)],
      [fetchErDispatch, (s, p) => void (s.activeDispatch = p || null)],
      [fetchErTraumaById, (s, p) => void (s.activeTrauma = p || null)],
      [fetchErMedicoLegalById, (s, p) => void (s.activeMedicoLegal = p || null)],
      [fetchErMassCasualtyById, (s, p) => void (s.activeMassCasualty = p || null)],
    ];
    details.forEach(([thunk, assign]) => {
      b.addCase(thunk.pending, (s: EmergencyState) => void ((s.detailLoading = true), (s.error = null)))
        .addCase(thunk.fulfilled, (s: EmergencyState, a: any) => {
          s.detailLoading = false;
          assign(s, a.payload.data);
        })
        .addCase(thunk.rejected, fail);
    });

    /* registration / triage / status */
    const regUpdated = (label: string) => (s: EmergencyState, a: any) => {
      saved(s, a, label);
      const u: ErRegistration | undefined = a.payload.data;
      if (!u) return;
      if (TERMINAL.includes(u.status)) s.active = s.active.filter((x) => x._id !== u._id);
      else s.active = s.active.map((x) => (x._id === u._id ? mergeReg(x, u) : x));
      if (s.activeRecord?._id === u._id) s.activeRecord = mergeReg(s.activeRecord, u);
    };
    b.addCase(registerErPatient.pending, saving)
      .addCase(registerErPatient.fulfilled, (s, a) => saved(s, a, "Patient registered"))
      .addCase(registerErPatient.rejected, fail)
      .addCase(triageErPatient.pending, saving)
      .addCase(triageErPatient.fulfilled, regUpdated("Triage recorded"))
      .addCase(triageErPatient.rejected, fail)
      .addCase(updateErStatus.pending, saving)
      .addCase(updateErStatus.fulfilled, regUpdated("Status updated"))
      .addCase(updateErStatus.rejected, fail);

    /* ambulance */
    const dispatchUpdated = (label: string) => (s: EmergencyState, a: any) => {
      saved(s, a, label);
      const u: ErDispatch | undefined = a.payload.data;
      if (!u) return;
      s.dispatches = upsert(s.dispatches, u);
      // keep the populated linkedRegistration the detail page already has
      if (s.activeDispatch?._id === u._id) {
        const old = s.activeDispatch;
        s.activeDispatch = {
          ...old,
          ...u,
          linkedRegistration:
            typeof u.linkedRegistration === "string" && old.linkedRegistration && typeof old.linkedRegistration !== "string" && old.linkedRegistration._id === u.linkedRegistration
              ? old.linkedRegistration
              : u.linkedRegistration,
        };
      }
    };
    b.addCase(createErDispatch.pending, saving)
      .addCase(createErDispatch.fulfilled, dispatchUpdated("Ambulance request logged"))
      .addCase(createErDispatch.rejected, fail)
      .addCase(updateErDispatch.pending, saving)
      .addCase(updateErDispatch.fulfilled, dispatchUpdated("Dispatch updated"))
      .addCase(updateErDispatch.rejected, fail)
      .addCase(updateErDispatchStatus.pending, saving)
      .addCase(updateErDispatchStatus.fulfilled, dispatchUpdated("Call updated"))
      .addCase(updateErDispatchStatus.rejected, fail);

    /* trauma */
    b.addCase(openErTrauma.pending, saving)
      .addCase(openErTrauma.fulfilled, (s, a) => {
        saved(s, a, "Trauma case opened");
        if (a.payload.data) s.trauma = upsert(s.trauma, a.payload.data);
      })
      .addCase(openErTrauma.rejected, fail)
      .addCase(updateErTrauma.pending, saving)
      .addCase(updateErTrauma.fulfilled, (s, a) => {
        saved(s, a, "Trauma case updated");
        const u = a.payload.data;
        if (!u) return;
        s.trauma = s.trauma.map((x) => (x._id === u._id ? { ...x, ...u, registration: typeof u.registration === "string" ? x.registration : u.registration, patient: typeof u.patient === "string" ? x.patient : u.patient } : x));
        if (s.activeTrauma?._id === u._id) s.activeTrauma = { ...s.activeTrauma, ...u, registration: typeof u.registration === "string" ? s.activeTrauma.registration : u.registration, patient: typeof u.patient === "string" ? s.activeTrauma.patient : u.patient };
      })
      .addCase(updateErTrauma.rejected, fail);

    /* medico-legal */
    b.addCase(openErMedicoLegal.pending, saving)
      .addCase(openErMedicoLegal.fulfilled, (s, a) => {
        saved(s, a, "Medico-legal case opened");
        if (a.payload.data) s.medicoLegal = upsert(s.medicoLegal, a.payload.data);
      })
      .addCase(openErMedicoLegal.rejected, fail)
      .addCase(updateErMedicoLegal.pending, saving)
      .addCase(updateErMedicoLegal.fulfilled, (s, a) => {
        saved(s, a, "Medico-legal case updated");
        const u = a.payload.data;
        if (!u) return;
        s.medicoLegal = s.medicoLegal.map((x) => (x._id === u._id ? { ...x, ...u, registration: typeof u.registration === "string" ? x.registration : u.registration, patient: typeof u.patient === "string" ? x.patient : u.patient } : x));
        if (s.activeMedicoLegal?._id === u._id) s.activeMedicoLegal = { ...s.activeMedicoLegal, ...u, registration: typeof u.registration === "string" ? s.activeMedicoLegal.registration : u.registration, patient: typeof u.patient === "string" ? s.activeMedicoLegal.patient : u.patient };
      })
      .addCase(updateErMedicoLegal.rejected, fail);

    /* mass casualty */
    b.addCase(startErMassCasualty.pending, saving)
      .addCase(startErMassCasualty.fulfilled, (s, a) => {
        saved(s, a, "Mass-casualty mode activated");
        if (a.payload.data) s.massCasualty = upsert(s.massCasualty, a.payload.data);
      })
      .addCase(startErMassCasualty.rejected, fail)
      .addCase(updateErMassCasualty.pending, saving)
      .addCase(updateErMassCasualty.fulfilled, (s, a) => {
        saved(s, a, "Event updated");
        const u = a.payload.data;
        if (!u) return;
        s.massCasualty = upsert(s.massCasualty, u);
        // keep the live summary the detail page already has
        if (s.activeMassCasualty?._id === u._id) s.activeMassCasualty = { ...s.activeMassCasualty, ...u };
      })
      .addCase(updateErMassCasualty.rejected, fail);

    /* disposition */
    b.addCase(disposeErPatient.pending, saving)
      .addCase(disposeErPatient.fulfilled, (s, a) => {
        saved(s, a, "Disposition recorded");
        const d = a.payload.data;
        if (!d) return;
        s.dispositions = upsert(s.dispositions, d);
        const regId = typeof d.registration === "string" ? d.registration : d.registration._id;
        s.active = s.active.filter((x) => x._id !== regId);
      })
      .addCase(disposeErPatient.rejected, fail);
  },
});

export const {
  clearEmergencyError,
  clearErActiveRecord,
  clearErActiveDispatch,
  clearErActiveTrauma,
  clearErActiveMedicoLegal,
  clearErActiveMassCasualty,
} = emergencySlice.actions;
export default emergencySlice.reducer;
