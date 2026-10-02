# 03 — Team Formation

## What this replaces

Today you stand the room in a circle, split ladies one side and gents the other,
and count off 1–6. That method is doing three sensible things at once: it spreads
gender evenly, it breaks up the clusters people arrive in, and it is visibly fair
because everyone watches it happen.

The algorithm has to preserve all three properties, and it can add one the circle
cannot: **memory**. The circle has no idea who you were with an hour ago. The app
does, and that is the entire reason it is worth building.

## The problem, stated honestly

Across R activity rounds, partition P people into teams of roughly size k such
that:

- **Hard** — at most `max_leaders_per_team` leadership members (default 1); team
  sizes within `[min, max]`; explicit keep-apart pairs respected.
- **Soft, in priority order** — gender spread evenly; departments mixed; teammates
  not repeated; team sizes even.

This is the **social golfer problem** with side constraints. It is NP-hard, exact
solvers stall past about 30 people, and no closed form exists. That is fine — you
do not need the optimum, you need a good arrangement in under two seconds on a
phone with no signal. A seeded local search delivers that, typically within a few
percent of the best known arrangement.

## The coverage ceiling — tell the facilitator this up front

Before any algorithm runs, arithmetic caps the "everyone meets everyone" goal. In
one round a person meets `k − 1` new people, so over `R` rounds:

Team size is a property of the **activity**, not the event — a rope course runs teams of
5, a tower build runs teams of 10 — so coverage sums over the actual activities planned:

```
max_coverage = min(1, Σ over activities r of (k_r − 1) / (P − 1))
```

Where every activity shares one team size `k`, that reduces to the familiar form:

```
max_coverage = min(1, R × (k − 1) / (P − 1))
rounds_for_full_coverage = ceil((P − 1) / (k − 1))
```

A mixed day therefore reaches further than a uniform one at the smaller size: 60 people
across activities of 5, 10, 8 and 6 covers `(4+9+7+5)/59 = 42%`, against 27% if every
activity ran teams of 5.

For the real event shape — **40–80 participants, teams of 5–10**:

| People | Team size | Rounds | Ceiling | Rounds for 100% |
|---|---|---|---|---|
| 40 | 5 | 4 | 41% | 10 |
| 40 | 5 | 6 | 62% | 10 |
| 40 | **10** | 4 | **92%** | 5 |
| 60 | 8 | 4 | 47% | 9 |
| 80 | 5 | 4 | 20% | 20 |
| 80 | **10** | 4 | **46%** | 9 |
| 80 | 10 | 6 | 68% | 9 |

Team size is a far stronger lever than round count. Going from teams of 5 to teams of
10 roughly doubles coverage for the same number of activities.

## Team size 5–10 changes two things

### It makes the mixing goal reachable

See the table above: 40 people in teams of 10 reaches 92% coverage in four activities.
The "everyone works with everyone" ambition, which looked arithmetically hopeless at
teams of 5, is nearly achievable at teams of 10 for a 40-person event.

### It weakens the individual measurement

The honest counterweight. In a team of 10 doing a physical or build activity, three
people typically do the work and seven watch. Peer ratings depend on the rater having
*observed* the ratee, and in a team of 10 a given pair may barely have interacted.

Each person is still rated exactly once per round — the derangement guarantees that
regardless of size — so `n` is unchanged. What changes is the **quality** of each
rating: a rating from one of four teammates is better-grounded than a rating from one
of nine.

So the two goals pull apart, and the lever is the same knob:

| Team size | Coverage | Individual rating quality |
|---|---|---|
| 5–6 | Lower | Better — raters actually saw the person |
| 8–10 | Higher | Weaker — more passive observers |

Neither is wrong. Pick by what the client bought: a cross-silo mixing day wants 10, a
leadership assessment wants 5. The round planner should say which trade the current
configuration is making, in the same panel as the coverage forecast.

