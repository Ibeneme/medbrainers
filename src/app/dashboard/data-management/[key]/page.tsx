"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Database } from "lucide-react";
import { fetchDatasetPreview, fetchDatasets, clearPreview } from "@/api/slices";
import { PRIMARY_COLOR } from "@/constants/colors";
import { ModuleShell, ActionLink, EmptyState, useInputStyles } from "@/components/dashboard/ModuleShell";
import { useDataManagement } from "@/hooks/useDataManagement";
import DataTable from "@/components/data-management/DataTable";
import ExportPanel from "@/components/data-management/ExportPanel";
import ImportPanel from "@/components/data-management/ImportPanel";
import { fmtNumber } from "@/components/data-management/format";

type Tab = "preview" | "export" | "import";

export default function DatasetPage() {
    const { key } = useParams<{ key: string }>();
    const { facilityId, dispatch, dataManagement } = useDataManagement();
    const { ui, cardCls } = useInputStyles();
    const { datasets, preview, loading } = dataManagement;
    const [tab, setTab] = useState<Tab>("preview");
    const [listed, setListed] = useState(false);

    useEffect(() => {
        if (!facilityId) return;
        dispatch(fetchDatasets({ facilityId })).finally(() => setListed(true));
    }, [dispatch, facilityId]);

    const dataset = datasets.find((d) => d.key === key);

    useEffect(() => {
        if (!facilityId || !dataset) return;
        if (!dataset.canExport) { setTab(dataset.canImport ? "import" : "preview"); return; }
        dispatch(fetchDatasetPreview({ facilityId, key, limit: 10 }));
        return () => void dispatch(clearPreview());
    }, [dispatch, facilityId, key, dataset?.key, dataset?.canExport]); // eslint-disable-line react-hooks/exhaustive-deps

    const tabs: { id: Tab; label: string }[] = dataset
        ? [
              ...(dataset.canExport ? [{ id: "preview" as Tab, label: "Preview" }, { id: "export" as Tab, label: "Export" }] : []),
              ...(dataset.canImport ? [{ id: "import" as Tab, label: "Import" }] : []),
          ]
        : [];
    const total = preview?.dataset === key ? preview.total : 0;

    return (
        <ModuleShell
            title={dataset?.label ?? "Dataset"}
            subtitle={dataset ? `${fmtNumber(total)} record(s)` : undefined}
            icon={Database}
            loading={!listed || (loading && !preview)}
            actions={<ActionLink href="/dashboard/data-management"><span className="inline-flex items-center gap-1.5"><ArrowLeft size={13} /> All datasets</span></ActionLink>}
        >
            {listed && !dataset && (
                <div className={cardCls} style={{ backgroundColor: ui.card, borderColor: ui.border }}>
                    <EmptyState text="This dataset does not exist or your role has no access to it." />
                </div>
            )}

            {dataset && (
                <>
                    <p className="text-xs opacity-60">{dataset.description}</p>
                    <div className="flex gap-1.5 rounded-full p-1 w-fit" style={{ backgroundColor: ui.inner }}>
                        {tabs.map((t) => (
                            <button key={t.id} type="button" onClick={() => setTab(t.id)} className="rounded-full px-4 py-2 text-xs font-semibold transition" style={tab === t.id ? { backgroundColor: PRIMARY_COLOR, color: "#fff" } : undefined}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {tab === "preview" && dataset.canExport && (
                        <div className={cardCls} style={{ backgroundColor: ui.card, borderColor: ui.border }}>
                            <p className="text-sm font-semibold">Example records</p>
                            <p className="text-xs opacity-55">The first {preview?.rows.length ?? 0} of {fmtNumber(total)}. Use Export to get everything.</p>
                            <DataTable columns={preview?.columns ?? dataset.columns} rows={preview?.rows ?? []} empty="No records yet. Use Import to add some." />
                        </div>
                    )}
                    {tab === "export" && dataset.canExport && <ExportPanel datasetKey={dataset.key} label={dataset.label} total={total} />}
                    {tab === "import" && dataset.canImport && <ImportPanel dataset={dataset} />}
                </>
            )}
        </ModuleShell>
    );
}
