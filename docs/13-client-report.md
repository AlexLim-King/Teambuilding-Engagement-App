# 13 — The Client Report

Four analyses, all derivable from data the app already collects, all at team or event
level — so they sit inside the existing posture that per-person scores stay on the
facilitator's screen ([00](00-decisions.md)).

## One honest caution first

The goal of "more charts and matrices so the report looks substantial" is understandable
and it is also the main way a report like this goes wrong. Volume is not credibility.
An L&D buyer who knows statistics will spot padding immediately, and the one who
doesn't will act on a number that cannot support the decision.

The four analyses below are **genuinely substantive** — each answers a question a client
actually asked when they booked the day, and each rests on enough data to say something.
Use them. The rule to hold is: **every chart answers a question the client asked.** A
fifth chart added for density weakens the four that earned their place.

Where the data cannot support a finding, the strongest thing the report can do is say so.
"Four ratings per person is not enough to rank individuals, so here is what we can say
about the group" is the sentence that makes a sceptical buyer trust the rest of it.

---

## 1. Round-over-round trend — "did the day work?"

The most saleable finding here, and nearly free.

| Plots | Per round |
|---|---|
| Participation | % of assigned evaluations submitted |
| Peer ratings | Mean adjusted score per criterion |
| Recognition spread | How many distinct people were nominated |

**What it answers.** Did engagement build through the day or fade after lunch? Did the
group warm up — more people being nominated in later rounds as they got to know each
other? Did participation collapse at round 4 because the room was tired, or because the
activity was poor?

**How it misleads.** Activities differ, so a dip may be about that activity rather than
the group. Label the rounds with activity names and never present the line without them.
With four rounds there are four points — a direction, not a trend line; resist fitting a
curve to four numbers.

**Strongest version.** Recognition spread rising across the day is the single most
on-message number this product can produce, because it is direct evidence of the stated
purpose: more people being seen by more teammates as the day goes on.

---

## 2. Department bridge matrix — "did we break the silos?"

A department × department matrix of how many cross-department pairings actually occurred,
plus the share of all possible department pairs realised at least once.

**What it answers.** Exactly what a client who bought "break down silos" asked for, and it
proves the mixing algorithm did its job rather than asserting it.

**How it misleads.** It measures *opportunity*, not relationship. Two people on the same
team for 30 minutes have been introduced, not connected. The report must say "worked
together", never "built a relationship".

A second trap: large departments have more pairings available by arithmetic alone, so a
raw count makes the biggest department look most bridged. Normalise against the possible
pairs for each department pair, or the matrix just restates the headcount.

**Strongest version.** Naming the pairs that **never** met — "Finance and Operations
shared a team twice; Finance and Engineering never did" — is more actionable than any
count, and it sets up next year's event.

---

## 3. Leader present vs. absent — "does separating leaders matter?"

Compare teams containing a leadership member against teams containing none, on adjusted
peer ratings per criterion and on win rate.

**What it answers.** It interrogates your own design decision to spread leaders, which is
unusual and good — most tools assert their rules rather than testing them. And the result
is interesting either way: if leaderless teams rate each other higher on `direction`, that
is a genuine finding about emergent leadership and a strong talking point.

**How it misleads.** At 8 teams per round across 4 rounds you have ~32 team-observations,
split unevenly. That is thin. Report it with the group sizes visible, as a difference with
a range rather than a point estimate, and expect it to say nothing conclusive from a single
event. It accumulates across events, which is where its value is.

Confounding worth stating: leaders are not randomly distributed through a company. They are
more senior, often older, and in different departments. "Teams with a leader" differs from
"teams without" in more ways than the leader.

---

## 4. Straight-lining rate — the internal honesty check

Share of submissions where every criterion got the same value, per round, plus the
distribution of time-to-submit.

**What it answers.** Whether the currency gate is buying completion at the cost of signal
([04](04-scoring-and-bias.md#what-gating-currency-on-submission-does-to-the-data)). It is
the number that tells you whether to trust the other three.

**Never per person.** A fast reader and a careless one are indistinguishable, and this
metric exists to audit the instrument, not the participants. No individual is ever flagged,
and this section does not belong in a client-facing report at all — it is yours.

**What to watch.** The trend across events after the currency gate goes in. If
straight-lining climbs, the lever is reward size or question wording, not enforcement.

---

## What the report does not contain

- Per-person scores or rankings of any kind.
- Any "bottom performer" view.
- Anyone's participation rate, or any inference about why someone did not submit.
- Participant photos.
- A single composite "team engagement score" presented without its components.

## Report structure

1. **What we did** — headcount, activities, teams, how teams were formed.
2. **Did the day work** — the round-over-round trend (§1).
3. **Who met whom** — the bridge matrix and coverage, with the pairs that never met (§2).
4. **Who stood out** — positive-only nomination highlights per round, by name, drawn from
   the rotating question bank ([09](09-question-bank.md)). This is the section clients read
   first and remember.
5. **What we noticed** — the facilitator's own observations and "notice this person" notes.
   Human, specific, and the part no competitor can copy.
6. **What the data can and cannot tell you** — stated plainly, with `n`. The section that
   makes the rest credible.

§4 and §5 carry the emotional weight; §2 and §3 carry the evidence. A report that leads
with a matrix and buries the names has the order backwards.

## Build note

The visual design of these charts is deliberately not specified here. When M4 is built,
work the chart design properly at that point rather than inheriting whatever the first
library produces — the report is a client-facing deliverable and its credibility is partly
visual.
