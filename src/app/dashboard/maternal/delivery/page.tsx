"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeartPulse, Plus } from "lucide-react";
import { fetchDeliveries } from "@/api/slices";
import {
  BASE, Btn, DataTable, ENUMS, Flag, Header, Loader, MODE_LABEL, MPill, Page, PatientCell, Pills, SearchBox, SectionCard,
  fmtDateTime, idOf, matchesPatient, nameOf, useMat,
} from "@/components/maternity/mat-ui";

export default function DeliveriesPage() {
  const { facilityId, act, maternity, activeFacility } = useMat();
  const [mode, setMode] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (facilityId) act(fetchDeliveries({ facilityId, mode: mode === "all" ? undefined : (mode as any) }), false);
  }, [facilityId, act, mode]);

  const rows = maternity.deliveries.filter((d) => matchesPatient(d.patient, q));
  const lk = "text-xs font-semibold underline";

  return (
    <Page>
      <Header
        icon={<HeartPulse size={22} />}
        title="Delivery Records"
        subtitle={activeFacility?.name}
        actions={<Btn href={`${BASE}/delivery/new`}><Plus size={16} /> Record delivery</Btn>}
      />
      <>
        <SearchBox value={q} onChange={setQ} placeholder="Search mother name or MRN…" />
        <Pills value={mode} onChange={setMode} options={[{ value: "all", label: "All" }, ...ENUMS.deliveryModes.map((m) => ({ value: m, label: MODE_LABEL[m].split(" (")[0] }))]} />
        {maternity.listLoading && !maternity.deliveries.length ? (
          <Loader text="Loading deliveries…" />
        ) : (
          <DataTable
            head={["Delivered", "Mother", "Mode", "Blood loss", "Complications", "Next"]}
            empty="No deliveries recorded."
            rows={rows.map((d) => [
              fmtDateTime(d.deliveryDateTime),
              <PatientCell key="p" p={d.patient} sub={d.attendedBy ? ` · ${nameOf(d.attendedBy)}` : ""} />,
              <MPill key="m" value={d.mode} />,
              d.bloodLossMl !== undefined ? <Flag key="b" tone={d.bloodLossMl >= 1000 ? "bad" : d.bloodLossMl >= 500 ? "warn" : undefined}>{d.bloodLossMl} mL</Flag> : "—",
              <span key="c" className="text-xs opacity-75">{d.complications || "—"}</span>,
              <span key="l" className="flex flex-wrap gap-3">
                <Link className={lk} href={`${BASE}/newborn/new?motherId=${idOf(d.patient)}&deliveryId=${d._id}`}>Newborn</Link>
                <Link className={lk} href={`${BASE}/postnatal/new?patientId=${idOf(d.patient)}&deliveryId=${d._id}`}>Postnatal</Link>
                {d.mode === "caesarean" && <Link className={lk} href={`${BASE}/delivery/caesarean/new?patientId=${idOf(d.patient)}&deliveryId=${d._id}`}>CS log</Link>}
              </span>,
            ])}
          />
        )}
      </>
    </Page>
  );
}
