"use client"

import { useState, useMemo, useEffect, useRef } from "react"
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
import { useTripSubscription } from '@/lib/features/trips/useTripSubscription'
import RouteCard from "@/components/route-card"
import { TripCardSkeleton } from "@/components/trip-card"

function DelayedLoadingIndicator({ delay = 1000, text }: { delay?: number, text: string }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(timer)
  }, [delay])
  if (!show) return null
  return <div className="text-center py-4 text-gray-400 animate-pulse">{text}</div>
}

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

  // Use backend filtering with pagination
  const {
    trips,
    status,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    sseUuid,
  } = useTrips({
    origin: searchFilters.origin,
    destination: searchFilters.destination,
    company: searchFilters.company,
    city_route: searchFilters.city_route ?? undefined,
  })

  // Subscribe to real-time updates
  const { isConnected, isConnecting, tripUpdates, connectionDetails } = useTripSubscription(sseUuid)

  // Infinite scroll sentinel
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!hasNextPage || status !== 'success') return
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 1 }
    )
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }
    return () => {
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current)
    }
  }, [hasNextPage, fetchNextPage, isFetchingNextPage, status])

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

        {/* Real-time connection status */}
        {process.env.NODE_ENV === 'development' && status === 'success' && sseUuid && (
          <div className="mb-4 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 
              isConnecting ? 'bg-yellow-500 animate-pulse' : 
              'bg-red-500'
            }`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Live updates connected' : 
               isConnecting ? 'Connecting to live updates...' : 
               'Live updates disconnected'}
            </span>
            {!isConnected && !isConnecting && (
              <button 
                onClick={() => window.location.reload()}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Retry
              </button>
            )}
            {/* Debug info in development */}
            {connectionDetails && (
              <div className="text-xs text-gray-500 ml-4">
                <span>Client: {connectionDetails.clientId}</span>
                {connectionDetails.lastHeartbeat && (
                  <span className="ml-2">Last heartbeat: {new Date(connectionDetails.lastHeartbeat).toLocaleTimeString()}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        <div className="space-y-6">
          {status === 'pending' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <TripCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            (() => {
              let title = t("serviceUnavailable") || "Service Unavailable";
              let message = t("serviceUnavailableMessage") || "We're updating our service or performing maintenance. Please come back later!";
              let emoji = "🛠️";
              if (error === 'SERVICE_UNAVAILABLE') {
                title = t("serviceUnavailable") || "Service Unavailable";
                message = t("serviceUnavailableMessage") || "We're updating our service or performing maintenance. Please come back later!";
                emoji = "🛠️";
              } else if (error === 'NETWORK_ERROR') {
                title = t("networkError") || "Network Error";
                message = t("networkErrorMessage") || "We couldn't connect to the service. Please check your internet connection or try again later.";
                emoji = "📡";
              } else if (error === 'TIMEOUT') {
                title = t("timeoutError") || "Request Timed Out";
                message = t("timeoutErrorMessage") || "The request took too long. Please try again later.";
                emoji = "⏳";
              }
              return (
                <div className="flex flex-col items-center justify-center py-16 animate-pulse">
                  <div className="text-7xl mb-4 animate-bounce">{emoji}</div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-600 mb-4 text-center max-w-md">{message}</p>
                  {process.env.NODE_ENV === 'development' && (
                    <>
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      >
                        {t("retry") || "Retry"}
                      </button>
                      <div className="mt-4 text-xs text-red-500 bg-red-50 p-2 rounded">
                        <strong>Debug:</strong> {error}
                      </div>
                    </>
                  )}
                </div>
              );
            })()
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
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {trips.map((trip: Trip) => (
                  <RouteCard 
                    key={trip.id} 
                    trip={trip} 
                    lastUpdate={tripUpdates.get(trip.id)}
                  />
                ))}
              </div>
              <div ref={loadMoreRef} style={{ height: 1 }} />
              {/* Show a subtle loading indicator for pagination only if loading is slow */}
              {isFetchingNextPage && (
                <DelayedLoadingIndicator delay={1000} text={t('loadingMore') || 'Loading more...'} />
              )}
              {!hasNextPage && trips.length > 0 && (
                <div className="text-center py-4 text-gray-400">{t('noMoreResults') || 'No more results.'}</div>
              )}
            </>
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
