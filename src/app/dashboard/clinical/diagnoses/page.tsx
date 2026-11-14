"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "@/components/access/guarded-link";
import {
  ChevronRight,
  BookOpen,
  Search,
  X,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Play,
  Square,
  Database,
  Layers,
  AlertCircle,
  Info,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchIcdChapters,
  searchIcd,
  fetchIcdByCode,
  fetchIcdChildren,
  fetchIcdCrawlStatus,
  startIcdCrawl,
  stopIcdCrawl,
  clearIcdSearch,
  clearIcdChildren,
  clearIcdError,
  type IcdEntity,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";

import { Can } from "@/components/access/can";
/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
// ICD-11 MMS codes look like 1F40, 1F40.0, BA00, DA01.0, or chapter "01".
const CODE_LIKE = /^[0-9A-Z]{2,4}(\.[0-9A-Z]{1,2})?$/i;
const looksLikeCode = (q: string) => CODE_LIKE.test(q) && /\d/.test(q);

const kindLabel = (k?: string) =>
  k === "chapter" ? "Chapter" : k === "block" ? "Block" : k === "category" ? "Category" : k || "Entity";

const displayTitle = (e: IcdEntity) =>
  e.title || (e.status === "pending" ? "Not synced yet" : e.entityId);

/* -------------------------------------------------------------------------- */
/*  Row                                                                       */
/* -------------------------------------------------------------------------- */
function IcdRow({
  item,
  onClick,
  ui,
}: {
  item: IcdEntity;
  onClick: () => void;
  ui: any;
}) {
  const hasChildren = (item.childUrls?.length ?? 0) > 0 || item.status === "pending";
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-xs transition hover:opacity-80"
      style={{ backgroundColor: ui.inner, borderColor: ui.border, color: ui.text }}
    >
      <span
        className="shrink-0 rounded-lg px-2 py-1 font-mono text-[10px] font-bold"
        style={{
          backgroundColor: item.code ? PRIMARY_COLOR : "transparent",
          color: item.code ? "#fff" : ui.text,
          border: item.code ? "none" : `1px dashed ${ui.border}`,
          minWidth: 44,
          textAlign: "center",
        }}
      >
        {item.code || "—"}
      </span>
      <span
        className={`flex-1 leading-snug ${item.title ? "" : "italic opacity-50"}`}
      >
        {displayTitle(item)}
      </span>
      {hasChildren && <ChevronRight size={14} className="shrink-0 opacity-40" />}
    </button>
  );
}

