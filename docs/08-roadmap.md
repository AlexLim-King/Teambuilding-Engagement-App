# 08 — Roadmap

Sequenced so that the riskiest assumptions are tested earliest and cheaply. Each
milestone ends with something you can put in front of a real person.

## M0 — Answer the open questions *(you, not code)*

Settle [00-decisions.md](00-decisions.md), especially:
assigned vs. free-choice ratee, event shape (headcount / rounds / team size),
final criteria wording, and who the analytics buyer is. Everything downstream
depends on these, and getting them wrong is the expensive kind of wrong.

## M1 — `core` algorithms, headless

`packages/core` only: team formation, the bias model, nomination statistics, CSV
import. No UI. Delivered with:

- The property tests listed in [03](03-team-formation.md#test-plan-for-this-module).
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

## M3 — Facilitator interface + server + sync

Roster import with the mapping preview, event and round management, formation
proposal with override, live join and submission counters, the sync protocol from
[05](05-architecture.md#the-offline-model), and the facilitator team display
board. This is the first version that can run a real event.

**Gate: a pilot event with a friendly client, at your cost.** Expect the first
five minutes to be rough and instrument accordingly — log every join, every
autocomplete miss, every sync retry.

## M4 — Analytics and export

Adjusted scores with confidence bands and n, nomination indices, coverage matrix,
team comparison, XLSX export with the caveat header from
[07](07-risks-and-blind-spots.md#3-consequences-you-do-not-control). Plus the
one-page facilitator explainer for "why is my score 3.9 when everyone rated me 4."

## M5 — Hardening

Offline edge cases, the disconnected-graph check, retention job, PDPA data
requests, accessibility audit, load test at 300 concurrent participants,
error reporting.

## Later, in rough priority order

1. **Precision weighting** of raters ([04](04-scoring-and-bias.md#precision-weighting-v2)) — once you have real data to validate against.
2. **Local hub mode** ([05](05-architecture.md)) — if, and only if, a real event fails without it.
3. **Post-event client report** — the polished PDF an L&D buyer actually wants.
4. **Ordinal (ordered-logit) scoring model** — if ceiling effects prove severe.
5. **Cross-event longitudinal tracking** — needs the consent and identity work from [00](00-decisions.md) question 3.
6. **Multi-language UI** — the strings are externalised from M2 onward, so this stays cheap.
7. **Wear OS port** — see [07](07-risks-and-blind-spots.md#if-the-watch-is-non-negotiable).

## What is deliberately not on this list

- A client self-serve portal. Sell the report before building the portal.
- Any individual ranking or "bottom performer" view, ever.
- Realtime chat, photos, gamification, leaderboards. Each is a request you will
  receive and each dilutes the one thing this product does that others do not:
  defensible measurement.
