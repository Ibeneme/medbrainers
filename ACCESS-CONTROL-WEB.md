# Roles & Access — Web

The server decides and enforces; the web layer makes the UI honest (hide what you can't use, explain why).
Permissions are `module.action` strings, e.g. `radiology.view`, `pharmacy.dispense`.

## Layers (where access is enforced in the UI)

| Layer | File | What it does |
|---|---|---|
| **State** | `api/slices/accessSlice.ts` | Holds `byFacility[facilityId]` = roles + permissions. Filled from `login`, `/users/me`, `switch-company` (`data.access`) and `GET /companies/:id/access/me`. Cached in `localStorage` (`mb_access`, tagged with the user id; **never** in the 4 KB user cookie). |
| **Freshness** | `components/access/access-provider.tsx` | Loads on facility change, re-checks on tab focus (>60 s), every 5 min, after **any API 403**, and on "Re-check my access". Admin changes reach the user's screen without a re-login. |
| **Rules** | `lib/access/route-access.ts` | ONE table: URL → required permission. First match wins. Unmapped `/dashboard` routes are **denied by default**. |
| **Pages** | `components/access/route-guard.tsx` (mounted once in `dashboard_layout.tsx`) | Checks the table before any page mounts, so forbidden pages never render or fetch. Shows `AccessDenied`. |
| **Landing** | `components/access/landing-redirect.tsx` | `/dashboard` sends each person to the first screen they can actually use. |
| **Navigation** | `lib/access/filter-nav.ts` + `NAV_ITEMS` in the layout | Sidebar items, groups and category headings disappear when not permitted. Entries with no `href` use `need: [...]`. |
| **Links** | `components/access/guarded-link.tsx` | Drop-in for `next/link` (already swapped in all dashboard pages/components). A link to a forbidden route renders nothing. |
| **Buttons** | `components/access/can.tsx` | `<Can perm="radiology.sign">…</Can>`, `<Can perm={["a","b"]}>` (any-of), `<Can all={[…]}>`, `<Can path="/dashboard/…">` (same rule table as the router). |
| **Code** | `hooks/useAccess.ts` | `const { can, canAny, canAll, canPath, roles, modules, ready } = useAccess()` |
| **Admin UI** | `app/dashboard/workspace/access/page.tsx` | Roles (permission matrix, create/edit/reset/delete) and People (extra roles, direct permissions, denials). Sidebar: *Facilities & Companies → Roles & Access*. |

## Rules of thumb
- **Answers are `false` until permissions load** — never "allowed by default".
- Whole page needs a permission → add/adjust a rule in `route-access.ts` (nothing else).
- One button inside an otherwise-allowed page → wrap it in `<Can perm="…">`.
- Navigating from a button: prefer `<Link>` (auto-gated) or `<Can path={href}>`.
- Never read role names (`role === "admin"`) in UI code any more — use `can("…")`.

## Adding a page / module
1. Create the page.
2. Add a rule in `route-access.ts` (or reuse `moduleRules("seg", "module")`).
3. `npm run check:access` — fails if any page has no rule.
4. New backend module? Add it to the backend catalog, then regenerate/extend `lib/access/permissions.ts`.

Add to `package.json`:  `"check:access": "node scripts/check-route-access.mjs"`

## Done automatically in this change
- 123 files: `next/link` → `GuardedLink`.
- 21 navigation buttons (`router.push`) and 81 in-page action buttons wrapped in `<Can>`.
- Role-name checks replaced by permissions: compliance rules, patient allergies, task edit/delete, workspace members/settings.
