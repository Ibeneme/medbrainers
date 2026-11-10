"use client";

import { Suspense } from "react";
import SelectPatientsPage from "@/components/dashboard/radiology/select_patients";

export default function SelectPatientsForPrescription() {
  return (
    <Suspense fallback={null}>
      <SelectPatientsPage
        title="Select Patients for Prescription"
        description="Select up to {max} patients to write prescriptions for at the same time."
        maxSelectable={10}
        routes={[
          { label: "Pharmacy", href: "/dashboard/pharmacy" },
          { label: "e-Prescriptions", href: "/dashboard/pharmacy/prescriptions" },
          { label: "Select Patients" },
        ]}
        destinationPath="/dashboard/pharmacy/prescriptions/new"
      />
    </Suspense>
  );
}
