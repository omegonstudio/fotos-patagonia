// Utilidades de thumbnails para evitar usar la imagen original en previsualizaciones.
// Se generan en el cliente usando canvas y se guardan como JPEG comprimido.

export const buildThumbObjectName = (
  objectName?: string | null
): string | undefined => {
  if (!objectName) return undefined;
  // Mantener la ruta original pero con prefijo para que quede en la misma carpeta.
  return `thumb_${objectName}`;
};

/**
 * Genera un Blob JPEG reducido a partir de un File de imagen.
 */
export async function generateThumbnailBlob(
  file: File,
  maxSize = 640
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const ratio = Math.min(maxSize / image.width, maxSize / image.height, 1);
      const width = Math.round(image.width * ratio);
      const height = Math.round(image.height * ratio);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo crear el contexto de canvas para generar el thumbnail."));
        URL.revokeObjectURL(objectUrl);
        return;
      }

      ctx.drawImage(image, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error("No se pudo generar el blob del thumbnail."));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.82 // pequeña compresión para acelerar la subida
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`No se pudo leer la imagen ${file.name}`));
    };

    image.src = objectUrl;
  });
}

/**
 * Versión cómoda para previews: devuelve un dataURL del thumbnail.
 */
export async function generateThumbnailDataUrl(
  file: File,
  maxSize = 640
): Promise<string> {
  const thumbBlob = await generateThumbnailBlob(file, maxSize);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`No se pudo leer el thumbnail de ${file.name}`));
    reader.readAsDataURL(thumbBlob);
  });
}

