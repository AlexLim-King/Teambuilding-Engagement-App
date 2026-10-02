# 10 — Results and Currency

## What this feature is

Two connected things:

1. **Record which teams won** each activity — placings, scores, or neither.
2. **Track earned currency per person**, so that at fixed times in the day a
   participant walks to a counter, shows their name, is handed **physical
   currency**, and their balance resets to zero.

The app is a ledger, not a wallet and not a shop. Physical money leaves the
counter and drives the on-site reward system; from that moment the app has no
further interest in it.

The currency is **entirely separate from the peer evaluation**. Nothing a
participant says about a teammate earns anyone anything, and no one earns
anything by being rated or nominated. This separation is a design rule, not an
accident — the moment recognition pays out, nominations become deals and the
measurement in [04](04-scoring-and-bias.md) stops measuring contribution. Keep
them apart.

## Why this is the first genuinely dangerous data in the system

Every piece of data so far has been an **immutable fact**: a rating, once
submitted, is owned by one person, never changes, and can be replayed a hundred
times with no harm. That property is what makes the offline sync in
[05](05-architecture.md) simple — there are no conflicts to resolve because no two
devices ever write the same thing.

A balance is the opposite. It is mutable, it is shared, people care about it, and
a double-applied write or a lost one is a participant standing at a counter being
told the wrong number in front of their colleagues.

So currency gets a different treatment from everything else in this system:

- **An append-only ledger, never a balance field.** Balance is always
  `SUM(amount)` over that person's entries. There is no number anywhere that can
  drift out of step with its own history.
- **Integer units only.** No floating point anywhere near currency. `50` means
  fifty coins; a float would eventually produce `49.99999999`.
- **Every entry reversible.** A mistake is corrected by appending a compensating
  entry, never by editing or deleting. The history stays truthful and the undo is
  one tap.
