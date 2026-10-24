"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Save, FlaskConical } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { addLabCatalogItem } from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";

export default function NewCatalogItemPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors, colors?.border);

  // Extract facility ID correctly from Redux store
  const { activeFacilityId, activeFacility } = useAppSelector(
    (s) => s.facilities
  );
  const facilityId = activeFacilityId || activeFacility?._id || "";

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Hematology");
  const [price, setPrice] = useState("");
  const [specimenType, setSpecimenType] = useState("");
  const [turnaroundHours, setTurnaroundHours] = useState("");
  const [units, setUnits] = useState("");
  const [referenceRange, setReferenceRange] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const notify = (m: string, isErr = false) => {
    if (isErr) setErr(m);
    else setMsg(m);
    setTimeout(() => {
      setMsg(null);
      setErr(null);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId) {
      notify("Active facility ID not found", true);
      return;
    }

    try {
      setSaving(true);
      await dispatch(
        addLabCatalogItem({
          facilityId,
          payload: {
            code,
            name,
            category,
            price: Number(price) || 0,
            specimenType: specimenType || undefined,
            turnaroundHours: turnaroundHours
              ? Number(turnaroundHours)
              : undefined,
            units: units || undefined,
            referenceRange: referenceRange || undefined,
          },
        })
      ).unwrap();

      // Clear inputs upon successful submission
      setCode("");
      setName("");
      setCategory("Hematology");
      setPrice("");
      setSpecimenType("");
      setTurnaroundHours("");
      setUnits("");
      setReferenceRange("");

      notify("Test created successfully");
      setTimeout(() => router.push(`/dashboard/labs`), 1000);
    } catch (e: unknown) {
      notify(typeof e === "string" ? e : "Failed to create test", true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-3 sm:px-6 py-6 space-y-6">
      {(msg || err) && (
        <div
          className="fixed right-4 top-4 rounded-2xl px-4 py-3 text-xs font-semibold z-50"
          style={{
            backgroundColor: ui.card,
            color: err ? "#ef4444" : "#059669",
          }}
        >
          {msg || err}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs opacity-70">
        <Link
          href={
            facilityId
              ? `/dashboard/labs`
              : `/dashboard`
          }
          className="hover:opacity-100"
        >
          Laboratory Home
        </Link>
        <ChevronRight size={12} />
        <span className="font-semibold">Add Catalog Test</span>
      </div>

      <div
        className="rounded-[32px] p-6 sm:p-8 space-y-6"
        style={{ backgroundColor: ui.card, color: ui.text }}
      >
        <div
          className="flex items-center gap-3 pb-2 border-b"
          style={{ borderColor: ui.border }}
        >
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
          >
            <FlaskConical size={24} />
          </span>
          <div>
            <h1 className="text-xl font-bold">Add Test to Catalog</h1>
            <p className="text-xs opacity-60">
              Create a readily available lab test with pricing and reference
              ranges.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-semibold opacity-70">
                Test Code *
              </label>
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. MP"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none uppercase"
                style={{
                  backgroundColor: ui.inner,
                  color: ui.text,
                  borderColor: "transparent",
                }}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold opacity-70">
                Test Name *
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Malaria Parasite Test"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                style={{
                  backgroundColor: ui.inner,
                  color: ui.text,
                  borderColor: "transparent",
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-semibold opacity-70">
                Category *
              </label>
              <input
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Parasitology"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                style={{
                  backgroundColor: ui.inner,
                  color: ui.text,
                  borderColor: "transparent",
                }}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold opacity-70">
                Price (₦) *
              </label>
              <input
                required
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 2500"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                style={{
                  backgroundColor: ui.inner,
                  color: ui.text,
                  borderColor: "transparent",
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-semibold opacity-70">
                Specimen Type
              </label>
              <input
                value={specimenType}
                onChange={(e) => setSpecimenType(e.target.value)}
                placeholder="e.g. Whole Blood / Serum"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                style={{
                  backgroundColor: ui.inner,
                  color: ui.text,
                  borderColor: "transparent",
                }}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold opacity-70">
                Turnaround Time (Hours)
              </label>
              <input
                type="number"
                value={turnaroundHours}
                onChange={(e) => setTurnaroundHours(e.target.value)}
                placeholder="e.g. 24"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                style={{
                  backgroundColor: ui.inner,
                  color: ui.text,
                  borderColor: "transparent",
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-semibold opacity-70">
                Units
              </label>
              <input
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="e.g. g/dL or cells/µL"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                style={{
                  backgroundColor: ui.inner,
                  color: ui.text,
                  borderColor: "transparent",
                }}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold opacity-70">
                Reference Range
              </label>
              <input
                value={referenceRange}
                onChange={(e) => setReferenceRange(e.target.value)}
                placeholder="e.g. 13.5 - 17.5"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                style={{
                  backgroundColor: ui.inner,
                  color: ui.text,
                  borderColor: "transparent",
                }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link
              href={
                facilityId
                  ? `/dashboard/labs`
                  : `/dashboard`
              }
              className="rounded-full px-6 py-3 text-xs font-semibold"
              style={{ backgroundColor: ui.inner }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Save size={14} /> {saving ? "Saving..." : "Create Test"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
