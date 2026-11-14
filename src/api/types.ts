export type UserRole =
  | "super_admin"
  | "ceo"
  | "admin"
  | "manager"
  | "audit"
  | "financial_manager"
  | "cashier"
  | "doctor"
  | "nurse"
  | "pharmacist"
  | "lab_technician"
  | "consultant"
  | "receptionist"
  | "team_member"
  | "staff"
  | "other";

export type MembershipStatus = "pending" | "active" | "rejected";

export type Gender = "male" | "female" | "other" | "prefer_not_to_say" | "unknown";

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export type FacilityType =
  | "hospital"
  | "clinic"
  | "diagnostic_lab"
  | "pharmacy"
  | "dental"
  | "eye_care"
  | "maternity"
  | "specialist"
  | "primary_care"
  | "telemedicine"
  | "other";

export interface Facility {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  description?: string;
  facilityType?: FacilityType;
  licenseNumber?: string;
  accreditation?: string;
  address?: Address;
  owner?: string;
  isActive?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  theme?: any
}

export interface UpdateFacilityPayload {
  name?: string;
  website?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  description?: string;
  facilityType?: FacilityType;
  licenseNumber?: string;
  accreditation?: string;
  logo?: string;
  address?: Address;
}

export interface AddMemberPayload {
  userId: string;
  role?: UserRole;
  roles?: UserRole[];
  department?: string;
}

export interface UserCompany {
  company: string | Facility;
  role: UserRole;
  roles?: UserRole[];
  department?: string;
  status?: MembershipStatus;
  isActive: boolean;
  joinedAt?: string;
  inviteToken?: string;
}

export interface ActiveFacilityDetails {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  role?: UserRole;
  roles?: UserRole[];
  department?: string;
  lastActiveCompanyAt?: string;
  /** Mongo id (the API may return `_id` alongside `id`) */
  _id?: string;
  /** Owner user id, or a populated user ref */
  owner?: string | { _id?: string; id?: string };
  facilityType?: string;
  description?: string;
  /** Role objects for the active facility (`roles` stays a list of role keys) */
  roleDetails?: RoleRef[];
  /** Effective permissions in the active facility */
  permissions?: string[];
}

/** Authenticated user (auth slice + /users/me) */
export interface User {
  _id: string;
  id?: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  countryCode?: string;
  phone?: string;
  profilePicture?: string;
  gender?: Gender;
  dateOfBirth?: string;
  title?: string;
  specialty?: string;
  licenseNumber?: string;
  department?: string;
  bio?: string;
  address?: Address;
  /** Global / legacy single role (prefer companies[].role or activeCompanyDetails) */
  role?: UserRole;
  roles?: UserRole[];
  companies?: UserCompany[];
  activeCompany?: string;
  activeCompanyDetails?: ActiveFacilityDetails;
  /** Roles + permissions per facility (never persisted in the user cookie — too large) */
  access?: AccessPayload;
  isActive?: boolean;
  privileges?: string[];
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  access?: AccessPayload;
  user: User;
  accessToken: string;
  refreshToken: string;
  companyId?: string | null;
  activeCompany?: ActiveFacilityDetails | null;
  pendingInvites?: PendingInvite[];
  canCreateCompany?: boolean;
}

export interface PendingInvite {
  companyId?: string;
  company?: string | Facility;
  role: UserRole;
  roles?: UserRole[];
  department?: string;
  inviteToken?: string;
  joinedAt?: string;
  token?: string;
}

/** Outgoing pending invite issued by the facility (admin view). */
export interface OutgoingInvite {
  id: string;
  email: string;
  role: UserRole;
  department?: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  token?: string;
  invitedBy?: string;
  expiresAt?: string;
  createdAt?: string;
}

export interface FacilityMembership {
  company: Facility | string;
  role: UserRole;
  roles?: UserRole[];
  department?: string;
  status?: MembershipStatus;
  joinedAt?: string;
  isActive?: boolean;
  isActiveCompany?: boolean;
  inviteToken?: string;
  token?: string;
}

export interface MyFacilitiesResponse {
  activeCompanyId: string | null;
  companies: FacilityMembership[];
  pendingInvites: FacilityMembership[];
}

export interface FacilityMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode?: string;
  phone?: string;
  profilePicture?: string;
  privileges?: string[];
  credentials?: StaffCredential[];
  staffCode?: string;
  jobTitle?: string;
  title?: string;
  specialty?: string;
  role?: UserRole;
  roles?: UserRole[];
  /** Role objects (roles stays a list of role keys) */
  roleDetails?: RoleRef[];
  roleIds?: string[];
  /** Sub-permissions granted directly / explicitly denied */
  permissions?: string[];
  deniedPermissions?: string[];
  /** roles + direct grants − denials */
  effectivePermissions?: string[];
  modules?: Record<string, string[]>;
  isOwner?: boolean;
  department?: string;
  joinedAt?: string;
}

