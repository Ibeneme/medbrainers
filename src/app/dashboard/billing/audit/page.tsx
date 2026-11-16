"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, ScrollText } from "lucide-react";
import { fetchBillingAuditLogs } from "@/api/slices";
import { useBilling } from "@/hooks/useBilling";
import { useStaffNames } from "@/hooks/useStaffNames";
import { ACTION_FILTERS, humanizeAction } from "@/lib/billing/helpers";
import {
  BillingPage, Chips, EmptyBox, FormField, Pager, Pill, SelectInput, TableCard, TextInput, Th, dayEndIso, dayStartIso, fmtDateTime, useBillingUI,
} from "@/components/dashboard/billing/BillingUI";

const ENTITY_OPTIONS = [
  { id: "all", label: "Everything" },
  { id: "BillingItem", label: "Prices" },
  { id: "DiscountRule", label: "Discounts" },
  { id: "Invoice", label: "Invoices" },
  { id: "Company", label: "Settings" },
  { id: "TenantGatewayConfig", label: "Paystack" },
] as const;

const pretty = (v: unknown) => {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
};

export default function AuditPage() {
  const { facilityId, billing, dispatch } = useBilling();
  const staffName = useStaffNames();
  const { ui, border } = useBillingUI();
  const { auditLogs, listLoading } = billing;

  const [entity, setEntity] = useState<string>("all");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);

  const rangeBad = !!from && !!to && to < from;
  const load = useCallback(() => {
    if (!facilityId || rangeBad) return;
    dispatch(
      fetchBillingAuditLogs({
        facilityId,
        page,
        limit: 25,
        entityType: entity === "all" ? undefined : entity,
        action: action || undefined,
        from: from ? dayStartIso(from) : undefined,
        to: to ? dayEndIso(to) : undefined,
      }),
    );
  }, [dispatch, facilityId, page, entity, action, from, to, rangeBad]);
  useEffect(load, [load]);

  return (
    <BillingPage
      title="Audit log"
      icon={ScrollText}
      description="Who changed prices, discounts, settings and payment keys — and when"
      loading={listLoading && auditLogs.items.length === 0}
      loadingText="Loading audit log..."
      onRefresh={load}
    >
      <Chips label="Area" value={entity} onChange={(v) => { setEntity(v); setPage(1); }} options={ENTITY_OPTIONS.map((o) => ({ id: o.id as string, label: o.label }))} />
      <div className="grid gap-3 sm:grid-cols-3">
        <FormField label="Action">
          <SelectInput value={action} onChange={(v) => { setAction(v); setPage(1); }} options={[{ value: "", label: "Any action" }, ...ACTION_FILTERS]} />
        </FormField>
        <FormField label="From" hint={rangeBad ? "Must be before 'to'" : undefined}><TextInput type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} /></FormField>
        <FormField label="To"><TextInput type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} /></FormField>
      </div>

      {auditLogs.items.length === 0 && !listLoading ? (
        <EmptyBox icon={ScrollText} title="No entries" hint="Changes to prices, discounts, settings and Paystack keys are recorded here automatically." />
      ) : (
        <>
          <TableCard minWidth={760}>
            <thead>
              <tr><Th /><Th>When</Th><Th>What happened</Th><Th>On</Th><Th>By</Th></tr>
            </thead>
            <tbody>
              {auditLogs.items.map((e) => {
                const isOpen = open === e._id;
                const hasDiff = e.before !== undefined || e.after !== undefined;
                return (
                  <FragmentRow key={e._id}>
                    <tr className="border-t align-top" style={{ borderColor: border }}>
                      <td className="w-8 px-2 py-3">
                        {hasDiff && (
                          <button type="button" onClick={() => setOpen(isOpen ? null : e._id)} aria-label={isOpen ? "Hide details" : "Show details"} aria-expanded={isOpen} className="rounded-lg p-1 opacity-60 hover:opacity-100">
                            {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </button>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs opacity-70">{fmtDateTime(e.createdAt)}</td>
                      <td className="px-3 py-3 font-medium">{humanizeAction(e.action)}</td>
                      <td className="px-3 py-3 text-xs"><Pill label={e.entityType} color="#6b7280" /> {e.entityId && <span className="ml-1 font-mono opacity-60">{e.entityId}</span>}</td>
                      <td className="px-3 py-3 text-xs">{staffName(e.actorId)}{e.actorRole && <span className="ml-1 opacity-50">({e.actorRole.replace(/_/g, " ")})</span>}</td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td />
                        <td colSpan={4} className="px-3 pb-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            {(["before", "after"] as const).map((k) => (
                              <div key={k} className="rounded-2xl p-3" style={{ backgroundColor: ui.inner }}>
                                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide opacity-50">{k}</p>
                                <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-relaxed">{e[k] === undefined ? "—" : pretty(e[k])}</pre>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </FragmentRow>
                );
              })}
            </tbody>
          </TableCard>
          <Pager page={auditLogs.page} limit={auditLogs.limit} total={auditLogs.total} onPage={setPage} />
        </>
      )}
      <p className="text-[11px] opacity-45">This log is append-only: entries can&apos;t be edited or deleted, and secrets such as API keys are never recorded.</p>
    </BillingPage>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
