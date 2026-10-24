"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Check,
  ChevronDown,
  LogOut,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchMyFacilities,
  fetchAdmissions,
  dischargePatient,
  type DischargePayload,
  type DischargeMedicationInput,
  type DischargeReferralInput,
  type DischargeSurgeryInput,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";

type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};

function personName(p: unknown) {
  if (!p || typeof p === "string") return "—";
  const x = p as { firstName?: string; lastName?: string; mrn?: string };
  return `${x.firstName || ""} ${x.lastName || ""}`.trim() || x.mrn || "—";
}

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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = searchable
    ? options.filter((o) => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative flex flex-col gap-1.5" ref={dropdownRef}>
      {label && <label className="text-xs font-semibold opacity-70">{label}</label>}
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
        <span className={selectedOption ? "font-medium truncate capitalize" : "opacity-40 truncate"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 opacity-60 transition-transform shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && !disabled && (
        <div
          className="absolute z-50 mt-1 w-full rounded-2xl border shadow-xl overflow-hidden"
          style={{ backgroundColor: colors.shadeBg || "#fff", borderColor: border, top: "100%" }}
        >
          {searchable && (
            <div className="p-2 border-b" style={{ borderColor: border }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-40" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-xl border-0 bg-transparent py-2 pl-9 pr-3 text-sm outline-none"
                  style={{ color: colors.text }}
                />
              </div>
            </div>
          )}
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <p className="px-4 py-3 text-xs opacity-50">No options</p>
            ) : (
              filteredOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className="flex w-full items-center px-4 py-2.5 text-sm text-left hover:opacity-80 transition"
                  style={{
                    backgroundColor: o.value === value ? "rgba(0,0,0,0.06)" : "transparent",
                    color: colors.text,
                  }}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const emptyMed = (): DischargeMedicationInput => ({
  drugName: "",
  dose: "",
  route: "PO",
  frequency: "",
  duration: "",
  quantity: 1,
});

const emptyReferral = (): DischargeReferralInput => ({
  type: "lab",
  reason: "",
  priority: "routine",
});

const emptySurgery = (): DischargeSurgeryInput => ({
  procedure: "",
  plannedDate: "",
  theater: "",
});

export default function DischargesPage() {
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

  const { activeFacilityId, activeFacility } = useAppSelector((s) => s.facilities);
  const { admissions, saving } = useAppSelector((s) => s.wards);

  const [admissionId, setAdmissionId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [secondaryDx, setSecondaryDx] = useState("");
  const [procedures, setProcedures] = useState("");
  const [hospitalCourse, setHospitalCourse] = useState("");
  const [condition, setCondition] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [diet, setDiet] = useState("");
  const [activity, setActivity] = useState("");
  const [warnings, setWarnings] = useState("");
  const [disposition, setDisposition] = useState<DischargePayload["disposition"]>("home");
  const [transferTo, setTransferTo] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");
  const [meds, setMeds] = useState<DischargeMedicationInput[]>([emptyMed()]);
  const [referrals, setReferrals] = useState<DischargeReferralInput[]>([]);
  const [surgeries, setSurgeries] = useState<DischargeSurgeryInput[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (activeFacilityId) dispatch(fetchAdmissions({ facilityId: activeFacilityId }));
  }, [dispatch, activeFacilityId]);

  const active = (admissions as any[]).filter((a) =>
    ["admitted", "transferred"].includes(a.status),
  );
  const selected = active.find((a) => a._id === admissionId);

  const inputStyle = { backgroundColor: ui.inner, color: ui.text, borderColor: "transparent" };
  const inputCls =
    "w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/25";
  const labelCls = "mb-1.5 block text-xs font-semibold opacity-70";
  const sectionCls = "rounded-[28px] border p-5 sm:p-6 space-y-4";

  async function handleDischarge() {
    if (!activeFacilityId || !admissionId) {
      setError("Select an admission first");
      return;
    }
    setError(null);
    setResult(null);

    const payload: DischargePayload = {
      diagnosis: diagnosis || undefined,
      secondaryDiagnoses: secondaryDx
        ? secondaryDx.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
      procedures: procedures || undefined,
      hospitalCourse: hospitalCourse || undefined,
      conditionOnDischarge: condition || undefined,
      followUpInstructions: followUp || undefined,
      diet: diet || undefined,
      activity: activity || undefined,
      warnings: warnings || undefined,
      disposition,
      transferToFacility: disposition === "transfer" ? transferTo : undefined,
      followUpDate: followUpDate || undefined,
      notes: notes || undefined,
      dischargeMedications: meds.filter((m) => m.drugName.trim()),
      referrals: referrals.filter((r) => r.reason.trim()),
      surgeryBookings: surgeries.filter((s) => s.procedure.trim()),
    };

    try {
      const res = await dispatch(
        dischargePatient({ facilityId: activeFacilityId, admissionId, payload }),
      ).unwrap();
      setResult(res.data || res);
      setAdmissionId("");
      setDiagnosis("");
      setMeds([emptyMed()]);
      setReferrals([]);
      setSurgeries([]);
      if (activeFacilityId) dispatch(fetchAdmissions({ facilityId: activeFacilityId }));
    } catch (e: any) {
      setError(typeof e === "string" ? e : e?.message || "Discharge failed");
    }
  }

  if (!activeFacilityId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center" style={{ color: colors.text }}>
        <Building2 className="mx-auto opacity-30 mb-3" size={32} />
        <p className="font-bold">Select a facility first</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-6 py-4 sm:py-6">
      <div className="relative rounded-[32px] p-4 sm:p-6 space-y-5" style={{ backgroundColor: ui.page, color: ui.text }}>
        {saving && <DarkBlurOverlayLoader text="Processing discharge..." />}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-2xl border"
                style={{ backgroundColor: ui.card, borderColor: border, color: PRIMARY_COLOR }}
              >
                <LogOut size={20} />
              </span>
              <h1 className="text-3xl sm:text-4xl font-normal tracking-tight">Discharge</h1>
            </div>
            <p className="text-xs opacity-55 mt-1 ml-1">
              {activeFacility?.name} · {active.length} admitted · meds → pharmacy · referrals · surgery booking
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/wards/admissions" className="rounded-full border px-4 py-2.5 text-xs font-semibold" style={{ backgroundColor: ui.card, borderColor: border }}>
              Admissions
            </Link>
            <Link href="/dashboard/pharmacy/prescriptions" className="rounded-full border px-4 py-2.5 text-xs font-semibold" style={{ backgroundColor: ui.card, borderColor: border }}>
              Pharmacy queue
            </Link>
          </div>
        </div>

        {result && (
          <div className="rounded-[28px] border p-5 space-y-3" style={{ backgroundColor: "rgba(22,163,74,0.08)", borderColor: "rgba(22,163,74,0.25)" }}>
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#16a34a" }}>
              <Check size={16} /> Patient discharged successfully
            </div>
            {result.continuity && (
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl p-3" style={{ backgroundColor: ui.card }}>
                  <p className="opacity-50 mb-1">Discharged by</p>
                  <p className="font-semibold">
                    {personName(result.continuity.dischargedBy)} ·{" "}
                    {result.continuity.dischargedAt
                      ? new Date(result.continuity.dischargedAt).toLocaleString()
                      : "—"}
                  </p>
                </div>
                <div className="rounded-2xl p-3" style={{ backgroundColor: ui.card }}>
                  <p className="opacity-50 mb-1">Disposition</p>
                  <p className="font-semibold capitalize">{result.continuity.disposition || "home"}</p>
                </div>
                <div className="rounded-2xl p-3" style={{ backgroundColor: ui.card }}>
                  <p className="opacity-50 mb-1">Meds sent to pharmacy</p>
                  <p className="font-semibold">
                    {result.continuity.medicationsSentToPharmacy ?? 0}
                    {result.continuity.pharmacyEstimate != null && (
                      <span className="opacity-60"> · est. {result.continuity.pharmacyEstimate}</span>
                    )}
                  </p>
                </div>
                <div className="rounded-2xl p-3" style={{ backgroundColor: ui.card }}>
                  <p className="opacity-50 mb-1">Referrals / surgeries</p>
                  <p className="font-semibold">
                    {(result.continuity.referrals?.length || 0)} referrals ·{" "}
                    {(result.continuity.surgeryBookings?.length || 0)} surgeries booked
                  </p>
                </div>
              </div>
            )}
            {result.pharmacy && (
              <p className="text-xs opacity-70">
                Pharmacy notified. Prescription status: <strong>{result.pharmacy.status}</strong>
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-2xl px-4 py-3 text-xs font-semibold" style={{ backgroundColor: "rgba(220,38,38,0.12)", color: "#dc2626" }}>
            {error}
          </div>
        )}

        {/* Admission */}
        <div className={sectionCls} style={{ backgroundColor: ui.card, borderColor: border }}>
          <h2 className="text-lg font-semibold tracking-tight">1. Patient & admission</h2>
          <CustomDropdown
            label="Active admission"
            value={admissionId}
            placeholder={active.length ? "Search patient..." : "No active admissions"}
            options={active.map((a: any) => ({
              value: a._id,
              label: `${personName(a.patient)} · bed ${a.bedCode || "—"} · ${a.admittingDiagnosis || a.reason || "—"}`,
            }))}
            onChange={setAdmissionId}
            isDark={isDark}
            colors={colors}
            border={border}
            searchable
          />
          {selected && (
            <div className="rounded-2xl p-3 text-xs" style={{ backgroundColor: ui.inner }}>
              <span className="font-semibold">{personName(selected.patient)}</span>
              {" · "}
              {selected.admittingDiagnosis || selected.reason || "No admitting diagnosis"}
            </div>
          )}
        </div>

        {/* Clinical summary */}
        <div className={sectionCls} style={{ backgroundColor: ui.card, borderColor: border }}>
          <h2 className="text-lg font-semibold tracking-tight">2. Clinical summary</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Primary diagnosis</label>
              <input className={inputCls} style={inputStyle} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Community-acquired pneumonia" />
            </div>
            <div>
              <label className={labelCls}>Secondary diagnoses (comma-separated)</label>
              <input className={inputCls} style={inputStyle} value={secondaryDx} onChange={(e) => setSecondaryDx(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Procedures performed</label>
              <input className={inputCls} style={inputStyle} value={procedures} onChange={(e) => setProcedures(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Condition on discharge</label>
              <input className={inputCls} style={inputStyle} value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="Stable / improved / ..." />
            </div>
          </div>
          <div>
            <label className={labelCls}>Hospital course</label>
            <textarea className={inputCls + " min-h-[88px]"} style={inputStyle} value={hospitalCourse} onChange={(e) => setHospitalCourse(e.target.value)} />
          </div>
        </div>

        {/* Medications → Pharmacy */}
        <div className={sectionCls} style={{ backgroundColor: ui.card, borderColor: border }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">3. Discharge medications → Pharmacy</h2>
            <button
              type="button"
              onClick={() => setMeds((m) => [...m, emptyMed()])}
              className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold"
              style={{ borderColor: border }}
            >
              <Plus size={12} /> Add drug
            </button>
          </div>
          <p className="text-xs opacity-55">These are sent to the pharmacy queue with stock check and cost estimate.</p>
          <div className="space-y-3">
            {meds.map((m, i) => (
              <div key={i} className="grid sm:grid-cols-6 gap-2 items-end rounded-2xl p-3" style={{ backgroundColor: ui.inner }}>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Drug name</label>
                  <input className={inputCls} style={{ ...inputStyle, backgroundColor: ui.card }} value={m.drugName} onChange={(e) => setMeds((arr) => arr.map((x, j) => (j === i ? { ...x, drugName: e.target.value } : x)))} />
                </div>
                <div>
                  <label className={labelCls}>Dose</label>
                  <input className={inputCls} style={{ ...inputStyle, backgroundColor: ui.card }} value={m.dose || ""} onChange={(e) => setMeds((arr) => arr.map((x, j) => (j === i ? { ...x, dose: e.target.value } : x)))} />
                </div>
                <div>
                  <label className={labelCls}>Route</label>
                  <input className={inputCls} style={{ ...inputStyle, backgroundColor: ui.card }} value={m.route || ""} onChange={(e) => setMeds((arr) => arr.map((x, j) => (j === i ? { ...x, route: e.target.value } : x)))} />
                </div>
                <div>
                  <label className={labelCls}>Frequency</label>
                  <input className={inputCls} style={{ ...inputStyle, backgroundColor: ui.card }} value={m.frequency || ""} onChange={(e) => setMeds((arr) => arr.map((x, j) => (j === i ? { ...x, frequency: e.target.value } : x)))} />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className={labelCls}>Qty</label>
                    <input type="number" min={1} className={inputCls} style={{ ...inputStyle, backgroundColor: ui.card }} value={m.quantity || 1} onChange={(e) => setMeds((arr) => arr.map((x, j) => (j === i ? { ...x, quantity: Number(e.target.value) } : x)))} />
                  </div>
                  <button type="button" className="mb-1 p-2 opacity-50 hover:opacity-100" onClick={() => setMeds((arr) => arr.filter((_, j) => j !== i))}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referrals */}
        <div className={sectionCls} style={{ backgroundColor: ui.card, borderColor: border }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">4. Referrals (tests / specialist)</h2>
            <button type="button" onClick={() => setReferrals((r) => [...r, emptyReferral()])} className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: border }}>
              <Plus size={12} /> Add referral
            </button>
          </div>
          {referrals.length === 0 && <p className="text-xs opacity-50">No referrals. Add lab, imaging, or specialist follow-up.</p>}
          <div className="space-y-3">
            {referrals.map((r, i) => (
              <div key={i} className="grid sm:grid-cols-4 gap-2 items-end rounded-2xl p-3" style={{ backgroundColor: ui.inner }}>
                <div>
                  <label className={labelCls}>Type</label>
                  <select className={inputCls} style={{ ...inputStyle, backgroundColor: ui.card }} value={r.type} onChange={(e) => setReferrals((arr) => arr.map((x, j) => (j === i ? { ...x, type: e.target.value as any } : x)))}>
                    <option value="lab">Lab</option>
                    <option value="imaging">Imaging</option>
                    <option value="specialist">Specialist</option>
                    <option value="physiotherapy">Physiotherapy</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Reason</label>
                  <input className={inputCls} style={{ ...inputStyle, backgroundColor: ui.card }} value={r.reason} onChange={(e) => setReferrals((arr) => arr.map((x, j) => (j === i ? { ...x, reason: e.target.value } : x)))} />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className={labelCls}>Priority</label>
                    <select className={inputCls} style={{ ...inputStyle, backgroundColor: ui.card }} value={r.priority || "routine"} onChange={(e) => setReferrals((arr) => arr.map((x, j) => (j === i ? { ...x, priority: e.target.value as any } : x)))}>
                      <option value="routine">Routine</option>
                      <option value="urgent">Urgent</option>
                      <option value="stat">STAT</option>
                    </select>
                  </div>
                  <button type="button" className="mb-1 p-2 opacity-50" onClick={() => setReferrals((arr) => arr.filter((_, j) => j !== i))}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Surgery bookings */}
        <div className={sectionCls} style={{ backgroundColor: ui.card, borderColor: border }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">5. Book surgery (optional)</h2>
            <button type="button" onClick={() => setSurgeries((s) => [...s, emptySurgery()])} className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: border }}>
              <Plus size={12} /> Book OR
            </button>
          </div>
          {surgeries.length === 0 && <p className="text-xs opacity-50">No surgery booked at discharge.</p>}
          <div className="space-y-3">
            {surgeries.map((s, i) => (
              <div key={i} className="grid sm:grid-cols-4 gap-2 items-end rounded-2xl p-3" style={{ backgroundColor: ui.inner }}>
                <div>
                  <label className={labelCls}>Procedure</label>
                  <input className={inputCls} style={{ ...inputStyle, backgroundColor: ui.card }} value={s.procedure} onChange={(e) => setSurgeries((arr) => arr.map((x, j) => (j === i ? { ...x, procedure: e.target.value } : x)))} />
                </div>
                <div>
                  <label className={labelCls}>Planned date/time</label>
                  <input type="datetime-local" className={inputCls} style={{ ...inputStyle, backgroundColor: ui.card }} value={s.plannedDate || ""} onChange={(e) => setSurgeries((arr) => arr.map((x, j) => (j === i ? { ...x, plannedDate: e.target.value } : x)))} />
                </div>
                <div>
                  <label className={labelCls}>Theater room</label>
                  <input className={inputCls} style={{ ...inputStyle, backgroundColor: ui.card }} value={s.theater || ""} onChange={(e) => setSurgeries((arr) => arr.map((x, j) => (j === i ? { ...x, theater: e.target.value } : x)))} />
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className={labelCls}>Notes</label>
                    <input className={inputCls} style={{ ...inputStyle, backgroundColor: ui.card }} value={s.notes || ""} onChange={(e) => setSurgeries((arr) => arr.map((x, j) => (j === i ? { ...x, notes: e.target.value } : x)))} />
                  </div>
                  <button type="button" className="mb-1 p-2 opacity-50" onClick={() => setSurgeries((arr) => arr.filter((_, j) => j !== i))}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disposition & follow-up */}
        <div className={sectionCls} style={{ backgroundColor: ui.card, borderColor: border }}>
          <h2 className="text-lg font-semibold tracking-tight">6. Disposition & follow-up</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Disposition</label>
              <select className={inputCls} style={inputStyle} value={disposition} onChange={(e) => setDisposition(e.target.value as any)}>
                <option value="home">Home</option>
                <option value="transfer">Transfer</option>
                <option value="against_medical_advice">Against medical advice</option>
                <option value="deceased">Deceased</option>
                <option value="other">Other</option>
              </select>
            </div>
            {disposition === "transfer" && (
              <div>
                <label className={labelCls}>Transfer facility</label>
                <input className={inputCls} style={inputStyle} value={transferTo} onChange={(e) => setTransferTo(e.target.value)} />
              </div>
            )}
            <div>
              <label className={labelCls}>Follow-up date</label>
              <input type="date" className={inputCls} style={inputStyle} value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Follow-up instructions</label>
              <input className={inputCls} style={inputStyle} value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Diet</label>
              <input className={inputCls} style={inputStyle} value={diet} onChange={(e) => setDiet(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Activity</label>
              <input className={inputCls} style={inputStyle} value={activity} onChange={(e) => setActivity(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Warnings / red flags</label>
            <textarea className={inputCls + " min-h-[72px]"} style={inputStyle} value={warnings} onChange={(e) => setWarnings(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Additional notes</label>
            <textarea className={inputCls + " min-h-[72px]"} style={inputStyle} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={!admissionId || saving}
            onClick={handleDischarge}
            className="rounded-full px-8 py-3 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            {saving ? "Discharging..." : "Complete discharge"}
          </button>
        </div>
      </div>
    </div>
  );
}
