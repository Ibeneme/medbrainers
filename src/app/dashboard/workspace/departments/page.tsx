"use client";

import { useState, useEffect } from "react";
import Link from "@/components/access/guarded-link";
import { useRouter } from "next/navigation";
import {
  Building2,
  ArrowLeft,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  HelpCircle,
  X,
  Layers,
  ChevronRight,
} from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import { useAppDispatch } from "@/api/hooks";
import {
  fetchDepartments,
  fetchFacilityMembers,
  fetchMyFacilities,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { getUI } from "@/constants/colors";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import PageGuide, { GuideItem } from "@/components/ui/PageGuide";
import { useFacilityId } from "@/hooks/useFacilityId";

type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};

// Helper function to extract initials from first and last name
function getStaffInitials(staffMember: any): string {
  const firstName = staffMember.firstName || staffMember.user?.firstName || "";
  const lastName = staffMember.lastName || staffMember.user?.lastName || "";

  const firstInitial = firstName.trim().charAt(0) || "";
  const lastInitial = lastName.trim().charAt(0) || "";

  const initials = `${firstInitial}${lastInitial}`.toUpperCase();
  return initials || "ST";
}

export default function DepartmentsListPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const { facilityId, departments, departmentsLoading, members } =
    useFacilityId();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  const departmentsGuideItems: GuideItem[] = [
    {
      title: "View Department Details",
      description:
        "Click on any department card to view its full profile, manage status, delete, and view its searchable staff list.",
    },
    {
      title: "Staff Stack",
      description:
        "See stacked profile pictures or name initials of assigned staff directly on each department card.",
    },
    {
      title: "Search & Filter",
      description: "Quickly filter departments by name, code, or description.",
    },
  ];

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (facilityId) {
      dispatch(fetchDepartments(facilityId));
      dispatch(fetchFacilityMembers(facilityId));
    }
  }, [dispatch, facilityId]);

  const filteredDepartments = (departments || []).filter((dept: any) => {
    const q = searchQuery.toLowerCase();
    return (
      dept.name?.toLowerCase().includes(q) ||
      dept.code?.toLowerCase().includes(q) ||
      dept.description?.toLowerCase().includes(q)
    );
  });

  if (!facilityId) {
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

  return (
    <div
      className={`mx-auto transition-all duration-300 px-3 sm:px-6 py-4 sm:py-6 ${
        showGuide ? "max-w-7xl" : "max-w-5xl"
      }`}
    >
      <div
        className={`grid grid-cols-1 ${
          showGuide ? "lg:grid-cols-3" : "lg:grid-cols-1"
        } gap-6`}
      >
        {/* Main Content Area */}
        <div
          className={`relative rounded-[32px] p-4 sm:p-6 space-y-6 ${
            showGuide ? "lg:col-span-2" : "lg:col-span-1"
          }`}
          style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
        >
          {departmentsLoading && (
            <DarkBlurOverlayLoader text="Loading departments..." />
          )}

          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/dashboard/workspace"
              className="inline-flex items-center gap-1.5 text-xs opacity-60 hover:opacity-100 transition-opacity"
            >
              <ArrowLeft size={14} /> Back to Workspace
            </Link>

            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="inline-flex items-center gap-1.5 text-xs font-medium transition hover:opacity-80"
              style={{ color: PRIMARY_COLOR }}
            >
              <HelpCircle size={13} />
              {showGuide ? "Hide helper" : "Need help?"}
            </button>
          </div>

          {/* Header & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-normal tracking-tight">
                Facility Departments
              </h1>
              <p className="text-xs opacity-60 mt-0.5">
                Manage operational departments and staff allocations.
              </p>
            </div>

            <Link
              href="/dashboard/workspace/departments/create"
              className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 shadow-sm"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Plus size={15} />
              <span>Add Department</span>
            </Link>
          </div>

          {/* Search & View Mode Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div
              className="flex items-center gap-2 w-full rounded-2xl border px-3.5 py-2.5"
              style={{ backgroundColor: ui.inner, borderColor: border }}
            >
              <Search size={15} className="opacity-50 shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search departments by name or code..."
                className="w-full bg-transparent text-xs outline-none"
                style={{ color: ui.text }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="opacity-50 hover:opacity-100"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div
              className="flex items-center rounded-2xl border p-1 shrink-0"
              style={{ backgroundColor: ui.inner, borderColor: border }}
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className="flex h-8 w-8 items-center justify-center rounded-xl transition"
                style={{
                  backgroundColor:
                    viewMode === "grid" ? PRIMARY_COLOR : "transparent",
                  color: viewMode === "grid" ? "#fff" : ui.text,
                }}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className="flex h-8 w-8 items-center justify-center rounded-xl transition"
                style={{
                  backgroundColor:
                    viewMode === "list" ? PRIMARY_COLOR : "transparent",
                  color: viewMode === "list" ? "#fff" : ui.text,
                }}
              >
                <ListIcon size={15} />
              </button>
            </div>
          </div>

          {/* Department List / Grid Display */}
          {filteredDepartments.length === 0 ? (
            <div
              className="rounded-[28px] p-12 text-center space-y-3"
              style={{ backgroundColor: ui.card }}
            >
              <Layers className="mx-auto opacity-30" size={36} />
              <p className="text-sm font-medium">No departments found</p>
              <p className="text-xs opacity-50 max-w-xs mx-auto">
                {searchQuery
                  ? "Try searching with a different keyword."
                  : "Get started by creating your first department."}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredDepartments.map((dept: any) => {
                const deptStaff = (members || []).filter((m: any) =>
                  (dept.staff || []).some(
                    (s: any) =>
                      String(s._id || s) === String(m.id || m.user?._id)
                  )
                );

                return (
                  <div
                    key={dept._id}
                    onClick={() =>
                      router.push(
                        `/dashboard/workspace/departments/${dept._id}`
                      )
                    }
                    className="rounded-[28px] p-5 space-y-4 border transition hover:shadow-lg cursor-pointer flex flex-col justify-between group"
                    style={{ backgroundColor: ui.card, borderColor: border }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider mb-1.5 uppercase"
                            style={{
                              backgroundColor: `${PRIMARY_COLOR}15`,
                              color: PRIMARY_COLOR,
                            }}
                          >
                            {dept.code}
                          </span>
                          <h3 className="text-base font-semibold tracking-tight group-hover:text-[var(--primary)] transition flex items-center gap-1">
                            {dept.name}
                            <ChevronRight
                              size={14}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </h3>
                        </div>
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            dept.isActive !== false
                              ? "bg-emerald-500"
                              : "bg-neutral-400"
                          }`}
                          title={
                            dept.isActive !== false ? "Active" : "Inactive"
                          }
                        />
                      </div>
                      <p className="text-xs opacity-60 line-clamp-2 leading-relaxed">
                        {dept.description || "No description provided."}
                      </p>
                    </div>

                    <div
                      className="pt-3 border-t flex items-center justify-between"
                      style={{ borderColor: border }}
                    >
                      {/* Staff Stack Display with Initials Fallback */}
                      <div className="flex items-center gap-2">
                        {deptStaff.length > 0 ? (
                          <div className="flex -space-x-2 overflow-hidden py-0.5">
                            {deptStaff
                              .slice(0, 4)
                              .map((staffMember: any, idx: number) => {
                                const pic =
                                  staffMember.profilePicture ||
                                  staffMember.user?.profilePicture;
                                const initials = getStaffInitials(staffMember);
                                const fullName = `${
                                  staffMember.firstName ||
                                  staffMember.user?.firstName ||
                                  ""
                                } ${
                                  staffMember.lastName ||
                                  staffMember.user?.lastName ||
                                  ""
                                }`.trim();

                                return (
                                  <div
                                    key={idx}
                                    className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-neutral-900 bg-neutral-200 dark:bg-neutral-800 overflow-hidden text-[9px] font-bold flex items-center justify-center uppercase"
                                    title={fullName || "Staff Member"}
                                  >
                                    {pic ? (
                                      <img
                                        src={pic}
                                        alt={fullName}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      initials
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        ) : null}
                        <span className="text-xs font-medium opacity-75">
                          {deptStaff.length}{" "}
                          {deptStaff.length === 1 ? "staff" : "staff"}
                        </span>
                      </div>

                      <span className="text-xs font-medium opacity-40 group-hover:opacity-100 transition">
                        View details &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="rounded-[28px] border overflow-hidden"
              style={{ backgroundColor: ui.card, borderColor: border }}
            >
              <div className="divide-y" style={{ borderColor: border }}>
                {filteredDepartments.map((dept: any) => {
                  const deptStaff = (members || []).filter((m: any) =>
                    (dept.staff || []).some(
                      (s: any) =>
                        String(s._id || s) === String(m.id || m.user?._id)
                    )
                  );

                  return (
                    <div
                      key={dept._id}
                      onClick={() =>
                        router.push(
                          `/dashboard/workspace/departments/${dept._id}`
                        )
                      }
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                            style={{
                              backgroundColor: `${PRIMARY_COLOR}15`,
                              color: PRIMARY_COLOR,
                            }}
                          >
                            {dept.code}
                          </span>
                          <h3 className="text-sm font-semibold group-hover:text-[var(--primary)] transition">
                            {dept.name}
                          </h3>
                        </div>
                        <p className="text-xs opacity-60">
                          {dept.description || "No description provided."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        {/* Staff Stack in List View */}
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2 overflow-hidden">
                            {deptStaff
                              .slice(0, 3)
                              .map((staffMember: any, idx: number) => {
                                const pic =
                                  staffMember.profilePicture ||
                                  staffMember.user?.profilePicture;
                                const initials = getStaffInitials(staffMember);
                                const fullName = `${
                                  staffMember.firstName ||
                                  staffMember.user?.firstName ||
                                  ""
                                } ${
                                  staffMember.lastName ||
                                  staffMember.user?.lastName ||
                                  ""
                                }`.trim();

                                return (
                                  <div
                                    key={idx}
                                    className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-neutral-900 bg-neutral-200 dark:bg-neutral-800 overflow-hidden text-[8px] font-bold flex items-center justify-center uppercase"
                                    title={fullName || "Staff Member"}
                                  >
                                    {pic ? (
                                      <img
                                        src={pic}
                                        alt={fullName}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      initials
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                          <span className="text-xs opacity-75">
                            {deptStaff.length} staff
                          </span>
                        </div>

                        <ChevronRight
                          size={16}
                          className="opacity-40 group-hover:opacity-100 transition"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <PageGuide
          title="Departments Guide"
          items={departmentsGuideItems}
          isOpen={showGuide}
          onClose={() => setShowGuide(false)}
          ui={ui}
        />
      </div>
    </div>
  );
}
