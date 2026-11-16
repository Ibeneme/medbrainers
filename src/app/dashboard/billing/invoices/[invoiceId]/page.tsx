"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Ban, Pencil, Receipt, Send } from "lucide-react";
import { DEPARTMENT_LABELS, clearActiveInvoice, fetchInvoice, issueInvoice, voidInvoice } from "@/api/slices";
import { useAccess } from "@/hooks/useAccess";
import { useBilling } from "@/hooks/useBilling";
import { Modal } from "@/components/ui/items";
import PaymentPanel from "@/components/dashboard/billing/PaymentPanel";
import {
  Alert, BillingPage, EmptyBox, FormField, GhostButton, InvoiceStatusPill, Pill, PrimaryButton, Row, SectionCard, TableCard, TextInput, Th,
  fmtDateTime, useBillingUI,
} from "@/components/dashboard/billing/BillingUI";

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = String(params?.invoiceId ?? "");
  const { facilityId, billing, dispatch, act, money } = useBilling();
  const { can } = useAccess();
  const { ui, border } = useBillingUI();
  const { activeInvoice, detailLoading, saving, error } = billing;

  const [voiding, setVoiding] = useState(false);
  const [reason, setReason] = useState("");

  const load = useCallback(() => {
    if (facilityId && invoiceId) dispatch(fetchInvoice({ facilityId, invoiceId }));
  }, [dispatch, facilityId, invoiceId]);

  useEffect(() => {
    dispatch(clearActiveInvoice()); // never flash the previous invoice
    load();
    return () => {
      dispatch(clearActiveInvoice());
    };
  }, [dispatch, load]);

  const inv = activeInvoice && activeInvoice.invoice._id === invoiceId ? activeInvoice.invoice : null;
  const payments = activeInvoice?.payments ?? [];

  const back = <GhostButton icon={ArrowLeft} href="/dashboard/billing/invoices">All invoices</GhostButton>;

  if (!inv) {
    return (
      <BillingPage title="Invoice" icon={Receipt} loading={detailLoading} loadingText="Loading invoice..." actions={back}>
        {!detailLoading && <EmptyBox icon={Receipt} title="Invoice not found" hint={error ?? "It may belong to another facility or no longer exist."} />}
      </BillingPage>
    );
  }

  const hasMoneyActivity = inv.amountPaid > 0 || payments.some((p) => p.status === "pending");
  const canVoid = can("billing.void") && inv.status !== "void" && inv.status !== "paid" && !hasMoneyActivity;
  const canWrite = can("billing.write");
  const cur = inv.currency;

  const issue = async () => {
    const ok = await act(issueInvoice({ facilityId, invoiceId: inv._id }), "Invoice issued");
    if (ok) load();
  };
  const doVoid = async () => {
    if (reason.trim().length < 3) return;
    const ok = await act(voidInvoice({ facilityId, invoiceId: inv._id, reason: reason.trim() }), "Invoice voided");
    if (ok) {
      setVoiding(false);
      setReason("");
      load();
    }
  };

  return (
    <BillingPage
      title={inv.invoiceNumber ?? "Draft cart"}
      icon={Receipt}
      description={inv.patientSnapshot ? `${inv.patientSnapshot.name}${inv.patientSnapshot.mrn ? ` · ${inv.patientSnapshot.mrn}` : ""}` : "Walk-in sale"}
      loading={detailLoading && !inv}
      onRefresh={load}
      actions={
        <>
          {back}
          {inv.status === "draft" && canWrite && (
            <>
              <GhostButton icon={Pencil} href={`/dashboard/billing/pos?draft=${inv._id}`}>Edit cart</GhostButton>
              <PrimaryButton icon={Send} onClick={issue} disabled={saving}>Issue invoice</PrimaryButton>
            </>
          )}
          {canVoid && <GhostButton icon={Ban} danger onClick={() => setVoiding(true)}>Void</GhostButton>}
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <InvoiceStatusPill status={inv.status} />
        {inv.issuedAt && <span className="text-xs opacity-55">Issued {fmtDateTime(inv.issuedAt)}</span>}
        {inv.paidAt && <span className="text-xs opacity-55">· Paid {fmtDateTime(inv.paidAt)}</span>}
      </div>

      {inv.status === "draft" && <Alert tone="info">This is a saved cart, not yet an invoice. Issue it to lock the bill and take payment — prices are re-checked against the catalog when you do.</Alert>}
      {inv.status === "void" && <Alert tone="danger"><b>Voided</b> {fmtDateTime(inv.voidedAt)} — {inv.voidReason}</Alert>}
      {inv.overpaid && <Alert tone="warning">More money was collected than this invoice&apos;s total. The extra needs to be refunded manually — refunds aren&apos;t handled in this system yet.</Alert>}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <SectionCard title="Items">
            <TableCard minWidth={560}>
              <thead>
                <tr>
                  <Th>Item</Th>
                  <Th className="text-right">Price</Th>
                  <Th className="text-right">Qty</Th>
                  <Th className="text-right">Discount</Th>
                  <Th className="text-right">Amount</Th>
                </tr>
              </thead>
              <tbody>
                {inv.lines.map((l, i) => (
                  <tr key={`${l.itemId}-${i}`} className="border-t" style={{ borderColor: border }}>
                    <td className="px-3 py-3">
                      <p className="font-medium">{l.name}</p>
                      <p className="text-[11px] opacity-50"><span className="font-mono">{l.itemId}</span> · {DEPARTMENT_LABELS[l.department] ?? l.department}</p>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{money(l.unitPrice, cur)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{l.quantity}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{l.discount > 0 ? `− ${money(l.discount, cur)}` : "—"}</td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">{money(l.net, cur)}</td>
                  </tr>
                ))}
              </tbody>
            </TableCard>
          </SectionCard>

          <PaymentPanel invoice={inv} payments={payments} onChanged={load} />
        </div>

        <div className="space-y-5">
          <SectionCard title="Summary">
            <div className="space-y-2.5">
              <Row label="Subtotal" value={money(inv.subtotal, cur)} />
              {inv.appliedDiscounts.map((d, i) => (
                <Row
                  key={i}
                  muted
                  label={<span className="inline-flex flex-wrap items-center gap-1.5">{d.name}{d.code && <Pill label={d.code} color="#7c3aed" />}{d.kind === "manual" && <Pill label="manual" color="#d97706" />}</span>}
                  value={`− ${money(d.amount, cur)}`}
                />
              ))}
              <div className="my-2 border-t" style={{ borderColor: border }} />
              <Row strong label="Total" value={money(inv.total, cur)} />
              <Row label="Paid" value={money(inv.amountPaid, cur)} />
              {inv.status !== "draft" && inv.status !== "void" && <Row strong label="Balance due" value={money(inv.balance, cur)} />}
            </div>
            {inv.appliedDiscounts.some((d) => d.kind === "manual" && d.reason) && (
              <p className="rounded-xl p-3 text-[11px] opacity-70" style={{ backgroundColor: ui.inner }}>
                Manual discount reason: {inv.appliedDiscounts.find((d) => d.kind === "manual")?.reason}
              </p>
            )}
          </SectionCard>

          <SectionCard title="Details">
            <dl className="space-y-2 text-xs">
              {inv.patientSnapshot?.phone && <div className="flex justify-between gap-3"><dt className="opacity-55">Phone</dt><dd>{inv.patientSnapshot.phone}</dd></div>}
              {inv.patientSnapshot?.email && <div className="flex justify-between gap-3"><dt className="opacity-55">Email</dt><dd className="truncate">{inv.patientSnapshot.email}</dd></div>}
              {inv.familySize && <div className="flex justify-between gap-3"><dt className="opacity-55">Family size</dt><dd>{inv.familySize}</dd></div>}
              {inv.couponCodes.length > 0 && <div className="flex justify-between gap-3"><dt className="opacity-55">Coupons</dt><dd>{inv.couponCodes.join(", ")}</dd></div>}
              <div className="flex justify-between gap-3"><dt className="opacity-55">Created</dt><dd>{fmtDateTime(inv.createdAt)}</dd></div>
              {inv.notes && <p className="rounded-xl p-3 opacity-80" style={{ backgroundColor: ui.inner }}>{inv.notes}</p>}
            </dl>
          </SectionCard>
        </div>
      </div>

      <Modal open={voiding} title="Void this invoice?" onClose={() => !saving && setVoiding(false)} ui={ui} maxWidth="max-w-sm" z={60}>
        <div className="space-y-4">
          <Alert tone="warning">Voiding cancels the bill. It can&apos;t be undone, and an invoice that has any payment can&apos;t be voided.</Alert>
          <FormField label="Reason *" hint={reason.trim().length < 3 ? "At least 3 characters" : undefined}>
            <TextInput value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} autoFocus />
          </FormField>
          <div className="flex justify-end gap-2">
            <GhostButton onClick={() => setVoiding(false)} disabled={saving}>Cancel</GhostButton>
            <PrimaryButton onClick={doVoid} disabled={saving || reason.trim().length < 3}>Void invoice</PrimaryButton>
          </div>
        </div>
      </Modal>
    </BillingPage>
  );
}
