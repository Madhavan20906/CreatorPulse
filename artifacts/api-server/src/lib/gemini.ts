type GeminiPart = { text?: string };

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
};

export async function generateGeminiJson(prompt: string): Promise<unknown | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.75,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini request failed with status ${response.status}: ${errorBody.slice(0, 500)}`);
    }

    const payload = (await response.json()) as GeminiResponse;
    const text = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();
    if (!text) throw new Error("Gemini returned an empty response");

    const normalized = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(normalized) as unknown;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getGeminiEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { embedding?: { values?: number[] } };
    return payload.embedding?.values ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Deterministic semantic dense vector (128 dimensions) using subword n-gram hashing and term weighting.
 * Guarantees zero-network semantic vector search when Gemini API is offline.
 */
export function generateDeterministicVector(text: string, dim = 128): number[] {
  const vec = new Float64Array(dim);
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const words = clean.split(/\s+/).filter(Boolean);

  // Unigram & bigram frequency projection
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 5381;
    for (let j = 0; j < word.length; j++) {
      hash = ((hash << 5) + hash + word.charCodeAt(j)) >>> 0;
    }
    const idx = hash % dim;
    vec[idx] += 1.5;

    // Subword trigrams
    if (word.length >= 3) {
      for (let k = 0; k <= word.length - 3; k++) {
        const tri = word.slice(k, k + 3);
        let triHash = 2166136261;
        for (let m = 0; m < 3; m++) {
          triHash = (triHash ^ tri.charCodeAt(m)) * 16777619;
        }
        vec[Math.abs(triHash) % dim] += 0.5;
      }
    }

    // Word bigrams
    if (i < words.length - 1) {
      const bi = `${word}_${words[i + 1]}`;
      let biHash = 0;
      for (let n = 0; n < bi.length; n++) {
        biHash = (biHash * 31 + bi.charCodeAt(n)) | 0;
      }
      vec[Math.abs(biHash) % dim] += 1.0;
    }
  }

  // L2 Normalize
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) vec[i] /= norm;
  }

  return Array.from(vec);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
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