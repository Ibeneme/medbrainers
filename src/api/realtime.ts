import { io, type Socket } from "socket.io-client";
import {
    fetchNotificationCounts,
    fetchNotifications,
    notificationReceived,
    notificationsDismissedRemotely,
    notificationsReadRemotely,
    notificationsReady,
    notificationsSocketStatusChanged,
    type AppNotification,
    type NotificationFilters,
    type NotificationFacility,
    type UnreadCounts,
} from "../api/slices/notificationsSlice";
import {
    searchSocketFailed,
    searchSocketRequested,
    searchSocketResult,
    searchSocketStatusChanged,
    MIN_SEARCH_LENGTH,
    type PatientSearchResult,
    type SearchParams,
} from "../api/slices/searchSlice";

/**
 * Connects the "/search" and "/notifications" sockets and feeds the two slices.
 * Call connectRealtime() once after sign-in and the returned disconnect() on sign-out.
 *
 *   const rt = connectRealtime({ origin: "https://api.example.com", getToken: () => store.getState().auth.accessToken, dispatch: store.dispatch,
 *                                getNotificationFilters: () => store.getState().notifications.filters });
 *   rt.searchPatients({ query: "ada ok", facilityId });      // live search, call on each (debounced) keystroke
 *   rt.disconnect();
 *
 * `origin` is the server ORIGIN (no "/api" prefix) — Socket.IO lives at /socket.io, not under your REST prefix.
 */
export interface RealtimeOptions {
    origin: string;
    /** current access token; may be async so you can refresh it first */
    getToken: () => string | null | undefined | Promise<string | null | undefined>;
    dispatch: (action: any) => any;
    /** so a reconnect can refill the list the person is looking at */
    getNotificationFilters?: () => NotificationFilters;
    /** Socket.IO path if the server mounts it elsewhere (default /socket.io) */
    path?: string;
}

type Ack<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

export function connectRealtime(opts: RealtimeOptions) {
    const { origin, dispatch, getToken, path } = opts;
    // function-form auth: every (re)connect asks for the CURRENT token, so a refreshed token is picked up
    const auth = (cb: (data: object) => void) => void Promise.resolve(getToken()).then((token) => cb({ token: token || "" }));
    const make = (ns: string) => io(`${origin}${ns}`, { auth, path, transports: ["websocket", "polling"], reconnectionDelayMax: 10_000 });

    const search = make("/search");
    const notifications = make("/notifications");

    /* ---- shared: when the SERVER drops us (expired token) socket.io does not retry on its own ---- */
    const reviveOnServerDrop = (s: Socket) =>
        s.on("disconnect", (reason) => {
            if (reason === "io server disconnect") s.connect();
        });
    reviveOnServerDrop(search);
    reviveOnServerDrop(notifications);

    /* ---- search ---- */
    dispatch(searchSocketStatusChanged("connecting"));
    search.on("connect", () => dispatch(searchSocketStatusChanged("connected")));
    search.on("disconnect", () => dispatch(searchSocketStatusChanged("connecting")));
    search.on("connect_error", () => dispatch(searchSocketStatusChanged("error")));

    /* ---- notifications ---- */
    let first = true;
    dispatch(notificationsSocketStatusChanged("connecting"));
    notifications.on("ready", (info: { unread: UnreadCounts; facilities: NotificationFacility[] }) => {
        dispatch(notificationsReady(info));
        if (!first) {
            // we were offline: anything pushed meanwhile was missed — refill the list on screen (counts came with "ready")
            const f = opts.getNotificationFilters?.();
            dispatch(fetchNotifications({ facilityId: f?.companyId, module: f?.module, unreadOnly: f?.unreadOnly }));
        }
        first = false;
    });
    notifications.on("disconnect", () => dispatch(notificationsSocketStatusChanged("connecting")));
    notifications.on("connect_error", () => dispatch(notificationsSocketStatusChanged("error")));
    notifications.on("notification:new", (n: AppNotification) => dispatch(notificationReceived(n)));
    notifications.on("notifications:read", (p: { ids: string[]; all?: boolean; companyId?: string; module?: string }) => {
        dispatch(notificationsReadRemotely(p));
        dispatch(fetchNotificationCounts()); // exact numbers; the local update above is just instant feedback
    });
    notifications.on("notifications:dismissed", (p: { ids: string[] }) => {
        dispatch(notificationsDismissedRemotely(p));
        dispatch(fetchNotificationCounts());
    });

    return {
        /** Live patient search. Resolves with the result (also dispatched to the store); older in-flight searches come back stale and are ignored. */
        searchPatients(p: SearchParams): Promise<PatientSearchResult | null> {
            if (p.query.trim().length < MIN_SEARCH_LENGTH) return Promise.resolve(null);
            const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
            dispatch(searchSocketRequested({ requestId, ...p }));
            return new Promise((resolve) => {
                search.timeout(15_000).emit(
                    "patients:search",
                    {
                        requestId,
                        query: p.query,
                        companyId: p.facilityId || undefined,
                        status: p.status,
                        gender: p.gender,
                        page: p.page,
                        limit: p.limit,
                    },
                    (err: Error | null, res?: Ack<PatientSearchResult>) => {
                        if (err || !res) {
                            dispatch(searchSocketFailed({ requestId, message: "Search timed out — check your connection" }));
                            return resolve(null);
                        }
                        if (res.ok) {
                            dispatch(searchSocketResult(res.data));
                            return resolve(res.data.stale ? null : res.data);
                        }
                        dispatch(searchSocketFailed({ requestId, message: res.error.message }));
                        resolve(null);
                    },
                );
            });
        },
        disconnect() {
            search.close();
            notifications.close();
            dispatch(searchSocketStatusChanged("idle"));
            dispatch(notificationsSocketStatusChanged("idle"));
        },
        sockets: { search, notifications },
    };
}