/**
 * Type definitions for all API responses and domain models
 * Includes discriminated unions, type guards, and branded types
 */

// ============================================================================
// Branded Types for validation
// ============================================================================

/** ISO 8601 date-time string (e.g., "2024-01-15T10:30:00Z") */
export type ISO8601DateTime = string & { readonly __brand: "ISO8601DateTime" }

/** Numeric price string (e.g., "99.99") */
export type PriceString = string & { readonly __brand: "PriceString" }

// ============================================================================
// User Types
// ============================================================================

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

// ============================================================================
// Session Types with Discriminated Union
// ============================================================================

export interface SessionPopulated {
  id: number
  title: string
  description: string
  price: PriceString
  start_time: ISO8601DateTime
  end_time: ISO8601DateTime
  max_participants: number
  cover_image?: string | null
  creator: User
  created_at: ISO8601DateTime
  updated_at: ISO8601DateTime
  participants_count?: number | null
  __populatedType: "full"
}

export interface SessionRef {
  id: number
  __populatedType: "ref"
}

export type Session = SessionPopulated | SessionRef

export interface CreateSessionInput {
  title: string
  description: string
  price: string
  start_time: string
  end_time: string
  max_participants: number
  cover_image?: File
}

export interface UpdateSessionInput {
  title?: string
  description?: string
  price?: string
  start_time?: string
  end_time?: string
  max_participants?: number
  cover_image?: File | null
}

// ============================================================================
// Booking Types with Discriminated Union
// ============================================================================

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED"

export interface BookingPopulated {
  id: number
  session: SessionPopulated
  user: User
  status: BookingStatus
  payment_reference?: string | null
  created_at: ISO8601DateTime
  updated_at?: ISO8601DateTime | null
  __populatedType: "full"
}

export interface BookingRef {
  id: number
  session: SessionRef | number
  user: User | number
  status: BookingStatus
  payment_reference?: string | null
  created_at: ISO8601DateTime
  updated_at?: ISO8601DateTime | null
  __populatedType: "ref"
}

export type Booking = BookingPopulated | BookingRef

export interface CreateBookingInput {
  session: number
}

// ============================================================================
// API Response Types
// ============================================================================

export interface LoginResponse {
  access: string
  refresh: string
  user: User
}

export interface RegisterRequest {
  username: string
  email: string
  first_name: string
  last_name: string
  password: string
  role: "USER" | "CREATOR"
  creator_code?: string
}

export interface RegisterResponse {
  access: string
  refresh: string
  user: User
}

export interface LogoutRequest {
  refresh: string
}

export interface RefreshTokenRequest {
  refresh: string
}

export interface RefreshTokenResponse {
  access: string
}

export interface VerifyTokenRequest {
  token: string
}

