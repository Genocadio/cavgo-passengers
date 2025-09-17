"use client"

import { useState } from "react"
import { Clock, Users, Bus, Navigation, Building2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Trip } from "@/lib/features/trips/useTrips"
import { companies } from "@/lib/data"
import {
  getAvailableDestinations,
  getAvailableOrigins,
  getUpcomingStops,
  getAllowedSoonStops,
  getEstimatedArrivalTime,
} from "@/lib/booking-utils"
import BookingModal from "./booking-modal"
import { useLanguage } from "@/lib/language-context"
import { TripUpdateIndicator } from "./trip-update-indicator"

interface TripUpdate {
  type: string
  timestamp: number
}

interface RouteCardProps {
  trip: Trip
  lastUpdate?: TripUpdate | null
  searchFilters?: {
    origin?: string
    destination?: string
    company?: string
    city_route?: boolean | null
    departedCity?: boolean
  }
}

// Enhanced highlightMatch: supports fullMatch and blue color
function highlightMatch(text: string, search: string | undefined, fullMatch = false) {
  if (!search || !text) return text;
  if (fullMatch) {
    if (text.trim().toLowerCase() === search.trim().toLowerCase()) {
      return <span className="bg-blue-200 text-blue-900 px-1 rounded font-semibold shadow-sm transition-colors duration-200">{text}</span>;
    }
    return text;
  }
  const idx = text.toLowerCase().indexOf(search.toLowerCase());
  if (idx === -1) return text;
  return <>{text.substring(0, idx)}<span className="bg-blue-200 text-blue-900 px-1 rounded font-semibold shadow-sm transition-colors duration-200">{text.substring(idx, idx + search.length)}</span>{text.substring(idx + search.length)}</>;
}

