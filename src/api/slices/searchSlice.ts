import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

/* -------------------------------------------------------------------------- */
/*  Types (mirror the backend's search.schemas.ts)                            */
/* -------------------------------------------------------------------------- */

export const MIN_SEARCH_LENGTH = 2;
export const PATIENT_STATUSES = ["active", "inactive", "deceased", "transferred", "discharged"] as const;
export type PatientStatus = (typeof PATIENT_STATUSES)[number];

export interface PatientHit {
    id: string;
    companyId: string;
    /** only present when searching several facilities at once */
    companyName?: string;
    mrn: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    fullName: string;
    dateOfBirth?: string;
    age?: number;
    gender?: string;
    bloodGroup?: string;
    phone?: string;
    email?: string;
    status: string;
    admitted: boolean;
    /** which fields the query matched: "name" | "mrn" | "phone" | "email" | "nationalId" */
    matchedOn: string[];
}

export interface PatientSearchResult {
    requestId?: string;
    query: string;
    hits: PatientHit[];
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    tookMs: number;
    /** a newer search replaced this one — ignore */
    stale?: boolean;
}

export type SearchSocketStatus = "idle" | "connecting" | "connected" | "error";

export interface SearchFilters {
    status?: PatientStatus;
    gender?: string;
}

export interface SearchState {
    /** what is in the search box */
    query: string;
    /** null = every facility the person belongs to */
    facilityId: string | null;
    filters: SearchFilters;
    hits: PatientHit[];
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    tookMs: number | null;
    /** true once a search for `query` has come back (so the UI can tell "no results" from "not searched yet") */
    searched: boolean;
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    /** the newest request — answers for older ones are thrown away (typing fast, slow network) */
    latestRequestId: string | null;
    /** this session's recent queries, in memory only (they can contain patient names, so nothing is persisted) */
    recent: string[];
    socketStatus: SearchSocketStatus;
}

const initialState: SearchState = {
    query: "",
    facilityId: null,
    filters: {},
    hits: [],
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
    tookMs: null,
    searched: false,
    loading: false,
    loadingMore: false,
    error: null,
    latestRequestId: null,
    recent: [],
    socketStatus: "idle",
};

/* -------------------------------------------------------------------------- */
/*  REST thunks (the socket path is driven by realtime.ts + the actions below) */
/* -------------------------------------------------------------------------- */

export interface SearchParams {
    /** omit / null to search every facility you belong to */
    facilityId?: string | null;
    query: string;
    status?: PatientStatus;
    gender?: string;
    page?: number;
    limit?: number;
}

/**
 * Search patients over REST. Same service and rules as the socket, so use it for the first paint, for clients
 * without a socket, or as a fallback while the socket reconnects.
 * Queries shorter than MIN_SEARCH_LENGTH are not sent (dispatch `queryChanged` to clear the old results).
 */
export const searchPatients = createAsyncThunk<ApiSuccess<PatientSearchResult>, SearchParams, { rejectValue: string }>(
    "search/patients",
    async ({ facilityId, query, ...rest }, { rejectWithValue, signal }) => {
        try {
            const url = facilityId ? `/companies/${facilityId}/search/patients` : `/search/patients`;
            return (await api.get(url, { params: { q: query.trim(), ...rest }, signal })).data;
        } catch (err) {
            return rejectWithValue(getErrorMessage(err, "Search failed"));
        }
    },
    { condition: (arg) => arg.query.trim().length >= MIN_SEARCH_LENGTH },
);

/** "Load more": the next page of whatever is currently searched. */
export const searchMorePatients = createAsyncThunk<
    ApiSuccess<PatientSearchResult>,
    void,
    { rejectValue: string; state: { search: SearchState } }
>(
    "search/more",
    async (_, { getState, rejectWithValue, signal }) => {
        const { query, facilityId, filters, page, limit } = getState().search;
        try {
            const url = facilityId ? `/companies/${facilityId}/search/patients` : `/search/patients`;
            return (await api.get(url, { params: { q: query.trim(), ...filters, page: page + 1, limit }, signal })).data;
        } catch (err) {
            return rejectWithValue(getErrorMessage(err, "Could not load more results"));
        }
    },
    {
        condition: (_, { getState }) => {
            const s = getState().search;
            return s.hasMore && !s.loading && !s.loadingMore && s.query.trim().length >= MIN_SEARCH_LENGTH;
        },
    },
);

/* -------------------------------------------------------------------------- */
/*  Slice                                                                     */
/* -------------------------------------------------------------------------- */

const remember = (recent: string[], q: string) => {
    const t = q.trim();
    if (t.length < MIN_SEARCH_LENGTH) return recent;
    return [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 8);
};

