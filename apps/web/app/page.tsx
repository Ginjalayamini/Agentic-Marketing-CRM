"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  Command,
  Download,
  Filter,
  Flame,
  LineChart,
  Megaphone,
  Search,
  Send,
  Sparkles,
  Target,
  Users,
  Wand2,
  Zap
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart as ReLineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Badge, Button, Card, Input } from "@/components/ui";
import { api } from "@/lib/api";
import type { Customer } from "@/lib/types";

type Range = "7d" | "30d" | "90d";
type NavItem = "Overview" | "Customers" | "AI Segments" | "Campaigns" | "AI Copilot" | "Analytics" | "Insights" | "Architecture";

type Kpi = {
  label: string;
  value: string;
  trend: string;
  comparison: string;
  tone: string;
};

type Insight = {
  title: string;
  action: string;
  confidence: number;
  severity: "Watch" | "Opportunity" | "Revenue" | "Risk";
};

type AgentRun = {
  status: string;
  goal: string;
  audience?: { audienceSize: number; customers: unknown[] };
  segment?: { name: string; rules: Record<string, unknown>; audienceSize: number };
  channel?: { name: string; reasoning: string };
  campaignDraft?: { name: string; message: string; channel: string; offer: string; audienceSize: number; subject?: string; cta?: string };
  prediction?: {
    predictedOpenRate: number;
    predictedCtr: number;
    predictedConversionRate: number;
    predictedRevenue: number;
    predictedAudienceReach: number;
    confidence: number;
  };
  recommendations?: Array<{ text: string; confidence: number }>;
  progress?: Array<{ node: string; label: string; status: "completed" | "waiting" | "pending" }>;
  rfm?: { averageHealth: number; averageRfm: number; sampleSize: number };
  churn?: { highRisk: number; potentialRevenueLoss: number; retentionOpportunity: number };
};

const nav: Array<[NavItem, typeof BarChart3]> = [
  ["Overview", BarChart3],
  ["Customers", Users],
  ["AI Segments", Brain],
  ["Campaigns", Megaphone],
  ["AI Copilot", Bot],
  ["Analytics", LineChart],
  ["Insights", Sparkles],
  ["Architecture", Command]
];

const workflowNodes = [
  "Understanding Goal",
  "Finding Audience",
  "Calculating RFM Quality",
  "Calculating Churn Risk",
  "Building Segment",
  "Selecting Channel",
  "Generating Campaign",
  "Waiting For Approval"
];

const kpis: Kpi[] = [
  { label: "Customers", value: "5,231", trend: "+18%", comparison: "vs last month", tone: "text-teal" },
  { label: "Active Campaigns", value: "12", trend: "+4", comparison: "new automations live", tone: "text-amber" },
  { label: "Revenue", value: "₹8,56,000", trend: "+23%", comparison: "AI influenced revenue", tone: "text-teal" },
  { label: "Conversion Rate", value: "12.4%", trend: "+2.1%", comparison: "above benchmark", tone: "text-coral" },
  { label: "Growth", value: "+23%", trend: "accelerating", comparison: "projected this quarter", tone: "text-teal" }
];

const insights: Insight[] = [
  {
    title: "Conversion dropped 8% this week",
    action: "Switch dormant audience from Email to WhatsApp before Friday",
    confidence: 91,
    severity: "Watch"
  },
  {
    title: "WhatsApp campaigns outperform Email by 23%",
    action: "Move winback and flash-sale journeys to WhatsApp",
    confidence: 88,
    severity: "Opportunity"
  },
  {
    title: "Re-engagement campaign could generate ₹1.5L",
    action: "Launch 20% comeback offer to inactive high spenders",
    confidence: 87,
    severity: "Revenue"
  },
  {
    title: "High-value customers are becoming inactive",
    action: "Create VIP retention segment with early-access incentive",
    confidence: 82,
    severity: "Risk"
  }
];

const revenueData = {
  "7d": [
    { label: "Mon", revenue: 82000, roi: 3.8, campaigns: 8 },
    { label: "Tue", revenue: 97000, roi: 4.2, campaigns: 9 },
    { label: "Wed", revenue: 76000, roi: 3.2, campaigns: 7 },
    { label: "Thu", revenue: 112000, roi: 4.8, campaigns: 11 },
    { label: "Fri", revenue: 141000, roi: 5.4, campaigns: 12 },
    { label: "Sat", revenue: 128000, roi: 5.1, campaigns: 10 },
    { label: "Sun", revenue: 154000, roi: 5.8, campaigns: 13 }
  ],
  "30d": [
    { label: "W1", revenue: 420000, roi: 3.9, campaigns: 28 },
    { label: "W2", revenue: 510000, roi: 4.4, campaigns: 34 },
    { label: "W3", revenue: 685000, roi: 5.1, campaigns: 41 },
    { label: "W4", revenue: 856000, roi: 5.9, campaigns: 48 }
  ],
  "90d": [
    { label: "Apr", revenue: 1660000, roi: 4.2, campaigns: 88 },
    { label: "May", revenue: 2180000, roi: 4.9, campaigns: 112 },
    { label: "Jun", revenue: 2760000, roi: 5.7, campaigns: 131 }
  ]
};

const channelData = [
  { name: "WhatsApp", value: 43, color: "#38d9c2" },
  { name: "Email", value: 29, color: "#f6c85f" },
  { name: "SMS", value: 18, color: "#ff7a70" },
  { name: "RCS", value: 10, color: "#8ab4ff" }
];

const funnelData = [
  { name: "Sent", value: 12000 },
  { name: "Delivered", value: 11380 },
  { name: "Opened", value: 6540 },
  { name: "Clicked", value: 2180 },
  { name: "Converted", value: 1340 }
];

