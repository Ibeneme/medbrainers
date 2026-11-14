"use client";

import { useCallback } from "react";
import Link from "@/components/access/guarded-link";
import { ListChecks, Plus } from "lucide-react";
import { fetchErActive } from "@/api/slices";
import {
  BASE, Btn, Empty, Header, Loader, Page, RegistrationRow, SectionCard, TRIAGE, TRIAGE_ORDER, TriageBadge, WaitChip,
  regName, sortByPriority, useAutoRefresh, useER, useTick,
} from "@/components/emergency/er-ui";

export default function TriageBoardPage() {
  const { facilityId, act, emergency, activeFacility, ui } = useER();
  useTick();
  const load = useCallback(() => { if (facilityId) act(fetchErActive({ facilityId }), false); }, [facilityId, act]);
  useAutoRefresh(load, !!facilityId);

  const rows = sortByPriority(emergency.active);
  const untriaged = rows.filter((r) => !r.triageCategory);

  return (
    <Page>
      <Header
        icon={<ListChecks size={22} />}
        title="Triage Board"
        subtitle={activeFacility?.name}
        actions={<Btn href={`${BASE}/register`}><Plus size={16} /> Register arrival</Btn>}
      />

      <SectionCard title="Awaiting triage" count={untriaged.length}>
        {emergency.listLoading && !rows.length ? (
          <Loader text="Loading patients…" />
        ) : untriaged.length === 0 ? (
          <Empty>Everyone has been triaged.</Empty>
        ) : (
          <div className="space-y-3">
            {untriaged.map((r) => (
              <RegistrationRow key={r._id} r={r} href={`${BASE}/triage/${r._id}`} action={<span className="rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ backgroundColor: "#dc2626" }}>Triage now</span>} />
            ))}
          </div>
        )}
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {TRIAGE_ORDER.map((k) => {
          const col = rows.filter((r) => r.triageCategory === k);
          const t = TRIAGE[k];
          return (
            <section key={k} className="space-y-3 rounded-3xl p-4" style={{ backgroundColor: ui.card, borderTop: `4px solid ${t.color}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold capitalize" style={{ color: t.color }}>{k} · {t.label}</p>
                  <p className="text-[10px] opacity-50">{t.targetMin ? `see within ${t.targetMin} min` : "immediate"}</p>
                </div>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: ui.inner }}>{col.length}</span>
              </div>
              {col.length === 0 ? (
                <p className="rounded-xl py-6 text-center text-xs opacity-40" style={{ backgroundColor: ui.inner }}>None</p>
              ) : (
                col.map((r) => (
                  <Link key={r._id} href={`${BASE}/tracker/${r._id}`} className="block space-y-1.5 rounded-2xl p-3 transition-all hover:opacity-90" style={{ backgroundColor: ui.inner }}>
                    <p className="truncate text-sm font-semibold">{regName(r)}</p>
                    <p className="line-clamp-2 text-[11px] opacity-65">{r.chiefComplaint}</p>
                    <div className="flex items-center justify-between gap-2">
                      <WaitChip r={r} />
                    </div>
                  </Link>
                ))
              )}
            </section>
          );
        })}
      </div>
    </Page>
  );
}
