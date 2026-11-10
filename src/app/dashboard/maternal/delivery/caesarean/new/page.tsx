"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { fetchDeliveries, logCaesarean } from "@/api/slices";
import {
  BASE, ENUMS, INCISIONS, SpecForm, Suspended, clean, fmtDateTime, idOf, label, patientField, suggestField, toIso, toOpts,
  useForm, useMat, type SectionSpec,
} from "@/components/maternity/mat-ui";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, router, maternity } = useMat();
  const form = useForm<any>({
    patientId: sp.get("patientId") || "", deliveryRecordId: sp.get("deliveryId") || "",
    indication: "", urgency: "emergency", incision: "", findings: "", procedureNotes: "", startTime: "", endTime: "",
  });
  const v = form.v;
  useEffect(() => {
    if (facilityId && v.patientId) act(fetchDeliveries({ facilityId, patientId: v.patientId }), false);
  }, [facilityId, v.patientId, act]);
  const deliveries = maternity.deliveries.filter((d) => idOf(d.patient) === v.patientId);
  const timesOk = !v.startTime || !v.endTime || new Date(v.endTime) >= new Date(v.startTime);

  const sections: SectionSpec[] = [
    {
      title: "Case",
      fields: [
        patientField("patientId", "Mother", { female: true, span: 2 }),
        {
          key: "deliveryRecordId", label: "Delivery record", type: "select", span: 2,
          options: [{ value: "", label: v.patientId ? "Not linked" : "Select the mother first" }, ...deliveries.map((d) => ({ value: d._id, label: `${fmtDateTime(d.deliveryDateTime)} · ${label(d.mode)}` }))],
          hint: "Record the delivery first, then link it here.",
        },
        { key: "urgency", label: "Urgency", type: "select", required: true, options: toOpts(ENUMS.urgencies) },
        suggestField("indication", "Indication", ["Previous caesarean", "Fetal distress", "Obstructed / prolonged labour", "Cephalopelvic disproportion", "Antepartum haemorrhage", "Pre-eclampsia / eclampsia", "Breech", "Failed induction"], { required: true, span: 2 }),
      ],
    },
    {
      title: "Procedure",
      fields: [
        suggestField("incision", "Incision", INCISIONS, { span: 2 }),
        { key: "startTime", label: "Knife to skin", type: "datetime" },
        { key: "endTime", label: "End of procedure", type: "datetime", hint: timesOk ? undefined : "End must be after the start." },
        { key: "findings", label: "Findings", type: "textarea", span: 2 },
        { key: "procedureNotes", label: "Procedure notes", type: "textarea", rows: 4, span: 2 },
      ],
    },
  ];

  return (
    <SpecForm form={form} sections={sections} backHref={`${BASE}/delivery/caesarean`} title="Log caesarean section"
      subtitle="Operative record" submitLabel="Save log" saving={maternity.saving} canSubmit={timesOk}
      onSubmit={async (x) => {
        const payload = clean({
          patientId: x.patientId, deliveryRecordId: x.deliveryRecordId, indication: x.indication.trim(), urgency: x.urgency,
          incision: x.incision, findings: x.findings, procedureNotes: x.procedureNotes,
          startTime: toIso(x.startTime), endTime: toIso(x.endTime),
        }) as any;
        const r = await act(logCaesarean({ facilityId, payload }));
        if (r) router.push(`${BASE}/delivery/caesarean`);
      }} />
  );
}

export default function NewCaesareanPage() {
  return (
    <Suspended>
      <Inner />
    </Suspended>
  );
}
