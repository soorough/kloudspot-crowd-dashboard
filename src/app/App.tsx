import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { SessionProvider, useSession } from '../auth/session'
import { API_BASE_URL } from '../config'
import { EntriesPage } from '../features/entries/EntriesPage'
import { LoginPage } from '../features/login/LoginPage'
import { OverviewPage } from '../features/overview/OverviewPage'
import { LiveProvider, createSocketIo, type SocketFactory } from '../live/live'
import { DashboardProvider } from '../sites/dashboard'
import { Shell } from './Shell'

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
        retry: (count, err) => count < 2 && !(err && 'status' in err && (err as { status: number }).status === 401),
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
