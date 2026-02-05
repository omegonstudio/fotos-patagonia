export function formatARS(value: number): string {
    if (!Number.isFinite(value)) return "$ 0.-"
  
    return `$ ${Math.round(value)
      .toLocaleString("es-AR")
      .replace(/,/g, ".")}.-`
  }
  