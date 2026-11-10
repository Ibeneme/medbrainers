"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { admitToLabour, fetchAncRecords, fetchLabourBoard } from "@/api/slices";
import {
  BASE, Card, SpecForm, Suspended, clean, gaLabel, gestationDays, idOf, label, patientField, toIso, useForm, useMat,
  type SectionSpec,
} from "@/components/maternity/mat-ui";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, router, maternity } = useMat();
  const form = useForm<any>({
    patientId: sp.get("patientId") || "",
    antenatalRecordId: sp.get("ancId") || "",
    bedCode: "", onsetOfLabour: "", notes: "",
  });
  const pid = form.v.patientId;

  useEffect(() => {
    if (facilityId) act(fetchLabourBoard({ facilityId }), false);
  }, [facilityId, act]);
  useEffect(() => {
    if (facilityId && pid) act(fetchAncRecords({ facilityId, patientId: pid, status: "active" }), false);
  }, [facilityId, pid, act]);

  const ancs = maternity.anc.filter((r) => idOf(r.patient) === pid);
  const already = maternity.labour.find((l) => idOf(l.patient) === pid);

  const sections: SectionSpec[] = [
    {
      cols: 2,
      fields: [
        patientField("patientId", "Mother", { female: true, span: 2 }),
        {
          key: "antenatalRecordId", label: "Antenatal record (optional)", type: "select", span: 2,
          options: [
            { value: "", label: pid ? "No ANC booking linked" : "Select the mother first" },
            ...ancs.map((r) => ({ value: r._id, label: `${r.registrationNo || "ANC"} · G${r.gravida}P${r.para} · ${gaLabel(gestationDays(r))} · ${label(r.riskLevel)} risk` })),
          ],
          hint: "Linking it lets the delivery close the pregnancy record automatically.",
        },
        { key: "bedCode", label: "Bed", placeholder: "e.g. LW-3" },
        { key: "onsetOfLabour", label: "Onset of labour", type: "datetime" },
        { key: "notes", label: "Admission notes", type: "textarea", span: 2 },
      ],
    },
  ];

  return (
    <SpecForm
      form={form}
      sections={sections}
      top={
        already ? (
          <Card className="space-y-1">
            <p className="text-sm font-semibold">Already in the labour ward</p>
            <p className="text-xs opacity-75">This patient has an open labour record ({label(already.status)}{already.bedCode ? `, bed ${already.bedCode}` : ""}). Admitting again creates a second record.</p>
          </Card>
        ) : undefined
      }
      backHref={`${BASE}/labour`}
      title="Admit to labour ward"
      subtitle="Start a labour record"
      submitLabel="Admit"
      saving={maternity.saving}
      onSubmit={async (x) => {
        const res = await act(admitToLabour({ facilityId, payload: clean({ patientId: x.patientId, antenatalRecordId: x.antenatalRecordId, bedCode: x.bedCode, onsetOfLabour: toIso(x.onsetOfLabour), notes: x.notes }) as any }));
        if (res) router.push(`${BASE}/labour`);
      }}
    />
  );
}

export default function AdmitLabourPage() {
  return (
    <Suspended>
      <Inner />
    </Suspended>
  );
}
