"use client";

import { addCount } from "@/api/slices/theaterSlice";
import { Banner, CaseFormPage, TBASE, TH, clean, num, opts, useTH } from "@/components/theater/th-ui";

export default function NewCountPage() {
  const { facilityId, act, router } = useTH();
  return (
    <CaseFormPage title="Instrument / swab count" subtitle="Record counts before closing" backHref={`${TBASE}/counts`} submitLabel="Save count" statuses={["pre-op", "in-theatre", "recovery", "completed"]}
      initial={{ itemType: "swab", itemName: "", countInitial: "", countFinal: "", correct: true, notes: "" }}
      sections={({ caseField }) => [
        { cols: 1, fields: [caseField] },
        { title: "Count", fields: [
          { key: "itemType", label: "Item type", type: "select", options: opts(TH.countTypes) },
          { key: "itemName", label: "Item", required: true, placeholder: "e.g. Laparotomy swabs, Mayo scissors" },
          { key: "countInitial", label: "Initial count", type: "number", min: 0 },
          { key: "countFinal", label: "Final count", type: "number", min: 0 },
          { key: "correct", type: "toggle", label: "Count is correct", hint: "Switch off if initial and final do not match.", span: 2 },
          { key: "notes", label: "Notes", type: "textarea", span: 2 },
        ] },
      ]}
      top={(v) => num(v.countInitial) !== undefined && num(v.countFinal) !== undefined && num(v.countInitial) !== num(v.countFinal) ? <Banner tone="bad">Initial ({v.countInitial}) and final ({v.countFinal}) counts do not match. Search the field, repeat the count and consider an X-ray before closing.</Banner> : null}
      confirm={(v) => !v.correct || (num(v.countInitial) !== undefined && num(v.countFinal) !== undefined && num(v.countInitial) !== num(v.countFinal) && v.correct)
        ? { title: !v.correct ? "Record a count DISCREPANCY?" : "Counts differ but marked correct", message: !v.correct ? "A discrepancy must be resolved before the wound is closed. Inform the surgeon and the circulating nurse now." : "The initial and final numbers are different. Are you sure the count is correct?", label: !v.correct ? "Record discrepancy" : "Yes, it is correct", tone: "danger" } : null}
      submit={async (v) => { const r = await act(addCount({ facilityId, caseId: v.caseId, payload: clean({ itemType: v.itemType, itemName: v.itemName.trim(), countInitial: num(v.countInitial), countFinal: num(v.countFinal), correct: v.correct, notes: v.notes }) as any }), "Count recorded"); if (r) router.push(`${TBASE}/counts`); }} />
  );
}
