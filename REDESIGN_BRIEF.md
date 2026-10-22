# REDESIGN_BRIEF: Trust Checkpoint, "Flipkart in 2040"

This brief overrides PROTOTYPE_SPEC.md sections 1, 2, 5 and 6 (layout, look, panel, screens). Everything in CLAUDE.md still applies: data.js and logic.js stay frozen, every number comes from Logic or Lock, honesty labels stay, no logos, offline, plain HTML/CSS/JS.

## The goal in one sentence
A recruiter opens it and within 10 seconds feels they are holding Flipkart's app in 2040, and within 60 seconds has seen the core of the product: before Priya gives her agent more power, the agent's real record appears, she spots that it quietly favours sponsored brands at ties, adds one rule, and a month later sees it worked.

## What "2040" means here
- The agent runs the app. Home is not a search box and a product grid; it is what the agent did for Priya and what it wants to do next.
- Calm, confident, spacious. Fewer things on screen, larger type, real depth (soft layered surfaces, not flat grey boxes), smooth purposeful motion.
- Products have visual presence: simple illustrated thumbnails drawn in SVG/CSS (a shampoo bottle, a deodorant can, an atta pack), never photos of real brands.
- Confirmation is effortless: "Confirm with face" (a short animated scan) instead of a PIN pad.

## What "feels like Flipkart" means here (and what it must not do)
- Use the brand-inspired palette: Flipkart blue #2874F0 and yellow #FFE11B as the identity colours, on clean white/very light surfaces, with a deep ink for text.
- NO Flipkart logo, wordmark, app icon, or copy of any current Flipkart screen. Inside the phone the app has no brand name: the header says "Your agent" (or Priya's name). The caption above the phone says "Our vision: Flipkart in 2040", and the footer disclaimer stays visible.
- Super.money is not a separate app any more. Gold buying appears inside the same app as one of the areas the agent handles ("Gold", via the money agent).

## One app, five beats (the whole story)
1. **Home.** Greeting, a short "done for you" strip (orders handled this week, computed), the areas the agent handles. A proposal card from the agent: "I'd like a monthly budget of ₹15,000 for the festive season. Review?" with button "Review".
2. **The checkpoint.** The trust card slides up (the hero moment). Title "Before you raise the limit to ₹15,000". Rows: Groceries, Personal care, Gold, each with a light and words (Earned / Check / Hold back / Not enough evidence yet). The amber Personal care row is the visual focus, connected to the example line "At a tie, it picked sponsored Brand Q deodorant over your usual Brand Y." Spot-check line with "Simulated" tag. Badge "Default checker · rules public". Buttons: Raise / Raise with a rule / Not yet. Links: See full details, Switch checker.
3. **One rule.** "On ties, pick my usual brand" pre-selected, "Ask me above ₹10,000" optional. Confirm with face.
4. **A month later.** One screen: "4 of 4 personal-care ties went your way (2 of 4 without the rule)", Personal care now Earned (11 of 15). One line: the rule changed whose brand won, not the bill.
5. **New area.** "Let me handle Electronics" shows the same card with Electronics grey: "Not enough evidence yet", handed over with an "Ask me above ₹5,000" rule.

Keep: Full details sheet (what the check used, flagged picks, records locked with fingerprint counts, privacy line, thresholds, Export my records), Switch checker sheet, "See my agent's record" link on home.

## The page around the phone
- One large phone, centred, at 100% scale or close to it, fully visible at 1440x900 without scrolling (use a phone frame around 390 x 800 if needed).
- Above it: a slim header, "Trust Checkpoint" and "A 2040 concept" on one line, plus "Restart" and "Behind the scenes".
- Below it: one caption line that tells the story in plain words at each beat (replaces the left step list and the pulsing rings). A small "Next" hint may highlight the one button to press, subtly.
- "Behind the scenes" opens a drawer from the right (closed by default) holding everything currently in the side panel: Without/With checkpoint, sponsor slider, fast-forward, tie rule, the three metrics, and the Try to cheat demo with Reset. Same behaviour, restyled to match.
- Footer disclaimer always visible, small.
- At 390 px wide: the phone fills the screen first; the caption sits under it; no horizontal scroll.

## Quality bar
- Premium and quiet: one hero moment (the card), everything else restrained. No gradients for decoration, no clutter, no tiny text. Body text inside the phone at least 14 px.
- Motion: the card slides up with a slight settle; lights cross-fade; numbers count when the slider moves. Respect prefers-reduced-motion.
- Accessibility per CLAUDE.md: real buttons, visible focus, Escape closes sheets, contrast 4.5:1, touch targets 44 px.

## Process (do not skip)
**Phase 1, design first, approval before building.** Using the frontend-design skill, write a short design plan (palette tokens, type scale, layout sketch, motion) and build ONLY beats 1 and 2 (home and the trust card) in the new style. Take screenshots at 1440x900 (home, card open) and 390x844 (card open). Commit as "Redesign phase 1". Stop and wait for approval.

**Phase 2, the rest.** After approval: beats 3 to 5, Full details, Switch checker, the Behind the scenes drawer, captions, and Restart. Update tools/check.js navigation steps to the new flow, but keep every expected number and label exactly the same (all 32 checks, same meaning). Run node tools/check.js in Chromium and Edge; all must pass. Screenshots of every beat. Commit as "Redesign phase 2".

**Phase 3, recording mode.** "Play the story" button that auto-plays the five beats with captions, then opens Behind the scenes for the cheat demo and slider. Stop button. Commit.
