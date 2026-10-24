"use client";

import { useEffect, useState, useRef } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Check,
  X,
} from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";

export function personLabel(u: unknown): string {
  if (!u) return "—";
  if (typeof u === "string") return u;
  const x = u as { firstName?: string; lastName?: string; email?: string; mrn?: string };
  return (
    `${x.firstName || ""} ${x.lastName || ""}`.trim() ||
    x.email ||
    x.mrn ||
    "—"
  );
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

/** Multi-select searchable list (staff or patients — pass any list with id/firstName/lastName) */
export function CustomSearchableMultiSelect({
  label,
  value,
  items,
  onChange,
  placeholder = "Select...",
  isDark,
  colors,
  border,
  searchPlaceholder = "Search...",
}: {
  label?: string;
  value: string[];
  items: any[];
  onChange: (val: string[]) => void;
  placeholder?: string;
  isDark: boolean;
  colors: any;
  border: string;
  searchPlaceholder?: string;
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

  const idOf = (m: any) => m.id || m._id;
  const filtered = items.filter((m) => {
    const fullName = `${m.firstName || ""} ${m.lastName || ""}`.toLowerCase();
    const email = (m.email || "").toLowerCase();
    const mrn = (m.mrn || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query) || mrn.includes(query);
  });

  const selected = items.filter((m) => value.includes(idOf(m)));

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((item) => item !== id));
    else onChange([...value, id]);
  };

  const remove = (e: React.MouseEvent, id: string) => {
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
          {selected.length > 0 ? (
            selected.map((m) => (
              <span
                key={idOf(m)}
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
                  onClick={(e) => remove(e, idOf(m))}
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
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs outline-none"
              style={{ color: colors.text }}
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs opacity-50">No results</div>
            ) : (
              filtered.map((m) => {
                const id = idOf(m);
                const isSelected = value.includes(id);
                const mName =
                  `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email;
                const mPhone = [m.countryCode, m.phone].filter(Boolean).join(" ");
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
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
                        {m.mrn ? ` · ${m.mrn}` : ""}
                      </p>
                      <p className="text-[10px] opacity-50 truncate">
                        {mPhone || m.email || ""}
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

export function CustomSearchableMultiStaffDropdown(
  props: React.ComponentProps<typeof CustomSearchableMultiSelect> & {
    members: any[];
  },
) {
  const { members, ...rest } = props;
  return (
    <CustomSearchableMultiSelect
      {...rest}
      items={members}
      searchPlaceholder="Search staff..."
    />
  );
}

export function CustomPopupDatePicker({
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
          <span className={value ? "font-medium text-xs" : "text-xs opacity-40"}>
            {value ? value.replace("T", " ") : "Select date & time..."}
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
