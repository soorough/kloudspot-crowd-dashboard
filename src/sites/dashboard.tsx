import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useApi, useSession } from '../auth/session'
import { dayWindows, localDayOf, type DayWindows, type LocalDay } from '../lib/time'
import type { Site } from '../lib/types'

const SITE_KEY = 'cms.siteId'

function readSiteId() {
  try {
    return localStorage.getItem(SITE_KEY)
  } catch {
    return null
  }
}

interface DashboardValue {
  sites: Site[]
  sitesStatus: 'pending' | 'error' | 'success'
  retrySites: () => void
  /** Null only while sites are loading or failed. */
  site: Site | null
  setSiteId: (id: string) => void
  /** Selected site-local day; null means "today" so it rolls over at midnight. */
  selectedDay: LocalDay | null
  setSelectedDay: (day: LocalDay | null) => void
  /**
   * Windows for the selected day, anchored to a frozen "now" so query keys stay stable.
   * The anchor moves when site/day change or on `refreshNow()`. Live values come from the socket.
   */
  windows: DayWindows | null
  refreshNow: () => void
  /** Current site-local today, for the day picker's max. */
  today: LocalDay | null
  clock: () => number
}

const DashboardContext = createContext<DashboardValue | null>(null)

export function DashboardProvider({ clock = Date.now, children }: { clock?: () => number; children: ReactNode }) {
  const api = useApi()
  const { isAuthenticated } = useSession()
  const queryClient = useQueryClient()

  const sitesQuery = useQuery({
    queryKey: ['sites'],
    queryFn: api.sites,
    enabled: isAuthenticated,
    staleTime: Infinity,
  })
  const sites = useMemo(() => sitesQuery.data ?? [], [sitesQuery.data])

  const [siteId, setSiteIdState] = useState<string | null>(readSiteId)
  const site = sites.find((s) => s.siteId === siteId) ?? sites[0] ?? null

  const setSiteId = useCallback((id: string) => {
    setSiteIdState(id)
    try {
      localStorage.setItem(SITE_KEY, id)
    } catch {
      // Not persisted; fine.
    }
  }, [])

  const [selectedDay, setSelectedDay] = useState<LocalDay | null>(null)
  const [anchor, setAnchor] = useState(clock)

  useEffect(() => {
    setAnchor(clock())
  }, [site?.siteId, selectedDay, clock])

  const refreshNow = useCallback(() => {
    setAnchor(clock())
    queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'sites' })
  }, [clock, queryClient])

  const timeZone = site?.timezone
  const today = timeZone ? localDayOf(anchor, timeZone) : null
  const windows = useMemo(
    () => (timeZone && today ? dayWindows(selectedDay ?? today, timeZone, anchor) : null),
    [timeZone, today, selectedDay, anchor],
  )

  const value: DashboardValue = {
    sites,
    sitesStatus: sitesQuery.status,
    retrySites: () => void sitesQuery.refetch(),
    site,
    setSiteId,
    selectedDay,
    setSelectedDay,
    windows,
    refreshNow,
    today,
    clock,
  }

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard(): DashboardValue {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider')
  return ctx
}
