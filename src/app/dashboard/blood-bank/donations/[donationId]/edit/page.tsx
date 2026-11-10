"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchDonationById, updateDonation } from "@/api/slices";
import {
  BASE, ENUMS, Loader, Page, SpecForm, clean, toOpts, useBB, useForm, type SectionSpec,
} from "@/components/blood-bank/bb-ui";

export default function EditDonationPage() {
  const { donationId } = useParams() as { donationId: string };
  const { facilityId, act, router, bloodBank } = useBB();
  const d: any = bloodBank.activeDonation?._id === donationId ? bloodBank.activeDonation : null;
  const form = useForm<any>({});

  useEffect(() => {
    if (facilityId) act(fetchDonationById({ facilityId, donationId }), false);
  }, [facilityId, donationId, act]);

  useEffect(() => {
    if (!d) return;
    form.setV({
      armUsed: d.armUsed || "", notes: d.notes || "",
      adverse: !!d.adverseReaction?.occurred, adType: d.adverseReaction?.type || "vasovagal",
      adSeverity: d.adverseReaction?.severity || "mild", adNotes: d.adverseReaction?.notes || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d?._id]);

  if (!d || form.v.armUsed === undefined) return <Page narrow><Loader /></Page>;

  const sections: SectionSpec[] = [
    {
      fields: [
        { key: "armUsed", label: "Arm used", type: "select", options: [{ value: "", label: "Not recorded" }, { value: "left", label: "Left" }, { value: "right", label: "Right" }] },
        { key: "notes", label: "Notes", type: "textarea", span: 2 },
        { key: "adverse", type: "toggle", label: "Donor had an adverse reaction", span: 2 },
        { key: "adType", label: "Reaction type", type: "select", options: toOpts(ENUMS.adverseTypes), show: (v) => v.adverse },
        { key: "adSeverity", label: "Severity", type: "select", options: toOpts(ENUMS.adverseSeverities), show: (v) => v.adverse },
        { key: "adNotes", label: "Reaction notes", type: "textarea", span: 2, show: (v) => v.adverse },
      ],
    },
  ];

  return (
    <SpecForm
      form={form}
      sections={sections}
      backHref={`${BASE}/donations/${donationId}`}
      title="Edit donation"
      subtitle={<span className="font-mono">{d.donationNumber}</span>}
      submitLabel="Save changes"
      saving={bloodBank.saving}
      onSubmit={async (v) => {
        const payload: any = clean({ armUsed: v.armUsed, notes: v.notes });
        payload.adverseReaction = v.adverse
          ? clean({ occurred: true, type: v.adType, severity: v.adSeverity, notes: v.adNotes })
          : { occurred: false };
        const res = await act(updateDonation({ facilityId, donationId, payload }), "Donation updated");
        if (res) router.push(`${BASE}/donations/${donationId}`);
      }}
    />
  );
}
