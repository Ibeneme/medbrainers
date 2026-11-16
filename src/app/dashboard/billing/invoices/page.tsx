"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Receipt } from "lucide-react";
import { fetchInvoices, type BillingInvoiceStatus } from "@/api/slices";
import { useBilling } from "@/hooks/useBilling";
import {
  BillingPage, Chips, EmptyBox, FormField, InvoiceStatusPill, Pager, PrimaryButton, SearchBar, TableCard, TextInput, Th,
  dayEndIso, dayStartIso, fmtDate, useBillingUI,
} from "@/components/dashboard/billing/BillingUI";

type StatusFilter = "all" | BillingInvoiceStatus;
const STATUS_OPTIONS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "draft", label: "Drafts" },
  { id: "issued", label: "Unpaid" },
  { id: "partially_paid", label: "Part-paid" },
  { id: "paid", label: "Paid" },
  { id: "void", label: "Void" },
];

export default function InvoicesPage() {
  const router = useRouter();
  const { facilityId, billing, dispatch, money } = useBilling();
  const { border } = useBillingUI();
  const { invoices, listLoading } = billing;

  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const rangeBad = !!from && !!to && to < from;
  const load = useCallback(() => {
    if (!facilityId || rangeBad) return;
    dispatch(
      fetchInvoices({
        facilityId,
        page,
        limit: 25,
        status: status === "all" ? undefined : status,
        search: debounced || undefined,
        from: from ? dayStartIso(from) : undefined,
        to: to ? dayEndIso(to) : undefined,
      }),
    );
  }, [dispatch, facilityId, page, status, debounced, from, to, rangeBad]);
  useEffect(load, [load]);

  const open = (id: string) => router.push(`/dashboard/billing/invoices/${id}`);

  return (
    <BillingPage
      title="Invoices"
      icon={Receipt}
      description="Every bill raised in this facility"
      loading={listLoading && invoices.items.length === 0}
      loadingText="Loading invoices..."
      onRefresh={load}
      actions={<PrimaryButton icon={Plus} href="/dashboard/billing/pos">New sale</PrimaryButton>}
    >
      <SearchBar value={search} onChange={setSearch} placeholder="Search by invoice number, e.g. INV-000123" />
      <Chips
        label="Status"
        value={status}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
        options={STATUS_OPTIONS}
      />
      <div className="grid max-w-md gap-3 sm:grid-cols-2">
        <FormField label="From" hint={rangeBad ? "Must be before 'to'" : undefined}>
          <TextInput type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        </FormField>
        <FormField label="To">
          <TextInput type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
        </FormField>
      </div>

      {invoices.items.length === 0 && !listLoading ? (
        <EmptyBox icon={Receipt} title="No invoices found" hint="Try a different filter, or start a new sale." action={<PrimaryButton icon={Plus} href="/dashboard/billing/pos">New sale</PrimaryButton>} />
      ) : (
        <>
          <TableCard minWidth={820}>
            <thead>
              <tr>
                <Th>Invoice</Th>
                <Th>Patient</Th>
                <Th>Date</Th>
                <Th className="text-right">Total</Th>
                <Th className="text-right">Paid</Th>
                <Th className="text-right">Balance</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {invoices.items.map((inv) => (
                <tr
                  key={inv._id}
                  tabIndex={0}
                  role="link"
                  onClick={() => open(inv._id)}
                  onKeyDown={(e) => e.key === "Enter" && open(inv._id)}
                  className="cursor-pointer border-t transition hover:bg-black/[0.03]"
                  style={{ borderColor: border }}
                >
                  <td className="px-3 py-3 font-mono text-xs font-semibold">{inv.invoiceNumber ?? <span className="opacity-50">Draft</span>}</td>
                  <td className="px-3 py-3">
                    {inv.patientSnapshot?.name ?? <span className="opacity-45">Walk-in</span>}
                    {inv.patientSnapshot?.mrn && <p className="text-[11px] opacity-50">{inv.patientSnapshot.mrn}</p>}
                  </td>
                  <td className="px-3 py-3 text-xs opacity-70">{fmtDate(inv.issuedAt ?? inv.createdAt)}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{money(inv.total, inv.currency)}</td>
                  <td className="px-3 py-3 text-right tabular-nums opacity-70">{money(inv.amountPaid, inv.currency)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{inv.status === "void" || inv.status === "draft" ? "—" : money(inv.balance, inv.currency)}</td>
                  <td className="px-3 py-3"><InvoiceStatusPill status={inv.status} /></td>
                </tr>
              ))}
            </tbody>
          </TableCard>
          <Pager page={invoices.page} limit={invoices.limit} total={invoices.total} onPage={setPage} />
        </>
      )}
    </BillingPage>
  );
}
