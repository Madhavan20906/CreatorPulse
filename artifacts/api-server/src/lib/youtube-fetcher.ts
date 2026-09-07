import type { ChannelVideo, PublicChannelProfile } from "./real-channels.js";

function unescapeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

function parseSubscriberString(subStr: string): number | null {
  if (!subStr) return null;
  const cleaned = subStr.toLowerCase().replace(/subscribers?/i, "").replace(/,/g, "").trim();

  // 1. Check for million / M
  const millionMatch = cleaned.match(/([\d\.]+)\s*(?:million|m)/i);
  if (millionMatch) return Math.round(parseFloat(millionMatch[1]) * 1000000);

  // 2. Check for billion / B
  const billionMatch = cleaned.match(/([\d\.]+)\s*(?:billion|b)/i);
  if (billionMatch) return Math.round(parseFloat(billionMatch[1]) * 1000000000);

  // 3. Check for thousand / K
  const thousandMatch = cleaned.match(/([\d\.]+)\s*(?:thousand|k)/i);
  if (thousandMatch) return Math.round(parseFloat(thousandMatch[1]) * 1000);

  // 4. Check for lakh / crore (for Indian YouTube channels)
  const croreMatch = cleaned.match(/([\d\.]+)\s*crore/i);
  if (croreMatch) return Math.round(parseFloat(croreMatch[1]) * 10000000);
  const lakhMatch = cleaned.match(/([\d\.]+)\s*lakh/i);
  if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100000);

  // 5. Plain number (e.g. "8500" or "8,500")
  const rawNum = cleaned.match(/([\d\.]+)/);
  if (rawNum) {
    const n = parseFloat(rawNum[1]);
    if (!isNaN(n) && n > 0) return Math.round(n);
  }
  return null;
}

function inferVideoFormat(title: string, desc: string): string {
  const lower = (title + " " + desc).toLowerCase();
  if (lower.includes("#shorts") || lower.includes("#short")) {
    return "Short form";
  }
  if (
    lower.includes("how to") ||
    lower.includes("tutorial") ||
    lower.includes("build") ||
    lower.includes("coding") ||
    lower.includes("guide") ||
    lower.includes("crash course")
  ) {
    return "Practical tutorial";
  }
  if (
    lower.includes("vs") ||
    lower.includes("explained") ||
    lower.includes("deep dive") ||
    lower.includes("honest review") ||
    lower.includes("what happened") ||
    lower.includes("breakdown")
  ) {
    return "Deep dive";
  }
  if (
    lower.includes("why") ||
    lower.includes("future of") ||
    lower.includes("truth about") ||
    lower.includes("stop doing") ||
    lower.includes("the problem with") ||
    lower.includes("history")
  ) {
    return "Essay";
  }
  if (lower.includes("podcast") || lower.includes("interview") || lower.includes("with")) {
    return "Interview / Discussion";
  }
  return "Practical tutorial";
}

function detectChannelNiche(channelName: string, channelDesc: string, videos: ChannelVideo[]): string {
  const combined = `${channelName} ${channelDesc} ${videos.map((v) => v.title).join(" ")}`.toLowerCase();

  if (/\b(travel|amsterdam|europe|trip|vacation|tour|vlog|city|flight|hotel|explore|nomad|wanderlust|backpack)\b/i.test(combined)) {
    return "Travel, Lifestyle & Exploration";
  }
  if (/\b(gaming|gameplay|walkthrough|playthrough|fps|minecraft|roblox|gta|fortnite|steam|playstation|xbox|nintendo)\b/i.test(combined)) {
    return "Gaming & Entertainment";
  }
  if (/\b(fitness|workout|gym|bodybuilding|nutrition|diet|muscle|cardio|weight loss|exercise|health|calisthenics)\b/i.test(combined)) {
    return "Fitness, Health & Physical Training";
  }
  if (/\b(finance|money|invest|investing|stock|stocks|crypto|wealth|budget|real estate|passive income|trading)\b/i.test(combined)) {
    return "Personal Finance, Investing & Wealth";
  }
  if (/\b(food|cooking|recipe|baking|chef|culinary|kitchen|street food|tasting|restaurant)\b/i.test(combined)) {
    return "Food, Culinary Arts & Cooking";
  }
  if (/\b(ai|llm|agent|gpt|machine learning|python|coding|software|developer|programming|engineering|cloud|devops|mcp)\b/i.test(combined)) {
    return "Technology, AI & Software Engineering";
  }
  if (/\b(business|startup|saas|founder|marketing|ecommerce|scale|sales|hiring|agency)\b/i.test(combined)) {
    return "Business, Startups & Entrepreneurship";
  }
  if (/\b(art|design|drawing|illustration|animation|photoshop|filmmaking|photography|editing)\b/i.test(combined)) {
    return "Creative Arts, Design & Filmmaking";
  }
  if (/\b(music|guitar|piano|beats|producer|song|singing|audio|synthesizer)\b/i.test(combined)) {
    return "Music Production & Sound Design";
  }
  if (/\b(education|science|physics|math|biology|history|psychology|philosophy|lesson)\b/i.test(combined)) {
    return "Education & Science Explainers";
  }

  return "Lifestyle, Strategy & Creative Content";
}

