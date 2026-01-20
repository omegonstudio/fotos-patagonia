"use client"

import type React from "react"
import { useState } from "react"
import { isAdmin, type Photo } from "@/lib/types"
import { formatPhotoDate } from "@/lib/datetime"
import { cn } from "@/lib/utils"
import { Check, Heart, Printer, Image as ImageIcon } from "lucide-react"
import WatermarkedImage from "@/components/organisms/WatermarkedImage"
import { usePresignedUrl } from "@/hooks/photos/usePresignedUrl"
import { buildThumbObjectName } from "@/lib/photo-thumbnails"
import { useAuthStore } from "@/lib/store"

interface PhotoThumbnailProps {
  photo: Photo
  onClick?: () => void
  onShiftClick?: () => void
  isSelected?: boolean
  onToggleSelect?: () => void
  isFavorite?: boolean
  isPrinter?: boolean
  onToggleFavorite?: () => void
  onTogglePrinter?: () => void
}

export function PhotoThumbnail({
  photo,
  onClick,
  onShiftClick,
  isSelected = false,
  onToggleSelect,
  isFavorite = false,
  isPrinter = false,
  onToggleFavorite,
  onTogglePrinter,
}: PhotoThumbnailProps) {
  const [isHovered, setIsHovered] = useState(false)
  // NOTE: Assuming `photo` object now has an `objectName` property.
  // The Photo type in `lib/types.ts` and the mapper must be updated accordingly.
  const previewObjectName =
    photo.previewObjectName ?? buildThumbObjectName(photo.objectName)
  const { url: imageUrl, loading: imageLoading, error: imageError } = usePresignedUrl(previewObjectName)

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey && onShiftClick) {
      e.preventDefault()
      onShiftClick()
    } else if (onClick) {
      onClick()
    }
  }

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleSelect?.()
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite?.()
  }

  const handlePrinterClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onTogglePrinter?.()
  }

   const { user, isAuthenticated } = useAuthStore()
  
    const isStaffUser = isAuthenticated && user && (isAdmin(user) || user.photographer_id)
  return (
    <div
      className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-muted shadow-md transition-all hover:shadow-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {imageLoading ? (
        <div className="flex h-full w-full animate-pulse items-center justify-center bg-gray-200">
          <ImageIcon className="h-12 w-12 text-gray-400" />
        </div>
      ) : imageError ? (
        <div className="flex h-full w-full items-center justify-center bg-red-100 text-red-500">
          Error
        </div>
      ) : (
        <WatermarkedImage
          src={imageUrl}
          alt={`Foto de ${photo.place || "Patagonia"}`}
          fill
          objectFit="cover"
          className="transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
      )}

      <div className="absolute right-3 top-3 z-10 flex gap-2">
        <div
          className={cn(
            "flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 transition-all",
            isSelected
              ? "border-primary bg-primary shadow-lg"
              : "border-white bg-white/20 backdrop-blur-sm hover:bg-white/40",
          )}
          onClick={handleCheckboxClick}
        >
          {isSelected && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
        </div>
      </div>

      <div className="absolute left-3 top-3 z-10 flex gap-2">
        {onToggleFavorite && (
          <div
            className={cn(
              "flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 transition-all",
              isFavorite
                ? "border-primary bg-primary shadow-lg"
                : "border-white bg-white/20 backdrop-blur-sm hover:bg-white/40",
            )}
            onClick={handleFavoriteClick}
          >
            <Heart className={cn("h-4 w-4", isFavorite ? "fill-white text-white" : "text-white")} strokeWidth={2} />
          </div>
        )}
     {isStaffUser && onTogglePrinter && (
          <div
            className={cn(
              "flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 transition-all",
              isPrinter
                ? "border-secondary bg-secondary shadow-lg"
                : "border-white bg-white/20 backdrop-blur-sm hover:bg-white/40",
            )}
            onClick={handlePrinterClick}
          >
            <Printer
              className={cn("h-4 w-4 text-white")}
              strokeWidth={2}
            />
          </div>
        )}

      </div>

      {/* Overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity",
          isHovered ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 p-3 text-white transition-transform",
          isHovered ? "translate-y-0" : "translate-y-full",
        )}
      >
        {/* {photo.place && <p className="text-sm font-semibold">{photo.place}</p>} */}
        {photo.takenAt && (
  <p className="text-xs opacity-90">{formatPhotoDate(photo.takenAt)}</p>
)}





      </div>
    </div>
  )
}
