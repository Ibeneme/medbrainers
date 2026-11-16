"use client";

import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import { CURRENCIES_SUPPORTED_BY_PAYSTACK, saveBillingSettings, type BillingSettings } from "@/api/slices";
import { useAccess } from "@/hooks/useAccess";
import { useBilling } from "@/hooks/useBilling";
import { ToggleSwitch } from "@/components/ui/items";
import { getCurrency } from "@/constants/currencies";
import {
  Alert, BillingPage, FormField, PrimaryButton, ReadOnlyNotice, SectionCard, SelectInput, TextInput,
} from "@/components/dashboard/billing/BillingUI";

/**
 * Per-facility billing settings — each hospital (tenant) controls these independently.
 * Everyone with billing.view can read them; only billing.manage can change them.
 */
export default function BillingSettingsPage() {
  const { facilityId, billing, act } = useBilling();
  const { can } = useAccess();
  const canEdit = can("billing.manage");
  const { settings, saving } = billing;

  // start from the store when it already has the settings (no loading flash on revisits); the effect handles late arrival / refresh
  const [draft, setDraft] = useState<BillingSettings | null>(settings);
  useEffect(() => {
    if (settings) setDraft(settings);
  }, [settings]);

  if (!draft || !settings) {
    return (
      <BillingPage title="Billing settings" icon={Settings2} loading loadingText="Loading settings...">
        <div />
      </BillingPage>
    );
  }

  const set = <K extends keyof BillingSettings>(k: K, v: BillingSettings[K]) => setDraft({ ...draft, [k]: v });
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
  const pct = Number(draft.maxManualDiscountPercent);
  const pctOk = Number.isFinite(pct) && pct >= 0 && pct <= 100;
  const prefixOk = /^[A-Z0-9]{1,8}$/.test(draft.invoicePrefix);
  const valid = pctOk && prefixOk;

  const save = async () => {
    if (!valid) return;
    // send only what changed — the server validates each field and audits the before/after
    const payload = Object.fromEntries(
      (Object.keys(draft) as Array<keyof BillingSettings>).filter((k) => draft[k] !== settings[k]).map((k) => [k, draft[k]]),
    ) as Partial<BillingSettings>;
    await act(saveBillingSettings({ facilityId, payload }), "Billing settings saved");
  };

  const currencyOptions = CURRENCIES_SUPPORTED_BY_PAYSTACK.map((c) => ({ value: c, label: `${c} — ${getCurrency(c)?.name ?? c}` }));

  return (
    <BillingPage
      narrow
      title="Billing settings"
      icon={Settings2}
      description="How this facility charges and collects"
      actions={
        canEdit ? (
          <PrimaryButton onClick={save} disabled={!dirty || !valid || saving}>
            {saving ? "Saving…" : "Save changes"}
          </PrimaryButton>
        ) : undefined
      }
    >
      {!canEdit && <ReadOnlyNotice what="these settings" />}

      <SectionCard title="Payment methods" subtitle="Online payments need Paystack keys (see the Paystack tab).">
        <ToggleSwitch
          checked={draft.acceptCashPayments}
          onChange={(v) => canEdit && set("acceptCashPayments", v)}
          label="Accept cash at the cash point"
          description="Cashiers record the cash, then confirm it. Turn off to take online payments only."
        />
        {!draft.acceptCashPayments && (
          <Alert tone="warning">
            With cash off, patients can <b>only pay online</b>. Make sure Paystack keys are saved, otherwise nobody can pay. Cash
            payments already waiting for confirmation can&apos;t be confirmed until you turn this back on.
          </Alert>
        )}
      </SectionCard>

      <SectionCard title="Currency & invoices">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Billing currency" hint="Used on every invoice and sent to Paystack. Change it only before you start billing.">
            <SelectInput value={draft.currency} onChange={(v) => set("currency", v)} options={currencyOptions} disabled={!canEdit} />
          </FormField>
          <FormField label="Invoice number prefix" hint={prefixOk ? `Next invoices look like ${draft.invoicePrefix}-000123` : "1–8 capital letters or digits"}>
            <TextInput value={draft.invoicePrefix} upper maxLength={8} disabled={!canEdit} onChange={(e) => set("invoicePrefix", e.target.value)} />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Manual discounts" subtitle="Ad-hoc discounts a cashier can give on top of your discount rules. Staff also need the 'discount' permission.">
        <ToggleSwitch
          checked={draft.allowManualDiscount}
          onChange={(v) => canEdit && set("allowManualDiscount", v)}
          label="Allow manual discounts"
          description="Every manual discount needs a written reason and is recorded in the audit log."
        />
        <FormField label="Largest manual discount (% of the bill)" hint={pctOk ? undefined : "Enter a number from 0 to 100"}>
          <TextInput
            type="number"
            min={0}
            max={100}
            step="1"
            inputMode="decimal"
            value={Number.isNaN(pct) ? "" : draft.maxManualDiscountPercent}
            disabled={!canEdit || !draft.allowManualDiscount}
            onChange={(e) => set("maxManualDiscountPercent", e.target.value === "" ? NaN : Number(e.target.value))}
          />
        </FormField>
      </SectionCard>
    </BillingPage>
  );
}
