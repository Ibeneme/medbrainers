"use client";

import { PRIMARY_COLOR } from "@/constants/colors";
import React, { useState, useEffect, useRef } from "react";
import Link from "@/i18n/link";
import { T, useT } from "@/i18n/provider";
import { productName } from "@/constants/site";
import { ChevronDown, Check } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Data                                                                      */
/* -------------------------------------------------------------------------- */

const FACILITY_TYPES = [
  "Hospital",
  "Clinic",
  "Dental practice",
  "Pharmacy",
  "Maternity centre",
  "Occupational health clinic",
  "Other",
];

const FACILITY_SIZES = [
  "Solo practitioner",
  "Clinic (a few practitioners)",
  "Hospital",
  "Hospital group (multiple branches)",
];

const SOLUTIONS = [
  "Hospital Management System",
  "Clinic Information System",
  "Electronic Medical Record (EMR)",
  "Industry Clinic System",
  "Dental Clinic Management",
  "Pharmacy Management System",
  "Operating Theatre Management",
  "Maternity Management",
  "Radiology",
  "Blood Bank",
  "AI Analysis",
  "Other",
];

type Form = {
  name: string;
  email: string;
  phone: string;
  facility: string;
  facilityType: string;
  facilitySize: string;
  solutions: string[];
  otherSolution: string;
  message: string;
  website: string; // honeypot, must stay empty
};

type Status = "idle" | "sending" | "success" | "error";

