"use client";

import { useEffect, useMemo, useState } from "react";
import { PackageCheck, RotateCcw, AlertTriangle, BadgeCheck } from "lucide-react";
import { fetchDispenses, fetchPrescriptions, refillDispense, verifyPrescription, type PharmacyDispense } from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import { Modal } from "@/components/ui/items";
import {
  Alert,
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
  money,
  patientName,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

export default function DispensingPage() {
  const { dispatch, facilityId, pharmacy, showToast, act } = usePharmacy();
  const { ui } = usePharmacyUI();
  const { prescriptions, dispenses, listLoading, saving } = pharmacy;

  const [tab, setTab] = useState<"ready" | "verify" | "history">("ready");
  const [search, setSearch] = useState("");
  const [refill, setRefill] = useState<{ d: PharmacyDispense; warning?: string } | null>(null);
  const [override, setOverride] = useState("");

  const load = () => {
    if (!facilityId) return;
    dispatch(fetchPrescriptions({ facilityId }));
    dispatch(fetchDispenses({ facilityId }));
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  const q = search.trim().toLowerCase();
  const ready = useMemo(
    () =>
      prescriptions
        .filter((r) => r.status === "verified" || r.status === "partially_dispensed")
        .filter((r) => !q || r.rxNumber.toLowerCase().includes(q) || patientName(r.patient).toLowerCase().includes(q) || String((r.patient as any)?.mrn || "").toLowerCase().includes(q)),
    [prescriptions, q],
  );
  const pendingRx = useMemo(
    () =>
      prescriptions
        .filter((r) => r.status === "pending")
        .filter((r) => !q || r.rxNumber.toLowerCase().includes(q) || patientName(r.patient).toLowerCase().includes(q)),
    [prescriptions, q],
  );
  const awaiting = prescriptions.filter((r) => r.status === "pending").length;
  const quickVerify = async (id: string) => {
    const res = await act(verifyPrescription({ facilityId, id }));
    if (res) load();
  };
  const history = useMemo(
    () => dispenses.filter((d) => !q || d.dispenseNumber.toLowerCase().includes(q) || patientName(d.patient).toLowerCase().includes(q) || d.items.some((i) => i.drugName.toLowerCase().includes(q))),
    [dispenses, q],
  );

  const runRefill = async (d: PharmacyDispense, allergyOverrideReason?: string) => {
    try {
      const res = await dispatch(refillDispense({ facilityId, id: d._id, allergyOverrideReason })).unwrap();
      showToast(res.message || "Refill dispensed", "success");
      setRefill(null);
      setOverride("");
      load();
    } catch (e) {
      const msg = typeof e === "string" ? e : "Could not process refill";
      if (msg.startsWith("Allergy warning")) setRefill({ d, warning: msg });
      else {
        showToast(msg, "error");
        setRefill(null);
      }
    }
  };

  return (
    <PharmacyPage
      routes={[{ label: "Pharmacy", href: "/dashboard/pharmacy" }, { label: "Dispensing & Refills" }]}
      title="Dispensing & Refills"
      description="Dispense verified prescriptions first-expiry-first-out, or process a refill from a previous dispense."
      icon={PackageCheck}
      loading={listLoading && prescriptions.length === 0 && dispenses.length === 0}
      loadingText="Loading dispensing..."
      onRefresh={load}
    >
      {awaiting > 0 && (
        <button type="button" onClick={() => setTab("verify")} className="block w-full text-left">
          <Alert tone="info"><strong>{awaiting}</strong> prescription(s) are waiting for verification before they can be dispensed. Click to review them.</Alert>
        </button>
      )}

      <SearchBar value={search} onChange={setSearch} placeholder="Search by patient, MRN, Rx or dispense number..." />
      <Chips
        value={tab}
        onChange={setTab}
        options={[
          { id: "ready", label: "Ready to dispense", count: ready.length },
          { id: "verify", label: "Needs verification", count: pendingRx.length },
          { id: "history", label: "History & refills", count: history.length },
        ]}
      />

      {tab === "verify" ? (
        pendingRx.length === 0 ? (
          <EmptyBox icon={BadgeCheck} title="Nothing is waiting for verification." hint="New prescriptions from consultations and the pharmacy show up here." />
        ) : (
          <div className="grid gap-4">
            {pendingRx.map((r) => (
              <div key={r._id} className="rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ backgroundColor: ui.card, borderColor: ui.border }}>
                <div className="flex items-start gap-3 min-w-0">
                  <PatientAvatar p={r.patient} />
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold">{patientName(r.patient)}</p>
                    <p className="text-[11px] opacity-50 font-mono">{r.rxNumber}</p>
                    <p className="text-xs opacity-70 truncate">{r.items.map((i) => `${i.name}${i.drug ? "" : " (not linked)"}`).join(", ")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.priority !== "routine" && <Pill status={r.priority} />}
                  <GhostButton href={`/dashboard/pharmacy/prescriptions/${r._id}`}>Review</GhostButton>
                  <PrimaryButton icon={BadgeCheck} disabled={saving} onClick={() => quickVerify(r._id)}>Verify</PrimaryButton>
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === "ready" ? (
        ready.length === 0 ? (
          <EmptyBox icon={PackageCheck} title="No verified prescriptions waiting." hint="Verify prescriptions in the queue to see them here." />
        ) : (
          <div className="grid gap-4">
            {ready.map((r) => (
              <div key={r._id} className="rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ backgroundColor: ui.card, borderColor: ui.border }}>
                <div className="flex items-start gap-3 min-w-0">
                  <PatientAvatar p={r.patient} />
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      {patientName(r.patient)}
                      {((r.patient as any)?.allergies?.length ?? 0) > 0 && <AlertTriangle size={13} className="text-amber-500" />}
                    </p>
                    <p className="text-[11px] opacity-50 font-mono">{r.rxNumber}</p>
                    <p className="text-xs opacity-70 truncate">{r.items.map((i) => `${i.name} (${i.quantityDispensed}/${i.quantityPrescribed})`).join(", ")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Pill status={r.status} />
                  {r.priority !== "routine" && <Pill status={r.priority} />}
                  <PrimaryButton href={`/dashboard/pharmacy/dispense/${r._id}`} icon={PackageCheck}>Dispense</PrimaryButton>
                </div>
              </div>
            ))}
          </div>
        )
      ) : history.length === 0 ? (
        <EmptyBox icon={PackageCheck} title="No dispensing history yet." />
      ) : (
        <TableCard minWidth={800}>
          <thead>
            <tr className="text-xs opacity-50 border-b" style={{ borderColor: ui.border }}>
              <Th>Patient</Th>
              <Th>Ref</Th>
              <Th className="hidden md:table-cell">Items</Th>
              <Th className="hidden sm:table-cell">When</Th>
              <Th>Total</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {history.map((d) => (
              <tr key={d._id} className="border-b last:border-0" style={{ borderColor: ui.border }}>
                <td className="px-3 py-3.5">
                  <div className="flex items-center gap-3">
                    <PatientAvatar p={d.patient} />
                    <p className="font-semibold text-xs">{patientName(d.patient)}</p>
                  </div>
                </td>
                <td className="px-3 py-3.5">
                  <span className="rounded-full px-2.5 py-1 font-mono text-[11px]" style={{ backgroundColor: ui.inner }}>{d.dispenseNumber}</span> <Pill status={d.type} />
                </td>
                <td className="px-3 py-3.5 text-xs opacity-70 hidden md:table-cell max-w-[240px] truncate">{d.items.map((i) => `${i.drugName} ×${i.quantity}`).join(", ")}</td>
                <td className="px-3 py-3.5 text-xs opacity-60 hidden sm:table-cell">{fmtDateTime(d.dispensedAt)}</td>
                <td className="px-3 py-3.5 text-xs font-semibold">{money(d.totalAmount)}</td>
                <td className="px-3 py-3.5 text-right">
                  {d.prescription && (
                    <GhostButton icon={RotateCcw} disabled={saving} onClick={() => runRefill(d)}>
                      Refill
                    </GhostButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}

      <Modal open={!!refill} onClose={() => setRefill(null)} title="Allergy warning" ui={ui}>
        {refill && (
          <div className="space-y-4">
            <Alert tone="danger">{refill.warning?.replace("Allergy warning – ", "").replace(/\. Provide an override reason to continue\.$/, "")}</Alert>
            <FormField label="Override reason *">
              <TextArea value={override} onChange={(e) => setOverride(e.target.value)} placeholder="Document why dispensing is clinically acceptable" />
            </FormField>
            <div className="flex justify-end gap-2">
              <GhostButton onClick={() => setRefill(null)}>Cancel</GhostButton>
              <PrimaryButton disabled={saving || override.trim().length < 3} onClick={() => runRefill(refill.d, override)}>Override & refill</PrimaryButton>
            </div>
          </div>
        )}
      </Modal>
    </PharmacyPage>
  );
}
