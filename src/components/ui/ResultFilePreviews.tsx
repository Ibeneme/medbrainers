"use client";

import React, { useEffect, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
} from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";

/* -------------------------------------------------------------------------- */
/*  Types & normalizer                                                         */
/* -------------------------------------------------------------------------- */

export interface ResultFileItem {
  id: string;
  url: string;
  name: string;
  mimeType: string;
  size?: number;
  uploadedAt?: string;
  isImage: boolean;
  isPdf: boolean;
  testName?: string;
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?.*)?$/i;
const PDF_EXT = /\.pdf(\?.*)?$/i;

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Reads every attachment of a test (resultFiles + legacy resultImages) and
 * returns one clean list. Accepts both `name` / `fileName` and
 * `mimeType` / `mimetype` so it works with any backend shape.
 */
export function normalizeResultFiles(test: any): ResultFileItem[] {
  if (!test) return [];

  const out: ResultFileItem[] = [];
  const seen = new Set<string>();

  const push = (raw: any, idx: number, source: string) => {
    if (!raw) return;

    const url: string | undefined =
      typeof raw === "string"
        ? raw
        : raw.url || raw.fileUrl || raw.secureUrl || raw.location;
    if (!url || seen.has(url)) return;
    seen.add(url);

    const fallbackName = safeDecode(
      url.split("?")[0].split("/").pop() || "Attachment"
    );
    const name: string =
      typeof raw === "string"
        ? fallbackName
        : raw.name ||
          raw.fileName ||
          raw.originalName ||
          raw.originalname ||
          fallbackName;

    const mimeType: string =
      (typeof raw === "object" &&
        (raw.mimeType || raw.mimetype || raw.contentType)) ||
      "";

    const isImage =
      mimeType.startsWith("image/") ||
      IMAGE_EXT.test(url) ||
      IMAGE_EXT.test(name);
    const isPdf =
      mimeType === "application/pdf" || PDF_EXT.test(url) || PDF_EXT.test(name);

    out.push({
      id: (typeof raw === "object" && raw._id) || `${source}-${idx}`,
      url,
      name,
      mimeType,
      size: typeof raw === "object" ? raw.size : undefined,
      uploadedAt: typeof raw === "object" ? raw.uploadedAt : undefined,
      isImage,
      isPdf,
      testName: test.name,
    });
  };

  (Array.isArray(test.resultFiles) ? test.resultFiles : []).forEach(
    (f: any, i: number) => push(f, i, "file")
  );
  (Array.isArray(test.resultImages) ? test.resultImages : []).forEach(
    (f: any, i: number) => push(f, i, "image")
  );

  return out;
}

/* -------------------------------------------------------------------------- */
/*  Lightbox (full-screen viewer for images and PDFs)                          */
/* -------------------------------------------------------------------------- */

