"use client";

import { useCallback } from "react";
import Link from "@/components/access/guarded-link";
import { HeartPulse } from "lucide-react";
import { fetchErActive } from "@/api/slices";
import {
  BASE, Banner, Btn, Empty, ErPill, Header, Loader, Page, SectionCard, TriageBadge, WaitChip,
  erLabel, minsSince, fmtMins, nameOf, regMeta, regName, sortByPriority, useAutoRefresh, useER, useTick,
} from "@/components/emergency/er-ui";

export default function ResusBayPage() {
  const { facilityId, act, emergency, activeFacility, ui, softShadow } = useER();
  useTick(15000);
  const load = useCallback(() => { if (facilityId) act(fetchErActive({ facilityId }), false); }, [facilityId, act]);
  useAutoRefresh(load, !!facilityId, 15000);

  const inResus = sortByPriority(emergency.active.filter((r) => r.status === "in-resus"));
  const untriaged = emergency.active.filter((r) => !r.triageCategory).length;

  return (
    <Page>
      <Header icon={<HeartPulse size={22} />} title="Resuscitation Bay" subtitle={activeFacility?.name} actions={<Btn href={`${BASE}/register`} tone="card">Register arrival</Btn>} />
      {untriaged > 0 && (
        <Banner tone="warn" href={`${BASE}/triage`} cta="Triage">
          {untriaged} arrival{untriaged === 1 ? "" : "s"} not yet triaged. A red patient is sent here automatically.
        </Banner>
      )}
      <SectionCard title="In resus now" count={inResus.length}>
        {emergency.listLoading && !emergency.active.length ? <Loader text="Loading resus bay…" /> : inResus.length === 0 ? (
          <Empty>The resuscitation bay is empty.</Empty>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {inResus.map((r) => (
              <div key={r._id} className="space-y-4 rounded-3xl p-5" style={{ backgroundColor: ui.inner, boxShadow: softShadow, borderLeft: "5px solid #dc2626" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">{regName(r)}</p>
                    <p className="truncate text-xs opacity-55">{regMeta(r)}</p>
                  </div>
                  <TriageBadge category={r.triageCategory} size="md" />
                </div>
                <p className="text-sm opacity-80">{r.chiefComplaint}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-70">
                  <span>{r.location || "Bay not set"}</span>
                  <span>In ED {fmtMins(minsSince(r.arrivalTime))}</span>
                  <span>{r.attendingClinician ? `Dr ${nameOf(r.attendingClinician)}` : "No clinician assigned"}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Btn href={`${BASE}/tracker/${r._id}`}>Open</Btn>
                  <Btn href={`${BASE}/tracker/${r._id}/status`} tone="ghost">Move / assign</Btn>
                  <Btn href={`${BASE}/trauma/new?registrationId=${r._id}`} tone="ghost">Trauma</Btn>
                  <Btn href={`${BASE}/orders/lab?registrationId=${r._id}`} tone="ghost">STAT labs</Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