function Chips({
  label,
  items,
  tone,
  limit = 40,
}: {
  label: string;
  items: string[];
  tone: "neutral" | "danger";
  limit?: number;
}) {
  if (!items?.length) return null;
  const shown = items.slice(0, limit);
  const cls =
    tone === "danger"
      ? "bg-red-500/10 text-red-500"
      : "bg-black/5 dark:bg-white/10";
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-60">
        {label} ({items.length})
      </p>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((t, i) => (
          <span key={`${t}-${i}`} className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${cls}`}>
            {t}
          </span>
        ))}
        {items.length > limit && (
          <span className="px-1 py-1 text-[10px] opacity-50">+{items.length - limit} more</span>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */
export default function IcdBrowserPage() {
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const {
    chapters,
    chaptersLoading,
    searchResults,
    searchLoading,
    children,
    childrenFor,
    childrenLoading,
    crawlStatus,
    crawlActionLoading,
    error,
    message,
  } = useAppSelector((s) => s.icd);

  const [query, setQuery] = useState("");
  const [trail, setTrail] = useState<IcdEntity[]>([]);
  const [copied, setCopied] = useState(false);
  const [showSync, setShowSync] = useState(false);

  const selected = trail.length ? trail[trail.length - 1] : null;
  const showSearch = query.trim().length >= 2;

  // Initial load
  useEffect(() => {
    dispatch(fetchIcdChapters());
    dispatch(fetchIcdCrawlStatus());
  }, [dispatch]);

  // Poll sync status while a crawl is running
  const running = !!crawlStatus?.running;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => dispatch(fetchIcdCrawlStatus()), 5000);
    return () => clearInterval(t);
  }, [running, dispatch]);

  // If chapters weren't there yet but the sync has produced data, load them
  const doneCount = crawlStatus?.counts?.done ?? 0;
  useEffect(() => {
    if (chapters.length === 0 && doneCount > 0) dispatch(fetchIcdChapters());
  }, [doneCount, chapters.length, dispatch]);

  // Debounced search (code lookup first, then full-text fallback)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      dispatch(clearIcdSearch());
      return;
    }
    const t = setTimeout(async () => {
      if (looksLikeCode(q)) {
        const res = await dispatch(fetchIcdByCode(q.toUpperCase()));
        if (fetchIcdByCode.fulfilled.match(res)) return;
      }
      dispatch(searchIcd({ q }));
    }, 350);
    return () => clearTimeout(t);
  }, [query, dispatch]);

  /* ----------------------------- navigation ------------------------------ */
  const openChild = (e: IcdEntity) => {
    setTrail((prev) => [...prev, e]);
    dispatch(fetchIcdChildren(e.entityId));
  };

  const openFromSearch = (e: IcdEntity) => {
    setQuery("");
    dispatch(clearIcdSearch());
    setTrail([e]);
    dispatch(fetchIcdChildren(e.entityId));
  };

  const jumpTo = (index: number) => {
    if (index < 0) {
      setTrail([]);
      dispatch(clearIcdChildren());
      return;
    }
    const next = trail.slice(0, index + 1);
    setTrail(next);
    dispatch(fetchIcdChildren(next[index].entityId));
  };

  /* ------------------------------ list data ------------------------------ */
  const listItems: IcdEntity[] = useMemo(() => {
    if (!selected) return chapters;
    if (childrenFor !== selected.entityId) return [];
    const order = new Map(selected.childUrls.map((u, i) => [u, i]));
    return [...children].sort(
      (a, b) => (order.get(a._id) ?? 0) - (order.get(b._id) ?? 0)
    );
  }, [selected, chapters, children, childrenFor]);

  const listLoading = selected ? childrenLoading : chaptersLoading;

  /* ------------------------------- actions ------------------------------- */
  const copyCode = async () => {
    if (!selected) return;
    const text = selected.code
      ? `${selected.code} – ${selected.title ?? ""}`.trim()
      : selected.title ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const onStart = async () => {
    await dispatch(startIcdCrawl({ retryFailed: true }));
    dispatch(fetchIcdCrawlStatus());
  };
  const onStop = async () => {
    await dispatch(stopIcdCrawl());
    dispatch(fetchIcdCrawlStatus());
  };

  const done = crawlStatus?.counts?.done ?? 0;
  const pending = crawlStatus?.counts?.pending ?? 0;
  const failed = crawlStatus?.counts?.failed ?? 0;
  const total = done + pending + failed;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const noData = !chaptersLoading && chapters.length === 0;

  return (
    <div className="mx-auto max-w-6xl w-full">
      <div
        className="space-y-6"
        style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
      >
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs opacity-70">
          <Link href="/dashboard" className="hover:opacity-100">
            Dashboard
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <span className="font-semibold">ICD-11 Browser</span>
        </div>

        {/* Header + search */}
        <div
          className="rounded-[22px] sm:rounded-[28px] p-4 sm:p-6 space-y-4 border"
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
                style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
              >
                <BookOpen size={24} />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  ICD-11 Diagnosis Browser
                </h1>
                <p className="text-xs opacity-60 mt-0.5">
                  WHO ICD-11 for Mortality and Morbidity Statistics (MMS). Search by
                  disease name or code, or browse by chapter.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSync((v) => !v)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-semibold border transition hover:opacity-80"
              style={{ backgroundColor: ui.inner, borderColor: ui.border }}
            >
              <Database size={12} />
              {running ? `Syncing… ${pct}%` : "Data sync"}
            </button>
          </div>

          <div className="relative">
            <Search
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search e.g. malaria, type 2 diabetes, or a code like 1F40.0"
              className="w-full rounded-2xl border pl-10 pr-10 py-3 text-xs outline-none"
              style={{
                backgroundColor: ui.inner,
                borderColor: ui.border,
                color: ui.text,
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full opacity-60 hover:opacity-100"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Banners */}
        {error && (
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-500">
            <span className="inline-flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </span>
            <button type="button" onClick={() => dispatch(clearIcdError())} aria-label="Dismiss">
              <X size={13} />
            </button>
          </div>
        )}
        {message && !error && (
          <div
            className="flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-xs"
            style={{ backgroundColor: ui.inner, borderColor: ui.border }}
          >
            <span className="inline-flex items-center gap-2">
              <Info size={14} style={{ color: PRIMARY_COLOR }} /> {message}
            </span>
            <button type="button" onClick={() => dispatch(clearIcdError())} aria-label="Dismiss">
              <X size={13} />
            </button>
          </div>
        )}

        {/* Sync panel */}
        {showSync && (
          <div
            className="rounded-2xl p-4 sm:p-5 border space-y-3"
            style={{ backgroundColor: ui.card, borderColor: ui.border }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Database size={14} style={{ color: PRIMARY_COLOR }} /> ICD data sync
                {crawlStatus?.release ? (
                  <span className="opacity-50 font-normal">· release {crawlStatus.release}</span>
                ) : null}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => dispatch(fetchIcdCrawlStatus())}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold border transition hover:opacity-80"
                  style={{ backgroundColor: ui.inner, borderColor: ui.border }}
                >
                  <RefreshCw size={12} /> Refresh
                </button>
                {running ? (
                  <Can perm="consultations.write"><button
                    type="button"
                    onClick={onStop}
                    disabled={crawlActionLoading}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-red-500 border border-red-500/20 bg-red-500/10 transition hover:opacity-80 disabled:opacity-40"
                  >
                    <Square size={12} /> Stop
                  </button></Can>
                ) : (
                  <button
                    type="button"
                    onClick={onStart}
                    disabled={crawlActionLoading}
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-bold text-white transition hover:opacity-90 disabled:opacity-40"
                    style={{ backgroundColor: PRIMARY_COLOR }}
                  >
                    <Play size={12} /> {pending > 0 || failed > 0 ? "Resume sync" : "Start sync"}
                  </button>
                )}
              </div>
            </div>

            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: ui.inner }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: PRIMARY_COLOR }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              {[
                { label: "Synced", value: done, color: "#10b981" },
                { label: "Pending", value: pending, color: "#f59e0b" },
                { label: "Failed", value: failed, color: "#ef4444" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border px-3 py-2.5"
                  style={{ backgroundColor: ui.inner, borderColor: ui.border }}
                >
                  <p className="text-lg font-bold" style={{ color: s.color }}>
                    {s.value.toLocaleString()}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider opacity-60">{s.label}</p>
                </div>
              ))}
            </div>

            {crawlStatus?.lastError && (
              <p className="text-[11px] text-red-500 leading-normal break-words">
                Last error: {crawlStatus.lastError}
              </p>
            )}
            <p className="text-[11px] opacity-50">
              Pending items are discovered but not downloaded yet. The sync can be stopped and resumed
              safely.
            </p>
          </div>
        )}

        {/* Two-pane browser */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 !mt-4">
          {/* Left: results / tree */}
          <div
            className="lg:col-span-2 rounded-[22px] border p-4 space-y-3"
            style={{ backgroundColor: ui.card, borderColor: ui.border }}
          >
            {showSearch ? (
              <>
                <p className="text-xs font-semibold opacity-70 uppercase tracking-wider">
                  Search results ({searchResults.length})
                </p>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {searchLoading ? (
                    <p className="text-xs opacity-50 py-4 text-center">Searching…</p>
                  ) : searchResults.length === 0 ? (
                    <p className="text-xs opacity-50 py-4 text-center">
                      No matches. Try a whole word (e.g. "malaria"), or a code.
                    </p>
                  ) : (
                    searchResults.map((r) => (
                      <IcdRow key={r._id} item={r} onClick={() => openFromSearch(r)} ui={ui} />
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Trail */}
                <div className="flex flex-wrap items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => jumpTo(-1)}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold transition hover:opacity-80"
                    style={{
                      backgroundColor: trail.length === 0 ? PRIMARY_COLOR : ui.inner,
                      color: trail.length === 0 ? "#fff" : ui.text,
                    }}
                  >
                    <Layers size={11} /> Chapters
                  </button>
                  {trail.map((t, i) => (
                    <span key={t._id} className="inline-flex items-center gap-1">
                      <ChevronRight size={11} className="opacity-40" />
                      <button
                        type="button"
                        onClick={() => jumpTo(i)}
                        className="max-w-[140px] truncate rounded-full px-2.5 py-1 font-semibold transition hover:opacity-80"
                        style={{
                          backgroundColor: i === trail.length - 1 ? PRIMARY_COLOR : ui.inner,
                          color: i === trail.length - 1 ? "#fff" : ui.text,
                        }}
                        title={t.title}
                      >
                        {t.code || t.title || t.entityId}
                      </button>
                    </span>
                  ))}
                </div>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {listLoading ? (
                    <p className="text-xs opacity-50 py-4 text-center">Loading…</p>
                  ) : listItems.length === 0 ? (
                    <p className="text-xs opacity-50 py-4 text-center">
                      {selected
                        ? "No sub-categories (this is the most specific level), or they haven't synced yet."
                        : noData
                          ? "No ICD data yet. Open “Data sync” and start the sync."
                          : "Nothing to show."}
                    </p>
                  ) : (
                    listItems.map((c) => (
                      <IcdRow key={c._id} item={c} onClick={() => openChild(c)} ui={ui} />
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right: details */}
          <div
            className="lg:col-span-3 rounded-[22px] border p-4 sm:p-6 space-y-4"
            style={{ backgroundColor: ui.card, borderColor: ui.border }}
          >
            {!selected ? (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 text-center opacity-60">
                <BookOpen size={28} />
                <p className="text-xs">
                  Pick a chapter or search result to see its definition, inclusions and
                  exclusions.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {selected.code && (
                        <span
                          className="rounded-lg px-2.5 py-1 font-mono text-xs font-bold text-white"
                          style={{ backgroundColor: PRIMARY_COLOR }}
                        >
                          {selected.code}
                        </span>
                      )}
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: ui.inner }}
                      >
                        {kindLabel(selected.classKind)}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold leading-snug">
                      {displayTitle(selected)}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copyCode}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold border transition hover:opacity-80"
                      style={{ backgroundColor: ui.inner, borderColor: ui.border }}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? "Copied" : "Copy code & title"}
                    </button>
                    {selected.browserUrl && (
                      <a
                        href={selected.browserUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold border transition hover:opacity-80"
                        style={{ backgroundColor: ui.inner, borderColor: ui.border }}
                      >
                        <ExternalLink size={12} /> WHO
                      </a>
                    )}
                  </div>
                </div>

                {selected.status === "pending" && (
                  <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-[11px] text-amber-600">
                    This entry has been discovered but its details haven't been downloaded yet.
                  </p>
                )}

                {selected.definition && (
                  <div
                    className="rounded-2xl border p-4 text-xs leading-relaxed"
                    style={{ backgroundColor: ui.inner, borderColor: ui.border }}
                  >
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider opacity-60">
                      Definition
                    </p>
                    {selected.definition}
                  </div>
                )}

                {selected.codingNote && (
                  <div
                    className="rounded-2xl border p-4 text-xs leading-relaxed"
                    style={{ backgroundColor: ui.inner, borderColor: ui.border }}
                  >
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider opacity-60">
                      Coding note
                    </p>
                    {selected.codingNote}
                  </div>
                )}

                <Chips label="Inclusions" items={selected.inclusions} tone="neutral" />
                <Chips label="Exclusions" items={selected.exclusions} tone="danger" />
                <Chips label="Also known as" items={selected.indexTerms} tone="neutral" />

                {!selected.definition &&
                  !selected.codingNote &&
                  !selected.inclusions?.length &&
                  !selected.exclusions?.length &&
                  !selected.indexTerms?.length &&
                  selected.status === "done" && (
                    <p className="text-xs opacity-50">
                      No extra details are recorded for this entry.
                    </p>
                  )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}