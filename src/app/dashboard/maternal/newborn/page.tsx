"use client";

import { useEffect, useState } from "react";
import Link from "@/components/access/guarded-link";
import { Baby, Plus } from "lucide-react";
import { fetchNewborns } from "@/api/slices";
import {
  BASE,
  Btn,
  DataTable,
  ENUMS,
  Flag,
  Header,
  Loader,
  MPill,
  Page,
  PatientCell,
  Pills,
  SearchBox,
  SectionCard,
  bwClass,
  fmtDateTime,
  idOf,
  label,
  matchesPatient,
  useMat,
} from "@/components/maternity/mat-ui";

export default function NewbornRegistryPage() {
  const { facilityId, act, maternity, activeFacility } = useMat();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  useEffect(() => {
    if (facilityId)
      act(
        fetchNewborns({
          facilityId,
          status: status === "all" ? undefined : (status as any),
        }),
        false
      );
  }, [facilityId, act, status]);
  const rows = maternity.newborns.filter((n) => matchesPatient(n.mother, q));
  const lbw = rows.filter((n) => n.birthWeightGrams < 2500).length;
  return (
    <Page>
      <Header
        icon={<Baby size={22} />}
        title="Newborn Registry"
        subtitle={activeFacility?.name}
        actions={
          <>
            <Btn href={`${BASE}/newborn/screening`} tone="card">
              Screening
            </Btn>
            <Btn href={`${BASE}/newborn/new`}>
              <Plus size={16} /> Register newborn
            </Btn>
          </>
        }
      />
      <>
        <SearchBox
          value={q}
          onChange={setQ}
          placeholder="Search mother name or MRN…"
        />
        <Pills
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All" },
            ...ENUMS.newbornStatuses.map((s) => ({
              value: s,
              label: label(s),
            })),
          ]}
        />
        {maternity.listLoading && !maternity.newborns.length ? (
          <Loader />
        ) : (
          <DataTable
            head={[
              "Born",
              "Mother",
              "Sex",
              "Weight",
              "Apgar 1/5/10",
              "Status",
              "",
            ]}
            empty="No newborns registered."
            rows={rows.map((n) => {
              const bw = bwClass(n.birthWeightGrams);
              const low5 = n.apgar5 !== undefined && n.apgar5 < 7;
              return [
                fmtDateTime(n.birthDateTime),
                <PatientCell key="m" p={n.mother} />,
                label(n.sex),
                <span key="w">
                  {n.birthWeightGrams} g{" "}
                  {bw && bw.key !== "Normal" && (
                    <MPill tone={bw.tone}>{bw.key}</MPill>
                  )}
                </span>,
                <Flag key="a" tone={low5 ? "bad" : undefined}>
                  {[n.apgar1, n.apgar5, n.apgar10]
                    .map((x) => x ?? "–")
                    .join(" / ")}
                </Flag>,
                <MPill key="s" value={n.status} />,
                n.status === "well" ? (
                  <Link
                    key="l"
                    className="text-xs font-semibold underline"
                    href={`${BASE}/nicu/admit?newbornId=${n._id}`}
                  >
                    Admit NICU
                  </Link>
                ) : null,
              ];
            })}
          />
        )}
      </>
    </Page>
  );
}
