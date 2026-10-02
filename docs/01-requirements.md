# 01 — Requirements

## Actors

| Actor | Device | Auth | Frequency |
|---|---|---|---|
| **Facilitator / coach** | Own phone or tablet; laptop for setup | Real account (email + password) | Runs many events |
| **Participant** | Own phone (browser) | None — name selection + device token | One event, ~2 hours |
| **Admin / ops** (you) | Laptop | Real account, elevated | Manages facilitators, templates, billing |
| **Client viewer** (v2) | Laptop | Read-only, per-event link | Once, post-event |

Participants deliberately have **no accounts and no passwords**. Anything that
requires a participant to remember a credential will fail in a room of 60 people
with 4 minutes to get started.

## Core user stories

### Facilitator

- **F1** As a facilitator I import a namelist from CSV or Excel before the event,
  so participants only have to type two letters of their name on the day.
- **F2** I mark which people are leadership, and which department each person is
  in, so the app can spread them.
- **F2b** Gender is read from the roster — or derived from the NRIC where the
  namelist has one — so teams come out evenly mixed without me splitting the room
  into two lines. Anyone the import couldn't determine is flagged for me to tag
  before the event.
- **F3** I create an event with a short join code and a QR code I can project.
- **F4** I see, live, who has joined and who has not, so I can chase stragglers.
- **F5** I press one button to form teams for the next round, and I can see the
  proposed teams *before* they go live.
- **F6** I can manually override any team assignment (drag a person to another
  team) — because someone always arrives late, leaves early, or must be with
  their translator.
- **F7** I trigger the evaluation prompt at the end of an activity; all
  participants' phones show the evaluation immediately (or on next sync).
- **F8** I see live completion ("41 of 48 submitted") and can close the round.
- **F8b** I record which team won an activity — placing, raw score, or neither —
  and award currency to each member of each team as a per-member amount, so uneven
  team sizes need no arithmetic from me.
- **F8c** I undo a whole award in one tap when I pick the wrong team.
- **F8d** At a fixed time I open a redemption window, hand a participant physical
  currency at the counter, and tap once to zero their balance — and I can undo
  that if I zeroed the wrong person.
