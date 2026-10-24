"use client";

import React, { useId } from "react";
import type { Locale } from "./config";

const base = "h-4 w-4 rounded-full shrink-0 shadow-sm";

/* clipPath ids must be unique per instance, otherwise several flags on one page break each other. */
export function UKFlag({ className = base }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const s = `uk-s-${uid}`;
  const t = `uk-t-${uid}`;
  return (
    <svg className={className} viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <clipPath id={s}><path d="M0,0 v30 h60 v-30 z" /></clipPath>
      <clipPath id={t}><path d="M30,15 h30 v15 z v-15 h-30 z h-30 v-15 z v15 h30 z" /></clipPath>
      <g clipPath={`url(#${s})`}>
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${t})`} stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

export function FRFlag({ className = base }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect fill="#ED2939" width="9" height="6" />
      <rect fill="#fff" width="6" height="6" />
      <rect fill="#002395" width="3" height="6" />
    </svg>
  );
}

export function Flag({ locale }: { locale: Locale }) {
  return locale === "fr" ? <FRFlag /> : <UKFlag />;
}
