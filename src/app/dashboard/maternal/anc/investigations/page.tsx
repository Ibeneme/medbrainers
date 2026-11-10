"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FlaskConical, Plus } from "lucide-react";
import { fetchAncInvestigations, fetchAncRecords } from "@/api/slices";
import {
  BASE,
  Btn,
  DataTable,
  Empty,
  Header,
  Loader,
  MPill,
  Page,
  SectionCard,
  fmtDate,
  gaLabel,
  gestationDays,
  nameOf,
  useMat,
} from "@/components/maternity/mat-ui";
import { CustomDropdown } from "@/components/ui/items";

function Inner() {
  const sp = useSearchParams();
  const { facilityId, act, maternity, activeFacility, ui, isDark, colors } =
    useMat();
  const [ancId, setAncId] = useState(sp.get("ancId") || "");

  useEffect(() => {
    if (facilityId)
      act(fetchAncRecords({ facilityId, status: "active" }), false);
  }, [facilityId, act]);
  useEffect(() => {
    if (facilityId && ancId)
      act(fetchAncInvestigations({ facilityId, id: ancId }), false);
  }, [facilityId, ancId, act]);

  const rows = maternity.investigations.filter(
    (i) => i.antenatalRecord === ancId
  );
  const options = maternity.anc.map((r) => ({
    value: r._id,
    label: `${nameOf(r.patient)} · ${r.registrationNo || "no reg."} · ${gaLabel(
      gestationDays(r)
    )}`,
  }));

  return (
    <Page>
      <Header
        icon={<FlaskConical size={22} />}
        title="Antenatal Scans & Labs"
        subtitle={activeFacility?.name}
        actions={
          ancId ? (
            <Btn href={`${BASE}/anc/${ancId}/investigation`}>
              <Plus size={16} /> Order investigation
            </Btn>
          ) : undefined
        }
      />
      <>
        <div className="max-w-xl">
          <CustomDropdown
            value={ancId}
            options={options}
            onChange={setAncId}
            placeholder="Select an active pregnancy…"
            searchable
            isDark={isDark}
            colors={colors}
            border={ui.border}
          />
        </div>
      </>
      {ancId && (
        <>
          {maternity.listLoading && rows.length === 0 ? (
            <Loader />
          ) : (
            <DataTable
              head={["Requested", "Type", "Test", "Result", "Notes"]}
              empty="No scans or labs ordered for this pregnancy yet."
              rows={rows.map((i) => [
                fmtDate(i.requestedDate),
                <MPill key="t" value={i.type} />,
                <span key="n" className="font-semibold">
                  {i.name}
                </span>,
                i.result || (
                  <span key="p" className="opacity-50">
                    Awaiting result
                  </span>
                ),
                <span key="o" className="text-xs opacity-70">
                  {i.notes || "—"}
                </span>,
              ])}
            />
          )}
        </>
      )}
      {!ancId && (
        <Empty>
          Select a pregnancy to see its scans and lab investigations.
        </Empty>
      )}
    </Page>
  );
}

export default function AncInvestigationsPage() {
  return (
    <Suspense
      fallback={
        <Page>
          <Loader />
        </Page>
      }
    >
      <Inner />
    </Suspense>
  );
}
