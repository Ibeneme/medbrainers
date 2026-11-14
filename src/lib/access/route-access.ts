import type { Need, Permission } from "./permissions";

/**
 * ROUTE → PERMISSION MAP  (the single place that says who may open which screen)
 *
 * Used by:  RouteGuard (pages) · sidebar filtering · <GuardedLink> · <Can path=…>
 *
 * Rules are checked top-to-bottom, FIRST MATCH WINS.
 *   need: a permission, an any-of array, or null (= any signed-in member)
 *
 * SECURE BY DEFAULT: a /dashboard path that matches no rule is denied (and warned about in dev).
 * Adding a page? Add a rule here. `npm run check:access` (scripts/check-route-access.mjs) fails if a page is unmapped.
 *
 * The backend enforces the same rules (modules/access/route-permissions.ts); this layer is about UX
 * (hide what you can't use, explain why) — it is NOT the security boundary.
 */
interface Rule {
  re: RegExp;
  need: Need;
}

/** Last path segments that mean "this screen changes data" */
const WRITE_SUFFIX =
  "new|create|register|edit|admit|record|administer|discharge|void|stop|complete|reject|return|retrospective|quarantine|process|status|discard|discard-expired";

const D = "^/dashboard/";

/** Standard clinical module: …/new|edit|… → write, everything else → view. `first` rules win over both. */
function moduleRules(seg: string, mod: string, first: Rule[] = []): Rule[] {
  return [
    ...first,
    { re: new RegExp(`${D}${seg}(?:/.*)?/(?:${WRITE_SUFFIX})$`), need: `${mod}.write` as Permission },
    { re: new RegExp(`${D}${seg}(?:/|$)`), need: `${mod}.view` as Permission },
  ];
}

const r = (re: RegExp, need: Need): Rule => ({ re, need });

