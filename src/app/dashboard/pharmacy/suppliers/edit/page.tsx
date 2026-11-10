"use client";

import { useEffect, useState } from "react";
import { Building2, Save } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchSuppliers, updateSupplier } from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import {
  FormField,
  PharmacyPage,
  PrimaryButton,
  SectionCard,
  TextArea,
  TextInput,
} from "@/components/dashboard/pharmacy/PharmacyUI";

export default function EditSupplierPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supplierId = searchParams.get("id");

  const { dispatch, facilityId, pharmacy, act } = usePharmacy();
  const { suppliers, saving } = pharmacy;

  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    paymentTerms: "",
    notes: "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (facilityId && suppliers.length === 0) {
      dispatch(fetchSuppliers({ facilityId, includeInactive: true }));
    }
  }, [dispatch, facilityId, suppliers.length]);

  useEffect(() => {
    if (!supplierId || suppliers.length === 0) return;
    const current = suppliers.find((s) => s._id === supplierId);
    if (current) {
      setForm({
        name: current.name || "",
        contactPerson: current.contactPerson || "",
        phone: current.phone || "",
        email: current.email || "",
        address: current.address || "",
        paymentTerms: current.paymentTerms || "",
        notes: current.notes || "",
      });
    }
  }, [supplierId, suppliers]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) return;

    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== "")
    ) as any;

    const res = await act(
      updateSupplier({
        facilityId,
        supplierId,
        payload,
      })
    );

    if (res) {
      router.push("/dashboard/pharmacy/suppliers");
    }
  };

  return (
    <PharmacyPage
      narrow
      routes={[
        { label: "Pharmacy", href: "/dashboard/pharmacy" },
        { label: "Suppliers", href: "/dashboard/pharmacy/suppliers" },
        { label: "Edit Supplier" },
      ]}
      title="Edit Supplier"
      description="Update vendor information, contact details, and payment terms."
      icon={Building2}
    >
      <form onSubmit={submit} className="space-y-5">
        <SectionCard title="Supplier details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Supplier name *">
              <TextInput
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. PharmaCorp Ltd"
              />
            </FormField>
            <FormField label="Contact person">
              <TextInput
                value={form.contactPerson}
                onChange={(e) => set("contactPerson", e.target.value)}
                placeholder="e.g. John Doe"
              />
            </FormField>
            <FormField label="Phone">
              <TextInput
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="e.g. +234 800 000 0000"
              />
            </FormField>
            <FormField label="Email">
              <TextInput
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="e.g. orders@pharmacorp.com"
              />
            </FormField>
            <FormField label="Payment terms">
              <TextInput
                value={form.paymentTerms}
                onChange={(e) => set("paymentTerms", e.target.value)}
                placeholder="e.g. Net 30"
              />
            </FormField>
          </div>
          <FormField label="Address">
            <TextArea
              rows={2}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="e.g. 45 Industrial Layout, Ikeja, Lagos"
            />
          </FormField>
          <FormField label="Notes">
            <TextArea
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any additional information about this supplier..."
            />
          </FormField>
        </SectionCard>

        <div className="flex justify-end gap-3">
          <PrimaryButton type="submit" disabled={saving} icon={Save}>
            {saving ? "Saving..." : "Save changes"}
          </PrimaryButton>
        </div>
      </form>
    </PharmacyPage>
  );
}
