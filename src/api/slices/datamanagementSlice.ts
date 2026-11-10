import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import api, { getErrorMessage, type ApiSuccess } from "../services";

/* -------------------------------------------------------------------------- */
/*  Types — these mirror the backend /companies/:id/data/* responses          */
/* -------------------------------------------------------------------------- */

export interface Size {
    bytes: number;
    kb: number;
    mb: number;
    human: string;
}

export type StorageStatus = "ok" | "warning" | "critical" | "full";

export interface CollectionUsage {
    model: string;
    collection: string;
    documents: number;
    avgDocBytes: number;
    size: Size;
}

export interface ModuleUsage {
    key: string;
    label: string;
    documents: number;
    size: Size;
    percentOfUsed: number;
    collections: CollectionUsage[];
}

export interface CompanyStorageOverview {
    companyId: string;
    companyName: string;
    generatedAt: string;
    cap: Size;
    used: Size;
    remaining: Size;
    percentUsed: number;
    status: StorageStatus;
    breakdown: {
        database: Size;
        files: Size & { count: number; sources: { label: string; count: number; bytes: number }[] };
    };
    modules: ModuleUsage[];
}

export interface DatasetItem {
    key: string;
    label: string;
    description: string;
    notes: string[];
    allowUpsert: boolean;
    canExport: boolean;
    canImport: boolean;
    columns: string[];
    requiredColumns: string[];
}

export interface DatasetSummary {
    key: string;
    label: string;
    module: string;
    description: string;
    count: number;
    canExport: boolean;
    canImport: boolean;
    columns: string[];
    requiredColumns: string[];
    sample: Record<string, unknown>[];
}

export interface CompanySummary {
    storage: CompanyStorageOverview;
    datasets: DatasetSummary[];
}

export interface TransferRecord {
    _id: string;
    company: string;
    user: string;
    userEmail?: string;
    action: "export" | "import";
    dataset: string;
    format?: string;
    mode?: string;
    rows: number;
    bytes: number;
    status: "success" | "failed" | "rejected";
    message?: string;
    ip?: string;
    createdAt: string;
}

export interface RowError {
    row: number;
    column?: string;
    message: string;
}

export interface ImportReport {
    dataset: string;
    mode: "insert" | "upsert";
    dryRun: boolean;
    onError: "abort" | "skip";
    committed: boolean;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicatesSkipped: number;
    toInsert: number;
    toUpdate: number;
    errors: RowError[];
    errorsTruncated: boolean;
    ignoredColumns: string[];
    storage: { used: Size; remaining: Size; cap: Size; estimatedAdded: Size; fitsInCap: boolean };
    /* present after a real import */
    inserted?: number;
    updated?: number;
    writeFailures?: RowError[];
    alreadyMembersSkipped?: number;
    storageAfter?: { used: Size; remaining: Size; percentUsed: number; status: StorageStatus };
}

export interface PreviewData {
    dataset: string;
    label: string;
    total: number;
    columns: string[];
    rows: Record<string, unknown>[];
}

export interface DataManagementState {
    storage: CompanyStorageOverview | null;
    summary: CompanySummary | null;
    datasets: DatasetItem[];
    transfers: TransferRecord[];
    preview: PreviewData | null;
    /** Latest import report (dry run, committed, or the report attached to a 422/413 rejection). */
    importReport: ImportReport | null;
    loading: boolean;
    exporting: boolean;
    importing: boolean;
    error: string | null;
    message: string | null;
}

