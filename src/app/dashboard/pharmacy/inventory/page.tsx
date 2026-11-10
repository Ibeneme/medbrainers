"use client";

import { useEffect, useMemo, useState } from "react";
import { Boxes, AlertTriangle, PackageX, Wallet, BookOpen } from "lucide-react";
import { fetchBatches, fetchInventory, type PharmacyInventoryRow } from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import { Modal } from "@/components/ui/items";
import {
  Chips,
  EmptyBox,
  GhostButton,
  PharmacyPage,
  Pill,
  PrimaryButton,
  SearchBar,
  StatCard,
  TableCard,
  Th,
  daysUntil,
  fmtDate,
  money,
  refName,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

type StatusFilter = "all" | "ok" | "low" | "out_of_stock";

export default function InventoryPage() {
  const { dispatch, facilityId, pharmacy } = usePharmacy();
  const { ui } = usePharmacyUI();
  const { inventory, batches, listLoading } = pharmacy;

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [open, setOpen] = useState<PharmacyInventoryRow | null>(null);

  const load = () => facilityId && dispatch(fetchInventory({ facilityId }));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  const openDrug = (row: PharmacyInventoryRow) => {
    setOpen(row);
    dispatch(fetchBatches({ facilityId, drugId: row._id, filter: "all" }));
  };

  const counts = useMemo(
    () => ({
      all: inventory.length,
      ok: inventory.filter((i) => i.stockStatus === "ok").length,
      low: inventory.filter((i) => i.stockStatus === "low").length,
      out_of_stock: inventory.filter((i) => i.stockStatus === "out_of_stock").length,
    }),
    [inventory],
  );
  const value = useMemo(() => inventory.reduce((s, i) => s + i.stockValue, 0), [inventory]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventory.filter((i) => {
      if (status !== "all" && i.stockStatus !== status) return false;
      if (!q) return true;
      return [i.genericName, i.brandName, i.code, i.category].some((x) => x?.toLowerCase().includes(q));
    });
  }, [inventory, search, status]);

  return (
    <PharmacyPage
      routes={[{ label: "Pharmacy", href: "/dashboard/pharmacy" }, { label: "Drug Inventory & Stock" }]}
      title="Drug Inventory & Stock"
      description="Sellable quantity per drug. Expired and quarantined batches are excluded from what can be dispensed."
      icon={Boxes}
      loading={listLoading && inventory.length === 0}
      loadingText="Loading inventory..."
      onRefresh={load}
      actions={<PrimaryButton href="/dashboard/pharmacy/receiving/new">Receive Stock</PrimaryButton>}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={BookOpen} label="Drugs tracked" value={counts.all} color="#0ea5e9" />
        <StatCard icon={Wallet} label="Stock value (cost)" value={money(value)} color="#8b5cf6" />
        <StatCard icon={AlertTriangle} label="Low stock" value={counts.low} color="#d97706" />
        <StatCard icon={PackageX} label="Out of stock" value={counts.out_of_stock} color="#dc2626" />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by drug name, brand, code or category..." />
      <Chips
        label="Status:"
        value={status}
        onChange={setStatus}
        options={[
          { id: "all", label: "All", count: counts.all },
          { id: "ok", label: "In stock", count: counts.ok },
          { id: "low", label: "Low", count: counts.low },
          { id: "out_of_stock", label: "Out of stock", count: counts.out_of_stock },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyBox icon={Boxes} title="No inventory records found." hint="Add drugs to the catalog, then receive stock through Goods Received." />
      ) : (
        <TableCard minWidth={760}>
          <thead>
            <tr className="text-xs opacity-50 border-b" style={{ borderColor: ui.border }}>
              <Th>Drug</Th>
              <Th className="hidden md:table-cell">Category</Th>
              <Th>Sellable</Th>
              <Th className="hidden sm:table-cell">Reorder at</Th>
              <Th>Status</Th>
              <Th className="hidden md:table-cell">Nearest expiry</Th>
              <Th className="text-right hidden lg:table-cell">Value</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const d = daysUntil(r.nearestExpiry);
              return (
                <tr
                  key={r._id}
                  onClick={() => openDrug(r)}
                  className="cursor-pointer transition border-b last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  style={{ borderColor: ui.border }}
                >
                  <td className="px-3 py-3.5">
                    <p className="font-semibold text-xs">{r.genericName} {r.strength}</p>
                    <p className="text-[11px] opacity-50">
                      {r.code}
                      {r.brandName ? ` · ${r.brandName}` : ""}
                    </p>
                  </td>
                  <td className="px-3 py-3.5 text-xs opacity-70 hidden md:table-cell">{r.category}</td>
                  <td className="px-3 py-3.5 text-xs">
                    <span className="font-bold text-sm">{r.sellable}</span> <span className="opacity-50">{r.unit}</span>
                    {r.expiredQty > 0 && <p className="text-[10px] text-rose-500">{r.expiredQty} expired</p>}
                  </td>
                  <td className="px-3 py-3.5 text-xs opacity-70 hidden sm:table-cell">{r.reorderLevel}</td>
                  <td className="px-3 py-3.5">
                    <Pill status={r.stockStatus} />
                  </td>
                  <td className="px-3 py-3.5 text-xs opacity-70 hidden md:table-cell">
                    {r.nearestExpiry ? (
                      <>
                        {fmtDate(r.nearestExpiry)}
                        {d !== null && d <= 90 && <span className="ml-1.5 text-amber-600 font-semibold">({d}d)</span>}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-xs text-right hidden lg:table-cell">{money(r.stockValue)}</td>
                </tr>
              );
            })}
          </tbody>
        </TableCard>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? `${open.genericName} ${open.strength || ""}` : ""} ui={ui} maxWidth="max-w-2xl">
        {open && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-xs">
              {[
                ["Sellable", `${open.sellable} ${open.unit}`],
                ["Total on hand", String(open.totalOnHand)],
                ["Active batches", String(open.batchCount)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl p-3 space-y-1" style={{ backgroundColor: ui.inner }}>
                  <span className="opacity-50 block uppercase text-[10px] font-bold">{k}</span>
                  <span className="text-sm font-semibold">{v}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {batches.length === 0 ? (
                <p className="text-xs opacity-50 py-6 text-center">No batches on record.</p>
              ) : (
                batches.map((b) => {
                  const d = daysUntil(b.expiryDate);
                  return (
                    <div key={b._id} className="rounded-2xl p-3 flex items-center justify-between gap-3 text-xs" style={{ backgroundColor: ui.inner }}>
                      <div>
                        <p className="font-mono font-semibold">{b.batchNumber}</p>
                        <p className="opacity-60">
                          Exp {fmtDate(b.expiryDate)}
                          {d !== null && d < 0 ? " · expired" : d !== null && d <= 90 ? ` · ${d}d left` : ""} · {refName(b.supplier)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{b.quantityOnHand}</p>
                        <Pill status={d !== null && d < 0 ? "cancelled" : b.status} label={d !== null && d < 0 ? "expired" : b.status} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: ui.border }}>
              <GhostButton href={`/dashboard/pharmacy/adjustments?drug=${open._id}`}>Adjust stock</GhostButton>
              <PrimaryButton href={`/dashboard/pharmacy/receiving/new?drug=${open._id}`}>Receive stock</PrimaryButton>
            </div>
          </div>
        )}
      </Modal>
    </PharmacyPage>
  );
}
