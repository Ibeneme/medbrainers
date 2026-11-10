"use client";

import { startSterilization } from "@/api/slices/theaterSlice";
import { SpecForm, TBASE, TH, clean, plain, useForm, useTH } from "@/components/theater/th-ui";

export default function NewCssdCyclePage() {
  const { facilityId, act, router, theater } = useTH();
  const form = useForm<any>({ cycleNo: "", method: "Steam autoclave", loadDescription: "", notes: "" });
  return (
    <SpecForm form={form} backHref={`${TBASE}/cssd`} title="Start sterilization cycle" subtitle="Log what is going into the machine"
      sections={[{ fields: [
        { key: "cycleNo", label: "Cycle / batch number", required: true, placeholder: "e.g. AC1-2026-0142" },
        { key: "method", label: "Method", type: "select", required: true, options: plain(TH.cssdMethods) },
        { key: "loadDescription", label: "Load description", type: "textarea", span: 2, placeholder: "e.g. 4 laparotomy sets, 2 orthopaedic trays" },
        { key: "notes", label: "Notes", type: "textarea", span: 2 },
      ] }]}
      submitLabel="Start cycle" saving={theater.saving}
      onSubmit={async (v) => { const r = await act(startSterilization({ facilityId, payload: clean({ cycleNo: v.cycleNo.trim(), method: v.method, loadDescription: v.loadDescription, notes: v.notes }) as any }), "Sterilization cycle started"); if (r) router.push(`${TBASE}/cssd`); }} />
  );
}
