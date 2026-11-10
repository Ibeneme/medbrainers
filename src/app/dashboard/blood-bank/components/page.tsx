"use client";

import { useState } from "react";
import { Layers } from "lucide-react";
import { fetchComponents } from "@/api/slices";
import {
  BASE, Empty, GroupBadge, Header, Loader, Page, Pill, Pills, RowLink, SearchBox, SectionCard, PRODUCT_LABEL,
  PRODUCT_OPTS, daysLeft, fmtDate, useBB, useDebounced, useLoad, DERIVATIONS, label,
} from "@/components/blood-bank/bb-ui";
import { CustomDropdown } from "@/components/ui/items";

export default function ComponentsPage() {
  const bb = useBB();
  const [tab, setTab] = useState("pending");
  const [q, setQ] = useState("");
  const [product, setProduct] = useState("");
  const search = useDebounced(q);
  const { data, loading } = useLoad<{ pendingProcessing: any[]; components: any[] }>(
    bb, (f) => fetchComponents({ facilityId: f, search: search || undefined, product: product || undefined, limit: 200 }), [search, product]
  );
  const pending = data?.pendingProcessing || [];
  const comps = data?.components || [];
  const list = tab === "pending" ? pending : comps;

  return (
    <Page>
      <Header icon={<Layers size={22} />} title="Component Processing" subtitle={bb.activeFacility?.name} />
      <SectionCard title={tab === "pending" ? "Ready to process" : "Prepared components"} count={list.length}>
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox value={q} onChange={setQ} placeholder="Search unit number…" />
          <div className="w-52">
            <CustomDropdown value={product} options={[{ label: "All products", value: "" }, ...PRODUCT_OPTS]} onChange={setProduct} placeholder="Product" isDark={bb.isDark} colors={bb.colors} border={bb.ui.border} />
          </div>
        </div>
        <Pills value={tab} onChange={setTab} options={[{ value: "pending", label: "Ready to process", count: pending.length }, { value: "done", label: "Prepared components", count: comps.length }]} />
        {loading && !data ? (
          <Loader />
        ) : list.length === 0 ? (
          <Empty>{tab === "pending" ? "No whole blood or plasma units are waiting to be processed." : "No components prepared yet."}</Empty>
        ) : (
          <div className="space-y-3">
            {list.map((u: any) => {
              const dl = daysLeft(u.expiryDate);
              return (
                <RowLink key={u._id} href={tab === "pending" ? `${BASE}/components/process/${u._id}` : `${BASE}/inventory/${u._id}`}>
                  <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <div className="flex items-center gap-3">
                      <GroupBadge group={u.bloodGroup} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm font-semibold">{u.unitNumber}</p>
                        <p className="text-xs opacity-55">{PRODUCT_LABEL[u.product] || label(u.product)} · {u.volumeMl} mL</p>
                      </div>
                    </div>
                    <p className="text-xs opacity-60">Expires {fmtDate(u.expiryDate)}{dl !== null ? ` (${dl}d)` : ""}</p>
                    <p className="text-xs opacity-60">
                      {tab === "pending" ? `Can make: ${(DERIVATIONS[u.product] || []).map((p) => PRODUCT_LABEL[p]).join(", ")}` : u.storageUnit?.name ? `In ${u.storageUnit.name}` : "No storage assigned"}
                    </p>
                    <Pill value={u.status} />
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
