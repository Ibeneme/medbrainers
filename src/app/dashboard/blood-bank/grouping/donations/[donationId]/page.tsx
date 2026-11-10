"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { confirmDonationGrouping, fetchDonationById, recordDonationGrouping } from "@/api/slices";
import GroupingEditor from "@/components/blood-bank/GroupingEditor";
import { BASE, Loader, NotFound, Page, fmtDateTime, nameOf, useBB } from "@/components/blood-bank/bb-ui";

export default function DonationGroupingPage() {
  const { donationId } = useParams() as { donationId: string };
  const { facilityId, act, router, bloodBank } = useBB();
  const d: any = bloodBank.activeDonation?._id === donationId ? bloodBank.activeDonation : null;

  useEffect(() => {
    if (facilityId) act(fetchDonationById({ facilityId, donationId }), false);
  }, [facilityId, donationId, act]);

  if (!d) return <Page narrow>{bloodBank.detailLoading ? <Loader /> : <NotFound what="Donation" href={`${BASE}/grouping`} />}</Page>;

  const expected = d.grouping?.group || d.donor?.reportedBloodGroup;
  const expectedLabel = d.grouping?.group ? "the recorded group" : "the donor's self-reported group";

  return (
    <GroupingEditor
      title={`Group donation ${d.donationNumber}`}
      subtitle={`${nameOf(d.donor)} · collected ${fmtDateTime(d.collectedAt)}`}
      backHref={`${BASE}/grouping`}
      grouping={d.grouping}
      expected={expected}
      expectedLabel={expectedLabel}
      saving={bloodBank.saving}
      onRecord={async (payload) => {
        const r = await act(recordDonationGrouping({ facilityId, donationId, payload }), "Grouping recorded");
        if (r) router.push(`${BASE}/grouping`);
      }}
      onConfirm={async () => {
        const r = await act(confirmDonationGrouping({ facilityId, donationId }), "Grouping confirmed");
        if (r) router.push(`${BASE}/grouping`);
      }}
    />
  );
}
