"use client";

import { PRIMARY_COLOR } from "@/constants/colors";

/* Place this file at: components/auth/login.tsx */

import React, { useState } from "react";
import Link from "@/i18n/link";
import { useRouter } from "@/i18n/link";
import { T, useT } from "@/i18n/provider";
import { productName } from "@/constants/site";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import { login, clearAuthError } from "@/api/slices";
import DarkBlurOverlayLoader from "../atoms/loaders/DarkBlurOverlayLoader";

const REDIRECT_AFTER_LOGIN = "/dashboard";

/* ---------- Validation ---------- */
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const pwOk = (v: string) => v.length >= 1;

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

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPw, setShowPw] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));
  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const valid = emailOk(form.email) && pwOk(form.password);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setTouched({ email: true, password: true });
    dispatch(clearAuthError());

    if (!valid) {
      console.log("❌ [LOGIN] Client validation failed", { form });
      return;
    }

    const payload = {
      email: form.email.trim().toLowerCase(),
      password: form.password,
    };

    console.log("🚀 [LOGIN] Dispatch login → POST /auth/login", payload);

    try {
      const result = await dispatch(login(payload)).unwrap();
      console.log("✅ [LOGIN] Success", {
        user: result.data?.user,
        hasAccessToken: !!result.data?.accessToken,
        hasRefreshToken: !!result.data?.refreshToken,
      });
      setIsRedirecting(true);
      console.log(
        "➡️ [LOGIN] Auto-routing to Dashboard →",
        REDIRECT_AFTER_LOGIN
      );
      router.push(REDIRECT_AFTER_LOGIN);
    } catch (err) {
      console.error("❌ [LOGIN] Failed", err);
    }
  };

  const showErr = (k: string, bad: boolean) => (touched[k] || attempted) && bad;
  const busy = loading || isRedirecting;

  return (
    <>
      {busy && <DarkBlurOverlayLoader />}

      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          <T>Sign in to your account</T>
        </h2>
        <p className="mt-2 text-sm text-white/50">
          <T>New to {productName}?</T>{" "}
          <Link
            href="/get-started"
            className="text-white underline-offset-2 hover:underline"
          >
            <T>Create an account</T>
          </Link>
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div>
          <label htmlFor="email" className={labelCls}>
            <T>Email address</T>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={form.email}
            disabled={busy}
            onChange={(e) => set("email", e.target.value)}
            onBlur={() => touch("email")}
            onFocus={(e) => (e.currentTarget.style.borderColor = PRIMARY_COLOR)}
            onBlurCapture={(e) => (e.currentTarget.style.borderColor = "")}
            aria-invalid={showErr("email", !emailOk(form.email))}
            placeholder="you@hospital.com"
            className={`${inputBase} ${inputBorder(
              showErr("email", !emailOk(form.email))
            )}`}
          />
          {showErr("email", !emailOk(form.email)) && (
            <p className={errCls}>
              <T>Enter a valid email address.</T>
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-white/70"
            >
              <T>Password</T>
            </label>
            <Link
              href="/forgot-password"
              style={{ color: PRIMARY_COLOR }}
              className="text-xs font-medium transition-opacity hover:opacity-80 hover:underline"
            >
              <T>Forgot password?</T>
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              value={form.password}
              disabled={busy}
              onChange={(e) => set("password", e.target.value)}
              onBlur={() => touch("password")}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = PRIMARY_COLOR)
              }
              onBlurCapture={(e) => (e.currentTarget.style.borderColor = "")}
              aria-invalid={showErr("password", !pwOk(form.password))}
              placeholder={t("Enter your password")}
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
          {showErr("password", !pwOk(form.password)) && (
            <p className={errCls}>
              <T>Password is required.</T>
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={busy}
            aria-disabled={!valid || busy}
            style={
              valid && !busy ? { backgroundColor: PRIMARY_COLOR } : undefined
            }
            className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white transition-opacity ${
              valid && !busy
                ? "hover:opacity-90 shadow-lg"
                : "cursor-not-allowed bg-white/10 text-white/40"
            }`}
          >
            {busy ? <T>Signing in…</T> : <T>Sign in</T>}
          </button>
        </div>
      </form>
    </>
  );
}
