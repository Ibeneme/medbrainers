"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Video } from "lucide-react";
import { fetchPatients } from "@/api/slices/patientsSlice";
import { fetchStaffDirectory } from "@/api/slices/staffSlice";
import {
  scheduleTeleSession,
  type TeleRole,
  type TeleType,
} from "@/api/slices/telemedicineSlice";
import { useAppSelector } from "@/api/hooks";
import { useTelemedicine } from "@/hooks/useTelemedicine";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  Field,
  ModuleShell,
  useInputStyles,
} from "@/components/dashboard/ModuleShell";
import {
  CustomDropdown,
  CustomPopupDatePicker,
  ToggleSwitch,
} from "@/components/ui/items";
import {
  TM,
  fromLocalInput,
  toLocalInput,
} from "@/components/telemedicine/tm-ui";

const ROLES: TeleRole[] = ["clinician", "cohost", "interpreter"];

const TYPE_OPTIONS: { value: TeleType; label: string }[] = [
  { value: "consultation", label: "Consultation" },
  { value: "follow_up", label: "Follow-up" },
  { value: "review", label: "Review" },
  { value: "second_opinion", label: "Second opinion" },
  { value: "group", label: "Group" },
];

const GUEST_ROLE_OPTIONS: { value: TeleRole; label: string }[] = [
  { value: "guest", label: "Guest" },
  { value: "interpreter", label: "Interpreter" },
  { value: "patient", label: "Patient" },
];

/** yyyy-mm-dd for today, used so a visit cannot be booked on a past day */
const todayStr = () => toLocalInput().slice(0, 10);

