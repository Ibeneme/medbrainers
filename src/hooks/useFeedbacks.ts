"use client";

import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { useFacilityId } from "@/hooks/useFacilityId";
import { useToast } from "@/contexts/toast-context";
import {
    fetchFeedbacks,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    clearFeedbackMessage,
    clearCurrentFeedback
} from "@/api/slices/feedbacksSlice";

export function useFeedbacks() {
    const dispatch = useAppDispatch();
    const { facilityId, hasFacility, activeFacility } = useFacilityId();
    const feedbacksState = useAppSelector((s) => s.feedbacks);
    const { showToast } = useToast();

    // Automatically load feedbacks when company/facility changes
    useEffect(() => {
        if (facilityId) {
            console.log("useFeedbacks - auto-fetching feedbacks for facilityId:", facilityId);
            dispatch(fetchFeedbacks({ companyId: facilityId }));
        }
    }, [dispatch, facilityId]);

    /** Generic handler for async actions with automatic toast notifications */
    const act = useCallback(
        async <T = any>(action: any, successMessage?: string | false): Promise<T | null> => {
            try {
                console.log("useFeedbacks - executing action:", action);
                const res = await dispatch(action).unwrap();
                console.log("useFeedbacks - action result:", res);

                if (successMessage !== false) {
                    const msg = successMessage || res?.message;
                    if (msg) showToast(msg, "success");
                }
                return (res?.feedback ?? res?.data ?? res ?? true) as T;
            } catch (e) {
                console.error("useFeedbacks - action error:", e);
                showToast(typeof e === "string" ? e : "Something went wrong", "error");
                return null;
            }
        },
        [dispatch, showToast],
    );

    // Convenience wrapper actions
    const loadFeedbacks = useCallback(
        (params?: { scope?: "mine" | "all"; search?: string; page?: number; limit?: number }) => {
            if (facilityId) {
                console.log("useFeedbacks - loadFeedbacks with params:", params);
                dispatch(fetchFeedbacks({ companyId: facilityId, ...params }));
            }
        },
        [dispatch, facilityId]
    );

    const submitFeedback = useCallback(
        async (dto: { title: string; body: string }) => {
            if (!facilityId) {
                console.warn("useFeedbacks - submitFeedback skipped: missing facilityId");
                return null;
            }
            console.log("useFeedbacks - submitFeedback dto:", dto);
            return act(createFeedback({ companyId: facilityId, ...dto }), "Feedback submitted successfully");
        },
        [act, facilityId]
    );

    const editFeedback = useCallback(
        async (feedbackId: string, dto: { title?: string; body?: string }) => {
            if (!facilityId) {
                console.warn("useFeedbacks - editFeedback skipped: missing facilityId");
                return null;
            }
            console.log("useFeedbacks - editFeedback feedbackId:", feedbackId, "dto:", dto);
            return act(updateFeedback({ companyId: facilityId, feedbackId, ...dto }), "Feedback updated successfully");
        },
        [act, facilityId]
    );

    const removeFeedback = useCallback(
        async (feedbackId: string) => {
            if (!facilityId) {
                console.warn("useFeedbacks - removeFeedback skipped: missing facilityId");
                return null;
            }
            console.log("useFeedbacks - removeFeedback feedbackId:", feedbackId);
            return act(deleteFeedback({ companyId: facilityId, feedbackId }), "Feedback deleted successfully");
        },
        [act, facilityId]
    );

    const clearMessages = useCallback(() => {
        console.log("useFeedbacks - clearMessages");
        dispatch(clearFeedbackMessage());
    }, [dispatch]);

    const resetCurrentFeedback = useCallback(() => {
        console.log("useFeedbacks - resetCurrentFeedback");
        dispatch(clearCurrentFeedback());
    }, [dispatch]);

    return {
        dispatch,
        facilityId,
        hasFacility,
        activeFacility,
        ...feedbacksState,
        loadFeedbacks,
        submitFeedback,
        editFeedback,
        removeFeedback,
        clearMessages,
        resetCurrentFeedback,
        act,
        showToast,
    };
}