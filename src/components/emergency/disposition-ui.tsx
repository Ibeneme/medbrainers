"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { disposeErPatient, fetchErDispositions } from "@/api/slices";
import type { ErDispositionType } from "@/api/slices/emergencySlice";
import { useWardsData } from "@/hooks/useWardsData";
import { wardStats } from "@/components/wards/bed-ui";
import {
  BASE, Btn, DISPOSITION_LABEL, Empty, ErPill, Header, Loader, Page, Pills, RegContext, RowLink, SearchBox, SectionCard, SpecForm, TriageBadge,
  clean, erLabel, fmtDateTime, minsSince, fmtMins, refId, rowPatientName, useER, useForm, useRegOptions,
} from "./er-ui";

/* One list for admissions, referrals and discharges: they are the same record filtered by type. */
export function DispositionList({
  title, icon, types, newHref, newLabel, empty,
}: { title: string; icon: ReactNode; types: ErDispositionType[]; newHref: string; newLabel: string; empty: string }) {
  const { facilityId, act, emergency, activeFacility } = useER();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const single = types.length === 1 ? types[0] : undefined;

  useEffect(() => {
    if (facilityId) act(fetchErDispositions({ facilityId, type: single }), false);
  }, [facilityId, act, single]);

  const rows = useMemo(
    () => emergency.dispositions.filter((d) => types.includes(d.type) && (type === "all" || d.type === type) && (!q.trim() || [rowPatientName(d), typeof d.registration === "string" ? "" : d.registration.chiefComplaint].some((x) => x.toLowerCase().includes(q.toLowerCase())))),
    [emergency.dispositions, types, type, q],
  );

  return (
    <Page>
      <Header icon={icon} title={title} subtitle={activeFacility?.name} actions={<Btn href={`${BASE}${newHref}`}>{newLabel}</Btn>} />
      <SectionCard title={title} count={rows.length}>
        <SearchBox value={q} onChange={setQ} placeholder="Search patient or complaint…" />
        {types.length > 1 && <Pills value={type} onChange={setType} options={[{ value: "all", label: "All" }, ...types.map((t) => ({ value: t, label: DISPOSITION_LABEL[t] }))]} />}
        {emergency.listLoading && !emergency.dispositions.length ? <Loader /> : rows.length === 0 ? <Empty>{empty}</Empty> : (
          <div className="space-y-3">
            {rows.map((d) => {
              const reg = typeof d.registration === "string" ? null : d.registration;
              const ward = d.destinationWard && typeof d.destinationWard !== "string" ? d.destinationWard : null;
              const req = d.admissionRequest && typeof d.admissionRequest !== "string" ? d.admissionRequest : null;
              return (
                <RowLink key={d._id} href={`${BASE}/tracker/${refId(d.registration)}`}>
                  <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto]">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <TriageBadge category={reg?.triageCategory} size="md" />
                      <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{rowPatientName(d)}</p><p className="truncate text-xs opacity-50">{reg?.chiefComplaint}</p></div>
                    </div>
                    <p className="text-xs opacity-70">
                      {ward ? `${ward.name}${ward.code ? ` (${ward.code})` : ""}` : d.destinationFacility || d.reason || "—"}
                      {reg && <><br /><span className="opacity-70">Length of stay {fmtMins(minsSince(reg.arrivalTime, d.dispositionTime))}</span></>}
                    </p>
                    <p className="text-xs opacity-60">{fmtDateTime(d.dispositionTime)}</p>
                    <div className="flex flex-wrap justify-end gap-2">
                      {req && <ErPill value={req.status}>{req.status === "accepted" ? `Bed ${req.bedCode || "assigned"}` : req.status === "pending" ? "Awaiting bed" : `Request ${req.status}`}</ErPill>}
                      <ErPill tone={d.type === "deceased" ? "bad" : d.type === "left-against-advice" ? "warn" : "ok"}>{DISPOSITION_LABEL[d.type]}</ErPill>
                    </div>
                  </div>
                </RowLink>
              );
            })}
          </div>
        )}
      </SectionCard>
    </Page>
  );
}

