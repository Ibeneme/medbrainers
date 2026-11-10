"use client";

import { useEffect, useState } from "react";
import { GitCompare, Plus } from "lucide-react";
import { fetchCrossmatches } from "@/api/slices";
import {
  BASE, Btn, ENUMS, Empty, GroupBadge, Header, Loader, Page, Pill, Pills, PRODUCT_LABEL, RowLink, SectionCard,
  fmtDateTime, label, nameOf, useBB,
} from "@/components/blood-bank/bb-ui";

export default function CrossmatchPage() {
  const { facilityId, act, bloodBank, activeFacility } = useBB();
  const [status, setStatus] = useState("active");
  useEffect(() => {
    if (facilityId) act(fetchCrossmatches({ facilityId, status: status === "all" ? undefined : status, limit: 200 }), false);
  }, [facilityId, act, status]);
  const rows = bloodBank.crossmatches;
  return (
    <Page>
      <Header icon={<GitCompare size={22} />} title="Crossmatching" subtitle={activeFacility?.name} actions={<Btn href={`${BASE}/crossmatch/new`}><Plus size={16} /> New crossmatch</Btn>} />
      <SectionCard title="Crossmatches" count={rows.length}>
        <Pills value={status} onChange={setStatus} options={[{ value: "all", label: "All" }, ...ENUMS.crossmatchStatuses.map((s) => ({ value: s, label: label(s) }))]} />
        {bloodBank.listLoading && rows.length === 0 ? <Loader /> : rows.length === 0 ? <Empty>No crossmatches found.</Empty> : (
          <div className="space-y-3">
            {rows.map((x: any) => (
              <RowLink key={x._id} href={`${BASE}/crossmatch/${x._id}`}>
                <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">{nameOf(x.patient)}</p>
                    <p className="font-mono text-xs opacity-50">{x.crossmatchNumber} · {x.request?.requestNumber}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs opacity-70"><GroupBadge group={x.patientGroup} size="sm" />→<GroupBadge group={x.unitGroup} size="sm" /><span className="font-mono">{x.unitNumber}</span></div>
                  <p className="text-xs opacity-60">{PRODUCT_LABEL[x.product]} · {label(x.method)}<br />Valid until {fmtDateTime(x.validUntil)}</p>
                  <div className="flex items-center gap-2"><Pill value={x.result} /><Pill value={x.status} /></div>
                </div>
              </RowLink>
            ))}
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
