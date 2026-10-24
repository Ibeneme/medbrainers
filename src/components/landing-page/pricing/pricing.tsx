"use client";

import { PRIMARY_COLOR } from "@/constants/colors";
import React, { useState } from "react";
import Link from "@/i18n/link";
import Image from "next/image";
import { T, useT, useLocale } from "@/i18n/provider";
import { productName } from "@/constants/site";

/* Where "Custom" plan enquiries are sent. Change to your real admin inbox. */
const ADMIN_EMAIL = `admin@${productName}.com`;

/** Builds the "Custom plan" mailto link in the visitor's language. */
const buildCustomMailto = (t: (text: string) => string) =>
  `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(
    t("Custom Plan Enquiry")
  )}&body=${encodeURIComponent(
    [
      t("Hello " + productName + " team,"),
      "",
      t("I would like a quote for a custom plan."),
      "",
      t("Facility name:"),
      t("Facility type (clinic / hospital / network):"),
      t("Number of branches:"),
      t("Approximate number of staff:"),
      t("Phone number:"),
      "",
      t("Anything else we should know:"),
      "",
    ].join("\n")
  )}`;

/* Annual billing discount (10% off 12 months of monthly price) */
const YEARLY_DISCOUNT_PERCENT = 10;
/* Set to false if extra seats should NOT get the annual discount */
const DISCOUNT_SEATS_ON_ANNUAL = true;
/* Most extra seats a user can add */
const MAX_EXTRA_SEATS = 30;

/* ---------- Paystack inline checkout ---------- */
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PaystackPop?: any;
  }
}

const loadPaystack = () =>
  new Promise<void>((resolve, reject) => {
    if (window.PaystackPop) return resolve();
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Paystack"));
    document.body.appendChild(s);
  });

interface SeatAddOn {
  includedSeats: number | string; // number or "Unlimited"
  single: number; // NGN per extra seat per month
  bundleQty: number; // seats in a pack
  bundlePrice: number; // NGN per pack per month
}

interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly?: number; // NGN per month (omitted for custom)
  custom?: boolean;
  popular?: boolean;
  badge?: string;
  seatAddOn?: SeatAddOn;
  features: string[];
  cta: string;
}

const plans: Plan[] = [
  {
    id: "core",
    name: `${productName} Core`,
    description:
      "Full access to every core hospital module. Everything a clinic or hospital needs to run paperless, from front desk to billing.",
    priceMonthly: 70_000,
    seatAddOn: {
      includedSeats: 10,
      single: 10_000,
      bundleQty: 3,
      bundlePrice: 20_000,
    },
    features: [
      "Complete Patient EMR & Medical History",
      "Front Desk & Appointment Scheduling",
      "Consultation & Doctor Notes Portal",
      "Inpatient Ward & Bed Management",
      "Integrated Laboratory & Diagnostic Workflows",
      "Pharmacy Stock, Prescriptions & Audits",
      "Automated HMO Claims & Billing Pipeline",
      "Patient Billing & Cashier Receipts",
      "WhatsApp Patient Appointment Notifications",
      "Role-Based Permissions & Audit Logs",
      "Daily Operations & Financial Summaries",
      "Up to 10 Care Team Seats",
      "Priority Email, Chat & Phone Support",
    ],
    cta: "Start 7-Day Free Trial",
  },
  {
    id: "intelligence",
    name: `${productName} Intelligence`,
    description:
      "Everything in Core with generous base seats, plus AI analysis, predictive insights, and enterprise-grade control for large hospitals.",
    priceMonthly: 150_000,
    popular: true,
    badge: "Includes AI Analysis",
    seatAddOn: {
      includedSeats: 25,
      single: 10_000,
      bundleQty: 3,
      bundlePrice: 20_000,
    },
    features: [
      `Everything in ${productName} Core`,
      "25 Care Team Seats Included",
      "AI Clinical Analysis & Diagnostic Insights",
      "AI-Assisted Triage & Patient Risk Flagging",
      "Predictive Drug Stock & Demand Forecasting",
      "AI HMO Claim Validation & Denial Prediction",
      "Custom BI Dashboards & Report Builder",
      "Multi-Branch & Multi-Facility Management",
      "Custom Medical Equipment & LIS/PACS Integrations",
      "Open API Access & Webhooks",
      "Legacy Paper Record Digitization Service",
      "Advanced Encryption & HIPAA / NDPR Compliance",
      "Dedicated Healthcare Account Manager",
      "On-Site Staff Training & 24/7 SLA",
    ],
    cta: "Start 7-Day Free Trial",
  },
  {
    id: "custom",
    name: "Custom",
    description:
      "For hospital networks and public health systems with special requirements. Tell us what you need and we will build a plan around it.",
    custom: true,
    features: [
      `Everything in ${productName} Intelligence`,
      "Tailored Modules & Workflows",
      "Dedicated On-Premise or Private Cloud Deployment",
      "Custom Integrations With Your Existing Systems",
      "Bulk Pricing for Multi-Facility Networks",
      "Custom Data Migration & Onboarding Plan",
      "Custom SLA & Dedicated Support Team",
    ],
    cta: "Email Admin",
  },
];

