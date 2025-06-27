import { NextResponse } from 'next/server'

const companies = [
  { id: 1, name: "Express Transport" },
  { id: 2, name: "Swift Bus" },
  { id: 3, name: "City Connect" },
  { id: 4, name: "Rural Link" },
  { id: 5, name: "Airport Shuttle" },
  { id: 6, name: "Metro Bus" },
]

export async function GET() {
  return NextResponse.json(companies)
} 