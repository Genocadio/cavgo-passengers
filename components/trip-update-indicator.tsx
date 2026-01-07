import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Trip } from '@/lib/features/trips/useTrips'

interface TripUpdateIndicatorProps {
  trip: Trip
  lastUpdate?: {
    type: string
    timestamp: number
  } | null
}

export function TripUpdateIndicator({ trip, lastUpdate }: TripUpdateIndicatorProps) {
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    if (lastUpdate && lastUpdate.timestamp > Date.now() - 5000) {
      setShowIndicator(true)
      const timer = setTimeout(() => setShowIndicator(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [lastUpdate])

  if (!showIndicator) return null

  const getUpdateMessage = () => {
    if (!lastUpdate) return null

    switch (lastUpdate.type) {
      case 'seats_reduced':
        return `Seats reduced to ${trip.remaining_seats ?? trip.seats}`
      case 'seats_restored':
        return `Seats restored to ${trip.remaining_seats ?? trip.seats}`
      case 'started':
        return 'Trip started'
      case 'completed':
        return 'Trip completed'
      case 'updated':
        return 'Trip updated'
      case 'waypoint_passed':
        return 'Waypoint passed'
      default:
        return 'Trip updated'
    }
  }

  const getBadgeVariant = () => {
    if (!lastUpdate) return 'secondary'

    switch (lastUpdate.type) {
      case 'seats_reduced':
        return 'destructive'
      case 'seats_restored':
        return 'default'
      case 'started':
        return 'default'
      case 'completed':
        return 'secondary'
      case 'updated':
        return 'outline'
      case 'waypoint_passed':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const message = getUpdateMessage()
  if (!message) return null

  return (
    <div className="absolute top-2 right-2 z-10">
      <Badge 
        variant={getBadgeVariant()}
        className="animate-pulse"
      >
        {message}
      </Badge>
    </div>
  )
} 