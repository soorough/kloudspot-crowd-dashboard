import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useApi } from '../../auth/session'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, ErrorState, Skeleton, errorMessage } from '../../components/ui'
import { formatClock, formatDwellShort } from '../../lib/time'
import type { EntryRecord } from '../../lib/types'
import { useDashboard } from '../../sites/dashboard'
import { Avatar } from './Avatar'
import { Pagination } from './Pagination'

/** Fixed to match the Figma curl; there is no page-size picker in the design. */
export const PAGE_SIZE = 10

const COLUMNS = ['Name', 'Sex', 'Entry', 'Exit', 'Dwell Time']

export function EntriesPage() {
  const api = useApi()
  const { site, windows } = useDashboard()

  // Page is scoped to site + day: a new scope starts at page 1 without an effect-driven reset.
  const scope = `${site?.siteId}|${windows?.day}`
  const [paging, setPaging] = useState({ scope, page: 1 })
  const page = paging.scope === scope ? paging.page : 1
  const setPage = (p: number) => setPaging({ scope, page: p })

  const query = useQuery({
    queryKey: ['entries', site?.siteId, windows?.current.fromUtc, windows?.current.toUtc, page],
    queryFn: () =>
      api.entries({
        siteId: site!.siteId,
        fromUtc: windows!.current.fromUtc,
        toUtc: windows!.current.toUtc,
        pageNumber: page,
        pageSize: PAGE_SIZE,
      }),
    enabled: !!site && !!windows,
    placeholderData: keepPreviousData,
  })

  // If the result set shrank (e.g. after a refresh), clamp to the new last page.
  const totalPages = query.data?.totalPages ?? 0
  useEffect(() => {
    if (!query.isPlaceholderData && totalPages > 0 && page > totalPages) {
      setPaging({ scope, page: totalPages })
    }
  }, [query.isPlaceholderData, totalPages, page, scope])

  if (!site || !windows) return <PageHeader title="Crowd Entries" />

  const data = query.data
  const stale = query.isPlaceholderData
  const timeZone = site.timezone

  let body
  if (query.isError && !data) {
    body = <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
  } else if (!data) {
    body = <EntriesTable rows={null} timeZone={timeZone} />
  } else if (data.records.length === 0 && data.totalRecords === 0) {
    body = <EmptyState>No visits recorded for this day.</EmptyState>
  } else {
    const first = (data.pageNumber - 1) * data.pageSize + 1
    const last = first + data.records.length - 1
    body = (
      <>
        <div className={`transition-opacity ${stale ? 'opacity-60' : ''}`} aria-busy={stale || undefined}>
          <EntriesTable rows={data.records} timeZone={timeZone} />
        </div>
        <div className="mt-4 flex flex-col-reverse items-center gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr]">
          <p className="text-sm text-ink-muted tabular-nums sm:justify-self-start">
            Showing {first}–{last} of {data.totalRecords}
          </p>
          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Crowd Entries" />
      <section className="rounded-lg border border-line bg-white p-4" aria-label="Visits">
        {body}
      </section>
    </>
  )
}

function EntriesTable({ rows, timeZone }: { rows: EntryRecord[] | null; timeZone: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <caption className="sr-only">Visits for the selected day</caption>
        <thead>
          <tr className="bg-page">
            {COLUMNS.map((c) => (
              <th key={c} scope="col" className="h-10 px-4 text-[0.8125rem] font-medium whitespace-nowrap text-ink">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody aria-busy={rows === null || undefined}>
          {rows === null
            ? Array.from({ length: PAGE_SIZE }, (_, i) => (
                <tr key={i} className="h-11 border-b border-line last:border-b-0">
                  {COLUMNS.map((c) => (
                    <td key={c} className="px-4">
                      <Skeleton className="h-3.5 w-20" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((r) => <EntryRow key={`${r.personId}-${r.entryUtc}`} record={r} timeZone={timeZone} />)}
        </tbody>
      </table>
    </div>
  )
}

function EntryRow({ record: r, timeZone }: { record: EntryRecord; timeZone: string }) {
  const inside = r.exitUtc == null
  const sex = r.gender ? r.gender.charAt(0).toUpperCase() + r.gender.slice(1).toLowerCase() : '--'
  return (
    <tr className="h-11 border-b border-line text-ink-muted last:border-b-0">
      <td className="px-4 whitespace-nowrap">
        <span className="flex items-center gap-2.5">
          <Avatar name={r.personName} />
          <span className="text-ink">{r.personName}</span>
          {inside && <span className="sr-only">(still inside)</span>}
        </span>
      </td>
      <td className="px-4">{sex}</td>
      <td className="px-4 whitespace-nowrap tabular-nums">{formatClock(r.entryUtc, timeZone)}</td>
      <td className="px-4 whitespace-nowrap tabular-nums">{formatClock(r.exitUtc, timeZone)}</td>
      <td className="px-4 tabular-nums">{formatDwellShort(r.dwellMinutes)}</td>
    </tr>
  )
}
