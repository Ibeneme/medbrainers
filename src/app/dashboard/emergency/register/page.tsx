"use client";

import { Suspense, useEffect } from "react";
import Link from "@/components/access/guarded-link";
import { useSearchParams } from "next/navigation";
import { fetchErDispatch, registerErPatient, updateErDispatch } from "@/api/slices";
import { BASE, ER, Loader, Page, SpecForm, clean, erLabel, idOf, useER, useForm } from "@/components/emergency/er-ui";

function Inner() {
  const sp = useSearchParams();
  const dispatchId = sp.get("dispatchId") || "";
  const { facilityId, act, router, emergency } = useER();
  const form = useForm<any>({
    unidentified: false, patientId: "", temporaryName: "",
    arrivalMode: dispatchId ? "ambulance" : "walk-in", chiefComplaint: "", notes: "",
  });

  // Coming from an ambulance call: pre-fill what the crew already told us.
  useEffect(() => {
    if (!facilityId || !dispatchId) return;
    act<any>(fetchErDispatch({ facilityId, dispatchId }), false).then((d) => {
      if (d && d !== true && d.chiefComplaint) form.patch({ chiefComplaint: d.chiefComplaint });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId, dispatchId, act]);

  const v = form.v;
  return (
    <SpecForm
      form={form}
      backHref={BASE}
      title="Emergency registration"
      subtitle="Log the arrival first, triage comes next"
      submitLabel="Register & triage"
      saving={emergency.saving}
      sections={[
        {
          title: "Patient",
          cols: 1,
          fields: [
            { key: "unidentified", type: "toggle", label: "Unidentified patient", hint: "Unconscious, no ID, or nobody to speak for them. You can link a record later." },
            { key: "patientId", label: "Patient record", type: "patient", required: true, show: (x) => !x.unidentified, hint: "Not registered yet? Register the patient on the Patients page first, then come back." },
            { key: "temporaryName", label: "Temporary name", required: true, show: (x) => x.unidentified, placeholder: "e.g. Unknown male ~40y, RTA", hint: "Use a name staff will recognise on the board." },
          ],
        },
        {
          title: "Arrival",
          fields: [
            { key: "arrivalMode", label: "How did they arrive?", type: "select", required: true, options: ER.arrivalModes.map((m) => ({ value: m, label: erLabel(m) })) },
            { key: "chiefComplaint", label: "Chief complaint", type: "textarea", required: true, span: 2, placeholder: "e.g. Chest pain for 2 hours, sweating" },
            { key: "notes", label: "Notes", type: "textarea", span: 2 },
          ],
        },
      ]}
      top={
        <p className="text-xs opacity-60">
          Need to create a patient record first?{" "}
          <Link href="/dashboard/patients/register" className="underline">Register a new patient</Link>
        </p>
      }
      onSubmit={async () => {
        const payload: any = clean({
          arrivalMode: v.arrivalMode,
          chiefComplaint: v.chiefComplaint.trim(),
          notes: v.notes,
          ...(v.unidentified ? { isUnknown: true, temporaryName: v.temporaryName.trim() } : { patientId: v.patientId }),
        });
        const res: any = await act(registerErPatient({ facilityId, payload }), "Patient registered");
        if (!res) return;
        if (dispatchId && res !== true) {
          await act(updateErDispatch({ facilityId, dispatchId, payload: { linkedRegistrationId: idOf(res) } }), false);
        }
        router.push(res === true ? `${BASE}/triage` : `${BASE}/triage/${idOf(res)}`);
      }}
    />
  );
}

export default function RegisterPage() {
  return <Suspense fallback={<Page narrow><Loader /></Page>}><Inner /></Suspense>;
}