export default function ScheduleSessionPage() {
  const router = useRouter();
  const { facilityId, dispatch, telemedicine, act } = useTelemedicine();
  const patients = useAppSelector((s) => s.patients.list);
  const staff = useAppSelector((s) => s.staff.directory);
  const { inputCls, inputStyle, cardCls, ui } = useInputStyles();
  // CustomDropdown reads the theme itself; we only pass the same border as the inputs.
  const dd = { border: ui.border };

  const [patientQ, setPatientQ] = useState("");
  const [patientId, setPatientId] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [hostId, setHostId] = useState("");
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [type, setType] = useState<TeleType>("consultation");
  const [start, setStart] = useState(toLocalInput());
  const [duration, setDuration] = useState(30);
  const [waitingRoom, setWaitingRoom] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [screenShareEnabled, setScreenShareEnabled] = useState(true);
  const [invitePatient, setInvitePatient] = useState(true);
  const [inviteeId, setInviteeId] = useState("");
  const [inviteeRole, setInviteeRole] = useState<TeleRole>("clinician");
  const [invitees, setInvitees] = useState<
    { userId: string; role: TeleRole; label: string }[]
  >([]);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestRole, setGuestRole] = useState<TeleRole>("guest");
  const [guests, setGuests] = useState<
    { name: string; email?: string; role: TeleRole; sendEmail: boolean }[]
  >([]);

  useEffect(() => {
    if (!facilityId) return;
    dispatch(fetchStaffDirectory({ facilityId }));
  }, [dispatch, facilityId]);

  useEffect(() => {
    if (!facilityId) return;
    const t = setTimeout(() => {
      dispatch(
        fetchPatients({ facilityId, search: patientQ || undefined, limit: 20 })
      );
    }, 250);
    return () => clearTimeout(t);
  }, [dispatch, facilityId, patientQ]);

  // Auto-populate title when patient changes
  useEffect(() => {
    if (!patientId) return;
    const selectedPatient = patients.find((p) => p._id === patientId);
    if (selectedPatient) {
      const patientFullName =
        `${selectedPatient.firstName} ${selectedPatient.lastName}`.trim();
      setTitle(patientFullName);
    }
  }, [patientId, patients]);

  const staffLabel = useMemo(() => {
    const map = new Map(
      staff.map((m) => [m.id, `${m.firstName} ${m.lastName}`.trim()])
    );
    return (id: string) => map.get(id) || id.slice(-6);
  }, [staff]);

  const patientOptions = useMemo(
    () => [
      { value: "", label: "No patient yet" },
      ...patients.map((p) => ({
        value: p._id,
        label: `${p.firstName} ${p.lastName} · ${p.mrn}`,
      })),
    ],
    [patients]
  );

  const hostOptions = useMemo(
    () => [
      { value: "", label: "Me" },
      ...staff.map((m) => ({
        value: m.id,
        label: `${m.firstName} ${m.lastName}${m.role ? ` · ${m.role}` : ""}`,
      })),
    ],
    [staff]
  );

  const inviteeOptions = useMemo(
    () =>
      staff
        .filter(
          (m) => m.id !== hostId && !invitees.some((i) => i.userId === m.id)
        )
        .map((m) => ({ value: m.id, label: `${m.firstName} ${m.lastName}` })),
    [staff, hostId, invitees]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const scheduledStart = fromLocalInput(start);
    if (!scheduledStart) return;
    const session = await act(
      scheduleTeleSession({
        facilityId,
        payload: {
          patientId: patientId || undefined,
          appointmentId: appointmentId.trim() || undefined,
          hostId: hostId || undefined,
          title: title.trim() || undefined,
          reason: reason.trim() || undefined,
          type,
          scheduledStart,
          durationMinutes: Number(duration) || undefined,
          waitingRoom,
          chatEnabled,
          screenShareEnabled,
          invitePatient,
          invitees: invitees.map(({ userId, role }) => ({ userId, role })),
          guests: guests.map((g) => ({
            name: g.name,
            email: g.email,
            role: g.role,
            sendEmail: g.sendEmail,
          })),
        },
      }),
      "Session scheduled"
    );
    const id = (session as { _id?: string } | null)?._id;
    if (id) router.push(`${TM}/sessions/${id}`);
  }

  return (
    <ModuleShell
      title="Schedule a visit"
      subtitle="A room code is created and the patient can be emailed a join link"
      icon={Video}
      loading={telemedicine.saving}
    >
      <form onSubmit={submit} className="space-y-4">
        <section
          className={cardCls}
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <h2 className="text-sm font-semibold">Patient</h2>
          <Field label="Search">
            <input
              value={patientQ}
              onChange={(e) => setPatientQ(e.target.value)}
              className={inputCls}
              style={inputStyle}
              placeholder="Name, MRN or phone"
            />
          </Field>
          <Field label="Patient">
            <CustomDropdown
              value={patientId}
              options={patientOptions}
              onChange={setPatientId}
              placeholder="Select a patient…"
              searchable
              {...dd}
            />
          </Field>
          <ToggleSwitch
            checked={invitePatient}
            onChange={setInvitePatient}
            label="Email the patient a join link"
          />
          <Field label="Appointment id (optional)">
            <input
              value={appointmentId}
              onChange={(e) => setAppointmentId(e.target.value)}
              className={inputCls}
              style={inputStyle}
              placeholder="24-character id, if this visit is already booked"
            />
          </Field>
        </section>

        <section
          className={cardCls}
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <h2 className="text-sm font-semibold">Visit</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title">
              <input
                value={title}
                maxLength={160}
                onChange={(e) => setTitle(e.target.value)}
                className={inputCls}
                style={inputStyle}
                placeholder="Defaults to the patient's name"
              />
            </Field>
            <Field label="Type">
              <CustomDropdown
                value={type}
                options={TYPE_OPTIONS}
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
                placeholder="Pick date & time…"
                {...dd}
              />
            </Field>
            <Field label="Length (minutes)">
              <input
                type="number"
                min={5}
                max={720}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className={inputCls}
                style={inputStyle}
                placeholder="e.g. 30"
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
              placeholder="Why is this visit happening?"
            />
          </Field>
          <Field label="Host (blank = you)">
            <CustomDropdown
              value={hostId}
              options={hostOptions}
              onChange={setHostId}
              placeholder="Select a host…"
              searchable
              {...dd}
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
        </section>

        <section
          className={cardCls}
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <h2 className="text-sm font-semibold">Staff in the room</h2>
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-full sm:w-72">
              <CustomDropdown
                value={inviteeId}
                options={inviteeOptions}
                onChange={setInviteeId}
                placeholder="Choose a colleague…"
                searchable
                {...dd}
              />
            </div>
            <div className="w-full sm:w-40">
              <CustomDropdown
                value={inviteeRole}
                options={ROLES.map((r) => ({ value: r, label: r }))}
                onChange={(v) => setInviteeRole(v as TeleRole)}
                placeholder="Select role…"
                {...dd}
              />
            </div>
            <button
              type="button"
              className="rounded-full border px-4 py-2.5 text-xs font-semibold"
              style={{ borderColor: ui.border }}
              onClick={() => {
                if (!inviteeId) return;
                setInvitees((list) => [
                  ...list,
                  {
                    userId: inviteeId,
                    role: inviteeRole,
                    label: staffLabel(inviteeId),
                  },
                ]);
                setInviteeId("");
              }}
            >
              Add
            </button>
          </div>
          {invitees.map((i) => (
            <div
              key={i.userId}
              className="flex items-center justify-between text-sm"
            >
              <span>
                {i.label} · {i.role}
              </span>
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() =>
                  setInvitees((list) =>
                    list.filter((x) => x.userId !== i.userId)
                  )
                }
              >
                Remove
              </button>
            </div>
          ))}
        </section>

        <section
          className={cardCls}
          style={{ backgroundColor: ui.card, borderColor: ui.border }}
        >
          <h2 className="text-sm font-semibold">Guests without an account</h2>
          <div className="grid items-end gap-2 sm:grid-cols-4">
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className={inputCls}
              style={inputStyle}
              placeholder="Name"
            />
            <input
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className={inputCls}
              style={inputStyle}
              placeholder="Email"
            />
            <CustomDropdown
              value={guestRole}
              options={GUEST_ROLE_OPTIONS}
              onChange={(v) => setGuestRole(v as TeleRole)}
              placeholder="Select role…"
              {...dd}
            />
            <button
              type="button"
              className="rounded-full border px-4 py-2.5 text-xs font-semibold"
              style={{ borderColor: ui.border }}
              onClick={() => {
                if (!guestName.trim()) return;
                setGuests((list) => [
                  ...list,
                  {
                    name: guestName.trim(),
                    email: guestEmail.trim() || undefined,
                    role: guestRole,
                    sendEmail: !!guestEmail.trim(),
                  },
                ]);
                setGuestName("");
                setGuestEmail("");
              }}
            >
              Add guest
            </button>
          </div>
          {guests.map((g, idx) => (
            <div
              key={`${g.name}-${idx}`}
              className="flex items-center justify-between text-sm"
            >
              <span>
                {g.name} · {g.role}
                {g.email ? ` · ${g.email}` : ""}
              </span>
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() =>
                  setGuests((list) => list.filter((_, i) => i !== idx))
                }
              >
                Remove
              </button>
            </div>
          ))}
        </section>

        <button
          type="submit"
          disabled={telemedicine.saving}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          style={{ backgroundColor: PRIMARY_COLOR }}
        >
          {telemedicine.saving ? "Scheduling…" : "Schedule visit"}
        </button>
      </form>
    </ModuleShell>
  );
}
