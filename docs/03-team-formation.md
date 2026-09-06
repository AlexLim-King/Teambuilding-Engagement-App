# 03 — Team Formation

## The problem, stated honestly

You want, across R activity rounds, to partition P people into teams of roughly
size k such that:

- **Hard** — at most `max_leaders_per_team` leadership members in a team
  (default 1); team sizes within `[min, max]`; explicit "keep apart" pairs
  respected.
- **Soft** — each round mixes departments; nobody repeats a teammate until
  they've run out of new people; leaders in particular don't keep landing
  together; team sizes stay even.

This is the **social golfer problem** with side constraints. It is NP-hard, there
is no closed-form answer, and exact solvers blow up past about 30 people. That is
fine — you do not need the optimum, you need a good arrangement in under two
seconds on a phone with no signal. A seeded local search delivers that, typically
within a few percent of the best known arrangement.

## The coverage ceiling — tell the facilitator this up front

Before any algorithm runs, arithmetic sets a hard limit on the "everyone meets
everyone" goal. In one round a person meets `k − 1` new people. Over `R` rounds
they meet at most `R × (k − 1)` distinct others, out of `P − 1` possible:

```
max_coverage = min(1, R × (k − 1) / (P − 1))
rounds_for_full_coverage = ceil((P − 1) / (k − 1))
```

Worked, for a typical corporate day:

| People | Team size | Rounds | Best possible coverage | Rounds for 100% |
|---|---|---|---|---|
| 24 | 4 | 4 | 52% | 8 |
| 48 | 6 | 4 | 43% | 10 |
| 48 | 6 | 8 | 85% | 10 |
| 100 | 5 | 5 | 20% | 25 |

So for a 100-person company day, "everyone teams up with everyone" is not
achievable and no software will make it so. What *is* achievable, and what the
algorithm should therefore optimise, is: **zero repeat pairings until the
mathematical ceiling forces one**, and **maximum department spread within that**.

