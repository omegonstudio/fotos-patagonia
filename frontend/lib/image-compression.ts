import imageCompression from "browser-image-compression";

const DEFAULT_MAX_SIZE_MB = 4;
const DEFAULT_MAX_DIMENSION = 2560;
const DEFAULT_INITIAL_QUALITY = 0.86;

type CompressionOptions = {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  initialQuality?: number;
};

/**
 * Comprime imágenes manteniendo el filename y el mime original.
 * Devuelve el mismo File si no logra reducir tamaño o ocurre un error.
 */
export async function compressImageVisuallyLossless(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const maxSizeMB = options.maxSizeMB ?? DEFAULT_MAX_SIZE_MB;
  const maxWidthOrHeight = options.maxWidthOrHeight ?? DEFAULT_MAX_DIMENSION;
  const initialQuality = options.initialQuality ?? DEFAULT_INITIAL_QUALITY;

  // Si el archivo ya está por debajo del umbral, no vale la pena recomprimir.
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file;
  }

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      initialQuality,
      useWebWorker: true,
      maxIteration: 12,
      fileType: file.type, // preserva el tipo original
    });

    if (compressed.size >= file.size) {
      return file;
    }

    // Normaliza a File para preservar nombre/mime incluso si la librería devolviera un Blob.
    if (compressed instanceof File) {
      return compressed;
    }
    return new File([compressed], file.name, { type: file.type });
  } catch (err) {
    console.warn("⚠️ No se pudo comprimir imagen, se usa original:", file.name, err);
    return file;
  }
}

