import {
  addDays,
  dayWindows,
  formatClock,
  formatDwellLong,
  formatDwellShort,
  formatLongDate,
  localDayOf,
  percentChange,
  startOfLocalDay,
} from './time'

const iso = (ms: number) => new Date(ms).toISOString()

describe('startOfLocalDay', () => {
  it.each([
    ['Asia/Dubai', '2026-10-26', '2026-10-25T20:00:00.000Z'],
    ['Asia/Kolkata', '2026-10-26', '2026-10-25T18:30:00.000Z'],
    ['America/Los_Angeles', '2026-10-26', '2026-10-26T07:00:00.000Z'],
    ['Asia/Tokyo', '2026-10-26', '2026-10-25T15:00:00.000Z'],
  ])('%s %s starts at %s', (tz, day, expected) => {
    expect(iso(startOfLocalDay(day, tz))).toBe(expected)
  })

  it('handles the US fall-back DST day (25h long)', () => {
    const start = startOfLocalDay('2026-11-01', 'America/Los_Angeles')
    const next = startOfLocalDay('2026-11-02', 'America/Los_Angeles')
    expect(iso(start)).toBe('2026-11-01T07:00:00.000Z')
    expect(next - start).toBe(25 * 3_600_000)
  })
})

describe('localDayOf', () => {
  it('uses the site timezone, not the viewer timezone', () => {
    // 21:00 UTC on the 25th is already the 26th in Dubai, still the 25th in LA.
    const now = Date.parse('2026-10-25T21:00:00Z')
    expect(localDayOf(now, 'Asia/Dubai')).toBe('2026-10-26')
    expect(localDayOf(now, 'America/Los_Angeles')).toBe('2026-10-25')
  })
})

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })
})

describe('dayWindows', () => {
  const tz = 'Asia/Dubai'
  const now = Date.parse('2026-10-26T10:30:00Z') // 14:30 in Dubai

  it('today: midnight → now, compared with the same elapsed span yesterday', () => {
    const w = dayWindows('2026-10-26', tz, now)
    expect(w.isToday).toBe(true)
    expect(iso(w.current.fromUtc)).toBe('2026-10-25T20:00:00.000Z')
    expect(w.current.toUtc).toBe(now)
    expect(iso(w.previous.fromUtc)).toBe('2026-10-24T20:00:00.000Z')
    expect(iso(w.previous.toUtc)).toBe('2026-10-25T10:30:00.000Z')
    expect(iso(w.axis.toUtc)).toBe('2026-10-26T20:00:00.000Z')
  })

  it('past day: the whole day, compared with the whole previous day', () => {
    const w = dayWindows('2026-10-24', tz, now)
    expect(w.isToday).toBe(false)
    expect(iso(w.current.fromUtc)).toBe('2026-10-23T20:00:00.000Z')
    expect(iso(w.current.toUtc)).toBe('2026-10-24T19:59:59.999Z')
    expect(w.previous.toUtc - w.previous.fromUtc).toBe(w.current.toUtc - w.current.fromUtc)
  })
})

describe('percentChange', () => {
  it.each([
    [110, 100, 10],
    [90, 100, -10],
    [100, 100, 0],
    [5, 0, null],
  ])('%d vs %d → %s', (a, b, expected) => {
    expect(percentChange(a, b)).toBe(expected)
  })
})

describe('dwell formatting', () => {
  it.each([
    [8.5, '08min 30sec'],
    [0, '00min 00sec'],
    [0.4, '00min 24sec'],
    [75.25, '1h 15min'],
    [null, '--'],
  ])('long %s → %s', (m, expected) => {
    expect(formatDwellLong(m)).toBe(expected)
  })

  it.each([
    [20, '00:20'],
    [72, '01:12'],
    [0.4, '00:00'],
    [null, '--'],
  ])('short %s → %s', (m, expected) => {
    expect(formatDwellShort(m)).toBe(expected)
  })
})

describe('display formatting', () => {
  const t = Date.parse('2025-03-03T06:12:00Z')
  it('formats in the site timezone', () => {
    expect(formatClock(t, 'Asia/Dubai')).toBe('10:12 AM')
    expect(formatLongDate(t, 'Asia/Dubai')).toBe('March 03 2025')
    expect(formatClock(null, 'Asia/Dubai')).toBe('--')
  })
})
