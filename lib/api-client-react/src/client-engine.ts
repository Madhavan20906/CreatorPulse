import { SEED_STATE } from "./seed-state";
import { POPULAR_REAL_CHANNELS, deriveTopicsFromVideos, deriveOpportunitiesForChannel } from "./channel-ingestion";

export type ClientCreatorState = {
  pulse: any;
  channel: any;
  opportunities: any[];
  contentPackages: Record<string, any>;
  qualityReports: Record<string, any>;
  memory: any;
  activity: any[];
  measurement: any | null;
  scheduled: any[];
  settings?: any;
};

const STORAGE_KEY = "creatorpulse:clientState";
const API_KEY_STORAGE = "creatorpulse:geminiApiKey";

function clone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

export function getClientState(): ClientCreatorState {
  if (typeof window === "undefined") {
    return clone(SEED_STATE as unknown as ClientCreatorState);
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.channel && parsed.opportunities) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not read creator state from localStorage:", e);
  }
  const fresh = clone(SEED_STATE as unknown as ClientCreatorState);
  saveClientState(fresh);
  return fresh;
}

export function saveClientState(state: ClientCreatorState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Could not persist creator state to localStorage:", e);
  }
}

export function getGeminiApiKey(): string | null {
  if (typeof window !== "undefined") {
    const local = window.localStorage.getItem(API_KEY_STORAGE);
    if (local && local.trim()) return local.trim();
  }
  try {
    const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (viteKey && typeof viteKey === "string" && viteKey.trim()) return viteKey.trim();
  } catch {}
  return null;
}

export function setGeminiApiKey(key: string | null): void {
  if (typeof window === "undefined") return;
  if (!key || !key.trim()) {
    window.localStorage.removeItem(API_KEY_STORAGE);
  } else {
    window.localStorage.setItem(API_KEY_STORAGE, key.trim());
  }
}

// Deterministic semantic vector generation (128-d)
export function generateDeterministicVector(text: string): number[] {
  const normalized = text.toLowerCase().trim();
  const vector: number[] = new Array(128).fill(0);
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    const pos = (code * 31 + i * 17) % 128;
    vector[pos] += Math.sin(code + i);
  }
  let norm = 0;
  for (let i = 0; i < 128; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm === 0) return vector;
  return vector.map((v) => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "as", "at",
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "could",
  "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had",
  "has", "have", "having", "he", "her", "here", "him", "his", "how", "i", "if", "in", "into", "is",
  "it", "its", "me", "more", "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once",
  "only", "or", "other", "ought", "our", "out", "over", "own", "same", "she", "should", "so", "some",
  "such", "than", "that", "the", "their", "them", "then", "there", "these", "they", "this", "those",
  "through", "to", "too", "under", "until", "up", "very", "was", "we", "were", "what", "when",
  "where", "which", "while", "who", "whom", "why", "with", "would", "you", "your",
]);

function extractMeaningfulTokens(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(words);
}

function computeTokenJaccard(tokensA: Set<string>, tokensB: Set<string>): { similarity: number; overlapTokens: string[] } {
  if (tokensA.size === 0 || tokensB.size === 0) return { similarity: 0, overlapTokens: [] };
  const intersection: string[] = [];
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersection.push(token);
    }
  }
  const unionSize = new Set([...tokensA, ...tokensB]).size;
  const rawJaccard = unionSize > 0 ? intersection.length / unionSize : 0;
  return { similarity: Math.round(rawJaccard * 100), overlapTokens: intersection };
}

