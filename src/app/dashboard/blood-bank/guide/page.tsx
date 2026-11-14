"use client";

import { ReactNode, useState } from "react";
import Link from "@/components/access/guarded-link";
import { BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import { BASE, Banner, Card, Header, Page, Pill, useUI } from "@/components/blood-bank/bb-ui";

/* ───────────────────────── content ───────────────────────── */

type Step = { title: string; body: string; href?: string };

const SUPPLY: Step[] = [
  { title: "Register the donor", body: "Add the person to the Donor Registry with their details and consent. Without consent the system will not save them.", href: "/donors/new" },
  { title: "Screen the donor", body: "Check weight, haemoglobin, blood pressure, pulse, temperature and ask the risk questions. The system decides: eligible or deferred (and for how long).", href: "/screening/new" },
  { title: "Record the donation", body: "Only an eligible, unused screening can donate. Recording it creates the first blood unit automatically, in Quarantine.", href: "/donations/new" },
  { title: "Group the blood (ABO / Rh)", body: "A lab person records the group, then a DIFFERENT person confirms it. Two sets of eyes.", href: "/grouping" },
  { title: "Test for infections (TTI)", body: "HIV, Hepatitis B, Hepatitis C and Syphilis (plus any others you require). All must be non-reactive. One reactive result discards the units.", href: "/testing" },
  { title: "Release to stock", body: "When grouping is confirmed AND tests are cleared, the unit becomes Available. If you ever need to nudge it, use Release on the unit page.", href: "/inventory" },
  { title: "Process into components (optional)", body: "Whole blood can become red cells, plasma and platelets. The original bag is used up.", href: "/components" },
  { title: "Store it correctly", body: "Put each unit in the right fridge, freezer or platelet agitator and log temperatures regularly.", href: "/storage" },
];

const DEMAND: Step[] = [
  { title: "A clinician requests blood", body: "Pick the patient, products and number of units, urgency, and the reason for transfusion.", href: "/requests/new" },
  { title: "Receive the patient's sample", body: "When the tube reaches the lab, mark the sample received on the request.", href: "/requests" },
  { title: "Group the patient", body: "Type the patient's blood and have a second person confirm it. No confirmed group means no crossmatch.", href: "/grouping" },
  { title: "Crossmatch", body: "Pick compatible units (the request page suggests them) and record the compatibility test. A good match reserves the unit for that patient.", href: "/crossmatch" },
  { title: "Issue the unit", body: "Hand the crossmatched unit to the ward. Record who collected it and the cooler box temperature.", href: "/issue" },
  { title: "Transfuse at the bedside", body: "Two people do the safety checks, take baseline vitals, then start. Record observations during the transfusion.", href: "/transfusions" },
  { title: "Complete, or report a reaction", body: "Finish the transfusion with post vitals. If the patient reacts, stop and report it so it can be investigated.", href: "/reactions" },
];

type Page_ = { name: string; href: string; what: string; how: string[]; watch?: string };
type Group = { id: string; title: string; intro: string; pages: Page_[] };

const GROUPS: Group[] = [
  {
    id: "overview", title: "Dashboard", intro: "Your morning view. Everything urgent in one place.",
    pages: [{
      name: "Blood Bank Dashboard", href: "", what: "Shows live counts (stock, requests, transfusions, expiries), red-cell stock per blood group, upcoming drives, and warning banners.",
      how: ["Red banners need action now: emergency requests, fridge alarms, expired units.", "Click any tile to jump to the page behind that number.", "The red blood-group boxes mean stock is below your minimum.", "It refreshes itself every 30 seconds."],
    }],
  },
  {
    id: "donors", title: "Donors & Collection", intro: "Everything that happens before blood enters the bank.",
    pages: [
      { name: "Donor Registry", href: "/donors", what: "A searchable list of all donors with their blood group, type, status and whether they can donate today.", how: ["Search by name, donor number, phone or national ID.", "Filter by status, blood group or donor type.", "Click a donor to open their own page.", "Register donor adds a new one (separate page). Edit is also its own page."], watch: "Donor types: voluntary, family replacement (giving for a relative), autologous (for themselves) and directed." },
      { name: "Donor Screening", href: "/screening", what: "The pre-donation health check. The system applies your rules and decides eligible, deferred for a time, or deferred permanently.", how: ["New screening: choose the donor, enter vitals, tick any risk factors.", "While you type, a yellow card previews why the donor would be deferred.", "After saving, a deferred donor sees every reason and the date they can return.", "Filter 'Ready to donate' to see passed screenings that have not donated yet."], watch: "A screening can only be used for ONE donation, and it expires after the validity hours in Setup." },
      { name: "Donations & Collection", href: "/donations", what: "Every collection. Each donation shows its grouping, TTI status and the units it produced.", how: ["Record donation: pick a ready screening, type of donation, bag, volume.", "If the donor felt unwell, record the adverse reaction.", "The donation page has shortcuts to Record grouping and Record TTI.", "Edit notes lets you fix the arm used, notes and donor reaction later."], watch: "An 'incomplete' collection is not released to stock." },
      { name: "Blood Drives", href: "/drives", what: "Plan outreach collections away from the hospital and track progress against a target.", how: ["Schedule drive with place, time, target units and team.", "Open a drive to Start, Complete or Cancel it (each asks you to confirm).", "Choose the drive when screening so donors count towards it."] },
    ],
  },
  {
    id: "testing", title: "Testing & Processing", intro: "Making sure blood is identified and safe before anyone can use it.",
    pages: [
      { name: "Grouping & Typing", href: "/grouping", what: "Two queues: donated blood waiting to be typed, and patient samples waiting to be typed.", how: ["Open an item and record the ABO/Rh group, method and antibody screen.", "A second person opens the same item and presses Confirm. You cannot confirm your own result.", "If your result differs from what is on record, repeat the test first. Only if it stands, tick 'acknowledge discrepancy' and explain (10+ characters)."], watch: "Never skip the second check. It is the single most important safety step in the bank." },
      { name: "TTI Testing", href: "/testing", what: "Transfusion-transmissible infection screening for each donation.", how: ["Open a donation and choose a result for each test (non-reactive, reactive, indeterminate).", "You can save a few tests now and the rest later; the status stays pending.", "All required tests non-reactive means Cleared and the units can be released."], watch: "A REACTIVE result locks the donation, discards its units and puts the donor on hold. The page warns you first." },
      { name: "Component Processing", href: "/components", what: "Splits whole blood into red cells, plasma and platelets, or plasma into cryoprecipitate and cryo-poor plasma.", how: ["'Ready to process' lists eligible parent units.", "Pick up to three outputs and optionally the volume of each.", "Confirm: the parent bag is consumed and cannot be restored."] },
    ],
  },
  {
    id: "stock", title: "Stock & Storage", intro: "Knowing what you have, where it is, and that it is still safe.",
    pages: [
      { name: "Blood Inventory", href: "/inventory", what: "A stock matrix (product by blood group) and a list of every unit.", how: ["Click a cell in the matrix to filter the list below.", "Open a unit to see its full history and trace: donation, crossmatches, issues, transfusion or discard.", "From a unit you can Assign storage, Release from quarantine, or Discard (its own page, with a warning)."], watch: "Yellow cells contain units expiring soon." },
      { name: "Storage & Cold Chain", href: "/storage", what: "Fridges, freezers and platelet agitators with their latest temperature and how full they are.", how: ["Add storage unit fills in the normal temperature range for its type.", "Open one to see the trend chart and every reading.", "Log temperature is its own page. An out-of-range value raises an alarm and asks you to confirm.", "Quarantine contents puts every unit inside on hold (for example after a power failure)."], watch: "'Reading due' means nobody logged a temperature in the last 12 hours." },
      { name: "Expiry & Discards", href: "/expiry", what: "What has expired, what expires soon, and the log of everything thrown away.", how: ["Tabs: Expired, Expiring soon (choose 3/7/14/30 days), Discard log.", "Discard all expired is a bulk action on its own page with a confirmation."] },
    ],
  },
  {
    id: "transfusion", title: "Transfusion Service", intro: "Getting the right blood to the right patient, safely.",
    pages: [
      { name: "Blood Requests", href: "/requests", what: "Every request from the wards, with progress bars for crossmatched, issued and transfused units.", how: ["Open a request to see 'Next steps' and suggested compatible units.", "Receive sample, Cancel and Close ask for confirmation.", "Reject and Add note each open their own page.", "Emergency requests are red and appear on the dashboard."] },
      { name: "Crossmatching", href: "/crossmatch", what: "Compatibility tests between a patient and a unit.", how: ["New crossmatch: choose the request, then a suggested unit, the method and the result.", "Only requests with a confirmed patient group appear.", "A compatible result reserves the unit for that patient for a limited time.", "Void crossmatch (own page) releases the unit back to stock."] },
      { name: "Issue & Dispatch", href: "/issue", what: "Handing a unit to the ward.", how: ["Normal issue: pick the request, then one of its crossmatched units.", "Emergency release: turn on the toggle, pick any available unit, give a reason and who authorised it. A retrospective crossmatch is then REQUIRED and tracked.", "If the unit is not used, Return unit. Out of the cooler too long means it will be discarded."], watch: "Pill 'Retro XM due' means an emergency issue still needs its crossmatch result." },
      { name: "Transfusions", href: "/transfusions", what: "The bedside record from start to finish.", how: ["Start transfusion: pick the issued unit, tick all four bedside checks, choose a second checker, enter baseline vitals.", "Record observations as often as your protocol says.", "Complete with post-vitals, or Stop with a reason.", "If it runs longer than the maximum time in Setup, the page turns red."] },
      { name: "Transfusion Reactions", href: "/reactions", what: "Reports and investigations of adverse events.", how: ["Report reaction from the transfusion page or here: type, severity, symptoms, vitals, actions taken.", "Update & investigate records Coombs, cultures, repeat grouping and the outcome.", "Close it only when the investigation is complete."], watch: "Severe or life-threatening reports ask you to confirm the transfusion was stopped." },
    ],
  },
  {
    id: "reports", title: "Reports & Setup", intro: "Management numbers and the rules the whole module follows.",
    pages: [
      { name: "Blood Bank Reports", href: "/reports", what: "Collections, deferral rate, infection rates, wastage, demand, turnaround, usage and reactions for a chosen period.", how: ["Pick 7 days, 30 days, 90 days or 12 months.", "Print to share it."] },
      { name: "Blood Bank Setup", href: "/setup", what: "Blood bank profile and every rule: donor age and weight limits, haemoglobin minimums, intervals, expiry alerts, minimum stock, crossmatch validity, transfusion time, shelf lives, required TTI tests and dual verification.", how: ["Change a value and Save. It applies immediately."], watch: "Set this up first. Screening, alerts and stock warnings all read from it." },
    ],
  },
];

const GLOSSARY: [string, string][] = [
  ["ABO / Rh group", "A person's blood type: A, B, AB or O, plus Rh positive (+) or negative (-). Giving the wrong type can kill."],
  ["Unit", "One bag of blood or one blood product. Each has a unique number such as BU-000001."],
  ["Component", "A product made from whole blood: packed red cells (PRC), fresh frozen plasma (FFP), platelets, cryoprecipitate."],
  ["TTI", "Transfusion-transmissible infections: HIV, hepatitis B and C, syphilis, malaria."],
  ["Reactive / Non-reactive", "A reactive test means the infection marker was found. Non-reactive is the safe result."],
  ["Quarantine", "A holding status: the unit exists but cannot be used until grouping is confirmed and tests are clear."],
  ["Deferral", "A donor cannot donate for now (temporary) or ever (permanent), for their safety or the patient's."],
  ["Crossmatch", "A lab test mixing the patient's blood with the donor unit to prove they are compatible."],
  ["Reserved", "A unit set aside for one patient after a compatible crossmatch. The hold expires if unused."],
  ["Retrospective crossmatch", "The crossmatch done AFTER an emergency release, when there was no time before."],
  ["Cold chain", "Keeping blood in its safe temperature range all the way from storage to the bedside."],
  ["Haemovigilance", "Tracking and reporting transfusion reactions so they can be learned from."],
  ["Look-back", "When a donor later tests reactive, every patient who received their blood must be traced."],
];

const SAFETY = [
  "Two different people for every grouping: one records, another confirms.",
  "Never transfuse a unit that is not crossmatched, unless it is a documented emergency release.",
  "Always read the bedside checks aloud: name, wristband, unit label, compatibility label.",
  "Log temperatures on schedule, and act immediately on any alarm.",
  "Stop the transfusion first, then investigate, whenever a patient reacts.",
  "Discard anything out of range, expired, leaking, reactive or out of the cooler too long.",
];

const FAQ: [string, string][] = [
  ["Why can't I screen this donor?", "They are probably deferred or inside the donation interval. The donor page's Eligibility card lists the reasons and the next eligible date."],
  ["Why can't I record a donation?", "It needs a passed screening that has not been used. Screening results also expire after the validity hours set in Setup."],
  ["Why is a unit still in Quarantine?", "Both must be true: grouping confirmed by a second person, and all required TTI tests non-reactive. Check the donation page."],
  ["Why can't I crossmatch a request?", "The patient's group is not confirmed yet. Receive the sample, then record and confirm the group under Grouping & Typing."],
  ["Why can't I confirm my own grouping?", "On purpose. A different person must confirm it."],
  ["The unit I wanted is missing from suggestions", "It may be expired, reserved for someone else, on QC hold, quarantined, or not compatible with that patient's group."],
  ["How do I fix a mistake?", "Most records are intentionally permanent for traceability. Use Void (crossmatch), Return (issue) or Discard (unit) rather than editing history, and add a note."],
];

const DEV = [
  ["Routes", "Everything is under /dashboard/blood-bank. Each section follows list → /new → /[id] → /[id]/edit, plus small action pages like /void, /return, /stop."],
  ["Modals", "Used for confirmations and warnings only (ConfirmModal). Creating, editing and viewing details are always pages."],
  ["State", "bloodBankSlice holds lists and the 'active' record. The useBloodBank hook gives facilityId, state and act(), which runs a thunk and toasts success or error."],
  ["Shared kit", "components/blood-bank/bb-ui.tsx has the ward-style building blocks (Page, Header, Card, Stat, Pill, RowLink…), enums that mirror the server, and the SpecForm used by every form."],
  ["Forms", "A form is just a list of field specs. Pass sections, submit handler and optional confirm spec; SpecForm renders fields, placeholders, validation and the warning dialog."],
  ["Server rules", "Validation lives in blood-bank.routes.ts (Zod) and rules in blood-bank.service.ts. The UI mirrors these but the server always has the final say."],
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
          {s.href && <Link href={`${BASE}${s.href}`} className="flex shrink-0 items-center gap-1 self-center text-xs font-semibold" style={{ color: PRIMARY_COLOR }}>Open <ChevronRight size={13} /></Link>}
        </li>
      ))}
    </ol>
  );
}

