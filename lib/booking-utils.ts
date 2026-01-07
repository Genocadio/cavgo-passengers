import { Trip, TripWaypoint } from "./features/trips/useTrips";

export function getAvailableDestinations(trip: Trip): TripWaypoint[] {
  if (!trip.waypoints) return [];
  let filteredWaypoints: TripWaypoint[] = [];
  if (trip.route.city_route) {
    filteredWaypoints = trip.waypoints.filter(
      (stop) => !stop.is_passed && stop.location.id !== trip.route.origin_id
    );
  } else {
    if (trip.status === "SCHEDULED") {
      filteredWaypoints = trip.waypoints.filter(
        (stop) => stop.location_id !== trip.route.origin_id
      );
    } else if (trip.status === "IN_PROGRESS") {
      const unpassedStops = trip.waypoints.filter((stop) => !stop.is_passed);
      if (unpassedStops.length > 0) {
        const nextStopOrder = unpassedStops[0].order;
        filteredWaypoints = trip.waypoints.filter(
          (stop) => !stop.is_passed && stop.order <= nextStopOrder
        );
      }
    }
  }

  // Always ensure final destination is available for booking if trip is not completed
  if (trip.status !== "COMPLETED") {
    const hasFinalDestination = filteredWaypoints.some(
      (stop) => String(stop.location_id) === String(trip.route.destination_id)
    );
    if (!hasFinalDestination) {
      // Create a virtual TripWaypoint for the final destination
      filteredWaypoints.push({
        id: `${trip.route.destination_id}`,
        trip_id: trip.id,
        location_id: trip.route.destination_id,
        order: trip.waypoints?.length || 0, // Place it at the end
        price: trip.route.route_price || 0,
        is_passed: false,
        is_next: false,
        is_custom: false,
        created_at: trip.created_at,
        updated_at: trip.updated_at,
        location: trip.route.destination,
      } as TripWaypoint);
    }
  }

  return filteredWaypoints.sort((a, b) => a.order - b.order);
}

export function getAvailableOrigins(trip: Trip): TripWaypoint[] {
  if (!trip.waypoints || trip.waypoints.length === 0) {
    // For non-city, scheduled routes, return a virtual origin waypoint if waypoints are missing
    if (!trip.route.city_route && trip.status === "SCHEDULED") {
      return [
        {
          id: `${trip.route.origin_id}`,
          trip_id: trip.id,
          location_id: trip.route.origin_id,
          order: 0,
          price: 0,
          is_passed: false,
          is_next: true,
          is_custom: false,
          created_at: trip.created_at,
          updated_at: trip.updated_at,
          location: trip.route.origin,
        } as TripWaypoint,
      ];
    }
    return [];
  }
  const finalDestination = trip.route.destination_id;
  if (trip.route.city_route) {
    if(trip.status == "SCHEDULED") {
      const waypointOrigins = trip.waypoints.filter((stop) => !stop.is_passed && stop.location_id !== finalDestination)
      // Add origin as the first option for city routes only when scheduled
      const originWaypoint = {
        id: `${trip.route.origin_id}`,
        trip_id: trip.id,
        location_id: trip.route.origin_id,
        order: 0,
        price: 0,
        is_passed: false,
        is_next: true,
        is_custom: false,
        created_at: trip.created_at,
        updated_at: trip.updated_at,
        location: trip.route.origin,
      } as TripWaypoint
      return [originWaypoint, ...waypointOrigins]
    } else if (trip.status === "IN_PROGRESS") {
      // For IN_PROGRESS city routes, return only unpassed waypoints (NOT origin)
      const unpassedStops = trip.waypoints.filter((stop) => !stop.is_passed && stop.location_id !== trip.route.origin_id)
      return unpassedStops.sort((a, b) => a.order - b.order)
    }
  } else {
    if (trip.status === "SCHEDULED") {
      const origins = trip.waypoints.filter((stop) => stop.location_id === trip.route.origin_id)
      // If not found, return a virtual origin waypoint
      if (origins.length === 0) {
        return [
          {
            id: `${trip.route.origin_id}`,
            trip_id: trip.id,
            location_id: trip.route.origin_id,
            order: 0,
            price: 0,
            is_passed: false,
            is_next: true,
            is_custom: false,
            created_at: trip.created_at,
            updated_at: trip.updated_at,
            location: trip.route.origin,
          } as TripWaypoint,
        ];
      }
      return origins;
    } else if (trip.status === "IN_PROGRESS") {
      const unpassedStops = trip.waypoints
        .filter((stop) => !stop.is_passed)
        .sort((a, b) => a.order - b.order)
      // Prefer the waypoint flagged as next; if none, fallback to the first unpassed waypoint
      const explicitNext = unpassedStops.find((stop) => stop.is_next)
      const fallbackNext = unpassedStops[0]
      return explicitNext ? [explicitNext] : fallbackNext ? [fallbackNext] : []
    }
  }
  return []
}

