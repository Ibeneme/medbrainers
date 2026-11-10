"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ModuleUsage } from "@/api/slices";
import { PRIMARY_COLOR } from "@/constants/colors";
import { useInputStyles, EmptyState } from "@/components/dashboard/ModuleShell";
import { fmtNumber, gbText } from "./format";

export default function ModuleBreakdown({ modules }: { modules: ModuleUsage[] }) {
    const { ui, cardCls } = useInputStyles();
    const [open, setOpen] = useState<string | null>(null);
    const max = Math.max(1, ...modules.map((m) => m.size.bytes));

    return (
        <div className={cardCls} style={{ backgroundColor: ui.card, borderColor: ui.border }}>
            <div>
                <p className="text-sm font-semibold">Storage by module</p>
                <p className="text-xs opacity-55">Everything stored for this facility, largest first. Tap a module to see its collections.</p>
            </div>
            {modules.length === 0 ? (
                <EmptyState text="Nothing stored yet." />
            ) : (
                <div className="space-y-2">
                    {modules.map((m) => {
                        const isOpen = open === m.key;
                        return (
                            <div key={m.key} className="rounded-2xl" style={{ backgroundColor: ui.inner }}>
                                <button type="button" onClick={() => setOpen(isOpen ? null : m.key)} className="flex w-full items-center gap-3 p-3.5 text-left" aria-expanded={isOpen}>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-3">
                                            <p className="truncate text-sm font-semibold">{m.label}</p>
                                            <p className="shrink-0 text-xs font-medium">{gbText(m.size.bytes)} <span className="opacity-45">· {fmtNumber(m.size.kb)} KB</span></p>
                                        </div>
                                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: ui.border }}>
                                            <div className="h-full rounded-full" style={{ width: `${Math.max(1, (m.size.bytes / max) * 100)}%`, backgroundColor: PRIMARY_COLOR }} />
                                        </div>
                                        <p className="mt-1 text-[11px] opacity-50">{fmtNumber(m.documents)} record(s) · {m.percentOfUsed}% of used storage</p>
                                    </div>
                                    <ChevronDown size={14} className={`shrink-0 opacity-50 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                </button>
                                {isOpen && (
                                    <div className="px-3.5 pb-3.5">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="text-left opacity-50">
                                                    <th className="py-1 font-semibold">Collection</th>
                                                    <th className="py-1 text-right font-semibold">Records</th>
                                                    <th className="py-1 text-right font-semibold">Avg/record</th>
                                                    <th className="py-1 text-right font-semibold">KB</th>
                                                    <th className="py-1 text-right font-semibold">GB</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {m.collections.map((c) => (
                                                    <tr key={c.model} className="border-t" style={{ borderColor: ui.border }}>
                                                        <td className="py-1.5">{c.model}</td>
                                                        <td className="py-1.5 text-right">{fmtNumber(c.documents)}</td>
                                                        <td className="py-1.5 text-right">{fmtNumber(c.avgDocBytes)} B</td>
                                                        <td className="py-1.5 text-right">{fmtNumber(c.size.kb)}</td>
                                                        <td className="py-1.5 text-right">{gbText(c.size.bytes)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
