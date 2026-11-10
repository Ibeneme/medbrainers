"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Video,
  Calendar,
  User,
  Building2,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Clock,
} from "lucide-react";
import api from "@/api/services";
import type { IceServer } from "@/api/slices/telemedicineSlice";
import { TelehealthRoom } from "@/components/telemedicine/TelehealthRoom";
import { SITE } from "@/constants/site";
import { ToggleSwitch } from "@/components/ui/items";

interface Lobby {
  roomCode: string;
  title: string;
  status: string;
  facility?: string;
  host?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  opensAt?: string;
  guest?: { name: string; role: string };
  consent?: { required: boolean; text?: string };
  lobbyMessage?: string;
  waitingRoom?: boolean;
  iceServers?: IceServer[];
}

function PoweredBy() {
  return (
    <div className="mt-12 flex flex-col items-center gap-2 pb-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-white/25">
        Powered by
      </p>
      <div className="flex items-center gap-2">
        <img
          src={SITE.logo}
          alt={SITE.name}
          //     width={80}
          height={16}
          className="h-4 w-auto object-contain opacity-70 "
        />
        <span className="text-xs font-semibold tracking-tight text-white/45">
          {SITE.name}
        </span>
      </div>
    </div>
  );
}

function JoinInner() {
  const sp = useSearchParams();
  const token = sp.get("token") || "";
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [joined, setJoined] = useState(false);
  const [missed, setMissed] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("This page needs the join link from your email.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/telehealth/guest/session", {
          params: { token },
        });
        if (!cancelled) setLobby(data?.data || data);
      } catch (e: any) {
        if (!cancelled)
          setError(
            e?.response?.data?.message ||
              "This join link is invalid or has expired."
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const when = lobby?.scheduledStart
    ? new Date(lobby.scheduledStart).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  const needsConsent = !!lobby?.consent?.required;

  /* ── Missed visit ── */
  if (missed) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#0f1115] px-4 text-white">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <Clock size={28} className="opacity-60" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Missed visit
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            This session has already passed or was cancelled. Please contact
            your clinic for details.
          </p>
          <button
            onClick={() => setMissed(false)}
            className="mt-8 rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Back
          </button>
        </div>
        <PoweredBy />
      </main>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#0f1115] px-4 text-white">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Unable to join
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/55">{error}</p>
        </div>
        <PoweredBy />
      </main>
    );
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#0f1115] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-white/10" />
          <p className="text-sm text-white/50">Checking your link…</p>
        </div>
        <PoweredBy />
      </main>
    );
  }

  if (!lobby) return null;

  /* ── Main ── */
  return (
    <main className="min-h-screen bg-[#0f1115] text-white">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-10 sm:py-14">
        <div className="flex-1">
          {/* Header */}
          <div className="mb-8">
            {SITE.logo && (
              <img
                src={SITE.logo}
                alt={SITE.name}
                className="mb-5 h-6 w-auto"
              />
            )}

            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8">
                <Video size={16} className="opacity-70" />
              </span>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/40">
                {lobby.facility || "Video visit"}
              </p>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {lobby.title || "Join your visit"}
            </h1>

            {lobby.guest?.name && (
              <p className="mt-2 text-sm text-white/50">
                Welcome, {lobby.guest.name}
              </p>
            )}
          </div>

          {/* Lobby card */}
          {!joined && (
            <div className="space-y-6 rounded-[28px] bg-white/[0.04] p-6 sm:p-7">
              <div className="flex flex-wrap gap-2">
                {when && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3.5 py-1.5 text-xs text-white/70">
                    <Calendar size={12} />
                    {when}
                  </span>
                )}
                {lobby.host && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3.5 py-1.5 text-xs text-white/70">
                    <User size={12} />
                    {lobby.host}
                  </span>
                )}
                {lobby.facility && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3.5 py-1.5 text-xs text-white/70">
                    <Building2 size={12} />
                    {lobby.facility}
                  </span>
                )}
              </div>

              <p className="text-sm leading-relaxed text-white/65">
                {lobby.lobbyMessage ||
                  "You will wait in the lobby until the clinician admits you."}
              </p>

              <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <div>
                  <p className="text-xs font-medium text-white/80">
                    Room {lobby.roomCode}
                  </p>
                  <p className="text-[11px] capitalize text-white/40">
                    {lobby.status?.replace(/_/g, " ") || "Ready"}
                  </p>
                </div>
              </div>

              {needsConsent && (
                <ToggleSwitch
                  checked={agreed}
                  onChange={setAgreed}
                  label="Consent required"
                  description={lobby.consent?.text}
                />
              )}

              <button
                type="button"
                disabled={needsConsent && !agreed}
                onClick={() => setJoined(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto"
              >
                Join visit
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {joined && (
            <div className="overflow-hidden rounded-[28px] bg-white/[0.03]">
              <TelehealthRoom
                roomCode={lobby.roomCode}
                iceServers={lobby.iceServers || []}
                joinToken={token}
                displayName={lobby.guest?.name}
                consent={!needsConsent || agreed}
                chatEnabled
                screenShareEnabled={false}
              />
            </div>
          )}
        </div>

        <PoweredBy />
      </div>
    </main>
  );
}

export default function GuestJoinPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#0f1115]" />}>
      <JoinInner />
    </Suspense>
  );
}
