import { screen } from '@testing-library/react'
import { DUBAI, SFO, VALID_LOGIN } from '../test/fixtures'
import { renderApp } from '../test/renderApp'

describe('app shell', () => {
  it('sends a logged-out visitor to the login screen', async () => {
    renderApp({ route: '/entries' })
    expect(await screen.findByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('logs in and lands on the Overview with the first site selected', async () => {
    const { user } = renderApp()
    await user.type(screen.getByLabelText(/log in/i), VALID_LOGIN.email)
    await user.type(screen.getByLabelText(/password/i), VALID_LOGIN.password)
    await user.click(screen.getByRole('button', { name: /login/i }))
    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument()
    expect(await screen.findByDisplayValue(DUBAI.name)).toBeInTheDocument()
  })

  it('remembers the previously selected site', async () => {
    renderApp({ token: true, siteId: SFO.siteId })
    expect(await screen.findByDisplayValue(SFO.name)).toBeInTheDocument()
  })

  it('opens one authenticated socket and closes it on logout', async () => {
    const { user, sockets } = renderApp({ token: true })
    await screen.findByRole('heading', { name: 'Overview' })
    expect(sockets.latest.token).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /logout/i }))
    expect(await screen.findByRole('button', { name: /login/i })).toBeInTheDocument()
    expect(sockets.latest.disconnected).toBe(true)
  })

  it('treats an expired stored token as logged out', async () => {
    const { makeToken, NOW } = await import('../test/fixtures')
    renderApp({ token: makeToken({ exp: NOW / 1000 - 60 }) })
    expect(await screen.findByRole('button', { name: /login/i })).toBeInTheDocument()
  })
})
