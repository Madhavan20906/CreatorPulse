import { Activity, Bell, ChevronRight, CircleHelp, Command, LayoutDashboard, Lightbulb, Library, LineChart, Menu, Plus, Search, Settings, ShieldCheck, Sparkles, Target, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'wouter';

const nav = [
  { href: '/dashboard', label: 'Pulse', icon: LayoutDashboard },
  { href: '/channel', label: 'Channel intelligence', icon: LineChart },
  { href: '/opportunities', label: 'Opportunities', icon: Target },
  { href: '/create', label: 'Create', icon: Sparkles },
  { href: '/shorts', label: 'Shorts lab', icon: Plus },
  { href: '/qa', label: 'Quality gate', icon: ShieldCheck },
  { href: '/calendar', label: 'Calendar', icon: Library },
  { href: '/analytics', label: 'Analytics', icon: LineChart },
  { href: '/memory', label: 'Memory', icon: Lightbulb },
  { href: '/activity', label: 'Agent activity', icon: Activity },
];

export function Logo({ dark = false }: { dark?: boolean }) {
  return <Link href="/" data-testid="link-logo" className="flex items-center gap-2.5">
    <span className={`grid h-8 w-8 place-items-center rounded-[10px] ${dark ? 'bg-[#d8f66a] text-[#20243b]' : 'bg-[#20243b] text-[#d8f66a]'}`}><span className="h-3 w-3 rounded-full border-[3px] border-current" /></span>
    <span className={`display text-[17px] font-bold tracking-tight ${dark ? 'text-[#f2eedf]' : 'text-[#20243b]'}`}>CreatorPulse</span>
  </Link>;
}

export function Shell({ children, title, eyebrow }: { children: React.ReactNode; title?: string; eyebrow?: string }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  return <div className="min-h-[100dvh] bg-background">
    <aside className={`fixed inset-y-0 left-0 z-30 flex w-[250px] flex-col bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform duration-300 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between px-2"><Logo dark /><button className="rounded-lg p-2 text-sidebar-foreground/70 md:hidden" onClick={() => setOpen(false)} data-testid="button-close-sidebar"><X size={18} /></button></div>
      <div className="mt-9 px-2"><div className="eyebrow !text-sidebar-foreground/45">Operating system</div><div className="mt-3 flex items-center gap-2 rounded-xl bg-sidebar-accent px-3 py-2.5"><div className="grid h-7 w-7 place-items-center rounded-full bg-[#f28b67] text-[11px] font-bold text-[#20243b]">AR</div><div><div className="text-xs font-semibold">Alex Rivera</div><div className="mono text-[9px] text-sidebar-foreground/55">@buildwithalex</div></div><ChevronRight className="ml-auto text-sidebar-foreground/35" size={14}/></div></div>
      <nav className="mt-7 flex-1 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition-colors ${location === href || (href === '/opportunities' && location.startsWith('/opportunities')) ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}><Icon size={16} strokeWidth={1.8}/><span>{label}</span>{href === '/opportunities' && <span className="mono ml-auto rounded-full bg-[#f28b67] px-1.5 py-0.5 text-[9px] font-medium text-[#20243b]">04</span>}</Link>)}
      </nav>
      <div className="space-y-1 border-t border-sidebar-border pt-3">
        <Link href="/before-publish" data-testid="link-before-publish" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"><CircleHelp size={16}/><span>Before I publish</span></Link>
        <Link href="/settings" data-testid="link-settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"><Settings size={16}/><span>Settings</span></Link>
      </div>
      <div className="mt-4 flex items-center gap-2 px-2"><span className="h-2 w-2 rounded-full bg-[#d8f66a]"/><span className="mono text-[9px] uppercase tracking-wider text-sidebar-foreground/45">Demo data live</span></div>
    </aside>
    {open && <button aria-label="Close menu" className="fixed inset-0 z-20 bg-[#20243b]/40 md:hidden" onClick={() => setOpen(false)} data-testid="button-overlay-close" />}
    <main className="md:pl-[250px]">
      <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md md:px-9">
        <div className="flex items-center gap-3"><button className="rounded-lg p-2 md:hidden" onClick={() => setOpen(true)} data-testid="button-open-sidebar"><Menu size={19}/></button><div><div className="eyebrow">{eyebrow || 'Creator command center'}</div><h1 className="display mt-1 text-xl font-bold tracking-tight">{title || 'Good morning, Alex'}</h1></div></div>
        <div className="flex items-center gap-2"><button className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground sm:flex" data-testid="button-search"><Search size={14}/> Search <span className="mono ml-4 text-[9px] opacity-50">⌘ K</span></button><button className="relative rounded-xl border border-border bg-card p-2.5 text-muted-foreground hover:text-foreground" data-testid="button-notifications"><Bell size={16}/><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#f28b67]"/></button></div>
      </header>
      <div className="mx-auto max-w-[1440px] px-5 py-7 md:px-9 lg:px-12">{children}</div>
    </main>
  </div>;
}

export function Button({ children, onClick, variant = 'primary', href, testId = 'button-action', disabled = false, className = '' }: { children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'coral'; href?: string; testId?: string; disabled?: boolean; className?: string }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 ${variant === 'primary' ? 'bg-primary text-primary-foreground hover:opacity-90' : variant === 'coral' ? 'bg-[#f28b67] text-[#20243b] hover:brightness-95' : variant === 'secondary' ? 'border border-border bg-card text-foreground hover:bg-secondary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'} ${className}`;
  if (href) return <Link href={href} className={cls} data-testid={testId}>{children}</Link>;
  return <button className={cls} onClick={onClick} disabled={disabled} data-testid={testId}>{children}</button>;
}

export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="eyebrow">{eyebrow}</div><h2 className="display mt-2 text-3xl font-bold tracking-[-.04em] md:text-4xl">{title}</h2>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>{action}</div>;
}

export function Meter({ value, color = 'lime' }: { value: number; color?: 'lime' | 'coral' | 'navy' }) {
  return <div className="h-1.5 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${color === 'lime' ? 'bg-[#b8d954]' : color === 'coral' ? 'bg-[#f28b67]' : 'bg-primary'}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }}/></div>;
}

export function LoadingState({ label = 'Reading your channel signals' }: { label?: string }) {
  return <div className="panel flex min-h-[220px] flex-col items-center justify-center gap-4"><div className="h-8 w-8 animate-pulse rounded-full border-4 border-secondary border-t-primary"/><p className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p></div>;
}
export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return <div className="panel flex min-h-[180px] flex-col items-center justify-center gap-3 p-6 text-center"><div className="display text-lg font-bold">Signal interrupted.</div><p className="text-sm text-muted-foreground">We couldn't reach the creator memory right now.</p>{onRetry && <Button onClick={onRetry} variant="secondary" testId="button-retry">Try again</Button>}</div>;
}
export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return <div className="panel flex min-h-[220px] flex-col items-center justify-center p-8 text-center"><div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-muted-foreground"><Command size={19}/></div><div className="display text-lg font-bold">{title}</div><p className="mt-1 max-w-sm text-sm text-muted-foreground">{detail}</p>{action && <div className="mt-5">{action}</div>}</div>;
}