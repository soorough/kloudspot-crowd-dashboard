import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { AnimatedValue } from '../../components/AnimatedValue'
import { TrendDownIcon, TrendUpIcon } from '../../components/icons'
import { Card, EmptyState, ErrorState, Skeleton, SlowHint } from '../../components/ui'
import { formatDwellLong, formatHour, percentChange, type DayWindows } from '../../lib/time'
import type { Site } from '../../lib/types'
import { useI18n, type Translate } from '../../i18n/i18n'
import { useDashboard } from '../../sites/dashboard'
import { COLORS, DemographicsChart, DemographicsDonut, LegendDot, OccupancyChart } from './charts'
import { demographicShare, mean, visibleAxis, withLivePoint } from './metrics'
import { useFootfallIncrement, useLiveOccupancy, useOverviewQueries } from './useOverviewData'

export function OverviewPage() {
  const { site, windows } = useDashboard()
  const { t } = useI18n()
  return (
    <div>
      <PageHeader title={t('overview.title')} />
      {site && windows ? (
        <OverviewContent key={site.siteId} site={site} windows={windows} />
      ) : (
        <OverviewSkeleton />
      )}
    </div>
  )
}

const fmt = (n: number) => Math.round(n).toLocaleString('en-US')

function OverviewContent({ site, windows }: { site: Site; windows: DayWindows }) {
  const { isToday, axis } = windows
  const q = useOverviewQueries(site, windows)
  const live = useLiveOccupancy(site.siteId, isToday)
  const footfallExtra = useFootfallIncrement(site.siteId, isToday, q.footfall.data)
  const { t } = useI18n()
  const comparedTo = isToday ? t('overview.yesterday') : t('overview.dayBefore')

  // Occupancy: live value (today) or the day's mean (past day), compared like-for-like.
  const buckets = q.occupancy.data?.buckets ?? []
  const prevBuckets = q.occupancyPrev.data?.buckets ?? []
  let occupancyValue: number | null
  let occupancyBaseline: number | null
  if (isToday) {
    const last = buckets[buckets.length - 1]
    occupancyValue = live ? live.value : last ? Math.round(last.avg) : null
    // The previous window ends at the same elapsed time yesterday, so its last bucket is "same hour yesterday".
    const prevLast = prevBuckets[prevBuckets.length - 1]
    occupancyBaseline = prevLast ? prevLast.avg : null
  } else {
    const m = mean(buckets.map((b) => b.avg))
    occupancyValue = m === null ? null : Math.round(m)
    occupancyBaseline = mean(prevBuckets.map((b) => b.avg))
  }
  const chartData = isToday && live ? withLivePoint(buckets, live, axis.fromUtc) : buckets
  const liveAt = isToday ? (live?.ts ?? windows.current.toUtc) : null
  const chartAxis = visibleAxis(axis, isToday, liveAt ?? windows.current.toUtc)
  // Buckets are hourly, so the series would stop at the top of the hour and leave a gap before
  // the LIVE marker. Extend it to "now" with the latest reading so the line meets the marker (Figma).
  const lastPoint = chartData[chartData.length - 1]
  const occupancySeries =
    liveAt !== null && lastPoint && liveAt > lastPoint.utc
      ? [...chartData, { ...lastPoint, utc: liveAt, avg: live ? live.value : lastPoint.avg }]
      : chartData

  const footfall = q.footfall.data ? q.footfall.data.footfall + footfallExtra : null
  const dwell = q.dwell.data?.avgDwellMinutes ?? null
  const demoBuckets = q.demographics.data?.buckets ?? []
  const share = demographicShare(demoBuckets)

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="overview-occupancy" className="flex flex-col gap-3">
        <h2 id="overview-occupancy" className="text-lg font-medium text-ink">
          {t('overview.occupancy')}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="animate-card-in md:col-span-2">
            <div className="grid grid-cols-1 gap-4 divide-line max-sm:divide-y sm:grid-cols-2 sm:gap-0 sm:divide-x rtl:sm:divide-x-reverse">
              <Stat
                label={isToday ? t('overview.liveOccupancy') : t('overview.avgOccupancy')}
                query={live ? null : q.occupancy}
                value={occupancyValue === null ? null : fmt(occupancyValue)}
                change={occupancyValue === null || occupancyBaseline === null ? null : percentChange(occupancyValue, occupancyBaseline)}
                comparedTo={comparedTo}
                className="max-sm:pb-4 sm:pe-6"
              />
              <Stat
                label={isToday ? t('overview.todaysFootfall') : t('overview.footfall')}
                query={q.footfall}
                value={footfall === null ? null : fmt(footfall)}
                change={
                  footfall === null || !q.footfallPrev.data ? null : percentChange(footfall, q.footfallPrev.data.footfall)
                }
                comparedTo={comparedTo}
                className="max-sm:pt-4 sm:ps-6"
              />
            </div>
          </Card>
          <Card className="animate-card-in [animation-delay:60ms]">
            <Stat
              label={t('overview.avgDwell')}
              query={q.dwell}
              value={dwell === null ? null : formatDwellLong(dwell)}
              change={dwell === null || !q.dwellPrev.data ? null : percentChange(dwell, q.dwellPrev.data.avgDwellMinutes)}
              comparedTo={comparedTo}
            />
          </Card>
        </div>

        <Card className="animate-card-in [animation-delay:120ms]" title={t('overview.overallOccupancy')} actions={<LegendDot color={COLORS.occupancy}>{t('overview.occupancy')}</LegendDot>}>
          <QueryBody query={q.occupancy} skeletonClass="h-72" isEmpty={buckets.length === 0} empty={t('overview.noOccupancy')}>
            <OccupancyChart
              data={occupancySeries}
              axis={chartAxis}
              timeZone={site.timezone}
              liveAt={liveAt}
              label={occupancySummary(chartData, site.timezone, isToday, t)}
            />
          </QueryBody>
        </Card>
      </section>

      <section aria-labelledby="overview-demographics" className="flex flex-col gap-3">
        <h2 id="overview-demographics" className="text-lg font-medium text-ink">
          {t('overview.demographics')}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="animate-card-in [animation-delay:180ms]" title={t('overview.chartOfDemographics')}>
            <QueryBody query={q.demographics} skeletonClass="h-64" isEmpty={!share} empty={t('overview.noDemographics')}>
              {share && (
                <div className="flex flex-col items-center gap-4">
                  <DemographicsDonut
                    male={share.male}
                    female={share.female}
                    label={`${t('overview.share')}: ${share.male}% ${t('overview.males')}, ${share.female}% ${t('overview.females')}`}
                  />
                  <ul className="flex flex-col gap-2 self-stretch px-2 text-sm text-ink" aria-label={t('overview.share')}>
                    <ShareRow color={COLORS.male} pct={share.male} label={t('overview.males')} />
                    <ShareRow color={COLORS.female} pct={share.female} label={t('overview.females')} />
                  </ul>
                </div>
              )}
            </QueryBody>
          </Card>
          <Card
            title={t('overview.demographicsAnalysis')}
            className="animate-card-in [animation-delay:240ms] md:col-span-2"
            actions={
              <div className="flex items-center gap-3">
                <LegendDot color={COLORS.male}>{t('overview.male')}</LegendDot>
                <LegendDot color={COLORS.female}>{t('overview.female')}</LegendDot>
              </div>
            }
          >
            <QueryBody
              query={q.demographics}
              skeletonClass="h-72"
              isEmpty={demoBuckets.length === 0}
              empty={t('overview.noDemographics')}
            >
              <DemographicsChart
                data={demoBuckets}
                axis={chartAxis}
                timeZone={site.timezone}
                label={`${t('overview.demoSummary', { hours: demoBuckets.length })}${share ? t('overview.demoShare', { m: share.male, f: share.female }) : ''}`}
              />
            </QueryBody>
          </Card>
        </div>
      </section>
    </div>
  )
}

