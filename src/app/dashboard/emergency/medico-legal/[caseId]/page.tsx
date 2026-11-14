"use client";

import { useParams } from "next/navigation";
import Link from "@/components/access/guarded-link";
import { fetchErMedicoLegalById } from "@/api/slices";
import type { ErMedicoLegal } from "@/api/slices/emergencySlice";
import { BASE, BackHeader, Btn, Card, ErPill, KV, KVGrid, Loader, NotFound, Page, TriageBadge, fmtDateTime, refId, rowPatientName, useER, useLoad } from "@/components/emergency/er-ui";

export default function MedicoLegalDetailPage() {
  const { caseId } = useParams() as { caseId: string };
  const er = useER();
  const { data: m, loading } = useLoad<ErMedicoLegal>(er, (facilityId) => fetchErMedicoLegalById({ facilityId, caseId }), [caseId]);
  if (loading) return <Page><Loader text="Loading case…" /></Page>;
  if (!m) return <Page><NotFound what="Medico-legal case" href={`${BASE}/medico-legal`} /></Page>;
  const reg = typeof m.registration === "string" ? null : m.registration;
  return (
    <Page>
      <BackHeader href={`${BASE}/medico-legal`} title={rowPatientName(m)} subtitle={`${m.caseType} · opened ${fmtDateTime(m.createdAt)}`} right={<Btn href={`${BASE}/medico-legal/${caseId}/edit`}>Update case</Btn>} />
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <TriageBadge category={reg?.triageCategory} size="lg" />
          <ErPill tone={m.policeNotified ? "ok" : "warn"}>{m.policeNotified ? "Police notified" : "Police not notified"}</ErPill>
          {reg && <ErPill value={reg.status} />}
          <Link href={`${BASE}/tracker/${refId(m.registration)}`} className="text-sm underline">Open ER visit</Link>
        </div>
        <KVGrid>
          <KV label="Police station">{m.policeStation}</KV>
          <KV label="Crime / case number">{m.crimeNumber}</KV>
          <KV label="Presenting complaint">{reg?.chiefComplaint}</KV>
        </KVGrid>
      </Card>
      {[["Clinical findings", m.findings], ["Evidence collected", m.evidenceCollected], ["Notes", m.notes]].map(([t, x]) => (
        <Card key={t} className="space-y-2"><h2 className="text-sm font-semibold tracking-tight">{t}</h2><p className="whitespace-pre-wrap text-sm opacity-80">{x || "Not recorded yet."}</p></Card>
      ))}
    </Page>
  );
}
