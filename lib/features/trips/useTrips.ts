import { useInfiniteQuery, InfiniteData, QueryFunctionContext } from '@tanstack/react-query'
import axios from 'axios'

// Backend Trip type
interface Location {
  id: string;
  latitude: number;
  price?: number | null
  longitude: number;
  code?: string | null;
  google_place_name?: string | null;
  custom_name?: string | null;
  place_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Driver{
  name: string;
  phone: string;
}
export interface Vehicle {
  id: number;
  company_id: number;
  company_name: string;
  capacity: number;
  license_plate: string;
  driver: Driver;
}

export interface TripWaypoint {
  id: string;
  trip_id: number;
  location_id: string;
  order: number;
  price: number;
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
  origin_id: string;
  destination_id: string;
  route_price: number;
  city_route: boolean;
  created_at: string;
  updated_at: string;
  origin: Location;
  destination: Location;
  waypoints: any[] | null;
}

export interface Trip {
  id: number;
  route_id: number;
  vehicle_id: number;
  vehicle: Vehicle;
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

export interface PaginatedTripsResponse {
  trips: Trip[];
  total: number;
  limit: number;
  offset: number;
  sse_uuid?: string;
}

// SSE UUID storage utility
class SSEUUIDStorage {
  private static instance: SSEUUIDStorage;
  private storage: Map<string, { uuid: string; timestamp: number }> = new Map();
  private readonly EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

  static getInstance(): SSEUUIDStorage {
    if (!SSEUUIDStorage.instance) {
      SSEUUIDStorage.instance = new SSEUUIDStorage();
    }
    return SSEUUIDStorage.instance;
  }

  set(key: string, uuid: string): void {
    this.storage.set(key, {
      uuid,
      timestamp: Date.now()
    });
  }

  get(key: string): string | null {
    const item = this.storage.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > this.EXPIRY_TIME;
    if (isExpired) {
      this.storage.delete(key);
      return null;
    }

    return item.uuid;
  }

  clear(): void {
    this.storage.clear();
  }
}

export function useTrips(filters?: {
  origin?: string;
  destination?: string;
  company?: string;
  city_route?: boolean;
  limit?: number;
}) {
  const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8080/api";
  const limit = filters?.limit || 20;
  const sseStorage = SSEUUIDStorage.getInstance();
  
  // Create a unique key for this query based on filters
  const queryKey = JSON.stringify(['trips', filters]);
  
  const {
    data,
    status,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedTripsResponse, Error>({
    queryKey: ['trips', filters],
    queryFn: async (context: QueryFunctionContext) => {
      const offsetParam = (context.pageParam ?? 0) as number;
      let url = `${BACKEND_BASE_URL}/navig/trips`;
      const params = new URLSearchParams();
      
      if (filters?.origin) params.append('origin', filters.origin);
      if (filters?.destination) params.append('destination', filters.destination);
      if (filters?.company) params.append('company', filters.company);
      if (filters?.city_route === true || filters?.city_route === false) params.append('city_route', filters.city_route.toString());
      params.append('limit', limit.toString());
      params.append('offset', offsetParam.toString());
      
      // Add SSE UUID if available (for subsequent pages)
      const sseUuid = sseStorage.get(queryKey);
      if (sseUuid && offsetParam > 0) {
        params.append('session_uuid', sseUuid);
      }
      
      url += `?${params.toString()}`;
      const response = await axios.get(url);
      
      // Store SSE UUID from response if present (backend refreshes UUID on each response)
      if (response.data.sse_uuid) {
        sseStorage.set(queryKey, response.data.sse_uuid);
      }
      
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const nextOffset = lastPage.offset + lastPage.limit;
      if (nextOffset < lastPage.total) {
        return nextOffset;
      }
      return undefined;
    },
    initialPageParam: 0,
  });

  // Flatten trips from all pages
  const trips = (data as InfiniteData<PaginatedTripsResponse>)?.pages?.flatMap(page => page.trips) || [];
  const total = (data as InfiniteData<PaginatedTripsResponse>)?.pages?.[0]?.total || 0;
  const offset = (data as InfiniteData<PaginatedTripsResponse>)?.pages?.[(data as InfiniteData<PaginatedTripsResponse>)?.pages?.length - 1]?.offset || 0;
  const sseUuid = (data as InfiniteData<PaginatedTripsResponse>)?.pages?.[0]?.sse_uuid || null;
  
  return {
    trips,
    total,
    limit,
    offset,
    sseUuid,
    status,
    error: error ? error.message : null,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
} 