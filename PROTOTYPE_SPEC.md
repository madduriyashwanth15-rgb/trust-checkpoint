# PROTOTYPE_SPEC: Trust Checkpoint

## 1. Page layout (desktop, 1280px+)
- Header: title "Trust Checkpoint · a 2040 concept for Flipkart's agent products", one-line instruction "Follow Priya's day. Tap the highlighted buttons."
- Centre: app switcher (Money app 2040 | Shopping app 2040), caption above the phone ("Our vision: Super.money in 2040" / "Our vision: Flipkart in 2040"), then a phone frame 390 x 844.
- Right: side panel "What Priya can't see" (section 5) with live metrics at the bottom.
- Footer: disclaimer (see CLAUDE.md rule 4).
- Under 900px wide: side panel moves below the phone. Under 420px: phone scales to fit width.

## 2. Visual direction
- Shopping app: Direction A "Daylight" (bright blue header #2874F0, yellow action #FFE11B, white surfaces). [Confirm or switch to B/C from the previews file.]
- Money app: deep teal #0B3B3A with gold accents #E8B64C, white cards.
- Trust layer: identical in both apps so it reads as one layer: white sheet, teal shield badge (#CCFBF1 bg, #115E59 text) reading "Default checker · rules public" (NOT "independent check": the two-pager says Flipkart's day-one checker is verifiable, not independent), slides up over a dimmed app (rgba(15,23,42,0.45)).
- Motion: sheet slides up with a slight overshoot (300ms), numbers count up on change (400ms), traffic lights cross-fade. Respect prefers-reduced-motion.

## 3. Mock data (data.js)
**Provided: build_kit/proto/data.js (items per category with usual, sponsored and other options; prices, delivery fees, ratings; gold price series). Use it as-is. The bullets below are the original brief it implements.**
- Persona: Priya, ~30, works full-time, runs household shopping.
- Categories delegated: Groceries, Personal care, Household. Not yet delegated: Electronics.
- Products: about 40, each { id, name, brand, category, price, rating, sponsored (bool), seller, deliveryFee, returnDays }.
  - Per category, include several TIE pairs: a sponsored product and Priya's usual brand with the same total cost (price + deliveryFee) and rating within 0.1.
  - Include some non-tie cases where a sponsored option costs ₹20 to ₹90 more than the best equal option.
- Priya's preferences: usual brand per category (e.g. Personal care: "Brand Y").
- Money agent: gold buy rule (buy when price ≤ ₹7,200/g), monthly limit ₹10,000, bills paid, shopping budget used ₹8,200.
- Use invented brand names only (Brand X, Brand Y, or made-up names). No real brands.

## 4. Logic (logic.js)
**Use build_kit/proto/data.js and build_kit/proto/logic.js as provided (seed 2040). Do not rewrite or re-tune them: the two-pager quotes their output. The notes below describe what they do. Run `node compute.js` in that folder to print every number.**

Use a seeded random generator (fixed seed) so every reload shows the same story.

simulateAgent({ weeks, sponsorInfluence (0 to 0.6), rules }) returns a list of purchases:
- Each week, for each delegated category, the agent faces one choice set.
- If the set is a TIE: with rule "On ties, pick my usual brand" ON, pick the usual brand. Otherwise pick the sponsored option with probability sponsorInfluence, else the usual brand.
- If NOT a tie: pick the best total-cost option, except with probability sponsorInfluence / 3 pick the sponsored, more expensive option.
- Rule "Ask me above ₹X": purchases above X are marked "asked user" and never auto-bought.

checkRecord(purchases) returns, per category and overall:
- tiesTotal, tiesWonByUser (chose usual brand), tieWinRate
- avoidableSpend = sum(chosen total cost minus best equal-or-better option total cost), per month
- light: green if tieWinRate >= 0.7 and avoidableSpend < ₹50/month; amber if tieWinRate 0.4 to 0.7 or avoidableSpend ₹50 to ₹200; red otherwise. (Prototype thresholds; show "prototype thresholds" in full details.)
- example: the single clearest tie the agent gave to a sponsor (for the card).

spotCheck(purchases) (the second opinion; SIMULATED because it reuses the same mock catalogue instead of an independent snapshot): sample 10 purchases with a fixed seed. A pick PASSES if (a) its total cost is within ₹10 of the cheapest option on offer, and (b) when the choice was a tie, it is the user's usual brand. UI label: "Spot-check: 8 of 10 sampled picks passed" plus a "Simulated" tag. Full details explains the two pass conditions in one line.

Without-layer view: just "N items this month · all within your limit ✓".

Add a tiny self-test (console.assert) that runs on load in a debug mode (?debug=1): ties exist per category, sponsorInfluence 0 gives 100% tie win, rule ON gives 100% tie win.

## 5. Side panel: "What Priya can't see"
- Toggle: Priya's view: Without layer | With layer
- Slider: Sponsor influence on the agent, 0% to 60%, default 40%
- Fast-forward: 1 week | 1 month | 3 months
- Rules: switch "On ties, pick my usual brand"; switch "Ask me above ₹10,000"
- Live metrics (count-up animation): Tie-breaks won by Priya (%), Money lost to tilts (₹ per month), Areas handed to agent
- Every control re-runs simulateAgent + checkRecord and re-renders the card and metrics.

## 6. Screens and flow
Scene A, Money app 2040:
1. Home: "Good morning, Priya", gold price ticking every few seconds, "Bought gold 3 times at your price", bills paid, budget ₹8,200 of ₹10,000, highlighted button "Raise limit to ₹15,000".
2. Trust layer slides up: badge, "Before your agent gets more, here's its record", rows: Gold buys (green), Groceries via shopping agent (green), Personal care via shopping agent (light from checkRecord, amber at default), one example line from checkRecord, second opinion line (Simulated), buttons Raise | Raise with a rule | Not yet, footer "See full details · Checked by default checker · Switch checker".
3. Full details: per-category numbers, list of flagged purchases with the alternative and price, prototype thresholds note, "Checked by default checker", "Switch checker" (opens a simple sheet: "Independent checkers can read the same records with your consent. Simulated in this prototype.").
4. Set a rule: "On ties, pick my usual brand" and "Ask me above ₹10,000"; Save.
5. PIN pad: 4 dots, any 4 digits accepted, then "Limit raised to ₹15,000 with 1 rule".
6. One month later (button "Fast-forward 1 month"): "This month 4 of 4 personal-care ties went your way (2 of 4 without the rule)" (computed: weeks 13 to 16 with and without the rule). The card re-checks the last 3 months (weeks 4 to 16): Personal care 11 of 15 ties, turns green. Do NOT claim money saved: ties cost the same by definition, so the rule changes whose brand wins, not the bill.

Scene B, Shopping app 2040:
7. Home: agent greeting, "Handled this week: 14 orders · ₹3,860", areas chips, highlighted "+ Let me handle Electronics".
8. The same trust layer component slides up with the same record.

"Not yet" closes the sheet and leaves the limit unchanged. "Raise" without a rule raises the limit and shows a small note "No rules set".

## 7. Acceptance criteria
- Someone new understands the idea in under 90 seconds without reading instructions.
- Every highlighted button works; no dead ends; Back works on every sheet.
- Moving the slider or toggling a rule visibly changes the traffic lights, example and metrics.
- With layer OFF, the phone shows only "all within your limit ✓".
- Works offline by double-clicking index.html in Chrome, Edge and Safari; no console errors.
- Looks right at 1440px and 390px widths.
- No logos, no real brand names, disclaimer visible.

## 8a. Alignment with two-pager v2 (added 20 Oct, 23:30). These override earlier sections where they conflict.
1. Card title: "Before you raise the limit to ₹15,000". Rows: Groceries, Personal care, Gold. Light labels in words, not colour alone: Earned (green), Check (amber), Hold back (red), Not enough evidence yet (grey).
2. Numbers at default settings, as produced by proto/logic.js (20 Oct, 23:20) and quoted in the two-pager: Groceries 47 of 55 ties (green); Personal care 9 of 15 ties, ₹18 a month overpaid on non-ties (amber); Household 8 of 11 ties (green, not on the Scene A card); Electronics 0 decisions (grey); Gold bought at your price 3 of 3 times; spot-check 8 of 10 passed (Simulated); after the tie rule and Fast-forward 1 month: 4 of 4 personal-care ties (2 of 4 without the rule). If any screen shows a different number, the code is wrong or the data changed: stop and fix, never hard-code.
3. Example line (from checkRecord().example): "At a tie, it picked sponsored Brand Q deodorant over your usual Brand Y."
3a. Record integrity, honestly labelled: full details says "Each record is fingerprinted when written. Changing it later breaks the fingerprint. This prototype fingerprints mock records to show the mechanism; it is not a security product." (Updated 21 Oct after section 8b was built and passed.)
4. Grey state (Scene B): "+ Let me handle Electronics" opens the same card with an Electronics row in grey: "Not enough evidence yet: 0 decisions in this category". Buttons: "Hand over with an Ask me above ₹X rule" (primary) and "Not yet".
5. Full details sheet adds: (a) "What this check used": every option the agent saw (price, rating, sponsored flag) for the flagged tie; (b) "Not shared: messages, address, payment details"; (c) "Export my records" button that downloads a small JSON of the decision records produced by logic.js (offline, no network); (d) "Checked 2 days ago · this card returns on its own in 88 days" (D20: checks run on every purchase; the card shows at limit raises, new categories, on request, and once every 90 days).
6. Switch checker sheet: "A second checker can re-run these checks on your exported records. Simulated in this prototype." Show one simulated second verdict for Personal care that agrees (amber), with the note "If checkers disagree, both verdicts show and the stricter one sets the light."
6a. On-demand view (matches the two-pager "or ask"): a small "See my agent's record" link on both home screens opens the same card without any limit change; its buttons are "Add a rule" and "Close".
7. Never imply that outside checkers, a standards body or payment-network integrations exist today. Anything outside Flipkart's own checker is labelled "Simulated" or "Planned".

## 8b. Record locking and spot-check demo (D17, added 20 Oct, 23:45). Keep it small.
Goal: show, not tell, that (1) a record cannot be changed later without it showing, and (2) the agent cannot hide a better option when it first writes the record.
1. New file lock.js. When logic.js produces purchases, give each record a fingerprint: SHA-256 of the record's JSON (options, chosen, rule, week) plus the previous record's fingerprint (a simple chain). Use crypto.subtle.digest when available; otherwise a small bundled pure-JS SHA-256 (it must work from file:// in Chrome, Edge and Safari, offline). Do not edit data.js or logic.js; do not change any RNG call, so every number in the two-pager stays the same.
2. Full details shows, per category, "Records locked: 26 of 26 fingerprints match" (computed), with a one-line explainer: "Each record is fingerprinted when written. Changing it later breaks the fingerprint."
3. Side panel, new group "Try to cheat (demo)", two buttons, both reversible with "Reset":
   a. "Edit an old record": changes the price of Brand Y in the flagged deodorant tie to ₹289 after the fact. The card's Personal care row shows a red "Record changed after it was written" warning and the fingerprint count drops (e.g. 25 of 26 match). The tie verdict is not silently recomputed from the edited record.
   b. "Hide an option when writing": the agent writes a new record that leaves out Brand Y. The spot-check compares it with the checker's own catalogue snapshot (a separate copy of the catalogue held in lock.js, not read from the agent's record) and flags: "Record left out a cheaper or equal option (Brand Y, ₹249)."
4. Labels: "Demo: mock data. In the real product the checker's catalogue snapshot is collected independently." No claim that the prototype is secure; it demonstrates the mechanism.
5. Acceptance: with no cheating, all fingerprints match and every number equals proto/compute.js output; each cheat button produces its warning; Reset restores the original numbers exactly.

## 8. Out of scope
Severe-drift alerts, need check, adaptive rhythm, preference drift view, real AI, backend, login.

## 9. Build record (21 Oct 2026, 14:30). Built in the workspace and verified with Playwright (Chromium).
- Files: index.html, styles.css, data.js and logic.js (byte-identical to proto/), lock.js, ui.js, panel.js, fonts/ (Lexend, Outfit). Zip: "Madduri Venkata Yashwanth_IIT Madras.zip". Opens offline from file://; zero network requests.
- Verified at default settings: Groceries 47/55 Earned; Personal care 9/15, Rs 18 a month, Check; Gold 3 of 3; spot-check 8/10 Simulated; example "At a tie, it picked sponsored Brand Q deodorant over your usual Brand Y."; Personal care 26 of 26 fingerprints match; raise with rule + Fast-forward 1 month: 4 of 4 (2 of 4 without), Personal care 11 of 15 Earned; Electronics grey; both cheats flagged; Reset restores; slider 0% and the tie rule both give 100% tie-breaks; Without checkpoint shows only "all within your limit"; no horizontal scroll at 390 px; keyboard and Escape work; ?debug=1 self-tests pass.
- Deliberate differences from earlier sections: (1) SHA-256 is always the bundled pure-JS version (identical output to standard SHA-256, checked against Node crypto), so file:// behaves the same everywhere. (2) The side panel has no "Ask me above Rs 10,000" switch: no mock purchase exceeds it, so it could never visibly change anything; it stays in the Scene A rule sheet. (3) The panel's tie-rule switch applies "as if set 3 months ago"; the Scene A rule applies from the day it is set. (4) Shop home shows this week's orders computed from the logic (9 orders), not the earlier fixed "14 orders, Rs 3,860". (5) The phone scales to fit the window height on desktop so the whole flow fits a 1440 x 900 screen recording.
- Not tested here: Safari and Edge (only Chromium is available in the build environment). Test once on the submitting laptop.
