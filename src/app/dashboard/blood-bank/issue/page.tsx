"use client";

import { useEffect, useState } from "react";
import { Plus, Send } from "lucide-react";
import { fetchIssues } from "@/api/slices";
import {
  BASE, Btn, ENUMS, Empty, GroupBadge, Header, Loader, Page, Pill, Pills, PRODUCT_LABEL, RowLink, SectionCard,
  fmtDateTime, label, nameOf, useBB,
} from "@/components/blood-bank/bb-ui";

export default function IssuePage() {
  const { facilityId, act, bloodBank, activeFacility } = useBB();
  const [status, setStatus] = useState("all");
  useEffect(() => {
    if (!facilityId) return;
    act(fetchIssues({ facilityId, status: status === "all" || status === "retro" ? undefined : status, retrospectivePending: status === "retro" || undefined, limit: 200 }), false);
  }, [facilityId, act, status]);
  const rows = bloodBank.issues;
  return (
    <Page>
      <Header icon={<Send size={22} />} title="Issue & Dispatch" subtitle={activeFacility?.name} actions={<Btn href={`${BASE}/issue/new`}><Plus size={16} /> Issue unit</Btn>} />
      <SectionCard title="Issues" count={rows.length}>
        <Pills value={status} onChange={setStatus} options={[{ value: "all", label: "All" }, ...ENUMS.issueStatuses.map((s) => ({ value: s, label: label(s) })), { value: "retro", label: "Retro crossmatch pending" }]} />
        {bloodBank.listLoading && rows.length === 0 ? <Loader /> : rows.length === 0 ? <Empty>No issues found.</Empty> : (
          <div className="space-y-3">
            {rows.map((i: any) => (
              <RowLink key={i._id} href={`${BASE}/issue/${i._id}`}>
                <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">{nameOf(i.patient)}</p>
                    <p className="font-mono text-xs opacity-50">{i.issueNumber}</p>
                  </div>
                  <div className="flex items-center gap-2"><GroupBadge group={i.bloodGroup} size="sm" /><div className="text-xs"><p className="font-mono">{i.unitNumber}</p><p className="opacity-55">{PRODUCT_LABEL[i.product]}</p></div></div>
                  <p className="text-xs opacity-60">To {i.issuedTo}{i.destination ? ` · ${i.destination}` : ""}<br />{fmtDateTime(i.issuedAt)}</p>
                  <div className="flex items-center gap-2">
                    {i.emergency && <Pill value="emergency" />}
                    {i.retrospectiveCrossmatch?.required && !i.retrospectiveCrossmatch.done && <Pill tone="warn">Retro XM due</Pill>}
                    <Pill value={i.status} />
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
