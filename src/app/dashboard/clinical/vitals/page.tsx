"use client";

import { useEffect, useState } from "react";
import { HeartPulse, Plus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchMyFacilities, fetchPatients, addPatientVital } from "@/api/slices";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  ModuleShell,
  personLabel,
  EmptyState,
  useInputStyles,
  ActionLink,
} from "@/components/dashboard/ModuleShell";

import { Can } from "@/components/access/can";
export default function VitalsPage() {
  const dispatch = useAppDispatch();
  const { activeFacilityId } = useAppSelector((s) => s.facilities);
  const patientsState = useAppSelector((s) => s.patients);
  const patients = (patientsState as any)?.patients || (patientsState as any)?.list || [];
  const loading = (patientsState as any)?.listLoading || (patientsState as any)?.loading;
  const { inputStyle, inputCls, cardCls, ui } = useInputStyles();
  const [patientId, setPatientId] = useState("");
  const [form, setForm] = useState({ temperatureC: "", pulse: "", bpSystolic: "", bpDiastolic: "", spo2: "", weightKg: "", heightCm: "", notes: "" });
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { dispatch(fetchMyFacilities()); }, [dispatch]);
  useEffect(() => {
    if (activeFacilityId) dispatch(fetchPatients({ facilityId: activeFacilityId } as any));
  }, [dispatch, activeFacilityId]);

  async function handleSubmit() {
    if (!activeFacilityId || !patientId) { setMsg("Select a patient"); return; }
    const payload: any = {};
    for (const k of ["temperatureC", "pulse", "bpSystolic", "bpDiastolic", "spo2", "weightKg", "heightCm"] as const) {
      if (form[k]) payload[k] = Number(form[k]);
    }
    if (form.notes) payload.notes = form.notes;
    try {
      await dispatch(addPatientVital({ facilityId: activeFacilityId, patientId, payload } as any)).unwrap();
      setMsg("Vitals recorded");
      setForm({ temperatureC: "", pulse: "", bpSystolic: "", bpDiastolic: "", spo2: "", weightKg: "", heightCm: "", notes: "" });
    } catch (e: any) {
      setMsg(typeof e === "string" ? e : "Failed");
    }
  }

  return (
    <ModuleShell title="Vitals & biometrics" subtitle="Record patient vitals" icon={HeartPulse} loading={!!loading}
      actions={<ActionLink href="/dashboard/clinical">Clinical home</ActionLink>}>
      {msg && <div className="rounded-2xl px-4 py-2 text-xs font-semibold" style={{ backgroundColor: "rgba(37,99,235,0.12)", color: "#2563eb" }}>{msg}</div>}
      <div className={cardCls} style={{ backgroundColor: ui.card, borderColor: ui.border }}>
        <div>
          <label className="text-xs font-semibold opacity-70 mb-1 block">Patient</label>
          <select className={inputCls} style={inputStyle} value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            <option value="">Select...</option>
            {(patients as any[]).map((p) => (
              <option key={p._id} value={p._id}>{personLabel(p)} {p.mrn ? `(${p.mrn})` : ""}</option>
            ))}
          </select>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {[["temperatureC","Temp °C"],["pulse","Pulse"],["bpSystolic","BP sys"],["bpDiastolic","BP dia"],["spo2","SpO₂"],["weightKg","Weight"],["heightCm","Height"]].map(([k,l]) => (
            <div key={k}>
              <label className="text-xs font-semibold opacity-70 mb-1 block">{l}</label>
              <input type="number" className={inputCls} style={inputStyle} value={(form as any)[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Can perm="vitals.write"><button type="button" onClick={handleSubmit} className="flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-semibold text-white" style={{ backgroundColor: PRIMARY_COLOR }}>
            <Plus size={14} /> Save vitals
          </button></Can>
        </div>
      </div>
      {!(patients as any[])?.length && <EmptyState text="No patients loaded" />}
    </ModuleShell>
  );
}
