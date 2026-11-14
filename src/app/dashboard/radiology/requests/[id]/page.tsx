"use client";

import { useEffect, useState } from "react";
import Link from "@/components/access/guarded-link";
import { useParams } from "next/navigation";
import {
  ChevronRight,
  Calendar,
  Stethoscope,
  ScanLine,
  ArrowLeft,
  Edit3,
  Check,
  X,
  FileText,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useTheme } from "@/contexts/theme-context";
import { useRadiology } from "@/hooks/useRadiology";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import FileDropzone, { UploadedFile } from "@/components/ui/Filedropzone";
import type { Priority, RequestStatus } from "@/api/slices/radiologySlice";

import { Can } from "@/components/access/can";
const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

function ageOf(dob?: string): string {
  if (!dob) return "";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days < 0) return "";
  if (days < 31) return `${days} day${days === 1 ? "" : "s"}`;
  const months = Math.floor(days / 30.44);
  if (months < 24) return `${months} mo`;
  return `${Math.floor(days / 365.25)} yrs`;
}

function formatWhen(iso?: string): string {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_OPTIONS = [
  { label: "Requested", value: "requested" },
  { label: "Pre-auth pending", value: "pre_auth_pending" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Queued", value: "queued" },
  { label: "In acquisition", value: "in_acquisition" },
  { label: "Completed", value: "completed" },
  { label: "Reported", value: "reported" },
  { label: "Cancelled", value: "cancelled" },
];

const PRIORITY_OPTIONS = [
  { label: "Routine", value: "routine" },
  { label: "Urgent", value: "urgent" },
  { label: "STAT", value: "stat" },
];

type AllergyEntry = {
  allergen: string;
  reaction?: string;
  severity?: "mild" | "moderate" | "severe" | "unknown";
};

export default function RadiologyRequestDetailsPage() {
  const params = useParams();
  const requestId = params?.id as string;

  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const {
    currentRequest,
    detailLoading,
    fetchRequestById,
    updateStatus,
    uploadStudy,
    updateResult,
    updateContrastInfo,
    hasFacility,
    facilityId,
  } = useRadiology();

  const [request, setRequest] = useState<any>(null);

  // Inline Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editProcedureName, setEditProcedureName] = useState("");
  const [editBodyPart, setEditBodyPart] = useState("");
  const [editClinicalIndication, setEditClinicalIndication] = useState("");
  const [editPriority, setEditPriority] = useState<Priority>("routine");
  const [editStatus, setEditStatus] = useState<RequestStatus>("requested");
  const [editContrastRequired, setEditContrastRequired] = useState(false);
  const [editContrastNote, setEditContrastNote] = useState("");
  const [editAllergies, setEditAllergies] = useState<AllergyEntry[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [editFinalResult, setEditFinalResult] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Existing images that can be removed
  const [existingInstances, setExistingInstances] = useState<any[]>([]);
  const [removedKeys, setRemovedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (hasFacility && facilityId && requestId) {
      fetchRequestById(requestId);
    }
  }, [hasFacility, facilityId, requestId]);

  useEffect(() => {
    if (currentRequest) {
      setRequest(currentRequest);
      setEditProcedureName(currentRequest.procedureName || "");
      setEditBodyPart(currentRequest.bodyPart || "");
      setEditClinicalIndication(currentRequest.clinicalIndication || "");
      setEditPriority(currentRequest.priority || "routine");
      setEditStatus(currentRequest.status || "requested");
      setEditContrastRequired(!!currentRequest.contrast?.contrastRequired);
      setEditContrastNote(
        currentRequest.contrast?.contrastRequirementNote || ""
      );
      setEditAllergies(currentRequest.contrast?.allergies || []);
      setEditFinalResult(currentRequest.result?.finalResult || "");

      const instances =
        currentRequest.study && typeof currentRequest.study === "object"
          ? currentRequest.study.instances || []
          : [];
      setExistingInstances(instances);
      setRemovedKeys([]);
    }
  }, [currentRequest]);

  const handleOpenEdit = () => {
    if (!request) return;
    setEditProcedureName(request.procedureName || "");
    setEditBodyPart(request.bodyPart || "");
    setEditClinicalIndication(request.clinicalIndication || "");
    setEditPriority(request.priority || "routine");
    setEditStatus(request.status || "requested");
    setEditContrastRequired(!!request.contrast?.contrastRequired);
    setEditContrastNote(request.contrast?.contrastRequirementNote || "");
    setEditAllergies(request.contrast?.allergies || []);
    setEditFinalResult(request.result?.finalResult || "");
    setAttachedFiles([]);

    const instances =
      request.study && typeof request.study === "object"
        ? request.study.instances || []
        : [];
    setExistingInstances(instances);
    setRemovedKeys([]);
    setIsEditing(true);
  };

  const handleRemoveExisting = (b2Key: string) => {
    setRemovedKeys((prev) => [...prev, b2Key]);
    setExistingInstances((prev) => prev.filter((i) => i.b2Key !== b2Key));
  };

  const handleSaveEdit = async () => {
    if (!request) return;
    setIsSavingEdit(true);
    try {
      const rawFiles = attachedFiles
        .map((f) => f.file)
        .filter(Boolean) as File[];
      const finalResult = editFinalResult.trim();
      const resultChanged = finalResult !== (request.result?.finalResult || "");
      const hasRemovals = removedKeys.length > 0;

      if (rawFiles.length > 0 || hasRemovals) {
        await uploadStudy(request._id, rawFiles, {
          studyDescription: editProcedureName,
          finalResult: finalResult || undefined,
          removeKeys: hasRemovals ? removedKeys : undefined,
        });
      } else if (finalResult && resultChanged) {
        await updateResult(request._id, finalResult);
      }

      await updateContrastInfo(request._id, {
        contrastRequired: editContrastRequired,
        contrastRequirementNote: editContrastNote.trim(),
        allergies: editAllergies.filter((a) => a.allergen.trim()),
      });

      if (request.status !== editStatus) {
        await updateStatus(request._id, editStatus, "Updated via detail view");
      }

      await fetchRequestById(request._id);
      setAttachedFiles([]);
      setRemovedKeys([]);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update request:", err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (!hasFacility) {
    return (
      <div className="p-6 text-sm opacity-70">Select a facility first.</div>
    );
  }

  if (detailLoading && !request) {
    return <DarkBlurOverlayLoader text="Loading request details..." />;
  }

  if (!request && !detailLoading) {
    return (
      <div className="mx-auto max-w-4xl w-full p-6 space-y-4">
        <Link
          href="/dashboard/radiology/requests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold opacity-70 hover:opacity-100"
        >
          <ArrowLeft size={14} /> Back to Requests
        </Link>
        <div
          className="rounded-[24px] p-12 text-center space-y-3 border"
          style={{
            borderColor: ui.border,
            backgroundColor: ui.card,
            color: ui.text,
          }}
        >
          <h2 className="text-base font-bold">Request not found</h2>
          <p className="text-xs opacity-60">
            The requested imaging record could not be found or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const patient =
    request?.patient && typeof request.patient === "object"
      ? request.patient
      : null;
  const fullName = patient
    ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim()
    : "Unknown patient";
  const age = ageOf(patient?.dateOfBirth);
  const requester = request?.requestedBy
    ? `${request.requestedBy.firstName || ""} ${
        request.requestedBy.lastName || ""
      }`.trim()
    : "N/A";
  const preAuthStatus = request?.preAuthorization?.status;

  // View-mode instances
  const studyInstances =
    request?.study && typeof request.study === "object"
      ? request.study.instances || []
      : [];

  return (
    <div className="mx-auto max-w-4xl w-full space-y-6 pb-12">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs opacity-70">
        <Link href="/dashboard/radiology" className="hover:opacity-100">
          Radiology
        </Link>
        <ChevronRight size={12} className="opacity-40" />
        <Link
          href="/dashboard/radiology/requests"
          className="hover:opacity-100"
        >
          Requests
        </Link>
        <ChevronRight size={12} className="opacity-40" />
        <span className="font-semibold">
          {request?.accessionNumber || "Details"}
        </span>
      </div>

      {/* Header */}
      <div
        className="rounded-[22px] sm:rounded-[28px] p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border"
        style={{
          backgroundColor: ui.card,
          borderColor: ui.border,
          color: ui.text,
        }}
      >
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
            style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
          >
            <ScanLine size={24} />
          </span>
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editProcedureName}
                onChange={(e) => setEditProcedureName(e.target.value)}
                className="w-full text-base sm:text-xl font-bold bg-transparent border-b outline-none pb-1"
                style={{ borderColor: PRIMARY_COLOR }}
              />
            ) : (
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {request?.procedureName || "Imaging Order"}
              </h1>
            )}
            <p className="text-xs font-mono opacity-60 mt-0.5">
              Accession: {request?.accessionNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isEditing ? (
            <>
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={handleSaveEdit}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <Check size={14} /> {isSavingEdit ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold border transition hover:opacity-80"
                style={{ borderColor: ui.border }}
              >
                <X size={14} /> Cancel
              </button>
            </>
          ) : (
            <>
              <Can perm="radiology.write"><button
                type="button"
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold border transition hover:opacity-80"
                style={{ backgroundColor: ui.inner, borderColor: ui.border }}
              >
                <Edit3 size={14} /> Edit Request
              </button></Can>
              <Link
                href="/dashboard/radiology/requests"
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold border transition hover:opacity-80"
                style={{ backgroundColor: ui.inner, borderColor: ui.border }}
              >
                <ArrowLeft size={14} /> Back to list
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <div
            className="rounded-[22px] border p-5 sm:p-6 space-y-5"
            style={{
              backgroundColor: ui.card,
              borderColor: ui.border,
              color: ui.text,
            }}
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider opacity-70">
              Order Specifications
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="opacity-50 mb-1">Modality</p>
                <p className="font-bold text-sm uppercase">
                  {request?.modality}
                </p>
              </div>
              <div>
                <p className="opacity-50 mb-1">Priority</p>
                {isEditing ? (
                  <select
                    value={editPriority}
                    onChange={(e) =>
                      setEditPriority(e.target.value as Priority)
                    }
                    className="w-full rounded-lg px-2 py-1.5 border outline-none text-xs font-bold"
                    style={{
                      backgroundColor: ui.inner,
                      borderColor: ui.border,
                      color: ui.text,
                    }}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="font-bold text-sm">{cap(request?.priority)}</p>
                )}
              </div>
              <div>
                <p className="opacity-50 mb-1">Body Part & Laterality</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editBodyPart}
                    onChange={(e) => setEditBodyPart(e.target.value)}
                    className="w-full rounded-lg px-2 py-1.5 border outline-none text-xs font-bold bg-transparent"
                    style={{ borderColor: ui.border }}
                  />
                ) : (
                  <p className="font-bold text-sm">
                    {request?.bodyPart}
                    {request?.laterality && request?.laterality !== "na"
                      ? ` (${cap(request.laterality)})`
                      : ""}
                  </p>
                )}
              </div>
              <div>
                <p className="opacity-50 mb-1">Status</p>
                {isEditing ? (
                  <select
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as RequestStatus)
                    }
                    className="w-full rounded-lg px-2 py-1.5 border outline-none text-xs font-bold"
                    style={{
                      backgroundColor: ui.inner,
                      borderColor: ui.border,
                      color: ui.text,
                    }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="font-bold text-sm">
                    {cap(request?.status?.replace(/_/g, " "))}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t" style={{ borderColor: ui.border }}>
              <p className="text-[11px] font-semibold opacity-50 mb-1">
                Clinical Indication
              </p>
              {isEditing ? (
                <textarea
                  value={editClinicalIndication}
                  onChange={(e) => setEditClinicalIndication(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl p-3 border outline-none bg-transparent resize-none text-xs"
                  style={{ borderColor: ui.border }}
                />
              ) : (
                <p className="text-xs leading-relaxed opacity-90">
                  {request?.clinicalIndication ||
                    "No clinical indication provided."}
                </p>
              )}
            </div>

            {/* ========== EDIT MODE: existing images + new uploads ========== */}
            {isEditing && (
              <div
                className="pt-3 border-t space-y-4"
                style={{ borderColor: ui.border }}
              >
                {/* Existing images with remove */}
                {existingInstances.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold opacity-50">
                      Current Images / Files ({existingInstances.length})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {existingInstances.map((instance: any, idx: number) => {
                        const isImage = instance.mimeType?.startsWith("image/");
                        return (
                          <div
                            key={instance.b2Key || idx}
                            className="relative rounded-xl overflow-hidden border aspect-square group"
                            style={{
                              borderColor: ui.border,
                              backgroundColor: ui.inner,
                            }}
                          >
                            {isImage ? (
                              <img
                                src={instance.url}
                                alt={instance.fileName || `Image ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full gap-1 p-2">
                                <FileText size={24} className="opacity-60" />
                                <span className="text-[9px] truncate max-w-full px-1">
                                  {instance.fileName}
                                </span>
                              </div>
                            )}

                            {/* Remove button */}
                            <Can perm="radiology.write"><button
                              type="button"
                              onClick={() =>
                                handleRemoveExisting(instance.b2Key)
                              }
                              className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-md opacity-90 hover:opacity-100 transition"
                              title="Remove image"
                            >
                              <Trash2 size={14} />
                            </button></Can>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add new files */}
                <FileDropzone
                  files={attachedFiles}
                  onChange={setAttachedFiles}
                  ui={ui}
                  accent={PRIMARY_COLOR}
                  label="Add more Study Images / Reports"
                />

                <div>
                  <p className="text-[11px] font-semibold opacity-50 mb-1">
                    Final Result / Findings
                  </p>
                  <textarea
                    value={editFinalResult}
                    onChange={(e) => setEditFinalResult(e.target.value)}
                    rows={5}
                    placeholder="Enter the final result / findings for this study..."
                    className="w-full rounded-xl p-3 border outline-none bg-transparent resize-y text-xs"
                    style={{ borderColor: ui.border, color: ui.text }}
                  />
                </div>
              </div>
            )}

            <div
              className="space-y-4 pt-2 border-t text-xs"
              style={{ borderColor: ui.border }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="opacity-50 mb-1">Contrast Requirement</p>
                  {isEditing ? (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 font-semibold">
                        <input
                          type="checkbox"
                          checked={editContrastRequired}
                          onChange={(e) =>
                            setEditContrastRequired(e.target.checked)
                          }
                        />
                        Contrast required
                      </label>
                      <textarea
                        value={editContrastNote}
                        onChange={(e) => setEditContrastNote(e.target.value)}
                        rows={3}
                        placeholder="Type contrast requirement..."
                        className="w-full rounded-xl p-3 border outline-none bg-transparent resize-none text-xs"
                        style={{ borderColor: ui.border, color: ui.text }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-bold">
                        {request?.contrast?.contrastRequired
                          ? `Required (${request?.contrast?.contrastType?.toUpperCase()})`
                          : "Not Required"}
                      </p>
                      {request?.contrast?.contrastRequirementNote && (
                        <p className="opacity-80 whitespace-pre-wrap">
                          {request.contrast.contrastRequirementNote}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <p className="opacity-50 mb-1">Pre-Authorization</p>
                  <p className="font-bold">
                    {request?.preAuthorization?.required
                      ? `Required (${cap(preAuthStatus)})`
                      : "Not Required"}
                  </p>
                </div>
              </div>

              {/* Allergies */}
              <div>
                <p className="opacity-50 mb-1">Allergies</p>
                {isEditing ? (
                  <div className="space-y-2">
                    {editAllergies.map((a, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2">
                        <input
                          type="text"
                          value={a.allergen}
                          onChange={(e) =>
                            setEditAllergies((prev) =>
                              prev.map((x, idx) =>
                                idx === i
                                  ? { ...x, allergen: e.target.value }
                                  : x
                              )
                            )
                          }
                          placeholder="Allergen"
                          className="col-span-12 sm:col-span-4 rounded-lg px-2 py-1.5 border outline-none bg-transparent"
                          style={{ borderColor: ui.border }}
                        />
                        <input
                          type="text"
                          value={a.reaction || ""}
                          onChange={(e) =>
                            setEditAllergies((prev) =>
                              prev.map((x, idx) =>
                                idx === i
                                  ? { ...x, reaction: e.target.value }
                                  : x
                              )
                            )
                          }
                          placeholder="Reaction"
                          className="col-span-7 sm:col-span-4 rounded-lg px-2 py-1.5 border outline-none bg-transparent"
                          style={{ borderColor: ui.border }}
                        />
                        <select
                          value={a.severity || "unknown"}
                          onChange={(e) =>
                            setEditAllergies((prev) =>
                              prev.map((x, idx) =>
                                idx === i
                                  ? {
                                      ...x,
                                      severity: e.target
                                        .value as AllergyEntry["severity"],
                                    }
                                  : x
                              )
                            )
                          }
                          className="col-span-4 sm:col-span-3 rounded-lg px-2 py-1.5 border outline-none"
                          style={{
                            backgroundColor: ui.inner,
                            borderColor: ui.border,
                            color: ui.text,
                          }}
                        >
                          <option value="unknown">Unknown</option>
                          <option value="mild">Mild</option>
                          <option value="moderate">Moderate</option>
                          <option value="severe">Severe</option>
                        </select>
                        <Can perm="patients.write"><button
                          type="button"
                          onClick={() =>
                            setEditAllergies((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                          className="col-span-1 flex items-center justify-center rounded-lg border hover:opacity-70"
                          style={{ borderColor: ui.border }}
                          aria-label="Remove allergy"
                        >
                          <X size={12} />
                        </button></Can>
                      </div>
                    ))}
                    <Can perm="patients.write"><button
                      type="button"
                      onClick={() =>
                        setEditAllergies((prev) => [
                          ...prev,
                          { allergen: "", reaction: "", severity: "unknown" },
                        ])
                      }
                      className="rounded-full border px-3 py-1.5 text-[11px] font-semibold hover:opacity-80"
                      style={{ borderColor: ui.border }}
                    >
                      + Add allergy
                    </button></Can>
                  </div>
                ) : request?.contrast?.allergies?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {request.contrast.allergies.map((a: any, i: number) => (
                      <span
                        key={i}
                        className="rounded-full border px-3 py-1 font-semibold"
                        style={{
                          backgroundColor: ui.inner,
                          borderColor: ui.border,
                        }}
                      >
                        {a.allergen}
                        {a.reaction ? ` – ${a.reaction}` : ""}
                        {a.severity && a.severity !== "unknown"
                          ? ` (${a.severity})`
                          : ""}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="opacity-60">No known allergies recorded.</p>
                )}
              </div>
            </div>
          </div>

          {/* Final Result (view mode) */}
          {!isEditing && request?.result?.finalResult && (
            <div
              className="rounded-[22px] border p-5 sm:p-6 space-y-3"
              style={{
                backgroundColor: ui.card,
                borderColor: ui.border,
                color: ui.text,
              }}
            >
              <h2 className="text-xs font-semibold uppercase tracking-wider opacity-70">
                Final Result / Findings
              </h2>
              <p className="text-xs leading-relaxed whitespace-pre-wrap opacity-90">
                {request.result.finalResult}
              </p>
              <p className="text-[10px] opacity-50">
                Recorded {formatWhen(request.result.enteredAt)}
              </p>
            </div>
          )}

          {/* Study images (view mode) */}
          {!isEditing && studyInstances.length > 0 && (
            <div
              className="rounded-[22px] border p-5 sm:p-6 space-y-4"
              style={{
                backgroundColor: ui.card,
                borderColor: ui.border,
                color: ui.text,
              }}
            >
              <h2 className="text-xs font-semibold uppercase tracking-wider opacity-70">
                Uploaded Study Images / Files ({studyInstances.length})
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {studyInstances.map((instance: any, idx: number) => {
                  const isImage = instance.mimeType?.startsWith("image/");
                  const isPdf = instance.mimeType === "application/pdf";

                  return (
                    <a
                      key={instance.b2Key || idx}
                      href={instance.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative rounded-xl overflow-hidden border aspect-square flex flex-col items-center justify-center transition hover:opacity-90"
                      style={{
                        borderColor: ui.border,
                        backgroundColor: ui.inner,
                      }}
                    >
                      {isImage ? (
                        <img
                          src={instance.url}
                          alt={instance.fileName || `Image ${idx + 1}`}
                          className="w-full h-full object-cover transition group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 p-3 text-center">
                          {isPdf ? (
                            <FileText size={28} className="opacity-60" />
                          ) : (
                            <ImageIcon size={28} className="opacity-60" />
                          )}
                          <span className="text-[10px] font-semibold opacity-80 truncate max-w-full px-1">
                            {instance.fileName || `File ${idx + 1}`}
                          </span>
                          <span className="text-[9px] opacity-50">
                            {instance.mimeType}
                          </span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-end">
                        <div className="w-full p-2 bg-black/50 text-[9px] text-white truncate opacity-0 group-hover:opacity-100 transition">
                          {instance.fileName}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div
            className="rounded-[22px] border p-5 sm:p-6 space-y-4"
            style={{
              backgroundColor: ui.card,
              borderColor: ui.border,
              color: ui.text,
            }}
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider opacity-70">
              Activity & Notes Log
            </h2>

            {request?.notesList && request.notesList.length > 0 ? (
              <div className="space-y-3">
                {request.notesList.map((note: any, idx: number) => (
                  <div
                    key={note._id || idx}
                    className="rounded-xl p-3 text-xs border space-y-1"
                    style={{
                      backgroundColor: ui.inner,
                      borderColor: ui.border,
                    }}
                  >
                    <p className="opacity-95 leading-relaxed">{note.text}</p>
                    <p className="text-[10px] opacity-50">
                      {formatWhen(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs opacity-50">No notes or logs recorded.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div
            className="rounded-[22px] border p-5 space-y-4"
            style={{
              backgroundColor: ui.card,
              borderColor: ui.border,
              color: ui.text,
            }}
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider opacity-70">
              Patient Details
            </h2>

            <div className="space-y-2.5 text-xs">
              <div>
                <p className="font-bold text-base">{fullName}</p>
                <p className="font-mono opacity-60">
                  MRN: {patient?.mrn || "N/A"}
                </p>
              </div>

              <div
                className="pt-2 border-t space-y-1.5 opacity-80"
                style={{ borderColor: ui.border }}
              >
                <p>
                  <span className="opacity-50">Gender:</span>{" "}
                  {cap(patient?.gender) || "N/A"}
                </p>
                <p>
                  <span className="opacity-50">Date of Birth:</span>{" "}
                  {patient?.dateOfBirth
                    ? new Date(patient.dateOfBirth).toLocaleDateString()
                    : "N/A"}{" "}
                  {age ? `(${age})` : ""}
                </p>
              </div>
            </div>
          </div>

          <div
            className="rounded-[22px] border p-5 space-y-4"
            style={{
              backgroundColor: ui.card,
              borderColor: ui.border,
              color: ui.text,
            }}
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider opacity-70">
              Order Metadata
            </h2>

            <div className="space-y-2 text-xs opacity-80">
              <p className="flex items-center gap-1.5 font-medium">
                <Stethoscope size={14} className="opacity-60" />
                Dr. {requester}
              </p>
              <p className="flex items-center gap-1.5 opacity-70">
                <Calendar size={14} className="opacity-60" />
                Requested: {formatWhen(request?.requestedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
