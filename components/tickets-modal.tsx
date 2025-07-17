"use client"

import { TicketIcon, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTickets } from "@/lib/ticket-storage"
import { useLanguage } from "@/lib/language-context"
import React from "react"
import { useAuth } from "@/lib/auth-context"
import { useUserBookings } from "@/lib/features/bookings/useCreateBooking"
import QRCode from "react-qr-code"
import QRCodeGen from "qrcode"
import { toast } from "sonner"
import { usePayBooking } from "@/lib/features/bookings/useCreateBooking"
import dynamic from "next/dynamic"
import { jsPDF } from "jspdf"


interface TicketsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TicketsModal({ isOpen, onClose }: TicketsModalProps) {
  const { user } = useAuth()
  const { tickets, setCurrentTicket } = useTickets()
  const { t } = useLanguage()
  const { data: bookings = [], isLoading, error, refetch } = useUserBookings(user?.id)
  const payBooking = usePayBooking()
  const [pdfQRCodes, setPdfQRCodes] = React.useState<string[][]>([])
  // Add state to track expanded bookings
  const [expandedBooking, setExpandedBooking] = React.useState<string | null>(null)

  // Generate QR codes for each booking's tickets
  React.useEffect(() => {
    if (!bookings || bookings.length === 0 || !isOpen) return
    Promise.all(
      bookings.map((booking) =>
        Promise.all(
          (booking.tickets || []).map((ticket) =>
            QRCodeGen.toDataURL(ticket.qr_code || ticket.ticket_number || "", { width: 200 })
          )
        )
      )
    ).then(setPdfQRCodes)
  }, [bookings, isOpen])

  // Reset QR codes when dialog closes
  React.useEffect(() => {
    if (!isOpen) setPdfQRCodes([])
  }, [isOpen])

  // Refetch bookings every time the modal is opened
  React.useEffect(() => {
    if (isOpen && user) {
      refetch()
    }
  }, [isOpen, user, refetch])

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

  const handleDownloadPDF = async (ticket: any, qrCode: string, onClose: () => void) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [58, 100], // 58mm width, 100mm height (adjust as needed)
      });
      let y = 10;
      doc.setFontSize(12);
      doc.text(`Ticket #${ticket.ticket_number}`, 29, y, { align: 'center' });
      y += 8;
      doc.setFontSize(8);
      doc.text(`Pickup: ${ticket.pickup_location_name}`, 4, y);
      y += 5;
      doc.text(`Dropoff: ${ticket.dropoff_location_name}`, 4, y);
      y += 5;
      doc.text(`Car Plate: ${ticket.car_plate}`, 4, y);
      y += 5;
      doc.text(`Pickup Time: ${ticket.pickup_time ? new Date(ticket.pickup_time).toLocaleString() : '-'}`, 4, y);
      y += 8;
      // Add QR code image if available
      if (qrCode) {
        doc.addImage(qrCode, 'PNG', 18, y, 22, 22);
        y += 24;
      }
      doc.setFontSize(7);
      doc.text('Thank you for your booking!', 29, y, { align: 'center' });
      doc.save(`ticket-${ticket.ticket_number}.pdf`);
      onClose();
    } catch (error) {
      // Optionally show a toast or error message
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} key={isOpen ? 'open' : 'closed'}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TicketIcon className="h-5 w-5" />
            {t("myTicketsTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {user ? (
            isLoading ? (
              <div className="text-center py-8">{t("loading")}</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{t("errorFetchingBookings")}</div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t("noTickets")}</h3>
                <p className="text-gray-600">{t("noTicketsMessage")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking, bIdx) => (
                  <Card key={booking.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">
                            {booking.tickets[0]?.pickup_location_name} → {booking.tickets[0]?.dropoff_location_name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{booking.tickets[0]?.car_company}</p>
                          <p className="text-xs text-muted-foreground mt-1">Car Plate: {booking.tickets[0]?.car_plate}</p>
                          {/* Always show booking time */}
                          <p className="text-xs text-muted-foreground mt-1">{t("bookingTime")}: {formatDate(booking.created_at)}</p>
                          {/* Show boarding time (pickup_time of first ticket) */}
                          {booking.tickets[0]?.pickup_time && (
                            <p className="text-xs text-muted-foreground mt-1">{t("boardingTime")}: {formatDate(booking.tickets[0].pickup_time)}</p>
                          )}
                        </div>
                        <Badge variant={booking.payment.status === "COMPLETED" ? "default" : "secondary"}>
                          {t(booking.payment.status === "COMPLETED" ? "paid" : booking.payment.status.toLowerCase())}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {/* Remove duplicate booking time here, already shown above */}
                        <div></div>
                        <div className="text-right">
                          <span className="font-semibold text-green-600">{booking.total_amount} RWF</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          {booking.number_of_tickets} {booking.number_of_tickets === 1 ? t("seat") : t("seats")} • {booking.booking_reference}
                        </div>
                        {booking.payment.status === "PENDING" ? (
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await payBooking.mutateAsync(booking.id)
                                toast.success(t("paymentSuccess"))
                                refetch()
                              } catch (err: any) {
                                toast.error(t("paymentFailed"), { description: err.message })
                              }
                            }}
                            disabled={payBooking.status === 'pending'}
                          >
                            {payBooking.status === 'pending' ? t("processing") : t("payNow")}
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            {/* View Tickets Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                            >
                              {expandedBooking === booking.id ? t("hideTickets") : t("viewTickets")}
                            </Button>
                          </div>
                        )}
                      </div>
                      {/* Show ticket details inline for paid bookings only if expanded */}
                      {booking.payment.status === "COMPLETED" && expandedBooking === booking.id && (
                        <div className="mt-2">
                          <ul className="divide-y divide-gray-200 mt-2">
                            {booking.tickets.map((ticket: any, idx: number) => (
                              <li key={ticket.id} className="py-2">
                                <div className="flex flex-col gap-1">
                                  <span><b>{t("ticketNumber")}</b>: {ticket.ticket_number}</span>
                                  <span><b>{t("pickup")}</b>: {ticket.pickup_location_name}</span>
                                  <span><b>{t("dropoff")}</b>: {ticket.dropoff_location_name}</span>
                                  <span><b>{t("carPlate")}</b>: {ticket.car_plate}</span>
                                  <span><b>{t("pickupTime")}</b>: {ticket.pickup_time ? new Date(ticket.pickup_time).toLocaleString() : "-"}</span>
                                  <span>
                                    <QRCode value={ticket.qr_code || ticket.ticket_number || ""} size={64} />
                                  </span>
                                  {/* Individual Ticket PDF Download Button */}
                                  {pdfQRCodes[bIdx] && pdfQRCodes[bIdx][idx] ? (
                                    <Button
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700 text-white mt-2"
                                      onClick={() => handleDownloadPDF(ticket, pdfQRCodes[bIdx][idx], onClose)}
                                    >
                                      {t("downloadTicketPDF")}
                                    </Button>
                                  ) : (
                                    <div className="text-xs text-gray-500 mt-2">{t("generatingPDF")}</div>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            // Guest tickets fallback
            tickets.length === 0 ? (
            <div className="text-center py-8">
              <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t("noTickets")}</h3>
              <p className="text-gray-600">{t("noTicketsMessage")}</p>
            </div>
          ) : (
            <div className="space-y-3">
                {tickets.map((ticket) => (
                  <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">
                            {ticket.fromStop} → {ticket.toStop}
                          </CardTitle>
                          {/* No company name for guest tickets */}
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
                ))}
              </div>
                )
          )}
        </div>

        <Button onClick={onClose} className="w-full mt-4">
          {t("close")}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
