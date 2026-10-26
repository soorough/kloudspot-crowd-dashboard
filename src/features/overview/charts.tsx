import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useI18n } from '../../i18n/i18n'
import { formatHour } from '../../lib/time'
import type { DemographicsBucket, OccupancyBucket, TimeRange } from '../../lib/types'
import { dayTicks } from './metrics'

export const COLORS = {
  occupancy: '#4a9e99',
  male: '#2f7d78',
  female: '#8fd3cc',
  live: '#b42318',
  grid: '#e7e9ee',
  axis: '#5b6474',
}

const AXIS_TICK = { fontSize: 11, fill: COLORS.axis }

function timeAxis(axis: TimeRange, timeZone: string, label: string) {
  return (
    <XAxis
      type="number"
      dataKey="utc"
      scale="time"
      domain={[axis.fromUtc, axis.toUtc]}
      ticks={dayTicks(axis.fromUtc, axis.toUtc, axis.toUtc - axis.fromUtc <= 12 * 3_600_000 ? 1 : 2)}
      tickFormatter={(v: number) => formatHour(v, timeZone)}
      tick={AXIS_TICK}
      tickLine={false}
      axisLine={{ stroke: COLORS.grid }}
      allowDataOverflow
      label={{ value: label, position: 'insideBottom', offset: -4, fontSize: 12, fill: COLORS.axis }}
    />
  )
}

function countAxis(label: string) {
  return (
    <YAxis
      tick={AXIS_TICK}
      tickLine={false}
      axisLine={false}
      width={44}
      allowDecimals={false}
      // ~30% headroom above the peak, rounded to a tidy step, so the line never hugs the top (Figma).
      domain={[0, (max: number) => niceCeil(max * 1.3)]}
      label={{ value: label, angle: -90, position: 'insideLeft', offset: 8, fontSize: 12, fill: COLORS.axis }}
    />
  )
}

function niceCeil(n: number) {
  if (!Number.isFinite(n) || n <= 0) return 10
  const step = 10 ** Math.floor(Math.log10(n)) / 2
  return Math.ceil(n / step) * step
}

function tooltip(timeZone: string) {
  return (
    <Tooltip
      labelFormatter={(v) => (typeof v === 'number' ? formatHour(v, timeZone) : String(v))}
      formatter={(v) => (typeof v === 'number' ? Math.round(v).toLocaleString('en-US') : String(v))}
      contentStyle={{ borderRadius: 8, borderColor: COLORS.grid, fontSize: 12 }}
    />
  )
}

function LiveTag({ viewBox, text }: { viewBox?: { x?: number; y?: number }; text: string }) {
  const x = viewBox?.x ?? 0
  const y = viewBox?.y ?? 0
  return (
    <g transform={`translate(${x - 9}, ${y + 2}) rotate(-90)`}>
      <rect x={-34} y={0} width={34} height={16} rx={3} fill={COLORS.live} />
      <text x={-17} y={11.5} textAnchor="middle" fontSize={9} fontWeight={600} fill="#fff" letterSpacing={0.5}>
        {text}
      </text>
    </g>
  )
}

export function OccupancyChart({
  data,
  axis,
  timeZone,
  liveAt,
  label,
}: {
  data: OccupancyBucket[]
  axis: TimeRange
  timeZone: string
  /** Epoch ms of "now" when viewing today; null on past days. */
  liveAt: number | null
  label: string
}) {
  const { t } = useI18n()
  // Time axes read left to right in both languages, so charts opt out of RTL mirroring.
  return (
    <div role="img" aria-label={label} dir="ltr" className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 12, left: 4 }}>
          <defs>
            <linearGradient id="overview-occupancy-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.occupancy} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLORS.occupancy} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="4 4" vertical={false} />
          {timeAxis(axis, timeZone, t('overview.axisTime'))}
          {countAxis(t('overview.axisCount'))}
          {tooltip(timeZone)}
          <Area
            type="monotone"
            dataKey="avg"
            name={t('overview.occupancy')}
            stroke={COLORS.occupancy}
            strokeWidth={2}
            fill="url(#overview-occupancy-fill)"
            isAnimationActive={false}
          />
          {liveAt !== null && (
            <ReferenceLine
              x={liveAt}
              stroke={COLORS.live}
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
              label={(props: { viewBox?: { x?: number; y?: number } }) => <LiveTag viewBox={props.viewBox} text={t('overview.liveTag')} />}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DemographicsChart({
  data,
  axis,
  timeZone,
  label,
}: {
  data: DemographicsBucket[]
  axis: TimeRange
  timeZone: string
  label: string
}) {
  const { t } = useI18n()
  return (
    <div role="img" aria-label={label} dir="ltr" className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 12, left: 4 }}>
          <defs>
            <linearGradient id="overview-male-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.male} stopOpacity={0.3} />
              <stop offset="100%" stopColor={COLORS.male} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="overview-female-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.female} stopOpacity={0.4} />
              <stop offset="100%" stopColor={COLORS.female} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="4 4" vertical={false} />
          {timeAxis(axis, timeZone, t('overview.axisTime'))}
          {countAxis(t('overview.axisCount'))}
          {tooltip(timeZone)}
          <Area
            type="monotone"
            dataKey="male"
            name={t('overview.male')}
            stroke={COLORS.male}
            strokeWidth={2}
            fill="url(#overview-male-fill)"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="female"
            name={t('overview.female')}
            stroke={COLORS.female}
            strokeWidth={2}
            fill="url(#overview-female-fill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DemographicsDonut({ male, female, label }: { male: number; female: number; label: string }) {
  const { t } = useI18n()
  const data = [
    { name: t('overview.males'), value: male, color: COLORS.male },
    { name: t('overview.females'), value: female, color: COLORS.female },
  ]
  return (
    <div
      role="img"
      aria-label={label}
      className="relative mx-auto h-48 w-48"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="68%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span className="text-xs text-ink-muted">{t('overview.totalCrowd')}</span>
        <span className="text-lg font-medium text-ink">100%</span>
      </div>
    </div>
  )
}

export function LegendDot({ color, children }: { color: string; children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {children}
    </span>
  )
}
