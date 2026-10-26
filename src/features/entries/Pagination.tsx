import { ChevronLeftIcon, ChevronRightIcon } from '../../components/icons'
import { useI18n } from '../../i18n/i18n'
import { pageItems } from './pageItems'

const navBtn =
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-page hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-brand-500'

export function Pagination({ page, totalPages, onChange }: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  const { t } = useI18n()
  if (totalPages <= 1) return null
  return (
    <nav aria-label={t('entries.pagination')}>
      <ul className="flex items-center gap-1 text-sm">
        <li>
          <button type="button" aria-label={t('entries.prev')} className={navBtn} disabled={page <= 1} onClick={() => onChange(page - 1)}>
            <ChevronLeftIcon size={16} className="rtl:rotate-180" />
          </button>
        </li>
        {pageItems(page, totalPages).map((item, i) =>
          item === 'gap' ? (
            <li key={`gap-${i}`} aria-hidden="true" className="inline-flex h-8 w-6 items-end justify-center pb-1.5 text-ink-muted">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                aria-label={t('entries.page', { n: item })}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onChange(item)}
                className={`inline-flex h-8 min-w-8 items-center justify-center border-b-2 px-2 tabular-nums focus-visible:outline-2 focus-visible:outline-brand-500 ${
                  item === page
                    ? 'border-brand-500 font-medium text-brand-800'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                {item}
              </button>
            </li>
          ),
        )}
        <li>
          <button type="button" aria-label={t('entries.next')} className={navBtn} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
            <ChevronRightIcon size={16} className="rtl:rotate-180" />
          </button>
        </li>
      </ul>
    </nav>
  )
}
