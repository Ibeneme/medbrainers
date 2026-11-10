"use client";

import { addImplant } from "@/api/slices/theaterSlice";
import { CaseFormPage, TBASE, clean, num, useTH } from "@/components/theater/th-ui";

export default function NewImplantPage() {
  const { facilityId, act, router } = useTH();
  return (
    <CaseFormPage title="Implant / consumable" subtitle="Record lot and serial numbers for recall tracing" backHref={`${TBASE}/implants`} submitLabel="Save implant" statuses={["pre-op", "in-theatre", "recovery", "completed"]}
      initial={{ implantName: "", manufacturer: "", lotNumber: "", serialNumber: "", quantity: "1", notes: "" }}
      sections={({ caseField }) => [
        { cols: 1, fields: [caseField] },
        { title: "Item", fields: [
          { key: "implantName", label: "Implant / consumable", required: true, span: 2, placeholder: "e.g. Titanium locking plate 8-hole" },
          { key: "manufacturer", label: "Manufacturer" }, { key: "quantity", label: "Quantity", type: "number", min: 1, max: 1000 },
          { key: "lotNumber", label: "Lot number" }, { key: "serialNumber", label: "Serial number" },
          { key: "notes", label: "Notes", type: "textarea", span: 2 },
        ] },
      ]}
      submit={async (v) => { const r = await act(addImplant({ facilityId, caseId: v.caseId, payload: clean({ implantName: v.implantName.trim(), manufacturer: v.manufacturer, lotNumber: v.lotNumber, serialNumber: v.serialNumber, quantity: num(v.quantity), notes: v.notes }) as any }), "Implant recorded"); if (r) router.push(`${TBASE}/implants`); }} />
  );
}
