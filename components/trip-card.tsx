import { useState } from "react"
import { Clock, Navigation, MapPin, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"

// Types for Trip and Waypoint (backend Trip)
interface Location {
  id: number;
  latitude: number;
  longitude: number;
  code?: string | null;
  google_place_name?: string | null;
  custom_name?: string | null;
  place_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface TripWaypoint {
  id: number;
  trip_id: number;
  location_id: number;
  order: number;
  price?: number | null;
  is_passed: boolean;
  is_next: boolean;
  passed_timestamp?: number | null;
  remaining_time?: number | null;
  remaining_distance?: number | null;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
  location: Location;
}

interface Route {
  id: number;
  name?: string | null;
  distance_meters?: number | null;
  estimated_duration_seconds?: number | null;
  google_route_id?: string | null;
  origin_id: number;
  destination_id: number;
  route_price: number;
  city_route: boolean;
  created_at: string;
  updated_at: string;
  origin: Location;
  destination: Location;
  waypoints: any[] | null;
}

interface Trip {
  id: number;
  route_id: number;
  car_plate: string;
  car_company: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'NOT_COMPLETED';
  departure_time: number;
  completion_time?: number | null;
  connection_mode: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  notes?: string | null;
  seats: number;
  remaining_time_to_destination?: number | null;
  remaining_distance_to_destination?: number | null;
  is_reversed: boolean;
  current_speed?: number | null;
  current_latitude?: number | null;
  current_longitude?: number | null;
  has_custom_waypoints: boolean;
  created_at: string;
  updated_at: string;
  route: Route;
  waypoints: TripWaypoint[];
}

interface TripCardProps {
  trip: Trip
}

export default function TripCard({ trip }: TripCardProps) {
  const { t } = useLanguage()
  const [showDetails, setShowDetails] = useState(false)

  // Sort waypoints by order
  const sortedWaypoints = [...trip.waypoints].sort((a, b) => a.order - b.order)
  const origin = sortedWaypoints[0]
  const nextWaypoint = sortedWaypoints.find(wp => !wp.is_passed)
  const lastPassed = [...sortedWaypoints].reverse().find(wp => wp.is_passed)

  // Format time utility
  const formatTime = (unix: number | string | null) => {
    if (!unix) return "--:--"
    const date = typeof unix === 'number' ? new Date(unix * 1000) : new Date(unix)
    if (isNaN(date.getTime())) return "--:--"
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  // Status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-500"
      case "IN_PROGRESS":
        return "bg-green-500"
      case "COMPLETED":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  // Map backend status to display status
  const displayStatus = trip.status === "IN_PROGRESS" ? "ACTIVE" : trip.status

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {trip.route.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">{trip.car_company}</span>
              <span className="text-xs ml-2">Car Plate: {trip.car_plate}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className={`${getStatusColor(trip.status)} text-white`}>{displayStatus}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SCHEDULED: Show departure time and highlight origin */}
        {trip.status === "SCHEDULED" && (
          <>
            <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-medium">
                {t("departure")}: {formatTime(trip.departure_time)}
              </span>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">{t("routeStops")}</h4>
              <div className="flex flex-wrap gap-1">
                {sortedWaypoints.map((wp, idx) => (
                  <Badge
                    key={wp.id}
                    className={`text-xs
                      ${idx === 0 ? "bg-blue-600 text-white border-blue-600" : ""}
                      ${idx === 1 ? "bg-amber-100 text-amber-800 border-amber-200" : ""}
                    `}
                  >
                    {wp.location.custom_name}
                    {idx === 0 && <span className="ml-1">({t("currentLocation")})</span>}
                    {idx === 1 && <span className="ml-1">({t("nextStop")})</span>}
                    {wp.price && wp.price > 0 && ` (${wp.price} RWF)`}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
        {/* ACTIVE: Show current and next location, remaining time/distance */}
        {trip.status === "IN_PROGRESS" && (
          <>
            <div className="bg-green-50 p-3 rounded-lg flex items-center gap-2 text-sm">
              <Navigation className="h-4 w-4 text-green-600" />
              <span className="font-medium">
                {t("enRouteTo")}: {nextWaypoint?.location.custom_name || t("unknown")}
              </span>
              {nextWaypoint?.remaining_time && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {nextWaypoint.remaining_time} • {nextWaypoint.remaining_distance}m {t("remaining")}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">{t("routeStops")}</h4>
              <div className="flex flex-wrap gap-1">
                {sortedWaypoints.map((wp, idx) => (
                  <Badge
                    key={wp.id}
                    className={`text-xs
                      ${wp.is_passed ? "bg-gray-300 text-gray-600" : ""}
                      ${wp.is_next ? "bg-green-600 text-white border-green-600" : ""}
                    `}
                  >
                    {wp.location.custom_name}
                    {wp.is_passed && <CheckCircle2 className="inline h-3 w-3 ml-1 text-green-700" />}
                    {wp.is_next && <span className="ml-1">({t("nextStop")})</span>}
                    {wp.price && wp.price > 0 && ` (${wp.price} RWF)`}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
        {/* COMPLETED: Show trip as completed */}
        {trip.status === "COMPLETED" && (
          <div className="bg-gray-100 p-3 rounded-lg flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-gray-600" />
            <span className="font-medium">{t("tripCompleted")}</span>
            {trip.completion_time && (
              <span className="ml-2 text-xs text-muted-foreground">
                {t("arrival")}: {formatTime(trip.completion_time)}
              </span>
            )}
          </div>
        )}
        {/* Seats info */}
        <div className="flex items-center gap-2 text-sm">
          <span>{t("seatsAvailable")}: {trip.seats}</span>
        </div>
        {/* Toggle details button */}
        <div className="flex justify-end items-center pt-2 border-t">
          <Button onClick={() => setShowDetails((v) => !v)} variant="outline">
            {showDetails ? t("hideDetails") : t("showDetails")}
          </Button>
        </div>
        {/* Details section */}
        {showDetails && (
          <div className="mt-2 text-xs text-muted-foreground">
            <pre>{JSON.stringify(trip, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Skeleton loader for TripCard
export function TripCardSkeleton() {
  return (
    <Card className="w-full animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
            <div className="flex items-center gap-2 text-sm">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-3 w-16 bg-gray-100 rounded ml-2" />
            </div>
          </div>
          <div className="h-6 w-16 bg-gray-200 rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-6 w-40 bg-gray-100 rounded mb-2" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-5 w-20 bg-gray-100 rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 