// Format remaining time from seconds
function formatRemainingTime(seconds: number | null) {
  if (!seconds || seconds <= 0) return ""
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}hr ${minutes}min` : `${hours}hr`
  } else {
    return `${minutes}min`
  }
}

// Format distance from meters
function formatDistance(meters: number | null) {
  if (!meters || meters <= 0) return ""
  
  const km = meters / 1000
  if (km < 0.2) {
    return `${Math.round(meters)}m away`
  } else {
    return `${km.toFixed(1)}km`
  }
}

// highlightWholeWordMatch: highlights the whole word if search is a substring (case-insensitive)
function highlightWholeWordMatch(text: string, search: string | undefined) {
  if (!search || !text) return text;
  const words = text.split(/(\s+)/); // keep spaces
  const lowerSearch = search.toLowerCase();
  return words.map((word, i) => {
    // Only highlight non-space words
    if (word.trim() && word.toLowerCase().includes(lowerSearch)) {
      return <span key={i} className="bg-blue-200 text-blue-900 px-1 rounded font-semibold shadow-sm transition-colors duration-200">{word}</span>;
    }
    return word;
  });
}

// highlightFullFieldMatch: highlights the entire field with a glowing green animated border if search is a substring (case-insensitive)
function highlightFullFieldMatch(text: string, search: string | undefined) {
  if (!search || !text) return text;
  if (text.toLowerCase().includes(search.toLowerCase())) {
    return (
      <span
        className="border-2 border-green-400 rounded-full px-2 font-semibold shadow-[0_0_8px_2px_rgba(34,197,94,0.7)] animate-glow-green"
        style={{ display: 'inline-block' }}
      >
        {text}
      </span>
    );
  }
  return text;
}

// Add the animation to the global CSS if not present
// @layer utilities {
//   @keyframes glow-green {
//     0%, 100% { box-shadow: 0 0 8px 2px rgba(34,197,94,0.7); }
//     50% { box-shadow: 0 0 16px 4px rgba(34,197,94,1); }
//   }
//   .animate-glow-green {
//     animation: glow-green 1.2s infinite alternate;
//   }
// }

export default function RouteCard({ trip, lastUpdate, searchFilters }: RouteCardProps) {
  const { t } = useLanguage()
  const [showBookingModal, setShowBookingModal] = useState(false)
  const company = trip.vehicle.company_name
  const availableDestinations = getAvailableDestinations(trip)
  const availableOrigins = getAvailableOrigins(trip)
  const upcomingStops = getUpcomingStops(trip)
  const allowedSoonStops = getAllowedSoonStops(trip)
  const nextStop = upcomingStops.filter((stop) => stop.is_next)[0]
  const unpassedOrders = trip.waypoints?.filter(wp => !wp.is_passed).map(wp => wp.order) || [];
  const minUnpassedOrder = unpassedOrders.length > 0 ? Math.min(...unpassedOrders) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500"
      case "departed":
        return "bg-green-500"
      case "completed":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getRouteTypeColor = (isCity: boolean) => {
    return isCity ? "bg-orange-500" : "bg-purple-500"
  }

  const formatTime = (dateInput: string | number) => {
    let date: Date
    if (typeof dateInput === 'number') {
      // Assume Unix timestamp in seconds
      date = new Date(dateInput * 1000)
    } else if (/^\d{10}$/.test(dateInput)) {
      // String Unix timestamp
      date = new Date(Number(dateInput) * 1000)
    } else {
      date = new Date(dateInput)
    }
    if (isNaN(date.getTime())) return "--:--"
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const canBook = availableDestinations.length > 0 && availableOrigins.length > 0 && trip.seats > 0

  return (
    <>
      <Card className="w-full hover:shadow-lg transition-shadow relative">
        {/* Real-time update indicator */}
        <TripUpdateIndicator trip={trip} lastUpdate={lastUpdate} />
        
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bus className="h-5 w-5" />
                {/* Highlight origin/destination: full field if search is substring */}
                {highlightFullFieldMatch(trip.route.origin.custom_name || '', searchFilters?.origin)}
                {" → "}
                {highlightFullFieldMatch(trip.route.destination.custom_name || '', searchFilters?.destination)}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">{highlightMatch(trip.vehicle.company_name || '', searchFilters?.company)}</span>
                {/* {company && (
                  <span className="text-xs ml-2">Car Company: {company}</span>
                )} */}
                <span className="text-xs ml-2">Car Plate: {trip.vehicle.license_plate}</span>
                <span className="text-xs">Price: {trip.route.route_price}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {/* Status badge: hide on xs, show on sm+ */}
              <Badge className={`${getStatusColor(trip.status)} text-white hidden md:inline-flex`}>
                {trip.status}
              </Badge>
              {/* City/Province badge: hide on xs and sm, show on md+ */}
              <Badge className={`${getRouteTypeColor(trip.route.city_route)} text-white hidden md:inline-flex`}>
                {trip.route.city_route ? "city" : "province"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Route Progress for Departed Routes */}
          {trip.status === "IN_PROGRESS" && nextStop && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Navigation className="h-4 w-4 text-blue-600" />
                <span className="font-medium">
                  {t("enRouteTo")} {nextStop.location.custom_name}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatRemainingTime(nextStop.remaining_time ?? null)} • {formatDistance(nextStop.remaining_distance ?? null)} {t("remaining")}
              </div>
            </div>
          )}

          {/* Departure Time for Scheduled Routes */}
          {trip.status === "SCHEDULED" && trip.departure_time && (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-medium">
                  {t("departure")}: {formatTime(trip.departure_time)}
                </span>
              </div>
            </div>
          )}

          {/* Upcoming Stops with Estimated Times for Departed Routes */}
          {trip.status === "IN_PROGRESS" && upcomingStops.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Upcoming Stops
              </h4>
              <div className="space-y-1">
                {upcomingStops
                  .map((stop, index) => {
                    const estimatedTime = stop.remaining_time || getEstimatedArrivalTime(trip, stop.id)
                    const isBookable = availableOrigins.some((origin) => origin.id=== stop.id)
                    const isAllowedSoon = allowedSoonStops.some((allowedStop) => allowedStop.id === stop.id)

                    return (
                      <div key={index} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${isBookable ? "text-green-600" : isAllowedSoon ? "text-amber-600" : "text-gray-600"}`}
                          >
                            {stop.location.custom_name}
                          </span>
                          {isBookable && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Bookable
                            </Badge>
                          )}
                          {isAllowedSoon && (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                              Soon
                            </Badge>
                          )}
                        </div>
                        <span className="text-muted-foreground">
                          {estimatedTime
                            ? typeof estimatedTime === 'number'
                              ? `~${formatRemainingTime(estimatedTime)}`
                              : `~${estimatedTime}`
                            : "Calculating..."}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* All Stops for Scheduled Routes */}
          {trip.status === "SCHEDULED" && trip.waypoints && trip.waypoints.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">{t("routeStops")}</h4>
              <div className="flex flex-wrap gap-1">
                {trip.waypoints?.map((stop, index) => {
                  const isNext = !stop.is_passed && stop.order === minUnpassedOrder;
                  const stopName = stop.location?.custom_name || '';
                  const highlightOrigin = !!searchFilters?.origin && stopName.toLowerCase().includes((searchFilters.origin || '').toLowerCase());
                  const highlightDestination = !!searchFilters?.destination && stopName.toLowerCase().includes((searchFilters.destination || '').toLowerCase());
                  return (
                    <Badge
                      key={(stop as any).id ?? `${stopName}-${index}`}
                      variant={stop.is_passed? "secondary" : "outline"}
                      className={`text-xs
                        ${false ? "bg-blue-600 text-white border-blue-600" : ""}
                        ${isNext ? "bg-amber-100 text-amber-800 border-amber-200" : ""}
                        ${stop.is_passed ? "opacity-60" : ""}
                      `}
                    >
                      {/* Highlight full field in stop name if search matches */}
                      {highlightOrigin
                        ? highlightFullFieldMatch(stopName, searchFilters?.origin)
                        : highlightDestination
                        ? highlightFullFieldMatch(stopName, searchFilters?.destination)
                        : stopName}
                      {false && <span className="ml-1">({t("currentLocation")})</span>}
                      {isNext && <span className="ml-1">({t("nextStop")})</span>}
                      {typeof stop.price === "number" && stop.price > 0 && ` (${stop.price} RWF)`}
                    </Badge>
                  )
                })}
              </div>
              {/* Show departure time for scheduled route */}
              <div className="flex items-center gap-2 mt-2 text-sm">
                {/* <Clock className="h-4 w-4 text-green-600" /> */}
                {/* <span className="font-medium">
                  {t("departure")}: {trip.waypoints[0]?.remaining_time ? formatTime(trip.waypoints[0].remaining_time) : t("timeTBD")}
                </span> */}
              </div>
              {/* Show next stop info if available */}
              {nextStop && (
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Navigation className="h-4 w-4 text-amber-600" />
                  <span>{t("nextStop")}: {nextStop.location.custom_name}</span>
                </div>
              )}
            </div>
          )}

          {/* Route Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
               {t("seatsAvailable")}  {trip.seats} 
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {trip.status === "SCHEDULED"
                  ? trip.departure_time
                    ? formatTime(trip.departure_time)
                    : t("timeTBD")
                  : nextStop?.remaining_time 
                    ? `${formatRemainingTime(nextStop.remaining_time ?? null)} to next stop`
                    : t("timeTBD")}
              </span>
            </div>
          </div>

          {/* Debug Info: Show why booking is not available */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="text-xs text-red-500 bg-red-50 p-2 rounded mb-2">
              <div><strong>Debug:</strong></div>
              <div>availableOrigins: {JSON.stringify(availableOrigins.map(o => o.location?.custom_name || 'Unknown'))}</div>
              <div>availableDestinations: {JSON.stringify(availableDestinations.map(d => d.location?.custom_name || 'Unknown'))}</div>
              <div>canBook: {String(canBook)}</div>
              <div>availableSeats: {trip.seats}</div>
              <div>waypoints: {trip.waypoints ? trip.waypoints.length : 'undefined'}</div>
              <div>nextStop: {nextStop ? 'defined' : 'undefined'}</div>
            </div>
          )}

          {/* Booking Action */}
          <div className="flex justify-end items-center pt-2 border-t">
            <Button
              onClick={() => setShowBookingModal(true)}
              disabled={!canBook}
              className="bg-green-600 hover:bg-green-700"
            >
              {canBook ? t("bookNow") : t("notAvailable")}
            </Button>
          </div>

          {/* Booking Rules Info
          {route.routeType === "provincial" && (
            <div className="text-xs bg-amber-50 p-2 rounded">
              {route.status === "scheduled" ? (
                <span className="text-amber-700">
                  <strong>Provincial Route:</strong> Boarding only from origin. All destinations available.
                </span>
              ) : (
                <span className="text-amber-700">
                  <strong>Provincial Route:</strong> {t("ruralRouteProgress")}
                </span>
              )}
            </div>
          )}

          {route.routeType === "city" && (
            <div className="text-xs bg-purple-50 p-2 rounded">
              <span className="text-purple-700">
                <strong>City Route:</strong> Flexible boarding and alighting at any unpassed stop.
              </span>
            </div>
          )} */}
        </CardContent>
      </Card>

      <BookingModal trip={trip} isOpen={showBookingModal} onClose={() => setShowBookingModal(false)} />
    </>
  )
}
