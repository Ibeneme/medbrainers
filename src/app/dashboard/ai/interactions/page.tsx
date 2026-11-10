"use client";

import { useState } from "react";
import { AlertOctagon, CheckCircle2, Pill as PillIcon, Plus, ShieldAlert, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { clearAiResult, runAiMedicationCheck, type MedicationResult } from "@/api/slices";
import type { Patient } from "@/api/types";
import { useFacilityId } from "@/hooks/useFacilityId";
import type { GuideItem } from "@/components/ui/PageGuide";
import { ErrorBanner, Section, inputCls, labelCls, useInputStyle, usePageUI } from "@/components/dashboard/PageFrame";
import {
  AccessNotices,
  AiLayerNote,
  AiPage,
  Chip,
  Disclaimer,
  MED_COLOR,
  Notice,
  PatientPicker,
  Pill,
  SubmitButton,
  Toggle,
  titleCase,
  useAiAccess,
} from "@/components/ai/ai-ui";

const guideItems: GuideItem[] = [
  {
    title: "List the Medicines",
    description: "Type each medicine you plan to give (brand or generic, e.g. Augmentin or amoxicillin-clavulanate). Add dose and frequency if you like.",
  },
  {
    title: "Link a Patient (Optional)",
    description:
      "With a patient, we also check their recorded allergies and their recent prescriptions, so you see clashes with what they already take.",
  },
  {
    title: "Read the Colours",
    description:
      "Red means do not combine, orange means major, amber means moderate, blue means be cautious. Allergy matches include related drugs in the same family.",
  },
  {
    title: "No Alert ≠ Safe",
    description:
      "The built-in rules cover common high-risk problems, not every drug. Medicines we don't recognise are listed so you know they weren't checked by the rules.",
  },
];

type Row = { name: string; dose: string; frequency: string };
const blankRow = (): Row => ({ name: "", dose: "", frequency: "" });

const STATUS: Record<MedicationResult["status"], { color: string; title: string; text: string; icon: typeof ShieldCheck }> = {
  stop: {
    color: "#dc2626",
    title: "Do not proceed as written",
    text: "A contraindicated combination or a serious allergy conflict was found.",
    icon: AlertOctagon,
  },
  review: {
    color: "#ea580c",
    title: "Review before prescribing",
    text: "Major problems were found. A prescriber or pharmacist should review them.",
    icon: ShieldAlert,
  },
  caution: {
    color: "#d97706",
    title: "Proceed with caution",
    text: "Moderate issues were found. Consider monitoring or an alternative.",
    icon: ShieldAlert,
  },
  no_issues_found: {
    color: "#10b981",
    title: "No issues found by the checks",
    text: "This is not a guarantee of safety. Always apply clinical judgement.",
    icon: CheckCircle2,
  },
};

const TYPE_LABEL = { allergy: "Allergy", interaction: "Interaction", duplicate_therapy: "Duplicate therapy" } as const;

export default function AiInteractionsPage() {
  const dispatch = useAppDispatch();
  const { ui, border } = usePageUI();
  const inputStyle = useInputStyle();
  const { facilityId } = useFacilityId();
  const access = useAiAccess("medication_safety");
  const { data, loading, error } = useAppSelector((s) => s.ai.interactions);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [rows, setRows] = useState<Row[]>([blankRow()]);
  const [allergies, setAllergies] = useState("");
  const [includeRecent, setIncludeRecent] = useState(true);
  const [includeAi, setIncludeAi] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const blocked = !access.enabled || !access.allowed;
  const setRow = (i: number, patch: Partial<Row>) => setRows((r) => r.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  const submit = () => {
    setLocalError(null);
    if (!facilityId) return;
    const meds = rows
      .map((r) => ({ name: r.name.trim(), dose: r.dose.trim() || undefined, frequency: r.frequency.trim() || undefined }))
      .filter((m) => m.name.length >= 2);
    if (!patient && meds.length === 0) {
      setLocalError("Add at least one medicine, or choose a patient to review their recent prescriptions.");
      return;
    }
    if (rows.some((r) => r.name.trim().length === 1)) {
      setLocalError("Medicine names need at least 2 characters.");
      return;
    }
    const extra = allergies
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length >= 2);
    dispatch(
      runAiMedicationCheck({
        facilityId,
        payload: {
          patientId: patient?._id,
          medications: meds.length ? meds : undefined,
          includeRecentPrescriptions: patient ? includeRecent : undefined,
          allergies: extra.length ? extra : undefined,
          includeAi: includeAi && access.providerReady,
        },
      })
    );
  };

  const st = data ? STATUS[data.status] : null;

  return (
    <AiPage
      title="Medication Safety Check"
      subtitle="Check for allergies, interactions and duplicate therapy before prescribing."
      guideTitle="Medication Safety Guide"
      guideItems={guideItems}
      loading={loading}
      loadingText="Checking medicines..."
    >
      <AccessNotices access={access} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        <Section icon={PillIcon} title="Medicines to check" hint="Brand or generic names both work" grid={false}>
          <PatientPicker
            value={patient}
            onChange={(p) => {
              setPatient(p);
              dispatch(clearAiResult("interactions"));
            }}
            label="Patient (optional)"
            hint="Adds the patient's allergies and recent prescriptions to the check."
          />

          <div className="space-y-2.5">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <div className="col-span-12 sm:col-span-5">
                  {i === 0 && <label className={labelCls}>Medicine</label>}
                  <input
                    value={r.name}
                    maxLength={120}
                    onChange={(e) => setRow(i, { name: e.target.value })}
                    placeholder="e.g. Warfarin"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
                <div className="col-span-5 sm:col-span-3">
                  {i === 0 && <label className={labelCls}>Dose</label>}
                  <input
                    value={r.dose}
                    maxLength={60}
                    onChange={(e) => setRow(i, { dose: e.target.value })}
                    placeholder="e.g. 5 mg"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
                <div className="col-span-5 sm:col-span-3">
                  {i === 0 && <label className={labelCls}>Frequency</label>}
                  <input
                    value={r.frequency}
                    maxLength={60}
                    onChange={(e) => setRow(i, { frequency: e.target.value })}
                    placeholder="e.g. daily"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
                <div className={`col-span-2 sm:col-span-1 flex ${i === 0 ? "items-end" : "items-center"}`}>
                  <button
                    type="button"
                    aria-label="Remove medicine"
                    disabled={rows.length === 1 && !r.name}
                    onClick={() => setRows((x) => (x.length === 1 ? [blankRow()] : x.filter((_, k) => k !== i)))}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl opacity-70 hover:opacity-100 disabled:opacity-30"
                    style={{ backgroundColor: ui.inner }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
            {rows.length < 30 && (
              <button
                type="button"
                onClick={() => setRows((x) => [...x, blankRow()])}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold"
                style={{ backgroundColor: ui.inner }}
              >
                <Plus size={13} /> Add another medicine
              </button>
            )}
          </div>

          <div>
            <label className={labelCls}>Extra allergies to consider (comma separated)</label>
            <input
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder={patient ? "Only if not already on the patient's record" : "e.g. penicillin, sulfa"}
              className={inputCls}
              style={inputStyle}
            />
          </div>

          {patient && (
            <Toggle
              checked={includeRecent}
              onChange={setIncludeRecent}
              label="Include the patient's recent prescriptions"
              hint="Last 90 days, not cancelled. Finished courses may be included."
            />
          )}
          <Toggle
            checked={includeAi && access.providerReady}
            onChange={setIncludeAi}
            label="AI second check"
            hint={access.providerReady ? "Looks for issues the built-in rules may miss. Needs pharmacist verification." : "AI not configured"}
          />
        </Section>

        <ErrorBanner message={localError || error} />

        <div className="flex justify-end">
          <SubmitButton busy={loading} disabled={blocked} icon={<Sparkles size={14} />} busyLabel="Checking...">
            Check safety
          </SubmitButton>
        </div>
      </form>

      {data && st && (
        <div className="space-y-4">
          <div className="flex items-start gap-4 rounded-[28px] p-5 sm:p-6" style={{ backgroundColor: `${st.color}14` }}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${st.color}26`, color: st.color }}>
              <st.icon size={20} />
            </span>
            <div>
              <h2 className="text-lg font-medium tracking-tight" style={{ color: st.color }}>
                {st.title}
              </h2>
              <p className="text-xs opacity-75 mt-0.5">{st.text}</p>
              <p className="text-[11px] opacity-60 mt-2">
                {data.checked.length} medicine(s) checked
                {data.patientContextUsed ? ` · ${data.allergiesChecked} allergy record(s) considered` : ""}
              </p>
            </div>
          </div>

          {data.findings.length > 0 && (
            <Section icon={ShieldAlert} title={`Findings (${data.findings.length})`} hint="Most serious first" grid={false}>
              <div className="space-y-3">
                {data.findings.map((f, i) => (
                  <div key={i} className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: ui.inner, borderLeft: `4px solid ${MED_COLOR[f.severity]}` }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill color={MED_COLOR[f.severity]}>{f.severity}</Pill>
                      <Pill color="#64748b">{TYPE_LABEL[f.type]}</Pill>
                      {f.source === "ai" && <Pill color="#8b5cf6">AI-suggested</Pill>}
                      {f.origin === "existing" && <Pill color="#0ea5e9">current medicines</Pill>}
                    </div>
                    {f.drugs.length > 0 && <p className="text-sm font-semibold">{f.drugs.join("  +  ")}</p>}
                    <p className="text-sm leading-relaxed">{f.message}</p>
                    {f.recommendation && (
                      <p className="text-xs leading-relaxed opacity-75">
                        <span className="font-semibold">What to do: </span>
                        {f.recommendation}
                      </p>
                    )}
                    {f.source === "ai" && <p className="text-[11px] opacity-55">Verify with a pharmacist or prescriber.</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {data.unrecognised.length > 0 && (
            <Notice tone="warn">
              <p className="font-semibold">Not recognised by the built-in rules: {data.unrecognised.join(", ")}</p>
              {data.unrecognisedNote && <p className="mt-0.5 opacity-90">{data.unrecognisedNote}</p>}
            </Notice>
          )}
          <AiLayerNote layer={data.ai} />
          {data.ai.used && data.ai.limitations && data.ai.limitations.length > 0 && (
            <p className="text-[11px] opacity-55 px-1">AI limitations: {data.ai.limitations.join(" ")}</p>
          )}

          <Section icon={ShieldCheck} title="What was checked" hint="Names matched to generic drugs and classes" grid={false}>
            <div className="overflow-x-auto rounded-2xl" style={{ backgroundColor: ui.inner }}>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="opacity-55">
                    <th className="px-4 py-2.5 font-semibold">As entered</th>
                    <th className="px-4 py-2.5 font-semibold">Matched to</th>
                    <th className="px-4 py-2.5 font-semibold">Class</th>
                    <th className="px-4 py-2.5 font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {data.checked.map((c, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: border }}>
                      <td className="px-4 py-2.5 font-medium">{c.input}</td>
                      <td className="px-4 py-2.5">{c.generic ? titleCase(c.generic.replace(/-/g, " ")) : <span className="opacity-50">not recognised</span>}</td>
                      <td className="px-4 py-2.5 opacity-70">{c.classes.length ? c.classes.map((x) => titleCase(x)).join(", ") : "—"}</td>
                      <td className="px-4 py-2.5">
                        <Chip>{c.origin === "existing" ? "Recent Rx" : "Entered"}</Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Disclaimer text={data.disclaimer} />
        </div>
      )}
    </AiPage>
  );
}
