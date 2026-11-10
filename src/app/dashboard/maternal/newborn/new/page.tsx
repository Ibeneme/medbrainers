"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchDeliveries, registerNewborn } from "@/api/slices";
import type { Newborn } from "@/api/slices/maternitySlice";
import {
  BASE, BackHeader, Btn, Card, ENUMS, MPill, Page, SpecForm, Suspended, bwClass, clean, fmtDateTime, idOf, label, num,
  patientField, toIso, toLocalInput, toOpts, useForm, useMat, type SectionSpec,
} from "@/components/maternity/mat-ui";

const STATUS = ENUMS.newbornStatuses.filter((s) => s === "well" || s === "transferred" || s === "deceased" || s === "discharged");

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, maternity } = useMat();
  const [done, setDone] = useState<Newborn | null>(null);
  const form = useForm<any>({
    motherId: sp.get("motherId") || "", deliveryRecordId: sp.get("deliveryId") || "", babyPatientId: "",
    birthDateTime: toLocalInput(), sex: "", birthWeightGrams: "", lengthCm: "", headCircumferenceCm: "",
    apgar1: "", apgar5: "", apgar10: "", resuscitation: "", congenitalAnomalies: "", status: "well", notes: "",
  });
  const v = form.v;
  useEffect(() => {
    if (facilityId && v.motherId) act(fetchDeliveries({ facilityId, patientId: v.motherId }), false);
  }, [facilityId, v.motherId, act]);
  const deliveries = maternity.deliveries.filter((d) => idOf(d.patient) === v.motherId);

  /* birth time follows the chosen delivery */
  useEffect(() => {
    const d = deliveries.find((x) => x._id === v.deliveryRecordId);
    if (d) form.set("birthDateTime", toLocalInput(d.deliveryDateTime));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.deliveryRecordId, maternity.deliveries]);

  const w = num(v.birthWeightGrams);
  const a1 = num(v.apgar1), a5 = num(v.apgar5), a10 = num(v.apgar10);
  const bw = bwClass(w);
  const alerts: string[] = [];
  if (bw && (bw.key === "LBW" || bw.key === "VLBW" || bw.key === "ELBW")) alerts.push(`${bw.key}: ${w} g — plan thermal care and kangaroo mother care; VLBW / ELBW usually need NICU.`);
  if (a5 !== undefined && a5 < 7) alerts.push(`5-minute Apgar ${a5} is below 7 — consider NICU / SCBU admission.`);
  const apgarBad = [a1, a5, a10].some((x) => x !== undefined && (x < 0 || x > 10 || !Number.isInteger(x)));
  const suggestNicu = (w !== undefined && w < 1500) || (a5 !== undefined && a5 < 7);

  const apgar = (key: string, l: string) => ({ key, label: l, type: "number" as const, min: 0, max: 10, step: 1 });
  const sections: SectionSpec[] = [
    {
      title: "Mother & birth",
      fields: [
        patientField("motherId", "Mother", { female: true, span: 2 }),
        {
          key: "deliveryRecordId", label: "Delivery record", type: "select",
          options: [{ value: "", label: v.motherId ? "Not linked" : "Select the mother first" }, ...deliveries.map((d) => ({ value: d._id, label: `${fmtDateTime(d.deliveryDateTime)} · ${label(d.mode)}` }))],
        },
        patientField("babyPatientId", "Baby's patient record", { required: false, hint: "Optional — only if the baby already has a patient record." }),
        { key: "birthDateTime", label: "Date & time of birth", type: "datetime", required: true },
        { key: "sex", label: "Sex", type: "select", required: true, options: toOpts(ENUMS.sexes) },
      ],
    },
    {
      title: "Measurements",
      cols: 3,
      fields: [
        { key: "birthWeightGrams", label: "Birth weight (g)", type: "number", required: true, min: 200, max: 7000, step: 1 },
        { key: "lengthCm", label: "Length (cm)", type: "number", min: 20, max: 70, step: 0.1 },
        { key: "headCircumferenceCm", label: "Head circumference (cm)", type: "number", min: 15, max: 50, step: 0.1 },
        apgar("apgar1", "Apgar 1 min"), apgar("apgar5", "Apgar 5 min"), apgar("apgar10", "Apgar 10 min"),
      ],
    },
    {
      title: "Condition",
      desc: "To admit to NICU / SCBU use the admission step after saving, so the reason and bed are recorded.",
      fields: [
        { key: "status", label: "Status", type: "select", options: toOpts(STATUS) },
        { key: "resuscitation", label: "Resuscitation given", placeholder: "e.g. stimulation, bag-mask ventilation" },
        { key: "congenitalAnomalies", label: "Congenital anomalies", type: "textarea", span: 2 },
        { key: "notes", label: "Notes", type: "textarea", span: 2 },
      ],
    },
  ];

  if (done) {
    return (
      <Page narrow>
        <BackHeader href={`${BASE}/newborn`} title="Newborn registered" subtitle={`${done.birthWeightGrams} g · ${label(done.sex)}`} />
        <Card className="space-y-4">
          <div className="flex flex-wrap gap-2"><MPill value={done.status} />{bwClass(done.birthWeightGrams) && <MPill tone={bwClass(done.birthWeightGrams)!.tone}>{bwClass(done.birthWeightGrams)!.key}</MPill>}</div>
          {suggestNicu && <p className="text-sm">This baby meets the criteria for NICU / SCBU assessment.</p>}
          <div className="flex flex-wrap gap-2">
            <Btn href={`${BASE}/nicu/admit?newbornId=${done._id}`} tone={suggestNicu ? "primary" : "card"}>Admit to NICU / SCBU</Btn>
            <Btn href={`${BASE}/newborn/screening?newbornId=${done._id}`} tone="card">Newborn screening</Btn>
            <Btn href={`${BASE}/immunization/new`} tone="card">Schedule vaccines</Btn>
            <Btn href={`${BASE}/newborn`} tone="ghost">Done</Btn>
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <SpecForm form={form} sections={sections} backHref={`${BASE}/newborn`} title="Register newborn" subtitle="Birth registry"
      top={alerts.length ? (
        <Card className="space-y-2">
          <p className="text-sm font-semibold">Clinical flags</p>
          <ul className="list-disc space-y-0.5 pl-5 text-xs opacity-80">{alerts.map((a) => <li key={a}>{a}</li>)}</ul>
        </Card>
      ) : undefined}
      submitLabel="Register newborn" saving={maternity.saving} canSubmit={!apgarBad && w !== undefined && w > 0}
      onSubmit={async (x) => {
        const payload = clean({
          motherId: x.motherId, deliveryRecordId: x.deliveryRecordId, babyPatientId: x.babyPatientId,
          birthDateTime: toIso(x.birthDateTime), sex: x.sex, birthWeightGrams: num(x.birthWeightGrams),
          lengthCm: num(x.lengthCm), headCircumferenceCm: num(x.headCircumferenceCm),
          apgar1: num(x.apgar1), apgar5: num(x.apgar5), apgar10: num(x.apgar10),
          resuscitation: x.resuscitation, congenitalAnomalies: x.congenitalAnomalies, status: x.status, notes: x.notes,
        }) as any;
        const r: any = await act(registerNewborn({ facilityId, payload }));
        if (r && r !== true) setDone(r);
      }} />
  );
}

export default function NewNewbornPage() {
  return (
    <Suspended>
      <Inner />
    </Suspended>
  );
}
