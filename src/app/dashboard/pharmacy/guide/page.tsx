"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  Boxes,
  CheckCircle2,
  ClipboardList,
  PackageCheck,
  Settings,
  Truck,
  XCircle,
} from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";
import {
  Alert,
  Chips,
  GhostButton,
  PharmacyPage,
  PrimaryButton,
  SectionCard,
  usePharmacyUI,
} from "@/components/dashboard/pharmacy/PharmacyUI";

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                     */
/* -------------------------------------------------------------------------- */

type Step = { title: string; body: ReactNode };
type Rule = { ok: boolean; text: ReactNode };
type Link_ = { href: string; label: string };

function Steps({ items }: { items: Step[] }) {
  const { ui } = usePharmacyUI();
  return (
    <ol className="space-y-3">
      {items.map((s, i) => (
        <li key={s.title} className="flex gap-4 rounded-2xl p-4" style={{ backgroundColor: ui.inner }}>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            {i + 1}
          </span>
          <div>
            <p className="text-sm font-semibold">{s.title}</p>
            <p className="text-xs opacity-70 mt-1 leading-relaxed">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Rules({ items }: { items: Rule[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((r, i) => (
        <li key={i} className="flex items-start gap-3 text-xs leading-relaxed">
          {r.ok ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
          ) : (
            <XCircle size={16} className="mt-0.5 shrink-0 text-rose-500" />
          )}
          <span className="opacity-80">{r.text}</span>
        </li>
      ))}
    </ul>
  );
}

function Fields({ rows }: { rows: Array<[string, ReactNode]> }) {
  const { ui } = usePharmacyUI();
  return (
    <dl className="divide-y" style={{ borderColor: ui.border }}>
      {rows.map(([name, text]) => (
        <div
          key={name}
          className="grid grid-cols-[130px_1fr] gap-4 py-3 text-xs first:pt-0 last:pb-0"
          style={{ borderColor: ui.border }}
        >
          <dt className="font-semibold">{name}</dt>
          <dd className="opacity-70 leading-relaxed">{text}</dd>
        </div>
      ))}
    </dl>
  );
}

function Para({ children }: { children: ReactNode }) {
  return <p className="text-xs opacity-70 leading-relaxed">{children}</p>;
}

function Jump({ links }: { links: Link_[] }) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {links.map((l) => (
        <GhostButton key={l.href} href={l.href}>
          {l.label}
        </GhostButton>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Content                                                                   */
/* -------------------------------------------------------------------------- */

const TABS = [
  { id: "start", label: "Start here" },
  { id: "setup", label: "1 · Setup" },
  { id: "catalog", label: "2 · Catalog & suppliers" },
  { id: "stock", label: "3 · Ordering & stock" },
  { id: "rx", label: "4 · Prescriptions" },
  { id: "dispense", label: "5 · Dispensing" },
  { id: "safety", label: "Safety & compliance" },
  { id: "control", label: "Stock control" },
  { id: "faq", label: "Troubleshooting" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function Start() {
  const { ui } = usePharmacyUI();
  const flow = [
    ["Setup", "Name, currency, rules"],
    ["Catalog", "Add your drugs"],
    ["Suppliers", "Who you buy from"],
    ["Receive stock", "Creates batches"],
    ["Prescription", "From a consultation or manual"],
    ["Verify", "Pharmacist checks & links"],
    ["Dispense", "FEFO + allergy check"],
    ["Counsel", "Record advice given"],
  ];
  return (
    <>
      <SectionCard
        title="How the pharmacy works, end to end"
        subtitle="Every module feeds the next one. Follow the order below the first time and nothing will be missing later."
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {flow.map(([t, d], i) => (
            <div key={t} className="rounded-2xl p-3 flex items-start gap-3" style={{ backgroundColor: ui.inner }}>
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                {i + 1}
              </span>
              <div>
                <p className="text-xs font-semibold">{t}</p>
                <p className="text-[11px] opacity-60">{d}</p>
              </div>
            </div>
          ))}
        </div>
        <Para>
          Stock only ever lives in <strong>batches</strong> (a batch number plus an expiry date). Receiving a delivery
          creates batches, dispensing takes from them, and adjustments correct them. That single rule is what makes
          expiry tracking, first-expiry-first-out and the stock reports accurate.
        </Para>
      </SectionCard>

      <SectionCard title="Set up a brand-new pharmacy in 15 minutes" subtitle="The shortest path from empty to dispensing.">
        <Steps
          items={[
            {
              title: "Choose your selling currency",
              body: (
                <>
                  Open <strong>Setup</strong> and pick the currency your prices are in (NGN, USD, EUR, GHS, KES, ZAR and
                  many more). It applies to every screen, so do it before you enter prices.
                </>
              ),
            },
            {
              title: "Add your drugs",
              body: "Add each medicine you sell in the Drug Catalog with its strength, form, selling price and reorder level.",
            },
            {
              title: "Create a supplier",
              body: "Add at least one supplier. For medicines already on your shelf, create one called “Opening Stock”.",
            },
            {
              title: "Receive your stock",
              body: "Use Goods Received → Receive Stock and enter the real batch number and expiry from each pack.",
            },
            {
              title: "Write or import a prescription",
              body: "Start from a patient's consultation (fastest) or write one manually, then verify it.",
            },
            {
              title: "Dispense",
              body: "Open Dispensing & Refills, pick the verified prescription, confirm quantities and hand over.",
            },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <PrimaryButton href="/dashboard/pharmacy/setup" icon={Settings}>
            Open Setup
          </PrimaryButton>
          <GhostButton href="/dashboard/pharmacy/catalog/new">Add a drug</GhostButton>
          <GhostButton href="/dashboard/pharmacy/receiving/new">Receive stock</GhostButton>
        </div>
      </SectionCard>

      <SectionCard title="Who can do what">
        <Fields
          rows={[
            ["Pharmacist / Admin / Manager / CEO", "Everything: setup, catalog, stock, verify, dispense, adjustments."],
            ["Doctor / Nurse / Consultant", "Write and cancel prescriptions, including from a consultation. They cannot verify or dispense."],
            ["Audit", "Read-only access to reports and the Controlled Substances Log."],
          ]}
        />
        <Alert tone="info">
          If a button is missing or an action is refused with a permission message, ask a facility admin to check your
          role under Workspace.
        </Alert>
      </SectionCard>
    </>
  );
}

function Setup() {
  return (
    <>
      <SectionCard title="Pharmacy Setup" subtitle="One screen, one-time, but revisit it whenever your rules change.">
        <Fields
          rows={[
            ["Pharmacy name", "Shown on dispensing records. Required."],
            ["Licence number", "Your pharmacy registration number, kept for audits."],
            ["Selling currency", "ISO currency code for all prices (NGN, USD, EUR, GHS, KES, ZAR, XOF…). Search by code or name."],
            ["Expiry alert window", "Batches expiring inside this many days are flagged on Batches & Expiry and the dashboard. 90 is a sensible start."],
            ["Default reorder level", "Suggested quantity at which a drug counts as low stock when you add it to the catalog."],
            ["Require counselling", "When on, dispenses without a counselling record are listed on the Counselling page until someone records it."],
            ["Allow expired dispensing", "Leave off. When off, expired batches are never allocated to a patient."],
          ]}
        />
        <Alert tone="warning">
          Changing the currency changes how amounts are <strong>labelled</strong>. It does not convert prices already
          saved. If you move from NGN to USD, update your drug prices too.
        </Alert>
        <Jump links={[{ href: "/dashboard/pharmacy/setup", label: "Open Setup" }]} />
      </SectionCard>
    </>
  );
}

function Catalog() {
  return (
    <>
      <SectionCard title="The Drug Catalog" subtitle="Everything you can prescribe, stock or sell must exist here first.">
        <Fields
          rows={[
            ["Code", "Your own unique code, e.g. AMX-500. Used for search and barcodes."],
            ["Generic name", "The active ingredient (Amoxicillin). Prescription items are matched on this, so spell it normally."],
            ["Brand name", "Optional, e.g. Amoxil. Also used for matching."],
            ["Strength / form", "500 mg, tablet, syrup… Strength is used to pick the right pack when a prescription says “500mg”."],
            ["Unit", "What “1 quantity” means: tablet, bottle, vial, tube. Stock and prices are per unit."],
            ["Selling price", "Price per unit in your selling currency."],
            ["Cost price", "What you pay. Updated automatically when you receive stock with a unit cost."],
            ["Reorder level", "At or below this the drug appears on Low Stock."],
            ["Requires prescription", "Flags prescription-only medicines."],
            ["Controlled + schedule", "Turns on the witness requirement and the Controlled Substances Log for that drug."],
          ]}
        />
        <Rules
          items={[
            { ok: true, text: "Deactivate a drug instead of deleting it: history stays intact and it disappears from new prescriptions." },
            { ok: false, text: "Don't create the same drug twice with different spellings. Allergy checks and matching work on the names." },
          ]}
        />
        <Jump links={[{ href: "/dashboard/pharmacy/catalog", label: "Open catalog" }, { href: "/dashboard/pharmacy/catalog/new", label: "Add a drug" }]} />
      </SectionCard>

      <SectionCard title="Suppliers">
        <Para>
          Every delivery and purchase order belongs to a supplier. Record the contact person, phone, email and payment
          terms so reordering is one click. For stock that was already on your shelf, create a supplier called{" "}
          <strong>Opening Stock</strong>.
        </Para>
        <Jump links={[{ href: "/dashboard/pharmacy/suppliers", label: "Open suppliers" }]} />
      </SectionCard>
    </>
  );
}

const PREREQUISITES = [
  { title: "Add the drug to the catalog", body: "The drug must exist before you can receive stock for it.", href: "/dashboard/pharmacy/catalog/new", action: "Add a drug" },
  { title: "Add a supplier", body: "Every delivery is recorded against a supplier. For stock already on your shelf, create one called “Opening Stock”.", href: "/dashboard/pharmacy/suppliers", action: "Open suppliers" },
];

function Stock() {
  const { ui } = usePharmacyUI();
  return (
    <>
      <SectionCard title="Purchase orders (optional but recommended)" subtitle="Order from a supplier and track what is still owed.">
        <Steps
          items={[
            { title: "Create the order", body: "Pharmacy → Purchase Orders → New. Choose the supplier, add drugs and quantities, and an expected delivery date." },
            { title: "Place it", body: "Save as draft while you are still deciding, or place it right away. Only placed orders can be received against." },
            { title: "Receive against it", body: "When the delivery arrives, link the order in Receive Stock. Quantities owed fill in for you." },
            { title: "Status updates itself", body: "The order moves to partially received or received. Cancel an order you no longer expect." },
          ]}
        />
        <Jump links={[{ href: "/dashboard/pharmacy/purchase-orders/new", label: "New purchase order" }, { href: "/dashboard/pharmacy/low-stock", label: "See what needs reordering" }]} />
      </SectionCard>

      <SectionCard title="Receiving stock: how batches are created" subtitle="You need both of these in place first.">
        <div className="grid gap-3 sm:grid-cols-2">
          {PREREQUISITES.map((p) => (
            <div key={p.title} className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: ui.inner }}>
              <div>
                <p className="text-sm font-semibold">{p.title}</p>
                <p className="text-xs opacity-60 mt-1 leading-relaxed">{p.body}</p>
              </div>
              <GhostButton href={p.href}>{p.action}</GhostButton>
            </div>
          ))}
        </div>
        <Steps
          items={[
            { title: "Open Receive Stock", body: <>Go to <strong>Pharmacy → Goods Received → Receive Stock</strong>. You can also start from a drug in Drug Inventory & Stock, which opens the form with that drug already chosen.</> },
            { title: "Choose the supplier", body: "Add the invoice or delivery note number if you have it so the delivery can be traced later." },
            { title: "Link a purchase order (optional)", body: "The supplier and quantities still owed fill in, and the order updates when you confirm." },
            { title: "Enter each batch", body: "For every item: the drug, the batch number printed on the pack, the expiry date, the quantity and, if known, the unit cost. Use Add line for more items or several batches of one drug." },
            { title: "Confirm receipt", body: "Each line becomes a batch, immediately available to dispense, and appears in Inventory, Batches & Expiry and Goods Received." },
          ]}
        />
        <Fields
          rows={[
            ["Drug", "Required. Choose from your catalog."],
            ["Batch no.", "Required. Copy it exactly from the pack. Saved in capitals."],
            ["Expiry date", "Required. Must be in the future."],
            ["Quantity", "Required. Whole units in the drug's dispensing unit."],
            ["Unit cost", "Optional. Updates the cost price and stock-value reports."],
          ]}
        />
        <Rules
          items={[
            { ok: false, text: "A batch that has already expired cannot be received." },
            { ok: true, text: "Entering the same batch number and expiry date again adds to that batch instead of creating a duplicate." },
            { ok: false, text: "The same batch number with a different expiry date is rejected: it is almost always a typing mistake." },
            { ok: true, text: "Receiving a controlled drug also writes an entry to the Controlled Substances Log." },
          ]}
        />
        <Alert tone="info">
          Count each batch separately. Two boxes of the same drug with different batch numbers are two lines. That is what
          makes expiry tracking and first-expiry-first-out accurate.
        </Alert>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton href="/dashboard/pharmacy/receiving/new" icon={Truck}>Receive Stock</PrimaryButton>
          <GhostButton href="/dashboard/pharmacy/inventory" icon={Boxes}>View inventory</GhostButton>
        </div>
      </SectionCard>

      <SectionCard title="Loading opening stock">
        <Para>
          Create a supplier named “Opening Stock” and receive each medicine the normal way, using the real batch numbers and
          expiry dates. Returns & Adjustments can’t be used for this, because an adjustment only changes a batch that
          already exists.
        </Para>
      </SectionCard>
    </>
  );
}

function Rx() {
  return (
    <>
      <SectionCard
        title="Creating a prescription from a patient's consultation"
        subtitle="The fastest and safest route: the diagnosis and drugs the doctor recommended carry over."
      >
        <Steps
          items={[
            { title: "Open the consultation", body: <>Go to <strong>Patients → (patient) → Consultations</strong> and open the consultation.</> },
            { title: "Click “Create prescription”", body: "It sits in the Prescriptions section of the consultation. The prescription form opens with the patient, diagnosis and recommended drugs already filled in." },
            { title: "Complete the details", body: "Set the quantity to dispense for each drug, refills allowed and priority. Dosage and frequency are required. Pick a catalog drug for each line where possible." },
            { title: "Submit", body: "The prescription is created as Pending and linked to that consultation. Only one active prescription can exist per consultation; cancel the old one to make a new one." },
          ]}
        />
        <Alert tone="info">
          A consultation with no recommended drugs can still be prescribed from: the form opens with one blank line to
          fill in by hand.
        </Alert>
      </SectionCard>

      <SectionCard title="Writing a prescription manually">
        <Para>
          Pharmacy → e-Prescriptions → New. Select up to ten patients, then write each patient's prescription in its own
          tab. Choosing a drug from the catalog links it immediately; “Other / not in catalog” is free text that the
          pharmacist will link at verification.
        </Para>
        <Fields
          rows={[
            ["Dosage", "How much per dose, e.g. 500 mg or 1 tablet. Required."],
            ["Frequency", "How often, e.g. Twice daily (BD). Required."],
            ["Duration", "How long, e.g. 5 days."],
            ["Quantity", "Total units to dispense across the whole course. This is what the pharmacy hands over."],
            ["Refills", "How many times the same quantity can be repeated later (0–12)."],
            ["Priority", "Routine, urgent or stat. Urgent and stat are flagged in the dispensing queue."],
          ]}
        />
      </SectionCard>

      <SectionCard title="Verification (pharmacist)" subtitle="Pending → Verified → Dispensed.">
        <Steps
          items={[
            { title: "Open the prescription", body: "e-Prescriptions → pick a Pending prescription." },
            { title: "Check every line is linked", body: "The system tries to link free-text names to your catalog automatically (e.g. “Paracetamol 500mg tablets” to Paracetamol 500 mg). Anything it cannot match, or where the strength differs, you link by hand." },
            { title: "Adjust quantity and refills", body: "Pharmacy can correct the quantity and refills before dispensing." },
            { title: "Verify", body: "The prescription moves to Verified and appears under Ready to dispense. Cancel with a reason if it should not be filled." },
          ]}
        />
        <Jump links={[{ href: "/dashboard/pharmacy/prescriptions", label: "Open e-Prescriptions" }, { href: "/dashboard/pharmacy/prescriptions/select", label: "Write a prescription" }]} />
      </SectionCard>
    </>
  );
}

function Dispense() {
  return (
    <>
      <SectionCard title="Dispensing a verified prescription">
        <Steps
          items={[
            { title: "Open Dispensing & Refills", body: "Verified and partially dispensed prescriptions are under Ready to dispense. Search by patient, MRN or Rx number." },
            { title: "Press Dispense", body: "Each line shows what was prescribed, what is left, what is on the shelf, the next expiry and the line total." },
            { title: "Confirm the quantities", body: "The form suggests everything still owed that is in stock. Lower a quantity to dispense part of it now; the rest stays open for later (partial dispense)." },
            { title: "Resolve any warnings", body: "An allergy warning needs a written override reason. A controlled drug needs a witness name." },
            { title: "Record counselling (optional now)", body: "Tick “Counselling given”, choose the topics and add notes. If you skip it, it stays on the Counselling page until recorded." },
            { title: "Dispense", body: "Stock is taken automatically from the batch expiring first. A dispense reference (DSP-…) is created and the patient's chart is updated." },
          ]}
        />
        <Fields
          rows={[
            ["Prescribed / done / left", "Quantity ordered, already handed out, and still owed."],
            ["In stock", "Sellable units only. Expired and quarantined batches are not counted."],
            ["Dispense qty", "Cannot exceed what is left or what is in stock."],
            ["Total payable", "Sum of line totals in your selling currency."],
          ]}
        />
      </SectionCard>

      <SectionCard title="Refills">
        <Para>
          Dispensing & Refills → History & refills → Refill. The system repeats the original quantities, checks that refills
          remain on each line, re-runs the allergy check, and takes stock first-expiry-first-out again. Lines that have used
          all their refills are skipped.
        </Para>
      </SectionCard>

      <SectionCard title="Counselling">
        <Para>
          Pharmacy → Counselling lists dispenses that still need a counselling record. Open one, tick the topics you covered
          (dosage and timing, side effects, storage, interactions, adherence, missed dose, when to seek help) and save.
        </Para>
      </SectionCard>
    </>
  );
}

function Safety() {
  return (
    <>
      <SectionCard title="Allergy screening">
        <Para>
          Each drug is compared with the patient's recorded allergies by generic name, brand name and category. If there is
          a possible match the dispense is blocked until you give a clear reason (for example “prescriber confirmed, patient
          has tolerated this before”). The reason is saved on the dispense record.
        </Para>
        <Rules
          items={[
            { ok: true, text: "Keep patient allergies up to date on the patient record, because the check can only see what is recorded." },
            { ok: false, text: "An override is not a substitute for calling the prescriber when in doubt." },
          ]}
        />
      </SectionCard>

      <SectionCard title="Controlled substances">
        <Para>
          Mark a drug as controlled and choose its schedule in the catalog. From then on every receipt, dispense and
          adjustment of that drug writes a line to the Controlled Substances Log with the running balance, the batch, the
          patient and the witness. Dispensing requires a witness name.
        </Para>
        <Jump links={[{ href: "/dashboard/pharmacy/controlled", label: "Open controlled log" }]} />
      </SectionCard>

      <SectionCard title="First-expiry-first-out (FEFO)">
        <Rules
          items={[
            { ok: true, text: "Dispensing always takes from the batch expiring first." },
            { ok: true, text: "When a batch runs out the next one is used automatically, and one dispense can span several batches." },
            { ok: false, text: "Expired and quarantined batches are never used (unless you deliberately allow expired dispensing in Setup)." },
          ]}
        />
      </SectionCard>
    </>
  );
}

function Control() {
  return (
    <>
      <SectionCard title="Inventory, low stock and expiry">
        <Fields
          rows={[
            ["Drug Inventory & Stock", "One row per drug: sellable stock, total on hand, nearest expiry and status (OK, low, out)."],
            ["Low Stock", "Drugs at or below their reorder level. Start a purchase order from here."],
            ["Batches & Expiry", "Every batch with its expiry. Filter expired or expiring soon, and quarantine a suspect batch so it can't be dispensed."],
          ]}
        />
        <Jump links={[{ href: "/dashboard/pharmacy/inventory", label: "Inventory" }, { href: "/dashboard/pharmacy/low-stock", label: "Low stock" }, { href: "/dashboard/pharmacy/expiry", label: "Batches & expiry" }]} />
      </SectionCard>

      <SectionCard title="Returns & adjustments">
        <Para>
          Use an adjustment to correct a batch that already exists, always with a reason. Types that remove stock: damaged,
          expired, theft/loss, return to supplier and correction out. Types that add stock: patient return and correction
          in. Controlled drugs also need a witness.
        </Para>
        <Alert tone="warning">
          Adjustments are permanent records. Never use them to load new stock; receive it instead.
        </Alert>
        <Jump links={[{ href: "/dashboard/pharmacy/adjustments/new", label: "New adjustment" }]} />
      </SectionCard>

      <SectionCard title="Reports">
        <Para>
          Pick a date range to see revenue, number of dispenses and refills, stock value at cost, daily revenue, top drugs
          by quantity, prescriptions written and stock adjustments, all in your selling currency. Auditors have read-only access.
        </Para>
        <Jump links={[{ href: "/dashboard/pharmacy/reports", label: "Open reports" }]} />
      </SectionCard>
    </>
  );
}

const FAQ: Array<[string, ReactNode]> = [
  ["I can't dispense a prescription.", <>Check, in order: (1) it is <strong>Verified</strong>, not Pending; (2) every line is linked to a catalog drug (open the prescription and link it); (3) the drug has sellable stock (receive a batch, and check the batch isn't expired or quarantined); (4) your role is pharmacist, admin, manager or CEO.</>],
  ["“Not linked to a catalog drug”", "The prescribed name did not match anything in your catalog, or the strength differs. Open the prescription, pick the correct drug for that line, then dispense. Adding the drug to the catalog first also helps."],
  ["“Out of stock” on the dispense screen", "Nothing sellable is on the shelf. Receive stock, or check Batches & Expiry in case everything is expired or quarantined."],
  ["“Allergy warning” blocks me", "Read the warning. If dispensing is clinically acceptable, type the reason in the override box. It is recorded permanently."],
  ["“Insufficient stock … short by N”", "Another user dispensed the same stock a moment ago. Refresh and lower the quantity, or receive more stock."],
  ["The currency or symbol is wrong", "Pharmacy → Setup → Selling currency. Save, and every page switches. Remember prices are not converted."],
  ["I received stock but can't see it", "Open Inventory and search the drug. If the batch's expiry is in the past it was rejected; if it is quarantined it is held back from dispensing."],
  ["A prescription from a consultation is missing", "Each consultation can have one active prescription. Search e-Prescriptions by the patient. If it was cancelled you can create a new one."],
];

function Faq() {
  const { ui } = usePharmacyUI();
  return (
    <SectionCard title="Common problems, and the fix" subtitle="Most blocked actions have a clear reason shown on screen.">
      <div className="space-y-3">
        {FAQ.map(([q, a]) => (
          <div key={q} className="rounded-2xl p-4" style={{ backgroundColor: ui.inner }}>
            <p className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" /> {q}
            </p>
            <p className="text-xs opacity-70 mt-1.5 leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */

export default function PharmacyGuidePage() {
  const { ui } = usePharmacyUI();
  const [tab, setTab] = useState<TabId>("start");

  return (
    <PharmacyPage
      narrow
      routes={[{ label: "Pharmacy", href: "/dashboard/pharmacy" }, { label: "Pharmacy Guide" }]}
      title="Pharmacy Guide"
      description="A complete walkthrough: setup, stock, prescriptions, dispensing, safety and troubleshooting."
      icon={BookOpen}
      actions={
        <PrimaryButton href="/dashboard/pharmacy/dispense" icon={PackageCheck}>
          Dispensing
        </PrimaryButton>
      }
    >
      <Chips value={tab} onChange={setTab} options={TABS.map((t) => ({ id: t.id, label: t.label }))} />

      {tab === "start" && <Start />}
      {tab === "setup" && <Setup />}
      {tab === "catalog" && <Catalog />}
      {tab === "stock" && <Stock />}
      {tab === "rx" && <Rx />}
      {tab === "dispense" && <Dispense />}
      {tab === "safety" && <Safety />}
      {tab === "control" && <Control />}
      {tab === "faq" && <Faq />}

      <div
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-[24px] border p-4"
        style={{ backgroundColor: ui.card, borderColor: ui.border }}
      >
        <p className="text-xs opacity-70">Ready to work? Jump straight in.</p>
        <div className="flex flex-wrap gap-2">
          <GhostButton href="/dashboard/pharmacy/prescriptions" icon={ClipboardList}>
            Prescriptions
          </GhostButton>
          <GhostButton href="/dashboard/pharmacy/inventory" icon={Boxes}>
            Inventory
          </GhostButton>
          <Link
            href="/dashboard/pharmacy/receiving/new"
            className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-xs font-bold text-white transition hover:opacity-90"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Truck size={14} /> Receive Stock
          </Link>
        </div>
      </div>
    </PharmacyPage>
  );
}
