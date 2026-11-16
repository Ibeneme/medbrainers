"use client";

import React, {
  useState,
  ReactNode,
  useRef,
  useEffect,
  useCallback,
  Suspense,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DEFAULT_PRIMARY_COLOR } from "@/constants/colors";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Stethoscope,
  Pill,
  FlaskConical,
  Building2,
  Receipt,
  BedDouble,
  ShieldCheck,
  Settings,
  ChevronDown,
  Plus,
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Lock,
  ListTodo,
  CreditCard,
  UsersRound,
  Activity,
  HeartPulse,
  Siren,
  FileScan,
  Scissors,
  Video,
  ShieldAlert,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  X,
  Check,
  RotateCcw,
  MessageSquareCode,
  Database,
} from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchMe,
  fetchMyFacilities,
  switchFacility,
  fetchCompanyTheme,
  updateModeColors,
  patchFacilityTheme,
  fetchPatients,
  selectUnreadTotal,
} from "@/api/slices";
import type { Patient } from "@/api/types";
import { facilityIdOf, facilityNameOf } from "@/api/types";
import { productName } from "@/constants/site";
import { T, useT } from "@/i18n/provider";
import { DashboardLanguageToggle } from "@/i18n/dashboard-provider";
import MedbrainersLoader from "@/components/atoms/loaders/Medbrainersloader";
import { useFeedbacks } from "@/hooks/useFeedbacks";
import { useAccess } from "@/hooks/useAccess";
import AccessProvider from "@/components/access/access-provider";
import RouteGuard from "@/components/access/route-guard";
import type { Need } from "@/lib/access/permissions";
import { filterNav } from "@/lib/access/filter-nav";

