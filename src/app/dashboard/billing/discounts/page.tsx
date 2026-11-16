"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgePercent, Pencil, Plus, Power, Sparkles } from "lucide-react";
import {
  BILLING_DEPARTMENTS, DEPARTMENT_LABELS, createDiscountRule, deactivateDiscountRule, fetchDiscountRules, updateDiscountRule,
  type BillingDepartment, type BillingDiscountRule, type DiscountScope, type DiscountType,
} from "@/api/slices";
import { useAccess } from "@/hooks/useAccess";
import { useBilling } from "@/hooks/useBilling";
import { Modal, ToggleSwitch } from "@/components/ui/items";
import {
  DISCOUNT_SCOPE_LABELS, DISCOUNT_TYPE_LABELS, describeConditions, describeDiscountValue, describeScope, draftToPayload,
  emptyDiscountDraft, familyBundlePreset, ruleToDraft, validateDiscountDraft, type DiscountDraft,
} from "@/lib/billing/helpers";
import {
  Alert, BillingPage, Chips, EmptyBox, FormField, GhostButton, Pager, Pill, PrimaryButton, ReadOnlyNotice, SectionCard,
  SelectInput, TableCard, TextArea, TextInput, Th, fmtDate, useBillingUI,
} from "@/components/dashboard/billing/BillingUI";

