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

export const initialState: CreatorState = {
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
        topic: "Developer workflows",
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
      {
        id: "video-38",
        title: "Multi-agent systems with LangGraph and CrewAI",
        topic: "AI agents",
        format: "Deep dive",
        views: 76400,
        engagementRate: 7.2,
        publishedAt: "2026-07-18",
        duration: "22:15",
        hook: "When should you actually use multi-agent instead of one smart model?",
      },
      {
        id: "video-37",
        title: "Hybrid search explained: BM25 meets dense vector embeddings",
        topic: "RAG systems",
        format: "Deep dive",
        views: 52100,
        engagementRate: 5.6,
        publishedAt: "2026-07-09",
        duration: "16:40",
        hook: "Vector search alone misses keyword exact matches every single time.",
      },
      {
        id: "video-36",
        title: "Supercharge your terminal with custom AI CLI tools",
        topic: "Developer workflows",
        format: "Practical tutorial",
        views: 58900,
        engagementRate: 6.4,
        publishedAt: "2026-06-29",
        duration: "13:50",
        hook: "I replaced 12 bash scripts with a single AI CLI in Rust.",
      },
      {
        id: "video-35",
        title: "Autonomous coding loops: Claude 3.5 Sonnet vs GPT-4o",
        topic: "AI agents",
        format: "Case study",
        views: 91400,
        engagementRate: 8.1,
        publishedAt: "2026-06-18",
        duration: "19:05",
        hook: "We gave both models 10 failing unit tests and walked away.",
      },
      {
        id: "video-34",
        title: "Chunking strategies that actually improve retrieval accuracy",
        topic: "RAG systems",
        format: "Practical tutorial",
        views: 44300,
        engagementRate: 4.8,
        publishedAt: "2026-06-08",
        duration: "15:22",
        hook: "Fixed-size chunking is silently ruining your RAG accuracy.",
      },
      {
        id: "video-33",
        title: "Automated PR reviews using GitHub Actions and Gemini",
        topic: "Developer workflows",
        format: "Practical tutorial",
        views: 63200,
        engagementRate: 6.7,
        publishedAt: "2026-05-28",
        duration: "17:14",
        hook: "Catching architectural anti-patterns before human reviewers even see the PR.",
      },
      {
        id: "video-32",
        title: "Building a self-healing web scraper with browser agents",
        topic: "AI agents",
        format: "Practical tutorial",
        views: 69800,
        engagementRate: 7.0,
        publishedAt: "2026-05-17",
        duration: "21:30",
        hook: "Websites change their CSS selectors constantly. Here is how agents adapt.",
      },
      {
        id: "video-31",
        title: "Pydantic V2: the must-know features for API design",
        topic: "Python tutorials",
        format: "Deep dive",
        views: 31200,
        engagementRate: 4.1,
        publishedAt: "2026-05-06",
        duration: "14:48",
        hook: "The Rust rewrite changed more than just performance.",
      },
      {
        id: "video-30",
        title: "Reranking models in production: Cohere vs open source",
        topic: "RAG systems",
        format: "System design",
        views: 41800,
        engagementRate: 5.0,
        publishedAt: "2026-04-24",
        duration: "18:02",
        hook: "Rerankers give you 80% of fine-tuning gains for 5% of the effort.",
      },
      {
        id: "video-29",
        title: "Local LLM agents using Ollama and Function Calling",
        topic: "AI agents",
        format: "Practical tutorial",
        views: 78500,
        engagementRate: 7.5,
        publishedAt: "2026-04-14",
        duration: "24:10",
        hook: "Running tool-calling agents completely air-gapped on your laptop.",
      },
      {
        id: "video-28",
        title: "How I automated 80% of my documentation writing",
        topic: "Developer workflows",
        format: "Listicle",
        views: 49700,
        engagementRate: 5.3,
        publishedAt: "2026-04-03",
        duration: "12:18",
        hook: "Nobody likes writing docs. Here is the pipeline that does it for you.",
      },
      {
        id: "video-27",
        title: "Asyncio in Python: avoid the 5 most common event loop deadlocks",
        topic: "Python tutorials",
        format: "Deep dive",
        views: 28400,
        engagementRate: 3.8,
        publishedAt: "2026-03-22",
        duration: "16:35",
        hook: "Why mixing blocking synchronous libraries inside async def freezes your server.",
      },
      {
        id: "video-26",
        title: "GraphRAG: when vector databases are not enough",
        topic: "RAG systems",
        format: "System design",
        views: 57400,
        engagementRate: 6.2,
        publishedAt: "2026-03-11",
        duration: "23:45",
        hook: "Vectors cannot connect the dots across global thematic relationships.",
      },
      {
        id: "video-25",
        title: "Why most autonomous agents get stuck in infinite loops",
        topic: "AI agents",
        format: "Case study",
        views: 88300,
        engagementRate: 7.9,
        publishedAt: "2026-02-28",
        duration: "15:52",
        hook: "Without deterministic cycle breakers, agent reasoning drifts into recursion.",
      },
      {
        id: "video-24",
        title: "Docker for AI developers: containerizing vector databases",
        topic: "Developer workflows",
        format: "Practical tutorial",
        views: 42600,
        engagementRate: 4.9,
        publishedAt: "2026-02-17",
        duration: "19:20",
        hook: "Setting up local Qdrant, Chroma, and Postgres pgvector with one docker compose.",
      },
      {
        id: "video-23",
        title: "Evaluating RAG pipelines with Ragas and TruLens",
        topic: "RAG systems",
        format: "Deep dive",
        views: 38900,
        engagementRate: 4.6,
        publishedAt: "2026-02-05",
        duration: "20:12",
        hook: "How to measure faithfulness and answer relevancy numerically.",
      },
      {
        id: "video-22",
        title: "FastAPI in production: connection pooling and worker tuning",
        topic: "Python tutorials",
        format: "System design",
        views: 34500,
        engagementRate: 4.2,
        publishedAt: "2026-01-24",
        duration: "17:40",
        hook: "Default Uvicorn settings will choke under 500 concurrent requests.",
      },
      {
        id: "video-21",
        title: "Structured JSON outputs for agentic workflows",
        topic: "AI agents",
        format: "Practical tutorial",
        views: 74100,
        engagementRate: 7.1,
        publishedAt: "2026-01-13",
        duration: "13:45",
        hook: "Stop parsing regex from raw markdown. Use strict schema enforcement.",
      },
      {
        id: "video-20",
        title: "Git worktrees: the parallel feature branch secret",
        topic: "Developer workflows",
        format: "Practical tutorial",
        views: 55300,
        engagementRate: 6.0,
        publishedAt: "2026-01-02",
        duration: "11:55",
        hook: "Never stash dirty uncommitted changes to fix a hotfix ever again.",
      },
      {
        id: "video-19",
        title: "Handling table and PDF ingestion without losing context",
        topic: "RAG systems",
        format: "Practical tutorial",
        views: 46700,
        engagementRate: 5.2,
        publishedAt: "2025-12-20",
        duration: "22:04",
        hook: "Standard text splitters tear markdown tables into illegible fragments.",
      },
      {
        id: "video-18",
        title: "Building an AI customer support triage agent from scratch",
        topic: "AI agents",
        format: "Case study",
        views: 66200,
        engagementRate: 6.5,
        publishedAt: "2025-12-09",
        duration: "26:30",
        hook: "From Zendesk webhook to automatic classification and drafted replies.",
      },
      {
        id: "video-17",
        title: "VS Code shortcuts that top 1% software engineers use",
        topic: "Developer workflows",
        format: "Listicle",
        views: 61800,
        engagementRate: 6.3,
        publishedAt: "2025-11-28",
        duration: "10:15",
        hook: "10 keybindings that keep your hands off the mouse all day.",
      },
      {
        id: "video-16",
        title: "Stop writing messy decorators: clean Python patterns",
        topic: "Python tutorials",
        format: "Practical tutorial",
        views: 29800,
        engagementRate: 3.9,
        publishedAt: "2025-11-16",
        duration: "15:20",
        hook: "Preserve function signatures and docstrings with functools wraps.",
      },
      {
        id: "video-15",
        title: "Multimodal RAG: searching images and documents together",
        topic: "RAG systems",
        format: "Deep dive",
        views: 49500,
        engagementRate: 5.4,
        publishedAt: "2025-11-04",
        duration: "21:18",
        hook: "Embedding architectural blueprints and schematics alongside text.",
      },
      {
        id: "video-14",
        title: "Human-in-the-loop agent patterns that prevent disaster",
        topic: "AI agents",
        format: "System design",
        views: 82700,
        engagementRate: 7.7,
        publishedAt: "2025-10-23",
        duration: "18:42",
        hook: "Giving your agent write permissions requires an explicit checkpoint protocol.",
      },
      {
        id: "video-13",
        title: "Cursor IDE mastery: real-world refactoring speedrun",
        topic: "Developer workflows",
        format: "Practical tutorial",
        views: 67400,
        engagementRate: 6.8,
        publishedAt: "2025-10-11",
        duration: "16:25",
        hook: "How Composer and codebase indexing turn 2-hour refactors into 5 minutes.",
      },
      {
        id: "video-12",
        title: "Caching embeddings to reduce vector search latency by 90%",
        topic: "RAG systems",
        format: "System design",
        views: 39200,
        engagementRate: 4.7,
        publishedAt: "2025-09-29",
        duration: "14:10",
        hook: "Why recompute embeddings for identical query stems every request?",
      },
      {
        id: "video-11",
        title: "Python memory profiling: tracking down memory leaks in workers",
        topic: "Python tutorials",
        format: "Deep dive",
        views: 26500,
        engagementRate: 3.5,
        publishedAt: "2025-09-17",
        duration: "19:08",
        hook: "Finding circular object references with objgraph and tracemalloc.",
      },
      {
        id: "video-10",
        title: "Stateful agent architecture with Redis and SQLite",
        topic: "AI agents",
        format: "Deep dive",
        views: 75200,
        engagementRate: 7.3,
        publishedAt: "2025-09-05",
        duration: "25:14",
        hook: "How to survive server restarts mid-reasoning without losing thread state.",
      },
      {
        id: "video-09",
        title: "CI/CD pipelines for LLM apps: automated regression testing",
        topic: "Developer workflows",
        format: "System design",
        views: 47900,
        engagementRate: 5.1,
        publishedAt: "2025-08-23",
        duration: "20:50",
        hook: "Catch prompt degradation before it deploys to paying users.",
      },
      {
        id: "video-08",
        title: "Context window compression strategies for long-running agents",
        topic: "AI agents",
        format: "Deep dive",
        views: 86100,
        engagementRate: 7.9,
        publishedAt: "2025-08-10",
        duration: "17:35",
        hook: "Summarization, memory trees, and sliding windows compared.",
      },
      {
        id: "video-07",
        title: "Poetry vs UV: package management in 2026",
        topic: "Python tutorials",
        format: "Practical tutorial",
        views: 33100,
        engagementRate: 4.0,
        publishedAt: "2025-07-28",
        duration: "12:44",
        hook: "Why 10-second resolver times should be 50 milliseconds.",
      },
      {
        id: "video-06",
        title: "Makefile mastery for modern TypeScript and Python stacks",
        topic: "Developer workflows",
        format: "Listicle",
        views: 38700,
        engagementRate: 4.5,
        publishedAt: "2025-07-15",
        duration: "11:12",
        hook: "One command to build, lint, test, and deploy every microservice.",
      },
      {
        id: "video-05",
        title: "OpenAI Swarm vs AutoGen: Which agent framework wins?",
        topic: "AI agents",
        format: "Case study",
        views: 79800,
        engagementRate: 7.4,
        publishedAt: "2025-07-02",
        duration: "23:18",
        hook: "Comparing handoff mechanics, state ergonomics, and debugging tools.",
      },
      {
        id: "video-04",
        title: "Managing API secrets securely in production developer teams",
        topic: "Developer workflows",
        format: "Practical tutorial",
        views: 45200,
        engagementRate: 5.0,
        publishedAt: "2025-06-19",
        duration: "15:05",
        hook: "Stop putting plain text .env files in developer Slack channels.",
      },
      {
        id: "video-03",
        title: "From script to CLI tool in 10 minutes with Typer and Go",
        topic: "Developer workflows",
        format: "Practical tutorial",
        views: 41600,
        engagementRate: 4.8,
        publishedAt: "2025-06-06",
        duration: "13:30",
        hook: "Turn ad-hoc developer scripts into company-wide command-line utilities.",
      },
      {
        id: "video-02",
        title: "Agent evaluation: testing non-deterministic LLM pipelines",
        topic: "AI agents",
        format: "Deep dive",
        views: 73900,
        engagementRate: 7.1,
        publishedAt: "2025-05-22",
        duration: "21:40",
        hook: "Unit tests fail when outputs change slightly. Here is how to test behavior.",
      },
      {
        id: "video-01",
        title: "The modern AI developer roadmap",
        topic: "Developer workflows",
        format: "Essay",
        views: 89400,
        engagementRate: 8.2,
        publishedAt: "2025-05-10",
        duration: "18:55",
        hook: "What to learn first: models, prompts, vectors, or software architecture?",
      },
    ],
  },
  opportunities: [
    {
      id: "opp-production-agents",
      title: "Why AI agents work in a demo but fail in production",
      topic: "AI agents",
      format: "Practical tutorial",
      score: 83,
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
        formulaString: "Score = (0.35 × 96) + (0.30 × 94) + (0.25 × 88) - (0.10 × 12) = 83",
        topicBenchmarkRatio: "1.96× baseline views",
        confidenceRationale: "High confidence: 2 previous topic uploads exceeded 70K views within 7 days",
      },
    },
    {
      id: "opp-agent-memory",
      title: "The missing memory layer behind reliable AI agents",
      topic: "AI agents",
      format: "Deep dive",
      score: 76,
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
        formulaString: "Score = (0.35 × 91) + (0.30 × 88) + (0.25 × 79) - (0.10 × 24) = 76",
        topicBenchmarkRatio: "1.72× baseline views",
        confidenceRationale: "Medium confidence: technically demanding topic with high upside retention",
      },
    },
    {
      id: "opp-workflow-shortcuts",
      title: "7 developer workflow shortcuts that compound with AI",
      topic: "Developer workflows",
      format: "Listicle",
      score: 68,
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
        formulaString: "Score = (0.35 × 84) + (0.30 × 82) + (0.25 × 68) - (0.10 × 31) = 68",
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
      topic: catalogVideo.topic,
      prediction: { direction: "Above creator baseline" },
      status: "published",
    };
  }
  return {
    id,
    title: id === "video-41" ? "The MCP architecture I wish I had started with" : "AI Agent Architecture Deep Dive",
    topic: id === "video-41" ? "Developer workflows" : "AI agents",
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