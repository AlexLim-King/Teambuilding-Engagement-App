# 05 — Architecture

Built on **GitHub + Vercel + Supabase**.

## Stack

| Layer | Choice | Notes |
|---|---|---|
| App | **Next.js (App Router) + TypeScript** | One app, participant and facilitator route groups |
| Hosting | **Vercel** | Preview deployment per pull request |
| Database | **Supabase Postgres** | The schema in [02](02-data-model.md) is naturally relational |
| Facilitator auth | **Supabase Auth** | Email + password or magic link. Not hand-rolled |
| Participant auth | **Device token**, validated in a Next API route | No account, no password, no Supabase user per participant |
| File storage | **Supabase Storage** | Participant photos, private bucket, short-lived signed URLs |
| Local store | **Dexie (IndexedDB)** | Offline outbox; needs a transactional store, not `localStorage` |
| Offline shell | **Service worker (Workbox)** | Precache the participant shell |
| Pure logic | **`packages/core`** | Formation, scoring, ledger, parsing — no framework, no I/O |
| CI | **GitHub Actions** | Core tests, typecheck, bundle budget |
| Migrations | **Supabase CLI**, checked into the repo | `supabase/migrations/` |

Deliberately not used: no ORM, no state-management library, no UI component kit, no
realtime framework for participants (see below). Each is weight on a bundle that loads
over hotel wifi on a five-year-old Android.

---

## Three things serverless changes

The earlier draft assumed a long-running Node server. Vercel functions are stateless and
can run concurrently, which breaks two mechanisms and bends a third.

### 1. Money operations move into Postgres

The redemption **compare-and-set** in [10](10-currency.md#the-double-tap-problem-and-how-its-handled)
was specified as "read the balance, compare, write". On a single server that is safe
enough. On serverless, two concurrent invocations can both read `120`, both compare
successfully, and both write — taking the balance to −120.

So the invariant moves to where concurrency is actually resolved:

```sql
create function redeem_balance(p_participant uuid, p_expected int, p_entry uuid)
returns table (ok boolean, balance int)
language plpgsql as $$
declare v_balance int;
begin
  -- row lock serialises concurrent callers on this participant
  perform 1 from programme_participant where id = p_participant for update;

  select coalesce(sum(amount), 0) into v_balance
    from currency_ledger where programme_participant_id = p_participant;

  if v_balance <> p_expected then
    return query select false, v_balance; return;
  end if;

  insert into currency_ledger (id, programme_participant_id, kind, amount, reason)
  values (p_entry, p_participant, 'redemption', -v_balance, 'Counter redemption')
  on conflict (id) do nothing;          -- idempotent on replay

  return query select true, 0;
end $$;
```

The same applies to **award batches** (all entries for a team commit or none) and to
**releasing pending awards** on submission. Rule for the build: *anything that touches
currency is a Postgres function, not application code.*

### 2. The redemption lease becomes a database row

A lease held in process memory evaporates between invocations. It becomes a row claimed by
a single conditional statement, which is atomic without any application logic:

```sql
update redemption_lease
   set device_id = $1, expires_at = now() + interval '5 minutes'
 where programme_id = $2
   and (device_id = $1 or expires_at < now())
returning *;
```

Renewed while the counter is in use; a dead device's lease simply expires. Takeover is the
same statement with an explicit override flag.

### 3. Cold starts

A sleeping function costs 1–2 seconds on first call. Harmless here, because of how the
system is already built: participant writes commit to IndexedDB before any network call, and
team formation runs on the facilitator's device. Nothing a human waits on depends on a warm
function.

---

## Who may talk to the database

The most consequential decision in this stack, and the easiest to get wrong.

```
Participant browser ──► Next API route ──► Supabase (service role, server-only)
                        validates device token,
                        enforces round state + assignment

Facilitator browser ──► Supabase client (anon key + RLS)   ... reads
                   └──► Next API route (service role)      ... writes
```

**Participants never touch Supabase directly.** Their requests go through API routes that
validate the device token and apply the business rules — the rater must be the token's
participant, the round must be open or in catch-up, the ratee must be the assigned one.
Those are procedural checks; they are far clearer in TypeScript than in RLS policies, and
keeping them in one place means there is one thing to audit.

A useful consequence: **the participant bundle contains no Supabase credentials at all.**

**All writes go through API routes**, facilitator writes included, so the ledger invariants,
derangement generation, and lease logic live in exactly one place.

### Enable RLS on every table anyway

The Supabase anon key is public by design — it ships in any client that uses it. If RLS is
off, that key reads your whole database. This is the single biggest footgun in this stack.

- `alter table ... enable row level security` on **every** table, with no exceptions.
- No `anon` policies at all. Facilitator reads are policed against `auth.uid()`.
- The **service role key is server-only**. Never prefix it `NEXT_PUBLIC_` — that string
  compiles it into the browser bundle, and it bypasses RLS entirely.
- A CI check greps the client bundle for the service role key. Cheap, and it catches the
  mistake that would otherwise be catastrophic.

---

## Realtime: use it for the facilitator, not participants

Supabase Realtime could push team assignments to phones instead of polling. Recommended
against for participants, on two grounds:

- Participants are frequently offline, so the polling-and-cache path has to exist regardless.
  Adding realtime means two code paths to the same state, failing in different ways.
- 300 concurrent websockets is near the Pro connection allowance, for a benefit the existing
  design already delivers.

Use it where the connection count is one and the benefit is real: the facilitator's live join
and submission counters.

---

## The one architectural risk in this stack

**Next.js App Router and offline-first pull against each other.** Server Components render on
the server; an offline participant has no server. So participant routes must be
client-rendered with a cached shell, which means paying Next's baseline weight (~90KB
gzipped) for what is effectively a single-page app.

