"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Boxes,
  PackageCheck,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import { fetchPharmacyReport } from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import { CustomPopupDatePicker } from "@/components/ui/items";
import {
  Alert,
  EmptyBox,
  PharmacyPage,
  SectionCard,
  StatCard,
  money,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function PharmacyReportsPage() {
  const { dispatch, facilityId, pharmacy } = usePharmacy();
  const { ui, isDark, colors, border } = usePharmacyUI();
  const { report: r, listLoading, error } = pharmacy;
  const [to, setTo] = useState(iso(new Date()));
  const [from, setFrom] = useState(iso(new Date(Date.now() - 29 * 86400000)));

  const load = () =>
    facilityId && dispatch(fetchPharmacyReport({ facilityId, from, to }));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId, from, to]);

  const maxRev = Math.max(1, ...(r?.daily.map((d) => d.revenue) ?? [1]));
  const maxQty = Math.max(1, ...(r?.topDrugs.map((d) => d.quantity) ?? [1]));

  return (
    <PharmacyPage
      routes={[
        { label: "Pharmacy", href: "/dashboard/pharmacy" },
        { label: "Reports" },
      ]}
      title="Pharmacy Reports"
      description="Dispensing activity, revenue, best sellers and stock health for a date range."
      icon={BarChart3}
      loading={listLoading && !r}
      loadingText="Building report..."
      onRefresh={load}
    >
      {error && !r && <Alert tone="danger">{error}</Alert>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
        <CustomPopupDatePicker
          label="From"
          value={from}
          onChange={setFrom}
          placeholder="Select start date..."
          border={border}
          colors={colors}
          isDark={isDark}
        />
        <CustomPopupDatePicker
          label="To"
          value={to}
          onChange={setTo}
          placeholder="Select end date..."
          border={border}
          colors={colors}
          isDark={isDark}
        />
      </div>

      {r && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              icon={Wallet}
              label="Revenue"
              value={money(r.revenue)}
              color="#8b5cf6"
            />
            <StatCard
              icon={PackageCheck}
              label="Dispenses"
              value={r.dispenses}
              color="#059669"
            />
            <StatCard
              icon={RotateCcw}
              label="Refills"
              value={r.refills}
              color="#0ea5e9"
            />
            <StatCard
              icon={Boxes}
              label="Stock value (cost)"
              value={money(r.inventory.value)}
              hint={`${r.inventory.low} low · ${r.inventory.out} out`}
              color="#d97706"
            />
          </div>

          <SectionCard title="Daily revenue">
            {r.daily.length === 0 ? (
              <p className="text-xs opacity-50 py-6 text-center">
                No dispensing in this period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex items-end gap-1.5 h-40 min-w-max pb-1">
                  {r.daily.map((d) => (
                    <div
                      key={d.date}
                      className="flex flex-col items-center justify-end gap-1 w-8"
                      title={`${d.date}: ${money(d.revenue)} (${
                        d.count
                      } dispenses)`}
                    >
                      <div
                        className="w-full rounded-t-md"
                        style={{
                          height: `${Math.max(
                            4,
                            (d.revenue / maxRev) * 130
                          )}px`,
                          backgroundColor: PRIMARY_COLOR,
                        }}
                      />
                      <span className="text-[9px] opacity-50">
                        {d.date.slice(8)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Top drugs by quantity">
              {r.topDrugs.length === 0 ? (
                <EmptyBox icon={BarChart3} title="Nothing dispensed yet." />
              ) : (
                <div className="space-y-3">
                  {r.topDrugs.map((d) => (
                    <div key={d._id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold truncate pr-3">
                          {d.name}
                        </span>
                        <span className="opacity-70 shrink-0">
                          {d.quantity} · {money(d.revenue)}
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full"
                        style={{ backgroundColor: ui.inner }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(d.quantity / maxQty) * 100}%`,
                            backgroundColor: PRIMARY_COLOR,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <div className="space-y-4">
              <SectionCard title="Prescriptions written">
                <div className="grid grid-cols-2 gap-2">
                  {r.prescriptionsByStatus.length === 0 && (
                    <p className="text-xs opacity-50">None in this period.</p>
                  )}
                  {r.prescriptionsByStatus.map((s) => (
                    <div
                      key={s.status}
                      className="rounded-2xl p-3 text-xs"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <span className="opacity-50 block uppercase text-[10px] font-bold">
                        {s.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-lg font-bold">{s.count}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
              <SectionCard title="Stock adjustments">
                <div className="grid grid-cols-2 gap-2">
                  {r.adjustmentsByType.length === 0 && (
                    <p className="text-xs opacity-50">None in this period.</p>
                  )}
                  {r.adjustmentsByType.map((a) => (
                    <div
                      key={a.type}
                      className="rounded-2xl p-3 text-xs"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <span className="opacity-50 block uppercase text-[10px] font-bold">
                        {a.type.replace(/_/g, " ")}
                      </span>
                      <span className="text-lg font-bold">{a.units}</span>{" "}
                      <span className="opacity-50">units · {a.count}×</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>
        </>
      )}
    </PharmacyPage>
  );
}
