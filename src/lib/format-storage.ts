/**
 * Formate le stockage en GB, MB ou bytes selon la valeur
 * @param gb La valeur en gigabytes
 * @returns La valeur formatée avec unité appropriée
 */
export function formatStorage(gb: number): string {
  // Très petites valeurs en bytes
  if (gb < 0.00000095367) { // < 1 KB en GB
    const bytes = Math.round(gb * 1024 * 1024 * 1024);
    if (bytes < 1) return '< 1 B';
    return `${bytes} B`;
  }
  
  // Petites valeurs en KB
  if (gb < 0.00095367) { // < 1 MB en GB
    const kb = gb * 1024 * 1024;
    return `${kb.toFixed(0)} KB`;
  }
  
  // Valeurs moyennes en MB
  if (gb < 1) {
    const mb = gb * 1024;
    return `${mb.toFixed(0)} MB`;
  }
  
  // Grandes valeurs en GB avec 1 décimale
  return `${gb.toFixed(1)} GB`;
}

/**
 * Similaire à formatStorage mais retourne directement la valeur numérique et l'unité
 */
export function getStorageDisplay(gb: number): { value: number; unit: string } {
  if (gb < 1) {
    return { value: parseFloat((gb * 1024).toFixed(0)), unit: "MB" };
  }
  return { value: parseFloat(gb.toFixed(1)), unit: "GB" };
}
