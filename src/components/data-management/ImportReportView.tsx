"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ImportReport } from "@/api/slices";
import { useInputStyles } from "@/components/dashboard/ModuleShell";
import { fmtNumber } from "./format";

function Tile({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
    const { ui } = useInputStyles();
    return (
        <div className="rounded-2xl p-3.5" style={{ backgroundColor: ui.inner }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-50">{label}</p>
            <p className="mt-0.5 text-xl font-medium" style={tone ? { color: tone } : undefined}>{typeof value === "number" ? fmtNumber(value) : value}</p>
        </div>
    );
}

export default function ImportReportView({ report }: { report: ImportReport }) {
    const { ui } = useInputStyles();
    const done = report.committed;
    const problems = [...report.errors, ...(report.writeFailures ?? [])];

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: done ? "#16a34a" : report.invalidRows ? "#d97706" : "#2563eb" }}>
                {done ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                {done ? "Import finished" : report.dryRun ? "File checked — nothing has been imported yet" : "Import was not completed"}
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <Tile label="Rows in file" value={report.totalRows} />
                <Tile label={done ? "Added" : "Will add"} value={done ? report.inserted ?? 0 : report.toInsert} tone="#16a34a" />
                <Tile label={done ? "Updated" : "Will update"} value={done ? report.updated ?? 0 : report.toUpdate} tone="#2563eb" />
                <Tile label="With errors" value={report.invalidRows} tone={report.invalidRows ? "#dc2626" : undefined} />
            </div>
            {report.duplicatesSkipped > 0 && <p className="text-xs opacity-65">{fmtNumber(report.duplicatesSkipped)} row(s) already exist and were skipped.</p>}
            {report.alreadyMembersSkipped ? <p className="text-xs opacity-65">{report.alreadyMembersSkipped} person(s) were already members and were skipped.</p> : null}
            {report.ignoredColumns.length > 0 && <p className="text-xs text-amber-600">Ignored unknown column(s): {report.ignoredColumns.join(", ")}</p>}

            <div className="rounded-2xl p-3.5 text-xs" style={{ backgroundColor: ui.inner }}>
                {done && report.storageAfter ? (
                    <p>Storage now <strong>{report.storageAfter.used.human}</strong> used · <strong>{report.storageAfter.remaining.human}</strong> left ({report.storageAfter.percentUsed}%).</p>
                ) : (
                    <p>
                        This import adds about <strong>{report.storage.estimatedAdded.human}</strong>. {report.storage.remaining.human} of {report.storage.cap.human} is available.{" "}
                        {report.storage.fitsInCap ? <span className="text-green-600 font-semibold">It fits.</span> : <span className="text-red-600 font-semibold">It does not fit — free up space or split the file.</span>}
                    </p>
                )}
            </div>

            {problems.length > 0 && (
                <div>
                    <p className="mb-1.5 text-xs font-semibold opacity-70">
                        {report.errorsTruncated ? "First problems found" : "Problems found"} (spreadsheet row numbers, header is row 1)
                    </p>
                    <div className="max-h-64 overflow-auto rounded-2xl" style={{ backgroundColor: ui.inner }}>
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-left opacity-55">
                                    <th className="px-3 py-2 font-semibold">Row</th>
                                    <th className="px-3 py-2 font-semibold">Column</th>
                                    <th className="px-3 py-2 font-semibold">Problem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {problems.map((e, i) => (
                                    <tr key={i} className="border-t" style={{ borderColor: ui.border }}>
                                        <td className="px-3 py-1.5">{e.row || "—"}</td>
                                        <td className="px-3 py-1.5">{e.column ?? "—"}</td>
                                        <td className="px-3 py-1.5">{e.message}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
