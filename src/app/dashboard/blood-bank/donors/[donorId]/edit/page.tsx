"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchDonorById, updateDonor } from "@/api/slices";
import {
  BASE, ENUMS, GROUP_OPTS, Loader, Page, SpecForm, clean, label, toDateInput, toIso, toOpts,
  useBB, useForm, type SectionSpec,
} from "@/components/blood-bank/bb-ui";

export default function EditDonorPage() {
  const { donorId } = useParams() as { donorId: string };
  const { facilityId, act, router, bloodBank } = useBB();
  const d: any = bloodBank.activeDonor?._id === donorId ? bloodBank.activeDonor : null;
  const form = useForm<any>({});

  useEffect(() => {
    if (facilityId) act(fetchDonorById({ facilityId, donorId }), false);
  }, [facilityId, donorId, act]);

  useEffect(() => {
    if (!d) return;
    form.setV({
      firstName: d.firstName || "", lastName: d.lastName || "", middleName: d.middleName || "",
      gender: d.gender || "", dateOfBirth: toDateInput(d.dateOfBirth), phone: d.phone || "",
      email: d.email || "", nationalId: d.nationalId || "", occupation: d.occupation || "",
      street: d.address?.street || "", city: d.address?.city || "", state: d.address?.state || "", country: d.address?.country || "",
      donorType: d.donorType || "voluntary", reportedBloodGroup: d.reportedBloodGroup || "",
      status: d.status || "active", deferralUntil: toDateInput(d.deferralUntil), deferralReason: d.deferralReason || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d?._id]);

  if (!d || form.v.firstName === undefined) return <Page narrow><Loader text="Loading donor…" /></Page>;

  const sections: SectionSpec[] = [
    {
      title: "Personal details",
      fields: [
        { key: "firstName", label: "First name", required: true },
        { key: "lastName", label: "Last name", required: true },
        { key: "middleName", label: "Middle name" },
        { key: "gender", label: "Gender", type: "select", options: toOpts(["male", "female", "other"]) },
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
      title: "Donation profile & status",
      fields: [
        { key: "donorType", label: "Donor type", type: "select", options: toOpts(ENUMS.donorTypes) },
        { key: "reportedBloodGroup", label: "Self-reported blood group", type: "select", options: [{ label: "Unknown", value: "" }, ...GROUP_OPTS] },
        { key: "status", label: "Status", type: "select", options: toOpts(ENUMS.donorStatuses) },
        { key: "deferralUntil", label: "Deferred until", type: "date", show: (v) => v.status === "deferred_temporary" },
        { key: "deferralReason", label: "Deferral reason", type: "textarea", span: 2, show: (v) => v.status?.startsWith("deferred") },
      ],
    },
  ];

  return (
    <SpecForm
      form={form}
      sections={sections}
      backHref={`${BASE}/donors/${donorId}`}
      title="Edit donor"
      subtitle={<span className="font-mono">{d.donorNumber}</span>}
      submitLabel="Save changes"
      saving={bloodBank.saving}
      confirm={(v) =>
        v.status !== d.status && (v.status === "deferred_permanent" || v.status === "inactive")
          ? {
              title: `Mark donor as ${label(v.status).toLowerCase()}?`,
              message:
                v.status === "deferred_permanent"
                  ? "A permanent deferral stops this donor from ever being screened for donation again."
                  : "An inactive donor will no longer appear as available to screen.",
              label: "Yes, update status",
              tone: "danger",
            }
          : null
      }
      onSubmit={async (v) => {
        const address = clean({ street: v.street, city: v.city, state: v.state, country: v.country });
        const payload: any = clean({
          firstName: v.firstName.trim(), lastName: v.lastName.trim(), middleName: v.middleName,
          gender: v.gender, dateOfBirth: toIso(v.dateOfBirth), phone: v.phone, email: v.email,
          nationalId: v.nationalId, occupation: v.occupation, donorType: v.donorType,
          reportedBloodGroup: v.reportedBloodGroup, status: v.status,
          deferralUntil: v.status === "deferred_temporary" ? toIso(v.deferralUntil) : undefined,
          deferralReason: v.status?.startsWith("deferred") ? v.deferralReason : undefined,
        });
        if (Object.keys(address).length) payload.address = address;
        if (v.status === "active") payload.deferralUntil = null;
        const res = await act(updateDonor({ facilityId, donorId, payload }), "Donor updated");
        if (res) router.push(`${BASE}/donors/${donorId}`);
      }}
    />
  );
}