const initialState: DataManagementState = {
    storage: null,
    summary: null,
    datasets: [],
    transfers: [],
    preview: null,
    importReport: null,
    loading: false,
    exporting: false,
    importing: false,
    error: null,
    message: null,
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const base = (facilityId: string) => `/companies/${facilityId}/data`;

/**
 * The data endpoints return flat bodies ({ success, ...fields }) except the list endpoints,
 * which already use { success, data }. Normalise everything to ApiSuccess<T> = { success, data }.
 */
function normalise<T>(body: any): ApiSuccess<T> {
    if (body && typeof body === "object" && "data" in body) return body as ApiSuccess<T>;
    const { success, message, ...rest } = body ?? {};
    return { success: success ?? true, message, data: rest as T } as ApiSuccess<T>;
}

/** Error bodies come back as a Blob when responseType is "blob" (export): read the JSON inside. */
async function readError(err: unknown, fallback: string): Promise<{ message: string; body?: any }> {
    if (axios.isAxiosError(err)) {
        let body: any = err.response?.data;
        // responseType "blob" makes error bodies arrive as a Blob (browser) or string/buffer (other runtimes): read the JSON inside
        try {
            if (typeof Blob !== "undefined" && body instanceof Blob) body = JSON.parse(await body.text());
            else if (typeof body === "string") body = JSON.parse(body);
            else if (body && typeof body === "object" && typeof (body as any).byteLength === "number") body = JSON.parse(new TextDecoder().decode(body as ArrayBuffer));
        } catch {
            body = undefined;
        }
        if (body?.message) return { message: body.message, body };
        return { message: getErrorMessage(err, fallback), body };
    }
    return { message: getErrorMessage(err, fallback) };
}

function mk<A, T>(type: string, fallback: string, fn: (arg: A) => Promise<ApiSuccess<T>>) {
    return createAsyncThunk<ApiSuccess<T>, A, { rejectValue: string }>(`dataManagement/${type}`, async (arg, { rejectWithValue }) => {
        try {
            return await fn(arg);
        } catch (err) {
            return rejectWithValue((await readError(err, fallback)).message);
        }
    });
}

type F = { facilityId: string };

/* -------------------------------------------------------------------------- */
/*  Thunks                                                                    */
/* -------------------------------------------------------------------------- */

export const fetchCompanyStorage = mk<F & { includeEmpty?: boolean }, CompanyStorageOverview>(
    "fetchStorage",
    "Failed to load storage details",
    async ({ facilityId, includeEmpty }) =>
        normalise((await api.get(`${base(facilityId)}/storage`, { params: { includeEmpty: includeEmpty ? "true" : undefined } })).data)
);

export const fetchCompanySummary = mk<F, CompanySummary>(
    "fetchSummary",
    "Failed to load company summary",
    async ({ facilityId }) => normalise((await api.get(`${base(facilityId)}/summary`)).data)
);

export const fetchDatasets = mk<F, DatasetItem[]>(
    "fetchDatasets",
    "Failed to load datasets",
    async ({ facilityId }) => normalise((await api.get(`${base(facilityId)}/datasets`)).data)
);

export const fetchTransfers = mk<F & { limit?: number }, TransferRecord[]>(
    "fetchTransfers",
    "Failed to load transfer history",
    async ({ facilityId, limit }) => normalise((await api.get(`${base(facilityId)}/transfers`, { params: { limit } })).data)
);

export const fetchDatasetPreview = mk<F & { key: string; limit?: number }, PreviewData>(
    "fetchDatasetPreview",
    "Failed to load dataset preview",
    async ({ facilityId, key, limit }) => normalise((await api.get(`${base(facilityId)}/datasets/${key}/preview`, { params: { limit } })).data)
);

export const requestExportCode = mk<F & { key: string }, { sent: boolean; sentTo: string; expiresInSeconds: number }>(
    "requestExportCode",
    "Could not request export confirmation code",
    async ({ facilityId, key }) => {
        const res = normalise<{ sent: boolean; sentTo: string; expiresInSeconds: number }>((await api.post(`${base(facilityId)}/datasets/${key}/export/code`)).data);
        res.message = `Confirmation code sent to ${res.data.sentTo}`;
        return res;
    }
);

export const exportDataset = mk<F & { key: string; format: "csv" | "json" | "pdf"; code: string }, { blob: Blob; filename: string }>(
    "exportDataset",
    "Could not export dataset",
    async ({ facilityId, key, format, code }) => {
        const response = await api.post(`${base(facilityId)}/datasets/${key}/export`, { format, code }, { responseType: "blob" });
        const disposition = (response.headers["content-disposition"] as string) || "";
        const match = disposition.match(/filename="?([^";]+)"?/);
        const filename = match?.[1] || `${key}-export.${format}`;
        return { success: true, data: { blob: response.data as Blob, filename } };
    }
);

export const downloadTemplate = mk<F & { key: string; format: "csv" | "json" }, { blob: Blob; filename: string }>(
    "downloadTemplate",
    "Could not download template",
    async ({ facilityId, key, format }) => {
        const response = await api.get(`${base(facilityId)}/datasets/${key}/template`, { params: { format }, responseType: "blob" });
        const disposition = (response.headers["content-disposition"] as string) || "";
        const filename = disposition.match(/filename="?([^";]+)"?/)?.[1] || `${key}-template.${format}`;
        return { success: true, data: { blob: response.data as Blob, filename } };
    }
);

/** Dry run (default) or real import. Rejections keep the server's report so the UI can show row errors. */
export const importDataset = createAsyncThunk<
    ApiSuccess<ImportReport>,
    F & { key: string; file: File; mode?: "insert" | "upsert"; dryRun?: boolean; onError?: "abort" | "skip" },
    { rejectValue: { message: string; report?: ImportReport } }
