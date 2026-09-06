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
                        P-6 Nominate (one screen per question)
                        ┌──────────────┐
                        │ Who helped   │
                        │ the team     │
                        │ decide what  │
                        │ to do?       │
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
                        "Thanks — saved."
                        (sync state shown discreetly)
```

### Screen notes

**P-2 Name.** The single highest-risk screen: 60 people doing this at once, in
the first two minutes, sets the tone for the whole product.
- Match on any token, case- and accent-insensitive: "tan" finds "Alina Tan"; "ali"
  finds her too.
- Always show department beside the name — it is what disambiguates the three
  John Lims (R3).
- Names already claimed by another device are shown greyed with "already joined,"
  not hidden. Hiding them makes a person think they are missing from the list and
  brings them to the facilitator; showing them explains the situation.
- "I'm not on the list" at the bottom → free-text name + department picker, and
  the person is flagged as a walk-in for the facilitator (R5).

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

**P-7 Done.** Sync state is shown, quietly: "Saved · will send when you're back
online." Never a blocking spinner, never an error the participant has to act on.
Sync is the app's problem, not theirs.

## Facilitator flow

```
  F-1 Events list ──► F-2 Event setup ──► F-3 Round planner ──► F-4 Live round ──► F-5 Analytics
                       roster import        team size, count      join board          scores
                       criteria template    coverage forecast     form / review       nominations
                       leadership flags     seed                  commit              coverage
                                                                  open evaluation     export
```

**F-2 Event setup — roster import.** Drag a CSV or XLSX in. The importer must
show a mapping preview (which column is the name? the department?) and a warning
list before committing: duplicate names, blank departments, unrecognised
leadership values. Real client namelists are messy; an importer that fails
silently on a BOM or a "Tan, Alina" ordering will cost a facilitator twenty
minutes on the morning of an event (R2).

**F-3 Round planner — the coverage forecast.** As the facilitator adjusts team
size and number of rounds, show the live arithmetic from
[03](03-team-formation.md#the-coverage-ceiling---tell-the-facilitator-this-up-front):

> 48 people · teams of 6 · 4 rounds
> **Each person will meet at most 43% of the room.**
> 10 rounds would be needed for everyone to meet everyone.
> *Larger teams or more rounds increase this.*

This one panel does more for the client relationship than any algorithm, because
it replaces a promise you cannot keep with a number you can plan around.

**F-4 Live round.**
- Join board: `41 / 48 joined`, with the 7 missing names listed so they can be
  called out by name.
- **Form teams** → shows the *proposal* with a quality summary ("0 repeat
  pairings · 2 teams with 2 from Engineering · leadership spread OK") and
  drag-to-move override. Re-roll with a new seed is one tap.
- **Commit** publishes teams and rating assignments.
- **Open evaluation** → live counter `41 / 48 submitted`, with names of who
  hasn't, so the coach can nudge the room. Close manually or on a timer.

**F-5 Analytics.** Per criterion: adjusted score, raw mean, n, and confidence
band — always together, never the adjusted score alone (see
[04](04-scoring-and-bias.md#final-reported-score)). Nomination indices. Team
comparison. The coverage matrix. Export to XLSX.

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
