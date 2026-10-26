import { screen } from '@testing-library/react'
import { alertEvent } from '../test/fixtures'
import { renderApp } from '../test/renderApp'

afterEach(() => {
  document.documentElement.lang = 'en'
  document.documentElement.dir = 'ltr'
})

describe('language toggle', () => {
  it('switches the whole UI to Arabic, right-to-left', async () => {
    const { user } = renderApp({ token: true })
    await screen.findByRole('heading', { name: 'Overview' })

    await user.click(screen.getByRole('button', { name: 'العربية' }))

    expect(await screen.findByRole('heading', { name: 'نظرة عامة' })).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(document.documentElement).toHaveAttribute('lang', 'ar')
    expect(screen.getByRole('link', { name: 'سجلات الحشود' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'العربية' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('translates live alerts and keeps the socket connected across the switch', async () => {
    const { user, sockets } = renderApp({ token: true })
    await screen.findByRole('heading', { name: 'Overview' })
    const socket = sockets.latest

    await user.click(screen.getByRole('button', { name: 'العربية' }))
    socket.emit('alert', alertEvent({ personName: 'Ahmad Khan', direction: 'zone-entry', severity: 'low' }))
    await user.click(await screen.findByRole('button', { name: /التنبيهات/ }))

    expect(await screen.findByText(/^دخل \u2068?Ahmad Khan\u2069?$/)).toBeInTheDocument()
    expect(screen.getByText('منخفضة')).toBeInTheDocument()
    expect(sockets.sockets).toHaveLength(1)
    expect(socket.disconnected).toBe(false)
  })

  it('remembers the choice and switches back to English', async () => {
    const first = renderApp({ token: true })
    await screen.findByRole('heading', { name: 'Overview' })
    await first.user.click(screen.getByRole('button', { name: 'العربية' }))
    await screen.findByRole('heading', { name: 'نظرة عامة' })
    expect(localStorage.getItem('cms.lang')).toBe('ar')

    await first.user.click(screen.getByRole('button', { name: 'English' }))
    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('dir', 'ltr')
    expect(localStorage.getItem('cms.lang')).toBe('en')
  })
})
