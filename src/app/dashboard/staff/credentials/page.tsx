"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  Loader2,
  Plus,
  Save,
  Shield,
  Trash2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchMyFacilities,
  fetchStaffDirectory,
  updateStaffCredentials,
} from "@/api/slices";
import type { StaffCredential, StaffDirectoryMember } from "@/api/types";
import { formatRole } from "@/api/types";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";

const COMMON_PRIVILEGES = [
  "prescribe",
  "admit",
  "discharge",
  "order_labs",
  "order_imaging",
  "view_billing",
  "manage_roster",
  "surgery",
];

export default function CredentialsPage() {
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  const { activeFacilityId, activeFacility } = useAppSelector((s) => s.facilities);
  const { directory, directoryLoading, saving } = useAppSelector((s) => s.staff);

  const [selected, setSelected] = useState<StaffDirectoryMember | null>(null);
  const [privileges, setPrivileges] = useState<string[]>([]);
  const [customPriv, setCustomPriv] = useState("");
  const [credentials, setCredentials] = useState<StaffCredential[]>([]);
  const [staffCode, setStaffCode] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [toastErr, setToastErr] = useState(false);

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (activeFacilityId) {
      dispatch(fetchStaffDirectory({ facilityId: activeFacilityId }));
    }
  }, [dispatch, activeFacilityId]);

  useEffect(() => {
    if (!selected) return;
    setPrivileges([...(selected.privileges || [])]);
    setCredentials(
      (selected.credentials || []).map((c) => ({
        ...c,
        issuedAt: c.issuedAt ? String(c.issuedAt).slice(0, 10) : undefined,
        expiresAt: c.expiresAt ? String(c.expiresAt).slice(0, 10) : undefined,
      })),
    );
    setStaffCode(selected.staffCode || "");
    setJobTitle(selected.jobTitle || selected.title || "");
  }, [selected]);

  const notify = (msg: string, err = false) => {
    setToast(msg);
    setToastErr(err);
    setTimeout(() => setToast(null), 3200);
  };

  const togglePriv = (p: string) => {
    setPrivileges((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };

  const addCredential = () => {
    setCredentials((prev) => [
      ...prev,
      { name: "", number: "", issuer: "", verified: false },
    ]);
  };

  const save = async () => {
    if (!activeFacilityId || !selected) return;
    const cleaned = credentials
      .map((c) => ({
        name: c.name.trim(),
        number: c.number?.trim() || undefined,
        issuer: c.issuer?.trim() || undefined,
        issuedAt: c.issuedAt || undefined,
        expiresAt: c.expiresAt || undefined,
        verified: Boolean(c.verified),
        notes: c.notes?.trim() || undefined,
      }))
      .filter((c) => c.name);

    try {
      await dispatch(
        updateStaffCredentials({
          facilityId: activeFacilityId,
          memberId: selected.id,
          payload: {
            privileges,
            credentials: cleaned,
            staffCode: staffCode.trim() || undefined,
            jobTitle: jobTitle.trim() || undefined,
          },
        }),
      ).unwrap();
      notify("Privileges & credentials saved for this facility");
      dispatch(fetchStaffDirectory({ facilityId: activeFacilityId }));
    } catch (err: unknown) {
      notify(typeof err === "string" ? err : "Save failed", true);
    }
  };

  if (!activeFacilityId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center" style={{ color: colors.text }}>
        <Building2 className="mx-auto opacity-30 mb-3" size={32} />
        <p className="font-bold">Select a facility first</p>
        <Link href="/dashboard/workspace" className="mt-4 inline-block text-sm underline opacity-70">
          Workspace
        </Link>
      </div>
    );
  }

  const inputStyle = {
    backgroundColor: colors.shadeBgSecond,
    color: colors.text,
    borderColor: border,
  };

  return (
    <div
      className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-5"
      style={{ color: colors.text }}
    >
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-lg ${
            toastErr ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <BadgeCheck size={20} style={{ color: PRIMARY_COLOR }} />
            Privileges & Credentials
          </h1>
          <p className="mt-1 text-xs opacity-60">
            {activeFacility?.name} · scoped to this facility only (same person can
            differ at another facility)
          </p>
        </div>
        <Link
          href="/dashboard/workspace/teams"
          className="rounded-xl border px-3 py-2 text-xs font-semibold"
          style={{ borderColor: border, backgroundColor: colors.shadeBg }}
        >
          Staff Directory
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div
          className="lg:col-span-2 rounded-2xl border overflow-hidden max-h-[70vh] overflow-y-auto"
          style={{ borderColor: border, backgroundColor: colors.shadeBg }}
        >
          <div className="px-4 py-3 text-xs font-bold uppercase opacity-50 border-b" style={{ borderColor: border }}>
            Select staff
          </div>
          {directoryLoading ? (
            <div className="flex justify-center gap-2 p-8 text-xs opacity-60">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            <ul>
              {directory.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(m)}
                    className="w-full text-left px-4 py-3 border-b transition hover:opacity-90"
                    style={{
                      borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                      backgroundColor:
                        selected?.id === m.id ? colors.shadeBgSecond : "transparent",
                    }}
                  >
                    <p className="text-sm font-semibold">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="text-[11px] opacity-50 mt-0.5">
                      {formatRole(m.role || "staff")}
                      {m.phone ? ` · ${m.countryCode || ""} ${m.phone}` : ""}
                    </p>
                  </button>
                </li>
              ))}
              {directory.length === 0 && (
                <li className="p-8 text-center text-xs opacity-50">No staff yet</li>
              )}
            </ul>
          )}
        </div>

        <div
          className="lg:col-span-3 rounded-2xl border p-5 space-y-5"
          style={{ borderColor: border, backgroundColor: colors.shadeBg }}
        >
          {!selected ? (
            <div className="py-16 text-center text-sm opacity-50">
              Select a staff member to manage privileges and credentials.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl border text-xs font-bold"
                  style={{ borderColor: border, backgroundColor: colors.shadeBgSecond }}
                >
                  {(selected.firstName?.[0] || "") + (selected.lastName?.[0] || "")}
                </div>
                <div>
                  <p className="font-bold text-sm">
                    {selected.firstName} {selected.lastName}
                  </p>
                  <p className="text-xs opacity-50">{selected.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold opacity-60">
                    Staff code
                  </label>
                  <input
                    value={staffCode}
                    onChange={(e) => setStaffCode(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm"
                    style={inputStyle}
                    placeholder="e.g. DOC-042"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold opacity-60">
                    Job title (this facility)
                  </label>
                  <input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm"
                    style={inputStyle}
                    placeholder="e.g. Consultant Cardiologist"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold">
                  <Shield size={13} /> Privileges
                </p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_PRIVILEGES.map((p) => {
                    const on = privileges.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePriv(p)}
                        className="rounded-full border px-3 py-1 text-[11px] font-semibold"
                        style={{
                          borderColor: on ? PRIMARY_COLOR : border,
                          backgroundColor: on ? PRIMARY_COLOR : "transparent",
                          color: on ? "#fff" : colors.text,
                        }}
                      >
                        {p.replace(/_/g, " ")}
                      </button>
                    );
                  })}
                  {privileges
                    .filter((p) => !COMMON_PRIVILEGES.includes(p))
                    .map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePriv(p)}
                        className="rounded-full border px-3 py-1 text-[11px] font-semibold text-white"
                        style={{ borderColor: PRIMARY_COLOR, backgroundColor: PRIMARY_COLOR }}
                      >
                        {p}
                      </button>
                    ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    value={customPriv}
                    onChange={(e) => setCustomPriv(e.target.value)}
                    placeholder="Custom privilege"
                    className="flex-1 rounded-xl border px-3 py-2 text-xs"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const v = customPriv.trim().toLowerCase().replace(/\s+/g, "_");
                      if (v && !privileges.includes(v)) {
                        setPrivileges((prev) => [...prev, v]);
                        setCustomPriv("");
                      }
                    }}
                    className="rounded-xl border px-3 py-2 text-xs font-semibold"
                    style={{ borderColor: border }}
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-xs font-bold">
                    <BadgeCheck size={13} /> Credentials / licenses
                  </p>
                  <button
                    type="button"
                    onClick={addCredential}
                    className="inline-flex items-center gap-1 text-xs font-semibold"
                    style={{ color: PRIMARY_COLOR }}
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
                <div className="space-y-3">
                  {credentials.map((c, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border p-3"
                      style={{ borderColor: border, backgroundColor: colors.shadeBgSecond }}
                    >
                      <input
                        value={c.name}
                        onChange={(e) => {
                          const next = [...credentials];
                          next[i] = { ...next[i], name: e.target.value };
                          setCredentials(next);
                        }}
                        placeholder="Credential name *"
                        className="rounded-lg border px-2.5 py-2 text-xs"
                        style={inputStyle}
                      />
                      <input
                        value={c.number || ""}
                        onChange={(e) => {
                          const next = [...credentials];
                          next[i] = { ...next[i], number: e.target.value };
                          setCredentials(next);
                        }}
                        placeholder="Number"
                        className="rounded-lg border px-2.5 py-2 text-xs"
                        style={inputStyle}
                      />
                      <input
                        value={c.issuer || ""}
                        onChange={(e) => {
                          const next = [...credentials];
                          next[i] = { ...next[i], issuer: e.target.value };
                          setCredentials(next);
                        }}
                        placeholder="Issuer"
                        className="rounded-lg border px-2.5 py-2 text-xs"
                        style={inputStyle}
                      />
                      <input
                        type="date"
                        value={c.expiresAt || ""}
                        onChange={(e) => {
                          const next = [...credentials];
                          next[i] = { ...next[i], expiresAt: e.target.value };
                          setCredentials(next);
                        }}
                        className="rounded-lg border px-2.5 py-2 text-xs"
                        style={inputStyle}
                      />
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={Boolean(c.verified)}
                          onChange={(e) => {
                            const next = [...credentials];
                            next[i] = { ...next[i], verified: e.target.checked };
                            setCredentials(next);
                          }}
                        />
                        Verified
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setCredentials((prev) => prev.filter((_, j) => j !== i))
                        }
                        className="justify-self-end text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {credentials.length === 0 && (
                    <p className="text-xs opacity-50">No credentials added yet.</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <Save size={14} /> {saving ? "Saving…" : "Save for this facility"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
