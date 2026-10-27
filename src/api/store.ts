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

export type AppDispatch = typeof store.dispatch;
export type { RootState } from "./slices";

