# 06 — UI Flows

## Design constraints that drive everything

- **The smallest supported viewport is 320 × 360 CSS px** — a watch browser. Every
  participant screen must be usable there, which means one question visible at a
  time, no horizontal scroll, no side-by-side layout.
- **One thumb, standing up, possibly outdoors, possibly slightly out of breath.**
  Minimum 44 px tap targets, high contrast, no small close buttons.
- **Under 30 seconds** for a full evaluation submission.
- **No typing after the first screen.** Name entry is the only keyboard moment in
  the entire participant experience.

### A note on dropdowns

The brief mentions a dropdown for the nomination questions. On a watch-sized
screen a native `<select>` is genuinely bad: it opens an OS overlay that covers
the whole screen, the rows are small, and on some Android builds it is nearly
unusable at that width. Use instead a **full-width list of teammate rows**, each
44 px+ tall, tapped once to select. Same information, one tap instead of three,
and it works identically at 320 px and 1200 px. With teams of 4–6 the whole list
fits without scrolling.

## Participant flow

```
   [QR / link]
        │
        ▼
   P-1 Join ──────────► P-2 Name ──────────► P-3 Waiting
   enter code           type 2-3 letters      "You're in. Hold tight."
   (or skipped              ▼
    if in link)         autocomplete list
                        "Alina Tan · Finance"
                             │
                             ▼
                        P-4 My Team  ◄──── facilitator commits round
                        ┌──────────────┐
                        │              │
                        │   TEAM  7    │  ← 72 px type, the only thing that matters
                        │              │
                        │  with you:   │
                        │  Ben, Chloe, │
                        │  Dev, Erin   │
                        └──────────────┘
                             │
                             ▼   facilitator opens evaluation
                        P-5 Rate  (3 screens, one criterion each)
                        ┌──────────────┐
                        │ Rate CHLOE   │
                        │              │
                        │ "Made it     │
                        │  easier for  │
                        │  others to   │
                        │  contribute" │
                        │              │
                        │ ①②③④⑤       │  ← 5 targets, 56 px tall, full width
                        │ Rarely  Always│
                        │      ●○○     │  ← progress
                        └──────────────┘
                             │
                             ▼
                        P-6 Nominate (one question, rotates each round)
                        ┌──────────────┐
                        │ Who did the  │
                        │ work nobody  │
                        │ else wanted? │
                        │              │
                        │ ┌──────────┐ │
                        │ │ Ben      │ │  ← 44px rows, tap to pick
                        │ │ Chloe    │ │
                        │ │ Dev      │ │
                        │ │ Erin     │ │
                        │ └──────────┘ │
                        │   Skip       │
                        └──────────────┘
                             │
                             ▼
                        P-7 Done
                        ┌──────────────┐
                        │   Thanks!    │
                        │              │
                        │   +50 coins  │  ← released, animated in
                        │   released   │
                        │              │
                        │  YOUR BANK   │
                        │     170      │  ← 56 px
                        │    coins     │
                        └──────────────┘
                        (sync state shown discreetly)
```

### Screen notes

**P-1b Photo (optional).** After picking their name, one tap to take a photo so the coach
can put a face to the name, and an equally prominent **Skip**. Resized on-device before
upload, upload non-blocking. Skipping costs nothing — not currency, not participation, not
engagement score — and the screen says so, because some people will decline for personal or
religious reasons and must not be left wondering what it cost them.

**P-2 Name.** The single highest-risk screen: 60 people doing this at once, in
the first two minutes, sets the tone for the whole product.
- Language toggle (BM / English) sits here, before anything else is read.
- Match on any token, case- and accent-insensitive: "tan" finds "Alina Tan"; "ali"
  finds her too.
- Always show department beside the name — it is what disambiguates the three
  John Lims (R3).
- Names already claimed by another device are shown greyed with "already joined,"
  not hidden. Hiding them makes a person think they are missing from the list and
  brings them to the facilitator; showing them explains the situation.
- "I'm not on the list" at the bottom → free-text name + department picker, and
  the person is flagged as a walk-in for the facilitator (R5).

**Withdrawn state.** A participant marked as left sees a terminal screen —
*"You've been marked as left. Thanks for joining us."* — rather than a stale team
number for an activity that is not coming. Marked returned, it reverts to normal on
next sync. This is the only participant screen that exists purely because of
[11](11-mid-event-changes.md); everything else about withdrawal is handled on the
facilitator's device.

**P-4 My Team.** This screen exists to be readable at arm's length in a noisy
room. The team number is enormous; everything else is secondary. It is also the
screen most people will have open when the wifi is worst, so it renders entirely
from cache and shows a small "last updated" line rather than a spinner.

**P-5 Rate.** One criterion per screen rather than three stacked. Three separate
taps with big targets beat one screen of small ones on a 320 px viewport, and
the per-screen framing measurably reduces straight-lining (giving everyone the
same number down the column) — which is the single biggest threat to the data
quality this product sells.

