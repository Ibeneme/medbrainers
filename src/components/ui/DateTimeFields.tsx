"use client";

/** Reusable native date / time / datetime inputs with consistent styling */

type Colors = { text: string; shadeBgSecond?: string };

type BaseProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  isDark?: boolean;
  colors: Colors;
  className?: string;
  min?: string;
  max?: string;
};

const borderFor = (isDark?: boolean) =>
  isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";

function FieldShell({
  label,
  children,
  className = "",
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-xs font-semibold opacity-70">{label}</label>}
      {children}
    </div>
  );
}

export function DatePicker({
  label,
  value,
  onChange,
  required,
  isDark,
  colors,
  className,
  min,
  max,
}: BaseProps) {
  return (
    <FieldShell label={label} className={className}>
      <input
        type="date"
        required={required}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
        style={{
          backgroundColor: colors.shadeBgSecond || "transparent",
          color: colors.text,
          borderColor: borderFor(isDark),
          colorScheme: isDark ? "dark" : "light",
        }}
      />
    </FieldShell>
  );
}

export function TimePicker({
  label,
  value,
  onChange,
  required,
  isDark,
  colors,
  className,
}: BaseProps) {
  return (
    <FieldShell label={label} className={className}>
      <input
        type="time"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
        style={{
          backgroundColor: colors.shadeBgSecond || "transparent",
          color: colors.text,
          borderColor: borderFor(isDark),
          colorScheme: isDark ? "dark" : "light",
        }}
      />
    </FieldShell>
  );
}

export function DateTimePicker({
  label,
  value,
  onChange,
  required,
  isDark,
  colors,
  className,
  min,
  max,
}: BaseProps) {
  return (
    <FieldShell label={label} className={className}>
      <input
        type="datetime-local"
        required={required}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
        style={{
          backgroundColor: colors.shadeBgSecond || "transparent",
          color: colors.text,
          borderColor: borderFor(isDark),
          colorScheme: isDark ? "dark" : "light",
        }}
      />
    </FieldShell>
  );
}
