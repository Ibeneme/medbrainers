"use client";

import { useEffect, useState } from "react";
import Link from "@/components/access/guarded-link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { createCarePlan, fetchMyFacilities, fetchPatients } from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { useToast } from "@/contexts/toast-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { CustomDropdown, CustomPopupDatePicker } from "@/components/ui/items";

type DraftItem = { description: string; frequency: string };

export default function NewNursingCarePlanPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors);

  const { activeFacilityId, initialized } = useAppSelector((s) => s.facilities);
  const { list: patients } = useAppSelector((s) => s.patients);

  const [patientId, setPatientId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [goals, setGoals] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<DraftItem[]>([
    { description: "", frequency: "" },
  ]);

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (activeFacilityId) {
      dispatch(fetchPatients({ facilityId: activeFacilityId }));
    }
  }, [dispatch, activeFacilityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFacilityId) return;
    if (!patientId) {
      showToast("Please select a patient", "error");
      return;
    }

    const goalList = goals
      .split("\n")
      .map((g) => g.trim())
      .filter(Boolean);

    const interventions = items
      .map((i) => ({
        description: i.description.trim(),
        frequency: i.frequency.trim() || undefined,
      }))
      .filter((i) => i.description);

    if (!goalList.length && !interventions.length) {
      showToast("Add at least one goal or intervention", "error");
      return;
    }

    setSaving(true);
    try {
      await dispatch(
        createCarePlan({
          facilityId: activeFacilityId,
          payload: {
            patientId,
            diagnosis: diagnosis.trim() || undefined,
            goals: goalList,
            interventions,
            startDate: startDate
              ? new Date(startDate).toISOString()
              : undefined,
            endDate: endDate ? new Date(endDate).toISOString() : undefined,
            notes: notes.trim() || undefined,
          },
        })
      ).unwrap();

      showToast("Nursing care plan created successfully");
      router.push("/dashboard/wards/nursing");
    } catch (err) {
      showToast(
        typeof err === "string" ? err : "Could not create nursing care plan",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition focus:ring-1";

  if (initialized && !activeFacilityId) {
    return (
      <div
        className="mx-auto max-w-lg px-4 py-16 text-center"
        style={{ color: ui.text }}
      >
        <p className="font-bold">Select a facility first</p>
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-3xl space-y-5 px-3 py-5 sm:px-6"
      style={{ color: ui.text }}
    >
      {/* Top navigation / back button */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/wards/nursing"
          aria-label="Back to Nursing Care Plans"
          className="flex h-9 w-9 items-center justify-center rounded-xl border transition hover:opacity-80"
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <ArrowLeft size={15} />
        </Link>
        <div className="">
          <h1 className="text-md font-semibold">
            Create Nursing Care Plan
          </h1>
          <p className="text-[11px] opacity-60">
            Define patient goals, schedule, and clinical interventions.
          </p>
        </div>
        <div className="w-9" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-[28px] p-6 shadow-sm"
        style={{ backgroundColor: ui.card }}
      >
        {/* Patient Selection Dropdown */}
        <CustomDropdown
          label="Patient"
          value={patientId}
          onChange={setPatientId}
          options={patients.map((p) => ({
            label: `${p.firstName || ""} ${p.lastName || ""} · MRN: ${
              p.mrn || "N/A"
            }`,
            value: p._id,
          }))}
          placeholder="Select patient..."
          isDark={isDark}
          colors={colors}
          border={ui.border}
          searchable
        />

        {/* Nursing Diagnosis Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold opacity-70">
            Nursing Diagnosis
          </label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Ineffective airway clearance"
            className={inputClass}
            style={{
              backgroundColor: colors.shadeBgSecond || "transparent",
              borderColor: ui.border,
              color: colors.text,
            }}
          />
        </div>

        {/* Goals Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold opacity-70">
            Goals (one per line)
          </label>
          <textarea
            rows={3}
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="e.g. Patient maintains clear breath sounds within 24 hours"
            className={inputClass}
            style={{
              backgroundColor: colors.shadeBgSecond || "transparent",
              borderColor: ui.border,
              color: colors.text,
            }}
          />
        </div>

        {/* Start and End Custom Date Pickers */}
        <div className="grid gap-4 sm:grid-cols-2">
          <CustomPopupDatePicker
            label="Start Date & Time"
            value={startDate}
            onChange={setStartDate}
            border={ui.border}
            colors={colors}
            isDark={isDark}
            placeholder="Select start date..."
          />
          <CustomPopupDatePicker
            label="End Date & Time (Optional)"
            value={endDate}
            onChange={setEndDate}
            border={ui.border}
            colors={colors}
            isDark={isDark}
            placeholder="Select end date..."
          />
        </div>

        {/* Interventions Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold opacity-70">
              Interventions
            </label>
            <button
              type="button"
              onClick={() =>
                setItems((p) => [...p, { description: "", frequency: "" }])
              }
              className="inline-flex items-center gap-1 text-xs font-semibold hover:opacity-80"
              style={{ color: PRIMARY_COLOR }}
            >
              <Plus size={14} /> Add intervention
            </button>
          </div>

          <div className="space-y-2">
            {items.map((it, n) => (
              <div key={n} className="flex items-center gap-2">
                <input
                  type="text"
                  value={it.description}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((x, i) =>
                        i === n ? { ...x, description: e.target.value } : x
                      )
                    )
                  }
                  placeholder="Intervention description (e.g. Turn patient)"
                  className={inputClass}
                  style={{
                    backgroundColor: colors.shadeBgSecond || "transparent",
                    borderColor: ui.border,
                    color: colors.text,
                  }}
                />
                <input
                  type="text"
                  value={it.frequency}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((x, i) =>
                        i === n ? { ...x, frequency: e.target.value } : x
                      )
                    )
                  }
                  placeholder="Frequency (e.g. Every 2h)"
                  className={`${inputClass} max-w-[140px]`}
                  style={{
                    backgroundColor: colors.shadeBgSecond || "transparent",
                    borderColor: ui.border,
                    color: colors.text,
                  }}
                />
                <button
                  type="button"
                  aria-label="Remove intervention"
                  onClick={() =>
                    setItems((prev) =>
                      prev.length > 1 ? prev.filter((_, i) => i !== n) : prev
                    )
                  }
                  className="p-2 opacity-50 hover:opacity-100 transition shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold opacity-70">
            Additional Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any extra instructions or clinical remarks..."
            className={inputClass}
            style={{
              backgroundColor: colors.shadeBgSecond || "transparent",
              borderColor: ui.border,
              color: colors.text,
            }}
          />
        </div>

        {/* Action Buttons */}
        <div
          className="flex items-center justify-end gap-3 pt-3 border-t"
          style={{ borderColor: ui.border }}
        >
          <Link
            href="/dashboard/wards/nursing"
            className="rounded-full px-5 py-2.5 text-xs font-medium transition hover:opacity-70"
            style={{ backgroundColor: ui.inner }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full px-6 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            {saving ? "Creating plan..." : "Create Care Plan"}
          </button>
        </div>
      </form>
    </div>
  );
}
