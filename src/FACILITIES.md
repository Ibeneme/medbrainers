# Facilities (Companies) — Frontend

In the UI, backend **companies** are called **facilities**.

## Redux
- `state.facilities` — list, active facility, members, pending invites, switch/create/invite
- Login restores `activeFacility` + `pendingInvites`

## Pages
- `/dashboard/workspace` — active facility, switch, members, invite
- `/dashboard/workspace/create` — create facility
- `/dashboard/workspace/invitations` — accept / decline
- `/dashboard/workspace/teams` — staff directory

## SEO
All metadata uses `productName` (Medicules) with Open Graph images from the logo.
