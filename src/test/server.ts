import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { HOUR_MS } from '../lib/time'
import { SITES, TEST_BASE_URL, VALID_LOGIN, makeEntry, makeToken } from './fixtures'

const url = (path: string) => `${TEST_BASE_URL}${path}`

type RangeBody = { siteId?: string; fromUtc: number; toUtc: number; pageNumber?: number; pageSize?: number }

function hourlyBuckets(from: number, to: number) {
  const out: number[] = []
  for (let t = Math.floor(from / HOUR_MS) * HOUR_MS; t <= to; t += HOUR_MS) out.push(t)
  return out
}

/** Default "today vs yesterday" numbers so cards render predictable comparisons. */
export const DEFAULTS = {
  footfallCurrent: 2436,
  footfallPrevious: 2707, // → 10% less
  dwellCurrent: 8.5,
  dwellPrevious: 8, // → 6% more
  totalEntries: 47,
}

function requireAuth(request: Request) {
  return request.headers.get('Authorization')?.startsWith('Bearer ')
}

/**
 * Handlers shaped like the staging API. "Current" vs "previous" window is told apart by
 * whether the range ends at the latest `toUtc` seen for that site — good enough for tests.
 */
export const handlers = [
  http.post(url('/api/auth/login'), async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    if (body.email === VALID_LOGIN.email && body.password === VALID_LOGIN.password) {
      return HttpResponse.json({ token: makeToken() })
    }
    return HttpResponse.json({ errorMessage: 'Invalid credentials' }, { status: 401 })
  }),

  http.get(url('/api/sites'), ({ request }) => {
    if (!requireAuth(request)) return HttpResponse.json({}, { status: 401 })
    return HttpResponse.json(SITES)
  }),

  http.post(url('/api/analytics/footfall'), async ({ request }) => {
    const b = (await request.json()) as RangeBody
    if (!b.siteId) return HttpResponse.json({ error: 'siteId required' }, { status: 400 })
    const isPrevious = b.toUtc < Date.parse('2026-10-26T00:00:00Z') - 4 * HOUR_MS
    return HttpResponse.json({
      siteId: b.siteId,
      fromUtc: b.fromUtc,
      toUtc: b.toUtc,
      footfall: isPrevious ? DEFAULTS.footfallPrevious : DEFAULTS.footfallCurrent,
    })
  }),

  http.post(url('/api/analytics/dwell'), async ({ request }) => {
    const b = (await request.json()) as RangeBody
    const isPrevious = b.toUtc < Date.parse('2026-10-26T00:00:00Z') - 4 * HOUR_MS
    return HttpResponse.json({
      siteId: b.siteId,
      fromUtc: b.fromUtc,
      toUtc: b.toUtc,
      avgDwellMinutes: isPrevious ? DEFAULTS.dwellPrevious : DEFAULTS.dwellCurrent,
      dwellRecords: 100,
    })
  }),

  http.post(url('/api/analytics/occupancy'), async ({ request }) => {
    const b = (await request.json()) as RangeBody
    return HttpResponse.json({
      siteId: b.siteId,
      fromUtc: b.fromUtc,
      toUtc: b.toUtc,
      timezone: 'Asia/Dubai',
      buckets: hourlyBuckets(b.fromUtc, b.toUtc).map((utc, i) => ({ utc, local: '', avg: 150 + i * 2 })),
    })
  }),

  http.post(url('/api/analytics/demographics'), async ({ request }) => {
    const b = (await request.json()) as RangeBody
    return HttpResponse.json({
      siteId: b.siteId,
      fromUtc: b.fromUtc,
      toUtc: b.toUtc,
      timezone: 'Asia/Dubai',
      buckets: hourlyBuckets(b.fromUtc, b.toUtc).map((utc) => ({ utc, local: '', male: 55, female: 45 })),
    })
  }),

  http.post(url('/api/analytics/entry-exit'), async ({ request }) => {
    const b = (await request.json()) as RangeBody
    const pageSize = b.pageSize ?? 50
    const pageNumber = b.pageNumber ?? 1
    const total = DEFAULTS.totalEntries
    const start = (pageNumber - 1) * pageSize
    const records = Array.from({ length: Math.max(0, Math.min(pageSize, total - start)) }, (_, i) =>
      makeEntry(start + i),
    )
    return HttpResponse.json({
      siteId: b.siteId,
      fromUtc: b.fromUtc,
      toUtc: b.toUtc,
      pageSize,
      pageNumber,
      totalRecords: total,
      totalPages: Math.ceil(total / pageSize),
      records,
    })
  }),
]

export const server = setupServer(...handlers)
export { http, HttpResponse, url as apiUrl }
