import type { TimeRange } from './types'

/** A calendar day in a site's local timezone, formatted `YYYY-MM-DD`. */
export type LocalDay = string

const HOUR = 3_600_000
const DAY = 24 * HOUR

const partsCache = new Map<string, Intl.DateTimeFormat>()

function partsFormatter(timeZone: string) {
  let f = partsCache.get(timeZone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    partsCache.set(timeZone, f)
  }
  return f
}

function zonedParts(utc: number, timeZone: string) {
  const out: Record<string, number> = {}
  for (const p of partsFormatter(timeZone).formatToParts(utc)) {
    if (p.type !== 'literal') out[p.type] = Number(p.value)
  }
  return out as { year: number; month: number; day: number; hour: number; minute: number; second: number }
}

/** Offset of `timeZone` from UTC at instant `utc`, in ms (positive east of UTC). */
function offsetMs(utc: number, timeZone: string): number {
  const p = zonedParts(utc, timeZone)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - Math.floor(utc / 1000) * 1000
}

function parseDay(day: LocalDay) {
  const [y, m, d] = day.split('-').map(Number)
  return { y, m, d }
}

export function addDays(day: LocalDay, n: number): LocalDay {
  const { y, m, d } = parseDay(day)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

/** The site-local calendar day containing instant `now`. */
export function localDayOf(now: number, timeZone: string): LocalDay {
  const p = zonedParts(now, timeZone)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

/** UTC instant of local midnight at the start of `day` in `timeZone` (DST-safe). */
export function startOfLocalDay(day: LocalDay, timeZone: string): number {
  const { y, m, d } = parseDay(day)
  const guess = Date.UTC(y, m - 1, d)
  const first = guess - offsetMs(guess, timeZone)
  // Re-check at the candidate instant in case a DST shift sits between guess and midnight.
  return guess - offsetMs(first, timeZone)
}

export interface DayWindows {
  day: LocalDay
  isToday: boolean
  /** What the dashboard reports: local midnight → now (today) or the whole day (past). */
  current: TimeRange
  /** Same elapsed span, one local day earlier — keeps "vs yesterday" fair for partial days. */
  previous: TimeRange
  /** Full local day, for chart x-axis domains. */
  axis: TimeRange
}

export function dayWindows(day: LocalDay, timeZone: string, now: number): DayWindows {
  const start = startOfLocalDay(day, timeZone)
  const nextStart = startOfLocalDay(addDays(day, 1), timeZone)
  const isToday = day === localDayOf(now, timeZone)
  const end = isToday ? now : nextStart - 1
  const prevStart = startOfLocalDay(addDays(day, -1), timeZone)
  return {
    day,
    isToday,
    current: { fromUtc: start, toUtc: end },
    previous: { fromUtc: prevStart, toUtc: prevStart + (end - start) },
    axis: { fromUtc: start, toUtc: nextStart },
  }
}

/** Percentage change rounded to a whole number; null when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(previous) || previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

const pad2 = (n: number) => String(n).padStart(2, '0')

// Display locale for user-facing dates. Arabic keeps Western digits, as is usual in the UAE.
const LOCALES = { en: 'en-US', ar: 'ar-AE-u-nu-latn' } as const
let displayLang: keyof typeof LOCALES = 'en'

/** Called by the i18n provider; formatting below follows the active UI language. */
export function setDisplayLocale(lang: string) {
  displayLang = lang === 'ar' ? 'ar' : 'en'
}

const DWELL_UNITS = {
  en: { h: 'h', min: 'min', sec: 'sec', sep: '' },
  ar: { h: ' س', min: ' د', sec: ' ث', sep: '' },
}

/** Card format from the design: `08min 30sec` (Arabic: `08 د 30 ث`). */
export function formatDwellLong(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes)) return '--'
  const u = DWELL_UNITS[displayLang]
  const totalSec = Math.round(minutes * 60)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return h > 0 ? `${h}${u.h} ${pad2(m)}${u.min}` : `${pad2(m)}${u.min} ${pad2(s)}${u.sec}`
}

/** Table format from the design: `HH:MM`. */
export function formatDwellShort(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes)) return '--'
  const total = Math.round(minutes)
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`
}

const fmtCache = new Map<string, Intl.DateTimeFormat>()
function fmt(timeZone: string, key: string, opts: Intl.DateTimeFormatOptions) {
  const locale = LOCALES[displayLang]
  const k = `${locale}|${timeZone}|${key}`
  let f = fmtCache.get(k)
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { timeZone, ...opts })
    fmtCache.set(k, f)
  }
  return f
}

/** `11:05 AM` */
export function formatClock(utc: number | null | undefined, timeZone: string): string {
  if (utc == null) return '--'
  return fmt(timeZone, 'clock', { hour: '2-digit', minute: '2-digit', hour12: true }).format(utc)
}

/** `08:00` — chart axis ticks. */
export function formatHour(utc: number, timeZone: string): string {
  return fmt(timeZone, 'hour', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(utc)
}

/** `March 03 2025` — alert cards. */
export function formatLongDate(utc: number, timeZone: string): string {
  const p = zonedParts(utc, timeZone)
  const month = fmt(timeZone, 'month', { month: 'long' }).format(utc)
  return `${month} ${pad2(p.day)} ${p.year}`
}

/** `10:12` — alert cards (24h). */
export function formatTime24(utc: number, timeZone: string): string {
  return formatHour(utc, timeZone)
}

/** `Mon, 26 Oct` — day picker label. */
export function formatDayLabel(day: LocalDay): string {
  const { y, m, d } = parseDay(day)
  return new Intl.DateTimeFormat(displayLang === 'ar' ? LOCALES.ar : 'en-GB', {
    timeZone: 'UTC',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(Date.UTC(y, m - 1, d))
}

export const HOUR_MS = HOUR
export const DAY_MS = DAY
