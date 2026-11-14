"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "@/components/access/guarded-link";
import {
  CalendarClock,
  Loader2,
  Plus,
  Phone,
  Trash2,
  Building2,
  Moon,
  Check,
  ChevronDown,
  Search,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  GripHorizontal,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchMyFacilities,
  fetchFacilityMembers,
  fetchShifts,
  createShift,
  updateShift,
  deleteShift,
  fetchOnCall,
  createOnCall,
  updateOnCall,
  deleteOnCall,
} from "@/api/slices";
import {
  FACILITY_ADMIN_ROLES,
  type ShiftType,
  type UserRole,
} from "@/api/types";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";

import { Can } from "@/components/access/can";
function personName(user: unknown): string {
  if (!user || typeof user === "string") return "Staff";
  const u = user as { firstName?: string; lastName?: string; email?: string };
  const n = `${u.firstName || ""} ${u.lastName || ""}`.trim();
  return n || u.email || "Staff";
}

function getUserId(user: unknown): string {
  if (!user) return "";
  if (typeof user === "string") return user;
  const u = user as { id?: string; _id?: string };
  return String(u.id || u._id || "");
}

function getProfilePicture(user: unknown): string | undefined {
  if (!user || typeof user === "string") return undefined;
  const u = user as { profilePicture?: string; avatar?: string };
  return u.profilePicture || u.avatar;
}

function getStaffDetails(user: unknown) {
  if (!user || typeof user === "string")
    return { phone: "", specialty: "", title: "" };
  const u = user as {
    phone?: string;
    countryCode?: string;
    specialty?: string;
    title?: string;
  };
  const phoneFormatted = [u.countryCode, u.phone].filter(Boolean).join(" ");
  return {
    phone: phoneFormatted || u.phone || "",
    specialty: u.specialty || "",
    title: u.title || "",
  };
}

