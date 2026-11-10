"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  createScreening,
  fetchBloodBankSetup,
  fetchDonors,
  fetchDrives,
} from "@/api/slices";
import {
  BASE,
  BackHeader,
  Btn,
  Card,
  Loader,
  Page,
  Pill,
  RISKS,
  SpecForm,
  clean,
  fmtDate,
  idOf,
  num,
  useBB,
  useForm,
  type SectionSpec,
} from "@/components/blood-bank/bb-ui";
import { ToggleSwitch } from "@/components/ui/items";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, router, bloodBank, showToast } = useBB();
  const form = useForm<any>({
    donorId: sp.get("donorId") || "",
    driveId: sp.get("driveId") || "",
    weightKg: "",
    heightCm: "",
    hemoglobin: "",
    systolic: "",
    diastolic: "",
    pulse: "",
    temperatureC: "",
    riskFactors: [] as string[],
    manualDeferral: false,
    mdReason: "",
    mdPermanent: false,
    mdDays: "",
    notes: "",
  });

  useEffect(() => {
    if (!facilityId) return;
    act(fetchDonors({ facilityId, status: "active", limit: 300 }), false);
    act(fetchDrives({ facilityId, limit: 100 }), false);
    act(fetchBloodBankSetup({ facilityId }), false);
  }, [facilityId, act]);
  const [result, setResult] = useState<any>(null);

  const donors = bloodBank.donors;
  const drives = bloodBank.drives.filter(
    (d) => d.status === "planned" || d.status === "ongoing"
  );

  const sections: SectionSpec[] = [
    {
      title: "Donor",
      fields: [
        {
          key: "donorId",
          label: "Donor",
          type: "select",
          required: true,
          searchable: true,
          options: donors.map((d) => ({
            value: d._id,
            label: `${d.donorNumber} · ${d.firstName} ${d.lastName}`,
          })),
        },
        {
          key: "driveId",
          label: "Blood drive (optional)",
          type: "select",
          searchable: true,
          options: [
            { value: "", label: "Walk-in (no drive)" },
            ...drives.map((d) => ({
              value: d._id,
              label: `${d.driveNumber} · ${d.name}`,
            })),
          ],
        },
      ],
    },
    {
      title: "Vitals",
      desc: "Values outside the safe donation range are flagged automatically.",
      cols: 3,
      fields: [
        {
          key: "weightKg",
          label: "Weight (kg)",
          type: "number",
          required: true,
          min: 20,
          max: 300,
          step: 0.1,
        },
        {
          key: "heightCm",
          label: "Height (cm)",
          type: "number",
          min: 80,
          max: 250,
        },
        {
          key: "hemoglobin",
          label: "Haemoglobin (g/dL)",
          type: "number",
          required: true,
          min: 3,
          max: 25,
          step: 0.1,
        },
        {
          key: "systolic",
          label: "Systolic BP",
          type: "number",
          required: true,
          min: 50,
          max: 260,
        },
        {
          key: "diastolic",
          label: "Diastolic BP",
          type: "number",
          required: true,
          min: 30,
          max: 160,
        },
        {
          key: "pulse",
          label: "Pulse (bpm)",
          type: "number",
          required: true,
          min: 30,
          max: 220,
        },
        {
          key: "temperatureC",
          label: "Temperature (°C)",
          type: "number",
          required: true,
          min: 34,
          max: 42,
          step: 0.1,
        },
      ],
    },
    {
      title: "Risk factors",
      desc: "Toggle anything that applies. The system works out the deferral period.",
      cols: 1,
      fields: [
        {
          key: "riskFactors",
          type: "custom",
          render: (v, set) => (
            <div className="grid gap-3 sm:grid-cols-2">
              {RISKS.map((r) => {
                const on = v.riskFactors.includes(r.key);
                return (
                  <div
                    key={r.key}
                    className="flex items-center justify-between rounded-2xl border px-4 py-3 transition"
                    style={{
                      borderColor: on ? "#f59e0b" : "rgba(128,128,128,0.2)",
                      backgroundColor: on ? "#f59e0b12" : "transparent",
                    }}
                  >
                    <div className="pr-3">
                      <p className="text-xs font-semibold">{r.label}</p>
                      <p className="text-[10px] opacity-50">{r.hint}</p>
                    </div>
                    <ToggleSwitch
                      checked={on}
                      onChange={() =>
                        set(
                          "riskFactors",
                          on
                            ? v.riskFactors.filter((x: string) => x !== r.key)
                            : [...v.riskFactors, r.key]
                        )
                      }
                    />
                  </div>
                );
              })}
            </div>
          ),
        },
      ],
    },
    {
      title: "Manual deferral & notes",
      fields: [
        {
          key: "manualDeferral",
          type: "toggle",
          label: "Defer this donor manually",
          hint: "Use when the clinician decides to defer outside the standard rules.",
          span: 2,
        },
        {
          key: "mdReason",
          label: "Deferral reason",
          required: true,
          span: 2,
          show: (v) => v.manualDeferral,
        },
        {
          key: "mdPermanent",
          type: "toggle",
          label: "Permanent deferral",
          show: (v) => v.manualDeferral,
        },
        {
          key: "mdDays",
          label: "Defer for (days)",
          type: "number",
          min: 1,
          max: 3650,
          show: (v) => v.manualDeferral && !v.mdPermanent,
        },
        { key: "notes", label: "Notes", type: "textarea", span: 2 },
      ],
    },
  ];

  /* live preview of the same rules the server applies */
  const st: any = bloodBank.setup?.settings;
  const donor: any = donors.find((d) => d._id === form.v.donorId);
  const v = form.v;
  const preview: string[] = [];
  if (st && donor) {
    const age = donor.dateOfBirth
      ? Math.floor(
          (Date.now() - new Date(donor.dateOfBirth).getTime()) / 31557600000
        )
      : undefined;
    if (age !== undefined && age < st.minAgeYears)
      preview.push(`Under minimum age (${st.minAgeYears})`);
    if (age !== undefined && age > st.maxAgeYears)
      preview.push(`Over maximum age (${st.maxAgeYears})`);
    const minHb = donor.gender === "male" ? st.minHbMale : st.minHbFemale;
    const w = num(v.weightKg),
      hb = num(v.hemoglobin),
      sy = num(v.systolic),
      di = num(v.diastolic),
      pu = num(v.pulse),
      tp = num(v.temperatureC);
    if (w !== undefined && w < st.minWeightKg)
      preview.push(`Weight ${w} kg is below ${st.minWeightKg} kg`);
    if (hb !== undefined && hb < minHb)
      preview.push(`Haemoglobin ${hb} g/dL is below ${minHb} g/dL`);
    if (sy !== undefined && (sy < 90 || sy > 180))
      preview.push(`Systolic BP ${sy} mmHg outside 90–180`);
    if (di !== undefined && (di < 50 || di > 100))
      preview.push(`Diastolic BP ${di} mmHg outside 50–100`);
    if (pu !== undefined && (pu < 50 || pu > 100))
      preview.push(`Pulse ${pu} bpm outside 50–100`);
    if (tp !== undefined && tp > 37.5)
      preview.push(`Temperature ${tp} °C above 37.5 °C`);
  }
  v.riskFactors.forEach((k: string) => {
    const r = RISKS.find((x) => x.key === k);
    if (r) preview.push(`${r.label} (${r.hint})`);
  });
  if (v.manualDeferral && v.mdReason)
    preview.push(`Manual deferral: ${v.mdReason}`);

  if (result) {
    const ok = result.outcome === "eligible";
    const reasons: string[] = (result.flags || []).map((f: any) => f.message);
    return (
      <Page narrow>
        <BackHeader
          href={`${BASE}/screening`}
          title="Screening result"
          subtitle={<span className="font-mono">{result.screeningNumber}</span>}
        />
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Pill value={result.outcome} />
            {!ok && (
              <span className="text-sm opacity-70">
                {result.outcome === "deferred_permanent"
                  ? "Permanently deferred"
                  : `Deferred until ${fmtDate(result.deferralUntil)}`}
              </span>
            )}
          </div>
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: ok ? "#10b9811f" : "#f59e0b1f" }}
          >
            <p className="text-sm font-semibold">
              {ok
                ? "Donor cleared to donate"
                : "Donor is not eligible to donate"}
            </p>
            {!ok && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {(reasons.length ? reasons : [result.deferralReason])
                  .filter(Boolean)
                  .map((r) => (
                    <li key={r}>{r}</li>
                  ))}
              </ul>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Btn href={`${BASE}/screening/${result._id}`} tone="ghost">
              View screening
            </Btn>
            <Btn
              tone="ghost"
              onClick={() => {
                setResult(null);
                form.set("donorId", "");
              }}
            >
              Screen another donor
            </Btn>
            {ok ? (
              <Btn href={`${BASE}/donations/new?screeningId=${result._id}`}>
                Record donation
              </Btn>
            ) : (
              <Btn href={`${BASE}/donors/${idOf(result.donor)}`}>
                Open donor
              </Btn>
            )}
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <SpecForm
      form={form}
      sections={sections}
      top={
        preview.length > 0 ? (
          <Card className="space-y-2">
            <p className="text-sm font-semibold">
              Heads-up: this donor would be deferred
            </p>
            <ul className="list-disc space-y-0.5 pl-5 text-xs opacity-80">
              {preview.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="text-[10px] opacity-50">
              Preview only. The final decision is made when the screening is
              recorded.
            </p>
          </Card>
        ) : undefined
      }
      backHref={`${BASE}/screening`}
      title="New donor screening"
      subtitle="Pre-donation assessment"
      submitLabel="Record screening"
      saving={bloodBank.saving}
      savingText="Recording screening…"
      onSubmit={async (v) => {
        const payload: any = {
          donorId: v.donorId,
          driveId: v.driveId || undefined,
          vitals: clean({
            weightKg: num(v.weightKg),
            heightCm: num(v.heightCm),
            hemoglobin: num(v.hemoglobin),
            systolic: num(v.systolic),
            diastolic: num(v.diastolic),
            pulse: num(v.pulse),
            temperatureC: num(v.temperatureC),
          }),
          riskFactors: v.riskFactors,
          notes: v.notes || undefined,
        };
        if (v.manualDeferral)
          payload.manualDeferral = clean({
            reason: v.mdReason,
            permanent: v.mdPermanent || undefined,
            days: v.mdPermanent ? undefined : num(v.mdDays),
          });
        const res: any = await act(
          createScreening({ facilityId, payload }),
          false
        );
        if (res && res !== true) {
          if (res.outcome === "eligible") {
            showToast("Donor cleared to donate");
            router.push(`${BASE}/screening/${idOf(res)}`);
          } else setResult(res);
        } else if (res) router.push(`${BASE}/screening`);
      }}
    />
  );
}

export default function NewScreeningPage() {
  return (
    <Suspense
      fallback={
        <Page narrow>
          <Loader />
        </Page>
      }
    >
      <Inner />
    </Suspense>
  );
}
