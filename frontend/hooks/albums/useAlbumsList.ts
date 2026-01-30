"use client"

import { useEffect, useRef, useState } from "react"
import { apiFetch } from "@/lib/api"
import { AlbumListItem } from "@/lib/types"
import { mapBackendAlbumToListItem } from "@/lib/mappers/albums"

export function useAlbumsList() {
  const [data, setData] = useState<AlbumListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cacheRef = useRef<AlbumListItem[] | null>(null)

  const fetchAlbums = async () => {
    try {
      if (!cacheRef.current) {
        setLoading(true)
      } else {
        setFetching(true)
        setData(cacheRef.current)
      }

      const result = await apiFetch<any[]>("/albums/")
      const mapped = result.map(mapBackendAlbumToListItem)

      cacheRef.current = mapped
      setData(mapped)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchAlbums()
  }, [])

  return {
    albums: data,
    loading,
    fetching,
    error,
    refetch: fetchAlbums,
  }
}
