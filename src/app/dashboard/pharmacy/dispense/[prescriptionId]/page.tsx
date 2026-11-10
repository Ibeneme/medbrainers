"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, PackageCheck, ShieldAlert } from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import { clearActivePrescription, dispensePrescription, fetchDispensePreview } from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
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
  fmtDate,
  money,
  patientName,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

const TOPICS = ["Dosage & timing", "Side effects", "Storage", "Drug / food interactions", "Adherence", "Missed dose", "When to seek help"];

export default function DispenseFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(Array.isArray(params?.prescriptionId) ? params.prescriptionId[0] : params?.prescriptionId || "");
  const { dispatch, facilityId, pharmacy, act } = usePharmacy();
  const { ui } = usePharmacyUI();
  const { dispensePreview: preview, detailLoading, saving } = pharmacy;

  const [qty, setQty] = useState<Record<string, string>>({});
  const [override, setOverride] = useState("");
  const [witness, setWitness] = useState("");
  const [counselNow, setCounselNow] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!facilityId || !id) return;
    dispatch(fetchDispensePreview({ facilityId, id }));
    return () => {
      dispatch(clearActivePrescription());
    };
  }, [dispatch, facilityId, id]);

  // default quantity: everything still owed that is in stock
  useEffect(() => {
    if (!preview) return;
    const q: Record<string, string> = {};
    preview.lines.forEach((l) => {
      const max = Math.min(l.remaining, l.drug?.sellable ?? 0);
      q[l.itemId] = String(l.drug && max > 0 ? max : 0);
    });
    setQty(q);
  }, [preview]);

  const chosen = useMemo(
    () => (preview?.lines || []).map((l) => ({ line: l, q: Math.max(0, Number(qty[l.itemId]) || 0) })).filter((x) => x.q > 0),
    [preview, qty],
  );
  const total = chosen.reduce((s, x) => s + x.q * (x.line.drug?.price ?? 0), 0);
  const warnings = chosen.flatMap((x) => x.line.allergyWarnings);
  const hasControlled = chosen.some((x) => x.line.drug?.isControlled);
  const rx = preview?.prescription;
  const p: any = rx?.patient;

  const invalid =
    chosen.length === 0 ||
    chosen.some((x) => x.q > x.line.remaining || x.q > (x.line.drug?.sellable ?? 0)) ||
    (warnings.length > 0 && override.trim().length < 3) ||
    (hasControlled && witness.trim().length < 2);

  const submit = async () => {
    const res = await act(
      dispensePrescription({
        facilityId,
        id,
        payload: {
          items: chosen.map((x) => ({ itemId: x.line.itemId, quantity: x.q })),
          allergyOverrideReason: warnings.length ? override : undefined,
          witness: hasControlled ? witness : undefined,
          counselling: counselNow ? { topics, notes: notes || undefined } : undefined,
        },
      }),
    );
    if (res) router.push("/dashboard/pharmacy/dispense");
  };

  return (
    <PharmacyPage
      routes={[{ label: "Pharmacy", href: "/dashboard/pharmacy" }, { label: "Dispensing & Refills", href: "/dashboard/pharmacy/dispense" }, { label: rx?.rxNumber || "Dispense" }]}
      title={rx ? `Dispense ${rx.rxNumber}` : "Dispense"}
      description="Stock is taken from the batch expiring first. Expired and quarantined batches are skipped automatically."
      icon={PackageCheck}
      loading={detailLoading && !preview}
    >
      {preview && rx && (
        <>
          <div className="rounded-[24px] p-4 border flex items-center justify-between gap-3" style={{ backgroundColor: ui.card, borderColor: ui.border }}>
            <div className="flex items-center gap-3">
              <PatientAvatar p={p} />
              <div>
                <p className="font-semibold text-sm">{patientName(p)}</p>
                <p className="text-[11px] opacity-50">MRN: {p?.mrn || "—"}</p>
              </div>
            </div>
            <Pill status={rx.status} />
          </div>

          {(p?.allergies?.length ?? 0) > 0 && (
            <Alert tone="warning">
              <span className="inline-flex items-center gap-1.5 font-semibold"><AlertTriangle size={13} /> Allergies on file:</span>{" "}
              {p.allergies.map((a: any) => a.substance).join(", ")}
            </Alert>
          )}

          <SectionCard title="Items to dispense">
            <div className="space-y-3">
              {preview.lines.map((l) => {
                const done = l.remaining === 0;
                const noStock = !!l.drug && l.drug.sellable <= 0;
                const disabled = done || !l.drug || noStock || l.status === "cancelled";
                const q = Number(qty[l.itemId]) || 0;
                return (
                  <div key={l.itemId} className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: ui.inner, opacity: disabled ? 0.65 : 1 }}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold flex items-center gap-2">
                          {l.name}
                          {l.drug?.isControlled && <ShieldAlert size={13} className="text-rose-500" />}
                        </p>
                        <p className="text-xs opacity-60">{[l.dosage, l.frequency, l.duration].filter(Boolean).join(" · ")}</p>
                        {l.instructions && <p className="text-[11px] opacity-50">{l.instructions}</p>}
                      </div>
                      <Pill status={l.status} />
                    </div>

                    {!l.drug && (
                      <Alert tone="danger">
                        Not linked to a catalog drug yet. <a className="underline font-semibold" href={`/dashboard/pharmacy/prescriptions/${id}`}>Open the prescription and link it</a>, then come back.
                      </Alert>
                    )}
                    {noStock && <Alert tone="danger">Out of stock — nothing sellable on the shelf.</Alert>}
                    {l.allergyWarnings.map((w) => (
                      <Alert key={w} tone="danger">{w}</Alert>
                    ))}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end text-xs">
                      <div>
                        <span className="opacity-50 block text-[10px] font-bold uppercase">Prescribed</span>
                        {l.quantityDispensed}/{l.quantityPrescribed} done · <strong>{l.remaining}</strong> left
                      </div>
                      <div>
                        <span className="opacity-50 block text-[10px] font-bold uppercase">In stock</span>
                        {l.drug ? `${l.drug.sellable} ${l.drug.unit}` : "—"}
                        {l.drug?.nearestExpiry && <span className="block opacity-50">next exp {fmtDate(l.drug.nearestExpiry)}</span>}
                      </div>
                      <FormField label="Dispense qty">
                        <TextInput
                          type="number"
                          min={0}
                          max={Math.min(l.remaining, l.drug?.sellable ?? 0)}
                          disabled={disabled}
                          value={qty[l.itemId] ?? "0"}
                          onChange={(e) => setQty((x) => ({ ...x, [l.itemId]: e.target.value }))}
                          style={{ backgroundColor: ui.card }}
                        />
                      </FormField>
                      <div className="text-right">
                        <span className="opacity-50 block text-[10px] font-bold uppercase">Line total</span>
                        <span className="text-sm font-bold">{money(q * (l.drug?.price ?? 0))}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center pt-3 border-t text-sm" style={{ borderColor: ui.border }}>
              <span className="opacity-60">Total payable</span>
              <span className="text-lg font-bold">{money(total)}</span>
            </div>
          </SectionCard>

          {warnings.length > 0 && (
            <SectionCard title="Allergy override" subtitle="A documented reason is required to dispense despite the warning above.">
              <FormField label="Override reason *">
                <TextArea value={override} onChange={(e) => setOverride(e.target.value)} placeholder="e.g. Prescriber confirmed; patient has tolerated this before" />
              </FormField>
            </SectionCard>
          )}

          {hasControlled && (
            <SectionCard title="Controlled substance" subtitle="This dispense will be entered in the controlled-substances register.">
              <FormField label="Witness (name) *">
                <TextInput value={witness} onChange={(e) => setWitness(e.target.value)} placeholder="Second pharmacist / nurse" />
              </FormField>
            </SectionCard>
          )}

          <SectionCard
            title="Patient counselling"
            subtitle={preview.settings.requireCounselling ? "Counselling is required by pharmacy policy. You can also record it later." : "Optional — can also be recorded later."}
          >
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="checkbox" checked={counselNow} onChange={(e) => setCounselNow(e.target.checked)} style={{ accentColor: PRIMARY_COLOR }} />
              Counselling given at hand-over
            </label>
            {counselNow && (
              <>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((t) => {
                    const on = topics.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTopics((x) => (on ? x.filter((y) => y !== t) : [...x, t]))}
                        className="rounded-full px-3 py-1 text-[11px] font-medium border transition"
                        style={{ backgroundColor: on ? PRIMARY_COLOR : ui.inner, color: on ? "#fff" : ui.text, borderColor: on ? PRIMARY_COLOR : ui.border }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
                <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Counselling notes (optional)" />
              </>
            )}
          </SectionCard>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <GhostButton onClick={() => router.back()}>Cancel</GhostButton>
            <PrimaryButton icon={PackageCheck} onClick={submit} disabled={saving || invalid}>
              {saving ? "Dispensing..." : `Dispense ${chosen.length} item${chosen.length === 1 ? "" : "s"}`}
            </PrimaryButton>
          </div>
        </>
      )}
    </PharmacyPage>
  );
}