function applyResult(s: SearchState, r: PatientSearchResult) {
    s.loading = false;
    s.loadingMore = false;
    s.error = null;
    s.searched = true;
    s.page = r.page;
    s.limit = r.limit;
    s.total = r.total;
    s.hasMore = r.hasMore;
    s.tookMs = r.tookMs;
    if (r.page > 1) {
        const seen = new Set(s.hits.map((h) => h.id));
        s.hits = [...s.hits, ...r.hits.filter((h) => !seen.has(h.id))];
    } else {
        s.hits = r.hits;
        s.recent = remember(s.recent, r.query);
    }
}

function begin(s: SearchState, requestId: string, p: SearchParams) {
    const more = (p.page ?? 1) > 1;
    s.loading = !more;
    s.loadingMore = more;
    s.error = null;
    s.latestRequestId = requestId;
    s.query = p.query;
    s.facilityId = p.facilityId ?? null;
    s.filters = { status: p.status, gender: p.gender };
    if (p.limit) s.limit = p.limit;
}

const searchSlice = createSlice({
    name: "search",
    initialState,
    reducers: {
        /** Call on every keystroke. Drops the old results as soon as the box is too short to search. */
        queryChanged(s, a: PayloadAction<string>) {
            s.query = a.payload;
            if (a.payload.trim().length < MIN_SEARCH_LENGTH) {
                s.hits = [];
                s.total = 0;
                s.hasMore = false;
                s.page = 1;
                s.searched = false;
                s.loading = false;
                s.loadingMore = false;
                s.error = null;
                s.latestRequestId = null; // anything still in flight is now stale
            }
        },
        /** Pick one facility, or null for "all my facilities". Clears results (they belong to the old scope). */
        searchScopeChanged(s, a: PayloadAction<string | null>) {
            s.facilityId = a.payload;
            s.hits = [];
            s.total = 0;
            s.hasMore = false;
            s.page = 1;
            s.searched = false;
            s.latestRequestId = null;
        },
        clearSearch(s) {
            const { recent, socketStatus, limit } = s;
            Object.assign(s, initialState, { recent, socketStatus, limit });
        },
        clearRecentSearches(s) {
            s.recent = [];
        },
        clearSearchError(s) {
            s.error = null;
        },

        /* ---- socket path (dispatched by realtime.ts) ---- */
        searchSocketRequested(s, a: PayloadAction<{ requestId: string } & SearchParams>) {
            begin(s, a.payload.requestId, a.payload);
        },
        searchSocketResult(s, a: PayloadAction<PatientSearchResult>) {
            const r = a.payload;
            // an answer for anything but the newest request is dropped: the server marks superseded ones stale,
            // and the requestId check also covers answers that crossed with a REST search
            if (r.stale || !r.requestId || r.requestId !== s.latestRequestId) return;
            applyResult(s, r);
        },
        searchSocketFailed(s, a: PayloadAction<{ requestId?: string; message: string }>) {
            if (a.payload.requestId && a.payload.requestId !== s.latestRequestId) return;
            s.loading = false;
            s.loadingMore = false;
            s.error = a.payload.message;
        },
        searchSocketStatusChanged(s, a: PayloadAction<SearchSocketStatus>) {
            s.socketStatus = a.payload;
        },
    },
    extraReducers: (b) => {
        b.addCase(searchPatients.pending, (s, a) => begin(s, a.meta.requestId, a.meta.arg))
            .addCase(searchPatients.fulfilled, (s, a) => {
                if (a.meta.requestId !== s.latestRequestId) return;
                if (a.payload.data) applyResult(s, a.payload.data);
            })
            .addCase(searchPatients.rejected, (s, a) => {
                if (a.meta.requestId !== s.latestRequestId || a.meta.aborted) return;
                s.loading = false;
                s.error = a.payload || "Search failed";
            })

            .addCase(searchMorePatients.pending, (s, a) => {
                s.loadingMore = true;
                s.error = null;
                s.latestRequestId = a.meta.requestId;
            })
            .addCase(searchMorePatients.fulfilled, (s, a) => {
                if (a.meta.requestId !== s.latestRequestId) return;
                if (a.payload.data) applyResult(s, a.payload.data);
            })
            .addCase(searchMorePatients.rejected, (s, a) => {
                if (a.meta.requestId !== s.latestRequestId || a.meta.aborted) return;
                s.loadingMore = false;
                s.error = a.payload || "Could not load more results";
            });
    },
});

export const {
    queryChanged,
    searchScopeChanged,
    clearSearch,
    clearRecentSearches,
    clearSearchError,
    searchSocketRequested,
    searchSocketResult,
    searchSocketFailed,
    searchSocketStatusChanged,
} = searchSlice.actions;

/* ---- selectors (the slice must be registered under the key "search") ---- */
type Root = { search: SearchState };
export const selectSearch = (s: Root) => s.search;
export const selectSearchHits = (s: Root) => s.search.hits;
export const selectSearchLoading = (s: Root) => s.search.loading;
export const selectSearchHasMore = (s: Root) => s.search.hasMore;
/** searched, finished, and nothing found — show "no patients match" */
export const selectSearchEmpty = (s: Root) => s.search.searched && !s.search.loading && s.search.hits.length === 0;

export default searchSlice.reducer;