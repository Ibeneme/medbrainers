"use client";

import { useEffect, useMemo, useState } from "react";
import { Droplets, Plus } from "lucide-react";
import { fetchDonations } from "@/api/slices";
import {
  BASE, Btn, Empty, GroupBadge, Header, Loader, Page, Pill, Pills, RowLink, SearchBox, SectionCard,
  ENUMS, fmtDateTime, label, nameOf, useBB,
} from "@/components/blood-bank/bb-ui";

export default function DonationsPage() {
  const { facilityId, act, bloodBank, activeFacility } = useBB();
  const [status, setStatus] = useState("all");
  const [tti, setTti] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!facilityId) return;
    act(
      fetchDonations({
        facilityId,
        status: status === "all" ? undefined : status,
        ttiStatus: tti === "all" ? undefined : tti,
        limit: 200,
      }),
      false
    );
  }, [facilityId, act, status, tti]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return bloodBank.donations.filter((d: any) =>
      !s ? true : nameOf(d.donor).toLowerCase().includes(s) || String(d.donationNumber).toLowerCase().includes(s) || String(d.donor?.donorNumber || "").toLowerCase().includes(s)
    );
  }, [bloodBank.donations, q]);

  return (
    <Page>
      <Header
        icon={<Droplets size={22} />}
        title="Donations & Collection"
        subtitle={activeFacility?.name}
        actions={<Btn href={`${BASE}/donations/new`}><Plus size={16} /> Record donation</Btn>}
      />
      <SectionCard title="Donations" count={rows.length}>
        <SearchBox value={q} onChange={setQ} placeholder="Search donor or donation no…" />
        <div className="space-y-2.5">
          <Pills value={status} onChange={setStatus} options={[{ value: "all", label: "Any status" }, ...["collected", "released", "discarded"].map((s) => ({ value: s, label: label(s) }))]} />
          <Pills value={tti} onChange={setTti} options={[{ value: "all", label: "Any TTI" }, ...ENUMS.ttiStatuses.map((s) => ({ value: s, label: `TTI ${s}` }))]} />
        </div>
        {bloodBank.listLoading && rows.length === 0 ? (
          <Loader />
        ) : rows.length === 0 ? (
          <Empty>No donations recorded.</Empty>
        ) : (
          <div className="space-y-3">
            {rows.map((d: any) => (
              <RowLink key={d._id} href={`${BASE}/donations/${d._id}`}>
                <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto_auto]">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">{nameOf(d.donor)}</p>
                    <p className="font-mono text-xs opacity-50">{d.donationNumber}</p>
                  </div>
                  <div className="text-xs opacity-60">
                    <p>{label(d.donationType)} · {d.volumeMl} mL</p>
                    <p>{fmtDateTime(d.collectedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <GroupBadge group={d.grouping?.group} size="sm" />
                    <Pill tone="mute">TTI</Pill>
                    <Pill value={d.tti?.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    {d.outcome === "incomplete" && <Pill value="incomplete" />}
                    <Pill value={d.status} />
                  </div>
                </div>
              </RowLink>
            ))}
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
