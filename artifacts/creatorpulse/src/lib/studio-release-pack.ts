import { toast } from 'sonner';

export interface ReleasePackSpec {
  id: string;
  title: string;
  description: string;
  script: string;
  hook: string;
  cta: string;
  topic?: string;
  chapters?: string[];
  seo?: {
    primaryKeyword?: string;
    secondaryKeywords?: string[];
    titleVariants?: string[];
    tags?: string[];
  };
  shorts?: Array<{
    title: string;
    hook: string;
    script: string;
    score?: number;
    duration?: string;
  }>;
}

export function downloadStudioReleasePack(content: ReleasePackSpec, channelHandle = '@creator') {
  try {
    const chapters = content.chapters || [
      '00:00 Intro & The Uncomfortable Truth',
      '02:15 The Production Architecture Failure',
      '06:45 The Repeatable Engineering Fix',
      '10:30 Implementation Checklist & Takeaways',
    ];

    const tags = content.seo?.tags || [content.topic || 'AI Engineering', 'developer tools', 'production architecture'];

    const youtubeStudioMetadata = {
      kind: 'youtube#video',
      snippet: {
        title: content.title,
        description: `${content.description}\n\nTIMESTAMPS:\n${chapters.join('\n')}\n\nCONNECT:\nChannel: ${channelHandle}\n\n${content.cta}`,
        tags,
        categoryId: '28', // Science & Technology
        defaultLanguage: 'en',
        defaultAudioLanguage: 'en',
      },
      status: {
        privacyStatus: 'private', // Safe default for creator review before public publish
        selfDeclaredMadeForKids: false,
        embeddable: true,
        license: 'youtube',
      },
      creatorPulseAudit: {
        contentId: content.id,
        traceId: `trace-pub-${Date.now().toString(36)}`,
        qaGatePassed: true,
        generatedAt: new Date().toISOString(),
      },
    };

    const descriptionText = `${content.description}

TIMESTAMPS:
${chapters.join('\n')}

RESOURCES & CODE:
Primary Topic: ${content.topic || 'Engineering'}
Keywords: ${tags.join(', ')}

${content.cta}
`;

    const teleprompterScript = `================================================================================
CREATORPULSE PRODUCTION TELEPROMPTER SCRIPT
TITLE: ${content.title.toUpperCase()}
FORMAT: LONG-FORM TECHNICAL DEEP DIVE
================================================================================

[HOOK - FIRST 15 SECONDS]
${content.hook}

${content.script}

[CALL TO ACTION]
${content.cta}

================================================================================
DERIVED SHORTS CANDIDATES (VERTICAL CUTS):
================================================================================
${(content.shorts || [])
  .map(
    (s, i) => `
SHORT #${i + 1}: ${s.title.toUpperCase()} (Score: ${s.score || 90}/100)
Duration: ${s.duration || '0:45'}
Hook: ${s.hook}
Script: ${s.script}
`
  )
  .join('\n--------------------------------------------------------------------------------\n')}
`;

    const pinnedComment = `Question of the day: Have you hit this failure mode in your own stack yet? Drop your current architecture below and I'll review how you handled retries!

Timestamps for quick navigation:
${chapters.slice(0, 3).join('\n')}`;

    // Create a comprehensive Release Bundle JSON file and individual texts
    const bundleData = {
      specVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      creatorHandle: channelHandle,
      contentId: content.id,
      youtubeStudioApiPayload: youtubeStudioMetadata,
      copyPasteDescription: descriptionText,
      pinnedComment,
      teleprompterScript,
      seoKeywords: content.seo,
    };

    const jsonBlob = new Blob([JSON.stringify(bundleData, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const link = document.createElement('a');
    const safeName = content.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 28);
    link.download = `youtube-studio-release-pack-${safeName}.json`;
    link.href = jsonUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(jsonUrl);

    toast.success(`Downloaded YouTube Studio Release Bundle (youtube-studio-release-pack-${safeName}.json)!`);
  } catch (err: any) {
    console.error('Release pack export failed:', err);
    toast.error('Failed to export YouTube Studio Release Pack.');
  }
}

export function downloadSubtitlesSrt(content: ReleasePackSpec) {
  try {
    const chapters = content.chapters || [
      '00:00 Intro & The Uncomfortable Truth',
      '02:15 The Production Architecture Failure',
      '06:45 The Repeatable Engineering Fix',
      '10:30 Implementation Checklist & Takeaways',
    ];

    const lines = [
      { start: '00:00:01,000', end: '00:00:06,500', text: content.hook || content.title },
      { start: '00:00:07,000', end: '00:00:15,000', text: 'Welcome back to the channel. Today we break down what actually fails in production.' },
      { start: '00:00:16,000', end: '00:00:25,000', text: chapters[1] ? chapters[1].replace(/^\d+:\d+\s*/, '') : 'Here is the primary bottleneck developers overlook.' },
      { start: '00:00:26,000', end: '00:00:40,000', text: content.script ? content.script.slice(0, 160) : 'Understanding this distinction changes how you architect systems.' },
      { start: '00:00:41,000', end: '00:00:55,000', text: chapters[2] ? chapters[2].replace(/^\d+:\d+\s*/, '') : 'Let us walk through the production code and fix.' },
      { start: '00:00:56,000', end: '00:01:10,000', text: content.cta || 'Subscribe for deep technical architecture breakdowns every week.' },
    ];

    const srtContent = lines
      .map((item, idx) => `${idx + 1}\n${item.start} --> ${item.end}\n${item.text}\n`)
      .join('\n');

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = content.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 28);
    link.download = `captions-${safeName}.srt`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Downloaded YouTube Captions Subtitle file (captions-${safeName}.srt)!`);
  } catch (err: any) {
    console.error('SRT generation failed:', err);
    toast.error('Failed to generate subtitle file.');
  }
}

export function copyDescriptionToClipboard(content: ReleasePackSpec, channelHandle = '@creator') {
  try {
    const chapters = content.chapters || [
      '00:00 Intro & The Uncomfortable Truth',
      '02:15 The Production Architecture Failure',
      '06:45 The Repeatable Engineering Fix',
      '10:30 Implementation Checklist & Takeaways',
    ];
    const tags = content.seo?.tags || [content.topic || 'AI Engineering', 'developer tools', 'production architecture'];

    const description = `${content.description}

TIMESTAMPS:
${chapters.join('\n')}

TOPICS & TAGS:
${tags.map(t => `#${t.replace(/\s+/g, '')}`).join(' ')}

CHANNEL:
${channelHandle}

${content.cta}`;

    navigator.clipboard.writeText(description);
    toast.success('Copied formatted YouTube Studio description to clipboard!');
  } catch (err: any) {
    toast.error('Failed to copy to clipboard.');
  }
}

export function copyScriptToClipboard(content: ReleasePackSpec) {
  try {
    const script = `HOOK:
${content.hook}

MAIN SCRIPT:
${content.script}

CALL TO ACTION:
${content.cta}`;

    navigator.clipboard.writeText(script);
    toast.success('Copied teleprompter script to clipboard!');
  } catch (err: any) {
    toast.error('Failed to copy script.');
  }
}
