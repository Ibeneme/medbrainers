"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Send, ShoppingCart, Trash2 } from "lucide-react";
import {
  createPurchaseOrder,
  fetchDrugs,
  fetchLowStock,
  fetchSuppliers,
} from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import { CustomDropdown, CustomPopupDatePicker } from "@/components/ui/items";
import {
  Alert,
  FormField,
  GhostButton,
  PharmacyPage,
  PrimaryButton,
  SectionCard,
  TextArea,
  TextInput,
  money,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

type Line = { key: string; drugId: string; qty: string; cost: string };
const mkLine = (drugId = "", qty = "", cost = ""): Line => ({
  key: Math.random().toString(36).slice(2),
  drugId,
  qty,
  cost,
});

function NewPOInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { dispatch, facilityId, pharmacy, act, currencySymbol } = usePharmacy();
  const { ui, isDark, colors, border } = usePharmacyUI();
  const { suppliers, drugs, lowStock, saving } = pharmacy;

  const [supplierId, setSupplierId] = useState(sp.get("supplier") || "");
  const [expected, setExpected] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([mkLine()]);
  const [prefilled, setPrefilled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchSuppliers({ facilityId }));
    dispatch(fetchDrugs({ facilityId }));
    if (sp.get("drugs")) dispatch(fetchLowStock({ facilityId }));
  }, [dispatch, facilityId, sp]);

  // prefill from Low Stock selection: ?drugs=id1,id2
  useEffect(() => {
    const ids = sp.get("drugs")?.split(",").filter(Boolean);
    if (prefilled || !ids?.length || !drugs.length || !lowStock.length) return;
    setLines(
      ids.map((id) => {
        const d = drugs.find((x) => x._id === id);
        const row = lowStock.find((x) => x._id === id);
        return mkLine(
          id,
          String(row?.suggestedOrder ?? d?.reorderLevel ?? 1),
          String(d?.costPrice ?? 0)
        );
      })
    );
    setPrefilled(true);
  }, [sp, drugs, lowStock, prefilled]);

  const dd = { isDark, colors, border };
  const drugOptions = useMemo(
    () => [
      { label: "Select drug...", value: "" },
      ...drugs.map((d) => ({
        label: `${d.genericName} ${d.strength || ""} — ${d.code}`.replace(
          /\s+/g,
          " "
        ),
        value: d._id,
      })),
    ],
    [drugs]
  );
  const total = lines.reduce(
    (s, l) => s + (Number(l.qty) || 0) * (Number(l.cost) || 0),
    0
  );
  const patch = (key: string, c: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...c } : l)));

  const pick = (key: string, drugId: string) => {
    const d = drugs.find((x) => x._id === drugId);
    patch(key, { drugId, cost: d ? String(d.costPrice ?? 0) : "" });
  };

  const submit = async (placeOrder: boolean) => {
    setError(null);
    if (!supplierId) return setError("Choose a supplier.");
    const items = lines.filter((l) => l.drugId && Number(l.qty) > 0);
    if (items.length === 0)
      return setError("Add at least one drug with a quantity.");
    if (new Set(items.map((i) => i.drugId)).size !== items.length)
      return setError("Each drug can appear only once per order.");
    const res: any = await act(
      createPurchaseOrder({
        facilityId,
        payload: {
          supplierId,
          items: items.map((l) => ({
            drugId: l.drugId,
            quantity: Math.floor(Number(l.qty)),
            unitCost: Number(l.cost) || 0,
          })),
          expectedDate: expected || undefined,
          notes: notes || undefined,
          placeOrder,
        },
      })
    );
    if (res?._id) router.push(`/dashboard/pharmacy/purchase-orders/${res._id}`);
  };

  return (
    <PharmacyPage
      narrow
      routes={[
        { label: "Pharmacy", href: "/dashboard/pharmacy" },
        {
          label: "Purchase Orders",
          href: "/dashboard/pharmacy/purchase-orders",
        },
        { label: "New" },
      ]}
      title="New Purchase Order"
      description="Save as a draft to review later, or place the order straight away."
      icon={ShoppingCart}
    >
      <SectionCard title="Order details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomDropdown
            label="Supplier *"
            value={supplierId}
            options={[
              { label: "Select supplier...", value: "" },
              ...suppliers.map((s) => ({ label: s.name, value: s._id })),
            ]}
            onChange={setSupplierId}
            placeholder="Select supplier..."
            searchable
            {...dd}
          />
          <FormField label="Expected delivery">
            <CustomPopupDatePicker
              label=""
              value={expected}
              onChange={setExpected}
              placeholder="Select expected delivery date..."
              border={border}
              colors={colors}
              isDark={isDark}
            />
          </FormField>
        </div>
        <FormField label="Notes">
          <TextArea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any order notes or terms here..."
          />
        </FormField>
      </SectionCard>

      <SectionCard
        title="Items"
        right={
          <GhostButton
            icon={Plus}
            onClick={() => setLines((l) => [...l, mkLine()])}
          >
            Add item
          </GhostButton>
        }
      >
        <div className="space-y-3">
          {lines.map((l) => (
            <div
              key={l.key}
              className="rounded-2xl p-3 grid grid-cols-1 sm:grid-cols-[1fr_100px_120px_auto] gap-3 items-end"
              style={{ backgroundColor: ui.inner }}
            >
              <CustomDropdown
                label="Drug"
                value={l.drugId}
                options={drugOptions}
                onChange={(v) => pick(l.key, v)}
                placeholder="Select drug..."
                searchable
                {...dd}
              />
              <FormField label="Quantity">
                <TextInput
                  type="number"
                  min={1}
                  value={l.qty}
                  onChange={(e) => patch(l.key, { qty: e.target.value })}
                  placeholder="1"
                  style={{ backgroundColor: ui.card }}
                />
              </FormField>
              <FormField label={`Unit cost (${currencySymbol})`}>
                <TextInput
                  type="number"
                  min={0}
                  step="0.01"
                  value={l.cost}
                  onChange={(e) => patch(l.key, { cost: e.target.value })}
                  placeholder="0.00"
                  style={{ backgroundColor: ui.card }}
                />
              </FormField>
              <button
                type="button"
                disabled={lines.length === 1}
                onClick={() =>
                  setLines((ls) => ls.filter((x) => x.key !== l.key))
                }
                className="h-10 w-10 flex items-center justify-center text-rose-500 disabled:opacity-30"
                title="Remove item"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <div
          className="flex justify-between items-center pt-3 border-t text-sm"
          style={{ borderColor: ui.border }}
        >
          <span className="opacity-60">Estimated total</span>
          <span className="text-lg font-bold">{money(total)}</span>
        </div>
      </SectionCard>

      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
        <GhostButton disabled={saving} onClick={() => submit(false)}>
          Save as draft
        </GhostButton>
        <PrimaryButton
          icon={Send}
          disabled={saving}
          onClick={() => submit(true)}
        >
          Place order
        </PrimaryButton>
      </div>
    </PharmacyPage>
  );
}

export default function NewPurchaseOrderPage() {
  return (
    <Suspense fallback={null}>
      <NewPOInner />
    </Suspense>
  );
}
