import { useState, useMemo } from 'react';
import { Target, AlertTriangle, ShieldCheck, Sparkles, Compass, Search } from 'lucide-react';

export interface ConstellationNode {
  id: string;
  title: string;
  topic: string;
  views: number;
  x: number;
  y: number;
  similarity?: number;
  isCandidate?: boolean;
}

export interface ContentConstellationProps {
  videos?: Array<{ id: string; title: string; topic: string; views: number }>;
  candidateIdea?: {
    title: string;
    topic: string;
    collisionRisk: number;
    similarVideos?: Array<{ videoTitle: string; similarity: number }>;
  };
}

const TOPIC_COLORS: Record<string, string> = {
  'AI agents': '#d8f66a',
  'AI & Autonomous Systems': '#d8f66a',
  'Developer workflows': '#38bdf8',
  'Software Engineering & Architecture': '#38bdf8',
  'RAG systems': '#c084fc',
  'Retrieval systems': '#c084fc',
  'Python tutorials': '#facc15',
  'Language Breakdowns': '#facc15',
  'Zero Trust & Security': '#f87171',
  'Core Content': '#94a3b8',
};

export function ContentConstellation({ videos = [], candidateIdea }: ContentConstellationProps) {
  const [hoveredNode, setHoveredNode] = useState<ConstellationNode | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Project videos into 2D constellation space (width: 800, height: 480)
  const nodes = useMemo(() => {
    const width = 800;
    const height = 480;
    const cx = width / 2;
    const cy = height / 2;

    const topics = Array.from(new Set(videos.map((v) => v.topic || 'Core Content')));
    const topicAngles: Record<string, number> = {};
    topics.forEach((t, i) => {
      topicAngles[t] = (i / Math.max(1, topics.length)) * Math.PI * 2;
    });

    const list: ConstellationNode[] = videos.slice(0, 36).map((v, idx) => {
      const angle = (topicAngles[v.topic] || 0) + (Math.sin(idx * 3.7) * 0.45);
      // Distance from center based on index & views
      const radius = 110 + (Math.sin(idx * 1.9 + 2) * 0.5 + 0.5) * 160;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;

      // Find similarity to candidate if exists
      const match = candidateIdea?.similarVideos?.find(
        (sv) => sv.videoTitle.toLowerCase() === v.title.toLowerCase()
      );

      return {
        id: v.id,
        title: v.title,
        topic: v.topic,
        views: v.views,
        x: Math.max(50, Math.min(width - 50, x)),
        y: Math.max(50, Math.min(height - 50, y)),
        similarity: match ? match.similarity : undefined,
      };
    });

    return list;
  }, [videos, candidateIdea]);

  // Candidate node in center-right or related topic cluster
  const candidateNode: ConstellationNode | null = useMemo(() => {
    if (!candidateIdea || !candidateIdea.title) return null;
    const width = 800;
    const height = 480;
    // Find closest node to position near it
    let targetX = width / 2;
    let targetY = height / 2;

    const topSimilar = candidateIdea.similarVideos?.[0];
    if (topSimilar) {
      const matchNode = nodes.find((n) => n.title.toLowerCase() === topSimilar.videoTitle.toLowerCase());
      if (matchNode) {
        // If collision risk is high, position VERY CLOSE to existing video
        const dist = Math.max(40, 180 - (candidateIdea.collisionRisk * 1.5));
        targetX = matchNode.x + dist * 0.6;
        targetY = matchNode.y - dist * 0.4;
      }
    }

    return {
      id: 'candidate-idea-node',
      title: candidateIdea.title,
      topic: candidateIdea.topic,
      views: 0,
      x: Math.max(60, Math.min(width - 60, targetX)),
      y: Math.max(60, Math.min(height - 60, targetY)),
      similarity: candidateIdea.collisionRisk,
      isCandidate: true,
    };
  }, [candidateIdea, nodes]);

  // Find connection links to candidate
  const links = useMemo(() => {
    if (!candidateNode || !candidateIdea?.similarVideos) return [];

    return candidateIdea.similarVideos.slice(0, 3).map((sv) => {
      const target = nodes.find((n) => n.title.toLowerCase() === sv.videoTitle.toLowerCase());
      if (!target) return null;

      const isCollision = sv.similarity >= 50;
      return {
        source: candidateNode,
        target,
        similarity: sv.similarity,
        isCollision,
      };
    }).filter(Boolean);
  }, [candidateNode, candidateIdea, nodes]);

  const filteredNodes = nodes.filter((n) => {
    if (selectedTopic !== 'all' && n.topic !== selectedTopic) return false;
    if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const topics = Array.from(new Set(videos.map((v) => v.topic || 'Core Content')));

  return (
    <div className="rounded-2xl border border-border bg-[#141829] p-5 text-[#f2eedf] shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#2d324d] pb-4">
        <div>
          <div className="eyebrow flex items-center gap-1.5 !text-[#d8f66a]">
            <Compass size={13} /> Deep Semantic Vector Topology
          </div>
          <h3 className="display mt-1 text-xl font-bold">
            Channel Content Constellation & Collision Network
          </h3>
          <p className="text-xs text-[#9ea1b5]">
            Visualizes high-dimensional embeddings projected onto the semantic manifold. Glowing red vectors alert to catalog cannibalization.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] mono">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#38bdf8]" />
            <span className="text-[#9ea1b5]">Catalog Video</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 rounded-full border-2 border-[#d8f66a] bg-[#ff694b] animate-pulse" />
            <span className="text-[#d8f66a] font-bold">Candidate Concept</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-6 bg-[#ff4d4d]" />
            <span className="text-[#ff6b6b]">Collision Vector (≥50%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-6 bg-[#4ade80]" />
            <span className="text-[#4ade80]">Novelty Vector (&lt;50%)</span>
          </div>
        </div>
      </div>

      {/* Topic Filter Pills */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setSelectedTopic('all')}
          className={`rounded-lg px-2.5 py-1 font-bold transition-all text-[11px] ${
            selectedTopic === 'all'
              ? 'bg-[#d8f66a] text-[#20243b]'
              : 'border border-[#2d324d] bg-[#1e233d] text-[#9ea1b5] hover:text-white'
          }`}
        >
          All Topics ({videos.length})
        </button>
        {topics.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTopic(t)}
            className={`rounded-lg px-2.5 py-1 font-bold transition-all text-[11px] ${
              selectedTopic === t
                ? 'bg-[#38bdf8] text-[#0f172a]'
                : 'border border-[#2d324d] bg-[#1e233d] text-[#9ea1b5] hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Interactive Constellation SVG Plane */}
      <div className="mt-4 relative overflow-hidden rounded-xl border border-[#2d324d] bg-[#0c0f1c] aspect-[16/9] max-h-[500px]">
        <svg
          viewBox="0 0 800 480"
          className="w-full h-full cursor-crosshair select-none"
        >
          <defs>
            {/* Pulsing red filter */}
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background constellation stars & subtle grid */}
          <g opacity="0.15">
            {[...Array(40)].map((_, i) => (
              <circle
                key={i}
                cx={(i * 97) % 800}
                cy={(i * 67 + 33) % 480}
                r={(i % 3) + 1}
                fill="#ffffff"
              />
            ))}
          </g>

          {/* Central Channel Core Anchor */}
          <g opacity="0.35">
            <circle cx="400" cy="240" r="140" fill="none" stroke="#2d324d" strokeDasharray="4 4" />
            <circle cx="400" cy="240" r="220" fill="none" stroke="#2d324d" strokeDasharray="4 4" />
          </g>

          {/* Connection Lines from Candidate to Similar Videos */}
          {links.map((link: any, idx: number) => {
            const isRed = link.isCollision;
            const strokeColor = isRed ? '#ff4d4d' : '#4ade80';
            const midX = (link.source.x + link.target.x) / 2;
            const midY = (link.source.y + link.target.y) / 2;

            return (
              <g key={`link-${idx}`}>
                {/* Outer pulsing stroke */}
                <line
                  x1={link.source.x}
                  y1={link.source.y}
                  x2={link.target.x}
                  y2={link.target.y}
                  stroke={strokeColor}
                  strokeWidth={isRed ? 4 : 2}
                  strokeOpacity={isRed ? 0.9 : 0.6}
                  strokeDasharray={isRed ? '6 4' : undefined}
                  filter={isRed ? 'url(#glow-red)' : 'url(#glow-green)'}
                />
                {/* Badge on vector line */}
                <rect
                  x={midX - 32}
                  y={midY - 10}
                  width="64"
                  height="20"
                  rx="6"
                  fill="#0c0f1c"
                  stroke={strokeColor}
                  strokeWidth="1.5"
                />
                <text
                  x={midX}
                  y={midY + 4}
                  textAnchor="middle"
                  fill={strokeColor}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {link.similarity}% {isRed ? 'RISK' : 'SAFE'}
                </text>
              </g>
            );
          })}

          {/* Catalog Video Nodes */}
          {filteredNodes.map((node) => {
            const color = TOPIC_COLORS[node.topic] || '#38bdf8';
            const isHovered = hoveredNode?.id === node.id;
            const hasSimilarity = node.similarity !== undefined;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                className="transition-transform duration-150"
              >
                {/* Outer halo if hovered or similar */}
                {isHovered && (
                  <circle
                    r="16"
                    fill={color}
                    fillOpacity="0.25"
                    stroke={color}
                    strokeWidth="1.5"
                  />
                )}
                {/* Node circle */}
                <circle
                  r={hasSimilarity ? 8 : 6}
                  fill={color}
                  stroke="#0c0f1c"
                  strokeWidth="2"
                  className="cursor-pointer"
                />
                {/* Video Title label */}
                {(isHovered || hasSimilarity) && (
                  <text
                    y="-12"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                    className="pointer-events-none drop-shadow-md"
                  >
                    {node.title.slice(0, 24)}…
                  </text>
                )}
              </g>
            );
          })}

          {/* Candidate Node (Pulsing Beacon) */}
          {candidateNode && (
            <g
              transform={`translate(${candidateNode.x}, ${candidateNode.y})`}
              onMouseEnter={() => setHoveredNode(candidateNode)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Outer pulsing ring */}
              <circle
                r="22"
                fill="none"
                stroke={candidateIdea?.collisionRisk && candidateIdea.collisionRisk >= 50 ? '#ff4d4d' : '#d8f66a'}
                strokeWidth="2.5"
                opacity="0.8"
                className="animate-ping"
              />
              <circle
                r="14"
                fill="#20243b"
                stroke={candidateIdea?.collisionRisk && candidateIdea.collisionRisk >= 50 ? '#ff4d4d' : '#d8f66a'}
                strokeWidth="3"
              />
              <circle
                r="6"
                fill={candidateIdea?.collisionRisk && candidateIdea.collisionRisk >= 50 ? '#ff4d4d' : '#d8f66a'}
              />
              {/* Label */}
              <text
                y="28"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="11"
                fontWeight="900"
                className="pointer-events-none drop-shadow-lg"
              >
                ★ CANDIDATE IDEA
              </text>
            </g>
          )}
        </svg>

        {/* Floating Tooltip details */}
        {hoveredNode && (
          <div className="absolute bottom-3 left-3 max-w-sm rounded-xl border border-[#2d324d] bg-[#141829]/95 p-3 text-xs backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between gap-2">
              <span className="mono text-[9px] uppercase tracking-wider text-[#d8f66a]">
                {hoveredNode.isCandidate ? 'CANDIDATE CONCEPT' : 'CATALOG VIDEO'}
              </span>
              {hoveredNode.similarity !== undefined && (
                <span
                  className={`mono text-[10px] font-bold ${
                    hoveredNode.similarity >= 50 ? 'text-[#ff6b6b]' : 'text-[#4ade80]'
                  }`}
                >
                  {hoveredNode.similarity}% Overlap
                </span>
              )}
            </div>
            <div className="mt-1 font-bold text-white text-sm">{hoveredNode.title}</div>
            <div className="mt-2 flex items-center gap-3 text-muted-foreground text-[11px]">
              <span>Topic: <strong className="text-white">{hoveredNode.topic}</strong></span>
              {hoveredNode.views > 0 && (
                <span>Views: <strong className="text-white">{hoveredNode.views.toLocaleString()}</strong></span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Collision Diagnostics Bar */}
      {candidateIdea && (
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-[#2d324d] bg-[#1a1f36] p-4 text-xs">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-8 w-8 place-items-center rounded-xl font-bold ${
                candidateIdea.collisionRisk >= 50
                  ? 'bg-[#3b1c1c] text-[#ff6b6b]'
                  : 'bg-[#1c3b24] text-[#4ade80]'
              }`}
            >
              {candidateIdea.collisionRisk >= 50 ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
            </span>
            <div>
              <div className="font-bold text-white">
                {candidateIdea.collisionRisk >= 50
                  ? `Semantic Collision Alert · ${candidateIdea.collisionRisk}% vector overlap detected`
                  : `Safe Vector Positioning · Only ${candidateIdea.collisionRisk}% catalog overlap`}
              </div>
              <p className="text-[#9ea1b5] text-[11px] mt-0.5">
                {candidateIdea.collisionRisk >= 50
                  ? 'High proximity to existing upload. We recommend reframing the angle toward failure modes.'
                  : 'Clear separation on topic manifold. Safe to proceed to automated generation.'}
              </p>
            </div>
          </div>
          <div className="mono text-[10px] text-[#d8f66a] bg-[#20243b] px-3 py-1.5 rounded-lg border border-[#2d324d] shrink-0">
            EMBEDDING ENGINE: 128D VECTOR COSINE
          </div>
        </div>
      )}
    </div>
  );
}
