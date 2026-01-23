import type { BackendPhoto, BackendPhotoSession } from "@/hooks/photos/usePhotos"
import type { Photo } from "@/lib/types"
import { buildThumbObjectName } from "@/lib/photo-thumbnails"

interface PhotoMappingOptions {
  session?: BackendPhotoSession | null
  albumName?: string | null
}

export function mapBackendPhotoToPhoto(
  photo: BackendPhoto,
  options?: PhotoMappingOptions
): Photo {
  const safePhoto = normalizeNullable(photo)

  const session = options?.session ?? safePhoto.session

  const albumIdValue =
    options?.session?.album_id ?? session?.album_id ?? null

  const sessionIdValue =
    options?.session?.id ?? session?.id ?? null

  const photographerName =
    safePhoto.photographer?.name ??
    session?.photographer?.name ??
    undefined

  const thumbnailObjectName =
    safePhoto.thumbnail_object_name ??
    buildThumbObjectName(safePhoto.object_name)

  return {
    id: String(safePhoto.id),
    albumId:
      albumIdValue !== null && albumIdValue !== undefined
        ? String(albumIdValue)
        : undefined,
    albumName: options?.albumName ?? session?.event_name ?? undefined,
    photographerId: safePhoto.photographer_id
      ? String(safePhoto.photographer_id)
      : undefined,
    photographerName,
    sessionId:
      sessionIdValue !== null && sessionIdValue !== undefined
        ? String(sessionIdValue)
        : undefined,
    takenAt: session?.event_date ?? undefined,
    place: session?.location ?? undefined,
    price: safePhoto.price,
    description: safePhoto.description,
    tags: safePhoto.tags?.map((tag) => tag.name) ?? [],
    objectName: safePhoto.object_name,
    thumbnailObjectName,
    previewObjectName: thumbnailObjectName,
  }
}


function normalizeNullable<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === null ? undefined : v])
  ) as T
}

