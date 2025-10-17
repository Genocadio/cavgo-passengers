"use client"

import { useState } from "react"
import { User, LogOut, Ticket } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import AuthModal from "./auth-modal"
import LanguageSelector from "./language-selector"
import TicketsModal from "./tickets-modal"
import { useLanguage } from "@/lib/language-context"
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react"

export default function HeaderWithAuth() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showTicketsModal, setShowTicketsModal] = useState(false)
  const { user, logout } = useAuth()
  const { t } = useLanguage()

  return (
    <>
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-row items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image 
                  src="/logo.webp" 
                  alt="Cavgo Logo" 
                  width={40} 
                  height={40}
                  className="rounded-lg object-contain"
                />
              </div>
              <div className="hidden md:block">
                <h1 className="text-2xl font-bold text-gray-900">{t("appName")}</h1>
                <p className="text-sm text-gray-600">{t("tagline")}</p>
              </div>
            </div>

            <div className="flex flex-row gap-2 items-center w-auto">
              <LanguageSelector />
              {user ? (
                <div className="flex flex-row items-center gap-2 w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTicketsModal(true)}
                    className="flex items-center gap-2 w-9 p-0 justify-center sm:w-auto sm:p-2 sm:justify-start"
                  >
                    <Ticket className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("myTickets")}</span>
                  </Button>
                  <Menu as="div" className="relative">
                    <MenuButton className="flex items-center gap-2 focus:outline-none">
                      <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm uppercase">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    </MenuButton>
                    <Transition
                      enter="transition duration-100 ease-out"
                      enterFrom="transform scale-95 opacity-0"
                      enterTo="transform scale-100 opacity-100"
                      leave="transition duration-75 ease-in"
                      leaveFrom="transform scale-100 opacity-100"
                      leaveTo="transform scale-95 opacity-0"
                    >
                      <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none z-50">
                        <div className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-600">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <MenuItem>
                            {(props: { active: boolean }) => (
                              <button
                                onClick={logout}
                                className={`${props.active ? "bg-gray-100" : ""} w-full text-left px-4 py-2 text-sm text-gray-700 flex items-center gap-2`}
                              >
                                <LogOut className="h-4 w-4" />
                                {t("signOut")}
                              </button>
                            )}
                          </MenuItem>
                        </div>
                      </MenuItems>
                    </Transition>
                  </Menu>
                </div>
              ) : (
                <Button onClick={() => setShowAuthModal(true)} className="flex items-center gap-2 w-9 p-0 justify-center sm:w-auto sm:p-2 sm:justify-start">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("signIn")}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <TicketsModal isOpen={showTicketsModal} onClose={() => setShowTicketsModal(false)} />
    </>
  )
}
