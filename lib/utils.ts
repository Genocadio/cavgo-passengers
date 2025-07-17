import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAuthHeaders(): HeadersInit {
  const tokens = localStorage.getItem("tokens")
  if (tokens) {
    const { accessToken } = JSON.parse(tokens)
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    }
  }
  return {
    "Content-Type": "application/json",
  }
}

export function getAccessToken(): string | null {
  const tokens = localStorage.getItem("tokens")
  if (tokens) {
    const { accessToken } = JSON.parse(tokens)
    return accessToken
  }
  return null
}

export function getRefreshToken(): string | null {
  const tokens = localStorage.getItem("tokens")
  if (tokens) {
    const { refreshToken } = JSON.parse(tokens)
    return refreshToken
  }
  return null
}

export async function apiCall(url: string, options: RequestInit = {}) {
  const headers = getAuthHeaders()
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })

  if (response.status === 401) {
    // Handle token refresh or logout
    localStorage.removeItem("user")
    localStorage.removeItem("tokens")
    window.location.reload()
    return null
  }

  return response
}
