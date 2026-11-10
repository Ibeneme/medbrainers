"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, ShoppingCart } from "lucide-react";
import { fetchPurchaseOrders, type PoStatus } from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import {
  Chips,
  EmptyBox,
  PharmacyPage,
  Pill,
  PrimaryButton,
  SearchBar,
  TableCard,
  Th,
  fmtDate,
  money,
  refName,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

export default function PurchaseOrdersPage() {
  const { dispatch, facilityId, pharmacy } = usePharmacy();
  const { ui } = usePharmacyUI();
  const { purchaseOrders, listLoading } = pharmacy;
  const [status, setStatus] = useState<"all" | PoStatus>("all");
  const [search, setSearch] = useState("");

  const load = () => facilityId && dispatch(fetchPurchaseOrders({ facilityId }));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: purchaseOrders.length };
    purchaseOrders.forEach((p) => (c[p.status] = (c[p.status] || 0) + 1));
    return c;
  }, [purchaseOrders]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return purchaseOrders.filter((p) => (status === "all" || p.status === status) && (!q || p.poNumber.toLowerCase().includes(q) || refName(p.supplier).toLowerCase().includes(q) || p.items.some((i) => i.drugName.toLowerCase().includes(q))));
  }, [purchaseOrders, status, search]);

  return (
    <PharmacyPage
      routes={[{ label: "Pharmacy", href: "/dashboard/pharmacy" }, { label: "Purchase Orders" }]}
      title="Purchase Orders"
      description="Raise orders to suppliers and track what has been received."
      icon={ShoppingCart}
      loading={listLoading && purchaseOrders.length === 0}
      loadingText="Loading purchase orders..."
      onRefresh={load}
      actions={<PrimaryButton href="/dashboard/pharmacy/purchase-orders/new" icon={Plus}>New Purchase Order</PrimaryButton>}
    >
      <SearchBar value={search} onChange={setSearch} placeholder="Search by PO number, supplier or drug..." />
      <Chips
        label="Status:"
        value={status}
        onChange={setStatus}
        options={[
          { id: "all", label: "All", count: counts.all },
          ...(["draft", "ordered", "partially_received", "received", "cancelled"] as PoStatus[]).map((s) => ({
            id: s,
            label: s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
            count: counts[s] || 0,
          })),
        ]}
      />
      {rows.length === 0 ? (
        <EmptyBox icon={ShoppingCart} title="No purchase orders found." action={<PrimaryButton href="/dashboard/pharmacy/purchase-orders/new" icon={Plus}>Create a purchase order</PrimaryButton>} />
      ) : (
        <TableCard minWidth={720}>
          <thead>
            <tr className="text-xs opacity-50 border-b" style={{ borderColor: ui.border }}>
              <Th>PO</Th>
              <Th>Supplier</Th>
              <Th className="hidden md:table-cell">Items</Th>
              <Th className="hidden sm:table-cell">Expected</Th>
              <Th>Status</Th>
              <Th className="text-right">Total</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p._id} className="border-b last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition" style={{ borderColor: ui.border }}>
                <td className="px-3 py-3.5">
                  <Link href={`/dashboard/pharmacy/purchase-orders/${p._id}`} className="rounded-full px-2.5 py-1 font-mono text-[11px] inline-block" style={{ backgroundColor: ui.inner }}>
                    {p.poNumber}
                  </Link>
                </td>
                <td className="px-3 py-3.5 text-xs font-semibold">{refName(p.supplier)}</td>
                <td className="px-3 py-3.5 text-xs opacity-70 hidden md:table-cell">{p.items.length} item(s)</td>
                <td className="px-3 py-3.5 text-xs opacity-60 hidden sm:table-cell">{fmtDate(p.expectedDate)}</td>
                <td className="px-3 py-3.5"><Pill status={p.status} /></td>
                <td className="px-3 py-3.5 text-xs font-semibold text-right">{money(p.totalCost)}</td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
    </PharmacyPage>
  );
}