function occupancySummary(
  data: { utc: number; avg: number }[],
  timeZone: string,
  isToday: boolean,
  t: Translate,
) {
  if (data.length === 0) return t('overview.occNoData')
  const peak = data.reduce((a, b) => (b.avg > a.avg ? b : a))
  const last = data[data.length - 1]
  return t('overview.occSummary', {
    hours: data.length,
    peak: fmt(peak.avg),
    peakAt: formatHour(peak.utc, timeZone),
    latestLabel: t(isToday ? 'overview.latest' : 'overview.last'),
    last: fmt(last.avg),
    lastAt: formatHour(last.utc, timeZone),
  })
}

function Stat({
  label,
  query,
  value,
  change,
  comparedTo,
  className = '',
}: {
  label: string
  /** Drives loading/error; null when the value is already known (e.g. from the live stream). */
  query: UseQueryResult<unknown> | null
  value: string | null
  change: number | null
  comparedTo: string
  className?: string
}) {
  const { t, errorText } = useI18n()
  let body: ReactNode
  if (query?.isPending) {
    body = (
      <div className="flex flex-col gap-2" aria-busy="true">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-40" />
        <SlowHint />
      </div>
    )
  } else if (query?.isError) {
    body = <ErrorState message={`${t('overview.loadFailed', { what: label })} ${errorText(query.error)}`} onRetry={() => void query.refetch()} />
  } else if (value === null) {
    body = <p className="text-sm text-ink-muted">{t('overview.noData')}</p>
  } else {
    body = (
      <>
        <p className="text-2xl leading-6 font-medium tracking-[0.1px] text-ink-strong">
          <AnimatedValue value={value} />
        </p>
        <Trend change={change} comparedTo={comparedTo} />
      </>
    )
  }
  return (
    <div className={`flex flex-col gap-3 ${className}`} aria-label={label} role="group">
      <h3 className="text-base leading-none font-medium text-ink-strong">{label}</h3>
      {body}
    </div>
  )
}

