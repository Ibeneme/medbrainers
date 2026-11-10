"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity } from "lucide-react";
import { fetchTransfusions } from "@/api/slices";
import {
  BASE, Empty, ENUMS, GroupBadge, Header, Loader, Page, Pill, Pills, PRODUCT_LABEL, RowLink, SearchBox, SectionCard,
  fmtDateTime, fmtDuration, label, minutesBetween, nameOf, useBB,
} from "@/components/blood-bank/bb-ui";

export default function TransfusionsPage() {
  const { facilityId, act, bloodBank, activeFacility } = useBB();
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  useEffect(() => {
    if (!facilityId) return;
    const load = () => act(fetchTransfusions({ facilityId, status: status === "all" ? undefined : status, limit: 200 }), false);
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [facilityId, act, status]);
  const rows = useMemo(() => bloodBank.transfusions.filter((t: any) => !q.trim() || nameOf(t.patient).toLowerCase().includes(q.toLowerCase()) || t.transfusionNumber.toLowerCase().includes(q.toLowerCase()) || t.unitNumber.toLowerCase().includes(q.toLowerCase())), [bloodBank.transfusions, q]);
  return (
    <Page>
      <Header icon={<Activity size={22} />} title="Transfusions" subtitle={activeFacility?.name} />
      <SectionCard title="Transfusions" count={rows.length}>
        <SearchBox value={q} onChange={setQ} placeholder="Search patient, transfusion or unit no…" />
        <Pills value={status} onChange={setStatus} options={[{ value: "all", label: "All" }, ...ENUMS.transfusionStatuses.map((s) => ({ value: s, label: label(s) }))]} />
        {bloodBank.listLoading && rows.length === 0 ? <Loader /> : rows.length === 0 ? <Empty>No transfusions recorded. Start one from an issued unit.</Empty> : (
          <div className="space-y-3">
            {rows.map((t: any) => (
              <RowLink key={t._id} href={`${BASE}/transfusions/${t._id}`}>
                <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{nameOf(t.patient)}</p><p className="font-mono text-xs opacity-50">{t.transfusionNumber}</p></div>
                  <div className="flex items-center gap-2"><GroupBadge group={t.bloodGroup} size="sm" /><div className="text-xs"><p className="font-mono">{t.unitNumber}</p><p className="opacity-55">{PRODUCT_LABEL[t.product]}</p></div></div>
                  <p className="text-xs opacity-60">Started {fmtDateTime(t.startedAt)}<br />{t.status === "in_progress" ? `Running ${fmtDuration(minutesBetween(t.startedAt))}` : `Duration ${fmtDuration(t.durationMinutes)}`}</p>
                  <Pill value={t.status} />
                </div>
              </RowLink>
            ))}
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
