"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { fetchReactions } from "@/api/slices";
import { CustomDropdown } from "@/components/ui/items";
import {
  BASE, Btn, Empty, ENUMS, Header, Loader, Page, Pill, Pills, PRODUCT_LABEL, RowLink, SectionCard, fmtDateTime, label, nameOf, toOpts, useBB,
} from "@/components/blood-bank/bb-ui";

export default function ReactionsPage() {
  const { facilityId, act, bloodBank, activeFacility, ui, isDark, colors } = useBB();
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [type, setType] = useState("");
  useEffect(() => {
    if (facilityId) act(fetchReactions({ facilityId, status: status === "all" ? undefined : status, severity: severity === "all" ? undefined : severity, type: type || undefined, limit: 200 }), false);
  }, [facilityId, act, status, severity, type]);
  const rows = bloodBank.reactions;
  return (
    <Page>
      <Header icon={<AlertTriangle size={22} />} title="Transfusion Reactions" subtitle={activeFacility?.name} actions={<Btn href={`${BASE}/reactions/new`}><Plus size={16} /> Report reaction</Btn>} />
      <SectionCard title="Reactions" count={rows.length}>
        <div className="w-60"><CustomDropdown value={type} options={[{ label: "All types", value: "" }, ...toOpts(ENUMS.reactionTypes)]} onChange={setType} placeholder="Type" isDark={isDark} colors={colors} border={ui.border} /></div>
        <Pills value={status} onChange={setStatus} options={[{ value: "all", label: "Any status" }, ...ENUMS.reactionStatuses.map((s) => ({ value: s, label: label(s) }))]} />
        <Pills value={severity} onChange={setSeverity} options={[{ value: "all", label: "Any severity" }, ...ENUMS.severities.map((s) => ({ value: s, label: label(s) }))]} />
        {bloodBank.listLoading && rows.length === 0 ? <Loader /> : rows.length === 0 ? <Empty>No reactions reported.</Empty> : (
          <div className="space-y-3">
            {rows.map((r: any) => (
              <RowLink key={r._id} href={`${BASE}/reactions/${r._id}`}>
                <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{nameOf(r.patient)}</p><p className="font-mono text-xs opacity-50">{r.reactionNumber}</p></div>
                  <p className="text-xs opacity-60"><span className="font-mono">{r.unitNumber}</span> · {PRODUCT_LABEL[r.product]}<br />{fmtDateTime(r.reportedAt)}</p>
                  <p className="text-sm">{label(r.type)}</p>
                  <div className="flex gap-2"><Pill value={r.severity} /><Pill value={r.status} /></div>
                </div>
              </RowLink>
            ))}
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
