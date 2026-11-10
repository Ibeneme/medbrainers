"use client";

import { useInputStyles, EmptyState } from "@/components/dashboard/ModuleShell";
import { fmtCell } from "./format";

export default function DataTable({ columns, rows, empty = "No records yet." }: { columns: string[]; rows: Record<string, unknown>[]; empty?: string }) {
    const { ui } = useInputStyles();
    if (!rows.length) return <EmptyState text={empty} />;
    return (
        <div className="overflow-x-auto rounded-2xl" style={{ backgroundColor: ui.inner }}>
            <table className="w-full min-w-max text-xs">
                <thead>
                    <tr className="text-left opacity-55">
                        {columns.map((c) => (
                            <th key={c} className="whitespace-nowrap px-3 py-2.5 font-semibold">{c}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} className="border-t" style={{ borderColor: ui.border }}>
                            {columns.map((c) => (
                                <td key={c} className="max-w-[240px] truncate whitespace-nowrap px-3 py-2" title={String(r[c] ?? "")}>{fmtCell(r[c])}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
