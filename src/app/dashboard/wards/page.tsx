"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BedDouble, Building2, Loader2, Plus, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchMyFacilities, fetchWards, createWard } from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";

type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};

export default function WardsPage() {
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";

  const ui: UI = {
    isDark,
    page: isDark ? "rgba(255,255,255,0.03)" : "#eef2f7",
    card: isDark ? colors.shadeBg : "#ffffff",
    inner: isDark ? colors.shadeBgSecond : "#f3f5f9",
    text: colors.text,
    border,
  };

  const { activeFacilityId, activeFacility } = useAppSelector(
    (s) => s.facilities
  );
  const { wards, loading, saving } = useAppSelector((s) => s.wards);
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [bedCodes, setBedCodes] = useState("A1,A2,A3");

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (activeFacilityId) dispatch(fetchWards(activeFacilityId));
  }, [dispatch, activeFacilityId]);

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) setShow(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, saving]);

  if (!activeFacilityId) {
    return (
      <div
        className="max-w-lg mx-auto px-4 py-16 text-center"
        style={{ color: colors.text }}
      >
        <Building2 className="mx-auto opacity-30 mb-3" size={32} />
        <p className="font-bold">Select a facility first</p>
      </div>
    );
  }

  const inputStyle = {
    backgroundColor: ui.inner,
    color: ui.text,
    borderColor: "transparent",
    boxShadow: "none",
  };

  const inputCls =
    "w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/25";

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 py-4 sm:py-6">
      <div
        className="relative rounded-[32px] p-4 sm:p-6 space-y-5"
        style={{ backgroundColor: ui.page, color: ui.text }}
      >
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                style={{ backgroundColor: ui.card, color: PRIMARY_COLOR }}
              >
                <BedDouble size={20} />
              </span>
              <h1 className="text-3xl sm:text-4xl font-normal tracking-tight">
                Ward & bed management
              </h1>
            </div>
            <p className="text-xs opacity-55 mt-1 ml-1">
              {activeFacility?.name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/wards/admissions"
              className="rounded-full px-4 py-2.5 text-xs font-semibold transition hover:opacity-80 outline-none focus:outline-none"
              style={{ backgroundColor: ui.card }}
            >
              Admissions
            </Link>
            <Link
              href="/dashboard/wards/nursing"
              className="rounded-full px-4 py-2.5 text-xs font-semibold transition hover:opacity-80 outline-none focus:outline-none"
              style={{ backgroundColor: ui.card }}
            >
              Care plans
            </Link>
            <Link
              href="/dashboard/wards/discharges"
              className="rounded-full px-4 py-2.5 text-xs font-semibold transition hover:opacity-80 outline-none focus:outline-none"
              style={{ backgroundColor: ui.card }}
            >
              Discharges
            </Link>
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 outline-none focus:outline-none"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Plus size={14} /> Ward
            </button>
          </div>
        </div>

        {/* Create Ward Modal/Box */}
        {show && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !saving) setShow(false);
            }}
          >
            <div
              className="w-full max-w-lg rounded-[28px] p-6 space-y-5 shadow-xl"
              style={{ backgroundColor: ui.card, color: ui.text }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium tracking-tight">
                  Create new ward
                </h3>
                <button
                  type="button"
                  onClick={() => setShow(false)}
                  disabled={saving}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-full opacity-70 hover:opacity-100 outline-none focus:outline-none"
                  style={{ backgroundColor: ui.inner }}
                >
                  <X size={15} />
                </button>
              </div>

              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await dispatch(
                    createWard({
                      facilityId: activeFacilityId,
                      payload: {
                        name,
                        code,
                        beds: bedCodes
                          .split(",")
                          .map((c) => c.trim())
                          .filter(Boolean)
                          .map((c) => ({ code: c })),
                      },
                    })
                  ).unwrap();
                  setShow(false);
                  setName("");
                  setCode("");
                  dispatch(fetchWards(activeFacilityId));
                }}
              >
                <div>
                  <label className="mb-1.5 block text-xs font-medium opacity-60">
                    Ward name *
                  </label>
                  <input
                    required
                    placeholder="e.g. General Ward A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls}
                    style={inputStyle}
                  />
                  <p className="text-[10px] opacity-50 mt-1">
                    Enter the descriptive display name of the ward.
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium opacity-60">
                    Code *
                  </label>
                  <input
                    required
                    placeholder="e.g. WARD-A"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className={inputCls}
                    style={inputStyle}
                  />
                  <p className="text-[10px] opacity-50 mt-1">
                    Unique identifier code for system reference.
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium opacity-60">
                    Beds (comma-separated)
                  </label>
                  <input
                    placeholder="e.g. A1, A2, A3"
                    value={bedCodes}
                    onChange={(e) => setBedCodes(e.target.value)}
                    className={inputCls}
                    style={inputStyle}
                  />
                  <p className="text-[10px] opacity-50 mt-1">
                    Specify initial bed labels separated by commas.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShow(false)}
                    disabled={saving}
                    className="rounded-full px-5 py-2.5 text-xs font-semibold disabled:opacity-50 outline-none focus:outline-none"
                    style={{ backgroundColor: ui.inner }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-full px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 outline-none focus:outline-none"
                    style={{ backgroundColor: PRIMARY_COLOR }}
                  >
                    {saving ? "Creating..." : "Create ward"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Wards Listing */}
        {loading ? (
          <div className="flex items-center gap-2 py-12 justify-center text-xs opacity-60">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading wards…
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wards.map((w) => (
              <div
                key={w._id}
                className="rounded-[28px] p-5 space-y-3 transition"
                style={{ backgroundColor: ui.card }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight">
                      {w.name}
                    </h2>
                    <p className="text-xs font-mono opacity-50 uppercase mt-0.5">
                      {w.code}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-semibold capitalize"
                    style={{ backgroundColor: ui.inner }}
                  >
                    {w.type || "General"} · {w.beds?.length || 0} beds
                  </span>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  {(w.beds || []).map((b) => (
                    <span
                      key={b.code}
                      className="rounded-xl px-3 py-1.5 text-xs font-semibold transition"
                      style={{
                        backgroundColor:
                          b.status === "available"
                            ? `${PRIMARY_COLOR}22`
                            : b.status === "occupied"
                            ? "rgba(239,68,68,0.15)"
                            : ui.inner,
                        color:
                          b.status === "available"
                            ? PRIMARY_COLOR
                            : b.status === "occupied"
                            ? "#dc2626"
                            : ui.text,
                      }}
                    >
                      {b.code} · <span className="capitalize">{b.status}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {wards.length === 0 && (
              <div
                className="rounded-[28px] p-12 text-center text-xs opacity-60 md:col-span-2"
                style={{ backgroundColor: ui.card }}
              >
                No wards yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