const personas = [
  { title: "High Value Customers", customers: "423", metric: "Average Spend", value: "₹12,000", icon: Flame },
  { title: "Churn Risk", customers: "198", metric: "Risk", value: "High", icon: Target },
  { title: "New Shoppers", customers: "145", metric: "Potential", value: "High", icon: Sparkles },
  { title: "Loyal Customers", customers: "376", metric: "Retention", value: "92%", icon: CheckCircle2 }
];

const demoCustomers = [
  {
    id: 1,
    name: "Aarav Mehta",
    city: "Hyderabad",
    email: "aarav@example.com",
    channel: "WhatsApp",
    ltv: "₹48,200",
    last: "12 days ago",
    summary: "Frequently purchases fashion products. High likelihood of responding to discount campaigns."
    ,
    rfmSegment: "Champion",
    churnRisk: "Low"
  },
  {
    id: 2,
    name: "Isha Rao",
    city: "Bengaluru",
    email: "isha@example.com",
    channel: "Email",
    ltv: "₹32,900",
    last: "96 days ago",
    summary: "Premium buyer with recent inactivity. Best suited for early-access and limited-time offers."
    ,
    rfmSegment: "At Risk",
    churnRisk: "High"
  },
  {
    id: 3,
    name: "Kabir Singh",
    city: "Mumbai",
    email: "kabir@example.com",
    channel: "RCS",
    ltv: "₹18,450",
    last: "5 days ago",
    summary: "New repeat shopper showing strong browsing intent across footwear and casual wear."
    ,
    rfmSegment: "Potential Loyalist",
    churnRisk: "Medium"
  }
];

const campaignCards = [
  { name: "Winback 90", audience: "Inactive customers", channel: "WhatsApp", revenue: "₹1.2L", status: "Ready" },
  { name: "Summer Drop", audience: "Fashion buyers", channel: "RCS", revenue: "₹92K", status: "Draft" },
  { name: "VIP Early Access", audience: "Top 10%", channel: "Email", revenue: "₹1.8L", status: "Live" }
];

const segmentFilters = [
  "Gender = Female",
  "City = Hyderabad",
  "Category = Shoes",
  "Spend > ₹5000"
];

