import { Campaign, Communication, CommunicationEvent, Customer, Order } from "../models.js";

export async function dashboardMetrics() {
  const [customers, orders, campaigns, revenueAgg, events, communicationCount] = await Promise.all([
    Customer.countDocuments(),
    Order.countDocuments(),
    Campaign.countDocuments({ status: { $in: ["RUNNING", "LIVE"] } }),
    Order.aggregate([{ $group: { _id: null, revenue: { $sum: "$amount" } } }]),
    CommunicationEvent.aggregate([{ $group: { _id: "$eventType", count: { $sum: 1 } } }]),
    Communication.countDocuments()
  ]);

  const counts = Object.fromEntries(events.map((event) => [String(event._id).toLowerCase(), event.count]));
  const sent = Math.max(counts.sent ?? communicationCount, 1);
  return {
    totalCustomers: customers,
    totalOrders: orders,
    revenue: revenueAgg[0]?.revenue ?? 0,
    activeCampaigns: campaigns,
    engagementRate: Math.round(((counts.opened ?? counts.read ?? 0) / sent) * 1000) / 10,
    conversionRate: Math.round(((counts.converted ?? 0) / sent) * 1000) / 10,
    statuses: counts
  };
}
