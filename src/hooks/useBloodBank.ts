"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { useFacilityId } from "@/hooks/useFacilityId";
import { useToast } from "@/contexts/toast-context";
import { BloodBankState } from "@/api";


/**
 * Blood bank helper: facility context, slice state, and an `act` wrapper
 * that unwraps a thunk and toasts success / error the same way pharmacy pages do.
 */
export function useBloodBank() {
  const dispatch = useAppDispatch();
  const { facilityId, hasFacility, activeFacility } = useFacilityId();
  const bloodBank = useAppSelector((s) => s.bloodBank as BloodBankState);
  const { showToast } = useToast();

  /**
   * Dispatch a thunk created with the blood-bank `mk` factory.
   * - On success: toasts `successMessage` (or the API message) unless `false` is passed.
   * - On failure: toasts the rejection value and returns `null`.
   * - Returns `res.data` (or `true` if the response has no data payload).
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
        const message = typeof e === "string" ? e : "Something went wrong";
        showToast(message, "error");
        return null;
      }
    },
    [dispatch, showToast],
  );

  return {
    dispatch,
    facilityId,
    hasFacility,
    activeFacility,
    bloodBank,
    act,
    showToast,
  };
}