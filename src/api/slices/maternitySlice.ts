import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import api, { getErrorMessage, type ApiErrorBody, type ApiSuccess } from "../services";

/* -------------------------------------------------------------------------- */
/*  Types — mirror server/src/modules/maternity/schemas/*.schema.ts           */
/* -------------------------------------------------------------------------- */

export interface MaternityPatientRef {
  _id: string;
  mrn?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
}
export type MaternityPatient = string | MaternityPatientRef;
type PersonRef = string | { _id: string; firstName?: string; lastName?: string };

/* ---- antenatal ---- */
export type PregnancyRiskLevel = "low" | "moderate" | "high" | "very-high";
export type PregnancyStatus = "active" | "delivered" | "aborted" | "ectopic" | "closed";

export interface AntenatalRecord {
  _id: string;
  patient: MaternityPatient;
  registrationNo?: string;
  gravida: number;
  para: number;
  abortions?: number;
  livingChildren?: number;
  lmp?: string;
  edd?: string;
  bookingDate: string;
  gestationalAgeAtBooking?: string;
  bloodGroup?: string;
  rhesus?: string;
  heightCm?: number;
  weightKg?: number;
  riskLevel: PregnancyRiskLevel;
  riskFactors: string[];
  status: PregnancyStatus;
  registeredBy?: PersonRef;
  notes?: string;
  createdAt?: string;
}

export interface AncVisit {
  _id: string;
  antenatalRecord: string;
  patient: MaternityPatient;
  visitDate: string;
  gestationalAge?: string;
  weightKg?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  fundalHeightCm?: number;
  fetalHeartRate?: number;
  presentation?: string;
  oedema?: string;
  urineProtein?: string;
  urineSugar?: string;
  haemoglobin?: number;
  complaints?: string;
  findings?: string;
  advice?: string;
  nextVisitDate?: string;
  attendedBy?: PersonRef;
}

export type InvestigationType = "ultrasound" | "lab" | "other";
export interface AncInvestigation {
  _id: string;
  antenatalRecord: string;
  patient: MaternityPatient;
  type: InvestigationType;
  name: string;
  requestedDate: string;
  performedDate?: string;
  result?: string;
  attachmentUrl?: string;
  notes?: string;
}

/* ---- labour & delivery ---- */
export type LabourStatus = "admitted" | "active-labour" | "delivered" | "transferred" | "discharged";
export interface PartographObservation {
  _id?: string;
  time: string;
  cervicalDilatation?: number;
  descentOfHead?: number;
  fetalHeartRate?: number;
  contractionsPer10Min?: number;
  durationOfContraction?: string;
  bpSystolic?: number;
  bpDiastolic?: number;
  pulse?: number;
  temperature?: number;
  urineVolume?: number;
  urineProtein?: string;
  urineAcetone?: string;
  drugsGiven?: string;
  notes?: string;
}
export interface LabourRecord {
  _id: string;
  patient: MaternityPatient;
  antenatalRecord?: string;
  admissionTime: string;
  bedCode?: string;
  status: LabourStatus;
  onsetOfLabour?: string;
  membranesRupturedAt?: string;
  liquor?: string;
  partograph: PartographObservation[];
  notes?: string;
}

export type DeliveryMode = "svd" | "assisted" | "caesarean" | "breech" | "other";
export interface DeliveryRecord {
  _id: string;
  patient: MaternityPatient;
  labourRecord?: string;
  antenatalRecord?: string;
  deliveryDateTime: string;
  mode: DeliveryMode;
  indication?: string;
  placentaDelivered?: boolean;
  bloodLossMl?: number;
  complications?: string;
  attendedBy?: PersonRef;
  notes?: string;
}

export type CaesareanUrgency = "elective" | "urgent" | "emergency";
export interface CaesareanLog {
  _id: string;
  patient: MaternityPatient;
  deliveryRecord?: string;
  indication: string;
  urgency: CaesareanUrgency;
  incision?: string;
  findings?: string;
  procedureNotes?: string;
  startTime?: string;
  endTime?: string;
  createdAt?: string;
}

