"use client"

import { QrCode, Download, Share } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Ticket } from "@/lib/types"
import { companies } from "@/lib/data"
import { useLanguage } from "@/lib/language-context"
import QRCode from "react-qr-code"
import jsPDF from "jspdf"
import { useRef, useState } from "react"
import { toast } from "sonner"
// @ts-expect-error: No types for dom-to-image-more
import domtoimage from "dom-to-image-more"

interface TicketModalProps {
  ticket: Ticket | null
  isOpen: boolean
  onClose: () => void
}

export default function TicketModal({ ticket, isOpen, onClose }: TicketModalProps) {
  const { t } = useLanguage()
  const ticketRef = useRef<HTMLDivElement>(null)
  const [forcePdfColors, setForcePdfColors] = useState(false)

  if (!ticket) return null

  const company = companies.find((c) => c.id === ticket.route.companyId)

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "TBD"
    const dateObj = typeof date === "string" ? new Date(date) : date
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleDownload = async () => {
    if (!ticketRef.current) return

    toast(t("download") + "...", { description: t("ticketDetails"), duration: 2000 })
    try {
      setForcePdfColors(true)
      await new Promise((resolve) => setTimeout(resolve, 50))
      // Find the hidden print ticket div
      const printTicket = document.getElementById("print-ticket")
      if (!printTicket) throw new Error("Print ticket not found")
      const dataUrl = await domtoimage.toPng(printTicket, {
        bgcolor: "#ffffff",
        style: {
          color: "#000",
          background: "#fff",
          backgroundColor: "#fff",
          borderColor: "#000"
        },
        cacheBust: true
      })
      // A4 size in px at 96dpi: 794 x 1123
      const a4Width = 794
      const a4Height = 1123
      const ticketWidth = 350
      const ticketHeight = printTicket.offsetHeight
      // Center ticket on A4
      const x = (a4Width - ticketWidth) / 2
      const y = 80 // top margin
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [a4Width, a4Height]
      })
      pdf.addImage(dataUrl, "PNG", x, y, ticketWidth, ticketHeight)
      pdf.save(`ticket-${ticket.bookingReference}.pdf`)
      setForcePdfColors(false)
    } catch (error) {
      setForcePdfColors(false)
      console.error("Error generating PDF:", error)
      toast.error("PDF download failed", { description: String(error) })
    }
  }

  // Create QR code data
  const qrCodeData = JSON.stringify({
    reference: ticket.bookingReference,
    passenger: ticket.passengerName,
    from: ticket.fromStop,
    to: ticket.toStop,
    seats: ticket.seats,
    departure: ticket.route.stops[0]?.estimatedArrival 
      ? formatDate(ticket.route.stops[0].estimatedArrival)
      : "TBD"
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("ticketDetails")}</DialogTitle>
        </DialogHeader>

        <div ref={ticketRef} id="ticket-content" className={`space-y-4${forcePdfColors ? ' force-pdf-colors' : ''}`}>
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-lg">
              <QRCode
                value={qrCodeData}
                size={128}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 128 128`}
              />
            </div>
          </div>

          {/* Ticket Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-center">
                {ticket.fromStop} → {ticket.toStop}
              </CardTitle>
              <div className="text-center text-sm text-muted-foreground">{company?.name}</div>
              <div className="text-center text-xs text-muted-foreground mt-1">Car Plate: {ticket.carplate}</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t("passenger")} </span>
                  <div className="font-medium">{ticket.passengerName}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("contact")} </span>
                  <div className="font-medium">{ticket.passengerPhone}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t("departure")} </span>
                  <div className="font-medium">
                    {formatDate(ticket.route.stops[0]?.estimatedArrival)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("seats")} </span>
                  <div className="font-medium">{ticket.seats}</div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t("ticketReference")} </span>
                  <span className="font-mono font-medium">{ticket.bookingReference}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-muted-foreground">{t("paymentStatus")} </span>
                  <Badge variant={ticket.paymentStatus === "paid" ? "default" : "secondary"}>
                    {t(ticket.paymentStatus)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center font-semibold mt-2">
                  <span>{t("totalLabel")}</span>
                  <span className="text-green-600">{ticket.totalPrice} RWF</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hidden print-friendly ticket for PDF export */}
          <div
            id="print-ticket"
            style={{
              position: "absolute",
              left: "-9999px",
              top: 0,
              width: 350,
              background: "#fff",
              color: "#000",
              padding: 24,
              borderRadius: 12,
              fontFamily: "sans-serif",
              boxShadow: "0 0 0 #fff",
              wordBreak: "break-word",
              fontSize: 14,
              lineHeight: 1.4
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <QRCode value={qrCodeData} size={96} style={{ margin: "0 auto" }} />
              <div style={{ fontWeight: 700, fontSize: 20, marginTop: 8 }}>{ticket.fromStop} → {ticket.toStop}</div>
              <div style={{ fontSize: 14, color: "#555" }}>{company?.name}</div>
            </div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>
              <div><b>{t("passenger")}</b> {ticket.passengerName}</div>
              <div><b>{t("contact")}</b> {ticket.passengerPhone}</div>
              <div><b>{t("departure")}</b> {formatDate(ticket.route.stops[0]?.estimatedArrival)}</div>
              <div><b>{t("seats")}</b> {ticket.seats}</div>
              <div><b>Car Plate</b> {ticket.carplate}</div>
            </div>
            <div style={{ borderTop: "1px solid #eee", margin: "12px 0" }} />
            <div style={{ fontSize: 13 }}>
              <div><b>{t("ticketReference")}</b> <span style={{ fontFamily: "monospace" }}>{ticket.bookingReference}</span></div>
              <div><b>{t("paymentStatus")}</b> {t(ticket.paymentStatus)}</div>
              <div style={{ fontWeight: 700, marginTop: 8 }}>{t("totalLabel")}: <span style={{ color: "#059669" }}>{ticket.totalPrice} RWF</span></div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            {t("download")}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => {}}>
            <Share className="h-4 w-4 mr-2" />
            {t("share")}
          </Button>
        </div>

        <Button onClick={onClose} className="w-full">
          {t("close")}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
