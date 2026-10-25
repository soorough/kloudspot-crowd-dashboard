import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App, createQueryClient } from '../app/App'
import { NOW, TEST_BASE_URL, makeToken } from './fixtures'
import { fakeSocketFactory } from './fakeSocket'

export interface RenderAppOptions {
  /** Initial URL. Default `/`. */
  route?: string
  /** Pre-seed a session token. `true` → a valid token; a string → that token; omit → logged out. */
  token?: boolean | string
  /** Site id to pre-select (as if remembered from a previous visit). */
  siteId?: string
  now?: number
}

/**
 * The single app-level test seam (docs/SPEC.md → Testing Decisions):
 * real providers + routing, MSW for HTTP, a fake Socket.IO client, a fixed clock.
 */
export function renderApp({ route = '/', token, siteId, now = NOW }: RenderAppOptions = {}) {
  localStorage.clear()
  if (token) localStorage.setItem('cms.token', token === true ? makeToken() : token)
  if (siteId) localStorage.setItem('cms.siteId', siteId)

  const sockets = fakeSocketFactory()
  const queryClient = createQueryClient()
  queryClient.setDefaultOptions({ queries: { ...queryClient.getDefaultOptions().queries, retry: false } })
  const user = userEvent.setup()

  const utils = render(
    <MemoryRouter initialEntries={[route]}>
      <App baseUrl={TEST_BASE_URL} socketFactory={sockets.factory} clock={() => now} queryClient={queryClient} />
    </MemoryRouter>,
  )

  return { ...utils, user, sockets, queryClient }
}
