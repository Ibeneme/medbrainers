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
  Paperclip,
  Upload,
  Eye,
  ExternalLink,
  CheckCircle2,
  BedDouble,
  Siren,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  addConsultation,
  fetchPatient,
  fetchLabCatalog,
  uploadConsultationAttachments,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { CustomDropdown } from "@/components/ui";
import type { AdmissionPriority } from "@/api/types";
import {
  saveAttachments,
  loadAttachments,
  deleteAttachments,
} from "@/lib/attachment-store";

const inputCls =
  "w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20";

/* ------------------------------ attachments ------------------------------ */
/* Each selected file gets ONE object URL, created when it is added and
   revoked when it is removed (or the page unmounts). */
type AttachedFile = {
  id: string;
  file: File;
  url: string;
  isImage: boolean;
  isPdf: boolean;
};

type Draft = {
  id: string;
  title: string;
  updatedAt: string;
  data: any;
  attachmentCount?: number;
};

const isPdfFile = (f: File) =>
  f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
const isImageFile = (f: File) => f.type.startsWith("image/");
const formatSize = (b: number) =>
  b >= 1024 * 1024
    ? `${(b / (1024 * 1024)).toFixed(1)} MB`
    : `${(b / 1024).toFixed(1)} KB`;
const fileKey = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;
const toAttached = (file: File): AttachedFile => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  file,
  url: URL.createObjectURL(file),
  isImage: isImageFile(file),
  isPdf: isPdfFile(file),
});

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
  const { current, saving } = useAppSelector((s) => s.patients);
  const { catalog: labCatalog } = useAppSelector((s) => s.labs);

  const [conTitle, setConTitle] = useState("");
  const [conComplaint, setConComplaint] = useState("");
  const [conDiagnosis, setConDiagnosis] = useState("");
  const [conIcd, setConIcd] = useState("");
  const [conNotes, setConNotes] = useState("");
  const [conSummary, setConSummary] = useState("");
  const [conStatus, setConStatus] = useState<"open" | "completed">("open");

  /* inpatient: "Admit patient" toggle (sends an admission request to the wards) */
  const [conAdmit, setConAdmit] = useState(false);
  const [admPriority, setAdmPriority] = useState<AdmissionPriority>("routine");
  const [admReason, setAdmReason] = useState("");
  const [admWardType, setAdmWardType] = useState("");
  const [admIsolation, setAdmIsolation] = useState(false);
  const [admNotes, setAdmNotes] = useState("");

  const [conTemp, setConTemp] = useState("");
  const [conSpo2, setConSpo2] = useState("");
  const [conPulse, setConPulse] = useState("");
  const [conSys, setConSys] = useState("");
  const [conDia, setConDia] = useState("");

  const [conTests, setConTests] = useState<
    Array<{
      catalogId: string;
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

  // Files attached to this consultation (also persisted in IndexedDB)
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const attachmentsRef = useRef<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // true once the autosaved files have been read back from IndexedDB
  const [hydrated, setHydrated] = useState(false);

  // Drag and drop active state
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // File currently open in the preview modal (image or PDF)
  const [previewFile, setPreviewFile] = useState<AttachedFile | null>(null);

  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [lastAutoSaved, setLastAutoSaved] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<Draft[]>([]);

  const STORAGE_KEY = `consultation_drafts_${patientId}`;
  const AUTO_SAVE_KEY = `consultation_autosave_${patientId}`;
  /* IndexedDB buckets that hold the attached files */
  const AUTO_BUCKET = `autosave_${patientId}`;
  const draftBucket = (id: string) => `draft_${id}`;
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

  /* restore drafts list, the text autosave AND the autosaved attachments */
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

    let cancelled = false;
    loadAttachments(AUTO_BUCKET)
      .then((files) => {
        if (!cancelled && files.length > 0) replaceAttachments(files);
      })
      .catch((e) => console.error("Failed to restore attachments", e))
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [STORAGE_KEY, AUTO_SAVE_KEY, AUTO_BUCKET]);

  /* text autosave */
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
      conAdmit,
      admPriority,
      admReason,
      admWardType,
      admIsolation,
      admNotes,
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
    conAdmit,
    admPriority,
    admReason,
    admWardType,
    admIsolation,
    admNotes,
    conTemp,
    conSpo2,
    conPulse,
    conSys,
    conDia,
    conTests,
    conDrugs,
    AUTO_SAVE_KEY,
  ]);

  /* attachment autosave (only after restore finished, so an empty list can
     never overwrite files that are still being loaded) */
  useEffect(() => {
    if (!hydrated) return;
    const handler = setTimeout(() => {
      saveAttachments(
        AUTO_BUCKET,
        attachments.map((a) => a.file)
      )
        .then(() => setLastAutoSaved(new Date().toLocaleTimeString()))
        .catch((e) => console.error("Failed to autosave attachments", e));
    }, 500);
    return () => clearTimeout(handler);
  }, [attachments, hydrated, AUTO_BUCKET]);

  /* free every object URL when leaving the page */
  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((a) => URL.revokeObjectURL(a.url));
    };
  }, []);

  /* Esc closes the file preview */
  useEffect(() => {
    if (!previewFile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewFile(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewFile]);

  const handleAddCatalogTest = (testId: string) => {
    if (!testId) return;
    const catalogItem = (labCatalog || []).find(
      (item) => String(item._id) === String(testId)
    );
    if (!catalogItem) {
      setSubmissionError(
        "Selected lab test could not be found in the catalog."
      );
      return;
    }
    if (conTests.some((t) => String(t.catalogId) === String(catalogItem._id))) {
      return;
    }
    setConTests([
      ...conTests,
      {
        catalogId: String(catalogItem._id),
        code: catalogItem.code || "LAB",
        name: catalogItem.name,
        price: catalogItem.price || 0,
        urgency: "routine",
      },
    ]);
  };

  const handleGrandTotal = () => {
    return conTests.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  };

  /* ---------------------------- attachment logic --------------------------- */
  /** Swap the whole attachment list (used when restoring autosave / a draft). */
  const replaceAttachments = (files: File[]) => {
    attachmentsRef.current.forEach((a) => URL.revokeObjectURL(a.url));
    const next = files.map(toAttached);
    attachmentsRef.current = next;
    setAttachments(next);
    setPreviewFile(null);
  };

  const addFiles = (incoming: File[]) => {
    const valid = incoming.filter((f) => isImageFile(f) || isPdfFile(f));
    if (valid.length === 0) {
      if (incoming.length > 0) {
        setSubmissionError("Only images and PDF files can be attached.");
      }
      return;
    }
    const existing = new Set(
      attachmentsRef.current.map((a) => fileKey(a.file))
    );
    const added = valid
      .filter((f) => !existing.has(fileKey(f)))
      .map(toAttached);
    if (added.length === 0) return;
    attachmentsRef.current = [...attachmentsRef.current, ...added];
    setAttachments(attachmentsRef.current);
  };

  const removeAttachment = (id: string) => {
    const target = attachmentsRef.current.find((a) => a.id === id);
    if (target) URL.revokeObjectURL(target.url);
    attachmentsRef.current = attachmentsRef.current.filter((a) => a.id !== id);
    setAttachments(attachmentsRef.current);
    setPreviewFile((p) => (p && p.id === id ? null : p));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    addFiles(Array.from(files));
    // reset so the same file can be picked again later
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDropFiles = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    addFiles(Array.from(files));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  /* -------------------------------- drafts --------------------------------- */
  const handleSaveToDrafts = async () => {
    setSubmissionError(null);
    const draftData = {
      conTitle,
      conComplaint,
      conDiagnosis,
      conIcd,
      conNotes,
      conSummary,
      conStatus,
      conAdmit,
      admPriority,
      admReason,
      admWardType,
      admIsolation,
      admNotes,
      conTemp,
      conSpo2,
      conPulse,
      conSys,
      conDia,
      conTests,
      conDrugs,
    };

    const id = activeDraftId || Date.now().toString();
    const entry: Draft = {
      id,
      title: conTitle.trim() || "Untitled Consultation Draft",
      updatedAt: new Date().toLocaleString(),
      data: draftData,
      attachmentCount: attachments.length,
    };
    const updatedDrafts = activeDraftId
      ? drafts.map((d) => (d.id === id ? entry : d))
      : [entry, ...drafts];

    setActiveDraftId(id);
    setDrafts(updatedDrafts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDrafts));

    /* the files themselves go to IndexedDB (localStorage can't hold files) */
    try {
      await saveAttachments(
        draftBucket(id),
        attachments.map((a) => a.file)
      );
      setDraftNotice(
        attachments.length > 0
          ? `Draft saved with ${attachments.length} attachment${
              attachments.length === 1 ? "" : "s"
            }.`
          : "Draft saved."
      );
    } catch (e) {
      console.error("Failed to save draft attachments", e);
      setSubmissionError(
        "Draft text was saved, but the attachments couldn't be stored on this device (storage may be full, or the browser is in private mode)."
      );
    }
    window.setTimeout(() => setDraftNotice(null), 3500);
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
    setConAdmit(!!draftData.conAdmit);
    setAdmPriority(draftData.admPriority || "routine");
    setAdmReason(draftData.admReason || "");
    setAdmWardType(draftData.admWardType || "");
    setAdmIsolation(!!draftData.admIsolation);
    setAdmNotes(draftData.admNotes || "");
    setConTemp(draftData.conTemp || "");
    setConSpo2(draftData.conSpo2 || "");
    setConPulse(draftData.conPulse || "");
    setConSys(draftData.conSys || "");
    setConDia(draftData.conDia || "");
    setConTests(draftData.conTests || []);
    setConDrugs(draftData.conDrugs || []);

    /* resuming a saved draft also brings back its attachments
       (the autosave restore on mount is handled separately) */
    if (draft.id) {
      loadAttachments(draftBucket(draft.id))
        .then((files) => replaceAttachments(files))
        .catch((e) => console.error("Failed to load draft attachments", e));
    }
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
    deleteAttachments(draftBucket(draftToDelete.id)).catch(() => {});
    if (activeDraftId === draftToDelete.id) {
      setActiveDraftId(null);
    }
    setDraftToDelete(null);
  };

  const handleOpenPreview = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);
    const missingCatalogId = conTests.some((t) => !t.catalogId);
    if (missingCatalogId) {
      setSubmissionError(
        "One or more selected lab tests are missing a catalog ID. Please re-select the test from the catalog dropdown."
      );
      return;
    }
    if (conAdmit && !admReason.trim()) {
      setSubmissionError(
        "Admit patient is switched on — please give a reason for admission so the ward team knows why."
      );
      return;
    }
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
      .filter((t) => t.catalogId && t.name && t.name.trim().length > 0)
      .map((t) => ({
        catalogId: String(t.catalogId),
        code: t.code || "LAB",
        name: t.name.trim(),
        price: Number(t.price) || 0,
        urgency: t.urgency || "routine",
        reason: t.reason,
        status: "ordered" as const,
      }));

    if (conTests.length > 0 && cleanedTests.length !== conTests.length) {
      setSubmissionError(
        "One or more lab tests have invalid or missing catalog IDs."
      );
      setShowPreviewModal(false);
      return;
    }

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
      admission: conAdmit
        ? {
            priority: admPriority,
            reason: admReason.trim(),
            admittingDiagnosis: conDiagnosis.trim() || undefined,
            preferredWardType: admWardType || undefined,
            isolationRequired: admIsolation || undefined,
            notes: admNotes.trim() || undefined,
          }
        : undefined,
      vitals: cleanedVitals,
      recommendedTests: cleanedTests.length ? cleanedTests : undefined,
      recommendedDrugs: cleanedDrugs.length ? cleanedDrugs : undefined,
      totalPrice: grandTotalPrice,
    };

    try {
      const result = await dispatch(
        addConsultation({ facilityId: activeFacilityId, patientId, payload })
      ).unwrap();
      const newConsultationId = result.data?._id;

      if (attachments.length > 0 && newConsultationId) {
        await dispatch(
          uploadConsultationAttachments({
            facilityId: activeFacilityId,
            patientId,
            consultationId: newConsultationId,
            files: attachments.map((a) => a.file),
          })
        ).unwrap();
      }

      /* submitted: clear the autosave + the used draft (text AND files) */
      localStorage.removeItem(AUTO_SAVE_KEY);
      deleteAttachments(AUTO_BUCKET).catch(() => {});
      if (activeDraftId) {
        const filtered = drafts.filter((d) => d.id !== activeDraftId);
        setDrafts(filtered);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        deleteAttachments(draftBucket(activeDraftId)).catch(() => {});
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
              type="button"
              onClick={() => setSubmissionError(null)}
              className="opacity-70 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {draftNotice && (
          <div className="rounded-2xl p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>{draftNotice}</span>
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
                    <p className="text-[10px] opacity-50 flex items-center gap-1.5">
                      <span>{draft.updatedAt}</span>
                      {!!draft.attachmentCount && (
                        <span className="inline-flex items-center gap-0.5">
                          <Paperclip size={9} />
                          {draft.attachmentCount}
                        </span>
                      )}
                    </p>
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
                    ...(labCatalog || []).map((item) => ({
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

          {/* Attachments Section with thumbnails + image/PDF preview */}
          <div
            className="rounded-none sm:rounded-[28px] p-4 sm:p-6 space-y-4 -mx-4 sm:mx-0"
            style={{ backgroundColor: ui.card }}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Paperclip size={16} /> Attachments (Images / PDFs)
                {attachments.length > 0 && (
                  <span className="text-[11px] font-normal opacity-60">
                    ({attachments.length})
                  </span>
                )}
              </h2>
              <label
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white cursor-pointer hover:opacity-90 transition shrink-0"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <Upload size={14} />
                Select Files
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDropFiles}
              className={`rounded-2xl p-6 text-center text-xs border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                isDraggingOver ? "opacity-100 scale-[1.01]" : "opacity-70"
              }`}
              style={{
                borderColor: isDraggingOver ? PRIMARY_COLOR : ui.border,
                backgroundColor: isDraggingOver
                  ? `${PRIMARY_COLOR}10`
                  : ui.inner,
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={24} style={{ color: PRIMARY_COLOR }} />
              <p className="font-semibold">
                Drag & drop files here, or tap to browse
              </p>
              <p className="text-[10px] opacity-60">
                Supports images (JPEG, PNG, WEBP, GIF) and PDF
              </p>
            </div>

            {attachments.length === 0 ? (
              <div className="text-center text-xs opacity-50 pt-1">
                No files selected yet.
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                {attachments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-2xl border"
                    style={{
                      backgroundColor: ui.inner,
                      borderColor: ui.border,
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* thumbnail: tap to open the preview */}
                      <button
                        type="button"
                        onClick={() => setPreviewFile(a)}
                        aria-label={`Preview ${a.file.name}`}
                        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border flex items-center justify-center"
                        style={{
                          borderColor: ui.border,
                          backgroundColor: ui.card,
                        }}
                      >
                        {a.isImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={a.url}
                            alt={a.file.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div
                            className="flex flex-col items-center gap-0.5"
                            style={{ color: PRIMARY_COLOR }}
                          >
                            <FileText size={22} />
                            <span className="text-[9px] font-bold">PDF</span>
                          </div>
                        )}
                      </button>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">
                          {a.file.name}
                        </p>
                        <p className="text-[10px] opacity-50">
                          {a.isPdf ? "PDF" : "Image"} ·{" "}
                          {formatSize(a.file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewFile(a)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-black/5 dark:bg-white/10 hover:opacity-80"
                      >
                        <Eye size={13} /> Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.id)}
                        aria-label={`Remove ${a.file.name}`}
                        className="text-red-500 p-1.5 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

          {/* ───────────── Inpatient care: admit toggle ───────────── */}
          <div
            className="rounded-none sm:rounded-[28px] p-4 sm:p-6 space-y-4 -mx-4 sm:mx-0 transition-colors"
            style={{
              backgroundColor: ui.card,
              boxShadow: conAdmit ? `inset 0 0 0 1.5px ${PRIMARY_COLOR}` : "none",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: conAdmit ? PRIMARY_COLOR : ui.inner,
                    color: conAdmit ? "#fff" : PRIMARY_COLOR,
                  }}
                >
                  <BedDouble size={18} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold">Admit patient</h2>
                  <p className="text-xs opacity-60 mt-0.5 max-w-md">
                    Needs inpatient care? Switch this on and the ward desk gets
                    an admission request when you submit. They will assign the
                    ward and bed.
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={conAdmit}
                aria-label="Admit patient"
                onClick={() => {
                  const next = !conAdmit;
                  setConAdmit(next);
                  // Save the doctor some typing: start from what they already wrote.
                  if (next && !admReason.trim()) {
                    setAdmReason(conDiagnosis.trim() || conComplaint.trim());
                  }
                }}
                className="relative h-7 w-12 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  backgroundColor: conAdmit ? PRIMARY_COLOR : ui.inner,
                  border: conAdmit ? "none" : `1px solid ${ui.border}`,
                }}
              >
                <span
                  className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform"
                  style={{
                    transform: conAdmit ? "translateX(20px)" : "translateX(0)",
                  }}
                />
              </button>
            </div>

            {conAdmit && (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="mb-1.5 block text-xs font-medium opacity-80">
                    How urgent is the admission?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { v: "routine", label: "Routine", hint: "Next free bed" },
                        { v: "urgent", label: "Urgent", hint: "Within hours" },
                        { v: "emergency", label: "Emergency", hint: "Immediately" },
                      ] as const
                    ).map((o) => {
                      const active = admPriority === o.v;
                      const tone =
                        o.v === "emergency"
                          ? "#dc2626"
                          : o.v === "urgent"
                          ? "#d97706"
                          : PRIMARY_COLOR;
                      return (
                        <button
                          key={o.v}
                          type="button"
                          onClick={() => setAdmPriority(o.v)}
                          className="rounded-2xl px-3 py-2.5 text-left transition outline-none"
                          style={{
                            backgroundColor: active ? `${tone}1f` : ui.inner,
                            boxShadow: active ? `inset 0 0 0 1.5px ${tone}` : "none",
                            color: ui.text,
                          }}
                        >
                          <span
                            className="flex items-center gap-1 text-xs font-semibold"
                            style={{ color: active ? tone : ui.text }}
                          >
                            {o.v === "emergency" && <Siren size={12} />}
                            {o.label}
                          </span>
                          <span className="block text-[10px] opacity-60 mt-0.5">
                            {o.hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium opacity-80">
                    Reason for admission *
                  </label>
                  <textarea
                    rows={3}
                    value={admReason}
                    onChange={(e) => setAdmReason(e.target.value)}
                    placeholder="Why does this patient need to be admitted?"
                    className={inputCls}
                    style={inputStyle}
                  />
                  <p className="text-[10px] opacity-50 mt-1">
                    The diagnosis above is sent along automatically.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <CustomDropdown
                    label="Preferred ward type (optional)"
                    value={admWardType}
                    placeholder="Let the ward desk decide"
                    options={[
                      { value: "", label: "Let the ward desk decide" },
                      { value: "general", label: "General" },
                      { value: "private", label: "Private" },
                      { value: "surgical", label: "Surgical" },
                      { value: "maternity", label: "Maternity" },
                      { value: "pediatric", label: "Pediatric" },
                      { value: "icu", label: "ICU" },
                      { value: "nicu", label: "NICU" },
                      { value: "isolation", label: "Isolation" },
                    ]}
                    onChange={setAdmWardType}
                    isDark={isDark}
                    colors={colors}
                    border={border}
                  />
                  <label
                    className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-medium cursor-pointer select-none"
                    style={{ backgroundColor: ui.inner }}
                  >
                    <input
                      type="checkbox"
                      checked={admIsolation}
                      onChange={(e) => setAdmIsolation(e.target.checked)}
                      className="h-4 w-4"
                      style={{ accentColor: PRIMARY_COLOR }}
                    />
                    Needs isolation (infectious risk)
                  </label>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium opacity-80">
                    Note to ward team (optional)
                  </label>
                  <input
                    value={admNotes}
                    onChange={(e) => setAdmNotes(e.target.value)}
                    placeholder="e.g. needs oxygen on arrival, family waiting"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}
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

      {/* File Preview Modal (image or PDF). z-[60] so it also opens on top of
          the consultation preview modal. */}
      {previewFile && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-3 sm:p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="w-full max-w-3xl rounded-3xl p-4 sm:p-6 space-y-3 shadow-2xl relative"
            style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between gap-3 border-b pb-3"
              style={{ borderColor: ui.border }}
            >
              <div className="min-w-0">
                <h3 className="text-sm font-semibold truncate">
                  {previewFile.file.name}
                </h3>
                <p className="text-[10px] opacity-50">
                  {previewFile.isPdf ? "PDF" : "Image"} ·{" "}
                  {formatSize(previewFile.file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                aria-label="Close preview"
                className="opacity-70 hover:opacity-100 shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {previewFile.isImage ? (
              <div className="flex items-center justify-center max-h-[70vh] overflow-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewFile.url}
                  alt={previewFile.file.name}
                  className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <iframe
                  src={previewFile.url}
                  title={previewFile.file.name}
                  className="h-[65vh] w-full rounded-xl border bg-white"
                  style={{ borderColor: ui.border }}
                />
                <p className="text-[11px] opacity-60 text-center">
                  PDF not showing (common on phones)? Use “Open in new tab”.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              {previewFile.isPdf && (
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border"
                  style={{ borderColor: ui.border }}
                >
                  <ExternalLink size={13} /> Open in new tab
                </a>
              )}
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="px-5 py-2 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Consultation Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-xl"
            style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Consultation Preview</h3>
              <button
                type="button"
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
              {conAdmit && (
                <div
                  className="rounded-2xl p-3"
                  style={{ backgroundColor: `${PRIMARY_COLOR}1a` }}
                >
                  <span className="opacity-70 flex items-center gap-1 font-semibold">
                    <BedDouble size={12} /> Admission request ·{" "}
                    <span className="capitalize">{admPriority}</span>
                    {admIsolation ? " · isolation" : ""}
                  </span>
                  <p className="mt-1 font-semibold">{admReason}</p>
                  {admWardType && (
                    <p className="opacity-70 mt-0.5 capitalize">
                      Preferred: {admWardType} ward
                    </p>
                  )}
                </div>
              )}
              {attachments.length > 0 && (
                <div>
                  <span className="opacity-60 block mb-1">
                    Attachments ({attachments.length})
                  </span>
                  <div className="space-y-2">
                    {attachments.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setPreviewFile(a)}
                        className="flex w-full items-center gap-3 rounded-xl border p-2 text-left hover:opacity-80"
                        style={{
                          backgroundColor: ui.inner,
                          borderColor: ui.border,
                        }}
                      >
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                          style={{
                            backgroundColor: ui.card,
                            color: PRIMARY_COLOR,
                          }}
                        >
                          {a.isImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={a.url}
                              alt={a.file.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FileText size={18} />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {a.file.name}
                          </span>
                          <span className="block text-[10px] opacity-50">
                            {formatSize(a.file.size)}
                          </span>
                        </span>
                        <Eye size={14} className="shrink-0 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                disabled={saving}
                className="px-5 py-2 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                {saving ? "Submitting..." : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Draft Modal */}
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
