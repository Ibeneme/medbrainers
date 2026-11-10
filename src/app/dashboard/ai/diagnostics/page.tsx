"use client";

import { useState } from "react";
import { AlertTriangle, ClipboardList, FlaskConical, HelpCircle, Sparkles, Stethoscope, Zap } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { clearAiResult, runAiDiagnosis, type DiagnosisPayload } from "@/api/slices";
import type { Patient } from "@/api/types";
import { useFacilityId } from "@/hooks/useFacilityId";
import { CustomDropdown } from "@/components/ui";
import type { GuideItem } from "@/components/ui/PageGuide";
import { ErrorBanner, Section, inputCls, labelCls, useInputStyle, usePageUI } from "@/components/dashboard/PageFrame";
import {
  AccessNotices,
  AiPage,
  BulletList,
  Chip,
  Disclaimer,
  LEVEL_COLOR,
  LIKELIHOOD_COLOR,
  Pill,
  PatientPicker,
  SubmitButton,
  Toggle,
  URGENCY_COLOR,
  VitalsFields,
  cleanVitals,
  titleCase,
  useAiAccess,
  type VitalsForm,
} from "@/components/ai/ai-ui";

const guideItems: GuideItem[] = [
  {
    title: "Describe the Presentation",
    description:
      "Enter the symptoms in your own words. The more detail on onset, severity and associated features, the better the differential.",
  },
  {
    title: "Link a Patient (Optional)",
    description:
      "Choosing a patient adds their age, allergies, diagnoses, medicines and latest vitals automatically. Names and contacts are never sent to the AI.",
  },
  {
    title: "Red Flags First",
    description: "Dangerous conditions not to miss are shown at the top. Check them before relying on the ranked list.",
  },
  {
    title: "It's a Second Opinion",
    description: "Suggestions support your judgement, they don't replace it. Confirm any ICD code before using it.",
  },
];

const SEX_OPTIONS = [
  { label: "Not specified", value: "" },
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];
const COUNT_OPTIONS = ["3", "5", "7", "10"].map((v) => ({ label: `${v} possibilities`, value: v }));