Balance-first priority (see [00](00-decisions.md#the-trade-you-just-made-balance-first))
costs a further 10–20% of that ceiling, because every constraint the algorithm
must satisfy is freedom it no longer has to avoid repeats. So a 48-person,
6-per-team, 4-round day realistically reaches **~35% coverage**, not 43%.

The facilitator's round planner shows this live as team size and round count
change ([06](06-ui-flows.md#f-3-day-planner--the-coverage-forecast)). It turns a promise you cannot
keep into a number you can plan around, and it points at the real lever: **larger
teams and more rounds**, not a cleverer algorithm.

## Algorithm

Two phases: a constructive pass for a legal arrangement fast, then local search
until the time budget expires.

### Cost function

```
cost = Σ over teams T of:
      W_gender · Σ_{g ∈ genders}     ( count_g(T) − expected_g(T) )²
    + W_dept   · Σ_{d ∈ departments} max(0, count_d(T) − 1)²
    + W_pair   · Σ_{(a,b) ∈ pairs(T)} together[a][b]²
    + W_size   · ( |T| − target )²
    + W_leader · Σ_{leader pairs (a,b)} ( 1 + together[a][b] )
    + W_hard   · violations(T)

expected_g(T) = |T| × (global count of g) / P
```

Defaults, reflecting your balance-first priority:

| Weight | Value |
|---|---|
| `W_gender` | 25 |
| `W_dept` | 15 |
| `W_pair` | 10 |
| `W_leader` | 8 |
| `W_size` | 5 |
| `W_hard` | 1000 |

Why each term is shaped this way:

- **`(count − expected)²` on gender.** Deviation from the room's actual ratio, not
  from 50/50 — a room that is 70% male should produce teams that are roughly 70%
  male, not teams that fail to exist. The fractional expectation naturally
  produces the right mix of 3-and-4 splits when the number doesn't divide evenly.
  This is your circle method, generalised.
- **`(count_d − 1)²` on departments.** Zero cost for one person from a department,
  1 for two, 4 for three. Tolerates the unavoidable — a 40-person company with 3
  departments *must* double up — while strongly resisting a team of four from
  Finance.
- **`together²` on repeats.** A linear penalty treats "two pairs meeting a second
  time" as equal to "one pair meeting a third time." They are not: being with the
  same person three times is what participants actually complain about. Squaring
  spreads repeats thinly across many pairs instead of piling them on a few unlucky
  people.
- **Separate leader term.** Leader–leader adjacency is already caught by the pair
  term, but you called it out specifically, so it gets its own weight you can turn
  up without disturbing anything else. The `(1 + together)` factor makes two
  leaders who have already met worse than two who haven't.
- **Hard violations as a large finite penalty, not a rejection.** If the room has
  more leaders than teams, a search that rejects illegal moves has no legal
  starting point and stalls. A big-but-finite penalty lets it start illegal and
  climb out — and if it genuinely cannot, it returns the least-illegal answer and
  *names the constraint it had to bend*, which is far more useful than an error.

### Checking that "strong weighting" behaves like "balance first"

The priority is expressed as weights, not as a strict lexicographic ordering.
Worked, so you can verify the defaults do what you asked:

| Situation | Cost |
|---|---|
| One person off the ideal gender split (one team +1, another −1) | 25 × (1 + 1) = **50** |
| A pair meeting for the **2nd** time | 10 × 1² = **10** |
| A pair meeting for the **3rd** time | 10 × 2² = **40** |
| A pair meeting for the **4th** time | 10 × 3² = **90** |
| Three people from the same department in one team | 15 × 2² = **60** |

So balance beats a second and third meeting, as you asked — but a fourth meeting
(90) outranks a one-person imbalance (50), and a four-from-Finance team is not
tolerated to protect a cosmetic gender split. Strict lexicographic ordering would
have accepted both, which is why it isn't used. All six weights live in the event
template, so a cross-silo workshop can run novelty-first without a code change.

### Phase 1 — construction

1. `T = round(P / team_size)` for this activity, clamped within its
   `[min_team_size, max_team_size]`. Where a session runs parallel stations with
   different team sizes, formation allocates across the whole session in one pass so
   nobody lands in two simultaneous activities, and each team's `target` is its own
   activity's size.
2. Place **leaders first**, one per team in seeded-random order. More leaders than
   teams → distribute the excess to teams whose existing leader they have met
   least often.
3. Sort the rest by **department size descending, then by minority gender first**.
   The scarcest attributes are what bind; placing them first stops the last few
   people being forced into an impossible corner.
4. Place each person into the team with the lowest marginal cost, seeded-random
   tiebreak.

### Phase 2 — local search

```
budget = 500 ms (configurable)
best = current
while time remains:
    pick two participants a, b in different teams (seeded random)
    Δ = cost after swapping a and b − cost before     # O(k): only two teams change
    accept if Δ < 0, or with probability exp(−Δ / temperature)
    cool temperature
    track best-ever arrangement
return best
```

Simulated annealing rather than plain hill-climbing, because the pairing landscape
is full of local minima a single swap cannot escape. Also try `move` (shift one
person to a smaller team) — swap alone cannot change team sizes.

Delta evaluation is why this is fast: a swap changes two teams, so recomputing is
`O(k)`, not `O(P²)`. That is roughly 50–100k evaluations in the 500 ms budget on a
mid-range phone — ample for P ≤ 200.

### Determinism

Every random draw comes from a seeded PRNG (`mulberry32`), seed stored on the
event. Same roster, same history, same seed → same teams, on any device. This
matters more than it sounds: when someone asks "why am I with Sarah again," the
facilitator can show the arrangement was derived rather than chosen, and re-run
it to prove it. It is the app's equivalent of everyone watching the circle count.

### Incremental changes between rounds

- **Late arrival** — insert into the legal team with lowest marginal cost. No
  reshuffle: a person already gathered under a number is never moved.
- **Drop-out** — mark withdrawn, remove, and rebalance only if a team falls below
  `min_size` — by moving one person, not by re-forming.
- **Manual override** — drag-and-drop. The app recomputes cost and shows a
  non-blocking warning if a hard constraint breaks ("Team 3 now has 2 leadership
  members"). The facilitator is in the room; they win.

## Rating assignment

When teams are fixed, the app generates the rater → ratee map as a **derangement**
of each team: a permutation where nobody rates themselves.

A derangement guarantees, by construction, that **every member is rated exactly
once** — because a permutation is a bijection, each person appears as somebody's
ratee exactly one time. Nobody ends a round with zero data, and nobody is rated
four times while the quiet person is rated never.

Two additional constraints on which derangement is chosen:

1. **No 2-cycles.** A ↔ B rating each other in the same round is the one
   configuration that enables direct back-scratching. Excluded.
2. **No repeat ratee** — the next section.

> **Correction to the earlier draft of this spec.** An earlier version specified a
> single cycle (A→B→C→D→A). That works but is needlessly restrictive: a team of 5
> has 24 single cycles but **44 derangements**, so widening the feasible set gives
> the repeat-avoidance search nearly twice the room to manoeuvre. Single cycles
> are kept as a *preference* for tie-breaking, since they guarantee the team's
> rating graph is connected, which slightly helps the bias model.

## Never rating the same person twice

Your requirement — a participant should be *very* unlikely to rate the same person
in a later activity — is enforced by two independent layers, and the result is
stronger than "unlikely."

**Layer 1 — upstream.** A rater can only be assigned a *teammate*. So every repeat
pairing the formation algorithm avoids is a repeat rating that becomes impossible
before the assignment step even runs.

**Layer 2 — hard constraint.** The event keeps a directed set of every
`(rater, ratee)` pair already used. When generating a derangement, any permutation
using a forbidden arc is rejected outright.

Feasibility is not a concern at realistic team sizes. Derangement counts:

| Team size | Derangements | Still available after forbidding 2 arcs |
|---|---|---|
| 4 | 9 | ~5 |
| 5 | 44 | ~28 |
| 6 | 265 | ~180 |
| 7 | 1,854 | ~1,300 |

| 10 | 1,334,961 | effectively all of them |

For `k ≤ 7` (up to 1,854 derangements) the search enumerates exhaustively in
microseconds, filters forbidden arcs, and picks by: **fewest forbidden arcs (target:
zero) → prefer a single cycle → fewest reverse-direction repeats (B rating A when A
already rated B) → seeded random**.

For `k ≥ 8` — which at teams of 5–10 is a normal case, not an exception — it samples
a few hundred random derangements and scores them identically. With over a million
derangements available at `k = 10` and only a handful of forbidden arcs, a zero-repeat
candidate turns up in the first few draws essentially always.

**Fallback ladder**, used only if the ideal is impossible:

1. Zero forbidden arcs — the normal case.
2. Allow reverse-direction repeats (B rates A after A rated B). Different
   direction, different judgement, materially different from a true repeat.
3. Allow one true repeat, chosen as the oldest pair.
4. Report it. The facilitator's round summary shows `repeat evaluations: 0` as a
   visible statistic, so on the rare occasion it isn't zero, nobody has to guess.

In practice, for any event under roughly 6 rounds, **the expected number of repeat
evaluations is zero** — a repeat requires two people to be teamed together twice
*and* the derangement search to be unable to route around it, and the second
condition essentially never binds at these team sizes.

Between rounds the derangement is re-drawn, so a participant rates a different
person each time and receives ratings from different people each time.

### The trade-off worth knowing

One rating per person per round means each person accumulates only `R` ratings
across the entire event. With R = 4 that is four numbers per criterion — enough
for a team-level or event-level statement, thin for an individual one. The lever
is either more rounds, or **two ratings per person per round** (a double
derangement: A rates B *and* C). That costs about 20 extra seconds per participant
per round and roughly doubles the statistical power. Worth offering as a template
setting once you know your typical event shape.

## Test plan for this module

The algorithm is the part most likely to be quietly wrong, so it gets property
tests rather than examples:

- Every participant in exactly one team per round; team sizes within `[min, max]`.
- Leader cap respected whenever `leaders ≤ teams`; when it isn't, excess spread as
  evenly as possible and reported.
- Gender deviation from the room ratio never exceeds 1 per team when the numbers
  permit an exact split.
- **Zero repeat rater→ratee pairs across an 8-round simulated event**, across
  1,000 seeds. This is the property your requirement turns into, and it is
  cheaply checkable.
- Every ratee rated exactly once per round; no self-ratings; no 2-cycles.
- Repeat pairings never exceed the theoretical minimum by more than 20% (the
  balance-first allowance).
- Same seed ⇒ byte-identical output, 1,000 runs.
- 200 participants, 8 rounds, within budget on a throttled CPU.
- Fuzz: 1 participant; 2 participants; all one department; all one gender; all
  leaders; a department larger than a team; P not divisible by k; a team of 2
  (where the 2-cycle ban must gracefully yield).
