"use client";

import { useEffect, useState } from "react";
import { Pill, Plus, RefreshCw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchMyFacilities } from "@/api/slices";
import api from "@/api/services";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  ModuleShell,
  personLabel,
  StatusPill,
  EmptyState,
  useInputStyles,
  ActionLink,
} from "@/components/dashboard/ModuleShell";

const ENDPOINTS: Record<string, string> = {
  ambulances: "/emergency/ambulances",
  critical: "/emergency/critical",
  catalog: "/labs/catalog",
  results: "/labs/requests",
  specimens: "/labs/specimens",
  prescriptions: "/pharmacy/prescriptions",
  inventory: "/pharmacy/inventory",
  dispense: "/pharmacy/prescriptions",
  controlled: "/pharmacy/controlled",
  requests: "/radiology/worklist",
  viewer: "/radiology/worklist",
  crossmatch: "/blood-bank/crossmatch",
  transfusions: "/blood-bank/transfusions",
  schedule: "/theater/schedule",
  checklist: "/theater/schedule",
  recovery: "/theater/recovery",
  antenatal: "/maternal/antenatal",
  delivery: "/maternal/deliveries",
  immunization: "/maternal/immunizations",
  pediatrics: "/maternal/pediatrics",
};

export default function ModulePage() {
  const dispatch = useAppDispatch();
  const { activeFacilityId } = useAppSelector((s) => s.facilities);
  const { inputStyle, inputCls, cardCls, ui } = useInputStyles();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { dispatch(fetchMyFacilities()); }, [dispatch]);

  async function load() {
    if (!activeFacilityId) return;
    const ep = ENDPOINTS["inventory"] || "";
    if (!ep) { setItems([]); return; }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/companies/${activeFacilityId}${ep}`);
      const list = data?.data ?? data ?? [];
      setItems(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [activeFacilityId]);

  function rowTitle(it: any) {
    return (
      it.name || it.procedureName || it.vaccineName || it.vehicleCode || it.unitNumber ||
      it.drugName || it.barcode || it.modality || it.clinicalDescription ||
      personLabel(it.patient || it.patientId) || it._id?.slice(-6) || "Record"
    );
  }

  function rowDetail(it: any) {
    const parts = [
      it.chiefComplaint, it.clinicalIndication, it.batchNumber, it.bloodType,
      it.theaterRoom, it.specimenType, it.status, it.priority,
    ].filter(Boolean);
    return parts.slice(0, 3).join(" · ");
  }

  return (
    <ModuleShell
      title="Drug inventory & stock"
      subtitle={`${items.length} records`}
      icon={Pill}
      loading={loading}
      actions={
        <>
          <ActionLink href="/dashboard/dashboard">Dashboard</ActionLink>
          <button type="button" onClick={load} className="flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-xs font-semibold" style={{ borderColor: ui.border }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </>
      }
    >
      {msg && <div className="rounded-2xl px-4 py-2 text-xs font-semibold" style={{ backgroundColor: "rgba(37,99,235,0.12)", color: "#2563eb" }}>{msg}</div>}
      {error && <div className="rounded-2xl px-4 py-2 text-xs font-semibold" style={{ backgroundColor: "rgba(220,38,38,0.12)", color: "#dc2626" }}>{error}</div>}

      <div className={cardCls} style={{ backgroundColor: ui.card, borderColor: ui.border }}>
        {items.length === 0 ? (
          <EmptyState text="No records yet. Data will appear when the API returns items for this module." />
        ) : (
          <div className="space-y-2">
            {items.map((it: any) => (
              <div key={it._id || JSON.stringify(it).slice(0, 20)} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4" style={{ backgroundColor: ui.inner }}>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{rowTitle(it)}</p>
                  <p className="text-xs opacity-55 truncate">{rowDetail(it)}</p>
                </div>
                {it.status && <StatusPill status={String(it.status)} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </ModuleShell>
  );
}
