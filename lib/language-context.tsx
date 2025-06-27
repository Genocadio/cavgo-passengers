"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type Language = "en" | "rw" | "fr"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  en: {
    // Header
    appName: "Cavgo",
    tagline: "Your journey starts here",
    signIn: "Sign In",
    signOut: "Sign Out",
    myTickets: "My Tickets",

    // Search
    searchRoutes: "Search Routes",
    from: "From",
    to: "To",
    originPlaceholder: "Origin city or stop",
    destinationPlaceholder: "Destination city or stop",
    companyPlaceholder: "Type company name...",
    selectCompany: "Select company",
    allCompanies: "All companies",
    departedCityRoutes: "Departed City Routes",
    ruralRoutes: "Provincial Routes",
    searchButton: "Search Routes",
    reset: "Reset",
    filtersActive: "filters active",
    filter: "filter",
    transportationCompany: "Transportation Company",
    routeFilters: "Route Filters",

    // Route Cards
    seatsAvailable: "seats available",
    bookNow: "Book Now",
    notAvailable: "Not Available",
    fromPrice: "from",
    enRouteTo: "En route to",
    remaining: "remaining",
    routeStops: "Route Stops",
    ruralRouteProgress: "Provincial route in progress: Limited booking options available",
    timeTBD: "Time TBD",

    // Booking Modal
    bookYourJourney: "Book Your Journey",
    journeyDetails: "Journey Details",
    selectOrigin: "Select origin",
    selectDestination: "Select destination",
    numberOfSeats: "Number of Seats",
    seat: "seat",
    seats: "seats",
    ruralRouteRules: "Provincial Route Rules",
    ruralScheduledRule: "Boarding only from origin. All destinations available for booking.",
    ruralDepartedRule: "Limited to next available stop or final destination only.",
    upcomingBoardingPoints: "Upcoming Boarding Points",
    futureBoardingPoints: "Future Boarding Points",
    upcomingBoardingMessage: "These stops will become available for booking as the bus reaches them:",
    nextBoardingMessage: "Next stop that will become available for boarding:",
    nextAvailable: "next available",
    futureBoardingMessage: "These stops will become available for booking once the route starts:",
    cityRoute: "City Route",
    cityRouteRule: "You can book to any unpassed stop for maximum flexibility.",
    noProvincialBookingPoints: "No Booking Points Available",
    noCityBookingPoints: "No Available Stops",
    finalDestinationOnly: "The bus has reached its final destination or only the final destination is remaining.",
    passengerInformation: "Passenger Information",
    fullName: "Full Name",
    enterFullName: "Enter your full name",
    phoneNumber: "Phone Number",
    email: "Email (Optional)",
    paymentInformation: "Payment Information",
    mobileMoneyNumber: "Mobile Money Number",
    paymentPrompt: "Payment will be processed via Mobile Money. You'll receive a payment prompt on this number.",
    registeredPhoneNote: "Using your registered phone number. You can change it above if needed.",
    priceSummary: "Price Summary",
    pricePerSeat: "Price per seat:",
    totalLabel: "Total:",
    cancel: "Cancel",
    processing: "Processing...",
    bookFor: "Book for",

    // Booking Confirmation
    bookingConfirmed: "Booking Confirmed!",
    bookingConfirmedMessage: "Your booking has been confirmed",
    bookingReference: "Booking reference:",
    route: "Route:",
    close: "Close",
    viewTicket: "View Ticket",

    // Auth Modal
    signInTitle: "Sign In",
    password: "Password",
    enterPassword: "Enter your password",
    invalidCredentials: "Invalid email or password",
    demoCredentials: "Demo credentials:",
    anyPassword: "Password: any password",
    signingIn: "Signing in...",

    // Tickets
    myTicketsTitle: "My Tickets",
    noTickets: "No tickets found",
    noTicketsMessage: "You haven't booked any routes yet.",
    ticketDetails: "Ticket Details",
    passenger: "Passenger:",
    contact: "Contact:",
    departure: "Departure:",
    arrival: "Arrival:",
    ticketReference: "Ticket Reference:",
    paymentStatus: "Payment Status:",
    paid: "Paid",
    pending: "Pending",
    download: "Download",
    share: "Share",

    // General
    noRoutesFound: "No routes found",
    tryAdjusting: "Try adjusting your search criteria",
    currentFilters: "Current filters:",
    companies: "Companies",
    destinations: "destinations",
    routes: "routes",
    routesIn: "routes in",
    footer: "Making travel accessible for everyone.",
  },
  rw: {
    // Header
    appName: "Cavgo",
    tagline: "Urugendo rwawe rutangira hano",
    signIn: "Kwinjira",
    signOut: "Gusohoka",
    myTickets: "Amatike Yanjye",

    // Search
    searchRoutes: "Shakisha Ingendo",
    from: "Aho Uhagurukira",
    to: "Aho Ugana",
    originPlaceholder: "Aho Uhagurukira",
    destinationPlaceholder: "Aho ugana",
    companyPlaceholder: "Andika izina ry'ikigo...",
    selectCompany: "Hitamo ikigo",
    allCompanies: "Ibigo byose",
    departedCityRoutes: "Inzira z' Umujyi",
    ruralRoutes: "Inzira zijya mu ntara",
    searchButton: "Shakisha Ingendo",
    reset: "Subiza",
    filtersActive: "amashyushyu akora",
    filter: "mushyushyu",
    transportationCompany: "Ikigo cy'Ubwikorezi",
    routeFilters: "Amashyushyu y'Inzira",

    // Route Cards
    seatsAvailable: "Imyanya isigaye",
    bookNow: "Tega",
    notAvailable: "Ntiboneka",
    fromPrice: "guhera kuri",
    enRouteTo: "Mu nzira yerekeza",
    remaining: "bisigaye",
    routeStops: "Aho Inzira Ihaguruka",
    ruralRouteProgress: "Inzira ya intara igenda: Amahitamo make yo kubuka ahari",
    timeTBD: "Igihe Kitazwi",

    // Booking Modal
    bookYourJourney: "Tega",
    journeyDetails: "Amakuru y'Urugendo",
    selectOrigin: "Hitamo aho utangira",
    selectDestination: "Hitamo aho ugana",
    numberOfSeats: "Umubare w'imyanya",
    seat: "umwanya",
    seats: "Imyanya",
    ruralRouteRules: "Amategeko y'inzira zijya muntara",
    ruralScheduledRule: "Guhagarara gusa ku ntangiriro. Aho ugana hose haraboneka.",
    ruralDepartedRule: "Bigarukira ku guhagarara gukurikira cyangwa ku ntego ya nyuma gusa.",
    upcomingBoardingPoints: "Aho imodoka ihagarara",
    futureBoardingPoints: "Aho Hazahagarara",
    upcomingBoardingMessage: "Aha hazaboneka mu gihe bisi igeze aho:",
    nextBoardingMessage: "Aho hazakurikiraho kuboneka:",
    nextAvailable: "hazakurikiraho",
    futureBoardingMessage: "Aha hazaboneka mu gihe urugendo rutangiye:",
    cityRoute: "Inzira y'Umujyi",
    cityRouteRule: "Ushobora kubuka aho hose hatarenze kugirango ubone uburyo bworoshye.",
    noProvincialBookingPoints: "Nta Hantu ho Kubuka Hahari",
    noCityBookingPoints: "Nta Hantu Hahari",
    finalDestinationOnly: "Bisi igeze ku ntego yayo cyangwa hasigaye intego gusa.",
    passengerInformation: "Amakuru y'Umugenzi",
    fullName: "Amazina Yose",
    enterFullName: "Andika amazina yawe yose",
    phoneNumber: "Nimero ya Telefoni",
    email: "Imeyili (Bitegetswe)",
    paymentInformation: "Amakuru yo Kwishyura",
    mobileMoneyNumber: "Nimero ya Mobile Money",
    paymentPrompt: "Kwishyura bizakorwa binyuze muri Mobile Money. Uzabona ubutumwa bwo kwishyura kuri iyi nimero.",
    registeredPhoneNote: "Ukoresha nimero yawe yanditswe. Ushobora kuyihindura hejuru niba ukeneye.",
    priceSummary: "Incamake y'Igiciro",
    pricePerSeat: "Igiciro ku ntebe imwe:",
    totalLabel: "Igiteranyo:",
    cancel: "Kuraguza",
    processing: "Bitegurwa...",
    bookFor: "Buka kuri",

    // Booking Confirmation
    bookingConfirmed: "Kubuka Byemejwe!",
    bookingConfirmedMessage: "Kubuka kwawe byemejwe",
    bookingReference: "Nimero yo kubuka:",
    route: "Inzira:",
    close: "Gufunga",
    viewTicket: "Reba Itike",

    // Auth Modal
    signInTitle: "Kwinjira",
    password: "Ijambo Ryibanga",
    enterPassword: "Andika ijambo ryibanga",
    invalidCredentials: "Imeyili cyangwa ijambo ryibanga bitari byo",
    demoCredentials: "Amakuru yo kugerageza:",
    anyPassword: "Ijambo ryibanga: ijambo iryo ari ryo ryose",
    signingIn: "Kwinjira...",

    // Tickets
    myTicketsTitle: "Amatike Yanjye",
    noTickets: "Nta matike aboneka",
    noTicketsMessage: "Ntubuka urugendo na rumwe.",
    ticketDetails: "Amakuru y'Itike",
    passenger: "Umugenzi:",
    contact: "Itumanaho:",
    departure: "Gutaha:",
    arrival: "Kugera:",
    ticketReference: "Nimero y'Itike:",
    paymentStatus: "Uko Kwishyura Kugenda:",
    paid: "Byishyuwe",
    pending: "Bitegereje",
    download: "Gukuramo",
    share: "Gusangira",

    // General
    noRoutesFound: "Nta nzira zaboneka",
    tryAdjusting: "Gerageza guhindura ibyo ushakisha",
    currentFilters: "Amashyushyu akurikizwa:",
    companies: "Ibigo",
    destinations: "aho bagana",
    routes: "inzira",
    routesIn: "inzira muri",
    footer: "Gutuma urugendo ruboneka ku bantu bose.",
  },
  fr: {
    // Header
    appName: "Cavgo",
    tagline: "Votre voyage commence ici",
    signIn: "Se connecter",
    signOut: "Se déconnecter",
    myTickets: "Mes Billets",

    // Search
    searchRoutes: "Rechercher des Itinéraires",
    from: "De",
    to: "À",
    originPlaceholder: "Ville ou arrêt de départ",
    destinationPlaceholder: "Ville ou arrêt de destination",
    companyPlaceholder: "Tapez le nom de la compagnie...",
    selectCompany: "Sélectionner une compagnie",
    allCompanies: "Toutes les compagnies",
    departedCityRoutes: "Itinéraires Urbains Partis",
    ruralRoutes: "Itinéraires Provinciaux",
    searchButton: "Rechercher des Itinéraires",
    reset: "Réinitialiser",
    filtersActive: "filtres actifs",
    filter: "filtre",
    transportationCompany: "Compagnie de Transport",
    routeFilters: "Filtres d'Itinéraires",

    // Route Cards
    seatsAvailable: "sièges disponibles",
    bookNow: "Réserver Maintenant",
    notAvailable: "Non Disponible",
    fromPrice: "à partir de",
    enRouteTo: "En route vers",
    remaining: "restant",
    routeStops: "Arrêts de l'Itinéraire",
    ruralRouteProgress: "Itinéraire provincial en cours: Options de réservation limitées disponibles",
    timeTBD: "Heure à déterminer",

    // Booking Modal
    bookYourJourney: "Réservez Votre Voyage",
    journeyDetails: "Détails du Voyage",
    selectOrigin: "Sélectionner l'origine",
    selectDestination: "Sélectionner la destination",
    numberOfSeats: "Nombre de Sièges",
    seat: "siège",
    seats: "sièges",
    ruralRouteRules: "Règles des Itinéraires Provinciaux",
    ruralScheduledRule: "Embarquement uniquement depuis l'origine. Toutes les destinations disponibles.",
    ruralDepartedRule: "Limité au prochain arrêt disponible ou à la destination finale uniquement.",
    upcomingBoardingPoints: "Points d'Embarquement à Venir",
    futureBoardingPoints: "Points d'Embarquement Futurs",
    upcomingBoardingMessage: "Ces arrêts seront disponibles lorsque le bus les atteindra :",
    nextBoardingMessage: "Prochain arrêt qui sera disponible pour l'embarquement :",
    nextAvailable: "prochain disponible",
    futureBoardingMessage: "Ces arrêts seront disponibles une fois l'itinéraire commencé :",
    cityRoute: "Itinéraire Urbain",
    cityRouteRule: "Vous pouvez réserver vers n'importe quel arrêt non passé pour une flexibilité maximale.",
    noProvincialBookingPoints: "Aucun Point de Réservation Disponible",
    noCityBookingPoints: "Aucun Arrêt Disponible",
    finalDestinationOnly: "Le bus a atteint sa destination finale ou seule la destination finale reste.",
    passengerInformation: "Informations du Passager",
    fullName: "Nom Complet",
    enterFullName: "Entrez votre nom complet",
    phoneNumber: "Numéro de Téléphone",
    email: "Email (Optionnel)",
    paymentInformation: "Informations de Paiement",
    mobileMoneyNumber: "Numéro Mobile Money",
    paymentPrompt: "Le paiement sera traité via Mobile Money. Vous recevrez une invite de paiement sur ce numéro.",
    registeredPhoneNote:
      "Utilisation de votre numéro de téléphone enregistré. Vous pouvez le modifier ci-dessus si nécessaire.",
    priceSummary: "Résumé des Prix",
    pricePerSeat: "Prix par siège:",
    totalLabel: "Total:",
    cancel: "Annuler",
    processing: "Traitement...",
    bookFor: "Réserver pour",

    // Booking Confirmation
    bookingConfirmed: "Réservation Confirmée!",
    bookingConfirmedMessage: "Votre réservation a été confirmée",
    bookingReference: "Référence de réservation:",
    route: "Itinéraire:",
    close: "Fermer",
    viewTicket: "Voir le Billet",

    // Auth Modal
    signInTitle: "Se Connecter",
    password: "Mot de Passe",
    enterPassword: "Entrez votre mot de passe",
    invalidCredentials: "Email ou mot de passe invalide",
    demoCredentials: "Identifiants de démonstration:",
    anyPassword: "Mot de passe: n'importe quel mot de passe",
    signingIn: "Connexion...",

    // Tickets
    myTicketsTitle: "Mes Billets",
    noTickets: "Aucun billet trouvé",
    noTicketsMessage: "Vous n'avez encore réservé aucun itinéraire.",
    ticketDetails: "Détails du Billet",
    passenger: "Passager:",
    contact: "Contact:",
    departure: "Départ:",
    arrival: "Arrivée:",
    ticketReference: "Référence du Billet:",
    paymentStatus: "Statut du Paiement:",
    paid: "Payé",
    pending: "En Attente",
    download: "Télécharger",
    share: "Partager",

    // General
    noRoutesFound: "Aucun itinéraire trouvé",
    tryAdjusting: "Essayez d'ajuster vos critères de recherche",
    currentFilters: "Filtres actuels:",
    companies: "Compagnies",
    destinations: "destinations",
    routes: "itinéraires",
    routesIn: "itinéraires dans",
    footer: "Rendre les voyages accessibles à tous.",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    const storedLanguage = localStorage.getItem("language") as Language
    if (storedLanguage && ["en", "rw", "fr"].includes(storedLanguage)) {
      setLanguage(storedLanguage)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)[typeof language]] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
