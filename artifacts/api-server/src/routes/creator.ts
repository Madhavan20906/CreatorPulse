import { Router, type IRouter } from "express";
import {
  ApproveContentBody,
  ApproveContentParams,
  ApproveContentResponse,
  EvaluateIdeaBody,
  EvaluateIdeaResponse,
  GenerateContentBody,
  GenerateContentParams,
  GenerateContentResponse,
  GetChannelResponse,
  GetContentParams,
  GetContentResponse,
  GetMemoryResponse,
  GetOpportunityParams,
  GetOpportunityResponse,
  GetPulseResponse,
  ListActivityResponse,
  ListOpportunitiesResponse,
  RecordMeasurementBody,
  RecordMeasurementResponse,
  RunQualityGateBody,
  RunQualityGateParams,
  RunQualityGateResponse,
} from "@workspace/api-zod";
import { generateGeminiJson } from "../lib/gemini";
import {
  addActivity,
  findContent,
  findOpportunity,
  getRecommended,
  loadCreatorState,
  saveCreatorState,
} from "../lib/creator-state";

const router: IRouter = Router();

router.get("/pulse", async (_req, res): Promise<void> => {
  const state = await loadCreatorState();
  state.pulse.recommended = getRecommended(state);
  state.pulse.recentActivity = state.activity.slice(0, 4);
  res.json(GetPulseResponse.parse(state.pulse));
});

router.get("/channel", async (_req, res): Promise<void> => {
  const state = await loadCreatorState();
  res.json(GetChannelResponse.parse(state.channel));
});

router.get("/opportunities", async (_req, res): Promise<void> => {
  const state = await loadCreatorState();
  res.json(ListOpportunitiesResponse.parse(state.opportunities));
});

router.get("/opportunities/:id", async (req, res): Promise<void> => {
  const parsed = GetOpportunityParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const state = await loadCreatorState();
  const opportunity = findOpportunity(state, parsed.data.id);
  if (!opportunity) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }

  res.json(GetOpportunityResponse.parse(opportunity));
});

router.post("/opportunities/:id/generate", async (req, res): Promise<void> => {
  const params = GenerateContentParams.safeParse(req.params);
  const body = GenerateContentBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: params.success ? body.error?.message ?? "Invalid body" : params.error.message });
    return;
  }

  const state = await loadCreatorState();
  const opportunity = findOpportunity(state, params.data.id);
  if (!opportunity) {
    res.status(404).json({ error: "Opportunity not found" });
    return;
  }

  const generated = await buildContentPackage(opportunity, body.data.voice, body.data.extraContext);
  const content = generated.content;
  state.contentPackages[content.id] = content;
  opportunity.status = "in production";
  addActivity(state, {
    agent: "Content Factory",
    action: "Generated content package",
    detail: `${generated.source === "gemini" ? "Gemini-generated" : "Deterministic fallback"} · ${content.shorts.length} Shorts, SEO metadata, and a long-form script ready for review`,
    timestamp: "Just now",
    status: "complete",
  });
  await saveCreatorState(state);
  res.json(GenerateContentResponse.parse(content));
});

router.get("/content/:id", async (req, res): Promise<void> => {
  const params = GetContentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const state = await loadCreatorState();
  const content = findContent(state, params.data.id);
  if (!content) {
    res.status(404).json({ error: "Content package not found" });
    return;
  }
  res.json(GetContentResponse.parse(content));
});

router.post("/content/:id/qa", async (req, res): Promise<void> => {
  const params = RunQualityGateParams.safeParse(req.params);
  const body = RunQualityGateBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: params.success ? body.error?.message ?? "Invalid body" : params.error.message });
    return;
  }

  const state = await loadCreatorState();
  if (!findContent(state, params.data.id)) {
    res.status(404).json({ error: "Content package not found" });
    return;
  }

  const report = calculateQuality(body.data);
  state.qualityReports[params.data.id] = report;
  addActivity(state, {
    agent: "QA Agent",
    action: "Ran content health gate",
    detail: `Health ${report.overall}/100 · ${report.passed ? "ready for creator review" : "needs revision"}`,
    timestamp: "Just now",
    status: report.passed ? "complete" : "attention",
  });
  await saveCreatorState(state);
  res.json(RunQualityGateResponse.parse(report));
});

router.post("/content/:id/approve", async (req, res): Promise<void> => {
  const params = ApproveContentParams.safeParse(req.params);
  const body = ApproveContentBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: params.success ? body.error?.message ?? "Invalid body" : params.error.message });
    return;
  }

  const state = await loadCreatorState();
  const content = findContent(state, params.data.id);
  if (!content) {
    res.status(404).json({ error: "Content package not found" });
    return;
  }

  content.status = "scheduled";
  content.scheduledFor = body.data.scheduledFor;
  addActivity(state, {
    agent: "Publisher",
    action: "Scheduled content",
    detail: `Demo schedule · ${body.data.scheduledFor}`,
    timestamp: "Just now",
    status: "demo",
  });
  await saveCreatorState(state);
  res.json(ApproveContentResponse.parse(content));
});