Three options were considered:

| | Approach | Cost |
|---|---|---|
| **A** | One Next app; participant routes as a client-rendered group with a service worker | Simplest to operate. Tight bundle budget |
| B | Separate Vite PWA for participants, Next for facilitator | Leanest participant bundle, cleanest offline story. Two deployables |
| C | All Next, server-rendered participant screens | Rejected — does not work offline |

**Recommended: A**, with an explicit revisit trigger. `packages/core` and the API routes are
shared either way, so splitting the participant app out later is contained rather than a
rewrite.

Revisit at M2 if either holds:
- Participant first-load JS exceeds **160KB gzipped** after honest effort, or
- The offline shell proves unreliable in real testing.

To keep A viable: participant routes use minimal client components, no UI library, no date
library, no chart library. CI fails the build when the budget is exceeded, so this stays a
fact rather than an intention.

---

## Repository layout

```
apps/
  web/                    # Next.js: participant + facilitator + API routes
    app/
      (participant)/      # client-rendered, service worker, offline
      (facilitator)/
      api/
    public/
packages/
  core/                   # pure TypeScript, no I/O, heavily tested
    formation/            # teams, derangements, coverage
    scoring/              # bias model, engagement composite, nominations
    ledger/               # balance arithmetic, integers only
    roster/               # CSV/XLSX + NRIC parsing
    itinerary/            # run-sheet → sessions + activities
supabase/
  migrations/
  functions/              # SQL: redeem_balance, award_batch, release_pending
.github/workflows/
docs/
```

`packages/server` from the earlier draft is gone — Next API routes replace it. `core` stays
framework-free so it runs identically in the browser, in an API route, and in the M1 CLI.

---

## API surface

Participant routes take `Authorization: Bearer <device_token>`.

```http
POST /api/events/[joinCode]/claim     name claim → participant, event, roster, template
GET  /api/me/state?since=cursor       team, assignment, evaluation window, outstanding
POST /api/sync                        submissions in, state + cursor out (idempotent)
GET  /api/me/balance                  own balance + earning history (pull-only)
POST /api/me/photo                    optional, resized client-side
```

Facilitator routes use the Supabase session.

```http
POST /api/events                      create
POST /api/events/[id]/itinerary       paste run-sheet → proposed sessions + activities
POST /api/events/[id]/roster          CSV/XLSX import
POST /api/rounds/[id]/form            run formation → proposal, not committed
POST /api/rounds/[id]/commit          publish teams + rating assignments
POST /api/rounds/[id]/open            open evaluation
POST /api/rounds/[id]/close           end on-time window (catch-up continues)
POST /api/rounds/[id]/finalise        no more submissions; forfeit unreleased awards
POST /api/rounds/[id]/results         placing / score per team
POST /api/rounds/[id]/awards          per-member amounts → batch
POST /api/rounds/[id]/observations    team teamwork rating, notice-this-person
POST /api/awards/[batchId]/reverse    undo, pending or released
POST /api/redemption/claim            claim or take over the counter lease
POST /api/redemptions                 compare-and-set via Postgres function
GET  /api/events/[id]/analytics       engagement, nominations, coverage
GET  /api/events/[id]/report          the four analyses in [13](13-client-report.md)
```

---

## Offline model

Unchanged in substance — a participant action never waits for the network.

```
tap Submit → write to IndexedDB (this is the commit; UI says "Saved")
           → append to outbox
           → sync worker: on connectivity, on visibility, every 15s with backoff
           → POST /api/sync  (idempotent by client-generated submission id)
           → merge server state, drain outbox
```

Submissions are immutable facts with one owner each, so there are no conflicts to resolve.
Ordering uses `(client_seq, received_at)`, never the device clock. Currency is the exception
and is specified in [10](10-currency.md); its participant side is pull-only and requires a
connection, so no authoritative balance ever sits on a phone.

---

## Costs

Correcting the earlier estimate, which was too low.

| | Tier | Monthly |
|---|---|---|
| Vercel | **Pro** — Hobby prohibits commercial use | ~US$20 |
| Supabase | **Pro** | ~US$25 |
| | | **~US$45** |

Two things to know before the first paying event:

- **Vercel Hobby is non-commercial only.** Fine while building; not fine once you invoice a
  client for an event run on it.
- **Supabase free projects pause after about a week of inactivity.** If you run events
  monthly, a free project will be asleep the morning of an event. Verify the current terms,
  but plan on Pro before you depend on it.

Development can run entirely free: a local Supabase via the CLI, and Vercel preview
deployments.

---

## Security posture

- Device tokens are 128-bit random, scoped to one event, and grant only "read my own state,
  write my own submissions". A stolen token submits one rating as one participant.
- Server-side authorisation on every write. Never trust a client's claim about who it rates.
- RLS enabled on every table; no `anon` policies; service role key server-only.
- Rate limit `/claim` so join codes cannot be brute-forced. Codes are 6 characters from a
  32-symbol alphabet and valid only while an event is open.
- No participant endpoint returns another participant's ratings, balance, or photo.
- Photos live in a private bucket, reached only through short-lived signed URLs, and are
  deleted with the programme.
- Only an authenticated facilitator can create a `currency_ledger` entry. A device token
  cannot award, adjust, or redeem.
