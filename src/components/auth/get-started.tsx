"use client";

import { PRIMARY_COLOR } from "@/constants/colors";

/* Place this file at: app/get-started/page.tsx */

import React, { useEffect, useRef, useState } from "react";
import Link from "@/i18n/link";
import { useRouter } from "@/i18n/link";
import { ChevronDown } from "lucide-react";
import { T, useT } from "@/i18n/provider";
import { productName } from "@/constants/site";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  verifyEmail,
  signup,
  clearAuthError,
  clearOtpState,
} from "@/api/slices";
import DarkBlurOverlayLoader from "../atoms/loaders/DarkBlurOverlayLoader";

const REDIRECT_AFTER_SIGNUP = "/login";
const RESEND_SECONDS = 30;

/* ---------- Validation ---------- */
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const nameOk = (v: string) => v.trim().length >= 2;
const phoneDigits = (v: string) => v.replace(/\D/g, "").replace(/^0+/, "");
const phoneOk = (v: string) => {
  const n = phoneDigits(v).length;
  return n >= 7 && n <= 12;
};
const pwChecks = (v: string) => ({
  length: v.length >= 8,
  letter: /[A-Za-z]/.test(v),
  number: /\d/.test(v),
});
const pwOk = (v: string) => Object.values(pwChecks(v)).every(Boolean);
const pwScore = (v: string) => {
  let s = 0;
  if (v.length >= 8) s++;
  if (v.length >= 12) s++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
  if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) s++;
  return s;
};

const countries = [
  { name: "Nigeria", code: "+234", iso: "ng" },
  { name: "United Kingdom", code: "+44", iso: "gb" },
  { name: "United States", code: "+1", iso: "us" },
  { name: "France", code: "+33", iso: "fr" },
  { name: "Italy", code: "+39", iso: "it" },
  { name: "Canada", code: "+1", iso: "ca" },
  { name: "Switzerland", code: "+41", iso: "ch" },
  { name: "Cameroon", code: "+237", iso: "cm" },
  { name: "Benin Republic", code: "+229", iso: "bj" },
  { name: "Ivory Coast", code: "+225", iso: "ci" },
  { name: "Ghana", code: "+233", iso: "gh" },
  { name: "Togo", code: "+228", iso: "tg" },
];

