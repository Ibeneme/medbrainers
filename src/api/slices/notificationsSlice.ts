import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import api, { getErrorMessage, type ApiSuccess } from "../services";

/* -------------------------------------------------------------------------- */
/*  Types (mirror the backend's notifications.events.ts)                      */
/* -------------------------------------------------------------------------- */

export type NotificationModule =
    | "patients" | "clinical" | "vitals" | "labs" | "radiology" | "pharmacy" | "blood_bank" | "appointments"
    | "wards" | "emergency" | "maternity" | "theater" | "tasks" | "staff" | "compliance" | "telemedicine"
    | "company" | "system";
export type NotificationSeverity = "info" | "success" | "warning" | "critical";
/** who it was aimed at: everybody in the facility, one role, or just you */
export type NotificationAudience = "company" | "role" | "user";

export interface AppNotification {
    id: string;
    companyId: string;
    module: NotificationModule;
    /** machine-readable, e.g. "vital.alert", "lab.result_ready" — pick icons / deep links from it */
    type: string;
    title: string;
    body?: string;
    severity: NotificationSeverity;
    audience: NotificationAudience;
    entity?: { model?: string; id?: string; patientId?: string };
    actorName?: string;
    data?: Record<string, unknown>;
    createdAt: string;
    read?: boolean;
}

export interface UnreadCounts {
    total: number;
    byCompany: Record<string, number>;
    byModule: Record<string, number>;
}

export interface NotificationFacility {
    companyId: string;
    role: string;
}

export type NotificationsSocketStatus = "idle" | "connecting" | "connected" | "error";

export interface NotificationFilters {
    /** null = all my facilities (user scope); an id = one facility (company scope) */
    companyId: string | null;
    module: NotificationModule | null;
    unreadOnly: boolean;
}

export interface NotificationsState {
    items: AppNotification[];
    hasMore: boolean;
    filters: NotificationFilters;
    counts: UnreadCounts;
    /** which facility `counts` describes (null = all of mine) — live "+1" bumps only apply inside this scope */
    countsScope: string | null;
    facilities: NotificationFacility[];
    /** freshly pushed notifications waiting to be shown as toasts */
    toasts: AppNotification[];
    listLoading: boolean;
    loadingMore: boolean;
    saving: boolean;
    error: string | null;
    socketStatus: NotificationsSocketStatus;
    listRequestId: string | null;
}

const emptyCounts: UnreadCounts = { total: 0, byCompany: {}, byModule: {} };
const MAX_ITEMS = 500;
const MAX_TOASTS = 5;

const initialState: NotificationsState = {
    items: [],
    hasMore: false,
    filters: { companyId: null, module: null, unreadOnly: false },
    counts: emptyCounts,
    countsScope: null,
    facilities: [],
    toasts: [],
    listLoading: false,
    loadingMore: false,
    saving: false,
    error: null,
    socketStatus: "idle",
    listRequestId: null,
};

/* -------------------------------------------------------------------------- */
/*  Thunks — REST twins of the socket events (same service, same rules)       */
/*    no facilityId  → /notifications                      (you, all facilities) */
/*    facilityId     → /companies/:id/notifications        (one facility)        */
/* -------------------------------------------------------------------------- */

const base = (facilityId?: string | null) =>
    facilityId ? `/companies/${facilityId}/notifications` : `/notifications`;

type Scope = { facilityId?: string | null };
type ListResult = { items: AppNotification[]; hasMore: boolean };
type ThunkCfg = { rejectValue: string; state: { notifications: NotificationsState } };

export interface FetchNotificationsArgs extends Scope {
    module?: NotificationModule | null;
    unreadOnly?: boolean;
    limit?: number;
}

export const fetchNotifications = createAsyncThunk<ApiSuccess<ListResult>, FetchNotificationsArgs | void, ThunkCfg>(
    "notifications/fetch",
    async (arg, { rejectWithValue }) => {
        const { facilityId, module, unreadOnly, limit } = arg || {};
        try {
            return (
                await api.get(base(facilityId), {
                    params: {
                        module: module || undefined,
                        unreadOnly: unreadOnly || undefined,
                        limit,
                    },
                })
            ).data;
        } catch (err) {
            return rejectWithValue(getErrorMessage(err, "Failed to load notifications"));
        }
    },
);

