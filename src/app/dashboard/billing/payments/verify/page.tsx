"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, Loader2, Wallet, XCircle } from "lucide-react";
import { verifyPayment, type VerifyResult } from "@/api/slices";
import { useBilling } from "@/hooks/useBilling";
import { Alert, BillingPage, GhostButton, PrimaryButton, SectionCard, useBillingUI } from "@/components/dashboard/billing/BillingUI";

/** Same shape the server accepts for a payment reference. */
const REFERENCE_RE = /^[A-Za-z0-9._=-]{8,100}$/;
const MAX_POLLS = 6;
const POLL_MS = 4000;

function VerifyInner() {
  const params = useSearchParams();
  // Paystack appends both ?reference= and ?trxref= to the callback URL
  const reference = (params.get("reference") || params.get("trxref") || "").trim();
  const { facilityId, act, money } = useBilling();
  const { ui } = useBillingUI();

  const [result, setResult] = useState<VerifyResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [polls, setPolls] = useState(0);
  const [failed, setFailed] = useState(false);
  const started = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const check = useCallback(async () => {
    setChecking(true);
    const r = await act<VerifyResult>(verifyPayment({ facilityId, reference }));
    setChecking(false);
    if (!r) return setFailed(true);
    setFailed(false);
    setResult(r);
    return r;
  }, [act, facilityId, reference]);

  useEffect(() => {
    if (!facilityId || !reference || !REFERENCE_RE.test(reference) || started.current) return;
    started.current = true; // React StrictMode runs effects twice in development
    let cancelled = false;

    (async () => {
      for (let i = 0; i < MAX_POLLS && !cancelled; i++) {
        setPolls(i + 1);
        const r = await check();
        if (!r || r.status !== "pending") return; // success/failed = final; an error stops polling too
        await new Promise<void>((res) => {
          timer.current = setTimeout(res, POLL_MS);
        });
      }
    })();

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [facilityId, reference, check]);

  const recheck = async () => {
    started.current = true;
    setPolls(0);
    await check();
  };

  const invoiceHref = result?.invoice ? `/dashboard/billing/invoices/${result.invoice.id}` : "/dashboard/billing/invoices";
  const invalid = !reference || !REFERENCE_RE.test(reference);

  return (
    <BillingPage narrow hideTabs title="Payment status" icon={Wallet} description="Confirming your payment with Paystack">
      <SectionCard>
        {invalid ? (
          <div className="space-y-3 py-6 text-center">
            <XCircle size={40} className="mx-auto text-red-500" />
            <p className="text-lg font-semibold">No payment to check</p>
            <p className="text-xs opacity-60">This page needs a payment reference. Open it from the link Paystack sends you back to, or find the invoice below.</p>
            <GhostButton href="/dashboard/billing/invoices">Go to invoices</GhostButton>
          </div>
        ) : result?.status === "success" ? (
          <div className="space-y-3 py-6 text-center">
            <CheckCircle2 size={44} className="mx-auto text-green-600" />
            <p className="text-xl font-semibold">Payment received</p>
            {result.invoice && (
              <p className="text-sm opacity-70">
                {result.invoice.invoiceNumber} · paid {money(result.invoice.amountPaid)} of {money(result.invoice.total)}
                {result.invoice.balance > 0 ? ` · ${money(result.invoice.balance)} still due` : " · fully paid"}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <PrimaryButton href={invoiceHref}>View invoice</PrimaryButton>
            </div>
          </div>
        ) : result?.status === "failed" ? (
          <div className="space-y-3 py-6 text-center">
            <XCircle size={44} className="mx-auto text-red-500" />
            <p className="text-xl font-semibold">Payment didn&apos;t go through</p>
            <p className="text-xs opacity-60">No money was recorded against this invoice. You can try again from the invoice.</p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <PrimaryButton href={invoiceHref}>Back to invoice</PrimaryButton>
            </div>
          </div>
        ) : failed && !result ? (
          <div className="space-y-3 py-6 text-center">
            <XCircle size={40} className="mx-auto text-amber-500" />
            <p className="text-lg font-semibold">We couldn&apos;t confirm this payment yet</p>
            <p className="mx-auto max-w-sm text-xs opacity-60">
              That may be a temporary problem. If the patient was charged, Paystack also notifies us directly, so the invoice will update on its own.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <PrimaryButton onClick={recheck} disabled={checking}>Check again</PrimaryButton>
              <GhostButton href="/dashboard/billing/invoices">Invoices</GhostButton>
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-6 text-center">
            {checking || polls <= MAX_POLLS ? <Loader2 size={40} className="mx-auto animate-spin opacity-60" /> : <Clock size={40} className="mx-auto opacity-60" />}
            <p className="text-lg font-semibold">{result ? "Still processing…" : "Checking your payment…"}</p>
            <p className="text-xs opacity-60">Please don&apos;t close this page.</p>
            {result && polls >= MAX_POLLS && !checking && (
              <>
                <Alert tone="info">Paystack hasn&apos;t confirmed it yet. Bank transfers can take a few minutes. The invoice updates automatically once Paystack confirms.</Alert>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  <PrimaryButton onClick={recheck} disabled={checking}>Check again</PrimaryButton>
                  <GhostButton href={invoiceHref}>View invoice</GhostButton>
                </div>
              </>
            )}
          </div>
        )}
        {reference && !invalid && (
          <p className="pt-2 text-center font-mono text-[10px] opacity-40" style={{ color: ui.text }}>Reference: {reference}</p>
        )}
      </SectionCard>
    </BillingPage>
  );
}

export default function PaymentVerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
