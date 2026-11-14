"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ArrowLeft,
  Loader2,
  Sparkles,
  HelpCircle,
  X,
  Layers,
  FileText,
  Briefcase,
  Users,
} from "lucide-react";
import Link from "@/components/access/guarded-link";
import { PRIMARY_COLOR } from "@/constants/colors";
import { useAppDispatch } from "@/api/hooks";
import {
  addDepartment,
  fetchDepartments,
  fetchFacilityMembers,
  fetchMyFacilities,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { getUI } from "@/constants/colors";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import PageGuide, { GuideItem } from "@/components/ui/PageGuide";
import { useFacilityId } from "@/hooks/useFacilityId";
import { CustomSearchableMultiStaffDropdown } from "@/components/ui/items";

type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};

const inputCls =
  "w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20";
const labelCls = "mb-1.5 block text-xs font-medium opacity-60";

function Section({
  icon: Icon,
  title,
  hint,
  ui,
  children,
}: {
  icon: any;
  title: string;
  hint?: string;
  ui: UI;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-[28px] p-5 sm:p-6 space-y-4"
      style={{ backgroundColor: ui.card }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
        >
          <Icon size={18} />
        </span>
        <div>
          <h2 className="text-lg font-medium tracking-tight">{title}</h2>
          {hint && <p className="text-xs opacity-55">{hint}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </section>
  );
}

export default function CreateDepartmentPage() {
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);
  const router = useRouter();

  const { facilityId, members, membersLoading, saving, error } =
    useFacilityId();

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Layman-friendly helper guide items for department creation
  const departmentGuideItems: GuideItem[] = [
    {
      title: "Department Identity",
      description:
        "Provide a clear name (e.g. Cardiology, Pharmacy, Emergency) for internal organization.",
    },
    {
      title: "Department Code",
      description:
        "Assign a unique shorthand code (e.g. CARD, PHARM, ER) used across records and billing.",
    },
    {
      title: "Staff Assignment",
      description:
        "Search and select facility members to include in this department right away.",
    },
  ];

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (facilityId) {
      dispatch(fetchFacilityMembers(facilityId));
    }
  }, [dispatch, facilityId]);

  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) setConfirmOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen, saving]);

  const inputStyle = {
    backgroundColor: ui.inner,
    color: ui.text,
    borderColor: "transparent",
    boxShadow: "none",
  };

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Map facility members directly from the root object structure
  const formattedMembers = members.map((m: any) => ({
    id: m.id,
    firstName: m.firstName || "",
    lastName: m.lastName || "",
    email: m.email,
    countryCode: m.countryCode,
    phone: m.phone,
    profilePicture: m.profilePicture,
  }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const trimmedName = form.name.trim();
    const trimmedCode = form.code.trim();

    if (trimmedName.length < 2) {
      setLocalError("Department name must be at least 2 characters");
      return;
    }
    if (!trimmedCode) {
      setLocalError("Department code is required");
      return;
    }
    setConfirmOpen(true);
  };

  const createDepartmentAction = async () => {
    if (!facilityId) return;
    setLocalError(null);

    try {
      await dispatch(
        addDepartment({
          facilityId,
          payload: {
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            description: form.description.trim() || undefined,
            staff: selectedStaff.length > 0 ? selectedStaff : undefined,
          },
        })
      ).unwrap();

      await dispatch(fetchDepartments(facilityId));

      // Clear the form fields and selections after successful creation
      setForm({
        name: "",
        code: "",
        description: "",
      });
      setSelectedStaff([]);
      setConfirmOpen(false);

      router.push("/dashboard/workspace/departments");
    } catch (err: unknown) {
      setConfirmOpen(false);
      setLocalError(
        typeof err === "string" ? err : "Could not create department"
      );
    }
  };

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
        showGuide ? "max-w-7xl" : "max-w-3xl"
      }`}
    >
      <div
        className={`grid grid-cols-1 ${
          showGuide ? "lg:grid-cols-3" : "lg:grid-cols-1"
        } gap-6`}
      >
        {/* Main Form Container */}
        <div
          className={`relative rounded-[32px] p-0 sm:p-3 space-y-5 ${
            showGuide ? "lg:col-span-2" : "lg:col-span-1"
          }`}
          style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
        >
          {saving && !confirmOpen && (
            <DarkBlurOverlayLoader text="Creating department..." />
          )}

          {/* Breadcrumb & Guide Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href="/dashboard/workspace/departments"
              className="inline-flex items-center gap-1.5 text-xs opacity-60 hover:opacity-100 transition-opacity"
            >
              <ArrowLeft size={14} /> Back to Departments
            </Link>

            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="inline-flex items-center gap-1.5 text-xs font-medium transition hover:opacity-80"
              style={{ color: PRIMARY_COLOR }}
            >
              <HelpCircle size={13} />
              {showGuide ? "Hide helper" : "Need help adding a department?"}
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl font-normal tracking-tight">
            Create new department
          </h1>

          {(localError || error) && (
            <p
              className="rounded-2xl px-4 py-3 text-xs font-semibold text-red-500"
              style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
              role="alert"
            >
              {localError || error}
            </p>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <Section
              icon={Layers}
              title="Department details"
              hint="Name and unique reference code"
              ui={ui}
            >
              <div>
                <label className={labelCls}>Department Name *</label>
                <input
                  autoFocus
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Cardiology"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className={labelCls}>Department Code *</label>
                <input
                  required
                  maxLength={20}
                  value={form.code}
                  onChange={(e) => set("code", e.target.value.toUpperCase())}
                  placeholder="e.g. CARD"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            </Section>

            <Section
              icon={Users}
              title="Assign Staff Members"
              hint="Search and select facility members to add to this department"
              ui={ui}
            >
              <div className="sm:col-span-2">
                {membersLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 size={20} className="animate-spin opacity-50" />
                  </div>
                ) : (
                  <CustomSearchableMultiStaffDropdown
                    label="Staff Members"
                    value={selectedStaff}
                    members={formattedMembers}
                    onChange={setSelectedStaff}
                    placeholder="Search and select staff members..."
                    isDark={isDark}
                    colors={colors}
                    border={border}
                  />
                )}
              </div>
            </Section>

            <Section
              icon={FileText}
              title="Description"
              hint="Optional summary of departmental responsibilities"
              ui={ui}
            >
              <div className="sm:col-span-2">
                <label className={labelCls}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Brief overview of the department..."
                  className={`${inputCls} resize-none`}
                  style={inputStyle}
                />
              </div>
            </Section>

            <div className="flex justify-end gap-2 pt-2">
              <Link
                href="/dashboard/workspace/departments"
                className="rounded-full px-6 py-3 text-xs font-semibold"
                style={{ backgroundColor: ui.card }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full px-6 py-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 outline-none focus:outline-none flex items-center gap-2 cursor-pointer"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <Sparkles size={14} />
                <span>Create Department</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Side Guide Panel */}
        <PageGuide
          title="Department Guide"
          items={departmentGuideItems}
          isOpen={showGuide}
          onClose={() => setShowGuide(false)}
          ui={ui}
        />
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) setConfirmOpen(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-[28px] p-6 space-y-5"
            style={{ backgroundColor: ui.card, color: ui.text }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium tracking-tight">
                Create this department?
              </h3>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={saving}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full opacity-70 hover:opacity-100 outline-none focus:outline-none"
                style={{ backgroundColor: ui.inner }}
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${PRIMARY_COLOR}1f`,
                  color: PRIMARY_COLOR,
                }}
              >
                <Briefcase size={18} />
              </div>
              <p className="text-sm leading-relaxed opacity-75">
                <span className="font-medium">{form.name.trim()}</span> (
                {form.code.trim()}) will be added to your facility departments
                list with {selectedStaff.length} assigned staff member(s).
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setConfirmOpen(false)}
                className="rounded-full px-5 py-2.5 text-xs font-semibold disabled:opacity-50 outline-none focus:outline-none"
                style={{ backgroundColor: ui.inner }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={createDepartmentAction}
                className="rounded-full px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50 outline-none focus:outline-none flex items-center gap-2"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Confirm & Create</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}