/* ---- postnatal & family planning ---- */
export interface PostnatalVisit {
  _id: string;
  patient: MaternityPatient;
  deliveryRecord?: string;
  visitDate: string;
  daysPostpartum?: number;
  findings?: string;
  advice?: string;
  nextVisitDate?: string;
}

export type FamilyPlanningMethod =
  | "pill"
  | "injectable"
  | "implant"
  | "iud"
  | "condom"
  | "sterilisation"
  | "natural"
  | "other";
export interface FamilyPlanningRecord {
  _id: string;
  patient: MaternityPatient;
  method: FamilyPlanningMethod;
  startDate: string;
  nextAppointment?: string;
  notes?: string;
  isActive: boolean;
}

/* ---- newborn ---- */
export type NewbornStatus = "well" | "nicu" | "scbu" | "transferred" | "deceased" | "discharged";
export type NewbornSex = "male" | "female" | "unknown";
export interface Newborn {
  _id: string;
  mother: MaternityPatient;
  deliveryRecord?: string;
  babyPatient?: string;
  birthDateTime: string;
  sex: NewbornSex;
  birthWeightGrams: number;
  lengthCm?: number;
  headCircumferenceCm?: number;
  apgar1?: number;
  apgar5?: number;
  apgar10?: number;
  resuscitation?: string;
  congenitalAnomalies?: string;
  status: NewbornStatus;
  notes?: string;
}

export interface NicuAdmission {
  _id: string;
  newborn:
    | string
    | { _id: string; sex?: NewbornSex; birthWeightGrams?: number; birthDateTime?: string; mother?: MaternityPatient };
  admittedAt: string;
  dischargedAt?: string;
  reason: string;
  diagnosis?: string;
  bedCode?: string;
  status: "admitted" | "discharged" | "transferred" | "deceased";
  notes?: string;
}

export interface NewbornScreeningTest {
  name: string;
  result?: string;
  status?: string;
}
export interface NewbornScreening {
  _id: string;
  newborn: string;
  screeningDate: string;
  tests: NewbornScreeningTest[];
  notes?: string;
}

/* ---- child health ---- */
export type ImmunizationStatus = "scheduled" | "given" | "missed" | "contraindicated";
export interface ImmunizationRecord {
  _id: string;
  patient: MaternityPatient;
  vaccineName: string;
  doseNumber?: number;
  scheduledDate?: string;
  administeredDate?: string;
  batchNumber?: string;
  site?: string;
  status: ImmunizationStatus;
  notes?: string;
}

export interface GrowthRecord {
  _id: string;
  patient: string;
  measuredAt: string;
  ageMonths?: number;
  weightKg?: number;
  lengthCm?: number;
  headCircumferenceCm?: number;
  muacCm?: number;
  weightForAgeZ?: number;
  heightForAgeZ?: number;
  notes?: string;
}

export interface PaediatricVisit {
  _id: string;
  patient: MaternityPatient;
  visitDate: string;
  chiefComplaint?: string;
  examination?: string;
  diagnosis?: string;
  treatment?: string;
  followUpDate?: string;
  notes?: string;
}

export type NutritionStatus = "active" | "completed" | "defaulted" | "transferred";
export interface NutritionEnrolment {
  _id: string;
  patient: MaternityPatient;
  programme: string;
  enrolledAt: string;
  dischargedAt?: string;
  status: NutritionStatus;
  notes?: string;
}

export interface MaternityDashboardData {
  activeANC: number;
  highRisk: number;
  inLabour: number;
  deliveriesToday: number;
  nicuAdmitted: number;
}

/* -------------------------------------------------------------------------- */
/*  State                                                                     */
/* -------------------------------------------------------------------------- */

