"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "@/components/access/guarded-link";
import { FlaskConical } from "lucide-react";
import { fetchErActive } from "@/api/slices";
import {
  BASE, Card, Empty, Header, Loader, Page, SearchBox, SectionCard, TriageBadge, WaitChip, ErPill,
  refId, regMeta, regName, sortByPriority, useAutoRefresh, useER, useTick,
} from "@/components/emergency/er-ui";

export default function OrdersPage() {
  const { facilityId, act, emergency, activeFacility, ui } = useER();
  const [q, setQ] = useState("");
  useTick();
  const load = useCallback(() => { if (facilityId) act(fetchErActive({ facilityId }), false); }, [facilityId, act]);
  useAutoRefresh(load, !!facilityId, 30000);

  const rows = useMemo(
    () => sortByPriority(emergency.active).filter((r) => !q.trim() || regName(r).toLowerCase().includes(q.toLowerCase()) || r.chiefComplaint.toLowerCase().includes(q.toLowerCase())),
    [emergency.active, q],
  );
  const chip = "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all hover:opacity-80";

  return (
    <Page>
      <Header icon={<FlaskConical size={22} />} title="Emergency Orders" subtitle={activeFacility?.name} />
      <Card className="text-sm opacity-80">
        Orders are STAT by default and flow into the Laboratory, Radiology and Pharmacy queues like any other request.
        Unidentified patients must be linked to a patient record before tests can be ordered.
      </Card>
      <SectionCard title="Active patients" count={rows.length}>
        <SearchBox value={q} onChange={setQ} placeholder="Search name or complaint…" />
        {emergency.listLoading && !emergency.active.length ? <Loader /> : rows.length === 0 ? <Empty>No active patients.</Empty> : (
          <div className="space-y-3">
            {rows.map((r) => {
              const identified = !!refId(r.patient);
              return (
                <div key={r._id} className="flex flex-wrap items-center gap-4 rounded-2xl p-4" style={{ backgroundColor: ui.inner }}>
                  <TriageBadge category={r.triageCategory} size="md" />
                  <Link href={`${BASE}/tracker/${r._id}`} className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{regName(r)}</p>
                    <p className="truncate text-xs opacity-55">{regMeta(r)} {r.chiefComplaint}</p>
                  </Link>
                  <WaitChip r={r} />
                  <ErPill value={r.status} />
                  {identified ? (
                    <div className="flex flex-wrap gap-1.5">
                      <Link href={`${BASE}/orders/lab?registrationId=${r._id}`} className={chip} style={{ backgroundColor: ui.card }}>Labs</Link>
                      <Link href={`${BASE}/orders/imaging?registrationId=${r._id}`} className={chip} style={{ backgroundColor: ui.card }}>Imaging</Link>
                      <Link href={`/dashboard/pharmacy/prescriptions/new?patients=${encodeURIComponent(refId(r.patient))}`} className={chip} style={{ backgroundColor: ui.card }}>Prescribe</Link>
                    </div>
                  ) : (
                    <span className="text-[11px] opacity-50">Link a patient record to order</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
