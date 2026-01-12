import { Photo } from "./types"

const ARG_LOCALE = "es-AR"
const ARG_TIME_ZONE = "America/Argentina/Buenos_Aires"

type DateInput = string | Date | null | undefined

/* ======================================================
   Parser simple y seguro
   - Backend envía UTC (aunque no tenga Z)
   - NO tocamos el string
   - Date lo interpreta como UTC
====================================================== */
export function parseUtcNaiveDate(value: DateInput): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const trimmed = value.trim()
  if (!trimmed) return null

  // Si ya tiene zona horaria (Z o +hh:mm o -hh:mm), no tocamos nada
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed)

  // Si NO tiene zona -> asumimos que viene en UTC naive -> le agregamos Z
  const iso = hasZone ? trimmed.replace(/z$/, "Z") : `${trimmed}Z`

  const parsed = new Date(iso)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}


/* ======================================================
   Formatter centralizado con TZ Argentina
====================================================== */
const buildFormatter = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(ARG_LOCALE, {
    timeZone: ARG_TIME_ZONE,
    ...options,
  })

/* ======================================================
   Fecha + hora (para UI de fotos)
====================================================== */
export function formatPhotoDate(value: DateInput): string {
  const parsed = parseUtcNaiveDate(value)
  if (!parsed) return ""

  const parts = buildFormatter({
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(parsed)

  const get = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? ""

  const day = get("day")
  const month = get("month").toLowerCase()
  const hour = get("hour")
  const minute = get("minute")

  if (!day || !month || !hour || !minute) return ""
  return `${day} ${month} · ${hour}:${minute}`
}

/* ======================================================
   Solo fecha
====================================================== */
export function formatDateOnly(
  value: DateInput,
  { month = "long", includeYear = true }: { month?: "short" | "long"; includeYear?: boolean } = {},
): string {
  const parsed = parseUtcNaiveDate(value)
  if (!parsed) return ""

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month,
    timeZone: ARG_TIME_ZONE,
  }

  if (includeYear) options.year = "numeric"

  return new Intl.DateTimeFormat(ARG_LOCALE, options).format(parsed)
}

/* ======================================================
   Fecha + hora genérica
====================================================== */
export function formatDateTime(
  value: DateInput,
  {
    month = "long",
    includeYear = true,
    includeSeconds = false,
  }: { month?: "short" | "long"; includeYear?: boolean; includeSeconds?: boolean } = {},
): string {
  const parsed = parseUtcNaiveDate(value)
  if (!parsed) return ""

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: ARG_TIME_ZONE,
  }

  if (includeYear) options.year = "numeric"
  if (includeSeconds) options.second = "2-digit"

  return new Intl.DateTimeFormat(ARG_LOCALE, options).format(parsed)
}

/* ======================================================
   Helpers de hora (para filtro)
====================================================== */
export const timeToMinutes = (time?: string | null) => {
  if (!time) return null
  const [hh, mm] = time.split(":")
  const h = Number(hh)
  const m = Number(mm ?? "0")
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

/* ======================================================
   🔑 CLAVE DEL FILTRO HORARIO
   - Siempre en horario Argentina
====================================================== */
export const photoHourKey = (photo: Photo) => {
  // 1️⃣ Si viene explícito del backend
  const mins = timeToMinutes(photo.timeSlot)
  if (mins !== null) {
    const hour = Math.floor(mins / 60)
    return String(hour).padStart(2, "0")
  }

  // 2️⃣ Fallback: takenAt (UTC → Argentina)
  const date = parseUtcNaiveDate(photo.takenAt)
  if (!date) return null

  const parts = new Intl.DateTimeFormat(ARG_LOCALE, {
    timeZone: ARG_TIME_ZONE,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date)

  const hour = parts.find((p) => p.type === "hour")?.value
  return hour ?? null
}
