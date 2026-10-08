/* timeline/audio-analysis.js — A DROPPED FILE, AS THE KIT'S AUDIO DEVICE WOULD HAVE HEARD IT (harvested from BASINS
 * app/audio-clip.js analyseAudio and audioClipFromFile, 2026-10-05).  PURE at import (node runs analyseAudio on a
 * synthetic tone); decode needs a WebAudio context (audio-playback.js).
 *
 *   analyseAudio(channels: Float32Array[], sampleRate) → { seconds, frames, sampleRate, peaks, envelopes }
 *   audioClipFromFile(file, { bpm, keep, band, store }) → Promise<{ source, seconds, duration }>   decode once, analyse once,
 *                                          keep by content hash; a second drop of the same bytes reuses the analysis
 *   AUDIO_PEAK_RATES, isAudioFile(file), audioBaseName(name)
 *
 * THE ENVELOPE LAW.  The mono mix in 10 ms windows (100 Hz); LEVEL = RMS → audioDbAmp, LOW / MID / HIGH = mean square
 * after RBJ Butterworth biquads (Q = 1/√2) at the live device's edges (modulation/audio-capture.js BANDS: LOW < 250 Hz,
 * MID 250–2000, HIGH > 2000) → audioDbPow; each through the fixed-dB normaliser audioNorm (−60 → 0, −6 dBFS → 1) and the
 * model's own follower (attack · release · hold from AUDIO_FOLLOW_DEFAULTS, audioAlpha at 100 Hz), quantised to Uint8
 * and kept as base64.  Amplitude and power are two different logs: they are not mixed.  The peaks are min/max Int8 at
 * 400 buckets a second, folded by four into 100, 25 and 6.25 (the paint reads the coarsest level that still resolves a
 * device pixel). */
import { AUDIO_FOLLOW_DEFAULTS, audioAlpha, audioDbAmp, audioDbPow, audioNorm } from '../modulation/mod.js';
import { BANDS } from '../modulation/audio-capture.js';
import { toBase64, assets } from '../core/assets.js';
import { t } from '../core/i18n.js';
import { AUDIO_ENV_HZ, AUDIO_BANDS, AUDIO_SECONDS_MAX, envelopeFrames, audioSource } from './audio-kind.js';
import { decodeAudio, rememberAudioBuffer } from './audio-playback.js';

