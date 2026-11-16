import SelectPatientsPage from "@/components/dashboard/radiology/select_patients";
import React, { Suspense } from "react";

const Page = () => {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm opacity-70">Loading patient selection...</div>
      }
    >
      <div>
        <SelectPatientsPage
          title="Select Patients for X-Ray"
          description="Select up to 10 patients to create X-ray orders simultaneously."
          maxSelectable={10}
          routes={[
            { label: "Radiology", href: "/dashboard/radiology" },
            { label: "X-Ray", href: "/dashboard/radiology/xray" },
            { label: "Select Patients" },
          ]}
          destinationPath="/dashboard/radiology/create/xray"
        />
      </div>
    </Suspense>
  );
};

export default Page;