Before the first rating of the event, a one-time interstitial states plainly:
*"Chloe will never see who rated her or what you said. Your coach can see it.
It's used to give the group feedback, not to rank anyone."* (R-P8). This is both
an ethical obligation and a data-quality measure — people rate more honestly when
they know the rules.

**P-0 Catch-up prompt.** Shown on app open to anyone with an outstanding evaluation
from a round that is closed but not finalised — the dead-battery case. It names the
round, shows the currency waiting, and offers **Complete now** or **Later**. It takes
them into the ordinary evaluation flow; nothing about it is a special screen beyond
the entry point. This is the one participant-side addition of any substance in the
whole withdrawal / non-response design.

**P-7 Done — and the release.** The release is the moment worth designing. The
pending amount moves into the balance while the participant is still looking at the
screen, and it should be unmistakable — this is the engagement payload, and a delayed
or silent release teaches nothing. Where currency is enabled, this screen carries the
participant's own balance and the list of how it was earned. The history is not
decoration: "+50 — Team 3, 1st place, Blindfold Maze" is the engagement payload,
and it is the cheapest possible dispute resolution when someone thinks they are
short at the counter. Own balance only — no leaderboard, nobody else's number.

Sync state is shown, quietly: "Saved · will send when you're back
online." Never a blocking spinner, never an error the participant has to act on.
Sync is the app's problem, not theirs.

## Facilitator flow

```
  F-1 Events list ──► F-2 Event setup ──────► F-3 Day planner ──► F-4 Live activity ──► F-5 Analytics
                       itinerary paste         confirm activities   join board            engagement
                       activity library        coverage forecast    form / review         nominations
                       roster import           payout preset        commit                coverage
                       gender tagging          seed                 open evaluation       report
                       criteria template                            record result
                       leadership flags                             award currency
                                                                    team observation
                                                                          │
                                                                          ▼
                                                                    F-6 Redemption counter
```

**F-2 Event setup — itinerary paste.** The fastest path into a configured day, and the
screen that most serves "most decisions automated". Paste the run-sheet you already write
for every event:

```
┌──────────────────────────────────────────────┐
│ Paste the day's itinerary                    │
│ ┌──────────────────────────────────────────┐ │
│ │ 0900  Welcome & briefing                 │ │
│ │ 0930  Ice Breaker Circle                 │ │
│ │ 1000  Blindfold Maze                     │ │
│ │ 1100  Tower Build                        │ │
│ │ 1230  Lunch                              │ │
│ │ 1400  Raft Race                          │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ Found 4 activities, 2 breaks                 │
│                                              │
│ ✓ Ice Breaker Circle   teams of 8 · library  │
│ ✓ Blindfold Maze       teams of 5 · library  │
│ ✓ Tower Build          teams of 10 · library │
│ ? Raft Race            not in library  [add] │
│ – Welcome & briefing   not an activity       │
│ – Lunch                not an activity       │
│                                              │
│            [ Build the day ]                 │
└──────────────────────────────────────────────┘
```

Time patterns in run-sheets are highly regular, so extracting `HH:MM` plus a title needs
no cleverness and no external service. Names are fuzzy-matched against the activity
library, which supplies team size, competitiveness and duration; anything unmatched is one
tap to add, so the library builds itself through ordinary use. Rows whose times overlap
become one session automatically.

Everything is editable in the preview. The screen configures the day; the facilitator
confirms it.

**F-2b Roster import.** Drag a CSV or XLSX in. The importer must
show a mapping preview (which column is the name? the department? the NRIC?) and
a warning list before committing: duplicate names, blank departments,
unrecognised leadership values. Real client namelists are messy; an importer that
fails silently on a BOM or a "Tan, Alina" ordering will cost a facilitator twenty
minutes on the morning of an event (R2).

The preview must state the derived gender split explicitly:

> **Derived from NRIC:** 34 male · 26 female · **2 unreadable**
> *NRIC numbers are used to determine gender and are not saved.*

Both halves of that panel matter. The counts let a facilitator catch a parsing
failure before it becomes a room full of wrong teams; the second line is what you
show a client who asks what you did with their staff ID numbers. The 2 unreadable
rows appear in a **Needs tagging** list with male / female / unspecified buttons —
a few taps, done once, before the event.

