"use client";

import type { AntenatalRecord } from "@/api/slices/maternitySlice";
import {
  Avatar, BASE, Flag, MPill, PatientCell, RowLink, daysToEdd, fmtDate, gaLabel, gestationDays, nameOf, trimester,
} from "@/components/maternity/mat-ui";

/** One pregnancy in a list. Links to the ANC record. */
export function AncRow({ r, showFactors }: { r: AntenatalRecord; showFactors?: boolean }) {
  const active = r.status === "active";
  const days = active ? gestationDays(r) : undefined;
  const toEdd = active ? daysToEdd(r.edd) : undefined;
  return (
    <RowLink href={`${BASE}/anc/${r._id}`}>
      <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div className="flex min-w-0 items-center gap-3.5">
          <Avatar name={nameOf(r.patient)} />
          <PatientCell p={r.patient} sub={r.registrationNo ? ` · ${r.registrationNo}` : ""} />
        </div>
        <div className="text-xs opacity-70">
          <p className="font-semibold">
            G{r.gravida} P{r.para}
            {r.abortions ? ` A${r.abortions}` : ""}
          </p>
          <p>{days !== undefined ? `${gaLabel(days)} · trimester ${trimester(days)}` : "—"}</p>
        </div>
        <div className="text-xs opacity-70">
          <p>EDD {fmtDate(r.edd)}</p>
          {toEdd !== undefined && (
            <p>
              {toEdd < 0 ? <Flag tone="bad">Post-dates by {-toEdd} d</Flag> : toEdd <= 14 ? <Flag tone="warn">{toEdd} d to go</Flag> : `${toEdd} d to go`}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <MPill value={r.riskLevel} />
          <MPill value={r.status} />
        </div>
      </div>
      {showFactors && r.riskFactors?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {r.riskFactors.map((f) => (
            <span key={f} className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-red-500">
              {f}
            </span>
          ))}
        </div>
      )}
    </RowLink>
  );
}
