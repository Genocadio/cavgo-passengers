import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { LanguageProvider } from "@/lib/language-context"
import { TicketProvider } from "@/lib/ticket-storage"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Cavgo - Passenger Booking System",
  description: "Book routes with flexible midpoint options for rural and city travel",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <AuthProvider>
            <TicketProvider>
              {children}
              <Toaster position="top-center" expand={true} richColors />
            </TicketProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
