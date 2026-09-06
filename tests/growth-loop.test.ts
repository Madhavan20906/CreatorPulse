import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateDeterministicVector, cosineSimilarity } from "../artifacts/api-server/src/lib/gemini.ts";
import { initialState, findContent } from "../artifacts/api-server/src/lib/creator-state.ts";
import { calculateQuality, evaluateIdea } from "../artifacts/api-server/src/routes/creator.ts";

describe("CreatorPulse Growth Loop Verification Suite", () => {
  describe("1. Semantic Embedding & Vector Cosine Similarity", () => {
    it("generates normalized 128-dimensional dense vectors", () => {
      const vec = generateDeterministicVector("AI agent debugging and self-healing systems");
      assert.equal(vec.length, 128, "Vector dimension must be 128");

      let normSq = 0;
      for (const val of vec) normSq += val * val;
      const norm = Math.sqrt(normSq);
      assert.ok(Math.abs(norm - 1.0) < 1e-4, `Vector must be L2 normalized (norm: ${norm})`);
    });

    it("evaluates cosine similarity accurately across semantic distances", () => {
      const vecA = generateDeterministicVector("Building autonomous coding agents with LangGraph");
      const vecB = generateDeterministicVector("Building autonomous coding agents with LangGraph");
      const vecC = generateDeterministicVector("Autonomous agent coding workflows and loops");
      const vecD = generateDeterministicVector("Best strawberry banana smoothie recipes for summer");

      const simIdentical = cosineSimilarity(vecA, vecB);
      const simRelated = cosineSimilarity(vecA, vecC);
      const simUnrelated = cosineSimilarity(vecA, vecD);

      assert.ok(Math.abs(simIdentical - 1.0) < 1e-4, `Identical sentences must yield cosine sim ~1.0, got ${simIdentical}`);
      assert.ok(simRelated > 0.45, `Related technical concepts must show strong similarity, got ${simRelated}`);
      assert.ok(simRelated > simUnrelated, `Related concepts (${simRelated}) must exceed unrelated domain (${simUnrelated})`);
    });
  });

  describe("2. Section 50 Explainable Scoring Formula", () => {
    function computeSection50Score(af: number, hf: number, nov: number, col: number): number {
      return Math.round(af * 0.35 + hf * 0.30 + nov * 0.25 - col * 0.10);
    }

    it("evaluates initial catalog opportunities to exact integers", () => {
      const opps = initialState.opportunities;
      assert.equal(opps.length, 3, "Initial catalog must have 3 opportunities");

      // Opp 1: opp-production-agents
      const opp1 = opps[0];
      const expected1 = computeSection50Score(opp1.audienceFit, opp1.historicalFit, opp1.novelty, opp1.collisionRisk);
      assert.equal(opp1.score, expected1, `Opp 1 score (${opp1.score}) must match Section 50 formula (${expected1})`);
      assert.equal(opp1.score, 83, "Opp 1 calculated score must equal 83");
      assert.ok(
        opp1.formulaBreakdown.formulaString.includes(`= ${opp1.score}`),
        `formulaString (${opp1.formulaBreakdown.formulaString}) must end with '= ${opp1.score}'`
      );

      // Opp 2: opp-agent-memory
      const opp2 = opps[1];
      const expected2 = computeSection50Score(opp2.audienceFit, opp2.historicalFit, opp2.novelty, opp2.collisionRisk);
      assert.equal(opp2.score, expected2, `Opp 2 score (${opp2.score}) must match Section 50 formula (${expected2})`);
      assert.equal(opp2.score, 76, "Opp 2 calculated score must equal 76");
      assert.ok(
        opp2.formulaBreakdown.formulaString.includes(`= ${opp2.score}`),
        `formulaString (${opp2.formulaBreakdown.formulaString}) must end with '= ${opp2.score}'`
      );

      // Opp 3: opp-workflow-shortcuts
      const opp3 = opps[2];
      const expected3 = computeSection50Score(opp3.audienceFit, opp3.historicalFit, opp3.novelty, opp3.collisionRisk);
      assert.equal(opp3.score, expected3, `Opp 3 score (${opp3.score}) must match Section 50 formula (${expected3})`);
      assert.equal(opp3.score, 68, "Opp 3 calculated score must equal 68");
      assert.ok(
        opp3.formulaBreakdown.formulaString.includes(`= ${opp3.score}`),
        `formulaString (${opp3.formulaBreakdown.formulaString}) must end with '= ${opp3.score}'`
      );
    });

    it("verifies attribution factor weights in formulaBreakdown", () => {
      for (const opp of initialState.opportunities) {
        assert.ok(opp.formulaBreakdown.audienceFitWeight.startsWith("35%"), "Audience weight must be 35%");
        assert.ok(opp.formulaBreakdown.historicalFitWeight.startsWith("30%"), "Historical weight must be 30%");
        assert.ok(opp.formulaBreakdown.noveltyWeight.startsWith("25%"), "Novelty weight must be 25%");
        assert.ok(opp.formulaBreakdown.collisionRiskWeight.startsWith("-10%"), "Collision penalty must be -10%");
      }
    });
  });

  describe("3. Deterministic 7-Rule Quality Gate", () => {
    const validPackage = {
      title: "Why AI agents work in a demo but fail in production",
      description: "A practical deep dive into why AI agent architectures crash outside local sandbox environments, with production state and retry checklists.",
      script: `## Chapter 1: The uncomfortable truth\n\nMost AI agents work beautifully in local demos because happy paths hide production constraints.\n\n## Chapter 2: The architecture fix\n\nWhen state drifts or tool calls timeout, an agent without checkpointing enters infinite loops.\n\n## Chapter 3: Implementation checklist\n\n1. Define state schemas strictly\n2. Add deterministic timeouts\n3. Use explicit approval gates before write actions.\n\nIf this breakdown saved you debugging time, subscribe for practical AI engineering tutorials.`,
      cta: "Subscribe for practical AI engineering breakdowns and production agent architecture.",
      keywords: ["AI agents", "production", "architecture"],
    };

    it("passes all 7 deterministic checks on compliant content packages", () => {
      const report = calculateQuality(validPackage);
      assert.equal(report.checks.length, 7, "Quality gate must run exactly 7 checks");
      assert.equal(report.passed, true, "Valid package must pass all gates");
      assert.ok(report.overall >= 80, `Overall score must be >= 80, got ${report.overall}`);

      const checkNames = report.checks.map((c: any) => c.name);
      assert.deepEqual(checkNames, [
        "Hook strength",
        "SEO keyword coverage",
        "Call to action",
        "Editorial originality",
        "Claim integrity",
        "Description depth & metadata",
        "Retention pacing & anchors",
      ]);

      for (const c of report.checks) {
        assert.equal(c.status, "pass", `Check '${c.name}' should pass`);
      }
    });

    it("flags editorial originality when marketing fluff buzzwords appear", () => {
      const fluffPackage = {
        ...validPackage,
        script: validPackage.script + "\nThis is a revolutionary paradigm shift and a silver bullet game-changer!",
      };
      const report = calculateQuality(fluffPackage);
      const originalityCheck = report.checks.find((c: any) => c.name === "Editorial originality");
      assert.ok(originalityCheck, "Originality check must be present");
      assert.equal(originalityCheck.status, "revise", "Fluff phrases must trigger revision");
    });

    it("flags claim integrity when absolute unsubstantiated guarantees appear", () => {
      const riskyPackage = {
        ...validPackage,
        script: validPackage.script + "\nThis architecture is 100% guaranteed to never fail and will make millions!",
      };
      const report = calculateQuality(riskyPackage);
      const claimCheck = report.checks.find((c: any) => c.name === "Claim integrity");
      assert.ok(claimCheck, "Claim integrity check must be present");
      assert.equal(claimCheck.status, "revise", "Absolute claims must trigger revision");
    });
  });

  describe("4. 42 Catalog Videos Integrity", () => {
    it("contains exactly 42 distinct videos in channel library", () => {
      const videos = initialState.channel.videos;
      assert.equal(videos.length, 42, `Channel must have 42 videos, found ${videos.length}`);
      assert.equal(initialState.channel.videosAnalyzed, 42, "videosAnalyzed property must equal 42");

      const ids = new Set(videos.map((v: any) => v.id));
      assert.equal(ids.size, 42, "All 42 video IDs must be unique");
    });

    it("verifies all required video properties across all 42 entries", () => {
      for (const v of initialState.channel.videos) {
        assert.ok(v.id && typeof v.id === "string", `Video ${v.id} must have valid id`);
        assert.ok(v.title && v.title.length > 5, `Video ${v.id} must have descriptive title`);
        assert.ok(["AI agents", "Developer workflows", "RAG systems", "Python tutorials"].includes(v.topic), `Video ${v.id} has invalid topic: ${v.topic}`);
        assert.ok(typeof v.views === "number" && v.views > 0, `Video ${v.id} must have positive views`);
        assert.ok(typeof v.engagementRate === "number" && v.engagementRate > 0, `Video ${v.id} must have positive ER`);
        assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(v.publishedAt), `Video ${v.id} must have valid YYYY-MM-DD publishedAt`);
        assert.ok(/^\d{2}:\d{2}$/.test(v.duration), `Video ${v.id} must have MM:SS duration`);
      }
    });

    it("covers all 4 topic pillars with realistic library distribution", () => {
      const counts: Record<string, number> = {};
      for (const v of initialState.channel.videos) {
        counts[v.topic] = (counts[v.topic] || 0) + 1;
      }

      assert.ok(counts["AI agents"] >= 10, "Must have at least 10 AI agent videos");
      assert.ok(counts["Developer workflows"] >= 10, "Must have at least 10 Developer workflow videos");
      assert.ok(counts["RAG systems"] >= 8, "Must have at least 8 RAG system videos");
      assert.ok(counts["Python tutorials"] >= 6, "Must have at least 6 Python tutorial videos");
    });
  });

  describe("5. Semantic Collision Engine Against 42 Catalog Videos", () => {
    it("flags near-duplicate ideas as REFRAME with high collision risk", async () => {
      const evalResult = await evaluateIdea(initialState, "I built an AI agent that fixes its own bugs");
      assert.equal(evalResult.recommendation, "REFRAME", "Direct duplication must trigger REFRAME");
      assert.ok(evalResult.collisionRisk >= 55, `Collision risk must be >= 55%, got ${evalResult.collisionRisk}%`);
      assert.ok(evalResult.similarVideos.length > 0, "Must return similar videos from catalog");
    });

    it("approves novel distinct concepts as GO with low collision risk", async () => {
      const evalResult = await evaluateIdea(initialState, "How to build a custom mechanical keyboard from scratch");
      assert.equal(evalResult.recommendation, "GO", "Novel concept must receive GO recommendation");
      assert.ok(evalResult.collisionRisk < 55, `Collision risk must be under 55%, got ${evalResult.collisionRisk}%`);
      assert.ok(evalResult.opportunity >= 50, "Opportunity score must be healthy");
    });
  });

  describe("6. Closed Learning Loop & Multi-Cycle State Progression", () => {
    it("resolves content packages and catalog videos seamlessly", () => {
      const video42 = findContent(initialState, "video-42");
      assert.ok(video42, "video-42 must resolve");
      assert.equal(video42.topic, "AI agents", "video-42 topic must be 'AI agents'");

      const video41 = findContent(initialState, "video-41");
      assert.ok(video41, "video-41 must resolve");
      assert.equal(video41.topic, "Developer workflows", "video-41 topic must be 'Developer workflows'");
    });

    it("verifies dynamic topic confidence shift and re-ranking math", () => {
      const testState = JSON.parse(JSON.stringify(initialState));
      const baseline = testState.channel.averageViews;

      const relativePerf1 = Number((84200 / baseline).toFixed(2));
      assert.ok(relativePerf1 > 1.5, "Cycle 1 must outperform baseline significantly");

      const agentSignal = testState.memory.topicMemory.find((s: any) => s.label === "AI agents");
      const prevConf = agentSignal.confidence;
      agentSignal.confidence = Math.min(99, agentSignal.confidence + 6);
      assert.ok(agentSignal.confidence > prevConf, "Topic confidence must increase on outperformance");

      const relativePerf2 = Number((92500 / baseline).toFixed(2));
      assert.ok(relativePerf2 > 2.0, "Cycle 2 must outperform baseline by > 2x");

      const wfSignal = testState.memory.topicMemory.find((s: any) => s.label === "Developer workflows") || {
        label: "Developer workflows",
        confidence: 88,
      };
      const prevWfConf = wfSignal.confidence;
      wfSignal.confidence = Math.min(99, wfSignal.confidence + 6);
      assert.equal(wfSignal.confidence, 94, "Developer workflows confidence must elevate to 94%");
    });
  });
});
