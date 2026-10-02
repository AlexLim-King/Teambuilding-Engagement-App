# 07 — Risks and Blind Spots

You asked for honesty and consideration of blind spots. This document is the
argument *against* parts of the plan. None of it is a reason not to build — but
each item is a way the product can quietly mislead a paying client, and each is
cheaper to handle now than after the first bad report lands on an HR desk.

## 1. Measurement validity — the big one

**What you are selling** is "deeper analysis of team member interaction."
**What the instrument actually captures** is: a single peer's impression, formed
over one short activity, filtered through how much that peer likes and notices
the person, recorded on a 5-point scale with a heavy ceiling.

That is not nothing. It is a genuine, useful signal — group-level patterns from
peer nomination data are well established. But four specific effects sit between
the taps and the truth:

- **Halo.** One global impression drives all three criteria. Expect
  inter-criterion correlations of 0.6–0.8. If they come back above ~0.85, your
  three questions are functionally one question and the report should say so
  rather than presenting three bars.
- **Salience over contribution.** The loud, the funny and the tall get noticed.
  In a 30-minute activity, the person who quietly did the coordination is often
  invisible. Nomination questions ("who took charge") are especially vulnerable —
  they measure who was *conspicuous*.
- **Ceiling and leniency.** In a fun, low-stakes setting people are kind. A mean
  near 4.3 with most mass at 4 and 5 compresses the range and shrinks real
  differences into noise. The bias model corrects the *systematic* part; it
  cannot manufacture discrimination the scale never had.
- **Tiny n.** Four ratings per person per criterion, on a compressed scale, is
  not enough for a defensible individual claim. It is enough for team-level and
  event-level statements.

**What to do:** position the individual numbers as *conversation starters for the
person themselves*, and put the confident claims at team and cohort level ("this
group's leadership signal is concentrated in three people; the other nine were
never nominated"). That is both more honest and, for an L&D buyer, more
saleable — they cannot act on one person's 3.8 anyway, but they can act on
"leadership is concentrated."

## 2. The instrument changes the behaviour it measures

Once participants know they will rate a teammate, some will play to it, and some
will feel surveilled during what was sold as a fun day. Two concrete risks:

- **Reciprocity and collusion.** In a team of five over four rounds people work
  out that they will be rated by teammates. "You rate me well, I'll rate you
  well" is easy. The cycle assignment helps (A rates B but B rates C, so there is
  no direct back-scratch pair), but it does not eliminate group norms.
- **Chilling the event.** If the evaluation feels like appraisal, participation
  drops and the teambuilding value — the thing the client actually bought — goes
  down. Framing matters enormously: "help us pair people better next time" lands
  very differently from "rate your colleague."

**What to do:** the anonymity interstitial (P-5), positive-only feedback to
participants, and never showing rankings in the room.

## 3. Consequences you do not control

Whatever you hand a client, you cannot control what happens next. The plausible
bad outcome is that a number built for a fun day, with n = 4 behind it, turns up
in a performance conversation as evidence about someone's career.

Your decision to keep per-person scores on the facilitator's screen and give the
client aggregates plus positive-only highlights removes most of this exposure —
there is no numeric league table to misuse, because none is produced. That is the
right call, and it is worth defending when a client asks for the raw scores,
because they will.

**What to do:** put the posture in the engagement terms so the answer is agreed
before the day, not negotiated after it. Every export carries a header — *derived
from peer impressions during a teambuilding activity; not validated for
performance assessment.* Never build a "bottom performer" view. If you later
decide a specific client should receive individual scores, make it an explicit,
logged, per-event decision with its own consent wording — not a default that
quietly drifts on.

## 4. The offline distribution problem

