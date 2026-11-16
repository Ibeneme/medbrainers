"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search, UserRound, X } from "lucide-react";
import api, { getErrorMessage } from "@/api/services";
import { DEPARTMENT_LABELS, BILLING_DEPARTMENTS, fetchPickerItems, type BillingDepartment, type BillingItem } from "@/api/slices";
import type { Patient } from "@/api/types";
import { useBilling } from "@/hooks/useBilling";
import { Chips, Pill, useBillingUI } from "./BillingUI";

export type PatientLite = { _id: string; name: string; mrn?: string; phone?: string; email?: string; familySize?: number };

const toLite = (p: Patient): PatientLite => ({
  _id: p._id,
  name: `${p.firstName} ${p.lastName}`.trim(),
  mrn: p.mrn,
  phone: p.phone,
  email: p.email,
  // the patient plus their registered relatives — offered to the cashier as a "family of N" shortcut
  familySize: p.family && p.family.length > 0 ? p.family.length + 1 : undefined,
});

/** Look up one patient by id (used when arriving from a patient's page with ?patientId=). Tenant-scoped by the URL. */
export async function loadPatientLite(facilityId: string, patientId: string): Promise<PatientLite | null> {
  try {
    const { data } = await api.get(`/companies/${facilityId}/patients/${patientId}`);
    return data?.data ? toLite(data.data as Patient) : null;
  } catch {
    return null;
  }
}

/**
 * Optional patient link for a sale. Uses its own small lookup so it never disturbs the patients list state.
 * Needs the `patients.view` permission; without it the picker explains how to continue (anonymous sale).
 */
export function PatientPicker({ value, onChange }: { value: PatientLite | null; onChange: (p: PatientLite | null) => void }) {
  const { facilityId } = useBilling();
  const { ui, softShadow } = useBillingUI();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PatientLite[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2 || !facilityId) {
      setResults([]);
      setErr(null);
      return;
    }
    const mine = ++seq.current;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const { data } = await api.get(`/companies/${facilityId}/patients`, { params: { search: term, limit: 8 } });
        if (mine !== seq.current) return; // a newer search is in flight — ignore this late answer
        setResults(((data?.data ?? []) as Patient[]).map(toLite));
        setErr(null);
      } catch (e) {
        if (mine !== seq.current) return;
        setResults([]);
        setErr(getErrorMessage(e, "Could not search patients"));
      } finally {
        if (mine === seq.current) setBusy(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q, facilityId]);

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-2xl p-3" style={{ backgroundColor: ui.inner }}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/5"><UserRound size={16} /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{value.name}</p>
          <p className="truncate text-[11px] opacity-55">{[value.mrn, value.phone].filter(Boolean).join(" · ") || "Patient"}</p>
        </div>
        <button type="button" onClick={() => onChange(null)} className="rounded-lg p-1.5 opacity-60 hover:opacity-100" aria-label="Remove patient">
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5" style={{ backgroundColor: ui.inner }}>
        <Search size={14} className="shrink-0 opacity-40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Link a patient (name, MRN or phone) — optional"
          className="w-full bg-transparent text-sm outline-none placeholder:opacity-45"
          style={{ color: ui.text }}
        />
        {busy && <span className="text-[10px] opacity-50">searching…</span>}
      </div>
      {err && <p className="mt-1.5 text-[11px] text-amber-600">{err} — you can still continue without a patient.</p>}
      {results.length > 0 && (
        <ul className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-2xl p-1.5" style={{ backgroundColor: ui.card, boxShadow: softShadow }}>
          {results.map((p) => (
            <li key={p._id}>
              <button
                type="button"
                onClick={() => {
                  onChange(p);
                  setQ("");
                  setResults([]);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-black/5"
              >
                <span className="truncate font-medium">{p.name}</span>
                <span className="shrink-0 text-[11px] opacity-55">{[p.mrn, p.phone].filter(Boolean).join(" · ")}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {q.trim().length >= 2 && !busy && !err && results.length === 0 && <p className="mt-1.5 text-[11px] opacity-55">No patients found.</p>}
    </div>
  );
}

/**
 * Searchable list of ACTIVE catalog items. Items without a price can't appear here at all — the server
 * only lists priced items, and refuses to bill anything else.
 */
export function ItemPicker({ onAdd }: { onAdd: (item: BillingItem) => void }) {
  const { facilityId, dispatch, billing, money } = useBilling();
  const { ui } = useBillingUI();
  const [dept, setDept] = useState<"all" | BillingDepartment>("all");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchPickerItems({ facilityId, search: debounced || undefined, department: dept === "all" ? undefined : dept }));
  }, [dispatch, facilityId, debounced, dept]);

  const items = billing.pickerItems;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5" style={{ backgroundColor: ui.inner }}>
        <Search size={14} className="shrink-0 opacity-40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search services, drugs, tests…"
          className="w-full bg-transparent text-sm outline-none placeholder:opacity-45"
          style={{ color: ui.text }}
        />
      </div>
      <Chips
        value={dept}
        onChange={setDept}
        options={[{ id: "all" as const, label: "All" }, ...BILLING_DEPARTMENTS.map((d) => ({ id: d, label: DEPARTMENT_LABELS[d] }))]}
      />
      {items.length === 0 ? (
        <p className="rounded-2xl p-6 text-center text-xs opacity-55" style={{ backgroundColor: ui.inner }}>
          {debounced || dept !== "all" ? "Nothing matches. Only priced, active items can be sold." : "The price catalog is empty — add priced items first."}
        </p>
      ) : (
        <ul className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
          {items.map((it) => (
            <li key={it._id}>
              <button
                type="button"
                onClick={() => onAdd(it)}
                className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:opacity-90"
                style={{ backgroundColor: ui.inner }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.name}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-[11px] opacity-55">
                    <span className="font-mono">{it.itemId}</span>
                    <Pill label={DEPARTMENT_LABELS[it.department]} color="#6b7280" />
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{money(it.unitPrice)}</span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: "var(--brand-primary, #29AB29)" }}>
                  <Plus size={15} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
