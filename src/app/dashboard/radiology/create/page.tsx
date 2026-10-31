import SelectPatientsPage from "@/components/dashboard/radiology/select_patients";
import React from "react";

const page = () => {
  return (
    <div>
      <SelectPatientsPage
        title="Select Patients for X-Ray"
        description="Select up to {max} patients to create X-ray orders simultaneously."
        maxSelectable={10}
        routes={[
          { label: "Radiology", href: "/dashboard/radiology" },
          { label: "X-Ray", href: "/dashboard/radiology/xray" }, 
          { label: "Select Patients" },
        ]}
        destinationPath="/dashboard/radiology/create/xray"
      />
    </div>
  );
};

export default page;
