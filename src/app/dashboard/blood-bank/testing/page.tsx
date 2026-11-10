"use client";

import { useState } from "react";
import { Syringe } from "lucide-react";
import { fetchTestingQueue } from "@/api/slices";
import {
  BASE, Empty, Header, Loader, Page, Pill, Pills, RowLink, SectionCard,
  ENUMS, fmtDateTime, label, nameOf, useBB, useLoad,
} from "@/components/blood-bank/bb-ui";

export default function TestingQueuePage() {
  const bb = useBB();
  const [status, setStatus] = useState("queue");
  const { data, loading } = useLoad<any[]>(bb, (f) => fetchTestingQueue({ facilityId: f, status: status === "queue" ? undefined : status, limit: 200 }), [status]);
  const rows = data || [];

  return (
    <Page>
      <Header icon={<Syringe size={22} />} title="TTI Testing" subtitle={bb.activeFacility?.name} />
      <SectionCard title="Transfusion-transmissible infection screening" count={rows.length}>
        <Pills
          value={status}
          onChange={setStatus}
          options={[{ value: "queue", label: "Work queue" }, ...ENUMS.ttiStatuses.map((s) => ({ value: s, label: label(s) }))]}
        />
        {loading && !data ? (
          <Loader />
        ) : rows.length === 0 ? (
          <Empty>{status === "queue" ? "No donations are waiting for TTI results." : "Nothing in this status."}</Empty>
        ) : (
          <div className="space-y-3">
            {rows.map((d) => (
              <RowLink key={d._id} href={`${BASE}/testing/${d._id}`}>
                <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">{nameOf(d.donor)}</p>
                    <p className="font-mono text-xs opacity-50">{d.donationNumber}</p>
                  </div>
                  <p className="text-xs opacity-60">Collected {fmtDateTime(d.collectedAt)}</p>
                  <p className="text-xs opacity-60">
                    {d.missingTests?.length ? `Missing: ${d.missingTests.map(label).join(", ")}` : "All required tests recorded"}
                  </p>
                  <Pill value={d.tti?.status} />
                </div>
              </RowLink>
            ))}
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