/* ---------- Pricing helpers ---------- */

/** Standalone Naira sign component with fully adjustable size classes */
const NairaSign = ({
  className = "text-base font-normal",
}: {
  className?: string;
}) => <span className={`inline-block ${className}`}>₦</span>;

/** Formats number to include .00 decimals and independent styling for symbol and decimals, supporting English & French conventions */
const formatNairaJSX = (
  n: number,
  locale: string,
  nairaClassName = "text-base font-normal",
  decimalClassName = "text-xs font-normal"
) => {
  const rounded = Math.round(n);
  const formattedNumber = rounded
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, locale === "fr" ? "\u202f" : ",");

  return locale === "fr" ? (
    <>
      {formattedNumber}
      <span className={decimalClassName}>.00</span>
      &nbsp;
      <NairaSign className={nairaClassName} />
    </>
  ) : (
    <>
      <NairaSign className={nairaClassName} />
      {formattedNumber}
      <span className={decimalClassName}>.00</span>
    </>
  );
};

const fullYear = (monthly: number) => monthly * 12;
const yearlyPrice = (monthly: number) =>
  Math.round((fullYear(monthly) * (100 - YEARLY_DISCOUNT_PERCENT)) / 100);

/* Monthly cost of n extra seats: packs first, then single seats */
const seatCostMonthly = (n: number, a: SeatAddOn) =>
  Math.floor(n / a.bundleQty) * a.bundlePrice + (n % a.bundleQty) * a.single;

/* Cost of extra seats for chosen billing period */
const seatCostForPeriod = (monthlyCost: number, yearly: boolean) =>
  !yearly
    ? monthlyCost
    : DISCOUNT_SEATS_ON_ANNUAL
    ? yearlyPrice(monthlyCost)
    : fullYear(monthlyCost);

