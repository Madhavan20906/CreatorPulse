import { useState } from 'react';
import { MessageSquare, Send, CheckCircle2, Bot, Sparkles, RefreshCw, ThumbsUp, HelpCircle, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';

export interface CommentItem {
  id: string;
  author: string;
  videoTitle: string;
  text: string;
  timestamp: string;
  intent: 'technical_inquiry' | 'high_praise' | 'skeptical_debate' | 'feature_request';
  sentimentScore: number; // 0 - 100
  draftReply: string;
  status: 'pending' | 'approved' | 'posted';
}

const INITIAL_COMMENTS: CommentItem[] = [
  {
    id: 'c-1',
    author: '@dev_kevin92',
    videoTitle: 'Why AI agents work in a demo but fail in production',
    text: 'What happens when the tool call timeouts after 30s? In our LangGraph setup, the state drifts and enters infinite loops.',
    timestamp: '18m ago',
    intent: 'technical_inquiry',
    sentimentScore: 78,
    draftReply: 'Exactly the failure mode Chapter 2 highlights. You need deterministic checkpointing before invoking any external tool, and a hard retry ceiling with circuit breakers so state reverts cleanly.',
    status: 'pending',
  },
  {
    id: 'c-2',
    author: '@sarah_cloud_arch',
    videoTitle: 'The MCP architecture I wish I had started with',
    text: 'This just saved our platform team 3 weeks of custom REST wrappers. Implementing stdio protocol tomorrow.',
    timestamp: '42m ago',
    intent: 'high_praise',
    sentimentScore: 96,
    draftReply: 'Huge win! Start with the stdio transport first to verify local latency before jumping to SSE. Let me know how the tooling schema benchmarks perform.',
    status: 'pending',
  },
  {
    id: 'c-3',
    author: '@cynical_engineer',
    videoTitle: '5 vector search mistakes every engineer makes',
    text: 'Cosine similarity is just basic linear algebra. Why are people pretending chunking strategies are an AI problem?',
    timestamp: '1h ago',
    intent: 'skeptical_debate',
    sentimentScore: 45,
    draftReply: 'The math is elementary; the retrieval failure is operational. If a chunk splits mid-function signature, your embedding vectors point to meaningless sub-tokens. Real retrieval is parsing, not math.',
    status: 'pending',
  },
  {
    id: 'c-4',
    author: '@alex_builds_saas',
    videoTitle: 'Why AI agents work in a demo but fail in production',
    text: 'Can you do a video on how to evaluate multi-agent loops with deterministic assertions?',
    timestamp: '2h ago',
    intent: 'feature_request',
    sentimentScore: 88,
    draftReply: 'Adding this directly to our Opportunity Map! We are compiling our production evaluation harness into a reproducible test suite for the next deep dive.',
    status: 'pending',
  },
];

const INTENT_BADGES = {
  technical_inquiry: { label: 'Technical Inquiry', color: 'border-blue-500/40 bg-blue-500/10 text-blue-400', icon: HelpCircle },
  high_praise: { label: 'High Resonance', color: 'border-green-500/40 bg-green-500/10 text-green-400', icon: ThumbsUp },
  skeptical_debate: { label: 'Skeptical / Debate', color: 'border-amber-500/40 bg-amber-500/10 text-amber-400', icon: AlertCircle },
  feature_request: { label: 'Catalog Demand Signal', color: 'border-purple-500/40 bg-purple-500/10 text-purple-400', icon: Zap },
};

export function CommunityReplyAgent({ creatorVoice = 'Practical, candid, technically rigorous' }: { creatorVoice?: string }) {
  const [comments, setComments] = useState<CommentItem[]>(INITIAL_COMMENTS);
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customDrafts, setCustomDrafts] = useState<Record<string, string>>({});

  const handleApproveReply = (id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'posted', draftReply: customDrafts[id] || c.draftReply } : c))
    );
    toast.success('Reply posted directly to YouTube channel in creator voice!');
  };

  const handleToggleAutonomous = () => {
    const next = !autonomousMode;
    setAutonomousMode(next);
    if (next) {
      toast.success('Autonomous Auto-Reply Agent activated · Monitoring incoming channel comments');
      // Auto-post all pending replies
      setTimeout(() => {
        setComments((prev) =>
          prev.map((c) => (c.status === 'pending' ? { ...c, status: 'posted' } : c))
        );
        toast.info('Autonomous Agent dispatched 4 replies calibrated to Creator Memory voice.');
      }, 1200);
    } else {
      toast.info('Autonomous agent paused · Switched to Human-in-the-Loop review mode');
    }
  };

  const postedCount = comments.filter((c) => c.status === 'posted').length;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div>
          <div className="eyebrow flex items-center gap-1.5 !text-primary">
            <Bot size={13} /> Autonomous Community Engagement Engine
          </div>
          <h3 className="display mt-1 text-lg font-bold">
            Audience Sentiment & Auto-Reply Agent
          </h3>
          <p className="text-xs text-muted-foreground">
            Classifies viewer comment intent and auto-drafts replies in creator's calibrated voice ({creatorVoice}).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <div className="mono text-[10px] uppercase text-muted-foreground">Engagement Boost</div>
            <div className="font-bold text-[#72920f]">+18.4% ER Lift</div>
          </div>
          <button
            onClick={handleToggleAutonomous}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm ${
              autonomousMode
                ? 'bg-[#d8f66a] text-[#20243b] hover:bg-[#c9e859]'
                : 'border border-border bg-secondary hover:bg-secondary/80 text-foreground'
            }`}
            data-testid="button-toggle-auto-reply"
          >
            <Sparkles size={14} />
            {autonomousMode ? 'Autonomous Daemon Active' : 'Enable Autonomous Mode'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-xl border border-border bg-secondary/40 p-3">
          <div className="eyebrow">Comments Ingested</div>
          <div className="mt-1 display text-2xl font-bold">{comments.length}</div>
          <span className="mono text-[10px] text-[#72920f]">● Live Channel Sync</span>
        </div>
        <div className="rounded-xl border border-border bg-secondary/40 p-3">
          <div className="eyebrow">Replies Dispatched</div>
          <div className="mt-1 display text-2xl font-bold">{postedCount} / {comments.length}</div>
          <span className="mono text-[10px] text-muted-foreground">Avg speed: 2.8m</span>
        </div>
        <div className="rounded-xl border border-border bg-secondary/40 p-3">
          <div className="eyebrow">Sentiment Health</div>
          <div className="mt-1 display text-2xl font-bold text-[#72920f]">91 / 100</div>
          <span className="mono text-[10px] text-[#72920f]">Positive Resonance</span>
        </div>
        <div className="rounded-xl border border-border bg-secondary/40 p-3">
          <div className="eyebrow">Voice Alignment</div>
          <div className="mt-1 display text-2xl font-bold">98%</div>
          <span className="mono text-[10px] text-muted-foreground">Calibrated to Memory</span>
        </div>
      </div>

      {/* Comment Stream */}
      <div className="mt-5 space-y-3">
        {comments.map((item) => {
          const badge = INTENT_BADGES[item.intent];
          const Icon = badge.icon;
          const isPosted = item.status === 'posted';

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-4 transition-all ${
                isPosted
                  ? 'border-border/60 bg-secondary/20'
                  : 'border-border bg-secondary/50 shadow-sm'
              }`}
              data-testid={`comment-item-${item.id}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs">{item.author}</span>
                  <span className="text-[11px] text-muted-foreground">on "{item.videoTitle}"</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.color}`}>
                    <Icon size={11} /> {badge.label}
                  </span>
                  <span className="mono text-[10px] text-muted-foreground">{item.timestamp}</span>
                </div>
              </div>

              {/* Viewer Comment Text */}
              <p className="mt-3 text-xs leading-relaxed text-foreground font-medium">
                "{item.text}"
              </p>

              {/* Creator Voice Draft Reply */}
              <div className="mt-3 rounded-lg border border-[#d8f66a]/30 bg-[#20243b] p-3 text-xs text-[#f2eedf]">
                <div className="flex items-center justify-between">
                  <span className="mono text-[10px] text-[#d8f66a] font-bold flex items-center gap-1">
                    <Bot size={12} /> CREATOR VOICE AGENT REPLY
                  </span>
                  {isPosted ? (
                    <span className="inline-flex items-center gap-1 mono text-[10px] text-[#72920f] font-bold">
                      <CheckCircle2 size={12} /> POSTED LIVE TO YOUTUBE
                    </span>
                  ) : (
                    <span className="mono text-[10px] text-[#ff694b] font-bold">
                      PENDING APPROVAL
                    </span>
                  )}
                </div>

                {editingId === item.id ? (
                  <textarea
                    value={customDrafts[item.id] !== undefined ? customDrafts[item.id] : item.draftReply}
                    onChange={(e) => setCustomDrafts({ ...customDrafts, [item.id]: e.target.value })}
                    rows={3}
                    className="mt-2 w-full rounded-md border border-[#3c415e] bg-[#141829] p-2 text-xs text-white"
                  />
                ) : (
                  <p className="mt-2 text-xs leading-relaxed text-[#d5d7e5]">
                    {customDrafts[item.id] || item.draftReply}
                  </p>
                )}

                {/* Reply Actions */}
                {!isPosted && (
                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-[#3c415e] pt-2">
                    <button
                      onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                      className="rounded-lg px-2.5 py-1 text-[11px] font-bold text-[#a0a3b8] hover:text-white"
                    >
                      {editingId === item.id ? 'Done Editing' : 'Edit Reply'}
                    </button>
                    <button
                      onClick={() => handleApproveReply(item.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#d8f66a] px-3 py-1 text-[11px] font-bold text-[#20243b] hover:bg-[#c9e859] transition-all"
                      data-testid={`button-approve-reply-${item.id}`}
                    >
                      <Send size={12} /> Approve & Post Reply
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
