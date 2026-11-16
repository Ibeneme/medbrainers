"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgePercent, Banknote, CircleDollarSign, Clock, TrendingUp } from "lucide-react";
import { DEPARTMENT_LABELS, fetchBillingSummary } from "@/api/slices";
import { useBilling } from "@/hooks/useBilling";
import { useStaffNames } from "@/hooks/useStaffNames";
import {
  Alert, BillingPage, Chips, EmptyBox, FormField, SectionCard, StatCard, TableCard, TextInput, Th, dayEndIso, dayStartIso, toDateInput,
  useBillingUI,
} from "@/components/dashboard/billing/BillingUI";

type Preset = "7" | "30" | "90" | "custom";
const daysAgo = (n: number) => toDateInput(new Date(Date.now() - n * 86_400_000));

export default function ReportsPage() {
  const { facilityId, billing, dispatch, money } = useBilling();
  const staffName = useStaffNames();
  const { ui, border } = useBillingUI();
  const { summary, listLoading, error } = billing;

  const [preset, setPreset] = useState<Preset>("30");
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(toDateInput(new Date()));
  const bad = !from || !to || to < from;

  const pick = (p: Preset) => {
    setPreset(p);
    if (p !== "custom") {
      setFrom(daysAgo(Number(p)));
      setTo(toDateInput(new Date()));
    }
  };

  const load = useCallback(() => {
    if (!facilityId || bad) return;
    dispatch(fetchBillingSummary({ facilityId, from: dayStartIso(from), to: dayEndIso(to) }));
  }, [dispatch, facilityId, from, to, bad]);
  useEffect(load, [load]);

  const peak = Math.max(1, ...(summary?.collected.byDay.map((d) => d.amount) ?? [1]));
  const cash = summary?.collected.byMethod.find((m) => m.method === "cash");
  const online = summary?.collected.byMethod.find((m) => m.method === "online");
  const failedCount = summary?.transactionEvents.filter((e) => e.status === "failed").reduce((a, e) => a + e.count, 0) ?? 0;

  return (
    <BillingPage
      title="Financial reports"
      icon={TrendingUp}
      description="Read-only view of billing and collections"
      loading={listLoading && !summary}
      loadingText="Crunching the numbers..."
      onRefresh={load}
    >
      <Chips
        label="Period"
        value={preset}
        onChange={pick}
        options={[{ id: "7", label: "Last 7 days" }, { id: "30", label: "Last 30 days" }, { id: "90", label: "Last 90 days" }, { id: "custom", label: "Custom" }]}
      />
      {preset === "custom" && (
        <div className="grid max-w-md gap-3 sm:grid-cols-2">
          <FormField label="From"><TextInput type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></FormField>
          <FormField label="To" hint={bad ? "Pick a valid range" : undefined}><TextInput type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></FormField>
        </div>
      )}
      {error && !summary && <Alert tone="danger">{error}</Alert>}

      {summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={CircleDollarSign} label="Billed" value={money(summary.billed.total)} hint={`${summary.billed.invoices} invoices`} />
            <StatCard icon={Banknote} label="Collected" value={money(summary.collected.total)} color="#16a34a" hint="successful payments" />
            <StatCard icon={Clock} label="Outstanding now" value={money(summary.outstanding.balance)} color="#d97706" hint={`${summary.outstanding.invoices} unpaid invoices`} />
            <StatCard icon={BadgePercent} label="Discounts given" value={money(summary.billed.discount)} color="#7c3aed" hint={`off ${money(summary.billed.subtotal)} gross`} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <SectionCard title="Collected by method" subtitle="Successful payments in this period">
              {summary.collected.byMethod.length === 0 ? (
                <p className="text-xs opacity-55">No successful payments in this period.</p>
              ) : (
                <div className="space-y-3">
                  {[{ label: "Cash", d: cash, c: "#0d9488" }, { label: "Online (Paystack)", d: online, c: "#7c3aed" }].map(({ label, d, c }) => {
                    const pct = summary.collected.total > 0 && d ? (d.amount / summary.collected.total) * 100 : 0;
                    return (
                      <div key={label}>
                        <div className="mb-1 flex justify-between text-xs"><span className="font-medium">{label}</span><span className="tabular-nums">{money(d?.amount ?? 0)} <span className="opacity-50">· {d?.count ?? 0} payments</span></span></div>
                        <div className="h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: ui.inner }}><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c }} /></div>
                      </div>
                    );
                  })}
                  {failedCount > 0 && <p className="text-[11px] opacity-55">{failedCount} payment attempt{failedCount === 1 ? "" : "s"} failed in this period (see the Payments tab).</p>}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Cash by cashier" subtitle="Cash confirmed as received">
              {summary.collected.cashByCashier.length === 0 ? (
                <p className="text-xs opacity-55">No cash collected in this period.</p>
              ) : (
                <ul className="space-y-2">
                  {summary.collected.cashByCashier.map((c, i) => (
                    <li key={c.cashierId ?? i} className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: ui.inner }}>
                      <span className="font-medium">{staffName(c.cashierId)}</span>
                      <span className="tabular-nums">{money(c.amount)} <span className="text-xs opacity-50">· {c.count}</span></span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Collections by day">
            {summary.collected.byDay.length === 0 ? (
              <p className="text-xs opacity-55">Nothing collected in this period.</p>
            ) : (
              <div className="flex h-44 items-end gap-1.5 overflow-x-auto pb-1" role="img" aria-label="Daily collections bar chart">
                {summary.collected.byDay.map((d) => (
                  <div key={d.date} className="flex min-w-[26px] flex-1 flex-col items-center justify-end gap-1" title={`${d.date}: ${money(d.amount)} (${d.count} payments)`}>
                    <div className="w-full rounded-t-lg" style={{ height: `${Math.max(3, (d.amount / peak) * 130)}px`, backgroundColor: "var(--brand-primary, #29AB29)" }} />
                    <span className="text-[9px] opacity-50">{d.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Billed by department" subtitle="What was charged, after discounts, for invoices issued in this period">
            {summary.billed.byDepartment.length === 0 ? (
              <EmptyBox icon={TrendingUp} title="No invoices issued in this period" />
            ) : (
              <TableCard minWidth={560}>
                <thead>
                  <tr><Th>Department</Th><Th className="text-right">Units</Th><Th className="text-right">Gross</Th><Th className="text-right">Discount</Th><Th className="text-right">Net</Th></tr>
                </thead>
                <tbody>
                  {summary.billed.byDepartment.map((d) => (
                    <tr key={d.department} className="border-t" style={{ borderColor: border }}>
                      <td className="px-3 py-3 font-medium">{DEPARTMENT_LABELS[d.department] ?? d.department}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{d.units}</td>
                      <td className="px-3 py-3 text-right tabular-nums opacity-70">{money(d.gross)}</td>
                      <td className="px-3 py-3 text-right tabular-nums opacity-70">{d.discount > 0 ? `− ${money(d.discount)}` : "—"}</td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums">{money(d.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </TableCard>
            )}
          </SectionCard>
          <p className="text-[11px] opacity-45">&quot;Billed&quot; is what was invoiced; &quot;Collected&quot; is money actually received. They differ when invoices are unpaid or part-paid.</p>
        </>
      )}
    </BillingPage>
  );
}