export interface MaternityState {
  dashboard: MaternityDashboardData | null;
  anc: AntenatalRecord[];
  activeAnc: AntenatalRecord | null;
  ancVisits: AncVisit[];
  investigations: AncInvestigation[];
  labour: LabourRecord[];
  deliveries: DeliveryRecord[];
  caesareans: CaesareanLog[];
  postnatal: PostnatalVisit[];
  familyPlanning: FamilyPlanningRecord[];
  newborns: Newborn[];
  nicu: NicuAdmission[];
  /** Server has no list endpoint for screenings — only those recorded this session. */
  screenings: NewbornScreening[];
  immunizations: ImmunizationRecord[];
  growth: GrowthRecord[];
  paediatrics: PaediatricVisit[];
  nutrition: NutritionEnrolment[];
  listLoading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: MaternityState = {
  dashboard: null,
  anc: [],
  activeAnc: null,
  ancVisits: [],
  investigations: [],
  labour: [],
  deliveries: [],
  caesareans: [],
  postnatal: [],
  familyPlanning: [],
  newborns: [],
  nicu: [],
  screenings: [],
  immunizations: [],
  growth: [],
  paediatrics: [],
  nutrition: [],
  listLoading: false,
  detailLoading: false,
  saving: false,
  error: null,
  message: null,
};

/* -------------------------------------------------------------------------- */
/*  Thunk factory                                                             */
/* -------------------------------------------------------------------------- */

const base = (facilityId: string) => `/companies/${facilityId}/maternity`;

/**
 * The server answers Zod failures with `message: "Validation failed"` plus an
 * `errors[]` list. getErrorMessage() prefers `message`, which hides which field
 * was wrong, so surface the field errors here.
 */
function errMsg(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiErrorBody | undefined;
    if (body?.errors?.length) {
      return body.errors.map((e) => (e.path ? `${e.path}: ${e.message}` : e.message)).join("; ");
    }
  }
  return getErrorMessage(err, fallback);
}

function mk<A, T>(type: string, fallback: string, fn: (arg: A) => Promise<ApiSuccess<T>>) {
  return createAsyncThunk<ApiSuccess<T>, A, { rejectValue: string }>(
    `maternity/${type}`,
    async (arg, { rejectWithValue }) => {
      try {
        return await fn(arg);
      } catch (err) {
        return rejectWithValue(errMsg(err, fallback));
      }
    },
  );
}

type F = { facilityId: string };

/* ---- dashboard ---- */
export const fetchMaternityDashboard = mk<F, MaternityDashboardData>(
  "fetchDashboard",
  "Failed to load maternity dashboard",
  async ({ facilityId }) => (await api.get(`${base(facilityId)}/dashboard`)).data,
);

/* ---- antenatal ---- */
export type AncPayload = {
  patientId: string;
  gravida: number;
  para?: number;
  abortions?: number;
  livingChildren?: number;
  lmp?: string;
  edd?: string;
  gestationalAgeAtBooking?: string;
  bloodGroup?: string;
  rhesus?: string;
  heightCm?: number;
  weightKg?: number;
  riskLevel?: PregnancyRiskLevel;
  riskFactors?: string[];
  notes?: string;
};
export const fetchAncRecords = mk<
  F & { status?: PregnancyStatus; riskLevel?: PregnancyRiskLevel; patientId?: string },
  AntenatalRecord[]
>("fetchAnc", "Failed to load antenatal records", async ({ facilityId, ...params }) =>
  (await api.get(`${base(facilityId)}/anc`, { params })).data);
export const fetchAncById = mk<F & { id: string }, AntenatalRecord>(
  "fetchAncById",
  "Failed to load antenatal record",
  async ({ facilityId, id }) => (await api.get(`${base(facilityId)}/anc/${id}`)).data,
);
export const registerAnc = mk<F & { payload: AncPayload }, AntenatalRecord>(
  "registerAnc",
  "Could not register antenatal booking",
  async ({ facilityId, payload }) => (await api.post(`${base(facilityId)}/anc`, payload)).data,
);
export const updateAncRisk = mk<
  F & {
    id: string;
    payload: { riskLevel?: PregnancyRiskLevel; riskFactors?: string[]; status?: PregnancyStatus; notes?: string };
  },
  AntenatalRecord
