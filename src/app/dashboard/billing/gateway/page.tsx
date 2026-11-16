"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, KeyRound, PlugZap, ShieldCheck, Trash2 } from "lucide-react";
import {
  fetchGateway, removeGatewayKeys, saveGatewayKeys, setGatewayMode, testGateway,
  type GatewayKeyView, type GatewayMode,
} from "@/api/slices";
import { API_CONFIG } from "@/api/config";
import { useBilling } from "@/hooks/useBilling";
import { ConfirmModal, type ConfirmState } from "@/components/ui/items";
import { validatePaystackKey, webhookUrl } from "@/lib/billing/helpers";
import {
  Alert, BillingPage, FormField, GhostButton, Pill, PrimaryButton, SectionCard, TextInput, useBillingUI, fmtDateTime,
} from "@/components/dashboard/billing/BillingUI";

function CopyBox({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const { ui } = useBillingUI();
  const { showToast } = useBilling();
  return (
    <FormField label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-2xl px-4 py-2.5 text-xs" style={{ backgroundColor: ui.inner }}>{value}</code>
        <GhostButton
          icon={Copy}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              showToast("Copied", "success");
            } catch {
              showToast("Could not copy — select the text and copy it manually", "error");
            }
          }}
        >
          Copy
        </GhostButton>
      </div>
    </FormField>
  );
}