function FormInner({ types, title, subtitle, listHref, cta }: { types: ErDispositionType[]; title: string; subtitle: string; listHref: string; cta: string }) {
  const pre = useSearchParams().get("registrationId") || "";
  const { facilityId, act, router, emergency } = useER();
  const { options, byId } = useRegOptions(pre || undefined);
  const { wards } = useWardsData();
  const form = useForm<any>({ registrationId: pre, type: types[0], destinationWardId: "", destinationFacility: "", admittingDiagnosis: "", reason: "", summary: "" });
  const v = form.v;
  const reg = byId(v.registrationId);
  const t = v.type as ErDispositionType;
  const unidentified = t === "admit" && !!reg && !refId(reg.patient);

  const wardOpts = wards.filter((w) => (w as any).isActive !== false).map((w) => {
    const free = wardStats(w).available;
    return { value: w._id, label: `${w.name} (${w.code}) · ${free} bed${free === 1 ? "" : "s"} free` };
  });

  const confirms: Record<ErDispositionType, { title: string; message: string; tone: "primary" | "danger" }> = {
    admit: { title: "Send admission request?", message: "The ward bed manager will see an emergency request and assign a bed. The patient will leave the ER tracker.", tone: "primary" },
    refer: { title: "Refer this patient?", message: "The patient will be recorded as transferred to the receiving facility and leave the ER tracker.", tone: "primary" },
    discharge: { title: "Discharge this patient?", message: "The visit will be closed and the patient will leave the ER tracker.", tone: "primary" },
    deceased: { title: "Record death?", message: "This closes the ER visit as deceased. Make sure the time and circumstances are documented.", tone: "danger" },
    "left-against-advice": { title: "Record left against advice?", message: "This closes the ER visit as left against medical advice.", tone: "primary" },
  };

  return (
    <SpecForm
      form={form}
      backHref={pre ? `${BASE}/tracker/${pre}` : listHref}
      title={title}
      subtitle={subtitle}
      submitLabel={cta}
      danger={t === "deceased"}
      saving={emergency.saving}
      canSubmit={!unidentified}
      confirm={confirms[t]}
      top={
        <>
          <RegContext r={reg} />
          {unidentified && <p className="rounded-2xl p-4 text-sm font-medium" style={{ backgroundColor: "#f59e0b1f", color: "#d97706" }}>This patient is unidentified. Link a patient record before admitting to a ward.</p>}
        </>
      }
      sections={[
        {
          cols: 1,
          fields: [
            { key: "registrationId", label: "ER patient", type: "select", required: true, searchable: true, options },
            ...(types.length > 1 ? [{ key: "type", label: "Outcome", type: "select" as const, required: true, options: types.map((x) => ({ value: x, label: DISPOSITION_LABEL[x] })) }] : []),
          ],
        },
        ...(t === "admit"
          ? [{
              title: "Admission",
              desc: "Creates an emergency admission request in the Wards queue.",
              fields: [
                { key: "destinationWardId", label: "Preferred ward", type: "select" as const, searchable: true, options: [{ value: "", label: "Let the bed manager decide" }, ...wardOpts] },
                { key: "admittingDiagnosis", label: "Admitting diagnosis" },
                { key: "reason", label: "Reason for admission", type: "textarea" as const, span: 2 as const, placeholder: "Defaults to the chief complaint" },
              ],
            }]
          : t === "refer"
          ? [{
              title: "Referral",
              fields: [
                { key: "destinationFacility", label: "Receiving facility", required: true, span: 2 as const, placeholder: "e.g. University Teaching Hospital, Neurosurgery" },
                { key: "reason", label: "Reason for referral", type: "textarea" as const, span: 2 as const, placeholder: "e.g. Needs neurosurgical care not available here" },
              ],
            }]
          : t === "left-against-advice"
          ? [{ title: "Details", cols: 1 as const, fields: [{ key: "reason", label: "Reason given", type: "textarea" as const }] }]
          : []),
        {
          title: t === "deceased" ? "Circumstances" : "Summary",
          cols: 1,
          fields: [{ key: "summary", label: t === "deceased" ? "Time, cause and circumstances" : t === "discharge" ? "Discharge summary & advice" : "Clinical summary", type: "textarea", rows: 5 }],
        },
      ]}
      onSubmit={async () => {
        const payload: any = clean({
          registrationId: v.registrationId, type: t,
          destinationWardId: t === "admit" ? v.destinationWardId : undefined,
          destinationFacility: t === "refer" ? v.destinationFacility?.trim() : undefined,
          admittingDiagnosis: t === "admit" ? v.admittingDiagnosis?.trim() : undefined,
          reason: v.reason?.trim(), summary: v.summary?.trim(),
        });
        const res = await act(disposeErPatient({ facilityId, payload }));
        if (res) router.push(listHref);
      }}
    />
  );
}

export function DispositionForm(props: { types: ErDispositionType[]; title: string; subtitle: string; listHref: string; cta: string }) {
  return <Suspense fallback={<Page narrow><Loader /></Page>}><FormInner {...props} /></Suspense>;
}
