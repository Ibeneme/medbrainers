import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type PersonRef = string | { _id: string; firstName?: string; lastName?: string; email?: string };
type PatientRef =
  | string
  | {
    _id: string;
    mrn?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    bloodGroup?: string;
    allergies?: Array<{ _id?: string; substance: string; reaction?: string; severity?: string }>;
  };

export type BloodGroup = "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-";
export type BloodProduct =
  | "whole_blood"
  | "packed_red_cells"
  | "platelet_concentrate"
  | "apheresis_platelets"
  | "fresh_frozen_plasma"
  | "cryoprecipitate"
  | "cryo_poor_plasma";

export type DonorStatus = "active" | "deferred_temporary" | "deferred_permanent" | "inactive";
export type DonorType = "voluntary" | "replacement" | "autologous" | "directed";
export type DriveStatus = "planned" | "ongoing" | "completed" | "cancelled";
export type DonationType = "whole_blood" | "apheresis_platelets" | "apheresis_plasma";
export type UnitStatus =
  | "quarantine"
  | "available"
  | "reserved"
  | "issued"
  | "transfused"
  | "processed"
  | "discarded";
export type RequestUrgency = "routine" | "urgent" | "emergency";
export type BloodRequestStatus =
  | "pending"
  | "sample_received"
  | "crossmatching"
  | "ready"
  | "partially_issued"
  | "issued"
  | "completed"
  | "rejected"
  | "cancelled";
export type CrossmatchMethod = "electronic" | "immediate_spin" | "antiglobulin";
export type CrossmatchResult = "compatible" | "incompatible";
export type ReactionType =
  | "febrile_non_hemolytic"
  | "allergic"
  | "acute_hemolytic"
  | "delayed_hemolytic"
  | "trali"
  | "taco"
  | "septic"
  | "anaphylactic"
  | "other";
export type ReactionSeverity = "mild" | "moderate" | "severe" | "life_threatening";
export type ReactionStatus = "reported" | "investigating" | "closed";
export type StorageType = "blood_fridge" | "plasma_freezer" | "platelet_agitator" | "other";
export type DiscardReason =
  | "expired"
  | "tti_reactive"
  | "incomplete_collection"
  | "broken"
  | "leaked"
  | "returned_out_of_cold_chain"
  | "qc_fail"
  | "other";

export interface BloodBankSettings {
  minAgeYears: number;
  maxAgeYears: number;
  minWeightKg: number;
  minHbMale: number;
  minHbFemale: number;
  donationIntervalDaysMale: number;
  donationIntervalDaysFemale: number;
  screeningValidityHours: number;
  expiryAlertDays: number;
  minStockPerGroup: number;
  crossmatchValidityHours: number;
  returnWindowMinutes: number;
  transfusionMaxHours: number;
  requireDualGroupingVerification: boolean;
  requiredTtiTests: string[];
  shelfLifeDays: Record<string, number>;
}

export interface BloodBankSetup {
  _id: string;
  company: string;
  name: string;
  licenseNumber?: string;
  medicalDirector?: PersonRef | null;
  phone?: string;
  email?: string;
  address?: string;
  settings: BloodBankSettings;
  isActive?: boolean;
}

export interface BloodDonor {
  _id: string;
  donorNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: "male" | "female" | "other";
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  nationalId?: string;
  occupation?: string;
  address?: { street?: string; city?: string; state?: string; country?: string };
  donorType: DonorType;
  status: DonorStatus;
  bloodGroup?: BloodGroup;
  reportedBloodGroup?: BloodGroup;
  lastDonationAt?: string;
  totalDonations?: number;
  deferralUntil?: string;
  deferralReason?: string;
  eligibility?: { eligible: boolean; reasons: string[]; nextEligibleAt?: string };
  registeredBy?: PersonRef;
  createdAt?: string;
}

export interface DonorScreening {
  _id: string;
  screeningNumber: string;
  donor: string | BloodDonor;
  drive?: string | { _id: string; driveNumber: string; name: string };
  screenedBy?: PersonRef;
  screenedAt: string;
  vitals: {
    weightKg: number;
    heightCm?: number;
    hemoglobin: number;
    systolic: number;
    diastolic: number;
    pulse: number;
    temperatureC: number;
  };
  riskFactors: string[];
  flags: Array<{ code: string; message: string }>;
  outcome: "eligible" | "deferred_temporary" | "deferred_permanent";
  deferralUntil?: string;
  deferralReason?: string;
  used: boolean;
  notes?: string;
}

export interface BloodDrive {
  _id: string;
  driveNumber: string;
  name: string;
  location: string;
  scheduledAt: string;
  endsAt?: string;
  organizer?: string;
  contactPerson?: string;
  contactPhone?: string;
  targetUnits: number;
  team?: PersonRef[];
  status: DriveStatus;
  notes?: string;
  stats?: { screened: number; deferred: number; collected: number };
  createdBy?: PersonRef;
}

export interface Donation {
  _id: string;
  donationNumber: string;
  donor: string | BloodDonor;
  screening: string;
  drive?: string | { _id: string; driveNumber: string; name: string };
  donationType: DonationType;
  bagType?: string;
  volumeMl: number;
  collectedAt: string;
  collectedBy?: PersonRef;
  outcome: "complete" | "incomplete";
  status: "collected" | "released" | "discarded";
  adverseReaction?: { occurred: boolean; type?: string; severity?: string; notes?: string };
  grouping: {
    group?: BloodGroup;
    method?: string;
    antibodyScreen?: string;
    antibodies?: string[];
    status: "pending" | "recorded" | "confirmed" | "discrepancy";
    performedBy?: PersonRef;
    confirmedBy?: PersonRef;
  };
  tti: {
    status: "pending" | "cleared" | "reactive" | "indeterminate";
    results: Array<{ test: string; result: string; method?: string; testedBy?: PersonRef; testedAt?: string }>;
  };
  notes?: string;
  units?: Array<{ _id: string; unitNumber: string; product: BloodProduct; status: UnitStatus }>;
}

export interface BloodUnit {
  _id: string;
  unitNumber: string;
  donation: string;
  parent?: string;
  product: BloodProduct;
  bloodGroup?: BloodGroup;
  volumeMl: number;
  collectedAt: string;
  expiryDate: string;
  status: UnitStatus;
  storageUnit?: string | { _id: string; code: string; name: string; type?: string };
  location?: string;
  ttiStatus?: string;
  groupingStatus?: string;
  qcHold?: { active: boolean; reason?: string; at?: string; by?: PersonRef };
  reservedFor?: { request: string; patient: string; until: string };
  history?: Array<{ status: string; at: string; by?: PersonRef; note?: string }>;
}

