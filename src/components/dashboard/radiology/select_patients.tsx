"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "@/components/access/guarded-link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Activity,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchPatients } from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { useFacilityId } from "@/hooks/useFacilityId";

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  active: { color: "#059669", bg: "rgba(16,185,129,0.14)" },
  inactive: { color: "#6b7280", bg: "rgba(107,114,128,0.16)" },
  discharged: { color: "#d97706", bg: "rgba(245,158,11,0.16)" },
};
export interface BreadcrumbRoute {
  label: string;
  href?: string;
}
interface SelectPatientsProps {
  title?: string;
  description?: string;
  maxSelectable?: number;
  routes?: BreadcrumbRoute[];
  destinationPath?: string;
}
export default function SelectPatientsPage({
  title: defaultTitle,
  description: defaultDescription,
  maxSelectable = 10,
  routes: defaultRoutes,
  destinationPath: defaultDestinationPath,
}: SelectPatientsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isVitalsMode = searchParams.get("type") === "vitals";

  const title =
    defaultTitle ||
    (isVitalsMode
      ? "Select Patients to Record Vitals"
      : "Select Patients for Consultation");
  const description =
    defaultDescription ||
    (isVitalsMode
      ? "Select up to {max} patients to record vital signs simultaneously."
      : "Select up to {max} patients to record clinical sessions simultaneously.");
  const routes =
    defaultRoutes ||
    (isVitalsMode
      ? [
          { label: "Company Vitals", href: "/dashboard/consultations/vitals" },
          { label: "Select Patients" },
        ]
      : [
          { label: "All Consultations", href: "/dashboard/consultations" },
          { label: "Select Patients" },
        ]);
  const destinationPath =
    defaultDestinationPath ||
    (isVitalsMode
      ? "/dashboard/consultations/vitals/create"
      : "/dashboard/consultations/patients/create");
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);
  const { facilityId, facilitiesLoading } = useFacilityId();
  const { list: patients, listLoading } = useAppSelector((s) => s.patients);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Fetch patients on mount or facility change
  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchPatients({ facilityId, limit: 100 }));
  }, [dispatch, facilityId]);
  // Filter local search across names, MRN, phone, and email
  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter((p) => {
      const fullName = `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase();
      const mrn = (p.mrn || "").toLowerCase();
      const phone = (p.phone || "").toLowerCase();
      const email = (p.email || "").toLowerCase();
      return (
        fullName.includes(q) ||
        mrn.includes(q) ||
        phone.includes(q) ||
        email.includes(q)
      );
    });
  }, [patients, searchQuery]);
  const toggleSelectPatient = (id: string) => {
    setErrorMessage(null);
    if (selectedPatientIds.includes(id)) {
      setSelectedPatientIds(selectedPatientIds.filter((item) => item !== id));
    } else {
      if (selectedPatientIds.length >= maxSelectable) {
        setErrorMessage(
          `You can select a maximum of ${maxSelectable} patients at a time.`
        );
        return;
      }
      setSelectedPatientIds([...selectedPatientIds, id]);
    }
  };
  const handleProceed = () => {
    if (selectedPatientIds.length === 0) {
      setErrorMessage("Please select at least one patient to continue.");
      return;
    }
    const idsQuery = selectedPatientIds.join(",");
    router.push(`${destinationPath}?patients=${encodeURIComponent(idsQuery)}`);
  };
  const formattedDescription = description.replace(
    "{max}",
    String(maxSelectable)
  );
  return (
    <div className="mx-auto max-w-6xl w-full ">
      {(listLoading || facilitiesLoading) &&
        (!patients || patients.length === 0) && (
          <DarkBlurOverlayLoader text="Loading patient directory..." />
        )}
      <div
        className="space-y-6 w-full "
        style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
      >
        {/* Dynamic Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 opacity-70 overflow-hidden text-ellipsis whitespace-nowrap">
            {routes.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5 shrink-0">
                {i > 0 && (
                  <ChevronRight size={12} className="shrink-0 opacity-40" />
                )}
                {r.href ? (
                  <Link href={r.href} className="hover:opacity-100">
                    {r.label}
                  </Link>
                ) : (
                  <span className="font-semibold">{r.label}</span>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              if (facilityId)
                dispatch(fetchPatients({ facilityId, limit: 100 }));
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition hover:opacity-90 border shrink-0"
            style={{
              backgroundColor: ui.card,
              borderColor: ui.border,
              color: ui.text,
            }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
        {/* Header & Selection Counter Banner */}
        <div
          className="rounded-[20px] sm:rounded-[28px] p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border"
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <span
              className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl shrink-0"
              style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
            >
              {isVitalsMode ? <Activity size={22} /> : <Users size={22} />}
            </span>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">
                {title}
              </h1>
              <p className="text-xs opacity-60 mt-0.5 leading-relaxed">
                {formattedDescription}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-black/5 dark:border-white/5">
            <div className="text-left md:text-right">
              <p className="text-xs font-bold">
                {selectedPatientIds.length} / {maxSelectable} Selected
              </p>
              <p className="text-[10px] opacity-50">Max limit reached</p>
            </div>
            <button
              type="button"
              disabled={selectedPatientIds.length === 0}
              onClick={handleProceed}
              className="inline-flex items-center gap-2 rounded-full px-5 sm:px-6 py-2.5 sm:py-3 text-xs font-bold text-white transition hover:opacity-90  disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              Proceed <ArrowRight size={14} />
            </button>
          </div>
        </div>
        {errorMessage && (
          <div className="rounded-2xl p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {/* Search Bar */}
        <div
          className="rounded-[20px] sm:rounded-[22px] px-4 py-3 flex items-center gap-3 border"
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <Search size={16} className="opacity-40 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patients by name, MRN, phone, or email..."
            className="w-full bg-transparent text-xs outline-none"
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
        {/* Patients Table Container */}
        {filteredPatients.length === 0 ? (
          <div
            className="rounded-[24px] sm:rounded-[28px] p-12 sm:p-16 text-center border space-y-2"
            style={{ backgroundColor: ui.card, borderColor: ui.border }}
          >
            <Users size={36} className="mx-auto opacity-30" />
            <p className="text-sm font-medium opacity-80">No patients found.</p>
            <p className="text-xs opacity-50">
              Try checking your search query or register new patients.
            </p>
          </div>
        ) : (
          <div
            className="rounded-[24px] sm:rounded-[28px] p-2 sm:p-4 border overflow-x-auto w-full"
            style={{ backgroundColor: ui.card, borderColor: ui.border }}
          >
            <table className="w-full text-left text-sm min-w-[650px]">
              <thead>
                <tr
                  className="text-xs opacity-50 border-b"
                  style={{ borderColor: ui.border }}
                >
                  <th className="px-3 pb-3 font-medium w-12 text-center">
                    Select
                  </th>
                  <th className="px-3 pb-3 font-medium">Patient Name</th>
                  <th className="px-3 pb-3 font-medium">MRN</th>
                  <th className="px-3 pb-3 font-medium hidden sm:table-cell">
                    Gender
                  </th>
                  <th className="px-3 pb-3 font-medium hidden md:table-cell">
                    Contact
                  </th>
                  <th className="px-3 pb-3 font-medium">Status</th>
                  <th className="px-3 pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => {
                  const isSelected = selectedPatientIds.includes(p._id);
                  const st =
                    STATUS_STYLE[p.status as string] || STATUS_STYLE.inactive;
                  return (
                    <tr
                      key={p._id}
                      onClick={() => toggleSelectPatient(p._id)}
                      className={`cursor-pointer transition border-b last:border-0 ${
                        isSelected
                          ? "bg-black/[0.04] dark:bg-white/[0.06]"
                          : "hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                      }`}
                      style={{ borderColor: ui.border }}
                    >
                      <td className="px-3 py-3.5 text-center">
                        <div
                          className={`h-5 w-5 rounded-lg border mx-auto flex items-center justify-center transition ${
                            isSelected
                              ? "border-primary bg-primary text-white"
                              : "border-black/20 dark:border-white/20"
                          }`}
                          style={{
                            backgroundColor: isSelected
                              ? PRIMARY_COLOR
                              : undefined,
                            borderColor: isSelected ? PRIMARY_COLOR : undefined,
                          }}
                        >
                          {isSelected && <CheckCircle2 size={14} />}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs shrink-0 text-white"
                            style={{ backgroundColor: PRIMARY_COLOR }}
                          >
                            {p.firstName?.[0]}
                            {p.lastName?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs truncate">
                              {p.firstName}{" "}
                              {p.middleName ? `${p.middleName} ` : ""}
                              {p.lastName}
                            </p>
                            {p.email && (
                              <p className="text-[11px] opacity-50 truncate">
                                {p.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className="rounded-full px-2.5 py-1 font-mono text-[11px] inline-block"
                          style={{ backgroundColor: ui.inner }}
                        >
                          {p.mrn || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-xs capitalize hidden sm:table-cell opacity-70">
                        {p.gender || "—"}
                      </td>
                      <td className="px-3 py-3.5 text-xs opacity-60 hidden md:table-cell">
                        {[p.countryCode, p.phone].filter(Boolean).join(" ") ||
                          "—"}
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize inline-block"
                          style={{
                            color: st.color,
                            backgroundColor: st.bg,
                          }}
                        >
                          {p.status || "active"}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <Link
                          href={`/dashboard/patients/${p._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold border transition hover:opacity-85 whitespace-nowrap"
                          style={{
                            backgroundColor: ui.inner,
                            borderColor: ui.border,
                          }}
                        >
                          View Details <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}