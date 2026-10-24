"use client";

import React, { useState, ReactNode, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PRIMARY_COLOR } from "@/constants/colors";
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
  FileText,
  ShieldCheck,
  Settings,
  ChevronDown,
  Plus,
  ExternalLink,
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
  Syringe,
  Video,
  ShieldAlert,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchMe,
  logout,
  fetchMyFacilities,
  switchFacility,
} from "@/api/slices";
import { facilityIdOf, facilityNameOf } from "@/api/types";
import { productName } from "@/constants/site";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavChild {
  label: string;
  href?: string;
  isComingSoon?: boolean;
  children?: NavChild[];
}

interface NavItem {
  label: string;
  href?: string;
  icon: ReactNode;
  category?: string;
  children?: NavChild[];
  isComingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  // ─── Overview ───────────────────────────────────────────
  {
    category: "Overview",
    label: "Dashboard",
    href: "/dashboard/dashboard",
    icon: <LayoutDashboard size={16} />,
  },

  // ─── Clinical Care ─────────────────────────────────────
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
    label: "Inpatient & Wards",
    icon: <BedDouble size={16} />,
    children: [
      { label: "Ward & Bed Management", href: "/dashboard/wards" },
      { label: "Admissions & Transfers", href: "/dashboard/wards/admissions" },
      { label: "Nursing Care Plans", href: "/dashboard/wards/nursing" },
      { label: "Discharge Summaries", href: "/dashboard/wards/discharges" },
    ],
  },

  {
    label: "Appointments & Queue",
    icon: <CalendarCheck size={16} />,
    children: [
      { label: "Master Calendar", href: "/dashboard/appointments" },
      { label: "Book Appointment", href: "/dashboard/appointments/book" },
      {
        label: "Patient Check-in / Queue",
        href: "/dashboard/appointments/queue",
      },
      { label: "Triage Desk", href: "/dashboard/appointments/triage" },
    ],
  },
  {
    label: "Consultation & SOAP",
    icon: <Stethoscope size={16} />,
    children: [
      { label: "Active Consultations", href: "/dashboard/clinical/notes" },
      { label: "Vitals & Biometrics", href: "/dashboard/clinical/vitals" },
      { label: "Diagnoses & ICD-11", href: "/dashboard/clinical/diagnoses" },
      { label: "Clinical Procedures", href: "/dashboard/clinical/procedures" },
    ],
  },
  {
    label: "Emergency & ER",
    icon: <Siren size={16} />,
    children: [
      { label: "ER Trauma Board", href: "/dashboard/emergency" },
      { label: "Ambulance Dispatch", href: "/dashboard/emergency/ambulance" },
      { label: "Critical Care Monitor", href: "/dashboard/emergency/critical" },
    ],
  },
  {
    label: "Surgical Theater",
    icon: <Scissors size={16} />,
    children: [
      { label: "OR Schedule", href: "/dashboard/theater/schedule" },
      {
        label: "Surgical Safety Checklists",
        href: "/dashboard/theater/checklist",
      },
      { label: "Post-Op Recovery", href: "/dashboard/theater/recovery" },
    ],
  },

  // ─── Diagnostics & Pharmacy ────────────────────────────
  {
    category: "Diagnostics & Pharmacy",
    label: "Laboratory & Pathology",
    icon: <FlaskConical size={16} />,
    children: [
      { label: "Laboratory", href: "/dashboard/labs" },
    //   { label: "Laboratory Setup", href: "/dashboard/labs/setup" },
    //   { label: "Catalog Setup", href: "/dashboard/labs/catalog/new" },
      { label: "Specimen Tracking", href: "/dashboard/labs/specimens" },
      { label: "Results Verification", href: "/dashboard/labs/results" },
      { label: "Pathology Catalog", href: "/dashboard/labs/catalog" },
    ],
  },
  {
    label: "Radiology & PACS",
    icon: <FileScan size={16} />,
    children: [
      { label: "Imaging Worklist", href: "/dashboard/radiology" },
      { label: "DICOM Viewer & Reports", href: "/dashboard/radiology/viewer" },
      { label: "X-Ray / MRI Requests", href: "/dashboard/radiology/requests" },
    ],
  },
  {
    label: "Pharmacy & Dispensary",
    icon: <Pill size={16} />,
    children: [
      {
        label: "e-Prescriptions Queue",
        href: "/dashboard/pharmacy/prescriptions",
      },
      {
        label: "Drug Inventory & Stock",
        href: "/dashboard/pharmacy/inventory",
      },
      { label: "Dispensing & Refills", href: "/dashboard/pharmacy/dispense" },
      {
        label: "Controlled Substances Log",
        href: "/dashboard/pharmacy/controlled",
      },
    ],
  },
  {
    label: "Blood Bank",
    icon: <HeartPulse size={16} />,
    children: [
      { label: "Inventory & Blood Types", href: "/dashboard/blood-bank" },
      {
        label: "Crossmatch Requests",
        href: "/dashboard/blood-bank/crossmatch",
      },
      {
        label: "Transfusion Records",
        href: "/dashboard/blood-bank/transfusions",
      },
    ],
  },

  // ─── Specialty Care ────────────────────────────────----
  {
    category: "Specialty Care",
    label: "Maternal & Child Health",
    icon: <Activity size={16} />,
    children: [
      {
        label: "Antenatal / ANC Records",
        href: "/dashboard/maternal/antenatal",
      },
      { label: "Labor & Delivery Log", href: "/dashboard/maternal/delivery" },
      {
        label: "Immunization & Vaccination",
        href: "/dashboard/maternal/immunization",
      },
      {
        label: "Pediatric Growth Charts",
        href: "/dashboard/maternal/pediatrics",
      },
    ],
  },
  {
    label: "Telemedicine & Virtual",
    icon: <Video size={16} />,
    children: [
      { label: "Virtual Consultations", href: "/dashboard/telemedicine" },
      {
        label: "Remote Patient Monitoring",
        href: "/dashboard/telemedicine/rpm",
      },
    ],
  },
  {
    label: "AI Clinical Analysis",
    icon: <Sparkles size={16} />,
    children: [
      { label: "AI Diagnostic Support", href: "/dashboard/ai/diagnostics" },
      { label: "Automated Chart Summary", href: "/dashboard/ai/summary" },
      { label: "Predictive Risk Scoring", href: "/dashboard/ai/risk-scoring" },
      { label: "Drug Interaction Checker", href: "/dashboard/ai/interactions" },
    ],
  },

  // ─── Administration & Billing ──────────────────────────
  {
    category: "Administration & Billing",
    label: "Billing & HMO Claims",
    icon: <Receipt size={16} />,
    children: [
      { label: "Patient Invoices & POS", href: "/dashboard/billing/invoices" },
      { label: "HMO & Insurance Claims", isComingSoon: true },
      { label: "Pre-authorizations", isComingSoon: true },
      { label: "Service Price Catalog", href: "/dashboard/billing/catalog" },
    ],
  },
  {
    label: "Facilities & Workspaces",
    icon: <Building2 size={16} />,
    children: [
      { label: "Active Facility", href: "/dashboard/workspace" },
      { label: "Create Facility", href: "/dashboard/workspace/create" },
      { label: "Invitations", href: "/dashboard/workspace/invitations" },
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

  // ─── Reports & Compliance ──────────────────────────────
  {
    category: "Reports & Compliance",
    label: "Analytics & Clinical Audit",
    href: "/dashboard/reports",
    icon: <CreditCard size={16} />,
  },
  {
    label: "HIPAA & Security Compliance",
    href: "/dashboard/compliance",
    icon: <ShieldCheck size={16} />,
  },
  {
    label: "Audit Logs",
    href: "/dashboard/compliance/audit-logs",
    icon: <ShieldAlert size={16} />,
  },

  // ─── Settings ──────────────────────────────────────────
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
  if (src) {
    return (
      <img
        src={src}
        alt="Avatar"
        className={`${size} rounded-md object-cover shrink-0 border border-white/10`}
      />
    );
  }

  return (
    <span
      className={`${size} rounded-md shrink-0 flex items-center justify-center font-medium tracking-tight bg-white/10 text-white border border-white/10`}
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

function SidebarContent({
  onNavigate,
  onShowToast,
  hasFacility,
}: {
  onNavigate?: () => void;
  onShowToast: (msg: string) => void;
  hasFacility: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

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

  const companies = facilityList.map((m) => {
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
    : companies.find((c) => c._id === activeFacilityId) || companies[0] || null;

  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const activeItemRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    dispatch(fetchMe());
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  const borderStyle = {
    borderColor: "rgba(255,255,255,0.1)",
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
      onShowToast("Switched facility");
      // Full page reload on facility switch to reset state completely across all records
      window.location.reload();
    } catch (e: any) {
      onShowToast(typeof e === "string" ? e : "Could not switch facility");
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

  const checkChildActive = (node: NavItem | NavChild): boolean => {
    if (node.href && pathname === node.href) return true;
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

  const renderChildrenNodes = (childrenList: NavChild[]) => {
    return childrenList.map((child) => {
      const childActive = child.href ? pathname === child.href : false;
      const hasSubChildren = child.children && child.children.length > 0;
      const isInvitationsTab = child.label.toLowerCase() === "invitations";

      if (child.isComingSoon) {
        return (
          <div
            key={child.label}
            className="flex flex-col items-start gap-1.5 px-2.5 py-2 rounded-md text-[12px] opacity-[0.85] cursor-not-allowed select-none"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              color: "rgba(255, 255, 255, 0.7)",
            }}
          >
            <span className="tracking-tight leading-snug">{child.label}</span>
            <div className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-medium text-white/80">
              <Lock size={10} />
              <span>Coming Soon</span>
            </div>
          </div>
        );
      }

      if (hasSubChildren) {
        const open = !!expanded[child.label];
        const groupActive = checkChildActive(child);

        return (
          <div key={child.label} className="space-y-0.5 my-1">
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
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-colors cursor-pointer group hover:bg-white/5"
              style={{
                backgroundColor: groupActive
                  ? "rgba(255,255,255,0.08)"
                  : "transparent",
                color: "#FFFFFF",
              }}
            >
              <span className="truncate tracking-tight">{child.label}</span>
              <ChevronIcon open={open} />
            </button>

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
                    className="ml-3 pl-3 pt-1 pb-1 space-y-1 border-l"
                    style={borderStyle}
                  >
                    {renderChildrenNodes(child.children!)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
          className="relative flex items-center justify-between px-3 py-1.5 rounded-md text-[12.5px] cursor-pointer transition-colors hover:bg-white/5"
          style={{
            backgroundColor: childActive
              ? "rgba(255,255,255,0.08)"
              : "transparent",
            color: "#FFFFFF",
            fontWeight: childActive ? 600 : 400,
            opacity: childActive ? 1 : 0.75,
          }}
        >
          {childActive && (
            <span
              className="absolute -left-[17px] top-1/2 -translate-y-1/2 w-[3px] h-3.5 rounded-full"
              style={{ backgroundColor: PRIMARY_COLOR }}
            />
          )}
          <span className="truncate tracking-tight">{child.label}</span>

          {isInvitationsTab && pendingInvitations.length > 0 && (
            <span
              className="px-1.5 py-0.2 text-[10px] font-extrabold rounded-full text-black shrink-0"
              style={{ backgroundColor: PRIMARY_COLOR }}
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
      className="flex flex-col h-full select-none antialiased border-r transition-colors duration-200 text-white"
      style={{
        backgroundColor: "#000000",
        ...borderStyle,
      }}
    >
      {/* ─── Facility Switcher (Top) ─────────────────────────── */}
      <div className="px-4 pt-5 pb-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
            className="w-full flex items-center justify-between px-2.5 py-2.5 rounded-lg border transition-all text-left cursor-pointer group hover:bg-white/5"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              ...borderStyle,
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <IdentityChip
                src={activeCompany?.logo}
                initials={companyInitials}
                iconFallback={Building2}
              />
              <div className="min-w-0">
                <p className="text-[13px] font-medium truncate tracking-tight leading-tight text-white">
                  {companyName}
                </p>
                <p className="text-[10.5px] text-white/60 truncate tracking-tight leading-tight">
                  EMR Facility
                </p>
              </div>
            </div>
            <ChevronIcon open={isWorkspaceOpen} />
          </button>

          <AnimatePresence>
            {isWorkspaceOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute left-0 right-0 top-full mt-1.5 border rounded-lg py-1 z-50 text-[13px] shadow-xl text-white"
                style={{
                  backgroundColor: "#0A0A0A",
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
                        className="w-full flex items-center justify-between px-3 py-2 text-left font-medium cursor-pointer hover:bg-white/5 disabled:opacity-50"
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
                            style={{ backgroundColor: PRIMARY_COLOR }}
                          />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-white/50 text-[12px]">
                    No facilities yet
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
                    className="w-full flex items-center gap-2 px-3 py-2 text-left opacity-60 hover:opacity-100 hover:bg-white/5 transition-colors cursor-pointer text-[12px]"
                  >
                    <Plus size={14} /> New facility
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Navigation ───────────────────────────────────────── */}
      <nav
        ref={navRef}
        className="flex-1 px-3 py-1 space-y-4 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]"
      >
        {NAV_ITEMS.map((item, index) => {
          const showCategoryHeader = item.category;
          const active = item.href ? pathname === item.href : false;
          const isFacilityWorkspaceGroup =
            item.label.toLowerCase() === "facilities & workspaces";

          return (
            <div key={item.label} className="space-y-0.5">
              {showCategoryHeader && (
                <div
                  className={`px-3 pb-2 text-[10px] font-semibold tracking-[0.12em] uppercase opacity-50 ${
                    index > 0 ? "pt-3 mt-3 border-t" : "pt-1"
                  }`}
                  style={index > 0 ? borderStyle : undefined}
                >
                  {item.category}
                </div>
              )}

              {item.children ? (
                (() => {
                  const open = !!expanded[item.label];
                  const groupActive = checkChildActive(item);

                  return (
                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.currentTarget.scrollIntoView({
                            behavior: "smooth",
                            block: "nearest",
                            inline: "nearest",
                          });
                          toggleGroup(item.label);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer group hover:bg-white/5"
                        style={{
                          backgroundColor: groupActive
                            ? "rgba(255,255,255,0.08)"
                            : "transparent",
                          color: "#FFFFFF",
                        }}
                      >
                        <span
                          style={{
                            color: groupActive ? PRIMARY_COLOR : "#FFFFFF",
                            opacity: groupActive ? 1 : 0.6,
                          }}
                        >
                          {item.icon}
                        </span>
                        <span className="flex-1 text-left tracking-tight flex items-center gap-2">
                          {item.label}
                          {isFacilityWorkspaceGroup &&
                            pendingInvitations.length > 0 && (
                              <span
                                className="px-1.5 py-0.2 text-[10px] font-extrabold rounded-full text-black shrink-0"
                                style={{ backgroundColor: PRIMARY_COLOR }}
                              >
                                {pendingInvitations.length}
                              </span>
                            )}
                        </span>
                        <ChevronIcon open={open} />
                      </button>

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
                              className="ml-[19px] pl-4 pt-1 pb-1 space-y-1 border-l"
                              style={borderStyle}
                            >
                              {renderChildrenNodes(item.children)}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })()
              ) : item.isComingSoon ? (
                <div
                  className="flex flex-col items-start gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium opacity-[0.85] cursor-not-allowed select-none"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    color: "rgba(255, 255, 255, 0.7)",
                  }}
                >
                  <div className="flex items-center gap-2.5 w-full">
                    <span className="opacity-60">{item.icon}</span>
                    <span className="tracking-tight">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-medium text-white/80">
                    <Lock size={10} />
                    <span>Coming Soon</span>
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
                  className="relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors group hover:bg-white/5"
                  style={{
                    backgroundColor: active
                      ? "rgba(255,255,255,0.08)"
                      : "transparent",
                    color: "#FFFFFF",
                  }}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
                      style={{ backgroundColor: PRIMARY_COLOR }}
                    />
                  )}
                  <span
                    style={{
                      color: active ? PRIMARY_COLOR : "#FFFFFF",
                      opacity: active ? 1 : 0.6,
                    }}
                  >
                    {item.icon}
                  </span>
                  <span className="tracking-tight">{item.label}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* ─── User Profile (Bottom) ────────────────────────────── */}
      <div className="px-3 pb-4 pt-3 border-t" style={borderStyle}>
        <div
          className="flex items-center justify-between px-2.5 py-2 rounded-lg border border-transparent hover:bg-white/10 transition-colors cursor-pointer"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
          onClick={() => goToSettingsTab("personal")}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 group">
            <IdentityChip
              src={profile?.profilePicture}
              initials={userInitials}
              iconFallback={Users}
              size="w-7 h-7 text-[11px] rounded-full"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium truncate tracking-tight leading-tight text-white">
                {fullName}
              </p>
              <p className="text-[10.5px] text-white/60 truncate tracking-tight leading-tight">
                {email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goToSettingsTab("personal");
            }}
            className="w-6 h-6 flex items-center justify-center rounded opacity-60 hover:opacity-100 transition-colors shrink-0 ml-1 text-white"
            title="Go to personal settings"
          >
            <ExternalLink size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { theme, toggleTheme, colors } = useTheme();
  const dispatch = useAppDispatch();
  const { user, accessToken } = useAppSelector((state) => state.auth);

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const { list: facilityList, activeFacilityId } = useAppSelector(
    (state) => state.facilities
  );
  const hasFacility = facilityList.length > 0 || !!activeFacilityId;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  useEffect(() => {
    if (accessToken) {
      dispatch(fetchMe());
      dispatch(fetchMyFacilities());
    }
  }, [accessToken, dispatch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="min-h-screen antialiased lg:flex transition-colors duration-200 relative"
      style={{ backgroundColor: colors.shadeBgSecond, color: colors.text }}
    >
      {/* Toast Notification for Missing Facility */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl text-sm font-semibold"
            style={{
              backgroundColor: colors.shadeBgSecond,
              borderColor: PRIMARY_COLOR,
              color: colors.text,
            }}
          >
            <ShieldAlert size={18} style={{ color: PRIMARY_COLOR }} />
            <span>{toastMessage}</span>
            <Link
              href="/dashboard/workspace/create"
              onClick={() => setToastMessage(null)}
              className="ml-2 px-3 py-1 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              Create Facility Now
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="hidden lg:flex lg:flex-col lg:w-[262px] lg:shrink-0 lg:h-screen lg:sticky lg:top-0">
        <SidebarContent onShowToast={showToast} hasFacility={hasFacility} />
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
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-[264px] shadow-2xl lg:hidden"
            >
              <SidebarContent
                onNavigate={() => setIsMobileNavOpen(false)}
                onShowToast={showToast}
                hasFacility={hasFacility}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        <header
          className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-4 backdrop-blur-sm border-b transition-colors duration-200"
          style={{
            backgroundColor: `${colors.bg}E6`,
            borderColor:
              theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg border cursor-pointer transition-colors"
              style={{
                backgroundColor: colors.shadeBgSecond,
                borderColor:
                  theme === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
                color: colors.text,
              }}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>

            <div className="relative w-full">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none"
              />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search patients, medical records, ICD-11..."
                className="w-full rounded-lg pl-10 pr-14 py-2 text-[13px] border transition-all tracking-tight outline-none"
                style={{
                  backgroundColor: colors.shadeBgSecond,
                  color: colors.text,
                  borderColor: isSearchFocused
                    ? PRIMARY_COLOR
                    : theme === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
                }}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[10px] font-semibold pointer-events-none"
                style={{
                  backgroundColor: colors.bg,
                  borderColor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                  color: colors.text,
                  opacity: 0.7,
                }}
              >
                ⌘K
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
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
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg border cursor-pointer transition-colors"
                style={{
                  backgroundColor: colors.shadeBgSecond,
                  borderColor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                  color: colors.text,
                }}
                aria-label="Notifications"
              >
                <Bell size={16} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2">
                  <span
                    className="absolute inset-0 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: PRIMARY_COLOR }}
                  />
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: PRIMARY_COLOR }}
                  />
                </span>
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 mt-2 w-80 border rounded-xl py-3 z-50 shadow-xl"
                    style={{
                      backgroundColor: colors.shadeBgSecond,
                      color: colors.text,
                      borderColor:
                        theme === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.1)",
                    }}
                  >
                    <div className="px-4 pb-2 flex items-center justify-between">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider">
                        Notifications
                      </h3>
                      <span
                        className="text-[11px] font-medium cursor-pointer"
                        style={{ color: PRIMARY_COLOR }}
                      >
                        Mark all read
                      </span>
                    </div>
                    <div className="py-1 max-h-64 overflow-y-auto space-y-1 px-2">
                      <div className="px-3 py-2.5 cursor-pointer rounded-lg transition-colors flex gap-2.5 hover:opacity-80">
                        <span
                          className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: PRIMARY_COLOR }}
                        />
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-semibold tracking-tight">
                            Critical lab result alert
                          </p>
                          <p className="text-[11px] opacity-70 tracking-tight">
                            Patient Jane Doe potassium levels require review.
                          </p>
                          <span className="text-[10px] opacity-50 mt-1 block">
                            2m ago
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
