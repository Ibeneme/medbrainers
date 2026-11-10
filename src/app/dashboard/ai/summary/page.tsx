"use client";

import { useState } from "react";
import { Activity, AlertTriangle, BedDouble, Copy, FileText, FlaskConical, Pill as PillIcon, Sparkles, Stethoscope } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { clearAiResult, runAiSummary, type SummaryResult } from "@/api/slices";
import type { Patient } from "@/api/types";
import { useFacilityId } from "@/hooks/useFacilityId";
import { useToast } from "@/contexts/toast-context";
import { CustomDropdown } from "@/components/ui";
import type { GuideItem } from "@/components/ui/PageGuide";
import { ErrorBanner, Section, usePageUI } from "@/components/dashboard/PageFrame";
import {
  AccessNotices,
  AiLayerNote,
  AiPage,
  BulletList,
  Chip,
  Disclaimer,
  PatientPicker,
  SubmitButton,
  Toggle,
  fmtDay,
  fmtDateTime,
  titleCase,
  useAiAccess,
} from "@/components/ai/ai-ui";

const guideItems: GuideItem[] = [
  {
    title: "Pick a Patient",
    description: "Search by name or MRN. The summary is built from that patient's chart in this facility only.",
  },
  {
    title: "Choose the Purpose",
    description:
      "General for opening the chart, Handover for shift change, Referral for the receiving specialist, Discharge for the discharge note.",
  },
  {
    title: "Facts vs. Narrative",
    description:
      "The facts (allergies, diagnoses, vitals, labs, medicines) come straight from the record. The short written narrative is AI-generated and can be turned off.",
  },
  {
    title: "Check Before Sharing",
    description: "Always review the summary against the chart before copying it into a letter or handover.",
  },
];

const FOCUS_OPTIONS = [
  { label: "General overview", value: "general" },
  { label: "Shift handover", value: "handover" },
  { label: "Referral", value: "referral" },
  { label: "Discharge", value: "discharge" },
];

const VITAL_LABELS: Array<[keyof NonNullable<SummaryResult["summary"]["latestVitals"]>, string, string]> = [
  ["temperatureC", "Temp", "°C"],
  ["pulse", "Pulse", "/min"],
  ["bpSystolic", "BP sys", ""],
  ["bpDiastolic", "BP dia", ""],
  ["respiratoryRate", "Resp", "/min"],
  ["spo2", "SpO₂", "%"],
  ["weightKg", "Weight", "kg"],
  ["bloodGlucose", "Glucose", ""],
];

function toPlainText(patient: Patient | null, d: SummaryResult): string {
  const s = d.summary;
  const lines: string[] = [];
  const who = [s.patient.ageYears !== null ? `${s.patient.ageYears}y` : "", s.patient.sex, s.patient.bloodGroup].filter(Boolean).join(", ");
  lines.push(`Clinical summary${patient ? ` — ${patient.firstName} ${patient.lastName} (${patient.mrn})` : ""}${who ? ` [${who}]` : ""}`);
  if (d.ai.headline) lines.push(d.ai.headline);
  if (d.ai.narrative) lines.push("", d.ai.narrative);
  const list = (title: string, items?: string[]) => items?.length && lines.push("", `${title}:`, ...items.map((i) => `- ${i}`));
  list("Allergies", s.allergies.map((a) => `${a.substance}${a.severity ? ` (${a.severity})` : ""}${a.reaction ? ` – ${a.reaction}` : ""}`));
  list("Active diagnoses", s.activeDiagnoses.map((x) => `${x.title}${x.icd11Code ? ` [${x.icd11Code}]` : ""}`));
  list("Recent medicines", s.recentMedications.map((m) => [m.name, m.dosage, m.frequency].filter(Boolean).join(" ")));
  list("Key problems", d.ai.keyProblems);
  list("Current treatment", d.ai.currentTreatment);
  list("Outstanding", d.ai.outstanding);
  list("Watch points", d.ai.watchPoints);
  lines.push("", "(AI-assisted summary — verify against the patient record.)");
  return lines.join("\n");
}

