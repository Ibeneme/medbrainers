"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { addPostnatalVisit, fetchDeliveries } from "@/api/slices";
import {
  BASE, SpecForm, Suspended, clean, daysBetween, fmtDateTime, idOf, label, num, patientField, quickDateField, toIso, toLocalInput,
  useForm, useMat, type SectionSpec,
} from "@/components/maternity/mat-ui";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, router, maternity } = useMat();
  const form = useForm<any>({
    patientId: sp.get("patientId") || "", deliveryRecordId: sp.get("deliveryId") || "",
    visitDate: toLocalInput(), daysPostpartum: "", findings: "", advice: "", nextVisitDate: "",
  });
  const v = form.v;
  useEffect(() => {
    if (facilityId && v.patientId) act(fetchDeliveries({ facilityId, patientId: v.patientId }), false);
  }, [facilityId, v.patientId, act]);
  const deliveries = maternity.deliveries.filter((d) => idOf(d.patient) === v.patientId);
  const delivery = deliveries.find((d) => d._id === v.deliveryRecordId);

  /* days postpartum follows the chosen delivery + visit date until edited */
  const days = delivery && v.visitDate ? Math.max(0, daysBetween(delivery.deliveryDateTime, v.visitDate)) : undefined;
  useEffect(() => {
    if (days !== undefined) form.set("daysPostpartum", String(days));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const sections: SectionSpec[] = [
    {
      fields: [
        patientField("patientId", "Mother", { female: true, span: 2 }),
        {
          key: "deliveryRecordId", label: "Delivery", type: "select", span: 2,
          options: [{ value: "", label: v.patientId ? "Not linked" : "Select the mother first" }, ...deliveries.map((d) => ({ value: d._id, label: `${fmtDateTime(d.deliveryDateTime)} · ${label(d.mode)}` }))],
        },
        { key: "visitDate", label: "Visit date & time", type: "datetime" },
        { key: "daysPostpartum", label: "Days postpartum", type: "number", min: 0, max: 400, step: 1, hint: "WHO contacts: within 24 h, day 3, days 7–14 and week 6." },
        { key: "findings", label: "Findings", type: "textarea", span: 2, hint: "Include BP, temperature, uterine involution, lochia, breasts / feeding and wound." },
        { key: "advice", label: "Advice given", type: "textarea", span: 2 },
        quickDateField("nextVisitDate", "Next visit", [["+3 days", 3], ["+1 week", 7], ["+2 weeks", 14], ["+6 weeks", 42]], { from: (x) => x.visitDate, span: 2 }),
      ],
    },
  ];
  const ok = !!(v.findings?.trim() || v.advice?.trim());

  return (
    <SpecForm form={form} sections={sections} backHref={`${BASE}/postnatal`} title="Record postnatal visit"
      subtitle="Mother follow-up" submitLabel="Save visit" saving={maternity.saving} canSubmit={ok}
      onSubmit={async (x) => {
        const payload = clean({
          patientId: x.patientId, deliveryRecordId: x.deliveryRecordId, visitDate: toIso(x.visitDate),
          daysPostpartum: num(x.daysPostpartum), findings: x.findings, advice: x.advice, nextVisitDate: x.nextVisitDate,
        }) as any;
        const r = await act(addPostnatalVisit({ facilityId, payload }));
        if (r) router.push(`${BASE}/postnatal`);
      }} />
  );
}

export default function NewPostnatalPage() {
  return (
    <Suspended>
      <Inner />
    </Suspended>
  );
}
