"use client";

import { useEffect, useState } from "react";
import { Settings, Save } from "lucide-react";
import { fetchPharmacySetup, savePharmacySetup } from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import { CustomDropdown, ToggleSwitch } from "@/components/ui/items";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  formatMoney,
  getCurrency,
} from "@/constants/currencies";
import {
  FormField,
  PharmacyPage,
  PrimaryButton,
  SectionCard,
  TextArea,
  TextInput,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

export default function PharmacySetupPage() {
  const { dispatch, facilityId, pharmacy, act } = usePharmacy();
  const { ui, isDark, colors, border } = usePharmacyUI();
  const { setup, saving, listLoading } = pharmacy;

  const [form, setForm] = useState({
    name: "",
    licenseNumber: "",
    phone: "",
    email: "",
    address: "",
    expiryAlertDays: "90",
    defaultReorderLevel: "20",
    allowExpiredDispensing: false,
    requireCounselling: false,
    currency: DEFAULT_CURRENCY,
  });
  const set = (k: keyof typeof form, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (facilityId) dispatch(fetchPharmacySetup({ facilityId }));
  }, [dispatch, facilityId]);

  useEffect(() => {
    if (!setup) return;
    setForm({
      name: setup.name || "",
      licenseNumber: setup.licenseNumber || "",
      phone: setup.phone || "",
      email: setup.email || "",
      address: setup.address || "",
      expiryAlertDays: String(setup.settings?.expiryAlertDays ?? 90),
      defaultReorderLevel: String(setup.settings?.defaultReorderLevel ?? 20),
      allowExpiredDispensing: !!setup.settings?.allowExpiredDispensing,
      requireCounselling: !!setup.settings?.requireCounselling,
      currency: setup.settings?.currency || DEFAULT_CURRENCY,
    });
  }, [setup]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await act(
      savePharmacySetup({
        facilityId,
        payload: {
          name: form.name,
          licenseNumber: form.licenseNumber || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
          settings: {
            expiryAlertDays: Number(form.expiryAlertDays) || 90,
            defaultReorderLevel: Number(form.defaultReorderLevel) || 0,
            allowExpiredDispensing: form.allowExpiredDispensing,
            requireCounselling: form.requireCounselling,
            currency: form.currency,
          },
        },
      })
    );
  };

  return (
    <PharmacyPage
      narrow
      routes={[
        { label: "Pharmacy", href: "/dashboard/pharmacy" },
        { label: "Setup" },
      ]}
      title="Pharmacy Setup"
      description="Licence details, alert thresholds and dispensing rules for this facility."
      icon={Settings}
      loading={listLoading && !setup}
    >
      <form onSubmit={submit} className="space-y-5">
        <SectionCard title="Pharmacy details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Pharmacy name *">
              <TextInput
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Main Dispensary"
              />
            </FormField>
            <FormField label="Licence number">
              <TextInput
                value={form.licenseNumber}
                onChange={(e) => set("licenseNumber", e.target.value)}
                placeholder="e.g. PCN/LIC/2026/001"
              />
            </FormField>
            <FormField label="Phone">
              <TextInput
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="e.g. +234 800 000 0000"
              />
            </FormField>
            <FormField label="Email">
              <TextInput
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="e.g. pharmacy@hospital.com"
              />
            </FormField>
          </div>
          <FormField label="Address">
            <TextArea
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="e.g. 123 Healthcare Avenue, Medical District"
            />
          </FormField>
        </SectionCard>

        <SectionCard
          title="Selling currency"
          subtitle="Every price in the pharmacy (catalog, dispensing, purchase orders, reports) is shown in this currency."
        >
          <FormField
            label="Currency *"
            hint="Search by code, name or flag, e.g. NGN, USD, EUR..."
          >
            <CustomDropdown
              searchable
              value={form.currency}
              onChange={(v) => set("currency", v)}
              options={CURRENCIES.map((c) => ({
                value: c.code,
                label: `${c.flag ? c.flag + " " : ""}${c.code} — ${c.name}${
                  c.symbol ? ` (${c.symbol})` : ""
                }`,
              }))}
              isDark={isDark}
              colors={colors}
              border={border}
            />
          </FormField>
          <p className="text-xs opacity-60">
            Preview: a drug priced at 1,250.5 will show as{" "}
            <strong>{formatMoney(1250.5, form.currency)}</strong> (
            {getCurrency(form.currency)?.name || form.currency}). Changing
            currency only changes how amounts are labelled; it does not convert
            existing prices.
          </p>
        </SectionCard>

        <SectionCard
          title="Stock rules"
          subtitle="Drive the dashboard, expiry and low-stock screens."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Expiry alert window (days)"
              hint="Batches expiring inside this window are flagged."
            >
              <TextInput
                type="number"
                min={1}
                value={form.expiryAlertDays}
                onChange={(e) => set("expiryAlertDays", e.target.value)}
                placeholder="90"
              />
            </FormField>
            <FormField
              label="Default reorder level"
              hint="Suggested when adding a drug to the catalog."
            >
              <TextInput
                type="number"
                min={0}
                value={form.defaultReorderLevel}
                onChange={(e) => set("defaultReorderLevel", e.target.value)}
                placeholder="20"
              />
            </FormField>
          </div>
        </SectionCard>

        <SectionCard title="Dispensing rules">
          <div className="space-y-3">
            <div
              className="p-4 rounded-2xl border"
              style={{ backgroundColor: ui.inner, borderColor: ui.border }}
            >
              <ToggleSwitch
                checked={form.requireCounselling}
                onChange={(v) => set("requireCounselling", v)}
                label="Require patient counselling"
                description="Dispenses without a counselling record are flagged on the Counselling page."
              />
            </div>
            <div
              className="p-4 rounded-2xl border"
              style={{ backgroundColor: ui.inner, borderColor: ui.border }}
            >
              <ToggleSwitch
                checked={form.allowExpiredDispensing}
                onChange={(v) => set("allowExpiredDispensing", v)}
                label="Allow dispensing expired stock"
                description="Not recommended. Leave off so expired batches are never allocated."
              />
            </div>
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <PrimaryButton type="submit" disabled={saving} icon={Save}>
            {saving ? "Saving..." : "Save setup"}
          </PrimaryButton>
        </div>
      </form>
    </PharmacyPage>
  );
}
