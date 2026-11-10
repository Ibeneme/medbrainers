"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { fetchIssues, startTransfusion } from "@/api/slices";
import {
  BASE, Loader, Page, PRODUCT_LABEL, SpecForm, clean, fmtDateTime, idOf, nameOf, num, pickVitals, useBB, useForm, vitalsFields, type SectionSpec,
} from "@/components/blood-bank/bb-ui";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, router, bloodBank } = useBB();
  const form = useForm<any>({
    issueId: sp.get("issueId") || "", patientIdentityVerified: false, wristbandMatched: false, unitLabelMatched: false, compatibilityLabelChecked: false,
    secondCheckerId: "", pre_temperatureC: "", pre_pulse: "", pre_systolic: "", pre_diastolic: "", pre_respRate: "", pre_spo2: "", accessSite: "", rateMlPerHour: "", notes: "",
  });
  useEffect(() => { if (facilityId) act(fetchIssues({ facilityId, status: "issued", limit: 200 }), false); }, [facilityId, act]);
  const v = form.v;
  const checksOk = v.patientIdentityVerified && v.wristbandMatched && v.unitLabelMatched && v.compatibilityLabelChecked;

  const sections: SectionSpec[] = [
    { title: "Issued unit", cols: 1, fields: [{ key: "issueId", label: "Unit to transfuse", type: "select", required: true, searchable: true, options: bloodBank.issues.filter((i: any) => i.status === "issued").map((i: any) => ({ value: i._id, label: `${nameOf(i.patient)} · ${i.unitNumber} · ${PRODUCT_LABEL[i.product]} · issued ${fmtDateTime(i.issuedAt)}` })) }] },
    {
      title: "Bedside safety check", desc: "Two people must verify every item at the bedside before starting.", cols: 1,
      fields: [
        { key: "patientIdentityVerified", type: "toggle", label: "Patient identity verified (asked to state name & DOB)" },
        { key: "wristbandMatched", type: "toggle", label: "Wristband matches the request form" },
        { key: "unitLabelMatched", type: "toggle", label: "Unit label matches patient details" },
        { key: "compatibilityLabelChecked", type: "toggle", label: "Compatibility label & expiry checked" },
        { key: "secondCheckerId", label: "Second checker", type: "staff", required: true, hint: "Must be a different person from you." },
      ],
    },
    { title: "Baseline vitals", desc: "Temperature, pulse and systolic BP are required.", cols: 3, fields: vitalsFields("pre_") },
    { title: "Administration", fields: [{ key: "accessSite", label: "IV access site" }, { key: "rateMlPerHour", label: "Rate (mL/hour)", type: "number", min: 1, max: 2000 }, { key: "notes", label: "Notes", type: "textarea", span: 2 }] },
  ];

  return (
    <SpecForm form={form} sections={sections} backHref={`${BASE}/transfusions`} title="Start transfusion" subtitle="Bedside administration record"
      submitLabel="Start transfusion" saving={bloodBank.saving}
      canSubmit={checksOk && !!num(v.pre_temperatureC) && !!num(v.pre_pulse) && !!num(v.pre_systolic)}
      confirm={{ title: "Start this transfusion?", message: "Confirm all four bedside checks were completed by two people. The unit must be completed within the maximum transfusion time.", label: "Start transfusion", tone: "primary" }}
      onSubmit={async (f) => {
        const payload: any = {
          issueId: f.issueId,
          bedsideCheck: { patientIdentityVerified: true, wristbandMatched: true, unitLabelMatched: true, compatibilityLabelChecked: true, secondCheckerId: f.secondCheckerId },
          preVitals: pickVitals(f, "pre_"),
          ...clean({ accessSite: f.accessSite, rateMlPerHour: num(f.rateMlPerHour), notes: f.notes }),
        };
        const res: any = await act(startTransfusion({ facilityId, payload }), "Transfusion started");
        if (res) router.push(res === true ? `${BASE}/transfusions` : `${BASE}/transfusions/${idOf(res)}`);
      }} />
  );
}

export default function NewTransfusionPage() {
  return <Suspense fallback={<Page narrow><Loader /></Page>}><Inner /></Suspense>;
}
