"use client";

import { X } from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";

type Colors = { text: string; shadeBg: string; shadeBgSecond?: string };

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  isDark?: boolean;
  colors: Colors;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  isDark = false,
  colors,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  const border = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl border p-6 shadow-2xl"
        style={{ backgroundColor: colors.shadeBg, borderColor: border, color: colors.text }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold">{title}</h3>
          <button type="button" onClick={onCancel} className="opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        {description && (
          <p className="mt-3 text-sm opacity-70 leading-relaxed">{description}</p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-xl border px-4 py-2.5 text-xs font-semibold"
            style={{ borderColor: border }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: danger ? "#dc2626" : PRIMARY_COLOR }}
          >
            {busy ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
