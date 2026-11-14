"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "@/components/access/guarded-link";
import { fetchErDispatch, updateErDispatchStatus } from "@/api/slices";
import type { ErDispatch } from "@/api/slices/emergencySlice";
import {
  BASE, BackHeader, Btn, Card, DISPATCH_NEXT, ER, ErPill, KV, KVGrid, Loader, NotFound, Page, TriageBadge,
  erLabel, fmtDateTime, fmtMins, minsSince, regName, useAutoRefresh, useConfirm, useER, useLoad, useTick,
} from "@/components/emergency/er-ui";

export default function DispatchDetailPage() {
  const { dispatchId } = useParams() as { dispatchId: string };
  const er = useER();
  const { facilityId, act, emergency } = er;
  const { ask, node } = useConfirm();
  useTick();
  const { data: d, loading, reload } = useLoad<ErDispatch>(er, (fid) => fetchErDispatch({ facilityId: fid, dispatchId }), [dispatchId]);
  const refresh = useCallback(() => reload(true), [reload]);
  useAutoRefresh(refresh, !!facilityId && !!d && ER.openDispatch.includes(d.status), 20000);

  if (loading) return <Page><Loader text="Loading call…" /></Page>;
  if (!d) return <Page><NotFound what="Ambulance call" href={`${BASE}/ambulance`} /></Page>;

  const open = ER.openDispatch.includes(d.status);
  const next = DISPATCH_NEXT[d.status];
  const linked = d.linkedRegistration && typeof d.linkedRegistration !== "string" ? d.linkedRegistration : null;
  const move = (to: ErDispatch["status"], title: string, message: string, tone: "primary" | "danger" = "primary") =>
    ask({
      title, message, confirmLabel: title, tone,
      onConfirm: async () => { if (await act(updateErDispatchStatus({ facilityId, dispatchId, status: to }))) reload(true); },
    });

  const steps = [
    ["Call received", d.callReceivedAt],
    ["Dispatched", d.dispatchedAt],
    ["Arrived on scene", d.arrivedAtScene],
    ["Arrived at hospital", d.arrivedAtHospital],
  ] as const;

  return (
    <Page>
      <BackHeader
        href={`${BASE}/ambulance`}
        title={d.pickupAddress}
        subtitle={`${d.vehicle || "No vehicle assigned"}${d.callerName ? ` · caller ${d.callerName}` : ""}`}
        right={
          <>
            {open && <Btn href={`${BASE}/ambulance/${dispatchId}/edit`} tone="ghost">Edit / assign</Btn>}
            {next && <Btn disabled={emergency.saving} onClick={() => move(next.to, next.cta, next.confirm)}>{next.cta}</Btn>}
            {open && <Btn tone="danger" onClick={() => move("cancelled", "Cancel call", "Cancel this ambulance call? This cannot be undone.", "danger")}>Cancel</Btn>}
          </>
        }
      />

      {d.status === "requested" && !d.vehicle && (
        <p className="rounded-2xl p-4 text-sm font-medium" style={{ backgroundColor: "#f59e0b1f", color: "#d97706" }}>
          Assign a vehicle and crew before dispatching. <Link href={`${BASE}/ambulance/${dispatchId}/edit`} className="underline">Assign now</Link>
        </p>
      )}

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <ErPill value={d.status} /><ErPill value={d.priority} />
          {open && <span className="text-sm opacity-65">Open for {fmtMins(minsSince(d.callReceivedAt))}</span>}
        </div>
        {d.chiefComplaint && <p className="text-base">{d.chiefComplaint}</p>}
        <KVGrid>
          <KV label="Caller">{[d.callerName, d.callerPhone].filter(Boolean).join(" · ")}</KV>
          <KV label="Destination">{d.destination}</KV>
          <KV label="Crew">{d.crew?.join(", ")}</KV>
        </KVGrid>
        {d.notes && <KV label="Notes"><p className="whitespace-pre-wrap">{d.notes}</p></KV>}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Timeline</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([label, at]) => (
            <div key={label} className="rounded-2xl p-4" style={{ backgroundColor: "rgba(128,128,128,0.1)", opacity: at ? 1 : 0.5 }}>
              <p className="text-[10px] font-medium uppercase tracking-wider opacity-60">{label}</p>
              <p className="mt-1 text-sm font-semibold">{at ? fmtDateTime(at) : "Pending"}</p>
              {at && label !== "Call received" && <p className="text-[11px] opacity-55">+{fmtMins(minsSince(d.callReceivedAt, at))}</p>}
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Patient</h2>
        {linked ? (
          <Link href={`${BASE}/tracker/${linked._id}`} className="flex flex-wrap items-center gap-4 rounded-2xl p-4" style={{ backgroundColor: "rgba(128,128,128,0.1)" }}>
            <TriageBadge category={linked.triageCategory} size="md" />
            <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{regName(linked)}</span><span className="block truncate text-xs opacity-60">{linked.chiefComplaint}</span></span>
            <ErPill value={linked.status} />
          </Link>
        ) : typeof d.linkedRegistration === "string" ? (
          <Link href={`${BASE}/tracker/${d.linkedRegistration}`} className="text-sm underline">Open linked ER visit</Link>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm opacity-65">Not linked to an ER visit yet.</p>
            {d.status !== "cancelled" && <Btn href={`${BASE}/register?dispatchId=${dispatchId}`}>Register arrival</Btn>}
          </div>
        )}
      </Card>
      {node}
    </Page>
  );
}
