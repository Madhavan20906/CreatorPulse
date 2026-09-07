import { useState, useRef, useEffect } from 'react';
import { Download, Image as ImageIcon, Sparkles, RefreshCw, Palette } from 'lucide-react';
import { toast } from 'sonner';

interface ThumbnailStudioProps {
  title: string;
  topic?: string;
  hook?: string;
  authorHandle?: string;
  conceptText?: string;
}

const THEMES = [
  {
    id: 'cyber-dark',
    name: 'Cyber Dark',
    bgStart: '#0f111e',
    bgEnd: '#1e2238',
    accent: '#d8f66a',
    accentText: '#20243b',
    titleColor: '#ffffff',
    subtitleColor: '#a6abbf',
    borderColor: '#3c415e',
  },
  {
    id: 'coral-fire',
    name: 'Coral Impact',
    bgStart: '#1f1315',
    bgEnd: '#33171b',
    accent: '#ff694b',
    accentText: '#ffffff',
    titleColor: '#ffffff',
    subtitleColor: '#f2a89b',
    borderColor: '#5e2d33',
  },
  {
    id: 'electric-blue',
    name: 'Deep Tech Blue',
    bgStart: '#0b162c',
    bgEnd: '#132852',
    accent: '#38bdf8',
    accentText: '#082f49',
    titleColor: '#ffffff',
    subtitleColor: '#93c5fd',
    borderColor: '#1e3a8a',
  },
  {
    id: 'terminal-green',
    name: 'Terminal Green',
    bgStart: '#0a160d',
    bgEnd: '#112918',
    accent: '#4ade80',
    accentText: '#052e16',
    titleColor: '#ffffff',
    subtitleColor: '#86efac',
    borderColor: '#166534',
  },
];

