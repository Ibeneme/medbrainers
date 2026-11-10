"use client";

import { useEffect } from "react";
import { FlaskConical } from "lucide-react";
import { fetchGroupingQueue } from "@/api/slices";
import {
  BASE, Empty, GroupBadge, Header, Loader, Page, Pill, RowLink, SectionCard,
  fmtDateTime, itemsSummary, nameOf, useBB, useLoad,
} from "@/components/blood-bank/bb-ui";

export default function GroupingQueuePage() {
  const bb = useBB();
  const { data, loading, reload } = useLoad<{ donations: any[]; requests: any[] }>(bb, (f) => fetchGroupingQueue({ facilityId: f, limit: 100 }));
  useEffect(() => {
    const t = setInterval(() => reload(true), 30000);
    return () => clearInterval(t);
  }, [reload]);

  const donations = data?.donations || [];
  const requests = data?.requests || [];

  return (
    <Page>
      <Header icon={<FlaskConical size={22} />} title="Grouping & Typing" subtitle={bb.activeFacility?.name} />
      {loading && !data ? (
        <Loader />
      ) : (
        <>
          <SectionCard title="Donations awaiting grouping" count={donations.length}>
            {donations.length === 0 ? (
              <Empty>No donations waiting for ABO / Rh typing.</Empty>
            ) : (
              <div className="space-y-3">
                {donations.map((d) => (
                  <RowLink key={d._id} href={`${BASE}/grouping/donations/${d._id}`}>
                    <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold">{nameOf(d.donor)}</p>
                        <p className="font-mono text-xs opacity-50">{d.donationNumber}</p>
                      </div>
                      <p className="text-xs opacity-60">Collected {fmtDateTime(d.collectedAt)}</p>
                      <div className="flex items-center gap-2">
                        <GroupBadge group={d.grouping?.group} size="sm" />
                        <Pill value={d.grouping?.status} />
                      </div>
                    </div>
                  </RowLink>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Patient samples awaiting grouping" count={requests.length}>
            {requests.length === 0 ? (
              <Empty>No patient samples waiting for typing.</Empty>
            ) : (
              <div className="space-y-3">
                {requests.map((r) => (
                  <RowLink key={r._id} href={`${BASE}/grouping/requests/${r._id}`}>
                    <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold">{nameOf(r.patient)}</p>
                        <p className="font-mono text-xs opacity-50">{r.requestNumber} · {r.patient?.mrn}</p>
                      </div>
                      <p className="text-xs opacity-60">{itemsSummary(r.items)} · sample {fmtDateTime(r.sampleReceivedAt)}</p>
                      <div className="flex items-center gap-2">
                        <Pill value={r.urgency} />
                        <GroupBadge group={r.patientGrouping?.group} size="sm" />
                        <Pill value={r.patientGrouping?.status} />
                      </div>
                    </div>
                  </RowLink>
                ))}
              </div>
            )}
          </SectionCard>
        </>
      )}
    </Page>
  );
}
