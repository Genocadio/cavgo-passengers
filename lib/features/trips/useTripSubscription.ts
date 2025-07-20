import { useEffect, useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Trip } from './useTrips'
import { useSSEManager } from './useSSEManager'

interface SSEEvent {
  event: string
  data: Trip | ConnectionEvent | HeartbeatEvent
}

interface ConnectionEvent {
  type: string
  message: string
  client_id: string
  session_uuid: string
  trip_count: number
}

interface HeartbeatEvent {
  type: string
  timestamp: string
}

interface TripUpdate {
  type: string
  timestamp: number
}

export function useTripSubscription(sseUuid: string | null) {
  const queryClient = useQueryClient()
  const [tripUpdates, setTripUpdates] = useState<Map<number, TripUpdate>>(new Map())
  const [connectionDetails, setConnectionDetails] = useState<{
    clientId?: string
    sessionUuid?: string
    tripCount?: number
    lastHeartbeat?: string
  }>({})
  const [currentUuid, setCurrentUuid] = useState<string | null>(null)

  // Cleanup old trip updates (older than 10 seconds)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      setTripUpdates(prev => {
        const newMap = new Map(prev)
        for (const [tripId, update] of newMap.entries()) {
          if (now - update.timestamp > 10000) { // 10 seconds
            newMap.delete(tripId)
          }
        }
        return newMap
      })
    }, 5000) // Check every 5 seconds

    return () => clearInterval(cleanupInterval)
  }, [])

  const updateTripInCache = useCallback((updatedTrip: Trip) => {
    // Update the trip in all relevant query caches
    queryClient.setQueriesData(
      { queryKey: ['trips'] },
      (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            trips: page.trips.map((trip: Trip) => 
              trip.id === updatedTrip.id ? updatedTrip : trip
            )
          }))
        }
      }
    )
  }, [queryClient])

  const handleSSEEvent = useCallback((event: MessageEvent) => {
    try {
      // Validate that we have event data
      if (!event.data) {
        console.warn('SSE event received with no data')
        return
      }

      // Log the raw event for debugging
      console.log('Raw SSE event:', {
        type: event.type,
        data: event.data,
        lastEventId: event.lastEventId,
        origin: event.origin
      })

      let sseEvent: SSEEvent
      try {
        sseEvent = JSON.parse(event.data)
      } catch (parseError) {
        console.error('Failed to parse SSE event data:', parseError)
        console.log('Raw event data:', event.data)
        return
      }

      const { event: eventType, data: eventData } = sseEvent

      console.log(`SSE Event received: ${eventType}`, eventData)

      // Handle connection and heartbeat events
      if (eventType === 'connected') {
        const connectionData = eventData as ConnectionEvent
        console.log('✅ SSE Connection established:', connectionData)
        setConnectionDetails({
          clientId: connectionData.client_id,
          sessionUuid: connectionData.session_uuid,
          tripCount: connectionData.trip_count,
          lastHeartbeat: undefined
        })
        return
      }

      if (eventType === 'heartbeat') {
        const heartbeatData = eventData as HeartbeatEvent
        console.log('💓 SSE Heartbeat received:', heartbeatData)
        setConnectionDetails(prev => ({
          ...prev,
          lastHeartbeat: heartbeatData.timestamp
        }))
        return
      }

      // For trip events, validate tripData exists and has required properties
      const tripData = eventData as Trip
      if (!tripData || typeof tripData !== 'object' || !tripData.id) {
        console.warn('Invalid SSE event data:', { eventType, tripData })
        return
      }

      // Track the update for visual indicators
      setTripUpdates(prev => new Map(prev.set(tripData.id, {
        type: eventType,
        timestamp: Date.now()
      })))

      switch (eventType) {
        case 'created':
          // Add new trip to the beginning of the list
          queryClient.setQueriesData(
            { queryKey: ['trips'] },
            (oldData: any) => {
              if (!oldData) return oldData

              return {
                ...oldData,
                pages: oldData.pages.map((page: any, index: number) => {
                  if (index === 0) {
                    return {
                      ...page,
                      trips: [tripData, ...page.trips],
                      total: page.total + 1
                    }
                  }
                  return page
                })
              }
            }
          )
          break

        case 'updated':
        case 'started':
        case 'completed':
        case 'seats_reduced':
        case 'seats_restored':
        case 'waypoint_passed':
          // Update existing trip
          updateTripInCache(tripData)
          break

        default:
          console.warn(`Unknown SSE event type: ${eventType}`)
      }
    } catch (error) {
      console.error('Error handling SSE event:', error)
    }
  }, [queryClient, updateTripInCache])

  const handleSSEError = useCallback((error: Event) => {
    console.error('SSE connection error:', error)
  }, [])

  const handleSSEOpen = useCallback(() => {
    console.log('SSE connection established')
  }, [])

  const handleSSEClose = useCallback(() => {
    console.log('SSE connection closed')
  }, [])

  const {
    connect,
    disconnect,
    reconnect,
    reset,
    addEventListener,
    removeEventListener,
    isConnected,
    isConnecting
  } = useSSEManager({
    onMessage: handleSSEEvent,
    onError: handleSSEError,
    onOpen: handleSSEOpen,
    onClose: handleSSEClose,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5
  })

  useEffect(() => {
    // If UUID changed, disconnect from previous session
    if (currentUuid && currentUuid !== sseUuid) {
      console.log(`🔄 UUID changed from ${currentUuid} to ${sseUuid}, disconnecting from previous session`)
      reset()
      setConnectionDetails({})
      setTripUpdates(new Map())
      setCurrentUuid(null)
    }

    if (sseUuid) {
      const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8080/api"
      const sseUrl = `${BACKEND_BASE_URL}/navig/events/${sseUuid}`
      
      console.log(`🔗 Starting new SSE connection with UUID: ${sseUuid}`)
      setCurrentUuid(sseUuid)
      connect(sseUrl)

      // Add specific event listeners
      const eventTypes = ['connected', 'heartbeat', 'created', 'updated', 'started', 'completed', 'seats_reduced', 'seats_restored', 'waypoint_passed']
      
      eventTypes.forEach(eventType => {
        addEventListener(eventType, handleSSEEvent)
      })

      return () => {
        console.log('🧹 Cleaning up SSE connection')
        eventTypes.forEach(eventType => {
          removeEventListener(eventType, handleSSEEvent)
        })
        disconnect()
        setCurrentUuid(null)
      }
    } else {
      console.log('❌ No SSE UUID available, skipping SSE connection')
      setCurrentUuid(null)
    }
  }, [sseUuid, connect, disconnect, reset, addEventListener, removeEventListener, handleSSEEvent, currentUuid])

  return {
    isConnected,
    isConnecting,
    tripUpdates,
    connectionDetails,
    reconnect: () => {
      if (sseUuid) {
        const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8080/api"
        const sseUrl = `${BACKEND_BASE_URL}/navig/events/${sseUuid}`
        reconnect(sseUrl)
      }
    }
  }
} 