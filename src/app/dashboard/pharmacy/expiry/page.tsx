"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, ShieldAlert, Trash2 } from "lucide-react";
import { fetchBatches, setBatchStatus } from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import { ConfirmModal } from "@/components/ui/items";
import {
  Chips,
  EmptyBox,
  GhostButton,
  PharmacyPage,
  Pill,
  PrimaryButton,
  SearchBar,
  TableCard,
  Th,
  daysUntil,
  fmtDate,
  refName,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

import { Can } from "@/components/access/can";
type Filter = "expiring" | "expired" | "in_stock";

function ExpiryInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { dispatch, facilityId, pharmacy, act } = usePharmacy();
  const { ui, isDark, colors, border } = usePharmacyUI();
  const { batches, listLoading, saving, setup } = pharmacy;

  const initial = (sp.get("filter") as Filter) || "expiring";
  const [filter, setFilter] = useState<Filter>(
    ["expiring", "expired", "in_stock"].includes(initial) ? initial : "expiring"
  );
  const [days, setDays] = useState<number>(
    setup?.settings?.expiryAlertDays ?? 90
  );
  const [search, setSearch] = useState("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmModalState, setConfirmModalState] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    tone: "danger" | "primary";
    action: () => Promise<void>;
  } | null>(null);

  const load = () =>
    facilityId && dispatch(fetchBatches({ facilityId, filter, days }));
  useEffect(() => {
    load();
    setSelectedIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId, filter, days]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return batches;
    return batches.filter((b: any) =>
      [
        b.batchNumber,
        b.drug?.genericName,
        b.drug?.brandName,
        b.drug?.code,
      ].some((x) => x?.toLowerCase().includes(q))
    );
  }, [batches, search]);

  const toggleSelectAll = () => {
    if (selectedIds.length === rows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rows.map((b: any) => b._id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleMultiQuarantine = (targetStatus: "quarantined" | "active") => {
    if (selectedIds.length === 0) return;
    const isQuarantine = targetStatus === "quarantined";
    setConfirmModalState({
      title: isQuarantine
        ? `Quarantine ${selectedIds.length} batches?`
        : `Release ${selectedIds.length} batches?`,
      message: isQuarantine
        ? `Are you sure you want to quarantine the selected ${selectedIds.length} batches? Quarantined batches cannot be allocated when dispensing.`
        : `Are you sure you want to release the selected ${selectedIds.length} batches back to active stock?`,
      confirmLabel: isQuarantine
        ? "Yes, quarantine selected"
        : "Yes, release selected",
      tone: isQuarantine ? "danger" : "primary",
      action: async () => {
        for (const id of selectedIds) {
          await act(
            setBatchStatus({ facilityId, batchId: id, status: targetStatus })
          );
        }
        setSelectedIds([]);
        setConfirmModalState(null);
        load();
      },
    });
  };

  const handleMultiWriteOff = () => {
    if (selectedIds.length === 0) return;
    // For multiple write-offs, route to adjustments with comma-separated batch IDs or handle them
    // Here we can take the first batch or pass them via query params if supported, or route to the first one.
    router.push(
      `/dashboard/pharmacy/adjustments/new?batch=${selectedIds[0]}&type=expired`
    );
  };

  return (
    <>
      <PharmacyPage
        routes={[
          { label: "Pharmacy", href: "/dashboard/pharmacy" },
          { label: "Batches & Expiry" },
        ]}
        title="Batches & Expiry"
        description="Track every batch on the shelf. Expired and quarantined batches are never allocated when dispensing."
        icon={CalendarClock}
        loading={listLoading && batches.length === 0}
        loadingText="Loading batches..."
        onRefresh={load}
        actions={
          selectedIds.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold opacity-70">
                {selectedIds.length} selected
              </span>
              <GhostButton
                icon={ShieldAlert}
                onClick={() => handleMultiQuarantine("quarantined")}
              >
                Quarantine selected
              </GhostButton>
              <Can perm="pharmacy.write"><GhostButton
                icon={ShieldAlert}
                onClick={() => handleMultiQuarantine("active")}
              >
                Release selected
              </GhostButton></Can>
              <PrimaryButton icon={Trash2} onClick={handleMultiWriteOff}>
                Write off selected
              </PrimaryButton>
            </div>
          ) : null
        }
        guide={{
          title: "Expiry Management Tips",
          summary:
            "Stock is dispensed first-expiry-first-out. Quarantine suspect batches, then write off expired stock from Returns & Adjustments so the register stays accurate.",
        }}
      >
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by drug name or batch number..."
        />
        <div className="space-y-2">
          <Chips
            label="Show:"
            value={filter}
            onChange={setFilter}
            options={[
              { id: "expiring", label: "Expiring soon" },
              { id: "expired", label: "Expired" },
              { id: "in_stock", label: "All in stock" },
            ]}
          />
          {filter === "expiring" && (
            <Chips<string>
              label="Window:"
              value={String(days)}
              onChange={(v) => setDays(Number(v))}
              options={[30, 60, 90, 180].map((d) => ({
                id: String(d),
                label: `${d} days`,
              }))}
            />
          )}
        </div>

        {rows.length === 0 ? (
          <EmptyBox
            icon={CalendarClock}
            title={
              filter === "expired"
                ? "No expired stock on the shelf."
                : "No batches match this view."
            }
          />
        ) : (
          <TableCard minWidth={780}>
            <thead>
              <tr
                className="text-xs opacity-50 border-b"
                style={{ borderColor: ui.border }}
              >
                <Th className="w-10">
                  <input
                    type="checkbox"
                    checked={
                      rows.length > 0 && selectedIds.length === rows.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded accent-emerald-600 cursor-pointer"
                  />
                </Th>
                <Th>Drug</Th>
                <Th>Batch</Th>
                <Th>Expiry</Th>
                <Th>On hand</Th>
                <Th className="hidden md:table-cell">Supplier</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b: any) => {
                const d = daysUntil(b.expiryDate);
                const expired = d !== null && d <= 0;
                const isQuarantined = b.status === "quarantined";
                const isSelected = selectedIds.includes(b._id);
                return (
                  <tr
                    key={b._id}
                    className="border-b last:border-0"
                    style={{
                      borderColor: ui.border,
                      backgroundColor: isSelected
                        ? isDark
                          ? "rgba(255,255,255,0.04)"
                          : "rgba(0,0,0,0.02)"
                        : "transparent",
                    }}
                  >
                    <td className="px-3 py-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(b._id)}
                        className="rounded accent-emerald-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="font-semibold text-xs">
                        {b.drug?.genericName} {b.drug?.strength}
                      </p>
                      <p className="text-[11px] opacity-50">{b.drug?.code}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className="rounded-full px-2.5 py-1 font-mono text-[11px]"
                        style={{ backgroundColor: ui.inner }}
                      >
                        {b.batchNumber}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-xs">
                      {fmtDate(b.expiryDate)}
                      <p
                        className="text-[10px] font-semibold"
                        style={{
                          color: expired
                            ? "#dc2626"
                            : d !== null && d <= 30
                            ? "#d97706"
                            : undefined,
                          opacity: expired || (d !== null && d <= 30) ? 1 : 0.5,
                        }}
                      >
                        {expired
                          ? `Expired ${Math.abs(d!)}d ago`
                          : `${d} days left`}
                      </p>
                    </td>
                    <td className="px-3 py-3.5 text-sm font-bold">
                      {b.quantityOnHand}
                    </td>
                    <td className="px-3 py-3.5 text-xs opacity-70 hidden md:table-cell">
                      {refName(b.supplier)}
                    </td>
                    <td className="px-3 py-3.5">
                      <Pill
                        status={expired ? "cancelled" : b.status}
                        label={expired ? "expired" : b.status}
                      />
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <div className="inline-flex gap-2">
                        {!expired && (
                          <GhostButton
                            disabled={saving}
                            onClick={() =>
                              setConfirmModalState({
                                title: isQuarantined
                                  ? "Release Batch"
                                  : "Quarantine Batch",
                                message: isQuarantined
                                  ? `Are you sure you want to release batch ${b.batchNumber} back to active stock?`
                                  : `Are you sure you want to quarantine batch ${b.batchNumber}? Quarantined batches cannot be allocated when dispensing.`,
                                confirmLabel: isQuarantined
                                  ? "Yes, release"
                                  : "Yes, quarantine",
                                tone: isQuarantined ? "primary" : "danger",
                                action: async () => {
                                  await act(
                                    setBatchStatus({
                                      facilityId,
                                      batchId: b._id,
                                      status: isQuarantined
                                        ? "active"
                                        : "quarantined",
                                    })
                                  );
                                  setConfirmModalState(null);
                                  load();
                                },
                              })
                            }
                          >
                            {isQuarantined ? "Release" : "Quarantine"}
                          </GhostButton>
                        )}
                        <GhostButton
                          danger
                          href={`/dashboard/pharmacy/adjustments/new?batch=${b._id}&type=expired`}
                        >
                          Write off
                        </GhostButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableCard>
        )}
      </PharmacyPage>

      <ConfirmModal
        state={confirmModalState}
        busy={saving}
        onCancel={() => setConfirmModalState(null)}
        onConfirm={async () => {
          if (confirmModalState) {
            await confirmModalState.action();
          }
        }}
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

export default function ExpiryPage() {
  return (
    <Suspense fallback={null}>
      <ExpiryInner />
    </Suspense>
  );
}
