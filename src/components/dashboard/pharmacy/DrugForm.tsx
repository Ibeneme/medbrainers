"use client";

import { useState } from "react";
import Link from "@/components/access/guarded-link";
import { Bookmark, Save, Trash2 } from "lucide-react";
import { CustomDropdown, ToggleSwitch } from "@/components/ui/items";
import type { DrugPayload, PharmacyDrug } from "@/api/slices";
import {
  FormField,
  GhostButton,
  PrimaryButton,
  SectionCard,
  TextArea,
  TextInput,
  usePharmacyUI,
} from "./PharmacyUI";

const FORMS = [
  "tablet",
  "capsule",
  "syrup",
  "suspension",
  "injection",
  "infusion",
  "cream",
  "ointment",
  "drops",
  "inhaler",
  "suppository",
  "sachet",
  "patch",
  "other",
];
const ROUTES = [
  "oral",
  "iv",
  "im",
  "sc",
  "topical",
  "inhalation",
  "rectal",
  "ophthalmic",
  "otic",
  "sublingual",
  "other",
];
const SCHEDULES = ["II", "III", "IV", "V"];
const cap = (s: string) => ({
  label: s.length <= 3 ? s.toUpperCase() : s[0].toUpperCase() + s.slice(1),
  value: s,
});

export default function DrugForm({
  initial,
  defaultReorder = 20,
  saving,
  submitLabel,
  onSubmit,
  cancelHref = "/dashboard/pharmacy/catalog",
  categories = [],
  placeholders = {},
  onSaveDraft,
  onDiscardDraft,
}: {
  initial?: PharmacyDrug | null;
  defaultReorder?: number;
  saving: boolean;
  submitLabel: string;
  onSubmit: (payload: DrugPayload) => void;
  cancelHref?: string;
  categories?: string[];
  placeholders?: Record<string, string>;
  onSaveDraft?: (payload: any) => void;
  onDiscardDraft?: () => void;
}) {
  const { ui, isDark, colors, border, currencySymbol } = usePharmacyUI();
  const [f, setF] = useState({
    code: initial?.code || "",
    genericName: initial?.genericName || "",
    brandName: initial?.brandName || "",
    category: initial?.category || "",
    form: initial?.form || "tablet",
    strength: initial?.strength || "",
    route: initial?.route || "oral",
    unit: initial?.unit || "tablet",
    manufacturer: initial?.manufacturer || "",
    barcode: initial?.barcode || "",
    price: initial ? String(initial.price) : "",
    costPrice: initial ? String(initial.costPrice ?? 0) : "",
    reorderLevel: String(initial?.reorderLevel ?? defaultReorder),
    requiresPrescription: initial?.requiresPrescription ?? true,
    isControlled: initial?.isControlled ?? false,
    controlledSchedule:
      initial?.controlledSchedule && initial.controlledSchedule !== "none"
        ? initial.controlledSchedule
        : "II",
    storage: initial?.storage || "",
    notes: initial?.notes || "",
    isActive: initial?.isActive ?? true,
  });
  const set = (k: keyof typeof f, v: any) => setF((p) => ({ ...p, [k]: v }));
  const dd = { isDark, colors, border };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      code: f.code,
      genericName: f.genericName,
      brandName: f.brandName || undefined,
      category: f.category,
      form: f.form as any,
      strength: f.strength || undefined,
      route: f.route as any,
      unit: f.unit || "unit",
      manufacturer: f.manufacturer || undefined,
      barcode: f.barcode || undefined,
      price: Number(f.price) || 0,
      costPrice: Number(f.costPrice) || 0,
      reorderLevel: Number(f.reorderLevel) || 0,
      requiresPrescription: f.requiresPrescription,
      isControlled: f.isControlled,
      controlledSchedule: f.isControlled
        ? (f.controlledSchedule as any)
        : "none",
      storage: f.storage || undefined,
      notes: f.notes || undefined,
      isActive: f.isActive,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <SectionCard title="Identification">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Drug code *">
            <TextInput
              required
              upper
              value={f.code}
              onChange={(e) => set("code", e.target.value)}
              placeholder={placeholders.code || "e.g. AMX500"}
              className="uppercase"
            />
          </FormField>
          <FormField label="Generic name *">
            <TextInput
              required
              value={f.genericName}
              onChange={(e) => set("genericName", e.target.value)}
              placeholder={placeholders.genericName || "e.g. Amoxicillin"}
            />
          </FormField>
          <FormField label="Brand name">
            <TextInput
              value={f.brandName}
              onChange={(e) => set("brandName", e.target.value)}
              placeholder={placeholders.brandName || "e.g. Amoxil"}
            />
          </FormField>
          <FormField label="Category *">
            <TextInput
              required
              list="drug-categories"
              value={f.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder={
                placeholders.category || "Select or type category..."
              }
            />
            <datalist id="drug-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Presentation">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomDropdown
            label="Form"
            value={f.form}
            options={FORMS.map(cap)}
            onChange={(v) => set("form", v)}
            placeholder={placeholders.form || "Select form..."}
            {...dd}
          />
          <FormField label="Strength">
            <TextInput
              value={f.strength}
              onChange={(e) => set("strength", e.target.value)}
              placeholder={placeholders.strength || "e.g. 500mg or 250mg/5ml"}
            />
          </FormField>
          <CustomDropdown
            label="Route"
            value={f.route}
            options={ROUTES.map(cap)}
            onChange={(v) => set("route", v)}
            placeholder={placeholders.route || "Select route..."}
            {...dd}
          />
          <FormField
            label="Dispensing unit"
            hint="What 1 quantity means: tablet, bottle, vial…"
          >
            <TextInput
              value={f.unit}
              onChange={(e) => set("unit", e.target.value)}
              placeholder={
                placeholders.dispensingUnit || "e.g. tablet, bottle, vial"
              }
            />
          </FormField>
          <FormField label="Manufacturer">
            <TextInput
              value={f.manufacturer}
              onChange={(e) => set("manufacturer", e.target.value)}
              placeholder={placeholders.manufacturer || "e.g. PharmaCorp Ltd"}
            />
          </FormField>
          <FormField label="Barcode">
            <TextInput
              value={f.barcode}
              onChange={(e) => set("barcode", e.target.value)}
              placeholder={placeholders.barcode || "e.g. 5012345678900"}
            />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Pricing & stock">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label={`Selling price (${currencySymbol}) *`}>
            <TextInput
              required
              type="number"
              min={0}
              step="0.01"
              value={f.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder={placeholders.sellingPrice || "0.00"}
            />
          </FormField>
          <FormField label={`Cost price (${currencySymbol})`}>
            <TextInput
              type="number"
              min={0}
              step="0.01"
              value={f.costPrice}
              onChange={(e) => set("costPrice", e.target.value)}
              placeholder={placeholders.costPrice || "0.00"}
            />
          </FormField>
          <FormField
            label="Reorder level"
            hint="Low-stock alert at or below this quantity."
          >
            <TextInput
              type="number"
              min={0}
              value={f.reorderLevel}
              onChange={(e) => set("reorderLevel", e.target.value)}
              placeholder={placeholders.reorderLevel || "20"}
            />
          </FormField>
        </div>
        <FormField label="Storage conditions">
          <TextInput
            value={f.storage}
            onChange={(e) => set("storage", e.target.value)}
            placeholder={
              placeholders.storageConditions ||
              "e.g. Store below 25°C, protect from light"
            }
          />
        </FormField>
      </SectionCard>

      <SectionCard title="Regulation">
        <div className="space-y-3">
          <div
            className="p-4 rounded-2xl border"
            style={{ backgroundColor: ui.inner, borderColor: ui.border }}
          >
            <ToggleSwitch
              checked={f.requiresPrescription}
              onChange={(v) => set("requiresPrescription", v)}
              label="Prescription only (POM)"
              description="Off for over-the-counter items."
            />
          </div>
          <div
            className="p-4 rounded-2xl border space-y-3"
            style={{ backgroundColor: ui.inner, borderColor: ui.border }}
          >
            <ToggleSwitch
              checked={f.isControlled}
              onChange={(v) => set("isControlled", v)}
              label="Controlled substance"
              description="Every receipt, dispense and adjustment is written to the controlled-substances register."
            />
            {f.isControlled && (
              <CustomDropdown
                label="Schedule"
                value={f.controlledSchedule}
                options={SCHEDULES.map((s) => ({
                  label: `Schedule ${s}`,
                  value: s,
                }))}
                onChange={(v) => set("controlledSchedule", v)}
                placeholder="Select schedule..."
                {...dd}
              />
            )}
          </div>
          {initial && (
            <div
              className="p-4 rounded-2xl border"
              style={{ backgroundColor: ui.inner, borderColor: ui.border }}
            >
              <ToggleSwitch
                checked={f.isActive}
                onChange={(v) => set("isActive", v)}
                label="Available in catalog (Active)"
                description="Inactive drugs can't be prescribed or dispensed, but history is kept."
              />
            </div>
          )}
        </div>
        <FormField label="Notes">
          <TextArea
            value={f.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder={
              placeholders.notes ||
              "Add any additional formulary or regulatory notes here..."
            }
          />
        </FormField>
      </SectionCard>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onSaveDraft && (
            <GhostButton
              type="button"
              icon={Bookmark}
              onClick={() => onSaveDraft(f)}
            >
              Save to draft
            </GhostButton>
          )}
          {onDiscardDraft && (
            <GhostButton
              type="button"
              icon={Trash2}
              danger
              onClick={onDiscardDraft}
            >
              Discard
            </GhostButton>
          )}
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 w-full sm:w-auto">
          <Link
            href={cancelHref}
            className="text-center rounded-full px-6 py-3 text-xs font-semibold transition hover:opacity-80"
            style={{ backgroundColor: ui.inner }}
          >
            Cancel
          </Link>
          <PrimaryButton type="submit" disabled={saving} icon={Save}>
            {saving ? "Saving..." : submitLabel}
          </PrimaryButton>
        </div>
      </div>
    </form>
  );
}
