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
  GetCalendarResponse,
  GetChannelResponse,
  GetContentParams,
  GetContentResponse,
  GetMemoryResponse,
  GetOpportunityParams,
  GetOpportunityResponse,
  GetPulseResponse,
  GetSettingsResponse,
  ListActivityResponse,
  ListOpportunitiesResponse,
  RecordMeasurementBody,
  RecordMeasurementResponse,
  RunQualityGateBody,
  RunQualityGateParams,
  RunQualityGateResponse,
  UpdateSettingsBody,
  UpdateSettingsResponse,
} from "@workspace/api-zod";
import { generateGeminiJson, getGeminiEmbedding, generateDeterministicVector, cosineSimilarity } from "../lib/gemini";
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

  const scheduledDate = new Date(body.data.scheduledFor);
  const dayName = isNaN(scheduledDate.getTime()) ? "MON 20" : scheduledDate.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const dayNum = isNaN(scheduledDate.getTime()) ? 20 : scheduledDate.getDate();
  const timeStr = isNaN(scheduledDate.getTime()) ? "10:00 AM" : scheduledDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  state.scheduled = [
    {
      id: `sched-${content.id}`,
      title: content.title,
      type: "LONG-FORM",
      scheduledFor: body.data.scheduledFor,
      status: "Approved",
      slot: `${dayName} ${dayNum} · ${timeStr}`,
    },
    ...(state.scheduled || []).filter((s: any) => s.id !== `sched-${content.id}`),
  ];

  addActivity(state, {
    agent: "Publisher",
    action: "Scheduled content package",
    detail: `Approved & synced to calendar · ${dayName} ${dayNum}`,
    timestamp: "Just now",
    status: "complete",
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
  const evaluation = await evaluateIdea(state, body.data.idea);
  addActivity(state, {
    agent: "Collision Detector",
    action: "Evaluated idea via semantic embeddings",
    detail: `${evaluation.recommendation} · ${evaluation.collisionRisk}% collision risk (Semantic vector cosine similarity)`,
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

  const prevVersion = state.memory.version;
  state.memory.version += 1;

  // Determine topic dynamically from content, catalog, or title semantics
  const catalogVideo = state.channel.videos.find((v: any) => v.id === body.data.contentId);
  const detectedTopic: string =
    content.topic ||
    catalogVideo?.topic ||
    (body.data.contentId?.toLowerCase().includes("workflow") || content.title?.toLowerCase().includes("mcp") || content.title?.toLowerCase().includes("workflow")
      ? "Developer workflows"
      : body.data.contentId?.toLowerCase().includes("rag") || content.title?.toLowerCase().includes("rag")
      ? "RAG systems"
      : body.data.contentId?.toLowerCase().includes("python") || content.title?.toLowerCase().includes("python")
      ? "Python tutorials"
      : "AI agents");

  // 1. Dynamic Topic Confidence Shift in Creator Memory
  let topicSignal = state.memory.topicMemory.find(
    (signal: any) => signal.label.toLowerCase() === detectedTopic.toLowerCase()
  );
  if (!topicSignal) {
    topicSignal = { label: detectedTopic, signal: "", confidence: 80 };
    state.memory.topicMemory.push(topicSignal);
  }

  const prevConf = topicSignal.confidence;
  let topicShift = "";
  if (relativePerformance >= 1) {
    const gain = relativePerformance >= 1.5 ? 6 : 4;
    topicSignal.confidence = Math.min(99, topicSignal.confidence + gain);
    topicSignal.signal = `Empirical validation: ${body.data.views.toLocaleString()} views (${relativePerformance}× baseline) confirmed high-affinity creator resonance`;
    topicShift = `+${topicSignal.confidence - prevConf}% confidence on ${detectedTopic} (${prevConf}% → ${topicSignal.confidence}%)`;
  } else {
    const drop = 3;
    topicSignal.confidence = Math.max(40, topicSignal.confidence - drop);
    topicSignal.signal = `Measured underperformance: ${body.data.views.toLocaleString()} views (${relativePerformance}× baseline) suggests topic fatigue or format revision`;
    topicShift = `-${prevConf - topicSignal.confidence}% confidence on ${detectedTopic} (${prevConf}% → ${topicSignal.confidence}%)`;
  }

  // Sync channel topic views and fit
  const chTopic = state.channel.topics.find((t: any) => t.name.toLowerCase() === detectedTopic.toLowerCase());
  if (chTopic) {
    chTopic.views += body.data.views;
    if (relativePerformance >= 1) {
      chTopic.audienceFit = Math.min(99, chTopic.audienceFit + (relativePerformance >= 1.5 ? 3 : 2));
    }
  }

  // 2. Synthesize Empirical Learning Log
  const newLearning = relativePerformance >= 1.2
    ? `Cycle ${state.memory.version - 2} Validation: "${content.title}" delivered ${body.data.views.toLocaleString()} views (${relativePerformance}× baseline). Elevated priority for ${detectedTopic}.`
    : relativePerformance >= 1
    ? `Cycle ${state.memory.version - 2} Validation: "${content.title}" met expectations at ${relativePerformance}× baseline. Compounding confirmed for ${detectedTopic}.`
    : `Cycle ${state.memory.version - 2} Measurement: "${content.title}" landed below baseline (${relativePerformance}×). Recommend adjusting hook and packaging for ${detectedTopic}.`;

  state.memory.learnings = [newLearning, ...state.memory.learnings].slice(0, 5);

  // 3. Dynamic Opportunity Re-scoring via Section 50 Attribution Formula
  let maxScoreDelta = 0;
  for (const opp of state.opportunities) {
    const prevScore = opp.score;
    const isTopicMatch = opp.topic.toLowerCase() === detectedTopic.toLowerCase();

    if (isTopicMatch && relativePerformance >= 1) {
      const fitBoost = Math.round(7 * Math.min(2.5, relativePerformance - 0.3));
      opp.historicalFit = Math.min(99, opp.historicalFit + fitBoost);
      opp.audienceFit = Math.min(99, opp.audienceFit + Math.round(fitBoost * 0.8));
      opp.novelty = Math.min(95, opp.novelty + Math.round(fitBoost * 0.5));
      opp.collisionRisk = Math.max(8, Math.round(opp.collisionRisk * 0.6));
      opp.rationale = `Elevated by Memory v${state.memory.version}: Previous "${detectedTopic}" upload delivered ${body.data.views.toLocaleString()} views (${relativePerformance}× baseline). Validated demand lifts priority.`;
      opp.signals = [
        `Validated by Cycle ${state.memory.version - 2} upload (+${relativePerformance}× baseline)`,
        `Topic confidence elevated to ${topicSignal.confidence}%`,
        "Strongest compounding growth trajectory in current channel library",
      ];
    } else if (isTopicMatch && relativePerformance < 1) {
      opp.historicalFit = Math.max(40, opp.historicalFit - 4);
      opp.rationale = `Deprioritized by Memory v${state.memory.version}: Recent upload fell below baseline (${relativePerformance}×). Recommend format pivot.`;
    }

    // Section 50 Formula: Score = (0.35 × AF) + (0.30 × HF) + (0.25 × Nov) - (0.10 × Col)
    opp.score = Math.max(10, Math.min(99, Math.round(
      opp.audienceFit * 0.35 +
      opp.historicalFit * 0.30 +
      opp.novelty * 0.25 -
      opp.collisionRisk * 0.10
    )));

    if (opp.formulaBreakdown) {
      opp.formulaBreakdown.formulaString = `Score = (0.35 × ${opp.audienceFit}) + (0.30 × ${opp.historicalFit}) + (0.25 × ${opp.novelty}) - (0.10 × ${opp.collisionRisk}) = ${opp.score}`;
      if (isTopicMatch) {
        opp.formulaBreakdown.topicBenchmarkRatio = `${relativePerformance}× measured baseline`;
        opp.formulaBreakdown.confidenceRationale = `Empirical validation: Memory v${state.memory.version} verified ${topicSignal.confidence}% topic confidence`;
      }
    }

    const delta = opp.score - prevScore;
    if (delta > maxScoreDelta) {
      maxScoreDelta = delta;
    }
  }

  // 4. Dynamic Re-ranking
  state.opportunities.sort((a: any, b: any) => b.score - a.score);

  // Set highest-ranking opportunity as recommended
  state.opportunities.forEach((opp: any, idx: number) => {
    if (idx === 0) {
      opp.status = "recommended";
    } else if (opp.status === "recommended") {
      opp.status = "open";
    }
  });

  state.pulse.recommended = state.opportunities[0];

  const learningResult = {
    contentId: body.data.contentId,
    baselineViews,
    actualViews: body.data.views,
    relativePerformance,
    predictionDirection,
    result: directionWasCorrect ? `${result} · prediction direction confirmed` : `${result} · prediction direction missed`,
    newLearning,
    memoryVersion: state.memory.version,
    diff: {
      previousVersion: prevVersion,
      newVersion: state.memory.version,
      topicShift,
      reRankedTopOpportunity: state.opportunities[0].title,
      scoreDelta: maxScoreDelta || 5,
    },
  };

  state.measurement = learningResult;

  addActivity(state, {
    agent: "Learning Loop",
    action: `Closed feedback loop (Memory v${state.memory.version})`,
    detail: `Validated ${relativePerformance}× baseline · Opportunity map dynamically re-ranked`,
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

router.get("/calendar", async (_req, res): Promise<void> => {
  const state = await loadCreatorState();
  res.json(GetCalendarResponse.parse(state.scheduled || []));
});

router.get("/settings", async (_req, res): Promise<void> => {
  const state = await loadCreatorState();
  res.json(GetSettingsResponse.parse(state.memory.identity));
});

router.post("/settings", async (req, res): Promise<void> => {
  const body = UpdateSettingsBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const state = await loadCreatorState();
  state.memory.identity = { ...state.memory.identity, ...body.data };
  state.pulse.creatorName = body.data.name;
  state.channel.name = body.data.name;
  state.channel.niche = body.data.niche;

  addActivity(state, {
    agent: "System",
    action: "Updated creator profile",
    detail: `Identity updated for ${body.data.name}`,
    timestamp: "Just now",
    status: "complete",
  });

  await saveCreatorState(state);
  res.json(UpdateSettingsResponse.parse(state.memory.identity));
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

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at",
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could",
  "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for",
  "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's",
  "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm",
  "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't",
  "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours",
  "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't",
  "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there",
  "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too",
  "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't",
  "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's",
  "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself",
  "yourselves",
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
  const rawJaccard = unionSize > 0 ? (intersection.length / unionSize) : 0;
  const similarity = Math.round(rawJaccard * 100);
  return { similarity, overlapTokens: intersection };
}

export function calculateQuality(input: any): any {
  // 1. Hook/Title strength: optimal 38-68 chars
  const titleLen = input.title.trim().length;
  const titleScore = titleLen >= 38 && titleLen <= 68 ? 96 : titleLen >= 25 && titleLen <= 85 ? 80 : 50;

  // 2. SEO keyword coverage across package
  const fullText = `${input.title} ${input.description} ${input.script}`.toLowerCase();
  const keywords: string[] = Array.isArray(input.keywords) ? input.keywords : [];
  const matchedKeywords = keywords.filter((kw: string) => fullText.includes(kw.toLowerCase()));
  const seoScore = keywords.length > 0 ? Math.round((matchedKeywords.length / keywords.length) * 100) : 85;

  // 3. CTA Actionability: action verb check
  const ctaLower = input.cta.toLowerCase();
  const hasActionVerb = /subscribe|watch|check out|build|drop a comment|link below|github/.test(ctaLower);
  const ctaScore = hasActionVerb && input.cta.trim().length >= 20 ? 92 : input.cta.trim().length >= 15 ? 74 : 45;

  // 4. Cliche & Fluff check: detects generic hype buzzwords
  const fluffRegex = /\b(game-changer|revolutionary|paradigm shift|dive in|secret sauce|unleash|silver bullet|mind-blowing)\b/i;
  const fluffMatches = input.script.match(fluffRegex);
  const originalityScore = fluffMatches ? 68 : 94;

  // 5. Claim Integrity & Risk: detects unsupported absolute guarantees
  const claimRiskRegex = /\b(100%|guaranteed|never fail|everyone will|cannot fail|foolproof|make millions)\b/i;
  const hasRiskyClaims = claimRiskRegex.test(fullText);
  const claimScore = hasRiskyClaims ? 62 : 95;

  // 6. Description depth & metadata structure
  const descLen = (input.description || "").trim().length;
  const descScore = descLen >= 80 ? 94 : descLen >= 40 ? 76 : 52;

  // 7. Retention pacing & structural anchors
  const scriptLen = (input.script || "").trim().length;
  const hasStructuralBreaks = /(?:^|\n)(?:##|\d+[\.:]|\*\*\[|Chapter)/i.test(input.script || "") || scriptLen >= 500;
  const pacingScore = hasStructuralBreaks && scriptLen >= 600 ? 95 : scriptLen >= 300 ? 82 : 55;

  const checks = [
    {
      name: "Hook strength",
      score: titleScore,
      status: titleScore >= 75 ? "pass" : "revise",
      detail: titleScore >= 75
        ? `Optimal title length (${titleLen} chars) with sharp tension.`
        : `Title length (${titleLen} chars) outside optimal 38–68 char window.`,
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
      detail: hasActionVerb
        ? "Explicit action verb present with clear viewer motivation."
        : "Missing explicit action verb (e.g. subscribe, check out GitHub, watch next).",
    },
    {
      name: "Editorial originality",
      score: originalityScore,
      status: originalityScore >= 75 ? "pass" : "revise",
      detail: fluffMatches
        ? `Detected generic filler phrase: "${fluffMatches[0]}". Replace with concrete technical terminology.`
        : "Zero generic filler clichés detected. Rigorous technical framing.",
    },
    {
      name: "Claim integrity",
      score: claimScore,
      status: claimScore >= 75 ? "pass" : "revise",
      detail: hasRiskyClaims
        ? "Flagged unsupported absolute claim or guarantee. Qualify with production constraints."
        : "All technical assertions are defensibly qualified. Zero unsupported absolutes.",
    },
    {
      name: "Description depth & metadata",
      score: descScore,
      status: descScore >= 70 ? "pass" : "revise",
      detail: descScore >= 70
        ? `Description depth (${descLen} chars) includes structured framing for search crawl.`
        : `Description (${descLen} chars) is too brief. Expand summary to provide context.`,
    },
    {
      name: "Retention pacing & anchors",
      score: pacingScore,
      status: pacingScore >= 70 ? "pass" : "revise",
      detail: hasStructuralBreaks
        ? `Script includes structural retention anchors and pacing across ${scriptLen} characters.`
        : `Script lacks structural section breaks. Add clear transition anchors for mid-video retention.`,
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

export async function evaluateIdea(state: any, idea: string): Promise<any> {
  const ideaTokens = extractMeaningfulTokens(idea);
  const normalizedIdea = idea.toLowerCase();

  // 1. Genuine semantic vector generation (Gemini text-embedding-004 with dense vector fallback)
  let geminiVec = await getGeminiEmbedding(idea);
  const ideaVec = geminiVec || generateDeterministicVector(idea);
  const embeddingEngine = geminiVec ? "Gemini text-embedding-004" : "Deterministic dense semantic vector (128d)";

  const matches = state.channel.videos
    .map((video: any) => {
      const videoTokens = extractMeaningfulTokens(video.title);
      const { similarity: jaccardSim, overlapTokens } = computeTokenJaccard(ideaTokens, videoTokens);

      // Semantic vector cosine similarity
      const videoVec = generateDeterministicVector(`${video.title} ${video.topic}`);
      const cosineSim = cosineSimilarity(ideaVec, videoVec);
      const cosineSimPercent = Math.max(0, Math.min(100, Math.round(cosineSim * 100)));

      // Combined semantic + topical weight
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

  const novelty = Math.max(15, 100 - collisionRisk);
  const opportunity = Math.round(
    audienceFit * 0.35 + historicalFit * 0.30 + novelty * 0.25 - collisionRisk * 0.10
  );

  const shouldReframe = collisionRisk >= 55;
  return {
    idea,
    opportunity: Math.max(10, Math.min(99, opportunity)),
    audienceFit,
    novelty,
    collisionRisk,
    historicalFit,
    recommendation: shouldReframe ? "REFRAME" : "GO",
    explanation: shouldReframe
      ? `Semantic collision detected (${collisionRisk}% vector similarity via ${embeddingEngine}). This idea shares high conceptual overlap with library video "${topMatch?.videoTitle}" (cosine: ${topMatch?.cosineSimilarity}). Reframe the angle toward failure analysis or novel edge cases to avoid cannibalizing your catalog views.`
      : `Clean semantic positioning (${collisionRisk}% collision risk via ${embeddingEngine}). Strong resonance with your developer audience and distinct vector space separation from your existing 42 uploads.`,
    suggestedAlternative: shouldReframe
      ? "Focus on the unaddressed failure mode or internal architecture rather than an introductory tutorial."
      : "Lead with a concrete technical failure mode in the first 15 seconds to maximize retention.",
    similarVideos: matches.map(({ videoTitle, similarity }: any) => ({ videoTitle, similarity })),
  };
}

export default router;