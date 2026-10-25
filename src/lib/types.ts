// Shapes mirror the staging API as observed on 2026-10-26 (see docs/SPEC.md).

export interface Zone {
  zoneId: string
  name: string
  securityLevel: 'high' | 'medium' | 'low'
}

export interface Site {
  siteId: string
  name: string
  city: string
  country: string
  timezone: string
  zones: Zone[]
}

/** Epoch-millisecond range sent to every analytics endpoint. */
export interface TimeRange {
  fromUtc: number
  toUtc: number
}

export interface FootfallResponse extends TimeRange {
  siteId: string
  footfall: number
}

export interface DwellResponse extends TimeRange {
  siteId: string
  avgDwellMinutes: number
  dwellRecords: number
}

export interface OccupancyBucket {
  utc: number
  local: string
  avg: number
}

export interface OccupancyResponse extends TimeRange {
  siteId: string
  timezone: string
  buckets: OccupancyBucket[]
}

export interface DemographicsBucket {
  utc: number
  local: string
  male: number
  female: number
}

export interface DemographicsResponse extends TimeRange {
  siteId: string
  timezone: string
  buckets: DemographicsBucket[]
}

export type Severity = 'high' | 'medium' | 'low'

export interface EntryRecord {
  personId: string
  personName: string
  gender: 'male' | 'female' | string
  zoneId: string
  zoneName: string
  severity: Severity
  entryUtc: number
  entryLocal: string
  exitUtc: number | null
  exitLocal: string | null
  dwellMinutes: number | null
}

export interface EntriesResponse extends TimeRange {
  siteId: string
  totalRecords: number
  totalPages: number
  pageNumber: number
  pageSize: number
  records: EntryRecord[]
}

// Socket.IO payloads

export interface AlertEvent {
  ts: number
  eventId: string
  direction: 'zone-entry' | 'zone-exit'
  personName: string
  severity: Severity
  zoneName: string
  zoneId: string
  siteName: string
  siteId: string
}

export interface LiveOccupancyEvent {
  ts: number
  siteId: string
  siteOccupancy: number
  zoneId: string
  zoneOccupancy: number
  genderCount: { male: number; female: number }
}

export interface LiveEventMap {
  alert: AlertEvent
  live_occupancy: LiveOccupancyEvent
}
