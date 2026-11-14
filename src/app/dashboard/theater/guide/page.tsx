"use client";

import { ReactNode, useState } from "react";
import Link from "@/components/access/guarded-link";
import { BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import { Banner, Card, Header, Page, Pill, TBASE, useUI } from "@/components/theater/th-ui";

/* ───────────────────────── content ───────────────────────── */

type Step = { title: string; body: string; href?: string };

const JOURNEY: Step[] = [
  { title: "Request the surgery", body: "A clinician asks the theatre team to operate: patient, procedure, diagnosis and how urgent it is.", href: "/requests/new" },
  { title: "Schedule the case", body: "Pick a room, a start time and the team (surgeon, anaesthetist, scrub nurse). The page warns if the room is already booked at that time.", href: "/schedule/new" },
  { title: "Pre-op assessment & anaesthesia review", body: "Is the patient fit? Record ASA grade, airway, medicines, allergies and a decision: fit, fit with optimisation, or unfit.", href: "/pre-op" },
  { title: "Consent", body: "Explain the procedure, risks and alternatives, then record whether the patient agreed. No consent, no surgery (except documented emergencies).", href: "/consent" },
  { title: "Move to pre-op, then send to theatre", body: "On the case page, move the case along. Sending to theatre starts the operating clock.", href: "/schedule" },
  { title: "WHO safety checklist", body: "Three pauses: sign-in before anaesthesia, time-out before the first cut, sign-out before the patient leaves.", href: "/checklist" },
  { title: "During the operation", body: "Anaesthetist keeps the anaesthesia record. The nurses record instrument and swab counts and any implants. The surgeon writes the operation note.", href: "/operation-notes" },
  { title: "Recovery (PACU)", body: "Move the patient to recovery, watch them, and discharge to the ward when the Aldrete score is 9 or more.", href: "/recovery" },
  { title: "Post-op orders & complications", body: "Write the ward instructions. If anything went wrong, report a complication so it can be reviewed.", href: "/post-op" },
  { title: "Close the case", body: "Mark the case completed. The linked surgery request closes too.", href: "/schedule" },
];

const CSSD: Step[] = [
  { title: "Start a cycle", body: "Log the cycle number, the method (e.g. steam autoclave) and what is in the load.", href: "/cssd/new" },
  { title: "Record the result", body: "Check the indicators. Pass means the load is sterile. Fail means everything must be reprocessed.", href: "/cssd" },
];

type Page_ = { name: string; href: string; what: string; how: string[]; watch?: string };
type Group = { id: string; title: string; intro: string; pages: Page_[] };

const GROUPS: Group[] = [
  { id: "overview", title: "Dashboard", intro: "Your view of the whole theatre suite today.", pages: [
    { name: "Theatre Dashboard", href: "", what: "Cases today, operations running now, pending requests, patients in recovery, room status and today's list.", how: ["A red banner means an emergency request is waiting.", "A yellow banner means a case is past its start time and still not in pre-op.", "Room tiles show In use (amber) or Free.", "It refreshes every 30 seconds."] },
  ] },
  { id: "scheduling", title: "Scheduling", intro: "Getting the right case in the right room with the right team.", pages: [
    { name: "Surgery Requests", href: "/requests", what: "Requests from wards and clinics, with priority (elective, urgent, emergency).", how: ["Open one and press Schedule this surgery to turn it into a booked case.", "Filter by status and priority, or search by patient, MRN or procedure.", "New request is its own page; emergency requests ask you to confirm."] },
    { name: "Theatre Schedule", href: "/schedule", what: "Every booked case by day and room.", how: ["Pick a day or press Today.", "Click a case to open its hub page: status buttons, everything you can record, and saved notes.", "Status flow: Scheduled → Pre-op → In theatre → Recovery → Completed (or Cancelled)."], watch: "Cancelling a case also cancels the linked request." },
    { name: "Theatre Rooms & Availability", href: "/rooms", what: "Each room with whether it is in use, how many cases today and the next case.", how: ["Add room: give it a name and a unique code such as OT1.", "Click a room to open its own page: who is operating now, today, upcoming cases and recent history.", "Edit room renames it, changes its type or deactivates it (deactivating asks you to confirm). Saving an edit needs the optional PATCH route in the server patch notes."] },
    { name: "Surgical Teams", href: "/teams", what: "Each surgeon, anaesthetist and scrub nurse with their workload, built from the schedule.", how: ["Assign people when scheduling a case.", "Use it to spot someone double-booked or overloaded."] },
  ] },
  { id: "preop", title: "Pre-Operative", intro: "Making sure the patient is ready and has agreed.", pages: [
    { name: "Pre-op Assessment", href: "/pre-op", what: "Surgeon or doctor's fitness assessment.", how: ["Choose the case, then fill ASA grade, airway, history, medicines, allergies and investigations.", "Pick a decision. Choosing Unfit asks you to confirm."], watch: "ASA I is a healthy patient; ASA V is not expected to survive without the operation." },
    { name: "Anaesthesia Review", href: "/anaesthesia", what: "The anaesthetist's own review: ASA, airway, planned technique and fasting.", how: ["Saved through the same pre-op record and tagged “Anaesthetic review”, so it appears in its own list."] },
    { name: "Consent Forms", href: "/consent", what: "Informed consent for the procedure.", how: ["Describe the procedure in plain language, tick that risks and alternatives were explained, and record consent given or declined.", "Add a witness name.", "Declined, or risks not explained, asks you to confirm."] },
    { name: "Surgical Safety Checklist", href: "/checklist", what: "The WHO checklist in three stages.", how: ["Open a case and tick each stage as the team completes it. Times are stamped automatically.", "Ticking sign-out asks you to confirm the counts were correct."], watch: "Never tick a stage in advance." },
  ] },
  { id: "intraop", title: "Intra-Operative", intro: "Everything recorded while the patient is on the table.", pages: [
    { name: "Operation Notes", href: "/operation-notes", what: "The surgeon's record: what was done, findings, technique, specimens, blood loss, complications and post-op orders.", how: ["Edit “Procedure performed” if the plan changed during surgery."] },
    { name: "Anaesthesia Record", href: "/anaesthesia-record", what: "The anaesthetic chart: type, drugs, airway, monitoring, fluids, start and end times and critical events.", how: ["One record per anaesthetic. Add another if a second anaesthetic is given."] },
    { name: "Instrument & Swab Count", href: "/counts", what: "Counts of swabs, instruments and needles before closing.", how: ["Enter initial and final counts. If they differ, the page shows a red warning and asks you to confirm.", "Mark the count incorrect to log a discrepancy."], watch: "A discrepancy must be resolved before the wound is closed." },
    { name: "Implants & Consumables", href: "/implants", what: "Items left in the patient, with manufacturer, lot and serial numbers.", how: ["Lot and serial numbers are what allow a recall to be traced to patients."] },
  ] },
  { id: "postop", title: "Post-Operative", intro: "After the operation.", pages: [
    { name: "Recovery Room (PACU)", href: "/recovery", what: "Patients waiting to move to recovery, patients in recovery now, and recent discharges.", how: ["Move patient to recovery opens the PACU record and sets the case to recovery.", "Discharge asks for the Aldrete score (9 or more is usually safe) and pain score.", "Below 9 asks you to confirm."] },
    { name: "Post-op Orders", href: "/post-op", what: "Instructions for the ward: observations, fluids, analgesia, antibiotics, diet, drains.", how: ["Saved on the case's operation note."] },
    { name: "Surgical Complications", href: "/complications", what: "A log of adverse events with severity (minor, moderate, major, death) and action taken.", how: ["Major or death asks you to confirm and reminds you to inform the medical director."] },
  ] },
  { id: "ops", title: "Theatre Operations", intro: "The machinery that keeps theatre running.", pages: [
    { name: "Sterilization (CSSD)", href: "/cssd", what: "Autoclave and sterilizer cycles with pass or fail results and the pass rate.", how: ["Start cycle, then open it later to record the result.", "A fail needs notes and asks you to confirm."], watch: "Never release a load until the result is Pass." },
    { name: "Theatre Inventory", href: "/inventory", what: "Implant usage, count discrepancies and sterile-processing status in one place.", how: ["Use the tabs to switch views."] },
    { name: "Surgical Reports", href: "/reports", what: "Cases, average operating time, on-time starts, cancellation rate, request conversion, complication rate, CSSD pass rate and room utilisation.", how: ["Pick a period and Print."] },
  ] },
];

const GLOSSARY: [string, string][] = [
  ["Theatre / OR", "The operating room where surgery happens."],
  ["PACU", "Post-anaesthesia care unit, also called recovery. Patients wake up here under close watch."],
  ["ASA grade", "A 1-to-6 score of how healthy the patient is before anaesthesia."],
  ["Aldrete score", "A 0-to-10 recovery score. 9 or more usually means ready to go to the ward."],
  ["Sign-in / Time-out / Sign-out", "The three WHO safety pauses: before anaesthesia, before the first cut, before leaving theatre."],
  ["Elective / Urgent / Emergency", "How soon surgery is needed: planned, within days, or immediately."],
  ["CSSD", "Central sterile services department: cleans and sterilizes instruments."],
  ["Autoclave", "A steam steriliser that uses heat and pressure."],
  ["Implant", "A device left in the body, such as a plate, screw or mesh."],
  ["Surgeon / Anaesthetist / Scrub nurse", "The three core team roles you assign when scheduling."],
  ["Retained item", "A swab or instrument accidentally left inside the patient. Counts prevent this."],
];

const SAFETY = [
  "Never start without valid consent, except documented life-saving emergencies.",
  "Complete the sign-in, time-out and sign-out aloud, as a team, every time.",
  "Count swabs, instruments and needles before closing. A mismatch means stop and search.",
  "Only use instruments from a load that passed sterilization.",
  "Do not send a patient to the ward until the Aldrete score is 9 or more, or a doctor agrees.",
  "Record implant lot and serial numbers so a recall can reach the patient.",
];

const FAQ: [string, string][] = [
  ["Why can't I find my case when recording something?", "Each form only lists cases that make sense for that step, and never cancelled ones. Open the case from the schedule and use its “Record for this case” buttons."],
  ["Where do I discharge a patient from recovery?", "Recovery Room, then pick the patient under In recovery now. If you only see cases without a Discharge button, the server needs the optional read endpoints (see below)."],
  ["Why do history lists say a patch is needed?", "The server can save pre-op, consent, notes, counts and implants but, as shipped, has no endpoints to list them. Add server/theater-read-endpoints.patch.md and the lists, safety readiness card and discharge list light up. Recording works without it."],
  ["How do I pick a date and time?", "Tap the date box to open the calendar and choose the day. Where a time is needed, set it in the small time box beside the calendar."],
  ["Why is there a Teams page without a teams table?", "The server has no separate team records. The page is built from the surgeon, anaesthetist and scrub nurse chosen on each case."],
  ["How do I fix a mistake?", "Clinical records are append-only for safety. Record a corrected entry and explain it in the notes rather than deleting."],
];

const DEV = [
  ["Routes", "Everything lives under /dashboard/theater. Lists link to /new pages and detail pages; a case hub at /schedule/[caseId] ties every record to its case."],
  ["Modals", "Only used for confirmations and warnings (unfit, declined consent, count discrepancy, failed sterilization…). Data entry is always a page."],
  ["State", "theaterSlice holds dashboard, rooms, requests, schedule, the active case, complications and CSSD. useTheater gives facilityId, state and act()."],
  ["Slice vs server", "The previous slice used URLs and payloads that did not exist on the server, so it was rewritten to match theater.routes.ts one-to-one."],
  ["Templates", "RecordIndex (a list of cases waiting plus saved records) and CaseFormPage (pick a case, fill a spec form) keep each page to a few lines. Both are in components/theater/th-ui.tsx."],
  ["Read endpoints", "Optional GET /records/:kind and an enriched GET /cases/:id are described in server/theater-read-endpoints.patch.md. Pages degrade gracefully without them."],
];

/* ───────────────────────── UI ───────────────────────── */

function Fold({ title, children, open = false }: { title: ReactNode; children: ReactNode; open?: boolean }) {
  const { ui } = useUI();
  const [o, setO] = useState(open);
  return (
    <div className="rounded-2xl" style={{ backgroundColor: ui.inner }}>
      <button type="button" onClick={() => setO((x) => !x)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left">
        <span className="text-sm font-semibold">{title}</span>
        <ChevronDown size={16} className={`shrink-0 opacity-50 transition-transform ${o ? "rotate-180" : ""}`} />
      </button>
      {o && <div className="space-y-3 px-4 pb-4 text-sm">{children}</div>}
    </div>
  );
}

function Flow({ steps }: { steps: Step[] }) {
  const { ui } = useUI();
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={s.title} className="flex gap-4 rounded-2xl p-4" style={{ backgroundColor: ui.inner }}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: PRIMARY_COLOR }}>{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{s.title}</p>
            <p className="mt-1 text-xs leading-relaxed opacity-70">{s.body}</p>
          </div>
          {s.href && <Link href={`${TBASE}${s.href}`} className="flex shrink-0 items-center gap-1 self-center text-xs font-semibold" style={{ color: PRIMARY_COLOR }}>Open <ChevronRight size={13} /></Link>}
        </li>
      ))}
    </ol>
  );
}


