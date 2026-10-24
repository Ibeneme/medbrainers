"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  FileText,
  Plus,
  Stethoscope,
  Trash2,
  X,
  AlertTriangle,
  FlaskConical,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { addConsultation, fetchPatient, fetchLabCatalog } from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { CustomDropdown } from "@/components/ui";

const inputCls =
  "w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20";

export default function NewConsultationPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = String(params.patientId || "");
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const { activeFacilityId } = useAppSelector((s) => s.facilities);
  const { current } = useAppSelector((s) => s.patients);
  const { catalog: labCatalog } = useAppSelector((s) => s.labs);

  const [conTitle, setConTitle] = useState("");
  const [conComplaint, setConComplaint] = useState("");
  const [conDiagnosis, setConDiagnosis] = useState("");
  const [conIcd, setConIcd] = useState("");
  const [conNotes, setConNotes] = useState("");
  const [conSummary, setConSummary] = useState("");
  const [conStatus, setConStatus] = useState<"open" | "completed">("open");
  const [conTemp, setConTemp] = useState("");
  const [conSpo2, setConSpo2] = useState("");
  const [conPulse, setConPulse] = useState("");
  const [conSys, setConSys] = useState("");
  const [conDia, setConDia] = useState("");

  const [conTests, setConTests] = useState<
    Array<{
      catalogId?: string;
      code: string;
      name: string;
      price: number;
      reason?: string;
      urgency?: string;
    }>
  >([]);

  const [conDrugs, setConDrugs] = useState<
    Array<{
      name: string;
      dosage?: string;
      frequency?: string;
      route?: string;
      duration?: string;
      instructions?: string;
    }>
  >([]);

  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<
    Array<{ id: string; title: string; updatedAt: string; data: any }>
  >([]);

  const STORAGE_KEY = `consultation_drafts_${patientId}`;
  const AUTO_SAVE_KEY = `consultation_autosave_${patientId}`;
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (activeFacilityId) {
      if (patientId && !current) {
        dispatch(fetchPatient({ facilityId: activeFacilityId, patientId }));
      }
      dispatch(
        fetchLabCatalog({
          facilityId: activeFacilityId,
          includeInactive: false,
        })
      );
    }
  }, [dispatch, activeFacilityId, patientId, current]);

  useEffect(() => {
    const savedDrafts = localStorage.getItem(STORAGE_KEY);
    if (savedDrafts) {
      try {
        setDrafts(JSON.parse(savedDrafts));
      } catch (e) {
        console.error("Failed to parse consultation drafts", e);
      }
    }

    const savedAutosave = localStorage.getItem(AUTO_SAVE_KEY);
    if (savedAutosave) {
      try {
        const parsed = JSON.parse(savedAutosave);
        handleLoadDraft(parsed);
      } catch (e) {
        console.error("Failed to parse consultation autosave", e);
      }
    }
  }, [STORAGE_KEY, AUTO_SAVE_KEY]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const currentFormData = {
      conTitle,
      conComplaint,
      conDiagnosis,
      conIcd,
      conNotes,
      conSummary,
      conStatus,
      conTemp,
      conSpo2,
      conPulse,
      conSys,
      conDia,
      conTests,
      conDrugs,
    };

    const handler = setTimeout(() => {
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(currentFormData));
      setLastAutoSaved(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearTimeout(handler);
  }, [
    conTitle,
    conComplaint,
    conDiagnosis,
    conIcd,
    conNotes,
    conSummary,
    conStatus,
    conTemp,
    conSpo2,
    conPulse,
    conSys,
    conDia,
    conTests,
    conDrugs,
    AUTO_SAVE_KEY,
  ]);

  const handleAddCatalogTest = (testId: string) => {
    if (!testId) return;
    const catalogItem = labCatalog.find((item) => item._id === testId);
    if (!catalogItem) return;

    if (conTests.some((t) => t.catalogId === catalogItem._id)) return;

    setConTests([
      ...conTests,
      {
        catalogId: catalogItem._id,
        code: catalogItem.code,
        name: catalogItem.name,
        price: catalogItem.price || 0,
        urgency: "routine",
      },
    ]);
  };

  const handleGrandTotal = () => {
    return conTests.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  };

  const handleSaveToDrafts = () => {
    const draftData = {
      conTitle,
      conComplaint,
      conDiagnosis,
      conIcd,
      conNotes,
      conSummary,
      conStatus,
      conTemp,
      conSpo2,
      conPulse,
      conSys,
      conDia,
      conTests,
      conDrugs,
    };

    let updatedDrafts = [...drafts];

    if (activeDraftId) {
      updatedDrafts = updatedDrafts.map((d) =>
        d.id === activeDraftId
          ? {
              ...d,
              title: conTitle.trim() || "Untitled Consultation Draft",
              updatedAt: new Date().toLocaleString(),
              data: draftData,
            }
          : d
      );
    } else {
      const newId = Date.now().toString();
      const newDraft = {
        id: newId,
        title: conTitle.trim() || "Untitled Consultation Draft",
        updatedAt: new Date().toLocaleString(),
        data: draftData,
      };
      updatedDrafts = [newDraft, ...updatedDrafts];
      setActiveDraftId(newId);
    }

    setDrafts(updatedDrafts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDrafts));
  };

  const handleLoadDraft = (draft: { id?: string; data: any }) => {
    if (draft.id) setActiveDraftId(draft.id);
    const draftData = draft.data || draft;
    setConTitle(draftData.conTitle || "");
    setConComplaint(draftData.conComplaint || "");
    setConDiagnosis(draftData.conDiagnosis || "");
    setConIcd(draftData.conIcd || "");
    setConNotes(draftData.conNotes || "");
    setConSummary(draftData.conSummary || "");
    setConStatus(draftData.conStatus || "open");
    setConTemp(draftData.conTemp || "");
    setConSpo2(draftData.conSpo2 || "");
    setConPulse(draftData.conPulse || "");
    setConSys(draftData.conSys || "");
    setConDia(draftData.conDia || "");
    setConTests(draftData.conTests || []);
    setConDrugs(draftData.conDrugs || []);
  };

  const confirmDeleteDraft = (
    id: string,
    title: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setDraftToDelete({ id, title });
  };

  const handleDeleteDraftConfirmed = () => {
    if (!draftToDelete) return;
    const filtered = drafts.filter((d) => d.id !== draftToDelete.id);
    setDrafts(filtered);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    if (activeDraftId === draftToDelete.id) {
      setActiveDraftId(null);
    }
    setDraftToDelete(null);
  };

  const handleOpenPreview = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);
    setShowPreviewModal(true);
  };

  const handleConfirmFinalSubmit = async () => {
    if (!activeFacilityId || !patientId) return;
    setSubmissionError(null);

    const vitalsObj: Record<string, number> = {};
    if (conTemp) vitalsObj.temperatureC = Number(conTemp);
    if (conSpo2) vitalsObj.spo2 = Number(conSpo2);
    if (conPulse) vitalsObj.pulse = Number(conPulse);
    if (conSys) vitalsObj.bpSystolic = Number(conSys);
    if (conDia) vitalsObj.bpDiastolic = Number(conDia);

    const cleanedVitals = Object.keys(vitalsObj).length ? vitalsObj : undefined;

    const cleanedTests = conTests
      .filter((t) => t.name && t.name.trim().length > 0)
      .map((t) => ({
        catalogId: t.catalogId,
        code: t.code || "LAB",
        name: t.name.trim(),
        price: Number(t.price) || 0,
        urgency: t.urgency || "routine",
        reason: t.reason,
        status: "ordered" as const,
      }));

    const cleanedDrugs = conDrugs
      .map((d) => ({ ...d, name: d.name ? d.name.trim() : "" }))
      .filter((d) => d.name.length > 0);

    const grandTotalPrice = handleGrandTotal();

    const payload = {
      title: conTitle.trim(),
      complaint: conComplaint.trim(),
      diagnosis: conDiagnosis.trim() || undefined,
      icdCode: conIcd.trim() || undefined,
      notes: conNotes.trim() || undefined,
      summary: conSummary.trim() || undefined,
      status: conStatus,
      vitals: cleanedVitals,
      recommendedTests: cleanedTests.length ? cleanedTests : undefined,
      recommendedDrugs: cleanedDrugs.length ? cleanedDrugs : undefined,
      totalPrice: grandTotalPrice,
    };

    try {
      await dispatch(
        addConsultation({ facilityId: activeFacilityId, patientId, payload })
      ).unwrap();

      localStorage.removeItem(AUTO_SAVE_KEY);
      if (activeDraftId) {
        const filtered = drafts.filter((d) => d.id !== activeDraftId);
        setDrafts(filtered);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      }

      setShowPreviewModal(false);
      router.push(`/dashboard/patients/${patientId}`);
    } catch (err: any) {
      console.error("Failed to save final consultation", err);
      if (err?.errors && Array.isArray(err.errors)) {
        const errorMsgs = err.errors
          .map((e: any) => `${e.path}: ${e.message}`)
          .join(", ");
        setSubmissionError(`Validation failed: ${errorMsgs}`);
      } else {
        setSubmissionError(
          err?.message ||
            "Failed to save consultation. Please check your inputs and try again."
        );
      }
      setShowPreviewModal(false);
    }
  };

  const calculateAge = (dob?: string) => {
    if (!dob) return "—";
    const diff = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const inputStyle = {
    backgroundColor: ui.inner,
    color: ui.text,
    borderColor: "transparent",
    boxShadow: "none",
  };

  return (
    <div className="mx-auto max-w-4xl px-0 sm:px-6 py-0 sm:py-6 w-full">
      <div
        className="rounded-none sm:rounded-[32px] p-4 sm:p-8 space-y-6 w-full shadow-none sm:shadow"
        style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs opacity-70 truncate pr-2">
            <Link
              href="/dashboard/patients"
              className="hover:opacity-100 shrink-0"
            >
              Patients
            </Link>
            <ChevronRight size={12} className="shrink-0" />
            <Link
              href={`/dashboard/patients/${patientId}`}
              className="hover:opacity-100 truncate"
            >
              {current ? `${current.firstName} ${current.lastName}` : "Patient"}
            </Link>
            <ChevronRight size={12} className="shrink-0" />
            <span className="font-semibold shrink-0">New Consultation</span>
          </div>
          {lastAutoSaved && (
            <span className="text-[11px] opacity-50 italic shrink-0">
              Autosaved at {lastAutoSaved}
            </span>
          )}
        </div>

        {submissionError && (
          <div className="rounded-2xl p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-start gap-3">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Submission Error</p>
              <p>{submissionError}</p>
            </div>
            <button
              onClick={() => setSubmissionError(null)}
              className="opacity-70 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
            style={{ backgroundColor: ui.card, color: PRIMARY_COLOR }}
          >
            <Stethoscope size={24} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-normal tracking-tight">
              Record New Consultation
            </h1>
            <p className="text-xs opacity-60">
              Document patient visit, findings, lab tests from catalog, and
              prescriptions
            </p>
          </div>
        </div>

        {current && (
          <div
            className="rounded-[24px] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4"
            style={{ backgroundColor: ui.card }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm text-white"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                {current.firstName?.[0]}
                {current.lastName?.[0]}
              </div>
              <div>
                <h3 className="text-sm font-semibold">
                  {current.firstName} {current.lastName}
                </h3>
                <p className="text-xs opacity-60">MRN: {current.mrn || "—"}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
              <div>
                <span className="opacity-50 block">Gender</span>
                <span className="font-medium capitalize">
                  {current.gender || "—"}
                </span>
              </div>
              <div>
                <span className="opacity-50 block">Age</span>
                <span className="font-medium">
                  {calculateAge(current.dateOfBirth)} yrs
                </span>
              </div>
              <div>
                <span className="opacity-50 block">Contact</span>
                <span className="font-medium">
                  {[current.countryCode, current.phone]
                    .filter(Boolean)
                    .join(" ") ||
                    current.email ||
                    "—"}
                </span>
              </div>
            </div>
          </div>
        )}

        {drafts.length > 0 && (
          <div
            className="rounded-2xl p-4 space-y-3"
            style={{ backgroundColor: ui.card }}
          >
            <p className="text-xs font-semibold opacity-70">
              Saved Drafts ({drafts.length}) - Click to Resume:
            </p>
            <div className="flex flex-wrap gap-2">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  onClick={() => handleLoadDraft(draft)}
                  className={`group flex items-center gap-2 rounded-xl px-3 py-2 text-xs cursor-pointer border transition hover:opacity-90 max-w-full ${
                    activeDraftId === draft.id ? "ring-2 ring-primary" : ""
                  }`}
                  style={{
                    backgroundColor: ui.inner,
                    borderColor:
                      activeDraftId === draft.id ? PRIMARY_COLOR : ui.border,
                  }}
                >
                  <div className="truncate">
                    <p className="font-semibold truncate">{draft.title}</p>
                    <p className="text-[10px] opacity-50">{draft.updatedAt}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) =>
                      confirmDeleteDraft(draft.id, draft.title, e)
                    }
                    className="opacity-40 group-hover:opacity-100 text-red-500 p-1 shrink-0"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleOpenPreview}>
          <div
            className="rounded-none sm:rounded-[28px] p-4 sm:p-6 space-y-4 -mx-4 sm:mx-0"
            style={{ backgroundColor: ui.card }}
          >
            <h2 className="text-sm font-semibold">Visit Details</h2>
            <div>
              <label className="mb-1.5 block text-xs font-medium opacity-80">
                Summary Title *
              </label>
              <input
                required
                value={conTitle}
                onChange={(e) => setConTitle(e.target.value)}
                placeholder="e.g. Acute Fever Consultation"
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium opacity-80">
                Chief Complaint *
              </label>
              <textarea
                required
                rows={3}
                value={conComplaint}
                onChange={(e) => setConComplaint(e.target.value)}
                placeholder="Describe patient's chief complaint..."
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium opacity-80">
                  Diagnosis
                </label>
                <input
                  value={conDiagnosis}
                  onChange={(e) => setConDiagnosis(e.target.value)}
                  placeholder="e.g. Upper respiratory tract infection"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium opacity-80">
                  ICD Code
                </label>
                <input
                  value={conIcd}
                  onChange={(e) => setConIcd(e.target.value)}
                  placeholder="e.g. J06.9"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div
            className="rounded-none sm:rounded-[28px] p-4 sm:p-6 space-y-4 -mx-4 sm:mx-0"
            style={{ backgroundColor: ui.card }}
          >
            <h2 className="text-sm font-semibold">Visit Vitals Snapshot</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-[11px] opacity-70">
                  Temp (°C)
                </label>
                <input
                  value={conTemp}
                  onChange={(e) => setConTemp(e.target.value)}
                  placeholder="36.6"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] opacity-70">
                  SpO2 (%)
                </label>
                <input
                  value={conSpo2}
                  onChange={(e) => setConSpo2(e.target.value)}
                  placeholder="98"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] opacity-70">
                  Pulse (bpm)
                </label>
                <input
                  value={conPulse}
                  onChange={(e) => setConPulse(e.target.value)}
                  placeholder="75"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] opacity-70">
                  Systolic (mmHg)
                </label>
                <input
                  value={conSys}
                  onChange={(e) => setConSys(e.target.value)}
                  placeholder="120"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] opacity-70">
                  Diastolic (mmHg)
                </label>
                <input
                  value={conDia}
                  onChange={(e) => setConDia(e.target.value)}
                  placeholder="80"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div
            className="rounded-none sm:rounded-[28px] p-4 sm:p-6 space-y-4 -mx-4 sm:mx-0"
            style={{ backgroundColor: ui.card }}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FlaskConical size={18} style={{ color: PRIMARY_COLOR }} />
                <h2 className="text-sm font-semibold">Recommended Lab Tests</h2>
              </div>
              <div className="w-full">
                <CustomDropdown
                  value=""
                  options={[
                    { value: "", label: "+ Select test from lab catalog..." },
                    ...labCatalog.map((item) => ({
                      value: item._id,
                      label: `${item.code} - ${item.name} (₦${
                        item.price?.toLocaleString() || 0
                      })`,
                    })),
                  ]}
                  onChange={(val) => {
                    if (val) handleAddCatalogTest(val);
                  }}
                  placeholder="Search and select lab test..."
                  isDark={isDark}
                  colors={colors}
                  border={border}
                />
              </div>
            </div>

            {conTests.length === 0 ? (
              <div
                className="rounded-2xl p-6 text-center text-xs opacity-50 border border-dashed"
                style={{ borderColor: ui.border }}
              >
                No lab tests added yet. Select tests from your company's lab
                catalog above.
              </div>
            ) : (
              <div className="space-y-3">
                {conTests.map((t, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border"
                    style={{
                      backgroundColor: ui.inner,
                      borderColor: ui.border,
                    }}
                  >
                    <div className="space-y-0.5 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                          style={{
                            backgroundColor: `${PRIMARY_COLOR}18`,
                            color: PRIMARY_COLOR,
                          }}
                        >
                          {t.code}
                        </span>
                        <span className="text-xs font-semibold">{t.name}</span>
                      </div>
                      <p className="text-xs font-medium text-emerald-600">
                        Cost: ₦{t.price?.toLocaleString() || 0}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-36">
                        <CustomDropdown
                          value={t.urgency || "routine"}
                          options={[
                            { value: "routine", label: "Routine" },
                            { value: "urgent", label: "Urgent" },
                            { value: "stat", label: "STAT" },
                          ]}
                          onChange={(val) => {
                            const updated = [...conTests];
                            updated[i].urgency = val;
                            setConTests(updated);
                          }}
                          isDark={isDark}
                          colors={colors}
                          border={border}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setConTests(conTests.filter((_, idx) => idx !== i))
                        }
                        className="text-red-500 p-2 hover:bg-red-500/10 rounded-xl"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                <div
                  className="flex items-center justify-between rounded-2xl p-4 font-semibold text-xs mt-2"
                  style={{ backgroundColor: ui.inner }}
                >
                  <span>Total Lab Tests Cost:</span>
                  <span className="text-sm font-bold text-emerald-600">
                    ₦{handleGrandTotal().toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div
            className="rounded-none sm:rounded-[28px] p-4 sm:p-6 space-y-4 -mx-4 sm:mx-0"
            style={{ backgroundColor: ui.card }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Prescriptions & Drugs</h2>
              <button
                type="button"
                onClick={() =>
                  setConDrugs([
                    ...conDrugs,
                    { name: "", dosage: "", frequency: "", duration: "" },
                  ])
                }
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white shrink-0"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <Plus size={12} /> Add Drug
              </button>
            </div>
            {conDrugs.map((d, i) => (
              <div
                key={i}
                className="space-y-3 p-3 sm:p-4 rounded-2xl border"
                style={{ borderColor: ui.border }}
              >
                <div className="flex gap-2 items-center">
                  <input
                    value={d.name}
                    onChange={(e) => {
                      const updated = [...conDrugs];
                      updated[i].name = e.target.value;
                      setConDrugs(updated);
                    }}
                    placeholder="Drug name (e.g. Paracetamol)"
                    className={inputCls}
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setConDrugs(conDrugs.filter((_, idx) => idx !== i))
                    }
                    className="text-red-500 p-2 hover:opacity-80 shrink-0"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    value={d.dosage || ""}
                    onChange={(e) => {
                      const updated = [...conDrugs];
                      updated[i].dosage = e.target.value;
                      setConDrugs(updated);
                    }}
                    placeholder="Dosage (500mg)"
                    className={inputCls}
                    style={inputStyle}
                  />
                  <input
                    value={d.frequency || ""}
                    onChange={(e) => {
                      const updated = [...conDrugs];
                      updated[i].frequency = e.target.value;
                      setConDrugs(updated);
                    }}
                    placeholder="Frequency (TDS)"
                    className={inputCls}
                    style={inputStyle}
                  />
                  <input
                    value={d.duration || ""}
                    onChange={(e) => {
                      const updated = [...conDrugs];
                      updated[i].duration = e.target.value;
                      setConDrugs(updated);
                    }}
                    placeholder="Duration (5 days)"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-none sm:rounded-[28px] p-4 sm:p-6 space-y-4 -mx-4 sm:mx-0"
            style={{ backgroundColor: ui.card }}
          >
            <h2 className="text-sm font-semibold">Notes & Status</h2>
            <div>
              <label className="mb-1.5 block text-xs font-medium opacity-80">
                Summary Notes
              </label>
              <textarea
                rows={6}
                value={conSummary}
                onChange={(e) => setConSummary(e.target.value)}
                placeholder="Detailed clinical notes..."
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <CustomDropdown
              label="Status"
              value={conStatus}
              options={[
                { value: "open", label: "Open" },
                { value: "completed", label: "Completed" },
              ]}
              onChange={(val: any) => setConStatus(val)}
              isDark={isDark}
              colors={colors}
              border={border}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
            <Link
              href={`/dashboard/patients/${patientId}`}
              className="w-full sm:w-auto text-center rounded-full px-6 py-3 text-xs font-semibold"
              style={{ backgroundColor: ui.card }}
            >
              Cancel
            </Link>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveToDrafts}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full px-6 py-3 text-xs font-semibold border transition hover:opacity-80"
                style={{ backgroundColor: ui.card, borderColor: ui.border }}
              >
                <FileText size={14} /> Save to Drafts
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto rounded-full px-6 py-3 text-xs font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                Preview & Submit Final
              </button>
            </div>
          </div>
        </form>
      </div>

      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-xl"
            style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Consultation Preview</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="opacity-70 hover:opacity-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <span className="opacity-60 block">Title</span>
                <p className="font-semibold">{conTitle || "Untitled"}</p>
              </div>
              <div>
                <span className="opacity-60 block">Chief Complaint</span>
                <p className="font-semibold">{conComplaint || "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="opacity-60 block">Diagnosis</span>
                  <p className="font-semibold">{conDiagnosis || "—"}</p>
                </div>
                <div>
                  <span className="opacity-60 block">ICD Code</span>
                  <p className="font-semibold">{conIcd || "—"}</p>
                </div>
              </div>
              <div>
                <span className="opacity-60 block">Recommended Tests</span>
                {conTests.length === 0 ? (
                  <p className="opacity-50">None</p>
                ) : (
                  <ul className="list-disc pl-4 space-y-1">
                    {conTests.map((t, idx) => (
                      <li key={idx}>
                        {t.name} (₦{t.price}) - {t.urgency}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <span className="opacity-60 block">Prescriptions</span>
                {conDrugs.length === 0 ? (
                  <p className="opacity-50">None</p>
                ) : (
                  <ul className="list-disc pl-4 space-y-1">
                    {conDrugs.map((d, idx) => (
                      <li key={idx}>
                        {d.name} {d.dosage} ({d.frequency} for {d.duration})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div
              className="flex justify-end gap-3 pt-2 border-t"
              style={{ borderColor: ui.border }}
            >
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold border"
                style={{ borderColor: ui.border }}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmFinalSubmit}
                disabled={current?.saving}
                className="px-5 py-2 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                {current?.saving ? "Submitting..." : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {draftToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-xl"
            style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
          >
            <h3 className="text-base font-semibold">Delete Draft</h3>
            <p className="text-xs opacity-80">
              Are you sure you want to delete draft &quot;{draftToDelete.title}
              &quot;?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDraftToDelete(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold border"
                style={{ borderColor: ui.border }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDraftConfirmed}
                className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
