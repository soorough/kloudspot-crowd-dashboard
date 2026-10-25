import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useApi } from '../../auth/session'
import type { DayWindows } from '../../lib/time'
import type { Site, TimeRange } from '../../lib/types'
import { useLiveEvent } from '../../live/live'

type Metric = 'footfall' | 'dwell' | 'occupancy' | 'demographics'

const key = (metric: Metric, siteId: string, w: TimeRange) =>
  ['overview', metric, siteId, w.fromUtc, w.toUtc] as const

/** Every REST query the Overview needs, scoped to the site and the selected day's windows. */
export function useOverviewQueries(site: Site, windows: DayWindows) {
  const api = useApi()
  const siteId = site.siteId
  const { current, previous } = windows

  const footfall = useQuery({
    queryKey: key('footfall', siteId, current),
    queryFn: () => api.footfall({ siteId, ...current }),
  })
  const footfallPrev = useQuery({
    queryKey: key('footfall', siteId, previous),
    queryFn: () => api.footfall({ siteId, ...previous }),
  })
  const dwell = useQuery({
    queryKey: key('dwell', siteId, current),
    queryFn: () => api.dwell({ siteId, ...current }),
    refetchOnWindowFocus: true,
  })
  const dwellPrev = useQuery({
    queryKey: key('dwell', siteId, previous),
    queryFn: () => api.dwell({ siteId, ...previous }),
  })
  const occupancy = useQuery({
    queryKey: key('occupancy', siteId, current),
    queryFn: () => api.occupancy({ siteId, ...current }),
  })
  const occupancyPrev = useQuery({
    queryKey: key('occupancy', siteId, previous),
    queryFn: () => api.occupancy({ siteId, ...previous }),
  })
  const demographics = useQuery({
    queryKey: key('demographics', siteId, current),
    queryFn: () => api.demographics({ siteId, ...current }),
  })

  return { footfall, footfallPrev, dwell, dwellPrev, occupancy, occupancyPrev, demographics }
}

/**
 * Latest `siteOccupancy` for the site, or null before the first event. Keyed by site so a
 * site switch drops the old reading without an effect. Ignored on past days.
 */
export function useLiveOccupancy(siteId: string, isToday: boolean) {
  const [latest, setLatest] = useState<{ siteId: string; ts: number; value: number } | null>(null)
  useLiveEvent(
    'live_occupancy',
    (e) => {
      if (isToday) setLatest({ siteId: e.siteId, ts: e.ts, value: e.siteOccupancy })
    },
    siteId,
  )
  return isToday && latest?.siteId === siteId ? latest : null
}

/**
 * Number of `zone-entry` alerts since `base` (the footfall query data) last changed.
 * A refetch or site/day switch gives a new `base`, which resets the count to 0.
 */
export function useFootfallIncrement(siteId: string, isToday: boolean, base: unknown) {
  const [bump, setBump] = useState<{ base: unknown; n: number }>({ base: undefined, n: 0 })
  useLiveEvent(
    'alert',
    (e) => {
      if (!isToday || base === undefined || e.direction !== 'zone-entry') return
      setBump((b) => ({ base, n: (b.base === base ? b.n : 0) + 1 }))
    },
    siteId,
  )
  return isToday && bump.base === base ? bump.n : 0
}
