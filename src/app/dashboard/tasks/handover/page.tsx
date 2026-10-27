"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  Building2,
  Check,
  Loader2,
  Plus,
  X,
  ChevronDown,
  Search,
  Calendar,
  LayoutGrid,
  List as ListIcon,
  GripHorizontal,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchMyFacilities,
  fetchFacilityMembers,
  fetchHandovers,
  createHandover,
  acknowledgeHandover,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { useFacilityId } from "@/hooks/useFacilityId";

function personLabel(u: unknown): string {
  if (!u) return "—";
  if (typeof u === "string") return u;
  const x = u as { firstName?: string; lastName?: string; email?: string };
  return `${x.firstName || ""} ${x.lastName || ""}`.trim() || x.email || "—";
}

function getProfilePicture(user: unknown): string | undefined {
  if (!user || typeof user === "string") return undefined;
  const u = user as { profilePicture?: string; avatar?: string };
  return u.profilePicture || u.avatar;
}

function UserAvatar({
  user,
  size = "sm",
}: {
  user: unknown;
  size?: "sm" | "md";
}) {
  const name = personLabel(user);
  const pic = getProfilePicture(user);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const dim = size === "md" ? "h-8 w-8 text-xs" : "h-6 w-6 text-[10px]";

  return (
    <div
      className={`flex ${dim} shrink-0 items-center justify-center overflow-hidden rounded-lg font-bold`}
      style={{ backgroundColor: "rgba(0,0,0,0.06)", color: PRIMARY_COLOR }}
    >
      {pic ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pic} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials || "?"
      )}
    </div>
  );
}

