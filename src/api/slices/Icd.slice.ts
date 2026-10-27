import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage } from "../services";

/* -------------------------------------------------------------------------- */
/*  Types (move to ../types if you prefer)                                    */
/* -------------------------------------------------------------------------- */
export type IcdCrawlItemStatus = "pending" | "done" | "failed";

export interface IcdEntity {
    /** Full WHO entity URL (unique per release) */
    _id: string;
    release: string;
    /** Path after /mms/, e.g. "1435254666" or "1435254666/unspecified" */
    entityId: string;
    code?: string;
    title?: string;
    definition?: string;
    longDefinition?: string;
    fullySpecifiedName?: string;
    codingNote?: string;
    classKind?: "chapter" | "block" | "category" | string;
    blockId?: string;
    browserUrl?: string;
    parentUrls: string[];
    childUrls: string[];
    inclusions: string[];
    exclusions: string[];
    indexTerms: string[];
    status: IcdCrawlItemStatus;
    score?: number;
}

export interface IcdCrawlStatus {
    running: boolean;
    stopRequested: boolean;
    release: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    fetchedThisRun: number;
    failedThisRun: number;
    lastError: string | null;
    counts: Partial<Record<IcdCrawlItemStatus, number>>;
}

export interface IcdState {
    chapters: IcdEntity[];
    searchResults: IcdEntity[];
    searchQuery: string;
    current: IcdEntity | null;
    children: IcdEntity[];
    /** entityId the `children` array belongs to (guards against out-of-order responses) */
    childrenFor: string | null;
    crawlStatus: IcdCrawlStatus | null;
    chaptersLoading: boolean;
    searchLoading: boolean;
    currentLoading: boolean;
    childrenLoading: boolean;
    crawlLoading: boolean;
    crawlActionLoading: boolean;
    error: string | null;
    message: string | null;
}

const initialState: IcdState = {
    chapters: [],
    searchResults: [],
    searchQuery: "",
    current: null,
    children: [],
    childrenFor: null,
    crawlStatus: null,
    chaptersLoading: false,
    searchLoading: false,
    currentLoading: false,
    childrenLoading: false,
    crawlLoading: false,
    crawlActionLoading: false,
    error: null,
    message: null,
};

/**
 * The ICD router returns plain JSON, but the rest of the API wraps responses as
 * { success, data }. Accept both so this slice survives either shape.
 */
function unwrap<T>(body: any): T {
    if (
        body &&
        typeof body === "object" &&
        !Array.isArray(body) &&
        "data" in body &&
        "success" in body
    ) {
        return body.data as T;
    }
    return body as T;
}

/* -------------------------------------------------------------------------- */
/*  Thunks                                                                    */
/* -------------------------------------------------------------------------- */
export const fetchIcdChapters = createAsyncThunk(
    "icd/fetchChapters",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/icd/db/chapters");
            return unwrap<IcdEntity[]>(data);
        } catch (err) {
            return rejectWithValue(getErrorMessage(err, "Failed to load ICD chapters"));
        }
    },
);

export const searchIcd = createAsyncThunk(
    "icd/search",
    async (
        { q, limit = 30 }: { q: string; limit?: number },
        { rejectWithValue },
    ) => {
        try {
            const { data } = await api.get("/icd/db/search", { params: { q, limit } });
            return { q, results: unwrap<IcdEntity[]>(data) };
        } catch (err) {
            return rejectWithValue(getErrorMessage(err, "ICD search failed"));
        }
    },
);

export const fetchIcdByCode = createAsyncThunk(
    "icd/fetchByCode",
    async (code: string, { rejectWithValue }) => {
        try {
            const { data } = await api.get(`/icd/db/code/${encodeURIComponent(code)}`);
            return unwrap<IcdEntity>(data);
        } catch (err) {
            return rejectWithValue(getErrorMessage(err, "Code not found"));
        }
    },
);

export const fetchIcdEntity = createAsyncThunk(
    "icd/fetchEntity",
    async (id: string, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/icd/db/entity", { params: { id } });
            return unwrap<IcdEntity>(data);
        } catch (err) {
            return rejectWithValue(getErrorMessage(err, "Entity not found"));
        }
    },
);

export const fetchIcdChildren = createAsyncThunk(
    "icd/fetchChildren",
    async (id: string, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/icd/db/children", { params: { id } });
            return unwrap<IcdEntity[]>(data);
        } catch (err) {
            return rejectWithValue(getErrorMessage(err, "Failed to load child categories"));
        }
    },
);

export const fetchIcdCrawlStatus = createAsyncThunk(
    "icd/fetchCrawlStatus",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/icd/crawl/status");
            return unwrap<IcdCrawlStatus>(data);
        } catch (err) {
            return rejectWithValue(getErrorMessage(err, "Failed to load sync status"));
        }
    },
);

export const startIcdCrawl = createAsyncThunk(
    "icd/startCrawl",
    async (
        opts: { release?: string; concurrency?: number; retryFailed?: boolean } | undefined,
        { rejectWithValue },
    ) => {
        try {
            const { data } = await api.post("/icd/crawl/start", null, {
                params: {
                    release: opts?.release ?? "2025-01",
                    concurrency: opts?.concurrency ?? 5,
                    retryFailed: opts?.retryFailed ?? true,
                },
            });
            return unwrap<{ started: boolean; reason?: string }>(data);
        } catch (err) {
            return rejectWithValue(getErrorMessage(err, "Could not start sync"));
        }
    },
);

