import { useRef, useCallback, useEffect } from 'react'

interface SSEManagerOptions {
  onMessage?: (event: MessageEvent) => void
  onError?: (error: Event) => void
  onOpen?: () => void
  onClose?: () => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useSSEManager(options: SSEManagerOptions = {}) {
  const {
    onMessage,
    onError,
    onOpen,
    onClose,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5
  } = options

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const isConnectingRef = useRef(false)

  const connect = useCallback((url: string) => {
    if (isConnectingRef.current || eventSourceRef.current) {
      return
    }

    isConnectingRef.current = true
    console.log(`Connecting to SSE: ${url}`)

    try {
      const eventSource = new EventSource(url)
      
      eventSource.onopen = () => {
        console.log('SSE connection opened')
        isConnectingRef.current = false
        reconnectAttemptsRef.current = 0
        onOpen?.()
      }

      eventSource.onmessage = (event) => {
        console.log('SSE raw message received:', event)
        onMessage?.(event)
      }

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error)
        console.log('SSE connection state:', eventSource.readyState)
        isConnectingRef.current = false
        onError?.(error)
      }

      eventSourceRef.current = eventSource
    } catch (error) {
      console.error('Failed to create SSE connection:', error)
      isConnectingRef.current = false
      onError?.(error as Event)
    }
  }, [onMessage, onError, onOpen])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (eventSourceRef.current) {
      console.log('Closing SSE connection')
      eventSourceRef.current.close()
      eventSourceRef.current = null
      onClose?.()
    }

    isConnectingRef.current = false
    reconnectAttemptsRef.current = 0
  }, [onClose])

  const reconnect = useCallback((url: string) => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    reconnectAttemptsRef.current++
    console.log(`Reconnecting... Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`)

    disconnect()

    reconnectTimeoutRef.current = setTimeout(() => {
      connect(url)
    }, reconnectInterval)
  }, [disconnect, connect, reconnectInterval, maxReconnectAttempts])

  const reset = useCallback(() => {
    disconnect()
    reconnectAttemptsRef.current = 0
    isConnectingRef.current = false
  }, [disconnect])

  const addEventListener = useCallback((event: string, listener: (event: MessageEvent) => void) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.addEventListener(event, listener)
    }
  }, [])

  const removeEventListener = useCallback((event: string, listener: (event: MessageEvent) => void) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.removeEventListener(event, listener)
    }
  }, [])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    connect,
    disconnect,
    reconnect,
    reset,
    addEventListener,
    removeEventListener,
    isConnected: !!eventSourceRef.current,
    isConnecting: isConnectingRef.current
  }
} 