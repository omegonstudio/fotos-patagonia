import type { BackendPhoto, BackendPhotoSession } from "@/hooks/photos/usePhotos"
import type { Photo } from "@/lib/types"

interface PhotoMappingOptions {
  session?: BackendPhotoSession | null
  albumName?: string | null
}

export function mapBackendPhotoToPhoto(photo: BackendPhoto, options?: PhotoMappingOptions): Photo {
  const session = options?.session ?? photo.session

  const albumIdValue =
    options?.session?.album_id ?? session?.album_id ?? null

  const sessionIdValue = options?.session?.id ?? session?.id ?? null
  const photographerName =
    photo.photographer?.name ?? session?.photographer?.name ?? undefined

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
    // urls: {
    //   thumb: photo.watermark_url || photo.url,
    //   web: photo.watermark_url || photo.url,
    //   local: photo.url,
    //   original: photo.url,
    // },
  }
}

