"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ChevronRight,
  Activity,
  ArrowRight,
  Trash2,
  Save,
  X,
  Thermometer,
  Wind,
  Heart,
  Eye,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchPatients, addPatientVital } from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { useFacilityId } from "@/hooks/useFacilityId";
import { ConfirmModal, ConfirmState } from "@/components/ui/items";

interface PatientVitalFormState {
  temperature: string;
  bloodOxygenSaturation: string;
  pulseRate: string;
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
}

const DEFAULT_VITAL_FORM: PatientVitalFormState = {
  temperature: "",
  bloodOxygenSaturation: "",
  pulseRate: "",
  bloodPressureSystolic: "",
  bloodPressureDiastolic: "",
};

const inputCls =
  "w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20";

export default function CreateBatchVitalsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const { facilityId } = useFacilityId();
  const { list: allPatients, listLoading } = useAppSelector((s) => s.patients);

  // 1. Extract and parse the 'patients' query parameter from the URL
  const rawPatientsParam = searchParams.get("patients");
  const selectedPatientIds = useMemo(() => {
    if (!rawPatientsParam) return [];
    return decodeURIComponent(rawPatientsParam)
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }, [rawPatientsParam]);

  // Fetch patients on mount so we can display their names & details
  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchPatients({ facilityId, limit: 100 }));
  }, [dispatch, facilityId]);

  // Match the IDs from URL params with actual patient records
  const selectedPatientsList = useMemo(() => {
    if (!allPatients) return [];
    return allPatients.filter((p) => selectedPatientIds.includes(p._id));
  }, [allPatients, selectedPatientIds]);

  // Active tab state (stores the currently selected patient's _id)
  const [activeTabId, setActiveTabId] = useState<string>("");

  // Set default active tab once list is populated
  useEffect(() => {
    if (selectedPatientIds.length > 0 && !activeTabId) {
      setActiveTabId(selectedPatientIds[0]);
    }
  }, [selectedPatientIds, activeTabId]);

  // Per-patient form state mapping: { [patientId]: PatientVitalFormState }
  const [patientForms, setPatientForms] = useState<
    Record<string, PatientVitalFormState>
  >({});

  // Per-patient draft saved indicators
  const [savedDrafts, setSavedDrafts] = useState<Record<string, boolean>>({});

  // Confirmation modal state
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [confirming, setConfirming] = useState(false);

  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const runConfirm = async () => {
    if (!confirm) return;
    setConfirming(true);
    try {
      await confirm.onConfirm();
    } finally {
      setConfirming(false);
      setConfirm(null);
    }
  };

  // Load drafts from localStorage on mount
  useEffect(() => {
    const loadedForms: Record<string, PatientVitalFormState> = {};
    const loadedIndicators: Record<string, boolean> = {};

    selectedPatientIds.forEach((id) => {
      const saved = localStorage.getItem(`batch_vitals_draft_${id}`);
      if (saved) {
        try {
          loadedForms[id] = JSON.parse(saved);
          loadedIndicators[id] = true;
        } catch (e) {
          console.error("Failed to parse vitals draft for patient", id, e);
        }
      }
    });

    if (Object.keys(loadedForms).length > 0) {
      setPatientForms((prev) => ({ ...prev, ...loadedForms }));
      setSavedDrafts((prev) => ({ ...prev, ...loadedIndicators }));
    }
  }, [selectedPatientIds]);

  const updateActiveForm = (
    field: keyof PatientVitalFormState,
    value: string
  ) => {
    if (!activeTabId) return;
    setPatientForms((prev) => ({
      ...prev,
      [activeTabId]: {
        ...(prev[activeTabId] || DEFAULT_VITAL_FORM),
        [field]: value,
      },
    }));
  };

  const currentForm = activeTabId
    ? patientForms[activeTabId] || DEFAULT_VITAL_FORM
    : DEFAULT_VITAL_FORM;

  const activePatientObj = selectedPatientsList.find(
    (p) => p._id === activeTabId
  );

  // Save draft with confirmation modal
  const promptSaveDraft = () => {
    if (!activeTabId) return;
    setConfirm({
      title: "Save vitals draft?",
      message: `Save current changes as a local draft for ${
        activePatientObj?.firstName || "this patient"
      }?`,
      confirmLabel: "Save Draft",
      tone: "primary",
      onConfirm: () => {
        const formToSave = patientForms[activeTabId] || DEFAULT_VITAL_FORM;
        localStorage.setItem(
          `batch_vitals_draft_${activeTabId}`,
          JSON.stringify(formToSave)
        );
        setSavedDrafts((prev) => ({ ...prev, [activeTabId]: true }));
      },
    });
  };

  // Remove draft with confirmation modal
  const promptRemoveDraft = () => {
    if (!activeTabId) return;
    setConfirm({
      title: "Remove vitals draft?",
      message: `Permanently remove the saved draft for ${
        activePatientObj?.firstName || "this patient"
      }?`,
      confirmLabel: "Remove Draft",
      tone: "danger",
      onConfirm: () => {
        localStorage.removeItem(`batch_vitals_draft_${activeTabId}`);
        setPatientForms((prev) => ({
          ...prev,
          [activeTabId]: DEFAULT_VITAL_FORM,
        }));
        setSavedDrafts((prev) => ({ ...prev, [activeTabId]: false }));
      },
    });
  };

  // Close a tab = remove that patient from the batch
  const promptCloseTab = (patientId: string) => {
    const p = selectedPatientsList.find((x) => x._id === patientId);
    const name = p ? `${p.firstName} ${p.lastName}` : "this patient";
    setConfirm({
      title: "Remove patient from batch?",
      message: `Remove ${name} from this batch? Their unsaved vitals and any local draft will be discarded.`,
      confirmLabel: "Remove",
      tone: "danger",
      onConfirm: () => {
        localStorage.removeItem(`batch_vitals_draft_${patientId}`);
        setPatientForms((prev) => {
          const next = { ...prev };
          delete next[patientId];
          return next;
        });
        setSavedDrafts((prev) => {
          const next = { ...prev };
          delete next[patientId];
          return next;
        });

        const remaining = selectedPatientIds.filter((id) => id !== patientId);
        if (activeTabId === patientId) setActiveTabId(remaining[0] || "");

        if (remaining.length === 0) {
          router.replace(
            "/dashboard/consultations/vitals/patients/select?type=vitals"
          );
        } else {
          router.replace(
            `${pathname}?patients=${encodeURIComponent(
              remaining.join(",")
            )}&type=vitals`
          );
        }
      },
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trigger preview step instead of submitting directly
  const handleOpenPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId || selectedPatientIds.length === 0) return;
    setShowPreviewModal(true);
  };

  // Final execution after confirming the preview
  const handleExecuteBatchSubmission = async () => {
    if (!facilityId || selectedPatientIds.length === 0) return;
    setIsSubmitting(true);
    setShowPreviewModal(false);

    try {
      const promises = selectedPatientIds.map((id) => {
        const form = patientForms[id];
        if (!form) return Promise.resolve();

        const payload: Record<string, number> = {};
        if (form.temperature) payload.temperatureC = Number(form.temperature);
        if (form.bloodOxygenSaturation)
          payload.spo2 = Number(form.bloodOxygenSaturation);

        // Map pulseRate to 'pulse' to align with Mongoose schema
        if (form.pulseRate) payload.pulse = Number(form.pulseRate);

        if (form.bloodPressureSystolic)
          payload.bpSystolic = Number(form.bloodPressureSystolic);
        if (form.bloodPressureDiastolic)
          payload.bpDiastolic = Number(form.bloodPressureDiastolic);

        if (Object.keys(payload).length === 0) return Promise.resolve();

        return dispatch(
          addPatientVital({ facilityId, patientId: id, payload })
        ).unwrap();
      });

      await Promise.all(promises);

      selectedPatientIds.forEach((id) => {
        localStorage.removeItem(`batch_vitals_draft_${id}`);
      });

      router.push("/dashboard/consultations/vitals");
    } catch (error) {
      console.error("Failed to record batch vitals", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stripBg = ui.inner;
  const activeTabBg = ui.card;
  const inputStyle = {
    backgroundColor: ui.inner,
    color: ui.text,
    borderColor: "transparent",
    boxShadow: "none",
  };

  return (
    <div className="mx-auto max-w-5xl w-full relative">
      {(listLoading || isSubmitting) && (
        <DarkBlurOverlayLoader
          text={
            isSubmitting
              ? "Recording batch vitals..."
              : "Loading patient details..."
          }
        />
      )}

      <div
        className="space-y-6 "
        style={{
          backgroundColor: colors.shadeBgSecond,
          color: ui.text,
        }}
      >
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs opacity-70">
          <Link
            href="/dashboard/consultations/vitals"
            className="hover:opacity-100"
          >
            Company Vitals
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <Link
            href="/dashboard/consultations/patients?type=vitals"
            className="hover:opacity-100"
          >
            Select Patients
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <span className="font-semibold">Batch Record Vitals</span>
        </div>

        {/* Header */}
        <div
          className="rounded-[22px] sm:rounded-[28px] p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border"
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <div className="flex items-center gap-3.5">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
              style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
            >
              <Activity size={24} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Record Patient Vitals
              </h1>
              <p className="text-xs opacity-60 mt-0.5">
                Recording vital signs simultaneously for{" "}
                <span className="font-semibold">
                  {selectedPatientIds.length}
                </span>{" "}
                selected patient(s). Switch tabs to edit individual readings.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs header row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-xs font-semibold opacity-70 uppercase tracking-wider block">
            Patients ({selectedPatientsList.length})
          </label>
          {activeTabId && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={promptSaveDraft}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold border transition hover:opacity-80"
                style={{ backgroundColor: ui.card, borderColor: ui.border }}
              >
                <Save size={12} />{" "}
                {savedDrafts[activeTabId] ? "Draft Saved" : "Save Draft"}
              </button>
              {savedDrafts[activeTabId] && (
                <button
                  type="button"
                  onClick={promptRemoveDraft}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-red-500 border border-red-500/20 bg-red-500/10 transition hover:opacity-80"
                >
                  <Trash2 size={12} /> Remove Draft
                </button>
              )}
            </div>
          )}
        </div>

        {/* Browser-style tabs + connected form panel */}
        <div className="!mt-2">
          <div
            className="flex items-end gap-1 overflow-x-auto pb-1"
            style={{ backgroundColor: stripBg, borderColor: ui.border }}
          >
            {selectedPatientsList.map((p, idx) => {
              const isActive = activeTabId === p._id;
              const hasDraft = savedDrafts[p._id];
              const next = selectedPatientsList[idx + 1];
              const showDivider = !isActive && next && next._id !== activeTabId;

              return (
                <div
                  key={p._id}
                  className="relative flex items-end shrink-0"
                  style={{ zIndex: isActive ? 10 : 1 }}
                >
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute bottom-0 -left-2 h-2 w-2"
                      style={{
                        background: `radial-gradient(circle at 0 0, transparent 8px, ${activeTabBg} 8px)`,
                      }}
                    />
                  )}

                  <div
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={0}
                    onClick={() => setActiveTabId(p._id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveTabId(p._id);
                      }
                    }}
                    className={`group px-3 py-3 relative flex items-center gap-2 min-w-[130px] max-w-[220px] cursor-pointer select-none text-xs outline-none transition-colors ${
                      isActive
                        ? "rounded-t-xl "
                        : "rounded-lg mb-1 hover:bg-black/5 dark:hover:bg-white/10"
                    }`}
                    style={{
                      backgroundColor: isActive ? PRIMARY_COLOR : "transparent",
                      color: isActive ? "#ffffff" : ui.text,
                    }}
                  >
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-[6px] text-[9px] font-bold shrink-0"
                      style={{
                        backgroundColor: isActive ? "#ffffff" : PRIMARY_COLOR,
                        color: isActive ? PRIMARY_COLOR : "#fff",
                      }}
                    >
                      {p.firstName?.[0]}
                      {p.lastName?.[0]}
                    </span>

                    <span className="truncate flex-1">
                      {p.firstName} {p.lastName}
                    </span>

                    {hasDraft && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          isActive ? "bg-white" : "bg-amber-400"
                        }`}
                        title="Draft saved in local storage"
                      />
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        promptCloseTab(p._id);
                      }}
                      className={`flex h-4 w-4 items-center justify-center rounded-full shrink-0 transition hover:bg-black/10 dark:hover:bg-white/20 ${
                        isActive
                          ? "opacity-95 text-white"
                          : "opacity-0 group-hover:opacity-70"
                      }`}
                      title="Remove from batch"
                      aria-label={`Remove ${p.firstName} ${p.lastName} from batch`}
                    >
                      <X size={11} />
                    </button>
                  </div>

                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute bottom-0 -right-2 h-2 w-2"
                      style={{
                        background: `radial-gradient(circle at 100% 0, transparent 8px, ${activeTabBg} 8px)`,
                      }}
                    />
                  )}

                  {showDivider && (
                    <span
                      aria-hidden
                      className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-px mb-0.5"
                      style={{ backgroundColor: ui.border }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <form
            onSubmit={handleOpenPreview}
            className="space-y-4 rounded-b-[22px] rounded-tr-[22px] border p-4 sm:p-6"
            style={{
              backgroundColor: activeTabBg,
              borderColor: ui.border,
              borderTopLeftRadius:
                selectedPatientsList.length > 0 &&
                selectedPatientsList[0]._id === activeTabId
                  ? 0
                  : 22,
            }}
          >
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium opacity-80 flex items-center gap-1.5">
                  <Thermometer size={14} className="text-orange-500" />{" "}
                  Temperature (°C)
                </label>
                <input
                  value={currentForm.temperature}
                  onChange={(e) =>
                    updateActiveForm("temperature", e.target.value)
                  }
                  placeholder="e.g. 36.6"
                  inputMode="decimal"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium opacity-80 flex items-center gap-1.5">
                  <Wind size={14} className="text-blue-500" /> Blood Oxygen
                  Saturation (%)
                </label>
                <input
                  value={currentForm.bloodOxygenSaturation}
                  onChange={(e) =>
                    updateActiveForm("bloodOxygenSaturation", e.target.value)
                  }
                  placeholder="e.g. 98"
                  inputMode="decimal"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium opacity-80 flex items-center gap-1.5">
                  <Heart size={14} className="text-pink-500" /> Pulse Rate
                  (Beats Per Minute)
                </label>
                <input
                  value={currentForm.pulseRate}
                  onChange={(e) =>
                    updateActiveForm("pulseRate", e.target.value)
                  }
                  placeholder="e.g. 75"
                  inputMode="numeric"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium opacity-80 flex items-center gap-1.5">
                    <Activity size={14} className="text-emerald-500" /> Systolic
                    (mmHg)
                  </label>
                  <input
                    value={currentForm.bloodPressureSystolic}
                    onChange={(e) =>
                      updateActiveForm("bloodPressureSystolic", e.target.value)
                    }
                    placeholder="e.g. 120"
                    inputMode="numeric"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium opacity-80 flex items-center gap-1.5">
                    <Activity size={14} className="text-emerald-500" />{" "}
                    Diastolic (mmHg)
                  </label>
                  <input
                    value={currentForm.bloodPressureDiastolic}
                    onChange={(e) =>
                      updateActiveForm("bloodPressureDiastolic", e.target.value)
                    }
                    placeholder="e.g. 80"
                    inputMode="numeric"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            <div
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t"
              style={{ borderColor: ui.border }}
            >
              <p className="text-[11px] opacity-50">
                Yellow indicator dots denote patients with saved local drafts.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-full px-5 py-3 text-xs font-semibold border transition hover:opacity-80"
                  style={{ backgroundColor: ui.inner, borderColor: ui.border }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedPatientIds.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  <Eye size={14} /> Preview & Submit Batch (
                  {selectedPatientIds.length})
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 space-y-6 border"
            style={{
              backgroundColor: colors.shadeBgSecond,
              borderColor: ui.border,
              color: ui.text,
            }}
          >
            <div
              className="flex items-center justify-between border-b pb-4"
              style={{ borderColor: ui.border }}
            >
              <div>
                <h2 className="text-lg font-bold">Review Batch Vitals</h2>
                <p className="text-xs opacity-60">
                  Review entered values for all patients before finalizing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:opacity-80"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {selectedPatientsList.map((p) => {
                const form = patientForms[p._id] || DEFAULT_VITAL_FORM;
                const hasAnyData = Object.values(form).some(
                  (val) => val.trim() !== ""
                );

                return (
                  <div
                    key={p._id}
                    className="p-4 rounded-2xl border space-y-2"
                    style={{ backgroundColor: ui.card, borderColor: ui.border }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">
                        {p.firstName} {p.lastName}
                      </span>
                      {!hasAnyData && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium">
                          No readings entered
                        </span>
                      )}
                    </div>
                    {hasAnyData ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 opacity-90">
                        <div
                          className="p-2 rounded-xl"
                          style={{ backgroundColor: ui.inner }}
                        >
                          <span className="opacity-60 block text-[10px]">
                            Temp
                          </span>
                          <span className="font-medium">
                            {form.temperature ? `${form.temperature} °C` : "—"}
                          </span>
                        </div>
                        <div
                          className="p-2 rounded-xl"
                          style={{ backgroundColor: ui.inner }}
                        >
                          <span className="opacity-60 block text-[10px]">
                            SpO₂
                          </span>
                          <span className="font-medium">
                            {form.bloodOxygenSaturation
                              ? `${form.bloodOxygenSaturation} %`
                              : "—"}
                          </span>
                        </div>
                        <div
                          className="p-2 rounded-xl"
                          style={{ backgroundColor: ui.inner }}
                        >
                          <span className="opacity-60 block text-[10px]">
                            Pulse
                          </span>
                          <span className="font-medium">
                            {form.pulseRate ? `${form.pulseRate} bpm` : "—"}
                          </span>
                        </div>
                        <div
                          className="p-2 rounded-xl"
                          style={{ backgroundColor: ui.inner }}
                        >
                          <span className="opacity-60 block text-[10px]">
                            BP (Sys/Dia)
                          </span>
                          <span className="font-medium">
                            {form.bloodPressureSystolic ||
                            form.bloodPressureDiastolic
                              ? `${form.bloodPressureSystolic || "—"}/${
                                  form.bloodPressureDiastolic || "—"
                                }`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs opacity-40 italic">
                        This patient will be skipped during submission unless
                        values are added.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              className="flex items-center justify-end gap-3 pt-4 border-t"
              style={{ borderColor: ui.border }}
            >
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="rounded-full px-5 py-2.5 text-xs font-semibold border transition hover:opacity-80"
                style={{ backgroundColor: ui.inner, borderColor: ui.border }}
              >
                Back to Edit
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleExecuteBatchSubmission}
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-40"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                {isSubmitting ? "Recording Vitals..." : `Confirm & Record All`}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        state={confirm}
        busy={confirming}
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirm}
        ui={ui}
      />
    </div>
  );
}
