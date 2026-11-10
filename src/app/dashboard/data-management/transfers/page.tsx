"use client";

import { useCallback, useEffect } from "react";
import { ArrowLeft, History, RefreshCw } from "lucide-react";
import { fetchTransfers } from "@/api/slices";
import { ModuleShell, ActionLink, EmptyState, StatusPill, useInputStyles } from "@/components/dashboard/ModuleShell";
import { useDataManagement } from "@/hooks/useDataManagement";
import { TRANSFER_COLOR, fmtDateTime, fmtNumber, humanBytes, prettyKey } from "@/components/data-management/format";

export default function TransfersPage() {
    const { facilityId, dispatch, dataManagement } = useDataManagement();
    const { ui, cardCls } = useInputStyles();
    const { transfers, loading, error } = dataManagement;

    const load = useCallback(() => { if (facilityId) dispatch(fetchTransfers({ facilityId, limit: 100 })); }, [dispatch, facilityId]);
    useEffect(() => { load(); }, [load]);

    return (
        <ModuleShell
            title="Transfer history"
            subtitle="Every export and import, newest first"
            icon={History}
            loading={loading && !transfers.length}
            actions={
                <>
                    <ActionLink href="/dashboard/data-management"><span className="inline-flex items-center gap-1.5"><ArrowLeft size={13} /> Data management</span></ActionLink>
                    <button type="button" onClick={load} className="flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-xs font-semibold" style={{ borderColor: ui.border }}><RefreshCw size={14} /> Refresh</button>
                </>
            }
        >
            {error && <div className="rounded-2xl px-4 py-2 text-xs font-semibold" style={{ backgroundColor: "rgba(220,38,38,0.12)", color: "#dc2626" }}>{error}</div>}
            <div className={cardCls} style={{ backgroundColor: ui.card, borderColor: ui.border }}>
                {transfers.length === 0 ? (
                    <EmptyState text="No exports or imports yet." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-max text-xs">
                            <thead>
                                <tr className="text-left opacity-55">
                                    {["When", "Who", "Action", "Dataset", "Records", "Size", "Status", "Note"].map((h) => (
                                        <th key={h} className="whitespace-nowrap px-3 py-2 font-semibold">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {transfers.map((t) => (
                                    <tr key={t._id} className="border-t" style={{ borderColor: ui.border }}>
                                        <td className="whitespace-nowrap px-3 py-2">{fmtDateTime(t.createdAt)}</td>
                                        <td className="whitespace-nowrap px-3 py-2">{t.userEmail ?? "—"}</td>
                                        <td className="whitespace-nowrap px-3 py-2 capitalize">{t.action}{t.format ? ` · ${t.format.toUpperCase()}` : ""}{t.mode ? ` · ${t.mode}` : ""}</td>
                                        <td className="whitespace-nowrap px-3 py-2">{prettyKey(t.dataset)}</td>
                                        <td className="px-3 py-2">{fmtNumber(t.rows)}</td>
                                        <td className="whitespace-nowrap px-3 py-2">{humanBytes(t.bytes)}</td>
                                        <td className="px-3 py-2"><StatusPill status={t.status} map={TRANSFER_COLOR} /></td>
                                        <td className="max-w-[260px] truncate px-3 py-2 opacity-70" title={t.message}>{t.message ?? ""}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </ModuleShell>
    );
}