Covered in full in [05](05-architecture.md#the-offline-distribution-problem---be-clear-eyed-about-this).
The short version: offline-first solves participants *submitting* without signal;
it does not and cannot solve participants *receiving* team assignments with no
network, because a browser page has no phone-to-phone transport. The facilitator
display is the v1 answer. If your venues are genuinely remote — outdoor,
kampung, island resorts — this is the single most likely cause of a failed event,
and local hub mode moves up the roadmap.

## 5. Name entry at scale

Sixty people typing their name into an autocomplete simultaneously, in the first
two minutes, on venue wifi. Realistic failure modes: two people claim the same
name; someone picks the wrong "John Lim"; a walk-in isn't on the list; someone's
phone is in a language the keyboard fights.

Mitigated by claim-locking, department disambiguation, greyed-out already-joined
names, and a one-tap facilitator re-claim. But budget for the fact that **the
first five minutes of the first real event will be rough**, and run a pilot with
a friendly client before selling it.

## 6. The bias correction can be worse than nothing

Applied naively, correcting for rater leniency on 4 data points adds noise rather
than removing bias. The shrinkage in [04](04-scoring-and-bias.md#shrinkage---the-part-that-stops-this-being-dangerous)
is what keeps this safe — but it must actually be implemented, and the
disconnected-graph check must actually run. An adjusted score that looks
scientific while resting on two ratings is more dangerous than a raw mean,
because people trust it more.

**Test:** the synthetic recovery study in
[04](04-scoring-and-bias.md#validating-that-any-of-this-works) is not optional.
Run it before the first client sees a number.

## 6b. NRIC is the most dangerous data in the system

Deriving gender from the NRIC is a good idea operationally and a genuine liability
if implemented casually. A namelist with NRICs is a materially worse file to leak
than a namelist with ratings: the number encodes date of birth and place of birth,
it is used as an identity credential across Malaysian institutions, and it cannot
be reissued after a breach.

The design answer is to never hold it: parse in the browser, derive gender,
discard. That is specified in
[00](00-decisions.md#nric-handling---read-this-before-writing-the-importer) and it
must be enforced at the code level — no `nric` column exists in the schema, and
the import parser must be reviewed specifically for accidental persistence
(a debug log, an error report, a cached upload, a sourcemap). This is the single
most likely place for a well-meaning implementation to leave the number lying
around.

Second-order risk: a mistyped or truncated NRIC still parses and yields a
*confidently wrong* gender. Hence format validation and the visible derived split
in the import preview — a silent wrong answer is worse than a loud failure.

## 6c. Balance-first has a cost you will eventually notice

You chose balance over novelty, for good reasons
([00](00-decisions.md#the-trade-you-just-made-balance-first)). The cost arrives
later in the day, in the fourth or fifth round, as people noticing they are with
someone they were with before. Simulation puts it at 10–20% of achievable
coverage.

Two mitigations, neither of which requires changing your choice: the weights are
per-event, so a client whose stated goal is cross-department mixing can be run
novelty-first; and the round planner's coverage forecast tells you before the
event whether the configuration will hold up, so a longer day gets larger teams
rather than more repeats.

## 6d. Currency makes every bug visible and personal

A wrong adjusted score is invisible — nobody can check it. A wrong balance is
discovered immediately, by the person it belongs to, standing at a counter in
front of their colleagues, with physical money changing hands. Currency converts
quiet software faults into public incidents.

The design answers this with structure rather than care: an append-only ledger so
no number can drift from its history, integer arithmetic so nothing rounds,
compare-and-set so a double tap cannot overdraw, a single counter device so two
facilitators cannot race, and reversibility on every action so any mistake is one
tap to fix. Specified in [10](10-currency.md).

Two residual risks worth naming:

- **Mis-selection at the counter.** Two people with the same name, wrong balance
  zeroed. Mitigated by department shown in the picker and a prominent Undo, not
  prevented — see
  [10](10-currency.md#if-the-wrong-person-is-cashed-out). This was an informed
  choice to keep the queue moving.
- ~~**Participants trusting a stale cached balance.**~~ Resolved by design: the
  participant balance screen is pull-only and requires a connection, so no
  authoritative figure is ever held on a phone. A never-fetched balance shows
  nothing rather than a guess.

## 6e. Currency can crowd out the thing it is meant to encourage

Worth flagging because it is the counter-intuitive one, and because it is well
established in motivation research: attaching extrinsic rewards to an activity
people already enjoy can **reduce** intrinsic engagement, and shift behaviour
toward whatever is measured and paid.

Concretely, for your events: once currency is on the table, teams optimise for
winning rather than for the collaboration the day is supposedly teaching. A team
that wins by letting its one strong member do everything earns the same as a team
that wins by including everyone — and the currency cannot tell them apart.

This is not an argument against the feature; you already use currency successfully
and know its effect in the room better than any paper does. It is an argument for
two cheap safeguards:

1. **Pay for participation as well as placing.** A non-trivial amount for every
   team that completes, so the gap between first and last is motivating rather than
   decisive. Your preset makes this a one-time setup choice.
2. **Watch for it in the data.** You now have both win records and peer ratings, so
   you can actually check whether teams that win rate each other *worse* on
   `support` — which would be the signature of exactly this problem. If that
   correlation shows up across events, the payout spread is too steep.

The second point is only possible because the two systems are separate. It is a
real argument for having kept them apart.

## 6f. Non-response is signal, and also a trap

Counting non-response is right for an engagement report: someone present, active,
and declining to submit is telling you something real. Two traps come with it.

**The first is attribution.** A refusal, a dead battery, no signal, and a closed tab
are indistinguishable in the data. The design answer is the one-tap excuse, plus an
absolute rule that no surface ever states a motive — *"did not submit"* is
observable, *"refused"* is a guess about a person that could follow them into a
performance conversation. The facilitator was in the room and supplies the
interpretation.

The residual risk is the excuse going unused. It is one tap on the chase list for
exactly this reason, but a busy facilitator will miss some, and a quiet participant
with a flat battery will occasionally be counted as disengaged. Worth knowing when
reading a single low participation figure, and worth saying to a client.

**The second is that a composite invites being read alone.** "Engagement 41" will
get acted on before anyone reads the breakdown. This is why the components are
rendered on the same row rather than behind a tap, why no composite exists when its
peer component is thin, and why a suppressed row cannot be sorted into a ranking.
Those are structural guards, not guidelines — the pressure to just sort by the one
number is constant.

## 7. Legal and regulatory

Peer evaluations of named individuals are personal data, and NRICs are personal
data of a much more sensitive kind. Malaysia's PDPA 2010 is the operative regime
for Malaysian events; Singapore's PDPA if you run there. Under either:
consent (or a stated legitimate purpose), a retention limit, an access right, and
a named controller. If any participant is in the EU, GDPR adds a right to
erasure and a stricter basis test. A participant asking "what did people say
about me" creates a direct tension with the anonymity you promised them — the
answer must be *aggregate ratings received, never per-rater* — and that policy
needs to be written down before someone asks.

Decide with the client who is controller (recommended: the client company; you
are processor) and get it into the engagement terms.

One note on the currency: it is a points ledger that converts to physical tokens at
a counter and is spent on site the same day. It is not stored value, it is not
redeemable for cash, and it does not persist beyond the programme — which keeps it
clear of anything resembling a payment instrument. Worth keeping it that way. The
moment a balance becomes transferable between people, or survives indefinitely, or
converts to something with cash value, the regulatory picture changes and is worth
checking before you build it.

## 8. Business model risk

The analytics are the differentiator, but they are also the part that requires
statistical literacy to sell and to explain. A facilitator who cannot answer "why
is my score 3.9 when everyone rated me 4?" will erode trust in the whole product.
Budget for a one-page explainer and facilitator training, and build the UI so the
adjusted score, raw mean, and n always appear together — the explanation should
be visible on the screen, not in someone's memory.

## If the watch is non-negotiable

If a wrist device is part of what you sell rather than an implementation
preference, the plan changes in these ways:

- **Hardware:** Wear OS watches from ~US$130 each, owned and managed by you. For
  a 60-person event that is roughly US$8,000 of inventory, plus charging,
  sanitising, sizing, and loss.
- **Build:** Kotlin + Compose for Wear, a separate app from the participant PWA,
  distributed via Play Store internal testing or sideloading. The `core` package
  (formation, scoring) would need a Kotlin port or a server round-trip.
- **Timeline:** roughly doubles. Expect an extra 6–10 weeks before a usable
  pilot, mostly in device management and pairing, not in the app itself.
- **The upside is real:** a wrist buzz for "evaluation is open" is genuinely
  better than a phone in a pocket, and phone-free is a strong differentiator for
  outdoor and immersive formats.

The recommendation stands — prove the flows and the analytics on the PWA where
iteration is cheap, then port to the wrist once the questions and the scoring are
settled. Porting a validated design is straightforward; validating a design on
hardware you have to charge and hand out is not.
