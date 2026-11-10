"use client";

import { useParams } from "next/navigation";
import { fetchErRegistration, triageErPatient } from "@/api/slices";
import type { ErRegistration, ErRegistrationDetail, ErTriage } from "@/api/slices/emergencySlice";
import { BASE, ER, Loader, NotFound, Page, RegContext, SpecForm, TRIAGE, TRIAGE_ORDER, clean, textOn, useER, useForm, useLoad } from "@/components/emergency/er-ui";

function TriageForm({ r }: { r: ErRegistration }) {
  const { facilityId, act, router, emergency } = useER();
  const form = useForm<any>({ triageCategory: r.triageCategory || "", triageNotes: r.triageNotes || "", location: r.location || "" });
  const left = ER.terminalStatuses.includes(r.status);
  const cat = form.v.triageCategory as ErTriage | "";

  return (
    <SpecForm
      form={form}
      backHref={`${BASE}/tracker/${r._id}`}
      title={r.triageCategory ? "Re-triage patient" : "Triage patient"}
      subtitle="Manchester Triage System"
      submitLabel="Save triage"
      saving={emergency.saving}
      canSubmit={!left}
      top={<RegContext r={r} />}
      confirm={cat === "red" ? { title: "Send to resuscitation?", message: "Red triage moves this patient straight into the resuscitation bay. Make sure the team has been alerted.", label: "Triage as red", tone: "danger" } : undefined}
      danger={cat === "red"}
      sections={[
        {
          title: "Triage category",
          desc: left ? "This patient has already left the department." : undefined,
          cols: 1,
          fields: [
            {
              key: "triageCategory",
              type: "custom",
              render: (v, set) => (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
                    {TRIAGE_ORDER.map((k) => {
                      const on = v.triageCategory === k;
                      const t = TRIAGE[k];
                      return (
                        <button
                          key={k}
                          type="button"
                          disabled={left}
                          onClick={() => set("triageCategory", k)}
                          className="flex flex-col items-center justify-center rounded-2xl px-3 py-4 text-center transition-all disabled:opacity-40"
                          style={{
                            backgroundColor: on ? t.color : `${t.color}18`,
                            color: on ? textOn(t.color) : t.color,
                            boxShadow: on ? `0 8px 20px ${t.color}50` : `inset 0 0 0 1px ${t.color}40`,
                          }}
                        >
                          <span className="text-sm font-bold uppercase">{k}</span>
                          <span className="text-[11px] opacity-90">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {cat && <p className="text-xs opacity-65">{TRIAGE[cat].hint}</p>}
                </div>
              ),
            },
          ],
        },
        {
          title: "Findings",
          cols: 1,
          fields: [
            { key: "triageNotes", label: "Triage notes", type: "textarea", placeholder: "Vitals, discriminators, mechanism of injury…" },
            { key: "location", label: "Place the patient in", placeholder: "e.g. Bay 3, Resus 1, Waiting area" },
          ],
        },
      ]}
      onSubmit={async (v) => {
        if (!v.triageCategory) return;
        const res = await act(triageErPatient({ facilityId, registrationId: r._id, payload: clean({ triageCategory: v.triageCategory, triageNotes: v.triageNotes?.trim(), location: v.location?.trim() }) as any }), "Triage recorded");
        if (res) router.push(`${BASE}/tracker/${r._id}`);
      }}
    />
  );
}

export default function TriagePatientPage() {
  const { registrationId } = useParams() as { registrationId: string };
  const er = useER();
  const { data, loading } = useLoad<ErRegistrationDetail>(er, (facilityId) => fetchErRegistration({ facilityId, registrationId }), [registrationId]);
  if (loading) return <Page narrow><Loader text="Loading patient…" /></Page>;
  if (!data) return <Page><NotFound what="ER visit" href={`${BASE}/triage`} /></Page>;
  return <TriageForm r={data} />;
}
