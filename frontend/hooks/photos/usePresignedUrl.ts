import { useState, useEffect } from "react"
import { apiFetch } from "@/lib/api"

interface PresignedUrlResponse {
  url: string
  expiresAt?: string
  ttlSeconds?: number
}

const PLACEHOLDER_URL = "/placeholder.svg"
const DEFAULT_TTL_MS = 10 * 60 * 1000

type CacheEntry = { url: string; expiresAt?: number }

const getGlobalMap = <T,>(key: string, factory: () => Map<string, T>) => {
  if (typeof globalThis === "undefined") return factory()
  const g = globalThis as Record<string, unknown>
  if (!g[key]) g[key] = factory()
  return g[key] as Map<string, T>
}

const urlCache = getGlobalMap<CacheEntry>("__presignedUrlCache", () => new Map())
const pendingCache = getGlobalMap<Promise<CacheEntry>>(
  "__presignedPendingCache",
  () => new Map()
)

const isEntryValid = (entry?: CacheEntry | null) => {
  if (!entry) return false
  if (!entry.expiresAt) return true
  return entry.expiresAt - Date.now() > 5_000
}

export function usePresignedUrl(objectName?: string | null, options?: { enabled?: boolean }) {
  const { enabled = true } = options ?? {}

  const cachedEntry = objectName ? urlCache.get(objectName) : undefined
  const cachedInitialUrl =
    objectName && cachedEntry?.url ? cachedEntry.url : PLACEHOLDER_URL

  const [url, setUrl] = useState<string>(cachedInitialUrl)
  const [loading, setLoading] = useState<boolean>(
    !!objectName && !isEntryValid(cachedEntry)
  )

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!objectName || !enabled) {
      setLoading(false)
      setError(null)
      return
    }

    const cached = urlCache.get(objectName)
    if (isEntryValid(cached)) {
      setUrl(cached!.url)
      setLoading(false)
      return
    } else if (cached) {
      urlCache.delete(objectName)
    }

    let cancelled = false
    setLoading(true)

    const request =
      pendingCache.get(objectName) ??
      apiFetch<PresignedUrlResponse>(
        `/photos/presigned-url/?object_name=${encodeURIComponent(objectName)}`
      ).then((res) => {
        const expiresAt = res.expiresAt
          ? new Date(res.expiresAt).getTime()
          : Date.now() + (res.ttlSeconds ?? DEFAULT_TTL_MS / 1000) * 1000
        const entry: CacheEntry = { url: res.url, expiresAt }
        urlCache.set(objectName, entry)
        pendingCache.delete(objectName)
        return entry
      })

    pendingCache.set(objectName, request)

    request
      .then((resolvedUrl) => {
        if (!cancelled) setUrl(resolvedUrl.url)
      })
      .catch((e) => {
        if (!cancelled) {
          setError("Failed to fetch image URL")
          console.error(e)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [objectName])

  return { url, loading, error }
}
