import { useCallback, useReducer, useRef } from 'react'
import { createPortal } from 'react-dom'
import { BellIcon } from '../../components/icons'
import type { AlertEvent } from '../../lib/types'
import { useLiveEvent } from '../../live/live'
import { useDashboard } from '../../sites/dashboard'
import { AlertsDrawer } from './AlertsDrawer'
import { AlertToasts } from './AlertToasts'
import { alertsReducer, initialAlertsState } from './alertsStore'

/**
 * Top-bar bell plus the Alerts drawer and high-severity toasts (stories 43–50).
 * Alerts are per site: the inner center is keyed by siteId, so a site switch starts empty.
 */
export function AlertsBell() {
  const { site } = useDashboard()
  return <AlertsCenter key={site?.siteId ?? 'none'} siteId={site?.siteId ?? null} timeZone={site?.timezone ?? 'UTC'} />
}

function AlertsCenter({ siteId, timeZone }: { siteId: string | null; timeZone: string }) {
  const [state, dispatch] = useReducer(alertsReducer, initialAlertsState)
  const bellRef = useRef<HTMLButtonElement>(null)

  useLiveEvent(
    'alert',
    useCallback((alert: AlertEvent) => dispatch({ type: 'received', alert }), []),
    siteId,
  )

  const open = useCallback(() => dispatch({ type: 'open' }), [])
  const close = useCallback(() => {
    dispatch({ type: 'close' })
    bellRef.current?.focus()
  }, [])
  const dismissToast = useCallback((eventId: string) => dispatch({ type: 'dismissToast', eventId }), [])

  const { unread } = state
  const label = unread > 0 ? `Alerts, ${unread} unread` : 'Alerts'

  return (
    <>
      <button
        ref={bellRef}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={state.open}
        onClick={open}
        disabled={!siteId}
        className="relative rounded p-1.5 text-ink hover:bg-page focus-visible:outline-2 focus-visible:outline-brand-500"
      >
        {/* Re-keyed per new alert so the wiggle and badge pop replay. */}
        <span key={unread} className={`block origin-top ${unread > 0 ? 'animate-wiggle' : ''}`}>
          <BellIcon />
        </span>
        {unread > 0 && (
          <span
            key={`badge-${unread}`}
            aria-hidden="true"
            className="animate-pop absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sev-high px-1 text-[10px] leading-none font-semibold text-white ring-2 ring-white"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {createPortal(
        <>
          {state.open && <AlertsDrawer alerts={state.items} timeZone={timeZone} onClose={close} />}
          {!state.open && <AlertToasts toasts={state.toasts} onDismiss={dismissToast} />}
        </>,
        document.body,
      )}
    </>
  )
}
