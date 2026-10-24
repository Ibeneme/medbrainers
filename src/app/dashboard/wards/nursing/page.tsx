"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Check,
  ChevronDown,
  Loader2,
  Search,
  ClipboardList,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchMyFacilities,
  fetchPatients,
  fetchCarePlans,
  createCarePlan,
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


export default function NursingCarePlansPage() {
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
  const { carePlans = [], loading, saving } = useAppSelector((s) => s.wards as any);

  const [patientId, setPatientId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [goal, setGoal] = useState("");
  const [intervention, setIntervention] = useState("");

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (!activeFacilityId) return;
    dispatch(fetchPatients({ facilityId: activeFacilityId }));
    dispatch(fetchCarePlans({ facilityId: activeFacilityId }));
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
        {saving && <DarkBlurOverlayLoader text="Saving care plan..." />}

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
                <ClipboardList size={20} />
              </span>
              <h1 className="text-3xl sm:text-4xl font-normal tracking-tight">
                Nursing care plans
              </h1>
            </div>
            <p className="text-xs opacity-55 mt-1 ml-1">
              {activeFacility?.name} · Create and monitor structured inpatient care goals
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/wards"
              className="rounded-full border px-4 py-2.5 text-xs font-semibold transition hover:opacity-80 outline-none focus:outline-none"
              style={{ backgroundColor: ui.card, borderColor: border }}
            >
              Wards view
            </Link>
          </div>
        </div>

        {/* Care Plan Form */}
        <form
          className="rounded-[28px] border p-5 sm:p-6 space-y-4"
          style={{ backgroundColor: ui.card, borderColor: border }}
          onSubmit={async (e) => {
            e.preventDefault();
            await dispatch(
              createCarePlan({
                facilityId: activeFacilityId,
                payload: {
                  patientId,
                  nursingDiagnosis: diagnosis,
                  goal,
                  intervention,
                },
              })
            ).unwrap();
            dispatch(fetchCarePlans({ facilityId: activeFacilityId }));
            setPatientId("");
            setDiagnosis("");
            setGoal("");
            setIntervention("");
          }}
        >
          <h2 className="text-lg font-semibold tracking-tight mb-1">
            New nursing care plan
          </h2>
          <p className="text-xs opacity-60 mb-3">
            Define individualized nursing diagnoses, patient goals, and specific clinical interventions.
          </p>

          <div className="space-y-4">
            <div>
              <CustomDropdown
                label="Patient"
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
                Choose the admitted or registered patient this care plan applies to.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold opacity-70">
                  Nursing diagnosis *
                </label>
                <input
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute pain related to surgical incision"
                  className={inputCls}
                  style={inputStyle}
                />
                <p className="text-[10px] opacity-50">
                  Clinical judgment regarding patient health responses.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold opacity-70">
                  Goal *
                </label>
                <input
                  required
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Patient reports pain below 3/10"
                  className={inputCls}
                  style={inputStyle}
                />
                <p className="text-[10px] opacity-50">
                  Measurable patient outcome expected within timeframe.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold opacity-70">
                  Intervention *
                </label>
                <input
                  required
                  value={intervention}
                  onChange={(e) => setIntervention(e.target.value)}
                  placeholder="e.g. Administer prescribed analgesics"
                  className={inputCls}
                  style={inputStyle}
                />
                <p className="text-[10px] opacity-50">
                  Specific nursing actions performed to achieve goals.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving || !patientId || !diagnosis.trim() || !goal.trim() || !intervention.trim()}
              className="rounded-full px-6 py-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 outline-none focus:outline-none border border-transparent"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              {saving ? "Creating..." : "Create care plan"}
            </button>
          </div>
        </form>

        {/* Care Plans List */}
        <div
          className="rounded-[28px] border overflow-hidden"
          style={{ backgroundColor: ui.card, borderColor: border }}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-xs opacity-60">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading care plans…
            </div>
          ) : carePlans.length === 0 ? (
            <div className="p-12 text-center text-xs opacity-60">
              No active nursing care plans recorded yet.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: border }}>
              {carePlans.map((cp: any) => {
                const pid = cp.patient?._id || cp.patient;
                return (
                  <div
                    key={cp._id}
                    className="p-5 flex flex-wrap items-center justify-between gap-4 text-xs transition"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/patients/${pid}`}
                          className="text-sm font-semibold tracking-tight hover:underline"
                          style={{ color: PRIMARY_COLOR }}
                        >
                          {personName(cp.patient)}
                        </Link>
                        {cp.patient?.mrn && (
                          <span
                            className="rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold"
                            style={{ backgroundColor: ui.inner }}
                          >
                            {cp.patient.mrn}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 opacity-80 pt-1">
                        <div>
                          <strong className="opacity-50 font-normal block text-[10px]">Diagnosis</strong>
                          <span className="font-medium">{cp.nursingDiagnosis}</span>
                        </div>
                        <div>
                          <strong className="opacity-50 font-normal block text-[10px]">Goal</strong>
                          <span className="font-medium">{cp.goal}</span>
                        </div>
                        <div>
                          <strong className="opacity-50 font-normal block text-[10px]">Intervention</strong>
                          <span className="font-medium">{cp.intervention}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/patients/${pid}`}
                        className="rounded-full border px-4 py-2 font-semibold transition hover:opacity-80"
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