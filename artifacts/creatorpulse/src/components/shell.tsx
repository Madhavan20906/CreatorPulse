import {
  Activity,
  ArrowUpRight,
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  Command,
  FileText,
  LayoutDashboard,
  Lightbulb,
  Library,
  LineChart,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Video,
  X,
  LogOut,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useGetChannel,
  useGetSettings,
  useListActivity,
  useListOpportunities,
} from '@workspace/api-client-react';

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
  return (
    <Link href="/" data-testid="link-logo" className="flex items-center gap-2.5">
      <span
        className={`grid h-8 w-8 place-items-center rounded-[10px] overflow-hidden ${
          dark ? 'bg-[#292d47] text-[#d8f66a] border border-[#3c415e]' : 'bg-[#20243b] text-[#d8f66a] border border-[#373c5c]'
        }`}
      >
        <svg
          viewBox="0 0 32 32"
          className="h-5 w-5 fill-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="16" cy="16" r="12" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5" />
          <path
            d="M 6 16 H 10 L 13 12 L 15 20 L 18 8 L 21 21 L 23 15 L 24 16 H 26"
            stroke={dark ? '#d8f66a' : '#d8f66a'}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="18" cy="8" r="1.5" fill="#efff85" />
        </svg>
      </span>
      <span
        className={`display text-[17px] font-bold tracking-tight ${
          dark ? 'text-[#f2eedf]' : 'text-[#20243b]'
        }`}
      >
        CreatorPulse
      </span>
    </Link>
  );
}

