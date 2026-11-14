"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/access/guarded-link";
import { ArrowLeft, BedDouble, Minus, Plus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { Modal } from "@/components/ui/items";
import { createWard } from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { useToast } from "@/contexts/toast-context";
import { getUI, PRIMARY_COLOR } from "@/constants/colors";

const WARD_TYPES = [
  "general",
  "private",
  "surgical",
  "maternity",
  "pediatric",
  "icu",
  "nicu",
  "isolation",
  "other",
] as const;

const typeLabel = (t?: string) =>
  t === "icu" || t === "nicu" ? t.toUpperCase() : t || "general";

const fieldCls =
  "w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none bg-transparent transition-colors focus:border-[color:var(--brand-primary)]";

function generateBeds(prefix: string, from: number, count: number) {
  return Array.from(
    { length: Math.max(0, Math.min(count, 100)) },
    (_, i) => `${prefix}${from + i}`
  );
}

function SectionTitle({ step, title }: { step: number; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
        style={{ backgroundColor: PRIMARY_COLOR }}
      >
        {step}
      </span>
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium opacity-60">
      {children}
    </label>
  );
}

export default function CreateWardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors);

  const { activeFacilityId } = useAppSelector((s) => s.facilities);
  const { saving } = useAppSelector((s) => s.wards);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<string>("general");
  const [floor, setFloor] = useState("");
  const [prefix, setPrefix] = useState("A");
  const [count, setCount] = useState(6);
  const [showPreview, setShowPreview] = useState(false);

  const beds = generateBeds(prefix.trim(), 1, count);

  const setBedCount = (n: number) =>
    setCount(Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0)));

  // Form submit only opens the preview; the real save happens from the modal.
  const onReview = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPreview(true);
  };

  const onConfirmSave = async () => {
    if (!activeFacilityId) return;
    try {
      await dispatch(
        createWard({
          facilityId: activeFacilityId,
          payload: {
            name: name.trim(),
            code: code.trim(),
            type,
            floor: floor.trim() || undefined,
            beds: beds.map((c) => ({ code: c })),
          },
        })
      ).unwrap();
      showToast("Ward created successfully");
      router.push("/dashboard/wards");
    } catch (err) {
      showToast(
        typeof err === "string" ? err : "Could not create ward",
        "error"
      );
    }
  };

  const card = "rounded-2xl border p-4 sm:p-6";

  return (
    <div
      className="mx-auto max-w-2xl space-y-6 px-3 py-6 sm:px-6"
      style={{ color: ui.text }}
    >
      {/* ─── Header ─────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/wards"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          style={{ borderColor: ui.border }}
          aria-label="Back to wards"
        >
          <ArrowLeft size={15} />
        </Link>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `${PRIMARY_COLOR}1F`,
            color: PRIMARY_COLOR,
          }}
        >
          <BedDouble size={18} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">
            Create new ward
          </h1>
          <p className="text-xs opacity-60">
            Set up the ward and its initial beds
          </p>
        </div>
      </div>

      <div>
        {/* ─── Form ─────────────────────────────────── */}
        <form onSubmit={onReview} className="min-w-0 space-y-5">
          {/* 1. Details */}
          <section
            className={card}
            style={{ borderColor: ui.border, backgroundColor: ui.card }}
          >
            <SectionTitle step={1} title="Ward details" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Ward name *</Label>
                <input
                  required
                  placeholder="e.g. General Ward A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldCls}
                  style={{ borderColor: ui.border, color: ui.text }}
                />
              </div>
              <div>
                <Label>Code *</Label>
                <input
                  required
                  placeholder="e.g. WARD-A"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={fieldCls}
                  style={{ borderColor: ui.border, color: ui.text }}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Floor</Label>
                <input
                  placeholder="e.g. 2"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className={fieldCls}
                  style={{ borderColor: ui.border, color: ui.text }}
                />
              </div>
            </div>
          </section>

          {/* 2. Type */}
          <section
            className={card}
            style={{ borderColor: ui.border, backgroundColor: ui.card }}
          >
            <SectionTitle step={2} title="Ward type" />
            <div className="flex flex-wrap gap-2">
              {WARD_TYPES.map((t) => {
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    aria-pressed={active}
                    className="rounded-full border px-3.5 py-1.5 text-[11px] font-semibold capitalize outline-none transition-colors"
                    style={{
                      borderColor: active ? PRIMARY_COLOR : ui.border,
                      backgroundColor: active ? PRIMARY_COLOR : "transparent",
                      color: active ? "#FFFFFF" : ui.text,
                    }}
                  >
                    {typeLabel(t)}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. Beds */}
          <section
            className={card}
            style={{ borderColor: ui.border, backgroundColor: ui.card }}
          >
            <SectionTitle step={3} title="Initial beds" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Bed prefix</Label>
                <input
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className={fieldCls}
                  style={{ borderColor: ui.border, color: ui.text }}
                />
              </div>
              <div>
                <Label>Number of beds</Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBedCount(count - 1)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                    style={{ borderColor: ui.border }}
                    aria-label="Fewer beds"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={count}
                    onChange={(e) => setBedCount(Number(e.target.value))}
                    className={`${fieldCls} text-center`}
                    style={{ borderColor: ui.border, color: ui.text }}
                  />
                  <button
                    type="button"
                    onClick={() => setBedCount(count + 1)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                    style={{ borderColor: ui.border }}
                    aria-label="More beds"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Bed preview */}
            <div
              className="mt-4 rounded-xl p-3"
              style={{ backgroundColor: ui.inner }}
            >
              {beds.length > 0 ? (
                <>
                  <p className="mb-2 text-[11px] opacity-60">
                    Will create {beds.length} bed{beds.length === 1 ? "" : "s"}
                  </p>
                  <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                    {beds.map((b) => (
                      <span
                        key={b}
                        className="rounded-lg px-2 py-1 font-mono text-[11px] font-medium"
                        style={{
                          backgroundColor: `${PRIMARY_COLOR}1F`,
                          color: PRIMARY_COLOR,
                        }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-[11px] opacity-60">No beds configured.</p>
              )}
            </div>
          </section>

          <div className="flex items-center justify-end gap-2">
            <Link
              href="/dashboard/wards"
              className="rounded-xl border px-4 py-2.5 text-xs font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              style={{ borderColor: ui.border }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              Review &amp; save
            </button>
          </div>
        </form>
      </div>

      {/* ─── Preview before save ───────────────────── */}
      <Modal
        open={showPreview}
        onClose={() => (saving ? undefined : setShowPreview(false))}
        title="Review ward"
        ui={ui}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            {[
              ["Name", name.trim() || "—"],
              ["Code", code.trim() || "—"],
              ["Type", typeLabel(type)],
              ["Floor", floor.trim() || "—"],
              ["Beds", String(beds.length)],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-start justify-between gap-4 border-b py-2.5 text-xs last:border-0"
                style={{ borderColor: ui.border }}
              >
                <span className="opacity-50">{k}</span>
                <span className="break-words text-right font-medium capitalize">
                  {v}
                </span>
              </div>
            ))}
          </div>

          {beds.length > 0 && (
            <p className="break-words text-[11px] opacity-60">
              Will create:{" "}
              <span className="font-mono font-medium">
                {beds.slice(0, 8).join(", ")}
                {beds.length > 8 ? ` … ${beds[beds.length - 1]}` : ""}
              </span>
            </p>
          )}

          <div
            className="flex justify-end gap-2 border-t pt-4"
            style={{ borderColor: ui.border }}
          >
            <button
              type="button"
              disabled={saving}
              onClick={() => setShowPreview(false)}
              className="rounded-xl border px-4 py-2.5 text-xs font-medium transition-colors hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
              style={{ borderColor: ui.border }}
            >
              Back to edit
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onConfirmSave}
              className="rounded-xl px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              {saving ? "Creating…" : "Save ward"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
