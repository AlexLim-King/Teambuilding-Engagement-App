# 04 — Scoring and Rater Bias

Your instinct is exactly right: **some people always score high and some always
score low**, and a raw average silently rewards whoever happened to be rated by
generous people. This is the core intellectual content of the product. Everything
here is about turning a pile of 1–5 taps into numbers that mean something.

## Notation

`r[i][j][c]` — the rating rater *i* gave ratee *j* on criterion *c*, in 1–5.

Each rater produces one submission per round, so over an event with `R` rounds a
rater contributes `R` ratings and a ratee receives `R` ratings (guaranteed by the
cycle assignment in [03](03-team-formation.md#rating-assignment)).

## Three candidate methods, and why the third wins

### 1. Raw mean — the baseline you must beat

`score[j][c] = mean over i of r[i][j][c]`

Simple, explicable, and wrong in exactly the way you identified. Keep computing
it, and **show it beside the adjusted score** — when the two disagree sharply,
that gap is itself the interesting finding ("Priya's raw score is middling
because both her raters are unusually harsh").

### 2. Per-rater z-scores — the obvious fix, and a trap

`z = (r − mean_i) / sd_i`

Tempting, and genuinely standard in survey work. It fails here for two reasons:

- **`sd_i` is estimated from 3–4 numbers.** A rater who gave 4, 4, 4, 5 has an
  SD of 0.5; one who gave 4, 4, 4, 4 has an SD of 0. Dividing by that is
  meaningless at best and rank-inverting at worst.
- **It confounds leniency with luck.** A rater who was, by chance, teamed with
  four genuinely excellent people has a high mean. Z-scoring reads that as
  generosity and deflates four deserving people.

### 3. Two-way additive model with shrinkage — **recommended**

Model each rating as a global level, plus a rater's personal leniency, plus the
ratee's actual standing:

```
r[i][j][c] = μ[c] + α[i] + β[j][c] + ε
             ^      ^      ^
             |      |      └─ what we want: this person's standing on criterion c
             |      └─ this rater's leniency (positive = generous)
             └─ the criterion's overall level
```

This is the same family as the many-facet Rasch model used to adjust judges in
Olympic scoring and in academic peer review. It solves the z-score problem
because α and β are estimated **simultaneously** — a rater surrounded by
excellent people gets a high mean *explained by β*, not misattributed to α.

**Design choice: pool α across criteria.** Leniency is a trait of a person, not
of a question. Estimating one α per rater from all `R × 3` of their ratings
triples the data behind it. Ratee effects β stay per-criterion, because being
helpful and taking charge are different things and must be allowed to differ.

### Estimation — alternating least squares

```
μ[c] ← mean of all ratings on criterion c
β    ← 0
repeat until max change < 0.001 (typically 15–30 iterations):
    α[i] ← mean over that rater's ratings of ( r − μ[c] − β[j][c] )
    α    ← α − mean(α)                        # identifiability constraint
    β[j][c] ← mean over ratings j received on c of ( r − μ[c] − α[i] )
```

Milliseconds for any event size. Runs on the facilitator's device; no server
needed.

**Identifiability requires a connected rating graph** — if the room splits into
two groups that never rate across the boundary, their α values are on separate,
non-comparable scales. The rotating teams from [03](03-team-formation.md) produce
connectivity naturally, but the app must **check it** (union–find over the
rater→ratee edges) and, if the graph is disconnected, either report per-component
or fall back to raw means with a visible warning. Do not silently emit numbers
that compare across a disconnected graph.

### Shrinkage — the part that stops this being dangerous

With four ratings behind an estimate, the raw α and β are noisy. Applying them at
full strength would replace one bias with another. So shrink each toward zero in
proportion to how little data supports it:

```
α̂[i]    = α[i]    · n_i    / (n_i    + k_α)
β̂[j][c] = β[j][c] · n_jc   / (n_jc   + k_β)
```

`k` is the ratio of noise variance to true between-person variance. Estimate it
from the data by variance components where possible, with a floor; failing that
use `k_α = 4`, `k_β = 3`, which are conservative at these sample sizes.

The effect is exactly what you want: a rater with 12 ratings gets a
`12/16 = 75%` leniency correction; a latecomer with 2 ratings gets `2/6 = 33%`,
so a thin, noisy estimate cannot swing anyone's score much.

### Final reported score

```
adjusted[j][c] = μ[c] + β̂[j][c]        # back on the familiar 1–5 scale
se[j][c]       = σ_ε / sqrt(n_jc)      # σ_ε from model residuals
```

Report `adjusted ± 1.96·se`, the raw mean, and `n`. **Never report a score
without its n.** Below `min_n_to_display` (default 3) the app shows "insufficient
data" and no number — an unavoidable rule, because a single rating dressed up as
a score is how this product would damage someone's standing at work.

## Precision weighting (v2)

A rater who gives 5,5,5,5 conveys almost no information; a rater whose ratings
track the consensus conveys a lot. Weighting each rating by the inverse of that
rater's residual variance makes the informative raters count more:

```
w_i = 1 / max(σ²_resid,i , floor)
```

Genuinely valuable, but it needs enough ratings per rater to estimate `σ²_resid`
(realistically 8+, i.e. 3+ rounds with double rating). Ship it behind a flag once
you have real event data to validate against, not before.

## Nominations

Nominations are a different animal from Likert ratings and must **not** be
averaged into the same composite. They are winner-take-all, so they measure
consensus and salience rather than degree.

Because the question **rotates each round** ([09](09-question-bank.md)), the
statistics work differently from a repeated MVP question — in a way that is on
balance better.

### Per-question: qualitative only

A rotating question is asked in exactly one round, so a person has at most one
round's worth of data on it. Two nominations versus one on a single question is
noise. Per-question results are therefore reported as **named highlights, never
scores**:

> Round 2 — *"Who did the work nobody else wanted?"*
> Named by 3 teammates: **Farid**. Also named: Wei Ling, Priya.

That is exactly the form a client wants for talent-spotting anyway, and it cannot
be mistaken for a ranking.

### Aggregate: the reportable number

Across all rounds, the normalisation is clean. In a round with team size `s`, each
of the other `s − 1` members nominates one of `s − 1` candidates, so **under pure
chance a person expects exactly 1 nomination per round played**:

```
nomination_index[j] = total nominations received[j] / rounds played[j]
```

- `1.0` = chance
- `2.5` = named two and a half times more often than chance
- `0.0` = never named

This handles unequal team sizes, late joiners, and people who sat out a round —
all of which corrupt a raw count. Skips reduce the denominator's effective size
and are accounted for by using nominations actually cast rather than rounds
nominally played.

**Rotation makes this measure better, not worse.** With a repeated MVP question,
a high index means "was consistently the most conspicuous." With four different
questions, it means "stood out on *some* positive dimension" — which catches the
quiet organiser, the persistent one, and the person who encouraged someone, not
just the loudest. It is a broader construct and a fairer one, and it is closer to
what "outstanding contributor" actually means.

### By trait tag

Each question carries a `LEAD` / `WORK` / `SOCIAL` tag, so nominations aggregate
into three interpretable dimensions:

```
tag_index[j][t] = nominations received on tag-t questions / rounds where a tag-t question was asked
```

With one question per tag in a 4-round event these are still small numbers — treat
them as a **profile shape**, not a score. "Farid was named on both `WORK`
questions and neither `LEAD` question" is a real, useful, defensible observation.
"Farid scores 2.0 on WORK" is not, and the UI must not render it that way.

### Statistical honesty

A one-sided binomial test against `p = 1/(s−1)` gives an honest "is this above
chance?" flag when you want one. Do not rank people on an index built from 0
versus 1 nomination — the app suppresses ranking below the same `min_n` threshold
that governs Likert scores.

## Choosing criteria that are actually different

The placeholders — cooperativeness, willingness to help, leadership — contain a
redundancy worth fixing before you print the questions. "Cooperativeness" and
"willingness to help" will correlate somewhere around 0.8 in practice; you will
have spent two of your three questions on one construct, and participants will
notice they are answering the same thing twice.

A set that spans more of the space, each measuring something the others do not:

Your clients want to spot **potential leaders and outstanding workers**. That
lens argues for one criterion per dimension of that judgement, each measuring
something the others do not:

| Key | Participant-facing wording | Construct | Serves |
|---|---|---|---|
| `contribution` | "Put real effort into the task" | Task input | Outstanding worker |
| `support` | "Made it easier for others to contribute" | Interpersonal / inclusion | Team glue |
| `direction` | "Helped the team decide what to do" | Emergent leadership | Leadership potential |

These are a starting point, not a decision — final wording is still open
([00](00-decisions.md), question 4). The constraint to hold on to is that the
three must measure different things; two near-synonyms cost you a third of your
data.

Two further points on wording, both of which matter more than the algorithm:

- **Anchor the scale behaviourally**, not evaluatively. "Consistently / Sometimes
  / Rarely" beats "Excellent / Good / Poor" — it lowers the ceiling effect and
  makes a 3 feel like an observation rather than an insult.
- **Expect a ceiling.** Peer ratings in a fun, low-stakes setting cluster at 4–5;
  a mean near 4.3 with heavy left skew is normal. The additive model still orders
  people correctly, but the scale is compressed and the differences are small.
  If, after a few real events, more than ~70% of ratings are 5s, the scale is not
  discriminating and the fix is wording and anchors — or an ordinal (ordered
  logit) model — not more arithmetic.

## What the app should refuse to say

A short list, enforced in code rather than left to the facilitator's judgement:

- No individual score with `n < 3`.
- No cross-event comparison of individuals unless the same criteria, same
  template, and a connected rating graph across both.
- No "bottom performer" ranking surfaced anywhere in the UI. The product forms
  teams and celebrates contribution; the moment it produces a defensible-looking
  list of the worst people at a company party, you own a liability, not a
  feature.
- No score shown to participants at v1 (see [00](00-decisions.md), question 3) —
  nominations received are positive-only and safe to show.
- **No per-person scores in the client deliverable at all.** The client receives
  team-level patterns and a positive-only highlights list built from nominations.
  Adjusted individual scores stay on the facilitator's screen, where they inform
  coaching conversations rather than becoming a spreadsheet in someone's HR
  folder. See [07](07-risks-and-blind-spots.md#3-consequences-you-do-not-control).

## Validating that any of this works

Before trusting the numbers in front of a paying client:

1. **Synthetic recovery.** Generate data with known true β and known rater
   biases; confirm the estimator recovers them, and measure how the error falls
   as rounds increase. This also produces the honest answer to "how many rounds
   do we need?" — put that table in the sales deck.
2. **Split-half reliability** on real events: split each person's raters in two,
   correlate the halves. Below ~0.5 the individual scores are not reportable and
   you should be selling team-level insight only.
3. **Rater-bias sanity check.** The distribution of α should be roughly
   symmetric with SD around 0.3–0.6 on a 5-point scale. Much larger and something
   is wrong with the questions; near zero and the correction is not earning its
   complexity.
4. **A/B the wording** across events; ceiling effects are a wording problem.
