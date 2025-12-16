"use client"

import { useMemo, useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/organisms/header"
import { useAlbums } from "@/hooks/albums/useAlbums"
import { PhotoThumbnail } from "@/components/molecules/photo-thumbnail"
import { PhotoViewerModal } from "@/components/organisms/photo-viewer-modal"
import { useCartStore, useLightboxStore, useGalleryStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, MapPin, Camera, User, ShoppingCart, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { FilterBar } from "@/components/molecules/filter-bar"
import { mapBackendPhotoToPhoto } from "@/lib/mappers/photos"
import type { BackendPhoto } from "@/hooks/photos/usePhotos"
import type { Photo } from "@/lib/types"

export default function AlbumDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { data: albumData, loading, error, refetch } = useAlbums(id)
  const [filters, setFilters] = useState<{ date?: string; place?: string; time?: string }>({})

  // Transform backend data
  const album = albumData && !Array.isArray(albumData) ? albumData : null
  
  // Get all photos from all sessions in the album
  const albumPhotos = useMemo(() => {
    if (!album || !album.sessions) return []

    const photos: Photo[] = []
    album.sessions.forEach((session: any) => {
      if (session.photos && Array.isArray(session.photos)) {
        session.photos.forEach((photo: any) => {
          const normalizedPhoto: BackendPhoto = {
            id: photo.id,
            filename: photo.filename || `photo-${photo.id}`,
            description: photo.description,
            price: photo.price,
            url: photo.url,
            watermark_url: photo.watermark_url || photo.watermarked_url || photo.url,
            photographer_id: photo.photographer_id ?? session.photographer_id ?? 0,
            session_id: session.id,
            photographer: photo.photographer ?? session.photographer,
            session: {
              id: session.id,
              album_id: session.album_id ?? (album.id ? Number(album.id) : undefined),
              event_date: session.event_date,
              event_name: session.event_name,
              location: session.location,
              photographer_id: session.photographer_id,
              photographer: session.photographer,
            },
            tags: photo.tags,
          }

          photos.push(
            mapBackendPhotoToPhoto(normalizedPhoto, {
              session: normalizedPhoto.session,
              albumName: album.name,
            }),
          )
        })
      }
    })

    return photos
  }, [album])

  const filteredPhotos = useMemo(() => {
    const normalizedPlaceFilter = filters.place?.trim().toLowerCase()

    return albumPhotos.filter((photo) => {
      const photoDate = photo.takenAt?.split("T")[0]
      const matchDate = filters.date ? photoDate === filters.date : true

      const photoPlace = photo.place?.toLowerCase() ?? ""
      const matchPlace = normalizedPlaceFilter ? photoPlace.includes(normalizedPlaceFilter) : true

      const matchTime = filters.time ? photo.timeSlot === filters.time : true

      return matchDate && matchPlace && matchTime
    })
  }, [albumPhotos, filters])

  const hasActiveFilters = Boolean(filters.date || filters.place || filters.time)
  const handleFilterChange = (newFilters: { date?: string; place?: string; time?: string }) => {
    setFilters(newFilters)
  }

  const photosToDisplay = filteredPhotos
  
  // Get unique photographers from sessions
  const albumPhotographers = useMemo(() => {
    if (!album || !album.sessions) return []
    const photographers = new Map()
    album.sessions.forEach((session: any) => {
      if (session.photographer) {
        photographers.set(session.photographer.id, session.photographer)
      }
    })
    return Array.from(photographers.values())
  }, [album])

  const { addItem, items, toggleFavorite, togglePrinter } = useCartStore()
  const { selectedPhotos, toggleSelection, clearSelection, setPhotos } = useGalleryStore()
  const { isOpen, currentPhotoId, open, close, next, prev } = useLightboxStore()

  useEffect(() => {
    setPhotos(albumPhotos)
  }, [albumPhotos, setPhotos])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg text-muted-foreground">Cargando álbum...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Error state
  if (error || !album) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <p className="text-lg text-destructive mb-4">
                {error || "Álbum no encontrado"}
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={refetch}>Reintentar</Button>
                <Button variant="outline" asChild>
                  <Link href="/albumes">Volver a Álbumes</Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Get event name and location from first session
  const firstSession = album.sessions?.[0]
  const eventName = firstSession?.event_name
  const location = firstSession?.location
  const eventDate = firstSession?.event_date

  const handlePhotoClick = (photoId: string) => {
    open(photoId, photosToDisplay)
  }

  const handleShiftClick = (photoId: string) => {
    addItem(photoId)
  }

  const currentPhoto = currentPhotoId ? albumPhotos.find((p) => p.id === currentPhotoId) : null

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Button asChild variant="ghost" className="mb-6 rounded-xl hover:bg-[#ffecce]">
          <Link href="/albumes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Álbumes
          </Link>
        </Button>

        <div className="mb-8 rounded-2xl bg-card p-6 shadow-md md:p-8">
          <h1 className="mb-4 text-3xl font-heading md:text-4xl">{album.name}</h1>

          {album.description && <p className="mb-4 text-muted-foreground">{album.description}</p>}
          {eventName && <p className="mb-4 text-lg text-muted-foreground">{eventName}</p>}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            )}
            {eventDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(eventDate).toLocaleDateString("es-AR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
            {/* <div className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span>{albumPhotos.length} fotos</span>
            </div> */}
           {/*  {albumPhotographers.length > 0 && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{albumPhotographers.map((p: any) => p.name).join(", ")}</span>
              </div>
            )} */}
          </div>
        </div>

        <div className="mb-8">
          <FilterBar onFilterChange={handleFilterChange} />
        </div>

        {albumPhotos.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">Este álbum aún no tiene fotos</p>
          </div>
        ) : photosToDisplay.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">
              {hasActiveFilters
                ? "No encontramos fotos que coincidan con los filtros seleccionados."
                : "Este álbum aún no tiene fotos disponibles."}
            </p>
            {hasActiveFilters && (
              <p className="mt-2 text-sm text-muted-foreground">
                Ajusta los filtros o limpia la búsqueda para ver más resultados.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              <p>
                Haz clic en una foto para verla en detalle. Usa Shift+Clic para agregar al carrito o checkboxes para
                selección múltiple. Marca con ❤️ tus favoritas o con 🖨️ las que quieres imprimir.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {photosToDisplay.map((photo) => {
                const cartItem = items.find((item) => item.photoId === photo.id)
                return (
                  <PhotoThumbnail
                    key={photo.id}
                    photo={photo}
                    onClick={() => handlePhotoClick(photo.id)}
                    onShiftClick={() => handleShiftClick(photo.id)}
                    isSelected={selectedPhotos.includes(photo.id)}
                    onToggleSelect={() => toggleSelection(photo.id)}
                    isFavorite={cartItem?.favorite || false}
                    isPrinter={cartItem?.printer || false}
                    onToggleFavorite={() => {
                      if (!cartItem) {
                        addItem(photo.id)
                      }
                      toggleFavorite(photo.id)

                    }}
                    onTogglePrinter={() => {
                      if (!cartItem) {
                        addItem(photo.id)
                      }
                      togglePrinter(photo.id)
                      toggleFavorite(photo.id)

                    }}
                  />
                )
              })}
            </div>
          </>
        )}

        {selectedPhotos.length > 0 && (
          <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 transform">
            <div className="flex items-center gap-3 rounded-full bg-white px-6 py-4 shadow-2xl ring-1 ring-gray-200">
              <span className="text-sm font-semibold">
                {selectedPhotos.length}{" "}
                {selectedPhotos.length === 1 ? "foto seleccionada" : "fotos seleccionadas"}
              </span>
              <Button
                onClick={() => {
                  selectedPhotos.forEach((photoId) => addItem(photoId))
                  clearSelection()
                }}
                className="rounded-full bg-primary hover:bg-primary/90"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Agregar al carrito
              </Button>
              <Button
                onClick={clearSelection}
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {isOpen && currentPhoto && (
        <PhotoViewerModal photo={currentPhoto} onClose={close} onNext={next} onPrev={prev} />
      )}
    </div>
  )
}
