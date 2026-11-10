"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchMyFacilities, fetchWards } from "@/api/slices";

/**
 * Loads the ward list for the active facility and tells the page when the
 * FIRST load has settled.
 *
 * Why this exists: after a browser reload the redux store is empty. Pages
 * used to render "Ward not found" / "Bed not found" immediately because the
 * list had not been fetched yet (or was never fetched at all, e.g. the ward
 * detail page). Pages should show a loader until `ready` is true and only then
 * decide that something does not exist.
 */
export function useWardsData() {
  const dispatch = useAppDispatch();
  const { activeFacilityId, initialized } = useAppSelector((s) => s.facilities);
  const { wards, loading, error } = useAppSelector((s) => s.wards);

  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const requested = useRef<string | null>(null);

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  const refresh = useCallback(async () => {
    if (!activeFacilityId) return;
    try {
      await dispatch(fetchWards(activeFacilityId)).unwrap();
    } catch {
      /* error is kept in the store */
    } finally {
      setLoadedFor(activeFacilityId);
    }
  }, [dispatch, activeFacilityId]);

  useEffect(() => {
    if (!activeFacilityId || requested.current === activeFacilityId) return;
    requested.current = activeFacilityId;
    refresh();
  }, [activeFacilityId, refresh]);

  const noFacility = initialized && !activeFacilityId;
  const ready = noFacility || (!!activeFacilityId && loadedFor === activeFacilityId);

  return {
    facilityId: activeFacilityId || "",
    wards,
    loading,
    error,
    ready,
    noFacility,
    refresh,
  };
}
