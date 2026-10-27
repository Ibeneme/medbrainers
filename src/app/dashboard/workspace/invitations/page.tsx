"use client";

import { useEffect, useState } from "react";
import { Mail, Check, X, Building2, Loader2 } from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import { useAppDispatch, useAppSelector } from "@/api/hooks";
import {
  fetchPendingInvites,
  fetchMyFacilities,
  acceptInvite,
  rejectInvite,
} from "@/api/slices";
import {
  formatRole,
  facilityIdOf,
  facilityNameOf,
  type PendingInvite,
  type FacilityMembership,
} from "@/api/types";
import { useTheme } from "@/contexts/theme-context";
import { useFacilityId } from "@/hooks/useFacilityId";

function inviteKey(inv: PendingInvite | FacilityMembership): string {
  if ("companyId" in inv && inv.companyId) return String(inv.companyId);
  if ("company" in inv && inv.company) return facilityIdOf(inv.company as any);
  return inv.inviteToken || inv.token || Math.random().toString();
}

function inviteCompanyId(
  inv: PendingInvite | FacilityMembership
): string | undefined {
  if ("companyId" in inv && inv.companyId) return String(inv.companyId);
  if ("company" in inv && inv.company) return facilityIdOf(inv.company as any);
  return undefined;
}

function inviteName(inv: PendingInvite | FacilityMembership): string {
  if ("company" in inv && inv.company)
    return facilityNameOf(inv.company as any);
  return "Facility";
}

export default function InvitationsPage() {
  const dispatch = useAppDispatch();
  const { theme, colors } = useTheme();

  // Use the comprehensive useFacilityId hook
  const { pendingInvites } = useFacilityId();
  const { loading, error, message } = useAppSelector((s) => s.facilities);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [localMsg, setLocalMsg] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchPendingInvites());
    dispatch(fetchMyFacilities());
  }, [dispatch]);

  const handleAccept = async (inv: PendingInvite | FacilityMembership) => {
    const key = inviteKey(inv);
    setBusyId(key);
    setLocalMsg(null);
    try {
      await dispatch(
        acceptInvite({
          companyId: inviteCompanyId(inv),
          token: inv.inviteToken || ("token" in inv ? inv.token : undefined),
        })
      ).unwrap();
      setLocalMsg("Invitation accepted");
      await dispatch(fetchPendingInvites());
      await dispatch(fetchMyFacilities());
    } catch (err: any) {
      setLocalMsg(typeof err === "string" ? err : "Accept failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (inv: PendingInvite | FacilityMembership) => {
    const key = inviteKey(inv);
    setBusyId(key);
    setLocalMsg(null);
    try {
      await dispatch(
        rejectInvite({
          companyId: inviteCompanyId(inv),
          token: inv.inviteToken || ("token" in inv ? inv.token : undefined),
        })
      ).unwrap();
      setLocalMsg("Invitation declined");
      await dispatch(fetchPendingInvites());
      await dispatch(fetchMyFacilities());
    } catch (err: any) {
      setLocalMsg(typeof err === "string" ? err : "Decline failed");
    } finally {
      setBusyId(null);
    }
  };

  const list = (pendingInvites || []) as Array<
    PendingInvite | FacilityMembership
  >;

  return (
    <div
      className="max-w-2xl mx-auto px-4 sm:px-6 py-8 transition-colors duration-200 space-y-6"
      style={{ color: colors.text }}
    >
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
          <Mail size={20} style={{ color: PRIMARY_COLOR }} /> Facility
          Invitations
        </h1>
        <p className="mt-1 text-xs sm:text-sm opacity-60">
          Accept to join a facility, or decline. You can also create your own
          facility anytime.
        </p>
      </div>

      {(error || message || localMsg) && (
        <div
          className="text-xs sm:text-sm px-4 py-3 rounded-xl border font-medium"
          style={{
            backgroundColor: colors.shadeBgSecond,
            borderColor:
              theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
          }}
        >
          {localMsg || message || error}
        </div>
      )}

      {loading && list.length === 0 ? (
        <div className="flex items-center gap-2 text-sm opacity-60 py-4">
          <Loader2 size={16} className="animate-spin" />
          <span>Loading invitations…</span>
        </div>
      ) : list.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed p-12 text-center"
          style={{
            backgroundColor: colors.shadeBg,
            borderColor:
              theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
          }}
        >
          <Building2 className="mx-auto opacity-30 mb-3" size={32} />
          <p className="text-sm font-medium opacity-60">
            No pending invitations
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((inv) => {
            const key = inviteKey(inv);
            const busy = busyId === key;
            return (
              <li
                key={key}
                className="rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors"
                style={{
                  backgroundColor: colors.shadeBg,
                  borderColor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                }}
              >
                <div>
                  <p className="font-semibold text-sm sm:text-base">
                    {inviteName(inv)}
                  </p>
                  <p className="text-xs sm:text-sm opacity-60 mt-0.5">
                    Role:{" "}
                    <span className="font-medium opacity-90">
                      {formatRole(inv.role)}
                    </span>
                    {inv.department ? ` · ${inv.department}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleAccept(inv)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white disabled:opacity-50 cursor-pointer transition-opacity hover:opacity-90"
                    style={{ backgroundColor: PRIMARY_COLOR }}
                  >
                    {busy ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    <span>Accept</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleReject(inv)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border disabled:opacity-50 cursor-pointer transition-colors"
                    style={{
                      borderColor:
                        theme === "dark"
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.15)",
                      backgroundColor: colors.shadeBgSecond,
                    }}
                  >
                    {busy ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <X size={14} />
                    )}
                    <span>Decline</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
