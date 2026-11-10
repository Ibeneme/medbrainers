"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileDown, Loader2, Upload } from "lucide-react";
import { clearImportReport, downloadTemplate, importDataset, fetchCompanyStorage, fetchDatasetPreview } from "@/api/slices";
import { PRIMARY_COLOR } from "@/constants/colors";
import { useInputStyles, Field } from "@/components/dashboard/ModuleShell";
import { saveBlob, useDataManagement } from "@/hooks/useDataManagement";
import type { DatasetItem } from "@/api/slices";
import ImportReportView from "./ImportReportView";

const MAX_BYTES = 25 * 1024 * 1024;

export default function ImportPanel({ dataset }: { dataset: DatasetItem }) {
    const { facilityId, dataManagement, act, dispatch, showToast } = useDataManagement();
    const { ui, cardCls, inputCls, inputStyle } = useInputStyles();
    const fileRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [mode, setMode] = useState<"insert" | "upsert">("insert");
    const [onError, setOnError] = useState<"abort" | "skip">("abort");
    const [checkedFor, setCheckedFor] = useState<string | null>(null);

    // any change to the file or options invalidates the previous check
    const signature = useMemo(() => (file ? `${file.name}|${file.size}|${file.lastModified}|${mode}|${onError}` : ""), [file, mode, onError]);
    useEffect(() => {
        // keep the "Import finished" report visible after a commit clears the file
        if (!signature) return;
        dispatch(clearImportReport());
        setCheckedFor(null);
    }, [signature, dispatch]);
    useEffect(() => () => void dispatch(clearImportReport()), [dispatch]);

    const report = dataManagement.importReport;
    const busy = dataManagement.importing;
    const canCommit =
        !!file && !!report && report.dryRun && checkedFor === signature && report.validRows > 0 && report.storage.fitsInCap && (report.invalidRows === 0 || onError === "skip");

    function pick(f: File | undefined | null) {
        if (!f) return;
        if (!/\.(csv|json)$/i.test(f.name)) return showToast("Choose a .csv or .json file", "error");
        if (f.size > MAX_BYTES) return showToast("File is too large (max 25 MB)", "error");
        setFile(f);
    }

    async function template(format: "csv" | "json") {
        const r = await act<{ blob: Blob; filename: string }>(downloadTemplate({ facilityId, key: dataset.key, format }), false);
        if (r?.blob) saveBlob(r.blob, r.filename);
    }

    async function check() {
        if (!file) return;
        const r = await act(importDataset({ facilityId, key: dataset.key, file, mode, onError, dryRun: true }), false);
        if (r) setCheckedFor(signature);
    }

    async function commit() {
        if (!file) return;
        const r = await act(importDataset({ facilityId, key: dataset.key, file, mode, onError, dryRun: false }));
        if (r) {
            setCheckedFor(null);
            setFile(null);
            if (fileRef.current) fileRef.current.value = "";
            // refresh numbers everywhere
            dispatch(fetchCompanyStorage({ facilityId }));
            dispatch(fetchDatasetPreview({ facilityId, key: dataset.key, limit: 10 }));
        }
    }

    return (
        <div className={cardCls} style={{ backgroundColor: ui.card, borderColor: ui.border }}>
            <div>
                <p className="text-sm font-semibold">Import into {dataset.label.toLowerCase()}</p>
                <p className="text-xs opacity-55">Upload a CSV or JSON file. We check it first and only save when you confirm.</p>
            </div>

            <div className="rounded-2xl p-3.5 text-xs space-y-1.5" style={{ backgroundColor: ui.inner }}>
                <p><span className="font-semibold">Required columns:</span> {dataset.requiredColumns.join(", ") || "none"}</p>
                <p className="opacity-65"><span className="font-semibold">All columns:</span> {dataset.columns.join(", ")}</p>
                {dataset.notes.map((n, i) => <p key={i} className="opacity-65">• {n}</p>)}
                <div className="flex flex-wrap gap-2 pt-1">
                    {(["csv", "json"] as const).map((f) => (
                        <button key={f} type="button" onClick={() => template(f)} className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-semibold" style={{ borderColor: ui.border }}>
                            <FileDown size={13} /> {f.toUpperCase()} template
                        </button>
                    ))}
                </div>
            </div>

            <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
                className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed px-4 py-8 text-center"
                style={{ borderColor: ui.border, backgroundColor: ui.inner }}
            >
                <Upload size={20} className="opacity-60" />
                <span className="text-sm font-semibold">{file ? file.name : "Choose a file or drop it here"}</span>
                <span className="text-[11px] opacity-50">{file ? `${(file.size / 1024).toFixed(1)} KB` : ".csv or .json · up to 25 MB · 20,000 rows"}</span>
                <input ref={fileRef} type="file" accept=".csv,.json,application/json,text/csv" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
                <Field label="If a record already exists">
                    <select value={mode} onChange={(e) => setMode(e.target.value as any)} className={inputCls} style={inputStyle}>
                        <option value="insert">Skip it (add new records only)</option>
                        {dataset.allowUpsert && <option value="upsert">Update it with the file&apos;s values</option>}
                    </select>
                </Field>
                <Field label="If some rows have errors">
                    <select value={onError} onChange={(e) => setOnError(e.target.value as any)} className={inputCls} style={inputStyle}>
                        <option value="abort">Import nothing until I fix the file</option>
                        <option value="skip">Import the good rows, skip the bad ones</option>
                    </select>
                </Field>
            </div>

            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={check} disabled={!file || busy} className="flex items-center gap-2 rounded-full border px-5 py-3 text-xs font-semibold disabled:opacity-50" style={{ borderColor: ui.border, backgroundColor: ui.inner }}>
                    {busy && !canCommit ? <Loader2 size={14} className="animate-spin" /> : null} Check file
                </button>
                <button type="button" onClick={commit} disabled={!canCommit || busy} className="flex items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold text-white disabled:opacity-40" style={{ backgroundColor: PRIMARY_COLOR }}>
                    {busy && canCommit ? <Loader2 size={14} className="animate-spin" /> : null} Import now
                </button>
            </div>

            {report && <ImportReportView report={report} />}
        </div>
    );
}
