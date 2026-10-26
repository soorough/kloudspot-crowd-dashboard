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
        // Figma "alerts": 320px, 16px top-left radius, 20/12 padding, 12px gap.
        className="absolute inset-y-0 right-0 flex w-[320px] max-w-full flex-col gap-3 rounded-tl-2xl bg-white px-3 pt-5 pb-0 shadow-[-8px_0_24px_rgb(0_0_0/0.12)]"
      >
        <div className="flex min-h-7 shrink-0 items-center justify-between border-b border-line pb-2">
          <h2 id={titleId} className="text-lg leading-5 font-medium text-[#1e1e1f]">
            Alerts
          </h2>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close alerts"
            onClick={onClose}
            className="-mr-1 rounded p-1 text-[#1e1e1f] transition-transform hover:rotate-90 hover:bg-page focus-visible:outline-2 focus-visible:outline-brand-500"
          >
            <CloseIcon size={20} />
          </button>
        </div>
        <div className="-mx-3 min-h-0 flex-1 overflow-y-auto px-3 pb-5">
          {alerts.length === 0 && (
            <p className="px-2 py-10 text-center text-sm text-ink-muted">
              No alerts yet for this site. New entry and exit events will appear here in real time.
            </p>
          )}
          <ul aria-live="polite" aria-label="Recent alerts" className="flex flex-col gap-3">
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
      // Figma "alert box": 16px radius, 1px border, 16/12 padding, 8px row gap.
      className={`flex flex-col gap-2 rounded-2xl border px-3 py-4 text-[#1e1e1f] transition-colors duration-700 ${
        newest ? 'animate-fade-up border-[#009490] bg-[#cef2f1]' : 'border-[#d2d4d9] bg-white'
      }`}
    >
      <p className="flex gap-2 text-sm leading-[14px] tracking-[0.1px]">
        <span className="font-light">{formatLongDate(alert.ts, timeZone)}</span>
        <span>{formatTime24(alert.ts, timeZone)}</span>
      </p>
      <p className="text-base leading-[18px] font-medium tracking-[0.1px]">{`${alert.personName} ${verb}`}</p>
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1 text-sm leading-3 font-light tracking-[0.1px]">
          <PinIcon size={16} className="shrink-0" />
          <span className="truncate">{alert.zoneName}</span>
        </p>
        <span className={`shrink-0 rounded px-2 py-1.5 text-xs leading-[10px] font-medium text-white ${sev.className}`}>
          {sev.label}
        </span>
      </div>
    </li>
  )
})
