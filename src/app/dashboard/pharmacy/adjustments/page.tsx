"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createStockAdjustment,
  fetchAdjustments,
  fetchBatches,
  fetchSuppliers,
  type AdjustmentType,
} from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import { CustomDropdown } from "@/components/ui/items";
import {
  Alert,
  EmptyBox,
  FormField,
  GhostButton,
  PharmacyPage,
  PrimaryButton,
  SearchBar,
  TableCard,
  TextArea,
  TextInput,
  Th,
  fmtDate,
  fmtDateTime,
  personName,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

import { Can } from "@/components/access/can";
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

export default function AdjustmentsPage() {
  const router = useRouter();
  const { dispatch, facilityId, pharmacy, act } = usePharmacy();
  const { ui } = usePharmacyUI();
  const { adjustments, listLoading } = pharmacy;

  const [search, setSearch] = useState("");

  const load = () => {
    if (!facilityId) return;
    dispatch(fetchAdjustments({ facilityId }));
    dispatch(fetchBatches({ facilityId, filter: "in_stock" }));
    dispatch(fetchSuppliers({ facilityId }));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return adjustments.filter(
      (a) =>
        !q ||
        a.drugName?.toLowerCase().includes(q) ||
        a.batchNumber?.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q)
    );
  }, [adjustments, search]);

  return (
    <PharmacyPage
      routes={[
        { label: "Pharmacy", href: "/dashboard/pharmacy" },
        { label: "Returns & Adjustments" },
      ]}
      title="Returns & Adjustments"
      description="Write off damaged or expired stock, return items to suppliers, take patient returns and correct stock counts."
      icon={Undo2}
      loading={listLoading && adjustments.length === 0}
      loadingText="Loading adjustments..."
      onRefresh={load}
      actions={
        <Can path={"/dashboard/pharmacy/adjustments/new"}><PrimaryButton
          icon={Plus}
          onClick={() => router.push("/dashboard/pharmacy/adjustments/new")}
        >
          New Adjustment
        </PrimaryButton></Can>
      }
      guide={{
        title: "Adjustment Guide",
        summary:
          "Every adjustment is tied to a specific batch and recorded with who made it and why. Adjustments to controlled drugs are also written to the controlled-substances register.",
      }}
    >
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by drug, batch or reason..."
      />
      {rows.length === 0 ? (
        <EmptyBox
          icon={Undo2}
          title="No adjustments recorded."
          action={
            <Can path={"/dashboard/pharmacy/adjustments/new"}><PrimaryButton
              icon={Plus}
              onClick={() => router.push("/dashboard/pharmacy/adjustments/new")}
            >
              Record your first adjustment
            </PrimaryButton></Can>
          }
        />
      ) : (
        <TableCard minWidth={760}>
          <thead>
            <tr
              className="text-xs opacity-50 border-b"
              style={{ borderColor: ui.border }}
            >
              <Th>Drug / batch</Th>
              <Th>Type</Th>
              <Th>Change</Th>
              <Th className="hidden md:table-cell">Reason</Th>
              <Th className="hidden sm:table-cell">By</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr
                key={a._id}
                className="border-b last:border-0"
                style={{ borderColor: ui.border }}
              >
                <td className="px-3 py-3.5">
                  <p className="font-semibold text-xs">{a.drugName}</p>
                  <p className="text-[11px] opacity-50 font-mono">
                    {a.batchNumber}
                  </p>
                </td>
                <td className="px-3 py-3.5 text-xs capitalize">
                  {a.type.replace(/_/g, " ")}
                </td>
                <td
                  className="px-3 py-3.5 text-sm font-bold"
                  style={{
                    color: a.quantityChange > 0 ? "#059669" : "#dc2626",
                  }}
                >
                  {a.quantityChange > 0 ? "+" : ""}
                  {a.quantityChange}
                </td>
                <td className="px-3 py-3.5 text-xs opacity-70 hidden md:table-cell max-w-[260px]">
                  {a.reason}
                </td>
                <td className="px-3 py-3.5 text-xs opacity-60 hidden sm:table-cell">
                  {personName(a.by)}
                  <p>{fmtDateTime(a.at)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
    </PharmacyPage>
  );
}
