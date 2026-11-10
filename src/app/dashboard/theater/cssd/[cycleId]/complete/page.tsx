"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { completeSterilization, fetchSterilization } from "@/api/slices/theaterSlice";
import { Card, Loader, NotFound, Page, SpecForm, TBASE, clean, fmtDateTime, opts, useForm, useTH } from "@/components/theater/th-ui";

export default function CompleteCssdPage() {
  const { cycleId } = useParams() as { cycleId: string };
  const { facilityId, act, router, theater } = useTH();
  const c = theater.cssd.find((x) => x._id === cycleId);
  const form = useForm<any>({ result: "pass", notes: "" });
  useEffect(() => { if (facilityId) act(fetchSterilization({ facilityId }), false); }, [facilityId, act]);
  if (!c) return <Page narrow>{theater.listLoading || !facilityId ? <Loader /> : <NotFound what="Cycle" href={`${TBASE}/cssd`} />}</Page>;
  const fail = form.v.result === "fail";
  return (
    <SpecForm form={form} backHref={`${TBASE}/cssd`} title="Record cycle result" subtitle={<span className="font-mono">{c.cycleNo}</span>}
      top={<Card className="space-y-1 text-sm"><p>{c.method}</p><p className="text-xs opacity-60">Started {fmtDateTime(c.startedAt)}{c.loadDescription ? ` · ${c.loadDescription}` : ""}</p></Card>}
      sections={[{ cols: 1, fields: [
        { key: "result", label: "Indicator / biological result", type: "select", required: true, options: opts(["pass", "fail"]), hint: "Check chemical indicators and, where used, the biological indicator." },
        { key: "notes", label: fail ? "What failed (required)" : "Notes", type: "textarea", required: fail },
      ] }]}
      submitLabel="Save result" danger={fail} saving={theater.saving}
      confirm={(v) => v.result === "fail" ? { title: "Record cycle as FAILED?", message: "Every item in this load must be quarantined and reprocessed. Do not release the instruments to theatre.", label: "Record failed", tone: "danger" } : { title: "Release this load?", message: "Recording a pass confirms the load is sterile and safe to use.", label: "Record pass", tone: "primary" }}
      onSubmit={async (v) => { const r = await act(completeSterilization({ facilityId, cycleId, payload: clean({ result: v.result, notes: v.notes }) as any }), "Cycle completed"); if (r) router.push(`${TBASE}/cssd`); }} />
  );
}
