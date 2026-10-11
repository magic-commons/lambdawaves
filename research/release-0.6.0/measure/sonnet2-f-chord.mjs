// sonnet2-f: the hydrogen chord at RATE 3000: the 15 beat frequencies (|E_n - E_m| * RATE / 2pi, atomic units, n,m <= 6) and the 6 level frequencies |E_n| RATE/2pi,
// the audible band, what a phone/laptop speaker reproduces (UNVERIFIED typical: ~150-200 Hz laptop/phone floor), and an octave-fold into one audible octave (pitch classes kept).
import fs from 'node:fs';
const RATE = 3000, E = (n) => -1 / (2 * n * n); const f = (dE) => Math.abs(dE) * RATE / (2 * Math.PI);
const beats = []; for (let m = 1; m <= 6; m++) for (let n = m + 1; n <= 6; n++) beats.push({ pair: `${m}-${n}`, f: f(E(n) - E(m)) });
beats.sort((a, b) => a.f - b.f);
const levels = []; for (let n = 1; n <= 6; n++) levels.push({ n, f: f(E(n)) });
const frac = (arr, lim) => arr.filter((x) => x.f < lim).length;
// fold into [lo, 2lo) by octaves, name the note (A4 = 440)
const fold = (x, lo) => { let y = x; while (y < lo) y *= 2; while (y >= 2 * lo) y /= 2; return y; };
const note = (x) => { const midi = 69 + 12 * Math.log2(x / 440); const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']; const r = Math.round(midi); return names[((r % 12) + 12) % 12] + (Math.floor(r / 12) - 1) + ((midi - r) * 100 >= 0 ? '+' : '') + ((midi - r) * 100).toFixed(0) + 'c'; };
const folded = beats.map((b) => ({ pair: b.pair, f: +b.f.toFixed(2), fold220: +fold(b.f, 220).toFixed(1), note: note(fold(b.f, 220)) }));
const classes = new Set(folded.map((x) => x.note.replace(/\d/g, '').replace(/[+-]\d+c/, ''))); 
const foldedLevels = levels.map((l) => ({ n: l.n, Hz: +l.f.toFixed(3), fold220: +fold(l.f, 220).toFixed(2), note: note(fold(l.f, 220)) }));
const levelClasses = new Map(); for (const l of foldedLevels) { const k = l.fold220.toFixed(1); levelClasses.set(k, (levelClasses.get(k) || []).concat(l.n)); }
const out = {
  tag: 'DERIVED-HERE (arithmetic; frequency convention f = dE*RATE/2pi, RATE in a.u. per second: 3000 gives 72.6 fs/s, and 1s-2p = 179.05 Hz matches the plan\'s 179.049 Hz)',
  RATE, beats15: beats.map((b) => ({ pair: b.pair, Hz: +b.f.toFixed(3) })), levels6: levels.map((l) => ({ n: l.n, Hz: +l.f.toFixed(3) })),
  min: +beats[0].f.toFixed(3), max: +beats[14].f.toFixed(3), spanOctaves: +Math.log2(beats[14].f / beats[0].f).toFixed(2),
  counts: { below3Hz: frac(beats, 3), below20Hz: frac(beats, 20), below50Hz: frac(beats, 50), below100Hz: frac(beats, 100), below200Hz: frac(beats, 200), above200Hz: beats.length - frac(beats, 200) },
  fractionBelow20Hz: +(frac(beats, 20) / 15).toFixed(3), fractionBelow200Hz: +(frac(beats, 200) / 15).toFixed(3),
  above3Hz_round2_claim_13_of_15: 15 - frac(beats, 3),
  levelsBelow20: frac(levels, 20), levelsAbove200: levels.filter((l) => l.f >= 200).length,
  folded220: folded, foldedLevels, levelPitchClasses: Object.fromEntries(levelClasses), distinctPitchClassNames: [...classes],
  note: 'folding keeps ratios mod 2, so the chord is the same chord an octave-equivalence class; it is a CREATIVE map and must be captioned so',
};
fs.writeFileSync(new URL('./sonnet2-f-chord.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ beats15: out.beats15.map((b) => b.pair + ':' + b.Hz), levels: out.levels6, counts: out.counts, f20: out.fractionBelow20Hz, f200: out.fractionBelow200Hz, span: out.spanOctaves, min: out.min, max: out.max, folded: folded.map((x) => x.pair + ' ' + x.fold220 + ' ' + x.note), classes: out.distinctPitchClassNames, foldedLevels, levelPitchClasses: out.levelPitchClasses }, null, 1));
