import { useEffect, useState, type ReactNode } from 'react'
import { useI18n } from '../i18n/i18n'
import type { MessageKey } from '../i18n/messages'

/** White surface used by every dashboard panel. */
export function Card({ title, actions, className = '', children }: {
  title?: ReactNode
  actions?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={`rounded-lg border border-line bg-white p-4 ${className}`}>
      {(title || actions) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {title && <h3 className="text-[0.95rem] font-medium text-ink">{title}</h3>}
          {actions}
        </header>
      )}
      {children}
    </section>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-line/70 ${className}`} aria-hidden="true" />
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n()
  return (
    <div role="alert" className="flex flex-col items-start gap-2 text-sm text-ink-muted">
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-line px-3 py-1 text-ink hover:bg-page focus-visible:outline-2 focus-visible:outline-brand-500"
        >
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-ink-muted">{children}</p>
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong.'
}

const SLOW_MESSAGES: { after: number; key: MessageKey }[] = [
  { after: 4000, key: 'slow.1' },
  { after: 12000, key: 'slow.2' },
  { after: 25000, key: 'slow.3' },
]

/**
 * Shown under a skeleton once loading drags on (the staging API can take 10–30s).
 * A small brand pill with a live pulse; the copy softens the longer the wait.
 */
export function SlowHint({ className = '' }: { className?: string }) {
  const [step, setStep] = useState(-1)
  const { t } = useI18n()
  useEffect(() => {
    const ids = SLOW_MESSAGES.map((m, i) => setTimeout(() => setStep(i), m.after))
    return () => ids.forEach(clearTimeout)
  }, [])
  if (step < 0) return null
  return (
    <p
      role="status"
      className={`animate-fade-up inline-flex w-fit items-center gap-2 rounded-full bg-brand-50 py-1 ps-2 pe-3 text-xs font-medium text-brand-800 ring-1 ring-brand-100 ${className}`}
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-50" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
      </span>
      <span key={step} className="animate-fade-up">
        {t(SLOW_MESSAGES[step].key)}
      </span>
    </p>
  )
}
