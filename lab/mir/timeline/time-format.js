/* timeline/time-format.js — pure numeric-to-string formatters shared by every readout host (timeline, modulation window),
 * harvested whole from BASINS app/time-format.js (2026-10-02).  Numbers, not words: nothing here is translated. */
const pad2 = n => String(n).padStart(2, '0');

// '0:07' (whole seconds, truncated) or '0:07.3' when fine: a tenth of a second
// reads as its own pixel (px·bpm/60 ≥ 40 at the call site decides `fine`).
export function formatSeconds(seconds, fine = false) {
  const sign = seconds < 0 ? '-' : '';
  const tenths = Math.floor(Math.abs(seconds) * 10 + 1e-9);
  const minutes = Math.floor(tenths / 600);
  const rest = tenths - minutes * 600;
  const whole = Math.floor(rest / 10), tenth = rest % 10;
  return fine ? `${sign}${minutes}:${pad2(whole)}.${tenth}` : `${sign}${minutes}:${pad2(whole)}`;
}

// '2.4' — 1-based bar, 1-based beat within the bar; the ruler's own numbering.
export function formatBar(beat, meter) {
  const m = meter > 0 ? meter : 4, b = Math.max(0, beat);
  const bar = Math.floor(b / m) + 1, beatInBar = Math.floor(b % m + 1e-9) + 1;
  return `${bar}.${beatInBar}`;
}

// '62%' hovering, '62.5%' while a point is held (one decimal).
export function formatPercent(value, held = false) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return held ? (Math.round(pct * 10) / 10).toFixed(1) + '%' : Math.round(pct) + '%';
}