>("dataManagement/importDataset", async ({ facilityId, key, file, mode = "insert", dryRun = true, onError = "abort" }, { rejectWithValue }) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.post(`${base(facilityId)}/datasets/${key}/import`, formData, {
            params: { mode, dryRun: String(dryRun), onError },
            headers: { "Content-Type": "multipart/form-data" },
        });
        const out = normalise<ImportReport>(res.data);
        if (!dryRun && out.data.committed) {
            out.message = `Imported ${out.data.inserted ?? 0} new and updated ${out.data.updated ?? 0} record(s)`;
        }
        return out;
    } catch (err) {
        const { message, body } = await readError(err, "Could not import dataset");
        return rejectWithValue({ message, report: body?.report });
    }
});

/* -------------------------------------------------------------------------- */
/*  Slice                                                                     */
/* -------------------------------------------------------------------------- */

const dataManagementSlice = createSlice({
    name: "dataManagement",
    initialState,
    reducers: {
        clearDataMessage(s) {
            s.error = null;
            s.message = null;
        },
        clearPreview(s) {
            s.preview = null;
        },
        clearImportReport(s) {
            s.importReport = null;
        },
    },
    extraReducers: (b) => {
        const fail = (s: DataManagementState, a: any) => {
            s.loading = false;
            s.exporting = false;
            s.importing = false;
            s.error = typeof a.payload === "string" ? a.payload : a.payload?.message || "Request failed";
        };

        b.addCase(fetchCompanyStorage.pending, (s) => {
            s.loading = true;
            s.error = null;
        })
            .addCase(fetchCompanyStorage.fulfilled, (s, a) => {
                s.loading = false;
                s.storage = a.payload.data || null;
            })
            .addCase(fetchCompanyStorage.rejected, fail);

        b.addCase(fetchCompanySummary.pending, (s) => {
            s.loading = true;
            s.error = null;
        })
            .addCase(fetchCompanySummary.fulfilled, (s, a) => {
                s.loading = false;
                s.summary = a.payload.data || null;
                if (a.payload.data?.storage) s.storage = a.payload.data.storage;
            })
            .addCase(fetchCompanySummary.rejected, fail);

        b.addCase(fetchDatasets.pending, (s) => {
            s.loading = true;
            s.error = null;
        })
            .addCase(fetchDatasets.fulfilled, (s, a) => {
                s.loading = false;
                s.datasets = a.payload.data || [];
            })
            .addCase(fetchDatasets.rejected, fail);

        b.addCase(fetchTransfers.pending, (s) => {
            s.loading = true;
            s.error = null;
        })
            .addCase(fetchTransfers.fulfilled, (s, a) => {
                s.loading = false;
                s.transfers = a.payload.data || [];
            })
            .addCase(fetchTransfers.rejected, fail);

        b.addCase(fetchDatasetPreview.pending, (s) => {
            s.loading = true;
            s.error = null;
        })
            .addCase(fetchDatasetPreview.fulfilled, (s, a) => {
                s.loading = false;
                s.preview = a.payload.data || null;
            })
            .addCase(fetchDatasetPreview.rejected, fail);

        b.addCase(requestExportCode.pending, (s) => {
            s.exporting = true;
            s.error = null;
        })
            .addCase(requestExportCode.fulfilled, (s, a) => {
                s.exporting = false;
                s.message = a.payload.message || "Confirmation code sent to your email";
            })
            .addCase(requestExportCode.rejected, fail);

        b.addCase(exportDataset.pending, (s) => {
            s.exporting = true;
            s.error = null;
        })
            .addCase(exportDataset.fulfilled, (s) => {
                s.exporting = false;
                s.message = "Export generated successfully";
            })
            .addCase(exportDataset.rejected, fail);

        b.addCase(importDataset.pending, (s) => {
            s.importing = true;
            s.error = null;
        })
            .addCase(importDataset.fulfilled, (s, a) => {
                s.importing = false;
                s.importReport = a.payload.data;
                s.message = a.payload.data.dryRun ? "Check complete — nothing has been imported yet" : "Import completed successfully";
            })
            .addCase(importDataset.rejected, (s, a) => {
                fail(s, a);
                if (a.payload?.report) s.importReport = a.payload.report;
            });
    },
});

export const { clearDataMessage, clearPreview, clearImportReport } = dataManagementSlice.actions;
export default dataManagementSlice.reducer;
