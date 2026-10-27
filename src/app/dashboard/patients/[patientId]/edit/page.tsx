"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Edit3, User } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import type { Gender } from "@/api/types";
import { fetchPatient, updatePatient } from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR, getUI } from "@/constants/colors";
import { CustomDropdown } from "@/components/ui";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { CustomPopupDatePicker } from "@/components/ui/items";

const inputCls =
  "w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/20";

export default function EditPatientPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = String(params.patientId || "");
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const ui = getUI(isDark, colors, border);

  const { activeFacilityId } = useAppSelector((s) => s.facilities);
  const { current, detailLoading, saving } = useAppSelector((s) => s.patients);

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Form Fields
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editMiddleName, setEditMiddleName] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editBloodGroup, setEditBloodGroup] = useState("");
  const [editCountryCode, setEditCountryCode] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNationalId, setEditNationalId] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    if (!activeFacilityId || !patientId) return;
    dispatch(fetchPatient({ facilityId: activeFacilityId, patientId }));
  }, [dispatch, activeFacilityId, patientId]);

  // Sync form inputs when patient data loads
  useEffect(() => {
    if (current) {
      setEditFirstName(current.firstName || "");
      setEditLastName(current.lastName || "");
      setEditMiddleName(current.middleName || "");
      setEditDob(
        current.dateOfBirth
          ? new Date(current.dateOfBirth).toISOString().split("T")[0]
          : ""
      );
      setEditGender(current.gender || "");
      setEditBloodGroup(current.bloodGroup || "");
      setEditCountryCode(current.countryCode || "");
      setEditPhone(current.phone || "");
      setEditNationalId(current.nationalId || "");
      setEditStatus(current.status || "active");
      setEditNotes(current.notes || "");
    }
  }, [current]);

  const notify = (m: string, isErr = false) => {
    if (isErr) setErr(m);
    else setMsg(m);
    setTimeout(() => {
      setMsg(null);
      setErr(null);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFacilityId || !patientId) return;

    try {
      const payload = {
        firstName: editFirstName,
        lastName: editLastName,
        middleName: editMiddleName || undefined,
        dateOfBirth: editDob || undefined,
        gender: (editGender || undefined) as Gender | undefined,
        bloodGroup: editBloodGroup || undefined,
        countryCode: editCountryCode || undefined,
        phone: editPhone || undefined,
        nationalId: editNationalId || undefined,
        status: editStatus,
        notes: editNotes || undefined,
      };

      await dispatch(
        updatePatient({ facilityId: activeFacilityId, patientId, payload })
      ).unwrap();
      notify("Patient details updated successfully");
      setTimeout(() => {
        router.push(`/dashboard/patients/${patientId}`);
      }, 1000);
    } catch (e: unknown) {
      notify(
        typeof e === "string" ? e : "Failed to update patient details",
        true
      );
    }
  };

  const inputStyle = {
    backgroundColor: ui.inner,
    color: ui.text,
    borderColor: "transparent",
    boxShadow: "none",
  };

  return (
    <div className="mx-auto max-w-4xl px-3 sm:px-6 py-4 sm:py-6">
      <div
        className="relative rounded-[32px] p-6 sm:p-8 space-y-6"
        style={{ backgroundColor: colors.shadeBgSecond, color: ui.text }}
      >
        {detailLoading && !current && (
          <DarkBlurOverlayLoader text="Loading patient information..." />
        )}

        {(msg || err) && (
          <div
            className="fixed right-4 top-4 rounded-2xl px-4 py-3 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              zIndex: 80,
              backgroundColor: ui.card,
              color: err ? "#ef4444" : "#059669",
            }}
            role="status"
          >
            {msg || err}
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs opacity-70">
          <Link href="/dashboard/patients" className="hover:opacity-100">
            Patients
          </Link>
          <ChevronRight size={12} />
          <Link
            href={`/dashboard/patients/${patientId}`}
            className="hover:opacity-100"
          >
            {current ? `${current.firstName} ${current.lastName}` : "Patient"}
          </Link>
          <ChevronRight size={12} />
          <span className="font-semibold">Edit Information</span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: ui.card, color: PRIMARY_COLOR }}
          >
            <Edit3 size={24} />
          </span>
          <div>
            <h1 className="text-2xl font-normal tracking-tight">
              Edit Patient Details
            </h1>
            <p className="text-xs opacity-60">
              Update demographics, contact numbers, status, and clinical notes
            </p>
          </div>
        </div>

        {current && (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div
              className="rounded-[28px] p-6 space-y-4"
              style={{ backgroundColor: ui.card }}
            >
              <h2 className="text-sm font-semibold">Personal Information</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium opacity-80">
                    First Name *
                  </label>
                  <input
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    placeholder="First name"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium opacity-80">
                    Last Name *
                  </label>
                  <input
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    placeholder="Last name"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium opacity-80">
                  Middle Name
                </label>
                <input
                  value={editMiddleName}
                  onChange={(e) => setEditMiddleName(e.target.value)}
                  placeholder="Middle name"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium opacity-80">
                    Date of Birth
                  </label>
                  <CustomPopupDatePicker
                    label="Date of Birth"
                    value={editDob}
                    onChange={setEditDob}
                    isDark={isDark}
                    colors={colors}
                    border={border}
                  />
                </div>
                <CustomDropdown
                  label="Gender"
                  value={editGender}
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other", label: "Other" },
                    { value: "unknown", label: "Unknown" },
                  ]}
                  onChange={setEditGender}
                  isDark={isDark}
                  colors={colors}
                  border={border}
                />
              </div>
            </div>

            <div
              className="rounded-[28px] p-6 space-y-4"
              style={{ backgroundColor: ui.card }}
            >
              <h2 className="text-sm font-semibold">Contact & Identifiers</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium opacity-80">
                    Blood Group
                  </label>
                  <input
                    value={editBloodGroup}
                    onChange={(e) => setEditBloodGroup(e.target.value)}
                    placeholder="e.g. O+"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium opacity-80">
                      Code
                    </label>
                    <input
                      value={editCountryCode}
                      onChange={(e) => setEditCountryCode(e.target.value)}
                      placeholder="+234"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1.5 block text-xs font-medium opacity-80">
                      Phone Number
                    </label>
                    <input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Phone number"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium opacity-80">
                    National ID
                  </label>
                  <input
                    value={editNationalId}
                    onChange={(e) => setEditNationalId(e.target.value)}
                    placeholder="National ID"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
                <CustomDropdown
                  label="Status"
                  value={editStatus}
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                    { value: "archived", label: "Archived" },
                    { value: "deceased", label: "Deceased" },
                  ]}
                  onChange={setEditStatus}
                  isDark={isDark}
                  colors={colors}
                  border={border}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium opacity-80">
                  Clinical Notes / Remarks
                </label>
                <textarea
                  rows={4}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Additional patient notes..."
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Link
                href={`/dashboard/patients/${patientId}`}
                className="rounded-full px-6 py-3 text-xs font-semibold"
                style={{ backgroundColor: ui.card }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full px-6 py-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                {saving ? "Saving Changes..." : "Save Patient Info"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