export interface FacilityMemberDetail {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone?: string;
  profilePicture?: string;
  gender?: Gender;
  dateOfBirth?: string;
  address?: Address;
  bio?: string;
  title?: string;
  specialty?: string;
  licenseNumber?: string;
  department?: string;
  role?: UserRole;
  roles?: UserRole[];
  roleDetails?: RoleRef[];
  roleIds?: string[];
  permissions?: string[];
  deniedPermissions?: string[];
  effectivePermissions?: string[];
  modules?: Record<string, string[]>;
  access?: AccessInfo;
  isOwner?: boolean;
  joinedAt?: string;
  facilitySummary: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    facilityType?: FacilityType;
  };
}

export interface InvitePayload {
  email: string;
  role?: UserRole;
  roles?: UserRole[];
  department?: string;
  /** Required when inviting staff to a facility */
  countryCode: string;
  phone: string;
}

export interface StaffCredential {
  name: string;
  number?: string;
  issuer?: string;
  issuedAt?: string;
  expiresAt?: string;
  verified?: boolean;
  notes?: string;
}

export interface StaffDirectoryMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  countryCode?: string;
  profilePicture?: string;
  title?: string;
  specialty?: string;
  role?: UserRole;
  department?: string;
  jobTitle?: string;
  staffCode?: string;
  privileges?: string[];
  credentials?: StaffCredential[];
  joinedAt?: string;
  multiCompany?: boolean;
}

export type ShiftType = "morning" | "afternoon" | "night" | "on_call" | "custom";
export type ShiftStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export interface ShiftRosterEntry {
  _id: string;
  id?: string;
  company: string;
  user:
  | string
  | {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profilePicture?: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  department?: string;
  location?: string;
  status: ShiftStatus;
  notes?: string;
}

export type OnCallStatus = "scheduled" | "active" | "completed" | "cancelled";

export interface OnCallEntry {
  _id: string;
  id?: string;
  company: string;
  user:
  | string
  | {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    profilePicture?: string;
    specialty?: string;
  };
  startAt: string;
  endAt: string;
  specialty?: string;
  department?: string;
  phoneOverride?: string;
  priority: number;
  status: OnCallStatus;
  notes?: string;
}

export interface CreateShiftPayload {
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType?: ShiftType;
  department?: string;
  location?: string;
  notes?: string;
}

export interface CreateOnCallPayload {
  userId: string;
  startAt: string;
  endAt: string;
  specialty?: string;
  department?: string;
  phoneOverride?: string;
  priority?: number;
  notes?: string;
}

export interface UpdateStaffCredentialsPayload {
  privileges?: string[];
  credentials?: StaffCredential[];
  staffCode?: string;
  jobTitle?: string;
}

export interface CreateFacilityPayload {
  name: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  description?: string;
  facilityType?: FacilityType;
  licenseNumber?: string;
  accreditation?: string;
  address?: Address;
}

export interface SwitchFacilityResponse {
  accessToken: string;
  expiresIn: number;
  companyId: string | null;
  role: UserRole;
  roles?: UserRole[];
  activeCompanyId: string;
  activeCompany?: ActiveFacilityDetails | null;
}
/* ── request payloads ──────────────────────────────────────── */
export interface VerifyEmailPayload {
  email: string;
  firstName?: string;
}

export interface SignupPayload {
  email: string;
  otp: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  countryCode?: string;
  phone: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyResetOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  countryCode?: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: string;
  title?: string;
  specialty?: string;
  licenseNumber?: string;
  department?: string;
  bio?: string;
  address?: Address;
  activeCompany?: string;
}

export interface QueryUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  company?: string;
  isActive?: boolean;
}

/** Roles that can manage facility members / invites */
export const FACILITY_ADMIN_ROLES: UserRole[] = [
  "super_admin",
  "ceo",
  "admin",
  "manager",
];

export const FACILITY_ROLES: UserRole[] = [
  "ceo",
  "admin",
  "manager",
  "audit",
  "financial_manager",
  "cashier",
  "doctor",
  "nurse",
  "pharmacist",
  "lab_technician",
  "consultant",
  "receptionist",
  "team_member",
  "staff",
  "other",
];

