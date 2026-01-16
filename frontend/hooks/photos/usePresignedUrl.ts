import { useState, useEffect } from "react"
import { apiFetch } from "@/lib/api"

interface PresignedUrlResponse {
  url: string
}

export function usePresignedUrl(objectName?: string | null) {
  const [url, setUrl] = useState<string>("/placeholder.svg") // Default to a placeholder
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!objectName) {
      setLoading(false)
      setUrl("/placeholder.svg")
      return
    }

    let isCancelled = false
    setLoading(true)

    const fetchUrl = async () => {
      try {
        const response = await apiFetch<PresignedUrlResponse>(`/photos/presigned-url/?object_name=${encodeURIComponent(objectName)}`)
        if (!isCancelled) {
          setUrl(response.url)
        }
      } catch (e) {
        if (!isCancelled) {
          setError("Failed to fetch image URL")
          console.error(e)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchUrl()

    return () => {
      isCancelled = true
    }
  }, [objectName])

  return { url, loading, error }
}