function CustomSearchableStaffDropdown({
  label,
  value,
  members,
  onChange,
  placeholder = "Select incoming staff...",
  isDark,
  colors,
  border,
  myId,
}: {
  label?: string;
  value: string;
  members: any[];
  onChange: (val: string) => void;
  placeholder?: string;
  isDark: boolean;
  colors: any;
  border: string;
  myId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  const availableMembers = members.filter((m) => m.id !== myId);
  const filteredMembers = availableMembers.filter((m) => {
    const fullName = `${m.firstName || ""} ${m.lastName || ""}`.toLowerCase();
    const email = (m.email || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const selectedMember = availableMembers.find((m) => m.id === value);

  return (
    <div className="relative flex flex-col gap-1.5" ref={dropdownRef}>
      {label && (
        <label className="text-xs font-semibold opacity-70">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none transition shadow-none min-h-[46px]"
        style={{
          backgroundColor: colors.shadeBgSecond || "transparent",
          color: colors.text,
          borderColor: border,
        }}
      >
        <div className="flex items-center gap-2 truncate py-0.5">
          {selectedMember ? (
            <div className="flex items-center gap-2">
              <UserAvatar user={selectedMember} size="sm" />
              <span className="text-xs font-semibold capitalize">
                {selectedMember.firstName} {selectedMember.lastName}
              </span>
            </div>
          ) : (
            <span className="text-xs opacity-40">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 opacity-60 transition-transform shrink-0 ml-2 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 z-[9999] mt-1.5 w-full overflow-hidden rounded-xl border shadow-2xl ${
            isDark ? "border-white/20 bg-[#1e1e1e]" : "border-black/15 bg-white"
          }`}
        >
          <div
            className={`flex items-center gap-2 border-b px-3 py-2.5 ${
              isDark ? "border-white/10" : "border-black/10"
            }`}
          >
            <Search size={14} className="opacity-50 shrink-0" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff..."
              className="w-full bg-transparent text-xs outline-none"
              style={{ color: colors.text }}
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filteredMembers.length === 0 ? (
              <div className="p-4 text-center text-xs opacity-50">
                No staff found
              </div>
            ) : (
              filteredMembers.map((m) => {
                const isSelected = value === m.id;
                const mName =
                  `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onChange(m.id);
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:opacity-80"
                    style={{
                      backgroundColor: isSelected
                        ? isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.05)"
                        : "transparent",
                    }}
                  >
                    <UserAvatar user={m} size="md" />
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-xs font-bold truncate capitalize"
                        style={{ color: colors.text }}
                      >
                        {mName}
                      </p>
                      <p className="text-[10px] opacity-50 truncate">
                        {m.email}
                      </p>
                    </div>
                    {isSelected && (
                      <Check
                        className="h-3.5 w-3.5 shrink-0 ml-auto"
                        style={{ color: PRIMARY_COLOR }}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomPopupDatePicker({
  label,
  value,
  onChange,
  border,
  colors,
  isDark,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  border: string;
  colors: any;
  isDark: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsedDate = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(parsedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(parsedDate.getFullYear());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleSelectDay = (day: number) => {
    const mStr = String(currentMonth + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    onChange(`${currentYear}-${mStr}-${dStr}`);
    setIsOpen(false);
  };

  return (
    <div className="relative flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold opacity-70">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition text-left shadow-none min-h-[46px]"
        style={{
          backgroundColor: colors.shadeBgSecond,
          borderColor: border,
          color: colors.text,
        }}
      >
        <div className="flex items-center gap-2 truncate">
          <Calendar size={15} className="opacity-50 shrink-0" />
          <span
            className={value ? "font-medium text-xs" : "text-xs opacity-40"}
          >
            {value ? value : "Select shift date..."}
          </span>
        </div>
        <ChevronDown size={14} className="opacity-50 shrink-0" />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 z-[9999] mt-1.5 w-72 rounded-2xl border p-4 shadow-2xl ${
            isDark ? "border-white/20 bg-[#1e1e1e]" : "border-black/15 bg-white"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear((y) => y - 1);
                } else {
                  setCurrentMonth((m) => m - 1);
                }
              }}
              className="rounded-lg p-1.5 hover:opacity-80 border shadow-none"
              style={{ borderColor: border }}
            >
              <ChevronDown size={14} className="rotate-90" />
            </button>
            <span className="text-xs font-bold">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              onClick={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0);
                  setCurrentYear((y) => y + 1);
                } else {
                  setCurrentMonth((m) => m + 1);
                }
              }}
              className="rounded-lg p-1.5 hover:opacity-80 border shadow-none"
              style={{ borderColor: border }}
            >
              <ChevronDown size={14} className="-rotate-90" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold opacity-50 mb-2">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const mStr = String(currentMonth + 1).padStart(2, "0");
              const dStr = String(day).padStart(2, "0");
              const dateStr = `${currentYear}-${mStr}-${dStr}`;
              const isSelected = value === dateStr;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl font-semibold transition hover:opacity-80 mx-auto shadow-none"
                  style={{
                    backgroundColor: isSelected ? PRIMARY_COLOR : "transparent",
                    color: isSelected ? "#fff" : colors.text,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const KANBAN_COLUMNS: { label: string; status: string }[] = [
  { label: "Submitted", status: "submitted" },
  { label: "Acknowledged", status: "acknowledged" },
];

export default function HandoverLogPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  const { user } = useAppSelector((s) => s.auth);

  // Use the comprehensive useFacilityId hook
  const { facilityId, activeFacility, members } = useFacilityId();
  const { handovers, handoversLoading, saving } = useAppSelector(
    (s) => s.tasks
  );

  // Default to Kanban view mode
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [showForm, setShowForm] = useState(false);
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [form, setForm] = useState({
    toUserId: "",
    shiftDate: "",
    summary: "",
    department: "",
    wardOrUnit: "",
    patientNotes: "",
  });
  const [toast, setToast] = useState<string | null>(null);
  const [toastErr, setToastErr] = useState(false);

  const myId = user?._id || (user as { id?: string } | undefined)?.id;

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchFacilityMembers(facilityId));
    dispatch(fetchHandovers({ facilityId, scope }));
  }, [dispatch, facilityId, scope]);

  const notify = (msg: string, err = false) => {
    setToast(msg);
    setToastErr(err);
    setTimeout(() => setToast(null), 3000);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId) return;
    if (!form.toUserId) {
      notify("Select incoming staff", true);
      return;
    }
    try {
      await dispatch(
        createHandover({
          facilityId,
          payload: {
            toUserId: form.toUserId,
            shiftDate: form.shiftDate,
            summary: form.summary.trim(),
            department: form.department || undefined,
            wardOrUnit: form.wardOrUnit || undefined,
            patientNotes: form.patientNotes || undefined,
          },
        })
      ).unwrap();
      notify("Handover submitted — staff emailed");
      setShowForm(false);
      setForm({
        toUserId: "",
        shiftDate: "",
        summary: "",
        department: "",
        wardOrUnit: "",
        patientNotes: "",
      });
      dispatch(fetchHandovers({ facilityId, scope }));
    } catch (err: unknown) {
      notify(typeof err === "string" ? err : "Submit failed", true);
    }
  };

  const handleAcknowledge = async (id: string) => {
    if (!facilityId) return;
    try {
      await dispatch(
        acknowledgeHandover({
          facilityId,
          handoverId: id,
        })
      ).unwrap();
      notify("Handover acknowledged");
      dispatch(fetchHandovers({ facilityId, scope }));
    } catch (err: unknown) {
      notify(typeof err === "string" ? err : "Acknowledge failed", true);
    }
  };

  if (!facilityId) {
    return (
      <div
        className="max-w-lg mx-auto px-4 py-16 text-center"
        style={{ color: colors.text }}
      >
        <Building2 className="mx-auto opacity-30 mb-3" size={32} />
        <p className="font-bold">Select a facility first</p>
        <Link
          href="/dashboard/workspace"
          className="mt-4 inline-block text-sm underline opacity-70"
        >
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
      className="relative mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-5 overflow-x-hidden"
      style={{ color: colors.text }}
    >
      {/* Dark overlay loader when fetching handovers */}
      {handoversLoading && (
        <DarkBlurOverlayLoader text="Loading handovers..." />
      )}

      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-none ${
            toastErr ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <ArrowRightLeft size={20} style={{ color: PRIMARY_COLOR }} />
            Shift Handover Log
          </h1>
          <p className="mt-1 text-xs opacity-60">
            {activeFacility?.name} · incoming & outgoing staff are emailed
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div
            className="flex rounded-xl border p-1 shadow-none"
            style={{ borderColor: border, backgroundColor: colors.shadeBg }}
          >
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-none capitalize"
              style={{
                backgroundColor:
                  viewMode === "list" ? PRIMARY_COLOR : "transparent",
                color: viewMode === "list" ? "#fff" : colors.text,
              }}
            >
              <ListIcon size={13} /> List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-none capitalize"
              style={{
                backgroundColor:
                  viewMode === "kanban" ? PRIMARY_COLOR : "transparent",
                color: viewMode === "kanban" ? "#fff" : colors.text,
              }}
            >
              <LayoutGrid size={13} /> Kanban
            </button>
          </div>

          <Link
            href="/dashboard/tasks"
            className="rounded-xl border px-3 py-2 text-xs font-semibold"
            style={{ borderColor: border, backgroundColor: colors.shadeBg }}
          >
            All tasks
          </Link>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Plus size={14} /> New handover
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "mine"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className="rounded-full border px-3 py-1 text-[11px] font-bold capitalize"
            style={{
              borderColor: border,
              backgroundColor: scope === s ? PRIMARY_COLOR : colors.shadeBg,
              color: scope === s ? "#fff" : colors.text,
            }}
          >
            {s === "mine" ? "Involving me" : "All"}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div
            className="relative w-full max-w-lg rounded-3xl border p-6 shadow-2xl my-8 overflow-visible"
            style={{ borderColor: border, backgroundColor: colors.shadeBg }}
          >
            <div
              className="flex items-center justify-between pb-4 border-b mb-4"
              style={{ borderColor: border }}
            >
              <h2 className="text-base font-bold flex items-center gap-2">
                <Plus size={18} style={{ color: PRIMARY_COLOR }} /> Create Shift
                Handover
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl p-1.5 hover:opacity-80 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="relative z-25">
                <CustomSearchableStaffDropdown
                  label="Hand over to *"
                  value={form.toUserId}
                  members={members}
                  onChange={(val) => setForm((f) => ({ ...f, toUserId: val }))}
                  placeholder="Select incoming staff..."
                  isDark={isDark}
                  colors={colors}
                  border={border}
                  myId={myId}
                />
              </div>
              <div className="relative z-20">
                <CustomPopupDatePicker
                  label="Shift date *"
                  value={form.shiftDate}
                  onChange={(val) => setForm((f) => ({ ...f, shiftDate: val }))}
                  border={border}
                  colors={colors}
                  isDark={isDark}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold opacity-70">
                    Department
                  </label>
                  <input
                    placeholder="e.g. Emergency, ICU..."
                    value={form.department}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, department: e.target.value }))
                    }
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold opacity-70">
                    Ward / unit
                  </label>
                  <input
                    placeholder="e.g. Ward A, Unit 2..."
                    value={form.wardOrUnit}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, wardOrUnit: e.target.value }))
                    }
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold opacity-70">
                  Summary *
                </label>
                <textarea
                  required
                  minLength={5}
                  rows={4}
                  value={form.summary}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, summary: e.target.value }))
                  }
                  placeholder="Key patients, pending labs, risks..."
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold opacity-70">
                  Patient notes (optional)
                </label>
                <textarea
                  rows={2}
                  value={form.patientNotes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, patientNotes: e.target.value }))
                  }
                  placeholder="Add specific patient observations or reminders..."
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl px-4 py-3 text-xs font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  {saving ? "Submitting…" : "Submit & email staff"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border px-4 py-3 text-xs font-semibold"
                  style={{ borderColor: border }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewMode === "list" ? (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: border, backgroundColor: colors.shadeBg }}
        >
          {handovers.length === 0 ? (
            <div className="p-12 text-center text-sm opacity-60">
              No handovers recorded yet.
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: border }}>
              {handovers.map((h) => {
                const id = h._id || h.id!;
                const toId =
                  typeof h.toUser === "string"
                    ? h.toUser
                    : (h.toUser as { _id?: string })?._id;
                const canAck =
                  h.status === "submitted" &&
                  myId &&
                  String(toId) === String(myId);

                return (
                  <li
                    key={id}
                    onClick={() =>
                      router.push(`/dashboard/tasks/handover/${id}`)
                    }
                    className="px-5 py-4 space-y-2 cursor-pointer transition hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold capitalize hover:underline">
                        {personLabel(h.fromUser)} → {personLabel(h.toUser)}
                      </p>
                      <span
                        className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase capitalize"
                        style={{ borderColor: border }}
                      >
                        {h.status}
                      </span>
                    </div>
                    <p className="text-xs opacity-70 whitespace-pre-wrap">
                      {h.summary}
                    </p>
                    <p className="text-[11px] opacity-50 capitalize">
                      {new Date(h.shiftDate).toLocaleDateString()}
                      {h.department ? ` · ${h.department}` : ""}
                      {h.wardOrUnit ? ` · ${h.wardOrUnit}` : ""}
                    </p>
                    <div
                      className="flex flex-wrap items-center gap-1.5 pt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href={`/dashboard/tasks/handover/${id}`}
                        className="inline-flex items-center rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold"
                        style={{ borderColor: border }}
                      >
                        View details
                      </Link>
                      {canAck && (
                        <button
                          type="button"
                          onClick={() => handleAcknowledge(id)}
                          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold"
                          style={{ borderColor: border }}
                        >
                          <Check size={12} /> Acknowledge receipt
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 items-start min-w-[700px]">
            {KANBAN_COLUMNS.map((col) => {
              const columnHandovers = handovers.filter(
                (h) => h.status === col.status
              );

              return (
                <div
                  key={col.status}
                  className="flex flex-col rounded-2xl border p-3 min-h-[500px] flex-1 min-w-[320px]"
                  style={{
                    borderColor: border,
                    backgroundColor: colors.shadeBg,
                  }}
                >
                  <div
                    className="flex items-center justify-between pb-3 border-b mb-3 px-1"
                    style={{ borderColor: border }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider capitalize">
                        {col.label}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.06)",
                        }}
                      >
                        {columnHandovers.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                    {columnHandovers.map((h) => {
                      const id = h._id || h.id!;
                      const toId =
                        typeof h.toUser === "string"
                          ? h.toUser
                          : (h.toUser as { _id?: string })?._id;
                      const canAck =
                        h.status === "submitted" &&
                        myId &&
                        String(toId) === String(myId);

                      return (
                        <div
                          key={id}
                          onClick={() =>
                            router.push(`/dashboard/tasks/handover/${id}`)
                          }
                          className="rounded-xl border p-3 text-xs flex flex-col gap-2 cursor-pointer transition shadow-none hover:opacity-95 shrink-0"
                          style={{
                            borderColor: border,
                            backgroundColor: colors.shadeBgSecond,
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-xs leading-snug capitalize hover:underline">
                              {personLabel(h.fromUser)} →{" "}
                              {personLabel(h.toUser)}
                            </p>
                          </div>

                          <p className="opacity-70 line-clamp-3 text-[11px] whitespace-pre-wrap">
                            {h.summary}
                          </p>

                          <div className="flex items-center justify-between gap-2 pt-1 text-[10px] opacity-50 capitalize">
                            <span>
                              {new Date(h.shiftDate).toLocaleDateString()}
                            </span>
                            <span>
                              {[h.department, h.wardOrUnit]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </div>

                          {canAck && (
                            <div
                              className="flex items-center justify-end pt-2 border-t mt-1"
                              style={{ borderColor: border }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => handleAcknowledge(id)}
                                className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold"
                                style={{ borderColor: border }}
                              >
                                <Check size={11} /> Acknowledge
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {columnHandovers.length === 0 && (
                      <div className="flex-1 flex items-center justify-center text-[11px] opacity-30 py-12">
                        No handovers
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