/** "Load more": older notifications for the current filters. */
export const fetchMoreNotifications = createAsyncThunk<ApiSuccess<ListResult>, void, ThunkCfg>(
    "notifications/fetchMore",
    async (_, { getState, rejectWithValue }) => {
        const { items, filters } = getState().notifications;
        const before = items[items.length - 1]?.createdAt;
        try {
            return (
                await api.get(base(filters.companyId), {
                    params: {
                        module: filters.module || undefined,
                        unreadOnly: filters.unreadOnly || undefined,
                        before,
                    },
                })
            ).data;
        } catch (err) {
            return rejectWithValue(getErrorMessage(err, "Failed to load more notifications"));
        }
    },
    {
        condition: (_, { getState }) => {
            const s = getState().notifications;
            return s.hasMore && !s.listLoading && !s.loadingMore && s.items.length > 0;
        },
    },
);

/**
 * Unread badges. Pass a facilityId for a facility-only badge set, none for everything you can see.
 * The server also sends these in the socket's "ready" event, so this is mainly for REST-only clients and
 * for re-syncing after a reconnect or a bulk change.
 */
export const fetchNotificationCounts = createAsyncThunk<ApiSuccess<UnreadCounts>, Scope | void, ThunkCfg>(
    "notifications/fetchCounts",
    async (arg, { rejectWithValue }) => {
        try {
            return (await api.get(`${base(arg?.facilityId)}/counts`)).data;
        } catch (err) {
            return rejectWithValue(getErrorMessage(err, "Failed to load unread counts"));
        }
    },
);

/* -------------------------------------------------------------------------- */
/*  Mark as read / dismiss                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Mark specific notifications as read.
 * - If `facilityId` is provided → hits /companies/:id/notifications/read (company scope)
 * - If omitted → falls back to current filters.companyId, then to user scope
 */
export const markNotificationsRead = createAsyncThunk<
    ApiSuccess<{ ids: string[] }>,
    Scope & { ids: string[] },
    ThunkCfg
>("notifications/read", async ({ facilityId, ids }, { dispatch, getState, rejectWithValue }) => {
    try {
        const state = getState().notifications;
        // Prefer explicit facilityId, otherwise use the list the user is currently viewing
        const scopeId = facilityId ?? state.filters.companyId;

        const res = (await api.post(`${base(scopeId)}/read`, { ids })).data;

        // Refresh badges using the same scope the UI is showing
        void dispatch(fetchNotificationCounts({ facilityId: state.countsScope }));
        return res;
    } catch (err) {
        return rejectWithValue(getErrorMessage(err, "Could not mark as read"));
    }
});

/**
 * Mark everything (optionally filtered by module) as read.
 */
export const markAllNotificationsRead = createAsyncThunk<
    ApiSuccess<{ marked: number }>,
    Scope & { module?: NotificationModule | null },
    ThunkCfg
>("notifications/readAll", async ({ facilityId, module }, { dispatch, getState, rejectWithValue }) => {
    try {
        const state = getState().notifications;
        const scopeId = facilityId ?? state.filters.companyId;

        const res = (
            await api.post(`${base(scopeId)}/read-all`, {
                module: module || undefined,
            })
        ).data;

        void dispatch(fetchNotificationCounts({ facilityId: state.countsScope }));
        return res;
    } catch (err) {
        return rejectWithValue(getErrorMessage(err, "Could not mark all as read"));
    }
});

/**
 * Dismiss (hide) specific notifications.
 */
export const dismissNotifications = createAsyncThunk<
    ApiSuccess<{ ids: string[] }>,
    Scope & { ids: string[] },
    ThunkCfg
>("notifications/dismiss", async ({ facilityId, ids }, { dispatch, getState, rejectWithValue }) => {
    try {
        const state = getState().notifications;
        const scopeId = facilityId ?? state.filters.companyId;

        const res = (await api.post(`${base(scopeId)}/dismiss`, { ids })).data;

        void dispatch(fetchNotificationCounts({ facilityId: state.countsScope }));
        return res;
    } catch (err) {
        return rejectWithValue(getErrorMessage(err, "Could not dismiss"));
    }
});

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const bump = (c: UnreadCounts, n: Pick<AppNotification, "companyId" | "module">, by: number) => {
    c.total = Math.max(0, c.total + by);
    c.byCompany[n.companyId] = Math.max(0, (c.byCompany[n.companyId] || 0) + by);
    c.byModule[n.module] = Math.max(0, (c.byModule[n.module] || 0) + by);
};