export function ThumbnailStudio({
  title: initialTitle,
  topic = 'AI Engineering',
  hook = 'Production Failure Modes Explained',
  authorHandle = '@creator',
  conceptText = 'DEMO ≠ PRODUCTION',
}: ThumbnailStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [headline, setHeadline] = useState(conceptText || titleToPunchyText(initialTitle));
  const [topicBadge, setTopicBadge] = useState(topic);
  const [calloutText, setCalloutText] = useState('THE UNCOMFORTABLE TRUTH');
  const [themeIdx, setThemeIdx] = useState(0);
  const [showGrid, setShowGrid] = useState(true);

  function titleToPunchyText(t: string): string {
    if (!t) return 'PRODUCTION READY';
    if (t.toLowerCase().includes('demo') && t.toLowerCase().includes('production')) {
      return 'DEMO ≠ PROD';
    }
    const words = t.split(/\s+/).filter((w) => w.length > 2);
    return words.slice(0, 4).join(' ').toUpperCase();
  }

  useEffect(() => {
    if (conceptText) {
      setHeadline(conceptText.toUpperCase());
    } else if (initialTitle) {
      setHeadline(titleToPunchyText(initialTitle));
    }
    if (topic) setTopicBadge(topic.toUpperCase());
  }, [initialTitle, topic, conceptText]);

  useEffect(() => {
    renderCanvas();
  }, [headline, topicBadge, calloutText, themeIdx, showGrid]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1280;
    const height = 720;
    canvas.width = width;
    canvas.height = height;

    const theme = THEMES[themeIdx];

    // 1. Background Gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, theme.bgStart);
    grad.addColorStop(1, theme.bgEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle Tech Grid Overlay
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // 3. Dynamic Glow Aura on right
    const glowGrad = ctx.createRadialGradient(width * 0.85, height * 0.5, 50, width * 0.85, height * 0.5, 450);
    glowGrad.addColorStop(0, `${theme.accent}33`);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, width, height);

    // 4. Outer Accent Border
    ctx.strokeStyle = theme.borderColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    // 5. Left Color Accent Bar
    ctx.fillStyle = theme.accent;
    ctx.fillRect(8, 8, 18, height - 16);

    // 6. Topic Badge (Top Left)
    const badgeX = 80;
    const badgeY = 90;
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, 320, 52, 12);
    ctx.fill();

    ctx.fillStyle = theme.accentText;
    ctx.font = 'bold 24px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(`⚡ ${topicBadge.slice(0, 24)}`, badgeX + 24, badgeY + 26);

    // 7. Callout Sub-Header
    ctx.fillStyle = theme.subtitleColor;
    ctx.font = 'bold 30px monospace';
    ctx.fillText(calloutText, badgeX, badgeY + 110);

    // 8. Main Punchy Headline (High Contrast, Bold, 2-3 lines max)
    ctx.fillStyle = theme.titleColor;
    ctx.font = '900 86px sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 6;

    const words = headline.split(' ');
    let line1 = '';
    let line2 = '';
    if (words.length <= 3) {
      line1 = headline;
    } else {
      const mid = Math.ceil(words.length / 2);
      line1 = words.slice(0, mid).join(' ');
      line2 = words.slice(mid).join(' ');
    }

    ctx.fillText(line1, badgeX, badgeY + 220);
    if (line2) {
      ctx.fillStyle = theme.accent;
      ctx.fillText(line2, badgeX, badgeY + 320);
    }
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 9. Visual Geometric Graphic on the Right
    const cx = width * 0.76;
    const cy = height * 0.52;

    // Outer circle
    ctx.strokeStyle = `${theme.accent}66`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 180, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glowing ring
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, 140, -Math.PI * 0.2, Math.PI * 1.3);
    ctx.stroke();

    // Central Icon / Contrast Box
    ctx.fillStyle = 'rgba(20, 24, 43, 0.92)';
    ctx.strokeStyle = theme.borderColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cx - 100, cy - 90, 200, 180, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = theme.titleColor;
    ctx.font = '900 68px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('97%', cx, cy + 10);
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = theme.accent;
    ctx.fillText('TIME SAVED', cx, cy + 50);
    ctx.textAlign = 'left';

    // 10. Bottom Footer: Handle & Verification Stamp
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(authorHandle, badgeX, height - 70);

    ctx.fillStyle = theme.accent;
    ctx.font = 'bold 20px monospace';
    ctx.fillText('● CREATORPULSE AUTOMATED ASSET · 1080P READY', width - 640, height - 70);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const safeName = headline.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 32);
      link.download = `youtube-thumbnail-${safeName || 'creatorpulse'}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Downloaded 1280x720 YouTube Thumbnail (.png)!');
    } catch (err) {
      toast.error('Failed to generate PNG image download.');
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div>
          <div className="eyebrow flex items-center gap-1.5 !text-primary">
            <ImageIcon size={13} /> Visual Studio Output Engine
          </div>
          <h3 className="display mt-1 text-lg font-bold">
            Live 1280×720 YouTube Thumbnail Generator
          </h3>
          <p className="text-xs text-muted-foreground">
            Renders high-impact YouTube Studio thumbnail art client-side in Canvas with instant PNG download.
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-xl bg-[#d8f66a] px-4 py-2 text-xs font-bold text-[#20243b] hover:bg-[#c9e859] transition-all shadow-sm shrink-0"
          data-testid="button-download-thumbnail"
        >
          <Download size={14} /> Download Thumbnail (.png)
        </button>
      </div>

      {/* Canvas Preview */}
      <div className="mt-4 overflow-hidden rounded-xl border border-[#3c415e] bg-black aspect-video relative shadow-inner">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
          style={{ display: 'block' }}
        />
      </div>

      {/* Quick Controls */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="eyebrow block mb-1">Headline Text</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value.toUpperCase())}
            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 font-bold uppercase"
            data-testid="input-thumbnail-headline"
          />
        </div>
        <div>
          <label className="eyebrow block mb-1">Topic Pill</label>
          <input
            type="text"
            value={topicBadge}
            onChange={(e) => setTopicBadge(e.target.value.toUpperCase())}
            className="w-full rounded-lg border border-input bg-background px-3 py-1.5 font-bold uppercase"
            data-testid="input-thumbnail-topic"
          />
        </div>
        <div>
          <label className="eyebrow block mb-1">Theme Palette</label>
          <div className="flex gap-2">
            {THEMES.map((th, idx) => (
              <button
                key={th.id}
                onClick={() => setThemeIdx(idx)}
                className={`flex-1 rounded-lg border px-2 py-1.5 font-bold transition-all text-[11px] ${
                  themeIdx === idx
                    ? 'border-[#d8f66a] bg-[#20243b] text-[#d8f66a]'
                    : 'border-border bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                {th.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
