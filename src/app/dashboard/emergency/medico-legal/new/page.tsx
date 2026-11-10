"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { openErMedicoLegal } from "@/api/slices";
import { BASE, Loader, Page, RegContext, SpecForm, idOf, mlInitial, mlPayload, mlSections, useER, useForm, useRegOptions } from "@/components/emergency/er-ui";

function Inner() {
  const pre = useSearchParams().get("registrationId") || "";
  const { facilityId, act, router, emergency } = useER();
  const { options, byId } = useRegOptions(pre || undefined);
  const form = useForm<any>({ registrationId: pre, ...mlInitial(null) });
  const sections = mlSections();
  return (
    <SpecForm
      form={form}
      backHref={pre ? `${BASE}/tracker/${pre}` : `${BASE}/medico-legal`}
      title="Open medico-legal case"
      subtitle="Assault, RTA, gunshot, poisoning and similar"
      submitLabel="Open case"
      saving={emergency.saving}
      top={<RegContext r={byId(form.v.registrationId)} />}
      sections={[{ cols: 1, fields: [{ key: "registrationId", label: "ER patient", type: "select", required: true, searchable: true, options }] }, ...sections]}
      onSubmit={async (v) => {
        const res: any = await act(openErMedicoLegal({ facilityId, payload: { registrationId: v.registrationId, ...mlPayload(v) } }), "Medico-legal case opened");
        if (res) router.push(res === true ? `${BASE}/medico-legal` : `${BASE}/medico-legal/${idOf(res)}`);
      }}
    />
  );
}

export default function NewMedicoLegalPage() {
  return <Suspense fallback={<Page narrow><Loader /></Page>}><Inner /></Suspense>;
}
