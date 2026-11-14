"use client";

import { useEffect, useState } from "react";
import Link from "@/components/access/guarded-link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchDischargeSummary, fetchMyFacilities } from "@/api/slices";
import type { DischargeSummary } from "@/api/types";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { DISPOSITION_LABEL } from "@/components/wards/discharge-ui";

const personName = (p: unknown) => {
  if (!p || typeof p === "string") return "—";
  const x = p as { firstName?: string; lastName?: string; mrn?: string };
  return `${x.firstName || ""} ${x.lastName || ""}`.trim() || x.mrn || "—";
};

function Block({
  title,
  children,
  placeholder = "No details added.",
}: {
  title: string;
  children?: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <section className="break-inside-avoid space-y-1.5">
      <h2 className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
        {title}
      </h2>
      <div
        className={`whitespace-pre-wrap text-sm leading-relaxed ${
          !children ? "opacity-40 italic" : ""
        }`}
      >
        {children || placeholder}
      </div>
    </section>
  );
}

export default function DischargeSummaryPage() {
  const { summaryId } = useParams() as { summaryId: string };
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const ui = getUI(theme === "dark", colors);
  const { activeFacilityId } = useAppSelector((s) => s.facilities);

  const [data, setData] = useState<DischargeSummary | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">(
    "loading"
  );

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  // Fetches by id itself, so a hard reload on this URL works.
  useEffect(() => {
    if (!activeFacilityId || !summaryId) return;
    let cancelled = false;
    setState("loading");
    dispatch(fetchDischargeSummary({ facilityId: activeFacilityId, summaryId }))
      .unwrap()
      .then((res: any) => {
        if (cancelled) return;
        setData(res?.data || null);
        setState(res?.data ? "ready" : "missing");
      })
      .catch(() => !cancelled && setState("missing"));
    return () => {
      cancelled = true;
    };
  }, [dispatch, activeFacilityId, summaryId]);

  if (state !== "ready" || !data) {
    return (
      <div
        className="mx-auto max-w-md py-16 text-center text-xs opacity-60"
        style={{ color: ui.text }}
      >
        {state === "missing" ? (
          <>
            Discharge summary not found.{" "}
            <Link href="/dashboard/wards/discharges" className="underline">
              Back to discharges
            </Link>
          </>
        ) : (
          "Loading discharge summary…"
        )}
      </div>
    );
  }

  const d: any = data;
  const patient = d.patient || {};
  const ward = d.admission?.ward;

  return (
    <div
      className="mx-auto max-w-3xl space-y-5 px-3 py-5 sm:px-6"
      style={{ color: ui.text }}
    >
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href="/dashboard/wards/discharges"
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: ui.card }}
        >
          <ArrowLeft size={15} />
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold text-white"
          style={{ backgroundColor: PRIMARY_COLOR }}
        >
          <Printer size={14} /> Print
        </button>
      </div>

      <article
        className="space-y-5 rounded-3xl p-6 print:rounded-none print:p-0"
        style={{ backgroundColor: ui.card }}
      >
        <header
          className="space-y-1 border-b pb-4"
          style={{ borderColor: ui.border }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
            Discharge summary
          </p>
          <h1 className="text-xl font-semibold">{personName(patient)}</h1>
          <p className="text-xs opacity-60">
            {patient.mrn && <span className="font-mono">{patient.mrn} · </span>}
            {patient.gender && (
              <span className="capitalize">{patient.gender} · </span>
            )}
            {ward?.name || "Ward"}
            {d.admission?.bedCode ? ` · Bed ${d.admission.bedCode}` : ""}
          </p>
          <p className="text-xs opacity-60">
            {d.admission?.admittedAt
              ? `Admitted ${new Date(
                  d.admission.admittedAt
                ).toLocaleString()} · `
              : ""}
            Discharged {new Date(d.dischargedAt).toLocaleString()}
            {d.dischargedBy ? ` by ${personName(d.dischargedBy)}` : ""}
          </p>
        </header>

        <Block
          title="Principal diagnosis"
          placeholder="No principal diagnosis recorded."
        >
          {d.diagnosis}
        </Block>
        <Block
          title="Secondary diagnoses"
          placeholder="No secondary diagnoses recorded."
        >
          {d.secondaryDiagnoses?.length
            ? d.secondaryDiagnoses.join(", ")
            : undefined}
        </Block>
        <Block title="Procedures" placeholder="No procedures recorded.">
          {d.procedures}
        </Block>
        <Block
          title="Hospital course"
          placeholder="No hospital course details recorded."
        >
          {d.hospitalCourse}
        </Block>
        <Block
          title="Condition on discharge"
          placeholder="No condition notes recorded."
        >
          {d.conditionOnDischarge}
        </Block>
        <Block title="Disposition" placeholder="No disposition recorded.">
          {d.disposition
            ? `${DISPOSITION_LABEL[d.disposition || "home"] || d.disposition}${
                d.transferToFacility ? ` — ${d.transferToFacility}` : ""
              }`
            : undefined}
        </Block>

        <section className="space-y-1.5">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
            Medications on discharge
          </h2>
          {d.medicationsOnDischarge && (
            <p className="whitespace-pre-wrap text-sm">
              {d.medicationsOnDischarge}
            </p>
          )}
          {!!d.dischargeMedications?.length ? (
            <ul className="space-y-1 text-sm">
              {d.dischargeMedications.map((m: any, i: number) => (
                <li key={i}>
                  <span className="font-semibold">{m.drugName}</span>
                  {[m.dose, m.route, m.frequency, m.duration]
                    .filter(Boolean)
                    .map((x: string) => ` · ${x}`)
                    .join("")}
                </li>
              ))}
            </ul>
          ) : !d.medicationsOnDischarge ? (
            <p className="text-sm opacity-40 italic">
              No medications on discharge recorded.
            </p>
          ) : null}
        </section>

        <Block
          title="Follow-up instructions"
          placeholder="No follow-up instructions provided."
        >
          {d.followUpInstructions}
        </Block>
        <Block
          title="Follow-up appointment"
          placeholder="No follow-up appointment scheduled."
        >
          {d.followUpDate || d.followUpProvider
            ? [
                d.followUpDate && new Date(d.followUpDate).toLocaleDateString(),
                d.followUpProvider,
              ]
                .filter(Boolean)
                .join(" · ")
            : undefined}
        </Block>
        <Block
          title="Diet"
          placeholder="No specific diet recommendations recorded."
        >
          {d.diet}
        </Block>
        <Block
          title="Activity"
          placeholder="No activity restrictions recorded."
        >
          {d.activity}
        </Block>
        <Block
          title="Return to hospital if"
          placeholder="No warning signs recorded."
        >
          {d.warnings}
        </Block>

        <section className="space-y-1.5">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
            Referrals
          </h2>
          {!!d.referrals?.length ? (
            <ul className="space-y-1 text-sm">
              {d.referrals.map((r: any, i: number) => (
                <li key={i}>
                  <span className="font-semibold capitalize">{r.type}</span> ·{" "}
                  {r.reason}
                  {r.priority && r.priority !== "routine"
                    ? ` (${r.priority})`
                    : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm opacity-40 italic">No referrals added.</p>
          )}
        </section>

        <section className="space-y-1.5">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
            Planned surgery
          </h2>
          {!!d.surgeryBookings?.length ? (
            <ul className="space-y-1 text-sm">
              {d.surgeryBookings.map((s: any, i: number) => (
                <li key={i}>
                  {s.procedure}
                  {s.plannedDate
                    ? ` · ${new Date(s.plannedDate).toLocaleDateString()}`
                    : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm opacity-40 italic">No procedures planned.</p>
          )}
        </section>

        <Block title="Notes" placeholder="No additional notes recorded.">
          {d.notes}
        </Block>
      </article>
    </div>
  );
}
