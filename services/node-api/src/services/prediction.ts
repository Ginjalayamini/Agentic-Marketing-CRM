import type { SegmentRules } from "./segmentation.js";

export function predictCampaignPerformance(input: {
  audienceSize: number;
  channel: string;
  rules?: SegmentRules;
}) {
  const channelLift = input.channel === "WhatsApp" ? 1.18 : input.channel === "RCS" ? 1.08 : input.channel === "Email" ? 0.96 : 0.82;
  const churnLift = input.rules?.inactiveDays ? 1.12 : 1;
  const valueLift = input.rules?.minSpend ? 1.1 : 1;
  const predictedOpenRate = Math.min(78, Math.round(54 * channelLift * churnLift));
  const predictedCtr = Math.min(34, Math.round(17 * channelLift * valueLift));
  const predictedConversionRate = Math.min(18, Math.round(8.6 * channelLift * valueLift * 10) / 10);
  const averageOrderValue = input.rules?.minSpend ? 2850 : 1850;
  const predictedRevenue = Math.round(input.audienceSize * (predictedConversionRate / 100) * averageOrderValue);
  const confidence = Math.min(93, Math.round(72 + input.audienceSize / 45 + (input.rules?.minSpend ? 5 : 0)));

  return {
    predictedOpenRate,
    predictedCtr,
    predictedConversionRate,
    predictedRevenue,
    predictedAudienceReach: input.audienceSize,
    confidence
  };
}
