"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquareText } from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import { fetchDispenses, recordCounselling, type PharmacyDispense } from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import { Modal } from "@/components/ui/items";
import {
  Chips,
  EmptyBox,
  FormField,
  GhostButton,
  PatientAvatar,
  PharmacyPage,
  Pill,
  PrimaryButton,
  SearchBar,
  TableCard,
  TextArea,
  Th,
  fmtDateTime,
  patientName,
  personName,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

const TOPICS = ["Dosage & timing", "Side effects", "Storage", "Drug / food interactions", "Adherence", "Missed dose", "When to seek help"];

export default function CounsellingPage() {
  const { dispatch, facilityId, pharmacy, act } = usePharmacy();
  const { ui } = usePharmacyUI();
  const { dispenses, listLoading, saving } = pharmacy;

  const [view, setView] = useState<"pending" | "done">("pending");
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<PharmacyDispense | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const load = () => facilityId && dispatch(fetchDispenses({ facilityId, limit: 300 }));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  const pending = dispenses.filter((d) => !d.counselling?.done).length;
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dispenses
      .filter((d) => (view === "pending" ? !d.counselling?.done : d.counselling?.done))
      .filter((d) => !q || d.dispenseNumber.toLowerCase().includes(q) || patientName(d.patient).toLowerCase().includes(q));
  }, [dispenses, view, search]);

  const open = (d: PharmacyDispense) => {
    setTarget(d);
    setTopics([]);
    setNotes("");
  };

  const save = async () => {
    if (!target) return;
    const res = await act(recordCounselling({ facilityId, id: target._id, topics, notes: notes || undefined }));
    if (res) setTarget(null);
  };

  return (
    <PharmacyPage
      routes={[{ label: "Pharmacy", href: "/dashboard/pharmacy" }, { label: "Patient Counselling" }]}
      title="Patient Counselling"
      description="Record the advice given to patients when medicines are handed over."
      icon={MessageSquareText}
      loading={listLoading && dispenses.length === 0}
      loadingText="Loading counselling records..."
      onRefresh={load}
    >
      <SearchBar value={search} onChange={setSearch} placeholder="Search by patient or dispense number..." />
      <Chips
        value={view}
        onChange={setView}
        options={[
          { id: "pending", label: "Awaiting counselling", count: pending },
          { id: "done", label: "Counselled", count: dispenses.length - pending },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyBox icon={MessageSquareText} title={view === "pending" ? "No patients waiting for counselling." : "No counselling records yet."} />
      ) : (
        <TableCard minWidth={720}>
          <thead>
            <tr className="text-xs opacity-50 border-b" style={{ borderColor: ui.border }}>
              <Th>Patient</Th>
              <Th>Dispense</Th>
              <Th className="hidden md:table-cell">Medicines</Th>
              <Th>{view === "pending" ? "Dispensed" : "Counselled"}</Th>
              <Th className="text-right">{view === "pending" ? "Action" : "Topics"}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d._id} className="border-b last:border-0" style={{ borderColor: ui.border }}>
                <td className="px-3 py-3.5">
                  <div className="flex items-center gap-3">
                    <PatientAvatar p={d.patient} />
                    <p className="font-semibold text-xs">{patientName(d.patient)}</p>
                  </div>
                </td>
                <td className="px-3 py-3.5">
                  <span className="rounded-full px-2.5 py-1 font-mono text-[11px]" style={{ backgroundColor: ui.inner }}>{d.dispenseNumber}</span>
                  {d.counselling?.required && !d.counselling.done && <span className="ml-2"><Pill status="urgent" label="required" /></span>}
                </td>
                <td className="px-3 py-3.5 text-xs opacity-70 hidden md:table-cell max-w-[240px] truncate">{d.items.map((i) => i.drugName).join(", ")}</td>
                <td className="px-3 py-3.5 text-xs opacity-60">
                  {view === "pending" ? fmtDateTime(d.dispensedAt) : `${fmtDateTime(d.counselling.counselledAt)} · ${personName(d.counselling.counselledBy)}`}
                </td>
                <td className="px-3 py-3.5 text-right">
                  {view === "pending" ? (
                    <PrimaryButton onClick={() => open(d)}>Record</PrimaryButton>
                  ) : (
                    <span className="text-[11px] opacity-60">{d.counselling.topics.join(", ") || "—"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}

      <Modal open={!!target} onClose={() => setTarget(null)} title="Record counselling" ui={ui}>
        {target && (
          <div className="space-y-4">
            <p className="text-xs opacity-70">
              {patientName(target.patient)} · {target.items.map((i) => i.drugName).join(", ")}
            </p>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map((t) => {
                const on = topics.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTopics((x) => (on ? x.filter((y) => y !== t) : [...x, t]))}
                    className="rounded-full px-3 py-1.5 text-[11px] font-medium border transition"
                    style={{ backgroundColor: on ? PRIMARY_COLOR : ui.inner, color: on ? "#fff" : ui.text, borderColor: on ? PRIMARY_COLOR : ui.border }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <FormField label="Notes">
              <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </FormField>
            <div className="flex justify-end gap-2">
              <GhostButton onClick={() => setTarget(null)}>Cancel</GhostButton>
              <PrimaryButton onClick={save} disabled={saving || topics.length === 0}>Save counselling</PrimaryButton>
            </div>
          </div>
        )}
      </Modal>
    </PharmacyPage>
  );
}
