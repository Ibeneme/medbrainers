"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { clearActiveDrug, fetchDrugById, fetchDrugs, updateDrug } from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import DrugForm from "@/components/dashboard/pharmacy/DrugForm";
import { PharmacyPage } from "@/components/dashboard/pharmacy/PharmacyUI";

export default function EditDrugPage() {
  const router = useRouter();
  const params = useParams();
  const drugId = String(Array.isArray(params?.drugId) ? params.drugId[0] : params?.drugId || "");
  const { dispatch, facilityId, pharmacy, act } = usePharmacy();
  const drug = pharmacy.activeDrug?._id === drugId ? pharmacy.activeDrug : null;

  useEffect(() => {
    if (!facilityId || !drugId) return;
    dispatch(fetchDrugById({ facilityId, drugId }));
    dispatch(fetchDrugs({ facilityId, includeInactive: true }));
    return () => {
      dispatch(clearActiveDrug());
    };
  }, [dispatch, facilityId, drugId]);

  return (
    <PharmacyPage
      narrow
      routes={[{ label: "Pharmacy", href: "/dashboard/pharmacy" }, { label: "Drug Catalog", href: "/dashboard/pharmacy/catalog" }, { label: "Edit Drug" }]}
      title={drug ? `Edit ${drug.genericName}` : "Edit Drug"}
      description="Changes apply to future prescriptions and dispenses. Past records keep the price they were sold at."
      icon={BookOpen}
      loading={pharmacy.detailLoading && !drug}
    >
      {drug && (
        <DrugForm
          key={drug._id}
          initial={drug}
          saving={pharmacy.saving}
          submitLabel="Save Changes"
          categories={Array.from(new Set(pharmacy.drugs.map((d) => d.category)))}
          onSubmit={async (payload) => {
            const res = await act(updateDrug({ facilityId, drugId, payload }));
            if (res) router.push("/dashboard/pharmacy/catalog");
          }}
        />
      )}
    </PharmacyPage>
  );
}