function KeyCard({
  mode, view, active, busy, onSave, onRemove, onTest,
}: {
  mode: GatewayMode;
  view: GatewayKeyView;
  active: boolean;
  busy: boolean;
  onSave: (publicKey: string, secretKey: string) => Promise<boolean>;
  onRemove: () => void;
  onTest: () => void;
}) {
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [touched, setTouched] = useState(false);

  const pubErr = validatePaystackKey("public", mode, publicKey);
  const secErr = validatePaystackKey("secret", mode, secretKey);
  const canSubmit = !pubErr && !secErr && !busy;

  const submit = async () => {
    setTouched(true);
    if (!canSubmit) return;
    const ok = await onSave(publicKey.trim(), secretKey.trim());
    if (ok) {
      // the secret must not linger in the browser once it has been sent
      setSecretKey("");
      setPublicKey("");
      setTouched(false);
    }
  };

  return (
    <SectionCard
      title={mode === "test" ? "Test keys" : "Live keys"}
      subtitle={mode === "test" ? "Safe sandbox — no real money moves." : "Real patient payments. Use only when you're ready to go live."}
      right={
        <div className="flex items-center gap-2">
          {active && <Pill label="in use" color="#2563eb" />}
          <Pill label={view.configured ? "configured" : "not set"} color={view.configured ? "#16a34a" : "#6b7280"} />
        </div>
      }
    >
      {view.configured && (
        <div className="grid gap-2 text-xs sm:grid-cols-3">
          <div><span className="opacity-55">Public key</span><p className="truncate font-mono">{view.publicKey}</p></div>
          <div><span className="opacity-55">Secret key</span><p className="font-mono">{view.secretKeyHint}</p></div>
          <div><span className="opacity-55">Last updated</span><p>{fmtDateTime(view.updatedAt)}</p></div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={`Public key (pk_${mode}_…)`}>
          <TextInput value={publicKey} onChange={(e) => setPublicKey(e.target.value)} placeholder={`pk_${mode}_xxxxxxxx`} autoComplete="off" spellCheck={false} />
          {touched && pubErr && <p className="mt-1 text-[11px] text-red-500">{pubErr}</p>}
        </FormField>
        <FormField label={`Secret key (sk_${mode}_…)`} hint="Encrypted on our server. It is never shown again — only its last 4 characters.">
          <TextInput type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} placeholder={`sk_${mode}_xxxxxxxx`} autoComplete="new-password" spellCheck={false} />
          {touched && secErr && <p className="mt-1 text-[11px] text-red-500">{secErr}</p>}
        </FormField>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <PrimaryButton icon={KeyRound} onClick={submit} disabled={busy}>{view.configured ? "Replace keys" : "Save keys"}</PrimaryButton>
        {view.configured && <GhostButton icon={PlugZap} onClick={onTest} disabled={busy}>Test connection</GhostButton>}
        {view.configured && !active && <GhostButton icon={Trash2} danger onClick={onRemove} disabled={busy}>Remove</GhostButton>}
      </div>
      <p className="text-[11px] opacity-50">We check the key with Paystack before saving it, so a typo is caught here and not at the first patient payment.</p>
    </SectionCard>
  );
}

export default function GatewayPage() {
  const { facilityId, billing, act, dispatch } = useBilling();
  const { gateway, saving, listLoading } = billing;
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [busy, setBusy] = useState(false);
  const { ui } = useBillingUI();

  const load = () => facilityId && dispatch(fetchGateway({ facilityId }));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  const webhook = useMemo(() => webhookUrl(API_CONFIG.BASE_URL, facilityId), [facilityId]);
  const callback = typeof window !== "undefined" ? `${window.location.origin}/dashboard/billing/payments/verify` : "/dashboard/billing/payments/verify";

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (mode: GatewayMode) => {
    const apply = () => run(async () => void (await act(setGatewayMode({ facilityId, mode }), `Now using ${mode} mode`)));
    if (mode === "live") {
      setConfirm({
        title: "Switch to LIVE payments?",
        message: "Patients will be charged real money and it will land in your Paystack account. Make sure you have tested a payment in test mode first.",
        confirmLabel: "Switch to live",
        tone: "primary",
        onConfirm: async () => {
          await apply();
          setConfirm(null);
        },
      });
    } else {
      apply();
    }
  };

  return (
    <BillingPage
      narrow
      title="Paystack gateway"
      icon={KeyRound}
      description="Your own Paystack account — payments go straight to you"
      loading={listLoading && !gateway}
      loadingText="Loading gateway..."
      onRefresh={load}
    >
      <Alert tone="info">
        Each facility uses <b>its own</b> Paystack keys. Find them in your Paystack dashboard under <b>Settings → API Keys &amp; Webhooks</b>.
        Keys are encrypted at rest and are never sent back to the browser.
      </Alert>

      {gateway && (
        <>
          <SectionCard title="Active mode" subtitle="Which keys are used when a patient pays online.">
            <div className="flex flex-wrap items-center gap-2">
              {(["test", "live"] as GatewayMode[]).map((m) => {
                const on = gateway.activeMode === m;
                const ready = gateway[m].configured;
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={on || !ready || saving || busy}
                    onClick={() => switchMode(m)}
                    className="rounded-2xl px-4 py-2 text-xs font-semibold transition-all disabled:opacity-50"
                    style={{ backgroundColor: on ? (m === "live" ? "#16a34a" : "#2563eb") : ui.inner, color: on ? "#fff" : ui.text }}
                    title={!ready ? `Add ${m} keys first` : undefined}
                  >
                    {on && <CheckCircle2 size={12} className="mr-1 inline" />}
                    {m === "live" ? "Live" : "Test"}
                  </button>
                );
              })}
            </div>
            {gateway.activeMode === "live" ? (
              <Alert tone="success">Live mode is on — online payments are real.</Alert>
            ) : (
              <Alert tone="warning">Test mode is on — online payments are practice only and no real money is collected.</Alert>
            )}
          </SectionCard>

          <div className="grid gap-5 lg:grid-cols-2">
            {(["test", "live"] as GatewayMode[]).map((m) => (
              <KeyCard
                key={m}
                mode={m}
                view={gateway[m]}
                active={gateway.activeMode === m}
                busy={saving || busy}
                onSave={async (publicKey, secretKey) => !!(await act(saveGatewayKeys({ facilityId, mode: m, publicKey, secretKey }), `${m === "live" ? "Live" : "Test"} keys saved`))}
                onTest={() => run(async () => void (await act(testGateway({ facilityId, mode: m }), "Connected to Paystack ✓")))}
                onRemove={() =>
                  setConfirm({
                    title: `Remove ${m} keys?`,
                    message: `Online payments in ${m} mode will stop working until you add keys again.`,
                    confirmLabel: "Remove keys",
                    tone: "danger",
                    onConfirm: async () => {
                      await run(async () => void (await act(removeGatewayKeys({ facilityId, mode: m }), "Keys removed")));
                      setConfirm(null);
                    },
                  })
                }
              />
            ))}
          </div>

          <SectionCard
            title="Set up your Paystack dashboard"
            subtitle="Two addresses to paste into Paystack so payments are confirmed automatically."
            right={<ShieldCheck size={18} className="opacity-50" />}
          >
            <CopyBox
              label="Webhook URL"
              value={webhook}
              hint="Paystack → Settings → API Keys & Webhooks → Webhook URL. Set it for both Test and Live. This is what confirms a payment even if the payer closes their browser."
            />
            <CopyBox
              label="Callback URL"
              value={callback}
              hint="Where Paystack sends the person after they pay. Set the same address in the server's BILLING_CALLBACK_URL. Only signed-in staff can open it; the webhook above is what actually records the payment."
            />
          </SectionCard>
        </>
      )}

      <ConfirmModal state={confirm} busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => confirm?.onConfirm()} ui={ui} />
    </BillingPage>
  );
}
