# 15 — Brand

Core Apex has no formal brand guide, so the system below is derived from the logo,
the staff uniform, and the conditions the app actually runs in.

## What the logo gives us

Sampled directly from both logo files:

| | Hex | Where it appears |
|---|---|---|
| Brand red | `#DC1B21` | The bright end of the "CORE" gradient, and the C in the CA mark |
| Deep red | `#6B0000` | The gradient's dark end |
| Black | `#000000` | "APEX", the A in the mark, the tagline |

The wordmark is angular and slightly extended, with the tagline — *Discover by
Experience* — set in widely letterspaced caps beneath it.

## Three things carried into the app

**The polo is the layout.** Staff wear black with the mark on the chest and the full
logo on the back. The app mirrors that: black chrome bars, white content, red for
action. It reads as Core Apex without the brand shouting over the content.

**The tagline's letterspacing becomes the section label.** Reused as `.eyebrow`
throughout — uppercase, `0.22em` tracking, muted. The cheapest piece of identity in
the system and the most recognisable.

**Light base, not dark.** The obvious move for a black-and-red brand is a dark
theme. It is the wrong one here: participants use this outdoors in Malaysian sun,
where a near-white background at full brightness is meaningfully more readable than
a dark one. The team-number screen in particular has to survive direct sunlight, so
it is pure black on near-white — no brand colour at all.

## Palette

| Token | Hex | Use | Contrast on white |
|---|---|---|---|
| `brand` | `#DC1B21` | Primary actions, currency figures | 4.97:1 ✓ AA |
| `brand-hover` | `#B81419` | Hover, pressed | 6.6:1 ✓ |
| `brand-deep` | `#6B0000` | Wordmark gradient only | 12.4:1 ✓ |
| `ink` | `#141414` | Body text, **all names** | 17.4:1 ✓ AAA |
| `ink-display` | `#000000` | Team number, headlines | 21:1 ✓ |
| `muted` | `#52525B` | Secondary text | 7.7:1 ✓ |
| `danger` | `#7F1D1D` | Destructive actions, errors | 10.0:1 ✓ |
| `surface` | `#FFFFFF` | Page | — |
| `surface-sunk` | `#F4F4F5` | Panels, selected rows | — |
| `chrome` | `#000000` | Top bars, facilitator nav | — |

Every value is checked against WCAG AA and the ratios are printed on the `/style`
page, so one cannot quietly drift below the threshold.

## Two rules that are not negotiable

### Names are never red

Setting a living person's name in red reads badly in Malaysian corporate settings.
This app puts participant names on nearly every screen — the autocomplete, the team
list, the rating prompt, the nomination list, the redemption counter — so this is a
structural constraint, not a stylistic preference.

- Names render in `ink`, on a neutral ground, always.
- Selection and emphasis use `surface-sunk` with a black rule, never a red fill or a
  red tint behind a name.
- Red is for controls and actions only.

Encoded as `.person-name` and `.row-selected` so it is a default rather than
something to remember.

### Brand red means *primary action*, so destructive actions are not solid red

The brand colour and the universal "danger" colour are the same hue, which would
otherwise make a destructive button indistinguishable from the main call to action.

- Primary action: solid `brand`, white text.
- Destructive: outlined in `danger` with maroon text, and the label always names the
  consequence — *"Forfeit 150 coins"*, not *"Confirm"*.
- Errors: `danger` text with an icon. Nothing relies on colour alone.

## Type

| | Face | Use |
|---|---|---|
| Display | **Oxanium** 600/700 | Team numbers, currency figures, headings. Angular and extended — the nearest free match to the wordmark |
| Text | **Inter** | Names, forms, body. Chosen for legibility at 320px on a cheap Android |

Oxanium is deliberately restricted. It carries the brand where the brand should be
felt — the number someone reads across a field — and stays out of everything a
person has to actually read.

## The currency release

Plain. Brand red on the figure, no gradient, no flourish. The moment lands because
the number moves into the balance while the participant is watching, not because it
is decorated. Over-designing it would also push red into territory next to names.

## Seeing it

`/style` renders the whole system — swatches with live contrast ratios, the team
number, the currency release, the rating control, the name rules, and the type
scale. It is the reference, and it is also a reasonable thing to show a partner.

All tokens live in `apps/web/app/brand.css`. That file is the single source; nothing
else should define a colour.
