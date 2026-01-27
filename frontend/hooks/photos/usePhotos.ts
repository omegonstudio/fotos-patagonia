"use client";

import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";

export interface BackendPhotoSession {
  id?: number;
  album_id?: number | null;
  event_name?: string | null;
  event_date?: string | null;
  location?: string | null;
  photographer_id?: number | null;
  photographer?: {
    id?: number;
    name?: string | null;
  } | null;
}

export interface BackendPhoto {
  id: number;
  album_id?: number | null;
  filename: string;
  description?: string;
  price: number;
  // url: string;
  // watermark_url?: string;
  object_name: string;
  thumbnail_object_name?: string;
  photographer_id: number;
  session_id: number;
  photographer?: {
    id: number;
    name: string;
    contact_info?: string;
    commission_percentage?: number;
  };
  session?: BackendPhotoSession | null;
  tags?: Array<{
    id: number;
    name: string;
  }>;
}

export function usePhotos() {
  const [photos, setPhotos] = useState<BackendPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<BackendPhoto[]>("/photos/");
      setPhotos(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching photos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPhotosByIds = useCallback(async (photoIds: number[]) => {
    if (photoIds.length === 0) {
      setPhotos([]);
      return;
    }
    try {
      setLoading(true);
      const data = await apiFetch<BackendPhoto[]>("/photos/by-ids", {
        method: "POST",
        body: JSON.stringify({ photo_ids: photoIds }),
      });
      setPhotos(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching photos by IDs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPhotosPage = async ({
    offset,
    limit,
  }: {
    offset: number;
    limit: number;
  }): Promise<BackendPhoto[]> => {
    return apiFetch<BackendPhoto[]>(
      `/photos/?offset=${offset}&limit=${limit}`
    );
  };

  const fetchPhotosCursor = async ({
    cursor,
    limit,
  }: {
    cursor?: { createdAt: string; id: number } | null;
    limit: number;
  }): Promise<{
    items: BackendPhoto[];
    nextCursor: { createdAt: string; id: number } | null;
  }> => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor?.createdAt && cursor?.id !== undefined) {
      params.set("cursorCreatedAt", cursor.createdAt);
      params.set("cursorId", String(cursor.id));
    }
    return apiFetch<{
      items: BackendPhoto[];
      nextCursor: { createdAt: string; id: number } | null;
    }>(`/photos/?${params.toString()}`);
  };
  

  const getPhoto = async (photoId: number): Promise<BackendPhoto> => {
    const data = await apiFetch<BackendPhoto>(`/photos/${photoId}`);
    return data;
  };

  const updatePhoto = async (
    photoId: number,
    updates: Partial<BackendPhoto>
  ) => {
    const data = await apiFetch<Partial<BackendPhoto>>(`/photos/${photoId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });

    // Actualizar en la lista local
    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id === photoId ? { ...photo, ...data } : photo
      )
    );

    return data;
  };

  const deletePhoto = async (photoId: number) => {
    await apiFetch(`/photos/${photoId}`, {
      method: "DELETE",
    });

    // Eliminar de la lista local
    setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
  };

  const setPhotoTags = async (photoId: number, tagNames: string[]) => {
    const data = await apiFetch<BackendPhoto>(`/photos/${photoId}/tags`, {
      method: "POST",
      body: JSON.stringify({ tag_names: tagNames }),
    });

    // Actualizar en la lista local
    setPhotos((prev) =>
      prev.map((photo) => (photo.id === photoId ? data : photo))
    );

    return data;
  };

  return {
    photos,
    loading,
    error,
    refetch: fetchPhotos,
    fetchPhotosByIds,
    getPhoto,
    updatePhoto,
    deletePhoto,
    setPhotoTags,
    fetchPhotosPage,
    fetchPhotosCursor,
  };
}
