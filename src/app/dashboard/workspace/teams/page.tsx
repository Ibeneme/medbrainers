"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import {
  Users,
  Shield,
  Building2,
  Loader2,
  Search,
  Phone,
  BadgeCheck,
  Check,
  ChevronDown,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { fetchMyFacilities, fetchStaffDirectory } from "@/api/slices";
import { formatRole } from "@/api/types";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";

function CustomDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Select...",
  isDark,
  colors,
  border,
}: {
  label?: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
  placeholder?: string;
  isDark: boolean;
  colors: any;
  border: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative flex flex-col gap-1" ref={dropdownRef}>
      {label && (
        <label className="text-xs font-semibold opacity-60">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition min-w-[140px]"
        style={{
          backgroundColor: colors.shadeBg,
          color: colors.text,
          borderColor: border,
        }}
      >
        <span
          className={
            selectedOption ? "font-semibold truncate" : "opacity-50 truncate"
          }
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 opacity-60 transition-transform shrink-0 ml-2 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div
          className={`absolute top-full left-0 z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border shadow-xl ${
            isDark ? "border-white/[0.12]" : "border-black/[0.12]"
          }`}
          style={{
            backgroundColor: colors.shadeBg,
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs font-semibold transition hover:opacity-80"
                style={{
                  backgroundColor: isSelected
                    ? isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.05)"
                    : "transparent",
                  color: colors.text,
                }}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check
                    className="h-3.5 w-3.5 shrink-0 ml-2"
                    style={{ color: PRIMARY_COLOR }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Staff Directory for the active facility */
export default function TeamsPage() {
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const { activeFacilityId, activeFacility } = useAppSelector(
    (s) => s.facilities
  );
  const { directory, directoryLoading } = useAppSelector((s) => s.staff);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (activeFacilityId) {
      dispatch(fetchStaffDirectory({ facilityId: activeFacilityId }));
    }
  }, [dispatch, activeFacilityId]);

  const filtered = useMemo(() => {
    let rows = directory || [];
    if (roleFilter) rows = rows.filter((m) => m.role === roleFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (m) =>
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q) ||
          m.phone?.includes(q) ||
          m.department?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [directory, search, roleFilter]);

  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  if (!activeFacilityId) {
    return (
      <div
        className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center"
        style={{ color: colors.text }}
      >
        <div
          className="rounded-2xl border border-dashed p-10 max-w-lg mx-auto"
          style={{ backgroundColor: colors.shadeBg, borderColor: border }}
        >
          <Building2 className="mx-auto opacity-30 mb-3" size={32} />
          <h1 className="text-lg font-bold tracking-tight">
            Staff Directory Unavailable
          </h1>
          <p className="mt-2 text-xs sm:text-sm opacity-60">
            Select or create a facility first to view team members.
          </p>
          <div className="mt-5">
            <Link
              href="/dashboard/workspace"
              className="inline-flex rounded-xl px-4 py-2 text-xs font-semibold text-white"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              Go to Workspace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const roles = Array.from(
    new Set((directory || []).map((m) => m.role).filter(Boolean))
  ) as string[];

  const roleOptions = [
    { label: "All roles", value: "" },
    ...roles.map((r) => ({
      label: formatRole(r),
      value: r,
    })),
  ];

  return (
    <div
      className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-5"
      style={{ color: colors.text }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Users size={20} style={{ color: PRIMARY_COLOR }} /> Staff Directory
          </h1>
          <p className="mt-1 text-xs opacity-60">
            {activeFacility?.name || "Active facility"} · one email can staff
            multiple facilities
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/staff/roster"
            className="rounded-xl border px-3 py-2 text-xs font-semibold"
            style={{ borderColor: border, backgroundColor: colors.shadeBg }}
          >
            Shift Roster & On-Call
          </Link>
          {/* <Link
            href="/dashboard/staff/credentials"
            className="rounded-xl border px-3 py-2 text-xs font-semibold"
            style={{ borderColor: border, backgroundColor: colors.shadeBg }}
          >
            Privileges & Credentials
          </Link> */}
          <Link
            href="/dashboard/workspace"
            className="rounded-xl px-3 py-2 text-xs font-semibold text-white"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            Invite staff
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div
          className="flex flex-1 min-w-[200px] items-center gap-2 rounded-xl border px-3 py-2"
          style={{ borderColor: border, backgroundColor: colors.shadeBg }}
        >
          <Search size={14} className="opacity-50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="w-full bg-transparent text-sm outline-none"
            style={{ color: colors.text }}
          />
        </div>
        <div className="w-44">
          <CustomDropdown
            value={roleFilter}
            options={roleOptions}
            onChange={(val) => setRoleFilter(val)}
            placeholder="All roles"
            isDark={isDark}
            colors={colors}
            border={border}
          />
        </div>
      </div>

      {directoryLoading ? (
        <div
          className="flex items-center justify-center gap-2 rounded-2xl border p-12 text-sm opacity-60"
          style={{ borderColor: border, backgroundColor: colors.shadeBg }}
        >
          <Loader2 className="h-4 w-4 animate-spin" /> Loading directory…
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: border, backgroundColor: colors.shadeBg }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr
                  className="border-b text-xs uppercase tracking-wide opacity-60"
                  style={{ borderColor: border }}
                >
                  <th className="px-5 py-3.5 font-semibold">Name</th>
                  <th className="px-5 py-3.5 font-semibold hidden sm:table-cell">
                    Contact
                  </th>
                  <th className="px-5 py-3.5 font-semibold">Role</th>
                  <th className="px-5 py-3.5 font-semibold hidden md:table-cell">
                    Department
                  </th>
                  <th className="px-5 py-3.5 font-semibold hidden lg:table-cell">
                    Privileges
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b last:border-0"
                    style={{
                      borderColor: isDark
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.05)",
                    }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-semibold">
                        {m.firstName} {m.lastName}
                      </div>
                      <div className="text-xs opacity-50 sm:hidden">
                        {m.email}
                      </div>
                      {m.multiCompany && (
                        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-amber-500">
                          <BadgeCheck size={10} /> Multi-facility
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <div className="text-xs opacity-70">{m.email}</div>
                      {(m.countryCode || m.phone) && (
                        <div className="mt-1 flex items-center gap-1 text-xs opacity-60">
                          <Phone size={11} />
                          {[m.countryCode, m.phone].filter(Boolean).join(" ")}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border"
                        style={{
                          backgroundColor: colors.shadeBgSecond,
                          borderColor: border,
                        }}
                      >
                        <Shield size={11} style={{ color: PRIMARY_COLOR }} />
                        {formatRole(m.role || "staff")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 opacity-70 hidden md:table-cell">
                      {m.department || m.jobTitle || "—"}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(m.privileges || []).slice(0, 3).map((p) => (
                          <span
                            key={p}
                            className="rounded-md border px-1.5 py-0.5 text-[10px]"
                            style={{ borderColor: border }}
                          >
                            {p}
                          </span>
                        ))}
                        {(m.privileges || []).length > 3 && (
                          <span className="text-[10px] opacity-50">
                            +{(m.privileges || []).length - 3}
                          </span>
                        )}
                        {!m.privileges?.length && (
                          <span className="text-xs opacity-40">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-12 text-center opacity-60 text-sm">
              No staff members found for this facility.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
