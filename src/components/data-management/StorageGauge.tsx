"use client";

import { HardDrive } from "lucide-react";
import type { CompanyStorageOverview } from "@/api/slices";
import { useInputStyles } from "@/components/dashboard/ModuleShell";
import { STATUS_COLOR, STATUS_LABEL, fmtNumber, gbText } from "./format";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
    const { ui } = useInputStyles();
    return (
        <div className="rounded-2xl p-4" style={{ backgroundColor: ui.inner }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-50">{label}</p>
            <p className="mt-1 text-xl font-medium tracking-tight">{value}</p>
            {sub && <p className="text-[11px] opacity-50 mt-0.5">{sub}</p>}
        </div>
    );
}

export default function StorageGauge({ storage }: { storage: CompanyStorageOverview }) {
    const { ui, cardCls } = useInputStyles();
    const color = STATUS_COLOR[storage.status];
    const pct = Math.min(100, storage.percentUsed);
    // never show an empty bar when something is stored
    const barWidth = storage.used.bytes > 0 ? Math.max(pct, 0.6) : 0;

    return (
        <div className={cardCls} style={{ backgroundColor: ui.card, borderColor: ui.border }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${color}1f`, color }}>
                        <HardDrive size={20} />
                    </span>
                    <div>
                        <p className="text-sm font-semibold">Storage used</p>
                        <p className="text-xs opacity-55">{storage.companyName} · cap {storage.cap.human}</p>
                    </div>
                </div>
                <span className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide" style={{ backgroundColor: `${color}22`, color }}>
                    {STATUS_LABEL[storage.status]}
                </span>
            </div>

            <div>
                <div className="flex items-end justify-between mb-2">
                    <p className="text-3xl font-normal tracking-tight">
                        {gbText(storage.used.bytes)} <span className="text-base opacity-50">of 1 GB</span>
                    </p>
                    <p className="text-lg font-medium" style={{ color }}>{storage.percentUsed}%</p>
                </div>
                <p className="-mt-1 mb-2 text-xs opacity-55">That is {storage.used.human} ({fmtNumber(storage.used.kb)} KB) used, with {gbText(storage.remaining.bytes, 4)} left.</p>
                <div className="h-3 w-full overflow-hidden rounded-full" style={{ backgroundColor: ui.inner }} role="progressbar" aria-valuenow={storage.percentUsed} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, backgroundColor: color }} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Used" value={gbText(storage.used.bytes)} sub={`${fmtNumber(storage.used.kb)} KB · ${storage.used.mb} MB`} />
                <Stat label="Remaining" value={gbText(storage.remaining.bytes, 4)} sub={`${fmtNumber(storage.remaining.kb)} KB`} />
                <Stat label="Database records" value={gbText(storage.breakdown.database.bytes)} sub={`${fmtNumber(storage.breakdown.database.kb)} KB`} />
                <Stat label="Uploaded files" value={gbText(storage.breakdown.files.bytes)} sub={`${fmtNumber(storage.breakdown.files.count)} file(s) · ${fmtNumber(storage.breakdown.files.kb)} KB`} />
            </div>
            <p className="text-[11px] opacity-45">
                1 GB = 1,048,576 KB. Counts stored record data and uploaded file sizes; database index overhead is not included.
            </p>
        </div>
    );
}
