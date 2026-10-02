# 14 — Build Plan

Revised for the actual goal: **a working, branded app on a live URL**, to show a
business partner that this can be built and that it functions. Built component by
component, with something demoable at the end of every stage.

This replaces the M1-first ordering in [08](08-roadmap.md). M1 was a headless CLI
printing team lists — correct for de-risking the maths, useless for convincing a
partner. The rigorous work (statistical validation, the report, property tests)
moves after the app exists.

## Honest effort estimate

Stages 1–3 are a **focused week or so**, not a few days. The full specification —
bias correction, the four-analysis report, offline PWA, Bahasa Malaysia, photos,
multi-day programmes — is weeks beyond that.

That does not block anything, because each stage stands on its own:

| After | You can show |
|---|---|
| **Stage 1** | Import a namelist, teams form balanced across gender and department in under a second, everyone sees their number on their own phone |
| **Stage 2** | The full loop — evaluation opens, submissions land live on your board |
| **Stage 3** | Currency earned on winning, released on submitting, cashed out at the counter |

**Stage 1 + 2 alone is already a convincing demo.** Stage 3 is what makes it feel
like your product rather than a team randomiser.

---

## Stage 0 — Foundation ✅ done

Already in the repo and verified: build, typecheck and 12 core tests pass.

```
apps/web/              Next.js 16 · React 19 · Tailwind 4 · TypeScript strict
packages/core/         pure TS: coverage, ledger, nominations + tests
supabase/migrations/   full schema + currency functions in Postgres
.github/workflows/     typecheck · test · lint · build · service-key leak check
apps/web/app/brand.css brand tokens — PLACEHOLDERS, needs your palette
```

### On your laptop

```bash
git clone <repo> && cd Teambuilding-Engagement-App
git checkout claude/team-engagement-tracking-app-xuirk1
pnpm install

# Supabase: create a project at supabase.com, then
npm i -g supabase
supabase init                      # keeps the existing supabase/migrations
supabase link --project-ref <ref>
supabase db push                   # applies both migrations

cp .env.example .env.local         # fill in from Supabase → Project Settings → API
pnpm dev                           # http://localhost:3000
```

Deploy: import the repo on Vercel, set the root directory to `apps/web`, add the
three environment variables. Every pull request then gets its own preview URL.

**The one environment variable to be careful with:** `SUPABASE_SERVICE_ROLE_KEY`
bypasses Row Level Security entirely. Never prefix it `NEXT_PUBLIC_` — that
compiles it into the browser bundle. CI greps the built bundle for it as a
backstop.

### Brand tokens

`apps/web/app/brand.css` has five TODO values. Fill those in and the whole app
follows — it is the only file that needs editing for the palette. I need from you:
primary, a darker primary, accent, body text and page background as hex, plus any
font you use.

---

## Stage 1 — Roster, event, teams

The biggest stage, and the one that produces the first genuinely impressive moment.

**Facilitator**
- Supabase Auth login.
- Create an event; manage the activity library (name, team size, competitive).
- Itinerary paste → sessions and activities, matched against the library
  ([06](06-ui-flows.md)).
- Roster import: CSV/XLSX, column mapping preview, NRIC → gender derived in the
  browser and the number discarded, a "needs tagging" list for the rest.
- **Formation**: the six-term cost function and seeded annealing from
  [03](03-team-formation.md), in `packages/core/formation`. Runs on the device.
- Team proposal with the quality summary, drag-to-move override, commit.
- Projectable team board.

**Participant**
- Join by link or QR, language toggle.
- Name autocomplete with department shown, claim locked to the device.
- Team number screen — large type, readable across a room.

**Demo moment.** Paste an itinerary, drop in 40 names, press one button: eight
teams, balanced on gender and department, zero repeat pairings, with the reasons
shown. Then open it on a phone and see a team number. That is the moment a partner
stops thinking "spreadsheet".

---

## Stage 2 — The evaluation cycle

**Core** — derangement generation with the no-repeat-ratee constraint
([03](03-team-formation.md#never-rating-the-same-person-twice)), with the `k ≥ 8`
sampling path since teams run 5–10.

**Facilitator** — open and close the evaluation window, live `41 / 48 submitted`
with names outstanding.

**Participant** — one criterion per screen, 1–5 with text anchors, then the round's
rotating nomination question as tappable teammate rows (not a dropdown), then done.
Local-first write: the submission commits to IndexedDB before any network call.

Only raw means are shown at this stage. The bias correction is invisible in a demo
and belongs with the measurement work.

---

## Stage 3 — Currency

**Facilitator** — record result (placing / score / neither), award per-member
amounts with a saved preset, undo a whole batch, finalise a round. Redemption
counter with the lease.

**Participant** — pending amount shown while locked, released the instant they
submit, with the earning history beneath it.

All currency writes go through the Postgres functions already in
`supabase/migrations/20260101000100_currency_functions.sql` — `redeem_balance`,
`release_pending_awards`, `finalise_round`, `claim_redemption_lease`. Those are
written; Stage 3 is the UI and API routes over them.

**Demo moment.** Your partner submits an evaluation on their phone and watches 50
coins land. That is the engagement mechanic they already understand from running
events, working in software.

---

## Stage 4 — Brand and polish pass

Apply the palette properly, tune the typographic scale, make the team number and
the currency release feel deliberate. Worth doing as you go rather than retrofitting
— but worth a dedicated pass before the demo.

---

## Stage 5 — After the demo

The work that makes the analytics defensible, in roughly this order:

1. Bias-corrected scoring and the composite engagement score ([04](04-scoring-and-bias.md)).
2. The four client-report analyses ([13](13-client-report.md)).
3. The statistical study — 3/4/6 rounds × teams of 5/8/10 — so you can tell a client
   up front what their configuration supports.
4. Offline service worker and the catch-up prompt.
5. Bahasa Malaysia participant flow.
6. Photos, withdrawal handling, multi-day programmes.
7. Property tests across the formation and ledger invariants.

Items 1–3 are what let you sell the measurement honestly. Nothing before them
should be described to a client as validated.

---

## What to tell your partner

One thing worth being straight about, because a branded working app invites the
assumption that it is nearly finished: **the day-running tool will be real; the
measurement is not yet proven.** The team formation genuinely works and the currency
mechanic genuinely works. Whether the peer ratings measure what they claim to needs
a dozen real events to establish — and the plan for establishing it is written down,
which is a better position than most products are in at a demo.

Also: demo with a **fake namelist**. Running a real client's names and NRICs through
a pre-release app is the one shortcut with a legal tail.
