"use client";

import { useEffect, useState } from "react";
import { Banknote, CheckCircle2, CreditCard, RefreshCw, XCircle } from "lucide-react";
import {
  confirmCashPayment, payInvoiceCash, payInvoiceOnline, reconcileInvoice, rejectCashPayment,
  type BillingInvoice, type BillingPaymentEvent,
} from "@/api/slices";
import { useAccess } from "@/hooks/useAccess";
import { useBilling } from "@/hooks/useBilling";
import { ConfirmModal, Modal, type ConfirmState } from "@/components/ui/items";
import { parseMoney } from "@/lib/billing/helpers";
import {
  Alert, FormField, GhostButton, PaymentStatusPill, Pill, PrimaryButton, SectionCard, TextInput, fmtDateTime, useBillingUI,
} from "./BillingUI";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function PaymentPanel({
  invoice,
  payments,
  onChanged,
}: {
  invoice: BillingInvoice;
  /** current state of each payment attempt (latest ledger row per transaction) */
  payments: BillingPaymentEvent[];
  onChanged: () => void;
}) {
  const { facilityId, settings, act, money } = useBilling();
  const { can } = useAccess();
  const { ui } = useBillingUI();

  const canCollect = can("billing.collect");
  const cashAllowed = settings?.acceptCashPayments !== false; // default on, matching the server
  const payable = ["issued", "partially_paid"].includes(invoice.status) && invoice.balance > 0;

  const [method, setMethod] = useState<"cash" | "online">(cashAllowed ? "cash" : "online");
  useEffect(() => {
    // the tenant toggle can change while this page is open
    if (!cashAllowed && method === "cash") setMethod("online");
  }, [cashAllowed, method]);

  const [amount, setAmount] = useState(String(invoice.balance));
  useEffect(() => setAmount(String(invoice.balance)), [invoice.balance]);
  const [email, setEmail] = useState(invoice.patientSnapshot?.email ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [rejecting, setRejecting] = useState<BillingPaymentEvent | null>(null);
  const [reason, setReason] = useState("");

  const parsed = parseMoney(amount);
  const amountError = !parsed.ok ? parsed.error : parsed.value > invoice.balance ? `More than the balance (${money(invoice.balance, invoice.currency)})` : null;
  const emailError = method === "online" && !EMAIL_RE.test(email.trim()) ? "Paystack needs the payer's email address" : null;

  const pendingCash = payments.filter((p) => p.paymentMethod === "cash" && p.status === "pending");
  const pendingOnline = payments.filter((p) => p.paymentMethod === "online" && p.status === "pending");

  const submit = async () => {
    if (amountError || emailError || !parsed.ok) return;
    setBusy(true);
    try {
      if (method === "cash") {
        const r = await act(payInvoiceCash({ facilityId, invoiceId: invoice._id, amount: parsed.value, note: note.trim() || undefined }), "Cash recorded — confirm it once the money is in hand");
        if (r) {
          setNote("");
          onChanged();
        }
      } else {
        const r = await act<{ authorizationUrl: string; mode: string }>(payInvoiceOnline({ facilityId, invoiceId: invoice._id, amount: parsed.value, email: email.trim() }));
        if (r?.authorizationUrl) {
          // hand over to Paystack's hosted checkout; they redirect back to /dashboard/billing/payments/verify
          window.location.assign(r.authorizationUrl);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const askConfirm = (p: BillingPaymentEvent) =>
    setConfirm({
      title: "Confirm cash received",
      message: `Confirm that ${money(p.amount, p.currency)} in cash has been physically received for ${invoice.invoiceNumber}. This is recorded permanently and can't be undone.`,
      confirmLabel: "Yes, cash received",
      tone: "primary",
      onConfirm: async () => {
        setBusy(true);
        const ok = await act(confirmCashPayment({ facilityId, transactionId: p.transactionId }), "Payment confirmed");
        setBusy(false);
        setConfirm(null);
        if (ok) onChanged();
      },
    });

  const doReject = async () => {
    if (!rejecting || reason.trim().length < 3) return;
    setBusy(true);
    const ok = await act(rejectCashPayment({ facilityId, transactionId: rejecting.transactionId, reason: reason.trim() }), "Cash payment rejected");
    setBusy(false);
    if (ok) {
      setRejecting(null);
      setReason("");
      onChanged();
    }
  };

  const recheck = async () => {
    setBusy(true);
    const ok = await act(reconcileInvoice({ facilityId, invoiceId: invoice._id }), "Checked with Paystack");
    setBusy(false);
    if (ok) onChanged();
  };

  return (
    <>
      {/* payments waiting for someone to act */}
      {canCollect && pendingCash.length > 0 && (
        <SectionCard title="Cash waiting for confirmation" subtitle="Confirm only when the money is physically in your hand.">
          <div className="space-y-2">
            {pendingCash.map((p) => (
              <div key={p.transactionId} className="flex flex-wrap items-center gap-3 rounded-2xl p-3" style={{ backgroundColor: ui.inner }}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold tabular-nums">{money(p.amount, p.currency)}</p>
                  <p className="text-[11px] opacity-55">{p.reference} · recorded {fmtDateTime(p.createdAt)}</p>
                </div>
                <PrimaryButton icon={CheckCircle2} onClick={() => askConfirm(p)} disabled={busy || !cashAllowed}>Cash received</PrimaryButton>
                <GhostButton icon={XCircle} danger onClick={() => setRejecting(p)} disabled={busy}>Reject</GhostButton>
              </div>
            ))}
          </div>
          {!cashAllowed && <Alert tone="warning">Cash payments are switched off for this facility, so these can&apos;t be confirmed. Ask an administrator to turn cash back on, or reject them.</Alert>}
        </SectionCard>
      )}

      {canCollect && pendingOnline.length > 0 && (
        <SectionCard title="Online payment in progress" subtitle="The patient started a Paystack payment that hasn't been confirmed yet.">
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex-1 text-xs opacity-65">{pendingOnline.map((p) => `${money(p.amount, p.currency)} (${p.gatewayMode} mode)`).join(" · ")}</p>
            <GhostButton icon={RefreshCw} onClick={recheck} disabled={busy}>Check with Paystack</GhostButton>
          </div>
        </SectionCard>
      )}

      {/* take a payment */}
      {canCollect && payable && (
        <SectionCard title="Take payment" subtitle={`Balance due: ${money(invoice.balance, invoice.currency)}`}>
          <div className="flex gap-2">
            {(["cash", "online"] as const).map((m) => {
              const disabled = m === "cash" && !cashAllowed;
              const on = method === m;
              const Icon = m === "cash" ? Banknote : CreditCard;
              return (
                <button
                  key={m}
                  type="button"
                  disabled={disabled}
                  onClick={() => setMethod(m)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-semibold transition disabled:opacity-40"
                  style={{ backgroundColor: on ? "var(--brand-primary, #29AB29)" : ui.inner, color: on ? "#fff" : ui.text }}
                >
                  <Icon size={15} /> {m === "cash" ? "Cash" : "Card / transfer (Paystack)"}
                </button>
              );
            })}
          </div>
          {!cashAllowed && <p className="text-[11px] opacity-55">This facility accepts online payments only. Cash is switched off in Billing settings.</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Amount" hint={amountError ?? "Pay the full balance, or part of it."}>
              <TextInput value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" aria-invalid={!!amountError} />
            </FormField>
            {method === "online" ? (
              <FormField label="Payer's email *" hint={emailError ?? "Paystack sends the receipt here."}>
                <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="patient@example.com" />
              </FormField>
            ) : (
              <FormField label="Note (optional)">
                <TextInput value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="e.g. paid by relative" />
              </FormField>
            )}
          </div>

          {method === "cash" && <Alert tone="info">Step 1 of 2: this records the cash as <b>pending</b>. You&apos;ll confirm it once the money is in hand.</Alert>}
          <div className="flex justify-end">
            <PrimaryButton onClick={submit} disabled={busy || !!amountError || !!emailError} icon={method === "cash" ? Banknote : CreditCard}>
              {busy ? "Working…" : method === "cash" ? "Record cash payment" : "Continue to Paystack"}
            </PrimaryButton>
          </div>
        </SectionCard>
      )}

      {!canCollect && payable && <Alert tone="info">You can view this invoice but you don&apos;t have permission to take payments.</Alert>}

      {/* history */}
      {payments.length > 0 && (
        <SectionCard title="Payment history" subtitle="Every attempt is kept permanently and can't be edited.">
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.transactionId} className="flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-xs" style={{ backgroundColor: ui.inner }}>
                <span className="w-24 font-semibold tabular-nums">{money(p.amount, p.currency)}</span>
                <Pill label={p.paymentMethod} color={p.paymentMethod === "cash" ? "#0d9488" : "#7c3aed"} />
                {p.paymentMethod === "online" && p.gatewayMode && <Pill label={p.gatewayMode} color={p.gatewayMode === "live" ? "#16a34a" : "#2563eb"} />}
                <PaymentStatusPill status={p.status} />
                <span className="min-w-0 flex-1 truncate font-mono opacity-55">{p.reference}</span>
                <span className="opacity-55">{fmtDateTime(p.createdAt)}</span>
                {p.failureReason && <span className="basis-full text-[11px] text-red-500">Reason: {p.failureReason.replace(/_/g, " ")}</span>}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <ConfirmModal state={confirm} busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => confirm?.onConfirm()} ui={ui} />

      <Modal open={!!rejecting} title="Reject cash payment" onClose={() => !busy && setRejecting(null)} ui={ui} maxWidth="max-w-sm" z={60}>
        <div className="space-y-4">
          <p className="text-sm opacity-75">Use this if the cash was never handed over. The reason is kept in the permanent record.</p>
          <FormField label="Reason *" hint={reason.trim().length < 3 ? "At least 3 characters" : undefined}>
            <TextInput value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} autoFocus />
          </FormField>
          <div className="flex justify-end gap-2">
            <GhostButton onClick={() => setRejecting(null)} disabled={busy}>Cancel</GhostButton>
            <PrimaryButton onClick={doReject} disabled={busy || reason.trim().length < 3}>Reject payment</PrimaryButton>
          </div>
        </div>
      </Modal>
    </>
  );
}
