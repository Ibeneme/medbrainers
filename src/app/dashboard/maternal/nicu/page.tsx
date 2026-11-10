"use client";

import { useEffect } from "react";
import { Baby, Plus } from "lucide-react";
import { fetchNicu } from "@/api/slices";
import {
  BASE,
  Btn,
  DataTable,
  Header,
  Loader,
  MPill,
  Page,
  PatientCell,
  SectionCard,
  bwClass,
  fmtDateTime,
  fmtDuration,
  label,
  minutesBetween,
  useMat,
} from "@/components/maternity/mat-ui";

export default function NicuPage() {
  const { facilityId, act, maternity, activeFacility } = useMat();
  useEffect(() => {
    if (!facilityId) return;
    const load = () => act(fetchNicu({ facilityId }), false);
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [facilityId, act]);
  const rows = maternity.nicu;
  return (
    <Page>
      <Header
        icon={<Baby size={22} />}
        title="NICU / SCBU"
        subtitle={activeFacility?.name}
        actions={
          <Btn href={`${BASE}/nicu/admit`}>
            <Plus size={16} /> Admit baby
          </Btn>
        }
      />
      <>
        {maternity.listLoading && !rows.length ? (
          <Loader />
        ) : (
          <DataTable
            head={[
              "Admitted",
              "Baby of",
              "Sex / weight",
              "Reason",
              "Diagnosis",
              "Bed",
              "Stay",
            ]}
            empty="No babies in NICU / SCBU."
            rows={rows.map((a) => {
              const nb = typeof a.newborn === "object" ? a.newborn : undefined;
              const bw = bwClass(nb?.birthWeightGrams);
              return [
                fmtDateTime(a.admittedAt),
                <PatientCell key="m" p={nb?.mother} />,
                <span key="w">
                  {label(nb?.sex)} · {nb?.birthWeightGrams ?? "—"} g{" "}
                  {bw && bw.key !== "Normal" && (
                    <MPill tone={bw.tone}>{bw.key}</MPill>
                  )}
                </span>,
                <span key="r" className="text-xs">
                  {a.reason}
                </span>,
                <span key="d" className="text-xs opacity-75">
                  {a.diagnosis || "—"}
                </span>,
                a.bedCode || "—",
                fmtDuration(minutesBetween(a.admittedAt)),
              ];
            })}
          />
        )}
      </>
    </Page>
  );
}
