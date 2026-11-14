"use client";

import { useEffect, useState } from "react";
import { Plus, Snowflake } from "lucide-react";
import Link from "@/components/access/guarded-link";
import { fetchStorage } from "@/api/slices";
import {
  BASE, Bar, Btn, Empty, Header, Loader, Page, Pill, Pills, SectionCard, fmtDateTime, label, useBB,
} from "@/components/blood-bank/bb-ui";

export default function StoragePage() {
  const { facilityId, act, bloodBank, activeFacility, ui } = useBB();
  const [inactive, setInactive] = useState(false);

  useEffect(() => {
    if (!facilityId) return;
    act(fetchStorage({ facilityId, includeInactive: inactive || undefined }), false);
    const t = setInterval(() => act(fetchStorage({ facilityId, includeInactive: inactive || undefined }), false), 60000);
    return () => clearInterval(t);
  }, [facilityId, act, inactive]);

  const list = bloodBank.storage;

  return (
    <Page>
      <Header
        icon={<Snowflake size={22} />}
        title="Storage & Cold Chain"
        subtitle={activeFacility?.name}
        actions={<Btn href={`${BASE}/storage/new`}><Plus size={16} /> Add storage unit</Btn>}
      />
      <SectionCard title="Storage units" count={list.length} right={<Pills value={inactive ? "all" : "active"} onChange={(v) => setInactive(v === "all")} options={[{ value: "active", label: "Active" }, { value: "all", label: "Include inactive" }]} />}>
        {bloodBank.listLoading && list.length === 0 ? (
          <Loader />
        ) : list.length === 0 ? (
          <Empty>No storage units yet. Add your first fridge or freezer.</Empty>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((s) => {
              const t = s.lastTemperature;
              return (
                <Link
                  key={s._id}
                  href={`${BASE}/storage/${s._id}`}
                  className="space-y-4 rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                  style={{ backgroundColor: ui.inner, border: s.alarm ? "1px solid #ef444466" : undefined }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">{s.name}</p>
                      <p className="text-xs opacity-55"><span className="font-mono uppercase">{s.code}</span> · {label(s.type)}{s.location ? ` · ${s.location}` : ""}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Pill value={s.status} />
                      {s.alarm && <Pill value="reactive">Alarm</Pill>}
                      {s.readingOverdue && !s.alarm && <Pill tone="warn">Reading due</Pill>}
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-semibold tracking-tight" style={t && !t.inRange ? { color: "#ef4444" } : undefined}>
                        {t ? `${t.valueC}°C` : "—"}
                      </p>
                      <p className="text-[11px] opacity-50">{t ? fmtDateTime(t.at) : "No readings yet"}</p>
                    </div>
                    <p className="text-xs opacity-60">Range {s.minTempC}° to {s.maxTempC}°C</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs opacity-60"><span>{s.unitsStored ?? 0} / {s.capacity} units</span><span>{s.capacity ? Math.round(((s.unitsStored ?? 0) / s.capacity) * 100) : 0}%</span></div>
                    <Bar pct={s.capacity ? ((s.unitsStored ?? 0) / s.capacity) * 100 : 0} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </SectionCard>
    </Page>
  );
}