function Trend({ change, comparedTo }: { change: number | null; comparedTo: string }) {
  const { t } = useI18n()
  if (change === null) return null
  if (change === 0)
    return <p className="text-sm leading-[14px] font-light text-ink-strong">{t('overview.same', { when: comparedTo })}</p>
  const up = change > 0
  const Icon = up ? TrendUpIcon : TrendDownIcon
  // Figma: trend glyph on its own line, then 14px light copy.
  return (
    <div className="flex flex-col gap-1.5">
      <Icon size={18} className={`animate-pop ${up ? 'text-up' : 'text-down'}`} />
      <p className="text-sm leading-[14px] font-light tracking-[0.1px] text-ink-strong">
        {t(up ? 'overview.more' : 'overview.less', { n: Math.abs(change), when: comparedTo })}
      </p>
    </div>
  )
}

function QueryBody({
  query,
  skeletonClass,
  isEmpty,
  empty,
  children,
}: {
  query: UseQueryResult<unknown>
  skeletonClass: string
  isEmpty: boolean
  empty: string
  children: ReactNode
}) {
  const { t, errorText } = useI18n()
  if (query.isPending)
    return (
      <div className="relative">
        <Skeleton className={`shimmer w-full ${skeletonClass}`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <SlowHint className="shadow-sm" />
        </div>
      </div>
    )
  if (query.isError)
    return <ErrorState message={`${t('overview.chartFailed')} ${errorText(query.error)}`} onRetry={() => void query.refetch()} />
  if (isEmpty) return <EmptyState>{empty}</EmptyState>
  return <>{children}</>
}

function ShareRow({ color, pct, label }: { color: string; pct: number; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <PersonGlyph color={color} />
      <span>
        <strong className="font-semibold">{pct}%</strong> {label}
      </span>
    </li>
  )
}

function PersonGlyph({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="6" r="3.5" fill={color} />
      <path d="M5 21v-3.5A5.5 5.5 0 0 1 10.5 12h3a5.5 5.5 0 0 1 5.5 5.5V21z" fill={color} />
    </svg>
  )
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-32 lg:col-span-2" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-80" />
    </div>
  )
}
