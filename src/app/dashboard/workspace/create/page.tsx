"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ArrowLeft,
  Loader2,
  Sparkles,
  ChevronDown,
  Check,
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
import type { FacilityType } from "@/api/types";

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

function CustomDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Select...",
  isDark,
  colors,
}: {
  label?: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
  placeholder?: string;
  isDark: boolean;
  colors: any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative flex flex-col gap-1.5" ref={dropdownRef}>
      {label && (
        <label className="text-xs font-semibold opacity-75">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full h-12 items-center justify-between rounded-xl border px-4 text-sm focus:outline-none transition"
        style={{
          backgroundColor: colors.shadeBgSecond || "transparent",
          borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
          color: colors.text,
        }}
      >
        <span className={selectedOption ? "font-medium" : "opacity-40"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 opacity-65 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div
          className="absolute top-full left-0 z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border shadow-xl"
          style={{
            backgroundColor: colors.shadeBg,
            borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)",
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-semibold transition hover:opacity-85"
                style={{
                  backgroundColor: isSelected
                    ? isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.05)"
                    : "transparent",
                  color: colors.text,
                }}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <Check
                    className="h-3.5 w-3.5"
                    style={{ color: PRIMARY_COLOR }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CreateFacilityPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
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

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const trimmed = form.name.trim();
    if (trimmed.length < 2) {
      setLocalError("Facility name must be at least 2 characters");
      return;
    }

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
      setLocalError(
        typeof err === "string" ? err : "Could not create facility"
      );
    }
  };

  const inputStyle = {
    backgroundColor: colors.shadeBgSecond,
    color: colors.text,
    borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
  };

  return (
    <div
      className="max-w-xl mx-auto px-4 sm:px-6 py-8 transition-colors duration-200"
      style={{ color: colors.text }}
    >
      <Link
        href="/dashboard/workspace"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium opacity-60 hover:opacity-100 mb-6 transition-opacity"
      >
        <ArrowLeft size={15} /> Back to Facilities
      </Link>

      <div
        className="rounded-2xl border p-6 sm:p-8 space-y-6"
        style={{
          backgroundColor: colors.shadeBg,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        }}
      >
        <div
          className="flex items-start gap-4 pb-5 border-b"
          style={{
            borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: `${PRIMARY_COLOR}15`,
              borderColor: `${PRIMARY_COLOR}30`,
              color: PRIMARY_COLOR,
            }}
          >
            <Building2 size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Create New Facility
            </h1>
            <p className="text-xs sm:text-sm opacity-60 mt-0.5">
              Set up your health facility workspace. You will be the owner
              (CEO).
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-tight opacity-75 mb-2">
              Facility Name *
            </label>
            <input
              autoFocus
              required
              minLength={2}
              maxLength={120}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Sunrise Medical Centre"
              className="w-full h-12 rounded-xl px-4 text-sm outline-none transition-colors border"
              style={inputStyle}
            />
          </div>

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
          />

          {form.facilityType === "other" && (
            <div>
              <label className="block text-xs font-semibold tracking-tight opacity-75 mb-2">
                Custom Facility Type *
              </label>
              <input
                required
                value={customFacilityType}
                onChange={(e) => setCustomFacilityType(e.target.value)}
                placeholder="Enter custom facility type..."
                className="w-full h-12 rounded-xl px-4 text-sm outline-none border"
                style={inputStyle}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold opacity-75 mb-2">
                Website
              </label>
              <input
                type="text"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="www.example.com or example.com"
                className="w-full h-11 rounded-xl px-4 text-sm outline-none border"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold opacity-75 mb-2">
                Email *
              </label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="info@clinic.com"
                className="w-full h-11 rounded-xl px-4 text-sm outline-none border"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold opacity-75 mb-2">
                Phone *
              </label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+234..."
                className="w-full h-11 rounded-xl px-4 text-sm outline-none border"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold opacity-75 mb-2">
                License No.
              </label>
              <input
                value={form.licenseNumber}
                onChange={(e) => set("licenseNumber", e.target.value)}
                placeholder="LIC-1234567"
                className="w-full h-11 rounded-xl px-4 text-sm outline-none border"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold opacity-75 mb-2">
                City *
              </label>
              <input
                required
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="e.g. Port Harcourt"
                className="w-full h-11 rounded-xl px-4 text-sm outline-none border"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold opacity-75 mb-2">
                State *
              </label>
              <input
                required
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                placeholder="e.g. Rivers State"
                className="w-full h-11 rounded-xl px-4 text-sm outline-none border"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold opacity-75 mb-2">
              Description *
            </label>
            <textarea
              required
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Brief description of the health facility..."
              className="w-full rounded-xl px-4 py-3 text-sm outline-none border resize-none"
              style={inputStyle}
            />
          </div>

          {(localError || error) && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-3 text-xs sm:text-sm font-medium text-red-600 dark:text-red-300">
              {localError || error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: PRIMARY_COLOR }}
            className="w-full h-12 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creating facility…</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Create Facility</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