const STATUS_LEGEND: [string, string][] = [
  ["quarantine", "Waiting for grouping or TTI clearance"], ["available", "Safe and ready to crossmatch"], ["reserved", "Held for one patient"],
  ["issued", "Handed to a ward"], ["transfused", "Given to the patient"], ["processed", "Turned into components"], ["discarded", "Thrown away and logged"],
  ["pending", "Not started or waiting"], ["recorded", "Entered, waiting for second check"], ["confirmed", "Verified by a second person"],
  ["cleared", "All infection tests safe"], ["reactive", "Infection marker found"], ["compatible", "Crossmatch passed"], ["incompatible", "Crossmatch failed"],
  ["emergency", "Life-threatening urgency"], ["deferred_temporary", "Cannot donate for now"], ["deferred_permanent", "Can never donate"], ["in_progress", "Happening right now"],
];

export default function BloodBankGuidePage() {
  const { ui, softShadow } = useUI();
  const toc = [["flow", "The big picture"], ...GROUPS.map((g) => [g.id, g.title]), ["status", "Status colours"], ["glossary", "Glossary"], ["safety", "Safety rules"], ["faq", "Help & FAQ"], ["dev", "For developers"]];

  return (
    <Page>
      <Header icon={<BookOpen size={22} />} title="Blood Bank Guide" subtitle="A beginner's walkthrough of every page" />

      <Banner tone="info" href={BASE} cta="Go to dashboard">
        <span>New here? Read “The big picture” first, then open each section as you need it.</span>
      </Banner>

      <nav className="flex gap-1.5 overflow-x-auto pb-1">
        {toc.map(([id, l]) => (
          <a key={id} href={`#${id}`} className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80" style={{ backgroundColor: ui.card, boxShadow: softShadow }}>{l}</a>
        ))}
      </nav>

      <section id="flow" className="scroll-mt-24 space-y-4">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">The big picture</h2>
          <p className="text-sm leading-relaxed opacity-75">
            A blood bank has two sides. The <strong>supply side</strong> collects blood from donors and makes it safe. The <strong>demand side</strong> gives that blood to patients who need it.
            Every bag of blood (a “unit”) carries a number so it can be traced from the donor all the way to the patient, or to the bin.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {["Donor", "Screening", "Donation", "Grouping + TTI", "Stock", "Request", "Crossmatch", "Issue", "Transfusion"].map((x, i, a) => (
              <span key={x} className="flex items-center gap-2"><span className="rounded-full px-3 py-1.5" style={{ backgroundColor: i < 5 ? `${PRIMARY_COLOR}20` : ui.inner, color: i < 5 ? PRIMARY_COLOR : undefined }}>{x}</span>{i < a.length - 1 && <ChevronRight size={13} className="opacity-40" />}</span>
            ))}
          </div>
        </Card>
        <Card className="space-y-4"><h3 className="text-lg font-semibold tracking-tight">Supply: from donor to shelf</h3><Flow steps={SUPPLY} /></Card>
        <Card className="space-y-4"><h3 className="text-lg font-semibold tracking-tight">Demand: from request to bedside</h3><Flow steps={DEMAND} /></Card>
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
                  <Link href={`${BASE}${p.href}`} className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: PRIMARY_COLOR }}>Open this page <ChevronRight size={13} /></Link>
                </Fold>
              ))}
            </div>
          </Card>
        </section>
      ))}

      <section id="status" className="scroll-mt-24">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Status colours</h2>
          <p className="text-sm opacity-60">Green is good, amber needs attention, red is a problem or danger, blue is in progress, grey is neutral.</p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {STATUS_LEGEND.map(([s, d]) => (
              <div key={s} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5" style={{ backgroundColor: ui.inner }}><Pill value={s} /><span className="text-xs opacity-70">{d}</span></div>
            ))}
          </div>
        </Card>
      </section>

      <section id="glossary" className="scroll-mt-24">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Glossary</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            {GLOSSARY.map(([t, d]) => (
              <div key={t} className="rounded-2xl p-4" style={{ backgroundColor: ui.inner }}><dt className="text-sm font-semibold">{t}</dt><dd className="mt-1 text-xs leading-relaxed opacity-70">{d}</dd></div>
            ))}
          </dl>
        </Card>
      </section>

      <section id="safety" className="scroll-mt-24">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Golden safety rules</h2>
          <ul className="space-y-2">
            {SAFETY.map((s) => (<li key={s} className="flex gap-3 rounded-2xl p-4 text-sm" style={{ backgroundColor: ui.inner }}><span className="font-bold" style={{ color: PRIMARY_COLOR }}>✓</span>{s}</li>))}
          </ul>
        </Card>
      </section>

      <section id="faq" className="scroll-mt-24">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Help & FAQ</h2>
          <div className="space-y-3">{FAQ.map(([q, a]) => <Fold key={q} title={q}><p className="text-xs leading-relaxed opacity-80">{a}</p></Fold>)}</div>
        </Card>
      </section>

      <section id="dev" className="scroll-mt-24">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">For developers</h2>
          <p className="text-sm opacity-60">How these pages are put together, so you can extend them.</p>
          <dl className="space-y-3">
            {DEV.map(([t, d]) => (<div key={t} className="rounded-2xl p-4" style={{ backgroundColor: ui.inner }}><dt className="text-sm font-semibold">{t}</dt><dd className="mt-1 text-xs leading-relaxed opacity-70">{d}</dd></div>))}
          </dl>
        </Card>
      </section>
    </Page>
  );
}
