"use client"

import { useEffect, useState } from "react"
import { Heart, Trash2, Printer, ImageIcon, Pencil, MoreVertical } from "lucide-react"
import type { Photo, PrintFormat } from "@/lib/types"
import { IconButton } from "@/components/atoms/icon-button"
import { cn } from "@/lib/utils"
import WatermarkedImage from "@/components/organisms/WatermarkedImage"
import { Badge } from "@/components/ui/badge"
import { usePresignedUrl } from "@/hooks/photos/usePresignedUrl"
import { buildThumbObjectName } from "@/lib/photo-thumbnails"
import { memo } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CartItemProps {
  photo: Photo
  isFavorite: boolean
  isPrinter: boolean
  printFormat?: PrintFormat
  onToggleFavorite: () => void
  onTogglePrinter: () => void
  onRemove: () => void
  onPreview?: () => void
  onEditPrintFormat?: () => void
  isStaffUser: boolean
}

function CartItemComponent({
  photo,
  isFavorite,
  isPrinter,
  printFormat,
  onEditPrintFormat,
  onToggleFavorite,
  onTogglePrinter,
  onRemove,
  onPreview,
  isStaffUser,
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
<WatermarkedImage
  src={imageUrl || "/placeholder.svg"}
  alt={`Foto de ${photo.place || "Patagonia"}`}
  fill
  objectFit="cover"
  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
  priority={false}
/>

{imageLoading && (
  <div className="absolute inset-0 flex items-center justify-center bg-gray-200/60">
    <ImageIcon className="h-10 w-10 text-gray-400" />
  </div>
)}

{imageError && (
  <div className="absolute inset-0 flex items-center justify-center bg-red-100 text-xs text-red-500">
    Error al cargar
  </div>
)}

        
        {/* Badge de formato si está para imprimir */}
        {isStaffUser && isPrinter && printFormat && (
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
          <span> Foto Digital</span>
          <span className="font-semibold text-foreground">${photo.price ?? 0}</span>
        </div>
        {/* Info del formato si está seleccionado */}

        {isStaffUser && isPrinter && printFormat && (
          <button
            type="button"
            onClick={onEditPrintFormat}
            className={cn(
              "text-left text-xs text-muted-foreground rounded-lg px-2 py-1 -mx-2",
              "hover:bg-muted/60 transition",
              onEditPrintFormat ? "cursor-pointer" : "cursor-default",
            )}
            aria-label="Editar formato de impresión"
            disabled={!onEditPrintFormat}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium inline-flex items-center gap-1">
                {printFormat.name}
                <Pencil className="h-3.5 w-3.5 opacity-70" />
              </span>
              <span className="font-semibold text-primary">${printFormat.price}</span>
            </div>
          </button>
        )}
        
        {/* Botones de acción */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
          <IconButton
            icon={Heart}
            onClick={onToggleFavorite}
            ariaLabel={isFavorite ? "Quitar de favoritos" : "Marcar como favorito"}
            aria-pressed={isFavorite}
            iconProps={isFavorite ? { fill: "currentColor" } : undefined}
            className={cn(
              "transition-all",
              isFavorite
                ? "text-primary scale-110"
                : "text-muted-foreground hover:text-primary"
            )}
          />

            {isStaffUser && (
              <IconButton
                icon={Printer}
                onClick={onTogglePrinter}
                className={cn(
                  "transition-colors",
                  isPrinter && "text-secondary hover:text-secondary/80"
                )}
                ariaLabel={isPrinter ? "Quitar de impresión" : "Marcar para imprimir"}
                aria-pressed={isPrinter}
              />
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton icon={MoreVertical} ariaLabel="Más acciones" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive bg"
                onClick={onRemove}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar del carrito
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

export const CartItem = memo(
  CartItemComponent,
  (prev, next) =>
    prev.photo === next.photo &&
    prev.isFavorite === next.isFavorite &&
    prev.isPrinter === next.isPrinter &&
    prev.printFormat === next.printFormat
)
