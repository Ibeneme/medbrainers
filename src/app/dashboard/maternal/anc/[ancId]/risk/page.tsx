"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { fetchAncById, updateAncRisk } from "@/api/slices";
import {
  BASE, ENUMS, Loader, Page, RISK_FACTORS, SpecForm, label, nameOf, toOpts, useForm, useMat, type SectionSpec,
} from "@/components/maternity/mat-ui";

export default function AncRiskPage() {
  const { ancId } = useParams() as { ancId: string };
  const { facilityId, act, router, maternity } = useMat();
  const r = maternity.activeAnc?._id === ancId ? maternity.activeAnc : null;
  const form = useForm<any>({ riskLevel: "low", riskFactors: [], status: "active", notes: "" });

  useEffect(() => {
    if (facilityId && !r) act(fetchAncById({ facilityId, id: ancId }), false);
  }, [facilityId, ancId, r, act]);

  const seeded = useRef(false);
  useEffect(() => {
    if (!r || seeded.current) return;
    seeded.current = true;
    form.patch({ riskLevel: r.riskLevel, riskFactors: r.riskFactors || [], status: r.status, notes: r.notes || "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r]);

  if (!r) return <Page narrow><Loader text="Loading record…" /></Page>;

  const sections: SectionSpec[] = [
    {
      title: "Risk assessment",
      cols: 1,
      fields: [
        { key: "riskLevel", label: "Risk level", type: "select", options: toOpts(ENUMS.riskLevels) },
        { key: "riskFactors", label: "Risk factors", type: "chips", options: RISK_FACTORS.map((x) => ({ value: x, label: x })) },
      ],
    },
    {
      title: "Pregnancy status",
      desc: "Recording a delivery sets “delivered” automatically — change it here only for other outcomes.",
      cols: 1,
      fields: [
        { key: "status", label: "Status", type: "select", options: toOpts(ENUMS.pregnancyStatuses) },
        { key: "notes", label: "Notes", type: "textarea" },
      ],
    },
  ];

  return (
    <SpecForm
      form={form}
      sections={sections}
      backHref={`${BASE}/anc/${ancId}`}
      title="Update risk & status"
      subtitle={nameOf(r.patient)}
      submitLabel="Save changes"
      saving={maternity.saving}
      confirm={(x) =>
        x.status !== r.status && x.status !== "active"
          ? {
              title: `Mark pregnancy as ${label(x.status)}?`,
              message:
                x.status === "delivered"
                  ? "Recording a delivery marks the pregnancy as delivered automatically. Only set it manually if no delivery record will be entered."
                  : "The pregnancy will leave the active ANC list and stop appearing in follow-up and high-risk views.",
              label: "Update status",
              tone: "danger",
            }
          : null
      }
      onSubmit={async (x) => {
        const res = await act(updateAncRisk({ facilityId, id: ancId, payload: { riskLevel: x.riskLevel, riskFactors: x.riskFactors, status: x.status, notes: x.notes } }));
        if (res) router.push(`${BASE}/anc/${ancId}`);
      }}
    />
  );
}
