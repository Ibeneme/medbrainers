"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Check,
  ChevronDown,
  Loader2,
  Search,
  Activity,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchMyFacilities,
  fetchPatients,
  fetchTriage,
  createTriage,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { CustomDropdown } from "@/components/ui/items";


function personName(p: unknown) {
  if (!p || typeof p === "string") return "—";
  const x = p as { firstName?: string; lastName?: string; mrn?: string };
  return `${x.firstName || ""} ${x.lastName || ""}`.trim() || x.mrn || "—";
}

type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};



export default function TriageDeskPage() {
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";

  const ui: UI = {
    isDark,
    page: isDark ? "rgba(255,255,255,0.03)" : "#eef2f7",
    card: isDark ? colors.shadeBg : "#ffffff",
    inner: isDark ? colors.shadeBgSecond : "#f3f5f9",
    text: colors.text,
    border,
  };

  const { activeFacilityId, activeFacility } = useAppSelector(
    (s) => s.facilities
  );
  const { list: patients } = useAppSelector((s) => s.patients);
  const { triage = [], saving } = useAppSelector((s) => s.appointments);

  const [patientId, setPatientId] = useState("");
  const [level, setLevel] = useState("3");
  const [complaint, setComplaint] = useState("");

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (!activeFacilityId) return;
    dispatch(fetchPatients({ facilityId: activeFacilityId }));
    dispatch(fetchTriage(activeFacilityId));
  }, [dispatch, activeFacilityId]);

  const inputStyle = {
    backgroundColor: ui.inner,
    color: ui.text,
    borderColor: "transparent",
  };

  const inputCls =
    "w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/25";

  if (!activeFacilityId) {
    return (
      <div
        className="max-w-lg mx-auto px-4 py-16 text-center"
        style={{ color: colors.text }}
      >
        <Building2 className="mx-auto opacity-30 mb-3" size={32} />
        <p className="font-bold">Select a facility first</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 py-4 sm:py-6">
      <div
        className="relative rounded-[32px] p-4 sm:p-6 space-y-5"
        style={{ backgroundColor: ui.page, color: ui.text }}
      >
        {saving && <DarkBlurOverlayLoader text="Recording triage..." />}

        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-2xl border"
                style={{
                  backgroundColor: ui.card,
                  borderColor: border,
                  color: PRIMARY_COLOR,
                }}
              >
                <Activity size={20} />
              </span>
              <h1 className="text-3xl sm:text-4xl font-normal tracking-tight">
                Triage desk
              </h1>
            </div>
            <p className="text-xs opacity-55 mt-1 ml-1">
              {activeFacility?.name} · Assess and prioritize patient acuity
              levels
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/appointments/queue"
              className="rounded-full border px-4 py-2.5 text-xs font-semibold transition hover:opacity-80 outline-none focus:outline-none"
              style={{ backgroundColor: ui.card, borderColor: border }}
            >
              Queue view
            </Link>
          </div>
        </div>

        {/* Triage Form */}
        <form
          className="rounded-[28px] border p-5 sm:p-6 space-y-4"
          style={{ backgroundColor: ui.card, borderColor: border }}
          onSubmit={async (e) => {
            e.preventDefault();
            await dispatch(
              createTriage({
                facilityId: activeFacilityId,
                payload: {
                  patientId,
                  level: Number(level),
                  chiefComplaint: complaint || undefined,
                },
              })
            ).unwrap();
            dispatch(fetchTriage(activeFacilityId));
            setPatientId("");
            setLevel("3");
            setComplaint("");
          }}
        >
          <h2 className="text-lg font-semibold tracking-tight mb-1">
            New patient triage assessment
          </h2>
          <p className="text-xs opacity-60 mb-3">
            Evaluate urgency based on the Emergency Severity Index (ESI) scale.
          </p>

          <div className="space-y-4">
            <div>
              <CustomDropdown
                label="Patient *"
                value={patientId}
                placeholder="Search or select patient…"
                searchable={true}
                options={patients.map((p) => ({
                  label: `${p.mrn} · ${p.firstName} ${p.lastName} ${
                    p.gender ? `(${p.gender})` : ""
                  }`,
                  value: p._id,
                }))}
                onChange={setPatientId}
                isDark={isDark}
                colors={colors}
                border={border}
              />
              <p className="text-[10px] opacity-50 mt-1">
                Select the patient presenting for emergency or urgent
                evaluation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <CustomDropdown
                  label="ESI / Triage level *"
                  value={level}
                  options={[
                    { value: "1", label: "1 – Critical (Resuscitation)" },
                    { value: "2", label: "2 – Emergent (High Risk)" },
                    { value: "3", label: "3 – Urgent (Stable)" },
                    { value: "4", label: "4 – Less Urgent" },
                    { value: "5", label: "5 – Non-Urgent" },
                  ]}
                  onChange={setLevel}
                  isDark={isDark}
                  colors={colors}
                  border={border}
                />
                <p className="text-[10px] opacity-50 mt-1">
                  1 represents immediate life-saving intervention needed; 5 is
                  non-urgent.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold opacity-70">
                  Chief complaint
                </label>
                <textarea
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="e.g. Severe chest pain, shortness of breath..."
                  rows={2}
                  className={inputCls}
                  style={inputStyle}
                />
                <p className="text-[10px] opacity-50 mt-1">
                  Primary symptoms or reason for seeking urgent care.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving || !patientId}
              className="rounded-full px-6 py-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 outline-none focus:outline-none border border-transparent"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              {saving ? "Recording..." : "Record triage"}
            </button>
          </div>
        </form>

        {/* Triage List */}
        <div
          className="rounded-[28px] border overflow-hidden"
          style={{ backgroundColor: ui.card, borderColor: border }}
        >
          {triage.length === 0 ? (
            <div className="p-12 text-center text-xs opacity-60">
              No triage records found.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: border }}>
              {triage.map((t: any) => {
                const pid = t.patient?._id || t.patient;
                return (
                  <div
                    key={t._id}
                    className="p-5 flex flex-wrap items-center justify-between gap-4 text-xs transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded-lg px-2.5 py-1 font-bold text-white text-[11px]"
                          style={{
                            backgroundColor:
                              t.level === 1
                                ? "#dc2626"
                                : t.level === 2
                                ? "#ea580c"
                                : PRIMARY_COLOR,
                          }}
                        >
                          L{t.level}
                        </span>
                        <Link
                          href={`/dashboard/patients/${pid}`}
                          className="text-sm font-semibold tracking-tight hover:underline"
                          style={{ color: PRIMARY_COLOR }}
                        >
                          {personName(t.patient)}
                        </Link>
                      </div>
                      <p className="opacity-70">
                        Complaint:{" "}
                        <strong className="font-medium">
                          {t.chiefComplaint || "None specified"}
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 opacity-60">
                      <span>
                        {t.triagedAt
                          ? new Date(t.triagedAt).toLocaleString()
                          : ""}
                      </span>
                      <Link
                        href={`/dashboard/patients/${pid}`}
                        className="rounded-full border px-4 py-2 font-semibold transition hover:opacity-80 text-black dark:text-white"
                        style={{
                          backgroundColor: ui.inner,
                          borderColor: border,
                        }}
                      >
                        View folder
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