export default function Dashboard() {
  const [active, setActive] = useState<NavItem>("Overview");
  const [range, setRange] = useState<Range>("30d");
  const [goal, setGoal] = useState("Bring back inactive customers");
  const [aiStatus, setAiStatus] = useState<"idle" | "thinking" | "done">("idle");
  const [segmentPrompt, setSegmentPrompt] = useState("Women in Hyderabad who purchased shoes and spent more than ₹5000");
  const [segmentReady, setSegmentReady] = useState(true);
  const [toast, setToast] = useState("");
  const [agentRun, setAgentRun] = useState<AgentRun | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [editingMessage, setEditingMessage] = useState(false);
  const [approvedCampaignId, setApprovedCampaignId] = useState("");
  const [query, setQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(demoCustomers[0]);
  const [backendCustomers, setBackendCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    void api<Customer[]>("/api/customers?limit=3").then(setBackendCustomers).catch(() => undefined);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setActive("AI Copilot");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const chartData = useMemo(() => revenueData[range], [range]);
  const customers = useMemo(() => {
    const enriched = backendCustomers.length
      ? backendCustomers.map((customer, index) => ({
          id: customer.id,
          name: customer.name,
          city: customer.city,
          email: customer.email,
          channel: customer.preferred_channel,
          ltv: `₹${Number(customer.total_spent).toLocaleString("en-IN")}`,
          last: customer.last_order_date ? `${Math.max(1, index * 17 + 4)} days ago` : "No purchase",
          summary: demoCustomers[index % demoCustomers.length].summary,
          rfmSegment: demoCustomers[index % demoCustomers.length].rfmSegment,
          churnRisk: demoCustomers[index % demoCustomers.length].churnRisk
        }))
      : demoCustomers;
    return enriched.filter((customer) => `${customer.name} ${customer.city} ${customer.email}`.toLowerCase().includes(query.toLowerCase()));
  }, [backendCustomers, query]);

  async function generateCampaign() {
    setAiStatus("thinking");
    setAgentRun(null);
    try {
      const result = await api<AgentRun>("/api/agent/run", {
        method: "POST",
        body: JSON.stringify({ goal })
      });
      setAgentRun(result);
      setMessageDraft(result.campaignDraft?.message ?? "");
      setAiStatus("done");
      setToast("AI campaign generated with 87% confidence");
      window.setTimeout(() => setToast(""), 2600);
    } catch {
      setAiStatus("idle");
      setToast("Backend unavailable. Start the CRM API and try again.");
      window.setTimeout(() => setToast(""), 3200);
    }
  }

  async function regenerateMessage() {
    if (!agentRun) return;
    const result = await api<{ message: string }>("/api/ai/message", {
      method: "POST",
      body: JSON.stringify({ objective: goal, audienceSize: agentRun.audience?.audienceSize ?? 421 })
    });
    setMessageDraft(result.message);
    setToast("Message regenerated");
    window.setTimeout(() => setToast(""), 2200);
  }

  async function approveCampaign() {
    if (!agentRun?.segment || !agentRun.campaignDraft) return;
    const result = await api<{ campaign: { _id: string } }>("/api/agent/approve", {
      method: "POST",
      body: JSON.stringify({
        goal,
        segment: agentRun.segment,
        campaignDraft: { ...agentRun.campaignDraft, message: messageDraft }
      })
    });
    setApprovedCampaignId(result.campaign._id);
    setToast("Campaign approved. Ready to launch.");
    window.setTimeout(() => setToast(""), 2600);
  }

  async function launchApprovedCampaign() {
    if (!approvedCampaignId) {
      await approveCampaign();
      return;
    }
    await api("/api/agent/launch", {
      method: "POST",
      body: JSON.stringify({ campaignId: approvedCampaignId })
    });
    setToast("Campaign launched after approval");
    window.setTimeout(() => setToast(""), 2600);
  }

  function saveSegment() {
    setSegmentReady(true);
    setToast("Segment saved and ready for activation");
    window.setTimeout(() => setToast(""), 2600);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-ink">
      <div className="css-loaded-marker">CSS loaded</div>
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(56,217,194,0.14),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(246,200,95,0.10),transparent_28%),linear-gradient(180deg,#0b0f14,#0c1015_45%,#090d12)]" />
      {toast && (
        <div className="fixed right-5 top-5 z-50 rounded-md border border-teal/40 bg-panel/90 px-4 py-3 text-sm text-teal shadow-2xl shadow-teal/10 backdrop-blur">
          {toast}
        </div>
      )}

      <div className="flex">
        <aside className="hidden min-h-screen w-72 border-r border-white/10 bg-panel/60 px-5 py-6 backdrop-blur-xl lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-teal text-slate-950">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="text-lg font-bold">Agentic Marketing CRM</div>
              <div className="text-xs text-muted">Agentic marketing cockpit</div>
            </div>
          </div>
          <nav className="space-y-1">
            {nav.map(([item, Icon]) => (
              <button
                key={item}
                onClick={() => setActive(item)}
                className={`flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm transition duration-200 ${
                  active === item ? "bg-white text-slate-950 shadow-lg shadow-white/10" : "text-muted hover:bg-white/5 hover:text-ink"
                }`}
              >
                <Icon size={18} />
                {item}
              </button>
            ))}
          </nav>
          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Command size={16} />
              Shortcut
            </div>
            <p className="text-xs leading-5 text-muted">Press Ctrl K to jump into Campaign Copilot.</p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-5 md:px-8">
          <div className="mb-5 flex gap-2 overflow-x-auto lg:hidden">
            {nav.map(([item, Icon]) => (
              <button
                key={item}
                onClick={() => setActive(item)}
                className={`flex h-10 shrink-0 items-center gap-2 rounded-md border border-white/10 px-3 text-sm ${
                  active === item ? "bg-white text-slate-950" : "bg-panel/80 text-muted"
                }`}
              >
                <Icon size={16} />
                {item}
              </button>
            ))}
          </div>

          <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/10 px-3 py-1 text-xs text-teal">
                <Zap size={13} />
                AI-native CRM for revenue teams
              </p>
              <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">{active}</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted">
                Turn a marketing goal into audience, offer, channel, content, launch, and learning in one workflow.
              </p>
            </div>
            <Button onClick={() => setActive("AI Copilot")} className="w-full md:w-auto">
              <Sparkles size={16} />
              Ask AI
            </Button>
          </header>

          {active === "Overview" && (
            <div className="space-y-6">
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {kpis.map((kpi) => (
                  <MetricCard key={kpi.label} kpi={kpi} />
                ))}
              </section>

              <section className="grid gap-5 xl:grid-cols-[1.45fr_.9fr]">
                <CommandCenter
                  goal={goal}
                  setGoal={setGoal}
                  status={aiStatus}
                  onGenerate={generateCampaign}
                  agentRun={agentRun}
                  messageDraft={messageDraft}
                  setMessageDraft={setMessageDraft}
                  editingMessage={editingMessage}
                  setEditingMessage={setEditingMessage}
                  onRegenerate={regenerateMessage}
                  onApprove={approveCampaign}
                  onLaunch={launchApprovedCampaign}
                  approvedCampaignId={approvedCampaignId}
                />
                <NextBestCampaign onLaunch={() => setToast("Campaign launch queued for 421 customers")} />
              </section>

              <section className="grid gap-5 xl:grid-cols-[.95fr_1.35fr]">
                <InsightsPanel />
                <AnalyticsCluster range={range} setRange={setRange} data={chartData} />
              </section>

              <CustomerIntelligence />
            </div>
          )}

          {active === "AI Segments" && (
            <AiSegments
              prompt={segmentPrompt}
              setPrompt={setSegmentPrompt}
              ready={segmentReady}
              onPreview={() => setSegmentReady(true)}
              onSave={saveSegment}
              onLaunch={() => {
                setToast("Segment campaign drafted for 532 customers");
                setActive("Campaigns");
              }}
            />
          )}

          {active === "Customers" && (
            <CustomersPage
              customers={customers}
              query={query}
              setQuery={setQuery}
              selected={selectedCustomer}
              setSelected={setSelectedCustomer}
            />
          )}

          {active === "Campaigns" && <CampaignsPage onLaunch={() => setToast("Campaign launched successfully")} />}

          {active === "AI Copilot" && (
            <CopilotPage
              goal={goal}
              setGoal={setGoal}
              status={aiStatus}
              onGenerate={generateCampaign}
              onLaunch={launchApprovedCampaign}
              onApprove={approveCampaign}
              agentRun={agentRun}
            />
          )}

          {active === "Analytics" && <ExecutiveAnalytics range={range} setRange={setRange} data={chartData} />}
          {active === "Insights" && <InsightsPage />}
          {active === "Architecture" && <ArchitecturePage />}
        </section>
      </div>
    </main>
  );
}

function MetricCard({ kpi }: { kpi: Kpi }) {
  const positive = !kpi.trend.startsWith("-");
  return (
    <Card className="group border-white/10 bg-white/[0.055] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-teal/30 hover:bg-white/[0.075]">
      <div className="flex items-start justify-between">
        <div className="text-sm text-muted">{kpi.label}</div>
        <div className={`rounded-full bg-white/5 p-1.5 ${kpi.tone}`}>{positive ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}</div>
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-normal md:text-3xl">{kpi.value}</div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className={kpi.tone}>{kpi.trend}</span>
        <span className="text-muted">{kpi.comparison}</span>
      </div>
    </Card>
  );
}

function CommandCenter({
  goal,
  setGoal,
  status,
  onGenerate,
  agentRun,
  messageDraft,
  setMessageDraft,
  editingMessage,
  setEditingMessage,
  onRegenerate,
  onApprove,
  onLaunch,
  approvedCampaignId
}: {
  goal: string;
  setGoal: (value: string) => void;
  status: "idle" | "thinking" | "done";
  onGenerate: () => void;
  agentRun: AgentRun | null;
  messageDraft: string;
  setMessageDraft: (value: string) => void;
  editingMessage: boolean;
  setEditingMessage: (value: boolean) => void;
  onRegenerate: () => void;
  onApprove: () => void;
  onLaunch: () => void;
  approvedCampaignId: string;
}) {
  const examples = ["Bring back inactive customers", "Increase repeat purchases", "Promote summer collection", "Target high value customers"];
  return (
    <Card className="relative overflow-hidden border-teal/20 bg-white/[0.06] p-6 backdrop-blur-xl md:p-7">
      <div className="absolute right-5 top-5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-xs text-teal">Live AI planner</div>
      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold md:text-4xl">AI Campaign Command Center</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
          Describe a business outcome. CampaignPilot finds the audience, predicts impact, writes content, and recommends a channel.
        </p>
      </div>
      <div className="mt-6 flex flex-col gap-3 md:flex-row">
        <Input
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder="Describe your marketing goal"
          className="h-12 border-white/10 bg-black/20 text-base"
        />
        <Button onClick={onGenerate} className="h-12 md:w-52">
          <Wand2 size={17} />
          Generate Campaign
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example}
            onClick={() => setGoal(example)}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-muted transition hover:border-teal/30 hover:text-ink"
          >
            {example}
          </button>
        ))}
      </div>
      <div className="mt-6 rounded-lg border border-white/10 bg-black/20 p-4">
        <h3 className="mb-4 text-sm font-semibold text-muted">Agent Execution Timeline</h3>
        {status === "thinking" && <ProgressSkeleton />}
        {status !== "thinking" && !agentRun && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <ResultPill label="Audience Found" value="Run agent" />
            <ResultPill label="Recommended Channel" value="Pending" />
            <ResultPill label="Offer" value="Pending" />
            <ResultPill label="Expected Conversion" value="Pending" />
            <ResultPill label="Expected Revenue" value="Pending" />
            <ResultPill label="Confidence" value="Pending" />
          </div>
        )}
        {agentRun && <AgentTimeline progress={agentRun.progress ?? []} />}
      </div>
      {agentRun?.campaignDraft && agentRun.prediction && (
        <CampaignPreview
          agentRun={agentRun}
          messageDraft={messageDraft}
          setMessageDraft={setMessageDraft}
          editingMessage={editingMessage}
          setEditingMessage={setEditingMessage}
          onRegenerate={onRegenerate}
          onApprove={onApprove}
          onLaunch={onLaunch}
          approvedCampaignId={approvedCampaignId}
        />
      )}
    </Card>
  );
}

