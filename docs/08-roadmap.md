# 08 — Roadmap

Sequenced so that the riskiest assumptions are tested earliest and cheaply. Each
milestone ends with something you can put in front of a real person.

## M0 — Answer the open questions *(you, not code)*

Mostly settled by the gap audit ([12](12-gaps.md)). What remains in
[00-decisions.md](00-decisions.md): **rounds per day**
(not blocking — the M1 study covers 3, 4 and 6), one-off vs. longitudinal,
final criteria wording, and the data-controller question. Headcount (40–80) and team size
(5–10, per activity) are settled.

## M1 — `core` algorithms, headless

`packages/core` only: team formation (with gender/department/novelty weighting),
the derangement-based rating assignment, the bias model, nomination statistics,
CSV/NRIC import, and the **currency ledger arithmetic** (balance from entries,
reversal logic, integer-only guarantees). No UI. Delivered with:

- The ledger property tests from [10](10-currency.md#test-plan) — balance always
  equals the sum of its entries, a redemption replayed 100 times never goes
  negative, no float ever touches a currency value.
- The property tests listed in [03](03-team-formation.md#test-plan-for-this-module),
  including the one your requirement turns into: **zero repeat rater→ratee pairs
  across 1,000 simulated 8-round events**, and the `k ≥ 8` sampling path, which at teams of
  5–10 is the normal case rather than an exception.
- The **synthetic recovery study** from [04](04-scoring-and-bias.md#validating-that-any-of-this-works),
  producing the table "how many rounds do you need for a reportable individual
  score." That table is a sales asset as much as an engineering result.
- A CLI that takes a namelist CSV and prints teams for R rounds, so you can
  sanity-check the mixing against your own judgement before any UI exists.

This is deliberately first. It is the part that is hard to get right, the part
that carries the product's actual claim, and the part where a bug is invisible
rather than obvious.

## M2 — Participant PWA, local only

Join → name autocomplete → team display → rate → nominate → done. IndexedDB, no
server: the facilitator's browser holds everything, teams are entered by hand.
Ugly, but it lets you run the participant flow with 8 colleagues in a room and
find out in an afternoon whether 30 seconds is realistic and whether the
autocomplete works under pressure.

## M2b — Results and currency

Folded into M3 rather than given its own milestone, because it needs the server
from day one: unlike ratings, a balance cannot be trusted from a client. What
lands with M3:

- Record result per team (placing / score / neither).
- Award per-member amounts with a saved payout preset; undo a whole batch.
- The append-only ledger, server-authoritative, integers only.
- Redemption counter with compare-and-set, single designated device, and undo.
- Participant balance screen with earning history.
- `programme` grouping so balances survive to day 2.
- **Activity library** and **itinerary paste** — the setup path that makes the facilitator
  flow fast. Library-first, since itinerary matching depends on it.
- Per-activity team size, and `session` grouping for parallel stations.
- Optional participant photo (self-capture; roster import later if a client ever supplies
  them), facilitator-view only.
- Facilitator per-team teamwork rating and "notice this person" flag.
- Participation-only award path for non-competitive activities.
- Redemption counter **lease** with expiry and explicit takeover.
- Participant flow in **BM + English**.
- Mark-as-left / mark-as-returned with history preservation
  ([11](11-mid-event-changes.md)), plus the withdrawn-state participant screen.

The ledger arithmetic itself ships in M1 as pure functions with the property tests
from [10](10-currency.md#test-plan) — it is the kind of code that must be right
before anyone can see it, and it is testable with no server at all.

## M3 — Facilitator interface + server + sync

Roster import with the mapping preview, event and round management, formation
proposal with override, live join and submission counters, the sync protocol from
[05](05-architecture.md#the-offline-model), the facilitator team display board, and
everything in M2b. This is the first version that can run a real event.

**Gate: a pilot event with a friendly client, at your cost.** Expect the first five
minutes to be rough and instrument accordingly — log every join, every autocomplete miss,
every sync retry.

**And run the product-focus debrief.** You chose to build all three — ops tool, engagement
mechanic, analytics — and decide which is the business afterwards. That decision needs a
mechanism or it will never happen: record which part the client reacted to, and what they
asked about unprompted. Without it, M5 arrives with the same three-way ambiguity and no new
information.

## M4 — Analytics and export

Two separate surfaces:

- *Facilitator view* — the composite engagement score with its components on the
  same row, adjusted scores with confidence bands and n, nomination index overall
  and by trait tag, coverage matrix, team comparison. Plus the one-tap excuse on the
  chase list, which ships with M3 since it is used live.
- *Client export* — team-level patterns and positive-only nomination highlights,
  with the caveat header from
  [07](07-risks-and-blind-spots.md#3-consequences-you-do-not-control). No
  per-person scores.

Plus the client report proper — the four analyses in [13](13-client-report.md) — and the
one-page facilitator explainer for "why is my score 3.9 when everyone rated me 4."

The report is a client-facing deliverable whose credibility is partly visual, so work its
chart design properly at this point rather than inheriting whatever the first library
produces.

## M5 — Hardening

Offline edge cases, the disconnected-graph check, retention job, PDPA data
requests, accessibility audit, load test at 300 concurrent participants,
error reporting.

## Later, in rough priority order

1. **The win-vs-ratings validity check** ([10](10-currency.md#an-unexpected-benefit-this-is-your-first-validity-check)) — log it from the first pilot, read it after a dozen events. It is the only external evidence this app measures anything real, and it costs nothing to collect.
2. **Precision weighting** of raters ([04](04-scoring-and-bias.md#precision-weighting-v2)) — once you have real data to validate against.
3. **Local hub mode** ([05](05-architecture.md)) — if, and only if, a real event fails without it.
4. **Post-event client report** — the polished PDF an L&D buyer actually wants.
5. **Ordinal (ordered-logit) scoring model** — if ceiling effects prove severe.
6. **Cross-programme longitudinal tracking** — needs the consent and identity work from [00](00-decisions.md) question 2.
7. **Multi-language UI** — the strings are externalised from M2 onward, so this stays cheap.
8. **Wear OS port** — see [07](07-risks-and-blind-spots.md#if-the-watch-is-non-negotiable).

## What is deliberately not on this list

- A client self-serve portal. Sell the report before building the portal.
- An in-app shop, catalogue, stock tracking, or auction. Currency leaves the app as
  physical money at the counter; the on-site reward system is yours to run.
- Transferring currency between participants. It makes the ledger a payment
  network and raises questions worth avoiding.
- Any individual ranking or "bottom performer" view, ever.
- Realtime chat, photos, gamification, leaderboards. Each is a request you will
  receive and each dilutes the one thing this product does that others do not:
  defensible measurement.
