"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Check,
  ChevronDown,
  Loader2,
  Search,
  Users,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchMyFacilities,
  fetchPatients,
  fetchQueue,
  checkInPatient,
  updateQueueStatus,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { CustomDropdown } from "@/components/ui/items";

function personName(p: unknown) {
  if (!p || typeof p === "string") return "—";
  const x = p as { firstName?: string; lastName?: string; mrn?: string };
  return `${x.firstName || ""} ${x.lastName || ""}`.trim() || x.mrn || "—";
}

type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};



export default function QueuePage() {
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
  const { list: patients } = useAppSelector((s) => s.patients);
  const { queue = [], loading } = useAppSelector((s) => s.appointments);
  const [patientId, setPatientId] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (!activeFacilityId) return;
    dispatch(fetchPatients({ facilityId: activeFacilityId }));
    dispatch(fetchQueue({ facilityId: activeFacilityId }));
  }, [dispatch, activeFacilityId]);

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

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 py-4 sm:py-6">
      <div
        className="relative rounded-[32px] p-4 sm:p-6 space-y-5"
        style={{ backgroundColor: ui.page, color: ui.text }}
      >
        {checkingIn && <DarkBlurOverlayLoader text="Checking in patient..." />}

        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-2xl border"
                style={{
                  backgroundColor: ui.card,
                  borderColor: border,
                  color: PRIMARY_COLOR,
                }}
              >
                <Users size={20} />
              </span>
              <h1 className="text-3xl sm:text-4xl font-normal tracking-tight">
                Patient check-in & queue
              </h1>
            </div>
            <p className="text-xs opacity-55 mt-1 ml-1">
              {activeFacility?.name} · Manage live arrival tickets and queue
              statuses
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/appointments"
              className="rounded-full border px-4 py-2.5 text-xs font-semibold transition hover:opacity-80 outline-none focus:outline-none"
              style={{ backgroundColor: ui.card, borderColor: border }}
            >
              Master calendar
            </Link>
          </div>
        </div>

        {/* Check-in Form */}
        <form
          className="rounded-[28px] border p-5 sm:p-6 space-y-4"
          style={{ backgroundColor: ui.card, borderColor: border }}
          onSubmit={async (e) => {
            e.preventDefault();
            setCheckingIn(true);
            try {
              await dispatch(
                checkInPatient({
                  facilityId: activeFacilityId,
                  payload: { patientId },
                })
              ).unwrap();
              dispatch(fetchQueue({ facilityId: activeFacilityId }));
              setPatientId("");
            } finally {
              setCheckingIn(false);
            }
          }}
        >
          <h2 className="text-lg font-semibold tracking-tight mb-1">
            Check in patient
          </h2>
          <p className="text-xs opacity-60 mb-3">
            Issue a ticket number and add an arriving patient to the active
            consultation queue.
          </p>

          <div className="space-y-3">
            <CustomDropdown
              label="Patient *"
              value={patientId}
              placeholder="Search or select patient to check in…"
              searchable={true}
              options={patients.map((p) => ({
                label: `${p.mrn} · ${p.firstName} ${p.lastName} ${
                  p.gender ? `(${p.gender})` : ""
                }`,
                value: p._id,
              }))}
              onChange={setPatientId}
              isDark={isDark}
              colors={colors}
              border={border}
            />
            <p className="text-[10px] opacity-50">
              Select the registered patient arriving at the front desk or
              reception.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={checkingIn || !patientId}
              className="rounded-full px-6 py-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 outline-none focus:outline-none border border-transparent"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              {checkingIn ? "Checking in..." : "Check in patient"}
            </button>
          </div>
        </form>

        {/* Queue List */}
        <div
          className="rounded-[28px] border overflow-hidden"
          style={{ backgroundColor: ui.card, borderColor: border }}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-xs opacity-60">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading queue…
            </div>
          ) : queue.length === 0 ? (
            <div className="p-12 text-center text-xs opacity-60">
              Queue is currently empty.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: border }}>
              {queue.map((t: any) => {
                const pid = t.patient?._id || t.patient;
                return (
                  <div
                    key={t._id}
                    className="p-5 flex flex-wrap items-center justify-between gap-4 text-xs transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="rounded-xl px-3 py-1 font-mono font-bold text-white text-xs"
                          style={{ backgroundColor: PRIMARY_COLOR }}
                        >
                          {t.ticketNumber}
                        </span>
                        <Link
                          href={`/dashboard/patients/${pid}`}
                          className="text-sm font-semibold tracking-tight hover:underline"
                          style={{ color: PRIMARY_COLOR }}
                        >
                          {personName(t.patient)}
                        </Link>
                      </div>
                      <p className="opacity-60">
                        Priority:{" "}
                        <strong className="font-medium">{t.priority}</strong> ·
                        Status:{" "}
                        <strong className="font-medium capitalize">
                          {t.status}
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {["called", "serving", "done"].map((st) => {
                        const isActive = t.status === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() =>
                              dispatch(
                                updateQueueStatus({
                                  facilityId: activeFacilityId,
                                  ticketId: t._id,
                                  status: st,
                                })
                              ).then(() =>
                                dispatch(
                                  fetchQueue({ facilityId: activeFacilityId })
                                )
                              )
                            }
                            className="rounded-full border px-3 py-1.5 text-[11px] font-semibold capitalize transition hover:opacity-80"
                            style={{
                              backgroundColor: isActive
                                ? PRIMARY_COLOR
                                : ui.inner,
                              color: isActive ? "#fff" : colors.text,
                              borderColor: isActive ? PRIMARY_COLOR : border,
                            }}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