/* ---------- Small icons ---------- */
const Icon = ({
  d,
  className = "h-4 w-4",
}: {
  d: string;
  className?: string;
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);
const CheckIcon = (p: { className?: string }) => (
  <Icon d="M5 12.5l4.5 4.5L19 7.5" {...p} />
);
const LockIcon = (p: { className?: string }) => (
  <Icon d="M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z" {...p} />
);
const EyeIcon = (p: { className?: string }) => (
  <Icon
    d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z"
    {...p}
  />
);
const EyeOffIcon = (p: { className?: string }) => (
  <Icon
    d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0112 6c6.5 0 10 6 10 6a17 17 0 01-3.2 3.9M6.6 7.6A16.6 16.6 0 002 12s3.5 7 10 7c1.6 0 3-.4 4.2-1M9.9 9.9a3 3 0 004.2 4.2"
    {...p}
  />
);

/* ---------- Shared styles ---------- */
const labelCls = "mb-2 block text-sm font-medium text-white/70";
const inputBase =
  "h-12 w-full rounded-xl border bg-white/[0.04] px-4 text-[15px] text-white placeholder-white/30 outline-none transition-colors disabled:cursor-not-allowed";
const inputBorder = (invalid: boolean) =>
  invalid ? "border-red-500/70" : "border-white/10";
const errCls = "mt-1.5 text-xs text-red-400";

type EmailStatus = "idle" | "sent" | "verified";

export default function GetStartedPage() {
  const t = useT();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "+234",
    phone: "",
    password: "",
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [otpError, setOtpError] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showPw, setShowPw] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Custom Country Dropdown State
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const locked = emailStatus === "verified";
  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));
  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setCountryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* resend countdown */
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  /* ---------- Email verification (POST /auth/verify-email) ---------- */
  const onEmailChange = (v: string) => {
    if (locked) return;
    set("email", v);
    if (emailStatus !== "idle") {
      setEmailStatus("idle");
      setOtp(Array(6).fill(""));
      setOtpError(false);
      dispatch(clearOtpState());
    }
  };

  const sendCode = async () => {
    if (!emailOk(form.email)) {
      touch("email");
      console.log("❌ [SIGNUP] Invalid email, cannot send OTP", form.email);
      return;
    }
    dispatch(clearAuthError());
    setSendingOtp(true);
    const payload = {
      email: form.email.trim().toLowerCase(),
      firstName: form.firstName.trim() || undefined,
    };
    console.log(
      "✉️ [SIGNUP] Dispatch verifyEmail → POST /auth/verify-email",
      payload
    );
    try {
      const res = await dispatch(verifyEmail(payload)).unwrap();
      console.log("✅ [SIGNUP] OTP sent", res);
      setEmailStatus("sent");
      setOtp(Array(6).fill(""));
      setOtpError(false);
      setCooldown(RESEND_SECONDS);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (err) {
      console.error("❌ [SIGNUP] verifyEmail failed", err);
    } finally {
      setSendingOtp(false);
    }
  };

  /**
   * Backend verifies OTP only on POST /auth/signup.
   * Locally we just collect 6 digits and unlock the form.
   */
  const markOtpReady = (code: string) => {
    console.log("🔑 [SIGNUP] OTP digits complete (will verify on signup)", {
      email: form.email.trim(),
      code,
    });
    setEmailStatus("verified");
    setOtpError(false);
  };

  const onOtpChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    setOtpError(false);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
    if (next.every(Boolean)) markOtpReady(next.join(""));
  };

  const onOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const onOtpPaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!digits) return;
    e.preventDefault();
    const next = Array(6)
      .fill("")
      .map((_, i) => digits[i] ?? "");
    setOtp(next);
    otpRefs.current[Math.min(digits.length, 5)]?.focus();
    if (digits.length === 6) markOtpReady(digits);
  };

  /* ---------- Submit (POST /auth/signup) ---------- */
  const nameValid = nameOk(form.firstName) && nameOk(form.lastName);
  const otpCode = otp.join("");
  const valid =
    nameValid &&
    emailStatus === "verified" &&
    otpCode.length === 6 &&
    phoneOk(form.phone) &&
    pwOk(form.password);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      password: true,
    });
    dispatch(clearAuthError());

    if (!valid) {
      console.log("❌ [SIGNUP] Client validation failed", {
        nameValid,
        emailStatus,
        otpCode,
        phoneOk: phoneOk(form.phone),
        pwOk: pwOk(form.password),
      });
      return;
    }

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      countryCode: form.countryCode,
      phone: phoneDigits(form.phone),
      password: form.password,
      otp: otpCode,
    };

    console.log("🚀 [SIGNUP] Dispatch signup → POST /auth/signup", {
      ...payload,
      password: "***",
    });

    try {
      const res = await dispatch(signup(payload)).unwrap();
      console.log("✅ [SIGNUP] Account created", res.data);
      setIsRedirecting(true);
      console.log("➡️ [SIGNUP] Redirect →", REDIRECT_AFTER_SIGNUP);
      router.push(REDIRECT_AFTER_SIGNUP);
    } catch (err) {
      console.error("❌ [SIGNUP] signup failed", err);
      setEmailStatus("sent");
      setOtp(Array(6).fill(""));
      setOtpError(true);
    }
  };

  const showErr = (k: string, bad: boolean) => (touched[k] || attempted) && bad;
  const checks = pwChecks(form.password);
  const score = pwScore(form.password);
  const scoreLabel = ["Too weak", "Weak", "Okay", "Good", "Strong"][score];
  const scoreColor = [
    "bg-red-500",
    "bg-red-500",
    "bg-amber-400",
    "bg-lime-400",
    "bg-emerald-400",
  ][score];

  const selectedCountry =
    countries.find((c) => c.code === form.countryCode) || countries[0];
  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      t(c.name).toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.includes(countrySearch)
  );

  const busy = loading || sendingOtp || isRedirecting;

  return (
    <>
      {busy && <DarkBlurOverlayLoader loaderProps={{ size: 64 }} />}

      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          <T>Let&apos;s get you set up</T>
        </h2>
        <p className="mt-2 text-sm text-white/50">
          <T>It takes about a minute. Already have an account?</T>{" "}
          <Link
            href="/login"
            className="text-white underline-offset-2 hover:underline"
          >
            <T>Sign in</T>
          </Link>
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {/* names */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className={labelCls}>
              <T>First name</T>
            </label>
            <input
              id="firstName"
              autoComplete="given-name"
              disabled={busy}
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              onBlur={() => touch("firstName")}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = PRIMARY_COLOR)
              }
              onBlurCapture={(e) => (e.currentTarget.style.borderColor = "")}
              aria-invalid={showErr("firstName", !nameOk(form.firstName))}
              placeholder="Ada"
              className={`${inputBase} ${inputBorder(
                showErr("firstName", !nameOk(form.firstName))
              )}`}
            />
            {showErr("firstName", !nameOk(form.firstName)) && (
              <p className={errCls}>
                <T>Enter your first name.</T>
              </p>
            )}
          </div>
          <div>
            <label htmlFor="lastName" className={labelCls}>
              <T>Last name</T>
            </label>
            <input
              id="lastName"
              autoComplete="family-name"
              disabled={busy}
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              onBlur={() => touch("lastName")}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = PRIMARY_COLOR)
              }
              onBlurCapture={(e) => (e.currentTarget.style.borderColor = "")}
              aria-invalid={showErr("lastName", !nameOk(form.lastName))}
              placeholder="Okafor"
              className={`${inputBase} ${inputBorder(
                showErr("lastName", !nameOk(form.lastName))
              )}`}
            />
            {showErr("lastName", !nameOk(form.lastName)) && (
              <p className={errCls}>
                <T>Enter your last name.</T>
              </p>
            )}
          </div>
        </div>

        {/* email + inline verify */}
        <div>
          <label htmlFor="email" className={labelCls}>
            <T>Email address</T>
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={form.email}
              onChange={(e) => onEmailChange(e.target.value)}
              onBlur={() => touch("email")}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = PRIMARY_COLOR)
              }
              onBlurCapture={(e) => (e.currentTarget.style.borderColor = "")}
              disabled={locked || busy}
              readOnly={locked}
              aria-invalid={showErr("email", !emailOk(form.email))}
              placeholder="you@hospital.com"
              className={`${inputBase} pr-28 ${
                locked
                  ? "border-emerald-500/40 text-white/80"
                  : inputBorder(showErr("email", !emailOk(form.email)))
              }`}
            />

            <div className="absolute inset-y-0 right-2 flex items-center">
              {locked ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                  <CheckIcon className="h-3.5 w-3.5" />
                  <T>Verified</T>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={
                    !emailOk(form.email) ||
                    emailStatus === "sent" ||
                    sendingOtp ||
                    busy
                  }
                  style={
                    !emailOk(form.email) || emailStatus === "sent"
                      ? undefined
                      : { backgroundColor: PRIMARY_COLOR }
                  }
                  className="inline-flex h-8 min-w-[64px] items-center justify-center rounded-full px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 shadow-sm"
                >
                  <T>{emailStatus === "sent" ? "Sent" : "Verify"}</T>
                </button>
              )}
            </div>
          </div>

          {showErr("email", !emailOk(form.email)) && !locked && (
            <p className={errCls}>
              <T>Enter a valid email address.</T>
            </p>
          )}

          {locked && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/50">
              <LockIcon className="h-3 w-3" />
              <T>This email is verified and can&apos;t be changed.</T>
            </p>
          )}

          {/* code entry */}
          {emailStatus === "sent" && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-sm text-white/70">
                <T>We sent a 6-digit code to</T>{" "}
                <span className="font-medium text-white">
                  {form.email.trim()}
                </span>
                <T>. Enter it below.</T>
              </p>

              <div
                className="mt-4 flex gap-2"
                onPaste={onOtpPaste}
                role="group"
                aria-label={t("Verification code")}
              >
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    value={d}
                    disabled={busy}
                    onChange={(e) => onOtpChange(i, e.target.value)}
                    onKeyDown={(e) => onOtpKeyDown(i, e)}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = PRIMARY_COLOR)
                    }
                    onBlur={(e) => (e.currentTarget.style.borderColor = "")}
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    aria-label={`Digit ${i + 1}`}
                    className="h-12 w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.04] text-center text-lg font-semibold text-white outline-none transition-colors"
                  />
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setEmailStatus("idle");
                    setOtp(Array(6).fill(""));
                  }}
                  className="text-white/50 underline-offset-2 transition-colors hover:text-white hover:underline disabled:opacity-50"
                >
                  <T>Use a different email</T>
                </button>
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={cooldown > 0 || busy}
                  style={cooldown > 0 ? undefined : { color: PRIMARY_COLOR }}
                  className="font-medium transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:text-white/30"
                >
                  {cooldown > 0
                    ? `${t("Resend code in")} ${cooldown}s`
                    : t("Resend code")}
                </button>
              </div>

              <p className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-[11px] text-white/50">
                <T>UI Demo: enter any 6 digits to verify email.</T>
              </p>
            </div>
          )}
        </div>

        {/* phone with custom search dropdown */}
        <div>
          <label htmlFor="phone" className={labelCls}>
            <T>Phone number</T>
          </label>
          <div className="flex gap-2">
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                type="button"
                disabled={busy}
                onClick={() => setCountryOpen(!countryOpen)}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = PRIMARY_COLOR)
                }
                onBlur={(e) => (e.currentTarget.style.borderColor = "")}
                className="flex h-12 w-[116px] items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition-colors hover:border-white/20 disabled:opacity-50"
              >
                <span className="flex items-center gap-2 truncate">
                  <img
                    src={`https://flagcdn.com/w40/${selectedCountry.iso}.png`}
                    alt={t(selectedCountry.name)}
                    width={20}
                    height={20}
                    className="h-3 w-5 rounded-[12px] object-cover shrink-0"
                  />
                  <span className="font-medium">{selectedCountry.code}</span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-white/40 transition-transform duration-200 ${
                    countryOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {countryOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-white/15 bg-[#121215] p-2 shadow-2xl backdrop-blur-md">
                  <div className="p-1.5 pb-2">
                    <input
                      type="text"
                      placeholder={t("Search country or code...")}
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = PRIMARY_COLOR)
                      }
                      className="h-10 w-full rounded-lg border border-white/10 bg-black/50 px-3 text-xs text-white placeholder-white/30 outline-none"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-0.5">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((c) => {
                        const isActive = form.countryCode === c.code;
                        return (
                          <button
                            key={`${c.name}-${c.code}`}
                            type="button"
                            onClick={() => {
                              set("countryCode", c.code);
                              setCountryOpen(false);
                              setCountrySearch("");
                            }}
                            style={
                              isActive
                                ? { backgroundColor: PRIMARY_COLOR }
                                : undefined
                            }
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs transition-colors ${
                              isActive
                                ? "text-white font-semibold"
                                : "text-white/80 hover:bg-white/10"
                            }`}
                          >
                            <span className="flex items-center gap-2.5 truncate">
                              <img
                                src={`https://flagcdn.com/w40/${c.iso}.png`}
                                alt={t(c.name)}
                                width={20}
                                height={20}
                                className="h-3 w-5 rounded-[12px] object-cover shrink-0"
                              />
                              <span className="truncate">{t(c.name)}</span>
                            </span>
                            <span
                              className={
                                isActive ? "text-white/90" : "text-white/50"
                              }
                            >
                              {c.code}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="py-4 text-center text-xs text-white/40">
                        <T>No country found</T>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              disabled={busy}
              value={form.phone}
              onChange={(e) =>
                set("phone", e.target.value.replace(/[^\d\s]/g, ""))
              }
              onBlur={() => touch("phone")}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = PRIMARY_COLOR)
              }
              onBlurCapture={(e) => (e.currentTarget.style.borderColor = "")}
              aria-invalid={showErr("phone", !phoneOk(form.phone))}
              placeholder="801 234 5678"
              className={`${inputBase} ${inputBorder(
                showErr("phone", !phoneOk(form.phone))
              )}`}
            />
          </div>
          {showErr("phone", !phoneOk(form.phone)) && (
            <p className={errCls}>
              <T>Enter a valid phone number.</T>
            </p>
          )}
        </div>

        {/* password */}
        <div>
          <label htmlFor="password" className={labelCls}>
            <T>Password</T>
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              disabled={busy}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              onBlur={() => touch("password")}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = PRIMARY_COLOR)
              }
              onBlurCapture={(e) => (e.currentTarget.style.borderColor = "")}
              aria-invalid={showErr("password", !pwOk(form.password))}
              placeholder={t("At least 8 characters")}
              className={`${inputBase} pr-12 ${inputBorder(
                showErr("password", !pwOk(form.password))
              )}`}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? t("Hide password") : t("Show password")}
              className="absolute inset-y-0 right-2 my-auto flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              {showPw ? (
                <EyeOffIcon className="h-[18px] w-[18px]" />
              ) : (
                <EyeIcon className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>

          {form.password && (
            <div className="mt-3">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < score ? scoreColor : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-xs text-white/50">
                <T>{scoreLabel}</T>
              </p>
            </div>
          )}

          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {[
              [checks.length, "8+ characters"],
              [checks.letter, "A letter"],
              [checks.number, "A number"],
            ].map(([ok, label]) => (
              <li
                key={label as string}
                className={`flex items-center gap-1.5 ${
                  ok ? "text-emerald-400" : "text-white/40"
                }`}
              >
                <CheckIcon className="h-3 w-3" />
                <T>{label as string}</T>
              </li>
            ))}
          </ul>
        </div>

        {/* submit */}
        <div className="pt-1">
          <button
            type="submit"
            aria-disabled={!valid || busy}
            disabled={busy}
            style={
              valid && !busy ? { backgroundColor: PRIMARY_COLOR } : undefined
            }
            className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white transition-opacity ${
              valid && !busy
                ? "hover:opacity-90 shadow-lg"
                : "cursor-not-allowed bg-white/10 text-white/40"
            }`}
          >
            <T>Create account</T>
          </button>

          {!valid && emailStatus !== "verified" && (
            <p className="mt-2.5 text-center text-xs text-white/50">
              <T>Verify your email to create your account.</T>
            </p>
          )}
        </div>
      </form>
    </>
  );
}
