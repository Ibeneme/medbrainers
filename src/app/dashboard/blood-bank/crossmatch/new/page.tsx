"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createCrossmatch, fetchRequests, suggestUnits } from "@/api/slices";
import {
  BASE, ENUMS, Loader, Page, PRODUCT_LABEL, SpecForm, clean, fmtDate, idOf, nameOf, itemsSummary, toOpts, useBB, useForm, useLoad, type SectionSpec,
} from "@/components/blood-bank/bb-ui";

function Inner() {
  const sp = useSearchParams();
  const bb = useBB();
  const { facilityId, act, router, bloodBank } = bb;
  const form = useForm<any>({ requestId: sp.get("requestId") || "", unitId: sp.get("unitId") || "", method: "electronic", result: "compatible", notes: "" });

  useEffect(() => { if (facilityId) act(fetchRequests({ facilityId, openOnly: true, limit: 200 }), false); }, [facilityId, act]);
  const { data: sug } = useLoad<any>(bb, (f) => (form.v.requestId ? suggestUnits({ facilityId: f, requestId: form.v.requestId }) : null), [form.v.requestId]);

  const units: any[] = (sug?.items || []).flatMap((i: any) => i.units.map((u: any) => ({ ...u, _p: i.product })));
  const chosen = units.find((u) => u._id === form.v.unitId);

  const sections: SectionSpec[] = [
    {
      title: "Request & unit",
      cols: 1,
      fields: [
        { key: "requestId", label: "Blood request", type: "select", required: true, searchable: true, options: bloodBank.requests.filter((r: any) => r.patientGrouping?.status === "confirmed").map((r: any) => ({ value: r._id, label: `${r.requestNumber} · ${nameOf(r.patient)} · ${itemsSummary(r.items)}` })), hint: "Only requests with a confirmed patient group can be crossmatched." },
        { key: "unitId", label: "Compatible unit", type: "select", required: true, searchable: true, options: units.map((u) => ({ value: u._id, label: `${u.unitNumber} · ${u.bloodGroup} · ${PRODUCT_LABEL[u._p]} · exp ${fmtDate(u.expiryDate)}` })), hint: chosen?.compatibility?.warning },
      ],
    },
    {
      title: "Result",
      fields: [
        { key: "method", label: "Method", type: "select", options: toOpts(ENUMS.crossmatchMethods) },
        { key: "result", label: "Result", type: "select", options: toOpts(ENUMS.crossmatchResults) },
        { key: "notes", label: "Notes", type: "textarea", span: 2 },
      ],
    },
  ];

  return (
    <SpecForm
      form={form}
      sections={sections}
      backHref={`${BASE}/crossmatch`}
      title="New crossmatch"
      subtitle="Compatibility test between patient and donor unit"
      submitLabel="Record crossmatch"
      saving={bloodBank.saving}
      danger={form.v.result === "incompatible"}
      confirm={(v) => v.result === "incompatible" ? { title: "Record INCOMPATIBLE result?", message: "This unit must not be transfused to this patient. It will be returned to stock.", label: "Record incompatible", tone: "danger" } : null}
      onSubmit={async (v) => {
        const res: any = await act(createCrossmatch({ facilityId, payload: clean({ requestId: v.requestId, unitId: v.unitId, method: v.method, result: v.result, notes: v.notes }) as any }), "Crossmatch recorded");
        if (res) router.push(res === true ? `${BASE}/crossmatch` : `${BASE}/crossmatch/${idOf(res)}`);
      }}
    />
  );
}

export default function NewCrossmatchPage() {
  return <Suspense fallback={<Page narrow><Loader /></Page>}><Inner /></Suspense>;
}
