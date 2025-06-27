import { NextResponse } from 'next/server'

const routes = [
  {
    id: 1,
    from: "Kigali",
    to: "Musanze",
    price: 2500,
    routeType: "provincial",
    companyId: 1,
    availableSeats: 12,
    status: "departed",
    isCompleted: false,
    stops: [
      {
        name: "Kigali",
        estimatedArrival: "2024-01-15T08:00:00",
        isMidpoint: false,
        isPassed: true,
        price: 0,
      },
      {
        name: "Gakenke",
        isMidpoint: true,
        isPassed: false,
        price: 1800,
        estimatedTime: "12 min",
      },
      {
        name: "Musanze",
        isMidpoint: false,
        isPassed: false,
        price: 2500,
      },
    ],
    currentLocation: {
      nextStop: "Gakenke",
      remainingTime: "12 min",
      remainingDistance: "18 km",
      lastPassedStop: "Kigali",
      lastPassedTime: "2024-01-15T08:05:00",
    },
    carplate: "RAB 123A",
  },
  // ... (copy the rest of the routes from lib/data.ts, converting Dates to ISO strings)
]

export async function GET() {
  return NextResponse.json(routes)
} 