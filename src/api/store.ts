/**
 * Redux store setup (Redux Toolkit).
 * Drop this into your Next.js app and wrap with <Provider store={store}>.
 */
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./slices";
import { API_CONFIG } from "./config";

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== "production",
});

/* Remember the active facility so it is available on the first render after a reload. */
if (typeof window !== "undefined") {
  let last: unknown;
  store.subscribe(() => {
    const { activeFacilityId, activeFacility } = store.getState().facilities;
    if (activeFacilityId === last) return;
    last = activeFacilityId;
    try {
      if (activeFacilityId) {
        localStorage.setItem(
          API_CONFIG.ACTIVE_FACILITY_KEY,
          JSON.stringify({ activeFacilityId, activeFacility }),
        );
      } else {
        localStorage.removeItem(API_CONFIG.ACTIVE_FACILITY_KEY);
      }
    } catch {
      /* storage unavailable (private mode / quota): ignore */
    }
  });
}

/* Remember the last known permissions so the first paint after a reload is correct.
   (Kept in localStorage — the user cookie is limited to ~4KB and can't hold this.) */
if (typeof window !== "undefined") {
  let lastAccess: unknown;
  store.subscribe(() => {
    const { byFacility } = store.getState().access;
    if (byFacility === lastAccess) return;
    lastAccess = byFacility;
    try {
      const u = store.getState().auth.user;
      const userId = u?._id || u?.id;
      // tagged with the user id so a different person logging in on this browser never inherits it
      if (userId && Object.keys(byFacility).length) {
        localStorage.setItem(API_CONFIG.ACCESS_KEY, JSON.stringify({ userId, byFacility }));
      } else {
        localStorage.removeItem(API_CONFIG.ACCESS_KEY);
      }
    } catch {
      /* ignore */
    }
  });
}

export type AppDispatch = typeof store.dispatch;
export type { RootState } from "./slices";

