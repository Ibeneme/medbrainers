"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { admitNicu, fetchNewborns } from "@/api/slices";
import {
  BASE, SpecForm, Suspended, clean, fmtDateTime, label, nameOf, suggestField, useForm, useMat, type SectionSpec,
} from "@/components/maternity/mat-ui";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, router, maternity } = useMat();
  const form = useForm<any>({ newbornId: sp.get("newbornId") || "", reason: "", diagnosis: "", bedCode: "", notes: "" });
  useEffect(() => {
    if (facilityId) act(fetchNewborns({ facilityId }), false);
  }, [facilityId, act]);
  const babies = maternity.newborns.filter((n) => n.status !== "nicu" && n.status !== "deceased" || n._id === form.v.newbornId);
  const sections: SectionSpec[] = [
    {
      fields: [
        {
          key: "newbornId", label: "Newborn", type: "select", required: true, searchable: true, span: 2,
          options: babies.map((n) => ({ value: n._id, label: `Baby of ${nameOf(n.mother)} · ${label(n.sex)} · ${n.birthWeightGrams} g · ${fmtDateTime(n.birthDateTime)}` })),
          hint: "Admitting sets the newborn's status to NICU.",
        },
        suggestField("reason", "Reason for admission", ["Prematurity", "Low birth weight", "Birth asphyxia", "Respiratory distress", "Neonatal sepsis", "Neonatal jaundice", "Hypoglycaemia", "Congenital anomaly"], { required: true, span: 2 }),
        { key: "diagnosis", label: "Diagnosis", span: 2 },
        { key: "bedCode", label: "Cot / bed", placeholder: "e.g. NICU-4" },
        { key: "notes", label: "Notes", type: "textarea", span: 2 },
      ],
    },
  ];
  return (
    <SpecForm form={form} sections={sections} backHref={`${BASE}/nicu`} title="Admit to NICU / SCBU"
      subtitle="Neonatal admission" submitLabel="Admit" saving={maternity.saving}
      onSubmit={async (x) => {
        const r = await act(admitNicu({ facilityId, payload: clean({ newbornId: x.newbornId, reason: x.reason.trim(), diagnosis: x.diagnosis, bedCode: x.bedCode, notes: x.notes }) as any }));
        if (r) router.push(`${BASE}/nicu`);
      }} />
  );
}

export default function AdmitNicuPage() {
  return (
    <Suspended>
      <Inner />
    </Suspended>
  );
}
