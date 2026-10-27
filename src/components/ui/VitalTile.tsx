"use client";

import React from "react";

type UI = {
  isDark: boolean;
  page: string;
  card: string;
  inner: string;
  text: string;
  border: string;
};

interface VitalTileProps {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  subLabel?: string;
  icon: React.ElementType;
  color: string;
  out?: boolean;
  ui: UI;
}

export function VitalTile({
  label,
  value,
  unit = "",
  subLabel,
  icon: Icon,
  color,
  out,
  ui,
}: VitalTileProps) {
  const displayValue = value != null && value !== "" ? `${value}${unit}` : "—";

  return (
    <div className="rounded-2xl p-3.5" style={{ backgroundColor: ui.inner }}>
      <span
        className="flex items-center gap-1.5 text-[11px] font-medium"
        style={{ color }}
      >
        <Icon size={13} /> {label}
      </span>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span
          className="text-base font-medium tracking-tight"
          style={{ color: out ? "#ef4444" : undefined }}
        >
          {displayValue}
        </span>
        {subLabel && (
          <span className="text-[10px] opacity-50 font-normal">{subLabel}</span>
        )}
      </div>
    </div>
  );
}
