"use client";

import { useParams } from "next/navigation";
import Link from "@/components/access/guarded-link";
import { fetchErTraumaById } from "@/api/slices";
import type { ErTrauma } from "@/api/slices/emergencySlice";
import { BASE, BackHeader, Btn, Card, ErPill, GcsChip, KV, KVGrid, Loader, NotFound, Page, TriageBadge, fmtDateTime, refId, rowPatientName, useER, useLoad } from "@/components/emergency/er-ui";

const Block = ({ title, text }: { title: string; text?: string }) => (
  <Card className="space-y-2"><h2 className="text-sm font-semibold tracking-tight">{title}</h2><p className="whitespace-pre-wrap text-sm opacity-80">{text || "Not recorded yet."}</p></Card>
);

export default function TraumaDetailPage() {
  const { traumaId } = useParams() as { traumaId: string };
  const er = useER();
  const { data: t, loading } = useLoad<ErTrauma>(er, (facilityId) => fetchErTraumaById({ facilityId, traumaId }), [traumaId]);
  if (loading) return <Page><Loader text="Loading trauma case…" /></Page>;
  if (!t) return <Page><NotFound what="Trauma case" href={`${BASE}/trauma`} /></Page>;
  const reg = typeof t.registration === "string" ? null : t.registration;
  return (
    <Page>
      <BackHeader href={`${BASE}/trauma`} title={rowPatientName(t)} subtitle={`Opened ${fmtDateTime(t.createdAt)}`} right={<Btn href={`${BASE}/trauma/${traumaId}/edit`}>Update case</Btn>} />
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <TriageBadge category={reg?.triageCategory} size="lg" />
          <GcsChip gcs={t.gcs} />
          {reg && <ErPill value={reg.status} />}
          <Link href={`${BASE}/tracker/${refId(t.registration)}`} className="text-sm underline">Open ER visit</Link>
        </div>
        <KVGrid>
          <KV label="Mechanism">{t.mechanism}</KV>
          <KV label="Presenting complaint">{reg?.chiefComplaint}</KV>
          <KV label="Disposition plan">{t.disposition}</KV>
        </KVGrid>
        {t.injuries?.length > 0 && <div className="flex flex-wrap gap-1.5">{t.injuries.map((i) => <span key={i} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: "rgba(128,128,128,0.15)" }}>{i}</span>)}</div>}
      </Card>
      <Block title="Primary survey (ABCDE)" text={t.primarySurvey} />
      <Block title="Secondary survey" text={t.secondarySurvey} />
      <Block title="Interventions" text={t.interventions} />
      {t.notes && <Block title="Notes" text={t.notes} />}
    </Page>
  );
}