/** does a live notification belong in the list the person is currently looking at? */
const matchesFilters = (f: NotificationFilters, n: AppNotification) =>
    (!f.companyId || f.companyId === n.companyId) && (!f.module || f.module === n.module);

const inCountsScope = (s: NotificationsState, n: AppNotification) =>
    !s.countsScope || s.countsScope === n.companyId;

function markLocallyRead(s: NotificationsState, ids: Set<string>) {
    for (const it of s.items) {
        if (!ids.has(it.id) || it.read) continue;
        it.read = true;
        if (inCountsScope(s, it)) bump(s.counts, it, -1); // instant feedback; the follow-up counts fetch makes it exact
    }
    if (s.filters.unreadOnly) s.items = s.items.filter((i) => !ids.has(i.id));
}

function removeLocally(s: NotificationsState, ids: Set<string>) {
    for (const it of s.items) {
        if (ids.has(it.id) && !it.read && inCountsScope(s, it)) bump(s.counts, it, -1);
    }
    s.items = s.items.filter((i) => !ids.has(i.id));
    s.toasts = s.toasts.filter((i) => !ids.has(i.id));
}

/* -------------------------------------------------------------------------- */
/*  Slice                                                                     */
/* -------------------------------------------------------------------------- */

const notificationsSlice = createSlice({
    name: "notifications",
    initialState,
    reducers: {
        clearNotificationsError(s) {
            s.error = null;
        },
        dismissToast(s, a: PayloadAction<string>) {
            s.toasts = s.toasts.filter((t) => t.id !== a.payload);
        },
        clearToasts(s) {
            s.toasts = [];
        },
        /** sign-out: wipe everything (notifications carry patient details) */
        resetNotifications() {
            return initialState;
        },

        /* ---- live events (dispatched by realtime.ts) ---- */
        notificationsSocketStatusChanged(s, a: PayloadAction<NotificationsSocketStatus>) {
            s.socketStatus = a.payload;
        },
        /** the socket's "ready": badge numbers and your facilities, no extra request needed */
        notificationsReady(s, a: PayloadAction<{ unread: UnreadCounts; facilities: NotificationFacility[] }>) {
            s.socketStatus = "connected";
            s.facilities = a.payload.facilities;
            // "ready" always describes everything you can see; only adopt it when that is the scope on screen
            if (!s.countsScope) s.counts = a.payload.unread;
        },
        /** "notification:new" — company / role / user pushes all arrive here */
        notificationReceived(s, a: PayloadAction<AppNotification>) {
            const n = { ...a.payload, read: false };
            if (s.items.some((i) => i.id === n.id) || s.toasts.some((t) => t.id === n.id)) return; // reconnect replays
            if (inCountsScope(s, n)) bump(s.counts, n, +1); // the documented client-side increment
            if (matchesFilters(s.filters, n)) s.items = [n, ...s.items].slice(0, MAX_ITEMS);
            s.toasts = [n, ...s.toasts].slice(0, MAX_TOASTS);
        },
        /** another tab / device marked things read */
        notificationsReadRemotely(s, a: PayloadAction<{ ids: string[]; all?: boolean; companyId?: string; module?: string }>) {
            const { ids, all, companyId, module } = a.payload;
            const set = new Set(ids);
            if (all) {
                for (const it of s.items) {
                    if ((!companyId || it.companyId === companyId) && (!module || it.module === module)) set.add(it.id);
                }
            }
            markLocallyRead(s, set);
            s.toasts = s.toasts.filter((t) => !set.has(t.id));
        },
        /** another tab / device dismissed things */
        notificationsDismissedRemotely(s, a: PayloadAction<{ ids: string[] }>) {
            removeLocally(s, new Set(a.payload.ids));
        },
    },
    extraReducers: (b) => {
        const fail = (s: NotificationsState, a: any) => {
            s.listLoading = false;
            s.loadingMore = false;
            s.saving = false;
            s.error = a.payload || "Request failed";
        };

        b.addCase(fetchNotifications.pending, (s, a) => {
            const arg = (a.meta.arg || {}) as FetchNotificationsArgs;
            s.listLoading = true;
            s.error = null;
            s.listRequestId = a.meta.requestId;
            s.filters = {
                companyId: arg.facilityId ?? null,
                module: arg.module ?? null,
                unreadOnly: !!arg.unreadOnly,
            };
        })
            .addCase(fetchNotifications.fulfilled, (s, a) => {
                if (a.meta.requestId !== s.listRequestId) return; // a newer filter change overtook this one
                s.listLoading = false;
                s.items = a.payload.data?.items || [];
                s.hasMore = !!a.payload.data?.hasMore;
            })
            .addCase(fetchNotifications.rejected, (s, a) => {
                if (a.meta.requestId !== s.listRequestId) return;
                fail(s, a);
            })

            .addCase(fetchMoreNotifications.pending, (s) => void ((s.loadingMore = true), (s.error = null)))
            .addCase(fetchMoreNotifications.fulfilled, (s, a) => {
                s.loadingMore = false;
                const seen = new Set(s.items.map((i) => i.id));
                s.items = [...s.items, ...(a.payload.data?.items || []).filter((i) => !seen.has(i.id))].slice(
                    0,
                    MAX_ITEMS,
                );
                s.hasMore = !!a.payload.data?.hasMore;
            })
            .addCase(fetchMoreNotifications.rejected, fail)

            .addCase(fetchNotificationCounts.pending, (s, a) => {
                // remember which scope the answer is for before it lands, so live "+1" bumps stay consistent
                s.countsScope = (a.meta.arg as Scope | undefined)?.facilityId ?? null;
            })
            .addCase(fetchNotificationCounts.fulfilled, (s, a) => {
                if (a.payload.data) s.counts = a.payload.data;
            })
            .addCase(fetchNotificationCounts.rejected, fail)

            .addCase(markNotificationsRead.pending, (s) => void (s.saving = true))
            .addCase(markNotificationsRead.fulfilled, (s, a) => {
                s.saving = false;
                markLocallyRead(s, new Set(a.payload.data?.ids || []));
            })
            .addCase(markNotificationsRead.rejected, fail)

            .addCase(markAllNotificationsRead.pending, (s) => void (s.saving = true))
            .addCase(markAllNotificationsRead.fulfilled, (s, a) => {
                s.saving = false;
                const { facilityId, module } = a.meta.arg;
                const scopeId = facilityId ?? s.filters.companyId;
                const ids = new Set(
                    s.items
                        .filter(
                            (i) =>
                                (!scopeId || i.companyId === scopeId) &&
                                (!module || i.module === module),
                        )
                        .map((i) => i.id),
                );
                markLocallyRead(s, ids);
                s.toasts = s.toasts.filter((t) => !ids.has(t.id));
            })
            .addCase(markAllNotificationsRead.rejected, fail)

            .addCase(dismissNotifications.pending, (s) => void (s.saving = true))
            .addCase(dismissNotifications.fulfilled, (s, a) => {
                s.saving = false;
                removeLocally(s, new Set(a.payload.data?.ids || []));
            })
            .addCase(dismissNotifications.rejected, fail);
    },
});

export const {
    clearNotificationsError,
    dismissToast,
    clearToasts,
    resetNotifications,
    notificationsSocketStatusChanged,
    notificationsReady,
    notificationReceived,
    notificationsReadRemotely,
    notificationsDismissedRemotely,
} = notificationsSlice.actions;

/* ---- selectors (the slice must be registered under the key "notifications") ---- */
type Root = { notifications: NotificationsState };
export const selectNotifications = (s: Root) => s.notifications.items;
export const selectUnreadTotal = (s: Root) => s.notifications.counts.total;
export const selectUnreadByModule = (s: Root) => s.notifications.counts.byModule;
export const selectUnreadForCompany = (companyId: string) => (s: Root) =>
    s.notifications.counts.byCompany[companyId] || 0;
export const selectNotificationToasts = (s: Root) => s.notifications.toasts;

export default notificationsSlice.reducer;