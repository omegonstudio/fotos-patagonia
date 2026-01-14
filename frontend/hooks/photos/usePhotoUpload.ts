"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  buildThumbObjectName,
  generateThumbnailBlob,
} from "@/lib/photo-thumbnails";
import { compressImageVisuallyLossless } from "@/lib/image-compression";
import type { BackendPhoto } from "@/hooks/photos/usePhotos";
import { ApiError } from "@/lib/api";

type FileKind = "original" | "thumbnail";

type UploadFileStatus = "pending" | "uploading" | "success" | "failed";

interface UploadFileResult {
  kind: FileKind;
  filename: string;
  objectName: string;
  size: number;
  status: UploadFileStatus;
  attempts: number;
  maxAttempts: number;
  retryable: boolean;
  errorMessage?: string;
  statusCode?: number;
}

interface FailedFileInfo {
  name: string;
  kind: FileKind;
  reason: string;
  attempts: number;
  statusCode?: number;
  retryable: boolean;
}

export interface UploadBatchResult {
  status: "success" | "partial" | "error";
  createdPhotos: BackendPhoto[];
  originals: UploadFileResult[];
  thumbnails: UploadFileResult[];
  failedFiles: FailedFileInfo[];
}

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
  price?: number;
  photographer_id: number;
}

interface UploadPhotoParams {
  files: File[];
  photographer_id: number;
  session_id?: number; // opcional según flujo
  price?: number;
  description?: string;
  album_id?: number;
}

