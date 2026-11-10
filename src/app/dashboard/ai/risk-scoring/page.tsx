"use client";

import { useState } from "react";
import { Activity, AlertTriangle, ChevronDown, HeartPulse, Sparkles, Sparkle, TrendingUp } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { clearAiResult, runAiRiskScoring } from "@/api/slices";
import type { Patient } from "@/api/types";
import { useFacilityId } from "@/hooks/useFacilityId";
import type { GuideItem } from "@/components/ui/PageGuide";
import { ErrorBanner, Section, usePageUI } from "@/components/dashboard/PageFrame";
import {
  AccessNotices,
  AiLayerNote,
  AiPage,
  BulletList,
  Chip,
  Disclaimer,
  LEVEL_COLOR,
  Notice,
  PatientPicker,
  Pill,
  SubmitButton,
  Toggle,
  VitalsFields,
  cleanVitals,
  titleCase,
  useAiAccess,
  type VitalsForm,
} from "@/components/ai/ai-ui";

const guideItems: GuideItem[] = [
  {
    title: "Pick a Patient",
    description: "Scores use the patient's latest recorded vitals plus their age, conditions, medicines and recent lab results.",
  },
  {
    title: "NEWS2 & qSOFA",
    description:
      "These are published early-warning scores worked out by fixed rules, not guessed by the AI. They show how sick the patient is right now.",
  },
  {
    title: "Background Risk",
    description:
      "A simple, transparent points tally (age, number of conditions, many medicines, abnormal labs, high BP or sugar). It is a screening aid, not a prediction of outcome.",
  },
  {
    title: "Fresh Vitals Matter",
    description:
      "If the latest vitals are old, enter current ones under 'Use different vitals' so the scores reflect now.",
  },
];

const NEWS_COLOR = { low: LEVEL_COLOR.low, low_medium: LEVEL_COLOR.moderate, medium: LEVEL_COLOR.high, high: LEVEL_COLOR.critical } as const;
const PARAM_LABEL: Record<string, string> = {
  respiratoryRate: "Respiratory rate",
  spo2: "SpO₂",
  bpSystolic: "Systolic BP",
  pulse: "Pulse",
  temperatureC: "Temperature",
};
const scoreColor = (n: number) => (n >= 3 ? LEVEL_COLOR.critical : n === 2 ? LEVEL_COLOR.high : n === 1 ? LEVEL_COLOR.moderate : LEVEL_COLOR.low);

