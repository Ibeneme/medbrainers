"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { fetchNewborns, recordNewbornScreening } from "@/api/slices";
import type { NewbornScreeningTest } from "@/api/slices/maternitySlice";
import {
  BASE, Card, DataTable, MPill, SCREENING_STATUSES, SCREENING_TESTS, SpecForm, Suspended, SuggestInput, clean, fmtDateTime, label,
  nameOf, useForm, useMat, type SectionSpec,
} from "@/components/maternity/mat-ui";
import { CustomDropdown } from "@/components/ui/items";

function TestsEditor({ tests, onChange }: { tests: NewbornScreeningTest[]; onChange: (t: NewbornScreeningTest[]) => void }) {
  const { ui, isDark, colors } = useMat();
  const set = (i: number, patch: Partial<NewbornScreeningTest>) => onChange(tests.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  return (
    <div className="space-y-3">
      {tests.map((t, i) => (
        <div key={i} className="space-y-2 rounded-2xl border p-3" style={{ borderColor: ui.border }}>
          <div className="flex items-start gap-2">
            <div className="flex-1"><SuggestInput value={t.name} onChange={(x) => set(i, { name: x })} presets={SCREENING_TESTS} placeholder="Test name" /></div>
            <button type="button" aria-label="Remove test" onClick={() => onChange(tests.filter((_, idx) => idx !== i))} className="rounded-xl p-2 opacity-60 hover:opacity-100"><Trash2 size={16} /></button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input value={t.result ?? ""} onChange={(e) => set(i, { result: e.target.value })} placeholder="Result" className="w-full rounded-xl border bg-transparent px-3.5 py-2.5 text-sm outline-none placeholder:opacity-40" style={{ borderColor: ui.border, color: ui.text }} />
            <CustomDropdown value={t.status ?? ""} options={SCREENING_STATUSES.map((s) => ({ value: s, label: label(s) }))} onChange={(x) => set(i, { status: x })} placeholder="Status" isDark={isDark} colors={colors} border={ui.border} />
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...tests, { name: "", result: "", status: "normal" }])} className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold" style={{ backgroundColor: ui.inner }}>
        <Plus size={14} /> Add test
      </button>
    </div>
  );
}

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, maternity } = useMat();
  const form = useForm<any>({ newbornId: sp.get("newbornId") || "", tests: [{ name: "", result: "", status: "normal" }] as NewbornScreeningTest[], notes: "" });
  useEffect(() => {
    if (facilityId) act(fetchNewborns({ facilityId }), false);
  }, [facilityId, act]);
  const tests: NewbornScreeningTest[] = form.v.tests;
  const valid = tests.length > 0 && tests.every((t) => t.name.trim());

  const sections: SectionSpec[] = [
    {
      cols: 1,
      fields: [
        {
          key: "newbornId", label: "Newborn", type: "select", required: true, searchable: true,
          options: maternity.newborns.map((n) => ({ value: n._id, label: `Baby of ${nameOf(n.mother)} · ${label(n.sex)} · ${n.birthWeightGrams} g · ${fmtDateTime(n.birthDateTime)}` })),
        },
        { key: "tests", label: "Tests performed", type: "custom", render: (v, set) => <TestsEditor tests={v.tests} onChange={(t) => set("tests", t)} /> },
        { key: "notes", label: "Notes", type: "textarea" },
      ],
    },
  ];

  return (
    <SpecForm form={form} sections={sections} backHref={`${BASE}/newborn`} title="Newborn screening" subtitle="Record a screening"
      submitLabel="Save screening" saving={maternity.saving} canSubmit={valid}
      bottom={maternity.screenings.length > 0 ? (
        <Card className="space-y-3">
          <p className="text-sm font-semibold">Recorded in this session</p>
          <p className="text-[10px] opacity-50">The server does not list past screenings yet, so only those saved since you opened the app appear here.</p>
          <DataTable head={["Date", "Baby", "Tests"]} rows={maternity.screenings.map((s) => {
            const n = maternity.newborns.find((x) => x._id === s.newborn);
            return [fmtDateTime(s.screeningDate), n ? `Baby of ${nameOf(n.mother)}` : "—", <span key="t" className="flex flex-wrap gap-1.5">{s.tests.map((t) => <span key={t.name}>{t.name} <MPill value={t.status} /></span>)}</span>];
          })} />
        </Card>
      ) : undefined}
      onSubmit={async (x) => {
        const r = await act(recordNewbornScreening({ facilityId, payload: { newbornId: x.newbornId, tests: x.tests.map((t: NewbornScreeningTest) => clean({ name: t.name.trim(), result: t.result, status: t.status })), ...clean({ notes: x.notes }) } as any }));
        if (r) form.patch({ tests: [{ name: "", result: "", status: "normal" }], notes: "" });
      }} />
  );
}

export default function NewbornScreeningPage() {
  return (
    <Suspended>
      <Inner />
    </Suspended>
  );
}