export function ResultFileLightbox({
  files,
  index,
  onClose,
  onIndexChange,
  ui,
}: {
  files: ResultFileItem[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
  ui: any;
}) {
  const open = index !== null && files.length > 0 && index < files.length;
  const current = open ? files[index as number] : null;

  const goPrev = useCallback(() => {
    if (index === null) return;
    onIndexChange((index - 1 + files.length) % files.length);
  }, [index, files.length, onIndexChange]);

  const goNext = useCallback(() => {
    if (index === null) return;
    onIndexChange((index + 1) % files.length);
  }, [index, files.length, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, goPrev, goNext]);

  if (!open || !current) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border"
        style={{
          backgroundColor: ui.card,
          borderColor: ui.border,
          color: ui.text,
        }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3"
          style={{ borderColor: ui.border }}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{current.name}</p>
            <p className="truncate text-[11px] opacity-50">
              {current.testName ? `${current.testName} · ` : ""}
              {index! + 1} of {files.length}
              {current.size ? ` · ${(current.size / 1024).toFixed(1)} KB` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={current.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl p-2 transition hover:opacity-70"
              style={{ backgroundColor: ui.inner }}
              title="Open in new tab"
            >
              <ExternalLink size={15} />
            </a>
            <a
              href={current.url}
              download={current.name}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl p-2 transition hover:opacity-70"
              style={{ backgroundColor: ui.inner }}
              title="Download"
            >
              <Download size={15} />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 transition hover:opacity-70"
              style={{ backgroundColor: ui.inner }}
              title="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          className="relative flex min-h-0 flex-1 items-center justify-center p-3"
          style={{ backgroundColor: ui.inner }}
        >
          {current.isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.url}
              alt={current.name}
              className="max-h-full max-w-full rounded-xl object-contain"
            />
          ) : current.isPdf ? (
            <iframe
              src={current.url}
              title={current.name}
              className="h-full w-full rounded-xl bg-white"
            />
          ) : (
            <div className="space-y-3 text-center">
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `${PRIMARY_COLOR}15`,
                  color: PRIMARY_COLOR,
                }}
              >
                <FileText size={28} />
              </div>
              <p className="text-xs opacity-60">
                Preview is not available for this file type.
              </p>
              <a
                href={current.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <ExternalLink size={13} /> Open file
              </a>
            </div>
          )}

          {files.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-white transition hover:opacity-90"
                style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                title="Previous"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-white transition hover:opacity-90"
                style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                title="Next"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Gallery (large cards, used on the request detail page)                     */
/* -------------------------------------------------------------------------- */

export function ResultFileGallery({
  files,
  onOpen,
  ui,
  border,
  hairline,
}: {
  files: ResultFileItem[];
  onOpen: (index: number) => void;
  ui: any;
  border: string;
  hairline: string;
}) {
  if (files.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed px-4 py-5 text-center text-[11px] opacity-50"
        style={{ borderColor: border }}
      >
        No result files uploaded yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2 lg:grid-cols-3">
      {files.map((file, idx) => (
        <div
          key={file.id}
          className="overflow-hidden rounded-2xl border"
          style={{ backgroundColor: ui.card, borderColor: border }}
        >
          <button
            type="button"
            onClick={() => onOpen(idx)}
            className="group relative block h-40 w-full overflow-hidden"
            style={{ backgroundColor: ui.inner }}
            title="Click to preview"
          >
            {file.isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={file.url}
                alt={file.name}
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: `${PRIMARY_COLOR}15`,
                    color: PRIMARY_COLOR,
                  }}
                >
                  <FileText size={22} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                  {file.isPdf ? "PDF document" : "File"}
                </span>
              </div>
            )}
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
              Preview
            </span>
          </button>

          <div
            className="flex items-center justify-between gap-2 border-t px-3 py-2.5"
            style={{ borderColor: hairline }}
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{file.name}</p>
              <p className="text-[10px] opacity-50">
                {file.size ? `${(file.size / 1024).toFixed(1)} KB` : "—"}
                {file.uploadedAt
                  ? ` · ${new Date(file.uploadedAt).toLocaleDateString()}`
                  : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-1.5 transition hover:opacity-70"
                style={{ backgroundColor: ui.inner }}
                title="Open in new tab"
              >
                <ExternalLink size={13} />
              </a>
              <a
                href={file.url}
                download={file.name}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-1.5 transition hover:opacity-70"
                style={{ backgroundColor: ui.inner }}
                title="Download"
              >
                <Download size={13} />
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Thumb strip (compact, used on the requests list and kanban cards)          */
/* -------------------------------------------------------------------------- */

export function ResultFileThumbStrip({
  files,
  onOpen,
  ui,
  max = 4,
  size = 36,
}: {
  files: ResultFileItem[];
  onOpen: (index: number) => void;
  ui: any;
  max?: number;
  size?: number;
}) {
  if (files.length === 0) return null;

  const visible = files.slice(0, max);
  const extra = files.length - visible.length;

  return (
    <div className="flex items-center gap-1.5">
      {visible.map((file, idx) => (
        <button
          key={file.id}
          type="button"
          draggable={false}
          onClick={(e) => {
            e.stopPropagation();
            onOpen(idx);
          }}
          className="shrink-0 overflow-hidden rounded-lg border transition hover:opacity-80"
          style={{
            width: size,
            height: size,
            backgroundColor: ui.inner,
            borderColor: ui.border,
          }}
          title={file.name}
        >
          {file.isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={file.url}
              alt={file.name}
              draggable={false}
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center"
              style={{ color: PRIMARY_COLOR }}
            >
              <FileText size={Math.round(size * 0.45)} />
            </span>
          )}
        </button>
      ))}
      {extra > 0 && (
        <button
          type="button"
          draggable={false}
          onClick={(e) => {
            e.stopPropagation();
            onOpen(max);
          }}
          className="flex shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold transition hover:opacity-80"
          style={{
            width: size,
            height: size,
            backgroundColor: ui.inner,
            borderColor: ui.border,
            color: PRIMARY_COLOR,
          }}
          title={`${extra} more`}
        >
          +{extra}
        </button>
      )}
    </div>
  );
}
