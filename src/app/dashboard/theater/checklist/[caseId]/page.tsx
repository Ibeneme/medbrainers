"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchTheatreCase, updateChecklist } from "@/api/slices/theaterSlice";
import { Loader, NotFound, Page, SpecForm, TBASE, caseLabel, clean, fmtDateTime, useForm, useTH } from "@/components/theater/th-ui";

export default function ChecklistCasePage() {
  const { caseId } = useParams() as { caseId: string };
  const { facilityId, act, router, theater } = useTH();
  const c: any = theater.activeCase?._id === caseId ? theater.activeCase : null;
  const cl = c?.records?.checklist;
  const form = useForm<any>({ signIn: false, timeOut: false, signOut: false, notes: "" });

  useEffect(() => { if (facilityId) act(fetchTheatreCase({ facilityId, caseId }), false); }, [facilityId, caseId, act]);
  useEffect(() => { if (c) form.setV({ signIn: !!cl?.signInCompleted, timeOut: !!cl?.timeOutCompleted, signOut: !!cl?.signOutCompleted, notes: cl?.notes || "" }); /* eslint-disable-next-line */ }, [c?._id, !!cl]);

  if (!c) return <Page narrow>{theater.detailLoading ? <Loader /> : <NotFound what="Case" href={`${TBASE}/checklist`} />}</Page>;

  return (
    <SpecForm form={form} backHref={`${TBASE}/checklist`} title="Surgical safety checklist" subtitle={caseLabel(c)}
      sections={[
        { title: "Before induction of anaesthesia: SIGN IN", desc: "Patient identity, site and procedure confirmed, consent signed, site marked, anaesthesia machine and pulse oximeter checked, allergies and airway risk reviewed.", cols: 1, fields: [{ key: "signIn", type: "toggle", label: "Sign-in completed", hint: cl?.signInAt ? `Done ${fmtDateTime(cl.signInAt)}` : undefined }] },
        { title: "Before skin incision: TIME OUT", desc: "Team introduced by name and role, patient, site and procedure confirmed aloud, antibiotic prophylaxis given, critical events anticipated, imaging displayed.", cols: 1, fields: [{ key: "timeOut", type: "toggle", label: "Time-out completed", hint: cl?.timeOutAt ? `Done ${fmtDateTime(cl.timeOutAt)}` : undefined }] },
        { title: "Before the patient leaves theatre: SIGN OUT", desc: "Procedure recorded, instrument, swab and needle counts correct, specimens labelled, equipment problems noted, recovery plan discussed.", cols: 1, fields: [{ key: "signOut", type: "toggle", label: "Sign-out completed", hint: cl?.signOutAt ? `Done ${fmtDateTime(cl.signOutAt)}` : undefined }] },
        { cols: 1, fields: [{ key: "notes", label: "Notes", type: "textarea" }] },
      ]}
      submitLabel="Save checklist" saving={theater.saving}
      confirm={(v) => v.signOut && !cl?.signOutCompleted ? { title: "Confirm sign-out", message: "Confirm the instrument, swab and needle counts are correct and specimens are labelled before the patient leaves theatre.", label: "Counts are correct", tone: "primary" } : null}
      onSubmit={async (v) => {
        const r = await act(updateChecklist({ facilityId, caseId, payload: clean({ signInCompleted: v.signIn, timeOutCompleted: v.timeOut, signOutCompleted: v.signOut, notes: v.notes }) as any }), "Checklist saved");
        if (r) router.push(`${TBASE}/schedule/${caseId}`);
      }} />
  );
}
