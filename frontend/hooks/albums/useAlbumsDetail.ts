"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { AlbumDetail } from "@/lib/types"
import { mapBackendAlbumToDetail } from "@/lib/mappers/albums"

export function useAlbumDetail(albumId?: string) {
  const [data, setData] = useState<AlbumDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!albumId) return

    const fetchAlbum = async () => {
      try {
        setLoading(true)
        const result = await apiFetch<any>(`/albums/${albumId}`)
        setData(mapBackendAlbumToDetail(result))
        setError(null)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAlbum()
  }, [albumId])

  return { album: data, loading, error }
}
