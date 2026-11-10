# Telemedicine pages

Drop these files into the web app. They follow the same Redux slice pattern as theatre, wards and pharmacy, and they call the telemedicine routes on the API.

Base path: `/companies/:companyId/telemedicine`

## Menu (sidebar)

`Telemedicine & Virtual` is no longer marked coming soon in `components/layouts/dashboard_layout.tsx`.

| Page | Route | API |
|---|---|---|
| Virtual Consultations | `/dashboard/telemedicine` | `GET /dashboard`, `GET /sessions?scope=current` |
| Setup Telehealth | `/dashboard/telemedicine/setup` | `GET/PUT /settings` |
| Patient Session Notes | `/dashboard/telemedicine/notes` | `GET /notes` |
| Note | `/dashboard/telemedicine/notes/[noteId]` | `GET/PATCH /notes/:id`, sign, addenda, delete |
| New note | `/dashboard/telemedicine/notes/new?sessionId=` | `POST /sessions/:id/notes` |
| Upcoming | `/dashboard/telemedicine/archive` | `GET /sessions?scope=upcoming` |
| Current | `/dashboard/telemedicine/current` | `GET /sessions?scope=current` |
| Past | `/dashboard/telemedicine/history` | `GET /sessions?scope=past` |
| Schedule | `/dashboard/telemedicine/sessions/new` | `POST /sessions` |
| Visit | `/dashboard/telemedicine/sessions/[id]` | get, patch, cancel, end, invites, messages, notes |
| Staff video room | `/dashboard/telemedicine/room/[roomCode]` | `GET /ice-servers` + Socket.IO `/telehealth` |
| Patient join (no login) | `/telehealth/join?token=` | `GET /telehealth/guest/session` |

The room URL matches `joinUrl` from the API (`/dashboard/telemedicine/room/:roomCode`).
The patient URL matches `guestJoinUrl` (`/telehealth/join?token=`).

## Install

```
npm i socket.io-client
```

The video room imports `socket.io-client`. The rest of the module does not.

## Files

- `src/api/slices/telemedicineSlice.ts` — thunks for every telemedicine route
- `src/api/slices.ts` — registers `state.telemedicine`
- `src/api/telehealth.events.ts` — socket event types, copied from the server module
- `src/hooks/useTelemedicine.ts`
- `src/components/telemedicine/*`
- `src/app/dashboard/telemedicine/**`
- `src/app/telehealth/join/page.tsx`