>("updateAncRisk", "Could not update antenatal record", async ({ facilityId, id, payload }) =>
  (await api.patch(`${base(facilityId)}/anc/${id}`, payload)).data);

export type AncVisitPayload = Partial<
  Pick<
    AncVisit,
    | "visitDate"
    | "gestationalAge"
    | "weightKg"
    | "bpSystolic"
    | "bpDiastolic"
    | "fundalHeightCm"
    | "fetalHeartRate"
    | "presentation"
    | "oedema"
    | "urineProtein"
    | "urineSugar"
    | "haemoglobin"
    | "complaints"
    | "findings"
    | "advice"
    | "nextVisitDate"
  >
>;
export const fetchAncVisits = mk<F & { id: string }, AncVisit[]>("fetchAncVisits", "Failed to load ANC visits", async ({ facilityId, id }) =>
  (await api.get(`${base(facilityId)}/anc/${id}/visits`)).data);
export const addAncVisit = mk<F & { id: string; payload: AncVisitPayload }, AncVisit>(
  "addAncVisit",
  "Could not record ANC visit",
  async ({ facilityId, id, payload }) => (await api.post(`${base(facilityId)}/anc/${id}/visits`, payload)).data,
);
export const fetchAncInvestigations = mk<F & { id: string }, AncInvestigation[]>(
  "fetchAncInvestigations",
  "Failed to load investigations",
  async ({ facilityId, id }) => (await api.get(`${base(facilityId)}/anc/${id}/investigations`)).data,
);
export const addAncInvestigation = mk<
  F & { id: string; payload: { type: InvestigationType; name: string; requestedDate?: string; result?: string; notes?: string } },
  AncInvestigation
>("addAncInvestigation", "Could not save investigation", async ({ facilityId, id, payload }) =>
  (await api.post(`${base(facilityId)}/anc/${id}/investigations`, payload)).data);

/* ---- labour & delivery ---- */
export const fetchLabourBoard = mk<F & { status?: LabourStatus }, LabourRecord[]>(
  "fetchLabour",
  "Failed to load labour ward board",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/labour`, { params })).data,
);
export const admitToLabour = mk<
  F & { payload: { patientId: string; antenatalRecordId?: string; bedCode?: string; onsetOfLabour?: string; notes?: string } },
  LabourRecord
>("admitToLabour", "Could not admit to labour ward", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/labour`, payload)).data);
export type PartographPayload = Partial<Omit<PartographObservation, "_id">>;
export const addPartographObservation = mk<F & { id: string; payload: PartographPayload }, LabourRecord>(
  "addPartograph",
  "Could not record partograph observation",
  async ({ facilityId, id, payload }) => (await api.post(`${base(facilityId)}/labour/${id}/partograph`, payload)).data,
);

export const fetchDeliveries = mk<F & { patientId?: string; mode?: DeliveryMode }, DeliveryRecord[]>(
  "fetchDeliveries",
  "Failed to load delivery records",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/delivery`, { params })).data,
);
export type DeliveryPayload = {
  patientId: string;
  labourRecordId?: string;
  antenatalRecordId?: string;
  deliveryDateTime: string;
  mode: DeliveryMode;
  indication?: string;
  bloodLossMl?: number;
  complications?: string;
  notes?: string;
};
export const recordDelivery = mk<F & { payload: DeliveryPayload }, DeliveryRecord>(
  "recordDelivery",
  "Could not record delivery",
  async ({ facilityId, payload }) => (await api.post(`${base(facilityId)}/delivery`, payload)).data,
);

export const fetchCaesareans = mk<F, CaesareanLog[]>("fetchCaesareans", "Failed to load caesarean log", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/caesarean`)).data);
export const logCaesarean = mk<
  F & {
    payload: {
      patientId: string;
      deliveryRecordId?: string;
      indication: string;
      urgency: CaesareanUrgency;
      incision?: string;
      findings?: string;
      procedureNotes?: string;
      startTime?: string;
      endTime?: string;
    };
  },
  CaesareanLog
