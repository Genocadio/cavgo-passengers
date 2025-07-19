"use client"

import { useState, useMemo } from "react"
import { Bus } from "lucide-react"
import RouteSearch, { type SearchFilters } from "@/components/route-search"
import TripCard from "@/components/trip-card"
import { companies } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import HeaderWithAuth from "@/components/header-with-auth"
import { useLanguage } from "@/lib/language-context"
// import TicketModal from "@/components/ticket-modal"
import { useTickets } from "@/lib/ticket-storage"
import { useTrips, Trip, TripWaypoint } from '@/lib/features/trips/useTrips'
import RouteCard from "@/components/route-card"

export default function HomePage() {
  const { t } = useLanguage()
  const { currentTicket, setCurrentTicket } = useTickets()
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    origin: "",
    destination: "",
    company: "",
    departedCity: false,
    city_route: false,
  })

  // Use backend filtering
  const { trips, status, error } = useTrips({
    origin: searchFilters.origin,
    destination: searchFilters.destination,
    company: searchFilters.company,
  }) as { trips: Trip[], status: string, error: string | null }

  // Calculate new metrics
  const uniqueDestinations = useMemo(() => {
    const destinations = new Set<string>()
    trips.forEach((trip: Trip) => {
      destinations.add(trip.route.destination.custom_name || "")
      trip.waypoints?.forEach((wp: TripWaypoint) => {
        destinations.add(wp.location.custom_name || "")
      })
    })
    return destinations.size
  }, [trips])

  const tripsByCompany = useMemo(() => {
    const companyTrips = new Map<string, number>()
    trips.forEach((trip: Trip) => {
      const company = companies.find((c) => c.name && trip.vehicle.company_name && c.name.toLowerCase() === trip.vehicle.company_name.toLowerCase())
      if (company) {
        companyTrips.set(company.name, (companyTrips.get(company.name) || 0) + 1)
      }
    })
    return Array.from(companyTrips.entries()).sort((a: [string, number], b: [string, number]) => b[1] - a[1])
  }, [trips])

  const hasActiveFilters =
    searchFilters.origin ||
    searchFilters.destination ||
    searchFilters.company ||
    searchFilters.departedCity ||
    searchFilters.city_route

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <HeaderWithAuth />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Search Section */}
        <div className="mb-8">
          <RouteSearch onSearch={setSearchFilters} />
        </div>

        {/* Results */}
        <div className="space-y-6">
          {status === 'pending' ? (
            <div className="text-center py-12">Loading...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : trips.length === 0 ? (
            <div className="text-center py-12">
              <Bus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t("noRoutesFound")}</h3>
              <p className="text-gray-600 mb-4">{t("tryAdjusting")}</p>
              {hasActiveFilters && (
                <div className="text-sm text-muted-foreground">
                  <p>{t("currentFilters")}</p>
                  <div className="flex justify-center gap-2 mt-2 flex-wrap">
                    {searchFilters.origin && (
                      <Badge variant="outline">
                        {t("from")}: {searchFilters.origin}
                      </Badge>
                    )}
                    {searchFilters.destination && (
                      <Badge variant="outline">
                        {t("to")}: {searchFilters.destination}
                      </Badge>
                    )}
                    {searchFilters.company && (
                      <Badge variant="outline">
                        {t("transportationCompany")}: {searchFilters.company}
                      </Badge>
                    )}
                    {searchFilters.departedCity && <Badge variant="outline">{t("departedCityRoutes")}</Badge>}
                    {searchFilters.city_route && <Badge variant="outline">{t("ruralRoutes")}</Badge>}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {trips.map((trip: Trip) => (
                 <RouteCard key={trip.id} trip={trip} />
               ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t w-full mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 Cavgo. {t("footer")}</p>
          </div>
        </div>
      </footer>
      {/* <TicketModal ticket={currentTicket} isOpen={!!currentTicket} onClose={() => setCurrentTicket(null)} /> */}
    </div>
  )
}
