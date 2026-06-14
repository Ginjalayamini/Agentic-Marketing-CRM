import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { config } from "../config.js";
import {
  AudienceTool,
  CampaignPredictionTool,
  ChannelRecommendationTool,
  ChurnTool,
  InsightTool,
  MessageGenerationTool,
  RFMTool,
  SegmentTool
} from "./agent-tools.js";
import type { SegmentRules } from "./segmentation.js";

type AgentProgress = {
  node: string;
  label: string;
  status: "completed" | "waiting" | "pending";
};

type AgentAudience = { audienceSize: number; customers: unknown[] };
type AgentSegment = { name: string; rules: SegmentRules; audienceSize: number };
type AgentChannel = { name: string; reasoning: string };
type AgentPrediction = {
  predictedOpenRate: number;
  predictedCtr: number;
  predictedConversionRate: number;
  predictedRevenue: number;
  predictedAudienceReach: number;
  confidence: number;
};
type CampaignDraft = {
  name: string;
  subject?: string;
  message: string;
  cta?: string;
  channel: string;
  offer: string;
  audienceSize: number;
};

const AgentState = Annotation.Root({
  goal: Annotation<string>,
  objective: Annotation<string | undefined>,
  rules: Annotation<SegmentRules | undefined>,
  audience: Annotation<AgentAudience | undefined>,
  rfm: Annotation<{ averageHealth: number; averageRfm: number; sampleSize: number } | undefined>,
  churn: Annotation<{ highRisk: number; potentialRevenueLoss: number; retentionOpportunity: number } | undefined>,
  segment: Annotation<AgentSegment | undefined>,
  channel: Annotation<AgentChannel | undefined>,
  campaignDraft: Annotation<CampaignDraft | undefined>,
  prediction: Annotation<AgentPrediction | undefined>,
  recommendations: Annotation<Array<{ text: string; confidence: number }> | undefined>,
  progress: Annotation<AgentProgress[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => []
  })
});

export const agentNodes = [
  "Goal Analysis",
  "Audience Discovery",
  "Customer Intelligence",
  "Segment Creation",
  "Channel Recommendation",
  "Message Generation",
  "Performance Prediction",
  "Human Approval",
  "Campaign Launch",
  "Analytics Collection",
  "AI Insights"
];

const timelineLabels: Record<string, string> = {
  "Goal Analysis": "Goal Understood",
  "Audience Discovery": "Finding Audience",
  "Customer Intelligence": "Calculating RFM Scores and Evaluating Churn Risk",
  "Segment Creation": "Creating Customer Segment",
  "Channel Recommendation": "Selecting Best Channel",
  "Message Generation": "Generating Personalized Message",
  "Performance Prediction": "Predicting Campaign Performance",
  "Human Approval": "Campaign Draft Ready",
  "Campaign Launch": "Campaign Launch",
  "Analytics Collection": "Analytics Collection",
  "AI Insights": "AI Insights"
};

const llm = config.openAiKey
  ? new ChatOpenAI({
      apiKey: config.openAiKey,
      model: config.openAiModel,
      temperature: 0.2
    })
  : null;

function mark(node: string): AgentProgress[] {
  return [{ node, label: timelineLabels[node] ?? node, status: "completed" }];
}

async function goalAnalysis(state: typeof AgentState.State) {
  let objective = state.goal;
  if (llm) {
    const response = await llm.invoke(`Summarize this retail CRM campaign goal in one crisp sentence: ${state.goal}`);
    objective = String(response.content);
  }
  return { objective, progress: mark("Goal Analysis") };
}

async function audienceDiscovery(state: typeof AgentState.State) {
  const { rules, audienceSize, customers } = await AudienceTool(state.goal);
  return { rules, audience: { audienceSize, customers }, progress: mark("Audience Discovery") };
}

async function customerIntelligence(state: typeof AgentState.State) {
  const rules = state.rules ?? {};
  const [rfm, churn] = await Promise.all([RFMTool(rules), ChurnTool(rules)]);
  return { rfm, churn, progress: mark("Customer Intelligence") };
}

async function segmentCreation(state: typeof AgentState.State) {
  const rules = state.rules ?? {};
  const segment = await SegmentTool(state.goal, rules, state.audience?.audienceSize ?? 0);
  return { segment, progress: mark("Segment Creation") };
}

async function channelRecommendation(state: typeof AgentState.State) {
  const channel = ChannelRecommendationTool(state.goal, state.rfm ?? { averageRfm: 0 });
  return { channel, progress: mark("Channel Recommendation") };
}

async function messageGeneration(state: typeof AgentState.State) {
  const generated = await MessageGenerationTool(state.goal, state.audience?.audienceSize ?? 421, state.channel?.name ?? "WhatsApp");
  const name = state.goal.toLowerCase().includes("inactive") ? "Dormant Customer Winback" : "AI Growth Campaign";
  return {
    campaignDraft: {
      name,
      subject: generated.subject,
      message: `${generated.message}\n\nUse code WELCOME20.\n\nPersonalized with {{name}}, {{city}}, {{lastPurchase}}, {{totalSpend}}, {{rfmSegment}}.`,
      cta: generated.cta,
      channel: state.channel?.name ?? generated.channel,
      offer: "20% Discount",
      audienceSize: state.audience?.audienceSize ?? 0
    },
    progress: mark("Message Generation")
  };
}

async function performancePrediction(state: typeof AgentState.State) {
  const prediction = CampaignPredictionTool({
    audienceSize: state.audience?.audienceSize ?? 0,
    channel: state.channel?.name ?? "WhatsApp",
    rules: state.rules ?? {}
  });
  return { prediction, progress: mark("Performance Prediction") };
}

async function humanApproval() {
  const recommendations = await InsightTool();
  return {
    recommendations,
    progress: [
      ...mark("Human Approval"),
      { node: "Campaign Launch", label: "Campaign Launch", status: "pending" as const },
      { node: "Analytics Collection", label: "Analytics Collection", status: "pending" as const },
      { node: "AI Insights", label: "AI Insights", status: "pending" as const }
    ]
  };
}

const graph = new StateGraph(AgentState)
  .addNode("goalAnalysis", goalAnalysis)
  .addNode("audienceDiscovery", audienceDiscovery)
  .addNode("customerIntelligence", customerIntelligence)
  .addNode("segmentCreation", segmentCreation)
  .addNode("channelRecommendation", channelRecommendation)
  .addNode("messageGeneration", messageGeneration)
  .addNode("performancePrediction", performancePrediction)
  .addNode("humanApproval", humanApproval)
  .addEdge(START, "goalAnalysis")
  .addEdge("goalAnalysis", "audienceDiscovery")
  .addEdge("audienceDiscovery", "customerIntelligence")
  .addEdge("customerIntelligence", "segmentCreation")
  .addEdge("segmentCreation", "channelRecommendation")
  .addEdge("channelRecommendation", "messageGeneration")
  .addEdge("messageGeneration", "performancePrediction")
  .addEdge("performancePrediction", "humanApproval")
  .addEdge("humanApproval", END)
  .compile();

export async function runCampaignAgent(goal: string) {
  const result = await graph.invoke({ goal });
  return {
    engine: "LangGraph + LangChain",
    status: "WAITING_FOR_APPROVAL",
    goal: result.goal,
    audience: result.audience,
    segment: result.segment,
    channel: result.channel,
    campaignDraft: result.campaignDraft,
    prediction: result.prediction,
    recommendations: result.recommendations,
    rfm: result.rfm,
    churn: result.churn,
    progress: result.progress
  };
}
