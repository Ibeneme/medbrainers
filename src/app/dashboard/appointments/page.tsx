"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchMyFacilities, fetchCalendar } from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";
import { CustomPopupDatePicker } from "@/components/ui/items";

function personName(p: unknown) {
  if (!p || typeof p === "string") return "—";
  const x = p as { firstName?: string; lastName?: string };
  return `${x.firstName || ""} ${x.lastName || ""}`.trim() || "—";
}

type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};



export default function MasterCalendarPage() {
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
  const { calendar, loading } = useAppSelector((s) => s.appointments);
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (!activeFacilityId) return;
    dispatch(
      fetchCalendar({
        facilityId: activeFacilityId,
        from: from ? `${from}T00:00:00.000Z` : undefined,
        to: to ? `${to}T23:59:59.999Z` : undefined,
      })
    );
  }, [dispatch, activeFacilityId, from, to]);

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
                <CalendarDays size={20} />
              </span>
              <h1 className="text-3xl sm:text-4xl font-normal tracking-tight">
                Master calendar
              </h1>
            </div>
            <p className="text-xs opacity-55 mt-1 ml-1">
              {activeFacility?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/appointments/book"
              className="rounded-full px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              Book appointment
            </Link>
            <Link
              href="/dashboard/appointments/queue"
              className="rounded-full border px-4 py-2.5 text-xs font-semibold transition hover:opacity-80"
              style={{ backgroundColor: ui.card, borderColor: border }}
            >
              Queue
            </Link>
            <Link
              href="/dashboard/appointments/triage"
              className="rounded-full border px-4 py-2.5 text-xs font-semibold transition hover:opacity-80"
              style={{ backgroundColor: ui.card, borderColor: border }}
            >
              Triage
            </Link>
          </div>
        </div>

        {/* Date Filter Card */}
        <div
          className="rounded-[28px] border p-5 sm:p-6 space-y-3"
          style={{ backgroundColor: ui.card, borderColor: border }}
        >
          <h2 className="text-sm font-semibold tracking-tight">
            Filter by date range
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <CustomPopupDatePicker
              label="From"
              value={from}
              onChange={setFrom}
              border={border}
              colors={colors}
              isDark={isDark}
            />
            <CustomPopupDatePicker
              label="To"
              value={to}
              onChange={setTo}
              border={border}
              colors={colors}
              isDark={isDark}
            />
          </div>
        </div>

        {/* Calendar Appointments List */}
        <div
          className="rounded-[28px] border overflow-hidden"
          style={{ backgroundColor: ui.card, borderColor: border }}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-xs opacity-60">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading calendar…
            </div>
          ) : calendar.length === 0 ? (
            <div className="p-12 text-center text-xs opacity-60">
              No appointments in this range.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: border }}>
              {calendar.map((a: any) => (
                <div
                  key={a._id}
                  className="p-5 flex flex-wrap items-center justify-between gap-3 text-xs transition"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold tracking-tight">
                      {personName(a.patient)}
                    </p>
                    <p className="opacity-60 flex items-center gap-2">
                      <span>
                        {new Date(a.startAt).toLocaleString()} –{" "}
                        {new Date(a.endAt).toLocaleTimeString()}
                      </span>
                      <span>·</span>
                      <span className="capitalize">
                        Type: <strong className="font-medium">{a.type}</strong>
                      </span>
                    </p>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-[10px] font-bold uppercase border"
                    style={{ backgroundColor: ui.inner, borderColor: border }}
                  >
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