export function Shell({
  children,
  title,
  eyebrow,
}: {
  children: React.ReactNode;
  title?: string;
  eyebrow?: string;
}) {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const saved = localStorage.getItem('creatorpulse:read_notifications');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const notificationRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Queries for dynamic identity and search
  const settingsQuery = useGetSettings();
  const activityQuery = useListActivity();
  const opportunitiesQuery = useListOpportunities();
  const channelQuery = useGetChannel();

  const storedName = typeof window !== 'undefined' ? localStorage.getItem('creatorpulse:active_creator_name') : null;
  const creatorName = storedName?.trim() || settingsQuery.data?.name?.trim() || channelQuery.data?.name?.trim() || 'Alex Rivera';
  const initials =
    creatorName
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AR';
  const handle = `@${(creatorName || 'creator').toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  const activities = activityQuery.data || [];
  const unreadCount = activities.filter((a) => !readIds.has(a.id)).length;

  const markAllRead = () => {
    const allIds = new Set(activities.map((a) => a.id));
    setReadIds(allIds);
    try {
      localStorage.setItem(
        'creatorpulse:read_notifications',
        JSON.stringify(Array.from(allIds))
      );
    } catch {}
  };

  const queryClient = useQueryClient();
  const handleSignOut = () => {
    try {
      localStorage.removeItem('creatorpulse:clientState');
      localStorage.removeItem('creatorpulse:lastContentId');
      localStorage.removeItem('creatorpulse:read_notifications');
      localStorage.removeItem('creatorpulse:customChannel');
      localStorage.removeItem('creatorpulse:active_creator_name');
    } catch {}
    toast.success('Signed out. Redirecting to channel onboarding...');
    queryClient.clear();
    setLocation('/onboarding');
  };

  // Keyboard shortcut for Cmd+K / Ctrl+K search and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [searchOpen]);

  // Click outside to close notifications
  useEffect(() => {
    if (!notificationsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen]);

  // Filtered search results
  const qClean = searchQuery.toLowerCase().trim();

  const pageResults = nav
    .concat([
      { href: '/before-publish', label: 'Before I publish', icon: CircleHelp },
      { href: '/settings', label: 'Settings', icon: Settings },
    ])
    .filter(
      (p) =>
        !qClean ||
        p.label.toLowerCase().includes(qClean) ||
        p.href.toLowerCase().includes(qClean)
    );

  const oppResults = (opportunitiesQuery.data || [])
    .filter(
      (o) =>
        !qClean ||
        o.title.toLowerCase().includes(qClean) ||
        o.topic.toLowerCase().includes(qClean) ||
        o.format.toLowerCase().includes(qClean)
    )
    .slice(0, 4);

  const videoResults = (channelQuery.data?.videos || [])
    .filter(
      (v) =>
        !qClean ||
        v.title.toLowerCase().includes(qClean) ||
        v.topic.toLowerCase().includes(qClean)
    )
    .slice(0, 4);

  const hasAnyResults =
    pageResults.length > 0 || oppResults.length > 0 || videoResults.length > 0;

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[250px] flex-col bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform duration-300 md:translate-x-0 sidebar-scroll ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-2 shrink-0">
          <Logo dark />
          <button
            className="rounded-lg p-2 text-sidebar-foreground/70 md:hidden"
            onClick={() => setOpen(false)}
            data-testid="button-close-sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Creator Profile Badge */}
        <div className="mt-9 px-2 shrink-0">
          <div className="eyebrow !text-sidebar-foreground/45">Operating system</div>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="group mt-3 flex items-center gap-2.5 rounded-xl bg-sidebar-accent px-3 py-2.5 transition-all hover:bg-sidebar-accent/80"
            data-testid="link-sidebar-profile"
            title="Manage creator profile & settings"
          >
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f28b67] text-[11px] font-bold text-[#20243b]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold group-hover:text-[#d8f66a] transition-colors">
                {creatorName}
              </div>
              <div className="mono truncate text-[9px] text-sidebar-foreground/55">
                {handle}
              </div>
            </div>
            <Settings
              className="ml-auto shrink-0 text-sidebar-foreground/35 group-hover:text-[#d8f66a] transition-colors"
              size={13}
            />
          </Link>
          <button
            onClick={handleSignOut}
            className="mt-2 flex w-full items-center justify-between gap-1.5 rounded-lg border border-[#3c415e] bg-[#20243b]/80 px-2.5 py-1.5 text-[11px] font-medium text-sidebar-foreground/75 hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-400 transition-all shadow-sm"
            data-testid="button-sign-out"
            title="Sign out of current channel and switch account"
          >
            <span className="flex items-center gap-1.5">
              <LogOut size={12} className="shrink-0" /> Sign out
            </span>
            <span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">Switch</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="mt-6 flex-1 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold transition-colors ${
                location === href ||
                (href === '/opportunities' && location.startsWith('/opportunities'))
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <Icon size={16} strokeWidth={1.8} />
              <span>{label}</span>
              {href === '/opportunities' && (
                <span className="mono ml-auto rounded-full bg-[#f28b67] px-1.5 py-0.5 text-[9px] font-medium text-[#20243b]">
                  {opportunitiesQuery.data?.length
                    ? String(opportunitiesQuery.data.length).padStart(2, '0')
                    : '04'}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="space-y-1 border-t border-sidebar-border pt-3 shrink-0">
          <Link
            href="/before-publish"
            data-testid="link-before-publish"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <CircleHelp size={16} />
            <span>Before I publish</span>
          </Link>
          <Link
            href="/settings"
            data-testid="link-settings"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Settings size={16} />
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      {open && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-20 bg-[#20243b]/40 md:hidden"
          onClick={() => setOpen(false)}
          data-testid="button-overlay-close"
        />
      )}

      {/* Main Container */}
      <main className="md:pl-[250px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md md:px-9">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 md:hidden"
              onClick={() => setOpen(true)}
              data-testid="button-open-sidebar"
            >
              <Menu size={19} />
            </button>
            <div>
              <div className="eyebrow">{eyebrow || 'Creator command center'}</div>
              <h1 className="display mt-1 text-xl font-bold tracking-tight">
                {title || `Good morning, ${creatorName.split(' ')[0]}`}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Button (Desktop) */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground sm:flex"
              data-testid="button-search"
              title="Search command center (⌘K)"
            >
              <Search size={14} /> Search{' '}
              <span className="mono ml-4 rounded bg-secondary px-1.5 py-0.5 text-[9px] font-semibold opacity-75">
                ⌘ K
              </span>
            </button>

            {/* Search Button (Mobile) */}
            <button
              onClick={() => setSearchOpen(true)}
              className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-colors hover:text-foreground sm:hidden"
              data-testid="button-search-mobile"
              title="Search"
            >
              <Search size={16} />
            </button>

            {/* Notifications Bell Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-colors hover:text-foreground"
                data-testid="button-notifications"
                title="Agent notifications"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f28b67] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f28b67]" />
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {notificationsOpen && (
                <div
                  className="absolute right-0 top-12 z-50 w-[330px] rounded-2xl border border-border bg-card p-4 shadow-2xl animate-enter sm:w-[380px]"
                  data-testid="notifications-dropdown"
                >
                  <div className="flex items-center justify-between border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        Agent Notifications
                      </span>
                      {unreadCount > 0 ? (
                        <span className="mono rounded-full bg-[#f28b67] px-1.5 py-0.2 text-[9px] font-bold text-[#20243b]">
                          {unreadCount} new
                        </span>
                      ) : (
                        <span className="mono rounded-full bg-secondary px-1.5 py-0.2 text-[9px] text-muted-foreground">
                          caught up
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="inline-flex items-center gap-1 mono text-[10px] text-primary hover:underline"
                        data-testid="button-mark-read"
                      >
                        <CheckCheck size={12} /> Mark read
                      </button>
                    )}
                  </div>

                  <div className="mt-3 max-h-[300px] space-y-2 overflow-y-auto pr-1">
                    {activities.length ? (
                      activities.slice(0, 6).map((item) => {
                        const isUnread = !readIds.has(item.id);
                        return (
                          <div
                            key={item.id}
                            className={`flex items-start gap-3 rounded-xl p-2.5 transition-colors ${
                              isUnread ? 'bg-secondary/60' : 'hover:bg-secondary/30'
                            }`}
                          >
                            <span
                              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                                isUnread ? 'bg-[#f28b67]' : 'bg-[#b8d954]'
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground truncate">
                                  {item.action}
                                </span>
                                <span className="mono shrink-0 text-[9px] text-muted-foreground">
                                  {item.timestamp}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground leading-snug line-clamp-2">
                                {item.detail}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        No agent notifications yet.
                      </div>
                    )}
                  </div>

                  <div className="mt-3 border-t border-border/70 pt-2.5 text-center">
                    <Link
                      href="/activity"
                      onClick={() => setNotificationsOpen(false)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      data-testid="link-view-all-activity"
                    >
                      View full agent audit trace <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-5 py-7 md:px-9 lg:px-12">{children}</div>
      </main>

      {/* Interactive Search / Command Palette Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16 backdrop-blur-sm sm:pt-24"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-enter"
            onClick={(e) => e.stopPropagation()}
            data-testid="modal-search-palette"
          >
            {/* Input Header */}
            <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5">
              <Search size={18} className="text-muted-foreground shrink-0" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages, opportunities, catalog videos..."
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
                data-testid="input-search-query"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              ) : (
                <kbd className="mono rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  ESC
                </kbd>
              )}
            </div>

            {/* Results Body */}
            <div className="max-h-[380px] overflow-y-auto p-3 space-y-4">
              {/* Pages */}
              {pageResults.length > 0 && (
                <div>
                  <div className="eyebrow px-2 mb-1.5 !text-[9px]">Navigation Pages</div>
                  <div className="space-y-1">
                    {pageResults.map(({ href, label, icon: Icon }) => (
                      <button
                        key={href}
                        onClick={() => {
                          setLocation(href);
                          setSearchOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                        data-testid={`search-result-${label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-secondary text-foreground">
                          <Icon size={14} />
                        </span>
                        <span>{label}</span>
                        <span className="mono ml-auto text-[9px] text-muted-foreground">{href}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Opportunities */}
              {oppResults.length > 0 && (
                <div>
                  <div className="eyebrow px-2 mb-1.5 !text-[9px]">Opportunities</div>
                  <div className="space-y-1">
                    {oppResults.map((opp) => (
                      <button
                        key={opp.id}
                        onClick={() => {
                          setLocation(`/opportunities/${opp.id}`);
                          setSearchOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-secondary"
                        data-testid={`search-result-opp-${opp.id}`}
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#edf3c9] text-[#72920f]">
                          <Target size={14} />
                        </span>
                        <div className="min-w-0 flex-1 truncate">
                          <div className="truncate font-semibold">{opp.title}</div>
                          <div className="mono text-[9px] text-muted-foreground">{opp.topic} · {opp.format}</div>
                        </div>
                        <span className="mono text-xs font-bold text-[#72920f]">{opp.score}/100</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Catalog Videos */}
              {videoResults.length > 0 && (
                <div>
                  <div className="eyebrow px-2 mb-1.5 !text-[9px]">Catalog Videos</div>
                  <div className="space-y-1">
                    {videoResults.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setLocation('/channel');
                          setSearchOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-secondary"
                        data-testid={`search-result-video-${v.id}`}
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-secondary text-foreground">
                          <Video size={14} />
                        </span>
                        <div className="min-w-0 flex-1 truncate">
                          <div className="truncate font-semibold">{v.title}</div>
                          <div className="mono text-[9px] text-muted-foreground">{v.topic} · {v.views.toLocaleString()} views</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!hasAnyResults && (
                <div className="py-10 text-center">
                  <p className="text-sm font-medium text-foreground">No matches found</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    No pages, opportunities, or catalog videos matched "{searchQuery}".
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/70 bg-secondary/30 px-4 py-2 text-[10px] text-muted-foreground">
              <span>Quick jump to any feature or topic</span>
              <span className="mono">ESC to close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  href,
  testId = 'button-action',
  disabled = false,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'coral';
  href?: string;
  testId?: string;
  disabled?: boolean;
  className?: string;
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 ${
    variant === 'primary'
      ? 'bg-primary text-primary-foreground hover:opacity-90'
      : variant === 'coral'
      ? 'bg-[#f28b67] text-[#20243b] hover:brightness-95'
      : variant === 'secondary'
      ? 'border border-border bg-card text-foreground hover:bg-secondary'
      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
  } ${className}`;
  if (href)
    return (
      <Link href={href} className={cls} data-testid={testId}>
        {children}
      </Link>
    );
  return (
    <button className={cls} onClick={onClick} disabled={disabled} data-testid={testId}>
      {children}
    </button>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="display mt-2 text-3xl font-bold tracking-[-.04em] md:text-4xl">{title}</h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Meter({
  value,
  color = 'lime',
}: {
  value: number;
  color?: 'lime' | 'coral' | 'navy';
}) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
      <div
        className={`h-full rounded-full ${
          color === 'lime'
            ? 'bg-[#b8d954]'
            : color === 'coral'
            ? 'bg-[#f28b67]'
            : 'bg-primary'
        }`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function LoadingState({ label = 'Reading your channel signals' }: { label?: string }) {
  return (
    <div className="panel flex min-h-[220px] flex-col items-center justify-center gap-4">
      <div className="h-8 w-8 animate-pulse rounded-full border-4 border-secondary border-t-primary" />
      <p className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="panel flex min-h-[180px] flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="display text-lg font-bold">Signal interrupted.</div>
      <p className="text-sm text-muted-foreground">We couldn't reach the creator memory right now.</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" testId="button-retry">
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="panel flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        <Command size={19} />
      </div>
      <div className="display text-lg font-bold">{title}</div>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{detail}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}