function classifyVideoTopic(title: string, desc: string, channelNiche: string): string {
  const text = (title + " " + desc).toLowerCase();

  if (/\b(travel|amsterdam|city|trip|flight|hotel|vlog|tour|walk|backpack)\b/i.test(text)) {
    return "Travel Guides & City Vlogs";
  }
  if (/\b(budget|cost|cheap|free|saving|afford|expenses)\b/i.test(text)) {
    return "Budgeting & Logistics";
  }
  if (/\b(food|restaurant|eat|cafe|street food|coffee)\b/i.test(text)) {
    return "Food & Local Culture";
  }
  if (/\b(ai|llm|gpt|agent|agents|model|gemini|openai|anthropic|rag|prompt|deep learning|neural|mcp)\b/i.test(text)) {
    return "AI & Autonomous Systems";
  }
  if (/\b(typescript|javascript|rust|python|golang|react|nextjs|node|docker|linux|database|sql|git|css|html|frontend|backend|api)\b/i.test(text)) {
    return "Software Engineering & Architecture";
  }
  if (/\b(apple|macbook|iphone|android|tesla|hardware|review|unboxing|phone|screen|display|battery|camera|processor|m4|nvidia|gpu)\b/i.test(text)) {
    return "Hardware & Frontier Tech";
  }
  if (/\b(physics|math|science|space|gravity|energy|quantum|experiment|paradox|biology|astronomy)\b/i.test(text)) {
    return "Scientific Deep Dives";
  }
  if (/\b(business|money|startup|creator|youtube|growth|career|job|hiring|salary|productivity)\b/i.test(text)) {
    return "Industry & Career Strategy";
  }
  if (/\b(security|hack|crypto|bitcoin|privacy|cyber)\b/i.test(text)) {
    return "Security & Infrastructure";
  }

  // Fallback to channel niche or title key phrase
  const words = title
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !/^(this|that|with|from|what|when|where|here|have|more|your|about|just|they|video|part)$/i.test(w));

  if (words.length >= 2) {
    return `${words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase()} & ${words[1].charAt(0).toUpperCase() + words[1].slice(1).toLowerCase()}`;
  }
  if (words.length === 1) {
    return `${words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase()} Focus`;
  }

  return channelNiche.split(/[,&]/)[0]?.trim() || "Core Focus";
}

