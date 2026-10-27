"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  ChevronRight,
  ClipboardList,
  Pill,
  Stethoscope,
  Trash2,
  AlertTriangle,
  Lock,
  History,
  Clock,
  UserCheck,
  ArrowRight,
  FlaskConical,
  Plus,
  Image as ImageIcon,
  FileText,
  Upload,
  Paperclip,
  ExternalLink,
  Building2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchConsultationbyId,
  updateConsultation,
  removeConsultation,
  fetchLabCatalog,
  uploadConsultationAttachments,
  fetchDepartments,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { CustomDropdown } from "@/components/ui";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";

const inputCls =
  "w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20";

export default function ConsultationDetailPage() {
  const params = useParams();
  const router = useRouter();

  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const pathParts = pathname.split("/");

  const fallbackPatientId = pathParts[pathParts.indexOf("patients") + 1] || "";
  const fallbackConsultationId =
    pathParts[pathParts.indexOf("consultations") + 1] || "";

  const patientId = String(params?.patientId || fallbackPatientId);
  const consultationId = String(
    params?.consultationId || fallbackConsultationId
  );

  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const { activeFacilityId } = useAppSelector((s) => s.facilities);
  const { current, saving } = useAppSelector((s) => s.patients);
  const { catalog: labCatalog } = useAppSelector((s) => s.labs);
  const { departments } = useAppSelector((s) => s.facilities);

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Form states
  const [conTitle, setConTitle] = useState("");
  const [conComplaint, setConComplaint] = useState("");
  const [conDiagnosis, setConDiagnosis] = useState("");
  const [conIcd, setConIcd] = useState("");
  const [conSummary, setConSummary] = useState("");
  const [conStatus, setConStatus] = useState<"open" | "completed">("open");
  const [conDepartment, setConDepartment] = useState("");

  // Vitals
  const [conTemp, setConTemp] = useState("");
  const [conSpo2, setConSpo2] = useState("");
  const [conPulse, setConPulse] = useState("");
  const [conSys, setConSys] = useState("");
  const [conDia, setConDia] = useState("");

  // Lab Tests & Drugs state
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HOOKS HOISTED BEFORE ANY CONDITIONAL RETURNS ---
  const consultation = useMemo(() => {
    return (current?.consultations || []).find(
      (c: any) => c._id === consultationId
    );
  }, [current, consultationId]);

  const departmentOptions = useMemo(() => {
    if (!departments) return [];
    return departments.map((dept: any) => ({
      label: `${dept.name}${dept.code ? ` (${dept.code})` : ""}`,
      value: String(dept._id || dept.id),
    }));
  }, [departments]);

  // Filter and sort activity logs related to this consultation (Latest first)
  const consultationLogs = useMemo(() => {
    if (!current?.activityLogs) return [];
    const filtered = current.activityLogs.filter(
      (log: any) =>
        (log.detail &&
          (log.detail.includes(consultation?.title || "") ||
            log.detail.includes(consultationId))) ||
        log.action?.includes("CONSULTATION") ||
        log.action?.includes("VITAL") ||
        log.action?.includes("ALLERGY")
    );

    return [...filtered].sort((a: any, b: any) => {
      const timeA = new Date(a.at || 0).getTime();
      const timeB = new Date(b.at || 0).getTime();
      return timeB - timeA;
    });
  }, [current?.activityLogs, consultation?.title, consultationId]);

  // 12-hour lock window calculation
  const isLocked = useMemo(() => {
    if (!consultation?.consultedAt && !consultation?.createdAt) return false;
    const timestamp = new Date(
      consultation.consultedAt || consultation.createdAt
    ).getTime();
    const now = Date.now();
    const diffHours = (now - timestamp) / (1000 * 60 * 60);
    return diffHours > 12;
  }, [consultation]);

  // Resolve assigned department object from populated or plain ID reference
  const assignedDeptObj = useMemo(() => {
    if (!consultation?.department) return null;
    if (typeof consultation.department === "object") {
      return consultation.department;
    }
    return departments?.find(
      (d: any) => String(d._id || d.id) === String(consultation.department)
    );
  }, [consultation?.department, departments]);

  // Fetch consultation, lab catalog, and departments on mount or reload
  useEffect(() => {
    if (activeFacilityId) {
      if (patientId && consultationId) {
        dispatch(
          fetchConsultationbyId({
            facilityId: activeFacilityId,
            patientId,
            consultationId,
          })
        );
      }
      dispatch(
        fetchLabCatalog({
          facilityId: activeFacilityId,
          includeInactive: false,
        })
      );
      dispatch(fetchDepartments(activeFacilityId));
    }
  }, [dispatch, activeFacilityId, patientId, consultationId]);

  useEffect(() => {
    if (consultation) {
      setConTitle(consultation.title || "");
      setConComplaint(consultation.complaint || "");
      setConDiagnosis(consultation.diagnosis || "");
      setConIcd(consultation.icdCode || "");
      setConSummary(consultation.summary || "");
      setConStatus(consultation.status || "open");

      const deptValue = consultation.department;
      if (typeof deptValue === "object" && deptValue !== null) {
        setConDepartment(String(deptValue._id || deptValue.id || ""));
      } else {
        setConDepartment(deptValue ? String(deptValue) : "");
      }

      if (consultation.vitals) {
        setConTemp(
          consultation.vitals.temperatureC != null
            ? String(consultation.vitals.temperatureC)
            : ""
        );
        setConSpo2(
          consultation.vitals.spo2 != null
            ? String(consultation.vitals.spo2)
            : ""
        );
        setConPulse(
          consultation.vitals.pulse != null
            ? String(consultation.vitals.pulse)
            : ""
        );
        setConSys(
          consultation.vitals.bpSystolic != null
            ? String(consultation.vitals.bpSystolic)
            : ""
        );
        setConDia(
          consultation.vitals.bpDiastolic != null
            ? String(consultation.vitals.bpDiastolic)
            : ""
        );
      }

      if (consultation.recommendedTests) {
        setConTests(
          consultation.recommendedTests.map((t: any) => ({
            catalogId: t.catalogId?._id || t.catalogId,
            code: t.code || "LAB",
            name: t.name || "",
            price: t.price || 0,
            urgency: t.urgency || "routine",
            reason: t.reason,
          }))
        );
      }

      if (consultation.recommendedDrugs) {
        setConDrugs(
          consultation.recommendedDrugs.map((d: any) => ({
            name: d.name || "",
            dosage: d.dosage || "",
            frequency: d.frequency || "",
            route: d.route || "",
            duration: d.duration || "",
            instructions: d.instructions || "",
          }))
        );
      }
    }
  }, [consultation]);

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

  const inputStyle = {
    backgroundColor: ui.inner,
    color: ui.text,
    borderColor: "transparent",
    boxShadow: "none",
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFacilityId || !patientId || isLocked) return;

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
        price: t.price || 0,
        urgency: t.urgency || "routine",
        reason: t.reason,
        status: "ordered" as const,
      }));

    const cleanedDrugs = conDrugs
      .map((d) => ({ ...d, name: d.name ? d.name.trim() : "" }))
      .filter((d) => d.name.length > 0);

    const grandTotalPrice = handleGrandTotal();

    console.log("Submitting conDepartment value:", conDepartment);

    try {
      await dispatch(
        updateConsultation({
          facilityId: activeFacilityId,
          patientId,
          consultationId,
          payload: {
            title: conTitle,
            complaint: conComplaint,
            diagnosis: conDiagnosis || undefined,
            icdCode: conIcd || undefined,
            summary: conSummary || undefined,
            status: conStatus,
            department:
              conDepartment && conDepartment.trim() !== ""
                ? conDepartment
                : undefined,
            vitals: cleanedVitals,
            recommendedTests: cleanedTests.length ? cleanedTests : undefined,
            recommendedDrugs: cleanedDrugs.length ? cleanedDrugs : undefined,
            totalPrice: grandTotalPrice,
          },
        })
      ).unwrap();
      setIsEditing(false);
      dispatch(
        fetchConsultationbyId({
          facilityId: activeFacilityId,
          patientId,
          consultationId,
        })
      );
    } catch (err) {}
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeFacilityId || isLocked) return;

    setUploadingFiles(true);
    try {
      await dispatch(
        uploadConsultationAttachments({
          facilityId: activeFacilityId,
          patientId,
          consultationId,
          files,
        })
      ).unwrap();

      dispatch(
        fetchConsultationbyId({
          facilityId: activeFacilityId,
          patientId,
          consultationId,
        })
      );
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!activeFacilityId || !patientId || isLocked) return;
    try {
      await dispatch(
        removeConsultation({
          facilityId: activeFacilityId,
          patientId,
          consultationId,
        })
      ).unwrap();
      setShowDeleteModal(false);
      router.push(`/dashboard/consultations`);
    } catch (err) {
      setShowDeleteModal(false);
    }
  };

  const renderFormattedDetail = (detailText: string) => {
    if (!detailText) return null;

    if (detailText.includes("Changes: [") && detailText.includes("]")) {
      const introPart = detailText.split("Changes: [")[0];
      const changesBlock = detailText.split("Changes: [")[1]?.replace("]", "");

      const rawChanges = changesBlock
        ? changesBlock.split(/,\s*(?=[a-zA-Z]+:\s*")/g)
        : [];

      return (
        <div className="space-y-2">
          <p className="font-medium opacity-90">{introPart}</p>
          <div
            className="mt-2 space-y-1.5 pl-2 border-l-2"
            style={{ borderColor: PRIMARY_COLOR }}
          >
            <span className="text-[10px] font-bold uppercase opacity-60 tracking-wider block mb-1">
              Modified Fields:
            </span>
            {rawChanges.map((changeStr, idx) => {
              const parts = changeStr.split(/:\s*/);
              const fieldName = parts[0]?.trim();
              const transitionPart = parts.slice(1).join(": ");

              const values = transitionPart.split(" → ");
              const oldValue = values[0]?.trim();
              const newValue = values[1]?.trim();

              return (
                <div
                  key={idx}
                  className="flex flex-wrap items-center gap-1.5 text-[12px]"
                >
                  <span
                    className="font-semibold uppercase text-[10px] px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
                  >
                    {fieldName}
                  </span>
                  <span
                    className="line-through opacity-50 px-1 py-0.5 rounded"
                    style={{ backgroundColor: ui.inner }}
                  >
                    {oldValue || "—"}
                  </span>
                  <ArrowRight size={12} className="opacity-60 shrink-0" />
                  <span
                    className="font-semibold px-1 py-0.5 rounded"
                    style={{ backgroundColor: ui.inner, color: ui.text }}
                  >
                    {newValue || "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <span>
        {detailText.split(/(".*?")/).map((segment, idx) => {
          if (segment.startsWith('"') && segment.endsWith('"')) {
            return (
              <strong
                key={idx}
                className="font-semibold"
                style={{ color: ui.text }}
              >
                {segment}
              </strong>
            );
          }
          return <span key={idx}>{segment}</span>;
        })}
      </span>
    );
  };

  // --- CONDITIONAL RENDERS (AFTER ALL HOOKS) ---
  if (!consultation && !current) {
    return <DarkBlurOverlayLoader text="Loading consultation..." />;
  }

  if (!consultation) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-sm opacity-60">Consultation session not found.</p>
        <Link
          href="/dashboard/consultations"
          className="mt-4 inline-block text-xs font-semibold"
          style={{ color: PRIMARY_COLOR }}
        >
          Return to consultations
        </Link>
      </div>
    );
  }

  const attachments = consultation.attachments || [];

  return (
    <div className="mx-auto max-w-4xl px-3 sm:px-6 py-4 sm:py-6 w-full">
      <div className="space-y-6 w-full bg-transparent shadow-none">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs opacity-70 truncate pr-2">
            <Link
              href="/dashboard/consultations"
              className="hover:opacity-100 shrink-0"
            >
              Consultations
            </Link>
            <ChevronRight size={12} className="shrink-0" />
            <span className="font-semibold shrink-0 truncate">
              {consultation.title}
            </span>
          </div>
        </div>

        {/* 12-Hour Policy Guide Banner */}
        <div
          className="rounded-2xl p-4 text-xs flex items-start gap-3 border"
          style={{
            backgroundColor: isLocked
              ? "rgba(239,68,68,0.08)"
              : "rgba(59,130,246,0.08)",
            borderColor: isLocked
              ? "rgba(239,68,68,0.2)"
              : "rgba(59,130,246,0.2)",
            color: isLocked ? "#ef4444" : "#3b82f6",
          }}
        >
          {isLocked ? (
            <Lock size={16} className="shrink-0 mt-0.5" />
          ) : (
            <Calendar size={16} className="shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold">
              {isLocked
                ? "Consultation Locked (12-Hour Window Expired)"
                : "Consultation Editing & Deletion Window Active (12 Hours)"}
            </p>
            <p className="opacity-80 mt-0.5 leading-relaxed">
              {isLocked
                ? "More than 12 hours have elapsed since this consultation was recorded. Per facility compliance policy, records can no longer be edited or deleted."
                : "You can freely edit, attach files, or delete this consultation record within 12 hours of creation."}
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
              style={{ backgroundColor: ui.card, color: PRIMARY_COLOR }}
            >
              <Stethoscope size={24} />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-normal tracking-tight">
                  {consultation.title}
                </h1>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase"
                  style={{
                    backgroundColor:
                      consultation.status === "completed"
                        ? "rgba(16,185,129,0.15)"
                        : "rgba(59,130,246,0.15)",
                    color:
                      consultation.status === "completed"
                        ? "#059669"
                        : "#2563eb",
                  }}
                >
                  {consultation.status}
                </span>
              </div>
              <p className="text-xs opacity-60 flex items-center gap-2 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {consultation.consultedAt
                    ? new Date(consultation.consultedAt).toLocaleString()
                    : "—"}
                </span>
                {current &&
                  ` · Patient: ${current.firstName} ${current.lastName}`}
                {assignedDeptObj && (
                  <span className="inline-flex items-center gap-1 font-semibold">
                    · <Building2 size={11} /> {assignedDeptObj.name}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={isLocked}
              onClick={() => setIsEditing(!isEditing)}
              className="flex-1 sm:flex-none rounded-full px-5 py-2.5 text-xs font-semibold disabled:opacity-40"
              style={{ backgroundColor: ui.card }}
            >
              {isEditing ? "Cancel Edit" : "Edit Consultation"}
            </button>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => setShowDeleteModal(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition disabled:opacity-40"
              title="Delete consultation"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {isEditing && !isLocked ? (
          <form onSubmit={handleUpdate} className="space-y-6 text-xs">
            {/* Visit Information & Department */}
            <div
              className="rounded-xl p-5 sm:p-6 space-y-4"
              style={{ backgroundColor: ui.card, borderColor: ui.border }}
            >
              <h2 className="text-sm font-semibold">Edit Consultation Info</h2>

              <div>
                <CustomDropdown
                  label="Department *"
                  value={conDepartment}
                  options={departmentOptions}
                  onChange={(val) => setConDepartment(val)}
                  placeholder="Select consultation department..."
                  isDark={isDark}
                  colors={colors}
                  border={border}
                  searchable={true}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium opacity-80">
                  Summary Title *
                </label>
                <input
                  required
                  value={conTitle}
                  onChange={(e) => setConTitle(e.target.value)}
                  placeholder="e.g. General Clinical Evaluation"
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
                  placeholder="Describe patient's symptoms or visit reason..."
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
                    placeholder="Enter clinical diagnosis..."
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
                    placeholder="e.g. J02.9"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Vitals Snapshot */}
            <div
              className="rounded-xl p-5 sm:p-6 space-y-4"
              style={{ backgroundColor: ui.card, borderColor: ui.border }}
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

            {/* Recommended Lab Tests from Catalog */}
            <div
              className="rounded-xl p-5 sm:p-6 space-y-4"
              style={{ backgroundColor: ui.card, borderColor: ui.border }}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FlaskConical size={18} style={{ color: PRIMARY_COLOR }} />
                  <h2 className="text-sm font-semibold">
                    Recommended Lab Tests
                  </h2>
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
                          <span className="text-xs font-semibold">
                            {t.name}
                          </span>
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

            {/* Prescriptions & Drugs */}
            <div
              className="rounded-xl p-5 sm:p-6 space-y-4"
              style={{ backgroundColor: ui.card, borderColor: ui.border }}
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

            {/* Attachments Upload (while editing) */}
            <div
              className="rounded-xl p-5 sm:p-6 space-y-4"
              style={{ backgroundColor: ui.card, borderColor: ui.border }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Paperclip size={16} /> Attachments
                </h2>
                <label
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white cursor-pointer hover:opacity-90 transition"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  <Upload size={14} />
                  {uploadingFiles ? "Uploading..." : "Upload Files"}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadingFiles || isLocked}
                  />
                </label>
              </div>

              {attachments.length === 0 ? (
                <div
                  className="rounded-2xl p-6 text-center text-xs opacity-50 border border-dashed"
                  style={{ borderColor: ui.border }}
                >
                  No attachments yet. You can upload images or PDFs.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map((file: any, idx: number) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-2xl border hover:opacity-90 transition"
                      style={{
                        backgroundColor: ui.inner,
                        borderColor: ui.border,
                      }}
                    >
                      {file.mimeType?.startsWith("image/") ? (
                        <ImageIcon size={20} style={{ color: PRIMARY_COLOR }} />
                      ) : (
                        <FileText size={20} style={{ color: PRIMARY_COLOR }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-[10px] opacity-50">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <ExternalLink size={14} className="opacity-50 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Notes & Status */}
            <div
              className="rounded-xl p-5 sm:p-6 space-y-4"
              style={{ backgroundColor: ui.card, borderColor: ui.border }}
            >
              <h2 className="text-sm font-semibold">Notes & Status</h2>
              <div>
                <label className="mb-1.5 block text-xs font-medium opacity-80">
                  Summary Notes
                </label>
                <textarea
                  rows={3}
                  value={conSummary}
                  onChange={(e) => setConSummary(e.target.value)}
                  placeholder="Enter summary or notes..."
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

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-full sm:w-auto rounded-full px-6 py-3 text-xs font-semibold"
                style={{ backgroundColor: ui.card }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto rounded-full px-6 py-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div
              className="rounded-xl p-5 sm:p-6 space-y-4 text-xs"
              style={{ backgroundColor: ui.card, borderColor: ui.border }}
            >
              {assignedDeptObj && (
                <div
                  className="flex items-center gap-2 pb-2 border-b"
                  style={{ borderColor: ui.inner }}
                >
                  <Building2 size={14} style={{ color: PRIMARY_COLOR }} />
                  <span className="font-semibold">Department:</span>
                  <span>
                    {assignedDeptObj.name}{" "}
                    {assignedDeptObj.code ? `(${assignedDeptObj.code})` : ""}
                  </span>
                </div>
              )}
              <div>
                <span className="font-semibold opacity-60">
                  Chief Complaint:
                </span>
                <p className="mt-1 text-sm">{consultation.complaint}</p>
              </div>
              {consultation.diagnosis && (
                <div>
                  <span className="font-semibold opacity-60">Diagnosis:</span>
                  <p className="mt-1 text-sm">
                    {consultation.diagnosis}{" "}
                    {consultation.icdCode && `(ICD: ${consultation.icdCode})`}
                  </p>
                </div>
              )}
              {consultation.summary && (
                <div>
                  <span className="font-semibold opacity-60">Summary:</span>
                  <p className="mt-1 text-sm">{consultation.summary}</p>
                </div>
              )}
            </div>

            {consultation.vitals && (
              <div
                className="rounded-xl p-5 sm:p-6 space-y-4 text-xs"
                style={{ backgroundColor: ui.card, borderColor: ui.border }}
              >
                <h3 className="text-sm font-semibold">Visit Vitals Snapshot</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {consultation.vitals.temperatureC != null && (
                    <div
                      className="rounded-xl p-3 text-xs"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <span className="opacity-60 block text-[10px]">
                        Temperature
                      </span>
                      <span className="font-medium">
                        {consultation.vitals.temperatureC}°C
                      </span>
                    </div>
                  )}
                  {consultation.vitals.spo2 != null && (
                    <div
                      className="rounded-xl p-3 text-xs"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <span className="opacity-60 block text-[10px]">SpO2</span>
                      <span className="font-medium">
                        {consultation.vitals.spo2}%
                      </span>
                    </div>
                  )}
                  {consultation.vitals.pulse != null && (
                    <div
                      className="rounded-xl p-3 text-xs"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <span className="opacity-60 block text-[10px]">
                        Pulse
                      </span>
                      <span className="font-medium">
                        {consultation.vitals.pulse} bpm
                      </span>
                    </div>
                  )}
                  {consultation.vitals.bpSystolic != null && (
                    <div
                      className="rounded-xl p-3 text-xs"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <span className="opacity-60 block text-[10px]">BP</span>
                      <span className="font-medium">
                        {consultation.vitals.bpSystolic}/
                        {consultation.vitals.bpDiastolic ?? "—"} mmHg
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {consultation.recommendedTests?.length > 0 && (
                <div
                  className="rounded-xl p-5 sm:p-6 space-y-4 text-xs"
                  style={{ backgroundColor: ui.card, borderColor: ui.border }}
                >
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <ClipboardList size={16} /> Recommended Tests
                  </h3>
                  <ul className="space-y-2 text-xs">
                    {consultation.recommendedTests.map((t: any, i: number) => (
                      <li
                        key={i}
                        className="flex justify-between items-center py-1 border-b last:border-0"
                        style={{ borderColor: ui.inner }}
                      >
                        <div>
                          <span className="font-medium">• {t.name}</span>
                          {t.price != null && (
                            <span className="block text-[11px] text-emerald-600 font-semibold pl-3">
                              ₦{t.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {t.urgency && (
                          <span
                            className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase"
                            style={{ backgroundColor: ui.inner }}
                          >
                            {t.urgency}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {consultation.totalPrice != null &&
                    consultation.totalPrice > 0 && (
                      <div
                        className="flex items-center justify-between rounded-xl p-3 font-bold text-xs mt-3"
                        style={{ backgroundColor: ui.inner }}
                      >
                        <span>Total Cost:</span>
                        <span className="text-emerald-600">
                          ₦{consultation.totalPrice.toLocaleString()}
                        </span>
                      </div>
                    )}
                </div>
              )}

              {consultation.recommendedDrugs?.length > 0 && (
                <div
                  className="rounded-xl p-5 sm:p-6 space-y-4 text-xs"
                  style={{ backgroundColor: ui.card, borderColor: ui.border }}
                >
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <Pill size={16} /> Prescriptions
                  </h3>
                  <ul className="space-y-2 text-xs">
                    {consultation.recommendedDrugs.map((d: any, i: number) => (
                      <li
                        key={i}
                        className="space-y-1 py-1.5 border-b last:border-0"
                        style={{ borderColor: ui.inner }}
                      >
                        <div className="font-semibold">
                          {d.name} {d.dosage && `(${d.dosage})`}
                        </div>
                        {(d.frequency || d.duration) && (
                          <div className="text-[11px] opacity-65">
                            {d.frequency || ""}{" "}
                            {d.duration ? `for ${d.duration}` : ""}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Attachments View */}
            <div
              className="rounded-xl p-5 sm:p-6 space-y-4"
              style={{ backgroundColor: ui.card, borderColor: ui.border }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Paperclip size={16} /> Attachments
                </h3>

                {!isLocked && (
                  <label
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white cursor-pointer hover:opacity-90 transition"
                    style={{ backgroundColor: PRIMARY_COLOR }}
                  >
                    <Upload size={14} />
                    {uploadingFiles ? "Uploading..." : "Add Files"}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadingFiles}
                    />
                  </label>
                )}
              </div>

              {attachments.length === 0 ? (
                <div
                  className="rounded-2xl p-6 text-center text-xs opacity-50 border border-dashed"
                  style={{ borderColor: ui.border }}
                >
                  No attachments uploaded for this consultation.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map((file: any, idx: number) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-2xl border hover:opacity-90 transition"
                      style={{
                        backgroundColor: ui.inner,
                        borderColor: ui.border,
                      }}
                    >
                      {file.mimeType?.startsWith("image/") ? (
                        <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 bg-black/5">
                          <img
                            src={file.url}
                            alt={file.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${PRIMARY_COLOR}15` }}
                        >
                          <FileText
                            size={20}
                            style={{ color: PRIMARY_COLOR }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-[10px] opacity-50">
                          {(file.size / 1024).toFixed(1)} KB •{" "}
                          {file.uploadedAt
                            ? new Date(file.uploadedAt).toLocaleDateString()
                            : ""}
                        </p>
                      </div>
                      <ExternalLink size={14} className="opacity-50 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Trail Section */}
            <div
              className="space-y-4 pt-2 border-t"
              style={{ borderColor: border }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <History size={16} style={{ color: PRIMARY_COLOR }} />{" "}
                  Consultation Audit Trail
                </h3>
                <span className="text-[11px] opacity-50">
                  {consultationLogs.length} event
                  {consultationLogs.length === 1 ? "" : "s"} recorded
                </span>
              </div>

              {consultationLogs.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-current before:opacity-15">
                  {consultationLogs.map((log: any, i: number) => {
                    const author =
                      typeof log.by === "object" && log.by !== null
                        ? `${log.by.firstName || ""} ${
                            log.by.lastName || ""
                          }`.trim() || log.by.email
                        : "System User";

                    const formattedTimestamp = log.at
                      ? new Date(log.at).toLocaleString("en-US", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—";

                    return (
                      <div key={i} className="relative group">
                        <span
                          className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                          style={{
                            backgroundColor: ui.inner,
                            color: PRIMARY_COLOR,
                            border: `1px solid ${border}`,
                          }}
                        >
                          <Clock size={10} />
                        </span>

                        <div
                          className="rounded-2xl p-4 text-xs space-y-2 border transition hover:border-current/25"
                          style={{
                            backgroundColor: ui.card,
                            borderColor: border,
                          }}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span
                              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                              style={{
                                backgroundColor: `${PRIMARY_COLOR}18`,
                                color: PRIMARY_COLOR,
                              }}
                            >
                              {log.action || "Update"}
                            </span>
                            <span className="text-[11px] opacity-50 flex items-center gap-1">
                              <Calendar size={11} />
                              {formattedTimestamp}
                            </span>
                          </div>

                          <div className="opacity-95 leading-relaxed font-normal text-[13px]">
                            {renderFormattedDetail(
                              log.detail || log.description
                            )}
                          </div>

                          {author && (
                            <div className="flex items-center gap-1.5 pt-1 text-[11px] opacity-60">
                              <UserCheck size={12} />
                              <span>
                                By{" "}
                                <strong className="font-semibold">
                                  {author}
                                </strong>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="rounded-2xl p-6 text-center text-xs opacity-50 italic border border-dashed"
                  style={{ borderColor: border }}
                >
                  No logged updates or modification events recorded for this
                  consultation yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm rounded-[28px] p-6 space-y-5"
            style={{ backgroundColor: ui.card, color: ui.text }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: "rgba(239,68,68,0.15)",
                  color: "#ef4444",
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold">Delete Consultation?</h3>
                <p className="text-xs leading-relaxed opacity-75">
                  Are you sure you want to permanently delete &ldquo;
                  {consultation.title}&rdquo;? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-full px-5 py-2.5 text-xs font-semibold"
                style={{ backgroundColor: ui.inner }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="rounded-full px-5 py-2.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition"
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
