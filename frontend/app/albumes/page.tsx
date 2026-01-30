"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/organisms/header"
import { usePhotographers } from "@/hooks/photographers/usePhotographers"
import Link from "next/link"
import { Camera, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AlbumCard } from "@/components/molecules/album-card"
import { parseUtcNaiveDate } from "@/lib/datetime"
import { FilterBarAlbum } from "@/components/molecules/filter-bar-albums"
import { useAlbumsList } from "@/hooks/albums/useAlbumsList"

export default function AlbumesPage({ main }: { main?: boolean }) {
  const {
    albums,
    loading,
    fetching,
    error,
    refetch,
  } = useAlbumsList()

  const { photographers, loading: photographersLoading } = usePhotographers()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPhotographer, setSelectedPhotographer] = useState<string>("all")
  const [selectedTag, setSelectedTag] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "name">("recent")
  const [visibleCount, setVisibleCount] = useState(8)

  /** Tags únicas */
  const allTags = useMemo(() => {
    const set = new Set<string>()
    albums.forEach((album) => {
      album.tags.forEach((tag) => set.add(tag))
    })
    return Array.from(set).sort()
  }, [albums])

  const toMillis = (value?: string | null) =>
    parseUtcNaiveDate(value)?.getTime() ?? 0

  /** Filtros + orden */
  const filteredAlbums = useMemo(() => {
    let filtered = [...albums]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (album) =>
          album.name.toLowerCase().includes(q) ||
          album.event?.toLowerCase().includes(q) ||
          album.location?.toLowerCase().includes(q),
      )
    }

    if (selectedPhotographer !== "all") {
      filtered = filtered.filter(
        (album) => album.photographerId === Number(selectedPhotographer),
      )
    }

    if (selectedTag !== "all") {
      filtered = filtered.filter((album) =>
        album.tags.includes(selectedTag),
      )
    }

    filtered.sort((a, b) => {
      if (sortBy === "recent") return toMillis(b.createdAt) - toMillis(a.createdAt)
      if (sortBy === "oldest") return toMillis(a.createdAt) - toMillis(b.createdAt)
      return a.name.localeCompare(b.name)
    })

    return filtered
  }, [albums, searchQuery, selectedPhotographer, selectedTag, sortBy])

  // Resetear el paginado visual al cambiar filtros/orden.
  useEffect(() => {
    setVisibleCount(8)
  }, [searchQuery, selectedPhotographer, selectedTag, sortBy])

  /** Loading inicial */
  if (loading || photographersLoading) {
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

  /** Error */
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        {!main && <Header />}
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-lg text-destructive mb-4">
              Error al cargar los álbumes
            </p>
            <Button onClick={refetch}>Reintentar</Button>
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
        <FilterBarAlbum
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          selectedPhotographer={selectedPhotographer}
          onSelectedPhotographerChange={setSelectedPhotographer}
          photographers={photographers}
          selectedTag={selectedTag}
          onSelectedTagChange={setSelectedTag}
          allTags={allTags}
          sortBy={sortBy}
          onSortByChange={setSortBy}
        />

        {fetching && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

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
            {filteredAlbums.slice(0, visibleCount).map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}

        {filteredAlbums.length > visibleCount && (
          <div className="mt-10 flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVisibleCount((prev) => prev + 4)}
              className="rounded-xl"
            >
              Ver más
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
