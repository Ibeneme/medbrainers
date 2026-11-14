"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "@/components/access/guarded-link";
import { Boxes } from "lucide-react";
import { useAppDispatch } from "@/api/hooks";
import {
  fetchSterilization,
  fetchTheaterRecords,
} from "@/api/slices/theaterSlice";
import {
  Banner,
  Btn,
  DataTable,
  Header,
  Loader,
  Page,
  Pill,
  Pills,
  SectionCard,
  Stat,
  TBASE,
  fmtDateTime,
  label,
  useTH,
} from "@/components/theater/th-ui";

export default function TheatreInventoryPage() {
  const { facilityId, act, theater, activeFacility } = useTH();
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState("implants");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!facilityId) return;
    act(fetchSterilization({ facilityId }), false);
    setMissing(false);
    (["implants", "counts"] as const).forEach((kind) =>
      dispatch(fetchTheaterRecords({ facilityId, kind }))
        .unwrap()
        .catch(() => setMissing(true))
    );
  }, [facilityId, act, dispatch]);

  const implants: any[] = theater.records.implants || [];
  const counts: any[] = theater.records.counts || [];

  const byName = useMemo(() => {
    const m = new Map<
      string,
      {
        name: string;
        qty: number;
        uses: number;
        lots: Set<string>;
        last: string;
      }
    >();
    implants.forEach((i) => {
      const k = (i.implantName || "").trim().toLowerCase();
      const row = m.get(k) || {
        name: i.implantName,
        qty: 0,
        uses: 0,
        lots: new Set<string>(),
        last: i.createdAt,
      };
      row.qty += i.quantity || 1;
      row.uses++;
      if (i.lotNumber) row.lots.add(i.lotNumber);
      if (i.createdAt > row.last) row.last = i.createdAt;
      m.set(k, row);
    });
    return [...m.values()].sort((a, b) => b.qty - a.qty);
  }, [implants]);

  const bad = counts.filter((c) => !c.correct);
  const cssd = theater.cssd;
  const ready = cssd.filter((c) => c.result === "pass").length;

  return (
    <Page>
      <Header
        icon={<Boxes size={22} />}
        title="Theatre Inventory"
        subtitle={`${
          activeFacility?.name || ""
        } · implants, counts and sterile stock`}
        actions={
          <>
            <Btn href={`${TBASE}/implants/new`} tone="card">
              Add implant
            </Btn>
            <Btn href={`${TBASE}/cssd/new`}>Start sterilization</Btn>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Implant types used"
          value={missing ? "—" : byName.length}
          sub="distinct items"
        />
        <Stat
          label="Units implanted"
          value={missing ? "—" : byName.reduce((n, r) => n + r.qty, 0)}
          sub="total quantity"
        />
        <Stat
          label="Count discrepancies"
          value={missing ? "—" : bad.length}
          sub="need follow-up"
          tone={bad.length ? "bad" : undefined}
        />
        <Stat
          label="Sterile loads passed"
          value={ready}
          sub={`${cssd.filter((c) => !c.result).length} still running`}
        />
      </div>
      <>
        <Pills
          value={tab}
          onChange={setTab}
          options={[
            { value: "implants", label: "Implants" },
            { value: "counts", label: "Count discrepancies" },
            { value: "cssd", label: "Sterile processing" },
          ]}
        />
        {missing && tab !== "cssd" && (
          <Banner tone="info">
            Implant and count history needs the optional read endpoints on the
            server (server/theater-read-endpoints.patch.md).
          </Banner>
        )}
        {theater.listLoading &&
        !implants.length &&
        !missing &&
        tab !== "cssd" ? (
          <Loader />
        ) : tab === "implants" ? (
          <DataTable
            head={[
              "Implant / consumable",
              "Total used",
              "Cases",
              "Lots",
              "Last used",
            ]}
            empty="No implants recorded."
            rows={byName.map((r) => [
              r.name,
              r.qty,
              r.uses,
              [...r.lots].slice(0, 3).join(", ") || "—",
              fmtDateTime(r.last),
            ])}
          />
        ) : tab === "counts" ? (
          <DataTable
            head={["Item", "Type", "Initial → final", "When", ""]}
            empty="No discrepancies. 🎉"
            rows={bad.map((c) => [
              c.itemName,
              label(c.itemType),
              `${c.countInitial ?? "—"} → ${c.countFinal ?? "—"}`,
              fmtDateTime(c.createdAt),
              <Link
                key="l"
                href={`${TBASE}/schedule/${
                  typeof c.theatreCase === "object"
                    ? c.theatreCase._id
                    : c.theatreCase
                }`}
                className="text-xs font-semibold underline"
              >
                Case
              </Link>,
            ])}
          />
        ) : (
          <DataTable
            head={["Cycle", "Method", "Load", "Result"]}
            empty="No sterilization cycles."
            rows={cssd.slice(0, 30).map((c) => [
              <span key="n" className="font-mono text-xs">
                {c.cycleNo}
              </span>,
              c.method,
              c.loadDescription || "—",
              c.result ? (
                <Pill key="r" value={c.result} />
              ) : (
                <Pill key="r" tone="info">
                  Running
                </Pill>
              ),
            ])}
          />
        )}
      </>
    </Page>
  );
}
