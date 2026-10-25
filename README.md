# Trust Checkpoint

**See your AI agent's record before it gets more power.**

Live: https://trust-checkpoint.vercel.app

This is a concept for the Flipkart APM '29 case. The prompt: in 2040 everyone has a personal AI agent that runs their day-to-day tasks. Outline the ramifications, then create a product that helps people protect themselves from it.

## The problem
In 2040, your AI agent shops for you. It can quietly pick what sponsors pay for, and you'd never notice. Each pick looks fine on its own. Spending limits control how much an agent spends, not how well it chooses.

## The product
Trust Checkpoint is an independent checker that works with any agent. It steps in at the moment people already pause: right before an agent gets more power, such as a higher limit or a new area. It shows the agent's real track record, lets you fix what it found with one rule, and then measures whether things improved.

## The 40-second story, in six steps
1. **The ask.** Priya's agent made 120 choices for her and asks to raise its limit to ₹15,000. Tap Allow and the checkpoint opens straight away.
2. **Look closer.** Her picks for the week all look fine. Drag the lens over them (on a phone, press and hold), or press Look closer to see all four. Under the glass, each pick shows what decided it: her usual at the best price, a sponsor winning a tie, or a pick that cost more than an equal option. The header adds it up: ₹28 a month overpaid.
3. **The checkpoint.** Before anything changes, the record shows two things. Groceries earned trust. In personal care, sponsors won 6 of 15 ties.
4. **Why.** Two options with the same price and the same rating, and the sponsored one won.
5. **The rule.** One switch: "On ties, pick my usual brand". The preview shows what it would have changed.
6. **A month later.** 4 of 4 ties went her way, against 2 without the rule. Same bill, her brand.

## How it is built
- Plain HTML, CSS and JavaScript. There's no framework, it makes no outside network calls, and it works offline.
- `js/data.js` and `js/logic.js` run a seeded simulation of 13 weeks of agent choices. Every number on screen and in the case PDF is computed by them, never typed in. The lens labels come from the same logic: each tile is a real purchase, classified by `Model.classify`.
- `js/lens.js` draws the magnifier: the revealed layer is clipped to a circle and magnified about 1.1x, and it snaps to one whole pick at a time so text is never cut. It respects reduced motion and works with mouse, touch (press and hold) and keyboard.
- `js/lock.js` writes each decision record with a SHA-256 fingerprint chained to the one before it, so any later edit is detected. You can try this in "How I built this".
- `tools/check.js` runs automated browser checks (Playwright) on the first screen, every number, every step, the lens (pointer, keyboard, press and hold, reduced motion), the side paths and the autoplay story. A deliberately broken copy fails them.
- It was built with AI-assisted tools (Claude, and Claude Code in Cursor), versioned on GitHub and deployed on Vercel.

## Run it
Open `index.html` in a browser. To run the checks:

```
npm install --prefix tools playwright
node tools/check.js
```

## Honest labels
- **Real:** the agent simulation, tie test, what the lens shows, verdicts, spot-check, and fingerprinted records.
- **Simulated:** the second checker and the face confirmation.
- **Invented:** all brands, people and numbers are mock data.

Concept prototype. An independent product, not affiliated with or endorsed by Flipkart.
