export type CustomerIntelligenceInput = {
  totalSpend: number;
  orderCount: number;
  lastPurchaseDate: Date;
};

export function calculateCustomerIntelligence(customer: CustomerIntelligenceInput) {
  const daysSinceLastPurchase = Math.max(
    0,
    Math.floor((Date.now() - customer.lastPurchaseDate.getTime()) / (24 * 60 * 60 * 1000))
  );
  const recencyScore = clamp(100 - daysSinceLastPurchase, 0, 100);
  const frequencyScore = clamp(customer.orderCount * 10, 0, 100);
  const monetaryScore = clamp(customer.totalSpend / 250, 0, 100);
  const healthScore = Math.round(recencyScore * 0.4 + frequencyScore * 0.25 + monetaryScore * 0.35);
  const churnScore = clamp(Math.round(daysSinceLastPurchase * 0.65 - customer.orderCount * 3 - customer.totalSpend / 1200 + 35), 0, 100);
  const churnRisk = churnScore >= 70 ? "High Risk" : churnScore >= 40 ? "Medium Risk" : "Low Risk";

  let lifecycleSegment = "New Customer";
  if (customer.totalSpend >= 25000 && churnScore < 55) lifecycleSegment = "High Value";
  else if (healthScore >= 75) lifecycleSegment = "Loyal";
  else if (churnScore >= 75) lifecycleSegment = "Churned";
  else if (churnScore >= 50) lifecycleSegment = "At Risk";

  return { recencyScore, frequencyScore, monetaryScore, healthScore, churnScore, churnRisk, lifecycleSegment };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