**F-3 Day planner — the coverage forecast.** Team sizes come from the activities, so the
planner shows what the planned day actually reaches and what changing an activity's size
would do. Show the live arithmetic from
[03](03-team-formation.md#the-coverage-ceiling---tell-the-facilitator-this-up-front):

> 60 people · 4 activities · teams of 8, 5, 10, 6
> **Each person will meet at most 42% of the room.**
> All four at teams of 10 would reach 61%.
> *Larger teams raise coverage and weaken individual ratings — see docs/03.*

This one panel does more for the client relationship than any algorithm, because
it replaces a promise you cannot keep with a number you can plan around.

**F-4 Live round.**
- Join board: `41 / 48 joined`, with the 7 missing names listed so they can be
  called out by name.
- **Form teams** → shows the *proposal* with a quality summary and drag-to-move
  override. Re-roll with a new seed is one tap. The summary reads:

  > **0 repeat pairings · 0 repeat evaluations · gender within 1 of target on all
  > teams · 2 teams with 2 from Engineering · leadership spread OK**

  "0 repeat evaluations" is the line that answers the question participants
  actually ask, so it is stated every round rather than assumed.
- **After the activity**, one card: a 1–5 read on how the team worked, plus any
  individual to flag with a note. Participant photos appear beside names throughout, which
  is what makes "who deserves credit" answerable at speed in a room of 60.
- **Commit** publishes teams and rating assignments.
- **Open evaluation** → live counter `41 / 48 submitted`, with names of who hasn't,
  so the coach can nudge the room. Close manually or on a timer.
- Each outstanding name shows its pending amount and carries a one-tap **Excuse**
  (`technical` / `facilitator`), which releases the currency and removes the round
  from the person's participation denominator. Use it for people who cannot catch up
  at all; everyone else gets the automatic prompt.
- **Finalise round** is a separate, later action — at a break or the end of the day.
  It closes catch-up and forfeits unreleased awards, and the button says so plainly:
  *"Finalise — 3 people still outstanding, 150 coins will be forfeited."* This is the only moment anyone will realistically use it, so it lives
  on the chase list rather than buried in a settings screen. Everyone left
  unexcused when the window closes is recorded as not having submitted — a fact, not
  a verdict.

**F-4 Live round — marking someone out.** Every participant row on the join board
carries a **Mark as left** action, and withdrawn rows carry **Mark as returned**.
No dialog, no reason required, no confirmation — in the moment someone is being
walked to a first-aid room, a confirmation step is an obstacle. It is reversible,
which is what makes skipping the confirmation safe.

Withdrawn participants show greyed on the board with the time they left, so a
facilitator glancing at "41 of 48 joined" can see the denominator moved and why.

**F-6 Redemption counter.** Opened at a fixed time, on one designated device. A
searchable list of everyone with a balance, largest first, with the participant's
department shown beside each name — because the person in front of you may be one
of two John Lims and that is the moment it matters.

```
┌─────────────────────────────────────┐
│ Redemption · open · this device      │
│ ┌─────────────────────────────────┐ │
│ │ 🔍 joh                           │ │
│ └─────────────────────────────────┘ │
│  John Lim · Operations      120  →  │
│  John Lim · Sales            80  →  │
│                                     │
│  Last: Alina Tan · 140 · [ Undo ]   │
└─────────────────────────────────────┘
```

Tapping a row shows the balance large, with a single **Redeemed** button that
zeroes it. The most recent redemption stays on screen with an **Undo** — the
mis-redemption is caught seconds after it happens or not at all, so the undo
belongs in front of the facilitator, not buried in a history screen.

Other facilitator devices show "redemption is open on another device" and cannot
create redemption entries. See
[10](10-currency.md#offline-at-the-counter) for why.

**F-5 Analytics.** Two distinct surfaces, because they have two different
audiences and only one of them leaves the room:

- *Facilitator view.* The engagement score with its components always on the same
  row, never the composite alone:

  > **Wei Ling — engagement 62**
  > peer 4.1 (n = 4) · participation **1 of 4** · nominations 2 (index 2.0)

  The composite is what makes a 60-person list scannable; the components are what
  make a low one actionable. A row whose `peer` component is below `min_n` shows no
  composite at all and cannot be sorted into a ranking. Also per criterion: adjusted
  score, raw mean, n, confidence band. Nomination index overall and by trait tag.
  Team comparison. Coverage matrix.
- *Client export.* Team-level patterns, the per-round nomination highlights
  ("Round 2, *who did the work nobody else wanted* — named by 3: Farid"), and the
  `LEAD` / `WORK` / `SOCIAL` profile shape for people who stood out. **No
  per-person scores, no ranking.** Generating it is a separate, deliberate action
  from viewing the facilitator numbers, so the two can never be confused.

Where `n` is too low, the cell reads "insufficient data" and cannot be sorted or
ranked. That is a deliberate friction: it stops the facilitator from
accidentally presenting a number the data does not support.

## Responsive strategy

One codebase, three layouts, driven by container width:

| Width | Layout |
|---|---|
| < 400 px (watch, small phone) | Single column, one question per screen, 72 px team number |
| 400–900 px (phone, tablet) | Same flow, more breathing room, teammate list visible alongside |
| > 900 px (facilitator laptop) | Multi-pane: roster + teams + live status side by side |

Participant screens are built at 320 px first and allowed to grow. Facilitator
screens are built at laptop width and allowed to shrink to tablet — a facilitator
running an event from a phone is supported but is not the design target.

## Accessibility

- Every rating control is a labelled radio group, keyboard-operable, with an
  accessible name that includes the ratee and the criterion.
- The 1–5 scale carries text anchors, not just numbers or colour.
- Nothing conveys meaning by colour alone (outdoor glare and colour vision
  deficiency both defeat it).
- Contrast target AA at minimum; the team-number screen should be readable in
  direct sunlight, which in practice means near-black on near-white, not brand
  colours.
