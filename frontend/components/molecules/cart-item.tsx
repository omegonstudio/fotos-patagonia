"use client"

import { Heart, Trash2, Printer } from "lucide-react"
import type { Photo, PrintFormat } from "@/lib/types"
import { IconButton } from "@/components/atoms/icon-button"
import { cn } from "@/lib/utils"
import WatermarkedImage from "@/components/organisms/WatermarkedImage"
import { Badge } from "@/components/ui/badge"

interface CartItemProps {
  photo: Photo
  isFavorite: boolean
  isPrinter: boolean
  printFormat?: PrintFormat
  onToggleFavorite: () => void
  onTogglePrinter: () => void
  onRemove: () => void
}

export function CartItem({
  photo,
  isFavorite,
  isPrinter,
  printFormat,
  onToggleFavorite,
  onTogglePrinter,
  onRemove,
}: CartItemProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
      {/* Imagen */}
      <div className="relative w-full aspect-square">
        <WatermarkedImage
          src={photo.urls.thumb || "/placeholder.svg"}
          alt={`Foto de ${photo.place || "Patagonia"}`}
          fill
          objectFit="cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          priority={false}
        />
        
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
