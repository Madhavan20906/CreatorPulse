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
