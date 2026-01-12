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
  clearTickets: () => void
  updateTicket: (id: string, updates: Partial<Ticket>) => void
}

const TicketContext = createContext<TicketContextType | undefined>(undefined)

const GUEST_TICKETS_KEY = "guest_tickets"
const TICKET_EXPIRY_HOURS = 24

// Clean up tickets older than 24 hours
function cleanOldTickets(tickets: Ticket[]): Ticket[] {
  const now = new Date().getTime()
  const expiryTime = TICKET_EXPIRY_HOURS * 60 * 60 * 1000
  return tickets.filter((ticket) => {
    if (!ticket.createdAt) return true // Keep tickets without timestamp
    const ticketTime = new Date(ticket.createdAt).getTime()
    return now - ticketTime < expiryTime
  })
}

export function TicketProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null)
  const { user } = useAuth()
  const [previousUser, setPreviousUser] = useState(user)

  // Load tickets on mount and clean old ones
  useEffect(() => {
    const storedTickets = localStorage.getItem(GUEST_TICKETS_KEY)
    if (storedTickets) {
      try {
        const parsedTickets = JSON.parse(storedTickets)
        const cleanedTickets = cleanOldTickets(parsedTickets)
        setTickets(cleanedTickets)
        // Update storage with cleaned tickets
        if (cleanedTickets.length !== parsedTickets.length) {
          localStorage.setItem(GUEST_TICKETS_KEY, JSON.stringify(cleanedTickets))
        }
      } catch (error) {
        console.error("Error parsing tickets:", error)
        setTickets([])
      }
    }
  }, [])

  // Clear tickets when user logs in
  useEffect(() => {
    if (user && !previousUser) {
      // User just logged in, clear guest tickets
      localStorage.removeItem(GUEST_TICKETS_KEY)
      setTickets([])
    }
    setPreviousUser(user)
  }, [user, previousUser])

  const addTicket = (ticket: Ticket) => {
    // Add timestamp to ticket
    const ticketWithTimestamp = {
      ...ticket,
      createdAt: new Date().toISOString(),
    }
    const newTickets = [...tickets, ticketWithTimestamp]
    setTickets(newTickets)

    try {
      // Save to localStorage for guest users only
      if (!user) {
        localStorage.setItem(GUEST_TICKETS_KEY, JSON.stringify(newTickets))
      }
    } catch (error) {
      console.error("Error saving tickets:", error)
    }

    // Set as current ticket for immediate viewing
    setCurrentTicket(ticketWithTimestamp)
  }

  const clearTickets = () => {
    setTickets([])
    localStorage.removeItem(GUEST_TICKETS_KEY)
  }

  const updateTicket = (id: string, updates: Partial<Ticket>) => {
    const updatedTickets = tickets.map((ticket) =>
      ticket.id === id ? { ...ticket, ...updates } : ticket
    )
    setTickets(updatedTickets)

    try {
      // Save to localStorage for guest users only
      if (!user) {
        localStorage.setItem(GUEST_TICKETS_KEY, JSON.stringify(updatedTickets))
      }
    } catch (error) {
      console.error("Error updating tickets:", error)
    }
  }

  const getTicket = (id: string): Ticket | undefined => {
    return tickets.find((ticket) => ticket.id === id)
  }

  return (
    <TicketContext.Provider value={{ tickets, addTicket, getTicket, currentTicket, setCurrentTicket, clearTickets, updateTicket }}>
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
