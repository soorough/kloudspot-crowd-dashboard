import { act, screen, within } from '@testing-library/react'
import { DUBAI, SFO, alertEvent } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'

async function setup() {
  const app = renderApp({ token: true })
  await screen.findByRole('heading', { name: 'Overview' })
  await screen.findByDisplayValue(DUBAI.name)
  return { ...app, socket: app.sockets.latest }
}

const bell = () => screen.getByRole('button', { name: /^Alerts/ })

async function openDrawer(user: ReturnType<typeof renderApp>['user']) {
  await user.click(bell())
  return screen.getByRole('dialog', { name: 'Alerts' })
}

describe('alerts', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('raises the unread count for alerts at the selected site', async () => {
    const { socket } = await setup()
    expect(bell()).toHaveAccessibleName('Alerts')
    socket.emit('alert', alertEvent())
    socket.emit('alert', alertEvent({ severity: 'low' }))
    expect(bell()).toHaveAccessibleName('Alerts, 2 unread')
    expect(within(bell()).getByText('2')).toBeInTheDocument()
  })

  it('shows 9+ when more than nine are unread', async () => {
    const { socket } = await setup()
    for (let i = 0; i < 12; i++) socket.emit('alert', alertEvent({ severity: 'low' }))
    expect(bell()).toHaveAccessibleName('Alerts, 12 unread')
    expect(within(bell()).getByText('9+')).toBeInTheDocument()
  })

  it('ignores alerts for other sites', async () => {
    const { socket } = await setup()
    socket.emit('alert', alertEvent({ siteId: SFO.siteId, siteName: SFO.name }))
    expect(bell()).toHaveAccessibleName('Alerts')
  })

  it('lists the alert in the drawer and marks everything read on open', async () => {
    const { socket, user } = await setup()
    socket.emit('alert', alertEvent({ ts: Date.parse('2025-03-03T06:12:00Z') }))
    const dialog = await openDrawer(user)
    const [card] = within(dialog).getAllByRole('listitem')
    expect(within(card!).getByText('Ahmad Khan Entered')).toBeInTheDocument()
    expect(within(card!).getByText('Dubai Mall HIGH Zone')).toBeInTheDocument()
    expect(within(card!).getByText('High')).toBeInTheDocument()
    // Site-local (Dubai, UTC+4) date and 24h time.
    expect(within(card!).getByText('March 03 2025')).toBeInTheDocument()
    expect(within(card!).getByText('10:12')).toBeInTheDocument()
    expect(bell()).toHaveAccessibleName('Alerts')
  })

  it('shows an empty state before any alert arrives', async () => {
    const { user } = await setup()
    const dialog = await openDrawer(user)
    expect(within(dialog).getByText(/No alerts yet for this site/)).toBeInTheDocument()
  })

  it('renders zone exits as "Exited"', async () => {
    const { socket, user } = await setup()
    socket.emit('alert', alertEvent({ direction: 'zone-exit', severity: 'medium' }))
    const dialog = await openDrawer(user)
    expect(within(dialog).getByText('Ahmad Khan Exited')).toBeInTheDocument()
    expect(within(dialog).getByText('Medium')).toBeInTheDocument()
  })

  it('puts the newest alert first', async () => {
    const { socket, user } = await setup()
    socket.emit('alert', alertEvent({ personName: 'First Person', severity: 'low' }))
    socket.emit('alert', alertEvent({ personName: 'Second Person', severity: 'low' }))
    const dialog = await openDrawer(user)
    const cards = within(dialog).getAllByRole('listitem')
    expect(cards[0]).toHaveTextContent('Second Person Entered')
    expect(cards[0]).toHaveAttribute('aria-current', 'true')
    expect(cards[1]).toHaveTextContent('First Person Entered')
    expect(cards[1]).not.toHaveAttribute('aria-current')
  })

  it('keeps only the 50 most recent alerts', async () => {
    const { socket, user } = await setup()
    for (let i = 0; i < 55; i++) socket.emit('alert', alertEvent({ personName: `Person ${i}`, severity: 'low' }))
    const dialog = await openDrawer(user)
    const cards = within(dialog).getAllByRole('listitem')
    expect(cards).toHaveLength(50)
    expect(cards[0]).toHaveTextContent('Person 54 Entered')
    expect(within(dialog).queryByText('Person 4 Entered')).not.toBeInTheDocument()
  })

  it('lists a duplicated eventId once', async () => {
    const { socket, user } = await setup()
    const evt = alertEvent({ eventId: 'dup-1', severity: 'low' })
    socket.emit('alert', evt)
    socket.emit('alert', { ...evt })
    expect(bell()).toHaveAccessibleName('Alerts, 1 unread')
    const dialog = await openDrawer(user)
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(1)
  })

  it('toasts high-severity alerts only', async () => {
    const { socket } = await setup()
    socket.emit('alert', alertEvent({ severity: 'low', personName: 'Quiet Person' }))
    expect(screen.queryByText(/High-severity/)).not.toBeInTheDocument()
    socket.emit('alert', alertEvent())
    const toast = screen.getByText('High-severity entry · Ahmad Khan · Dubai Mall HIGH Zone')
    expect(toast.closest('[role="status"]')).toBeInTheDocument()
  })

  it('stacks at most three toasts and lets the user dismiss one', async () => {
    const { socket, user } = await setup()
    for (let i = 0; i < 4; i++) socket.emit('alert', alertEvent({ personName: `P${i}` }))
    expect(screen.getAllByText(/^High-severity entry/)).toHaveLength(3)
    expect(screen.queryByText(/· P0 ·/)).not.toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Dismiss alert' })[0]!)
    expect(screen.getAllByText(/^High-severity entry/)).toHaveLength(2)
  })

  it('auto-dismisses a toast after 5 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { socket } = await setup()
    socket.emit('alert', alertEvent())
    expect(screen.getByText(/^High-severity entry/)).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(4900)
    })
    expect(screen.getByText(/^High-severity entry/)).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(screen.queryByText(/^High-severity entry/)).not.toBeInTheDocument()
  })

  it('does not toast while the drawer is open', async () => {
    const { socket, user } = await setup()
    await openDrawer(user)
    socket.emit('alert', alertEvent())
    expect(screen.queryByText(/^High-severity entry/)).not.toBeInTheDocument()
    expect(within(screen.getByRole('dialog')).getByText('Ahmad Khan Entered')).toBeInTheDocument()
  })

  it('moves focus into the drawer, traps Tab, and returns focus to the bell on Escape', async () => {
    const { user } = await setup()
    const dialog = await openDrawer(user)
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    const close = within(dialog).getByRole('button', { name: 'Close alerts' })
    expect(close).toHaveFocus()
    await user.tab()
    expect(close).toHaveFocus()
    await user.tab({ shift: true })
    expect(close).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(bell()).toHaveFocus()
  })

  it('closes from the close button and the overlay', async () => {
    const { user } = await setup()
    let dialog = await openDrawer(user)
    await user.click(within(dialog).getByRole('button', { name: 'Close alerts' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    dialog = await openDrawer(user)
    await user.click(screen.getByTestId('alerts-overlay'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(bell()).toHaveFocus()
  })

  it('clears the list and unread count when the site changes', async () => {
    const { socket, user } = await setup()
    socket.emit('alert', alertEvent({ severity: 'low' }))
    expect(bell()).toHaveAccessibleName('Alerts, 1 unread')
    await user.selectOptions(screen.getByRole('combobox'), SFO.name)
    await screen.findByDisplayValue(SFO.name)
    expect(bell()).toHaveAccessibleName('Alerts')
    socket.emit('alert', alertEvent({ severity: 'low' })) // Dubai: now ignored
    expect(bell()).toHaveAccessibleName('Alerts')
    socket.emit('alert', alertEvent({ siteId: SFO.siteId, siteName: SFO.name, zoneName: 'SFO MEDIUM Zone', severity: 'low' }))
    const dialog = await openDrawer(user)
    const cards = within(dialog).getAllByRole('listitem')
    expect(cards).toHaveLength(1)
    expect(cards[0]).toHaveTextContent('SFO MEDIUM Zone')
  })
})
