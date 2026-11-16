"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "@/components/access/guarded-link";
import {
  UserCheck,
  Plus,
  ChevronRight,
  ChevronDown,
  Check,
  Search,
  Loader2,
  CalendarDays,
  IdCard,
  Flag,
  History,
  MessageSquareText,
  X,
  Info,
  Save,
  Upload,
  FileText,
  ExternalLink,
  Stethoscope,
  Paperclip,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchLabRequestDetail,
  updateRequestAssignment,
  addLabRequestNote,
  updateTestResult,
  fetchFacilityMembers,
  uploadTestResultFiles,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import {
  CustomDropdown,
  UserAvatar,
  ConfirmModal,
  ToggleSwitch,
} from "@/components/ui/items";
import SpecimenBarcode from "@/components/ui/SpecimenBarcode";
import { useFacilityId } from "@/hooks/useFacilityId";
import { useToast } from "@/contexts/toast-context";

import { Can } from "@/components/access/can";
const TEST_STATUS_OPTIONS = [
  { label: "Ordered", value: "ordered" },
  { label: "Collecting Sample", value: "collecting_sample" },
  { label: "Collected", value: "collected" },
  { label: "Processing", value: "processing" },
  { label: "Resulted", value: "resulted" },
  { label: "Verified", value: "verified" },
  { label: "Cancelled", value: "cancelled" },
];

function CustomSearchableStaffDropdown({
  label,
  value,
  members,
  onChange,
  placeholder = "Select assigned staff...",
  isDark,
  colors,
  border,
}: {
  label?: string;
  value: string;
  members: any[];
  onChange: (val: string) => void;
  placeholder?: string;
  isDark: boolean;
  colors: any;
  border: string;
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

  const filteredMembers = members.filter((m) => {
    const fullName = `${m.firstName || ""} ${m.lastName || ""}`.toLowerCase();
    const email = (m.email || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const selectedMember = members.find((m) => m.id === value || m._id === value);

  return (
    <div className="relative flex flex-col gap-1.5" ref={dropdownRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold opacity-70">{label}</label>
          <span className="text-[10px] opacity-40">Choose staff in charge</span>
        </div>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-xs transition focus:outline-none min-h-[44px] hover:opacity-90"
        style={{
          backgroundColor: colors.shadeBgSecond || "transparent",
          color: colors.text,
          borderColor: isOpen ? PRIMARY_COLOR : border,
        }}
      >
        <div className="flex items-center gap-2 truncate py-0.5">
          {selectedMember ? (
            <div className="flex items-center gap-2">
              <UserAvatar user={selectedMember} size="sm" />
              <span className="text-xs font-semibold capitalize">
                {selectedMember.firstName} {selectedMember.lastName}
              </span>
            </div>
          ) : (
            <span className="text-xs opacity-40">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 opacity-60 transition-transform shrink-0 ml-2 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div
          className={`absolute top-full left-0 z-[9999] mt-2 w-full min-w-[16rem] overflow-hidden rounded-2xl border ${
            isDark ? "border-white/20 bg-[#1e1e1e]" : "border-black/15 bg-white"
          }`}
        >
          <div
            className={`flex items-center gap-2 border-b px-3 py-2.5 ${
              isDark ? "border-white/10" : "border-black/10"
            }`}
          >
            <Search size={14} className="opacity-50 shrink-0" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name or email..."
              className="w-full bg-transparent text-xs outline-none"
              style={{ color: colors.text }}
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5">
            {filteredMembers.length === 0 ? (
              <div className="p-4 text-center text-xs opacity-50">
                No staff found matching search
              </div>
            ) : (
              filteredMembers.map((m) => {
                const memberId = m.id || m._id;
                const isSelected = value === memberId;
                const mName =
                  `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email;
                return (
                  <button
                    key={memberId}
                    type="button"
                    onClick={() => {
                      onChange(memberId);
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:opacity-80"
                    style={{
                      backgroundColor: isSelected
                        ? isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.05)"
                        : "transparent",
                    }}
                  >
                    <UserAvatar user={m} size="md" />
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-xs font-bold truncate capitalize"
                        style={{ color: colors.text }}
                      >
                        {mName}
                      </p>
                      <p className="text-[10px] opacity-50 truncate">
                        {m.email}
                      </p>
                    </div>
                    {isSelected && (
                      <Check
                        className="h-3.5 w-3.5 shrink-0 ml-auto"
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

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 opacity-40 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] opacity-50">{label}</p>
        <p className="text-sm font-semibold truncate capitalize">{value}</p>
      </div>
    </div>
  );
}

function ClinicalNoteDetailModal({
  note,
  onClose,
  ui,
  isDark,
}: {
  note: any | null;
  onClose: () => void;
  ui: any;
  isDark: boolean;
}) {
  if (!note) return null;

  const authorName = note.author
    ? `${note.author.firstName || ""} ${note.author.lastName || ""}`.trim()
    : "Unknown Staff";

  const authorEmail = note.author?.email || "—";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-[28px] border overflow-hidden"
        style={{
          backgroundColor: ui.card,
          borderColor: ui.border,
          color: ui.text,
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: ui.border }}
        >
          <div className="flex items-center gap-2.5">
            <MessageSquareText size={16} style={{ color: PRIMARY_COLOR }} />
            <h3 className="text-sm font-bold">Clinical Note Details</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:opacity-70 transition"
            style={{ backgroundColor: ui.inner }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div
            className="flex items-center gap-3 rounded-2xl p-3.5 border"
            style={{ backgroundColor: ui.inner, borderColor: ui.border }}
          >
            {note.author ? (
              <UserAvatar user={note.author} size="md" />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                ?
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] opacity-50">Responsible Staff</p>
              <p className="text-sm font-semibold capitalize truncate">
                {authorName}
              </p>
              <p className="text-[11px] opacity-60 truncate">{authorEmail}</p>
            </div>
          </div>

          <div>
            <p className="text-[11px] opacity-50 mb-1">Recorded At</p>
            <p className="text-sm font-semibold">
              {new Date(note.createdAt).toLocaleString([], {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div>
            <p className="text-[11px] opacity-50 mb-1.5">Observation</p>
            <div
              className="rounded-2xl p-4 text-sm leading-relaxed border-l-4"
              style={{
                backgroundColor: ui.inner,
                borderLeftColor: PRIMARY_COLOR,
              }}
            >
              {note.text}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsultationDetailModal({
  consultation,
  onClose,
  ui,
  isDark,
}: {
  consultation: any | null;
  onClose: () => void;
  ui: any;
  isDark: boolean;
}) {
  if (!consultation) return null;

  const attachments = consultation.attachments || [];
  const recommendedTests = consultation.recommendedTests || [];
  const allergies = consultation.allergies || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[32px] border overflow-hidden shadow-2xl"
        style={{
          backgroundColor: ui.card,
          borderColor: ui.border,
          color: ui.text,
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: ui.border }}
        >
          <div className="flex items-center gap-2.5">
            <Stethoscope size={18} style={{ color: PRIMARY_COLOR }} />
            <div>
              <h3 className="text-base font-bold">
                {consultation.title || "Consultation Details"}
              </h3>
              <p className="text-[11px] opacity-50">
                Consulted on{" "}
                {new Date(consultation.consultedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:opacity-70 transition"
            style={{ backgroundColor: ui.inner }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className="rounded-2xl p-4 border space-y-1"
              style={{ backgroundColor: ui.inner, borderColor: ui.border }}
            >
              <p className="text-[11px] opacity-50">Chief Complaint</p>
              <p className="text-sm font-semibold">
                {consultation.complaint || "None specified"}
              </p>
            </div>
            <div
              className="rounded-2xl p-4 border space-y-1"
              style={{ backgroundColor: ui.inner, borderColor: ui.border }}
            >
              <p className="text-[11px] opacity-50">Diagnosis & ICD Code</p>
              <p className="text-sm font-semibold">
                {consultation.diagnosis || "N/A"}{" "}
                {consultation.icdCode ? `(${consultation.icdCode})` : ""}
              </p>
            </div>
          </div>

          {/* Vitals if present */}
          {consultation.vitals && (
            <div
              className="rounded-2xl p-4 border space-y-3"
              style={{ backgroundColor: ui.inner, borderColor: ui.border }}
            >
              <p className="text-xs font-bold">Recorded Vitals</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="opacity-50 block">Temp</span>
                  <span className="font-semibold">
                    {consultation.vitals.temperatureC ?? "—"}°C
                  </span>
                </div>
                <div>
                  <span className="opacity-50 block">Pulse</span>
                  <span className="font-semibold">
                    {consultation.vitals.pulse ?? "—"} bpm
                  </span>
                </div>
                <div>
                  <span className="opacity-50 block">BP</span>
                  <span className="font-semibold">
                    {consultation.vitals.bpSystolic ?? "—"}/
                    {consultation.vitals.bpDiastolic ?? "—"}
                  </span>
                </div>
                <div>
                  <span className="opacity-50 block">SpO2</span>
                  <span className="font-semibold">
                    {consultation.vitals.spo2 ?? "—"}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Tests */}
          {recommendedTests.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold opacity-70">Recommended Tests</p>
              <div className="space-y-2">
                {recommendedTests.map((t: any, idx: number) => (
                  <div
                    key={t._id || idx}
                    className="flex items-center justify-between rounded-xl p-3 border text-xs"
                    style={{
                      backgroundColor: ui.inner,
                      borderColor: ui.border,
                    }}
                  >
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-[10px] opacity-50 uppercase">
                        Code: {t.code || "CUSTOM"} · Urgency: {t.urgency}
                      </p>
                    </div>
                    <span className="rounded-lg px-2 py-1 text-[10px] font-semibold bg-primary/10 text-primary">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments Section */}
          <div
            className="rounded-2xl p-4 border space-y-3"
            style={{ backgroundColor: ui.inner, borderColor: ui.border }}
          >
            <div className="flex items-center gap-2">
              <Paperclip size={16} style={{ color: PRIMARY_COLOR }} />
              <p className="text-xs font-bold">
                Consultation Attachments ({attachments.length})
              </p>
            </div>

            {attachments.length === 0 ? (
              <p className="text-xs opacity-50 text-center py-2">
                No attachments uploaded for this consultation.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {attachments.map((att: any, aIdx: number) => {
                  const attName = typeof att === "string" ? att : att.name;
                  const attUrl = typeof att === "string" ? att : att.url;
                  const attSize = typeof att === "string" ? 0 : att.size;
                  const attMime = typeof att === "string" ? "" : att.mimeType;

                  return (
                    <div
                      key={att._id || aIdx}
                      className="flex items-center justify-between gap-3 rounded-xl p-2.5 border bg-card"
                      style={{ borderColor: ui.border }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {attMime?.startsWith("image/") ? (
                          <img
                            src={attUrl}
                            alt={attName}
                            className="h-9 w-9 rounded-lg object-cover border shrink-0"
                            style={{ borderColor: ui.border }}
                          />
                        ) : (
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                            style={{
                              backgroundColor: `${PRIMARY_COLOR}15`,
                              color: PRIMARY_COLOR,
                            }}
                          >
                            <FileText size={16} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">
                            {attName}
                          </p>
                          <p className="text-[10px] opacity-50">
                            {(attSize ? (attSize / 1024).toFixed(1) : "0") +
                              " KB"}
                          </p>
                        </div>
                      </div>
                      <a
                        href={attUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:opacity-70 transition shrink-0 bg-secondary"
                        title="View file"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TestResultCard({
  test,
  facilityId,
  requestId,
  ui,
  isDark,
  colors,
  border,
  hairline,
  inputClass,
  inputStyle,
}: {
  test: any;
  facilityId: string;
  requestId: string;
  ui: any;
  isDark: boolean;
  colors: any;
  border: string;
  hairline: string;
  inputClass: string;
  inputStyle: React.CSSProperties;
}) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const catalogItem =
    typeof test.catalogId === "object" && test.catalogId !== null
      ? test.catalogId
      : null;

  const testCode = catalogItem?.code || test.code || "LAB";
  const testName = catalogItem?.name || test.name || "Unnamed Test";
  const testCategory = catalogItem?.category || test.category;
  const defaultKeys: string[] = catalogItem?.defaultKeys || [];

  const [status, setStatus] = useState(test.status || "ordered");
  const [isAbnormal, setIsAbnormal] = useState(!!test.isAbnormal);
  const [specialNotes, setSpecialNotes] = useState(test.specialNotes || "");
  const [metadataValues, setMetadataValues] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};
      if (test.metadata && Array.isArray(test.metadata)) {
        test.metadata.forEach((m: any) => {
          if (m.key) initial[m.key] = m.value || "";
        });
      }
      return initial;
    },
  );
  const [savingTest, setSavingTest] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    setStatus(test.status || "ordered");
    setIsAbnormal(!!test.isAbnormal);
    setSpecialNotes(test.specialNotes || "");
    const updatedMeta: Record<string, string> = {};
    if (test.metadata && Array.isArray(test.metadata)) {
      test.metadata.forEach((m: any) => {
        if (m.key) updatedMeta[m.key] = m.value || "";
      });
    }
    setMetadataValues(updatedMeta);
  }, [test]);

  const handleSaveTestChanges = async () => {
    try {
      setSavingTest(true);
      const formattedMetadata = Object.entries(metadataValues).map(
        ([key, value]) => ({ key, value }),
      );

      await dispatch(
        updateTestResult({
          facilityId,
          requestId,
          testId: test._id,
          payload: {
            status,
            isAbnormal,
            specialNotes,
            metadata: formattedMetadata,
          },
        }),
      ).unwrap();
      showToast(`${testName} results saved successfully!`, "success");
    } catch (err: any) {
      showToast(err || "Failed to update test results.", "error");
    } finally {
      setSavingTest(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    try {
      setUploadingFiles(true);
      await dispatch(
        uploadTestResultFiles({
          facilityId,
          requestId,
          testId: test._id,
          files: fileArray,
        }),
      ).unwrap();
      showToast("Result file(s) uploaded successfully!", "success");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      showToast(err || "Failed to upload result files.", "error");
    } finally {
      setUploadingFiles(false);
    }
  };

  return (
    <div
      className="rounded-[28px] border overflow-hidden"
      style={{
        backgroundColor: ui.card,
        borderColor: isAbnormal ? "rgba(239,68,68,0.45)" : hairline,
      }}
    >
      <div className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="rounded-lg px-2 py-0.5 text-[11px] font-bold"
                style={{
                  backgroundColor: `${PRIMARY_COLOR}1a`,
                  color: PRIMARY_COLOR,
                }}
              >
                {testCode}
              </span>
              <h3 className="text-sm font-semibold">{testName}</h3>
              {testCategory && (
                <span
                  className="rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    backgroundColor: ui.inner,
                    color: ui.text,
                    opacity: 0.7,
                  }}
                >
                  {testCategory}
                </span>
              )}
              {isAbnormal && (
                <span
                  className="rounded-lg px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.12)",
                    color: "#dc2626",
                  }}
                >
                  Abnormal
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <span
                className="rounded-full px-2.5 py-1 border"
                style={{
                  backgroundColor: ui.inner,
                  borderColor: hairline,
                }}
              >
                <span className="opacity-50">Specimen: </span>
                <span className="font-semibold">
                  {test.specimenType || catalogItem?.specimenType || "General"}
                </span>
              </span>
              {defaultKeys.length > 0 && (
                <span
                  className="rounded-full px-2.5 py-1 border"
                  style={{
                    backgroundColor: ui.inner,
                    borderColor: hairline,
                  }}
                >
                  <span className="opacity-50">Default Keys: </span>
                  <span className="font-semibold">
                    {defaultKeys.join(", ")}
                  </span>
                </span>
              )}
            </div>
          </div>

          <div className="w-full sm:w-44 shrink-0">
            <label className="text-[10px] font-medium opacity-60 block mb-1">
              Workflow Status
            </label>
            <CustomDropdown
              value={status}
              options={TEST_STATUS_OPTIONS}
              onChange={(val) => setStatus(val)}
              isDark={isDark}
              colors={colors}
              border={border}
            />
          </div>
        </div>

        {defaultKeys.length > 0 ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold opacity-70">
                Test Parameters & Readings
              </p>
              <span className="text-[10px] opacity-40">
                Configured keys: {defaultKeys.join(", ")}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {defaultKeys.map((keyName: string, kIndex: number) => (
                <div
                  key={kIndex}
                  className="rounded-2xl p-3.5 border space-y-1.5"
                  style={{
                    backgroundColor: ui.inner,
                    borderColor: hairline,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      {keyName}
                    </label>
                    <span className="text-[10px] opacity-40">
                      Reading Value
                    </span>
                  </div>
                  <input
                    type="text"
                    value={metadataValues[keyName] || ""}
                    onChange={(e) =>
                      setMetadataValues({
                        ...metadataValues,
                        [keyName]: e.target.value,
                      })
                    }
                    placeholder={`Enter ${keyName} result...`}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div className="sm:col-span-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-medium opacity-60">
                  Result Value
                </label>
                <span className="text-[10px] opacity-40">
                  e.g. 5.4, Positive
                </span>
              </div>
              <input
                type="text"
                value={metadataValues["resultValue"] || test.resultValue || ""}
                onChange={(e) =>
                  setMetadataValues({
                    ...metadataValues,
                    resultValue: e.target.value,
                  })
                }
                placeholder="Enter quantitative or qualitative result..."
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-medium opacity-60">
                  Units
                </label>
                <span className="text-[10px] opacity-40">g/dL</span>
              </div>
              <input
                type="text"
                value={metadataValues["resultUnit"] || test.resultUnit || ""}
                onChange={(e) =>
                  setMetadataValues({
                    ...metadataValues,
                    resultUnit: e.target.value,
                  })
                }
                placeholder="Unit..."
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium opacity-60">
            Special Notes / Lab Remarks
          </label>
          <textarea
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            placeholder="Add any specific lab notes, comments or sample remarks..."
            rows={2}
            className="w-full rounded-2xl p-3.5 text-xs outline-none resize-none border transition focus:border-current"
            style={inputStyle}
          />
        </div>

        <div
          className="rounded-2xl p-4 border space-y-3"
          style={{ backgroundColor: ui.inner, borderColor: hairline }}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs font-semibold">Result Files & Scans</p>
              <p className="text-[10px] opacity-50">
                Upload PDFs, test printouts or photos (up to 10 files, 10MB
                each)
              </p>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="application/pdf,image/*"
                className="hidden"
              />
              <Can perm="labs.write">
                <button
                  type="button"
                  disabled={uploadingFiles}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  {uploadingFiles ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Upload size={13} />
                  )}
                  Upload Photos / Files
                </button>
              </Can>
            </div>
          </div>

          {test.resultFiles && test.resultFiles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {test.resultFiles.map((file: any, fIdx: number) => (
                <div
                  key={file._id || fIdx}
                  className="flex items-center justify-between gap-3 rounded-xl p-2.5 border"
                  style={{ backgroundColor: ui.card, borderColor: border }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {file.mimeType?.startsWith("image/") ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="h-9 w-9 rounded-lg object-cover border shrink-0"
                        style={{ borderColor: hairline }}
                      />
                    ) : (
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                        style={{
                          backgroundColor: `${PRIMARY_COLOR}15`,
                          color: PRIMARY_COLOR,
                        }}
                      >
                        <FileText size={16} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p
                        className="text-xs font-semibold truncate"
                        style={{ color: ui.text }}
                      >
                        {file.name}
                      </p>
                      <p className="text-[10px] opacity-50">
                        {(file.size ? (file.size / 1024).toFixed(1) : "0") +
                          " KB"}{" "}
                        · {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:opacity-70 transition shrink-0"
                    style={{ backgroundColor: ui.inner }}
                    title="View file"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t"
          style={{ borderColor: hairline }}
        >
          <div
            className="rounded-2xl px-4 py-2 border w-full sm:w-auto"
            style={{
              backgroundColor: isAbnormal ? "rgba(239,68,68,0.08)" : ui.inner,
              borderColor: isAbnormal ? "rgba(239,68,68,0.3)" : border,
            }}
          >
            <ToggleSwitch
              checked={isAbnormal}
              onChange={(checked) => setIsAbnormal(checked)}
              label="Flag as abnormal"
              description="Toggle if value is outside limits"
            />
          </div>

          <Can perm="labs.write">
            <button
              type="button"
              disabled={savingTest}
              onClick={handleSaveTestChanges}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl px-6 py-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 shrink-0"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              {savingTest ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save Changes
            </button>
          </Can>
        </div>
      </div>
    </div>
  );
}

export default function LabRequestDetailPage() {
  const params = useParams();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const hairline = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const ui = {
    isDark,
    page: colors.bg,
    card: colors.shadeBg,
    inner: colors.shadeBgSecond,
    text: colors.text,
    border,
  };

  const requestId = String(params.requestId || "");
  const { facilityId, members, facilitiesLoading } = useFacilityId();
  const { activeRequest, detailLoading, saving } = useAppSelector(
    (s) => s.labs,
  );

  const [newNoteText, setNewNoteText] = useState("");
  const [assignedStaffId, setAssignedStaffId] = useState("");
  const [confirmAssignState, setConfirmAssignState] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<any | null>(
    null,
  );

  useEffect(() => {
    if (facilityId) {
      dispatch(fetchFacilityMembers(facilityId));
    }
  }, [dispatch, facilityId]);

  useEffect(() => {
    if (facilityId && requestId) {
      dispatch(fetchLabRequestDetail({ facilityId, requestId }));
    }
  }, [dispatch, facilityId, requestId]);

  useEffect(() => {
    if (activeRequest) {
      const assigned =
        typeof activeRequest.assignedTo === "object" &&
        activeRequest.assignedTo !== null
          ? (activeRequest.assignedTo as any)._id ||
            (activeRequest.assignedTo as any).id
          : activeRequest.assignedTo || "";
      setAssignedStaffId(assigned);
    }
  }, [activeRequest]);

  if (facilitiesLoading || detailLoading || !activeRequest) {
    return <DarkBlurOverlayLoader text="Loading lab request details..." />;
  }

  const patient =
    typeof activeRequest.patient === "object" && activeRequest.patient !== null
      ? activeRequest.patient
      : null;

  const patientName = patient
    ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim()
    : "Patient Record";

  const initials = patient
    ? `${(patient.firstName || "?")[0]}${
        (patient.lastName || "")[0] || ""
      }`.toUpperCase()
    : "PR";

  const specimenCode =
    (activeRequest as any).specimenCode ||
    (activeRequest as any).barcode ||
    (activeRequest.specimenIds && activeRequest.specimenIds.length > 0
      ? typeof activeRequest.specimenIds[0] === "object"
        ? (activeRequest.specimenIds[0] as any).barcode ||
          (activeRequest.specimenIds[0] as any).code
        : activeRequest.specimenIds[0]
      : null) ||
    "SP-20261025-ABCD";

  const handleUpdateAssignment = async () => {
    try {
      setActionLoading(true);
      await dispatch(
        updateRequestAssignment({
          facilityId,
          requestId,
          assignedTo: assignedStaffId || undefined,
        }),
      ).unwrap();
      showToast("Staff assignment updated successfully!", "success");
    } catch (err: any) {
      showToast(err || "Failed to update staff assignment.", "error");
    } finally {
      setActionLoading(false);
      setConfirmAssignState(null);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    try {
      setActionLoading(true);
      await dispatch(
        addLabRequestNote({ facilityId, requestId, text: newNoteText }),
      ).unwrap();
      setNewNoteText("");
      showToast("Clinical note added successfully!", "success");
    } catch (err: any) {
      showToast(err || "Failed to add clinical note.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const selectedStaffMember = members.find(
    (m: any) => (m.id || m._id) === assignedStaffId,
  );

  const staffName = selectedStaffMember
    ? `${selectedStaffMember.firstName || ""} ${
        selectedStaffMember.lastName || ""
      }`.trim()
    : "this staff member";

  const promptAssignmentConfirmation = () => {
    setConfirmAssignState({
      title: "Confirm Staff Assignment",
      message: `Are you sure you want to assign ${staffName} to manage sample collection and processing for this lab request?`,
      confirmLabel: "Yes, Assign",
      tone: "primary",
      onConfirm: handleUpdateAssignment,
    });
  };

  const isPendingCollection =
    activeRequest.status === "ordered" ||
    activeRequest.status === "collecting_sample" ||
    !activeRequest.sampleCollected;

  const sampleAccent = isPendingCollection ? "#d97706" : "#059669";
  const sampleTint = isPendingCollection
    ? "rgba(245,158,11,0.12)"
    : "rgba(16,185,129,0.12)";

  const inputClass =
    "w-full rounded-2xl px-3.5 py-2.5 text-xs outline-none border transition focus:border-current";
  const inputStyle: React.CSSProperties = {
    backgroundColor: ui.inner,
    color: ui.text,
    borderColor: ui.border,
  };

  const isSystemLogText = (txt: string) => {
    const lower = (txt || "").toLowerCase();
    return (
      lower.includes("updated test") ||
      lower.includes("status updated") ||
      lower.includes("request assigned") ||
      lower.includes("specimen collected") ||
      lower.includes("lab request created") ||
      lower.includes("uploaded result file")
    );
  };

  const auditList = (activeRequest.notesList || []).filter(
    (n: any) =>
      n.isSystemAudit === true ||
      (n.isSystemAudit === undefined && isSystemLogText(n.text)),
  );

  const clinicalNotesList = (activeRequest.notesList || []).filter(
    (n: any) =>
      n.isSystemAudit === false ||
      (n.isSystemAudit === undefined && !isSystemLogText(n.text)),
  );

  return (
    <div
      className="mx-auto max-w-none px-3 sm:px-6 py-6 space-y-6 relative"
      style={{ color: ui.text }}
    >
      {actionLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-50 flex items-center justify-center">
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-2xl border"
            style={{ backgroundColor: ui.card, borderColor: ui.border }}
          >
            <Loader2
              className="animate-spin h-5 w-5"
              style={{ color: PRIMARY_COLOR }}
            />
            <span className="text-xs font-semibold">Updating changes...</span>
          </div>
        </div>
      )}

      <ConfirmModal
        state={confirmAssignState}
        busy={saving || actionLoading}
        onCancel={() => setConfirmAssignState(null)}
        onConfirm={handleUpdateAssignment}
        ui={ui}
      />

      <ClinicalNoteDetailModal
        note={selectedNote}
        onClose={() => setSelectedNote(null)}
        ui={ui}
        isDark={isDark}
      />

      <ConsultationDetailModal
        consultation={selectedConsultation}
        onClose={() => setSelectedConsultation(null)}
        ui={ui}
        isDark={isDark}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs opacity-70">
        <Link
          href={`/dashboard/labs`}
          className="hover:opacity-100 font-medium transition"
        >
          Laboratory Home
        </Link>
        <ChevronRight size={12} />
        <Link
          href={`/dashboard/labs/requests`}
          className="hover:opacity-100 font-medium transition"
        >
          Laboratory Requests
        </Link>
        <ChevronRight size={12} />
        <span className="font-semibold">Request Details</span>
      </div>

      {/* Hero: Patient & Specimen Overview Banner */}
      <div
        className="relative overflow-hidden rounded-[32px] border p-6 sm:p-8 space-y-6"
        style={{ backgroundColor: ui.card, borderColor: hairline }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-[24px] text-xl sm:text-2xl font-bold text-white"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              {initials}
            </div>
            <div className="min-w-0 space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate capitalize">
                {patientName}
              </h1>
              <p className="text-xs opacity-55">
                Diagnostic Request · {activeRequest.tests?.length || 0}{" "}
                {activeRequest.tests?.length === 1 ? "test" : "tests"} ordered
              </p>
              {activeRequest.consultation && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedConsultation(activeRequest.consultation)
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition hover:opacity-80 border"
                  style={{
                    backgroundColor: `${PRIMARY_COLOR}12`,
                    borderColor: `${PRIMARY_COLOR}30`,
                    color: PRIMARY_COLOR,
                  }}
                >
                  <Stethoscope size={13} />
                  View Source Consultation & Attachments (
                  {activeRequest.consultation.attachments?.length || 0})
                </button>
              )}
            </div>
          </div>

          <div
            className="flex flex-col gap-2 rounded-2xl p-4 border shrink-0 min-w-[240px]"
            style={{ backgroundColor: ui.inner, borderColor: hairline }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-50">
                Specimen Code
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: sampleTint, color: sampleAccent }}
              >
                {isPendingCollection ? "Pending" : "Collected"}
              </span>
            </div>
            <p
              className="text-xs font-mono font-bold tracking-wider"
              style={{ color: PRIMARY_COLOR }}
            >
              {specimenCode}
            </p>

            <SpecimenBarcode
              value={specimenCode}
              height={40}
              moduleWidth={1.4}
              showText={false}
              className="w-full"
            />
          </div>
        </div>

        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl p-4 sm:p-5 border"
          style={{ backgroundColor: ui.inner, borderColor: hairline }}
        >
          <InfoItem
            icon={<IdCard size={15} />}
            label="MRN"
            value={patient?.mrn || "N/A"}
          />
          <InfoItem
            icon={<UserCheck size={15} />}
            label="Gender"
            value={patient?.gender || "N/A"}
          />
          <InfoItem
            icon={<CalendarDays size={15} />}
            label="Date of birth"
            value={
              patient?.dateOfBirth
                ? new Date(patient.dateOfBirth).toLocaleDateString()
                : "N/A"
            }
          />
          <InfoItem
            icon={<Flag size={15} />}
            label="Priority"
            value={activeRequest.priority || "routine"}
          />
        </div>
      </div>

      {/* Guide & Tips Box */}
      <div
        className="rounded-[24px] p-4 border text-xs space-y-3 transition-all"
        style={{
          backgroundColor: isDark ? "rgba(127, 29, 29, 0.2)" : "#fef2f2",
          borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "#fecaca",
          color: isDark ? "#fca5a5" : "#991b1b",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Info size={15} style={{ color: isDark ? "#f87171" : "#dc2626" }} />
            <span>Test Results Guide & Workflow Tips</span>
          </div>
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-[11px] font-medium opacity-80 hover:opacity-100 transition underline"
          >
            {showGuide ? "Hide Guide" : "Show Guide"}
          </button>
        </div>
        <p className="opacity-90 leading-relaxed">
          Fill in readings, special notes, upload result files/photos, and click
          the explicit <strong>Save Changes</strong> button on each test card to
          commit your updates.
        </p>
      </div>

      {/* FULL WIDTH: Test Items & Results */}
      <div className="space-y-4">
        <div className="flex items-end justify-between px-1">
          <div>
            <h2 className="text-base font-semibold">Test Items & Results</h2>
            <p className="text-[11px] opacity-50 mt-0.5">
              Modify test parameters, upload scans/photos and click Save Changes
              when ready
            </p>
          </div>
        </div>

        {activeRequest.tests.map((test: any) => (
          <TestResultCard
            key={test._id}
            test={test}
            facilityId={facilityId}
            requestId={requestId}
            ui={ui}
            isDark={isDark}
            colors={colors}
            border={border}
            hairline={hairline}
            inputClass={inputClass}
            inputStyle={inputStyle}
          />
        ))}
      </div>

      {/* Staff Assignment */}
      <div
        className="rounded-[28px] border p-5 sm:p-6 space-y-4"
        style={{ backgroundColor: ui.card, borderColor: hairline }}
      >
        <div className="flex items-center gap-2">
          <UserCheck size={16} className="opacity-50 shrink-0" />
          <h3 className="text-sm font-semibold">Assigned Staff</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <CustomSearchableStaffDropdown
            label="Responsible Personnel"
            value={assignedStaffId}
            members={members}
            onChange={(val) => setAssignedStaffId(val)}
            placeholder="Select assigned staff..."
            isDark={isDark}
            colors={colors}
            border={border}
          />
          <Can perm="labs.write">
            <button
              type="button"
              disabled={actionLoading}
              onClick={promptAssignmentConfirmation}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              {actionLoading && <Loader2 size={13} className="animate-spin" />}
              Update Assignment
            </button>
          </Can>
        </div>
      </div>

      {/* FULL WIDTH ROWS: Clinical Notes & Audit History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Clinical Notes */}
        <div
          className="rounded-[28px] border p-6 space-y-4"
          style={{ backgroundColor: ui.card, borderColor: hairline }}
        >
          <div className="flex items-center gap-2">
            <MessageSquareText size={18} style={{ color: PRIMARY_COLOR }} />
            <h3 className="text-sm font-bold">Clinical Notes</h3>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-0.5">
            {clinicalNotesList.length === 0 ? (
              <p className="text-xs opacity-50 py-4 text-center">
                No clinical notes recorded yet. Add observations below.
              </p>
            ) : (
              clinicalNotesList
                .slice(-3)
                .reverse()
                .map((note: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedNote(note)}
                    className="w-full text-left rounded-2xl p-3.5 space-y-1.5 text-xs border-l-4 transition hover:opacity-90"
                    style={{
                      backgroundColor: ui.inner,
                      borderLeftColor: PRIMARY_COLOR,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px] opacity-60">
                      <span className="font-semibold capitalize truncate">
                        {note.author
                          ? `${note.author.firstName || ""} ${
                              note.author.lastName || ""
                            }`
                          : "Staff"}
                      </span>
                      <span className="shrink-0">
                        {new Date(note.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="leading-relaxed text-xs line-clamp-2">
                      {note.text}
                    </p>
                  </button>
                ))
            )}
          </div>

          <form onSubmit={handleAddNote} className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium opacity-60">
                Add New Observation
              </label>
              <span className="text-[10px] opacity-40">
                Visible to care team
              </span>
            </div>
            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Type clinical observations, sample handling instructions, or patient remarks..."
              rows={2}
              className="w-full rounded-2xl p-3.5 text-xs outline-none resize-none border transition focus:border-current"
              style={inputStyle}
            />
            <button
              type="submit"
              disabled={actionLoading || !newNoteText.trim()}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              {actionLoading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              Add Clinical Note
            </button>
          </form>
        </div>

        {/* Audit History */}
        <div
          className="rounded-[28px] border p-6 space-y-4"
          style={{ backgroundColor: ui.card, borderColor: hairline }}
        >
          <div className="flex items-center gap-2">
            <History size={18} style={{ color: PRIMARY_COLOR }} />
            <h3 className="text-sm font-bold">Audit History</h3>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-0.5">
            {auditList.length === 0 ? (
              <p className="text-xs opacity-50 py-4 text-center">
                System action logs will appear here automatically.
              </p>
            ) : (
              auditList
                .slice(-3)
                .reverse()
                .map((note: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-2xl p-3.5 space-y-1 text-xs border-l-4 opacity-85"
                    style={{
                      backgroundColor: ui.inner,
                      borderLeftColor: PRIMARY_COLOR,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px] opacity-60">
                      <span className="font-semibold capitalize truncate">
                        {note.author
                          ? `${note.author.firstName || ""} ${
                              note.author.lastName || ""
                            }`
                          : "System"}
                      </span>
                      <span className="shrink-0">
                        {new Date(note.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="leading-tight text-[11px]">{note.text}</p>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
