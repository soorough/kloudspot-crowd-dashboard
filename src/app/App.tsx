import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { lazy, useEffect, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { SessionProvider, useSession } from '../auth/session'
import { I18nProvider } from '../i18n/i18n'
import { API_BASE_URL } from '../config'
import { LoginPage } from '../features/login/LoginPage'
import { LiveProvider, createSocketIo, type SocketFactory } from '../live/live'
import { DashboardProvider } from '../sites/dashboard'
import { Shell } from './Shell'

// Route-level code splitting keeps Recharts out of the login bundle.
const OverviewPage = lazy(() => import('../features/overview/OverviewPage').then((m) => ({ default: m.OverviewPage })))
const EntriesPage = lazy(() => import('../features/entries/EntriesPage').then((m) => ({ default: m.EntriesPage })))

export interface AppProps {
  baseUrl?: string
  socketFactory?: SocketFactory
  clock?: () => number
  queryClient?: QueryClient
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (count, err) => count < 1 && !(err && 'status' in err && (err as { status: number }).status === 401),
        refetchOnWindowFocus: false,
        staleTime: 60_000,
      },
    },
  })
}

/** Composition root. Tests render this with a fake socket factory, a fixed clock and MSW. */
export function App({ baseUrl = API_BASE_URL, socketFactory = createSocketIo, clock = Date.now, queryClient }: AppProps) {
  const [client] = useState(() => queryClient ?? createQueryClient())
  return (
    <QueryClientProvider client={client}>
      <I18nProvider>
      <SessionProvider baseUrl={baseUrl} clock={clock}>
        <AuthedProviders baseUrl={baseUrl} socketFactory={socketFactory} clock={clock}>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route
              element={
                <RequireAuth>
                  <Shell />
                </RequireAuth>
              }
            >
              <Route index element={<OverviewPage />} />
              <Route path="entries" element={<EntriesPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthedProviders>
      </SessionProvider>
      </I18nProvider>
    </QueryClientProvider>
  )
}

function AuthedProviders({
  baseUrl,
  socketFactory,
  clock,
  children,
}: {
  baseUrl: string
  socketFactory: SocketFactory
  clock: () => number
  children: ReactNode
}) {
  const { token } = useSession()
  const queryClient = useQueryClient()

  // Drop every cached response when the session ends so the next user starts clean.
  useEffect(() => {
    if (!token) queryClient.clear()
  }, [token, queryClient])

  return (
    <LiveProvider url={baseUrl} token={token} factory={socketFactory}>
      <DashboardProvider clock={clock}>{children}</DashboardProvider>
    </LiveProvider>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useSession()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

function LoginRoute() {
  const { isAuthenticated } = useSession()
  const location = useLocation()
  if (isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from && from !== '/login' ? from : '/'} replace />
  }
  return <LoginPage />
}
