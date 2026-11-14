"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Plus, Search } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchMyFacilities,
  fetchConsultations,
  startConsultation,
  updateSoap,
  completeConsultation,
} from "@/api/slices";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  ModuleShell,
  personLabel,
  StatusPill,
  EmptyState,
  useInputStyles,
  ActionLink,
} from "@/components/dashboard/ModuleShell";

import { Can } from "@/components/access/can";
export default function ClinicalNotesPage() {
  const dispatch = useAppDispatch();
  const { activeFacilityId } = useAppSelector((s) => s.facilities);
  const { consultations, listLoading, saving } = useAppSelector((s) => s.clinical);
  const { inputStyle, inputCls, cardCls, ui } = useInputStyles();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [showStart, setShowStart] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [soap, setSoap] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (activeFacilityId) {
      dispatch(
        fetchConsultations({
          facilityId: activeFacilityId,
          status: status === "all" ? undefined : status,
        }),
      );
    }
  }, [dispatch, activeFacilityId, status]);

  const selected = (consultations as any[]).find((c) => c._id === selectedId);

  useEffect(() => {
    if (selected?.soap) {
      setSoap({
        subjective: selected.soap.subjective || "",
        objective: selected.soap.objective || "",
        assessment: selected.soap.assessment || "",
        plan: selected.soap.plan || "",
      });
    }
  }, [selectedId]);

  const filtered = (consultations as any[]).filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      personLabel(c.patient || c.patientId).toLowerCase().includes(q) ||
      (c.chiefComplaint || "").toLowerCase().includes(q)
    );
  });

  async function handleStart() {
    if (!activeFacilityId || !patientId.trim()) return;
    try {
      await dispatch(
        startConsultation({
          facilityId: activeFacilityId,
          payload: { patientId: patientId.trim(), chiefComplaint, encounterType: "outpatient" },
        }),
      ).unwrap();
      setShowStart(false);
      setPatientId("");
      setChiefComplaint("");
      setMsg("Consultation started");
      dispatch(fetchConsultations({ facilityId: activeFacilityId }));
    } catch (e: any) {
      setMsg(typeof e === "string" ? e : "Failed to start");
    }
  }

  async function handleSaveSoap() {
    if (!activeFacilityId || !selectedId) return;
    try {
      await dispatch(updateSoap({ facilityId: activeFacilityId, id: selectedId, payload: soap })).unwrap();
      setMsg("SOAP saved");
    } catch (e: any) {
      setMsg(typeof e === "string" ? e : "Save failed");
    }
  }

  async function handleComplete() {
    if (!activeFacilityId || !selectedId) return;
    try {
      await dispatch(completeConsultation({ facilityId: activeFacilityId, id: selectedId, payload: {} })).unwrap();
      setMsg("Consultation completed");
      setSelectedId(null);
      dispatch(fetchConsultations({ facilityId: activeFacilityId }));
    } catch (e: any) {
      setMsg(typeof e === "string" ? e : "Complete failed");
    }
  }

  return (
    <ModuleShell
      title="Active consultations"
      subtitle="SOAP notes"
      icon={ClipboardList}
      loading={listLoading || saving}
      actions={
        <>
          <ActionLink href="/dashboard/clinical">Clinical home</ActionLink>
          <Can perm="consultations.write"><button type="button" onClick={() => setShowStart(true)} className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold text-white" style={{ backgroundColor: PRIMARY_COLOR }}>
            <Plus size={14} /> Start consult
          </button></Can>
        </>
      }
    >
      {msg && <div className="rounded-2xl px-4 py-2 text-xs font-semibold" style={{ backgroundColor: "rgba(37,99,235,0.12)", color: "#2563eb" }}>{msg}</div>}

      {showStart && (
        <div className={cardCls} style={{ backgroundColor: ui.card, borderColor: ui.border }}>
          <h2 className="font-semibold">Start consultation</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold opacity-70 mb-1 block">Patient ID</label>
              <input className={inputCls} style={inputStyle} value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="Patient _id" />
            </div>
            <div>
              <label className="text-xs font-semibold opacity-70 mb-1 block">Chief complaint</label>
              <input className={inputCls} style={inputStyle} value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" className="rounded-full border px-4 py-2 text-xs font-semibold" style={{ borderColor: ui.border }} onClick={() => setShowStart(false)}>Cancel</button>
            <Can perm="consultations.write"><button type="button" className="rounded-full px-4 py-2 text-xs font-semibold text-white" style={{ backgroundColor: PRIMARY_COLOR }} onClick={handleStart}>Start</button></Can>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
          <input className={inputCls + " pl-10"} style={inputStyle} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={inputCls + " w-auto"} style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-2">
          {filtered.length === 0 ? <EmptyState text="No consultations" /> : filtered.map((c: any) => (
            <button key={c._id} type="button" onClick={() => setSelectedId(c._id)} className="w-full text-left rounded-2xl border p-4" style={{ backgroundColor: selectedId === c._id ? ui.inner : ui.card, borderColor: selectedId === c._id ? PRIMARY_COLOR : ui.border }}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm">{personLabel(c.patient || c.patientId)}</p>
                <StatusPill status={c.status} map={{ active: "#2563eb", completed: "#059669", cancelled: "#6b7280" }} />
              </div>
              <p className="text-xs opacity-60 mt-1 truncate">{c.chiefComplaint || "No CC"}</p>
            </button>
          ))}
        </div>
        <div className="lg:col-span-3">
          {!selected ? (
            <div className={cardCls} style={{ backgroundColor: ui.card, borderColor: ui.border }}><EmptyState text="Select a consultation" /></div>
          ) : (
            <div className={cardCls} style={{ backgroundColor: ui.card, borderColor: ui.border }}>
              <h2 className="font-semibold text-lg">{personLabel(selected.patient || selected.patientId)}</h2>
              {(["subjective", "objective", "assessment", "plan"] as const).map((k) => (
                <div key={k}>
                  <label className="text-xs font-semibold opacity-70 mb-1 block capitalize">{k}</label>
                  <textarea className={inputCls + " min-h-[72px]"} style={inputStyle} value={soap[k]} onChange={(e) => setSoap((s) => ({ ...s, [k]: e.target.value }))} disabled={selected.status === "completed"} />
                </div>
              ))}
              {selected.status !== "completed" && (
                <div className="flex gap-2 justify-end">
                  <Can perm="consultations.write"><button type="button" className="rounded-full border px-4 py-2 text-xs font-semibold" style={{ borderColor: ui.border }} onClick={handleSaveSoap}>Save SOAP</button></Can>
                  <Can perm="consultations.write"><button type="button" className="rounded-full px-4 py-2 text-xs font-semibold text-white" style={{ backgroundColor: PRIMARY_COLOR }} onClick={handleComplete}>Sign & complete</button></Can>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ModuleShell>
  );
}
