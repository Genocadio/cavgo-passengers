import { Trip } from "./features/trips/useTrips"

export interface Stop {
  id?: number // unique id for mapping
  name: string
  estimatedArrival?: string
  isMidpoint: boolean
  isPassed: boolean
  passedTime?: string
  price: number
  estimatedTime?: string // Add this field for departed routes
}

export interface CurrentLocation {
  nextStop: string
  remainingTime: string
  remainingDistance: string
  lastPassedStop: string
  lastPassedTime: string
}

export interface Route {
  id: number
  from: string
  to: string
  price: number
  routeType: "provincial" | "city"
  companyId: number
  availableSeats: number
  status: "scheduled" | "departed" | "completed"
  isCompleted: boolean
  stops: Stop[]
  currentLocation: CurrentLocation | null
  carplate: string // Car's plate number
}

export interface BookingRequest {
  tripId: number
  fromStopId: string
  toStopId: string
  seats: number
  passengerName: string
  passengerPhone: string
  passengerEmail?: string
  carplate?: string // Optionally store carplate for future use
}

export interface User {
  id: string
  name: string
  email: string
  phone: string
  accessToken?: string
  refreshToken?: string
  userId?: number
  username?: string
  userType?: string
  isCompanyUser?: boolean
  companyId?: number
  companyUserRole?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  userId: number
  username: string
  email: string
  phone: string
  userType: string
  isCompanyUser: boolean
  companyId?: number
  companyUserRole?: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  phone?: string
  password: string
}

export interface LoginRequest {
  emailOrPhone: string
  password: string
}

export interface Ticket {
  id: string
  bookingReference: string
  routeId: number
  fromStop: string
  toStop: string
  seats: number
  passengerName: string
  passengerPhone: string
  passengerEmail?: string
  paymentPhone: string
  totalPrice: number
  bookingDate: string
  paymentStatus: "paid" | "pending"
  trip: Trip
  carplate: string // Car's plate number
}
