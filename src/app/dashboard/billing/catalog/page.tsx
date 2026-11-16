"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, DownloadCloud, Pencil, Plus, Power, Tags } from "lucide-react";
import {
  BILLING_DEPARTMENTS, DEPARTMENT_LABELS, createBillingItem, deactivateBillingItem, fetchBillingItems, fetchCatalogCoverage,
  syncCatalogFromClinical, updateBillingItem, type BillingDepartment, type BillingItem, type CatalogSyncReport, type ClinicalSourceModel,
} from "@/api/slices";
import { useAccess } from "@/hooks/useAccess";
import { useBilling } from "@/hooks/useBilling";
import { Modal } from "@/components/ui/items";
import { parseMoney } from "@/lib/billing/helpers";
import {
  Alert, BillingPage, Chips, EmptyBox, FormField, GhostButton, Pager, Pill, PrimaryButton, ReadOnlyNotice, SearchBar,
  SectionCard, SelectInput, TableCard, TextArea, TextInput, Th, useBillingUI,
} from "@/components/dashboard/billing/BillingUI";

type Form = { itemId: string; name: string; department: BillingDepartment; unitPrice: string; unit: string; description: string };
const emptyForm = (): Form => ({ itemId: "", name: "", department: "consultation", unitPrice: "", unit: "", description: "" });

const SOURCES: Array<{ model: ClinicalSourceModel; dept: string; label: string }> = [
  { model: "Drug", dept: "pharmacy", label: "Pharmacy drugs" },
  { model: "LabTestCatalog", dept: "laboratory", label: "Laboratory tests" },
  { model: "ImagingCatalog", dept: "radiology", label: "Radiology studies" },
];

