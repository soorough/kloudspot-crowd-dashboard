import { HOUR_MS } from '../../lib/time'
import type { DemographicsBucket, OccupancyBucket } from '../../lib/types'

export function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

/**
 * Male vs female share over the buckets, as whole percentages that add up to 100.
 * Buckets are hourly averages, so this is a share, not a headcount. Null when there's no one.
 */
export function demographicShare(buckets: DemographicsBucket[]): { male: number; female: number } | null {
  let male = 0
  let female = 0
  for (const b of buckets) {
    male += b.male
    female += b.female
  }
  const total = male + female
  if (!(total > 0)) return null
  const m = Math.round((male / total) * 100)
  return { male: m, female: 100 - m }
}

/**
 * Put a live reading into the bucket for the hour containing `ts`: replace that bucket's
 * value or append a new one. Hours are counted from the last bucket (or the day start)
 * so they line up with the server's bucket boundaries.
 */
export function withLivePoint(
  buckets: OccupancyBucket[],
  live: { ts: number; value: number },
  dayStartUtc: number,
): OccupancyBucket[] {
  const last = buckets[buckets.length - 1]
  const anchor = last?.utc ?? dayStartUtc
  if (live.ts < anchor) return buckets
  const hour = anchor + Math.floor((live.ts - anchor) / HOUR_MS) * HOUR_MS
  if (last && hour === last.utc) {
    return [...buckets.slice(0, -1), { ...last, avg: live.value }]
  }
  return [...buckets, { utc: hour, local: '', avg: live.value }]
}

/** Two-hourly ticks across the site-local day. */
export function dayTicks(fromUtc: number, toUtc: number, stepHours = 2): number[] {
  const out: number[] = []
  for (let t = fromUtc; t < toUtc; t += stepHours * HOUR_MS) out.push(t)
  return out
}
