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
export function resolveAutoCombosWithFullAlbum({
  photoCount,
  combos,
  fullAlbumMinPhotos = 11,
}: {
  photoCount: number
  combos: Array<Combo & { isFullAlbum?: boolean }>
  fullAlbumMinPhotos?: number
}): AutoComboResult {
  const fullAlbumCombo = combos.find((c) => c.isFullAlbum)

  // Aplica FULL solo si existe, y se cumplen las fotos mínimas
  if (fullAlbumCombo && photoCount >= fullAlbumMinPhotos) {
    return {
      applied: [{ combo: fullAlbumCombo, count: 1 }],
      remainingPhotos: 0,
      totalComboPrice: fullAlbumCombo.price,
      isFullAlbum: true,
    }
  }

  // Filtrar combos por cantidad (no full y totalPhotos > 0)
  const quantityCombos = combos.filter((c) => !c.isFullAlbum && c.totalPhotos > 0)
  const base = resolveAutoCombos(photoCount, quantityCombos)

  return {
    ...base,
    isFullAlbum: false,
  }
}

