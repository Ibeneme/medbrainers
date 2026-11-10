"use client";

import { useEffect } from "react";
import { Plus, Siren } from "lucide-react";
import { fetchErMassCasualty } from "@/api/slices";
import { BASE, Banner, Btn, Empty, ErPill, Header, Loader, Page, RowLink, SectionCard, fmtDateTime, fmtMins, minsSince, useER } from "@/components/emergency/er-ui";

export default function MassCasualtyListPage() {
  const { facilityId, act, emergency, activeFacility } = useER();
  useEffect(() => { if (facilityId) act(fetchErMassCasualty({ facilityId }), false); }, [facilityId, act]);
  const live = emergency.massCasualty.find((e) => e.status === "active");

  return (
    <Page>
      <Header icon={<Siren size={22} />} title="Mass-Casualty Mode" subtitle={activeFacility?.name} actions={!live && <Btn tone="danger" href={`${BASE}/mass-casualty/new`}><Plus size={16} /> Activate</Btn>} />
      {live && <Banner tone="bad" href={`${BASE}/mass-casualty/${live._id}`} cta="Open board"><Siren size={18} className="text-red-500" />Active now: {live.name} · running {fmtMins(minsSince(live.startedAt))}</Banner>}
      <SectionCard title="Events" count={emergency.massCasualty.length}>
        {emergency.listLoading && !emergency.massCasualty.length ? <Loader /> : emergency.massCasualty.length === 0 ? <Empty>No mass-casualty events recorded.</Empty> : (
          <div className="space-y-3">
            {emergency.massCasualty.map((e) => (
              <RowLink key={e._id} href={`${BASE}/mass-casualty/${e._id}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">{e.name}</p>
                    <p className="truncate text-xs opacity-55">{fmtDateTime(e.startedAt)}{e.endedAt ? ` → ${fmtDateTime(e.endedAt)}` : ""}{e.expectedCasualties ? ` · expecting ${e.expectedCasualties}` : ""}</p>
                  </div>
                  <ErPill value={e.status} />
                </div>
              </RowLink>
            ))}
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
