import type { AlertEvent } from '../../lib/types'

/** Most recent alerts kept per site (story 49). */
export const MAX_ALERTS = 50
/** Toasts visible at once; older ones drop off the stack. */
export const MAX_TOASTS = 3

export interface AlertsState {
  /** Newest first, at most MAX_ALERTS, unique by eventId. */
  items: AlertEvent[]
  unread: number
  open: boolean
  /** High-severity alerts currently toasted, oldest first. */
  toasts: AlertEvent[]
}

export type AlertsAction =
  | { type: 'received'; alert: AlertEvent }
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'dismissToast'; eventId: string }

export const initialAlertsState: AlertsState = { items: [], unread: 0, open: false, toasts: [] }

/**
 * Pure alerts store for one site. Site scoping is done by the caller
 * (the store is remounted per site, so switching sites starts from empty).
 */
export function alertsReducer(state: AlertsState, action: AlertsAction): AlertsState {
  switch (action.type) {
    case 'received': {
      const { alert } = action
      if (state.items.some((a) => a.eventId === alert.eventId)) return state
      const items = [alert, ...state.items]
      if (items.length > MAX_ALERTS) items.length = MAX_ALERTS
      const toast = alert.severity === 'high' && !state.open
      return {
        ...state,
        items,
        unread: state.open ? 0 : state.unread + 1,
        toasts: toast ? [...state.toasts, alert].slice(-MAX_TOASTS) : state.toasts,
      }
    }
    case 'open':
      // Opening marks everything read; toasts are redundant once the list is visible.
      return { ...state, open: true, unread: 0, toasts: [] }
    case 'close':
      return state.open ? { ...state, open: false } : state
    case 'dismissToast': {
      const toasts = state.toasts.filter((t) => t.eventId !== action.eventId)
      return toasts.length === state.toasts.length ? state : { ...state, toasts }
    }
  }
}
