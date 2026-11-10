"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BedDouble,
  Building2,
  Check,
  Clock,
  Loader2,
  ShieldAlert,
  Siren,
  Stethoscope,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  acceptAdmissionRequest,
  fetchAdmissionRequests,
  fetchMyFacilities,
  fetchWards,
  rejectAdmissionRequest,
} from "@/api/slices";
import type {
  AdmissionPriority,
  AdmissionRequest,
  AdmissionRequestStatus,
  BedStatus,
  Ward,
  WardBed,
} from "@/api/types";
import { useTheme } from "@/contexts/theme-context";
import { useToast } from "@/contexts/toast-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import {
  isAssignable,
  waitingLabel,
  wardStats,
} from "@/components/wards/bed-ui";

/* ------------------------------ helpers ------------------------------ */
const PRIORITY_LABEL: Record<AdmissionPriority, string> = {
  emergency: "Emergency",
  urgent: "Urgent",
  routine: "Routine",
};

const BED_STATUS_LABEL: Record<BedStatus, string> = {
  available: "Available",
  occupied: "Occupied",
  reserved: "Reserved",
  cleaning: "Cleaning",
  maintenance: "Maintenance",
  blocked: "Blocked",
};

const NEUTRAL = "rgba(128,128,128,0.22)";

const today = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

function nameOf(p: unknown) {
  if (!p || typeof p === "string") return "Unknown patient";
  const x = p as { firstName?: string; lastName?: string; mrn?: string };
  return (
    `${x.firstName || ""} ${x.lastName || ""}`.trim() ||
    x.mrn ||
    "Unknown patient"
  );
}

function staffName(d: unknown) {
  if (!d || typeof d === "string") return "ward staff";
  const x = d as { firstName?: string; lastName?: string };
  return `${x.firstName || ""} ${x.lastName || ""}`.trim() || "ward staff";
}

function doctorName(d: unknown) {
  if (!d || typeof d === "string") return "—";
  const x = d as { firstName?: string; lastName?: string };
  const n = `${x.firstName || ""} ${x.lastName || ""}`.trim();
  return n ? `Dr ${n}` : "—";
}

function ageOf(dob?: string) {
  if (!dob) return null;
  const years = Math.floor(
    (Date.now() - new Date(dob).getTime()) / (365.25 * 86400000)
  );
  return Number.isFinite(years) && years >= 0 ? years : null;
}

function matchesRequest(w: Ward, r: AdmissionRequest) {
  if (r.isolationRequired && w.type === "isolation") return true;
  return !!r.preferredWardType && w.type === r.preferredWardType;
}

type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};

function Bar({ pct, track }: { pct: number; track: string }) {
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full"
      style={{ backgroundColor: track }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          backgroundColor: PRIMARY_COLOR,
        }}
      />
    </div>
  );
}

