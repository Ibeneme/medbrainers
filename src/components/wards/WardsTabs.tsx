"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_COLOR } from "@/constants/colors";

const TABS = [
  { href: "/dashboard/wards", label: "Wards" },
  { href: "/dashboard/wards/beds", label: "Bed board" },
  { href: "/dashboard/wards/requests", label: "Requests" },
  { href: "/dashboard/wards/admissions", label: "Admissions" },
  { href: "/dashboard/wards/nursing", label: "Care plans" },
  { href: "/dashboard/wards/discharges", label: "Discharges" },
];

export function WardsTabs({ ui }: { ui: { inner: string; text: string } }) {
  const path = usePathname() || "";
  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-1">
      {TABS.map((t) => {
        const active = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
            style={{
              backgroundColor: active ? PRIMARY_COLOR : ui.inner,
              color: active ? "#fff" : ui.text,
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
