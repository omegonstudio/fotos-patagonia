"use client"

import { useAuthStore } from "@/lib/store"
import { getTokenExpiration } from "./auth"

export const getApiBaseUrl = () => {
  const isServer = typeof window === "undefined"

  const baseUrl = (
    isServer ? process.env.INTERNAL_API_URL : process.env.NEXT_PUBLIC_API_URL
  )?.replace(/\/$/, "")

  if (!baseUrl) {
    const varName = isServer ? "INTERNAL_API_URL" : "NEXT_PUBLIC_API_URL"
    throw new Error(`${varName} no está configurada`)
  }
  return baseUrl
}

export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.payload = payload
  }
}

const shouldAttachJsonHeader = (body: RequestInit["body"], headers: Headers) => {
  if (headers.has("Content-Type")) return false
  if (typeof FormData !== "undefined" && body instanceof FormData) return false
  return true
}

const parseErrorPayload = async (response: Response) => {
  const contentType = response.headers.get("content-type")
  if (contentType && contentType.includes("application/json")) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }
  return null
}

const normalizePath = (path: string) => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    throw new Error("apiFetch solo acepta rutas relativas. Usa process.env.NEXT_PUBLIC_API_URL")
  }
  if (!path.startsWith("/")) {
    return `/${path}`
  }
  return path
}

const getPayloadDetail = (payload: unknown): string | undefined => {
  if (!payload || typeof payload !== "object") return undefined
  if ("detail" in payload) {
    const value = (payload as Record<string, unknown>).detail
    return typeof value === "string" ? value : undefined
  }
  return undefined
}

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const normalizedPath = normalizePath(path)
  const isRefreshCall = normalizedPath === "/auth/refresh"
  const SOFT_REFRESH_WINDOW_MS = 5_000
  const authStore = useAuthStore.getState()
  const hasSession = Boolean(authStore.token)

  // Compartir una única promesa de refresh para evitar carreras entre requests
  // Nota: mantenemos en este módulo para no cambiar firmas públicas.
  const getRefreshPromise = () => {
    if (!refreshPromise) {
      refreshPromise = performRefresh(baseUrl)
    }
    return refreshPromise
  }

  // Intento proactivo de refresh si está por vencer; no hacemos logout aquí.
  if (hasSession && !isRefreshCall) {
    const expiresAt = authStore.expiresAt ?? null
    if (expiresAt && expiresAt - SOFT_REFRESH_WINDOW_MS <= Date.now()) {
      try {
        await getRefreshPromise()
      } catch {
        // Se manejará en el flujo de request/401
      }
    }
  }

  const doRequest = async (retriedAfterRefresh = false): Promise<T> => {
    const { token } = useAuthStore.getState()
    const headers = new Headers(options.headers as HeadersInit)

    if (shouldAttachJsonHeader(options.body, headers)) {
      headers.set("Content-Type", "application/json")
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }

    let response: Response
    try {
      response = await fetch(`${baseUrl}${normalizedPath}`, {
        ...options,
        headers,
      })
    } catch (error) {
      throw new ApiError("No se pudo conectar con el servidor", 0, error)
    }

    if (response.status === 204) {
      return undefined as T
    }

    const payload = await parseErrorPayload(response)

    if (!response.ok) {
      // Manejo tolerante de 401: intentar una sola vez el refresh y reintentar la request
      if (response.status === 401 && hasSession && !isRefreshCall && !retriedAfterRefresh) {
        try {
          await getRefreshPromise()
          return await doRequest(true)
        } catch (err) {
          // Refresh falló: se mantiene la lógica de logout original
          useAuthStore.getState().logout({ reason: "invalid", redirect: false })
          throw err instanceof ApiError ? err : new ApiError("Sesión inválida o expirada.", 401, payload)
        }
      }

      if (response.status === 401 && hasSession) {
        useAuthStore.getState().logout({ reason: "invalid", redirect: false })
        throw new ApiError("Sesión inválida o expirada.", 401, payload)
      }

      if (response.status === 403) {
        throw new ApiError(getPayloadDetail(payload) || "No tenés permisos para esta acción.", 403, payload)
      }

      const message = getPayloadDetail(payload) || `Error al consultar la API (${response.status})`
      throw new ApiError(message, response.status, payload)
    }

    if (payload === null) {
      // Intentar parsear JSON solo en éxito si aún no se hizo
      try {
        return (await response.json()) as T
      } catch {
        return undefined as T
      }
    }

    return payload as T
  }

  return doRequest(false)
}

// ---- Refresh tolerante a fallos (promesa compartida) ----
let refreshPromise: Promise<{ access_token?: string } | null> | null = null

const performRefresh = async (baseUrl: string): Promise<{ access_token?: string } | null> => {
  const authStore = useAuthStore.getState()
  // Si no hay sesión, no hay nada para refrescar
  if (!authStore.token) return null

  let response: Response
  try {
    response = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      // No agregamos Authorization aquí para permitir flujos con cookies httpOnly
      headers: new Headers({ "Content-Type": "application/json" }),
    })
  } catch (error) {
    throw new ApiError("No se pudo renovar la sesión.", 0, error)
  }

  const payload = await parseErrorPayload(response)

  if (!response.ok) {
    throw new ApiError(getPayloadDetail(payload) || "No se pudo renovar la sesión.", response.status, payload)
  }

  const data = payload ?? (await response.json().catch(() => null))
  const accessToken = (data as Record<string, unknown>)?.access_token

  if (typeof accessToken === "string") {
    const expiresAt = getTokenExpiration(accessToken)
    if (!expiresAt) {
      throw new ApiError("El token renovado no tiene expiración.", 0, data)
    }
    authStore.setToken(accessToken, expiresAt)
  }

  return data as { access_token?: string } | null
}

export async function refreshAccessToken() {
  // Expuesto para reutilizar la misma promesa desde otros módulos (p.ej. useAuth)
  const baseUrl = getApiBaseUrl()
  if (!refreshPromise) {
    refreshPromise = performRefresh(baseUrl)
  }
  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}
