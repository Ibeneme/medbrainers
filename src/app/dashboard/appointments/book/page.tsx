"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarPlus,
  Check,
  ChevronDown,
  Search,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchMyFacilities,
  fetchPatients,
  fetchFacilityMembers,
  bookAppointment,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";
import { DateTimePicker } from "@/components/ui";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";

type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};

export function CustomDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Select...",
  isDark,
  colors,
  border,
  disabled = false,
  searchable = false,
}: {
  label?: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
  placeholder?: string;
  isDark: boolean;
  colors: any;
  border: string;
  disabled?: boolean;
  searchable?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredOptions = searchable
    ? options.filter((o) =>
        o.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative flex flex-col gap-1.5" ref={dropdownRef}>
      {label && (
        <label className="text-xs font-semibold opacity-70">{label}</label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm focus:outline-none transition disabled:opacity-50"
        style={{
          backgroundColor: colors.shadeBgSecond || "transparent",
          color: colors.text,
          borderColor: border,
        }}
      >
        <span
          className={
            selectedOption
              ? "font-medium truncate capitalize"
              : "opacity-40 truncate"
          }
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 opacity-60 transition-transform shrink-0 ml-2 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div
          className={`absolute top-full left-0 z-[9999] mt-1.5 w-full overflow-hidden rounded-2xl border ${
            isDark ? "border-white/20 bg-[#1e1e1e]" : "border-black/15 bg-white"
          }`}
          style={{ borderColor: border }}
        >
          {searchable && (
            <div
              className={`flex items-center gap-2 border-b px-3.5 py-3 ${
                isDark ? "border-white/10" : "border-black/10"
              }`}
            >
              <Search size={14} className="opacity-50 shrink-0" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search options..."
                className="w-full bg-transparent text-xs outline-none"
                style={{ color: colors.text }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="opacity-50 hover:opacity-100"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs opacity-50">
                No options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold transition hover:opacity-80 capitalize"
                    style={{
                      backgroundColor: isSelected
                        ? isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.05)"
                        : "transparent",
                      color: colors.text,
                    }}
                  >
                    <span className="truncate capitalize">{opt.label}</span>
                    {isSelected && (
                      <Check
                        className="h-3.5 w-3.5 shrink-0 ml-2"
                        style={{ color: PRIMARY_COLOR }}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookAppointmentPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";

  const ui: UI = {
    isDark,
    page: isDark ? "rgba(255,255,255,0.03)" : "#eef2f7",
    card: isDark ? colors.shadeBg : "#ffffff",
    inner: isDark ? colors.shadeBgSecond : "#f3f5f9",
    text: colors.text,
    border,
  };

  const { activeFacilityId, activeFacility, members } = useAppSelector(
    (s) => s.facilities
  );
  const { list: patients } = useAppSelector((s) => s.patients);
  const { saving } = useAppSelector((s) => s.appointments);

  const [patientId, setPatientId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [type, setType] = useState("consultation");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (!activeFacilityId) return;
    dispatch(fetchPatients({ facilityId: activeFacilityId }));
    dispatch(fetchFacilityMembers(activeFacilityId));
  }, [dispatch, activeFacilityId]);

  const inputStyle = {
    backgroundColor: ui.inner,
    color: ui.text,
    borderColor: "transparent",
  };

  const inputCls =
    "w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/25";

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
    <div className="mx-auto max-w-4xl px-3 sm:px-6 py-4 sm:py-6">
      <div
        className="relative rounded-[32px] p-4 sm:p-6 space-y-5"
        style={{ backgroundColor: ui.page, color: ui.text }}
      >
        {saving && <DarkBlurOverlayLoader text="Booking appointment..." />}

        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-2xl border"
                style={{
                  backgroundColor: ui.card,
                  borderColor: border,
                  color: PRIMARY_COLOR,
                }}
              >
                <CalendarPlus size={20} />
              </span>
              <h1 className="text-3xl sm:text-4xl font-normal tracking-tight">
                Book appointment
              </h1>
            </div>
            <p className="text-xs opacity-55 mt-1 ml-1">
              {activeFacility?.name} · Schedule clinical consultations or
              procedures
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/appointments"
              className="rounded-full border px-4 py-2.5 text-xs font-semibold transition hover:opacity-80 outline-none focus:outline-none"
              style={{ backgroundColor: ui.card, borderColor: border }}
            >
              Master calendar
            </Link>
          </div>
        </div>

        {err && (
          <div
            className="rounded-2xl px-4 py-3 text-xs font-semibold"
            style={{
              backgroundColor: "rgba(220,38,38,0.12)",
              color: "#dc2626",
            }}
          >
            {err}
          </div>
        )}

        {/* Booking Form */}
        <form
          className="rounded-[28px] border p-5 sm:p-6 space-y-4"
          style={{ backgroundColor: ui.card, borderColor: border }}
          onSubmit={async (e) => {
            e.preventDefault();
            setErr(null);
            try {
              await dispatch(
                bookAppointment({
                  facilityId: activeFacilityId,
                  payload: {
                    patientId,
                    providerId: providerId || undefined,
                    type,
                    startAt: new Date(startAt).toISOString(),
                    endAt: new Date(endAt).toISOString(),
                    reason: reason || undefined,
                  },
                })
              ).unwrap();
              router.push("/dashboard/appointments");
            } catch (e: unknown) {
              setErr(typeof e === "string" ? e : "Booking failed");
            }
          }}
        >
          <h2 className="text-lg font-semibold tracking-tight mb-1">
            Appointment details
          </h2>
          <p className="text-xs opacity-60 mb-3">
            Select patient, assign an optional attending provider, and configure
            start and end times.
          </p>

          <div className="space-y-4">
            <div>
              <CustomDropdown
                label="Patient *"
                value={patientId}
                placeholder="Search or select patient…"
                searchable={true}
                options={patients.map((p) => ({
                  label: `${p.mrn} · ${p.firstName} ${p.lastName} ${
                    p.gender ? `(${p.gender})` : ""
                  }`,
                  value: p._id,
                }))}
                onChange={setPatientId}
                isDark={isDark}
                colors={colors}
                border={border}
              />
              <p className="text-[10px] opacity-50 mt-1">
                Choose the registered patient for this appointment schedule.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <CustomDropdown
                  label="Provider (optional)"
                  value={providerId}
                  placeholder="Select practitioner…"
                  searchable={true}
                  options={members.map((m) => ({
                    label: `${m.firstName} ${m.lastName}`,
                    value: m.id,
                  }))}
                  onChange={setProviderId}
                  isDark={isDark}
                  colors={colors}
                  border={border}
                />
                <p className="text-[10px] opacity-50 mt-1">
                  Assign a specific physician or healthcare provider if
                  applicable.
                </p>
              </div>

              <div>
                <CustomDropdown
                  label="Type *"
                  value={type}
                  options={[
                    { value: "consultation", label: "Consultation" },
                    { value: "follow_up", label: "Follow-up" },
                    { value: "procedure", label: "Procedure" },
                    { value: "lab", label: "Lab" },
                    { value: "imaging", label: "Imaging" },
                    { value: "telemedicine", label: "Telemedicine" },
                  ]}
                  onChange={setType}
                  isDark={isDark}
                  colors={colors}
                  border={border}
                />
                <p className="text-[10px] opacity-50 mt-1">
                  Category of the scheduled clinical encounter.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <DateTimePicker
                  label="Start *"
                  value={startAt}
                  onChange={setStartAt}
                  required
                  isDark={isDark}
                  colors={colors}
                />
                <p className="text-[10px] opacity-50 mt-1">
                  Scheduled start date and time.
                </p>
              </div>

              <div>
                <DateTimePicker
                  label="End *"
                  value={endAt}
                  onChange={setEndAt}
                  required
                  isDark={isDark}
                  colors={colors}
                />
                <p className="text-[10px] opacity-50 mt-1">
                  Scheduled end date and time.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold opacity-70">Reason</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Annual routine physical examination..."
                className={inputCls}
                style={inputStyle}
              />
              <p className="text-[10px] opacity-50 mt-1">
                Brief clinical description or objective for the visit.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving || !patientId || !startAt || !endAt}
              className="rounded-full px-6 py-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 outline-none focus:outline-none border border-transparent"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              {saving ? "Booking..." : "Book appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
