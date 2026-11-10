"use client";

import { useEffect } from "react";
import { fetchBloodBankSetup, saveBloodBankSetup } from "@/api/slices";
import {
  BASE, ENUMS, Loader, Page, PRODUCTS, SpecForm, clean, idOf, num, toOpts, useBB, useForm, type SectionSpec,
} from "@/components/blood-bank/bb-ui";

const N: Array<[string, string, number, number, string?]> = [
  ["minAgeYears", "Minimum donor age (years)", 16, 30], ["maxAgeYears", "Maximum donor age (years)", 40, 80],
  ["minWeightKg", "Minimum donor weight (kg)", 40, 100], ["minHbMale", "Minimum Hb – male (g/dL)", 10, 16],
  ["minHbFemale", "Minimum Hb – female (g/dL)", 10, 16], ["donationIntervalDaysMale", "Donation interval – male (days)", 30, 365],
  ["donationIntervalDaysFemale", "Donation interval – female (days)", 30, 365], ["screeningValidityHours", "Screening valid for (hours)", 1, 72],
  ["expiryAlertDays", "Expiry alert window (days)", 1, 60], ["minStockPerGroup", "Minimum stock per group (units)", 0, 1000],
  ["crossmatchValidityHours", "Crossmatch valid for (hours)", 1, 168], ["returnWindowMinutes", "Unit return window (minutes)", 5, 120],
  ["transfusionMaxHours", "Maximum transfusion time (hours)", 1, 8],
];

export default function SetupPage() {
  const { facilityId, act, bloodBank } = useBB();
  const s: any = bloodBank.setup;
  const form = useForm<any>({});

  useEffect(() => { if (facilityId) act(fetchBloodBankSetup({ facilityId }), false); }, [facilityId, act]);
  useEffect(() => {
    if (!s) return;
    const st = s.settings || {};
    const init: any = { name: s.name || "", licenseNumber: s.licenseNumber || "", medicalDirector: idOf(s.medicalDirector), phone: s.phone || "", email: s.email || "", address: s.address || "", requireDual: !!st.requireDualGroupingVerification, tti: st.requiredTtiTests || [] };
    N.forEach(([k]) => (init[k] = st[k] ?? ""));
    PRODUCTS.forEach((p) => (init[`shelf_${p.value}`] = st.shelfLifeDays?.[p.value] ?? ""));
    form.setV(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?._id]);

  if (form.v.name === undefined) return <Page narrow><Loader text="Loading setup…" /></Page>;

  const sections: SectionSpec[] = [
    { title: "Blood bank profile", fields: [
      { key: "name", label: "Blood bank name", required: true, span: 2 },
      { key: "licenseNumber", label: "Licence number" },
      { key: "medicalDirector", label: "Medical director", type: "staff" },
      { key: "phone", label: "Phone", type: "tel" },
      { key: "email", label: "Email", type: "email" },
      { key: "address", label: "Address", span: 2 },
    ] },
    { title: "Donor eligibility & operations", desc: "These rules drive screening, expiry alerts and crossmatching across the module.", cols: 3,
      fields: N.map(([k, l, min, max]) => ({ key: k, label: l, type: "number" as const, min, max, step: "any" })) },
    { title: "Safety rules", cols: 1, fields: [
      { key: "requireDual", type: "toggle", label: "Require dual verification of blood grouping", hint: "A second person must confirm every grouping result before stock is released." },
      { key: "tti", label: "Required TTI tests", type: "chips", required: true, options: toOpts(ENUMS.ttiTests) },
    ] },
    { title: "Shelf life (days)", cols: 3, fields: PRODUCTS.map((p) => ({ key: `shelf_${p.value}`, label: p.label, type: "number" as const, min: 1, max: 3650 })) },
  ];

  return (
    <SpecForm form={form} sections={sections} backHref={BASE} title="Blood Bank Setup" subtitle="Rules and settings for this facility" narrow={false}
      submitLabel="Save setup" saving={bloodBank.saving}
      confirm={{ title: "Save setup changes?", message: "New limits apply immediately to screening, grouping, expiry alerts and crossmatching.", label: "Save setup", tone: "primary" }}
      onSubmit={async (v) => {
        const settings: any = { requireDualGroupingVerification: v.requireDual, requiredTtiTests: v.tti };
        N.forEach(([k]) => { const n = num(v[k]); if (n !== undefined) settings[k] = n; });
        const shelf: any = {};
        PRODUCTS.forEach((p) => { const n = num(v[`shelf_${p.value}`]); if (n !== undefined) shelf[p.value] = n; });
        if (Object.keys(shelf).length) settings.shelfLifeDays = shelf;
        const payload: any = { ...clean({ name: v.name.trim(), licenseNumber: v.licenseNumber, phone: v.phone, address: v.address }), email: v.email || "", medicalDirector: v.medicalDirector || null, settings };
        await act(saveBloodBankSetup({ facilityId, payload }), "Blood bank setup saved");
      }} />
  );
}
