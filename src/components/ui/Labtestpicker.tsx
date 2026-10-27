"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Check, X, FlaskConical } from "lucide-react";
import type { LabCatalogItem } from "@/api";

interface LabTestPickerProps {
  catalog: LabCatalogItem[];
  loading?: boolean;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  ui: Record<string, any>;
  accent: string;
}

export default function LabTestPicker({
  catalog,
  loading = false,
  selectedIds,
  onChange,
  ui,
  accent,
}: LabTestPickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Plain typing works; a leading "@" is still accepted for existing habits.
  const results = useMemo(() => {
    const q = query.replace(/^@/, "").trim().toLowerCase();
    const list = !q
      ? catalog
      : catalog.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            (t.code || "").toLowerCase().includes(q)
        );
    // Starts-with matches first, then the rest, alphabetical inside each group
    return [...list].sort((a, b) => {
      const aStarts = q && a.name.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = q && b.name.toLowerCase().startsWith(q) ? 0 : 1;
      return aStarts - bStarts || a.name.localeCompare(b.name);
    });
  }, [query, catalog]);

  const selectedItems = useMemo(
    () =>
      selectedIds
        .map((id) => catalog.find((t) => t._id === id))
        .filter(Boolean) as LabCatalogItem[],
    [selectedIds, catalog]
  );

  const toggle = (id: string) =>
    onChange(
      selectedSet.has(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => setHighlight(0), [query]);

  // Keep the highlighted row in view while using arrow keys
  useEffect(() => {
    const row = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${highlight}"]`
    );
    row?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && open && results[highlight]) {
      e.preventDefault(); // don't submit the consultation form
      toggle(results[highlight]._id);
    } else if (e.key === "Backspace" && !query && selectedIds.length > 0) {
      onChange(selectedIds.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2.5" ref={wrapRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium opacity-70">
          Recommended lab tests{" "}
          <span className="opacity-60 font-normal">(optional)</span>
        </label>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] font-medium opacity-60 hover:opacity-100 transition"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Search + dropdown */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none"
        />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="lab-test-listbox"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={
            loading ? "Loading tests..." : "Search tests by name or code"
          }
          className="w-full rounded-2xl border pl-9 pr-4 py-3 text-xs outline-none"
          style={{
            backgroundColor: ui.inner,
            borderColor: open ? accent : ui.border,
            color: ui.text,
          }}
        />

        {open && (
          <div
            id="lab-test-listbox"
            role="listbox"
            ref={listRef}
            className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-2xl border p-1.5 shadow-lg"
            style={{ backgroundColor: ui.card, borderColor: ui.border }}
          >
            {loading ? (
              <p className="p-4 text-center text-xs opacity-50">
                Loading lab tests...
              </p>
            ) : results.length === 0 ? (
              <p className="p-4 text-center text-xs opacity-50">
                {catalog.length === 0
                  ? "No lab tests in the catalog yet."
                  : `No tests match "${query.replace(/^@/, "")}".`}
              </p>
            ) : (
              results.map((test, i) => {
                const isSelected = selectedSet.has(test._id);
                const isActive = i === highlight;
                return (
                  <div
                    key={test._id}
                    data-index={i}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlight(i)}
                    onMouseDown={(e) => e.preventDefault()} // keep input focus
                    onClick={() => toggle(test._id)}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-colors"
                    style={{
                      backgroundColor: isActive ? `${accent}12` : "transparent",
                    }}
                  >
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors"
                      style={{
                        backgroundColor: isSelected ? accent : "transparent",
                        borderColor: isSelected ? accent : ui.border,
                        color: "#fff",
                      }}
                    >
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span
                      className={`flex-1 truncate ${
                        isSelected ? "font-semibold" : ""
                      }`}
                    >
                      {test.name}
                    </span>
                    {test.code && (
                      <span
                        className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium opacity-70"
                        style={{ backgroundColor: ui.inner }}
                      >
                        {test.code}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Selected tests */}
      {selectedItems.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-0.5">
          {selectedItems.map((t) => (
            <span
              key={t._id}
              className="inline-flex items-center gap-1.5 rounded-full border py-1 pl-3 pr-1.5 text-xs font-medium"
              style={{
                backgroundColor: `${accent}12`,
                borderColor: `${accent}30`,
                color: accent,
              }}
            >
              {t.name}
              {t.code && (
                <span className="text-[10px] font-normal opacity-60">
                  {t.code}
                </span>
              )}
              <button
                type="button"
                onClick={() => toggle(t._id)}
                aria-label={`Remove ${t.name}`}
                className="flex h-4 w-4 items-center justify-center rounded-full transition hover:bg-black/10 dark:hover:bg-white/20"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="flex items-center gap-1.5 text-[11px] opacity-50">
          <FlaskConical size={12} />
          No tests selected for this patient.
        </p>
      )}
    </div>
  );
}
