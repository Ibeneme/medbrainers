"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "@/components/access/guarded-link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ChevronRight,
  Stethoscope,
  ArrowRight,
  Trash2,
  Save,
  X,
  Activity,
  ShieldCheck,
  Thermometer,
  Wind,
  Heart,
  AlertCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchPatients,
  fetchLabCatalog,
  fetchPatientVitals,
  fetchDepartments,
  addBatchConsultations,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { useFacilityId } from "@/hooks/useFacilityId";
import {
  ConfirmModal,
  ConfirmState,
  CustomDropdown,
} from "@/components/ui/items";
import LabTestPicker from "@/components/ui/Labtestpicker";
import FileDropzone, { type UploadedFile } from "@/components/ui/Filedropzone";
import { formatRecordedDate } from "@/utils/dateUtils";
import { VitalTile } from "@/components/ui/VitalTile";

interface PatientConsultationFormState {
  title: string;
  complaint: string;
  diagnosis: string;
  summary: string;
  files: UploadedFile[];
  selectedTests: string[]; // Selected lab test IDs
}

const DEFAULT_FORM: PatientConsultationFormState = {
  title: "",
  complaint: "",
  diagnosis: "",
  summary: "",
  files: [],
  selectedTests: [],
};

/* -------------------------------------------------------------------------- */
/*  Helpers & ranges                                                          */
/* -------------------------------------------------------------------------- */
const NORMAL: Record<string, [number, number]> = {
  temperatureC: [36.1, 37.5],
  spo2: [95, 100],
  pulseBpm: [60, 100],
  pulse: [60, 100],
  bpSystolic: [90, 120],
  bpDiastolic: [60, 80],
};

const isOut = (key: string, value: number | null | undefined) => {
  if (value == null) return false;
  const range = NORMAL[key];
  if (!range) return false;
  return value < range[0] || value > range[1];
};

const fmt = (v: any, unit: string) => (v != null ? `${v}${unit}` : "—");
const pulseOf = (v: any) => v?.pulseBpm ?? v?.pulse ?? null;

