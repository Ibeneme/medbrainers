"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "@/components/access/guarded-link";
import { useParams } from "next/navigation";
import { Video } from "lucide-react";
import { fetchStaffDirectory } from "@/api/slices/staffSlice";
import {
  cancelTeleSession,
  clearTeleFeedback,
  createTeleInvite,
  endTeleSession,
  fetchTeleJoinInfo,
  fetchTeleMessages,
  fetchTeleNotes,
  fetchTeleSession,
  resendTeleInvite,
  revokeTeleInvite,
  updateTeleSession,
  type TeleRole,
  type TeleType,
} from "@/api/slices/telemedicineSlice";
import { useAppSelector } from "@/api/hooks";
import { useTelemedicine } from "@/hooks/useTelemedicine";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  ActionLink,
  EmptyState,
  Field,
  ModuleShell,
  StatusPill,
  useInputStyles,
} from "@/components/dashboard/ModuleShell";
import {
  CustomDropdown,
  CustomPopupDatePicker,
  ToggleSwitch,
} from "@/components/ui/items";
import {
  ROLE_LABEL,
  STATUS_COLOR,
  TM,
  TYPE_LABEL,
  fmtWhen,
  fromLocalInput,
  idOf,
  patientName,
  toLocalInput,
  who,
} from "@/components/telemedicine/tm-ui";

import { Can } from "@/components/access/can";
const TYPE_DROPDOWN_OPTIONS = (Object.keys(TYPE_LABEL) as TeleType[]).map(
  (t) => ({
    value: t,
    label: TYPE_LABEL[t] || t,
  })
);

const GUEST_ROLE_DROPDOWN_OPTIONS = [
  { value: "guest", label: "Guest" },
  { value: "interpreter", label: "Interpreter" },
  { value: "patient", label: "Patient" },
];

const ADD_STAFF_ROLE_OPTIONS = [
  { value: "clinician", label: "Clinician" },
  { value: "cohost", label: "Co-host" },
  { value: "interpreter", label: "Interpreter" },
];

/** yyyy-mm-dd for today, used so a visit cannot be booked on a past day */
const todayStr = () => toLocalInput().slice(0, 10);