export function getUpcomingStops(trip: Trip): TripWaypoint[] {
  if (trip.status !== "IN_PROGRESS" || !trip.waypoints) return []
  return trip.waypoints.filter((stop) => !stop.is_passed)
}

export function getAllowedSoonStops(trip: Trip): TripWaypoint[] {
  if (!trip.route.city_route || !trip.waypoints) return []
  if (trip.status === "IN_PROGRESS") {
    const unpassedStops = trip.waypoints.filter((stop) => !stop.is_passed)
    if (unpassedStops.length <= 1) return []
    const nextBookableStops = unpassedStops.slice(1)
    const finalDestination = trip.waypoints[trip.waypoints.length - 1]
    if (!finalDestination) return nextBookableStops
    return nextBookableStops.filter(stop => stop.location.id !== finalDestination.location.id)
  } else if (trip.status === "SCHEDULED") {
    const midpoints = trip.waypoints.filter((stop) =>
      stop.is_custom &&
      stop.location.id !== trip.route.origin_id &&
      stop.location.id !== trip.route.destination_id
    )
    return midpoints
  }
  return []
}

export function calculatePrice(trip: Trip, fromStopId: string, toStopId: string): number {
  if (!trip.waypoints) return 0;
  const fromStopData = trip.waypoints.find((stop) => stop.location.id === fromStopId)
  const toStopData = trip.waypoints.find((stop) => stop.location.id === toStopId)
  if (!fromStopData || !toStopData) return 0
  return (toStopData.price || 0) - (fromStopData.price || 0)
}

export function isBookingAllowed(trip: Trip, fromStopId: string, toStopId: string): { allowed: boolean, reason?: string } {
  const availableOrigins = getAvailableOrigins(trip)
  const availableDestinations = getAvailableDestinations(trip)
  if (availableOrigins.length === 0 || availableDestinations.length === 0) {
    return { allowed: false, reason: 'No available origins or destinations' }
  }
  const validOrigin = availableOrigins.some((stop) => String(stop.location.id) === String(fromStopId))
  console.log("Available orgins: ", availableOrigins)
  if (!validOrigin) {
    return { allowed: false, reason: 'Invalid origin selected' }
  }
  const validDestination = availableDestinations.some((stop) => String(stop.location.id) === String(toStopId))
  
  if (!validDestination) {
    return { allowed: false, reason: 'Invalid destination selected' }
  }
  const availableSeats = trip.remaining_seats ?? trip.seats ?? 0
  if (availableSeats <= 0) {
    return { allowed: false, reason: 'No seats available' }
  }
  return { allowed: true }
}

export function getEstimatedArrivalTime(trip: Trip, stopId: string): string | null {
  if (trip.status !== "IN_PROGRESS" || !trip.waypoints) return null
  const stop = trip.waypoints.find((s) => s.location.id === stopId)
  if (!stop || stop.is_passed) return null
  
  // If waypoint has remaining_time, use it directly
  if (stop.remaining_time && stop.remaining_time > 0) {
    const hours = Math.floor(stop.remaining_time / 3600)
    const minutes = Math.floor((stop.remaining_time % 3600) / 60)
    if (hours > 0) {
      return minutes > 0 ? `${hours}hr ${minutes}min` : `${hours}hr`
    } else {
      return `${minutes}min`
    }
  }
  
  // Fallback: estimate based on order difference and trip-level remaining time
  const stopIndex = trip.waypoints.findIndex((s) => s.location.id === stopId)
  const nextStopIndex = trip.waypoints.findIndex((s) => s.is_next)
  
  if (stopIndex === -1 || nextStopIndex === -1) return null
  
  // Use trip-level remaining time as base if available
  const baseTime = trip.remaining_time_to_destination || 0
  const totalStops = trip.waypoints.length
  const stopsRemaining = totalStops - stopIndex
  
  if (baseTime > 0 && stopsRemaining > 0) {
    const estimatedSeconds = Math.round(baseTime * (stopsRemaining / totalStops))
    const hours = Math.floor(estimatedSeconds / 3600)
    const minutes = Math.floor((estimatedSeconds % 3600) / 60)
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}hr ${minutes}min` : `${hours}hr`
    } else {
      return `${minutes}min`
    }
  }
  
  // Final fallback: simple estimation
  const additionalStops = stopIndex - nextStopIndex
  const estimatedMinutes = additionalStops * 15
  return estimatedMinutes > 0 ? `${estimatedMinutes} min` : null
}
