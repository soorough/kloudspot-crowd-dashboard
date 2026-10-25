import type { AlertEvent, EntryRecord, LiveOccupancyEvent, Site } from '../lib/types'

export const TEST_BASE_URL = 'http://api.test'

/** Fixed "now" for every app test: 2026-10-26 14:30 in Dubai (10:30 UTC). */
export const NOW = Date.parse('2026-10-26T10:30:00Z')

export const DUBAI: Site = {
  siteId: 'site-dxb',
  name: 'Dubai Mall',
  city: 'Dubai',
  country: 'UAE',
  timezone: 'Asia/Dubai',
  zones: [
    { zoneId: 'z-dxb-h', name: 'Dubai Mall HIGH Zone', securityLevel: 'high' },
    { zoneId: 'z-dxb-l', name: 'Dubai Mall LOW Zone', securityLevel: 'low' },
  ],
}

export const SFO: Site = {
  siteId: 'site-sfo',
  name: 'San Francisco International Airport',
  city: 'San Francisco',
  country: 'USA',
  timezone: 'America/Los_Angeles',
  zones: [{ zoneId: 'z-sfo-m', name: 'SFO MEDIUM Zone', securityLevel: 'medium' }],
}

export const SITES = [DUBAI, SFO]

export const VALID_LOGIN = { email: 'test@test.com', password: '1234567890' }

function b64url(obj: object) {
  return btoa(JSON.stringify(obj)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

/** Unsigned JWT the app can decode for `exp` and `email`. */
export function makeToken({ exp = NOW / 1000 + 3600, email = VALID_LOGIN.email } = {}) {
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ email, exp })}.sig`
}

export function makeEntry(i: number, overrides: Partial<EntryRecord> = {}): EntryRecord {
  const entryUtc = NOW - (i + 1) * 5 * 60_000
  const inside = i < 3
  return {
    personId: `p-${i}`,
    personName: `Visitor ${i + 1}`,
    gender: i % 2 ? 'female' : 'male',
    zoneId: 'z-dxb-h',
    zoneName: 'Dubai Mall HIGH Zone',
    severity: 'high',
    entryUtc,
    entryLocal: '',
    exitUtc: inside ? null : entryUtc + 20 * 60_000,
    exitLocal: inside ? null : '',
    dwellMinutes: inside ? null : 20,
    ...overrides,
  }
}

export function alertEvent(overrides: Partial<AlertEvent> = {}): AlertEvent {
  return {
    ts: NOW,
    eventId: `evt-${Math.random().toString(36).slice(2)}`,
    direction: 'zone-entry',
    personName: 'Ahmad Khan',
    severity: 'high',
    zoneName: 'Dubai Mall HIGH Zone',
    zoneId: 'z-dxb-h',
    siteName: DUBAI.name,
    siteId: DUBAI.siteId,
    ...overrides,
  }
}

export function liveOccupancyEvent(overrides: Partial<LiveOccupancyEvent> = {}): LiveOccupancyEvent {
  return {
    ts: NOW,
    siteId: DUBAI.siteId,
    siteOccupancy: 734,
    zoneId: 'z-dxb-h',
    zoneOccupancy: 240,
    genderCount: { male: 400, female: 334 },
    ...overrides,
  }
}
