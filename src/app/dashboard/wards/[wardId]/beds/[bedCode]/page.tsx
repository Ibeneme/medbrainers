"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "@/components/access/guarded-link";
import { ArrowLeft, FolderOpen, LogOut } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { updateBedStatus } from "@/api/slices";
import { useWardsData } from "@/hooks/useWardsData";
import type { BedStatus, WardBed } from "@/api/types";
import { useTheme } from "@/contexts/theme-context";
import { useToast } from "@/contexts/toast-context";
import { getUI, PRIMARY_COLOR } from "@/constants/colors";

const typeLabel = (t?: string) =>
  t === "icu" || t === "nicu" ? t.toUpperCase() : t || "general";

const BED_STATUS_LABEL: Record<BedStatus, string> = {
  available: "Available",
  occupied: "Occupied",
  reserved: "Reserved",
  cleaning: "Cleaning",
  maintenance: "Maintenance",
  blocked: "Blocked",
};

const occupantOf = (b: WardBed) => (b as any).occupant || (b as any).patient;

const initialsOf = (name?: string) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function BedDetailPage() {
  const params = useParams();
  const wardId = params.wardId as string;
  const rawBedCode = params.bedCode as string;
  const bedCode = decodeURIComponent(rawBedCode || "").trim();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors);

  const { activeFacilityId } = useAppSelector((s) => s.facilities);
  // Loads wards itself (correctly, once) so a hard reload on this URL works.
  const { wards, ready } = useWardsData();

  const ward = wards.find((w) => w._id === wardId);

  // Fallback scan: if ward isn't found by wardId, try searching all beds across all wards
  // in case the URL segment order is reversed or ID maps differently.
  const resolvedWard =
    ward ||
    wards.find((w) =>
      w.beds?.some(
        (b) =>
          b.code === rawBedCode ||
          b.code === bedCode ||
          b.code.toLowerCase() === bedCode.toLowerCase()
      )
    );

  const bed =
    resolvedWard?.beds?.find(
      (b) =>
        b.code === rawBedCode ||
        b.code === bedCode ||
        b.code.toLowerCase() === bedCode.toLowerCase()
    );

  const targetWardId = resolvedWard?._id || wardId;

  const [confirmStatus, setConfirmStatus] = useState<Exclude<
    BedStatus,
    "occupied"
  > | null>(null);
  const [saving, setSaving] = useState(false);

  if (!resolvedWard || !bed) {
    if (!ready) {
      return (
        <div className="mx-auto max-w-md py-16 text-center text-xs opacity-60">
          Loading bed details...
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-md py-16 text-center text-xs opacity-60">
        Bed not found.{" "}
        <Link
          href={
            targetWardId
              ? `/dashboard/wards/${targetWardId}`
              : "/dashboard/wards"
          }
          className="underline"
        >
          Back to ward
        </Link>
      </div>
    );
  }

  const occ = occupantOf(bed);
  const isOccupied = bed.status === "occupied";

  const actions: {
    status: Exclude<BedStatus, "occupied">;
    label: string;
    primary?: boolean;
    danger?: boolean;
  }[] =
    bed.status === "cleaning"
      ? [
          { status: "available", label: "Mark cleaned & ready", primary: true },
          { status: "maintenance", label: "Needs maintenance", danger: true },
        ]
      : bed.status === "available"
      ? [
          { status: "reserved", label: "Reserve bed", primary: true },
          { status: "maintenance", label: "Set maintenance", danger: true },
          { status: "blocked", label: "Block bed", danger: true },
        ]
      : bed.status === "reserved"
      ? [
          { status: "available", label: "Release reservation", primary: true },
          { status: "maintenance", label: "Set maintenance", danger: true },
        ]
      : bed.status === "maintenance" || bed.status === "blocked"
      ? [{ status: "available", label: "Back in service", primary: true }]
      : [];

  const handleStatus = async (status: Exclude<BedStatus, "occupied">) => {
    if (!activeFacilityId) {
      return;
    }
    setSaving(true);
    try {
      const result = await dispatch(
        updateBedStatus({
          facilityId: activeFacilityId,
          wardId: resolvedWard._id,
          bedCode: bed.code,
          status,
        })
      ).unwrap();
      showToast(
        `Bed ${bed.code} is now ${BED_STATUS_LABEL[status].toLowerCase()}`
      );
      setConfirmStatus(null);
      router.push(`/dashboard/wards/${resolvedWard._id}`);
    } catch (err) {
      showToast(
        typeof err === "string" ? err : "Could not update bed",
        "error"
      );
      setSaving(false);
    }
  };

  const getActionConfig = (status: Exclude<BedStatus, "occupied">) => {
    switch (status) {
      case "available":
        return {
          title:
            bed.status === "cleaning"
              ? "Mark cleaned & ready"
              : bed.status === "reserved"
              ? "Release reservation"
              : "Back in service",
          message: `Are you sure you want to put bed ${bed.code} back in service? It will become available for new admissions.`,
        };
      case "reserved":
        return {
          title: "Reserve bed",
          message: `Are you sure you want to reserve bed ${bed.code}? It will be held and not offered for new admissions until released.`,
        };
      case "maintenance":
        return {
          title: "Set maintenance",
          message: `Are you sure you want to set bed ${bed.code} to maintenance? It will be taken out of service.`,
        };
      case "blocked":
        return {
          title: "Block bed",
          message: `Are you sure you want to block bed ${bed.code}? It will be unavailable for admissions.`,
        };
      default:
        return {
          title: "Update status",
          message: `Are you sure you want to update the status of bed ${bed.code}?`,
        };
    }
  };

  const activeActionConfig = confirmStatus
    ? getActionConfig(confirmStatus)
    : null;
  const activeActionObj = confirmStatus
    ? actions.find((a) => a.status === confirmStatus)
    : null;

  const card = "rounded-2xl p-5 sm:p-6";

  return (
    <div
      className="mx-auto max-w-3xl space-y-5 px-3 py-6 sm:px-6"
      style={{ color: ui.text }}
    >
      {/* ─── Header ─────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/wards/${resolvedWard._id}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          style={{ backgroundColor: ui.card }}
          aria-label="Back to ward"
        >
          <ArrowLeft size={15} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">
            Bed {bed.code}
          </h1>
          <p className="truncate text-xs opacity-60">
            {resolvedWard.name} · {typeLabel(resolvedWard.type)}
          </p>
        </div>
        <span
          className="ml-auto shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold"
          style={
            isOccupied
              ? { backgroundColor: PRIMARY_COLOR, color: "#FFFFFF" }
              : { backgroundColor: ui.card }
          }
        >
          {BED_STATUS_LABEL[bed.status]}
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_260px] md:items-start">
        {/* ─── Main: occupant or empty state ───────── */}
        <section
          className={`${card} space-y-4`}
          style={{ backgroundColor: ui.card }}
        >
          <h2 className="text-sm font-semibold">
            {isOccupied ? "Current patient" : "Bed status"}
          </h2>

          {isOccupied ? (
            occ ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                    style={{
                      backgroundColor: `${PRIMARY_COLOR}1F`,
                      color: PRIMARY_COLOR,
                    }}
                  >
                    {initialsOf(occ.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{occ.name}</p>
                    {occ.mrn && (
                      <p className="font-mono text-[11px] opacity-60">
                        {occ.mrn}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  {[
                    ["Diagnosis", occ.diagnosis],
                    [
                      "Admitted",
                      occ.admittedAt
                        ? new Date(occ.admittedAt).toLocaleString()
                        : undefined,
                    ],
                  ]
                    .filter(([, v]) => !!v)
                    .map(([k, v]) => (
                      <div
                        key={k as string}
                        className="flex items-start justify-between gap-4 py-2.5 text-xs"
                      >
                        <span className="opacity-50">{k}</span>
                        <span className="text-right font-medium">{v}</span>
                      </div>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {occ.id && (
                    <Link
                      href={`/dashboard/patients/${occ.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: PRIMARY_COLOR }}
                    >
                      <FolderOpen size={13} /> Open folder
                    </Link>
                  )}
                  <Link
                    href="/dashboard/wards/discharges"
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                    style={{ backgroundColor: ui.inner }}
                  >
                    <LogOut size={13} /> Discharge
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-xs opacity-65">Patient details unavailable.</p>
            )
          ) : (
            <div
              className="rounded-xl py-10 text-center text-xs opacity-60"
              style={{ backgroundColor: ui.inner }}
            >
              No patient in this bed.
            </div>
          )}
        </section>

        {/* ─── Side: details + actions ─────────────── */}
        <div className="space-y-5">
          <section className={card} style={{ backgroundColor: ui.card }}>
            <h2 className="mb-1 text-sm font-semibold">Details</h2>
            {[
              ["Bed", bed.code],
              ["Ward", resolvedWard.name],
              ["Type", typeLabel(resolvedWard.type)],
              ["Floor", resolvedWard.floor || "—"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-start justify-between gap-4 py-2.5 text-xs"
              >
                <span className="opacity-50">{k}</span>
                <span className="break-words text-right font-medium capitalize">
                  {v}
                </span>
              </div>
            ))}
          </section>

          <section
            className={`${card} space-y-3`}
            style={{ backgroundColor: ui.card }}
          >
            <h2 className="text-sm font-semibold">Actions</h2>
            {isOccupied ? (
              <p className="text-[11px] leading-relaxed opacity-55">
                An occupied bed is released automatically when the patient is
                discharged or transferred.
              </p>
            ) : actions.length === 0 ? (
              <p className="text-[11px] opacity-55">No actions available.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {actions.map((a) => (
                  <button
                    key={a.status}
                    type="button"
                    onClick={() => {
                      setConfirmStatus(a.status);
                    }}
                    className="w-full rounded-xl px-4 py-2.5 text-xs font-semibold transition-opacity hover:opacity-90"
                    style={
                      a.primary
                        ? { backgroundColor: PRIMARY_COLOR, color: "#FFFFFF" }
                        : a.danger
                        ? { backgroundColor: "#ef444426", color: "#ef4444" }
                        : { color: ui.text, backgroundColor: ui.inner }
                    }
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ─── Confirmation Modal ──────────────────────── */}
      {confirmStatus && activeActionConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-3xl p-6 space-y-4 shadow-xl"
            style={{ backgroundColor: ui.card, color: ui.text }}
          >
            <h3 className="text-lg font-semibold">
              {activeActionConfig.title}
            </h3>
            <p className="text-xs leading-relaxed opacity-70">
              {activeActionConfig.message}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setConfirmStatus(null);
                }}
                className="rounded-xl px-4 py-2 text-xs font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                style={{ backgroundColor: ui.inner }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleStatus(confirmStatus)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={
                  activeActionObj?.danger
                    ? { backgroundColor: "#ef4444" }
                    : { backgroundColor: PRIMARY_COLOR }
                }
              >
                {saving ? "Updating..." : activeActionObj?.label || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
