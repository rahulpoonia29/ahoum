import type { ApiErrorResponse } from "./types"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api"

interface ApiOptions extends RequestInit {
  token?: string
}

// Utility to check if localStorage is available
const getLocalStorage = () => {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    return localStorage
  }
  return null
}

export class ApiClient {
  private static instance: ApiClient
  private baseUrl: string
  private token: string | null = null

  private constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.loadToken()
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient(API_BASE_URL)
    }
    return ApiClient.instance
  }

  setToken(token: string | null) {
    this.token = token
    const storage = getLocalStorage()
    if (token && storage) {
      storage.setItem("access_token", token)
    } else if (storage) {
      storage.removeItem("access_token")
      storage.removeItem("refresh_token")
    }
  }

  getToken(): string | null {
    return this.token
  }

  private loadToken() {
    const storage = getLocalStorage()
    if (storage) {
      const token = storage.getItem("access_token")
      if (token) {
        this.token = token
      }
    }
  }

  private getHeaders(options?: ApiOptions): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options?.headers,
    }

    const token = options?.token || this.token
    if (token) {
      // @ts-ignore
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  }

  async request<T>(
    endpoint: string,
    options?: ApiOptions
  ): Promise<{ data: T; status: number }> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = this.getHeaders(options)

    let response: Response
    try {
      response = await fetch(url, {
        ...options,
        headers,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network request failed"
      throw new ApiError(0, message, undefined)
    }

    let data: unknown
    try {
      data = await response.json()
    } catch {
      // Handle non-JSON responses
      data = null
    }

    if (!response.ok) {
      const errorData = data as ApiErrorResponse | null
      const errorMessage =
        errorData?.detail || errorData?.message || errorData?.error || "API Error"

      throw new ApiError(response.status, String(errorMessage), errorData)
    }

    // Ensure data is not null (unless the endpoint intentionally returns null)
    if (data === null && response.status !== 204) {
      throw new ApiError(response.status, "Empty response from server", data)
    }

    return { data: data as T, status: response.status }
  }

  get<T>(endpoint: string, options?: ApiOptions) {
    return this.request<T>(endpoint, { ...options, method: "GET" })
  }

  post<T>(endpoint: string, body?: unknown, options?: ApiOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  patch<T>(endpoint: string, body?: unknown, options?: ApiOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  put<T>(endpoint: string, body?: unknown, options?: ApiOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  delete<T>(endpoint: string, options?: ApiOptions) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" })
  }
}

export class ApiError extends Error {
  public readonly fieldErrors?: Record<string, string[]>

  constructor(
    public status: number,
    message: string,
    public response?: ApiErrorResponse | unknown
  ) {
    super(message)
    this.name = "ApiError"

    // Extract field-level errors if available
    if (typeof response === "object" && response !== null && "errors" in response) {
      this.fieldErrors = (response as ApiErrorResponse).errors
    }
  }

  /**
   * Get a field-specific error message
   */
  getFieldError(fieldName: string): string | null {
    return this.fieldErrors?.[fieldName]?.[0] ?? null
  }

  /**
   * Check if error is from a specific HTTP status
   */
  isStatus(status: number): boolean {
    return this.status === status
  }

  /**
   * Check if this is a validation error (400)
   */
  isValidationError(): boolean {
    return this.status === 400
  }

  /**
   * Check if this is an auth error (401)
   */
  isAuthError(): boolean {
    return this.status === 401
  }

  /**
   * Check if this is a forbidden error (403)
   */
  isForbiddenError(): boolean {
    return this.status === 403
  }

  /**
   * Check if this is a not found error (404)
   */
  isNotFoundError(): boolean {
    return this.status === 404
  }

  /**
   * Check if this is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500
  }
}

export const api = ApiClient.getInstance()
