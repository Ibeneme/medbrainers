"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  Building2,
  Clock,
  FileText,
  Plus,
  Search,
  Settings,
  X,
  FlaskConical,
  Layers,
  ShieldCheck,
  Edit3,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchLaboratory,
  fetchLabCatalog,
  fetchLabRequests,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import PageGuide, { GuideItem } from "@/components/ui/PageGuide";

/* -------------------------------------------------------------------------- */
/*  Design tokens & helpers                                                   */
/* -------------------------------------------------------------------------- */

type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};

const labGuideItems: GuideItem[] = [
  {
    title: "Lab Setup & Departments",
    description:
      "Configure your primary laboratory name and organize specialized clinical departments such as Hematology, Microbiology, and Chemical Pathology.",
  },
  {
    title: "Test Catalog Management",
    description:
      "Define available diagnostic tests with codes, pricing in Naira, turnaround hours, specimen types, and standard reference ranges.",
  },
  {
    title: "Patient Requests & Results",
    description:
      "Monitor real-time status progressions across ordered, collected, processing, resulted, and verified diagnostic test workflows.",
  },
];

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  ui,
}: {
  icon: any;
  label: string;
  value: number | string;
  color: string;
  ui: UI;
}) {
  return (
    <div
      className="rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 space-y-2.5 sm:space-y-3"
      style={{ backgroundColor: ui.card }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl shrink-0"
          style={{ backgroundColor: ui.inner, color }}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs opacity-60 truncate">{label}</p>
          <p className="text-xl sm:text-2xl font-medium leading-tight tracking-tight mt-0.5">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function PillButton({
  onClick,
  children,
  disabled,
  type = "button",
}: {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 sm:px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-95 disabled:opacity-50 outline-none focus:outline-none shrink-0"
      style={{ backgroundColor: PRIMARY_COLOR }}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Laboratory Page (Router-based, Fully Responsive & Guide Integrated)  */
/* -------------------------------------------------------------------------- */

export default function LabHomePage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors, colors?.border);

  // Robust facility ID retrieval matching store and route parameters
  const { activeFacilityId, activeFacility } = useAppSelector(
    (s) => s.facilities
  );
  const facilityId =
    String(params.facilityId || "") ||
    activeFacilityId ||
    activeFacility?._id ||
    "";

  const { laboratory, catalog, requests, listLoading, error } = useAppSelector(
    (s) => s.labs
  );

  const [tab, setTab] = useState<"overview" | "catalog" | "requests">(
    "overview"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!facilityId) {
      console.warn(
        "LabHomePage: No facilityId found in route params or Redux store."
      );
      return;
    }
    dispatch(fetchLaboratory({ facilityId }));
    dispatch(fetchLabCatalog({ facilityId, includeInactive: true }));
    dispatch(fetchLabRequests({ facilityId }));
  }, [dispatch, facilityId]);

  const companyDisplayName =
    activeFacility?.name || laboratory?.name || "Company Laboratory";

  const statusCounts = useMemo(() => {
    const counts = {
      ordered: 0,
      collected: 0,
      processing: 0,
      resulted: 0,
      verified: 0,
      cancelled: 0,
    };
    requests.forEach((req) => {
      req.tests?.forEach((t) => {
        const s = (t.status || "ordered") as keyof typeof counts;
        if (counts[s] !== undefined) counts[s]++;
      });
    });
    return counts;
  }, [requests]);

  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return catalog;
    const q = searchQuery.toLowerCase();
    return catalog.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [catalog, searchQuery]);

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase();
    return requests.filter((req) => {
      const patientName =
        typeof req.patient === "object" && req.patient !== null
          ? `${req.patient.firstName || ""} ${
              req.patient.lastName || ""
            }`.toLowerCase()
          : "";
      const mrn =
        typeof req.patient === "object" && req.patient !== null
          ? String(req.patient.mrn || "").toLowerCase()
          : "";
      return (
        patientName.includes(q) ||
        mrn.includes(q) ||
        req.tests?.some(
          (t) =>
            t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q)
        )
      );
    });
  }, [requests, searchQuery]);

  const tabs = [
    { id: "overview" as const, label: "Lab Home & Status" },
    { id: "catalog" as const, label: `Test Catalog (${catalog.length})` },
    { id: "requests" as const, label: `Patient Requests (${requests.length})` },
  ];

  const pillTab = (active: boolean) => ({
    backgroundColor: active ? PRIMARY_COLOR : ui.card,
    color: active ? "#fff" : ui.text,
  });

  return (
    <div className="w-full px-0 py-0">
      <div
        className={`grid grid-cols-1 ${
          showGuideModal ? "lg:grid-cols-3" : "lg:grid-cols-1"
        } gap-6`}
      >
        {/* Main Content Area */}
        <div
          className={`relative rounded-none sm:rounded-[32px] p-3 sm:p-6 space-y-5 overflow-hidden ${
            showGuideModal ? "lg:col-span-2" : "lg:col-span-1"
          }`}
          style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
        >
          {listLoading && catalog.length === 0 && (
            <DarkBlurOverlayLoader text="Loading laboratory module..." />
          )}

          {(msg || err || error) && (
            <div
              className="fixed right-4 top-4 rounded-2xl px-4 py-3 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200 z-50 shadow-lg"
              style={{
                backgroundColor: ui.card,
                color: err || error ? "#ef4444" : "#059669",
              }}
              role="status"
            >
              {msg || err || error}
            </div>
          )}

          {/* Breadcrumb Header with Guide Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <Link
                href="/dashboard"
                className="opacity-60 hover:opacity-100 shrink-0"
              >
                Dashboard
              </Link>
              <ChevronRight size={12} className="opacity-40 shrink-0" />
              <span className="font-semibold truncate">
                {companyDisplayName} Laboratory
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowGuideModal(!showGuideModal)}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition hover:opacity-90"
                style={{ backgroundColor: ui.card, color: ui.text }}
              >
                <HelpCircle size={13} style={{ color: PRIMARY_COLOR }} />{" "}
                {showGuideModal ? "Hide guide" : "Page Guide"}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/dashboard/labs/setup`)}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 sm:px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-95 outline-none focus:outline-none"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <Settings size={13} /> Lab Setup & Depts
              </button>
            </div>
          </div>

          {/* Hero Banner with Company Name */}
          <div
            className="rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            style={{ backgroundColor: ui.card }}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span
                className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl shrink-0"
                style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
              >
                <FlaskConical size={24} />
              </span>
              <div className="space-y-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-semibold tracking-tight truncate">
                  {companyDisplayName} Laboratory Suite
                </h1>
                <p className="text-xs opacity-60 truncate">
                  {laboratory?.departments?.length
                    ? `${laboratory.departments.length} departments active`
                    : "Laboratory setup configured for this company."}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5 dark:border-white/5">
              <div
                className="rounded-2xl px-3.5 sm:px-4 py-2.5 text-center flex-1 sm:flex-none"
                style={{ backgroundColor: ui.inner }}
              >
                <span className="text-[10px] opacity-50 block uppercase font-bold">
                  Catalog Tests
                </span>
                <span className="text-base sm:text-lg font-semibold">
                  {catalog.length}
                </span>
              </div>
              <div
                className="rounded-2xl px-3.5 sm:px-4 py-2.5 text-center flex-1 sm:flex-none"
                style={{ backgroundColor: ui.inner }}
              >
                <span className="text-[10px] opacity-50 block uppercase font-bold">
                  Total Requests
                </span>
                <span className="text-base sm:text-lg font-semibold">
                  {requests.length}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="whitespace-nowrap rounded-full px-4 sm:px-5 py-2.5 text-xs font-semibold transition outline-none focus:outline-none shrink-0"
                style={pillTab(tab === t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ------------------------------ OVERVIEW / HOME ------------------------------ */}
          {tab === "overview" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h3 className="text-base sm:text-lg font-medium tracking-tight">
                  Test Counts by Status ({companyDisplayName})
                </h3>
                <span className="text-xs opacity-60">
                  Real-time metrics across all patient requests
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                <StatCard
                  icon={Clock}
                  label="Ordered"
                  value={statusCounts.ordered}
                  color="#3b82f6"
                  ui={ui}
                />
                <StatCard
                  icon={Layers}
                  label="Collected"
                  value={statusCounts.collected}
                  color="#8b5cf6"
                  ui={ui}
                />
                <StatCard
                  icon={Activity}
                  label="Processing"
                  value={statusCounts.processing}
                  color="#f59e0b"
                  ui={ui}
                />
                <StatCard
                  icon={FileText}
                  label="Resulted"
                  value={statusCounts.resulted}
                  color="#10b981"
                  ui={ui}
                />
                <StatCard
                  icon={ShieldCheck}
                  label="Verified"
                  value={statusCounts.verified}
                  color="#059669"
                  ui={ui}
                />
                <StatCard
                  icon={X}
                  label="Cancelled"
                  value={statusCounts.cancelled}
                  color="#ef4444"
                  ui={ui}
                />
              </div>

              {/* Departments Breakdown Card */}
              <div
                className="rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 space-y-4"
                style={{ backgroundColor: ui.card }}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2 truncate">
                    <Building2
                      size={16}
                      className="shrink-0"
                      style={{ color: PRIMARY_COLOR }}
                    />{" "}
                    Lab Departments & Units ({companyDisplayName})
                  </h3>
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/labs/setup`)}
                    className="text-xs font-semibold hover:underline shrink-0"
                    style={{ color: PRIMARY_COLOR }}
                  >
                    Manage Departments
                  </button>
                </div>

                {!laboratory?.departments ||
                laboratory.departments.length === 0 ? (
                  <div className="p-8 text-center text-xs opacity-60">
                    No departments configured for this company yet. Click 'Lab
                    Setup & Depts' to add hematology, chemistry, etc.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {laboratory.departments.map((dept, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl p-4 space-y-1"
                        style={{ backgroundColor: ui.inner }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm truncate">
                            {dept.name}
                          </span>
                          <span
                            className="rounded px-2 py-0.5 text-[10px] font-bold uppercase shrink-0"
                            style={{
                              backgroundColor: `${PRIMARY_COLOR}18`,
                              color: PRIMARY_COLOR,
                            }}
                          >
                            {dept.code}
                          </span>
                        </div>
                        {dept.description && (
                          <p className="text-xs opacity-65 pt-0.5 line-clamp-2">
                            {dept.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ------------------------------ TEST CATALOG ------------------------------ */}
          {tab === "catalog" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div
                  className="flex-1 rounded-[22px] px-4 py-2.5 sm:py-2 flex items-center gap-3"
                  style={{ backgroundColor: ui.card }}
                >
                  <Search size={16} className="opacity-40 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search catalog by test name, code, or category..."
                    className="w-full bg-transparent text-xs outline-none focus:outline-none"
                    style={{ color: ui.text }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="opacity-40 hover:opacity-100 text-xs shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <PillButton
                  onClick={() => router.push(`/dashboard/labs/catalog/new`)}
                >
                  <Plus size={14} /> Add New Test
                </PillButton>
              </div>

              {filteredCatalog.length === 0 ? (
                <div
                  className="rounded-[24px] sm:rounded-[28px] p-12 text-center text-xs opacity-60"
                  style={{ backgroundColor: ui.card }}
                >
                  {searchQuery
                    ? "No test items match your search."
                    : "No lab tests created in the catalog yet."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredCatalog.map((item) => (
                    <div
                      key={item._id}
                      className="rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 space-y-3 flex items-start justify-between gap-4"
                      style={{ backgroundColor: ui.card }}
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0"
                            style={{
                              backgroundColor: `${PRIMARY_COLOR}18`,
                              color: PRIMARY_COLOR,
                            }}
                          >
                            {item.code}
                          </span>
                          <span className="text-xs font-semibold opacity-60 truncate">
                            {item.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold truncate">
                          {item.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2.5 text-xs opacity-70">
                          {item.specimenType && (
                            <span className="truncate">
                              Specimen: {item.specimenType}
                            </span>
                          )}
                          {item.turnaroundHours && (
                            <span className="shrink-0">
                              TAT: {item.turnaroundHours} hrs
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-2">
                        <div>
                          <span className="text-sm sm:text-base font-semibold block">
                            ₦{item.price?.toLocaleString() || 0}
                          </span>
                          <span
                            className="inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{
                              backgroundColor: item.isActive
                                ? "rgba(16,185,129,0.15)"
                                : "rgba(239,68,68,0.15)",
                              color: item.isActive ? "#059669" : "#ef4444",
                            }}
                          >
                            {item.isActive ? "Available" : "Disabled"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/dashboard/labs/catalog/${item._id}/edit`
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:opacity-100 transition"
                          title="Edit test"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------ REQUESTS & RESULTS ------------------------------ */}
          {tab === "requests" && (
            <div className="space-y-4">
              <div
                className="rounded-[22px] px-4 py-2.5 sm:py-2 flex items-center gap-3"
                style={{ backgroundColor: ui.card }}
              >
                <Search size={16} className="opacity-40 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search requests by patient name, MRN, or test..."
                  className="w-full bg-transparent text-xs outline-none focus:outline-none"
                  style={{ color: ui.text }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="opacity-40 hover:opacity-100 text-xs shrink-0"
                  >
                    Clear
                  </button>
                )}
              </div>

              {filteredRequests.length === 0 ? (
                <div
                  className="rounded-[24px] sm:rounded-[28px] p-12 text-center text-xs opacity-60"
                  style={{ backgroundColor: ui.card }}
                >
                  {searchQuery
                    ? "No lab requests match your search."
                    : "No lab requests found for this company."}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.map((req) => {
                    const patientName =
                      typeof req.patient === "object" && req.patient !== null
                        ? `${req.patient.firstName || ""} ${
                            req.patient.lastName || ""
                          }`
                        : "Patient";
                    const patientMrn =
                      typeof req.patient === "object" && req.patient !== null
                        ? req.patient.mrn
                        : "";

                    return (
                      <div
                        key={req._id}
                        className="rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 space-y-3"
                        style={{ backgroundColor: ui.card }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold truncate">
                                {patientName}
                              </span>
                              {patientMrn && (
                                <span className="text-xs opacity-50 truncate">
                                  (MRN: {patientMrn})
                                </span>
                              )}
                              <span
                                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase shrink-0"
                                style={{
                                  backgroundColor:
                                    req.status === "completed"
                                      ? "rgba(16,185,129,0.15)"
                                      : "rgba(59,130,246,0.15)",
                                  color:
                                    req.status === "completed"
                                      ? "#059669"
                                      : "#2563eb",
                                }}
                              >
                                {req.status}
                              </span>
                            </div>
                            <p className="text-xs opacity-60 mt-0.5 truncate">
                              Ordered:{" "}
                              {new Date(req.orderedAt).toLocaleString()}
                              {req.priority && ` · Priority: ${req.priority}`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/dashboard/labs/requests/${req._id}`)
                            }
                            className="rounded-full px-4 py-2 text-xs font-semibold outline-none transition hover:opacity-90 self-start sm:self-auto shrink-0"
                            style={{
                              backgroundColor: ui.inner,
                              color: PRIMARY_COLOR,
                            }}
                          >
                            View Details & Results
                          </button>
                        </div>

                        <div
                          className="rounded-2xl p-3 sm:p-4 space-y-2 text-xs"
                          style={{ backgroundColor: ui.inner }}
                        >
                          <span className="font-semibold opacity-60 block mb-1">
                            Tests Included ({req.tests?.length || 0}):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {req.tests?.map((t, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-2 rounded-xl p-2.5"
                                style={{ backgroundColor: ui.card }}
                              >
                                <div className="min-w-0">
                                  <span className="font-semibold truncate block">
                                    {t.name} ({t.code})
                                  </span>
                                  {t.resultValue ? (
                                    <p className="text-[11px] text-emerald-600 font-medium truncate">
                                      Result: {t.resultValue}{" "}
                                      {t.resultUnit || ""}
                                    </p>
                                  ) : (
                                    <p className="text-[11px] opacity-50 italic">
                                      Result pending
                                    </p>
                                  )}
                                </div>
                                <span
                                  className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase shrink-0"
                                  style={{
                                    backgroundColor:
                                      t.status === "verified" ||
                                      t.status === "resulted"
                                        ? "rgba(16,185,129,0.15)"
                                        : "rgba(245,158,11,0.15)",
                                    color:
                                      t.status === "verified" ||
                                      t.status === "resulted"
                                        ? "#059669"
                                        : "#d97706",
                                  }}
                                >
                                  {t.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reusable Guide Component on the right (1/3 width) */}
        <PageGuide
          title="Laboratory Directory Guide"
          items={labGuideItems}
          isOpen={showGuideModal}
          onClose={() => setShowGuideModal(false)}
          ui={ui}
        />
      </div>
    </div>
  );
}
