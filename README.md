# Trust Checkpoint

**See your AI agent's record before it gets more power.**

Live: https://trust-checkpoint.vercel.app

This is a concept for the Flipkart APM '29 case. The prompt: in 2040 everyone has a personal AI agent that runs their day-to-day tasks. Outline the ramifications, then create a product that helps people protect themselves from it.

## The problem
In 2040, your AI agent shops for you. It can quietly pick what sponsors pay for, and you'd never notice. Each pick looks fine on its own. Spending limits control how much an agent spends, not how well it chooses.

## The product
Trust Checkpoint is an independent checker that works with any agent. It steps in at the moment people already pause: right before an agent gets more power, such as a higher limit or a new area. It shows the agent's real track record, lets you fix what it found with one rule, and then measures whether things improved.

## Try it in a minute
Open the link and press **Try it myself**. You play Priya. The app itself tells you what to do next: there are no Back or Next buttons.
1. **The ask.** Her agent made 117 shopping choices this quarter and asks to raise its limit to ₹15,000. Tap Allow, as anyone would.
2. **Paused.** Trust Checkpoint stops the request before it goes through. It runs in her bank, where the agent's limit lives, so the agent cannot skip it. A lens sweeps over her weekly picks: outside it everything looks fine; under it, each pick shows what decided it (her usual at the best price, a sponsor winning a tie, or paying more than an equal option). Move the lens yourself, or tap a pick on a phone.
3. **The record.** Groceries (47 of 55 ties) and household (8 of 11) earned trust. In personal care, sponsors won 6 of 15 ties, so it says Check. "How verdicts are set" gives every rule on the card.
4. **Why.** Two options with the same price and the same rating, and the sponsored one won.
5. **The rule.** One switch: "On ties, pick my usual brand". The preview shows what it would have changed. The rule becomes a condition of the new limit: if the agent breaks it, her bank drops the limit back to ₹10,000.
6. **A month later.** 4 of 4 ties went her way. Replaying the same month without the rule gives 2 of 4 (a simulation-only comparison; a real pilot uses a control group). Same bill, her brand.

Prefer to watch? **Watch it in 40 seconds** plays the same taps on its own.

## How it is built
- Plain HTML, CSS and JavaScript. There's no framework, it makes no outside network calls, and it works offline.
- `js/data.js` and `js/logic.js` run a seeded simulation of 13 weeks of agent choices. Every number on screen and in the case PDF is computed by them, never typed in. The lens labels come from the same logic: each tile is a real purchase, classified by `Model.classify`.
- `js/app.js` drives the story from what the visitor does in the app. A coach mark inside the phone points at the one thing to do next, and every tap outside the story says so instead of doing nothing. On a phone the app fills the screen, with no phone frame.
- `js/lens.js` draws the magnifier: the revealed layer is clipped to a circle and magnified about 1.1x, and it snaps to one whole pick at a time so text is never cut. It respects reduced motion and works with mouse, touch (press and hold) and keyboard.
- `js/lock.js` writes each decision record with a SHA-256 fingerprint chained to the one before it, so any later edit is detected. You can try this in "How I built this".
- `tools/check.js` runs 86 automated browser checks (Playwright): the first screen, every number, every step, the coach marks, dead taps, the lens (pointer, keyboard, tap and hold, reduced motion), the full-screen phone layout, the side paths and the autoplay story. A deliberately broken copy fails 15 of them.
- It was built with AI-assisted tools (Claude, and Claude Code in Cursor), versioned on GitHub and deployed on Vercel.

## Run it
Open `index.html` in a browser. To run the checks:

```
npm install --prefix tools playwright
node tools/check.js
```

## Honest labels
- **Real:** the agent simulation, tie test, what the lens shows, verdicts, and fingerprinted records.
- **Simulated:** the bank, the second checker, the face confirmation, and the spot-check against saved public listings.
- **Invented:** all brands, people and numbers are mock data.

Concept prototype. An independent product, not affiliated with or endorsed by Flipkart.
