"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createDonation, fetchDrives, fetchScreenings } from "@/api/slices";
import {
  BASE, ENUMS, Loader, Page, SpecForm, clean, fmtDateTime, idOf, nameOf, num, toIso, toLocalInput,
  toOpts, useBB, useForm, type SectionSpec,
} from "@/components/blood-bank/bb-ui";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, router, bloodBank } = useBB();
  const form = useForm<any>({
    screeningId: sp.get("screeningId") || "", driveId: "", donationType: "whole_blood", bagType: "double",
    volumeMl: "450", armUsed: "", startedAt: toLocalInput(), endedAt: "", outcome: "complete",
    adverse: false, adType: "vasovagal", adSeverity: "mild", adNotes: "", notes: "",
  });

  useEffect(() => {
    if (!facilityId) return;
    act(fetchScreenings({ facilityId, readyOnly: true, limit: 200 }), false);
    act(fetchDrives({ facilityId, limit: 100 }), false);
  }, [facilityId, act]);

  const screenings: any[] = bloodBank.screenings.filter((s: any) => s.outcome === "eligible" && !s.used);
  const selected = screenings.find((s) => s._id === form.v.screeningId);
  const drives = bloodBank.drives.filter((d) => d.status === "planned" || d.status === "ongoing");

  useEffect(() => {
    if (selected?.drive && !form.v.driveId) form.set("driveId", idOf(selected.drive));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?._id]);

  const sections: SectionSpec[] = [
    {
      title: "Screening",
      desc: "Only donors with a passed, unused screening can donate.",
      cols: 1,
      fields: [
        {
          key: "screeningId", label: "Eligible screening", type: "select", required: true, searchable: true,
          options: screenings.map((s) => ({ value: s._id, label: `${nameOf(s.donor)} · ${s.screeningNumber} · ${fmtDateTime(s.screenedAt)}` })),
          hint: screenings.length === 0 ? "No donors are currently screened and ready. Screen a donor first." : undefined,
        },
        {
          key: "driveId", label: "Blood drive (optional)", type: "select",
          options: [{ value: "", label: "Walk-in (no drive)" }, ...drives.map((d) => ({ value: d._id, label: `${d.driveNumber} · ${d.name}` }))],
        },
      ],
    },
    {
      title: "Collection",
      fields: [
        { key: "donationType", label: "Donation type", type: "select", options: toOpts(ENUMS.donationTypes) },
        { key: "bagType", label: "Bag type", type: "select", options: toOpts(ENUMS.bagTypes) },
        { key: "volumeMl", label: "Volume (mL)", type: "number", min: 50, max: 1000 },
        { key: "armUsed", label: "Arm used", type: "select", options: [{ value: "", label: "Not recorded" }, { value: "left", label: "Left" }, { value: "right", label: "Right" }] },
        { key: "startedAt", label: "Started", type: "datetime" },
        { key: "endedAt", label: "Ended", type: "datetime" },
        { key: "outcome", label: "Outcome", type: "select", options: toOpts(["complete", "incomplete"]), hint: "Incomplete collections are not released to stock." },
      ],
    },
    {
      title: "Adverse reaction & notes",
      fields: [
        { key: "adverse", type: "toggle", label: "Donor had an adverse reaction", span: 2 },
        { key: "adType", label: "Reaction type", type: "select", options: toOpts(ENUMS.adverseTypes), show: (v) => v.adverse },
        { key: "adSeverity", label: "Severity", type: "select", options: toOpts(ENUMS.adverseSeverities), show: (v) => v.adverse },
        { key: "adNotes", label: "Reaction notes", type: "textarea", span: 2, show: (v) => v.adverse },
        { key: "notes", label: "Notes", type: "textarea", span: 2 },
      ],
    },
  ];

  return (
    <SpecForm
      form={form}
      sections={sections}
      backHref={`${BASE}/donations`}
      title="Record donation"
      subtitle="Collection of a donor's blood"
      submitLabel="Record donation"
      saving={bloodBank.saving}
      savingText="Recording donation…"
      onSubmit={async (v) => {
        const payload: any = clean({
          donorId: idOf(selected?.donor), screeningId: v.screeningId, driveId: v.driveId,
          donationType: v.donationType, bagType: v.bagType, volumeMl: num(v.volumeMl), armUsed: v.armUsed,
          startedAt: toIso(v.startedAt), endedAt: toIso(v.endedAt), outcome: v.outcome, notes: v.notes,
        });
        payload.adverseReaction = v.adverse
          ? clean({ occurred: true, type: v.adType, severity: v.adSeverity, notes: v.adNotes })
          : { occurred: false };
        const res: any = await act(createDonation({ facilityId, payload }), "Donation recorded");
        if (res) router.push(res === true ? `${BASE}/donations` : `${BASE}/donations/${idOf(res.donation)}`);
      }}
      canSubmit={!!selected}
    />
  );
}

export default function NewDonationPage() {
  return (
    <Suspense fallback={<Page narrow><Loader /></Page>}>
      <Inner />
    </Suspense>
  );
}