export interface BloodStorageUnit {
  _id: string;
  code: string;
  name: string;
  type: StorageType;
  location?: string;
  capacity: number;
  minTempC: number;
  maxTempC: number;
  status: string;
  isActive: boolean;
  lastTemperature?: { valueC: number; at: string; inRange: boolean };
  unitsStored?: number;
  alarm?: boolean;
  readingOverdue?: boolean;
}

export interface TemperatureLog {
  _id: string;
  storageUnit: string;
  temperatureC: number;
  recordedAt: string;
  recordedBy?: PersonRef;
  source?: "manual" | "sensor";
  inRange: boolean;
  actionTaken?: string;
}

export interface BloodDiscard {
  _id: string;
  discardNumber: string;
  unit: string;
  unitNumber: string;
  product: BloodProduct;
  bloodGroup?: BloodGroup;
  reason: DiscardReason;
  detail?: string;
  method?: string;
  discardedBy?: PersonRef;
  discardedAt: string;
  automatic?: boolean;
}

export interface BloodRequest {
  _id: string;
  requestNumber: string;
  patient: PatientRef;
  admission?: string;
  requestedBy?: PersonRef;
  location?: string;
  items: Array<{ product: BloodProduct; units: number }>;
  urgency: RequestUrgency;
  status: BloodRequestStatus;
  requiredAt?: string;
  indication: string;
  diagnosis?: string;
  sampleReceivedAt?: string;
  sampleReceivedBy?: PersonRef;
  patientGrouping: {
    group?: BloodGroup;
    antibodyScreen?: string;
    antibodies?: string[];
    status: "pending" | "recorded" | "confirmed" | "discrepancy";
    performedBy?: PersonRef;
    confirmedBy?: PersonRef;
  };
  historicalGroup?: BloodGroup;
  notesList?: Array<{ author: PersonRef; text: string; createdAt: string }>;
  progress?: { requested: number; crossmatched: number; issued: number; transfused: number };
  createdAt?: string;
}

export interface Crossmatch {
  _id: string;
  crossmatchNumber: string;
  request: string | { _id: string; requestNumber: string };
  patient: PatientRef;
  unit: string;
  unitNumber: string;
  product: BloodProduct;
  patientGroup: BloodGroup;
  unitGroup: BloodGroup;
  method: CrossmatchMethod;
  result: CrossmatchResult;
  status: "active" | "voided" | "expired" | "used";
  performedBy?: PersonRef;
  performedAt: string;
  validUntil: string;
  warning?: string;
  notes?: string;
}

export interface BloodIssue {
  _id: string;
  issueNumber: string;
  request: string | { _id: string; requestNumber: string };
  patient: PatientRef;
  unit: string;
  unitNumber: string;
  product: BloodProduct;
  bloodGroup?: BloodGroup;
  crossmatch?: string;
  issuedBy?: PersonRef;
  issuedAt: string;
  issuedTo: string;
  destination?: string;
  status: "issued" | "transfusing" | "transfused" | "returned";
  emergency?: { reason: string; authorisedBy: string; uncrossmatched: boolean };
  retrospectiveCrossmatch?: { required: boolean; done: boolean; result?: CrossmatchResult; doneAt?: string };
  returned?: { at: string; reason: string; outcome: "restocked" | "discarded" };
  notes?: string;
}

export interface Transfusion {
  _id: string;
  transfusionNumber: string;
  patient: PatientRef;
  request: string;
  issue: string;
  unit: string;
  unitNumber: string;
  product: BloodProduct;
  bloodGroup?: BloodGroup;
  startedAt: string;
  startedBy?: PersonRef;
  endedAt?: string;
  status: "in_progress" | "completed" | "stopped";
  durationMinutes?: number;
  volumeTransfusedMl?: number;
  bedsideCheck?: {
    patientIdentityVerified: boolean;
    wristbandMatched: boolean;
    unitLabelMatched: boolean;
    compatibilityLabelChecked: boolean;
    firstChecker?: PersonRef;
    secondChecker?: PersonRef;
  };
  preVitals?: Record<string, number | undefined>;
  postVitals?: Record<string, number | undefined>;
  vitals?: Array<Record<string, any> & { at: string; by?: PersonRef }>;
  notes?: string;
}

export interface TransfusionReaction {
  _id: string;
  reactionNumber: string;
  transfusion: string | { _id: string; transfusionNumber: string };
  patient: PatientRef;
  unitNumber: string;
  product: BloodProduct;
  reportedBy?: PersonRef;
  reportedAt: string;
  onsetAt?: string;
  type: ReactionType;
  severity: ReactionSeverity;
  status: ReactionStatus;
  imputability?: string;
  symptoms?: string[];
  actionsTaken?: string;
  transfusionStopped?: boolean;
  outcome?: string;
  notes?: string;
}

export interface BloodBankDashboardData {
  activeDonors: number;
  donationsToday: number;
  readyToDonate: number;
  awaitingGrouping: number;
  awaitingTti: number;
  availableUnits: number;
  expiringSoon: number;
  expired: number;
  quarantined: number;
  openRequests: number;
  emergencyRequests: number;
  issuedToday: number;
  transfusionsInProgress: number;
  openReactions: number;
  storageAlarms: number;
  pendingRetrospectiveCrossmatches: number;
  lowStockGroups: string[];
  redCellsByGroup: Array<{ group: BloodGroup; available: number; reserved: number; minimum: number; low: boolean }>;
  expiryAlertDays: number;
  upcomingDrives: BloodDrive[];
}

export interface BloodBankReport {
  period: { from: string; to: string };
  collection: any;
  screening: any;
  tti: any;
  wastage: any;
  demand: any;
  utilisation: any;
  reactions: any;
  stockNow: any;
}

