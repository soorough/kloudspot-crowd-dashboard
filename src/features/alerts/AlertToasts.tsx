import { memo, useEffect } from 'react'
import { CloseIcon } from '../../components/icons'
import type { AlertEvent } from '../../lib/types'

export const TOAST_MS = 5000

/** Bottom-right stack of high-severity toasts (story 48). */
export function AlertToasts({ toasts, onDismiss }: { toasts: AlertEvent[]; onDismiss: (eventId: string) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="pointer-events-none fixed right-5 bottom-5 z-40 flex w-80 max-w-[calc(100vw-2.5rem)] flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.eventId} alert={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

const Toast = memo(function Toast({ alert, onDismiss }: { alert: AlertEvent; onDismiss: (eventId: string) => void }) {
  useEffect(() => {
    const id = window.setTimeout(() => onDismiss(alert.eventId), TOAST_MS)
    return () => window.clearTimeout(id)
  }, [alert.eventId, onDismiss])

  const direction = alert.direction === 'zone-exit' ? 'exit' : 'entry'
  return (
    <div
      role="status"
      className="pointer-events-auto flex items-start gap-3 rounded-md border-l-4 border-sev-high bg-white p-3 text-sm shadow-lg ring-1 ring-line"
    >
      <p className="min-w-0 flex-1">{`High-severity ${direction} · ${alert.personName} · ${alert.zoneName}`}</p>
      <button
        type="button"
        aria-label="Dismiss alert"
        onClick={() => onDismiss(alert.eventId)}
        className="shrink-0 rounded p-0.5 text-ink-muted hover:bg-page hover:text-ink focus-visible:outline-2 focus-visible:outline-brand-500"
      >
        <CloseIcon size={16} />
      </button>
    </div>
  )
})
