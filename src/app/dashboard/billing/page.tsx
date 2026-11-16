"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BadgePercent, Banknote, CircleDollarSign, Clock, KeyRound, Receipt, ScrollText, Settings2, ShoppingCart, Tags, TrendingUp, Wallet,
} from "lucide-react";
import { fetchBillingItems, fetchBillingSummary, fetchInvoices } from "@/api/slices";
import { useAccess } from "@/hooks/useAccess";
import { useBilling } from "@/hooks/useBilling";
import Link from "@/components/access/guarded-link";
import {
  Alert, BillingPage, EmptyBox, InvoiceStatusPill, SectionCard, StatCard, TableCard, Th, dayEndIso, dayStartIso, fmtDate, toDateInput, useBillingUI,
} from "@/components/dashboard/billing/BillingUI";

const SHORTCUTS = [
  { href: "/dashboard/billing/pos", label: "New sale", text: "Build a bill and take payment", icon: ShoppingCart },
  { href: "/dashboard/billing/invoices", label: "Invoices", text: "Find, review and settle bills", icon: Receipt },
  { href: "/dashboard/billing/catalog", label: "Price catalog", text: "Prices for every service", icon: Tags },
  { href: "/dashboard/billing/discounts", label: "Discounts", text: "Rules, coupons, family bundles", icon: BadgePercent },
  { href: "/dashboard/billing/payments", label: "Payment log", text: "Every payment, permanently recorded", icon: Wallet },
  { href: "/dashboard/billing/reports", label: "Reports", text: "Billed, collected and outstanding", icon: TrendingUp },
  { href: "/dashboard/billing/audit", label: "Audit log", text: "Who changed prices and settings", icon: ScrollText },
  { href: "/dashboard/billing/settings", label: "Settings", text: "Cash toggle, currency, limits", icon: Settings2 },
  { href: "/dashboard/billing/gateway", label: "Paystack", text: "Your online-payment keys", icon: KeyRound },
];

export default function BillingOverviewPage() {
  const router = useRouter();
  const { facilityId, billing, dispatch, money, settings } = useBilling();
  const { can } = useAccess();
  const { ui, border } = useBillingUI();
  const { summary, invoices, catalog } = billing;

  const canReports = can("billing.reports");
  const canManage = can("billing.manage");

  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchInvoices({ facilityId, page: 1, limit: 5 }));
    if (canReports) {
      const to = new Date();
      const from = toDateInput(new Date(to.getTime() - 30 * 86_400_000));
      dispatch(fetchBillingSummary({ facilityId, from: dayStartIso(from), to: dayEndIso(toDateInput(to)) }));
    }
    if (canManage) dispatch(fetchBillingItems({ facilityId, page: 1, limit: 1 }));
  }, [dispatch, facilityId, canReports, canManage]);

  const noPrices = canManage && catalog.total === 0 && catalog.items.length === 0 && !billing.listLoading;

  return (
    <BillingPage title="Billing & payments" icon={CircleDollarSign} description="Prices, bills, discounts and payments for this facility">
      {noPrices && (
        <Alert tone="warning">
          <b>Set your prices first.</b> Nothing can be billed until services, drugs and tests are in the <Link href="/dashboard/billing/catalog" className="underline">price catalog</Link>.
        </Alert>
      )}
      {settings && !settings.acceptCashPayments && <Alert tone="info">Cash payments are switched off — this facility is taking <b>online payments only</b>.</Alert>}

      {canReports && summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={CircleDollarSign} label="Billed (30 days)" value={money(summary.billed.total)} hint={`${summary.billed.invoices} invoices`} />
          <StatCard icon={Banknote} label="Collected (30 days)" value={money(summary.collected.total)} color="#16a34a" />
          <StatCard icon={Clock} label="Outstanding now" value={money(summary.outstanding.balance)} color="#d97706" hint={`${summary.outstanding.invoices} unpaid`} />
          <StatCard icon={BadgePercent} label="Discounts given" value={money(summary.billed.discount)} color="#7c3aed" />
        </div>
      )}

      {/* GuardedLink hides every shortcut this person's role can't open */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SHORTCUTS.map(({ href, label, text, icon: Icon }) => (
          <Link key={href} href={href} className="group flex items-center gap-4 rounded-3xl p-5 transition hover:opacity-90" style={{ backgroundColor: ui.card }}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(41,171,41,0.12)", color: "var(--brand-primary, #29AB29)" }}>
              <Icon size={19} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{label}</span>
              <span className="block truncate text-xs opacity-55">{text}</span>
            </span>
          </Link>
        ))}
      </div>

      <SectionCard title="Recent invoices" right={<Link href="/dashboard/billing/invoices" className="text-xs font-semibold underline">View all</Link>}>
        {invoices.items.length === 0 ? (
          <EmptyBox icon={Receipt} title="No invoices yet" hint="They appear here as soon as the first bill is raised." />
        ) : (
          <TableCard minWidth={560}>
            <thead>
              <tr><Th>Invoice</Th><Th>Patient</Th><Th>Date</Th><Th className="text-right">Total</Th><Th>Status</Th></tr>
            </thead>
            <tbody>
              {invoices.items.slice(0, 5).map((inv) => (
                <tr key={inv._id} className="cursor-pointer border-t hover:bg-black/[0.03]" style={{ borderColor: border }} onClick={() => router.push(`/dashboard/billing/invoices/${inv._id}`)}>
                  <td className="px-3 py-3 font-mono text-xs font-semibold">{inv.invoiceNumber ?? "Draft"}</td>
                  <td className="px-3 py-3">{inv.patientSnapshot?.name ?? <span className="opacity-45">Walk-in</span>}</td>
                  <td className="px-3 py-3 text-xs opacity-70">{fmtDate(inv.issuedAt ?? inv.createdAt)}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{money(inv.total, inv.currency)}</td>
                  <td className="px-3 py-3"><InvoiceStatusPill status={inv.status} /></td>
                </tr>
              ))}
            </tbody>
          </TableCard>
        )}
      </SectionCard>
    </BillingPage>
  );
}
