///Users/macbook/Downloads/CodesDoc/medbrainers/src/components/ui/items.tsx

"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Plus,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Check,
  GripHorizontal,
  X,
  LayoutGrid,
  List as ListIcon,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchMyFacilities,
  fetchFacilityMembers,
  fetchAllTasks,
  createTask,
  updateTask,
  deleteTask,
} from "@/api/slices";
import type { FacilityTask, TaskPriority, TaskStatus } from "@/api/types";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";

/* -------------------------------------------------------------------------- */
/*  Types & Tokens                                                            */
/* -------------------------------------------------------------------------- */

type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};

/* -------------------------------------------------------------------------- */
/*  Helper Functions & Components                                             */
/* -------------------------------------------------------------------------- */

export function personLabel(u: unknown): string {
  if (!u) return "—";
  if (typeof u === "string") return u;
  const x = u as { firstName?: string; lastName?: string; email?: string };
  return `${x.firstName || ""} ${x.lastName || ""}`.trim() || x.email || "—";
}

export function getProfilePicture(user: unknown): string | undefined {
  if (!user || typeof user === "string") return undefined;
  const u = user as { profilePicture?: string; avatar?: string };
  return u.profilePicture || u.avatar;
}

export function UserAvatar({
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

export function CustomDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Select...",
  isDark,
  colors,
  border,
  searchable = false,
}: {
  label?: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
  placeholder?: string;
  isDark: boolean;
  colors: any;
  border: string;
  /** Show a filter input at the top of the option list */
  searchable?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
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

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value);
  const visibleOptions =
    searchable && query.trim()
      ? options.filter((o) =>
          o.label.toLowerCase().includes(query.trim().toLowerCase())
        )
      : options;

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
          backgroundColor: colors.shadeBg || "transparent",
          color: colors.text,
          borderColor: border,
        }}
      >
        <span
          className={
            selectedOption
              ? "font-medium truncate capitalize"
              : "opacity-40 truncate"
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
          className={`absolute top-full left-0 z-[9999] mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border shadow-2xl ${
            isDark ? "border-white/20 bg-[#1e1e1e]" : "border-black/15 bg-white"
          }`}
        >
          {searchable && (
            <div
              className="sticky top-0 z-10 p-2"
              style={{ backgroundColor: isDark ? "#1e1e1e" : "#fff" }}
            >
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-lg border bg-transparent px-3 py-2 text-xs outline-none"
                style={{ borderColor: border, color: colors.text }}
              />
            </div>
          )}
          {searchable && visibleOptions.length === 0 && (
            <p className="px-3.5 py-3 text-xs opacity-50">No results</p>
          )}
          {visibleOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs font-semibold transition hover:opacity-80 capitalize"
                style={{
                  backgroundColor: isSelected
                    ? isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.05)"
                    : "transparent",
                  color: colors.text,
                }}
              >
                <span className="truncate capitalize">{opt.label}</span>
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

export function CustomSearchableMultiStaffDropdown({
  label,
  value,
  members,
  onChange,
  placeholder = "Select staff...",
  isDark,
  colors,
  border,
}: {
  label?: string;
  value: string[];
  members: any[];
  onChange: (val: string[]) => void;
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

  const selectedMembers = members.filter((m) => value.includes(m.id));

  const toggleMember = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((item) => item !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const removeMember = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onChange(value.filter((item) => item !== id));
  };

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
        <div className="flex items-center gap-2 truncate flex-wrap py-0.5">
          {selectedMembers.length > 0 ? (
            selectedMembers.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold border capitalize"
                style={{
                  borderColor: border,
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                }}
              >
                <UserAvatar user={m} size="sm" />
                <span>
                  {m.firstName} {m.lastName}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => removeMember(e, m.id)}
                  className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition"
                  title="Remove"
                >
                  <X size={12} className="opacity-60 hover:opacity-100" />
                </span>
              </span>
            ))
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
                const isSelected = value.includes(m.id);
                const mName =
                  `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email;
                const mPhone = [m.countryCode, m.phone]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
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

export function CustomPopupDatePicker({
  label,
  value,
  onChange,
  border,
  colors,
  isDark,
  placeholder = "Select date & time...",
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  border: string;
  colors: any;
  isDark: boolean;
  placeholder?: string;
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
    const existingTime = value.includes("T") ? value.split("T")[1] : "08:00";
    onChange(`${currentYear}-${mStr}-${dStr}T${existingTime}`);
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
            {value ? value.replace("T", " ") : placeholder}
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
              const isSelected = value.startsWith(dateStr);

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

export function Modal({
  open,
  title,
  onClose,
  children,
  ui,
  z = 50,
  maxWidth = "max-w-lg",
  escape = true,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  ui: UI;
  z?: number;
  maxWidth?: string;
  escape?: boolean;
}) {
  useEffect(() => {
    if (!open || !escape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, escape, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      style={{ zIndex: z }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative w-full ${maxWidth} rounded-[28px] p-6 space-y-5 max-h-[90vh] overflow-y-auto outline-none`}
        style={{ backgroundColor: ui.card, color: ui.text }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium tracking-tight">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full opacity-70 hover:opacity-100 transition outline-none focus:outline-none"
            style={{ backgroundColor: ui.inner }}
          >
            <X size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  tone: "danger" | "primary";
  onConfirm: () => Promise<void>;
} | null;

export function ConfirmModal({
  state,
  busy,
  onCancel,
  onConfirm,
  ui,
}: {
  state: ConfirmState;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  ui: UI;
}) {
  const danger = state?.tone === "danger";
  const accent = danger ? "#ef4444" : PRIMARY_COLOR;
  return (
    <Modal
      open={!!state}
      title={state?.title || ""}
      onClose={() => !busy && onCancel()}
      ui={ui}
      z={60}
      maxWidth="max-w-sm"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}1f`, color: accent }}
        >
          {danger ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
        </div>
        <p className="text-sm leading-relaxed opacity-75">{state?.message}</p>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="rounded-full px-5 py-2.5 text-xs font-semibold disabled:opacity-50 outline-none focus:outline-none"
          style={{ backgroundColor: ui.inner }}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className="rounded-full px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50 outline-none focus:outline-none"
          style={{ backgroundColor: accent }}
        >
          {busy ? "Working..." : state?.confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: ToggleSwitchProps) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer group select-none py-1">
      <div className="flex flex-col">
        {label && (
          <span className="text-xs font-semibold group-hover:opacity-100 transition">
            {label}
          </span>
        )}
        {description && (
          <span className="text-[10px] opacity-50">{description}</span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
        style={{
          backgroundColor: checked ? PRIMARY_COLOR : "rgba(150, 150, 150, 0.3)",
        }}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}
