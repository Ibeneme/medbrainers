"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, CreditCard, Edit3, Mail, Phone, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  fetchSuppliers,
  updateSupplier,
  type PharmacySupplier,
} from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import { Modal } from "@/components/ui/items";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  EmptyBox,
  GhostButton,
  PharmacyPage,
  PrimaryButton,
  SearchBar,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

const getInitials = (name?: string) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function StatTile({
  label,
  value,
  accent,
  ui,
}: {
  label: string;
  value: number;
  accent?: boolean;
  ui: { card: string; border: string };
}) {
  return (
    <div
      className="rounded-2xl border px-4 py-3"
      style={{ backgroundColor: ui.card, borderColor: ui.border }}
    >
      <p className="text-[11px] uppercase tracking-wider opacity-50">{label}</p>
      <p
        className="mt-0.5 text-2xl font-semibold tracking-tight"
        style={accent ? { color: PRIMARY_COLOR } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

export default function SuppliersPage() {
  const router = useRouter();
  const { dispatch, facilityId, pharmacy, act } = usePharmacy();
  const { ui } = usePharmacyUI();
  const { suppliers, listLoading, saving } = pharmacy;

  const [search, setSearch] = useState("");
  const [confirmSupplier, setConfirmSupplier] =
    useState<PharmacySupplier | null>(null);

  const load = () =>
    facilityId &&
    dispatch(fetchSuppliers({ facilityId, includeInactive: true }));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return suppliers.filter(
      (s) =>
        !q ||
        [s.name, s.contactPerson, s.phone, s.email].some((x) =>
          x?.toLowerCase().includes(q)
        )
    );
  }, [suppliers, search]);

  const stats = useMemo(() => {
    const active = suppliers.filter((s) => s.isActive).length;
    return {
      total: suppliers.length,
      active,
      inactive: suppliers.length - active,
    };
  }, [suppliers]);

  const handleEdit = (s: PharmacySupplier) => {
    router.push(`/dashboard/pharmacy/suppliers/edit?id=${s._id}`);
  };

  const handleToggleStatus = async () => {
    if (!confirmSupplier) return;
    const res = await act(
      updateSupplier({
        facilityId,
        supplierId: confirmSupplier._id,
        payload: { isActive: !confirmSupplier.isActive },
      })
    );
    if (res) {
      setConfirmSupplier(null);
    }
  };

  return (
    <PharmacyPage
      routes={[
        { label: "Pharmacy", href: "/dashboard/pharmacy" },
        { label: "Suppliers" },
      ]}
      title="Suppliers"
      description="Vendors you raise purchase orders against and receive stock from."
      icon={Building2}
      loading={listLoading && suppliers.length === 0}
      loadingText="Loading suppliers..."
      onRefresh={load}
      actions={
        <PrimaryButton
          icon={Plus}
          onClick={() => router.push("/dashboard/pharmacy/suppliers/new")}
        >
          Add Supplier
        </PrimaryButton>
      }
    >
      {/* ─── Summary strip ─────────────────────────────── */}
      {suppliers.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Total" value={stats.total} ui={ui} />
          <StatTile label="Active" value={stats.active} accent ui={ui} />
          <StatTile label="Inactive" value={stats.inactive} ui={ui} />
        </div>
      )}

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search suppliers by name, contact, phone or email..."
      />

      {rows.length === 0 ? (
        <EmptyBox
          icon={Building2}
          title="No suppliers yet."
          action={
            <PrimaryButton
              icon={Plus}
              onClick={() => router.push("/dashboard/pharmacy/suppliers/new")}
            >
              Add your first supplier
            </PrimaryButton>
          }
        />
      ) : (
        /* ─── Supplier rows ───────────────────────────── */
        <div className="space-y-3">
          {rows.map((s) => (
            <div
              key={s._id}
              className="grid gap-4 rounded-2xl border p-4 sm:p-5 transition-shadow hover:shadow-md lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.3fr)_auto] lg:items-center"
              style={{
                backgroundColor: ui.card,
                borderColor: ui.border,
                opacity: s.isActive ? 1 : 0.6,
              }}
            >
              {/* Identity */}
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                  style={{
                    backgroundColor: `${PRIMARY_COLOR}1F`,
                    color: PRIMARY_COLOR,
                  }}
                >
                  {getInitials(s.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate text-sm font-semibold">{s.name}</h4>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={
                        s.isActive
                          ? {
                              backgroundColor: `${PRIMARY_COLOR}1F`,
                              color: PRIMARY_COLOR,
                            }
                          : {
                              backgroundColor: "rgba(128,128,128,0.18)",
                            }
                      }
                    >
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="truncate text-xs opacity-60">
                    {s.contactPerson || "No contact person"}
                  </p>
                </div>
              </div>

              {/* Contact details */}
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs opacity-75">
                {s.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={12} /> {s.phone}
                  </span>
                )}
                {s.email && (
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Mail size={12} className="shrink-0" />
                    <span className="truncate">{s.email}</span>
                  </span>
                )}
                {s.paymentTerms && (
                  <span className="flex items-center gap-1.5">
                    <CreditCard size={12} /> {s.paymentTerms}
                  </span>
                )}
                {!s.phone && !s.email && !s.paymentTerms && (
                  <span className="opacity-60">No contact details</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 lg:justify-end">
                <GhostButton
                  href={`/dashboard/pharmacy/purchase-orders/new?supplier=${s._id}`}
                >
                  New PO
                </GhostButton>
                <GhostButton
                  danger={s.isActive}
                  onClick={() => setConfirmSupplier(s)}
                >
                  {s.isActive ? "Deactivate" : "Reactivate"}
                </GhostButton>
                <button
                  type="button"
                  onClick={() => handleEdit(s)}
                  className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-black/5 dark:hover:bg-white/10 lg:ml-0"
                  style={{ borderColor: ui.border }}
                  title="Edit supplier"
                  aria-label="Edit supplier"
                >
                  <Edit3 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!confirmSupplier}
        onClose={() => setConfirmSupplier(null)}
        title={
          confirmSupplier?.isActive
            ? "Deactivate Supplier"
            : "Reactivate Supplier"
        }
        ui={ui}
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm opacity-80">
            Are you sure you want to{" "}
            {confirmSupplier?.isActive ? "deactivate" : "reactivate"}{" "}
            <strong>{confirmSupplier?.name}</strong>?
            {confirmSupplier?.isActive
              ? " Deactivated suppliers won't appear as active options for new purchase orders."
              : ""}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <GhostButton onClick={() => setConfirmSupplier(null)}>
              Cancel
            </GhostButton>
            <PrimaryButton
              type="button"
              disabled={saving}
              onClick={handleToggleStatus}
            >
              {saving
                ? "Processing..."
                : confirmSupplier?.isActive
                ? "Yes, deactivate"
                : "Yes, reactivate"}
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </PharmacyPage>
  );
}
