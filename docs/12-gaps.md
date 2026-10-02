# 12 — Known Gaps

An audit of what the preceding documents do not address. Ordered by what it would
cost to discover late rather than by how interesting it is.

---

## A. The strategic gap: which product is this?

Three products are tangled together in this specification, and nothing decides which
one is the business.

| | What it is | What it's worth | Difficulty |
|---|---|---|---|
| **Ops tool** | Forms teams in seconds, runs the day, handles currency | Saves you 30 minutes an event, looks professional in front of a client | Low. Also easily copied |
| **Measurement product** | Peer evaluation, bias correction, engagement scores, talent spotting | Insight a client cannot get anywhere else | High. Needs validation before it can be sold honestly |
| **Engagement mechanic** | Currency, rotating nominations, the game layer | The day itself goes better | Medium |

They pull against each other in concrete ways already visible in these docs:

- The ops tool wants the day to move fast. The measurement product wants **more
  rounds and more ratings per person**, which slows it down.
- The engagement mechanic wants currency gating completion. That gating
  [threatens the measurement](04-scoring-and-bias.md#what-gating-currency-on-submission-does-to-the-data)
  by rewarding submission over thought.
- The ops tool can ship and sell in months. The measurement product cannot be sold
  with a straight face until a dozen events have validated it.

This does not need resolving to build v1 — all three are served by the same
foundation. It needs resolving to know **what to polish, what to leave rough, and
what to charge for**. A reasonable answer: sell the ops tool and the engagement
mechanic now, give the analytics away as a bonus while it earns its credibility, then
charge for it once the
[win-vs-ratings check](10-currency.md#an-unexpected-benefit-this-is-your-first-validity-check)
says it measures something.

---

## B. Parallel stations — the one that causes rework

**The model assumes one activity at a time for the whole room.** `round` carries a
single `activity_name`, and every team in that round does it.

Large events do not run that way. 100 people split across stations: teams 1–4 at the
rope course, 5–8 at the build challenge, swapping after 30 minutes. That is one time
block containing **two different activities**, which the current schema cannot
express.

Fixing it now is a small change. Fixing it after the facilitator UI is built is not.

```
Round          a time block                     "Session 2, 10:30–11:15"
  └── Activity what a given set of teams did     "Rope Course" / "Build Challenge"
        └── Team
              └── RoundResult, PendingAward
```

Everything else survives: the nomination question stays per round (the same question
works across activities), results and awards move from `round_id` to `activity_id`,
and formation is unchanged because teams are still formed per round.

**This is the one item I would settle before writing any code**, because it touches
the data model, the facilitator screens, and the award flow at once.

---

## C. Multiple facilitators at one event

Waved at in [05](05-architecture.md) with "the facilitator alone, so a version number
suffices." A 100-person event has two or three coaches, and that assumption breaks.

Specifically unaddressed:

- Two coaches forming teams for the same round simultaneously.
- Two coaches awarding the same team (additive, so it silently double-pays).
- Who may finalise a round.
- What a second coach sees while the first is mid-edit.

None of it is hard, but none of it is free either: optimistic version checks on the
round, award idempotency per `(round, team, facilitator action)`, a visible "Ahmad is
editing Round 3", and a role model that says who can finalise and redeem. Redemption
is already single-writer, which is the dangerous case — the rest is correctness and
coordination rather than money.

---

## D. Bahasa Malaysia is probably not a "later"

Filed in [01](01-requirements.md) as out of scope: *"design for it; ship English."* For
a Malaysian corporate audience that is likely wrong, and it is a **data-quality**
issue rather than a nicety. A participant who half-understands "Made it easier for
others to contribute" will straight-line or skip — so the English-only decision
quietly degrades the exact measurement the product is built on, in a way that looks
like disengagement in the report.

The cost is lower than it appears, because of how small the participant app is:

| Surface | Strings | Verdict |
|---|---|---|
| Participant flow | **~40** | Localise for v1. BM at minimum |
| Facilitator app | Several hundred | English is fine. Your staff are fluent |

Localising only the participant side is a day of work, not a milestone. Mandarin and
Tamil can follow the same path once the mechanism exists.

---

## E. The no-phone path

Every participant flow assumes a working smartphone with a browser. There is no
documented path for:

- A participant without a smartphone, or without data.
- A phone too old for a modern browser.
- A cracked screen, a flat battery with no charger, a locked corporate device.
- Someone who simply does not want to use their personal phone for a work activity —
  a refusal that is entirely reasonable and currently indistinguishable from
  disengagement in the report.

**Recommended:** a facilitator proxy-entry screen — the coach enters that person's
evaluation on their own device, flagged `proxy_entered`. Perhaps 1–3 people per event,
a few minutes total, and it closes a hole that otherwise shows up as non-response
against people who did nothing wrong. It also matters for the currency gate: no phone
would otherwise mean no payout.

---

## F. Paper fallback

If the venue has no signal at all, or the facilitator's device fails, there is
currently no documented way to run the event. For a business where a failed event is a
reputational hit, the insurance is cheap:

- **Print team lists** from the facilitator board (it is already designed as a
  projectable display — add a print stylesheet).
- **Printable evaluation slips** with the round's criteria and nomination question.
- **Bulk entry screen** to type the slips in afterwards, flagged `paper_entered`.

Perhaps two days of work, and it converts "the app failed and we improvised badly"
into "we switched to paper and the client never noticed."

---

## G. Facilitator device failure mid-event

The server holds all state, so recovery is possible — but it is not specified, and the
one mechanism that actively blocks it is the single-writer redemption claim from
[10](10-currency.md#offline-at-the-counter). If the counter device dies holding that
claim, nobody can redeem.

Needs: a claim with a **lease and expiry** rather than an indefinite hold, and an
explicit takeover ("Siti's device holds the counter — take over?"). Twenty lines, and
without them a dead phone stops the redemption queue cold.

---

## H. Facilitator observation is a missing data source

Every rating in the system is peer-sourced. The facilitator — a trained observer
watching all day, with no stake in being rated — contributes nothing to the data.

This is a real omission, and not only for coverage: facilitator observation is
**independently sourced**, which means it can be checked against the peer measures the
same way win data can. Two independent sources agreeing is far stronger evidence than
one source being internally consistent.

Keep it cheap or it will not get used mid-event:

- **Per team, not per person** — one or two fields after an activity.
- **A "notice this person" flag** with an optional note, for the participant who did
  something a coach wants remembered. Thirty seconds, and it is often the most
  valuable line in the client debrief.

---

## I. Analytics you already have the data for

None of these need new collection. All are nearly free once M4 exists, and all are
more saleable than an individual score.

| Finding | Why a client cares |
|---|---|
| **Round-over-round trend** — participation and ratings across the day | Answers "did the day work?" with evidence. The single most saleable chart here |
| **Department bridge matrix** — which department pairs actually worked together, which never did | Exactly what a client who bought "break down silos" wants to see |
| **Leader present vs. absent** — do teams with a leadership member rate each other differently, or win more? | Directly interrogates your own design choice to separate them, and it is interesting |
| **Straight-lining rate by round** | Tells you whether the currency gate is costing you signal, per [04](04-scoring-and-bias.md#what-gating-currency-on-submission-does-to-the-data) |

---

## J. Smaller items

- **No "duplicate last event"** flow. You will run near-identical events repeatedly;
  rebuilding the configuration each time is the kind of friction that makes people
  stop using a tool.
- **Admin / multi-facilitator accounts** appear once in [01](01-requirements.md) and
  are never specified. Relevant if you ever use freelance coaches, and it decides
  whether one facilitator can see another's clients.
- **Non-competitive activities.** `placing` is optional, but the currency mechanic
  assumes something to win. Reflection and trust exercises need a participation-only
  award path.
- **No baseline measurement.** "Engagement improved" needs a before. The round-over-
  round trend is the cheapest substitute and may be enough.
- **Export during the event**, so an hour of broken sync plus a lost device is not a
  lost day.
- **Nobody has validated the formation weights.** The defaults in
  [03](03-team-formation.md#cost-function) are reasoned, not tested. M1's simulation
  should report what they actually produce before a client sees a team list.
