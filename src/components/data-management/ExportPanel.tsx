"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Mail, ShieldCheck } from "lucide-react";
import { exportDataset, requestExportCode } from "@/api/slices";
import { PRIMARY_COLOR } from "@/constants/colors";
import { useInputStyles, Field } from "@/components/dashboard/ModuleShell";
import { saveBlob, useDataManagement } from "@/hooks/useDataManagement";
import { fmtNumber } from "./format";

const PDF_MAX_ROWS = 5000;
const FORMATS = [
    { id: "csv", label: "CSV", hint: "Opens in Excel / Sheets" },
    { id: "json", label: "JSON", hint: "For systems & backups" },
    { id: "pdf", label: "PDF", hint: "Printable report" },
] as const;

export default function ExportPanel({ datasetKey, label, total }: { datasetKey: string; label: string; total: number }) {
    const { facilityId, dataManagement, act } = useDataManagement();
    const { ui, cardCls, inputCls, inputStyle } = useInputStyles();
    const [format, setFormat] = useState<"csv" | "json" | "pdf">("csv");
    const [sentTo, setSentTo] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const pdfTooBig = format === "pdf" && total > PDF_MAX_ROWS;
    const busy = dataManagement.exporting;

    async function sendCode() {
        const r = await act<{ sentTo: string }>(requestExportCode({ facilityId, key: datasetKey }));
        if (r) {
            setSentTo(r.sentTo);
            setCooldown(60);
            setCode("");
        }
    }

    async function download() {
        const r = await act<{ blob: Blob; filename: string }>(exportDataset({ facilityId, key: datasetKey, format, code }), "Export downloaded");
        if (r?.blob) {
            saveBlob(r.blob, r.filename);
            setCode("");
            setSentTo(null); // codes are single-use
        }
    }

    return (
        <div className={cardCls} style={{ backgroundColor: ui.card, borderColor: ui.border }}>
            <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} style={{ color: PRIMARY_COLOR }} />
                <div>
                    <p className="text-sm font-semibold">Export {label.toLowerCase()}</p>
                    <p className="text-xs opacity-55">{fmtNumber(total)} record(s). Exports contain patient or staff data, so each one needs an emailed confirmation code.</p>
                </div>
            </div>

            <div>
                <p className="mb-1.5 text-xs font-semibold opacity-70">1 · Choose a format</p>
                <div className="grid grid-cols-3 gap-2">
                    {FORMATS.map((f) => {
                        const active = format === f.id;
                        return (
                            <button key={f.id} type="button" onClick={() => setFormat(f.id)} className="rounded-2xl border p-3 text-left transition" style={{ backgroundColor: ui.inner, borderColor: active ? PRIMARY_COLOR : ui.border, boxShadow: active ? `0 0 0 1px ${PRIMARY_COLOR}` : undefined }} aria-pressed={active}>
                                <p className="text-sm font-semibold">{f.label}</p>
                                <p className="text-[11px] opacity-55">{f.hint}</p>
                            </button>
                        );
                    })}
                </div>
                {pdfTooBig && <p className="mt-2 text-xs text-amber-600">PDF is limited to {fmtNumber(PDF_MAX_ROWS)} rows. Use CSV or JSON for this dataset.</p>}
            </div>

            <div className="space-y-2">
                <p className="text-xs font-semibold opacity-70">2 · Get your confirmation code</p>
                <button type="button" onClick={sendCode} disabled={busy || cooldown > 0 || total === 0} className="flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold disabled:opacity-50" style={{ borderColor: ui.border, backgroundColor: ui.inner }}>
                    {busy && !sentTo ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                    {sentTo ? (cooldown > 0 ? `Resend in ${cooldown}s` : "Send a new code") : "Email me a code"}
                </button>
                {total === 0 && <p className="text-xs opacity-55">There is nothing to export yet.</p>}
                {sentTo && <p className="text-xs opacity-65">Code sent to <strong>{sentTo}</strong>. It expires in 10 minutes and works once.</p>}
            </div>

            <div className="space-y-2">
                <Field label="3 · Enter the 6-digit code">
                    <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" disabled={!sentTo} className={`${inputCls} max-w-[200px] text-center text-lg tracking-[0.4em] disabled:opacity-50`} style={inputStyle} />
                </Field>
                <button type="button" onClick={download} disabled={busy || code.length !== 6 || pdfTooBig || !sentTo} className="flex items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: PRIMARY_COLOR }}>
                    {busy && sentTo ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    Download {format.toUpperCase()}
                </button>
            </div>
        </div>
    );
}
