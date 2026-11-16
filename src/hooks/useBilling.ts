"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { useFacilityId } from "@/hooks/useFacilityId";
import { useToast } from "@/contexts/toast-context";
import { fetchBillingSettings, resetBilling } from "@/api/slices";
import { DEFAULT_CURRENCY, currencySymbol, formatMoney } from "@/constants/currencies";

/**
 * Billing helper (same shape as usePharmacy): active facility, the billing slice, and an `act`
 * wrapper that dispatches a thunk, unwraps it and shows a toast on failure (and on success when
 * you pass a message).
 *
 * Tenant safety: when the active facility changes, the billing state is wiped so one hospital's
 * invoices/prices can never flash on screen for another.
 */
export function useBilling() {
  const dispatch = useAppDispatch();
  const { facilityId, hasFacility, activeFacility } = useFacilityId();
  const billing = useAppSelector((s) => s.billing);
  const { showToast } = useToast();

  const previous = useRef(facilityId);
  useEffect(() => {
    if (previous.current && previous.current !== facilityId) dispatch(resetBilling());
    previous.current = facilityId;
  }, [dispatch, facilityId]);

  const hasSettings = !!billing.settings;
  useEffect(() => {
    if (facilityId && !hasSettings) dispatch(fetchBillingSettings({ facilityId }));
  }, [dispatch, facilityId, hasSettings]);

  const currency = billing.settings?.currency || DEFAULT_CURRENCY;
  /** Format an amount in the facility's billing currency (or an invoice's own currency). */
  const money = useCallback((n?: number | null, cur?: string) => formatMoney(n, cur || currency), [currency]);

  /** Returns the thunk result's `data` on success, or `null` after showing an error toast. */
  const act = useCallback(
    async <T = any>(action: any, successMessage?: string): Promise<T | null> => {
      try {
        const res = await dispatch(action).unwrap();
        if (successMessage) showToast(successMessage, "success");
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
    billing,
    settings: billing.settings,
    act,
    showToast,
    currency,
    currencySymbol: currencySymbol(currency),
    money,
  };
}

export default useBilling;
