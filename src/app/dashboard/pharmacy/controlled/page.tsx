"use client";

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { fetchControlledLog } from "@/api/slices";
import { usePharmacy } from "@/hooks/usePharmacy";
import { CustomDropdown, CustomPopupDatePicker } from "@/components/ui/items";
import {
  Alert,
  EmptyBox,
  PharmacyPage,
  Pill,
  StatCard,
  TableCard,
  Th,
  fmtDateTime,
  patientName,
  personName,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

export default function ControlledLogPage() {
  const { dispatch, facilityId, pharmacy } = usePharmacy();
  const { ui, isDark, colors, border } = usePharmacyUI();
  const { controlledLog, controlledBalances, listLoading, error } = pharmacy;
  const [drugId, setDrugId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = () =>
    facilityId &&
    dispatch(
      fetchControlledLog({
        facilityId,
        drugId: drugId || undefined,
        from: from || undefined,
        to: to || undefined,
      })
    );
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId, drugId, from, to]);

  return (
    <PharmacyPage
      routes={[
        { label: "Pharmacy", href: "/dashboard/pharmacy" },
        { label: "Controlled Substances Log" },
      ]}
      title="Controlled Substances Log"
      description="Append-only register of every receipt, dispense and adjustment of controlled drugs, with running balance."
      icon={ShieldAlert}
      loading={listLoading && controlledLog.length === 0}
      loadingText="Loading register..."
      onRefresh={load}
      guide={{
        title: "Register Notes",
        summary:
          "Entries cannot be edited or deleted. Mark a drug as controlled (with its schedule) in the Drug Catalog to include it here. Access is limited to pharmacy leadership and audit roles.",
      }}
    >
      {error && controlledLog.length === 0 && (
        <Alert tone="danger">{error}</Alert>
      )}

      {controlledBalances.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {controlledBalances.map((b) => (
            <StatCard
              key={b._id}
              icon={ShieldAlert}
              label={`${b.genericName} ${b.strength || ""} · Sch ${b.schedule}`}
              value={b.totalOnHand}
              color="#e11d48"
              hint="on hand (all batches)"
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <CustomDropdown
          label="Drug"
          value={drugId}
          options={[
            { label: "All controlled drugs", value: "" },
            ...controlledBalances.map((b) => ({
              label: `${b.genericName} ${b.strength || ""}`.trim(),
              value: b._id,
            })),
          ]}
          onChange={setDrugId}
          isDark={isDark}
          colors={colors}
          border={border}
        />
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

      {controlledLog.length === 0 ? (
        <EmptyBox
          icon={ShieldAlert}
          title="No controlled-substance movements recorded."
        />
      ) : (
        <TableCard minWidth={860}>
          <thead>
            <tr
              className="text-xs opacity-50 border-b"
              style={{ borderColor: ui.border }}
            >
              <Th>When</Th>
              <Th>Drug</Th>
              <Th>Action</Th>
              <Th>Qty</Th>
              <Th>Balance</Th>
              <Th className="hidden md:table-cell">Patient / ref</Th>
              <Th className="hidden lg:table-cell">By / witness</Th>
            </tr>
          </thead>
          <tbody>
            {controlledLog.map((l) => (
              <tr
                key={l._id}
                className="border-b last:border-0"
                style={{ borderColor: ui.border }}
              >
                <td className="px-3 py-3.5 text-xs opacity-60">
                  {fmtDateTime(l.at)}
                </td>
                <td className="px-3 py-3.5 text-xs font-semibold">
                  {l.drugName}
                  <p className="font-normal opacity-50">
                    Sch {l.schedule}
                    {l.batchNumber ? ` · ${l.batchNumber}` : ""}
                  </p>
                </td>
                <td className="px-3 py-3.5">
                  <Pill
                    status={l.action}
                    color={
                      l.action === "received"
                        ? "#059669"
                        : l.action === "dispensed"
                        ? "#3b82f6"
                        : "#d97706"
                    }
                  />
                </td>
                <td
                  className="px-3 py-3.5 text-sm font-bold"
                  style={{ color: l.quantity > 0 ? "#059669" : "#dc2626" }}
                >
                  {l.quantity > 0 ? "+" : ""}
                  {l.quantity}
                </td>
                <td className="px-3 py-3.5 text-sm font-semibold">
                  {l.balanceAfter}
                </td>
                <td className="px-3 py-3.5 text-xs opacity-70 hidden md:table-cell">
                  {l.patient ? patientName(l.patient) : "—"}
                  <p className="opacity-50">{l.reference}</p>
                </td>
                <td className="px-3 py-3.5 text-xs opacity-70 hidden lg:table-cell">
                  {personName(l.by)}
                  {l.witness && (
                    <p className="opacity-50">Witness: {l.witness}</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
    </PharmacyPage>
  );
}
