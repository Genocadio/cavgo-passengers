"use client"

import { useState, useMemo } from "react"
import { Bus } from "lucide-react"
import RouteSearch, { type SearchFilters } from "@/components/route-search"
import RouteCard from "@/components/route-card"
import { routes, companies } from "@/lib/data"
import type { Route } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import HeaderWithAuth from "@/components/header-with-auth"
import { useLanguage } from "@/lib/language-context"
import TicketModal from "@/components/ticket-modal"
import { useTickets } from "@/lib/ticket-storage"

export default function HomePage() {
  const { t } = useLanguage()
  const { currentTicket, setCurrentTicket } = useTickets()

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    origin: "",
    destination: "",
    company: "",
    departedCity: false,
    rural: false,
  })

  const filteredRoutes = useMemo(() => {
    return routes.filter((route: Route) => {
      const matchesOrigin =
        !searchFilters.origin ||
        route.from.toLowerCase().includes(searchFilters.origin.toLowerCase()) ||
        route.stops.some((stop) => stop.name.toLowerCase().includes(searchFilters.origin.toLowerCase()))

      const matchesDestination =
        !searchFilters.destination ||
        route.to.toLowerCase().includes(searchFilters.destination.toLowerCase()) ||
        route.stops.some((stop) => stop.name.toLowerCase().includes(searchFilters.destination.toLowerCase()))

      const company = companies.find((c) => c.id === route.companyId)
      const matchesCompany =
        !searchFilters.company || (company && company.name.toLowerCase().includes(searchFilters.company.toLowerCase()))

      const matchesDepartedCity =
        !searchFilters.departedCity || (route.routeType === "city" && route.status === "departed")

      const matchesRural = !searchFilters.rural || route.routeType === "provincial"

      return matchesOrigin && matchesDestination && matchesCompany && matchesDepartedCity && matchesRural
    })
  }, [searchFilters])

  // Calculate new metrics
  const uniqueDestinations = useMemo(() => {
    const destinations = new Set<string>()
    filteredRoutes.forEach((route) => {
      destinations.add(route.to)
      route.stops.forEach((stop) => {
        if (stop.isMidpoint) {
          destinations.add(stop.name)
        }
      })
    })
    return destinations.size
  }, [filteredRoutes])

  const routesByCompany = useMemo(() => {
    const companyRoutes = new Map<string, number>()
    filteredRoutes.forEach((route) => {
      const company = companies.find((c) => c.id === route.companyId)
      if (company) {
        companyRoutes.set(company.name, (companyRoutes.get(company.name) || 0) + 1)
      }
    })
    return Array.from(companyRoutes.entries()).sort((a, b) => b[1] - a[1])
  }, [filteredRoutes])

  const hasActiveFilters =
    searchFilters.origin ||
    searchFilters.destination ||
    searchFilters.company ||
    searchFilters.departedCity ||
    searchFilters.rural

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <HeaderWithAuth />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <RouteSearch onSearch={setSearchFilters} />
        </div>

        {/* Results */}
        <div className="space-y-6">
          {filteredRoutes.length === 0 ? (
            <div className="text-center py-12">
              <Bus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t("noRoutesFound")}</h3>
              <p className="text-gray-600 mb-4">{t("tryAdjusting")}</p>
              {hasActiveFilters && (
                <div className="text-sm text-muted-foreground">
                  <p>{t("currentFilters")}</p>
                  <div className="flex justify-center gap-2 mt-2">
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
                    {searchFilters.rural && <Badge variant="outline">{t("ruralRoutes")}</Badge>}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredRoutes.map((route) => (
                <RouteCard key={route.id} route={route} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 RouteBook. {t("footer")}</p>
          </div>
        </div>
      </footer>
      <TicketModal ticket={currentTicket} isOpen={!!currentTicket} onClose={() => setCurrentTicket(null)} />
    </div>
  )
}
