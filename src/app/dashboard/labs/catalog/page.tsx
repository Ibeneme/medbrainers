"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Search,
  ChevronRight,
  Plus,
  RefreshCw,
  FlaskConical,
  Info,
} from "lucide-react";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchLabCatalog } from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import TestCatalogCard from "@/components/dashboard/labs/TestCatalogCard";

export default function LabCatalogPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors, colors?.border);

  const { activeFacilityId, activeFacility } = useAppSelector(
    (s) => s.facilities
  );

  const rawFacilityParam = params?.facilityId;
  const facilityId =
    (Array.isArray(rawFacilityParam)
      ? rawFacilityParam[0]
      : rawFacilityParam) ||
    activeFacilityId ||
    activeFacility?._id ||
    "";

  const { catalog, listLoading } = useAppSelector((s) => s.labs);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchLabCatalog({ facilityId, includeInactive: true }));
  }, [dispatch, facilityId]);

  const companyDisplayName =
    activeFacility?.name || "Medicules Technologies Limited";

  const categories = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [catalog]);

  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !selectedCategory || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [catalog, searchQuery, selectedCategory]);

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6 max-w-7xl mx-auto">
      {listLoading && catalog.length === 0 && (
        <DarkBlurOverlayLoader text="Loading pathology catalog..." />
      )}

      {msg && (
        <div
          className="fixed right-4 top-4 rounded-2xl px-4 py-3 text-xs font-semibold animate-in fade-in z-50 shadow-lg"
          style={{ backgroundColor: ui.card, color: "#059669" }}
        >
          {msg}
        </div>
      )}

      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 truncate">
          <Link
            href="/dashboard/labs"
            className="opacity-60 hover:opacity-100 transition"
          >
            Laboratory
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <span className="font-semibold">Pathology Catalog</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/dashboard/labs")}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition hover:opacity-90 border"
            style={{
              backgroundColor: ui.card,
              borderColor: ui.border,
              color: ui.text,
            }}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              if (facilityId) {
                dispatch(
                  fetchLabCatalog({ facilityId, includeInactive: true })
                );
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition hover:opacity-90 border"
            style={{
              backgroundColor: ui.card,
              borderColor: ui.border,
              color: ui.text,
            }}
            title="Reload the newest data"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div
        className="rounded-[28px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border"
        style={{ backgroundColor: ui.card, borderColor: ui.border }}
      >
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
            style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
          >
            <FlaskConical size={22} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Pathology catalog
            </h1>
            <p className="text-xs opacity-60 mt-0.5">
              {companyDisplayName} · {catalog.length} records
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/dashboard/labs/catalog/new`)}
          className="inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-95"
          style={{ backgroundColor: PRIMARY_COLOR }}
        >
          <Plus size={14} /> Add New Test
        </button>
      </div>

      {/* Guide & Tips Box with Faint Red Theme */}
      <div
        className="rounded-[24px] p-4 border text-xs space-y-3 transition-all"
        style={{
          backgroundColor: isDark ? "rgba(127, 29, 29, 0.2)" : "#fef2f2",
          borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "#fecaca",
          color: isDark ? "#fca5a5" : "#991b1b",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Info size={15} style={{ color: isDark ? "#f87171" : "#dc2626" }} />
            <span>Catalog Management Guide & Tips</span>
          </div>
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-[11px] font-medium opacity-80 hover:opacity-100 transition underline"
          >
            {showGuide ? "Hide Guide" : "Show Guide"}
          </button>
        </div>

        <p className="opacity-90 leading-relaxed">
          Search by test name, test code, or category—all at once. Manage
          prices, status, or remove obsolete tests safely.
        </p>

        {showGuide && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t text-[11px]"
            style={{
              borderColor: isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
            }}
          >
            <div className="space-y-1.5">
              <p className="font-semibold opacity-100">Searching & Filtering</p>
              <ul className="list-disc list-inside opacity-90 space-y-1">
                <li>Search instantly by test name, code, or category.</li>
                <li>Pick a category chip below to narrow the list quickly.</li>
                <li>
                  Click <strong>All tests</strong> to clear category filters.
                </li>
              </ul>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold opacity-100">
                Card Actions & Management
              </p>
              <ul className="list-disc list-inside opacity-90 space-y-1">
                <li>
                  <strong>Edit:</strong> Change a test&apos;s details, price, or
                  status.
                </li>
                <li>
                  <strong>Delete:</strong> Remove tests no longer offered from
                  the catalog.
                </li>
                <li>
                  <strong>Inactive Status:</strong> Set old tests to inactive
                  instead of deleting so past patient results keep working.
                </li>
                <li>
                  <strong>Refresh:</strong> Reloads the newest data and syncs
                  changes.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <div
          className="rounded-[22px] px-4 py-3 flex items-center gap-3 border"
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <Search size={16} className="opacity-40 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by test name, code, or category..."
            className="w-full bg-transparent text-xs outline-none"
            style={{ color: ui.text }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="opacity-40 hover:opacity-100 text-xs shrink-0"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] opacity-60 font-medium mr-1">
              Categories:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="rounded-full px-3 py-1 text-[11px] font-medium transition border"
              style={{
                backgroundColor:
                  selectedCategory === null ? PRIMARY_COLOR : ui.card,
                borderColor:
                  selectedCategory === null ? PRIMARY_COLOR : ui.border,
                color: selectedCategory === null ? "#fff" : ui.text,
              }}
            >
              All tests
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className="rounded-full px-3 py-1 text-[11px] font-medium transition border"
                style={{
                  backgroundColor:
                    selectedCategory === cat ? PRIMARY_COLOR : ui.card,
                  borderColor:
                    selectedCategory === cat ? PRIMARY_COLOR : ui.border,
                  color: selectedCategory === cat ? "#fff" : ui.text,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Catalog Grid */}
      {filteredCatalog.length === 0 ? (
        <div
          className="rounded-[28px] p-12 text-center border space-y-3"
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <p className="text-xs opacity-60">
            {searchQuery || selectedCategory
              ? "No test items match your search or filter criteria."
              : "No lab tests found in the pathology catalog for this facility."}
          </p>
          {!searchQuery && !selectedCategory && (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/labs/catalog/new`)}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition hover:opacity-95"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Plus size={13} /> Add your first test
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCatalog.map((item) => (
            <TestCatalogCard
              key={item._id}
              item={item}
              ui={ui}
              onEdit={(id) => router.push(`/dashboard/labs/catalog/${id}/edit`)}
              onDelete={() => setMsg("Catalog item deleted successfully")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
