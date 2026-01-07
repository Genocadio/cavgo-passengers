"use client"

import React, { useState, useEffect } from "react"

import { User, Phone, Mail, CreditCard, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Route, BookingRequest, Ticket } from "@/lib/types"
import { Trip, TripWaypoint } from "@/lib/features/trips/useTrips"
import {
  getAvailableDestinations,
  getAvailableOrigins,
  calculatePrice,
  isBookingAllowed,
  getAllowedSoonStops,
} from "@/lib/booking-utils"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { useTickets } from "@/lib/ticket-storage"
import { useCreateBooking } from "@/lib/features/bookings/useCreateBooking"
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image as PDFImage } from "@react-pdf/renderer"
import QRCode from "react-qr-code"
import QRCodeGen from "qrcode"


interface BookingModalProps {
  trip: Trip
  isOpen: boolean
  onClose: () => void
}

export default function BookingModal({ trip, isOpen, onClose }: BookingModalProps) {
  if (!trip) return null;
  const { user } = useAuth()
  const { t } = useLanguage()
  const { addTicket, setCurrentTicket } = useTickets()

  const [booking, setBooking] = useState<Partial<BookingRequest>>({
    tripId: trip.id,
    fromStopId: undefined,
    toStopId: undefined,
    seats: 1,
    passengerName: user?.name || "",
    passengerPhone: user?.phone || "",
    passengerEmail: user?.email || "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [pendingBooking, setPendingBooking] = useState<Partial<BookingRequest> | null>(null)
  const [createdBooking, setCreatedBooking] = useState<any>(null)
  const [paymentPhone, setPaymentPhone] = useState(user?.phone || "")
  const createBooking = useCreateBooking()

  // Place at the top level of BookingModal, after other hooks
  const [pdfQRCodes, setPdfQRCodes] = useState<string[]>([]);
  useEffect(() => {
    if (!createdBooking?.tickets) return;
    Promise.all(
      createdBooking.tickets.map((ticket: any) =>
        QRCodeGen.toDataURL(ticket.qr_code || ticket.ticket_number || "", { width: 200 })
      )
    ).then(setPdfQRCodes);
  }, [createdBooking]);

  const availableOrigins = getAvailableOrigins(trip)
  const availableDestinations = getAvailableDestinations(trip)
  const allowedSoonStops = getAllowedSoonStops(trip)

  const price = booking.fromStopId && booking.toStopId ? calculatePrice(trip, booking.fromStopId, booking.toStopId) : 0

  const totalPrice = price * (booking.seats || 1)

  // Check if booking is possible
  const isBookingPossible = availableOrigins.length > 0 && availableDestinations.length > 0

  // --- City Route Booking Logic ---
  // Helper to build 'from' options for city routes
  function getCityRouteFromOptions() {
    if (!trip.route.city_route) return [];
    // Origin as order 0
    const originOption = {
      id: trip.route.origin.id,
      order: 0,
      price: 0,
      custom_name: trip.route.origin.custom_name || 'Origin',
      type: 'origin',
    };
    // Unpassed waypoints
    const unpassedWaypoints = trip.waypoints
      .filter((wp) => !wp.is_passed)
      .map((wp) => ({
        id: wp.location.id,
        order: wp.order,
        price: wp.price,
        custom_name: wp.location.custom_name || `Stop ${wp.order}`,
        type: 'waypoint',
      }));
    return [originOption, ...unpassedWaypoints];
  }

  // Helper to build 'to' options for city routes
  function getCityRouteToOptions(fromOrder: number, fromId: string) {
    if (!trip.route.city_route) return [];
    const isOrigin = fromId.toString() === trip.route.origin.id.toString();
    let waypoints;
    if (isOrigin) {
      // All waypoints are available if from is origin
      waypoints = trip.waypoints.map((wp) => ({
        id: wp.location.id,
        order: wp.order,
        price: wp.price,
        custom_name: wp.location.custom_name || `Stop ${wp.order}`,
        type: 'waypoint',
      }));
    } else {
      // Only waypoints with order > fromOrder
      waypoints = trip.waypoints
        .filter((wp) => wp.order > fromOrder)
        .map((wp) => ({
          id: wp.location.id,
          order: wp.order,
          price: wp.price,
          custom_name: wp.location.custom_name || `Stop ${wp.order}`,
          type: 'waypoint',
        }));
    }
    // Always add destination as last option
    const maxOrder = trip.waypoints.reduce((max, wp) => Math.max(max, wp.order), 0);
    waypoints.push({
      id: trip.route.destination.id,
      order: maxOrder + 1,
      price: trip.route.route_price,
      custom_name: trip.route.destination.custom_name || 'Destination',
      type: 'destination',
    });
    return waypoints;
  }

  // For city route, track selected 'from' order
  const cityRouteFromOptions = trip.route.city_route ? getCityRouteFromOptions() : [];
  const selectedFrom = cityRouteFromOptions.find(opt => opt.id.toString() === booking.fromStopId?.toString());
  const selectedFromOrder = selectedFrom ? selectedFrom.order : undefined;
  const cityRouteToOptions = (trip.route.city_route && selectedFromOrder !== undefined && booking.fromStopId)
    ? getCityRouteToOptions(selectedFromOrder, booking.fromStopId.toString())
    : [];

  // Debug: Log available 'to' options and related data
  if (trip.route.city_route) {
    console.log('cityRouteFromOptions', cityRouteFromOptions);
    console.log('selectedFrom', selectedFrom);
    console.log('selectedFromOrder', selectedFromOrder);
    console.log('trip.waypoints', trip.waypoints);
    console.log('trip.route.origin.id', trip.route.origin.id);
    console.log('trip.route.destination.id', trip.route.destination.id);
    console.log('cityRouteToOptions', cityRouteToOptions, 'booking', booking);
  }

  const fromStopName = selectedFrom?.custom_name || availableOrigins.find(s => s.location.id === booking.fromStopId)?.location.custom_name;
  const toStopName = cityRouteToOptions.find(s => s.id === booking.toStopId)?.custom_name || availableDestinations.find(s => s.location.id === booking.toStopId)?.location.custom_name;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('Booking form submitted', booking);

    if (!booking.fromStopId || !booking.toStopId || !booking.passengerName || !booking.seats || (!user ? !booking.passengerPhone : !paymentPhone)) {
      toast.error(t("pleaseFillAllFields"), { description: t("requiredFieldsMissing") });
      console.log('Missing required fields', booking);
      return;
    }

    const allowedResult = isBookingAllowed(trip, booking.fromStopId, booking.toStopId);
    if (!allowedResult.allowed) {
      toast.error(t("bookingNotAllowed"), { description: allowedResult.reason || t("invalidStopSelection") });
      console.log('Booking not allowed for selected stops', booking, allowedResult.reason);
      return;
    }

    setPendingBooking({ ...booking })
    setShowConfirmation(true)
  }

  const handleConfirmBooking = async () => {
    if (!pendingBooking) return;
    setIsSubmitting(true)
    try {
      const payload = {
        trip_id: trip.id,
        pickup_location_id: pendingBooking.fromStopId!,
        dropoff_location_id: pendingBooking.toStopId!,
        number_of_tickets: pendingBooking.seats!,
        total_amount: getSegmentPrice(trip, pendingBooking.fromStopId!, pendingBooking.toStopId!) * pendingBooking.seats!,
        user_id: user?.id || null,
        user_email: pendingBooking.passengerEmail || user?.email || null,
        user_phone: user ? paymentPhone : pendingBooking.passengerPhone!,
        user_name: pendingBooking.passengerName!,
        payment_method: "MOBILE_MONEY",
        payment_data: user ? paymentPhone : pendingBooking.passengerPhone!,
      }
      const data = await createBooking.mutateAsync(payload)
      setCreatedBooking(data.booking)
      setShowConfirmation(false)
      setShowSuccess(true)
      toast.success(t("bookingConfirmed"), { description: `${t("bookingReference")}: ${data.booking.booking_reference}`, duration: 5000 })
    } catch (err: any) {
      toast.error(t("bookingFailed"), { description: err.message || t("somethingWentWrong") })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setBooking({
      tripId: trip.id,
      fromStopId: undefined,
      toStopId: undefined,
      seats: 1,
      passengerName: user?.name || "",
      passengerPhone: user?.phone || "",
      passengerEmail: user?.email || "",
    })
    setPaymentPhone(user?.phone || "")
    setShowConfirmation(false)
    setShowSuccess(false)
    setPendingBooking(null)
    setCreatedBooking(null)
    onClose()
  }

  // Helper to calculate segment price based on clarified rules
  function getSegmentPrice(trip: Trip, fromStopId: string, toStopId: string) {
    if (!fromStopId || !toStopId) return 0;
    const originId = trip.route.origin.id?.toString();
    const destinationId = trip.route.destination.id?.toString();
    const fromId = fromStopId.toString();
    const toId = toStopId.toString();
    const tripPrice = trip.route.route_price || 0;
    const waypoints = trip.waypoints || [];
    const fromWp = waypoints.find(wp => wp.location.id.toString() === fromId);
    const toWp = waypoints.find(wp => wp.location.id.toString() === toId);

    // Origin -> Destination
    if (fromId === originId && toId === destinationId) {
      return tripPrice;
    }
    // Origin -> Waypoint
    if (fromId === originId && toWp) {
      return toWp.price || 0;
    }
    // Waypoint -> Destination
    if (toId === destinationId && fromWp) {
      return tripPrice - (fromWp.price || 0);
    }
    // Waypoint -> Waypoint
    if (fromWp && toWp) {
      return (toWp.price || 0) - (fromWp.price || 0);
    }
    return 0;
  }

  if (showConfirmation && pendingBooking) {
    // Helper to get stop name by id
    function getStopNameById(stopId: string) {
      if (!stopId) return "";
      if (trip.route.origin.id.toString() === stopId.toString()) return trip.route.origin.custom_name || t("origin");
      if (trip.route.destination.id.toString() === stopId.toString()) return trip.route.destination.custom_name || t("destination");
      const wp = trip.waypoints.find(wp => wp.location.id.toString() === stopId.toString());
      return wp?.location.custom_name || t("stop");
    }
    const confirmFromName = getStopNameById(pendingBooking.fromStopId!);
    const confirmToName = getStopNameById(pendingBooking.toStopId!);
    const companyName = trip.vehicle.company_name;

    // Departure time logic
    let pickupTimeDisplay = null;
    if (pendingBooking.fromStopId?.toString() === trip.route.origin.id.toString()) {
      // Origin: use trip.departure_time
      const dt = new Date(trip.departure_time * 1000);
      pickupTimeDisplay = `${t("departureTime")}: ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      // Waypoint: find waypoint
      const wp = trip.waypoints.find(wp => wp.location.id.toString() === pendingBooking.fromStopId?.toString());
      if (wp) {
        if (typeof wp.remaining_time === 'number' && wp.remaining_time !== null) {
          const now = new Date();
          const eta = new Date(now.getTime() + wp.remaining_time * 1000);
          pickupTimeDisplay = `${t("estimatedPickupTime")}: ${eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (trip.status === 'SCHEDULED') {
          pickupTimeDisplay = t("notifyWhenCarCloseToPickup");
        }
      }
    }
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("confirmBooking")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold">{t("pleaseConfirmBookingDetails")}</h3>
            </div>
            <Card>
              <CardContent className="pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t("company")}</span>
                  <span className="font-medium">{companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("trip")}</span>
                  <span className="font-medium">
                    {confirmFromName} → {confirmToName}
                  </span>
                </div>
                {pickupTimeDisplay && (
                  <div className="flex justify-between">
                    <span>{t("pickupTime")}</span>
                    <span className="font-medium">{pickupTimeDisplay}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t("carPlate")}:</span>
                  <span className="font-medium">{trip.vehicle.license_plate}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("seats")}:</span>
                  <span className="font-medium">{pendingBooking.seats}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("totalLabel")}</span>
                  <span className="font-medium text-green-600">{getSegmentPrice(trip, pendingBooking.fromStopId!, pendingBooking.toStopId!) * pendingBooking.seats!} RWF</span>
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-3 pt-4 items-center justify-between">
              <Button onClick={handleClose} variant="outline" className="flex-1 max-w-[120px]">
                {t("cancel")}
              </Button>
              <Button onClick={handleConfirmBooking} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 flex-1">
                {isSubmitting ? t("processing") : t("confirmAndBook")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (showSuccess && createdBooking) {
    // PDF styles for POS/receipt
    const pdfStyles = StyleSheet.create({
      page: {
        padding: 8,
        width: 210, // ~58mm in points
        minHeight: 350,
        flexDirection: 'column',
        backgroundColor: '#fff',
      },
      ticket: {
        marginBottom: 8,
        padding: 8,
        borderBottom: '1px dashed #888',
        fontSize: 12,
      },
      title: { fontSize: 16, marginBottom: 8, fontWeight: 'bold', textAlign: 'center' },
      label: { fontWeight: 'bold' },
      value: { marginLeft: 2 },
      qr: { width: 80, height: 80, alignSelf: 'center', marginVertical: 8 },
      sep: { borderBottom: '1px dashed #888', marginVertical: 4 },
    });

    // PDF Document component
    const TicketsPDF = ({ tickets, qrCodes }: { tickets: any[]; qrCodes: string[] }) => (
      <Document>
        {tickets.map((ticket, idx) => (
          <Page key={ticket.id || idx} size={{ width: 210, height: 350 }} style={pdfStyles.page}>
            <View style={pdfStyles.ticket}>
              <Text style={pdfStyles.title}>Ticket #{ticket.ticket_number}</Text>
              <Text><Text style={pdfStyles.label}>Pickup:</Text> <Text style={pdfStyles.value}>{ticket.pickup_location_name}</Text></Text>
              <Text><Text style={pdfStyles.label}>Dropoff:</Text> <Text style={pdfStyles.value}>{ticket.dropoff_location_name}</Text></Text>
              <Text><Text style={pdfStyles.label}>Car Plate:</Text> <Text style={pdfStyles.value}>{ticket.car_plate}</Text></Text>
              <Text><Text style={pdfStyles.label}>Pickup Time:</Text> <Text style={pdfStyles.value}>{ticket.pickup_time ? new Date(ticket.pickup_time).toLocaleString() : "-"}</Text></Text>
              <View style={pdfStyles.qr}>
                {qrCodes[idx] && <PDFImage src={qrCodes[idx]} style={pdfStyles.qr} />}
              </View>
            </View>
          </Page>
        ))}
      </Document>
    );

    // Only show tickets if payment is COMPLETED
    const isPaid = createdBooking.payment?.status === "COMPLETED";

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={isPaid ? "text-green-600" : "text-amber-600"}>
              {isPaid ? t("bookingConfirmed") : t("paymentPending")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className={`w-16 h-16 ${isPaid ? "bg-green-100" : "bg-amber-100"} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <CreditCard className={`h-8 w-8 ${isPaid ? "text-green-600" : "text-amber-600"}`} />
              </div>
              <h3 className="font-semibold">
                {isPaid ? t("bookingConfirmedMessage") : t("bookingPendingPaymentMessage")}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {t("bookingReference")} {createdBooking.booking_reference}
              </p>
            </div>
            {/* If not paid, show instructions instead of tickets */}
            {!isPaid ? (
              <div className="bg-amber-100 text-amber-900 p-3 rounded mb-2 text-sm flex flex-col items-center">
                <span className="font-semibold mb-1">{t("paymentInstructionsTitle")}</span>
                <span className="mb-2">{t("paymentInstructionsMessage")}</span>
              </div>
            ) : (
              <>
                {user == null && (
                  <div className="bg-amber-100 text-amber-900 p-3 rounded mb-2 text-sm flex flex-col items-center">
                    <span className="font-semibold mb-1">{t("pleaseSaveYourTickets")}</span>
                    <span className="mb-2">{t("saveTicketsWarning")}</span>
                    {pdfQRCodes.length === createdBooking.tickets.length && pdfQRCodes.every(Boolean) ? (
                      <PDFDownloadLink
                        document={<TicketsPDF tickets={createdBooking.tickets} qrCodes={pdfQRCodes} />}
                        fileName="tickets.pdf"
                      >
                        {({ loading }) => (
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-2">
                            {loading ? t("generatingPDF") : t("downloadTicketsPDF")}
                          </Button>
                        )}
                      </PDFDownloadLink>
                    ) : (
                      <div className="text-xs text-gray-500">{t("generatingPDF")}</div>
                    )}
                  </div>
                )}
                <Card>
                  <CardContent className="pt-4 space-y-2 text-sm">
                    <div className="mb-2">
                      <span className="font-semibold">{t("yourTickets")}</span>
                      <ul className="divide-y divide-gray-200 mt-2">
                        {createdBooking.tickets.map((ticket: any, idx: number) => (
                          <li key={ticket.id} className="py-2">
                            <div className="flex flex-col gap-1">
                              <span><b>{t("ticketNumber")}:</b> {ticket.ticket_number}</span>
                              <span><b>{t("pickup")}</b>: {ticket.pickup_location_name}</span>
                              <span><b>{t("dropoff")}</b>: {ticket.dropoff_location_name}</span>
                              <span><b>{t("carPlate")}</b>: {ticket.car_plate}</span>
                              <span><b>{t("pickupTime")}</b>: {ticket.pickup_time ? new Date(ticket.pickup_time).toLocaleString() : "-"}</span>
                              <span>
                                <QRCode value={ticket.qr_code || ticket.ticket_number || ""} size={64} />
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("trip")}</span>
                      <span className="font-medium">
                        {createdBooking.tickets[0]?.pickup_location_name} → {createdBooking.tickets[0]?.dropoff_location_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("carPlate")}:</span>
                      <span className="font-medium">{createdBooking.tickets[0]?.car_plate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("seats")}:</span>
                      <span className="font-medium">{createdBooking.number_of_tickets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("totalLabel")}</span>
                      <span className="font-medium text-green-600">{createdBooking.total_amount} RWF</span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
            <Button onClick={handleClose} className="w-full">
              {t("close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md sm:max-w-lg px-4 py-4 rounded-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("bookYourJourney")}</DialogTitle>
        </DialogHeader>
        
        {!isBookingPossible ? (
          <div className="p-6">
            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">
                    {!trip.route.city_route
                      ? t("noProvincialBookingPoints")
                      : t("noCityBookingPoints")}
                  </p>
                  {!trip.route.city_route && trip.status === "IN_PROGRESS" && (
                    <p className="text-sm text-amber-700 mt-2">
                      {t("finalDestinationOnly")}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <Button onClick={handleClose} className="w-full mt-4">
              {t("close")}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card>
              <CardHeader className="px-3 py-2">
                <CardTitle className="text-lg bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">{t("bookYourJourney")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 w-full">
                    <Label htmlFor="fromStop">{t("from")}</Label>
                    {trip.route.city_route ? (
                      <Select
                        value={booking.fromStopId != null ? booking.fromStopId.toString() : ""}
                        onValueChange={(value) => setBooking({ ...booking, fromStopId: value, toStopId: undefined })}
                      >
                        <SelectTrigger className="w-full">
                          <span className="truncate">
                            {booking.fromStopId !== undefined && booking.fromStopId !== null
                              ? String(cityRouteFromOptions.find((stop) => stop.id.toString() === booking.fromStopId?.toString())?.custom_name || t("selectOrigin"))
                              : t("selectOrigin")}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {cityRouteFromOptions.map((stop) => (
                            <SelectItem
                              key={stop.id.toString()}
                              value={stop.id.toString()}
                              className="truncate"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="truncate break-words max-w-[120px] md:max-w-[180px]">{stop.custom_name}</span>
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                  {t("available")}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select
                        value={booking.fromStopId != null ? booking.fromStopId.toString() : ""}
                        onValueChange={(value) => setBooking({ ...booking, fromStopId: value, toStopId: undefined })}
                      >
                        <SelectTrigger className="w-full">
                          <span className="truncate">
                            {booking.fromStopId !== undefined && booking.fromStopId !== null
                              ? String(availableOrigins.find((stop) => stop.location.id.toString() === booking.fromStopId?.toString())?.location.custom_name || t("selectOrigin"))
                              : t("selectOrigin")}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {availableOrigins
                            .filter((stop) => stop.location.id.toString() !== booking.fromStopId?.toString())
                            .map((stop) => (
                              <SelectItem key={stop.location.id.toString()} value={stop.location.id.toString()} className="truncate">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="truncate break-words max-w-[120px] md:max-w-[180px]">{stop.location.custom_name}</span>
                                  {stop.price > 0 && <span className="text-muted-foreground">({stop.price} RWF)</span>}
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                    {t("available")}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2 w-full">
                    <Label htmlFor="toStop">{t("to")}</Label>
                    {trip.route.city_route ? (
                      <Select
                        value={booking.toStopId != null ? booking.toStopId.toString() : ""}
                        onValueChange={(value) => setBooking({ ...booking, toStopId: value })}
                        disabled={!booking.fromStopId}
                      >
                        <SelectTrigger className="w-full">
                          <span className="truncate">
                            {booking.toStopId !== undefined && booking.toStopId !== null
                              ? String(cityRouteToOptions.find((stop) => stop.id.toString() === booking.toStopId?.toString())?.custom_name || t("selectDestination"))
                              : t("selectDestination")}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {cityRouteToOptions.map((stop) => (
                            <SelectItem
                              key={stop.id.toString()}
                              value={stop.id.toString()}
                              className="truncate"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="truncate break-words max-w-[120px] md:max-w-[180px]">{stop.custom_name}</span>
                                <span className="text-muted-foreground">({getSegmentPrice(trip, booking.fromStopId!, stop.id.toString())} RWF)</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select
                        value={booking.toStopId != null ? booking.toStopId.toString() : ""}
                        onValueChange={(value) => setBooking({ ...booking, toStopId: value })}
                        disabled={!booking.fromStopId}
                      >
                        <SelectTrigger className="w-full">
                          <span className="truncate">
                            {booking.toStopId !== undefined && booking.toStopId !== null
                              ? String(availableDestinations.find((stop) => stop.location.id.toString() === booking.toStopId?.toString())?.location.custom_name || t("selectDestination"))
                              : t("selectDestination")}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {availableDestinations
                             .filter((stop) => stop.location.id.toString() !== (booking.fromStopId !== undefined ? booking.fromStopId.toString() : ""))
                             .map((stop) => (
                               <SelectItem key={stop.location.id.toString()} value={stop.location.id.toString()} className="truncate">
                                 <span className="truncate break-words max-w-[120px] md:max-w-[180px]">{stop.location.custom_name}</span> ({stop.price} RWF)
                               </SelectItem>
                             ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="seats">{t("numberOfSeats")}</Label>
                    <Select
                      value={booking.seats?.toString()}
                      onValueChange={(value) => setBooking({ ...booking, seats: Number.parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: Math.min(Math.max(trip.remaining_seats ?? trip.seats ?? 0, 0), 4) }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i === 0 ? t("seat") : t("seats")} {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col items-end justify-end min-h-[40px]">
                    {booking.fromStopId && booking.toStopId && booking.seats ? (
                      (() => {
                        const segPrice = getSegmentPrice(trip, booking.fromStopId, booking.toStopId);
                        const total = segPrice * booking.seats;
                        return (
                          <span className="font-semibold text-green-700 text-lg">
                            {t("totalLabel")} {total} RWF
                          </span>
                        );
                      })()
                    ) : (
                      <span className="text-muted-foreground text-sm">{t("selectStopsAndSeatsForPrice")}</span>
                    )}
                  </div>
                </div>

                {/* Passenger Information Section */}
                <div className="border-t pt-3 mt-3">
                  <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
                    <User className="h-4 w-4 text-green-600" />
                    {t("passengerInformation")}
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Full Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor="passengerName" className="text-center block font-medium">{t("fullName")} *</Label>
                      <div className="relative max-w-sm mx-auto w-full">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="passengerName"
                          value={booking.passengerName}
                          onChange={(e) => setBooking({ ...booking, passengerName: e.target.value })}
                          placeholder={t("enterFullName")}
                          className="pl-10 text-center"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone Number Field */}
                    {!user ? (
                      <div className="space-y-2">
                        <Label htmlFor="passengerPhone" className="text-center block font-medium">{t("phoneNumber")} *</Label>
                        <div className="relative max-w-sm mx-auto w-full">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="passengerPhone"
                            value={booking.passengerPhone}
                            onChange={(e) => setBooking({ ...booking, passengerPhone: e.target.value })}
                            placeholder={t("phonePlaceholder")}
                            className="pl-10 text-center"
                            required
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          {t("phoneUsageNote")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="paymentPhone" className="text-center block font-medium">{t("phoneNumber")} *</Label>
                        <div className="relative max-w-sm mx-auto w-full">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="paymentPhone"
                            value={paymentPhone}
                            onChange={(e) => setPaymentPhone(e.target.value)}
                            placeholder={t("phonePlaceholder")}
                            className="pl-10 text-center"
                            required
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          {t("phoneUsageNote")}
                        </p>
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded text-center">{t("registeredPhoneNote")}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                    <Button type="button" variant="outline" onClick={handleClose} className="w-full md:flex-1 max-w-[120px]">
                      {t("cancel")}
                    </Button>
                    <div className="flex flex-col md:flex-row items-center gap-4 flex-1 justify-end w-full">
                      <span className="font-semibold text-green-700 text-lg whitespace-nowrap">
                        {t("totalLabel")} {booking.fromStopId && booking.toStopId && booking.seats ? getSegmentPrice(trip, booking.fromStopId, booking.toStopId) * booking.seats : 0} RWF
                      </span>
                      <Button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          !booking.fromStopId ||
                          !booking.toStopId ||
                          !booking.passengerName ||
                          (!user ? !booking.passengerPhone : !paymentPhone)
                        }
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 min-w-[160px] w-full md:w-auto shadow-lg"
                      >
                        {isSubmitting ? t("processing") : `${t("bookFor")} ${booking.fromStopId && booking.toStopId && booking.seats ? getSegmentPrice(trip, booking.fromStopId, booking.toStopId) * booking.seats : 0} RWF`}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}