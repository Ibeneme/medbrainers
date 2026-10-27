"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Loader2,
  Plus,
  Search,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchMyFacilities, fetchPatients } from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";
import { CustomDropdown } from "@/components/ui/items";
import { UserAvatar } from "@/components/ui";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import PageGuide, { GuideItem } from "@/components/ui/PageGuide";

type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  active: { color: "#059669", bg: "rgba(16,185,129,0.14)" },
  inactive: { color: "#6b7280", bg: "rgba(107,114,128,0.16)" },
  discharged: { color: "#d97706", bg: "rgba(245,158,11,0.16)" },
};

function calculateAge(dateOfBirth?: string | Date): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
  ui,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  ui: UI;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-[28px] p-5"
      style={{ backgroundColor: ui.card }}
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ backgroundColor: ui.inner, color }}
      >
        <Icon size={20} />
      </span>
      <div>
        <p className="text-xs opacity-60">{label}</p>
        <p className="text-3xl font-medium leading-tight tracking-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function PatientDirectoryPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = colors?.text + 12;

  const ui: UI = {
    isDark,
    page: colors.bg,
    card: colors.shadeBg,
    inner: colors.shadeBgSecond,
    text: colors.text,
    border,
  };

  const {
    activeFacilityId,
    activeFacility,
    loading: facilitiesLoading,
  } = useAppSelector((s) => s.facilities);
  const {
    list: reduxList,
    listLoading,
    meta,
  } = useAppSelector((s) => s.patients);

  const [cachedPatients, setCachedPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const limit = 10;

  // Define page-specific guide hints here
  const patientDirectoryGuideItems: GuideItem[] = [
    {
      title: "Searching Patients",
      description:
        "Use the search bar at the top to instantly query patients by full name, Medical Record Number (MRN), or phone number.",
    },
    {
      title: "Filtering & Categorizing",
      description:
        "Filter records effortlessly by Gender, Age group (Child, Teen, Adult), or active/discharged status using the dropdowns.",
    },
    {
      title: "Viewing Patient Profiles",
      description:
        "Click anywhere on a patient table row to open their comprehensive EMR file, consultation history, and vitals.",
    },
    {
      title: "Registering New Patients",
      description: (
        <>
          Click the top-right{" "}
          <span className="font-semibold text-primary">Register Patient</span>{" "}
          button to add a new admission or client profile into the active
          facility.
        </>
      ),
    },
  ];

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  // Load cached patients on facility change
  useEffect(() => {
    if (!activeFacilityId) return;
    const cacheKey = `cached_patients_${activeFacilityId}`;
    const saved = localStorage.getItem(cacheKey);
    if (saved) {
      try {
        setCachedPatients(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse patient cache", e);
      }
    }
  }, [activeFacilityId]);

  // Fetch fresh data with pagination & filters
  useEffect(() => {
    if (!activeFacilityId) return;
    dispatch(
      fetchPatients({
        facilityId: activeFacilityId,
        page: currentPage,
        limit,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search.trim() ? search.trim() : undefined,
      })
    );
  }, [dispatch, activeFacilityId, currentPage, statusFilter, search]);

  // Sync Redux list to local cache
  useEffect(() => {
    if (!activeFacilityId || !reduxList.length) return;
    setCachedPatients(reduxList);
    const cacheKey = `cached_patients_${activeFacilityId}`;
    localStorage.setItem(cacheKey, JSON.stringify(reduxList));
  }, [reduxList, activeFacilityId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, ageFilter]);

  const displayList = reduxList.length > 0 ? reduxList : cachedPatients;

  // Local client-side filtering for gender & age categories
  const filteredList = displayList.filter((p) => {
    if (genderFilter !== "all" && p.gender !== genderFilter) return false;

    if (ageFilter !== "all") {
      const age = calculateAge(p.dateOfBirth);
      if (age === null) return false;
      if (ageFilter === "child" && age >= 13) return false;
      if (ageFilter === "teen" && (age < 13 || age > 19)) return false;
      if (ageFilter === "adult" && age < 20) return false;
    }

    return true;
  });

  const totalItems = meta?.total ?? filteredList.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  const isInitialLoading = facilitiesLoading || listLoading;
  if (!isInitialLoading && !activeFacilityId) {
    return (
      <div
        className="max-w-lg mx-auto px-4 py-16 text-center"
        style={{ color: colors.text }}
      >
        <Building2 className="mx-auto opacity-30 mb-3" size={32} />
        <p className="font-bold">Select a facility first</p>
      </div>
    );
  }

  const total = totalItems;
  const activeCount = filteredList.filter((p) => p.status === "active").length;
  const dischargedCount = filteredList.filter(
    (p) => p.status === "discharged"
  ).length;

  return (
    <div
      className={`mx-auto transition-all duration-300 ${
        showGuideModal ? "max-w-7xl" : "max-w-5xl"
      }`}
    >
      <div
        className={`grid grid-cols-1 ${
          showGuideModal ? "lg:grid-cols-3" : "lg:grid-cols-1"
        } gap-6`}
      >
        {/* Main Directory Container (takes 2/3 cols when guide is open) */}
        <div
          className={`relative rounded-[32px] sm:p-4 space-y-5 ${
            showGuideModal ? "lg:col-span-2" : "lg:col-span-1"
          }`}
          style={{ color: ui.text }}
        >
          {listLoading && displayList.length === 0 && (
            <DarkBlurOverlayLoader text="Loading patients..." />
          )}

          {/* Title row */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-xs opacity-60">
                {activeFacility?.name || "EMR Facility"}
              </p>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl sm:text-4xl font-normal tracking-tight">
                  Patient directory
                </h1>
              </div>
              {/* Guide hint toggle */}
              <button
                onClick={() => setShowGuideModal(!showGuideModal)}
                className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium transition hover:opacity-80 text-left"
                style={{ color: PRIMARY_COLOR }}
              >
                <HelpCircle size={13} />
                {showGuideModal
                  ? "Hide guide & details"
                  : "New here? Click to view full guide & details"}
              </button>
            </div>
            <Link
              href="/dashboard/patients/register"
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Plus size={14} /> Register patient
            </Link>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard
              icon={Users}
              label="Patients in list"
              value={total}
              color={PRIMARY_COLOR}
              ui={ui}
            />
            <SummaryCard
              icon={UserCheck}
              label="Active"
              value={activeCount}
              color="#10b981"
              ui={ui}
            />
            <SummaryCard
              icon={UserMinus}
              label="Discharged"
              value={dischargedCount}
              color="#f59e0b"
              ui={ui}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div
              className="flex items-center gap-2.5 rounded-full px-4 py-3 sm:col-span-4 border transition focus-within:border-primary/50"
              style={{ backgroundColor: ui.card, borderColor: ui.border }}
            >
              <Search size={15} className="opacity-50 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, MRN, phone…"
                className="w-full bg-transparent text-sm outline-none"
                style={{ color: ui.text }}
              />
            </div>
            <CustomDropdown
              value={genderFilter}
              options={[
                { label: "All Genders", value: "all" },
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
                { label: "Other", value: "other" },
              ]}
              onChange={(val) => setGenderFilter(val)}
              placeholder="Filter by gender..."
              isDark={isDark}
              colors={colors}
              border={border}
            />
            <CustomDropdown
              value={ageFilter}
              options={[
                { label: "All Ages", value: "all" },
                { label: "Child (< 13)", value: "child" },
                { label: "Teen (13 - 19)", value: "teen" },
                { label: "Adult (20+)", value: "adult" },
              ]}
              onChange={(val) => setAgeFilter(val)}
              placeholder="Filter by age..."
              isDark={isDark}
              colors={colors}
              border={border}
            />
            <CustomDropdown
              value={statusFilter}
              options={[
                { label: "All Statuses", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
                { label: "Discharged", value: "discharged" },
              ]}
              onChange={(val) => setStatusFilter(val)}
              placeholder="Filter by status..."
              isDark={isDark}
              colors={colors}
              border={border}
            />
          </div>

          {/* Table Container */}
          <div
            className="rounded-[28px] p-3 sm:p-5 space-y-4"
            style={{ backgroundColor: ui.card }}
          >
            {listLoading && displayList.length === 0 ? (
              <div className="flex items-center justify-center gap-2 p-12 text-xs opacity-60">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading patients…
              </div>
            ) : filteredList.length === 0 ? (
              <div className="p-12 text-center text-sm opacity-60">
                No patients found matching your search or filters.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr
                        className="text-xs opacity-50 border-b"
                        style={{ borderColor: ui.border }}
                      >
                        <th className="px-3 pb-3 font-medium">Patient</th>
                        <th className="px-3 pb-3 font-medium">MRN</th>
                        <th className="px-3 pb-3 font-medium hidden sm:table-cell">
                          Gender / Age
                        </th>
                        <th className="px-3 pb-3 font-medium hidden md:table-cell">
                          Contact
                        </th>
                        <th className="px-3 pb-3 font-medium">Status</th>
                        <th className="px-3 pb-3 w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredList.map((p) => {
                        const st =
                          STATUS_STYLE[p.status as string] ||
                          STATUS_STYLE.inactive;
                        const age = calculateAge(p.dateOfBirth);
                        return (
                          <tr
                            key={p._id || p.mrn}
                            onClick={() =>
                              router.push(`/dashboard/patients/${p._id}`)
                            }
                            className="cursor-pointer transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                          >
                            <td className="px-3 py-3.5">
                              <div className="flex items-center gap-3">
                                <UserAvatar user={p} size="sm" />
                                <Link
                                  href={`/dashboard/patients/${p._id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-semibold hover:underline"
                                >
                                  {p.firstName} {p.lastName}
                                </Link>
                              </div>
                            </td>
                            <td className="px-3 py-3.5">
                              <span
                                className="rounded-full px-2.5 py-1 font-mono text-[11px]"
                                style={{ backgroundColor: ui.inner }}
                              >
                                {p.mrn}
                              </span>
                            </td>
                            <td className="px-3 py-3.5 text-xs capitalize hidden sm:table-cell opacity-70">
                              {p.gender || "—"}{" "}
                              {age !== null ? `(${age} yrs)` : ""}
                            </td>
                            <td className="px-3 py-3.5 text-xs opacity-60 hidden md:table-cell">
                              {[p.countryCode, p.phone]
                                .filter(Boolean)
                                .join(" ") ||
                                p.email ||
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
                                {p.status || "—"}
                              </span>
                            </td>
                            <td className="px-3 py-3.5 opacity-40 text-right">
                              <ChevronRight size={16} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    className="flex items-center justify-between pt-4 border-t text-xs"
                    style={{ borderColor: ui.border }}
                  >
                    <span className="opacity-60">
                      Showing {(currentPage - 1) * limit + 1} to{" "}
                      {Math.min(currentPage * limit, totalItems)} of{" "}
                      {totalItems} patients
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(p - 1, 1))
                        }
                        disabled={currentPage === 1 || listLoading}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium transition disabled:opacity-30 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                      >
                        <ChevronLeft size={14} /> Previous
                      </button>
                      <span className="px-2 font-medium opacity-80">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(p + 1, totalPages))
                        }
                        disabled={currentPage === totalPages || listLoading}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium transition disabled:opacity-30 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Reusable Guide Component on the right (1/3 width) */}
        <PageGuide
          title="Directory Quick Guide"
          items={patientDirectoryGuideItems}
          isOpen={showGuideModal}
          onClose={() => setShowGuideModal(false)}
          ui={ui}
        />
      </div>
    </div>
  );
}
