import { memo, useEffect, useId, useRef } from 'react'
import { CloseIcon, PinIcon } from '../../components/icons'
import type { AlertEvent, Severity } from '../../lib/types'
import { formatLongDate, formatTime24 } from '../../lib/time'

const SEVERITY: Record<Severity, { label: string; className: string }> = {
  high: { label: 'High', className: 'bg-sev-high' },
  medium: { label: 'Medium', className: 'bg-sev-medium' },
  low: { label: 'Low', className: 'bg-sev-low' },
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Modal right-side drawer: focus trapped, Escape / overlay click close it (story 44). */
export function AlertsDrawer({
  alerts,
  timeZone,
  onClose,
}: {
  alerts: AlertEvent[]
  timeZone: string
  /** Must be stable (useCallback); the open effect depends on it. */
  onClose: () => void
}) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const panel = panelRef.current
    // Slide in via the Web Animations API, skipped for reduced motion (and in jsdom).
    if (panel && typeof panel.animate === 'function' && !prefersReducedMotion()) {
      panel.animate([{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }], {
        duration: 200,
        easing: 'cubic-bezier(0.2, 0, 0, 1)',
      })
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (focusable.length === 0) return
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      const active = document.activeElement
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // onClose is a stable callback from the bell, so this runs once per open.
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50">
      <div data-testid="alerts-overlay" className="absolute inset-0 bg-ink/40" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 right-0 flex w-[340px] max-w-full flex-col bg-white shadow-[-8px_0_24px_rgb(0_0_0/0.12)]"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <h2 id={titleId} className="text-lg font-medium">
            Alerts
          </h2>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close alerts"
            onClick={onClose}
            className="rounded p-1.5 text-ink-muted hover:bg-page hover:text-ink focus-visible:outline-2 focus-visible:outline-brand-500"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {alerts.length === 0 && (
            <p className="px-2 py-10 text-center text-sm text-ink-muted">
              No alerts yet for this site. New entry and exit events will appear here in real time.
            </p>
          )}
          <ul aria-live="polite" aria-label="Recent alerts" className="flex flex-col gap-2">
            {alerts.map((a, i) => (
              <AlertCard key={a.eventId} alert={a} newest={i === 0} timeZone={timeZone} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

const AlertCard = memo(function AlertCard({
  alert,
  newest,
  timeZone,
}: {
  alert: AlertEvent
  newest: boolean
  timeZone: string
}) {
  const sev = SEVERITY[alert.severity] ?? SEVERITY.low
  const verb = alert.direction === 'zone-exit' ? 'Exited' : 'Entered'
  return (
    <li
      aria-current={newest ? 'true' : undefined}
      className={`rounded-md border p-3 ${newest ? 'border-brand-300 bg-brand-50' : 'border-line bg-white'}`}
    >
      <p className="flex gap-2 text-xs text-ink-muted">
        <span>{formatLongDate(alert.ts, timeZone)}</span>
        <span>{formatTime24(alert.ts, timeZone)}</span>
      </p>
      <p className="mt-1 text-sm font-semibold">{`${alert.personName} ${verb}`}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1 text-xs text-ink-muted">
          <PinIcon size={14} className="shrink-0" />
          <span className="truncate">{alert.zoneName}</span>
        </p>
        <span className={`shrink-0 rounded-sm px-2 py-0.5 text-[11px] font-medium text-white ${sev.className}`}>
          {sev.label}
        </span>
      </div>
    </li>
  )
})
