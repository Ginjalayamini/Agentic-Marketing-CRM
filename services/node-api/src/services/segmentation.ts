import { Customer } from "../models.js";

export type SegmentRules = {
  minSpend?: number;
  inactiveDays?: number;
  city?: string;
  gender?: string;
  category?: string;
  minOrders?: number;
};

export function promptToRules(prompt: string): SegmentRules {
  const text = prompt.toLowerCase();
  const rules: SegmentRules = {};
  const spend = text.match(/(?:spent|spend|more than|above|over)\s*(?:₹|rs|inr)?\s*(\d+)/);
  const inactive = text.match(/(?:inactive|not purchased|have not purchased|last purchase).*?(\d+)\s*days?/);
  const cities = ["hyderabad", "bengaluru", "mumbai", "delhi", "pune", "chennai", "kolkata", "ahmedabad"];

  if (spend) rules.minSpend = Number(spend[1]);
  if (inactive) rules.inactiveDays = Number(inactive[1]);
  if (text.includes("churn") || text.includes("inactive")) rules.inactiveDays ??= 60;
  if (text.includes("women") || text.includes("female")) rules.gender = "Female";
  if (text.includes("men") || text.includes("male")) rules.gender = "Male";
  if (text.includes("shoes") || text.includes("footwear")) rules.category = "Shoes";
  for (const city of cities) {
    if (text.includes(city)) rules.city = city[0].toUpperCase() + city.slice(1);
  }
  return Object.keys(rules).length ? rules : { inactiveDays: 90, minSpend: 5000 };
}

export function rulesToMongoQuery(rules: SegmentRules) {
  const query: Record<string, unknown> = {};
  if (rules.minSpend) query.totalSpend = { $gte: rules.minSpend };
  if (rules.city) query.city = rules.city;
  if (rules.gender) query.gender = rules.gender;
  if (rules.minOrders) query.orderCount = { $gte: rules.minOrders };
  if (rules.inactiveDays) {
    const cutoff = new Date(Date.now() - rules.inactiveDays * 24 * 60 * 60 * 1000);
    query.lastPurchaseDate = { $lte: cutoff };
  }
  return query;
}

export async function previewAudience(rules: SegmentRules, limit = 25) {
  const query = rulesToMongoQuery(rules);
  const [audienceSize, customers] = await Promise.all([
    Customer.countDocuments(query),
    Customer.find(query).sort({ totalSpend: -1 }).limit(limit).lean()
  ]);
  return { audienceSize, customers };
}
