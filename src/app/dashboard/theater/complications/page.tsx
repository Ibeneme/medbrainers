"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { fetchComplications } from "@/api/slices/theaterSlice";
import {
  Btn,
  Empty,
  Header,
  Loader,
  Page,
  Pill,
  Pills,
  RowLink,
  SectionCard,
  TBASE,
  TH,
  fmtDateTime,
  label,
  patientLabel,
  useTH,
} from "@/components/theater/th-ui";

export default function ComplicationsPage() {
  const { facilityId, act, theater, activeFacility } = useTH();
  const [sev, setSev] = useState("all");
  useEffect(() => {
    if (facilityId) act(fetchComplications({ facilityId }), false);
  }, [facilityId, act]);
  const rows = theater.complications.filter(
    (c) => sev === "all" || c.severity === sev
  );
  return (
    <Page>
      <Header
        icon={<AlertTriangle size={22} />}
        title="Surgical Complications"
        subtitle={activeFacility?.name}
        actions={
          <Btn href={`${TBASE}/complications/new`}>
            <Plus size={16} /> Report complication
          </Btn>
        }
      />
      <>
        <Pills
          value={sev}
          onChange={setSev}
          options={[
            { value: "all", label: "Any severity" },
            ...TH.severities.map((s) => ({ value: s, label: label(s) })),
          ]}
        />
        {theater.listLoading && rows.length === 0 ? (
          <Loader />
        ) : rows.length === 0 ? (
          <Empty>No complications recorded.</Empty>
        ) : (
          <div className="space-y-3">
            {rows.map((c) => (
              <RowLink
                key={c._id}
                href={`${TBASE}/schedule/${
                  typeof c.theatreCase === "object"
                    ? (c.theatreCase as any)._id
                    : c.theatreCase
                }`}
              >
                <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto]">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">
                      {patientLabel(c.patient)}
                    </p>
                    <p className="text-xs opacity-55">
                      {fmtDateTime(c.occurredAt)}
                    </p>
                  </div>
                  <div className="min-w-0 text-xs opacity-70">
                    <p className="truncate font-medium">{c.description}</p>
                    <p className="truncate opacity-70">
                      {c.actionTaken ? `Action: ${c.actionTaken}` : ""}
                    </p>
                  </div>
                  {c.severity ? (
                    <Pill value={c.severity} />
                  ) : (
                    <Pill tone="mute">Unrated</Pill>
                  )}
                </div>
              </RowLink>
            ))}
          </div>
        )}
      </>
    </Page>
  );
}