export default function AiDiagnosticsPage() {
  const dispatch = useAppDispatch();
  const { ui, isDark, border, colors } = usePageUI();
  const inputStyle = useInputStyle();
  const { facilityId } = useFacilityId();
  const access = useAiAccess("diagnosis_helper");
  const { data, loading, error } = useAppSelector((s) => s.ai.diagnostics);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [pregnant, setPregnant] = useState(false);
  const [exam, setExam] = useState("");
  const [investigations, setInvestigations] = useState("");
  const [vitals, setVitals] = useState<VitalsForm>({});
  const [count, setCount] = useState("5");
  const [localError, setLocalError] = useState<string | null>(null);

  const dd = { isDark, colors, border };
  const blocked = !access.enabled || !access.allowed || !access.providerReady;
  const showPregnancy = patient ? patient.gender === "female" : sex === "female";

  const submit = () => {
    setLocalError(null);
    if (symptoms.trim().length < 5) {
      setLocalError("Describe the presenting symptoms (at least a few words).");
      return;
    }
    if (!facilityId) return;
    const payload: DiagnosisPayload = {
      patientId: patient?._id,
      symptoms: symptoms.trim(),
      duration: duration.trim() || undefined,
      examFindings: exam.trim() || undefined,
      investigations: investigations.trim() || undefined,
      vitals: cleanVitals(vitals),
      maxDifferentials: Number(count),
    };
    if (!patient) {
      if (age.trim() !== "") payload.ageYears = Math.max(0, Math.min(120, Math.round(Number(age))));
      if (sex) payload.sex = sex as DiagnosisPayload["sex"];
    }
    if (showPregnancy) payload.pregnant = pregnant;
    dispatch(runAiDiagnosis({ facilityId, payload }));
  };

  const reset = () => {
    dispatch(clearAiResult("diagnostics"));
    setSymptoms("");
    setDuration("");
    setExam("");
    setInvestigations("");
    setVitals({});
    setPregnant(false);
  };

  return (
    <AiPage
      title="AI Diagnosis Helper"
      subtitle="Get a ranked differential, red flags and suggested tests for a presentation."
      guideTitle="Diagnosis Helper Guide"
      guideItems={guideItems}
      loading={loading}
      loadingText="Analysing the presentation..."
    >
      <AccessNotices access={access} needsProvider />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        <Section icon={Stethoscope} title="Presentation" hint="What is the patient complaining of?">
          <div className="sm:col-span-2">
            <PatientPicker
              value={patient}
              onChange={setPatient}
              label="Patient (optional)"
              hint="Link a patient to include their allergies, diagnoses, medicines and latest vitals."
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Symptoms *</label>
            <textarea
              required
              rows={4}
              maxLength={4000}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. 3 days of fever with chills, headache and vomiting. No cough."
              className={`${inputCls} resize-none`}
              style={inputStyle}
            />
          </div>
          <div>
            <label className={labelCls}>Duration / onset</label>
            <input
              value={duration}
              maxLength={200}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 3 days, sudden onset"
              className={inputCls}
              style={inputStyle}
            />
          </div>
          <CustomDropdown label="Possibilities to list" value={count} options={COUNT_OPTIONS} onChange={setCount} {...dd} />

          {!patient && (
            <>
              <div>
                <label className={labelCls}>Age (years)</label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 34"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <CustomDropdown label="Sex" value={sex} options={SEX_OPTIONS} onChange={setSex} {...dd} />
            </>
          )}
          {showPregnancy && (
            <div className="sm:col-span-2">
              <Toggle
                checked={pregnant}
                onChange={setPregnant}
                label="Patient is pregnant"
                hint="Changes which conditions and tests are suggested."
              />
            </div>
          )}
        </Section>

        <Section icon={ClipboardList} title="Findings so far" hint="Optional, but it sharpens the result">
          <div className="sm:col-span-2">
            <label className={labelCls}>Examination findings</label>
            <textarea
              rows={2}
              maxLength={3000}
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              placeholder="e.g. Pale, mild jaundice, spleen palpable 2 cm below the costal margin"
              className={`${inputCls} resize-none`}
              style={inputStyle}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Investigations done</label>
            <textarea
              rows={2}
              maxLength={3000}
              value={investigations}
              onChange={(e) => setInvestigations(e.target.value)}
              placeholder="e.g. Malaria RDT positive, Hb 8.9 g/dL"
              className={`${inputCls} resize-none`}
              style={inputStyle}
            />
          </div>
          <div className="sm:col-span-2">
            <p className={labelCls}>Vitals{patient ? " (leave blank to use the patient's latest recorded vitals)" : ""}</p>
          </div>
          <VitalsFields value={vitals} onChange={setVitals} />
        </Section>

        <ErrorBanner message={localError || error} />

        <div className="flex justify-end gap-2 pt-1">
          {data && (
            <button
              type="button"
              onClick={reset}
              className="rounded-full px-6 py-3 text-xs font-semibold"
              style={{ backgroundColor: ui.card }}
            >
              New case
            </button>
          )}
          <SubmitButton busy={loading} disabled={blocked} icon={<Sparkles size={14} />} busyLabel="Analysing...">
            Get differential
          </SubmitButton>
        </div>
      </form>

      {data && (
        <div className="space-y-4">
          {data.redFlags.length > 0 && (
            <Section
              icon={AlertTriangle}
              title="Red flags — don't miss"
              hint="Dangerous possibilities and warning features"
              grid={false}
            >
              <BulletList title="Check these first" items={data.redFlags} tone="danger" />
            </Section>
          )}

          {data.earlyWarning && (
            <Section
              icon={Zap}
              title="Early warning scores"
              hint="Calculated by rules from the vitals, not by the AI"
              grid={false}
            >
              <div className="flex flex-wrap gap-2">
                {data.earlyWarning.news2.applicable ? (
                  <Chip
                    color={
                      data.earlyWarning.news2.band === "high"
                        ? LEVEL_COLOR.critical
                        : data.earlyWarning.news2.band === "medium"
                        ? LEVEL_COLOR.high
                        : data.earlyWarning.news2.band === "low_medium"
                        ? LEVEL_COLOR.moderate
                        : LEVEL_COLOR.low
                    }
                  >
                    NEWS2 {data.earlyWarning.news2.score} · {titleCase(data.earlyWarning.news2.band)}
                  </Chip>
                ) : (
                  <Chip>NEWS2 not applicable</Chip>
                )}
                <Chip color={data.earlyWarning.qsofa.positive ? LEVEL_COLOR.critical : undefined}>
                  qSOFA {data.earlyWarning.qsofa.score}/3{data.earlyWarning.qsofa.positive ? " · positive" : ""}
                </Chip>
              </div>
              {data.earlyWarning.news2.applicable && (
                <p className="text-xs opacity-70">{data.earlyWarning.news2.response}</p>
              )}
            </Section>
          )}

          <Section
            icon={Stethoscope}
            title="Clinical impression"
            hint={data.patientContextUsed ? "Includes the linked patient's record" : "Based on the details entered"}
            grid={false}
          >
            {data.summary && <p className="text-sm leading-relaxed">{data.summary}</p>}

            <div className="space-y-3">
              {data.differentials.map((d, i) => (
                <div key={i} className="rounded-2xl p-4 space-y-2.5" style={{ backgroundColor: ui.inner }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">
                      {i + 1}. {d.condition}
                    </h3>
                    <Pill color={LIKELIHOOD_COLOR[d.likelihood]}>{d.likelihood} likelihood</Pill>
                  </div>
                  {d.rationale && <p className="text-xs leading-relaxed opacity-80">{d.rationale}</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {d.supportingFindings.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-50 mb-1">For</p>
                        <ul className="space-y-1 text-xs">
                          {d.supportingFindings.map((t, k) => (
                            <li key={k}>+ {t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {d.againstFindings.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-50 mb-1">Against</p>
                        <ul className="space-y-1 text-xs">
                          {d.againstFindings.map((t, k) => (
                            <li key={k}>− {t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {d.icdSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {d.icdSuggestions.map((c) => (
                        <span key={c.code} className="rounded-md px-2 py-1 text-[11px]" style={{ backgroundColor: ui.card }}>
                          <span className="font-semibold">{c.code}</span> · {c.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {data.icdNote && data.differentials.some((d) => d.icdSuggestions.length > 0) && (
              <p className="text-[11px] opacity-50">{data.icdNote}</p>
            )}
          </Section>

          {data.recommendedTests.length > 0 && (
            <Section icon={FlaskConical} title="Suggested tests" hint="To confirm or rule out the above" grid={false}>
              <div className="space-y-2">
                {data.recommendedTests.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-3 rounded-2xl p-3.5"
                    style={{ backgroundColor: ui.inner }}
                  >
                    <div>
                      <p className="text-sm font-medium">{t.test}</p>
                      {t.reason && <p className="text-xs opacity-65 mt-0.5">{t.reason}</p>}
                    </div>
                    <Pill color={URGENCY_COLOR[t.urgency]}>{t.urgency}</Pill>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {(data.immediateActions.length > 0 || data.questionsToAsk.length > 0 || data.limitations.length > 0) && (
            <Section icon={HelpCircle} title="Next steps" grid={false}>
              <BulletList title="Immediate actions" items={data.immediateActions} />
              <BulletList title="Questions that would narrow it down" items={data.questionsToAsk} />
              <BulletList title="Limitations" items={data.limitations} />
            </Section>
          )}

          <Disclaimer text={data.disclaimer} />
        </div>
      )}
    </AiPage>
  );
}
