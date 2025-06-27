"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Ticket } from "./types"
import { useAuth } from "./auth-context"

interface TicketContextType {
  tickets: Ticket[]
  addTicket: (ticket: Ticket) => void
  getTicket: (id: string) => Ticket | undefined
  currentTicket: Ticket | null
  setCurrentTicket: (ticket: Ticket | null) => void
}

const TicketContext = createContext<TicketContextType | undefined>(undefined)

export function TicketProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      // Load tickets for logged-in user
      const storedTickets = localStorage.getItem(`tickets_${user.id}`)
      if (storedTickets) {
        try {
          const parsedTickets = JSON.parse(storedTickets, (key, value) => {
            // Convert date strings back to Date objects
            if (key === "bookingDate") {
              return new Date(value)
            }
            return value
          })
          setTickets(parsedTickets)
        } catch (error) {
          console.error("Error parsing tickets:", error)
          setTickets([])
        }
      }
    } else {
      // Clear tickets for non-logged-in users
      setTickets([])
    }
  }, [user])

  const addTicket = (ticket: Ticket) => {
    const newTickets = [...tickets, ticket]
    setTickets(newTickets)

    if (user) {
      try {
        // Save to localStorage for logged-in users
        localStorage.setItem(`tickets_${user.id}`, JSON.stringify(newTickets))
      } catch (error) {
        console.error("Error saving tickets:", error)
      }
    }

    // Set as current ticket for immediate viewing
    setCurrentTicket(ticket)
  }

  const getTicket = (id: string): Ticket | undefined => {
    return tickets.find((ticket) => ticket.id === id)
  }

  return (
    <TicketContext.Provider value={{ tickets, addTicket, getTicket, currentTicket, setCurrentTicket }}>
      {children}
    </TicketContext.Provider>
  )
}

export function useTickets() {
  const context = useContext(TicketContext)
  if (context === undefined) {
    throw new Error("useTickets must be used within a TicketProvider")
  }
  return context
}
