"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchTestingByDonation, recordTti } from "@/api/slices";
import {
  BASE, Card, DataTable, ENUMS, Loader, NotFound, Page, Pill, SpecForm, clean, fmtDateTime, label, nameOf,
  toOpts, useBB, useForm, useLoad, type FieldSpec, type SectionSpec,
} from "@/components/blood-bank/bb-ui";

export default function RecordTtiPage() {
  const { donationId } = useParams() as { donationId: string };
  const bb = useBB();
  const { facilityId, act, router, bloodBank } = bb;
  const { data: t, status } = useLoad<any>(bb, (f) => fetchTestingByDonation({ facilityId: f, donationId }), [donationId]);
  const form = useForm<any>({});

  const required: string[] = t?.requiredTests || [];
  const tests = Array.from(new Set([...required, ...ENUMS.ttiTests]));

  useEffect(() => {
    if (!t) return;
    const init: any = {};
    tests.forEach((k) => {
      const ex = (t.tti?.results || []).find((r: any) => r.test === k);
      init[`${k}_result`] = ex?.result || "";
      init[`${k}_method`] = ex?.method || "rapid";
      init[`${k}_kit`] = ex?.kitName || "";
      init[`${k}_lot`] = ex?.lotNumber || "";
    });
    init.notes = "";
    form.setV(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t?._id]);

  if (status === "loading") return <Page narrow><Loader /></Page>;
  if (!t) return <Page narrow><NotFound what="Donation" href={`${BASE}/testing`} /></Page>;

  const locked = t.tti?.status === "reactive";
  const sections: SectionSpec[] = [
    ...tests.map<SectionSpec>((k) => ({
      title: `${label(k)}${required.includes(k) ? " (required)" : ""}`,
      cols: 3,
      fields: [
        { key: `${k}_result`, label: "Result", type: "select", options: [{ value: "", label: "Not tested" }, ...toOpts(ENUMS.ttiResults)] } as FieldSpec,
        { key: `${k}_method`, label: "Method", type: "select", options: toOpts(ENUMS.ttiMethods) } as FieldSpec,
        { key: `${k}_kit`, label: "Kit / assay name" } as FieldSpec,
        { key: `${k}_lot`, label: "Lot number" } as FieldSpec,
      ],
    })),
    { cols: 1, fields: [{ key: "notes", label: "Notes", type: "textarea" }] },
  ];

  const hasReactive = tests.some((k) => form.v[`${k}_result`] === "reactive");
  const any = tests.some((k) => form.v[`${k}_result`]);

  return (
    <SpecForm
      form={form}
      sections={sections}
      backHref={`${BASE}/testing`}
      title={`TTI results · ${t.donationNumber}`}
      subtitle={`Collected ${fmtDateTime(t.collectedAt)}`}
      submitLabel="Save results"
      saving={bloodBank.saving}
      canSubmit={any && !locked}
      top={
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recorded so far</h2>
            <Pill value={t.tti?.status} />
          </div>
          {locked && <p className="text-sm text-red-500">This donation is reactive and locked – results can no longer be changed.</p>}
          <DataTable
            head={["Test", "Result", "Method", "By", "When"]}
            empty="No results recorded yet."
            rows={(t.tti?.results || []).map((r: any) => [label(r.test), <Pill key="r" value={r.result} />, label(r.method), nameOf(r.testedBy), fmtDateTime(r.testedAt)])}
          />
          {t.missingTests?.length > 0 && <p className="text-xs opacity-60">Still needed: {t.missingTests.map(label).join(", ")}</p>}
        </Card>
      }
      confirm={() =>
        hasReactive
          ? {
              title: "Record a reactive result?",
              message: "A reactive result locks the donation, discards all its units automatically and places the donor on hold. This cannot be reversed.",
              label: "Record reactive result",
              tone: "danger",
            }
          : null
      }
      danger={hasReactive}
      onSubmit={async (v) => {
        const results = tests
          .filter((k) => v[`${k}_result`])
          .map((k) => clean({ test: k, result: v[`${k}_result`], method: v[`${k}_method`], kitName: v[`${k}_kit`], lotNumber: v[`${k}_lot`] }));
        const r = await act(recordTti({ facilityId, donationId, payload: clean({ results, notes: v.notes }) }), "TTI results recorded");
        if (r) router.push(`${BASE}/testing`);
      }}
    />
  );
}