export default function PriceCatalogPage() {
  const { facilityId, billing, act, dispatch, money, currencySymbol } = useBilling();
  const { can } = useAccess();
  const canManage = can("billing.manage");
  const { ui, border } = useBillingUI();
  const { catalog, listLoading, saving, coverage } = billing;

  const [dept, setDept] = useState<"all" | BillingDepartment>("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("active");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<BillingItem | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [report, setReport] = useState<CatalogSyncReport | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    if (!facilityId) return;
    dispatch(
      fetchBillingItems({
        facilityId,
        page,
        limit: 25,
        department: dept === "all" ? undefined : dept,
        search: debounced || undefined,
        isActive: status === "all" ? undefined : status === "active",
      }),
    );
  }, [dispatch, facilityId, page, dept, debounced, status]);
  useEffect(load, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm(), department: dept === "all" ? "consultation" : dept });
    setFormError(null);
  };
  const openEdit = (it: BillingItem) => {
    setEditing(it);
    setForm({ itemId: it.itemId, name: it.name, department: it.department, unitPrice: String(it.unitPrice), unit: it.unit ?? "", description: it.description ?? "" });
    setFormError(null);
  };
  const close = () => {
    setForm(null);
    setEditing(null);
  };

  const submit = async () => {
    if (!form) return;
    if (!form.name.trim()) return setFormError("Enter the service or item name");
    // A price is mandatory: nothing can be billed without one. 0 is allowed only when typed on purpose (free service).
    const price = parseMoney(form.unitPrice, { allowZero: true });
    if (!price.ok) return setFormError(`Price: ${price.error}`);
    if (form.itemId && !/^[A-Za-z0-9._-]{2,40}$/.test(form.itemId.trim())) return setFormError("Item ID: 2–40 letters, numbers, . - or _");
    setFormError(null);

    const common = {
      name: form.name.trim(),
      department: form.department,
      unitPrice: price.value,
      ...(form.unit.trim() ? { unit: form.unit.trim() } : {}),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
    };
    const ok = editing
      ? await act(updateBillingItem({ facilityId, itemId: editing.itemId, payload: common }), "Item updated")
      : await act(
          createBillingItem({ facilityId, payload: { ...common, ...(form.itemId.trim() ? { itemId: form.itemId.trim() } : {}) } }),
          "Item added to the price catalog",
        );
    if (ok) close();
  };

  const toggleActive = async (it: BillingItem) => {
    if (it.isActive) await act(deactivateBillingItem({ facilityId, itemId: it.itemId }), `${it.name} can no longer be billed`);
    else await act(updateBillingItem({ facilityId, itemId: it.itemId, payload: { isActive: true } }), `${it.name} can be billed again`);
  };

  const checkCoverage = () => act(fetchCatalogCoverage({ facilityId }));
  const sync = async (models: ClinicalSourceModel[]) => {
    const r = await act<CatalogSyncReport>(syncCatalogFromClinical({ facilityId, models }), "Catalog synced");
    if (r) {
      setReport(r);
      load();
      checkCoverage();
    }
  };

  const unpricedTotal = coverage ? Object.values(coverage).reduce((a, c) => a + c.unpriced.length, 0) : 0;

  return (
    <BillingPage
      title="Price catalog"
      icon={Tags}
      description="Every billable service needs a price — nothing without one can be added to a bill"
      loading={listLoading && catalog.items.length === 0}
      loadingText="Loading price catalog..."
      onRefresh={load}
      actions={canManage ? <PrimaryButton icon={Plus} onClick={openNew}>Add item</PrimaryButton> : undefined}
    >
      {!canManage && <ReadOnlyNotice what="the price catalog" />}

      <SearchBar value={search} onChange={setSearch} placeholder="Search by name or item ID…" />
      <Chips
        label="Department"
        value={dept}
        onChange={(v) => {
          setDept(v);
          setPage(1);
        }}
        options={[{ id: "all" as const, label: "All" }, ...BILLING_DEPARTMENTS.map((d) => ({ id: d, label: DEPARTMENT_LABELS[d] }))]}
      />
      <Chips
        label="Show"
        value={status}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
        options={[
          { id: "active", label: "Active" },
          { id: "inactive", label: "Inactive" },
          { id: "all", label: "All" },
        ]}
      />

      {catalog.items.length === 0 && !listLoading ? (
        <EmptyBox
          icon={Tags}
          title={debounced || dept !== "all" || status !== "active" ? "No items match" : "No prices set up yet"}
          hint={canManage ? "Add your services, drugs and tests with their prices so they can be billed." : "Ask an administrator to set up the price catalog."}
          action={canManage ? <PrimaryButton icon={Plus} onClick={openNew}>Add the first item</PrimaryButton> : undefined}
        />
      ) : (
        <>
          <TableCard minWidth={760}>
            <thead>
              <tr>
                <Th>Item ID</Th>
                <Th>Name</Th>
                <Th>Department</Th>
                <Th className="text-right">Unit price</Th>
                <Th>Status</Th>
                {canManage && <Th className="text-right">Actions</Th>}
              </tr>
            </thead>
            <tbody>
              {catalog.items.map((it) => (
                <tr key={it._id} className="border-t" style={{ borderColor: border }}>
                  <td className="px-3 py-3 font-mono text-xs opacity-70">{it.itemId}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium">{it.name}</p>
                    {(it.unit || it.source) && (
                      <p className="text-[11px] opacity-50">
                        {it.unit ? `per ${it.unit}` : ""}
                        {it.unit && it.source ? " · " : ""}
                        {it.source ? "linked to clinical catalog" : ""}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs">{DEPARTMENT_LABELS[it.department] ?? it.department}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{money(it.unitPrice)}</td>
                  <td className="px-3 py-3">
                    <Pill label={it.isActive ? "active" : "inactive"} color={it.isActive ? "#16a34a" : "#6b7280"} />
                  </td>
                  {canManage && (
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1.5">
                        <GhostButton icon={Pencil} onClick={() => openEdit(it)}>Edit</GhostButton>
                        <GhostButton icon={Power} danger={it.isActive} onClick={() => toggleActive(it)} disabled={saving}>
                          {it.isActive ? "Deactivate" : "Reactivate"}
                        </GhostButton>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </TableCard>
          <Pager page={catalog.page} limit={catalog.limit} total={catalog.total} onPage={setPage} />
        </>
      )}

      {canManage && (
        <SectionCard
          title="Price coverage"
          subtitle="Find drugs, lab tests and imaging studies that have no price here yet — they can't be billed until they do."
          right={<GhostButton onClick={checkCoverage}>Check now</GhostButton>}
        >
          {!coverage && <p className="text-xs opacity-55">Run a check to see what is missing.</p>}
          {coverage && (
            <>
              {unpricedTotal === 0 ? (
                <Alert tone="success">Everything in your pharmacy, laboratory and radiology catalogs has a billing price. ✓</Alert>
              ) : (
                <Alert tone="warning">
                  <AlertTriangle size={13} className="mr-1 inline" />
                  <b>{unpricedTotal}</b> clinical catalog entries have no billing price yet.
                </Alert>
              )}
              <div className="grid gap-3 sm:grid-cols-3">
                {SOURCES.map((s) => {
                  const c = coverage[s.dept];
                  if (!c) return null;
                  return (
                    <div key={s.model} className="space-y-2 rounded-2xl p-4" style={{ backgroundColor: ui.inner }}>
                      <p className="text-xs font-semibold">{s.label}</p>
                      <p className="text-2xl font-semibold tabular-nums">
                        {c.priced}
                        <span className="text-sm font-normal opacity-50"> / {c.total} priced</span>
                      </p>
                      {c.unpriced.length > 0 && (
                        <>
                          <ul className="max-h-28 space-y-0.5 overflow-y-auto text-[11px] opacity-70">
                            {c.unpriced.slice(0, 30).map((u) => (
                              <li key={u.id} className="flex justify-between gap-2">
                                <span className="truncate">{u.name}</span>
                                <span className="shrink-0 opacity-60">{u.existingPrice !== null ? money(u.existingPrice) : "no price"}</span>
                              </li>
                            ))}
                          </ul>
                          <GhostButton icon={DownloadCloud} onClick={() => sync([s.model])} disabled={saving}>
                            Create from existing prices
                          </GhostButton>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              {report && (
                <Alert tone={report.skippedNoPrice.length ? "warning" : "success"}>
                  Added <b>{report.created}</b> items{report.alreadyLinked ? ` (${report.alreadyLinked} were already linked)` : ""}.
                  {report.skippedNoPrice.length > 0 && (
                    <>
                      {" "}
                      <b>{report.skippedNoPrice.length}</b> had no valid price and were skipped — add them by hand:{" "}
                      {report.skippedNoPrice.slice(0, 8).map((x) => x.name).join(", ")}
                      {report.skippedNoPrice.length > 8 ? "…" : ""}
                    </>
                  )}
                </Alert>
              )}
            </>
          )}
        </SectionCard>
      )}

      <Modal open={!!form} title={editing ? `Edit ${editing.name}` : "Add to price catalog"} onClose={close} ui={ui} maxWidth="max-w-xl">
        {form && (
          <div className="space-y-4">
            {formError && <Alert tone="danger">{formError}</Alert>}
            <FormField label="Name *">
              <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. General consultation" maxLength={200} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Department *">
                <SelectInput
                  value={form.department}
                  onChange={(v) => setForm({ ...form, department: v as BillingDepartment })}
                  options={BILLING_DEPARTMENTS.map((d) => ({ value: d, label: DEPARTMENT_LABELS[d] }))}
                />
              </FormField>
              <FormField label={`Unit price (${currencySymbol}) *`} hint="Required. Enter 0 only for a genuinely free service.">
                <TextInput value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} inputMode="decimal" placeholder="0.00" />
              </FormField>
              <FormField label="Item ID" hint={editing ? "Can't be changed after creation." : "Leave blank to generate one (e.g. CONS-00001)."}>
                <TextInput value={form.itemId} upper disabled={!!editing} onChange={(e) => setForm({ ...form, itemId: e.target.value })} placeholder="auto" maxLength={40} />
              </FormField>
              <FormField label="Sold per" hint="Optional — tablet, test, session, day…">
                <TextInput value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} maxLength={30} />
              </FormField>
            </div>
            <FormField label="Description">
              <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} />
            </FormField>
            <div className="flex justify-end gap-2 pt-1">
              <GhostButton onClick={close}>Cancel</GhostButton>
              <PrimaryButton onClick={submit} disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Add item"}</PrimaryButton>
            </div>
          </div>
        )}
      </Modal>
    </BillingPage>
  );
}