export const stopIcdCrawl = createAsyncThunk(
    "icd/stopCrawl",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/icd/crawl/stop");
            return unwrap<{ stopped: boolean; reason?: string }>(data);
        } catch (err) {
            return rejectWithValue(getErrorMessage(err, "Could not stop sync"));
        }
    },
);

/* -------------------------------------------------------------------------- */
/*  Slice                                                                     */
/* -------------------------------------------------------------------------- */
const icdSlice = createSlice({
    name: "icd",
    initialState,
    reducers: {
        clearIcdError(state) {
            state.error = null;
            state.message = null;
        },
        clearIcdSearch(state) {
            state.searchResults = [];
            state.searchQuery = "";
        },
        clearIcdChildren(state) {
            state.children = [];
            state.childrenFor = null;
        },
        setIcdCurrent(state, action: { payload: IcdEntity | null }) {
            state.current = action.payload;
        },
    },
    extraReducers: (builder) => {
        // Chapters
        builder
            .addCase(fetchIcdChapters.pending, (state) => {
                state.chaptersLoading = true;
                state.error = null;
            })
            .addCase(fetchIcdChapters.fulfilled, (state, action) => {
                state.chaptersLoading = false;
                state.chapters = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchIcdChapters.rejected, (state, action) => {
                state.chaptersLoading = false;
                state.error = (action.payload as string) || "Request failed";
            });

        // Search
        builder
            .addCase(searchIcd.pending, (state) => {
                state.searchLoading = true;
                state.error = null;
            })
            .addCase(searchIcd.fulfilled, (state, action) => {
                state.searchLoading = false;
                state.searchQuery = action.payload.q;
                state.searchResults = Array.isArray(action.payload.results)
                    ? action.payload.results
                    : [];
            })
            .addCase(searchIcd.rejected, (state, action) => {
                state.searchLoading = false;
                state.error = (action.payload as string) || "Request failed";
            });

        // By code (used for code-like searches; page falls back to text search on miss)
        builder
            .addCase(fetchIcdByCode.pending, (state) => {
                state.searchLoading = true;
                state.error = null;
            })
            .addCase(fetchIcdByCode.fulfilled, (state, action) => {
                state.searchLoading = false;
                state.searchQuery = action.payload?.code || "";
                state.searchResults = action.payload ? [action.payload] : [];
            })
            .addCase(fetchIcdByCode.rejected, (state) => {
                // A miss is expected here; the page falls back to text search.
                state.searchLoading = false;
            });

        // Single entity
        builder
            .addCase(fetchIcdEntity.pending, (state) => {
                state.currentLoading = true;
                state.error = null;
            })
            .addCase(fetchIcdEntity.fulfilled, (state, action) => {
                state.currentLoading = false;
                state.current = action.payload || null;
            })
            .addCase(fetchIcdEntity.rejected, (state, action) => {
                state.currentLoading = false;
                state.error = (action.payload as string) || "Request failed";
            });

        // Children
        builder
            .addCase(fetchIcdChildren.pending, (state, action) => {
                state.childrenLoading = true;
                state.error = null;
                state.childrenFor = action.meta.arg;
                state.children = [];
            })
            .addCase(fetchIcdChildren.fulfilled, (state, action) => {
                // Ignore responses for an entity the user has already navigated away from
                if (state.childrenFor !== action.meta.arg) return;
                state.childrenLoading = false;
                state.children = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchIcdChildren.rejected, (state, action) => {
                if (state.childrenFor !== action.meta.arg) return;
                state.childrenLoading = false;
                state.error = (action.payload as string) || "Request failed";
            });

        // Crawl status
        builder
            .addCase(fetchIcdCrawlStatus.pending, (state) => {
                state.crawlLoading = true;
            })
            .addCase(fetchIcdCrawlStatus.fulfilled, (state, action) => {
                state.crawlLoading = false;
                state.crawlStatus = action.payload || null;
            })
            .addCase(fetchIcdCrawlStatus.rejected, (state, action) => {
                state.crawlLoading = false;
                state.error = (action.payload as string) || "Request failed";
            });

        // Crawl start / stop
        builder
            .addCase(startIcdCrawl.pending, (state) => {
                state.crawlActionLoading = true;
                state.error = null;
                state.message = null;
            })
            .addCase(startIcdCrawl.fulfilled, (state, action) => {
                state.crawlActionLoading = false;
                state.message = action.payload?.started
                    ? "ICD sync started"
                    : action.payload?.reason
                        ? `Sync not started: ${action.payload.reason}`
                        : "Sync not started";
            })
            .addCase(startIcdCrawl.rejected, (state, action) => {
                state.crawlActionLoading = false;
                state.error = (action.payload as string) || "Request failed";
            });

        builder
            .addCase(stopIcdCrawl.pending, (state) => {
                state.crawlActionLoading = true;
                state.error = null;
                state.message = null;
            })
            .addCase(stopIcdCrawl.fulfilled, (state, action) => {
                state.crawlActionLoading = false;
                state.message = action.payload?.stopped
                    ? "Stopping sync…"
                    : action.payload?.reason || "Nothing to stop";
            })
            .addCase(stopIcdCrawl.rejected, (state, action) => {
                state.crawlActionLoading = false;
                state.error = (action.payload as string) || "Request failed";
            });
    },
});

export const { clearIcdError, clearIcdSearch, clearIcdChildren, setIcdCurrent } =
    icdSlice.actions;
export default icdSlice.reducer;