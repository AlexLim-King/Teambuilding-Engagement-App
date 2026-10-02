# 02 — Data Model

## Design principles

1. **Submissions are immutable, append-only facts.** A rating, once submitted, is
   never updated in place. This makes offline sync trivially idempotent: replay
   the same row twice, get the same state.
2. **Client-generated IDs (UUIDv7).** A device offline must be able to mint an ID
   that will never collide. UUIDv7 sorts by time, which keeps index locality.
3. **Scores are derived, never stored as truth.** Adjusted scores are computed
   from raw ratings on demand. If the bias model changes, historical events
   recompute — no migration, no stale numbers.
4. **Currency is the exception to principle 1, and is specified separately.** A
   balance is mutable, contested, and worth something, so it gets an append-only
   integer ledger, compare-and-set on redemption, and a single-writer rule — none
   of which the rest of the system needs. See
   [10](10-currency.md#why-this-is-the-first-genuinely-dangerous-data-in-the-system).
5. **PII is minimised on participant devices.** Devices cache names and
   departments (needed for autocomplete offline); they never receive emails,
   employee references, or anyone's ratings.

## Entities

```
Organisation
  └── Roster ──── RosterPerson
  └── EventTemplate (criteria, nomination questions, weights)
  └── Programme                       (multi-day; owns the currency)
        ├── ProgrammeParticipant ──── CurrencyLedger (append-only)
        └── Event
        ├── Participant        (a RosterPerson claimed on a device)
        ├── Round
        │     ├── Team ──── TeamMember
        │     ├── RatingAssignment   (who rates whom)
        │     └── Submission
        │           ├── CriterionRating (×3)
        │           └── Nomination      (×0..n)
        │     └── RoundResult   (placing / score per team)
        └── PairHistory        (co-occurrence counts, derived + cached)
```

`Programme` sits above `Event` because a balance outlives a single day while teams
and rounds do not. A standalone one-day event has `programme_id = null` and its
balances die with it. Full currency schema in [10](10-currency.md#entities).

## Tables

### `organisation`
| column | type | notes |
|---|---|---|
| `id` | uuid pk | |
| `name` | text | Client company |
| `retention_days` | int | Default 90 |

### `roster_person`
| column | type | notes |
|---|---|---|
| `id` | uuid pk | Stable within an organisation |
| `organisation_id` | uuid fk | |
| `display_name` | text | As it should appear to peers |
| `normalised_name` | text | Lowercased, accent-stripped, token-sorted — the autocomplete index |
| `department` | text null | Free text; normalised on import |
| `gender` | enum null | `male` \| `female` \| `unspecified`. Balancing input only — **never displayed to peers** |
| `gender_source` | enum | `roster` \| `nric` \| `facilitator` — so a facilitator can see what to double-check |
| `is_leadership` | bool | Drives the separation constraint |
| `employee_ref` | text null | **Never sent to participant devices** |
| `email` | text null | **Never sent to participant devices** |

There is deliberately **no `nric` column**. Where a client namelist carries
Malaysian NRICs, the importer parses them in the browser, derives `gender` from
the final digit (odd = male, even = female), and discards the number. The full
NRIC is never persisted, never transmitted to the server, and never reaches a
participant device — it encodes date and place of birth and is far more sensitive
than anything else in this system. See
[00](00-decisions.md#nric-handling---read-this-before-writing-the-importer) for
the full rules, which the importer must implement, not merely respect.

`is_leadership` is deliberately a plain boolean rather than a seniority level.
The constraint you described — keep leaders apart — is binary in practice. If you
later need "1 director and at most 2 managers per team," this becomes a
`seniority_tier` int and the constraint becomes a per-tier cap; the algorithm in
[03](03-team-formation.md) already handles that generalisation.

### `event`
| column | type | notes |
|---|---|---|
| `id` | uuid pk | |
| `organisation_id` | uuid fk | |
| `programme_id` | uuid fk null | Set for multi-day programmes; null for standalone events |
| `template_id` | uuid fk | |
| `join_code` | text unique | 6 chars, ambiguity-free alphabet (no O/0/I/1) |
| `starts_at`, `ends_at` | timestamptz | |
| `state` | enum | `draft` `open` `running` `closed` `archived` |
| `formation_seed` | int | Makes team formation reproducible (R10) |

### `participant`
| column | type | notes |
|---|---|---|
| `id` | uuid pk | |
| `event_id` | uuid fk | |
| `roster_person_id` | uuid fk null | Null for walk-ins (R5) |
| `programme_participant_id` | uuid fk null | Links this day's participant to their standing identity and bank |
| `display_name` | text | Denormalised — walk-ins have no roster row |
| `department` | text null | |
| `is_leadership` | bool | |
| `device_token` | text | Opaque, device-generated, stored in localStorage |
| `claimed_at` | timestamptz | |
| `status` | enum | `active` `withdrawn` — withdrawn excluded from later rounds |

`device_token` is the whole of participant authentication. It is a 128-bit random
value the device mints on first load and sends as a bearer token. It identifies a
*device*, not a person, and it grants nothing beyond "read my own event, write my
own submissions." Losing a phone means asking the facilitator to re-claim; that
is a one-tap action on the facilitator screen and is the right trade for not
making 60 people invent passwords.

### `round`
| column | type | notes |
|---|---|---|
| `id` | uuid pk | |
| `event_id` | uuid fk | |
| `sequence` | int | 1, 2, 3 … |
| `activity_name` | text | "Blindfold Maze" |
| `nomination_question_key` | text | Drawn from the rotating bank at round creation — see [09](09-question-bank.md) |
| `state` | enum | `planned` `teams_formed` `active` `evaluating` `closed` |
| `evaluation_opened_at` | timestamptz null | |
| `evaluation_closes_at` | timestamptz null | |

### `team` / `team_member`
| column | type | notes |
|---|---|---|
| `team.id` | uuid pk | |
| `team.round_id` | uuid fk | |
| `team.number` | int | What participants are told to gather by |
| `team.label` | text null | "Team 4 — Red" |
| `team_member.team_id` | uuid fk | |
| `team_member.participant_id` | uuid fk | |
| unique | `(round_id, participant_id)` | One team per person per round |

### `rating_assignment`
| column | type | notes |
|---|---|---|
| `id` | uuid pk | |
| `round_id` | uuid fk | |
| `rater_participant_id` | uuid fk | |
| `ratee_participant_id` | uuid fk | |
| unique | `(round_id, rater_participant_id)` | Exactly one assignment per rater per round |

Generated when the round's teams are formed, as a **derangement of each team** —
a permutation where nobody rates themselves. Because a permutation is a bijection,
every member is rated exactly once and no participant is left with zero data. The
chosen derangement additionally excludes 2-cycles (no A↔B back-scratching) and any
`(rater, ratee)` arc present in `rating_history`, which is what guarantees nobody
rates the same person twice across the event. See
[03](03-team-formation.md#never-rating-the-same-person-twice).

### `submission`
| column | type | notes |
|---|---|---|
| `id` | uuid pk | **Client-generated**, the idempotency key |
| `round_id` | uuid fk | |
| `rater_participant_id` | uuid fk | |
| `ratee_participant_id` | uuid fk | |
| `submitted_at` | timestamptz | **Device clock** — may be wrong, see below |
| `received_at` | timestamptz | Server clock, set on ingest |
| `client_seq` | int | Monotonic per device, for ordering when clocks lie |
| unique | `(round_id, rater_participant_id)` | Enforces R18 |

Device clocks are unreliable and are the classic offline-sync trap. `submitted_at`
is kept for interest only; anything that depends on ordering uses
`(client_seq, received_at)`.

### `criterion_rating`
| column | type | notes |
|---|---|---|
| `submission_id` | uuid fk | |
| `criterion_key` | text | `cooperation` \| `helpfulness` \| `leadership` … from the template |
| `value` | smallint | 1–5 |

### `nomination`
| column | type | notes |
|---|---|---|
| `submission_id` | uuid fk | |
| `question_key` | text | `mvp` \| `led_the_team` \| `most_fun` |
| `nominee_participant_id` | uuid fk null | Null = "none / skipped" if the template allows |

Storing nominations as rows keyed by `question_key` (rather than columns) means
adding a fourth question is a template edit, not a schema migration.

### `event_template`
Holds the configurable question set, so a facilitator can run a leadership
programme and a company family day from the same app.

```jsonc
{
  "criteria": [
    { "key": "cooperation",  "label": "Worked well with others", "anchors": ["Rarely","","Sometimes","","Consistently"] },
    { "key": "helpfulness",  "label": "Helped teammates who were stuck" },
    { "key": "leadership",   "label": "Gave the team direction" }
  ],
  // One question per round, drawn in sequence from this bank. See docs/09.
  "nomination_bank": [
    { "key": "decided",   "label": "Who helped the team decide what to do?",  "tag": "LEAD",   "allow_skip": true },
    { "key": "unglamorous","label": "Who did the work nobody else wanted?",   "tag": "WORK",   "allow_skip": true },
    { "key": "encouraged","label": "Who encouraged someone who was struggling?", "tag": "SOCIAL", "allow_skip": true }
  ],
  "nomination_rotation": { "one_per_round": true, "no_repeat_tag_consecutively": true },
  "formation": {
    "target_team_size": 5,
    "max_leaders_per_team": 1,
    "gender_pattern": "even_spread",       // vs "avoid_solo"; see docs/00
    // Balance-first priority. Reordering these changes the emphasis per client.
    "weights": {
      "gender_balance": 25.0, "same_department": 15.0, "repeat_pair": 10.0,
      "leader_repeat": 8.0, "size_balance": 5.0, "hard_violation": 1000.0
    }
  },
  "reporting": {
    "min_n_to_display": 3,
    "show_scores_to_participants": false,
    "client_export": "aggregate_and_highlights"   // never per-person scores
  }
}
```

### `rating_history`
| column | type | notes |
|---|---|---|
| `event_id` | uuid fk | |
| `rater_participant_id` | uuid fk | |
| `ratee_participant_id` | uuid fk | |
| unique | `(event_id, rater, ratee)` | |

The set of directed pairs already used. Read by the derangement search as a
forbidden-arc set so **nobody is ever assigned to rate the same person twice** —
see [03](03-team-formation.md#never-rating-the-same-person-twice). Directed, so
`A→B` does not forbid `B→A`; the reverse direction is a different judgement and is
only softly discouraged.

### `pair_history`
| column | type | notes |
|---|---|---|
| `event_id` | uuid fk | |
| `participant_a_id`, `participant_b_id` | uuid | Stored with `a < b` so each pair has one row |
| `times_together` | int | |

Derived from `team_member`, cached because the formation algorithm reads it
thousands of times per run and must do so offline, in memory.

## What lives on the participant device

```jsonc
// IndexedDB, cleared when the event closes
{
  "event":     { "id", "join_code", "name", "template" },
  "roster":    [ { "roster_person_id", "display_name", "normalised_name", "department" } ],
               // no gender, no NRIC, no email, no leadership flag
  "me":        { "participant_id", "device_token", "display_name" },
  "myTeam":    { "round_id", "team_number", "members": [ { "participant_id", "display_name" } ] },
  "assignment":{ "round_id", "ratee_participant_id", "ratee_display_name" },
  "outbox":    [ { "submission_id", "payload", "attempts", "last_error" } ]
}
```

Gender, leadership status, emails and employee references are all excluded from
this payload. Gender in particular is a balancing input the algorithm needs and
nobody else does — a participant device has no reason to hold it, and shipping it
would put a gender-labelled staff list on sixty phones.

Note the roster is cached in full on every participant device — that is what
makes offline autocomplete possible, and it means **every participant's phone
holds the list of everyone's name and department**. For a company event that is
usually equivalent to the staff directory they already have. It is still worth a
line in the privacy notice, and it is why emails and employee references are
excluded from that payload. If a client objects, the fallback is online-only
server-side autocomplete, at the cost of R4.

## Retention

- On `event.closed + retention_days`: delete `submission`, `criterion_rating`,
  `nomination`, `rating_assignment`, `participant.device_token`.
- On `programme.ended + retention_days`: delete `currency_ledger` and
  `programme_participant`. Keep per-programme totals with no identifiers — a
  spent balance has no reason to outlive the programme that created it.
- Keep aggregate per-event statistics with no individual identifiers.
- A participant may request their own data; the facilitator screen has a
  per-person export for this. What they receive is *ratings they gave*, plus
  aggregate ratings received — never "who said what about you," which would
  break the anonymity promised at join.
