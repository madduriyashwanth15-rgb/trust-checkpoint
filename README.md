# Trust Checkpoint

**Before your agent gets more power, see its record.**

A concept for the Flipkart APM '29 case. Prompt: in 2040 everyone has a personal AI agent that runs their day-to-day tasks. Outline the ramifications, and create a product that helps people protect themselves from it.

Live: <add your Vercel link here>

## The idea
Agents will make most everyday choices for us. Their worst habits are invisible: a sponsor wins a tie at the same price and rating, or a small overpay repeats. Spending limits control how much an agent spends, not how well it chooses.

Trust Checkpoint appears at the moment people already pause, right before an agent gets more power (a higher limit or a new area). It shows the agent's real track record, lets the user add a rule, and then measures whether things improved.

## The 1-minute story
1. **The ask.** Priya's agent made 120 choices for her and asks to raise its limit.
2. **The checkpoint.** Her 120 choices are shown as dots, coloured by what decided each one. In personal care, a sponsor won 6 of 15 ties.
3. **Her decision.** She raises the limit with one rule: on ties, pick my usual brand.
4. **The payoff.** A month later, 4 of 4 ties went her way, against 2 without the rule. The bill is the same.
5. **How well, not how much.** A limit sees totals. The checkpoint sees choices.

## How it is built
- Plain HTML, CSS and JavaScript. No framework, no network calls, and it works offline.
- `js/data.js` and `js/logic.js` hold a seeded simulation of 13 weeks of agent choices. Every number on screen and in the case PDF is computed by them, never typed in.
- `js/lock.js` writes each decision record with a SHA-256 fingerprint chained to the previous one, so a later edit is detected. You can try this under "Behind the scenes".
- `tools/check.js` holds 46 automated browser checks (Playwright) covering every number and chapter. A deliberately broken copy fails them.
- Built with AI-assisted tools (Claude and Claude Code in Cursor). Versioned on GitHub, deployed on Vercel.

## Run it
Open `index.html` in a browser.

To run the checks:

```
npm install --prefix tools
node tools/check.js
```

## Honest labels
- **Real:** the agent simulation, the tie test, verdicts, the spot-check, fingerprinted records and export.
- **Simulated:** the second checker, face confirmation and outside catalogue data.
- **Mock data:** all brands, people and numbers are invented.

Concept prototype. Not affiliated with or endorsed by Flipkart or Super.money.
