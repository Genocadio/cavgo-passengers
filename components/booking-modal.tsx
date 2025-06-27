"use client"

import type React from "react"

import { useState } from "react"
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

interface BookingModalProps {
  route: Route
  isOpen: boolean
  onClose: () => void
}

export default function BookingModal({ route, isOpen, onClose }: BookingModalProps) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { addTicket, setCurrentTicket } = useTickets()

  const [booking, setBooking] = useState<Partial<BookingRequest>>({
    routeId: route.id,
    fromStop: "",
    toStop: "",
    seats: 1,
    passengerName: user?.name || "",
    passengerPhone: user?.phone || "",
    passengerEmail: user?.email || "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [paymentPhone, setPaymentPhone] = useState(user?.phone || "")

  const availableOrigins = getAvailableOrigins(route)
  const availableDestinations = getAvailableDestinations(route)
  const allowedSoonStops = getAllowedSoonStops(route)

  const price = booking.fromStop && booking.toStop ? calculatePrice(route, booking.fromStop, booking.toStop) : 0

  const totalPrice = price * (booking.seats || 1)

  // Check if booking is possible
  const isBookingPossible = availableOrigins.length > 0 && availableDestinations.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!booking.fromStop || !booking.toStop || !booking.passengerName || !booking.passengerPhone) {
      return
    }

    if (!isBookingAllowed(route, booking.fromStop, booking.toStop)) {
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Create ticket
    const ticket: Ticket = {
      id: `ticket_${Date.now()}`,
      bookingReference: `BK${Date.now().toString().slice(-6)}`,
      routeId: route.id,
      fromStop: booking.fromStop!,
      toStop: booking.toStop!,
      seats: booking.seats!,
      passengerName: booking.passengerName!,
      passengerPhone: booking.passengerPhone!,
      passengerEmail: booking.passengerEmail,
      paymentPhone: paymentPhone,
      totalPrice: totalPrice,
      bookingDate: new Date(),
      paymentStatus: "pending",
      route: route,
      carplate: route.carplate,
    }

    addTicket(ticket)

    // Show success toast
    toast.success(t("bookingConfirmed"), {
      description: `${t("bookingReference")}: BK${Date.now().toString().slice(-6)}`,
      duration: 5000,
    })

    setIsSubmitting(false)
    setShowConfirmation(true)
  }

  const handleClose = () => {
    setBooking({
      routeId: route.id,
      fromStop: "",
      toStop: "",
      seats: 1,
      passengerName: user?.name || "",
      passengerPhone: user?.phone || "",
      passengerEmail: user?.email || "",
    })
    setPaymentPhone(user?.phone || "")
    setShowConfirmation(false)
    onClose()
  }

  if (showConfirmation) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-600">{t("bookingConfirmed")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold">{t("bookingConfirmedMessage")}</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {t("bookingReference")} BK{Date.now().toString().slice(-6)}
              </p>
            </div>

            <Card>
              <CardContent className="pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t("route")}</span>
                  <span className="font-medium">
                    {booking.fromStop} → {booking.toStop}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Car Plate:</span>
                  <span className="font-medium">{route.carplate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{booking.seats}</span>
                  <span>{t("seats")}:</span>

                </div>
                <div className="flex justify-between">
                  <span>{t("totalLabel")}</span>
                  <span className="font-medium text-green-600">{totalPrice} RWF</span>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleClose} className="w-full">
              {t("close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                    {route.routeType === "provincial"
                      ? t("noProvincialBookingPoints")
                      : t("noCityBookingPoints")}
                  </p>
                  {route.routeType === "provincial" && route.status === "departed" && (
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Route Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("journeyDetails")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 w-full">
                    <Label htmlFor="fromStop">{t("from")}</Label>
                    <Select
                      value={booking.fromStop}
                      onValueChange={(value) => setBooking({ ...booking, fromStop: value, toStop: "" })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("selectOrigin")} className="truncate" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableOrigins.map((stop, index) => (
                          <SelectItem key={index} value={stop.name} className="truncate">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate break-words max-w-[120px] md:max-w-[180px]">{stop.name}</span>
                              {stop.price > 0 && <span className="text-muted-foreground">({stop.price} RWF)</span>}
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                Available
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 w-full">
                    <Label htmlFor="toStop">{t("to")}</Label>
                    <Select
                      value={booking.toStop}
                      onValueChange={(value) => setBooking({ ...booking, toStop: value })}
                      disabled={!booking.fromStop}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("selectDestination")} className="truncate" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDestinations
                          .filter((stop) => stop.name !== booking.fromStop)
                          .map((stop, index) => (
                            <SelectItem key={index} value={stop.name} className="truncate">
                              <span className="truncate break-words max-w-[120px] md:max-w-[180px]">{stop.name}</span> ({stop.price} RWF)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Show "Allowed Soon" stops for provincial routes */}
                {route.routeType === "provincial" && allowedSoonStops.length > 0 && (
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">
                          {route.status === "departed" ? t("upcomingBoardingPoints") : t("futureBoardingPoints")}
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          {route.status === "departed"
                            ? t("nextBoardingMessage")
                            : t("futureBoardingMessage")}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {allowedSoonStops.map((stop, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className={`text-xs ${index === 0 && route.status === "departed" 
                                ? "bg-green-50 text-green-800 border-green-300" 
                                : "bg-amber-100 text-amber-800 border-amber-300"}`}
                            >
                              {index === 0 && route.status === "departed" && "→ "}
                              {stop.name}
                              {index === 0 && route.status === "departed" && ` (${t("nextAvailable")})`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                      {Array.from({ length: Math.min(route.availableSeats, 4) }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                           {i === 0 ? t("seat") : t("seats")} {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Booking Rules Info */}
                {/* {route.routeType === "provincial" && (
                  <div className="bg-amber-50 p-3 rounded-lg text-sm">
                    <strong>{t("ruralRouteRules")}:</strong>
                    {route.status === "scheduled" ? (
                      <span> Boarding only from origin. All destinations available for booking.</span>
                    ) : (
                      <span> {t("ruralDepartedRule")}</span>
                    )}
                  </div>
                )} */}

                {/* {route.routeType === "city" && (
                  <div className="bg-blue-50 p-3 rounded-lg text-sm">
                    <strong>{t("cityRoute")}:</strong> {t("cityRouteRule")}
                  </div>
                )} */}
              </CardContent>
            </Card>

            {/* Passenger Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("passengerInformation")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="passengerName">{t("fullName")} *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="passengerName"
                      value={booking.passengerName}
                      onChange={(e) => setBooking({ ...booking, passengerName: e.target.value })}
                      placeholder={t("enterFullName")}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Phone number logic: only show passengerPhone if not logged in, else show paymentPhone */}
                {!user ? (
                  <div className="space-y-2">
                    <Label htmlFor="passengerPhone">{t("phoneNumber")} *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="passengerPhone"
                        value={booking.passengerPhone}
                        onChange={(e) => setBooking({ ...booking, passengerPhone: e.target.value })}
                        placeholder="+250 xxx xxx xxx"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="passengerEmail">{t("email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="passengerEmail"
                      type="email"
                      value={booking.passengerEmail}
                      onChange={(e) => setBooking({ ...booking, passengerEmail: e.target.value })}
                      placeholder="your.email@example.com"
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information: only show if user is logged in */}
            {user && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("paymentInformation")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentPhone">{t("mobileMoneyNumber")} *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="paymentPhone"
                        value={paymentPhone}
                        onChange={(e) => setPaymentPhone(e.target.value)}
                        placeholder="+250 xxx xxx xxx"
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{t("paymentPrompt")}</p>
                  </div>
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">{t("registeredPhoneNote")}</div>
                </CardContent>
              </Card>
            )}

            {/* Price Summary */}
            {price > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("priceSummary")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t("pricePerSeat")}</span>
                      <span>{price} RWF</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t("numberOfSeats")}:</span>
                      <span>{booking.seats}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>{t("totalLabel")}</span>
                      <span className="text-green-600">{totalPrice} RWF</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !booking.fromStop ||
                  !booking.toStop ||
                  !booking.passengerName ||
                  (!user ? !booking.passengerPhone : !paymentPhone)
                }
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? t("processing") : `${t("bookFor")} ${totalPrice} RWF`}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
