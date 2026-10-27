"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Building2, Check, Loader2, Phone } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchMyFacilities,
  fetchHandoverDetail,
  acknowledgeHandover,
  clearHandoverDetail,
} from "@/api/slices";
import { useTheme } from "@/contexts/theme-context";
import { PRIMARY_COLOR } from "@/constants/colors";
import { ConfirmModal } from "@/components/ui";
import DarkBlurOverlayLoader from "@/components/atoms/loaders/DarkBlurOverlayLoader";
import { useFacilityId } from "@/hooks/useFacilityId";

function personLabel(u: unknown): string {
  if (!u) return "—";
  if (typeof u === "string") return u;
  const x = u as {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    countryCode?: string;
  };
  return `${x.firstName || ""} ${x.lastName || ""}`.trim() || x.email || "—";
}

function personContact(u: unknown): string {
  if (!u || typeof u === "string") return "";
  const x = u as { countryCode?: string; phone?: string; email?: string };
  const phone = [x.countryCode, x.phone].filter(Boolean).join(" ");
  return phone || x.email || "";
}

export default function HandoverDetailPage() {
  const params = useParams();
  const handoverId = String(params.handoverId || "");
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  const { user } = useAppSelector((s) => s.auth);

  // Use the comprehensive useFacilityId hook
  const { facilityId, activeFacility } = useFacilityId();
  const { currentHandover, detailLoading, saving } = useAppSelector(
    (s) => s.tasks
  );

  const [ackOpen, setAckOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastErr, setToastErr] = useState(false);

  const myId = user?._id || (user as { id?: string } | undefined)?.id;

  useEffect(() => {
    dispatch(fetchMyFacilities());
    return () => {
      dispatch(clearHandoverDetail());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!facilityId || !handoverId) return;
    dispatch(fetchHandoverDetail({ facilityId, handoverId }));
  }, [dispatch, facilityId, handoverId]);

  const h = currentHandover;
  const toId =
    h && typeof h.toUser !== "string"
      ? (h.toUser as { _id?: string })?._id
      : typeof h?.toUser === "string"
      ? h.toUser
      : undefined;
  const canAck =
    h && h.status === "submitted" && myId && String(toId) === String(myId);

  const onAck = async () => {
    if (!facilityId || !handoverId) return;
    try {
      await dispatch(acknowledgeHandover({ facilityId, handoverId })).unwrap();
      setAckOpen(false);
      setToast("Handover acknowledged");
      setTimeout(() => setToast(null), 2500);
      dispatch(fetchHandoverDetail({ facilityId, handoverId }));
    } catch (err: unknown) {
      setToastErr(true);
      setToast(typeof err === "string" ? err : "Acknowledge failed");
      setTimeout(() => {
        setToast(null);
        setToastErr(false);
      }, 3000);
      setAckOpen(false);
    }
  };

  if (!facilityId) {
    return (
      <div
        className="max-w-lg mx-auto px-4 py-16 text-center"
        style={{ color: colors.text }}
      >
        <Building2 className="mx-auto opacity-30 mb-3" size={32} />
        <p className="font-bold">Select a facility first</p>
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8 space-y-5"
      style={{ color: colors.text }}
    >
      {/* Dark overlay loader when fetching handover detail */}
      {detailLoading && !h && (
        <DarkBlurOverlayLoader text="Loading handover..." />
      )}

      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-none ${
            toastErr ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          {toast}
        </div>
      )}

      <ConfirmModal
        open={ackOpen}
        title="Acknowledge this handover?"
        description="Confirm you have received and reviewed the outgoing staff notes. This will mark the handover as acknowledged."
        confirmLabel="Yes, acknowledge"
        cancelLabel="Not yet"
        busy={saving}
        isDark={isDark}
        colors={colors}
        onConfirm={onAck}
        onCancel={() => setAckOpen(false)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/tasks/handover"
          className="inline-flex items-center gap-1.5 text-xs font-semibold opacity-70 hover:opacity-100"
        >
          <ArrowLeft size={14} /> Handover log
        </Link>
        <p className="text-xs opacity-50">{activeFacility?.name}</p>
      </div>

      {!h ? (
        <div className="py-16 text-center text-sm opacity-60">
          Handover not found
        </div>
      ) : (
        <div
          className="rounded-2xl border p-6 space-y-5"
          style={{ borderColor: border, backgroundColor: colors.shadeBg }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold">Handover details</h1>
              <p className="mt-1 text-xs opacity-60">
                {new Date(h.shiftDate).toLocaleDateString()}
                {h.department ? ` · ${h.department}` : ""}
                {h.wardOrUnit ? ` · ${h.wardOrUnit}` : ""}
              </p>
            </div>
            <span
              className="rounded-full border px-3 py-1 text-[10px] font-bold uppercase"
              style={{ borderColor: border }}
            >
              {h.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              className="rounded-xl border p-4"
              style={{
                borderColor: border,
                backgroundColor: colors.shadeBgSecond,
              }}
            >
              <p className="text-[10px] font-bold uppercase opacity-50">
                From (outgoing)
              </p>
              <p className="mt-1 text-sm font-semibold">
                {personLabel(h.fromUser)}
              </p>
              {personContact(h.fromUser) && (
                <p className="mt-1 flex items-center gap-1 text-xs opacity-60">
                  <Phone size={11} /> {personContact(h.fromUser)}
                </p>
              )}
            </div>
            <div
              className="rounded-xl border p-4"
              style={{
                borderColor: border,
                backgroundColor: colors.shadeBgSecond,
              }}
            >
              <p className="text-[10px] font-bold uppercase opacity-50">
                To (incoming)
              </p>
              <p className="mt-1 text-sm font-semibold">
                {personLabel(h.toUser)}
              </p>
              {personContact(h.toUser) && (
                <p className="mt-1 flex items-center gap-1 text-xs opacity-60">
                  <Phone size={11} /> {personContact(h.toUser)}
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold opacity-60 mb-1.5">Summary</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {h.summary}
            </p>
          </div>

          {h.patientNotes && (
            <div>
              <p className="text-xs font-bold opacity-60 mb-1.5">
                Patient notes
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap opacity-80">
                {h.patientNotes}
              </p>
            </div>
          )}

          {h.items && h.items.length > 0 && (
            <div>
              <p className="text-xs font-bold opacity-60 mb-2">Checklist</p>
              <ul className="space-y-2">
                {h.items.map((item, i) => (
                  <li
                    key={i}
                    className="rounded-xl border px-3 py-2 text-xs"
                    style={{ borderColor: border }}
                  >
                    <span className="font-semibold">
                      {item.critical ? "⚠ " : ""}
                      {item.label}
                    </span>
                    {item.detail && (
                      <p className="mt-0.5 opacity-60">{item.detail}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {h.acknowledgedAt && (
            <p className="text-xs opacity-50">
              Acknowledged {new Date(h.acknowledgedAt).toLocaleString()}
            </p>
          )}

          {canAck && (
            <button
              type="button"
              onClick={() => setAckOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Check size={14} /> Acknowledge receipt
            </button>
          )}
        </div>
      )}
    </div>
  );
}