function UserAvatar({
  user,
  size = "sm",
}: {
  user: unknown;
  size?: "sm" | "md";
}) {
  const name = personName(user);
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
    <div className="relative flex flex-col gap-1.5" ref={dropdownRef}>
      {label && (
        <label className="text-xs font-semibold opacity-70">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none transition shadow-none"
        style={{
          backgroundColor: colors.shadeBgSecond || "transparent",
          color: colors.text,
          borderColor: border,
        }}
      >
        <span
          className={
            selectedOption ? "font-medium truncate" : "opacity-40 truncate"
          }
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 opacity-60 transition-transform shrink-0 ml-2 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div
          className={`absolute top-full left-0 z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border shadow-lg ${
            isDark ? "border-white/20 bg-[#1e1e1e]" : "border-black/15 bg-white"
          }`}
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

function SearchableMemberDropdown({
  label,
  value,
  members,
  onChange,
  placeholder = "Select member...",
  isDark,
  colors,
  border,
}: {
  label?: string;
  value: string;
  members: any[];
  onChange: (val: string) => void;
  placeholder?: string;
  isDark: boolean;
  colors: any;
  border: string;
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

  const filteredMembers = members.filter((m) => {
    const fullName = `${m.firstName || ""} ${m.lastName || ""}`.toLowerCase();
    const email = (m.email || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const selectedMember = members.find((m) => m.id === value);

  return (
    <div className="relative flex flex-col gap-1.5" ref={dropdownRef}>
      {label && (
        <label className="text-xs font-semibold opacity-70">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none transition shadow-none"
        style={{
          backgroundColor: colors.shadeBgSecond || "transparent",
          color: colors.text,
          borderColor: border,
        }}
      >
        <div className="flex items-center gap-2.5 truncate">
          {selectedMember ? (
            <>
              <UserAvatar user={selectedMember} size="md" />
              <div className="text-left truncate">
                <p className="text-xs font-bold leading-tight truncate">
                  {selectedMember.firstName} {selectedMember.lastName}
                </p>
                <p className="text-[10px] opacity-50 truncate">
                  {[selectedMember.countryCode, selectedMember.phone]
                    .filter(Boolean)
                    .join(" ") || selectedMember.email}
                </p>
              </div>
            </>
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
          className={`absolute top-full left-0 z-50 mt-1.5 w-full overflow-hidden rounded-xl border shadow-lg ${
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
                const isSelected = m.id === value;
                const mName =
                  `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email;
                const mPhone = [m.countryCode, m.phone]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onChange(m.id);
                      setIsOpen(false);
                      setSearchQuery("");
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
                        className="text-xs font-bold truncate"
                        style={{ color: colors.text }}
                      >
                        {mName}
                      </p>
                      <p className="text-[10px] opacity-50 truncate">
                        {mPhone || m.email}
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
      <label className="text-xs font-semibold opacity-70">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition text-left shadow-none"
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
            {value || "Select date..."}
          </span>
        </div>
        <ChevronDown size={14} className="opacity-50 shrink-0" />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 z-50 mt-1.5 w-72 rounded-2xl border p-4 shadow-lg ${
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
              <ChevronLeft size={14} />
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
              <ChevronRight size={14} />
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

function CustomPopupTimePicker({
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

  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0")
  );
  const minutes = ["00", "15", "30", "45"];

  const [selectedH, selectedM] = (value || "08:00").split(":");

  return (
    <div className="relative flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold opacity-70">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition text-left shadow-none"
        style={{
          backgroundColor: colors.shadeBgSecond,
          borderColor: border,
          color: colors.text,
        }}
      >
        <div className="flex items-center gap-2 truncate">
          <Clock size={15} className="opacity-50 shrink-0" />
          <span
            className={value ? "font-medium text-xs" : "text-xs opacity-40"}
          >
            {value || "Select time..."}
          </span>
        </div>
        <ChevronDown size={14} className="opacity-50 shrink-0" />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 z-50 mt-1.5 flex h-48 w-56 rounded-2xl border shadow-lg overflow-hidden ${
            isDark ? "border-white/20 bg-[#1e1e1e]" : "border-black/15 bg-white"
          }`}
        >
          <div
            className="flex-1 overflow-y-auto divide-y"
            style={{ borderColor: border }}
          >
            <div className="p-2 text-[10px] font-bold opacity-40 text-center uppercase">
              Hour
            </div>
            {hours.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => {
                  onChange(`${h}:${selectedM || "00"}`);
                }}
                className="w-full py-2 text-center text-xs font-bold transition hover:opacity-80 shadow-none"
                style={{
                  backgroundColor:
                    selectedH === h ? PRIMARY_COLOR : "transparent",
                  color: selectedH === h ? "#fff" : colors.text,
                }}
              >
                {h}
              </button>
            ))}
          </div>
          <div
            className="flex-1 overflow-y-auto divide-y border-l"
            style={{ borderColor: border }}
          >
            <div className="p-2 text-[10px] font-bold opacity-40 text-center uppercase">
              Min
            </div>
            {minutes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  onChange(`${selectedH || "08"}:${m}`);
                  setIsOpen(false);
                }}
                className="w-full py-2 text-center text-xs font-bold transition hover:opacity-80 shadow-none"
                style={{
                  backgroundColor:
                    selectedM === m ? PRIMARY_COLOR : "transparent",
                  color: selectedM === m ? "#fff" : colors.text,
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomPopupDateTimePicker({
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
  const [datePart, timePart] = (value || "").split("T");
  const [currentDate, setCurrentDate] = useState(datePart || "");
  const [currentTime, setCurrentTime] = useState(timePart || "08:00");

  const handleUpdate = (newDate: string, newTime: string) => {
    setCurrentDate(newDate);
    setCurrentTime(newTime);
    if (newDate) {
      onChange(`${newDate}T${newTime || "08:00"}`);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <CustomPopupDatePicker
        label={label}
        value={currentDate}
        onChange={(d) => handleUpdate(d, currentTime)}
        border={border}
        colors={colors}
        isDark={isDark}
      />
      <CustomPopupTimePicker
        label=""
        value={currentTime}
        onChange={(t) => handleUpdate(currentDate, t)}
        border={border}
        colors={colors}
        isDark={isDark}
      />
    </div>
  );
}

export default function RosterPage() {
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  const { user } = useAppSelector((s) => s.auth);
  const { activeFacilityId, activeFacility, list, members } = useAppSelector(
    (s) => s.facilities
  );
  const { shifts, shiftsLoading, onCall, onCallLoading, saving } =
    useAppSelector((s) => s.staff);

  const [tab, setTab] = useState<"roster" | "oncall">("roster");
  // Default to timetable view
  const [viewMode, setViewMode] = useState<"list" | "timetable">("timetable");
  const [scopeFilter, setScopeFilter] = useState<"all" | "my">("all");

  const [showForm, setShowForm] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    userId: "",
    date: "",
    startTime: "08:00",
    endTime: "16:00",
    shiftType: "morning" as ShiftType,
    department: "",
    notes: "",
  });
  const [onCallForm, setOnCallForm] = useState({
    userId: "",
    startAt: "",
    endAt: "",
    specialty: "",
    priority: 1,
    phoneOverride: "",
    notes: "",
  });
  const [toast, setToast] = useState<string | null>(null);
  const [toastErr, setToastErr] = useState(false);

  // Local optimistic lists
  const [localShifts, setLocalShifts] = useState(shifts);
  const [localOnCall, setLocalOnCall] = useState(onCall);

  useEffect(() => {
    setLocalShifts(shifts);
  }, [shifts]);

  useEffect(() => {
    setLocalOnCall(onCall);
  }, [onCall]);

  // Timetable column reordering state
  const [timetableDays, setTimetableDays] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    const baseDays = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i - 3);
      return d.toISOString().split("T")[0];
    });
    setTimetableDays(baseDays);
  }, []);

  const handleColumnDragStart = (e: React.DragEvent, index: number) => {
    if (!canManage) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleColumnDragOver = (e: React.DragEvent) => {
    if (!canManage) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleColumnDrop = (e: React.DragEvent, targetIndex: number) => {
    if (!canManage || draggedIndex === null || draggedIndex === targetIndex)
      return;
    e.preventDefault();
    const updated = [...timetableDays];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedItem);
    setTimetableDays(updated);
    setDraggedIndex(null);
  };

  // Optimistic Card Drag & Drop maintaining full user object
  const handleCardDragStart = (
    e: React.DragEvent,
    id: string,
    type: "shift" | "oncall"
  ) => {
    if (!canManage) return;
    e.stopPropagation();
    e.dataTransfer.setData("text/plain", JSON.stringify({ id, type }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCardDropOnDay = async (
    e: React.DragEvent,
    targetDate: string
  ) => {
    if (!canManage || !activeFacilityId) return;
    e.preventDefault();
    const rawData = e.dataTransfer.getData("text/plain");
    if (!rawData) return;

    try {
      const { id, type } = JSON.parse(rawData);

      if (type === "shift") {
        setLocalShifts((prev) =>
          prev.map((s) =>
            String(s._id || s.id) === id ? { ...s, date: targetDate } : s
          )
        );

        await dispatch(
          updateShift({
            facilityId: activeFacilityId,
            shiftId: id,
            payload: { date: targetDate },
          })
        ).unwrap();
        dispatch(fetchShifts({ facilityId: activeFacilityId }));
      } else if (type === "oncall") {
        const entry = localOnCall.find((r) => String(r._id || r.id) === id);
        if (entry) {
          const oldStart = new Date(entry.startAt);
          const oldEnd = new Date(entry.endAt);
          const diffMs = oldEnd.getTime() - oldStart.getTime();

          const newStart = new Date(
            `${targetDate}T${oldStart.toTimeString().slice(0, 5)}`
          );
          const newEnd = new Date(newStart.getTime() + diffMs);

          setLocalOnCall((prev) =>
            prev.map((r) =>
              String(r._id || r.id) === id
                ? {
                    ...r,
                    startAt: newStart.toISOString(),
                    endAt: newEnd.toISOString(),
                  }
                : r
            )
          );

          await dispatch(
            updateOnCall({
              facilityId: activeFacilityId,
              onCallId: id,
              payload: {
                startAt: newStart.toISOString(),
                endAt: newEnd.toISOString(),
              },
            })
          ).unwrap();
          dispatch(fetchOnCall({ facilityId: activeFacilityId }));
        }
      }
    } catch (err: unknown) {
      notify(
        typeof err === "string" ? err : "Failed to update item date",
        true
      );
      dispatch(fetchShifts({ facilityId: activeFacilityId }));
      dispatch(fetchOnCall({ facilityId: activeFacilityId }));
    }
  };

  useEffect(() => {
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  useEffect(() => {
    if (!activeFacilityId) return;
    dispatch(fetchFacilityMembers(activeFacilityId));
    dispatch(fetchShifts({ facilityId: activeFacilityId }));
    dispatch(fetchOnCall({ facilityId: activeFacilityId }));
  }, [dispatch, activeFacilityId]);

  const notify = (msg: string, err = false) => {
    setToast(msg);
    setToastErr(err);
    setTimeout(() => setToast(null), 3200);
  };

  const myRole = useMemo(() => {
    if (activeFacility?.role) return activeFacility.role;
    const m = list.find((x) => String(x.company) === String(activeFacilityId));
    return m?.role || user?.role;
  }, [activeFacility, list, activeFacilityId, user?.role]);

  const canManage = useMemo(() => {
    if (!myRole) return false;
    const r = myRole as UserRole;
    return (
      FACILITY_ADMIN_ROLES.includes(r) ||
      r === "ceo" ||
      r === "super_admin" ||
      r === "manager"
    );
  }, [myRole]);

  const onCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFacilityId || !canManage) return;
    try {
      await dispatch(
        createShift({
          facilityId: activeFacilityId,
          payload: {
            userId: shiftForm.userId,
            date: shiftForm.date,
            startTime: shiftForm.startTime,
            endTime: shiftForm.endTime,
            shiftType: shiftForm.shiftType,
            department: shiftForm.department || undefined,
            notes: shiftForm.notes || undefined,
          },
        })
      ).unwrap();
      notify("Shift scheduled");
      setShowForm(false);
      dispatch(fetchShifts({ facilityId: activeFacilityId }));
    } catch (err: unknown) {
      notify(typeof err === "string" ? err : "Failed to create shift", true);
    }
  };

  const onCreateOnCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFacilityId || !canManage) return;
    try {
      await dispatch(
        createOnCall({
          facilityId: activeFacilityId,
          payload: {
            userId: onCallForm.userId,
            startAt: onCallForm.startAt,
            endAt: onCallForm.endAt,
            specialty: onCallForm.specialty || undefined,
            priority: onCallForm.priority,
            phoneOverride: onCallForm.phoneOverride || undefined,
            notes: onCallForm.notes || undefined,
          },
        })
      ).unwrap();
      notify("On-call assigned");
      setShowForm(false);
      dispatch(fetchOnCall({ facilityId: activeFacilityId }));
    } catch (err: unknown) {
      notify(typeof err === "string" ? err : "Failed to assign on-call", true);
    }
  };

  const currentUserId = user?._id ? String(user._id) : "";

  const filteredShifts = useMemo(() => {
    if (scopeFilter === "my" && currentUserId) {
      return localShifts.filter((s) => getUserId(s.user) === currentUserId);
    }
    return localShifts;
  }, [localShifts, scopeFilter, currentUserId]);

  const filteredOnCall = useMemo(() => {
    if (scopeFilter === "my" && currentUserId) {
      return localOnCall.filter((r) => getUserId(r.user) === currentUserId);
    }
    return localOnCall;
  }, [localOnCall, scopeFilter, currentUserId]);

  if (!activeFacilityId) {
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
  };

  const shiftTypeOptions = [
    { label: "Morning", value: "morning" },
    { label: "Afternoon", value: "afternoon" },
    { label: "Night", value: "night" },
    { label: "On-call shift", value: "on_call" },
    { label: "Custom", value: "custom" },
  ];

  return (
    <div
      className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-5"
      style={{ color: colors.text }}
    >
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
            <CalendarClock size={20} style={{ color: PRIMARY_COLOR }} />
            Shift Roster & On-Call
          </h1>
          <p className="mt-1 text-xs opacity-60">
            {activeFacility?.name} · schedules are facility-scoped
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/workspace/teams"
            className="rounded-xl border px-3 py-2 text-xs font-semibold shadow-none"
            style={{ borderColor: border, backgroundColor: colors.shadeBg }}
          >
            Directory
          </Link>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white shadow-none"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Plus size={14} />{" "}
              {tab === "roster" ? "Add shift" : "Add on-call"}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["roster", "oncall"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setShowForm(false);
              }}
              className="rounded-xl px-4 py-2 text-xs font-bold border shadow-none"
              style={{
                borderColor: border,
                backgroundColor: tab === t ? PRIMARY_COLOR : colors.shadeBg,
                color: tab === t ? "#fff" : colors.text,
              }}
            >
              {t === "roster" ? "Shift Roster" : "On-Call"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex rounded-xl border p-1 shadow-none"
            style={{ borderColor: border, backgroundColor: colors.shadeBg }}
          >
            <button
              type="button"
              onClick={() => setScopeFilter("all")}
              className="rounded-lg px-3 py-1 text-xs font-bold transition shadow-none"
              style={{
                backgroundColor:
                  scopeFilter === "all" ? PRIMARY_COLOR : "transparent",
                color: scopeFilter === "all" ? "#fff" : colors.text,
              }}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter("my")}
              className="rounded-lg px-3 py-1 text-xs font-bold transition shadow-none"
              style={{
                backgroundColor:
                  scopeFilter === "my" ? PRIMARY_COLOR : "transparent",
                color: scopeFilter === "my" ? "#fff" : colors.text,
              }}
            >
              My Schedule
            </button>
          </div>

          <div
            className="flex rounded-xl border p-1 shadow-none"
            style={{ borderColor: border, backgroundColor: colors.shadeBg }}
          >
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold transition shadow-none"
              style={{
                backgroundColor:
                  viewMode === "list" ? PRIMARY_COLOR : "transparent",
                color: viewMode === "list" ? "#fff" : colors.text,
              }}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("timetable")}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold transition shadow-none"
              style={{
                backgroundColor:
                  viewMode === "timetable" ? PRIMARY_COLOR : "transparent",
                color: viewMode === "timetable" ? "#fff" : colors.text,
              }}
            >
              <LayoutGrid size={13} /> Timetable
            </button>
          </div>
        </div>
      </div>

      {showForm && canManage && tab === "roster" && (
        <form
          onSubmit={onCreateShift}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 rounded-2xl border p-5 shadow-none"
          style={{ borderColor: border, backgroundColor: colors.shadeBg }}
        >
          <div>
            <SearchableMemberDropdown
              label="Staff *"
              value={shiftForm.userId}
              members={members}
              onChange={(val) => setShiftForm((f) => ({ ...f, userId: val }))}
              placeholder="Select member..."
              isDark={isDark}
              colors={colors}
              border={border}
            />
          </div>
          <div>
            <CustomPopupDatePicker
              label="Date *"
              value={shiftForm.date}
              onChange={(val) => setShiftForm((f) => ({ ...f, date: val }))}
              border={border}
              colors={colors}
              isDark={isDark}
            />
          </div>
          <div>
            <CustomDropdown
              label="Type"
              value={shiftForm.shiftType}
              options={shiftTypeOptions}
              onChange={(val) =>
                setShiftForm((f) => ({ ...f, shiftType: val as ShiftType }))
              }
              placeholder="Select type..."
              isDark={isDark}
              colors={colors}
              border={border}
            />
          </div>
          <div>
            <CustomPopupTimePicker
              label="Start *"
              value={shiftForm.startTime}
              onChange={(val) =>
                setShiftForm((f) => ({ ...f, startTime: val }))
              }
              border={border}
              colors={colors}
              isDark={isDark}
            />
          </div>
          <div>
            <CustomPopupTimePicker
              label="End *"
              value={shiftForm.endTime}
              onChange={(val) => setShiftForm((f) => ({ ...f, endTime: val }))}
              border={border}
              colors={colors}
              isDark={isDark}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold opacity-70">
              Department
            </label>
            <input
              value={shiftForm.department}
              onChange={(e) =>
                setShiftForm((f) => ({ ...f, department: e.target.value }))
              }
              placeholder="Optional"
              className="w-full rounded-xl border px-3.5 py-2.5 text-sm shadow-none focus:outline-none"
              style={{ ...inputStyle, borderColor: border }}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50 shadow-none"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              {saving ? "Saving…" : "Schedule shift"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-none"
              style={{ borderColor: border }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {showForm && canManage && tab === "oncall" && (
        <form
          onSubmit={onCreateOnCall}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 rounded-2xl border p-5 shadow-none"
          style={{ borderColor: border, backgroundColor: colors.shadeBg }}
        >
          <div>
            <SearchableMemberDropdown
              label="Clinician *"
              value={onCallForm.userId}
              members={members}
              onChange={(val) => setOnCallForm((f) => ({ ...f, userId: val }))}
              placeholder="Select member..."
              isDark={isDark}
              colors={colors}
              border={border}
            />
          </div>
          <div>
            <CustomPopupDateTimePicker
              label="Start *"
              value={onCallForm.startAt}
              onChange={(val) => setOnCallForm((f) => ({ ...f, startAt: val }))}
              border={border}
              colors={colors}
              isDark={isDark}
            />
          </div>
          <div>
            <CustomPopupDateTimePicker
              label="End *"
              value={onCallForm.endAt}
              onChange={(val) => setOnCallForm((f) => ({ ...f, endAt: val }))}
              border={border}
              colors={colors}
              isDark={isDark}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold opacity-70">
              Specialty
            </label>
            <input
              value={onCallForm.specialty}
              onChange={(e) =>
                setOnCallForm((f) => ({ ...f, specialty: e.target.value }))
              }
              placeholder="Optional"
              className="w-full rounded-xl border px-3.5 py-2.5 text-sm shadow-none focus:outline-none"
              style={{ ...inputStyle, borderColor: border }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold opacity-70">
              Priority
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={onCallForm.priority}
              onChange={(e) =>
                setOnCallForm((f) => ({
                  ...f,
                  priority: Number(e.target.value) || 1,
                }))
              }
              className="w-full rounded-xl border px-3.5 py-2.5 text-sm shadow-none focus:outline-none"
              style={{ ...inputStyle, borderColor: border }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold opacity-70">
              Phone override
            </label>
            <input
              value={onCallForm.phoneOverride}
              onChange={(e) =>
                setOnCallForm((f) => ({ ...f, phoneOverride: e.target.value }))
              }
              placeholder="Optional"
              className="w-full rounded-xl border px-3.5 py-2.5 text-sm shadow-none focus:outline-none"
              style={{ ...inputStyle, borderColor: border }}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50 shadow-none"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              {saving ? "Saving…" : "Assign on-call"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border px-4 py-2.5 text-xs font-semibold shadow-none"
              style={{ borderColor: border }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Roster View */}
      {tab === "roster" && viewMode === "list" && (
        <div
          className="rounded-2xl border overflow-hidden shadow-none"
          style={{ borderColor: border, backgroundColor: colors.shadeBg }}
        >
          {shiftsLoading ? (
            <DarkBlurOverlayLoader />
          ) : filteredShifts.length === 0 ? (
            <div className="p-12 text-center text-sm opacity-60">
              No shifts scheduled yet.
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: border }}>
              {filteredShifts.map((s) => {
                const details = getStaffDetails(s.user);
                return (
                  <li
                    key={s._id || s.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar user={s.user} size="md" />
                      <div>
                        <p className="text-sm font-bold">
                          {personName(s.user)}
                        </p>
                        <p className="text-xs opacity-60 mt-0.5">
                          {new Date(s.date).toLocaleDateString()} ·{" "}
                          {s.startTime}–{s.endTime} ·{" "}
                          {s.shiftType.replace(/_/g, " ")}
                          {s.department ? ` · ${s.department}` : ""}
                        </p>
                        {details.phone && (
                          <p className="text-[11px] opacity-50 mt-0.5 flex items-center gap-1">
                            <Phone size={11} /> {details.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase shadow-none"
                        style={{ borderColor: border }}
                      >
                        {s.status}
                      </span>
                      {canManage && (
                        <Can perm="staff.write"><button
                          type="button"
                          title="Delete"
                          onClick={async () => {
                            if (!activeFacilityId) return;
                            try {
                              await dispatch(
                                deleteShift({
                                  facilityId: activeFacilityId,
                                  shiftId: s._id || s.id!,
                                })
                              ).unwrap();
                              notify("Shift removed");
                            } catch (err: unknown) {
                              notify(
                                typeof err === "string" ? err : "Delete failed",
                                true
                              );
                            }
                          }}
                          className="rounded-lg p-2 text-red-500 hover:opacity-80 shadow-none"
                        >
                          <Trash2 size={14} />
                        </button></Can>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {tab === "roster" && viewMode === "timetable" && (
        <div
          className="rounded-2xl border overflow-x-auto pb-2 shadow-none"
          style={{ borderColor: border, backgroundColor: colors.shadeBg }}
        >
          {shiftsLoading && localShifts.length === 0 ? (
            <DarkBlurOverlayLoader />
          ) : filteredShifts.length === 0 && !shiftsLoading ? (
            <div className="p-12 text-center text-sm opacity-60">
              No shifts found for timetable view.
            </div>
          ) : (
            <div className="flex gap-3 p-4">
              {timetableDays.map((dateKey, index) => {
                const d = new Date(dateKey);
                const dayShifts = filteredShifts.filter(
                  (s) =>
                    new Date(s.date).toISOString().split("T")[0] === dateKey
                );

                return (
                  <div
                    key={dateKey}
                    draggable={canManage}
                    onDragStart={(e) => handleColumnDragStart(e, index)}
                    onDragOver={handleColumnDragOver}
                    onDrop={(e) => {
                      if (e.dataTransfer.getData("text/plain")) {
                        handleCardDropOnDay(e, dateKey);
                      } else {
                        handleColumnDrop(e, index);
                      }
                    }}
                    className={`flex flex-col rounded-xl border p-3 min-h-[220px] min-w-[240px] flex-1 shadow-none transition-all ${
                      canManage ? "cursor-grab active:cursor-grabbing" : ""
                    }`}
                    style={{
                      borderColor: border,
                      backgroundColor: colors.shadeBgSecond,
                    }}
                  >
                    <div
                      className="flex items-center justify-between pb-2 border-b mb-2"
                      style={{ borderColor: border }}
                    >
                      <div className="text-center flex-1">
                        <p className="text-[10px] uppercase font-bold opacity-50">
                          {d.toLocaleDateString("en-US", { weekday: "short" })}
                        </p>
                        <p className="text-xs font-bold">
                          {d.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      {canManage && (
                        <GripHorizontal
                          size={14}
                          className="opacity-40 shrink-0"
                        />
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      {dayShifts.map((s) => {
                        const details = getStaffDetails(s.user);
                        const sId = s._id || s.id!;
                        return (
                          <div
                            key={sId}
                            draggable={canManage}
                            onDragStart={(e) =>
                              handleCardDragStart(e, sId, "shift")
                            }
                            className="rounded-lg border p-2 text-xs flex flex-col gap-1.5 shadow-none cursor-move"
                            style={{
                              borderColor: border,
                              backgroundColor: colors.shadeBg,
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <UserAvatar user={s.user} size="sm" />
                              <span className="font-bold truncate">
                                {personName(s.user)}
                              </span>
                            </div>
                            <div className="ml-8 space-y-0.5">
                              <p className="text-[10px] opacity-60">
                                {s.startTime}–{s.endTime}
                              </p>
                              {details.phone && (
                                <p className="text-[10px] opacity-50 flex items-center gap-1">
                                  <Phone size={9} /> {details.phone}
                                </p>
                              )}
                            </div>
                            <div className="ml-8 mt-1">
                              <span
                                className="inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase w-max shadow-none"
                                style={{
                                  backgroundColor: `color-mix(in srgb, ${PRIMARY_COLOR} 15%, transparent)`,
                                  color: PRIMARY_COLOR,
                                }}
                              >
                                {s.shiftType.replace(/_/g, " ")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {dayShifts.length === 0 && (
                        <div className="flex-1 flex items-center justify-center text-[11px] opacity-30">
                          No shifts
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* On-Call View */}
      {tab === "oncall" && viewMode === "list" && (
        <div
          className="rounded-2xl border overflow-hidden shadow-none"
          style={{ borderColor: border, backgroundColor: colors.shadeBg }}
        >
          {onCallLoading ? (
            <DarkBlurOverlayLoader />
          ) : filteredOnCall.length === 0 ? (
            <div className="p-12 text-center text-sm opacity-60">
              No on-call assignments yet.
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: border }}>
              {filteredOnCall.map((r) => {
                const details = getStaffDetails(r.user);
                const activePhone = r.phoneOverride || details.phone;
                return (
                  <li
                    key={r._id || r.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar user={r.user} size="md" />
                      <div>
                        <p className="text-sm font-bold">
                          {personName(r.user)}
                        </p>
                        <p className="text-xs opacity-60 mt-0.5">
                          {new Date(r.startAt).toLocaleString()} →{" "}
                          {new Date(r.endAt).toLocaleString()}
                        </p>
                        <p className="text-xs opacity-50 mt-0.5">
                          Priority {r.priority}
                          {r.specialty ? ` · ${r.specialty}` : ""}
                          {activePhone ? (
                            <span className="inline-flex items-center gap-1 ml-2">
                              <Phone size={10} /> {activePhone}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase shadow-none"
                        style={{ borderColor: border }}
                      >
                        {r.status}
                      </span>
                      {canManage && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!activeFacilityId) return;
                            try {
                              await dispatch(
                                deleteOnCall({
                                  facilityId: activeFacilityId,
                                  onCallId: r._id || r.id!,
                                })
                              ).unwrap();
                              notify("On-call removed");
                            } catch (err: unknown) {
                              notify(
                                typeof err === "string" ? err : "Delete failed",
                                true
                              );
                            }
                          }}
                          className="rounded-lg p-2 text-red-500 hover:opacity-80 shadow-none"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {tab === "oncall" && viewMode === "timetable" && (
        <div
          className="rounded-2xl border overflow-x-auto pb-2 shadow-none"
          style={{ borderColor: border, backgroundColor: colors.shadeBg }}
        >
          {onCallLoading && localOnCall.length === 0 ? (
            <DarkBlurOverlayLoader />
          ) : filteredOnCall.length === 0 && !onCallLoading ? (
            <div className="p-12 text-center text-sm opacity-60">
              No on-call assignments for timetable view.
            </div>
          ) : (
            <div className="flex gap-3 p-4">
              {timetableDays.map((dateKey, index) => {
                const d = new Date(dateKey);
                const dayOnCall = filteredOnCall.filter((r) => {
                  const startStr = new Date(r.startAt)
                    .toISOString()
                    .split("T")[0];
                  return startStr === dateKey;
                });

                return (
                  <div
                    key={dateKey}
                    draggable={canManage}
                    onDragStart={(e) => handleColumnDragStart(e, index)}
                    onDragOver={handleColumnDragOver}
                    onDrop={(e) => {
                      if (e.dataTransfer.getData("text/plain")) {
                        handleCardDropOnDay(e, dateKey);
                      } else {
                        handleColumnDrop(e, index);
                      }
                    }}
                    className={`flex flex-col rounded-xl border p-3 min-h-[220px] min-w-[240px] flex-1 shadow-none transition-all ${
                      canManage ? "cursor-grab active:cursor-grabbing" : ""
                    }`}
                    style={{
                      borderColor: border,
                      backgroundColor: colors.shadeBgSecond,
                    }}
                  >
                    <div
                      className="flex items-center justify-between pb-2 border-b mb-2"
                      style={{ borderColor: border }}
                    >
                      <div className="text-center flex-1">
                        <p className="text-[10px] uppercase font-bold opacity-50">
                          {d.toLocaleDateString("en-US", { weekday: "short" })}
                        </p>
                        <p className="text-xs font-bold">
                          {d.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      {canManage && (
                        <GripHorizontal
                          size={14}
                          className="opacity-40 shrink-0"
                        />
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      {dayOnCall.map((r) => {
                        const details = getStaffDetails(r.user);
                        const activePhone = r.phoneOverride || details.phone;
                        const rId = r._id || r.id!;
                        return (
                          <div
                            key={rId}
                            draggable={canManage}
                            onDragStart={(e) =>
                              handleCardDragStart(e, rId, "oncall")
                            }
                            className="rounded-lg border p-2 text-xs flex flex-col gap-1.5 shadow-none cursor-move"
                            style={{
                              borderColor: border,
                              backgroundColor: colors.shadeBg,
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <UserAvatar user={r.user} size="sm" />
                              <span className="font-bold truncate">
                                {personName(r.user)}
                              </span>
                            </div>
                            <div className="ml-8 space-y-0.5">
                              <p className="text-[10px] opacity-60">
                                {new Date(r.startAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              {activePhone && (
                                <p className="text-[10px] opacity-50 flex items-center gap-1">
                                  <Phone size={9} /> {activePhone}
                                </p>
                              )}
                            </div>
                            {r.specialty && (
                              <div className="ml-8 mt-1">
                                <span
                                  className="inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase w-max shadow-none"
                                  style={{
                                    backgroundColor: `color-mix(in srgb, ${PRIMARY_COLOR} 15%, transparent)`,
                                    color: PRIMARY_COLOR,
                                  }}
                                >
                                  {r.specialty}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {dayOnCall.length === 0 && (
                        <div className="flex-1 flex items-center justify-center text-[11px] opacity-30">
                          No on-call
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
