import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface FeedbackItem {
    _id: string;
    company: string;
    title: string;
    body: string;
    createdBy: string | { _id: string; firstName?: string; lastName?: string; email?: string };
    createdAt: string;
    updatedAt: string;
}

export interface FeedbackListResponse {
    items: FeedbackItem[];
    total: number;
    limit: number;
    page: number;
    pages: number;
}

export interface FeedbacksState {
    feedbacks: FeedbackItem[];
    currentFeedback: FeedbackItem | null;
    loading: boolean;
    submitting: boolean;
    error: string | null;
    message: string | null;
    pagination: {
        page: number;
        limit: number;
        totalDocs: number;
        totalPages: number;
    };
}

const initialState: FeedbacksState = {
    feedbacks: [],
    currentFeedback: null,
    loading: false,
    submitting: false,
    error: null,
    message: null,
    pagination: {
        page: 1,
        limit: 10,
        totalDocs: 0,
        totalPages: 1,
    },
};

/* -------------------------------------------------------------------------- */
/*  Thunk factory                                                             */
/* -------------------------------------------------------------------------- */

const base = (companyId: string) => `/companies/${companyId}/feedbacks`;

function mk<A, T>(type: string, fallback: string, fn: (arg: A) => Promise<ApiSuccess<T>>) {
    return createAsyncThunk<ApiSuccess<T>, A, { rejectValue: string }>(`feedbacks/${type}`, async (arg, { rejectWithValue }) => {
        try {
            console.log(`[Thunk feedbacks/${type}] request args:`, arg);
            const res = await fn(arg);
            console.log(`[Thunk feedbacks/${type}] response:`, res);
            return res;
        } catch (err) {
            console.error(`[Thunk feedbacks/${type}] error:`, err);
            return rejectWithValue(getErrorMessage(err, fallback));
        }
    });
}

type C = { companyId: string };

/* ---- Thunks ---- */
export const createFeedback = mk<C & { title: string; body: string }, FeedbackItem>(
    "create",
    "Could not submit feedback",
    async ({ companyId, title, body }) => (await api.post(`${base(companyId)}`, { title, body })).data
);

export const fetchFeedbacks = mk<C & { scope?: "mine" | "all"; search?: string; page?: number; limit?: number }, FeedbackListResponse>(
    "fetchAll",
    "Failed to load feedbacks",
    async ({ companyId, scope, search, page, limit }) => (await api.get(`${base(companyId)}`, { params: { scope, search, page, limit } })).data
);

export const fetchFeedbackById = mk<C & { feedbackId: string }, FeedbackItem>(
    "fetchOne",
    "Failed to load feedback detail",
    async ({ companyId, feedbackId }) => (await api.get(`${base(companyId)}/${feedbackId}`)).data
);

export const updateFeedback = mk<C & { feedbackId: string; title?: string; body?: string }, FeedbackItem>(
    "update",
    "Could not update feedback",
    async ({ companyId, feedbackId, title, body }) => (await api.patch(`${base(companyId)}/${feedbackId}`, { title, body })).data
);

export const deleteFeedback = mk<C & { feedbackId: string }, { success: boolean }>(
    "delete",
    "Could not delete feedback",
    async ({ companyId, feedbackId }) => (await api.delete(`${base(companyId)}/${feedbackId}`)).data
);

/* -------------------------------------------------------------------------- */
/*  Slice                                                                     */
/* -------------------------------------------------------------------------- */

