"use client";

import { useEffect, useState } from "react";
import { Activity, Plus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchMyFacilities, fetchProcedures, addProcedure } from "@/api/slices";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  ModuleShell,
  personLabel,
  StatusPill,
  EmptyState,
  useInputStyles,
  ActionLink,
} from "@/components/dashboard/ModuleShell";

export default function ProceduresPage() {
  const dispatch = useAppDispatch();
  const { activeFacilityId } = useAppSelector((s) => s.facilities);
  const { procedures, listLoading, saving } = useAppSelector((s) => s.clinical);
  const { inputStyle, inputCls, cardCls, ui } = useInputStyles();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientId: "", name: "", code: "", category: "" });
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { dispatch(fetchMyFacilities()); }, [dispatch]);
  useEffect(() => {
    if (activeFacilityId) dispatch(fetchProcedures({ facilityId: activeFacilityId }));
  }, [dispatch, activeFacilityId]);

  async function handleOrder() {
    if (!activeFacilityId || !form.patientId || !form.name) return;
    try {
      await dispatch(addProcedure({ facilityId: activeFacilityId, payload: form as any })).unwrap();
      setShowForm(false);
      setForm({ patientId: "", name: "", code: "", category: "" });
      setMsg("Procedure ordered");
      dispatch(fetchProcedures({ facilityId: activeFacilityId }));
    } catch (e: any) {
      setMsg(typeof e === "string" ? e : "Failed");
    }
  }

  return (
    <ModuleShell
      title="Clinical procedures"
      subtitle={`${(procedures as any[])?.length || 0} ordered`}
      icon={Activity}
      loading={listLoading || saving}
      actions={
        <>
          <ActionLink href="/dashboard/clinical">Clinical home</ActionLink>
          <button type="button" onClick={() => setShowForm(true)} className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold text-white" style={{ backgroundColor: PRIMARY_COLOR }}>
            <Plus size={14} /> Order
          </button>
        </>
      }
    >
      {msg && <div className="rounded-2xl px-4 py-2 text-xs font-semibold" style={{ backgroundColor: "rgba(37,99,235,0.12)", color: "#2563eb" }}>{msg}</div>}
      {showForm && (
        <div className={cardCls} style={{ backgroundColor: ui.card, borderColor: ui.border }}>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold opacity-70 mb-1 block">Patient ID</label>
              <input className={inputCls} style={inputStyle} value={form.patientId} onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))} /></div>
            <div><label className="text-xs font-semibold opacity-70 mb-1 block">Name *</label>
              <input className={inputCls} style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><label className="text-xs font-semibold opacity-70 mb-1 block">Code</label>
              <input className={inputCls} style={inputStyle} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} /></div>
            <div><label className="text-xs font-semibold opacity-70 mb-1 block">Category</label>
              <input className={inputCls} style={inputStyle} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <button type="button" className="rounded-full border px-4 py-2 text-xs font-semibold" style={{ borderColor: ui.border }} onClick={() => setShowForm(false)}>Cancel</button>
            <button type="button" className="rounded-full px-4 py-2 text-xs font-semibold text-white" style={{ backgroundColor: PRIMARY_COLOR }} onClick={handleOrder}>Order</button>
          </div>
        </div>
      )}
      <div className={cardCls} style={{ backgroundColor: ui.card, borderColor: ui.border }}>
        {!(procedures as any[])?.length ? <EmptyState text="No procedures" /> : (
          <div className="space-y-2">{(procedures as any[]).map((p) => (
            <div key={p._id} className="flex justify-between gap-3 rounded-2xl p-4" style={{ backgroundColor: ui.inner }}>
              <div>
                <p className="font-semibold text-sm">{p.name}</p>
                <p className="text-xs opacity-55">{personLabel(p.patient || p.patientId)}{p.code ? ` · ${p.code}` : ""}</p>
              </div>
              <StatusPill status={p.status} map={{ ordered: "#2563eb", planned: "#2563eb", in_progress: "#d97706", completed: "#059669", cancelled: "#6b7280" }} />
            </div>
          ))}</div>
        )}
      </div>
    </ModuleShell>
  );
}
