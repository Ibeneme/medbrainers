"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Minus, Plus, Receipt, Save, ShoppingCart, Tag, Trash2, Users, X } from "lucide-react";
import {
  clearQuote, createInvoice, fetchInvoice, issueInvoice, quoteCart, updateInvoiceDraft,
  type BillingInvoice, type CartInput, type ManualDiscountInput,
} from "@/api/slices";
import { useAccess } from "@/hooks/useAccess";
import { useBilling } from "@/hooks/useBilling";
import { addToCart, cartSignature, parseMoney, round2, type CartLineState } from "@/lib/billing/helpers";
import { DEPARTMENT_LABELS } from "@/api/slices";
import { ItemPicker, PatientPicker, loadPatientLite, type PatientLite } from "@/components/dashboard/billing/pickers";
import {
  Alert, BillingPage, EmptyBox, FormField, GhostButton, Pill, PrimaryButton, Row, SectionCard, SelectInput, TextArea, TextInput, useBillingUI,
} from "@/components/dashboard/billing/BillingUI";

function PosInner() {
  const router = useRouter();
  const params = useSearchParams();
  const draftId = params.get("draft") || "";
  const patientIdParam = params.get("patientId") || "";

  const { facilityId, billing, settings, act, dispatch, money } = useBilling();
  const { can } = useAccess();
  const { ui, border } = useBillingUI();
  const { quote, quoting, saving, error } = billing;

  const manualAllowed = can("billing.discount") && !!settings?.allowManualDiscount;
  const maxManual = settings?.maxManualDiscountPercent ?? 0;

  const [patient, setPatient] = useState<PatientLite | null>(null);
  const [lines, setLines] = useState<CartLineState[]>([]);
  const [coupons, setCoupons] = useState<string[]>([]);
  const [couponInput, setCouponInput] = useState("");
  const [family, setFamily] = useState("");
  const [manualOn, setManualOn] = useState(false);
  const [manualType, setManualType] = useState<"percentage" | "fixed">("percentage");
  const [manualValue, setManualValue] = useState("");
  const [manualReason, setManualReason] = useState("");
  const [notes, setNotes] = useState("");
  const [droppedManual, setDroppedManual] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(!!draftId);

  /* ---------- prefill: from a patient's page, or resume a saved draft ---------- */
  const prefilled = useRef(false);
  useEffect(() => {
    if (!facilityId || prefilled.current) return;
    prefilled.current = true;
    (async () => {
      if (draftId) {
        const detail = await act<{ invoice: BillingInvoice }>(fetchInvoice({ facilityId, invoiceId: draftId }));
        const inv = detail?.invoice;
        if (!inv) return setLoadingDraft(false);
        if (inv.status !== "draft") {
          router.replace(`/dashboard/billing/invoices/${inv._id}`); // issued invoices are locked — show, don't edit
          return;
        }
        setLines(inv.lines.map((l) => ({ itemId: l.itemId, name: l.name, department: l.department, unitPrice: l.unitPrice, quantity: l.quantity })));
        setCoupons(inv.couponCodes ?? []);
        setFamily(inv.familySize ? String(inv.familySize) : "");
        setNotes(inv.notes ?? "");
        if (inv.patientId && inv.patientSnapshot) setPatient({ _id: inv.patientId, ...inv.patientSnapshot });
        if (inv.manualDiscount) {
          setManualOn(true);
          setManualType(inv.manualDiscount.type);
          setManualValue(String(inv.manualDiscount.value));
          setManualReason(inv.manualDiscount.reason);
        }
        setLoadingDraft(false);
      } else if (patientIdParam) {
        const p = await loadPatientLite(facilityId, patientIdParam);
        if (p) setPatient(p);
      }
    })();
  }, [facilityId, draftId, patientIdParam, act, router]);

  /* a draft may carry a manual discount this person isn't allowed to keep editing */
  useEffect(() => {
    if (loadingDraft || !settings) return;
    if (manualOn && !manualAllowed) {
      setManualOn(false);
      setDroppedManual(true);
    }
  }, [loadingDraft, settings, manualOn, manualAllowed]);

  /* ---------- build the request ---------- */
  const familySize = family.trim() === "" ? undefined : Number(family);
  const familyOk = familySize === undefined || (Number.isInteger(familySize) && familySize >= 1 && familySize <= 100);
  const manualParsed = manualOn ? parseMoney(manualValue) : null;
  const manualReasonOk = manualReason.trim().length >= 3;
  const manualValid = !manualOn || (!!manualParsed?.ok && manualReasonOk && (manualType !== "percentage" || (manualParsed.ok && manualParsed.value <= 100)));
  const manual: ManualDiscountInput | undefined =
    manualOn && manualParsed?.ok && manualReasonOk ? { type: manualType, value: manualParsed.value, reason: manualReason.trim() } : undefined;

  const cart: CartInput = useMemo(
    () => ({
      lines: lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity })),
      ...(coupons.length ? { couponCodes: coupons } : {}),
      ...(familySize !== undefined && familyOk ? { familySize } : {}),
      ...(manual ? { manualDiscount: manual } : {}),
      ...(patient ? { patientId: patient._id } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lines, coupons, familySize, familyOk, manual?.type, manual?.value, manual?.reason, patient?._id, notes],
  );

  const sig = cartSignature({ lines: cart.lines, couponCodes: coupons, familySize: cart.familySize, manual: manual ?? null });
  const requestedSig = useRef("");
  const [requested, setRequested] = useState("");

  /* ---------- live pricing: the SERVER prices the cart (catalog prices + discount rules) ---------- */
  useEffect(() => {
    if (!facilityId) return;
    if (lines.length === 0) {
      dispatch(clearQuote());
      requestedSig.current = "";
      setRequested("");
      return;
    }
    if (!familyOk || !manualValid) return;
    const t = setTimeout(() => {
      requestedSig.current = sig;
      setRequested(sig);
      dispatch(quoteCart({ facilityId, cart }));
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId, sig, familyOk, manualValid]);

  const quoteCurrent = !!quote && !quoting && requested === sig;
  const lineQuote = (i: number) => (quoteCurrent ? quote!.lines[i] : undefined);
  const roughSubtotal = round2(lines.reduce((a, l) => a + l.unitPrice * l.quantity, 0));

  /* ---------- cart edits ---------- */
  const setQty = (itemId: string, q: number) =>
    setLines((ls) => ls.map((l) => (l.itemId === itemId ? { ...l, quantity: Math.max(1, Math.min(1000, Math.floor(q) || 1)) } : l)));
  const remove = (itemId: string) => setLines((ls) => ls.filter((l) => l.itemId !== itemId));
  const addCoupon = () => {
    const c = couponInput.trim().toUpperCase();
    if (!c) return;
    if (!/^[A-Z0-9_-]{3,40}$/.test(c)) return;
    if (!coupons.includes(c)) setCoupons([...coupons, c]);
    setCouponInput("");
  };

  /* ---------- save / issue ---------- */
  const canSubmit = lines.length > 0 && quoteCurrent && familyOk && manualValid && !saving;

  const persist = async (issue: boolean) => {
    if (!canSubmit) return;
    let inv: BillingInvoice | null;
    if (draftId) {
      // save the edits first, then (optionally) issue — the server re-prices from the catalog at issue time
      inv = await act<BillingInvoice>(updateInvoiceDraft({ facilityId, invoiceId: draftId, cart }), issue ? undefined : "Cart saved");
      if (inv && issue) inv = await act<BillingInvoice>(issueInvoice({ facilityId, invoiceId: draftId }), "Invoice issued");
    } else {
      inv = await act<BillingInvoice>(createInvoice({ facilityId, cart, issue }), issue ? "Invoice issued" : "Cart saved as a draft");
    }
    if (inv) router.push(`/dashboard/billing/invoices/${inv._id}`);
  };

  const clearAll = () => {
    setLines([]);
    setCoupons([]);
    setFamily("");
    setManualOn(false);
    setManualValue("");
    setManualReason("");
    setNotes("");
  };

  return (
    <BillingPage
      title={draftId ? "Edit saved cart" : "New sale"}
      icon={ShoppingCart}
      description="Pick services, drugs and tests — prices and discounts are worked out automatically"
      loading={loadingDraft}
      loadingText="Loading saved cart..."
      actions={lines.length > 0 ? <GhostButton icon={Trash2} danger onClick={clearAll}>Clear cart</GhostButton> : undefined}
    >
      <div className="grid gap-5 lg:grid-cols-5">
        {/* ───────── left: pick things ───────── */}
        <div className="space-y-5 lg:col-span-2">
          <SectionCard title="Patient" subtitle="Optional — link the bill to a patient record.">
            <PatientPicker value={patient} onChange={setPatient} />
            {patient?.familySize && !family && (
              <button
                type="button"
                onClick={() => setFamily(String(patient.familySize))}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold"
                style={{ backgroundColor: ui.inner }}
              >
                <Users size={12} /> Use family of {patient.familySize} for bundle discounts
              </button>
            )}
          </SectionCard>
          <SectionCard title="Add items" subtitle="Only priced, active items from your price catalog can be sold.">
            <ItemPicker onAdd={(it) => setLines((ls) => addToCart(ls, { itemId: it.itemId, name: it.name, department: it.department, unitPrice: it.unitPrice, unit: it.unit }))} />
          </SectionCard>
        </div>

        {/* ───────── right: the cart ───────── */}
        <div className="space-y-5 lg:col-span-3">
          <SectionCard title={`Cart${lines.length ? ` (${lines.length})` : ""}`}>
            {lines.length === 0 ? (
              <EmptyBox icon={ShoppingCart} title="The cart is empty" hint="Add items from the list to start a bill." />
            ) : (
              <div className="space-y-2">
                {lines.map((l, i) => {
                  const q = lineQuote(i);
                  return (
                    <div key={l.itemId} className="flex flex-wrap items-center gap-3 rounded-2xl p-3" style={{ backgroundColor: ui.inner }}>
                      <div className="min-w-0 flex-1 basis-40">
                        <p className="truncate text-sm font-medium">{l.name}</p>
                        <p className="text-[11px] opacity-55">
                          <span className="font-mono">{l.itemId}</span> · {DEPARTMENT_LABELS[l.department]} · {money(q?.unitPrice ?? l.unitPrice)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => setQty(l.itemId, l.quantity - 1)} disabled={l.quantity <= 1} className="flex h-8 w-8 items-center justify-center rounded-xl disabled:opacity-30" style={{ backgroundColor: ui.card }} aria-label="Less">
                          <Minus size={13} />
                        </button>
                        <input
                          value={l.quantity}
                          onChange={(e) => setQty(l.itemId, Number(e.target.value.replace(/\D/g, "")))}
                          inputMode="numeric"
                          aria-label={`Quantity of ${l.name}`}
                          className="h-8 w-12 rounded-xl text-center text-sm outline-none"
                          style={{ backgroundColor: ui.card, color: ui.text }}
                        />
                        <button type="button" onClick={() => setQty(l.itemId, l.quantity + 1)} className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: ui.card }} aria-label="More">
                          <Plus size={13} />
                        </button>
                      </div>
                      <div className="w-28 text-right text-sm tabular-nums">
                        {q && q.discount > 0 ? (
                          <>
                            <p className="text-[11px] line-through opacity-45">{money(q.gross)}</p>
                            <p className="font-semibold">{money(q.net)}</p>
                          </>
                        ) : (
                          <p className="font-semibold">{money(q?.gross ?? round2(l.unitPrice * l.quantity))}</p>
                        )}
                      </div>
                      <button type="button" onClick={() => remove(l.itemId)} className="rounded-lg p-1.5 text-red-500 opacity-70 hover:opacity-100" aria-label={`Remove ${l.name}`}>
                        <X size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {lines.length > 0 && (
            <>
              <SectionCard title="Discounts" subtitle="Rules apply automatically. Add a coupon code or set the family size if the patient qualifies.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Coupon code">
                    <div className="flex gap-2">
                      <TextInput value={couponInput} upper onChange={(e) => setCouponInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCoupon()} placeholder="e.g. WELCOME10" maxLength={40} />
                      <GhostButton icon={Tag} onClick={addCoupon}>Add</GhostButton>
                    </div>
                  </FormField>
                  <FormField label="Family size" hint={!familyOk ? "Enter a whole number from 1 to 100" : "For family bundle discounts."}>
                    <TextInput value={family} onChange={(e) => setFamily(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="—" />
                  </FormField>
                </div>
                {coupons.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {coupons.map((c) => {
                      const unused = quoteCurrent && quote!.unusedCodes.includes(c);
                      return (
                        <span key={c} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold" style={{ backgroundColor: unused ? "#d9770622" : "#7c3aed22", color: unused ? "#d97706" : "#7c3aed" }}>
                          {c}
                          {unused && <span className="font-normal">— not valid for this cart</span>}
                          <button type="button" onClick={() => setCoupons(coupons.filter((x) => x !== c))} aria-label={`Remove ${c}`}><X size={11} /></button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {droppedManual && <Alert tone="warning">This saved cart had a manual discount that you don&apos;t have permission to keep. Saving will remove it.</Alert>}
                {manualAllowed && (
                  <div className="space-y-3 rounded-2xl p-4" style={{ backgroundColor: ui.inner }}>
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
                      <input type="checkbox" checked={manualOn} onChange={(e) => setManualOn(e.target.checked)} /> Give a manual discount
                      <span className="font-normal opacity-50">(up to {maxManual}% — recorded in the audit log)</span>
                    </label>
                    {manualOn && (
                      <div className="grid gap-3 sm:grid-cols-3">
                        <FormField label="Type">
                          <SelectInput value={manualType} onChange={(v) => setManualType(v as "percentage" | "fixed")} options={[{ value: "percentage", label: "Percentage (%)" }, { value: "fixed", label: "Fixed amount" }]} />
                        </FormField>
                        <FormField label="Value" hint={manualParsed && !manualParsed.ok ? manualParsed.error : undefined}>
                          <TextInput value={manualValue} onChange={(e) => setManualValue(e.target.value)} inputMode="decimal" />
                        </FormField>
                        <FormField label="Reason *" hint={!manualReasonOk ? "At least 3 characters" : undefined}>
                          <TextInput value={manualReason} onChange={(e) => setManualReason(e.target.value)} maxLength={300} placeholder="e.g. Staff member" />
                        </FormField>
                      </div>
                    )}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Total">
                <div className="space-y-2.5">
                  <Row label="Subtotal" value={money(quoteCurrent ? quote!.subtotal : roughSubtotal)} />
                  {quoteCurrent && quote!.appliedDiscounts.map((d, i) => (
                    <Row
                      key={i}
                      muted
                      label={<span className="inline-flex items-center gap-2">{d.name}{d.code && <Pill label={d.code} color="#7c3aed" />}{d.kind === "manual" && <Pill label="manual" color="#d97706" />}</span>}
                      value={`− ${money(d.amount)}`}
                    />
                  ))}
                  <div className="my-2 border-t" style={{ borderColor: border }} />
                  <Row strong label="Total to pay" value={quoteCurrent ? money(quote!.total) : quoting ? "Calculating…" : "—"} />
                </div>
                {!quoteCurrent && !quoting && lines.length > 0 && !error && (familyOk && manualValid) && <p className="text-[11px] opacity-50">Working out the price…</p>}
                {error && !quoting && <Alert tone="danger">{error}</Alert>}
                {!manualValid && <Alert tone="warning">Complete the manual discount (value and a reason), or switch it off, to see the total.</Alert>}

                <FormField label="Note (optional)">
                  <TextArea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} placeholder="Anything the finance team should know" />
                </FormField>

                <div className="flex flex-wrap justify-end gap-2 pt-1">
                  <GhostButton icon={Save} onClick={() => persist(false)} disabled={!canSubmit}>Save as draft</GhostButton>
                  <PrimaryButton icon={Receipt} onClick={() => persist(true)} disabled={!canSubmit}>{saving ? "Working…" : "Issue invoice"}</PrimaryButton>
                </div>
                <p className="text-right text-[11px] opacity-50">Issuing locks the bill and lets you take payment. A draft can still be edited.</p>
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </BillingPage>
  );
}

export default function PosPage() {
  // useSearchParams needs a Suspense boundary in the App Router
  return (
    <Suspense fallback={null}>
      <PosInner />
    </Suspense>
  );
}
