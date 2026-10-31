"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ChevronRight,
  FilePlus2,
  Loader2,
  Phone,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useTheme } from "@/contexts/theme-context";
import { useRadiology } from "@/hooks/useRadiology";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchPatients } from "@/api/slices";
import { useFacilityId } from "@/hooks/useFacilityId";
import {
  CustomDropdown,
  ConfirmModal,
  ConfirmState,
} from "@/components/ui/items";
import type {
  Modality,
  Priority,
  ContrastType,
} from "@/api/slices/radiologySlice";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: ToggleSwitchProps) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer group select-none py-1">
      <div className="flex flex-col">
        {label && (
          <span className="text-xs font-semibold group-hover:opacity-100 transition">
            {label}
          </span>
        )}
        {description && (
          <span className="text-[10px] opacity-50">{description}</span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
        style={{
          backgroundColor: checked ? PRIMARY_COLOR : "rgba(150, 150, 150, 0.3)",
        }}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

const MODALITIES: Modality[] = [
  "xray",
  "mri",
  "ct",
  "ultrasound",
  "mammography",
  "fluoroscopy",
  "other",
];

const MODALITY_OPTIONS = MODALITIES.map((m) => ({
  label: m.toUpperCase(),
  value: m,
}));

const PRIORITY_OPTIONS = [
  { label: "Routine", value: "routine" },
  { label: "Urgent", value: "urgent" },
  { label: "STAT", value: "stat" },
];

const CONTRAST_OPTIONS = [
  { label: "None", value: "none" },
  { label: "IV", value: "iv" },
  { label: "Oral", value: "oral" },
  { label: "Both", value: "both" },
];

interface OrderFormState {
  modality: Modality;
  procedureName: string;
  bodyPart: string;
  clinicalIndication: string;
  icdCode: string;
  icdDescription: string;
  priority: Priority;
  contrastRequired: boolean;
  contrastType: ContrastType;
  preAuthRequired: boolean;
  referringPhysicianName: string;
  referringPhysicianNpi: string;
  preparationInstructions: string;
  notes: string;
}

const DEFAULT_FORM: OrderFormState = {
  modality: "xray",
  procedureName: "",
  bodyPart: "",
  clinicalIndication: "",
  icdCode: "",
  icdDescription: "",
  priority: "routine",
  contrastRequired: false,
  contrastType: "none",
  preAuthRequired: false,
  referringPhysicianName: "",
  referringPhysicianNpi: "",
  preparationInstructions: "",
  notes: "",
};

const MANUAL_KEY = "__manual__";

export default function OrderEntryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const patientsParam = searchParams.get("patients");

  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors, colors?.border);

  const { facilityId } = useFacilityId();
  const { list: allPatients } = useAppSelector((s) => s.patients);

  const { createRequest, saving, message, error, clearError, hasFacility } =
    useRadiology({ autoCatalog: true });

  // Confirmation modal state and validation warning state
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [confirming, setConfirming] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch patients on mount or facility change
  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchPatients({ facilityId, limit: 100 }));
  }, [dispatch, facilityId]);

  // Patient IDs from the query string (comma-separated)
  const patientIds = useMemo(
    () =>
      patientsParam
        ? decodeURIComponent(patientsParam)
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
        : [],
    [patientsParam]
  );

  const selectedPatients = useMemo(() => {
    if (!allPatients) return [];
    return patientIds
      .map((id) => allPatients.find((p: any) => p._id === id))
      .filter(Boolean) as any[];
  }, [allPatients, patientIds]);

  const hasBatch = patientIds.length > 0;

  // Active tab = patient _id (or MANUAL_KEY when no patients were passed in)
  const [activeTabId, setActiveTabId] = useState<string>("");
  const [manualPatientId, setManualPatientId] = useState("");

  useEffect(() => {
    if (!hasBatch) {
      setActiveTabId(MANUAL_KEY);
      return;
    }
    if (!activeTabId || !patientIds.includes(activeTabId)) {
      setActiveTabId(patientIds[0]);
    }
  }, [hasBatch, patientIds, activeTabId]);

  // One order form per patient, initialized from localStorage if available
  const [forms, setForms] = useState<Record<string, OrderFormState>>({});

  // Load saved drafts from localStorage on mount / when patientIds change
  useEffect(() => {
    const loadedForms: Record<string, OrderFormState> = {};
    const targets = hasBatch ? patientIds : [MANUAL_KEY];

    targets.forEach((id) => {
      const saved = localStorage.getItem(`radiology_order_draft_${id}`);
      if (saved) {
        try {
          loadedForms[id] = JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse draft for patient", id, e);
        }
      }
    });

    if (Object.keys(loadedForms).length > 0) {
      setForms((prev) => ({ ...prev, ...loadedForms }));
    }
  }, [hasBatch, patientIds]);

  const currentForm = forms[activeTabId] || DEFAULT_FORM;

  const patch = (changes: Partial<OrderFormState>) => {
    if (!activeTabId) return;
    setValidationError(null);
    setForms((prev) => {
      const updatedForm = {
        ...(prev[activeTabId] || DEFAULT_FORM),
        ...changes,
      };

      // Automatically persist to localStorage on every change
      localStorage.setItem(
        `radiology_order_draft_${activeTabId}`,
        JSON.stringify(updatedForm)
      );

      return {
        ...prev,
        [activeTabId]: updatedForm,
      };
    });
  };

  const activePatient: any = selectedPatients.find(
    (p) => p._id === activeTabId
  );

  // Close a tab = remove that patient from the batch & clear storage draft
  const closeTab = (patientId: string) => {
    localStorage.removeItem(`radiology_order_draft_${patientId}`);
    const remaining = patientIds.filter((id) => id !== patientId);
    setForms((prev) => {
      const next = { ...prev };
      delete next[patientId];
      return next;
    });
    if (activeTabId === patientId) setActiveTabId(remaining[0] || "");
    if (remaining.length === 0) {
      router.replace("/dashboard/radiology");
    } else {
      router.replace(
        `${pathname}?patients=${encodeURIComponent(remaining.join(","))}`
      );
    }
  };

  // Validate if a given form has all required fields filled in
  const isFormValid = (f: OrderFormState) => {
    return (
      f.procedureName?.trim() &&
      f.bodyPart?.trim() &&
      f.clinicalIndication?.trim()
    );
  };

  // Submit single active patient order with preview confirmation
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    const pId = hasBatch ? activeTabId : manualPatientId.trim();
    if (!pId) return;

    const f = currentForm;

    // Check required fields for active patient
    if (!isFormValid(f)) {
      setValidationError(
        "Please fill in all required fields (Procedure name, Body part, and Clinical indication) before submitting."
      );
      return;
    }

    const patientName = activePatient
      ? `${activePatient.firstName} ${activePatient.lastName}`
      : "Patient";

    setConfirm({
      title: `Submit order for ${patientName}?`,
      message: `Modality: ${f.modality.toUpperCase()} | Procedure: ${
        f.procedureName
      } | Body Part: ${f.bodyPart}`,
      confirmLabel: "Confirm & Submit",
      tone: "primary",
      onConfirm: async () => {
        setConfirming(true);
        try {
          const result: any = await createRequest({
            patientId: pId,
            modality: f.modality,
            procedureName: f.procedureName,
            bodyPart: f.bodyPart,
            clinicalIndication: f.clinicalIndication,
            icdCodes: f.icdCode
              ? [
                  {
                    code: f.icdCode,
                    description: f.icdDescription || undefined,
                  },
                ]
              : [],
            priority: f.priority,
            contrastRequired: f.contrastRequired,
            contrastType: f.contrastType,
            preAuthRequired: f.preAuthRequired,
            referringPhysicianName: f.referringPhysicianName || undefined,
            referringPhysicianNpi: f.referringPhysicianNpi || undefined,
            preparationInstructions: f.preparationInstructions || undefined,
            notes: f.notes || undefined,
          });

          if (result?.meta?.requestStatus === "fulfilled") {
            localStorage.removeItem(`radiology_order_draft_${pId}`);
            router.push("/dashboard/radiology/requests");
          }
        } finally {
          setConfirming(false);
          setConfirm(null);
        }
      },
    });
  };

  // Submit all batch orders (only for patients with all required fields filled)
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setValidationError(null);

    const targets = hasBatch ? patientIds : [manualPatientId.trim()];
    if (targets.some((id) => !id)) return;

    // Validate all forms first; if any are incomplete, switch to that patient and show error
    for (const pId of targets) {
      const key = hasBatch ? pId : MANUAL_KEY;
      const f = forms[key] || DEFAULT_FORM;

      if (!isFormValid(f)) {
        if (hasBatch) setActiveTabId(pId);
        const pObj = selectedPatients.find((p) => p._id === pId);
        const name = pObj ? `${pObj.firstName} ${pObj.lastName}` : "Patient";
        setValidationError(
          `Please fill in all required fields (Procedure name, Body part, Clinical indication) for ${name} before submitting.`
        );
        return;
      }
    }

    for (const pId of targets) {
      const key = hasBatch ? pId : MANUAL_KEY;
      const f = forms[key] || DEFAULT_FORM;

      const result: any = await createRequest({
        patientId: pId,
        modality: f.modality,
        procedureName: f.procedureName,
        bodyPart: f.bodyPart,
        clinicalIndication: f.clinicalIndication,
        icdCodes: f.icdCode
          ? [{ code: f.icdCode, description: f.icdDescription || undefined }]
          : [],
        priority: f.priority,
        contrastRequired: f.contrastRequired,
        contrastType: f.contrastType,
        preAuthRequired: f.preAuthRequired,
        referringPhysicianName: f.referringPhysicianName || undefined,
        referringPhysicianNpi: f.referringPhysicianNpi || undefined,
        preparationInstructions: f.preparationInstructions || undefined,
        notes: f.notes || undefined,
      });

      if (result?.meta?.requestStatus !== "fulfilled") return;
    }

    targets.forEach((id) => {
      localStorage.removeItem(`radiology_order_draft_${id}`);
    });

    router.push("/dashboard/radiology/requests");
  }

  if (!hasFacility) {
    return (
      <div className="p-6 text-sm opacity-70">Select a facility first.</div>
    );
  }

  const field = "w-full rounded-2xl border px-4 py-3 text-xs outline-none";
  const fieldStyle = {
    borderColor: ui.border,
    backgroundColor: ui.inner,
    color: ui.text,
  };
  const labelCls = "block text-xs font-medium opacity-70 mb-1.5";

  const stripBg = ui.inner;
  const activeTabBg = ui.card;

  const dropdownProps = {
    isDark,
    colors,
    border: ui.border,
  };

  const firstTabActive =
    hasBatch && selectedPatients.length > 0
      ? selectedPatients[0]._id === activeTabId
      : true;

  return (
    <div
      className="mx-auto max-w-5xl w-full space-y-6"
      style={{ backgroundColor: colors?.shadeBgSecond, color: ui.text }}
    >
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs opacity-70">
        <Link href="/dashboard/radiology" className="hover:opacity-100">
          Radiology
        </Link>
        <ChevronRight size={12} className="opacity-40" />
        <span className="font-semibold">Order Entry</span>
      </div>

      {/* Header */}
      <div
        className="rounded-[22px] sm:rounded-[28px] p-4 sm:p-6 flex items-center gap-3.5 border"
        style={{ backgroundColor: ui.card, borderColor: ui.border }}
      >
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
          style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
        >
          <FilePlus2 size={24} />
        </span>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Modality Order Entry
          </h1>
          <p className="text-xs opacity-60 mt-0.5">
            {patientIds.length > 1
              ? `Creating orders for ${patientIds.length} selected patients. Switch tabs to fill in each order.`
              : "Create X-Ray, MRI, CT, Ultrasound or Mammography orders"}
          </p>
        </div>
      </div>

      {(error || message || validationError) && (
        <div
          className="rounded-xl border px-4 py-3 text-sm flex items-center gap-2"
          style={{
            borderColor:
              error || validationError ? "rgba(220,38,38,0.4)" : ui.border,
            backgroundColor:
              error || validationError ? "rgba(220,38,38,0.1)" : ui.card,
            color: validationError ? "#ef4444" : undefined,
          }}
        >
          <AlertCircle size={16} className="shrink-0" />
          <span>{error || message || validationError}</span>
        </div>
      )}

      {hasBatch && (
        <label className="text-xs font-semibold opacity-70 uppercase tracking-wider block !mb-0">
          Patients ({selectedPatients.length})
        </label>
      )}

      {/* Browser-style tabs + connected form panel */}
      <div className="!mt-2">
        {hasBatch && (
          <div
            className="flex items-end gap-1 overflow-x-auto pb-1"
            style={{ backgroundColor: stripBg, borderColor: ui.border }}
          >
            {selectedPatients.map((p, idx) => {
              const isActive = activeTabId === p._id;
              const next = selectedPatients[idx + 1];
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

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(p._id);
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
        )}

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-b-[22px] rounded-tr-[22px] border p-4 sm:p-6"
          style={{
            backgroundColor: activeTabBg,
            borderColor: ui.border,
            borderTopLeftRadius: !hasBatch || !firstTabActive ? 22 : 0,
          }}
        >
          {/* Active patient summary */}
          {hasBatch && activePatient && (
            <div
              className="rounded-2xl p-3.5 flex items-center justify-between gap-4 border"
              style={{ backgroundColor: ui.inner, borderColor: ui.border }}
            >
              <div className="flex items-center gap-4 min-w-0">
                {activePatient.profilePicture ? (
                  <img
                    src={activePatient.profilePicture}
                    alt="Profile"
                    className="w-12 h-12 rounded-2xl object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shrink-0"
                    style={{ backgroundColor: PRIMARY_COLOR }}
                  >
                    {activePatient.firstName?.[0]}
                    {activePatient.lastName?.[0]}
                  </div>
                )}
                <div className="min-w-0 space-y-0.5 text-xs">
                  <p className="font-bold text-sm truncate">
                    {activePatient.firstName} {activePatient.middleName || ""}{" "}
                    {activePatient.lastName}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 opacity-70">
                    <span className="flex items-center gap-1">
                      <Phone size={12} />
                      {[activePatient.countryCode, activePatient.phone]
                        .filter(Boolean)
                        .join(" ") || "No phone number"}
                    </span>
                    <span>•</span>
                    <span>MRN: {activePatient.mrn || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Individual Patient Submit Button with Preview */}
              <button
                type="button"
                onClick={handleSingleSubmit}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-40 shrink-0"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <CheckCircle2 size={14} /> Submit this patient
              </button>
            </div>
          )}

          {/* Manual patient ID only when no patients were passed in */}
          {!hasBatch && (
            <div>
              <label className={labelCls}>Patient ID *</label>
              <input
                required
                value={manualPatientId}
                onChange={(e) => setManualPatientId(e.target.value)}
                className={field}
                style={fieldStyle}
                placeholder="Enter patient Mongo ObjectId..."
              />
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <CustomDropdown
              label="Modality *"
              value={currentForm.modality}
              options={MODALITY_OPTIONS}
              onChange={(val) => patch({ modality: val as Modality })}
              placeholder="Select modality..."
              {...dropdownProps}
            />
            <CustomDropdown
              label="Priority *"
              value={currentForm.priority}
              options={PRIORITY_OPTIONS}
              onChange={(val) => patch({ priority: val as Priority })}
              placeholder="Select priority..."
              {...dropdownProps}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Procedure name *</label>
              <input
                required
                value={currentForm.procedureName}
                onChange={(e) => patch({ procedureName: e.target.value })}
                className={field}
                style={fieldStyle}
                placeholder="e.g. Chest PA view"
              />
            </div>
            <div>
              <label className={labelCls}>Body part *</label>
              <input
                required
                value={currentForm.bodyPart}
                onChange={(e) => patch({ bodyPart: e.target.value })}
                className={field}
                style={fieldStyle}
                placeholder="e.g. Chest / Lungs"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Clinical indication *</label>
            <textarea
              required
              rows={3}
              value={currentForm.clinicalIndication}
              onChange={(e) => patch({ clinicalIndication: e.target.value })}
              className={`${field} resize-y`}
              style={{ ...fieldStyle, minHeight: "100px", maxHeight: "300px" }}
              placeholder="Enter detailed clinical history, symptoms, or reason for request..."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>ICD-10 code</label>
              <input
                value={currentForm.icdCode}
                onChange={(e) => patch({ icdCode: e.target.value })}
                className={field}
                style={fieldStyle}
                placeholder="e.g. R51.9"
              />
            </div>
            <div>
              <label className={labelCls}>ICD description</label>
              <input
                value={currentForm.icdDescription}
                onChange={(e) => patch({ icdDescription: e.target.value })}
                className={field}
                style={fieldStyle}
                placeholder="e.g. Headache, unspecified"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 items-center pt-2">
            <CustomDropdown
              label="Contrast"
              value={currentForm.contrastType}
              options={CONTRAST_OPTIONS}
              onChange={(val) =>
                patch({
                  contrastType: val as ContrastType,
                  contrastRequired: val !== "none",
                })
              }
              placeholder="Select contrast type..."
              {...dropdownProps}
            />
            <div className="pt-2">
              <ToggleSwitch
                checked={currentForm.preAuthRequired}
                onChange={(val) => patch({ preAuthRequired: val })}
                label="Pre-auth required"
                description="Insurance pre-authorization needed before imaging"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Referring physician</label>
              <input
                value={currentForm.referringPhysicianName}
                onChange={(e) =>
                  patch({ referringPhysicianName: e.target.value })
                }
                className={field}
                style={fieldStyle}
                placeholder="e.g. Dr. John Doe"
              />
            </div>
            <div>
              <label className={labelCls}>NPI</label>
              <input
                value={currentForm.referringPhysicianNpi}
                onChange={(e) =>
                  patch({ referringPhysicianNpi: e.target.value })
                }
                className={field}
                style={fieldStyle}
                placeholder="e.g. 1234567890"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Preparation instructions</label>
            <textarea
              rows={2}
              value={currentForm.preparationInstructions}
              onChange={(e) =>
                patch({ preparationInstructions: e.target.value })
              }
              className={`${field} resize-y`}
              style={fieldStyle}
              placeholder="e.g. Fasting for 6 hours prior to examination"
            />
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              rows={2}
              value={currentForm.notes}
              onChange={(e) => patch({ notes: e.target.value })}
              className={`${field} resize-y`}
              style={fieldStyle}
              placeholder="Add any additional instructions or comments..."
            />
          </div>

          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t"
            style={{ borderColor: ui.border }}
          >
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
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving
                ? "Submitting..."
                : `Submit all orders${
                    patientIds.length > 1 ? ` (${patientIds.length})` : ""
                  }`}
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        state={confirm}
        busy={confirming}
        onCancel={() => setConfirm(null)}
        onConfirm={confirm?.onConfirm || (() => {})}
        ui={ui}
      />
    </div>
  );
}
