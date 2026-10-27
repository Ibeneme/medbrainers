"use client";

import React, { useState } from "react";
import {
  Edit3,
  Trash2,
  Clock,
  FlaskConical,
  Key,
  AlertTriangle,
  X,
  Check,
  Layers,
  Lock,
} from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";

interface LabCatalogItem {
  _id: string;
  company: string;
  laboratory?: string;
  departmentCode?: string;
  code: string;
  name: string;
  category: string;
  specimenType?: string;
  requiresSampleCollection: boolean;
  turnaroundHours?: number;
  price: number;
  units?: string;
  referenceRange?: string;
  defaultKeys: string[];
  isActive: boolean;
  isDeletable?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TestCatalogCardProps {
  item: LabCatalogItem;
  ui: any;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TestCatalogCard({
  item,
  ui,
  onEdit,
  onDelete,
}: TestCatalogCardProps) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteHint, setShowDeleteHint] = useState(false);

  const isDeletable = item.isDeletable !== false; // Default to true if undefined

  return (
    <>
      {/* Test Card Root */}
      <div
        onClick={() => setShowDetailModal(true)}
        className="rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 space-y-3 flex items-start justify-between gap-4 cursor-pointer transition hover:scale-[1.01]"
        style={{ backgroundColor: ui.card }}
      >
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0"
              style={{
                backgroundColor: `${PRIMARY_COLOR}18`,
                color: PRIMARY_COLOR,
              }}
            >
              {item.code}
            </span>
            <span className="text-xs font-semibold opacity-60 truncate">
              {item.category}
            </span>
          </div>
          <h4 className="text-sm font-semibold truncate">{item.name}</h4>
          <div className="flex flex-wrap items-center gap-2.5 text-xs opacity-70">
            {item.specimenType && (
              <span className="truncate">Specimen: {item.specimenType}</span>
            )}
            {item.turnaroundHours && (
              <span className="shrink-0">TAT: {item.turnaroundHours} hrs</span>
            )}
          </div>
        </div>

        <div
          className="text-right shrink-0 flex flex-col items-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <span className="text-sm sm:text-base font-semibold block">
              ₦{item.price?.toLocaleString() || 0}
            </span>
            <span
              className="inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{
                backgroundColor: item.isActive
                  ? "rgba(16,185,129,0.15)"
                  : "rgba(239,68,68,0.15)",
                color: item.isActive ? "#059669" : "#ef4444",
              }}
            >
              {item.isActive ? "Available" : "Disabled"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(item._id)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:opacity-100 transition"
              title="Edit test"
            >
              <Edit3 size={14} />
            </button>

            {/* Conditional Delete Button with Hint */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (isDeletable) {
                    setShowDeleteConfirm(true);
                  } else {
                    setShowDeleteHint(!showDeleteHint);
                  }
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                  isDeletable
                    ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                    : "bg-black/5 dark:bg-white/5 opacity-40 cursor-not-allowed text-zinc-400"
                }`}
                title={
                  isDeletable
                    ? "Delete test"
                    : "Cannot delete: Test is logged to patient consultations or requests"
                }
              >
                {isDeletable ? <Trash2 size={14} /> : <Lock size={12} />}
              </button>

              {/* Hint Popup on click if not deletable */}
              {!isDeletable && showDeleteHint && (
                <div
                  className="absolute right-0 top-10 w-48 rounded-2xl p-3 text-[11px] shadow-xl z-30 border leading-relaxed"
                  style={{
                    backgroundColor: ui.card,
                    borderColor: ui.border,
                    color: ui.text,
                  }}
                >
                  <p className="font-semibold text-rose-500 mb-1 flex items-center gap-1">
                    <Lock size={11} /> Protected Test
                  </p>
                  <p className="opacity-70">
                    This test cannot be deleted because it has been logged to
                    patient consultations or lab requests.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 1. Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg rounded-[28px] p-6 space-y-5 shadow-2xl border"
            style={{
              backgroundColor: ui.card,
              borderColor: ui.border,
              color: ui.text,
            }}
          >
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: ui.border }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
                >
                  <FlaskConical size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold">{item.name}</h3>
                  <span className="text-xs opacity-60 font-medium">
                    Code: {item.code} · Category: {item.category}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="rounded-full p-2 bg-black/5 dark:bg-white/10 hover:opacity-80 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div
                className="rounded-2xl p-3 space-y-1"
                style={{ backgroundColor: ui.inner }}
              >
                <span className="opacity-50 block uppercase text-[10px] font-bold">
                  Price
                </span>
                <span className="text-sm font-semibold">
                  ₦{item.price?.toLocaleString()}
                </span>
              </div>
              <div
                className="rounded-2xl p-3 space-y-1"
                style={{ backgroundColor: ui.inner }}
              >
                <span className="opacity-50 block uppercase text-[10px] font-bold">
                  Turnaround Time
                </span>
                <span className="text-sm font-semibold">
                  {item.turnaroundHours
                    ? `${item.turnaroundHours} Hours`
                    : "N/A"}
                </span>
              </div>
              <div
                className="rounded-2xl p-3 space-y-1"
                style={{ backgroundColor: ui.inner }}
              >
                <span className="opacity-50 block uppercase text-[10px] font-bold">
                  Specimen Type
                </span>
                <span className="text-sm font-semibold">
                  {item.specimenType || "General"}
                </span>
              </div>
              <div
                className="rounded-2xl p-3 space-y-1"
                style={{ backgroundColor: ui.inner }}
              >
                <span className="opacity-50 block uppercase text-[10px] font-bold">
                  Reference Range
                </span>
                <span className="text-sm font-semibold">
                  {item.referenceRange || "N/A"}{" "}
                  {item.units && `(${item.units})`}
                </span>
              </div>
            </div>

            {item.defaultKeys && item.defaultKeys.length > 0 && (
              <div
                className="space-y-2 pt-2 border-t"
                style={{ borderColor: ui.border }}
              >
                <span className="text-xs font-semibold opacity-70 flex items-center gap-1.5">
                  <Key size={13} /> Template Parameter Keys (
                  {item.defaultKeys.length})
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.defaultKeys.map((k, idx) => (
                    <span
                      key={idx}
                      className="rounded-xl px-3 py-1 text-xs font-medium border"
                      style={{
                        backgroundColor: ui.inner,
                        borderColor: ui.border,
                      }}
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Deletion Warning Hint inside Modal if not deletable */}
            {!isDeletable && (
              <div
                className="rounded-2xl p-3 text-xs flex items-center gap-2 border"
                style={{
                  backgroundColor: `${PRIMARY_COLOR}10`,
                  borderColor: PRIMARY_COLOR,
                  color: PRIMARY_COLOR,
                }}
              >
                <Lock size={14} className="shrink-0" />
                <span>
                  This test is currently linked to patient
                  consultations/requests and cannot be deleted. You can disable
                  it instead.
                </span>
              </div>
            )}

            <div
              className="flex items-center justify-end gap-2 pt-4 border-t"
              style={{ borderColor: ui.border }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowDetailModal(false);
                  onEdit(item._id);
                }}
                className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-95"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <Edit3 size={13} /> Edit Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Delete Confirmation Modal */}
      {showDeleteConfirm && isDeletable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-[28px] p-6 space-y-4 shadow-2xl border"
            style={{
              backgroundColor: ui.card,
              borderColor: ui.border,
              color: ui.text,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 shrink-0">
                <AlertTriangle size={22} />
              </span>
              <div>
                <h3 className="text-base font-bold">Delete Test Item</h3>
                <p className="text-xs opacity-60">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">{item.name}</span> from the
                  catalog?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-full px-5 py-2.5 text-xs font-semibold transition hover:opacity-80"
                style={{ backgroundColor: ui.inner }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete(item._id);
                }}
                className="rounded-full px-5 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
