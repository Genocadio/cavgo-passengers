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

interface RouteCardProps {
  trip: Trip
}

export default function RouteCard({ trip }: RouteCardProps) {
  const { t } = useLanguage()
  const [showBookingModal, setShowBookingModal] = useState(false)
  const company = trip.car_company
  const availableDestinations = getAvailableDestinations(trip)
  const availableOrigins = getAvailableOrigins(trip)
  const upcomingStops = getUpcomingStops(trip)
  const allowedSoonStops = getAllowedSoonStops(trip)
  const nextStop = upcomingStops.filter((stop) => stop.is_next)[0]
  const unpassedOrders = trip.waypoints.filter(wp => !wp.is_passed).map(wp => wp.order);
  const minUnpassedOrder = Math.min(...unpassedOrders);

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
      <Card className="w-full hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bus className="h-5 w-5" />
                {trip.route.origin.custom_name} → {trip.route.destination.custom_name}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">{trip.car_company}</span>
                {company && (
                  <span className="text-xs ml-2">Car Company: {company}</span>
                )}
                <span className="text-xs ml-2">Car Plate: {trip.car_plate}</span>
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
          {trip.status === "IN_PROGRESS" && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Navigation className="h-4 w-4 text-blue-600" />
                <span className="font-medium">
                  {t("enRouteTo")} {nextStop.location.custom_name}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {nextStop.remaining_distance} • {nextStop.remaining_distance} {t("remaining")}
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
                            ? estimatedTime
                              ? `~${estimatedTime}`
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
          {trip.status === "SCHEDULED" && Array.isArray(trip.waypoints) && trip.waypoints.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">{t("routeStops")}</h4>
              <div className="flex flex-wrap gap-1">
                {trip.waypoints.map((stop, index) => {
                  const isNext = !stop.is_passed && stop.order === minUnpassedOrder;
                  return (
                    <Badge
                      key={(stop as any).id ?? `${stop.location.custom_name}-${index}`}
                      variant={stop.is_passed? "secondary" : "outline"}
                      className={`text-xs
                        ${false ? "bg-blue-600 text-white border-blue-600" : ""}
                        ${isNext ? "bg-amber-100 text-amber-800 border-amber-200" : ""}
                        ${stop.is_passed ? "opacity-60" : ""}
                      `}
                    >
                      {stop.location.custom_name}
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
              {nextStop&& (
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
                  : nextStop.remaining_time + " to next stop"}
              </span>
            </div>
          </div>

          {/* Debug Info: Show why booking is not available */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="text-xs text-red-500 bg-red-50 p-2 rounded mb-2">
              <div><strong>Debug:</strong></div>
              <div>availableOrigins: {JSON.stringify(availableOrigins.map(o => o.location.custom_name))}</div>
              <div>availableDestinations: {JSON.stringify(availableDestinations.map(d => d.location.custom_name))}</div>
              <div>canBook: {String(canBook)}</div>
              <div>availableSeats: {trip.seats}</div>
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
