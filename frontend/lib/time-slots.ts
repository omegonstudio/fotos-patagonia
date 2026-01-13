import { Photo } from "./types"
import { photoHourKey } from "./datetime"

export const findClosestHourWithPhotos = (
  photos: Photo[],
  targetHourKey: string,
) => {
  const target = Number(targetHourKey)
  if (Number.isNaN(target)) return null

  const available = new Set<number>()

  for (const p of photos) {
    const hk = photoHourKey(p)
    if (hk !== null) available.add(Number(hk))
  }

  if (available.size === 0) return null
  if (available.has(target)) return String(target).padStart(2, "0")

  let bestHour: number | null = null
  let bestDist = Infinity

  for (const h of available) {
    const dist = Math.abs(h - target)
    if (dist < bestDist) {
      bestDist = dist
      bestHour = h
    }
  }

  return bestHour !== null
    ? String(bestHour).padStart(2, "0")
    : null
}


export type HourRange = {
    key: string          // "06", "07", ... "22"
    label: string        // "06:00 - 06:59"
    hour: number         // 6..22
    startMin: number     // hour*60
    endMin: number       // (hour+1)*60
  }
  
  export const buildHourRanges = (startHour = 0, endHour = 23): HourRange[] => {
    const pad = (n: number) => String(n).padStart(2, "0")
  
    const ranges: HourRange[] = []
    for (let h = startHour; h <= endHour; h++) {
      ranges.push({
        key: pad(h),
        label: `${pad(h)}:00 - ${pad(h)}:59`,
        hour: h,
        startMin: h * 60,
        endMin: (h + 1) * 60,
      })
    }
    return ranges
  }
  