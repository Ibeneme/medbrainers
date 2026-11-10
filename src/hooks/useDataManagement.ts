"use client";

import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { useFacilityId } from "@/hooks/useFacilityId";
import { useToast } from "@/contexts/toast-context";
import { fetchCompanyStorage } from "@/api/slices";

/** Trigger a browser download for a Blob. */
export function saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function useDataManagement() {
    const dispatch = useAppDispatch();
    const { facilityId, hasFacility, activeFacility } = useFacilityId();
    const dataManagement = useAppSelector((s) => s.dataManagement);
    const { showToast } = useToast();

    const hasStorage = !!dataManagement.storage;
    useEffect(() => {
        if (facilityId && !hasStorage) {
            dispatch(fetchCompanyStorage({ facilityId }));
        }
    }, [dispatch, facilityId, hasStorage]);

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
            } catch (e: any) {
                // thunks reject with a string, or { message, report } (import)
                const msg = typeof e === "string" ? e : e?.message;
                showToast(msg || "Something went wrong", "error");
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
        dataManagement,
        act,
        showToast,
    };
}
