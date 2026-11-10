"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bookmark, Plus, Trash2, Truck } from "lucide-react";
import {
  createReceipt,
  fetchDrugs,
  fetchPurchaseOrders,
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
  refName,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

type Line = {
  key: string;
  drugId: string;
  batch: string;
  expiry: string;
  qty: string;
  cost: string;
};
const mkLine = (drugId = "", qty = "", cost = ""): Line => ({
  key: Math.random().toString(36).slice(2),
  drugId,
  batch: "",
  expiry: "",
  qty,
  cost,
});

const DRAFT_COOKIE = "emr_receive_stock_draft";

function NewReceiptInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { dispatch, facilityId, pharmacy, act, currencySymbol } = usePharmacy();
  const { ui, isDark, colors, border } = usePharmacyUI();
  const { suppliers, drugs, purchaseOrders, saving } = pharmacy;

  const [poId, setPoId] = useState(sp.get("po") || "");
  const [supplierId, setSupplierId] = useState("");
  const [invoice, setInvoice] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([mkLine(sp.get("drug") || "")]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchSuppliers({ facilityId }));
    dispatch(fetchDrugs({ facilityId }));
    dispatch(fetchPurchaseOrders({ facilityId }));
  }, [dispatch, facilityId]);

  // Load draft from cookies on mount (if no PO is specified in query params)
  useEffect(() => {
    if (sp.get("po") || sp.get("drug")) return;
    try {
      const match = document.cookie.match(
        new RegExp("(^| )" + DRAFT_COOKIE + "=([^;]+)")
      );
      if (match) {
        const draft = JSON.parse(decodeURIComponent(match[2]));
        if (draft) {
          if (draft.poId) setPoId(draft.poId);
          if (draft.supplierId) setSupplierId(draft.supplierId);
          if (draft.invoice) setInvoice(draft.invoice);
          if (draft.notes) setNotes(draft.notes);
          if (Array.isArray(draft.lines) && draft.lines.length > 0) {
            setLines(draft.lines);
          }
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [sp]);

  const saveDraft = () => {
    const draftData = { poId, supplierId, invoice, notes, lines };
    const expires = new Date(Date.now() + 7 * 864e5).toUTCString();
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${DRAFT_COOKIE}=${encodeURIComponent(
      JSON.stringify(draftData)
    )}; expires=${expires}; path=/; SameSite=Lax${secure}`;
    setSuccessMsg("Draft saved to cookies successfully.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const clearDraft = () => {
    document.cookie = `${DRAFT_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  };

  const openPOs = useMemo(
    () =>
      purchaseOrders.filter(
        (p) => p.status === "ordered" || p.status === "partially_received"
      ),
    [purchaseOrders]
  );

  // choosing a PO sets the supplier and pre-lists outstanding quantities
  useEffect(() => {
    if (!poId) return;
    const po = purchaseOrders.find((p) => p._id === poId);
    if (!po) return;
    setSupplierId(
      typeof po.supplier === "string" ? po.supplier : po.supplier._id
    );
    const outstanding = po.items.filter(
      (i) => i.quantityReceived < i.quantityOrdered
    );
    if (outstanding.length)
      setLines(
        outstanding.map((i) =>
          mkLine(
            i.drug,
            String(i.quantityOrdered - i.quantityReceived),
            String(i.unitCost)
          )
        )
      );
  }, [poId, purchaseOrders]);

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
  const patch = (key: string, c: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...c } : l)));
  const total = lines.reduce(
    (s, l) => s + (Number(l.qty) || 0) * (Number(l.cost) || 0),
    0
  );

  const submit = async () => {
    setError(null);
    if (!supplierId) return setError("Choose the supplier.");
    const items = lines.filter((l) => l.drugId || l.batch || l.qty);
    if (items.length === 0) return setError("Add at least one received item.");
    for (const l of items) {
      if (!l.drugId || !l.batch.trim() || !l.expiry || !(Number(l.qty) > 0))
        return setError(
          "Every line needs a drug, batch number, expiry date and quantity."
        );
      if (new Date(l.expiry) <= new Date())
        return setError(
          "Expired stock cannot be received. Check the expiry dates."
        );
    }
    const res = await act(
      createReceipt({
        facilityId,
        payload: {
          supplierId,
          purchaseOrderId: poId || undefined,
          invoiceNumber: invoice || undefined,
          notes: notes || undefined,
          items: items.map((l) => ({
            drugId: l.drugId,
            batchNumber: l.batch.trim(),
            expiryDate: l.expiry,
            quantity: Math.floor(Number(l.qty)),
            unitCost: l.cost === "" ? undefined : Number(l.cost),
          })),
        },
      })
    );
    if (res) {
      clearDraft();
      router.push("/dashboard/pharmacy/receiving");
    }
  };

  return (
    <PharmacyPage
      narrow
      routes={[
        { label: "Pharmacy", href: "/dashboard/pharmacy" },
        { label: "Goods Received", href: "/dashboard/pharmacy/receiving" },
        { label: "Receive Stock" },
      ]}
      title="Receive Stock"
      description="Record a delivery. Each line becomes a batch, or tops up an existing batch with the same number and expiry."
      icon={Truck}
      actions={
        <GhostButton icon={Bookmark} onClick={saveDraft}>
          Save to draft
        </GhostButton>
      }
    >
      {successMsg && <Alert tone="info">{successMsg}</Alert>}
      <SectionCard title="Delivery details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomDropdown
            label="Against purchase order (optional)"
            value={poId}
            options={[
              { label: "No purchase order", value: "" },
              ...openPOs.map((p) => ({
                label: `${p.poNumber} — ${refName(p.supplier)}`,
                value: p._id,
              })),
            ]}
            onChange={setPoId}
            placeholder="Select purchase order..."
            {...dd}
          />
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
          <FormField label="Invoice / delivery note no.">
            <TextInput
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
              placeholder="e.g. INV-2026-001"
            />
          </FormField>
        </div>
        <FormField label="Notes">
          <TextArea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any delivery notes or comments here..."
          />
        </FormField>
      </SectionCard>

      <SectionCard
        title="Received items"
        right={
          <GhostButton
            icon={Plus}
            onClick={() => setLines((l) => [...l, mkLine()])}
          >
            Add line
          </GhostButton>
        }
      >
        <div className="space-y-3">
          {lines.map((l) => (
            <div
              key={l.key}
              className="rounded-2xl p-4 space-y-3"
              style={{ backgroundColor: ui.inner }}
            >
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <CustomDropdown
                    label="Drug *"
                    value={l.drugId}
                    options={drugOptions}
                    onChange={(v) =>
                      patch(l.key, {
                        drugId: v,
                        cost:
                          l.cost ||
                          String(
                            drugs.find((d) => d._id === v)?.costPrice ?? ""
                          ),
                      })
                    }
                    placeholder="Select drug..."
                    searchable
                    {...dd}
                  />
                </div>
                <button
                  type="button"
                  disabled={lines.length === 1}
                  onClick={() =>
                    setLines((ls) => ls.filter((x) => x.key !== l.key))
                  }
                  className="h-10 w-10 flex items-center justify-center text-rose-500 disabled:opacity-30"
                  title="Remove line"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <FormField label="Batch no. *">
                  <TextInput
                    upper
                    value={l.batch}
                    onChange={(e) => patch(l.key, { batch: e.target.value })}
                    placeholder="e.g. BATCH123"
                    style={{ backgroundColor: ui.card }}
                  />
                </FormField>
                <FormField label="Expiry date *">
                  <CustomPopupDatePicker
                    label=""
                    value={l.expiry}
                    onChange={(v) => patch(l.key, { expiry: v })}
                    placeholder="Select expiry date..."
                    border={border}
                    colors={colors}
                    isDark={isDark}
                  />
                </FormField>
                <FormField label="Quantity *">
                  <TextInput
                    type="number"
                    min={1}
                    value={l.qty}
                    onChange={(e) => patch(l.key, { qty: e.target.value })}
                    placeholder="e.g. 100"
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
              </div>
            </div>
          ))}
        </div>
        <div
          className="flex justify-between items-center pt-3 border-t text-sm"
          style={{ borderColor: ui.border }}
        >
          <span className="opacity-60">Delivery value</span>
          <span className="text-lg font-bold">{money(total)}</span>
        </div>
      </SectionCard>

      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
        <GhostButton onClick={() => router.back()}>Cancel</GhostButton>
        <PrimaryButton icon={Truck} onClick={submit} disabled={saving}>
          {saving ? "Saving..." : "Confirm receipt"}
        </PrimaryButton>
      </div>
    </PharmacyPage>
  );
}

export default function ReceiveStockPage() {
  return (
    <Suspense fallback={null}>
      <NewReceiptInner />
    </Suspense>
  );
}
