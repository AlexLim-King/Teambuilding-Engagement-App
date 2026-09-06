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

You will hand a client a spreadsheet with named individuals and numeric scores.
You cannot control what happens next, and the plausible bad outcome is that it
turns up in a performance conversation — an instrument built for a fun day, with
n = 4, used as evidence about someone's career.

**What to do:** put it in the contract and on the export. Every exported file
carries a header: *derived from peer impressions during a teambuilding activity;
not validated for performance assessment; n per person is small.* Refuse to build
a "bottom performer" view. Consider withholding individual-level export by
default and making it an explicit, logged request.

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

## 7. Legal and regulatory

Peer evaluations of named individuals are personal data. Under Singapore's PDPA:
consent (or a stated legitimate purpose), a retention limit, an access right, and
a named controller. If any participant is in the EU, GDPR adds a right to
erasure and a stricter basis test. A participant asking "what did people say
about me" creates a direct tension with the anonymity you promised them — the
answer must be *aggregate ratings received, never per-rater* — and that policy
needs to be written down before someone asks.

Decide with the client who is controller (recommended: the client company; you
are processor) and get it into the engagement terms.

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
