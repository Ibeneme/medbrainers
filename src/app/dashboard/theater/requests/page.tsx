"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { fetchSurgeryRequests } from "@/api/slices/theaterSlice";
import {
  Btn,
  Empty,
  Header,
  Loader,
  Page,
  Pill,
  Pills,
  RowLink,
  SearchBox,
  SectionCard,
  TBASE,
  TH,
  fmtDate,
  label,
  nameOf,
  patientLabel,
  useTH,
} from "@/components/theater/th-ui";

export default function SurgeryRequestsPage() {
  const { facilityId, act, theater, activeFacility } = useTH();
  const [status, setStatus] = useState("requested");
  const [priority, setPriority] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (facilityId)
      act(
        fetchSurgeryRequests({
          facilityId,
          status: status === "all" ? undefined : status,
        }),
        false
      );
  }, [facilityId, act, status]);

  const rows = useMemo(
    () =>
      theater.requests.filter(
        (r) =>
          (priority === "all" || r.priority === priority) &&
          (!q.trim() ||
            patientLabel(r.patient).toLowerCase().includes(q.toLowerCase()) ||
            r.procedureName.toLowerCase().includes(q.toLowerCase()) ||
            String((r.patient as any)?.mrn || "")
              .toLowerCase()
              .includes(q.toLowerCase()))
      ),
    [theater.requests, priority, q]
  );

  return (
    <Page>
      <Header
        icon={<ClipboardList size={22} />}
        title="Surgery Requests"
        subtitle={activeFacility?.name}
        actions={
          <Btn href={`${TBASE}/requests/new`}>
            <Plus size={16} /> New request
          </Btn>
        }
      />
      <>
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="Search patient, MRN or procedure…"
        />
        <Pills
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All" },
            ...TH.requestStatuses.map((s) => ({ value: s, label: label(s) })),
          ]}
        />
        <Pills
          value={priority}
          onChange={setPriority}
          options={[
            { value: "all", label: "Any priority" },
            ...TH.priorities.map((s) => ({ value: s, label: label(s) })),
          ]}
        />
        {theater.listLoading && rows.length === 0 ? (
          <Loader />
        ) : rows.length === 0 ? (
          <Empty>No surgery requests found.</Empty>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <RowLink key={r._id} href={`${TBASE}/requests/${r._id}`}>
                <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">
                      {patientLabel(r.patient)}
                    </p>
                    <p className="font-mono text-xs opacity-50">
                      {(r.patient as any)?.mrn}
                    </p>
                  </div>
                  <div className="min-w-0 text-xs opacity-70">
                    <p className="truncate font-medium">{r.procedureName}</p>
                    <p className="truncate opacity-70">{r.diagnosis}</p>
                  </div>
                  <p className="text-xs opacity-60">
                    Preferred {fmtDate(r.preferredDate)}
                    <br />
                    By {nameOf(r.requestedBy)}
                  </p>
                  <div className="flex items-center gap-2">
                    <Pill value={r.priority} />
                    <Pill value={r.status} />
                  </div>
                </div>
              </RowLink>
            ))}
          </div>
        )}
      </>
    </Page>
  );
}