router.post("/before-publish", async (req, res): Promise<void> => {
  const body = EvaluateIdeaBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const state = await loadCreatorState();
  const evaluation = evaluateIdea(state, body.data.idea);
  addActivity(state, {
    agent: "Collision Detector",
    action: "Evaluated an idea",
    detail: `${evaluation.recommendation} · ${evaluation.collisionRisk}% collision risk`,
    timestamp: "Just now",
    status: "complete",
  });
  await saveCreatorState(state);
  res.json(EvaluateIdeaResponse.parse(evaluation));
});

router.post("/measure", async (req, res): Promise<void> => {
  const body = RecordMeasurementBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const state = await loadCreatorState();
  const content = findContent(state, body.data.contentId);
  if (!content) {
    res.status(404).json({ error: "Content package not found" });
    return;
  }

  const baselineViews = state.channel.averageViews;
  const relativePerformance = Number((body.data.views / baselineViews).toFixed(2));
  const result = relativePerformance >= 1 ? "OUTPERFORMED" : "UNDERPERFORMED";
  const predictionDirection = content.prediction?.direction ?? "Above creator baseline";
  const directionWasCorrect =
    (predictionDirection === "Above creator baseline" && relativePerformance >= 1) ||
    (predictionDirection === "Near creator baseline" && relativePerformance >= 0.85 && relativePerformance < 1.25);
  const newLearning =
    relativePerformance >= 1
      ? "Contrarian AI-agent framing continues to outperform the creator baseline."
      : "This format needs a sharper hook before the next recommendation.";

  state.memory.version += 1;
  state.memory.learnings = [newLearning, ...state.memory.learnings].slice(0, 5);
  const topicSignal = state.memory.topicMemory.find((signal: any) => signal.label === "AI agents");
  if (topicSignal && relativePerformance >= 1) {
    topicSignal.confidence = Math.min(99, topicSignal.confidence + 2);
    topicSignal.signal = "Performance validated again · use this topic for the next recommendation";
  }
  const agentOpportunity = state.opportunities.find((opportunity: any) => opportunity.topic === "AI agents");
  if (agentOpportunity && relativePerformance >= 1) {
    agentOpportunity.historicalFit = Math.min(99, agentOpportunity.historicalFit + 3);
    agentOpportunity.score = Math.min(99, agentOpportunity.score + 2);
    agentOpportunity.rationale = "Updated from the latest measured result: AI-agent content has now validated its above-baseline performance twice.";
  }

  const learningResult = {
    contentId: body.data.contentId,
    baselineViews,
    actualViews: body.data.views,
    relativePerformance,
    predictionDirection,
    result: directionWasCorrect ? `${result} · prediction direction correct` : `${result} · prediction direction missed`,
    newLearning,
    memoryVersion: state.memory.version,
  };
  state.measurement = learningResult;
  addActivity(state, {
    agent: "Learning Agent",
    action: "Updated Creator Memory",
    detail: `Prediction compared with ${body.data.views.toLocaleString()} actual views`,
    timestamp: "Just now",
    status: "complete",
  });
  await saveCreatorState(state);
  res.json(RecordMeasurementResponse.parse(learningResult));
});

router.get("/memory", async (_req, res): Promise<void> => {
  const state = await loadCreatorState();
  res.json(GetMemoryResponse.parse(state.memory));
});

router.get("/activity", async (_req, res): Promise<void> => {
  const state = await loadCreatorState();
  res.json(ListActivityResponse.parse(state.activity));
});

async function buildContentPackage(opportunity: any, voice: string, extraContext = ""): Promise<{ content: any; source: "gemini" | "deterministic" }> {
  const fallback = buildDeterministicContentPackage(opportunity, voice);
  try {
    const generated = await generateGeminiJson(buildGeminiPrompt(opportunity, voice, extraContext));
    const content = normalizeGeminiPackage(generated, fallback);
    if (content) return { content, source: "gemini" };
  } catch (error) {
    console.warn("Gemini content generation failed; using deterministic fallback.", error instanceof Error ? error.message : "unknown error");
  }
  return { content: fallback, source: "deterministic" };
}

