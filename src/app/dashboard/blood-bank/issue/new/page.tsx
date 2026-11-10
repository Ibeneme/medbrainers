"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { fetchCrossmatches, fetchRequests, fetchUnits, issueUnit } from "@/api/slices";
import {
  BASE, Loader, Page, PRODUCT_LABEL, SpecForm, clean, fmtDate, idOf, itemsSummary, nameOf, num, useBB, useForm, useLoad, type SectionSpec,
} from "@/components/blood-bank/bb-ui";

function Inner() {
  const sp = useSearchParams();
  const bb = useBB();
  const { facilityId, act, router, bloodBank } = bb;
  const form = useForm<any>({
    requestId: sp.get("requestId") || "", emergency: sp.get("emergency") === "1", crossmatchId: "", unitId: "", issuedTo: "", destination: "",
    transportBox: "", coolerBoxTempC: "", reason: "", authorisedBy: "", notes: "",
  });
  useEffect(() => { if (facilityId) act(fetchRequests({ facilityId, openOnly: true, limit: 200 }), false); }, [facilityId, act]);

  const rid = form.v.requestId;
  const { data: xms } = useLoad<any[]>(bb, (f) => rid && !form.v.emergency ? fetchCrossmatches({ facilityId: f, requestId: rid, status: "active", limit: 100 }) : null, [rid, form.v.emergency]);
  const { data: avail } = useLoad<any[]>(bb, (f) => form.v.emergency ? fetchUnits({ facilityId: f, status: "available", limit: 200 }) : null, [form.v.emergency]);

  const matched = (xms || []).filter((x: any) => x.result === "compatible");
  const sections: SectionSpec[] = [
    {
      title: "What is being issued",
      cols: 1,
      fields: [
        { key: "requestId", label: "Blood request", type: "select", required: true, searchable: true, options: bloodBank.requests.map((r: any) => ({ value: r._id, label: `${r.requestNumber} · ${nameOf(r.patient)} · ${itemsSummary(r.items)}` })) },
        { key: "emergency", type: "toggle", label: "Emergency (uncrossmatched) release", hint: "Only for life-threatening bleeding. A retrospective crossmatch must follow." },
        { key: "crossmatchId", label: "Crossmatched unit", type: "select", required: true, show: (v) => !v.emergency, options: matched.map((x: any) => ({ value: x._id, label: `${x.unitNumber} · ${x.unitGroup} · ${PRODUCT_LABEL[x.product]} · ${x.crossmatchNumber}` })), hint: rid && matched.length === 0 ? "No active compatible crossmatch for this request yet." : undefined },
        { key: "unitId", label: "Unit to release", type: "select", required: true, searchable: true, show: (v) => v.emergency, options: (avail || []).map((u: any) => ({ value: u._id, label: `${u.unitNumber} · ${u.bloodGroup || "?"} · ${PRODUCT_LABEL[u.product]} · exp ${fmtDate(u.expiryDate)}` })) },
      ],
    },
    {
      title: "Emergency authorisation",
      show: undefined as any,
      fields: [
        { key: "reason", label: "Reason for emergency release", type: "textarea", required: true, span: 2, show: (v) => v.emergency },
        { key: "authorisedBy", label: "Authorised by (clinician)", type: "staff", required: true, span: 2, show: (v) => v.emergency },
      ],
    } as SectionSpec,
    {
      title: "Handover",
      fields: [
        { key: "issuedTo", label: "Issued to (collector name)", required: true },
        { key: "destination", label: "Destination ward / theatre" },
        { key: "transportBox", label: "Transport box no." },
        { key: "coolerBoxTempC", label: "Cooler box temp (°C)", type: "number" },
        { key: "notes", label: "Notes", type: "textarea", span: 2 },
      ],
    },
  ];
  // hide the empty authorisation card when not an emergency
  const visible = sections.filter((s) => s.title !== "Emergency authorisation" || form.v.emergency);

  return (
    <SpecForm
      form={form}
      sections={visible}
      backHref={`${BASE}/issue`}
      title={form.v.emergency ? "Emergency release" : "Issue blood unit"}
      subtitle="Release a unit to the ward"
      submitLabel={form.v.emergency ? "Release uncrossmatched unit" : "Issue unit"}
      danger={form.v.emergency}
      saving={bloodBank.saving}
      confirm={(v) => v.emergency ? { title: "Release without crossmatch?", message: "This unit is released before compatibility is proven. A retrospective crossmatch is mandatory afterwards.", label: "Release unit", tone: "danger" } : null}
      onSubmit={async (v) => {
        const xm = matched.find((x: any) => x._id === v.crossmatchId);
        const payload: any = clean({
          requestId: v.requestId, unitId: v.emergency ? v.unitId : idOf(xm?.unit), crossmatchId: v.emergency ? undefined : v.crossmatchId,
          issuedTo: v.issuedTo.trim(), destination: v.destination, transportBox: v.transportBox, coolerBoxTempC: num(v.coolerBoxTempC), notes: v.notes,
        });
        if (v.emergency) payload.emergency = { reason: v.reason.trim(), authorisedBy: v.authorisedBy };
        const res: any = await act(issueUnit({ facilityId, payload }), "Unit issued");
        if (res) router.push(res === true ? `${BASE}/issue` : `${BASE}/issue/${idOf(res)}`);
      }}
    />
  );
}

export default function NewIssuePage() {
  return <Suspense fallback={<Page narrow><Loader /></Page>}><Inner /></Suspense>;
}
