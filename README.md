# CampusStay — student accommodation demo

A Next.js 16 demo of a back-office system for a university residence office.
All data is fictional, generated deterministically in `src/lib/seed.ts`.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## What's in it

| Page | What you can do |
| --- | --- |
| **Dashboard** | Occupancy, pending applications, open maintenance, rent collection and recent activity at a glance |
| **Residences** | Four properties with occupancy stats; each has a floor-by-floor room map |
| **Room dialog** | See occupants, allocate a free bed to an applicant, block/unblock a room for maintenance |
| **Students** | Search and filter residents, see who is behind on rent |
| **Student profile** | Lease, room, roommates, invoices (mark paid), move room, check out, log an issue |
| **Applications** | Approve and allocate a bed, waitlist, decline, capture a new application |
| **Maintenance** | Kanban board of requests: open → in progress → resolved |
| **Payments** | Invoices by period and status, mark paid, send reminders |

Changes are kept in `localStorage`, so they survive a reload. Use **Reset demo data**
in the sidebar to start over. The demo world is pinned to 11 September 2026.

## Structure

```
src/
  app/                  routes (thin server components)
  components/views/     page views (client components)
  components/           shell, modal, room dialog, ticket form, UI primitives
  lib/seed.ts           deterministic demo data
  lib/store.ts          reducer + useSyncExternalStore store, persisted to localStorage
  lib/selectors.ts      derived data (occupancy, balances, statuses)
```
