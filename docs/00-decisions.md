# 00 — Decisions and Open Questions

## Locked decisions

| Decision | Choice | Consequence |
|---|---|---|
| Participant platform | **Responsive PWA**, mobile-first, degrading to a watch-browser layout | No app store, no install, no per-device cost. Watch-native (Wear OS) stays possible later but is explicitly *not* the first target. |
| First deliverable | **Spec + architecture** (this repo) | No code until the remaining open questions are answered. |
| Connectivity model | **Offline-first** — local writes always succeed, sync opportunistically | Every participant action is queued locally and replayed. See [05](05-architecture.md) and the honest limit in [07](07-risks-and-blind-spots.md#4-the-offline-distribution-problem). |
| Evaluation anonymity | **Anonymous to peers, identified to the facilitator** | Rater identity is stored, because rater-bias correction is impossible without it. Participants are told this in plain language at join. |
| Who rates whom | **App-assigned derangement within the team** — everyone rates exactly one teammate, everyone is rated exactly once | No self-rating, no mutual pairs, complete coverage. See [03](03-team-formation.md#rating-assignment). |
| Repeat ratings | **Hard-forbidden**: a rater is never assigned a ratee they have already rated | Realistically zero repeats for any event under ~6 rounds. See [03](03-team-formation.md#never-rating-the-same-person-twice). |
| Nomination questions | **One per round, auto-rotating** from a facilitator-editable bank of positive-trait questions | A 4-round event surfaces 4 different traits, spreading recognition beyond the loud and popular. Bank drafted in [09](09-question-bank.md). |
| Gender balancing | **Roster column**, with gender derivable from Malaysian NRIC on import; facilitator fills gaps before the event | Automates the circle-and-count method. See the NRIC handling rules below — they are not optional. |
| Gender spread pattern | **Even spread across teams, solos accepted** | 1 per team wherever the ratio allows — matches current practice. |
| Objective priority | **Balance first**: gender balance > department mix > novel pairings > even sizes | Every team reads as well-mixed each round. Costs coverage — see the trade-off note below. |
| Individual reporting | **Facilitator only.** Client receives team-level patterns plus a positive-only "names that stood out" list | Keeps the talent-spotting value without handing over a numeric league table built on n = 4. |
| Currency | **Separate from peer evaluation entirely.** Earned from live activity results, awarded by the facilitator as a per-member amount | Nothing anyone says about a teammate pays out, so nominations never become deals. See [10](10-currency.md). |
| Currency storage | **Append-only integer ledger**, balance always derived | The first mutable, contested state in the system; it does not get the same treatment as immutable ratings. |
| Currency release | **Earned on winning, released on submitting.** An award is pending until the participant completes that round's evaluation | Makes a refusal cost something real, which is what makes the non-response signal meaningful. Pending amounts are a separate table, never part of the balance, so the ledger stays append-only. |
| Missed evaluations | **Catch-up prompt**, automatic and participant-driven, until the facilitator finalises the round | A dead battery costs nobody anything. The excuse becomes a fallback for people who cannot catch up at all. |
| Forfeiture | Unreleased awards forfeit at **round finalisation**, and the participant sees it | An unseen consequence shapes no behaviour. Manual release always available. |
| Late submissions | **Count fully** for participation; flagged `submitted_late` | The evaluation happened, which is what the measure is about. The flag lets you see the pattern. |
| Redemption | Facilitator hands over **physical currency** at a counter and taps Redeemed, zeroing the balance | No in-app shop, no catalogue, no stock. One designated device per redemption window. |
| Balance lifetime | **Persists across a multi-day programme**, dies with the programme | Introduces a `programme` entity above `event`. |
| Balance visibility | **Own balance and own earning history only** | No leaderboard; no participant device holds anyone else's financial state. |
| Currency source of truth | **Server, read through the facilitator's connected device.** Participants pull their balance on demand | No authoritative balance ever lives on a participant device, so there is no offline currency logic and no stale-balance trap. |
| Mid-event withdrawal | **One tap on the facilitator device**, reversible; next round forms without them | Safe offline — a status change is facilitator-owned and additive. See [11](11-mid-event-changes.md). |
| Missing ratings | **Never imputed.** `n` simply drops and shrinkage absorbs it | Imputing an average would report a false `n` and compress real differences. Scope reduction, not an omission. |
| Non-response | **A named component of a composite engagement score** (50% peer · 25% participation · 25% recognition), never subtracted from the peer score | Someone present and declining to submit is real engagement data. Keeping it a separate component means the report can say which part is low. See [04](04-scoring-and-bias.md#the-composite-engagement-score). |
| Excused absences | **One tap per person per round**, reason `technical` or `facilitator`; removes that round from the participation denominator | Illness and dead batteries never reach the engagement figure. Only "present and did not submit" does. |
| Stating a motive | **Never.** Every surface says "did not submit", never "refused" | A refusal and a flat battery are identical in the data. The facilitator was in the room; the app supplies the count, not the interpretation. |
| Departed members and awards | **Always included** if they were on the team when the round started | Avoids penalising illness; the amounts are not worth adjudicating. |

## The trade you just made: balance first

"Balance wins" and "everyone should meet everyone" pull against each other, and it
is worth seeing the cost with eyes open.

Every round the algorithm spends on making each team look right by gender and
department is a round where it has less freedom to avoid putting the same two
people together again. In simulation this typically costs **10–20% of achievable
pairing coverage** on a multi-round event — so a configuration that could have
reached 43% novel coverage lands nearer 35%.

Two things make this a reasonable choice anyway:

1. It matches what you already do successfully in the room, and a client watching
   a well-mixed team is a client who can see the value immediately. Coverage is
   invisible; a team of five men from Finance is not.
2. It is **not a hard-coded ordering**. The priority is expressed as weights in
   the event template, so after a few real events you can shift emphasis per
   client without a code change — a cross-silo workshop can run novelty-first
   while a family day runs balance-first.

Implementation note: the priority is a *strong weighting*, not a strict
lexicographic order. Strict ordering would accept two people meeting for a fourth
time in order to fix a one-person gender imbalance, which is obviously wrong. The
weights are set so balance wins ties and minor conflicts, while a severe repeat
still outranks a cosmetic imbalance. See [03](03-team-formation.md#cost-function).

## NRIC handling — read this before writing the importer

Using the Malaysian NRIC (MyKad) to derive gender is sound and practical: the
number is `YYMMDD-PB-###G`, and the final digit `G` is **odd for male, even for
female**.

But an NRIC is among the most sensitive identifiers a Malaysian person has. It
also encodes date of birth and place of birth, so a namelist with NRICs is a far
more dangerous file than a namelist with names. Under Malaysia's PDPA 2010 you
would be holding it as a data user with real obligations, and a leak of that file
is a materially worse incident than a leak of the event's ratings.

The rules baked into the spec:

- **Derive at import, then discard.** The importer parses the NRIC in the browser,
  extracts gender (and nothing else), and the full number is **never persisted,
  never sent to the server, and never sent to a participant device**.
- Store only `gender` and, if a stable key is needed across events, a salted hash
  of the NRIC — never the number itself.
- Validate the format and reject silently-wrong input (12 digits after stripping
  dashes and spaces). A truncated or mistyped NRIC that happens to parse would
  assign the wrong gender with no visible error.
- The import preview shows the derived split (`Derived from NRIC: 34 male, 26
  female, 2 unreadable`) so the facilitator can catch a parsing failure before it
  becomes a room full of wrong teams.
- Where no NRIC or gender column exists, the facilitator tags the gaps on the
  setup screen. Anyone still untagged is spread evenly as an "unspecified" group
  rather than being silently defaulted.
- NRIC-derived gender is *legal-document* gender. It will occasionally not match
  how someone identifies. The facilitator override exists for that, and gender is
  never displayed to peers anywhere in the app.

## Open questions, and one settled consequence

1. **Event shape.** Typical headcount? Rounds per event (2? 4? 8?)? Team size
   (4? 5? 6?)? These set the statistical power of every number the app reports,
   and they determine whether individual scores are reportable at all. **Still the
   single thing blocking the first build.**

2. **Longitudinal tracking of *scores*.** Balances now persist across a programme
   ([10](10-currency.md)), which settles identity *within* a programme. Still open:
   whether peer-evaluation scores follow a person across separate programmes over
   months. That is the part needing consent and retention work; the currency does
   not depend on it.

3. **Re-join on day 2 is name-pick-only, by your decision.** Accepted, with the
   consequence handled rather than prevented: the realistic failure is picking the
   wrong "John Lim" and cashing out their balance, so every redemption is
   reversible in one tap and the name picker always shows department. See
   [10](10-currency.md#if-the-wrong-person-is-cashed-out).

4. **Do participants see anything about themselves?** Recommendation: no scores,
   but *do* show nominations received ("2 teammates picked you for 'kept everyone
   included'"). Positive-only, safe, and it is the single cheapest thing that
   makes participants glad they used the app.

5. **Final criteria wording.** Deferred by you, correctly. The constraint to
   remember when you choose: three criteria that measure genuinely different
   things, not one construct three times. Candidates in
   [04](04-scoring-and-bias.md#choosing-criteria-that-are-actually-different),
   oriented toward the "potential leaders and outstanding workers" lens your
   clients want.

6. **Data protection posture.** Who is the data controller — you, or the client
   company? Default in this spec: client is controller, you are processor, 90-day
   retention, then aggregate-only. Malaysia's PDPA 2010 applies to commercial
   transactions and is the operative regime for Malaysian events; Singapore's
   PDPA if you run there.

7. **Who receives the engagement report?** The reporting decision above keeps
   per-person scores on the facilitator's screen and gives the client aggregates
   plus positive-only highlights. The composite engagement score is currently
   specced as a *facilitator-view* artifact on that basis. If "engagement report"
   means a client deliverable containing per-person engagement scores, say so — it
   is a different decision from the one already made, and it changes the consent
   wording participants are shown at join.

8. **Hosting budget.** Roughly US$0–25/month at this scale on Fly.io or Supabase.
   Confirm that is acceptable versus a fully local mode.
