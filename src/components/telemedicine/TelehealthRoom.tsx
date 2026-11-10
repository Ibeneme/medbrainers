"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { io, type Socket } from "socket.io-client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
  UserX,
} from "lucide-react";
import { getAccessToken } from "@/api/services";
import { API_CONFIG } from "@/api/config";
import type {
  ChatMessageView,
  JoinResult,
  MediaState,
  PeerView,
  RoomView,
} from "@/api/telehealth.events";
import type { IceServer } from "@/api/slices/telemedicineSlice";
import { CustomPopupDatePicker, TextField, Modal } from "@/components/ui/items";
import { PRIMARY_COLOR } from "@/constants/colors";

type Phase = "idle" | "connecting" | "waiting" | "admitted" | "ended" | "error";

type Notice = { type: "success" | "error"; message: string } | null;

function staffAuth(cb: (a: { token: string | null }) => void) {
  cb({ token: getAccessToken() });
}

function socketUrl() {
  const base = API_CONFIG.BASE_URL.replace(/\/$/, "");
  try {
    const u = new URL(base);
    return `${u.origin}/telehealth`;
  } catch {
    return `${base}/telehealth`;
  }
}

export function TelehealthRoom({
  roomCode,
  iceServers,
  joinToken,
  displayName,
  consent = false,
  autoJoin = true,
  chatEnabled = true,
  screenShareEnabled = true,
  onLeave,
  facilityId,
  sessionId,
  apiReschedule,
}: {
  roomCode: string;
  iceServers: IceServer[];
  joinToken?: string;
  displayName?: string;
  consent?: boolean;
  autoJoin?: boolean;
  chatEnabled?: boolean;
  screenShareEnabled?: boolean;
  onLeave?: () => void;
  facilityId?: string;
  sessionId?: string;
  apiReschedule?: (payload: {
    scheduledStart: string;
    scheduledEnd?: string;
    reason?: string;
  }) => Promise<any>;
}) {
  const [phase, setPhase] = useState<Phase>(autoJoin ? "connecting" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [self, setSelf] = useState<PeerView | null>(null);
  const [room, setRoom] = useState<RoomView | null>(null);
  const [peers, setPeers] = useState<PeerView[]>([]);
  const [waiting, setWaiting] = useState<PeerView[]>([]);
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [draft, setDraft] = useState("");
  const [media, setMedia] = useState<MediaState>({
    audio: true,
    video: true,
    screen: false,
  });
  const [hand, setHand] = useState(false);
  const [typing, setTyping] = useState<string | null>(null);
  const [remotes, setRemotes] = useState<Record<string, MediaStream>>({});

  // Reschedule state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleStart, setRescheduleStart] = useState(
    new Date(Date.now() + 24 * 3600_000).toISOString().slice(0, 16)
  );
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  // Popup notice (replaces alert())
  const [notice, setNotice] = useState<Notice>(null);
  const closeNotice = useCallback(() => setNotice(null), []);

  const socketRef = useRef<any>(null);
  const pcs = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localRef = useRef<MediaStream | null>(null);
  const localVideo = useRef<HTMLVideoElement | null>(null);
  const iceRef = useRef(iceServers);
  iceRef.current = iceServers;
  const mediaRef = useRef(media);
  mediaRef.current = media;

  const attachLocal = (stream: MediaStream | null) => {
    localRef.current = stream;
    if (localVideo.current) localVideo.current.srcObject = stream;
  };

  const closePeer = useCallback((peerId: string) => {
    pcs.current.get(peerId)?.close();
    pcs.current.delete(peerId);
    setRemotes((m) => {
      if (!m[peerId]) return m;
      const next = { ...m };
      delete next[peerId];
      return next;
    });
  }, []);

  const connectPeer = useCallback((peerId: string, initiator: boolean) => {
    const existing = pcs.current.get(peerId);
    if (existing) return existing;
    const pc = new RTCPeerConnection({ iceServers: iceRef.current });
    pcs.current.set(peerId, pc);
    const local = localRef.current;
    local?.getTracks().forEach((t) => pc.addTrack(t, local));
    const socket = socketRef.current;
    pc.onicecandidate = (e) => {
      if (e.candidate)
        socket?.emit("signal", {
          to: peerId,
          type: "candidate",
          data: e.candidate.toJSON(),
        });
    };
    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (stream) setRemotes((m) => ({ ...m, [peerId]: stream }));
    };
    if (initiator) {
      pc.createOffer()
        .then((o) => pc.setLocalDescription(o))
        .then(() =>
          socket?.emit("signal", {
            to: peerId,
            type: "offer",
            data: pc.localDescription,
          })
        )
        .catch(() => undefined);
    }
    return pc;
  }, []);

  const applyJoin = useCallback(
    (r: JoinResult) => {
      setSelf(r.self);
      setRoom(r.room);
      setPeers(r.peers || []);
      setWaiting(r.waiting || []);
      setMessages(r.history || []);
      setPhase(r.state === "waiting" ? "waiting" : "admitted");
      if (r.state === "admitted")
        (r.peers || []).forEach((p) => connectPeer(p.peerId, true));
    },
    [connectPeer]
  );

  const leave = useCallback(() => {
    socketRef.current?.emit("room:leave");
    socketRef.current?.disconnect();
    socketRef.current = null;
    pcs.current.forEach((pc) => pc.close());
    pcs.current.clear();
    localRef.current?.getTracks().forEach((t) => t.stop());
    attachLocal(null);
    setRemotes({});
    setPhase("ended");
    onLeave?.();
  }, [onLeave]);

  useEffect(() => {
    if (!autoJoin) return;
    let cancelled = false;

    (async () => {
      setPhase("connecting");
      setError(null);
      try {
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
          });
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });
            setMedia((m) => ({ ...m, video: false }));
          } catch {
            setMedia({ audio: false, video: false, screen: false });
          }
        }
        if (cancelled) {
          stream?.getTracks().forEach((t) => t.stop());
          return;
        }
        attachLocal(stream);

        const socket: Socket = io(socketUrl(), {
          transports: ["websocket", "polling"],
          auth: joinToken ? { joinToken } : staffAuth,
        });
        socketRef.current = socket;

        socket.on("connect_error", (e: Error) => {
          setError(e?.message || "Could not reach the telehealth server");
          setPhase("error");
        });

        socket.on(
          "signal",
          async ({
            from,
            type,
            data,
          }: {
            from: string;
            type: string;
            data: any;
          }) => {
            const pc = pcs.current.get(from) || connectPeer(from, false);
            try {
              if (type === "offer") {
                await pc.setRemoteDescription(data);
                await pc.setLocalDescription(await pc.createAnswer());
                socket.emit("signal", {
                  to: from,
                  type: "answer",
                  data: pc.localDescription,
                });
              } else if (type === "answer") {
                await pc.setRemoteDescription(data);
              } else if (data) {
                await pc.addIceCandidate(data);
              }
            } catch {}
          }
        );

        socket.on("lobby:admitted", (r: JoinResult) => applyJoin(r));
        socket.on("lobby:denied", (p: { reason?: string }) => {
          setError(p?.reason || "The host did not admit you");
          setPhase("error");
        });
        socket.on("lobby:waiting", ({ peer }: { peer: PeerView }) =>
          setWaiting((w) => [
            ...w.filter((x) => x.peerId !== peer.peerId),
            peer,
          ])
        );
        socket.on("lobby:left", ({ peerId }: { peerId: string }) =>
          setWaiting((w) => w.filter((x) => x.peerId !== peerId))
        );

        socket.on(
          "peer:joined",
          ({ peer, reconnected }: { peer: PeerView; reconnected: boolean }) => {
            setPeers((list) => [
              ...list.filter((p) => p.peerId !== peer.peerId),
              peer,
            ]);
            if (reconnected) pcs.current.get(peer.peerId)?.restartIce();
            else connectPeer(peer.peerId, false);
          }
        );
        socket.on("peer:left", ({ peerId }: { peerId: string }) => {
          setPeers((list) => list.filter((p) => p.peerId !== peerId));
          closePeer(peerId);
        });
        socket.on(
          "peer:media",
          ({ peerId, media: m }: { peerId: string; media: MediaState }) =>
            setPeers((list) =>
              list.map((p) => (p.peerId === peerId ? { ...p, media: m } : p))
            )
        );
        socket.on(
          "peer:hand",
          ({ peerId, raised }: { peerId: string; raised: boolean }) =>
            setPeers((list) =>
              list.map((p) =>
                p.peerId === peerId ? { ...p, handRaised: raised } : p
              )
            )
        );
        socket.on("chat:message", (m: ChatMessageView) =>
          setMessages((list) => [...list, m])
        );
        socket.on(
          "chat:typing",
          ({ name, typing: on }: { name: string; typing: boolean }) =>
            setTyping(on ? name : null)
        );
        socket.on("room:updated", (p: Partial<RoomView>) =>
          setRoom((r) => (r ? { ...r, ...p } : r))
        );
        socket.on("host:forceMute", ({ kind }: { kind: "audio" | "video" }) => {
          localRef.current
            ?.getTracks()
            .filter((t) => t.kind === kind)
            .forEach((t) => (t.enabled = false));
          setMedia((m) => ({ ...m, [kind]: false }));
        });
        socket.on("session:replaced", () => {
          setError("You joined this visit from another device");
          setPhase("ended");
        });
        socket.on("removed", () => {
          setError("You were removed from the visit");
          setPhase("ended");
        });
        socket.on("room:ended", ({ reason }: { reason: string }) => {
          setError(
            reason === "host_ended"
              ? "The host ended the visit"
              : `Visit ended (${reason || "closed"})`
          );
          setPhase("ended");
        });

        socket.emit(
          "room:join",
          {
            roomCode,
            displayName,
            audio: !!stream?.getAudioTracks().length,
            video: !!stream?.getVideoTracks().length,
            consent: consent || undefined,
          },
          (r: any) => {
            if (cancelled) return;
            if (!r?.ok) {
              setError(r?.message || "Could not join this room");
              setPhase("error");
              return;
            }
            applyJoin(r);
          }
        );
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Could not start the visit.");
          setPhase("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
      pcs.current.forEach((pc) => pc.close());
      pcs.current.clear();
      localRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, joinToken, autoJoin]);

  function toggleTrack(kind: "audio" | "video") {
    const next = !mediaRef.current[kind];
    localRef.current
      ?.getTracks()
      .filter((t) => t.kind === kind)
      .forEach((t) => (t.enabled = next));
    const updated = { ...mediaRef.current, [kind]: next };
    setMedia(updated);
    socketRef.current?.emit("media:update", { [kind]: next });
  }

  async function handleConfirmReschedule() {
    if (!rescheduleStart) return;
    const startIso = new Date(rescheduleStart).toISOString();
    setRescheduling(true);
    try {
      if (apiReschedule) {
        await apiReschedule({
          scheduledStart: startIso,
          reason: rescheduleReason || undefined,
        });
      } else if (facilityId && sessionId) {
        const tokenVal = joinToken || getAccessToken();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (joinToken) headers["Authorization"] = `Bearer ${joinToken}`;
        else if (tokenVal) headers["Authorization"] = `Bearer ${tokenVal}`;

        const res = await fetch(
          `${API_CONFIG.BASE_URL.replace(
            /\/$/,
            ""
          )}/companies/${facilityId}/telemedicine/sessions/${sessionId}/reschedule`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              scheduledStart: startIso,
              reason: rescheduleReason || undefined,
            }),
          }
        );
        const json = await res.json();
        if (!json.success)
          throw new Error(json.message || "Failed to reschedule");
      }
      setNotice({
        type: "success",
        message: "Your session has been rescheduled successfully.",
      });
      setShowRescheduleModal(false);
    } catch (e: any) {
      setNotice({
        type: "error",
        message: e?.message || "Could not reschedule session",
      });
    } finally {
      setRescheduling(false);
    }
  }

  const isHost =
    self?.role === "host" || self?.role === "cohost" || !!self?.isHost;
  const showChat = chatEnabled && room?.chatEnabled !== false;

  // Guests (people who joined with a join token and aren't a host/cohost)
  // can't admit anyone. Every other participant in the room can.
  const isGuest = self?.role === "guest" || (!!joinToken && !isHost);
  const canAdmit = phase === "admitted" && !!self && !isGuest;

  function admitPeer(peerId: string) {
    socketRef.current?.emit("lobby:admit", { peerId }, (r: any) => {
      if (r && r.ok === false) {
        setNotice({
          type: "error",
          message: r.message || "Could not admit this person",
        });
        return;
      }
      setWaiting((w) => w.filter((x) => x.peerId !== peerId));
    });
  }

  function denyPeer(peerId: string) {
    socketRef.current?.emit("lobby:deny", { peerId }, (r: any) => {
      if (r && r.ok === false) {
        setNotice({
          type: "error",
          message: r.message || "Could not deny this person",
        });
        return;
      }
      setWaiting((w) => w.filter((x) => x.peerId !== peerId));
    });
  }

  // Determine if the session was missed or closed due to being missed/passed
  const isMissedOrEnded =
    phase === "ended" ||
    phase === "error" ||
    error?.includes("missed") ||
    error?.includes("ended") ||
    error?.includes("passed");

  return (
    <div className="overflow-hidden rounded-[28px] bg-[#0f1115] text-white">
      {/* ── Error / Ended / Missed View ── */}
      {(phase === "error" || phase === "ended") && (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
            <PhoneOff size={22} className="opacity-50" />
          </div>
          <p className="text-base font-medium text-white/90">
            {error || "This visit has ended."}
          </p>
          {error?.includes("not opened yet") && (
            <p className="mt-2 max-w-xs text-xs text-white/50">
              Sessions open from 30 minutes prior to the scheduled start time.
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {/* Only show Reschedule if missed/ended/passed, not on "not opened yet" */}
            {/* {isMissedOrEnded && !error?.includes("not opened yet") && (
              <button
                type="button"
                onClick={() => setShowRescheduleModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/25"
              >
                <RotateCw size={15} />
                Reschedule missed visit
              </button>
            )} */}
            <button
              type="button"
              onClick={leave}
              className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/15"
            >
              Close
            </button>
          </div>

          <Modal
            open={showRescheduleModal}
            title="Reschedule Missed Visit"
            onClose={() => setShowRescheduleModal(false)}
            ui={{
              isDark: true,
              page: "",
              card: "#1e1e1e",
              inner: "rgba(255,255,255,0.08)",
              text: "#ffffff",
              border: "rgba(255,255,255,0.12)",
            }}
            maxWidth="max-w-md"
          >
            <div className="space-y-4 pt-1">
              <CustomPopupDatePicker
                label="New Date & Time"
                value={rescheduleStart}
                onChange={setRescheduleStart}
                isDark={true}
              />
              <TextField
                label="Reason for Rescheduling"
                value={rescheduleReason}
                onChange={setRescheduleReason}
                placeholder="e.g. Missed session or doctor unavailable"
                multiline
                rows={3}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={rescheduling}
                  onClick={() => setShowRescheduleModal(false)}
                  className="rounded-full bg-white/10 px-5 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/15"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={rescheduling}
                  onClick={handleConfirmReschedule}
                  className="rounded-full px-5 py-2.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  {rescheduling ? "Rescheduling..." : "Confirm Reschedule"}
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* ── Waiting room ── */}
      {phase === "waiting" && (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
            <Users size={22} className="opacity-50" />
          </div>
          <p className="text-lg font-semibold tracking-tight">
            You are in the waiting room
          </p>
          <p className="mt-2 max-w-sm text-sm text-white/55">
            {room?.title
              ? `The host will admit you into ${room.title}.`
              : "The host will admit you shortly."}
          </p>
          <div className="mt-6 flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs text-white/50">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            Waiting for admission
          </div>
        </div>
      )}

      {/* ── Main room ── */}
      {phase !== "error" && phase !== "ended" && phase !== "waiting" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">
                {room?.title || "Virtual consultation"}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/40">
                <span className="font-mono">{roomCode}</span>
                <span className="opacity-40">·</span>
                <span className="capitalize">
                  {phase === "admitted" ? "In the room" : "Connecting…"}
                </span>
              </p>
            </div>
          </div>

          <div
            className={`grid gap-0 ${
              canAdmit && waiting.length > 0 ? "lg:grid-cols-[1fr_300px]" : ""
            }`}
          >
            <div className="flex flex-col">
              <div className="space-y-3 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <VideoTile
                    label={`${self?.name || "You"} (you)`}
                    muted
                    videoRef={localVideo}
                    off={!media.video}
                  />
                  {peers.map((p) => (
                    <RemoteTile
                      key={p.peerId}
                      peer={p}
                      stream={remotes[p.peerId]}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-auto flex items-center justify-center gap-2 border-t border-white/[0.06] px-4 py-4">
                <Ctrl
                  active={media.audio}
                  onClick={() => toggleTrack("audio")}
                  label="Audio"
                >
                  {media.audio ? <Mic size={16} /> : <MicOff size={16} />}
                </Ctrl>
                <Ctrl
                  active={media.video}
                  onClick={() => toggleTrack("video")}
                  label="Video"
                >
                  {media.video ? <Video size={16} /> : <VideoOff size={16} />}
                </Ctrl>
                <Ctrl active danger onClick={leave} label="Leave">
                  <PhoneOff size={16} />
                </Ctrl>
              </div>
            </div>

            {/* Waiting room panel: any non-guest can admit or deny */}
            {canAdmit && waiting.length > 0 && (
              <aside className="border-t border-white/[0.06] p-4 lg:border-l lg:border-t-0">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/50">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  Waiting to join ({waiting.length})
                </p>
                <ul className="space-y-2">
                  {waiting.map((p) => (
                    <li
                      key={p.peerId}
                      className="flex items-center justify-between gap-2 rounded-2xl bg-white/5 px-3 py-2.5"
                    >
                      <span className="truncate text-sm font-medium">
                        {p.name || "Guest"}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => admitPeer(p.peerId)}
                          title="Admit"
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-400"
                        >
                          <UserCheck size={13} />
                          Admit
                        </button>
                        <button
                          type="button"
                          onClick={() => denyPeer(p.peerId)}
                          title="Deny"
                          className="inline-flex items-center rounded-full bg-white/10 p-1.5 text-white/70 transition hover:bg-red-500/80 hover:text-white"
                        >
                          <UserX size={14} />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>
        </>
      )}

      {/* ── Popup notice (highest z-index, rendered via portal) ── */}
      <NoticePopup notice={notice} onClose={closeNotice} />
    </div>
  );
}

function NoticePopup({
  notice,
  onClose,
}: {
  notice: Notice;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // auto-dismiss
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(onClose, notice.type === "success" ? 3500 : 6000);
    return () => clearTimeout(t);
  }, [notice, onClose]);

  if (!mounted || !notice) return null;

  const isSuccess = notice.type === "success";
  const accent = isSuccess ? "#22c55e" : "#ef4444";

  return createPortal(
    <div
      role="alertdialog"
      aria-live="assertive"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647, // highest possible
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        animation: "noticeFade 160ms ease-out",
      }}
    >
      <style>{`
        @keyframes noticeFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes noticePop {
          from { opacity: 0; transform: translateY(8px) scale(.96) }
          to   { opacity: 1; transform: translateY(0) scale(1) }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#1b1d22] p-6 text-center text-white shadow-2xl"
        style={{ animation: "noticePop 200ms cubic-bezier(.2,.8,.2,1)" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>

        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${accent}22`, color: accent }}
        >
          {isSuccess ? <CheckCircle2 size={28} /> : <AlertCircle size={28} />}
        </div>

        <p className="text-base font-semibold tracking-tight">
          {isSuccess ? "Success" : "Something went wrong"}
        </p>
        <p className="mt-1.5 text-sm text-white/60">{notice.message}</p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-full py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: accent }}
        >
          {isSuccess ? "Done" : "Dismiss"}
        </button>
      </div>
    </div>,
    document.body
  );
}

function VideoTile({
  label,
  videoRef,
  off,
  muted,
}: {
  label: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  off?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="relative min-h-[200px] overflow-hidden rounded-2xl bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={`h-full min-h-[200px] w-full object-cover ${
          off ? "opacity-0" : ""
        }`}
      />
      {off && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/40">
          <VideoOff size={22} />
          <span className="text-xs">Camera off</span>
        </div>
      )}
      <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}

function RemoteTile({
  peer,
  stream,
}: {
  peer: PeerView;
  stream?: MediaStream;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream || null;
  }, [stream]);

  return (
    <div className="relative min-h-[200px] overflow-hidden rounded-2xl bg-black">
      <video
        ref={ref}
        autoPlay
        playsInline
        className="h-full min-h-[200px] w-full object-cover"
      />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-white/35">
          Connecting…
        </div>
      )}
      <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm">
        {peer.name}
      </span>
    </div>
  );
}

function Ctrl({
  children,
  onClick,
  active = true,
  danger,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="flex h-11 w-11 items-center justify-center rounded-full transition-all hover:scale-105"
      style={{
        backgroundColor: danger
          ? "rgba(220, 38, 38, 0.9)"
          : active
          ? "rgba(255,255,255,0.1)"
          : "rgba(255,255,255,0.92)",
        color: danger || active ? "white" : "#111",
      }}
    >
      {children}
    </button>
  );
}