export default function AiSummaryPage() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { ui, isDark, border, colors } = usePageUI();
  const { facilityId } = useFacilityId();
  const access = useAiAccess("record_summary");
  const { data, loading, error } = useAppSelector((s) => s.ai.summary);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [focus, setFocus] = useState("general");
  const [includeAi, setIncludeAi] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const blocked = !access.enabled || !access.allowed;

  const submit = () => {
    setLocalError(null);
    if (!patient) {
      setLocalError("Choose a patient first.");
      return;
    }
    if (!facilityId) return;
    dispatch(
      runAiSummary({
        facilityId,
        payload: { patientId: patient._id, focus: focus as "general", includeAi: includeAi && access.providerReady },
      })
    );
  };

  const copy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(toPlainText(patient, data));
      showToast("Summary copied", "success");
    } catch {
      showToast("Could not copy. Select the text manually.", "error");
    }
  };

  const s = data?.summary;
  const vitals = s?.latestVitals;
  const abnormalLabs = s?.recentLabs.filter((l) => l.abnormal).length ?? 0;

  return (
    <AiPage
      title="Medical Record Summary"
      subtitle="A clear, current summary of a patient's chart for handover, referral or discharge."
      guideTitle="Record Summary Guide"
      guideItems={guideItems}
      loading={loading}
      loadingText="Summarising the record..."
    >
      <AccessNotices access={access} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        <Section icon={FileText} title="Summary request" hint="Who is it for, and what is it for?">
          <div className="sm:col-span-2">
            <PatientPicker value={patient} onChange={(p) => { setPatient(p); dispatch(clearAiResult("summary")); }} required />
          </div>
          <CustomDropdown
            label="Purpose"
            value={focus}
            options={FOCUS_OPTIONS}
            onChange={setFocus}
            isDark={isDark}
            colors={colors}
            border={border}
          />
          <div className="self-end">
            <Toggle
              checked={includeAi && access.providerReady}
              onChange={setIncludeAi}
              label="Written narrative"
              hint={access.providerReady ? "AI writes a short readable summary" : "AI not configured"}
            />
          </div>
        </Section>

        <ErrorBanner message={localError || error} />

        <div className="flex justify-end">
          <SubmitButton busy={loading} disabled={blocked} icon={<Sparkles size={14} />} busyLabel="Summarising...">
            Summarise record
          </SubmitButton>
        </div>
      </form>

      {data && s && (
        <div className="space-y-4">
          {(data.ai.headline || data.ai.narrative) && (
            <Section
              icon={FileText}
              title={data.ai.headline || "Summary"}
              hint={`${titleCase(data.ai.focus || focus)} summary`}
              grid={false}
              right={
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold"
                  style={{ backgroundColor: ui.inner }}
                >
                  <Copy size={13} /> Copy
                </button>
              }
            >
              {data.ai.narrative && <p className="text-sm leading-relaxed">{data.ai.narrative}</p>}
              <BulletList title="Key problems" items={data.ai.keyProblems} />
              <BulletList title="Current treatment" items={data.ai.currentTreatment} />
              <BulletList title="Watch points" items={data.ai.watchPoints} tone="danger" />
              <BulletList title="Outstanding / unknown" items={data.ai.outstanding} />
              <BulletList title="Gaps in the record" items={data.ai.limitations} />
            </Section>
          )}
          <AiLayerNote layer={data.ai} />

          <Section icon={Stethoscope} title="Patient snapshot" hint="Straight from the record" grid={false}>
            <div className="flex flex-wrap gap-2">
              {s.patient.ageYears !== null && <Chip>{s.patient.ageYears} years</Chip>}
              {s.patient.sex && <Chip>{titleCase(s.patient.sex)}</Chip>}
              {s.patient.bloodGroup && <Chip>Blood group {s.patient.bloodGroup}</Chip>}
              {s.patient.status && <Chip>{titleCase(s.patient.status)}</Chip>}
            </div>

            {s.currentAdmission && (
              <div className="flex items-start gap-3 rounded-2xl p-4" style={{ backgroundColor: ui.inner }}>
                <BedDouble size={18} className="mt-0.5 shrink-0 opacity-70" />
                <div className="text-sm">
                  <p className="font-medium">Currently admitted · since {fmtDay(s.currentAdmission.admittedAt)}</p>
                  {(s.currentAdmission.admittingDiagnosis || s.currentAdmission.reason) && (
                    <p className="text-xs opacity-70 mt-0.5">{s.currentAdmission.admittingDiagnosis || s.currentAdmission.reason}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-red-500">
                <AlertTriangle size={12} /> Allergies
              </p>
              {s.allergies.length === 0 ? (
                <p className="text-xs opacity-60">None recorded. This does not confirm there are none.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {s.allergies.map((a, i) => (
                    <Chip key={i} color="#dc2626">
                      {a.substance}
                      {a.severity ? ` · ${titleCase(a.severity)}` : ""}
                      {a.reaction ? ` · ${a.reaction}` : ""}
                    </Chip>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide opacity-60">Active diagnoses</p>
              {s.activeDiagnoses.length === 0 ? (
                <p className="text-xs opacity-60">No active diagnoses on record.</p>
              ) : (
                <div className="space-y-2">
                  {s.activeDiagnoses.map((d, i) => (
                    <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3" style={{ backgroundColor: ui.inner }}>
                      <p className="text-sm font-medium">{d.title}</p>
                      <p className="text-[11px] opacity-60">
                        {[d.icd11Code, titleCase(d.status), titleCase(d.certainty), d.since ? `since ${fmtDay(d.since)}` : ""].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          <Section
            icon={Activity}
            title="Latest vitals"
            hint={vitals?.recordedAt ? `Recorded ${fmtDateTime(vitals.recordedAt)}` : "No vitals recorded"}
            grid={false}
          >
            {vitals ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {VITAL_LABELS.filter(([k]) => vitals[k] !== undefined && vitals[k] !== null).map(([k, label, unit]) => (
                  <div key={k} className="rounded-2xl p-3.5" style={{ backgroundColor: ui.inner }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide opacity-50">{label}</p>
                    <p className="mt-1 text-lg font-semibold">
                      {String(vitals[k])}
                      <span className="ml-1 text-[11px] font-normal opacity-60">{unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs opacity-60">No vitals have been recorded for this patient yet.</p>
            )}
          </Section>

          <Section icon={PillIcon} title="Recent medicines" hint="Prescribed in the last 90 days (finished courses may be included)" grid={false}>
            {s.recentMedications.length === 0 ? (
              <p className="text-xs opacity-60">No recent prescriptions.</p>
            ) : (
              <div className="space-y-2">
                {s.recentMedications.map((m, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3" style={{ backgroundColor: ui.inner }}>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-[11px] opacity-60">
                      {[m.dosage, m.frequency, m.route, m.prescribedAt ? fmtDay(m.prescribedAt) : ""].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section
            icon={FlaskConical}
            title="Recent lab results"
            hint={abnormalLabs ? `${abnormalLabs} abnormal result(s) shown first` : "Latest resulted tests"}
            grid={false}
          >
            {s.recentLabs.length === 0 ? (
              <p className="text-xs opacity-60">No resulted lab tests.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl" style={{ backgroundColor: ui.inner }}>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="opacity-55">
                      <th className="px-4 py-2.5 font-semibold">Test</th>
                      <th className="px-4 py-2.5 font-semibold">Result</th>
                      <th className="px-4 py-2.5 font-semibold">Reference</th>
                      <th className="px-4 py-2.5 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.recentLabs.map((l, i) => (
                      <tr key={i} className="border-t" style={{ borderColor: border }}>
                        <td className="px-4 py-2.5 font-medium">{l.test}</td>
                        <td className="px-4 py-2.5 font-semibold" style={{ color: l.abnormal ? "#dc2626" : undefined }}>
                          {l.value} {l.unit}
                          {l.abnormal ? " ⚠" : ""}
                        </td>
                        <td className="px-4 py-2.5 opacity-70">{l.referenceRange || "—"}</td>
                        <td className="px-4 py-2.5 opacity-70">{fmtDay(l.at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {s.recentConsultations.length > 0 && (
            <Section icon={Stethoscope} title="Recent consultations" grid={false}>
              <div className="space-y-2">
                {s.recentConsultations.map((c, i) => (
                  <div key={i} className="rounded-2xl px-4 py-3" style={{ backgroundColor: ui.inner }}>
                    <p className="text-[11px] opacity-55">{fmtDay(c.date)}</p>
                    {c.complaint && <p className="text-sm mt-0.5">{c.complaint}</p>}
                    {c.diagnosis && (
                      <p className="text-xs opacity-70 mt-0.5">
                        Dx: {c.diagnosis}
                        {c.icdCode ? ` [${c.icdCode}]` : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          <p className="text-[11px] opacity-50 px-1">
            Based on {s.dataCoverage.consultations} consultation(s), {s.dataCoverage.vitalsReadings} vitals reading(s),{" "}
            {s.dataCoverage.diagnoses} diagnosis record(s), {s.dataCoverage.labResults} lab result(s) and{" "}
            {s.dataCoverage.medications} medicine(s).
          </p>
          <Disclaimer text={data.disclaimer} />
        </div>
      )}
    </AiPage>
  );
}
