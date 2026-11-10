"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createRequest } from "@/api/slices";
import { CustomDropdown } from "@/components/ui/items";
import {
  BASE, ENUMS, Loader, Page, PRODUCT_OPTS, SpecForm, clean, idOf, num, toIso, toOpts, useBB, useForm, type SectionSpec,
} from "@/components/blood-bank/bb-ui";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, router, bloodBank, ui, isDark, colors } = useBB();
  const form = useForm<any>({
    patientId: sp.get("patientId") || "", items: [{ product: "packed_red_cells", units: "1" }], urgency: "routine", requiredAt: "",
    indication: "", diagnosis: "", location: "", hb: "", plt: "", inr: "", prevTransfusion: false, prevReaction: false, pregnancy: false, notes: "",
  });

  const sections: SectionSpec[] = [
    { title: "Patient", cols: 1, fields: [{ key: "patientId", label: "Patient", type: "patient", required: true }] },
    {
      title: "Products requested", cols: 1,
      fields: [{
        key: "items", type: "custom",
        render: (v, set) => (
          <div className="space-y-3">
            {v.items.map((it: any, i: number) => (
              <div key={i} className="flex items-end gap-3">
                <div className="flex-1">
                  <CustomDropdown value={it.product} placeholder="Select product…" options={PRODUCT_OPTS} onChange={(p) => set("items", v.items.map((x: any, j: number) => (j === i ? { ...x, product: p } : x)))} isDark={isDark} colors={colors} border={ui.border} />
                </div>
                <input type="number" min={1} max={50} value={it.units} onChange={(e) => set("items", v.items.map((x: any, j: number) => (j === i ? { ...x, units: e.target.value } : x)))}
                  className="w-24 rounded-xl border bg-transparent px-3.5 py-2.5 text-sm outline-none" style={{ borderColor: ui.border, color: ui.text }} aria-label="Units" placeholder="Units" />
                <button type="button" disabled={v.items.length === 1} onClick={() => set("items", v.items.filter((_: any, j: number) => j !== i))} className="rounded-xl p-3 opacity-60 hover:opacity-100 disabled:opacity-20"><Trash2 size={15} /></button>
              </div>
            ))}
            {v.items.length < 7 && (
              <button type="button" onClick={() => set("items", [...v.items, { product: "fresh_frozen_plasma", units: "1" }])} className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold" style={{ backgroundColor: ui.inner }}>
                <Plus size={13} /> Add product
              </button>
            )}
          </div>
        ),
      }],
    },
    {
      title: "Clinical details",
      fields: [
        { key: "urgency", label: "Urgency", type: "select", options: toOpts(ENUMS.urgencies) },
        { key: "requiredAt", label: "Required by", type: "datetime" },
        { key: "indication", label: "Indication for transfusion", required: true, span: 2, placeholder: "e.g. Post-partum haemorrhage, Hb 5.2" },
        { key: "diagnosis", label: "Diagnosis" },
        { key: "location", label: "Ward / location" },
        { key: "hb", label: "Haemoglobin (g/dL)", type: "number" },
        { key: "plt", label: "Platelet count", type: "number" },
        { key: "inr", label: "INR", type: "number" },
        { key: "prevTransfusion", type: "toggle", label: "Previously transfused" },
        { key: "prevReaction", type: "toggle", label: "Previous transfusion reaction" },
        { key: "pregnancy", type: "toggle", label: "Pregnancy history" },
        { key: "notes", label: "Notes", type: "textarea", span: 2 },
      ],
    },
  ];

  const itemsOk = form.v.items.every((i: any) => num(i.units) && num(i.units)! >= 1) && new Set(form.v.items.map((i: any) => i.product)).size === form.v.items.length;

  return (
    <SpecForm
      form={form}
      sections={sections}
      backHref={`${BASE}/requests`}
      title="New blood request"
      subtitle="Request blood products for a patient"
      submitLabel="Submit request"
      saving={bloodBank.saving}
      canSubmit={itemsOk}
      danger={form.v.urgency === "emergency"}
      confirm={(v) => v.urgency === "emergency" ? { title: "Submit as EMERGENCY?", message: "Emergency requests are flagged to the blood bank team immediately. Use only for life-threatening bleeding.", label: "Submit emergency request", tone: "danger" } : null}
      onSubmit={async (v) => {
        const labs = clean({ hemoglobin: num(v.hb), plateletCount: num(v.plt), inr: num(v.inr) });
        const payload: any = clean({
          patientId: v.patientId, items: v.items.map((i: any) => ({ product: i.product, units: num(i.units) })), urgency: v.urgency,
          requiredAt: toIso(v.requiredAt), indication: v.indication.trim(), diagnosis: v.diagnosis, location: v.location,
          previousTransfusion: v.prevTransfusion, previousReaction: v.prevReaction, pregnancyHistory: v.pregnancy, notes: v.notes,
        });
        if (Object.keys(labs).length) payload.labs = labs;
        const res: any = await act(createRequest({ facilityId, payload }), "Request submitted");
        if (res) router.push(res === true ? `${BASE}/requests` : `${BASE}/requests/${idOf(res)}`);
      }}
    />
  );
}

export default function NewRequestPage() {
  return <Suspense fallback={<Page narrow><Loader /></Page>}><Inner /></Suspense>;
}
