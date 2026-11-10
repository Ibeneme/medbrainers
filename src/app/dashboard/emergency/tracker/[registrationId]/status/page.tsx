"use client";

import { useParams } from "next/navigation";
import { fetchErRegistration, updateErStatus } from "@/api/slices";
import type { ErRegistration, ErRegistrationDetail } from "@/api/slices/emergencySlice";
import { BASE, ER, Loader, NotFound, Page, RegContext, SpecForm, clean, erLabel, idOf, useER, useForm, useLoad } from "@/components/emergency/er-ui";

const NEEDS_TRIAGE = ["triaged", "in-treatment", "observation"];
const STAGE_HINT: Record<string, string> = {
  waiting: "Back in the queue",
  triaged: "Triaged and waiting for a clinician",
  "in-resus": "In the resuscitation bay",
  "in-treatment": "Being actively treated",
  observation: "Short-stay monitoring",
};

function StatusForm({ r }: { r: ErRegistration }) {
  const { facilityId, act, router, emergency } = useER();
  const form = useForm<any>({ status: r.status, location: r.location || "", attendingClinician: idOf(r.attendingClinician), notes: r.notes || "" });
  const blocked = NEEDS_TRIAGE.includes(form.v.status) && !r.triageCategory;
  const left = ER.terminalStatuses.includes(r.status);

  return (
    <SpecForm
      form={form}
      backHref={`${BASE}/tracker/${r._id}`}
      title="Update status"
      subtitle="Move the patient through the department"
      saving={emergency.saving}
      canSubmit={!blocked && !left}
      top={
        <>
          <RegContext r={r} />
          {blocked && <p className="rounded-2xl p-4 text-sm font-medium" style={{ backgroundColor: "#f59e0b1f", color: "#d97706" }}>Triage this patient before moving them to “{erLabel(form.v.status)}”.</p>}
        </>
      }
      sections={[
        {
          cols: 1,
          fields: [
            { key: "status", label: "Stage", type: "select", required: true, hint: STAGE_HINT[form.v.status], options: ER.activeStatuses.map((s) => ({ value: s, label: erLabel(s) })) },
          ],
        },
        {
          fields: [
            { key: "location", label: "Location", placeholder: "e.g. Bay 4, Resus 2, Obs bed 3" },
            { key: "attendingClinician", label: "Attending clinician", type: "staff" },
            { key: "notes", label: "Notes", type: "textarea", span: 2 },
          ],
        },
        // leaving the department is a disposition so it is always recorded properly
      ]}
      bottom={<p className="text-xs opacity-55">To admit, refer, discharge or record a death use the buttons on the patient’s page: those keep a full record.</p>}
      onSubmit={async (v) => {
        const res = await act(updateErStatus({ facilityId, registrationId: r._id, payload: clean({ status: v.status, location: v.location?.trim(), attendingClinician: v.attendingClinician, notes: v.notes?.trim() }) as any }), "Status updated");
        if (res) router.push(`${BASE}/tracker/${r._id}`);
      }}
    />
  );
}

export default function UpdateStatusPage() {
  const { registrationId } = useParams() as { registrationId: string };
  const er = useER();
  const { data, loading } = useLoad<ErRegistrationDetail>(er, (facilityId) => fetchErRegistration({ facilityId, registrationId }), [registrationId]);
  if (loading) return <Page narrow><Loader /></Page>;
  if (!data) return <Page><NotFound what="ER visit" href={`${BASE}/tracker`} /></Page>;
  return <StatusForm r={data} />;
}