export const ROUTE_RULES: Rule[] = [
  /* ── always open to a signed-in member ── */
  r(/^\/dashboard\/?$/, null),
  r(new RegExp(`${D}notifications(?:/|$)`), null),
  r(new RegExp(`${D}settings(?:/|$)`), null), // own profile; facility-level controls are gated inside
  r(new RegExp(`${D}workspace/?$`), null),
  r(new RegExp(`${D}workspace/create/?$`), null),
  r(new RegExp(`${D}workspace/subscriptions`), null),

  /* ── overview ── */
  r(new RegExp(`${D}dashboard(?:/|$)`), "dashboard.view"),
  r(new RegExp(`${D}reports(?:/|$)`), "dashboard.view"),
  r(new RegExp(`${D}billing(?:/|$)`), "dashboard.view"), // scaffold only – no billing backend yet

  /* ── AI ── */
  r(new RegExp(`${D}ai(?:/|$)`), "ai.use"),

  /* ── patients (+ vitals, consultations live under it) ── */
  r(new RegExp(`${D}patients/alerts`), "vitals.view"),
  r(new RegExp(`${D}patients/register`), "patients.write"),
  r(new RegExp(`${D}patients/[^/]+/edit`), "patients.write"),
  r(new RegExp(`${D}patients/[^/]+/consultations/new`), "consultations.write"),
  r(new RegExp(`${D}patients/[^/]+/consultations/[^/]+`), "consultations.view"),
  r(new RegExp(`${D}patients(?:/|$)`), "patients.view"),

  r(new RegExp(`${D}consultations/vitals/create`), "vitals.write"),
  r(new RegExp(`${D}consultations/vitals`), "vitals.view"),
  r(new RegExp(`${D}consultations/patients/create`), "consultations.write"),
  r(new RegExp(`${D}consultations/patients`), "patients.view"),
  r(new RegExp(`${D}consultations(?:/|$)`), "consultations.view"),

  r(new RegExp(`${D}clinical/vitals`), "vitals.view"),
  r(new RegExp(`${D}clinical(?:/|$)`), "consultations.view"),

  /* ── appointments ── */
  ...moduleRules("appointments", "appointments"),

  /* ── wards ── */
  ...moduleRules("wards", "wards", [r(new RegExp(`${D}wards/create`), "wards.manage")]),

  /* ── emergency ── */
  ...moduleRules("emergency", "emergency", [r(new RegExp(`${D}emergency/triage/[^/]+$`), "emergency.write")]),

  /* ── maternity (frontend path is /maternal) ── */
  ...moduleRules("maternal", "maternity", [
    r(new RegExp(`${D}maternal/anc/[^/]+/(?:investigation|risk|visit)$`), "maternity.write"),
  ]),

  /* ── theater ── */
  ...moduleRules("theater", "theater", [
    r(new RegExp(`${D}theater/rooms/new`), "theater.manage"),
    r(new RegExp(`${D}theater/rooms/[^/]+/edit`), "theater.manage"),
  ]),

  /* ── blood bank ── */
  ...moduleRules("blood-bank", "blood_bank", [
    r(new RegExp(`${D}blood-bank/setup`), "blood_bank.manage"),
    r(new RegExp(`${D}blood-bank/reports`), "blood_bank.reports"),
    r(new RegExp(`${D}blood-bank/(?:expiry/discard-expired|inventory/[^/]+/discard)`), "blood_bank.manage"),
    r(new RegExp(`${D}blood-bank/(?:components/process/[^/]+|inventory/[^/]+/storage|storage/[^/]+/(?:edit|quarantine|log)|transfusions/[^/]+/vitals)`), "blood_bank.write"),
  ]),

  /* ── telemedicine ── */
  ...moduleRules("telemedicine", "telemedicine", [
    r(new RegExp(`${D}telemedicine/setup`), "telemedicine.manage"),
    r(new RegExp(`${D}telemedicine/room/`), "telemedicine.write"),
  ]),

  /* ── laboratory ── */
  ...moduleRules("labs", "labs", [
    r(new RegExp(`${D}labs/setup`), "labs.manage"),
    r(new RegExp(`${D}labs/catalog/new`), "labs.manage"),
    r(new RegExp(`${D}labs/catalog/[^/]+/edit`), "labs.manage"),
  ]),

  /* ── radiology ── */
  ...moduleRules("radiology", "radiology", [
    r(new RegExp(`${D}radiology/create(?:/|$)`), "radiology.write"),
    r(new RegExp(`${D}radiology/viewer/dictation`), "radiology.write"),
  ]),

  /* ── pharmacy ── */
  ...moduleRules("pharmacy", "pharmacy", [
    r(new RegExp(`${D}pharmacy/setup`), "pharmacy.manage"),
    r(new RegExp(`${D}pharmacy/(?:reports|controlled)`), "pharmacy.reports"),
    r(new RegExp(`${D}pharmacy/prescriptions/(?:new|select)`), "pharmacy.prescribe"),
    r(new RegExp(`${D}pharmacy/(?:dispense|counselling)(?:/|$)`), "pharmacy.dispense"),
  ]),

  /* ── tasks / handover / staff ── */
  r(new RegExp(`${D}tasks/handover(?:/|$)`), "handovers.view"),
  r(new RegExp(`${D}tasks(?:/|$)`), "tasks.view"),
  r(new RegExp(`${D}staff(?:/|$)`), "staff.view"),

  /* ── facility workspace ── */
  r(new RegExp(`${D}workspace/access(?:/|$)`), "access.view"),
  r(new RegExp(`${D}workspace/invitations`), "members.view"),
  r(new RegExp(`${D}workspace/teams`), ["members.view", "staff.view"]),
  r(new RegExp(`${D}workspace/departments/create`), "settings.manage"),
  r(new RegExp(`${D}workspace/departments(?:/|$)`), null), // reading departments is open; editing is gated inside
  r(new RegExp(`${D}workspace/compliance/rules/(?:new|edit|delete)`), "compliance.manage"),
  r(new RegExp(`${D}workspace/compliance(?:/|$)`), "compliance.view"),
  r(new RegExp(`${D}compliance(?:/|$)`), "compliance.view"),

  /* ── admin ── */
  r(new RegExp(`${D}data-management(?:/|$)`), "data.view"),
  r(new RegExp(`${D}feedbacks(?:/|$)`), ["feedbacks.write", "feedbacks.manage"]),
];

/** Strip locale prefix, query, hash, trailing slash. */
export function normalizePath(href: string): string {
  let p = href.split("#")[0].split("?")[0];
  p = p.replace(/^\/[a-z]{2}(?:-[A-Z]{2})?(?=\/dashboard)/, "");
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p;
}

export type PathNeed = { mapped: true; need: Need } | { mapped: false };

/** What does this path need? `mapped:false` = no rule (treated as denied for non-super users). */
export function needForPath(href: string): PathNeed {
  const p = normalizePath(href);
  if (!p.startsWith("/dashboard")) return { mapped: true, need: null }; // not an app route: not ours to gate
  for (const rule of ROUTE_RULES) if (rule.re.test(p)) return { mapped: true, need: rule.need };
  return { mapped: false };
}

/** Where to send someone first: the first of these they are allowed to open. */
export const LANDING_CANDIDATES = [
  "/dashboard/dashboard",
  "/dashboard/patients",
  "/dashboard/appointments",
  "/dashboard/consultations",
  "/dashboard/wards",
  "/dashboard/labs",
  "/dashboard/radiology",
  "/dashboard/pharmacy",
  "/dashboard/emergency",
  "/dashboard/maternal",
  "/dashboard/theater",
  "/dashboard/blood-bank",
  "/dashboard/telemedicine",
  "/dashboard/tasks",
  "/dashboard/ai/diagnostics",
  "/dashboard/staff/roster",
  "/dashboard/workspace/teams",
  "/dashboard/data-management",
  "/dashboard/feedbacks",
  "/dashboard/notifications",
] as const;