// ─── Cookie Helper Utilities ─────────────────────────────────
const setCookie = (name: string, value: string, days = 365) => {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; expires=${expires}; path=/; SameSite=Lax${secure}`;
};

const deleteCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
};
// ─────────────────────────────────────────────────────────────

// ─── Active-state style tokens ───────────────────────────────
const activeGlow = (color: string) => `0 0 14px ${color}80`;

// ─── Sidebar theme tokens ────────────────────────────────────
const baseSidebarVars = (theme: "dark" | "light") =>
  (theme === "dark"
    ? {
        "--sb-bg": "#000000",
        "--sb-fg": "#FFFFFF",
        "--sb-muted": "rgba(255,255,255,0.6)",
        "--sb-subtle": "rgba(255,255,255,0.05)",
        "--sb-hover": "rgba(255,255,255,0.06)",
        "--sb-chip": "rgba(255,255,255,0.1)",
        "--sb-border": "rgba(255,255,255,0.1)",
        "--sb-pop": "#0A0A0A",
        "--sb-scroll": "rgba(255,255,255,0.2)",
      }
    : {
        "--sb-bg": "#FFFFFF",
        "--sb-fg": "#111111",
        "--sb-muted": "rgba(0,0,0,0.55)",
        "--sb-subtle": "rgba(0,0,0,0.04)",
        "--sb-hover": "rgba(0,0,0,0.05)",
        "--sb-chip": "rgba(0,0,0,0.07)",
        "--sb-border": "rgba(0,0,0,0.1)",
        "--sb-pop": "#FFFFFF",
        "--sb-scroll": "rgba(0,0,0,0.2)",
      }) as React.CSSProperties;

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

type FacilityModeColors = {
  sidebarBg?: string | null;
  activeColor?: string | null;
};
type FacilityTheme = {
  defaultMode?: "dark" | "light" | "system";
  dark?: FacilityModeColors;
  light?: FacilityModeColors;
};

const facilityThemeCookie = (id: string) => `emr_facility_theme_${id}`;

const colorOrNull = (value?: string | null) =>
  value && HEX_RE.test(value) ? value : null;

const readFacilityThemeCache = (id: string): FacilityTheme | null => {
  const raw = getCookie(facilityThemeCookie(id));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as FacilityTheme;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeFacilityThemeCache = (id: string, theme: FacilityTheme) => {
  setCookie(facilityThemeCookie(id), JSON.stringify(theme));
};

const SIDEBAR_PRESETS = [
  "#000000",
  "#0F172A",
  "#1E293B",
  "#1E1B4B",
  "#172554",
  "#052E16",
  "#022C22",
  "#3F0D12",
  "#4A044E",
  "#1C1917",
  "#0C0A09",
  "#164E63",
  "#3B0764",
  "#FFFFFF",
  "#F8FAFC",
  "#F1F5F9",
  "#EEF2FF",
  "#EFF6FF",
  "#ECFDF5",
  "#F0FDF4",
  "#FEF3C7",
  "#FFF7ED",
  "#FCE7F3",
  "#FDF2F8",
  "#FAFAF9",
  "#F5F5F4",
];

const isLightColor = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
};

const bgVars = (
  theme: "dark" | "light",
  customBg?: string | null
): React.CSSProperties => {
  if (!customBg || !HEX_RE.test(customBg)) return baseSidebarVars(theme);
  const light = isLightColor(customBg);
  const rgb = light ? "0,0,0" : "255,255,255";
  return {
    "--sb-bg": customBg,
    "--sb-fg": light ? "#111111" : "#FFFFFF",
    "--sb-muted": `rgba(${rgb},0.6)`,
    "--sb-subtle": `rgba(${rgb},0.05)`,
    "--sb-hover": `rgba(${rgb},0.07)`,
    "--sb-chip": `rgba(${rgb},0.1)`,
    "--sb-border": `rgba(${rgb},0.12)`,
    "--sb-pop": customBg,
    "--sb-scroll": `rgba(${rgb},0.2)`,
  } as React.CSSProperties;
};

const ACTIVE_PRESETS = [
  DEFAULT_PRIMARY_COLOR,
  "#2563EB",
  "#3B82F6",
  "#6366F1",
  "#7C3AED",
  "#8B5CF6",
  "#A855F7",
  "#DB2777",
  "#EC4899",
  "#F43F5E",
  "#EF4444",
  "#EA580C",
  "#F97316",
  "#FACC15",
  "#84CC16",
  "#16A34A",
  "#22C55E",
  "#14B8A6",
  "#0891B2",
  "#0EA5E9",
  "#64748B",
  "#111111",
  "#FFFFFF",
];

const sidebarVars = (
  theme: "dark" | "light",
  customBg: string | null | undefined,
  activeColor: string
): React.CSSProperties => {
  const active = HEX_RE.test(activeColor) ? activeColor : DEFAULT_PRIMARY_COLOR;
  const activeIsLight = isLightColor(active);
  return {
    ...bgVars(theme, customBg),
    "--sb-active": active,
    "--sb-active-fg": activeIsLight ? "#111111" : "#FFFFFF",
    "--sb-active-chip": activeIsLight
      ? "rgba(0,0,0,0.12)"
      : "rgba(255,255,255,0.18)",
  } as React.CSSProperties;
};

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavChild {
  label: string;
  href?: string;
  /** Explicit access requirement (needed for entries without an href). Entries WITH an href use the route rule table. */
  need?: Need;
  isComingSoon?: boolean;
  isBeta?: boolean;
  children?: NavChild[];
}

interface NavItem {
  label: string;
  href?: string;
  need?: Need;
  icon: ReactNode;
  category?: string;
  children?: NavChild[];
  isComingSoon?: boolean;
  isBeta?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    category: "Overview",
    label: "Dashboard",
    href: "/dashboard/dashboard",
    icon: <LayoutDashboard size={16} />,
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: <Bell size={16} />,
  },
  {
    label: "Telemedicine & Virtual",
    icon: <Video size={16} />,
    isComingSoon: false,
    isBeta: true,
    children: [
      { label: "Virtual Consultations", href: "/dashboard/telemedicine" },
      { label: "Setup Telehealth", href: "/dashboard/telemedicine/setup" },
      { label: "Patient Session Notes", href: "/dashboard/telemedicine/notes" },
      {
        label: "Sessions Management",
        children: [
          {
            label: "Upcoming Telehealth",
            href: "/dashboard/telemedicine/archive",
          },
          {
            label: "Current Telehealth",
            href: "/dashboard/telemedicine/current",
          },
          {
            label: "Past Consultations",
            href: "/dashboard/telemedicine/history",
          },
        ],
      },
    ],
  },
  {
    label: "AI Health Insights",
    icon: <Sparkles size={16} />,
    isBeta: true,
    children: [
      { label: "AI Diagnosis Helper", href: "/dashboard/ai/diagnostics" },
      { label: "Medical Record Summary", href: "/dashboard/ai/summary" },
      { label: "Health Risk Predictor", href: "/dashboard/ai/risk-scoring" },
      { label: "Medication Safety Check", href: "/dashboard/ai/interactions" },
    ],
  },
  {
    category: "Clinical Care",
    label: "Patients Management",
    icon: <Users size={16} />,
    children: [
      { label: "Patient Directory", href: "/dashboard/patients" },
      { label: "Register Patient", href: "/dashboard/patients/register" },
    ],
  },
  {
    label: "Appointments & Queue",
    icon: <CalendarCheck size={16} />,
    children: [
      { label: "Appointments", href: "/dashboard/appointments" },
      { label: "Book Appointment", href: "/dashboard/appointments/new" },
      { label: "Department Queue", href: "/dashboard/appointments/queue" },
    ],
  },
  {
    label: "Inpatient & Wards",
    icon: <BedDouble size={16} />,
    children: [
      { label: "Ward & Bed Management", href: "/dashboard/wards" },
      { label: "Bed Board", href: "/dashboard/wards/beds" },
      { label: "Admission Requests", href: "/dashboard/wards/requests" },
      { label: "Admissions & Transfers", href: "/dashboard/wards/admissions" },
      { label: "Nursing Care Plans", href: "/dashboard/wards/nursing" },
      { label: "Discharge Summaries", href: "/dashboard/wards/discharges" },
    ],
  },
  {
    label: "Consultation & SOAP",
    icon: <Stethoscope size={16} />,
    children: [
      { label: "Active Consultations", href: "/dashboard/consultations" },
      { label: "Vitals & Biometrics", href: "/dashboard/consultations/vitals" },
      { label: "Diagnoses & ICD-11", href: "/dashboard/clinical/diagnoses" },
    ],
  },
  {
    category: "Diagnostics & Pharmacy",
    label: "Laboratory & Pathology",
    icon: <FlaskConical size={16} />,
    children: [
      { label: "Laboratory", href: "/dashboard/labs" },
      { label: "Lab Requests", href: "/dashboard/labs/requests" },
      { label: "Specimen Tracking", href: "/dashboard/labs/specimens" },
      { label: "Results Verification", href: "/dashboard/labs/results" },
      { label: "Pathology Catalog", href: "/dashboard/labs/catalog" },
    ],
  },
  {
    label: "Radiology & PACS",
    icon: <FileScan size={16} />,
    children: [
      { label: "Radiology Queue", href: "/dashboard/radiology/requests" },
      { label: "Radiology Results", href: "/dashboard/radiology/results" },
      { label: "Create X-Ray", href: "/dashboard/radiology/create" },
    ],
  },
  {
    label: "Pharmacy & Dispensary",
    icon: <Pill size={16} />,
    children: [
      { label: "Pharmacy Guide", href: "/dashboard/pharmacy/guide" },
      { label: "Pharmacy Dashboard", href: "/dashboard/pharmacy" },
      {
        label: "e-Prescriptions Queue",
        href: "/dashboard/pharmacy/prescriptions",
      },
      { label: "Dispensing & Refills", href: "/dashboard/pharmacy/dispense" },
      {
        label: "Drug Inventory & Stock",
        children: [
          {
            label: "Drug Inventory & Stock",
            href: "/dashboard/pharmacy/inventory",
          },
          {
            label: "Drug Catalog & Pricing",
            href: "/dashboard/pharmacy/catalog",
          },
          { label: "Batches & Expiry", href: "/dashboard/pharmacy/expiry" },
          { label: "Low Stock Alerts", href: "/dashboard/pharmacy/low-stock" },
        ],
      },
      {
        label: "Procurement & Supply",
        children: [
          {
            label: "Purchase Orders",
            href: "/dashboard/pharmacy/purchase-orders",
          },
          { label: "Goods Received", href: "/dashboard/pharmacy/receiving" },
          { label: "Suppliers", href: "/dashboard/pharmacy/suppliers" },
          {
            label: "Returns & Adjustments",
            href: "/dashboard/pharmacy/adjustments",
          },
        ],
      },
      {
        label: "Compliance & Safety",
        children: [
          {
            label: "Controlled Substances Log",
            href: "/dashboard/pharmacy/controlled",
          },
        ],
      },
      {
        label: "Administration & Reports",
        children: [
          { label: "Pharmacy Reports", href: "/dashboard/pharmacy/reports" },
          { label: "Pharmacy Setup", href: "/dashboard/pharmacy/setup" },
        ],
      },
    ],
  },
  {
    label: "Blood Bank",
    icon: <HeartPulse size={16} />,
    isBeta: true,
    children: [
      { label: "Blood Bank Dashboard", href: "/dashboard/blood-bank" },
      { label: "Blood Bank Guide", href: "/dashboard/blood-bank/guide" },
      {
        label: "Donors & Collection",
        children: [
          { label: "Donor Registry", href: "/dashboard/blood-bank/donors" },
          { label: "Donor Screening", href: "/dashboard/blood-bank/screening" },
          {
            label: "Donations & Collection",
            href: "/dashboard/blood-bank/donations",
          },
          { label: "Blood Drives", href: "/dashboard/blood-bank/drives" },
        ],
      },
      {
        label: "Testing & Processing",
        children: [
          {
            label: "Grouping & Typing",
            href: "/dashboard/blood-bank/grouping",
          },
          { label: "TTI Testing", href: "/dashboard/blood-bank/testing" },
          {
            label: "Component Processing",
            href: "/dashboard/blood-bank/components",
          },
        ],
      },
      {
        label: "Stock & Storage",
        children: [
          { label: "Blood Inventory", href: "/dashboard/blood-bank/inventory" },
          {
            label: "Storage & Cold Chain",
            href: "/dashboard/blood-bank/storage",
          },
          { label: "Expiry & Discards", href: "/dashboard/blood-bank/expiry" },
        ],
      },
      {
        label: "Transfusion Service",
        children: [
          { label: "Blood Requests", href: "/dashboard/blood-bank/requests" },
          { label: "Crossmatching", href: "/dashboard/blood-bank/crossmatch" },
          { label: "Issue & Dispatch", href: "/dashboard/blood-bank/issue" },
          { label: "Transfusions", href: "/dashboard/blood-bank/transfusions" },
          {
            label: "Transfusion Reactions",
            href: "/dashboard/blood-bank/reactions",
          },
        ],
      },
      {
        label: "Reports & Setup",
        children: [
          {
            label: "Blood Bank Reports",
            href: "/dashboard/blood-bank/reports",
          },
          { label: "Blood Bank Setup", href: "/dashboard/blood-bank/setup" },
        ],
      },
    ],
  },
  {
    category: "Specialty Care",
    label: "Maternal & Child Health",
    icon: <Activity size={16} />,
    children: [
      { label: "Maternity Dashboard", href: "/dashboard/maternal" },
      {
        label: "Antenatal Care",
        children: [
          {
            label: "ANC Registration",
            href: "/dashboard/maternal/anc/register",
          },
          {
            label: "ANC Visits & Follow-ups",
            href: "/dashboard/maternal/anc/visits",
          },
          {
            label: "High-Risk Pregnancies",
            href: "/dashboard/maternal/anc/high-risk",
          },
          {
            label: "Antenatal Scans & Labs",
            href: "/dashboard/maternal/anc/investigations",
          },
        ],
      },
      {
        label: "Labour & Delivery",
        children: [
          { label: "Labour Ward Board", href: "/dashboard/maternal/labour" },
          {
            label: "Partograph",
            href: "/dashboard/maternal/labour/partograph",
          },
          { label: "Delivery Records", href: "/dashboard/maternal/delivery" },
          {
            label: "Caesarean Section Log",
            href: "/dashboard/maternal/delivery/caesarean",
          },
        ],
      },
      {
        label: "Postnatal Care",
        children: [
          { label: "Postnatal Visits", href: "/dashboard/maternal/postnatal" },
          {
            label: "Family Planning",
            href: "/dashboard/maternal/family-planning",
          },
        ],
      },
      {
        label: "Newborn & Neonatal",
        children: [
          { label: "Newborn Registry", href: "/dashboard/maternal/newborn" },
          { label: "NICU / SCBU", href: "/dashboard/maternal/nicu" },
          {
            label: "Newborn Screening",
            href: "/dashboard/maternal/newborn/screening",
          },
        ],
      },
      {
        label: "Child Health",
        children: [
          {
            label: "Immunization Schedule",
            href: "/dashboard/maternal/immunization",
          },
          { label: "Growth Monitoring", href: "/dashboard/maternal/growth" },
          {
            label: "Paediatric Clinic",
            href: "/dashboard/maternal/paediatrics",
          },
          {
            label: "Nutrition Programme",
            href: "/dashboard/maternal/nutrition",
          },
        ],
      },
      {
        label: "Maternal & Child Reports",
        href: "/dashboard/maternal/reports",
      },
    ],
  },
  {
    label: "Emergency & ER",
    icon: <Siren size={16} />,
    children: [
      { label: "ER Dashboard", href: "/dashboard/emergency" },
      {
        label: "Arrival & Triage",
        children: [
          {
            label: "Emergency Registration",
            href: "/dashboard/emergency/register",
          },
          { label: "Triage Board", href: "/dashboard/emergency/triage" },
          {
            label: "Ambulance & Dispatch",
            href: "/dashboard/emergency/ambulance",
          },
        ],
      },
      {
        label: "Active Emergency Care",
        children: [
          { label: "ER Patient Tracker", href: "/dashboard/emergency/tracker" },
          { label: "Resuscitation Bay", href: "/dashboard/emergency/resus" },
          { label: "Emergency Orders", href: "/dashboard/emergency/orders" },
          {
            label: "Observation Unit",
            href: "/dashboard/emergency/observation",
          },
        ],
      },
      {
        label: "Critical Incidents",
        children: [
          { label: "Trauma Cases", href: "/dashboard/emergency/trauma" },
          {
            label: "Mass Casualty Mode",
            href: "/dashboard/emergency/mass-casualty",
          },
          {
            label: "Medico-Legal Cases",
            href: "/dashboard/emergency/medico-legal",
          },
        ],
      },
      {
        label: "Disposition",
        children: [
          { label: "ER Admissions", href: "/dashboard/emergency/admissions" },
          {
            label: "Referrals & Transfers",
            href: "/dashboard/emergency/referrals",
          },
          { label: "ER Discharges", href: "/dashboard/emergency/discharges" },
        ],
      },
      { label: "ER Reports", href: "/dashboard/emergency/reports" },
    ],
  },
  {
    label: "Surgical Theater",
    icon: <Scissors size={16} />,
    children: [
      { label: "Theatre Dashboard", href: "/dashboard/theater" },
      {
        label: "Scheduling",
        children: [
          { label: "Surgery Requests", href: "/dashboard/theater/requests" },
          { label: "Theatre Schedule", href: "/dashboard/theater/schedule" },
          {
            label: "Theatre Rooms & Availability",
            href: "/dashboard/theater/rooms",
          },
          { label: "Surgical Teams", href: "/dashboard/theater/teams" },
        ],
      },
      {
        label: "Pre-Operative",
        children: [
          { label: "Pre-op Assessment", href: "/dashboard/theater/pre-op" },
          {
            label: "Anaesthesia Review",
            href: "/dashboard/theater/anaesthesia",
          },
          { label: "Consent Forms", href: "/dashboard/theater/consent" },
          {
            label: "Surgical Safety Checklist",
            href: "/dashboard/theater/checklist",
          },
        ],
      },
      {
        label: "Intra-Operative",
        children: [
          {
            label: "Operation Notes",
            href: "/dashboard/theater/operation-notes",
          },
          {
            label: "Anaesthesia Record",
            href: "/dashboard/theater/anaesthesia-record",
          },
          {
            label: "Instrument & Swab Count",
            href: "/dashboard/theater/counts",
          },
          {
            label: "Implants & Consumables",
            href: "/dashboard/theater/implants",
          },
        ],
      },
      {
        label: "Post-Operative",
        children: [
          {
            label: "Recovery Room (PACU)",
            href: "/dashboard/theater/recovery",
          },
          { label: "Post-op Orders", href: "/dashboard/theater/post-op" },
          {
            label: "Surgical Complications",
            href: "/dashboard/theater/complications",
          },
        ],
      },
      {
        label: "Theatre Operations",
        children: [
          { label: "Sterilization (CSSD)", href: "/dashboard/theater/cssd" },
          { label: "Theatre Inventory", href: "/dashboard/theater/inventory" },
        ],
      },
      { label: "Surgical Reports", href: "/dashboard/theater/reports" },
    ],
  },
  {
    category: "Administration & Billing",
    label: "Billing",
    icon: <Receipt size={16} />,
    children: [
      { label: "Billing Overview", href: "/dashboard/billing" },
      { label: "New Sale (POS)", href: "/dashboard/billing/pos" },
      { label: "Patient Invoices & POS", href: "/dashboard/billing/invoices" },
      { label: "Service Price Catalog", href: "/dashboard/billing/catalog" },
      { label: "Discount Rules", href: "/dashboard/billing/discounts" },
      {
        label: "Finance & Audit",
        children: [
          { label: "Payment Log", href: "/dashboard/billing/payments" },
          { label: "Financial Reports", href: "/dashboard/billing/reports" },
          { label: "Billing Audit Log", href: "/dashboard/billing/audit" },
        ],
      },
      {
        label: "Billing Setup",
        children: [
          { label: "Billing Settings", href: "/dashboard/billing/settings" },
          { label: "Paystack Gateway", href: "/dashboard/billing/gateway" },
        ],
      },
    ],
  },
  {
    label: "Facilities & Companies",
    icon: <Building2 size={16} />,
    children: [
      { label: "Active Facility", href: "/dashboard/workspace" },
      { label: "Roles & Access", href: "/dashboard/workspace/access" },
      { label: "Subscriptions", href: "/dashboard/workspace/subscriptions" },
      {
        label: "Facilities Setup",
        children: [
          { label: "Create Facility", href: "/dashboard/workspace/create" },
          {
            label: "Facility Invitations",
            href: "/dashboard/workspace/invitations",
          },
        ],
      },
      {
        label: "Departments",
        children: [
          {
            label: "View Departments",
            href: "/dashboard/workspace/departments",
          },
          {
            label: "Create Department",
            href: "/dashboard/workspace/departments/create",
          },
        ],
      },
    ],
  },
  {
    label: "Staff & Rosters",
    icon: <UsersRound size={16} />,
    children: [
      { label: "Staff Directory", href: "/dashboard/workspace/teams" },
      { label: "Shift Roster & On-Call", href: "/dashboard/staff/roster" },
    ],
  },
  {
    label: "Tasks & Handover",
    icon: <ListTodo size={16} />,
    children: [
      { label: "All Tasks", href: "/dashboard/tasks" },
      { label: "Assigned to me", href: "/dashboard/tasks/my" },
      { label: "Shift Handover Log", href: "/dashboard/tasks/handover" },
    ],
  },
  {
    label: "Feedbacks & Complaints",
    icon: <MessageSquareCode size={16} />,
    children: [
      { label: "Submit Feedback", need: ["feedbacks.write"] },
      { label: "My Feedbacks", href: "/dashboard/feedbacks" },
    ],
  },
  {
    category: "Settings & Compliance",
    label: "Workspace Compliance",
    icon: <ShieldCheck size={16} />,
    children: [
      {
        label: "Compliance Rules",
        href: "/dashboard/workspace/compliance/rules",
      },
      { label: "Add Rule", href: "/dashboard/workspace/compliance/rules/new" },
      {
        label: "Edit Rule",
        href: "/dashboard/workspace/compliance/rules/edit",
      },
      {
        label: "Delete Rule",
        href: "/dashboard/workspace/compliance/rules/delete",
      },
    ],
  },
  {
    label: "Data Management",
    icon: <Database size={16} />,
    
    children: [
      { label: "Storage & Datasets", href: "/dashboard/data-management" },
      {
        label: "Transfer History",
        href: "/dashboard/data-management/transfers",
      },
    ],
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: <Settings size={16} />,
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <ChevronDown
      size={14}
      className={`shrink-0 opacity-60 transition-transform duration-200 ${
        open ? "rotate-180" : "rotate-0"
      }`}
    />
  );
}

function IconChip({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200"
      style={{
        backgroundColor: active ? "var(--sb-active-chip)" : "transparent",
        color: active ? "var(--sb-active-fg)" : "var(--sb-fg)",
        opacity: active ? 1 : 0.6,
      }}
    >
      {children}
    </span>
  );
}

function IdentityChip({
  src,
  initials,
  iconFallback: IconFallback,
  size = "w-6 h-6 text-[11px]",
}: {
  src?: string | null;
  initials: string;
  iconFallback: React.ElementType;
  size?: string;
}) {
  const t = useT();
  if (src) {
    return (
      <img
        src={src}
        alt={t("Avatar")}
        className={`${size} rounded-md object-cover shrink-0 border border-[color:var(--sb-border)]`}
      />
    );
  }

  return (
    <span
      className={`${size} rounded-md shrink-0 flex items-center justify-center font-medium tracking-tight bg-[var(--sb-chip)] text-[color:var(--sb-fg)] border border-[color:var(--sb-border)]`}
    >
      <IconFallback size={14} className="opacity-80" />
    </span>
  );
}

function getInitials(name?: string | null, fallback = "?"): string {
  if (!name?.trim()) return fallback;
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Swatch({
  color,
  selected,
  onPick,
}: {
  color: string;
  selected: boolean;
  onPick: (c: string) => void;
}) {
  return (
    <button
      type="button"
      title={color}
      aria-label={color}
      aria-pressed={selected}
      onClick={() => onPick(color)}
      className="w-6 h-6 rounded-full border flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
      style={{
        backgroundColor: color,
        borderColor: "var(--sb-border)",
        boxShadow: selected
          ? "0 0 0 2px var(--sb-pop), 0 0 0 3.5px var(--sb-fg)"
          : "none",
      }}
    >
      {selected && (
        <Check
          size={12}
          strokeWidth={3}
          style={{ color: isLightColor(color) ? "#111111" : "#FFFFFF" }}
        />
      )}
    </button>
  );
}

function SidebarColorPicker({
  isCollapsed,
  customBg,
  primaryColor,
  theme,
  onChangeBg,
  onChangeActive,
}: {
  isCollapsed: boolean;
  customBg?: string | null;
  primaryColor: string;
  theme: "dark" | "light";
  onChangeBg: (c: string | null) => void;
  onChangeActive: (c: string | null) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"bg" | "accent">("bg");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  const border = { borderColor: "var(--sb-border)" };
  const activeNow = (primaryColor || DEFAULT_PRIMARY_COLOR).toLowerCase();
  const bgNow = customBg?.toLowerCase();

  const customValue =
    tab === "bg"
      ? customBg && HEX_RE.test(customBg)
        ? customBg
        : theme === "dark"
        ? "#000000"
        : "#ffffff"
      : HEX_RE.test(primaryColor)
      ? primaryColor
      : DEFAULT_PRIMARY_COLOR;

  const pick = (c: string) =>
    tab === "bg" ? onChangeBg(c) : onChangeActive(c);
  const reset = () => (tab === "bg" ? onChangeBg(null) : onChangeActive(null));

  const GroupLabel = ({ children }: { children: ReactNode }) => (
    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1.5 text-[color:var(--sb-muted)]">
      {children}
    </p>
  );

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? t("Close") : t("Sidebar color")}
        title={open ? t("Close") : t("Sidebar color")}
        className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer border transition-colors hover:bg-[var(--sb-hover)]"
        style={{
          ...border,
          backgroundColor: open ? "var(--sb-chip)" : "var(--sb-subtle)",
          color: "var(--sb-fg)",
        }}
      >
        {open ? <X size={15} /> : <Palette size={15} />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("Sidebar color")}
          className={`absolute z-50 w-60 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto rounded-xl border p-3 shadow-xl ${
            isCollapsed ? "left-full bottom-0 ml-3" : "bottom-full left-0 mb-2"
          }`}
          style={{
            backgroundColor: "var(--sb-pop)",
            color: "var(--sb-fg)",
            ...border,
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[12px] font-semibold tracking-tight">
              <T>Sidebar color</T>
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("Close")}
              className="w-6 h-6 rounded-md flex items-center justify-center cursor-pointer opacity-60 hover:opacity-100 hover:bg-[var(--sb-hover)] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div
            className="grid grid-cols-2 gap-0.5 p-0.5 rounded-lg mb-3"
            style={{ backgroundColor: "var(--sb-subtle)" }}
          >
            {(
              [
                ["bg", "Background"],
                ["accent", "Active tab"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className="py-1 rounded-md text-[11.5px] font-medium cursor-pointer transition-colors"
                style={{
                  backgroundColor:
                    tab === id ? "var(--sb-chip)" : "transparent",
                  opacity: tab === id ? 1 : 0.65,
                }}
              >
                {t(label)}
              </button>
            ))}
          </div>

          {tab === "bg" ? (
            <div className="space-y-3">
              <div>
                <GroupLabel>
                  <T>Dark</T>
                </GroupLabel>
                <div className="flex flex-wrap gap-1.5">
                  {SIDEBAR_PRESETS.slice(0, 13).map((c) => (
                    <Swatch
                      key={c}
                      color={c}
                      selected={bgNow === c.toLowerCase()}
                      onPick={pick}
                    />
                  ))}
                </div>
              </div>
              <div>
                <GroupLabel>
                  <T>Light</T>
                </GroupLabel>
                <div className="flex flex-wrap gap-1.5">
                  {SIDEBAR_PRESETS.slice(13).map((c) => (
                    <Swatch
                      key={c}
                      color={c}
                      selected={bgNow === c.toLowerCase()}
                      onPick={pick}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {ACTIVE_PRESETS.map((c) => (
                <Swatch
                  key={c}
                  color={c}
                  selected={activeNow === c.toLowerCase()}
                  onPick={pick}
                />
              ))}
            </div>
          )}

          <div
            className="mt-3 pt-3 border-t flex items-center justify-between"
            style={border}
          >
            <label className="flex items-center gap-2 text-[11.5px] cursor-pointer">
              <span
                className="relative w-6 h-6 rounded-full overflow-hidden border"
                style={{
                  ...border,
                  background:
                    "conic-gradient(#f43f5e,#facc15,#22c55e,#0ea5e9,#8b5cf6,#f43f5e)",
                }}
              >
                <input
                  type="color"
                  value={customValue}
                  onChange={(e) =>
                    tab === "bg"
                      ? onChangeBg(e.target.value)
                      : onChangeActive(e.target.value)
                  }
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </span>
              <T>Custom</T>
            </label>

            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1 text-[11.5px] opacity-70 hover:opacity-100 cursor-pointer transition-opacity"
            >
              <RotateCcw size={12} /> <T>Reset</T>
            </button>
          </div>

          <p className="mt-2 text-[10px] leading-snug text-[color:var(--sb-muted)]">
            <T>Saved for this facility.</T>
          </p>
        </div>
      )}
    </div>
  );
}


function SidebarPatientSearch({
  isCollapsed,
  hasFacility,
  onNavigate,
}: {
  isCollapsed: boolean;
  hasFacility: boolean;
  onNavigate?: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { theme, primaryColor } = useTheme();
  const activeFacilityId = useAppSelector((s) => s.facilities.activeFacilityId);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q || q.length < 2 || !activeFacilityId || !hasFacility) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await dispatch(
          fetchPatients({ facilityId: activeFacilityId, search: q, limit: 8 })
        ).unwrap();
        const list = Array.isArray((res as any)?.data)
          ? (res as any).data
          : Array.isArray((res as any)?.data?.items)
          ? (res as any).data.items
          : Array.isArray(res)
          ? res
          : [];
        setResults(list as Patient[]);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, activeFacilityId, hasFacility, dispatch]);

  const goPatient = (p: Patient) => {
    const id = p._id || p.id;
    if (!id) return;
    setOpen(false);
    setQuery("");
    setResults([]);
    onNavigate?.();
    router.push(`/dashboard/patients/${id}`);
  };

  if (isCollapsed) {
    return (
      <button
        type="button"
        title={t("Search patients")}
        onClick={() => router.push("/dashboard/patients")}
        className="mx-auto w-9 h-9 rounded-lg flex items-center justify-center border transition-colors hover:bg-[var(--sb-hover)]"
        style={{ borderColor: "var(--sb-border)", color: "var(--sb-fg)", backgroundColor: "var(--sb-subtle)" }}
      >
        <Search size={15} />
      </button>
    );
  }

  return (
    <div ref={boxRef} className="relative px-3 pb-2">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none"
          style={{ color: "var(--sb-fg)" }}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={t("Search patients, MRN...")}
          disabled={!hasFacility}
          className="w-full rounded-lg pl-8 pr-3 py-2 text-[12.5px] border outline-none tracking-tight"
          style={{
            backgroundColor: "var(--sb-subtle)",
            color: "var(--sb-fg)",
            borderColor: open ? "var(--sb-active)" : "var(--sb-border)",
          }}
        />
        {loading && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] opacity-50">
            …
          </span>
        )}
      </div>

      {open && (results.length > 0 || (query.trim().length >= 2 && !loading)) && (
        <div
          className="absolute left-3 right-3 mt-1.5 z-50 rounded-xl border shadow-xl overflow-hidden max-h-72 overflow-y-auto"
          style={{
            backgroundColor: "var(--sb-pop)",
            borderColor: "var(--sb-border)",
            color: "var(--sb-fg)",
          }}
        >
          {results.length === 0 ? (
            <p className="px-3 py-3 text-[12px] opacity-60">
              <T>No patients found</T>
            </p>
          ) : (
            <ul>
              {results.map((p) => {
                const id = p._id || p.id || "";
                const name = [p.firstName, p.lastName].filter(Boolean).join(" ") || "Patient";
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => goPatient(p)}
                      className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-[var(--sb-hover)] transition-colors"
                    >
                      <span
                        className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: "var(--sb-chip)" }}
                      >
                        {getInitials(name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] font-semibold truncate tracking-tight">
                          {name}
                        </span>
                        <span className="block text-[10.5px] opacity-60 truncate">
                          {p.mrn ? `MRN ${p.mrn}` : ""}
                          {p.phone ? ` · ${p.phone}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function SidebarContent({
  onNavigate,
  onClose,
  onShowToast,
  hasFacility,
  isCollapsed,
  customBg,
  onChangeBg,
  onChangeActive,
  onOpenFeedback,
}: {
  onNavigate?: () => void;
  onClose?: () => void;
  onShowToast: (msg: string) => void;
  hasFacility: boolean;
  isCollapsed: boolean;
  customBg?: string | null;
  onChangeBg: (color: string | null) => void;
  onChangeActive: (color: string | null) => void;
  onOpenFeedback?: () => void;
}) {
  const t = useT();
  const { theme, primaryColor } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { canPath, canNeed, can } = useAccess();
  const navItems = React.useMemo(() => filterNav(NAV_ITEMS, canPath, canNeed), [canPath, canNeed]);

  const { user } = useAppSelector((state) => state.auth);
  const { me } = useAppSelector((state) => state.users);
  const {
    list: facilityList,
    activeFacility,
    activeFacilityId,
    switching: companyLoading,
    pendingInvites,
  } = useAppSelector((state) => state.facilities);
  const pendingInvitations = pendingInvites || [];
  const profile = me || user;
  const unreadTotal = useAppSelector(selectUnreadTotal);

  const companies = facilityList.map((m: any) => {
    const c = m.company;
    const id = facilityIdOf(c as any);
    return {
      _id: id,
      id,
      companyName: facilityNameOf(c as any),
      name: facilityNameOf(c as any),
      logo: typeof c === "object" && c ? (c as any).logo : undefined,
      role: m.role,
    };
  });
  const currentCompany = activeFacility
    ? {
        _id: activeFacility.id,
        id: activeFacility.id,
        companyName: activeFacility.name,
        name: activeFacility.name,
        logo: activeFacility.logo,
        role: activeFacility.role,
      }
    : companies.find((c: any) => c._id === activeFacilityId) ||
      companies[0] ||
      null;

  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const activeItemRef = useRef<HTMLElement | null>(null);
  const savedScrollTop = useRef<number>(0);

  const borderStyle = {
    borderColor: "var(--sb-border)",
  };

  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    "Doctor / Staff";
  const email = profile?.email || "No email";
  const userInitials = getInitials(
    fullName !== "Doctor / Staff" ? fullName : profile?.email || "U"
  );

  const activeCompany = currentCompany || companies?.[0];
  const companyName = activeCompany?.companyName || "Hospital Facility";
  const companyInitials = getInitials(companyName, "HF");

  const handleSwitchCompany = async (companyId: string) => {
    setIsWorkspaceOpen(false);
    try {
      await dispatch(switchFacility(companyId)).unwrap();
      onShowToast(t("Switched facility"));
      window.location.reload();
    } catch (e: any) {
      onShowToast(typeof e === "string" ? e : t("Could not switch facility"));
    }
  };

  const goToSettingsTab = (tabId: string) => {
    onNavigate?.();
    router.push(`/dashboard/settings?tab=${tabId}`);
  };

  const handleRestrictedNav = (e: React.MouseEvent, href?: string) => {
    const isSettings = href?.includes("/dashboard/settings");
    const isCreateFacility = href?.includes("/dashboard/workspace/create");
    const isInvitations = href?.includes("/dashboard/workspace/invitations");

    if (!hasFacility && !isSettings && !isCreateFacility && !isInvitations) {
      e.preventDefault();
      onShowToast(
        `Please create a facility first to start using ${productName}.`
      );
      return;
    }
  };

  const activeHref = React.useMemo(() => {
    const hrefs: string[] = [];
    const collect = (items: (NavItem | NavChild)[]) => {
      items.forEach((item) => {
        if (item.href) hrefs.push(item.href);
        if (item.children) collect(item.children);
      });
    };
    collect(NAV_ITEMS);

    let best: string | null = null;
    hrefs.forEach((href) => {
      const matches = pathname === href || pathname.startsWith(href + "/");
      if (matches && (!best || href.length > best.length)) best = href;
    });
    return best;
  }, [pathname]);

  const isPathActive = (href?: string): boolean => {
    if (!href || !activeHref) return false;
    return href === activeHref;
  };

  const checkChildActive = (node: NavItem | NavChild): boolean => {
    if (isPathActive(node.href)) return true;
    if (node.children) {
      return node.children.some((child) => checkChildActive(child));
    }
    return false;
  };

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    const traverse = (items: (NavItem | NavChild)[]) => {
      items.forEach((item) => {
        if (item.children) {
          initial[item.label] = checkChildActive(item);
          traverse(item.children);
        }
      });
    };
    traverse(NAV_ITEMS);
    return initial;
  });

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      const traverse = (items: (NavItem | NavChild)[]) => {
        items.forEach((item) => {
          if (item.children && checkChildActive(item)) {
            next[item.label] = true;
            traverse(item.children);
          }
        });
      };
      traverse(NAV_ITEMS);
      return next;
    });
  }, [pathname]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeItemRef.current) {
        activeItemRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [pathname]);

  const toggleGroup = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const setActiveRef = (el: HTMLElement | null, isActive: boolean) => {
    if (isActive && el) {
      activeItemRef.current = el;
    }
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLElement>,
    callback?: () => void
  ) => {
    const target = e.currentTarget;
    target.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
    callback?.();
  };

  const openFeedbackFromSidebar = () => {
    if (navRef.current) {
      savedScrollTop.current = navRef.current.scrollTop;
    }
    onOpenFeedback?.();
    onNavigate?.();
  };

  const restoreSidebarScroll = useCallback(() => {
    if (navRef.current && savedScrollTop.current > 0) {
      requestAnimationFrame(() => {
        if (navRef.current) {
          navRef.current.scrollTop = savedScrollTop.current;
        }
      });
    }
  }, []);

  useEffect(() => {
    (window as any).__restoreSidebarScroll = restoreSidebarScroll;
    return () => {
      delete (window as any).__restoreSidebarScroll;
    };
  }, [restoreSidebarScroll]);

  const renderChildrenNodes = (childrenList: NavChild[], depth = 0) => {
    return childrenList.map((child) => {
      const childActive = isPathActive(child.href);
      const hasSubChildren = child.children && child.children.length > 0;
      const isInvitationsTab = child.label.toLowerCase() === "invitations";
      const isSubmitFeedback = child.label.toLowerCase() === "submit feedback";

      if (child.isComingSoon) {
        return (
          <div
            key={child.label}
            className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] cursor-not-allowed select-none"
            style={{ color: "var(--sb-muted)", opacity: 0.8 }}
          >
            {!isCollapsed && (
              <>
                <span className="min-w-0 flex-1 truncate tracking-tight">
                  {t(child.label)}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--sb-chip)] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-[color:var(--sb-fg)]">
                  <Lock size={9} />
                  <T>Soon</T>
                </span>
              </>
            )}
          </div>
        );
      }

      // ── Special case: Submit Feedback opens the modal ─────────────
      if (isSubmitFeedback) {
        return (
          <button
            key={child.label}
            type="button"
            onClick={() => openFeedbackFromSidebar()}
            title={isCollapsed ? t(child.label) : undefined}
            className="relative flex w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] transition-colors hover:bg-[var(--sb-hover)]"
            style={{
              backgroundColor: "transparent",
              color: "var(--sb-fg)",
              fontWeight: 400,
              opacity: 0.75,
            }}
          >
            {depth > 0 && (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full transition-all"
                style={{
                  backgroundColor: "var(--sb-fg)",
                  opacity: 0.25,
                }}
              />
            )}
            <span className="min-w-0 flex-1 truncate text-left tracking-tight">
              {t(child.label)}
            </span>
          </button>
        );
      }

      if (hasSubChildren) {
        const open = !!expanded[child.label];
        const containsActive = checkChildActive(child);

        return (
          <div key={child.label} className="pt-1.5 first:pt-0">
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                  inline: "nearest",
                });
                toggleGroup(child.label);
              }}
              title={isCollapsed ? t(child.label) : undefined}
              className="group flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-[var(--sb-hover)]"
              style={{
                backgroundColor:
                  isCollapsed && containsActive
                    ? "var(--sb-chip)"
                    : "transparent",
                color: "var(--sb-fg)",
              }}
            >
              {isCollapsed ? (
                <span
                  className="mx-auto text-[10px] font-bold"
                  style={{
                    color: containsActive ? "var(--sb-active)" : undefined,
                  }}
                >
                  {child.label.slice(0, 2).toUpperCase()}
                </span>
              ) : (
                <>
                  <span
                    className="h-3.5 w-[3px] shrink-0 rounded-full transition-all duration-200"
                    style={{
                      backgroundColor: containsActive
                        ? "var(--sb-active)"
                        : "var(--sb-border)",
                    }}
                  />
                  <span
                    className="min-w-0 flex-1 truncate text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                    style={{ opacity: containsActive || open ? 0.95 : 0.6 }}
                  >
                    {t(child.label)}
                  </span>
                  <span
                    className="shrink-0 rounded-full px-1.5 text-[9.5px] font-semibold tabular-nums"
                    style={{
                      backgroundColor: "var(--sb-subtle)",
                      color: "var(--sb-muted)",
                    }}
                  >
                    {child.children!.length}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`shrink-0 opacity-50 transition-transform duration-200 ${
                      open ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </>
              )}
            </button>

            {!isCollapsed && (
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    key="sub-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div
                      className="ml-[13px] mt-0.5 space-y-0.5 border-l pb-1 pl-2"
                      style={borderStyle}
                    >
                      {renderChildrenNodes(child.children!, depth + 1)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        );
      }

      return (
        <Link
          key={child.label}
          href={child.href as string}
          ref={(el) => setActiveRef(el, childActive)}
          onClick={(e) => {
            handleRestrictedNav(e, child.href);
            if (!e.defaultPrevented) {
              handleNavClick(e, onNavigate);
            }
          }}
          title={isCollapsed ? t(child.label) : undefined}
          className="relative flex w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] transition-colors hover:bg-[var(--sb-hover)]"
          style={{
            backgroundColor: childActive ? "var(--sb-active)" : "transparent",
            color: childActive ? "var(--sb-active-fg)" : "var(--sb-fg)",
            fontWeight: childActive ? 600 : 400,
            opacity: childActive ? 1 : 0.75,
            boxShadow: childActive ? activeGlow(primaryColor) : undefined,
          }}
        >
          {depth > 0 && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full transition-all"
              style={{
                backgroundColor: childActive
                  ? "var(--sb-active-fg)"
                  : "var(--sb-fg)",
                opacity: childActive ? 1 : 0.25,
              }}
            />
          )}

          <span className="min-w-0 flex-1 truncate text-left tracking-tight">
            {t(child.label)}
          </span>

          {!isCollapsed &&
            isInvitationsTab &&
            pendingInvitations.length > 0 && (
              <span
                className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold text-black"
                style={{ backgroundColor: primaryColor }}
              >
                {pendingInvitations.length}
              </span>
            )}
        </Link>
      );
    });
  };

  return (
    <div
      className="flex flex-col h-full select-none antialiased border-r transition-colors duration-200 text-[color:var(--sb-fg)] relative group/sidebar pb-[env(safe-area-inset-bottom)]"
      style={{
        backgroundColor: "var(--sb-bg)",
        color: "var(--sb-fg)",
        ...sidebarVars(theme, customBg, primaryColor),
        ...borderStyle,
      }}
    >
      <div className="px-3 pt-5 pb-3 flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <button
            type="button"
            onClick={() => !isCollapsed && setIsWorkspaceOpen(!isWorkspaceOpen)}
            className="w-full flex items-center justify-between px-2.5 py-2.5 rounded-lg border transition-all text-left cursor-pointer group hover:bg-[var(--sb-hover)]"
            style={{
              backgroundColor: "var(--sb-subtle)",
              ...borderStyle,
            }}
            title={isCollapsed ? companyName : undefined}
          >
            <div
              className={`flex items-center gap-2.5 min-w-0 w-full ${
                isCollapsed ? "justify-center" : "justify-start"
              }`}
            >
              <IdentityChip
                src={activeCompany?.logo}
                initials={companyInitials}
                iconFallback={Building2}
              />
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium truncate tracking-tight leading-tight text-[color:var(--sb-fg)]">
                    {companyName === "Hospital Facility"
                      ? t(companyName)
                      : companyName}
                  </p>
                  <p className="text-[10.5px] text-[color:var(--sb-muted)] truncate tracking-tight leading-tight">
                    <T>EMR Facility</T>
                  </p>
                </div>
              )}
            </div>
            {!isCollapsed && <ChevronIcon open={isWorkspaceOpen} />}
          </button>

          <AnimatePresence>
            {!isCollapsed && isWorkspaceOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute left-0 right-0 top-full mt-1.5 border rounded-lg py-1 z-50 text-[13px] shadow-xl text-[color:var(--sb-fg)]"
                style={{
                  backgroundColor: "var(--sb-pop)",
                  ...borderStyle,
                }}
              >
                {companies && companies.length > 0 ? (
                  companies.map((comp: any) => {
                    const id = comp._id || comp.id;
                    const isActive =
                      (activeCompany?._id || (activeCompany as any)?.id) === id;

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleSwitchCompany(id)}
                        disabled={companyLoading}
                        className="w-full flex items-center justify-between px-3 py-2 text-left font-medium cursor-pointer hover:bg-[var(--sb-hover)] disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <IdentityChip
                            src={comp.logo}
                            initials={getInitials(comp.companyName, "HF")}
                            iconFallback={Building2}
                            size="w-5 h-5 text-[10px]"
                          />
                          <span className="truncate tracking-tight">
                            {comp.companyName}
                          </span>
                        </div>
                        {isActive && (
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor: primaryColor,
                              boxShadow: activeGlow(primaryColor),
                            }}
                          />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-[color:var(--sb-muted)] text-[12px]">
                    <T>No facilities yet</T>
                  </div>
                )}

                <div className="mt-1 pt-1 border-t" style={borderStyle}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWorkspaceOpen(false);
                      onNavigate?.();
                      router.push("/dashboard/workspace/create");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left opacity-60 hover:opacity-100 hover:bg-[var(--sb-hover)] transition-colors cursor-pointer text-[12px]"
                  >
                    <Plus size={14} /> <T>New facility</T>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {can("patients.view") && (
        <SidebarPatientSearch
          isCollapsed={isCollapsed}
          hasFacility={hasFacility}
          onNavigate={onNavigate}
        />
      )}

      <nav
        ref={navRef}
        className="flex-1 px-3 py-1 space-y-4 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--sb-scroll)_transparent]"
      >
        {navItems.map((item, index) => {
          const showCategoryHeader = item.category && !isCollapsed;
          const active = isPathActive(item.href);
          const isFacilityWorkspaceGroup =
            item.label.toLowerCase() === "facilities & companies";
          const isTelemedicineVirtual =
            item.label.toLowerCase() === "telemedicine & virtual";
          const isItemBeta = item.isBeta;

          return (
            <div key={item.label} className="space-y-0.5">
              {showCategoryHeader && (
                <div
                  className={`px-3 pb-2 text-[10px] font-semibold tracking-[0.12em] uppercase opacity-50 ${
                    index > 0 ? "pt-3 mt-3 border-t" : "pt-1"
                  }`}
                  style={index > 0 ? borderStyle : undefined}
                >
                  {t(item.category ?? "")}
                </div>
              )}

              {item.children ? (
                (() => {
                  const open = !!expanded[item.label];
                  const groupActive = isCollapsed && checkChildActive(item);

                  return (
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          if (isCollapsed) {
                            if (item.href) {
                              handleRestrictedNav(e, item.href);
                              if (!e.defaultPrevented) {
                                onNavigate?.();
                                router.push(item.href);
                              }
                            }
                            return;
                          }
                          e.currentTarget.scrollIntoView({
                            behavior: "smooth",
                            block: "nearest",
                            inline: "nearest",
                          });
                          if (item.href && !checkChildActive(item)) {
                            handleRestrictedNav(e, item.href);
                            if (!e.defaultPrevented) {
                              router.push(item.href);
                            }
                          }
                          toggleGroup(item.label);
                        }}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer group hover:bg-[var(--sb-hover)]"
                        style={{
                          backgroundColor: groupActive
                            ? "var(--sb-active)"
                            : "transparent",
                          color: groupActive
                            ? "var(--sb-active-fg)"
                            : "var(--sb-fg)",
                        }}
                        title={isCollapsed ? t(item.label) : undefined}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span
                            className={
                              isCollapsed ? "mx-auto shrink-0" : "shrink-0"
                            }
                          >
                            <IconChip active={groupActive}>
                              {item.icon}
                            </IconChip>
                          </span>
                          {!isCollapsed && (
                            <span
                              className="flex-1 min-w-0 text-left tracking-tight flex items-center gap-2 truncate"
                              style={{ opacity: groupActive ? 1 : 0.9 }}
                            >
                              <span className="truncate">{t(item.label)}</span>
                              {isFacilityWorkspaceGroup &&
                                pendingInvitations.length > 0 && (
                                  <span
                                    className="px-1.5 py-0.2 text-[10px] font-extrabold rounded-full text-black shrink-0"
                                    style={{ backgroundColor: primaryColor }}
                                  >
                                    {pendingInvitations.length}
                                  </span>
                                )}
                            </span>
                          )}
                        </div>
                        {!isCollapsed && (
                          <div className="flex items-center gap-1.5 shrink-0 ml-1">
                            {isItemBeta && (
                              <span
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide"
                                style={{
                                  backgroundColor: "var(--sb-active)",
                                  color: "var(--sb-fg)",
                                }}
                              >
                                <T>Beta</T>
                              </span>
                            )}
                            <ChevronIcon open={open} />
                          </div>
                        )}
                      </button>

                      {!isCollapsed && (
                        <AnimatePresence initial={false}>
                          {open && (
                            <motion.div
                              key="content"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.18, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div
                                className="ml-[22px] pl-3 pt-1 pb-1 space-y-0.5 border-l"
                                style={borderStyle}
                              >
                                {renderChildrenNodes(item.children)}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </div>
                  );
                })()
              ) : item.isComingSoon ? (
                <div
                  className="flex flex-col items-start gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-medium opacity-[0.85] cursor-not-allowed select-none"
                  style={{
                    backgroundColor: "var(--sb-subtle)",
                    color: "var(--sb-muted)",
                  }}
                  title={isCollapsed ? t(item.label) : undefined}
                >
                  <div
                    className={`flex items-center justify-between w-full ${
                      isCollapsed ? "justify-center" : "justify-start"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span
                        className={
                          isCollapsed ? "mx-auto shrink-0" : "shrink-0"
                        }
                      >
                        <IconChip active={false}>{item.icon}</IconChip>
                      </span>
                      {!isCollapsed && (
                        <span className="flex-1 min-w-0 text-left tracking-tight truncate">
                          {t(item.label)}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--sb-chip)] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-[color:var(--sb-fg)] shrink-0 ml-1">
                        <Lock size={9} />
                        <T>Coming Soon</T>
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <Link
                  href={item.href as string}
                  ref={(el) => setActiveRef(el, active)}
                  onClick={(e) => {
                    handleRestrictedNav(e, item.href);
                    if (!e.defaultPrevented) {
                      handleNavClick(e, onNavigate);
                    }
                  }}
                  title={isCollapsed ? t(item.label) : undefined}
                  className="relative w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[13px] font-medium transition-colors group hover:bg-[var(--sb-hover)]"
                  style={{
                    backgroundColor: active
                      ? "var(--sb-active)"
                      : "transparent",
                    color: active ? "var(--sb-active-fg)" : "var(--sb-fg)",
                    boxShadow: active ? activeGlow(primaryColor) : undefined,
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className={isCollapsed ? "mx-auto shrink-0" : "shrink-0"}
                    >
                      <IconChip active={active}>{item.icon}</IconChip>
                    </span>
                    {!isCollapsed && (
                      <span
                        className="flex-1 min-w-0 text-left tracking-tight truncate"
                        style={{ fontWeight: active ? 600 : 500 }}
                      >
                        {t(item.label)}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && item.label === "Notifications" && unreadTotal > 0 && (
                    <span
                      className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white shrink-0 ml-1"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {unreadTotal > 99 ? "99+" : unreadTotal}
                    </span>
                  )}
                  {!isCollapsed && isTelemedicineVirtual && (
                    <span className="inline-flex items-center rounded-full bg-[var(--sb-chip)] px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-[color:var(--sb-fg)] shrink-0 ml-1">
                      <T>Coming Soon</T>
                    </span>
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      <div
        className={`px-3 pb-4 pt-3 border-t flex gap-2 ${
          isCollapsed ? "flex-col items-center" : "items-center"
        }`}
        style={borderStyle}
      >
        <SidebarColorPicker
          isCollapsed={isCollapsed}
          customBg={customBg}
          primaryColor={primaryColor}
          theme={theme}
          onChangeBg={onChangeBg}
          onChangeActive={onChangeActive}
        />

        <div
          className={`flex items-center px-2 py-1.5 rounded-lg border border-transparent hover:bg-[var(--sb-chip)] transition-colors cursor-pointer ${
            isCollapsed ? "" : "flex-1 min-w-0"
          }`}
          style={{ backgroundColor: "var(--sb-subtle)" }}
          onClick={() => goToSettingsTab("personal")}
          title={isCollapsed ? fullName : undefined}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 justify-center sm:justify-start">
            <IdentityChip
              src={profile?.profilePicture}
              initials={userInitials}
              iconFallback={Users}
              size="w-7 h-7 text-[11px] rounded-full"
            />
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-medium truncate tracking-tight leading-tight text-[color:var(--sb-fg)]">
                  {fullName === "Doctor / Staff" ? t(fullName) : fullName}
                </p>
                <p className="text-[10.5px] text-[color:var(--sb-muted)] truncate tracking-tight leading-tight">
                  {email === "No email" ? t(email) : email}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarFallback({ customBg }: { customBg?: string | null }) {
  const { theme, primaryColor } = useTheme();
  return (
    <div
      className="h-full w-full border-r"
      style={{
        ...sidebarVars(theme, customBg, primaryColor),
        backgroundColor: "var(--sb-bg)",
        borderColor: "var(--sb-border)",
      }}
    />
  );
}

// ── Feedback & Complaint Tray Component ─────────────────────────────
function FeedbackTrayModal({
  isOpen,
  onClose,
  primaryColor,
  colors,
  theme,
}: {
  isOpen: boolean;
  onClose: () => void;
  primaryColor: string;
  colors: any;
  theme: string;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { submitFeedback } = useFeedbacks();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSubmitting(true);
    const res = await submitFeedback({ title, body });
    setSubmitting(false);

    if (res) {
      setTitle("");
      setBody("");
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-start justify-center pt-16 px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden"
          style={{
            backgroundColor: colors.bg,
            borderColor:
              theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
            color: colors.text,
          }}
        >
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{
              borderColor:
                theme === "dark"
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.08)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                <MessageSquareCode size={18} fill="currentColor" />
              </span>
              <div>
                <h2 className="text-sm font-bold tracking-tight">
                  <T>Submit Feedback & Complaints</T>
                </h2>
                <p className="text-[11px] opacity-70">
                  <T>Share your thoughts or report issues to company admins</T>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                <T>Title / Subject</T>
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Feature suggestion or issue description"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm border outline-none transition-all"
                style={{
                  backgroundColor: colors.shadeBgSecond,
                  borderColor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                  color: colors.text,
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                <T>Feedback / Complaint Details</T>
              </label>
              <textarea
                required
                minLength={2}
                maxLength={5000}
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe your feedback, suggestion, or complaint clearly..."
                className="w-full rounded-xl p-3.5 text-sm border outline-none transition-all resize-none"
                style={{
                  backgroundColor: colors.shadeBgSecond,
                  borderColor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                  color: colors.text,
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer opacity-80 hover:opacity-100"
                style={{
                  borderColor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                }}
              >
                <T>Cancel</T>
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                style={{
                  backgroundColor: primaryColor,
                  boxShadow: activeGlow(primaryColor),
                }}
              >
                {submitting ? <T>Submitting...</T> : <T>Submit Feedback</T>}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const t = useT();
  const pathname = usePathname();
  const { theme, toggleTheme, colors, primaryColor, setPrimaryColor } =
    useTheme();
  const dispatch = useAppDispatch();
  const { accessToken } = useAppSelector((state) => state.auth);
  const { can: canDo } = useAccess();
  const canSubmitFeedback = canDo("feedbacks.write");

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isFeedbackTrayOpen, setIsFeedbackTrayOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastShowCreate, setToastShowCreate] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState<number>(262);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const lastExpandedWidth = useRef<number>(262);
  const appliedActiveKey = useRef<string>("");

  useEffect(() => {
    const savedWidth = getCookie("emr_sidebar_width");
    const savedCollapsed = getCookie("emr_sidebar_collapsed");
    if (savedWidth) {
      const parsed = parseInt(savedWidth, 10);
      if (!isNaN(parsed)) {
        setSidebarWidth(parsed);
        lastExpandedWidth.current = parsed;
      }
    }
    if (savedCollapsed === "true") {
      setIsCollapsed(true);
    } else if (savedCollapsed === null && window.innerWidth < 1280) {
      setIsCollapsed(true);
    }
    deleteCookie("emr_sidebar_bg_dark");
    deleteCookie("emr_sidebar_bg_light");
  }, []);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setIsMobileNavOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isMobileNavOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = () => mq.matches && setIsMobileNavOpen(false);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX;
        if (newWidth < 80) {
          setIsCollapsed(true);
        } else if (newWidth >= 200 && newWidth <= 450) {
          setIsCollapsed(false);
          setSidebarWidth(newWidth);
          lastExpandedWidth.current = newWidth;
          setCookie("emr_sidebar_width", newWidth.toString());
          setCookie("emr_sidebar_collapsed", "false");
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const toggleSidebarCollapse = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setSidebarWidth(lastExpandedWidth.current);
      setCookie("emr_sidebar_collapsed", "false");
      setCookie("emr_sidebar_width", lastExpandedWidth.current.toString());
    } else {
      setIsCollapsed(true);
      setCookie("emr_sidebar_collapsed", "true");
    }
  };

  const {
    list: facilityList,
    activeFacilityId,
    initialized: facilitiesInitialized,
    currentTheme,
  } = useAppSelector((state) => state.facilities);

  const facilityId = activeFacilityId || "";
  const modeName: "dark" | "light" = theme === "light" ? "light" : "dark";

  const [cachedByFacility, setCachedByFacility] = useState<
    Record<string, FacilityTheme>
  >({});
  const cachedTheme = facilityId ? cachedByFacility[facilityId] ?? null : null;
  const knownTheme = (currentTheme as FacilityTheme | null) ?? cachedTheme;

  const sidebarBg = colorOrNull(knownTheme?.[modeName]?.sidebarBg);
  const companyActive = knownTheme
    ? colorOrNull(knownTheme[modeName]?.activeColor)
    : undefined;

  const waitingForFacility =
    !!accessToken && !activeFacilityId && !facilitiesInitialized;
  const hasFacility = facilityList.length > 0 || !!activeFacilityId;

  const showToast = (msg: string, withCreate = true) => {
    setToastMessage(msg);
    setToastShowCreate(withCreate);
    setTimeout(() => {
      setToastMessage(null);
      setToastShowCreate(false);
    }, 3500);
  };

  const persistModeColor = (patch: {
    sidebarBg?: string | null;
    activeColor?: string | null;
  }) => {
    if (!facilityId) {
      showToast("Create a facility first to save brand colors.", false);
      return;
    }
    dispatch(patchFacilityTheme({ mode: modeName, ...patch }));
    dispatch(
      updateModeColors({
        facilityId,
        mode: modeName,
        ...patch,
      })
    )
      .unwrap()
      .catch((e: unknown) => {
        showToast(
          typeof e === "string" ? e : "Could not save facility colors",
          false
        );
        dispatch(fetchCompanyTheme(facilityId));
      });
  };

  const changeSidebarBg = (color: string | null) => {
    persistModeColor({ sidebarBg: colorOrNull(color) });
  };

  const changeActiveColor = (color: string | null) => {
    const next = colorOrNull(color);
    appliedActiveKey.current = `${facilityId}:${modeName}:${next ?? "default"}`;
    setPrimaryColor(next);
    persistModeColor({ activeColor: next });
  };

  useEffect(() => {
    if (accessToken) {
      dispatch(fetchMe());
      dispatch(fetchMyFacilities());
    }
  }, [accessToken, dispatch]);

  useEffect(() => {
    if (!facilityId) return;
    const cached = readFacilityThemeCache(facilityId);
    if (cached) {
      setCachedByFacility((prev) =>
        prev[facilityId] ? prev : { ...prev, [facilityId]: cached }
      );
    }
    dispatch(fetchCompanyTheme(facilityId));
  }, [facilityId, dispatch]);

  useEffect(() => {
    if (!facilityId || !currentTheme) return;
    writeFacilityThemeCache(facilityId, currentTheme);
    setCachedByFacility((prev) => ({ ...prev, [facilityId]: currentTheme }));
  }, [facilityId, currentTheme]);

  useEffect(() => {
    if (accessToken && !facilitiesInitialized && !facilityId) return;

    if (!facilityId) {
      const key = "none";
      if (appliedActiveKey.current === key) return;
      appliedActiveKey.current = key;
      setPrimaryColor(null);
      return;
    }
    if (companyActive === undefined) return;
    const key = `${facilityId}:${modeName}:${companyActive ?? "default"}`;
    if (appliedActiveKey.current === key) return;
    appliedActiveKey.current = key;
    setPrimaryColor(companyActive);
  }, [
    facilityId,
    modeName,
    companyActive,
    setPrimaryColor,
    accessToken,
    facilitiesInitialized,
  ]);

  const handleCloseFeedback = () => {
    setIsFeedbackTrayOpen(false);
    requestAnimationFrame(() => {
      if (typeof (window as any).__restoreSidebarScroll === "function") {
        (window as any).__restoreSidebarScroll();
      }
    });
  };

  return (
    <div
      className="min-h-screen antialiased lg:flex transition-colors duration-200 relative"
      style={{ backgroundColor: colors.shadeBgSecond, color: colors.text }}
    >
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl text-sm font-semibold"
            style={{
              backgroundColor: colors.shadeBgSecond,
              borderColor: primaryColor,
              color: colors.text,
            }}
          >
            <ShieldAlert size={18} style={{ color: primaryColor }} />
            <span>{toastMessage}</span>
            {toastShowCreate && (
              <Link
                href="/dashboard/workspace/create"
                onClick={() => setToastMessage(null)}
                className="ml-2 px-3 py-1 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                <T>Create Facility Now</T>
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AccessProvider />

      <FeedbackTrayModal
        isOpen={isFeedbackTrayOpen}
        onClose={handleCloseFeedback}
        primaryColor={primaryColor}
        colors={colors}
        theme={theme}
      />

      <aside
        style={{
          width: isCollapsed ? "72px" : `${sidebarWidth}px`,
          transition: isResizing ? "none" : "width 0.2s ease-in-out",
        }}
        className="hidden lg:flex lg:flex-col lg:h-screen lg:sticky lg:top-0 shrink-0 relative group select-none z-40"
      >
        <Suspense fallback={<SidebarFallback customBg={sidebarBg} />}>
          <SidebarContent
            onShowToast={showToast}
            hasFacility={hasFacility}
            isCollapsed={isCollapsed}
            customBg={sidebarBg}
            onChangeBg={changeSidebarBg}
            onChangeActive={changeActiveColor}
            onOpenFeedback={() => setIsFeedbackTrayOpen(true)}
          />
        </Suspense>

        <button
          type="button"
          onClick={toggleSidebarCollapse}
          className="absolute -right-3 top-7 z-40 w-6 h-6 rounded-full border flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
          style={{
            backgroundColor: colors.bg,
            color: colors.text,
            borderColor: colors.border,
          }}
          title={isCollapsed ? t("Expand sidebar") : t("Collapse sidebar")}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={12} />
          ) : (
            <PanelLeftClose size={12} />
          )}
        </button>

        {!isCollapsed && (
          <div
            onMouseDown={startResizing}
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#88888855] transition-colors z-30"
          />
        )}
      </aside>

      <AnimatePresence>
        {isMobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[300px] h-[100dvh] shadow-2xl lg:hidden"
            >
              <Suspense fallback={<SidebarFallback customBg={sidebarBg} />}>
                <SidebarContent
                  onNavigate={() => setIsMobileNavOpen(false)}
                  onClose={() => setIsMobileNavOpen(false)}
                  onShowToast={showToast}
                  hasFacility={hasFacility}
                  isCollapsed={false}
                  customBg={sidebarBg}
                  onChangeBg={changeSidebarBg}
                  onChangeActive={changeActiveColor}
                  onOpenFeedback={() => setIsFeedbackTrayOpen(true)}
                />
              </Suspense>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        <header
          className="sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 lg:px-8 py-3 sm:py-4 backdrop-blur-sm border-b transition-colors duration-200"
          style={{
            backgroundColor: `${colors.bg}E6`,
            borderColor:
              theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden w-10 h-10 shrink-0 flex items-center justify-center rounded-lg border cursor-pointer transition-colors"
              style={{
                backgroundColor: colors.shadeBgSecond,
                borderColor:
                  theme === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
                color: colors.text,
              }}
              aria-label={t("Open menu")}
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold tracking-tight truncate">
                {productName}
              </p>
              <p className="text-[11px] opacity-60 truncate hidden sm:block">
                <T>Clinical workspace</T>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <DashboardLanguageToggle
              borderColor={
                theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
              }
              backgroundColor={colors.shadeBgSecond}
              color={colors.text}
            />
            <button
              type="button"
              onClick={toggleTheme}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg border cursor-pointer transition-colors"
              style={{
                backgroundColor: colors.shadeBgSecond,
                borderColor:
                  theme === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
                color: colors.text,
              }}
              aria-label={t("Toggle theme")}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <Link
              href="/dashboard/notifications"
              className="relative w-9 h-9 flex items-center justify-center rounded-lg border cursor-pointer transition-colors"
              style={{
                backgroundColor: colors.shadeBgSecond,
                borderColor:
                  theme === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
                color: colors.text,
              }}
              aria-label={t("Notifications")}
              title={t("Notifications")}
            >
              <Bell size={16} />
            </Link>

            {/* Feedbacks Button - filled icon, solid primary bg, white icon */}
            {canSubmitFeedback && (
            <button
              type="button"
              onClick={() => setIsFeedbackTrayOpen(true)}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg border cursor-pointer transition-transform hover:scale-105 shadow-sm"
              style={{
                backgroundColor: primaryColor,
                borderColor: primaryColor,
                color: "#FFFFFF",
              }}
              title={t("Send Feedback & Complaints")}
              aria-label={t("Send Feedback & Complaints")}
            >
              <MessageSquareCode
                size={16}
                fill="currentColor"
                strokeWidth={0}
              />
            </button>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl w-full mx-auto">
          {waitingForFacility ? (
            <div className="flex min-h-[60vh] items-center justify-center">
              <MedbrainersLoader showText={false} size={72} />
            </div>
          ) : (
            <RouteGuard>{children}</RouteGuard>
          )}
        </main>
      </div>
    </div>
  );
}