export interface UploadListeners {
  onProgress?: (progress: number) => void;
  onComplete?: (photos: BackendPhoto[], result?: UploadBatchResult) => void;
  onError?: (error: Error, result?: UploadBatchResult) => void;
  onSettle?: (result: UploadBatchResult) => void;
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
          const err = new Error(
            `Error ${xhr.status} al subir ${file.name} a storage`
          ) as Error & { status?: number };
          err.status = xhr.status;
          reject(err);
        }
      };

      xhr.onerror = () => {
        const err = new Error(`No se pudo subir ${file.name}`) as Error & {
          status?: number;
        };
        err.status = xhr.status || 0;
        reject(err);
      };
      xhr.onabort = () => {
        const err = new Error(`Subida cancelada ${file.name}`) as Error & {
          status?: number;
        };
        err.status = xhr.status || 0;
        reject(err);
      };

      xhr.send(file);
    });
  };

  const isRetryableStatus = (status?: number) => {
    if (status === undefined || status === null) return false;
    if (status === 0) return true; // red / timeout de red
    if (status === 408 || status === 429) return true;
    return status >= 500;
  };

  const buildFriendlyReason = (status?: number, message?: string) => {
    if (status === 403) return "URL expirada o sin permisos";
    if (status === 400) return "Solicitud inválida";
    if (status === 0) return "Sin conexión o timeout";
    if (status && status >= 500) return "Error temporal del servidor";
    return message || "No se pudo subir el archivo";
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
  const uploadPhotos = async (
    { files, photographer_id, price, description, album_id }: UploadPhotoParams,
    listeners?: UploadListeners
  ): Promise<BackendPhoto[]> => {
    setUploading(true);
    setError(null);
    setProgress(0);

    const pushProgress = (pct: number) => {
      setProgress(pct);
      listeners?.onProgress?.(pct);
    };

    const maxAttempts = 3;
    const originalResults: UploadFileResult[] = [];
    const thumbnailResults: UploadFileResult[] = [];

    const buildFailedInfo = (result: UploadFileResult): FailedFileInfo => ({
      name: result.filename,
      kind: result.kind,
      attempts: result.attempts,
      reason: result.errorMessage || "Error al subir archivo",
      statusCode: result.statusCode,
      retryable: result.retryable,
    });

    let createdPhotos: BackendPhoto[] = [];

    try {
      // 0) Comprimir originales para reducir peso antes de pedir URLs
      const processedFiles = await Promise.all(
        files.map((file) =>
          compressImageVisuallyLossless(file).catch((err) => {
            console.warn(
              "⚠️ Compresión fallida, se usa original:",
              file.name,
              err
            );
            return file;
          })
        )
      );

      // 0) Solicitar presigned URLs para originales
      // Nota: usamos processedFiles (ya comprimidos) para que los tamaños,
      // nombres y totalBytes reflejen el artefacto real que se sube.
      const originalPresigned = await requestUploadUrls(processedFiles);
      pushProgress(5);

      // 1) Generar thumbnails localmente por archivo (tolerante a fallos individuales)
      const thumbnailFiles: Array<File | null> = await Promise.all(
        processedFiles.map(async (file) => {
          try {
            const thumbBlob = await generateThumbnailBlob(file);
            return new File([thumbBlob], `thumb_${file.name}`, {
              type: "image/jpeg",
            });
          } catch (err) {
            console.warn("⚠️ No se pudo generar thumbnail de", file.name, err);
            return null;
          }
        })
      );
      pushProgress(8);

      // 2) Pedir URLs de thumbnails; si falla, continuamos sin ellos.
      let thumbnailPresigned: PresignedURLData[] = [];
      try {
        const validThumbs = thumbnailFiles
          .map((thumb, index) => ({ thumb, index }))
          .filter((t) => t.thumb !== null) as Array<{
          thumb: File;
          index: number;
        }>;

        if (validThumbs.length > 0) {
          const response = await apiFetch<{ urls: PresignedURLData[] }>(
            "/request-upload-urls",
            {
              method: "POST",
              body: JSON.stringify({
                files: validThumbs.map(({ thumb, index }) => ({
                  filename: getThumbFilename(
                    originalPresigned[index]?.object_name,
                    thumb.name
                  ),
                  contentType: thumb.type,
                  objectName: buildThumbObjectName(
                    originalPresigned[index]?.object_name
                  ),
                })),
              }),
            }
          );
          thumbnailPresigned = response.urls;
        }
      } catch (err) {
        console.warn("⚠️ No se pudieron obtener URLs de thumbnail:", err);
        thumbnailPresigned = [];
      }

      // 3) Preparar tareas de upload con estado por archivo
      type UploadTask = {
        kind: FileKind;
        file: File;
        urlData: PresignedURLData;
        resultRef: UploadFileResult;
      };

      const uploadTasks: UploadTask[] = [];

      originalPresigned.forEach((urlData, index) => {
        const file = processedFiles[index];
        const result: UploadFileResult = {
          kind: "original",
          filename: urlData.original_filename,
          objectName: urlData.object_name,
          size: file.size,
          status: "pending",
          attempts: 0,
          maxAttempts,
          retryable: true,
        };
        originalResults.push(result);
        uploadTasks.push({
          kind: "original",
          file,
          urlData,
          resultRef: result,
        });
      });

      // Mapear thumbnails con sus URLs (si existen), de lo contrario marcarlos como fallidos inmediatos.
      let thumbUrlCursor = 0;
      thumbnailFiles.forEach((thumbFile, index) => {
        const originalObj = originalPresigned[index]?.object_name;
        const filename = getThumbFilename(originalObj, thumbFile?.name);
        if (!thumbFile) {
          const objectNameFallback = `thumb_${filename ?? "unknown"}`;
          thumbnailResults.push({
            kind: "thumbnail",
            filename,
            objectName: buildThumbObjectName(originalObj) ?? objectNameFallback,
            size: 0,
            status: "failed",
            attempts: 0,
            maxAttempts,
            retryable: false,
            errorMessage: "No se pudo generar thumbnail local",
          });
          return;
        }

        const urlData = thumbnailPresigned[thumbUrlCursor];
        thumbUrlCursor += 1;

        if (!urlData) {
          thumbnailResults.push({
            kind: "thumbnail",
            filename,
            objectName:
              buildThumbObjectName(originalObj) ?? `thumb_${filename}`,
            size: thumbFile.size,
            status: "failed",
            attempts: 0,
            maxAttempts,
            retryable: false,
            errorMessage: "No se obtuvo URL para subir el thumbnail",
          });
          return;
        }

        const result: UploadFileResult = {
          kind: "thumbnail",
          filename: urlData.original_filename,
          objectName: urlData.object_name,
          size: thumbFile.size,
          status: "pending",
          attempts: 0,
          maxAttempts,
          retryable: true,
        };
        thumbnailResults.push(result);
        uploadTasks.push({
          kind: "thumbnail",
          file: thumbFile,
          urlData,
          resultRef: result,
        });
      });

      const totalBytes = uploadTasks.reduce(
        (acc, task) => acc + task.file.size,
        0
      );
      let uploadedBytes = 0;

      const applyProgress = (delta: number) => {
        uploadedBytes = Math.max(0, uploadedBytes + delta);
        const pct = totalBytes
          ? Math.min(95, Math.round((uploadedBytes / totalBytes) * 100))
          : 95;
        pushProgress(pct);
      };

      const runTaskWithRetry = async (task: UploadTask) => {
        const { file, urlData, resultRef } = task;
        while (resultRef.attempts < maxAttempts) {
          resultRef.attempts += 1;
          resultRef.status = "uploading";
          let attemptBytes = 0;
          try {
            await uploadToStorage(file, urlData.upload_url, (delta) => {
              attemptBytes += delta;
              applyProgress(delta);
            });
            resultRef.status = "success";
            resultRef.retryable = false;
            resultRef.errorMessage = undefined;
            resultRef.statusCode = undefined;
            return;
          } catch (err: any) {
            // revertir progreso de este intento para permitir reintento sin inflar el %.
            if (attemptBytes > 0) {
              applyProgress(-attemptBytes);
            }
            const status =
              err?.status ??
              (err instanceof ApiError ? err.status : undefined) ??
              undefined;
            const retryable = isRetryableStatus(status);
            resultRef.status = "failed";
            resultRef.retryable = retryable;
            resultRef.statusCode = status;
            resultRef.errorMessage = buildFriendlyReason(status, err?.message);
            if (!retryable || resultRef.attempts >= maxAttempts) {
              return;
            }
            // pequeño delay para reintentos exponenciales básicos
            await new Promise((r) =>
              setTimeout(r, 200 * Math.pow(2, resultRef.attempts - 1))
            );
          }
        }
      };

      // 4) Ejecutar uploads en paralelo limitada
      const maxConcurrentUploads = 3;
      await new Promise<void>((resolve) => {
        let cursor = 0;
        let active = 0;
        const next = () => {
          if (cursor >= uploadTasks.length && active === 0) {
            resolve();
            return;
          }
          while (active < maxConcurrentUploads && cursor < uploadTasks.length) {
            const task = uploadTasks[cursor];
            cursor += 1;
            active += 1;
            runTaskWithRetry(task)
              .catch((err) => {
                console.error("Upload task error", err);
              })
              .finally(() => {
                active -= 1;
                next();
              });
          }
        };
        next();
      });

      pushProgress(92);

      // 5) Completar upload solo con originales exitosos
      const successfulOriginals = originalResults.filter(
        (r) => r.status === "success"
      );
      const failedOriginals = originalResults.filter(
        (r) => r.status === "failed"
      );
      const failedThumbs = thumbnailResults.filter(
        (r) => r.status === "failed"
      );

      if (successfulOriginals.length > 0) {
        const photosData: PhotoCompletionData[] = successfulOriginals.map(
          (result) => ({
            object_name: result.objectName,
            original_filename: result.filename,
            description: description ?? undefined,
            price,
            photographer_id,
          })
        );

        createdPhotos = await completeUpload(photosData, album_id);
      } else {
        throw new Error("No se pudo subir ninguna foto original");
      }

      const status: UploadBatchResult["status"] =
        failedOriginals.length > 0 || failedThumbs.length > 0
          ? "partial"
          : "success";

      pushProgress(100);

      const failedFiles: FailedFileInfo[] = [
        ...failedOriginals.map(buildFailedInfo),
        ...failedThumbs.map(buildFailedInfo),
      ];

      const batchResult: UploadBatchResult = {
        status,
        createdPhotos,
        originals: originalResults,
        thumbnails: thumbnailResults,
        failedFiles,
      };

      if (refetchPhotos) {
        refetchPhotos();
      }

      listeners?.onComplete?.(createdPhotos, batchResult);
      listeners?.onSettle?.(batchResult);

      return createdPhotos;
    } catch (err: any) {
      console.error("❌ Error en upload:", err);
      setError(err.message || "Error al subir fotos");

      const batchResult: UploadBatchResult = {
        status: "error",
        createdPhotos,
        originals: originalResults,
        thumbnails: thumbnailResults,
        failedFiles: [
          ...originalResults
            .filter((r) => r.status !== "success")
            .map(buildFailedInfo),
          ...thumbnailResults
            .filter((r) => r.status === "failed")
            .map(buildFailedInfo),
        ],
      };

      if (err instanceof Error) {
        listeners?.onError?.(err, batchResult);
      } else {
        listeners?.onError?.(new Error("Upload error"), batchResult);
      }
      listeners?.onSettle?.(batchResult);
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