export interface VerifyTokenResponse {
  valid: boolean
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface CreatePaymentIntentResponse {
  booking_id: number
  payment_intent_id: string
  client_secret: string
  amount: PriceString
  currency: string
}

// ============================================================================
// API Error Response
// ============================================================================

export interface ApiErrorResponse {
  detail?: string | null
  message?: string | null
  error?: string | null
  errors?: Record<string, string[]>
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a value is a SessionPopulated
 */
export function isSessionPopulated(session: Session | unknown): session is SessionPopulated {
  return (
    typeof session === "object" &&
    session !== null &&
    "title" in session &&
    "description" in session &&
    "creator" in session &&
    typeof (session as any).creator === "object"
  )
}

/**
 * Type guard to check if a value is a SessionRef
 */
export function isSessionRef(session: Session | unknown): session is SessionRef {
  return (
    typeof session === "object" &&
    session !== null &&
    "id" in session &&
    !("title" in session)
  )
}

/**
 * Type guard to check if a value is a BookingPopulated
 */
export function isBookingPopulated(booking: Booking | unknown): booking is BookingPopulated {
  return (
    typeof booking === "object" &&
    booking !== null &&
    "session" in booking &&
    typeof (booking as any).session === "object" &&
    "title" in (booking as any).session &&
    "user" in booking &&
    typeof (booking as any).user === "object" &&
    "username" in (booking as any).user
  )
}

/**
 * Type guard to check if a value is a BookingRef
 */
export function isBookingRef(booking: Booking | unknown): booking is BookingRef {
  return (
    typeof booking === "object" &&
    booking !== null &&
    "id" in booking &&
    !("session" in booking && typeof (booking as any).session === "object" && "title" in (booking as any).session)
  )
}

/**
 * Type guard to check if a session ID is a number (primitive reference)
 */
export function isSessionNumber(session: SessionPopulated | SessionRef | number): session is number {
  return typeof session === "number"
}

/**
 * Type guard to check if a user is fully populated
 */
export function isUserPopulated(user: User | number): user is User {
  return typeof user === "object" && user !== null && "username" in user
}

/**
 * Type guard to check if booking status is valid
 */
export function isValidBookingStatus(status: string): status is BookingStatus {
  return ["PENDING", "CONFIRMED", "CANCELLED"].includes(status)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Safely get the session ID regardless of type
 */
export function getSessionId(session: Session | number): number {
  if (typeof session === "number") {
    return session
  }
  return session.id
}

/**
 * Safely get the user ID regardless of type
 */
export function getUserId(user: User | number): number {
  if (typeof user === "number") {
    return user
  }
  return user.id
}

/**
 * Safely convert price string to number
 */
export function parsePrice(price: PriceString | string): number {
  return parseFloat(typeof price === "string" ? price : "0")
}

/**
 * Format price for display
 */
export function formatPrice(price: PriceString | string | number): string {
  const num = typeof price === "number" ? price : parseFloat(price)
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num)
}

/**
 * Parse ISO 8601 date string safely
 */
export function parseISO8601(dateString: ISO8601DateTime | string): Date | null {
  try {
    return new Date(dateString)
  } catch {
    return null
  }
}

/**
 * Check if date is in the future
 */
export function isFutureDate(dateString: ISO8601DateTime | string): boolean {
  const date = parseISO8601(dateString as ISO8601DateTime)
  return date ? date > new Date() : false
}

/**
 * Get booking status display label
 */
export function getBookingStatusLabel(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    CANCELLED: "Cancelled",
  }
  return labels[status] ?? status
}

/**
 * Get booking status color for UI
 */
export function getBookingStatusColor(status: BookingStatus): string {
  const colors: Record<BookingStatus, string> = {
    PENDING: "yellow",
    CONFIRMED: "green",
    CANCELLED: "red",
  }
  return colors[status] ?? "gray"
}

/**
 * Ensure session is populated (throws if not)
 */
export function ensureSessionPopulated(session: Session): SessionPopulated {
  if (!isSessionPopulated(session)) {
    throw new Error(`Session ${session.id} is not fully populated`)
  }
  return session
}

/**
 * Ensure booking is populated (throws if not)
 */
export function ensureBookingPopulated(booking: Booking): BookingPopulated {
  if (!isBookingPopulated(booking)) {
    throw new Error(`Booking ${booking.id} is not fully populated`)
  }
  return booking
}

/**
 * Safely get full booking data or throw if not populated
 */
export function getPopulatedBooking(booking: Booking): BookingPopulated {
  if (isBookingPopulated(booking)) {
    return booking
  }

  throw new Error(`Booking ${booking.id} is not fully populated. Session type: ${typeof booking.session}, User type: ${typeof booking.user}`)
}

/**
 * Null-safe getter for session creator
 */
export function getSessionCreator(session: Session): User | null {
  if (isSessionPopulated(session)) {
    return session.creator
  }
  return null
}

/**
 * Null-safe getter for session title
 */
export function getSessionTitle(session: Session): string | null {
  if (isSessionPopulated(session)) {
    return session.title
  }
  return null
}

/**
 * Null-safe getter for session price
 */
export function getSessionPrice(session: Session): number | null {
  if (isSessionPopulated(session)) {
    return parsePrice(session.price)
  }
  return null
}