>("logCaesarean", "Could not log caesarean section", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/caesarean`, payload)).data);

/* ---- postnatal & family planning ---- */
export const fetchPostnatalVisits = mk<F & { patientId?: string }, PostnatalVisit[]>(
  "fetchPostnatal",
  "Failed to load postnatal visits",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/postnatal`, { params })).data,
);
export const addPostnatalVisit = mk<
  F & {
    payload: {
      patientId: string;
      deliveryRecordId?: string;
      visitDate?: string;
      daysPostpartum?: number;
      findings?: string;
      advice?: string;
      nextVisitDate?: string;
    };
  },
  PostnatalVisit
>("addPostnatal", "Could not record postnatal visit", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/postnatal`, payload)).data);

/** `active: false` asks the server for discontinued records too. */
export const fetchFamilyPlanning = mk<F & { active?: boolean }, FamilyPlanningRecord[]>(
  "fetchFamilyPlanning",
  "Failed to load family planning records",
  async ({ facilityId, active }) =>
    (await api.get(`${base(facilityId)}/family-planning`, { params: active === false ? { active: "false" } : {} })).data,
);
export const recordFamilyPlanning = mk<
  F & { payload: { patientId: string; method: FamilyPlanningMethod; startDate?: string; nextAppointment?: string; notes?: string } },
  FamilyPlanningRecord
>("recordFamilyPlanning", "Could not record family planning", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/family-planning`, payload)).data);

/* ---- newborn & NICU ---- */
export const fetchNewborns = mk<F & { status?: NewbornStatus; motherId?: string }, Newborn[]>(
  "fetchNewborns",
  "Failed to load newborn registry",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/newborn`, { params })).data,
);
export type NewbornPayload = {
  motherId: string;
  deliveryRecordId?: string;
  babyPatientId?: string;
  birthDateTime: string;
  sex: NewbornSex;
  birthWeightGrams: number;
  lengthCm?: number;
  headCircumferenceCm?: number;
  apgar1?: number;
  apgar5?: number;
  apgar10?: number;
  resuscitation?: string;
  congenitalAnomalies?: string;
  status?: NewbornStatus;
  notes?: string;
};
export const registerNewborn = mk<F & { payload: NewbornPayload }, Newborn>(
  "registerNewborn",
  "Could not register newborn",
  async ({ facilityId, payload }) => (await api.post(`${base(facilityId)}/newborn`, payload)).data,
);

export const fetchNicu = mk<F, NicuAdmission[]>("fetchNicu", "Failed to load NICU admissions", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/nicu`)).data);
export const admitNicu = mk<
  F & { payload: { newbornId: string; reason: string; diagnosis?: string; bedCode?: string; notes?: string } },
  NicuAdmission
>("admitNicu", "Could not admit to NICU / SCBU", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/nicu`, payload)).data);

export const recordNewbornScreening = mk<
  F & { payload: { newbornId: string; tests: NewbornScreeningTest[]; notes?: string } },
  NewbornScreening
>("recordScreening", "Could not record newborn screening", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/newborn/screening`, payload)).data);

/* ---- child health ---- */
export const fetchImmunizations = mk<F & { patientId?: string }, ImmunizationRecord[]>(
  "fetchImmunizations",
  "Failed to load immunizations",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/immunization`, { params })).data,
);
export const scheduleImmunization = mk<
  F & { payload: { patientId: string; vaccineName: string; doseNumber?: number; scheduledDate?: string; notes?: string } },
  ImmunizationRecord
>("scheduleImmunization", "Could not schedule immunization", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/immunization`, payload)).data);
export const administerImmunization = mk<
  F & { id: string; payload: { batchNumber?: string; site?: string; notes?: string } },
  ImmunizationRecord
>("administerImmunization", "Could not record vaccine administration", async ({ facilityId, id, payload }) =>
  (await api.patch(`${base(facilityId)}/immunization/${id}/administer`, payload)).data);

