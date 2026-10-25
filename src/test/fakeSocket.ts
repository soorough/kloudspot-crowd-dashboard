import { act } from '@testing-library/react'
import type { LiveSocket, SocketFactory } from '../live/live'
import type { LiveEventMap } from '../lib/types'

/** In-memory stand-in for a Socket.IO client. Tests push server events with `emit`. */
export class FakeSocket implements LiveSocket {
  private handlers = new Map<string, Set<(...args: any[]) => void>>()
  token: string | null = null
  disconnected = false

  on(event: string, handler: (...args: any[]) => void) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler)
    return this
  }

  off(event: string, handler: (...args: any[]) => void) {
    this.handlers.get(event)?.delete(handler)
    return this
  }

  disconnect() {
    this.disconnected = true
    return this
  }

  /** Fire a lifecycle or server event to every subscriber, wrapped in act(). */
  fire(event: string, ...args: unknown[]) {
    act(() => {
      for (const h of [...(this.handlers.get(event) ?? [])]) h(...args)
    })
  }

  connect() {
    this.fire('connect')
  }

  drop() {
    this.fire('disconnect', 'transport close')
  }

  emit<E extends keyof LiveEventMap>(event: E, payload: LiveEventMap[E]) {
    this.fire(event, payload)
  }

  listenerCount(event: string) {
    return this.handlers.get(event)?.size ?? 0
  }
}

/** Factory that records every socket it creates; `latest` is the active one. */
export function fakeSocketFactory() {
  const sockets: FakeSocket[] = []
  const factory: SocketFactory = (_url, token) => {
    const s = new FakeSocket()
    s.token = token
    sockets.push(s)
    return s
  }
  return {
    factory,
    sockets,
    get latest(): FakeSocket {
      const s = sockets[sockets.length - 1]
      if (!s) throw new Error('No socket has been created yet (is the user logged in?)')
      return s
    },
  }
}