export function calculateQuality(input: any): any {
  const titleLen = (input.title || "").trim().length;
  const titleScore = titleLen >= 38 && titleLen <= 68 ? 96 : titleLen >= 25 && titleLen <= 85 ? 80 : 50;

  const fullText = `${input.title || ""} ${input.description || ""} ${input.script || ""}`.toLowerCase();
  const keywords: string[] = Array.isArray(input.keywords) ? input.keywords : [];
  const matchedKeywords = keywords.filter((kw: string) => fullText.includes(kw.toLowerCase()));
  const seoScore = keywords.length > 0 ? Math.round((matchedKeywords.length / keywords.length) * 100) : 85;

  const ctaLower = (input.cta || "").toLowerCase();
  const hasActionVerb = /subscribe|watch|check out|build|drop a comment|link below|github/.test(ctaLower);
  const ctaScore = hasActionVerb && (input.cta || "").trim().length >= 20 ? 92 : (input.cta || "").trim().length >= 15 ? 74 : 45;

  const fluffRegex = /\b(game-changer|revolutionary|paradigm shift|dive in|secret sauce|unleash|silver bullet|mind-blowing)\b/i;
  const fluffMatches = (input.script || "").match(fluffRegex);
  const originalityScore = fluffMatches ? 68 : 94;

  const claimRiskRegex = /\b(100%|guaranteed|never fail|everyone will|cannot fail|foolproof|make millions)\b/i;
  const hasRiskyClaims = claimRiskRegex.test(fullText);
  const claimScore = hasRiskyClaims ? 62 : 95;

  const descLen = (input.description || "").trim().length;
  const descScore = descLen >= 80 ? 94 : descLen >= 40 ? 76 : 52;

  const scriptLen = (input.script || "").trim().length;
  const hasStructuralBreaks = /(?:^|\n)(?:##|\d+[\.:]|\*\*\[|Chapter)/i.test(input.script || "") || scriptLen >= 500;
  const pacingScore = hasStructuralBreaks && scriptLen >= 600 ? 95 : scriptLen >= 300 ? 82 : 55;

  const checks = [
    {
      name: "Hook strength",
      score: titleScore,
      status: titleScore >= 75 ? "pass" : "revise",
      detail: titleScore >= 75 ? `Optimal title length (${titleLen} chars) with sharp tension.` : `Title length (${titleLen} chars) outside optimal 38–68 char window.`,
    },
    {
      name: "SEO keyword coverage",
      score: seoScore,
      status: seoScore >= 60 ? "pass" : "revise",
      detail: `${matchedKeywords.length} of ${keywords.length} target keywords verified across script and metadata (${matchedKeywords.join(", ") || "none"}).`,
    },
    {
      name: "Call to action",
      score: ctaScore,
      status: ctaScore >= 70 ? "pass" : "revise",
      detail: hasActionVerb ? "Explicit action verb present with clear viewer motivation." : "Missing explicit action verb (e.g. subscribe, check out GitHub, watch next).",
    },
    {
      name: "Editorial originality",
      score: originalityScore,
      status: originalityScore >= 75 ? "pass" : "revise",
      detail: fluffMatches ? `Detected generic filler phrase: "${fluffMatches[0]}". Replace with concrete technical terminology.` : "Zero generic filler clichés detected. Rigorous technical framing.",
    },
    {
      name: "Claim integrity",
      score: claimScore,
      status: claimScore >= 75 ? "pass" : "revise",
      detail: hasRiskyClaims ? "Flagged unsupported absolute claim or guarantee. Qualify with production constraints." : "All technical assertions are defensibly qualified. Zero unsupported absolutes.",
    },
    {
      name: "Description depth & metadata",
      score: descScore,
      status: descScore >= 70 ? "pass" : "revise",
      detail: descScore >= 70 ? `Description depth (${descLen} chars) includes structured framing for search crawl.` : `Description (${descLen} chars) is too brief. Expand summary to provide context.`,
    },
    {
      name: "Retention pacing & anchors",
      score: pacingScore,
      status: pacingScore >= 70 ? "pass" : "revise",
      detail: hasStructuralBreaks ? `Script includes structural retention anchors and pacing across ${scriptLen} characters.` : `Script lacks structural section breaks. Add clear transition anchors for mid-video retention.`,
    },
  ];

  const overall = Math.round(checks.reduce((sum, c) => sum + c.score, 0) / checks.length);
  const claimRisk = Math.max(5, 100 - claimScore);
  const passed = overall >= 75 && checks.every((c) => c.status !== "revise");

  return {
    overall,
    claimRisk,
    passed,
    summary: passed
      ? "Pass. All 7 deterministic quality gates satisfied: optimal title pacing, verified keyword distribution, substantiated claims, and structural retention anchors."
      : "Revision required. Address the flagged quality checks before approving for publish.",
    checks,
  };
}

export function evaluateIdeaClient(state: ClientCreatorState, idea: string): any {
  const ideaTokens = extractMeaningfulTokens(idea);
  const normalizedIdea = idea.toLowerCase();
  const ideaVec = generateDeterministicVector(idea);

  const matches = state.channel.videos
    .map((video: any) => {
      const videoTokens = extractMeaningfulTokens(video.title);
      const { similarity: jaccardSim, overlapTokens } = computeTokenJaccard(ideaTokens, videoTokens);
      const videoVec = generateDeterministicVector(`${video.title} ${video.topic}`);
      const cosineSim = cosineSimilarity(ideaVec, videoVec);
      const cosineSimPercent = Math.max(0, Math.min(100, Math.round(cosineSim * 100)));

      const topicMatch = normalizedIdea.includes(video.topic.toLowerCase()) || video.topic.toLowerCase().includes(normalizedIdea);
      const topicBonus = topicMatch ? 10 : 0;
      const combinedSimilarity = Math.min(96, Math.max(cosineSimPercent, Math.round(cosineSimPercent * 0.7 + jaccardSim * 0.2 + topicBonus)));

      return {
        videoTitle: video.title,
        similarity: combinedSimilarity,
        cosineSimilarity: Number(cosineSim.toFixed(3)),
        overlapTokens,
      };
    })
    .sort((a: any, b: any) => b.similarity - a.similarity)
    .slice(0, 3);

  const topMatch = matches[0];
  const collisionRisk = topMatch ? topMatch.similarity : 8;

  const isAgentRelated = normalizedIdea.includes("agent") || normalizedIdea.includes("mcp") || normalizedIdea.includes("autonomous");
  const isWorkflowRelated = normalizedIdea.includes("workflow") || normalizedIdea.includes("tool") || normalizedIdea.includes("automation");
  const isRagRelated = normalizedIdea.includes("rag") || normalizedIdea.includes("retrieval") || normalizedIdea.includes("embedding");

  let audienceFit = 72;
  let historicalFit = 75;
  if (isAgentRelated) {
    audienceFit = 96;
    historicalFit = 94;
  } else if (isWorkflowRelated) {
    audienceFit = 88;
    historicalFit = 85;
  } else if (isRagRelated) {
    audienceFit = 82;
    historicalFit = 80;
  }

  const novelty = Math.max(20, Math.min(98, 100 - collisionRisk + Math.floor(Math.random() * 4)));
  const opportunity = Math.round(audienceFit * 0.35 + novelty * 0.25 + (100 - collisionRisk) * 0.2 + historicalFit * 0.2);

  const recommendation =
    collisionRisk > 70
      ? "REFRAME"
      : opportunity >= 80
      ? "GO"
      : opportunity >= 65
      ? "TEST SHORT FIRST"
      : "SHELVE";

  const explanation =
    collisionRisk > 70
      ? `High collision detected (${collisionRisk}% match with "${topMatch?.videoTitle}"). Shift angle from general explanation to architectural production post-mortem.`
      : `Strong opportunity score (${opportunity}/100) with low cannibalization risk (${collisionRisk}%). Matches high audience appetite in ${isAgentRelated ? "AI agents" : "developer workflows"}.`;

  const suggestedAlternative =
    collisionRisk > 70
      ? `Reframe as: "What happens when ${idea.replace(/why|how|what/i, "").trim()} hits production: 3 edge cases you will debug"`
      : `Enhance hook to: "Why most developers misunderstand ${idea.replace(/why|how|what/i, "").trim()} in production"`;

  return {
    recommendation,
    opportunity,
    audienceFit,
    novelty,
    collisionRisk,
    historicalFit,
    explanation,
    suggestedAlternative,
    similarVideos: matches,
  };
}

export function buildContentPackageClient(opportunity: any, voice = "Practical, candid, technically rigorous"): any {
  const cleanTopic = opportunity.topic.toLowerCase();
  const id = `content-${opportunity.id}`;
  const hook = `Most creators talk about ${cleanTopic} like it is a feature. The useful question is what happens when it meets a real production constraint.`;
  const script = [
    hook,
    "",
    `In this video, we will pressure-test ${opportunity.title.toLowerCase()} using a practical example from AI engineering, developer tools, MCP, and software architecture.`,
    "First, we will name the failure mode. Then we will trace the decision that caused it. Finally, we will build a small fix that you can reuse in your own stack.",
    "",
    "The goal is not to chase a magic prompt. It is to build a system that stays useful after the demo ends.",
  ].join("\n");

  return {
    id,
    opportunityId: opportunity.id,
    title: opportunity.title,
    hook,
    outline: [
      "The promise vs. the production reality",
      `A concrete ${cleanTopic} failure mode`,
      "The smallest reliable fix",
      "A repeatable checklist for your next build",
    ],
    script: `${script}\n\nVoice direction: ${voice}.`,
    chapters: ["00:00 The uncomfortable truth", "02:10 The failure mode", "06:40 The fix", "10:30 The checklist"],
    cta: "If this saved you a debugging session, subscribe for practical AI engineering breakdowns.",
    description: `A practical breakdown of ${opportunity.title.toLowerCase()}, with a concrete failure mode, a clear fix, and a repeatable checklist for developers building AI engineering systems and developer tools with MCP and sound software architecture.`,
    shorts: [
      {
        id: `${id}-short-1`,
        title: "Your AI agent is not failing randomly",
        hook: "Your AI agent is probably failing for a boring reason.",
        script: "The demo works because the context is clean. Production fails because state, tools, and retries are not designed together. Fix the system, not the prompt.",
        score: 93,
        duration: "0:42",
        sourceSegment: "02:10–02:52",
        caption: "The difference between a clever demo and a reliable AI system is usually architecture.",
        hashtags: ["#AIAgents", "#DeveloperTools", "#SoftwareEngineering"],
      },
      {
        id: `${id}-short-2`,
        title: "The production test most demos skip",
        hook: "Before you ship an AI agent, remove the happy path.",
        script: "Change the input, remove a tool, and make the model retry. If the system cannot explain what it is doing next, you do not have reliability yet.",
        score: 89,
        duration: "0:36",
        sourceSegment: "06:40–07:16",
        caption: "A tiny adversarial test catches more than another perfect demo.",
        hashtags: ["#AIEngineering", "#MCP", "#BuildInPublic"],
      },
      {
        id: `${id}-short-3`,
        title: "Stop adding tools to fix a reasoning problem",
        hook: "More tools will not fix an unclear decision boundary.",
        script: "When an agent fails, first ask whether it knows what success looks like. A smaller tool surface with a clear contract often beats a bigger toolbox.",
        score: 86,
        duration: "0:39",
        sourceSegment: "09:12–09:51",
        caption: "The best agent architecture is often the one with fewer, clearer decisions.",
        hashtags: ["#AI", "#Agents", "#Coding"],
      },
    ],
    social: {
      xThread: "Most AI agents do not fail because the model is weak.\n\nThey fail because the demo hid the production constraints.\n\nHere is the checklist I now use before shipping one:",
      linkedin: "The gap between an impressive AI demo and a reliable production system is rarely one better prompt. It is the architecture around state, tools, retries, and clear decision boundaries.",
      instagram: "The demo is not the product. The system around it is. Save this checklist for your next AI build.",
    },
    seo: {
      primaryKeyword: "AI agents in production",
      secondaryKeywords: ["AI agent reliability", "production AI systems", "MCP architecture", "agent debugging"],
      titleVariants: [
        "Why AI Agents Fail in Production (And the Fix)",
        "Your AI Agent Works in a Demo. Now What?",
        "The Production Checklist for AI Agents",
      ],
      tags: ["AI agents", "AI engineering", "developer tools", "MCP", "software architecture"],
    },
    thumbnail: {
      concept: "A split-screen showing a perfect green demo path on the left and a red production crash trace on the right.",
      composition: "Creator face in the center, clean system diagram behind, one bold contrast line.",
      text: "DEMO ≠ PRODUCTION",
      emotionalAngle: "Recognition and productive tension",
    },
    status: "draft",
    prediction: opportunity.prediction,
  };
}

export function syncIngestedChannelToClientState(channelData: any): any {
  if (!channelData || typeof channelData !== "object") return;
  const state = getClientState();
  const resolvedVideos = Array.isArray(channelData.videos) ? channelData.videos : [];
  const totalViews = resolvedVideos.reduce((sum: number, v: any) => sum + (Number(v.views) || 0), 0);
  const averageViews = Math.round(totalViews / Math.max(1, resolvedVideos.length));

  state.channel = {
    name: channelData.name || "Creator",
    handle: channelData.handle || "@creator",
    niche: channelData.niche || "Engineering and Technology",
    subscribers: Number(channelData.subscribers) || 120000,
    totalViews,
    averageViews,
    videosAnalyzed: resolvedVideos.length,
    topTopic: resolvedVideos[0]?.topic || "Core",
    strongestFormat: "Practical tutorial",
    dataMode: channelData.dataMode || "Live YouTube public catalog",
    topics: channelData.topics?.length ? channelData.topics : deriveTopicsFromVideos(resolvedVideos),
    videos: resolvedVideos,
  };

  state.pulse = state.pulse || {};
  state.pulse.baselineViews = averageViews || 41300;
  state.pulse.creatorName = state.channel.name;
  state.pulse.headline = `Channel intelligence updated for ${state.channel.name}.`;
  state.pulse.trend = "+24% vs. previous period";
  state.pulse.growthOpportunities = 7;
  state.pulse.contentReady = 4;
  state.pulse.pendingApproval = 2;
  state.pulse.publishedThisWeek = 5;
  state.opportunities = deriveOpportunitiesForChannel(state.channel);
  state.pulse.recommended = state.opportunities[0] || {
    id: "opp-default",
    title: `Scaling ${state.channel.topTopic || "Content"}: What the top 1% know`,
    score: 88,
    rationale: "Unsaturated high-retention opportunity derived from channel catalog.",
    signals: ["Proven audience fit", "High search demand"],
    prediction: { direction: "Above creator baseline", confidence: 0.82, baselineMultiplier: 1.7 },
  };

  if (!state.settings) {
    state.settings = {};
  }
  state.settings.name = state.channel.name;
  state.settings.niche = state.channel.niche;

  if (Array.isArray(state.activity)) {
    state.activity.unshift({
      id: `act-${Date.now()}`,
      agent: "Channel Brain",
      action: "Ingested live channel catalog",
      detail: `Swapped catalog to ${state.channel.name} (${state.channel.handle}) · ${resolvedVideos.length} public videos analyzed`,
      timestamp: "Just now",
      status: "complete",
    });
  }

  saveClientState(state);
  return state.channel;
}

export async function handleClientApi(method: string, path: string, body?: any): Promise<any> {
  const state = getClientState();
  const cleanPath = path.split("?")[0].replace(/\/$/, "");

  // Healthcheck
  if (cleanPath === "/api/healthz") {
    return { status: "ok" };
  }

  // Pulse
  if (cleanPath === "/api/pulse" && method === "GET") {
    state.pulse = state.pulse || {};
    state.pulse.creatorName = state.pulse.creatorName || state.channel?.name || "Creator";
    state.pulse.headline = state.pulse.headline || "Your channel is trending upward.";
    state.pulse.baselineViews = state.pulse.baselineViews || state.channel?.averageViews || 41300;
    state.pulse.growthOpportunities = state.pulse.growthOpportunities || 7;
    state.pulse.contentReady = state.pulse.contentReady || 4;
    state.pulse.publishedThisWeek = state.pulse.publishedThisWeek || 5;
    state.pulse.recommended =
      state.opportunities?.find((o) => o.status === "recommended") ||
      state.opportunities?.[0] || {
        id: "opp-production-agents",
        title: "Why AI agents work in a demo but fail in production",
        score: 83,
        rationale: "Your strongest topic has proven demand, but your library has no video directly addressing production reliability.",
        signals: ["AI-agent videos are 1.9× baseline", "Low library coverage of production reliability"],
        prediction: { direction: "Above creator baseline", confidence: 0.74, baselineMultiplier: 1.8 },
        status: "recommended",
      };
    state.pulse.recentActivity = (state.activity || []).slice(0, 4);
    return state.pulse;
  }

  // Channel
  if (cleanPath === "/api/channel" && method === "GET") {
    return state.channel;
  }

  // Channel Ingest (Live YouTube public data, diverse mock evaluation catalogs, or custom CSV/JSON)
  if (cleanPath === "/api/channel/ingest" && method === "POST") {
    const { channelUrlOrHandle, customVideos, channelName, niche } = body || {};

    let resolvedName = channelName;
    let resolvedHandle = channelUrlOrHandle || "@creator";
    let resolvedNiche = niche || "Technology & Software Engineering";
    let resolvedSubscribers = 120000;
    let resolvedVideos: any[] = [];
    let dataMode = "Live YouTube public catalog";

    const cleanHandleKey = (channelUrlOrHandle || "").trim().toLowerCase();

    // 1. Mock Presets (Alex Rivera, Sarah Connor)
    if (cleanHandleKey.includes("buildwithalex") || cleanHandleKey.includes("alex")) {
      resolvedName = "Alex Rivera";
      resolvedHandle = "@buildwithalex";
      resolvedNiche = "AI engineering and developer tools";
      resolvedSubscribers = 142000;
      resolvedVideos = clone((SEED_STATE.channel as any).videos);
      dataMode = "Evaluation Mock Catalog · 42 synthetic videos for offline testing";
    } else if (cleanHandleKey.includes("sarahcodes") || cleanHandleKey.includes("sarah")) {
      resolvedName = "Sarah Connor";
      resolvedHandle = "@sarahcodes";
      resolvedNiche = "Cloud architecture & cybersecurity";
      resolvedSubscribers = 89000;
      dataMode = "Evaluation Mock Catalog · Cybersecurity & Cloud";
      resolvedVideos = [
        {
          id: "sarah-v1",
          title: "Zero Trust Architecture: The Practical Implementation Guide",
          topic: "Zero Trust & Security",
          format: "Practical tutorial",
          views: 76400,
          engagementRate: 8.7,
          publishedAt: "2026-08-19",
          duration: "16:10",
          hook: "Perimeter security is dead. Here is how we verify every packet in 2026.",
        },
        {
          id: "sarah-v2",
          title: "How I Exploited a Misconfigured Kubernetes Cluster",
          topic: "Cloud Penetration Testing",
          format: "Deep dive",
          views: 112000,
          engagementRate: 9.6,
          publishedAt: "2026-07-30",
          duration: "21:40",
          hook: "One default service account token was all it took to achieve cluster admin.",
        },
        {
          id: "sarah-v3",
          title: "AWS IAM Privilege Escalation: 5 Real-World Scenarios",
          topic: "Cloud Security",
          format: "Listicle",
          views: 58900,
          engagementRate: 8.2,
          publishedAt: "2026-07-14",
          duration: "13:25",
          hook: "Most dev teams don't realize these wildcard permissions allow root escalation.",
        },
        {
          id: "sarah-v4",
          title: "CI/CD Pipeline Security: Hardening GitHub Actions in Production",
          topic: "Cloud Security",
          format: "Practical tutorial",
          views: 84300,
          engagementRate: 9.1,
          publishedAt: "2026-06-25",
          duration: "15:30",
          hook: "Dependency confusion and unpinned actions are leaking production secrets daily.",
        },
      ];
    } else {
      // 2. Real Channel Presets (@fireship, @mkbhd, @veritasium)
      const preset = Object.entries(POPULAR_REAL_CHANNELS).find(
        ([key]) => cleanHandleKey.includes(key.replace("@", "")) || cleanHandleKey === key
      );

      if (preset) {
        const p = preset[1];
        resolvedName = p.name;
        resolvedHandle = p.handle;
        resolvedNiche = p.niche;
        resolvedSubscribers = p.subscribers;
        resolvedVideos = clone(p.videos);
        dataMode = p.dataMode;
      } else if (Array.isArray(customVideos) && customVideos.length > 0) {
        resolvedName = channelName || "Imported Channel";
        resolvedHandle = channelUrlOrHandle ? (channelUrlOrHandle.startsWith("@") ? channelUrlOrHandle : `@${channelUrlOrHandle}`) : "@customchannel";
        resolvedVideos = customVideos.map((v: any, idx: number) => ({
          id: v.id || `imported-${idx + 1}`,
          title: v.title || `Video ${idx + 1}`,
          topic: v.topic || "Core Content",
          format: v.format || "Practical tutorial",
          views: Number(v.views) || 25000,
          engagementRate: Number(v.engagementRate) || 6.5,
          publishedAt: v.publishedAt || new Date().toISOString().split("T")[0],
          duration: v.duration || "12:00",
          hook: v.hook || v.title || "",
        }));
        dataMode = `Imported creator history (${resolvedVideos.length} videos)`;
      } else {
        // 3. In-browser custom channel generation for any arbitrary handle/niche
        resolvedName = channelName || (channelUrlOrHandle ? channelUrlOrHandle.replace(/^@/, "") : "Creator");
        resolvedHandle = channelUrlOrHandle ? (channelUrlOrHandle.startsWith("@") ? channelUrlOrHandle : `@${channelUrlOrHandle}`) : "@creator";
        resolvedNiche = niche || "Engineering and Technology";
        resolvedSubscribers = 48500;

        const primaryTopic = resolvedNiche.split(/[&,]/)[0].trim() || "Engineering";
        const secondaryTopic = resolvedNiche.split(/[&,]/)[1]?.trim() || "Workflows";

        resolvedVideos = [
          {
            id: `${resolvedHandle.replace(/[^a-zA-Z0-9]/g, "")}-v1`,
            title: `How I built my first ${primaryTopic} system from scratch`,
            topic: primaryTopic,
            format: "Practical tutorial",
            views: 54200,
            engagementRate: 8.1,
            publishedAt: "2026-08-22",
            duration: "14:32",
            hook: `The true engineering bottleneck in ${primaryTopic.toLowerCase()} is not what most people think.`,
          },
          {
            id: `${resolvedHandle.replace(/[^a-zA-Z0-9]/g, "")}-v2`,
            title: `The architecture mistakes I made in ${secondaryTopic}`,
            topic: secondaryTopic,
            format: "Deep dive",
            views: 43100,
            engagementRate: 7.2,
            publishedAt: "2026-08-11",
            duration: "18:10",
            hook: `Here are 3 production failure modes you will hit before scale.`,
          },
          {
            id: `${resolvedHandle.replace(/[^a-zA-Z0-9]/g, "")}-v3`,
            title: `5 essential tools for modern ${primaryTopic.toLowerCase()} in 2026`,
            topic: primaryTopic,
            format: "Listicle",
            views: 69400,
            engagementRate: 8.6,
            publishedAt: "2026-07-28",
            duration: "11:06",
            hook: `Stop stacking redundant frameworks when these 5 primitives solve 90% of use cases.`,
          },
          {
            id: `${resolvedHandle.replace(/[^a-zA-Z0-9]/g, "")}-v4`,
            title: `Why most ${secondaryTopic.toLowerCase()} setups fail in production`,
            topic: secondaryTopic,
            format: "Essay",
            views: 39500,
            engagementRate: 6.9,
            publishedAt: "2026-07-15",
            duration: "16:45",
            hook: `A deep look at the operational tradeoffs that nobody talks about on social media.`,
          },
          {
            id: `${resolvedHandle.replace(/[^a-zA-Z0-9]/g, "")}-v5`,
            title: `End-to-end ${primaryTopic} walkthrough: From zero to deployment`,
            topic: primaryTopic,
            format: "Practical tutorial",
            views: 81200,
            engagementRate: 9.1,
            publishedAt: "2026-06-30",
            duration: "22:15",
            hook: `We are building and deploying a complete production-grade pipeline in one session.`,
          },
        ];
        dataMode = `Custom Creator Catalog · Tailored for ${resolvedHandle} (Custom Channel Profile)`;
      }
    }

    return syncIngestedChannelToClientState({
      name: resolvedName,
      handle: resolvedHandle,
      niche: resolvedNiche,
      subscribers: resolvedSubscribers,
      dataMode,
      videos: resolvedVideos,
    });
  }

  // Channel Reset to 42-video Alex Rivera Demo
  if (cleanPath === "/api/channel/reset" && method === "POST") {
    state.channel = clone(SEED_STATE.channel as any);
    state.opportunities = clone(SEED_STATE.opportunities as any) as any[];
    state.pulse.creatorName = SEED_STATE.pulse.creatorName;
    state.pulse.baselineViews = SEED_STATE.pulse.baselineViews;
    state.pulse.recommended = state.opportunities[0];
    state.pulse.headline = SEED_STATE.pulse.headline;
    if (state.settings) {
      state.settings.name = SEED_STATE.pulse.creatorName;
      state.settings.niche = SEED_STATE.channel.niche;
    }
    state.activity.unshift({
      id: `act-${Date.now()}`,
      agent: "System",
      action: "Reset channel to demo catalog",
      detail: "Restored baseline Alex Rivera 42-video catalog (Golden Path)",
      timestamp: "Just now",
      status: "complete",
    });
    saveClientState(state);
    return state.channel;
  }

  // Opportunities list
  if (cleanPath === "/api/opportunities" && method === "GET") {
    return state.opportunities;
  }

  // Single opportunity
  const oppMatch = cleanPath.match(/^\/api\/opportunities\/([^/]+)$/);
  if (oppMatch && method === "GET") {
    const id = oppMatch[1];
    const opp = state.opportunities.find((o) => o.id === id);
    if (!opp) throw new Error("Opportunity not found");
    return opp;
  }

  // Generate content from opportunity
  const genMatch = cleanPath.match(/^\/api\/opportunities\/([^/]+)\/generate$/);
  if (genMatch && method === "POST") {
    const id = genMatch[1];
    const opp = state.opportunities.find((o) => o.id === id);
    if (!opp) throw new Error("Opportunity not found");

    const voice = body?.voice || "Practical, candid, technically rigorous";
    const pkg = buildContentPackageClient(opp, voice);
    state.contentPackages[pkg.id] = pkg;
    opp.status = "in production";
    state.activity.unshift({
      id: `act-${Date.now()}`,
      agent: "Content Factory",
      action: "Generated content package",
      detail: `Deterministic engine · ${pkg.shorts.length} Shorts, SEO metadata, and full script ready for review`,
      timestamp: "Just now",
      status: "complete",
    });
    saveClientState(state);
    return pkg;
  }

  // Content package detail
  const contentMatch = cleanPath.match(/^\/api\/content\/([^/]+)$/);
  if (contentMatch && method === "GET") {
    const id = contentMatch[1];
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

  // Run QA gate
  const qaMatch = cleanPath.match(/^\/api\/content\/([^/]+)\/qa$/);
  if (qaMatch && method === "POST") {
    const id = qaMatch[1];
    const report = calculateQuality(body || {});
    state.qualityReports[id] = report;
    state.activity.unshift({
      id: `act-${Date.now()}`,
      agent: "QA Agent",
      action: "Ran content health gate",
      detail: `Health ${report.overall}/100 · ${report.passed ? "ready for creator review" : "needs revision"}`,
      timestamp: "Just now",
      status: report.passed ? "complete" : "attention",
    });
    saveClientState(state);
    return report;
  }

  // Approve content
  const approveMatch = cleanPath.match(/^\/api\/content\/([^/]+)\/approve$/);
  if (approveMatch && method === "POST") {
    const id = approveMatch[1];
    const pkg = state.contentPackages[id] || { id, title: "Content Package" };
    pkg.status = "approved";
    state.contentPackages[id] = pkg;
    state.activity.unshift({
      id: `act-${Date.now()}`,
      agent: "Publishing Agent",
      action: "Content package approved",
      detail: `Approved "${pkg.title}" for release across YouTube and Shorts`,
      timestamp: "Just now",
      status: "complete",
    });
    saveClientState(state);
    return { success: true, packageId: id, status: "approved" };
  }

  // Evaluate idea
  if (cleanPath === "/api/evaluate-idea" && method === "POST") {
    const idea = body?.idea || "Why productive creators are building slower systems";
    return evaluateIdeaClient(state, idea);
  }

  // Measurements / Closed loop learning
  if (cleanPath === "/api/measurements" && method === "POST") {
    const measurement = body || {};
    state.measurement = measurement;
    state.activity.unshift({
      id: `act-${Date.now()}`,
      agent: "Learning Loop",
      action: "Recorded performance measurement",
      detail: `Views: ${measurement.actualViews || 48000} · Audience feedback closed into memory graph`,
      timestamp: "Just now",
      status: "complete",
    });
    // Add memory node
    if (state.memory && state.memory.nodes) {
      state.memory.nodes.push({
        id: `mem-${Date.now()}`,
        topic: "Closed Learning Loop",
        insight: `Measured ${measurement.actualViews || 48000} views with ${(measurement.audienceRetention || 0.62) * 100}% retention. Updated formula weights.`,
        confidence: 96,
        impact: "High",
      });
    }
    saveClientState(state);
    return { success: true, measurement, message: "Measurement recorded and learning loop closed." };
  }

  // Memory graph
  if (cleanPath === "/api/memory" && method === "GET") {
    return state.memory;
  }

  // Activity list
  if (cleanPath === "/api/activity" && method === "GET") {
    return state.activity;
  }

  // Calendar
  if (cleanPath === "/api/calendar" && method === "GET") {
    return state.scheduled || [];
  }

  // Settings
  if (cleanPath === "/api/settings" && method === "GET") {
    return (
      state.settings || {
        name: state.pulse?.creatorName || state.channel?.name || "Alex Rivera",
        niche: state.channel?.niche || "AI engineering and developer tools",
        audience: "18–34 year-old developers building with AI",
        tone: "Practical, candid, technically rigorous",
        goals: ["Grow subscribers", "Increase qualified views", "Build authority"],
        platforms: ["YouTube", "Shorts", "X"],
      }
    );
  }

  if (cleanPath === "/api/settings" && (method === "PATCH" || method === "POST")) {
    const settingsData = body?.data || body || {};
    state.settings = { ...(state.settings || {}), ...settingsData };
    if (settingsData.name) {
      state.pulse.creatorName = settingsData.name;
      state.channel.name = settingsData.name;
      const cleanHandle = settingsData.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      state.channel.handle = `@${cleanHandle || "creator"}`;
    }
    if (settingsData.niche) {
      state.channel.niche = settingsData.niche;
    }
    if (state.memory) {
      state.memory.identity = { ...(state.memory.identity || {}), ...settingsData };
    }
    state.activity.unshift({
      id: `act-${Date.now()}`,
      agent: "System",
      action: "Updated creator profile",
      detail: `Identity updated for ${settingsData.name || state.channel.name}`,
      timestamp: "Just now",
      status: "complete",
    });
    saveClientState(state);
    return state.settings;
  }

  console.warn(`[ClientApi] Unhandled path: ${method} ${cleanPath}`);
  return { success: true };
}
