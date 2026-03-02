/**
 * Descargas “production-grade” para Next.js (App Router) + client components.
 *
 * Objetivo:
 * - iOS/iPadOS (Safari y también navegadores iOS basados en WKWebView): evitar Blob + anchor.download
 *   porque es común que falle (o abra un visor) y/o sea bloqueado por el navegador.
 *   La estrategia más compatible es `window.open(url, "_blank")` desde una interacción del usuario.
 *
 * - Resto de plataformas (Android Chrome, Desktop Chrome/Firefox/Edge, Safari desktop):
 *   preferimos `fetch` -> `Blob` -> `URL.createObjectURL` + `<a download>` para forzar descarga con nombre.
 *
 * Nota: En iOS, el nombre de archivo no se puede forzar de forma confiable desde el frontend.
 */

export type PlatformInfo = Readonly<{
  /** iPhone/iPad/iPod “clásico” por UA. */
  isIOS: boolean
  /**
   * iPadOS moderno suele reportar `navigator.platform === "MacIntel"` + touch (maxTouchPoints > 1).
   * Esto evita falsos positivos en Macs reales sin pantalla táctil.
   */
  isIPadOS: boolean
  /**
   * Safari “real”: útil si luego querés ajustar comportamientos específicos.
   * En iOS, Chrome/Firefox/Edge incluyen "Safari" en UA, por eso excluimos CriOS/FxiOS/EdgiOS/OPiOS.
   */
  isSafari: boolean
  /** Heurística de mobile (incluye iPad/tablets si hay indicadores claros). */
  isMobile: boolean
}>

export function detectPlatform(): PlatformInfo {
  // SSR-safe: en el servidor no hay `window` / `navigator`
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      isIOS: false,
      isIPadOS: false,
      isSafari: false,
      isMobile: false,
    }
  }

  const ua = navigator.userAgent ?? ""
  const platform = (navigator.platform ?? "") as string
  const maxTouchPoints = typeof navigator.maxTouchPoints === "number" ? navigator.maxTouchPoints : 0
  const vendor = (navigator.vendor ?? "") as string

  // iOS “clásico”
  const isIOS =
    /\b(iPhone|iPad|iPod)\b/i.test(ua) ||
    // iPadOS a veces oculta "iPad" en UA, lo cubrimos abajo también.
    false

  // iPadOS (se presenta como Mac, pero con touch)
  const isIPadOS = platform === "MacIntel" && maxTouchPoints > 1

  // “Mobile” por señales combinadas (no solo regex)
  const isMobile =
    isIOS ||
    isIPadOS ||
    /\bAndroid\b/i.test(ua) ||
    /\bMobi\b/i.test(ua) ||
    maxTouchPoints > 1 // tablets/híbridos

  // Safari “real” (no Chrome iOS / Firefox iOS / Edge iOS / Opera iOS)
  const isSafariLike = /\bSafari\b/i.test(ua)
  const isAppleVendor = vendor === "Apple Computer, Inc."
  const isCriOS = /\bCriOS\b/i.test(ua)
  const isFxiOS = /\bFxiOS\b/i.test(ua)
  const isEdgiOS = /\bEdgiOS\b/i.test(ua)
  const isOPiOS = /\bOPiOS\b/i.test(ua)
  const isChromeDesktop = /\bChrome\/|Chromium\/|Edg\//i.test(ua)

  const isSafari =
    isSafariLike &&
    isAppleVendor &&
    !isCriOS &&
    !isFxiOS &&
    !isEdgiOS &&
    !isOPiOS &&
    // en desktop, Chrome/Edge pueden incluir "Safari" en UA; excluimos engines Chrome/Chromium/Edg
    !isChromeDesktop

  return { isIOS: isIOS || isIPadOS, isIPadOS, isSafari, isMobile }
}

export type DownloadFileOptions = Readonly<{
  /**
   * Para S3 signed URLs normalmente conviene `omit` (no cookies).
   * Si alguna vez necesitas cookies, podés cambiarlo.
   */
  credentials?: RequestCredentials
}>

/**
 * Descarga un archivo con la mejor estrategia por plataforma.
 *
 * - iOS/iPadOS: `window.open()` evita las limitaciones de Blob/download attribute.
 * - Otros: fetch -> blob -> objectURL -> anchor.download (permite nombre).
 */
export async function downloadFile(
  url: string,
  filename: string,
  options: DownloadFileOptions = {},
): Promise<void> {
  if (!url) return

  const { isIOS, isIPadOS } = detectPlatform()
  const isAppleMobile = isIOS || isIPadOS

  // iOS/iPadOS: estrategia más compatible (sin Blob, sin download attr).
  // Importante: se debe llamar desde un gesto del usuario (click/tap) para evitar bloqueos.
  if (isAppleMobile) {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer")

    if (!newWindow) {
      // fallback si popup fue bloqueado
      window.location.href = url
    }    
    return
  }

  // Resto: intentar descarga con nombre controlado.
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null
  const signal = controller?.signal

  let objectUrl: string | null = null
  try {
    const res = await fetch(url, {
      method: "GET",
      mode: "cors",
      credentials: options.credentials ?? "omit",
      signal: signal ?? undefined,
    })
    if (!res.ok) {
      throw new Error(`downloadFile: HTTP ${res.status}`)
    }

    const blob = await res.blob()
    objectUrl = window.URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = objectUrl
    a.download = filename || "download"
    a.rel = "noopener noreferrer"
    a.style.display = "none"
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    // En algunos navegadores la descarga “arranca” async; revocar demasiado pronto puede cortarla.
    if (objectUrl) {
      window.setTimeout(() => {
        try {
          window.URL.revokeObjectURL(objectUrl!)
        } catch {
          // noop: revoke puede fallar en algunos entornos; no es crítico
        }
      }, 10_000)
    }
  }
}

export type DownloadMultipleItem = Readonly<{
  url: string
  filename: string
}>

let downloadMultipleInFlight = false

/**
 * Descarga múltiples archivos de forma SECUENCIAL.
 *
 * Por qué secuencial:
 * - iOS/Safari suelen bloquear múltiples “nuevas ventanas” o descargas disparadas en ráfaga.
 * - Evita `Promise.all` (especialmente en iOS) y reduce el riesgo de throttling/bloqueo.
 *
 * Delay:
 * - Solo en iOS/iPadOS: esperamos ~1.1s entre descargas para minimizar bloqueos de popups/descargas.
 */
export async function downloadMultiple(files: ReadonlyArray<DownloadMultipleItem>): Promise<void> {
  if (downloadMultipleInFlight) return
  if (!files?.length) return

  downloadMultipleInFlight = true
  try {
    const { isIOS, isIPadOS } = detectPlatform()
    const isAppleMobile = isIOS || isIPadOS
    const iosDelayMs = 1100

    for (const file of files) {
      if (!file?.url) continue
      await downloadFile(file.url, file.filename)

      if (isAppleMobile) {
        // Espera mínima solo en iOS/iPadOS para evitar bloqueos por múltiples acciones seguidas.
        await new Promise<void>((resolve) => window.setTimeout(resolve, iosDelayMs))
      }
    }
  } finally {
    downloadMultipleInFlight = false
  }
}


