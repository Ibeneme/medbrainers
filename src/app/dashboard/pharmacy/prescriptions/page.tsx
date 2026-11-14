"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "@/components/access/guarded-link";
import {
  ClipboardList,
  LayoutGrid,
  List,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  fetchPrescriptions,
  type Prescription,
  type RxStatus,
} from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import {
  Chips,
  EmptyBox,
  PatientAvatar,
  PharmacyPage,
  Pill,
  PrimaryButton,
  SearchBar,
  StatCard,
  TableCard,
  Th,
  STATUS_COLORS,
  fmtDate,
  fmtDateTime,
  patientName,
  personName,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

const COLUMNS: Array<{ id: RxStatus; label: string }> = [
  { id: "pending", label: "Pending verification" },
  { id: "verified", label: "Verified" },
  { id: "partially_dispensed", label: "Partially dispensed" },
  { id: "dispensed", label: "Dispensed" },
];

const MAX_ITEMS_ON_CARD = 3;

export default function PrescriptionsQueuePage() {
  const { dispatch, facilityId, pharmacy } = usePharmacy();
  const { ui } = usePharmacyUI();
  const { prescriptions, listLoading } = pharmacy;

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | RxStatus>("all");
  const [view, setView] = useState<"list" | "board">("list");

  const load = () => facilityId && dispatch(fetchPrescriptions({ facilityId }));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: prescriptions.length };
    prescriptions.forEach((r) => (c[r.status] = (c[r.status] || 0) + 1));
    return c;
  }, [prescriptions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return prescriptions.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      const p: any = r.patient;
      return (
        r.rxNumber.toLowerCase().includes(q) ||
        `${p?.firstName || ""} ${p?.lastName || ""}`
          .toLowerCase()
          .includes(q) ||
        String(p?.mrn || "")
          .toLowerCase()
          .includes(q) ||
        r.items.some((i) => i.name.toLowerCase().includes(q))
      );
    });
  }, [prescriptions, search, status]);

  const hasAllergy = (r: Prescription) =>
    ((r.patient as any)?.allergies?.length ?? 0) > 0;

  return (
    <PharmacyPage
      routes={[
        { label: "Pharmacy", href: "/dashboard/pharmacy" },
        { label: "e-Prescriptions Queue" },
      ]}
      title="e-Prescriptions Queue"
      description="Verify incoming prescriptions, link them to catalog drugs, then send them to dispensing."
      icon={ClipboardList}
      loading={listLoading && prescriptions.length === 0}
      loadingText="Loading prescriptions..."
      onRefresh={load}
      actions={
        <PrimaryButton
          href="/dashboard/pharmacy/prescriptions/select"
          icon={Plus}
        >
          New Prescription
        </PrimaryButton>
      }
      guide={{
        title: "Prescription Workflow Guide & Tips",
        summary:
          "Pending → Verified → Dispensed. Verification requires every line to be linked to a catalog drug so stock and allergy checks can run.",
        columns: [
          {
            heading: "Pharmacist",
            points: [
              "Open a prescription and link each line to a catalog drug.",
              "Set the quantity to supply and refills allowed, then Verify.",
              "Dispense from Dispensing & Refills.",
            ],
          },
          {
            heading: "Prescribers",
            points: [
              "Create from the patient list or import a consultation's recommended drugs.",
              "Cancel with a reason if the order changes before dispensing.",
            ],
          },
        ],
      }}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {COLUMNS.map((c) => (
          <StatCard
            key={c.id}
            icon={ClipboardList}
            label={c.label}
            value={counts[c.id] || 0}
            color={STATUS_COLORS[c.id]}
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 min-w-0">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by Rx number, patient, MRN or drug..."
          />
        </div>
        <div
          className="flex rounded-full p-1 border self-start"
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          {(
            [
              ["list", List],
              ["board", LayoutGrid],
            ] as const
          ).map(([id, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold capitalize transition"
              style={{
                backgroundColor: view === id ? ui.inner : "transparent",
              }}
            >
              <Icon size={13} /> {id}
            </button>
          ))}
        </div>
      </div>

      {view === "list" && (
        <Chips
          label="Status:"
          value={status}
          onChange={setStatus}
          options={[
            { id: "all", label: "All", count: counts.all },
            ...(
              [
                "pending",
                "verified",
                "partially_dispensed",
                "dispensed",
                "cancelled",
              ] as RxStatus[]
            ).map((s) => ({
              id: s,
              label: s
                .replace(/_/g, " ")
                .replace(/^\w/, (c) => c.toUpperCase()),
              count: counts[s] || 0,
            })),
          ]}
        />
      )}

      {filtered.length === 0 ? (
        <EmptyBox
          icon={ClipboardList}
          title="No prescriptions found."
          hint="Create one from the patient list, or import a consultation's recommended drugs."
          action={
            <PrimaryButton
              href="/dashboard/pharmacy/prescriptions/select"
              icon={Plus}
            >
              New Prescription
            </PrimaryButton>
          }
        />
      ) : view === "list" ? (
        <TableCard minWidth={760}>
          <thead>
            <tr
              className="text-xs opacity-50 border-b"
              style={{ borderColor: ui.border }}
            >
              <Th>Patient</Th>
              <Th>Rx</Th>
              <Th className="hidden md:table-cell">Items</Th>
              <Th className="hidden lg:table-cell">Prescriber</Th>
              <Th>Priority</Th>
              <Th>Status</Th>
              <Th className="hidden sm:table-cell">Date</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const p: any = r.patient;
              return (
                <tr
                  key={r._id}
                  className="border-b last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition"
                  style={{ borderColor: ui.border }}
                >
                  <td className="px-3 py-3.5">
                    <Link
                      href={`/dashboard/pharmacy/prescriptions/${r._id}`}
                      className="flex items-center gap-3"
                    >
                      <PatientAvatar p={p} />
                      <div className="min-w-0">
                        <p className="font-semibold text-xs truncate flex items-center gap-1.5">
                          {patientName(p)}
                          {hasAllergy(r) && (
                            <AlertTriangle
                              size={12}
                              className="text-amber-500 shrink-0"
                            />
                          )}
                        </p>
                        {p?.mrn && (
                          <p className="text-[11px] opacity-50">MRN: {p.mrn}</p>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-3.5">
                    <span
                      className="rounded-full px-2.5 py-1 font-mono text-[11px]"
                      style={{ backgroundColor: ui.inner }}
                    >
                      {r.rxNumber}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-xs opacity-70 hidden md:table-cell max-w-[260px] truncate">
                    {r.items.map((i) => i.name).join(", ")}
                  </td>
                  <td className="px-3 py-3.5 text-xs opacity-70 hidden lg:table-cell">
                    {personName(r.prescriber)}
                  </td>
                  <td className="px-3 py-3.5">
                    <Pill status={r.priority} />
                  </td>
                  <td className="px-3 py-3.5">
                    <Pill status={r.status} />
                  </td>
                  <td className="px-3 py-3.5 text-xs opacity-60 hidden sm:table-cell">
                    {fmtDateTime(r.prescribedAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableCard>
      ) : (
        /* ─── Kanban board ───────────────────────────────
           Each column has a fixed width and scrolls vertically on its own;
           the whole board scrolls sideways, so nothing overflows the page. */
        <div className="min-w-0">
          <div className="flex items-start gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:thin]">
            {COLUMNS.map((col) => {
              const items = filtered.filter((r) => r.status === col.id);
              return (
                <section
                  key={col.id}
                  className="w-[290px] shrink-0 snap-start overflow-hidden rounded-2xl border xl:w-auto xl:min-w-[250px] xl:flex-1"
                  style={{ backgroundColor: ui.inner, borderColor: ui.border }}
                >
                  {/* Column header */}
                  <header
                    className="flex items-center justify-between gap-2 border-b px-4 py-3"
                    style={{
                      borderColor: ui.border,
                      borderTop: `3px solid ${PRIMARY_COLOR}`,
                    }}
                  >
                    <h3 className="min-w-0 truncate text-xs font-bold">
                      {col.label}
                    </h3>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{ backgroundColor: ui.card }}
                    >
                      {items.length}
                    </span>
                  </header>

                  {/* Cards (scroll inside the column) */}
                  <div className="max-h-[68vh] space-y-2.5 overflow-y-auto p-3 [scrollbar-width:thin]">
                    {items.length === 0 ? (
                      <div
                        className="rounded-xl border border-dashed py-8 text-center text-[11px] opacity-50"
                        style={{ borderColor: ui.border }}
                      >
                        No prescriptions
                      </div>
                    ) : (
                      items.map((r) => {
                        const p: any = r.patient;
                        const shown = r.items.slice(0, MAX_ITEMS_ON_CARD);
                        const extra = r.items.length - shown.length;
                        return (
                          <Link
                            key={r._id}
                            href={`/dashboard/pharmacy/prescriptions/${r._id}`}
                            className="block min-w-0 space-y-3 rounded-xl border p-3 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                            style={{
                              backgroundColor: ui.card,
                              borderColor: ui.border,
                            }}
                          >
                            {/* Rx number + priority */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate font-mono text-[11px] opacity-60">
                                {r.rxNumber}
                              </span>
                              {r.priority !== "routine" && (
                                <Pill status={r.priority} />
                              )}
                            </div>

                            {/* Patient */}
                            <div className="flex min-w-0 items-center gap-2.5">
                              <PatientAvatar p={p} />
                              <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-1.5 text-xs font-semibold">
                                  <span className="truncate">
                                    {patientName(p)}
                                  </span>
                                  {hasAllergy(r) && (
                                    <AlertTriangle
                                      size={12}
                                      className="shrink-0"
                                      aria-label="Allergy on record"
                                    />
                                  )}
                                </p>
                                {p?.mrn && (
                                  <p className="truncate text-[11px] opacity-50">
                                    MRN: {p.mrn}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Items */}
                            <ul className="space-y-1 text-[11px] opacity-70">
                              {shown.map((i, idx) => (
                                <li key={idx} className="flex min-w-0 gap-1.5">
                                  <span className="opacity-50">•</span>
                                  <span className="truncate">{i.name}</span>
                                </li>
                              ))}
                              {extra > 0 && (
                                <li className="opacity-60">+{extra} more</li>
                              )}
                            </ul>

                            {/* Footer */}
                            <div
                              className="flex items-center justify-between gap-2 border-t pt-2 text-[10.5px] opacity-60"
                              style={{ borderColor: ui.border }}
                            >
                              <span className="min-w-0 truncate">
                                {personName(r.prescriber)}
                              </span>
                              <span className="shrink-0">
                                {fmtDate(r.prescribedAt)}
                              </span>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </PharmacyPage>
  );
}
