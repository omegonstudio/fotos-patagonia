import { resolveAutoCombos, type Combo } from "./resolveAutoCombos"

export interface AppliedCombo {
  combo: Combo
  count: number
}

export interface AutoComboResult {
  applied: AppliedCombo[]
  remainingPhotos: number
  totalComboPrice: number
  isFullAlbum: boolean
}

/**
 * Wrapper que prioriza el combo "full album" (isFullAlbum = true) a partir
 * de fullAlbumMinPhotos. Si aplica full, no se ejecutan combos por cantidad.
 * Si no aplica, delega a resolveAutoCombos (solo combos por cantidad).
 */
export function resolveAutoCombosWithFullAlbum(
  photoCount: number,
  combos: Array<Combo & { isFullAlbum?: boolean; active?: boolean }> = [],
  options?: { fullAlbumMinPhotos?: number },
): AutoComboResult {
  const fullAlbumMinPhotos = options?.fullAlbumMinPhotos ?? 11

  if (!Array.isArray(combos) || combos.length === 0) {
    return {
      applied: [],
      remainingPhotos: photoCount,
      totalComboPrice: 0,
      isFullAlbum: false,
    }
  }

  const fullAlbumCombo = combos.find(
    (c) => c.active && c.isFullAlbum,
  )

  if (fullAlbumCombo && photoCount >= fullAlbumMinPhotos) {
    return {
      applied: [{ combo: fullAlbumCombo, count: 1 }],
      remainingPhotos: 0,
      totalComboPrice: fullAlbumCombo.price,
      isFullAlbum: true,
    }
  }

  const quantityCombos = combos.filter(
    (c) => c.active && !c.isFullAlbum && c.totalPhotos > 0,
  )

  const base = resolveAutoCombos(photoCount, quantityCombos)

  return {
    ...base,
    isFullAlbum: false,
  }
}