const feedbacksSlice = createSlice({
    name: "feedbacks",
    initialState,
    reducers: {
        clearFeedbackMessage(s) {
            console.log("reducers - clearFeedbackMessage");
            s.error = null;
            s.message = null;
        },
        clearCurrentFeedback(s) {
            console.log("reducers - clearCurrentFeedback");
            s.currentFeedback = null;
        },
    },
    extraReducers: (b) => {
        const fail = (s: FeedbacksState, a: any) => {
            console.error("extraReducers - action failed:", a);
            s.loading = false;
            s.submitting = false;
            s.error = a.payload || "Request failed";
        };

        /* Create */
        b.addCase(createFeedback.pending, (s) => {
            console.log("createFeedback.pending");
            s.submitting = true;
            s.error = null;
            s.message = null;
        })
            .addCase(createFeedback.fulfilled, (s, a) => {
                console.log("createFeedback.fulfilled payload:", a.payload);
                s.submitting = false;
                const newFeedback = (a.payload as any).feedback || a.payload.data;
                if (newFeedback) {
                    s.feedbacks.unshift(newFeedback);
                }
                s.message = "Feedback submitted successfully";
            })
            .addCase(createFeedback.rejected, fail);

        /* Fetch List */
        b.addCase(fetchFeedbacks.pending, (s) => {
            console.log("fetchFeedbacks.pending");
            s.loading = true;
            s.error = null;
        })
            .addCase(fetchFeedbacks.fulfilled, (s, a) => {
                console.log("fetchFeedbacks.fulfilled payload:", a.payload);
                s.loading = false;
                const payloadData = (a.payload as any).items ? a.payload : a.payload.data;

                if (payloadData && Array.isArray((payloadData as any).items)) {
                    const res = payloadData as unknown as FeedbackListResponse;
                    s.feedbacks = res.items;
                    s.pagination = {
                        page: res.page,
                        limit: res.limit,
                        totalDocs: res.total,
                        totalPages: res.pages,
                    };
                } else if (payloadData && Array.isArray((payloadData as any).docs)) {
                    const res = payloadData as any;
                    s.feedbacks = res.docs;
                    s.pagination = {
                        page: res.page,
                        limit: res.limit,
                        totalDocs: res.totalDocs,
                        totalPages: res.totalPages,
                    };
                } else if (Array.isArray(payloadData)) {
                    s.feedbacks = payloadData;
                }
            })
            .addCase(fetchFeedbacks.rejected, fail);

        /* Fetch Single Detail */
        b.addCase(fetchFeedbackById.pending, (s) => {
            console.log("fetchFeedbackById.pending");
            s.loading = true;
            s.error = null;
        })
            .addCase(fetchFeedbackById.fulfilled, (s, a) => {
                console.log("fetchFeedbackById.fulfilled payload:", a.payload);
                s.loading = false;
                s.currentFeedback = (a.payload as any).feedback || a.payload.data || null;
            })
            .addCase(fetchFeedbackById.rejected, fail);

        /* Update */
        b.addCase(updateFeedback.pending, (s) => {
            console.log("updateFeedback.pending");
            s.submitting = true;
            s.error = null;
        })
            .addCase(updateFeedback.fulfilled, (s, a) => {
                console.log("updateFeedback.fulfilled payload:", a.payload);
                s.submitting = false;
                const updated = (a.payload as any).feedback || a.payload.data;
                if (updated) {
                    s.currentFeedback = updated;
                    s.feedbacks = s.feedbacks.map((f) => (f._id === updated._id ? updated : f));
                }
                s.message = "Feedback updated successfully";
            })
            .addCase(updateFeedback.rejected, fail);

        /* Delete */
        b.addCase(deleteFeedback.pending, (s) => {
            console.log("deleteFeedback.pending");
            s.submitting = true;
            s.error = null;
        })
            .addCase(deleteFeedback.fulfilled, (s, a: any) => {
                console.log("deleteFeedback.fulfilled meta/payload:", a);
                s.submitting = false;
                const deletedId = a.meta.arg.feedbackId;
                s.feedbacks = s.feedbacks.filter((f) => f._id !== deletedId);
                if (s.currentFeedback?._id === deletedId) {
                    s.currentFeedback = null;
                }
                s.message = "Feedback deleted successfully";
            })
            .addCase(deleteFeedback.rejected, fail);
    },
});

export const { clearFeedbackMessage, clearCurrentFeedback } = feedbacksSlice.actions;
export default feedbacksSlice.reducer;