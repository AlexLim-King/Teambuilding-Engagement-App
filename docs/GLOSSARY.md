# Glossary

Plain-language definitions for the shorthand used across these documents.
If a term in any doc isn't clear, it should be here — if it isn't, that's a gap
worth flagging.

---

## Milestones

Labels invented for [08-roadmap.md](08-roadmap.md). They aren't industry
standard; they're just numbered stages so we can say "that's M3 work" instead of
re-describing it each time.

| Label | Means |
|---|---|
| **M0** | Answering the remaining decisions. No building. |
| **M1** | The maths, with no screens. Team formation, scoring, the CSV reader — driven from a text command, output read as text. |
| **M2** | Participant screens, working on one phone, no server. |
| **M3** | Facilitator screens + the server, so many phones work together. First version that can run a real event. |
| **M4** | The analytics and the client report. |
| **M5** | Hardening — the unglamorous work that makes it survive real venues. |

**Why M1 has no screens:** the algorithms are the part most likely to be quietly
wrong, and a wrong answer inside a pretty interface is much harder to spot than a
wrong answer printed as text. Building the maths first means you can check the
team lists against your own judgement before anything is dressed up.

---

## Project structure

| Term | Means |
|---|---|
| **PWA** (Progressive Web App) | A website that behaves like an app — participants open a link, it can be added to the home screen, and it keeps working with no signal. No app store, no download. |
| **`packages/core`** | The folder holding pure calculation: form teams, adjust scores, read a namelist. No screens, no database. Both the phone app and the server use the same copy, so they can never disagree. |
| **Monorepo** | One repository holding the app, the server, and `core` together, rather than three separate ones. Stops them drifting out of step. |
| **Repository / repo** | The project's folder on GitHub, with its full history. |
| **Branch** | A parallel line of work. Yours is `claude/team-engagement-tracking-app-xuirk1` — all of this lives there, not on the main line, until you say otherwise. |
| **IndexedDB** | The phone browser's built-in storage. Where a participant's answers sit when there's no signal. |
| **Outbox** | The queue of answers saved on the phone but not yet sent to the server. Drains automatically when signal returns. |
| **Idempotent** | Safe to repeat. Sending the same answer five times leaves one answer, not five — which is what makes patchy wifi harmless. |
| **Service worker** | The browser feature that lets the app load with no connection at all. |

---

## Team formation

| Term | Means |
|---|---|
| **Roster / namelist** | The list of participants imported before the event. |
| **Round** | One activity. A day might have 4 rounds; teams are re-formed for each. |
| **Pairing / pair** | Two specific people being on the same team. "Repeat pairing" = they've been teamed before. |
| **Coverage** | The share of the room a person has been teamed with. 43% coverage = they've worked with 43% of everyone. |
| **Coverage ceiling** | The most that is arithmetically possible given headcount, team size and round count. You cannot beat it with better software. |
| **Cost function** | A single number scoring how bad a proposed set of teams is. Gender imbalance adds to it, repeat pairings add to it, and the app searches for the lowest total. |
| **Weights** | How much each problem counts toward that number. Yours are set so gender balance outranks department mix, which outranks avoiding repeats. |
| **Hard vs. soft constraint** | Hard = must not happen (two leaders on one team). Soft = try to avoid (repeat pairings). |
| **Local search / simulated annealing** | The method: start with a workable arrangement, try thousands of small swaps, keep what improves it. "Annealing" = accepting the occasional worse swap early on, to avoid getting stuck. |
| **Social golfer problem** | The known mathematical problem this is a version of — arrange golfers into foursomes over many weeks so nobody plays with the same person twice. Known to have no perfect general solution. |
| **Seed / deterministic** | A starting number for the randomness. Same seed = same teams, every time. Lets you re-run and prove the teams weren't hand-picked. |
| **Derangement** | A shuffle where nobody gets themselves. Used for rating assignment: everyone rates one teammate, everyone is rated exactly once, nobody rates themselves. |
| **2-cycle** | A and B rating each other in the same round. Banned — it's the only setup that enables direct "you scratch my back". |
| **Solo status** | Being the only person of your group on a team. Known to reduce participation. You chose even spread, which accepts it. |

---

## Scoring