export function formatRole(role: string): string {
  return role
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function facilityIdOf(c: string | Facility | undefined | null): string {
  if (!c) return "";
  if (typeof c === "string") return c;
  return c._id || c.id || "";
}

export function facilityNameOf(c: string | Facility | undefined | null): string {
  if (!c) return "Facility";
  if (typeof c === "string") return "Facility";
  return c.name || "Facility";
}


export type TaskStatus = "open" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskUserRef {
  _id: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePicture?: string;
  phone?: string;
  countryCode?: string;
}

export interface TaskActivity {
  _id?: string;
  at: string;
  by?: TaskUserRef | string;
  action: string;
  message: string;
  changes?: Record<string, { from?: unknown; to?: unknown }>;
}

export interface FacilityTask {
  _id: string;
  id?: string;
  company: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: TaskUserRef[] | string[];
  createdBy?: TaskUserRef | string;
  dueAt?: string;
  completedAt?: string;
  completedBy?: TaskUserRef | string;
  department?: string;
  tags?: string[];
  activityLog?: TaskActivity[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignedTo: string[];
  dueAt?: string;
  department?: string;
  tags?: string[];
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignedTo?: string[];
  dueAt?: string | null;
  department?: string;
  tags?: string[];
}

export type HandoverStatus = "draft" | "submitted" | "acknowledged" | "closed";

export interface HandoverItem {
  label: string;
  detail?: string;
  critical?: boolean;
}

export interface ShiftHandoverLog {
  _id: string;
  id?: string;
  company: string;
  fromUser: TaskUserRef | string;
  toUser: TaskUserRef | string;
  shiftDate: string;
  department?: string;
  wardOrUnit?: string;
  summary: string;
  items?: HandoverItem[];
  patientNotes?: string;
  status: HandoverStatus;
  acknowledgedAt?: string;
  createdAt?: string;
}

export interface CreateHandoverPayload {
  toUserId: string;
  shiftDate: string;
  summary: string;
  department?: string;
  wardOrUnit?: string;
  items?: HandoverItem[];
  patientNotes?: string;
  pendingTaskIds?: string[];
  linkedShiftId?: string;
  status?: "draft" | "submitted";
}


/* ── Patients / Wards / Appointments ───────────────────────── */

export type PatientStatus = "active" | "inactive" | "deceased" | "merged";

export interface PatientAllergy {
  _id?: string;
  substance: string;
  reaction?: string;
  severity?: "mild" | "moderate" | "severe" | "life_threatening";
  notedAt?: string;
  notes?: string;
}

export interface PatientVital {
  _id?: string;
  recordedAt: string;
  temperatureC?: number;
  pulseBpm?: number;
  respRate?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  spo2?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  notes?: string;
  alert?: boolean;
  alertReason?: string;
}

export interface MedicalHistoryEntry {
  _id?: string;
  at: string;
  type: string;
  title: string;
  detail?: string;
  icdCode?: string;
}

export interface FamilyMember {
  _id?: string;
  name: string;
  relationship: string;
  phone?: string;
  countryCode?: string;
  email?: string;
  isEmergencyContact?: boolean;
  notes?: string;
  patientRef?: string | Patient;
}

export interface FamilyGroup {
  _id: string;
  name?: string;
  members: Patient[] | string[];
  headPatient?: Patient | string;
  notes?: string;
}

export interface PatientFamilyResponse {
  patient: { _id: string; mrn: string; firstName: string; lastName: string };
  familyGroup: FamilyGroup | null;
  contacts: FamilyMember[];
}

export interface Patient {
  _id: string;
  id?: string;
  company: string;
  mrn: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  bloodGroup?: string;
  phone?: string;
  countryCode?: string;
  nationalId?: string;
  email?: string;
  status: PatientStatus;
  allergies?: PatientAllergy[];
  vitals?: PatientVital[];
  medicalHistory?: MedicalHistoryEntry[];
  family?: FamilyMember[];
  familyGroup?: FamilyGroup | string;
  notes?: string;
  createdAt?: string;
}

export interface RegisterPatientPayload {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: string | Date;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';
  phone?: string;
  countryCode?: string;
  email: string; // Made compulsory to match backend validation
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  nationalId?: string;
  notes?: string;
  mrn?: string;
  allergies?: Array<{
    substance: string;
    reaction?: string;
    severity?: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  }>;
  family?: Array<{
    name: string;
    relationship: string;
    phone?: string;
    countryCode?: string;
    email?: string;
    isEmergencyContact?: boolean;
  }>;
}
export type BedStatus = "available" | "occupied" | "reserved" | "cleaning" | "maintenance" | "blocked";

export interface WardBed {
  _id?: string;
  code: string;
  label?: string;
  status: BedStatus;
  notes?: string;
  /** Populated by GET /wards: who is in this bed right now. */
  currentAdmission?: {
    _id: string;
    admittedAt?: string;
    admittingDiagnosis?: string;
    patient?: {
      _id: string;
      mrn?: string;
      firstName?: string;
      lastName?: string;
      gender?: string;
    } | string;
  } | string;
}

export interface Ward {
  _id: string;
  name: string;
  code: string;
  type: string;
  floor?: string;
  department?: string;
  capacity: number;
  beds: WardBed[];
  isActive?: boolean;
}

export interface Admission {
  _id: string;
  patient: Patient | string;
  ward: Ward | string;
  bedCode: string;
  status: string;
  admittedAt: string;
  admittingDiagnosis?: string;
  reason?: string;
  dischargedAt?: string;
}

export type AdmissionPriority = "routine" | "urgent" | "emergency";
export type AdmissionRequestStatus = "pending" | "accepted" | "rejected" | "cancelled";

export interface AdmissionRequest {
  _id: string;
  patient: Patient | string;
  consultation?: string;
  requestedBy?: { _id: string; firstName?: string; lastName?: string } | string;
  priority: AdmissionPriority;
  reason: string;
  admittingDiagnosis?: string;
  preferredWardType?: string;
  isolationRequired?: boolean;
  notes?: string;
  status: AdmissionRequestStatus;
  requestedAt: string;
  ward?: Ward | string;
  bedCode?: string;
  processedBy?: { _id: string; firstName?: string; lastName?: string } | string;
  processedAt?: string;
  rejectionReason?: string;
}

export interface NursingCarePlan {
  _id: string;
  patient: Patient | string;
  admission?: string;
  status: "active" | "completed" | "discontinued" | string;
  diagnosis?: string;
  goals?: string[];
  interventions?: Array<{ _id?: string; description: string; frequency?: string; completed?: boolean }>;
  assignedNurse?: { _id: string; firstName?: string; lastName?: string } | string;
  notes?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
}

export interface DischargeSummary {
  _id: string;
  patient: Patient | string;
  admission: { _id: string; ward?: { name?: string; code?: string } | string; bedCode?: string; admittedAt?: string; admittingDiagnosis?: string } | string;
  dischargedAt: string;
  dischargedBy?: { _id: string; firstName?: string; lastName?: string } | string;
  diagnosis?: string;
  secondaryDiagnoses?: string[];
  procedures?: string;
  hospitalCourse?: string;
  conditionOnDischarge?: string;
  medicationsOnDischarge?: string;
  dischargeMedications?: Array<{
    drugName: string; dose?: string; route?: string; frequency?: string;
    duration?: string; instructions?: string; quantity?: number;
  }>;
  followUpInstructions?: string;
  diet?: string;
  activity?: string;
  warnings?: string;
  referrals?: Array<{
    type: string; department?: string; reason: string; priority?: string;
    referredTo?: string; notes?: string;
  }>;
  surgeryBookings?: Array<{ procedure: string; plannedDate?: string; theater?: string; notes?: string }>;
  disposition?: string;
  transferToFacility?: string;
  followUpDate?: string;
  followUpProvider?: string;
  notes?: string;
}

export type AppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"
  | "rescheduled";

export interface Appointment {
  _id: string;
  patient: Patient | string;
  provider?: { _id: string; firstName?: string; lastName?: string } | string;
  department?: string;
  type: string;
  status: AppointmentStatus;
  startAt: string;
  endAt: string;
  reason?: string;
  notes?: string;
  location?: string;
}

export interface QueueTicket {
  _id: string;
  patient: Patient | string;
  ticketNumber: string;
  department?: string;
  status: string;
  priority: number;
  checkedInAt: string;
}

export interface TriageRecord {
  _id: string;
  patient: Patient | string;
  level: number;
  chiefComplaint?: string;
  notes?: string;
  triagedAt: string;
}


/* ══════════════════════════════════════════════════════════════
 * Dashboard (live facility overview)
 * Mirrors api/src/modules/dashboard/dashboard.service.ts
 * ══════════════════════════════════════════════════════════════ */

export type DashboardCounts = Record<string, number>;

export interface DashboardOverview {
  generatedAt: string;
  patients: {
    total: number;
    active: number;
    byStatus: DashboardCounts;
    registeredToday: number;
    registeredThisMonth: number;
    vitalAlerts: number;
  };
  appointmentsToday: {
    total: number;
    byStatus: DashboardCounts;
    completionRate: number;
  };
  queue: {
    waiting: number;
    called: number;
    serving: number;
    longestWaitMinutes: number;
  };
  beds: {
    total: number;
    byStatus: DashboardCounts;
    occupancyRate: number;
    admittedNow: number;
    admittedToday: number;
    dischargedToday: number;
  };
  emergency: {
    activeNow: number;
    byTriage: DashboardCounts;
    last7DaysByStatus: DashboardCounts;
    waiting: number;
  };
  labs: { open: number; byStatus: DashboardCounts; urgentOpen: number };
  radiology: { open: number; urgentOpen: number };
  pharmacy: { prescriptionsPending: number };
  tasks: { open: number; inProgress: number; overdue: number; mineOpen: number };
  staff: { active: number; onShiftToday: number };
}

export interface DashboardTrends {
  days: number;
  timezone: string;
  labels: string[];
  series: {
    registrations: number[];
    appointments: number[];
    appointmentsCompleted: number[];
    emergencyArrivals: number[];
    admissions: number[];
    discharges: number[];
    labOrders: number[];
    imagingOrders: number[];
  };
}

export interface DashboardWardRow {
  id: string;
  name: string;
  code: string;
  department: string | null;
  total: number;
  occupied: number;
  available: number;
  reserved: number;
  cleaning: number;
  outOfService: number;
  occupancyRate: number;
}

export interface DashboardCapacity {
  generatedAt: string;
  wards: DashboardWardRow[];
  emergencyByStatus: DashboardCounts;
  theatre: {
    todayByStatus: DashboardCounts;
    pendingRequestsByPriority: DashboardCounts;
  };
  ambulancesActive: number;
  maternity: { labourActive: number; nicuAdmitted: number; highRiskAnc: number };
}

export interface DashboardLowStockItem {
  id: string;
  name: string;
  unit: string;
  onHand: number;
  reorderLevel: number;
}

export interface DashboardDepartments {
  generatedAt: string;
  labs: {
    open: number;
    byStatus: DashboardCounts;
    byPriority: DashboardCounts;
    completedToday: number;
  };
  radiology: {
    open: number;
    byStatus: DashboardCounts;
    byModality: DashboardCounts;
    byPriority: DashboardCounts;
    reportedToday: number;
  };
  pharmacy: {
    prescriptionsByStatus: DashboardCounts;
    lowStock: DashboardLowStockItem[];
    batchesExpiring30Days: number;
    batchesExpiring90Days: number;
    batchesExpired: number;
  };
  bloodBank: {
    availableByGroup: DashboardCounts;
    unitsAvailable: number;
    requestsByStatus: DashboardCounts;
    emergencyRequests: number;
  };
}

export type DashboardAlertSeverity = "critical" | "warning" | "info";

export interface DashboardAlert {
  id: string;
  severity: DashboardAlertSeverity;
  module: string;
  title: string;
  detail: string;
  count?: number;
  href: string;
}

export interface DashboardAlerts {
  generatedAt: string;
  counts: Record<DashboardAlertSeverity, number>;
  alerts: DashboardAlert[];
}

/* ── Roles & access control (see backend modules/access) ─────────────────── */
export interface RoleRef {
  id?: string;
  key: string;
  name: string;
  isSystem: boolean;
  /** true for the person's primary (membership.role) role */
  primary: boolean;
}

/** Everything the UI needs to decide what to render for ONE facility. */
export interface AccessInfo {
  companyId?: string;
  role: string;
  /** Every role the person holds here (primary first) */
  roles: RoleRef[];
  roleKeys: string[];
  isOwner: boolean;
  isSuperAdmin: boolean;
  /** Concrete permissions, wildcards expanded, denials applied */
  permissions: string[];
  directPermissions: string[];
  deniedPermissions: string[];
  /** { radiology: ["view","write"] } */
  modules: Record<string, string[]>;
}

/** `access` block embedded in login / users/me / switch-company responses */
export interface AccessPayload {
  activeCompanyId: string | null;
  active: AccessInfo | null;
  companies: Record<string, AccessInfo>;
}

export interface AccessRole {
  id: string;
  key: string;
  name: string;
  description?: string;
  isSystem: boolean;
  locked: boolean;
  permissions: string[];
  memberCount?: number;
  updatedAt?: string;
}

export interface AccessCatalogModule {
  key: string;
  label: string;
  group: string;
  actions: { action: string; permission: string; description: string }[];
}

export interface MemberAccess {
  userId: string;
  role: string;
  roleIds: string[];
  permissions: string[];
  deniedPermissions: string[];
  effectivePermissions: string[];
}
