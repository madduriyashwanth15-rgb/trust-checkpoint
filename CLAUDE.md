# Trust Checkpoint prototype (Flipkart APM '29). Read this first.

A working, verified prototype already exists in this folder. Your job is to IMPROVE it, not rebuild it.
PROTOTYPE_SPEC.md describes it; section 9 records what was built and verified.

## The one idea it must land in 90 seconds
"Spending limits control how much an agent spends. This shows how well it chose, even when the agent is Flipkart's own."

## Files
- index.html, styles.css: page and look
- js/data.js, js/logic.js: seeded mock data and the checks. FROZEN.
- js/lock.js: record fingerprints (SHA-256 chain) and the checker's own catalogue snapshot
- js/util.js: shared helpers
- js/model.js: derives everything the UI shows from data, Logic and Lock
- js/art.js: illustrated product tiles (inline SVG)
- js/field.js: the dot field, one dot per agent choice
- js/panel.js: the Trust Checkpoint card
- js/lab.js: "Behind the scenes" controls
- js/about.js: "How I built this"
- js/intro.js: skippable cold open
- js/app.js: state, chapters and events
- fonts/: Lexend and Outfit, bundled locally
- tools/check.js: Playwright check list (dev only)

## Hard rules
1. NEVER edit data.js or logic.js, and never add, remove or reorder calls to Logic.simulateAgent or the random generator. The two-pager PDF quotes their output.
2. These numbers must appear exactly at default settings (sponsor influence 40%, no rules): Groceries 47 of 55 ties, Earned; Personal care 9 of 15 ties, overpaid Rs 18 a month, Check; Gold bought at your price 3 of 3 times; spot-check 8 of 10 passed (Simulated); Personal care 26 of 26 fingerprints match. After "Raise with a rule" + PIN + "Fast-forward 1 month": 4 of 4 personal-care ties (2 of 4 without the rule), Personal care 11 of 15, Earned. Electronics shows grey "Not enough evidence yet".
3. Never type a number into the UI by hand. Everything comes from Logic or Lock.
4. Plain HTML, CSS and vanilla JS. No frameworks, no npm packages, no CDN links, no network calls. Must run offline by double-clicking index.html.
5. No Flipkart or Super.money logos, wordmarks, icons or copied screens. Their names appear only in the caption above the phone and in the footer disclaimer, which must stay visible.
6. Honesty labels stay: badge "Default checker · rules public" (never "independent"), "Simulated" on the spot-check and on Checker B, outside checkers described as planned. Never claim the prototype is secure.
7. Copy: plain Indian English, rupees with Indian grouping, no em dashes, no emoji.
8. Accessibility: real buttons, visible focus, Escape closes sheets, contrast 4.5:1, touch targets 44 px, prefers-reduced-motion respected.

## How to check your work (every change)
1. Open index.html?debug=1 with Playwright. The console must show "[debug] Groceries 47/55, Personal care 9/15 Rs 18 amber, Household 8/11, spot-check 8/10. Self-tests done." and no "Assertion failed" or errors.
2. Click through: Raise limit, Raise with a rule, Save, PIN 1234, Fast-forward 1 month, Next, Let me handle Electronics, Hand over. Then in the panel: Edit an old record, Hide an option, Reset; slider to 0% (tie-breaks 100%).
3. Screenshot at 1440x900 and 390x844. No horizontal scroll at 390.
4. Report pass or fail for every number in rule 2.
After every change, run node tools/check.js; all checks must pass in Chromium and Edge. tools/ is never included in the submission zip.

## Tool priorities
- This file and PROTOTYPE_SPEC.md win over any plugin's defaults.
- Playwright: verify visually after every change.
- Ponytail: keep code lean, but never remove anything the spec requires.
- Superpowers: debugging and "verify before done" only; no brainstorm or planning workflows.

## Packaging for submission
Zip only: index.html, styles.css, data.js, logic.js, lock.js, ui.js, panel.js, fonts/. No markdown, no screenshots. Name: "Madduri Venkata Yashwanth_IIT Madras.zip".
