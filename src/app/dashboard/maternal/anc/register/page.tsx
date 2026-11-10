"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { registerAnc } from "@/api/slices";
import {
  BASE, BLOOD_GROUPS, Card, ENUMS, NOT_RECORDED, RHESUS, RISK_FACTORS, SpecForm, Suspended, ageYears, clean,
  eddFromLmp, gaLabel, gestationDays, idOf, num, patientField, toOpts, trimester, useForm, useMat,
  type SectionSpec,
} from "@/components/maternity/mat-ui";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, router, maternity } = useMat();
  const form = useForm<any>({
    patientId: sp.get("patientId") || "",
    gravida: "1", para: "0", abortions: "0", livingChildren: "0",
    lmp: "", edd: "",
    bloodGroup: "", rhesus: "",
    heightCm: "", weightKg: "",
    riskLevel: "low", riskFactors: [] as string[],
    notes: "",
  });
  const [picked, setPicked] = useState<any>(null);
  const v = form.v;

  /* EDD follows LMP (Naegele's rule) until the clinician edits it by hand. */
  const autoEdd = useRef("");
  useEffect(() => {
    if (!v.lmp) return;
    const calc = eddFromLmp(v.lmp);
    if (!v.edd || v.edd === autoEdd.current) {
      autoEdd.current = calc;
      form.set("edd", calc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.lmp]);

  const ga = v.lmp || v.edd ? gestationDays({ lmp: v.lmp || undefined, edd: v.lmp ? undefined : v.edd || undefined }) : undefined;
  const age = ageYears(picked?.dateOfBirth);
  const g = num(v.gravida), p = num(v.para), ab = num(v.abortions);

  const hints: string[] = [];
  if (ga !== undefined && ga >= 0) hints.push(`Gestational age today: ${gaLabel(ga)} · trimester ${trimester(ga)}`);
  if (ga !== undefined && ga > 308) hints.push("Gestational age is beyond 44 weeks — check the LMP / EDD.");
  if (age !== undefined && age < 18 && !v.riskFactors.includes("Age under 18")) hints.push(`Patient is ${age} — consider adding “Age under 18” as a risk factor.`);
  if (age !== undefined && age > 35 && !v.riskFactors.includes("Age over 35")) hints.push(`Patient is ${age} — consider adding “Age over 35” as a risk factor.`);
  if (v.riskFactors.length > 0 && v.riskLevel === "low") hints.push("Risk factors are selected but the risk level is Low — confirm this is intended.");
  if (g !== undefined && p !== undefined && ab !== undefined && g < p + ab) hints.push(`Gravida (${g}) is lower than para + abortions (${p + ab}) — check the obstetric history.`);
  if (v.rhesus === "negative" && !v.riskFactors.includes("Rhesus negative")) hints.push("Rhesus negative — consider adding it as a risk factor (anti-D prophylaxis).");

  const sections: SectionSpec[] = [
    {
      title: "Patient",
      fields: [
        patientField("patientId", "Mother", {
          female: true,
          span: 2,
          onPick: (pt) => {
            setPicked(pt);
            const m = /^(AB|A|B|O)\s*([+-])$/i.exec(pt?.bloodGroup || "");
            if (m) {
              form.patch({ bloodGroup: m[1].toUpperCase(), rhesus: m[2] === "+" ? "positive" : "negative" });
            }
          },
        }),
      ],
    },
    {
      title: "Obstetric history",
      desc: "Gravida counts this pregnancy.",
      cols: 3,
      fields: [
        { key: "gravida", label: "Gravida", type: "number", required: true, min: 1, max: 30, step: 1 },
        { key: "para", label: "Para", type: "number", min: 0, max: 30, step: 1 },
        { key: "abortions", label: "Abortions / miscarriages", type: "number", min: 0, max: 30, step: 1 },
        { key: "livingChildren", label: "Living children", type: "number", min: 0, max: 30, step: 1 },
      ],
    },
    {
      title: "Dates",
      desc: "EDD is calculated from the LMP (LMP + 280 days). Edit it if a dating scan differs.",
      fields: [
        { key: "lmp", label: "Last menstrual period (LMP)", type: "date", hint: "Cannot be in the future." },
        { key: "edd", label: "Expected date of delivery (EDD)", type: "date" },
      ],
    },
    {
      title: "Baseline",
      cols: 2,
      fields: [
        { key: "bloodGroup", label: "Blood group", type: "select", options: [{ value: "", label: NOT_RECORDED }, ...BLOOD_GROUPS.map((b) => ({ value: b, label: b }))] },
        { key: "rhesus", label: "Rhesus", type: "select", options: [{ value: "", label: NOT_RECORDED }, ...toOpts(RHESUS)] },
        { key: "heightCm", label: "Height (cm)", type: "number", min: 100, max: 220 },
        { key: "weightKg", label: "Weight (kg)", type: "number", min: 30, max: 250, step: 0.1 },
      ],
    },
    {
      title: "Risk assessment",
      cols: 1,
      fields: [
        { key: "riskLevel", label: "Risk level", type: "select", options: toOpts(ENUMS.riskLevels) },
        {
          key: "riskFactors", label: "Risk factors", type: "chips",
          options: RISK_FACTORS.map((r) => ({ value: r, label: r })),
          hint: "Select everything that applies. You can update this later at every visit.",
        },
        { key: "notes", label: "Notes", type: "textarea" },
      ],
    },
  ];

  const lmpOk = !v.lmp || new Date(v.lmp).getTime() <= Date.now();

  return (
    <SpecForm
      form={form}
      sections={sections}
      top={
        hints.length > 0 ? (
          <Card className="space-y-2">
            <p className="text-sm font-semibold">Heads-up</p>
            <ul className="list-disc space-y-0.5 pl-5 text-xs opacity-80">
              {hints.map((h) => <li key={h}>{h}</li>)}
            </ul>
          </Card>
        ) : undefined
      }
      backHref={`${BASE}/anc/visits`}
      title="ANC registration"
      subtitle="Antenatal booking"
      submitLabel="Register booking"
      saving={maternity.saving}
      savingText="Registering booking…"
      canSubmit={Number.isInteger(g) && (g as number) >= 1 && lmpOk}
      onSubmit={async (x) => {
        const gaBooking = x.lmp || x.edd ? gaLabel(gestationDays({ lmp: x.lmp || undefined, edd: x.lmp ? undefined : x.edd || undefined })) : "";
        const payload = clean({
          patientId: x.patientId,
          gravida: num(x.gravida),
          para: num(x.para),
          abortions: num(x.abortions),
          livingChildren: num(x.livingChildren),
          lmp: x.lmp,
          edd: x.edd,
          gestationalAgeAtBooking: gaBooking === "—" ? undefined : gaBooking,
          bloodGroup: x.bloodGroup,
          rhesus: x.rhesus,
          heightCm: num(x.heightCm),
          weightKg: num(x.weightKg),
          riskLevel: x.riskLevel,
          riskFactors: x.riskFactors,
          notes: x.notes,
        }) as any;
        const r: any = await act(registerAnc({ facilityId, payload }));
        if (r) router.push(r === true ? `${BASE}/anc/visits` : `${BASE}/anc/${idOf(r)}`);
      }}
    />
  );
}

export default function AncRegisterPage() {
  return (
    <Suspended>
      <Inner />
    </Suspended>
  );
}
