"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck, Wallet } from "lucide-react";
import {
  clearTransaction, fetchPaymentLogs, fetchTransaction, type BillingPaymentEvent, type BillingPaymentMethod, type BillingPaymentStatus,
} from "@/api/slices";
import { useBilling } from "@/hooks/useBilling";
import { Modal } from "@/components/ui/items";
import {
  Alert, BillingPage, Chips, EmptyBox, FormField, GhostButton, Pager, PaymentStatusPill, Pill, TableCard, TextInput, Th, dayEndIso,
  dayStartIso, fmtDateTime, useBillingUI,
} from "@/components/dashboard/billing/BillingUI";

type S = "all" | BillingPaymentStatus;
type M = "all" | BillingPaymentMethod;

export default function PaymentLogPage() {
  const { facilityId, billing, dispatch, money } = useBilling();
  const { ui, border } = useBillingUI();
  const { payments, transaction, listLoading, detailLoading } = billing;

  const [status, setStatus] = useState<S>("all");
  const [method, setMethod] = useState<M>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [openTx, setOpenTx] = useState<string | null>(null);

  const rangeBad = !!from && !!to && to < from;
  const load = useCallback(() => {
    if (!facilityId || rangeBad) return;
    dispatch(
      fetchPaymentLogs({
        facilityId,
        page,
        limit: 25,
        status: status === "all" ? undefined : status,
        method: method === "all" ? undefined : method,
        from: from ? dayStartIso(from) : undefined,
        to: to ? dayEndIso(to) : undefined,
      }),
    );
  }, [dispatch, facilityId, page, status, method, from, to, rangeBad]);
  useEffect(load, [load]);

  const show = (p: BillingPaymentEvent) => {
    setOpenTx(p.transactionId);
    dispatch(fetchTransaction({ facilityId, transactionId: p.transactionId }));
  };
  const close = () => {
    setOpenTx(null);
    dispatch(clearTransaction());
  };

  const tx = transaction && transaction.transactionId === openTx ? transaction : null;

  return (
    <BillingPage
      title="Payment log"
      icon={Wallet}
      description="A permanent record of every payment attempt — read-only"
      loading={listLoading && payments.items.length === 0}
      loadingText="Loading payments..."
      onRefresh={load}
    >
      <Chips label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }}
        options={[{ id: "all", label: "All" }, { id: "success", label: "Successful" }, { id: "pending", label: "Pending" }, { id: "failed", label: "Failed" }]} />
      <Chips label="Method" value={method} onChange={(v) => { setMethod(v); setPage(1); }}
        options={[{ id: "all", label: "All" }, { id: "cash", label: "Cash" }, { id: "online", label: "Online" }]} />
      <div className="grid max-w-md gap-3 sm:grid-cols-2">
        <FormField label="From" hint={rangeBad ? "Must be before 'to'" : undefined}>
          <TextInput type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        </FormField>
        <FormField label="To">
          <TextInput type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
        </FormField>
      </div>

      {payments.items.length === 0 && !listLoading ? (
        <EmptyBox icon={Wallet} title="No payments found" hint="Payments appear here as soon as someone starts paying an invoice." />
      ) : (
        <>
          <TableCard minWidth={860}>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Invoice</Th>
                <Th>Method</Th>
                <Th className="text-right">Amount</Th>
                <Th>Status</Th>
                <Th>Reference</Th>
                <Th className="text-right">History</Th>
              </tr>
            </thead>
            <tbody>
              {payments.items.map((p) => (
                <tr key={p.transactionId} className="border-t" style={{ borderColor: border }}>
                  <td className="px-3 py-3 text-xs opacity-70">{fmtDateTime(p.createdAt)}</td>
                  <td className="px-3 py-3 font-mono text-xs">{p.invoiceNumber ?? "—"}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <Pill label={p.paymentMethod} color={p.paymentMethod === "cash" ? "#0d9488" : "#7c3aed"} />
                      {p.gatewayMode && <Pill label={p.gatewayMode} color={p.gatewayMode === "live" ? "#16a34a" : "#2563eb"} />}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{money(p.amount, p.currency)}</td>
                  <td className="px-3 py-3"><PaymentStatusPill status={p.status} /></td>
                  <td className="max-w-[180px] truncate px-3 py-3 font-mono text-[11px] opacity-60">{p.reference}</td>
                  <td className="px-3 py-3 text-right"><GhostButton onClick={() => show(p)}>View</GhostButton></td>
                </tr>
              ))}
            </tbody>
          </TableCard>
          <Pager page={payments.page} limit={payments.limit} total={payments.total} onPage={setPage} />
        </>
      )}

      <Modal open={!!openTx} title="Transaction history" onClose={close} ui={ui} maxWidth="max-w-2xl">
        {detailLoading && !tx && <p className="py-8 text-center text-sm opacity-55">Loading…</p>}
        {tx && (
          <div className="space-y-4">
            {tx.integrity.valid ? (
              <Alert tone="success"><ShieldCheck size={13} className="mr-1 inline" /> Record verified — {tx.integrity.events} event{tx.integrity.events === 1 ? "" : "s"}, chain intact, nothing has been altered.</Alert>
            ) : (
              <Alert tone="danger"><ShieldAlert size={13} className="mr-1 inline" /> <b>Integrity check failed</b> at event {tx.integrity.brokenAtSequence}. This record may have been tampered with — escalate to your administrator and keep the evidence.</Alert>
            )}
            <ol className="space-y-2">
              {tx.events.map((e) => (
                <li key={e._id} className="rounded-2xl p-4 text-xs" style={{ backgroundColor: ui.inner }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">#{e.sequence}</span>
                    <PaymentStatusPill status={e.status} />
                    <span className="font-semibold tabular-nums">{money(e.amount, e.currency)}</span>
                    <span className="ml-auto opacity-55">{fmtDateTime(e.createdAt)}</span>
                  </div>
                  <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
                    <div><dt className="inline opacity-55">Reference: </dt><dd className="inline font-mono">{e.reference}</dd></div>
                    <div><dt className="inline opacity-55">Recorded by: </dt><dd className="inline">{e.source}</dd></div>
                    {e.failureReason && <div className="sm:col-span-2 text-red-500">Reason: {e.failureReason.replace(/_/g, " ")}</div>}
                    {e.metadata && Object.keys(e.metadata).length > 0 && (
                      <div className="sm:col-span-2 break-words opacity-70">
                        {Object.entries(e.metadata).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}
                      </div>
                    )}
                    <div className="sm:col-span-2 truncate font-mono text-[10px] opacity-40">hash {e.hash}</div>
                  </dl>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Modal>
    </BillingPage>
  );
}
