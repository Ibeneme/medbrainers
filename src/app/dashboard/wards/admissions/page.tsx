"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Check,
  ChevronDown,
  Loader2,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  admitPatient,
  fetchAdmissions,
  fetchMyFacilities,
  fetchPatients,
  fetchWards,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";

function personName(p: unknown) {
  if (!p || typeof p === "string") return "—";
  const x = p as { firstName?: string; lastName?: string; mrn?: string };
  return `${x.firstName || ""} ${x.lastName || ""}`.trim() || x.mrn || "—";
}

function patientIdOf(p: unknown) {
  if (!p || typeof p === "string") return p || "";
  const x = p as { _id?: string };
  return x._id || "";
}

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
                placeholder="Search patients..."
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
                No available patients found
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

export default function AdmissionsPage() {
  const dispatch = useAppDispatch();
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

  const { activeFacilityId, activeFacility } = useAppSelector(
    (s) => s.facilities
  );
  const { list: patients } = useAppSelector((s) => s.patients);
  const { wards, admissions, loading, saving } = useAppSelector((s) => s.wards);

  const [patientId, setPatientId] = useState("");
  const [wardId, setWardId] = useState("");
  const [bedCode, setBedCode] = useState("");
  const [diagnosis, setDiagnosis] = useState("");

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (!activeFacilityId) return;
    dispatch(fetchPatients({ facilityId: activeFacilityId }));
    dispatch(fetchWards(activeFacilityId));
    dispatch(fetchAdmissions({ facilityId: activeFacilityId }));
  }, [dispatch, activeFacilityId]);

  // Filter out patients who are already actively admitted
  const admittedPatientIds = new Set(
    admissions
      .filter((a) => a.status === "admitted")
      .map((a) => patientIdOf(a.patient))
  );

  const availablePatients = patients.filter(
    (p) => !admittedPatientIds.has(p._id)
  );

  const selectedWard = wards.find((w) => w._id === wardId);
  const freeBeds = (selectedWard?.beds || []).filter(
    (b) => b.status === "available"
  );

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
    <div className="mx-auto max-w-6xl px-3 sm:px-6 py-4 sm:py-6">
      <div
        className="relative rounded-[32px] p-4 sm:p-6 space-y-5"
        style={{ backgroundColor: ui.page, color: ui.text }}
      >
        {saving && <DarkBlurOverlayLoader text="Processing admission..." />}

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
                <UserPlus size={20} />
              </span>
              <h1 className="text-3xl sm:text-4xl font-normal tracking-tight">
                Admissions & transfers
              </h1>
            </div>
            <p className="text-xs opacity-55 mt-1 ml-1">
              {activeFacility?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/wards"
              className="rounded-full border px-4 py-2.5 text-xs font-semibold transition hover:opacity-80 outline-none focus:outline-none"
              style={{ backgroundColor: ui.card, borderColor: border }}
            >
              Wards view
            </Link>
          </div>
        </div>

        {/* Admission Form */}
        <form
          className="rounded-[28px] border p-5 sm:p-6 space-y-4"
          style={{ backgroundColor: ui.card, borderColor: border }}
          onSubmit={async (e) => {
            e.preventDefault();
            await dispatch(
              admitPatient({
                facilityId: activeFacilityId,
                payload: {
                  patientId,
                  wardId,
                  bedCode,
                  admittingDiagnosis: diagnosis || undefined,
                },
              })
            ).unwrap();
            dispatch(fetchAdmissions({ facilityId: activeFacilityId }));
            dispatch(fetchWards(activeFacilityId));
            setPatientId("");
            setWardId("");
            setBedCode("");
            setDiagnosis("");
          }}
        >
          <h2 className="text-lg font-semibold tracking-tight mb-1">
            New patient admission
          </h2>
          <p className="text-xs opacity-60 mb-3">
            Admit a registered patient to an available ward and bed, providing
            their initial admitting diagnosis.
          </p>

          <div className="space-y-4">
            <div>
              <CustomDropdown
                label="Patient"
                value={patientId}
                placeholder="Search unadmitted patient…"
                searchable={true}
                options={availablePatients.map((p) => ({
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
                Only patients who are not currently admitted appear in this
                search list.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <CustomDropdown
                  label="Ward"
                  value={wardId}
                  placeholder="Select ward…"
                  options={wards.map((w) => ({
                    label: `${w.name} (${w.code})`,
                    value: w._id,
                  }))}
                  onChange={(val) => {
                    setWardId(val);
                    setBedCode("");
                  }}
                  isDark={isDark}
                  colors={colors}
                  border={border}
                />
                <p className="text-[10px] opacity-50 mt-1">
                  Choose the inpatient ward where the patient will be
                  accommodated.
                </p>
              </div>

              <div>
                <CustomDropdown
                  label="Bed"
                  value={bedCode}
                  placeholder={
                    wardId ? "Select available bed…" : "Select ward first…"
                  }
                  options={freeBeds.map((b) => ({
                    label: `Bed ${b.code}`,
                    value: b.code,
                  }))}
                  onChange={setBedCode}
                  isDark={isDark}
                  colors={colors}
                  border={border}
                  disabled={!wardId}
                />
                <p className="text-[10px] opacity-50 mt-1">
                  Select an available bed code within the chosen ward.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold opacity-70">
                  Diagnosis
                </label>
                <input
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Admitting diagnosis..."
                  className={inputCls}
                  style={inputStyle}
                />
                <p className="text-[10px] opacity-50 mt-1">
                  Initial clinical reason or provisional diagnosis for this
                  admission.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving || !patientId || !wardId || !bedCode}
              className="rounded-full px-6 py-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 outline-none focus:outline-none border border-transparent"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              {saving ? "Admitting..." : "Admit patient"}
            </button>
          </div>
        </form>

        {/* Admissions List */}
        <div
          className="rounded-[28px] border overflow-hidden"
          style={{ backgroundColor: ui.card, borderColor: border }}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-xs opacity-60">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading admissions…
            </div>
          ) : admissions.length === 0 ? (
            <div className="p-12 text-center text-xs opacity-60">
              No active admissions.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: border }}>
              {admissions.map((a: any) => {
                const pid = patientIdOf(a.patient);
                const pObj = a.patient || {};
                const wardName = a.ward?.name || "General Ward";
                const diagnosisText = a.admittingDiagnosis || "None specified";

                return (
                  <div
                    key={a._id}
                    className="p-5 flex flex-wrap items-center justify-between gap-4 text-xs transition hover:opacity-100"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/patients/${pid}`}
                          className="text-sm font-semibold tracking-tight hover:underline"
                          style={{ color: PRIMARY_COLOR }}
                        >
                          {personName(a.patient)}
                        </Link>
                        {pObj.mrn && (
                          <span
                            className="rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold"
                            style={{ backgroundColor: ui.inner }}
                          >
                            {pObj.mrn}
                          </span>
                        )}
                        {pObj.gender && (
                          <span className="text-[11px] opacity-60 capitalize">
                            · {pObj.gender}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 opacity-70">
                        <span>
                          Ward:{" "}
                          <strong className="font-medium">{wardName}</strong>
                        </span>
                        <span>·</span>
                        <span>
                          Bed:{" "}
                          <strong className="font-medium">{a.bedCode}</strong>
                        </span>
                        <span>·</span>
                        <span>
                          Diagnosis:{" "}
                          <strong className="font-medium capitalize">
                            {diagnosisText}
                          </strong>
                        </span>
                        <span>·</span>
                        <span>
                          Admitted: {new Date(a.admittedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/patients/${pid}`}
                        className="rounded-full border px-4 py-2 font-semibold transition hover:opacity-80"
                        style={{
                          backgroundColor: ui.inner,
                          borderColor: border,
                        }}
                      >
                        View folder
                      </Link>
                      <Link
                        href="/dashboard/wards/discharges"
                        className="rounded-full px-4 py-2 font-semibold transition hover:opacity-80 text-white"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                      >
                        Discharge
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
