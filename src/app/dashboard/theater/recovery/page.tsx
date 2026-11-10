"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { useAppDispatch } from "@/api/hooks";
import { fetchTheaterRecords } from "@/api/slices/theaterSlice";
import { Banner, Btn, Empty, Header, Loader, Page, Pill, RowLink, SectionCard, TBASE, fmtDateTime, fmtDuration, minutesBetween, nameOf, patientLabel, roomLabel, useSchedule } from "@/components/theater/th-ui";

export default function RecoveryPage() {
  const { facilityId, theater, activeFacility, cases } = useSchedule();
  const dispatch = useAppDispatch();
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!facilityId) return;
    setMissing(false);
    const load = () => dispatch(fetchTheaterRecords({ facilityId, kind: "recovery" })).unwrap().catch(() => setMissing(true));
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [facilityId, dispatch]);

  const records: any[] = theater.records.recovery || [];
  const active = records.filter((r) => !r.dischargedAt);
  const done = records.filter((r) => r.dischargedAt).slice(0, 20);
  const inTheatre = cases.filter((c) => c.status === "in-theatre");
  const recoveryCases = cases.filter((c) => c.status === "recovery");

  return (
    <Page>
      <Header icon={<Activity size={22} />} title="Recovery Room (PACU)" subtitle={activeFacility?.name} actions={<Btn href={`${TBASE}/recovery/new`}>Move patient to recovery</Btn>} />

      <>
        {inTheatre.length === 0 ? <Empty>No patients are currently in theatre.</Empty> : (
          <div className="space-y-3">
            {inTheatre.map((c) => (
              <RowLink key={c._id} href={`${TBASE}/recovery/new?caseId=${c._id}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{patientLabel(c.patient)}</p><p className="truncate text-xs opacity-55">{c.procedureName} · {roomLabel(c.room)}</p></div>
                  <Pill value={c.status} />
                </div>
              </RowLink>
            ))}
          </div>
        )}
      </>

      <>
        {missing ? (
          <>
            <Banner tone="info">Showing cases marked “recovery”. Add the optional read endpoints on the server to discharge from this page (server/theater-read-endpoints.patch.md).</Banner>
            {recoveryCases.length === 0 ? <Empty>No patients in recovery.</Empty> : (
              <div className="space-y-3">{recoveryCases.map((c) => (
                <RowLink key={c._id} href={`${TBASE}/schedule/${c._id}`}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[15px] font-semibold">{patientLabel(c.patient)}</p><p className="text-xs opacity-55">{c.procedureName}</p></div><Pill value="recovery" /></div></RowLink>
              ))}</div>
            )}
          </>
        ) : theater.listLoading && records.length === 0 ? <Loader /> : active.length === 0 ? <Empty>No patients in recovery.</Empty> : (
          <div className="space-y-3">
            {active.map((r) => (
              <RowLink key={r._id} href={`${TBASE}/recovery/${r._id}/discharge`}>
                <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]">
                  <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{patientLabel(r.patient)}</p><p className="truncate text-xs opacity-55">{r.theatreCase?.procedureName}</p></div>
                  <p className="text-xs opacity-60">Arrived {fmtDateTime(r.arrivedAt)}<br />In recovery {fmtDuration(minutesBetween(r.arrivedAt))} · nurse {nameOf(r.nurse)}</p>
                  <span className="text-xs font-semibold opacity-70">Discharge</span>
                </div>
              </RowLink>
            ))}
          </div>
        )}
      </>

      {!missing && (
        <>
          {done.length === 0 ? <Empty>No discharges yet.</Empty> : (
            <div className="space-y-3">{done.map((r) => (
              <RowLink key={r._id} href={`${TBASE}/schedule/${typeof r.theatreCase === "object" ? r.theatreCase._id : r.theatreCase}`}>
                <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]">
                  <p className="truncate text-[15px] font-semibold">{patientLabel(r.patient)}</p>
                  <p className="text-xs opacity-60">Stayed {fmtDuration(minutesBetween(r.arrivedAt, r.dischargedAt))} · Aldrete {r.aldreteScore ?? "—"} · pain {r.painScore ?? "—"}</p>
                  <p className="text-xs opacity-60">{fmtDateTime(r.dischargedAt)}</p>
                </div>
              </RowLink>
            ))}</div>
          )}
        </>
      )}
    </Page>
  );
}
