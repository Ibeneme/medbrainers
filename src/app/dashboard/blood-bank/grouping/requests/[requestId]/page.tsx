"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { confirmPatientGrouping, fetchRequestById, recordPatientGrouping } from "@/api/slices";
import GroupingEditor from "@/components/blood-bank/GroupingEditor";
import { BASE, Loader, NotFound, Page, itemsSummary, nameOf, useBB } from "@/components/blood-bank/bb-ui";

export default function PatientGroupingPage() {
  const { requestId } = useParams() as { requestId: string };
  const { facilityId, act, router, bloodBank } = useBB();
  const r: any = bloodBank.activeRequest?._id === requestId ? bloodBank.activeRequest : null;

  useEffect(() => {
    if (facilityId) act(fetchRequestById({ facilityId, requestId }), false);
  }, [facilityId, requestId, act]);

  if (!r) return <Page narrow>{bloodBank.detailLoading ? <Loader /> : <NotFound what="Request" href={`${BASE}/grouping`} />}</Page>;

  const expected = r.patientGrouping?.group || r.historicalGroup || r.patient?.bloodGroup;
  const expectedLabel = r.patientGrouping?.group ? "the recorded group" : r.historicalGroup ? "the historical group" : "the group on the patient file";

  return (
    <GroupingEditor
      title={`Group patient sample · ${r.requestNumber}`}
      subtitle={`${nameOf(r.patient)} · ${itemsSummary(r.items)}`}
      backHref={`${BASE}/grouping`}
      grouping={r.patientGrouping}
      expected={expected}
      expectedLabel={expectedLabel}
      saving={bloodBank.saving}
      onRecord={async (payload) => {
        const res = await act(recordPatientGrouping({ facilityId, requestId, payload }), "Patient grouping recorded");
        if (res) router.push(`${BASE}/requests/${requestId}`);
      }}
      onConfirm={async () => {
        const res = await act(confirmPatientGrouping({ facilityId, requestId }), "Patient grouping confirmed");
        if (res) router.push(`${BASE}/requests/${requestId}`);
      }}
    />
  );
}
