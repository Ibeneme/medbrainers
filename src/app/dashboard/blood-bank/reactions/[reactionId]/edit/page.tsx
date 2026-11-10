"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchReactionById, updateReaction } from "@/api/slices";
import { BASE, ENUMS, Loader, NotFound, Page, SpecForm, clean, toOpts, useBB, useForm, type SectionSpec } from "@/components/blood-bank/bb-ui";

export default function EditReactionPage() {
  const { reactionId } = useParams() as { reactionId: string };
  const { facilityId, act, router, bloodBank } = useBB();
  const r: any = bloodBank.activeReaction?._id === reactionId ? bloodBank.activeReaction : null;
  const form = useForm<any>({});
  useEffect(() => { if (facilityId) act(fetchReactionById({ facilityId, reactionId }), false); }, [facilityId, reactionId, act]);
  useEffect(() => {
    if (!r) return;
    const i = r.investigation || {};
    form.setV({
      type: r.type, severity: r.severity, imputability: r.imputability || "", actionsTaken: r.actionsTaken || "", status: r.status, outcome: r.outcome || "",
      reportedToAuthority: !!r.reportedToAuthority, closureNotes: r.closureNotes || "", notes: r.notes || "",
      clericalCheckDone: !!i.clericalCheckDone, visualHemolysisCheck: !!i.visualHemolysisCheck, directCoombs: i.directCoombs || "not_done",
      repeatGroupingCrossmatch: i.repeatGroupingCrossmatch || "not_done", bagCulture: i.bagCulture || "not_done", patientCulture: i.patientCulture || "not_done", invNotes: i.notes || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r?._id]);
  if (form.v.type === undefined) return <Page narrow>{bloodBank.detailLoading ? <Loader /> : <NotFound what="Reaction" href={`${BASE}/reactions`} />}</Page>;

  const sections: SectionSpec[] = [
    { title: "Classification", fields: [
      { key: "type", label: "Type", type: "select", options: toOpts(ENUMS.reactionTypes) },
      { key: "severity", label: "Severity", type: "select", options: toOpts(ENUMS.severities) },
      { key: "imputability", label: "Imputability", type: "select", options: [{ value: "", label: "Not assessed" }, ...toOpts(ENUMS.imputability)] },
      { key: "reportedToAuthority", type: "toggle", label: "Reported to haemovigilance authority" },
      { key: "actionsTaken", label: "Actions taken", type: "textarea", span: 2 },
    ] },
    { title: "Laboratory investigation", fields: [
      { key: "clericalCheckDone", type: "toggle", label: "Clerical check done" },
      { key: "visualHemolysisCheck", type: "toggle", label: "Visual haemolysis check done" },
      { key: "directCoombs", label: "Direct Coombs", type: "select", options: toOpts(ENUMS.testResults3) },
      { key: "repeatGroupingCrossmatch", label: "Repeat grouping / crossmatch", type: "select", options: toOpts(ENUMS.consistency) },
      { key: "bagCulture", label: "Bag culture", type: "select", options: toOpts(ENUMS.testResults3) },
      { key: "patientCulture", label: "Patient culture", type: "select", options: toOpts(ENUMS.testResults3) },
      { key: "invNotes", label: "Investigation notes", type: "textarea", span: 2 },
    ] },
    { title: "Status", fields: [
      { key: "status", label: "Status", type: "select", options: toOpts(ENUMS.reactionStatuses) },
      { key: "outcome", label: "Outcome", type: "select", options: [{ value: "", label: "Not recorded" }, ...toOpts(ENUMS.reactionOutcomes)] },
      { key: "closureNotes", label: "Closure notes", type: "textarea", span: 2, show: (v) => v.status === "closed" },
      { key: "notes", label: "Notes", type: "textarea", span: 2 },
    ] },
  ];

  return (
    <SpecForm form={form} sections={sections} backHref={`${BASE}/reactions/${reactionId}`} title="Update reaction" subtitle={<span className="font-mono">{r?.reactionNumber}</span>}
      submitLabel="Save changes" saving={bloodBank.saving}
      confirm={(v) => v.status === "closed" && r?.status !== "closed" ? { title: "Close this reaction?", message: "Closing records the investigation as finished. Make sure the outcome and closure notes are complete.", label: "Close reaction", tone: "primary" } : null}
      onSubmit={async (v) => {
        const payload: any = clean({
          type: v.type, severity: v.severity, imputability: v.imputability, actionsTaken: v.actionsTaken, status: v.status, outcome: v.outcome,
          reportedToAuthority: v.reportedToAuthority, closureNotes: v.status === "closed" ? v.closureNotes : undefined, notes: v.notes,
        });
        payload.investigation = clean({ clericalCheckDone: v.clericalCheckDone, visualHemolysisCheck: v.visualHemolysisCheck, directCoombs: v.directCoombs, repeatGroupingCrossmatch: v.repeatGroupingCrossmatch, bagCulture: v.bagCulture, patientCulture: v.patientCulture, notes: v.invNotes });
        const res = await act(updateReaction({ facilityId, reactionId, payload }), "Reaction updated");
        if (res) router.push(`${BASE}/reactions/${reactionId}`);
      }} />
  );
}
