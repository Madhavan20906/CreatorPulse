/**
 * YouTube Publishing Adapter
 * Handles direct YouTube API video publishing or structured Release Pack generation.
 */

export type PublishingResult = {
  status: "published" | "prepared";
  provider: "youtube_data_api" | "release_pack";
  videoId?: string;
  youtubeUrl?: string;
  releasePack: {
    markdownContent: string;
    jsonSpec: any;
    chapterTimestamps: string[];
    tags: string[];
  };
  message: string;
};

export async function publishToYouTube(content: any): Promise<PublishingResult> {
  const oauthToken = process.env.YOUTUBE_OAUTH_TOKEN;

  // Build the complete production YouTube Studio metadata & release pack
  const tags = content.seo?.tags || [content.topic, "AI engineering", "developer tools"];
  const chapterTimestamps = content.chapters || ["00:00 Intro", "02:30 The Problem", "07:15 Architecture", "12:00 Takeaways"];
  
  const markdownContent = [
    `# ${content.title}`,
    "",
    `**Topic:** ${content.topic}`,
    `**Format:** Long-form Video`,
    `**Publish Date:** ${content.scheduledFor || new Date().toISOString()}`,
    "",
    "## Video Hook",
    content.hook || "",
    "",
    "## Full Script",
    content.script || "",
    "",
    "## Description & Chapter Timestamps",
    content.description || "",
    "",
    "### Chapters",
    ...chapterTimestamps.map((ch: string) => `- ${ch}`),
    "",
    "## Call To Action",
    content.cta || "",
    "",
    "## SEO & Tags",
    `**Primary Keyword:** ${content.seo?.primaryKeyword || content.topic}`,
    `**Tags:** ${tags.join(", ")}`,
  ].join("\n");

  const jsonSpec = {
    snippet: {
      title: content.title,
      description: `${content.description || ""}\n\nTimestamps:\n${chapterTimestamps.join("\n")}\n\n${content.cta || ""}`,
      tags,
      categoryId: "28", // Science & Technology
    },
    status: {
      privacyStatus: "private", // Safe default for initial review
      selfDeclaredMadeForKids: false,
    },
  };

  // If OAuth token is provided, dispatch directly to YouTube Data API v3
  if (oauthToken) {
    try {
      const response = await fetch("https://www.googleapis.com/youtube/v3/videos?part=snippet,status", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${oauthToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonSpec),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`YouTube API returned ${response.status}: ${errorText}`);
      }

      const ytData = (await response.json()) as any;
      const videoId = ytData.id;

      return {
        status: "published",
        provider: "youtube_data_api",
        videoId,
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
        releasePack: {
          markdownContent,
          jsonSpec,
          chapterTimestamps,
          tags,
        },
        message: `Successfully published draft to YouTube channel via Data API v3 (Video ID: ${videoId}).`,
      };
    } catch (apiErr: any) {
      console.error("YouTube API dispatch error:", apiErr);
      throw new Error(`YouTube API upload failed: ${apiErr.message}`);
    }
  }

  // If OAuth token is not configured, generate production Release Pack
  return {
    status: "prepared",
    provider: "release_pack",
    releasePack: {
      markdownContent,
      jsonSpec,
      chapterTimestamps,
      tags,
    },
    message: "Release pack generated with production YouTube Studio metadata, formatted markdown, and API JSON payload. (Configure YOUTUBE_OAUTH_TOKEN for direct YouTube Data API dispatch).",
  };
}
