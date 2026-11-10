"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { useFacilityId } from "@/hooks/useFacilityId";
import { useToast } from "@/contexts/toast-context";
import type { MaternityState } from "@/api/slices/maternitySlice";

/**
 * Maternity helper: facility context, slice state, and an `act` wrapper that
 * unwraps a thunk and toasts success / error (same contract as useBloodBank).
 */
export function useMaternity() {
  const dispatch = useAppDispatch();
  const { facilityId, hasFacility, activeFacility } = useFacilityId();
  const maternity = useAppSelector((s) => s.maternity as MaternityState);
  const { showToast } = useToast();

  /**
   * Dispatch a thunk created with the maternity `mk` factory.
   * - Success: toasts `successMessage` (or the API message) unless `false`.
   * - Failure: toasts the rejection value and returns `null`.
   * - Returns `res.data` (or `true` when the response has no data payload).
   */
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

  return { dispatch, facilityId, hasFacility, activeFacility, maternity, act, showToast };
}
