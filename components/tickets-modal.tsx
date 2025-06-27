"use client"

import { TicketIcon, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTickets } from "@/lib/ticket-storage"
import { useLanguage } from "@/lib/language-context"
import { companies } from "@/lib/data"

interface TicketsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TicketsModal({ isOpen, onClose }: TicketsModalProps) {
  const { tickets, setCurrentTicket } = useTickets()
  const { t } = useLanguage()

  const handleViewTicket = (ticket: any) => {
    setCurrentTicket(ticket)
    onClose()
  }

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) {
      return "Invalid Date"
    }
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TicketIcon className="h-5 w-5" />
            {t("myTicketsTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="text-center py-8">
              <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t("noTickets")}</h3>
              <p className="text-gray-600">{t("noTicketsMessage")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const company = companies.find((c) => c.id === ticket.route.companyId)
                return (
                  <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">
                            {ticket.fromStop} → {ticket.toStop}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{company?.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">Car Plate: {ticket.carplate}</p>
                        </div>
                        <Badge variant={ticket.paymentStatus === "paid" ? "default" : "secondary"}>
                          {t(ticket.paymentStatus)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(ticket.bookingDate)}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-green-600">{ticket.totalPrice} RWF</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          {ticket.seats} {ticket.seats === 1 ? t("seat") : t("seats")} • {ticket.bookingReference}
                        </div>
                        <Button size="sm" onClick={() => handleViewTicket(ticket)}>
                          {t("viewTicket")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        <Button onClick={onClose} className="w-full mt-4">
          {t("close")}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
