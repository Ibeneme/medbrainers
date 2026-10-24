"use client";

import { PRIMARY_COLOR } from "@/constants/colors";
import React, { useRef, useState, useEffect } from "react";
import Link from "@/i18n/link";
import { useRouter } from "@/i18n/link";
import { T, useT } from "@/i18n/provider";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  clearAuthError,
  clearOtpState,
} from "@/api/slices";
import DarkBlurOverlayLoader from "../atoms/loaders/DarkBlurOverlayLoader";

const REDIRECT_AFTER_RESET = "/login";
const RESEND_SECONDS = 30;

/* ---------- Validation Helpers ---------- */
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
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

/* ---------- Small Icons ---------- */
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

/* ---------- Shared Styles ---------- */
const labelCls = "mb-2 block text-sm font-medium text-white/70";
const inputBase =
  "h-12 w-full rounded-xl border bg-white/[0.04] px-4 text-[15px] text-white placeholder-white/30 outline-none transition-colors disabled:cursor-not-allowed";
const inputBorder = (invalid: boolean) =>
  invalid ? "border-red-500/70" : "border-white/10";
const errCls = "mt-1.5 text-xs text-red-400";

type ResetStep = "email" | "otp" | "reset" | "success";

export default function ForgotPasswordPage() {
  const t = useT();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, resetToken } = useAppSelector((s) => s.auth);

  const [step, setStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwTouched, setPwTouched] = useState({
    password: false,
    confirm: false,
  });
  const [showPw, setShowPw] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  /* Resend Timer */
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  /* Reset all local form state & Redux auth state */
  const handleResetState = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setStep("email");
    setEmail("");
    setEmailTouched(false);
    setOtpCode("");
    setOtpError(false);
    setPassword("");
    setConfirmPassword("");
    setPwTouched({ password: false, confirm: false });
    dispatch(clearAuthError());
    dispatch(clearOtpState());
    router.push(REDIRECT_AFTER_RESET);
  };

  /* Handler 1: POST /auth/forgot-password */
  const onSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    if (!emailOk(email)) return;
    dispatch(clearAuthError());
    const payload = { email: email.trim().toLowerCase() };
    try {
      await dispatch(forgotPassword(payload)).unwrap();
      setStep("otp");
      setOtpCode("");
      setOtpError(false);
      setCooldown(RESEND_SECONDS);
      setTimeout(() => otpInputRef.current?.focus(), 50);
    } catch (err) {
      console.error("❌ [RESET] forgotPassword failed", err);
    }
  };

  /* Handler 2: POST /auth/verify-reset-otp when 6 digits entered */
  const handleOtpInput = async (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    setOtpCode(cleaned);
    setOtpError(false);

    if (cleaned.length !== 6) return;

    dispatch(clearAuthError());
    const payload = {
      email: email.trim().toLowerCase(),
      otp: cleaned,
    };
    try {
      await dispatch(verifyResetOtp(payload)).unwrap();
      setStep("reset");
      setOtpError(false);
    } catch (err) {
      console.error("❌ [RESET] verifyResetOtp failed", err);
      setOtpError(true);
    }
  };

  /* Handler 3: POST /auth/reset-password */
  const matchOk = password.length > 0 && password === confirmPassword;
  const resetValid = pwOk(password) && matchOk;

  const onResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwTouched({ password: true, confirm: true });
    if (!resetValid) return;
    if (!resetToken) {
      setStep("otp");
      return;
    }

    dispatch(clearAuthError());
    const payload = {
      resetToken,
      newPassword: password,
    };

    try {
      await dispatch(resetPassword(payload)).unwrap();
      setStep("success");
      setTimeout(() => {
        router.push(REDIRECT_AFTER_RESET);
      }, 2000);
    } catch (err) {
      console.error("❌ [RESET] resetPassword failed", err);
    }
  };

  const checks = pwChecks(password);
  const score = pwScore(password);
  const scoreLabel = ["Too weak", "Weak", "Okay", "Good", "Strong"][score];
  const scoreColor = [
    "bg-red-500",
    "bg-red-500",
    "bg-amber-400",
    "bg-lime-400",
    "bg-emerald-400",
  ][score];
  const busy = loading;

  return (
    <>
      {/* Dark Blur Overlay Loader */}
      {busy && <DarkBlurOverlayLoader loaderProps={{ size: 64 }} />}

      {/* STEP 1: EMAIL ENTRY */}
      {step === "email" && (
        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              <T>Forgot password</T>
            </h2>
            <p className="mt-2 text-sm text-white/50">
              <T>
                Enter your email address and we&apos;ll send you a 6-digit
                verification code.
              </T>
            </p>
          </div>

          <form
            onSubmit={onSendCode}
            noValidate
            className="flex flex-col gap-5"
          >
            <div>
              <label htmlFor="email" className={labelCls}>
                <T>Email address</T>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                disabled={busy}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = PRIMARY_COLOR)
                }
                onBlurCapture={(e) => (e.currentTarget.style.borderColor = "")}
                aria-invalid={emailTouched && !emailOk(email)}
                placeholder="you@hospital.com"
                className={`${inputBase} ${inputBorder(
                  emailTouched && !emailOk(email)
                )}`}
              />
              {emailTouched && !emailOk(email) && (
                <p className={errCls}>
                  <T>Enter a valid email address.</T>
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={busy}
                style={busy ? undefined : { backgroundColor: PRIMARY_COLOR }}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-lg disabled:opacity-50"
              >
                <T>Send reset code</T>
              </button>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/login"
                onClick={handleResetState}
                className="text-xs text-white/50 underline-offset-2 hover:text-white hover:underline"
              >
                <T>Remembered password? Sign in</T>
              </Link>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: VERIFY OTP CODE */}
      {error && step !== "success" && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {step === "otp" && (
        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              <T>Verify reset code</T>
            </h2>
            <p className="mt-2 text-sm text-white/50">
              <T>We sent a 6-digit code to</T>{" "}
              <span className="font-medium text-white">{email.trim()}</span>.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <label className={labelCls}>
              <T>Enter verification code</T>
            </label>
            <input
              ref={otpInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              disabled={busy}
              value={otpCode}
              onChange={(e) => handleOtpInput(e.target.value)}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = PRIMARY_COLOR)
              }
              onBlur={(e) => (e.currentTarget.style.borderColor = "")}
              placeholder="123456"
              className={`h-12 w-full rounded-xl border bg-white/[0.04] px-4 text-center text-lg font-semibold tracking-widest text-white placeholder-white/25 outline-none transition-colors ${
                otpError ? "border-red-500/70" : "border-white/10"
              }`}
            />

            {otpError && (
              <p className={errCls}>
                <T>Invalid code. Please enter</T>{" "}
                <span className="text-white font-medium">123456</span>.
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setStep("email");
                  setOtpCode("");
                  setOtpError(false);
                }}
                className="text-white/50 underline-offset-2 transition-colors hover:text-white hover:underline disabled:opacity-50"
              >
                <T>Use a different email</T>
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch(
                    forgotPassword({ email: email.trim().toLowerCase() })
                  )
                    .unwrap()
                    .catch((e) => console.error("❌ [RESET] Resend failed", e));
                  setCooldown(RESEND_SECONDS);
                  setOtpCode("");
                  setOtpError(false);
                }}
                disabled={cooldown > 0 || busy}
                style={cooldown > 0 ? undefined : { color: PRIMARY_COLOR }}
                className="font-medium transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:text-white/35"
              >
                {cooldown > 0
                  ? `${t("Resend code in")} ${cooldown}s`
                  : t("Resend code")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: NEW PASSWORD ENTRY */}
      {step === "reset" && (
        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              <T>Set new password</T>
            </h2>
            <p className="mt-2 text-sm text-white/50">
              <T>Create a new password for your account.</T>
            </p>
          </div>

          <form
            onSubmit={onResetPassword}
            noValidate
            className="flex flex-col gap-5"
          >
            {/* New Password */}
            <div>
              <label htmlFor="password" className={labelCls}>
                <T>New password</T>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  disabled={busy}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setPwTouched((t) => ({ ...t, password: true }))}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = PRIMARY_COLOR)
                  }
                  onBlurCapture={(e) =>
                    (e.currentTarget.style.borderColor = "")
                  }
                  aria-invalid={pwTouched.password && !pwOk(password)}
                  placeholder={t("At least 8 characters")}
                  className={`${inputBase} pr-12 ${inputBorder(
                    pwTouched.password && !pwOk(password)
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

              {password && (
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className={labelCls}>
                <T>Confirm new password</T>
              </label>
              <input
                id="confirmPassword"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                disabled={busy}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setPwTouched((t) => ({ ...t, confirm: true }))}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = PRIMARY_COLOR)
                }
                onBlurCapture={(e) => (e.currentTarget.style.borderColor = "")}
                aria-invalid={pwTouched.confirm && !matchOk}
                placeholder={t("Repeat your new password")}
                className={`${inputBase} ${inputBorder(
                  pwTouched.confirm && !matchOk
                )}`}
              />
              {pwTouched.confirm && !matchOk && (
                <p className={errCls}>
                  <T>Passwords do not match.</T>
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!resetValid || busy}
                style={
                  resetValid && !busy
                    ? { backgroundColor: PRIMARY_COLOR }
                    : undefined
                }
                className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white transition-opacity ${
                  resetValid && !busy
                    ? "hover:opacity-90 shadow-lg"
                    : "cursor-not-allowed bg-white/10 text-white/40"
                }`}
              >
                <T>Reset password</T>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 4: SUCCESS VIEW */}
      {step === "success" && (
        <div className="flex flex-col items-center px-2 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <CheckIcon className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight">
            <T>Password updated!</T>
          </h2>
          <p className="mt-2 max-w-xs text-sm text-white/60">
            <T>
              Your password has been reset successfully. Redirecting you to
              login…
            </T>
          </p>
          <Link
            href={REDIRECT_AFTER_RESET}
            onClick={handleResetState}
            style={{ backgroundColor: PRIMARY_COLOR }}
            className="mt-6 inline-flex rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-lg"
          >
            <T>Sign in now</T>
          </Link>
        </div>
      )}
    </>
  );
}
