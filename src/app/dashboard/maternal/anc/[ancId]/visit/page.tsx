"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { addAncVisit, fetchAncById } from "@/api/slices";
import {
  BASE, Card, SpecForm, bpFlag, clean, gaLabel, gestationDays, label, nameOf, num, quickDateField, toIso, toLocalInput,
  useForm, useMat, type SectionSpec,
} from "@/components/maternity/mat-ui";

const NIL = ["Nil", "Trace", "+", "++", "+++"];
const opts = (a: string[]) => [{ value: "", label: "Not tested" }, ...a.map((x) => ({ value: x, label: x }))];

export default function AncVisitPage() {
  const { ancId } = useParams() as { ancId: string };
  const { facilityId, act, router, maternity } = useMat();
  const r = maternity.activeAnc?._id === ancId ? maternity.activeAnc : null;

  const form = useForm<any>({
    visitDate: toLocalInput(), gestationalAge: "", complaints: "",
    weightKg: "", bpSystolic: "", bpDiastolic: "", fundalHeightCm: "", fetalHeartRate: "", haemoglobin: "",
    presentation: "", oedema: "", urineProtein: "", urineSugar: "",
    findings: "", advice: "", nextVisitDate: "",
  });
  const v = form.v;

  useEffect(() => {
    if (facilityId && !r) act(fetchAncById({ facilityId, id: ancId }), false);
  }, [facilityId, ancId, r, act]);

  /* default the GA field from LMP / EDD once, editable afterwards */
  const seeded = useRef(false);
  useEffect(() => {
    if (!r || seeded.current) return;
    seeded.current = true;
    const d = gestationDays(r);
    if (d !== undefined && d >= 0) form.set("gestationalAge", gaLabel(d));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r]);

  const sys = num(v.bpSystolic), dia = num(v.bpDiastolic), hb = num(v.haemoglobin), fhr = num(v.fetalHeartRate);
  const alerts: string[] = [];
  const bp = bpFlag(sys, dia);
  if (bp === "bad") alerts.push(`BP ${sys ?? "?"}/${dia ?? "?"} is in the severe range (≥160/110) — urgent review for severe pre-eclampsia.`);
  else if (bp === "warn") alerts.push(`BP ${sys ?? "?"}/${dia ?? "?"} is ≥140/90 — check urine protein and consider raising the risk level.`);
  if (bp && v.urineProtein && !["Nil", "Trace"].includes(v.urineProtein)) alerts.push("Raised BP with proteinuria — features of pre-eclampsia.");
  if (hb !== undefined && hb < 11) alerts.push(`Haemoglobin ${hb} g/dL is below 11 — anaemia in pregnancy.`);
  if (fhr !== undefined && (fhr < 110 || fhr > 160)) alerts.push(`Fetal heart rate ${fhr} bpm is outside 110–160.`);
  if (sys !== undefined && dia !== undefined && sys <= dia) alerts.push("Systolic should be higher than diastolic — check the readings.");

  const sections: SectionSpec[] = [
    {
      title: "Visit",
      fields: [
        { key: "visitDate", label: "Visit date & time", type: "datetime", required: true },
        { key: "gestationalAge", label: "Gestational age", placeholder: "e.g. 28w 3d", hint: "Filled from LMP / EDD — edit if the scan dates differ." },
        { key: "complaints", label: "Complaints", type: "textarea", span: 2 },
      ],
    },
    {
      title: "Measurements",
      cols: 3,
      fields: [
        { key: "weightKg", label: "Weight (kg)", type: "number", min: 30, max: 250, step: 0.1 },
        { key: "bpSystolic", label: "Systolic BP", type: "number", min: 50, max: 260 },
        { key: "bpDiastolic", label: "Diastolic BP", type: "number", min: 30, max: 180 },
        { key: "fundalHeightCm", label: "Fundal height (cm)", type: "number", min: 5, max: 50, step: 0.5 },
        { key: "fetalHeartRate", label: "Fetal heart rate (bpm)", type: "number", min: 60, max: 220 },
        { key: "haemoglobin", label: "Haemoglobin (g/dL)", type: "number", min: 3, max: 20, step: 0.1 },
      ],
    },
    {
      title: "Examination",
      cols: 2,
      fields: [
        { key: "presentation", label: "Presentation", type: "select", options: [{ value: "", label: "Not determined" }, ...["Cephalic", "Breech", "Transverse", "Oblique"].map((x) => ({ value: x, label: x }))] },
        { key: "oedema", label: "Oedema", type: "select", options: opts(["Nil", "+", "++", "+++"]) },
        { key: "urineProtein", label: "Urine protein", type: "select", options: opts(NIL) },
        { key: "urineSugar", label: "Urine sugar", type: "select", options: opts(NIL) },
        { key: "findings", label: "Findings", type: "textarea", span: 2 },
        { key: "advice", label: "Advice given", type: "textarea", span: 2 },
      ],
    },
    {
      title: "Follow-up",
      cols: 1,
      fields: [
        quickDateField("nextVisitDate", "Next visit", [["+2 weeks", 14], ["+4 weeks", 28], ["+6 weeks", 42]], {
          from: (x) => x.visitDate,
          hint: "WHO recommends at least 8 contacts across the pregnancy.",
        }),
      ],
    },
  ];

  const hasData = ["weightKg", "bpSystolic", "bpDiastolic", "fundalHeightCm", "fetalHeartRate", "haemoglobin", "findings", "complaints", "advice"].some(
    (k) => String(v[k] ?? "").trim() !== "",
  );

  return (
    <SpecForm
      form={form}
      sections={sections}
      backHref={`${BASE}/anc/${ancId}`}
      title="Record ANC visit"
      subtitle={r ? `${nameOf(r.patient)} · ${label(r.riskLevel)} risk` : undefined}
      top={
        alerts.length > 0 ? (
          <Card className="space-y-2">
            <p className="text-sm font-semibold">Clinical flags</p>
            <ul className="list-disc space-y-0.5 pl-5 text-xs opacity-80">{alerts.map((a) => <li key={a}>{a}</li>)}</ul>
            <p className="text-[10px] opacity-50">Preview only — you can still save. Update the risk level from the record afterwards.</p>
          </Card>
        ) : undefined
      }
      submitLabel="Save visit"
      saving={maternity.saving}
      canSubmit={hasData}
      onSubmit={async (x) => {
        const payload = clean({
          visitDate: toIso(x.visitDate),
          gestationalAge: x.gestationalAge,
          weightKg: num(x.weightKg),
          bpSystolic: num(x.bpSystolic),
          bpDiastolic: num(x.bpDiastolic),
          fundalHeightCm: num(x.fundalHeightCm),
          fetalHeartRate: num(x.fetalHeartRate),
          presentation: x.presentation,
          oedema: x.oedema,
          urineProtein: x.urineProtein,
          urineSugar: x.urineSugar,
          haemoglobin: num(x.haemoglobin),
          complaints: x.complaints,
          findings: x.findings,
          advice: x.advice,
          nextVisitDate: x.nextVisitDate,
        }) as any;
        const res = await act(addAncVisit({ facilityId, id: ancId, payload }));
        if (res) router.push(`${BASE}/anc/${ancId}`);
      }}
    />
  );
}
