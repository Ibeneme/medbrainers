"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { useFacilityId } from "@/hooks/useFacilityId";
import { useToast } from "@/contexts/toast-context";
import type { TelemedicineState } from "@/api/slices/telemedicineSlice";

/**
 * Telemedicine helper: facility context, slice state and an `act` wrapper that
 * unwraps a thunk and toasts success / error (same contract as useTheater).
 */
export function useTelemedicine() {
  const dispatch = useAppDispatch();
  const { facilityId, hasFacility, activeFacility } = useFacilityId();
  const telemedicine = useAppSelector((s) => s.telemedicine as TelemedicineState);
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

  return { dispatch, facilityId, hasFacility, activeFacility, telemedicine, act, showToast };
}
