"use client";

import { useEffect, useState } from "react";
import { Bed, Plus } from "lucide-react";
import { fetchLabourBoard } from "@/api/slices";
import type { LabourRecord } from "@/api/slices/maternitySlice";
import { cervicographState } from "@/components/maternity/mat-charts";
import {
  BASE, Banner, Btn, Card, Empty, Flag, Header, KV, KVGrid, Loader, MPill, Page, Pills, PatientCell, fmtDateTime, fmtDuration,
  idOf, label, minutesBetween, nameOf, useMat, ENUMS,
} from "@/components/maternity/mat-ui";

const byTimeDesc = (a: { time: string }, b: { time: string }) => new Date(b.time).getTime() - new Date(a.time).getTime();

function LabourCard({ l }: { l: LabourRecord }) {
  const obs = [...(l.partograph || [])].sort(byTimeDesc);
  const last = obs[0];
  const open = l.status === "admitted" || l.status === "active-labour";
  const sinceObs = last ? minutesBetween(last.time) : undefined;
  const cg = cervicographState(l.partograph || []);
  const fhrBad = last?.fetalHeartRate !== undefined && (last.fetalHeartRate < 110 || last.fetalHeartRate > 160);
  const pid = idOf(l.patient);
  const q = `labourId=${l._id}`;

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PatientCell p={l.patient} />
        <div className="flex flex-wrap items-center gap-2">
          {l.bedCode && <span className="rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold opacity-70">Bed {l.bedCode}</span>}
          {cg.crossedAction ? <MPill tone="bad">Crossed action line</MPill> : cg.crossedAlert ? <MPill tone="warn">Crossed alert line</MPill> : null}
          <MPill value={l.status} tone={l.status === "admitted" ? "warn" : undefined} />
        </div>
      </div>
      <KVGrid cols={4}>
        <KV label="Admitted">{fmtDateTime(l.admissionTime)}{open ? ` · ${fmtDuration(minutesBetween(l.admissionTime))}` : ""}</KV>
        <KV label="Onset of labour">{fmtDateTime(l.onsetOfLabour)}</KV>
        <KV label="Cervix">{last?.cervicalDilatation !== undefined ? `${last.cervicalDilatation} cm` : cg.lastDilatation !== undefined ? `${cg.lastDilatation} cm` : "—"}</KV>
        <KV label="Last FHR">{last?.fetalHeartRate !== undefined ? <Flag tone={fhrBad ? "bad" : undefined}>{last.fetalHeartRate} bpm</Flag> : "—"}</KV>
      </KVGrid>
      <p className="text-xs opacity-60">
        {last
          ? <>Last observation {fmtDateTime(last.time)} · {fmtDuration(sinceObs)} ago{open && (sinceObs ?? 0) > 60 ? <> · <Flag tone="warn">observation overdue</Flag></> : null}</>
          : open ? <Flag tone="warn">No partograph observations yet</Flag> : "No observations recorded"}
      </p>
      <div className="flex flex-wrap justify-end gap-2">
        <Btn href={`${BASE}/labour/partograph?${q}`} tone="ghost">Partograph</Btn>
        {open && <Btn href={`${BASE}/labour/partograph/record?${q}`} tone="card">Record observation</Btn>}
        {open && (
          <Btn href={`${BASE}/delivery/new?${q}&patientId=${pid}${l.antenatalRecord ? `&ancId=${l.antenatalRecord}` : ""}`}>
            Record delivery
          </Btn>
        )}
      </div>
    </Card>
  );
}

export default function LabourBoardPage() {
  const { facilityId, act, maternity, activeFacility } = useMat();
  const [status, setStatus] = useState("current");

  useEffect(() => {
    if (!facilityId) return;
    const load = () => act(fetchLabourBoard({ facilityId, status: status === "current" ? undefined : (status as any) }), false);
    load();
    if (status !== "current") return;
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [facilityId, act, status]);

  const rows = maternity.labour;
  const urgent = rows.filter((l) => cervicographState(l.partograph || []).crossedAction).length;

  return (
    <Page>
      <Header
        icon={<Bed size={22} />}
        title="Labour Ward Board"
        subtitle={activeFacility?.name}
        actions={<Btn href={`${BASE}/labour/admit`}><Plus size={16} /> Admit to labour</Btn>}
      />
      {status === "current" && urgent > 0 && (
        <Banner tone="bad" href={`${BASE}/labour/partograph`} cta="Open partograph">
          {urgent} woman{urgent === 1 ? "" : "en"} past the partograph action line — review for delay in labour
        </Banner>
      )}
      <Pills
        onCard={false}
        value={status}
        onChange={setStatus}
        options={[{ value: "current", label: "In labour now" }, ...ENUMS.labourStatuses.map((s) => ({ value: s, label: label(s) }))]}
      />
      {maternity.listLoading && rows.length === 0 ? (
        <Loader text="Loading labour ward…" />
      ) : rows.length === 0 ? (
        <Empty>{status === "current" ? "No women in the labour ward right now." : "No records with this status."}</Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((l) => (
            <LabourCard key={l._id} l={l} />
          ))}
        </div>
      )}
    </Page>
  );
}
