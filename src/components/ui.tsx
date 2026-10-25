import type { ReactNode } from 'react'

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
  return (
    <div role="alert" className="flex flex-col items-start gap-2 text-sm text-ink-muted">
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-line px-3 py-1 text-ink hover:bg-page focus-visible:outline-2 focus-visible:outline-brand-500"
        >
          Retry
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
