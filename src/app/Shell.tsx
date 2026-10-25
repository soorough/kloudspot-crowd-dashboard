import { Suspense, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useSession } from '../auth/session'
import { ChevronDownIcon, EntriesIcon, HomeIcon, KloudspotLogo, MenuIcon, PinIcon, PowerIcon } from '../components/icons'
import { ErrorState, Skeleton } from '../components/ui'
import { AlertsBell } from '../features/alerts/AlertsBell'
import { useLiveStatus } from '../live/live'
import { useDashboard } from '../sites/dashboard'

const NAV = [
  { to: '/', label: 'Overview', icon: HomeIcon, end: true },
  { to: '/entries', label: 'Crowd Entries', icon: EntriesIcon, end: false },
]

export function Shell() {
  const [collapsed, setCollapsed] = useState(false)
  const { logout } = useSession()
  const { site, sitesStatus, retrySites } = useDashboard()

  return (
    <div className="flex h-full">
      <aside
        className={`sidebar-bg flex shrink-0 flex-col text-white transition-[width] duration-200 ${collapsed ? 'w-[72px]' : 'w-60'}`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          {!collapsed && <KloudspotLogo className="text-white" />}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            className="rounded p-1.5 text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
          >
            <MenuIcon />
          </button>
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1 px-3 pt-2">
          {NAV.map(({ to, label, icon: NavIcon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `relative flex h-11 items-center gap-3 rounded-md px-3 text-[0.95rem] transition-colors focus-visible:outline-2 focus-visible:outline-white ${
                  isActive
                    ? 'bg-white/20 text-white before:absolute before:inset-y-1.5 before:-left-1 before:w-1 before:rounded before:bg-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <NavIcon />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={logout}
          className="mx-3 mt-auto mb-5 flex h-11 items-center gap-3 rounded-md px-3 text-white/85 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
        >
          <PowerIcon size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-line bg-white px-5">
          <span className="text-[1.05rem] font-medium whitespace-nowrap">Crowd Solutions</span>
          <span className="h-7 w-px bg-line" aria-hidden="true" />
          <SiteSelect />
          <div className="ml-auto flex items-center gap-4">
            <LiveBadge />
            <LanguageToggle />
            <AlertsBell />
            <UserAvatar />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {sitesStatus === 'error' ? (
            <ErrorState message="Couldn't load your sites." onRetry={retrySites} />
          ) : site ? (
            <Suspense fallback={<PageFallback />}>
              <Outlet />
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
    <label className="relative flex h-10 items-center gap-2 rounded-md border border-line pr-8 pl-3 text-sm focus-within:outline-2 focus-within:outline-brand-500">
      <PinIcon size={16} className="text-ink" />
      <span className="sr-only">Site</span>
      <select
        className="cursor-pointer appearance-none bg-transparent pr-1 text-ink outline-none"
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
      <span className={`h-2 w-2 rounded-full ${live ? 'animate-pulse bg-up' : 'bg-sev-medium'}`} />
      {live ? 'Live' : status === 'reconnecting' ? 'Reconnecting…' : 'Connecting…'}
    </span>
  )
}

/** Visual stub matching the design; Arabic/RTL is out of scope (see README). */
function LanguageToggle() {
  return (
    <div className="flex items-center gap-1 rounded-full border border-line p-1" role="group" aria-label="Language">
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