export const AUDIO_PEAK_RATES = [400, 100, 25, 6.25];
export const isAudioFile = (f) => !!f && (/^audio\//.test(f.type) || /\.(wav|mp3|m4a|aac|ogg|oga|opus|flac|webm|aif|aiff)$/i.test(f.name || ''));
export const audioBaseName = (name) => String(name || 'AUDIO').replace(/\.[^.]+$/, '').slice(0, 80).toUpperCase();

function biquad(lowpass, f, sr) {
  const w = 2 * Math.PI * Math.min(f, sr * 0.45) / sr, c = Math.cos(w), a = Math.sin(w) * Math.SQRT1_2, n = 1 + a;
  const b0 = (lowpass ? 1 - c : 1 + c) / 2 / n;
  return { b0, b1: (lowpass ? 1 - c : -(1 + c)) / n, b2: b0, a1: -2 * c / n, a2: (1 - a) / n, x1: 0, x2: 0, y1: 0, y2: 0 };
}
const filter = (f, x) => { const y = f.b0 * x + f.b1 * f.x1 + f.b2 * f.x2 - f.a1 * f.y1 - f.a2 * f.y2; f.x2 = f.x1; f.x1 = x; f.y2 = f.y1; f.y1 = y; return y; };
/* THE MODEL'S FOLLOWER (mod.js audioFollow), one step at AUDIO_ENV_HZ: attack rises, hold keeps a peak, release falls */
function follow(st, target, o) {
  const prev = st.v;
  if (target >= prev) st.hold = o.holdMs; else if (st.hold > 0) { st.hold = Math.max(0, st.hold - 1000 / AUDIO_ENV_HZ); target = prev; }
  const alpha = audioAlpha(target > prev ? o.attackMs : o.releaseMs, AUDIO_ENV_HZ);
  return st.v = alpha > 0 ? alpha * prev + (1 - alpha) * target : target;
}

/** analyseAudio(channels, sampleRate) — one pass over the mono mix: 10 ms windows → LEVEL and three band powers through
 *  the normaliser and the follower, quantised to Uint8; min/max peaks at 400/s, then folded into 100, 25 and 6.25 */
export function analyseAudio(channels, sampleRate) {
  const length = channels[0]?.length || 0, sr = sampleRate, nc = channels.length, k = 1 / Math.max(1, nc);
  const seconds = length / sr, frames = envelopeFrames(seconds), env = AUDIO_BANDS.map(() => new Uint8Array(frames)), st = AUDIO_BANDS.map(() => ({ v: 0, hold: 0 }));
  const lo = biquad(true, BANDS[0].hi, sr), midHi = biquad(false, BANDS[1].lo, sr), midLo = biquad(true, BANDS[1].hi, sr), hi = biquad(false, BANDS[2].lo, sr);
  const r0 = AUDIO_PEAK_RATES[0], buckets = Math.max(1, Math.ceil(seconds * r0)), fine = new Int8Array(buckets * 2);
  let s = 0, bucket = 0, edge = Math.floor(sr / r0), mn = 1, mx = -1;
  for (let f = 0; f < frames; f++) {
    const end = Math.min(length, Math.floor((f + 1) * sr / AUDIO_ENV_HZ)), n = end - s;
    let level = 0, low = 0, mid = 0, high = 0;
    for (; s < end; s++) {
      let m = 0; for (let c = 0; c < nc; c++) m += channels[c][s]; m *= k;
      const a = filter(lo, m), b = filter(midLo, filter(midHi, m)), h = filter(hi, m);
      level += m * m; low += a * a; mid += b * b; high += h * h;
      if (s >= edge) { fine[2 * bucket] = Math.max(-128, Math.floor(mn * 127)); fine[2 * bucket + 1] = Math.min(127, Math.ceil(mx * 127)); bucket++; edge = Math.floor((bucket + 1) * sr / r0); mn = 1; mx = -1; }
      if (m < mn) mn = m; if (m > mx) mx = m;
    }
    const targets = n > 0 ? [audioNorm(audioDbAmp(Math.sqrt(level / n)), 0), audioNorm(audioDbPow(low / n), 0), audioNorm(audioDbPow(mid / n), 0), audioNorm(audioDbPow(high / n), 0)] : [0, 0, 0, 0];
    AUDIO_BANDS.forEach((band, i) => { env[i][f] = Math.round(follow(st[i], targets[i], AUDIO_FOLLOW_DEFAULTS[band]) * 255); });
  }
  if (bucket < buckets && mx >= mn) { fine[2 * bucket] = Math.max(-128, Math.floor(mn * 127)); fine[2 * bucket + 1] = Math.min(127, Math.ceil(mx * 127)); }
  const peaks = [{ rate: r0, data: fine }];
  for (const rate of AUDIO_PEAK_RATES.slice(1)) {
    const src = peaks.at(-1).data, count = Math.ceil(src.length / 8), data = new Int8Array(count * 2);
    for (let j = 0; j < count; j++) { let a = 127, b = -128; for (let q = 4 * j; q < Math.min(4 * j + 4, src.length / 2); q++) { a = Math.min(a, src[2 * q]); b = Math.max(b, src[2 * q + 1]); } data[2 * j] = a; data[2 * j + 1] = b; }
    peaks.push({ rate, data });
  }
  return { seconds, frames, sampleRate: sr, peaks, envelopes: Object.fromEntries(AUDIO_BANDS.map((band, i) => [band, toBase64(env[i])])) };
}

/** audioClipFromFile(file, { bpm, keep, band, store }) — decode once, analyse once, store by hash.  A RangeError carries a
 *  sentence for the person (an empty file, one past 20 minutes); any other failure is a decode failure. */
export async function audioClipFromFile(file, { bpm, keep = false, band = 'level', store = assets } = {}) {
  const bytes = new Uint8Array(await file.arrayBuffer()), id = await store.id(bytes);
  let meta = await store.load(id);
  if (!meta?.envelopes) {
    const buffer = await decodeAudio(bytes);
    if (!(buffer.duration > 0)) throw new RangeError(t("{name} holds no audio.", { name: file.name }));
    if (buffer.duration > AUDIO_SECONDS_MAX) throw new RangeError(t("{name} is longer than {minutes} minutes.", { name: file.name, minutes: AUDIO_SECONDS_MAX / 60 }));
    const a = analyseAudio(Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c)), buffer.sampleRate);
    meta = { id, name: String(file.name || 'audio'), type: String(file.type || ''), seconds: a.seconds, sampleRate: a.sampleRate, channels: buffer.numberOfChannels, peaks: a.peaks, envelopes: a.envelopes };
    await store.put(meta, bytes);
    if (keep) rememberAudioBuffer(id, buffer);
  }
  const source = audioSource(meta, { bpm, keep, band });
  return { source, seconds: meta.seconds, duration: source.length };
}
