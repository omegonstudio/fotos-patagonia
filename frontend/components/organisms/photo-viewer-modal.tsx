"use client"

import { useEffect } from "react"
import { X, Heart, ShoppingCart, ChevronLeft, ChevronRight, MapPin, Calendar, Clock, Printer, Image as ImageIcon } from "lucide-react"
import type { Photo } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/lib/store"
import WatermarkedImage from "@/components/organisms/WatermarkedImage"
import { usePresignedUrl } from "@/hooks/photos/usePresignedUrl"
import { buildThumbObjectName } from "@/lib/photo-thumbnails"

interface PhotoViewerModalProps {
  photo: Photo
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

export function PhotoViewerModal({ photo, onClose, onNext, onPrev }: PhotoViewerModalProps) {
  const { items, removeItem, toggleSelected, toggleFavorite, togglePrinter } = useCartStore()

  const previewObjectName =
    photo.previewObjectName ?? buildThumbObjectName(photo.objectName)

  const { url: imageUrl, loading: imageLoading, error: imageError } =
    usePresignedUrl(previewObjectName)

  const cartItem = items.find((item) => item.photoId === photo.id)
  const isInCart = !!cartItem
  const isFavorite = cartItem?.favorite || false
  const isPrinter = cartItem?.printer || false

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") onPrev()
      if (e.key === "ArrowRight") onNext()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, onNext, onPrev])

  const handleToggleCart = () => {
    if (isInCart) {
      removeItem(photo.id)
    } else {
      toggleSelected(photo.id)
    }
  }

  const handleToggleFavorite = () => {
    toggleFavorite(photo.id)
  }

  const handleTogglePrinter = () => {
    togglePrinter(photo.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label="Cerrar"
      >
        <X className="h-6 w-6" />
      </button>

      <button
        onClick={onPrev}
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
        aria-label="Foto anterior"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        onClick={onNext}
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
        aria-label="Siguiente foto"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="flex h-full w-full max-w-7xl flex-col gap-4 lg:flex-row">
        <div className="relative flex-1 overflow-hidden rounded-2xl bg-black aspect-[4/3] md:aspect-[3/2] max-h-[80vh]">
          {imageLoading ? (
            <div className="flex h-full w-full animate-pulse items-center justify-center bg-gray-800">
              <ImageIcon className="h-24 w-24 text-gray-600" />
            </div>
          ) : imageError ? (
            <div className="flex h-full w-full items-center justify-center bg-red-900 text-red-300">
              Error al cargar la imagen
            </div>
          ) : (
            <WatermarkedImage
              src={imageUrl}
              alt={`Foto de ${photo.place || "Patagonia"}`}
              fill
              objectFit="contain"
              sizes="(max-width: 1024px) 100vw, 70vw"
              priority
              className="transition-opacity duration-300"
            />
          )}
        </div>

        <div className="flex w-full flex-col gap-4 rounded-2xl bg-card p-6 lg:w-96">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-heading text-white">
                {photo.place || "Patagonia"}
              </h2>
              {photo.price && (
                <Badge className="mt-2 bg-primary text-foreground">
                  ${photo.price}
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleToggleFavorite}
                className={cn(
                  "rounded-full p-2 transition-colors",
                  isFavorite
                    ? "bg-primary text-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
                aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
              >
                <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
              </button>

              <button
                onClick={handleTogglePrinter}
                className={cn(
                  "rounded-full p-2 transition-colors",
                  isPrinter
                    ? "bg-secondary text-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
                aria-label={isPrinter ? "Quitar de impresión" : "Marcar para imprimir"}
              >
                <Printer className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="space-y-3 border-t border-gray-200 pt-4">
            {photo.takenAt && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-white" />
                <span className="text-white">Fecha:</span>
                <span className="font-medium text-white">
                  {new Date(photo.takenAt).toLocaleDateString("es-AR")}
                </span>
              </div>
            )}

            {photo.timeSlot && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-white" />
                <span className="text-white">Hora:</span>
                <span className="font-medium text-white">{photo.timeSlot}</span>
              </div>
            )}

            {photo.place && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-white" />
                <span className="text-white">Album:</span>
                <span className="font-medium text-white">{photo.albumName}</span>
              </div>
            )}
          </div>

          <div className="mt-auto space-y-3 border-t border-gray-200 pt-4">
            <Button
              onClick={handleToggleCart}
              className={cn(
                "w-full rounded-xl font-semibold",
                isInCart
                  ? "bg-muted text-muted-foreground hover:bg-muted/80"
                  : "bg-primary text-foreground hover:bg-primary-hover"
              )}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {isInCart ? "Quitar del carrito" : "Agregar al carrito"}
            </Button>

            <p className="text-center text-xs text-white">
              Disponible en resolución web y alta resolución para descarga
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
