import type { User } from "./types"

export const AUTH_STORAGE_KEY = "fp-auth-storage"
export const LEGACY_TOKEN_KEY = "access_token"

export type StoredAuthSnapshot = {
  token: string | null
  expiresAt: number | null
  user: User | null
}

type JwtPayload = {
  exp?: number
  [key: string]: unknown
}

const normalizeBase64 = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padding = normalized.length % 4
  if (padding === 0) {
    return normalized
  }
  return normalized.padEnd(normalized.length + (4 - padding), "=")
}

const decodeBase64 = (value: string): string | null => {
  try {
    if (typeof window === "undefined" || typeof window.atob !== "function") {
      return null
    }
    return window.atob(value)
  } catch {
    return null
  }
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".")
    if (!payload) return null
    const decoded = decodeBase64(normalizeBase64(payload))
    if (!decoded) return null
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function getTokenExpiration(token: string): number | null {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return null
  return payload.exp * 1000
}

export function isTimestampExpired(expiresAt: number | null, offsetMs = 0): boolean {
  if (!expiresAt) return true
  return expiresAt - offsetMs <= Date.now()
}

// Período de gracia para evitar expiraciones falsas tras sleep.
export const EXPIRATION_GRACE_MS = 60_000

export function readStoredAuthSnapshot(): StoredAuthSnapshot | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredAuthSnapshot) : null
  } catch {
    return null
  }
}

export function writeStoredAuthSnapshot(snapshot: StoredAuthSnapshot | null) {
  if (typeof window === "undefined") return
  if (!snapshot || (!snapshot.token && !snapshot.user)) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(snapshot))
}

