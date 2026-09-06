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
- **F9** I see analytics: per-person adjusted scores, per-team scores, nomination
  counts, mixing coverage ("every participant has now worked with 71% of the
  room").
- **F10** I export the event as CSV/XLSX for the client report.
- **F11** The app keeps working when the venue wifi dies mid-event.

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

## Functional requirements

### Roster and identity
- **R1** Import roster from CSV/XLSX. Required column: `name`. Optional:
  `department`, `is_leadership`, `employee_ref`, `email`, `notes`.
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
- **R9** Soft objectives, weighted: department mix, novel pairings, size balance,
  leadership spread across rounds. Full spec in [03](03-team-formation.md).
- **R10** Deterministic given a seed — the same inputs reproduce the same teams,
  so a result can be explained and audited.
- **R11** Runs on the facilitator's device in under 2 seconds for 200 people,
  with no network.
- **R12** Late arrivals and drop-outs can be added/removed between rounds without
  reshuffling everyone.

### Evaluation
- **R13** Facilitator opens an evaluation window; it can be closed manually or on
  a timer.
- **R14** Each participant is assigned exactly one teammate to rate (see
  [00](00-decisions.md), open question 1).
- **R15** Three Likert criteria, 1–5, labels configurable per event template.
- **R16** Zero or more nomination questions, each answered by picking one
  teammate. Self-nomination disabled by default.
- **R17** Partial submissions are saved as drafts locally and can be resumed.
- **R18** A participant cannot submit twice for the same round; re-opening shows
  their existing answer read-only.

### Analytics
- **R19** Raw mean, bias-adjusted score, and a confidence indicator per person
  per criterion. Full method in [04](04-scoring-and-bias.md).
- **R20** Nomination counts normalised for the number of times a person was
  eligible to be nominated.
- **R21** Team-level cohesion and spread.
- **R22** Mixing coverage matrix — who has worked with whom, and the percentage
  of all possible pairs realised.
- **R23** Every reported number carries an *n* and is suppressed below a
  configurable minimum (default n < 3 shows "insufficient data", never a score).

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
- Cross-event longitudinal tracking of individuals (see open question 3)
- Client-facing self-serve portal
- Multi-language UI (design for it; ship English)
