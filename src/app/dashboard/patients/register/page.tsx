"use client";

import { useEffect, useState } from "react";
import Link from "@/components/access/guarded-link";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronRight,
  HeartPulse,
  HelpCircle,
  Phone,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchMyFacilities, registerPatient } from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import type { Gender } from "@/api/types";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { CustomDropdown, CustomPopupDatePicker } from "@/components/ui/items";
import PageGuide, { GuideItem } from "@/components/ui/PageGuide";

export function getProfilePicture(user: unknown): string | undefined {
  if (!user || typeof user === "string") return undefined;
  const u = user as { profilePicture?: string; avatar?: string };
  return u.profilePicture || u.avatar;
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

export default function RegisterPatientPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);
  const dd = { border: ui.border };

  const { activeFacilityId } = useAppSelector((s) => s.facilities);
  const { saving } = useAppSelector((s) => s.patients);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "" as Gender | "",
    countryCode: "+234",
    phone: "",
    email: "",
    allergy: "",
    familyName: "",
    familyRel: "",
    familyPhone: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Simple, layman-friendly guide hints for registration
  const registerGuideItems: GuideItem[] = [
    {
      title: "Personal Details",
      description:
        "Type in the patient's real first and last names, pick their birth date, and select their gender.",
    },
    {
      title: "Contact Info",
      description:
        "Provide a working email address (compulsory), phone number, and correct country code so the clinic can reach them easily.",
    },
    {
      title: "Known Allergies",
      description:
        "Enter any major medical allergies (like Penicillin) to keep the patient safe during treatments.",
    },
    {
      title: "Emergency Contact",
      description:
        "Optional: Add a close relative or spouse and their phone number in case of emergency.",
    },
  ];

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!form.email.trim()) {
      setErr("Email address is compulsory for patient registration.");
      return;
    }
    if (
      (form.familyName && !form.familyRel) ||
      (!form.familyName && form.familyRel)
    ) {
      setErr(
        "Enter both the emergency contact's name and relationship, or leave both empty.",
      );
      return;
    }
    setConfirmOpen(true);
  };

  const register = async () => {
    if (!activeFacilityId) return;
    setErr(null);
    try {
      await dispatch(
        registerPatient({
          facilityId: activeFacilityId,
          payload: {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            dateOfBirth: form.dateOfBirth || undefined,
            gender: (form.gender || undefined) as Gender | undefined,
            countryCode: form.countryCode || undefined,
            phone: form.phone || undefined,
            email: form.email.trim(),
            allergies: form.allergy
              ? [{ substance: form.allergy, severity: "moderate" }]
              : undefined,
            family:
              form.familyName && form.familyRel
                ? [
                    {
                      name: form.familyName,
                      relationship: form.familyRel,
                      phone: form.familyPhone || undefined,
                      countryCode: form.countryCode,
                      isEmergencyContact: true,
                    },
                  ]
                : undefined,
          },
        }),
      ).unwrap();
      router.push("/dashboard/patients");
    } catch (e: unknown) {
      setConfirmOpen(false);
      setErr(typeof e === "string" ? e : "Registration failed");
    }
  };

  if (!activeFacilityId) {
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
        {/* Main Form Container (takes 2/3 width when guide is open) */}
        <div
          className={`relative rounded-[32px] p-0 sm:p-3 space-y-5 ${
            showGuide ? "lg:col-span-2" : "lg:col-span-1"
          }`}
          style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
        >
          {saving && !confirmOpen && (
            <DarkBlurOverlayLoader text="Registering patient..." />
          )}

          {/* Breadcrumb & Guide Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <Link
                href="/dashboard/patients"
                className="opacity-60 hover:opacity-100"
              >
                Patients
              </Link>
              <ChevronRight size={12} className="opacity-40" />
              <span className="font-semibold">Register</span>
            </div>

            <button
              onClick={() => setShowGuide(!showGuide)}
              className="inline-flex items-center gap-1.5 text-xs font-medium transition hover:opacity-80"
              style={{ color: PRIMARY_COLOR }}
            >
              <HelpCircle size={13} />
              {showGuide ? "Hide helper" : "Need help registering?"}
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl font-normal tracking-tight">
            Register patient
          </h1>

          {err && (
            <p
              className="rounded-2xl px-4 py-3 text-xs font-semibold text-red-500"
              style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
              role="alert"
            >
              {err}
            </p>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <Section
              icon={User}
              title="Personal details"
              hint="Name, birth date and gender"
              ui={ui}
            >
              <div>
                <label className={labelCls}>First name *</label>
                <input
                  required
                  placeholder="Enter first name..."
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelCls}>Last name *</label>
                <input
                  required
                  placeholder="Enter last name..."
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <CustomPopupDatePicker
                label="Date of birth"
                value={form.dateOfBirth}
                onChange={(v) => set("dateOfBirth", v)}
                isDark={isDark}
                colors={colors}
                border={border}
                placeholder="Select date of birth..."
              />
              <CustomDropdown
                label="Gender"
                value={form.gender}
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                  { value: "unknown", label: "Unknown" },
                  { value: "prefer_not_to_say", label: "Prefer not to say" },
                ]}
                onChange={(v) =>
                  setForm((f) => ({ ...f, gender: v as Gender }))
                }
                placeholder="Select gender..."
                {...dd}
              />
            </Section>

            <Section
              icon={Phone}
              title="Contact"
              hint="How the facility can reach the patient"
              ui={ui}
            >
              <div>
                <label className={labelCls}>Country code</label>
                <input
                  placeholder="+234"
                  value={form.countryCode}
                  onChange={(e) => set("countryCode", e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input
                  placeholder="Enter phone number..."
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(e) =>
                    set("phone", e.target.value.replace(/\D/g, ""))
                  }
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Email address *</label>
                <input
                  required
                  type="email"
                  placeholder="Enter email address..."
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            </Section>

            <Section
              icon={HeartPulse}
              title="Medical"
              hint="You can add more allergies later from the patient's record"
              ui={ui}
            >
              <div className="sm:col-span-2">
                <label className={labelCls}>Known allergy</label>
                <input
                  value={form.allergy}
                  onChange={(e) => set("allergy", e.target.value)}
                  placeholder="e.g. Penicillin"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            </Section>

            <Section
              icon={ShieldCheck}
              title="Emergency contact"
              hint="Optional. Fill in the name and relationship together"
              ui={ui}
            >
              <div>
                <label className={labelCls}>Contact name</label>
                <input
                  placeholder="Enter contact name..."
                  value={form.familyName}
                  onChange={(e) => set("familyName", e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelCls}>Relationship</label>
                <input
                  placeholder="e.g. Spouse, Parent..."
                  value={form.familyRel}
                  onChange={(e) => set("familyRel", e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Contact phone</label>
                <input
                  placeholder="Enter contact phone..."
                  inputMode="numeric"
                  value={form.familyPhone}
                  onChange={(e) =>
                    set("familyPhone", e.target.value.replace(/\D/g, ""))
                  }
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            </Section>

            <div className="flex justify-end gap-2">
              <Link
                href="/dashboard/patients"
                className="rounded-full px-6 py-3 text-xs font-semibold"
                style={{ backgroundColor: ui.card }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full px-6 py-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 outline-none focus:outline-none"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                Register patient
              </button>
            </div>
          </form>
        </div>

        {/* Right Side Guide Panel (1/3 width when active) */}
        <PageGuide
          title="Registration Guide"
          items={registerGuideItems}
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
                Register this patient?
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
                <ShieldCheck size={18} />
              </div>
              <p className="text-sm leading-relaxed opacity-75">
                {form.firstName.trim()} {form.lastName.trim()} will be added to
                this facility and given a new MRN.
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
                onClick={register}
                className="rounded-full px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50 outline-none focus:outline-none"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                {saving ? "Registering..." : "Register patient"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
