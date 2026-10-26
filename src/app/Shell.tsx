import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '../auth/session'
import { ChevronDownIcon, CloseIcon, EntriesIcon, HomeIcon, KloudspotLogo, MenuIcon, PinIcon, PowerIcon } from '../components/icons'
import { ErrorState, Skeleton } from '../components/ui'
import { AlertsBell } from '../features/alerts/AlertsBell'
import { useLiveStatus } from '../live/live'
import { useDashboard } from '../sites/dashboard'

const NAV = [
  { to: '/', label: 'Overview', icon: HomeIcon, end: true },
  { to: '/entries', label: 'Crowd Entries', icon: EntriesIcon, end: false },
]

/** Tablets start with the icon-only rail; desktops start expanded. Phones use the drawer. */
const startCollapsed = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(min-width: 768px) and (max-width: 1023px)').matches

export function Shell() {
  const [collapsed, setCollapsed] = useState(startCollapsed)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { logout } = useSession()
  const { site, sitesStatus, retrySites } = useDashboard()
  const { pathname } = useLocation()

  // Re-evaluate the rail when the viewport crosses the tablet/desktop boundary.
  useEffect(() => {
    const mql = window.matchMedia?.('(min-width: 768px) and (max-width: 1023px)')
    if (!mql) return
    const onChange = () => setCollapsed(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // Phone drawer: close on navigation and on Escape.
  useEffect(() => setDrawerOpen(false), [pathname])
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  // The drawer always shows labels; the collapse toggle only applies from md up.
  const rail = collapsed && !drawerOpen

  return (
    <div className="flex h-full">
      {drawerOpen && (
        <div
          className="animate-fade-up fixed inset-0 z-30 bg-ink/40 md:hidden"
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <aside
        id="app-sidebar"
        className={`sidebar-bg fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col text-white transition-[width,translate] duration-300 ease-out md:static md:translate-x-0 ${
          drawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } ${rail ? 'md:w-[72px]' : 'md:w-60'}`}
      >
        <div className={`flex h-16 items-center px-4 ${rail ? 'justify-center' : 'justify-between'}`}>
          {!rail && <KloudspotLogo />}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            className="hidden rounded p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white md:block"
          >
            <MenuIcon />
          </button>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className="rounded p-1.5 text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white md:hidden"
          >
            <CloseIcon />
          </button>
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1 px-3 pt-2">
          {NAV.map(({ to, label, icon: NavIcon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={rail ? label : undefined}
              className={({ isActive }) =>
                `group relative flex h-11 items-center gap-3 rounded-md px-3 text-[0.95rem] transition-colors focus-visible:outline-2 focus-visible:outline-white ${
                  rail ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-white/20 text-white before:absolute before:inset-y-1.5 before:-left-1 before:w-1 before:rounded before:bg-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <NavIcon className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
              {!rail && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={logout}
          title={rail ? 'Logout' : undefined}
          className={`mx-3 mt-auto mb-5 flex h-11 items-center gap-3 rounded-md px-3 text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white ${
            rail ? 'justify-center' : ''
          }`}
        >
          <PowerIcon size={18} />
          {rail ? <span className="sr-only">Logout</span> : <span>Logout</span>}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line bg-white px-3 sm:gap-4 sm:px-5">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-controls="app-sidebar"
            aria-expanded={drawerOpen}
            className="rounded p-1.5 text-ink hover:bg-page focus-visible:outline-2 focus-visible:outline-brand-500 md:hidden"
          >
            <MenuIcon />
          </button>
          <span className="hidden text-[1.05rem] font-medium whitespace-nowrap sm:inline">Crowd Solutions</span>
          <span className="hidden h-7 w-px bg-line sm:block" aria-hidden="true" />
          <SiteSelect />
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
            <LiveBadge />
            <LanguageToggle />
            <AlertsBell />
            <UserAvatar />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {sitesStatus === 'error' ? (
            <ErrorState message="Couldn't load your sites." onRetry={retrySites} />
          ) : site ? (
            <Suspense fallback={<PageFallback />}>
              <div key={pathname} className="animate-fade-up">
                <Outlet />
              </div>
            </Suspense>
          ) : (
            <div className="space-y-4" aria-busy="true">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-72 w-full" />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function PageFallback() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-72 w-full" />
    </div>
  )
}

function SiteSelect() {
  const { sites, site, setSiteId } = useDashboard()
  return (
    <label className="relative flex h-10 min-w-0 items-center gap-2 rounded-md border border-line pr-8 pl-3 text-sm transition-colors hover:border-brand-300 focus-within:outline-2 focus-within:outline-brand-500">
      <PinIcon size={16} className="text-ink" />
      <span className="sr-only">Site</span>
      <select
        className="min-w-0 max-w-[52vw] cursor-pointer appearance-none truncate bg-transparent pr-1 text-ink outline-none sm:max-w-none"
        value={site?.siteId ?? ''}
        disabled={!site}
        onChange={(e) => setSiteId(e.target.value)}
      >
        {!site && <option value="">Loading sites…</option>}
        {sites.map((s) => (
          <option key={s.siteId} value={s.siteId}>
            {s.name}
          </option>
        ))}
      </select>
      <ChevronDownIcon size={16} className="pointer-events-none absolute right-2.5 text-ink-muted" />
    </label>
  )
}

function LiveBadge() {
  const status = useLiveStatus()
  if (status === 'idle') return null
  const live = status === 'live'
  return (
    <span className="flex items-center gap-1.5 text-xs text-ink-muted" role="status">
      <span className="relative flex h-2 w-2">
        {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-up opacity-60" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${live ? 'bg-up' : 'bg-sev-medium'}`} />
      </span>
      <span className="hidden md:inline">{live ? 'Live' : status === 'reconnecting' ? 'Reconnecting…' : 'Connecting…'}</span>
      <span className="sr-only md:hidden">{live ? 'Live' : 'Connecting'}</span>
    </span>
  )
}

/** Visual stub matching the design; Arabic/RTL is out of scope (see README). */
function LanguageToggle() {
  return (
    <div className="hidden items-center gap-1 rounded-full border border-line p-1 sm:flex" role="group" aria-label="Language">
      <button
        type="button"
        aria-pressed="true"
        className="h-7 w-7 rounded-full bg-brand-500 text-xs font-medium text-white"
      >
        En
      </button>
      <button
        type="button"
        disabled
        title="Arabic coming soon"
        aria-label="Arabic (coming soon)"
        className="h-7 w-7 cursor-not-allowed rounded-full text-sm text-ink-muted"
      >
        ع
      </button>
    </div>
  )
}

function UserAvatar() {
  const { user } = useSession()
  const label = user.name || user.email || 'User'
  const initials = label
    .replace(/@.*/, '')
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
  return (
    <span
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-800"
    >
      {initials || 'U'}
    </span>
  )
}
