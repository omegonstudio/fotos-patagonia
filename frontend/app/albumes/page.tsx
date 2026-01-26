"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/organisms/header"
import { useAlbums } from "@/hooks/albums/useAlbums"
import { usePhotographers } from "@/hooks/photographers/usePhotographers"
import Link from "next/link"
import { Camera, Search, ArrowLeft, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { AlbumCard } from "@/components/molecules/album-card"
import { parseUtcNaiveDate } from "@/lib/datetime"

interface AlbumWithDetails {
  id: number
  name: string
  description?: string | null
  sessions: any[]
  photoCount: number
  coverPhotoObjectName?: string
  location?: string
  event?: string
  photographerName?: string
  photographerId?: number
  createdAt?: string
  tags: string[]
}

export default function AlbumesPage({ main }: { main?: boolean }) {
  const {
    data: albumsData,
    loading: albumsLoading,
    error: albumsError,
    refetch: refetchAlbums,
  } = useAlbums()

  const { photographers, loading: photographersLoading } = usePhotographers()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPhotographer, setSelectedPhotographer] = useState<string>("all")
  const [selectedTag, setSelectedTag] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "name">("recent")

  /**
   * Normalizamos los álbumes
   */
  const albums = useMemo<AlbumWithDetails[]>(() => {
    if (!Array.isArray(albumsData)) return []

    return albumsData.map((album: any) => {
      const firstSession = album.sessions?.[0]

      const photoCount =
        album.sessions?.reduce(
          (total: number, session: any) =>
            total + (session.photos?.length || 0),
          0,
        ) || 0

      // Tags: soporta album.tags o session.tags
      const tags: string[] = Array.from(
        new Set<string>(
          (
            album.tags?.map((t: any) => String(t.name ?? t)) ??
            album.sessions?.flatMap(
              (s: any) => s.tags?.map((t: any) => String(t.name ?? t)) ?? [],
            ) ??
            []
          ).filter(Boolean)
        )
      )
      

      return {
        id: album.id,
        name: album.name,
        description: album.description,
        sessions: album.sessions || [],
        photoCount,
        coverPhotoObjectName: firstSession?.photos?.[0]?.object_name,
        location: firstSession?.location,
        event: firstSession?.event_name,
        photographerName: firstSession?.photographer?.name,
        photographerId: firstSession?.photographer_id,
        createdAt: firstSession?.event_date || new Date().toISOString(),
        tags,
      }
    })
  }, [albumsData])

  /**
   * Lista única de tags para el select
   */
  const allTags = useMemo(() => {
    const set = new Set<string>()
    albums.forEach((album) => {
      album.tags.forEach((tag) => set.add(tag))
    })
    return Array.from(set).sort()
  }, [albums])

  const toMillis = (value?: string | null) =>
    parseUtcNaiveDate(value)?.getTime() ?? 0

  /**
   * Filtros + orden
   */
  const filteredAlbums = useMemo(() => {
    let filtered = albums.filter((album) => album.photoCount > 0)

    // Texto
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (album) =>
          album.name.toLowerCase().includes(q) ||
          album.event?.toLowerCase().includes(q) ||
          album.location?.toLowerCase().includes(q),
      )
    }

    // Fotógrafo
    if (selectedPhotographer !== "all") {
      filtered = filtered.filter(
        (album) => album.photographerId === Number(selectedPhotographer),
      )
    }

    // Tag
    if (selectedTag !== "all") {
      filtered = filtered.filter((album) =>
        album.tags.includes(selectedTag),
      )
    }

    // Orden
    filtered.sort((a, b) => {
      if (sortBy === "recent") return toMillis(b.createdAt) - toMillis(a.createdAt)
      if (sortBy === "oldest") return toMillis(a.createdAt) - toMillis(b.createdAt)
      return a.name.localeCompare(b.name)
    })

    return filtered
  }, [albums, searchQuery, selectedPhotographer, selectedTag, sortBy])

  /**
   * Loading
   */
  if (albumsLoading || photographersLoading) {
    return (
      <div className="min-h-screen bg-background">
        {!main && <Header />}
        <main className="container mx-auto px-4 py-8">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg text-muted-foreground">
                Cargando álbumes...
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  /**
   * Error
   */
  if (albumsError) {
    return (
      <div className="min-h-screen bg-background">
        {!main && <Header />}
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-lg text-destructive mb-4">
              Error al cargar los álbumes
            </p>
            <Button onClick={refetchAlbums}>Reintentar</Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {!main && <Header />}

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-heading md:text-5xl">
            ¿Dónde te tomaron la foto?
          </h1>
          <p className="text-lg text-muted-foreground">
            Busca el álbum por lugar, evento o tag
          </p>
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>

        {/* Filtros */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar álbumes, eventos o lugares..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-gray-200"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            {/* Fotógrafo */}
            <Select
              value={selectedPhotographer}
              onValueChange={setSelectedPhotographer}
            >
              <SelectTrigger className="w-[180px] rounded-xl border-gray-200">
                <SelectValue placeholder="Fotógrafo" />
              </SelectTrigger>
              <SelectContent className="bg-[#f2f2e4]">
                <SelectItem value="all">Todos los fotógrafos</SelectItem>
                {photographers.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tags */}
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-[180px] rounded-xl border-gray-200">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent className="bg-[#f2f2e4]">
                <SelectItem value="all">Todos los tags</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Orden */}
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[180px] rounded-xl border-gray-200">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent className="bg-[#f2f2e4]">
                <SelectItem value="recent">Más recientes</SelectItem>
                <SelectItem value="oldest">Más antiguos</SelectItem>
                <SelectItem value="name">Nombre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid */}
        {filteredAlbums.length === 0 ? (
          <div className="py-20 text-center">
            <Camera className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-2">
              No se encontraron álbumes con esos filtros
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setSelectedPhotographer("all")
                setSelectedTag("all")
              }}
              className="mt-4"
            >
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAlbums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