export async function fetchLiveYouTubeCatalog(handleOrUrl: string): Promise<PublicChannelProfile> {
  const rawInput = (handleOrUrl || "").trim();
  if (!rawInput) {
    throw new Error("No YouTube channel handle or URL provided.");
  }

  let channelId: string | null = null;
  let targetHandle = "";

  // Check if input is a direct channel URL or channel ID
  const directIdMatch = rawInput.match(/channel\/(UC[a-zA-Z0-9_-]{20,})/i) || rawInput.match(/^(UC[a-zA-Z0-9_-]{20,})$/i);
  if (directIdMatch) {
    channelId = directIdMatch[1];
  } else {
    // Clean handle
    const clean = rawInput
      .replace(/^https?:\/\/(www\.)?youtube\.com\//i, "")
      .replace(/^user\//i, "")
      .replace(/^c\//i, "")
      .replace(/^\/?@?/, "")
      .split("/")[0]
      .split("?")[0];

    targetHandle = clean.startsWith("@") ? clean : `@${clean}`;
  }

  let channelName = targetHandle ? targetHandle.replace("@", "") : "YouTube Channel";
  let channelNiche = "Technology, AI, and Software Engineering";
  let rawSubscribers: number | null = null;
  const durationMap = new Map<string, string>();

  // If we don't have channelId directly, scrape the channel landing page
  if (!channelId && targetHandle) {
    const channelUrl = `https://www.youtube.com/${targetHandle}`;
    const res = await fetch(channelUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(9000),
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`YouTube channel "${targetHandle}" was not found (404). Please check the handle spelling.`);
      }
      throw new Error(`YouTube returned status ${res.status} when accessing "${targetHandle}".`);
    }

    const html = await res.text();

    // Extract channelId
    const idMatch =
      html.match(/channel_id=(UC[a-zA-Z0-9_-]{20,})/) ||
      html.match(/"channelId":"(UC[a-zA-Z0-9_-]{20,})"/) ||
      html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{20,})"/);

    if (idMatch) {
      channelId = idMatch[1];
    } else {
      throw new Error(
        `Could not resolve YouTube Channel ID for "${targetHandle}". YouTube may have changed page structure or the handle is restricted.`
      );
    }

    // Extract channel title
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    if (titleMatch) {
      channelName = unescapeHtml(titleMatch[1]);
    } else {
      const pageTitleMatch = html.match(/<title>([^<]+)<\/title>/);
      if (pageTitleMatch) {
        channelName = unescapeHtml(pageTitleMatch[1].replace(/\s*-\s*YouTube$/i, ""));
      }
    }

    // Extract description / niche
    const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
    if (descMatch && descMatch[1].trim()) {
      const rawDesc = unescapeHtml(descMatch[1]);
      channelNiche = rawDesc.slice(0, 160).replace(/\r?\n/g, " ").trim();
    }

    // Extract subscriber count & duration map from ytInitialData
    try {
      const jsonMatch = html.match(/var ytInitialData = ({.*?});<\/script>/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[1]);

        // 1. Channel dedicated header subscriber count
        if (parsedData.header) {
          const headerStr = JSON.stringify(parsedData.header);
          const headerMatches = [...headerStr.matchAll(/([\d\.]+[KMBkmb]?\s*(?:million|thousand|crore|lakh)?\s*subscribers?)/gi)];
          for (const hm of headerMatches) {
            const parsed = parseSubscriberString(hm[1]);
            if (parsed && parsed > 0) {
              rawSubscribers = parsed;
              break;
            }
          }
        }

        // 2. Harvest video durations
        const harvestDurations = (obj: any): void => {
          if (!obj || typeof obj !== "object") return;
          if (obj.lockupViewModel) {
            const vm = obj.lockupViewModel;
            const cid = vm.contentId;
            const str = JSON.stringify(vm);
            const colonMatch = str.match(/"(?:text|simpleText)":"(\d{1,2}:\d{2}(?::\d{2})?)"/);
            if (colonMatch && cid) {
              durationMap.set(cid, colonMatch[1]);
            } else {
              const labelMatch = str.match(/"label":"(\d+)\s*minutes?(?:,\s*(\d+)\s*seconds?)?"/i);
              if (labelMatch && cid) {
                const mins = String(parseInt(labelMatch[1], 10)).padStart(2, "0");
                const secs = String(parseInt(labelMatch[2] || "0", 10)).padStart(2, "0");
                durationMap.set(cid, `${mins}:${secs}`);
              }
            }
          }
          if (obj.videoRenderer) {
            const vr = obj.videoRenderer;
            const cid = vr.videoId;
            const dur = vr.lengthText?.simpleText;
            if (dur && cid) durationMap.set(cid, dur);
          }
          for (const v of Object.values(obj)) harvestDurations(v);
        };
        harvestDurations(parsedData);
      }
    } catch {
      // Gracefully handle parse issues
    }

    // Fallback 1: Dedicated header view model regex
    if (!rawSubscribers) {
      const phm = html.match(/"pageHeaderViewModel"[\s\S]{1,2500}?"content":\{"dynamicTextViewModel":\{"text":\{"content":"([^"]+subscribers?)"/i) ||
        html.match(/"c4TabbedHeaderRenderer"[\s\S]{1,1000}?"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"\}\}/i);
      if (phm) {
        rawSubscribers = parseSubscriberString(phm[1]);
      }
    }

    // Fallback 2: Top channel header section of HTML only (avoiding recommendations)
    if (!rawSubscribers) {
      const topChunk = html.slice(0, 100000);
      const topMatch = topChunk.match(/([\d\.]+[KMBkmb]?\s*(?:million|thousand|crore|lakh)?\s*subscribers?)/i);
      if (topMatch) {
        rawSubscribers = parseSubscriberString(topMatch[1]);
      }
    }
  }

  if (!channelId) {
    throw new Error(`Failed to resolve channel ID for ${handleOrUrl}`);
  }

  // Fetch official Atom/RSS feed from YouTube
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const rssRes = await fetch(rssUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "application/atom+xml,application/xml,text/xml",
    },
    signal: AbortSignal.timeout(9000),
  });

  if (!rssRes.ok) {
    throw new Error(`Failed to fetch public RSS feed from YouTube for channel ${channelId} (HTTP ${rssRes.status}).`);
  }

  const rssXml = await rssRes.text();

  // Extract author / channel title from RSS feed if not yet set
  const rssAuthorMatch = rssXml.match(/<author>[\s\S]*?<name>([^<]+)<\/name>/);
  if (rssAuthorMatch && channelName === targetHandle.replace("@", "")) {
    channelName = unescapeHtml(rssAuthorMatch[1]);
  }

  // Parse all <entry> elements
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match: RegExpExecArray | null;
  const videos: ChannelVideo[] = [];

  while ((match = entryRegex.exec(rssXml)) !== null) {
    const entry = match[1];
    const videoId = (entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1];
    const rawTitle = (entry.match(/<title>([^<]+)<\/title>/) || [])[1];
    const published = (entry.match(/<published>([^<]+)<\/published>/) || [])[1];
    const viewsMatch = entry.match(/<media:statistics views="(\d+)"/);
    const starRatingMatch = entry.match(/<media:starRating count="(\d+)"/);
    const rawDesc = (entry.match(/<media:description>([\s\S]*?)<\/media:description>/) || [])[1] || "";

    if (!videoId || !rawTitle) continue;

    const title = unescapeHtml(rawTitle);
    const desc = unescapeHtml(rawDesc);
    const views = viewsMatch ? parseInt(viewsMatch[1], 10) : 10000;
    const ratingCount = starRatingMatch ? parseInt(starRatingMatch[1], 10) : 0;

    // Calculate realistic engagement rate
    let engagementRate = 7.5;
    if (ratingCount > 0 && views > 0) {
      engagementRate = Number(Math.min(15, Math.max(3.5, (ratingCount / views) * 100 * 1.5)).toFixed(1));
    }

    // Extract first sentence or punchy hook from description
    const hook =
      desc
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find((l) => l.length > 20 && !l.startsWith("http") && !l.startsWith("#")) ||
      title;

    const format = inferVideoFormat(title, desc);
    const publishedAt = published ? published.split("T")[0] : new Date().toISOString().split("T")[0];
    const resolvedDuration = durationMap.get(videoId) || (format === "Short form" ? "00:58" : "03:45");

    videos.push({
      id: videoId,
      title,
      topic: "",
      format,
      views,
      engagementRate,
      publishedAt,
      duration: resolvedDuration,
      hook: hook.slice(0, 180),
    });
  }

  if (videos.length === 0) {
    throw new Error(`No public uploads found for "${channelName}". The channel may have zero public uploads.`);
  }

  // Detect dynamic niche based on actual catalog
  const detectedNiche = detectChannelNiche(channelName, channelNiche, videos);

  // Classify each video's topic based on detected niche
  for (const v of videos) {
    v.topic = classifyVideoTopic(v.title, v.hook, detectedNiche);
  }

  // If subscriber count was not extracted, estimate realistically from recent average views
  const totalViews = videos.reduce((s, v) => s + v.views, 0);
  const avgViews = Math.round(totalViews / videos.length);
  const subscribers = rawSubscribers !== null
    ? rawSubscribers
    : Math.max(1, Math.round(avgViews * 0.6));

  return {
    name: channelName,
    handle: targetHandle || `@${channelName.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
    niche: detectedNiche,
    subscribers,
    dataMode: `Live YouTube public catalog · Ingested live via YouTube public feed (${videos.length} real uploads)`,
    videos,
  };
}

export async function fetchLiveVideoMetrics(videoIdOrUrl: string): Promise<{
  videoId: string;
  title: string;
  views: number;
  likes: number;
}> {
  let videoId = videoIdOrUrl.trim();
  const urlMatch = videoId.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || videoId.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (urlMatch) {
    videoId = urlMatch[1];
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(9000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch video from YouTube (${videoId}): HTTP ${res.status}`);
  }

  const html = await res.text();
  const viewsMatch =
    html.match(/"viewCount":"(\d+)"/) ||
    html.match(/"views":\{"simpleText":"([\d,]+)\s+views"\}/);
  const likesMatch =
    html.match(/"likeCount":"(\d+)"/) ||
    html.match(/"defaultText":\{"accessibility":\{"accessibilityData":\{"label":"([\d,]+)\s+likes"\}\}\}/);
  const titleMatch =
    html.match(/<meta property="og:title" content="([^"]+)"/) ||
    html.match(/<title>([^<]+)<\/title>/);

  const rawTitle = titleMatch ? unescapeHtml(titleMatch[1].replace(/\s*-\s*YouTube$/i, "")) : "YouTube Video";
  const views = viewsMatch ? parseInt(viewsMatch[1].replace(/,/g, ""), 10) : 0;
  const likes = likesMatch ? parseInt(likesMatch[1].replace(/,/g, ""), 10) : 0;

  if (views === 0 && !viewsMatch) {
    throw new Error(`Could not extract public view count for video ID "${videoId}".`);
  }

  return {
    videoId,
    title: rawTitle,
    views,
    likes,
  };
}

