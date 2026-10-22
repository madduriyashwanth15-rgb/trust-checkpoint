# Design plan: "Flipkart in 2040" redesign

## Idea
The app is quiet and the agent is the interface. The one bold moment is the trust card, and inside it one thing: the tie made visible. Two products side by side, same price, same rating, and the sponsored one was picked. Everything else stays restrained so that moment lands.

## Palette
| Token | Hex | Role |
|---|---|---|
| --blue | #2874F0 | Identity: agent orb, progress fill, focus ring, large type accents (non-text or large text only: 4.3:1 on white) |
| --blue-ink | #1A56C4 | Filled surfaces that carry text (agent proposal card), 6.6:1 with white |
| --yellow | #FFE11B | Identity: the one primary action per screen, ink text on it |
| --ink | #15233F | Text, deep navy rather than black |
| --surface | #F4F7FC | Cool daylight page inside the phone; white for raised things |
| --trust | #0F5E58 / #CCFBF1 | The checkpoint layer only (badge, its buttons), so it reads as a separate layer over the app |

Lights, darkened to pass 4.5:1 as text: Earned #1E7B34, Check #9A5B00, Hold back #B42318, Not enough evidence #5F6673.

## Type
Lexend (bundled) for headings, numbers and buttons: wide, calm, legible. Outfit (bundled) for body. Inside the phone: 14 minimum, 16 body, 18 card rows, 24 sheet title, 30 greeting. Numbers use tabular figures.

## Layout (inside the phone)
```
Home                                  Trust card (sheet over dimmed home)
 Your agent                 (P)        ── grab
 Good afternoon, Priya                 [shield] Default checker · rules public
 [9 orders · ₹x  ][Bills paid      ]   Before you raise the limit to ₹15,000
 ┌ blue-ink proposal card ────────┐   ● Groceries · Earned
 │ I'd like a monthly budget of    │   ┌ amber, raised ─────────────────┐
 │ ₹15,000 for the festive season. │   │● Personal care · Check          │
 │ ₹8,200 of ₹10,000 used ▓▓▓▓░    │   │ At a tie, it picked sponsored…  │
 │ [ Review ] (yellow)             │   │ [can Q] ₹249  =  [can Y] ₹249   │
 └─────────────────────────────────┘   └─────────────────────────────────┘
 What I handle                         ● Gold · Earned
 [atta]   Groceries   last bought      Spot-check: 8 of 10 … [Simulated]
 [bottle] Personal care                [Raise] [Raise with a rule] [Not yet]
 [box]    Household                    See full details · Switch checker
 [coin]   Gold   buys at or below…
 See my agent's record
```
Left aligned throughout. Radii follow hierarchy: phone 52, sheet 28, proposal 22, tie panel 18, thumbnails 14; list rows are not cards (dividers only).

## Motion
Card slides up with a slight settle (existing 320 ms curve). Lights cross-fade. Panel numbers count. No ambient motion. All off under prefers-reduced-motion.

## Avoided on purpose
Identical rounded cards with the same grey shadow, all-caps eyebrows, decorative gradients, photo products, any Flipkart mark. Product thumbnails are simple SVG shapes with invented brand letters.