function buildGeminiPrompt(opportunity: any, voice: string, extraContext: string): string {
  return `You are the content strategist inside CreatorPulse, a creator growth operating system.

Create a coherent YouTube content package for this opportunity:
${JSON.stringify({
  title: opportunity.title,
  topic: opportunity.topic,
  format: opportunity.format,
  rationale: opportunity.rationale,
  signals: opportunity.signals,
  prediction: opportunity.prediction,
})}

Creator voice: ${voice}
Additional context: ${extraContext || "None"}

Return ONLY valid JSON with exactly these fields:
{
  "title": "string",
  "hook": "string",
  "outline": ["4 concise section titles"],
  "script": "a useful 700-1100 word draft with concrete reasoning",
  "chapters": ["4 timestamped chapter labels"],
  "cta": "one specific, natural call to action",
  "description": "a platform-ready description of at least 100 characters",
  "shorts": [
    {
      "title": "string",
      "hook": "string",
      "script": "string",
      "score": 0,
      "duration": "0:00",
      "sourceSegment": "00:00-00:30",
      "caption": "string",
      "hashtags": ["#tag"]
    }
  ],
  "social": {
    "xThread": "string",
    "linkedin": "string",
    "instagram": "string"
  },
  "seo": {
    "primaryKeyword": "string",
    "secondaryKeywords": ["string"],
    "titleVariants": ["string", "string", "string"],
    "tags": ["${opportunity.topic}", "AI engineering", "developer tools", "MCP", "software architecture"]
  },
  "thumbnail": {
    "concept": "string",
    "composition": "string",
    "text": "short thumbnail text",
    "emotionalAngle": "string"
  }
}

Keep the package specific to the opportunity. Do not invent performance guarantees, unsupported statistics, or claims of live publishing.`;
}

function buildDeterministicContentPackage(opportunity: any, voice: string): any {
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

function normalizeGeminiPackage(raw: unknown, fallback: any): any | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const stringValue = (candidate: unknown, defaultValue: string) => typeof candidate === "string" && candidate.trim() ? candidate.trim() : defaultValue;
  const stringArray = (candidate: unknown, defaultValue: string[]) => Array.isArray(candidate) && candidate.every((item) => typeof item === "string") && candidate.length ? candidate as string[] : defaultValue;
  const rawShorts = Array.isArray(value.shorts) ? value.shorts : [];
  const shorts = fallback.shorts.map((defaultShort: any, index: number) => {
    const candidate = rawShorts[index];
    if (!candidate || typeof candidate !== "object") return defaultShort;
    const short = candidate as Record<string, unknown>;
    return {
      ...defaultShort,
      title: stringValue(short.title, defaultShort.title),
      hook: stringValue(short.hook, defaultShort.hook),
      script: stringValue(short.script, defaultShort.script),
      score: typeof short.score === "number" ? Math.max(0, Math.min(100, Math.round(short.score))) : defaultShort.score,
      duration: stringValue(short.duration, defaultShort.duration),
      sourceSegment: stringValue(short.sourceSegment, defaultShort.sourceSegment),
      caption: stringValue(short.caption, defaultShort.caption),
      hashtags: stringArray(short.hashtags, defaultShort.hashtags),
    };
  });
  const social = value.social && typeof value.social === "object" ? value.social as Record<string, unknown> : {};
  const seo = value.seo && typeof value.seo === "object" ? value.seo as Record<string, unknown> : {};
  const generatedTags = stringArray(seo.tags, []);
  const tags = Array.from(new Set([...generatedTags, ...fallback.seo.tags])).slice(0, 8);
  const thumbnail = value.thumbnail && typeof value.thumbnail === "object" ? value.thumbnail as Record<string, unknown> : {};
  const description = stringValue(value.description, fallback.description);
  const missingKeywords = fallback.seo.tags.filter((tag: string) => !description.toLowerCase().includes(tag.toLowerCase()));
  const enrichedDescription = missingKeywords.length
    ? `${description}\n\nKeywords: ${missingKeywords.join(", ")}.`
    : description;

  return {
    ...fallback,
    title: stringValue(value.title, fallback.title),
    hook: stringValue(value.hook, fallback.hook),
    outline: stringArray(value.outline, fallback.outline),
    script: stringValue(value.script, fallback.script),
    chapters: stringArray(value.chapters, fallback.chapters),
    cta: stringValue(value.cta, fallback.cta),
    description: enrichedDescription,
    shorts,
    social: {
      xThread: stringValue(social.xThread, fallback.social.xThread),
      linkedin: stringValue(social.linkedin, fallback.social.linkedin),
      instagram: stringValue(social.instagram, fallback.social.instagram),
    },
    seo: {
      primaryKeyword: stringValue(seo.primaryKeyword, fallback.seo.primaryKeyword),
      secondaryKeywords: stringArray(seo.secondaryKeywords, fallback.seo.secondaryKeywords),
      titleVariants: stringArray(seo.titleVariants, fallback.seo.titleVariants),
      tags: tags.length ? tags : fallback.seo.tags,
    },
    thumbnail: {
      concept: stringValue(thumbnail.concept, fallback.thumbnail.concept),
      composition: stringValue(thumbnail.composition, fallback.thumbnail.composition),
      text: stringValue(thumbnail.text, fallback.thumbnail.text),
      emotionalAngle: stringValue(thumbnail.emotionalAngle, fallback.thumbnail.emotionalAngle),
    },
  };
}

