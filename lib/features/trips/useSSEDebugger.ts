import { useCallback } from 'react'

interface SSEDebuggerOptions {
  enabled?: boolean
  logEvents?: boolean
  logErrors?: boolean
  logConnection?: boolean
}

export function useSSEDebugger(options: SSEDebuggerOptions = {}) {
  const {
    enabled = process.env.NODE_ENV === 'development',
    logEvents = true,
    logErrors = true,
    logConnection = true
  } = options

  const logEvent = useCallback((eventType: string, data: any) => {
    if (!enabled || !logEvents) return
    
    console.group(`🔔 SSE Event: ${eventType}`)
    console.log('Timestamp:', new Date().toISOString())
    console.log('Event Type:', eventType)
    console.log('Data:', data)
    console.groupEnd()
  }, [enabled, logEvents])

  const logError = useCallback((error: any, context?: string) => {
    if (!enabled || !logErrors) return
    
    console.group(`❌ SSE Error${context ? `: ${context}` : ''}`)
    console.log('Timestamp:', new Date().toISOString())
    console.log('Error:', error)
    console.groupEnd()
  }, [enabled, logErrors])

  const logConnectionStatus = useCallback((status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting', details?: any) => {
    if (!enabled || !logConnection) return
    
    const emoji = {
      connecting: '🔄',
      connected: '✅',
      disconnected: '❌',
      reconnecting: '🔄'
    }[status]

    console.group(`${emoji} SSE Connection: ${status}`)
    console.log('Timestamp:', new Date().toISOString())
    if (details) {
      console.log('Details:', details)
    }
    console.groupEnd()
  }, [enabled, logConnection])

  const logPerformance = useCallback((operation: string, duration: number) => {
    if (!enabled) return
    
    console.log(`⏱️ SSE Performance: ${operation} took ${duration}ms`)
  }, [enabled])

  return {
    logEvent,
    logError,
    logConnectionStatus,
    logPerformance,
    isEnabled: enabled
  }
} 