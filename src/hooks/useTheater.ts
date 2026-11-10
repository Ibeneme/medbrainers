"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { useFacilityId } from "@/hooks/useFacilityId";
import { useToast } from "@/contexts/toast-context";
import type { TheaterState } from "@/api/slices/theaterSlice";

/**
 * Theatre helper: facility context, slice state and an `act` wrapper that
 * unwraps a thunk and toasts success / error (same contract as useBloodBank).
 */
export function useTheater() {
  const dispatch = useAppDispatch();
  const { facilityId, hasFacility, activeFacility } = useFacilityId();
  const theater = useAppSelector((s) => s.theater as TheaterState);
  const { showToast } = useToast();

  const act = useCallback(
    async <T = unknown>(action: any, successMessage?: string | false): Promise<T | null> => {
      try {
        const res = await dispatch(action).unwrap();
        if (successMessage !== false) {
          const msg = successMessage || res?.message;
          if (msg) showToast(msg, "success");
        }
        return (res?.data ?? true) as T;
      } catch (e) {
        showToast(typeof e === "string" ? e : "Something went wrong", "error");
        return null;
      }
    },
    [dispatch, showToast],
  );

  return { dispatch, facilityId, hasFacility, activeFacility, theater, act, showToast };
}
