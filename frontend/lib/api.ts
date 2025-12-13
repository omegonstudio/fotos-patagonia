"use client"

import { useAuthStore } from "@/lib/store"

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
  const authStore = useAuthStore.getState()
  const hasSession = Boolean(authStore.token)

  if (hasSession && authStore.isTokenExpired(2000)) {
    authStore.logout({ reason: "expired", redirect: false })
    throw new ApiError("La sesión expiró. Iniciá sesión nuevamente.", 401)
  }

  const headers = new Headers(options.headers as HeadersInit)

  if (shouldAttachJsonHeader(options.body, headers)) {
    headers.set("Content-Type", "application/json")
  }

  if (authStore.token) {
    headers.set("Authorization", `Bearer ${authStore.token}`)
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
    if (response.status === 401) {
      if (hasSession) {
        authStore.logout({ reason: "invalid", redirect: false })
      }
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
