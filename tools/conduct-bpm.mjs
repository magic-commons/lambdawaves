#!/usr/bin/env node
/* tools/conduct-bpm.mjs — 026 A4: a track's TEMPO and its first strong onset, for a SCORE's `tempo.bpm` and `audio.offset`.
 *   node tools/conduct-bpm.mjs <file> [--after SECONDS]
 * ffmpeg → mono PCM at 11025 Hz → log-energy FLUX at 100 Hz → its autocorrelation over 60–200 BPM, each lag scored by the mean over its
 * multiples out to 8 s (a comb: a lag a hair off drifts off the beat, so the tempo resolves to ~0.01 BPM) at a 0.01-frame step; the OCTAVE
 * CHECK takes the doubled tempo (≤ 200) when it scores within 85 % of the winner (checked: clicks at 140 · 128 · 174 · 87 read 139.99 · 128.00 ·
 * 174.01 · 86.96).  The ONSET is the first flux frame above mean + 3 sd (after --after s, default 0);
 * the DROP CANDIDATE is the largest rise of the 1-second energy (after --after).  Prints BPM, the bar at 4/4, the onset and the drop. */
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const file = process.argv[2], after = (() => { const i = process.argv.indexOf('--after'); return i > 0 ? +process.argv[i + 1] || 0 : 0; })();
if (!file) { console.error('usage: node tools/conduct-bpm.mjs <file> [--after SECONDS]'); process.exit(2); }
const SR = 11025, HZ = 100, HOP = SR / HZ, FFMPEG = process.env.FFMPEG || path.join(process.env.HOME, 'bin/ffmpeg');
const buf = execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 's16le', '-'], { maxBuffer: 1 << 30 });
const pcm = new Int16Array(buf.buffer, buf.byteOffset, buf.length >> 1), n = Math.floor(pcm.length / HOP);
const E = new Float64Array(n);
for (let k = 0; k < n; k++) { let s = 0; const a = Math.round(k * HOP), b = Math.round((k + 1) * HOP); for (let i = a; i < b; i++) s += (pcm[i] / 32768) ** 2; E[k] = Math.log(1 + 1000 * s / (b - a)); }
const F = new Float64Array(n); for (let k = 1; k < n; k++) F[k] = Math.max(0, E[k] - E[k - 1]);
const mean = F.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(F.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
/* the flux smoothed (a gaussian, σ 1.5 frames: a click lands between two 10-ms frames), its mean taken out */
const G = [-4, -3, -2, -1, 0, 1, 2, 3, 4].map((d) => Math.exp(-(d * d) / (2 * 1.5 * 1.5))), gs = G.reduce((a, b) => a + b, 0), Z = new Float64Array(n);
for (let k = 0; k < n; k++) { let v = 0; for (let d = -4; d <= 4; d++) v += (F[Math.min(n - 1, Math.max(0, k + d))] - mean) * G[d + 4]; Z[k] = v / gs; }
/* the autocorrelation at a fractional lag (linear interpolation); the COMB is its mean over the lag's multiples out to 8 s, so a lag that is
   a hair off drifts off the beat over thirty-odd beats (the precision), and a doubled tempo is scored on the same footing (the octave check) */
const ac = (L) => { let s = 0; const m = n - Math.ceil(L) - 1; for (let i = 0; i < m; i++) { const j = i + L, j0 = Math.floor(j), f = j - j0; s += Z[i] * (Z[j0] * (1 - f) + Z[j0 + 1] * f); } return s / m; };
const comb = (L) => { let s = 0, c = 0; for (let k = 1; k * L <= 8 * HZ && k * L < n / 2; k++, c++) s += ac(k * L); return c ? s / c : 0; };
const lagOf = (bpm) => HZ * 60 / bpm, bpmOf = (L) => HZ * 60 / L;
const coarse = []; for (let L = lagOf(200); L <= lagOf(60); L += 0.5) coarse.push([L, comb(L)]);
coarse.sort((a, b) => b[1] - a[1]);
const refine = (L0, w = 0.5) => { let b = null; for (let L = L0 - w; L <= L0 + w; L += 0.01) { const s = comb(L); if (!b || s > b.s) b = { L, s }; } return b; };
let best = null; for (const [L0] of coarse.slice(0, 4)) { const r = refine(L0); if (!best || r.s > best.s) best = r; }
const dbl = bpmOf(best.L) * 2 <= 200 ? refine(best.L / 2, 0.25) : null;
if (dbl && dbl.s >= 0.85 * best.s) best = dbl;
const bpm = bpmOf(best.L);
const spb = 60 / bpm, from = Math.round(after * HZ);
let onset = null; for (let k = Math.max(1, from); k < n; k++) if (F[k] > mean + 3 * sd) { onset = k / HZ; break; }
/* the drop: the largest rise of the 1-second mean energy, measured second-to-second */
const W = HZ, avg = (k) => { let s = 0; for (let i = k; i < k + W && i < n; i++) s += E[i]; return s / W; };
let drop = null; for (let k = Math.max(W, from); k + W < n; k += 5) { const r = avg(k) - avg(k - W); if (!drop || r > drop.r) drop = { r, t: k / HZ }; }
console.log(`BPM ${bpm.toFixed(2)} · beat ${spb.toFixed(4)} s · bar (4/4) ${(4 * spb).toFixed(4)} s · ${(n / HZ).toFixed(1)} s analysed`);
console.log(`ONSET ${onset === null ? 'none' : onset.toFixed(2) + ' s'} (the first flux above mean + 3 sd${after ? ' after ' + after + ' s' : ''})`);
if (drop) console.log(`DROP CANDIDATE ${drop.t.toFixed(2)} s (the largest 1-s energy rise${after ? ' after ' + after + ' s' : ''}) · on the beat grid from the onset: ${onset === null ? '—' : (onset + Math.round((drop.t - onset) / spb) * spb).toFixed(2) + ' s'}`);
