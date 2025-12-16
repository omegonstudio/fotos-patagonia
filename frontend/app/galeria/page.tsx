"use client"

import { useEffect, useMemo } from "react"
import { Header } from "@/components/organisms/header"
import { FilterBar } from "@/components/molecules/filter-bar"
import { PhotoThumbnail } from "@/components/molecules/photo-thumbnail"
import { PhotoViewerModal } from "@/components/organisms/photo-viewer-modal"
import { usePhotos } from "@/hooks/photos/usePhotos"
import { useCartStore, useLightboxStore, useGalleryStore, useAuthStore } from "@/lib/store"
import { ArrowLeft, Info, ShoppingCart, X, Loader2, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { isAdmin } from "@/lib/types"
import { mapBackendPhotoToPhoto } from "@/lib/mappers/photos"

export default function GaleriaPage() {
  const { photos: backendPhotos, loading, error, refetch } = usePhotos()
  const { addItem, items, toggleFavorite, togglePrinter } = useCartStore()
  const { isOpen, currentPhotoId, photos, open, close, next, prev } = useLightboxStore()
  const { filters, mode, setFilters, setMode, setPhotos, selectedPhotos, toggleSelection, clearSelection } =
    useGalleryStore()
  const { user } = useAuthStore()

  const userIsAdmin = isAdmin(user)

  // Transform backend photos to match expected format
  const galleryPhotos = useMemo(() => {
    return backendPhotos.map((photo) => mapBackendPhotoToPhoto(photo))
  }, [backendPhotos])

  useEffect(() => {
    setPhotos(galleryPhotos)
  }, [galleryPhotos, setPhotos])

  useEffect(() => {
    setMode(userIsAdmin ? "local" : "web")
  }, [setMode, userIsAdmin])

  const filteredPhotos = useMemo(() => {
    return galleryPhotos.filter((photo) => {
      if (filters.date && photo.takenAt && !photo.takenAt.startsWith(filters.date)) return false
      if (filters.place && photo.place && !photo.place.toLowerCase().includes(filters.place.toLowerCase())) return false
      if (filters.time && photo.timeSlot !== filters.time) return false
      return true
    })
  }, [galleryPhotos, filters])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg text-muted-foreground">Cargando galería...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Camera className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg text-destructive mb-4">Error al cargar las fotos</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={refetch}>Reintentar</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handlePhotoClick = (photoId: string) => {
    open(photoId, filteredPhotos)
  }

  const handleShiftClick = (photoId: string) => {
    addItem(photoId)
  }

  const handleBulkAddToCart = () => {
    selectedPhotos.forEach((photoId) => {
      addItem(photoId)
    })
    clearSelection()
  }

  const currentPhoto = currentPhotoId ? filteredPhotos.find((p) => p.id === currentPhotoId) : null

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-heading text-balance">Galería de Fotos</h1>
          <p className="text-muted-foreground text-balance">
            Explora nuestra colección de momentos capturados en la Patagonia
          </p>
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>

        <div className="mb-6 flex items-center gap-2 rounded-xl bg-secondary/50 p-4 text-sm">
          <Info className="h-5 w-5 text-primary" />
          <p>
            <strong>Tip:</strong> Click para ver la foto en detalle • Shift + Click para agregar al carrito • Usa los
            checkboxes para selección múltiple • Marca con ❤️ tus favoritas o con 🖨️ las que quieres imprimir
          </p>
        </div>

        <div className="mb-8">
          <FilterBar onFilterChange={setFilters} />
        </div>

        {galleryPhotos.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-2xl bg-muted">
            <div className="text-center">
              <Camera className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-muted-foreground">No hay fotos disponibles</p>
              <p className="text-sm text-muted-foreground">Las fotos aparecerán aquí cuando se suban</p>
            </div>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-2xl bg-muted">
            <div className="text-center">
              <p className="text-lg font-semibold text-muted-foreground">No se encontraron fotos</p>
              <p className="text-sm text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
              <Button 
                variant="outline" 
                onClick={() => setFilters({})}
                className="mt-4"
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filteredPhotos.map((photo) => {
              const cartItem = items.find((item) => item.photoId === photo.id)
              return (
                <PhotoThumbnail
                  key={photo.id}
                  photo={photo}
                  onClick={() => handlePhotoClick(photo.id)}
                  onShiftClick={() => handleShiftClick(photo.id)}
                  mode={mode}
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
        )}

        {selectedPhotos.length > 0 && (
          <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 transform">
            <div className="flex items-center gap-3 rounded-full bg-white px-6 py-4 shadow-2xl ring-1 ring-gray-200">
              <span className="text-sm font-semibold">
                {selectedPhotos.length} {selectedPhotos.length === 1 ? "foto seleccionada" : "fotos seleccionadas"}
              </span>
              <Button onClick={handleBulkAddToCart} className="rounded-full bg-primary hover:bg-primary/90">
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

        {isOpen && currentPhoto && (
          <PhotoViewerModal photo={currentPhoto} onClose={close} onNext={next} onPrev={prev} mode={mode} />
        )}
      </div>
    </div>
  )
}
