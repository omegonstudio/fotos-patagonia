import type { BackendPhoto, BackendPhotoSession } from "@/hooks/photos/usePhotos"
import type { Photo } from "@/lib/types"
import { buildThumbObjectName } from "@/lib/photo-thumbnails"

interface PhotoMappingOptions {
  session?: BackendPhotoSession | null
  albumName?: string | null
}

export function mapBackendPhotoToPhoto(photo: BackendPhoto, options?: PhotoMappingOptions): Photo {
/*   console.log("[DEBUG photo raw]", photo)
  console.log("[DEBUG options raw]", options) */
  
  const session = options?.session ?? photo.session

  const albumIdValue =
  photo.album_id ??
  options?.session?.album_id ??
  session?.album_id ??
  null


  const sessionIdValue = options?.session?.id ?? session?.id ?? null
  const photographerName =
    photo.photographer?.name ?? session?.photographer?.name ?? undefined

  const thumbnailObjectName =
    photo.thumbnail_object_name ?? buildThumbObjectName(photo.object_name)

  return {
    id: String(photo.id),
    albumId: albumIdValue !== null && albumIdValue !== undefined ? String(albumIdValue) : undefined,
    albumName: options?.albumName ?? session?.event_name ?? undefined,
    photographerId: photo.photographer_id ? String(photo.photographer_id) : undefined,
    photographerName,
    sessionId: sessionIdValue !== null && sessionIdValue !== undefined ? String(sessionIdValue) : undefined,
    takenAt: session?.event_date ?? undefined,
    place: session?.location ?? undefined,
    price: photo.price,
    description: photo.description,
    tags: photo.tags?.map((tag) => tag.name) ?? [],
    objectName: photo.object_name,
    thumbnailObjectName,
    previewObjectName: thumbnailObjectName ?? undefined,
    // urls: {
    //   thumb: photo.watermark_url || photo.url,
    //   web: photo.watermark_url || photo.url,
    //   local: photo.url,
    //   original: photo.url,
    // },
  }
}

