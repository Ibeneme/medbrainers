"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "@/components/access/guarded-link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  FileText,
  LogOut,
  Search,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  dischargePatient,
  fetchAdmissions,
  fetchDischarges,
  fetchMyFacilities,
  type DischargePayload,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { useToast } from "@/contexts/toast-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { DISPOSITION_LABEL } from "@/components/wards/discharge-ui";

const personName = (p: unknown) => {
  if (!p || typeof p === "string") return "—";
  const x = p as { firstName?: string; lastName?: string; mrn?: string };
  return `${x.firstName || ""} ${x.lastName || ""}`.trim() || x.mrn || "—";
};

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

const today = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

type Med = {
  drugName: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
};
type Ref = {
  type: "lab" | "imaging" | "specialist" | "physiotherapy" | "other";
  reason: string;
  priority: "routine" | "urgent" | "stat";
};
type Surg = { procedure: string; plannedDate: string };

type Ui = { card: string; inner: string; text: string };

/* ─── Small building blocks ───────────────────────────── */

function FacilityDate({ name }: { name?: string }) {
  return (
    <div className="text-right">
      <p className="flex items-center justify-end gap-2 text-base font-medium">
        <Building2 size={17} className="opacity-70" />
        {name || "Facility"}
      </p>
      <p className="mt-1 text-sm opacity-55" suppressHydrationWarning>
        {today()}
      </p>
    </div>
  );
}