| Term | Means |
|---|---|
| **Likert scale** | A 1–5 agreement/frequency scale. The three criteria questions. |
| **Rater / ratee** | The person giving the rating / the person receiving it. |
| **Leniency (rater bias)** | Some people always score high, some always low. The core problem this app corrects for. |
| **Raw mean** | Plain average of the scores someone received. Simple, and unfair to anyone rated by harsh people. |
| **Adjusted score** | The score after correcting for who happened to rate them. |
| **Two-way additive model** | The correction method: work out each rater's generosity and each person's actual standing *at the same time*, so a rater who happened to get four excellent teammates isn't mistaken for generous. Same family of method used to adjust judges in Olympic scoring. |
| **Shrinkage** | Applying a correction only partly when there's little data behind it. A rater with 12 ratings gets 75% of their correction; one with 2 ratings gets 33%. Stops thin evidence swinging anyone's score. |
| **n** | How many ratings sit behind a number. "n = 4" means four people rated them — thin. The app refuses to display a score below n = 3. |
| **Confidence band / standard error** | The range the true value probably sits in. A score of 3.9 ± 0.6 is a much weaker claim than 3.9 ± 0.1. |
| **Nomination index** | Times named ÷ rounds played. 1.0 = exactly what chance predicts; 2.5 = named two and a half times more often than chance. |
| **LEAD / WORK / SOCIAL** | Tags on the nomination questions. LEAD = took direction; WORK = effort and problem-solving; SOCIAL = inclusion and morale. Lets you say "named on both WORK questions, neither LEAD question" without producing a score. |
| **Ceiling effect** | Everyone scoring 4s and 5s, so real differences get squashed. Normal in friendly settings; fixed by question wording, not by maths. |
| **Halo effect** | One overall impression bleeding into all three criteria, so they measure the same thing. |
| **Connected rating graph** | Enough overlap in who-rated-whom that everyone's scores are on the same scale. If the room split into two groups that never rated across, their numbers aren't comparable — the app checks for this. |
| **Imputation** | Filling a missing value with an estimate, usually the average. Deliberately *not* used here — it would report that 4 people rated someone when only 3 did. Shrinkage does the same job honestly. |
| **Composite engagement score** | One number combining three named parts — peer ratings (50%), participation (25%) and recognition (25%). The parts are always shown next to it, so you can see which one is low. |
| **Participation component** | How many of their assigned evaluations someone submitted, as a share. Excused rounds don't count against them. |
| **Recognition component** | How often someone was nominated, relative to chance. |
| **Excused** | A facilitator marking a round as not counting against someone — flat battery, no signal, sent home. One tap, removes that round from their denominator. |
| **Non-response** | Present, active, didn't submit. Counted. Distinct from excused, which isn't. |
| **Suppression** | Refusing to show a number the data can't support. No composite when the peer part is thin, and a suppressed row can't be sorted into a ranking. |
| **Pull-only** | The participant's phone asks the server for a value when needed, rather than holding its own copy. How balances work, so no phone ever shows an authoritative-looking stale number. |
| **Withdrawn / returned** | A participant marked as having left, and marked back in. Reversible, and returning keeps their history so it is not a loophole around the no-repeat rules. |
| **Property test** | A test asserting a rule always holds ("no one is ever assigned to rate the same person twice") across thousands of random cases, rather than checking one example. |

---

## Currency

| Term | Means |
|---|---|
| **Programme** | A multi-day engagement — several events for the same cohort. Balances live here, so they survive to day 2. A one-day event has no programme. |
| **Ledger** | A list of every earning and every cash-out, in order, never edited. Like a bank statement rather than a balance on a sticky note. |
| **Append-only** | Entries are added, never changed or deleted. A mistake is fixed by adding a correcting entry, so the history always tells the truth about what happened. |
| **Derived balance** | The balance isn't stored anywhere — it's added up from the ledger whenever needed. Means there's no saved number that can drift out of step with reality. |
| **Reversal** | The correcting entry that undoes an earlier one. "Undo" in the interface; an extra line in the ledger underneath. |
| **Batch** | All the entries created by one action. Awarding 50 each to a six-person team is six entries in one batch, so undoing it is one tap, not six. |
| **Per-member amount** | You enter what each person gets, not a pot to divide. Enter 50 for a team and everyone on it gets 50, whether it's four people or seven. |
| **Compare-and-set** | Before zeroing a balance, the app checks the balance is still what it thought. Stops a double tap or a retried request from overdrawing someone. |
| **Idempotency key** | A unique id on each entry, so the same request arriving twice is recognised and ignored. What makes patchy wifi harmless. |
| **Single designated writer** | Only one device can run redemption during a window. Since cashing out happens at one counter, this costs nothing and removes the only dangerous race in the system. |
| **Integer units** | Currency is whole numbers only, never decimals. Decimals in money code eventually produce 49.99999999. |
| **Pending award** | Currency earned by winning but not yet released, because the person hasn't submitted that round's evaluation. Shown separately and not part of the balance. |
| **Release** | The moment a pending award becomes real currency in someone's bank — on submitting, on being excused, or when you release it by hand. |
| **Forfeited** | A pending award that was never released, because the round was finalised with no submission and no excuse. |
| **Closed vs. finalised** | Closed = the on-time window is over, people can still catch up. Finalised = no more submissions, unreleased currency forfeits. The gap between them is the catch-up period. |
| **Catch-up prompt** | What a participant sees on opening the app with a missed evaluation outstanding — names the round, shows the waiting currency, one tap to complete it. |
| **Straight-lining** | Giving everyone the same number down the list to get through quickly. The main data-quality threat once currency rewards submitting. Measured, never punished. |
| **Spot award / adjustment** | A facilitator giving an individual an amount outside the normal team payout — for helping pack up, or to fix an error. |

---

## Data and legal

| Term | Means |
|---|---|
| **NRIC / MyKad** | The Malaysian identity number. Final digit odd = male, even = female — which is how gender gets derived on import. Parsed then discarded; never stored. |
| **PDPA** | Personal Data Protection Act — Malaysia's (2010) and Singapore's. Governs holding named people's data. Peer ratings and NRICs both fall under it. |
| **Data controller / processor** | Controller decides why data is collected (proposed: the client company). Processor handles it on their behalf (you). Determines who carries which legal duty. |
| **PII** | Personally Identifiable Information — anything that identifies a real person. Names, NRICs, emails. |
| **Device token** | A random code the phone generates to identify itself. Replaces participant logins entirely. |
| **Retention** | How long data is kept before deletion. Proposed: 90 days, then aggregates only. Currency ledgers die with their programme. |

---

## If something here is still opaque

Say which term and it gets rewritten. A specification you can't read isn't
serving its purpose — it exists so you can catch a wrong assumption before it
becomes wrong code.
