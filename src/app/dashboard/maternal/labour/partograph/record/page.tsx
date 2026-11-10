"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { addPartographObservation, fetchLabourBoard } from "@/api/slices";
import {
  BASE, Card, SpecForm, Suspended, bpFlag, clean, nameOf, num, toIso, toLocalInput, useForm, useMat, type SectionSpec,
} from "@/components/maternity/mat-ui";

const grade = [{ value: "", label: "Not tested" }, ...["Nil", "+", "++", "+++"].map((x) => ({ value: x, label: x }))];
const descent = [
  { value: "", label: "Not recorded" },
  ...[5, 4, 3, 2, 1, 0].map((n) => ({ value: String(n), label: n === 5 ? "5/5 – head fully palpable" : n === 0 ? "0/5 – not palpable (engaged)" : `${n}/5 palpable` })),
];

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, router, maternity } = useMat();
  const form = useForm<any>({
    labourId: sp.get("labourId") || "",
    time: toLocalInput(),
    cervicalDilatation: "", descentOfHead: "", fetalHeartRate: "", contractionsPer10Min: "", durationOfContraction: "",
    bpSystolic: "", bpDiastolic: "", pulse: "", temperature: "",
    urineVolume: "", urineProtein: "", urineAcetone: "", drugsGiven: "", notes: "",
  });
  const v = form.v;

  useEffect(() => {
    if (facilityId) act(fetchLabourBoard({ facilityId }), false);
  }, [facilityId, act]);

  const labour = maternity.labour.find((l) => l._id === v.labourId);
  const prev = [...(labour?.partograph || [])].filter((o) => o.cervicalDilatation !== undefined).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())[0];

  const dil = num(v.cervicalDilatation), fhr = num(v.fetalHeartRate), ctx = num(v.contractionsPer10Min);
  const sys = num(v.bpSystolic), dia = num(v.bpDiastolic), pulse = num(v.pulse), temp = num(v.temperature);
  const alerts: string[] = [];
  if (fhr !== undefined && fhr < 110) alerts.push(`FHR ${fhr} bpm is below 110 — possible fetal bradycardia / distress.`);
  if (fhr !== undefined && fhr > 160) alerts.push(`FHR ${fhr} bpm is above 160 — possible fetal tachycardia.`);
  if (ctx !== undefined && ctx > 5) alerts.push(`${ctx} contractions per 10 min — tachysystole.`);
  const bp = bpFlag(sys, dia);
  if (bp) alerts.push(`BP ${sys ?? "?"}/${dia ?? "?"} is ${bp === "bad" ? "in the severe range (≥160/110)" : "raised (≥140/90)"}.`);
  if (pulse !== undefined && (pulse > 120 || pulse < 50)) alerts.push(`Maternal pulse ${pulse} bpm is outside 50–120.`);
  if (temp !== undefined && temp >= 38) alerts.push(`Temperature ${temp} °C — maternal fever / possible infection.`);
  if (dil !== undefined && prev?.cervicalDilatation !== undefined && dil < prev.cervicalDilatation) alerts.push(`Dilatation ${dil} cm is less than the previous ${prev.cervicalDilatation} cm — check the reading.`);

  const sections: SectionSpec[] = [
    {
      title: "Labour record",
      fields: [
        {
          key: "labourId", label: "Woman in labour", type: "select", required: true, searchable: true, span: 2,
          options: maternity.labour.map((l) => ({ value: l._id, label: `${nameOf(l.patient)}${l.bedCode ? ` · bed ${l.bedCode}` : ""}` })),
        },
        { key: "time", label: "Observation time", type: "datetime", required: true },
      ],
    },
    {
      title: "Progress of labour",
      cols: 3,
      fields: [
        { key: "cervicalDilatation", label: "Cervical dilatation (cm)", type: "number", min: 0, max: 10, step: 0.5 },
        { key: "descentOfHead", label: "Descent of head", type: "select", options: descent },
        { key: "contractionsPer10Min", label: "Contractions / 10 min", type: "number", min: 0, max: 10, step: 1 },
        { key: "durationOfContraction", label: "Contraction duration", type: "select", options: [{ value: "", label: "Not recorded" }, ...["< 20 s", "20–40 s", "> 40 s"].map((x) => ({ value: x, label: x }))] },
        { key: "fetalHeartRate", label: "Fetal heart rate (bpm)", type: "number", min: 60, max: 220 },
      ],
    },
    {
      title: "Mother",
      cols: 3,
      fields: [
        { key: "bpSystolic", label: "Systolic BP", type: "number", min: 50, max: 260 },
        { key: "bpDiastolic", label: "Diastolic BP", type: "number", min: 30, max: 180 },
        { key: "pulse", label: "Pulse (bpm)", type: "number", min: 30, max: 220 },
        { key: "temperature", label: "Temperature (°C)", type: "number", min: 34, max: 42, step: 0.1 },
        { key: "urineVolume", label: "Urine volume (mL)", type: "number", min: 0, max: 3000 },
        { key: "urineProtein", label: "Urine protein", type: "select", options: grade },
        { key: "urineAcetone", label: "Urine acetone", type: "select", options: grade },
      ],
    },
    {
      cols: 1,
      fields: [
        { key: "drugsGiven", label: "Drugs / IV fluids given", type: "textarea", rows: 2 },
        { key: "notes", label: "Notes", type: "textarea", rows: 2 },
      ],
    },
  ];

  const keys = ["cervicalDilatation", "descentOfHead", "fetalHeartRate", "contractionsPer10Min", "durationOfContraction", "bpSystolic", "bpDiastolic", "pulse", "temperature", "urineVolume", "urineProtein", "urineAcetone", "drugsGiven", "notes"];
  const hasData = keys.some((k) => String(v[k] ?? "").trim() !== "");
  const back = v.labourId ? `${BASE}/labour/partograph?labourId=${v.labourId}` : `${BASE}/labour`;

  return (
    <SpecForm
      form={form}
      sections={sections}
      top={
        alerts.length > 0 ? (
          <Card className="space-y-2">
            <p className="text-sm font-semibold">Clinical flags</p>
            <ul className="list-disc space-y-0.5 pl-5 text-xs opacity-80">{alerts.map((a) => <li key={a}>{a}</li>)}</ul>
            <p className="text-[10px] opacity-50">Preview only — the observation is still saved as entered.</p>
          </Card>
        ) : undefined
      }
      backHref={back}
      title="Record partograph observation"
      subtitle="Enter at least one finding"
      submitLabel="Save observation"
      saving={maternity.saving}
      canSubmit={hasData}
      onSubmit={async (x) => {
        const payload = clean({
          time: toIso(x.time),
          cervicalDilatation: num(x.cervicalDilatation),
          descentOfHead: num(x.descentOfHead),
          fetalHeartRate: num(x.fetalHeartRate),
          contractionsPer10Min: num(x.contractionsPer10Min),
          durationOfContraction: x.durationOfContraction,
          bpSystolic: num(x.bpSystolic),
          bpDiastolic: num(x.bpDiastolic),
          pulse: num(x.pulse),
          temperature: num(x.temperature),
          urineVolume: num(x.urineVolume),
          urineProtein: x.urineProtein,
          urineAcetone: x.urineAcetone,
          drugsGiven: x.drugsGiven,
          notes: x.notes,
        }) as any;
        const res = await act(addPartographObservation({ facilityId, id: x.labourId, payload }));
        if (res) router.push(`${BASE}/labour/partograph?labourId=${x.labourId}`);
      }}
    />
  );
}

export default function RecordObservationPage() {
  return (
    <Suspended>
      <Inner />
    </Suspended>
  );
}
