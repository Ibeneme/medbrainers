"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { Database, History, RefreshCw } from "lucide-react";
import { fetchCompanySummary, fetchTransfers } from "@/api/slices";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  ModuleShell,
  ActionLink,
  EmptyState,
  StatusPill,
  useInputStyles,
} from "@/components/dashboard/ModuleShell";
import { useDataManagement } from "@/hooks/useDataManagement";
import StorageGauge from "@/components/data-management/StorageGauge";
import ModuleBreakdown from "@/components/data-management/ModuleBreakdown";
import {
  TRANSFER_COLOR,
  fmtCell,
  fmtDateTime,
  fmtNumber,
  humanBytes,
} from "@/components/data-management/format";

export default function DataManagementPage() {
  const { facilityId, dispatch, dataManagement } = useDataManagement();
  const { ui, cardCls } = useInputStyles();
  const { summary, transfers, loading, error } = dataManagement;

  const load = useCallback(async () => {
    if (!facilityId) return;
    dispatch(fetchCompanySummary({ facilityId }));
    dispatch(fetchTransfers({ facilityId, limit: 5 }));
  }, [dispatch, facilityId]);

  useEffect(() => {
    load();
  }, [load]);

  const cards = (summary?.datasets ?? []).map((d) => ({ ...d }));

  return (
    <ModuleShell
      title="Data management"
      subtitle="Storage, export & import"
      icon={Database}
      loading={loading && !summary}
      actions={
        <>
          <ActionLink href="/dashboard/data-management/transfers">
            Transfer history
          </ActionLink>
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-xs font-semibold"
            style={{ borderColor: ui.border }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </>
      }
    >
      {error && !summary && (
        <div
          className="rounded-2xl px-4 py-2 text-xs font-semibold"
          style={{ backgroundColor: "rgba(220,38,38,0.12)", color: "#dc2626" }}
        >
          {error}
        </div>
      )}

      {summary && (
        <>
          <StorageGauge storage={summary.storage} />
          <ModuleBreakdown modules={summary.storage.modules} />
        </>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold">Datasets</p>
        {cards.length === 0 ? (
          <div
            className={cardCls}
            style={{ backgroundColor: ui.card, borderColor: ui.border }}
          >
            <EmptyState text="No datasets available." />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {cards.map((d) => (
              <Link
                key={d.key}
                href={`/dashboard/data-management/${d.key}`}
                className="group block rounded-[24px] border p-5 transition hover:opacity-90"
                style={{ backgroundColor: ui.card, borderColor: ui.border }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">
                      {d.label}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs opacity-55">
                      {d.description}
                    </p>
                  </div>
                  {d.count !== undefined && (
                    <span
                      className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: `${PRIMARY_COLOR}22`,
                        color: PRIMARY_COLOR,
                      }}
                    >
                      {fmtNumber(d.count)}
                    </span>
                  )}
                </div>
                {d.sample.length > 0 && (
                  <div
                    className="mt-3 space-y-1 rounded-2xl p-3"
                    style={{ backgroundColor: ui.inner }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide opacity-45">
                      Example records
                    </p>
                    {d.sample.map((row, i) => (
                      <p key={i} className="truncate text-xs">
                        {Object.values(row)
                          .filter(
                            (v) => v !== "" && v !== null && v !== undefined
                          )
                          .slice(0, 4)
                          .map(fmtCell)
                          .join(" · ")}
                      </p>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex gap-2 text-[11px] font-semibold">
                  {d.canExport && (
                    <span
                      className="rounded-full border px-2.5 py-0.5"
                      style={{ borderColor: ui.border }}
                    >
                      Export
                    </span>
                  )}
                  {d.canImport && (
                    <span
                      className="rounded-full border px-2.5 py-0.5"
                      style={{ borderColor: ui.border }}
                    >
                      Import
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {transfers.length > 0 && (
        <div
          className={cardCls}
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <History size={16} /> Recent activity
            </p>
            <Link
              href="/dashboard/data-management/transfers"
              className="text-xs font-semibold"
              style={{ color: PRIMARY_COLOR }}
            >
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {transfers.slice(0, 5).map((t) => (
              <div
                key={t._id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl p-3 text-xs"
                style={{ backgroundColor: ui.inner }}
              >
                <span className="font-semibold capitalize">
                  {t.action} · {t.dataset}
                  {t.format ? ` (${t.format.toUpperCase()})` : ""}
                </span>
                <span className="opacity-55">
                  {t.userEmail ?? "—"} · {fmtDateTime(t.createdAt)} ·{" "}
                  {humanBytes(t.bytes)}
                </span>
                <StatusPill status={t.status} map={TRANSFER_COLOR} />
              </div>
            ))}
          </div>
        </div>
      )}
    </ModuleShell>
  );
}
