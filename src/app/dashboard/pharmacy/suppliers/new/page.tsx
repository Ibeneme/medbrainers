"use client";

import { useState } from "react";
import { Building2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { createSupplier } from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import {
  FormField,
  PharmacyPage,
  PrimaryButton,
  SectionCard,
  TextArea,
  TextInput,
} from "@/components/dashboard/pharmacy/PharmacyUI";

const EMPTY = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  paymentTerms: "",
  notes: "",
};

export default function CreateSupplierPage() {
  const router = useRouter();
  const { dispatch, facilityId, pharmacy, act } = usePharmacy();
  const { saving } = pharmacy;

  const [form, setForm] = useState(EMPTY);
  const set = (k: keyof typeof EMPTY, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== "")
    ) as any;

    const res = await act(createSupplier({ facilityId, payload }));
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
        { label: "Add Supplier" },
      ]}
      title="Add New Supplier"
      description="Register a new vendor to raise purchase orders against and receive stock from."
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
            {saving ? "Saving..." : "Save supplier"}
          </PrimaryButton>
        </div>
      </form>
    </PharmacyPage>
  );
}
