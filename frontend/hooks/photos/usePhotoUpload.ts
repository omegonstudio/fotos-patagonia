"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

interface FileInfo {
  filename: string;
  contentType: string;
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
    uploadUrl: string
  ): Promise<void> => {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type, // 🔴 CLAVE
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${file.name} to storage`);
    }
  };

  /**
   * Paso 3: Notificar al backend que los archivos fueron subidos
   */
  const completeUpload = async (
    photos: PhotoCompletionData[],
    album_id?: number
  ) => {
    return apiFetch("/photos/complete-upload", {
      method: "POST",
      body: JSON.stringify({ photos, album_id }),
    });
  };

  const uploadPhotos = async ({
    files,
    photographer_id,
    price,
    description,
    album_id,
  }: UploadPhotoParams) => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // ... (steps 1 and 2 are the same)
      console.log("📤 Solicitando URLs presigned...");
      const urlsData = await requestUploadUrls(files);
      setProgress(20);

      // Paso 2: Subir archivos a storage
      console.log("☁️  Subiendo archivos a storage...");
      const uploadPromises = files.map((file, index) => {
        const urlData = urlsData[index];
        return uploadToStorage(file, urlData.upload_url);
      });

      await Promise.all(uploadPromises);
      setProgress(70);


      console.log("✅ Completando registro en base de datos...");
      const photosData: PhotoCompletionData[] = urlsData.map((urlData) => ({
        object_name: urlData.object_name,
        original_filename: urlData.original_filename,
        description: description ?? undefined,
        price,
        photographer_id,
      }));

      const createdPhotos = await completeUpload(photosData, album_id);
      setProgress(100);

      console.log("🎉 Upload completado exitosamente!", createdPhotos);

      // Refetch photos if the function is provided
      if (refetchPhotos) {
        console.log("🔄 Refrescando la lista de fotos...");
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

