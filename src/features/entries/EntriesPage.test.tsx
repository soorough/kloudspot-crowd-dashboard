import { screen, waitFor, within } from '@testing-library/react'
import { SFO } from '../../test/fixtures'
import { renderApp } from '../../test/renderApp'
import { HttpResponse, apiUrl, http, server } from '../../test/server'

type EntriesBody = { siteId: string; pageNumber: number; pageSize: number }

function captureEntryRequests() {
  const bodies: EntriesBody[] = []
  server.use(
    http.post(apiUrl('/api/analytics/entry-exit'), async ({ request }) => {
      bodies.push((await request.clone().json()) as EntriesBody)
      // Fall through to the default handler.
    }),
  )
  return bodies
}

async function bodyRows() {
  await screen.findByText('Visitor 1')
  return within(screen.getByRole('table')).getAllByRole('row').slice(1)
}

function rowFor(name: string) {
  return screen.getByText(name).closest('tr') as HTMLElement
}

describe('Crowd Entries', () => {
  it('shows the first 10 visits with initials avatars', async () => {
    renderApp({ token: true, route: '/entries' })
    expect(await screen.findByRole('heading', { name: 'Crowd Entries' })).toBeInTheDocument()
    expect(await bodyRows()).toHaveLength(10)
    for (const col of ['Name', 'Sex', 'Entry', 'Exit', 'Dwell Time']) {
      expect(screen.getByRole('columnheader', { name: col })).toBeInTheDocument()
    }
    const first = rowFor('Visitor 1')
    expect(within(first).getByText('V1')).toBeInTheDocument()
    expect(within(first).getByText('Male')).toBeInTheDocument()
    expect(within(rowFor('Visitor 2')).getByText('Female')).toBeInTheDocument()
    expect(screen.getByText('Showing 1–10 of 47')).toBeInTheDocument()
  })

  it('shows "--" for visitors still inside and HH:MM dwell for finished visits', async () => {
    renderApp({ token: true, route: '/entries' })
    await bodyRows()
    const inside = rowFor('Visitor 1')
    expect(within(inside).getAllByText('--')).toHaveLength(2)
    expect(within(inside).getByText('(still inside)')).toBeInTheDocument()

    const done = rowFor('Visitor 4')
    expect(within(done).getByText('00:20')).toBeInTheDocument()
    expect(within(done).queryByText('(still inside)')).not.toBeInTheDocument()
  })

  it('shows entry and exit times in the site timezone', async () => {
    renderApp({ token: true, route: '/entries' })
    await bodyRows()
    // NOW is 14:30 Dubai; Visitor 1 entered 5 minutes earlier.
    expect(within(rowFor('Visitor 1')).getByText('02:25 PM')).toBeInTheDocument()
    // Visitor 4 entered at 14:10 and left 20 minutes later.
    const done = rowFor('Visitor 4')
    expect(within(done).getByText('02:10 PM')).toBeInTheDocument()
    expect(within(done).getByText('02:30 PM')).toBeInTheDocument()
  })

  it('fetches the next page server-side', async () => {
    const bodies = captureEntryRequests()
    const { user } = renderApp({ token: true, route: '/entries' })
    await bodyRows()
    expect(bodies.at(-1)).toMatchObject({ pageNumber: 1, pageSize: 10 })

    await user.click(screen.getByRole('button', { name: 'Page 2' }))
    expect(await screen.findByText('Visitor 11')).toBeInTheDocument()
    expect(bodies.at(-1)).toMatchObject({ pageNumber: 2, pageSize: 10 })
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('button', { name: 'Next page' }))
    expect(await screen.findByText('Visitor 21')).toBeInTheDocument()
    expect(bodies.at(-1)).toMatchObject({ pageNumber: 3, pageSize: 10 })
  })

  it('shows 7 rows on the last page and disables Next', async () => {
    const { user } = renderApp({ token: true, route: '/entries' })
    await bodyRows()
    const nav = screen.getByRole('navigation', { name: 'Pagination' })
    expect(within(nav).getByRole('button', { name: 'Previous page' })).toBeDisabled()

    await user.click(within(nav).getByRole('button', { name: 'Page 5' }))
    expect(await screen.findByText('Visitor 47')).toBeInTheDocument()
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('row').slice(1)).toHaveLength(7)
    expect(within(nav).getByRole('button', { name: 'Next page' })).toBeDisabled()
    expect(screen.getByText('Showing 41–47 of 47')).toBeInTheDocument()
  })

  it('collapses long page ranges with an ellipsis', async () => {
    renderApp({ token: true, route: '/entries' })
    await bodyRows()
    const nav = screen.getByRole('navigation', { name: 'Pagination' })
    expect(within(nav).getByText('…')).toBeInTheDocument()
    expect(within(nav).queryByRole('button', { name: 'Page 4' })).not.toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page')
  })

  it('shows an empty state when the day has no visits', async () => {
    server.use(
      http.post(apiUrl('/api/analytics/entry-exit'), () =>
        HttpResponse.json({
          siteId: 'site-dxb',
          fromUtc: 0,
          toUtc: 0,
          totalRecords: 0,
          totalPages: 0,
          pageNumber: 1,
          pageSize: 10,
          records: [],
        }),
      ),
    )
    renderApp({ token: true, route: '/entries' })
    expect(await screen.findByText('No visits recorded for this day.')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument()
  })

  it('offers Retry when the request fails', async () => {
    let fail = true
    server.use(
      http.post(apiUrl('/api/analytics/entry-exit'), () => {
        if (fail) return HttpResponse.json({ errorMessage: 'Server exploded' }, { status: 500 })
      }),
    )
    const { user } = renderApp({ token: true, route: '/entries' })
    expect(await screen.findByText('Server exploded')).toBeInTheDocument()
    fail = false
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Visitor 1')).toBeInTheDocument()
  })

  it('resets to page 1 when the site changes', async () => {
    const bodies = captureEntryRequests()
    const { user } = renderApp({ token: true, route: '/entries' })
    await bodyRows()
    await user.click(screen.getByRole('button', { name: 'Page 2' }))
    expect(await screen.findByText('Visitor 11')).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox'), SFO.name)
    await waitFor(() => expect(bodies.at(-1)).toMatchObject({ siteId: SFO.siteId, pageNumber: 1 }))
    expect(await screen.findByText('Visitor 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page')
  })
})