export default function TheatreGuidePage() {
  const { ui, softShadow } = useUI();
  const toc = [["flow", "The big picture"], ...GROUPS.map((g) => [g.id, g.title]), ["status", "Status colours"], ["glossary", "Glossary"], ["safety", "Safety rules"], ["faq", "Help & FAQ"], ["dev", "For developers"]];
  const LEGEND: [string, string][] = [["requested", "Waiting to be scheduled"], ["scheduled", "Booked"], ["pre-op", "Being prepared"], ["in-theatre", "Operation under way"], ["recovery", "In PACU"], ["completed", "Finished"], ["cancelled", "Called off"], ["elective", "Planned"], ["urgent", "Needed soon"], ["emergency", "Needed now"], ["fit", "Ready for surgery"], ["unfit", "Not ready"], ["pass", "Sterile"], ["fail", "Reprocess"], ["major", "Serious complication"]];

  return (
    <Page>
      <Header icon={<BookOpen size={22} />} title="Surgical Theatre Guide" subtitle="A beginner's walkthrough of every page" />
      <Banner tone="info" href={TBASE} cta="Go to dashboard"><span>New here? Read “The big picture” first, then open each section as you need it.</span></Banner>
      <nav className="flex gap-1.5 overflow-x-auto pb-1">
        {toc.map(([id, l]) => (<a key={id} href={`#${id}`} className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80" style={{ backgroundColor: ui.card, boxShadow: softShadow }}>{l}</a>))}
      </nav>

      <section id="flow" className="scroll-mt-24 space-y-4">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">The big picture</h2>
          <p className="text-sm leading-relaxed opacity-75">A surgical case follows a patient from <strong>request</strong> to <strong>recovery</strong>. Everything you record is attached to the case, so anyone can open the case page and see the whole story. The theatre also runs a sterile-processing department (<strong>CSSD</strong>) that makes sure instruments are safe.</p>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {["Request", "Schedule", "Pre-op", "Consent", "Theatre", "Recovery", "Ward"].map((x, i, a) => (
              <span key={x} className="flex items-center gap-2"><span className="rounded-full px-3 py-1.5" style={{ backgroundColor: i < 4 ? `${PRIMARY_COLOR}20` : ui.inner, color: i < 4 ? PRIMARY_COLOR : undefined }}>{x}</span>{i < a.length - 1 && <ChevronRight size={13} className="opacity-40" />}</span>
            ))}
          </div>
        </Card>
        <Card className="space-y-4"><h3 className="text-lg font-semibold tracking-tight">A patient's journey through theatre</h3><Flow steps={JOURNEY} /></Card>
        <Card className="space-y-4"><h3 className="text-lg font-semibold tracking-tight">Keeping instruments sterile</h3><Flow steps={CSSD} /></Card>
      </section>

      {GROUPS.map((g) => (
        <section key={g.id} id={g.id} className="scroll-mt-24">
          <Card className="space-y-4">
            <div><h2 className="text-xl font-semibold tracking-tight">{g.title}</h2><p className="mt-1 text-sm opacity-60">{g.intro}</p></div>
            <div className="space-y-3">
              {g.pages.map((p, i) => (
                <Fold key={p.name} title={p.name} open={g.id === "overview" && i === 0}>
                  <p className="opacity-80">{p.what}</p>
                  <ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed opacity-80">{p.how.map((h) => <li key={h}>{h}</li>)}</ul>
                  {p.watch && <div className="rounded-xl p-3 text-xs leading-relaxed" style={{ backgroundColor: "#f59e0b1f" }}><strong>Watch out: </strong>{p.watch}</div>}
                  <Link href={`${TBASE}${p.href}`} className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: PRIMARY_COLOR }}>Open this page <ChevronRight size={13} /></Link>
                </Fold>
              ))}
            </div>
          </Card>
        </section>
      ))}

      <section id="status" className="scroll-mt-24"><Card className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Status colours</h2>
        <p className="text-sm opacity-60">Green is good, amber needs attention, red is a problem or danger, blue is in progress, grey is neutral.</p>
        <div className="grid gap-2.5 sm:grid-cols-2">{LEGEND.map(([s, d]) => (<div key={s} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5" style={{ backgroundColor: ui.inner }}><Pill value={s} /><span className="text-xs opacity-70">{d}</span></div>))}</div>
      </Card></section>

      <section id="glossary" className="scroll-mt-24"><Card className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Glossary</h2>
        <dl className="grid gap-3 sm:grid-cols-2">{GLOSSARY.map(([t, d]) => (<div key={t} className="rounded-2xl p-4" style={{ backgroundColor: ui.inner }}><dt className="text-sm font-semibold">{t}</dt><dd className="mt-1 text-xs leading-relaxed opacity-70">{d}</dd></div>))}</dl>
      </Card></section>

      <section id="safety" className="scroll-mt-24"><Card className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Golden safety rules</h2>
        <ul className="space-y-2">{SAFETY.map((s) => (<li key={s} className="flex gap-3 rounded-2xl p-4 text-sm" style={{ backgroundColor: ui.inner }}><span className="font-bold" style={{ color: PRIMARY_COLOR }}>✓</span>{s}</li>))}</ul>
      </Card></section>

      <section id="faq" className="scroll-mt-24"><Card className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Help & FAQ</h2>
        <div className="space-y-3">{FAQ.map(([q, a]) => <Fold key={q} title={q}><p className="text-xs leading-relaxed opacity-80">{a}</p></Fold>)}</div>
      </Card></section>

      <section id="dev" className="scroll-mt-24"><Card className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">For developers</h2>
        <p className="text-sm opacity-60">How these pages are put together, so you can extend them.</p>
        <dl className="space-y-3">{DEV.map(([t, d]) => (<div key={t} className="rounded-2xl p-4" style={{ backgroundColor: ui.inner }}><dt className="text-sm font-semibold">{t}</dt><dd className="mt-1 text-xs leading-relaxed opacity-70">{d}</dd></div>))}</dl>
      </Card></section>
    </Page>
  );
}
