"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/organisms/header"
import { useAlbums } from "@/hooks/albums/useAlbums"
import { usePhotographers } from "@/hooks/photographers/usePhotographers"
import Link from "next/link"
import { Calendar, MapPin, Camera, Search, ArrowLeft, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

import { AlbumCard } from "@/components/molecules/album-card";
import { parseUtcNaiveDate } from "@/lib/datetime";

interface AlbumWithDetails {
  id: number;
  name: string;
  description?: string | null;
  sessions: any[];
  photoCount: number;
  coverPhotoObjectName?: string; // <-- Cambio de nombre
  location?: string;
  event?: string;
  photographerName?: string;
  photographerId?: number;
  createdAt?: string;
}

export default function AlbumesPage({ main }: { main?: boolean }) {
  const { data: albumsData, loading: albumsLoading, error: albumsError, refetch: refetchAlbums } = useAlbums();
  const { photographers, loading: photographersLoading } = usePhotographers();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhotographer, setSelectedPhotographer] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "name">("recent");

  // Transform backend albums to include details from sessions
  const albums = useMemo(() => {
    if (!Array.isArray(albumsData)) return [];
    
    return albumsData.map((album): AlbumWithDetails => {
      const firstSession = album.sessions?.[0];
      const photoCount = album.sessions?.reduce((total: number, session: any) => 
        total + (session.photos?.length || 0), 0
      ) || 0;
      
      return {
        id: album.id,
        name: album.name,
        description: album.description,
        sessions: album.sessions || [],
        photoCount,
        coverPhotoObjectName: firstSession?.photos?.[0]?.object_name || undefined, // <-- Cambio clave
        location: firstSession?.location,
        event: firstSession?.event_name,
        photographerName: firstSession?.photographer?.name,
        photographerId: firstSession?.photographer_id,
        createdAt: firstSession?.event_date || new Date().toISOString(),
      };
    });
  }, [albumsData]);

  const toMillis = (value?: string | null) => parseUtcNaiveDate(value)?.getTime() ?? 0;

  // Filter and sort albums
  const filteredAlbums = useMemo(() => {
    let filtered = albums.filter((album) => album.photoCount >= 0) // Solo mostrar álbumes con fotos 

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (album) =>
          album.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          album.event?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          album.location?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Photographer filter
    if (selectedPhotographer !== "all") {
      filtered = filtered.filter((album) => album.photographerId === parseInt(selectedPhotographer))
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "recent") {
        return toMillis(b.createdAt) - toMillis(a.createdAt)
      } else if (sortBy === "oldest") {
        return toMillis(a.createdAt) - toMillis(b.createdAt)
      } else {
        return a.name.localeCompare(b.name)
      }
    })

    return filtered
  }, [albums, searchQuery, selectedPhotographer, sortBy])

  // Loading state
  if (albumsLoading || photographersLoading) {
    return (
      <div className="min-h-screen bg-background">
        {main ? null : <Header />}
        <main className="container mx-auto px-4 py-8">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg text-muted-foreground">Cargando álbumes...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (albumsError) {
    return (
      <div className="min-h-screen bg-background">
        {main ? null : <Header />}
        <main className="container mx-auto px-4 py-8">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <p className="text-lg text-destructive mb-4">Error al cargar los álbumes</p>
              <p className="text-sm text-muted-foreground mb-4">{albumsError}</p>
              <Button onClick={refetchAlbums}>Reintentar</Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {main ? null : <Header />}

      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-heading md:text-5xl">¿Dónde te tomaron la foto?</h1>
          <p className="text-lg text-muted-foreground">
            Busca el álbum por lugar o evento
          </p>
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>

        {/* Filters Section */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar álbumes, eventos o lugares..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-gray-200"
            />
          </div>

          <div className="flex gap-3">
            <Select value={selectedPhotographer} onValueChange={setSelectedPhotographer}>
              <SelectTrigger className="w-[180px] rounded-xl border-gray-200">
                <SelectValue placeholder="Fotógrafo" />
              </SelectTrigger>
              <SelectContent className="bg-[#f2f2e4]">
                <SelectItem value="all">Todos</SelectItem>
                {photographers.map((photographer) => (
                  <SelectItem key={photographer.id} value={String(photographer.id)}>
                    {photographer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px] rounded-xl border-gray-200">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent className="bg-[#f2f2e4]">
                <SelectItem value="recent">Más recientes</SelectItem>
                <SelectItem value="oldest">Más antiguos</SelectItem>
                <SelectItem value="name">Nombre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Albums Grid */}
        {filteredAlbums.length === 0 ? (
          <div className="py-20 text-center">
            <Camera className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-2">
              {searchQuery || selectedPhotographer !== "all" 
                ? "No se encontraron álbumes con esos filtros" 
                : "No hay álbumes disponibles"}
            </p>
            {(searchQuery || selectedPhotographer !== "all") && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("")
                  setSelectedPhotographer("all")
                }}
                className="mt-4"
              >
                Limpiar filtros
              </Button>
            )}
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


