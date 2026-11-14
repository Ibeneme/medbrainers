"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  Edit3,
  Pill,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import { fetchDrugs, updateDrug, type PharmacyDrug } from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import { ConfirmModal, Modal, type ConfirmState } from "@/components/ui/items";
import {
  Chips,
  EmptyBox,
  GhostButton,
  PharmacyPage,
  PrimaryButton,
  SearchBar,
  StatCard,
  TableCard,
  Th,
  money,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

import { Can } from "@/components/access/can";
const NEUTRAL_CHIP = "rgba(128,128,128,0.18)";

export default function DrugCatalogPage() {
  const router = useRouter();
  const { dispatch, facilityId, pharmacy, act } = usePharmacy();
  const { ui } = usePharmacyUI();
  const { drugs, listLoading, saving } = pharmacy;

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [show, setShow] = useState<"active" | "all">("active");
  const [detail, setDetail] = useState<PharmacyDrug | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = () =>
    facilityId && dispatch(fetchDrugs({ facilityId, includeInactive: true }));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  const categories = useMemo(
    () => Array.from(new Set(drugs.map((d) => d.category))).sort(),
    [drugs]
  );

  const counts = useMemo(
    () => ({
      all: drugs.length,
      active: drugs.filter((d) => d.isActive).length,
      controlled: drugs.filter((d) => d.isControlled).length,
      otc: drugs.filter((d) => !d.requiresPrescription).length,
    }),
    [drugs]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return drugs.filter((d) => {
      if (show === "active" && !d.isActive) return false;
      if (category !== "all" && d.category !== category) return false;
      if (!q) return true;
      return [d.genericName, d.brandName, d.code, d.category].some((x) =>
        x?.toLowerCase().includes(q)
      );
    });
  }, [drugs, search, category, show]);

  // ─── Bulk selection (only ever acts on drugs currently visible) ───
  const visibleSelected = useMemo(
    () => filtered.filter((d) => selected.has(d._id)),
    [filtered, selected]
  );
  const selectedActive = visibleSelected.filter((d) => d.isActive);
  const selectedInactive = visibleSelected.filter((d) => !d.isActive);
  const allSelected =
    filtered.length > 0 && visibleSelected.length === filtered.length;

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSelectAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) filtered.forEach((d) => next.delete(d._id));
      else filtered.forEach((d) => next.add(d._id));
      return next;
    });

  const previewNames = (list: PharmacyDrug[]) => {
    const names = list.slice(0, 5).map((d) => d.genericName);
    const extra = list.length - names.length;
    return names.join(", ") + (extra > 0 ? ` and ${extra} more` : "");
  };

  const confirmBulk = (targets: PharmacyDrug[], makeActive: boolean) => {
    if (targets.length === 0) return;
    const n = targets.length;
    const plural = n === 1 ? "drug" : "drugs";
    const controlled = targets.filter((d) => d.isControlled).length;
    const controlledNote =
      !makeActive && controlled > 0
        ? ` ${controlled} of them ${
            controlled === 1 ? "is a" : "are"
          } controlled drug${controlled === 1 ? "" : "s"}.`
        : "";

    setConfirm({
      title: makeActive
        ? `Reactivate ${n} ${plural}`
        : `Deactivate ${n} ${plural}`,
      message: makeActive
        ? `${previewNames(
            targets
          )} will be available for prescribing and dispensing again.`
        : `${previewNames(
            targets
          )} will no longer be available for new prescriptions. Stock and history are kept.${controlledNote}`,
      confirmLabel: makeActive ? `Reactivate ${n}` : `Deactivate ${n}`,
      tone: makeActive ? "primary" : "danger",
      onConfirm: async () => {
        setBulkBusy(true);
        const failed = new Set<string>();
        for (const d of targets) {
          try {
            const res = await act(
              updateDrug({
                facilityId,
                drugId: d._id,
                payload: { isActive: makeActive },
              })
            );
            if (!res) failed.add(d._id);
          } catch {
            failed.add(d._id);
          }
        }
        setBulkBusy(false);
        // keep only the ones that failed selected so they can be retried
        setSelected(failed);
        setConfirm(null);
      },
    });
  };

  const toggleActive = (d: PharmacyDrug) =>
    setConfirm({
      title: d.isActive ? "Deactivate drug" : "Reactivate drug",
      message: d.isActive
        ? `${d.genericName} will no longer be available for new prescriptions. Stock and history are kept.`
        : `${d.genericName} will be available for prescribing and dispensing again.`,
      confirmLabel: d.isActive ? "Deactivate" : "Reactivate",
      tone: d.isActive ? "danger" : "primary",
      onConfirm: async () => {
        await act(
          updateDrug({
            facilityId,
            drugId: d._id,
            payload: { isActive: !d.isActive },
          })
        );
        setConfirm(null);
        setDetail(null);
      },
    });

  return (
    <PharmacyPage
      routes={[
        { label: "Pharmacy", href: "/dashboard/pharmacy" },
        { label: "Drug Catalog & Pricing" },
      ]}
      title="Drug Catalog & Pricing"
      description={`${drugs.length} drugs in the formulary. Manage prices, reorder levels and controlled-drug flags.`}
      icon={BookOpen}
      loading={listLoading && drugs.length === 0}
      loadingText="Loading drug catalog..."
      onRefresh={load}
      actions={
        <PrimaryButton href="/dashboard/pharmacy/catalog/new" icon={Plus}>
          Add Drug
        </PrimaryButton>
      }
      guide={{
        title: "Catalog Management Guide & Tips",
        summary:
          "Search by generic name, brand, code or category. Deactivate retired drugs instead of deleting so past prescriptions keep working.",
      }}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={BookOpen}
          label="Drugs in formulary"
          value={counts.all}
          color={PRIMARY_COLOR}
        />
        <StatCard
          icon={CheckCircle2}
          label="Active"
          value={counts.active}
          color={PRIMARY_COLOR}
        />
        <StatCard
          icon={ShieldAlert}
          label="Controlled"
          value={counts.controlled}
          color={PRIMARY_COLOR}
        />
        <StatCard
          icon={Pill}
          label="OTC"
          value={counts.otc}
          color={PRIMARY_COLOR}
        />
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by generic name, brand, code or category..."
      />
      <div className="space-y-2">
        <Chips
          label="Show:"
          value={show}
          onChange={setShow}
          options={[
            { id: "active", label: "Active only", count: counts.active },
            { id: "all", label: "Include inactive", count: counts.all },
          ]}
        />
        {categories.length > 0 && (
          <Chips
            label="Categories:"
            value={category}
            onChange={setCategory}
            options={[
              { id: "all", label: "All drugs" },
              ...categories.map((c) => ({ id: c, label: c })),
            ]}
          />
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyBox
          icon={BookOpen}
          title={
            search || category !== "all"
              ? "No drugs match your filters."
              : "Your drug catalog is empty."
          }
          action={
            !search && category === "all" ? (
              <PrimaryButton href="/dashboard/pharmacy/catalog/new" icon={Plus}>
                Add your first drug
              </PrimaryButton>
            ) : undefined
          }
        />
      ) : (
        <TableCard minWidth={860}>
          <thead>
            <tr
              className="text-xs opacity-50 border-b"
              style={{ borderColor: ui.border }}
            >
              <Th className="w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el)
                      el.indeterminate =
                        visibleSelected.length > 0 && !allSelected;
                  }}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 cursor-pointer"
                  style={{ accentColor: PRIMARY_COLOR }}
                  aria-label="Select all drugs"
                />
              </Th>
              <Th>Drug</Th>
              <Th className="hidden md:table-cell">Category</Th>
              <Th className="hidden lg:table-cell">Form / route</Th>
              <Th className="hidden sm:table-cell">Reorder at</Th>
              <Th>Status</Th>
              <Th className="text-right">Price</Th>
              <Th className="text-right">Edit</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => {
              const isSel = selected.has(d._id);
              return (
                <tr
                  key={d._id}
                  onClick={() => setDetail(d)}
                  className="cursor-pointer transition border-b last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  style={{
                    borderColor: ui.border,
                    backgroundColor: isSel ? `${PRIMARY_COLOR}12` : undefined,
                    opacity: d.isActive ? 1 : 0.6,
                  }}
                >
                  <td
                    className="px-3 py-3.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggleSelect(d._id)}
                      className="h-4 w-4 cursor-pointer"
                      style={{ accentColor: PRIMARY_COLOR }}
                      aria-label={`Select ${d.genericName}`}
                    />
                  </td>
                  <td className="px-3 py-3.5">
                    <p className="font-semibold text-xs">
                      {d.genericName} {d.strength}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] opacity-70">
                      <span className="opacity-70">
                        {d.code}
                        {d.brandName ? ` · ${d.brandName}` : ""}
                      </span>
                      {d.isControlled && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                          style={{ backgroundColor: NEUTRAL_CHIP }}
                        >
                          <ShieldAlert size={10} /> Sch {d.controlledSchedule}
                        </span>
                      )}
                      {!d.requiresPrescription && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                          style={{ backgroundColor: NEUTRAL_CHIP }}
                        >
                          OTC
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-xs opacity-70 hidden md:table-cell">
                    {d.category}
                  </td>
                  <td className="px-3 py-3.5 text-xs opacity-70 capitalize hidden lg:table-cell">
                    {d.form} · {d.route}
                  </td>
                  <td className="px-3 py-3.5 text-xs opacity-70 hidden sm:table-cell">
                    {d.reorderLevel}
                    <span className="opacity-60"> / {d.unit}</span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: d.isActive
                          ? `${PRIMARY_COLOR}1F`
                          : NEUTRAL_CHIP,
                        color: d.isActive ? PRIMARY_COLOR : undefined,
                      }}
                    >
                      {d.isActive ? "Available" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-xs text-right font-semibold">
                    {money(d.price)}
                  </td>
                  <td
                    className="px-3 py-3.5 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Can path={`/dashboard/pharmacy/catalog/${d._id}/edit`}><button
                      type="button"
                      onClick={() =>
                        router.push(`/dashboard/pharmacy/catalog/${d._id}/edit`)
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                      style={{ borderColor: ui.border }}
                      title="Edit drug"
                      aria-label="Edit drug"
                    >
                      <Edit3 size={13} />
                    </button></Can>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableCard>
      )}

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.genericName} ${detail.strength || ""}` : ""}
        ui={ui}
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                ["Selling price", money(detail.price)],
                ["Cost price", money(detail.costPrice)],
                ["Reorder level", String(detail.reorderLevel)],
                ["Form / route", `${detail.form} / ${detail.route}`],
                ["Manufacturer", detail.manufacturer || "—"],
                ["Barcode", detail.barcode || "—"],
                [
                  "Prescription",
                  detail.requiresPrescription ? "Required" : "OTC",
                ],
                [
                  "Controlled",
                  detail.isControlled
                    ? `Schedule ${detail.controlledSchedule}`
                    : "No",
                ],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="space-y-1 rounded-2xl p-3"
                  style={{ backgroundColor: ui.inner }}
                >
                  <span className="block text-[10px] font-bold uppercase opacity-50">
                    {k}
                  </span>
                  <span className="text-sm font-semibold capitalize">{v}</span>
                </div>
              ))}
            </div>
            {detail.storage && (
              <p className="text-xs opacity-70">Storage: {detail.storage}</p>
            )}
            {detail.notes && (
              <p className="text-xs opacity-70">{detail.notes}</p>
            )}
            <div
              className="flex justify-end gap-2 border-t pt-3"
              style={{ borderColor: ui.border }}
            >
              <GhostButton
                danger={detail.isActive}
                onClick={() => toggleActive(detail)}
              >
                {detail.isActive ? "Deactivate" : "Reactivate"}
              </GhostButton>
              <Can path={`/dashboard/pharmacy/catalog/${detail._id}/edit`}><PrimaryButton
                icon={Edit3}
                onClick={() =>
                  router.push(`/dashboard/pharmacy/catalog/${detail._id}/edit`)
                }
              >
                Edit Drug
              </PrimaryButton></Can>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Floating bulk-action bar ──────────────────── */}
      {visibleSelected.length > 0 && (
        <div
          className="fixed bottom-6 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-3 rounded-2xl border px-4 py-3"
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <span className="text-sm font-semibold">
            {visibleSelected.length} selected
          </span>
          <GhostButton onClick={() => setSelected(new Set())}>
            Clear
          </GhostButton>
          {selectedActive.length > 0 && (
            <Can perm="pharmacy.write"><GhostButton
              danger
              onClick={() => confirmBulk(selectedActive, false)}
            >
              Deactivate ({selectedActive.length})
            </GhostButton></Can>
          )}
          {selectedInactive.length > 0 && (
            <PrimaryButton onClick={() => confirmBulk(selectedInactive, true)}>
              Reactivate ({selectedInactive.length})
            </PrimaryButton>
          )}
        </div>
      )}

      <ConfirmModal
        state={confirm}
        busy={saving || bulkBusy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm()}
        ui={ui}
      />
    </PharmacyPage>
  );
}
