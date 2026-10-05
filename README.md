# Teambuilding Engagement App

A lightweight, offline-first web app (PWA) for teambuilding providers. It forms
balanced, well-mixed teams across multiple activity rounds, then collects
structured peer evaluations at the end of each round, and turns those
evaluations into defensible engagement metrics — correcting for the fact that
some people always score high and some always score low.

Two interfaces, one codebase:

- **Facilitator** — import a namelist, configure the event, form teams, trigger
  evaluations, record who won, award currency, watch live completion, read the
  analytics, export results.
- **Participant** — type the first few letters of your name, see your team
  number, and when the coach triggers it, rate one teammate on three criteria plus
  answer one nomination question, which changes every round. Check your currency
  balance and how you earned it.

## Status

**Foundation built, features next.** The monorepo, database schema and CI are in
place and verified; the feature work is sequenced in
[docs/14-build-plan.md](docs/14-build-plan.md). Start there, then read the
specification below.

```bash
pnpm install && pnpm dev          # see docs/14 for Supabase setup
```

Built with Next.js on Vercel, Postgres and Auth on Supabase.

| # | Document | What it settles |
|---|----------|-----------------|
| — | [**Glossary**](docs/GLOSSARY.md) | **Plain-language definitions for every term used below — start here if anything reads as jargon** |
| 00 | [Decisions](docs/00-decisions.md) | Locked choices and the open questions still blocking build |
| 01 | [Requirements](docs/01-requirements.md) | Actors, user stories, functional and non-functional scope |
| 02 | [Data model](docs/02-data-model.md) | Entities, schema, identity, retention |
| 03 | [Team formation](docs/03-team-formation.md) | The mixing algorithm and its constraints |
| 04 | [Scoring & rater bias](docs/04-scoring-and-bias.md) | How raw 1–5 ratings become comparable scores |
| 05 | [Architecture](docs/05-architecture.md) | PWA, offline sync, API contract, stack |
| 06 | [UI flows](docs/06-ui-flows.md) | Screen-by-screen for both interfaces, watch constraints |
| 07 | [Risks & blind spots](docs/07-risks-and-blind-spots.md) | Where this design can mislead you, and what to do about it |
| 08 | [Roadmap](docs/08-roadmap.md) | Build order and milestones |
| 09 | [Question bank](docs/09-question-bank.md) | The rotating nomination questions and why they rotate |
| 10 | [Results & currency](docs/10-currency.md) | Recording wins, the earnings ledger, and cashing out at the counter |
| 11 | [Mid-event changes](docs/11-mid-event-changes.md) | Someone leaves or returns mid-event, and what it touches |
| 12 | [Gap audit](docs/12-gaps.md) | The gap audit and what was decided for each item |
| 13 | [Client report](docs/13-client-report.md) | The four analyses, what they say, and how they mislead |
| 14 | [**Build plan**](docs/14-build-plan.md) | **Stage-by-stage build order, and how to run it on your laptop** |
| 15 | [Brand](docs/15-brand.md) | Palette, type, and the two non-negotiable rules |

Start with **00-decisions.md** — it lists the questions that still need your
answer before code is worth writing.
