"use client";
import { useEffect, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchMyFacilities, fetchDiagnoses, addDiagnosis } from "@/api/slices";
import { PRIMARY_COLOR } from "@/constants/colors";
import { ModuleShell, personLabel, StatusPill, EmptyState, useInputStyles, ActionLink } from "@/components/dashboard/ModuleShell";

export default function DiagnosesPage() {
  const dispatch = useAppDispatch();
  const { activeFacilityId } = useAppSelector((s) => s.facilities);
  const { diagnoses, listLoading, saving } = useAppSelector((s) => s.clinical);
  const { inputStyle, inputCls, cardCls, ui } = useInputStyles();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientId: "", clinicalDescription: "", icd11Code: "", type: "primary", certainty: "provisional" });
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { dispatch(fetchMyFacilities()); }, [dispatch]);
  useEffect(() => { if (activeFacilityId) dispatch(fetchDiagnoses({ facilityId: activeFacilityId })); }, [dispatch, activeFacilityId]);
  async function handleAdd() {
    if (!activeFacilityId || !form.patientId || !form.clinicalDescription) return;
    try {
      await dispatch(addDiagnosis({ facilityId: activeFacilityId, payload: form as any })).unwrap();
      setShowForm(false); setMsg("Diagnosis recorded");
      dispatch(fetchDiagnoses({ facilityId: activeFacilityId }));
    } catch (e: any) { setMsg(typeof e === "string" ? e : "Failed"); }
  }
  return (
    <ModuleShell title="Diagnoses & ICD-11" subtitle={`${(diagnoses as any[])?.length || 0} records`} icon={FileText} loading={listLoading || saving}
      actions={<><ActionLink href="/dashboard/clinical">Clinical</ActionLink>
        <button type="button" onClick={() => setShowForm(true)} className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold text-white" style={{ backgroundColor: PRIMARY_COLOR }}><Plus size={14} /> Add</button></>}>
      {msg && <div className="rounded-2xl px-4 py-2 text-xs font-semibold" style={{ backgroundColor: "rgba(37,99,235,0.12)", color: "#2563eb" }}>{msg}</div>}
      {showForm && (
        <div className={cardCls} style={{ backgroundColor: ui.card, borderColor: ui.border }}>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold opacity-70 mb-1 block">Patient ID</label><input className={inputCls} style={inputStyle} value={form.patientId} onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))} /></div>
            <div><label className="text-xs font-semibold opacity-70 mb-1 block">Description *</label><input className={inputCls} style={inputStyle} value={form.clinicalDescription} onChange={(e) => setForm((f) => ({ ...f, clinicalDescription: e.target.value }))} /></div>
            <div><label className="text-xs font-semibold opacity-70 mb-1 block">ICD-11</label><input className={inputCls} style={inputStyle} value={form.icd11Code} onChange={(e) => setForm((f) => ({ ...f, icd11Code: e.target.value }))} /></div>
            <div><label className="text-xs font-semibold opacity-70 mb-1 block">Type</label>
              <select className={inputCls} style={inputStyle} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="primary">Primary</option><option value="secondary">Secondary</option><option value="differential">Differential</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <button type="button" className="rounded-full border px-4 py-2 text-xs font-semibold" style={{ borderColor: ui.border }} onClick={() => setShowForm(false)}>Cancel</button>
            <button type="button" className="rounded-full px-4 py-2 text-xs font-semibold text-white" style={{ backgroundColor: PRIMARY_COLOR }} onClick={handleAdd}>Save</button>
          </div>
        </div>
      )}
      <div className={cardCls} style={{ backgroundColor: ui.card, borderColor: ui.border }}>
        {!(diagnoses as any[])?.length ? <EmptyState text="No diagnoses yet" /> : (
          <div className="space-y-2">{(diagnoses as any[]).map((d) => (
            <div key={d._id} className="flex justify-between gap-3 rounded-2xl p-4" style={{ backgroundColor: ui.inner }}>
              <div><p className="font-semibold text-sm">{d.clinicalDescription}</p><p className="text-xs opacity-55">{personLabel(d.patient || d.patientId)} · {d.icd11Code || "no ICD"}</p></div>
              <StatusPill status={d.status} map={{ active: "#2563eb", resolved: "#059669" }} />
            </div>
          ))}</div>
        )}
      </div>
    </ModuleShell>
  );
}
