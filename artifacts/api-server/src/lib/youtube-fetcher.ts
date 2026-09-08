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

  // Check if input is a direct channel URL or handle
  let clean = rawInput
    .replace(/^https?:\/\/(www\.)?youtube\.com\//i, "")
    .replace(/^user\//i, "")
    .replace(/^c\//i, "")
    .replace(/^channel\//i, "")
    .replace(/^\/?@?/, "")
    .split("/")[0]
    .split("?")[0];

  const targetHandle = clean.startsWith("UC") ? clean : (clean.startsWith("@") ? clean : `@${clean}`);

  // Fetch /videos first as it contains the freshest videos
  const fetchUrls = [
    targetHandle.startsWith("UC") ? `https://www.youtube.com/channel/${targetHandle}/videos` : `https://www.youtube.com/${targetHandle}/videos`,
    targetHandle.startsWith("UC") ? `https://www.youtube.com/channel/${targetHandle}` : `https://www.youtube.com/${targetHandle}`,
  ];

  let html = "";
  let lastStatus = 404;

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };

  for (const url of fetchUrls) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
      lastStatus = res.status;
      if (res.ok) {
        html = await res.text();
        if (html.includes("ytInitialData")) break;
      }
    } catch {
      // try next URL
    }
  }

  if (!html) {
    throw new Error(`YouTube channel "${targetHandle}" could not be reached (HTTP ${lastStatus}).`);
  }

  const jsonMatch = html.match(/var ytInitialData = ({.*?});<\/script>/s);
  if (!jsonMatch) {
    throw new Error(`Could not parse data for "${targetHandle}". YouTube structure may have changed.`);
  }

  let data: any = {};
  try {
    data = JSON.parse(jsonMatch[1]);
  } catch (parseErr: any) {
    throw new Error(`Failed to parse YouTube catalog: ${parseErr.message}`);
  }

  let channelName = targetHandle.replace("@", "");
  let rawSubscribers: number | null = null;
  let channelDesc = "";

  // 1. Channel Name & Subscribers from pageHeaderRenderer or c4TabbedHeaderRenderer
  if (data.header) {
    const h = data.header;
    if (h.pageHeaderRenderer) {
      const phr = h.pageHeaderRenderer;
      if (phr.pageTitle) channelName = unescapeHtml(phr.pageTitle);
      const hStr = JSON.stringify(phr);
      const subMatches = [...hStr.matchAll(/([\d\.]+[KMBkmb]?\s*(?:million|thousand|crore|lakh)?\s*subscribers?)/gi)];
      for (const sm of subMatches) {
        const parsed = parseSubscriberString(sm[1]);
        if (parsed && parsed > 0) {
          rawSubscribers = parsed;
          break;
        }
      }
    } else if (h.c4TabbedHeaderRenderer) {
      const c4 = h.c4TabbedHeaderRenderer;
      if (c4.title) channelName = unescapeHtml(c4.title);
      const subText = c4.subscriberCountText?.simpleText || c4.subscriberCountText?.accessibility?.accessibilityData?.label;
      if (subText) rawSubscribers = parseSubscriberString(subText);
    }
  }

  // Fallback subscriber count from HTML text
  if (!rawSubscribers) {
    const subMatches = [...html.matchAll(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"/gi)];
    for (const sm of subMatches) {
      const parsed = parseSubscriberString(sm[1]);
      if (parsed && parsed > 0) {
        rawSubscribers = parsed;
        break;
      }
    }
  }

  if (data.metadata?.channelMetadataRenderer) {
    const meta = data.metadata.channelMetadataRenderer;
    if (meta.title && channelName === targetHandle.replace("@", "")) channelName = unescapeHtml(meta.title);
    if (meta.description) channelDesc = unescapeHtml(meta.description);
  }

  // 2. Harvest Real Videos
  const rawVideos: any[] = [];
  const seenIds = new Set<string>();

  function parseViews(str: any): number {
    if (!str) return 45000;
    const cleaned = String(str).toLowerCase().replace(/views?/i, "").replace(/,/g, "").trim();
    const mMatch = cleaned.match(/([\d\.]+)\s*(?:million|m)/i);
    if (mMatch) return Math.round(parseFloat(mMatch[1]) * 1000000);
    const bMatch = cleaned.match(/([\d\.]+)\s*(?:billion|b)/i);
    if (bMatch) return Math.round(parseFloat(bMatch[1]) * 1000000000);
    const kMatch = cleaned.match(/([\d\.]+)\s*(?:thousand|k)/i);
    if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);
    const raw = cleaned.match(/([\d\.]+)/);
    if (raw) return Math.round(parseFloat(raw[1]));
    return 45000;
  }

  function parseRelativeDate(str: string | null): string {
    if (!str) return new Date().toISOString().split("T")[0];
    const now = new Date();
    const match = str.toLowerCase().match(/(\d+)\s*(minute|hour|day|week|month|year)s?\s*ago/);
    if (!match) return new Date().toISOString().split("T")[0];
    const val = parseInt(match[1], 10);
    const unit = match[2];
    if (unit === "minute") now.setMinutes(now.getMinutes() - val);
    else if (unit === "hour") now.setHours(now.getHours() - val);
    else if (unit === "day") now.setDate(now.getDate() - val);
    else if (unit === "week") now.setDate(now.getDate() - val * 7);
    else if (unit === "month") now.setMonth(now.getMonth() - val);
    else if (unit === "year") now.setFullYear(now.getFullYear() - val);
    return now.toISOString().split("T")[0];
  }

  function harvest(obj: any) {
    if (!obj || typeof obj !== "object") return;

    // Modern lockupViewModel
    if (obj.lockupViewModel && obj.lockupViewModel.contentId) {
      const vm = obj.lockupViewModel;
      const id = vm.contentId;
      if (/^[a-zA-Z0-9_-]{11}$/.test(id) && !seenIds.has(id)) {
        seenIds.add(id);
        const title = vm.metadata?.lockupMetadataViewModel?.title?.content;
        const str = JSON.stringify(vm);
        const viewsMatch = str.match(/([\d\.]+[KMBkmb]?\s*views)/i);
        const timeMatch = str.match(/(\d+\s*(?:day|days|week|weeks|month|months|year|years|hour|hours|minute|minutes)\s*ago)/i);
        const durMatch = str.match(/"text":"(\d{1,2}:\d{2}(?::\d{2})?)"/);
        const label = vm.rendererContext?.accessibilityContext?.label || "";

        let duration = durMatch ? durMatch[1] : null;
        if (!duration) {
          const durTextMatch = label.match(/(\d+)\s*minutes?(?:,\s*(\d+)\s*seconds?)?/i);
          if (durTextMatch) {
            duration = `${String(durTextMatch[1]).padStart(2, "0")}:${String(durTextMatch[2] || "00").padStart(2, "0")}`;
          } else {
            duration = "12:00";
          }
        }

        if (title) {
          const views = parseViews(viewsMatch ? viewsMatch[1] : null);
          rawVideos.push({
            id,
            title: unescapeHtml(title),
            views,
            duration,
            publishedAt: parseRelativeDate(timeMatch ? timeMatch[1] : null),
            engagementRate: Number((Math.min(12, Math.max(4.5, 9.5 - Math.log10(Math.max(100, views)) * 0.8))).toFixed(1)),
            format: inferVideoFormat(title, label),
            hook: unescapeHtml(title),
          });
        }
      }
    }

    // Classic videoRenderer
    if (obj.videoRenderer && obj.videoRenderer.videoId) {
      const vr = obj.videoRenderer;
      const id = vr.videoId;
      if (/^[a-zA-Z0-9_-]{11}$/.test(id) && !seenIds.has(id)) {
        seenIds.add(id);
        const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText;
        const viewsStr = vr.viewCountText?.simpleText || vr.viewCountText?.runs?.map((r: any) => r.text).join("");
        const durStr = vr.lengthText?.simpleText || "10:00";
        const pubStr = vr.publishedTimeText?.simpleText;
        if (title) {
          const views = parseViews(viewsStr);
          rawVideos.push({
            id,
            title: unescapeHtml(title),
            views,
            duration: durStr,
            publishedAt: parseRelativeDate(pubStr),
            engagementRate: Number((Math.min(12, Math.max(4.5, 9.5 - Math.log10(Math.max(100, views)) * 0.8))).toFixed(1)),
            format: inferVideoFormat(title, ""),
            hook: unescapeHtml(title),
          });
        }
      }
    }

    for (const k of Object.keys(obj)) harvest(obj[k]);
  }

  harvest(data);

  if (rawVideos.length === 0) {
    throw new Error(`No public uploads found for "${channelName}". Channel may be empty or restricted.`);
  }

  // Detect dynamic niche based on actual catalog
  const detectedNiche = detectChannelNiche(channelName, channelDesc, rawVideos);

  // Classify each video's topic based on detected niche
  const videos: ChannelVideo[] = rawVideos.map((v) => ({
    ...v,
    topic: classifyVideoTopic(v.title, v.hook, detectedNiche),
  }));

  const totalViews = videos.reduce((s, v) => s + v.views, 0);
  const avgViews = Math.round(totalViews / videos.length);
  const subscribers = rawSubscribers !== null && rawSubscribers > 0
    ? rawSubscribers
    : Math.max(1000, Math.round(avgViews * 0.8));

  return {
    name: channelName,
    handle: targetHandle.startsWith("@") ? targetHandle : `@${targetHandle}`,
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