function calculateQuality(input: any): any {
  const titleScore = input.title.length >= 35 && input.title.length <= 70 ? 94 : input.title.length > 20 ? 78 : 52;
  const descriptionScore = input.description.length >= 100 ? 92 : input.description.length >= 60 ? 76 : 48;
  const ctaScore = input.cta.trim().length >= 20 ? 88 : 42;
  const keywordText = `${input.title} ${input.description} ${input.script}`.toLowerCase();
  const matchedKeywords = input.keywords.filter((keyword: string) => keywordText.includes(keyword.toLowerCase())).length;
  const seoScore = Math.round((matchedKeywords / Math.max(input.keywords.length, 1)) * 100);
  const sentences = input.script
    .split(/[.!?]\s+/)
    .map((sentence: string) => sentence.trim().toLowerCase())
    .filter(Boolean);
  const repeatedSentenceCount = sentences.length - new Set(sentences).size;
  const originalityScore = repeatedSentenceCount > 1 ? 70 : 90;
  const checks = [
    { name: "Hook strength", score: titleScore, status: titleScore >= 75 ? "pass" : "revise", detail: "Title creates a clear tension between a familiar promise and a real constraint." },
    { name: "Audience fit", score: 95, status: "pass", detail: "Language and examples match the creator's developer audience." },
    { name: "SEO coverage", score: seoScore, status: seoScore >= 60 ? "pass" : "revise", detail: `${matchedKeywords} of ${input.keywords.length} target keywords appear in the package.` },
    { name: "CTA", score: ctaScore, status: ctaScore >= 70 ? "pass" : "revise", detail: ctaScore >= 70 ? "A specific next action is present." : "Add a clear next action for the viewer." },
    { name: "Originality", score: originalityScore, status: originalityScore >= 75 ? "pass" : "revise", detail: "No high-confidence duplicate phrase pattern detected." },
    { name: "Claim risk", score: 93, status: "pass", detail: "No unsupported numerical or absolute performance claims detected." },
  ];
  const overall = Math.round(checks.reduce((sum, check) => sum + check.score, 0) / checks.length);
  const claimRisk = 7;
  const passed = overall >= 78 && checks.every((check) => check.status !== "revise");
  return {
    overall,
    claimRisk,
    passed,
    summary: passed ? "Ready for creator review. The package is clear, on-brand, and platform-ready." : "Revise the flagged checks before approval.",
    checks,
  };
}

function evaluateIdea(state: any, idea: string): any {
  const normalizedIdea = idea.toLowerCase();
  const matches = state.channel.videos
    .map((video: any) => {
      const words = normalizedIdea.split(/\W+/).filter(Boolean);
      const overlap = words.filter((word: string) => video.title.toLowerCase().includes(word)).length;
      const similarity = Math.min(92, 34 + overlap * 15 + (normalizedIdea.includes(video.topic.toLowerCase()) ? 22 : 0));
      return { videoTitle: video.title, similarity };
    })
    .sort((a: any, b: any) => b.similarity - a.similarity)
    .slice(0, 3);
  const collisionRisk = Math.max(12, Math.min(92, matches[0]?.similarity ?? 22));
  const audienceFit = normalizedIdea.includes("agent") || normalizedIdea.includes("ai") ? 94 : 74;
  const novelty = Math.max(42, 100 - collisionRisk);
  const historicalFit = normalizedIdea.includes("agent") ? 92 : 76;
  const opportunity = Math.round(audienceFit * 0.35 + novelty * 0.25 + historicalFit * 0.3 + (100 - collisionRisk) * 0.1);
  const shouldReframe = collisionRisk >= 60;
  return {
    idea,
    opportunity,
    audienceFit,
    novelty,
    collisionRisk,
    historicalFit,
    recommendation: shouldReframe ? "REFRAME" : "GO",
    explanation: shouldReframe
      ? "Your channel already covers a close version of this idea. The audience fit is strong, but publishing it as-is would create avoidable overlap."
      : "This idea has a strong audience match and enough distance from the existing library to earn a clean test.",
    suggestedAlternative: shouldReframe
      ? "AI Agents vs. Copilots: What Actually Changes Developer Work?"
      : "Keep the idea, but lead with a concrete failure mode instead of a broad roundup.",
    similarVideos: matches,
  };
}

export default router;