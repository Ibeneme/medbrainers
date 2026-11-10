"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Truck } from "lucide-react";
import { fetchReceipts } from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import {
  EmptyBox,
  PharmacyPage,
  PrimaryButton,
  SearchBar,
  TableCard,
  Th,
  fmtDateTime,
  money,
  personName,
  refName,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

export default function GoodsReceivedPage() {
  const { dispatch, facilityId, pharmacy } = usePharmacy();
  const { ui } = usePharmacyUI();
  const { receipts, listLoading } = pharmacy;
  const [search, setSearch] = useState("");

  const load = () => facilityId && dispatch(fetchReceipts({ facilityId }));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return receipts.filter((r) => !q || r.grnNumber.toLowerCase().includes(q) || refName(r.supplier).toLowerCase().includes(q) || (r.invoiceNumber || "").toLowerCase().includes(q) || r.items.some((i) => i.drugName.toLowerCase().includes(q) || i.batchNumber.toLowerCase().includes(q)));
  }, [receipts, search]);

  return (
    <PharmacyPage
      routes={[{ label: "Pharmacy", href: "/dashboard/pharmacy" }, { label: "Goods Received" }]}
      title="Goods Received"
      description="Every delivery creates stock batches with batch number and expiry."
      icon={Truck}
      loading={listLoading && receipts.length === 0}
      loadingText="Loading receipts..."
      onRefresh={load}
      actions={<PrimaryButton href="/dashboard/pharmacy/receiving/new" icon={Plus}>Receive Stock</PrimaryButton>}
    >
      <SearchBar value={search} onChange={setSearch} placeholder="Search by GRN, supplier, invoice, drug or batch..." />
      {rows.length === 0 ? (
        <EmptyBox icon={Truck} title="No deliveries received yet." action={<PrimaryButton href="/dashboard/pharmacy/receiving/new" icon={Plus}>Receive stock</PrimaryButton>} />
      ) : (
        <TableCard minWidth={760}>
          <thead>
            <tr className="text-xs opacity-50 border-b" style={{ borderColor: ui.border }}>
              <Th>GRN</Th>
              <Th>Supplier</Th>
              <Th className="hidden md:table-cell">Items</Th>
              <Th className="hidden sm:table-cell">Received</Th>
              <Th className="text-right">Value</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="border-b last:border-0" style={{ borderColor: ui.border }}>
                <td className="px-3 py-3.5">
                  <span className="rounded-full px-2.5 py-1 font-mono text-[11px]" style={{ backgroundColor: ui.inner }}>{r.grnNumber}</span>
                  {r.purchaseOrder && typeof r.purchaseOrder !== "string" && <p className="text-[10px] opacity-50 mt-1">{r.purchaseOrder.poNumber}</p>}
                </td>
                <td className="px-3 py-3.5 text-xs font-semibold">{refName(r.supplier)}{r.invoiceNumber && <p className="font-normal opacity-50">Inv {r.invoiceNumber}</p>}</td>
                <td className="px-3 py-3.5 text-xs opacity-70 hidden md:table-cell max-w-[280px]">
                  {r.items.map((i) => `${i.drugName} ×${i.quantity} [${i.batchNumber}]`).join(", ")}
                </td>
                <td className="px-3 py-3.5 text-xs opacity-60 hidden sm:table-cell">{fmtDateTime(r.receivedAt)}<p>{personName(r.receivedBy)}</p></td>
                <td className="px-3 py-3.5 text-xs font-semibold text-right">{money(r.totalCost)}</td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
    </PharmacyPage>
  );
}
