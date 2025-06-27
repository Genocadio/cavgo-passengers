"use client"

import { useState } from "react"
import { Clock, Users, Bus, Navigation, Building2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Route } from "@/lib/types"
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
  route: Route
}

export default function RouteCard({ route }: RouteCardProps) {
  const { t } = useLanguage()
  const [showBookingModal, setShowBookingModal] = useState(false)
  const company = companies.find((c) => c.id === route.companyId)
  const availableDestinations = getAvailableDestinations(route)
  const availableOrigins = getAvailableOrigins(route)
  const upcomingStops = getUpcomingStops(route)
  const allowedSoonStops = getAllowedSoonStops(route)

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

  const getRouteTypeColor = (type: string) => {
    return type === "provincial" ? "bg-orange-500" : "bg-purple-500"
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const canBook = availableDestinations.length > 0 && availableOrigins.length > 0 && route.availableSeats > 0

  return (
    <>
      <Card className="w-full hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bus className="h-5 w-5" />
                {route.from} → {route.to}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">{company?.name}</span>
                <span className="text-xs ml-2">Car Plate: {route.carplate}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className={`${getStatusColor(route.status)} text-white`}>{route.status}</Badge>
              <Badge className={`${getRouteTypeColor(route.routeType)} text-white`}>{route.routeType}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Route Progress for Departed Routes */}
          {route.status === "departed" && route.currentLocation && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Navigation className="h-4 w-4 text-blue-600" />
                <span className="font-medium">
                  {t("enRouteTo")} {route.currentLocation.nextStop}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {route.currentLocation.remainingDistance} • {route.currentLocation.remainingTime} {t("remaining")}
              </div>
            </div>
          )}

          {/* Departure Time for Scheduled Routes */}
          {route.status === "scheduled" && route.stops[0]?.estimatedArrival && (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-medium">
                  {t("departure")}: {formatTime(route.stops[0].estimatedArrival)}
                </span>
              </div>
            </div>
          )}

          {/* Upcoming Stops with Estimated Times for Departed Routes */}
          {route.status === "departed" && upcomingStops.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Upcoming Stops
              </h4>
              <div className="space-y-1">
                {upcomingStops
                  .filter((stop) => stop.isMidpoint)
                  .map((stop, index) => {
                    const estimatedTime = stop.estimatedTime || getEstimatedArrivalTime(route, stop.name)
                    const isBookable = availableOrigins.some((origin) => origin.name === stop.name)
                    const isAllowedSoon = allowedSoonStops.some((allowedStop) => allowedStop.name === stop.name)

                    return (
                      <div key={index} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${isBookable ? "text-green-600" : isAllowedSoon ? "text-amber-600" : "text-gray-600"}`}
                          >
                            {stop.name}
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
                            ? estimatedTime.includes("min")
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
          {route.status === "scheduled" && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">{t("routeStops")}</h4>
              <div className="flex flex-wrap gap-1">
                {route.stops.map((stop, index) => {
                  const isBookableOrigin = availableOrigins.some((origin) => origin.name === stop.name)

                  return (
                    <Badge
                      key={index}
                      variant={stop.isPassed ? "secondary" : "outline"}
                      className={`text-xs ${
                        stop.isPassed
                          ? "opacity-60"
                          : isBookableOrigin
                            ? "bg-green-50 text-green-700 border-green-200"
                            : ""
                      }`}
                    >
                      {stop.name}
                      {stop.price > 0 && ` (${stop.price} RWF)`}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {/* Route Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
               {t("seatsAvailable")}  {route.availableSeats} 
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {route.status === "scheduled"
                  ? route.stops[0]?.estimatedArrival
                    ? formatTime(route.stops[0].estimatedArrival)
                    : t("timeTBD")
                  : route.currentLocation?.remainingTime + " to next stop"}
              </span>
            </div>
          </div>

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

      <BookingModal route={route} isOpen={showBookingModal} onClose={() => setShowBookingModal(false)} />
    </>
  )
}