/* ------------------------------ page ------------------------------ */
export default function AdmissionRequestsPage() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors);

  const { activeFacilityId, activeFacility } = useAppSelector(
    (s) => s.facilities
  );
  const { requests, wards, saving, pendingRequests } = useAppSelector(
    (s) => s.wards
  );

  const [tab, setTab] = useState<AdmissionRequestStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [assignFor, setAssignFor] = useState<AdmissionRequest | null>(null);
  const [declineFor, setDeclineFor] = useState<AdmissionRequest | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!activeFacilityId) return;
      if (!silent) setLoading(true);
      await Promise.all([
        dispatch(
          fetchAdmissionRequests({ facilityId: activeFacilityId, status: tab })
        ),
        dispatch(fetchWards(activeFacilityId)),
      ]);
      setLoading(false);
    },
    [dispatch, activeFacilityId, tab]
  );

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!activeFacilityId) return;
    const id = setInterval(() => load(true), 30000);
    return () => clearInterval(id);
  }, [activeFacilityId, load]);

  const totals = useMemo(() => {
    const all = wards.reduce(
      (acc, w) => {
        const s = wardStats(w);
        acc.free += s.available;
        acc.total += s.total;
        return acc;
      },
      { free: 0, total: 0 }
    );
    const emergency =
      tab === "pending"
        ? requests.filter((r) => r.priority === "emergency").length
        : 0;
    return { ...all, emergency };
  }, [wards, requests, tab]);

  if (!activeFacilityId) {
    return (
      <div
        className="mx-auto max-w-lg px-4 py-20 text-center"
        style={{ color: colors.text }}
      >
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${PRIMARY_COLOR}26` }}
        >
          <Building2 size={28} style={{ color: PRIMARY_COLOR }} />
        </div>
        <p className="text-lg font-semibold">Select a facility first</p>
        <p className="mt-1 text-sm opacity-60">
          Choose a facility to manage admission requests
        </p>
      </div>
    );
  }

  const tabs: { id: AdmissionRequestStatus; label: string }[] = [
    { id: "pending", label: "Waiting" },
    { id: "accepted", label: "Admitted" },
    { id: "rejected", label: "Declined" },
  ];

  const navTabs = [
    { href: "/dashboard/wards", label: "Wards" },
    { href: "/dashboard/wards/admissions", label: "Admissions" },
  ];
  const navTabsAfter = [
    { href: "/dashboard/wards/nursing", label: "Care plans" },
    { href: "/dashboard/wards/discharges", label: "Discharges" },
  ];

  const stats = [
    { label: "Waiting for a bed", value: pendingRequests, tint: true },
    { label: "Emergencies waiting", value: totals.emergency },
    { label: "Free beds now", value: totals.free, primary: true },
    { label: "Total beds", value: totals.total },
  ];

  return (
    <div className="mx-auto max-w-6xl px-3 py-5 sm:px-6">
      <div className="space-y-6" style={{ color: ui.text }}>
        {/* Top bar */}
        <header className="flex flex-wrap items-center justify-between gap-4">
      
          <div className="">
            <p className="flex items-center justify-end gap-2 text-base font-medium">
              <Building2 size={17} className="opacity-70" />
              {activeFacility?.name}
            </p>
            <p className="mt-1 text-sm opacity-55" suppressHydrationWarning>
              {today()}
            </p>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((c) => (
            <div
              key={c.label}
              className="rounded-[28px] p-5"
              style={{
                backgroundColor: c.tint ? `${PRIMARY_COLOR}26` : ui.card,
              }}
            >
              <p className="text-xs font-medium opacity-60">{c.label}</p>
              <p
                className="mt-1 text-4xl font-semibold tracking-tight"
                style={c.primary ? { color: PRIMARY_COLOR } : undefined}
              >
                {c.value}
              </p>
            </div>
          ))}
        </div>

        {/* Requests card */}
        <section
          className="space-y-5 rounded-[28px] p-5 sm:p-6"
          style={{ backgroundColor: ui.card }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-medium tracking-tight">
                Admission requests
              </h1>
              <span
                className="rounded-full px-3 py-1 text-sm"
                style={{ backgroundColor: ui.inner }}
              >
                {requests.length}
              </span>
            </div>

            <div
              className="flex gap-1 rounded-full p-1"
              style={{ backgroundColor: ui.inner }}
            >
              {tabs.map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className="rounded-full px-4 py-2 text-xs font-semibold outline-none transition-colors"
                    style={{
                      backgroundColor: active ? PRIMARY_COLOR : "transparent",
                      color: active ? "#FFFFFF" : ui.text,
                    }}
                  >
                    {t.label}
                    {t.id === "pending" && pendingRequests > 0 && (
                      <span
                        className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor: active
                            ? "rgba(255,255,255,0.25)"
                            : `${PRIMARY_COLOR}26`,
                          color: active ? "#FFFFFF" : PRIMARY_COLOR,
                        }}
                      >
                        {pendingRequests}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2.5 py-16 text-sm opacity-55">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading requests…
            </div>
          ) : requests.length === 0 ? (
            <div
              className="rounded-3xl py-16 text-center"
              style={{ backgroundColor: ui.inner }}
            >
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: `${PRIMARY_COLOR}26` }}
              >
                <BedDouble size={24} style={{ color: PRIMARY_COLOR }} />
              </div>
              <p className="mx-auto max-w-sm text-sm opacity-60">
                {tab === "pending"
                  ? "No patients are waiting for a bed. New requests from doctors appear here automatically."
                  : tab === "accepted"
                  ? "No accepted requests yet."
                  : "No declined requests."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <RequestCard
                  key={r._id}
                  r={r}
                  ui={ui}
                  onAssign={() => setAssignFor(r)}
                  onDecline={() => setDeclineFor(r)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {assignFor && (
        <AssignBedModal
          request={assignFor}
          wards={wards}
          ui={ui}
          saving={saving}
          onClose={() => !saving && setAssignFor(null)}
          onConfirm={async (wardId, bedCode, notes) => {
            try {
              const res = await dispatch(
                acceptAdmissionRequest({
                  facilityId: activeFacilityId,
                  requestId: assignFor._id,
                  payload: { wardId, bedCode, notes: notes || undefined },
                })
              ).unwrap();
              showToast(res.message || "Patient admitted");
              setAssignFor(null);
            } catch (err) {
              showToast(
                typeof err === "string" ? err : "Could not admit patient",
                "error"
              );
            } finally {
              load(true);
            }
          }}
        />
      )}

      {declineFor && (
        <DeclineModal
          request={declineFor}
          ui={ui}
          saving={saving}
          onClose={() => !saving && setDeclineFor(null)}
          onConfirm={async (reason) => {
            try {
              const res = await dispatch(
                rejectAdmissionRequest({
                  facilityId: activeFacilityId,
                  requestId: declineFor._id,
                  reason,
                })
              ).unwrap();
              showToast(res.message || "Request declined");
              setDeclineFor(null);
            } catch (err) {
              showToast(
                typeof err === "string" ? err : "Could not decline request",
                "error"
              );
            } finally {
              load(true);
            }
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------ request card ------------------------------ */
function RequestCard({
  r,
  ui,
  onAssign,
  onDecline,
}: {
  r: AdmissionRequest;
  ui: UI;
  onAssign: () => void;
  onDecline: () => void;
}) {
  const p: any = typeof r.patient === "string" ? {} : r.patient || {};
  const age = ageOf(p.dateOfBirth);
  const allergies: any[] = Array.isArray(p.allergies) ? p.allergies : [];
  const patientId = p._id || (typeof r.patient === "string" ? r.patient : "");
  const ward: any = typeof r.ward === "string" ? null : r.ward;
  const name = nameOf(r.patient);

  const priorityStyle: React.CSSProperties =
    r.priority === "emergency"
      ? { backgroundColor: PRIMARY_COLOR, color: "#FFFFFF" }
      : r.priority === "urgent"
      ? { backgroundColor: `${PRIMARY_COLOR}26`, color: PRIMARY_COLOR }
      : { backgroundColor: ui.card };

  const chip =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold";

  return (
    <div
      className="space-y-4 rounded-3xl p-5"
      style={{ backgroundColor: ui.inner }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{
              backgroundColor: `${PRIMARY_COLOR}26`,
              color: PRIMARY_COLOR,
            }}
          >
            {initialsOf(name)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/dashboard/patients/${patientId}`}
                className="text-[15px] font-semibold hover:underline"
              >
                {name}
              </Link>
              {p.mrn && (
                <span
                  className="rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium"
                  style={{ backgroundColor: ui.card }}
                >
                  {p.mrn}
                </span>
              )}
            </div>
            <p className="text-xs capitalize opacity-55">
              {[p.gender, age !== null ? `${age} yrs` : null]
                .filter(Boolean)
                .join(" · ") || "—"}
            </p>
          </div>
        </div>

        <div className="space-y-1 text-right text-xs opacity-60">
          <p className="inline-flex items-center gap-1.5">
            <Clock size={12} />
            {r.status === "pending"
              ? `Waiting ${waitingLabel(r.requestedAt)}`
              : new Date(r.processedAt || r.requestedAt).toLocaleString()}
          </p>
          <p className="flex items-center justify-end gap-1.5">
            <Stethoscope size={12} /> {doctorName(r.requestedBy)}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={chip} style={priorityStyle}>
          {r.priority === "emergency" && <Siren size={11} />}
          {PRIORITY_LABEL[r.priority] || PRIORITY_LABEL.routine}
        </span>
        {r.isolationRequired && (
          <span className={chip} style={{ backgroundColor: ui.card }}>
            <ShieldAlert size={11} /> Isolation
          </span>
        )}
        {r.preferredWardType && (
          <span
            className={`${chip} capitalize`}
            style={{ backgroundColor: ui.card }}
          >
            Prefers {r.preferredWardType}
          </span>
        )}
        {allergies.length > 0 && (
          <span
            className={chip}
            style={{ backgroundColor: ui.card }}
            title={allergies.map((a) => a.substance).join(", ")}
          >
            <AlertTriangle size={11} /> {allergies.length} allerg
            {allergies.length === 1 ? "y" : "ies"}
          </span>
        )}
      </div>

      {/* Reason */}
      <div
        className="space-y-1.5 rounded-2xl p-4 text-sm"
        style={{ backgroundColor: ui.card }}
      >
        <p>
          <span className="opacity-55">Reason: </span>
          <span className="font-medium">{r.reason}</span>
        </p>
        {r.admittingDiagnosis && (
          <p>
            <span className="opacity-55">Diagnosis: </span>
            <span className="font-medium">{r.admittingDiagnosis}</span>
          </p>
        )}
        {r.notes && (
          <p>
            <span className="opacity-55">Note: </span>
            <span className="font-medium">{r.notes}</span>
          </p>
        )}
      </div>

      {r.status === "pending" && (
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onDecline}
            className="rounded-full px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ backgroundColor: ui.card }}
          >
            Decline
          </button>
          <button
            type="button"
            onClick={onAssign}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <BedDouble size={15} />
            Assign bed
          </button>
        </div>
      )}

      {r.status === "accepted" && (
        <p className="text-sm font-medium" style={{ color: PRIMARY_COLOR }}>
          <Check size={13} className="-mt-0.5 mr-1.5 inline" />
          Admitted to {ward?.name || "ward"} · Bed {r.bedCode} · by{" "}
          {staffName(r.processedBy)}
        </p>
      )}

      {r.status === "rejected" && (
        <p className="text-sm font-medium opacity-70">
          Declined{r.rejectionReason ? `: ${r.rejectionReason}` : ""}
        </p>
      )}
    </div>
  );
}

