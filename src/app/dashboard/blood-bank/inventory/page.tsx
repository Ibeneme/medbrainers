"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Boxes } from "lucide-react";
import { fetchBloodBankInventory, fetchUnits } from "@/api/slices";
import { CustomDropdown } from "@/components/ui/items";
import {
  BASE, Empty, GROUPS, GROUP_OPTS, GroupBadge, Header, Loader, Page, Pill, Pills, PRODUCTS, PRODUCT_LABEL,
  PRODUCT_OPTS, RowLink, SearchBox, SectionCard, daysLeft, fmtDate, label, useBB, useDebounced, useLoad,
} from "@/components/blood-bank/bb-ui";

function Inner() {
  const sp = useSearchParams();
  const bb = useBB();
  const { facilityId, act, bloodBank, ui, isDark, colors } = bb;
  const [status, setStatus] = useState("");
  const [product, setProduct] = useState("");
  const [group, setGroup] = useState(sp.get("bloodGroup") || "");
  const [soon, setSoon] = useState(false);
  const [q, setQ] = useState("");
  const search = useDebounced(q);
  const { data: inv } = useLoad<any>(bb, (f) => fetchBloodBankInventory({ facilityId: f }));

  useEffect(() => {
    if (!facilityId) return;
    act(
      fetchUnits({
        facilityId, status: status || undefined, product: product || undefined, bloodGroup: group || undefined,
        search: search || undefined, expiringWithinDays: soon ? 7 : undefined, limit: 300,
      }),
      false
    );
  }, [facilityId, act, status, product, group, search, soon]);

  const byProduct: Record<string, Record<string, any>> = inv?.byProduct || {};
  const rows = PRODUCTS.filter((p) => byProduct[p.value]);
  const units = bloodBank.units;

  return (
    <Page>
      <Header icon={<Boxes size={22} />} title="Blood Inventory" subtitle={bb.activeFacility?.name} />

      <SectionCard title="Stock matrix">
        {!inv ? (
          <Loader />
        ) : rows.length === 0 ? (
          <Empty>No units in stock.</Empty>
        ) : (
          <div className="overflow-x-auto rounded-2xl" style={{ backgroundColor: ui.inner }}>
            <table className="w-full min-w-[640px] text-center text-sm">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-wider opacity-55">
                  <th className="px-4 py-3 text-left">Product</th>
                  {GROUPS.map((g) => <th key={g} className="px-2 py-3 font-mono">{g}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.value} className="border-t" style={{ borderColor: ui.border }}>
                    <td className="px-4 py-3 text-left font-medium">{p.label}</td>
                    {GROUPS.map((g) => {
                      const c = byProduct[p.value]?.[g];
                      return (
                        <td key={g} className="px-2 py-3">
                          {c ? (
                            <button
                              type="button"
                              onClick={() => { setProduct(p.value); setGroup(g); }}
                              className="rounded-lg px-2 py-1 font-semibold transition hover:opacity-70"
                              style={c.expiringSoon ? { backgroundColor: "#f59e0b24" } : undefined}
                              title={`${c.available} available · ${c.reserved} reserved · ${c.quarantine} quarantine · ${c.expiringSoon} expiring soon`}
                            >
                              {c.available}
                              {c.reserved > 0 && <span className="text-[10px] opacity-55">+{c.reserved}</span>}
                            </button>
                          ) : <span className="opacity-25">·</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[11px] opacity-50">Numbers are available units; “+n” is reserved. Highlighted cells have units expiring soon. Click a cell to filter the list below.</p>
      </SectionCard>

      <SectionCard title="Units" count={units.length}>
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox value={q} onChange={setQ} placeholder="Search unit number…" />
          <div className="w-52"><CustomDropdown value={product} options={[{ label: "All products", value: "" }, ...PRODUCT_OPTS]} onChange={setProduct} placeholder="Product" isDark={isDark} colors={colors} border={ui.border} /></div>
          <div className="w-36"><CustomDropdown value={group} options={[{ label: "All groups", value: "" }, ...GROUP_OPTS]} onChange={setGroup} placeholder="Group" isDark={isDark} colors={colors} border={ui.border} /></div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Pills value={status} onChange={setStatus} options={[{ value: "", label: "In stock" }, ...["available", "quarantine", "reserved", "issued", "transfused", "processed", "discarded"].map((s) => ({ value: s, label: label(s) }))]} />
          <Pills value={soon ? "soon" : "any"} onChange={(v) => setSoon(v === "soon")} options={[{ value: "any", label: "Any expiry" }, { value: "soon", label: "Expiring in 7 days" }]} />
        </div>
        {bloodBank.listLoading && units.length === 0 ? (
          <Loader />
        ) : units.length === 0 ? (
          <Empty>No units match these filters.</Empty>
        ) : (
          <div className="space-y-3">
            {units.map((u) => {
              const dl = daysLeft(u.expiryDate);
              return (
                <RowLink key={u._id} href={`${BASE}/inventory/${u._id}`}>
                  <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <div className="flex items-center gap-3">
                      <GroupBadge group={u.bloodGroup} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm font-semibold">{u.unitNumber}</p>
                        <p className="text-xs opacity-55">{PRODUCT_LABEL[u.product] || label(u.product)} · {u.volumeMl} mL</p>
                      </div>
                    </div>
                    <p className="text-xs" style={dl !== null && dl <= 3 ? { color: "#ef4444" } : { opacity: 0.6 }}>
                      Expires {fmtDate(u.expiryDate)}{dl !== null ? ` (${dl < 0 ? "expired" : `${dl}d`})` : ""}
                    </p>
                    <p className="text-xs opacity-60">{(u.storageUnit as any)?.name ? `${(u.storageUnit as any).name}${u.location ? ` · ${u.location}` : ""}` : "No storage assigned"}</p>
                    <div className="flex items-center gap-2">
                      {u.qcHold?.active && <Pill value="discrepancy">QC hold</Pill>}
                      <Pill value={u.status} />
                    </div>
                  </div>
                </RowLink>
              );
            })}
          </div>
        )}
      </SectionCard>
    </Page>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<Page><Loader /></Page>}>
      <Inner />
    </Suspense>
  );
}