export interface BloodBankState {
  setup: BloodBankSetup | null;
  dashboard: BloodBankDashboardData | null;
  donors: BloodDonor[];
  activeDonor: BloodDonor | null;
  screenings: DonorScreening[];
  activeScreening: DonorScreening | null;
  drives: BloodDrive[];
  activeDrive: BloodDrive | null;
  donations: Donation[];
  activeDonation: Donation | null;
  units: BloodUnit[];
  activeUnit: BloodUnit | null;
  storage: BloodStorageUnit[];
  temperatures: TemperatureLog[];
  discards: BloodDiscard[];
  requests: BloodRequest[];
  activeRequest: BloodRequest | null;
  crossmatches: Crossmatch[];
  issues: BloodIssue[];
  transfusions: Transfusion[];
  activeTransfusion: Transfusion | null;
  reactions: TransfusionReaction[];
  activeReaction: TransfusionReaction | null;
  report: BloodBankReport | null;
  listLoading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
}

const initialState: BloodBankState = {
  setup: null,
  dashboard: null,
  donors: [],
  activeDonor: null,
  screenings: [],
  activeScreening: null,
  drives: [],
  activeDrive: null,
  donations: [],
  activeDonation: null,
  units: [],
  activeUnit: null,
  storage: [],
  temperatures: [],
  discards: [],
  requests: [],
  activeRequest: null,
  crossmatches: [],
  issues: [],
  transfusions: [],
  activeTransfusion: null,
  reactions: [],
  activeReaction: null,
  report: null,
  listLoading: false,
  detailLoading: false,
  saving: false,
  error: null,
  message: null,
};

/* -------------------------------------------------------------------------- */
/*  Thunk factory                                                             */
/* -------------------------------------------------------------------------- */

const base = (facilityId: string) => `/companies/${facilityId}/blood-bank`;

function mk<A, T>(type: string, fallback: string, fn: (arg: A) => Promise<ApiSuccess<T>>) {
  return createAsyncThunk<ApiSuccess<T>, A, { rejectValue: string }>(`bloodBank/${type}`, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, fallback));
    }
  });
}

type F = { facilityId: string };

/* ---- setup & dashboard ---- */
export const fetchBloodBankSetup = mk<F, BloodBankSetup>("fetchSetup", "Failed to load blood bank setup", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/setup`)).data);
export const saveBloodBankSetup = mk<F & { payload: Partial<BloodBankSetup> }, BloodBankSetup>("saveSetup", "Could not save blood bank setup", async ({ facilityId, payload }) =>
  (await api.put(`${base(facilityId)}/setup`, payload)).data);
export const fetchBloodBankDashboard = mk<F, BloodBankDashboardData>("fetchDashboard", "Failed to load blood bank dashboard", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/dashboard`)).data);

/* ---- donors ---- */
export const fetchDonors = mk<F & { search?: string; status?: string; bloodGroup?: string; donorType?: string; limit?: number }, BloodDonor[]>(
  "fetchDonors", "Failed to load donors",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/donors`, { params })).data);
export const fetchDonorById = mk<F & { donorId: string }, BloodDonor>("fetchDonor", "Failed to load donor", async ({ facilityId, donorId }) =>
  (await api.get(`${base(facilityId)}/donors/${donorId}`)).data);
export const checkDonorEligibility = mk<F & { donorId: string; donationType?: string }, { eligible: boolean; reasons: string[]; nextEligibleAt?: string }>(
  "checkEligibility", "Failed to check eligibility", async ({ facilityId, donorId, donationType }) =>
  (await api.get(`${base(facilityId)}/donors/${donorId}/eligibility`, { params: { donationType } })).data);
export type DonorPayload = {
  patientId?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: "male" | "female" | "other";
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  nationalId?: string;
  occupation?: string;
  address?: any;
  donorType?: DonorType;
  replacementFor?: string;
  reportedBloodGroup?: BloodGroup;
  emergencyContact?: any;
  notes?: string;
};
export const createDonor = mk<F & { payload: DonorPayload }, BloodDonor>("createDonor", "Could not register donor", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/donors`, payload)).data);
export const updateDonor = mk<F & { donorId: string; payload: Partial<DonorPayload> & { status?: DonorStatus; deferralUntil?: string | null; deferralReason?: string } }, BloodDonor>(
  "updateDonor", "Could not update donor", async ({ facilityId, donorId, payload }) =>
  (await api.patch(`${base(facilityId)}/donors/${donorId}`, payload)).data);

/* ---- screening ---- */
export const fetchScreenings = mk<F & { donorId?: string; outcome?: string; driveId?: string; readyOnly?: boolean; from?: string; to?: string; limit?: number }, DonorScreening[]>(
  "fetchScreenings", "Failed to load screenings",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/screening`, { params })).data);
export const fetchScreeningById = mk<F & { screeningId: string }, DonorScreening>("fetchScreening", "Failed to load screening", async ({ facilityId, screeningId }) =>
  (await api.get(`${base(facilityId)}/screening/${screeningId}`)).data);
export const createScreening = mk<F & { payload: any }, DonorScreening>("createScreening", "Could not record screening", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/screening`, payload)).data);

/* ---- drives ---- */
export const fetchDrives = mk<F & { status?: string; from?: string; to?: string; limit?: number }, BloodDrive[]>(
  "fetchDrives", "Failed to load drives",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/drives`, { params })).data);
export const fetchDriveById = mk<F & { driveId: string }, BloodDrive>("fetchDrive", "Failed to load drive", async ({ facilityId, driveId }) =>
  (await api.get(`${base(facilityId)}/drives/${driveId}`)).data);
export const createDrive = mk<F & { payload: any }, BloodDrive>("createDrive", "Could not schedule drive", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/drives`, payload)).data);
export const updateDrive = mk<F & { driveId: string; payload: any }, BloodDrive>("updateDrive", "Could not update drive", async ({ facilityId, driveId, payload }) =>
  (await api.patch(`${base(facilityId)}/drives/${driveId}`, payload)).data);

/* ---- donations ---- */
export const fetchDonations = mk<F & { status?: string; donorId?: string; driveId?: string; ttiStatus?: string; from?: string; to?: string; limit?: number }, Donation[]>(
  "fetchDonations", "Failed to load donations",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/donations`, { params })).data);
export const fetchDonationById = mk<F & { donationId: string }, Donation>("fetchDonation", "Failed to load donation", async ({ facilityId, donationId }) =>
  (await api.get(`${base(facilityId)}/donations/${donationId}`)).data);
export const createDonation = mk<F & { payload: any }, { donation: Donation; unit?: BloodUnit }>("createDonation", "Could not record donation", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/donations`, payload)).data);
export const updateDonation = mk<F & { donationId: string; payload: any }, Donation>("updateDonation", "Could not update donation", async ({ facilityId, donationId, payload }) =>
  (await api.patch(`${base(facilityId)}/donations/${donationId}`, payload)).data);