The facilitator setup screen must show this number live as they change team size
and round count (R9, and see [06](06-ui-flows.md#f-3-round-planner)). It converts
a promise you cannot keep into an expectation you can manage — and it nudges
toward larger teams and more rounds, which is the real lever.

## Algorithm

Two phases: a constructive pass that gets a legal arrangement fast, then local
search that improves it until the time budget expires.

### Cost function

For a candidate assignment of one round:

```
cost = Σ over teams T of:
         W_pair    · Σ_{(a,b) ∈ pairs(T)}  repeatPenalty(together[a][b])
       + W_dept    · Σ_{d ∈ departments}   max(0, count_d(T) − 1)²
       + W_size    · (|T| − target)²
       + W_leader  · Σ_{(a,b) ∈ pairs(T), both leaders} (1 + together[a][b])
       + W_hard    · violations(T)

repeatPenalty(c) = c²        // 0 for a fresh pair, 1 for a second meeting,
                             // 4 for a third, 9 for a fourth
```

Why each term is shaped the way it is:

- **`c²` on repeats.** A linear penalty treats "two pairs meeting a second time"
  as equal to "one pair meeting a third time." They are not — the participant
  experience of being with the same person three times is much worse. Squaring
  makes the search spread repeats thinly across many pairs instead of piling them
  on a few unlucky people.
- **`(count_d − 1)²` on departments.** Zero cost for one person from a
  department, 1 for two, 4 for three. This tolerates the unavoidable (a
  40-person company with 3 departments *must* double up) while strongly
  resisting a team of four from Finance.
- **Separate leader term.** Leader–leader adjacency is already caught by the pair
  term, but the brief calls it out specifically, so it gets its own weight you
  can turn up without disturbing everything else. The `(1 + together)` factor
  means two leaders who have already been together are worse than two who
  haven't.
- **Hard violations as a large finite penalty rather than a rejection.** If the
  room has more leaders than teams, a "reject illegal moves" search has no legal
  starting point and stalls. A big-but-finite penalty lets it start illegal and
  climb out, and if it genuinely cannot, it returns the least-illegal answer and
  *tells the facilitator which constraint it had to bend* — far better than
  spinning or erroring.

Default weights (`W_pair 10, W_dept 3, W_size 5, W_leader 8, W_hard 1000`) are in
the event template so they are tunable per client without a code change. A client
who cares more about department mixing than about novelty can have it.

### Phase 1 — construction

1. Compute `T = round(P / target_team_size)`, clamped so all sizes fall in range.
2. Place **leaders first**, one per team in seeded-random team order. If there
   are more leaders than teams, distribute the excess to the teams whose existing
   leader they have met least often.
3. Sort the remaining participants by **department size, descending** (largest
   department first). Big departments are the constraint that binds; placing them
   first stops the last few people from being forced into an impossible corner.
4. Place each person into the team with the lowest marginal cost, breaking ties
   with the seeded PRNG.

### Phase 2 — local search

```
budget = 500 ms (configurable)
best = current
while time remains:
    pick two participants a, b in different teams (seeded random)
    if swap(a, b) is legal-or-improving:
        Δ = cost after swap − cost before      // O(k), only two teams change
        accept if Δ < 0, or with probability exp(−Δ / temperature)
    cool temperature
    track best-ever arrangement
return best
```

Simulated annealing rather than plain hill-climbing because the pairing landscape
is full of local minima that a single swap cannot escape. Also try `move` (shift
one person to a smaller team) when sizes are uneven — swap alone cannot change
team sizes.

Delta evaluation is the reason this is fast: a swap only changes two teams, so
recomputing costs `O(k)`, not `O(P²)`. On a mid-range phone that is roughly
50–100k swap evaluations in the 500 ms budget — ample for P ≤ 200.

### Determinism

Every random draw comes from a seeded PRNG (`mulberry32`), seed stored on the
event (`event.formation_seed`). Same roster, same round history, same seed → same
teams, on any device. This matters more than it sounds: when a participant asks
"why am I with Sarah again," the facilitator can show that the arrangement was
derived, not chosen, and re-run it to prove it.

### Incremental changes between rounds

- **Late arrival** — insert into the legal team with lowest marginal cost. No
  reshuffle. A person already gathered under a number should never be moved.
- **Drop-out** — mark `withdrawn`, remove from the team, rebalance only if a team
  falls below `min_size`, and then by moving one person, not by re-forming.
- **Manual override (R6)** — drag-and-drop. The app recomputes cost and shows a
  non-blocking warning if the move breaks a hard constraint ("Team 3 now has 2
  leadership members"). The facilitator is in the room; they win.

## Rating assignment

When a round's teams are fixed, the app generates the rater → ratee mapping as a
**single cycle within each team**: with members `[A, B, C, D]` in a seeded order,
A rates B, B rates C, C rates D, D rates A.

This gives, for free:

- Every member rated exactly **once** — no one ends the round with zero data, and
  no one is rated four times while the quiet person is rated never.
- No self-ratings, no mutual back-scratching pairs (except in a team of 2, where
  it is unavoidable).
- A rating graph that is **connected across the event**, which is precisely the
  condition the bias model in [04](04-scoring-and-bias.md) needs to separate
  "this rater is generous" from "this person is genuinely good."

Between rounds, the cycle order is re-randomised and checked against prior
rater→ratee pairs, choosing among a handful of candidate cycles the one with the
fewest repeats. Over four rounds a participant will typically rate four different
people.

**Trade-off to be aware of:** one rating per person per round means each person
accumulates only `R` ratings across the whole event. With R = 4 that is four
numbers per criterion — enough for a team-level or event-level statement, thin
for an individual one. If individual scores matter to the client, the lever is
either more rounds, or two ratings per person per round (a double cycle: A rates
B *and* C). The second costs about 20 extra seconds of participant time per round
and roughly doubles the statistical power. Worth offering as a template setting.

## Test plan for this module

The algorithm is the part most likely to be quietly wrong, so it gets property
tests rather than examples:

- Every participant appears in exactly one team per round.
- Team sizes always within `[min, max]`.
- Leader cap respected whenever `leaders ≤ teams`; when it isn't, excess is
  spread as evenly as possible and reported.
- Repeat pairings never exceed the theoretical minimum by more than 10% across a
  simulated 8-round event.
- Same seed ⇒ byte-identical output, 1000 runs.
- 200 participants, 8 rounds completes within budget on a throttled CPU.
- Fuzz: 1 participant, 2 participants, all one department, all leaders, a
  department larger than a team, P not divisible by k.
