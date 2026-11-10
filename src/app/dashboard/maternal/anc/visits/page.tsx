"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Plus } from "lucide-react";
import { fetchAncRecords } from "@/api/slices";
import { AncRow } from "@/components/maternity/AncRow";
import {
  BASE, Btn, ENUMS, Empty, Header, Loader, Page, Pills, SearchBox, SectionCard, label, matchesPatient, toOpts, useMat,
} from "@/components/maternity/mat-ui";
import { CustomDropdown } from "@/components/ui/items";

export default function AncListPage() {
  const { facilityId, act, maternity, activeFacility, ui, isDark, colors } = useMat();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("active");
  const [risk, setRisk] = useState("");

  useEffect(() => {
    if (!facilityId) return;
    act(
      fetchAncRecords({
        facilityId,
        status: status === "all" ? undefined : (status as any),
        riskLevel: (risk || undefined) as any,
      }),
      false,
    );
  }, [facilityId, act, status, risk]);

  const rows = maternity.anc.filter((r) => matchesPatient(r.patient, q));

  return (
    <Page>
      <Header
        icon={<CalendarClock size={22} />}
        title="ANC Visits & Follow-ups"
        subtitle={activeFacility?.name}
        actions={
          <Btn href={`${BASE}/anc/register`}>
            <Plus size={16} /> Register booking
          </Btn>
        }
      />
      <>
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox value={q} onChange={setQ} placeholder="Search mother name or MRN…" />
          <div className="w-44">
            <CustomDropdown
              value={risk}
              options={[{ label: "All risk levels", value: "" }, ...toOpts(ENUMS.riskLevels)]}
              onChange={setRisk}
              placeholder="Risk level"
              isDark={isDark}
              colors={colors}
              border={ui.border}
            />
          </div>
        </div>
        <Pills
          value={status}
          onChange={setStatus}
          options={[{ value: "all", label: "All" }, ...ENUMS.pregnancyStatuses.map((s) => ({ value: s, label: label(s) }))]}
        />
        {maternity.listLoading && maternity.anc.length === 0 ? (
          <Loader text="Loading pregnancies…" />
        ) : rows.length === 0 ? (
          <Empty>No pregnancies match. Register an ANC booking to get started.</Empty>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <AncRow key={r._id} r={r} />
            ))}
          </div>
        )}
      </>
    </Page>
  );
}