/* ---- grouping ---- */
export const fetchGroupingQueue = mk<F & { limit?: number }, { donations: Donation[]; requests: BloodRequest[] }>(
  "fetchGrouping", "Failed to load grouping queue", async ({ facilityId, ...params }) =>
  (await api.get(`${base(facilityId)}/grouping`, { params })).data);
export const recordDonationGrouping = mk<F & { donationId: string; payload: any }, Donation>("recordDonationGrouping", "Could not record grouping", async ({ facilityId, donationId, payload }) =>
  (await api.put(`${base(facilityId)}/grouping/donations/${donationId}`, payload)).data);
export const confirmDonationGrouping = mk<F & { donationId: string }, Donation>("confirmDonationGrouping", "Could not confirm grouping", async ({ facilityId, donationId }) =>
  (await api.post(`${base(facilityId)}/grouping/donations/${donationId}/confirm`)).data);
export const recordPatientGrouping = mk<F & { requestId: string; payload: any }, BloodRequest>("recordPatientGrouping", "Could not record patient grouping", async ({ facilityId, requestId, payload }) =>
  (await api.put(`${base(facilityId)}/grouping/requests/${requestId}`, payload)).data);
export const confirmPatientGrouping = mk<F & { requestId: string }, BloodRequest>("confirmPatientGrouping", "Could not confirm patient grouping", async ({ facilityId, requestId }) =>
  (await api.post(`${base(facilityId)}/grouping/requests/${requestId}/confirm`)).data);

/* ---- TTI testing ---- */
export const fetchTestingQueue = mk<F & { status?: string; limit?: number }, Donation[]>("fetchTesting", "Failed to load testing queue", async ({ facilityId, ...params }) =>
  (await api.get(`${base(facilityId)}/testing`, { params })).data);
export const fetchTestingByDonation = mk<F & { donationId: string }, any>("fetchTestingDetail", "Failed to load testing details", async ({ facilityId, donationId }) =>
  (await api.get(`${base(facilityId)}/testing/donations/${donationId}`)).data);
export const recordTti = mk<F & { donationId: string; payload: any }, Donation>("recordTti", "Could not record TTI results", async ({ facilityId, donationId, payload }) =>
  (await api.put(`${base(facilityId)}/testing/donations/${donationId}`, payload)).data);

/* ---- components ---- */
export const fetchComponents = mk<F & { product?: string; status?: string; search?: string; limit?: number }, { pendingProcessing: BloodUnit[]; components: BloodUnit[] }>(
  "fetchComponents", "Failed to load components", async ({ facilityId, ...params }) =>
  (await api.get(`${base(facilityId)}/components`, { params })).data);
export const processComponents = mk<F & { payload: { unitId: string; outputs: Array<{ product: BloodProduct; volumeMl?: number }> } }, { parent: BloodUnit; components: BloodUnit[] }>(
  "processComponents", "Could not process components", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/components/process`, payload)).data);

/* ---- inventory / units ---- */
export const fetchBloodBankInventory = mk<F, any>("fetchInventory", "Failed to load inventory", async ({ facilityId }) =>
  (await api.get(`${base(facilityId)}/inventory`)).data);
export const fetchUnits = mk<F & { status?: string; product?: string; bloodGroup?: string; storageUnitId?: string; search?: string; expiringWithinDays?: number; expired?: boolean; limit?: number }, BloodUnit[]>(
  "fetchUnits", "Failed to load units",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/units`, { params })).data);
export const fetchUnitById = mk<F & { unitId: string }, BloodUnit>("fetchUnit", "Failed to load unit", async ({ facilityId, unitId }) =>
  (await api.get(`${base(facilityId)}/units/${unitId}`)).data);
export const assignStorage = mk<F & { unitId: string; payload: { storageUnitId: string | null; location?: string } }, BloodUnit>("assignStorage", "Could not assign storage", async ({ facilityId, unitId, payload }) =>
  (await api.patch(`${base(facilityId)}/units/${unitId}/storage`, payload)).data);
export const releaseUnit = mk<F & { unitId: string; payload?: { note?: string } }, BloodUnit>("releaseUnit", "Could not release unit", async ({ facilityId, unitId, payload }) =>
  (await api.post(`${base(facilityId)}/units/${unitId}/release`, payload || {})).data);
export const discardUnit = mk<F & { unitId: string; payload: { reason: DiscardReason; detail?: string; method?: string; witness?: string } }, any>("discardUnit", "Could not discard unit", async ({ facilityId, unitId, payload }) =>
  (await api.post(`${base(facilityId)}/units/${unitId}/discard`, payload)).data);

/* ---- storage ---- */
export const fetchStorage = mk<F & { includeInactive?: boolean }, BloodStorageUnit[]>("fetchStorage", "Failed to load storage", async ({ facilityId, includeInactive }) =>
  (await api.get(`${base(facilityId)}/storage`, { params: { includeInactive } })).data);
export const createStorage = mk<F & { payload: any }, BloodStorageUnit>("createStorage", "Could not create storage unit", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/storage`, payload)).data);
export const updateStorage = mk<F & { storageId: string; payload: any }, BloodStorageUnit>("updateStorage", "Could not update storage", async ({ facilityId, storageId, payload }) =>
  (await api.patch(`${base(facilityId)}/storage/${storageId}`, payload)).data);
export const fetchTemperatures = mk<F & { storageId: string; from?: string; to?: string; limit?: number }, TemperatureLog[]>("fetchTemperatures", "Failed to load temperatures", async ({ facilityId, storageId, ...params }) =>
  (await api.get(`${base(facilityId)}/storage/${storageId}/temperatures`, { params })).data);
export const logTemperature = mk<F & { storageId: string; payload: { temperatureC: number; recordedAt?: string; source?: "manual" | "sensor"; actionTaken?: string } }, TemperatureLog>(
  "logTemperature", "Could not log temperature", async ({ facilityId, storageId, payload }) =>
  (await api.post(`${base(facilityId)}/storage/${storageId}/temperatures`, payload)).data);
export const quarantineStorage = mk<F & { storageId: string; payload: { reason: string } }, { quarantined: number }>("quarantineStorage", "Could not quarantine storage", async ({ facilityId, storageId, payload }) =>
  (await api.post(`${base(facilityId)}/storage/${storageId}/quarantine`, payload)).data);

/* ---- expiry & discards ---- */
export const fetchExpiryOverview = mk<F & { days?: number }, { expired: BloodUnit[]; expiringSoon: BloodUnit[]; recentDiscards: BloodDiscard[] }>(
  "fetchExpiry", "Failed to load expiry overview", async ({ facilityId, days }) =>
  (await api.get(`${base(facilityId)}/expiry`, { params: { days } })).data);
export const discardExpired = mk<F & { payload?: { witness?: string; method?: string } }, { discarded: number }>("discardExpired", "Could not discard expired units", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/expiry/discard-expired`, payload || {})).data);
export const fetchDiscards = mk<F & { reason?: string; from?: string; to?: string; limit?: number }, BloodDiscard[]>("fetchDiscards", "Failed to load discards", async ({ facilityId, ...params }) =>
  (await api.get(`${base(facilityId)}/discards`, { params })).data);