function SectionCard({
  step,
  title,
  action,
  ui,
  children,
}: {
  step?: number;
  title: string;
  action?: React.ReactNode;
  ui: Ui;
  children: React.ReactNode;
}) {
  return (
    <section
      className="space-y-5 rounded-[28px] p-5 sm:p-6"
      style={{ backgroundColor: ui.card }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {step !== undefined && (
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              {step}
            </span>
          )}
          <h2 className="text-xl font-medium tracking-tight">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium opacity-55">
        {label}
      </label>
      {children}
    </div>
  );
}

function AddLink({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-80"
      style={{
        backgroundColor: `${PRIMARY_COLOR}26`,
        color: PRIMARY_COLOR,
      }}
    >
      <Plus size={13} /> {children}
    </button>
  );
}

function DischargesInner() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useSearchParams();
  const admissionId = params.get("admissionId");
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors);

  const { activeFacilityId, activeFacility, initialized } = useAppSelector(
    (s) => s.facilities
  );
  const { discharges, admissions, loading } = useAppSelector((s) => s.wards);

  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [diagnosis, setDiagnosis] = useState("");
  const [secondary, setSecondary] = useState("");
  const [procedures, setProcedures] = useState("");
  const [course, setCourse] = useState("");
  const [condition, setCondition] = useState("");
  const [disposition, setDisposition] =
    useState<NonNullable<DischargePayload["disposition"]>>("home");
  const [transferTo, setTransferTo] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [diet, setDiet] = useState("");
  const [activity, setActivity] = useState("");
  const [warnings, setWarnings] = useState("");
  const [followDate, setFollowDate] = useState("");
  const [followProvider, setFollowProvider] = useState("");
  const [notes, setNotes] = useState("");
  const [meds, setMeds] = useState<Med[]>([]);
  const [refs, setRefs] = useState<Ref[]>([]);
  const [surgeries, setSurgeries] = useState<Surg[]>([]);

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  const load = useCallback(() => {
    if (!activeFacilityId) return;
    dispatch(fetchDischarges({ facilityId: activeFacilityId }));
    dispatch(fetchAdmissions({ facilityId: activeFacilityId }));
  }, [dispatch, activeFacilityId]);

  useEffect(() => {
    load();
  }, [load]);

  const admission: any = useMemo(
    () =>
      admissionId ? admissions.find((a) => a._id === admissionId) : undefined,
    [admissions, admissionId]
  );

  useEffect(() => {
    if (admission?.admittingDiagnosis)
      setDiagnosis((d) => d || admission.admittingDiagnosis);
  }, [admission]);

  const q = query.trim().toLowerCase();
  const shown = discharges.filter((d: any) => {
    if (!q) return true;
    return (
      personName(d.patient).toLowerCase().includes(q) ||
      (d.patient?.mrn || "").toLowerCase().includes(q) ||
      (d.diagnosis || "").toLowerCase().includes(q)
    );
  });

  const field = "w-full rounded-2xl px-4 py-3 text-sm outline-none";
  const fieldStyle = { backgroundColor: ui.inner, color: ui.text };

  const submit = async () => {
    if (!activeFacilityId || !admissionId) return;
    if (!diagnosis.trim())
      return showToast("Enter the discharge diagnosis", "error");
    if (disposition === "transfer" && !transferTo.trim()) {
      return showToast(
        "Enter the facility the patient is transferred to",
        "error"
      );
    }
    const payload: DischargePayload = {
      diagnosis: diagnosis.trim(),
      secondaryDiagnoses: secondary
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      procedures: procedures.trim() || undefined,
      hospitalCourse: course.trim() || undefined,
      conditionOnDischarge: condition.trim() || undefined,
      dischargeMedications: meds
        .filter((m) => m.drugName.trim())
        .map((m) => ({
          drugName: m.drugName.trim(),
          dose: m.dose || undefined,
          route: m.route || undefined,
          frequency: m.frequency || undefined,
          duration: m.duration || undefined,
        })),
      followUpInstructions: followUp.trim() || undefined,
      diet: diet.trim() || undefined,
      activity: activity.trim() || undefined,
      warnings: warnings.trim() || undefined,
      referrals: refs
        .filter((r) => r.reason.trim())
        .map((r) => ({ ...r, reason: r.reason.trim() })),
      surgeryBookings: surgeries
        .filter((s) => s.procedure.trim())
        .map((s) => ({
          procedure: s.procedure.trim(),
          plannedDate: s.plannedDate || undefined,
        })),
      disposition,
      transferToFacility:
        disposition === "transfer" ? transferTo.trim() : undefined,
      followUpDate: followDate || undefined,
      followUpProvider: followProvider.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    setSubmitting(true);
    try {
      const res: any = await dispatch(
        dischargePatient({
          facilityId: activeFacilityId,
          admissionId,
          payload,
        })
      ).unwrap();
      showToast("Patient discharged");
      const summaryId = res?.data?.summary?._id;
      router.push(
        summaryId
          ? `/dashboard/wards/discharges/${summaryId}`
          : "/dashboard/wards/discharges"
      );
    } catch (err) {
      showToast(typeof err === "string" ? err : "Discharge failed", "error");
      setSubmitting(false);
    }
  };

  if (initialized && !activeFacilityId) {
    return (
      <div
        className="mx-auto max-w-lg px-4 py-20 text-center"
        style={{ color: ui.text }}
      >
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${PRIMARY_COLOR}26` }}
        >
          <FileText size={28} style={{ color: PRIMARY_COLOR }} />
        </div>
        <p className="text-lg font-semibold">Select a facility first</p>
      </div>
    );
  }

  /* ─── Discharge form ───────────────────────────────── */
  if (admissionId) {
    if (!admission) {
      return (
        <div
          className="mx-auto max-w-md py-20 text-center text-sm opacity-55"
          style={{ color: ui.text }}
        >
          {loading || !activeFacilityId ? (
            "Loading admission…"
          ) : (
            <>
              This admission is not active (it may already be discharged).{" "}
              <Link
                href="/dashboard/wards/discharges"
                className="font-medium underline underline-offset-2"
                style={{ color: PRIMARY_COLOR }}
              >
                Back to discharges
              </Link>
            </>
          )}
        </div>
      );
    }

    const patientName = personName(admission.patient);
    const stayDays = Math.max(
      1,
      Math.ceil(
        (Date.now() - new Date(admission.admittedAt).getTime()) / 86400000
      )
    );

    return (
      <div
        className="mx-auto max-w-6xl space-y-6 px-3 py-5 sm:px-6"
        style={{ color: ui.text }}
      >
        {/* Top bar */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <nav
            className="flex items-center gap-1 rounded-full p-1.5"
            style={{ backgroundColor: ui.card }}
            aria-label="Breadcrumb"
          >
            <Link
              href="/dashboard/wards/discharges"
              aria-label="Back"
              className="flex h-10 w-10 items-center justify-center rounded-full transition-opacity hover:opacity-70"
              style={{ backgroundColor: ui.inner }}
            >
              <ArrowLeft size={16} />
            </Link>
            <Link
              href="/dashboard/wards/discharges"
              className="rounded-full px-4 py-2.5 text-sm opacity-60 transition-opacity hover:opacity-100"
            >
              Discharges
            </Link>
            <span
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              New discharge
            </span>
          </nav>
          <FacilityDate name={activeFacility?.name} />
        </header>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Discharge {patientName}
          </h1>
          <p className="mt-1 text-sm opacity-55">
            Complete the summary below, then discharge the patient.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          {/* ─── Form column ─────────────────────────── */}
          <div className="min-w-0 space-y-5">
            <SectionCard step={1} title="Clinical summary" ui={ui}>
              <Field label="Principal diagnosis *">
                <input
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className={field}
                  style={fieldStyle}
                />
              </Field>
              <Field label="Secondary diagnoses (comma separated)">
                <input
                  value={secondary}
                  onChange={(e) => setSecondary(e.target.value)}
                  className={field}
                  style={fieldStyle}
                />
              </Field>
              <Field label="Procedures performed">
                <textarea
                  rows={2}
                  value={procedures}
                  onChange={(e) => setProcedures(e.target.value)}
                  className={field}
                  style={fieldStyle}
                />
              </Field>
              <Field label="Hospital course">
                <textarea
                  rows={4}
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className={field}
                  style={fieldStyle}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Condition on discharge">
                  <input
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    placeholder="e.g. Stable, afebrile"
                    className={field}
                    style={fieldStyle}
                  />
                </Field>
                <Field label="Disposition">
                  <select
                    value={disposition}
                    onChange={(e) => setDisposition(e.target.value as any)}
                    className={field}
                    style={fieldStyle}
                  >
                    {Object.entries(DISPOSITION_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              {disposition === "transfer" && (
                <Field label="Transferred to facility *">
                  <input
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className={field}
                    style={fieldStyle}
                  />
                </Field>
              )}
            </SectionCard>

            <SectionCard
              step={2}
              title="Discharge medications"
              ui={ui}
              action={
                <AddLink
                  onClick={() =>
                    setMeds((m) => [
                      ...m,
                      {
                        drugName: "",
                        dose: "",
                        route: "",
                        frequency: "",
                        duration: "",
                      },
                    ])
                  }
                >
                  Add drug
                </AddLink>
              }
            >
              {meds.length === 0 && (
                <p
                  className="rounded-2xl py-6 text-center text-xs opacity-55"
                  style={{ backgroundColor: ui.inner }}
                >
                  No medications added.
                </p>
              )}
              {meds.map((m, n) => (
                <div
                  key={n}
                  className="grid grid-cols-2 gap-2 sm:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]"
                >
                  {(
                    [
                      "drugName",
                      "dose",
                      "route",
                      "frequency",
                      "duration",
                    ] as const
                  ).map((k) => (
                    <input
                      key={k}
                      value={m[k]}
                      placeholder={
                        k === "drugName"
                          ? "Drug"
                          : k[0].toUpperCase() + k.slice(1)
                      }
                      onChange={(e) =>
                        setMeds((p) =>
                          p.map((x, i) =>
                            i === n ? { ...x, [k]: e.target.value } : x
                          )
                        )
                      }
                      className={field}
                      style={fieldStyle}
                    />
                  ))}
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => setMeds((p) => p.filter((_, i) => i !== n))}
                    className="flex h-11 w-11 items-center justify-center rounded-full opacity-60 transition-opacity hover:opacity-100"
                    style={{ backgroundColor: ui.inner }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </SectionCard>

            <SectionCard step={3} title="Instructions & follow-up" ui={ui}>
              <Field label="Follow-up instructions">
                <textarea
                  rows={2}
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  className={field}
                  style={fieldStyle}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Diet">
                  <input
                    value={diet}
                    onChange={(e) => setDiet(e.target.value)}
                    className={field}
                    style={fieldStyle}
                  />
                </Field>
                <Field label="Activity">
                  <input
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    className={field}
                    style={fieldStyle}
                  />
                </Field>
                <Field label="Follow-up date">
                  <input
                    type="date"
                    value={followDate}
                    onChange={(e) => setFollowDate(e.target.value)}
                    className={field}
                    style={fieldStyle}
                  />
                </Field>
                <Field label="Follow-up with">
                  <input
                    value={followProvider}
                    onChange={(e) => setFollowProvider(e.target.value)}
                    className={field}
                    style={fieldStyle}
                  />
                </Field>
              </div>
              <Field label="Warning signs — return to hospital if…">
                <textarea
                  rows={2}
                  value={warnings}
                  onChange={(e) => setWarnings(e.target.value)}
                  className={field}
                  style={fieldStyle}
                />
              </Field>
            </SectionCard>

            <SectionCard
              step={4}
              title="Referrals"
              ui={ui}
              action={
                <AddLink
                  onClick={() =>
                    setRefs((r) => [
                      ...r,
                      { type: "specialist", reason: "", priority: "routine" },
                    ])
                  }
                >
                  Add referral
                </AddLink>
              }
            >
              {refs.length === 0 && (
                <p
                  className="rounded-2xl py-6 text-center text-xs opacity-55"
                  style={{ backgroundColor: ui.inner }}
                >
                  No referrals added.
                </p>
              )}
              {refs.map((r, n) => (
                <div
                  key={n}
                  className="grid gap-2 sm:grid-cols-[1fr_2fr_1fr_auto]"
                >
                  <select
                    value={r.type}
                    onChange={(e) =>
                      setRefs((p) =>
                        p.map((x, i) =>
                          i === n
                            ? { ...x, type: e.target.value as Ref["type"] }
                            : x
                        )
                      )
                    }
                    className={field}
                    style={fieldStyle}
                  >
                    {[
                      "lab",
                      "imaging",
                      "specialist",
                      "physiotherapy",
                      "other",
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <input
                    value={r.reason}
                    placeholder="Reason"
                    onChange={(e) =>
                      setRefs((p) =>
                        p.map((x, i) =>
                          i === n ? { ...x, reason: e.target.value } : x
                        )
                      )
                    }
                    className={field}
                    style={fieldStyle}
                  />
                  <select
                    value={r.priority}
                    onChange={(e) =>
                      setRefs((p) =>
                        p.map((x, i) =>
                          i === n
                            ? {
                                ...x,
                                priority: e.target.value as Ref["priority"],
                              }
                            : x
                        )
                      )
                    }
                    className={field}
                    style={fieldStyle}
                  >
                    {["routine", "urgent", "stat"].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => setRefs((p) => p.filter((_, i) => i !== n))}
                    className="flex h-11 w-11 items-center justify-center rounded-full opacity-60 transition-opacity hover:opacity-100"
                    style={{ backgroundColor: ui.inner }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </SectionCard>

            <SectionCard
              step={5}
              title="Planned surgery"
              ui={ui}
              action={
                <AddLink
                  onClick={() =>
                    setSurgeries((s) => [
                      ...s,
                      { procedure: "", plannedDate: "" },
                    ])
                  }
                >
                  Add procedure
                </AddLink>
              }
            >
              {surgeries.length === 0 && (
                <p
                  className="rounded-2xl py-6 text-center text-xs opacity-55"
                  style={{ backgroundColor: ui.inner }}
                >
                  No procedures planned.
                </p>
              )}
              {surgeries.map((s, n) => (
                <div key={n} className="grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
                  <input
                    value={s.procedure}
                    placeholder="Procedure"
                    onChange={(e) =>
                      setSurgeries((p) =>
                        p.map((x, i) =>
                          i === n ? { ...x, procedure: e.target.value } : x
                        )
                      )
                    }
                    className={field}
                    style={fieldStyle}
                  />
                  <input
                    type="date"
                    value={s.plannedDate}
                    onChange={(e) =>
                      setSurgeries((p) =>
                        p.map((x, i) =>
                          i === n ? { ...x, plannedDate: e.target.value } : x
                        )
                      )
                    }
                    className={field}
                    style={fieldStyle}
                  />
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() =>
                      setSurgeries((p) => p.filter((_, i) => i !== n))
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-full opacity-60 transition-opacity hover:opacity-100"
                    style={{ backgroundColor: ui.inner }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </SectionCard>

            <SectionCard step={6} title="Additional notes" ui={ui}>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={field}
                style={fieldStyle}
              />
            </SectionCard>
          </div>

          {/* ─── Patient + actions (sticky) ──────────── */}
          <aside
            className="space-y-5 rounded-[28px] p-5 sm:p-6 lg:sticky lg:top-24"
            style={{ backgroundColor: `${PRIMARY_COLOR}26` }}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                {initialsOf(patientName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{patientName}</p>
                {admission.patient?.mrn && (
                  <p className="font-mono text-xs opacity-60">
                    {admission.patient.mrn}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {[
                ["Ward", admission.ward?.name || "Ward"],
                ["Bed", admission.bedCode],
                [
                  "Admitted",
                  new Date(admission.admittedAt).toLocaleDateString(),
                ],
                [
                  "Length of stay",
                  `${stayDays} day${stayDays === 1 ? "" : "s"}`,
                ],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-xs"
                  style={{ backgroundColor: ui.card }}
                >
                  <span className="opacity-55">{k}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={submit}
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <LogOut size={15} />
                {submitting ? "Discharging…" : "Discharge patient"}
              </button>
              <Link
                href="/dashboard/wards/discharges"
                className="w-full rounded-full px-6 py-3 text-center text-sm font-medium transition-opacity hover:opacity-70"
                style={{ backgroundColor: ui.card }}
              >
                Cancel
              </Link>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  /* ─── Summaries list ───────────────────────────────── */
  const tabs = [
    { href: "/dashboard/wards", label: "Wards" },
    { href: "/dashboard/wards/admissions", label: "Admissions" },
    { href: "/dashboard/wards/nursing", label: "Care plans" },
  ];

  return (
    <div
      className="mx-auto max-w-6xl space-y-6 px-3 py-5 sm:px-6"
      style={{ color: ui.text }}
    >
      {/* Currently admitted */}
      {admissions.length > 0 && (
        <section
          className="space-y-4 rounded-[28px] p-5 sm:p-6"
          style={{ backgroundColor: `${PRIMARY_COLOR}26` }}
        >
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-medium tracking-tight">
              Ready to go home
            </h2>
            <span
              className="rounded-full px-3 py-1 text-sm"
              style={{ backgroundColor: ui.card }}
            >
              {admissions.length}
            </span>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {admissions.map((a: any) => {
              const name = personName(a.patient);
              return (
                <Link
                  key={a._id}
                  href={`/dashboard/wards/discharges?admissionId=${a._id}`}
                  className="flex items-center gap-3 rounded-3xl p-3.5 transition-opacity hover:opacity-85"
                  style={{ backgroundColor: ui.card }}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      backgroundColor: `${PRIMARY_COLOR}26`,
                      color: PRIMARY_COLOR,
                    }}
                  >
                    {initialsOf(name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{name}</p>
                    <p className="truncate text-xs opacity-55">
                      {a.ward?.name || "Ward"} · {a.bedCode}
                    </p>
                  </div>
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: ui.inner }}
                  >
                    <ChevronRight size={14} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Summaries */}
      <section
        className="space-y-5 rounded-[28px] p-5 sm:p-6"
        style={{ backgroundColor: ui.card }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-medium tracking-tight">
                Discharge summaries
              </h1>
              <span
                className="rounded-full px-3 py-1 text-sm"
                style={{ backgroundColor: ui.inner }}
              >
                {discharges.length}
              </span>
            </div>
            <p className="mt-1 text-xs opacity-55">
              Records of every completed stay.
            </p>
          </div>

          <div
            className="flex min-w-[240px] items-center gap-2 rounded-full px-4 py-2.5"
            style={{ backgroundColor: ui.inner }}
          >
            <Search size={14} className="shrink-0 opacity-50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patient, MRN or diagnosis…"
              className="w-full bg-transparent text-xs outline-none"
              style={{ color: ui.text }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="opacity-50 hover:opacity-100"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {loading && discharges.length === 0 ? (
          <div className="py-16 text-center text-sm opacity-55">
            Loading discharge summaries…
          </div>
        ) : shown.length === 0 ? (
          <div
            className="rounded-3xl py-14 text-center text-xs opacity-60"
            style={{ backgroundColor: ui.inner }}
          >
            No discharge summaries yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {shown.map((d: any) => {
              const name = personName(d.patient);
              return (
                <Link
                  key={d._id}
                  href={`/dashboard/wards/discharges/${d._id}`}
                  className="grid items-center gap-3 rounded-3xl p-4 transition-opacity hover:opacity-85 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto] lg:gap-5"
                  style={{ backgroundColor: ui.inner }}
                >
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
                      <p className="truncate text-[15px] font-semibold">
                        {name}
                      </p>
                      {d.patient?.mrn && (
                        <p className="truncate font-mono text-xs opacity-55">
                          {d.patient.mrn}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium">
                      {d.diagnosis || "No diagnosis recorded"}
                    </p>
                    <p className="truncate text-xs opacity-55">
                      {d.admission?.ward?.name || "Ward"}
                      {d.admission?.bedCode ? ` · ${d.admission.bedCode}` : ""}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p className="opacity-60">
                      {new Date(d.dischargedAt).toLocaleString()}
                    </p>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
                      style={{ backgroundColor: ui.card }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                      />
                      {DISPOSITION_LABEL[d.disposition || "home"] ||
                        d.disposition}
                    </span>
                  </div>

                  <span
                    className="hidden h-9 w-9 items-center justify-center rounded-full lg:flex"
                    style={{ backgroundColor: ui.card }}
                  >
                    <ChevronRight size={15} />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function DischargesPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-sm opacity-55">Loading…</div>
      }
    >
      <DischargesInner />
    </Suspense>
  );
}
