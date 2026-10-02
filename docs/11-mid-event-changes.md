# 11 — Mid-Event Roster Changes

Someone falls ill, gets called away, or arrives an hour late. The facilitator marks
it on their own device, and the next round forms without them.

## Scope: this is a small feature, deliberately

Almost every real occurrence falls into one of two timings, both easy:

- **Before an activity starts**, or
- **After teams are assigned but before the evaluation opens.**

The genuinely awkward case — someone leaving *during* an open evaluation window —
is rare, and is handled by one simple rule rather than a decision tree. The design
below reflects that: the common paths are trivial and the rare path is cheap.

## The facilitator action

One tap on the participant's row: **Mark as left**. And one tap to undo it:
**Mark as returned** — people who step out feeling unwell often come back after a
break, and a flow that cannot bring them back is a flow that gets worked around.

`participant.status` moves between `active` and `withdrawn`. That is the whole
state machine.

This is **safe offline** without any of the machinery currency needed. A status
change is owned solely by the facilitator, it is not contested by any other
device, and applying it twice has the same result as applying it once. It queues
and syncs like any other facilitator write.

## What happens, by timing

### Before teams are formed for the next round

Nothing to handle. `withdrawn` participants are excluded from formation, and the
algorithm simply works with a smaller room. Already specified in
[03](03-team-formation.md#incremental-changes-between-rounds).

### Teams formed, evaluation not yet open

The only case needing real logic, and it is three lines of it: **regenerate the
derangement for that one team** at its new size. Nobody has been asked to rate
anyone yet, so nothing visible changes except the team list. Other teams are
untouched.

If the team drops below `min_size`, move one person in from the largest team —
never re-form the whole round. A participant already standing under a number
should not be moved because someone else went home.

### Evaluation already open

One rule, no facilitator decision:

- **The person who left is still rated by whoever was assigned to them**, with a
  note on that screen: *"Siti left partway through — rate what you saw, or skip."*
  They were present for most of the activity, so the observation is usually valid.
  Skip is always available.
- **The rating they themselves owed is simply missing.** The person who was going
  to be rated by them ends the round with one fewer rating.

That gap needs no special handling — see below.

## Why a missing rating needs no fix

The instinct is to fill the hole with an average. It is the right instinct, and
the scoring model in [04](04-scoring-and-bias.md) already acts on it — but through
shrinkage rather than imputation, which matters.

**Shrinkage** pulls a sparse estimate toward the global mean in proportion to how
little data supports it. Someone with 3 ratings instead of 4 has their estimate
drawn slightly further toward average, automatically, by the right amount.

**Mean imputation** — inserting a synthetic rating equal to the average — looks
equivalent and is not:

- It reports `n = 4` when only three people actually rated them. Every consumer of
  that number, including the facilitator and the `min_n_to_display` rule, is then
  working from a false count of how much is known.
- It shrinks variance across the whole event. Pile up enough imputed averages and
  real differences between people start disappearing into the middle.
- It is indistinguishable from real data once stored, so nobody downstream can
  tell which numbers were observed and which were invented.

So: **no imputation.** `n` drops to 3, the shrinkage handles it, and the displayed
count stays truthful. This is a scope reduction, not an omission.

## Non-completion: tracked, not subtracted

Whether a participant completed their assigned evaluations is recorded as its own
field, not folded into their score:

```
completion = evaluations submitted / evaluations assigned     e.g. "3 of 4"
```

Shown beside the score on the facilitator view. Never subtracted from it.

The reason is that a peer-evaluation score claims to measure what teammates
observed about someone's contribution. Mixing in a compliance figure makes the
number mean something other than its label, and the most common cause of a missed
evaluation is precisely the case you least want to penalise — someone who went
home ill. That number can reach a coaching conversation.

**Where the consequence belongs instead:** the currency. It is explicitly an
engagement tool, carries no measurement claim, and already rewards participation.
A round you did not complete simply earns no participation payout.

### The setting, if you disagree

`reporting.completion_penalty` in the event template, **off by default**:

```jsonc
"reporting": {
  "completion_penalty": null   // or e.g. { "per_missed": 0.2, "max": 0.5 }
}
```

When set, a non-submitter's adjusted score is reduced by `per_missed` per missed
evaluation, capped at `max`. The facilitator view labels any affected score
*"includes completion penalty"* so the number is never silently different from
what it claims to be. Off by default because of the reasoning above, but it is one
setting away if you want it.

## Currency

**A member of the team when the round started is always included in that round's
award**, whether or not they finished it. Your decision, and the generous reading
is the right one — the alternative penalises illness, and the amounts involved are
not worth the awkwardness of adjudicating who left early enough to forfeit.

The award screen shows withdrawn members with a small "left partway" marker so the
facilitator knows what they are paying for, but no checkbox and no decision to
make.

## Reactivation preserves history

Marking someone **returned** restores them to formation for subsequent rounds, and
critically **keeps their accumulated history**:

- `pair_history` — so they do not get re-teamed with people they already worked
  with before stepping out.
- `rating_history` — so they are not assigned to rate someone they already rated.
  Without this, leaving and returning would be a loophole around the no-repeat
  guarantee in [03](03-team-formation.md#never-rating-the-same-person-twice).
- Their currency balance, untouched. It lives on the programme participant, not
  the event participant.

## Does this change the participant side?

**Three small additions. Nothing clever.** The participant app stays what it has
always been: a renderer of whatever state it last synced. Every decision is made
on the facilitator's device.

1. **A terminal screen for the person who left.** *"You've been marked as left —
   thanks for joining us."* Without it they sit staring at a stale team number
   waiting for an activity that is not coming. If they are marked returned, the
   screen goes back to normal on next sync.
2. **A note on the evaluation screen** when the assigned ratee left partway, with
   skip made obvious.
3. **The team list drops the name** on next sync. If they are offline it updates
   late, which is harmless.

No new offline logic, no new storage, no new conflict handling.

## One principle this makes explicit

**A participant action that was valid when they took it is never rejected
retroactively.**

Someone offline submits a rating for a teammate who was marked withdrawn two
minutes earlier. The submission arrives late and references a now-withdrawn ratee.
The server **accepts it** and flags it `ratee_withdrawn = true`; the analysis
decides whether to include it.

Rejecting would lose real data and show an error for something entirely outside
that participant's control or knowledge. Accept, flag, decide later — this applies
to every late-arriving write in the system, not just this one.

## Test plan

- Withdrawing before formation excludes the person; no other assignment changes.
- Withdrawing after formation but before evaluation regenerates exactly one team's
  derangement; all other teams byte-identical.
- A team falling below `min_size` gains exactly one member, from the largest team.
- Withdrawing during an open evaluation leaves submitted ratings untouched and
  creates no orphaned assignment.
- Withdraw → return preserves `pair_history` and `rating_history`; the returning
  participant is never assigned a ratee they already rated.
- A rating submitted offline for a since-withdrawn ratee is accepted and flagged,
  never rejected.
- Marking withdrawn twice, or from two facilitator devices, converges to the same
  state.
- No score is imputed anywhere: a person rated 3 times reports `n = 3`.