/* ---- requests ---- */
export const fetchRequests = mk<F & { status?: string; urgency?: string; patientId?: string; openOnly?: boolean; limit?: number }, BloodRequest[]>(
  "fetchRequests", "Failed to load requests",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/requests`, { params })).data);
export const fetchRequestById = mk<F & { requestId: string }, BloodRequest>("fetchRequest", "Failed to load request", async ({ facilityId, requestId }) =>
  (await api.get(`${base(facilityId)}/requests/${requestId}`)).data);
export const createRequest = mk<F & { payload: any }, BloodRequest>("createRequest", "Could not create request", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/requests`, payload)).data);
export const receiveSample = mk<F & { requestId: string; payload?: { sampleLabel?: string } }, BloodRequest>("receiveSample", "Could not receive sample", async ({ facilityId, requestId, payload }) =>
  (await api.post(`${base(facilityId)}/requests/${requestId}/sample`, payload || {})).data);
export const rejectRequest = mk<F & { requestId: string; payload: { reason: string } }, BloodRequest>("rejectRequest", "Could not reject request", async ({ facilityId, requestId, payload }) =>
  (await api.post(`${base(facilityId)}/requests/${requestId}/reject`, payload)).data);
export const cancelRequest = mk<F & { requestId: string; payload?: { reason?: string } }, BloodRequest>("cancelRequest", "Could not cancel request", async ({ facilityId, requestId, payload }) =>
  (await api.post(`${base(facilityId)}/requests/${requestId}/cancel`, payload || {})).data);
export const closeRequest = mk<F & { requestId: string; payload?: { reason?: string } }, BloodRequest>("closeRequest", "Could not close request", async ({ facilityId, requestId, payload }) =>
  (await api.post(`${base(facilityId)}/requests/${requestId}/close`, payload || {})).data);
export const addBloodRequestNote = mk<F & { requestId: string; payload: { text: string } }, BloodRequest>("addRequestNote", "Could not add note", async ({ facilityId, requestId, payload }) =>
  (await api.post(`${base(facilityId)}/requests/${requestId}/notes`, payload)).data);
export const suggestUnits = mk<F & { requestId: string }, any>("suggestUnits", "Failed to get unit suggestions", async ({ facilityId, requestId }) =>
  (await api.get(`${base(facilityId)}/requests/${requestId}/suggestions`)).data);

/* ---- crossmatch ---- */
export const fetchCrossmatches = mk<F & { requestId?: string; status?: string; limit?: number }, Crossmatch[]>("fetchCrossmatches", "Failed to load crossmatches", async ({ facilityId, ...params }) =>
  (await api.get(`${base(facilityId)}/crossmatch`, { params })).data);
export const createCrossmatch = mk<F & { payload: { requestId: string; unitId: string; method: CrossmatchMethod; result: CrossmatchResult; notes?: string } }, Crossmatch>(
  "createCrossmatch", "Could not create crossmatch", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/crossmatch`, payload)).data);
export const voidCrossmatch = mk<F & { crossmatchId: string; payload: { reason: string } }, Crossmatch>("voidCrossmatch", "Could not void crossmatch", async ({ facilityId, crossmatchId, payload }) =>
  (await api.post(`${base(facilityId)}/crossmatch/${crossmatchId}/void`, payload)).data);

/* ---- issue ---- */
export const fetchIssues = mk<F & { requestId?: string; status?: string; retrospectivePending?: boolean; from?: string; to?: string; limit?: number }, BloodIssue[]>(
  "fetchIssues", "Failed to load issues",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/issue`, { params })).data);
export const issueUnit = mk<F & { payload: any }, BloodIssue>("issueUnit", "Could not issue unit", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/issue`, payload)).data);
export const returnIssue = mk<F & { issueId: string; payload: { reason: string; coldChainIntact: boolean; temperatureC?: number; returnedAt?: string } }, BloodIssue>(
  "returnIssue", "Could not return unit", async ({ facilityId, issueId, payload }) =>
  (await api.post(`${base(facilityId)}/issue/${issueId}/return`, payload)).data);
export const completeRetrospectiveCrossmatch = mk<F & { issueId: string; payload: { result: CrossmatchResult; notes?: string } }, BloodIssue>(
  "completeRetroXm", "Could not complete retrospective crossmatch", async ({ facilityId, issueId, payload }) =>
  (await api.patch(`${base(facilityId)}/issue/${issueId}/retrospective-crossmatch`, payload)).data);

/* ---- transfusions ---- */
export const fetchTransfusions = mk<F & { status?: string; patientId?: string; requestId?: string; from?: string; to?: string; limit?: number }, Transfusion[]>(
  "fetchTransfusions", "Failed to load transfusions",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/transfusions`, { params })).data);
export const fetchTransfusionById = mk<F & { transfusionId: string }, Transfusion>("fetchTransfusion", "Failed to load transfusion", async ({ facilityId, transfusionId }) =>
  (await api.get(`${base(facilityId)}/transfusions/${transfusionId}`)).data);
