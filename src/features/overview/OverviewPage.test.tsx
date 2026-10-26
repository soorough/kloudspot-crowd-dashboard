import { screen, within } from '@testing-library/react'
import { HOUR_MS } from '../../lib/time'
import { SFO, alertEvent, liveOccupancyEvent } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'
import { HttpResponse, apiUrl, http, server } from '../../test/server'

const stat = (name: string) => screen.findByRole('group', { name })

async function renderOverview() {
  const utils = renderApp({ token: true })
  // Wait for the REST-backed values before driving the socket.
  await within(await stat("Today's Footfall")).findByText('2,436')
  return utils
}

describe('Overview page', () => {
  it('shows the summary cards with values and comparisons', async () => {
    await renderOverview()

    const footfall = await stat("Today's Footfall")
    expect(within(footfall).getByText('10% Less than yesterday')).toBeInTheDocument()

    const dwell = await stat('Avg Dwell Time')
    expect(await within(dwell).findByText('08min 30sec')).toBeInTheDocument()
    expect(within(dwell).getByText('6% More than yesterday')).toBeInTheDocument()

    // Before any live event: the latest bucket (150 + 2 * 14 = 178), same hour yesterday is equal.
    const live = await stat('Live Occupancy')
    expect(await within(live).findByText('178')).toBeInTheDocument()
    expect(within(live).getByText('Same as yesterday')).toBeInTheDocument()
  })

  it('updates live occupancy from the stream and ignores other sites', async () => {
    const { sockets } = await renderOverview()
    const live = await stat('Live Occupancy')
    await within(live).findByText('178')

    sockets.latest.emit('live_occupancy', liveOccupancyEvent({ siteOccupancy: 812 }))
    expect(within(live).getByText('812')).toBeInTheDocument()
    expect(within(live).getByText('356% More than yesterday')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Latest 812/ })).toBeInTheDocument()

    sockets.latest.emit('live_occupancy', liveOccupancyEvent({ siteId: SFO.siteId, siteOccupancy: 99 }))
    expect(within(live).getByText('812')).toBeInTheDocument()
    expect(within(live).queryByText('99')).not.toBeInTheDocument()
  })

  it('counts footfall up on zone-entry alerts only', async () => {
    const { sockets } = await renderOverview()
    const footfall = await stat("Today's Footfall")

    sockets.latest.emit('alert', alertEvent({ direction: 'zone-entry' }))
    expect(within(footfall).getByText('2,437')).toBeInTheDocument()

    sockets.latest.emit('alert', alertEvent({ direction: 'zone-exit' }))
    sockets.latest.emit('alert', alertEvent({ direction: 'zone-entry', siteId: SFO.siteId }))
    expect(within(footfall).getByText('2,437')).toBeInTheDocument()
  })

  it('shows the demographic share in the donut legend', async () => {
    renderApp({ token: true })
    const legend = await screen.findByRole('list', { name: 'Demographic share' })
    expect(legend).toHaveTextContent('55% Males')
    expect(legend).toHaveTextContent('45% Females')
    expect(screen.getByRole('img', { name: /^Demographic share: 55% Males, 45% Females/ })).toBeInTheDocument()
  })

  it('keeps the other cards when footfall fails, and retries', async () => {
    let fail = true
    server.use(
      http.post(apiUrl('/api/analytics/footfall'), () =>
        fail ? HttpResponse.json({}, { status: 500 }) : HttpResponse.json({ footfall: 1000 }),
      ),
    )
    const { user } = renderApp({ token: true })

    const footfall = await stat("Today's Footfall")
    const retry = await within(footfall).findByRole('button', { name: 'Retry' })
    expect(await within(await stat('Avg Dwell Time')).findByText('08min 30sec')).toBeInTheDocument()
    expect(await within(await stat('Live Occupancy')).findByText('178')).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /Hourly average occupancy/ })).toBeInTheDocument()

    fail = false
    await user.click(retry)
    expect(await within(footfall).findByText('1,000')).toBeInTheDocument()
  })

  it('refetches every panel for the newly selected site', async () => {
    const seen: string[] = []
    server.events.on('request:start', async ({ request }) => {
      if (request.method === 'POST' && request.url.includes('/api/analytics/')) {
        const body = (await request.clone().json()) as { siteId: string }
        seen.push(`${new URL(request.url).pathname}:${body.siteId}`)
      }
    })
    server.use(
      http.post(apiUrl('/api/analytics/footfall'), async ({ request }) => {
        const b = (await request.json()) as { siteId: string; toUtc: number }
        const isPrevious = b.toUtc < Date.parse('2026-10-26T00:00:00Z') - 4 * HOUR_MS
        return HttpResponse.json({ footfall: b.siteId === SFO.siteId ? (isPrevious ? 1000 : 1234) : 2436 })
      }),
    )
    const { user } = await renderOverview()

    await user.selectOptions(screen.getByRole('combobox'), SFO.siteId)
    const footfall = await stat("Today's Footfall")
    expect(await within(footfall).findByText('1,234')).toBeInTheDocument()
    expect(within(footfall).getByText('23% More than yesterday')).toBeInTheDocument()
    for (const path of ['footfall', 'dwell', 'occupancy', 'demographics']) {
      expect(seen).toContain(`/api/analytics/${path}:${SFO.siteId}`)
    }
    server.events.removeAllListeners()
  })
})
