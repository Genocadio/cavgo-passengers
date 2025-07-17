"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { User, AuthResponse, RegisterRequest, LoginRequest } from "./types"

interface AuthContextType {
  user: User | null
  login: (emailOrPhone: string, password: string) => Promise<boolean>
  register: (data: RegisterRequest) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem("user")
    const storedTokens = localStorage.getItem("tokens")
    if (storedUser && storedTokens) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (emailOrPhone: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8080/api"
      const response = await fetch(`${BACKEND_BASE_URL}/main/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailOrPhone,
          password,
        } as LoginRequest),
      })

      if (response.status === 503) {
        const serviceError = new Error("Service not available for now, try again later.")
        // @ts-ignore
        serviceError.code = "SERVICE_UNAVAILABLE"
        throw serviceError
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Login failed")
      }

      const authData: AuthResponse = await response.json()
      
      const userData: User = {
        id: authData.userId.toString(),
        name: authData.username,
        email: authData.email,
        phone: authData.phone,
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        userId: authData.userId,
        username: authData.username,
        userType: authData.userType,
        isCompanyUser: authData.isCompanyUser,
        companyId: authData.companyId,
        companyUserRole: authData.companyUserRole,
      }

      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      localStorage.setItem("tokens", JSON.stringify({
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
      }))
      
      setIsLoading(false)
      return true
    } catch (error: any) {
      setIsLoading(false)
      if (
        error?.name === "TypeError" &&
        (error?.message?.includes("Failed to fetch") || error?.message?.includes("NetworkError") || error?.message?.includes("net::ERR_CONNECTION_REFUSED"))
      ) {
        const serviceError = new Error("Service not available for now, try again later.")
        // @ts-ignore
        serviceError.code = "SERVICE_UNAVAILABLE"
        throw serviceError
      }
      return false
    }
  }

  const register = async (data: RegisterRequest): Promise<boolean> => {
    setIsLoading(true)

    try {
      const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8080/api"
      const response = await fetch(`${BACKEND_BASE_URL}/main/client`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.status === 503) {
        const serviceError = new Error("Service not available for now, try again later.")
        // @ts-ignore
        serviceError.code = "SERVICE_UNAVAILABLE"
        throw serviceError
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Registration failed")
      }

      const authData: AuthResponse = await response.json()
      
      const userData: User = {
        id: authData.userId.toString(),
        name: authData.username,
        email: authData.email,
        phone: authData.phone,
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        userId: authData.userId,
        username: authData.username,
        userType: authData.userType,
        isCompanyUser: authData.isCompanyUser,
        companyId: authData.companyId,
        companyUserRole: authData.companyUserRole,
      }

      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      localStorage.setItem("tokens", JSON.stringify({
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
      }))
      
      setIsLoading(false)
      return true
    } catch (error: any) {
      setIsLoading(false)
      if (
        error?.name === "TypeError" &&
        (error?.message?.includes("Failed to fetch") || error?.message?.includes("NetworkError") || error?.message?.includes("net::ERR_CONNECTION_REFUSED"))
      ) {
        const serviceError = new Error("Service not available for now, try again later.")
        // @ts-ignore
        serviceError.code = "SERVICE_UNAVAILABLE"
        throw serviceError
      }
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    localStorage.removeItem("tokens")
  }

  return <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
