import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import { api } from "./api"
import type { RegisterRequest, RegisterResponse } from "./types"

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: "USER" | "CREATOR"
  avatar?: string | null
  bio?: string | null
  auth_provider?: string | null
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (
    code: string,
    redirectUri: string,
    provider: "github" | "google",
    role?: "USER" | "CREATOR"
  ) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (
    code: string,
    redirectUri: string,
    provider: "github" | "google",
    role?: "USER" | "CREATOR"
  ) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Utility to check if localStorage is available
const getLocalStorage = () => {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    return localStorage
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storage = getLocalStorage()
        const token = storage?.getItem("access_token")
        if (token) {
          const { data } = await api.get<User>("/users/me/")
          setUser(data)
        }
      } catch (error) {
        console.error("Failed to load user:", error)
        const storage = getLocalStorage()
        if (storage) {
          storage.removeItem("access_token")
          storage.removeItem("refresh_token")
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (
    code: string,
    redirectUri: string,
    provider: "github" | "google",
    role?: "USER" | "CREATOR"
  ) => {
    try {
      const endpoint = provider === "github" ? "/auth/github/" : "/auth/google/"
      const payload: any = { code, redirect_uri: redirectUri }
      if (role) {
        payload.role = role
      }
      
      const { data } = await api.post<{
        access: string
        refresh: string
        user: User
      }>(endpoint, payload)

      api.setToken(data.access)
      const storage = getLocalStorage()
      if (storage) {
        storage.setItem("refresh_token", data.refresh)
      }
      setUser(data.user)
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  const register = async (data: RegisterRequest) => {
    try {
      const { data: responseData } = await api.post<RegisterResponse>(
        "/auth/register/",
        data
      )

      api.setToken(responseData.access)
      const storage = getLocalStorage()
      if (storage) {
        storage.setItem("refresh_token", responseData.refresh)
      }
      setUser(responseData.user)
    } catch (error) {
      console.error("Registration failed:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      const storage = getLocalStorage()
      const refreshToken = storage?.getItem("refresh_token")
      if (refreshToken) {
        await api.post("/auth/logout/", { refresh: refreshToken })
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      api.setToken(null)
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const { data } = await api.get<User>("/users/me/")
      setUser(data)
    } catch (error) {
      console.error("Failed to refresh user:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
