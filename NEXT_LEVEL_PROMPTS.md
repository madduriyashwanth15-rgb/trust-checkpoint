# Next-level prompts for Claude Code in Cursor (paste one at a time)

Do them in this order. After each, Claude Code runs the checks in CLAUDE.md and shows you screenshots. Stop after any step if time is short: the prototype is already submittable.

## 0. Orient (5 min)
> Read CLAUDE.md and PROTOTYPE_SPEC.md. Open index.html?debug=1 with Playwright, run the full check list in CLAUDE.md, take screenshots at 1440x900 and 390x844, and report pass or fail for every number. Change nothing yet.

## 1. Recording mode (highest value: makes the video easy)
> Add a "Play the story" button next to "Restart story". It auto-plays Priya's day at a calm pace (about 4 seconds per step, longer on the card): opens the card, highlights the Personal care row, opens Full details briefly, goes Back, Raise with a rule, Save, types the PIN, Fast-forward 1 month, opens the shopping app, Let me handle Electronics, Hand over, then in the panel: Edit an old record, Hide an option, Reset, slider from 40% to 60% and back. Show a one-line caption bar under the phone explaining each step in plain words. A "Stop" button ends it at any time. Use the existing click handlers; do not duplicate logic. Respect prefers-reduced-motion. Then run every check in CLAUDE.md.

## 2. Make the moment of truth land
> On the trust card, make the Personal care row the visual focus when it is amber: a soft amber background on that row and the example line connected to it. When the slider moves, cross-fade the traffic lights and count the tie numbers up or down (400 ms). Do not change any number or label. Run every check in CLAUDE.md and show before and after screenshots.

## 3. Polish pass
> Using the frontend-design skill if installed, do one polish pass on typography, spacing and alignment inside the phone and the side panel. Keep the colour tokens in styles.css. No new features. Run every check in CLAUDE.md and show before and after screenshots at 1440x900 and 390x844.

## 4. Final package
> Run the full check list once more, then create "Madduri Venkata Yashwanth_IIT Madras.zip" with only the files listed in CLAUDE.md. Unzip it into a new folder, open index.html from there with Playwright, and confirm the card shows 47 of 55 and 9 of 15.

## If Claude Code drifts
"Re-read CLAUDE.md. List every change you made that touches data.js, logic.js, a number, or an honesty label, and undo it."
