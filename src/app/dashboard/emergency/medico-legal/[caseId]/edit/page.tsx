"use client";

import { useParams } from "next/navigation";
import { fetchErMedicoLegalById, updateErMedicoLegal } from "@/api/slices";
import type { ErMedicoLegal } from "@/api/slices/emergencySlice";
import { BASE, Loader, NotFound, Page, SpecForm, mlInitial, mlPayload, mlSections, useER, useForm, useLoad } from "@/components/emergency/er-ui";

function EditForm({ m }: { m: ErMedicoLegal }) {
  const { facilityId, act, router, emergency } = useER();
  const form = useForm<any>(mlInitial(m));
  return (
    <SpecForm
      form={form}
      backHref={`${BASE}/medico-legal/${m._id}`}
      title="Update medico-legal case"
      subtitle={m.caseType}
      saving={emergency.saving}
      sections={mlSections()}
      onSubmit={async (v) => {
        const res = await act(updateErMedicoLegal({ facilityId, caseId: m._id, payload: mlPayload(v) }), "Medico-legal case updated");
        if (res) router.push(`${BASE}/medico-legal/${m._id}`);
      }}
    />
  );
}

export default function EditMedicoLegalPage() {
  const { caseId } = useParams() as { caseId: string };
  const er = useER();
  const { data, loading } = useLoad<ErMedicoLegal>(er, (facilityId) => fetchErMedicoLegalById({ facilityId, caseId }), [caseId]);
  if (loading) return <Page narrow><Loader /></Page>;
  if (!data) return <Page><NotFound what="Medico-legal case" href={`${BASE}/medico-legal`} /></Page>;
  return <EditForm m={data} />;
}