- **F9** I see analytics: per-person adjusted scores, per-team scores, nomination
  counts, mixing coverage ("every participant has now worked with 71% of the
  room").
- **F10** I export the event as CSV/XLSX for the client report.
- **F11** The app keeps working when the venue wifi dies mid-event.
- **F12** When someone falls ill or has to leave, I mark them inactive on my own
  device and the next round forms without them — and I can mark them back in when
  they return.
- **F13** When someone's phone dies or they genuinely couldn't submit, I excuse that
  round for them in one tap so it never counts against their engagement. Anyone who
  was present and simply didn't submit is counted, and I can see who.

### Participant

- **P1** I open a link or scan a QR code — no download, no login, no app store.
- **P2** I type "ali" and pick "Alina Tan (Finance)" from an autocomplete list.
- **P3** I see my team number in large type, and the names of my teammates.
- **P4** When the coach triggers it, a prompt appears asking me to rate one named
  teammate on three criteria, 1–5.
- **P5** I answer one or two nomination questions by picking a teammate from a
  list ("Who took charge this round?").
- **P6** I submit in under 30 seconds, on a small screen, with one thumb.
- **P7** My submission is saved even with no signal, and syncs later without me
  doing anything.
- **P8** I am told, before I rate anyone, who can see my answers.
- **P9** I see my own currency balance and exactly how I earned it, so I know what
  I am owed before I reach the counter. I never see anyone else's.

## Functional requirements

### Roster and identity
- **R1** Import roster from CSV/XLSX. Required column: `name`. Optional:
  `department`, `gender`, `nric`, `is_leadership`, `employee_ref`, `email`, `notes`.
- **R1b** Where an NRIC column is present, derive gender from the final digit
  (odd = male, even = female), show the derived split in the import preview, and
  **discard the number** — never persisted, never transmitted, never on a device.
  Full rules in [00](00-decisions.md#nric-handling---read-this-before-writing-the-importer).
- **R1c** Participants whose gender could not be determined are listed on the
  setup screen for the facilitator to tag, and are spread as their own group until
  tagged.
- **R2** Import must survive messy real-world files: BOM, trailing blanks,
  inconsistent header case, duplicate names, "Tan, Alina" vs "Alina Tan".
- **R3** Duplicate names must be resolvable — surface department in the picker
  so "John Lim (Ops)" and "John Lim (Sales)" are distinguishable.
- **R4** Autocomplete matches on any token, case- and accent-insensitive, and
  works fully offline.
- **R5** A participant not on the roster can be added on the spot ("I'm not on
  the list") — with a facilitator-visible flag.
- **R6** Once a participant claims a name, that name is locked to their device
  token for the event; a second device claiming it needs facilitator approval.

### Team formation
- **R7** Form teams of a target size, with configurable min/max.
- **R8** Hard constraint: at most *N* leadership members per team (default 1).
- **R9** Soft objectives, weighted in this priority order: **gender balance >
  department mix > novel pairings > even sizes**, plus leadership spread. Gender
  is spread evenly in proportion to the room's actual ratio. Full spec in
  [03](03-team-formation.md).
- **R10** Deterministic given a seed — the same inputs reproduce the same teams,
  so a result can be explained and audited.
- **R11** Runs on the facilitator's device in under 2 seconds for 200 people,
  with no network.
- **R12** Late arrivals and drop-outs can be added/removed between rounds without
  reshuffling everyone.
- **R12b** Marking someone as left — and as returned — is one tap on the
  facilitator device and works offline. Returning preserves their pairing and
  rating history so it is not a loophole around the no-repeat guarantees. Full
  spec in [11](11-mid-event-changes.md).

### Evaluation
- **R13** Facilitator opens an evaluation window; it can be closed manually or on
  a timer.
- **R14** Each participant is assigned exactly one teammate to rate, by a
  derangement of the team, so every member is rated exactly once.
- **R14b** A participant is **never** assigned to rate someone they have already
  rated in this event. Enforced as a hard constraint on the derangement search;
  the round summary reports the count (expected: 0).
- **R15** Three Likert criteria, 1–5, labels configurable per event template.
- **R16** One nomination question per round, drawn automatically from a rotating
  bank of positive-trait questions so each round surfaces a different trait
  ([09](09-question-bank.md)). Answered by picking one teammate; self-nomination
  disabled; "no one in particular" always available.
- **R17** Partial submissions are saved as drafts locally and can be resumed.
- **R18** A participant cannot submit twice for the same round; re-opening shows
  their existing answer read-only.

### Analytics
- **R19** Raw mean, bias-adjusted score, and a confidence indicator per person
  per criterion. Missing ratings are never imputed — `n` drops and shrinkage
  absorbs it.
- **R19b** Composite engagement score — `peer`, `participation` and `recognition`
  components, weighted at event setup, with every component always displayed beside
  the composite. Never the composite alone.
- **R19c** No composite is computed when its `peer` component is below
  `min_n_to_display`; `participation` requires ≥2 assigned evaluations to enter it.
- **R19d** One-tap excuse per person per round (`technical` / `facilitator`) removing
  that round from the participation denominator.
- **R19e** No surface states a reason for a non-submission. "Did not submit" only.
- **R19f** Participants never see their engagement score or any component of it. Full method in [04](04-scoring-and-bias.md).
- **R20** Nomination index normalised by rounds played, aggregated overall and by
  trait tag (`LEAD` / `WORK` / `SOCIAL`). Per-question results shown as named
  highlights, never as scores.
- **R20b** The client deliverable contains team-level patterns and a positive-only
  highlights list. Per-person adjusted scores stay on the facilitator's screen.
- **R21** Team-level cohesion and spread.
- **R22** Mixing coverage matrix — who has worked with whom, and the percentage
  of all possible pairs realised.
- **R23** Every reported number carries an *n* and is suppressed below a
  configurable minimum (default n < 3 shows "insufficient data", never a score).

### Results and currency

Specified in full in [10](10-currency.md), requirements **C1–C12**. The headlines:
results and awards are separate actions; the award amount is per member rather
than a pot; balances are derived from an append-only integer ledger and never
stored as an authoritative number; every action is reversible; redemption uses a
compare-and-set and is restricted to one device per window; balances persist for
the life of a programme.

## Non-functional requirements

| # | Requirement | Target |
|---|---|---|
| N1 | First meaningful paint on a mid-range Android over 3G | < 2.5 s |
| N2 | JS bundle, gzipped, participant route | < 150 KB |
| N3 | Works offline after first load | All participant flows |
| N4 | Smallest supported viewport | 320 × 360 CSS px (watch-browser class) |
| N5 | Minimum tap target | 44 × 44 CSS px |
| N6 | Contrast | WCAG AA, and legible in direct sunlight (outdoor events) |
| N7 | Concurrent participants per event | 300 |
| N8 | Sync convergence after connectivity returns | < 10 s |
| N9 | Data retention | 90 days identified, then aggregate-only (configurable) |
| N10 | Accessibility | Keyboard reachable, screen-reader labelled, no colour-only meaning |

## Explicitly out of scope for v1

- Native Wear OS / watchOS app
- Real-time chat or messaging between participants
- Photo or video capture
- Cross-*programme* longitudinal tracking of individuals (within a programme is
  supported, because balances require it)
- Any in-app shop, catalogue, stock tracking or auction — currency leaves the app
  as physical money at the counter
- Client-facing self-serve portal
- Multi-language UI (design for it; ship English)