- **Redemption requires a compare-and-set.** See
  [below](#redemption--cashing-out-at-the-counter).

## Entities

### `programme`

New, because balances persist across a multi-day programme while events are
single days.

| column | type | notes |
|---|---|---|
| `id` | uuid pk | |
| `organisation_id` | uuid fk | |
| `name` | text | "Sime Darby Leadership Retreat 2026" |
| `currency_label` | text | What you call it — "coins", "credits", "Tokens". Shown everywhere in the UI |
| `starts_at`, `ends_at` | date | |

`event.programme_id` becomes a nullable foreign key. A standalone one-day event
has no programme and its balances die with it.

### `programme_participant`

The bank holder. One row per person per programme, surviving every day of it.

| column | type | notes |
|---|---|---|
| `id` | uuid pk | |
| `programme_id` | uuid fk | |
| `roster_person_id` | uuid fk null | Null for walk-ins |
| `display_name` | text | |
| `department` | text null | |

`participant.programme_participant_id` links each day's participant row to the
person's standing identity. Balance attaches to the **programme** participant, so
it survives into day 2 regardless of which phone they bring.

### `round_result`

| column | type | notes |
|---|---|---|
| `id` | uuid pk | |
| `round_id` | uuid fk | |
| `team_id` | uuid fk | |
| `placing` | int null | 1, 2, 3 … null if the activity wasn't ranked |
| `score` | numeric null | Raw score where the activity has one (seconds, points, items built) |
| `notes` | text null | |

Both `placing` and `score` are optional, because activities differ: a race has
times, a build challenge has a judge's ranking, and a reflection exercise has
neither. Recording the result is kept **separate from awarding currency** so a
facilitator can do either without the other — award a participation bonus with no
ranking, or record a result they choose not to pay for.

### `currency_ledger`

Append-only. The single source of truth for every balance.

| column | type | notes |
|---|---|---|
| `id` | uuid pk | Client-generated — the idempotency key |
| `programme_participant_id` | uuid fk | |
| `batch_id` | uuid | Groups the entries created by one facilitator action |
| `kind` | enum | `award` \| `adjustment` \| `redemption` \| `reversal` |
| `amount` | **integer** | Signed. `+50` for an award, `−120` for a redemption |
| `event_id` | uuid fk null | Which day |
| `round_id` | uuid fk null | Which activity, where applicable |
| `team_id` | uuid fk null | Which team the award was for |
| `reason` | text | "Team 3 · 1st place · Blindfold Maze" |
| `created_by` | uuid fk | Which facilitator |
| `reverses_entry_id` | uuid fk null | Set on `reversal` entries |
| `client_seq` | int | Ordering when device clocks lie |
| `created_at` | timestamptz | |

```
balance(person)  = SUM(amount) WHERE programme_participant_id = person
pending(person)  = SUM(amount) FROM pending_award WHERE status = 'pending'
```

That is the whole calculation. Pending amounts are a different table entirely and
never enter the balance. Note there is no `WHERE NOT reversed` clause —
because a reversal is itself an entry with the opposite amount, a plain sum is
always correct. This is deliberate: filtering logic is where ledger bugs live.

`batch_id` matters more than it looks. Awarding 50 each to a six-person team
creates six entries; if you picked the wrong team, you want **one** undo, not six.

## Earned on winning, released on submitting

Currency is **earned** when a team does well and **released** into the person's bank
only when they submit that round's evaluation. Until then it sits visible but
unavailable:

```
┌──────────────┐
│  YOUR BANK   │
│     120      │
│    coins     │
│              │
│ ⏳ 50 pending │
│ Complete your │
│ evaluation to │
│ release it    │
└──────────────┘
```

This makes a refusal cost something real, which is the point — and it is why the
engagement signal in [04](04-scoring-and-bias.md#the-composite-engagement-score) is
meaningful rather than noisy. Someone who forgoes currency, ignores a catch-up
prompt, and does not ask to be excused is making a choice.

### How this stays compatible with an append-only ledger

A pending award is **not money yet**, so it does not go in the ledger. It lives in
its own table with its own lifecycle, and converts into a ledger entry at the moment
of release. The ledger therefore contains only real, released currency and the
invariant `balance = SUM(amount)` survives untouched.

#### `pending_award`

| column | type | notes |
|---|---|---|
| `id` | uuid pk | |
| `programme_participant_id` | uuid fk | |
| `round_id` | uuid fk | The round whose evaluation gates it |
| `team_id` | uuid fk | |
| `batch_id` | uuid | Groups one facilitator action |
| `amount` | **integer** | |
| `reason` | text | "Team 3 · 1st place · Blindfold Maze" |
| `status` | enum | `pending` \| `released` \| `forfeited` \| `cancelled` |
| `released_ledger_entry_id` | uuid fk null | Set on release |
| `created_by` | uuid fk | |

This table is allowed to be mutable precisely because it is not money. The moment it
becomes money it becomes an immutable ledger row and never changes again.

### The four ways a pending award resolves

| | Trigger | Result |
|---|---|---|
| **Released** | Participant submits that round's evaluation | Ledger entry created; balance rises immediately |
| **Released** | Facilitator excuses the round | Same — it was not the participant's fault |
| **Released** | Facilitator releases manually | Same — an override that always exists |
| **Forfeited** | Facilitator finalises the round with no submission and no excuse | No ledger entry. Participant sees it go |
| **Cancelled** | Facilitator undoes the award while still pending | No ledger entry, no forfeit on anyone's record |

Release is **immediate on submission** — the balance moves while the participant is
still looking at the screen. "Evaluation submitted · +50 released" is the whole
engagement payload; a delayed release teaches nothing.

**Forfeiture is shown, not silent.** An unseen consequence shapes no behaviour, and
the mechanic only works if round 2 is informed by what happened in round 1.

### Order of operations does not matter

In a real room the award and the evaluation can happen in either order. The rule is
stated in terms of state rather than sequence: **a pending award is created already
released if that participant has already submitted for that round.** So awarding
after everyone has submitted releases to everyone instantly, and awarding before the
window opens leaves everything pending — both correct, no special-casing.

### Undo still works in both states

The facilitator's one-tap undo on a `batch_id` handles the mixed case: pending
entries become `cancelled`, already-released ones get a compensating `reversal` in
the ledger. One action, correct regardless of who in the team has submitted.

## Awarding

The facilitator's flow at the end of an activity, in the order it happens in a
noisy room:

```
F-4 Live round  →  "Record result"
                   ┌────────────────────────────────┐
                   │ Blindfold Maze — result        │
                   │                                │
                   │  Team 1   [ placing ▾ ] [ 30 ] │
                   │  Team 2   [ placing ▾ ] [ 30 ] │
                   │  Team 3   [   1st    ] [ 50 ] │ ← per member
                   │  Team 4   [   2nd    ] [ 40 ] │
                   │                                │
                   │  Preset: 1st 50 · 2nd 40 · 3rd 30 · rest 20
                   │                                │
                   │        [ Award all ]           │
                   └────────────────────────────────┘
```

Rules:

- **The amount entered is per member, not a pot to divide.** Enter 50 for Team 3
  and every member of Team 3 gets 50, whether the team has four people or seven.
  This is the whole reason uneven team sizes cause no argument.
- **A saved preset per event** turns the common case into one tap. Placings map to
  amounts; the facilitator can still override any row.
- **Who gets paid**: the team's membership *at the moment the round closed*.
  Someone who withdrew mid-activity does not, someone who joined the team late
  does. The facilitator can adjust individually afterwards.
- **Spot awards.** A facilitator can award any individual any amount with a reason
  — for the person who helped pack up, or to fix a mistake. Same ledger, `kind`
  of `adjustment`.
- **Undo** reverses a whole `batch_id` with one tap, appending `reversal` entries.

## Redemption — cashing out at the counter

The window is opened by the facilitator at a fixed time. A participant comes to
the counter, shows their name, is handed physical currency, and the facilitator
taps **Redeemed**, which takes the balance to zero.

Implemented as a ledger entry of `−(current balance)`, never as a write of zero
to a balance field. One tap, same audit trail as everything else, and reversible.

### The double-tap problem, and how it's handled

"Reset to zero" is the one operation in this system where a repeat is harmful.
Tap twice on a laggy screen, or let a queued request retry, and a naive
implementation takes someone to −120.

Two guards:

1. **Compare-and-set.** The redemption request carries `expected_balance`. The
   server computes the real balance and rejects the entry if they differ,
   returning the current number. A retry of an already-applied redemption finds
   the balance is now 0, not 120, and is refused — so the retry is harmless
   rather than destructive.
2. **Idempotency by `id`.** The entry's client-generated id means the same request
   replayed is recognised and discarded before the balance is even consulted.

### Offline at the counter

This is the one place the offline-first design in [05](05-architecture.md) does
not simply extend, and it is worth being plain about:

- **Awards are safe offline.** They are additive. Two facilitators awarding from
  two disconnected devices both apply correctly when they sync; order doesn't
  matter, nothing is lost.
- **Redemptions are not.** Two devices each taking the same person to zero while
  disconnected will both apply, and the balance goes negative.

The fix is operational rather than clever: **redemption is restricted to one
designated counter device per window.** The facilitator app claims the redemption
role for the window; other devices show "redemption is being handled on another
device" and cannot create redemption entries. Since cashing out happens at one
physical counter at a fixed time, this costs nothing in practice and removes the
conflict entirely — a single writer cannot conflict with itself.

If connectivity at the counter is reliable, the compare-and-set alone is enough
and the single-device rule is belt-and-braces. If it isn't, the single-device rule
is what keeps the ledger correct.

### If the wrong person is cashed out

With name-pick-only re-join (your choice — see
[00](00-decisions.md#open-questions--still-blocking-the-build)), the realistic
failure is not theft but **mis-selection**: two people named John Lim, and the
wrong balance goes to zero at a counter with money changing hands.

The design does not try to prevent this with friction. It makes it reversible:

- **Undo last redemption** restores the balance exactly, as a reversal entry.
- The counter is itself a human identity check — a facilitator is looking at the
  person as they tap.
- The name picker shows department alongside every name, so the two John Lims are
  distinguishable at the moment of selection.

That combination is the right trade. Preventing the error would mean codes people
lose or approvals that slow a queue; making it a one-tap correction costs nothing
and handles every cause, including causes nobody anticipated.

## What participants see

Own balance only, per your decision. The participant screen shows:

```
┌──────────────┐
│   YOUR BANK  │
│              │
│     120      │  ← 56 px, currency_label underneath
│    coins     │
│              │
│ Round 3  +50 │  ← how it was earned, newest first
│ Round 2  +40 │
│ Round 1  +30 │
└──────────────┘
```

The history matters as much as the number. "+50 — Team 3, 1st place, Blindfold
Maze" is the engagement payload; a bare total is just a number. It is also the
cheapest possible dispute resolution: a participant who thinks they are short can
see exactly what they were paid for.

No leaderboard, no other balances, nothing about anyone else — which also means a
participant device never holds anybody else's financial state.

## An unexpected benefit: this is your first validity check

Win data and peer-evaluation data are **independently sourced** — one from the
facilitator observing an outcome, one from participants rating each other. That
independence makes them useful against each other:

> Do teams whose members rated each other highly on *direction* actually win more
> activities?

That is the first **external** check available anywhere in this system. Everything
in [04](04-scoring-and-bias.md) validates the peer measures against themselves —
split-half reliability, bias recovery — which can tell you the instrument is
*consistent* but not that it is measuring anything real. Winning is real, and it
is recorded by someone who isn't being rated.

Honest about the power: one event has only a handful of teams across a handful of
rounds, so the correlation from a single day means little. Accumulated across
events it becomes a genuine answer to "does this app measure anything?" — which is
the question a sceptical L&D buyer will eventually ask, and the one you currently
cannot answer.

Worth logging from the first pilot even though it will say nothing for months.

## Requirements added

| # | Requirement |
|---|---|
| **C1** | Record per-team result for a round: placing, raw score, or neither |
| **C2** | Award currency per team member, as a per-member amount independent of team size |
| **C3** | Saved payout preset per event, mapping placings to amounts, overridable per row |
| **C4** | Spot award or adjustment to any individual, with a reason |
| **C5** | Undo any award batch with one action |
| **C6** | Balance derived from an append-only integer ledger; no stored balance is authoritative |
| **C7** | Redemption zeroes a balance via a compare-and-set, restricted to one designated device per window |
| **C8** | Undo last redemption restores the balance exactly |
| **C9** | Balances persist across every event in a programme |
| **C13** | An award is pending until the participant submits that round's evaluation; pending amounts are shown separately and never counted in the balance |
| **C14** | Release is immediate on submission, and also on facilitator excuse or manual release |
| **C15** | Pending awards forfeit when the facilitator finalises the round, and the participant sees it happen |
| **C16** | An award created after a participant has already submitted is released immediately |
| **C17** | Undoing an award batch is correct whether its entries are pending, released, or a mix |
| **C10** | Participants see their own balance and its earning history; never anyone else's |
| **C11** | Currency label configurable per programme |
| **C12** | Every ledger entry records which facilitator created it |

## Test plan

- Balance always equals the sum of its ledger entries, after any sequence of
  awards, adjustments, redemptions and reversals (property test).
- A redemption replayed 100 times leaves the balance at zero, never negative.
- A compare-and-set with a stale `expected_balance` is rejected and changes
  nothing.
- Reversing an award batch of N members creates exactly N reversal entries and
  restores every balance exactly.
- No balance can go negative through any sequence the UI permits.
- Awards created offline on two devices both apply on sync, in either order, with
  the same final balances.
- Integer arithmetic throughout — a test that fails if any currency value is ever
  a float.
- A pending award never appears in a balance; a released one always does.
- Submitting releases exactly the pending awards for that round and no others.
- Awarding to a team where some members have submitted and some have not produces
  the right mix of released and pending, and one undo resolves all of them.
- Finalising a round forfeits only unreleased, unexcused awards.
- Releasing the same pending award twice creates one ledger entry, not two.
