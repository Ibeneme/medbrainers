"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { fetchDiscards, fetchExpiryOverview } from "@/api/slices";
import {
  BASE, Btn, DataTable, Empty, ENUMS, GroupBadge, Header, Loader, Page, Pill, Pills, RowLink, SectionCard,
  PRODUCT_LABEL, daysLeft, fmtDate, fmtDateTime, label, nameOf, useBB, useLoad,
} from "@/components/blood-bank/bb-ui";

export default function ExpiryPage() {
  const bb = useBB();
  const { facilityId, act, bloodBank } = bb;
  const [tab, setTab] = useState("expired");
  const [days, setDays] = useState("7");
  const [reason, setReason] = useState("");
  const { data, loading } = useLoad<{ expired: any[]; expiringSoon: any[]; recentDiscards: any[] }>(bb, (f) => fetchExpiryOverview({ facilityId: f, days: Number(days) }), [days]);

  useEffect(() => {
    if (facilityId && tab === "discards") act(fetchDiscards({ facilityId, reason: reason || undefined, limit: 200 }), false);
  }, [facilityId, act, tab, reason]);

  const expired = data?.expired || [];
  const soon = data?.expiringSoon || [];

  const unitRows = (list: any[]) => (
    <div className="space-y-3">
      {list.map((u) => {
        const dl = daysLeft(u.expiryDate);
        return (
          <RowLink key={u._id} href={`${BASE}/inventory/${u._id}`}>
            <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <div className="flex items-center gap-3">
                <GroupBadge group={u.bloodGroup} size="sm" />
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold">{u.unitNumber}</p>
                  <p className="text-xs opacity-55">{PRODUCT_LABEL[u.product] || label(u.product)}</p>
                </div>
              </div>
              <p className="text-xs" style={{ color: dl !== null && dl < 0 ? "#ef4444" : undefined }}>
                {dl !== null && dl < 0 ? `Expired ${fmtDate(u.expiryDate)}` : `Expires ${fmtDate(u.expiryDate)} (${dl}d)`}
              </p>
              <p className="text-xs opacity-60">{u.storageUnit?.name || "No storage assigned"}</p>
              <Pill value={u.status} />
            </div>
          </RowLink>
        );
      })}
    </div>
  );

  return (
    <Page>
      <Header
        icon={<Timer size={22} />}
        title="Expiry & Discards"
        subtitle={bb.activeFacility?.name}
        actions={expired.length > 0 && <Btn href={`${BASE}/expiry/discard-expired`} tone="danger">Discard all expired ({expired.length})</Btn>}
      />
      <SectionCard
        title={tab === "expired" ? "Expired units" : tab === "soon" ? "Expiring soon" : "Discard log"}
        count={tab === "expired" ? expired.length : tab === "soon" ? soon.length : bloodBank.discards.length}
      >
        <Pills value={tab} onChange={setTab} options={[{ value: "expired", label: "Expired", count: expired.length }, { value: "soon", label: "Expiring soon", count: soon.length }, { value: "discards", label: "Discard log" }]} />
        {tab === "soon" && <Pills value={days} onChange={setDays} options={["3", "7", "14", "30"].map((d) => ({ value: d, label: `${d} days` }))} />}
        {tab === "discards" && <Pills value={reason} onChange={setReason} options={[{ value: "", label: "All reasons" }, ...ENUMS.discardReasons.slice(0, 8).map((r) => ({ value: r, label: label(r) }))]} />}

        {tab !== "discards" && loading && !data ? (
          <Loader />
        ) : tab === "expired" ? (
          expired.length ? unitRows(expired) : <Empty>No expired units in stock. 🎉</Empty>
        ) : tab === "soon" ? (
          soon.length ? unitRows(soon) : <Empty>No units expire within {days} days.</Empty>
        ) : (
          <DataTable
            head={["Discard", "Unit", "Product", "Reason", "When", "By"]}
            empty="No discards recorded."
            rows={bloodBank.discards.map((x) => [
              <span key="n" className="font-mono text-xs">{x.discardNumber}</span>,
              <span key="u" className="font-mono text-xs">{x.unitNumber}</span>,
              PRODUCT_LABEL[x.product] || label(x.product), <Pill key="r" value="discarded">{label(x.reason)}</Pill>, fmtDateTime(x.discardedAt), x.automatic ? "Automatic" : nameOf(x.discardedBy),
            ])}
          />
        )}
      </SectionCard>
    </Page>
  );
}