export const startTransfusion = mk<F & { payload: any }, Transfusion>("startTransfusion", "Could not start transfusion", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/transfusions`, payload)).data);
export const recordTransfusionVitals = mk<F & { transfusionId: string; payload: { vitals: Record<string, number | undefined>; notes?: string } }, Transfusion>(
  "recordVitals", "Could not record vitals", async ({ facilityId, transfusionId, payload }) =>
  (await api.post(`${base(facilityId)}/transfusions/${transfusionId}/vitals`, payload)).data);
export const completeTransfusion = mk<F & { transfusionId: string; payload?: any }, Transfusion>("completeTransfusion", "Could not complete transfusion", async ({ facilityId, transfusionId, payload }) =>
  (await api.post(`${base(facilityId)}/transfusions/${transfusionId}/complete`, payload || {})).data);
export const stopTransfusion = mk<F & { transfusionId: string; payload: any }, Transfusion>("stopTransfusion", "Could not stop transfusion", async ({ facilityId, transfusionId, payload }) =>
  (await api.post(`${base(facilityId)}/transfusions/${transfusionId}/stop`, payload)).data);

/* ---- reactions ---- */
export const fetchReactions = mk<F & { status?: string; severity?: string; type?: string; patientId?: string; from?: string; to?: string; limit?: number }, TransfusionReaction[]>(
  "fetchReactions", "Failed to load reactions",
  async ({ facilityId, ...params }) => (await api.get(`${base(facilityId)}/reactions`, { params })).data);
export const fetchReactionById = mk<F & { reactionId: string }, TransfusionReaction>("fetchReaction", "Failed to load reaction", async ({ facilityId, reactionId }) =>
  (await api.get(`${base(facilityId)}/reactions/${reactionId}`)).data);
export const reportReaction = mk<F & { payload: any }, TransfusionReaction>("reportReaction", "Could not report reaction", async ({ facilityId, payload }) =>
  (await api.post(`${base(facilityId)}/reactions`, payload)).data);
export const updateReaction = mk<F & { reactionId: string; payload: any }, TransfusionReaction>("updateReaction", "Could not update reaction", async ({ facilityId, reactionId, payload }) =>
  (await api.patch(`${base(facilityId)}/reactions/${reactionId}`, payload)).data);

/* ---- reports ---- */
export const fetchBloodBankReport = mk<F & { from?: string; to?: string }, BloodBankReport>("fetchReport", "Failed to load reports", async ({ facilityId, ...params }) =>
  (await api.get(`${base(facilityId)}/reports`, { params })).data);

/* -------------------------------------------------------------------------- */
/*  Slice                                                                     */
/* -------------------------------------------------------------------------- */

const bloodBankSlice = createSlice({
  name: "bloodBank",
  initialState,
  reducers: {
    clearBloodBankError(s) {
      s.error = null;
      s.message = null;
    },
    clearActiveDonor(s) { s.activeDonor = null; },
    clearActiveDonation(s) { s.activeDonation = null; },
    clearActiveRequest(s) { s.activeRequest = null; },
    clearActiveUnit(s) { s.activeUnit = null; },
    clearActiveTransfusion(s) { s.activeTransfusion = null; },
    clearActiveReaction(s) { s.activeReaction = null; },
  },
  extraReducers: (b) => {
    const fail = (s: BloodBankState, a: any) => {
      s.listLoading = false;
      s.detailLoading = false;
      s.saving = false;
      s.error = a.payload || "Request failed";
    };
    const saving = (s: BloodBankState) => {
      s.saving = true;
      s.error = null;
    };
    const saved = (s: BloodBankState, a: any, fallback: string) => {
      s.saving = false;
      s.message = a.payload.message || fallback;
    };
    const upsert = <T extends { _id: string }>(list: T[], item?: T) => {
      if (!item) return list;
      const i = list.findIndex((x) => x._id === item._id);
      return i >= 0 ? list.map((x, idx) => (idx === i ? item : x)) : [item, ...list];
    };

    /* lists */
    const lists: Array<[any, (s: BloodBankState, p: any) => void]> = [
      [fetchDonors, (s, p) => void (s.donors = p || [])],
      [fetchScreenings, (s, p) => void (s.screenings = p || [])],
      [fetchDrives, (s, p) => void (s.drives = p || [])],
      [fetchDonations, (s, p) => void (s.donations = p || [])],
      [fetchUnits, (s, p) => void (s.units = p || [])],
      [fetchStorage, (s, p) => void (s.storage = p || [])],
      [fetchDiscards, (s, p) => void (s.discards = p || [])],
      [fetchRequests, (s, p) => void (s.requests = p || [])],
      [fetchCrossmatches, (s, p) => void (s.crossmatches = p || [])],
      [fetchIssues, (s, p) => void (s.issues = p || [])],
      [fetchTransfusions, (s, p) => void (s.transfusions = p || [])],
      [fetchReactions, (s, p) => void (s.reactions = p || [])],
      [fetchBloodBankDashboard, (s, p) => void (s.dashboard = p || null)],
      [fetchBloodBankReport, (s, p) => void (s.report = p || null)],
    ];
    lists.forEach(([thunk, assign]) => {
      b.addCase(thunk.pending, (s: BloodBankState) => {
        s.listLoading = true;
        s.error = null;
      })
        .addCase(thunk.fulfilled, (s: BloodBankState, a: any) => {
          s.listLoading = false;
          assign(s, a.payload.data);
        })
        .addCase(thunk.rejected, fail);
    });

    /* setup */
    b.addCase(fetchBloodBankSetup.fulfilled, (s, a) => void (s.setup = a.payload.data || null))
      .addCase(fetchBloodBankSetup.rejected, fail)
      .addCase(saveBloodBankSetup.pending, saving)
      .addCase(saveBloodBankSetup.fulfilled, (s, a) => {
        saved(s, a, "Blood bank setup saved");
        s.setup = a.payload.data || s.setup;
      })
      .addCase(saveBloodBankSetup.rejected, fail);

    /* details */
    b.addCase(fetchDonorById.pending, (s) => void ((s.detailLoading = true), (s.error = null)))
      .addCase(fetchDonorById.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.activeDonor = a.payload.data || null;
      })
      .addCase(fetchDonorById.rejected, fail)

      .addCase(fetchDonationById.pending, (s) => void ((s.detailLoading = true), (s.error = null)))
      .addCase(fetchDonationById.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.activeDonation = a.payload.data || null;
      })
      .addCase(fetchDonationById.rejected, fail)

      .addCase(fetchRequestById.pending, (s) => void ((s.detailLoading = true), (s.error = null)))
      .addCase(fetchRequestById.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.activeRequest = a.payload.data || null;
      })
      .addCase(fetchRequestById.rejected, fail)

      .addCase(fetchUnitById.pending, (s) => void ((s.detailLoading = true), (s.error = null)))
      .addCase(fetchUnitById.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.activeUnit = a.payload.data || null;
      })
      .addCase(fetchUnitById.rejected, fail)

      .addCase(fetchTransfusionById.pending, (s) => void ((s.detailLoading = true), (s.error = null)))
      .addCase(fetchTransfusionById.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.activeTransfusion = a.payload.data || null;
      })
      .addCase(fetchTransfusionById.rejected, fail)

      .addCase(fetchReactionById.pending, (s) => void ((s.detailLoading = true), (s.error = null)))
      .addCase(fetchReactionById.fulfilled, (s, a) => {
        s.detailLoading = false;
        s.activeReaction = a.payload.data || null;
      })
      .addCase(fetchReactionById.rejected, fail);

    /* mutations – donors */
    b.addCase(createDonor.pending, saving)
      .addCase(createDonor.fulfilled, (s, a) => {
        saved(s, a, "Donor registered");
        if (a.payload.data) s.donors = upsert(s.donors, a.payload.data);
      })
      .addCase(createDonor.rejected, fail)
      .addCase(updateDonor.pending, saving)
      .addCase(updateDonor.fulfilled, (s, a) => {
        saved(s, a, "Donor updated");
        if (a.payload.data) {
          s.donors = upsert(s.donors, a.payload.data);
          if (s.activeDonor?._id === a.payload.data._id) s.activeDonor = a.payload.data;
        }
      })
      .addCase(updateDonor.rejected, fail);

    /* screening */
    b.addCase(createScreening.pending, saving)
      .addCase(createScreening.fulfilled, (s, a) => {
        saved(s, a, "Screening recorded");
        if (a.payload.data) s.screenings = upsert(s.screenings, a.payload.data);
      })
      .addCase(createScreening.rejected, fail);

    /* drives */
    b.addCase(createDrive.pending, saving)
      .addCase(createDrive.fulfilled, (s, a) => {
        saved(s, a, "Drive scheduled");
        if (a.payload.data) s.drives = upsert(s.drives, a.payload.data);
      })
      .addCase(createDrive.rejected, fail)
      .addCase(updateDrive.pending, saving)
      .addCase(updateDrive.fulfilled, (s, a) => {
        saved(s, a, "Drive updated");
        if (a.payload.data) s.drives = upsert(s.drives, a.payload.data);
      })
      .addCase(updateDrive.rejected, fail);

    /* donations */
    b.addCase(createDonation.pending, saving)
      .addCase(createDonation.fulfilled, (s, a) => {
        saved(s, a, "Donation recorded");
        const d = (a.payload.data as any)?.donation;
        if (d) s.donations = upsert(s.donations, d);
      })
      .addCase(createDonation.rejected, fail)
      .addCase(updateDonation.pending, saving)
      .addCase(updateDonation.fulfilled, (s, a) => {
        saved(s, a, "Donation updated");
        if (a.payload.data) s.donations = upsert(s.donations, a.payload.data);
      })
      .addCase(updateDonation.rejected, fail);

    /* grouping */
    const groupingUpdated = (label: string) => (s: BloodBankState, a: any) => {
      saved(s, a, label);
      const u = a.payload.data;
      if (!u) return;
      if (u.donationNumber) {
        s.donations = upsert(s.donations, u);
        if (s.activeDonation?._id === u._id) s.activeDonation = u;
      } else if (u.requestNumber) {
        s.requests = upsert(s.requests, u);
        if (s.activeRequest?._id === u._id) s.activeRequest = u;
      }
    };
    b.addCase(recordDonationGrouping.pending, saving)
      .addCase(recordDonationGrouping.fulfilled, groupingUpdated("Grouping recorded"))
      .addCase(recordDonationGrouping.rejected, fail)
      .addCase(confirmDonationGrouping.pending, saving)
      .addCase(confirmDonationGrouping.fulfilled, groupingUpdated("Grouping confirmed"))
      .addCase(confirmDonationGrouping.rejected, fail)
      .addCase(recordPatientGrouping.pending, saving)
      .addCase(recordPatientGrouping.fulfilled, groupingUpdated("Patient grouping recorded"))
      .addCase(recordPatientGrouping.rejected, fail)
      .addCase(confirmPatientGrouping.pending, saving)
      .addCase(confirmPatientGrouping.fulfilled, groupingUpdated("Patient grouping confirmed"))
      .addCase(confirmPatientGrouping.rejected, fail);

    /* TTI */
    b.addCase(recordTti.pending, saving)
      .addCase(recordTti.fulfilled, (s, a) => {
        saved(s, a, "TTI results recorded");
        if (a.payload.data) {
          s.donations = upsert(s.donations, a.payload.data);
          if (s.activeDonation?._id === a.payload.data._id) s.activeDonation = a.payload.data;
        }
      })
      .addCase(recordTti.rejected, fail);

    /* components & units */
    b.addCase(processComponents.pending, saving)
      .addCase(processComponents.fulfilled, (s, a) => saved(s, a, "Components prepared"))
      .addCase(processComponents.rejected, fail)
      .addCase(assignStorage.pending, saving)
      .addCase(assignStorage.fulfilled, (s, a) => {
        saved(s, a, "Storage assigned");
        if (a.payload.data) s.units = upsert(s.units, a.payload.data);
      })
      .addCase(assignStorage.rejected, fail)
      .addCase(releaseUnit.pending, saving)
      .addCase(releaseUnit.fulfilled, (s, a) => {
        saved(s, a, "Unit released");
        if (a.payload.data) s.units = upsert(s.units, a.payload.data);
      })
      .addCase(releaseUnit.rejected, fail)
      .addCase(discardUnit.pending, saving)
      .addCase(discardUnit.fulfilled, (s, a) => saved(s, a, "Unit discarded"))
      .addCase(discardUnit.rejected, fail);

    /* storage */
    b.addCase(createStorage.pending, saving)
      .addCase(createStorage.fulfilled, (s, a) => {
        saved(s, a, "Storage unit created");
        if (a.payload.data) s.storage = upsert(s.storage, a.payload.data);
      })
      .addCase(createStorage.rejected, fail)
      .addCase(updateStorage.pending, saving)
      .addCase(updateStorage.fulfilled, (s, a) => {
        saved(s, a, "Storage updated");
        if (a.payload.data) s.storage = upsert(s.storage, a.payload.data);
      })
      .addCase(updateStorage.rejected, fail)
      .addCase(logTemperature.pending, saving)
      .addCase(logTemperature.fulfilled, (s, a) => {
        saved(s, a, "Temperature logged");
        if (a.payload.data) s.temperatures = [a.payload.data, ...s.temperatures];
      })
      .addCase(logTemperature.rejected, fail)
      .addCase(quarantineStorage.pending, saving)
      .addCase(quarantineStorage.fulfilled, (s, a) => saved(s, a, "Units quarantined"))
      .addCase(quarantineStorage.rejected, fail);

    /* expiry */
    b.addCase(discardExpired.pending, saving)
      .addCase(discardExpired.fulfilled, (s, a) => saved(s, a, "Expired units discarded"))
      .addCase(discardExpired.rejected, fail);

    /* requests */
    const requestUpdated = (label: string) => (s: BloodBankState, a: any) => {
      saved(s, a, label);
      const u: BloodRequest | undefined = a.payload.data;
      if (!u) return;
      s.requests = upsert(s.requests, u);
      if (s.activeRequest?._id === u._id) s.activeRequest = { ...s.activeRequest, ...u };
    };
    b.addCase(createRequest.pending, saving)
      .addCase(createRequest.fulfilled, (s, a) => {
        saved(s, a, "Request submitted");
        if (a.payload.data) s.requests = upsert(s.requests, a.payload.data);
      })
      .addCase(createRequest.rejected, fail)
      .addCase(receiveSample.pending, saving)
      .addCase(receiveSample.fulfilled, requestUpdated("Sample received"))
      .addCase(receiveSample.rejected, fail)
      .addCase(rejectRequest.pending, saving)
      .addCase(rejectRequest.fulfilled, requestUpdated("Request rejected"))
      .addCase(rejectRequest.rejected, fail)
      .addCase(cancelRequest.pending, saving)
      .addCase(cancelRequest.fulfilled, requestUpdated("Request cancelled"))
      .addCase(cancelRequest.rejected, fail)
      .addCase(closeRequest.pending, saving)
      .addCase(closeRequest.fulfilled, requestUpdated("Request closed"))
      .addCase(closeRequest.rejected, fail)
      .addCase(addBloodRequestNote.pending, saving)
      .addCase(addBloodRequestNote.fulfilled, requestUpdated("Note added"))
      .addCase(addBloodRequestNote.rejected, fail);

    /* crossmatch & issue */
    b.addCase(createCrossmatch.pending, saving)
      .addCase(createCrossmatch.fulfilled, (s, a) => {
        saved(s, a, "Crossmatch recorded");
        if (a.payload.data) s.crossmatches = upsert(s.crossmatches, a.payload.data);
      })
      .addCase(createCrossmatch.rejected, fail)
      .addCase(voidCrossmatch.pending, saving)
      .addCase(voidCrossmatch.fulfilled, (s, a) => {
        saved(s, a, "Crossmatch voided");
        if (a.payload.data) s.crossmatches = upsert(s.crossmatches, a.payload.data);
      })
      .addCase(voidCrossmatch.rejected, fail)

      .addCase(issueUnit.pending, saving)
      .addCase(issueUnit.fulfilled, (s, a) => {
        saved(s, a, "Unit issued");
        if (a.payload.data) s.issues = upsert(s.issues, a.payload.data);
      })
      .addCase(issueUnit.rejected, fail)
      .addCase(returnIssue.pending, saving)
      .addCase(returnIssue.fulfilled, (s, a) => {
        saved(s, a, "Unit returned");
        if (a.payload.data) s.issues = upsert(s.issues, a.payload.data);
      })
      .addCase(returnIssue.rejected, fail)
      .addCase(completeRetrospectiveCrossmatch.pending, saving)
      .addCase(completeRetrospectiveCrossmatch.fulfilled, (s, a) => {
        saved(s, a, "Retrospective crossmatch completed");
        if (a.payload.data) s.issues = upsert(s.issues, a.payload.data);
      })
      .addCase(completeRetrospectiveCrossmatch.rejected, fail);

    /* transfusions */
    b.addCase(startTransfusion.pending, saving)
      .addCase(startTransfusion.fulfilled, (s, a) => {
        saved(s, a, "Transfusion started");
        if (a.payload.data) s.transfusions = upsert(s.transfusions, a.payload.data);
      })
      .addCase(startTransfusion.rejected, fail)
      .addCase(recordTransfusionVitals.pending, saving)
      .addCase(recordTransfusionVitals.fulfilled, (s, a) => {
        saved(s, a, "Vitals recorded");
        if (a.payload.data && s.activeTransfusion?._id === a.payload.data._id) s.activeTransfusion = a.payload.data;
      })
      .addCase(recordTransfusionVitals.rejected, fail)
      .addCase(completeTransfusion.pending, saving)
      .addCase(completeTransfusion.fulfilled, (s, a) => {
        saved(s, a, "Transfusion completed");
        if (a.payload.data) {
          s.transfusions = upsert(s.transfusions, a.payload.data);
          if (s.activeTransfusion?._id === a.payload.data._id) s.activeTransfusion = a.payload.data;
        }
      })
      .addCase(completeTransfusion.rejected, fail)
      .addCase(stopTransfusion.pending, saving)
      .addCase(stopTransfusion.fulfilled, (s, a) => {
        saved(s, a, "Transfusion stopped");
        if (a.payload.data) {
          s.transfusions = upsert(s.transfusions, a.payload.data);
          if (s.activeTransfusion?._id === a.payload.data._id) s.activeTransfusion = a.payload.data;
        }
      })
      .addCase(stopTransfusion.rejected, fail);

    /* reactions */
    b.addCase(reportReaction.pending, saving)
      .addCase(reportReaction.fulfilled, (s, a) => {
        saved(s, a, "Reaction reported");
        if (a.payload.data) s.reactions = upsert(s.reactions, a.payload.data);
      })
      .addCase(reportReaction.rejected, fail)
      .addCase(updateReaction.pending, saving)
      .addCase(updateReaction.fulfilled, (s, a) => {
        saved(s, a, "Reaction updated");
        if (a.payload.data) {
          s.reactions = upsert(s.reactions, a.payload.data);
          if (s.activeReaction?._id === a.payload.data._id) s.activeReaction = a.payload.data;
        }
      })
      .addCase(updateReaction.rejected, fail);
  },
});

export const {
  clearBloodBankError,
  clearActiveDonor,
  clearActiveDonation,
  clearActiveRequest,
  clearActiveUnit,
  clearActiveTransfusion,
  clearActiveReaction,
} = bloodBankSlice.actions;

export default bloodBankSlice.reducer;