"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchDashboardAlerts,
  fetchDashboardCapacity,
  fetchDashboardDepartments,
  fetchDashboardOverview,
  fetchDashboardTrends,
  type DashboardSection,
} from "@/api/slices/dashboardSlice";
import { useFacilityId } from "@/hooks/useFacilityId";

/**
 * Loads the requested dashboard sections for the active facility and keeps them
 * fresh: refetches on a timer (paused while the tab is hidden) and when the tab
 * becomes visible again after being away.
 */
export function useDashboard(
  sections: DashboardSection[],
  opts: { days?: number; intervalMs?: number } = {},
) {
  const dispatch = useAppDispatch();
  const { facilityId } = useFacilityId();
  const state = useAppSelector((s) => s.dashboard);
  const { days, intervalMs = 60_000 } = opts;

  // Stable key so callers can pass a fresh array literal every render.
  const key = sections.join(",");
  const lastFetch = useRef(0);

  const refresh = useCallback(() => {
    if (!facilityId) return;
    lastFetch.current = Date.now();
    const list = key.split(",") as DashboardSection[];
    if (list.includes("overview")) dispatch(fetchDashboardOverview({ facilityId }));
    if (list.includes("trends")) dispatch(fetchDashboardTrends({ facilityId, days }));
    if (list.includes("capacity")) dispatch(fetchDashboardCapacity({ facilityId }));
    if (list.includes("departments")) dispatch(fetchDashboardDepartments({ facilityId }));
    if (list.includes("alerts")) dispatch(fetchDashboardAlerts({ facilityId }));
  }, [dispatch, facilityId, key, days]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!facilityId || !intervalMs) return;
    const tick = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const id = window.setInterval(tick, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastFetch.current > intervalMs / 2) {
        refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [facilityId, intervalMs, refresh]);

  const anyLoading = sections.some((s) => state.loading[s]);
  const firstError = sections.map((s) => state.errors[s]).find(Boolean) || null;

  return { ...state, facilityId, refresh, anyLoading, error: firstError };
}