export default function DiscountsPage() {
  const { facilityId, billing, act, dispatch, money, currencySymbol } = useBilling();
  const { can } = useAccess();
  const canManage = can("billing.manage");
  const { ui, border } = useBillingUI();
  const { discounts, listLoading, saving } = billing;

  const [show, setShow] = useState<"all" | "active" | "off">("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<BillingDiscountRule | null>(null);
  const [draft, setDraft] = useState<DiscountDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!facilityId) return;
    dispatch(fetchDiscountRules({ facilityId, page, limit: 25, isActive: show === "all" ? undefined : show === "active" }));
  }, [dispatch, facilityId, page, show]);
  useEffect(load, [load]);

  const openNew = (preset?: DiscountDraft) => {
    setEditing(null);
    setDraft(preset ?? emptyDiscountDraft());
    setError(null);
  };
  const openEdit = (r: BillingDiscountRule) => {
    setEditing(r);
    setDraft(ruleToDraft(r));
    setError(null);
  };
  const close = () => {
    setDraft(null);
    setEditing(null);
  };
  const set = <K extends keyof DiscountDraft>(k: K, v: DiscountDraft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  const submit = async () => {
    if (!draft) return;
    const problem = validateDiscountDraft(draft);
    if (problem) return setError(problem);
    setError(null);
    const payload = draftToPayload(draft);
    const ok = editing
      ? await act(updateDiscountRule({ facilityId, ruleId: editing._id, payload }), "Discount updated")
      : await act(createDiscountRule({ facilityId, payload }), "Discount created");
    if (ok) close();
  };

  const toggle = async (r: BillingDiscountRule) => {
    if (r.isActive) await act(deactivateDiscountRule({ facilityId, ruleId: r._id }), `${r.name} turned off`);
    else await act(updateDiscountRule({ facilityId, ruleId: r._id, payload: { isActive: true } }), `${r.name} turned on`);
  };

  const toggleDept = (d: BillingDepartment) =>
    set("departments", draft!.departments.includes(d) ? draft!.departments.filter((x) => x !== d) : [...draft!.departments, d]);

  const valueLabel =
    draft?.type === "percentage" ? "Percentage off (%) *"
    : draft?.type === "fixed" ? `Amount off (${currencySymbol}) *`
    : draft?.type === "unit_price_override" ? `Price per unit (${currencySymbol}) *`
    : `Total price for one bundle (${currencySymbol}) *`;

  return (
    <BillingPage
      title="Discount rules"
      icon={BadgePercent}
      description="Applied automatically at the cash point, or by coupon code"
      loading={listLoading && discounts.items.length === 0}
      loadingText="Loading discounts..."
      onRefresh={load}
      actions={
        canManage ? (
          <>
            <GhostButton icon={Sparkles} onClick={() => openNew(familyBundlePreset())}>Family bundle</GhostButton>
            <PrimaryButton icon={Plus} onClick={() => openNew()}>New discount</PrimaryButton>
          </>
        ) : undefined
      }
    >
      {!canManage && <ReadOnlyNotice what="discount rules" />}

      <Chips
        label="Show"
        value={show}
        onChange={(v) => {
          setShow(v);
          setPage(1);
        }}
        options={[{ id: "all", label: "All" }, { id: "active", label: "On" }, { id: "off", label: "Off" }]}
      />

      {discounts.items.length === 0 && !listLoading ? (
        <EmptyBox
          icon={BadgePercent}
          title="No discount rules yet"
          hint="Create percentage or fixed discounts for everything, a department or a single drug or test — or a family bundle."
          action={canManage ? <PrimaryButton icon={Plus} onClick={() => openNew()}>Create a discount</PrimaryButton> : undefined}
        />
      ) : (
        <>
          <TableCard minWidth={900}>
            <thead>
              <tr>
                <Th>Discount</Th>
                <Th>Gives</Th>
                <Th>Applies to</Th>
                <Th>How it applies</Th>
                <Th>Valid</Th>
                <Th>Status</Th>
                {canManage && <Th className="text-right">Actions</Th>}
              </tr>
            </thead>
            <tbody>
              {discounts.items.map((r) => {
                const cond = describeConditions(r.conditions, money);
                return (
                  <tr key={r._id} className="border-t align-top" style={{ borderColor: border }}>
                    <td className="px-3 py-3">
                      <p className="font-medium">{r.name}</p>
                      {r.description && <p className="max-w-[240px] text-[11px] opacity-50">{r.description}</p>}
                    </td>
                    <td className="px-3 py-3 font-semibold">{describeDiscountValue(r, money)}</td>
                    <td className="px-3 py-3 text-xs">
                      {describeScope(r)}
                      {cond && <p className="mt-0.5 text-[11px] opacity-55">when {cond}</p>}
                    </td>
                    <td className="space-y-1 px-3 py-3 text-xs">
                      {r.autoApply ? <Pill label="automatic" color="#2563eb" /> : <Pill label={`code ${r.code}`} color="#7c3aed" />}
                      <p className="opacity-55">{r.stackable ? "combines with others" : "exclusive — best one wins"}</p>
                    </td>
                    <td className="px-3 py-3 text-xs opacity-70">
                      {r.validFrom || r.validTo ? `${r.validFrom ? fmtDate(r.validFrom) : "…"} → ${r.validTo ? fmtDate(r.validTo) : "no end"}` : "Always"}
                    </td>
                    <td className="px-3 py-3"><Pill label={r.isActive ? "on" : "off"} color={r.isActive ? "#16a34a" : "#6b7280"} /></td>
                    {canManage && (
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1.5">
                          <GhostButton icon={Pencil} onClick={() => openEdit(r)}>Edit</GhostButton>
                          <GhostButton icon={Power} danger={r.isActive} onClick={() => toggle(r)} disabled={saving}>{r.isActive ? "Turn off" : "Turn on"}</GhostButton>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </TableCard>
          <Pager page={discounts.page} limit={discounts.limit} total={discounts.total} onPage={setPage} />
        </>
      )}

      <SectionCard title="How discounts are combined" subtitle="So the numbers at the cash point are never a surprise.">
        <ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed opacity-70">
          <li>Every matching automatic rule (and any coupon code the cashier enters) is considered.</li>
          <li><b>Combinable</b> rules stack in priority order — a lower priority number goes first, each on what is left.</li>
          <li><b>Exclusive</b> rules don&apos;t combine: the patient gets whichever is better — the best exclusive rule, or all combinable rules together.</li>
          <li>A cashier&apos;s manual discount (if allowed) is applied last, with a written reason and a cap set in Settings.</li>
          <li>A line can never go below zero, and prices always come from the price catalog.</li>
        </ul>
      </SectionCard>

      <Modal open={!!draft} title={editing ? `Edit ${editing.name}` : "New discount"} onClose={close} ui={ui} maxWidth="max-w-2xl">
        {draft && (
          <div className="space-y-4">
            {error && <Alert tone="danger">{error}</Alert>}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Name *">
                <TextInput value={draft.name} onChange={(e) => set("name", e.target.value)} maxLength={120} placeholder="e.g. Staff 10% off pharmacy" />
              </FormField>
              <FormField label="Type *">
                <SelectInput
                  value={draft.type}
                  onChange={(v) => set("type", v as DiscountType)}
                  options={(Object.keys(DISCOUNT_TYPE_LABELS) as DiscountType[]).map((t) => ({ value: t, label: DISCOUNT_TYPE_LABELS[t] }))}
                />
              </FormField>
              <FormField label={valueLabel}>
                <TextInput value={draft.value} onChange={(e) => set("value", e.target.value)} inputMode="decimal" />
              </FormField>
              {draft.type === "bundle_price" && (
                <FormField label="People / units in one bundle *" hint="e.g. 5 — every full group of 5 costs the bundle price.">
                  <TextInput value={draft.bundleSize} onChange={(e) => set("bundleSize", e.target.value)} inputMode="numeric" />
                </FormField>
              )}
            </div>
            {draft.type === "fixed" && (
              <ToggleSwitch checked={draft.perUnit} onChange={(v) => set("perUnit", v)} label="Take it off every unit" description="Off: the amount is deducted once from the matching items' total." />
            )}

            <FormField label="Applies to *">
              <SelectInput
                value={draft.scope}
                onChange={(v) => set("scope", v as DiscountScope)}
                options={(Object.keys(DISCOUNT_SCOPE_LABELS) as DiscountScope[]).map((s) => ({ value: s, label: DISCOUNT_SCOPE_LABELS[s] }))}
              />
            </FormField>
            {draft.scope === "department" && (
              <div className="flex flex-wrap gap-2">
                {BILLING_DEPARTMENTS.map((d) => {
                  const on = draft.departments.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDept(d)}
                      className="rounded-2xl px-3 py-1.5 text-[11px] font-semibold transition"
                      style={{ backgroundColor: on ? "var(--brand-primary, #29AB29)" : ui.inner, color: on ? "#fff" : ui.text }}
                    >
                      {DEPARTMENT_LABELS[d]}
                    </button>
                  );
                })}
              </div>
            )}
            {draft.scope === "item" && (
              <FormField label="Item IDs *" hint="From the price catalog, separated by commas — e.g. LAB-FBC, PHARM-00012">
                <TextArea rows={2} value={draft.itemIds} onChange={(e) => set("itemIds", e.target.value)} />
              </FormField>
            )}

            <div className="rounded-2xl p-4" style={{ backgroundColor: ui.inner }}>
              <p className="mb-3 text-xs font-semibold">Only when… <span className="font-normal opacity-50">(all optional)</span></p>
              <div className="grid gap-3 sm:grid-cols-4">
                <FormField label="Min. units"><TextInput value={draft.minQuantity} onChange={(e) => set("minQuantity", e.target.value)} inputMode="numeric" placeholder="—" /></FormField>
                <FormField label="Max. units"><TextInput value={draft.maxQuantity} onChange={(e) => set("maxQuantity", e.target.value)} inputMode="numeric" placeholder="—" /></FormField>
                <FormField label={`Min. spend (${currencySymbol})`}><TextInput value={draft.minSubtotal} onChange={(e) => set("minSubtotal", e.target.value)} inputMode="decimal" placeholder="—" /></FormField>
                <FormField label="Family size ≥"><TextInput value={draft.minFamilySize} onChange={(e) => set("minFamilySize", e.target.value)} inputMode="numeric" placeholder="—" /></FormField>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <ToggleSwitch checked={draft.autoApply} onChange={(v) => set("autoApply", v)} label="Apply automatically" description="Off: the cashier must enter the coupon code." />
                <ToggleSwitch checked={draft.stackable} onChange={(v) => set("stackable", v)} label="Can combine with other discounts" description="Off: it competes with the others and the better one wins." />
                <ToggleSwitch checked={draft.isActive} onChange={(v) => set("isActive", v)} label="Turned on" />
              </div>
              <div className="space-y-4">
                <FormField label={draft.autoApply ? "Coupon code (optional)" : "Coupon code *"}>
                  <TextInput value={draft.code} upper onChange={(e) => set("code", e.target.value)} placeholder="e.g. WELCOME10" maxLength={40} />
                </FormField>
                <FormField label="Priority" hint="Lower runs first when combining.">
                  <TextInput value={draft.priority} onChange={(e) => set("priority", e.target.value)} inputMode="numeric" />
                </FormField>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Valid from"><TextInput type="date" value={draft.validFrom} onChange={(e) => set("validFrom", e.target.value)} /></FormField>
              <FormField label="Valid until"><TextInput type="date" value={draft.validTo} onChange={(e) => set("validTo", e.target.value)} /></FormField>
            </div>
            <FormField label="Note for staff">
              <TextArea rows={2} value={draft.description} onChange={(e) => set("description", e.target.value)} maxLength={500} />
            </FormField>

            <div className="flex justify-end gap-2 pt-1">
              <GhostButton onClick={close}>Cancel</GhostButton>
              <PrimaryButton onClick={submit} disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create discount"}</PrimaryButton>
            </div>
          </div>
        )}
      </Modal>
    </BillingPage>
  );
}
