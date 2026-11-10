"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ClipboardList,
  Plus,
  Send,
  Trash2,
  FileInput,
} from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  fetchDrugs,
  fetchPatients,
  fetchPatient,
  createPrescription,
  type PrescriptionItemInput,
} from "@/api/slices";
import { useAppSelector } from "@/api/hooks";
import { usePharmacy } from "@/hooks/usePharmacy";
import { CustomDropdown } from "@/components/ui/items";
import {
  Alert,
  FormField,
  GhostButton,
  PatientAvatar,
  PharmacyPage,
  PrimaryButton,
  SectionCard,
  TextArea,
  TextInput,
  patientName,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

type Line = {
  key: string;
  drugId: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  duration: string;
  quantity: string;
  refills: string;
  instructions: string;
};
type Draft = {
  lines: Line[];
  priority: "routine" | "urgent" | "stat";
  diagnosis: string;
  notes: string;
};

const blank = (): Line => ({
  key: Math.random().toString(36).slice(2),
  drugId: "",
  name: "",
  dosage: "",
  frequency: "",
  route: "oral",
  duration: "",
  quantity: "1",
  refills: "0",
  instructions: "",
});
/** Best-effort link of a free-text drug name ("Paracetamol 500mg tablets") to a catalog drug. */
function matchCatalogDrug(name: string, drugs: any[]) {
  const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9.%\s]/g, " ").replace(/\s+/g, " ").trim();
  const t = norm(name || "");
  if (!t) return null;
  const wanted = t.match(/\d+(?:\.\d+)?\s?(?:mg|mcg|g|ml|iu|%)/g)?.map((x) => x.replace(/\s/g, "")) || [];
  let best: any = null;
  let bestScore = 0;
  for (const d of drugs) {
    let score = 0;
    for (const n of [d.genericName, d.brandName].filter(Boolean).map((x: string) => norm(x))) {
      if (n.length < 3) continue;
      if (t === n) score = Math.max(score, 100);
      else if ((" " + t + " ").includes(" " + n + " ")) score = Math.max(score, 50 + n.length);
    }
    if (!score) continue;
    const have = d.strength ? norm(d.strength).replace(/\s/g, "") : "";
    if (have && wanted.length) score += wanted.some((w) => have.includes(w)) ? 30 : -60;
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  }
  return bestScore >= 20 ? best : null;
}

const FREQ = [
  "Once daily",
  "Twice daily (BD)",
  "Three times daily (TDS)",
  "Four times daily (QDS)",
  "Every 8 hours",
  "At night (nocte)",
  "When required (PRN)",
  "Stat",
];

function NewPrescriptionInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { dispatch, facilityId, pharmacy, act, showToast } = usePharmacy();
  const { ui, isDark, colors, border } = usePharmacyUI();
  const { list: allPatients, current: currentPatient } = useAppSelector((s) => s.patients);
  const { drugs, saving } = pharmacy;

  const consultationId = sp.get("consultation");
  const patientIds = useMemo(
    () =>
      sp.get("patients")
        ? decodeURIComponent(sp.get("patients")!)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    [sp]
  );
  const patients = useMemo(
    () =>
      patientIds
        .map(
          (id) =>
            (allPatients || []).find((p: any) => p._id === id) ||
            (currentPatient && (currentPatient as any)._id === id ? currentPatient : null)
        )
        .filter(Boolean) as any[],
    [allPatients, currentPatient, patientIds]
  );
  const prefilled = useRef(false);
  const [drugsReady, setDrugsReady] = useState(false);
  const consultation: any = useMemo(() => {
    if (!consultationId || patientIds.length !== 1) return null;
    const cur: any = currentPatient;
    if (!cur || cur._id !== patientIds[0]) return null;
    return (cur.consultations || []).find((c: any) => c._id === consultationId) || null;
  }, [consultationId, currentPatient, patientIds]);

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [tab, setTab] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchPatients({ facilityId, limit: 100 }));
    dispatch(fetchDrugs({ facilityId })).finally(() => setDrugsReady(true));
  }, [dispatch, facilityId]);

  // coming from a consultation: load that patient (+ their consultations) even if they are not in the first page
  useEffect(() => {
    if (!facilityId || !consultationId || patientIds.length !== 1) return;
    dispatch(fetchPatient({ facilityId, patientId: patientIds[0] }));
  }, [dispatch, facilityId, consultationId, patientIds]);

  // pre-fill the form from the consultation once, as soon as drugs + consultation have loaded
  useEffect(() => {
    if (prefilled.current || !consultation || !patientIds[0] || !drugsReady) return;
    prefilled.current = true;
    const rec: any[] = consultation.recommendedDrugs || [];
    const lines: Line[] = rec.length
      ? rec.map((d) => {
          const m = matchCatalogDrug(d.name, drugs);
          return {
            ...blank(),
            drugId: m?._id || "",
            name: d.name || "",
            dosage: d.dosage || "",
            frequency: d.frequency || "",
            route: d.route || m?.route || "oral",
            duration: d.duration || "",
            instructions: d.instructions || "",
          };
        })
      : [blank()];
    setDrafts((all) => ({
      ...all,
      [patientIds[0]]: {
        lines,
        priority: "routine",
        diagnosis: consultation.diagnosis || "",
        notes: "",
      },
    }));
  }, [consultation, drugs, drugsReady, patientIds]);

  useEffect(() => {
    if (!patientIds.length) return;
    setTab((t) => (patientIds.includes(t) ? t : patientIds[0]));
    setDrafts((d) => {
      const next = { ...d };
      patientIds.forEach((id) => {
        if (!next[id])
          next[id] = {
            lines: [blank()],
            priority: "routine",
            diagnosis: "",
            notes: "",
          };
      });
      return next;
    });
  }, [patientIds]);

  const drugOptions = useMemo(
    () => [
      { label: "Other / not in catalog (free text)", value: "" },
      ...drugs.map((d) => ({
        label: `${d.genericName} ${d.strength || ""} — ${d.code}`.replace(
          /\s+/g,
          " "
        ),
        value: d._id,
      })),
    ],
    [drugs]
  );

  const patch = (pid: string, fn: (d: Draft) => Draft) =>
    setDrafts((all) => ({ ...all, [pid]: fn(all[pid]) }));
  const patchLine = (pid: string, key: string, change: Partial<Line>) =>
    patch(pid, (d) => ({
      ...d,
      lines: d.lines.map((l) => (l.key === key ? { ...l, ...change } : l)),
    }));

  const pickDrug = (pid: string, key: string, drugId: string) => {
    const d = drugs.find((x) => x._id === drugId);
    patchLine(
      pid,
      key,
      d
        ? {
            drugId,
            name: `${d.genericName}${d.strength ? " " + d.strength : ""}`,
            route: d.route || "oral",
          }
        : { drugId: "" }
    );
  };

  const submit = async () => {
    setError(null);
    for (const p of patients) {
      const d = drafts[p._id];
      const valid = d.lines.filter((l) => l.name.trim());
      if (valid.length === 0)
        return setError(`Add at least one drug for ${patientName(p)}.`);
      if (valid.some((l) => !l.dosage.trim() || !l.frequency.trim()))
        return setError(
          `Dosage and frequency are required for every drug (${patientName(
            p
          )}).`
        );
    }
    let created = 0;
    let lastId: string | undefined;
    for (const p of patients) {
      const d = drafts[p._id];
      const items: PrescriptionItemInput[] = d.lines
        .filter((l) => l.name.trim())
        .map((l) => ({
          drugId: l.drugId || undefined,
          name: l.name.trim(),
          dosage: l.dosage || undefined,
          frequency: l.frequency || undefined,
          route: l.route || undefined,
          duration: l.duration || undefined,
          instructions: l.instructions || undefined,
          quantityPrescribed: Math.max(1, Number(l.quantity) || 1),
          refillsAllowed: Math.max(0, Number(l.refills) || 0),
        }));
      const res = await act(
        createPrescription({
          facilityId,
          payload: {
            patientId: p._id,
            consultationId: consultationId && patients.length === 1 ? consultationId : undefined,
            items,
            priority: d.priority,
            diagnosis: d.diagnosis || undefined,
            notes: d.notes || undefined,
          },
        }),
        false
      );
      if (res) {
        created++;
        lastId = (res as any)?._id;
      }
    }
    if (created > 0) {
      showToast(
        `${created} prescription${created > 1 ? "s" : ""} created`,
        "success"
      );
      if (created === patients.length)
        router.push(
          patients.length === 1 && lastId
            ? `/dashboard/pharmacy/prescriptions/${lastId}`
            : "/dashboard/pharmacy/prescriptions"
        );
    }
  };

  const patient = patients.find((p) => p._id === tab);
  const draft = drafts[tab];
  const allergies: any[] = patient?.allergies || [];
  const dd = { isDark, colors, border };

  return (
    <PharmacyPage
      routes={[
        { label: "Pharmacy", href: "/dashboard/pharmacy" },
        { label: "e-Prescriptions", href: "/dashboard/pharmacy/prescriptions" },
        { label: "New Prescription" },
      ]}
      title="New Prescription"
      description="Write prescriptions for one or more patients. Pharmacy will verify and link items to the catalog."
      icon={ClipboardList}
    >
      {patientIds.length === 0 ? (
        <SectionCard>
          <p className="text-sm opacity-70">No patients selected.</p>
          <PrimaryButton href="/dashboard/pharmacy/prescriptions/select">
            Select patients
          </PrimaryButton>
        </SectionCard>
      ) : (
        <>
          {consultationId && patientIds.length === 1 && (
            <Alert tone="info">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <FileInput size={13} /> From consultation:
              </span>{" "}
              the diagnosis and recommended drugs are filled in below. Set the <strong>quantity to dispense</strong> for
              each drug, check dosage and frequency, then submit. Drugs matched to your catalog are linked automatically.
            </Alert>
          )}

          {patients.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {patients.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => setTab(p._id)}
                  className="rounded-full px-4 py-2 text-xs font-semibold border transition"
                  style={{
                    backgroundColor: tab === p._id ? PRIMARY_COLOR : ui.card,
                    color: tab === p._id ? "#fff" : ui.text,
                    borderColor: tab === p._id ? PRIMARY_COLOR : ui.border,
                  }}
                >
                  {patientName(p)}
                </button>
              ))}
            </div>
          )}

          {patient && draft && (
            <>
              <div
                className="rounded-[24px] p-4 border flex items-center gap-3"
                style={{ backgroundColor: ui.card, borderColor: ui.border }}
              >
                <PatientAvatar p={patient} />
                <div>
                  <p className="font-semibold text-sm">
                    {patientName(patient)}
                  </p>
                  <p className="text-[11px] opacity-50">
                    MRN: {patient.mrn || "—"}
                  </p>
                </div>
              </div>

              {allergies.length > 0 && (
                <Alert tone="warning">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <AlertTriangle size={13} /> Known allergies:
                  </span>{" "}
                  {allergies
                    .map(
                      (a) =>
                        `${a.substance}${a.severity ? ` (${a.severity})` : ""}`
                    )
                    .join(", ")}
                </Alert>
              )}

              <SectionCard
                title="Drugs"
                right={
                  <GhostButton
                    icon={Plus}
                    onClick={() =>
                      patch(tab, (d) => ({
                        ...d,
                        lines: [...d.lines, blank()],
                      }))
                    }
                  >
                    Add drug
                  </GhostButton>
                }
              >
                <div className="space-y-4">
                  {draft.lines.map((l, idx) => (
                    <div
                      key={l.key}
                      className="rounded-2xl p-4 space-y-3"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold opacity-60">
                          Drug {idx + 1}
                        </span>
                        {draft.lines.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              patch(tab, (d) => ({
                                ...d,
                                lines: d.lines.filter((x) => x.key !== l.key),
                              }))
                            }
                            className="text-rose-500 opacity-70 hover:opacity-100"
                            title="Remove drug"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <CustomDropdown
                          label="Catalog drug"
                          value={l.drugId}
                          options={drugOptions}
                          onChange={(v) => pickDrug(tab, l.key, v)}
                          placeholder="Select catalog drug..."
                          searchable
                          {...dd}
                        />
                        <FormField label="Drug name *">
                          <TextInput
                            value={l.name}
                            onChange={(e) =>
                              patchLine(tab, l.key, { name: e.target.value })
                            }
                            placeholder="e.g. Amoxicillin 500mg"
                            style={{ backgroundColor: ui.card }}
                          />
                        </FormField>
                        <FormField label="Dosage *">
                          <TextInput
                            value={l.dosage}
                            onChange={(e) =>
                              patchLine(tab, l.key, { dosage: e.target.value })
                            }
                            placeholder="e.g. 1 tablet"
                            style={{ backgroundColor: ui.card }}
                          />
                        </FormField>
                        <FormField label="Frequency *">
                          <TextInput
                            list="rx-freq"
                            value={l.frequency}
                            onChange={(e) =>
                              patchLine(tab, l.key, {
                                frequency: e.target.value,
                              })
                            }
                            placeholder="e.g. Twice daily"
                            style={{ backgroundColor: ui.card }}
                          />
                        </FormField>
                        <FormField label="Duration">
                          <TextInput
                            value={l.duration}
                            onChange={(e) =>
                              patchLine(tab, l.key, {
                                duration: e.target.value,
                              })
                            }
                            placeholder="e.g. 5 days"
                            style={{ backgroundColor: ui.card }}
                          />
                        </FormField>
                        <div className="grid grid-cols-2 gap-3">
                          <FormField label="Quantity">
                            <TextInput
                              type="number"
                              min={1}
                              value={l.quantity}
                              onChange={(e) =>
                                patchLine(tab, l.key, {
                                  quantity: e.target.value,
                                })
                              }
                              placeholder="1"
                              style={{ backgroundColor: ui.card }}
                            />
                          </FormField>
                          <FormField label="Refills">
                            <TextInput
                              type="number"
                              min={0}
                              max={12}
                              value={l.refills}
                              onChange={(e) =>
                                patchLine(tab, l.key, {
                                  refills: e.target.value,
                                })
                              }
                              placeholder="0"
                              style={{ backgroundColor: ui.card }}
                            />
                          </FormField>
                        </div>
                      </div>
                      <FormField label="Instructions">
                        <TextInput
                          value={l.instructions}
                          onChange={(e) =>
                            patchLine(tab, l.key, {
                              instructions: e.target.value,
                            })
                          }
                          placeholder="e.g. Take after meals"
                          style={{ backgroundColor: ui.card }}
                        />
                      </FormField>
                    </div>
                  ))}
                </div>
                <datalist id="rx-freq">
                  {FREQ.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </SectionCard>

              <SectionCard title="Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CustomDropdown
                    label="Priority"
                    value={draft.priority}
                    options={[
                      { label: "Routine", value: "routine" },
                      { label: "Urgent", value: "urgent" },
                      { label: "STAT", value: "stat" },
                    ]}
                    onChange={(v) =>
                      patch(tab, (d) => ({ ...d, priority: v as any }))
                    }
                    placeholder="Select priority..."
                    {...dd}
                  />
                  <FormField label="Diagnosis">
                    <TextInput
                      value={draft.diagnosis}
                      onChange={(e) =>
                        patch(tab, (d) => ({ ...d, diagnosis: e.target.value }))
                      }
                      placeholder="e.g. Acute Bronchitis"
                    />
                  </FormField>
                </div>
                <FormField label="Notes to pharmacist">
                  <TextArea
                    value={draft.notes}
                    onChange={(e) =>
                      patch(tab, (d) => ({ ...d, notes: e.target.value }))
                    }
                    placeholder="Add any special instructions or pharmacist notes here..."
                  />
                </FormField>
              </SectionCard>
            </>
          )}

          {error && <Alert tone="danger">{error}</Alert>}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <GhostButton onClick={() => router.back()}>Cancel</GhostButton>
            <PrimaryButton
              icon={Send}
              onClick={submit}
              disabled={saving || patients.length === 0}
            >
              {saving
                ? "Submitting..."
                : patients.length > 1
                ? `Submit ${patients.length} prescriptions`
                : "Submit prescription"}
            </PrimaryButton>
          </div>
        </>
      )}
    </PharmacyPage>
  );
}

export default function NewPrescriptionPage() {
  return (
    <Suspense fallback={null}>
      <NewPrescriptionInner />
    </Suspense>
  );
}
