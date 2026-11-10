"use client";

import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { useFacilityId } from "@/hooks/useFacilityId";
import { useToast } from "@/contexts/toast-context";
import { fetchPharmacySetup } from "@/api/slices";
import { currencySymbol, setActiveCurrency, DEFAULT_CURRENCY } from "@/constants/currencies";

/**
 * Pharmacy helper: gives pages the active facility, the pharmacy slice and an `act`
 * wrapper that dispatches a thunk, unwraps it and shows a success / error toast.
 * It also makes sure the pharmacy setup is loaded so every page prices in the
 * currency chosen under Pharmacy → Setup.
 */
export function usePharmacy() {
  const dispatch = useAppDispatch();
  const { facilityId, hasFacility, activeFacility } = useFacilityId();
  const pharmacy = useAppSelector((s) => s.pharmacy);
  const { showToast } = useToast();

  // keep the module-level formatter in sync *during render* so money() is right on first paint
  const currency = pharmacy.setup?.settings?.currency || DEFAULT_CURRENCY;
  setActiveCurrency(currency);

  const hasSetup = !!pharmacy.setup;
  useEffect(() => {
    if (facilityId && !hasSetup) dispatch(fetchPharmacySetup({ facilityId }));
  }, [dispatch, facilityId, hasSetup]);

  /** Returns the thunk result's `data` on success, or `null` after showing an error toast. */
  const act = useCallback(
    async <T = any>(action: any, successMessage?: string | false): Promise<T | null> => {
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

  return {
    dispatch,
    facilityId,
    hasFacility,
    activeFacility,
    pharmacy,
    act,
    showToast,
    currency,
    currencySymbol: currencySymbol(currency),
  };
}
