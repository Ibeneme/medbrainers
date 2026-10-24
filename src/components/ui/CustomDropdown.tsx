"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";

export type DropdownOption = { value: string; label: string };

type Colors = {
  text: string;
  shadeBg?: string;
  shadeBgSecond?: string;
};

type Props = {
  label?: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  isDark?: boolean;
  colors: Colors;
  className?: string;
};

export default function CustomDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Select…",
  isDark = false,
  colors,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const border = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className={`relative flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold opacity-70" style={{ color: colors.text }}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition"
        style={{
          backgroundColor: colors.shadeBgSecond || "transparent",
          color: colors.text,
          borderColor: border,
        }}
      >
        <span className={`truncate ${selected ? "font-medium capitalize" : "opacity-40"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 opacity-60 shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 z-[9999] mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border shadow-2xl"
          style={{
            borderColor: border,
            backgroundColor: isDark ? "#1e1e1e" : "#fff",
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
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs font-semibold capitalize hover:opacity-80"
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
                  <Check className="h-3.5 w-3.5 shrink-0 ml-2" style={{ color: PRIMARY_COLOR }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
