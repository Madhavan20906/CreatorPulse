import { eq } from "drizzle-orm";
import { db, creatorStateTable } from "@workspace/db";

export type CreatorState = {
  pulse: any;
  channel: any;
  opportunities: any[];
  contentPackages: Record<string, any>;
  qualityReports: Record<string, any>;
  memory: any;
  activity: any[];
  measurement: any | null;
  scheduled: any[];
};

const initialState: CreatorState = {
  pulse: {
    creatorName: "Alex Rivera",
    headline: "Your channel is trending upward.",
    trend: "+18% vs. last 30 days",
    growthOpportunities: 7,
    contentReady: 4,
    pendingApproval: 2,
    publishedThisWeek: 5,
    baselineViews: 41300,
    recommended: null,
    recentActivity: [],
  },
  channel: {
    name: "Alex Rivera",
    handle: "@buildwithalex",
    niche: "AI engineering and developer tools",
    subscribers: 128400,
    totalViews: 2840000,
    averageViews: 41300,
    videosAnalyzed: 42,
    topTopic: "AI agents",
    strongestFormat: "Practical tutorial",
    dataMode: "Demo channel · public metrics sample",
    topics: [
      { name: "AI agents", views: 812000, performance: "Excellent", audienceFit: 94, saturation: 28 },
      { name: "Developer workflows", views: 604000, performance: "Strong", audienceFit: 88, saturation: 42 },
      { name: "RAG systems", views: 398000, performance: "Strong", audienceFit: 81, saturation: 55 },
      { name: "Python tutorials", views: 271000, performance: "Average", audienceFit: 72, saturation: 78 },
    ],
    videos: [
      {
        id: "video-42",
        title: "I built an AI agent that fixes its own bugs",
        topic: "AI agents",
        format: "Practical tutorial",
        views: 84201,
        engagementRate: 7.8,
        publishedAt: "2026-08-21",
        duration: "14:32",
        hook: "What if your agent could debug itself?",
      },
      {
        id: "video-41",
        title: "The MCP architecture I wish I had started with",
        topic: "AI agents",
        format: "Deep dive",
        views: 71300,
        engagementRate: 6.9,
        publishedAt: "2026-08-14",
        duration: "18:10",
        hook: "Most MCP projects become unmaintainable for one reason.",
      },
      {
        id: "video-40",
        title: "Build a RAG app in 30 minutes",
        topic: "RAG systems",
        format: "Practical tutorial",
        views: 48200,
        engagementRate: 5.1,
        publishedAt: "2026-08-06",
        duration: "29:44",
        hook: "You do not need a vector database to learn RAG.",
      },
      {
        id: "video-39",
        title: "5 Python automations I use every week",
        topic: "Python tutorials",
        format: "Listicle",
        views: 21600,
        engagementRate: 3.2,
        publishedAt: "2026-07-28",
        duration: "11:06",
        hook: "These tiny scripts save me a full workday every month.",
      },
    ],
  },
  opportunities: [
    {
      id: "opp-production-agents",
      title: "Why AI agents work in a demo but fail in production",
      topic: "AI agents",
      format: "Practical tutorial",
      score: 91,
      audienceFit: 96,
      novelty: 88,
      historicalFit: 94,
      collisionRisk: 12,
      effort: "Medium",
      confidence: "High",
      rationale: "Your strongest topic has proven demand, but your library has no video that addresses the production failure mode directly.",
      signals: ["AI-agent videos are 1.9× your baseline", "Low library coverage of production reliability", "Strong fit for a 3-part repurposing package"],
      prediction: { direction: "Above creator baseline", confidence: 0.74, baselineMultiplier: 1.8 },
      status: "recommended",
      formulaBreakdown: {
        audienceFitWeight: "35% (Topic avg 812K views / 41.3K channel baseline = 1.96×)",
        historicalFitWeight: "30% (Practical tutorials average 7.8% engagement across 14 videos)",
        noveltyWeight: "25% (0 of 42 library videos directly cover production failure modes)",
        collisionRiskWeight: "-10% (12% token overlap against channel history after stop-word filtering)",
        formulaString: "Score = (0.35 × 96) + (0.30 × 94) + (0.25 × 88) - (0.10 × 12) = 91",
        topicBenchmarkRatio: "1.96× baseline views",
        confidenceRationale: "High confidence: 2 previous topic uploads exceeded 70K views within 7 days",
      },
    },
    {
      id: "opp-agent-memory",
      title: "The missing memory layer behind reliable AI agents",
      topic: "AI agents",
      format: "Deep dive",
      score: 84,
      audienceFit: 91,
      novelty: 79,
      historicalFit: 88,
      collisionRisk: 24,
      effort: "High",
      confidence: "Medium",
      rationale: "Memory is a natural follow-up to your MCP architecture video and fills a clear conceptual gap.",
      signals: ["Adjacent to your second-best video", "High save/share potential", "Requires more production effort"],
      prediction: { direction: "Above creator baseline", confidence: 0.63, baselineMultiplier: 1.45 },
      status: "open",
      formulaBreakdown: {
        audienceFitWeight: "35% (Topic avg 812K views / 41.3K channel baseline = 1.96×)",
        historicalFitWeight: "30% (Deep dives average 6.9% engagement rate across 8 videos)",
        noveltyWeight: "25% (Adjacent to video-41 with a new architecture angle)",
        collisionRiskWeight: "-10% (24% token overlap with video-41 MCP architecture)",
        formulaString: "Score = (0.35 × 91) + (0.30 × 88) + (0.25 × 79) - (0.10 × 24) = 84",
        topicBenchmarkRatio: "1.72× baseline views",
        confidenceRationale: "Medium confidence: technically demanding topic with high upside retention",
      },
    },
    {
      id: "opp-workflow-shortcuts",
      title: "7 developer workflow shortcuts that compound with AI",
      topic: "Developer workflows",
      format: "Listicle",
      score: 76,
      audienceFit: 84,
      novelty: 68,
      historicalFit: 82,
      collisionRisk: 31,
      effort: "Low",
      confidence: "Medium",
      rationale: "A lower-effort idea that uses your workflow authority without repeating the same AI-agent framing.",
      signals: ["Strong fit for Shorts", "Low production effort", "Moderate novelty"],
      prediction: { direction: "Near creator baseline", confidence: 0.61, baselineMultiplier: 1.18 },
      status: "open",
      formulaBreakdown: {
        audienceFitWeight: "35% (Topic avg 604K views / 41.3K channel baseline = 1.46×)",
        historicalFitWeight: "30% (Listicles average 3.2% engagement rate across 10 videos)",
        noveltyWeight: "25% (Workflow compounding focus)",
        collisionRiskWeight: "-10% (31% token overlap with video-39 Python automations)",
        formulaString: "Score = (0.35 × 84) + (0.30 × 82) + (0.25 × 68) - (0.10 × 31) = 76",
        topicBenchmarkRatio: "1.46× baseline views",
        confidenceRationale: "Medium confidence: fast turnaround with moderate baseline multiplier",
      },
    },
  ],
  contentPackages: {},
  qualityReports: {},
  memory: {
    version: 3,
    identity: {
      name: "Alex Rivera",
      niche: "AI engineering and developer tools",
      audience: "18–34 year-old developers building with AI",
      goals: ["Grow subscribers", "Increase qualified views", "Build authority"],
      tone: "Practical, candid, technically rigorous",
      platforms: ["YouTube", "Shorts", "X"],
    },
    topicMemory: [
      { label: "AI agents", signal: "Historically associated with stronger performance", confidence: 94 },
      { label: "Python tutorials", signal: "Audience fit is present but the library is saturated", confidence: 72 },
    ],
    formatMemory: [
      { label: "Practical tutorial", signal: "Strongest long-form format", confidence: 91 },
      { label: "Shorts", signal: "Contrarian explainers outperform generic tips", confidence: 86 },
    ],
    hookMemory: [
      { label: "Contrarian", signal: "High performance in recent uploads", confidence: 89 },
      { label: "Generic educational", signal: "Underperforms channel baseline", confidence: 68 },
    ],
    timingMemory: [
      { label: "Thursday 10:00", signal: "Historically associated with stronger first-day velocity", confidence: 64 },
    ],
    learnings: [
      "Contrarian hooks paired with an AI-agent topic have outperformed the channel baseline.",
      "The audience responds to practical failure analysis more than broad tool roundups.",
    ],
  },
  activity: [
    { id: "activity-1", agent: "Channel Brain", action: "Analyzed channel library", detail: "42 videos clustered into 4 topic groups", timestamp: "2 min ago", status: "complete" },
    { id: "activity-2", agent: "Opportunity Agent", action: "Found a content gap", detail: "Production reliability is under-covered despite strong audience fit", timestamp: "1 min ago", status: "complete" },
    { id: "activity-3", agent: "Growth Planner", action: "Selected next move", detail: "Why AI agents work in a demo but fail in production", timestamp: "Just now", status: "complete" },
  ],
  measurement: null,
  scheduled: [
    {
      id: "scheduled-1",
      title: "Why AI agents work in a demo but fail in production",
      type: "LONG-FORM",
      scheduledFor: "2026-10-15T09:00:00Z",
      status: "Approved",
      slot: "TUE 15 · 09:00 AM",
    },
    {
      id: "scheduled-2",
      title: "Your AI agent is not failing randomly",
      type: "SHORT",
      scheduledFor: "2026-10-17T12:30:00Z",
      status: "Queued",
      slot: "THU 17 · 12:30 PM",
    },
    {
      id: "scheduled-3",
      title: "The MCP architecture I wish I had started with",
      type: "LONG-FORM",
      scheduledFor: "2026-10-19T10:00:00Z",
      status: "Draft",
      slot: "SAT 19 · 10:00 AM",
    },
  ],
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

let memoryState: CreatorState = clone(initialState);

export async function loadCreatorState(): Promise<CreatorState> {
  try {
    const [row] = await db
      .select()
      .from(creatorStateTable)
      .where(eq(creatorStateTable.id, 1));

    if (!row) {
      const [created] = await db
        .insert(creatorStateTable)
        .values({ id: 1, state: initialState })
        .returning();
      memoryState = clone(created.state as CreatorState);
      return memoryState;
    }

    memoryState = clone(row.state as CreatorState);
    return memoryState;
  } catch (error) {
    console.warn("Postgres unavailable or not configured; serving from resilient in-memory store.");
    return clone(memoryState);
  }
}

export async function saveCreatorState(state: CreatorState): Promise<CreatorState> {
  memoryState = clone(state);
  try {
    const [saved] = await db
      .insert(creatorStateTable)
      .values({ id: 1, state })
      .onConflictDoUpdate({
        target: creatorStateTable.id,
        set: { state, updatedAt: new Date() },
      })
      .returning();
    return clone(saved.state as CreatorState);
  } catch (error) {
    console.warn("Postgres save failed; saved to resilient in-memory store.");
    return clone(memoryState);
  }
}

export function addActivity(state: CreatorState, activity: Omit<any, "id">): void {
  state.activity = [
    { id: `activity-${Date.now()}`, ...activity },
    ...state.activity,
  ].slice(0, 8);
  state.pulse.recentActivity = state.activity.slice(0, 4);
}

export function findOpportunity(state: CreatorState, id: string): any | undefined {
  return state.opportunities.find((opportunity) => opportunity.id === id);
}

export function findContent(state: CreatorState, id: string): any | undefined {
  if (state.contentPackages[id]) return state.contentPackages[id];
  const catalogVideo = state.channel.videos.find((v: any) => v.id === id);
  if (catalogVideo) {
    return {
      id: catalogVideo.id,
      title: catalogVideo.title,
      prediction: { direction: "Above creator baseline" },
      status: "published",
    };
  }
  return {
    id,
    title: id === "video-41" ? "The MCP architecture I wish I had started with" : "AI Agent Architecture Deep Dive",
    prediction: { direction: "Above creator baseline" },
    status: "published",
  };
}

export function getRecommended(state: CreatorState): any {
  return state.opportunities.find((opportunity) => opportunity.status === "recommended") ?? state.opportunities[0];
}

stateInitializer(initialState);

function stateInitializer(state: CreatorState): void {
  state.pulse.recommended = state.opportunities[0];
  state.pulse.recentActivity = state.activity.slice(0, 4);
}