"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  Loader2,
  Search,
  UserPlus,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  createAppointment,
  fetchPatients,
  fetchDepartments,
  type CreateAppointmentPayload,
  type AppointmentKind,
  type AppointmentPriority,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { ModuleShell, personLabel } from "@/components/dashboard/ModuleShell";
import { useFacilityId } from "@/hooks/useFacilityId";
import {
  CustomPopupDatePicker,
  CustomDropdown,
  ToggleSwitch,
} from "@/components/ui/items";

const KINDS: { value: AppointmentKind; label: string }[] = [
  { value: "consultation", label: "Consultation" },
  { value: "follow_up", label: "Follow-up" },
  { value: "procedure", label: "Procedure" },
  { value: "review", label: "Review" },
  { value: "other", label: "Other" },
];

const PRIORITIES: { value: AppointmentPriority; label: string }[] = [
  { value: "routine", label: "Routine" },
  { value: "urgent", label: "Urgent" },
  { value: "emergency", label: "Emergency" },
];

function BookAppointmentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const { facilityId, departments } = useFacilityId();
  const { list: patients, listLoading: patientsLoading } = useAppSelector(
    (s) => s.patients
  );
  const { saving, error, message } = useAppSelector((s) => s.appointments);

  const prePatientId = searchParams.get("patientId") || "";

  const [patientSearch, setPatientSearch] = useState("");
  const [patientId, setPatientId] = useState(prePatientId);
  const [departmentId, setDepartmentId] = useState("");
  const [kind, setKind] = useState<AppointmentKind>("consultation");
  const [priority, setPriority] = useState<AppointmentPriority>("routine");
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [walkIn, setWalkIn] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastErr, setToastErr] = useState(false);

  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchPatients({ facilityId, limit: 100 }));
    dispatch(fetchDepartments(facilityId));
  }, [dispatch, facilityId]);

  useEffect(() => {
    if (patientSearch.trim().length >= 2 && facilityId) {
      const t = setTimeout(() => {
        dispatch(
          fetchPatients({
            facilityId,
            search: patientSearch.trim(),
            limit: 50,
          })
        );
      }, 300);
      return () => clearTimeout(t);
    }
  }, [patientSearch, facilityId, dispatch]);

  useEffect(() => {
    if (message) {
      setToast(message);
      setToastErr(false);
    }
  }, [message]);

  useEffect(() => {
    if (error) {
      setToast(error);
      setToastErr(true);
    }
  }, [error]);

  const selectedPatient = useMemo(
    () => (patients || []).find((p: any) => p._id === patientId),
    [patients, patientId]
  );

  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    const q = patientSearch.trim().toLowerCase();
    if (!q) return patients.slice(0, 20);
    return patients
      .filter((p: any) => {
        const name = [p.firstName, p.lastName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const mrn = (p.mrn || "").toLowerCase();
        const phone = (p.phone || "").toLowerCase();
        return name.includes(q) || mrn.includes(q) || phone.includes(q);
      })
      .slice(0, 20);
  }, [patients, patientSearch]);

  const canSubmit =
    !!facilityId &&
    !!patientId &&
    !!departmentId &&
    (walkIn || (!!date && !!time));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !facilityId) return;

    let startAt: string | undefined;
    if (!walkIn && date && time) {
      const datePart = date.includes("T") ? date.split("T")[0] : date;
      startAt = new Date(`${datePart}T${time}:00`).toISOString();
    }

    const payload: CreateAppointmentPayload = {
      patientId,
      departmentId,
      kind,
      priority,
      title: title.trim() || undefined,
      reason: reason.trim() || undefined,
      notes: notes.trim() || undefined,
      walkIn: walkIn || undefined,
      startAt,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    const result = await dispatch(
      createAppointment({ facilityId, payload })
    );

    if (createAppointment.fulfilled.match(result)) {
      const appt = result.payload.data?.appointment;
      if (appt?._id) {
        router.push(`/dashboard/appointments/${appt._id}`);
      } else {
        router.push("/dashboard/appointments");
      }
    }
  };

  const inputStyle = {
    backgroundColor: ui.inner,
    borderColor: ui.border,
    color: ui.text,
  };

  const fieldCls =
    "w-full rounded-2xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10";

  return (
    <ModuleShell
      title="Book appointment"
      subtitle="Schedule a visit or register a walk-in"
      icon={CalendarCheck}
      actions={
        <Link
          href="/dashboard/appointments"
          className="inline-flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-medium"
          style={{ borderColor: ui.border, color: ui.text }}
        >
          <ArrowLeft size={14} />
          Back
        </Link>
      }
    >
      {toast && (
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm ${
            toastErr
              ? "bg-red-500/15 text-red-500"
              : "bg-emerald-500/15 text-emerald-600"
          }`}
        >
          {toast}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <section
          className="rounded-[28px] p-5 space-y-3"
          style={{
            backgroundColor: ui.card,
            border: `1px solid ${ui.border}`,
          }}
        >
          <h2 className="text-sm font-semibold">Patient</h2>
          {selectedPatient ? (
            <div
              className="flex items-center justify-between rounded-2xl px-3.5 py-3"
              style={{
                backgroundColor: ui.inner,
                border: `1px solid ${ui.border}`,
              }}
            >
              <div>
                <p className="font-medium text-sm">
                  {personLabel(selectedPatient)}
                </p>
                <p className="text-xs opacity-55">
                  {[selectedPatient.mrn, selectedPatient.phone]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPatientId("")}
                className="text-xs opacity-60 hover:opacity-100 underline"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40"
                />
                <input
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search by name, MRN or phone..."
                  className={`${fieldCls} pl-9`}
                  style={inputStyle}
                />
              </div>
              {patientsLoading && (
                <p className="text-xs opacity-50 flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" /> Searching...
                </p>
              )}
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredPatients.map((p: any) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => {
                      setPatientId(p._id);
                      setPatientSearch("");
                    }}
                    className="w-full text-left rounded-xl px-3 py-2 text-sm hover:opacity-80 transition"
                    style={{ backgroundColor: ui.inner }}
                  >
                    <span className="font-medium">{personLabel(p)}</span>
                    <span className="text-xs opacity-50 ml-2">
                      {[p.mrn, p.phone].filter(Boolean).join(" · ")}
                    </span>
                  </button>
                ))}
                {!patientsLoading && filteredPatients.length === 0 && (
                  <p className="text-xs opacity-45 py-2 text-center">
                    No patients found.{" "}
                    <Link
                      href="/dashboard/patients/register"
                      className="underline"
                      style={{ color: PRIMARY_COLOR }}
                    >
                      Register new
                    </Link>
                  </p>
                )}
              </div>
            </>
          )}
        </section>

        <section
          className="rounded-[28px] p-5 space-y-3"
          style={{
            backgroundColor: ui.card,
            border: `1px solid ${ui.border}`,
          }}
        >
          <h2 className="text-sm font-semibold">Visit details</h2>

          <div className="grid sm:grid-cols-2 gap-3">
            <CustomDropdown
              label="Department *"
              value={departmentId}
              onChange={setDepartmentId}
              placeholder="Select department"
              isDark={isDark}
              colors={colors}
              border={border}
              searchable
              options={[
                { value: "", label: "Select department" },
                ...(departments || []).map((d: any) => ({
                  value: d._id || d.id,
                  label: d.name,
                })),
              ]}
            />
            <CustomDropdown
              label="Type"
              value={kind}
              onChange={(v) => setKind(v as AppointmentKind)}
              placeholder="Select type"
              isDark={isDark}
              colors={colors}
              border={border}
              options={KINDS}
            />
            <CustomDropdown
              label="Priority"
              value={priority}
              onChange={(v) => setPriority(v as AppointmentPriority)}
              placeholder="Select priority"
              isDark={isDark}
              colors={colors}
              border={border}
              options={PRIORITIES}
            />
            <div>
              <label className="block text-xs opacity-60 mb-1.5">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. General consultation"
                className={fieldCls}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs opacity-60 mb-1.5">
              Reason / chief complaint
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional"
              className={fieldCls}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs opacity-60 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional internal notes"
              className={fieldCls}
              style={inputStyle}
            />
          </div>
        </section>

        <section
          className="rounded-[28px] p-5 space-y-3"
          style={{
            backgroundColor: ui.card,
            border: `1px solid ${ui.border}`,
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold">Schedule</h2>
            <ToggleSwitch
              checked={walkIn}
              onChange={setWalkIn}
              label="Walk-in"
              description="Join department queue now"
            />
          </div>

          {!walkIn && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs opacity-60 mb-1.5">
                  Date *
                </label>
                <CustomPopupDatePicker value={date} onChange={setDate} />
              </div>
              <div>
                <label className="block text-xs opacity-60 mb-1.5">
                  Time *
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={fieldCls}
                  style={inputStyle}
                  required={!walkIn}
                />
              </div>
            </div>
          )}
          {walkIn && (
            <p className="text-xs opacity-55">
              Patient will be checked in and added to the department queue
              immediately.
            </p>
          )}
        </section>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <UserPlus size={16} />
            )}
            {walkIn ? "Register walk-in" : "Book appointment"}
          </button>
          <Link
            href="/dashboard/appointments"
            className="text-xs opacity-60 hover:opacity-100 underline"
          >
            Cancel
          </Link>
        </div>
      </form>
    </ModuleShell>
  );
}

export default function BookAppointmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 opacity-50">
          <Loader2 className="animate-spin" size={24} />
        </div>
      }
    >
      <BookAppointmentInner />
    </Suspense>
  );
}
