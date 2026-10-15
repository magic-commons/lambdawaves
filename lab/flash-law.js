/* lab/flash-law.js — THE FLASH LAW (0.6.0 B3a), pure.  A beat of |ΔE| a.u. at RATE a.u./s turns |ΔE|·RATE/2π times a real second, and a
 * screen drawing fps frames a second shows it at its alias |hz − fps·round(hz/fps)|; above 3 a second it flashes (the kit's flash guard, WCAG 2.3.1). */
export const FLASH_HZ = 3;
/** the populated pair whose on-screen beat is fastest: { hz, alias, pair: [Ea, Eb] }, or null under fewer than two energies */
export function aliasOf(energies, rate, fps) {
  const E = [...new Set(energies)]; let w = null;
  for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) {
    const hz = Math.abs(E[i] - E[j]) * rate / (2 * Math.PI), alias = Math.abs(hz - fps * Math.round(hz / fps));
    if (!w || alias > w.alias) w = { hz, alias, pair: [E[i], E[j]] };
  }
  return w;
}
