"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ArrowLeft,
  Loader2,
  Sparkles,
  ChevronRight,
  Globe,
  Mail,
  Phone,
  FileText,
  MapPin,
  HelpCircle,
  X,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { PRIMARY_COLOR } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  createFacility,
  fetchMyFacilities,
  switchFacility,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { getUI } from "@/constants/colors";
import type { FacilityType } from "@/api/types";
import { CustomDropdown } from "@/components/ui/items";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import PageGuide, { GuideItem } from "@/components/ui/PageGuide";

const FACILITY_TYPES: { value: FacilityType; label: string }[] = [
  { value: "hospital", label: "Hospital" },
  { value: "clinic", label: "Clinic" },
  { value: "diagnostic_lab", label: "Diagnostic Lab" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "dental", label: "Dental" },
  { value: "eye_care", label: "Eye Care" },
  { value: "maternity", label: "Maternity" },
  { value: "specialist", label: "Specialist Centre" },
  { value: "primary_care", label: "Primary Care" },
  { value: "telemedicine", label: "Telemedicine" },
  { value: "other", label: "Other" },
];

function sanitizeWebsite(urlStr: string): string {
  const trimmed = urlStr.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

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

export default function CreateFacilityPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const { loading, error } = useAppSelector((s) => s.facilities);

  const [form, setForm] = useState({
    name: "",
    facilityType: "hospital" as FacilityType,
    website: "",
    email: "",
    phone: "",
    description: "",
    licenseNumber: "",
    city: "",
    state: "",
    country: "NG",
  });
  const [customFacilityType, setCustomFacilityType] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Layman-friendly helper guide items
  const facilityGuideItems: GuideItem[] = [
    {
      title: "Facility Identity",
      description:
        "Provide a clear name and select the specialized type of medical institution you are setting up.",
    },
    {
      title: "Contact & Web",
      description:
        "Enter active communication channels including a professional email, phone line, and web link.",
    },
    {
      title: "Location & Compliance",
      description:
        "Input your official city, region state, and operational license number for administrative verification.",
    },
  ];

  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) setConfirmOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen, loading]);

  const inputStyle = {
    backgroundColor: ui.inner,
    color: ui.text,
    borderColor: "transparent",
    boxShadow: "none",
  };

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const trimmed = form.name.trim();
    if (trimmed.length < 2) {
      setLocalError("Facility name must be at least 2 characters");
      return;
    }
    setConfirmOpen(true);
  };

  const createWorkspaceFacility = async () => {
    setLocalError(null);
    const trimmed = form.name.trim();
    const finalFacilityType =
      form.facilityType === "other" && customFacilityType.trim()
        ? (customFacilityType.trim() as FacilityType)
        : form.facilityType;

    const sanitizedWebsite = sanitizeWebsite(form.website);

    try {
      const res = await dispatch(
        createFacility({
          name: trimmed,
          facilityType: finalFacilityType,
          website: sanitizedWebsite || undefined,
          email: form.email.trim(),
          phone: form.phone.trim(),
          description: form.description.trim(),
          licenseNumber: form.licenseNumber.trim() || undefined,
          address: {
            city: form.city.trim(),
            state: form.state.trim(),
            country: form.country.trim() || undefined,
          },
        })
      ).unwrap();
      const id = res.data?.company?._id;
      if (id) {
        try {
          await dispatch(switchFacility(id)).unwrap();
        } catch {
          /* ok */
        }
      }
      await dispatch(fetchMyFacilities());
      router.push("/dashboard/workspace");
    } catch (err: unknown) {
      setConfirmOpen(false);
      setLocalError(
        typeof err === "string" ? err : "Could not create facility"
      );
    }
  };

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
          {loading && !confirmOpen && (
            <DarkBlurOverlayLoader text="Creating facility..." />
          )}

          {/* Breadcrumb & Guide Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href="/dashboard/workspace"
              className="inline-flex items-center gap-1.5 text-xs opacity-60 hover:opacity-100 transition-opacity"
            >
              <ArrowLeft size={14} /> Back to Facilities
            </Link>

            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="inline-flex items-center gap-1.5 text-xs font-medium transition hover:opacity-80"
              style={{ color: PRIMARY_COLOR }}
            >
              <HelpCircle size={13} />
              {showGuide ? "Hide helper" : "Need help setting up?"}
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl font-normal tracking-tight">
            Create new facility
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
              icon={Building2}
              title="General information"
              hint="Name and classification type"
              ui={ui}
            >
              <div className="sm:col-span-2">
                <label className={labelCls}>Facility Name *</label>
                <input
                  autoFocus
                  required
                  minLength={2}
                  maxLength={120}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Sunrise Medical Centre"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              <div
                className={form.facilityType === "other" ? "" : "sm:col-span-2"}
              >
                <CustomDropdown
                  label="Facility Type *"
                  value={form.facilityType}
                  options={FACILITY_TYPES}
                  onChange={(val) => {
                    set("facilityType", val as FacilityType);
                    if (val !== "other") setCustomFacilityType("");
                  }}
                  placeholder="Select facility type..."
                  isDark={isDark}
                  colors={colors}
                  border={border}
                />
              </div>

              {form.facilityType === "other" && (
                <div>
                  <label className={labelCls}>Custom Facility Type *</label>
                  <input
                    required
                    value={customFacilityType}
                    onChange={(e) => setCustomFacilityType(e.target.value)}
                    placeholder="Enter custom type..."
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
              )}
            </Section>

            <Section
              icon={Phone}
              title="Contact details"
              hint="How patients and admins can reach the workspace"
              ui={ui}
            >
              <div>
                <label className={labelCls}>Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="info@clinic.com"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelCls}>Phone *</label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+234..."
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Website</label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="www.example.com or example.com"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            </Section>

            <Section
              icon={MapPin}
              title="Location & Compliance"
              hint="Physical address and official identification"
              ui={ui}
            >
              <div>
                <label className={labelCls}>City *</label>
                <input
                  required
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="e.g. Port Harcourt"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelCls}>State *</label>
                <input
                  required
                  value={form.state}
                  onChange={(e) => set("state", e.target.value)}
                  placeholder="e.g. Rivers State"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>License Number</label>
                <input
                  value={form.licenseNumber}
                  onChange={(e) => set("licenseNumber", e.target.value)}
                  placeholder="LIC-1234567"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            </Section>

            <Section
              icon={FileText}
              title="About"
              hint="Provide a brief summary of the facility profile"
              ui={ui}
            >
              <div className="sm:col-span-2">
                <label className={labelCls}>Description *</label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Brief description of the health facility..."
                  className={`${inputCls} resize-none`}
                  style={inputStyle}
                />
              </div>
            </Section>

            <div className="flex justify-end gap-2 pt-2">
              <Link
                href="/dashboard/workspace"
                className="rounded-full px-6 py-3 text-xs font-semibold"
                style={{ backgroundColor: ui.card }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="rounded-full px-6 py-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 outline-none focus:outline-none flex items-center gap-2 cursor-pointer"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <Sparkles size={14} />
                <span>Create Facility</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Side Guide Panel */}
        <PageGuide
          title="Facility Setup Guide"
          items={facilityGuideItems}
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
            if (e.target === e.currentTarget && !loading) setConfirmOpen(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-[28px] p-6 space-y-5"
            style={{ backgroundColor: ui.card, color: ui.text }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium tracking-tight">
                Create this facility?
              </h3>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
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
                <Building2 size={18} />
              </div>
              <p className="text-sm leading-relaxed opacity-75">
                <span className="font-medium">{form.name.trim()}</span> will be
                created as a new workspace and you will be assigned as the owner
                (CEO).
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setConfirmOpen(false)}
                className="rounded-full px-5 py-2.5 text-xs font-semibold disabled:opacity-50 outline-none focus:outline-none"
                style={{ backgroundColor: ui.inner }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={createWorkspaceFacility}
                className="rounded-full px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50 outline-none focus:outline-none flex items-center gap-2"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                {loading ? (
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
