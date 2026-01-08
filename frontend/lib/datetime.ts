const ARG_LOCALE = "es-AR"
const ARG_TIME_ZONE = "America/Argentina/Buenos_Aires"
const FRACTION_REGEX = /\.(\d{3})\d+/

type DateInput = string | Date | null | undefined

const buildFormatter = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(ARG_LOCALE, { timeZone: ARG_TIME_ZONE, ...options })

const normalizeFraction = (value: string) => value.replace(FRACTION_REGEX, ".$1")

const ensureUtcString = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return trimmed

  const normalized = normalizeFraction(trimmed)
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(normalized)
  if (hasZone) return normalized.replace(/z$/, "Z")

  return `${normalized}Z`
}

export function parseUtcNaiveDate(value: DateInput): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const normalized = ensureUtcString(value)
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatWith = (value: DateInput, options: Intl.DateTimeFormatOptions) => {
  const parsed = parseUtcNaiveDate(value)
  if (!parsed) return ""
  return buildFormatter(options).format(parsed)
}

export function formatPhotoDate(value: DateInput): string {
  const parsed = parseUtcNaiveDate(value)
  if (!parsed) return ""

  const parts = buildFormatter({
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(parsed)

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ""
  const day = get("day")
  const month = get("month").toLowerCase()
  const hour = get("hour")
  const minute = get("minute")

  if (!day || !month || !hour || !minute) return ""
  return `${day} ${month} · ${hour}:${minute}`
}

export function formatDateOnly(
  value: DateInput,
  { month = "long", includeYear = true }: { month?: "short" | "long"; includeYear?: boolean } = {},
): string {
  const options: Intl.DateTimeFormatOptions = {
    month,
    day: "numeric",
  }

  if (includeYear) {
    options.year = "numeric"
  }

  return formatWith(value, options)
}

export function formatDateTime(
  value: DateInput,
  {
    month = "long",
    includeYear = true,
    includeSeconds = false,
  }: { month?: "short" | "long"; includeYear?: boolean; includeSeconds?: boolean } = {},
): string {
  const options: Intl.DateTimeFormatOptions = {
    month,
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }

  if (includeYear) {
    options.year = "numeric"
  }

  if (includeSeconds) {
    options.second = "2-digit"
  }

  return formatWith(value, options)
}