const EMPTY: Form = {
  name: "",
  email: "",
  phone: "",
  facility: "",
  facilityType: "",
  facilitySize: "",
  solutions: [],
  otherSolution: "",
  message: "",
  website: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputCls =
  "w-full rounded-xl border border-white/10 bg-[#111113] px-4 py-3 text-[15px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-white/30";

/* -------------------------------------------------------------------------- */
/*  Shared UI bits                                                            */
/* -------------------------------------------------------------------------- */

const Label = ({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <label
    htmlFor={htmlFor}
    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55"
  >
    {children}
    {required && <span style={{ color: PRIMARY_COLOR }}> *</span>}
  </label>
);

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="mt-1.5 text-xs text-red-400">{msg}</p> : null;

const CheckIcon = () => (
  <svg
    style={{ color: PRIMARY_COLOR }}
    className="mt-0.5 h-5 w-5 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" strokeWidth="2" opacity="0.35" />
    <path d="M7.5 12.5l3 3 6-7" />
  </svg>
);

/* -------------------------------------------------------------------------- */
/*  Custom Dropdown (adapted for dark demo form)                              */
/* -------------------------------------------------------------------------- */

function CustomDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Select…",
}: {
  label?: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
  placeholder?: string;
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
    <div className="relative flex flex-col" ref={dropdownRef}>
      {label && <Label>{label}</Label>}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`${inputCls} flex items-center justify-between text-left`}
      >
        <span
          className={
            selectedOption ? "truncate font-medium" : "truncate text-white/35"
          }
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`ml-2 h-4 w-4 shrink-0 opacity-60 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[9999] mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-white/15 bg-[#1a1a1c] shadow-2xl">
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
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-white/5"
                style={{
                  backgroundColor: isSelected
                    ? "rgba(255,255,255,0.08)"
                    : "transparent",
                }}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check
                    className="ml-2 h-3.5 w-3.5 shrink-0"
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

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function DemoPage() {
  const t = useT();
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [status, setStatus] = useState<Status>("idle");

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const toggleSolution = (name: string) => {
    const next = form.solutions.includes(name)
      ? form.solutions.filter((s) => s !== name)
      : [...form.solutions, name];

    // clear otherSolution when "Other" is deselected
    if (name === "Other" && form.solutions.includes("Other")) {
      setForm((f) => ({ ...f, solutions: next, otherSolution: "" }));
    } else {
      set("solutions", next);
    }
  };

  const validate = () => {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!form.name.trim()) e.name = t("Please enter your name.");
    if (!EMAIL_RE.test(form.email.trim()))
      e.email = t("Please enter a valid email address.");
    if (!form.facility.trim())
      e.facility = t("Please enter your facility name.");
    if (form.solutions.includes("Other") && !form.otherSolution.trim()) {
      e.otherSolution = t("Please specify what you’re interested in.");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (status === "sending" || !validate()) return;

    setStatus("sending");
    try {
      // merge the custom “Other” value into the solutions array for the API
      const payload = {
        ...form,
        solutions: form.solutions.includes("Other")
          ? [
              ...form.solutions.filter((s) => s !== "Other"),
              form.otherSolution.trim() || "Other",
            ]
          : form.solutions,
      };

      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      setForm(EMPTY);
    } catch {
      setStatus("error");
    }
  };

  const facilityTypeOptions = FACILITY_TYPES.map((o) => ({
    label: t(o),
    value: o,
  }));

  const facilitySizeOptions = FACILITY_SIZES.map((o) => ({
    label: t(o),
    value: o,
  }));

  return (
    <div className="w-full bg-black font-lufga text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-28 pt-32 md:pt-44 lg:grid-cols-[1fr_1.15fr] lg:gap-20 lg:px-12">
        {/* ---------- Left: pitch ---------- */}
        <div className="flex flex-col items-start">
          <span
            className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <T>Book a demo</T>
          </span>

          <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
            <T>See</T>{" "}
            <span
              style={{ backgroundColor: PRIMARY_COLOR }}
              className="inline-block px-2 md:px-3"
            >
              {productName}
            </span>{" "}
            <T>working in your facility.</T>
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-white/60">
            <T>
              Tell us a little about your facility and we&apos;ll arrange a
              walkthrough built around the way you work.
            </T>
          </p>

          <ul className="mt-10 flex max-w-md flex-col gap-4">
            {[
              "A walkthrough tailored to your type and size of facility",
              "See the patient workflow from registration to billing",
              "Ask about setup, training and moving your existing records",
              "Get your pricing questions answered, with no obligation",
            ].map((line) => (
              <li key={line} className="flex gap-3 text-[15px] text-white/85">
                <CheckIcon />
                <T>{line}</T>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-sm text-white/50">
            <T>Prefer email?</T>{" "}
            <a
              href="mailto:contact@medicules.com"
              style={{ color: PRIMARY_COLOR }}
              className="font-medium underline-offset-4 hover:underline"
            >
              contact@medicules.com
            </a>
          </p>
        </div>

        {/* ---------- Right: form / success ---------- */}
        <div className="rounded-[28px] border border-white/10 bg-[#0d0d0f] p-6 md:p-10">
          {status === "success" ? (
            <div
              role="status"
              aria-live="polite"
              className="flex min-h-[420px] flex-col items-start justify-center gap-5"
            >
              <span
                style={{ backgroundColor: PRIMARY_COLOR }}
                className="flex h-14 w-14 items-center justify-center rounded-full"
              >
                <svg
                  className="h-7 w-7 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
              <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                <T>Request received</T>
              </h2>
              <p className="max-w-md text-base leading-relaxed text-white/60">
                <T>
                  Thank you. We&apos;ve sent a confirmation to your inbox and
                  our team will be in touch to arrange your demo.
                </T>
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <Link
                  href="/"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                  className="group inline-flex items-center gap-3 rounded-full py-2 pl-8 pr-2 text-base font-semibold text-white transition-transform hover:scale-105"
                >
                  <T>Back to home</T>
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg text-black transition-transform duration-200 group-hover:rotate-45"
                  >
                    →
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="rounded-full border border-white/20 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <T>Send another request</T>
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              noValidate
              className="flex flex-col gap-5"
            >
              <div>
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  <T>Request your demo</T>
                </h2>
                <p className="mt-1 text-sm text-white/50">
                  <T>Fields marked * are required.</T>
                </p>
              </div>

              {/* honeypot */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name" required>
                    <T>Full name</T>
                  </Label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder={t("Your name")}
                    className={inputCls}
                  />
                  <FieldError msg={errors.name} />
                </div>

                <div>
                  <Label htmlFor="email" required>
                    <T>Work email</T>
                  </Label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@facility.com"
                    className={inputCls}
                  />
                  <FieldError msg={errors.email} />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="phone">
                    <T>Phone / WhatsApp</T>
                  </Label>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+234 …"
                    className={inputCls}
                  />
                </div>

                <div>
                  <Label htmlFor="facility" required>
                    <T>Facility name</T>
                  </Label>
                  <input
                    id="facility"
                    type="text"
                    autoComplete="organization"
                    value={form.facility}
                    onChange={(e) => set("facility", e.target.value)}
                    placeholder={t("Your clinic or hospital")}
                    className={inputCls}
                  />
                  <FieldError msg={errors.facility} />
                </div>
              </div>

              {/* Custom dropdowns instead of native <select> */}
              <div className="grid gap-5 sm:grid-cols-2">
                <CustomDropdown
                  label={t("Facility type")}
                  value={form.facilityType}
                  options={facilityTypeOptions}
                  onChange={(val) => set("facilityType", val)}
                  placeholder={t("Select…")}
                />

                <CustomDropdown
                  label={t("Facility size")}
                  value={form.facilitySize}
                  options={facilitySizeOptions}
                  onChange={(val) => set("facilitySize", val)}
                  placeholder={t("Select…")}
                />
              </div>

              {/* Solutions + Other free-text */}
              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/55">
                  <T>What are you interested in?</T>
                </span>
                <div className="flex flex-wrap gap-2">
                  {SOLUTIONS.map((s) => {
                    const on = form.solutions.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleSolution(s)}
                        style={
                          on
                            ? {
                                backgroundColor: PRIMARY_COLOR,
                                borderColor: PRIMARY_COLOR,
                              }
                            : undefined
                        }
                        className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                          on
                            ? "text-white"
                            : "border-white/15 text-white/70 hover:border-white/30 hover:text-white"
                        }`}
                      >
                        <T>{s}</T>
                      </button>
                    );
                  })}
                </div>

                {/* Show input when “Other” is selected */}
                {form.solutions.includes("Other") && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={form.otherSolution}
                      onChange={(e) => set("otherSolution", e.target.value)}
                      placeholder={t("Please specify…")}
                      className={inputCls}
                    />
                    <FieldError msg={errors.otherSolution} />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="message">
                  <T>Anything we should know?</T>
                </Label>
                <textarea
                  id="message"
                  rows={4}
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  placeholder={t("Number of staff, current system, questions…")}
                  className={`${inputCls} resize-y`}
                />
              </div>

              {status === "error" && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                  <T>
                    Something went wrong sending your request. Please try again,
                    or email us at contact@medicules.com.
                  </T>
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                style={{ backgroundColor: PRIMARY_COLOR }}
                className="group mt-1 inline-flex w-full items-center justify-between rounded-full py-2 pl-8 pr-2 text-base font-semibold text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 sm:w-auto sm:self-start sm:gap-6"
              >
                <span>
                  {status === "sending" ? <T>Sending…</T> : <T>Request demo</T>}
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg text-black transition-transform duration-200 group-hover:rotate-45"
                >
                  →
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
