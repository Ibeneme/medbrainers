"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchAncRecords, fetchLabourBoard, recordDelivery } from "@/api/slices";
import type { DeliveryRecord } from "@/api/slices/maternitySlice";
import {
  BASE, BackHeader, Btn, Card, MODE_LABEL, MODE_OPTS, MPill, Page, SpecForm, Suspended, clean, fmtDateTime, gaLabel,
  gestationDays, idOf, label, nameOf, num, patientField, toIso, toLocalInput, useForm, useMat, type SectionSpec,
} from "@/components/maternity/mat-ui";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, maternity } = useMat();
  const [done, setDone] = useState<DeliveryRecord | null>(null);
  const form = useForm<any>({
    patientId: sp.get("patientId") || "",
    labourRecordId: sp.get("labourId") || "",
    antenatalRecordId: sp.get("ancId") || "",
    deliveryDateTime: toLocalInput(),
    mode: "svd", indication: "", bloodLossMl: "", complications: "", notes: "",
  });
  const v = form.v;
  const pid = v.patientId;

  useEffect(() => {
    if (facilityId) act(fetchLabourBoard({ facilityId }), false);
  }, [facilityId, act]);
  useEffect(() => {
    if (facilityId && pid) act(fetchAncRecords({ facilityId, patientId: pid, status: "active" }), false);
  }, [facilityId, pid, act]);

  const labours = maternity.labour.filter((l) => idOf(l.patient) === pid);
  const ancs = maternity.anc.filter((r) => idOf(r.patient) === pid);
  const loss = num(v.bloodLossMl);

  const sections: SectionSpec[] = [
    {
      title: "Mother",
      fields: [
        patientField("patientId", "Mother", { female: true, span: 2 }),
        {
          key: "labourRecordId", label: "Labour record", type: "select",
          options: [{ value: "", label: pid ? "Not linked" : "Select the mother first" }, ...labours.map((l) => ({ value: l._id, label: `Admitted ${fmtDateTime(l.admissionTime)}${l.bedCode ? ` · bed ${l.bedCode}` : ""}` }))],
          hint: "Saving marks the linked labour record as delivered.",
        },
        {
          key: "antenatalRecordId", label: "Antenatal record", type: "select",
          options: [{ value: "", label: pid ? "Not linked" : "Select the mother first" }, ...ancs.map((r) => ({ value: r._id, label: `${r.registrationNo || "ANC"} · ${gaLabel(gestationDays(r))}` }))],
          hint: "Saving marks the pregnancy as delivered.",
        },
      ],
    },
    {
      title: "Delivery",
      fields: [
        { key: "deliveryDateTime", label: "Date & time of delivery", type: "datetime", required: true },
        { key: "mode", label: "Mode of delivery", type: "select", required: true, options: MODE_OPTS },
        { key: "indication", label: "Indication", span: 2, show: (x) => x.mode !== "svd", placeholder: "Reason for assisted / operative / breech delivery" },
        { key: "bloodLossMl", label: "Estimated blood loss (mL)", type: "number", min: 0, max: 10000 },
        { key: "complications", label: "Complications", type: "textarea", span: 2 },
        { key: "notes", label: "Notes", type: "textarea", span: 2 },
      ],
    },
  ];

  if (done) {
    const p = idOf(done.patient) || pid;
    return (
      <Page narrow>
        <BackHeader href={`${BASE}/delivery`} title="Delivery recorded" subtitle={nameOf(maternity.labour.find((l) => idOf(l.patient) === p)?.patient)} />
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center gap-2"><MPill value={done.mode} /><span className="text-sm opacity-70">{fmtDateTime(done.deliveryDateTime)}</span></div>
          <p className="text-sm font-semibold">What next?</p>
          <div className="flex flex-wrap gap-2">
            <Btn href={`${BASE}/newborn/new?motherId=${p}&deliveryId=${done._id}`}>Register newborn</Btn>
            {done.mode === "caesarean" && <Btn tone="card" href={`${BASE}/delivery/caesarean/new?patientId=${p}&deliveryId=${done._id}`}>Log caesarean</Btn>}
            <Btn tone="card" href={`${BASE}/postnatal/new?patientId=${p}&deliveryId=${done._id}`}>Postnatal visit</Btn>
            <Btn tone="ghost" href={`${BASE}/delivery`}>Back to deliveries</Btn>
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <SpecForm
      form={form}
      sections={sections}
      top={
        <>
          {loss !== undefined && loss >= 500 && (
            <Card className="space-y-1">
              <p className="text-sm font-semibold">{loss >= 1000 ? "Severe postpartum haemorrhage" : "Postpartum haemorrhage threshold reached"}</p>
              <p className="text-xs opacity-75">Blood loss of {loss} mL meets the WHO PPH definition (≥ 500 mL{loss >= 1000 ? "; ≥ 1000 mL is severe" : ""}). Document the cause, management and any blood requested under complications.</p>
            </Card>
          )}
        </>
      }
      backHref={`${BASE}/delivery`}
      title="Record delivery"
      subtitle={v.mode ? MODE_LABEL[v.mode] || label(v.mode) : undefined}
      submitLabel="Record delivery"
      saving={maternity.saving}
      onSubmit={async (x) => {
        const payload = clean({
          patientId: x.patientId, labourRecordId: x.labourRecordId, antenatalRecordId: x.antenatalRecordId,
          deliveryDateTime: toIso(x.deliveryDateTime), mode: x.mode, indication: x.indication,
          bloodLossMl: num(x.bloodLossMl), complications: x.complications, notes: x.notes,
        }) as any;
        const r: any = await act(recordDelivery({ facilityId, payload }));
        if (r) setDone(r === true ? ({ _id: "", mode: x.mode, deliveryDateTime: payload.deliveryDateTime, patient: x.patientId } as any) : r);
      }}
    />
  );
}

export default function NewDeliveryPage() {
  return (
    <Suspended>
      <Inner />
    </Suspended>
  );
}
