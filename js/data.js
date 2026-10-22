// Mock data for the Trust Checkpoint prototype. Invented brands only.
// Every number on the trust card is computed from this file by logic.js.
var DATA = {
  seed: 2040,
  historyWeeks: 13,          // what the card covers: the last 3 months
  futureWeeks: 4,            // "Fast-forward 1 month"
  defaultSponsorInfluence: 0.4,
  minTiesForVerdict: 5,      // fewer ties than this: grey "not enough evidence yet"
  thresholds: {              // prototype thresholds, shown as such in Full details
    greenTieWin: 0.7, amberTieWin: 0.4,
    greenAvoidable: 50, amberAvoidable: 200   // rupees per month
  },
  categories: [
    { name: 'Groceries', delegated: true, perWeek: 6, sponsorWeight: 0.25, usual: 'Brand G', sponsor: 'Brand P', other: 'Brand K',
      items: [
        { item: 'Atta 5 kg',        usual: [289, 0, 4.4], sponsor: [289, 0, 4.4], other: [315, 0, 4.3] },
        { item: 'Rice 5 kg',        usual: [399, 0, 4.5], sponsor: [399, 0, 4.4], other: [429, 0, 4.5] },
        { item: 'Sunflower oil 1 L',usual: [165, 0, 4.3], sponsor: [165, 0, 4.3], other: [179, 0, 4.2] },
        { item: 'Toor dal 1 kg',    usual: [145, 0, 4.4], sponsor: [170, 0, 4.4], other: [158, 0, 4.1] },
        { item: 'Tea 250 g',        usual: [140, 0, 4.6], sponsor: [140, 0, 4.5], other: [155, 0, 4.4] },
        { item: 'Biscuits pack',    usual: [30, 0, 4.2],  sponsor: [30, 0, 4.2],  other: [35, 0, 4.3] },
        { item: 'Milk powder 500 g',usual: [210, 0, 4.5], sponsor: [240, 0, 4.5], other: [225, 0, 4.2] }
      ] },
    { name: 'Personal care', delegated: true, perWeek: 2, sponsorWeight: 1.0, usual: 'Brand Y', sponsor: 'Brand Q', other: 'Brand R',
      items: [
        { item: 'Shampoo 340 ml',   usual: [349, 0, 4.4], sponsor: [349, 0, 4.4], other: [389, 0, 4.3] },
        { item: 'Toothpaste 150 g', usual: [120, 0, 4.5], sponsor: [120, 0, 4.4], other: [135, 0, 4.4] },
        { item: 'Face wash 100 ml', usual: [199, 0, 4.3], sponsor: [199, 40, 4.3], other: [215, 0, 4.1] },
        { item: 'Body wash 250 ml', usual: [275, 0, 4.4], sponsor: [330, 0, 4.4], other: [299, 0, 4.2] },
        { item: 'Deodorant 150 ml', usual: [249, 0, 4.2], sponsor: [249, 0, 4.2], other: [265, 0, 4.0] }
      ] },
    { name: 'Household', delegated: true, perWeek: 1, sponsorWeight: 0.5, usual: 'Brand H', sponsor: 'Brand Z', other: 'Brand M',
      items: [
        { item: 'Detergent 1 kg',   usual: [199, 0, 4.4], sponsor: [199, 0, 4.4], other: [219, 0, 4.3] },
        { item: 'Dishwash gel 500 ml', usual: [105, 0, 4.3], sponsor: [135, 0, 4.3], other: [119, 0, 4.1] },
        { item: 'Floor cleaner 1 L',usual: [189, 0, 4.2], sponsor: [189, 0, 4.2], other: [205, 0, 4.2] },
        { item: 'Garbage bags',     usual: [99, 0, 4.1],  sponsor: [99, 0, 4.1],  other: [110, 0, 4.0] }
      ] },
    { name: 'Electronics', delegated: false, perWeek: 0, sponsorWeight: 1.0, usual: '', sponsor: '', other: '', items: [] }
  ],
  gold: {
    buyAtOrBelow: 7200,    // rupees per gram, Priya's rule
    weeklyPrice: [7340, 7290, 7185, 7260, 7310, 7195, 7270, 7330, 7280, 7190, 7255, 7300, 7320]
  },
  moneyAgent: { monthlyLimit: 10000, proposedLimit: 15000, shoppingBudgetUsed: 8200 }
};
if (typeof module !== 'undefined') module.exports = DATA;
