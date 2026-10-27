"use client";

import { useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {  fetchLabCatalog, type LabCatalogItem } from "@/api";

interface UseLabCatalogOptions {
    facilityId?: string | null;
    includeInactive?: boolean;
    search?: string;
    autoFetch?: boolean;
}

export function useLabCatalog({
    facilityId,
    includeInactive,
    search,
    autoFetch = true,
}: UseLabCatalogOptions = {}) {
    const dispatch = useAppDispatch();
    const { catalog, listLoading, error, message } = useAppSelector(
        (state) => state.labs
    );

    const loadCatalog = useCallback(() => {
        if (!facilityId) return;
        dispatch(fetchLabCatalog({ facilityId, includeInactive, search }));
    }, [dispatch, facilityId, includeInactive, search]);

    useEffect(() => {
        if (autoFetch && facilityId) {
            loadCatalog();
        }
    }, [autoFetch, facilityId, loadCatalog]);

    return {
        catalog,
        loading: listLoading,
        error,
        message,
        refetch: loadCatalog,
    };
}