/* ------------------------------ modal shell ------------------------------ */
function Modal({
  title,
  subtitle,
  ui,
  onClose,
  wide = false,
  children,
}: {
  title: string;
  subtitle?: string;
  ui: UI;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${
          wide ? "max-w-3xl" : "max-w-lg"
        } max-h-[92vh] space-y-5 overflow-y-auto rounded-[28px] p-5 sm:p-6`}
        style={{ backgroundColor: ui.card, color: ui.text }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-medium tracking-tight">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-sm opacity-55">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full opacity-70 transition-opacity hover:opacity-100"
            style={{ backgroundColor: ui.inner }}
          >
            <X size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------ assign ward + bed ------------------------------ */
function AssignBedModal({
  request,
  wards,
  ui,
  saving,
  onClose,
  onConfirm,
}: {
  request: AdmissionRequest;
  wards: Ward[];
  ui: UI;
  saving: boolean;
  onClose: () => void;
  onConfirm: (wardId: string, bedCode: string, notes: string) => void;
}) {
  const [wardId, setWardId] = useState("");
  const [bedCode, setBedCode] = useState("");
  const [notes, setNotes] = useState("");

  const sorted = useMemo(
    () =>
      [...wards].sort((a, b) => {
        const score = (w: Ward) =>
          (matchesRequest(w, request) ? 0 : 2) +
          (wardStats(w).available > 0 ? 0 : 4);
        return score(a) - score(b) || a.name.localeCompare(b.name);
      }),
    [wards, request]
  );

  useEffect(() => {
    if (!wardId && sorted[0] && wardStats(sorted[0]).available > 0)
      setWardId(sorted[0]._id);
  }, [sorted, wardId]);

  const ward = wards.find((w) => w._id === wardId);
  const isolationMismatch =
    !!request.isolationRequired && !!ward && ward.type !== "isolation";

  return (
    <Modal
      wide
      ui={ui}
      onClose={onClose}
      title="Assign ward & bed"
      subtitle={`${nameOf(request.patient)} · ${(
        PRIORITY_LABEL[request.priority] || "Routine"
      ).toLowerCase()} admission`}
    >
      <div
        className="rounded-2xl p-4 text-sm"
        style={{ backgroundColor: ui.inner }}
      >
        <span className="opacity-55">Reason: </span>
        <span className="font-medium">{request.reason}</span>
      </div>

      {/* 1. ward */}
      <div className="space-y-3">
        <p className="text-sm font-semibold opacity-70">1 · Choose a ward</p>
        {sorted.length === 0 ? (
          <p className="text-sm opacity-55">
            No wards set up yet.{" "}
            <Link
              href="/dashboard/wards"
              className="underline underline-offset-2"
              style={{ color: PRIMARY_COLOR }}
            >
              Create a ward
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {sorted.map((w) => {
              const s = wardStats(w);
              const full = s.available === 0;
              const active = w._id === wardId;
              const rec = matchesRequest(w, request);
              return (
                <button
                  key={w._id}
                  type="button"
                  disabled={full}
                  onClick={() => {
                    setWardId(w._id);
                    setBedCode("");
                  }}
                  className="rounded-3xl p-4 text-left outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-45"
                  style={{
                    backgroundColor: active ? `${PRIMARY_COLOR}26` : ui.inner,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{w.name}</p>
                      <p className="text-[11px] capitalize opacity-55">
                        {w.type}
                        {w.floor ? ` · Floor ${w.floor}` : ""}
                      </p>
                    </div>
                    {rec && (
                      <span
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                        style={{
                          backgroundColor: PRIMARY_COLOR,
                          color: "#FFFFFF",
                        }}
                      >
                        Suggested
                      </span>
                    )}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <Bar pct={s.pct} track={active ? ui.card : ui.card} />
                    <p className="text-[11px] opacity-60">
                      {full ? "Full" : `${s.available} free`} of {s.total} beds
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. bed */}
      {ward && (
        <div className="space-y-3">
          <p className="text-sm font-semibold opacity-70">
            2 · Pick a bed in {ward.name}
          </p>
          <div
            className="flex flex-wrap gap-2.5 rounded-3xl p-4"
            style={{ backgroundColor: ui.inner }}
          >
            {(ward.beds || []).map((b: WardBed) => {
              const selected = bedCode === b.code;
              const assignable = isAssignable(b);
              return (
                <button
                  key={b.code}
                  type="button"
                  disabled={!assignable}
                  onClick={() => setBedCode(b.code)}
                  title={`${b.code} · ${BED_STATUS_LABEL[b.status]}`}
                  className="flex h-14 w-[70px] flex-col items-center justify-center rounded-2xl px-1 outline-none transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:hover:opacity-100"
                  style={
                    selected
                      ? { backgroundColor: PRIMARY_COLOR, color: "#FFFFFF" }
                      : assignable
                      ? { backgroundColor: ui.card, color: ui.text }
                      : {
                          backgroundColor: NEUTRAL,
                          color: ui.text,
                          opacity: 0.55,
                        }
                  }
                >
                  <span className="font-mono text-xs font-semibold">
                    {b.code}
                  </span>
                  {!assignable && (
                    <span className="mt-0.5 max-w-full truncate text-[9px] opacity-80">
                      {BED_STATUS_LABEL[b.status]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {[
              ["Available", { backgroundColor: ui.card }],
              ["Selected", { backgroundColor: PRIMARY_COLOR }],
              ["Unavailable", { backgroundColor: NEUTRAL }],
            ].map(([label, style]) => (
              <span
                key={label as string}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{ backgroundColor: ui.inner }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={style as React.CSSProperties}
                />
                {label as string}
              </span>
            ))}
          </div>
          {isolationMismatch && (
            <p
              className="flex items-start gap-2.5 rounded-2xl p-4 text-xs font-medium"
              style={{
                backgroundColor: `${PRIMARY_COLOR}26`,
                color: ui.text,
              }}
            >
              <ShieldAlert
                size={15}
                className="mt-0.5 shrink-0"
                style={{ color: PRIMARY_COLOR }}
              />
              The doctor flagged isolation, but this is not an isolation ward.
              Consider an isolation ward if one has space.
            </p>
          )}
        </div>
      )}

      {/* note + confirm */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold opacity-70">
          Note for nursing (optional)
        </label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. bed by the nurses' station"
          className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
          style={{ backgroundColor: ui.inner, color: ui.text }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-sm opacity-60">
          {ward && bedCode ? (
            <>
              Admit to <strong>{ward.name}</strong> · Bed{" "}
              <strong>{bedCode}</strong>
            </>
          ) : (
            "Select a ward and an available bed"
          )}
        </p>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-70 disabled:opacity-50"
            style={{ backgroundColor: ui.inner }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !wardId || !bedCode}
            onClick={() => onConfirm(wardId, bedCode, notes.trim())}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {saving ? "Admitting…" : "Accept & admit"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------ decline ------------------------------ */
const QUICK_REASONS = [
  "No bed available",
  "Not clinically indicated",
  "Refer to another facility",
  "Manage as outpatient",
];

function DeclineModal({
  request,
  ui,
  saving,
  onClose,
  onConfirm,
}: {
  request: AdmissionRequest;
  ui: UI;
  saving: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const valid = reason.trim().length >= 3;

  return (
    <Modal
      ui={ui}
      onClose={onClose}
      title="Decline admission request"
      subtitle={`${nameOf(
        request.patient
      )} — the requesting doctor will see your reason`}
    >
      <div className="flex flex-wrap gap-2">
        {QUICK_REASONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setReason(q)}
            className="rounded-full px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-80"
            style={{
              backgroundColor: reason === q ? PRIMARY_COLOR : ui.inner,
              color: reason === q ? "#FFFFFF" : ui.text,
            }}
          >
            {q}
          </button>
        ))}
      </div>

      <textarea
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for declining *"
        className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
        style={{ backgroundColor: ui.inner, color: ui.text }}
      />

      <div className="flex justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-full px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-70 disabled:opacity-50"
          style={{ backgroundColor: ui.inner }}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving || !valid}
          onClick={() => onConfirm(reason.trim())}
          className="rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: ui.text, color: ui.card }}
        >
          {saving ? "Declining…" : "Decline request"}
        </button>
      </div>
    </Modal>
  );
}
