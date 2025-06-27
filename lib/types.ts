export interface Stop {
  name: string
  estimatedArrival?: Date
  isMidpoint: boolean
  isPassed: boolean
  passedTime?: Date
  price: number
  estimatedTime?: string // Add this field for departed routes
}

export interface CurrentLocation {
  nextStop: string
  remainingTime: string
  remainingDistance: string
  lastPassedStop: string
  lastPassedTime: Date
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
  routeId: number
  fromStop: string
  toStop: string
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
  bookingDate: Date
  paymentStatus: "paid" | "pending"
  route: Route
  carplate: string // Car's plate number
}
