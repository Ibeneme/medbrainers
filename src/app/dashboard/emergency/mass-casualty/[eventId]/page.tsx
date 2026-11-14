"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "@/components/access/guarded-link";
import { fetchErMassCasualtyById, updateErMassCasualty } from "@/api/slices";
import type { ErMassCasualty, ErMassCasualtyStatus } from "@/api/slices/emergencySlice";
import {
  BASE, BackHeader, Bar, Btn, Card, ErPill, KV, KVGrid, Loader, NotFound, Page, Stat, TRIAGE, TRIAGE_ORDER,
  fmtDateTime, fmtMins, minsSince, useAutoRefresh, useConfirm, useER, useLoad, useTick,
} from "@/components/emergency/er-ui";

export default function MassCasualtyBoardPage() {
  const { eventId } = useParams() as { eventId: string };
  const er = useER();
  const { facilityId, act, emergency } = er;
  const { ask, node } = useConfirm();
  useTick();
  const { data: e, loading, reload } = useLoad<ErMassCasualty>(er, (fid) => fetchErMassCasualtyById({ facilityId: fid, eventId }), [eventId]);
  const refresh = useCallback(() => reload(true), [reload]);
  useAutoRefresh(refresh, !!facilityId && e?.status === "active", 15000);

  if (loading) return <Page><Loader text="Loading event…" /></Page>;
  if (!e) return <Page><NotFound what="Event" href={`${BASE}/mass-casualty`} /></Page>;

  const s = e.summary;
  const live = e.status === "active";
  const expected = e.expectedCasualties || 0;
  const change = (status: ErMassCasualtyStatus, title: string, message: string, tone: "primary" | "danger" = "primary") =>
    ask({ title, message, confirmLabel: title, tone, onConfirm: async () => { if (await act(updateErMassCasualty({ facilityId, eventId, status }))) reload(true); } });

  return (
    <Page>
      <BackHeader
        href={`${BASE}/mass-casualty`}
        title={e.name}
        subtitle={`Started ${fmtDateTime(e.startedAt)}${e.endedAt ? ` · ended ${fmtDateTime(e.endedAt)}` : ` · running ${fmtMins(minsSince(e.startedAt))}`}`}
        right={
          <>
            {live && <Btn tone="ghost" disabled={emergency.saving} onClick={() => change("stand-down", "Stand down", "Stand the department down? Arrivals will no longer be counted against this event.")}>Stand down</Btn>}
            {e.status === "stand-down" && <Btn tone="ghost" disabled={emergency.saving} onClick={() => change("active", "Reactivate", "Reactivate mass-casualty mode for this event?", "danger")}>Reactivate</Btn>}
            {e.status !== "closed" && <Btn tone={live ? "danger" : "primary"} disabled={emergency.saving} onClick={() => change("closed", "Close event", "Close this event permanently? A closed event cannot be reopened.", "danger")}>Close event</Btn>}
          </>
        }
      />

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-3"><ErPill value={e.status} />{expected > 0 && s && <span className="text-sm opacity-65">{s.arrivals} of {expected} expected casualties have arrived</span>}</div>
        {expected > 0 && s && <Bar pct={Math.round((s.arrivals / expected) * 100)} danger={s.arrivals > expected} />}
        {e.description && <p className="whitespace-pre-wrap text-sm opacity-80">{e.description}</p>}
        {e.notes && <KVGrid cols={2}><KV label="Notes">{e.notes}</KV></KVGrid>}
      </Card>

      {s && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Casualties arrived" value={s.arrivals} sub="since the event began" />
            <Stat label="Still in department" value={s.stillInDepartment} sub="not yet dispositioned" href={`${BASE}/tracker`} />
            <Stat label="Untriaged" value={s.byTriage.untriaged || 0} sub="need triage now" tone={s.byTriage.untriaged ? "bad" : undefined} href={`${BASE}/triage`} />
            <Stat label="Red / immediate" value={s.byTriage.red || 0} sub="highest priority" tone={s.byTriage.red ? "bad" : undefined} href={`${BASE}/resus`} />
          </div>
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Casualties by triage category</h2>
            <div className="space-y-3">
              {TRIAGE_ORDER.map((k) => (
                <Link key={k} href={`${BASE}/tracker?triage=${k}`} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 text-xs">
                  <span className="font-semibold capitalize" style={{ color: TRIAGE[k].color }}>{k} · {TRIAGE[k].label}</span>
                  <div className="h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(128,128,128,0.15)" }}><div className="h-full rounded-full" style={{ width: `${s.arrivals ? ((s.byTriage[k] || 0) / s.arrivals) * 100 : 0}%`, backgroundColor: TRIAGE[k].color }} /></div>
                  <span className="font-semibold">{s.byTriage[k] || 0}</span>
                </Link>
              ))}
            </div>
          </Card>
        </>
      )}
      <div className="flex flex-wrap gap-2.5"><Btn href={`${BASE}/register`}>Register arrival</Btn><Btn href={`${BASE}/triage`} tone="ghost">Triage board</Btn></div>
      {node}
    </Page>
  );
}