export default function AiRiskScoringPage() {
  const dispatch = useAppDispatch();
  const { ui, border } = usePageUI();
  const { facilityId } = useFacilityId();
  const access = useAiAccess("risk_scoring");
  const { data, loading, error } = useAppSelector((s) => s.ai.risk);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [useCustom, setUseCustom] = useState(false);
  const [vitals, setVitals] = useState<VitalsForm>({});
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
    const v = useCustom ? cleanVitals(vitals) : undefined;
    if (useCustom && !v) {
      setLocalError("Enter at least one vital sign, or switch back to the recorded vitals.");
      return;
    }
    dispatch(
      runAiRiskScoring({
        facilityId,
        payload: { patientId: patient._id, vitals: v, includeAi: includeAi && access.providerReady },
      })
    );
  };

  const sc = data?.scores;
  const overall = sc?.overall;

  return (
    <AiPage
      title="Health Risk Predictor"
      subtitle="Early-warning scores and a background risk screen for a patient."
      guideTitle="Risk Predictor Guide"
      guideItems={guideItems}
      loading={loading}
      loadingText="Calculating risk..."
    >
      <AccessNotices access={access} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        <Section icon={HeartPulse} title="Risk check" hint="Who should we assess?">
          <div className="sm:col-span-2">
            <PatientPicker
              value={patient}
              onChange={(p) => {
                setPatient(p);
                dispatch(clearAiResult("risk"));
              }}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => setUseCustom((v) => !v)}
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium"
              style={{ backgroundColor: ui.inner }}
            >
              <span>
                Use different vitals
                <span className="block text-[11px] font-normal opacity-55 mt-0.5">
                  {useCustom ? "These replace the recorded vitals for this check only" : "Otherwise the latest recorded vitals are used"}
                </span>
              </span>
              <ChevronDown size={16} className={`transition ${useCustom ? "rotate-180" : ""}`} />
            </button>
          </div>
          {useCustom && <VitalsFields value={vitals} onChange={setVitals} />}

          <div className="sm:col-span-2">
            <Toggle
              checked={includeAi && access.providerReady}
              onChange={setIncludeAi}
              label="AI interpretation"
              hint={access.providerReady ? "Plain-language explanation and suggested next steps" : "AI not configured"}
            />
          </div>
        </Section>

        <ErrorBanner message={localError || error} />

        <div className="flex justify-end">
          <SubmitButton busy={loading} disabled={blocked} icon={<Sparkles size={14} />} busyLabel="Calculating...">
            Assess risk
          </SubmitButton>
        </div>
      </form>

      {data && sc && overall && (
        <div className="space-y-4">
          {sc.warnings.map((w, i) => (
            <Notice key={i} tone="warn">
              {w}
            </Notice>
          ))}

          <Section icon={TrendingUp} title="Overall risk" hint="Higher of the acute and background levels" grid={false}>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="rounded-2xl px-5 py-2 text-lg font-semibold capitalize"
                style={{ backgroundColor: `${LEVEL_COLOR[overall.level]}22`, color: LEVEL_COLOR[overall.level] }}
              >
                {overall.level}
              </span>
              <div className="flex flex-wrap gap-2">
                <Chip color={LEVEL_COLOR[overall.acuteLevel]}>Acute: {overall.acuteLevel}</Chip>
                <Chip color={LEVEL_COLOR[overall.backgroundLevel]}>
                  Background: {overall.backgroundLevel} ({overall.backgroundPoints} pts)
                </Chip>
              </div>
            </div>

            {overall.drivers.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-60">What is driving it</p>
                {overall.drivers.map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5" style={{ backgroundColor: ui.inner }}>
                    <span className="text-sm">{d.label}</span>
                    <span className="text-[11px] font-semibold opacity-60">+{d.points}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs opacity-60">No risk drivers were found in the available data.</p>
            )}
            <p className="text-[11px] opacity-50 leading-relaxed">{overall.method}</p>
          </Section>

          <Section
            icon={Activity}
            title="Early warning scores"
            hint={sc.vitalsUsed ? `Vitals: ${sc.vitalsUsed.source}` : "No vitals available"}
            grid={false}
          >
            {sc.news2 ? (
              sc.news2.applicable ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip color={NEWS_COLOR[sc.news2.band]}>
                      NEWS2 {sc.news2.score} · {titleCase(sc.news2.band)}
                    </Chip>
                    {sc.news2.incomplete && <Pill color="#d97706">incomplete</Pill>}
                  </div>
                  <p className="text-sm">{sc.news2.response}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {sc.news2.parameters.map((p) => (
                      <div key={p.name} className="rounded-2xl p-3 text-center" style={{ backgroundColor: ui.inner }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-50">{PARAM_LABEL[p.name] || p.name}</p>
                        <p className="mt-1 text-base font-semibold">{p.value}</p>
                        <p className="mt-0.5 text-[11px] font-semibold" style={{ color: scoreColor(p.score) }}>
                          score {p.score}
                        </p>
                      </div>
                    ))}
                  </div>
                  {sc.news2.missing.length > 0 && (
                    <p className="text-[11px] opacity-60">Not recorded: {sc.news2.missing.map((m) => PARAM_LABEL[m] || m).join(", ")}</p>
                  )}
                </>
              ) : (
                <Notice tone="info">{sc.news2.note}</Notice>
              )
            ) : (
              <p className="text-xs opacity-60">NEWS2 needs vitals. None are on record.</p>
            )}

            <div className="rounded-2xl p-4 space-y-1.5" style={{ backgroundColor: ui.inner }}>
              <div className="flex flex-wrap items-center gap-2">
                <Chip color={sc.qsofa.positive ? LEVEL_COLOR.critical : sc.qsofa.indeterminate ? LEVEL_COLOR.moderate : LEVEL_COLOR.low}>
                  qSOFA {sc.qsofa.score}/3{sc.qsofa.positive ? " · positive" : sc.qsofa.indeterminate ? " · can't exclude" : ""}
                </Chip>
              </div>
              <p className="text-[11px] opacity-60">{sc.qsofa.note}</p>
            </div>
          </Section>

          {(sc.cardiometabolic.bmi !== null || sc.cardiometabolic.flags.length > 0) && (
            <Section icon={HeartPulse} title="Cardiometabolic flags" grid={false}>
              {sc.cardiometabolic.bmi !== null && (
                <Chip>
                  BMI {sc.cardiometabolic.bmi} · {sc.cardiometabolic.bmiCategory}
                </Chip>
              )}
              <BulletList title="Flags" items={sc.cardiometabolic.flags} />
            </Section>
          )}

          {(data.ai.narrative || data.ai.suggestedActions?.length) && (
            <Section icon={Sparkle} title="AI interpretation" hint="Explains the scores above, it does not change them" grid={false}>
              {data.ai.narrative && <p className="text-sm leading-relaxed">{data.ai.narrative}</p>}
              {data.ai.suggestedActions && data.ai.suggestedActions.length > 0 && (
                <div className="space-y-2">
                  {data.ai.suggestedActions.map((a, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 rounded-2xl p-3.5" style={{ backgroundColor: ui.inner }}>
                      <div>
                        <p className="text-sm font-medium">{a.action}</p>
                        {a.rationale && <p className="text-xs opacity-65 mt-0.5">{a.rationale}</p>}
                      </div>
                      <Pill color={a.priority === "immediate" ? LEVEL_COLOR.critical : a.priority === "soon" ? LEVEL_COLOR.moderate : "#64748b"}>
                        {a.priority}
                      </Pill>
                    </div>
                  ))}
                </div>
              )}
              <BulletList title="Monitoring" items={data.ai.monitoring} />
              <BulletList title="Limitations" items={data.ai.limitations} />
            </Section>
          )}
          <AiLayerNote layer={data.ai} />

          {sc.assumptions.length > 0 && (
            <details className="rounded-2xl px-4 py-3 text-xs" style={{ backgroundColor: ui.card, border: `1px solid ${border}` }}>
              <summary className="cursor-pointer font-semibold">
                <AlertTriangle size={12} className="mr-1.5 inline opacity-60" />
                Assumptions made in these scores
              </summary>
              <ul className="mt-2 space-y-1 opacity-70">
                {sc.assumptions.map((a, i) => (
                  <li key={i}>• {a}</li>
                ))}
              </ul>
            </details>
          )}

          <Disclaimer text={data.disclaimer} />
        </div>
      )}
    </AiPage>
  );
}
