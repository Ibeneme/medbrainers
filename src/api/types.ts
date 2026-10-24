export type UserRole =
  | "super_admin"
  | "ceo"
  | "admin"
  | "manager"
  | "audit"
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

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

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
export type Gender = "male" | "female" | "other" | "unknown";

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
  dateOfBirth?: string;
  gender?: Gender;
  bloodGroup?: string;
  phone?: string;
  countryCode?: string;
  email?: string;
  notes?: string;
  allergies?: Array<{ substance: string; reaction?: string; severity?: string }>;
  family?: Array<{
    name: string;
    relationship: string;
    phone?: string;
    countryCode?: string;
    isEmergencyContact?: boolean;
  }>;
}

export type BedStatus = "available" | "occupied" | "reserved" | "cleaning" | "maintenance" | "blocked";

export interface WardBed {
  _id?: string;
  code: string;
  label?: string;
  status: BedStatus;
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

export interface NursingCarePlan {
  _id: string;
  patient: Patient | string;
  status: string;
  diagnosis?: string;
  goals?: string[];
  interventions?: Array<{ description: string; frequency?: string; completed?: boolean }>;
  notes?: string;
  startDate?: string;
}

export interface DischargeSummary {
  _id: string;
  patient: Patient | string;
  admission: string;
  dischargedAt: string;
  diagnosis?: string;
  hospitalCourse?: string;
  medicationsOnDischarge?: string;
  followUpInstructions?: string;
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
