"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ShoppingCart } from "lucide-react";
import { fetchLowStock } from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import {
  Chips,
  EmptyBox,
  PharmacyPage,
  Pill,
  PrimaryButton,
  StatCard,
  TableCard,
  Th,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";
import { PRIMARY_COLOR } from "@/constants/colors";

export default function LowStockPage() {
  const { dispatch, facilityId, pharmacy } = usePharmacy();
  const { ui } = usePharmacyUI();
  const { lowStock, listLoading } = pharmacy;
  const [view, setView] = useState<"all" | "low" | "out_of_stock">("all");
  const [picked, setPicked] = useState<string[]>([]);

  const load = () => facilityId && dispatch(fetchLowStock({ facilityId }));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  const rows = useMemo(() => lowStock.filter((r) => view === "all" || r.stockStatus === view), [lowStock, view]);
  const out = lowStock.filter((r) => r.stockStatus === "out_of_stock").length;
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const allPicked = rows.length > 0 && rows.every((r) => picked.includes(r._id));

  return (
    <PharmacyPage
      routes={[{ label: "Pharmacy", href: "/dashboard/pharmacy" }, { label: "Low Stock Alerts" }]}
      title="Low Stock Alerts"
      description="Drugs whose sellable quantity is at or below their reorder level."
      icon={AlertTriangle}
      loading={listLoading && lowStock.length === 0}
      loadingText="Checking stock levels..."
      onRefresh={load}
      actions={
        <PrimaryButton
          icon={ShoppingCart}
          disabled={picked.length === 0}
          href={picked.length ? `/dashboard/pharmacy/purchase-orders/new?drugs=${picked.join(",")}` : undefined}
        >
          Create PO ({picked.length})
        </PrimaryButton>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard icon={AlertTriangle} label="Low stock" value={lowStock.length - out} color="#d97706" />
        <StatCard icon={AlertTriangle} label="Out of stock" value={out} color="#dc2626" />
      </div>
      <Chips
        label="Show:"
        value={view}
        onChange={setView}
        options={[
          { id: "all", label: "All alerts", count: lowStock.length },
          { id: "low", label: "Low", count: lowStock.length - out },
          { id: "out_of_stock", label: "Out of stock", count: out },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyBox icon={AlertTriangle} title="Nothing needs reordering." hint="Every active drug is above its reorder level." />
      ) : (
        <TableCard minWidth={700}>
          <thead>
            <tr className="text-xs opacity-50 border-b" style={{ borderColor: ui.border }}>
              <Th className="w-10 text-center">
                <input
                  type="checkbox"
                  checked={allPicked}
                  onChange={() => setPicked(allPicked ? [] : rows.map((r) => r._id))}
                  style={{ accentColor: PRIMARY_COLOR }}
                />
              </Th>
              <Th>Drug</Th>
              <Th>Sellable</Th>
              <Th>Reorder at</Th>
              <Th className="hidden sm:table-cell">Suggested order</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="border-b last:border-0" style={{ borderColor: ui.border }}>
                <td className="px-3 py-3.5 text-center">
                  <input type="checkbox" checked={picked.includes(r._id)} onChange={() => toggle(r._id)} style={{ accentColor: PRIMARY_COLOR }} />
                </td>
                <td className="px-3 py-3.5">
                  <p className="font-semibold text-xs">{r.genericName} {r.strength}</p>
                  <p className="text-[11px] opacity-50">{r.code} · {r.category}</p>
                </td>
                <td className="px-3 py-3.5 text-sm font-bold">{r.sellable}</td>
                <td className="px-3 py-3.5 text-xs opacity-70">{r.reorderLevel}</td>
                <td className="px-3 py-3.5 text-xs hidden sm:table-cell">{r.suggestedOrder} {r.unit}</td>
                <td className="px-3 py-3.5"><Pill status={r.stockStatus} /></td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
    </PharmacyPage>
  );
}