export default function SessionDetailPage() {
  const { id } = useParams() as { id: string };
  const { facilityId, dispatch, telemedicine, act } = useTelemedicine();
  const staff = useAppSelector((s) => s.staff.directory);
  const { inputCls, inputStyle, cardCls, ui } = useInputStyles();
  const dd = { border: ui.border };
  const session =
    telemedicine.activeSession?._id === id ? telemedicine.activeSession : null;

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [type, setType] = useState<TeleType>("consultation");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [waitingRoom, setWaitingRoom] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [screenShareEnabled, setScreenShareEnabled] = useState(true);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestRole, setGuestRole] = useState<TeleRole>("guest");
  const [copied, setCopied] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Confirmation Modal States
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDanger?: boolean;
    actionKey?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const closeConfirmModal = () =>
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

  useEffect(() => {
    if (!facilityId || !id) return;
    act(fetchTeleSession({ facilityId, sessionId: id }), false);
    act(fetchTeleJoinInfo({ facilityId, sessionId: id }), false);
    act(fetchTeleNotes({ facilityId, sessionId: id, limit: 20 }), false);
    act(fetchTeleMessages({ facilityId, sessionId: id }), false);
    dispatch(fetchStaffDirectory({ facilityId }));
    return () => {
      dispatch(clearTeleFeedback());
    };
  }, [facilityId, id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!session) return;
    setTitle(session.title);
    setReason(session.reason || "");
    setType(session.type);
    setStart(toLocalInput(session.scheduledStart));
    setEnd(toLocalInput(session.scheduledEnd));
    setWaitingRoom(session.waitingRoom);
    setChatEnabled(session.chatEnabled);
    setScreenShareEnabled(session.screenShareEnabled);
  }, [session?._id, session?.updatedAt, session?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
    } catch {
      setCopied("");
    }
  }

  const join =
    telemedicine.joinInfo?.sessionId === id ? telemedicine.joinInfo : null;
  const canEnter =
    !!join?.canJoin &&
    (session?.status === "scheduled" || session?.status === "live");
  const links =
    telemedicine.freshLinksSessionId === id ? telemedicine.freshLinks : [];

  return (
    <ModuleShell
      title={session?.title || "Visit"}
      subtitle={
        session ? `${session.roomCode} · ${patientName(session)}` : "Loading"
      }
      icon={Video}
      loading={telemedicine.detailLoading && !session}
      actions={
        <>
          <ActionLink href={TM}>Consultations</ActionLink>
          {session && <StatusPill status={session.status} map={STATUS_COLOR} />}
          {canEnter && session && (
            <Link
              href={`${TM}/room/${session.roomCode}`}
              className="rounded-full px-4 py-2.5 text-xs font-semibold text-white"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              Join room
            </Link>
          )}
        </>
      }
    >
      {!session ? null : (
        <div className="space-y-4">
          {!join?.canJoin &&
            join &&
            (session.status === "scheduled" || session.status === "live") && (
              <p
                className="rounded-2xl px-4 py-3 text-sm"
                style={{ backgroundColor: "rgba(217,119,6,0.12)" }}
              >
                You can see this visit, but only the host and invited clinicians
                can enter the room.
              </p>
            )}

          <section
            className={cardCls}
            style={{ backgroundColor: ui.card, borderColor: ui.border }}
          >
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <Info
                k="When"
                v={`${fmtWhen(session.scheduledStart)} – ${fmtWhen(
                  session.scheduledEnd
                )}`}
              />
              <Info k="Type" v={TYPE_LABEL[session.type] || session.type} />
              <Info k="Host" v={who(session.host)} />
              <Info k="Patient" v={patientName(session)} />
              <Info k="Room" v={session.roomCode} />
              <Info
                k="Your role"
                v={join?.role ? ROLE_LABEL[join.role] : "Not in the room"}
              />
              {session.durationMinutes != null && (
                <Info k="Duration" v={`${session.durationMinutes} min`} />
              )}
              {session.endReason && (
                <Info k="Ended" v={session.endReason.replace(/_/g, " ")} />
              )}
              {session.cancelReason && (
                <Info k="Cancel reason" v={session.cancelReason} />
              )}
              {session.reason && <Info k="Reason" v={session.reason} />}
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase opacity-60">
              {session.waitingRoom && <span>Waiting room</span>}
              {session.chatEnabled && <span>Chat</span>}
              {session.screenShareEnabled && <span>Screen share</span>}
              {session.live && (
                <span>
                  {session.live.participants} in · {session.live.waiting}{" "}
                  waiting
                </span>
              )}
            </div>
            {session.status === "scheduled" && !editing && (
              <div className="flex flex-wrap gap-2">
                <Can perm="telemedicine.write"><button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-full border px-4 py-2 text-xs font-semibold"
                  style={{ borderColor: ui.border }}
                >
                  Edit
                </button></Can>
                <Can perm="telemedicine.write"><button
                  type="button"
                  onClick={() => setShowCancel((v) => !v)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-red-600"
                >
                  Cancel visit
                </button></Can>
              </div>
            )}
            {session.status === "live" && (
              <button
                type="button"
                disabled={loadingAction === "end"}
                className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    title: "End Visit",
                    message:
                      "Are you sure you want to end this visit for everyone?",
                    confirmText: "End Visit",
                    isDanger: true,
                    actionKey: "end",
                    onConfirm: async () => {
                      setLoadingAction("end");
                      await act(
                        endTeleSession({ facilityId, sessionId: id }),
                        "Session ended"
                      );
                      setLoadingAction(null);
                      closeConfirmModal();
                    },
                  });
                }}
              >
                {loadingAction === "end" ? "Ending..." : "End visit"}
              </button>
            )}
            {showCancel && session.status === "scheduled" && (
              <div className="space-y-2">
                <Field label="Why is this being cancelled?">
                  <input
                    value={cancelReason}
                    maxLength={500}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className={inputCls}
                    style={inputStyle}
                  />
                </Field>
                <button
                  type="button"
                  disabled={loadingAction === "cancel"}
                  className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: "Cancel Visit",
                      message:
                        "Are you sure you want to cancel this scheduled visit?",
                      confirmText: "Yes, Cancel",
                      isDanger: true,
                      actionKey: "cancel",
                      onConfirm: async () => {
                        setLoadingAction("cancel");
                        await act(
                          cancelTeleSession({
                            facilityId,
                            sessionId: id,
                            reason: cancelReason || undefined,
                          }),
                          "Session cancelled"
                        );
                        setLoadingAction(null);
                        setShowCancel(false);
                        closeConfirmModal();
                      },
                    });
                  }}
                >
                  {loadingAction === "cancel"
                    ? "Cancelling..."
                    : "Confirm cancel"}
                </button>
              </div>
            )}
          </section>

          {editing && session.status === "scheduled" && (
            <form
              className={cardCls}
              style={{ backgroundColor: ui.card, borderColor: ui.border }}
              onSubmit={async (e) => {
                e.preventDefault();
                setLoadingAction("update");
                const ok = await act(
                  updateTeleSession({
                    facilityId,
                    sessionId: id,
                    payload: {
                      title,
                      reason,
                      type,
                      scheduledStart: fromLocalInput(start),
                      scheduledEnd: fromLocalInput(end),
                      waitingRoom,
                      chatEnabled,
                      screenShareEnabled,
                    },
                  }),
                  "Session updated"
                );
                setLoadingAction(null);
                if (ok) setEditing(false);
              }}
            >
              <h2 className="text-sm font-semibold">Edit scheduled visit</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Title">
                  <input
                    required
                    minLength={2}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputCls}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Type">
                  <CustomDropdown
                    value={type}
                    options={TYPE_DROPDOWN_OPTIONS}
                    onChange={(v) => setType(v as TeleType)}
                    placeholder="Select visit type…"
                    {...dd}
                  />
                </Field>
                <Field label="Starts">
                  <CustomPopupDatePicker
                    value={start}
                    onChange={setStart}
                    minDate={todayStr()}
                    placeholder="Pick start date & time…"
                    {...dd}
                  />
                </Field>
                <Field label="Ends">
                  <CustomPopupDatePicker
                    value={end}
                    onChange={setEnd}
                    minDate={start ? start.split("T")[0] : todayStr()}
                    placeholder="Pick end date & time…"
                    {...dd}
                  />
                </Field>
              </div>
              <Field label="Reason">
                <textarea
                  value={reason}
                  maxLength={1000}
                  onChange={(e) => setReason(e.target.value)}
                  className={`${inputCls} min-h-20`}
                  style={inputStyle}
                />
              </Field>
              <div className="flex flex-col gap-2 pt-2">
                <ToggleSwitch
                  checked={waitingRoom}
                  onChange={setWaitingRoom}
                  label="Waiting room"
                />
                <ToggleSwitch
                  checked={chatEnabled}
                  onChange={setChatEnabled}
                  label="Chat"
                />
                <ToggleSwitch
                  checked={screenShareEnabled}
                  onChange={setScreenShareEnabled}
                  label="Screen share"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loadingAction === "update"}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  {loadingAction === "update" ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-full border px-4 py-2 text-xs font-semibold"
                  style={{ borderColor: ui.border }}
                >
                  Close
                </button>
              </div>
            </form>
          )}

          {(session.invites?.length > 0 ||
            links.length > 0 ||
            session.status === "scheduled" ||
            session.status === "live") && (
            <section
              className={cardCls}
              style={{ backgroundColor: ui.card, borderColor: ui.border }}
            >
              <h2 className="text-sm font-semibold">Guest join links</h2>
              <p className="text-xs opacity-55">
                The full link is shown once, when you create or resend it.
                Patients open it without an account.
              </p>
              {links.map((l) => (
                <div
                  key={l.key}
                  className="rounded-2xl p-3 text-sm"
                  style={{ backgroundColor: ui.inner }}
                >
                  <p className="font-semibold">
                    {l.name} · {ROLE_LABEL[l.role] || l.role}
                  </p>
                  <p className="break-all text-xs opacity-70">{l.joinUrl}</p>
                  <button
                    type="button"
                    className="mt-1 text-xs font-semibold"
                    style={{ color: PRIMARY_COLOR }}
                    onClick={() => copy(l.joinUrl, l.key)}
                  >
                    {copied === l.key ? "Copied" : "Copy link"}
                  </button>
                </div>
              ))}
              <div className="space-y-2">
                {(session.invites || []).map((inv) => {
                  const isResending = loadingAction === `resend-${inv.key}`;
                  const isRevoking = loadingAction === `revoke-${inv.key}`;
                  return (
                    <div
                      key={inv.key}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl p-3 text-sm"
                      style={{ backgroundColor: ui.inner }}
                    >
                      <div>
                        <p className="font-semibold">
                          {inv.name} · {ROLE_LABEL[inv.role] || inv.role}
                          {inv.revokedAt ? " · revoked" : ""}
                        </p>
                        <p className="text-xs opacity-55">
                          {inv.email || "No email"}
                          {inv.firstJoinedAt
                            ? ` · joined ${fmtWhen(inv.firstJoinedAt)}`
                            : ""}
                        </p>
                      </div>
                      {!inv.revokedAt &&
                        session.status !== "completed" &&
                        session.status !== "cancelled" &&
                        session.status !== "missed" && (
                          <span className="flex gap-2">
                            <button
                              type="button"
                              disabled={isResending}
                              className="text-xs font-semibold disabled:opacity-50"
                              style={{ color: PRIMARY_COLOR }}
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: "Resend Invite",
                                  message: `Are you sure you want to resend the invite link to ${inv.name}?`,
                                  confirmText: isResending
                                    ? "Resending..."
                                    : "Resend",
                                  actionKey: `resend-${inv.key}`,
                                  onConfirm: async () => {
                                    setLoadingAction(`resend-${inv.key}`);
                                    const link = await act(
                                      resendTeleInvite({
                                        facilityId,
                                        sessionId: id,
                                        key: inv.key,
                                        sendEmail: !!inv.email,
                                      }),
                                      "Invite refreshed"
                                    );
                                    const url = (
                                      link as { joinUrl?: string } | null
                                    )?.joinUrl;
                                    if (url) copy(url, inv.key);
                                    await act(
                                      fetchTeleSession({
                                        facilityId,
                                        sessionId: id,
                                      }),
                                      false
                                    );
                                    setLoadingAction(null);
                                    closeConfirmModal();
                                  },
                                });
                              }}
                            >
                              {isResending ? "Resending..." : "Resend"}
                            </button>
                            <button
                              type="button"
                              disabled={isRevoking}
                              className="text-xs font-semibold text-red-600 disabled:opacity-50"
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: "Revoke Invite",
                                  message: `Are you sure you want to revoke the invite link for ${inv.name}? They will no longer be able to join using this link.`,
                                  confirmText: isRevoking
                                    ? "Revoking..."
                                    : "Revoke",
                                  isDanger: true,
                                  actionKey: `revoke-${inv.key}`,
                                  onConfirm: async () => {
                                    setLoadingAction(`revoke-${inv.key}`);
                                    await act(
                                      revokeTeleInvite({
                                        facilityId,
                                        sessionId: id,
                                        key: inv.key,
                                      }),
                                      "Invite revoked"
                                    );
                                    await act(
                                      fetchTeleSession({
                                        facilityId,
                                        sessionId: id,
                                      }),
                                      false
                                    );
                                    setLoadingAction(null);
                                    closeConfirmModal();
                                  },
                                });
                              }}
                            >
                              {isRevoking ? "Revoking..." : "Revoke"}
                            </button>
                          </span>
                        )}
                    </div>
                  );
                })}
              </div>
              {session.status !== "completed" &&
                session.status !== "cancelled" &&
                session.status !== "missed" && (
                  <div className="grid gap-2 sm:grid-cols-4 items-end">
                    <input
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Name"
                      className={inputCls}
                      style={inputStyle}
                    />
                    <input
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="Email"
                      className={inputCls}
                      style={inputStyle}
                    />
                    <CustomDropdown
                      value={guestRole}
                      options={GUEST_ROLE_DROPDOWN_OPTIONS}
                      onChange={(v) => setGuestRole(v as TeleRole)}
                      placeholder="Select role…"
                      {...dd}
                    />
                    <button
                      type="button"
                      disabled={loadingAction === "create-invite"}
                      className="rounded-full border px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                      style={{
                        backgroundColor: PRIMARY_COLOR,
                        borderColor: PRIMARY_COLOR,
                      }}
                      onClick={async () => {
                        if (!guestName.trim()) return;
                        setLoadingAction("create-invite");
                        await act(
                          createTeleInvite({
                            facilityId,
                            sessionId: id,
                            payload: {
                              name: guestName.trim(),
                              email: guestEmail.trim() || undefined,
                              role: guestRole,
                              isPatient: guestRole === "patient",
                              sendEmail: !!guestEmail.trim(),
                            },
                          }),
                          false
                        );
                        setGuestName("");
                        setGuestEmail("");
                        await act(
                          fetchTeleSession({ facilityId, sessionId: id }),
                          false
                        );
                        setLoadingAction(null);
                      }}
                    >
                      {loadingAction === "create-invite"
                        ? "Creating..."
                        : "Create link"}
                    </button>
                  </div>
                )}
            </section>
          )}

          <section
            className={cardCls}
            style={{ backgroundColor: ui.card, borderColor: ui.border }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Staff invited</h2>
            </div>
            {(session.invitees || []).length === 0 ? (
              <p className="text-xs opacity-50">
                Only the host is in this visit.
              </p>
            ) : (
              <div className="space-y-1 text-sm">
                {session.invitees.map((i, idx) => (
                  <p key={idx}>
                    {who(i.user)} · {ROLE_LABEL[i.role] || i.role}
                  </p>
                ))}
              </div>
            )}
            {staff.length > 0 && session.status === "scheduled" && (
              <AddStaff
                staff={staff.filter((m) => m.id !== idOf(session.host))}
                dd={dd}
                onAdd={async (userId, role) => {
                  const invitees = [
                    ...session.invitees.map((i) => ({
                      userId: idOf(i.user),
                      role: i.role,
                    })),
                    { userId, role },
                  ].filter((i) => i.userId);
                  setLoadingAction("add-staff");
                  await act(
                    updateTeleSession({
                      facilityId,
                      sessionId: id,
                      payload: { invitees },
                    }),
                    "Staff updated"
                  );
                  setLoadingAction(null);
                }}
                loading={loadingAction === "add-staff"}
              />
            )}
          </section>

          <section
            className={cardCls}
            style={{ backgroundColor: ui.card, borderColor: ui.border }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Notes</h2>
              <Link
                href={`${TM}/notes/new?sessionId=${session._id}`}
                className="text-xs font-semibold"
                style={{ color: PRIMARY_COLOR }}
              >
                Write a note
              </Link>
            </div>
            {telemedicine.notes.length === 0 ? (
              <EmptyState text="No notes for this visit yet." />
            ) : (
              <div className="space-y-2">
                {telemedicine.notes.map((n) => (
                  <Link
                    key={n._id}
                    href={`${TM}/notes/${n._id}`}
                    className="flex items-center justify-between rounded-2xl p-3 text-sm"
                    style={{ backgroundColor: ui.inner }}
                  >
                    <span>
                      {n.title || n.type} · {who(n.author)}
                    </span>
                    <StatusPill status={n.status} map={STATUS_COLOR} />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section
            className={cardCls}
            style={{ backgroundColor: ui.card, borderColor: ui.border }}
          >
            <h2 className="text-sm font-semibold">Chat transcript</h2>
            {telemedicine.messages.length === 0 ? (
              <EmptyState text="No chat yet. Messages appear here after people talk in the room." />
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {telemedicine.messages.map((m) => (
                  <div key={m.id} className="text-sm">
                    <p className="text-[11px] opacity-50">
                      {m.kind === "system" ? "System" : `${m.name} · ${m.role}`}{" "}
                      · {fmtWhen(m.at)}
                    </p>
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {(session.attendance || []).length > 0 && (
            <section
              className={cardCls}
              style={{ backgroundColor: ui.card, borderColor: ui.border }}
            >
              <h2 className="text-sm font-semibold">Attendance</h2>
              {session.attendance.map((a) => (
                <p key={a.identityKey} className="text-sm">
                  {a.name} · {a.role} · {fmtWhen(a.joinedAt)}
                  {a.leftAt ? ` – ${fmtWhen(a.leftAt)}` : " · still in"}
                </p>
              ))}
            </section>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4"
            style={{
              backgroundColor: ui.card,
         
            }}
          >
            <h3 className="text-base font-semibold">{confirmModal.title}</h3>
            <p className="text-sm opacity-75">{confirmModal.message}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={loadingAction === confirmModal.actionKey}
                onClick={closeConfirmModal}
                className="rounded-full border px-4 py-2 text-xs font-semibold disabled:opacity-50"
                style={{ borderColor: ui.border }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loadingAction === confirmModal.actionKey}
                onClick={confirmModal.onConfirm}
                className={`rounded-full px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 ${
                  confirmModal.isDanger ? "bg-red-600" : ""
                }`}
                style={{
                  backgroundColor: confirmModal.isDanger
                    ? undefined
                    : PRIMARY_COLOR,
                }}
              >
                {loadingAction === confirmModal.actionKey
                  ? "Processing..."
                  : confirmModal.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModuleShell>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-45">
        {k}
      </p>
      <p>{v}</p>
    </div>
  );
}

function AddStaff({
  staff,
  onAdd,
  dd,
  loading,
}: {
  staff: { id: string; firstName: string; lastName: string }[];
  onAdd: (id: string, role: TeleRole) => void;
  dd: { border: string };
  loading?: boolean;
}) {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<TeleRole>("clinician");

  const staffOptions = useMemo(
    () => [
      { value: "", label: "Add a colleague" },
      ...staff.map((m) => ({
        value: m.id,
        label: `${m.firstName} ${m.lastName}`,
      })),
    ],
    [staff]
  );

  return (
    <div className="flex flex-wrap items-end gap-2 pt-2">
      <div className="w-full sm:w-72">
        <CustomDropdown
          value={userId}
          options={staffOptions}
          onChange={setUserId}
          placeholder="Choose a colleague…"
          searchable
          {...dd}
        />
      </div>
      <div className="w-full sm:w-40">
        <CustomDropdown
          value={role}
          options={ADD_STAFF_ROLE_OPTIONS}
          onChange={(v) => setRole(v as TeleRole)}
          placeholder="Select role…"
          {...dd}
        />
      </div>
      <button
        type="button"
        disabled={!userId || loading}
        className="rounded-full border px-4 py-2.5 text-xs font-semibold disabled:opacity-50"
        style={{ borderColor: dd.border }}
        onClick={() => userId && onAdd(userId, role)}
      >
        {loading ? "Adding..." : "Add"}
      </button>
    </div>
  );
}
