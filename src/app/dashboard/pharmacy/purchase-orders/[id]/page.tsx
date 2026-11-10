"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  CalendarDays,
  Package,
  Send,
  ShoppingCart,
  Truck,
  Wallet,
  XCircle,
} from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import { fetchPurchaseOrderById, setPurchaseOrderStatus } from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import { ConfirmModal, type ConfirmState } from "@/components/ui/items";
import {
  Alert,
  GhostButton,
  PharmacyPage,
  Pill,
  PrimaryButton,
  SectionCard,
  StatCard,
  TableCard,
  Th,
  fmtDate,
  fmtDateTime,
  money,
  personName,
  refName,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

function DetailRow({
  label,
  children,
  ui,
}: {
  label: string;
  children: React.ReactNode;
  ui: { border: string };
}) {
  return (
    <div
      className="flex items-start justify-between gap-4 border-b py-2.5 text-xs last:border-0"
      style={{ borderColor: ui.border }}
    >
      <span className="opacity-50">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}

const linePct = (received: number, ordered: number) =>
  ordered > 0 ? Math.min(100, Math.round((received / ordered) * 100)) : 0;

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const id = String(
    Array.isArray(params?.id) ? params.id[0] : params?.id || ""
  );
  const { dispatch, facilityId, pharmacy, act } = usePharmacy();
  const { ui } = usePharmacyUI();
  const { activePurchaseOrder: po, detailLoading, saving } = pharmacy;
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const load = () =>
    facilityId && id && dispatch(fetchPurchaseOrderById({ facilityId, id }));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId, id]);

  const totals = useMemo(() => {
    const items = po?.items ?? [];
    const ordered = items.reduce((s, i) => s + i.quantityOrdered, 0);
    const received = items.reduce((s, i) => s + i.quantityReceived, 0);
    return {
      lines: items.length,
      ordered,
      received,
      pct:
        ordered > 0 ? Math.min(100, Math.round((received / ordered) * 100)) : 0,
    };
  }, [po]);

  if (!po || po._id !== id) {
    return (
      <PharmacyPage
        routes={[
          { label: "Pharmacy", href: "/dashboard/pharmacy" },
          {
            label: "Purchase Orders",
            href: "/dashboard/pharmacy/purchase-orders",
          },
          { label: "Order" },
        ]}
        title="Purchase Order"
        icon={ShoppingCart}
        loading={detailLoading}
      >
        {!detailLoading && (
          <Alert tone="danger">Purchase order not found.</Alert>
        )}
      </PharmacyPage>
    );
  }

  const canReceive =
    po.status === "ordered" || po.status === "partially_received";
  const change = (status: "ordered" | "cancelled") =>
    setConfirm({
      title: status === "ordered" ? "Place order" : "Cancel order",
      message:
        status === "ordered"
          ? `Mark ${po.poNumber} as placed with ${refName(po.supplier)}?`
          : `Cancel ${po.poNumber}? This cannot be undone.`,
      confirmLabel: status === "ordered" ? "Place order" : "Cancel order",
      tone: status === "ordered" ? "primary" : "danger",
      onConfirm: async () => {
        await act(setPurchaseOrderStatus({ facilityId, id: po._id, status }));
        setConfirm(null);
      },
    });

  return (
    <PharmacyPage
      routes={[
        { label: "Pharmacy", href: "/dashboard/pharmacy" },
        {
          label: "Purchase Orders",
          href: "/dashboard/pharmacy/purchase-orders",
        },
        { label: po.poNumber },
      ]}
      title={`Purchase Order ${po.poNumber}`}
      description={`${refName(po.supplier)} · created ${fmtDateTime(
        po.createdAt
      )}${po.orderedBy ? ` by ${personName(po.orderedBy)}` : ""}`}
      icon={ShoppingCart}
      loading={detailLoading}
      onRefresh={load}
      actions={
        <>
          <Pill status={po.status} />
          {po.status === "draft" && (
            <PrimaryButton icon={Send} onClick={() => change("ordered")}>
              Place order
            </PrimaryButton>
          )}
          {canReceive && (
            <PrimaryButton
              icon={Truck}
              href={`/dashboard/pharmacy/receiving/new?po=${po._id}`}
            >
              Receive stock
            </PrimaryButton>
          )}
          {(po.status === "draft" || po.status === "ordered") && (
            <GhostButton
              danger
              icon={XCircle}
              onClick={() => change("cancelled")}
            >
              Cancel
            </GhostButton>
          )}
        </>
      }
    >
      {/* ─── Summary strip ─────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Order total"
          value={money(po.totalCost)}
          color={PRIMARY_COLOR}
        />
        <StatCard
          icon={Package}
          label="Line items"
          value={totals.lines}
          color={PRIMARY_COLOR}
        />
        <StatCard
          icon={Truck}
          label="Received"
          value={`${totals.pct}%`}
          color={PRIMARY_COLOR}
        />
        <StatCard
          icon={CalendarDays}
          label="Expected"
          value={po.expectedDate ? fmtDate(po.expectedDate) : "—"}
          color={PRIMARY_COLOR}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        {/* ─── Items table ─────────────────────────────── */}
        <div className="space-y-2">
          <h3 className="px-1 text-sm font-semibold">Items</h3>
          {/* Table: tablet and up */}
          <div className="hidden md:block">
            <TableCard minWidth={560}>
              <thead>
                <tr
                  className="border-b text-xs opacity-50"
                  style={{ borderColor: ui.border }}
                >
                  <Th>Drug</Th>
                  <Th>Received</Th>
                  <Th>Unit cost</Th>
                  <Th className="text-right">Line total</Th>
                </tr>
              </thead>
              <tbody>
                {po.items.map((i, idx) => {
                  const pct = linePct(i.quantityReceived, i.quantityOrdered);
                  return (
                    <tr
                      key={i._id || idx}
                      className="border-b last:border-0"
                      style={{ borderColor: ui.border }}
                    >
                      <td className="px-3 py-3.5 text-xs font-semibold">
                        {i.drugName}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full"
                            style={{ backgroundColor: ui.border }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: PRIMARY_COLOR,
                              }}
                            />
                          </div>
                          <span className="whitespace-nowrap text-[11px] opacity-70">
                            {i.quantityReceived}/{i.quantityOrdered}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-xs opacity-70">
                        {money(i.unitCost)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-right text-xs font-semibold">
                        {money(i.quantityOrdered * i.unitCost)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr
                  className="border-t"
                  style={{ borderColor: ui.border, backgroundColor: ui.inner }}
                >
                  <td className="px-3 py-3.5 text-xs opacity-60" colSpan={3}>
                    Total · {totals.received}/{totals.ordered} units received
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-right text-sm font-bold">
                    {money(po.totalCost)}
                  </td>
                </tr>
              </tfoot>
            </TableCard>
          </div>

          {/* Cards: phones */}
          <div className="space-y-2 md:hidden">
            {po.items.map((i, idx) => {
              const pct = linePct(i.quantityReceived, i.quantityOrdered);
              return (
                <div
                  key={i._id || idx}
                  className="space-y-2.5 rounded-2xl border p-4"
                  style={{ backgroundColor: ui.card, borderColor: ui.border }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 break-words text-sm font-semibold">
                      {i.drugName}
                    </p>
                    <p className="shrink-0 text-sm font-semibold">
                      {money(i.quantityOrdered * i.unitCost)}
                    </p>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full"
                    style={{ backgroundColor: ui.border }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: PRIMARY_COLOR,
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] opacity-60">
                    <span>
                      {i.quantityReceived}/{i.quantityOrdered} received
                    </span>
                    <span>{money(i.unitCost)} each</span>
                  </div>
                </div>
              );
            })}
            <div
              className="flex items-center justify-between gap-3 rounded-2xl p-4"
              style={{ backgroundColor: ui.inner }}
            >
              <span className="text-xs opacity-60">
                Total · {totals.received}/{totals.ordered} received
              </span>
              <span className="text-base font-bold">{money(po.totalCost)}</span>
            </div>
          </div>
        </div>

        {/* ─── Order details ───────────────────────────── */}
        <div className="space-y-4">
          <SectionCard title="Order details">
            <div>
              <DetailRow label="PO number" ui={ui}>
                {po.poNumber}
              </DetailRow>
              <DetailRow label="Supplier" ui={ui}>
                {refName(po.supplier)}
              </DetailRow>
              <DetailRow label="Status" ui={ui}>
                <Pill status={po.status} />
              </DetailRow>
              <DetailRow label="Created" ui={ui}>
                {fmtDateTime(po.createdAt)}
              </DetailRow>
              {po.orderedBy && (
                <DetailRow label="Ordered by" ui={ui}>
                  {personName(po.orderedBy)}
                </DetailRow>
              )}
              <DetailRow label="Expected" ui={ui}>
                {po.expectedDate ? fmtDate(po.expectedDate) : "—"}
              </DetailRow>
            </div>
          </SectionCard>

          {po.notes && (
            <SectionCard title="Notes">
              <p className="text-xs leading-relaxed opacity-70">{po.notes}</p>
            </SectionCard>
          )}
        </div>
      </div>

      <ConfirmModal
        state={confirm}
        busy={saving}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm()}
        ui={ui}
      />
    </PharmacyPage>
  );
}