function ProgressSkeleton() {
  const steps = [
    "Goal Understood",
    "Finding Audience",
    "Calculating RFM Scores",
    "Evaluating Churn Risk",
    "Creating Customer Segment",
    "Selecting Best Channel",
    "Generating Personalized Message",
    "Predicting Campaign Performance",
    "Campaign Draft Ready"
  ];
  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <motion.div
          key={step}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.08 }}
          className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm"
        >
          <span className="size-2 animate-pulse rounded-full bg-teal" />
          <span>{step}</span>
        </motion.div>
      ))}
    </div>
  );
}

function AgentTimeline({ progress }: { progress: NonNullable<AgentRun["progress"]> }) {
  return (
    <div className="space-y-2">
      {progress.map((item, index) => (
        <motion.div
          key={`${item.node}-${index}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06 }}
          className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 size={16} className={item.status === "completed" ? "text-teal" : "text-muted"} />
            <span>{item.label}</span>
          </div>
          <Badge className={item.status === "completed" ? "border-teal/30 text-teal" : "border-amber/30 text-amber"}>{item.status}</Badge>
        </motion.div>
      ))}
    </div>
  );
}

function CampaignPreview({
  agentRun,
  messageDraft,
  setMessageDraft,
  editingMessage,
  setEditingMessage,
  onRegenerate,
  onApprove,
  onLaunch,
  approvedCampaignId
}: {
  agentRun: AgentRun;
  messageDraft: string;
  setMessageDraft: (value: string) => void;
  editingMessage: boolean;
  setEditingMessage: (value: boolean) => void;
  onRegenerate: () => void;
  onApprove: () => void;
  onLaunch: () => void;
  approvedCampaignId: string;
}) {
  const draft = agentRun.campaignDraft!;
  const prediction = agentRun.prediction!;
  return (
    <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_.9fr]">
      <div className="rounded-lg border border-white/10 bg-black/20 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Campaign Preview</h3>
            <p className="text-sm text-muted">Draft generated by LangChain/OpenAI through the LangGraph workflow.</p>
          </div>
          <Badge className="border-teal/30 text-teal">{prediction.confidence}% confidence</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ResultPill label="Campaign Name" value={draft.name} />
          <ResultPill label="Audience Size" value={`${agentRun.audience?.audienceSize ?? draft.audienceSize} customers`} />
          <ResultPill label="Recommended Channel" value={agentRun.channel?.name ?? draft.channel} />
          <ResultPill label="Offer" value={draft.offer} />
        </div>
        <div className="mt-4 rounded-md border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-2 text-sm text-muted">Personalized Message Preview</div>
          {editingMessage ? (
            <textarea
              value={messageDraft}
              onChange={(event) => setMessageDraft(event.target.value)}
              className="min-h-40 w-full rounded-md border border-white/10 bg-background p-3 text-sm text-ink outline-none"
            />
          ) : (
            <p className="whitespace-pre-line text-sm leading-6">{messageDraft.replace("{{name}}", "Ravi").replace("{{city}}", "Hyderabad")}</p>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => setEditingMessage(!editingMessage)} className="bg-white text-slate-950 hover:bg-white/90">
            {editingMessage ? "Save Message" : "Edit Message"}
          </Button>
          <Button onClick={onRegenerate} className="bg-amber text-slate-950 hover:bg-amber/90">
            Regenerate Message
          </Button>
        </div>
      </div>
      <div className="rounded-lg border border-white/10 bg-black/20 p-4">
        <h3 className="font-semibold">Campaign Draft Ready</h3>
        <div className="mt-4 grid gap-3">
          <ResultPill label="Predicted Open Rate" value={`${prediction.predictedOpenRate}%`} />
          <ResultPill label="Predicted CTR" value={`${prediction.predictedCtr}%`} />
          <ResultPill label="Predicted Conversion" value={`${prediction.predictedConversionRate}%`} />
          <ResultPill label="Predicted Revenue" value={`₹${prediction.predictedRevenue.toLocaleString("en-IN")}`} />
          <ResultPill label="Predicted Reach" value={`${prediction.predictedAudienceReach}`} />
        </div>
        <div className="mt-4 rounded-md border border-white/10 bg-white/[0.04] p-4 text-sm">
          <div className="font-medium">Why AI Chose This</div>
          <ul className="mt-3 space-y-2 text-muted">
            <li>Customers have not purchased in 90+ days.</li>
            <li>Average spend is strong enough for a discount-led winback.</li>
            <li>{agentRun.channel?.reasoning}</li>
            <li>Discount campaigns generated 23% higher conversion.</li>
          </ul>
        </div>
        <div className="mt-4 grid gap-2">
          <Button onClick={onApprove} className="bg-white text-slate-950 hover:bg-white/90">Approve Campaign</Button>
          <Button onClick={() => setEditingMessage(true)} className="bg-amber text-slate-950 hover:bg-amber/90">Edit Campaign</Button>
          <Button onClick={onLaunch} disabled={!approvedCampaignId}>Launch Campaign</Button>
          <button className="rounded-md border border-white/10 px-4 py-2 text-sm text-muted hover:text-ink">Cancel Campaign</button>
        </div>
      </div>
    </div>
  );
}

function TypingLine({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-teal">
      <span className="flex gap-1">
        <span className="size-2 animate-bounce rounded-full bg-teal" />
        <span className="size-2 animate-bounce rounded-full bg-teal [animation-delay:120ms]" />
        <span className="size-2 animate-bounce rounded-full bg-teal [animation-delay:240ms]" />
      </span>
      <span className="animate-pulse">{text}</span>
    </div>
  );
}

function ResultPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.04] p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function InsightsPanel() {
  return (
    <Card className="border-white/10 bg-white/[0.055] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">AI Insights</h2>
          <p className="text-sm text-muted">Prioritized actions ranked by revenue impact.</p>
        </div>
        <Badge className="border-teal/30 text-teal">4 new</Badge>
      </div>
      <div className="space-y-3">
        {insights.map((insight) => (
          <div key={insight.title} className="rounded-lg border border-white/10 bg-black/20 p-4 transition hover:border-teal/25">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge className={severityClass(insight.severity)}>{insight.severity}</Badge>
                <h3 className="mt-3 font-medium">{insight.title}</h3>
                <p className="mt-1 text-sm leading-5 text-muted">{insight.action}</p>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold text-teal">{insight.confidence}%</div>
                <div className="text-xs text-muted">confidence</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AnalyticsCluster({ range, setRange, data }: { range: Range; setRange: (range: Range) => void; data: typeof revenueData[Range] }) {
  return (
    <Card className="border-white/10 bg-white/[0.055] backdrop-blur-xl">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Revenue Analytics</h2>
          <p className="text-sm text-muted">Revenue trend, performance, and channel mix.</p>
        </div>
        <RangePicker range={range} setRange={setRange} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <div className="h-72 rounded-lg border border-white/10 bg-black/20 p-4">
          <div className="mb-3 text-sm text-muted">Revenue Trend</div>
          <ResponsiveContainer width="100%" height="88%">
            <AreaChart data={data}>
              <CartesianGrid stroke="#233142" strokeDasharray="4 4" />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="revenue" stroke="#38d9c2" fill="#38d9c233" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-4">
          <div className="h-32 rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="mb-3 text-sm text-muted">Campaign Performance</div>
            <ResponsiveContainer width="100%" height="75%">
              <ReLineChart data={data}>
                <Tooltip contentStyle={tooltipStyle} />
                <Line dataKey="roi" stroke="#f6c85f" strokeWidth={2} dot={false} />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
          <div className="h-36 rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="mb-2 text-sm text-muted">Channel Comparison</div>
            <ResponsiveContainer width="100%" height="78%">
              <PieChart>
                <Pie data={channelData} innerRadius={35} outerRadius={52} dataKey="value">
                  {channelData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
}

function RangePicker({ range, setRange }: { range: Range; setRange: (range: Range) => void }) {
  return (
    <div className="flex rounded-md border border-white/10 bg-black/20 p-1">
      {(["7d", "30d", "90d"] as Range[]).map((item) => (
        <button
          key={item}
          onClick={() => setRange(item)}
          className={`h-8 rounded px-3 text-xs transition ${range === item ? "bg-white text-slate-950" : "text-muted hover:text-ink"}`}
        >
          {item === "7d" ? "Last 7 Days" : item === "30d" ? "Last 30 Days" : "Last 90 Days"}
        </button>
      ))}
    </div>
  );
}

function NextBestCampaign({ onLaunch }: { onLaunch: () => void }) {
  return (
    <Card className="border-amber/20 bg-white/[0.055] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Next Best Campaign</h2>
          <p className="text-sm text-muted">Recommended by AI revenue model.</p>
        </div>
        <Badge className="border-teal/30 text-teal">87% confidence</Badge>
      </div>
      <div className="rounded-lg border border-white/10 bg-black/20 p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-amber text-slate-950">
            <Target size={20} />
          </div>
          <div>
            <div className="font-semibold">Recommended Campaign</div>
            <div className="text-sm text-muted">Win back inactive premium buyers</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <ResultPill label="Audience" value="Inactive >90 days" />
          <ResultPill label="Reach" value="421" />
          <ResultPill label="Channel" value="WhatsApp" />
          <ResultPill label="Offer" value="20% Discount" />
          <ResultPill label="Expected Revenue" value="₹1.2L" />
          <ResultPill label="Confidence" value="87%" />
        </div>
      </div>
      <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-3 font-medium">Why AI Chose This</div>
        <ul className="space-y-2 text-sm text-muted">
          <li>High historical spending</li>
          <li>No purchases in 90 days</li>
          <li>Strong response to discounts</li>
        </ul>
      </div>
      <Button onClick={onLaunch} className="mt-5 w-full">
        <Send size={16} />
        Launch Campaign
      </Button>
    </Card>
  );
}

function CustomerIntelligence() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {personas.map((persona) => (
        <Card key={persona.title} className="border-white/10 bg-white/[0.055] backdrop-blur-xl transition hover:-translate-y-1 hover:border-teal/25">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-lg bg-white/10">
              <persona.icon size={18} />
            </div>
            <ChevronRight size={18} className="text-muted" />
          </div>
          <div className="font-semibold">{persona.title}</div>
          <div className="mt-4 text-3xl font-semibold">{persona.customers}</div>
          <div className="mt-1 text-sm text-muted">Customers</div>
          <div className="mt-4 rounded-md bg-black/20 p-3 text-sm">
            <span className="text-muted">{persona.metric}: </span>
            <span className="font-medium text-teal">{persona.value}</span>
          </div>
        </Card>
      ))}
    </section>
  );
}

function AiSegments({
  prompt,
  setPrompt,
  ready,
  onPreview,
  onSave,
  onLaunch
}: {
  prompt: string;
  setPrompt: (value: string) => void;
  ready: boolean;
  onPreview: () => void;
  onSave: () => void;
  onLaunch: () => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr]">
      <Card className="border-white/10 bg-white/[0.055] p-6 backdrop-blur-xl">
        <h2 className="text-2xl font-semibold">Natural Language Audience Builder</h2>
        <p className="mt-2 text-sm text-muted">Build precise retail segments without SQL or filters.</p>
        <div className="mt-6 flex flex-col gap-3">
          <Input value={prompt} onChange={(event) => setPrompt(event.target.value)} className="h-12 border-white/10 bg-black/20" />
          <div className="flex flex-wrap gap-2">
            <Button onClick={onPreview}>
              <Filter size={16} />
              Preview Customers
            </Button>
            <Button onClick={onSave} className="bg-white text-slate-950 hover:bg-white/90">
              Save Segment
            </Button>
            <Button onClick={onLaunch} className="bg-amber text-slate-950 hover:bg-amber/90">
              Launch Campaign
            </Button>
          </div>
        </div>
      </Card>
      <Card className="border-white/10 bg-white/[0.055] backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Generated Filters</h3>
          <Badge className="border-teal/30 text-teal">532 matches</Badge>
        </div>
        {ready ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {segmentFilters.map((filter) => (
              <div key={filter} className="rounded-md border border-white/10 bg-black/20 p-4 text-sm">
                {filter}
              </div>
            ))}
          </div>
        ) : (
          <SkeletonBlock />
        )}
        <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
          <div className="text-sm text-muted">AI interpretation</div>
          <p className="mt-2 text-sm leading-6">
            CampaignPilot found a high-intent footwear audience in Hyderabad with enough historical spend to justify a premium discount campaign.
          </p>
        </div>
      </Card>
    </div>
  );
}

function CustomersPage({
  customers,
  query,
  setQuery,
  selected,
  setSelected
}: {
  customers: Array<typeof demoCustomers[number]>;
  query: string;
  setQuery: (value: string) => void;
  selected: typeof demoCustomers[number];
  setSelected: (customer: typeof demoCustomers[number]) => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.35fr_.8fr]">
      <Card className="border-white/10 bg-white/[0.055] p-0 backdrop-blur-xl">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-muted" size={16} />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customers" className="pl-9" />
          </div>
          <Button className="bg-white text-slate-950 hover:bg-white/90">
            <Filter size={16} />
            Filters
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="p-4">Customer</th>
                <th>City</th>
                <th>Channel</th>
                <th>LTV</th>
                <th>Last Activity</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-white/10">
                  <td className="p-4">
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-muted">{customer.email}</div>
                  </td>
                  <td>{customer.city}</td>
                  <td>{customer.channel}</td>
                  <td>{customer.ltv}</td>
                  <td>{customer.last}</td>
                  <td className="pr-4">
                    <button onClick={() => setSelected(customer)} className="rounded-md border border-white/10 px-3 py-2 text-xs text-muted hover:text-ink">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!customers.length && <EmptyState title="No customers found" description="Try a broader search or remove filters." />}
      </Card>
      <Card className="border-white/10 bg-white/[0.055] backdrop-blur-xl">
        <h2 className="mb-1 text-lg font-semibold">Customer Details</h2>
        <p className="mb-5 text-sm text-muted">AI-generated summary and purchase context.</p>
        <div className="rounded-lg border border-white/10 bg-black/20 p-4">
          <div className="text-xl font-semibold">{selected.name}</div>
          <div className="mt-1 text-sm text-muted">{selected.city} / {selected.channel}</div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <ResultPill label="Lifetime Value" value={selected.ltv} />
            <ResultPill label="Last Activity" value={selected.last} />
            <ResultPill label="RFM Segment" value={selected.rfmSegment} />
            <ResultPill label="Churn Risk" value={selected.churnRisk} />
          </div>
          <div className="mt-4 rounded-md bg-white/[0.04] p-4 text-sm leading-6">{selected.summary}</div>
        </div>
        <div className="mt-5">
          <div className="mb-3 text-sm font-medium">Purchase History</div>
          {["Fashion order - ₹4,200", "Footwear order - ₹6,800", "Beauty order - ₹2,100"].map((item) => (
            <div key={item} className="mb-2 rounded-md border border-white/10 bg-black/20 p-3 text-sm text-muted">
              {item}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function CampaignsPage({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {campaignCards.map((campaign) => (
        <Card key={campaign.name} className="border-white/10 bg-white/[0.055] backdrop-blur-xl transition hover:-translate-y-1 hover:border-teal/25">
          <div className="mb-5 flex items-center justify-between">
            <Badge className="border-teal/30 text-teal">{campaign.status}</Badge>
            <Badge>{campaign.channel}</Badge>
          </div>
          <h2 className="text-xl font-semibold">{campaign.name}</h2>
          <p className="mt-2 text-sm text-muted">{campaign.audience}</p>
          <div className="mt-6 rounded-lg bg-black/20 p-4">
            <div className="text-sm text-muted">Expected Revenue</div>
            <div className="mt-1 text-3xl font-semibold">{campaign.revenue}</div>
          </div>
          <Button onClick={onLaunch} className="mt-5 w-full">
            Launch Campaign
          </Button>
        </Card>
      ))}
    </div>
  );
}

function CopilotPage({
  goal,
  setGoal,
  status,
  onGenerate,
  onLaunch,
  onApprove,
  agentRun
}: {
  goal: string;
  setGoal: (value: string) => void;
  status: "idle" | "thinking" | "done";
  onGenerate: () => void;
  onLaunch: () => void;
  onApprove: () => void;
  agentRun: AgentRun | null;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[.9fr_1.2fr]">
      <Card className="border-white/10 bg-white/[0.055] backdrop-blur-xl">
        <h2 className="text-xl font-semibold">Campaign Copilot</h2>
        <p className="mt-2 text-sm text-muted">LangGraph-powered agent workflow for campaign orchestration.</p>
        <div className="mt-6 flex gap-2">
          <Input value={goal} onChange={(event) => setGoal(event.target.value)} />
          <Button onClick={onGenerate}>
            <Send size={16} />
            Send
          </Button>
        </div>
        <div className="mt-6 space-y-2">
          {workflowNodes.map((node, index) => (
            <div key={node} className="flex items-center gap-3 rounded-md border border-white/10 bg-black/20 p-3 text-sm">
              <CheckCircle2 size={16} className={status === "thinking" || index < 7 ? "text-teal" : "text-muted"} />
              <span>{node}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card className="border-white/10 bg-white/[0.055] backdrop-blur-xl">
        <div className="space-y-4">
          <ChatBubble role="User" text={goal || "Bring back inactive customers"} />
          <div className="rounded-lg border border-teal/20 bg-teal/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal">
              <Bot size={16} />
              AI
            </div>
            {status === "thinking" ? (
              <TypingLine text="Streaming campaign analysis" />
            ) : (
              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-muted">Analysis:</span> {agentRun?.audience?.audienceSize ?? 421} inactive customers detected
                </p>
                <p>
                  <span className="text-muted">Recommended Channel:</span> {agentRun?.channel?.name ?? "WhatsApp"}
                </p>
                <p>
                  <span className="text-muted">Recommended Offer:</span> {agentRun?.campaignDraft?.offer ?? "20% Discount"}
                </p>
                <p>
                  <span className="text-muted">Expected Conversion:</span> {agentRun?.prediction?.predictedConversionRate ?? 11.2}%
                </p>
                <p>
                  <span className="text-muted">Expected Revenue:</span> ₹{(agentRun?.prediction?.predictedRevenue ?? 82000).toLocaleString("en-IN")}
                </p>
                <div className="rounded-md border border-white/10 bg-black/20 p-3">
                  <div className="font-medium">Reasoning</div>
                  <ul className="mt-2 space-y-1 text-muted">
                    <li>High historical engagement</li>
                    <li>Customers inactive &gt;90 days</li>
                    <li>High response to discounts</li>
                    <li>{agentRun?.channel?.reasoning ?? "WhatsApp recommended because dormant customers show stronger engagement."}</li>
                  </ul>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={onGenerate} className="bg-white text-slate-950 hover:bg-white/90">Create Segment</Button>
                  <Button onClick={onGenerate} className="bg-amber text-slate-950 hover:bg-amber/90">Generate Campaign</Button>
                  <Button onClick={onApprove}>Approve Campaign</Button>
                  <Button onClick={onLaunch}>Launch Campaign</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function ChatBubble({ role, text }: { role: string; text: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="mb-2 text-sm font-medium text-muted">{role}</div>
      <div>{text}</div>
    </div>
  );
}

function ExecutiveAnalytics({ range, setRange, data }: { range: Range; setRange: (range: Range) => void; data: typeof revenueData[Range] }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <RangePicker range={range} setRange={setRange} />
        <Button className="bg-white text-slate-950 hover:bg-white/90">
          <Download size={16} />
          Download Report
        </Button>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="h-96 border-white/10 bg-white/[0.055] backdrop-blur-xl">
          <h2 className="mb-4 text-lg font-semibold">Revenue and Campaign ROI</h2>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={data}>
              <CartesianGrid stroke="#233142" strokeDasharray="4 4" />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Area dataKey="revenue" stroke="#38d9c2" fill="#38d9c233" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="h-96 border-white/10 bg-white/[0.055] backdrop-blur-xl">
          <h2 className="mb-4 text-lg font-semibold">Conversion Funnel</h2>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid stroke="#233142" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#f6c85f" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <ResultPanel title="Top Segment" value="High value inactive" note="32% higher AOV" />
        <ResultPanel title="Customer Retention" value="78%" note="+9% from AI journeys" />
        <ResultPanel title="Channel Performance" value="WhatsApp" note="23% above Email" />
      </div>
    </div>
  );
}

function InsightsPage() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <Card className="border-white/10 bg-white/[0.055] backdrop-blur-xl">
        <h2 className="text-xl font-semibold">AI Campaign Insights</h2>
        <p className="mt-2 text-sm text-muted">Executive summary generated after campaign execution.</p>
        <div className="mt-6 space-y-3">
          {[
            "Open Rate: 72%",
            "WhatsApp outperformed SMS by 28%",
            "Customers aged 25-35 converted most",
            "Hyderabad generated highest revenue",
            "Recommended next action: launch loyalty campaign"
          ].map((insight) => (
            <div key={insight} className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm">
              <div className="flex items-center gap-3">
                <Sparkles size={17} className="text-teal" />
                <span>{insight}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="border-white/10 bg-white/[0.055] backdrop-blur-xl">
        <h2 className="text-xl font-semibold">AI Segment Recommendations</h2>
        <p className="mt-2 text-sm text-muted">Recommended audiences ranked by business value.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ResultPill label="Dormant Customers" value="421" />
          <ResultPill label="VIP Customers" value="423" />
          <ResultPill label="High Churn Customers" value="198" />
          <ResultPill label="First-Time Buyers" value="145" />
          <ResultPill label="High Value Customers" value="376" />
          <ResultPill label="Avg Health Score" value="74/100" />
        </div>
      </Card>
    </div>
  );
}

function ArchitecturePage() {
  const steps = [
    ["Next.js Frontend", "Dashboard, Copilot, Segment Builder, Analytics, and approval workflows."],
    ["CRM Backend", "Express TypeScript API that owns customers, segments, campaigns, receipts, and analytics."],
    ["LangGraph Agent", "Orchestrates goal analysis, audience discovery, RFM, churn, prediction, approval, and insights."],
    ["Customer Intelligence Tools", "RFM scoring, health score, lifecycle segment, and churn risk calculation."],
    ["Segment Builder", "Turns natural language goals into MongoDB audience rules."],
    ["Channel Recommender", "Chooses WhatsApp, SMS, Email, or RCS with explainable reasoning."],
    ["Message Generator", "LangChain/OpenAI content generation with personalization variables."],
    ["Campaign Engine", "Creates drafts, waits for human approval, launches communications."],
    ["Channel Simulator", "Independent service simulating delivery, opens, reads, clicks, and conversions."],
    ["Receipt Callback API", "Receives asynchronous lifecycle events and updates campaign state."],
    ["Analytics Engine", "Aggregates funnel, conversion, revenue, and campaign performance."],
    ["AI Insights", "Generates executive recommendations and next-best actions."]
  ];
  const [selected, setSelected] = useState(steps[0]);
  return (
    <Card className="border-white/10 bg-white/[0.055] backdrop-blur-xl">
      <h2 className="text-xl font-semibold">Agentic Architecture</h2>
      <p className="mt-2 text-sm text-muted">How the platform moves from marketer intent to measurable campaign outcomes.</p>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_.75fr]">
        <div className="grid gap-3">
        {steps.map((step, index) => (
          <button
            key={step[0]}
            onClick={() => setSelected(step)}
            className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-4 text-left transition hover:border-teal/30"
          >
            <div className="flex size-8 items-center justify-center rounded-md bg-teal text-sm font-semibold text-slate-950">{index + 1}</div>
            <div className="font-medium">{step[0]}</div>
            {index < steps.length - 1 && <ChevronRight size={18} className="ml-auto text-muted" />}
          </button>
        ))}
        </div>
        <div className="rounded-lg border border-teal/20 bg-teal/10 p-5">
          <div className="text-lg font-semibold text-teal">{selected[0]}</div>
          <p className="mt-3 text-sm leading-6 text-muted">{selected[1]}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <ResultPanel title="Current Design" value="Direct APIs" note="Simple, reliable, demo-ready request/response workflows" />
        <ResultPanel title="Future Scale" value="Event Driven" note="Kafka, RabbitMQ, Redis queues, workers, and streaming analytics" />
      </div>
    </Card>
  );
}

function ResultPanel({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <Card className="border-white/10 bg-white/[0.055] backdrop-blur-xl">
      <div className="text-sm text-muted">{title}</div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
      <div className="mt-2 text-sm text-teal">{note}</div>
    </Card>
  );
}

function SkeletonBlock() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="h-12 animate-pulse rounded-md bg-white/10" />
      ))}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-10 text-center">
      <div className="font-medium">{title}</div>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
}

function severityClass(severity: Insight["severity"]) {
  if (severity === "Watch") return "border-coral/30 text-coral";
  if (severity === "Revenue") return "border-amber/30 text-amber";
  if (severity === "Risk") return "border-coral/30 text-coral";
  return "border-teal/30 text-teal";
}

const tooltipStyle = {
  background: "#111820",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "8px",
  color: "#e8eef5"
};
