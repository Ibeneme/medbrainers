"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "@/components/access/guarded-link";
import {
  ChevronRight,
  Plus,
  Trash2,
  Save,
  FlaskConical,
  Info,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchLaboratory, upsertLaboratory } from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { useFacilityId } from "@/hooks/useFacilityId";

export default function LabSetupPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";

  const ui = getUI(isDark, colors, colors?.border);

  // Use the comprehensive useFacilityId hook
  const { facilityId, activeFacility, facilitiesLoading } = useFacilityId();

  const { laboratory, listLoading } = useAppSelector((s) => s.labs);

  const [labName, setLabName] = useState("");
  const [departments, setDepartments] = useState<
    Array<{ name: string; code: string; description?: string }>
  >([]);
  const [showGuide, setShowGuide] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const companyDisplayName = activeFacility?.name || "Company";

  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchLaboratory({ facilityId }));
  }, [dispatch, facilityId]);

  useEffect(() => {
    if (laboratory) {
      setLabName(laboratory.name || "");
      setDepartments(laboratory.departments || []);
    }
  }, [laboratory]);

  const notify = (m: string, isErr = false) => {
    if (isErr) setErr(m);
    else setMsg(m);
    setTimeout(() => {
      setMsg(null);
      setErr(null);
    }, 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId) {
      notify("Active facility ID not found", true);
      return;
    }

    try {
      setSaving(true);
      await dispatch(
        upsertLaboratory({
          facilityId,
          payload: { name: labName, departments },
        })
      ).unwrap();
      notify("Laboratory setup saved successfully");
      setTimeout(() => router.push(`/dashboard/labs`), 1000);
    } catch (e: unknown) {
      notify(typeof e === "string" ? e : "Failed to save setup", true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-none px-3 sm:px-6 py-6 space-y-6">
      {(listLoading || facilitiesLoading) && !laboratory && (
        <DarkBlurOverlayLoader text="Loading lab setup..." />
      )}

      {(msg || err) && (
        <div
          className="fixed right-4 top-4 rounded-2xl px-4 py-3 text-xs font-semibold z-50"
          style={{
            backgroundColor: ui.card,
            color: err ? "#ef4444" : "#059669",
          }}
        >
          {msg || err}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs opacity-70">
        <Link
          href={facilityId ? `/dashboard/labs` : `/dashboard`}
          className="hover:opacity-100"
        >
          Laboratory Home
        </Link>
        <ChevronRight size={12} />
        <span className="font-semibold">Lab Setup & Departments</span>
      </div>

      <div
        className="rounded-[32px] p-6 sm:p-8 space-y-6"
        style={{ backgroundColor: ui.card, color: ui.text }}
      >
        <div
          className="flex items-center gap-3 pb-2 border-b"
          style={{ borderColor: ui.border }}
        >
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: ui.inner, color: PRIMARY_COLOR }}
          >
            <FlaskConical size={24} />
          </span>
          <div>
            <h1 className="text-xl font-bold">
              Configure Laboratory ({companyDisplayName})
            </h1>
            <p className="text-xs opacity-60">
              Manage your company&apos;s laboratory name and active departments.
            </p>
          </div>
        </div>

        {/* Guide & Tips Box with Faint Red Theme */}
        <div
          className="rounded-[24px] p-4 border text-xs space-y-3 transition-all"
          style={{
            backgroundColor: isDark ? "rgba(127, 29, 29, 0.2)" : "#fef2f2",
            borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "#fecaca",
            color: isDark ? "#fca5a5" : "#991b1b",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <Info
                size={15}
                style={{ color: isDark ? "#f87171" : "#dc2626" }}
              />
              <span>Lab Setup Guide & Configuration Tips</span>
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-[11px] font-medium opacity-80 hover:opacity-100 transition underline"
            >
              {showGuide ? "Hide Guide" : "Show Guide"}
            </button>
          </div>

          <p className="opacity-90 leading-relaxed">
            Define your main laboratory name and organize clinical workflows by
            configuring separate diagnostic departments and short unit codes.
          </p>

          {showGuide && (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t text-[11px]"
              style={{
                borderColor: isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
              }}
            >
              <div className="space-y-1.5">
                <p className="font-semibold opacity-100">Laboratory Naming</p>
                <ul className="list-disc list-inside opacity-90 space-y-1">
                  <li>
                    Enter the official facility or diagnostic laboratory name.
                  </li>
                  <li>
                    Used across patient request headers and report outputs.
                  </li>
                </ul>
              </div>
              <div className="space-y-1.5">
                <p className="font-semibold opacity-100">Departments & Codes</p>
                <ul className="list-disc list-inside opacity-90 space-y-1">
                  <li>
                    <strong>Department Name:</strong> E.g., Hematology,
                    Chemistry, Microbiology.
                  </li>
                  <li>
                    <strong>Department Code:</strong> Short unique identifier
                    (e.g., HEM, BIO).
                  </li>
                  <li>
                    <strong>Scope:</strong> Add detailed descriptions or testing
                    guidelines.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="mb-2 block text-xs font-semibold opacity-70">
              Laboratory Name *
            </label>
            <input
              required
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              placeholder="e.g. Central Diagnostic Laboratory"
              className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
              style={{
                backgroundColor: ui.inner,
                color: ui.text,
                borderColor: "transparent",
              }}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold opacity-70">
                Departments & Units
              </label>
              <button
                type="button"
                onClick={() =>
                  setDepartments([
                    ...departments,
                    { name: "", code: "", description: "" },
                  ])
                }
                className="inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: PRIMARY_COLOR }}
              >
                <Plus size={14} /> Add Department
              </button>
            </div>

            {departments.length === 0 ? (
              <div
                className="rounded-2xl p-6 text-center text-xs opacity-50 border border-dashed"
                style={{ borderColor: ui.border }}
              >
                No departments added yet. Add departments like Hematology,
                Chemistry, or Microbiology.
              </div>
            ) : (
              departments.map((dept, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl p-4 space-y-3"
                  style={{ backgroundColor: ui.inner }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      required
                      placeholder="Department Name (e.g. Hematology)"
                      value={dept.name}
                      onChange={(e) => {
                        const up = [...departments];
                        up[idx].name = e.target.value;
                        setDepartments(up);
                      }}
                      className="w-full rounded-xl border px-3 py-2.5 text-xs outline-none"
                      style={{
                        backgroundColor: ui.card,
                        color: ui.text,
                        borderColor: "transparent",
                      }}
                    />
                    <input
                      required
                      placeholder="Code (e.g. HEM)"
                      value={dept.code}
                      onChange={(e) => {
                        const up = [...departments];
                        up[idx].code = e.target.value.toUpperCase();
                        setDepartments(up);
                      }}
                      className="w-full rounded-xl border px-3 py-2.5 text-xs outline-none uppercase"
                      style={{
                        backgroundColor: ui.card,
                        color: ui.text,
                        borderColor: "transparent",
                      }}
                    />
                  </div>
                  <div className="flex items-start gap-2">
                    <textarea
                      rows={4}
                      placeholder="Department description or detailed scope..."
                      value={dept.description || ""}
                      onChange={(e) => {
                        const up = [...departments];
                        up[idx].description = e.target.value;
                        setDepartments(up);
                      }}
                      className="w-full rounded-xl border px-3 py-2.5 text-xs outline-none resize-y"
                      style={{
                        backgroundColor: ui.card,
                        color: ui.text,
                        borderColor: "transparent",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDepartments(departments.filter((_, i) => i !== idx))
                      }
                      className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link
              href={facilityId ? `/dashboard/labs` : `/dashboard`}
              className="rounded-full px-6 py-3 text-xs font-semibold"
              style={{ backgroundColor: ui.inner }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Save size={14} /> {saving ? "Saving..." : "Save Setup"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
