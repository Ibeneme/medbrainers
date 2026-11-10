"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchFeedbacks,
  deleteFeedback,
  clearFeedbackMessage,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { T, useT } from "@/i18n/provider";
import {
  MessageSquareCode,
  Search,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileText,
  X,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MedbrainersLoader from "@/components/atoms/loaders/Medbrainersloader";
import { FeedbackItem } from "@/api/slices/feedbacksSlice";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function MyFeedbacksPage() {
  const t = useT();
  const dispatch = useAppDispatch();
  const { theme, colors, primaryColor } = useTheme();

  const { activeFacilityId } = useAppSelector((s) => s.facilities);
  const { feedbacks, loading, submitting, error, message, pagination } =
    useAppSelector((s) => s.feedbacks);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const limit = 10;

  // Modal states
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(
    null
  );
  const [feedbackToDelete, setFeedbackToDelete] = useState<FeedbackItem | null>(
    null
  );

  const load = useCallback(() => {
    if (!activeFacilityId) return;
    dispatch(
      fetchFeedbacks({
        companyId: activeFacilityId,
        scope: "mine",
        search: search.trim() || undefined,
        page,
        limit,
      })
    );
  }, [activeFacilityId, dispatch, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        dispatch(clearFeedbackMessage());
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [message, error, dispatch]);

  const confirmDelete = async () => {
    if (!activeFacilityId || !feedbackToDelete) return;
    const id = feedbackToDelete._id;
    setDeletingId(id);
    try {
      await dispatch(
        deleteFeedback({ companyId: activeFacilityId, feedbackId: id })
      ).unwrap();
      if (selectedFeedback?._id === id) {
        setSelectedFeedback(null);
      }
    } finally {
      setDeletingId(null);
      setFeedbackToDelete(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  if (!activeFacilityId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm opacity-70">
          <T>Please select or create a facility first.</T>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <MessageSquareCode
                size={18}
                fill="currentColor"
                strokeWidth={0}
              />
            </span>
            <T>My Feedbacks</T>
          </h1>
          <p className="text-sm opacity-70 mt-1">
            <T>View and manage feedback you have submitted.</T>
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors hover:opacity-90 disabled:opacity-50"
          style={{
            backgroundColor: colors.shadeBgSecond,
            borderColor:
              theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            color: colors.text,
          }}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          <T>Refresh</T>
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative max-w-md">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("Search by title or content...")}
          className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm border outline-none transition-all"
          style={{
            backgroundColor: colors.shadeBgSecond,
            borderColor:
              theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            color: colors.text,
          }}
        />
      </form>

      {/* Toast messages */}
      <AnimatePresence>
        {(message || error) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border"
            style={{
              backgroundColor: error
                ? theme === "dark"
                  ? "rgba(239,68,68,0.15)"
                  : "rgba(239,68,68,0.08)"
                : theme === "dark"
                ? "rgba(34,197,94,0.15)"
                : "rgba(34,197,94,0.08)",
              borderColor: error
                ? "rgba(239,68,68,0.3)"
                : "rgba(34,197,94,0.3)",
              color: colors.text,
            }}
          >
            <AlertCircle size={16} />
            <span>{error || message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {loading && feedbacks.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <MedbrainersLoader showText={false} size={64} />
        </div>
      ) : feedbacks.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed"
          style={{
            borderColor:
              theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
            backgroundColor: colors.shadeBgSecond,
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 opacity-60"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <FileText size={28} style={{ color: primaryColor }} />
          </div>
          <p className="text-sm font-medium opacity-80">
            <T>No feedback submitted yet</T>
          </p>
          <p className="text-xs opacity-50 mt-1">
            <T>Use the sidebar or the button in the header to submit one.</T>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((item) => (
            <motion.div
              key={item._id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedFeedback(item)}
              className="rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer "
              style={{
                backgroundColor: colors.shadeBg,
                borderColor:
                  theme === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.08)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-semibold tracking-tight truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs opacity-50 mt-0.5">
                    {formatDate(item.createdAt)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFeedbackToDelete(item);
                  }}
                  disabled={deletingId === item._id || submitting}
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                  title={t("Delete")}
                >
                  {deletingId === item._id ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <Trash2 size={15} className="text-red-500" />
                  )}
                </button>
              </div>

              <p className="mt-3 text-sm leading-relaxed opacity-80 line-clamp-2">
                {item.body}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs opacity-60">
            <T>Page</T> {pagination.page} <T>of</T> {pagination.totalPages} ·{" "}
            {pagination.totalDocs} <T>total</T>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-9 h-9 rounded-lg border flex items-center justify-center disabled:opacity-40 transition-colors"
              style={{
                backgroundColor: colors.shadeBgSecond,
                borderColor:
                  theme === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="w-9 h-9 rounded-lg border flex items-center justify-center disabled:opacity-40 transition-colors"
              style={{
                backgroundColor: colors.shadeBgSecond,
                borderColor:
                  theme === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      <AnimatePresence>
        {selectedFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg rounded-2xl border overflow-hidden"
              style={{
                backgroundColor: colors.shadeBg,
                borderColor:
                  theme === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
                color: colors.text,
              }}
            >
              <div
                className="flex items-center justify-between px-6 py-4 border-b"
                style={{
                  borderColor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.08)",
                }}
              >
                <h2 className="text-base font-semibold tracking-tight">
                  <T>Feedback Details</T>
                </h2>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <p className="text-xs font-medium opacity-50 uppercase tracking-wider">
                    <T>Title</T>
                  </p>
                  <h3 className="text-lg font-semibold mt-1">
                    {selectedFeedback.title}
                  </h3>
                </div>

                <div>
                  <p className="text-xs font-medium opacity-50 uppercase tracking-wider">
                    <T>Submitted On</T>
                  </p>
                  <p className="text-sm mt-0.5 opacity-90">
                    {formatDate(selectedFeedback.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium opacity-50 uppercase tracking-wider">
                    <T>Content</T>
                  </p>
                  <p
                    style={{ backgroundColor: colors.shadeBgSecond}}
                    className="text-sm mt-1 leading-relaxed opacity-90 whitespace-pre-wrap p-4 rounded-xl border border-black/5 dark:border-white/5"
                  >
                    {selectedFeedback.body}
                  </p>
                </div>
              </div>

              <div
                className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-black/[0.02] dark:bg-white/[0.02]"
                style={{
                  borderColor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.08)",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    const itemToDel = selectedFeedback;
                    setSelectedFeedback(null);
                    setFeedbackToDelete(itemToDel);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium border text-red-500 border-red-500/30 hover:bg-red-500/10 transition-colors"
                >
                  <T>Delete</T>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFeedback(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  <T>Close</T>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for Delete */}
      <AnimatePresence>
        {feedbackToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-2xl border overflow-hidden p-6 text-center space-y-4"
              style={{
                backgroundColor: colors.shadeBg,
                borderColor:
                  theme === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
                color: colors.text,
              }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto bg-red-500/10 text-red-500">
                <AlertTriangle size={24} />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-semibold tracking-tight">
                  <T>Are you sure?</T>
                </h3>
                <p className="text-sm opacity-70">
                  <T>
                    This action cannot be undone. This will permanently delete
                    your feedback.
                  </T>
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={deletingId !== null}
                  onClick={() => setFeedbackToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: colors.shadeBgSecond,
                    borderColor:
                      theme === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                  }}
                >
                  <T>Cancel</T>
                </button>
                <button
                  type="button"
                  disabled={deletingId !== null}
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deletingId !== null ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : null}
                  <T>Delete</T>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
