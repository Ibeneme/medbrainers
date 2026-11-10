/**
 * Socket.IO contract for the telehealth room (namespace: "/telehealth").
 * Copy this file into the web app to get end-to-end typing:
 *   const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(`${API}/telehealth`, { auth })
 *
 * ── Connecting ─────────────────────────────────────────────────────────────
 *   staff:   io(url, { auth: (cb) => cb({ token: accessToken }) })        // function form => fresh token on every reconnect
 *   patient: io(url, { auth: { joinToken } })                              // from the emailed link
 *
 * ── Joining & media (WebRTC mesh, "perfect negotiation") ───────────────────
 *   1. emit "room:join" { roomCode }. Ack tells you state = "admitted" | "waiting".
 *   2. waiting  -> show the lobby; you receive "lobby:admitted" / "lobby:denied".
 *   3. admitted -> ack.peers lists everyone already in. The NEWCOMER creates an RTCPeerConnection to each
 *      existing peer and sends the offer; existing peers just answer. Relay everything through "signal".
 *      Use ack.iceServers for RTCPeerConnection({ iceServers }).
 *   4. "peer:joined" { reconnected:true } => that peer dropped & came back: restartIce() / renegotiate.
 */

export type RoomRole = 'host' | 'cohost' | 'clinician' | 'patient' | 'interpreter' | 'guest';
export type PeerConnectionState = 'connected' | 'reconnecting';

export interface MediaState {
  audio: boolean;
  video: boolean;
  screen: boolean;
}

export interface PeerView {
  peerId: string;
  name: string;
  role: RoomRole;
  isHost: boolean;
  media: MediaState;
  handRaised: boolean;
  connection: PeerConnectionState;
  joinedAt: number;
}

export interface RoomView {
  roomCode: string;
  sessionId: string;
  title: string;
  status: string;
  locked: boolean;
  waitingRoom: boolean;
  chatEnabled: boolean;
  screenShareEnabled: boolean;
  maxParticipants: number;
  recording: { active: boolean; allowed: boolean; requiresConsent: boolean };
  /** epoch ms when the session went live (null until a host is in) */
  liveSince: number | null;
}

export interface ChatMessageView {
  id: string;
  peerId: string;
  name: string;
  role: string;
  kind: 'text' | 'system';
  text: string;
  at: number;
}

export type JoinError =
  | 'unauthorized'
  | 'not_found'
  | 'forbidden'
  | 'not_open_yet'
  | 'session_ended'
  | 'room_full'
  | 'room_locked'
  | 'consent_required'
  | 'already_joined'
  | 'rate_limited'
  | 'bad_request'
  | 'server_error';

export type Ack<T = {}> = ({ ok: true } & T) | { ok: false; code: JoinError; message: string };

export interface JoinPayload {
  roomCode: string;
  /** Guests may set a display name; staff names come from their account. */
  displayName?: string;
  audio?: boolean;
  video?: boolean;
  /** Patients must tick the consent box when the facility requires it. */
  consent?: boolean;
}

export interface JoinResult {
  state: 'admitted' | 'waiting';
  self: PeerView;
  room: RoomView;
  /** Everyone admitted (excluding you). Empty while waiting. */
  peers: PeerView[];
  /** Lobby queue — only populated for hosts / co-hosts. */
  waiting: PeerView[];
  iceServers: { urls: string | string[]; username?: string; credential?: string }[];
  /** Last chat messages (admitted only). */
  history: ChatMessageView[];
  lobbyMessage?: string;
}

export type SignalType = 'offer' | 'answer' | 'candidate';
export interface SignalPayload {
  to: string; // peerId
  type: SignalType;
  /** RTCSessionDescriptionInit for offer/answer, RTCIceCandidateInit for candidate */
  data: unknown;
}

export interface ClientToServerEvents {
  'room:join': (p: JoinPayload, ack: (r: Ack<JoinResult>) => void) => void;
  'room:leave': (ack?: (r: Ack) => void) => void;

  signal: (p: SignalPayload, ack?: (r: Ack) => void) => void;

  'media:update': (p: Partial<MediaState>, ack?: (r: Ack) => void) => void;
  'hand:set': (p: { raised: boolean }) => void;
  'reaction:send': (p: { emoji: string }) => void;
  'chat:send': (p: { text: string }, ack?: (r: Ack<{ message: ChatMessageView }>) => void) => void;
  'chat:typing': (p: { typing: boolean }) => void;
  /** Client-measured connection quality, aggregated onto the session record. */
  'quality:report': (p: { rttMs?: number; packetLossPct?: number }) => void;

  // — host / co-host —
  'lobby:admit': (p: { peerId: string }, ack?: (r: Ack) => void) => void;
  'lobby:deny': (p: { peerId: string; reason?: string }, ack?: (r: Ack) => void) => void;
  'lobby:admitAll': (ack?: (r: Ack<{ admitted: number }>) => void) => void;
  'host:mute': (p: { peerId: string; kind: 'audio' | 'video' }, ack?: (r: Ack) => void) => void;
  'host:muteAll': (ack?: (r: Ack) => void) => void;
  'host:remove': (p: { peerId: string }, ack?: (r: Ack) => void) => void;
  'host:lock': (p: { locked: boolean }, ack?: (r: Ack) => void) => void;
  'host:recording': (p: { active: boolean }, ack?: (r: Ack) => void) => void;
  /** primary host only */
  'host:promote': (p: { peerId: string; cohost: boolean }, ack?: (r: Ack) => void) => void;
  /** primary host / co-host: end the call for everyone */
  'host:end': (ack?: (r: Ack) => void) => void;
}

export interface ServerToClientEvents {
  // lobby
  'lobby:waiting': (p: { peer: PeerView }) => void; // hosts only
  'lobby:left': (p: { peerId: string }) => void; // hosts only
  'lobby:admitted': (p: JoinResult) => void; // to the admitted person
  'lobby:denied': (p: { reason?: string }) => void;

  // presence
  'peer:joined': (p: { peer: PeerView; reconnected: boolean }) => void;
  'peer:left': (p: { peerId: string; reason: 'left' | 'removed' | 'timeout' | 'replaced' }) => void;
  'peer:media': (p: { peerId: string; media: MediaState }) => void;
  'peer:hand': (p: { peerId: string; raised: boolean }) => void;
  'peer:role': (p: { peerId: string; role: RoomRole; isHost: boolean }) => void;
  'peer:connection': (p: { peerId: string; state: PeerConnectionState }) => void;
  reaction: (p: { peerId: string; emoji: string }) => void;

  // signalling
  signal: (p: { from: string; type: SignalType; data: unknown }) => void;

  // chat
  'chat:message': (p: ChatMessageView) => void;
  'chat:typing': (p: { peerId: string; name: string; typing: boolean }) => void;

  // room / session
  'room:updated': (p: Partial<RoomView>) => void;
  'recording:update': (p: { active: boolean; by: string }) => void;
  'session:status': (p: { status: string; liveSince: number | null }) => void;
  'session:replaced': (p: { message: string }) => void; // same account joined on another device
  'host:forceMute': (p: { kind: 'audio' | 'video'; by: string }) => void;
  'host:absent': (p: { absent: boolean }) => void;
  'room:timeWarning': (p: { minutesLeft: number }) => void;
  removed: (p: { by: string }) => void;
  'room:ended': (p: { reason: string }) => void;
}

export const REACTIONS = ['👍', '👏', '❤️', '😂', '😮', '🙏'] as const;
