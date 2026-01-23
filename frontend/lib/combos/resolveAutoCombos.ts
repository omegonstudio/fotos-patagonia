export interface Combo {
    id: number
    totalPhotos: number
    price: number
  }
  
  export interface AppliedCombo {
    combo: Combo
    count: number
  }
  
  export function resolveAutoCombos(
    photoCount: number,
    combos: Combo[],
  ) {
    if (photoCount < 3 || combos.length === 0) {
      return {
        applied: [],
        remainingPhotos: photoCount,
        totalComboPrice: 0,
      }
    }
  
    // ordenar combos por tamaño DESC (7 → 5 → 3)
    const sorted = [...combos].sort(
      (a, b) => b.totalPhotos - a.totalPhotos,
    )
  
    let remaining = photoCount
    const applied: AppliedCombo[] = []
    let total = 0
  
    for (const combo of sorted) {
      if (remaining < combo.totalPhotos) continue
  
      const count = Math.floor(remaining / combo.totalPhotos)
      if (count > 0) {
        applied.push({ combo, count })
        remaining -= count * combo.totalPhotos
        total += count * combo.price
      }
    }
  
    return {
      applied,
      remainingPhotos: remaining,
      totalComboPrice: total,
    }
  }
  