import { useState, useCallback, useEffect } from "react"
import { api, ApiError } from "./api"
import type {
  Session,
  SessionPopulated,
  Booking,
  CreateSessionInput,
  UpdateSessionInput,
  isSessionPopulated,
  isBookingPopulated,
} from "./types"
import type { User } from "./auth"

// Re-export types from types.ts for backward compatibility
export type { Session, Booking, CreateSessionInput } from "./types"

// Also export type guards
export { isSessionPopulated, isBookingPopulated } from "./types"

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(
    async (params?: { search?: string; creator_id?: number }) => {
      setIsLoading(true)
      setError(null)
      try {
        const query = new URLSearchParams()
        if (params?.search) query.append("search", params.search)
        if (params?.creator_id) query.append("creator_id", params.creator_id.toString())

        const { data } = await api.get<any>(
          `/sessions/${query.toString() ? "?" + query.toString() : ""}`
        )

        // Handle both paginated and direct array responses
        let sessionsList: Session[] = []
        if (data && typeof data === "object") {
          if ("results" in data && Array.isArray(data.results)) {
            // Paginated response
            sessionsList = data.results
          } else if (Array.isArray(data)) {
            // Direct array response
            sessionsList = data
          }
        }

        setSessions(sessionsList)
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to fetch sessions"
        setError(message)
        setSessions([])
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const fetchSession = useCallback(async (id: number | null | undefined): Promise<Session | null> => {
    if (!id) {
      setError("Invalid session ID")
      return null
    }

    setIsLoading(true)
    setError(null)
    try {
      const { data } = await api.get<Session>(`/sessions/${id}/`)
      if (!data) {
        setError("Session not found")
        return null
      }
      return data
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to fetch session"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createSession = useCallback(async (input: CreateSessionInput): Promise<Session | null> => {
    if (!input || !input.title || !input.description) {
      setError("Invalid session input")
      return null
    }

    setIsLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("title", input.title)
      formData.append("description", input.description)
      formData.append("price", input.price || "0")
      formData.append("start_time", input.start_time)
      formData.append("end_time", input.end_time)
      formData.append("max_participants", input.max_participants.toString())
      if (input.cover_image) {
        formData.append("cover_image", input.cover_image)
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/sessions/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: formData,
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          response.status,
          errorData.detail || "Failed to create session",
          errorData
        )
      }

      const data = await response.json()
      if (!data || typeof data !== "object") {
        setError("Invalid response from server")
        return null
      }

      return data as Session
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to create session"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateSession = useCallback(
    async (id: number | null | undefined, input: UpdateSessionInput): Promise<Session | null> => {
      if (!id) {
        setError("Invalid session ID")
        return null
      }

      if (!input || Object.keys(input).length === 0) {
        setError("No fields to update")
        return null
      }

      setIsLoading(true)
      setError(null)
      try {
        const { data } = await api.patch<Session>(`/sessions/${id}/`, input)
        if (!data) {
          setError("No data returned from server")
          return null
        }
        return data
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to update session"
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const deleteSession = useCallback(async (id: number | null | undefined): Promise<void> => {
    if (!id) {
      setError("Invalid session ID")
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      await api.delete(`/sessions/${id}/`)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete session"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    sessions,
    isLoading,
    error,
    fetchSessions,
    fetchSession,
    createSession,
    updateSession,
    deleteSession,
  }
}

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMyBookings = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await api.get<any>("/bookings/my/")

      // Handle both paginated and direct array responses
      let bookingsList: Booking[] = []
      if (data && typeof data === "object") {
        if ("results" in data && Array.isArray(data.results)) {
          // Paginated response
          bookingsList = data.results
        } else if (Array.isArray(data)) {
          // Direct array response
          bookingsList = data
        }
      }

      setBookings(bookingsList)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to fetch bookings"
      setError(message)
      setBookings([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchSessionBookings = useCallback(
    async (sessionId: number | null | undefined): Promise<Booking[]> => {
      if (!sessionId) {
        setError("Invalid session ID")
        return []
      }

      setIsLoading(true)
      setError(null)
      try {
        const { data } = await api.get<any>(`/bookings/session/${sessionId}/`)

        // Handle both paginated and direct array responses
        let bookingsList: Booking[] = []
        if (data && typeof data === "object") {
          if ("results" in data && Array.isArray(data.results)) {
            // Paginated response
            bookingsList = data.results
          } else if (Array.isArray(data)) {
            // Direct array response
            bookingsList = data
          }
        }

        return bookingsList
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to fetch bookings"
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const createBooking = useCallback(async (sessionId: number | null | undefined): Promise<Booking | null> => {
    if (!sessionId) {
      setError("Invalid session ID")
      return null
    }

    setIsLoading(true)
    setError(null)
    try {
      const { data } = await api.post<Booking>("/bookings/", { session: sessionId })

      // Validate response
      if (!data || typeof data !== "object") {
        setError("Invalid response from server")
        return null
      }

      // Add to bookings list
      setBookings((prev) => [...prev, data])
      return data
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to create booking"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const confirmBooking = useCallback(async (bookingId: number | null | undefined): Promise<Booking | null> => {
    if (!bookingId) {
      setError("Invalid booking ID")
      return null
    }

    setIsLoading(true)
    setError(null)
    try {
      const { data } = await api.post<Booking>(`/bookings/${bookingId}/confirm/`)

      if (!data || typeof data !== "object") {
        setError("Invalid response from server")
        return null
      }

      setBookings((prev) => prev.map((b) => (b.id === bookingId ? data : b)))
      return data
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to confirm booking"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createPaymentIntent = useCallback(
    async (bookingId: number | null | undefined): Promise<Booking | null> => {
      if (!bookingId) {
        setError("Invalid booking ID")
        return null
      }

      setIsLoading(true)
      setError(null)
      try {
        const { data } = await api.post<Booking>(`/bookings/${bookingId}/pay/`)

        if (!data || typeof data !== "object") {
          setError("Invalid response from server")
          return null
        }

        setBookings((prev) => prev.map((b) => (b.id === bookingId ? data : b)))
        return data
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to create payment intent"
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return {
    bookings,
    isLoading,
    error,
    fetchMyBookings,
    fetchSessionBookings,
    createBooking,
    confirmBooking,
    createPaymentIntent,
  }
}
