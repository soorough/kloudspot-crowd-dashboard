import { useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { io } from 'socket.io-client'
import type { LiveEventMap } from '../lib/types'

/** The slice of a Socket.IO client this app uses — small enough to fake in tests. */
export interface LiveSocket {
  on(event: string, handler: (...args: any[]) => void): unknown
  off(event: string, handler: (...args: any[]) => void): unknown
  disconnect(): unknown
}

export type SocketFactory = (url: string, token: string) => LiveSocket

export const createSocketIo: SocketFactory = (url, token) =>
  io(url, { auth: { token }, transports: ['websocket', 'polling'] })

export type LiveStatus = 'idle' | 'connecting' | 'live' | 'reconnecting'

interface LiveValue {
  status: LiveStatus
  socket: LiveSocket | null
}

const LiveContext = createContext<LiveValue>({ status: 'idle', socket: null })

/**
 * One Socket.IO connection for the whole app, opened while a token exists.
 * Events arrive for every site; consumers filter by `siteId`.
 * On every reconnect all queries are invalidated so REST-backed numbers catch up.
 */
export function LiveProvider({
  url,
  token,
  factory = createSocketIo,
  children,
}: {
  url: string
  token: string | null
  factory?: SocketFactory
  children: ReactNode
}) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<LiveValue>({ status: 'idle', socket: null })

  useEffect(() => {
    if (!token) {
      setState({ status: 'idle', socket: null })
      return
    }
    const socket = factory(url, token)
    let connectedBefore = false
    const onConnect = () => {
      if (connectedBefore) queryClient.invalidateQueries()
      connectedBefore = true
      setState({ status: 'live', socket })
    }
    const onDisconnect = () => setState({ status: connectedBefore ? 'reconnecting' : 'connecting', socket })
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onDisconnect)
    setState({ status: 'connecting', socket })
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onDisconnect)
      socket.disconnect()
    }
  }, [url, token, factory, queryClient])

  return <LiveContext.Provider value={state}>{children}</LiveContext.Provider>
}

export function useLiveStatus(): LiveStatus {
  return useContext(LiveContext).status
}

/**
 * Subscribe to a socket event. Pass `siteId` to receive only that site's events.
 * The handler can change between renders without resubscribing.
 */
export function useLiveEvent<E extends keyof LiveEventMap>(
  event: E,
  handler: (payload: LiveEventMap[E]) => void,
  siteId?: string | null,
) {
  const { socket } = useContext(LiveContext)
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!socket) return
    const listener = (payload: LiveEventMap[E]) => {
      if (siteId && payload.siteId !== siteId) return
      handlerRef.current(payload)
    }
    socket.on(event, listener)
    return () => {
      socket.off(event, listener)
    }
  }, [socket, event, siteId])
}