const reasonsOf = (v: any): string[] => {
  if (Array.isArray(v?.alertReasons) && v.alertReasons.length > 0) {
    return v.alertReasons;
  }
  if (v?.alertReason) {
    return String(v.alertReason)
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

export default function CreateBatchConsultationPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const { facilityId, departments, departmentsLoading } = useFacilityId();
  const {
    list: allPatients,
    listLoading,
    patientVitals,
    patientVitalsLoading,
  } = useAppSelector((s) => s.patients);
  const { catalog: labCatalog, listLoading: catalogLoading } = useAppSelector(
    (s) => s.labs,
  );

  // Selected Department ID state
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");

  // Fetch departments & lab catalog on mount
  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchDepartments(facilityId));
    dispatch(fetchLabCatalog({ facilityId })).then((res: any) => {
      console.log("Fetched Lab Catalog:", res.payload?.data || res.payload);
    });
  }, [dispatch, facilityId]);

  // Auto-select first available department if none selected (Fixed property 'id' TS error by typing dept as any)
  useEffect(() => {
    if (departments && departments.length > 0 && !selectedDepartmentId) {
      const firstDeptId =
        (departments[0] as any)._id || (departments[0] as any).id;
      if (firstDeptId) setSelectedDepartmentId(String(firstDeptId));
    }
  }, [departments, selectedDepartmentId]);

  // Map departments to options format for CustomDropdown
  const departmentOptions = useMemo(() => {
    if (!departments) return [];
    return departments.map((dept: any) => ({
      label: `${dept.name}${dept.code ? ` (${dept.code})` : ""}`,
      value: String(dept._id || dept.id),
    }));
  }, [departments]);

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

  // Fetch latest vitals whenever the active tab changes
  useEffect(() => {
    if (!facilityId || !activeTabId) return;
    dispatch(
      fetchPatientVitals({ facilityId, patientId: activeTabId, limit: 1 }),
    );
  }, [dispatch, facilityId, activeTabId]);

  // Per-patient form state mapping: { [patientId]: PatientConsultationFormState }
  const [patientForms, setPatientForms] = useState<
    Record<string, PatientConsultationFormState>
  >({});

  // Per-patient draft saved indicators
  const [savedDrafts, setSavedDrafts] = useState<Record<string, boolean>>({});

  // Confirmation modal state
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [confirming, setConfirming] = useState(false);

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

  useEffect(() => {
    const loadedForms: Record<string, PatientConsultationFormState> = {};
    const loadedIndicators: Record<string, boolean> = {};

    selectedPatientIds.forEach((id) => {
      const saved = localStorage.getItem(`batch_draft_${id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Blob URLs do not persist across reloads; ensure files start with empty/clean file records
          loadedForms[id] = {
            ...parsed,
            files: [],
          };
          loadedIndicators[id] = true;
        } catch (e) {
          console.error("Failed to parse draft for patient", id, e);
        }
      }
    });

    if (Object.keys(loadedForms).length > 0) {
      setPatientForms((prev) => ({ ...prev, ...loadedForms }));
      setSavedDrafts((prev) => ({ ...prev, ...loadedIndicators }));
    }
  }, [selectedPatientIds]);

  const updateActiveForm = (
    field: keyof PatientConsultationFormState,
    value: any,
  ) => {
    if (!activeTabId) return;
    setPatientForms((prev) => ({
      ...prev,
      [activeTabId]: {
        ...(prev[activeTabId] || DEFAULT_FORM),
        [field]: value,
      },
    }));
  };

  const currentForm = activeTabId
    ? patientForms[activeTabId] || DEFAULT_FORM
    : DEFAULT_FORM;

  const activePatientObj = selectedPatientsList.find(
    (p) => p._id === activeTabId,
  );

  // Save draft with confirmation modal (Fixed async return type mismatch)
  const promptSaveDraft = () => {
    if (!activeTabId) return;
    setConfirm({
      title: "Save consultation draft?",
      message: `Save current changes as a local draft for ${
        activePatientObj?.firstName || "this patient"
      }?`,
      confirmLabel: "Save Draft",
      tone: "primary",
      onConfirm: async () => {
        const formToSave = patientForms[activeTabId] || DEFAULT_FORM;
        // Strip raw file objects / blob URLs from storage serialization
        const sanitizedForm = {
          ...formToSave,
          files: [],
        };
        localStorage.setItem(
          `batch_draft_${activeTabId}`,
          JSON.stringify(sanitizedForm),
        );
        setSavedDrafts((prev) => ({ ...prev, [activeTabId]: true }));
      },
    });
  };

  // Remove draft with confirmation modal (Fixed async return type mismatch)
  const promptRemoveDraft = () => {
    if (!activeTabId) return;
    setConfirm({
      title: "Remove consultation draft?",
      message: `Permanently remove the saved draft for ${
        activePatientObj?.firstName || "this patient"
      }?`,
      confirmLabel: "Remove Draft",
      tone: "danger",
      onConfirm: async () => {
        localStorage.removeItem(`batch_draft_${activeTabId}`);
        setPatientForms((prev) => ({
          ...prev,
          [activeTabId]: DEFAULT_FORM,
        }));
        setSavedDrafts((prev) => ({ ...prev, [activeTabId]: false }));
      },
    });
  };

  // Close a tab = remove that patient from the batch (Fixed async return type mismatch)
  const promptCloseTab = (patientId: string) => {
    const p = selectedPatientsList.find((x) => x._id === patientId);
    const name = p ? `${p.firstName} ${p.lastName}` : "this patient";
    setConfirm({
      title: "Remove patient from batch?",
      message: `Remove ${name} from this batch? Their unsaved consultation details and any local draft will be discarded.`,
      confirmLabel: "Remove",
      tone: "danger",
      onConfirm: async () => {
        localStorage.removeItem(`batch_draft_${patientId}`);
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
          router.replace("/dashboard/consultations/patients");
        } else {
          router.replace(
            `${pathname}?patients=${encodeURIComponent(remaining.join(","))}`,
          );
        }
      },
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPatientIds.length === 0 || !selectedDepartmentId) return;

    setIsSubmitting(true);
    try {
      const resolvedDepartmentId = selectedDepartmentId.trim();
      console.log(
        "Submitting batch consultation department ID:",
        resolvedDepartmentId,
      );

      const consultationsPayload = selectedPatientIds.map((patientId) => {
        const form = patientForms[patientId] || DEFAULT_FORM;

        // Map selected test IDs into recommended tests payload format
        const recommendedTests = (form.selectedTests || []).map((testId) => {
          const catalogItem = labCatalog.find(
            (c: any) => String(c._id || c.id) === String(testId),
          );
          return {
            catalogId: testId,
            code: catalogItem?.code || "LAB",
            name: catalogItem?.name || "Lab Test",
            price: catalogItem?.price || 0,
            urgency: "routine" as const,
          };
        });

        const rawFiles = (form.files || [])
          .map((f) => f.file)
          .filter(Boolean) as File[];

        return {
          patientId,
          payload: {
            title: form.title,
            complaint: form.complaint,
            diagnosis: form.diagnosis || undefined,
            summary: form.summary || undefined,
            department: resolvedDepartmentId,
            recommendedTests,
            recommendedDrugs: [],
            status: "open" as const,
          },
          files: rawFiles,
        };
      });

      await dispatch(
        addBatchConsultations({
          facilityId,
          consultations: consultationsPayload,
        }),
      ).unwrap();

      selectedPatientIds.forEach((id) => {
        localStorage.removeItem(`batch_draft_${id}`);
      });

      router.push("/dashboard/consultations");
    } catch (error) {
      console.error("Failed to create consultations", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stripBg = ui.inner;
  const activeTabBg = ui.card;

  // Extract latest vital for active patient if available
  const latestVitalRecord = patientVitals?.vitals?.[0] || null;
  const pulseVal = pulseOf(latestVitalRecord);
  const vitalReasons = latestVitalRecord ? reasonsOf(latestVitalRecord) : [];
  const bpOutRange = latestVitalRecord
    ? isOut("bpSystolic", latestVitalRecord.bpSystolic) ||
      isOut("bpDiastolic", latestVitalRecord.bpDiastolic)
    : false;

  const hasDepartments = departments && departments.length > 0;

  return (
    <div className="mx-auto max-w-5xl w-full">
      {(listLoading || catalogLoading || departmentsLoading) &&
        selectedPatientsList.length === 0 && (
          <DarkBlurOverlayLoader text="Loading consultation details..." />
        )}

      <div
        className="space-y-6"
        style={{
          backgroundColor: colors.shadeBgSecond,
          color: ui.text,
        }}
      >
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs opacity-70">
          <Link href="/dashboard/consultations" className="hover:opacity-100">
            Consultations
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <Link
            href="/dashboard/consultations/patients"
            className="hover:opacity-100"
          >
            Select Patients
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <span className="font-semibold">Batch Create</span>
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
              <Stethoscope size={24} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Create Consultations
              </h1>
              <p className="text-xs opacity-60 mt-0.5">
                Recording clinical sessions for{" "}
                <span className="font-semibold">
                  {selectedPatientIds.length}
                </span>{" "}
                selected patient(s). Switch tabs to edit records or files.
              </p>
            </div>
          </div>
        </div>

        {/* DEPARTMENT SELECTION DROPDOWN SECTION */}
        <div
          className="rounded-2xl p-4 sm:p-5 border space-y-2.5"
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <div className="flex items-center justify-between">
            {!hasDepartments && !departmentsLoading && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500">
                <AlertCircle size={13} /> No departments available
              </span>
            )}
          </div>

          <CustomDropdown
            label="Assign Department *"
            value={selectedDepartmentId}
            options={departmentOptions}
            onChange={(val) => setSelectedDepartmentId(val)}
            placeholder={
              hasDepartments
                ? "Select a department..."
                : "No departments found for this facility"
            }
            isDark={isDark}
            colors={colors}
            border={ui.border}
            searchable={true}
          />

          {!hasDepartments && (
            <p className="text-[11px] text-red-500 leading-normal">
              You cannot create a consultation because no departments are
              configured or available in this facility. Please add a department
              first.
            </p>
          )}
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
                        ? "rounded-t-xl"
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
            onSubmit={handleSubmit}
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
            {/* LATEST VITALS SECTION DISPLAY */}
            <div
              className="rounded-2xl p-4 border space-y-3"
              style={{ backgroundColor: ui.inner, borderColor: ui.border }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <Activity size={14} style={{ color: PRIMARY_COLOR }} /> Latest
                  Vitals Overview
                </span>
                {latestVitalRecord ? (
                  latestVitalRecord.alert ? (
                    <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold text-red-500">
                      Alert Triggered
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                      <ShieldCheck size={11} /> Normal
                    </span>
                  )
                ) : (
                  <span className="text-[11px] opacity-50">
                    No records found
                  </span>
                )}
              </div>

              {patientVitalsLoading ? (
                <div className="text-xs opacity-50 py-2">Loading vitals...</div>
              ) : latestVitalRecord ? (
                <>
                  <p className="text-[11px] opacity-55">
                    Recorded: {formatRecordedDate(latestVitalRecord.recordedAt)}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <VitalTile
                      label="Temp"
                      value={fmt(latestVitalRecord.temperatureC, "°C")}
                      icon={Thermometer}
                      color="#f97316"
                      out={isOut(
                        "temperatureC",
                        latestVitalRecord.temperatureC,
                      )}
                      ui={ui}
                    />
                    <VitalTile
                      label="SpO2"
                      value={fmt(latestVitalRecord.spo2, "%")}
                      icon={Wind}
                      color="#3b82f6"
                      out={isOut("spo2", latestVitalRecord.spo2)}
                      ui={ui}
                    />
                    <VitalTile
                      label="Pulse"
                      value={fmt(pulseVal, " bpm")}
                      icon={Heart}
                      color="#ec4899"
                      out={isOut("pulseBpm", pulseVal)}
                      ui={ui}
                    />
                    <VitalTile
                      label="BP"
                      value={
                        latestVitalRecord.bpSystolic != null
                          ? `${latestVitalRecord.bpSystolic}/${
                              latestVitalRecord.bpDiastolic ?? "—"
                            }`
                          : "—"
                      }
                      icon={Activity}
                      color="#10b981"
                      out={bpOutRange}
                      ui={ui}
                    />
                  </div>

                  {vitalReasons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {vitalReasons.map((reason: string) => (
                        <span
                          key={reason}
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-red-500 bg-red-500/10"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs opacity-50 py-1">
                  No vitals have been recorded for this patient yet.
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium opacity-70 mb-1.5">
                Consultation Title *
              </label>
              <input
                required
                type="text"
                value={currentForm.title}
                onChange={(e) => updateActiveForm("title", e.target.value)}
                placeholder="e.g. Routine General Checkup"
                className="w-full rounded-2xl border px-4 py-3 text-xs outline-none"
                style={{
                  backgroundColor: ui.inner,
                  borderColor: ui.border,
                  color: ui.text,
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium opacity-70 mb-1.5">
                Chief Complaint *
              </label>
              <textarea
                required
                rows={2}
                value={currentForm.complaint}
                onChange={(e) => updateActiveForm("complaint", e.target.value)}
                placeholder="Describe main symptoms or reason for visit..."
                className="w-full rounded-2xl border px-4 py-3 text-xs outline-none resize-y"
                style={{
                  backgroundColor: ui.inner,
                  borderColor: ui.border,
                  color: ui.text,
                  minHeight: "120px",
                  maxHeight: "350px",
                }}
              />
            </div>

            {/* Recommended lab tests */}
            <LabTestPicker
              catalog={labCatalog}
              loading={catalogLoading}
              selectedIds={currentForm.selectedTests || []}
              onChange={(ids) => updateActiveForm("selectedTests", ids)}
              ui={ui}
              accent={PRIMARY_COLOR}
            />

            <div>
              <label className="block text-xs font-medium opacity-70 mb-1.5">
                Diagnosis
              </label>
              <input
                type="text"
                value={currentForm.diagnosis}
                onChange={(e) => updateActiveForm("diagnosis", e.target.value)}
                placeholder="Clinical impression / diagnosis"
                className="w-full rounded-2xl border px-4 py-3 text-xs outline-none"
                style={{
                  backgroundColor: ui.inner,
                  borderColor: ui.border,
                  color: ui.text,
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium opacity-70 mb-1.5">
                Summary / Treatment Plan
              </label>
              <textarea
                rows={2}
                value={currentForm.summary}
                onChange={(e) => updateActiveForm("summary", e.target.value)}
                placeholder="Brief follow-up or plan instructions..."
                className="w-full rounded-2xl border px-4 py-3 text-xs outline-none resize-y"
                style={{
                  backgroundColor: ui.inner,
                  borderColor: ui.border,
                  color: ui.text,
                  minHeight: "120px",
                  maxHeight: "350px",
                }}
              />
            </div>

            {/* Attachments: drag and drop, max 10 files */}
            <FileDropzone
              files={currentForm.files || []}
              onChange={(files) => updateActiveForm("files", files)}
              ui={ui}
              accent={PRIMARY_COLOR}
              maxFiles={10}
              maxSizeMB={10}
            />

            <div
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t"
              style={{ borderColor: ui.border }}
            >
              <p className="text-[11px] opacity-50">
                {!selectedDepartmentId
                  ? "⚠️ Please select a department to proceed with submission."
                  : "Yellow indicator dots denote patients with saved local drafts."}
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
                  disabled={
                    isSubmitting ||
                    selectedPatientIds.length === 0 ||
                    !selectedDepartmentId
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  {isSubmitting
                    ? "Saving Records..."
                    : `Save All Consultations (${selectedPatientIds.length})`}
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

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
