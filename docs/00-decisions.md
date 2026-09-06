# 00 — Decisions and Open Questions

## Locked decisions

| Decision | Choice | Consequence |
|---|---|---|
| Participant platform | **Responsive PWA**, mobile-first, degrading to a watch-browser layout | No app store, no install, no per-device cost. Watch-native (Wear OS) stays possible later but is explicitly *not* the first target. |
| First deliverable | **Spec + architecture** (this repo) | No code until the open questions below are answered. |
| Connectivity model | **Offline-first** — local writes always succeed, sync opportunistically | Every participant action is queued locally and replayed. See §Architecture and the honest limit in [07](07-risks-and-blind-spots.md#the-offline-distribution-problem). |
| Evaluation anonymity | **Anonymous to peers, identified to the facilitator** | Rater identity is stored, because rater-bias correction is impossible without it. Participants are told this in plain language at join. |

## Why "PWA first" rather than a watch app

The brief says "smart watch ... low cost devices." Those two constraints pull
apart, and it is worth being blunt about it:

- A genuine wrist app means **Wear OS**, which means watches from roughly
  US$130 upward, per participant, that you own, charge, sanitise and inventory.
  For a 60-person event that is a five-figure hardware line item before a single
  line of code runs.
- The cheap watches (sub-US$40 "smart bands") do **not** run third-party apps at
  all. They run vendor firmware and a companion phone app. Nothing you write can
  be installed on them.

So "lightweight app on low-cost devices" is achievable — just not on the wrist
at low cost. The PWA runs on the phone every participant already owns, costs
nothing per head, installs in one tap, and works offline. The layout is built
watch-width-first anyway, so if you later buy Wear OS hardware the same screens
carry across with a thin native shell.

**If a wrist device is genuinely non-negotiable** (e.g. it is part of what you
sell), say so and the plan changes materially — see
[07](07-risks-and-blind-spots.md#if-the-watch-is-non-negotiable).

## Open questions — these block the build

1. **Who does a participant evaluate?**
   The brief says "evaluate one other team member." If participants *choose*
   freely, the popular and the loud collect all the ratings and the quiet
   collect none — the metric then measures salience, not contribution, and half
   your people end the event with no data at all.
   **Recommendation:** the app *assigns* the ratee, cycling within the team so
   every member is rated exactly once per round. Same effort for the
   participant, complete coverage, and it makes the bias model identifiable.
   Keep free choice as a facilitator toggle for clients who insist.
   → Design assumes **assigned** throughout; see [03](03-team-formation.md#rating-assignment).

2. **Event shape.** Typical headcount? Number of activity rounds per event
   (2? 4? 8?)? Team size (4? 5? 6?)? These set the statistical power of every
   number the app reports — with 2 rounds there is very little to say about an
   individual, with 6 there is quite a lot.

3. **One-off or longitudinal?** Is a person tracked across multiple events over
   months, or does every event start clean? Longitudinal needs stable person
   identity, consent for retention, and changes the data model. Standalone is
   far simpler and far safer.

4. **Do participants ever see their own scores?** Recommendation: no individual
   scores to participants at v1 — only their nominations received ("3 teammates
   picked you as most helpful"), which is positive-only and safe. Full numbers
   go to the facilitator and, if the client buys it, to HR.

5. **Who is the buyer of the analytics** — the facilitator running the day, or
   the client's HR/L&D who wants a report afterwards? This decides whether the
   analytics screen is a live ops dashboard or an exportable post-event report.
   (Cheapest answer: build the ops view now, the report in v2.)

6. **Criteria wording.** Current placeholders — cooperativeness, willingness to
   help, leadership — are one construct and a half. "Cooperativeness" and
   "willingness to help" correlate so tightly that participants will give them
   the same number, and you will have paid two taps for one signal. See
   [04](04-scoring-and-bias.md#choosing-criteria-that-are-actually-different)
   for a proposed replacement set.

7. **Data protection.** Peer evaluations of named individuals are personal data.
   Under Singapore's PDPA (and GDPR if any participant is in the EU) you need a
   lawful basis, a stated retention period, and an answer to "can I see what was
   said about me." Who is the data controller — you, or the client company?
   Default in this spec: client is controller, you are processor, 90-day
   retention, then aggregate-only.

8. **Hosting budget.** The sync backend is small (a Postgres and a container),
   but it is a recurring cost. Rough order: US$0–25/month at this scale on
   Supabase or Fly.io. Confirm that's acceptable versus a fully local mode.
