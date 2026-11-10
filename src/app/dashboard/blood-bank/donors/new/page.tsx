"use client";

import { createDonor } from "@/api/slices";
import {
  BASE, ENUMS, GROUP_OPTS, SpecForm, clean, idOf, toOpts, useBB, useForm,
  toDateInput, toIso, type SectionSpec,
} from "@/components/blood-bank/bb-ui";

export default function NewDonorPage() {
  const { facilityId, act, router, bloodBank } = useBB();
  const form = useForm<any>({
    patientId: "", firstName: "", lastName: "", middleName: "", gender: "", dateOfBirth: "",
    phone: "", email: "", nationalId: "", occupation: "", street: "", city: "", state: "", country: "",
    donorType: "voluntary", replacementFor: "", reportedBloodGroup: "",
    ecName: "", ecPhone: "", ecRelationship: "", notes: "", consentGiven: false,
  });

  const sections: SectionSpec[] = [
    {
      title: "Link to a patient record (optional)",
      desc: "Choosing a patient pre-fills their details below.",
      cols: 1,
      fields: [
        {
          key: "patientId", type: "patient", label: "Existing patient",
          onPick: (p, f) => {
            if (!p) return;
            f.patch({
              firstName: p.firstName || "", lastName: p.lastName || "",
              gender: ["male", "female", "other"].includes(p.gender) ? p.gender : "",
              dateOfBirth: toDateInput(p.dateOfBirth), phone: p.phone || "",
              email: p.email || "",
              reportedBloodGroup: p.bloodGroup || "",
            });
          },
        },
      ],
    },
    {
      title: "Personal details",
      fields: [
        { key: "firstName", label: "First name", required: true },
        { key: "lastName", label: "Last name", required: true },
        { key: "middleName", label: "Middle name" },
        { key: "gender", label: "Gender", type: "select", required: true, options: toOpts(["male", "female", "other"]) },
        { key: "dateOfBirth", label: "Date of birth", type: "date" },
        { key: "occupation", label: "Occupation" },
        { key: "phone", label: "Phone", type: "tel" },
        { key: "email", label: "Email", type: "email" },
        { key: "nationalId", label: "National ID" },
      ],
    },
    {
      title: "Address",
      fields: [
        { key: "street", label: "Street", span: 2 },
        { key: "city", label: "City" },
        { key: "state", label: "State" },
        { key: "country", label: "Country" },
      ],
    },
    {
      title: "Donation profile",
      fields: [
        { key: "donorType", label: "Donor type", type: "select", options: toOpts(ENUMS.donorTypes) },
        { key: "reportedBloodGroup", label: "Self-reported blood group", type: "select", options: [{ label: "Unknown", value: "" }, ...GROUP_OPTS], hint: "Confirmed later by lab grouping." },
        {
          key: "replacementFor", label: "Replacing blood for patient", type: "patient", span: 2,
          show: (v) => v.donorType === "family_replacement",
        },
      ],
    },
    {
      title: "Emergency contact",
      fields: [
        { key: "ecName", label: "Name" },
        { key: "ecPhone", label: "Phone", type: "tel" },
        { key: "ecRelationship", label: "Relationship" },
      ],
    },
    {
      title: "Consent & notes",
      cols: 1,
      fields: [
        { key: "notes", label: "Notes", type: "textarea" },
        { key: "consentGiven", type: "toggle", label: "Donor consent given", hint: "The donor has agreed to donate blood and to have it tested.", required: true },
      ],
    },
  ];

  return (
    <SpecForm
      form={form}
      sections={sections}
      backHref={`${BASE}/donors`}
      title="Register donor"
      subtitle="Add a new blood donor to the registry"
      submitLabel="Register donor"
      saving={bloodBank.saving}
      savingText="Registering donor…"
      onSubmit={async (v) => {
        const payload: any = clean({
          patientId: v.patientId, firstName: v.firstName.trim(), lastName: v.lastName.trim(),
          middleName: v.middleName, gender: v.gender, dateOfBirth: toIso(v.dateOfBirth),
          phone: v.phone, email: v.email, nationalId: v.nationalId, occupation: v.occupation,
          donorType: v.donorType, replacementFor: v.donorType === "family_replacement" ? v.replacementFor : "",
          reportedBloodGroup: v.reportedBloodGroup, notes: v.notes, consentGiven: true,
        });
        const address = clean({ street: v.street, city: v.city, state: v.state, country: v.country });
        if (Object.keys(address).length) payload.address = address;
        const ec = clean({ name: v.ecName, phone: v.ecPhone, relationship: v.ecRelationship });
        if (Object.keys(ec).length) payload.emergencyContact = ec;
        const res: any = await act(createDonor({ facilityId, payload }), "Donor registered");
        if (res) router.push(res === true ? `${BASE}/donors` : `${BASE}/donors/${idOf(res)}`);
      }}
    />
  );
}
