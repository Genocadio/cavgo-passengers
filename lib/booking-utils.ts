import type { Route, Stop } from "./types"

export function getAvailableDestinations(route: Route): Stop[] {
  if (route.routeType === "city") {
    // For city routes, can book any unpassed midpoint or destination
    return route.stops.filter((stop) => !stop.isPassed && stop.name !== route.from)
  } else {
    // For provincial routes
    if (route.status === "scheduled") {
      // Can book to any destination or midpoint
      return route.stops.filter((stop) => stop.name !== route.from)
    } else if (route.status === "departed") {
      // Can only book to the next available midpoint or final destination
      const unpassedStops = route.stops.filter((stop) => !stop.isPassed)
      if (unpassedStops.length > 0) {
        // Return only the next stop and final destination
        const nextStop = unpassedStops[0]
        const finalDestination = route.stops[route.stops.length - 1]

        if (nextStop.name === finalDestination.name) {
          return [nextStop]
        } else {
          return [nextStop, finalDestination]
        }
      }
    }
  }
  return []
}

export function getAvailableOrigins(route: Route): Stop[] {
  const finalDestination = route.stops[route.stops.length - 1].name

  if (route.routeType === "city") {
    // For city routes, can start from any unpassed stop except the final destination
    return route.stops.filter((stop) => !stop.isPassed && stop.name !== finalDestination)
  } else {
    // For provincial routes
    if (route.status === "scheduled") {
      // Can only start from origin
      return route.stops.filter((stop) => stop.name === route.from)
    } else if (route.status === "departed") {
      // Can only start from the next unpassed midpoint if it's not the final destination
      const unpassedStops = route.stops.filter((stop) => !stop.isPassed)
      if (unpassedStops.length > 0 && unpassedStops[0].name !== finalDestination) {
        return [unpassedStops[0]] // Only the next stop if it's not the final destination
      }
    }
  }
  return []
}

export function getUpcomingStops(route: Route): Stop[] {
  if (route.status !== "departed") return []

  return route.stops.filter((stop) => !stop.isPassed)
}

export function getAllowedSoonStops(route: Route): Stop[] {
  if (route.routeType !== "provincial") return []

  if (route.status === "departed") {
    // For departed routes:
    // 1. Get all unpassed stops
    const unpassedStops = route.stops.filter((stop) => !stop.isPassed)
    if (unpassedStops.length <= 1) return []

    // 2. Get the next stop that will be available (the one after the currently bookable stop)
    const currentlyBookableStop = unpassedStops[0]
    const nextBookableStops = unpassedStops.slice(1)

    // 3. Filter out the final destination from the next bookable stops
    const finalDestination = route.stops[route.stops.length - 1]
    return nextBookableStops.filter(stop => stop.name !== finalDestination.name)
  } else if (route.status === "scheduled") {
    // For scheduled routes, show all midpoints except the final destination
    const midpoints = route.stops.filter((stop) => 
      stop.isMidpoint && // Only midpoints
      stop.name !== route.from && // Not the origin
      stop.name !== route.to // Not the final destination
    )
    return midpoints
  }

  return []
}

export function calculatePrice(route: Route, fromStop: string, toStop: string): number {
  const fromStopData = route.stops.find((stop) => stop.name === fromStop)
  const toStopData = route.stops.find((stop) => stop.name === toStop)

  if (!fromStopData || !toStopData) return 0

  return toStopData.price - fromStopData.price
}

export function isBookingAllowed(route: Route, fromStop: string, toStop: string): boolean {
  const availableOrigins = getAvailableOrigins(route)
  const availableDestinations = getAvailableDestinations(route)

  // If there are no available origins or destinations, booking is not allowed
  if (availableOrigins.length === 0 || availableDestinations.length === 0) {
    return false
  }

  const validOrigin = availableOrigins.some((stop) => stop.name === fromStop)
  const validDestination = availableDestinations.some((stop) => stop.name === toStop)

  return validOrigin && validDestination && route.availableSeats > 0
}

export function getEstimatedArrivalTime(route: Route, stopName: string): string | null {
  if (route.status !== "departed" || !route.currentLocation) return null

  const stop = route.stops.find((s) => s.name === stopName)
  if (!stop || stop.isPassed) return null

  // Mock calculation - in real app this would be based on actual GPS/route data
  const stopIndex = route.stops.findIndex((s) => s.name === stopName)
  const currentStopIndex = route.stops.findIndex((s) => s.name === route.currentLocation!.nextStop)

  if (stopIndex <= currentStopIndex) return null

  // Calculate estimated time based on remaining time to next stop
  const baseMinutes = Number.parseInt(route.currentLocation.remainingTime.split(" ")[0])
  const additionalStops = stopIndex - currentStopIndex
  const estimatedMinutes = baseMinutes + additionalStops * 15 // Assume 15 min between stops

  return `${estimatedMinutes} min`
}
