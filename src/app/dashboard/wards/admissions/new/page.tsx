"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  admitPatient,
  fetchMyFacilities,
  fetchPatients,
  fetchWards,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { useToast } from "@/contexts/toast-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { CustomDropdown } from "@/components/ui/items";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";

function patientIdOf(p: unknown) {
  if (!p || typeof p === "string") return p || "";
  const x = p as { _id?: string };
  return x._id || "";
}

export default function NewAdmissionPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const ui = getUI(isDark, colors);

  const { activeFacilityId } = useAppSelector((s) => s.facilities);
  const { list: patients } = useAppSelector((s) => s.patients);
  const { wards, admissions, saving } = useAppSelector((s) => s.wards);

  const [patientId, setPatientId] = useState("");
  const [wardId, setWardId] = useState("");
  const [bedCode, setBedCode] = useState("");
  const [diagnosis, setDiagnosis] = useState("");

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (!activeFacilityId) return;
    dispatch(fetchPatients({ facilityId: activeFacilityId }));
    dispatch(fetchWards(activeFacilityId));
  }, [dispatch, activeFacilityId]);

  const admittedPatientIds = new Set(
    admissions
      .filter((a) => a.status === "admitted")
      .map((a) => patientIdOf(a.patient))
  );

  const availablePatients = patients.filter(
    (p) => !admittedPatientIds.has(p._id)
  );

  const selectedWard = wards.find((w) => w._id === wardId);
  const freeBeds = (selectedWard?.beds || []).filter(
    (b) => b.status === "available"
  );

  const fieldCls =
    "w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none bg-transparent";

  return (
    <div
      className="relative mx-auto max-w-2xl px-3 sm:px-6 py-6 space-y-6"
      style={{ color: ui.text }}
    >
      {saving && <DarkBlurOverlayLoader text="Admitting patient..." />}

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/wards/admissions"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition hover:opacity-80"
          style={{ borderColor: ui.border }}
        >
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            New patient admission
          </h1>
          <p className="text-xs opacity-60">
            Walk-in or direct inpatient admission
          </p>
        </div>
      </div>

      <form
        className="rounded-2xl p-6 space-y-4"
        style={{ backgroundColor: ui.card }}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!activeFacilityId) return;
          try {
            await dispatch(
              admitPatient({
                facilityId: activeFacilityId,
                payload: {
                  patientId,
                  wardId,
                  bedCode,
                  admittingDiagnosis: diagnosis || undefined,
                },
              })
            ).unwrap();
            showToast("Patient admitted successfully");
            router.push("/dashboard/wards/admissions");
          } catch (err) {
            showToast(
              typeof err === "string" ? err : "Could not admit patient",
              "error"
            );
          }
        }}
      >
        <div className="space-y-4">
          <div>
            <CustomDropdown
              label="Patient *"
              value={patientId}
              placeholder="Search unadmitted patient…"
              searchable={true}
              options={availablePatients.map((p) => ({
                label: `${p.mrn} · ${p.firstName} ${p.lastName} ${
                  p.gender ? `(${p.gender})` : ""
                }`,
                value: p._id,
              }))}
              onChange={setPatientId}
              isDark={isDark}
              colors={colors}
              border={ui.border}
            />
            <p className="text-[10px] opacity-50 mt-1">
              Only patients who are not currently admitted appear here.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <CustomDropdown
                label="Ward *"
                value={wardId}
                placeholder="Select ward…"
                options={wards.map((w) => ({
                  label: `${w.name} (${w.code})`,
                  value: w._id,
                }))}
                onChange={(val) => {
                  setWardId(val);
                  setBedCode("");
                }}
                isDark={isDark}
                colors={colors}
                border={ui.border}
              />
            </div>

            <div>
              <CustomDropdown
                label="Bed *"
                value={bedCode}
                placeholder={
                  wardId ? "Select available bed…" : "Select ward first…"
                }
                options={freeBeds.map((b) => ({
                  label: `Bed ${b.code}`,
                  value: b.code,
                }))}
                onChange={setBedCode}
                isDark={isDark}
                colors={colors}
                border={ui.border}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium opacity-70">
              Admitting Diagnosis
            </label>
            <input
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Clinical reason or provisional diagnosis..."
              className={fieldCls}
              style={{ borderColor: ui.border, color: ui.text }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Link
            href="/dashboard/wards/admissions"
            className="rounded-xl border px-4 py-2 text-xs font-medium transition hover:opacity-80"
            style={{ borderColor: ui.border }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !patientId || !wardId || !bedCode}
            className="rounded-xl px-4 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            {saving ? "Admitting..." : "Admit patient"}
          </button>
        </div>
      </form>
    </div>
  );
}
