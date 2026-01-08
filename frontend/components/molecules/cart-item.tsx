"use client"

import { useEffect, useState } from "react"
import { Heart, Trash2, Printer, ImageIcon } from "lucide-react"
import type { Photo, PrintFormat } from "@/lib/types"
import { IconButton } from "@/components/atoms/icon-button"
import { cn } from "@/lib/utils"
import WatermarkedImage from "@/components/organisms/WatermarkedImage"
import { Badge } from "@/components/ui/badge"
import { usePresignedUrl } from "@/hooks/photos/usePresignedUrl"
import { buildThumbObjectName } from "@/lib/photo-thumbnails"

interface CartItemProps {
  photo: Photo
  isFavorite: boolean
  isPrinter: boolean
  printFormat?: PrintFormat
  onToggleFavorite: () => void
  onTogglePrinter: () => void
  onRemove: () => void
  onPreview?: () => void
}

export function CartItem({
  photo,
  isFavorite,
  isPrinter,
  printFormat,
  onToggleFavorite,
  onTogglePrinter,
  onRemove,
  onPreview,
}: CartItemProps) {
  const previewObjectName =
    photo.previewObjectName ?? buildThumbObjectName(photo.objectName)
  const { url: imageUrl, loading: imageLoading, error: imageError } =
    usePresignedUrl(previewObjectName)
  const [imageRatio, setImageRatio] = useState<number | null>(null)

  useEffect(() => {
    if (!imageUrl) return

    const img = new Image()
    img.src = imageUrl
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setImageRatio(img.naturalWidth / img.naturalHeight)
      }
    }
  }, [imageUrl])

  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
      {/* Imagen */}
      <div
  className={cn(
    "relative w-full overflow-hidden rounded-xl bg-muted",
    onPreview && "cursor-zoom-in"
  )}
  style={{ aspectRatio: "3 / 2" }}   // 👈 ratio consistente
  onClick={onPreview}
>
  {imageLoading ? (
    <div className="flex h-full w-full animate-pulse items-center justify-center bg-gray-200">
      <ImageIcon className="h-10 w-10 text-gray-400" />
    </div>
  ) : imageError || !imageUrl ? (
    <div className="flex h-full w-full items-center justify-center bg-red-100 text-xs text-red-500">
      Error al cargar
    </div>
  ) : (
    <WatermarkedImage
      src={imageUrl}
      alt={`Foto de ${photo.place || "Patagonia"}`}
      fill
      objectFit="cover"
      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
      priority={false}
    />
  )}
        
        {/* Badge de formato si está para imprimir */}
        {isPrinter && printFormat && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-primary/90 text-foreground text-xs">
              {printFormat.size}
            </Badge>
          </div>
        )}
      </div>

      {/* Footer con íconos */}
      <div className="flex flex-col gap-2 p-3">
        <div className="text-xs text-muted-foreground flex items-center justify-between">
          <span>Digital</span>
          <span className="font-semibold text-foreground">${photo.price ?? 0}</span>
        </div>
        {/* Info del formato si está seleccionado */}
        {isPrinter && printFormat && (
          <div className="text-xs text-muted-foreground">
            <div className="flex justify-between items-center">
              <span className="font-medium">{printFormat.name}</span>
              <span className="font-semibold text-primary">${printFormat.price}</span>
            </div>
          </div>
        )}
        
        {/* Botones de acción */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <IconButton
              icon={Heart}
              onClick={onToggleFavorite}
              className={cn(isFavorite && "text-primary hover:text-primary")}
              ariaLabel={isFavorite ? "Quitar de favoritos" : "Marcar como favorito"}
            />
            <IconButton
              icon={Printer}
              onClick={onTogglePrinter}
              className={cn(isPrinter && "text-secondary hover:text-secondary/80")}
              ariaLabel={isPrinter ? "Quitar de impresión" : "Marcar para imprimir"}
            />
          </div>
          <IconButton
            icon={Trash2}
            onClick={onRemove}
            className="text-destructive hover:text-destructive/80"
            ariaLabel="Eliminar del carrito"
          />
        </div>
      </div>
    </div>
  )
}
