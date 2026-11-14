"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/access/guarded-link";
import { ChevronRight, Save, FlaskConical, Plus, Trash2, Key, Info } from "lucide-react";
import { useAppDispatch } from "@/api/hooks";
import { addLabCatalogItem } from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { useFacilityId } from "@/hooks/useFacilityId";
import { ToggleSwitch } from "@/components/ui/items";

export default function NewCatalogItemPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors, colors?.border);

  // Use the comprehensive useFacilityId hook
  const { facilityId } = useFacilityId();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Hematology");
  const [price, setPrice] = useState("");
  const [specimenType, setSpecimenType] = useState("");
  const [turnaroundHours, setTurnaroundHours] = useState("");
  const [units, setUnits] = useState("");
  const [referenceRange, setReferenceRange] = useState("");
  const [defaultKeys, setDefaultKeys] = useState<string[]>([]);
  const [newKeyInput, setNewKeyInput] = useState("");
  const [isActive, setIsActive] = useState(true);

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

  const handleAddDefaultKey = () => {
    if (!newKeyInput.trim()) return;
    if (defaultKeys.includes(newKeyInput.trim())) {
      notify("Key already exists in template parameters", true);
      return;
    }
    setDefaultKeys([...defaultKeys, newKeyInput.trim()]);
    setNewKeyInput("");
  };

  const handleRemoveDefaultKey = (index: number) => {
    setDefaultKeys(defaultKeys.filter((_, i) => i !== index));
  };

  const handleKeyChange = (index: number, val: string) => {
    const updated = [...defaultKeys];
    updated[index] = val;
    setDefaultKeys(updated);
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
            defaultKeys: defaultKeys.filter((k) => k.trim().length > 0),
            isActive,
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
      setDefaultKeys([]);
      setIsActive(true);

      notify("Test created successfully");
      setTimeout(() => router.push(`/dashboard/labs`), 1000);
    } catch (e: unknown) {
      notify(typeof e === "string" ? e : "Failed to create test", true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {(msg || err) && (
        <div
          className="fixed right-4 top-4 rounded-2xl px-4 py-3 text-xs font-semibold z-50 shadow-xl border"
          style={{
            backgroundColor: ui.card,
            borderColor: ui.border,
            color: err ? "#ef4444" : "#059669",
          }}
        >
          {msg || err}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs opacity-70 overflow-x-auto whitespace-nowrap">
        <Link
          href={facilityId ? `/dashboard/labs` : `/dashboard`}
          className="hover:opacity-100"
        >
          Laboratory Home
        </Link>
        <ChevronRight size={12} className="shrink-0" />
        <span className="font-semibold">Add Catalog Test</span>
      </div>

      <div
        className="rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 space-y-6 shadow-sm border border-black/5 dark:border-white/5"
        style={{ backgroundColor: ui.card, color: ui.text }}
      >
        <div
          className="flex flex-col sm:flex-row sm:items-center gap-3 pb-4 border-b"
          style={{ borderColor: ui.border }}
        >
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
            style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
          >
            <FlaskConical size={24} />
          </span>
          <div>
            <h1 className="text-lg sm:text-xl font-bold">Add Test to Catalog</h1>
            <p className="text-xs opacity-60">
              Create a readily available lab test with pricing, reference
              ranges, and parameter template keys.
            </p>
          </div>
        </div>

        {/* Informational Hint Box */}
        <div
          className="rounded-2xl p-4 flex items-start gap-3 text-xs border"
          style={{
            backgroundColor: ui.inner,
            borderColor: ui.border,
          }}
        >
          <Info
            size={16}
            className="shrink-0 mt-0.5"
            style={{ color: PRIMARY_COLOR }}
          />
          <div className="space-y-1">
            <span className="font-bold block">
              How Template Parameter Keys Work
            </span>
            <p className="opacity-70 leading-relaxed">
              Template keys configured below act as default guiding sub-fields
              (such as appearance, differential counts, or specific chemical
              values) when lab scientists enter results for this test on patient
              lab requests.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold opacity-70">
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
              <label className="mb-1.5 block text-xs font-semibold opacity-70">
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
              <label className="mb-1.5 block text-xs font-semibold opacity-70">
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
              <label className="mb-1.5 block text-xs font-semibold opacity-70">
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
              <label className="mb-1.5 block text-xs font-semibold opacity-70">
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
              <label className="mb-1.5 block text-xs font-semibold opacity-70">
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
              <label className="mb-1.5 block text-xs font-semibold opacity-70">
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
              <label className="mb-1.5 block text-xs font-semibold opacity-70">
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

          {/* Template Parameter Keys Section */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="text-xs font-semibold opacity-70 flex items-center gap-1.5">
                <Key size={14} className="shrink-0" /> Template Parameter Keys
                (Guiding Fields for Results)
              </label>
              <span className="text-[10px] opacity-50">
                Add keys like Appearance, WBC, pH, etc.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newKeyInput}
                onChange={(e) => setNewKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddDefaultKey();
                  }
                }}
                placeholder="e.g. Appearance or Segments"
                className="w-full sm:flex-1 rounded-2xl border px-4 py-3 text-xs outline-none"
                style={{
                  backgroundColor: ui.inner,
                  color: ui.text,
                  borderColor: "transparent",
                }}
              />
              <button
                type="button"
                onClick={handleAddDefaultKey}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1 rounded-2xl px-5 py-3 text-xs font-semibold text-white transition hover:opacity-90 shrink-0"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <Plus size={14} /> Add Key
              </button>
            </div>

            <div className="space-y-2 pt-1 max-h-48 overflow-y-auto">
              {defaultKeys.length === 0 ? (
                <p className="text-xs opacity-40 py-1">
                  No default template keys added yet.
                </p>
              ) : (
                defaultKeys.map((key, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => handleKeyChange(index, e.target.value)}
                      className="w-full flex-1 rounded-xl border px-3 py-2 text-xs outline-none"
                      style={{
                        backgroundColor: ui.inner,
                        color: ui.text,
                        borderColor: ui.border,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveDefaultKey(index)}
                      className="rounded-xl p-2.5 text-rose-500 hover:bg-rose-500/10 transition shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Styled Toggle Switch */}
          <div
            className="p-4 rounded-2xl border"
            style={{
              backgroundColor: ui.inner,
              borderColor: ui.border,
            }}
          >
            <ToggleSwitch
              checked={isActive}
              onChange={(val) => setIsActive(val)}
              label="Available in Lab Catalog (Active)"
              description="Enable or disable this test from showing up when doctors create new lab requests."
            />
          </div>

          <div
            className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t"
            style={{ borderColor: ui.border }}
          >
            <Link
              href={facilityId ? `/dashboard/labs` : `/dashboard`}
              className="w-full sm:w-auto text-center rounded-full px-6 py-3 text-xs font-semibold transition hover:opacity-80"
              style={{ backgroundColor: ui.inner }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
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