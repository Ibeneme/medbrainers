"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, BadgeCheck, ClipboardList, PackageCheck, Save, Send, XCircle } from "lucide-react";
import {
  addPrescriptionNote,
  cancelPrescription,
  clearActivePrescription,
  fetchDrugs,
  fetchPrescriptionById,
  updatePrescriptionItem,
  verifyPrescription,
} from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import { CustomDropdown, Modal } from "@/components/ui/items";
import {
  Alert,
  FormField,
  GhostButton,
  PatientAvatar,
  PharmacyPage,
  Pill,
  PrimaryButton,
  SectionCard,
  TextArea,
  TextInput,
  fmtDateTime,
  money,
  patientName,
  personName,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

export default function PrescriptionDetailPage() {
  const params = useParams();
  const id = String(Array.isArray(params?.id) ? params.id[0] : params?.id || "");
  const { dispatch, facilityId, pharmacy, act } = usePharmacy();
  const { ui, isDark, colors, border } = usePharmacyUI();
  const router = useRouter();
  const { activePrescription: rx, drugs, detailLoading, saving } = pharmacy;

  const [edits, setEdits] = useState<Record<string, { drugId?: string; qty?: string; refills?: string }>>({});
  const [note, setNote] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");

  const load = () => {
    if (!facilityId || !id) return;
    dispatch(fetchPrescriptionById({ facilityId, id }));
    dispatch(fetchDrugs({ facilityId }));
  };
  useEffect(() => {
    load();
    return () => {
      dispatch(clearActivePrescription());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId, id]);

  const drugOptions = useMemo(
    () => [{ label: "Select catalog drug...", value: "" }, ...drugs.map((d) => ({ label: `${d.genericName} ${d.strength || ""} — ${d.code}`.replace(/\s+/g, " "), value: d._id }))],
    [drugs],
  );

  if (!rx || rx._id !== id) {
    return (
      <PharmacyPage
        routes={[{ label: "Pharmacy", href: "/dashboard/pharmacy" }, { label: "e-Prescriptions", href: "/dashboard/pharmacy/prescriptions" }, { label: "Prescription" }]}
        title="Prescription"
        icon={ClipboardList}
        loading={detailLoading}
      >
        {!detailLoading && <Alert tone="danger">Prescription not found.</Alert>}
      </PharmacyPage>
    );
  }

  const p: any = rx.patient;
  const editable = rx.status === "pending" || rx.status === "verified";
  const allLinked = rx.items.every((i) => i.drug);
  const canDispense = rx.status === "verified" || rx.status === "partially_dispensed";
  const allergies: any[] = p?.allergies || [];
  const drugId = (i: (typeof rx.items)[number]) => (typeof i.drug === "string" ? i.drug : i.drug?._id || "");

  const saveItem = async (itemId: string, current: (typeof rx.items)[number]) => {
    const e = edits[itemId];
    if (!e) return;
    const payload: any = {};
    if (e.drugId && e.drugId !== drugId(current)) payload.drugId = e.drugId;
    if (e.qty !== undefined && Number(e.qty) !== current.quantityPrescribed) payload.quantityPrescribed = Math.max(1, Number(e.qty) || 1);
    if (e.refills !== undefined && Number(e.refills) !== current.refillsAllowed) payload.refillsAllowed = Math.max(0, Number(e.refills) || 0);
    if (Object.keys(payload).length === 0) return;
    const res = await act(updatePrescriptionItem({ facilityId, id: rx._id, itemId, payload }));
    if (res) {
      dispatch(fetchPrescriptionById({ facilityId, id: rx._id }));
      setEdits((x) => {
        const n = { ...x };
        delete n[itemId];
        return n;
      });
    }
  };

  const doVerify = async (thenDispense = false) => {
    const res = await act(verifyPrescription({ facilityId, id: rx._id }));
    if (!res) {
      // the server could not auto-link every item: show the items so they can be linked by hand
      dispatch(fetchPrescriptionById({ facilityId, id: rx._id }));
      return;
    }
    if (thenDispense) router.push(`/dashboard/pharmacy/dispense/${rx._id}`);
    else dispatch(fetchPrescriptionById({ facilityId, id: rx._id }));
  };

  const doCancel = async () => {
    const res = await act(cancelPrescription({ facilityId, id: rx._id, reason }));
    if (res) {
      setCancelOpen(false);
      setReason("");
      dispatch(fetchPrescriptionById({ facilityId, id: rx._id }));
    }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    const res = await act(addPrescriptionNote({ facilityId, id: rx._id, text: note.trim() }));
    if (res) {
      setNote("");
      dispatch(fetchPrescriptionById({ facilityId, id: rx._id }));
    }
  };

  return (
    <PharmacyPage
      routes={[{ label: "Pharmacy", href: "/dashboard/pharmacy" }, { label: "e-Prescriptions", href: "/dashboard/pharmacy/prescriptions" }, { label: rx.rxNumber }]}
      title={`Prescription ${rx.rxNumber}`}
      description={`Written ${fmtDateTime(rx.prescribedAt)} by ${personName(rx.prescriber)}${rx.diagnosis ? ` · ${rx.diagnosis}` : ""}`}
      icon={ClipboardList}
      loading={detailLoading}
      onRefresh={load}
      actions={
        <>
          <Pill status={rx.status} />
          {rx.priority !== "routine" && <Pill status={rx.priority} />}
          {rx.status === "pending" && (
            <>
              <GhostButton icon={BadgeCheck} onClick={() => doVerify(false)} disabled={saving}>
                Verify
              </GhostButton>
              <PrimaryButton icon={PackageCheck} onClick={() => doVerify(true)} disabled={saving}>
                Verify & dispense
              </PrimaryButton>
            </>
          )}
          {canDispense && (
            <PrimaryButton icon={PackageCheck} href={`/dashboard/pharmacy/dispense/${rx._id}`}>
              Dispense
            </PrimaryButton>
          )}
          {(rx.status === "pending" || rx.status === "verified" || rx.status === "partially_dispensed") && (
            <GhostButton danger icon={XCircle} onClick={() => setCancelOpen(true)}>
              Cancel
            </GhostButton>
          )}
        </>
      }
    >
      <div className="rounded-[24px] p-4 border flex items-center gap-3" style={{ backgroundColor: ui.card, borderColor: ui.border }}>
        <PatientAvatar p={p} />
        <div>
          <p className="font-semibold text-sm">{patientName(p)}</p>
          <p className="text-[11px] opacity-50">
            MRN: {p?.mrn || "—"} {p?.gender ? `· ${p.gender}` : ""} {p?.phone ? `· ${p.phone}` : ""}
          </p>
        </div>
      </div>

      {allergies.length > 0 && (
        <Alert tone="warning">
          <span className="inline-flex items-center gap-1.5 font-semibold"><AlertTriangle size={13} /> Allergies on file:</span>{" "}
          {allergies.map((a) => `${a.substance}${a.severity ? ` (${a.severity})` : ""}${a.reaction ? ` – ${a.reaction}` : ""}`).join("; ")}
        </Alert>
      )}
      {rx.status === "pending" && !allLinked && <Alert tone="info">Some lines are not linked to a catalog drug yet. Verify will try to link them automatically; any it cannot match (or where the strength differs) must be linked by hand below so stock and allergy checks can run.</Alert>}

      <SectionCard title="Prescribed items">
        <div className="space-y-3">
          {rx.items.map((i) => {
            const e = edits[i._id] || {};
            const dirty = e.drugId !== undefined || e.qty !== undefined || e.refills !== undefined;
            const dName = typeof i.drug === "string" ? "" : i.drug ? `${i.drug.genericName} ${i.drug.strength || ""}` : "";
            return (
              <div key={i._id} className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: ui.inner }}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{i.name}</p>
                    <p className="text-xs opacity-60">
                      {[i.dosage, i.frequency, i.route, i.duration].filter(Boolean).join(" · ") || "No directions"}
                    </p>
                    {i.instructions && <p className="text-[11px] opacity-50 mt-0.5">{i.instructions}</p>}
                  </div>
                  <div className="text-right text-xs">
                    <Pill status={i.status} />
                    <p className="mt-1 opacity-60">
                      {i.quantityDispensed}/{i.quantityPrescribed} dispensed
                    </p>
                  </div>
                </div>

                {editable ? (
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_110px_110px_auto] gap-3 items-end">
                    <CustomDropdown
                      label={dName ? `Linked: ${dName.trim()}` : "Catalog drug *"}
                      value={e.drugId ?? drugId(i)}
                      options={drugOptions}
                      onChange={(v) => setEdits((x) => ({ ...x, [i._id]: { ...x[i._id], drugId: v } }))}
                      searchable
                      isDark={isDark}
                      colors={colors}
                      border={border}
                    />
                    <FormField label="Quantity">
                      <TextInput type="number" min={Math.max(1, i.quantityDispensed)} value={e.qty ?? String(i.quantityPrescribed)} onChange={(ev) => setEdits((x) => ({ ...x, [i._id]: { ...x[i._id], qty: ev.target.value } }))} style={{ backgroundColor: ui.card }} />
                    </FormField>
                    <FormField label="Refills">
                      <TextInput type="number" min={0} max={12} value={e.refills ?? String(i.refillsAllowed)} onChange={(ev) => setEdits((x) => ({ ...x, [i._id]: { ...x[i._id], refills: ev.target.value } }))} style={{ backgroundColor: ui.card }} />
                    </FormField>
                    <GhostButton icon={Save} disabled={!dirty || saving} onClick={() => saveItem(i._id, i)}>
                      Save
                    </GhostButton>
                  </div>
                ) : (
                  <p className="text-xs opacity-70">
                    {dName ? `Linked to ${dName.trim()}` : "Not linked"} · {i.refillsAllowed} refill(s) allowed
                    {typeof i.drug !== "string" && i.drug?.price != null ? ` · ${money(i.drug.price)} per ${i.drug.unit}` : ""}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      {rx.dispenses && rx.dispenses.length > 0 && (
        <SectionCard title="Dispensing history">
          <div className="space-y-2">
            {rx.dispenses.map((d) => (
              <div key={d._id} className="rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs" style={{ backgroundColor: ui.inner }}>
                <div>
                  <span className="font-mono font-semibold">{d.dispenseNumber}</span> <Pill status={d.type} />
                  <p className="opacity-60 mt-1">{d.items.map((x) => `${x.drugName} ×${x.quantity}`).join(", ")}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{money(d.totalAmount)}</p>
                  <p className="opacity-50">{fmtDateTime(d.dispensedAt)} · {personName(d.dispensedBy)}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Notes & audit trail">
        <div className="flex gap-2">
          <TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the pharmacy team..." onKeyDown={(e) => e.key === "Enter" && addNote()} />
          <PrimaryButton icon={Send} onClick={addNote} disabled={saving || !note.trim()}>Add</PrimaryButton>
        </div>
        {rx.notes && <p className="text-xs rounded-2xl p-3" style={{ backgroundColor: ui.inner }}>Prescriber note: {rx.notes}</p>}
        <div className="space-y-2">
          {[...(rx.notesList || [])].reverse().map((n, idx) => (
            <div key={n._id || idx} className="flex gap-3 text-xs">
              <span className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: n.isSystemAudit ? "#9ca3af" : "#3b82f6" }} />
              <div>
                <p className={n.isSystemAudit ? "opacity-60" : ""}>{n.text}</p>
                <p className="text-[10px] opacity-40">{personName(n.author)} · {fmtDateTime(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel prescription" ui={ui}>
        <div className="space-y-4">
          <p className="text-xs opacity-70">Items already dispensed stay on record. Remaining items will be cancelled.</p>
          <FormField label="Reason *">
            <TextArea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Prescriber changed the regimen" />
          </FormField>
          <div className="flex justify-end gap-2">
            <GhostButton onClick={() => setCancelOpen(false)}>Keep</GhostButton>
            <PrimaryButton onClick={doCancel} disabled={saving || reason.trim().length < 3}>Cancel prescription</PrimaryButton>
          </div>
        </div>
      </Modal>
    </PharmacyPage>
  );
}
