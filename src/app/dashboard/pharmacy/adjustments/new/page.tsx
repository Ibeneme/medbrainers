"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Save, Undo2 } from "lucide-react";
import {
  createStockAdjustment,
  fetchBatches,
  fetchSuppliers,
  type AdjustmentType,
} from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import { ConfirmModal, CustomDropdown } from "@/components/ui/items";
import {
  Alert,
  FormField,
  GhostButton,
  PharmacyPage,
  PrimaryButton,
  SectionCard,
  TextArea,
  TextInput,
  fmtDate,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

const TYPES: Array<{ value: AdjustmentType; label: string; sign: 1 | -1 }> = [
  { value: "damaged", label: "Damaged", sign: -1 },
  { value: "expired", label: "Expired – write off", sign: -1 },
  { value: "theft_loss", label: "Theft / loss", sign: -1 },
  { value: "return_to_supplier", label: "Return to supplier", sign: -1 },
  {
    value: "correction_out",
    label: "Stock count correction (decrease)",
    sign: -1,
  },
  { value: "patient_return", label: "Patient return (back to stock)", sign: 1 },
  {
    value: "correction_in",
    label: "Stock count correction (increase)",
    sign: 1,
  },
  { value: "other", label: "Other (decrease)", sign: -1 },
];

function NewAdjustmentInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { dispatch, facilityId, pharmacy, act } = usePharmacy();
  const { ui, isDark, colors, border } = usePharmacyUI();
  const { batches, suppliers, saving } = pharmacy;

  const [batchId, setBatchId] = useState(sp.get("batch") || "");
  const [type, setType] = useState<AdjustmentType>(
    (sp.get("type") as AdjustmentType) || "damaged"
  );
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [witness, setWitness] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchBatches({ facilityId, filter: "in_stock" }));
    dispatch(fetchSuppliers({ facilityId }));
  }, [dispatch, facilityId]);

  const batchOptions = useMemo(() => {
    const drugFilter = sp.get("drug");
    return batches
      .filter(
        (b: any) =>
          !drugFilter ||
          (typeof b.drug === "string" ? b.drug : b.drug?._id) === drugFilter ||
          b._id === batchId
      )
      .map((b: any) => ({
        value: b._id,
        label: `${b.drug?.genericName || "Drug"} ${b.drug?.strength || ""} — ${
          b.batchNumber
        } (${b.quantityOnHand} on hand, exp ${fmtDate(b.expiryDate)})`.replace(
          /\s+/g,
          " "
        ),
      }));
  }, [batches, sp, batchId]);

  const selected: any = batches.find((b: any) => b._id === batchId);
  const meta = TYPES.find((t) => t.value === type)!;
  const controlled = !!selected?.drug?.isControlled;
  const dd = { isDark, colors, border };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!batchId) return setError("Please select a batch.");
    if (!qty || Number(qty) <= 0)
      return setError("Please enter a valid quantity.");
    if (!reason || reason.trim().length < 3)
      return setError("Please provide a reason (at least 3 characters).");
    if (meta.sign < 0 && selected && Number(qty) > selected.quantityOnHand) {
      return setError(
        `Cannot remove ${qty} units. Only ${selected.quantityOnHand} available on hand.`
      );
    }
    setShowConfirm(true);
  };

  const executeAdjustment = async () => {
    const res = await act(
      createStockAdjustment({
        facilityId,
        payload: {
          batchId,
          type,
          quantity: Math.floor(Number(qty)),
          reason,
          supplierId:
            type === "return_to_supplier" && supplierId
              ? supplierId
              : undefined,
          witness: controlled && witness ? witness : undefined,
        },
      })
    );
    if (res) {
      router.push("/dashboard/pharmacy/adjustments");
    }
  };

  return (
    <>
      <PharmacyPage
        narrow
        routes={[
          { label: "Pharmacy", href: "/dashboard/pharmacy" },
          {
            label: "Returns & Adjustments",
            href: "/dashboard/pharmacy/adjustments",
          },
          { label: "New Adjustment" },
        ]}
        title="New Stock Adjustment"
        description="Record a stock write-off, count correction, or supplier/patient return tied to a specific batch."
        icon={Undo2}
      >
        <form onSubmit={handleFormSubmit} className="space-y-5">
          <SectionCard title="Adjustment details">
            <div className="space-y-4">
              <CustomDropdown
                label="Batch *"
                value={batchId}
                options={[
                  { label: "Select batch...", value: "" },
                  ...batchOptions,
                ]}
                onChange={setBatchId}
                placeholder="Select batch..."
                searchable
                {...dd}
              />
              <CustomDropdown
                label="Type *"
                value={type}
                options={TYPES.map((t) => ({ label: t.label, value: t.value }))}
                onChange={(v) => setType(v as AdjustmentType)}
                placeholder="Select adjustment type..."
                {...dd}
              />
              {type === "return_to_supplier" && (
                <CustomDropdown
                  label="Supplier"
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
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label={`Quantity to ${meta.sign > 0 ? "add" : "remove"} *`}
                  hint={
                    selected
                      ? `${selected.quantityOnHand} currently on hand in this batch.`
                      : undefined
                  }
                >
                  <TextInput
                    required
                    type="number"
                    min={1}
                    max={
                      meta.sign < 0 && selected
                        ? selected.quantityOnHand
                        : undefined
                    }
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="e.g. 5"
                  />
                </FormField>
              </div>
              <FormField label="Reason *">
                <TextArea
                  rows={3}
                  required
                  minLength={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe why this adjustment is being made..."
                />
              </FormField>
            </div>
          </SectionCard>

          {controlled && (
            <SectionCard title="Controlled Substance Verification">
              <div className="space-y-3">
                <Alert tone="warning">
                  Controlled substance — this will be entered in the
                  controlled-substances register.
                </Alert>
                <FormField label="Witness *">
                  <TextInput
                    required
                    value={witness}
                    onChange={(e) => setWitness(e.target.value)}
                    placeholder="Name of verifying witness staff member"
                  />
                </FormField>
              </div>
            </SectionCard>
          )}

          {error && <Alert tone="danger">{error}</Alert>}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <GhostButton href="/dashboard/pharmacy/adjustments">
              Cancel
            </GhostButton>
            <PrimaryButton
              type="submit"
              disabled={saving || !batchId || !qty || reason.trim().length < 3}
              icon={Save}
            >
              Record adjustment
            </PrimaryButton>
          </div>
        </form>
      </PharmacyPage>

      <ConfirmModal
        state={
          showConfirm
            ? {
                title: "Confirm Stock Adjustment",
                message:
                  "Are you sure you want to record this adjustment? This action is permanent and cannot be undone once submitted.",
                confirmLabel: "Yes, record adjustment",
                tone: "danger",
                onConfirm: async () => executeAdjustment(),
              }
            : null
        }
        busy={saving}
        onCancel={() => setShowConfirm(false)}
        onConfirm={executeAdjustment}
        ui={{
          isDark,
          page: colors.shadeBgSecond,
          card: colors.bg,
          inner: colors.shadeBgSecond,
          text: colors.text,
          border,
        }}
      />
    </>
  );
}

export default function NewAdjustmentPage() {
  return (
    <Suspense fallback={null}>
      <NewAdjustmentInner />
    </Suspense>
  );
}
