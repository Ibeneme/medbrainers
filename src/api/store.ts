/**
 * Redux store setup (Redux Toolkit).
 * Drop this into your Next.js app and wrap with <Provider store={store}>.
 */
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./slices";

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== "production",
});

export type AppDispatch = typeof store.dispatch;
export type { RootState } from "./slices";

