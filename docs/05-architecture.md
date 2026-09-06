# 05 — Architecture

## Stack

| Layer | Choice | Why |
|---|---|---|
| UI | **React 18 + TypeScript + Vite** | Small, fast builds; the participant route can be code-split to well under the 150 KB budget |
| Styling | **CSS modules + custom properties** | No runtime cost, no framework weight; the watch/phone breakpoints are a handful of media queries |
| Local store | **IndexedDB via Dexie** | Survives reloads and tab kills; the outbox pattern needs a real transactional store, not localStorage |
| Offline shell | **Workbox service worker** | Precache the app shell, cache-first for assets, network-only for sync |
| Server | **Node 20 + Fastify + Postgres** | Boring, cheap, and the schema in [02](02-data-model.md) is naturally relational |
| Hosting | **Fly.io / Railway + managed Postgres** | ~US$0–25/month at this scale |
| Auth | Facilitator: email + password (Argon2id) + session cookie. Participant: device bearer token | Participants must not have credentials (see R-P1) |

Deliberately **not** used: no realtime framework, no state-management library, no
UI component kit, no ORM heavier than a query builder. Each of those is weight on
a bundle that has to load over hotel wifi on a five-year-old Android.

## The offline model

The design rule is simple: **a participant action never waits for the network.**

```
  tap "Submit"
       │
       ▼
  write Submission to IndexedDB      ← this is the commit; UI says "Saved"
       │
       ▼
  append to outbox
       │
       ▼
  sync worker (on connectivity, on visibility, every 15 s with backoff)
       │
       ▼
  POST /sync  { submissions: [...], since: <cursor> }
       │
       ▼
  server upserts by client-generated id (idempotent), returns changes since cursor
       │
       ▼
  merge server state into IndexedDB, drain outbox
```

Properties this gives:

- **Idempotent replay.** `submission.id` is minted on the device and is the
  primary key. Sending the same submission five times is a no-op. Nothing is
  lost, nothing is duplicated.
- **No conflicts to resolve.** Submissions are immutable append-only facts and
  each is uniquely owned by one rater for one round. Two devices can never write
  the same row. The only genuinely mutable state — team assignments — is written
  by the facilitator alone, so a plain server-authoritative version number
  suffices.
- **Clock independence.** Ordering uses `(client_seq, received_at)`, never the
  device clock (see [02](02-data-model.md#submission)).

### The offline distribution problem — be clear-eyed about this

Queueing *outbound* data offline is easy and fully solved above. Getting data
*to* a participant offline is not, and it is worth stating plainly rather than
discovering it in a field:

**A browser PWA cannot receive team assignments with no network.** There is no
phone-to-phone transport available to a web page — no Bluetooth mesh, no
peer-to-peer without a signalling server. If the venue wifi is down at the exact
moment teams are formed, participants' phones cannot learn their team number,
however good the offline architecture is.

Three mitigations, in order of cost:

1. **Facilitator display (ships in v1).** Team lists render on the facilitator's
   device as a large, projectable, high-contrast board. This is what teambuilding
   companies do today anyway, and it works with zero infrastructure. The app's
   offline capability then covers what actually matters — participants *entering*
   evaluations away from signal, which they can do all day and sync later.
2. **Pre-fetch during briefing.** Participants join and cache the roster during
   the opening briefing, when they are typically indoors near a working access
   point. Only the per-round team assignment needs a later fetch, and it is tiny
   — it will get through on a bar of signal.
3. **Local hub mode (v2, only if the field demands it).** The facilitator's
   laptop runs the server on a travel router, participants join its wifi. Fully
   offline, genuinely robust, and adds real setup friction to every event: an
   access point to carry, an SSID to announce, and captive-portal quirks on iOS.
   Build it when a real event has actually failed without it — not before.

## API contract

All participant endpoints take `Authorization: Bearer <device_token>`.

```http
POST /events/{joinCode}/claim
     { deviceToken, rosterPersonId | walkInName }
  →  { participantId, event, template, roster[], currentRound }

GET  /events/{id}/state?since={cursor}
  →  { cursor, round, myTeam, assignment, evaluationOpen }

POST /sync
     { submissions: [ { id, roundId, rateeId, criteria{}, nominations{}, clientSeq } ],
       since: cursor }
  →  { accepted: [id], rejected: [ { id, reason } ], cursor, state }
```

Facilitator endpoints (session-cookie auth):

```http
POST /events                          create
POST /events/{id}/roster              CSV/XLSX import
POST /events/{id}/rounds              create round
POST /events/{id}/rounds/{r}/form     run formation → returns proposal, not committed
POST /events/{id}/rounds/{r}/commit   publish teams + rating assignments
POST /events/{id}/rounds/{r}/open     open evaluation window
POST /events/{id}/rounds/{r}/close    close it
GET  /events/{id}/analytics           adjusted scores, nominations, coverage
GET  /events/{id}/export.xlsx         full export
```

`form` returning a *proposal* rather than committing is what makes R5 ("see the
teams before they go live") and R6 (manual override) possible.

## Where the algorithms run

Team formation and score adjustment both run **on the facilitator's device**, in
TypeScript, as pure functions over plain data. Reasons:

- They must work with no network (that is the whole point of R11).
- They are pure and deterministic, so they are trivially testable and produce
  identical results wherever they run.
- The server can run the identical module under Node for reporting, with no
  second implementation to keep in sync.

Both live in `packages/core/`, imported by both web and server, and are the most
heavily tested code in the project.

## Repository layout

```
packages/
  core/            # pure TS: formation, bias model, nomination stats, CSV parsing
    formation/
    scoring/
    roster/
  web/             # React PWA — both interfaces, code-split by role
    participant/
    facilitator/
    sync/
  server/          # Fastify + Postgres
    routes/
    db/migrations/
docs/
```

A monorepo (pnpm workspaces) rather than three repos, because `core` types are
shared by all three and version skew between them would be a constant source of
subtle bugs.

## Security posture

- Device tokens are 128-bit random, scoped to one event, and grant only "read my
  own event state, write my own submissions." A stolen token lets someone submit
  one rating as one participant. That is the whole blast radius, and it is
  proportionate to the stakes.
- **Server-side authorisation on every write**: the rater must be the token's
  participant, the round must be open, the ratee must be the assigned one. Never
  trust the client's claim about who it is rating.
- Rate limiting on `/claim` to stop someone enumerating the roster by brute-force
  join codes. Join codes are 6 characters from a 32-symbol alphabet
  (~10⁹ combinations) and are only valid while an event is open.
- No participant endpoint ever returns another participant's ratings.
- Transport is HTTPS only; the service worker requires a secure context anyway.
- Roster caching on devices is a deliberate, documented trade — see
  [02](02-data-model.md#what-lives-on-the-participant-device).
