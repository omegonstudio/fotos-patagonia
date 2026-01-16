import { useState, useEffect } from "react"
import { apiFetch } from "@/lib/api"

interface PresignedUrlResponse {
  url: string
}

type UsePresignedUrlOptions = {
  enabled?: boolean
}

const PLACEHOLDER_URL = "/placeholder.svg"
const urlCache = new Map<string, string>()
const pendingCache = new Map<string, Promise<string>>()

export function usePresignedUrl(
  objectName?: string | null,
  options?: UsePresignedUrlOptions
) {
  const enabled = options?.enabled ?? true
  const [url, setUrl] = useState<string>(PLACEHOLDER_URL)
  const [loading, setLoading] = useState<boolean>(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!objectName) {
      setUrl(PLACEHOLDER_URL)
      setLoading(false)
      setError(null)
      return
    }

    if (!enabled) {
      const cachedUrl = urlCache.get(objectName)
      setUrl(cachedUrl ?? PLACEHOLDER_URL)
      setLoading(false)
      setError(null)
      return
    }

    let isCancelled = false

    const cachedUrl = urlCache.get(objectName)
    if (cachedUrl) {
      setUrl(cachedUrl)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const existingPromise = pendingCache.get(objectName)
    const fetchPromise =
      existingPromise ??
      apiFetch<PresignedUrlResponse>(
        `/photos/presigned-url/?object_name=${encodeURIComponent(objectName)}`
      ).then((response) => {
        urlCache.set(objectName, response.url)
        pendingCache.delete(objectName)
        return response.url
      })

    if (!existingPromise) {
      pendingCache.set(objectName, fetchPromise)
    }

    fetchPromise
      .then((fetchedUrl) => {
        if (!isCancelled) {
          setUrl(fetchedUrl)
        }
      })
      .catch((e) => {
        if (!isCancelled) {
          setError("Failed to fetch image URL")
          console.error(e)
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [objectName, enabled])

  return { url, loading, error }
}
