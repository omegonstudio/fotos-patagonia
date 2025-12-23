"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  buildThumbObjectName,
  generateThumbnailBlob,
} from "@/lib/photo-thumbnails";
import type { BackendPhoto } from "@/hooks/photos/usePhotos";

interface FileInfo {
  filename: string;
  contentType: string;
  objectName?: string;
}

interface PresignedURLData {
  upload_url: string;
  object_name: string;
  original_filename: string;
}

interface PhotoCompletionData {
  object_name: string;
  original_filename: string;
  description?: string;
  price: number;
  photographer_id: number;
}

interface UploadPhotoParams {
  files: File[];
  photographer_id: number;
  session_id?: number;  // opcional según flujo
  price: number;
  description?: string;
  album_id?: number;
}

// Pass a function to refetch photos after upload
export function usePhotoUpload(refetchPhotos?: () => void) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Normaliza el nombre de archivo de thumbnail para evitar carpetas duplicadas.
  const getThumbFilename = (
    originalObjectName?: string,
    fallbackName?: string
  ): string => {
    const base =
      originalObjectName?.split("/").pop() ??
      fallbackName?.split("/").pop() ??
      "thumbnail.jpg";
    // Garantiza no duplicar el prefijo si ya viene con thumb_
    const sanitized = base.startsWith("thumb_") ? base.slice(6) : base;
    return `thumb_${sanitized}`;
  };

  // ... (requestUploadUrls and uploadToStorage remain the same)
  /**
   * Paso 1: Solicitar URLs presigned para subir archivos
   */
  const requestUploadUrls = async (
    files: File[]
  ): Promise<PresignedURLData[]> => {
    const filesInfo: FileInfo[] = files.map((file) => ({
      filename: file.name,
      contentType: file.type,
    }));

    const response = await apiFetch<{ urls: PresignedURLData[] }>(
      "/request-upload-urls",
      {
        method: "POST",
        body: JSON.stringify({ files: filesInfo }),
      }
    );

    return response.urls;
  };

  /**
   * Paso 2: Subir archivo a S3/MinIO usando URL presigned
   */
  const uploadToStorage = async (
    file: File,
    uploadUrl: string,
    onChunkProgress: (loaded: number) => void
  ): Promise<void> => {
    // fetch no expone progreso, usamos XHR controlado.
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);

      let lastLoaded = 0;
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const delta = event.loaded - lastLoaded;
          lastLoaded = event.loaded;
          onChunkProgress(delta);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Aseguramos sumar el total por si faltó algún delta final.
          const remaining = file.size - lastLoaded;
          if (remaining > 0) {
            onChunkProgress(remaining);
          }
          resolve();
        } else {
          reject(
            new Error(`Error ${xhr.status} al subir ${file.name} a storage`)
          );
        }
      };

      xhr.onerror = () => reject(new Error(`No se pudo subir ${file.name}`));
      xhr.onabort = () => reject(new Error(`Subida cancelada ${file.name}`));

      xhr.send(file);
    });
  };

  /**
   * Paso 3: Notificar al backend que los archivos fueron subidos
   */
  const completeUpload = async (
    photos: PhotoCompletionData[],
    album_id?: number
  ): Promise<BackendPhoto[]> => {
    return apiFetch<BackendPhoto[]>("/photos/complete-upload", {
      method: "POST",
      body: JSON.stringify({ photos, album_id }),
    });
  };

  // Contrato: retorna el array de fotos creadas (BackendPhoto[]) para que
  // los consumidores puedan usar los IDs (ej. asignar tags). Mantenerlo
  // explícito evita dependencias implícitas/rotas en el flujo de guardado.
  const uploadPhotos = async ({
    files,
    photographer_id,
    price,
    description,
    album_id,
  }: UploadPhotoParams): Promise<BackendPhoto[]> => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // 0) Preparar thumbnails locales para no usar la imagen original en previews.
      const originalPresigned = await requestUploadUrls(files);
      setProgress(5);

      const thumbnailFiles = await Promise.all(
        files.map(async (file) => {
          const thumbBlob = await generateThumbnailBlob(file);
          return new File([thumbBlob], `thumb_${file.name}`, {
            type: "image/jpeg",
          });
        })
      );

      // Pedimos URLs para thumbnails forzando el prefijo a partir del object_name original.
      const thumbnailPresigned = await apiFetch<{ urls: PresignedURLData[] }>(
        "/request-upload-urls",
        {
          method: "POST",
          body: JSON.stringify({
            files: thumbnailFiles.map((thumbFile, index) => ({
              // Usamos solo el nombre de archivo (sin carpeta) para evitar rutas duplicadas
              // cuando el backend ya antepone su propia carpeta (ej: photos/).
              filename: getThumbFilename(
                originalPresigned[index]?.object_name,
                thumbFile.name
              ),
              contentType: thumbFile.type,
              objectName: buildThumbObjectName(
                originalPresigned[index]?.object_name
              ),
            })),
          }),
        }
      );

      const allUploads = [
        ...originalPresigned.map((urlData, index) => ({
          file: files[index],
          urlData,
        })),
        ...thumbnailPresigned.urls.map((urlData, index) => ({
          file: thumbnailFiles[index],
          urlData,
        })),
      ];

      const allFiles = [...files, ...thumbnailFiles];
      const totalBytes = allFiles.reduce((acc, file) => acc + file.size, 0);
      let uploadedBytes = 0;

      // Subimos en cola controlada (máx 3 concurrentes) midiendo bytes reales.
      const maxConcurrentUploads = 3;
      const progressByKey = new Map<string, number>();
      const uploadTasks = allUploads.map(({ file, urlData }) => {
        const fileKey = `${urlData.object_name}:${file.size}`;

        return async () => {
          await uploadToStorage(file, urlData.upload_url, (delta) => {
            const prev = progressByKey.get(fileKey) ?? 0;
            const next = prev + delta;
            progressByKey.set(fileKey, next);
            uploadedBytes += delta;
            const pct = Math.min(
              99,
              Math.round((uploadedBytes / totalBytes) * 100)
            );
            setProgress(pct);
          });
        };
      });

      const runQueue = async (tasks: Array<() => Promise<void>>) => {
        return new Promise<void>((resolve, reject) => {
          let cursor = 0;
          let active = 0;
          let hasErrored = false;
          const next = () => {
            if (cursor >= tasks.length && active === 0) {
              resolve();
              return;
            }
            while (active < maxConcurrentUploads && cursor < tasks.length) {
              const task = tasks[cursor];
              cursor += 1;
              active += 1;
              task()
                .catch((err) => {
                  if (hasErrored) return;
                  hasErrored = true;
                  reject(err);
                })
                .finally(() => {
                  active -= 1;
                  if (!hasErrored) {
                    next();
                  }
                });
            }
          };
          next();
        });
      };

      await runQueue(uploadTasks);
      setProgress(90);

      // 3) Registrar solo las fotos originales en el backend.
      const photosData: PhotoCompletionData[] = originalPresigned.map(
        (urlData) => ({
          object_name: urlData.object_name,
          original_filename: urlData.original_filename,
          description: description ?? undefined,
          price,
          photographer_id,
        })
      );

      const createdPhotos = await completeUpload(photosData, album_id);
      setProgress(100);

      // Refetch photos if the function is provided
      if (refetchPhotos) {
        refetchPhotos();
      }

      return createdPhotos;
    } catch (err: any) {
      console.error("❌ Error en upload:", err);
      setError(err.message || "Error al subir fotos");
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadPhotos,
    uploading,
    progress,
    error,
  };
}