/** The server requires patientId here (it answers 400 without it). */
export const fetchGrowth = mk<F & { patientId: string }, GrowthRecord[]>("fetchGrowth", "Failed to load growth records", async ({ facilityId, patientId }) =>
  (await api.get(`${base(facilityId)}/growth`, { params: { patientId } })).data);
export const addGrowthRecord = mk<
  F & {
    payload: {
      patientId: string;
      measuredAt?: string;
      ageMonths?: number;
      weightKg?: number;
      lengthCm?: number;
      headCircumferenceCm?: number;
      muacCm?: number;
      notes?: string;
    };
  },
  GrowthRecord
>("addGrowth", "Could not save growth measurement", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/growth`, payload)).data);

export const fetchPaediatricVisits = mk<F & { patientId?: string }, PaediatricVisit[]>(
  "fetchPaediatrics",
  "Failed to load paediatric visits",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/paediatrics`, { params })).data,
);
export const addPaediatricVisit = mk<
  F & {
    payload: {
      patientId: string;
      chiefComplaint?: string;
      examination?: string;
      diagnosis?: string;
      treatment?: string;
      followUpDate?: string;
      notes?: string;
    };
  },
  PaediatricVisit
>("addPaediatrics", "Could not record paediatric visit", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/paediatrics`, payload)).data);

export const fetchNutrition = mk<F & { status?: NutritionStatus }, NutritionEnrolment[]>(
  "fetchNutrition",
  "Failed to load nutrition programme",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/nutrition`, { params })).data,
);
export const enrolNutrition = mk<F & { payload: { patientId: string; programme: string; notes?: string } }, NutritionEnrolment>(
  "enrolNutrition",
  "Could not enrol in nutrition programme",
  async ({ facilityId, payload }) => (await api.post(`${base(facilityId)}/nutrition`, payload)).data,
);

/* -------------------------------------------------------------------------- */
/*  Slice                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Update endpoints return the raw document (patient = ObjectId string), while
 * list endpoints return it populated. Keep the populated reference when merging.
 */
const POPULATED_KEYS = ["patient", "mother", "newborn"] as const;
function mergeKeep<T extends { _id: string }>(old: T, next: T): T {
  const out: any = { ...old, ...next };
  POPULATED_KEYS.forEach((k) => {
    if (typeof (next as any)[k] === "string" && old && typeof (old as any)[k] === "object") out[k] = (old as any)[k];
  });
  return out;
}
const replace = <T extends { _id: string }>(list: T[], item?: T) =>
  item ? list.map((x) => (x._id === item._id ? mergeKeep(x, item) : x)) : list;

