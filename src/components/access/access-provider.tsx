"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { API_CONFIG } from "@/api/config";
import { fetchMyAccess, hydrateAccess } from "@/api/slices/accessSlice";

const FOCUS_REFRESH_MS = 60_000;
const FORBIDDEN_THROTTLE_MS = 10_000;
const POLL_MS = 5 * 60_000;

/**
 * Keeps the permissions fresh:
 *  1. restores the last known permissions instantly after a reload (same user only),
 *  2. loads them for the active facility,
 *  3. re-checks when the tab regains focus, every 5 min, after any 403 from the API,
 *     and when the person clicks "Re-check my access".
 * So when an administrator changes someone's role, their screen follows within a minute (or at once on a 403).
 */
export default function AccessProvider() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const userId = useAppSelector((s) => s.auth.user?._id || s.auth.user?.id || "");
  const facilityId = useAppSelector(
    (s) => s.facilities.activeFacilityId || s.facilities.activeFacility?.id || s.auth.activeFacilityId || "",
  );
  const last = useRef(0);
  const lastForbidden = useRef(0);
  const hydrated = useRef(false);

  // 1) instant restore (client only, same user only)
  useEffect(() => {
    if (hydrated.current || !userId) return;
    hydrated.current = true;
    try {
      const raw = localStorage.getItem(API_CONFIG.ACCESS_KEY);
      if (!raw) return;
      const cached = JSON.parse(raw) as { userId?: string; byFacility?: Record<string, any> };
      if (cached.userId === userId && cached.byFacility) dispatch(hydrateAccess(cached.byFacility));
    } catch {
      /* ignore corrupt cache */
    }
  }, [userId, dispatch]);

  // 2) load for the active facility
  useEffect(() => {
    if (!accessToken || !facilityId) return;
    last.current = Date.now();
    dispatch(fetchMyAccess(facilityId));
  }, [accessToken, facilityId, dispatch]);

  // 3) keep it fresh
  useEffect(() => {
    if (!accessToken || !facilityId) return;
    const refresh = () => {
      last.current = Date.now();
      dispatch(fetchMyAccess(facilityId));
    };
    const onFocus = () => {
      if (document.visibilityState === "visible" && Date.now() - last.current > FOCUS_REFRESH_MS) refresh();
    };
    const onForbidden = () => {
      if (Date.now() - lastForbidden.current > FORBIDDEN_THROTTLE_MS) {
        lastForbidden.current = Date.now();
        refresh();
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("mb:forbidden", onForbidden);
    window.addEventListener("mb:refresh-access", refresh);
    const poll = window.setInterval(refresh, POLL_MS);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("mb:forbidden", onForbidden);
      window.removeEventListener("mb:refresh-access", refresh);
      window.clearInterval(poll);
    };
  }, [accessToken, facilityId, dispatch]);

  return null;
}
