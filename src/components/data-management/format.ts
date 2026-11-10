import type { StorageStatus } from "@/api/slices";

export const STATUS_COLOR: Record<StorageStatus, string> = {
    ok: "#16a34a",
    warning: "#d97706",
    critical: "#dc2626",
    full: "#991b1b",
};

export const STATUS_LABEL: Record<StorageStatus, string> = {
    ok: "Healthy",
    warning: "Getting full",
    critical: "Almost full",
    full: "Full",
};

export const TRANSFER_COLOR: Record<string, string> = {
    success: "#16a34a",
    failed: "#dc2626",
    rejected: "#d97706",
};

export const fmtDateTime = (iso?: string) =>
    iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

export const fmtNumber = (n: number) => new Intl.NumberFormat().format(n);

export function fmtCell(v: unknown): string {
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleDateString(undefined, { dateStyle: "medium" });
    return String(v);
}

/** "patients" -> "Patients", "antenatal-records" -> "Antenatal records" */
export const prettyKey = (k: string) => k.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export function humanBytes(bytes: number): string {
    const b = Math.max(0, bytes || 0);
    if (b < 1024) return `${Math.round(b)} B`;
    if (b < 1024 ** 2) return `${(b / 1024).toFixed(2)} KB`;
    if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(2)} MB`;
    return `${(b / 1024 ** 3).toFixed(2)} GB`;
}

const GIB = 1024 ** 3;
/** Exact GB figure (1 GB = 1,073,741,824 bytes). Small values keep enough decimals to stay visible, e.g. 0.000011 GB. */
export function gbText(bytes: number, dp = 6): string {
    const g = Math.max(0, bytes || 0) / GIB;
    if (g >= 100) return `${g.toFixed(2)} GB`;
    const s = g.toFixed(dp);
    return `${g > 0 && Number(s) === 0 ? "<0.000001" : s} GB`;
}