const maternitySlice = createSlice({
  name: "maternity",
  initialState,
  reducers: {
    clearMaternityError(s) {
      s.error = null;
      s.message = null;
    },
    clearActiveAnc(s) {
      s.activeAnc = null;
      s.ancVisits = [];
      s.investigations = [];
    },
  },
  extraReducers: (b) => {
    const fail = (s: MaternityState, a: any) => {
      s.listLoading = false;
      s.detailLoading = false;
      s.saving = false;
      s.error = a.payload || "Request failed";
    };
    const saving = (s: MaternityState) => {
      s.saving = true;
      s.error = null;
    };
    const saved = (s: MaternityState, a: any, fallback: string) => {
      s.saving = false;
      s.message = a.payload.message || fallback;
    };

    /* lists */
    const lists: Array<[any, (s: MaternityState, p: any) => void]> = [
      [fetchMaternityDashboard, (s, p) => void (s.dashboard = p || null)],
      [fetchAncRecords, (s, p) => void (s.anc = p || [])],
      [fetchAncVisits, (s, p) => void (s.ancVisits = p || [])],
      [fetchAncInvestigations, (s, p) => void (s.investigations = p || [])],
      [fetchLabourBoard, (s, p) => void (s.labour = p || [])],
      [fetchDeliveries, (s, p) => void (s.deliveries = p || [])],
      [fetchCaesareans, (s, p) => void (s.caesareans = p || [])],
      [fetchPostnatalVisits, (s, p) => void (s.postnatal = p || [])],
      [fetchFamilyPlanning, (s, p) => void (s.familyPlanning = p || [])],
      [fetchNewborns, (s, p) => void (s.newborns = p || [])],
      [fetchNicu, (s, p) => void (s.nicu = p || [])],
      [fetchImmunizations, (s, p) => void (s.immunizations = p || [])],
      [fetchGrowth, (s, p) => void (s.growth = p || [])],
      [fetchPaediatricVisits, (s, p) => void (s.paediatrics = p || [])],
      [fetchNutrition, (s, p) => void (s.nutrition = p || [])],
    ];
    lists.forEach(([thunk, assign]) => {
      b.addCase(thunk.pending, (s: MaternityState) => {
        s.listLoading = true;
        s.error = null;
      })
        .addCase(thunk.fulfilled, (s: MaternityState, a: any) => {
          s.listLoading = false;
          assign(s, a.payload.data);
        })
        .addCase(thunk.rejected, fail);
    });

    /* single ANC record */
    b.addCase(fetchAncById.pending, (s) => {
      s.detailLoading = true;
      s.error = null;
    })
      .addCase(fetchAncById.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.activeAnc = a.payload.data || null;
      })
      .addCase(fetchAncById.rejected, fail);

    /* creates — lists re-fetch on mount, so only flip the saving flag here
       (a freshly created doc is not populated and would render raw ids). */
    const creates: Array<[any, string]> = [
      [registerAnc, "Antenatal booking registered"],
      [addAncVisit, "ANC visit recorded"],
      [addAncInvestigation, "Investigation saved"],
      [admitToLabour, "Admitted to labour ward"],
      [recordDelivery, "Delivery recorded"],
      [logCaesarean, "Caesarean section logged"],
      [addPostnatalVisit, "Postnatal visit recorded"],
      [recordFamilyPlanning, "Family planning recorded"],
      [registerNewborn, "Newborn registered"],
      [admitNicu, "Admitted to NICU / SCBU"],
      [scheduleImmunization, "Immunization scheduled"],
      [addGrowthRecord, "Growth measurement saved"],
      [addPaediatricVisit, "Paediatric visit recorded"],
      [enrolNutrition, "Enrolled in nutrition programme"],
    ];
    creates.forEach(([thunk, msg]) => {
      b.addCase(thunk.pending, saving)
        .addCase(thunk.fulfilled, (s: MaternityState, a: any) => saved(s, a, msg))
        .addCase(thunk.rejected, fail);
    });

    /* updates that return the changed document */
    b.addCase(updateAncRisk.pending, saving)
      .addCase(updateAncRisk.fulfilled, (s, a) => {
        saved(s, a, "Antenatal record updated");
        const d = a.payload.data;
        if (!d) return;
        s.anc = replace(s.anc, d);
        if (s.activeAnc?._id === d._id) s.activeAnc = mergeKeep(s.activeAnc, d);
      })
      .addCase(updateAncRisk.rejected, fail);

    b.addCase(addPartographObservation.pending, saving)
      .addCase(addPartographObservation.fulfilled, (s, a) => {
        saved(s, a, "Partograph observation recorded");
        s.labour = replace(s.labour, a.payload.data);
      })
      .addCase(addPartographObservation.rejected, fail);

    b.addCase(administerImmunization.pending, saving)
      .addCase(administerImmunization.fulfilled, (s, a) => {
        saved(s, a, "Vaccine administration recorded");
        s.immunizations = replace(s.immunizations, a.payload.data);
      })
      .addCase(administerImmunization.rejected, fail);

    /* screenings: session-only list (no GET endpoint on the server) */
    b.addCase(recordNewbornScreening.pending, saving)
      .addCase(recordNewbornScreening.fulfilled, (s, a) => {
        saved(s, a, "Newborn screening recorded");
        if (a.payload.data) s.screenings = [a.payload.data, ...s.screenings];
      })
      .addCase(recordNewbornScreening.rejected, fail);
  },
});

export const { clearMaternityError, clearActiveAnc } = maternitySlice.actions;
export default maternitySlice.reducer;