export default function PricingPage() {
  const t = useT();
  const locale = useLocale();

  const naira = (
    n: number,
    nairaClass = "text-xl font-medium",
    decimalClass = "text-xs font-normal"
  ) => formatNairaJSX(n, locale, nairaClass, decimalClass);

  const pct = `${YEARLY_DISCOUNT_PERCENT}${locale === "fr" ? "\u00a0" : ""}%`;
  const CUSTOM_MAILTO = buildCustomMailto(t);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "annual"
  );

  const [coreExtraSeats, setCoreExtraSeats] = useState(0);
  const [intelligenceExtraSeats, setIntelligenceExtraSeats] = useState(0);

  const isYearly = billingCycle === "annual";

  const handleCoreSeats = (value: number) => {
    if (Number.isNaN(value)) return;
    setCoreExtraSeats(
      Math.min(MAX_EXTRA_SEATS, Math.max(0, Math.floor(value)))
    );
  };

  const handleIntelligenceSeats = (value: number) => {
    if (Number.isNaN(value)) return;
    setIntelligenceExtraSeats(
      Math.min(MAX_EXTRA_SEATS, Math.max(0, Math.floor(value)))
    );
  };

  return (
    <div
      className="w-full bg-black text-white selection:text-white"
      style={{ backgroundColor: PRIMARY_COLOR }}
    >
      {/* ---------- Hero Section ---------- */}
      <section className="relative w-full min-h-[50vh] bg-black text-white flex flex-col items-center justify-center pt-32 pb-16 px-6 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
          <Image
            src="/mosaic/04.svg"
            alt={t(`${productName} Healthcare Pricing`)}
            fill
            priority
            className="object-cover object-center"
          />
        </div>
        <div
          className="absolute inset-0 z-1 pointer-events-none opacity-[0.15]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          <span className="text-xs uppercase tracking-widest text-white/80 mb-4 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 ">
            <T>{productName} ® Pricing Plans</T>
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight text-white mb-6 leading-[1.1]">
            <T>built for modern healthcare</T>
          </h1>
          <p className="text-base sm:text-lg text-white/60 font-light max-w-2xl mx-auto leading-relaxed">
            <T>
              Unify records, speed up consultations, eliminate drug stockouts,
              and automate HMO claims with zero hidden operational fees.
            </T>
          </p>
        </div>
      </section>

      {/* ---------- Pricing Section ---------- */}
      <section className="w-full bg-black text-white py-16 sm:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 relative z-10">
          <div className="flex flex-col items-center justify-center gap-5 mb-10 sm:mb-12">
            <span
              style={{
                borderColor: `${PRIMARY_COLOR}80`,
                backgroundColor: `${PRIMARY_COLOR}1a`,
              }}
              className="text-xs sm:text-sm font-medium px-4 py-1.5 rounded-full border text-white"
            >
              <T>7-day free trial with full access</T>
            </span>
            <div className="inline-flex items-center p-1 rounded-full bg-neutral-900 border border-white/15 backdrop-blur-md max-w-full">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 sm:px-6 py-2.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-wide transition-all duration-300 ${
                  billingCycle === "monthly"
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <T>Monthly Billing</T>
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`px-4 sm:px-6 py-2.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-wide transition-all duration-300 flex items-center gap-1.5 ${
                  billingCycle === "annual"
                    ? "bg-white text-black "
                    : "text-white/60 hover:text-white"
                }`}
              >
                <span>
                  <T>Annual Billing</T>
                </span>
                <span
                  style={
                    billingCycle === "annual"
                      ? { backgroundColor: PRIMARY_COLOR, color: "#ffffff" }
                      : {
                          backgroundColor: `${PRIMARY_COLOR}33`,
                          color: "#ffffff",
                        }
                  }
                  className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap"
                >
                  <T>Save</T> {pct}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {plans.map((plan) => {
              const monthly = plan.priceMonthly ?? 0;
              const price = isYearly ? yearlyPrice(monthly) : monthly;

              const addOn = plan.seatAddOn;
              const isCore = plan.id === "core";
              const currentExtraSeats = isCore
                ? coreExtraSeats
                : intelligenceExtraSeats;
              const setSeatsFn = isCore
                ? handleCoreSeats
                : handleIntelligenceSeats;

              const extraMonthly = addOn
                ? seatCostMonthly(currentExtraSeats, addOn)
                : 0;
              const extraForPeriod = seatCostForPeriod(extraMonthly, isYearly);
              const payTotal = price + extraForPeriod;

              const ctaClass = `w-full text-center py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 mb-8 mt-6 inline-flex items-center justify-center ${
                plan.popular
                  ? "text-white hover:opacity-90"
                  : plan.custom
                  ? "bg-white text-black hover:opacity-90"
                  : "bg-white/10 text-white hover:bg-white/15 border border-white/10"
              }`;

              return (
                <div
                  key={plan.id}
                  style={
                    plan.popular ? { borderColor: PRIMARY_COLOR } : undefined
                  }
                  className={`relative rounded-3xl border p-6 sm:p-8 flex flex-col transition-all duration-300 ${
                    plan.popular
                      ? "bg-neutral-950"
                      : "border-white/10 bg-neutral-950/60 hover:border-white/20"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span
                        style={{
                          backgroundColor: PRIMARY_COLOR,
                          color: "#ffffff",
                        }}
                        className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap"
                      >
                        <T>{plan.badge}</T>
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-2">
                      <T>{plan.name}</T>
                    </h3>
                    <p className="text-sm text-white/55 leading-relaxed">
                      <T>{plan.description}</T>
                    </p>
                  </div>

                  <div className="mb-2">
                    {plan.custom ? (
                      <>
                        <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                          <T>Custom</T>
                        </span>
                        <div className="mt-2 min-h-[2.75rem]">
                          <p className="text-xs text-white/40">
                            <T>
                              Priced around your facility. Message our team for
                              a quote.
                            </T>
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-end gap-1 flex-wrap">
                          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-baseline">
                            {naira(
                              payTotal,
                              "text-xl sm:text-2xl font-semibold mx-0.5",
                              "text-sm sm:text-base font-bold text-white/70"
                            )}
                          </span>
                          <span className="text-white/50 text-sm mb-1">
                            {isYearly ? <T>/ year</T> : <T>/ month</T>}
                          </span>
                        </div>
                        <div className="mt-2 min-h-[2.75rem]">
                          {isYearly ? (
                            <>
                              <p className="text-xs text-white/40">
                                <span className="line-through">
                                  {naira(
                                    fullYear(monthly + extraMonthly),
                                    "text-xs font-normal",
                                    "text-[10px] font-normal"
                                  )}
                                </span>{" "}
                                ·{" "}
                                {naira(
                                  payTotal / 12,
                                  "text-xs font-normal",
                                  "text-[10px] font-normal"
                                )}{" "}
                                <T>per month, billed annually</T>
                              </p>
                              <span
                                style={{
                                  backgroundColor: `${PRIMARY_COLOR}33`,
                                  color: "#ffffff",
                                }}
                                className="mt-2 inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full"
                              >
                                <T>You save</T>{" "}
                                {naira(
                                  fullYear(monthly + extraMonthly) - payTotal,
                                  "text-xs font-semibold",
                                  "text-[10px] font-semibold"
                                )}{" "}
                                ({pct})
                              </span>
                            </>
                          ) : (
                            <p className="text-xs text-white/40">
                              <T>Billed monthly. Cancel anytime.</T>
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {plan.custom ? (
                    <a
                      href={CUSTOM_MAILTO}
                      style={{ backgroundColor: "#ffffff", color: "#000000" }}
                      className={ctaClass}
                    >
                      <T>{plan.cta}</T>
                    </a>
                  ) : (
                    <Link
                      href="/get-started"
                      style={
                        plan.popular
                          ? { backgroundColor: PRIMARY_COLOR, color: "#ffffff" }
                          : undefined
                      }
                      className={ctaClass}
                    >
                      <T>{plan.cta}</T>
                    </Link>
                  )}

                  <ul className="space-y-3.5 mt-auto">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm"
                      >
                        <svg
                          style={{ color: PRIMARY_COLOR }}
                          className="w-4 h-4 mt-0.5 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-white/70">
                          <T>{feature}</T>
                        </span>
                      </li>
                    ))}
                  </ul>

                  {addOn && (
                    <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4">
                      <p className="text-sm font-semibold">
                        <T>Need more seats?</T>
                      </p>
                      <p className="mt-1 text-xs text-white/50">
                        {addOn.includedSeats} <T>seats included.</T>{" "}
                        {naira(
                          addOn.single,
                          "text-xs font-normal",
                          "text-[10px] font-normal"
                        )}{" "}
                        <T>per extra seat, or</T> {addOn.bundleQty}{" "}
                        <T>seats for</T>{" "}
                        {naira(
                          addOn.bundlePrice,
                          "text-xs font-normal",
                          "text-[10px] font-normal"
                        )}{" "}
                        <T>/ month</T>.
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-xs text-white/60">
                          <T>Extra seats</T>
                        </span>
                        <div className="flex items-center overflow-hidden rounded-xl border border-white/15 bg-neutral-900">
                          <button
                            type="button"
                            onClick={() => setSeatsFn(currentExtraSeats - 1)}
                            disabled={currentExtraSeats <= 0}
                            aria-label={t("Remove a seat")}
                            className="flex h-10 w-10 touch-manipulation items-center justify-center text-base font-medium text-white/75 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={currentExtraSeats}
                            onChange={(e) => setSeatsFn(Number(e.target.value))}
                            min={0}
                            max={MAX_EXTRA_SEATS}
                            aria-label={t("Extra seats")}
                            className="h-10 w-14 appearance-none bg-transparent text-center text-sm font-medium text-white outline-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => setSeatsFn(currentExtraSeats + 1)}
                            disabled={currentExtraSeats >= MAX_EXTRA_SEATS}
                            aria-label={t("Add a seat")}
                            className="flex h-10 w-10 touch-manipulation items-center justify-center text-base font-medium text-white/75 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <dl className="mt-4 space-y-1.5 border-t border-white/10 pt-3 text-xs">
                        <div className="flex justify-between gap-3 text-white/60">
                          <dt>
                            <T>Plan</T>
                          </dt>
                          <dd>
                            {naira(
                              price,
                              "text-xs font-normal",
                              "text-[10px] font-normal"
                            )}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3 text-white/60">
                          <dt>
                            {currentExtraSeats} <T>extra seats</T>
                          </dt>
                          <dd>
                            {naira(
                              extraForPeriod,
                              "text-xs font-normal",
                              "text-[10px] font-normal"
                            )}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3 text-sm font-semibold text-white">
                          <dt>
                            <T>Total</T>{" "}
                            {isYearly ? <T>/ year</T> : <T>/ month</T>}
                          </dt>
                          <dd>
                            {naira(
                              payTotal,
                              "text-sm font-semibold",
                              "text-xs font-semibold"
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-12 sm:mt-16 mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center">
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              <T>
                Core and Intelligence start with a 7-day free trial and full
                access. If payment is not made by the end of the trial, your
                account will be deleted.
              </T>
            </p>
          </div>

          <div className="mt-6 text-center px-2">
            <p className="text-xs sm:text-sm text-white/40 leading-relaxed">
              <T>
                All prices are in Nigerian Naira (₦). No upfront setup fees.
              </T>{" "}
              <T>Need help migrating paper patient files or HMO contracts?</T>{" "}
              <a
                href={CUSTOM_MAILTO}
                style={{ color: PRIMARY_COLOR }}
                className="hover:underline whitespace-nowrap font-medium"
              >
                <T>Message our team</T>
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
