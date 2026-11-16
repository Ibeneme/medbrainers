"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Info } from "lucide-react";
import { Field, PrimaryButton, TextInput, usePharmacyUi } from "./chrome";
import {
  CustomDropdown,
  ToggleSwitch,
  CustomPopupDatePicker,
} from "@/components/ui/items";
import {
  createDrug,
  updateDrug,
  type PharmacyDrug,
  type DrugForm,
  type DrugSchedule,
} from "@/api/slices";

const FORMS: DrugForm[] = [
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
  "powder",
  "other",
];
const SCHEDULES: DrugSchedule[] = ["otc", "pom", "controlled"];

export function CatalogForm({ initial }: { initial?: PharmacyDrug | null }) {
  const router = useRouter();
  const { ui, dispatch, facilityId, pharmacy, isDark, colors, currencySymbol } =
    usePharmacyUi();
  const [showGuide, setShowGuide] = useState(false);

  const [form, setForm] = useState({
    code: "",
    genericName: "",
    brandName: "",
    strength: "",
    form: "tablet" as DrugForm,
    route: "" as string,
    category: "",
    packSize: "",
    unit: "",
    reorderLevel: 0,
    reorderQty: 0,
    costPrice: 0,
    sellingPrice: 0,
    schedule: "pom" as DrugSchedule,
    isControlled: false,
    requiresCounsel: false,
    nafdacNo: "",
    manufacturer: "",
    expiryDate: "",
    isActive: true,
  });

  useEffect(() => {
    if (!initial) return;
    const initAny = initial as any;
    setForm({
      code: initial.code,
      genericName: initial.genericName,
      brandName: initial.brandName || "",
      strength: initial.strength || "",
      form: initial.form || "tablet",
      route: initial.route || "",
      category: initial.category,
      packSize: initAny.packSize || "",
      unit: initial.unit || "",
      reorderLevel: initial.reorderLevel || 0,
      reorderQty: initAny.reorderQty || 0,
      costPrice: initial.costPrice || 0,
      sellingPrice: initial.sellingPrice || 0,
      schedule: initial.schedule || "pom",
      isControlled: initial.isControlled,
      requiresCounsel: initAny.requiresCounsel || false,
      nafdacNo: initial.nafdacNo || "",
      manufacturer: initial.manufacturer || "",
      expiryDate: initAny.expiryDate || "",
      isActive: initial.isActive,
    });
  }, [initial]);

  const set = (patch: Partial<typeof form>) =>
    setForm((f) => ({ ...f, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId) return;

    const payload = {
      ...form,
      route: (form.route || undefined) as any,
      isControlled: form.schedule === "controlled" || form.isControlled,
      brandName: form.brandName || undefined,
      nafdacNo: form.nafdacNo || undefined,
      expiryDate: form.expiryDate || undefined,
    };

    if (initial?._id) {
      await dispatch(
        updateDrug({ facilityId, catalogId: initial._id, payload } as any),
      ).unwrap();
    } else {
      await dispatch(createDrug({ facilityId, payload } as any)).unwrap();
    }
    router.push("/dashboard/pharmacy/catalog");
  };

  const formOptions = FORMS.map((f) => ({ label: f, value: f }));
  const scheduleOptions = SCHEDULES.map((s) => ({
    label:
      s === "pom"
        ? "POM (Prescription Only)"
        : s === "otc"
          ? "OTC (Over The Counter)"
          : "Controlled",
    value: s,
  }));

  const formatExpiryDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long" })
      .format(date)
      .toLowerCase();
    const day = date.getDate();
    const suffix =
      ["th", "st", "nd", "rd"][((day % 100) - 20) % 10] ||
      ["th", "st", "nd", "rd"][day % 10] ||
      "th";
    const month = new Intl.DateTimeFormat("en-GB", { month: "long" })
      .format(date)
      .toLowerCase();
    const year = date.getFullYear();
    return `${weekday} ${day}${suffix} ${month} ${year}`;
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-[32px] p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
      style={{ backgroundColor: ui.card }}
    >
      {/* Page Hint / Explanation Box */}
      <div
        className="sm:col-span-2 rounded-[24px] p-4 border text-xs space-y-2 mb-2"
        style={{
          backgroundColor: isDark ? "rgba(59, 130, 246, 0.1)" : "#eff6ff",
          borderColor: isDark ? "rgba(59, 130, 246, 0.3)" : "#bfdbfe",
          color: isDark ? "#93c5fd" : "#1e40af",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Info size={15} />
            <span>Catalog Item Guide</span>
          </div>
          <button
            type="button"
            onClick={() => setShowGuide((v) => !v)}
            className="text-[11px] underline opacity-80"
          >
            {showGuide ? "Hide hints" : "Show hints"}
          </button>
        </div>
        <p className="opacity-90 leading-relaxed">
          Add or modify pharmaceutical items in your inventory catalog. Complete
          all mandatory fields marked with an asterisk (*) accurately for proper
          dispensing and stock tracking.
        </p>
        {showGuide && (
          <div className="pt-2 border-t border-blue-500/20 space-y-1 text-[11px] opacity-85">
            <p>
              • <strong>Code & Category:</strong> Assign a unique stock
              identification code and standard clinical category.
            </p>
            <p>
              • <strong>Pricing & Reorder:</strong> Configure accurate pricing
              and inventory reorder thresholds to trigger low-stock alerts.
            </p>
            <p>
              • <strong>Schedule & Controls:</strong> Select proper drug
              schedules (OTC, POM, or Controlled) to mandate prescription
              verifications and pharmacist counselling.
            </p>
          </div>
        )}
      </div>

      <Field label="Code *">
        <TextInput
          ui={ui}
          required
          value={form.code}
          onChange={(e) => set({ code: e.target.value.toUpperCase() })}
          placeholder="e.g. PCM500"
        />
      </Field>

      <Field label="Category *">
        <TextInput
          ui={ui}
          required
          value={form.category}
          onChange={(e) => set({ category: e.target.value })}
          placeholder="e.g. Analgesic"
        />
      </Field>

      <Field label="Generic name *">
        <TextInput
          ui={ui}
          required
          value={form.genericName}
          onChange={(e) => set({ genericName: e.target.value })}
          placeholder="e.g. Paracetamol"
        />
      </Field>

      <Field label="Brand name">
        <TextInput
          ui={ui}
          value={form.brandName}
          onChange={(e) => set({ brandName: e.target.value })}
          placeholder="e.g. Panadol"
        />
      </Field>

      <Field label="Strength">
        <TextInput
          ui={ui}
          value={form.strength}
          onChange={(e) => set({ strength: e.target.value })}
          placeholder="e.g. 500 mg"
        />
      </Field>

      <Field label="Form">
        <CustomDropdown
          label=""
          value={form.form}
          options={formOptions}
          onChange={(val) => set({ form: val as DrugForm })}
          placeholder="Select form..."
          isDark={isDark}
          colors={colors}
          border={ui.border}
          searchable={false}
        />
      </Field>

      <Field label="Route">
        <TextInput
          ui={ui}
          value={form.route}
          onChange={(e) => set({ route: e.target.value })}
          placeholder="e.g. Oral, Intravenous"
        />
      </Field>

      <Field label="Unit">
        <TextInput
          ui={ui}
          value={form.unit}
          onChange={(e) => set({ unit: e.target.value })}
          placeholder="e.g. tablet, ml, vial"
        />
      </Field>

      <Field label="Pack size">
        <TextInput
          ui={ui}
          value={form.packSize}
          onChange={(e) => set({ packSize: e.target.value })}
          placeholder="e.g. 10 x 10"
        />
      </Field>

      <Field label="NAFDAC no.">
        <TextInput
          ui={ui}
          value={form.nafdacNo}
          onChange={(e) => set({ nafdacNo: e.target.value.toUpperCase() })}
          placeholder="e.g. A4-1234"
        />
      </Field>

      <Field label="Manufacturer">
        <TextInput
          ui={ui}
          value={form.manufacturer}
          onChange={(e) => set({ manufacturer: e.target.value })}
          placeholder="e.g. GSK Pharmaceuticals"
        />
      </Field>

      <Field
        label={
          form.expiryDate
            ? `Expiry date (${formatExpiryDisplay(form.expiryDate)})`
            : "Expiry date"
        }
      >
        <CustomPopupDatePicker
          label=""
          value={form.expiryDate}
          onChange={(val) => set({ expiryDate: val })}
          border={ui.border}
          colors={colors}
          isDark={isDark}
          placeholder="Select expiry date..."
        />
      </Field>

      <Field label="Schedule">
        <CustomDropdown
          label=""
          value={form.schedule}
          options={scheduleOptions}
          onChange={(val) => {
            const schedule = val as DrugSchedule;
            set({
              schedule,
              isControlled: schedule === "controlled",
              requiresCounsel:
                schedule === "controlled" || form.requiresCounsel,
            });
          }}
          placeholder="Select schedule..."
          isDark={isDark}
          colors={colors}
          border={ui.border}
          searchable={false}
        />
      </Field>

      <Field label={`Cost price (${currencySymbol})`}>
        <TextInput
          ui={ui}
          type="number"
          min={0}
          value={form.costPrice || ""}
          onChange={(e) => set({ costPrice: Number(e.target.value) })}
          placeholder="0.00"
        />
      </Field>

      <Field label={`Selling price (${currencySymbol}) *`}>
        <TextInput
          ui={ui}
          type="number"
          min={0}
          required
          value={form.sellingPrice || ""}
          onChange={(e) => set({ sellingPrice: Number(e.target.value) })}
          placeholder="0.00"
        />
      </Field>

      <Field label="Reorder level">
        <TextInput
          ui={ui}
          type="number"
          min={0}
          value={form.reorderLevel || ""}
          onChange={(e) => set({ reorderLevel: Number(e.target.value) })}
          placeholder="0"
        />
      </Field>

      <Field label="Reorder qty">
        <TextInput
          ui={ui}
          type="number"
          min={0}
          value={form.reorderQty || ""}
          onChange={(e) => set({ reorderQty: Number(e.target.value) })}
          placeholder="0"
        />
      </Field>

      <div className="sm:col-span-2 py-1">
        <ToggleSwitch
          checked={form.requiresCounsel}
          onChange={(checked) => set({ requiresCounsel: checked })}
          label="Requires Patient Counselling"
          description="Mandates that a licensed pharmacist must counsel the patient before or during dispensing."
        />
      </div>

      {initial && (
        <div className="sm:col-span-2 py-1">
          <ToggleSwitch
            checked={form.isActive}
            onChange={(checked) => set({ isActive: checked })}
            label="Active in Catalog"
            description="Toggle availability of this item for ordering and dispensary workflows."
          />
        </div>
      )}

      <div className="sm:col-span-2 flex justify-end pt-2">
        <PrimaryButton type="submit" disabled={pharmacy.saving}>
          <Save size={14} />{" "}
          {pharmacy.saving ? "Saving..." : initial ? "Update drug" : "Add drug"}
        </PrimaryButton>
      </div>
    </form>
  );
}
