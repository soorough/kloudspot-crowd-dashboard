import type {
  DemographicsResponse,
  DwellResponse,
  EntriesResponse,
  FootfallResponse,
  OccupancyResponse,
  Site,
  TimeRange,
} from './types'

// Staging analytics calls were measured at 9–27s under load (2026-10-26), so be generous.
const REQUEST_TIMEOUT_MS = 45_000

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export interface ApiClientOptions {
  baseUrl: string
  getToken: () => string | null
  /** Called once per 401 on an authenticated request so the session can end. */
  onUnauthorized: () => void
}

export interface SiteRangeRequest extends TimeRange {
  siteId: string
}

export interface EntriesRequest extends SiteRangeRequest {
  pageNumber: number
  pageSize: number
}

export type ApiClient = ReturnType<typeof createApiClient>

export function createApiClient({ baseUrl, getToken, onUnauthorized }: ApiClientOptions) {
  async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown, auth = true): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (auth) {
      const token = getToken()
      if (token) headers.Authorization = `Bearer ${token}`
    }

    let res: Response
    try {
      res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (err) {
      const timedOut = err instanceof DOMException && err.name === 'TimeoutError'
      throw new ApiError(0, timedOut ? 'The server took too long to respond.' : 'Network error. Check your connection.')
    }

    const data = await res.json().catch(() => null)
    if (!res.ok) {
      if (res.status === 401 && auth) onUnauthorized()
      const message =
        (data && (data.errorMessage || data.message || data.error)) || `Request failed (${res.status})`
      throw new ApiError(res.status, String(message))
    }
    return data as T
  }

  return {
    login: (email: string, password: string) =>
      request<{ token: string }>('POST', '/api/auth/login', { email, password }, false),
    sites: () => request<Site[]>('GET', '/api/sites'),
    footfall: (r: SiteRangeRequest) => request<FootfallResponse>('POST', '/api/analytics/footfall', r),
    dwell: (r: SiteRangeRequest) => request<DwellResponse>('POST', '/api/analytics/dwell', r),
    occupancy: (r: SiteRangeRequest) => request<OccupancyResponse>('POST', '/api/analytics/occupancy', r),
    demographics: (r: SiteRangeRequest) =>
      request<DemographicsResponse>('POST', '/api/analytics/demographics', r),
    entries: (r: EntriesRequest) => request<EntriesResponse>('POST', '/api/analytics/entry-exit', r),
  }
}
