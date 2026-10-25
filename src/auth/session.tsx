import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createApiClient, type ApiClient } from '../lib/api'

const TOKEN_KEY = 'cms.token'

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage unavailable (private mode); the session lives in memory only.
  }
}

/** JWT `exp` in ms, or null if the token has no readable expiry. */
export function tokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

/** Display name from the JWT, if present. */
function tokenUser(token: string | null): { email?: string; name?: string } {
  if (!token) return {}
  try {
    const p = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return { email: p.email, name: p.name }
  } catch {
    return {}
  }
}

function isUsable(token: string | null, now: number): token is string {
  if (!token) return false
  const exp = tokenExpiry(token)
  return exp === null || exp > now
}

interface SessionValue {
  token: string | null
  isAuthenticated: boolean
  user: { email?: string; name?: string }
  api: ApiClient
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const SessionContext = createContext<SessionValue | null>(null)

export function SessionProvider({
  baseUrl,
  clock = Date.now,
  children,
}: {
  baseUrl: string
  clock?: () => number
  children: ReactNode
}) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = readToken()
    return isUsable(stored, clock()) ? stored : null
  })

  const logout = useCallback(() => {
    writeToken(null)
    setToken(null)
  }, [])

  // Keep a ref-free getter: the client reads storage-backed state on every call.
  const api = useMemo(
    () => createApiClient({ baseUrl, getToken: readToken, onUnauthorized: logout }),
    [baseUrl, logout],
  )

  const login = useCallback(
    async (email: string, password: string) => {
      const { token: next } = await api.login(email, password)
      writeToken(next)
      setToken(next)
    },
    [api],
  )

  // Log out when the token expires while the app is open.
  useEffect(() => {
    if (!token) return
    const exp = tokenExpiry(token)
    if (exp === null) return
    const id = setTimeout(logout, Math.max(0, exp - clock()))
    return () => clearTimeout(id)
  }, [token, clock, logout])

  const value = useMemo<SessionValue>(
    () => ({ token, isAuthenticated: token !== null, user: tokenUser(token), api, login, logout }),
    [token, api, login, logout],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}

export function useApi(): ApiClient {
  return useSession().api
}
